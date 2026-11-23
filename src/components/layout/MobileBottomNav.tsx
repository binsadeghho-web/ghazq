import React from 'react';
import { motion } from 'motion/react';
import { NavTabId } from '../../types';
import { LayoutDashboard, Inbox, GraduationCap, Scale, Gift, LayoutGrid } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getResolvedNavigationConfig } from '../../utils/navigationConfig';

interface MobileBottomNavProps {
  activeTab: NavTabId;
  setActiveTab: (tab: NavTabId) => void;
  onOpenMobileMenu: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenMobileMenu,
}) => {
  const { cartableRequests, crextioConfig } = useApp();
  const pendingCount = cartableRequests.filter(r => r.status === 'pending' || r.status === 'need_info').length;
  const resolvedVertical = getResolvedNavigationConfig(crextioConfig.navigationConfig).verticalSidebar;
  const labelMap = new Map(resolvedVertical.map(item => [item.id, item.label]));

  const tabs: Array<{
    id: NavTabId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badgeCount?: number;
  }> = [
    { id: 'dashboard', label: labelMap.get('dashboard') || 'داشبورد', icon: LayoutDashboard },
    { id: 'cartable', label: labelMap.get('cartable') || 'کارتابل', icon: Inbox, badgeCount: pendingCount },
    { id: 'courses', label: labelMap.get('courses') || 'دوره‌ها', icon: GraduationCap },
    { id: 'rulings', label: labelMap.get('rulings') || 'تالار رأی', icon: Scale },
    { id: 'welfare', label: labelMap.get('welfare') || 'رفاهیات', icon: Gift },
  ];

  return (
    <nav
      aria-label="ناوبری لمسی موبایل"
      className="lg:hidden fixed bottom-2.5 inset-x-3 z-40 rounded-[26px] bg-white/92 dark:bg-slate-900/92 backdrop-blur-2xl border border-slate-200/90 dark:border-slate-800 px-1.5 py-1.5 flex items-center justify-around gap-0.5 safe-area-bottom shadow-[0_16px_40px_-14px_rgba(7,30,23,0.28)]"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-l from-transparent via-amber-400/50 to-transparent"
      />
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <motion.button
            key={tab.id}
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex flex-col items-center justify-center flex-1 min-h-[48px] min-w-[44px] py-1 rounded-2xl transition-colors cursor-pointer ${
              isActive
                ? 'text-emerald-900 dark:text-emerald-200 font-black'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            {isActive && (
              <motion.span
                layoutId="theme1MobileNavPill"
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                className="absolute inset-0 rounded-2xl bg-gradient-to-b from-emerald-50 to-amber-50/70 dark:from-emerald-950/80 dark:to-slate-800/80 border border-emerald-200/80 dark:border-emerald-700/50 shadow-2xs"
              />
            )}
            <div className="relative z-10 flex flex-col items-center">
              <div className="relative">
                <Icon className={`w-[18px] h-[18px] ${isActive ? 'text-emerald-700 dark:text-amber-300 stroke-[2.3]' : ''}`} />
                {tab.badgeCount && tab.badgeCount > 0 ? (
                  <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-slate-900" />
                ) : null}
              </div>
              <span className="text-[10px] mt-0.5 whitespace-nowrap truncate max-w-[58px]">
                {tab.label}
              </span>
            </div>
          </motion.button>
        );
      })}

      <motion.button
        type="button"
        whileTap={{ scale: 0.92 }}
        onClick={onOpenMobileMenu}
        className="flex flex-col items-center justify-center flex-1 min-h-[48px] min-w-[44px] py-1 rounded-2xl text-slate-700 dark:text-slate-200 cursor-pointer"
      >
        <div className="w-8 h-6.5 rounded-xl bg-gradient-to-br from-[#071E17] via-[#0E3226] to-emerald-800 text-amber-300 border border-amber-400/35 flex items-center justify-center shadow-xs">
          <LayoutGrid className="w-3.5 h-3.5" />
        </div>
        <span className="text-[10px] mt-0.5 font-extrabold whitespace-nowrap">بخش‌ها</span>
      </motion.button>
    </nav>
  );
};

