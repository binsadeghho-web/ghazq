import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/apiClient';
import { toPersianNumbers } from '../../utils/persianNumbers';
import { calculateProfileCompletion } from '../../utils/profileCompletion';
import { formatWelcomeBannerTitle } from '../../utils/welcomeBanner';
import {
  resolveShowcaseImageUrl,
  resolveHonorImageUrl,
  resolveProductCoverUrl,
} from '../../data/showcaseImages';
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
  Calendar,
  Bell,
  Award,
  CheckCircle2,
  SlidersHorizontal,
  Palette,
  Eye,
  EyeOff,
  ArrowLeft,
  Sparkles,
  BookMarked,
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

type FeedTabId = 'courses' | 'counseling' | 'rulings' | 'products' | 'research_welfare';

interface VisualDeckSlide {
  id: string;
  kicker: string;
  title: string;
  subtitle: string;
  metaText: string;
  ctaLabel: string;
  imageUrl?: string;
  accentGradient: string;
  icon: any;
  onPress: () => void;
}

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
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [slideImgFailed, setSlideImgFailed] = useState<Record<string, boolean>>({});
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const deckScrollRef = useRef<HTMLDivElement>(null);

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
    .slice(0, 2);

  // Quick Dock Services (RBAC + Navigation Customizer Synced)
  const effectiveStaff = !isAlumni;
  const resolvedNav = getResolvedNavigationConfig(crextioConfig.navigationConfig);

  const launcherCandidates: Array<{
    id: string;
    sectionId: AppSectionId;
    label: string;
    icon: any;
    accentColor: string;
  }> = [
    {
      id: 'People',
      sectionId: 'cartable',
      label: 'کارتابل',
      icon: Inbox,
      accentColor: 'text-emerald-800',
    },
    {
      id: 'Courses',
      sectionId: 'courses',
      label: 'دوره‌ها',
      icon: GraduationCap,
      accentColor: 'text-teal-800',
    },
    {
      id: 'CounselingGeneral',
      sectionId: 'counseling',
      label: 'مشاوره',
      icon: HeartHandshake,
      accentColor: 'text-rose-700',
    },
    {
      id: 'SpecializedCounseling',
      sectionId: 'specialized_counseling',
      label: 'مشاوره قضا',
      icon: Compass,
      accentColor: 'text-amber-700',
    },
    {
      id: 'Rulings',
      sectionId: 'rulings',
      label: 'تالار آراء',
      icon: Scale,
      accentColor: 'text-amber-800',
    },
    {
      id: 'Research',
      sectionId: 'research',
      label: 'پژوهش',
      icon: BookOpen,
      accentColor: 'text-emerald-700',
    },
    {
      id: 'Welfare',
      sectionId: 'welfare',
      label: 'رفاهیات',
      icon: Gift,
      accentColor: 'text-teal-700',
    },
    {
      id: 'Products',
      sectionId: 'products',
      label: 'انتشارات',
      icon: BookMarked,
      accentColor: 'text-indigo-700',
    },
    {
      id: 'Synergy',
      sectionId: 'synergy',
      label: 'هم‌افزایی',
      icon: Users2,
      accentColor: 'text-violet-700',
    },
    {
      id: 'Finance',
      sectionId: 'finance',
      label: 'امور مالی',
      icon: Wallet,
      accentColor: 'text-emerald-800',
    },
    {
      id: 'Alumni',
      sectionId: 'alumni',
      label: 'دانش‌آموختگان',
      icon: Award,
      accentColor: 'text-teal-800',
    },
    {
      id: 'Users',
      sectionId: 'users',
      label: 'کاربران',
      icon: Users,
      accentColor: 'text-indigo-800',
    },
    {
      id: 'Admin',
      sectionId: 'admin',
      label: 'مدیریت',
      icon: ShieldCheck,
      accentColor: 'text-stone-800',
    },
  ];

  const permittedDock = applyNavigationCustomization(
    launcherCandidates,
    resolvedNav.servicesMenuItems,
    { hideInvisible: true }
  ).filter(item => {
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
  });

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
  const totalActiveRequests = myCartableActive + myCounselingActive + myWelfareActive;
  const myEnrolledCourses = courses.filter(c => c.isEnrolled).length;

  const activeBanners = banners.filter(b => b.isActive);
  const safeBannerIdx = activeBanners.length > 0 ? bannerIdx % activeBanners.length : 0;
  const topBanner = activeBanners[safeBannerIdx];

  const hiddenMap = crextioConfig.hiddenDashboardSections || {};

  const honorsList =
    crextioConfig.honorsItems && crextioConfig.honorsItems.length > 0
      ? crextioConfig.honorsItems
      : FALLBACK_HONORS;

  const activeCourses = courses.filter(c => !c.isDeleted).slice(0, 4);
  const activeWorkshops = (generalShowcase.workshops || []).filter(w => w.isActive !== false);
  const featuredRulings = rulings.filter(r => r.isVisibleToAlumni !== false).slice(0, 4);
  const featuredProducts = products.filter(p => !p.isDeleted).slice(0, 4);

  const handleHonorCta = (item: HonorAppointmentItem) => {
    if (!item.ctaAction || item.ctaAction === 'none') {
      onNavigateTab?.(isAlumni ? 'Courses' : 'Alumni');
      return;
    }
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

  // Visual Showcase Deck Slides (Editorial Snap Carousel respecting Admin Visibility)
  const deckSlides = useMemo<VisualDeckSlide[]>(() => {
    const slides: VisualDeckSlide[] = [];

    if (crextioConfig.showHonorsShowcase !== false && !hiddenMap.honors_showcase) {
      honorsList.slice(0, 3).forEach((honor, hIdx) => {
        slides.push({
          id: `honor_${honor.id}`,
          kicker: `${honor.category}${honor.dateOrLocation ? ` · ${honor.dateOrLocation}` : ''}`,
          title: honor.title,
          subtitle: honor.honoreeName || honor.positionOrAchievement || '',
          metaText: honor.positionOrAchievement || 'افتخارات نخبگان مجمع',
          ctaLabel: honor.ctaLabel || 'مشاهده',
          imageUrl: resolveHonorImageUrl(honor.imageUrl, hIdx),
          accentGradient: 'from-[#071E17] via-[#0F3528] to-[#174636]',
          icon: Award,
          onPress: () => handleHonorCta(honor),
        });
      });
    }

    if (
      (crextioConfig.showCounselingGeneralShowcase !== false &&
        !hiddenMap.counseling_general_showcase) ||
      (crextioConfig.showCounselingPromo !== false && !hiddenMap.counseling_promo)
    ) {
      const genCount = consultants.filter(c => c.counselingType !== 'specialized_career').length;
      slides.push({
        id: 'counseling_deck',
        kicker: `خدمات مشاوره و کارگاه‌ها · ${toPersianNumbers(activeWorkshops.length)} کارگاه`,
        title: crextioConfig.counselingGeneralShowcaseTitle || 'خدمات مشاوره روانشناختی و خانواده',
        subtitle:
          activeWorkshops[0]?.title ||
          'رزرو محرمانه وقت مشاوره فردی، ازدواج، کودک و هدایت تخصصی قضایی',
        metaText: `${toPersianNumbers(genCount)} روان‌شناس و مشاور فعال`,
        ctaLabel: 'رزرو نوبت',
        imageUrl: resolveShowcaseImageUrl(
          'counseling_general_showcase',
          crextioConfig.showcaseImageOverrides
        ),
        accentGradient: 'from-[#1D1528] via-[#2B1F3A] to-[#0E2921]',
        icon: HeartHandshake,
        onPress: () =>
          onBookGeneralCounseling
            ? onBookGeneralCounseling()
            : onNavigateTab?.('CounselingGeneral'),
      });
    }

    if (crextioConfig.showCourseShowcase !== false && !hiddenMap.course_showcase) {
      slides.push({
        id: 'courses_deck',
        kicker: `آموزش عالی و کارگاه‌ها · ${toPersianNumbers(courses.length)} دوره`,
        title: crextioConfig.courseShowcaseTitle || 'دوره‌ها و نشست‌های تخصصی فقه و قضا',
        subtitle: activeCourses[0]?.title || 'کارگاه‌های مهارت‌افزایی و آرشیو صوتی جلسات',
        metaText: `${toPersianNumbers(myEnrolledCourses)} دوره ثبت‌نامی شما`,
        ctaLabel: 'گالری دوره‌ها',
        imageUrl: resolveShowcaseImageUrl('course_showcase', crextioConfig.showcaseImageOverrides),
        accentGradient: 'from-[#082224] via-[#0E3A3D] to-[#071E17]',
        icon: GraduationCap,
        onPress: () => onNavigateTab?.('Courses'),
      });
    }

    if (crextioConfig.showRulingsShowcase !== false && !hiddenMap.rulings_showcase) {
      slides.push({
        id: 'rulings_deck',
        kicker: `مباحثات قضایی · ${toPersianNumbers(rulings.length)} دادنامه`,
        title: crextioConfig.rulingsShowcaseTitle || 'تالار نقد و مباحثه آراء قضایی',
        subtitle:
          featuredRulings[0]?.title ||
          'بررسی استدلال‌های حقوقی و تبادل نظر قضات و نخبگان بر روی آراء منتخب',
        metaText: 'نقد تحلیلی دیوان عالی و تجدیدنظر',
        ctaLabel: 'ورود به تالار',
        imageUrl: resolveShowcaseImageUrl('rulings_showcase', crextioConfig.showcaseImageOverrides),
        accentGradient: 'from-[#1F180D] via-[#342611] to-[#142921]',
        icon: Scale,
        onPress: () => onNavigateTab?.('Rulings'),
      });
    }

    if (crextioConfig.showResearchPromoShowcase !== false && !hiddenMap.research_promo) {
      slides.push({
        id: 'research_deck',
        kicker: `معاونت پژوهش · ${toPersianNumbers(researchMentorships.length)} پرونده`,
        title: crextioConfig.researchPromoTitle || 'راهبری پژوهش‌ها، رساله‌ها و مقالات',
        subtitle: 'اساتید معین طراز اول، گرنت پژوهشی و تسهیل اسکان مطالعاتی در قم',
        metaText: 'حمایت تخصصی تا مرحله دفاع',
        ctaLabel: 'میز پژوهش',
        imageUrl: resolveShowcaseImageUrl('research_promo', crextioConfig.showcaseImageOverrides),
        accentGradient: 'from-[#0A1F2C] via-[#123344] to-[#071E17]',
        icon: Compass,
        onPress: () => onNavigateTab?.('Research'),
      });
    }

    if (crextioConfig.showWelfareShowcase !== false && !hiddenMap.welfare_showcase) {
      slides.push({
        id: 'welfare_deck',
        kicker: 'صندوق حامی و تعاونی مصرف',
        title: crextioConfig.welfareShowcaseTitle || 'تسهیلات قرض‌الحسنه، اقامتگاه‌ها و رفاهیات',
        subtitle: 'ثبت درخواست وام قرض‌الحسنه، اسکان خانوادگی مشهد و قم و فروشگاه تعاونی',
        metaText: 'تسهیلات ویژه دانش‌آموختگان',
        ctaLabel: 'میز رفاهیات',
        imageUrl: resolveShowcaseImageUrl('welfare_showcase', crextioConfig.showcaseImageOverrides),
        accentGradient: 'from-[#0C2621] via-[#133C33] to-[#071E17]',
        icon: Gift,
        onPress: () => onNavigateTab?.('Welfare'),
      });
    }

    if (crextioConfig.showProductsMiniPromo !== false && !hiddenMap.books_showcase) {
      slides.push({
        id: 'products_deck',
        kicker: `نشر و رسانه علمی · ${toPersianNumbers(products.length)} اثر`,
        title: crextioConfig.booksShowcaseTitle || 'کتاب‌ها، نشست‌ها و درس‌گفتارهای چندرسانه‌ای',
        subtitle: featuredProducts[0]?.title || 'موسوعه‌های فقهی، آثار مرجع و فایل‌های صوتی جلسات',
        metaText: 'دسترسی آنی به فایل و سفارش فیزیکی',
        ctaLabel: 'نمایشگاه آثار',
        imageUrl: resolveShowcaseImageUrl('books_showcase', crextioConfig.showcaseImageOverrides),
        accentGradient: 'from-[#161B30] via-[#212947] to-[#0A221A]',
        icon: BookMarked,
        onPress: () => onNavigateTab?.('Products'),
      });
    }

    return slides;
  }, [
    crextioConfig,
    hiddenMap,
    honorsList,
    consultants,
    activeWorkshops,
    courses.length,
    activeCourses,
    myEnrolledCourses,
    rulings.length,
    featuredRulings,
    researchMentorships.length,
    products.length,
    featuredProducts,
  ]);

  // Feed tabs for live curated items below the visual deck
  const feedTabs = useMemo(() => {
    const list: Array<{ id: FeedTabId; label: string; icon: any }> = [];
    if (crextioConfig.showCourseShowcase !== false && !hiddenMap.course_showcase) {
      list.push({ id: 'courses', label: 'دوره‌ها', icon: GraduationCap });
    }
    if (
      (crextioConfig.showCounselingGeneralShowcase !== false &&
        !hiddenMap.counseling_general_showcase) ||
      (crextioConfig.showCounselingPromo !== false && !hiddenMap.counseling_promo)
    ) {
      list.push({ id: 'counseling', label: 'مشاوره و کارگاه', icon: HeartHandshake });
    }
    if (crextioConfig.showRulingsShowcase !== false && !hiddenMap.rulings_showcase) {
      list.push({ id: 'rulings', label: 'تالار آراء', icon: Scale });
    }
    if (crextioConfig.showProductsMiniPromo !== false && !hiddenMap.books_showcase) {
      list.push({ id: 'products', label: 'انتشارات', icon: BookMarked });
    }
    if (
      (crextioConfig.showResearchPromoShowcase !== false && !hiddenMap.research_promo) ||
      (crextioConfig.showWelfareShowcase !== false && !hiddenMap.welfare_showcase)
    ) {
      list.push({ id: 'research_welfare', label: 'پژوهش و رفاه', icon: Compass });
    }
    return list;
  }, [crextioConfig, hiddenMap]);

  const [activeFeedTab, setActiveFeedTab] = useState<FeedTabId>('courses');
  const resolvedFeedTab: FeedTabId = feedTabs.some(t => t.id === activeFeedTab)
    ? activeFeedTab
    : feedTabs[0]?.id || 'courses';

  const handleDeckScroll = () => {
    const el = deckScrollRef.current;
    if (!el || deckSlides.length === 0) return;
    // In RTL, scrollLeft is 0 or negative/positive depending on engine; use absolute ratio cleanly
    const maxScroll = Math.max(1, el.scrollWidth - el.clientWidth);
    const ratio = Math.min(1, Math.max(0, Math.abs(el.scrollLeft) / maxScroll));
    const idx = Math.round(ratio * (deckSlides.length - 1));
    if (idx !== activeSlideIdx) setActiveSlideIdx(idx);
  };

  const completionClamped = Math.max(0, Math.min(100, completionPct));
  const ringCircumference = 2 * Math.PI * 12;
  const ringOffset = ringCircumference * (1 - completionClamped / 100);

  return (
    <div className="space-y-6 pb-3" dir="rtl">
      {/* 1. ARCHITECTURAL MEMBERSHIP HERO VAULT */}
      {crextioConfig.showHeroBanner !== false && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-[30px] bg-gradient-to-br from-[#061A14] via-[#0B2A20] to-[#082119] text-white p-5 border border-[#F3D078]/25 shadow-[0_24px_56px_-22px_rgba(6,26,20,0.75)]"
        >
          {/* Persian-Islamic Geometric Lattice Overlay */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 luxury-lattice-bg opacity-65" />
          {/* Top Champagne Gold Hairline */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-l from-transparent via-[#F3D078]/75 to-transparent"
          />
          {/* Subtle Ambient Glows + Compositor Sheen */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-20 -left-14 w-52 h-52 rounded-full bg-amber-400/15 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 -right-12 w-56 h-56 rounded-full bg-emerald-400/15 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 w-36 bg-gradient-to-r from-transparent via-[#F3D078]/10 to-transparent luxury-sheen"
          />

          <div className="relative z-10 space-y-4">
            {/* Top Member Pass Identity Bar */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative p-[2px] rounded-[18px] bg-gradient-to-br from-[#F3D078] via-amber-500/50 to-emerald-400/40 shrink-0 shadow-sm">
                  {heroPortraitSrc && !heroImgFailed ? (
                    <img
                      src={heroPortraitSrc}
                      alt={currentUser?.fullName || 'تصویر کاربر'}
                      referrerPolicy="no-referrer"
                      onError={() => setHeroImgFailed(true)}
                      className="w-12 h-12 rounded-[16px] object-cover object-top bg-[#09231B]"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-[16px] bg-[#0B291F] flex items-center justify-center font-black text-sm text-[#F3D078]">
                      {currentUser?.avatarText || 'ف'}
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#F3D078]">
                    <Scale className="w-3 h-3 shrink-0" />
                    <span className="truncate">{crextioConfig.heroSchemeLabel || 'طرح میزان'}</span>
                    <span aria-hidden="true" className="opacity-45">·</span>
                    <span className="text-emerald-200/90 truncate">
                      دوره {toPersianNumbers(currentUser?.graduationYear || '۱۳۹۵')}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-100/85 font-semibold truncate mt-0.5">
                    {currentUser?.roleTitle || (isAlumni ? 'دانش‌آموخته مجمع' : 'مدیر سامانه')}
                  </p>
                </div>
              </div>

              {currentUser && (
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.94 }}
                  onClick={onOpenIdentityCard}
                  className="flex items-center gap-2 px-3 py-1.5 min-h-[44px] rounded-2xl bg-white/10 hover:bg-white/16 border border-[#F3D078]/30 backdrop-blur-md text-[11px] font-black text-white transition-colors cursor-pointer shrink-0 shadow-xs"
                  aria-label="کارت اطلاعات هویتی من"
                >
                  <svg className="w-7 h-7 -rotate-90 shrink-0" viewBox="0 0 30 30" aria-hidden="true">
                    <circle
                      cx="15"
                      cy="15"
                      r="12"
                      fill="none"
                      stroke="rgba(255,255,255,0.16)"
                      strokeWidth="2.5"
                    />
                    <motion.circle
                      cx="15"
                      cy="15"
                      r="12"
                      fill="none"
                      stroke="#F3D078"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeDasharray={ringCircumference}
                      initial={{ strokeDashoffset: ringCircumference }}
                      animate={{ strokeDashoffset: ringOffset }}
                      transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: 0.12 }}
                    />
                  </svg>
                  <div className="text-right leading-tight">
                    <span className="block text-[9px] text-[#F3D078] font-bold">هویت</span>
                    <span className="tabular-nums text-[11px] font-black">{toPersianNumbers(completionPct)}٪</span>
                  </div>
                </motion.button>
              )}
            </div>

            {/* Primary Editorial Welcome Headline */}
            <div className="space-y-1">
              <h1 className="text-[20px] leading-[1.38] font-black text-white tracking-tight text-balance">
                {welcomeTitle}
              </h1>
              {currentUser?.organization && (
                <p className="text-[11px] text-emerald-100/75 font-medium truncate">
                  {currentUser.organization}
                </p>
              )}
            </div>

            {/* Single Dominant Primary CTA + Secondary Action */}
            <div className="flex items-center gap-2">
              {quickHeroBtns.length > 0 ? (
                <>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    onClick={() => onNavigateTab?.(quickHeroBtns[0].targetNav)}
                    className="flex-1 min-h-[44px] px-4 py-2.5 rounded-2xl bg-gradient-to-l from-[#D4AF37] via-[#E8C15A] to-[#F3D078] text-[#071E17] text-xs font-black flex items-center justify-center gap-1.5 shadow-lg shadow-black/25 cursor-pointer"
                  >
                    <span className="truncate">{quickHeroBtns[0].label}</span>
                    <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
                  </motion.button>
                  {quickHeroBtns[1] ? (
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.96 }}
                      onClick={() => onNavigateTab?.(quickHeroBtns[1].targetNav)}
                      className="min-h-[44px] px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/16 border border-white/15 text-white text-xs font-bold flex items-center justify-center cursor-pointer shrink-0 max-w-[45%]"
                    >
                      <span className="truncate">{quickHeroBtns[1].label}</span>
                    </motion.button>
                  ) : (
                    onOpenAllServices && (
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.96 }}
                        onClick={onOpenAllServices}
                        className="min-h-[44px] px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/16 border border-white/15 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <LayoutGrid className="w-3.5 h-3.5 text-[#F3D078]" />
                        <span>خدمات</span>
                      </motion.button>
                    )
                  )}
                </>
              ) : (
                <>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    onClick={() => onNavigateTab?.('People')}
                    className="flex-1 min-h-[44px] px-4 py-2.5 rounded-2xl bg-gradient-to-l from-[#D4AF37] via-[#E8C15A] to-[#F3D078] text-[#071E17] text-xs font-black flex items-center justify-center gap-1.5 shadow-lg shadow-black/25 cursor-pointer"
                  >
                    <span>کارتابل و پیگیری</span>
                    <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
                  </motion.button>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    onClick={() =>
                      onBookGeneralCounseling
                        ? onBookGeneralCounseling()
                        : onNavigateTab?.('CounselingGeneral')
                    }
                    className="min-h-[44px] px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/16 border border-white/15 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <HeartHandshake className="w-3.5 h-3.5 text-[#F3D078]" />
                    <span>نوبت مشاوره</span>
                  </motion.button>
                </>
              )}
            </div>

            {/* Unboxed Hairline Institutional Stats Ledger */}
            {rightSlotMode !== 'quick_actions' &&
              crextioConfig.showHeroStats !== false &&
              heroStats.length > 0 && (
                <div className="pt-3.5 border-t border-[#F3D078]/15 grid grid-cols-3 gap-2 text-center">
                  {heroStats.map((stat, statIdx) => (
                    <div
                      key={stat.id}
                      className={`min-w-0 ${statIdx > 0 ? 'border-r border-white/10 pr-2' : ''}`}
                    >
                      <p className="text-[15px] font-black text-[#F3D078] tabular-nums tracking-tight">
                        {toPersianNumbers(stat.val.toLocaleString('fa-IR'))}
                      </p>
                      <p className="text-[10px] text-emerald-100/80 font-medium truncate mt-0.5">
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>
              )}
          </div>
        </motion.section>
      )}

      {/* ADMIN COMPACT CONTROLS (Authorized staff only, sleek 1-line scroller) */}
      {isRealAdmin && (
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none -mt-2">
          {!isAlumniPreview && onOpenStudio && (
            <button
              type="button"
              onClick={() => onOpenStudio('hero_quick')}
              className="flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-2xl bg-[#071E17] text-[#F3D078] text-xs font-bold shrink-0 active:scale-95 transition-transform cursor-pointer border border-[#F3D078]/25"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>ویرایشگر صفحه</span>
            </button>
          )}
          {!isAlumniPreview && onOpenCustomizer && (
            <button
              type="button"
              onClick={onOpenCustomizer}
              className="flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-2xl bg-white border border-stone-200/90 text-stone-800 text-xs font-bold shrink-0 active:scale-95 transition-transform cursor-pointer"
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
                  : 'bg-white border-stone-200/90 text-stone-700'
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

      {/* 2. EDGE-TO-EDGE HORIZONTAL QUICK SERVICES DOCK (Zero Nested Card Box) */}
      <section aria-label="درگاه‌های دسترسی سریع" className="space-y-3">
        <div className="flex items-center justify-between px-0.5">
          <h2 className="text-[14px] font-black text-stone-900">درگاه‌های دسترسی سریع</h2>
          {onOpenAllServices && (
            <button
              type="button"
              onClick={onOpenAllServices}
              className="flex items-center gap-1 text-xs font-bold text-emerald-800 hover:text-emerald-950 min-h-[36px] px-1 cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>همه بخش‌ها</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-start gap-2.5 overflow-x-auto snap-x snap-mandatory scrollbar-none -mx-3 px-3 pb-1">
          {permittedDock.slice(0, 9).map((item, idx) => {
            const Icon = item.icon;
            const hasCountBadge = item.id === 'People' && totalActiveRequests > 0;
            return (
              <motion.button
                key={item.id}
                type="button"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: Math.min(idx * 0.025, 0.2) }}
                whileTap={{ scale: 0.91 }}
                onClick={() => onNavigateTab?.(item.id)}
                className="snap-start shrink-0 w-[68px] flex flex-col items-center gap-1.5 cursor-pointer group focus:outline-none"
              >
                <div className="relative w-14 h-14 rounded-[20px] bg-white border border-stone-200/80 shadow-[0_8px_18px_-12px_rgba(7,30,23,0.18)] flex items-center justify-center group-hover:border-emerald-300 transition-colors">
                  <Icon className={`w-6 h-6 stroke-[2] ${item.accentColor}`} />
                  {hasCountBadge && (
                    <span className="absolute -top-1 -left-1 min-w-[20px] h-5 px-1 rounded-full bg-emerald-800 text-[#F3D078] text-[10px] font-black flex items-center justify-center tabular-nums shadow-xs">
                      {toPersianNumbers(totalActiveRequests)}
                    </span>
                  )}
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
              whileTap={{ scale: 0.91 }}
              onClick={onOpenAllServices}
              className="snap-start shrink-0 w-[68px] flex flex-col items-center gap-1.5 cursor-pointer group focus:outline-none"
            >
              <div className="w-14 h-14 rounded-[20px] bg-gradient-to-br from-[#071E17] to-[#113D30] border border-[#F3D078]/35 text-[#F3D078] shadow-md flex items-center justify-center">
                <LayoutGrid className="w-6 h-6 stroke-[2]" />
              </div>
              <span className="text-[11px] font-extrabold text-emerald-950 text-center leading-tight whitespace-nowrap">
                بیشتر
              </span>
            </motion.button>
          )}
        </div>
      </section>

      {/* 3. UNIFIED PERSONAL PULSE LEDGER (Single Hairline Card: Notice + Metrics + Event) */}
      {(topBanner ||
        widgetConfig.showStatusSummaryWidget !== false ||
        (widgetConfig.showEventsCalendarWidget !== false && events.length > 0)) && (
        <section aria-label="وضعیت جاری و تقویم" className="space-y-2.5">
          <div className="bg-white rounded-[26px] border border-stone-200/80 overflow-hidden shadow-[0_12px_30px_-18px_rgba(7,30,23,0.16)] divide-y divide-stone-100">
            {/* Active Notice Banner Row */}
            {topBanner && (
              <div className="bg-[#FBF8EF] p-3.5 px-4 flex items-center justify-between gap-2.5">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-800 flex items-center justify-center shrink-0">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-stone-900 truncate">{topBanner.title}</p>
                    <p className="text-[11px] text-stone-600 line-clamp-1 mt-0.5">{topBanner.message}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {activeBanners.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setBannerIdx(i => (i + 1) % activeBanners.length)}
                      className="w-9 h-9 rounded-xl bg-white border border-amber-200/80 flex items-center justify-center text-stone-700 cursor-pointer"
                      aria-label="اطلاعیه بعدی"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  )}
                  {topBanner.actionTab && (
                    <button
                      type="button"
                      onClick={() => onNavigateTab?.(topBanner.actionTab)}
                      className="px-3 py-1.5 min-h-[36px] rounded-xl bg-[#071E17] text-[#F3D078] text-[11px] font-black cursor-pointer whitespace-nowrap"
                    >
                      {topBanner.actionLabel || 'مشاهده'}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Split 2-Column Personal Pulse Counters */}
            {widgetConfig.showStatusSummaryWidget !== false && (
              <div className="grid grid-cols-2 divide-x divide-x-reverse divide-stone-100">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onNavigateTab?.('People')}
                  className="p-4 flex items-center justify-between gap-2 text-right hover:bg-stone-50/70 transition-colors cursor-pointer min-h-[72px]"
                >
                  <div className="min-w-0">
                    <span className="text-2xl font-black text-stone-900 tabular-nums leading-none block">
                      {toPersianNumbers(totalActiveRequests)}
                    </span>
                    <span className="text-[11px] font-bold text-stone-600 mt-1.5 block truncate">
                      پرونده و نوبت فعال
                    </span>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
                    <Inbox className="w-4 h-4" />
                  </div>
                </motion.button>

                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onNavigateTab?.('Courses')}
                  className="p-4 flex items-center justify-between gap-2 text-right hover:bg-stone-50/70 transition-colors cursor-pointer min-h-[72px]"
                >
                  <div className="min-w-0">
                    <span className="text-2xl font-black text-stone-900 tabular-nums leading-none block">
                      {toPersianNumbers(myEnrolledCourses)}
                    </span>
                    <span className="text-[11px] font-bold text-stone-600 mt-1.5 block truncate">
                      دوره ثبت‌نام‌شده
                    </span>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center shrink-0">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                </motion.button>
              </div>
            )}

            {/* Integrated Calendar Accordion Row */}
            {widgetConfig.showEventsCalendarWidget !== false && events.length > 0 && (
              <div>
                <button
                  type="button"
                  onClick={() => events.length > 1 && setCalendarExpanded(v => !v)}
                  className="w-full p-3.5 px-4 flex items-center justify-between gap-3 text-right hover:bg-stone-50/60 transition-colors cursor-pointer min-h-[56px]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-stone-100 text-emerald-900 flex items-center justify-center shrink-0">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-stone-900 truncate">{events[0].title}</p>
                      <p className="text-[11px] text-stone-500 mt-0.5 truncate tabular-nums">
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
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-800 shrink-0 tabular-nums">
                      <span>{toPersianNumbers(events.length)} رویداد</span>
                      {calendarExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </span>
                  )}
                </button>

                <AnimatePresence initial={false}>
                  {calendarExpanded && events.length > 1 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="px-4 pb-3.5 pt-1 border-t border-stone-100 divide-y divide-stone-100 overflow-hidden bg-stone-50/40"
                    >
                      {events.slice(1, 5).map(ev => (
                        <div key={ev.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                          <span className="font-bold text-stone-800 truncate">{ev.title}</span>
                          <span className="text-[11px] text-emerald-800 font-bold shrink-0 tabular-nums">
                            {toPersianNumbers(ev.eventDate)}
                          </span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 4. EDITORIAL SNAP-SCROLL SHOWCASE DECK (Visual Immersive Photography Cards) */}
      {deckSlides.length > 0 && (
        <section aria-label="ویترین تصویری برگزیده‌های مرکز" className="space-y-3">
          <div className="flex items-center justify-between px-0.5">
            <h2 className="text-[14px] font-black text-stone-900">ویترین تصویری و برگزیده‌ها</h2>
            <span className="text-[11px] font-bold text-stone-500 flex items-center gap-1 tabular-nums">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>
                {toPersianNumbers(Math.min(activeSlideIdx + 1, deckSlides.length))} از{' '}
                {toPersianNumbers(deckSlides.length)}
              </span>
            </span>
          </div>

          <div
            ref={deckScrollRef}
            onScroll={handleDeckScroll}
            className="flex items-stretch gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-none -mx-3 px-3 pb-1"
          >
            {deckSlides.map((slide, sIdx) => {
              const SlideIcon = slide.icon;
              const imgFailed = Boolean(slideImgFailed[slide.id]);
              return (
                <motion.button
                  key={slide.id}
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={slide.onPress}
                  className={`snap-center shrink-0 w-[84vw] max-w-[335px] h-[214px] relative rounded-[26px] overflow-hidden text-right border border-[#F3D078]/20 shadow-[0_18px_40px_-20px_rgba(7,30,23,0.55)] cursor-pointer group bg-gradient-to-br ${slide.accentGradient}`}
                >
                  {/* Visual Asset with Resilient Fallback */}
                  {slide.imageUrl && !imgFailed ? (
                    <img
                      src={slide.imageUrl}
                      alt={slide.title}
                      referrerPolicy="no-referrer"
                      loading={sIdx === 0 ? 'eager' : 'lazy'}
                      onError={() => setSlideImgFailed(prev => ({ ...prev, [slide.id]: true }))}
                      className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 luxury-lattice-bg opacity-50 flex items-center justify-center">
                      <SlideIcon className="w-20 h-20 text-[#F3D078]/20" />
                    </div>
                  )}

                  {/* Measured Contrast Gradient Scrim */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-[#04120D] via-[#04120D]/68 to-black/15"
                  />
                  {/* Subtle Champagne Gold Hairline at Top */}
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-l from-transparent via-[#F3D078]/65 to-transparent"
                  />

                  <div className="relative z-10 h-full p-4 flex flex-col justify-between text-white">
                    {/* Top Minimal Editorial Kicker (Zero pill box clutter) */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-[#F3D078] truncate flex items-center gap-1.5 drop-shadow-xs">
                        <SlideIcon className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{slide.kicker}</span>
                      </span>
                      <span className="w-8 h-8 rounded-full bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0 text-[#F3D078]">
                        <ArrowLeft className="w-4 h-4" />
                      </span>
                    </div>

                    {/* Bottom Story Block */}
                    <div className="space-y-1.5">
                      <h3 className="text-[15px] font-black leading-snug line-clamp-2 text-white">
                        {slide.title}
                      </h3>
                      <p className="text-[11px] text-stone-200/90 line-clamp-1 font-medium">
                        {slide.subtitle}
                      </p>
                      <div className="pt-1.5 border-t border-white/15 flex items-center justify-between gap-2 text-[11px]">
                        <span className="text-emerald-200/90 font-semibold truncate">
                          {slide.metaText}
                        </span>
                        <span className="font-black text-[#F3D078] shrink-0 whitespace-nowrap">
                          {slide.ctaLabel} ←
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </section>
      )}

      {/* 5. CURATED VISUAL FEED (Live Lists with Thumbnail Artwork) */}
      {feedTabs.length > 0 && (
        <section aria-label="فهرست زنده و دسترسی آنی" className="space-y-3">
          <div className="flex items-center justify-between px-0.5">
            <h2 className="text-[14px] font-black text-stone-900">فهرست زنده خدمات</h2>
          </div>

          {/* Smooth Spring Segmented Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
            {feedTabs.map(tab => {
              const Icon = tab.icon;
              const isSelected = resolvedFeedTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveFeedTab(tab.id)}
                  className={`relative flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-2xl text-xs font-bold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    isSelected
                      ? 'text-white'
                      : 'bg-white text-stone-600 border border-stone-200/80 hover:text-stone-900'
                  }`}
                >
                  {isSelected && (
                    <motion.span
                      layoutId="mobileFeedTabPill"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      className="absolute inset-0 rounded-2xl bg-gradient-to-l from-[#071E17] to-[#10382B] shadow-sm border border-[#F3D078]/25"
                    />
                  )}
                  <Icon
                    className={`relative z-10 w-3.5 h-3.5 ${
                      isSelected ? 'text-[#F3D078]' : 'text-stone-400'
                    }`}
                  />
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={resolvedFeedTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="bg-white rounded-[26px] border border-stone-200/85 overflow-hidden shadow-[0_12px_30px_-18px_rgba(7,30,23,0.16)]"
            >
              {/* COURSES LIVE ROWS */}
              {resolvedFeedTab === 'courses' && (
                <div className="p-4 space-y-3">
                  <div className="divide-y divide-stone-100">
                    {activeCourses.map((course, idx) => {
                      const thumbSrc =
                        course.coverImage ||
                        resolveShowcaseImageUrl('course_showcase', crextioConfig.showcaseImageOverrides);
                      return (
                        <button
                          key={course.id}
                          type="button"
                          onClick={() => onNavigateTab?.('Courses')}
                          className="w-full py-3 first:pt-1 last:pb-1 flex items-center gap-3 text-right cursor-pointer group min-h-[60px]"
                        >
                          <div className="w-12 h-12 rounded-2xl bg-emerald-950 overflow-hidden shrink-0 border border-stone-200/80">
                            {thumbSrc ? (
                              <img
                                src={thumbSrc}
                                alt={course.title}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[#F3D078]">
                                <GraduationCap className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-extrabold text-stone-900 group-hover:text-emerald-800 truncate">
                              {course.title}
                            </p>
                            <p className="text-[11px] text-stone-500 mt-0.5 truncate tabular-nums">
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
                      );
                    })}
                    {activeCourses.length === 0 && (
                      <p className="py-6 text-center text-xs text-stone-500">
                        دوره فعالی برای نمایش ثبت نشده است.
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => onNavigateTab?.('Courses')}
                    className="w-full py-2.5 min-h-[44px] rounded-2xl bg-[#071E17] hover:bg-[#0E3226] text-[#F3D078] text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>مشاهده تمامی دوره‌ها ({toPersianNumbers(courses.length)})</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* COUNSELING & WORKSHOPS LIVE PANEL */}
              {resolvedFeedTab === 'counseling' && (
                <div className="p-4 space-y-3.5">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-950 overflow-hidden shrink-0 border border-stone-200/80">
                      <img
                        src={resolveShowcaseImageUrl(
                          'counseling_general_showcase',
                          crextioConfig.showcaseImageOverrides
                        )}
                        alt="مشاوره"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-stone-900 truncate">
                        {crextioConfig.counselingGeneralShowcaseTitle || 'خدمات مشاوره عمومی و تخصصی'}
                      </p>
                      <p className="text-[11px] text-stone-600 leading-relaxed mt-0.5 line-clamp-2">
                        رزرو محرمانه وقت مشاوره خانواده، ازدواج، کودک و هدایت تخصصی قضایی با اساتید مرکز
                      </p>
                    </div>
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
                      onClick={() =>
                        onBookGeneralCounseling
                          ? onBookGeneralCounseling()
                          : onNavigateTab?.('CounselingGeneral')
                      }
                      className="py-2.5 px-3 min-h-[44px] rounded-2xl bg-[#071E17] text-[#F3D078] text-xs font-black cursor-pointer"
                    >
                      رزرو مشاوره عمومی
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigateTab?.('SpecializedCounseling')}
                      className="py-2.5 px-3 min-h-[44px] rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-900 text-xs font-bold cursor-pointer"
                    >
                      مشاوره شغلی قضا
                    </button>
                  </div>
                </div>
              )}

              {/* RULINGS LIVE ROWS */}
              {resolvedFeedTab === 'rulings' && (
                <div className="p-4 space-y-3">
                  <div className="divide-y divide-stone-100">
                    {featuredRulings.map(ruling => (
                      <button
                        key={ruling.id}
                        type="button"
                        onClick={() => onNavigateTab?.('Rulings')}
                        className="w-full py-3 first:pt-1 last:pb-1 flex items-center justify-between gap-3 text-right cursor-pointer group min-h-[58px]"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center shrink-0">
                            <Scale className="w-4 h-4" />
                          </div>
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
                        </div>
                        <ChevronLeft className="w-4 h-4 text-stone-400 shrink-0" />
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => onNavigateTab?.('Rulings')}
                    className="w-full py-2.5 min-h-[44px] rounded-2xl bg-[#071E17] hover:bg-[#0E3226] text-[#F3D078] text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>ورود به تالار نقد آراء ({toPersianNumbers(rulings.length)})</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* PRODUCTS / PUBLICATIONS LIVE ROWS */}
              {resolvedFeedTab === 'products' && (
                <div className="p-4 space-y-3">
                  <div className="divide-y divide-stone-100">
                    {featuredProducts.map((prod, idx) => (
                      <button
                        key={prod.id}
                        type="button"
                        onClick={() => onNavigateTab?.('Products')}
                        className="w-full py-3 first:pt-1 last:pb-1 flex items-center gap-3 text-right cursor-pointer group min-h-[60px]"
                      >
                        <img
                          src={resolveProductCoverUrl(prod.coverImage, prod.format, idx)}
                          alt={prod.title}
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-2xl object-cover bg-stone-100 border border-stone-200/80 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-extrabold text-stone-900 group-hover:text-emerald-800 truncate">
                            {prod.title}
                          </p>
                          <p className="text-[11px] text-stone-500 mt-0.5 truncate tabular-nums">
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
                    className="w-full py-2.5 min-h-[44px] rounded-2xl bg-[#071E17] hover:bg-[#0E3226] text-[#F3D078] text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>مشاهده تمامی آثار و انتشارات ({toPersianNumbers(products.length)})</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* RESEARCH & WELFARE UNIFIED ROW PANEL */}
              {resolvedFeedTab === 'research_welfare' && (
                <div className="divide-y divide-stone-100">
                  <button
                    type="button"
                    onClick={() => onNavigateTab?.('Research')}
                    className="w-full p-4 flex items-center justify-between gap-3 text-right hover:bg-stone-50/70 cursor-pointer min-h-[72px]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
                        <Compass className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-stone-900 truncate">
                          {crextioConfig.researchPromoTitle || 'راهبری پژوهش‌ها و رساله‌های علمی'}
                        </p>
                        <p className="text-[11px] text-stone-500 mt-0.5 truncate tabular-nums">
                          {toPersianNumbers(researchMentorships.length)} پرونده فعال · اساتید معین و اسکان قم
                        </p>
                      </div>
                    </div>
                    <ChevronLeft className="w-4 h-4 text-stone-400 shrink-0" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onNavigateTab?.('Welfare')}
                    className="w-full p-4 flex items-center justify-between gap-3 text-right hover:bg-stone-50/70 cursor-pointer min-h-[72px]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center shrink-0">
                        <Gift className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-stone-900 truncate">
                          {crextioConfig.welfareShowcaseTitle || 'صندوق رفاهی حامی، اقامتگاه و تعاونی'}
                        </p>
                        <p className="text-[11px] text-stone-500 mt-0.5 truncate">
                          وام قرض‌الحسنه، اسکان مشهد و قم و سفارش اقلام معیشتی
                        </p>
                      </div>
                    </div>
                    <ChevronLeft className="w-4 h-4 text-stone-400 shrink-0" />
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
