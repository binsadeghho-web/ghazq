import React, { useState, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { NavTabId } from './types';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { LoginModal } from './components/auth/LoginModal';
import { ModernLoginPage } from './components/auth/ModernLoginPage';
import { DashboardSection } from './components/dashboard/DashboardSection';
import { CounselingSection } from './components/counseling/CounselingSection';
import { UserManagementModule } from './components/admin/UserManagementModule';
import { FinanceSection } from './components/finance/FinanceSection';
import { CrextioSubViews } from './components/crextio/CrextioSubViews';
import { Sparkles, ArrowRight, X, LayoutGrid } from 'lucide-react';
import { ModuleFallback } from './components/common/ModuleFallback';
import { ConcurrentConflictModal } from './components/common/ConcurrentConflictModal';
import { ToastContainer } from './components/common/ToastContainer';
import { getResolvedNavigationConfig } from './utils/navigationConfig';
import { isOrganizationalRole, isReadOnlyObserverRole } from './utils/rbacPolicy';

// Lazy Loaded Components with Inline Named Export Resolution (Phase 2 - Code Splitting)
const AdminControlCenter = lazy(() => import('./components/admin/AdminControlCenter').then(m => ({ default: m.AdminControlCenter })));
const CrextioLayout = lazy(() => import('./components/crextio/CrextioLayout').then(m => ({ default: m.CrextioLayout })));
const Theme3Layout = lazy(() => import('./components/theme3/Theme3Layout').then(m => ({ default: m.Theme3Layout })));

const MizanLayout = lazy(() => import('./components/mizan/MizanLayout').then(m => ({ default: m.MizanLayout })));
const WelfareSection = lazy(() => import('./components/welfare/WelfareSection').then(m => ({ default: m.WelfareSection })));
const AlumniDirectorySection = lazy(() => import('./components/alumni/AlumniDirectorySection').then(m => ({ default: m.AlumniDirectorySection })));
const SpecializedCareerCounselingSection = lazy(() => import('./components/counseling/SpecializedCareerCounselingSection').then(m => ({ default: m.SpecializedCareerCounselingSection })));

const tabTitles: Record<NavTabId, string> = {
  dashboard: 'داشبورد جامع و درگاه‌های دسترسی',
  cartable: 'کارتابل خدمات اداری و آموزشی',
  courses: 'دوره‌های تخصصی و کارگاه‌های علمی',
  products: 'کتاب و محصولات چند رسانه‌ای',
  counseling: 'خدمات روانشناختی و مشاوره',
  specialized_counseling: 'مشاوره تخصصی تحصیلی و شغلی قضاوت',
  research: 'راهبری پژوهش و مقاله (خدمات پژوهشی)',
  rulings: 'تالار نقد، ارزیابی و مباحثه آراء قضایی',
  welfare: 'تسهیلات رفاهی، اقامتگاه‌ها و سبد مصرفی',
  synergy: 'دیوار هم‌افزایی شغلی و دیوار همدلی',
  alumni: 'بانک جامع اطلاعات و شناسنامه دانش‌آموختگان',
  users: 'مدیریت کاربران (حساب‌های کاربری) و سطوح دسترسی',
  finance: 'امور مالی، حسابداری و مدیریت درآمدها',
  admin: 'مدیریت سایت و پایش امنیت',
};

const MainLayout: React.FC = () => {
  const { designTheme, setDesignTheme, currentUser, isAuthLoading, crextioConfig } = useApp();
  const [activeTab, setActiveTab] = useState<NavTabId>('dashboard');
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const alumniConfiguredTheme: 'crextio' | 'theme3' =
    crextioConfig.alumniDefaultTheme === 'theme3' ? 'theme3' : 'crextio';

  useEffect(() => {
    if (currentUser?.role === 'alumni' && designTheme !== alumniConfiguredTheme) {
      setDesignTheme(alumniConfiguredTheme);
    }
  }, [currentUser?.role, alumniConfiguredTheme, designTheme, setDesignTheme]);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#040A19] flex flex-col items-center justify-center gap-4 text-[#F3D082]" dir="rtl">
        <div className="w-11 h-11 rounded-2xl border-2 border-[#D8A84E]/30 border-t-[#F3D082] animate-spin" />
        <p className="text-xs font-bold tracking-wide text-[#C6D3EB]">در حال بررسی نشست امنیتی در پایگاه داده...</p>
      </div>
    );
  }

  // Reform 55: Mandatory Login-First Gate for every visitor
  if (!currentUser) {
    return <ModernLoginPage isFullPage={true} />;
  }

  const isRegularEndUser = currentUser.role === 'alumni' || currentUser.role === 'customer';
  const effectiveTheme = currentUser.role === 'alumni' ? alumniConfiguredTheme : designTheme;

  // Theme 3 (Mobile-Inspired Laptop Theme)
  if (effectiveTheme === 'theme3') {
    return (
      <Suspense fallback={<ModuleFallback />}>
        <Theme3Layout />
      </Suspense>
    );
  }

  // Default theme is Theme 2 (Crextio). Regular users (alumni) stay on the configured alumni theme.
  if (effectiveTheme === 'crextio' || currentUser?.role === 'alumni') {
    return (
      <Suspense fallback={<ModuleFallback />}>
        <CrextioLayout onToggleToPortalTheme={() => setDesignTheme('portal')} />
      </Suspense>
    );
  }

  return (
    <div
      className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col text-slate-800 dark:text-slate-100 font-sans transition-colors relative overflow-x-hidden selection:bg-amber-500/30"
      dir="rtl"
    >
      {/* 
        توجه: هاله نوری در تم ۱ طبق دستور کاربر از فضاهای خالی برداشته شد 
        و منحصراً فقط روی تیتر داشبورد و کارت‌های داشبورد فعال است
      */}

      {/* Dynamic Ambient Background Mesh Glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full bg-indigo-500/10 dark:bg-indigo-500/15 blur-3xl" />
        <div className="absolute top-1/3 left-1/4 w-[600px] h-[600px] rounded-full bg-amber-500/10 dark:bg-amber-500/10 blur-3xl" />
        <div className="absolute bottom-10 right-10 w-[450px] h-[450px] rounded-full bg-purple-500/10 dark:bg-violet-500/15 blur-3xl" />
      </div>

      {/* Top 3-Zone Navbar */}
      <div className="w-full max-w-[1600px] mx-auto px-2.5 sm:px-6 lg:px-8">
        <Navbar
          onOpenLogin={() => setLoginModalOpen(true)}
          onOpenSessions={() => setSessionModalOpen(true)}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
          activeSectionTitle={
            getResolvedNavigationConfig(crextioConfig.navigationConfig).verticalSidebar.find(
              item => item.id === activeTab
            )?.label || tabTitles[activeTab]
          }
        />
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 flex max-w-[1600px] w-full mx-auto px-2.5 sm:px-6 lg:px-8 py-3.5 sm:py-6 gap-6 pb-24 lg:pb-6">
        <main
          className="flex-1 min-w-0 transition-all duration-300"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.99 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="w-full"
            >
              {/* داشبورد و صفحه اصلی تم ۱ همچنان متمایز و اختصاصی باقی می‌ماند */}
              {activeTab === 'dashboard' ? (
                <DashboardSection onNavigate={setActiveTab} />
              ) : (
                /* 
                  وقتی داخل هر یک از بخش‌های مختلف می‌رویم:
                  ظاهر بخش‌ها مطابق درخواست کاربر دقیقاً به فرمت تم ۲ (Crextio luxury emerald & ivory) درمی‌آید
                */
                <div className="rounded-2xl sm:rounded-[40px] bg-[#FCFCF9]/95 dark:bg-[#182622]/95 border border-[#E3E0D3] dark:border-[#2A423B] p-3.5 sm:p-8 lg:p-10 shadow-2xl text-stone-900 dark:text-stone-100 min-h-[60vh] sm:min-h-[700px] transition-all duration-500">
                  {/* Top Bar Indicator for Sub-sections */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-6 border-b border-stone-200/80 dark:border-[#2A423B]">
                    <div className="flex items-center gap-2.5">
                      <span className="px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        طراحی فاخر زمردی (ظاهر تم ۲)
                      </span>
                      <span className="text-xs text-stone-500 dark:text-stone-400 font-medium hidden md:inline">
                        ویترین و سامانه تخصصی دانش‌آموختگان فقه و قضا
                      </span>
                    </div>

                    <button
                      onClick={() => setActiveTab('dashboard')}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-stone-100 dark:bg-[#233832] hover:bg-stone-200 dark:hover:bg-[#2C473F] text-stone-700 dark:text-stone-200 text-xs font-bold border border-stone-200 dark:border-[#34544B] transition-all self-start sm:self-auto hover:scale-105 active:scale-95"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>بازگشت به داشبورد</span>
                    </button>
                  </div>

                  {/* نمای غنی و زیباتر بخش‌های مختلف با فرمت تم ۲ */}
                  {activeTab === 'cartable' && <CrextioSubViews activeNav="Cartable" onNavigate={(tab) => setActiveTab(tab.toLowerCase() as NavTabId)} />}
                  {activeTab === 'courses' && <CrextioSubViews activeNav="Courses" onNavigate={(tab) => setActiveTab(tab.toLowerCase() as NavTabId)} />}
                  {activeTab === 'products' && <CrextioSubViews activeNav="Products" onNavigate={(tab) => setActiveTab(tab.toLowerCase() as NavTabId)} />}
                  {activeTab === 'counseling' && <CounselingSection initialTab="request" />}
                  {activeTab === 'specialized_counseling' && (
                    <Suspense fallback={<ModuleFallback />}>
                      <SpecializedCareerCounselingSection />
                    </Suspense>
                  )}
                  {activeTab === 'research' && <CrextioSubViews activeNav="Research" onNavigate={(tab) => setActiveTab(tab.toLowerCase() as NavTabId)} />}
                  {activeTab === 'rulings' && <CrextioSubViews activeNav="Rulings" onNavigate={(tab) => setActiveTab(tab.toLowerCase() as NavTabId)} />}
                  {activeTab === 'welfare' && (
                    <Suspense fallback={<ModuleFallback />}>
                      <WelfareSection />
                    </Suspense>
                  )}
                  {activeTab === 'synergy' && <CrextioSubViews activeNav="Synergy" onNavigate={(tab) => setActiveTab(tab.toLowerCase() as NavTabId)} />}
                  {activeTab === 'alumni' && !isRegularEndUser && (
                    <Suspense fallback={<ModuleFallback />}>
                      <AlumniDirectorySection onNavigate={setActiveTab} />
                    </Suspense>
                  )}
                  {activeTab === 'users' && !isRegularEndUser && <UserManagementModule />}
                  {activeTab === 'finance' && !isRegularEndUser && <FinanceSection />}
                  {activeTab === 'admin' && !isRegularEndUser && (
                    <Suspense fallback={<ModuleFallback />}>
                      <AdminControlCenter />
                    </Suspense>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Sections Sheet for Theme 1 */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end" dir="rtl">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 360, damping: 32 }}
              className="relative z-10 bg-white dark:bg-slate-900 rounded-t-3xl border-t border-slate-200 dark:border-slate-800 max-h-[82vh] flex flex-col overflow-hidden safe-area-bottom"
            >
              <div className="flex flex-col items-center pt-2.5 pb-2 px-4 border-b border-slate-200 dark:border-slate-800">
                <div className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mb-2" />
                <div className="w-full flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <LayoutGrid className="w-4 h-4 text-emerald-600" />
                    <span>دسترسی سریع به بخش‌های سامانه</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-3.5 grid grid-cols-2 gap-2.5 overflow-y-auto">
                {(Object.keys(tabTitles) as NavTabId[])
                  .filter(t => !isRegularEndUser || (t !== 'alumni' && t !== 'users' && t !== 'finance' && t !== 'admin'))
                  .map(tabKey => (
                    <button
                      key={tabKey}
                      type="button"
                      onClick={() => {
                        setActiveTab(tabKey);
                        setMobileMenuOpen(false);
                      }}
                      className={`p-3 rounded-2xl border text-right text-xs font-bold transition-all min-h-[52px] flex flex-col justify-center cursor-pointer ${
                        activeTab === tabKey
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <span className="line-clamp-2 leading-snug">{tabTitles[tabKey]}</span>
                    </button>
                  ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Ergonomic Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenMobileMenu={() => setMobileMenuOpen(true)}
      />

      {/* Authentication & Session Modals */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
      />

      {/* Floating Theme Switcher Capsule (Offset cleanly above bottom mobile tab bar) */}
      {currentUser && isOrganizationalRole(currentUser.role) && !isReadOnlyObserverRole(currentUser.role) && (
        <div className="fixed bottom-20 lg:bottom-6 left-3 sm:left-6 z-40 flex items-center gap-1.5 bg-[#1A2621]/95 backdrop-blur-md p-1.5 rounded-full border border-white/20 shadow-2xl">
          <span className="px-2.5 sm:px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-bold bg-amber-500 text-slate-900 shadow-sm">
            تم ۱: پرتال
          </span>
          <button
            type="button"
            onClick={() => setDesignTheme('crextio')}
            className="px-2.5 sm:px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-bold transition-all cursor-pointer text-slate-300 hover:text-white"
          >
            تم ۲: میزان
          </button>
          <button
            type="button"
            onClick={() => setDesignTheme('theme3')}
            className="px-2.5 sm:px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-bold transition-all cursor-pointer text-emerald-300 hover:text-white"
          >
            تم ۳: موبایل‌محور
          </button>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
      <ConcurrentConflictModal />
      <ToastContainer />
    </AppProvider>
  );
}

