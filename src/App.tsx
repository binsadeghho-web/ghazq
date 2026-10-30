import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, NavTabId } from './components/layout/Sidebar';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { LoginModal } from './components/auth/LoginModal';
import { SessionManagerModal } from './components/auth/SessionManagerModal';
import { CrextioLayout } from './components/crextio/CrextioLayout';
import { GlobalMouseHalo } from './components/common/GlobalMouseHalo';

// Section components
import { DashboardSection } from './components/dashboard/DashboardSection';
import { CartableSection } from './components/cartable/CartableSection';
import { CoursesSection } from './components/courses/CoursesSection';
import { ProductsSection } from './components/products/ProductsSection';
import { CounselingSection } from './components/counseling/CounselingSection';
import { ResearchMentorshipSection } from './components/research/ResearchMentorshipSection';
import { JudicialRulingsSection } from './components/rulings/JudicialRulingsSection';
import { WelfareSection } from './components/welfare/WelfareSection';
import { SynergyWallSection } from './components/synergy/SynergyWallSection';
import { AdminControlCenter } from './components/admin/AdminControlCenter';
import { AlumniDirectorySection } from './components/alumni/AlumniDirectorySection';
import { UserManagementModule } from './components/admin/UserManagementModule';

const tabTitles: Record<NavTabId, string> = {
  dashboard: 'داشبورد جامع و درگاه‌های دسترسی',
  cartable: 'کارتابل خدمات اداری و آموزشی',
  courses: 'دوره‌های تخصصی و کارگاه‌های علمی',
  products: 'فروشگاه آثار و کتب تخصصی فقه و قضا',
  counseling: 'خدمات مشاوره و کوچینگ شغلی قضات',
  research: 'راهبری پژوهش، پایان‌نامه و فرصت مطالعاتی',
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

  // When Theme 2 (Crextio) is selected, render Crextio Workspace
  if (designTheme === 'crextio') {
    return <CrextioLayout onToggleToPortalTheme={() => setDesignTheme('portal')} />;
  }

  return (
    <div
      className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col text-slate-800 dark:text-slate-100 font-sans transition-colors relative overflow-x-hidden selection:bg-amber-500/30"
      dir="rtl"
    >
      {/* Global Interactive Mouse Glow over background & empty spaces */}
      <GlobalMouseHalo theme="portal" />

      {/* Dynamic Ambient Background Mesh Glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full bg-indigo-500/10 dark:bg-indigo-500/15 blur-3xl" />
        <div className="absolute top-1/3 left-1/4 w-[600px] h-[600px] rounded-full bg-amber-500/10 dark:bg-amber-500/10 blur-3xl" />
        <div className="absolute bottom-10 right-10 w-[450px] h-[450px] rounded-full bg-purple-500/10 dark:bg-violet-500/15 blur-3xl" />
      </div>

      {/* Top 3-Zone Navbar */}
      <Navbar
        onOpenLogin={() => setLoginModalOpen(true)}
        onOpenSessions={() => setSessionModalOpen(true)}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        activeSectionTitle={tabTitles[activeTab]}
      />

      {/* Main Container with Sidebar + Content */}
      <div className="relative z-10 flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6 pb-20 lg:pb-6">
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
              {activeTab === 'dashboard' && <DashboardSection onNavigate={setActiveTab} />}
              {activeTab === 'cartable' && <CartableSection />}
              {activeTab === 'courses' && <CoursesSection />}
              {activeTab === 'products' && <ProductsSection />}
              {activeTab === 'counseling' && <CounselingSection />}
              {activeTab === 'research' && <ResearchMentorshipSection />}
              {activeTab === 'rulings' && <JudicialRulingsSection />}
              {activeTab === 'welfare' && <WelfareSection />}
              {activeTab === 'synergy' && <SynergyWallSection />}
              {activeTab === 'alumni' && <AlumniDirectorySection onNavigate={setActiveTab} />}
              {activeTab === 'users' && <UserManagementModule />}
              {activeTab === 'admin' && <AdminControlCenter />}
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

      {/* Floating Theme 2 Switcher Badge */}
      <div className="fixed bottom-6 left-6 z-50">
        <button
          onClick={() => setDesignTheme('crextio')}
          className="flex items-center gap-2.5 px-5 py-3 rounded-full bg-[#222222] hover:bg-black text-white text-xs font-bold shadow-2xl border border-white/20 hover:scale-105 transition-all group active:scale-95"
          title="مشاهده تم دوم (طرح مینیمال Crextio)"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-[#F8D548] animate-pulse" />
          <span>مشاهده تم ۲: Crextio Workspace (طرح درخواستی)</span>
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

