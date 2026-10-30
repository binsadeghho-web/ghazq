import React from 'react';
import { NavTabId } from './Sidebar';
import { LayoutDashboard, Inbox, GraduationCap, Scale, Gift, Menu } from 'lucide-react';
import { useApp } from '../../context/AppContext';

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
  const { cartableRequests } = useApp();
  const pendingCount = cartableRequests.filter(r => r.status === 'pending' || r.status === 'need_info').length;

  return (
    <nav 
      aria-label="ناوبری لمسی موبایل"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 h-14 px-2 flex items-center justify-around safe-area-bottom"
    >
      <button
        onClick={() => setActiveTab('dashboard')}
        className={`flex flex-col items-center justify-center flex-1 h-full min-h-[44px] min-w-[44px] transition-colors ${
          activeTab === 'dashboard'
            ? 'text-slate-900 dark:text-white font-bold'
            : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        <LayoutDashboard className="w-5 h-5" />
        <span className="text-[10px] mt-0.5 whitespace-nowrap">داشبورد</span>
      </button>

      <button
        onClick={() => setActiveTab('cartable')}
        className={`flex flex-col items-center justify-center flex-1 h-full min-h-[44px] min-w-[44px] transition-colors relative ${
          activeTab === 'cartable'
            ? 'text-slate-900 dark:text-white font-bold'
            : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        <div className="relative">
          <Inbox className="w-5 h-5" />
          {pendingCount > 0 && (
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500" />
          )}
        </div>
        <span className="text-[10px] mt-0.5 whitespace-nowrap">کارتابل</span>
      </button>

      <button
        onClick={() => setActiveTab('courses')}
        className={`flex flex-col items-center justify-center flex-1 h-full min-h-[44px] min-w-[44px] transition-colors ${
          activeTab === 'courses'
            ? 'text-slate-900 dark:text-white font-bold'
            : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        <GraduationCap className="w-5 h-5" />
        <span className="text-[10px] mt-0.5 whitespace-nowrap">دوره‌ها</span>
      </button>

      <button
        onClick={() => setActiveTab('rulings')}
        className={`flex flex-col items-center justify-center flex-1 h-full min-h-[44px] min-w-[44px] transition-colors ${
          activeTab === 'rulings'
            ? 'text-slate-900 dark:text-white font-bold'
            : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        <Scale className="w-5 h-5" />
        <span className="text-[10px] mt-0.5 whitespace-nowrap">تالار رأی</span>
      </button>

      <button
        onClick={() => setActiveTab('welfare')}
        className={`flex flex-col items-center justify-center flex-1 h-full min-h-[44px] min-w-[44px] transition-colors ${
          activeTab === 'welfare'
            ? 'text-slate-900 dark:text-white font-bold'
            : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        <Gift className="w-5 h-5" />
        <span className="text-[10px] mt-0.5 whitespace-nowrap">رفاهیات</span>
      </button>

      <button
        onClick={onOpenMobileMenu}
        className="flex flex-col items-center justify-center flex-1 h-full min-h-[44px] min-w-[44px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
      >
        <Menu className="w-5 h-5" />
        <span className="text-[10px] mt-0.5 whitespace-nowrap">بخش‌ها</span>
      </button>
    </nav>
  );
};
