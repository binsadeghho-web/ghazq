import React, { useState, useRef, useCallback, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { toPersianNumbers } from '../../utils/persianNumbers';
import {
  Users,
  Award,
  BookOpen,
  CheckCircle2,
  Sparkles,
  Scale,
  ShieldCheck,
  Gift,
  GraduationCap,
  Sliders,
  Palette,
  Flame,
  Star,
  Activity,
  FileText,
  GripVertical,
  Columns2,
  Minimize2,
  Maximize2,
  EyeOff,
  Compass,
  HeartHandshake,
  LayoutGrid,
  Headphones,
  BookMarked,
  Move,
  Check,
  Image as ImageIcon,
  Layers,
  ArrowUp,
  ArrowDown,
  SlidersHorizontal,
  Edit3,
} from 'lucide-react';
import { CourseShowcase } from './CourseShowcase';
import { CrextioServicesBento } from './CrextioServicesBento';
import { CounselingPromoShowcase } from './CounselingPromoShowcase';
import { CounselingGeneralShowcase } from './CounselingGeneralShowcase';
import { BooksAndPublicationsShowcase } from './BooksAndPublicationsShowcase';
import { WelfareAndLoansShowcase } from './WelfareAndLoansShowcase';
import { MultimediaAndCoursesShowcase } from './MultimediaAndCoursesShowcase';
import { CrextioHeroStatsCustomizerModal } from './CrextioHeroStatsCustomizerModal';
import { CrextioRulingsShowcase } from './CrextioRulingsShowcase';
import { ResearchPromoShowcase } from './ResearchPromoShowcase';
import { MinimalShowcaseCard } from './MinimalShowcaseCard';
import { HonorsShowcase } from './HonorsShowcase';
import { UnifiedShowcaseHub } from './UnifiedShowcaseHub';
import { Theme2StudioDrawer, Theme2StudioTab } from './Theme2StudioDrawer';
import { ShowcaseQuickEditModal } from './ShowcaseQuickEditModal';
import { AnimatedCounter } from '../common/AnimatedCounter';
import { DEFAULT_HERO_STATS, DEFAULT_CREXTIO_CONFIG } from '../../data/mockData';
import { resolveShowcaseImageUrl } from '../../data/showcaseImages';
import { DashboardWidgetsSuite } from '../dashboard/DashboardWidgetsSuite';
import { CANONICAL_DASHBOARD_SECTION_ORDER, reconcileDashboardSectionOrder } from '../../context/ThemeContext';
import { AlumniProfileCompletionWidget } from '../alumni/AlumniProfileCompletionWidget';
import { AlumniIdentityCardModal } from '../alumni/AlumniIdentityCardModal';
import {
  formatWelcomeBannerTitle,
  formatWelcomeBannerSubtitle,
} from '../../utils/welcomeBanner';

const ThemeCustomizerModal = lazy(() =>
  import('../admin/ThemeCustomizerModal').then(m => ({ default: m.ThemeCustomizerModal }))
);

interface CrextioDashboardProps {
  onNavigateTab?: (tab: string) => void;
  onBookGeneralCounseling?: () => void;
}

const SECTION_LABELS: Record<string, string> = {
  dashboard_banners: 'بنرها و اطلاعیه‌های داشبورد',
  status_widget: 'ویجت خلاصه وضعیت پرونده‌ها',
  events_calendar: 'تقویم رویدادها و مهلت‌های مرکز',
  top_vip_row: 'بنر خوش‌آمدگویی و پرتره',
  honors_showcase: 'ویترین افتخارات و انتصابات',
  unified_showcase: 'ویترین جامع یکپارچه (همه ویترین‌ها)',
  rulings_showcase: 'ویترین تالار آراء قضایی',
  research_promo: 'ویترین راهبری پژوهش',
  course_showcase: 'ویترین دوره‌های علمی',
  counseling_promo: 'ویترین خدمات مشاوره تخصصی و نخبگان',
  counseling_general_showcase: 'ویترین خدمات مشاوره عمومی و خانواده',
  welfare_showcase: 'ویترین رفاهیات و تسهیلات',
  multimedia_showcase: 'ویترین درس‌گفتارها',
  bento_grid: 'شبکه جامع خدمات (Bento)',
  books_showcase: 'کتاب و محصولات چند رسانه‌ای',
};

const CLASSIC_MINIMAL_KEYS = new Set([
  'rulings_showcase',
  'research_promo',
  'course_showcase',
  'counseling_promo',
  'counseling_general_showcase',
  'welfare_showcase',
  'multimedia_showcase',
  'books_showcase',
]);

const CrextioCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  onClick?: () => void;
}> = ({ children, className = '', glowColor = 'rgba(16, 185, 129, 0.16)', onClick }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      whileTap={onClick ? { scale: 0.985 } : undefined}
      className={`relative overflow-hidden transition-all duration-300 hover:z-20 hover:shadow-xl ${className}`}
    >
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(160px circle at ${mousePos.x}px ${mousePos.y}px, ${glowColor}, transparent 75%)`,
        }}
      />
      <div className="relative z-10 w-full h-full">{children}</div>
    </motion.div>
  );
};

export const CrextioDashboard: React.FC<CrextioDashboardProps> = ({
  onNavigateTab,
  onBookGeneralCounseling,
}) => {
  const {
    currentUser,
    courses,
    rulings,
    products,
    consultants,
    researchMentorships,
    crextioConfig,
    updateCrextioConfig,
    generalShowcase,
    updateGeneralShowcase,
    setDesignTheme,
    isAlumniPreview,
  } = useApp();

  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [studioInitialTab, setStudioInitialTab] = useState<Theme2StudioTab>('hero_quick');
  const [isHeroStatsModalOpen, setIsHeroStatsModalOpen] = useState(false);
  const [quickServiceSuccess, setQuickServiceSuccess] = useState<string | null>(null);
  const [quickEditSectionKey, setQuickEditSectionKey] = useState<string | null>(null);
  const [isIdentityCardOpen, setIsIdentityCardOpen] = useState(false);

  // Live Drag & Drop and Resize Edit Mode
  const [isLayoutEditMode, setIsLayoutEditMode] = useState(false);
  const [draggedKey, setDraggedKey] = useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

  useEffect(() => {
    if (isAlumniPreview) {
      setIsLayoutEditMode(false);
      setIsStudioOpen(false);
      setIsCustomizerOpen(false);
      setIsHeroStatsModalOpen(false);
    }
  }, [isAlumniPreview]);

  const isRealAdmin =
    currentUser?.role === 'admin' ||
    currentUser?.role === 'super_admin' ||
    currentUser?.role === 'alumni_manager' ||
    currentUser?.role === 'supervisor';
  const isAlumni = currentUser?.role === 'alumni' || isAlumniPreview;
  const isAdmin = isRealAdmin && !isAlumniPreview;

  const heroStats = (crextioConfig.heroStatsConfig || DEFAULT_HERO_STATS).filter(
    s => s.isVisible !== false
  );

  const getStatIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'users':
        return Users;
      case 'graduation':
        return GraduationCap;
      case 'scale':
        return Scale;
      case 'book':
        return BookOpen;
      case 'award':
        return Award;
      case 'activity':
        return Activity;
      case 'gift':
        return Gift;
      case 'shield':
        return ShieldCheck;
      default:
        return Sparkles;
    }
  };

  const handleQuickAction = (actionTitle: string) => {
    setQuickServiceSuccess(
      `درخواست «${actionTitle}» ثبت و کد رهگیری به شماره همراه شما پیامک شد.`
    );
    setTimeout(() => setQuickServiceSuccess(null), 4000);
  };

  // Reconciled section order & layouts from database
  const sectionOrder = reconcileDashboardSectionOrder(crextioConfig.dashboardSectionOrder);
  const hiddenMap = crextioConfig.hiddenDashboardSections || {};
  const layoutsMap = crextioConfig.dashboardSectionLayouts || {};

  const updateSectionLayout = (
    key: string,
    patch: Partial<{
      span: 'full' | 'half';
      density: 'full' | 'minimal';
      scale: 'micro' | 'compact' | 'normal' | 'expanded';
      showImage: boolean;
    }>
  ) => {
    const cur = layoutsMap[key] || { span: 'full', density: 'full', scale: 'normal', showImage: true };
    updateCrextioConfig({
      dashboardSectionLayouts: {
        ...layoutsMap,
        [key]: { ...cur, ...patch },
      },
    });
  };

  const handleDropOnSection = (targetKey: string) => {
    if (!draggedKey || draggedKey === targetKey) {
      setDraggedKey(null);
      setDragOverKey(null);
      return;
    }
    const next = [...sectionOrder];
    const fromIdx = next.indexOf(draggedKey);
    const toIdx = next.indexOf(targetKey);
    if (fromIdx !== -1 && toIdx !== -1) {
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      updateCrextioConfig({ dashboardSectionOrder: next });
    }
    setDraggedKey(null);
    setDragOverKey(null);
  };

  const moveSectionByOffset = (key: string, dir: -1 | 1) => {
    const idx = sectionOrder.indexOf(key);
    if (idx === -1) return;
    const target = idx + dir;
    if (target < 0 || target >= sectionOrder.length) return;
    const next = [...sectionOrder];
    const [moved] = next.splice(idx, 1);
    next.splice(target, 0, moved);
    updateCrextioConfig({ dashboardSectionOrder: next });
  };

  const toggleHideSection = (key: string) => {
    updateCrextioConfig({
      hiddenDashboardSections: {
        ...hiddenMap,
        [key]: !hiddenMap[key],
      },
    });
  };

  const globalMinimalImages = crextioConfig.showShowcaseImagesInMinimal !== false;

  const getQuickBtnIcon = (targetNav: string) => {
    switch (targetNav) {
      case 'Synergy':
        return Users;
      case 'Research':
        return Compass;
      case 'Courses':
        return GraduationCap;
      case 'Rulings':
        return Scale;
      case 'CounselingGeneral':
      case 'SpecializedCounseling':
        return HeartHandshake;
      case 'Welfare':
        return Gift;
      case 'Products':
        return BookMarked;
      case 'Alumni':
        return Award;
      default:
        return FileText;
    }
  };

  const renderSectionContent = (
    sectionKey: string,
    density: 'full' | 'minimal',
    span: 'full' | 'half',
    scale: 'micro' | 'compact' | 'normal' | 'expanded',
    boxShowImage: boolean
  ) => {
    const resolvedBoxImg = resolveShowcaseImageUrl(sectionKey, crextioConfig.showcaseImageOverrides);
    const shouldShowBoxImg = globalMinimalImages && boxShowImage;

    switch (sectionKey) {
      case 'dashboard_banners':
        return <DashboardWidgetsSuite renderMode="banners_only" onNavigateTab={onNavigateTab} />;

      case 'status_widget':
        return (
          <DashboardWidgetsSuite
            renderMode="status_only"
            compactHeight={scale === 'micro' || scale === 'compact'}
            onNavigateTab={onNavigateTab}
          />
        );

      case 'events_calendar':
        return (
          <DashboardWidgetsSuite
            renderMode="calendar_only"
            compactHeight={scale === 'micro' || scale === 'compact'}
            onNavigateTab={onNavigateTab}
          />
        );

      case 'top_vip_row': {
        const heroScale = crextioConfig.heroBannerScale || scale || 'normal';
        const showPortrait = crextioConfig.showHeroPortrait !== false && crextioConfig.showProfileCard !== false;
        const heroPortraitSrc =
          crextioConfig.showcaseImageOverrides?.hero_portrait ||
          (isAlumni
            ? resolveShowcaseImageUrl('hero_portrait', crextioConfig.showcaseImageOverrides)
            : resolveShowcaseImageUrl('rulings_showcase', crextioConfig.showcaseImageOverrides));

        const rightSlotMode = crextioConfig.heroRightSlotMode || 'both';
        const allConfiguredQuickBtns =
          crextioConfig.heroQuickButtons && crextioConfig.heroQuickButtons.length > 0
            ? crextioConfig.heroQuickButtons
            : DEFAULT_CREXTIO_CONFIG.heroQuickButtons || [];
        const roleFilteredQuickBtns = allConfiguredQuickBtns.filter(b => {
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
          return true;
        });
        const visibleQuickBtns = roleFilteredQuickBtns.filter(b => b.visible !== false);
        const configuredQuickBtns =
          visibleQuickBtns.length > 0
            ? visibleQuickBtns
            : rightSlotMode === 'quick_actions'
            ? roleFilteredQuickBtns.slice(0, 4)
            : [];

        const showStatsSlot =
          (rightSlotMode === 'stats' || rightSlotMode === 'both') &&
          crextioConfig.showKpiRow !== false &&
          crextioConfig.showHeroStats !== false;
        const showQuickSlot =
          (rightSlotMode === 'quick_actions'
            ? configuredQuickBtns.length > 0
            : rightSlotMode === 'both'
            ? crextioConfig.showQuickActions !== false && configuredQuickBtns.length > 0
            : false);

        const welcomeTitle = formatWelcomeBannerTitle(
          crextioConfig.heroTitle,
          crextioConfig.heroGreetingPrefix,
          currentUser
        );
        const welcomeSubtitle = formatWelcomeBannerSubtitle(
          crextioConfig.heroSubtitle,
          currentUser
        );

        if (heroScale === 'micro') {
          if (crextioConfig.showHeroBanner === false && !showPortrait) return null;
          return (
            <CrextioCard
              glowColor="rgba(16, 185, 129, 0.20)"
              className="rounded-2xl px-4 py-3 border border-[#E3E0D3] bg-[#FCFCF9]/95 backdrop-blur-2xl shadow-sm"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {showPortrait && heroPortraitSrc && (
                    <img
                      src={heroPortraitSrc}
                      alt={currentUser?.fullName || 'پرتره'}
                      referrerPolicy="no-referrer"
                      className="w-11 h-11 rounded-xl object-cover object-top border border-emerald-200 shrink-0"
                    />
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[10px] text-emerald-800 font-bold">
                      <span className="flex items-center gap-1 text-amber-700 font-black">
                        <Scale className="w-3 h-3" /> {crextioConfig.heroSchemeLabel || 'طرح میزان'}
                      </span>
                      <span>·</span>
                      <span className="truncate">
                        {currentUser?.roleTitle || crextioConfig.heroPortraitBadgeText || 'عضو رسمی مجمع'}
                      </span>
                    </div>
                    <h1 className="text-sm sm:text-base font-black text-stone-900 truncate">
                      {welcomeTitle}
                    </h1>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  {showQuickSlot &&
                    configuredQuickBtns.map(btn => {
                      const QIcon = getQuickBtnIcon(btn.targetNav);
                      return (
                        <button
                          key={btn.id}
                          onClick={() => onNavigateTab?.(btn.targetNav)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-stone-800 border border-stone-200 text-[11px] font-bold transition-all cursor-pointer"
                        >
                          <QIcon className="w-3 h-3 text-emerald-700" />
                          <span>{btn.label}</span>
                        </button>
                      );
                    })}

                  {showStatsSlot && (
                    <div className="hidden sm:flex items-center gap-1.5 mr-1">
                      {heroStats.slice(0, 3).map(stat => (
                        <div
                          key={stat.id}
                          className="px-2.5 py-1 rounded-xl bg-white border border-[#E7E4D8] text-[10px] flex items-center gap-1.5"
                        >
                          <span className="text-stone-500 font-bold">{stat.label}:</span>
                          <span className="font-black text-stone-900 tabular-nums">
                            {toPersianNumbers(stat.val.toLocaleString('fa-IR'))}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CrextioCard>
          );
        }

        const portraitHeightClass =
          heroScale === 'compact'
            ? 'min-h-[175px]'
            : heroScale === 'expanded'
            ? 'min-h-[300px]'
            : 'min-h-[245px]';
        const heroPaddingClass =
          heroScale === 'compact'
            ? 'p-3 sm:p-4'
            : heroScale === 'expanded'
            ? 'p-4 sm:p-7'
            : 'p-3.5 sm:p-5';
        const heroTitleSizeClass =
          heroScale === 'compact'
            ? 'text-base sm:text-xl font-black'
            : heroScale === 'expanded'
            ? 'text-lg sm:text-3xl xl:text-4xl font-black'
            : 'text-base sm:text-2xl xl:text-3xl font-black';

        return (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-3.5 sm:gap-5 items-stretch">
            {showPortrait && (
              <div className="hidden xl:block xl:col-span-1 h-full">
                <CrextioCard
                  glowColor="rgba(16, 185, 129, 0.3)"
                  className={`relative h-full ${portraitHeightClass} w-full rounded-[28px] overflow-hidden shadow-md border border-stone-200/90 group`}
                >
                  <img
                    src={heroPortraitSrc}
                    alt="پرتره دانش‌آموخته"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A1A14] via-[#0A1A14]/60 to-transparent flex items-end p-5 text-white">
                    <div className="w-full space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-1 mb-1">
                            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                            <span className="text-[10px] font-bold text-amber-300">
                              {crextioConfig.heroPortraitBadgeText || 'عضو رسمی مجمع'}
                            </span>
                          </div>
                          <h3 className="text-base sm:text-lg font-black text-white">{currentUser?.fullName}</h3>
                          <p className="text-emerald-300 text-xs font-semibold">{currentUser?.roleTitle}</p>
                        </div>

                        <span className="px-3 py-1 rounded-full bg-emerald-500/30 border border-emerald-400/50 text-emerald-200 text-[11px] font-black backdrop-blur-md shadow-xs">
                          {isAlumni
                            ? crextioConfig.heroPortraitRoleLabelAlumni || 'دانش‌آموخته'
                            : crextioConfig.heroPortraitRoleLabelStaff || 'مسئول خدمات'}
                        </span>
                      </div>

                      {heroScale !== 'compact' && (
                        <div className="pt-2 border-t border-white/15 flex items-center justify-between text-[11px] text-emerald-100 font-medium">
                          <span>{currentUser?.organization}</span>
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />{' '}
                            {crextioConfig.heroPortraitVerifiedText || 'تایید شده'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </CrextioCard>
              </div>
            )}

            {crextioConfig.showHeroBanner !== false && (
              <div className={`${showPortrait ? 'xl:col-span-3' : 'xl:col-span-4'} h-full`}>
                <CrextioCard
                  glowColor="rgba(16, 185, 129, 0.20)"
                  className={`h-full rounded-2xl sm:rounded-[28px] ${heroPaddingClass} border border-[#E3E0D3] bg-[#FCFCF9]/95 backdrop-blur-2xl shadow-md flex flex-col justify-between`}
                >
                  <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-3.5 sm:gap-4">
                    <div className="space-y-2.5 max-w-2xl">
                      {/* Compact Mobile-First Portrait Strip (Visible on < xl so welcome hero & KPIs stay above the fold) */}
                      {showPortrait && (
                        <div className="flex xl:hidden items-center justify-between gap-3 p-2.5 rounded-2xl bg-gradient-to-l from-emerald-950 via-[#0E241C] to-emerald-900 text-white shadow-xs">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={heroPortraitSrc}
                              alt="پرتره دانش‌آموخته"
                              referrerPolicy="no-referrer"
                              className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover object-top border border-emerald-400/40 shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1 text-[10px] font-bold text-amber-300">
                                <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                                <span className="truncate">{crextioConfig.heroPortraitBadgeText || 'عضو رسمی مجمع'}</span>
                              </div>
                              <h3 className="text-xs sm:text-sm font-black text-white truncate">
                                {currentUser?.fullName}
                              </h3>
                              <p className="text-[11px] text-emerald-300 font-medium truncate">
                                {currentUser?.roleTitle}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/25 border border-emerald-400/40 text-emerald-200 text-[10px] font-black">
                              {isAlumni
                                ? crextioConfig.heroPortraitRoleLabelAlumni || 'دانش‌آموخته'
                                : crextioConfig.heroPortraitRoleLabelStaff || 'مسئول خدمات'}
                            </span>
                            <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              {crextioConfig.heroPortraitVerifiedText || 'تایید شده'}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-stone-600 font-semibold">
                        <span className="text-amber-700 font-extrabold flex items-center gap-1">
                          <Scale className="w-3.5 h-3.5" />
                          {crextioConfig.heroSchemeLabel || 'طرح میزان'}
                        </span>
                        <span>·</span>
                        <span className="text-emerald-800 truncate max-w-[200px] sm:max-w-none">
                          {crextioConfig.heroDomainLabel ||
                            (isAlumni ? 'مجمع نخبگان دانش‌آموختگان فقه و قضا' : 'درگاه مدیریت و کارتابل خدمات')}
                        </span>
                        <span className="hidden sm:inline">·</span>
                        <span className="hidden sm:inline">دوره {toPersianNumbers(currentUser?.graduationYear || '۱۳۹۵')}</span>
                      </div>

                      <div>
                        <h1 className={`${heroTitleSizeClass} text-stone-900 leading-snug tracking-tight`}>
                          {welcomeTitle}
                        </h1>
                        <p className="text-[11px] sm:text-xs text-stone-600 mt-1 sm:mt-1.5 leading-relaxed font-medium line-clamp-2 sm:line-clamp-none">
                          {welcomeSubtitle}
                        </p>
                      </div>

                      {rightSlotMode === 'both' && showQuickSlot && (
                        <div className="pt-1 flex items-center gap-2 overflow-x-auto scrollbar-none pb-0.5 sm:flex-wrap sm:overflow-visible">
                          {configuredQuickBtns.map(btn => {
                            const QIcon = getQuickBtnIcon(btn.targetNav);
                            return (
                              <button
                                key={btn.id}
                                onClick={() => onNavigateTab?.(btn.targetNav)}
                                className="flex items-center gap-1.5 px-3 py-2 sm:py-1.5 min-h-[40px] sm:min-h-0 rounded-xl bg-white hover:bg-emerald-50 text-stone-800 hover:text-emerald-950 border border-stone-200/90 text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
                              >
                                <QIcon className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                                <span>{btn.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Right Slot: Quick Actions Only, Stats Only, Both (Stats on Right), or None */}
                    {(isAdmin || showStatsSlot || (rightSlotMode === 'quick_actions' && showQuickSlot)) && (
                      <div className="flex flex-col gap-2 shrink-0">
                        {isAdmin && (
                          <div className="flex justify-start sm:justify-end gap-1.5 flex-wrap">
                            {showStatsSlot && (
                              <button
                                type="button"
                                onClick={() => setIsHeroStatsModalOpen(true)}
                                className="px-2.5 py-1.5 min-h-[34px] rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-900 border border-amber-500/30 text-[10px] font-black flex items-center gap-1 transition-all cursor-pointer"
                              >
                                <Sliders className="w-3 h-3 text-amber-700" />
                                <span>مدیریت آمار بنر</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setStudioInitialTab('hero_quick');
                                setIsStudioOpen(true);
                              }}
                              className="px-2.5 py-1.5 min-h-[34px] rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-950 border border-emerald-500/30 text-[10px] font-black flex items-center gap-1 transition-all cursor-pointer"
                            >
                              <Palette className="w-3 h-3 text-emerald-700" />
                              <span>آمار / دسترسی سریع</span>
                            </button>
                          </div>
                        )}

                        {rightSlotMode === 'quick_actions' && showQuickSlot ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {configuredQuickBtns.map(btn => {
                              const QIcon = getQuickBtnIcon(btn.targetNav);
                              return (
                                <button
                                  key={btn.id}
                                  type="button"
                                  onClick={() => onNavigateTab?.(btn.targetNav)}
                                  className="px-3 py-2.5 min-h-[44px] rounded-2xl bg-white hover:bg-emerald-50 text-stone-800 hover:text-emerald-950 border border-[#E7E4D8] shadow-2xs flex items-center gap-2 text-xs font-extrabold transition-all active:scale-95 cursor-pointer"
                                >
                                  <span className="p-1.5 rounded-xl bg-emerald-50 text-emerald-800 shrink-0">
                                    <QIcon className="w-3.5 h-3.5" />
                                  </span>
                                  <span className="truncate">{btn.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          showStatsSlot && (
                            <div
                              className={`grid grid-cols-2 sm:grid-cols-4 ${
                                heroScale === 'compact' ? 'gap-2' : 'gap-2 sm:gap-2.5'
                              } shrink-0`}
                            >
                              {heroStats.map(stat => {
                                const Icon = getStatIconComponent(stat.icon);
                                return (
                                  <CrextioCard
                                    key={stat.id}
                                    glowColor="rgba(245, 158, 11, 0.25)"
                                    className={`bg-white/95 ${
                                      heroScale === 'compact' ? 'p-2.5' : 'p-2.5 sm:p-3.5'
                                    } rounded-2xl border border-[#E7E4D8] shadow-2xs flex flex-col items-center justify-center text-center space-y-1 group`}
                                  >
                                    <div
                                      className={`${
                                        heroScale === 'compact' ? 'p-1.5' : 'p-1.5 sm:p-2'
                                      } rounded-xl ${stat.color} mx-auto`}
                                    >
                                      <Icon className="w-3.5 h-3.5" />
                                    </div>
                                    <span className="text-[10px] font-extrabold text-stone-600 line-clamp-1 block">
                                      {stat.label}
                                    </span>
                                    <span
                                      className={`${
                                        heroScale === 'compact' ? 'text-base' : 'text-lg sm:text-xl'
                                      } font-black text-stone-900 tracking-tight block tabular-nums`}
                                    >
                                      <AnimatedCounter
                                        value={toPersianNumbers(stat.val.toLocaleString('fa-IR'))}
                                        duration={1500}
                                      />
                                    </span>
                                  </CrextioCard>
                                );
                              })}
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                </CrextioCard>
              </div>
            )}
          </div>
        );
      }

      case 'honors_showcase':
        if (crextioConfig.showHonorsShowcase === false) return null;
        return (
          <HonorsShowcase
            span={span}
            scale={scale}
            isAdmin={isAdmin}
            onNavigateTab={onNavigateTab}
            onOpenEditor={() => {
              setStudioInitialTab('honors_unified');
              setIsStudioOpen(true);
            }}
          />
        );

      case 'unified_showcase':
        if (crextioConfig.showUnifiedShowcase === false) return null;
        return (
          <UnifiedShowcaseHub
            span={span}
            scale={scale}
            isAdmin={isAdmin}
            onNavigateTab={onNavigateTab}
            onOpenEditor={() => {
              setStudioInitialTab('honors_unified');
              setIsStudioOpen(true);
            }}
          />
        );

      case 'rulings_showcase':
        if (crextioConfig.showRulingsShowcase === false) return null;
        if (density === 'minimal') {
          const ov = crextioConfig.minimalBoxOverrides?.rulings_showcase;
          return (
            <MinimalShowcaseCard
              kicker={ov?.kicker || 'مباحثات تخصصی قضایی'}
              title={ov?.title || crextioConfig.rulingsShowcaseTitle || 'تالار نقد و مباحثه آراء قضایی'}
              description={
                ov?.description ||
                'بررسی استدلال‌های حقوقی، نقد رویه قضایی و تبادل نظر نخبگان بر روی آراء منتخب.'
              }
              icon={<Scale className="w-5 h-5" />}
              accentTone="amber"
              imageUrl={resolvedBoxImg}
              showImage={shouldShowBoxImg}
              scale={scale}
              stats={[
                { label: 'آراء در جریان بحث', value: toPersianNumbers(rulings.length) },
              ]}
              actions={[
                {
                  label: ov?.ctaLabel || 'ورود به تالار آراء',
                  onClick: () => onNavigateTab?.('Rulings'),
                  primary: true,
                },
              ]}
            />
          );
        }
        return (
          <div className={scale === 'compact' ? 'origin-top scale-[0.98]' : ''}>
            <CrextioRulingsShowcase onNavigateToRulings={() => onNavigateTab?.('Rulings')} />
          </div>
        );

      case 'research_promo':
        if (crextioConfig.showResearchPromoShowcase === false) return null;
        if (density === 'minimal') {
          const ov = crextioConfig.minimalBoxOverrides?.research_promo;
          return (
            <MinimalShowcaseCard
              kicker={ov?.kicker || 'حمایت و هدایت پژوهشی'}
              title={ov?.title || crextioConfig.researchPromoTitle || 'راهبری پژوهش‌ها، رساله‌ها و پایان‌نامه‌ها'}
              description={
                ov?.description ||
                'همراهی با اساتید راهنمای طراز اول، تخصیص گرنت پژوهشی و تسهیل اسکان علمی برای پیشبرد پژوهش‌ها.'
              }
              icon={<Compass className="w-5 h-5" />}
              accentTone="emerald"
              imageUrl={resolvedBoxImg}
              showImage={shouldShowBoxImg}
              scale={scale}
              stats={[
                { label: 'پژوهش‌های فعال', value: toPersianNumbers(researchMentorships.length) },
                { label: 'گرنت تا سقف', value: '۵۰ میلیون' },
              ]}
              actions={[
                {
                  label: ov?.ctaLabel || 'میز راهبری پژوهش',
                  onClick: () => onNavigateTab?.('Research'),
                  primary: true,
                },
              ]}
            />
          );
        }
        return (
          <div className={scale === 'compact' ? 'origin-top scale-[0.98]' : ''}>
            <ResearchPromoShowcase onNavigateToResearch={() => onNavigateTab?.('Research')} />
          </div>
        );

      case 'course_showcase':
        if (crextioConfig.showCourseShowcase === false) return null;
        if (density === 'minimal') {
          const ov = crextioConfig.minimalBoxOverrides?.course_showcase;
          return (
            <MinimalShowcaseCard
              kicker={ov?.kicker || 'توانمندسازی علمی و کارگاه‌ها'}
              title={ov?.title || crextioConfig.courseShowcaseTitle || 'دوره‌ها و کارگاه‌های تخصصی'}
              description={
                ov?.description ||
                'نشست‌ها و دوره‌های مهارتی فقه القضا، آیین دادرسی و کارگاه‌های علمی دانش‌آموختگان.'
              }
              icon={<GraduationCap className="w-5 h-5" />}
              accentTone="sky"
              imageUrl={resolvedBoxImg}
              showImage={shouldShowBoxImg}
              scale={scale}
              stats={[
                { label: 'دوره فعال', value: toPersianNumbers(courses.length) },
              ]}
              actions={[
                {
                  label: ov?.ctaLabel || 'مشاهده دوره‌ها',
                  onClick: () => onNavigateTab?.('Courses'),
                  primary: true,
                },
              ]}
            />
          );
        }
        return (
          <div className={scale === 'compact' ? 'origin-top scale-[0.98]' : ''}>
            <CourseShowcase
              courses={courses}
              mode={crextioConfig.courseShowcaseMode || 'carousel'}
              onSelectCourse={() => onNavigateTab?.('Courses')}
            />
          </div>
        );

      case 'counseling_promo':
        if (crextioConfig.showCounselingPromo === false) return null;
        if (density === 'minimal') {
          const ov = crextioConfig.minimalBoxOverrides?.counseling_promo;
          return (
            <MinimalShowcaseCard
              kicker={ov?.kicker || 'هدایت شغلی، علمی و سلامت روان'}
              title={ov?.title || crextioConfig.counselingPromoTitle || 'خدمات مشاوره نخبگان'}
              description={
                ov?.description ||
                'دریافت نوبت محرمانه مشاوره تخصصی قضایی-تحصیلی و مشاوره عمومی خانواده با اساتید برجسته.'
              }
              icon={<HeartHandshake className="w-5 h-5" />}
              accentTone="indigo"
              imageUrl={resolvedBoxImg}
              showImage={shouldShowBoxImg}
              scale={scale}
              stats={[
                { label: 'مشاور و استاد راهنما', value: toPersianNumbers(consultants.length) },
              ]}
              actions={[
                { label: 'مشاوره عمومی', onClick: () => onNavigateTab?.('CounselingGeneral') },
                {
                  label: ov?.ctaLabel || 'مشاوره شغلی قضا',
                  onClick: () => onNavigateTab?.('SpecializedCounseling'),
                  primary: true,
                },
              ]}
            />
          );
        }
        return (
          <div className={scale === 'compact' ? 'origin-top scale-[0.98]' : ''}>
            <CounselingPromoShowcase
              onNavigateToGeneral={() => onNavigateTab?.('CounselingGeneral')}
              onNavigateToSpecialized={() => onNavigateTab?.('SpecializedCounseling')}
            />
          </div>
        );

      case 'counseling_general_showcase':
        if (crextioConfig.showCounselingGeneralShowcase === false) return null;
        if (density === 'minimal') {
          const ov = crextioConfig.minimalBoxOverrides?.counseling_general_showcase;
          const generalCount = consultants.filter(c => c.counselingType !== 'specialized_career').length;
          return (
            <MinimalShowcaseCard
              kicker={
                ov?.kicker ||
                crextioConfig.counselingGeneralShowcaseBadge ||
                'سلامت روان، خانواده و تاب‌آوری'
              }
              title={
                ov?.title ||
                crextioConfig.counselingGeneralShowcaseTitle ||
                'خدمات مشاوره عمومی و خانواده'
              }
              description={
                ov?.description ||
                crextioConfig.counselingGeneralShowcaseSubtitle ||
                'دریافت نوبت محرمانه مشاوره خانواده، زوج‌درمانی، پیش از ازدواج و مدیریت استرس شغلی.'
              }
              icon={<HeartHandshake className="w-5 h-5" />}
              accentTone="emerald"
              imageUrl={resolvedBoxImg}
              showImage={shouldShowBoxImg}
              scale={scale}
              stats={[
                { label: 'مشاور خانواده و روان', value: toPersianNumbers(generalCount) },
              ]}
              actions={[
                {
                  label:
                    ov?.ctaLabel ||
                    crextioConfig.counselingGeneralShowcaseBtnText ||
                    'درخواست مشاوره عمومی',
                  onClick: () => onNavigateTab?.('CounselingGeneral'),
                  primary: true,
                },
              ]}
            />
          );
        }
        return (
          <CounselingGeneralShowcase
            span={span}
            scale={scale}
            onNavigateToGeneral={() => onNavigateTab?.('CounselingGeneral')}
            onBookGeneralCounseling={() => {
              if (onBookGeneralCounseling) {
                onBookGeneralCounseling();
              } else {
                onNavigateTab?.('CounselingGeneral');
              }
            }}
            onOpenQuickEdit={() => setQuickEditSectionKey('counseling_general_showcase')}
          />
        );

      case 'welfare_showcase':
        if (density === 'minimal') {
          const ov = crextioConfig.minimalBoxOverrides?.welfare_showcase;
          return (
            <MinimalShowcaseCard
              kicker={ov?.kicker || 'خدمات رفاهی و تسهیلات اعضا'}
              title={ov?.title || crextioConfig.welfareShowcaseTitle || 'رفاهیات، اقامتگاه‌ها و صندوق تعاون'}
              description={
                ov?.description ||
                'ثبت درخواست اسکان زیارتی و پژوهشی در مشهد و قم، تسهیلات قرض‌الحسنه و تعاونی اعضا.'
              }
              icon={<Gift className="w-5 h-5" />}
              accentTone="emerald"
              imageUrl={resolvedBoxImg}
              showImage={shouldShowBoxImg}
              scale={scale}
              actions={[
                {
                  label: ov?.ctaLabel || 'ورود به میز رفاهیات',
                  onClick: () => onNavigateTab?.('Welfare'),
                  primary: true,
                },
              ]}
            />
          );
        }
        return (
          <div className={scale === 'compact' ? 'origin-top scale-[0.98]' : ''}>
            <WelfareAndLoansShowcase onNavigateToWelfare={() => onNavigateTab?.('Welfare')} />
          </div>
        );

      case 'multimedia_showcase':
        if (density === 'minimal') {
          const ov = crextioConfig.minimalBoxOverrides?.multimedia_showcase;
          return (
            <MinimalShowcaseCard
              kicker={ov?.kicker || 'آرشیو علمی و درس‌گفتارها'}
              title={ov?.title || crextioConfig.multimediaShowcaseTitle || 'آرشیو صوت و تصویر درس‌گفتارها'}
              description={
                ov?.description ||
                'دسترسی به جلسات ضبط‌شده خارج فقه القضا و نشست‌های تحلیل قضایی.'
              }
              icon={<Headphones className="w-5 h-5" />}
              accentTone="stone"
              imageUrl={resolvedBoxImg}
              showImage={shouldShowBoxImg}
              scale={scale}
              actions={[
                {
                  label: ov?.ctaLabel || 'مشاهده آرشیو',
                  onClick: () => onNavigateTab?.('Courses'),
                  primary: true,
                },
              ]}
            />
          );
        }
        return (
          <div className={scale === 'compact' ? 'origin-top scale-[0.98]' : ''}>
            <MultimediaAndCoursesShowcase onNavigateToCourses={() => onNavigateTab?.('Courses')} />
          </div>
        );

      case 'bento_grid':
        return <CrextioServicesBento onNavigateTab={tab => onNavigateTab?.(tab)} />;

      case 'books_showcase':
        if (density === 'minimal') {
          const ov = crextioConfig.minimalBoxOverrides?.books_showcase;
          return (
            <MinimalShowcaseCard
              kicker={ov?.kicker || 'مرکز نشر و رسانه'}
              title={ov?.title || crextioConfig.booksShowcaseTitle || 'کتاب و محصولات چند رسانه‌ای'}
              description={
                ov?.description ||
                'عرضه کتب تخصصی، محصولات چندرسانه‌ای و صوت با انتخاب نسخه دیجیتال یا فیزیکی.'
              }
              icon={<BookMarked className="w-5 h-5" />}
              accentTone="amber"
              imageUrl={resolvedBoxImg}
              showImage={shouldShowBoxImg}
              scale={scale}
              stats={[{ label: 'اثر ثبت‌شده', value: toPersianNumbers(products.length) }]}
              actions={[
                {
                  label: ov?.ctaLabel || 'ورود به کتاب و محصولات چند رسانه‌ای',
                  onClick: () => onNavigateTab?.('Products'),
                  primary: true,
                },
              ]}
            />
          );
        }
        return (
          <div className={scale === 'compact' ? 'origin-top scale-[0.98]' : ''}>
            <BooksAndPublicationsShowcase onNavigateToProducts={() => onNavigateTab?.('Products')} />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.25 }}
      className="w-full space-y-4 sm:space-y-6 text-stone-900 font-sans"
    >
      {/* QUICK NOTIFICATION TOAST */}
      <AnimatePresence>
        {quickServiceSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-4 inset-x-3 sm:inset-x-auto sm:top-6 sm:left-1/2 sm:-translate-x-1/2 z-50 bg-emerald-900 text-white px-4 sm:px-6 py-3 sm:py-3.5 rounded-2xl shadow-2xl border border-emerald-400/40 flex items-center gap-3 text-xs sm:text-sm font-bold"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
            <span>{quickServiceSuccess}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ADMIN THEME & LAYOUT CUSTOMIZER LAUNCHER BAR */}
      {isAdmin && (
        <div className="w-full bg-stone-900 text-white rounded-2xl p-3 sm:p-3.5 sm:px-5 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 sm:gap-3 border border-stone-800 shadow-sm">
          <div className="flex items-center gap-2.5 sm:gap-3 w-full lg:w-auto">
            <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
              <Sliders className="w-4 h-4" />
            </span>
            <div className="text-right min-w-0">
              <span className="text-xs sm:text-sm font-bold text-white block truncate">
                کنترل چیدمان ویترین‌ها، تغییر سایز و نمای مینیمال
              </span>
              <span className="hidden sm:block text-[11px] text-stone-400">
                جابه‌جایی با کشیدن و رها کردن، نصف‌عرض کردن ویترین‌ها در یک ردیف یا شخصی‌سازی کامل صفحه
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full lg:w-auto shrink-0">
            <button
              type="button"
              onClick={() => {
                setStudioInitialTab('hero_quick');
                setIsStudioOpen(true);
              }}
              className="flex items-center justify-center gap-1.5 px-3 py-2 min-h-[40px] rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-[11px] sm:text-xs font-black transition-all cursor-pointer shadow-sm"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">ویرایشگر کامل</span>
            </button>

            <button
              type="button"
              onClick={() => setIsLayoutEditMode(prev => !prev)}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 min-h-[40px] rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
                isLayoutEditMode
                  ? 'bg-emerald-400 text-stone-950 shadow-md'
                  : 'bg-stone-800 hover:bg-stone-700 text-stone-100 border border-stone-700'
              }`}
            >
              {isLayoutEditMode ? <Check className="w-3.5 h-3.5 shrink-0" /> : <Move className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
              <span className="truncate">{isLayoutEditMode ? 'اتمام ویرایش' : 'ویرایش چیدمان'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCustomizerOpen(true)}
              className="col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-[11px] sm:text-xs font-black transition-all cursor-pointer"
            >
              <Palette className="w-3.5 h-3.5 shrink-0" />
              <span>تنظیمات پیشرفته</span>
            </button>
          </div>
        </div>
      )}

      {/* Quick Layout Edit Guidance Banner */}
      {isAdmin && isLayoutEditMode && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-bold">
            <GripVertical className="w-4 h-4 text-amber-700" />
            <span>
              حالت ویرایش زنده چیدمان: هر ویترین، ویجت وضعیت یا تقویم رویدادها را با درگ یا فلش بالا/پایین جابه‌جا کنید و اندازه آن‌ها را تنظیم نمایید.
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() =>
                updateCrextioConfig({
                  showShowcaseImagesInMinimal: !globalMinimalImages,
                })
              }
              className={`px-3 py-1.5 rounded-xl font-bold text-[11px] flex items-center gap-1.5 cursor-pointer border ${
                globalMinimalImages
                  ? 'bg-stone-900 text-amber-300 border-stone-900'
                  : 'bg-white text-stone-700 border-stone-300'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>{globalMinimalImages ? 'عکس باکس‌های ساده: فعال' : 'عکس باکس‌های ساده: غیرفعال'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                updateCrextioConfig({
                  dashboardSectionLayouts: {
                    ...layoutsMap,
                    research_promo: { ...(layoutsMap.research_promo || {}), span: 'half', density: 'minimal' },
                    course_showcase: { ...(layoutsMap.course_showcase || {}), span: 'half', density: 'minimal' },
                  },
                });
              }}
              className="px-3 py-1.5 rounded-xl bg-emerald-800 text-white font-bold text-[11px] hover:bg-emerald-900 cursor-pointer"
            >
              دوره + پژوهش در یک خط (نصف‌عرض ساده)
            </button>
            <button
              type="button"
              onClick={() =>
                updateCrextioConfig({
                  dashboardSectionOrder: [...CANONICAL_DASHBOARD_SECTION_ORDER],
                  hiddenDashboardSections: {},
                  dashboardSectionLayouts: { ...DEFAULT_CREXTIO_CONFIG.dashboardSectionLayouts },
                })
              }
              className="px-3 py-1.5 rounded-xl bg-white border border-amber-300 text-amber-900 font-bold text-[11px] hover:bg-amber-100 cursor-pointer"
            >
              بازنشانی چیدمان
            </button>
          </div>
        </div>
      )}

      {/* ADMIN WIDGETS TOOLBAR & ALUMNI PREVIEW SWITCHER (Pinned cleanly outside movable grid) */}
      {isRealAdmin && (
        <DashboardWidgetsSuite
          renderMode="admin_bar"
          onNavigateTab={onNavigateTab}
        />
      )}

      {/* Reform 56: Alumni Profile Completion Percentage Widget & My Identity Card Modal */}
      <AlumniProfileCompletionWidget onOpenIdentityCard={() => setIsIdentityCardOpen(true)} />
      <AlumniIdentityCardModal isOpen={isIdentityCardOpen} onClose={() => setIsIdentityCardOpen(false)} />

      {/* DYNAMIC 12-COLUMN DASHBOARD SECTIONS GRID (Includes Movable Status Widget, Events Calendar, Banners & All Showcases) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-5 items-stretch">
        {sectionOrder.map((sectionKey, sectionIdx) => {
          const isHidden = hiddenMap[sectionKey] === true;
          if (isHidden && !isLayoutEditMode) return null;

          const layout = layoutsMap[sectionKey] || {
            span: sectionKey === 'status_widget' || sectionKey === 'events_calendar' ? 'half' : 'full',
            density: 'full',
            scale: 'normal',
            showImage: true,
          };
          const canResize =
            sectionKey !== 'top_vip_row' &&
            sectionKey !== 'bento_grid' &&
            sectionKey !== 'dashboard_banners';
          const canScaleHeight =
            sectionKey !== 'bento_grid' && sectionKey !== 'dashboard_banners';
          const hasClassicMinimalToggle = CLASSIC_MINIMAL_KEYS.has(sectionKey);
          const span: 'full' | 'half' = layout.span === 'half' && canResize ? 'half' : 'full';
          const density: 'full' | 'minimal' =
            hasClassicMinimalToggle && layout.density === 'minimal' ? 'minimal' : 'full';
          const scale: 'micro' | 'compact' | 'normal' | 'expanded' =
            sectionKey === 'top_vip_row'
              ? crextioConfig.heroBannerScale || layout.scale || 'normal'
              : sectionKey === 'counseling_general_showcase'
              ? generalShowcase.showcaseScale || layout.scale || 'normal'
              : layout.scale || 'normal';
          const boxShowImage = layout.showImage !== false;

          const content = renderSectionContent(sectionKey, density, span, scale, boxShowImage);
          if (!content && !isLayoutEditMode) return null;

          const colClass = span === 'half' ? 'lg:col-span-6' : 'lg:col-span-12';

          return (
            <div
              key={sectionKey}
              draggable={isLayoutEditMode}
              onDragStart={() => isLayoutEditMode && setDraggedKey(sectionKey)}
              onDragOver={e => {
                if (!isLayoutEditMode) return;
                e.preventDefault();
                setDragOverKey(sectionKey);
              }}
              onDragLeave={() => setDragOverKey(null)}
              onDrop={() => isLayoutEditMode && handleDropOnSection(sectionKey)}
              onDragEnd={() => {
                setDraggedKey(null);
                setDragOverKey(null);
              }}
              className={`${colClass} flex flex-col transition-all ${
                isLayoutEditMode
                  ? `rounded-3xl border-2 border-dashed p-2 ${
                      dragOverKey === sectionKey
                        ? 'border-emerald-600 bg-emerald-50/40'
                        : 'border-amber-400/70 bg-amber-50/20'
                    } ${isHidden ? 'opacity-45' : ''}`
                  : ''
              }`}
            >
              {/* Inline Edit Bar when Layout Edit Mode is Active */}
              {isLayoutEditMode && (
                <div className="mb-2 px-3 py-1.5 rounded-2xl bg-stone-900 text-white flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold">
                  <div className="flex items-center gap-2 cursor-grab active:cursor-grabbing">
                    <GripVertical className="w-4 h-4 text-amber-400" />
                    <span>{SECTION_LABELS[sectionKey] || sectionKey}</span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {canResize && (
                      <button
                        type="button"
                        onClick={() =>
                          updateSectionLayout(sectionKey, { span: span === 'half' ? 'full' : 'half' })
                        }
                        className={`px-2 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-colors ${
                          span === 'half' ? 'bg-indigo-500 text-white' : 'bg-stone-800 hover:bg-stone-700 text-stone-200'
                        }`}
                      >
                        <Columns2 className="w-3 h-3" />
                        <span>{span === 'half' ? 'کوچک (۱/۲)' : 'بزرگ (تمام‌عرض)'}</span>
                      </button>
                    )}

                    {canScaleHeight && (
                      <select
                        value={scale}
                        onChange={e => {
                          const nextScale = e.target.value as 'micro' | 'compact' | 'normal' | 'expanded';
                          if (sectionKey === 'top_vip_row') {
                            updateCrextioConfig({
                              heroBannerScale: nextScale,
                              dashboardSectionLayouts: {
                                ...layoutsMap,
                                [sectionKey]: { ...(layoutsMap[sectionKey] || {}), scale: nextScale },
                              },
                            });
                          } else if (sectionKey === 'counseling_general_showcase') {
                            updateSectionLayout(sectionKey, { scale: nextScale });
                            updateGeneralShowcase({ showcaseScale: nextScale });
                          } else {
                            updateSectionLayout(sectionKey, { scale: nextScale });
                          }
                        }}
                        className="px-2 py-1 rounded-lg bg-stone-800 text-stone-100 border border-stone-700 text-[10px] font-bold cursor-pointer"
                        title="اندازه و ارتفاع باکس"
                      >
                        <option value="micro">سایز: خیلی کوچک (مینی)</option>
                        <option value="compact">سایز: فشرده</option>
                        <option value="normal">سایز: استاندارد</option>
                        <option value="expanded">سایز: بزرگ</option>
                      </select>
                    )}

                    {sectionKey === 'top_vip_row' && (
                      <button
                        type="button"
                        onClick={() =>
                          updateCrextioConfig({
                            showHeroPortrait: crextioConfig.showHeroPortrait === false,
                          })
                        }
                        className={`px-2 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-colors ${
                          crextioConfig.showHeroPortrait !== false
                            ? 'bg-sky-500/25 text-sky-200 border border-sky-400/30'
                            : 'bg-stone-800 text-stone-400'
                        }`}
                      >
                        <ImageIcon className="w-3 h-3" />
                        <span>{crextioConfig.showHeroPortrait !== false ? 'پرتره: روشن' : 'پرتره: خاموش'}</span>
                      </button>
                    )}

                    {hasClassicMinimalToggle && (
                      <button
                        type="button"
                        onClick={() =>
                          updateSectionLayout(sectionKey, {
                            density: density === 'minimal' ? 'full' : 'minimal',
                          })
                        }
                        className={`px-2 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-colors ${
                          density === 'minimal'
                            ? 'bg-emerald-500 text-stone-950 font-black'
                            : 'bg-amber-500/20 text-amber-200 border border-amber-500/30 hover:bg-amber-500/30'
                        }`}
                      >
                        {density === 'minimal' ? (
                          <Minimize2 className="w-3 h-3" />
                        ) : (
                          <Maximize2 className="w-3 h-3" />
                        )}
                        <span>{density === 'minimal' ? 'طراحی ساده' : 'طراحی کلاسیک قبلی'}</span>
                      </button>
                    )}

                    {hasClassicMinimalToggle && density === 'minimal' && (
                      <button
                        type="button"
                        onClick={() => updateSectionLayout(sectionKey, { showImage: !boxShowImage })}
                        className={`px-2 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-colors ${
                          boxShowImage
                            ? 'bg-sky-500/25 text-sky-200 border border-sky-400/30'
                            : 'bg-stone-800 text-stone-400'
                        }`}
                      >
                        <ImageIcon className="w-3 h-3" />
                        <span>{boxShowImage ? 'عکس: روشن' : 'عکس: خاموش'}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setQuickEditSectionKey(sectionKey)}
                      className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-stone-950 font-black flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                      title="ویرایش متن، عنوان و تصویر این ویترین"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>ویرایش متن و عکس</span>
                    </button>

                    <button
                      type="button"
                      disabled={sectionIdx === 0}
                      onClick={() => moveSectionByOffset(sectionKey, -1)}
                      className="p-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 disabled:opacity-30 cursor-pointer"
                      title="انتقال به بالا"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      disabled={sectionIdx === sectionOrder.length - 1}
                      onClick={() => moveSectionByOffset(sectionKey, 1)}
                      className="p-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 disabled:opacity-30 cursor-pointer"
                      title="انتقال به پایین"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleHideSection(sectionKey)}
                      className={`px-2 py-1 rounded-lg flex items-center gap-1 cursor-pointer ${
                        isHidden ? 'bg-amber-400 text-stone-950' : 'bg-stone-800 hover:bg-rose-600 text-stone-200'
                      }`}
                    >
                      <EyeOff className="w-3 h-3" />
                      <span>{isHidden ? 'نمایش مجدد' : 'مخفی'}</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="flex-1">{content}</div>
            </div>
          );
        })}
      </div>

      {/* THEME 2 LIVE FULL-PAGE STUDIO DRAWER */}
      <Theme2StudioDrawer
        isOpen={isStudioOpen && isAdmin}
        initialTab={studioInitialTab}
        onClose={() => setIsStudioOpen(false)}
        onOpenAdvancedModal={() => setIsCustomizerOpen(true)}
        crextioConfig={crextioConfig}
        updateCrextioConfig={updateCrextioConfig}
      />

      {/* ADMIN LIVE CUSTOMIZER MODAL */}
      <Suspense fallback={null}>
        <ThemeCustomizerModal
          isOpen={isCustomizerOpen && isAdmin}
          onClose={() => setIsCustomizerOpen(false)}
        />
      </Suspense>

      {/* ADMIN HERO STATS CUSTOMIZER MODAL */}
      <CrextioHeroStatsCustomizerModal
        isOpen={isHeroStatsModalOpen && isAdmin}
        onClose={() => setIsHeroStatsModalOpen(false)}
      />

      {/* DIRECT PER-SHOWCASE QUICK EDIT MODAL (FROM LAYOUT EDIT MODE TOOLBAR) */}
      <ShowcaseQuickEditModal
        sectionKey={isAdmin ? quickEditSectionKey : null}
        sectionLabel={
          (quickEditSectionKey && SECTION_LABELS[quickEditSectionKey]) ||
          quickEditSectionKey ||
          ''
        }
        currentDensity={
          quickEditSectionKey &&
          CLASSIC_MINIMAL_KEYS.has(quickEditSectionKey) &&
          layoutsMap[quickEditSectionKey]?.density === 'minimal'
            ? 'minimal'
            : 'full'
        }
        hasClassicMinimalToggle={
          Boolean(quickEditSectionKey && CLASSIC_MINIMAL_KEYS.has(quickEditSectionKey))
        }
        crextioConfig={crextioConfig}
        updateCrextioConfig={updateCrextioConfig}
        onClose={() => setQuickEditSectionKey(null)}
        onOpenStudioTab={tab => {
          setStudioInitialTab(tab);
          setIsStudioOpen(true);
        }}
        onSavedToast={msg => {
          setQuickServiceSuccess(msg);
          setTimeout(() => setQuickServiceSuccess(null), 3500);
        }}
      />
    </motion.div>
  );
};
