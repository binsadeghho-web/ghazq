import React, { useState, useRef, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { Theme3DesktopDashboard } from './Theme3DesktopDashboard';
import { CrextioSubViews } from '../crextio/CrextioSubViews';
import { CrextioServicesMegaMenu } from '../crextio/CrextioServicesMegaMenu';
import { UserManagementModule } from '../admin/UserManagementModule';
import { FinanceSection } from '../finance/FinanceSection';
import { GlobalMouseHalo } from '../common/GlobalMouseHalo';
import { ModuleFallback } from '../common/ModuleFallback';
import { MobileDashboardExperience } from '../crextio/MobileDashboardExperience';
import {
  applyNavigationCustomization,
  getResolvedNavigationConfig,
} from '../../utils/navigationConfig';
import {
  Bell,
  Settings,
  ShieldCheck,
  BookOpen,
  Scale,
  GraduationCap,
  Inbox,
  Laptop,
  Gift,
  HeartHandshake,
  LogOut,
  ChevronDown,
  Shield,
  Users,
  Palette,
  Compass,
  Wallet,
  IdCard,
  Menu,
  LayoutGrid,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { toPersianNumbers } from '../../utils/persianNumbers';
import { AppSectionId } from '../../types';
import { AlumniIdentityCardModal } from '../alumni/AlumniIdentityCardModal';
import { calculateProfileCompletion } from '../../utils/profileCompletion';
import {
  canViewSection,
  useRbacPolicies,
  getRoleMetadata,
  isOrganizationalRole,
  isReadOnlyObserverRole,
} from '../../utils/rbacPolicy';
import type { CustomizerTab } from '../admin/ThemeCustomizerModal';

const AdminControlCenter = lazy(() =>
  import('../admin/AdminControlCenter').then(m => ({ default: m.AdminControlCenter }))
);
const ThemeCustomizerModal = lazy(() =>
  import('../admin/ThemeCustomizerModal').then(m => ({ default: m.ThemeCustomizerModal }))
);
const AlumniDirectorySection = lazy(() =>
  import('../alumni/AlumniDirectorySection').then(m => ({ default: m.AlumniDirectorySection }))
);

export const Theme3Layout: React.FC = () => {
  const {
    currentUser,
    logout,
    crextioConfig,
    setDesignTheme,
    isAlumniPreview,
    setIsAlumniPreview,
    toggleAlumniPreview,
  } = useApp();
  const { rolePolicies } = useRbacPolicies();

  const [activeNav, setActiveNav] = useState<string>('Dashboard');
  const [servicesSheetOpen, setServicesSheetOpen] = useState<boolean>(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState<boolean>(false);
  const [notificationsOpen, setNotificationsOpen] = useState<boolean>(false);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState<boolean>(false);
  const [customizerInitialTab, setCustomizerInitialTab] = useState<CustomizerTab>('modules');
  const [isIdentityCardOpen, setIsIdentityCardOpen] = useState<boolean>(false);
  const [counselingDropdownOpen, setCounselingDropdownOpen] = useState<boolean>(false);
  const [hoveredNavId, setHoveredNavId] = useState<string | null>(null);
  const [generalBookingAutoOpenNonce, setGeneralBookingAutoOpenNonce] = useState<number>(0);
  const [subTabNav, setSubTabNav] = useState<{ nav: string; subTab?: string; nonce: number }>({
    nav: 'Dashboard',
    subTab: undefined,
    nonce: 0,
  });
  const counselingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleNavigateDeep = (nav: string, subTab?: string) => {
    setActiveNav(nav);
    setSubTabNav({ nav, subTab, nonce: Date.now() });
  };

  const completionPct = calculateProfileCompletion(currentUser).percentage;
  const isStaffMember = isOrganizationalRole(currentUser?.role);
  const isReadOnlyObserver = isReadOnlyObserverRole(currentUser?.role);
  const currentRoleMeta = getRoleMetadata(currentUser?.role);
  const effectiveStaff = isStaffMember && !isAlumniPreview;
  const isRealAdmin = ['admin', 'super_admin', 'alumni_manager', 'supervisor'].includes(
    currentUser?.role || ''
  );
  const canCustomizeLayout = isRealAdmin && !isReadOnlyObserver && !isAlumniPreview;

  const getNavIconAccent = (id: string): string => {
    switch (id) {
      case 'Dashboard': return 'text-emerald-700';
      case 'People': return 'text-blue-600';
      case 'Courses': return 'text-cyan-700';
      case 'Products': return 'text-violet-700';
      case 'Counseling': return 'text-rose-600';
      case 'Research': return 'text-teal-700';
      case 'Welfare': return 'text-pink-600';
      case 'Rulings': return 'text-amber-700';
      case 'Synergy': return 'text-sky-600';
      case 'Finance': return 'text-emerald-700';
      case 'Alumni': return 'text-teal-700';
      case 'Users': return 'text-indigo-600';
      case 'Admin': return 'text-rose-700';
      default: return 'text-[#0C4A38]';
    }
  };

  const allNavCandidates: Array<{ id: string; sectionId?: AppSectionId; label: string; icon: any }> = [
    { id: 'Dashboard', sectionId: 'dashboard', label: 'داشبورد', icon: ShieldCheck },
    { id: 'People', sectionId: 'cartable', label: 'کارتابل', icon: Inbox },
    { id: 'Courses', sectionId: 'courses', label: 'گالری دوره‌ها', icon: BookOpen },
    { id: 'Products', sectionId: 'products', label: 'کتاب و محصولات چند رسانه‌ای', icon: BookOpen },
    { id: 'Counseling', sectionId: 'counseling', label: 'مشاوره', icon: HeartHandshake },
    { id: 'Research', sectionId: 'research', label: 'راهبری پژوهش و مقاله (خدمات پژوهشی)', icon: Compass },
    { id: 'Welfare', sectionId: 'welfare', label: 'رفاهیات', icon: Gift },
    { id: 'Rulings', sectionId: 'rulings', label: 'تالار آراء', icon: Laptop },
    { id: 'Synergy', sectionId: 'synergy', label: 'هم‌افزایی', icon: HeartHandshake },
    { id: 'Finance', sectionId: 'finance', label: 'امور مالی و حسابداری', icon: Wallet },
    { id: 'Alumni', sectionId: 'alumni', label: 'دانش‌آموختگان', icon: GraduationCap },
    { id: 'Users', sectionId: 'users', label: 'مدیریت کاربران و نقش‌ها', icon: Users },
    { id: 'Admin', sectionId: 'admin', label: 'مدیریت سایت و پایش امنیت', icon: ShieldCheck },
    { id: 'Setting', sectionId: 'admin', label: 'تنظیمات', icon: Settings },
  ];

  const resolvedNav = getResolvedNavigationConfig(crextioConfig.navigationConfig);
  const customizedNav = applyNavigationCustomization(allNavCandidates, resolvedNav.horizontalNavbar, {
    hideInvisible: true,
    alwaysKeepVisibleIds: ['Dashboard'],
  });
  const navItems = customizedNav.filter(item => {
    if (
      !effectiveStaff &&
      (item.id === 'Alumni' ||
        item.id === 'Users' ||
        item.id === 'Admin' ||
        item.id === 'Setting' ||
        item.id === 'Finance')
    ) {
      return false;
    }
    if (!item.sectionId) return effectiveStaff;
    return canViewSection(currentUser, item.sectionId, rolePolicies);
  });

  const mobileBottomTargets = ['Dashboard', 'People', 'Courses', 'Counseling']
    .map(id => navItems.find(n => n.id === id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  const fallbackMobileItems = mobileBottomTargets.length >= 2 ? mobileBottomTargets : navItems.slice(0, 4);

  const isDashboardView =
    activeNav === 'Dashboard' ||
    (!effectiveStaff &&
      (activeNav === 'Finance' ||
        activeNav === 'Alumni' ||
        activeNav === 'Users' ||
        activeNav === 'Admin' ||
        activeNav === 'Setting'));

  return (
    <div
      className="min-h-screen bg-[#F5F3EC] text-stone-900 font-sans antialiased selection:bg-emerald-500 relative overflow-x-clip"
      dir="rtl"
    >
      <GlobalMouseHalo theme="crextio" />

      {/* Subtle Warm Emerald & Gold Atmospheric Glows */}
      <div className="hidden lg:block fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-20 right-1/4 w-[520px] h-[520px] rounded-full bg-emerald-600/[0.045] blur-[140px]" />
        <div className="absolute bottom-0 left-1/3 w-[520px] h-[520px] rounded-full bg-amber-500/[0.05] blur-[140px]" />
      </div>

      <div className="relative z-10 max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-5 pb-28 lg:pb-8 space-y-4 sm:space-y-5">
        {/* READ-ONLY OBSERVER BANNER */}
        {isReadOnlyObserver && (
          <div className="w-full bg-sky-900 text-white rounded-2xl px-4 sm:px-5 py-2.5 border border-sky-400/40 flex items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-extrabold">
              <Shield className="w-4 h-4 text-sky-300 shrink-0" />
              <span>حالت نظارت کلان (صرفاً مشاهده · بدون مجوز ویرایش)</span>
            </div>
            <span className="hidden sm:inline-block px-3 py-1 rounded-full bg-sky-500/20 border border-sky-300/40 text-[11px] font-black text-sky-200 shrink-0">
              صرفاً مشاهده (Read-Only)
            </span>
          </div>
        )}

        {/* TOP BAR WITH 3-THEME TEST SWITCHER */}
        {(!currentUser || isStaffMember) &&
          (isAlumniPreview ? (
            <div className="w-full bg-amber-50/95 border border-amber-300 rounded-2xl px-4 py-2 flex flex-wrap items-center justify-between gap-2.5 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-extrabold text-amber-950 min-w-0">
                <Scale className="w-4 h-4 text-amber-700 shrink-0" />
                <span className="truncate">پیش‌نمایش نمای دانش‌آموخته در تم ۳ (موبایل‌محور) فعال است</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setDesignTheme('crextio')}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-stone-50 border border-amber-300 text-stone-800 text-[11px] font-bold cursor-pointer"
                >
                  تم ۲ (میزان)
                </button>
                <button
                  type="button"
                  onClick={() => setIsAlumniPreview(false)}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 text-[11px] font-black transition-colors cursor-pointer"
                >
                  خروج از پیش‌نمایش
                </button>
              </div>
            </div>
          ) : (
            <div className="hidden lg:flex w-full bg-[#071E17] text-[#FCFCF9] rounded-2xl px-4 py-2 border border-[#F3D078]/30 items-center justify-between gap-3 shadow-[0_8px_24px_-16px_rgba(7,30,23,0.45)]">
              <div className="flex items-center gap-2.5 text-xs min-w-0">
                <Sparkles className="w-4 h-4 text-[#F3D078] shrink-0" />
                <span className="font-bold text-[#FCFCF9] truncate">
                  تم سوم (آزمایشی): نمای لپ‌تاپ با الهام از طراحی تم موبایل
                </span>
                <span aria-hidden="true" className="text-[#F3D078]/40">
                  ·
                </span>
                <span className="text-[11px] font-bold text-[#F3D078] shrink-0">
                  نقش: {currentRoleMeta.title}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {canCustomizeLayout && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomizerInitialTab('navigation');
                        setIsCustomizerOpen(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 min-h-[34px] rounded-xl bg-white/10 hover:bg-white/16 text-[#FCFCF9] border border-white/15 text-xs font-bold transition-colors shrink-0 whitespace-nowrap cursor-pointer"
                    >
                      <Menu className="w-3.5 h-3.5 text-[#F3D078]" />
                      <span>ترتیب و نام منو</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomizerInitialTab('modules');
                        setIsCustomizerOpen(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 min-h-[34px] rounded-xl bg-[#F3D078]/15 hover:bg-[#F3D078]/25 text-[#F3D078] border border-[#F3D078]/35 text-xs font-bold transition-colors shrink-0 whitespace-nowrap cursor-pointer"
                    >
                      <Palette className="w-3.5 h-3.5" />
                      <span>تنظیمات تم ۳</span>
                    </button>
                  </>
                )}

                {isStaffMember && (
                  <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl border border-white/15">
                    <button
                      type="button"
                      onClick={() => setDesignTheme('portal')}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-emerald-100/85 hover:text-white hover:bg-white/10 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      تم ۱ (پرتال)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDesignTheme('crextio')}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-emerald-100/85 hover:text-white hover:bg-white/10 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      تم ۲ (میزان)
                    </button>
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-black bg-[#F3D078] text-[#071E17] shadow-xs whitespace-nowrap">
                      تم ۳ (موبایل‌محور)
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}

        {/* MAIN HEADER BAR */}
        <header
          className={`${
            isDashboardView
              ? 'bg-transparent lg:bg-[#FCFCF9]/96 lg:backdrop-blur-2xl h-12 lg:h-auto px-0.5 lg:py-3.5 lg:px-6 lg:border lg:border-[#DFD8C4] lg:shadow-[0_10px_28px_-20px_rgba(7,30,23,0.14)]'
              : 'bg-white/96 lg:bg-[#FCFCF9]/96 backdrop-blur-md lg:backdrop-blur-2xl rounded-[22px] lg:rounded-[26px] h-14 lg:h-auto px-3 lg:py-3.5 lg:px-6 border border-stone-200/85 lg:border-[#DFD8C4] shadow-[0_8px_24px_-12px_rgba(7,30,23,0.12)]'
          } lg:rounded-[26px] flex items-center justify-between gap-2 sm:gap-4 relative z-30`}
        >
          {/* Right: Brand or Mobile Sub-View Back Button */}
          <div className="flex items-center gap-2 min-w-0 shrink">
            {!isDashboardView && (
              <motion.button
                type="button"
                whileTap={{ scale: 0.92 }}
                onClick={() => setActiveNav('Dashboard')}
                className="lg:hidden w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-950 to-emerald-800 text-amber-300 border border-emerald-700/60 shadow-xs flex items-center justify-center shrink-0 cursor-pointer"
                aria-label="بازگشت به داشبورد"
              >
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            )}

            <button
              type="button"
              onClick={() => setActiveNav('Dashboard')}
              className="flex items-center gap-2.5 lg:gap-3 group text-right cursor-pointer min-w-0 shrink"
            >
              <div
                className={`${
                  !isDashboardView ? 'hidden lg:flex' : 'flex'
                } relative overflow-hidden w-9 h-9 lg:w-11 lg:h-11 rounded-xl lg:rounded-2xl bg-gradient-to-br from-[#071E17] via-[#0D3327] to-[#134636] items-center justify-center text-[#F3D078] shadow-sm border border-[#F3D078]/45 shrink-0 transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3`}
              >
                <Scale className="w-4.5 h-4.5 lg:w-6 lg:h-6 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-sm lg:text-lg font-black text-[#071E17] tracking-tight truncate">
                    {!isDashboardView
                      ? navItems.find(n => n.id === activeNav)?.label ||
                        crextioConfig.brandMainTitle ||
                        'سامانه فقه و قضا'
                      : crextioConfig.brandMainTitle || 'سامانه فقه و قضا'}
                  </h1>
                  {isDashboardView && (
                    <span className="hidden sm:inline-block text-[10px] font-black px-2 py-0.5 rounded-md bg-[#071E17] text-[#F3D078] border border-[#F3D078]/35 shrink-0">
                      نمای ۳
                    </span>
                  )}
                </div>
                <p className="hidden lg:block text-[11px] text-[#4C6358] font-semibold truncate">
                  {crextioConfig.brandSubtitleText || 'پرتال و ویترین خدمات نخبگان'}
                </p>
              </div>
            </button>
          </div>

          {/* Center: Shared Services Mega Menu */}
          <div className="md:flex-1 flex justify-center">
            <CrextioServicesMegaMenu
              activeNav={activeNav}
              onNavigate={setActiveNav}
              externalOpen={servicesSheetOpen}
              onExternalOpenChange={setServicesSheetOpen}
              hideTriggerOnMobile={true}
            />
          </div>

          {/* Left: Back to Dashboard, Identity Card, Notifications, Profile */}
          <div className="flex items-center justify-end gap-1.5 lg:gap-2 shrink-0">
            {!isDashboardView && (
              <button
                type="button"
                onClick={() => setActiveNav('Dashboard')}
                className="hidden lg:flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-xl bg-[#071E17] hover:bg-[#0D3227] text-[#F3D078] border border-[#F3D078]/35 text-xs font-extrabold transition-all shadow-xs cursor-pointer whitespace-nowrap"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>بازگشت به داشبورد</span>
              </button>
            )}

            {currentUser && (
              <button
                type="button"
                onClick={() => setIsIdentityCardOpen(true)}
                className="hidden lg:flex items-center gap-2 px-3 py-2 min-h-[40px] rounded-xl bg-[#F5F2E8] hover:bg-[#EFEADB] text-[#071E17] border border-[#DFD8C4] text-xs font-black transition-colors cursor-pointer whitespace-nowrap"
                title="مشاهده و تکمیل کارت اطلاعات هویتی من"
              >
                <IdCard className="w-4 h-4 text-[#0C4A38] shrink-0" />
                <span className="hidden xl:inline">کارت هویتی من</span>
                <span className="text-[11px] font-black text-[#0C4A38] tabular-nums">
                  {toPersianNumbers(completionPct)}٪
                </span>
              </button>
            )}

            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotificationsOpen(!notificationsOpen);
                  setUserDropdownOpen(false);
                }}
                className="relative w-10 h-10 rounded-xl bg-[#F5F2E8]/90 hover:bg-[#EAE4D4] text-[#071E17] border border-[#DFD8C4] transition-colors cursor-pointer flex items-center justify-center"
                aria-label="اعلان‌ها"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-emerald-600" />
              </button>

              {notificationsOpen && (
                <>
                  <div
                    className="sm:hidden fixed inset-0 bg-stone-950/35 z-40"
                    onClick={() => setNotificationsOpen(false)}
                  />
                  <div className="fixed inset-x-3 top-20 sm:top-auto sm:inset-x-auto sm:absolute sm:left-0 sm:mt-3 sm:w-96 bg-[#FCFCF9] rounded-3xl border border-[#DFD8C4] shadow-2xl p-4 text-stone-900 z-50 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-[#ECE6D6]">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-[#071E17]" />
                        <span className="text-xs font-black text-[#071E17]">اعلان‌ها و رویدادهای مجمع</span>
                      </div>
                      <span className="text-[11px] font-extrabold text-[#0C4A38] shrink-0 tabular-nums">
                        {toPersianNumbers('۴')} پیام تازه
                      </span>
                    </div>

                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {[
                        {
                          title: 'صدور گواهی پایه قضایی',
                          desc: 'گواهی پایه ۹ قضایی شما با مهر دیجیتال تایید و آماده دریافت شد.',
                          time: '۱۰ دقیقه پیش',
                          unread: true,
                        },
                        {
                          title: 'همایش سراسری دانش‌آموختگان',
                          desc: 'گردهمایی سالانه ۱,۰۰۰ قاضی و پژوهشگر در قم. ثبت‌نام از بخش رفاهیات.',
                          time: '۲ ساعت پیش',
                          unread: true,
                        },
                        {
                          title: 'نقد جدید در تالار آراء',
                          desc: 'جناب استاد موسوی به رأی شماره ۹۴۳ پاسخ تحلیلی ثبت نمودند.',
                          time: 'دیروز',
                          unread: false,
                        },
                        {
                          title: 'عرضه کتاب خارج فقه القضا',
                          desc: 'جلد پنجم موسوعه القضا با تخفیف ویژه اعضا بارگذاری شد.',
                          time: '۳ روز پیش',
                          unread: false,
                        },
                      ].map((n, idx) => (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-2xl border text-xs transition-colors ${
                            n.unread
                              ? 'bg-[#F2F7F4] border-[#CFE0D6]'
                              : 'bg-[#F7F4EC] border-[#E7E0CD] text-stone-600'
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold text-[#071E17]">
                            <span>{n.title}</span>
                            <span className="text-[10px] text-[#525E58] font-normal">{n.time}</span>
                          </div>
                          <p className="text-[11px] text-[#525E58] mt-1 leading-relaxed">{n.desc}</p>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => setNotificationsOpen(false)}
                      className="w-full py-2.5 sm:py-2 rounded-xl bg-[#F2EFE4] hover:bg-[#E7E1CF] text-[#071E17] text-xs font-bold text-center border border-[#DFD8C4] transition-colors cursor-pointer"
                    >
                      بستن اعلان‌ها
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setUserDropdownOpen(!userDropdownOpen);
                  setNotificationsOpen(false);
                }}
                className="flex items-center gap-1.5 sm:gap-2.5 p-1 sm:p-1.5 sm:pl-3 min-h-[40px] rounded-xl bg-[#F5F2E8]/90 hover:bg-[#EAE4D4] border border-[#DFD8C4] transition-colors cursor-pointer"
              >
                {currentUser?.profilePictureUrl ? (
                  <img
                    src={currentUser.profilePictureUrl}
                    alt={currentUser?.fullName || 'کاربر'}
                    className="w-8 h-8 rounded-lg object-cover shrink-0 border border-[#DFD8C4]"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-[#071E17] text-[#F3D078] flex items-center justify-center font-bold text-xs sm:text-sm">
                    {currentUser?.avatarText || 'کاربر'}
                  </div>
                )}
                <div className="text-right text-xs hidden sm:block">
                  <p className="font-extrabold text-[#071E17]">{currentUser?.fullName || 'کاربر سیستم'}</p>
                  <p className="text-[10px] text-[#0C4A38] font-semibold truncate max-w-[130px]">
                    {currentUser?.roleTitle || 'دانش‌آموخته'}
                  </p>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-[#525E58] transition-transform ${
                    userDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {userDropdownOpen && (
                <>
                  <div
                    className="sm:hidden fixed inset-0 bg-stone-950/35 z-40"
                    onClick={() => setUserDropdownOpen(false)}
                  />
                  <div className="fixed inset-x-3 top-20 sm:top-auto sm:inset-x-auto sm:absolute sm:left-0 sm:mt-3 sm:w-80 bg-[#FCFCF9] rounded-3xl border border-[#DFD8C4] shadow-2xl p-4 text-[#121D19] z-50 space-y-3">
                    <div className="p-3 bg-[#FAF8F2] rounded-2xl space-y-1 border border-[#E5DEC9]">
                      <p className="font-bold text-sm text-[#121D19]">{currentUser?.fullName}</p>
                      <p className="text-xs text-[#0C4A38] font-medium">{currentUser?.roleTitle}</p>
                      <p className="text-[11px] text-[#525E58] tabular-nums">
                        کد ملی: {toPersianNumbers(currentUser?.nationalId || '')}
                      </p>
                      <p className="text-[11px] text-[#0C4A38] tabular-nums font-bold">
                        کد مرکز: {currentUser?.centerCode || 'ثبت نشده'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        setIsIdentityCardOpen(true);
                      }}
                      className="w-full py-2.5 px-3 rounded-xl bg-[#FAF8F2] hover:bg-[#F2EDE0] text-[#071E17] text-xs font-black flex items-center justify-between border border-[#DFD8C4] transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <IdCard className="w-4 h-4 text-[#0C4A38]" />
                        <span>کارت اطلاعات هویتی من</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-[#071E17] text-[#F3D078] text-[10px] tabular-nums">
                        {toPersianNumbers(completionPct)}٪
                      </span>
                    </button>

                    {isStaffMember && !isAlumniPreview && (
                      <div className="lg:hidden space-y-1.5 pt-1 border-t border-stone-100">
                        <button
                          type="button"
                          onClick={() => {
                            setUserDropdownOpen(false);
                            setDesignTheme('crextio');
                          }}
                          className="w-full py-2 px-3 rounded-xl bg-emerald-50 text-emerald-900 text-xs font-bold flex items-center justify-center border border-emerald-200 cursor-pointer"
                        >
                          بازگشت به تم ۲ (میزان)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setUserDropdownOpen(false);
                            setDesignTheme('portal');
                          }}
                          className="w-full py-2 px-3 rounded-xl bg-stone-100 text-stone-800 text-xs font-bold flex items-center justify-center border border-stone-200 cursor-pointer"
                        >
                          تغییر به تم ۱ (پرتال)
                        </button>
                      </div>
                    )}

                    <div className="pt-2 border-t border-stone-200 space-y-2">
                      <button
                        type="button"
                        onClick={() => {
                          logout();
                          setUserDropdownOpen(false);
                        }}
                        className="w-full py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold flex items-center justify-center gap-2 border border-red-200 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-red-600" />
                        <span>خروج از حساب کاربری</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* COMPACT DESKTOP HORIZONTAL NAV BAR (Matches Theme 3 Obsidian Emerald & Gold Language) */}
        <nav
          aria-label="منوی اصلی سامانه در تم ۳"
          className="hidden lg:block relative bg-gradient-to-l from-[#FCFCF9]/96 via-[#FAF7EE]/96 to-[#F2F7F4]/96 backdrop-blur-2xl rounded-[22px] py-2 px-3.5 border border-[#DDD4BC] shadow-[0_12px_30px_-20px_rgba(7,30,23,0.22)] z-20"
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-14 top-0 h-px bg-gradient-to-l from-transparent via-[#D4AF37]/65 to-transparent"
          />
          <div
            onMouseLeave={() => setHoveredNavId(null)}
            className="flex items-center justify-start xl:justify-center gap-1.5 overflow-x-auto scrollbar-none py-0.5 px-0.5"
          >
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive =
                activeNav === item.id ||
                (item.id === 'Counseling' &&
                  (activeNav === 'CounselingGeneral' || activeNav === 'SpecializedCounseling'));
              const isHovered = hoveredNavId === item.id;
              const iconAccent = getNavIconAccent(item.id);

              if (item.id === 'Counseling') {
                return (
                  <div
                    key={item.id}
                    className="relative shrink-0"
                    onMouseEnter={() => {
                      setHoveredNavId(item.id);
                      if (counselingTimerRef.current) clearTimeout(counselingTimerRef.current);
                      setCounselingDropdownOpen(true);
                    }}
                    onMouseLeave={() => {
                      if (counselingTimerRef.current) clearTimeout(counselingTimerRef.current);
                      counselingTimerRef.current = setTimeout(() => {
                        setCounselingDropdownOpen(false);
                      }, 450);
                    }}
                  >
                    <motion.button
                      type="button"
                      whileHover={{ y: -1.5 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => setActiveNav('Counseling')}
                      className={`group relative flex items-center gap-2 px-3.5 py-2 min-h-[40px] rounded-xl text-xs font-extrabold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                        isActive ? 'text-[#F3D078]' : 'text-[#3F4D46] hover:text-[#071E17]'
                      }`}
                    >
                      {isHovered && !isActive && (
                        <motion.span
                          layoutId="theme3DesktopNavHover"
                          transition={{ type: 'spring', stiffness: 460, damping: 34 }}
                          className="absolute inset-0 rounded-xl bg-gradient-to-l from-[#EFE8D5] to-[#E6F0EA] border border-[#D7CEB5]/70"
                        />
                      )}
                      {isActive && (
                        <motion.span
                          layoutId="theme3DesktopNavActivePill"
                          transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                          className="absolute inset-0 rounded-xl bg-gradient-to-l from-[#071E17] via-[#0C3126] to-[#134434] shadow-[0_8px_18px_-8px_rgba(7,30,23,0.5)] border border-[#F3D078]/35 overflow-hidden"
                        >
                          <span
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-l from-transparent via-[#F3D078]/85 to-transparent"
                          />
                        </motion.span>
                      )}
                      <Icon
                        className={`relative z-10 w-4 h-4 shrink-0 ${
                          isActive ? 'text-[#F3D078]' : iconAccent
                        }`}
                      />
                      <span className="relative z-10">{item.label}</span>
                      <ChevronDown
                        className={`relative z-10 w-3.5 h-3.5 opacity-75 shrink-0 transition-transform duration-200 ${
                          counselingDropdownOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </motion.button>

                    <AnimatePresence>
                      {counselingDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.96 }}
                          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                          className="absolute right-0 mt-2.5 w-72 bg-[#FCFCF9]/98 backdrop-blur-xl rounded-2xl border border-[#D8CEB4] shadow-[0_22px_48px_-16px_rgba(7,30,23,0.3)] p-2 z-50 space-y-1.5"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setActiveNav('CounselingGeneral');
                              setCounselingDropdownOpen(false);
                            }}
                            className="w-full text-right p-2.5 rounded-xl hover:bg-rose-50/90 text-xs font-bold text-[#071E17] flex items-center justify-between gap-2 group cursor-pointer border border-transparent hover:border-rose-200/70 transition-all"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 border border-rose-200/80 flex items-center justify-center shrink-0">
                                <HeartHandshake className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-black">خدمات روانشناختی و مشاوره</p>
                                <p className="text-[10px] text-[#525E58] font-medium">خانواده، شخصیت و ازدواج</p>
                              </div>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveNav('SpecializedCounseling');
                              setCounselingDropdownOpen(false);
                            }}
                            className="w-full text-right p-2.5 rounded-xl hover:bg-amber-50/90 text-xs font-bold text-[#071E17] flex items-center justify-between gap-2 group cursor-pointer border border-transparent hover:border-amber-200/70 transition-all"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 border border-amber-200/80 flex items-center justify-center shrink-0">
                                <Scale className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-black">مشاوره تخصصی شغلی</p>
                                <p className="text-[10px] text-[#525E58] font-medium">هدایت قضایی و تحصیلی</p>
                              </div>
                            </div>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              }

              return (
                <motion.button
                  key={item.id}
                  type="button"
                  whileHover={{ y: -1.5 }}
                  whileTap={{ scale: 0.96 }}
                  onMouseEnter={() => setHoveredNavId(item.id)}
                  onClick={() => setActiveNav(item.id)}
                  className={`group relative flex items-center gap-2 px-3.5 py-2 min-h-[40px] rounded-xl text-xs font-extrabold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    isActive ? 'text-[#F3D078]' : 'text-[#3F4D46] hover:text-[#071E17]'
                  }`}
                >
                  {isHovered && !isActive && (
                    <motion.span
                      layoutId="theme3DesktopNavHover"
                      transition={{ type: 'spring', stiffness: 460, damping: 34 }}
                      className="absolute inset-0 rounded-xl bg-gradient-to-l from-[#EFE8D5] to-[#E6F0EA] border border-[#D7CEB5]/70"
                    />
                  )}
                  {isActive && (
                    <motion.span
                      layoutId="theme3DesktopNavActivePill"
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                      className="absolute inset-0 rounded-xl bg-gradient-to-l from-[#071E17] via-[#0C3126] to-[#134434] shadow-[0_8px_18px_-8px_rgba(7,30,23,0.5)] border border-[#F3D078]/35 overflow-hidden"
                    >
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-l from-transparent via-[#F3D078]/85 to-transparent"
                      />
                    </motion.span>
                  )}
                  <Icon
                    className={`relative z-10 w-4 h-4 shrink-0 ${
                      isActive ? 'text-[#F3D078]' : iconAccent
                    }`}
                  />
                  <span className="relative z-10">{item.label}</span>
                </motion.button>
              );
            })}
          </div>
        </nav>

        {/* MAIN CONTENT AREA */}
        <main
          className={
            isDashboardView
              ? 'min-h-[60vh]'
              : 'bg-[#FAF8F2] border border-[#DFD8C4] rounded-2xl lg:rounded-[30px] p-3.5 lg:p-7 xl:p-8 shadow-[0_14px_40px_-24px_rgba(7,30,23,0.12)] text-stone-900 min-h-[60vh] sm:min-h-[700px]'
          }
        >
          {isDashboardView ? (
            <>
              {/* Desktop/Laptop (>= lg): Mobile-Inspired Laptop Experience */}
              <div className="hidden lg:block">
                <Theme3DesktopDashboard
                  onNavigateTab={nav => {
                    setSubTabNav({ nav, subTab: undefined, nonce: 0 });
                    setActiveNav(nav);
                  }}
                  onNavigateDeep={handleNavigateDeep}
                  onOpenAllServices={() => setServicesSheetOpen(true)}
                  onBookGeneralCounseling={() => {
                    setGeneralBookingAutoOpenNonce(n => n + 1);
                    setActiveNav('CounselingGeneral');
                  }}
                  onOpenIdentityCard={() => setIsIdentityCardOpen(true)}
                  isAdmin={canCustomizeLayout}
                  isRealAdmin={isRealAdmin}
                  isAlumni={!effectiveStaff}
                  isAlumniPreview={isAlumniPreview}
                  onToggleAlumniPreview={toggleAlumniPreview}
                />
              </div>

              {/* Mobile (< lg): Native Mobile Experience */}
              <div className="lg:hidden">
                <MobileDashboardExperience
                  onNavigateTab={nav => {
                    setSubTabNav({ nav, subTab: undefined, nonce: 0 });
                    setActiveNav(nav);
                  }}
                  onNavigateDeep={handleNavigateDeep}
                  onOpenAllServices={() => setServicesSheetOpen(true)}
                  onBookGeneralCounseling={() => {
                    setGeneralBookingAutoOpenNonce(n => n + 1);
                    setActiveNav('CounselingGeneral');
                  }}
                  onOpenIdentityCard={() => setIsIdentityCardOpen(true)}
                  onOpenCustomizer={() => {
                    setCustomizerInitialTab('modules');
                    setIsCustomizerOpen(true);
                  }}
                  onToggleAlumniPreview={toggleAlumniPreview}
                  isAdmin={canCustomizeLayout}
                  isRealAdmin={isRealAdmin}
                  isAlumni={!effectiveStaff}
                  isAlumniPreview={isAlumniPreview}
                />
              </div>
            </>
          ) : activeNav === 'Finance' ? (
            <FinanceSection />
          ) : activeNav === 'Alumni' ? (
            <Suspense fallback={<ModuleFallback />}>
              <AlumniDirectorySection onNavigate={setActiveNav} />
            </Suspense>
          ) : activeNav === 'Users' ? (
            <UserManagementModule />
          ) : activeNav === 'Admin' ? (
            <Suspense fallback={<ModuleFallback />}>
              <AdminControlCenter />
            </Suspense>
          ) : (
            <CrextioSubViews
              activeNav={activeNav}
              onNavigate={setActiveNav}
              deepLinkSubTab={subTabNav.nav === activeNav ? subTabNav.subTab : undefined}
              deepLinkNonce={subTabNav.nav === activeNav ? subTabNav.nonce : undefined}
              autoOpenGeneralBookingNonce={generalBookingAutoOpenNonce}
            />
          )}
        </main>

        <footer className="py-4 text-center text-xs text-stone-400 font-medium space-y-1">
          <p>سامانه و ویترین جامع دانش‌آموختگان فقه و قضا · تمام حقوق محفوظ است ({toPersianNumbers('1403')})</p>
        </footer>
      </div>

      {/* THEME CUSTOMIZER MODAL */}
      {effectiveStaff && (
        <Suspense fallback={null}>
          <ThemeCustomizerModal
            isOpen={isCustomizerOpen}
            initialTab={customizerInitialTab}
            onClose={() => setIsCustomizerOpen(false)}
          />
        </Suspense>
      )}

      {/* IDENTITY CARD MODAL */}
      <AlumniIdentityCardModal
        isOpen={isIdentityCardOpen}
        onClose={() => setIsIdentityCardOpen(false)}
      />

      {/* RESPONSIVE MOBILE BOTTOM DOCK (< lg) */}
      <nav
        aria-label="ناوبری پایین موبایل"
        className="lg:hidden fixed bottom-2.5 inset-x-3 z-40 rounded-[26px] bg-gradient-to-l from-[#FCFCF9]/96 via-[#FAF8F2]/96 to-[#F2F7F4]/96 backdrop-blur-md border border-[#D8CEB4] px-2 py-1.5 flex items-center justify-around gap-1 shadow-[0_18px_36px_-14px_rgba(7,30,23,0.3)] safe-area-bottom"
      >
        {fallbackMobileItems.map(item => {
          const Icon = item.icon;
          const isActive = activeNav === item.id;
          const iconAccent = getNavIconAccent(item.id);
          return (
            <motion.button
              key={item.id}
              type="button"
              whileTap={{ scale: 0.9 }}
              onClick={() => setActiveNav(item.id)}
              className={`relative flex flex-col items-center justify-center flex-1 min-h-[52px] min-w-[44px] py-1 rounded-2xl transition-colors cursor-pointer ${
                isActive ? 'text-[#F3D078] font-black' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="theme3MobileDockPill"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  className="absolute inset-0 rounded-2xl bg-gradient-to-b from-[#071E17] to-[#113C2E] border border-[#F3D078]/40 shadow-sm"
                />
              )}
              <div className="relative z-10 flex flex-col items-center">
                <Icon
                  className={`w-[19px] h-[19px] ${
                    isActive ? 'text-[#F3D078] stroke-[2.4]' : `${iconAccent} stroke-[2]`
                  }`}
                />
                <span className="text-[10px] mt-0.5 whitespace-nowrap truncate max-w-[64px]">
                  {item.id === 'Courses' ? 'دوره‌ها' : item.id === 'People' ? 'کارتابل' : item.label}
                </span>
              </div>
            </motion.button>
          );
        })}

        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          onClick={() => setServicesSheetOpen(true)}
          className="relative flex flex-col items-center justify-center flex-1 min-h-[52px] min-w-[44px] py-1 rounded-2xl cursor-pointer group"
        >
          <div className="relative overflow-hidden w-9 h-7 rounded-xl bg-gradient-to-br from-[#071E17] via-[#0E3226] to-emerald-800 text-[#F3D078] border border-[#F3D078]/45 shadow-sm flex items-center justify-center">
            <LayoutGrid className="w-4 h-4 stroke-[2.2]" />
          </div>
          <span className="text-[10px] mt-0.5 font-extrabold text-[#071E17] whitespace-nowrap">
            همه بخش‌ها
          </span>
        </motion.button>
      </nav>
    </div>
  );
};
