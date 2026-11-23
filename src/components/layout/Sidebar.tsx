import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { AppSectionId } from '../../types';
import { canViewSection, useRbacPolicies, isOrganizationalRole } from '../../utils/rbacPolicy';
import {
  applyNavigationCustomization,
  getResolvedNavigationConfig,
} from '../../utils/navigationConfig';
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
  Wallet
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
  | 'finance'
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
  statusTag?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  mobileMenuOpen,
  setMobileMenuOpen,
}) => {
  const {
    currentUser,
    cartableRequests,
    rulings,
    synergyPosts,
    productsStoreConfig,
    crextioConfig,
    isAlumniPreview,
  } = useApp();
  const { rolePolicies } = useRbacPolicies();
  const [hoveredTab, setHoveredTab] = useState<NavTabId | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; right: number } | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const pendingCartableCount = cartableRequests.filter(
    r => r.status === 'pending' || r.status === 'need_info'
  ).length;

  const pendingRulingsCount = rulings.filter(r => r.status === 'pending_review').length;
  const openSynergyCount = synergyPosts.filter(p => p.status === 'open').length;

  const allNavCandidates: NavItemConfig[] = [
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
      label: 'کتاب و محصولات چند رسانه‌ای',
      subtext: 'کتب مرجع، نشست‌های علمی، درس‌گفتارها و فایل‌های دانلودی',
      icon: BookOpen,
      accentColor: 'text-emerald-500 dark:text-emerald-400',
      glowColor: 'rgba(16, 185, 129, 0.2)',
      activeBg: 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-white',
      statusTag: !productsStoreConfig.isStoreEnabled ? 'غیرفعال' : undefined,
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
      label: 'راهبری پژوهش و مقاله (خدمات پژوهشی)',
      subtext: 'راهبری پایان‌نامه، مقاله، مشورت موردی و اسکان مطالعاتی',
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
      count: isOrganizationalRole(currentUser?.role) && pendingRulingsCount > 0 ? pendingRulingsCount : undefined,
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
    {
      id: 'finance' as NavTabId,
      label: 'امور مالی و حسابداری',
      subtext: 'مدیریت درآمدها، تسویه‌حساب‌ها و آمار جامع مالی',
      icon: Wallet,
      accentColor: 'text-emerald-500 dark:text-emerald-400',
      glowColor: 'rgba(16, 185, 129, 0.2)',
      activeBg: 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-white',
    },
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
      label: 'مدیریت کاربران و نقش‌ها',
      subtext: 'مدیریت حساب‌ها، ۹ نقش سازمانی و سطوح دسترسی',
      icon: Users2,
      accentColor: 'text-indigo-500 dark:text-indigo-400',
      glowColor: 'rgba(99, 102, 241, 0.2)',
      activeBg: 'bg-indigo-600 text-white dark:bg-indigo-500 dark:text-white',
    },
  ];

  const resolvedNav = getResolvedNavigationConfig(crextioConfig.navigationConfig);
  const allNavWithAdmin: NavItemConfig[] = [
    ...allNavCandidates,
    {
      id: 'admin',
      label: 'مدیریت سایت و پایش امنیت',
      subtext: 'پایش امنیت پایگاه داده، زنجیره وقایع SHA-256 و عیب‌یابی آنی سامانه',
      icon: ShieldCheck,
      accentColor: 'text-amber-500 dark:text-amber-400',
      glowColor: 'rgba(245, 158, 11, 0.2)',
      activeBg: 'bg-amber-500 text-slate-950',
      statusTag: 'Admin',
    },
  ];

  // Strict Menu Cloaking: Hide Alumni, Users, Admin, Finance from alumni, customer & preview mode
  const isStaff = isOrganizationalRole(currentUser?.role) && !isAlumniPreview;
  const customizedNav = applyNavigationCustomization(allNavWithAdmin, resolvedNav.verticalSidebar, {
    hideInvisible: true,
    alwaysKeepVisibleIds: ['dashboard'],
  });

  const mainNavItems = customizedNav.filter(item => {
    if (!isStaff && (item.id === 'alumni' || item.id === 'users' || item.id === 'admin' || item.id === 'finance')) {
      return false;
    }
    return canViewSection(currentUser, item.id as AppSectionId, rolePolicies);
  });

  const handleSelect = (tab: NavTabId) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    setHoveredTab(null);
    setTooltipPos(null);
  };

  const handleHoverEnter = (tabId: NavTabId, el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    const centerTop = Math.max(90, Math.min(window.innerHeight - 130, rect.top + rect.height / 2));
    const rightOffset = window.innerWidth - rect.left + 14;
    setHoveredTab(tabId);
    setTooltipPos({ top: centerTop, right: rightOffset });
  };

  const hoveredItem = mainNavItems.find(i => i.id === hoveredTab) || null;

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 z-30 lg:hidden backdrop-blur-xs"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Floating Vertical Capsule Dock with smooth internal scroll + non-clipping fixed tooltip */}
      <aside
        onMouseLeave={() => {
          setHoveredTab(null);
          setTooltipPos(null);
        }}
        className="fixed top-24 right-5 bottom-24 z-30 hidden lg:flex flex-col items-center w-20 py-3 px-2 glass-panel rounded-[36px] border border-white/20 dark:border-white/10 shadow-2xl shadow-indigo-500/10 backdrop-blur-2xl transition-colors"
      >
        {/* Top Dock Emblem */}
        <div className="w-11 h-11 shrink-0 rounded-full bg-slate-900/90 dark:bg-amber-500 text-amber-400 dark:text-slate-950 flex items-center justify-center font-black shadow-lg mb-2">
          <ShieldCheck className="w-5 h-5" />
        </div>

        <div className="w-8 h-px shrink-0 bg-slate-200/60 dark:bg-white/10 mb-1" />

        {/* Scrollable Nav Items */}
        <div
          ref={scrollContainerRef}
          onScroll={() => {
            setHoveredTab(null);
            setTooltipPos(null);
          }}
          className="flex-1 min-h-0 w-full overflow-y-auto scrollbar-none flex flex-col items-center space-y-1.5 py-1"
        >
          {mainNavItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isItemHovered = hoveredTab === item.id;

            return (
              <div
                key={item.id}
                className="relative group w-full flex justify-center shrink-0"
                onMouseEnter={e => handleHoverEnter(item.id, e.currentTarget)}
              >
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

                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-capsule"
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                    className="absolute inset-x-1 inset-y-0 rounded-2xl bg-slate-900 dark:bg-amber-500 shadow-lg z-0 pointer-events-none"
                  />
                )}

                <button
                  type="button"
                  aria-label={item.label}
                  onClick={() => handleSelect(item.id)}
                  className={`relative z-10 w-11 h-11 flex items-center justify-center rounded-2xl transition-all group active:scale-95 cursor-pointer ${
                    isActive
                      ? 'text-white dark:text-slate-950 font-bold'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <motion.div
                    animate={{
                      scale: isItemHovered ? 1.15 : 1,
                    }}
                    transition={{ duration: 0.2 }}
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

                  {item.count !== undefined && item.count > 0 && (
                    <span className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[9px] font-black flex items-center justify-center shadow-sm tabular-nums">
                      {item.count}
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </aside>

      {/* Non-clipping fixed Popover Tooltip outside scroll container */}
      <AnimatePresence>
        {hoveredItem && tooltipPos && (
          <motion.div
            key={hoveredItem.id}
            initial={{ opacity: 0, x: 10, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 10, scale: 0.96 }}
            transition={{ duration: 0.14 }}
            style={{
              position: 'fixed',
              top: `${tooltipPos.top}px`,
              right: `${tooltipPos.right}px`,
              transform: 'translateY(-50%)',
            }}
            className="hidden lg:block z-50 pointer-events-none w-64 glass-card p-3.5 rounded-2xl border border-white/25 dark:border-white/15 shadow-2xl shadow-indigo-500/15 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs font-black text-slate-900 dark:text-white">
                {hoveredItem.label}
              </span>
              {hoveredItem.count !== undefined && hoveredItem.count > 0 ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 tabular-nums shrink-0">
                  {hoveredItem.count} مورد
                </span>
              ) : hoveredItem.statusTag ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-200 shrink-0">
                  {hoveredItem.statusTag}
                </span>
              ) : null}
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              {hoveredItem.subtext}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Drawer */}
      <aside
        className={`fixed top-16 bottom-0 right-0 w-72 glass-panel border-l border-slate-200/90 dark:border-white/10 z-40 lg:hidden transition-transform duration-300 ease-in-out overflow-y-auto p-4 ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="space-y-2 pb-16">
          <div className="px-3 py-1 text-xs font-bold text-slate-400">بخش‌های اصلی خدمات</div>
          {mainNavItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-right transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="text-xs font-bold truncate">{item.label}</span>
                </div>
                {item.count !== undefined && item.count > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold tabular-nums shrink-0">
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </aside>
    </>
  );
};
