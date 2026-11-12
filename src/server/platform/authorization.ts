import { UserRole } from '../../types';
import { AppError } from './errors';

export interface AuthContext {
  userId: string;
  role: UserRole;
  fullName: string;
}

const ORGANIZATIONAL_ROLES: UserRole[] = [
  'admin',
  'super_admin',
  'general_observer',
  'alumni_manager',
  'admin_finance_officer',
  'education_deputy',
  'cultural_educational_officer',
  'research_deputy',
  'supervisor',
];

const ELEVATED_ADMIN_ROLES: UserRole[] = [
  'admin',
  'super_admin',
  'alumni_manager',
  'admin_finance_officer',
  'education_deputy',
  'cultural_educational_officer',
  'research_deputy',
];

export class AuthorizationPolicy {
  /**
   * Enforces role requirements (RBAC) across all 9 organizational roles.
   * Note: 'general_observer' is strictly blocked from mutations by rbacEnforcementMiddleware.
   */
  static requireRole(ctx: AuthContext | { role: UserRole }, allowedRoles: UserRole[]): void {
    const userRole = ctx.role;

    // Super Admin always passes
    if (userRole === 'admin' || userRole === 'super_admin') {
      return;
    }

    if (allowedRoles.includes(userRole)) {
      return;
    }

    // If 'supervisor' is in allowedRoles, organizational roles (whose section permission is verified by rbacEnforcementMiddleware) are permitted
    if (allowedRoles.includes('supervisor') && ORGANIZATIONAL_ROLES.includes(userRole)) {
      return;
    }

    // If 'admin' is in allowedRoles, elevated management roles (checked per-section by rbacEnforcementMiddleware) are permitted
    if (allowedRoles.includes('admin') && ELEVATED_ADMIN_ROLES.includes(userRole)) {
      return;
    }

    throw AppError.forbidden(
      `سطح دسترسی شما (${userRole}) مجاز به انجام این عملیات نیست.`
    );
  }

  static assertRole(currentUser: AuthContext | { role: UserRole }, allowedRoles: UserRole[]): void {
    return this.requireRole(currentUser, allowedRoles);
  }

  /**
   * Centralized BOLA / IDOR Ownership Guard (Section 10)
   * Ensures that regular users (alumni / customer) can only read/mutate entities they own,
   * while organizational roles have oversight where permitted by their section policy.
   */
  static assertOwnership(
    ctx: AuthContext | { id: string; role: UserRole },
    resourceOwnerId: string,
    resourceName = 'درخواست / سند',
    allowSupervisor = true
  ): void {
    const userId = (ctx as any).userId || (ctx as any).id;
    if (ctx.role === 'admin' || ctx.role === 'super_admin') return;
    if (allowSupervisor && ORGANIZATIONAL_ROLES.includes(ctx.role)) return;
    if (userId === resourceOwnerId) return;

    throw AppError.forbidden(
      `عدم دسترسی به ${resourceName}: شما مالک این منبع نیستید و امکان مشاهده یا ویرایش آن را ندارید.`
    );
  }

  static assertCanAccessResource(
    currentUser: AuthContext | { id: string; role: UserRole },
    resource: { applicantId?: string; authorId?: string; submittedById?: string; isPublic?: boolean },
    resourceName = 'منبع'
  ): void {
    if (resource.isPublic) return;
    const ownerId = resource.applicantId || resource.authorId || resource.submittedById || '';
    return this.assertOwnership(currentUser, ownerId, resourceName, true);
  }

  /**
   * Central Guard checking whether a user has 'view' or 'edit' access to an application section
   * based on the MySQL-backed effective permission matrix.
   */
  static assertSectionAccess(
    user: any,
    sectionId: import('../../types').AppSectionId,
    action: 'view' | 'edit' = 'view'
  ): void {
    if (!user) {
      throw AppError.unauthorized('جهت دسترسی به این بخش، احراز هویت الزامی است.');
    }
    const role: UserRole = user.role || 'alumni';
    if (role === 'admin' || role === 'super_admin') {
      return;
    }

    // Lazy load rbacModule permission lookup
    const { getServerEffectivePermission } = require('../modules/rbac/rbacModule');
    const perm = getServerEffectivePermission(user, sectionId);

    if (perm === 'none') {
      throw AppError.forbidden(
        `دسترسی به بخش «${sectionId}» برای نقش یا حساب کاربری شما غیرفعال شده است.`,
        'SECTION_ACCESS_DENIED'
      );
    }

    if (action === 'edit' && (perm === 'view_all' || perm === 'view_own')) {
      throw AppError.forbidden(
        `سطح دسترسی شما در بخش «${sectionId}» صرفاً مشاهده است و مجاز به ویرایش داده‌ها نیستید.`,
        'SECTION_READ_ONLY'
      );
    }
  }

  /**
   * Granular Welfare Sub-Section Guard (loans, accommodations, cooperative)
   */
  static assertWelfareSubSection(
    user: any,
    subSection: 'welfare_loans' | 'welfare_accommodations' | 'welfare_cooperative',
    action: 'view' | 'edit' = 'view'
  ): void {
    if (!user) throw AppError.unauthorized();
    if (user.role === 'admin' || user.role === 'super_admin') return;

    const { getRolePoliciesCache } = require('../modules/rbac/rbacModule');
    const policies = getRolePoliciesCache();
    const policy = policies[user.role];
    const subPerms = policy?.subSectionPermissions;

    if (subPerms && subPerms[subSection] === false) {
      const titles = {
        welfare_loans: 'تسهیلات وام قرض‌الحسنه',
        welfare_accommodations: 'اسکان و اقامتگاه زیارتی',
        welfare_cooperative: 'تعاونی مصرف دانش‌آموختگان',
      };
      throw AppError.forbidden(
        `دسترسی به «${titles[subSection]}» برای گروه کاربری شما غیرفعال شده است.`,
        `WELFARE_${subSection.toUpperCase()}_DISABLED`
      );
    }
  }

  static isCustomer(user: any): boolean {
    return user?.role === 'customer';
  }
}
