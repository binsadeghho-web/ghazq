import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { motion } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { resolveMobileConfig } from '../../context/ThemeContext';
import { api } from '../../services/apiClient';
import { toPersianNumbers } from '../../utils/persianNumbers';
import { calculateProfileCompletion } from '../../utils/profileCompletion';
import { formatWelcomeBannerTitle } from '../../utils/welcomeBanner';
import { DEFAULT_SHOWCASE_IMAGES, resolveShowcaseImageUrl, resolveHonorImageUrl } from '../../data/showcaseImages';
import { DEFAULT_HERO_STATS, DEFAULT_CREXTIO_CONFIG } from '../../data/mockData';
import { applyNavigationCustomization, getResolvedNavigationConfig } from '../../utils/navigationConfig';
import { canViewSection, useRbacPolicies } from '../../utils/rbacPolicy';
import {
  AppSectionId,
  HonorAppointmentItem,
  MobileDetailedShowcaseId,
  MobileServiceListTabId,
  MobileServiceShowcaseId,
} from '../../types';
import { Theme2StudioDrawer, Theme2StudioTab } from '../crextio/Theme2StudioDrawer';
import { Theme3HeroAndLedger } from './Theme3HeroAndLedger';
import { Theme3ShowcaseDeck, Theme3VisualSlide } from './Theme3ShowcaseDecks';
import { Theme3ServicesWorkbench, Theme3FeedTabItem } from './Theme3ServicesWorkbench';
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
  Calendar,
  Bell,
  Award,
  ArrowLeft,
  Sparkles,
  BookMarked,
} from 'lucide-react';

const ThemeCustomizerModal = lazy(() =>
  import('../admin/ThemeCustomizerModal').then(m => ({ default: m.ThemeCustomizerModal }))
);

interface Theme3DesktopDashboardProps {
  onNavigateTab?: (tab: string) => void;
  onNavigateDeep?: (tab: string, subTab?: string) => void;
  onOpenAllServices?: () => void;
  onBookGeneralCounseling?: () => void;
  onOpenIdentityCard: () => void;
  isAdmin: boolean;
  isRealAdmin: boolean;
  isAlumni: boolean;
  isAlumniPreview: boolean;
  onToggleAlumniPreview: () => void;
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

export const Theme3DesktopDashboard: React.FC<Theme3DesktopDashboardProps> = ({
  onNavigateTab,
  onNavigateDeep,
  onOpenAllServices,
  onBookGeneralCounseling,
  onOpenIdentityCard,
  isAdmin,
  isRealAdmin,
  isAlumni,
  isAlumniPreview,
  onToggleAlumniPreview,
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
    recreationPrograms,
    synergyPosts,
    crextioConfig,
    updateCrextioConfig,
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
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [studioInitialTab, setStudioInitialTab] = useState<Theme2StudioTab>('hero_quick');
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);

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

  const honorDeckSlides = useMemo<Theme3VisualSlide[]>(() => {
    if (
      !mobileConfig.showHonorsShowcase ||
      crextioConfig.showHonorsShowcase === false ||
      hiddenMap.honors_showcase
    ) {
      return [];
    }
    return honorsList.slice(0, 6).map((honor, hIdx) => ({
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

  const serviceDeckSlides = useMemo<Theme3VisualSlide[]>(() => {
    const orderedSlides: Theme3VisualSlide[] = [];
    if (!mobileConfig.separateHonorsShowcase && honorDeckSlides.length > 0) {
      orderedSlides.push(...honorDeckSlides);
    }

    const applySlideOverride = (
      base: Theme3VisualSlide,
      ov?: { kicker?: string; title?: string; subtitle?: string; metaText?: string; ctaLabel?: string; imageUrl?: string }
    ): Theme3VisualSlide => {
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
        modKey:
          | 'emergency_loan'
          | 'qarzolhasaneh_fund'
          | 'accommodation'
          | 'consumables'
          | 'installment_sales'
          | 'recreation_tourism',
        detailedId: MobileDetailedShowcaseId
      ): boolean => {
        const modCfg = welfareMods?.[modKey];
        if (modCfg && modCfg.enabled === false) return false;
        const explicitDetailed = mobileConfig.detailedShowcaseEnabled?.[detailedId];
        if (modCfg?.showInMobileShowcase === true) return true;
        return explicitDetailed === true;
      };

      const detailedMap: Record<MobileDetailedShowcaseId, Theme3VisualSlide | null> = {
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
        welfare_recreation: isWelfareSlideEnabled('recreation_tourism', 'welfare_recreation')
          ? (() => {
              const activePrograms = (recreationPrograms || []).filter(p => p.isActive !== false);
              const firstProgram = activePrograms[0];
              const rawCover = firstProgram?.coverImage;
              const safeCover =
                rawCover && rawCover.trim() && !rawCover.includes('unsplash.com')
                  ? rawCover
                  : '/assets/recreation/default.jpg';
              return {
                id: 'detailed_welfare_recreation',
                kicker: `رفاهیات · ${toPersianNumbers(activePrograms.length)} برنامه فعال`,
                title: 'تفریحی و گردشگری (تورها و اردوها)',
                subtitle:
                  firstProgram?.title ||
                  'مشاهده اطلاعیه‌ها، ظرفیت، هزینه، شیوه ثبت‌نام و ثبت‌نام تورها',
                metaText: 'تور، اردو و سفرهای خانوادگی',
                ctaLabel: 'مشاهده برنامه‌ها',
                imageUrl: safeCover,
                accentGradient: 'from-[#092822] via-[#103D33] to-[#071E17]',
                icon: Compass,
                onPress: () => navigateDeep('Welfare', 'recreation_tourism'),
              };
            })()
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
      const mapById: Record<MobileServiceShowcaseId, Theme3VisualSlide | null> = {
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
    mobileConfig,
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
    recreationPrograms,
    products.length,
    featuredProducts,
  ]);

  const feedTabs = useMemo<Theme3FeedTabItem[]>(() => {
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

    const list: Theme3FeedTabItem[] = [];
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

  const renderQuickDock = () => {
    const showDock = mobileConfig.showQuickDock || permittedDock.length > 0;
    if (!showDock) return null;

    const tileToneMap: Record<string, string> = {
      People: 'from-emerald-50 to-white border-emerald-200/80',
      Courses: 'from-teal-50 to-white border-teal-200/80',
      CounselingGeneral: 'from-rose-50 to-white border-rose-200/80',
      SpecializedCounseling: 'from-amber-50 to-white border-amber-200/80',
      Rulings: 'from-[#FBF4DC] to-white border-amber-200/85',
      Research: 'from-emerald-50 to-white border-teal-200/80',
      Welfare: 'from-pink-50 to-white border-pink-200/80',
      Products: 'from-indigo-50 to-white border-indigo-200/80',
      Synergy: 'from-sky-50 to-white border-sky-200/80',
    };

    return (
      <section aria-label="درگاه‌های دسترسی سریع" className="space-y-3">
        <div className="flex items-center justify-between px-0.5">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#071E17] to-[#113D30] text-[#F3D078] flex items-center justify-center border border-[#F3D078]/35">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <h2 className="text-[15px] font-black text-stone-900">درگاه‌های دسترسی سریع</h2>
          </div>
          {onOpenAllServices && (
            <button
              type="button"
              onClick={onOpenAllServices}
              className="flex items-center gap-1 text-xs font-black text-emerald-800 hover:text-emerald-950 min-h-[36px] px-2 cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>همه بخش‌ها</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-10 gap-3 bg-white/75 backdrop-blur-sm rounded-[26px] p-4 border border-[#DFD8C4]/85 shadow-[0_12px_30px_-22px_rgba(7,30,23,0.18)]">
          {permittedDock.slice(0, 9).map((item, dIdx) => {
            const Icon = item.icon;
            const hasCountBadge = item.id === 'People' && totalActiveRequests > 0;
            const toneCls = tileToneMap[item.id] || 'from-stone-50 to-white border-stone-200/85';
            return (
              <motion.button
                key={item.id}
                type="button"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(dIdx * 0.025, 0.2), duration: 0.22 }}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => onNavigateTab?.(item.id)}
                className="flex flex-col items-center gap-2 cursor-pointer group focus:outline-none p-1.5 rounded-2xl hover:bg-[#FAF8F2] transition-colors"
              >
                <div
                  className={`relative w-14 h-14 rounded-[20px] bg-gradient-to-br ${toneCls} border shadow-[0_10px_20px_-14px_rgba(7,30,23,0.22)] flex items-center justify-center transition-transform duration-200 group-hover:scale-105`}
                >
                  <Icon className={`w-6 h-6 stroke-[2.1] ${item.accentColor}`} />
                  {hasCountBadge && (
                    <span className="absolute -top-1 -left-1 min-w-[20px] h-5 px-1 rounded-full bg-gradient-to-br from-[#071E17] to-[#113D30] text-[#F3D078] border border-[#F3D078]/40 text-[10px] font-black flex items-center justify-center tabular-nums shadow-xs">
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
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.94 }}
              onClick={onOpenAllServices}
              className="flex flex-col items-center gap-2 cursor-pointer group focus:outline-none p-1.5 rounded-2xl hover:bg-[#FAF8F2] transition-colors"
            >
              <div className="relative overflow-hidden w-14 h-14 rounded-[20px] bg-gradient-to-br from-[#071E17] to-[#113D30] border border-[#F3D078]/40 text-[#F3D078] shadow-md flex items-center justify-center group-hover:scale-105 transition-transform">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 w-10 bg-gradient-to-r from-transparent via-[#F3D078]/20 to-transparent luxury-sheen"
                />
                <LayoutGrid className="relative z-10 w-6 h-6 stroke-[2]" />
              </div>
              <span className="text-[11px] font-extrabold text-emerald-950 text-center leading-tight whitespace-nowrap">
                بیشتر
              </span>
            </motion.button>
          )}
        </div>
      </section>
    );
  };

  // Build ordered blocks respecting mobileSectionOrder while pairing hero + status_ledger cleanly in top 12-col grid
  const orderedSections = mobileConfig.mobileSectionOrder;
  const heroAndLedgerRendered = useMemo(() => (
    <Theme3HeroAndLedger
      showHero={mobileConfig.showHeroBanner && crextioConfig.showHeroBanner !== false}
      showStatusLedger={mobileConfig.showStatusLedger}
      showHeroPortrait={mobileConfig.showHeroPortrait}
      showWelcomeQuickButtons={mobileConfig.showWelcomeQuickButtons}
      showHeroStats={mobileConfig.showHeroStats}
      heroPortraitSrc={heroPortraitSrc || ''}
      welcomeTitle={welcomeTitle}
      heroSchemeLabel={crextioConfig.heroSchemeLabel}
      currentUser={currentUser}
      isAlumni={isAlumni}
      completionPct={completionPct}
      quickHeroBtns={quickHeroBtns}
      heroStats={heroStats}
      onOpenIdentityCard={onOpenIdentityCard}
      onNavigateTab={onNavigateTab}
      onOpenAllServices={onOpenAllServices}
      banners={banners}
      events={events}
      widgetConfig={widgetConfig}
      totalActiveRequests={totalActiveRequests}
      myEnrolledCourses={myEnrolledCourses}
      isRealAdmin={isRealAdmin}
      isAlumniPreview={isAlumniPreview}
      onOpenStudio={tab => {
        setStudioInitialTab(tab);
        setIsStudioOpen(true);
      }}
      onOpenCustomizer={() => setIsCustomizerOpen(true)}
      onToggleAlumniPreview={onToggleAlumniPreview}
    />
  ), [
    mobileConfig,
    crextioConfig,
    heroPortraitSrc,
    welcomeTitle,
    currentUser,
    isAlumni,
    completionPct,
    quickHeroBtns,
    heroStats,
    onOpenIdentityCard,
    onNavigateTab,
    onOpenAllServices,
    banners,
    events,
    widgetConfig,
    totalActiveRequests,
    myEnrolledCourses,
    isRealAdmin,
    isAlumniPreview,
    onToggleAlumniPreview,
  ]);

  let hasEmittedTopPair = false;

  return (
    <div className="space-y-6 pb-4" dir="rtl">
      {orderedSections.map(secId => {
        if (secId === 'hero' || secId === 'status_ledger') {
          if (hasEmittedTopPair) return null;
          hasEmittedTopPair = true;
          return <React.Fragment key="theme3_hero_ledger_pair">{heroAndLedgerRendered}</React.Fragment>;
        }
        if (secId === 'quick_dock') {
          return <React.Fragment key="theme3_quick_dock">{renderQuickDock()}</React.Fragment>;
        }
        if (secId === 'honors_showcase') {
          if (!mobileConfig.separateHonorsShowcase || !mobileConfig.showHonorsShowcase) return null;
          return (
            <Theme3ShowcaseDeck
              key="theme3_honors_deck"
              title={mobileConfig.honorsShowcaseTitle || 'ویترین انتصاب و افتخارات'}
              headerIcon={Award}
              slides={honorDeckSlides}
              fallbackImageUrl={DEFAULT_SHOWCASE_IMAGES.honors_showcase}
              cardsPerPageDesktop={3}
              goldBorderAccent={true}
            />
          );
        }
        if (secId === 'services_showcase') {
          if (!mobileConfig.showServicesShowcase) return null;
          return (
            <Theme3ShowcaseDeck
              key="theme3_services_deck"
              title={mobileConfig.servicesShowcaseTitle || 'ویترین خدمات'}
              headerIcon={Sparkles}
              slides={serviceDeckSlides}
              fallbackImageUrl={DEFAULT_SHOWCASE_IMAGES.unified_showcase || DEFAULT_SHOWCASE_IMAGES.course_showcase || ''}
              cardsPerPageDesktop={4}
            />
          );
        }
        if (secId === 'services_list') {
          if (!mobileConfig.showServicesList) return null;
          return (
            <Theme3ServicesWorkbench
              key="theme3_services_workbench"
              title={mobileConfig.servicesListTitle || 'فهرست خدمات'}
              feedTabs={feedTabs}
              resolvedFeedTab={resolvedFeedTab}
              onSelectTab={setActiveFeedTab}
              combinedWorkshopsCount={combinedWorkshopsCount}
              activeWorkshops={activeWorkshops}
              activeWorkshopCourses={activeWorkshopCourses}
              crextioConfig={crextioConfig}
              courses={courses}
              activeCourses={activeCourses}
              generalConsultants={generalConsultants}
              specializedConsultants={specializedConsultants}
              generalFieldsList={generalFieldsList}
              specializedFieldsList={specializedFieldsList}
              rulings={rulings}
              featuredRulings={featuredRulings}
              researchMentorships={researchMentorships}
              products={products}
              featuredProducts={featuredProducts}
              cartableRequests={cartableRequests}
              myCartableActive={myCartableActive}
              synergyPosts={synergyPosts}
              welfarePortalConfig={welfarePortalConfig}
              myFundMembership={myFundMembership}
              installmentPartners={installmentPartners}
              activeConsumables={activeConsumables}
              recreationPrograms={recreationPrograms}
              currentUser={currentUser}
              onNavigateTab={onNavigateTab}
              navigateDeep={navigateDeep}
              onBookGeneralCounseling={onBookGeneralCounseling}
            />
          );
        }
        return null;
      })}

      {/* Admin Live Studio & Customizer */}
      <Theme2StudioDrawer
        isOpen={isStudioOpen && isAdmin}
        initialTab={studioInitialTab}
        defaultDeviceMode="mobile"
        onClose={() => setIsStudioOpen(false)}
        onOpenAdvancedModal={() => setIsCustomizerOpen(true)}
        crextioConfig={crextioConfig}
        updateCrextioConfig={updateCrextioConfig}
      />

      <Suspense fallback={null}>
        <ThemeCustomizerModal
          isOpen={isCustomizerOpen && isAdmin}
          onClose={() => setIsCustomizerOpen(false)}
        />
      </Suspense>
    </div>
  );
};
