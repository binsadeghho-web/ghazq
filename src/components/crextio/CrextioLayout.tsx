import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { CrextioDashboard } from './CrextioDashboard';
import { CrextioSubViews } from './CrextioSubViews';
import { UserManagementModule } from '../admin/UserManagementModule';
import { ThemeCustomizerModal } from '../admin/ThemeCustomizerModal';
import { AlumniDirectorySection } from '../alumni/AlumniDirectorySection';
import { AdminControlCenter } from '../admin/AdminControlCenter';
import { GlobalMouseHalo } from '../common/GlobalMouseHalo';
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
  Compass
} from 'lucide-react';
import { toPersianNumbers } from '../../utils/persianNumbers';
import { UserRole } from '../../types';

interface CrextioLayoutProps {
  onToggleToPortalTheme: () => void;
}

export const CrextioLayout: React.FC<CrextioLayoutProps> = ({ onToggleToPortalTheme }) => {
  const { currentUser, users, switchUserRole, logout, crextioConfig } = useApp();
  const [activeNav, setActiveNav] = useState<string>('Dashboard');
  const [hoveredNav, setHoveredNav] = useState<string>('Dashboard');
  const [userDropdownOpen, setUserDropdownOpen] = useState<boolean>(false);
  const [notificationsOpen, setNotificationsOpen] = useState<boolean>(false);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState<boolean>(false);
  const [counselingDropdownOpen, setCounselingDropdownOpen] = useState<boolean>(false);

  const isAdminOrSupervisor = currentUser?.role === 'admin' || currentUser?.role === 'supervisor';

  const navItems = [
    { id: 'Dashboard', label: 'داشبورد', icon: ShieldCheck },
    { id: 'People', label: 'کارتابل', icon: Inbox },
    { id: 'Courses', label: 'گالری دوره‌ها', icon: BookOpen },
    { id: 'Products', label: 'ویترین انتشارات', icon: BookOpen },
    { id: 'Counseling', label: 'مشاوره', icon: Laptop },
    { id: 'Research', label: 'راهبری پایان‌نامه‌ها', icon: Compass },
    { id: 'Welfare', label: 'رفاهیات', icon: Gift },
    { id: 'Rulings', label: 'تالار آراء', icon: Scale },
    { id: 'Synergy', label: 'هم‌افزایی', icon: HeartHandshake },
    ...(isAdminOrSupervisor ? [
      { id: 'Alumni', label: 'دانش‌آموختگان', icon: GraduationCap },
      { id: 'Users', label: 'مدیریت کاربران {حساب‌های کاربری}', icon: Users },
      { id: 'Admin', label: 'مدیریت', icon: ShieldCheck }
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
      className="min-h-screen bg-[#0F1715] text-stone-100 font-sans antialiased selection:bg-emerald-500 relative overflow-x-hidden"
      dir="rtl"
    >
      {/* Dynamic Global Mouse Halo and Dust Trail for Theme 2 */}
      <GlobalMouseHalo theme="crextio" />

      {/* Warm Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] rounded-full bg-emerald-600/10 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 w-[600px] h-[600px] rounded-full bg-amber-600/10 blur-[120px]" />
        <div className="absolute top-1/2 left-10 w-[400px] h-[400px] rounded-full bg-teal-600/10 blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* TOP BAR: THEME SWITCHER BANNER & ROLE INDICATOR */}
        <div className="w-full bg-[#182622]/90 backdrop-blur-xl rounded-2xl px-5 py-3 border border-[#2A423B] flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
              تم دوم: سامانه و ویترین خدمات مرکز دانش‌آموختگان فقه و قضا
            </span>
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold">
              نقش فعلی: {currentUser?.role === 'alumni' ? 'دانش‌آموخته (قاضی/پژوهشگر)' : currentUser?.role === 'supervisor' ? 'مسئول کارتابل' : 'مدیر ارشد سامانه'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isAdminOrSupervisor && (
              <button
                onClick={() => setIsCustomizerOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all shadow-xs shrink-0"
              >
                <Palette className="w-3.5 h-3.5" />
                <span>شخصی‌سازی تم ۲</span>
              </button>
            )}

            <button
              onClick={onToggleToPortalTheme}
              className="flex items-center gap-2 px-5 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 shrink-0"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>تغییر به تم ۱ (پرتال اصلی)</span>
            </button>
          </div>
        </div>

        {/* MAIN HEADER & NAVIGATION */}
        <header className="bg-[#182622]/95 backdrop-blur-2xl rounded-[32px] p-4 sm:p-5 border border-[#2A423B] shadow-xl flex flex-col xl:flex-row xl:items-center justify-between gap-4 relative z-30">
          {/* Logo Brand */}
          <div className="flex items-center justify-between sm:justify-start gap-4">
            <button
              onClick={() => setActiveNav('Dashboard')}
              className="flex items-center gap-3 group text-right"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-white tracking-tight">فقه و قضا</h1>
                <p className="text-[11px] text-emerald-400 font-bold">سامانه و ویترین خدمات</p>
              </div>
            </button>
          </div>

          {/* Nav Items with Floating Green Indicator & 1s Return Mechanism */}
          <nav 
            className="relative flex items-center gap-1 flex-wrap xl:flex-nowrap p-1.5 bg-[#121E1B] rounded-2xl border border-[#233832] overflow-visible z-40"
            onMouseLeave={() => {
              // Reset hover to active tab after 1 second if mouse leaves nav
              const timer = setTimeout(() => {
                setHoveredNav(activeNav);
              }, 1000);
              return () => clearTimeout(timer);
            }}
          >
            {navItems.map(item => {
              const isActive = activeNav.toLowerCase() === item.id.toLowerCase() || (item.id === 'Counseling' && (activeNav === 'CounselingSpecial' || activeNav === 'CounselingGeneral'));
              const isHovered = (hoveredNav || activeNav).toLowerCase() === item.id.toLowerCase();
              const Icon = item.icon;
              return (
                <div key={item.id} className="relative">
                  <button
                    onClick={() => {
                      if (item.id === 'Counseling') {
                        setCounselingDropdownOpen(!counselingDropdownOpen);
                      } else {
                        setCounselingDropdownOpen(false);
                        setActiveNav(item.id);
                        setHoveredNav(item.id);
                      }
                    }}
                    onMouseEnter={() => {
                      setHoveredNav(item.id);
                      if (item.id !== 'Counseling') setCounselingDropdownOpen(false);
                    }}
                    className={`relative z-10 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors duration-200 whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'text-stone-950 font-black'
                        : isHovered
                        ? 'text-emerald-300'
                        : 'text-stone-300 hover:text-white'
                    }`}
                  >
                    {/* Floating Green Pill Indicator */}
                    {isHovered && (
                      <motion.div
                        layoutId="crextioNavPill"
                        className="absolute inset-0 bg-emerald-500 rounded-xl -z-10 shadow-lg shadow-emerald-500/20"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    <Icon className={`w-4 h-4 ${isActive || isHovered ? 'text-stone-950' : 'text-emerald-400'}`} />
                    <span>{item.label}</span>
                    {item.id === 'Counseling' && <ChevronDown className="w-3.5 h-3.5 mr-1" />}
                  </button>

                  {/* Counseling Dropdown Menu */}
                  {item.id === 'Counseling' && counselingDropdownOpen && (
                    <div className="absolute top-full right-0 mt-2 w-72 bg-[#182622] border border-[#2A423B] rounded-2xl shadow-2xl p-2 z-50 space-y-1 text-xs">
                      <div className="px-3 py-2 text-[10px] font-bold text-emerald-400 border-b border-[#2A423B]">
                        انتخاب بخش مشاوره:
                      </div>
                      <button
                        onClick={() => {
                          setActiveNav('CounselingSpecial');
                          setCounselingDropdownOpen(false);
                        }}
                        className="w-full text-right px-3.5 py-2.5 rounded-xl hover:bg-emerald-500/20 text-stone-200 hover:text-white font-bold transition-colors flex items-center justify-between"
                      >
                        <span>مشاوره تخصصی تحصیلی و شغلی</span>
                        <ChevronDown className="w-3 h-3 -rotate-90 text-emerald-400" />
                      </button>
                      <button
                        onClick={() => {
                          setActiveNav('CounselingGeneral');
                          setCounselingDropdownOpen(false);
                        }}
                        className="w-full text-right px-3.5 py-2.5 rounded-xl hover:bg-emerald-500/20 text-stone-200 hover:text-white font-bold transition-colors flex items-center justify-between"
                      >
                        <span>خدمات مشاوره عمومی (شخصیت، ازدواج، خانواده و...)</span>
                        <ChevronDown className="w-3 h-3 -rotate-90 text-emerald-400" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* USER PROFILE & ROLE SWITCHER DROPDOWN */}
          <div className="relative shrink-0 self-end xl:self-center">
            <div className="flex items-center gap-3">
              <div className="relative">
                <button
                  onClick={() => {
                    setNotificationsOpen(!notificationsOpen);
                    setUserDropdownOpen(false);
                  }}
                  className="relative p-2.5 rounded-2xl bg-[#233832] hover:bg-[#2C473F] text-stone-200 border border-[#34544B] transition-colors"
                >
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#182622] animate-pulse" />
                </button>

                {/* Notifications Drawer Popover */}
                {notificationsOpen && (
                  <div className="absolute left-0 mt-3 w-80 sm:w-96 bg-[#182622] rounded-3xl border border-[#2A423B] shadow-2xl p-4 text-stone-100 z-50 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-[#2A423B]">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold text-white">اعلان‌ها و رویدادهای ۱,۰۰۰ دانش‌آموخته</span>
                      </div>
                      <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">
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
                        <div key={idx} className={`p-2.5 rounded-2xl border text-xs transition-colors ${n.unread ? 'bg-[#233832] border-emerald-500/30' : 'bg-[#182622] border-[#2A423B]/60 text-stone-400'}`}>
                          <div className="flex items-center justify-between font-bold text-stone-200">
                            <span>{n.title}</span>
                            <span className="text-[10px] text-stone-400 font-normal">{n.time}</span>
                          </div>
                          <p className="text-[11px] text-stone-300 mt-1 leading-relaxed">{n.desc}</p>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => setNotificationsOpen(false)}
                      className="w-full py-2 rounded-xl bg-emerald-800/40 hover:bg-emerald-800/70 text-emerald-300 text-xs font-bold text-center border border-emerald-700/40 transition-colors"
                    >
                      بستن اعلان‌ها
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 pl-3 rounded-2xl bg-[#233832] hover:bg-[#2C473F] border border-[#34544B] transition-all"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center font-bold text-sm shadow-md">
                  {currentUser?.avatarText || 'کاربر'}
                </div>
                <div className="text-right text-xs hidden sm:block">
                  <p className="font-bold text-white">{currentUser?.fullName || 'کاربر سیستم'}</p>
                  <p className="text-[10px] text-emerald-400 font-medium truncate max-w-[120px]">
                    {currentUser?.roleTitle || 'دانش‌آموخته'}
                  </p>
                </div>
                <ChevronDown className={`w-4 h-4 text-stone-300 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* User Account & Role Switcher Dropdown */}
            {userDropdownOpen && (
              <div className="absolute left-0 mt-3 w-80 bg-[#182622] rounded-3xl border border-[#2A423B] shadow-2xl p-4 text-stone-100 z-50 space-y-3">
                {/* Profile Header */}
                <div className="p-3 bg-[#233832] rounded-2xl space-y-1">
                  <p className="font-bold text-sm text-white">{currentUser?.fullName}</p>
                  <p className="text-xs text-emerald-400 font-medium">{currentUser?.roleTitle}</p>
                  <p className="text-[11px] text-stone-400 font-mono">کد ملی: {toPersianNumbers(currentUser?.nationalId || '')}</p>
                </div>

                {/* Role Switcher Menu */}
                <div className="space-y-1.5">
                  <p className="text-[11px] font-bold text-stone-400 px-1">تغییر نقش کاربری (تست سامانه):</p>
                  
                  {[
                    { role: 'alumni' as UserRole, name: 'دکتر علیرضا میرزایی', label: 'دانش‌آموخته (مستشار دادگاه)', icon: UserCheck },
                    { role: 'supervisor' as UserRole, name: 'حجت‌الاسلام موسوی', label: 'مسئول کارتابل خدمات', icon: Shield },
                    { role: 'admin' as UserRole, name: 'حاج‌ آقا رضایی', label: 'مدیر عالی سامانه', icon: UserPlus }
                  ].map(u => (
                    <button
                      key={u.role}
                      onClick={() => {
                        switchUserRole(u.role);
                        setUserDropdownOpen(false);
                      }}
                      className={`w-full p-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-colors ${
                        currentUser?.role === u.role
                          ? 'bg-emerald-600 text-white'
                          : 'bg-[#233832]/60 hover:bg-[#233832] text-stone-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <u.icon className="w-4 h-4 text-emerald-300" />
                        <div className="text-right">
                          <p>{u.label}</p>
                          <p className="text-[10px] text-stone-300 font-normal">{u.name}</p>
                        </div>
                      </div>
                      {currentUser?.role === u.role && <span className="text-[10px] bg-emerald-800 px-2 py-0.5 rounded-full">فعال</span>}
                    </button>
                  ))}
                </div>

                {/* Logout Action */}
                <div className="pt-2 border-t border-[#2A423B]">
                  <button
                    onClick={() => {
                      logout();
                      setUserDropdownOpen(false);
                    }}
                    className="w-full py-2.5 rounded-xl bg-red-900/40 hover:bg-red-900/60 text-red-200 text-xs font-bold flex items-center justify-center gap-2 border border-red-800/40 transition-colors"
                  >
                    <LogOut className="w-4 h-4 text-red-300" />
                    <span>خروج از حساب کاربری</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* WARM ELEGANT CONTENT CANVAS */}
        <main className={`${canvasBgClass} rounded-[40px] p-6 sm:p-8 lg:p-10 shadow-2xl border text-stone-900 min-h-[700px] transition-colors duration-500`}>
          {activeNav === 'Dashboard' ? (
            <CrextioDashboard onNavigateTab={setActiveNav} />
          ) : activeNav === 'Alumni' ? (
            <AlumniDirectorySection onNavigate={setActiveNav} />
          ) : activeNav === 'Users' ? (
            <UserManagementModule />
          ) : activeNav === 'Admin' ? (
            <AdminControlCenter />
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
      <ThemeCustomizerModal
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
      />
    </div>
  );
};
