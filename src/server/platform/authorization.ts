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
}
