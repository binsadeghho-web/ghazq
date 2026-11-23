import React, { useState, useRef, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { CrextioDashboard } from './CrextioDashboard';
import { CrextioSubViews } from './CrextioSubViews';
import { CrextioServicesMegaMenu } from './CrextioServicesMegaMenu';
import { UserManagementModule } from '../admin/UserManagementModule';
import { FinanceSection } from '../finance/FinanceSection';
import { GlobalMouseHalo } from '../common/GlobalMouseHalo';
import { ModuleFallback } from '../common/ModuleFallback';

const AdminControlCenter = lazy(() => import('../admin/AdminControlCenter').then(m => ({ default: m.AdminControlCenter })));
const ThemeCustomizerModal = lazy(() => import('../admin/ThemeCustomizerModal').then(m => ({ default: m.ThemeCustomizerModal })));
import type { CustomizerTab } from '../admin/ThemeCustomizerModal';
const AlumniDirectorySection = lazy(() => import('../alumni/AlumniDirectorySection').then(m => ({ default: m.AlumniDirectorySection })));
import {
  applyNavigationCustomization,
  getResolvedNavigationConfig,
} from '../../utils/navigationConfig';
import {
  Bell,
  User as UserIcon,
  Settings,
  Sparkles,
  ArrowLeftRight,
  ShieldCheck,
  Search,
  BookOpen,
  Scale,
  GraduationCap,
  Inbox,
  Laptop,
  Gift,
  HeartHandshake,
  LogOut,
  UserCheck,
  ChevronDown,
  Shield,
  UserPlus,
  Users,
  Palette,
  Compass,
  Wallet,
  IdCard,
  Menu,
  LayoutGrid,
  ArrowRight
} from 'lucide-react';
import { toPersianNumbers } from '../../utils/persianNumbers';
import { UserRole, AppSectionId } from '../../types';
import { AlumniIdentityCardModal } from '../alumni/AlumniIdentityCardModal';
import { calculateProfileCompletion } from '../../utils/profileCompletion';
import {
  canViewSection,
  useRbacPolicies,
  getRoleMetadata,
  isOrganizationalRole,
  isReadOnlyObserverRole,
  isSuperAdminRole,
  NINE_ORGANIZATIONAL_ROLES,
} from '../../utils/rbacPolicy';

import { NavTabId } from '../../types';

interface CrextioLayoutProps {
  onToggleToPortalTheme: () => void;
}

export const CrextioLayout: React.FC<CrextioLayoutProps> = ({ onToggleToPortalTheme }) => {
  const { currentUser, users, switchUserRole, logout, crextioConfig, productsStoreConfig, setDesignTheme, isAlumniPreview, setIsAlumniPreview } = useApp();
  const { rolePolicies } = useRbacPolicies();
  const [activeNav, setActiveNav] = useState<string>('Dashboard');
  const [servicesSheetOpen, setServicesSheetOpen] = useState<boolean>(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState<boolean>(false);
  const [notificationsOpen, setNotificationsOpen] = useState<boolean>(false);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState<boolean>(false);
  const [customizerInitialTab, setCustomizerInitialTab] = useState<CustomizerTab>('modules');
  const [isIdentityCardOpen, setIsIdentityCardOpen] = useState<boolean>(false);
  const [counselingDropdownOpen, setCounselingDropdownOpen] = useState<boolean>(false);
  const [generalBookingAutoOpenNonce, setGeneralBookingAutoOpenNonce] = useState<number>(0);
  const counselingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const completionPct = calculateProfileCompletion(currentUser).percentage;

  const mapNavToTabId = (nav: string): NavTabId => {
    const n = nav.toLowerCase();
    if (n === 'people') return 'cartable';
    if (n === 'specializedcounseling') return 'specialized_counseling';
    if (n === 'counselinggeneral') return 'counseling';
    if (n === 'finance') return 'finance';
    return (n as NavTabId) || 'dashboard';
  };

  const mapTabIdToNav = (tabId: NavTabId): string => {
    switch (tabId) {
      case 'dashboard': return 'Dashboard';
      case 'cartable': return 'People';
      case 'courses': return 'Courses';
      case 'products': return 'Products';
      case 'counseling': return 'Counseling';
      case 'specialized_counseling': return 'SpecializedCounseling';
      case 'research': return 'Research';
      case 'rulings': return 'Rulings';
      case 'welfare': return 'Welfare';
      case 'synergy': return 'Synergy';
      case 'alumni': return 'Alumni';
      case 'users': return 'Users';
      case 'finance': return 'Finance';
      case 'admin': return 'Admin';
      default: return 'Dashboard';
    }
  };

  const isStaffMember = isOrganizationalRole(currentUser?.role);
  const isReadOnlyObserver = isReadOnlyObserverRole(currentUser?.role);
  const currentRoleMeta = getRoleMetadata(currentUser?.role);

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

  // Strict Menu Cloaking (Reform 57): Hide Alumni, Users, Admin, Setting, Finance from alumni & preview mode
  const effectiveStaff = isStaffMember && !isAlumniPreview;
  const resolvedNav = getResolvedNavigationConfig(crextioConfig.navigationConfig);
  const customizedNav = applyNavigationCustomization(allNavCandidates, resolvedNav.horizontalNavbar, {
    hideInvisible: true,
    alwaysKeepVisibleIds: ['Dashboard'],
  });
  const navItems = customizedNav.filter(item => {
    if (!effectiveStaff && (item.id === 'Alumni' || item.id === 'Users' || item.id === 'Admin' || item.id === 'Setting' || item.id === 'Finance')) {
      return false;
    }
    if (!item.sectionId) return effectiveStaff;
    return canViewSection(currentUser, item.sectionId, rolePolicies);
  });
  const canCustomizeLayout =
    ['admin', 'super_admin', 'alumni_manager', 'supervisor'].includes(currentUser?.role || '') &&
    !isReadOnlyObserver &&
    !isAlumniPreview;

  const canvasBgClass = 
    crextioConfig.canvasTheme === 'royal_emerald' 
      ? 'bg-[#F2F7F4] border-[#D6E6DE]' 
      : crextioConfig.canvasTheme === 'pure_minimal' 
      ? 'bg-white border-stone-200' 
      : 'bg-[#F8F7F2] border-[#E5E3D8]';

  // Mobile Bottom Bar: pick top 4 primary destinations respecting RBAC & customizer labels + "همه خدمات" bottom sheet trigger
  const mobileBottomTargets = ['Dashboard', 'People', 'Courses', 'Counseling']
    .map(id => navItems.find(n => n.id === id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  const fallbackMobileItems = mobileBottomTargets.length >= 2 ? mobileBottomTargets : navItems.slice(0, 4);

  return (
    <div
      className="min-h-screen bg-[#F4F3ED] text-stone-900 font-sans antialiased selection:bg-emerald-500 relative overflow-x-clip"
      dir="rtl"
    >
      {/* Dynamic Global Mouse Halo and Dust Trail for Theme 2 */}
      <GlobalMouseHalo theme="crextio" />

      {/* Warm Ambient Glows (Subtle and Light) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] rounded-full bg-emerald-500/5 blur-[140px]" />
        <div className="absolute bottom-0 left-1/3 w-[600px] h-[600px] rounded-full bg-amber-500/5 blur-[140px]" />
        <div className="absolute top-1/2 left-10 w-[400px] h-[400px] rounded-full bg-teal-500/5 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-[1650px] mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-5 pb-28 lg:pb-6 space-y-3 sm:space-y-5">
        
        {/* READ-ONLY OBSERVER BANNER FOR GENERAL OBSERVER (ناظر کل) */}
        {isReadOnlyObserver && (
          <div className="w-full bg-sky-900 text-white rounded-2xl px-4 sm:px-5 py-2.5 sm:py-3 border border-sky-400/40 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3 shadow-sm">
            <div className="flex items-center gap-2 text-[11px] sm:text-xs font-extrabold">
              <Shield className="w-4 h-4 text-sky-300 shrink-0" />
              <span>
                حالت نظارت کلان (صرفاً مشاهده · بدون مجوز ویرایش)
              </span>
            </div>
            <span className="hidden sm:inline-block px-3 py-1 rounded-full bg-sky-500/20 border border-sky-300/40 text-[11px] font-black text-sky-200 shrink-0">
              صرفاً مشاهده (Read-Only)
            </span>
          </div>
        )}

        {/* TOP BAR: THEME SWITCHER BANNER & ROLE INDICATOR (Desktop >= lg; mobile preview banner stays slim) */}
        {!currentUser || isStaffMember ? (
          isAlumniPreview ? (
            <div className="w-full bg-amber-50/95 border border-amber-300 rounded-2xl px-3.5 sm:px-5 py-2 flex items-center justify-between gap-2.5 shadow-2xs">
              <div className="flex items-center gap-2 text-[11px] sm:text-xs font-extrabold text-amber-950 min-w-0">
                <Scale className="w-4 h-4 text-amber-700 shrink-0" />
                <span className="truncate">پیش‌نمایش نمای دانش‌آموخته فعال است</span>
              </div>
              <button
                type="button"
                onClick={() => setIsAlumniPreview(false)}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 text-[11px] sm:text-xs font-black transition-colors cursor-pointer shrink-0"
              >
                خروج از پیش‌نمایش
              </button>
            </div>
          ) : (
            <div className="hidden lg:flex w-full bg-white/90 backdrop-blur-xl rounded-2xl px-5 py-2.5 border border-stone-200/90 items-center justify-between gap-3 shadow-xs">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-amber-600" />
                  {crextioConfig.theme2TopBarTitle || 'تم دوم: سامانه و ویترین خدمات مرکز دانش‌آموختگان (طرح میزان)'}
                </span>
                <span className={`px-3 py-1 rounded-full border text-xs font-extrabold ${currentRoleMeta.badgeColor}`}>
                  نقش فعلی: {currentRoleMeta.title}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {canCustomizeLayout && (
                  <>
                    <button
                      onClick={() => {
                        setCustomizerInitialTab('navigation');
                        setIsCustomizerOpen(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-bold transition-all shadow-2xs shrink-0 whitespace-nowrap cursor-pointer"
                    >
                      <Menu className="w-3.5 h-3.5 text-emerald-700" />
                      <span>ترتیب و نام منو</span>
                    </button>
                    <button
                      onClick={() => {
                        setCustomizerInitialTab('modules');
                        setIsCustomizerOpen(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-full bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition-all shadow-2xs shrink-0 whitespace-nowrap cursor-pointer"
                    >
                      <Palette className="w-3.5 h-3.5 text-amber-600" />
                      <span>شخصی‌سازی تم ۲</span>
                    </button>
                  </>
                )}

                {isStaffMember && (
                    <button
                      onClick={onToggleToPortalTheme}
                      className="flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs active:scale-95 shrink-0 whitespace-nowrap cursor-pointer"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                      <span>تم ۱ (پرتال)</span>
                    </button>
                )}
              </div>
            </div>
          )
        ) : null}

        {/* MAIN HEADER: ULTRA-SLIM MASTHEAD ON MOBILE DASHBOARD (< lg), APP BAR IN SUB-VIEWS, 3-ZONE MEGA-MENU ON DESKTOP */}
        <header
          className={`${
            activeNav === 'Dashboard'
              ? 'bg-transparent lg:bg-white/95 lg:backdrop-blur-2xl h-12 lg:h-auto px-0.5 lg:p-4 lg:px-6 lg:border lg:border-stone-200/90 lg:shadow-sm'
              : 'bg-white/92 lg:bg-white/95 backdrop-blur-2xl rounded-[22px] lg:rounded-[32px] h-14 lg:h-auto px-3 lg:p-4 lg:px-6 border border-stone-200/85 lg:border-stone-200/90 shadow-[0_8px_24px_-12px_rgba(7,30,23,0.12)] lg:shadow-sm'
          } lg:rounded-[32px] flex items-center justify-between gap-2 sm:gap-4 relative z-30`}
        >
          {/* Subtle gold hairline glow along top edge on mobile sub-views */}
          {activeNav !== 'Dashboard' && (
            <span
              aria-hidden="true"
              className="lg:hidden pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-l from-transparent via-amber-400/55 to-transparent"
            />
          )}
          {/* Right: Brand Logo OR Back to Dashboard in Mobile Sub-Views */}
          <div className="flex items-center gap-2 min-w-0 shrink">
            {activeNav !== 'Dashboard' && (
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
              onClick={() => setActiveNav('Dashboard')}
              className="flex items-center gap-2.5 group text-right cursor-pointer min-w-0 shrink"
            >
              <div className={`${activeNav !== 'Dashboard' ? 'hidden lg:flex' : 'flex'} w-9 h-9 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl bg-gradient-to-br from-[#071E17] to-[#113D30] lg:from-amber-300 lg:via-amber-500 lg:to-yellow-600 items-center justify-center text-[#F3D078] lg:text-stone-950 shadow-sm lg:shadow-md border border-[#F3D078]/35 lg:border-amber-200 shrink-0`}>
                <Scale className="w-4.5 h-4.5 lg:w-7 lg:h-7 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-sm lg:text-xl font-black lg:font-extrabold text-stone-900 tracking-tight truncate">
                    {activeNav !== 'Dashboard'
                      ? navItems.find(n => n.id === activeNav)?.label ||
                        crextioConfig.brandMainTitle ||
                        'سامانه فقه و قضا'
                      : crextioConfig.brandMainTitle || 'سامانه فقه و قضا'}
                  </h1>
                  {activeNav === 'Dashboard' && (
                    <span className="hidden sm:inline-block text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-900 border border-amber-400/40 shrink-0">
                      {crextioConfig.brandBadgeText || 'میزان'}
                    </span>
                  )}
                </div>
                <p className="hidden lg:block text-[11px] text-emerald-800 font-bold truncate">
                  {crextioConfig.brandSubtitleText || 'پرتال و ویترین خدمات نخبگان'}
                </p>
              </div>
            </button>
          </div>

          {/* Center: Mega-Menu trigger on desktop + shared mobile bottom sheet portal */}
          <div className="md:flex-1 flex justify-center">
            <CrextioServicesMegaMenu
              activeNav={activeNav}
              onNavigate={setActiveNav}
              externalOpen={servicesSheetOpen}
              onExternalOpenChange={setServicesSheetOpen}
              hideTriggerOnMobile={true}
            />
          </div>

          {/* Left: Back to Dashboard (Desktop), Identity Card (Desktop), Notifications & Profile */}
          <div className="flex items-center justify-end gap-1.5 lg:gap-2.5 shrink-0">
            {activeNav !== 'Dashboard' && (
              <button
                onClick={() => setActiveNav('Dashboard')}
                className="hidden lg:flex items-center gap-1 px-3.5 py-2 min-h-[40px] rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-800 border border-emerald-500/40 text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <span>بازگشت به داشبورد</span>
              </button>
            )}

            {/* Reform 56: My Identity Card Button (Desktop; on Mobile integrated cleanly into Hero & Profile Drawer) */}
            {currentUser && (
              <button
                onClick={() => setIsIdentityCardOpen(true)}
                className="hidden lg:flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-black transition-all shadow-2xs cursor-pointer"
                title="مشاهده و تکمیل کارت اطلاعات هویتی من"
              >
                <IdCard className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="hidden xl:inline">کارت اطلاعات هویتی من</span>
                <span className="px-1.5 py-0.5 rounded-lg bg-emerald-800 text-white text-[10px] font-black tabular-nums">
                  {toPersianNumbers(completionPct)}٪
                </span>
              </button>
            )}

            <div className="relative">
                <button
                  onClick={() => {
                    setNotificationsOpen(!notificationsOpen);
                    setUserDropdownOpen(false);
                  }}
                  className="relative w-10 h-10 lg:w-auto lg:h-auto lg:p-2.5 rounded-xl lg:rounded-2xl bg-stone-100/90 hover:bg-stone-200 text-stone-700 border border-stone-200/80 transition-colors cursor-pointer flex items-center justify-center"
                  aria-label="اعلان‌ها"
                >
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-emerald-600" />
                </button>

                {/* Notifications Drawer Popover (Viewport-safe on 360px phones) */}
                {notificationsOpen && (
                  <>
                    <div
                      className="sm:hidden fixed inset-0 bg-stone-950/35 z-40"
                      onClick={() => setNotificationsOpen(false)}
                    />
                    <div className="fixed inset-x-3 top-20 sm:top-auto sm:inset-x-auto sm:absolute sm:left-0 sm:mt-3 sm:w-96 bg-white rounded-3xl border border-stone-200 shadow-2xl p-4 text-stone-900 z-50 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                        <div className="flex items-center gap-2">
                          <Bell className="w-4 h-4 text-emerald-700" />
                          <span className="text-xs font-bold text-stone-900">اعلان‌ها و رویدادهای ۱,۰۰۰ دانش‌آموخته</span>
                        </div>
                        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                          {toPersianNumbers('۴')} پیام تازه
                        </span>
                      </div>

                      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {[
                          { title: 'صدور گواهی پایه قضایی', desc: 'گواهی پایه ۹ قضایی شما با مهر دیجیتال تایید و آماده دریافت شد.', time: '۱۰ دقیقه پیش', unread: true },
                          { title: 'همایش سراسری دانش‌آموختگان', desc: 'گردهمایی سالانه ۱,۰۰۰ قاضی و پژوهشگر در قم. ثبت‌نام از بخش رفاهیات.', time: '۲ ساعت پیش', unread: true },
                          { title: 'نقد جدید در تالار آراء', desc: 'جناب استاد موسوی به رأی شماره ۹۴۳ پاسخ تحلیلی ثبت نمودند.', time: 'دیروز', unread: false },
                          { title: 'عرضه کتاب خارج فقه القضا', desc: 'جلد پنجم موسوعه القضا با تخفیف ویژه اعضا بارگذاری شد.', time: '۳ روز پیش', unread: false },
                        ].map((n, idx) => (
                          <div key={idx} className={`p-2.5 rounded-2xl border text-xs transition-colors ${n.unread ? 'bg-emerald-50/70 border-emerald-200' : 'bg-stone-50 border-stone-200/60 text-stone-600'}`}>
                            <div className="flex items-center justify-between font-bold text-stone-900">
                              <span>{n.title}</span>
                              <span className="text-[10px] text-stone-500 font-normal">{n.time}</span>
                            </div>
                            <p className="text-[11px] text-stone-600 mt-1 leading-relaxed">{n.desc}</p>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={() => setNotificationsOpen(false)}
                        className="w-full py-2.5 sm:py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold text-center border border-stone-200 transition-colors cursor-pointer"
                      >
                        بستن اعلان‌ها
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* User Account & Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setUserDropdownOpen(!userDropdownOpen);
                    setNotificationsOpen(false);
                  }}
                  className="flex items-center gap-1.5 sm:gap-2.5 p-1 sm:p-1.5 sm:pl-3 min-h-[40px] rounded-xl sm:rounded-2xl bg-stone-100 hover:bg-stone-200 border border-stone-200 transition-all cursor-pointer"
                >
                  {currentUser?.profilePictureUrl ? (
                    <img src={currentUser.profilePictureUrl} alt={currentUser?.fullName || 'کاربر'} className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl object-cover shrink-0 shadow-xs border border-stone-200" />
                  ) : (
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white flex items-center justify-center font-bold text-xs sm:text-sm shadow-xs">
                      {currentUser?.avatarText || 'کاربر'}
                    </div>
                  )}
                  <div className="text-right text-xs hidden sm:block">
                    <p className="font-bold text-stone-900">{currentUser?.fullName || 'کاربر سیستم'}</p>
                    <p className="text-[10px] text-emerald-800 font-medium truncate max-w-[120px]">
                      {currentUser?.roleTitle || 'دانش‌آموخته'}
                    </p>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-stone-500 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* User Account Dropdown (Viewport-safe on mobile) */}
                {userDropdownOpen && (
                  <>
                    <div
                      className="sm:hidden fixed inset-0 bg-stone-950/35 z-40"
                      onClick={() => setUserDropdownOpen(false)}
                    />
                    <div className="fixed inset-x-3 top-20 sm:top-auto sm:inset-x-auto sm:absolute sm:left-0 sm:mt-3 sm:w-80 bg-white rounded-3xl border border-stone-200 shadow-2xl p-4 text-stone-900 z-50 space-y-3">
                      {/* Profile Header */}
                      <div className="p-3 bg-stone-50 rounded-2xl space-y-1 border border-stone-100">
                        <p className="font-bold text-sm text-stone-900">{currentUser?.fullName}</p>
                        <p className="text-xs text-emerald-800 font-medium">{currentUser?.roleTitle}</p>
                        <p className="text-[11px] text-stone-500 font-mono">کد ملی: {toPersianNumbers(currentUser?.nationalId || '')}</p>
                        <p className="text-[11px] text-emerald-800 font-mono font-bold">کد مرکز: {currentUser?.centerCode || 'ثبت نشده'}</p>
                      </div>

                      {/* Reform 56: Open Identity Card from dropdown */}
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          setIsIdentityCardOpen(true);
                        }}
                        className="w-full py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-black flex items-center justify-between border border-emerald-200 transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <IdCard className="w-4 h-4 text-emerald-700" />
                          <span>کارت اطلاعات هویتی من</span>
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-800 text-white text-[10px] tabular-nums">
                          {toPersianNumbers(completionPct)}٪
                        </span>
                      </button>

                      {/* Mobile Admin & Theme Shortcuts (Consolidated cleanly from hidden top bar) */}
                      {(canCustomizeLayout || isStaffMember) && !isAlumniPreview && (
                        <div className="lg:hidden space-y-1.5 pt-1 border-t border-stone-100">
                          {canCustomizeLayout && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setUserDropdownOpen(false);
                                  setCustomizerInitialTab('navigation');
                                  setIsCustomizerOpen(true);
                                }}
                                className="w-full py-2 px-3 rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-800 text-xs font-bold flex items-center gap-2 border border-stone-200/80 cursor-pointer"
                              >
                                <Menu className="w-4 h-4 text-emerald-700" />
                                <span>ترتیب و نام منوها</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setUserDropdownOpen(false);
                                  setCustomizerInitialTab('modules');
                                  setIsCustomizerOpen(true);
                                }}
                                className="w-full py-2 px-3 rounded-xl bg-amber-50/70 hover:bg-amber-100 text-amber-900 text-xs font-bold flex items-center gap-2 border border-amber-200/80 cursor-pointer"
                              >
                                <Palette className="w-4 h-4 text-amber-600" />
                                <span>شخصی‌سازی تم ۲</span>
                              </button>
                            </>
                          )}
                          {isStaffMember && (
                            <button
                              type="button"
                              onClick={() => {
                                setUserDropdownOpen(false);
                                onToggleToPortalTheme();
                              }}
                              className="w-full py-2 px-3 rounded-xl bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 cursor-pointer"
                            >
                              <ArrowLeftRight className="w-4 h-4" />
                              <span>تغییر به تم ۱ (پرتال)</span>
                            </button>
                          )}
                        </div>
                      )}

                      {/* Logout Action */}
                      <div className="pt-2 border-t border-stone-200 space-y-2">
                        <button
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

        {/* HORIZONTAL NAVIGATION BAR (Desktop / Tablet Landscape; Mobile uses Thumb Bottom Tab Bar) */}
        <nav className="hidden lg:block bg-white/95 backdrop-blur-xl rounded-2xl p-2 px-3 sm:px-4 border border-stone-200/90 shadow-sm overflow-x-auto scrollbar-none z-20">
          <div className="flex items-center justify-start xl:justify-center gap-1 min-w-max mx-auto">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;

              if (item.id === 'Counseling') {
                return (
                  <div
                    key={item.id}
                    className="relative"
                    onMouseEnter={() => {
                      if (counselingTimerRef.current) clearTimeout(counselingTimerRef.current);
                      setCounselingDropdownOpen(true);
                    }}
                    onMouseLeave={() => {
                      if (counselingTimerRef.current) clearTimeout(counselingTimerRef.current);
                      counselingTimerRef.current = setTimeout(() => {
                        setCounselingDropdownOpen(false);
                      }, 2000);
                    }}
                  >
                    <button
                      onClick={() => setActiveNav('Counseling')}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'text-stone-700 hover:bg-stone-100 hover:text-stone-900'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-amber-300' : 'text-emerald-700'}`} />
                      <span>{item.label}</span>
                      <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                    </button>

                    {/* 2-Option Counseling Dropdown */}
                    {counselingDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-stone-200 shadow-xl p-2 z-50 space-y-1">
                        <button
                          onClick={() => {
                            setActiveNav('Counseling');
                            setCounselingDropdownOpen(false);
                          }}
                          className="w-full text-right p-2.5 rounded-xl hover:bg-emerald-50 text-xs font-bold text-stone-800 flex items-center justify-between group cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <HeartHandshake className="w-4 h-4 text-emerald-700" />
                            <div>
                              <p className="group-hover:text-emerald-900">مشاوره عمومی</p>
                              <p className="text-[10px] text-stone-500 font-normal">خانواده، شخصیت و ازدواج</p>
                            </div>
                          </div>
                          <span className="text-[10px] bg-stone-100 group-hover:bg-emerald-100 text-stone-600 group-hover:text-emerald-800 px-2 py-0.5 rounded-full">عمومی</span>
                        </button>

                        <button
                          onClick={() => {
                            setActiveNav('SpecializedCounseling');
                            setCounselingDropdownOpen(false);
                          }}
                          className="w-full text-right p-2.5 rounded-xl hover:bg-amber-50 text-xs font-bold text-stone-800 flex items-center justify-between group cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <Scale className="w-4 h-4 text-amber-600" />
                            <div>
                              <p className="group-hover:text-amber-900">مشاوره تخصصی شغلی</p>
                              <p className="text-[10px] text-stone-500 font-normal">هدایت قضایی و تحصیلی</p>
                            </div>
                          </div>
                          <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-bold">تخصصی</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveNav(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-stone-700 hover:bg-stone-100 hover:text-stone-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-300' : 'text-emerald-700'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* WARM ELEGANT CONTENT CANVAS (Seamless edge-to-edge on mobile Dashboard, framed on Desktop >= lg) */}
        <main
          className={`${canvasBgClass} ${
            activeNav === 'Dashboard' ||
            (!effectiveStaff &&
              (activeNav === 'Finance' ||
                activeNav === 'Alumni' ||
                activeNav === 'Users' ||
                activeNav === 'Admin' ||
                activeNav === 'Setting'))
              ? 'max-lg:!bg-transparent max-lg:!border-0 max-lg:!shadow-none max-lg:!p-0 max-lg:!rounded-none'
              : 'rounded-2xl p-3.5 shadow-sm border'
          } lg:rounded-[40px] lg:p-10 lg:shadow-2xl lg:border text-stone-900 min-h-[60vh] sm:min-h-[700px] transition-colors duration-500`}
        >
          {activeNav === 'Dashboard' || (!effectiveStaff && (activeNav === 'Finance' || activeNav === 'Alumni' || activeNav === 'Users' || activeNav === 'Admin' || activeNav === 'Setting')) ? (
            <CrextioDashboard
              onNavigateTab={setActiveNav}
              onOpenAllServices={() => setServicesSheetOpen(true)}
              onBookGeneralCounseling={() => {
                setGeneralBookingAutoOpenNonce(n => n + 1);
                setActiveNav('CounselingGeneral');
              }}
            />
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
              autoOpenGeneralBookingNonce={generalBookingAutoOpenNonce}
            />
          )}
        </main>

        {/* FOOTER */}
        <footer className="py-4 text-center text-xs text-stone-400 font-medium space-y-1">
          <p>سامانه و ویترین جامع دانش‌آموختگان فقه و قضا · تمام حقوق محفوظ است ({toPersianNumbers('1403')})</p>
        </footer>
      </div>

      {/* THEME CUSTOMIZER MODAL (Only for authorized staff) */}
      {effectiveStaff && (
        <Suspense fallback={null}>
          <ThemeCustomizerModal
            isOpen={isCustomizerOpen}
            initialTab={customizerInitialTab}
            onClose={() => setIsCustomizerOpen(false)}
          />
        </Suspense>
      )}

      {/* Reform 56: Self-Service Identity Card Modal */}
      <AlumniIdentityCardModal
        isOpen={isIdentityCardOpen}
        onClose={() => setIsIdentityCardOpen(false)}
      />

      {/* Floating Luxury Frosted Mobile Bottom Dock for Theme 2 (Crextio) */}
      <nav
        aria-label="ناوبری پایین موبایل"
        className="lg:hidden fixed bottom-2.5 inset-x-3 z-40 rounded-[26px] bg-white/92 backdrop-blur-2xl border border-stone-200/90 px-2 py-1.5 flex items-center justify-around gap-1 shadow-[0_16px_40px_-14px_rgba(7,30,23,0.28),inset_0_1px_0_rgba(255,255,255,0.9)] safe-area-bottom"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-l from-transparent via-amber-400/50 to-transparent"
        />
        {fallbackMobileItems.map(item => {
          const Icon = item.icon;
          const isActive = activeNav === item.id;
          return (
            <motion.button
              key={item.id}
              type="button"
              whileTap={{ scale: 0.92 }}
              onClick={() => setActiveNav(item.id)}
              className={`relative flex flex-col items-center justify-center flex-1 min-h-[50px] min-w-[44px] py-1 rounded-2xl transition-colors cursor-pointer ${
                isActive ? 'text-emerald-950 font-black' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="crextioMobileDockPill"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  className="absolute inset-0 rounded-2xl bg-gradient-to-b from-emerald-50 to-amber-50/70 border border-emerald-200/80 shadow-2xs"
                />
              )}
              <div className="relative z-10 flex flex-col items-center">
                <Icon className={`w-[19px] h-[19px] transition-transform ${isActive ? 'text-emerald-800 stroke-[2.4] -translate-y-0.5' : 'stroke-[1.9]'}`} />
                <span className="text-[10px] mt-0.5 whitespace-nowrap truncate max-w-[64px]">
                  {item.id === 'Courses' ? 'دوره‌ها' : item.id === 'People' ? 'کارتابل' : item.label}
                </span>
              </div>
            </motion.button>
          );
        })}

        <motion.button
          type="button"
          whileTap={{ scale: 0.92 }}
          onClick={() => setServicesSheetOpen(true)}
          className="relative flex flex-col items-center justify-center flex-1 min-h-[50px] min-w-[44px] py-1 rounded-2xl cursor-pointer group"
        >
          <div className="w-9 h-7 rounded-xl bg-gradient-to-br from-[#071E17] via-[#0E3226] to-emerald-800 text-amber-300 border border-amber-400/35 shadow-sm flex items-center justify-center group-active:scale-95 transition-transform">
            <LayoutGrid className="w-4 h-4 stroke-[2.2]" />
          </div>
          <span className="text-[10px] mt-0.5 font-extrabold text-emerald-950 whitespace-nowrap">
            همه بخش‌ها
          </span>
        </motion.button>
      </nav>

      {/* Floating Alumni Preview Exit Bar (ONLY for staff in preview mode, offset cleanly above floating dock) */}
      {isStaffMember && isAlumniPreview && (
        <div className="fixed bottom-22 lg:bottom-6 inset-x-3 sm:inset-x-auto sm:left-6 z-40 flex items-center justify-between sm:justify-start gap-2.5 bg-slate-950/95 text-white backdrop-blur-md px-3.5 sm:px-4 py-2.5 rounded-2xl border border-indigo-500/40 shadow-2xl">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            <span className="text-[11px] sm:text-xs font-bold text-slate-200 truncate">پیش‌نمایش دانش‌آموخته فعال است</span>
          </div>
          <button
            onClick={() => setIsAlumniPreview(false)}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl text-[11px] sm:text-xs font-black transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
          >
            بازگشت به مدیریت
          </button>
        </div>
      )}
    </div>
  );
};
