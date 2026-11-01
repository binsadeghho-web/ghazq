import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  Inbox,
  GraduationCap,
  BookOpen,
  HeartHandshake,
  FileText,
  Scale,
  Gift,
  Users2,
  ShieldCheck,
  ChevronLeft
} from 'lucide-react';

export type NavTabId =
  | 'dashboard'
  | 'cartable'
  | 'courses'
  | 'products'
  | 'counseling'
  | 'specialized_counseling'
  | 'research'
  | 'rulings'
  | 'welfare'
  | 'synergy'
  | 'alumni'
  | 'users'
  | 'admin';

interface SidebarProps {
  activeTab: NavTabId;
  setActiveTab: (tab: NavTabId) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

interface NavItemConfig {
  id: NavTabId;
  label: string;
  subtext: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  glowColor: string;
  activeBg: string;
  count?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  mobileMenuOpen,
  setMobileMenuOpen,
}) => {
  const { currentUser, cartableRequests, rulings, synergyPosts } = useApp();
  const [hoveredTab, setHoveredTab] = useState<NavTabId | null>(null);

  const pendingCartableCount = cartableRequests.filter(
    r => r.status === 'pending' || r.status === 'need_info'
  ).length;

  const pendingRulingsCount = rulings.filter(r => r.status === 'pending_review').length;
  const openSynergyCount = synergyPosts.filter(p => p.status === 'open').length;

  const mainNavItems: NavItemConfig[] = [
    {
      id: 'dashboard',
      label: 'داشبورد جامع',
      subtext: 'نمای کلی و درگاه‌های دسترسی',
      icon: LayoutDashboard,
      accentColor: 'text-indigo-500 dark:text-indigo-400',
      glowColor: 'rgba(99, 102, 241, 0.2)',
      activeBg: 'bg-indigo-600 text-white dark:bg-indigo-500 dark:text-white',
    },
    {
      id: 'cartable',
      label: 'خدمات اداری و آموزشی',
      subtext: 'کارتابل درخواست‌های شغلی و استعلام‌ها',
      icon: Inbox,
      accentColor: 'text-blue-500 dark:text-blue-400',
      glowColor: 'rgba(59, 130, 246, 0.2)',
      activeBg: 'bg-blue-600 text-white dark:bg-blue-500 dark:text-white',
      count: pendingCartableCount,
    },
    {
      id: 'courses',
      label: 'دوره‌های تخصصی',
      subtext: 'آموزش‌های کاربردی فقه و قضا',
      icon: GraduationCap,
      accentColor: 'text-violet-500 dark:text-violet-400',
      glowColor: 'rgba(139, 92, 246, 0.2)',
      activeBg: 'bg-violet-600 text-white dark:bg-violet-500 dark:text-white',
    },
    {
      id: 'products',
      label: 'محصولات و کتب',
      subtext: 'کتاب‌های مرجع، موسوعه‌ها و درس‌گفتارها',
      icon: BookOpen,
      accentColor: 'text-emerald-500 dark:text-emerald-400',
      glowColor: 'rgba(16, 185, 129, 0.2)',
      activeBg: 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-white',
    },
    {
      id: 'counseling',
      label: 'مشاوره عمومی و روان‌شناختی',
      subtext: 'سلامت شغلی، تحکیم خانواده و سبک زندگی',
      icon: HeartHandshake,
      accentColor: 'text-rose-500 dark:text-rose-400',
      glowColor: 'rgba(244, 63, 94, 0.2)',
      activeBg: 'bg-rose-600 text-white dark:bg-rose-500 dark:text-white',
    },
    {
      id: 'specialized_counseling',
      label: 'مشاوره تخصصی شغلی قضا',
      subtext: 'هدایت شغلی-تحصیلی با قضات پیشکسوت دیوان عالی',
      icon: Scale,
      accentColor: 'text-amber-500 dark:text-amber-400',
      glowColor: 'rgba(245, 158, 11, 0.2)',
      activeBg: 'bg-amber-600 text-white dark:bg-amber-500 dark:text-slate-950',
    },
    {
      id: 'research',
      label: 'راهبری پایان‌نامه‌ها',
      subtext: 'کوچینگ رساله دکتری و اسکان پژوهشی',
      icon: FileText,
      accentColor: 'text-amber-500 dark:text-amber-400',
      glowColor: 'rgba(245, 158, 11, 0.2)',
      activeBg: 'bg-amber-600 text-white dark:bg-amber-500 dark:text-slate-950',
    },
    {
      id: 'rulings',
      label: 'تالار رأی قضایی',
      subtext: 'آراء برگزیده محاکم و مباحثات فقهی',
      icon: Scale,
      accentColor: 'text-cyan-500 dark:text-cyan-400',
      glowColor: 'rgba(6, 182, 212, 0.2)',
      activeBg: 'bg-cyan-600 text-white dark:bg-cyan-500 dark:text-slate-950',
      count: currentUser?.role !== 'alumni' && pendingRulingsCount > 0 ? pendingRulingsCount : undefined,
    },
    {
      id: 'welfare',
      label: 'تسهیلات و رفاهیات',
      subtext: 'وام قرض‌الحسنه، اسکان زیارتی و اقلام معیشتی',
      icon: Gift,
      accentColor: 'text-teal-500 dark:text-teal-400',
      glowColor: 'rgba(20, 184, 166, 0.2)',
      activeBg: 'bg-teal-600 text-white dark:bg-teal-500 dark:text-white',
    },
    {
      id: 'synergy',
      label: 'دیوار هم‌افزایی',
      subtext: 'ارتباط مستقیم و تبادل تجارب اداری اعضا',
      icon: Users2,
      accentColor: 'text-purple-500 dark:text-purple-400',
      glowColor: 'rgba(168, 85, 247, 0.2)',
      activeBg: 'bg-purple-600 text-white dark:bg-purple-500 dark:text-white',
      count: openSynergyCount,
    },
    ...(currentUser?.role === 'admin' || currentUser?.role === 'supervisor' ? [
      {
        id: 'alumni' as NavTabId,
        label: 'دانش‌آموختگان',
        subtext: 'بانک جامع اطلاعات، سوابق قضایی و علمی دانش‌آموختگان',
        icon: GraduationCap,
        accentColor: 'text-emerald-500 dark:text-emerald-400',
        glowColor: 'rgba(16, 185, 129, 0.2)',
        activeBg: 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-white',
      },
      {
        id: 'users' as NavTabId,
        label: 'مدیریت کاربران (حساب‌های کاربری)',
        subtext: 'مدیریت حساب‌ها، رمزهای عبور و سطوح دسترسی',
        icon: Users2,
        accentColor: 'text-indigo-500 dark:text-indigo-400',
        glowColor: 'rgba(99, 102, 241, 0.2)',
        activeBg: 'bg-indigo-600 text-white dark:bg-indigo-500 dark:text-white',
      }
    ] : []),
  ];

  const showAdminTab = currentUser?.role === 'admin' || currentUser?.role === 'supervisor';

  const handleSelect = (tab: NavTabId) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    setHoveredTab(null);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 z-30 lg:hidden backdrop-blur-xs"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* 
        ========================================================================
        باکس مستقل شناور (Floating Capsule Dock) به شکل بیضی کشیده
        بدون چسبیدن به لبه صفحه و بدون باز شدن عرضی (همیشه کپسولی فشرده)
        با نمایش کارت راهنما (Tooltip) در هاور
        ========================================================================
      */}
      <aside
        onMouseLeave={() => setHoveredTab(null)}
        className={`
          fixed top-24 right-5 bottom-24 z-30 hidden lg:flex flex-col items-center justify-between
          w-20 py-4 px-2.5 glass-panel rounded-[36px]
          border border-white/20 dark:border-white/10
          shadow-2xl shadow-indigo-500/10 backdrop-blur-2xl transition-colors
        `}
      >
        <div className="flex flex-col items-center space-y-2 w-full">
          {/* لوگوی بالایی سایدبار */}
          <div className="w-11 h-11 rounded-full bg-slate-900/90 dark:bg-amber-500 text-amber-400 dark:text-slate-950 flex items-center justify-center font-black shadow-lg mb-2">
            <ShieldCheck className="w-5 h-5" />
          </div>

          <div className="w-8 h-px bg-slate-200/60 dark:bg-white/10 my-1" />

          {mainNavItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isItemHovered = hoveredTab === item.id;

            return (
              <div
                key={item.id}
                className="relative group w-full flex justify-center"
                onMouseEnter={() => setHoveredTab(item.id)}
              >
                {/* کپسول شناور مغناطیسی پشت آیکون */}
                {isItemHovered && !isActive && (
                  <motion.div
                    layoutId="sidebar-hover-capsule"
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                    className="absolute inset-x-1 inset-y-0 rounded-2xl bg-slate-200/70 dark:bg-white/10 backdrop-blur-md border border-slate-300/60 dark:border-white/15 z-0 pointer-events-none"
                    style={{
                      boxShadow: `0 4px 20px -2px ${item.glowColor}`,
                    }}
                  />
                )}

                {/* کپسول وضعیت فعال */}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-capsule"
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                    className="absolute inset-x-1 inset-y-0 rounded-2xl bg-slate-900 dark:bg-amber-500 shadow-lg z-0 pointer-events-none"
                  />
                )}

                <button
                  onClick={() => handleSelect(item.id)}
                  className={`relative z-10 w-12 h-12 flex items-center justify-center rounded-2xl transition-all group active:scale-95 ${
                    isActive
                      ? 'text-white dark:text-slate-950 font-bold'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <motion.div
                    animate={{
                      scale: isItemHovered ? 1.18 : 1,
                      rotate: isItemHovered ? [0, -5, 5, 0] : 0,
                    }}
                    transition={{ duration: 0.25 }}
                    className={`p-1 rounded-xl transition-colors ${
                      isActive
                        ? 'text-amber-400 dark:text-slate-950'
                        : isItemHovered
                        ? item.accentColor
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </motion.div>

                  {/* نشانگر شمارنده (Badge Count) */}
                  {item.count !== undefined && item.count > 0 && (
                    <span className="absolute top-1 left-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[9px] font-black flex items-center justify-center shadow-sm tabular-nums">
                      {item.count}
                    </span>
                  )}
                </button>

                {/* 
                  کارت راهنما (Popover / Tooltip) با نمایش نام بخش و توضیحات کامل در هنگام هاور
                */}
                <AnimatePresence>
                  {isItemHovered && (
                    <motion.div
                      initial={{ opacity: 0, x: 12, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: 12, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-full mr-4 top-1/2 -translate-y-1/2 z-50 pointer-events-none w-64 glass-card p-3.5 rounded-2xl border border-white/20 dark:border-white/15 shadow-2xl shadow-indigo-500/15"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-black text-slate-900 dark:text-white">
                          {item.label}
                        </span>
                        {item.count !== undefined && item.count > 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 tabular-nums">
                            {item.count} مورد
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        {item.subtext}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}

          {/* زبانه مدیریت و نظارت (Admin Tab) */}
          {showAdminTab && (
            <div
              className="relative group w-full flex justify-center pt-2 mt-1 border-t border-slate-200/60 dark:border-white/10"
              onMouseEnter={() => setHoveredTab('admin')}
            >
              {hoveredTab === 'admin' && activeTab !== 'admin' && (
                <motion.div
                  layoutId="sidebar-hover-capsule"
                  transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                  className="absolute inset-x-1 inset-y-2 rounded-2xl bg-amber-500/15 backdrop-blur-md border border-amber-500/35 z-0 pointer-events-none"
                />
              )}

              {activeTab === 'admin' && (
                <motion.div
                  layoutId="sidebar-active-capsule"
                  transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                  className="absolute inset-x-1 inset-y-2 rounded-2xl bg-amber-500 shadow-lg z-0 pointer-events-none"
                />
              )}

              <button
                onClick={() => handleSelect('admin')}
                className={`relative z-10 w-12 h-12 flex items-center justify-center rounded-2xl transition-all group active:scale-95 ${
                  activeTab === 'admin' ? 'text-slate-950 font-bold' : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                <ShieldCheck className={`w-5 h-5 ${activeTab === 'admin' ? 'text-slate-950' : 'text-amber-500'}`} />
              </button>

              <AnimatePresence>
                {hoveredTab === 'admin' && (
                  <motion.div
                    initial={{ opacity: 0, x: 12, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 12, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-full mr-4 top-1/2 -translate-y-1/2 z-50 pointer-events-none w-64 glass-card p-3.5 rounded-2xl border border-white/20 dark:border-white/15 shadow-2xl shadow-amber-500/15"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black text-slate-900 dark:text-white">
                        مدیریت
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400">
                        Admin
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      پایش امنیت پایگاه داده، زنجیره وقایع SHA-256 و عیب‌یابی آنی سامانه
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* پایین کپسول (نشانگر وضعیت اتصال) */}
        <div className="flex flex-col items-center pb-1">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500/50" />
        </div>
      </aside>

      {/* کشوی موبایل (Mobile Drawer) */}
      <aside
        className={`fixed top-16 bottom-0 right-0 w-72 glass-panel border-l border-slate-200/90 dark:border-white/10 z-40 lg:hidden transition-transform duration-300 ease-in-out overflow-y-auto p-4 ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="space-y-2">
          <div className="px-3 py-1 text-xs font-bold text-slate-400">بخش‌های اصلی خدمات</div>
          {mainNavItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-right transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-bold">{item.label}</span>
                </div>
                {item.count !== undefined && item.count > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 font-bold tabular-nums">
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}

          {showAdminTab && (
            <button
              onClick={() => handleSelect('admin')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-right transition-all mt-4 ${
                activeTab === 'admin'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-amber-600" />
                <span className="text-xs font-bold">مدیریت</span>
              </div>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
