import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { 
  ShieldCheck, 
  Laptop, 
  LogOut, 
  LogIn, 
  ChevronDown, 
  Sun, 
  Moon, 
  KeyRound,
  Menu,
  X,
  Sparkles,
  Eye,
  IdCard
} from 'lucide-react';
import { AlumniIdentityCardModal } from '../alumni/AlumniIdentityCardModal';
import { calculateProfileCompletion } from '../../utils/profileCompletion';
import { toPersianNumbers } from '../../utils/persianNumbers';

interface NavbarProps {
  onOpenLogin: () => void;
  onOpenSessions: () => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  activeSectionTitle?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenLogin,
  onOpenSessions,
  mobileMenuOpen,
  setMobileMenuOpen,
  activeSectionTitle = 'کارتابل خدمات اداری و آموزشی',
}) => {
  const { currentUser, logout, switchUserRole, theme, toggleTheme, designTheme, setDesignTheme } = useApp();
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [isIdentityCardOpen, setIsIdentityCardOpen] = useState(false);
  const completionPct = calculateProfileCompletion(currentUser).percentage;

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return 'مدیر کل';
      case 'admin':
        return 'مدیر ارشد';
      case 'general_observer':
        return 'ناظر کل (مشاهده تمام بخش‌ها)';
      case 'alumni_manager':
        return 'مدیر دانش‌آموختگان';
      case 'admin_finance_officer':
        return 'مسئول اداری و مالی';
      case 'education_deputy':
        return 'معاونت آموزش';
      case 'cultural_educational_officer':
        return 'مسئول فرهنگی و آموزشی';
      case 'research_deputy':
        return 'معاونت پژوهش';
      case 'psychologist_counselor':
        return 'روانشناس و مشاور مرکز';
      case 'supervisor':
        return 'مسئول بخش';
      case 'customer':
        return 'مشتری';
      case 'alumni':
      default:
        return 'دانش‌آموخته';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/70 dark:border-white/10 transition-colors shadow-xs">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        {/* Exact 3-Zone Top Bar Contract */}
        <div className="flex items-center justify-between h-16 gap-8">
          
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white focus:outline-none min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="منوی سامانه"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <a href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-slate-800 text-amber-400 flex items-center justify-center font-bold border border-slate-700/60 transition-transform group-active:scale-95">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight whitespace-nowrap">
                سامانه دانش‌آموختگان فقه و قضا
              </span>
            </a>
          </div>

          {/* Zone 2: Contextual Section Title / Breadcrumb (Single line text, whitespace-nowrap) */}
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 overflow-hidden">
            <span className="text-slate-400 dark:text-slate-500">پرتال سازمانی</span>
            <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">/</span>
            <span className="font-semibold text-slate-700 dark:text-slate-200 truncate">
              {activeSectionTitle}
            </span>
          </div>

          {/* Zone 3: Actions (Theme Toggle, Sessions, Role Switcher, Profile/Login) */}
          <div className="flex items-center gap-2.5 shrink-0">
            
            {/* Quick Alumni Simulation Switch */}
            {currentUser && currentUser.role !== 'alumni' && (
              <button
                onClick={() => switchUserRole('alumni')}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 rounded-xl transition-all border border-indigo-200 dark:border-indigo-800 shadow-2xs active:scale-95 cursor-pointer"
                title="مشاهده فوری سامانه از دید دانش‌آموخته"
              >
                <Eye className="w-3.5 h-3.5 text-indigo-500" />
                <span>دید دانش‌آموخته</span>
              </button>
            )}

            {/* Theme 2 & Theme 3 Switcher Buttons */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold">
              <button
                onClick={() => setDesignTheme('crextio')}
                className="px-2.5 py-1 rounded-lg text-slate-700 dark:text-amber-300 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap"
                title="تم ۲: ویترین و طرح میزان"
              >
                تم ۲
              </button>
              <button
                onClick={() => setDesignTheme('minimal')}
                className="px-2.5 py-1 rounded-lg text-emerald-700 dark:text-emerald-300 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap"
                title="تم ۳: مجمع مینیمال و هم‌افزایی"
              >
                تم ۳ (مینیمال)
              </button>
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors active:scale-95 min-h-[40px] min-w-[40px] flex items-center justify-center"
              title={theme === 'dark' ? 'حالت روز' : 'حالت شب'}
              aria-label="تغییر تم"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>



            {currentUser ? (
              <div className="flex items-center gap-2">
                {/* Reform 56: My Identity Card Button */}
                <button
                  onClick={() => setIsIdentityCardOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800/70 rounded-xl transition-all active:scale-95 whitespace-nowrap cursor-pointer"
                  title="مشاهده و تکمیل کارت اطلاعات هویتی من"
                >
                  <IdCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="hidden sm:inline">کارت اطلاعات هویتی من</span>
                  <span className="px-1.5 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-black">
                    {toPersianNumbers(completionPct)}٪
                  </span>
                </button>

                {/* Active Sessions Counter */}
                <button
                  onClick={onOpenSessions}
                  className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-lg transition-colors active:scale-95 whitespace-nowrap"
                  title="مدیریت نشست‌های فعال دستگاه‌ها"
                >
                  <Laptop className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-mono tabular-nums">{currentUser.sessions.length}</span>
                  <span className="text-[11px] text-slate-400">دستگاه</span>
                </button>

                {/* Unboxed User Identity Label */}
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                  {currentUser.profilePictureUrl ? (
                    <img src={currentUser.profilePictureUrl} alt={currentUser.fullName} className="w-6 h-6 rounded-md object-cover shrink-0" />
                  ) : (
                    <div className="w-6 h-6 rounded-md bg-slate-900 dark:bg-slate-700 text-white flex items-center justify-center text-[11px] font-bold">
                      {currentUser.avatarText}
                    </div>
                  )}
                  <div className="hidden sm:flex items-center gap-1.5 text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
                      {currentUser.fullName}
                    </span>
                    <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {getRoleLabel(currentUser.role)}
                    </span>
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-colors active:scale-95"
                  title="خروج از سامانه"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors shadow-xs active:scale-95"
              >
                <LogIn className="w-4 h-4 text-amber-400" />
                <span>ورود به سامانه</span>
              </button>
            )}

          </div>

        </div>
      </div>
      <AlumniIdentityCardModal
        isOpen={isIdentityCardOpen}
        onClose={() => setIsIdentityCardOpen(false)}
      />
    </header>
  );
};
