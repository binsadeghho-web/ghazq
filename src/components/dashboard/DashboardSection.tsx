import React, { useState, useRef, useCallback, lazy, Suspense } from 'react';
import { motion } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { NavTabId } from '../../types';
import { ModernDashboardCard } from '../ModernDashboardCard';
import { toPersianNumbers } from '../../utils/persianNumbers';
import { calculateProfileCompletion } from '../../utils/profileCompletion';
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
      title: 'خدمات روانشناختی و مشاوره',
      subtext: 'سلامت روان، تحکیم خانواده، مشاوره فردی، زوج‌درمانی و سبک زندگی',
      badge: 'خدمات روانشناختی و مشاوره',
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

  const completionPct = calculateProfileCompletion(currentUser).percentage;
  const ringCirc = 2 * Math.PI * 11;
  const ringOff = ringCirc * (1 - Math.max(0, Math.min(100, completionPct)) / 100);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* BESPOKE LUXURY MOBILE HERO FOR THEME 1 (< sm), full Aurora header on sm+ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32 }}
        className="sm:hidden relative overflow-hidden rounded-[26px] bg-gradient-to-br from-[#061A14] via-[#0B2A20] to-[#0E3327] text-white p-4.5 border border-[#F3D078]/25 shadow-xl"
      >
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 luxury-lattice-bg opacity-55" />
        <span aria-hidden="true" className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-l from-transparent via-[#F3D078]/70 to-transparent" />
        <div className="relative z-10 space-y-3.5">
          <div className="flex items-center justify-between gap-2.5">
            <div className="min-w-0">
              <div className="text-[10px] font-black text-[#F3D078] truncate">
                پرتال جامع فقه و قضا · {toPersianNumbers(customizedCards.length)} درگاه فعال
              </div>
              <h1 className="text-base font-black text-white mt-0.5 truncate">
                سلام، {currentUser?.fullName || 'همکار گرامی'}
              </h1>
              <p className="text-[11px] text-emerald-100/80 truncate mt-0.5">
                {currentUser?.roleTitle || 'عضو مجمع دانش‌آموختگان'}
              </p>
            </div>

            {currentUser && (
              <motion.button
                type="button"
                whileTap={{ scale: 0.94 }}
                onClick={() => setIsIdentityCardOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 min-h-[44px] rounded-2xl bg-white/10 border border-[#F3D078]/30 text-white shrink-0 cursor-pointer"
              >
                <svg className="w-6 h-6 -rotate-90 shrink-0" viewBox="0 0 28 28" aria-hidden="true">
                  <circle cx="14" cy="14" r="11" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="2.4" />
                  <circle
                    cx="14"
                    cy="14"
                    r="11"
                    fill="none"
                    stroke="#F3D078"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeDasharray={ringCirc}
                    strokeDashoffset={ringOff}
                  />
                </svg>
                <span className="text-[11px] font-black tabular-nums text-[#F3D078]">
                  {toPersianNumbers(completionPct)}٪
                </span>
              </motion.button>
            )}
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-white/12">
            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={() => onNavigate('cartable')}
              className="flex-1 min-h-[40px] px-3 py-2 rounded-xl bg-gradient-to-l from-[#D4AF37] to-[#F3D078] text-[#071E17] text-xs font-black cursor-pointer"
            >
              کارتابل و درخواست‌ها
            </motion.button>
            {showAdminCard && (
              <motion.button
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={() => setIsNavCustomizerOpen(true)}
                className="min-h-[40px] px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-white text-xs font-bold shrink-0 cursor-pointer"
              >
                ترتیب منو
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>

      <DashboardWidgetsSuite
        onNavigateTab={(tab) => onNavigate((tab.toLowerCase() === 'people' ? 'cartable' : tab.toLowerCase()) as NavTabId)}
        isAlumniPreview={isAlumniPreview}
        onToggleAlumniPreview={() => setIsAlumniPreview(prev => !prev)}
      />

      {/* Reform 56: Alumni Identity Completion Percentage Widget & My Identity Card Trigger */}
      <div className="hidden sm:block">
        <AlumniProfileCompletionWidget onOpenIdentityCard={() => setIsIdentityCardOpen(true)} />
      </div>
      <AlumniIdentityCardModal isOpen={isIdentityCardOpen} onClose={() => setIsIdentityCardOpen(false)} />

      {/* Aurora Spectrum Header (sm+ / Desktop) */}
      <div
        ref={headerRef}
        onMouseMove={handleHeaderMouseMove}
        className="hidden sm:block relative overflow-hidden rounded-3xl p-6 sm:p-7 border border-slate-200/90 dark:border-white/15 shadow-xl transition-all select-none group"
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
              <div className="relative p-2.5 rounded-2xl bg-gradient-to-br from-indigo-500/20 via-purple-500/15 to-amber-500/20 border border-white/40 dark:border-white/20 text-indigo-600 dark:text-amber-400 shadow-md backdrop-blur-md shrink-0">
                <LayoutDashboard className="w-6 h-6" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    داشبورد خدمات جامع {currentUser?.fullName || 'دانش‌آموختگان فقه و قضا'}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/20 shrink-0">
                    <Sparkles className="w-3 h-3" />
                    <span>نسخه پیشرفته ۳.۰</span>
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed max-w-2xl font-normal">
                  پرتال یکپارچه خدمات الکترونیک اداری، آموزش‌های تخصصی، مشاوره روان‌شناختی، راهبری پژوهش و تسهیلات رفاهی
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap text-xs">
            {showAdminCard && (
              <button
                type="button"
                onClick={() => setIsNavCustomizerOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-sm transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <Menu className="w-3.5 h-3.5" />
                <span>ترتیب و نام ناوبری و منوها</span>
              </button>
            )}

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/50 dark:bg-slate-800/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 text-emerald-600 dark:text-emerald-400 font-semibold shadow-xs whitespace-nowrap shrink-0">
              <CheckCircle2 className="w-4 h-4" />
              <span>سامانه برخط</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/50 dark:bg-slate-800/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-300 font-medium shadow-xs whitespace-nowrap shrink-0">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span className="tabular-nums">۸ آبان ۱۴۰۳</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 backdrop-blur-md border border-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-bold whitespace-nowrap shrink-0">
              <Layers className="w-3.5 h-3.5" />
              <span>{toPersianNumbers(customizedCards.length)} درگاه تخصصی</span>
            </div>
          </div>
        </div>
      </div>

      {/* Elevated 2-Col Mobile Service Grid for Theme 1 (< sm) */}
      <div className="grid grid-cols-2 gap-3 sm:hidden">
        {customizedCards.map((card, idx) => (
          <motion.button
            key={card.id}
            type="button"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: Math.min(idx * 0.025, 0.22) }}
            whileTap={{ scale: 0.96 }}
            onClick={() => onNavigate(card.navTab)}
            className="bg-white dark:bg-slate-900 rounded-[22px] border border-slate-200/85 dark:border-slate-800 p-3.5 text-right flex flex-col justify-between gap-3 shadow-[0_8px_22px_-16px_rgba(15,23,42,0.22)] cursor-pointer relative min-h-[108px]"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="w-10 h-10 rounded-2xl bg-slate-100/90 dark:bg-slate-800 flex items-center justify-center shrink-0">
                {card.icon}
              </div>
              {card.hasNotification && card.notificationCount && card.notificationCount > 0 ? (
                <span className="text-[11px] font-black text-rose-600 dark:text-rose-400 tabular-nums">
                  {toPersianNumbers(card.notificationCount)} جدید
                </span>
              ) : null}
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-900 dark:text-white line-clamp-1">
                {card.title}
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1 font-medium">
                {card.badge}
              </p>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Customized Responsive Service Cards Grid (sm+ / Desktop intact) */}
      <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
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
