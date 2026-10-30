import { UserRole } from '../../types';
import { AppError } from './errors';

export interface AuthContext {
  userId: string;
  role: UserRole;
  fullName: string;
}

export class AuthorizationPolicy {
  /**
   * Enforces role requirements (RBAC)
   */
  static requireRole(ctx: AuthContext | { role: UserRole }, allowedRoles: UserRole[]): void {
    if (!allowedRoles.includes(ctx.role)) {
      throw AppError.forbidden(
        `سطح دسترسی شما (${ctx.role}) مجاز به انجام این عملیات نیست. نقش‌های مجاز: ${allowedRoles.join(', ')}`
      );
    }
  }

  static assertRole(currentUser: AuthContext | { role: UserRole }, allowedRoles: UserRole[]): void {
    return this.requireRole(currentUser, allowedRoles);
  }

  /**
   * Centralized BOLA / IDOR Ownership Guard (Section 10)
   * Ensures that regular users can only read/mutate entities they own,
   * while admins and supervisors have elevated oversight where permitted.
   */
  static assertOwnership(
    ctx: AuthContext | { id: string; role: UserRole },
    resourceOwnerId: string,
    resourceName = 'درخواست / سند',
    allowSupervisor = true
  ): void {
    const userId = (ctx as any).userId || (ctx as any).id;
    if (ctx.role === 'admin') return;
    if (allowSupervisor && ctx.role === 'supervisor') return;
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
