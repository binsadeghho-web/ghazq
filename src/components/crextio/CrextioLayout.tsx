import React, { useState, useRef, lazy, Suspense } from 'react';
import { motion } from 'motion/react';
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
const AlumniDirectorySection = lazy(() => import('../alumni/AlumniDirectorySection').then(m => ({ default: m.AlumniDirectorySection })));
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
  Wallet
} from 'lucide-react';
import { toPersianNumbers } from '../../utils/persianNumbers';
import { UserRole } from '../../types';

import { Sidebar, NavTabId } from '../layout/Sidebar';

interface CrextioLayoutProps {
  onToggleToPortalTheme: () => void;
}

export const CrextioLayout: React.FC<CrextioLayoutProps> = ({ onToggleToPortalTheme }) => {
  const { currentUser, users, switchUserRole, logout, crextioConfig, setDesignTheme } = useApp();
  const [activeNav, setActiveNav] = useState<string>('Dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState<boolean>(false);
  const [notificationsOpen, setNotificationsOpen] = useState<boolean>(false);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState<boolean>(false);
  const [counselingDropdownOpen, setCounselingDropdownOpen] = useState<boolean>(false);
  const counselingTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  const isAdminOrSupervisor = currentUser?.role === 'admin' || currentUser?.role === 'supervisor';

  const navItems = [
    { id: 'Dashboard', label: 'داشبورد', icon: ShieldCheck },
    { id: 'People', label: 'کارتابل', icon: Inbox },
    { id: 'Courses', label: 'گالری دوره‌ها', icon: BookOpen },
    { id: 'Products', label: 'ویترین انتشارات', icon: BookOpen },
    { id: 'Counseling', label: 'مشاوره', icon: HeartHandshake },
    { id: 'Research', label: 'راهبری پایان‌نامه‌ها', icon: Compass },
    { id: 'Welfare', label: 'رفاهیات', icon: Gift },
    { id: 'Rulings', label: 'تالار آراء', icon: Laptop },
    { id: 'Synergy', label: 'هم‌افزایی', icon: HeartHandshake },
    ...(isAdminOrSupervisor ? [
      { id: 'Finance', label: 'امور مالی و حسابداری', icon: Wallet },
      { id: 'Alumni', label: 'دانش‌آموختگان', icon: GraduationCap },
      { id: 'Users', label: 'مدیریت کاربران (حساب‌ها)', icon: Users },
      { id: 'Admin', label: 'مدیریت سایت و پایش امنیت', icon: ShieldCheck }
    ] : []),
    { id: 'Setting', label: 'تنظیمات', icon: Settings },
  ];

  const canvasBgClass = 
    crextioConfig.canvasTheme === 'royal_emerald' 
      ? 'bg-[#F2F7F4] border-[#D6E6DE]' 
      : crextioConfig.canvasTheme === 'pure_minimal' 
      ? 'bg-white border-stone-200' 
      : 'bg-[#F8F7F2] border-[#E5E3D8]';

  return (
    <div
      className="min-h-screen bg-[#F4F3ED] text-stone-900 font-sans antialiased selection:bg-emerald-500 relative overflow-x-hidden"
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

      {/* Floating Capsule Dock (Theme 1 Vertical Sidebar on Right Edge) */}
      <Sidebar
        activeTab={mapNavToTabId(activeNav)}
        setActiveTab={(t) => setActiveNav(mapTabIdToNav(t))}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      <div className="relative z-10 max-w-[1650px] mx-auto px-4 sm:px-6 lg:px-8 lg:pr-28 py-5 space-y-5">
        
        {/* TOP BAR: THEME SWITCHER BANNER & ROLE INDICATOR (Hidden for alumni role as requested) */}
        {!currentUser || currentUser.role !== 'alumni' ? (
          <div className="w-full bg-white/90 backdrop-blur-xl rounded-2xl px-4 sm:px-5 py-2.5 border border-stone-200/90 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-amber-600" />
                تم دوم: سامانه و ویترین خدمات مرکز دانش‌آموختگان (طرح میزان)
              </span>
              <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
                نقش فعلی: {currentUser?.role === 'supervisor' ? 'مسئول کارتابل' : 'مدیر ارشد سامانه'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {isAdminOrSupervisor && (
                <>
                  <button
                    onClick={() => setIsCustomizerOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition-all shadow-2xs shrink-0 cursor-pointer"
                  >
                    <Palette className="w-3.5 h-3.5 text-amber-600" />
                    <span>شخصی‌سازی تم ۲</span>
                  </button>

                  <button
                    onClick={onToggleToPortalTheme}
                    className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs active:scale-95 shrink-0 cursor-pointer"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                    <span>تغییر به تم ۱ (پرتال)</span>
                  </button>
                </>
              )}
            </div>
          </div>
        ) : null}

        {/* MAIN HEADER: CENTERED MEGA-MENU BUTTON, BRAND ON RIGHT, ACTIONS ON LEFT */}
        <header className="bg-white/95 backdrop-blur-2xl rounded-[32px] p-3.5 sm:p-4 px-5 sm:px-6 border border-stone-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-30">
          {/* Right: Brand Logo */}
          <button
            onClick={() => setActiveNav('Dashboard')}
            className="flex items-center gap-3 group text-right cursor-pointer shrink-0"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 flex items-center justify-center text-stone-950 shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform border border-amber-300">
              <Scale className="w-7 h-7 stroke-[2.3]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-xl font-extrabold text-stone-900 tracking-tight">سامانه فقه و قضا</h1>
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-900 border border-amber-400/40">
                  میزان
                </span>
              </div>
              <p className="text-[11px] text-emerald-800 font-bold">پرتال و ویترین خدمات نخبگان</p>
            </div>
          </button>

          {/* Center: دکمه و درگاه منو و خدمات سامانه متمرکز در مرکز صفحه */}
          <div className="flex-1 flex justify-center py-1 md:py-0">
            <CrextioServicesMegaMenu activeNav={activeNav} onNavigate={setActiveNav} />
          </div>

          {/* Left: دکمه بازگشت به داشبورد، اعلان‌ها و نمایه کاربری */}
          <div className="flex items-center justify-end gap-3 shrink-0">
            {activeNav !== 'Dashboard' && (
              <button
                onClick={() => setActiveNav('Dashboard')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <span>بازگشت به داشبورد</span>
              </button>
            )}

            <div className="relative">
                <button
                  onClick={() => {
                    setNotificationsOpen(!notificationsOpen);
                    setUserDropdownOpen(false);
                  }}
                  className="relative p-2.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 transition-colors cursor-pointer"
                >
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-600 ring-2 ring-white animate-pulse" />
                </button>

                {/* Notifications Drawer Popover */}
                {notificationsOpen && (
                  <div className="absolute left-0 mt-3 w-80 sm:w-96 bg-white rounded-3xl border border-stone-200 shadow-2xl p-4 text-stone-900 z-50 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-emerald-700" />
                        <span className="text-xs font-bold text-stone-900">اعلان‌ها و رویدادهای ۱,۰۰۰ دانش‌آموخته</span>
                      </div>
                      <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
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
                      className="w-full py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold text-center border border-stone-200 transition-colors cursor-pointer"
                    >
                      بستن اعلان‌ها
                    </button>
                  </div>
                )}
              </div>

              {/* User Account & Role Switcher */}
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2.5 p-1.5 pl-3 rounded-2xl bg-stone-100 hover:bg-stone-200 border border-stone-200 transition-all cursor-pointer"
                >
                  {currentUser?.profilePictureUrl ? (
                    <img src={currentUser.profilePictureUrl} alt={currentUser?.fullName || 'کاربر'} className="w-9 h-9 rounded-xl object-cover shrink-0 shadow-xs border border-stone-200" />
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                      {currentUser?.avatarText || 'کاربر'}
                    </div>
                  )}
                  <div className="text-right text-xs hidden sm:block">
                    <p className="font-bold text-stone-900">{currentUser?.fullName || 'کاربر سیستم'}</p>
                    <p className="text-[10px] text-emerald-800 font-medium truncate max-w-[120px]">
                      {currentUser?.roleTitle || 'دانش‌آموخته'}
                    </p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-stone-500 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* User Account & Role Switcher Dropdown */}
                {userDropdownOpen && (
                  <div className="absolute left-0 mt-3 w-80 bg-white rounded-3xl border border-stone-200 shadow-2xl p-4 text-stone-900 z-50 space-y-3">
                    {/* Profile Header */}
                    <div className="p-3 bg-stone-50 rounded-2xl space-y-1 border border-stone-100">
                      <p className="font-bold text-sm text-stone-900">{currentUser?.fullName}</p>
                      <p className="text-xs text-emerald-800 font-medium">{currentUser?.roleTitle}</p>
                      <p className="text-[11px] text-stone-500 font-mono">کد ملی: {toPersianNumbers(currentUser?.nationalId || '')}</p>
                    </div>

                    {/* Logout Action */}
                    <div className="pt-2 border-t border-stone-200">
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
                )}
              </div>
          </div>
        </header>

        {/* HORIZONTAL NAVIGATION BAR (CENTERED ON SCREEN BELOW HEADER) */}
        <nav className="bg-white/95 backdrop-blur-xl rounded-2xl p-2 px-3 sm:px-4 border border-stone-200/90 shadow-sm overflow-x-auto scrollbar-none z-20 flex justify-center">
          <div className="flex items-center justify-center gap-1.5 min-w-max mx-auto">
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

        {/* WARM ELEGANT CONTENT CANVAS */}
        <main className={`${canvasBgClass} rounded-[40px] p-6 sm:p-8 lg:p-10 shadow-2xl border text-stone-900 min-h-[700px] transition-colors duration-500`}>
          {activeNav === 'Dashboard' ? (
            <CrextioDashboard onNavigateTab={setActiveNav} />
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
            <CrextioSubViews activeNav={activeNav} onNavigate={setActiveNav} />
          )}
        </main>

        {/* FOOTER */}
        <footer className="py-4 text-center text-xs text-stone-400 font-medium space-y-1">
          <p>سامانه و ویترین جامع دانش‌آموختگان فقه و قضا · تمام حقوق محفوظ است ({toPersianNumbers('1403')})</p>
        </footer>
      </div>

      {/* THEME CUSTOMIZER MODAL */}
      <Suspense fallback={null}>
        <ThemeCustomizerModal
          isOpen={isCustomizerOpen}
          onClose={() => setIsCustomizerOpen(false)}
        />
      </Suspense>
    </div>
  );
};
