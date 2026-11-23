import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/apiClient';
import { toPersianNumbers } from '../../utils/persianNumbers';
import { calculateProfileCompletion } from '../../utils/profileCompletion';
import { formatWelcomeBannerTitle } from '../../utils/welcomeBanner';
import { resolveShowcaseImageUrl, resolveHonorImageUrl } from '../../data/showcaseImages';
import { DEFAULT_HERO_STATS, DEFAULT_CREXTIO_CONFIG } from '../../data/mockData';
import {
  applyNavigationCustomization,
  getResolvedNavigationConfig,
} from '../../utils/navigationConfig';
import { canViewSection, useRbacPolicies } from '../../utils/rbacPolicy';
import { AppSectionId, HonorAppointmentItem } from '../../types';
import type { Theme2StudioTab } from './Theme2StudioDrawer';
import {
  Inbox,
  GraduationCap,
  BookOpen,
  HeartHandshake,
  Compass,
  Scale,
  Gift,
  Users2,
  Users,
  ShieldCheck,
  Wallet,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Bell,
  Award,
  CheckCircle2,
  IdCard,
  SlidersHorizontal,
  Palette,
  Eye,
  EyeOff,
  ArrowLeft,
  Sparkles,
  BookMarked,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface MobileDashboardExperienceProps {
  onNavigateTab?: (tab: string) => void;
  onOpenAllServices?: () => void;
  onBookGeneralCounseling?: () => void;
  onOpenIdentityCard: () => void;
  onOpenStudio?: (tab: Theme2StudioTab) => void;
  onOpenCustomizer?: () => void;
  onToggleAlumniPreview?: () => void;
  isAdmin: boolean;
  isRealAdmin: boolean;
  isAlumni: boolean;
  isAlumniPreview: boolean;
}

type SpotlightTabId =
  | 'honors'
  | 'courses'
  | 'counseling'
  | 'rulings'
  | 'research'
  | 'welfare'
  | 'products';

const FALLBACK_HONORS: HonorAppointmentItem[] = [
  {
    id: 'honor_fallback_1',
    category: 'انتصاب قضایی',
    title: 'انتصاب جناب آقای دکتر محمدمهدی حسینی به سمت دادستان عمومی و انقلاب مرکز استان',
    honoreeName: 'جناب آقای دکتر محمدمهدی حسینی',
    positionOrAchievement: 'دادستان عمومی و انقلاب مرکز استان · دوره نهم',
    description:
      'مجمع دانش‌آموختگان فقه و قضا توفیق روزافزون ایشان را در احقاق حق و گسترش عدالت مسئلت می‌نماید.',
    dateOrLocation: 'آبان ۱۴۰۴ · قوه قضائیه',
    imageUrl: 'builtin:judicial_appointment',
    textPosition: 'bottom_right',
    scrimStrength: 'medium',
    ctaLabel: 'مشاهده بانک نخبگان',
    ctaAction: 'navigate_alumni',
  },
  {
    id: 'honor_fallback_2',
    category: 'رتبه برتر علمی',
    title: 'کسب رتبه نخست کشوری در همایش سالانه نقد آراء قضایی',
    honoreeName: 'پژوهشکده و کارگروه حقوق جزای مجمع',
    positionOrAchievement: 'برگزیده نخست تحلیل دادنامه‌های دیوان عالی کشور',
    description:
      'با اهتمام پژوهشگران و قضات عضو مجمع، مجموعه نقدهای تحلیلی کارگروه حائز امتیاز برتر کشوری شد.',
    dateOrLocation: 'مهر ۱۴۰۴ · تهران و قم',
    imageUrl: 'builtin:academic_award',
    textPosition: 'bottom_right',
    scrimStrength: 'medium',
    ctaLabel: 'ورود به تالار آراء',
    ctaAction: 'navigate_rulings',
  },
];

export const MobileDashboardExperience: React.FC<MobileDashboardExperienceProps> = ({
  onNavigateTab,
  onOpenAllServices,
  onBookGeneralCounseling,
  onOpenIdentityCard,
  onOpenStudio,
  onOpenCustomizer,
  onToggleAlumniPreview,
  isAdmin,
  isRealAdmin,
  isAlumni,
  isAlumniPreview,
}) => {
  const {
    currentUser,
    courses,
    rulings,
    products,
    consultants,
    researchMentorships,
    cartableRequests,
    counselingRequests,
    welfareRequests,
    crextioConfig,
    generalShowcase,
  } = useApp();
  const { rolePolicies } = useRbacPolicies();

  const [banners, setBanners] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [widgetConfig, setWidgetConfig] = useState<{
    showStatusSummaryWidget: boolean;
    showEventsCalendarWidget: boolean;
  }>({
    showStatusSummaryWidget: true,
    showEventsCalendarWidget: true,
  });
  const [bannerIdx, setBannerIdx] = useState(0);
  const [calendarExpanded, setCalendarExpanded] = useState(false);
  const [honorIdx, setHonorIdx] = useState(0);
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [honorImgError, setHonorImgError] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let active = true;
    const loadWidgets = async () => {
      try {
        const data = await api.getDashboardWidgetsData();
        if (!active || !data) return;
        if (Array.isArray(data.banners)) setBanners(data.banners);
        if (Array.isArray(data.events)) setEvents(data.events);
        if (data.widgetConfig) setWidgetConfig(data.widgetConfig);
      } catch {}
    };
    loadWidgets();

    const handleLocalSync = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail) return;
      if (detail.banners) setBanners(detail.banners);
      if (detail.events) setEvents(detail.events);
      if (detail.widgetConfig) setWidgetConfig(detail.widgetConfig);
    };
    window.addEventListener('dashboard-widgets-sync', handleLocalSync);

    const unsub = api.subscribeToEvents(ev => {
      if (ev.type.startsWith('dashboard.')) {
        loadWidgets();
      }
    });

    return () => {
      active = false;
      window.removeEventListener('dashboard-widgets-sync', handleLocalSync);
      unsub();
    };
  }, []);

  const completionPct = calculateProfileCompletion(currentUser).percentage;
  const welcomeTitle = formatWelcomeBannerTitle(
    crextioConfig.heroTitle,
    crextioConfig.heroGreetingPrefix,
    currentUser
  );

  const heroPortraitSrc =
    currentUser?.profilePictureUrl ||
    crextioConfig.showcaseImageOverrides?.hero_portrait ||
    resolveShowcaseImageUrl('hero_portrait', crextioConfig.showcaseImageOverrides);

  const heroStats = (crextioConfig.heroStatsConfig || DEFAULT_HERO_STATS)
    .filter(s => s.isVisible !== false)
    .slice(0, 3);

  const rightSlotMode = crextioConfig.heroRightSlotMode || 'both';
  const allConfiguredQuickBtns =
    crextioConfig.heroQuickButtons && crextioConfig.heroQuickButtons.length > 0
      ? crextioConfig.heroQuickButtons
      : DEFAULT_CREXTIO_CONFIG.heroQuickButtons || [];
  const quickHeroBtns = allConfiguredQuickBtns
    .filter(b => {
      if (
        isAlumni &&
        (b.targetNav === 'Alumni' ||
          b.targetNav === 'Users' ||
          b.targetNav === 'Admin' ||
          b.targetNav === 'Setting' ||
          b.targetNav === 'Finance')
      ) {
        return false;
      }
      return b.visible !== false;
    })
    .slice(0, 3);

  // Quick App Launcher Items (RBAC + Customizer synced)
  const effectiveStaff = !isAlumni;
  const resolvedNav = getResolvedNavigationConfig(crextioConfig.navigationConfig);

  const launcherCandidates: Array<{
    id: string;
    sectionId: AppSectionId;
    label: string;
    icon: any;
    toneClass: string;
  }> = [
    {
      id: 'People',
      sectionId: 'cartable',
      label: 'کارتابل',
      icon: Inbox,
      toneClass: 'bg-sky-500/12 text-sky-700',
    },
    {
      id: 'Courses',
      sectionId: 'courses',
      label: 'دوره‌ها',
      icon: GraduationCap,
      toneClass: 'bg-emerald-500/12 text-emerald-700',
    },
    {
      id: 'CounselingGeneral',
      sectionId: 'counseling',
      label: 'مشاوره',
      icon: HeartHandshake,
      toneClass: 'bg-rose-500/12 text-rose-700',
    },
    {
      id: 'SpecializedCounseling',
      sectionId: 'specialized_counseling',
      label: 'مشاوره قضا',
      icon: Compass,
      toneClass: 'bg-amber-500/15 text-amber-700',
    },
    {
      id: 'Rulings',
      sectionId: 'rulings',
      label: 'تالار آراء',
      icon: Scale,
      toneClass: 'bg-amber-600/12 text-amber-800',
    },
    {
      id: 'Research',
      sectionId: 'research',
      label: 'پژوهش',
      icon: BookOpen,
      toneClass: 'bg-teal-500/12 text-teal-700',
    },
    {
      id: 'Welfare',
      sectionId: 'welfare',
      label: 'رفاهیات',
      icon: Gift,
      toneClass: 'bg-pink-500/12 text-pink-700',
    },
    {
      id: 'Products',
      sectionId: 'products',
      label: 'انتشارات',
      icon: BookMarked,
      toneClass: 'bg-indigo-500/12 text-indigo-700',
    },
    {
      id: 'Synergy',
      sectionId: 'synergy',
      label: 'هم‌افزایی',
      icon: Users2,
      toneClass: 'bg-violet-500/12 text-violet-700',
    },
    {
      id: 'Finance',
      sectionId: 'finance',
      label: 'مالی',
      icon: Wallet,
      toneClass: 'bg-emerald-600/12 text-emerald-800',
    },
    {
      id: 'Alumni',
      sectionId: 'alumni',
      label: 'دانش‌آموختگان',
      icon: Award,
      toneClass: 'bg-teal-600/12 text-teal-800',
    },
    {
      id: 'Users',
      sectionId: 'users',
      label: 'کاربران',
      icon: Users,
      toneClass: 'bg-indigo-600/12 text-indigo-800',
    },
    {
      id: 'Admin',
      sectionId: 'admin',
      label: 'مدیریت',
      icon: ShieldCheck,
      toneClass: 'bg-stone-900/10 text-stone-800',
    },
  ];

  const permittedLauncher = applyNavigationCustomization(
    launcherCandidates,
    resolvedNav.servicesMenuItems,
    { hideInvisible: true }
  )
    .filter(item => {
      if (
        !effectiveStaff &&
        (item.sectionId === 'alumni' ||
          item.sectionId === 'users' ||
          item.sectionId === 'admin' ||
          item.sectionId === 'finance')
      ) {
        return false;
      }
      return canViewSection(currentUser, item.sectionId, rolePolicies);
    })
    .slice(0, 7);

  // Personal Status Metrics
  const myCartableActive = cartableRequests.filter(
    r =>
      (r.applicantId === currentUser?.id || effectiveStaff) &&
      (r.status === 'pending' || r.status === 'in_progress' || r.status === 'need_info')
  ).length;
  const myCounselingActive = counselingRequests.filter(
    r =>
      (r.applicantId === currentUser?.id || effectiveStaff) &&
      (r.status === 'pending' || r.status === 'scheduled')
  ).length;
  const myWelfareActive = welfareRequests.filter(
    r =>
      (r.applicantId === currentUser?.id || effectiveStaff) &&
      (r.status === 'pending' || r.status === 'approved')
  ).length;
  const myEnrolledCourses = courses.filter(c => c.isEnrolled).length;

  const activeBanners = banners.filter(b => b.isActive);
  const safeBannerIdx = activeBanners.length > 0 ? bannerIdx % activeBanners.length : 0;
  const topBanner = activeBanners[safeBannerIdx];

  // Spotlight tabs respecting admin visibility configs
  const hiddenMap = crextioConfig.hiddenDashboardSections || {};
  const spotlightTabs = useMemo(() => {
    const tabs: Array<{ id: SpotlightTabId; label: string; icon: any }> = [];
    if (crextioConfig.showHonorsShowcase !== false && !hiddenMap.honors_showcase) {
      tabs.push({ id: 'honors', label: 'افتخارات', icon: Award });
    }
    if (crextioConfig.showCourseShowcase !== false && !hiddenMap.course_showcase) {
      tabs.push({ id: 'courses', label: 'دوره‌ها', icon: GraduationCap });
    }
    if (
      (crextioConfig.showCounselingGeneralShowcase !== false && !hiddenMap.counseling_general_showcase) ||
      (crextioConfig.showCounselingPromo !== false && !hiddenMap.counseling_promo)
    ) {
      tabs.push({ id: 'counseling', label: 'مشاوره', icon: HeartHandshake });
    }
    if (crextioConfig.showRulingsShowcase !== false && !hiddenMap.rulings_showcase) {
      tabs.push({ id: 'rulings', label: 'تالار آراء', icon: Scale });
    }
    if (crextioConfig.showResearchPromoShowcase !== false && !hiddenMap.research_promo) {
      tabs.push({ id: 'research', label: 'پژوهش', icon: Compass });
    }
    if (crextioConfig.showWelfareShowcase !== false && !hiddenMap.welfare_showcase) {
      tabs.push({ id: 'welfare', label: 'رفاهیات', icon: Gift });
    }
    if (crextioConfig.showProductsMiniPromo !== false && !hiddenMap.books_showcase) {
      tabs.push({ id: 'products', label: 'انتشارات', icon: BookMarked });
    }
    return tabs;
  }, [crextioConfig, hiddenMap]);

  const [activeSpotlight, setActiveSpotlight] = useState<SpotlightTabId>('honors');
  const resolvedSpotlight: SpotlightTabId = spotlightTabs.some(t => t.id === activeSpotlight)
    ? activeSpotlight
    : spotlightTabs[0]?.id || 'courses';

  const honorsList =
    crextioConfig.honorsItems && crextioConfig.honorsItems.length > 0
      ? crextioConfig.honorsItems
      : FALLBACK_HONORS;
  const activeHonor = honorsList[honorIdx % honorsList.length] || honorsList[0];

  const activeCourses = courses.filter(c => !c.isDeleted).slice(0, 4);
  const activeWorkshops = (generalShowcase.workshops || []).filter(w => w.isActive !== false);
  const featuredRulings = rulings.filter(r => r.isVisibleToAlumni !== false).slice(0, 3);
  const featuredProducts = products.filter(p => !p.isDeleted).slice(0, 3);

  const handleHonorCta = (item: HonorAppointmentItem) => {
    if (!item.ctaAction || item.ctaAction === 'none') return;
    if (item.ctaAction === 'navigate_alumni') {
      onNavigateTab?.(isAlumni ? 'Courses' : 'Alumni');
    } else if (item.ctaAction === 'navigate_rulings') {
      onNavigateTab?.('Rulings');
    } else if (item.ctaAction === 'navigate_research') {
      onNavigateTab?.('Research');
    } else if (item.ctaAction === 'external_link' && item.ctaUrl) {
      window.open(item.ctaUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="space-y-6 pb-2" dir="rtl">
      {/* 1. FOCAL ANCHOR: EXECUTIVE HERO & IDENTITY CARD */}
      {crextioConfig.showHeroBanner !== false && (
        <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#0B2A1F] via-[#10382A] to-[#081E16] text-white p-5 shadow-[0_18px_40px_-20px_rgba(11,42,31,0.55)]">
          {/* Subtle ambient radial glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-16 -left-16 w-48 h-48 rounded-full bg-amber-400/15 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-20 -right-12 w-52 h-52 rounded-full bg-emerald-400/15 blur-3xl"
          />

          <div className="relative z-10 space-y-4">
            {/* Top row: Avatar + Identity Card Progress Trigger */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {heroPortraitSrc && !heroImgFailed ? (
                  <img
                    src={heroPortraitSrc}
                    alt={currentUser?.fullName || 'تصویر کاربر'}
                    referrerPolicy="no-referrer"
                    onError={() => setHeroImgFailed(true)}
                    className="w-12 h-12 rounded-2xl object-cover object-top border border-white/20 shrink-0 shadow-sm"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center font-black text-sm text-amber-300 shrink-0">
                    {currentUser?.avatarText || 'ف'}
                  </div>
                )}

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-300/95">
                    <Scale className="w-3 h-3 shrink-0" />
                    <span className="truncate">{crextioConfig.heroSchemeLabel || 'طرح میزان'}</span>
                    <span aria-hidden="true" className="opacity-50">·</span>
                    <span className="text-emerald-200/90 truncate">
                      دوره {toPersianNumbers(currentUser?.graduationYear || '۱۳۹۵')}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-100/80 font-medium truncate mt-0.5">
                    {currentUser?.roleTitle || (isAlumni ? 'دانش‌آموخته مجمع' : 'مدیر سامانه')}
                  </p>
                </div>
              </div>

              {currentUser && (
                <button
                  type="button"
                  onClick={onOpenIdentityCard}
                  className="flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-2xl bg-white/10 hover:bg-white/18 active:scale-95 border border-white/15 text-[11px] font-extrabold text-white transition-all cursor-pointer shrink-0"
                >
                  <IdCard className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <span className="tabular-nums">{toPersianNumbers(completionPct)}٪</span>
                </button>
              )}
            </div>

            {/* Greeting Headline */}
            <div>
              <h1 className="text-[19px] leading-snug font-black text-white tracking-tight">
                {welcomeTitle}
              </h1>
            </div>

            {/* Bottom Hero Row: Clean Unboxed Stats or Quick Actions */}
            {rightSlotMode === 'quick_actions' && quickHeroBtns.length > 0 ? (
              <div className="pt-3.5 border-t border-white/12 flex items-center gap-2 overflow-x-auto scrollbar-none">
                {quickHeroBtns.map(btn => (
                  <button
                    key={btn.id}
                    type="button"
                    onClick={() => onNavigateTab?.(btn.targetNav)}
                    className="px-3.5 py-2 min-h-[40px] rounded-xl bg-white/12 hover:bg-white/20 text-white text-xs font-bold whitespace-nowrap shrink-0 active:scale-95 transition-all cursor-pointer"
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            ) : (
              crextioConfig.showHeroStats !== false &&
              heroStats.length > 0 && (
                <div className="pt-3.5 border-t border-white/12 grid grid-cols-3 gap-2 text-center">
                  {heroStats.map(stat => (
                    <div key={stat.id} className="min-w-0">
                      <p className="text-base font-black text-white tabular-nums tracking-tight">
                        {toPersianNumbers(stat.val.toLocaleString('fa-IR'))}
                      </p>
                      <p className="text-[10px] text-emerald-100/75 font-medium truncate mt-0.5">
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </section>
      )}

      {/* ADMIN COMPACT BAR (Only for authorized staff on mobile — single serene strip) */}
      {isRealAdmin && (
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none -mt-2">
          {!isAlumniPreview && onOpenStudio && (
            <button
              type="button"
              onClick={() => onOpenStudio('hero_quick')}
              className="flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-2xl bg-stone-900 text-white text-xs font-bold shrink-0 active:scale-95 transition-transform cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
              <span>ویرایشگر صفحه</span>
            </button>
          )}
          {!isAlumniPreview && onOpenCustomizer && (
            <button
              type="button"
              onClick={onOpenCustomizer}
              className="flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-2xl bg-white border border-stone-200 text-stone-800 text-xs font-bold shrink-0 active:scale-95 transition-transform cursor-pointer"
            >
              <Palette className="w-3.5 h-3.5 text-emerald-700" />
              <span>چیدمان و منو</span>
            </button>
          )}
          {onToggleAlumniPreview && (
            <button
              type="button"
              onClick={onToggleAlumniPreview}
              className={`flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-2xl text-xs font-bold shrink-0 active:scale-95 transition-transform cursor-pointer border ${
                isAlumniPreview
                  ? 'bg-amber-500 text-stone-950 border-amber-600'
                  : 'bg-white border-stone-200 text-stone-700'
              }`}
            >
              {isAlumniPreview ? (
                <EyeOff className="w-3.5 h-3.5" />
              ) : (
                <Eye className="w-3.5 h-3.5 text-emerald-700" />
              )}
              <span>{isAlumniPreview ? 'خروج از پیش‌نمایش' : 'نمای دانش‌آموخته'}</span>
            </button>
          )}
        </div>
      )}

      {/* 2. QUICK SERVICES APP LAUNCHER GRID */}
      <section aria-label="دسترسی سریع خدمات" className="space-y-3.5">
        <div className="flex items-center justify-between px-0.5">
          <h2 className="text-sm font-black text-stone-900">خدمات و بخش‌ها</h2>
          {onOpenAllServices && (
            <button
              type="button"
              onClick={onOpenAllServices}
              className="flex items-center gap-1 text-xs font-bold text-emerald-800 hover:text-emerald-950 py-1 px-1 cursor-pointer"
            >
              <span>مشاهده همه</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="bg-white rounded-[24px] border border-stone-200/80 p-4 shadow-[0_6px_24px_-14px_rgba(28,25,23,0.12)]">
          <div className="grid grid-cols-4 gap-y-4 gap-x-2">
            {permittedLauncher.map(item => {
              const Icon = item.icon;
              return (
                <motion.button
                  key={item.id}
                  type="button"
                  whileTap={{ scale: 0.92 }}
                  onClick={() => onNavigateTab?.(item.id)}
                  className="flex flex-col items-center justify-start gap-1.5 min-h-[68px] cursor-pointer group focus:outline-none"
                >
                  <div
                    className={`w-12 h-12 rounded-[18px] flex items-center justify-center transition-transform group-active:scale-95 ${item.toneClass}`}
                  >
                    <Icon className="w-5 h-5 stroke-[2.1]" />
                  </div>
                  <span className="text-[11px] font-bold text-stone-800 text-center leading-tight line-clamp-1 w-full">
                    {item.label}
                  </span>
                </motion.button>
              );
            })}

            {onOpenAllServices && (
              <motion.button
                type="button"
                whileTap={{ scale: 0.92 }}
                onClick={onOpenAllServices}
                className="flex flex-col items-center justify-start gap-1.5 min-h-[68px] cursor-pointer group focus:outline-none"
              >
                <div className="w-12 h-12 rounded-[18px] bg-stone-100 text-stone-700 flex items-center justify-center">
                  <LayoutGrid className="w-5 h-5 stroke-[2.1]" />
                </div>
                <span className="text-[11px] font-bold text-stone-600 text-center leading-tight">
                  سایر خدمات
                </span>
              </motion.button>
            )}
          </div>
        </div>
      </section>

      {/* 3. PERSONAL RADAR: ACTIVE NOTICE + MY STATUS + NEXT EVENT */}
      {(topBanner ||
        widgetConfig.showStatusSummaryWidget !== false ||
        (widgetConfig.showEventsCalendarWidget !== false && events.length > 0)) && (
        <section aria-label="وضعیت جاری و رویدادها" className="space-y-3">
          {/* Active Announcement Strip (single focused notice at a time) */}
          {topBanner && (
            <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-start gap-2.5 min-w-0">
                <Bell className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs font-extrabold text-stone-900 truncate">{topBanner.title}</p>
                  <p className="text-[11px] text-stone-600 line-clamp-1 mt-0.5">{topBanner.message}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {activeBanners.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setBannerIdx(i => (i + 1) % activeBanners.length)}
                    className="w-8 h-8 rounded-xl bg-white/80 border border-amber-200 flex items-center justify-center text-stone-700 cursor-pointer"
                    aria-label="اطلاعیه بعدی"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                )}
                {topBanner.actionTab && (
                  <button
                    type="button"
                    onClick={() => onNavigateTab?.(topBanner.actionTab)}
                    className="px-3 py-1.5 min-h-[34px] rounded-xl bg-amber-500 text-stone-950 text-[11px] font-black cursor-pointer whitespace-nowrap"
                  >
                    {topBanner.actionLabel || 'مشاهده'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Clean 2-Tile Status Row */}
          {widgetConfig.showStatusSummaryWidget !== false && (
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => onNavigateTab?.('People')}
                className="bg-white rounded-2xl border border-stone-200/80 p-3.5 text-right flex items-center justify-between gap-2 active:scale-[0.98] transition-transform cursor-pointer"
              >
                <div className="min-w-0">
                  <p className="text-lg font-black text-stone-900 tabular-nums leading-none">
                    {toPersianNumbers(myCartableActive + myCounselingActive + myWelfareActive)}
                  </p>
                  <p className="text-[11px] font-bold text-stone-600 mt-1.5 truncate">
                    درخواست و نوبت فعال
                  </p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <Inbox className="w-4 h-4" />
                </div>
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab?.('Courses')}
                className="bg-white rounded-2xl border border-stone-200/80 p-3.5 text-right flex items-center justify-between gap-2 active:scale-[0.98] transition-transform cursor-pointer"
              >
                <div className="min-w-0">
                  <p className="text-lg font-black text-stone-900 tabular-nums leading-none">
                    {toPersianNumbers(myEnrolledCourses)}
                  </p>
                  <p className="text-[11px] font-bold text-stone-600 mt-1.5 truncate">
                    دوره ثبت‌نام‌شده
                  </p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-4 h-4" />
                </div>
              </button>
            </div>
          )}

          {/* Next Upcoming Event (Compact, Expandable Inline) */}
          {widgetConfig.showEventsCalendarWidget !== false && events.length > 0 && (
            <div className="bg-white rounded-2xl border border-stone-200/80 overflow-hidden">
              <button
                type="button"
                onClick={() => events.length > 1 && setCalendarExpanded(v => !v)}
                className="w-full p-3.5 flex items-center justify-between gap-3 text-right cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-stone-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold text-stone-900 truncate">{events[0].title}</p>
                    <p className="text-[11px] text-stone-500 mt-0.5 truncate">
                      <span>{toPersianNumbers(events[0].eventDate)}</span>
                      {events[0].eventTime && (
                        <>
                          <span aria-hidden="true"> · </span>
                          <span>{toPersianNumbers(events[0].eventTime)}</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>
                {events.length > 1 && (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-800 shrink-0">
                    <span>{toPersianNumbers(events.length)} رویداد</span>
                    {calendarExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </span>
                )}
              </button>

              {calendarExpanded && events.length > 1 && (
                <div className="px-3.5 pb-3.5 pt-1 border-t border-stone-100 divide-y divide-stone-100">
                  {events.slice(1, 5).map(ev => (
                    <div key={ev.id} className="py-2 flex items-center justify-between gap-2 text-xs">
                      <span className="font-bold text-stone-800 truncate">{ev.title}</span>
                      <span className="text-[11px] text-emerald-800 font-bold shrink-0 tabular-nums">
                        {toPersianNumbers(ev.eventDate)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* 4. CURATED SINGLE-STAGE SPOTLIGHT */}
      {spotlightTabs.length > 0 && (
        <section aria-label="تازه‌ها و ویترین‌های منتخب" className="space-y-3">
          <div className="flex items-center justify-between px-0.5">
            <h2 className="text-sm font-black text-stone-900">تازه‌ها و ویترین‌ها</h2>
            <span className="text-[11px] font-medium text-stone-500 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span>برگزیده مجمع</span>
            </span>
          </div>

          {/* Segmented Horizontal Pills Scroller */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
            {spotlightTabs.map(tab => {
              const Icon = tab.icon;
              const isSelected = resolvedSpotlight === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveSpotlight(tab.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 min-h-[38px] rounded-2xl text-xs font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-800 text-white shadow-sm'
                      : 'bg-white text-stone-600 border border-stone-200/80 hover:text-stone-900'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-300' : 'text-stone-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Single Spotlight Stage */}
          <AnimatePresence mode="wait">
            <motion.div
              key={resolvedSpotlight}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="bg-white rounded-[24px] border border-stone-200/80 overflow-hidden shadow-[0_10px_28px_-16px_rgba(28,25,23,0.16)]"
            >
              {/* HONORS */}
              {resolvedSpotlight === 'honors' && activeHonor && (
                <div>
                  <div className="relative h-48 bg-stone-900 overflow-hidden">
                    {!honorImgError[activeHonor.id] && (
                      <img
                        src={resolveHonorImageUrl(activeHonor.imageUrl)}
                        alt={activeHonor.title}
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setHonorImgError(prev => ({ ...prev, [activeHonor.id]: true }))
                        }
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/55 to-transparent" />

                    <div className="absolute top-3 right-3 left-3 flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-xl bg-amber-400 text-stone-950 text-[10px] font-black">
                        {activeHonor.category}
                      </span>
                      {honorsList.length > 1 && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              setHonorIdx(i => (i - 1 + honorsList.length) % honorsList.length)
                            }
                            className="w-8 h-8 rounded-xl bg-black/45 text-white flex items-center justify-center backdrop-blur-xs cursor-pointer"
                            aria-label="قبلی"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setHonorIdx(i => (i + 1) % honorsList.length)}
                            className="w-8 h-8 rounded-xl bg-black/45 text-white flex items-center justify-center backdrop-blur-xs cursor-pointer"
                            aria-label="بعدی"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="absolute bottom-3 right-3.5 left-3.5 text-white">
                      <p className="text-[11px] font-bold text-amber-300 truncate">
                        {activeHonor.honoreeName}
                      </p>
                      <h3 className="text-sm font-black leading-snug line-clamp-2 mt-0.5">
                        {activeHonor.title}
                      </h3>
                    </div>
                  </div>

                  <div className="p-4 flex items-center justify-between gap-3">
                    <p className="text-[11px] text-stone-600 line-clamp-2 leading-relaxed">
                      {activeHonor.positionOrAchievement || activeHonor.description}
                    </p>
                    {activeHonor.ctaAction && activeHonor.ctaAction !== 'none' && (
                      <button
                        type="button"
                        onClick={() => handleHonorCta(activeHonor)}
                        className="px-3.5 py-2 min-h-[38px] rounded-xl bg-emerald-800 text-white text-[11px] font-bold shrink-0 cursor-pointer"
                      >
                        {activeHonor.ctaLabel || 'مشاهده'}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* COURSES */}
              {resolvedSpotlight === 'courses' && (
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-stone-900">
                      {crextioConfig.courseShowcaseTitle || 'دوره‌ها و کارگاه‌های علمی'}
                    </span>
                    <span className="text-[11px] font-bold text-emerald-700 tabular-nums">
                      {toPersianNumbers(courses.length)} دوره
                    </span>
                  </div>

                  <div className="divide-y divide-stone-100">
                    {activeCourses.map(course => (
                      <button
                        key={course.id}
                        type="button"
                        onClick={() => onNavigateTab?.('Courses')}
                        className="w-full py-3 first:pt-1 last:pb-1 flex items-center justify-between gap-3 text-right cursor-pointer group"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-extrabold text-stone-900 group-hover:text-emerald-800 truncate">
                            {course.title}
                          </p>
                          <p className="text-[11px] text-stone-500 mt-0.5 truncate">
                            {course.instructor}
                            <span aria-hidden="true"> · </span>
                            <span>{toPersianNumbers(course.hours)} ساعت</span>
                            {course.isEnrolled && (
                              <>
                                <span aria-hidden="true"> · </span>
                                <span className="text-emerald-700 font-bold">ثبت‌نام‌شده</span>
                              </>
                            )}
                          </p>
                        </div>
                        <ChevronLeft className="w-4 h-4 text-stone-400 shrink-0" />
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => onNavigateTab?.('Courses')}
                    className="w-full py-2.5 min-h-[42px] rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>ورود به گالری دوره‌ها</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* COUNSELING */}
              {resolvedSpotlight === 'counseling' && (
                <div className="p-4 space-y-3.5">
                  <div className="space-y-1">
                    <p className="text-xs font-black text-stone-900">
                      {crextioConfig.counselingGeneralShowcaseTitle || 'خدمات روانشناختی و مشاوره'}
                    </p>
                    <p className="text-[11px] text-stone-600 leading-relaxed">
                      رزرو محرمانه وقت مشاوره خانواده، ازدواج، تحصیلی و هدایت تخصصی قضایی با اساتید و روان‌شناسان مرکز
                    </p>
                  </div>

                  {activeWorkshops.length > 0 && (
                    <div className="p-3 rounded-2xl bg-[#F7F6F1] flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-emerald-800">کارگاه پیش‌رو / آرشیو</p>
                        <p className="text-xs font-extrabold text-stone-900 truncate mt-0.5">
                          {activeWorkshops[0].title}
                        </p>
                      </div>
                      <span className="text-[11px] font-bold text-stone-500 shrink-0 tabular-nums">
                        {toPersianNumbers(activeWorkshops.length)} کارگاه
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (onBookGeneralCounseling) onBookGeneralCounseling();
                        else onNavigateTab?.('CounselingGeneral');
                      }}
                      className="py-2.5 px-3 min-h-[42px] rounded-xl bg-emerald-800 text-white text-xs font-bold cursor-pointer"
                    >
                      رزرو مشاوره عمومی
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigateTab?.('SpecializedCounseling')}
                      className="py-2.5 px-3 min-h-[42px] rounded-xl bg-stone-100 text-stone-800 text-xs font-bold cursor-pointer"
                    >
                      مشاوره شغلی قضا
                    </button>
                  </div>
                </div>
              )}

              {/* RULINGS */}
              {resolvedSpotlight === 'rulings' && (
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-stone-900">
                      {crextioConfig.rulingsShowcaseTitle || 'تالار نقد و مباحثه آراء قضایی'}
                    </span>
                    <span className="text-[11px] font-bold text-amber-700 tabular-nums">
                      {toPersianNumbers(rulings.length)} رأی
                    </span>
                  </div>

                  <div className="divide-y divide-stone-100">
                    {featuredRulings.map(ruling => (
                      <button
                        key={ruling.id}
                        type="button"
                        onClick={() => onNavigateTab?.('Rulings')}
                        className="w-full py-3 first:pt-1 last:pb-1 flex items-center justify-between gap-3 text-right cursor-pointer group"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-extrabold text-stone-900 group-hover:text-emerald-800 truncate">
                            {ruling.title}
                          </p>
                          <p className="text-[11px] text-stone-500 mt-0.5 truncate">
                            {ruling.caseTypeTitle}
                            <span aria-hidden="true"> · </span>
                            <span>{ruling.courtBranch}</span>
                          </p>
                        </div>
                        <ChevronLeft className="w-4 h-4 text-stone-400 shrink-0" />
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => onNavigateTab?.('Rulings')}
                    className="w-full py-2.5 min-h-[42px] rounded-xl bg-stone-900 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>ورود به تالار آراء</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* RESEARCH */}
              {resolvedSpotlight === 'research' && (
                <div className="p-4 space-y-3.5">
                  <div className="space-y-1">
                    <p className="text-xs font-black text-stone-900">
                      {crextioConfig.researchPromoTitle || 'راهبری پژوهش‌ها و مقالات علمی'}
                    </p>
                    <p className="text-[11px] text-stone-600 leading-relaxed">
                      همراهی با اساتید راهنمای طراز اول، گرنت پژوهشی و تسهیل اسکان مطالعاتی در قم و مشهد.
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-xs bg-[#F7F6F1] rounded-2xl p-3">
                    <span className="text-stone-600 font-bold">پرونده‌های پژوهشی فعال</span>
                    <span className="font-black text-emerald-800 tabular-nums">
                      {toPersianNumbers(researchMentorships.length)} طرح
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigateTab?.('Research')}
                    className="w-full py-2.5 min-h-[42px] rounded-xl bg-emerald-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>میز راهبری پژوهش</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* WELFARE */}
              {resolvedSpotlight === 'welfare' && (
                <div className="p-4 space-y-3.5">
                  <div className="space-y-1">
                    <p className="text-xs font-black text-stone-900">
                      {crextioConfig.welfareShowcaseTitle || 'تسهیلات رفاهی، اقامتگاه‌ها و تعاونی'}
                    </p>
                    <p className="text-[11px] text-stone-600 leading-relaxed">
                      ثبت درخواست وام قرض‌الحسنه صندوق حامی، اسکان زیارتی و پژوهشی در مشهد و قم و فروشگاه تعاونی.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigateTab?.('Welfare')}
                    className="w-full py-2.5 min-h-[42px] rounded-xl bg-emerald-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>ورود به میز رفاهیات</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* PRODUCTS / PUBLICATIONS */}
              {resolvedSpotlight === 'products' && (
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-stone-900">
                      {crextioConfig.booksShowcaseTitle || 'کتاب و محصولات چند رسانه‌ای'}
                    </span>
                    <span className="text-[11px] font-bold text-indigo-700 tabular-nums">
                      {toPersianNumbers(products.length)} اثر
                    </span>
                  </div>

                  <div className="divide-y divide-stone-100">
                    {featuredProducts.map(prod => (
                      <button
                        key={prod.id}
                        type="button"
                        onClick={() => onNavigateTab?.('Products')}
                        className="w-full py-3 first:pt-1 last:pb-1 flex items-center justify-between gap-3 text-right cursor-pointer group"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-extrabold text-stone-900 group-hover:text-emerald-800 truncate">
                            {prod.title}
                          </p>
                          <p className="text-[11px] text-stone-500 mt-0.5 truncate">
                            {prod.authorOrPresenter}
                            <span aria-hidden="true"> · </span>
                            <span>{prod.formatTitle}</span>
                          </p>
                        </div>
                        <ChevronLeft className="w-4 h-4 text-stone-400 shrink-0" />
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => onNavigateTab?.('Products')}
                    className="w-full py-2.5 min-h-[42px] rounded-xl bg-emerald-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>مشاهده کتاب‌ها و آثار</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </section>
      )}
    </div>
  );
};
