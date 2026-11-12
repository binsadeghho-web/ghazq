import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  Users,
  ShoppingBag,
  GraduationCap,
  BookOpen,
  Gift,
  Eye,
  EyeOff,
  CheckCircle2,
  SlidersHorizontal,
  Sparkles,
  Lock,
  Check,
  Search,
  RefreshCw,
  UserCheck,
  Scale,
  FileText,
  Building2,
  Wallet
} from 'lucide-react';
import {
  User,
  UserRole,
  AppSectionId,
  PermissionAccessLevel,
  UserSectionPermissions,
  RoleSubSectionPermissions,
} from '../../types';
import {
  NINE_ORGANIZATIONAL_ROLES,
  DEFAULT_ROLE_POLICIES,
  useRbacPolicies,
  isSuperAdminRole,
  canConfigureCustomerAndAlumniVisibility,
} from '../../utils/rbacPolicy';
import { api } from '../../services/apiClient';
import { toPersianNumbers } from '../../utils/persianNumbers';

const ALL_CONFIGURABLE_SECTIONS: { id: AppSectionId; title: string; icon: any }[] = [
  { id: 'dashboard', title: 'داشبورد و ویترین اصلی', icon: Sparkles },
  { id: 'cartable', title: 'کارتابل خدمات اداری', icon: FileText },
  { id: 'courses', title: 'دوره‌ها و کارگاه‌های آموزشی', icon: GraduationCap },
  { id: 'products', title: 'کتب و محصولات انتشارات', icon: BookOpen },
  { id: 'counseling', title: 'مشاوره عمومی و خانواده', icon: Users },
  { id: 'specialized_counseling', title: 'مشاوره تخصصی شغلی و تحصیلی', icon: Scale },
  { id: 'research', title: 'راهبری پژوهش و پایان‌نامه‌ها', icon: Scale },
  { id: 'rulings', title: 'تالار نقد و مباحثه آراء قضایی', icon: Scale },
  { id: 'welfare', title: 'تسهیلات رفاهی و تعاونی', icon: Building2 },
  { id: 'synergy', title: 'دیوار هم‌افزایی و تجارب', icon: Users },
  { id: 'finance', title: 'امور مالی و حسابداری', icon: Wallet },
  { id: 'alumni', title: 'بانک جامع دانش‌آموختگان', icon: GraduationCap },
  { id: 'users', title: 'مدیریت کاربران و نقش‌ها', icon: ShieldCheck },
  { id: 'admin', title: 'مرکز مدیریت و پایش امنیت', icon: ShieldCheck },
];

const PERMISSION_OPTIONS: { value: PermissionAccessLevel; label: string; badgeClass: string }[] = [
  {
    value: 'manage_all',
    label: 'مشاهده و ویرایش کامل (کل اطلاعات)',
    badgeClass: 'bg-emerald-50 text-emerald-900 border-emerald-300',
  },
  {
    value: 'view_all',
    label: 'فقط مشاهده (کل اطلاعات - بدون ویرایش)',
    badgeClass: 'bg-sky-50 text-sky-900 border-sky-300',
  },
  {
    value: 'manage_own',
    label: 'مشاهده و ثبت/ویرایش اطلاعات خود',
    badgeClass: 'bg-amber-50 text-amber-900 border-amber-300',
  },
  {
    value: 'view_own',
    label: 'فقط مشاهده اطلاعات خود',
    badgeClass: 'bg-teal-50 text-teal-900 border-teal-300',
  },
  {
    value: 'none',
    label: 'عدم دسترسی (حذف کامل از منوی کاربر)',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-300',
  },
];

interface RoleAndCustomerAccessCenterProps {
  currentUser: User | null;
  users: User[];
  onRefreshUsers: () => Promise<void>;
}

export const RoleAndCustomerAccessCenter: React.FC<RoleAndCustomerAccessCenterProps> = ({
  currentUser,
  users,
  onRefreshUsers,
}) => {
  const { rolePolicies, refreshPolicies } = useRbacPolicies();
  const isSuperAdmin = isSuperAdminRole(currentUser?.role);
  const canManageCustomerAndAlumni = canConfigureCustomerAndAlumniVisibility(currentUser);

  const [activeTab, setActiveTab] = useState<'roles_matrix' | 'customer_showcase' | 'bulk_assign'>('roles_matrix');
  const [selectedRole, setSelectedRole] = useState<UserRole>(isSuperAdmin ? 'alumni_manager' : 'customer');
  const [savingRole, setSavingRole] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Customer Item Visibility State
  const [customerCourses, setCustomerCourses] = useState<
    Array<{ id: string; title: string; instructor: string; price: number; visibleToCustomer: boolean }>
  >([]);
  const [customerProducts, setCustomerProducts] = useState<
    Array<{ id: string; title: string; formatTitle: string; price: number; visibleToCustomer: boolean }>
  >([]);
  const [customerConsumables, setCustomerConsumables] = useState<
    Array<{ id: string; title: string; category: string; cooperativePrice: number; visibleToCustomer: boolean }>
  >([]);
  const [loadingCustomerItems, setLoadingCustomerItems] = useState(false);

  // Bulk Role Assignment State
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [targetBulkRole, setTargetBulkRole] = useState<UserRole>('alumni_manager');
  const [bulkSearch, setBulkSearch] = useState('');
  const [applyingBulk, setApplyingBulk] = useState(false);

  const loadCustomerVisibilityItems = useCallback(async () => {
    setLoadingCustomerItems(true);
    try {
      const res = await api.getRbacPolicies();
      if (res?.customerVisibility) {
        setCustomerCourses(res.customerVisibility.courses || []);
        setCustomerProducts(res.customerVisibility.products || []);
        setCustomerConsumables(res.customerVisibility.consumables || []);
      }
    } catch {
      // Fallback
    } finally {
      setLoadingCustomerItems(false);
    }
  }, []);

  useEffect(() => {
    loadCustomerVisibilityItems();
  }, [loadCustomerVisibilityItems]);

  if (!canManageCustomerAndAlumni && !isSuperAdmin) {
    return null;
  }

  const currentRolePolicy =
    rolePolicies[selectedRole] || DEFAULT_ROLE_POLICIES[selectedRole] || DEFAULT_ROLE_POLICIES.alumni;

  const canEditSelectedRole =
    isSuperAdmin
      ? selectedRole !== 'admin' && selectedRole !== 'super_admin'
      : selectedRole === 'alumni' || selectedRole === 'customer';

  const showToast = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleUpdateRoleSectionPermission = async (
    sectionId: AppSectionId,
    level: PermissionAccessLevel
  ) => {
    if (!canEditSelectedRole) return;
    setSavingRole(true);
    try {
      const nextSections: UserSectionPermissions = {
        ...currentRolePolicy.sectionPermissions,
        [sectionId]: level,
      };
      const res = await api.updateRbacRolePolicy(selectedRole, {
        sectionPermissions: nextSections as Record<string, string>,
        subSectionPermissions: currentRolePolicy.subSectionPermissions as Record<string, boolean>,
      });
      await refreshPolicies();
      await onRefreshUsers();
      showToast(res.message || 'سطح دسترسی نقش با موفقیت ذخیره شد.');
    } catch (err: any) {
      showToast(`خطا: ${err?.message || err}`);
    } finally {
      setSavingRole(false);
    }
  };

  const handleUpdateRoleSubSection = async (
    subKey: keyof RoleSubSectionPermissions,
    enabled: boolean
  ) => {
    if (!canEditSelectedRole) return;
    setSavingRole(true);
    try {
      const nextSub: RoleSubSectionPermissions = {
        ...(currentRolePolicy.subSectionPermissions || {
          welfare_loans: true,
          welfare_accommodations: true,
          welfare_cooperative: true,
        }),
        [subKey]: enabled,
      };
      const res = await api.updateRbacRolePolicy(selectedRole, {
        sectionPermissions: currentRolePolicy.sectionPermissions as Record<string, string>,
        subSectionPermissions: nextSub as Record<string, boolean>,
      });
      await refreshPolicies();
      showToast(res.message || 'دسترسی زیربخش رفاهی ذخیره شد.');
    } catch (err: any) {
      showToast(`خطا: ${err?.message || err}`);
    } finally {
      setSavingRole(false);
    }
  };

  // Preset 1: Restrict Research Deputy ONLY to Research & Academic Counseling (hide all other menus)
  const handleApplyResearchDeputyStrictPreset = async () => {
    setSavingRole(true);
    try {
      const strictResearchPermissions: UserSectionPermissions = {
        dashboard: 'view_all',
        cartable: 'none',
        courses: 'none',
        products: 'none',
        counseling: 'manage_all',
        specialized_counseling: 'manage_all',
        research: 'manage_all',
        rulings: 'none',
        welfare: 'none',
        synergy: 'none',
        finance: 'none',
        alumni: 'none',
        users: 'none',
        admin: 'none',
      };
      await api.updateRbacRolePolicy('research_deputy', {
        sectionPermissions: strictResearchPermissions as Record<string, string>,
      });
      await refreshPolicies();
      await onRefreshUsers();
      showToast('معاون پژوهشی منحصراً به «راهبری پژوهش» و «مشاوره تحصیلی» محدود شد و سایر بخش‌ها از منوی او حذف گردید.');
    } catch (err: any) {
      showToast(`خطا: ${err?.message || err}`);
    } finally {
      setSavingRole(false);
    }
  };

  // Preset 2: Restore default full access for selected role
  const handleRestoreRoleDefault = async () => {
    if (!canEditSelectedRole) return;
    setSavingRole(true);
    try {
      const def = DEFAULT_ROLE_POLICIES[selectedRole];
      await api.updateRbacRolePolicy(selectedRole, {
        sectionPermissions: def.sectionPermissions as Record<string, string>,
        subSectionPermissions: def.subSectionPermissions as Record<string, boolean>,
      });
      await refreshPolicies();
      await onRefreshUsers();
      showToast(`دسترسی‌های پیش‌فرض نقش «${def.roleTitle}» بازنشانی گردید.`);
    } catch (err: any) {
      showToast(`خطا: ${err?.message || err}`);
    } finally {
      setSavingRole(false);
    }
  };

  const handleToggleItemVisibility = async (
    entityType: 'course' | 'product' | 'consumable',
    itemId: string,
    nextVisible: boolean
  ) => {
    try {
      const res = await api.toggleCustomerItemVisibility({
        entityType,
        itemId,
        visibleToCustomer: nextVisible,
      });
      if (entityType === 'course') {
        setCustomerCourses(prev =>
          prev.map(c => (c.id === itemId ? { ...c, visibleToCustomer: nextVisible } : c))
        );
      } else if (entityType === 'product') {
        setCustomerProducts(prev =>
          prev.map(p => (p.id === itemId ? { ...p, visibleToCustomer: nextVisible } : p))
        );
      } else if (entityType === 'consumable') {
        setCustomerConsumables(prev =>
          prev.map(w => (w.id === itemId ? { ...w, visibleToCustomer: nextVisible } : w))
        );
      }
      showToast(res.message);
    } catch (err: any) {
      showToast(`خطا در تغییر نمایش آیتم: ${err?.message || err}`);
    }
  };

  const handleBulkAssignRole = async () => {
    if (selectedUserIds.length === 0) {
      showToast('لطفاً ابتدا حداقل یک کاربر را از فهرست انتخاب نمایید.');
      return;
    }
    setApplyingBulk(true);
    try {
      const roleMeta = NINE_ORGANIZATIONAL_ROLES.find(r => r.id === targetBulkRole);
      const res = await api.bulkAssignUsersRole({
        userIds: selectedUserIds,
        role: targetBulkRole,
        roleTitle: roleMeta?.title,
        applyRoleDefaultPermissions: true,
      });
      setSelectedUserIds([]);
      await onRefreshUsers();
      showToast(res.message);
    } catch (err: any) {
      showToast(`خطا در تخصیص گروهی نقش: ${err?.message || err}`);
    } finally {
      setApplyingBulk(false);
    }
  };

  const filteredBulkUsers = users.filter(u => {
    if (!bulkSearch.trim()) return true;
    const q = bulkSearch.toLowerCase();
    return (
      u.fullName.toLowerCase().includes(q) ||
      u.nationalId.includes(q) ||
      (u.roleTitle && u.roleTitle.toLowerCase().includes(q))
    );
  });

  return (
    <div className="bg-white rounded-[32px] border border-stone-200 shadow-sm p-6 space-y-6" dir="rtl">
      {/* Header & Navigation Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-800 to-teal-900 text-white flex items-center justify-center shadow-md shrink-0">
            <SlidersHorizontal className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-stone-900">
                مرکز فرماندهی ۹ نقش سازمانی، منوهای پویا و ویترین مشتریان
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[11px] font-black border border-emerald-300">
                RBAC + ABAC بلادرنگ
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              هر نقشی می‌تواند شامل چندین کاربر باشد. بخش‌های غیرفعال‌شده («عدم دسترسی») به طور کامل از منوی آن نقش یا کاربر پنهان می‌شوند.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 bg-[#F5F4EE] p-1.5 rounded-2xl border border-stone-200">
          <button
            onClick={() => setActiveTab('roles_matrix')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'roles_matrix'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-stone-700 hover:bg-stone-200/70'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>۱. ماتریس ۹ نقش سازمانی</span>
          </button>

          <button
            onClick={() => setActiveTab('customer_showcase')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'customer_showcase'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-stone-700 hover:bg-stone-200/70'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>۲. ویترین اختصاصی کاربران مشتری</span>
          </button>

          <button
            onClick={() => setActiveTab('bulk_assign')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'bulk_assign'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-stone-700 hover:bg-stone-200/70'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>۳. تخصیص گروهی نقش به کاربران</span>
          </button>
        </div>
      </div>

      {/* Toast Feedback */}
      <AnimatePresence>
        {feedbackMsg && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs font-extrabold flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{feedbackMsg}</span>
            </div>
            <button onClick={() => setFeedbackMsg(null)} className="text-emerald-700 hover:underline text-[11px]">
              بستن
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================
          TAB 1: 9 ROLES PERMISSION MATRIX & PRESETS
          ======================================================================== */}
      {activeTab === 'roles_matrix' && (
        <div className="space-y-6">
          {/* 9 Roles Selector Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {NINE_ORGANIZATIONAL_ROLES.map(roleItem => {
              const count = users.filter(u =>
                roleItem.id === 'admin'
                  ? u.role === 'admin' || u.role === 'super_admin'
                  : u.role === roleItem.id
              ).length;
              const isSelected = selectedRole === roleItem.id;

              return (
                <button
                  key={roleItem.id}
                  onClick={() => setSelectedRole(roleItem.id)}
                  className={`p-4 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                    isSelected
                      ? 'bg-emerald-950 text-white border-emerald-700 shadow-md ring-2 ring-emerald-500/30'
                      : 'bg-[#FAF9F5] hover:bg-white text-stone-900 border-stone-200'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${
                        isSelected
                          ? 'bg-amber-400 text-stone-950 border-amber-300'
                          : roleItem.badgeColor
                      }`}
                    >
                      نقش {toPersianNumbers(roleItem.number)}: {roleItem.shortTitle}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-lg ${
                        isSelected ? 'bg-white/15 text-emerald-200' : 'bg-stone-200/70 text-stone-700'
                      }`}
                    >
                      {toPersianNumbers(count)} کاربر
                    </span>
                  </div>
                  <p className={`text-xs font-extrabold mt-1 ${isSelected ? 'text-white' : 'text-stone-900'}`}>
                    {roleItem.title}
                  </p>
                  <p className={`text-[11px] leading-relaxed ${isSelected ? 'text-stone-300' : 'text-stone-500'}`}>
                    {roleItem.description}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Selected Role Policy Editor */}
          <div className="p-5 rounded-3xl bg-[#F8F7F2] border border-stone-200 space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm sm:text-base font-black text-stone-900">
                    تنظیم سطح دسترسی بخش‌ها برای نقش: «{currentRolePolicy.roleTitle}»
                  </h4>
                  {selectedRole === 'general_observer' && (
                    <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-900 border border-sky-300 text-[11px] font-black">
                      قفل امنیتی: صرفاً مشاهده (بدون حق ویرایش)
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-500 mt-1">
                  {selectedRole === 'admin' || selectedRole === 'super_admin'
                    ? 'ادمین اصلی (سوپر ادمین) به صورت ذاتی به تمامی بخش‌ها دسترسی کامل دارد.'
                    : !canEditSelectedRole
                    ? 'تغییر سطح دسترسی مدیران ارشد منحصراً در اختیار سوپر ادمین است.'
                    : 'هر بخشی که روی «عدم دسترسی» قرار گیرد، بلافاصله از منوی تمامی افراد دارای این نقش حذف شده و در سرور نیز مسدود می‌گردد.'}
                </p>
              </div>

              {/* Smart One-Click Presets */}
              <div className="flex flex-wrap items-center gap-2">
                {selectedRole === 'research_deputy' && isSuperAdmin && (
                  <button
                    onClick={handleApplyResearchDeputyStrictPreset}
                    disabled={savingRole}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-black shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>محدودسازی صرفاً به «پژوهش» و «مشاوره تحصیلی» (حذف سایر منوها)</span>
                  </button>
                )}

                {canEditSelectedRole && (
                  <button
                    onClick={handleRestoreRoleDefault}
                    disabled={savingRole}
                    className="px-3.5 py-2 rounded-xl bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>بازنشانی به پیش‌فرض نقش</span>
                  </button>
                )}
              </div>
            </div>

            {/* Granular Welfare Sub-Section Controls (Especially for Customers & Alumni) */}
            {(selectedRole === 'customer' || selectedRole === 'alumni' || isSuperAdmin) && (
              <div className="p-4 rounded-2xl bg-white border border-emerald-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gift className="w-4 h-4 text-emerald-700" />
                    <span className="text-xs font-black text-stone-900">
                      دسترسی تفکیکی زیربخش‌های «تسهیلات و رفاهیات» برای نقش «{currentRolePolicy.roleTitle}»
                    </span>
                  </div>
                  <span className="text-[11px] text-stone-500 font-medium">
                    مثال: برای مشتریان می‌توانید وام و اسکان را ببندید و فقط خرید اقلام تعاونی را باز بگذارید
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      key: 'welfare_loans' as const,
                      title: 'صندوق وام قرض‌الحسنه',
                      desc: 'امکان ثبت درخواست تسهیلات و وام ضروری',
                    },
                    {
                      key: 'welfare_accommodations' as const,
                      title: 'اسکان و اقامتگاه‌های زیارتی',
                      desc: 'امکان رزرو زائرسرا و اقامتگاه مشهد/قم',
                    },
                    {
                      key: 'welfare_cooperative' as const,
                      title: 'فروشگاه و اقلام تعاونی مصرف',
                      desc: 'امکان مشاهده و خرید ارزاق و کالاهای مجاز',
                    },
                  ].map(sub => {
                    const isEnabled =
                      currentRolePolicy.subSectionPermissions?.[sub.key] !== false;
                    return (
                      <div
                        key={sub.key}
                        className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                          isEnabled
                            ? 'bg-emerald-50/60 border-emerald-300'
                            : 'bg-rose-50/40 border-rose-200'
                        }`}
                      >
                        <div>
                          <p className="text-xs font-extrabold text-stone-900">{sub.title}</p>
                          <p className="text-[10px] text-stone-500 mt-0.5">{sub.desc}</p>
                        </div>
                        <button
                          disabled={!canEditSelectedRole || savingRole}
                          onClick={() => handleUpdateRoleSubSection(sub.key, !isEnabled)}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer shrink-0 ${
                            isEnabled
                              ? 'bg-emerald-700 text-white'
                              : 'bg-rose-600 text-white'
                          } disabled:opacity-50`}
                        >
                          {isEnabled ? 'فعال و مجاز' : 'مسدود / مخفی'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Section Permissions Matrix Table */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ALL_CONFIGURABLE_SECTIONS.map(sec => {
                const Icon = sec.icon;
                const currentLevel: PermissionAccessLevel =
                  currentRolePolicy.sectionPermissions?.[sec.id] || 'none';

                return (
                  <div
                    key={sec.id}
                    className={`p-3.5 rounded-2xl bg-white border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      currentLevel === 'none'
                        ? 'border-rose-200 bg-rose-50/20'
                        : 'border-stone-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          currentLevel === 'none'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-emerald-50 text-emerald-800'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-stone-900">{sec.title}</p>
                        <p className="text-[10px] text-stone-500">
                          {currentLevel === 'none'
                            ? 'مخفی در منوی کاربر و مسدود در سرور'
                            : currentLevel === 'view_all'
                            ? 'صرفاً مشاهده (بدون ویرایش)'
                            : currentLevel === 'manage_all'
                            ? 'دسترسی کامل مشاهده و ویرایش'
                            : 'دسترسی در چارچوب پرونده شخصی'}
                        </p>
                      </div>
                    </div>

                    <select
                      disabled={!canEditSelectedRole || savingRole || sec.id === 'dashboard'}
                      value={currentLevel}
                      onChange={e =>
                        handleUpdateRoleSectionPermission(
                          sec.id,
                          e.target.value as PermissionAccessLevel
                        )
                      }
                      className="px-3 py-2 rounded-xl bg-[#F5F4EE] border border-stone-300 text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 disabled:opacity-60"
                    >
                      {PERMISSION_OPTIONS.filter(opt => {
                        if (selectedRole === 'general_observer') {
                          return opt.value === 'view_all' || opt.value === 'view_own' || opt.value === 'none';
                        }
                        return true;
                      }).map(opt => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================
          TAB 2: CUSTOMER ITEM-LEVEL VISIBILITY (COURSES, PRODUCTS, CONSUMABLES)
          ======================================================================== */}
      {activeTab === 'customer_showcase' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <h4 className="text-xs sm:text-sm font-black text-amber-950">
                تعیین دقیق دوره‌ها، کتب و کالاهای قابل مشاهده برای «کاربران مشتری»
              </h4>
              <p className="text-xs text-amber-900/80">
                سوپر ادمین و مدیر دانش‌آموختگان در این بخش مشخص می‌کنند کدام دوره، کدام کتاب/محصول و کدام کالای تعاونی برای «کاربران مشتری» قابل دیدن و خرید باشد و کدام موارد منحصراً ویژه «دانش‌آموختگان» باقی بماند.
              </p>
            </div>
            <button
              onClick={loadCustomerVisibilityItems}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold flex items-center gap-1.5 shrink-0 self-start sm:self-auto cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingCustomerItems ? 'animate-spin' : ''}`} />
              <span>به‌روزرسانی فهرست</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Column 1: Courses Visibility for Customers */}
            <div className="p-4 rounded-3xl bg-[#F8F7F2] border border-stone-200 space-y-3">
              <div className="flex items-center justify-between border-b border-stone-200 pb-2.5">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-violet-700" />
                  <h5 className="text-xs font-black text-stone-900">۱. دوره‌های آموزشی ({toPersianNumbers(customerCourses.length)})</h5>
                </div>
                <span className="text-[10px] font-bold text-stone-500">ویترین دوره‌های مشتری</span>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {customerCourses.map(c => (
                  <div
                    key={c.id}
                    className={`p-3 rounded-2xl bg-white border flex items-center justify-between gap-2 ${
                      c.visibleToCustomer ? 'border-emerald-200' : 'border-rose-200 opacity-75'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-stone-900 truncate">{c.title}</p>
                      <p className="text-[10px] text-stone-500 truncate">
                        {c.instructor} · {toPersianNumbers(c.price.toLocaleString())} تومان
                      </p>
                    </div>
                    <button
                      onClick={() => handleToggleItemVisibility('course', c.id, !c.visibleToCustomer)}
                      className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer ${
                        c.visibleToCustomer
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}
                    >
                      {c.visibleToCustomer ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      <span>{c.visibleToCustomer ? 'باز برای مشتری' : 'مخفی برای مشتری'}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 2: Products & Books Visibility for Customers */}
            <div className="p-4 rounded-3xl bg-[#F8F7F2] border border-stone-200 space-y-3">
              <div className="flex items-center justify-between border-b border-stone-200 pb-2.5">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-700" />
                  <h5 className="text-xs font-black text-stone-900">۲. کتب و محصولات ({toPersianNumbers(customerProducts.length)})</h5>
                </div>
                <span className="text-[10px] font-bold text-stone-500">ویترین انتشارات مشتری</span>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {customerProducts.map(p => (
                  <div
                    key={p.id}
                    className={`p-3 rounded-2xl bg-white border flex items-center justify-between gap-2 ${
                      p.visibleToCustomer ? 'border-emerald-200' : 'border-rose-200 opacity-75'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-stone-900 truncate">{p.title}</p>
                      <p className="text-[10px] text-stone-500 truncate">
                        {p.formatTitle} · {toPersianNumbers(p.price.toLocaleString())} تومان
                      </p>
                    </div>
                    <button
                      onClick={() => handleToggleItemVisibility('product', p.id, !p.visibleToCustomer)}
                      className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer ${
                        p.visibleToCustomer
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}
                    >
                      {p.visibleToCustomer ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      <span>{p.visibleToCustomer ? 'باز برای مشتری' : 'مخفی برای مشتری'}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 3: Welfare Cooperative Consumables Visibility for Customers */}
            <div className="p-4 rounded-3xl bg-[#F8F7F2] border border-stone-200 space-y-3">
              <div className="flex items-center justify-between border-b border-stone-200 pb-2.5">
                <div className="flex items-center gap-2">
                  <Gift className="w-4 h-4 text-teal-700" />
                  <h5 className="text-xs font-black text-stone-900">۳. اقلام تعاونی رفاهی ({toPersianNumbers(customerConsumables.length)})</h5>
                </div>
                <span className="text-[10px] font-bold text-stone-500">ویترین تعاونی مشتری</span>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {customerConsumables.map(w => (
                  <div
                    key={w.id}
                    className={`p-3 rounded-2xl bg-white border flex items-center justify-between gap-2 ${
                      w.visibleToCustomer ? 'border-emerald-200' : 'border-rose-200 opacity-75'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-stone-900 truncate">{w.title}</p>
                      <p className="text-[10px] text-stone-500 truncate">
                        {w.category} · {toPersianNumbers(w.cooperativePrice.toLocaleString())} تومان
                      </p>
                    </div>
                    <button
                      onClick={() => handleToggleItemVisibility('consumable', w.id, !w.visibleToCustomer)}
                      className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer ${
                        w.visibleToCustomer
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}
                    >
                      {w.visibleToCustomer ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      <span>{w.visibleToCustomer ? 'باز برای مشتری' : 'مخفی برای مشتری'}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================
          TAB 3: BULK ROLE ASSIGNMENT (MULTIPLE USERS PER ROLE)
          ======================================================================== */}
      {activeTab === 'bulk_assign' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#F8F7F2] border border-stone-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative min-w-[240px] flex-1">
                <input
                  type="text"
                  value={bulkSearch}
                  onChange={e => setBulkSearch(e.target.value)}
                  placeholder="جستجوی نام یا کد ملی کاربران جهت تخصیص گروهی نقش..."
                  className="w-full pr-9 pl-3 py-2 rounded-xl bg-white border border-stone-300 text-xs text-stone-900"
                />
                <Search className="w-4 h-4 text-stone-400 absolute right-3 top-2.5" />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-stone-700">نقش مقصد:</span>
                <select
                  value={targetBulkRole}
                  onChange={e => setTargetBulkRole(e.target.value as UserRole)}
                  className="px-3 py-2 rounded-xl bg-white border border-stone-300 text-xs font-extrabold text-stone-900"
                >
                  {NINE_ORGANIZATIONAL_ROLES.filter(r =>
                    isSuperAdmin ? true : r.id === 'alumni' || r.id === 'customer'
                  ).map(r => (
                    <option key={r.id} value={r.id}>
                      نقش {toPersianNumbers(r.number)}: {r.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleBulkAssignRole}
              disabled={applyingBulk || selectedUserIds.length === 0}
              className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-extrabold flex items-center gap-2 disabled:opacity-50 cursor-pointer shrink-0"
            >
              <UserCheck className="w-4 h-4" />
              <span>
                اعمال نقش به {toPersianNumbers(selectedUserIds.length)} کاربر انتخاب‌شده
              </span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-80 overflow-y-auto p-1">
            {filteredBulkUsers.map(u => {
              const isChecked = selectedUserIds.includes(u.id);
              const meta = NINE_ORGANIZATIONAL_ROLES.find(r =>
                r.id === (u.role === 'super_admin' ? 'admin' : u.role)
              );

              return (
                <div
                  key={u.id}
                  onClick={() => {
                    setSelectedUserIds(prev =>
                      prev.includes(u.id) ? prev.filter(id => id !== u.id) : [...prev, u.id]
                    );
                  }}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-2 ${
                    isChecked
                      ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500/30'
                      : 'bg-white hover:bg-stone-50 border-stone-200'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold text-stone-900 truncate">{u.fullName}</p>
                    <p className="text-[10px] text-stone-500 font-mono">
                      کد ملی: {toPersianNumbers(u.nationalId)}
                    </p>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${meta?.badgeColor || 'bg-stone-100 text-stone-700 border-stone-200'}`}>
                      {meta?.shortTitle || u.roleTitle}
                    </span>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-lg flex items-center justify-center border shrink-0 ${
                      isChecked
                        ? 'bg-emerald-700 border-emerald-700 text-white'
                        : 'border-stone-300 bg-white'
                    }`}
                  >
                    {isChecked && <Check className="w-3.5 h-3.5" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
