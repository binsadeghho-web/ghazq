import { useState, useEffect } from 'react';
import {
  User,
  UserRole,
  AppSectionId,
  PermissionAccessLevel,
  RoleAccessPolicy,
  RoleSubSectionPermissions,
  UserSectionPermissions,
} from '../types';
import { api } from '../services/apiClient';

/**
 * 9 Official Organizational Roles + Legacy 'supervisor' compatibility
 */
export const DEFAULT_ROLE_POLICIES: Record<UserRole, RoleAccessPolicy> = {
  admin: {
    roleId: 'admin',
    roleTitle: 'ادمین اصلی (سوپر ادمین)',
    description: 'دسترسی کامل و نامحدود به ۱۰۰٪ بخش‌ها، تنظیمات امنیتی، مدیریت نقش‌ها و قابلیت محدودسازی سایر مدیران.',
    badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
    isReadOnlyRole: false,
    sectionPermissions: {
      dashboard: 'manage_all',
      cartable: 'manage_all',
      courses: 'manage_all',
      products: 'manage_all',
      counseling: 'manage_all',
      specialized_counseling: 'manage_all',
      research: 'manage_all',
      rulings: 'manage_all',
      welfare: 'manage_all',
      synergy: 'manage_all',
      alumni: 'manage_all',
      users: 'manage_all',
      finance: 'manage_all',
      admin: 'manage_all',
    },
    subSectionPermissions: {
      welfare_loans: true,
      welfare_accommodations: true,
      welfare_cooperative: true,
    },
  },
  super_admin: {
    roleId: 'super_admin',
    roleTitle: 'ادمین اصلی (سوپر ادمین)',
    description: 'دسترسی کامل و نامحدود به ۱۰۰٪ بخش‌ها، تنظیمات امنیتی، مدیریت نقش‌ها و قابلیت محدودسازی سایر مدیران.',
    badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
    isReadOnlyRole: false,
    sectionPermissions: {
      dashboard: 'manage_all',
      cartable: 'manage_all',
      courses: 'manage_all',
      products: 'manage_all',
      counseling: 'manage_all',
      specialized_counseling: 'manage_all',
      research: 'manage_all',
      rulings: 'manage_all',
      welfare: 'manage_all',
      synergy: 'manage_all',
      alumni: 'manage_all',
      users: 'manage_all',
      finance: 'manage_all',
      admin: 'manage_all',
    },
    subSectionPermissions: {
      welfare_loans: true,
      welfare_accommodations: true,
      welfare_cooperative: true,
    },
  },
  general_observer: {
    roleId: 'general_observer',
    roleTitle: 'ناظر کل سامانه',
    description: 'مشاهده کامل تمامی بخش‌ها و گزارش‌های سامانه همانند سوپر ادمین، اما بدون هیچ‌گونه حق ویرایش، ثبت یا تغییر اطلاعات (صرفاً مشاهده).',
    badgeColor: 'bg-sky-100 text-sky-900 border-sky-300',
    isReadOnlyRole: true,
    sectionPermissions: {
      dashboard: 'view_all',
      cartable: 'view_all',
      courses: 'view_all',
      products: 'view_all',
      counseling: 'view_all',
      specialized_counseling: 'view_all',
      research: 'view_all',
      rulings: 'view_all',
      welfare: 'view_all',
      synergy: 'view_all',
      alumni: 'view_all',
      users: 'view_all',
      finance: 'view_all',
      admin: 'view_all',
    },
    subSectionPermissions: {
      welfare_loans: true,
      welfare_accommodations: true,
      welfare_cooperative: true,
    },
  },
  alumni_manager: {
    roleId: 'alumni_manager',
    roleTitle: 'مدیر دانش‌آموختگان',
    description: 'به صورت پیش‌فرض دارای دسترسی مشاهده و ویرایش تمامی بخش‌ها و مدیریت ویترین مشتریان و دانش‌آموختگان؛ قابل محدودسازی توسط سوپر ادمین.',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    isReadOnlyRole: false,
    sectionPermissions: {
      dashboard: 'manage_all',
      cartable: 'manage_all',
      courses: 'manage_all',
      products: 'manage_all',
      counseling: 'manage_all',
      specialized_counseling: 'manage_all',
      research: 'manage_all',
      rulings: 'manage_all',
      welfare: 'manage_all',
      synergy: 'manage_all',
      alumni: 'manage_all',
      users: 'manage_all',
      finance: 'manage_all',
      admin: 'manage_all',
    },
    subSectionPermissions: {
      welfare_loans: true,
      welfare_accommodations: true,
      welfare_cooperative: true,
    },
  },
  admin_finance_officer: {
    roleId: 'admin_finance_officer',
    roleTitle: 'مسئول اداری و مالی',
    description: 'به صورت پیش‌فرض دارای امکان مشاهده و ویرایش تمامی بخش‌ها (امور مالی، کارتابل، رفاهیات و ...)؛ قابل شخصی‌سازی توسط سوپر ادمین.',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
    isReadOnlyRole: false,
    sectionPermissions: {
      dashboard: 'manage_all',
      cartable: 'manage_all',
      courses: 'manage_all',
      products: 'manage_all',
      counseling: 'manage_all',
      specialized_counseling: 'manage_all',
      research: 'manage_all',
      rulings: 'manage_all',
      welfare: 'manage_all',
      synergy: 'manage_all',
      alumni: 'manage_all',
      users: 'manage_all',
      finance: 'manage_all',
      admin: 'manage_all',
    },
    subSectionPermissions: {
      welfare_loans: true,
      welfare_accommodations: true,
      welfare_cooperative: true,
    },
  },
  education_deputy: {
    roleId: 'education_deputy',
    roleTitle: 'معاون آموزشی',
    description: 'به صورت پیش‌فرض دارای امکان مشاهده و ویرایش تمامی بخش‌ها؛ قابل تنظیم و محدودسازی به بخش‌های آموزشی توسط سوپر ادمین.',
    badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-300',
    isReadOnlyRole: false,
    sectionPermissions: {
      dashboard: 'manage_all',
      cartable: 'manage_all',
      courses: 'manage_all',
      products: 'manage_all',
      counseling: 'manage_all',
      specialized_counseling: 'manage_all',
      research: 'manage_all',
      rulings: 'manage_all',
      welfare: 'manage_all',
      synergy: 'manage_all',
      alumni: 'manage_all',
      users: 'manage_all',
      finance: 'manage_all',
      admin: 'manage_all',
    },
    subSectionPermissions: {
      welfare_loans: true,
      welfare_accommodations: true,
      welfare_cooperative: true,
    },
  },
  cultural_educational_officer: {
    roleId: 'cultural_educational_officer',
    roleTitle: 'مسئول تحصیل و فرهنگی',
    description: 'به صورت پیش‌فرض دارای امکان مشاهده و ویرایش تمامی بخش‌ها؛ قابل تنظیم و سفارشی‌سازی کامل توسط سوپر ادمین.',
    badgeColor: 'bg-teal-100 text-teal-900 border-teal-300',
    isReadOnlyRole: false,
    sectionPermissions: {
      dashboard: 'manage_all',
      cartable: 'manage_all',
      courses: 'manage_all',
      products: 'manage_all',
      counseling: 'manage_all',
      specialized_counseling: 'manage_all',
      research: 'manage_all',
      rulings: 'manage_all',
      welfare: 'manage_all',
      synergy: 'manage_all',
      alumni: 'manage_all',
      users: 'manage_all',
      finance: 'manage_all',
      admin: 'manage_all',
    },
    subSectionPermissions: {
      welfare_loans: true,
      welfare_accommodations: true,
      welfare_cooperative: true,
    },
  },
  research_deputy: {
    roleId: 'research_deputy',
    roleTitle: 'معاون پژوهشی',
    description: 'به صورت پیش‌فرض دسترسی کامل دارد و با یک کلیک سوپر ادمین می‌تواند منحصراً به «راهبری پژوهش» و «مشاوره تحصیلی» محدود شود (بدون نمایش سایر منوها).',
    badgeColor: 'bg-orange-100 text-orange-900 border-orange-300',
    isReadOnlyRole: false,
    sectionPermissions: {
      dashboard: 'manage_all',
      cartable: 'manage_all',
      courses: 'manage_all',
      products: 'manage_all',
      counseling: 'manage_all',
      specialized_counseling: 'manage_all',
      research: 'manage_all',
      rulings: 'manage_all',
      welfare: 'manage_all',
      synergy: 'manage_all',
      alumni: 'manage_all',
      users: 'manage_all',
      finance: 'manage_all',
      admin: 'manage_all',
    },
    subSectionPermissions: {
      welfare_loans: true,
      welfare_accommodations: true,
      welfare_cooperative: true,
    },
  },
  supervisor: {
    roleId: 'supervisor',
    roleTitle: 'مسئول اجرایی سامانه',
    description: 'مسئول بررسی درخواست‌ها و هماهنگی بخش‌ها.',
    badgeColor: 'bg-cyan-100 text-cyan-900 border-cyan-300',
    isReadOnlyRole: false,
    sectionPermissions: {
      dashboard: 'manage_all',
      cartable: 'manage_all',
      courses: 'manage_all',
      products: 'manage_all',
      counseling: 'manage_all',
      specialized_counseling: 'manage_all',
      research: 'manage_all',
      rulings: 'manage_all',
      welfare: 'manage_all',
      synergy: 'manage_all',
      alumni: 'view_all',
      users: 'view_all',
      finance: 'view_all',
      admin: 'view_all',
    },
    subSectionPermissions: {
      welfare_loans: true,
      welfare_accommodations: true,
      welfare_cooperative: true,
    },
  },
  alumni: {
    roleId: 'alumni',
    roleTitle: 'دانش‌آموختگان فقه و قضا',
    description: 'اعضای اصلی مرکز با پرونده جامع ۴ سربرگه، امکان ثبت‌نام دوره‌ها، کارتابل اداری، مشاوره، پژوهش، تالار آراء، رفاهیات و هم‌افزایی.',
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    isReadOnlyRole: false,
    sectionPermissions: {
      dashboard: 'view_all',
      cartable: 'manage_own',
      courses: 'manage_own',
      products: 'manage_own',
      counseling: 'manage_own',
      specialized_counseling: 'manage_own',
      research: 'manage_own',
      rulings: 'manage_own',
      welfare: 'manage_own',
      synergy: 'manage_own',
      alumni: 'none',
      users: 'none',
      finance: 'none',
      admin: 'none',
    },
    subSectionPermissions: {
      welfare_loans: true,
      welfare_accommodations: true,
      welfare_cooperative: true,
    },
  },
  customer: {
    roleId: 'customer',
    roleTitle: 'کاربران مشتری (عمومی / بیرونی)',
    description: 'افراد غیر دانش‌آموخته که با ثبت‌نام ساده وارد سامانه می‌شوند و فقط به دوره‌ها، محصولات و خدمات رفاهی مجاز تعیین‌شده توسط ادمین یا مدیر دانش‌آموختگان دسترسی دارند.',
    badgeColor: 'bg-rose-50 text-rose-800 border-rose-200',
    isReadOnlyRole: false,
    sectionPermissions: {
      dashboard: 'view_all',
      cartable: 'none',
      courses: 'manage_own',
      products: 'manage_own',
      counseling: 'none',
      specialized_counseling: 'none',
      research: 'none',
      rulings: 'none',
      welfare: 'manage_own',
      synergy: 'none',
      alumni: 'none',
      users: 'none',
      finance: 'none',
      admin: 'none',
    },
    subSectionPermissions: {
      welfare_loans: false,
      welfare_accommodations: false,
      welfare_cooperative: true,
    },
  },
};

export const NINE_ORGANIZATIONAL_ROLES: {
  id: UserRole;
  number: number;
  title: string;
  shortTitle: string;
  badgeColor: string;
  description: string;
}[] = [
  {
    id: 'admin',
    number: 1,
    title: 'ادمین اصلی (سوپر ادمین)',
    shortTitle: 'سوپر ادمین',
    badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
    description: 'دسترسی کامل به همه بخش‌ها، ویرایش همه اطلاعات و مدیریت محدودیت سایر نقش‌ها',
  },
  {
    id: 'general_observer',
    number: 2,
    title: 'ناظر کل',
    shortTitle: 'ناظر کل (فقط مشاهده)',
    badgeColor: 'bg-sky-100 text-sky-900 border-sky-300',
    description: 'مشاهده ۱۰۰٪ بخش‌ها و آمارها دقیقاً مانند سوپر ادمین اما بدون حق ویرایش هیچ چیزی',
  },
  {
    id: 'alumni_manager',
    number: 3,
    title: 'مدیر دانش‌آموختگان',
    shortTitle: 'مدیر دانش‌آموختگان',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    description: 'پیش‌فرض دسترسی کامل مشاهده و ویرایش همه بخش‌ها + مدیریت ویترین مشتریان (قابل محدودسازی توسط سوپر ادمین)',
  },
  {
    id: 'admin_finance_officer',
    number: 4,
    title: 'مسئول اداری و مالی',
    shortTitle: 'مسئول اداری و مالی',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
    description: 'پیش‌فرض امکان مشاهده و ویرایش تمامی بخش‌ها (قابل تنظیم توسط سوپر ادمین)',
  },
  {
    id: 'education_deputy',
    number: 5,
    title: 'معاون آموزشی',
    shortTitle: 'معاون آموزشی',
    badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-300',
    description: 'پیش‌فرض امکان مشاهده و ویرایش تمامی بخش‌ها (قابل تنظیم توسط سوپر ادمین)',
  },
  {
    id: 'cultural_educational_officer',
    number: 6,
    title: 'مسئول تحصیل و فرهنگی',
    shortTitle: 'مسئول تحصیل و فرهنگی',
    badgeColor: 'bg-teal-100 text-teal-900 border-teal-300',
    description: 'پیش‌فرض امکان مشاهده و ویرایش تمامی بخش‌ها (قابل تنظیم توسط سوپر ادمین)',
  },
  {
    id: 'research_deputy',
    number: 7,
    title: 'معاون پژوهشی',
    shortTitle: 'معاون پژوهشی',
    badgeColor: 'bg-orange-100 text-orange-900 border-orange-300',
    description: 'پیش‌فرض دسترسی کامل؛ دارای کلید محدودسازی آنی به «راهبری پژوهش» و «مشاوره تحصیلی»',
  },
  {
    id: 'alumni',
    number: 8,
    title: 'دانش‌آموختگان',
    shortTitle: 'دانش‌آموخته',
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    description: 'اعضای دارای پرونده ۴ سربرگه با دسترسی به خدمات آموزشی، اداری، پژوهشی، مشاوره و رفاهی',
  },
  {
    id: 'customer',
    number: 9,
    title: 'کاربران مشتری',
    shortTitle: 'کاربر مشتری',
    badgeColor: 'bg-rose-50 text-rose-800 border-rose-200',
    description: 'کاربران غیر دانش‌آموخته (ثبت‌نام ساده) جهت خرید دوره‌ها، کتب و اقلام مجاز تعیین‌شده',
  },
];

// Global reactive store for role policies so all components stay in sync via SSE
let cachedRolePolicies: Record<string, RoleAccessPolicy> = { ...DEFAULT_ROLE_POLICIES };
const listeners = new Set<() => void>();
let initialized = false;

export function getRolePoliciesSnapshot(): Record<string, RoleAccessPolicy> {
  return cachedRolePolicies;
}

export function setRolePoliciesSnapshot(policies: Record<string, RoleAccessPolicy>) {
  cachedRolePolicies = {
    ...DEFAULT_ROLE_POLICIES,
    ...policies,
  };
  if (cachedRolePolicies.admin && !cachedRolePolicies.super_admin) {
    cachedRolePolicies.super_admin = cachedRolePolicies.admin;
  }
  listeners.forEach(fn => fn());
}

export async function refreshRolePoliciesFromServer(): Promise<void> {
  try {
    const res = await api.getRbacPolicies();
    if (res && res.policies) {
      setRolePoliciesSnapshot(res.policies);
    }
  } catch {
    // Fallback to defaults if offline
  }
}

export function useRbacPolicies(): {
  rolePolicies: Record<string, RoleAccessPolicy>;
  refreshPolicies: () => Promise<void>;
} {
  const [, setTick] = useState(0);

  useEffect(() => {
    const listener = () => setTick(t => t + 1);
    listeners.add(listener);

    if (!initialized) {
      initialized = true;
      refreshRolePoliciesFromServer();
      api.subscribeToEvents(ev => {
        if (ev.type === 'rbac.policy_updated' || ev.type === 'rbac.item_visibility_updated') {
          refreshRolePoliciesFromServer();
        }
      });
    }

    return () => {
      listeners.delete(listener);
    };
  }, []);

  return {
    rolePolicies: cachedRolePolicies,
    refreshPolicies: refreshRolePoliciesFromServer,
  };
}

/**
 * Role classification helpers
 */
export function isSuperAdminRole(role?: UserRole | string | null): boolean {
  return role === 'admin' || role === 'super_admin';
}

export function isReadOnlyObserverRole(role?: UserRole | string | null): boolean {
  return role === 'general_observer';
}

export function canConfigureCustomerAndAlumniVisibility(user?: User | null): boolean {
  if (!user) return false;
  return (
    user.role === 'admin' ||
    user.role === 'super_admin' ||
    user.role === 'alumni_manager'
  );
}

export function getRoleMetadata(role?: UserRole | string | null) {
  if (!role) return NINE_ORGANIZATIONAL_ROLES[7];
  if (role === 'super_admin') return NINE_ORGANIZATIONAL_ROLES[0];
  return (
    NINE_ORGANIZATIONAL_ROLES.find(r => r.id === role) || {
      id: role as UserRole,
      number: 0,
      title: DEFAULT_ROLE_POLICIES[role as UserRole]?.roleTitle || 'عضو سامانه',
      shortTitle: DEFAULT_ROLE_POLICIES[role as UserRole]?.roleTitle || 'عضو سامانه',
      badgeColor: 'bg-stone-100 text-stone-800 border-stone-200',
      description: '',
    }
  );
}

/**
 * Computes effective permission for a user on a given section:
 * 1. Super Admin ('admin' / 'super_admin') ALWAYS has 'manage_all'.
 * 2. General Observer ('general_observer') NEVER has edit rights; if a section is not 'none', it is capped at 'view_all'.
 * 3. Individual user override (`user.sectionPermissions?.[sectionId]`) takes precedence if explicitly set.
 * 4. Otherwise falls back to the Role's policy in `rolePolicies[user.role]`.
 */
export function getEffectiveSectionPermission(
  user: User | null | undefined,
  sectionId: AppSectionId,
  policies: Record<string, RoleAccessPolicy> = cachedRolePolicies
): PermissionAccessLevel {
  if (!user) return 'none';
  if (isSuperAdminRole(user.role)) return 'manage_all';

  const rolePolicy = policies[user.role] || DEFAULT_ROLE_POLICIES[user.role] || DEFAULT_ROLE_POLICIES.alumni;

  // Check individual user override first, then role default
  const userOverride = user.sectionPermissions?.[sectionId];
  // Also fallback 'specialized_counseling' to 'counseling' if not explicitly set
  const fallbackSectionId: AppSectionId =
    sectionId === 'specialized_counseling' && !userOverride && !rolePolicy?.sectionPermissions?.specialized_counseling
      ? 'counseling'
      : sectionId;

  let rawPerm: PermissionAccessLevel =
    user.sectionPermissions?.[fallbackSectionId] ||
    rolePolicy?.sectionPermissions?.[fallbackSectionId] ||
    DEFAULT_ROLE_POLICIES[user.role]?.sectionPermissions?.[fallbackSectionId] ||
    'none';

  // Enforce strict read-only cap for General Observer (ناظر کل)
  if (isReadOnlyObserverRole(user.role)) {
    if (rawPerm === 'manage_all') rawPerm = 'view_all';
    if (rawPerm === 'manage_own') rawPerm = 'view_own';
  }

  return rawPerm;
}

/**
 * Returns true if the user is allowed to see the section in menus/navigation and open it.
 * If permission is 'none', the section is 100% hidden from all menus (Menu Cloaking).
 */
export function canViewSection(
  user: User | null | undefined,
  sectionId: AppSectionId,
  policies: Record<string, RoleAccessPolicy> = cachedRolePolicies
): boolean {
  if (!user) return false;
  if (sectionId === 'dashboard') return true;
  const perm = getEffectiveSectionPermission(user, sectionId, policies);
  return perm !== 'none';
}

/**
 * Returns true if the user has administrative/edit rights in the section ('manage_all').
 * Note: General Observer ('general_observer') ALWAYS returns false here!
 */
export function canManageAllInSection(
  user: User | null | undefined,
  sectionId: AppSectionId,
  policies: Record<string, RoleAccessPolicy> = cachedRolePolicies
): boolean {
  if (!user) return false;
  if (isReadOnlyObserverRole(user.role)) return false;
  if (isSuperAdminRole(user.role)) return true;
  const perm = getEffectiveSectionPermission(user, sectionId, policies);
  return perm === 'manage_all';
}

/**
 * Returns true if the user can perform personal mutations (e.g., enrolling, submitting a request)
 * OR full management in the section. General Observer returns false.
 */
export function canMutateInSection(
  user: User | null | undefined,
  sectionId: AppSectionId,
  policies: Record<string, RoleAccessPolicy> = cachedRolePolicies
): boolean {
  if (!user) return false;
  if (isReadOnlyObserverRole(user.role)) return false;
  if (isSuperAdminRole(user.role)) return true;
  const perm = getEffectiveSectionPermission(user, sectionId, policies);
  return perm === 'manage_all' || perm === 'manage_own';
}

/**
 * Checks whether a user belongs to an organizational management/oversight role
 * (roles 1 to 7 + supervisor) as opposed to 'alumni' or 'customer'.
 */
export function isOrganizationalRole(role?: UserRole | string | null): boolean {
  if (!role) return false;
  return (
    role !== 'alumni' &&
    role !== 'customer'
  );
}

/**
 * Checks whether a specific Welfare sub-section ('welfare_loans' | 'welfare_accommodations' | 'welfare_cooperative')
 * is visible and enabled for the current user's role.
 */
export function canAccessWelfareSubSection(
  user: User | null | undefined,
  subSectionKey: keyof RoleSubSectionPermissions,
  policies: Record<string, RoleAccessPolicy> = cachedRolePolicies
): boolean {
  if (!user) return false;
  if (isSuperAdminRole(user.role) || isReadOnlyObserverRole(user.role)) return true;
  const rolePolicy = policies[user.role] || DEFAULT_ROLE_POLICIES[user.role];
  if (!rolePolicy?.subSectionPermissions) return true;
  return rolePolicy.subSectionPermissions[subSectionKey] !== false;
}
