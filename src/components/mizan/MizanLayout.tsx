import React, { useState, useRef, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { toPersianNumbers } from '../../utils/persianNumbers';
import { UserRole } from '../../types';

// Components
import { MizanDashboard } from './MizanDashboard';
import { MizanCommandPalette } from './MizanCommandPalette';
import { MizanStudioModal } from './MizanStudioModal';

import { CounselingSection } from '../counseling/CounselingSection';
import { UserManagementModule } from '../admin/UserManagementModule';
import { ModuleFallback } from '../common/ModuleFallback';

const CartableSection = lazy(() => import('../cartable/CartableSection').then(m => ({ default: m.CartableSection })));
const AdminControlCenter = lazy(() => import('../admin/AdminControlCenter').then(m => ({ default: m.AdminControlCenter })));
const CoursesSection = lazy(() => import('../courses/CoursesSection').then(m => ({ default: m.CoursesSection })));
const ProductsSection = lazy(() => import('../products/ProductsSection').then(m => ({ default: m.ProductsSection })));
const SpecializedCareerCounselingSection = lazy(() => import('../counseling/SpecializedCareerCounselingSection').then(m => ({ default: m.SpecializedCareerCounselingSection })));
const ResearchMentorshipSection = lazy(() => import('../research/ResearchMentorshipSection').then(m => ({ default: m.ResearchMentorshipSection })));
const JudicialRulingsSection = lazy(() => import('../rulings/JudicialRulingsSection').then(m => ({ default: m.JudicialRulingsSection })));
const WelfareSection = lazy(() => import('../welfare/WelfareSection').then(m => ({ default: m.WelfareSection })));
const SynergyWallSection = lazy(() => import('../synergy/SynergyWallSection').then(m => ({ default: m.SynergyWallSection })));
const AlumniDirectorySection = lazy(() => import('../alumni/AlumniDirectorySection').then(m => ({ default: m.AlumniDirectorySection })));

import {
  Scale,
  Inbox,
  GraduationCap,
  BookOpen,
  Compass,
  HeartHandshake,
  Gift,
  Users2,
  Users,
  Settings,
  ShieldCheck,
  Search,
  Bell,
  Command,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Sliders,
  SlidersHorizontal,
  ArrowRight,
  LogOut,
  UserCheck,
  UserPlus,
  Sparkles,
  LayoutGrid,
  Palette,
  CheckCircle2,
  Calendar,
  FileText,
  PanelLeftClose,
  PanelLeftOpen,
  X
} from 'lucide-react';

interface MizanNavGroup {
  groupName: string;
  items: {
    id: string;
    label: string;
    icon: any;
    color: string;
    badge?: string;
  }[];
}

export const MizanLayout: React.FC = () => {
  const {
    currentUser,
    users,
    switchUserRole,
    logout,
    designTheme,
    setDesignTheme,
    mizanConfig,
    cartableRequests
  } = useApp();

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState<boolean>(false);
  const [studioOpen, setStudioOpen] = useState<boolean>(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState<boolean>(false);
  const [notificationsOpen, setNotificationsOpen] = useState<boolean>(false);
  const [themePickerOpen, setThemePickerOpen] = useState<boolean>(false);

  const isAdminOrSupervisor = currentUser?.role === 'admin' || currentUser?.role === 'supervisor';
  const pendingRequestsCount = cartableRequests.filter(r => r.status === 'pending').length;

  // کلید میانبر کیبورد Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navGroups: MizanNavGroup[] = [
    {
      groupName: 'میز کاربری من',
      items: [
        { id: 'dashboard', label: 'داشبورد جامع میزان', icon: LayoutGrid, color: '#158561' },
        {
          id: 'cartable',
          label: 'کارتابل اسناد و استعلامات',
          icon: Inbox,
          color: '#158561',
          badge: pendingRequestsCount > 0 ? toPersianNumbers(pendingRequestsCount) : undefined
        }
      ]
    },
    {
      groupName: 'آموزش و پژوهش',
      items: [
        { id: 'courses', label: 'دوره‌ها و کارگاه‌های عالی', icon: GraduationCap, color: '#00848B' },
        { id: 'research', label: 'راهبری پایان‌نامه‌ها', icon: Compass, color: '#A06316' },
        { id: 'products', label: 'کتب و منشورات حقوقی', icon: BookOpen, color: '#5C3882' }
      ]
    },
    {
      groupName: 'مشاوره و رویه قضایی',
      items: [
        { id: 'counseling_specialized', label: 'مشاوره تخصصی شغلی و تحصیلی', icon: Compass, color: '#006042' },
        { id: 'counseling', label: 'خدمات مشاوره عمومی', icon: HeartHandshake, color: '#BF2C43' },
        { id: 'rulings', label: 'تالار نقد آراء و دادنامه‌ها', icon: Scale, color: '#9A6418' }
      ]
    },
    {
      groupName: 'رفاه و جامعه نخبگانی',
      items: [
        { id: 'welfare', label: 'تسهیلات، اقامتگاه و هدایا', icon: Gift, color: '#B23A00' },
        { id: 'synergy', label: 'دیوار هم‌افزایی و تبادل نظر', icon: Users2, color: '#3463A6' },
        { id: 'alumni', label: 'شبکه دانش‌آموختگان و قضات', icon: Users, color: '#158561' }
      ]
    },
    ...(isAdminOrSupervisor ? [{
      groupName: 'دبیرخانه و مدیریت',
      items: [
        { id: 'users', label: 'مدیریت کاربران و حساب‌ها', icon: Users, color: '#0D3829' },
        { id: 'admin', label: 'دبیرخانه و تنظیمات پرتال', icon: ShieldCheck, color: '#A06316' }
      ]
    }] : [])
  ];

  const handleNavigate = (tabId: string) => {
    setActiveTab(tabId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getSubViewTitle = () => {
    for (const group of navGroups) {
      const found = group.items.find(i => i.id === activeTab);
      if (found) return found.label;
    }
    return 'سامانه میزان';
  };

  return (
    <div
      className="min-h-screen bg-[#F0F5F2] text-[#143D2D] font-sans antialiased selection:bg-[#158561]/20 flex flex-col"
      dir="rtl"
    >
      {/* ۱. نوار ناوبری بالا (TOPBAR) ارتفاع استاندارد ۶۴ پیکسل */}
      <header className="sticky top-0 z-40 h-16 bg-white/95 backdrop-blur-md border-b border-[#E2ECE7] shadow-sm px-4 sm:px-6 flex items-center justify-between">
        
        {/* سمت راست: نشان و لوگوی فاخر مجمع */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarCollapsed(prev => !prev)}
            className="p-2 rounded-xl text-[#527768] hover:text-[#0D3829] hover:bg-[#F0F5F2] transition-colors"
            title={sidebarCollapsed ? 'باز کردن سایدبار' : 'جمع کردن سایدبار'}
          >
            {sidebarCollapsed ? <PanelLeftOpen className="w-5 h-5 rotate-180" /> : <PanelLeftClose className="w-5 h-5 rotate-180" />}
          </button>

          <div
            onClick={() => handleNavigate('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#011C11] to-[#073424] text-[#DBB155] border border-[#DBB155]/40 flex items-center justify-center shadow-md">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black text-[#0D3829] tracking-tight">طرح میزان</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#FAF2DE] text-[#9A6418] border border-[#EEDB9F]">
                  نسخه ۳
                </span>
              </div>
              <p className="text-[11px] text-[#698F81] line-clamp-1">پرتال رسمی دانش‌آموختگان فقه و قضا</p>
            </div>
          </div>
        </div>

        {/* وسط: ماشه جستجو و پالت فرمان کدهای میانبر Ctrl+K */}
        <div className="hidden md:flex items-center max-w-md w-full mx-6">
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-[#F4F9F6] border border-[#D5E5DE] text-xs text-[#698F81] hover:border-[#158561]/60 hover:bg-white transition-all shadow-inner"
          >
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-[#158561]" />
              <span>جستجو در خدمات، دوره‌ها، آراء قضایی...</span>
            </div>
            <div className="flex items-center gap-1 font-mono text-[10px] bg-white border border-[#D5E5DE] px-2 py-0.5 rounded text-[#527768]">
              <Command className="w-3 h-3" />
              <span>K</span>
            </div>
          </button>
        </div>

        {/* سمت چپ: ابزارها، انتخابگر تم ۳‌گانه، اعلان‌ها، نقش و حساب */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* دکمه باز کردن جستجو در موبایل */}
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="md:hidden p-2 rounded-xl text-[#527768] hover:bg-[#F0F5F2]"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* ۳-Way Theme Switcher Capsule */}
          <div className="relative">
            <button
              onClick={() => setThemePickerOpen(prev => !prev)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-[#D5E5DE] bg-[#FAFDFB] hover:bg-[#F0F5F2] text-xs font-semibold text-[#0D3829] transition-all"
              title="تغییر تم دیداری سامانه"
            >
              <Palette className="w-4 h-4 text-[#158561]" />
              <span className="hidden sm:inline">میزان (کاغذی)</span>
              <ChevronDown className="w-3 h-3 text-[#527768]" />
            </button>

            <AnimatePresence>
              {themePickerOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="absolute left-0 mt-1.5 w-52 bg-white rounded-2xl border border-[#D5E5DE] shadow-xl p-2 z-50 text-right space-y-1 text-xs"
                >
                  <div className="text-[10px] font-bold text-[#698F81] px-2 py-1">انتخاب تم سامانه:</div>
                  <button
                    onClick={() => { setDesignTheme('portal'); setThemePickerOpen(false); }}
                    className="w-full text-right p-2 rounded-xl hover:bg-[#F0F5F2] flex items-center justify-between text-[#2C5747]"
                  >
                    <span>۱. پرتال سازمانی (Portal)</span>
                    {designTheme === 'portal' && <CheckCircle2 className="w-3.5 h-3.5 text-[#158561]" />}
                  </button>
                  <button
                    onClick={() => { setDesignTheme('crextio'); setThemePickerOpen(false); }}
                    className="w-full text-right p-2 rounded-xl hover:bg-[#F0F5F2] flex items-center justify-between text-[#2C5747]"
                  >
                    <span>۲. کرکستیو (Crextio)</span>
                    {designTheme === 'crextio' && <CheckCircle2 className="w-3.5 h-3.5 text-[#158561]" />}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* دکمه استودیو سفارشی‌سازی برای ادمین */}
          {isAdminOrSupervisor && (
            <button
              onClick={() => setStudioOpen(true)}
              className="p-2 rounded-xl text-[#9A6418] bg-[#FAF2DE] hover:bg-[#F6E6C5] border border-[#EEDB9F] transition-colors"
              title="استودیو سفارشی‌سازی تم ۳ میزان"
            >
              <Sliders className="w-4 h-4" />
            </button>
          )}

          {/* زنگ اعلان‌ها */}
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(prev => !prev)}
              className="p-2 rounded-xl text-[#527768] hover:text-[#0D3829] hover:bg-[#F0F5F2] relative transition-colors"
            >
              <Bell className="w-5 h-5" />
              {pendingRequestsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#158561]" />
              )}
            </button>

            <AnimatePresence>
              {notificationsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="absolute left-0 mt-2 w-80 bg-white rounded-2xl border border-[#D5E5DE] shadow-xl p-4 z-50 text-right space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-[#E5EFEA] pb-2">
                    <span className="text-xs font-bold text-[#0D3829]">اعلان‌ها و رویدادهای اداری</span>
                    <span className="text-[10px] text-[#158561] font-semibold">
                      {toPersianNumbers(pendingRequestsCount)} پیام جدید
                    </span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-[#F6FAF8] border border-[#E3ECE8]">
                      <div className="font-semibold text-[#0D3829]">استعلام رتبه قضایی شما در دست بررسی است</div>
                      <div className="text-[10px] text-[#698F81] mt-0.5">دبیرخانه مجمع · ۱ ساعت پیش</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#F6FAF8] border border-[#E3ECE8]">
                      <div className="font-semibold text-[#0D3829]">دوره جدید نقد آراء اقتصادی آغاز شد</div>
                      <div className="text-[10px] text-[#698F81] mt-0.5">معاونت آموزش · امروز</div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* نقش کاربری و منوی سوئیچ نقش */}
          <div className="relative">
            <button
              onClick={() => setRoleDropdownOpen(prev => !prev)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-[#F0F5F2] border border-transparent hover:border-[#D5E5DE] transition-all"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden border border-[#158561]/40 bg-[#EBF8F2] flex items-center justify-center text-xs font-bold text-[#158561] shrink-0">
                {currentUser?.profilePictureUrl ? (
                  <img src={currentUser.profilePictureUrl} alt={currentUser?.fullName || 'کاربر'} className="w-full h-full object-cover" />
                ) : (
                  <span>{currentUser?.avatarText || currentUser?.fullName?.slice(0, 1) || 'ق'}</span>
                )}
              </div>
              <div className="hidden lg:block text-right">
                <div className="text-xs font-bold text-[#0D3829] leading-tight flex items-center gap-1">
                  <span>{currentUser?.fullName || 'قاضی سید علیرضا حسینی'}</span>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-[#FAF2DE] text-[#9A6418] font-mono">
                    پایه {toPersianNumbers(currentUser?.judicialGrade || 9)}
                  </span>
                </div>
                <div className="text-[10px] text-[#698F81]">
                  {currentUser?.roleTitle || (currentUser?.role === 'admin' ? 'مدیر سامانه' : currentUser?.role === 'supervisor' ? 'مسئول خدمات' : 'دانش‌آموخته')}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#527768]" />
            </button>

            <AnimatePresence>
              {roleDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="absolute left-0 mt-2 w-64 bg-white rounded-2xl border border-[#D5E5DE] shadow-xl p-3 z-50 text-right space-y-2 text-xs"
                >
                  <div className="p-2 rounded-xl bg-[#F6FAF8] border border-[#E3ECE8]">
                    <div className="font-bold text-[#0D3829]">{currentUser?.fullName}</div>
                    <div className="text-[11px] text-[#698F81]">{currentUser?.phone}</div>
                  </div>

                  <div className="border-t border-[#E5EFEA] pt-2">
                    <button
                      onClick={() => { logout(); setRoleDropdownOpen(false); }}
                      className="w-full text-right px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 flex items-center justify-between font-medium"
                    >
                      <span>خروج از حساب</span>
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </header>

      {/* ۲. بدنه برنامه: سایدبار گروه‌بندی‌شده + بوم محتوا */}
      <div className="flex-1 flex max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-6 gap-6">
        
        {/* سایدبار گروه‌بندی‌شده فاخر (Sidebar) */}
        <aside
          className={`shrink-0 transition-all duration-300 select-none ${
            sidebarCollapsed ? 'w-20' : 'w-64'
          }`}
        >
          <div className="sticky top-24 bg-white rounded-3xl border border-[#E2ECE7] p-3 shadow-sm space-y-4 max-h-[calc(100vh-7rem)] overflow-y-auto">
            {navGroups.map((group, groupIdx) => (
              <div key={groupIdx} className="space-y-1">
                {!sidebarCollapsed && (
                  <div className="text-[10px] font-black text-[#698F81] px-3 pt-2 pb-1 tracking-wider uppercase">
                    {group.groupName}
                  </div>
                )}
                {group.items.map(item => {
                  const IconComponent = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavigate(item.id)}
                      title={sidebarCollapsed ? item.label : undefined}
                      className={`w-full flex items-center ${
                        sidebarCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2.5'
                      } rounded-2xl text-xs font-semibold transition-all group relative ${
                        isActive
                          ? 'bg-[#EBF8F2] text-[#006042] font-black shadow-xs'
                          : 'text-[#3E6555] hover:bg-[#F4F9F6] hover:text-[#0D3829]'
                      }`}
                    >
                      {isActive && (
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-5 bg-[#158561] rounded-l-full" />
                      )}

                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-all"
                          style={{
                            backgroundColor: isActive ? item.color : '#F0F5F2',
                            color: isActive ? '#FFFFFF' : item.color
                          }}
                        >
                          <IconComponent className="w-3.5 h-3.5" />
                        </div>
                        {!sidebarCollapsed && (
                          <span className="truncate">{item.label}</span>
                        )}
                      </div>

                      {!sidebarCollapsed && item.badge && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#158561] text-white">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </aside>

        {/* بوم اصلی محتوا (Main Canvas) */}
        <main className="flex-1 min-w-0">
          {activeTab === 'dashboard' ? (
            <MizanDashboard
              onNavigate={handleNavigate}
              onOpenNewRequestModal={() => handleNavigate('cartable')}
            />
          ) : (
            <div className="space-y-5">
              {/* هدر بخش‌های فرعی همراه با دکمه بازگشت به داشبورد میزان */}
              <div className="flex items-center justify-between bg-white rounded-2xl border border-[#E2ECE7] p-4 px-5 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#EBF8F2] text-[#158561] flex items-center justify-center font-bold">
                    <Scale className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-[#698F81]">
                      <span>طرح میزان</span>
                      <span>/</span>
                      <span className="text-[#0D3829] font-bold">{getSubViewTitle()}</span>
                    </div>
                    <h2 className="text-base font-black text-[#0D3829] mt-0.5">{getSubViewTitle()}</h2>
                  </div>
                </div>

                <button
                  onClick={() => handleNavigate('dashboard')}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[#D5E5DE] bg-[#FAFDFB] hover:bg-[#F0F5F2] text-xs font-bold text-[#158561] transition-colors"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>بازگشت به میز کار میزان</span>
                </button>
              </div>

              {/* رندر بخش انتخاب‌شده با رعایت کامل هماهنگی داده و استایل */}
              <div className="bg-transparent">
                {activeTab === 'cartable' && (
                  <Suspense fallback={<ModuleFallback />}>
                    <CartableSection />
                  </Suspense>
                )}
                {activeTab === 'courses' && (
                  <Suspense fallback={<ModuleFallback />}>
                    <CoursesSection />
                  </Suspense>
                )}
                {activeTab === 'products' && (
                  <Suspense fallback={<ModuleFallback />}>
                    <ProductsSection />
                  </Suspense>
                )}
                {activeTab === 'counseling_specialized' && (
                  <Suspense fallback={<ModuleFallback />}>
                    <SpecializedCareerCounselingSection />
                  </Suspense>
                )}
                {activeTab === 'counseling' && <CounselingSection />}
                {activeTab === 'research' && (
                  <Suspense fallback={<ModuleFallback />}>
                    <ResearchMentorshipSection />
                  </Suspense>
                )}
                {activeTab === 'rulings' && (
                  <Suspense fallback={<ModuleFallback />}>
                    <JudicialRulingsSection />
                  </Suspense>
                )}
                {activeTab === 'welfare' && (
                  <Suspense fallback={<ModuleFallback />}>
                    <WelfareSection />
                  </Suspense>
                )}
                {activeTab === 'synergy' && (
                  <Suspense fallback={<ModuleFallback />}>
                    <SynergyWallSection />
                  </Suspense>
                )}
                {activeTab === 'alumni' && (
                  <Suspense fallback={<ModuleFallback />}>
                    <AlumniDirectorySection />
                  </Suspense>
                )}
                {activeTab === 'users' && <UserManagementModule />}
                {activeTab === 'admin' && (
                  <Suspense fallback={<ModuleFallback />}>
                    <AdminControlCenter />
                  </Suspense>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* مودال‌های سیستمی */}
      <MizanCommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onNavigate={handleNavigate}
      />

      <MizanStudioModal
        isOpen={studioOpen}
        onClose={() => setStudioOpen(false)}
      />
    </div>
  );
};
