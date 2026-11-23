import React, { useState, useRef, useCallback, lazy, Suspense } from 'react';
import { useApp } from '../../context/AppContext';
import { NavTabId } from '../../types';
import { ModernDashboardCard } from '../ModernDashboardCard';
import { toPersianNumbers } from '../../utils/persianNumbers';
import { DashboardWidgetsSuite } from './DashboardWidgetsSuite';
import { AlumniProfileCompletionWidget } from '../alumni/AlumniProfileCompletionWidget';
import { AlumniIdentityCardModal } from '../alumni/AlumniIdentityCardModal';
import { AppSectionId } from '../../types';
import { canViewSection, useRbacPolicies } from '../../utils/rbacPolicy';
import {
  applyNavigationCustomization,
  getResolvedNavigationConfig,
} from '../../utils/navigationConfig';
import {
  Inbox,
  GraduationCap,
  BookOpen,
  HeartHandshake,
  FileText,
  Scale,
  Gift,
  Users2,
  Users,
  ShieldCheck,
  LayoutDashboard,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  Wallet,
  Menu
} from 'lucide-react';

const ThemeCustomizerModal = lazy(() =>
  import('../admin/ThemeCustomizerModal').then(m => ({ default: m.ThemeCustomizerModal }))
);

interface DashboardSectionProps {
  onNavigate: (tabId: NavTabId) => void;
}

interface DashboardServiceCardDef {
  id: string;
  navTab: NavTabId;
  sectionId: AppSectionId;
  staffOnly?: boolean;
  title: string;
  subtext: string;
  badge: string;
  trendContext: string;
  accent: 'indigo' | 'violet' | 'emerald' | 'rose' | 'amber' | 'cyan' | 'teal' | 'purple';
  icon: React.ReactNode;
  notificationCount?: number;
  hasNotification?: boolean;
}

export const DashboardSection: React.FC<DashboardSectionProps> = ({ onNavigate }) => {
  const {
    currentUser,
    users,
    cartableRequests,
    courses,
    products,
    consultants,
    researchMentorships,
    rulings,
    welfareRequests,
    consumables,
    synergyPosts,
    crextioConfig,
  } = useApp();
  const { rolePolicies } = useRbacPolicies();

  const headerRef = useRef<HTMLDivElement>(null);
  const [headerMousePos, setHeaderMousePos] = useState({ x: 0, y: 0 });
  const [isAlumniPreview, setIsAlumniPreview] = useState(false);
  const [isIdentityCardOpen, setIsIdentityCardOpen] = useState(false);
  const [isNavCustomizerOpen, setIsNavCustomizerOpen] = useState(false);

  const handleHeaderMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!headerRef.current) return;
    const rect = headerRef.current.getBoundingClientRect();
    setHeaderMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);

  const pendingRequestsCount = cartableRequests.filter(
    r => r.status === 'pending' || r.status === 'need_info'
  ).length;

  const showAdminCard =
    (currentUser?.role === 'admin' ||
      currentUser?.role === 'super_admin' ||
      currentUser?.role === 'alumni_manager' ||
      currentUser?.role === 'supervisor') &&
    !isAlumniPreview;

  const resolvedNav = getResolvedNavigationConfig(crextioConfig.navigationConfig);

  const candidateCards: DashboardServiceCardDef[] = [
    {
      id: 'People',
      navTab: 'cartable',
      sectionId: 'cartable',
      title: 'خدمات اداری و آموزشی',
      subtext: 'پیگیری مطالبات اداری، ارتقای رتبه، صدور گواهی‌ها و تبادل اسناد رسمی',
      badge: 'پرتال اداری',
      trendContext:
        pendingRequestsCount > 0
          ? `${pendingRequestsCount} درخواست در انتظار پاسخ مسئول`
          : 'کارتابل آماده و پاسخ‌گویی برخط',
      accent: 'indigo',
      icon: <Inbox className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />,
      notificationCount: pendingRequestsCount,
      hasNotification: pendingRequestsCount > 0,
    },
    {
      id: 'Courses',
      navTab: 'courses',
      sectionId: 'courses',
      title: 'دوره‌های تخصصی',
      subtext: 'کارگاه‌های عالی فقه کاربردی، اسناد و آرشیو صوتی جلسات آموزشی',
      badge: 'آموزش تخصصی',
      trendContext: `${courses.length} دوره آموزشی و کارگاه فعال`,
      accent: 'violet',
      icon: <GraduationCap className="w-6 h-6 text-violet-600 dark:text-violet-400" />,
    },
    {
      id: 'Products',
      navTab: 'products',
      sectionId: 'products',
      title: 'کتاب و محصولات چند رسانه‌ای',
      subtext: 'دانشنامه‌های فقهی-حقوقی، نشست‌های علمی و متون مرجع قضایی',
      badge: 'انتشارات مرجع',
      trendContext: `${products.length} اثر و نشریه علمی منتشرشده`,
      accent: 'emerald',
      icon: <BookOpen className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />,
    },
    {
      id: 'CounselingGeneral',
      navTab: 'counseling',
      sectionId: 'counseling',
      title: 'خدمات مشاوره عمومی',
      subtext: 'سلامت روان، تحکیم خانواده، مشاوره فردی، زوج‌درمانی و سبک زندگی',
      badge: 'مشاوره عمومی',
      trendContext: `${consultants.filter(c => c.counselingType !== 'specialized_career').length} روان‌شناس و مشاور ارشد`,
      accent: 'rose',
      icon: <HeartHandshake className="w-6 h-6 text-rose-600 dark:text-rose-400" />,
    },
    {
      id: 'SpecializedCounseling',
      navTab: 'specialized_counseling',
      sectionId: 'specialized_counseling',
      title: 'مشاوره تخصصی شغلی قضا',
      subtext: 'هدایت شغلی-تحصیلی با قضات پیشکسوت دیوان عالی، ارتقای پایه و اختبار',
      badge: 'هدایت شغلی قضا',
      trendContext: `${consultants.filter(c => c.counselingType === 'specialized_career').length} استاد و قاضی پیشکسوت`,
      accent: 'amber',
      icon: <Scale className="w-6 h-6 text-amber-600 dark:text-amber-400" />,
    },
    {
      id: 'Research',
      navTab: 'research',
      sectionId: 'research',
      title: 'راهبری پژوهش و مقاله (خدمات پژوهشی)',
      subtext: 'پک کامل یا مشورت موردی پایان‌نامه و مقاله، اساتید مجرب و اسکان مطالعاتی قم',
      badge: 'خدمات پژوهشی',
      trendContext: `${researchMentorships.length} پرونده پژوهشی ثبت‌شده`,
      accent: 'amber',
      icon: <FileText className="w-6 h-6 text-amber-600 dark:text-amber-400" />,
    },
    {
      id: 'Rulings',
      navTab: 'rulings',
      sectionId: 'rulings',
      title: 'تالار رأی قضایی',
      subtext: 'نقد موشکافانه احکام توسط قضات تجدیدنظر و دیوان عالی کشور',
      badge: 'مباحثات فقهی',
      trendContext: `${rulings.length} دادنامه نقدشده`,
      accent: 'cyan',
      icon: <Scale className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />,
    },
    {
      id: 'Welfare',
      navTab: 'welfare',
      sectionId: 'welfare',
      title: 'تسهیلات و رفاهیات',
      subtext: 'وام قرض‌الحسنه صندوق حامی، اقامتگاه مشهد و قم، تعاونی مصرف',
      badge: 'صندوق رفاهی',
      trendContext: `${welfareRequests.length + consumables.length} طرح رفاهی آماده`,
      accent: 'teal',
      icon: <Gift className="w-6 h-6 text-teal-600 dark:text-teal-400" />,
    },
    {
      id: 'Synergy',
      navTab: 'synergy',
      sectionId: 'synergy',
      title: 'دیوار هم‌افزایی',
      subtext: 'استعلام‌های رویه‌ای استانی با شناسه ناشناس و پویش‌های همدلی اعضا',
      badge: 'تعاون همکاران',
      trendContext: `${synergyPosts.length} گفتگو و استعلام رویه‌ای`,
      accent: 'purple',
      icon: <Users2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />,
    },
    {
      id: 'Finance',
      navTab: 'finance',
      sectionId: 'finance',
      staffOnly: true,
      title: 'امور مالی و حسابداری',
      subtext: 'مدیریت جامع درآمدها، تحلیل آماری، فیش‌های واریزی، دفترکل و تسویه‌حساب مشاوران',
      badge: 'امور مالی کلان',
      trendContext: 'درآمد کل، گزارشات و تسویه‌حساب‌ها',
      accent: 'emerald',
      icon: <Wallet className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />,
    },
    {
      id: 'Alumni',
      navTab: 'alumni',
      sectionId: 'alumni',
      staffOnly: true,
      title: 'دانش‌آموختگان',
      subtext: 'بانک جامع سوابق هویتی، قضایی، پژوهشی، رساله‌ها و ثبت پرونده‌های تفصیلی',
      badge: 'بانک دانش‌آموختگان',
      trendContext: `${toPersianNumbers(users.filter(u => u.role === 'alumni' || u.judicialGrade).length)} پرونده ثبت‌شده دانش‌آموخته`,
      accent: 'emerald',
      icon: <GraduationCap className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />,
    },
    {
      id: 'Users',
      navTab: 'users',
      sectionId: 'users',
      staffOnly: true,
      title: 'مدیریت کاربران {حساب‌های کاربری}',
      subtext: 'مدیریت حساب‌های کاربری همه سطوح، رمزهای عبور، وضعیت نشست‌ها و سطوح دسترسی',
      badge: 'حساب‌های کاربری و دسترسی‌ها',
      trendContext: `${toPersianNumbers(users.length)} حساب کاربری فعال`,
      accent: 'indigo',
      icon: <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />,
    },
    {
      id: 'Admin',
      navTab: 'admin',
      sectionId: 'admin',
      staffOnly: true,
      title: 'مدیریت سایت و پایش امنیت',
      subtext: 'اتاق فرماندهی سامانه (۱۲ ابزار OPS)، پایش سلامت سرور و زنجیره وقایع SHA-256',
      badge: 'اتاق فرماندهی و امنیت',
      trendContext: 'مرکز پایش ۱۲‌گانه و امنیت سیستم',
      accent: 'amber',
      icon: <ShieldCheck className="w-6 h-6 text-amber-600 dark:text-amber-400" />,
    },
  ];

  const customizedCards = applyNavigationCustomization(
    candidateCards,
    resolvedNav.servicesMenuItems,
    { hideInvisible: true }
  ).filter(card => {
    if (card.staffOnly && !showAdminCard) return false;
    return canViewSection(currentUser, card.sectionId, rolePolicies);
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      <DashboardWidgetsSuite
        onNavigateTab={(tab) => onNavigate((tab.toLowerCase() === 'people' ? 'cartable' : tab.toLowerCase()) as NavTabId)}
        isAlumniPreview={isAlumniPreview}
        onToggleAlumniPreview={() => setIsAlumniPreview(prev => !prev)}
      />

      {/* Reform 56: Alumni Identity Completion Percentage Widget & My Identity Card Trigger */}
      <AlumniProfileCompletionWidget onOpenIdentityCard={() => setIsIdentityCardOpen(true)} />
      <AlumniIdentityCardModal isOpen={isIdentityCardOpen} onClose={() => setIsIdentityCardOpen(false)} />

      {/* Aurora Spectrum Header */}
      <div
        ref={headerRef}
        onMouseMove={handleHeaderMouseMove}
        className="relative overflow-hidden rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-slate-200/90 dark:border-white/15 shadow-xl transition-all select-none group"
        style={{
          ['--mouse-x' as string]: `${headerMousePos.x}px`,
          ['--mouse-y' as string]: `${headerMousePos.y}px`,
        }}
      >
        <div className="absolute inset-0 bg-white/75 dark:bg-slate-900/80 backdrop-blur-2xl z-0 transition-colors" />

        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-80 dark:opacity-90">
          <div className="absolute -top-1/4 -right-1/4 w-[500px] h-[350px] rounded-full bg-gradient-to-tr from-indigo-500/35 via-violet-500/30 to-purple-500/25 blur-3xl animate-aurora-slow" />
          <div className="absolute -bottom-1/3 left-1/4 w-[450px] h-[320px] rounded-full bg-gradient-to-br from-cyan-400/30 via-emerald-400/25 to-teal-500/25 blur-3xl animate-aurora-fast" />
          <div className="absolute top-1/4 -left-1/4 w-[400px] h-[300px] rounded-full bg-gradient-to-r from-amber-400/25 via-rose-500/25 to-pink-500/20 blur-3xl animate-aurora-pulse" />
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            style={{
              background: `radial-gradient(160px circle at var(--mouse-x, 0px) var(--mouse-y, 0px), rgba(255, 255, 255, 0.35), transparent 75%)`,
            }}
          />
        </div>

        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/90 dark:via-white/30 to-transparent pointer-events-none z-10" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-5">
          <div className="space-y-2">
            <div className="flex items-start sm:items-center gap-3">
              <div className="relative p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-gradient-to-br from-indigo-500/20 via-purple-500/15 to-amber-500/20 border border-white/40 dark:border-white/20 text-indigo-600 dark:text-amber-400 shadow-md backdrop-blur-md shrink-0">
                <LayoutDashboard className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
                </span>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    داشبورد خدمات جامع {currentUser?.fullName || 'دانش‌آموختگان فقه و قضا'}
                  </h1>
                  <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/20 shrink-0">
                    <Sparkles className="w-3 h-3" />
                    <span>نسخه پیشرفته ۳.۰</span>
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed max-w-2xl font-normal">
                  پرتال یکپارچه خدمات الکترونیک اداری، آموزش‌های تخصصی، مشاوره روان‌شناختی، راهبری پژوهش و تسهیلات رفاهی
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 overflow-x-auto scrollbar-none sm:overflow-visible sm:flex-wrap text-xs pb-0.5 sm:pb-0">
            {showAdminCard && (
              <button
                type="button"
                onClick={() => setIsNavCustomizerOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 sm:py-1.5 min-h-[38px] sm:min-h-0 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-sm transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <Menu className="w-3.5 h-3.5" />
                <span>ترتیب و نام ناوبری و منوها</span>
              </button>
            )}

            <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/50 dark:bg-slate-800/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 text-emerald-600 dark:text-emerald-400 font-semibold shadow-xs whitespace-nowrap shrink-0">
              <CheckCircle2 className="w-4 h-4" />
              <span>سامانه برخط</span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/50 dark:bg-slate-800/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-300 font-medium shadow-xs whitespace-nowrap shrink-0">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span className="tabular-nums">۸ آبان ۱۴۰۳</span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 backdrop-blur-md border border-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-bold whitespace-nowrap shrink-0">
              <Layers className="w-3.5 h-3.5" />
              <span>{toPersianNumbers(customizedCards.length)} درگاه تخصصی</span>
            </div>
          </div>
        </div>
      </div>

      {/* Customized Responsive Service Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
        {customizedCards.map(card => (
          <ModernDashboardCard
            key={card.id}
            title={card.title}
            accent={card.accent}
            icon={card.icon}
            subValue={card.subtext}
            trendContext={card.trendContext}
            badgeText={card.badge}
            notificationCount={card.notificationCount}
            hasNotification={card.hasNotification}
            onClick={() => onNavigate(card.navTab)}
          />
        ))}
      </div>

      {showAdminCard && (
        <Suspense fallback={null}>
          <ThemeCustomizerModal
            isOpen={isNavCustomizerOpen}
            initialTab="navigation"
            onClose={() => setIsNavCustomizerOpen(false)}
          />
        </Suspense>
      )}
    </div>
  );
};
