import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, NavTabId } from './components/layout/Sidebar';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { LoginModal } from './components/auth/LoginModal';
import { SessionManagerModal } from './components/auth/SessionManagerModal';
import { CrextioLayout } from './components/crextio/CrextioLayout';
import { MizanLayout } from './components/mizan/MizanLayout';
import { GlobalMouseHalo } from './components/common/GlobalMouseHalo';

// Section components
import { DashboardSection } from './components/dashboard/DashboardSection';
import { CartableSection } from './components/cartable/CartableSection';
import { CoursesSection } from './components/courses/CoursesSection';
import { ProductsSection } from './components/products/ProductsSection';
import { CounselingSection } from './components/counseling/CounselingSection';
import { SpecializedCareerCounselingSection } from './components/counseling/SpecializedCareerCounselingSection';
import { ResearchMentorshipSection } from './components/research/ResearchMentorshipSection';
import { JudicialRulingsSection } from './components/rulings/JudicialRulingsSection';
import { WelfareSection } from './components/welfare/WelfareSection';
import { SynergyWallSection } from './components/synergy/SynergyWallSection';
import { AdminControlCenter } from './components/admin/AdminControlCenter';
import { AlumniDirectorySection } from './components/alumni/AlumniDirectorySection';
import { UserManagementModule } from './components/admin/UserManagementModule';

import { CrextioSubViews } from './components/crextio/CrextioSubViews';
import { Sparkles, ArrowRight } from 'lucide-react';

const tabTitles: Record<NavTabId, string> = {
  dashboard: 'داشبورد جامع و درگاه‌های دسترسی',
  cartable: 'کارتابل خدمات اداری و آموزشی',
  courses: 'دوره‌های تخصصی و کارگاه‌های علمی',
  products: 'فروشگاه آثار و کتب تخصصی فقه و قضا',
  counseling: 'خدمات مشاوره عمومی و روان‌شناختی',
  specialized_counseling: 'مشاوره تخصصی تحصیلی و شغلی قضاوت',
  research: 'راهبری پایان‌نامه‌ها',
  rulings: 'تالار نقد، ارزیابی و مباحثه آراء قضایی',
  welfare: 'تسهیلات رفاهی، اقامتگاه‌ها و سبد مصرفی',
  synergy: 'دیوار هم‌افزایی شغلی و دیوار همدلی',
  alumni: 'بانک جامع اطلاعات و شناسنامه دانش‌آموختگان',
  users: 'مدیریت کاربران (حساب‌های کاربری) و سطوح دسترسی',
  admin: 'مدیریت',
};

const MainLayout: React.FC = () => {
  const { designTheme, setDesignTheme } = useApp();
  const [activeTab, setActiveTab] = useState<NavTabId>('dashboard');
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // When Theme 3 (Mizan) is selected, render Mizan Workspace
  if (designTheme === 'mizan') {
    return <MizanLayout />;
  }

  // When Theme 2 (Crextio) is selected, render Crextio Workspace
  if (designTheme === 'crextio') {
    return <CrextioLayout onToggleToPortalTheme={() => setDesignTheme('portal')} />;
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
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <Navbar
          onOpenLogin={() => setLoginModalOpen(true)}
          onOpenSessions={() => setSessionModalOpen(true)}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
          activeSectionTitle={tabTitles[activeTab]}
        />
      </div>

      {/* Main Container with Sidebar + Content */}
      <div className="relative z-10 flex-1 flex max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6 pb-20 lg:pb-6">
        {/* Right Independent Floating Capsule Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />

        {/* Center/Left Main Content Area (offset by floating capsule sidebar) */}
        <main
          className="flex-1 min-w-0 transition-all duration-300 lg:mr-28"
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
                <div className="rounded-[40px] bg-[#FCFCF9]/95 dark:bg-[#182622]/95 border border-[#E3E0D3] dark:border-[#2A423B] p-6 sm:p-8 lg:p-10 shadow-2xl text-stone-900 dark:text-stone-100 min-h-[700px] transition-all duration-500">
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
                  {activeTab === 'specialized_counseling' && <SpecializedCareerCounselingSection />}
                  {activeTab === 'research' && <CrextioSubViews activeNav="Research" onNavigate={(tab) => setActiveTab(tab.toLowerCase() as NavTabId)} />}
                  {activeTab === 'rulings' && <CrextioSubViews activeNav="Rulings" onNavigate={(tab) => setActiveTab(tab.toLowerCase() as NavTabId)} />}
                  {activeTab === 'welfare' && <CrextioSubViews activeNav="Welfare" onNavigate={(tab) => setActiveTab(tab.toLowerCase() as NavTabId)} />}
                  {activeTab === 'synergy' && <CrextioSubViews activeNav="Synergy" onNavigate={(tab) => setActiveTab(tab.toLowerCase() as NavTabId)} />}
                  {activeTab === 'alumni' && <AlumniDirectorySection onNavigate={setActiveTab} />}
                  {activeTab === 'users' && <UserManagementModule />}
                  {activeTab === 'admin' && <AdminControlCenter />}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

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

      {/* Floating 3-Way Theme Switcher Capsule */}
      <div className="fixed bottom-6 left-6 z-50 flex items-center gap-2 bg-[#1A2621]/95 backdrop-blur-md p-1.5 rounded-full border border-white/20 shadow-2xl">
        <button
          onClick={() => setDesignTheme('portal')}
          className="px-3 py-1.5 rounded-full text-xs font-bold transition-all bg-amber-500 text-slate-900 shadow-sm"
        >
          تم ۱: پرتال
        </button>
        <button
          onClick={() => setDesignTheme('crextio')}
          className="px-3 py-1.5 rounded-full text-xs font-bold transition-all text-slate-300 hover:text-white"
        >
          تم ۲: کرکستیو
        </button>
        <button
          onClick={() => setDesignTheme('mizan')}
          className="px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 text-amber-200 hover:text-white"
        >
          <span className="w-2 h-2 rounded-full bg-[#158561] animate-pulse" />
          <span>تم ۳: میزان (جدید)</span>
        </button>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}

