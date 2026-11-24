import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { resolveMobileConfig } from '../../context/ThemeContext';
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
import {
  AppSectionId,
  HonorAppointmentItem,
  MobileDetailedShowcaseId,
  MobileSectionId,
  MobileServiceListTabId,
  MobileServiceShowcaseId,
  WelfareModuleKey,
} from '../../types';
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
  SlidersHorizontal,
  Palette,
  Eye,
  EyeOff,
  ArrowLeft,
  Sparkles,
  BookMarked,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
  MessageSquare,
  CreditCard,
  Landmark,
  Building2,
  ShoppingBag,
  Store,
} from 'lucide-react';

interface MobileDashboardExperienceProps {
  onNavigateTab?: (tab: string) => void;
  onNavigateDeep?: (tab: string, subTab?: string) => void;
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
  onNavigateDeep,
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
    counselingFields,
    researchMentorships,
    cartableRequests,
    counselingRequests,
    welfareRequests,
    consumables,
    welfarePortalConfig,
    myFundMembership,
    installmentPartners,
    synergyPosts,
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
  const [activeHonorIdx, setActiveHonorIdx] = useState(0);
  const deckScrollRef = useRef<HTMLDivElement>(null);
  const honorsScrollRef = useRef<HTMLDivElement>(null);

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

  const mobileConfig = useMemo(
    () => resolveMobileConfig(crextioConfig.mobileConfig),
    [crextioConfig.mobileConfig]
  );

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

  // Quick Dock Services (RBAC + Navigation Customizer Synced — hidden by default on mobile)
  const effectiveStaff = !isAlumni;
  const resolvedNav = getResolvedNavigationConfig(crextioConfig.navigationConfig);

  const launcherCandidates: Array<{
    id: string;
    sectionId: AppSectionId;
    label: string;
    icon: any;
    accentColor: string;
  }> = [
    { id: 'People', sectionId: 'cartable', label: 'کارتابل', icon: Inbox, accentColor: 'text-emerald-800' },
    { id: 'Courses', sectionId: 'courses', label: 'دوره‌ها', icon: GraduationCap, accentColor: 'text-teal-800' },
    {
      id: 'CounselingGeneral',
      sectionId: 'counseling',
      label: 'مشاوره و سلامت',
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
    { id: 'Rulings', sectionId: 'rulings', label: 'تالار آراء', icon: Scale, accentColor: 'text-amber-800' },
    { id: 'Research', sectionId: 'research', label: 'پژوهش', icon: BookOpen, accentColor: 'text-emerald-700' },
    { id: 'Welfare', sectionId: 'welfare', label: 'رفاهیات', icon: Gift, accentColor: 'text-teal-700' },
    { id: 'Products', sectionId: 'products', label: 'انتشارات', icon: BookMarked, accentColor: 'text-indigo-700' },
    { id: 'Synergy', sectionId: 'synergy', label: 'هم‌افزایی', icon: Users2, accentColor: 'text-violet-700' },
    { id: 'Finance', sectionId: 'finance', label: 'امور مالی', icon: Wallet, accentColor: 'text-emerald-800' },
    { id: 'Alumni', sectionId: 'alumni', label: 'دانش‌آموختگان', icon: Award, accentColor: 'text-teal-800' },
    { id: 'Users', sectionId: 'users', label: 'کاربران', icon: Users, accentColor: 'text-indigo-800' },
    { id: 'Admin', sectionId: 'admin', label: 'مدیریت', icon: ShieldCheck, accentColor: 'text-stone-800' },
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
  const activeWorkshopCourses = courses.filter(
    c =>
      !c.isDeleted &&
      c.courseScope === 'counseling_workshop' &&
      (c.status === 'enrolling' || c.status === 'ongoing')
  );
  const activeShowcaseWorkshops = (generalShowcase.workshops || []).filter(w => w.isActive !== false);
  const activeWorkshops = activeShowcaseWorkshops;
  const activeAnnouncements = (generalShowcase.announcements || []).filter(a => a.isActive !== false);
  const combinedWorkshopsCount = activeShowcaseWorkshops.length + activeWorkshopCourses.length;
  const featuredRulings = rulings.filter(r => r.isVisibleToAlumni !== false).slice(0, 4);
  const featuredProducts = products.filter(p => !p.isDeleted).slice(0, 4);
  const generalConsultants = consultants.filter(c => c.counselingType !== 'specialized_career');
  const specializedConsultants = consultants.filter(c => c.counselingType === 'specialized_career');
  const generalFieldsList = counselingFields.filter(
    f => f.counselingType !== 'specialized_career' && f.isActive !== false
  );
  const specializedFieldsList = counselingFields.filter(
    f => f.counselingType === 'specialized_career' && f.isActive !== false
  );
  const activeConsumables = consumables.filter(c => c.stock > 0 && c.isActive !== false);
  const navigateDeep = (tab: string, subTab?: string) => {
    if (onNavigateDeep) {
      onNavigateDeep(tab, subTab);
    } else {
      onNavigateTab?.(tab);
    }
  };

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

  // Honors slides for independent or merged display
  const honorDeckSlides = useMemo<VisualDeckSlide[]>(() => {
    if (
      !mobileConfig.showHonorsShowcase ||
      crextioConfig.showHonorsShowcase === false ||
      hiddenMap.honors_showcase
    ) {
      return [];
    }
    return honorsList.slice(0, 5).map((honor, hIdx) => ({
      id: `honor_${honor.id}`,
      kicker: `${honor.category}${honor.dateOrLocation ? ` · ${honor.dateOrLocation}` : ''}`,
      title: honor.title,
      subtitle: honor.honoreeName || honor.positionOrAchievement || '',
      metaText: honor.positionOrAchievement || 'انتصابات و افتخارات نخبگان',
      ctaLabel: honor.ctaLabel || 'مشاهده جزئیات',
      imageUrl: resolveHonorImageUrl(honor.imageUrl, hIdx),
      accentGradient: 'from-[#071E17] via-[#0F3528] to-[#174636]',
      icon: Award,
      onPress: () => handleHonorCta(honor),
    }));
  }, [mobileConfig.showHonorsShowcase, crextioConfig.showHonorsShowcase, hiddenMap.honors_showcase, honorsList]);

  // Services Showcase slides supporting Simple vs Detailed mode + inline overrides + custom cards + welfare module opt-ins
  const serviceDeckSlides = useMemo<VisualDeckSlide[]>(() => {
    const orderedSlides: VisualDeckSlide[] = [];
    // If admin turned off separation, merge honors at the start of services showcase
    if (!mobileConfig.separateHonorsShowcase && honorDeckSlides.length > 0) {
      orderedSlides.push(...honorDeckSlides);
    }

    const applySlideOverride = (
      base: VisualDeckSlide,
      ov?: { kicker?: string; title?: string; subtitle?: string; metaText?: string; ctaLabel?: string; imageUrl?: string }
    ): VisualDeckSlide => {
      if (!ov) return base;
      return {
        ...base,
        kicker: ov.kicker?.trim() ? ov.kicker : base.kicker,
        title: ov.title?.trim() ? ov.title : base.title,
        subtitle: ov.subtitle?.trim() ? ov.subtitle : base.subtitle,
        metaText: ov.metaText?.trim() ? ov.metaText : base.metaText,
        ctaLabel: ov.ctaLabel?.trim() ? ov.ctaLabel : base.ctaLabel,
        imageUrl: ov.imageUrl?.trim() ? ov.imageUrl : base.imageUrl,
      };
    };

    if (mobileConfig.showcaseMode === 'detailed') {
      const welfareMods = welfarePortalConfig?.modulesConfig;
      const isWelfareSlideEnabled = (
        modKey: 'emergency_loan' | 'qarzolhasaneh_fund' | 'accommodation' | 'consumables' | 'installment_sales',
        detailedId: MobileDetailedShowcaseId
      ): boolean => {
        const modCfg = welfareMods?.[modKey];
        if (modCfg && modCfg.enabled === false) return false;
        const explicitDetailed = mobileConfig.detailedShowcaseEnabled?.[detailedId];
        if (modCfg?.showInMobileShowcase === true) return true;
        return explicitDetailed === true;
      };

      const detailedMap: Record<MobileDetailedShowcaseId, VisualDeckSlide | null> = {
        counseling_workshops:
          mobileConfig.detailedShowcaseEnabled?.counseling_workshops !== false &&
          crextioConfig.showCounselingGeneralShowcase !== false
            ? {
                id: 'detailed_counseling_workshops',
                kicker: `کارگاه‌های روانشناختی · ${toPersianNumbers(combinedWorkshopsCount)} کارگاه فعال`,
                title: 'کارگاه‌های تخصصی سلامت روان و خانواده',
                subtitle:
                  activeWorkshops[0]?.title ||
                  activeWorkshopCourses[0]?.title ||
                  'ثبت‌نام فوری کارگاه‌های آنلاین و حضوری مرکز',
                metaText: 'خدمات روانشناختی و مشاوره',
                ctaLabel: 'مشاهده کارگاه‌ها',
                imageUrl:
                  activeWorkshops[0]?.bannerUrl ||
                  activeWorkshopCourses[0]?.coverImage ||
                  resolveShowcaseImageUrl('counseling_general_showcase', crextioConfig.showcaseImageOverrides),
                accentGradient: 'from-[#161B2F] via-[#1B2B45] to-[#08221A]',
                icon: GraduationCap,
                onPress: () => navigateDeep('CounselingGeneral', 'workshops'),
              }
            : null,
        counseling_announcements:
          mobileConfig.detailedShowcaseEnabled?.counseling_announcements !== false &&
          crextioConfig.showCounselingGeneralShowcase !== false
            ? {
                id: 'detailed_counseling_announcements',
                kicker: `اطلاعیه‌های روانشناختی · ${toPersianNumbers(activeAnnouncements.length)} فراخوان`,
                title: activeAnnouncements[0]?.title || 'اطلاعیه‌ها و برنامه‌های کلینیک مشاوره',
                subtitle:
                  activeAnnouncements[0]?.subtitle ||
                  'برنامه نشست‌های روانشناختی، غربالگری و فراخوان‌های جدید',
                metaText: 'اطلاع‌رسانی کلینیک مشاوره',
                ctaLabel: 'مشاهده اطلاعیه‌ها',
                imageUrl:
                  activeAnnouncements[0]?.bannerUrl ||
                  resolveShowcaseImageUrl('counseling_general_showcase', crextioConfig.showcaseImageOverrides),
                accentGradient: 'from-[#281C14] via-[#3A271B] to-[#0D251D]',
                icon: Bell,
                onPress: () => navigateDeep('CounselingGeneral', 'announcements'),
              }
            : null,
        counseling_booking:
          mobileConfig.detailedShowcaseEnabled?.counseling_booking !== false &&
          crextioConfig.showCounselingGeneralShowcase !== false
            ? {
                id: 'detailed_counseling_booking',
                kicker: 'کلینیک سلامت روان و خانواده',
                title: crextioConfig.counselingGeneralShowcaseTitle || 'رزرو وقت خدمات روانشناختی و مشاوره',
                subtitle: 'مشاوره فردی، زوج‌درمانی، پیش از ازدواج و سنجش‌های روان‌شناختی',
                metaText: `${toPersianNumbers(generalConsultants.length)} روان‌شناس و مشاور فعال`,
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
                    : navigateDeep('CounselingGeneral', 'booking'),
              }
            : null,
        counseling_career:
          mobileConfig.detailedShowcaseEnabled?.counseling_career !== false &&
          crextioConfig.showCounselingPromo !== false
            ? {
                id: 'detailed_counseling_career',
                kicker: 'هدایت شغلی و ارتقای قضایی',
                title: crextioConfig.counselingPromoTitle || 'مشاوره شغلی قضا',
                subtitle: 'گفت‌وگوی محرمانه با قضات پیشکسوت دیوان عالی و ارتقای پایه',
                metaText: `${toPersianNumbers(specializedConsultants.length)} استاد و قاضی پیشکسوت`,
                ctaLabel: 'دریافت مشاوره',
                imageUrl: resolveShowcaseImageUrl('counseling_promo', crextioConfig.showcaseImageOverrides),
                accentGradient: 'from-[#182230] via-[#243247] to-[#0B241B]',
                icon: Compass,
                onPress: () => navigateDeep('SpecializedCounseling'),
              }
            : null,
        courses_active:
          mobileConfig.detailedShowcaseEnabled?.courses_active !== false &&
          crextioConfig.showCourseShowcase !== false
            ? {
                id: 'detailed_courses_active',
                kicker: `آموزش عالی · ${toPersianNumbers(courses.length)} دوره`,
                title: crextioConfig.courseShowcaseTitle || 'دوره‌ها و کارگاه‌های تخصصی فقه و قضا',
                subtitle: activeCourses[0]?.title || 'دوره‌های مهارتی و آرشیو صوتی جلسات',
                metaText: `${toPersianNumbers(myEnrolledCourses)} دوره ثبت‌نامی شما`,
                ctaLabel: 'گالری دوره‌ها',
                imageUrl: resolveShowcaseImageUrl('course_showcase', crextioConfig.showcaseImageOverrides),
                accentGradient: 'from-[#082224] via-[#0E3A3D] to-[#071E17]',
                icon: GraduationCap,
                onPress: () => navigateDeep('Courses'),
              }
            : null,
        rulings_featured:
          mobileConfig.detailedShowcaseEnabled?.rulings_featured !== false &&
          crextioConfig.showRulingsShowcase !== false
            ? {
                id: 'detailed_rulings_featured',
                kicker: `مباحثات قضایی · ${toPersianNumbers(rulings.length)} دادنامه`,
                title: crextioConfig.rulingsShowcaseTitle || 'تالار نقد و مباحثه آراء قضایی',
                subtitle: featuredRulings[0]?.title || 'بررسی استدلال‌های حقوقی و تبادل نظر قضات',
                metaText: 'نقد تحلیلی دیوان عالی',
                ctaLabel: 'ورود به تالار',
                imageUrl: resolveShowcaseImageUrl('rulings_showcase', crextioConfig.showcaseImageOverrides),
                accentGradient: 'from-[#1F180D] via-[#342611] to-[#142921]',
                icon: Scale,
                onPress: () => navigateDeep('Rulings'),
              }
            : null,
        research_guidance:
          mobileConfig.detailedShowcaseEnabled?.research_guidance !== false &&
          crextioConfig.showResearchPromoShowcase !== false
            ? {
                id: 'detailed_research_guidance',
                kicker: `معاونت پژوهش · ${toPersianNumbers(researchMentorships.length)} پرونده`,
                title: crextioConfig.researchPromoTitle || 'راهبری پژوهش‌ها، رساله‌ها و مقالات',
                subtitle: 'اساتید معین طراز اول، گرنت پژوهشی و تسهیل اسکان مطالعاتی',
                metaText: 'حمایت تخصصی تا دفاع',
                ctaLabel: 'میز پژوهش',
                imageUrl: resolveShowcaseImageUrl('research_promo', crextioConfig.showcaseImageOverrides),
                accentGradient: 'from-[#0A1F2C] via-[#123344] to-[#071E17]',
                icon: BookOpen,
                onPress: () => navigateDeep('Research'),
              }
            : null,
        welfare_emergency: isWelfareSlideEnabled('emergency_loan', 'welfare_emergency')
          ? {
              id: 'detailed_welfare_emergency',
              kicker: 'رفاهیات · تسهیلات اضطراری',
              title: 'درخواست تسهیلات اضطراری',
              subtitle: 'ثبت سریع درخواست وام اضطراری با ثبت مبلغ و علت درخواست',
              metaText: 'بررسی توسط مدیریت رفاهی',
              ctaLabel: 'ثبت درخواست',
              imageUrl: resolveShowcaseImageUrl('welfare_showcase', crextioConfig.showcaseImageOverrides),
              accentGradient: 'from-[#0C2621] via-[#133C33] to-[#071E17]',
              icon: Gift,
              onPress: () => navigateDeep('Welfare', 'emergency_loan'),
            }
          : null,
        welfare_fund: isWelfareSlideEnabled('qarzolhasaneh_fund', 'welfare_fund')
          ? {
              id: 'detailed_welfare_fund',
              kicker: 'رفاهیات · صندوق حامی',
              title: 'صندوق قرض‌الحسنه مجتمع فقه و حقوق اسلامی',
              subtitle: 'عضویت در صندوق، واریز حق عضویت ماهانه و مشاهده سوابق پرداخت',
              metaText: 'صندوق قرض‌الحسنه اعضا',
              ctaLabel: 'ورود به صندوق',
              imageUrl: resolveShowcaseImageUrl('welfare_showcase', crextioConfig.showcaseImageOverrides),
              accentGradient: 'from-[#0B231C] via-[#12382D] to-[#071E17]',
              icon: Wallet,
              onPress: () => navigateDeep('Welfare', 'qarzolhasaneh_fund'),
            }
          : null,
        welfare_accommodation: isWelfareSlideEnabled('accommodation', 'welfare_accommodation')
          ? {
              id: 'detailed_welfare_accommodation',
              kicker: 'رفاهیات · زائرسرا و اسکان',
              title: 'اسکان در قم و سایر شهرها',
              subtitle: 'انتخاب شهر، تعداد شب و رزرو آنلاین با تقویم شمسی',
              metaText: 'هماهنگی مستقیم با تماس ادمین',
              ctaLabel: 'رزرو اسکان',
              imageUrl: resolveShowcaseImageUrl('welfare_showcase', crextioConfig.showcaseImageOverrides),
              accentGradient: 'from-[#10262A] via-[#16383E] to-[#071E17]',
              icon: Calendar,
              onPress: () => navigateDeep('Welfare', 'accommodation'),
            }
          : null,
        welfare_consumables: isWelfareSlideEnabled('consumables', 'welfare_consumables')
          ? {
              id: 'detailed_welfare_consumables',
              kicker: `رفاهیات · ${toPersianNumbers(activeConsumables.length)} قلم فعال`,
              title: 'تهیه اقلام مصرفی و فروشگاه تعاونی',
              subtitle: 'سفارش اقلام مصرفی با نرخ تعاونی و انتخاب روش ارسال',
              metaText: 'حضوری، پستی و پیک',
              ctaLabel: 'مشاهده کالاها',
              imageUrl: resolveShowcaseImageUrl('welfare_showcase', crextioConfig.showcaseImageOverrides),
              accentGradient: 'from-[#1B2418] via-[#263621] to-[#071E17]',
              icon: Gift,
              onPress: () => navigateDeep('Welfare', 'consumables'),
            }
          : null,
        welfare_installments: isWelfareSlideEnabled('installment_sales', 'welfare_installments')
          ? {
              id: 'detailed_welfare_installments',
              kicker: 'رفاهیات · خرید اقساطی',
              title: 'فروش اقساطی (سرای ایرانی، آمال و ...)',
              subtitle: 'مشاهده سقف اعتبار، شرایط اقساط و ثبت درخواست اعتبار خرید',
              metaText: 'فروشگاه‌های طرف قرارداد',
              ctaLabel: 'مشاهده شرایط',
              imageUrl: resolveShowcaseImageUrl('welfare_showcase', crextioConfig.showcaseImageOverrides),
              accentGradient: 'from-[#221A12] via-[#36281A] to-[#0E241C]',
              icon: Gift,
              onPress: () => navigateDeep('Welfare', 'installment_sales'),
            }
          : null,
        products_featured:
          mobileConfig.detailedShowcaseEnabled?.products_featured !== false &&
          crextioConfig.showProductsMiniPromo !== false
            ? {
                id: 'detailed_products_featured',
                kicker: `نشر و رسانه علمی · ${toPersianNumbers(products.length)} اثر`,
                title: crextioConfig.booksShowcaseTitle || 'کتاب‌ها، نشست‌ها و درس‌گفتارهای چندرسانه‌ای',
                subtitle: featuredProducts[0]?.title || 'موسوعه‌های فقهی، آثار مرجع و فایل‌های صوتی جلسات',
                metaText: 'دسترسی آنی به فایل و سفارش فیزیکی',
                ctaLabel: 'نمایشگاه آثار',
                imageUrl: resolveShowcaseImageUrl('books_showcase', crextioConfig.showcaseImageOverrides),
                accentGradient: 'from-[#161B30] via-[#212947] to-[#0A221A]',
                icon: BookMarked,
                onPress: () => navigateDeep('Products'),
              }
            : null,
      };

      mobileConfig.detailedShowcaseOrder.forEach(dId => {
        const baseSlide = detailedMap[dId];
        if (!baseSlide) return;
        orderedSlides.push(applySlideOverride(baseSlide, mobileConfig.detailedShowcaseOverrides?.[dId]));
      });
    } else {
      const mapById: Record<MobileServiceShowcaseId, VisualDeckSlide | null> = {
        counseling:
          crextioConfig.showCounselingGeneralShowcase !== false &&
          !hiddenMap.counseling_general_showcase
            ? {
                id: 'counseling_deck',
                kicker: `خدمات روانشناختی و مشاوره · ${toPersianNumbers(combinedWorkshopsCount)} کارگاه`,
                title: crextioConfig.counselingGeneralShowcaseTitle || 'خدمات روانشناختی و مشاوره',
                subtitle:
                  activeWorkshops[0]?.title ||
                  'مشاوره فردی، تحکیم خانواده، ازدواج، کودک و سنجش‌های روان‌شناختی',
                metaText: `${toPersianNumbers(generalConsultants.length)} روان‌شناس و مشاور فعال`,
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
                    : navigateDeep('CounselingGeneral', 'booking'),
              }
            : null,
        counseling_specialized:
          crextioConfig.showCounselingPromo !== false && !hiddenMap.counseling_promo
            ? {
                id: 'specialized_counseling_deck',
                kicker: 'هدایت شغلی و ارتقای قضایی',
                title: crextioConfig.counselingPromoTitle || 'مشاوره شغلی قضا',
                subtitle: 'گفت‌وگوی محرمانه با قضات پیشکسوت دیوان عالی، ارتقای پایه و اختبار',
                metaText: `${toPersianNumbers(specializedConsultants.length)} استاد و قاضی پیشکسوت`,
                ctaLabel: 'دریافت مشاوره',
                imageUrl: resolveShowcaseImageUrl(
                  'counseling_promo',
                  crextioConfig.showcaseImageOverrides
                ),
                accentGradient: 'from-[#182230] via-[#243247] to-[#0B241B]',
                icon: Compass,
                onPress: () => navigateDeep('SpecializedCounseling'),
              }
            : null,
        courses:
          crextioConfig.showCourseShowcase !== false && !hiddenMap.course_showcase
            ? {
                id: 'courses_deck',
                kicker: `آموزش عالی و کارگاه‌ها · ${toPersianNumbers(courses.length)} دوره`,
                title: crextioConfig.courseShowcaseTitle || 'دوره‌ها و نشست‌های تخصصی فقه و قضا',
                subtitle: activeCourses[0]?.title || 'کارگاه‌های مهارت‌افزایی و آرشیو صوتی جلسات',
                metaText: `${toPersianNumbers(myEnrolledCourses)} دوره ثبت‌نامی شما`,
                ctaLabel: 'گالری دوره‌ها',
                imageUrl: resolveShowcaseImageUrl('course_showcase', crextioConfig.showcaseImageOverrides),
                accentGradient: 'from-[#082224] via-[#0E3A3D] to-[#071E17]',
                icon: GraduationCap,
                onPress: () => navigateDeep('Courses'),
              }
            : null,
        rulings:
          crextioConfig.showRulingsShowcase !== false && !hiddenMap.rulings_showcase
            ? {
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
                onPress: () => navigateDeep('Rulings'),
              }
            : null,
        research:
          crextioConfig.showResearchPromoShowcase !== false && !hiddenMap.research_promo
            ? {
                id: 'research_deck',
                kicker: `معاونت پژوهش · ${toPersianNumbers(researchMentorships.length)} پرونده`,
                title: crextioConfig.researchPromoTitle || 'راهبری پژوهش‌ها، رساله‌ها و مقالات',
                subtitle: 'اساتید معین طراز اول، گرنت پژوهشی و تسهیل اسکان مطالعاتی در قم',
                metaText: 'حمایت تخصصی تا مرحله دفاع',
                ctaLabel: 'میز پژوهش',
                imageUrl: resolveShowcaseImageUrl('research_promo', crextioConfig.showcaseImageOverrides),
                accentGradient: 'from-[#0A1F2C] via-[#123344] to-[#071E17]',
                icon: BookOpen,
                onPress: () => navigateDeep('Research'),
              }
            : null,
        welfare:
          crextioConfig.showWelfareShowcase !== false && !hiddenMap.welfare_showcase
            ? {
                id: 'welfare_deck',
                kicker: 'صندوق حامی و تعاونی مصرف',
                title: crextioConfig.welfareShowcaseTitle || 'تسهیلات قرض‌الحسنه، اقامتگاه‌ها و رفاهیات',
                subtitle: 'تسهیلات اضطراری، صندوق قرض‌الحسنه، اسکان، اقلام مصرفی و فروش اقساطی',
                metaText: 'تسهیلات ویژه دانش‌آموختگان',
                ctaLabel: 'میز رفاهیات',
                imageUrl: resolveShowcaseImageUrl('welfare_showcase', crextioConfig.showcaseImageOverrides),
                accentGradient: 'from-[#0C2621] via-[#133C33] to-[#071E17]',
                icon: Gift,
                onPress: () => navigateDeep('Welfare'),
              }
            : null,
        products:
          crextioConfig.showProductsMiniPromo !== false && !hiddenMap.books_showcase
            ? {
                id: 'products_deck',
                kicker: `نشر و رسانه علمی · ${toPersianNumbers(products.length)} اثر`,
                title: crextioConfig.booksShowcaseTitle || 'کتاب‌ها، نشست‌ها و درس‌گفتارهای چندرسانه‌ای',
                subtitle: featuredProducts[0]?.title || 'موسوعه‌های فقهی، آثار مرجع و فایل‌های صوتی جلسات',
                metaText: 'دسترسی آنی به فایل و سفارش فیزیکی',
                ctaLabel: 'نمایشگاه آثار',
                imageUrl: resolveShowcaseImageUrl('books_showcase', crextioConfig.showcaseImageOverrides),
                accentGradient: 'from-[#161B30] via-[#212947] to-[#0A221A]',
                icon: BookMarked,
                onPress: () => navigateDeep('Products'),
              }
            : null,
      };

      mobileConfig.showcaseOrder.forEach(scId => {
        if (mobileConfig.hiddenShowcases[scId]) return;
        const slide = mapById[scId];
        if (slide) {
          orderedSlides.push(applySlideOverride(slide, mobileConfig.showcaseOverrides?.[scId]));
        }
      });
    }

    // Append admin-enabled custom showcase cards (Workshops, Announcements, direct welfare promos, etc.)
    (mobileConfig.customShowcaseCards || [])
      .filter(c => c.enabled)
      .forEach(customCard => {
        orderedSlides.push({
          id: `custom_${customCard.id}`,
          kicker: customCard.kicker || 'ویترین ویژه',
          title: customCard.title,
          subtitle: customCard.subtitle,
          metaText: customCard.metaText || 'دسترسی مستقیم',
          ctaLabel: customCard.ctaLabel || 'مشاهده جزئیات',
          imageUrl:
            customCard.imageUrl ||
            resolveShowcaseImageUrl('counseling_general_showcase', crextioConfig.showcaseImageOverrides),
          accentGradient: 'from-[#0B231D] via-[#133B30] to-[#071E17]',
          icon: Sparkles,
          onPress: () => navigateDeep(customCard.targetView, customCard.subTab),
        });
      });

    return orderedSlides;
  }, [
    mobileConfig.separateHonorsShowcase,
    mobileConfig.showcaseMode,
    mobileConfig.showcaseOrder,
    mobileConfig.hiddenShowcases,
    mobileConfig.showcaseOverrides,
    mobileConfig.detailedShowcaseOrder,
    mobileConfig.detailedShowcaseEnabled,
    mobileConfig.detailedShowcaseOverrides,
    mobileConfig.customShowcaseCards,
    welfarePortalConfig,
    honorDeckSlides,
    crextioConfig,
    hiddenMap,
    activeWorkshops,
    activeWorkshopCourses,
    activeAnnouncements,
    combinedWorkshopsCount,
    generalConsultants.length,
    specializedConsultants.length,
    courses.length,
    activeCourses,
    myEnrolledCourses,
    rulings.length,
    featuredRulings,
    researchMentorships.length,
    activeConsumables.length,
    products.length,
    featuredProducts,
  ]);

  // Independent, de-merged Service List Tabs ordered cleanly by mobileConfig.servicesListOrder
  const feedTabs = useMemo(() => {
    const metaMap: Record<
      MobileServiceListTabId,
      { label: string; icon: any; sectionId: AppSectionId; desktopVisible: boolean }
    > = {
      courses: {
        label: 'دوره‌ها و کارگاه‌ها',
        icon: GraduationCap,
        sectionId: 'courses',
        desktopVisible: crextioConfig.showCourseShowcase !== false && !hiddenMap.course_showcase,
      },
      counseling: {
        label: 'خدمات روانشناختی و مشاوره',
        icon: HeartHandshake,
        sectionId: 'counseling',
        desktopVisible:
          crextioConfig.showCounselingGeneralShowcase !== false &&
          !hiddenMap.counseling_general_showcase,
      },
      specialized_counseling: {
        label: 'مشاوره شغلی قضا',
        icon: Compass,
        sectionId: 'specialized_counseling',
        desktopVisible: crextioConfig.showCounselingPromo !== false && !hiddenMap.counseling_promo,
      },
      rulings: {
        label: 'تالار نقد آراء',
        icon: Scale,
        sectionId: 'rulings',
        desktopVisible: crextioConfig.showRulingsShowcase !== false && !hiddenMap.rulings_showcase,
      },
      research: {
        label: 'خدمات پژوهشی',
        icon: BookOpen,
        sectionId: 'research',
        desktopVisible:
          crextioConfig.showResearchPromoShowcase !== false && !hiddenMap.research_promo,
      },
      welfare: {
        label: 'رفاهیات و تسهیلات',
        icon: Gift,
        sectionId: 'welfare',
        desktopVisible: crextioConfig.showWelfareShowcase !== false && !hiddenMap.welfare_showcase,
      },
      products: {
        label: 'کتاب و رسانه',
        icon: BookMarked,
        sectionId: 'products',
        desktopVisible: crextioConfig.showProductsMiniPromo !== false && !hiddenMap.books_showcase,
      },
      cartable: {
        label: 'کارتابل درخواست‌ها',
        icon: Inbox,
        sectionId: 'cartable',
        desktopVisible: true,
      },
      synergy: {
        label: 'دیوار هم‌افزایی',
        icon: Users2,
        sectionId: 'synergy',
        desktopVisible: true,
      },
    };

    const list: Array<{ id: MobileServiceListTabId; label: string; icon: any }> = [];
    mobileConfig.servicesListOrder.forEach(tabId => {
      if (mobileConfig.hiddenServicesListItems[tabId]) return;
      const meta = metaMap[tabId];
      if (!meta || !meta.desktopVisible) return;
      if (!canViewSection(currentUser, meta.sectionId, rolePolicies)) return;
      list.push({ id: tabId, label: meta.label, icon: meta.icon });
    });
    return list;
  }, [
    mobileConfig.servicesListOrder,
    mobileConfig.hiddenServicesListItems,
    crextioConfig,
    hiddenMap,
    currentUser,
    rolePolicies,
  ]);

  const [activeFeedTab, setActiveFeedTab] = useState<MobileServiceListTabId>('courses');
  const resolvedFeedTab: MobileServiceListTabId = feedTabs.some(t => t.id === activeFeedTab)
    ? activeFeedTab
    : feedTabs[0]?.id || 'courses';

  const handleDeckScroll = () => {
    const el = deckScrollRef.current;
    if (!el || serviceDeckSlides.length === 0) return;
    const maxScroll = Math.max(1, el.scrollWidth - el.clientWidth);
    const ratio = Math.min(1, Math.max(0, Math.abs(el.scrollLeft) / maxScroll));
    const idx = Math.round(ratio * (serviceDeckSlides.length - 1));
    if (idx !== activeSlideIdx) setActiveSlideIdx(idx);
  };

  const handleHonorsScroll = () => {
    const el = honorsScrollRef.current;
    if (!el || honorDeckSlides.length === 0) return;
    const maxScroll = Math.max(1, el.scrollWidth - el.clientWidth);
    const ratio = Math.min(1, Math.max(0, Math.abs(el.scrollLeft) / maxScroll));
    const idx = Math.round(ratio * (honorDeckSlides.length - 1));
    if (idx !== activeHonorIdx) setActiveHonorIdx(idx);
  };

  const completionClamped = Math.max(0, Math.min(100, completionPct));
  const ringCircumference = 2 * Math.PI * 12;
  const ringOffset = ringCircumference * (1 - completionClamped / 100);

  const renderSectionById = (sectionId: MobileSectionId) => {
    switch (sectionId) {
      case 'hero':
        if (!mobileConfig.showHeroBanner || crextioConfig.showHeroBanner === false) return null;
        return (
          <React.Fragment key="mobile_sec_hero">
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="relative overflow-hidden rounded-[30px] bg-gradient-to-br from-[#061A14] via-[#0B2A20] to-[#082119] text-white p-5 border border-[#F3D078]/25 shadow-[0_22px_50px_-22px_rgba(6,26,20,0.75)]"
            >
              <div aria-hidden="true" className="pointer-events-none absolute inset-0 luxury-lattice-bg opacity-65" />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-l from-transparent via-[#F3D078]/75 to-transparent"
              />

              <div className="relative z-10 space-y-4">
                {/* Top Member Pass Identity Bar */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {mobileConfig.showHeroPortrait && (
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
                    )}

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
                      className="flex items-center gap-2 px-3 py-1.5 min-h-[44px] rounded-2xl bg-white/10 hover:bg-white/16 border border-[#F3D078]/30 text-[11px] font-black text-white transition-colors cursor-pointer shrink-0"
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
                          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                        />
                      </svg>
                      <div className="text-right leading-tight">
                        <span className="block text-[9px] text-[#F3D078] font-bold">هویت</span>
                        <span className="tabular-nums text-[11px] font-black">{toPersianNumbers(completionPct)}٪</span>
                      </div>
                    </motion.button>
                  )}
                </div>

                {/* Editorial Welcome Headline */}
                <div className="space-y-1">
                  <h1 className="text-[19px] leading-[1.4] font-black text-white tracking-tight text-balance">
                    {welcomeTitle}
                  </h1>
                  {currentUser?.organization && (
                    <p className="text-[11px] text-emerald-100/75 font-medium truncate">
                      {currentUser.organization}
                    </p>
                  )}
                </div>

                {/* Quick Action Buttons — Disabled by default on Mobile, controlled via Mobile Studio */}
                {mobileConfig.showWelcomeQuickButtons && (
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
                          onClick={() => onNavigateTab?.('Synergy')}
                          className="min-h-[44px] px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/16 border border-white/15 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                        >
                          <Users2 className="w-3.5 h-3.5 text-[#F3D078]" />
                          <span>هم‌افزایی</span>
                        </motion.button>
                      </>
                    )}
                  </div>
                )}

                {/* Stats Row — Disabled by default on Mobile, controlled via Mobile Studio */}
                {mobileConfig.showHeroStats && heroStats.length > 0 && (
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

            {/* Admin Compact Controls directly under Hero */}
            {isRealAdmin && (
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-none -mt-1.5">
                {!isAlumniPreview && onOpenStudio && (
                  <button
                    type="button"
                    onClick={() => onOpenStudio('hero_quick')}
                    className="flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-2xl bg-[#071E17] text-[#F3D078] text-xs font-bold shrink-0 active:scale-95 transition-transform cursor-pointer border border-[#F3D078]/25"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>ویرایش تم موبایل</span>
                  </button>
                )}
                {!isAlumniPreview && onOpenCustomizer && (
                  <button
                    type="button"
                    onClick={onOpenCustomizer}
                    className="flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-2xl bg-white border border-stone-200/90 text-stone-800 text-xs font-bold shrink-0 active:scale-95 transition-transform cursor-pointer"
                  >
                    <Palette className="w-3.5 h-3.5 text-emerald-700" />
                    <span>تنظیمات تکمیلی</span>
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
          </React.Fragment>
        );

      case 'quick_dock':
        if (!mobileConfig.showQuickDock) return null;
        return (
          <section key="mobile_sec_quick_dock" aria-label="درگاه‌های دسترسی سریع" className="space-y-3">
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
              {permittedDock.slice(0, 9).map(item => {
                const Icon = item.icon;
                const hasCountBadge = item.id === 'People' && totalActiveRequests > 0;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onNavigateTab?.(item.id)}
                    className="snap-start shrink-0 w-[68px] flex flex-col items-center gap-1.5 cursor-pointer group active:scale-95 transition-transform focus:outline-none"
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
                  </button>
                );
              })}

              {onOpenAllServices && (
                <button
                  type="button"
                  onClick={onOpenAllServices}
                  className="snap-start shrink-0 w-[68px] flex flex-col items-center gap-1.5 cursor-pointer group active:scale-95 transition-transform focus:outline-none"
                >
                  <div className="w-14 h-14 rounded-[20px] bg-gradient-to-br from-[#071E17] to-[#113D30] border border-[#F3D078]/35 text-[#F3D078] shadow-md flex items-center justify-center">
                    <LayoutGrid className="w-6 h-6 stroke-[2]" />
                  </div>
                  <span className="text-[11px] font-extrabold text-emerald-950 text-center leading-tight whitespace-nowrap">
                    بیشتر
                  </span>
                </button>
              )}
            </div>
          </section>
        );

      case 'status_ledger':
        if (
          !mobileConfig.showStatusLedger ||
          (!topBanner &&
            widgetConfig.showStatusSummaryWidget === false &&
            (widgetConfig.showEventsCalendarWidget === false || events.length === 0))
        ) {
          return null;
        }
        return (
          <section key="mobile_sec_status_ledger" aria-label="وضعیت جاری و تقویم" className="space-y-2.5">
            <div className="bg-white rounded-[26px] border border-stone-200/80 overflow-hidden shadow-[0_12px_30px_-18px_rgba(7,30,23,0.16)] divide-y divide-stone-100">
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

              {widgetConfig.showStatusSummaryWidget !== false && (
                <div className="grid grid-cols-2 divide-x divide-x-reverse divide-stone-100">
                  <button
                    type="button"
                    onClick={() => onNavigateTab?.('People')}
                    className="p-4 flex items-center justify-between gap-2 text-right hover:bg-stone-50/70 active:scale-[0.98] transition-all cursor-pointer min-h-[72px]"
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
                  </button>

                  <button
                    type="button"
                    onClick={() => onNavigateTab?.('Courses')}
                    className="p-4 flex items-center justify-between gap-2 text-right hover:bg-stone-50/70 active:scale-[0.98] transition-all cursor-pointer min-h-[72px]"
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
                  </button>
                </div>
              )}

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
        );

      case 'honors_showcase':
        if (
          !mobileConfig.separateHonorsShowcase ||
          !mobileConfig.showHonorsShowcase ||
          honorDeckSlides.length === 0
        ) {
          return null;
        }
        return (
          <section
            key="mobile_sec_honors_showcase"
            aria-label={mobileConfig.honorsShowcaseTitle || 'ویترین انتصاب و افتخارات'}
            className="space-y-3"
          >
            <div className="flex items-center justify-between px-0.5">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#071E17] to-[#113D30] text-[#F3D078] flex items-center justify-center shrink-0 border border-[#F3D078]/30">
                  <Award className="w-3.5 h-3.5" />
                </span>
                <h2 className="text-[14px] font-black text-stone-900 truncate">
                  {mobileConfig.honorsShowcaseTitle || 'ویترین انتصاب و افتخارات'}
                </h2>
              </div>
              <span className="text-[11px] font-bold text-stone-500 flex items-center gap-1 tabular-nums shrink-0">
                <span>
                  {toPersianNumbers(Math.min(activeHonorIdx + 1, honorDeckSlides.length))} از{' '}
                  {toPersianNumbers(honorDeckSlides.length)}
                </span>
              </span>
            </div>

            <div
              ref={honorsScrollRef}
              onScroll={handleHonorsScroll}
              className="flex items-stretch gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-none -mx-3 px-3 pb-1"
            >
              {honorDeckSlides.map((slide, hIdx) => {
                const imgFailed = Boolean(slideImgFailed[slide.id]);
                return (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={slide.onPress}
                    className="snap-center shrink-0 w-[86vw] max-w-[345px] h-[206px] relative rounded-[26px] overflow-hidden text-right border border-[#F3D078]/30 shadow-[0_18px_40px_-20px_rgba(7,30,23,0.55)] active:scale-[0.985] transition-transform cursor-pointer group bg-gradient-to-br from-[#071E17] via-[#0F3528] to-[#174636]"
                  >
                    {slide.imageUrl && !imgFailed ? (
                      <img
                        src={slide.imageUrl}
                        alt={slide.title}
                        referrerPolicy="no-referrer"
                        loading={hIdx === 0 ? 'eager' : 'lazy'}
                        onError={() => setSlideImgFailed(prev => ({ ...prev, [slide.id]: true }))}
                        className="absolute inset-0 w-full h-full object-cover object-center"
                      />
                    ) : (
                      <div className="absolute inset-0 luxury-lattice-bg opacity-55 flex items-center justify-center">
                        <Award className="w-20 h-20 text-[#F3D078]/20" />
                      </div>
                    )}

                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-gradient-to-t from-[#04120D] via-[#04120D]/72 to-black/20"
                    />
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-l from-transparent via-[#F3D078]/80 to-transparent"
                    />

                    <div className="relative z-10 h-full p-4 flex flex-col justify-between text-white">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-black text-[#F3D078] truncate flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{slide.kicker}</span>
                        </span>
                        <span className="w-8 h-8 rounded-full bg-white/15 border border-white/20 flex items-center justify-center shrink-0 text-[#F3D078]">
                          <ArrowLeft className="w-4 h-4" />
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <h3 className="text-[14px] font-black leading-snug line-clamp-2 text-white">
                          {slide.title}
                        </h3>
                        <p className="text-[11px] text-amber-100/90 line-clamp-1 font-bold">
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
                  </button>
                );
              })}
            </div>
          </section>
        );

      case 'services_showcase':
        if (!mobileConfig.showServicesShowcase || serviceDeckSlides.length === 0) return null;
        return (
          <section
            key="mobile_sec_services_showcase"
            aria-label={mobileConfig.servicesShowcaseTitle || 'ویترین خدمات'}
            className="space-y-3"
          >
            <div className="flex items-center justify-between px-0.5">
              <h2 className="text-[14px] font-black text-stone-900">
                {mobileConfig.servicesShowcaseTitle || 'ویترین خدمات'}
              </h2>
              <span className="text-[11px] font-bold text-stone-500 flex items-center gap-1 tabular-nums">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>
                  {toPersianNumbers(Math.min(activeSlideIdx + 1, serviceDeckSlides.length))} از{' '}
                  {toPersianNumbers(serviceDeckSlides.length)}
                </span>
              </span>
            </div>

            <div
              ref={deckScrollRef}
              onScroll={handleDeckScroll}
              className="flex items-stretch gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-none -mx-3 px-3 pb-1"
            >
              {serviceDeckSlides.map((slide, sIdx) => {
                const SlideIcon = slide.icon;
                const imgFailed = Boolean(slideImgFailed[slide.id]);
                return (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={slide.onPress}
                    className={`snap-center shrink-0 w-[84vw] max-w-[335px] h-[214px] relative rounded-[26px] overflow-hidden text-right border border-[#F3D078]/20 shadow-[0_18px_40px_-20px_rgba(7,30,23,0.55)] active:scale-[0.985] transition-transform cursor-pointer group bg-gradient-to-br ${slide.accentGradient}`}
                  >
                    {slide.imageUrl && !imgFailed ? (
                      <img
                        src={slide.imageUrl}
                        alt={slide.title}
                        referrerPolicy="no-referrer"
                        loading={sIdx === 0 ? 'eager' : 'lazy'}
                        onError={() => setSlideImgFailed(prev => ({ ...prev, [slide.id]: true }))}
                        className="absolute inset-0 w-full h-full object-cover object-center"
                      />
                    ) : (
                      <div className="absolute inset-0 luxury-lattice-bg opacity-50 flex items-center justify-center">
                        <SlideIcon className="w-20 h-20 text-[#F3D078]/20" />
                      </div>
                    )}

                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-gradient-to-t from-[#04120D] via-[#04120D]/68 to-black/15"
                    />
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-l from-transparent via-[#F3D078]/65 to-transparent"
                    />

                    <div className="relative z-10 h-full p-4 flex flex-col justify-between text-white">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-[#F3D078] truncate flex items-center gap-1.5 drop-shadow-xs">
                          <SlideIcon className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{slide.kicker}</span>
                        </span>
                        <span className="w-8 h-8 rounded-full bg-white/15 border border-white/20 flex items-center justify-center shrink-0 text-[#F3D078]">
                          <ArrowLeft className="w-4 h-4" />
                        </span>
                      </div>

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
                  </button>
                );
              })}
            </div>
          </section>
        );

      case 'services_list':
        if (!mobileConfig.showServicesList || feedTabs.length === 0) return null;
        return (
          <section
            key="mobile_sec_services_list"
            aria-label={mobileConfig.servicesListTitle || 'فهرست خدمات'}
            className="space-y-3"
          >
            <div className="flex items-center justify-between px-0.5">
              <h2 className="text-[14px] font-black text-stone-900">
                {mobileConfig.servicesListTitle || 'فهرست خدمات'}
              </h2>
              <span className="text-[11px] font-bold text-stone-500">
                انتخاب جهت مشاهده جزئیات
              </span>
            </div>

            {/* Standout Active Workshops Spotlight inside Services List */}
            {combinedWorkshopsCount > 0 && (
              <motion.button
                type="button"
                whileTap={{ scale: 0.985 }}
                onClick={() => navigateDeep('CounselingGeneral', 'workshops')}
                className="w-full relative overflow-hidden rounded-[22px] bg-gradient-to-l from-[#071E17] via-[#0F3528] to-[#134232] text-white p-3.5 px-4 border border-[#F3D078]/35 shadow-[0_14px_30px_-16px_rgba(7,30,23,0.65)] text-right flex items-center justify-between gap-3 cursor-pointer"
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-l from-transparent via-[#F3D078]/80 to-transparent"
                />
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-[#F3D078]/15 border border-[#F3D078]/40 text-[#F3D078] flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-[#F3D078]">
                      <span>کارگاه در حال برگزاری</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{toPersianNumbers(combinedWorkshopsCount)} کارگاه فعال</span>
                    </div>
                    <p className="text-xs font-black text-white truncate mt-0.5">
                      {activeWorkshops[0]?.title || activeWorkshopCourses[0]?.title || 'کارگاه‌های تخصصی مرکز'}
                    </p>
                    {(activeWorkshops[0]?.scheduleText || activeWorkshopCourses[0]?.schedule) && (
                      <p className="text-[10px] text-emerald-200/90 truncate mt-0.5">
                        {activeWorkshops[0]?.scheduleText || activeWorkshopCourses[0]?.schedule}
                      </p>
                    )}
                  </div>
                </div>
                <span className="px-3 py-1.5 rounded-xl bg-[#F3D078] text-[#071E17] text-[10px] font-black shrink-0 whitespace-nowrap flex items-center gap-1">
                  <span>ثبت‌نام</span>
                  <ArrowLeft className="w-3 h-3" />
                </span>
              </motion.button>
            )}

            {/* Independent De-merged Segmented Service Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5 -mx-1 px-1">
              {feedTabs.map(tab => {
                const Icon = tab.icon;
                const isSelected = resolvedFeedTab === tab.id;
                const hasLiveWorkshop =
                  combinedWorkshopsCount > 0 && (tab.id === 'counseling' || tab.id === 'courses');
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveFeedTab(tab.id)}
                    className={`relative flex items-center gap-1.5 px-3.5 py-2.5 min-h-[42px] rounded-2xl text-xs font-bold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                      isSelected
                        ? 'text-white'
                        : 'bg-white text-stone-700 border border-stone-200/85 hover:text-stone-950'
                    }`}
                  >
                    {isSelected && (
                      <motion.span
                        layoutId="mobileFeedTabPill"
                        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                        className="absolute inset-0 rounded-2xl bg-gradient-to-l from-[#071E17] to-[#10382B] shadow-sm border border-[#F3D078]/25"
                      />
                    )}
                    <Icon
                      className={`relative z-10 w-3.5 h-3.5 ${
                        isSelected ? 'text-[#F3D078]' : 'text-stone-400'
                      }`}
                    />
                    <span className="relative z-10">{tab.label}</span>
                    {hasLiveWorkshop && (
                      <span
                        className={`relative z-10 text-[10px] font-black tabular-nums ${
                          isSelected ? 'text-[#F3D078]' : 'text-emerald-700'
                        }`}
                      >
                        · {toPersianNumbers(combinedWorkshopsCount)} کارگاه
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Expanded, Spacious Rich Detail Card for the Selected Service */}
            <AnimatePresence mode="wait">
              <motion.div
                key={resolvedFeedTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="bg-[#FCFCF9] rounded-[28px] border border-[#E5DEC9] overflow-hidden shadow-[0_14px_34px_-18px_rgba(7,30,23,0.18)]"
              >
                {/* 1. COURSES EXPANDED VIEW */}
                {resolvedFeedTab === 'courses' && (
                  <div className="p-5 space-y-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#071E17] to-[#113D30] text-[#F3D078] flex items-center justify-center shrink-0 border border-[#F3D078]/30 shadow-xs">
                        <GraduationCap className="w-7 h-7" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <h3 className="text-[15px] font-black text-stone-900">
                          {crextioConfig.courseShowcaseTitle || 'دوره‌ها و کارگاه‌های علمی فقه و قضا'}
                        </h3>
                        <p className="text-xs text-stone-600 leading-relaxed">
                          دوره‌های تخصصی حقوق، آیین دادرسی و کارگاه‌های مهارتی با صدور گواهی‌نامه معتبر و امکان ثبت‌نام برخط.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      {activeCourses.slice(0, 3).map(course => {
                        const thumbSrc =
                          course.coverImage ||
                          resolveShowcaseImageUrl('course_showcase', crextioConfig.showcaseImageOverrides);
                        return (
                          <button
                            key={course.id}
                            type="button"
                            onClick={() => onNavigateTab?.('Courses')}
                            className="w-full p-3 rounded-2xl bg-white border border-stone-200/80 hover:border-emerald-300 flex items-start gap-3 text-right cursor-pointer group active:scale-[0.99] transition-all"
                          >
                            <div className="w-14 h-14 rounded-xl bg-emerald-950 overflow-hidden shrink-0 border border-stone-200/80">
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
                            <div className="flex-1 min-w-0 space-y-1">
                              <p className="text-xs font-black text-stone-900 group-hover:text-emerald-800 leading-snug">
                                {course.title}
                              </p>
                              <p className="text-[11px] text-stone-600 line-clamp-2 leading-relaxed">
                                {course.description || `مدرس دوره: ${course.instructor}`}
                              </p>
                              <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-stone-500 pt-0.5 tabular-nums">
                                <span className="text-emerald-800">{course.instructor}</span>
                                <span>·</span>
                                <span>{toPersianNumbers(course.hours)} ساعت آموزش</span>
                                {course.isEnrolled && (
                                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-black">
                                    ثبت‌نام‌شده
                                  </span>
                                )}
                              </div>
                            </div>
                            <ChevronLeft className="w-4 h-4 text-stone-400 shrink-0 mt-1" />
                          </button>
                        );
                      })}
                      {activeCourses.length === 0 && (
                        <p className="py-5 text-center text-xs text-stone-500 bg-white rounded-2xl border border-stone-200/70">
                          دوره فعالی برای نمایش ثبت نشده است.
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => onNavigateTab?.('Courses')}
                      className="w-full py-3 min-h-[48px] rounded-2xl bg-[#071E17] hover:bg-[#0E3226] text-[#F3D078] text-xs font-black flex items-center justify-center gap-2 shadow-md cursor-pointer"
                    >
                      <span>مشاهده تمامی دوره‌ها و ثبت‌نام ({toPersianNumbers(courses.length)})</span>
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* 2. PSYCHOLOGICAL & GENERAL COUNSELING EXPANDED VIEW */}
                {resolvedFeedTab === 'counseling' && (
                  <div className="p-5 space-y-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-stone-200 bg-emerald-950">
                        <img
                          src={resolveShowcaseImageUrl(
                            'counseling_general_showcase',
                            crextioConfig.showcaseImageOverrides
                          )}
                          alt="خدمات روانشناختی و مشاوره"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <h3 className="text-[15px] font-black text-stone-900">
                          خدمات روانشناختی و مشاوره مرکز
                        </h3>
                        <p className="text-xs text-stone-600 leading-relaxed">
                          مشاوره محرمانه سلامت روان، تحکیم خانواده، زوج‌درمانی، پیش از ازدواج، مدیریت استرس شغلی و تست‌های استاندارد روان‌شناختی با حضور روان‌شناسان مجرب.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="p-3 rounded-2xl bg-white border border-stone-200/80">
                        <span className="text-[10px] font-bold text-stone-500 block">کادر روان‌شناسی</span>
                        <span className="text-sm font-black text-emerald-900 mt-1 block tabular-nums">
                          {toPersianNumbers(generalConsultants.length)} مشاور و روان‌شناس
                        </span>
                      </div>
                      <div className="p-3 rounded-2xl bg-white border border-stone-200/80">
                        <span className="text-[10px] font-bold text-stone-500 block">کارگاه‌های سلامت</span>
                        <span className="text-sm font-black text-amber-800 mt-1 block tabular-nums">
                          {toPersianNumbers(activeWorkshops.length)} کارگاه فعال
                        </span>
                      </div>
                    </div>

                    {generalFieldsList.length > 0 && (
                      <div className="p-3.5 rounded-2xl bg-white border border-stone-200/80 space-y-2">
                        <span className="text-[11px] font-black text-stone-800 block">
                          محورهای خدمات قابل رزرو:
                        </span>
                        <div className="space-y-1.5">
                          {generalFieldsList.slice(0, 3).map(field => (
                            <div key={field.id} className="flex items-start gap-2 text-xs text-stone-700">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                              <span className="font-bold">{field.title}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeWorkshops.length > 0 && (
                      <div className="p-3.5 rounded-2xl bg-gradient-to-l from-[#071E17] to-[#10382B] text-white border border-[#F3D078]/35 space-y-2.5 shadow-sm">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-black text-[#F3D078] flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>کارگاه‌های فعال روانشناختی ({toPersianNumbers(activeWorkshops.length)})</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => navigateDeep('CounselingGeneral', 'workshops')}
                            className="text-[10px] font-black text-[#F3D078] underline cursor-pointer"
                          >
                            مشاهده همه
                          </button>
                        </div>
                        <div className="space-y-1.5">
                          {activeWorkshops.slice(0, 2).map(wk => (
                            <button
                              key={wk.id}
                              type="button"
                              onClick={() => navigateDeep('CounselingGeneral', 'workshops')}
                              className="w-full p-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-right flex items-center justify-between gap-2 cursor-pointer"
                            >
                              <div className="min-w-0">
                                <p className="text-xs font-black text-white truncate">{wk.title}</p>
                                {(wk.presenter || wk.scheduleText) && (
                                  <p className="text-[10px] text-emerald-100/85 truncate mt-0.5">
                                    {[wk.presenter, wk.scheduleText].filter(Boolean).join(' · ')}
                                  </p>
                                )}
                              </div>
                              <ChevronLeft className="w-4 h-4 text-[#F3D078] shrink-0" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() =>
                          onBookGeneralCounseling
                            ? onBookGeneralCounseling()
                            : navigateDeep('CounselingGeneral', 'booking')
                        }
                        className="py-3 px-3 min-h-[48px] rounded-2xl bg-[#071E17] text-[#F3D078] text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>رزرو نوبت مشاوره</span>
                        <ArrowLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => navigateDeep('CounselingGeneral', 'workshops')}
                        className="py-3 px-3 min-h-[48px] rounded-2xl bg-white border border-stone-300 text-stone-900 text-xs font-black cursor-pointer"
                      >
                        کارگاه‌ها و اطلاعیه‌ها
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. SPECIALIZED JUDICIAL COUNSELING EXPANDED VIEW */}
                {resolvedFeedTab === 'specialized_counseling' && (
                  <div className="p-5 space-y-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1C2736] to-[#0A221B] text-[#F3D078] flex items-center justify-center shrink-0 border border-[#F3D078]/30">
                        <Compass className="w-7 h-7" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <h3 className="text-[15px] font-black text-stone-900">
                          مشاوره شغلی قضا و هدایت علمی نخبگان
                        </h3>
                        <p className="text-xs text-stone-600 leading-relaxed">
                          گفت‌وگوی تخصصی با قضات پیشکسوت دیوان عالی و اساتید برجسته در زمینه مسیر شغلی قضاوت، ارتقای پایه، انتقالات و ادامه تحصیل.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {specializedConsultants.slice(0, 2).map(cons => (
                        <div
                          key={cons.id}
                          className="p-3 rounded-2xl bg-white border border-stone-200/80 flex items-center gap-3"
                        >
                          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-black text-sm shrink-0 border border-amber-200/70">
                            {cons.name.slice(0, 1)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-black text-stone-900 truncate">{cons.name}</p>
                            <p className="text-[11px] text-stone-600 truncate mt-0.5">{cons.title}</p>
                            <p className="text-[10px] text-emerald-800 font-bold mt-0.5 truncate">
                              {cons.availability}
                            </p>
                          </div>
                        </div>
                      ))}
                      {specializedFieldsList.length > 0 && (
                        <div className="p-3 rounded-2xl bg-[#F4F1E7] border border-[#E2D9C2] text-xs text-stone-800 space-y-1">
                          <span className="text-[10px] font-black text-amber-900 block">محورهای فعال:</span>
                          <p className="font-bold leading-relaxed">
                            {specializedFieldsList.slice(0, 3).map(f => f.title).join(' · ')}
                          </p>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => onNavigateTab?.('SpecializedCounseling')}
                      className="w-full py-3 min-h-[48px] rounded-2xl bg-[#071E17] hover:bg-[#0E3226] text-[#F3D078] text-xs font-black flex items-center justify-center gap-2 shadow-md cursor-pointer"
                    >
                      <span>ورود به میز مشاوره شغلی قضا</span>
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* 4. RULINGS EXPANDED VIEW */}
                {resolvedFeedTab === 'rulings' && (
                  <div className="p-5 space-y-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#2C200E] to-[#12261E] text-[#F3D078] flex items-center justify-center shrink-0 border border-[#F3D078]/30">
                        <Scale className="w-7 h-7" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <h3 className="text-[15px] font-black text-stone-900">
                          {crextioConfig.rulingsShowcaseTitle || 'تالار نقد و مباحثه آراء قضایی'}
                        </h3>
                        <p className="text-xs text-stone-600 leading-relaxed">
                          بررسی مبانی فقهی و استدلالی دادنامه‌های منتخب شعب بدوی، تجدیدنظر و دیوان عالی کشور و مشارکت قضات در تحلیل‌های علمی.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      {featuredRulings.slice(0, 3).map(ruling => (
                        <button
                          key={ruling.id}
                          type="button"
                          onClick={() => onNavigateTab?.('Rulings')}
                          className="w-full p-3.5 rounded-2xl bg-white border border-stone-200/80 hover:border-amber-300 flex items-start justify-between gap-3 text-right cursor-pointer group active:scale-[0.99] transition-all"
                        >
                          <div className="space-y-1 min-w-0 flex-1">
                            <p className="text-xs font-black text-stone-900 group-hover:text-emerald-800 leading-snug">
                              {ruling.title}
                            </p>
                            {ruling.summary && (
                              <p className="text-[11px] text-stone-600 line-clamp-2 leading-relaxed">
                                {ruling.summary}
                              </p>
                            )}
                            <p className="text-[10px] font-bold text-amber-800 pt-0.5">
                              {ruling.caseTypeTitle} · {ruling.courtBranch}
                            </p>
                          </div>
                          <ChevronLeft className="w-4 h-4 text-stone-400 shrink-0 mt-1" />
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => onNavigateTab?.('Rulings')}
                      className="w-full py-3 min-h-[48px] rounded-2xl bg-[#071E17] hover:bg-[#0E3226] text-[#F3D078] text-xs font-black flex items-center justify-center gap-2 shadow-md cursor-pointer"
                    >
                      <span>ورود به تالار نقد آراء ({toPersianNumbers(rulings.length)})</span>
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* 5. INDEPENDENT RESEARCH EXPANDED VIEW */}
                {resolvedFeedTab === 'research' && (
                  <div className="p-5 space-y-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0A222E] to-[#071E17] text-[#F3D078] flex items-center justify-center shrink-0 border border-[#F3D078]/30">
                        <BookOpen className="w-7 h-7" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <h3 className="text-[15px] font-black text-stone-900">
                          {crextioConfig.researchPromoTitle || 'راهبری پژوهش‌ها، مقالات و رساله‌های علمی'}
                        </h3>
                        <p className="text-xs text-stone-600 leading-relaxed">
                          حمایت تخصصی از پژوهش‌های قضایی و فقهی، تخصیص اساتید راهنمای معین، گرنت پژوهشی و تسهیل اسکان مطالعاتی در شهر قم.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="p-3.5 rounded-2xl bg-white border border-stone-200/80">
                        <span className="text-[10px] font-bold text-stone-500 block">پرونده‌های پژوهشی</span>
                        <span className="text-sm font-black text-emerald-900 mt-1 block tabular-nums">
                          {toPersianNumbers(researchMentorships.length)} طرح فعال
                        </span>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-white border border-stone-200/80">
                        <span className="text-[10px] font-bold text-stone-500 block">سقف گرنت پژوهشی</span>
                        <span className="text-sm font-black text-amber-800 mt-1 block">
                          {crextioConfig.researchPromoGrantAmount || 'تا ۵۰ میلیون تومان'}
                        </span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white border border-stone-200/80 space-y-1.5 text-xs text-stone-700">
                      <div className="flex items-center gap-2 font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span>ثبت درخواست راهبری مقاله و رساله دکتری</span>
                      </div>
                      <div className="flex items-center gap-2 font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span>رزرو اتاق مطالعه و اسکان پژوهشی در قم</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onNavigateTab?.('Research')}
                      className="w-full py-3 min-h-[48px] rounded-2xl bg-[#071E17] hover:bg-[#0E3226] text-[#F3D078] text-xs font-black flex items-center justify-center gap-2 shadow-md cursor-pointer"
                    >
                      <span>ورود به میز خدمات پژوهشی</span>
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* 6. INDEPENDENT WELFARE EXPANDED VIEW — 5 LUMINOUS SUB-MODULES */}
                {resolvedFeedTab === 'welfare' && (() => {
                  const activePartnersList = (installmentPartners || []).filter(p => p.isActive !== false);
                  const fundStatusSubtitle =
                    myFundMembership?.status === 'approved'
                      ? 'عضو فعال صندوق · واریز حق عضویت و مشاهده سوابق'
                      : myFundMembership?.status === 'pending'
                        ? 'درخواست عضویت در حال بررسی · امکان ویرایش یا لغو'
                        : 'عضویت آنلاین با انتخاب مبلغ حق عضویت ماهانه';
                  const welfareSubCards: Array<{
                    key: WelfareModuleKey;
                    indexLabel: string;
                    title: string;
                    subtitle: string;
                    metaText: string;
                    icon: any;
                    iconClass: string;
                    glowBg: string;
                    featured?: boolean;
                  }> = [
                    {
                      key: 'emergency_loan' as WelfareModuleKey,
                      indexLabel: '۰۱',
                      title: welfarePortalConfig.modulesConfig.emergency_loan?.title || 'تسهیلات اضطراری',
                      subtitle:
                        welfarePortalConfig.modulesConfig.emergency_loan?.subtitle ||
                        'ثبت درخواست وام ضروری با درج مبلغ و علت درخواست',
                      metaText: 'بررسی کارگروه رفاه · ۴۸ تا ۷۲ ساعت کاری',
                      icon: CreditCard,
                      iconClass: 'bg-[#F3D078]/15 text-[#F3D078] border-[#F3D078]/40',
                      glowBg: 'from-[#071E17] via-[#0B2D22] to-[#124030] text-white border-[#F3D078]/50',
                      featured: true,
                    },
                    {
                      key: 'qarzolhasaneh_fund' as WelfareModuleKey,
                      indexLabel: '۰۲',
                      title:
                        welfarePortalConfig.modulesConfig.qarzolhasaneh_fund?.title ||
                        'صندوق قرض‌الحسنه مجتمع فقه و حقوق اسلامی',
                      subtitle: fundStatusSubtitle,
                      metaText: `${toPersianNumbers((welfarePortalConfig.fundConfig?.presetTiers || []).length)} پلن پیشنهادی + مبلغ دلخواه`,
                      icon: Landmark,
                      iconClass: 'bg-amber-50 text-amber-800 border-amber-200',
                      glowBg: 'from-white via-white to-[#FBF5E4]/80 text-stone-900 border-[#E5DEC9]',
                    },
                    {
                      key: 'accommodation' as WelfareModuleKey,
                      indexLabel: '۰۳',
                      title:
                        welfarePortalConfig.modulesConfig.accommodation?.title ||
                        'اسکان در قم و سایر شهرها',
                      subtitle: 'انتخاب شهر، تعداد شب و ثبت تاریخ ورود از تقویم شمسی',
                      metaText: `${toPersianNumbers(welfarePortalConfig.accommodationCities.length)} شهر · حداکثر ${toPersianNumbers(welfarePortalConfig.accommodationMaxNights)} شب`,
                      icon: Building2,
                      iconClass: 'bg-teal-50 text-teal-800 border-teal-200',
                      glowBg: 'from-white via-white to-teal-50/50 text-stone-900 border-[#E5DEC9]',
                    },
                    {
                      key: 'consumables' as WelfareModuleKey,
                      indexLabel: '۰۴',
                      title:
                        welfarePortalConfig.modulesConfig.consumables?.title ||
                        'تهیه اقلام مصرفی',
                      subtitle: 'سفارش اقلام تعاونی با قیمت مصوب و مقایسه نرخ بازار',
                      metaText: `${toPersianNumbers(activeConsumables.length)} قلم فعال · تحویل حضوری، پست یا پیک`,
                      icon: ShoppingBag,
                      iconClass: 'bg-indigo-50 text-indigo-800 border-indigo-200',
                      glowBg: 'from-white via-white to-indigo-50/45 text-stone-900 border-[#E5DEC9]',
                    },
                    {
                      key: 'installment_sales' as WelfareModuleKey,
                      indexLabel: '۰۵',
                      title:
                        welfarePortalConfig.modulesConfig.installment_sales?.title ||
                        'فروش اقساطی',
                      subtitle: 'خرید اعتباری و اقساطی از فروشگاه‌های طرف قرارداد',
                      metaText: `${activePartnersList.slice(0, 2).map(p => p.name).join(' و ') || 'سرای ایرانی و آمال'} · تب سوابق`,
                      icon: Store,
                      iconClass: 'bg-orange-50 text-orange-800 border-orange-200',
                      glowBg: 'from-white via-white to-amber-50/55 text-stone-900 border-[#E5DEC9]',
                    },
                  ].filter(item => {
                    const cfg = welfarePortalConfig?.modulesConfig?.[item.key];
                    if (cfg && cfg.enabled === false) return false;
                    if (currentUser?.role === 'customer' && item.key !== 'consumables') return false;
                    return true;
                  });

                  return (
                    <div className="p-4 sm:p-5 space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0B2922] to-[#071E17] text-[#F3D078] flex items-center justify-center shrink-0 border border-[#F3D078]/35 shadow-sm">
                          <Gift className="w-6 h-6" />
                        </div>
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-800">
                            <span>میز خدمات رفاهی مجتمع</span>
                            <span aria-hidden="true">·</span>
                            <span className="tabular-nums">{toPersianNumbers(welfareSubCards.length)} بخش مستقل</span>
                          </div>
                          <h3 className="text-[15px] font-black text-stone-900">
                            {crextioConfig.welfareShowcaseTitle || 'تسهیلات و رفاهیات مجتمع فقه و حقوق اسلامی'}
                          </h3>
                          <p className="text-[11px] text-stone-600 leading-relaxed">
                            هر یک از ۵ خدمت رفاهی زیر را لمس کنید تا مستقیم به صفحه ثبت درخواست و سوابق آن بخش بروید.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        {welfareSubCards.map(item => {
                          const SubIcon = item.icon;
                          return (
                            <motion.button
                              key={item.key}
                              type="button"
                              whileTap={{ scale: 0.985 }}
                              onClick={() => navigateDeep('Welfare', item.key)}
                              className={`relative overflow-hidden w-full text-right p-3.5 rounded-2xl border bg-gradient-to-l ${item.glowBg} shadow-xs transition-all flex items-center justify-between gap-3 cursor-pointer min-h-[68px]`}
                            >
                              {item.featured && (
                                <span
                                  aria-hidden="true"
                                  className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-l from-transparent via-[#F3D078]/80 to-transparent"
                                />
                              )}
                              <div className="flex items-start gap-3 min-w-0 flex-1">
                                <div
                                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${item.iconClass}`}
                                >
                                  <SubIcon className="w-5 h-5" />
                                </div>
                                <div className="min-w-0 flex-1 space-y-0.5">
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className={`text-[10px] font-black tabular-nums ${
                                        item.featured ? 'text-[#F3D078]' : 'text-stone-400'
                                      }`}
                                    >
                                      {item.indexLabel}
                                    </span>
                                    <span className="text-xs font-black truncate">{item.title}</span>
                                  </div>
                                  <p
                                    className={`text-[11px] leading-snug line-clamp-1 ${
                                      item.featured ? 'text-emerald-100/90' : 'text-stone-600'
                                    }`}
                                  >
                                    {item.subtitle}
                                  </p>
                                  <p
                                    className={`text-[10px] font-bold truncate ${
                                      item.featured ? 'text-[#F3D078]/85' : 'text-emerald-800'
                                    }`}
                                  >
                                    {item.metaText}
                                  </p>
                                </div>
                              </div>
                              <span
                                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                  item.featured
                                    ? 'bg-[#F3D078]/15 text-[#F3D078]'
                                    : 'bg-stone-100 text-stone-600'
                                }`}
                              >
                                <ChevronLeft className="w-4 h-4" />
                              </span>
                            </motion.button>
                          );
                        })}
                      </div>

                      <button
                        type="button"
                        onClick={() => navigateDeep('Welfare')}
                        className="w-full py-3 min-h-[48px] rounded-2xl bg-[#071E17] hover:bg-[#0E3226] text-[#F3D078] text-xs font-black flex items-center justify-center gap-2 shadow-md cursor-pointer"
                      >
                        <span>ورود به نمای کامل میز تسهیلات و رفاهیات</span>
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })()}

                {/* 7. PRODUCTS & PUBLICATIONS EXPANDED VIEW */}
                {resolvedFeedTab === 'products' && (
                  <div className="p-5 space-y-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#192038] to-[#0A221A] text-[#F3D078] flex items-center justify-center shrink-0 border border-[#F3D078]/30">
                        <BookMarked className="w-7 h-7" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <h3 className="text-[15px] font-black text-stone-900">
                          {crextioConfig.booksShowcaseTitle || 'کتاب‌ها، منشورات و محصولات چندرسانه‌ای'}
                        </h3>
                        <p className="text-xs text-stone-600 leading-relaxed">
                          عرضه کتب مرجع فقه القضا، جزوات تحلیلی و درس‌گفتارهای صوتی و تصویری با تخفیف ویژه اعضای مرکز.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      {featuredProducts.slice(0, 3).map((prod, idx) => (
                        <button
                          key={prod.id}
                          type="button"
                          onClick={() => onNavigateTab?.('Products')}
                          className="w-full p-3 rounded-2xl bg-white border border-stone-200/80 hover:border-emerald-300 flex items-start gap-3 text-right cursor-pointer group active:scale-[0.99] transition-all"
                        >
                          <img
                            src={resolveProductCoverUrl(prod.coverImage, prod.format, idx)}
                            alt={prod.title}
                            referrerPolicy="no-referrer"
                            className="w-14 h-14 rounded-xl object-cover bg-stone-100 border border-stone-200/80 shrink-0"
                          />
                          <div className="flex-1 min-w-0 space-y-1">
                            <p className="text-xs font-black text-stone-900 group-hover:text-emerald-800 leading-snug">
                              {prod.title}
                            </p>
                            <p className="text-[11px] text-stone-500">
                              {prod.authorOrPresenter} · {prod.formatTitle}
                            </p>
                            <p className="text-[11px] font-black text-emerald-800 tabular-nums">
                              {toPersianNumbers((prod.digitalPrice ?? prod.price).toLocaleString('fa-IR'))} تومان
                            </p>
                          </div>
                          <ChevronLeft className="w-4 h-4 text-stone-400 shrink-0 mt-1" />
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => onNavigateTab?.('Products')}
                      className="w-full py-3 min-h-[48px] rounded-2xl bg-[#071E17] hover:bg-[#0E3226] text-[#F3D078] text-xs font-black flex items-center justify-center gap-2 shadow-md cursor-pointer"
                    >
                      <span>مشاهده تمامی آثار و انتشارات ({toPersianNumbers(products.length)})</span>
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* 8. CARTABLE EXPANDED VIEW */}
                {resolvedFeedTab === 'cartable' && (
                  <div className="p-5 space-y-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#071E17] to-[#113D30] text-[#F3D078] flex items-center justify-center shrink-0 border border-[#F3D078]/30">
                        <Inbox className="w-7 h-7" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <h3 className="text-[15px] font-black text-stone-900">
                          کارتابل مکاتبات، درخواست‌ها و پیگیری اداری
                        </h3>
                        <p className="text-xs text-stone-600 leading-relaxed">
                          ارسال درخواست رسمی به دبیرخانه و کمیسیون‌ها، دریافت کد رهگیری پیامکی و مشاهده پاسخ کارشناسان به صورت لحظه‌ای.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="p-3.5 rounded-2xl bg-white border border-stone-200/80">
                        <span className="text-[10px] font-bold text-stone-500 block">درخواست‌های فعال</span>
                        <span className="text-sm font-black text-emerald-900 mt-1 block tabular-nums">
                          {toPersianNumbers(myCartableActive)} پرونده در جریان
                        </span>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-white border border-stone-200/80">
                        <span className="text-[10px] font-bold text-stone-500 block">کل سوابق مکاتبات</span>
                        <span className="text-sm font-black text-stone-800 mt-1 block tabular-nums">
                          {toPersianNumbers(cartableRequests.length)} درخواست
                        </span>
                      </div>
                    </div>

                    {cartableRequests.slice(0, 2).map(req => (
                      <div
                        key={req.id}
                        className="p-3 rounded-2xl bg-white border border-stone-200/80 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-black text-stone-900 truncate">{req.title}</p>
                          <p className="text-[10px] text-stone-500 mt-0.5 tabular-nums">
                            کد رهگیری: {toPersianNumbers(req.trackingNumber)}
                          </p>
                        </div>
                        <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => onNavigateTab?.('People')}
                      className="w-full py-3 min-h-[48px] rounded-2xl bg-[#071E17] hover:bg-[#0E3226] text-[#F3D078] text-xs font-black flex items-center justify-center gap-2 shadow-md cursor-pointer"
                    >
                      <span>ورود به کارتابل و ثبت درخواست</span>
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* 9. SYNERGY WALL EXPANDED VIEW */}
                {resolvedFeedTab === 'synergy' && (
                  <div className="p-5 space-y-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1D1B36] to-[#0B261E] text-[#F3D078] flex items-center justify-center shrink-0 border border-[#F3D078]/30">
                        <Users2 className="w-7 h-7" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <h3 className="text-[15px] font-black text-stone-900">
                          دیوار هم‌افزایی و همفکری نخبگان
                        </h3>
                        <p className="text-xs text-stone-600 leading-relaxed">
                          طرح ایده‌های علمی و اجرایی، همکاری پژوهشی میان دانش‌آموختگان و تبادل تجربه‌های قضایی در شبکه نخبگان.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {synergyPosts.slice(0, 2).map(post => (
                        <div
                          key={post.id}
                          className="p-3.5 rounded-2xl bg-white border border-stone-200/80 space-y-1"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-black text-stone-900 truncate">{post.title}</span>
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          </div>
                          <p className="text-[11px] text-stone-600 line-clamp-2 leading-relaxed">
                            {post.content}
                          </p>
                        </div>
                      ))}
                      {synergyPosts.length === 0 && (
                        <p className="p-4 text-center text-xs text-stone-500 bg-white rounded-2xl border border-stone-200/70">
                          موضوعات و گفتگوهای هم‌افزایی را در تالار مشاهده کنید.
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => onNavigateTab?.('Synergy')}
                      className="w-full py-3 min-h-[48px] rounded-2xl bg-[#071E17] hover:bg-[#0E3226] text-[#F3D078] text-xs font-black flex items-center justify-center gap-2 shadow-md cursor-pointer"
                    >
                      <span>ورود به دیوار هم‌افزایی ({toPersianNumbers(synergyPosts.length)})</span>
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </section>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 pb-4" dir="rtl">
      {mobileConfig.mobileSectionOrder.map(secId => renderSectionById(secId))}
    </div>
  );
};
