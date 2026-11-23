import React from 'react';
import { NavTabId } from '../../types';
import { LayoutDashboard, Inbox, GraduationCap, Scale, Gift, Menu } from 'lucide-react';
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

  return (
    <nav 
      aria-label="ناوبری لمسی موبایل"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/90 dark:border-slate-800 px-1.5 pt-1 flex items-center justify-around safe-area-bottom shadow-[0_-8px_24px_-12px_rgba(15,23,42,0.12)]"
    >
      <button
        onClick={() => setActiveTab('dashboard')}
        className={`flex flex-col items-center justify-center flex-1 min-h-[52px] min-w-[44px] py-1 rounded-xl transition-colors cursor-pointer ${
          activeTab === 'dashboard'
            ? 'text-emerald-800 dark:text-emerald-300 font-black'
            : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        <LayoutDashboard className="w-5 h-5" />
        <span className="text-[10px] mt-0.5 whitespace-nowrap truncate max-w-[60px]">
          {labelMap.get('dashboard') || 'داشبورد'}
        </span>
      </button>

      <button
        onClick={() => setActiveTab('cartable')}
        className={`flex flex-col items-center justify-center flex-1 min-h-[52px] min-w-[44px] py-1 rounded-xl transition-colors relative cursor-pointer ${
          activeTab === 'cartable'
            ? 'text-emerald-800 dark:text-emerald-300 font-black'
            : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        <div className="relative">
          <Inbox className="w-5 h-5" />
          {pendingCount > 0 && (
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500" />
          )}
        </div>
        <span className="text-[10px] mt-0.5 whitespace-nowrap truncate max-w-[60px]">
          {labelMap.get('cartable') || 'کارتابل'}
        </span>
      </button>

      <button
        onClick={() => setActiveTab('courses')}
        className={`flex flex-col items-center justify-center flex-1 min-h-[52px] min-w-[44px] py-1 rounded-xl transition-colors cursor-pointer ${
          activeTab === 'courses'
            ? 'text-emerald-800 dark:text-emerald-300 font-black'
            : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        <GraduationCap className="w-5 h-5" />
        <span className="text-[10px] mt-0.5 whitespace-nowrap truncate max-w-[60px]">
          {labelMap.get('courses') || 'دوره‌ها'}
        </span>
      </button>

      <button
        onClick={() => setActiveTab('rulings')}
        className={`flex flex-col items-center justify-center flex-1 min-h-[52px] min-w-[44px] py-1 rounded-xl transition-colors cursor-pointer ${
          activeTab === 'rulings'
            ? 'text-emerald-800 dark:text-emerald-300 font-black'
            : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        <Scale className="w-5 h-5" />
        <span className="text-[10px] mt-0.5 whitespace-nowrap truncate max-w-[60px]">
          {labelMap.get('rulings') || 'تالار رأی'}
        </span>
      </button>

      <button
        onClick={() => setActiveTab('welfare')}
        className={`flex flex-col items-center justify-center flex-1 min-h-[52px] min-w-[44px] py-1 rounded-xl transition-colors cursor-pointer ${
          activeTab === 'welfare'
            ? 'text-emerald-800 dark:text-emerald-300 font-black'
            : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        <Gift className="w-5 h-5" />
        <span className="text-[10px] mt-0.5 whitespace-nowrap truncate max-w-[60px]">
          {labelMap.get('welfare') || 'رفاهیات'}
        </span>
      </button>

      <button
        onClick={onOpenMobileMenu}
        className="flex flex-col items-center justify-center flex-1 min-h-[52px] min-w-[44px] py-1 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
      >
        <Menu className="w-5 h-5" />
        <span className="text-[10px] mt-0.5 whitespace-nowrap">بخش‌ها</span>
      </button>
    </nav>
  );
};
