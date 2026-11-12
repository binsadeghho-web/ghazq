import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { getPool, isDatabaseConnected } from '../../platform/mysqlDatabase';
import { ensureDomainTablesAndIndexes } from '../../platform/domainTablesSetup';
import { db, generateUUIDv7 } from '../../platform/database';
import { toIdBuffer, fromIdBuffer } from '../../platform/uuidv7';
import { AppError } from '../../platform/errors';
import { outbox } from '../../platform/outbox';
import { auditChain } from '../../platform/auditChain';
import { getCurrentUser, registerSessionToken } from '../../platform/sessionAuth';
import { issueAccessToken, issueRefreshToken } from '../../platform/jwtService';
import { normalizeDigits } from '../../platform/persianNormalizer';
import { userRepository } from '../user/userRepository';
import { sanitizeUserForApi } from '../admin/adminModule';
import {
  UserRole,
  AppSectionId,
  PermissionAccessLevel,
  RoleAccessPolicy,
  UserSectionPermissions,
  RoleSubSectionPermissions,
} from '../../../types';
import { DEFAULT_ROLE_POLICIES } from '../../../utils/rbacPolicy';

// Server-side in-memory cache of role policies backed by MySQL `role_access_policies`
let serverRolePoliciesCache: Record<string, RoleAccessPolicy> = { ...DEFAULT_ROLE_POLICIES };
let policiesLoadedFromDb = false;

export function getRolePoliciesCache(): Record<string, RoleAccessPolicy> {
  return serverRolePoliciesCache;
}

export async function loadAndEnsureRolePolicies(): Promise<Record<string, RoleAccessPolicy>> {
  await ensureDomainTablesAndIndexes();
  if (!isDatabaseConnected()) {
    return serverRolePoliciesCache;
  }

  const p = getPool();
  try {
    const [rows]: any = await p.query(`SELECT * FROM role_access_policies`);
    const existingMap = new Map<string, any>();
    for (const r of rows || []) {
      existingMap.set(r.role_id, r);
    }

    // Seed any missing roles from DEFAULT_ROLE_POLICIES
    for (const [roleId, defPolicy] of Object.entries(DEFAULT_ROLE_POLICIES)) {
      if (!existingMap.has(roleId)) {
        await p.query(
          `INSERT IGNORE INTO role_access_policies
           (role_id, role_title, section_permissions, sub_section_permissions, is_read_only, version, updated_by)
           VALUES (?, ?, ?, ?, ?, 1, 'system')`,
          [
            roleId,
            defPolicy.roleTitle,
            JSON.stringify(defPolicy.sectionPermissions || {}),
            JSON.stringify(defPolicy.subSectionPermissions || {}),
            defPolicy.isReadOnlyRole ? 1 : 0,
          ]
        );
      } else {
        const dbRow = existingMap.get(roleId);
        let parsedSections: UserSectionPermissions = {};
        let parsedSubSections: RoleSubSectionPermissions = {};
        try {
          parsedSections = typeof dbRow.section_permissions === 'string'
            ? JSON.parse(dbRow.section_permissions)
            : (dbRow.section_permissions || {});
        } catch {}
        try {
          parsedSubSections = typeof dbRow.sub_section_permissions === 'string'
            ? JSON.parse(dbRow.sub_section_permissions)
            : (dbRow.sub_section_permissions || {});
        } catch {}

        serverRolePoliciesCache[roleId] = {
          ...defPolicy,
          roleId: roleId as UserRole,
          roleTitle: dbRow.role_title || defPolicy.roleTitle,
          isReadOnlyRole: Boolean(dbRow.is_read_only),
          sectionPermissions: {
            ...defPolicy.sectionPermissions,
            ...parsedSections,
          },
          subSectionPermissions: {
            ...defPolicy.subSectionPermissions,
            ...parsedSubSections,
          },
          version: Number(dbRow.version || 1),
          updatedBy: dbRow.updated_by || 'مدیر سامانه',
          updatedAt: dbRow.updated_at ? new Date(dbRow.updated_at).toISOString() : undefined,
        };
      }
    }

    policiesLoadedFromDb = true;
  } catch {
    // Fallback to in-memory cache
  }

  return serverRolePoliciesCache;
}

export function getServerEffectivePermission(
  user: any,
  sectionId: AppSectionId
): PermissionAccessLevel {
  if (!user) return 'none';
  const role: UserRole = user.role || 'alumni';
  if (role === 'admin' || role === 'super_admin') return 'manage_all';

  const rolePolicy = serverRolePoliciesCache[role] || DEFAULT_ROLE_POLICIES[role] || DEFAULT_ROLE_POLICIES.alumni;
  const userOverrides: UserSectionPermissions = user.sectionPermissions || {};

  let perm: PermissionAccessLevel =
    userOverrides[sectionId] ||
    rolePolicy?.sectionPermissions?.[sectionId] ||
    DEFAULT_ROLE_POLICIES[role]?.sectionPermissions?.[sectionId] ||
    'none';

  return perm;
}

/**
 * Global Server-Side RBAC & ABAC Enforcement Middleware
 * Mounted on `/api` after `sessionAuthMiddleware`.
 */
export async function rbacEnforcementMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!policiesLoadedFromDb && isDatabaseConnected()) {
      await loadAndEnsureRolePolicies();
    }

    const subPath = req.path || '';

    // 1. Public / Auth / Real-time Event stream routes bypass section guard
    if (
      subPath.startsWith('/auth') ||
      subPath.startsWith('/events') ||
      subPath === '/rbac/policies' ||
      subPath === '/rbac/register-customer' ||
      subPath.startsWith('/dashboard/widgets-data')
    ) {
      return next();
    }

    const user = (req as any).user;
    if (!user) {
      return next();
    }

    const isMutation = req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS';

    // 2. Super Admin has full access to all endpoints
    if (user.role === 'admin' || user.role === 'super_admin') {
      return next();
    }

    // 4. Map API route prefix to AppSectionId
    let targetSection: AppSectionId | null = null;
    if (subPath.startsWith('/cartable')) targetSection = 'cartable';
    else if (subPath.startsWith('/courses')) targetSection = 'courses';
    else if (subPath.startsWith('/products')) targetSection = 'products';
    else if (subPath.startsWith('/counseling')) targetSection = 'counseling';
    else if (subPath.startsWith('/research')) targetSection = 'research';
    else if (subPath.startsWith('/rulings')) targetSection = 'rulings';
    else if (subPath.startsWith('/welfare')) targetSection = 'welfare';
    else if (subPath.startsWith('/synergy')) targetSection = 'synergy';
    else if (subPath.startsWith('/dashboard')) targetSection = 'dashboard';
    else if (subPath.startsWith('/ops')) targetSection = 'admin';
    else if (subPath.startsWith('/admin/users')) targetSection = 'users';

    if (targetSection) {
      const effectivePerm = getServerEffectivePermission(user, targetSection);

      // Special exception: if an organizational user is viewing `/admin/users` because they have access to `alumni` directory
      const canAlsoAccessViaAlumni =
        targetSection === 'users' &&
        !isMutation &&
        getServerEffectivePermission(user, 'alumni') !== 'none';

      if (effectivePerm === 'none' && !canAlsoAccessViaAlumni) {
        res.status(403).json({
          type: 'forbidden',
          title: 'عدم دسترسی به بخش',
          status: 403,
          detail: `دسترسی به بخش «${targetSection}» برای نقش یا حساب کاربری شما غیرفعال شده است.`,
          code: 'SECTION_ACCESS_DENIED',
        });
        return;
      }

      if (isMutation && (effectivePerm === 'view_all' || effectivePerm === 'view_own')) {
        res.status(403).json({
          type: 'forbidden',
          title: 'دسترسی صرفاً مشاهده',
          status: 403,
          detail: 'سطح دسترسی شما در این بخش «فقط مشاهده» است و مجاز به ایجاد یا ویرایش اطلاعات نیستید.',
          code: 'SECTION_READ_ONLY',
        });
        return;
      }
    }

    // 5. Granular Welfare Sub-Section Enforcement for Customers & Alumni
    if (subPath.startsWith('/welfare')) {
      const rolePolicy = serverRolePoliciesCache[user.role] || DEFAULT_ROLE_POLICIES[user.role as UserRole];
      const subPerms = rolePolicy?.subSectionPermissions;
      if (subPerms) {
        if (subPath.includes('/requests')) {
          const reqType = (req.method === 'GET' ? req.query?.type : req.body?.type) as string | undefined;
          if (reqType === 'loan' && subPerms.welfare_loans === false) {
            res.status(403).json({
              type: 'forbidden',
              title: 'عدم دسترسی به تسهیلات وام',
              status: 403,
              detail: 'دسترسی به بخش و درخواست وام قرض‌الحسنه برای گروه کاربری شما غیرفعال است.',
              code: 'WELFARE_LOAN_DISABLED',
            });
            return;
          }
          if (reqType === 'accommodation' && subPerms.welfare_accommodations === false) {
            res.status(403).json({
              type: 'forbidden',
              title: 'عدم دسترسی به اسکان زیارتی',
              status: 403,
              detail: 'دسترسی به بخش و رزرو اسکان و اقامتگاه برای گروه کاربری شما غیرفعال است.',
              code: 'WELFARE_ACCOMMODATION_DISABLED',
            });
            return;
          }
        }
        if ((subPath.includes('/orders') || subPath.includes('/consumables')) && subPerms.welfare_cooperative === false) {
          res.status(403).json({
            type: 'forbidden',
            title: 'عدم دسترسی به تعاونی مصرف',
            status: 403,
            detail: 'دسترسی به بخش و سفارش اقلام تعاونی برای گروه کاربری شما غیرفعال است.',
            code: 'WELFARE_COOPERATIVE_DISABLED',
          });
          return;
        }
      }
    }

    next();
  } catch (err) {
    next(err);
  }
}

export function createRbacRouter(): Router {
  const router = Router();

  /**
   * GET /api/rbac/policies
   * Returns all 9 role policies + customer visibility state for courses, products, and consumables.
   */
  router.get('/policies', async (_req: Request, res: Response, next) => {
    try {
      const policies = await loadAndEnsureRolePolicies();

      let coursesVis: any[] = [];
      let productsVis: any[] = [];
      let consumablesVis: any[] = [];

      if (isDatabaseConnected()) {
        const p = getPool();
        try {
          const [cRows]: any = await p.query(
            `SELECT id, title, instructor, price, visible_to_customer FROM courses WHERE is_deleted = 0 ORDER BY created_at DESC`
          );
          coursesVis = (cRows || []).map((r: any) => ({
            id: Buffer.isBuffer(r.id) ? fromIdBuffer(r.id) : String(r.id),
            title: r.title,
            instructor: r.instructor || '',
            price: Number(r.price || 0),
            visibleToCustomer: r.visible_to_customer !== undefined ? Boolean(r.visible_to_customer) : true,
          }));
        } catch {}

        try {
          const [pRows]: any = await p.query(
            `SELECT id, title, format_title, price, visible_to_customer FROM products WHERE is_deleted = 0 ORDER BY created_at DESC`
          );
          productsVis = (pRows || []).map((r: any) => ({
            id: Buffer.isBuffer(r.id) ? fromIdBuffer(r.id) : String(r.id),
            title: r.title,
            formatTitle: r.format_title || 'کتاب / محصول',
            price: Number(r.price || 0),
            visibleToCustomer: r.visible_to_customer !== undefined ? Boolean(r.visible_to_customer) : true,
          }));
        } catch {}

        try {
          const [wRows]: any = await p.query(
            `SELECT id, title, category, cooperative_price, visible_to_customer FROM consumables ORDER BY created_at DESC`
          );
          consumablesVis = (wRows || []).map((r: any) => ({
            id: Buffer.isBuffer(r.id) ? fromIdBuffer(r.id) : String(r.id),
            title: r.title,
            category: r.category || 'عمومی',
            cooperativePrice: Number(r.cooperative_price || 0),
            visibleToCustomer: r.visible_to_customer !== undefined ? Boolean(r.visible_to_customer) : true,
          }));
        } catch {}
      }

      if (coursesVis.length === 0) {
        coursesVis = (db.courses || []).filter(c => !c.isDeleted).map(c => ({
          id: c.id,
          title: c.title,
          instructor: c.instructor,
          price: c.price,
          visibleToCustomer: c.visibleToCustomer !== false,
        }));
      }
      if (productsVis.length === 0) {
        productsVis = (db.products || []).filter(p => !p.isDeleted).map(pr => ({
          id: pr.id,
          title: pr.title,
          formatTitle: pr.formatTitle,
          price: pr.price,
          visibleToCustomer: pr.visibleToCustomer !== false,
        }));
      }
      if (consumablesVis.length === 0) {
        consumablesVis = (db.consumables || []).map(item => ({
          id: item.id,
          title: item.title,
          category: item.category,
          cooperativePrice: item.cooperativePrice,
          visibleToCustomer: item.visibleToCustomer !== false,
        }));
      }

      res.json({
        success: true,
        policies,
        customerVisibility: {
          courses: coursesVis,
          products: productsVis,
          consumables: consumablesVis,
        },
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * PUT /api/rbac/policies/:roleId
   * Updates sectionPermissions and subSectionPermissions for a specific role.
   * - Super Admin ('admin' / 'super_admin') can update any role (including restricting 'alumni_manager' or 'research_deputy').
   * - Alumni Manager ('alumni_manager') can update 'alumni' and 'customer' policies.
   */
  router.put('/policies/:roleId', async (req: Request, res: Response, next) => {
    try {
      const actor = getCurrentUser(req);
      const roleId = req.params.roleId as UserRole;
      const isSuperAdmin = actor.role === 'admin' || actor.role === 'super_admin';
      const isAlumniManager = actor.role === 'alumni_manager';

      if (!isSuperAdmin && !isAlumniManager) {
        throw AppError.forbidden('فقط ادمین اصلی (سوپر ادمین) و مدیر دانش‌آموختگان مجاز به تنظیم سطوح دسترسی نقش‌ها هستند.');
      }

      if (isAlumniManager && roleId !== 'alumni' && roleId !== 'customer') {
        throw AppError.forbidden('مدیر دانش‌آموختگان صرفاً مجاز به تنظیم دسترسی بخش‌های «دانش‌آموختگان» و «کاربران مشتری» است. تغییر دسترسی مدیران در انحصار سوپر ادمین است.');
      }

      if (roleId === 'admin' || roleId === 'super_admin') {
        throw AppError.badRequest('سطح دسترسی ادمین اصلی (سوپر ادمین) کامل است و قابل محدودسازی نمی‌باشد.');
      }

      await loadAndEnsureRolePolicies();
      const currentPolicy = serverRolePoliciesCache[roleId] || DEFAULT_ROLE_POLICIES[roleId];
      if (!currentPolicy) {
        throw AppError.notFound('نقش سازمانی');
      }

      const { sectionPermissions, subSectionPermissions } = req.body || {};

      let nextSections: UserSectionPermissions = {
        ...currentPolicy.sectionPermissions,
        ...(sectionPermissions || {}),
      };

      const nextSubSections: RoleSubSectionPermissions = {
        ...currentPolicy.subSectionPermissions,
        ...(subSectionPermissions || {}),
      };

      const nextVersion = (currentPolicy.version || 1) + 1;

      if (isDatabaseConnected()) {
        const p = getPool();
        await p.query(
          `INSERT INTO role_access_policies
           (role_id, role_title, section_permissions, sub_section_permissions, is_read_only, version, updated_by)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             section_permissions = VALUES(section_permissions),
             sub_section_permissions = VALUES(sub_section_permissions),
             version = version + 1,
             updated_by = VALUES(updated_by)`,
          [
            roleId,
            currentPolicy.roleTitle,
            JSON.stringify(nextSections),
            JSON.stringify(nextSubSections),
            currentPolicy.isReadOnlyRole ? 1 : 0,
            nextVersion,
            actor.fullName,
          ]
        );

        // Also update users of this role in MySQL who don't have custom overrides or sync their role permissions
        try {
          await p.query(
            `UPDATE users SET section_permissions = ?, version = version + 1 WHERE role = ?`,
            [JSON.stringify(nextSections), roleId]
          );
        } catch {}
      }

      const updatedPolicy: RoleAccessPolicy = {
        ...currentPolicy,
        sectionPermissions: nextSections,
        subSectionPermissions: nextSubSections,
        version: nextVersion,
        updatedBy: actor.fullName,
        updatedAt: new Date().toISOString(),
      };
      serverRolePoliciesCache[roleId] = updatedPolicy;

      // Broadcast real-time SSE event so all online users' menus update in <100ms without refresh
      outbox.enqueue('rbac.policy_updated', {
        resourceId: roleId,
        version: nextVersion,
        updates: updatedPolicy,
      });
      outbox.enqueue('rbac.permissions_updated', {
        targetType: 'role',
        roleId,
        version: nextVersion,
        policy: updatedPolicy,
      });

      auditChain.appendEntry({
        eventType: 'ROLE_CHANGED',
        actorId: actor.id,
        actorName: actor.fullName,
        actorRole: actor.role,
        ip: req.ip || '127.0.0.1',
        details: `ماتریس سطح دسترسی نقش «${currentPolicy.roleTitle}» (${roleId}) توسط ${actor.fullName} به‌روزرسانی شد.`,
        severity: 'warning',
      });

      res.json({
        success: true,
        policy: updatedPolicy,
        policies: serverRolePoliciesCache,
        message: `سطح دسترسی نقش «${currentPolicy.roleTitle}» با موفقیت در دیتابیس ذخیره و به صورت بلادرنگ اعمال گردید.`,
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * PATCH /api/rbac/customer-item-visibility
   * Toggles whether a specific Course, Product, or Welfare Consumable is visible/purchasable by 'customer' users.
   * Accessible by Super Admin ('admin'/'super_admin') and Alumni Manager ('alumni_manager').
   */
  router.patch('/customer-item-visibility', async (req: Request, res: Response, next) => {
    try {
      const actor = getCurrentUser(req);
      if (
        actor.role !== 'admin' &&
        actor.role !== 'super_admin' &&
        actor.role !== 'alumni_manager'
      ) {
        throw AppError.forbidden('فقط سوپر ادمین و مدیر دانش‌آموختگان مجاز به تعیین اقلام قابل مشاهده برای کاربران مشتری هستند.');
      }

      const { entityType, itemId, visibleToCustomer } = req.body || {};
      if (!entityType || !itemId || typeof visibleToCustomer !== 'boolean') {
        throw AppError.badRequest('مشخصات آیتم و وضعیت نمایش برای مشتری الزامی است.');
      }

      const visFlag = visibleToCustomer ? 1 : 0;

      if (isDatabaseConnected()) {
        const p = getPool();
        const idBuf = toIdBuffer(itemId);
        if (entityType === 'course') {
          await p.query(
            `UPDATE courses SET visible_to_customer = ?, version = version + 1 WHERE id = ?`,
            [visFlag, idBuf]
          );
        } else if (entityType === 'product') {
          await p.query(
            `UPDATE products SET visible_to_customer = ?, version = version + 1 WHERE id = ?`,
            [visFlag, idBuf]
          );
        } else if (entityType === 'consumable') {
          await p.query(
            `UPDATE consumables SET visible_to_customer = ? WHERE id = ?`,
            [visFlag, idBuf]
          );
        }
      }

      // Update in-memory fallback db as well
      if (entityType === 'course') {
        const target = db.courses.find(c => c.id === itemId);
        if (target) target.visibleToCustomer = visibleToCustomer;
        outbox.enqueue('course.updated', {
          resourceId: itemId,
          updates: { id: itemId, visibleToCustomer },
        });
      } else if (entityType === 'product') {
        const target = db.products.find(pr => pr.id === itemId);
        if (target) target.visibleToCustomer = visibleToCustomer;
        outbox.enqueue('product.updated', {
          resourceId: itemId,
          updates: { id: itemId, visibleToCustomer },
        });
      } else if (entityType === 'consumable') {
        const target = db.consumables.find(w => w.id === itemId);
        if (target) target.visibleToCustomer = visibleToCustomer;
        outbox.enqueue('welfare.consumable_updated', {
          resourceId: itemId,
          updates: { id: itemId, visibleToCustomer },
        });
      }

      outbox.enqueue('rbac.item_visibility_updated', {
        entityType,
        itemId,
        visibleToCustomer,
      });
      outbox.enqueue('rbac.permissions_updated', {
        targetType: 'customer_item_visibility',
        entityType,
        itemId,
        visibleToCustomer,
      });

      res.json({
        success: true,
        entityType,
        itemId,
        visibleToCustomer,
        message: `وضعیت نمایش آیتم برای کاربران مشتری به «${visibleToCustomer ? 'قابل مشاهده و خرید' : 'مخفی برای مشتری'}» تغییر یافت.`,
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * POST /api/rbac/bulk-assign-role
   * Assigns one of the 9 roles to multiple users simultaneously.
   */
  router.post('/bulk-assign-role', async (req: Request, res: Response, next) => {
    try {
      const actor = getCurrentUser(req);
      const isSuperAdmin = actor.role === 'admin' || actor.role === 'super_admin';
      const isAlumniManager = actor.role === 'alumni_manager';

      if (!isSuperAdmin && !isAlumniManager) {
        throw AppError.forbidden('فقط سوپر ادمین و مدیر دانش‌آموختگان مجاز به تخصیص گروهی نقش‌ها هستند.');
      }

      const { userIds, role, roleTitle, applyRoleDefaultPermissions } = req.body || {};
      if (!Array.isArray(userIds) || userIds.length === 0 || !role) {
        throw AppError.badRequest('انتخاب حداقل یک کاربر و نقش مقصد الزامی است.');
      }

      if (!isSuperAdmin && role !== 'alumni' && role !== 'customer') {
        throw AppError.forbidden('مدیر دانش‌آموختگان صرفاً مجاز به تخصیص نقش‌های «دانش‌آموخته» و «کاربر مشتری» است.');
      }

      await loadAndEnsureRolePolicies();
      const targetPolicy = serverRolePoliciesCache[role] || DEFAULT_ROLE_POLICIES[role as UserRole] || DEFAULT_ROLE_POLICIES.alumni;
      const resolvedTitle = roleTitle || targetPolicy.roleTitle;

      let updatedCount = 0;
      for (const uid of userIds) {
        const targetUser = await userRepository.findById(uid);
        if (!targetUser) continue;

        // Prevent non-super-admin from modifying a super admin
        if (!isSuperAdmin && (targetUser.role === 'admin' || targetUser.role === 'super_admin')) {
          continue;
        }

        const updates: any = {
          role: role as UserRole,
          roleTitle: resolvedTitle,
          tokenVersionIncrement: true,
        };
        if (applyRoleDefaultPermissions !== false) {
          updates.sectionPermissions = targetPolicy.sectionPermissions;
        }

        const updated = await userRepository.updateUserOptimistic(uid, updates, targetUser.version || 1);
        updatedCount++;

        outbox.enqueue('user.updated', {
          resourceId: uid,
          version: updated.version,
          updates: sanitizeUserForApi(updated),
        });
      }

      outbox.enqueue('rbac.permissions_updated', {
        targetType: 'bulk_users',
        userIds,
        role,
      });

      res.json({
        success: true,
        updatedCount,
        message: `نقش «${resolvedTitle}» با موفقیت به ${updatedCount} کاربر اختصاص یافت.`,
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * POST /api/rbac/register-customer
   * Simple Registration for Customer Users (ثبت‌نام ساده کاربران مشتری)
   */
  router.post('/register-customer', async (req: Request, res: Response, next) => {
    try {
      const { fullName, nationalId: rawNid, phone: rawPhone, password: rawPassword, organization } = req.body || {};

      const nationalId = normalizeDigits(String(rawNid || '')).trim();
      const phone = normalizeDigits(String(rawPhone || '')).trim();
      const password = normalizeDigits(String(rawPassword || phone)).trim();

      if (!fullName || String(fullName).trim().length < 2) {
        throw AppError.badRequest('نام و نام خانوادگی باید حداقل ۲ کاراکتر باشد.');
      }
      if (!nationalId || nationalId.length < 5) {
        throw AppError.badRequest('کد ملی یا شناسه کاربری معتبر وارد نمایید.');
      }
      if (!phone || phone.length < 8) {
        throw AppError.badRequest('شماره تلفن همراه معتبر وارد نمایید.');
      }
      if (!password || password.length < 4) {
        throw AppError.badRequest('رمز عبور باید حداقل ۴ کاراکتر باشد.');
      }

      const existing = await userRepository.findByNationalIdOrUsername(nationalId);
      if (existing) {
        throw AppError.badRequest('این کد ملی یا شماره کاربری قبلاً در سامانه ثبت شده است. لطفاً از بخش ورود اقدام فرمایید.');
      }

      await loadAndEnsureRolePolicies();
      const customerPolicy = serverRolePoliciesCache.customer || DEFAULT_ROLE_POLICIES.customer;
      const passwordHash = bcrypt.hashSync(password, 10);
      const id = generateUUIDv7();

      const createdUser = await userRepository.createUser({
        id,
        nationalId,
        username: nationalId,
        passwordHash,
        fullName: String(fullName).trim(),
        phone,
        role: 'customer',
        roleTitle: 'کاربر مشتری (متقاضی دوره‌ها و انتشارات)',
        siteTitle: 'کاربر مشتری',
        organization: organization ? String(organization).trim() : 'کاربر عمومی / متقاضی آزاد',
        graduationYear: '۱۴۰۳',
        mustChangePassword: false,
      });

      const updatedWithPerms = await userRepository.updateUserOptimistic(
        createdUser.id,
        {
          sectionPermissions: customerPolicy.sectionPermissions,
        } as any,
        createdUser.version || 1
      );

      const sessionId = generateUUIDv7();
      const accessToken = issueAccessToken(updatedWithPerms, sessionId, 15 * 60);
      const refreshTokenObj = await issueRefreshToken(updatedWithPerms.id, undefined, undefined);
      registerSessionToken(sessionId, updatedWithPerms, sessionId);

      outbox.enqueue('user.created', {
        resourceId: updatedWithPerms.id,
        version: updatedWithPerms.version,
        updates: sanitizeUserForApi(updatedWithPerms),
      });

      auditChain.appendEntry({
        eventType: 'USER_CREATED',
        actorId: updatedWithPerms.id,
        actorName: updatedWithPerms.fullName,
        actorRole: 'customer',
        ip: req.ip || '127.0.0.1',
        details: `ثبت‌نام ساده کاربر مشتری جدید: ${updatedWithPerms.fullName} (${updatedWithPerms.nationalId})`,
        severity: 'info',
      });

      res.status(201).json({
        success: true,
        user: sanitizeUserForApi(updatedWithPerms),
        token: accessToken,
        accessToken,
        refreshToken: refreshTokenObj.rawToken,
        message: 'حساب کاربری مشتری با موفقیت ایجاد شد.',
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
