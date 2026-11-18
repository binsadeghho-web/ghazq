import { Router, Request, Response } from 'express';
import { getPool, selectWithTimeout, ensureDatabaseConnection } from '../../platform/mysqlDatabase';
import { ensureDomainTablesAndIndexes } from '../../platform/domainTablesSetup';
import { AppError } from '../../platform/errors';
import { AuthorizationPolicy } from '../../platform/authorization';
import { getCurrentUser } from '../../platform/sessionAuth';
import { generateUUIDv7, toIdBuffer, fromIdBuffer } from '../../platform/uuidv7';
import { extractExpectedVersion } from '../../platform/httpUtils';
import { outbox } from '../../platform/outbox';
import { auditChain } from '../../platform/auditChain';
import { CourseDiscountCode, CourseDiscountUsage, CourseDiscountCategory } from '../../../types';

function parseJsonSafe<T>(val: any, fallback: T): T {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') {
    try {
      return JSON.parse(val);
    } catch {
      return fallback;
    }
  }
  return val as T;
}

export function mapDiscountRow(row: any): CourseDiscountCode {
  const maxUses = row.max_uses !== null && row.max_uses !== undefined ? Number(row.max_uses) : null;
  const usedCount = Number(row.used_count || 0);
  const remainingUses = maxUses !== null ? Math.max(0, maxUses - usedCount) : null;

  return {
    id: fromIdBuffer(row.id),
    code: row.code,
    title: row.title,
    description: row.description || undefined,
    discountCategory: (row.discount_category || 'percentage') as CourseDiscountCategory,
    valueType: (row.value_type || 'percent') as 'percent' | 'fixed',
    discountValue: Number(row.discount_value || 0),
    maxDiscountAmount: row.max_discount_amount !== null && row.max_discount_amount !== undefined ? Number(row.max_discount_amount) : null,
    minPurchaseAmount: Number(row.min_purchase_amount || 0),
    courseId: row.course_id ? fromIdBuffer(row.course_id) : null,
    courseIds: parseJsonSafe<string[]>(row.course_ids, []),
    targetAudiences: parseJsonSafe<string[]>(row.target_audiences, []),
    allowedNationalIds: parseJsonSafe<string[]>(row.allowed_national_ids, []),
    maxUses,
    perUserLimit: Number(row.per_user_limit || 1),
    usedCount,
    remainingUses,
    startsAt: row.starts_at ? new Date(row.starts_at).toISOString() : null,
    expiresAt: row.expires_at ? new Date(row.expires_at).toISOString() : null,
    startsAtJalali: row.starts_at_jalali || undefined,
    expiresAtJalali: row.expires_at_jalali || undefined,
    isActive: Boolean(row.is_active),
    createdByName: row.created_by_name || undefined,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
    version: Number(row.version || 1),
  };
}

export function mapDiscountUsageRow(row: any): CourseDiscountUsage {
  return {
    id: fromIdBuffer(row.id),
    discountId: fromIdBuffer(row.discount_id),
    code: row.code,
    courseId: fromIdBuffer(row.course_id),
    courseTitle: row.course_title,
    enrollmentId: row.enrollment_id ? fromIdBuffer(row.enrollment_id) : undefined,
    userId: fromIdBuffer(row.user_id),
    userName: row.user_name,
    userNationalId: row.user_national_id || undefined,
    userPhone: row.user_phone || undefined,
    originalAmount: Number(row.original_amount || 0),
    discountAmount: Number(row.discount_amount || 0),
    finalAmount: Number(row.final_amount || 0),
    usedAt: row.used_at ? new Date(row.used_at).toISOString() : new Date().toISOString(),
  };
}

export interface DiscountValidationResult {
  valid: boolean;
  discountCode: CourseDiscountCode;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
}

/**
 * Validates and computes discount for a user + course (reusable in preview & atomic checkout transaction).
 */
export async function validateDiscountForCourse(params: {
  code: string;
  courseId: string;
  coursePrice: number;
  courseTargetAudiences?: string[];
  userId: string;
  userNationalId?: string;
  userRole?: string;
}): Promise<DiscountValidationResult> {
  ensureDatabaseConnection();
  const normalizedCode = String(params.code || '').trim().toUpperCase();
  if (!normalizedCode) {
    throw AppError.badRequest('کد تخفیف وارد نشده است.', 'DISCOUNT_CODE_EMPTY');
  }

  const rows = await selectWithTimeout<any>(
    `SELECT * FROM course_discount_codes WHERE UPPER(code) = ? AND deleted_at IS NULL LIMIT 1`,
    [normalizedCode],
    3000
  );
  if (!rows || rows.length === 0) {
    throw AppError.notFound('کد تخفیف واردشده در سامانه یافت نشد');
  }

  const discount = mapDiscountRow(rows[0]);
  if (!discount.isActive) {
    throw AppError.badRequest('این کد تخفیف توسط مدیریت غیرفعال شده است.', 'DISCOUNT_INACTIVE');
  }

  const now = Date.now();
  if (discount.startsAt && new Date(discount.startsAt).getTime() > now) {
    throw AppError.badRequest('زمان شروع استفاده از این کد تخفیف هنوز فرا نرسیده است.', 'DISCOUNT_NOT_STARTED');
  }
  if (discount.expiresAt && new Date(discount.expiresAt).getTime() < now) {
    throw AppError.badRequest('مهلت زمانی استفاده از این کد تخفیف به پایان رسیده است.', 'DISCOUNT_EXPIRED');
  }

  if (discount.maxUses !== null && discount.maxUses !== undefined && discount.usedCount >= discount.maxUses) {
    throw AppError.conflict('سقف تعداد دفعات مجاز استفاده از این کد تخفیف تکمیل شده است.', 'DISCOUNT_LIMIT_REACHED');
  }

  // Course eligibility checks
  if (discount.discountCategory === 'single_course' && discount.courseId && discount.courseId !== params.courseId) {
    throw AppError.badRequest('این کد تخفیف صرفاً برای دوره مشخص‌شده دیگری معتبر است.', 'DISCOUNT_COURSE_MISMATCH');
  }
  if (
    discount.discountCategory === 'multi_course' &&
    discount.courseIds &&
    discount.courseIds.length > 0 &&
    !discount.courseIds.includes(params.courseId)
  ) {
    throw AppError.badRequest('این کد تخفیف شامل دوره انتخابی شما نمی‌شود.', 'DISCOUNT_COURSE_MISMATCH');
  }
  if (
    discount.courseId &&
    discount.discountCategory !== 'all_courses' &&
    (!discount.courseIds || discount.courseIds.length === 0) &&
    discount.courseId !== params.courseId
  ) {
    throw AppError.badRequest('این کد تخفیف متعلق به دوره دیگری است.', 'DISCOUNT_COURSE_MISMATCH');
  }

  // User-specific nationalId check
  if (
    discount.discountCategory === 'user_specific' &&
    discount.allowedNationalIds &&
    discount.allowedNationalIds.length > 0
  ) {
    const nid = String(params.userNationalId || '').trim();
    if (!nid || !discount.allowedNationalIds.includes(nid)) {
      throw AppError.forbidden('این کد تخفیف اختصاصی است و برای کد ملی شما تعریف نشده است.');
    }
  }

  // Audience-specific check
  if (
    discount.discountCategory === 'audience_specific' &&
    discount.targetAudiences &&
    discount.targetAudiences.length > 0 &&
    params.courseTargetAudiences &&
    params.courseTargetAudiences.length > 0
  ) {
    const hasOverlap = discount.targetAudiences.some(a => params.courseTargetAudiences!.includes(a));
    if (!hasOverlap && params.userRole !== 'admin' && params.userRole !== 'supervisor') {
      throw AppError.badRequest(
        `این کد تخفیف ویژه مخاطبان (${discount.targetAudiences.join('، ')}) تعریف شده است و با گروه مخاطبان دوره مطابقت ندارد.`,
        'DISCOUNT_AUDIENCE_MISMATCH'
      );
    }
  }

  // Per-user usage count check
  const uBuf = toIdBuffer(params.userId);
  const dBuf = toIdBuffer(discount.id);
  const usageRows = await selectWithTimeout<any>(
    `SELECT COUNT(*) as cnt FROM course_discount_usages WHERE discount_id = ? AND (user_id = ? OR user_id = ?)`,
    [dBuf, uBuf, params.userId],
    3000
  );
  const userUsageCount = Number(usageRows?.[0]?.cnt || 0);
  if (userUsageCount >= (discount.perUserLimit || 1)) {
    throw AppError.conflict('شما قبلاً از این کد تخفیف به حداکثر دفعات مجاز استفاده کرده‌اید.', 'DISCOUNT_USER_LIMIT_REACHED');
  }

  const originalAmount = Math.max(0, Number(params.coursePrice || 0));
  if (discount.minPurchaseAmount && originalAmount < discount.minPurchaseAmount) {
    throw AppError.badRequest(
      `حداقل مبلغ دوره برای اعمال این کد تخفیف ${discount.minPurchaseAmount.toLocaleString('fa-IR')} تومان است.`,
      'DISCOUNT_MIN_PURCHASE_NOT_MET'
    );
  }

  let discountAmount = 0;
  if (discount.valueType === 'percent') {
    discountAmount = Math.round((originalAmount * Math.min(100, Math.max(0, discount.discountValue))) / 100);
    if (discount.maxDiscountAmount && discount.maxDiscountAmount > 0) {
      discountAmount = Math.min(discountAmount, discount.maxDiscountAmount);
    }
  } else {
    discountAmount = Math.min(originalAmount, Math.max(0, discount.discountValue));
  }

  const finalAmount = Math.max(0, originalAmount - discountAmount);

  return {
    valid: true,
    discountCode: discount,
    originalAmount,
    discountAmount,
    finalAmount,
  };
}

export function registerCourseDiscountsRoutes(router: Router): void {
  // List all discount codes (Admin/Supervisor)
  router.get('/discounts', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const user = getCurrentUser(req);
      AuthorizationPolicy.requireRole({ userId: user.id, role: user.role, fullName: user.fullName }, ['admin', 'supervisor']);

      const rows = await selectWithTimeout<any>(
        `SELECT * FROM course_discount_codes WHERE deleted_at IS NULL ORDER BY created_at DESC`,
        [],
        4000
      );
      const codes = (rows || []).map(mapDiscountRow);

      if (req.query.includeUsages === 'true' && codes.length > 0) {
        const uRows = await selectWithTimeout<any>(
          `SELECT * FROM course_discount_usages ORDER BY used_at DESC LIMIT 1000`,
          [],
          4000
        );
        const usagesByDiscount = new Map<string, CourseDiscountUsage[]>();
        for (const ur of uRows || []) {
          const mapped = mapDiscountUsageRow(ur);
          const list = usagesByDiscount.get(mapped.discountId) || [];
          list.push(mapped);
          usagesByDiscount.set(mapped.discountId, list);
        }
        codes.forEach(c => {
          c.usages = usagesByDiscount.get(c.id) || [];
        });
      }

      res.json(codes);
    } catch (err) {
      next(err);
    }
  });

  // Get full specification + usage history of a single discount code (Admin)
  router.get('/discounts/:id/details', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const user = getCurrentUser(req);
      AuthorizationPolicy.requireRole({ userId: user.id, role: user.role, fullName: user.fullName }, ['admin', 'supervisor']);

      const dBuf = toIdBuffer(req.params.id);
      const [codeRows, usageRows] = await Promise.all([
        selectWithTimeout<any>(
          `SELECT * FROM course_discount_codes WHERE (id = ? OR id = ?) AND deleted_at IS NULL LIMIT 1`,
          [dBuf, req.params.id],
          3000
        ),
        selectWithTimeout<any>(
          `SELECT * FROM course_discount_usages WHERE discount_id = ? OR discount_id = ? ORDER BY used_at DESC`,
          [dBuf, req.params.id],
          3000
        ),
      ]);

      if (!codeRows || codeRows.length === 0) {
        throw AppError.notFound('کد تخفیف');
      }

      const discount = mapDiscountRow(codeRows[0]);
      discount.usages = (usageRows || []).map(mapDiscountUsageRow);
      res.json(discount);
    } catch (err) {
      next(err);
    }
  });

  // Create a new discount code (Admin)
  router.post('/discounts', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const user = getCurrentUser(req);
      AuthorizationPolicy.requireRole({ userId: user.id, role: user.role, fullName: user.fullName }, ['admin', 'supervisor']);

      const body = req.body || {};
      const code = String(body.code || '').trim().toUpperCase();
      const title = String(body.title || '').trim();
      if (!code || code.length < 3) {
        throw AppError.badRequest('کد تخفیف باید حداقل ۳ کاراکتر داشته باشد.', 'INVALID_DISCOUNT_CODE');
      }
      if (!title) {
        throw AppError.badRequest('عنوان یا شرح کوتاه کد تخفیف الزامی است.', 'INVALID_DISCOUNT_TITLE');
      }

      const valueType: 'percent' | 'fixed' = body.valueType === 'fixed' ? 'fixed' : 'percent';
      const discountValue = Number(body.discountValue || 0);
      if (discountValue <= 0 || (valueType === 'percent' && discountValue > 100)) {
        throw AppError.badRequest('مقدار تخفیف نامعتبر است (برای درصدی بین ۱ تا ۱۰۰ و برای مبلغی بیشتر از صفر).', 'INVALID_DISCOUNT_VALUE');
      }

      const dup = await selectWithTimeout<any>(
        `SELECT id FROM course_discount_codes WHERE UPPER(code) = ? LIMIT 1`,
        [code],
        3000
      );
      if (dup && dup.length > 0) {
        throw AppError.conflict('کد تخفیف دیگری با این شناسه قبلاً ثبت شده است.', 'DUPLICATE_DISCOUNT_CODE');
      }

      const id = generateUUIDv7();
      const idBuf = toIdBuffer(id);
      const p = getPool();

      const courseIdBuf = body.courseId ? toIdBuffer(String(body.courseId)) : null;
      const courseIds = Array.isArray(body.courseIds) ? body.courseIds : [];
      const targetAudiences = Array.isArray(body.targetAudiences) ? body.targetAudiences : [];
      const allowedNationalIds = Array.isArray(body.allowedNationalIds)
        ? body.allowedNationalIds.map((x: string) => String(x).trim()).filter(Boolean)
        : [];

      const startsAt = body.startsAt ? new Date(body.startsAt) : null;
      const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;

      await p.query(
        `INSERT INTO course_discount_codes (
          id, code, title, description, discount_category, value_type, discount_value,
          max_discount_amount, min_purchase_amount, course_id, course_ids,
          target_audiences, allowed_national_ids, max_uses, per_user_limit, used_count,
          starts_at, expires_at, starts_at_jalali, expires_at_jalali, is_active, created_by_name, version
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, 1)`,
        [
          idBuf,
          code,
          title,
          body.description || null,
          body.discountCategory || (valueType === 'percent' ? 'percentage' : 'fixed_amount'),
          valueType,
          discountValue,
          body.maxDiscountAmount ? Number(body.maxDiscountAmount) : null,
          Number(body.minPurchaseAmount || 0),
          courseIdBuf,
          JSON.stringify(courseIds),
          JSON.stringify(targetAudiences),
          JSON.stringify(allowedNationalIds),
          body.maxUses ? Number(body.maxUses) : null,
          Math.max(1, Number(body.perUserLimit || 1)),
          startsAt && !isNaN(startsAt.getTime()) ? startsAt : null,
          expiresAt && !isNaN(expiresAt.getTime()) ? expiresAt : null,
          body.startsAtJalali || null,
          body.expiresAtJalali || null,
          body.isActive === false ? 0 : 1,
          user.fullName,
        ]
      );

      const createdRows = await selectWithTimeout<any>(`SELECT * FROM course_discount_codes WHERE id = ? LIMIT 1`, [idBuf], 3000);
      const created = mapDiscountRow(createdRows[0]);

      auditChain.appendEntry({
        eventType: 'ROLE_CHANGED',
        actorId: user.id,
        actorName: user.fullName,
        actorRole: user.role,
        ip: '127.0.0.1',
        details: `تعریف کد تخفیف جدید [${code} - ${title}] از نوع ${created.discountCategory}.`,
        severity: 'info',
      });

      outbox.enqueue('courses.discount_updated', { action: 'created', discount: created });
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  });

  // Update discount code with Strict OCC (Admin)
  router.put('/discounts/:id', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const user = getCurrentUser(req);
      AuthorizationPolicy.requireRole({ userId: user.id, role: user.role, fullName: user.fullName }, ['admin', 'supervisor']);

      const expVer = extractExpectedVersion(req, true);
      const dBuf = toIdBuffer(req.params.id);
      const p = getPool();

      const rows = await selectWithTimeout<any>(
        `SELECT * FROM course_discount_codes WHERE (id = ? OR id = ?) AND deleted_at IS NULL LIMIT 1`,
        [dBuf, req.params.id],
        3000
      );
      if (!rows || rows.length === 0) throw AppError.notFound('کد تخفیف');
      const existing = mapDiscountRow(rows[0]);

      const body = req.body || {};
      const title = body.title !== undefined ? String(body.title).trim() : existing.title;
      const description = body.description !== undefined ? body.description : existing.description;
      const discountCategory = body.discountCategory !== undefined ? body.discountCategory : existing.discountCategory;
      const valueType = body.valueType !== undefined ? body.valueType : existing.valueType;
      const discountValue = body.discountValue !== undefined ? Number(body.discountValue) : existing.discountValue;
      const maxDiscountAmount = body.maxDiscountAmount !== undefined ? (body.maxDiscountAmount ? Number(body.maxDiscountAmount) : null) : existing.maxDiscountAmount;
      const minPurchaseAmount = body.minPurchaseAmount !== undefined ? Number(body.minPurchaseAmount || 0) : existing.minPurchaseAmount;
      const courseIdBuf = body.courseId !== undefined ? (body.courseId ? toIdBuffer(String(body.courseId)) : null) : (existing.courseId ? toIdBuffer(existing.courseId) : null);
      const courseIds = body.courseIds !== undefined ? body.courseIds : (existing.courseIds || []);
      const targetAudiences = body.targetAudiences !== undefined ? body.targetAudiences : (existing.targetAudiences || []);
      const allowedNationalIds = body.allowedNationalIds !== undefined ? body.allowedNationalIds : (existing.allowedNationalIds || []);
      const maxUses = body.maxUses !== undefined ? (body.maxUses ? Number(body.maxUses) : null) : existing.maxUses;
      const perUserLimit = body.perUserLimit !== undefined ? Math.max(1, Number(body.perUserLimit || 1)) : (existing.perUserLimit || 1);
      const isActive = body.isActive !== undefined ? (body.isActive ? 1 : 0) : (existing.isActive ? 1 : 0);
      const startsAtJalali = body.startsAtJalali !== undefined ? body.startsAtJalali : existing.startsAtJalali;
      const expiresAtJalali = body.expiresAtJalali !== undefined ? body.expiresAtJalali : existing.expiresAtJalali;
      const startsAt = body.startsAt !== undefined ? (body.startsAt ? new Date(body.startsAt) : null) : (existing.startsAt ? new Date(existing.startsAt) : null);
      const expiresAt = body.expiresAt !== undefined ? (body.expiresAt ? new Date(body.expiresAt) : null) : (existing.expiresAt ? new Date(existing.expiresAt) : null);

      const [upd]: any = await p.query(
        `UPDATE course_discount_codes
         SET title = ?, description = ?, discount_category = ?, value_type = ?, discount_value = ?,
             max_discount_amount = ?, min_purchase_amount = ?, course_id = ?, course_ids = ?,
             target_audiences = ?, allowed_national_ids = ?, max_uses = ?, per_user_limit = ?,
             starts_at = ?, expires_at = ?, starts_at_jalali = ?, expires_at_jalali = ?, is_active = ?,
             version = version + 1, updated_at = CURRENT_TIMESTAMP(3)
         WHERE (id = ? OR id = ?) AND version = ? AND deleted_at IS NULL`,
        [
          title,
          description || null,
          discountCategory,
          valueType,
          discountValue,
          maxDiscountAmount,
          minPurchaseAmount,
          courseIdBuf,
          JSON.stringify(courseIds),
          JSON.stringify(targetAudiences),
          JSON.stringify(allowedNationalIds),
          maxUses,
          perUserLimit,
          startsAt,
          expiresAt,
          startsAtJalali || null,
          expiresAtJalali || null,
          isActive,
          dBuf,
          req.params.id,
          expVer,
        ]
      );

      if (!upd || upd.affectedRows === 0) {
        throw AppError.conflict('کد تخفیف توسط مدیر دیگری تغییر یافته است.', 'CONCURRENT_MODIFICATION_CONFLICT');
      }

      const updatedRows = await selectWithTimeout<any>(`SELECT * FROM course_discount_codes WHERE id = ? OR id = ? LIMIT 1`, [dBuf, req.params.id], 3000);
      const updated = mapDiscountRow(updatedRows[0]);
      outbox.enqueue('courses.discount_updated', { action: 'updated', discount: updated });
      res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  // Soft-delete discount code (Admin, Strict OCC)
  router.delete('/discounts/:id', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      const user = getCurrentUser(req);
      AuthorizationPolicy.requireRole({ userId: user.id, role: user.role, fullName: user.fullName }, ['admin', 'supervisor']);

      const expVer = extractExpectedVersion(req, true);
      const dBuf = toIdBuffer(req.params.id);
      const p = getPool();

      const [upd]: any = await p.query(
        `UPDATE course_discount_codes
         SET deleted_at = CURRENT_TIMESTAMP(3), is_active = 0, version = version + 1
         WHERE (id = ? OR id = ?) AND version = ? AND deleted_at IS NULL`,
        [dBuf, req.params.id, expVer]
      );

      if (!upd || upd.affectedRows === 0) {
        throw AppError.conflict('کد تخفیف یافت نشد یا توسط مدیر دیگری تغییر یافته است.', 'CONCURRENT_MODIFICATION_CONFLICT');
      }

      outbox.enqueue('courses.discount_updated', { action: 'deleted', discountId: req.params.id });
      res.json({ success: true, id: req.params.id });
    } catch (err) {
      next(err);
    }
  });

  // Validate discount code before enrollment payment (Authenticated users)
  router.post('/discounts/validate', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const user = getCurrentUser(req);
      const { courseId, code } = req.body || {};

      if (!courseId || !code) {
        throw AppError.badRequest('شناسه دوره و کد تخفیف الزامی است.');
      }

      const cBuf = toIdBuffer(courseId);
      const cRows = await selectWithTimeout<any>(
        `SELECT id, price, target_audiences FROM courses WHERE (id = ? OR id = ?) AND is_deleted = 0 LIMIT 1`,
        [cBuf, courseId],
        3000
      );
      if (!cRows || cRows.length === 0) {
        throw AppError.notFound('دوره آموزشی');
      }

      const cRow = cRows[0];
      const targetAudiences = parseJsonSafe<string[]>(cRow.target_audiences, []);

      const result = await validateDiscountForCourse({
        code,
        courseId: fromIdBuffer(cRow.id),
        coursePrice: Number(cRow.price || 0),
        courseTargetAudiences: targetAudiences,
        userId: user.id,
        userNationalId: (user as any).nationalId,
        userRole: user.role,
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  });
}
