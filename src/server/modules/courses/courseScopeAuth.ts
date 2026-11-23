import { CourseScope } from '../../../types';
import { getPool } from '../../platform/mysqlDatabase';
import { toIdBuffer } from '../../platform/uuidv7';
import { AppError } from '../../platform/errors';
import { AuthContext, isOrganizationalUserRole } from '../../platform/authorization';
import { getServerEffectivePermission } from '../rbac/rbacModule';

export function normalizeCourseScope(val: unknown): CourseScope {
  return val === 'counseling_workshop' ? 'counseling_workshop' : 'specialized';
}

export function canManageCourseScope(user: AuthContext, scope: CourseScope): boolean {
  if (!user) return false;
  if (user.role === 'admin' || user.role === 'super_admin') return true;
  if (user.role === 'general_observer') return false;

  if (scope === 'specialized') {
    if (user.role === 'psychologist_counselor') return false;
    if (!isOrganizationalUserRole(user.role)) return false;
    const perm = getServerEffectivePermission({ role: user.role, sectionPermissions: user.sectionPermissions }, 'courses');
    return perm !== 'none' && perm !== 'view_all' && perm !== 'view_own';
  }

  // scope === 'counseling_workshop'
  if (canManageCourseScope(user, 'specialized')) return true;
  if (user.role === 'psychologist_counselor') {
    const cPerm = getServerEffectivePermission({ role: user.role, sectionPermissions: user.sectionPermissions }, 'counseling');
    return cPerm !== 'none' && cPerm !== 'view_all' && cPerm !== 'view_own';
  }
  if (isOrganizationalUserRole(user.role)) {
    const cPerm = getServerEffectivePermission({ role: user.role, sectionPermissions: user.sectionPermissions }, 'counseling');
    return cPerm !== 'none' && cPerm !== 'view_all' && cPerm !== 'view_own';
  }
  return false;
}

export function canReadAdminCourseScope(user: AuthContext, scope: CourseScope): boolean {
  if (!user) return false;
  if (user.role === 'admin' || user.role === 'super_admin') return true;

  if (scope === 'specialized') {
    if (user.role === 'psychologist_counselor') return false;
    if (!isOrganizationalUserRole(user.role)) return false;
    const perm = getServerEffectivePermission({ role: user.role, sectionPermissions: user.sectionPermissions }, 'courses');
    return perm !== 'none';
  }

  // scope === 'counseling_workshop'
  if (canReadAdminCourseScope(user, 'specialized')) return true;
  if (isOrganizationalUserRole(user.role)) {
    const cPerm = getServerEffectivePermission({ role: user.role, sectionPermissions: user.sectionPermissions }, 'counseling');
    return cPerm !== 'none';
  }
  return false;
}

export function isWorkshopOnlyManager(user: AuthContext): boolean {
  return canReadAdminCourseScope(user, 'counseling_workshop') && !canReadAdminCourseScope(user, 'specialized');
}

export function assertCanManageCourseScope(user: AuthContext, scope: CourseScope): void {
  if (!canManageCourseScope(user, scope)) {
    throw AppError.forbidden(
      scope === 'counseling_workshop'
        ? 'سطح دسترسی شما مجاز به مدیریت کارگاه‌های آموزشی مشاوره نیست.'
        : 'سطح دسترسی شما مجاز به مدیریت دوره‌های تخصصی نیست.'
    );
  }
}

export async function getCourseScopeById(courseId: string): Promise<CourseScope> {
  const pool = getPool();
  const [rows] = await pool.query<any[]>('SELECT course_scope FROM courses WHERE id = ? LIMIT 1', [toIdBuffer(courseId)]);
  if (!rows.length) {
    throw AppError.notFound('دوره یا کارگاه مورد نظر یافت نشد.');
  }
  return normalizeCourseScope(rows[0].course_scope);
}

export async function assertCanManageCourseId(user: AuthContext, courseId: string): Promise<CourseScope> {
  const scope = await getCourseScopeById(courseId);
  assertCanManageCourseScope(user, scope);
  return scope;
}

export function redactNationalIdForUser<T extends { userNationalId?: string }>(user: AuthContext, item: T): T {
  if (isWorkshopOnlyManager(user)) {
    return {
      ...item,
      userNationalId: '',
    };
  }
  return item;
}
