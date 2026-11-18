import React, { useState, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { toPersianNumbers } from '../../utils/persianNumbers';
import {
  canViewSection,
  useRbacPolicies,
  getRoleMetadata,
  isOrganizationalRole,
} from '../../utils/rbacPolicy';
import { AppSectionId, Theme3CustomizationConfig } from '../../types';
import { resolveShowcaseImageUrl } from '../../data/showcaseImages';
import { MinimalShowcaseCard } from '../crextio/MinimalShowcaseCard';
import { HonorsShowcase } from '../crextio/HonorsShowcase';
import { UnifiedShowcaseHub } from '../crextio/UnifiedShowcaseHub';
import { CourseShowcase } from '../crextio/CourseShowcase';
import { ResearchPromoShowcase } from '../crextio/ResearchPromoShowcase';
import { CrextioRulingsShowcase } from '../crextio/CrextioRulingsShowcase';
import { CounselingPromoShowcase } from '../crextio/CounselingPromoShowcase';
import { WelfareAndLoansShowcase } from '../crextio/WelfareAndLoansShowcase';
import { MultimediaAndCoursesShowcase } from '../crextio/MultimediaAndCoursesShowcase';
import { BooksAndPublicationsShowcase } from '../crextio/BooksAndPublicationsShowcase';
import { Theme3StudioDrawer } from './Theme3StudioDrawer';
import { ModuleFallback } from '../common/ModuleFallback';
import { CrextioSubViews } from '../crextio/CrextioSubViews';
import { FinanceSection } from '../finance/FinanceSection';
import { UserManagementModule } from '../admin/UserManagementModule';
import { DashboardWidgetsSuite } from '../dashboard/DashboardWidgetsSuite';
import {
  Scale,
  Inbox,
  Users2,
  Compass,
  HeartHandshake,
  GraduationCap,
  Gift,
  BookOpen,
  ShieldCheck,
  Users,
  Wallet,
  LogOut,
  Plus,
  ArrowLeft,
  ChevronDown,
  LayoutGrid,
  GripVertical,
  Eye,
  EyeOff,
  Columns2,
  Check,
  Move,
  Palette,
  Image as ImageIcon,
  Headphones,
  BookMarked,
  Maximize2,
  Minimize2,
  Sparkles,
} from 'lucide-react';

const AdminControlCenter = lazy(() =>
  import('../admin/AdminControlCenter').then(m => ({ default: m.AdminControlCenter }))
);
const AlumniDirectorySection = lazy(() =>
  import('../alumni/AlumniDirectorySection').then(m => ({ default: m.AlumniDirectorySection }))
);

interface MinimalThemeLayoutProps {
  onSelectTheme: (theme: 'portal' | 'crextio' | 'minimal') => void;
}

const MINIMAL_SHOWCASE_KEYS = [
  'rulings_showcase',
  'research_promo',
  'course_showcase',
  'counseling_promo',
  'welfare_showcase',
  'multimedia_showcase',
  'books_showcase',
];

const SHOWCASE_LABELS: Record<string, string> = {
  rulings_showcase: 'تالار نقد آراء قضایی',
  research_promo: 'راهبری پژوهش و رساله‌ها',
  course_showcase: 'دوره‌ها و کارگاه‌های علمی',
  counseling_promo: 'خدمات مشاوره نخبگان',
  welfare_showcase: 'تسهیلات و امور رفاهی',
  multimedia_showcase: 'درس‌گفتارها و چندرسانه‌ای',
  books_showcase: 'کتب و منشورات تخصصی',
};

const DEFAULT_BLOCK_ORDER = [
  'hero',
  'widgets',
  'honors_showcase',
  'unified_showcase',
  'operations_split',
  'individual_showcases',
];

const PALETTE_THEMES: Record<
  NonNullable<Theme3CustomizationConfig['palette']>,
  {
    pageBg: string;
    headerBg: string;
    cardBg: string;
    cardBorder: string;
    textPrimary: string;
    textMuted: string;
    accentBtn: string;
    accentText: string;
    ambientGlow: string;
    dark: boolean;
  }
> = {
  emerald_ivory: {
    pageBg: 'bg-[#F5F7F5]',
    headerBg: 'bg-white/90 border-stone-200/80',
    cardBg: 'bg-white',
    cardBorder: 'border-stone-200/90',
    textPrimary: 'text-stone-900',
    textMuted: 'text-stone-600',
    accentBtn: 'bg-emerald-900 hover:bg-emerald-950 text-white',
    accentText: 'text-emerald-900',
    ambientGlow: 'from-emerald-900/[0.06] via-amber-500/[0.04] to-transparent',
    dark: false,
  },
  lapis_parchment: {
    pageBg: 'bg-[#FAF7F0]',
    headerBg: 'bg-[#FFFDFA]/90 border-[#E8E0D2]',
    cardBg: 'bg-[#FFFDFA]',
    cardBorder: 'border-[#E5DDD0]',
    textPrimary: 'text-[#1C1917]',
    textMuted: 'text-[#57534E]',
    accentBtn: 'bg-blue-950 hover:bg-black text-white',
    accentText: 'text-blue-950',
    ambientGlow: 'from-blue-950/[0.05] via-amber-700/[0.05] to-transparent',
    dark: false,
  },
  bronze_graphite: {
    pageBg: 'bg-[#F4F4F5]',
    headerBg: 'bg-white/95 border-zinc-200',
    cardBg: 'bg-white',
    cardBorder: 'border-zinc-200',
    textPrimary: 'text-zinc-900',
    textMuted: 'text-zinc-600',
    accentBtn: 'bg-zinc-900 hover:bg-black text-white',
    accentText: 'text-amber-800',
    ambientGlow: 'from-zinc-900/[0.05] via-amber-600/[0.04] to-transparent',
    dark: false,
  },
  obsidian_emerald: {
    pageBg: 'bg-[#091410]',
    headerBg: 'bg-[#0E1E18]/90 border-[#223B31]',
    cardBg: 'bg-[#11201B]',
    cardBorder: 'border-[#223B31]',
    textPrimary: 'text-stone-100',
    textMuted: 'text-stone-300',
    accentBtn: 'bg-amber-400 hover:bg-amber-300 text-stone-950',
    accentText: 'text-amber-300',
    ambientGlow: 'from-emerald-500/[0.12] via-amber-500/[0.08] to-transparent',
    dark: true,
  },
};

export const MinimalThemeLayout: React.FC<MinimalThemeLayoutProps> = ({ onSelectTheme }) => {
  const {
    currentUser,
    logout,
    switchUserRole,
    cartableRequests,
    synergyPosts,
    rulings,
    courses,
    researchMentorships,
    consultants,
    products,
    productsStoreConfig,
    crextioConfig,
    updateCrextioConfig,
    isAlumniPreview,
    setIsAlumniPreview,
  } = useApp();
  const { rolePolicies } = useRbacPolicies();

  const [activeNav, setActiveNav] = useState<string>('Dashboard');
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [isEditLayout, setIsEditLayout] = useState(false);
  const [draggedKey, setDraggedKey] = useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

  // Studio Drawer State
  const [studioOpen, setStudioOpen] = useState(false);
  const [studioTab, setStudioTab] = useState<'appearance' | 'texts_layout' | 'honors' | 'unified_boxes'>('appearance');

  const isStaff = isOrganizationalRole(currentUser?.role) && !isAlumniPreview;
  const isAdmin =
    (currentUser?.role === 'admin' ||
      currentUser?.role === 'super_admin' ||
      currentUser?.role === 'alumni_manager' ||
      currentUser?.role === 'supervisor') &&
    !isAlumniPreview;

  const currentRoleMeta = getRoleMetadata(currentUser?.role);
  const t3: Theme3CustomizationConfig = crextioConfig.theme3Config || {};
  const palette = PALETTE_THEMES[t3.palette || 'emerald_ivory'];
  const motionEnabled = t3.motionLevel !== 'minimal';
  const radiusClass =
    t3.borderRadius === 'sharp'
      ? 'rounded-xl'
      : t3.borderRadius === 'pill_modern'
      ? 'rounded-3xl'
      : 'rounded-2xl';
  const surfaceStyle =
    t3.cardSurface === 'glass'
      ? palette.dark
        ? 'bg-[#11201B]/80 backdrop-blur-xl'
        : 'bg-white/80 backdrop-blur-xl shadow-xs'
      : t3.cardSurface === 'hairline'
      ? `${palette.cardBg}`
      : `${palette.cardBg} shadow-sm`;

  const allPrimaryNav: Array<{ id: string; sectionId: AppSectionId; label: string }> = [
    { id: 'Dashboard', sectionId: 'dashboard', label: 'میز کار' },
    { id: 'People', sectionId: 'cartable', label: 'کارتابل' },
    { id: 'Synergy', sectionId: 'synergy', label: 'هم‌افزایی' },
    { id: 'Research', sectionId: 'research', label: 'پژوهش' },
    { id: 'Counseling', sectionId: 'counseling', label: 'مشاوره' },
    { id: 'Rulings', sectionId: 'rulings', label: 'تالار آراء' },
  ];
  const primaryNav = allPrimaryNav.filter(item =>
    canViewSection(currentUser, item.sectionId, rolePolicies)
  );

  const allSecondaryNav: Array<{ id: string; sectionId: AppSectionId; label: string; icon: any }> = [
    { id: 'SpecializedCounseling', sectionId: 'counseling', label: 'مشاوره تخصصی قضا', icon: Scale },
    { id: 'Courses', sectionId: 'courses', label: 'دوره‌های آموزشی', icon: GraduationCap },
    { id: 'Welfare', sectionId: 'welfare', label: 'رفاهیات و تسهیلات', icon: Gift },
    { id: 'Products', sectionId: 'products', label: 'کتاب و محصولات چند رسانه‌ای', icon: BookOpen },
    { id: 'Alumni', sectionId: 'alumni', label: 'بانک دانش‌آموختگان', icon: GraduationCap },
    { id: 'Finance', sectionId: 'finance', label: 'امور مالی', icon: Wallet },
    { id: 'Users', sectionId: 'users', label: 'مدیریت کاربران', icon: Users },
    { id: 'Admin', sectionId: 'admin', label: 'پایش و امنیت', icon: ShieldCheck },
  ];
  const secondaryNav = allSecondaryNav.filter(item => {
    if (item.sectionId === 'products' && !isStaff && !productsStoreConfig.isStoreEnabled) {
      return false;
    }
    return canViewSection(currentUser, item.sectionId, rolePolicies);
  });

  const myRecentCartable = (
    isStaff
      ? cartableRequests
      : cartableRequests.filter(r => r.applicantId === currentUser?.id)
  ).slice(0, 4);

  const recentSynergy = synergyPosts.slice(0, 4);

  // Order & layouts synced with crextioConfig in MySQL
  const savedOrder = (crextioConfig.dashboardSectionOrder || []).filter(k =>
    MINIMAL_SHOWCASE_KEYS.includes(k)
  );
  const minimalOrder = [
    ...savedOrder,
    ...MINIMAL_SHOWCASE_KEYS.filter(k => !savedOrder.includes(k)),
  ];
  const hiddenMap = crextioConfig.hiddenDashboardSections || {};
  const layoutsMap = crextioConfig.dashboardSectionLayouts || {};

  const getLayout = (key: string) => {
    const saved = layoutsMap[key];
    return {
      span: (saved?.span || 'half') as 'full' | 'half',
      density: (saved?.density || 'minimal') as 'full' | 'minimal',
      scale: (saved?.scale || 'normal') as 'micro' | 'compact' | 'normal' | 'expanded',
      showImage: saved?.showImage !== false,
    };
  };

  const patchLayout = (
    key: string,
    patch: Partial<{
      span: 'full' | 'half';
      density: 'full' | 'minimal';
      scale: 'micro' | 'compact' | 'normal' | 'expanded';
      showImage: boolean;
    }>
  ) => {
    const cur = getLayout(key);
    updateCrextioConfig({
      dashboardSectionLayouts: {
        ...layoutsMap,
        [key]: { ...cur, ...patch },
      },
    });
  };

  const handleToggleHide = (key: string) => {
    updateCrextioConfig({
      hiddenDashboardSections: {
        ...hiddenMap,
        [key]: !hiddenMap[key],
      },
    });
  };

  const handleDropMinimal = (targetKey: string) => {
    if (!draggedKey || draggedKey === targetKey) {
      setDraggedKey(null);
      setDragOverKey(null);
      return;
    }
    const baseOrder =
      crextioConfig.dashboardSectionOrder && crextioConfig.dashboardSectionOrder.length > 0
        ? [...crextioConfig.dashboardSectionOrder]
        : [...minimalOrder];
    if (!baseOrder.includes(draggedKey)) baseOrder.push(draggedKey);
    if (!baseOrder.includes(targetKey)) baseOrder.push(targetKey);
    const fromIdx = baseOrder.indexOf(draggedKey);
    const toIdx = baseOrder.indexOf(targetKey);
    const [moved] = baseOrder.splice(fromIdx, 1);
    baseOrder.splice(toIdx, 0, moved);
    updateCrextioConfig({ dashboardSectionOrder: baseOrder });
    setDraggedKey(null);
    setDragOverKey(null);
  };

  const renderShowcaseBox = (key: string) => {
    const lay = getLayout(key);
    const showImg =
      crextioConfig.showShowcaseImagesInMinimal !== false && lay.showImage !== false;
    const imgUrl = resolveShowcaseImageUrl(key, crextioConfig.showcaseImageOverrides);

    // Support Classic Full Theme-2 Design OR Minimal New Design inside Theme 3!
    if (lay.density === 'full') {
      switch (key) {
        case 'rulings_showcase':
          return <CrextioRulingsShowcase onNavigateToRulings={() => setActiveNav('Rulings')} />;
        case 'research_promo':
          return <ResearchPromoShowcase onNavigateToResearch={() => setActiveNav('Research')} />;
        case 'course_showcase':
          return (
            <CourseShowcase
              courses={courses}
              mode={crextioConfig.courseShowcaseMode || 'carousel'}
              onSelectCourse={() => setActiveNav('Courses')}
            />
          );
        case 'counseling_promo':
          return (
            <CounselingPromoShowcase
              onNavigateToGeneral={() => setActiveNav('Counseling')}
              onNavigateToSpecialized={() => setActiveNav('SpecializedCounseling')}
            />
          );
        case 'welfare_showcase':
          return <WelfareAndLoansShowcase onNavigateToWelfare={() => setActiveNav('Welfare')} />;
        case 'multimedia_showcase':
          return <MultimediaAndCoursesShowcase onNavigateToCourses={() => setActiveNav('Courses')} />;
        case 'books_showcase':
          return <BooksAndPublicationsShowcase onNavigateToProducts={() => setActiveNav('Products')} />;
      }
    }

    switch (key) {
      case 'rulings_showcase':
        return (
          <MinimalShowcaseCard
            kicker="مباحثه حقوقی"
            title={crextioConfig.rulingsShowcaseTitle || 'تالار نقد و بررسی آراء قضایی'}
            description="تبادل استدلال و نقد مستند بر روی دادنامه‌های منتخب دیوان عالی و تجدیدنظر."
            icon={<Scale className="w-4 h-4" />}
            accentTone="amber"
            imageUrl={imgUrl}
            showImage={showImg}
            scale={lay.scale}
            darkSurface={palette.dark}
            motionEnabled={motionEnabled}
            stats={[{ label: 'رأی ثبت‌شده', value: toPersianNumbers(rulings.length) }]}
            actions={[{ label: 'ورود به تالار', onClick: () => setActiveNav('Rulings'), primary: true }]}
          />
        );
      case 'research_promo':
        return (
          <MinimalShowcaseCard
            kicker="راهبری علمی"
            title={crextioConfig.researchPromoTitle || 'پژوهش‌ها، رساله‌ها و پایان‌نامه‌ها'}
            description="تطبیق با استاد راهنمای طراز اول، گرنت پژوهشی و تسهیل اسکان علمی برای پیشبرد پژوهش‌ها."
            icon={<Compass className="w-4 h-4" />}
            accentTone="emerald"
            imageUrl={imgUrl}
            showImage={showImg}
            scale={lay.scale}
            darkSurface={palette.dark}
            motionEnabled={motionEnabled}
            stats={[{ label: 'پژوهش فعال', value: toPersianNumbers(researchMentorships.length) }]}
            actions={[{ label: 'میز پژوهش', onClick: () => setActiveNav('Research'), primary: true }]}
          />
        );
      case 'course_showcase':
        return (
          <MinimalShowcaseCard
            kicker="آموزش تخصصی"
            title={crextioConfig.courseShowcaseTitle || 'دوره‌ها و کارگاه‌های توانمندسازی'}
            description="نشست‌های علمی فقه القضا، کارگاه‌های رویه‌ای و آرشیو جلسات آموزشی دانش‌آموختگان."
            icon={<GraduationCap className="w-4 h-4" />}
            accentTone="sky"
            imageUrl={imgUrl}
            showImage={showImg}
            scale={lay.scale}
            darkSurface={palette.dark}
            motionEnabled={motionEnabled}
            stats={[{ label: 'دوره فعال', value: toPersianNumbers(courses.length) }]}
            actions={[{ label: 'مشاهده دوره‌ها', onClick: () => setActiveNav('Courses'), primary: true }]}
          />
        );
      case 'counseling_promo':
        return (
          <MinimalShowcaseCard
            kicker="مشاوره محرمانه"
            title={crextioConfig.counselingPromoTitle || 'مشاوره شغلی قضا و سلامت روان'}
            description="دریافت نوبت گفت‌وگو با اساتید راهنمای شغلی و مشاوران خانواده و تاب‌آوری."
            icon={<HeartHandshake className="w-4 h-4" />}
            accentTone="indigo"
            imageUrl={imgUrl}
            showImage={showImg}
            scale={lay.scale}
            darkSurface={palette.dark}
            motionEnabled={motionEnabled}
            stats={[{ label: 'مشاور فعال', value: toPersianNumbers(consultants.length) }]}
            actions={[
              { label: 'عمومی', onClick: () => setActiveNav('Counseling') },
              { label: 'تخصصی قضا', onClick: () => setActiveNav('SpecializedCounseling'), primary: true },
            ]}
          />
        );
      case 'welfare_showcase':
        return (
          <MinimalShowcaseCard
            kicker="تعاون و رفاه"
            title={crextioConfig.welfareShowcaseTitle || 'تسهیلات رفاهی و اقامتگاه‌ها'}
            description="ثبت درخواست اسکان علمی-زیارتی مشهد و قم و تسهیلات قرض‌الحسنه اعضا."
            icon={<Gift className="w-4 h-4" />}
            accentTone="emerald"
            imageUrl={imgUrl}
            showImage={showImg}
            scale={lay.scale}
            darkSurface={palette.dark}
            motionEnabled={motionEnabled}
            actions={[{ label: 'میز رفاهیات', onClick: () => setActiveNav('Welfare'), primary: true }]}
          />
        );
      case 'multimedia_showcase':
        return (
          <MinimalShowcaseCard
            kicker="آرشیو علمی"
            title={crextioConfig.multimediaShowcaseTitle || 'درس‌گفتارها و چندرسانه‌ای'}
            description="دسترسی به جلسات ضبط‌شده خارج فقه القضا و نشست‌های تحلیل رویه‌های قضایی."
            icon={<Headphones className="w-4 h-4" />}
            accentTone="stone"
            imageUrl={imgUrl}
            showImage={showImg}
            scale={lay.scale}
            darkSurface={palette.dark}
            motionEnabled={motionEnabled}
            actions={[{ label: 'مشاهده آرشیو', onClick: () => setActiveNav('Courses'), primary: true }]}
          />
        );
      case 'books_showcase':
        if (!isStaff && !productsStoreConfig.isStoreEnabled) return null;
        return (
          <MinimalShowcaseCard
            kicker="مرکز نشر و رسانه نخبگان"
            title={crextioConfig.booksShowcaseTitle || 'کتاب و محصولات چند رسانه‌ای'}
            description="کتب مرجع، بسته‌های چندرسانه‌ای و صوت با امکان خرید نسخه دیجیتال و فیزیکی."
            icon={<BookMarked className="w-4 h-4" />}
            accentTone="amber"
            imageUrl={imgUrl}
            showImage={showImg}
            scale={lay.scale}
            darkSurface={palette.dark}
            motionEnabled={motionEnabled}
            stats={[{ label: 'اثر ثبت‌شده', value: toPersianNumbers(products.length) }]}
            actions={[{ label: 'کتاب و محصولات چند رسانه‌ای', onClick: () => setActiveNav('Products'), primary: true }]}
          />
        );
      default:
        return null;
    }
  };

  const quickButtons = t3.quickButtons || [
    { id: 'qb_cartable', label: 'کارتابل خدمات', targetNav: 'People', visible: true },
    { id: 'qb_synergy', label: 'دیوار هم‌افزایی', targetNav: 'Synergy', visible: true },
    { id: 'qb_research', label: 'راهبری پژوهش', targetNav: 'Research', visible: true },
    { id: 'qb_counseling', label: 'مشاوره نخبگان', targetNav: 'Counseling', visible: true },
  ];

  const getQuickIcon = (target: string) => {
    if (target === 'People') return Inbox;
    if (target === 'Synergy') return Users2;
    if (target === 'Research') return Compass;
    return HeartHandshake;
  };

  const blockOrder =
    t3.blockOrder && t3.blockOrder.length > 0 ? t3.blockOrder : DEFAULT_BLOCK_ORDER;
  const blockSpans = t3.blockSpans || {};

  const heroTitleClass =
    t3.headlineSize === 'compact'
      ? 'text-lg sm:text-xl'
      : t3.headlineSize === 'large'
      ? 'text-2xl sm:text-3xl lg:text-4xl'
      : 'text-xl sm:text-2xl lg:text-[28px]';

  const openStudio = (tab: 'appearance' | 'texts_layout' | 'honors' | 'unified_boxes') => {
    setStudioTab(tab);
    setStudioOpen(true);
  };

  const renderBlock = (blockKey: string) => {
    switch (blockKey) {
      case 'hero': {
        if (t3.showHero === false) return null;
        const heroScale = t3.heroScale || crextioConfig.heroBannerScale || layoutsMap.top_vip_row?.scale || 'normal';
        const showPortrait = crextioConfig.showHeroPortrait !== false;
        const portraitUrl = resolveShowcaseImageUrl('hero_portrait', crextioConfig.showcaseImageOverrides);
        const heroPad =
          heroScale === 'micro'
            ? 'px-4 py-3'
            : heroScale === 'compact'
            ? 'p-4 sm:p-5'
            : heroScale === 'expanded'
            ? 'p-7 sm:p-9'
            : 'p-6 sm:p-7';
        const effectiveTitleClass =
          heroScale === 'micro'
            ? 'text-base sm:text-lg'
            : heroScale === 'compact'
            ? 'text-lg sm:text-xl'
            : heroScale === 'expanded'
            ? 'text-2xl sm:text-3xl lg:text-4xl'
            : heroTitleClass;

        return (
          <motion.section
            initial={motionEnabled ? { opacity: 0, y: 12 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className={`relative overflow-hidden ${radiusClass} border ${palette.cardBorder} ${surfaceStyle} ${heroPad}`}
          >
            {/* Subtle Ambient Institutional Glow */}
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute inset-0 bg-gradient-to-bl ${palette.ambientGlow}`}
            />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0 max-w-2xl">
                {showPortrait && portraitUrl && (
                  <img
                    src={portraitUrl}
                    alt={currentUser?.fullName || 'پرتال'}
                    referrerPolicy="no-referrer"
                    className={`object-cover object-top shrink-0 border ${palette.cardBorder} shadow-sm ${
                      heroScale === 'micro'
                        ? 'w-10 h-10 rounded-xl'
                        : heroScale === 'compact'
                        ? 'w-14 h-14 rounded-2xl'
                        : heroScale === 'expanded'
                        ? 'w-20 h-20 rounded-2xl'
                        : 'w-16 h-16 rounded-2xl'
                    }`}
                  />
                )}

                <div className="space-y-1.5 min-w-0">
                  {heroScale !== 'micro' && (
                    <div className={`flex flex-wrap items-center gap-2 text-xs font-bold ${palette.textMuted}`}>
                      <Sparkles className={`w-3.5 h-3.5 ${palette.accentText}`} />
                      <span className={palette.accentText}>
                        {t3.heroBadgeText || 'پایگاه هم‌افزایی و تکریم نخبگان قضایی و حوزوی'}
                      </span>
                      <span aria-hidden="true" className="opacity-40">·</span>
                      <span>{currentRoleMeta.title}</span>
                      <span aria-hidden="true" className="opacity-40">·</span>
                      <span>{currentUser?.organization || 'مجمع فقه و قضا'}</span>
                    </div>
                  )}

                  <h1
                    className={`${effectiveTitleClass} font-black tracking-tight ${palette.textPrimary}`}
                    style={{ textWrap: 'balance' }}
                  >
                    {t3.heroGreetingPrefix || 'سلام'}، {currentUser?.fullName}
                  </h1>

                  <p
                    className={`text-xs sm:text-sm leading-relaxed ${palette.textMuted} ${
                      heroScale === 'micro' ? 'line-clamp-1' : ''
                    }`}
                  >
                    {t3.heroSubtitle ||
                      'درگاه متمرکز هم‌افزایی اعضا، پیگیری کارتابل خدمات، افتخارات نخبگان، راهبری پژوهش‌ها و مشاوره تخصصی'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {quickButtons
                  .filter(b => b.visible)
                  .map(btn => {
                    const Icon = getQuickIcon(btn.targetNav);
                    return (
                      <button
                        key={btn.id}
                        type="button"
                        onClick={() => setActiveNav(btn.targetNav)}
                        className={`${
                          heroScale === 'micro' ? 'px-2.5 py-1.5 text-[11px]' : 'px-3.5 py-2.5 text-xs'
                        } rounded-xl font-bold border flex items-center gap-2 transition-all cursor-pointer active:scale-95 ${
                          palette.dark
                            ? 'bg-white/5 hover:bg-white/10 border-white/15 text-stone-100'
                            : 'bg-stone-50/90 hover:bg-white border-stone-200 text-stone-800 hover:shadow-xs'
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 ${palette.accentText}`} />
                        <span>{btn.label}</span>
                      </button>
                    );
                  })}
              </div>
            </div>
          </motion.section>
        );
      }

      case 'widgets': {
        if (t3.showWidgets === false) return null;
        return (
          <DashboardWidgetsSuite
            onNavigateTab={setActiveNav}
            isAlumniPreview={isAlumniPreview}
            onToggleAlumniPreview={() => setIsAlumniPreview(prev => !prev)}
          />
        );
      }

      case 'honors_showcase': {
        if (crextioConfig.showHonorsShowcase === false) return null;
        const honorSpan = layoutsMap.honors_showcase?.span || blockSpans.honors_showcase || 'full';
        return (
          <HonorsShowcase
            span={honorSpan}
            scale={layoutsMap.honors_showcase?.scale || 'normal'}
            darkSurface={palette.dark}
            isAdmin={isAdmin}
            onNavigateTab={setActiveNav}
            onOpenEditor={() => openStudio('honors')}
          />
        );
      }

      case 'unified_showcase': {
        if (crextioConfig.showUnifiedShowcase === false) return null;
        const unifiedSpan = layoutsMap.unified_showcase?.span || blockSpans.unified_showcase || 'full';
        return (
          <UnifiedShowcaseHub
            span={unifiedSpan}
            scale={layoutsMap.unified_showcase?.scale || 'normal'}
            darkSurface={palette.dark}
            isAdmin={isAdmin}
            onNavigateTab={setActiveNav}
            onOpenEditor={() => openStudio('unified_boxes')}
          />
        );
      }

      case 'operations_split': {
        if (t3.showOperationsSplit === false) return null;
        return (
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* Recent Cartable Cases */}
            <div
              className={`lg:col-span-6 ${radiusClass} border ${palette.cardBorder} ${surfaceStyle} p-5 flex flex-col justify-between gap-4`}
            >
              <div
                className={`flex items-center justify-between pb-3 border-b ${
                  palette.dark ? 'border-white/10' : 'border-stone-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Inbox className={`w-4 h-4 ${palette.accentText}`} />
                  <h2 className={`text-sm font-black ${palette.textPrimary}`}>
                    {t3.cartableSectionTitle || (isStaff ? 'آخرین درخواست‌های کارتابل' : 'پیگیری درخواست‌های من')}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveNav('People')}
                  className={`text-xs font-bold flex items-center gap-1 cursor-pointer ${palette.accentText}`}
                >
                  <span>مشاهده همه</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              </div>

              {myRecentCartable.length === 0 ? (
                <p className={`text-xs py-6 text-center ${palette.textMuted}`}>
                  هنوز درخواستی در کارتابل ثبت نشده است.
                </p>
              ) : (
                <div className={`divide-y ${palette.dark ? 'divide-white/10' : 'divide-stone-100'}`}>
                  {myRecentCartable.map(req => (
                    <button
                      key={req.id}
                      type="button"
                      onClick={() => setActiveNav('People')}
                      className={`w-full py-2.5 text-right flex items-center justify-between gap-3 px-2 rounded-lg transition-colors cursor-pointer ${
                        palette.dark ? 'hover:bg-white/5' : 'hover:bg-stone-50'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className={`text-xs font-bold truncate ${palette.textPrimary}`}>{req.title}</p>
                        <p className={`text-[11px] mt-0.5 truncate ${palette.textMuted}`}>
                          {req.applicantName} · کد{' '}
                          <span className="font-mono tabular-nums">{toPersianNumbers(req.trackingNumber)}</span>
                        </p>
                      </div>
                      <span className={`text-[11px] font-bold shrink-0 ${palette.textMuted}`}>
                        {req.status === 'pending'
                          ? 'در انتظار'
                          : req.status === 'in_progress'
                          ? 'در حال پیگیری'
                          : req.status === 'completed'
                          ? 'انجام شد'
                          : req.status === 'archived'
                          ? 'مختومه'
                          : 'نیازمند تکمیل'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Synergy Posts */}
            <div
              className={`lg:col-span-6 ${radiusClass} border ${palette.cardBorder} ${surfaceStyle} p-5 flex flex-col justify-between gap-4`}
            >
              <div
                className={`flex items-center justify-between pb-3 border-b ${
                  palette.dark ? 'border-white/10' : 'border-stone-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Users2 className={`w-4 h-4 ${palette.accentText}`} />
                  <h2 className={`text-sm font-black ${palette.textPrimary}`}>
                    {t3.synergySectionTitle || 'تازه‌های دیوار هم‌افزایی و تبادل تجربه'}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveNav('Synergy')}
                  className={`text-xs font-bold flex items-center gap-1 cursor-pointer ${palette.accentText}`}
                >
                  <span>ورود به دیوار هم‌افزایی</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              </div>

              {recentSynergy.length === 0 ? (
                <p className={`text-xs py-6 text-center ${palette.textMuted}`}>
                  هنوز پستی در دیوار هم‌افزایی منتشر نشده است.
                </p>
              ) : (
                <div className={`divide-y ${palette.dark ? 'divide-white/10' : 'divide-stone-100'}`}>
                  {recentSynergy.map(post => (
                    <button
                      key={post.id}
                      type="button"
                      onClick={() => setActiveNav('Synergy')}
                      className={`w-full py-2.5 text-right flex items-center justify-between gap-3 px-2 rounded-lg transition-colors cursor-pointer ${
                        palette.dark ? 'hover:bg-white/5' : 'hover:bg-stone-50'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className={`text-xs font-bold truncate ${palette.textPrimary}`}>{post.title}</p>
                        <p className={`text-[11px] mt-0.5 truncate ${palette.textMuted}`}>
                          {post.authorPseudonym} ·{' '}
                          <span className="tabular-nums">{toPersianNumbers(post.responses?.length || 0)}</span> دیدگاه
                        </p>
                      </div>
                      <ArrowLeft className={`w-3.5 h-3.5 shrink-0 ${palette.textMuted}`} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>
        );
      }

      case 'individual_showcases': {
        if (t3.showIndividualShowcases === false) return null;
        return (
          <section className="space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className={`text-xs sm:text-sm font-black flex items-center gap-2 ${palette.textPrimary}`}>
                <LayoutGrid className={`w-4 h-4 ${palette.accentText}`} />
                <span>{t3.individualShowcasesHeading || 'درگاه‌های علمی، پژوهشی و خدماتی'}</span>
              </h2>

              {isAdmin && (
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      updateCrextioConfig({
                        showShowcaseImagesInMinimal: crextioConfig.showShowcaseImagesInMinimal === false,
                      });
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-colors cursor-pointer ${
                      crextioConfig.showShowcaseImagesInMinimal !== false
                        ? palette.dark
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                        : palette.dark
                        ? 'bg-white/5 text-stone-300 border-white/15'
                        : 'bg-white text-stone-600 border-stone-200'
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>
                      {crextioConfig.showShowcaseImagesInMinimal !== false
                        ? 'تصاویر باکس‌ها: فعال'
                        : 'تصاویر باکس‌ها: خاموش'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsEditLayout(prev => !prev)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-colors cursor-pointer ${
                      isEditLayout
                        ? 'bg-amber-400 text-stone-950 border-amber-500'
                        : palette.dark
                        ? 'bg-white/5 text-stone-200 border-white/15 hover:bg-white/10'
                        : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {isEditLayout ? <Check className="w-3.5 h-3.5" /> : <Move className="w-3.5 h-3.5" />}
                    <span>{isEditLayout ? 'پایان چیدمان زنده' : 'تغییر چیدمان و اندازه (Drag & Drop)'}</span>
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              {minimalOrder.map(key => {
                const isHidden = hiddenMap[key] === true;
                if (isHidden && !isEditLayout) return null;
                const layout = getLayout(key);
                const colClass = layout.span === 'full' ? 'lg:col-span-12' : 'lg:col-span-6';

                return (
                  <div
                    key={key}
                    draggable={isEditLayout}
                    onDragStart={() => isEditLayout && setDraggedKey(key)}
                    onDragOver={e => {
                      if (!isEditLayout) return;
                      e.preventDefault();
                      setDragOverKey(key);
                    }}
                    onDragLeave={() => setDragOverKey(null)}
                    onDrop={() => isEditLayout && handleDropMinimal(key)}
                    onDragEnd={() => {
                      setDraggedKey(null);
                      setDragOverKey(null);
                    }}
                    className={`${colClass} flex flex-col ${
                      isEditLayout
                        ? `rounded-2xl border-2 border-dashed p-1.5 ${
                            dragOverKey === key ? 'border-emerald-500 bg-emerald-50/30' : 'border-amber-400/70'
                          } ${isHidden ? 'opacity-45' : ''}`
                        : ''
                    }`}
                  >
                    {isEditLayout && (
                      <div className="mb-1.5 px-2.5 py-1.5 rounded-xl bg-stone-900 text-white flex flex-wrap items-center justify-between gap-1.5 text-[11px] font-bold">
                        <span className="flex items-center gap-1.5 cursor-grab">
                          <GripVertical className="w-3.5 h-3.5 text-amber-400" />
                          <span>{SHOWCASE_LABELS[key] || key}</span>
                        </span>
                        <div className="flex items-center gap-1 flex-wrap">
                          <button
                            type="button"
                            onClick={() =>
                              patchLayout(key, {
                                density: layout.density === 'full' ? 'minimal' : 'full',
                              })
                            }
                            className={`px-2 py-0.5 rounded flex items-center gap-1 cursor-pointer ${
                              layout.density === 'full'
                                ? 'bg-amber-400 text-stone-950 font-black'
                                : 'bg-stone-800 hover:bg-stone-700 text-stone-200'
                            }`}
                          >
                            {layout.density === 'full' ? (
                              <Maximize2 className="w-3 h-3" />
                            ) : (
                              <Minimize2 className="w-3 h-3" />
                            )}
                            <span>{layout.density === 'full' ? 'کلاسیک' : 'ساده'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              patchLayout(key, {
                                span: layout.span === 'half' ? 'full' : 'half',
                              })
                            }
                            className="px-2 py-0.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 flex items-center gap-1 cursor-pointer"
                          >
                            <Columns2 className="w-3 h-3" />
                            <span>{layout.span === 'half' ? '۱/۲ خط' : 'تمام‌عرض'}</span>
                          </button>

                          <select
                            value={layout.scale || 'normal'}
                            onChange={e => patchLayout(key, { scale: e.target.value as any })}
                            className="px-2 py-0.5 rounded bg-stone-800 text-stone-100 border border-stone-700 text-[10px] font-bold cursor-pointer"
                          >
                            <option value="micro">خیلی کوچک (مینی)</option>
                            <option value="compact">کوچک</option>
                            <option value="normal">متوسط</option>
                            <option value="expanded">بزرگ</option>
                          </select>

                          <button
                            type="button"
                            onClick={() =>
                              patchLayout(key, { showImage: layout.showImage === false })
                            }
                            className={`px-2 py-0.5 rounded flex items-center gap-1 cursor-pointer ${
                              layout.showImage !== false
                                ? 'bg-emerald-600 text-white'
                                : 'bg-stone-800 text-stone-300'
                            }`}
                          >
                            <ImageIcon className="w-3 h-3" />
                            <span>{layout.showImage !== false ? 'عکس' : 'بی‌عکس'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleHide(key)}
                            className="px-2 py-0.5 rounded bg-stone-800 hover:bg-rose-600 text-stone-200 flex items-center gap-1 cursor-pointer"
                          >
                            {isHidden ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                    )}
                    <div className="flex-1">{renderShowcaseBox(key)}</div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div
      className={`min-h-screen ${palette.pageBg} ${palette.textPrimary} font-sans antialiased transition-colors`}
      dir="rtl"
    >
      {/* 3-Zone Top Bar Contract */}
      <header className={`sticky top-0 z-40 backdrop-blur-md border-b ${palette.headerBg}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-6">
          {/* Zone 1: Single-line Brand Wordmark */}
          <button
            type="button"
            onClick={() => setActiveNav('Dashboard')}
            className={`text-base font-black tracking-tight whitespace-nowrap shrink-0 flex items-center gap-2.5 cursor-pointer ${palette.textPrimary}`}
          >
            <span className="w-8 h-8 rounded-lg bg-emerald-900 text-amber-300 flex items-center justify-center shrink-0">
              <Scale className="w-4 h-4" />
            </span>
            <span>{t3.brandTitle || 'مجمع دانش‌آموختگان فقه و قضا'}</span>
          </button>

          {/* Zone 2: Typography Nav Links with Sliding Active Indicator */}
          <nav className={`hidden lg:flex items-center gap-5 text-xs font-bold ${palette.textMuted}`}>
            {primaryNav.map(item => {
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveNav(item.id)}
                  className={`relative whitespace-nowrap shrink-0 py-2 transition-colors cursor-pointer ${
                    isActive ? `${palette.accentText} font-black` : 'hover:opacity-80'
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive && (
                    <motion.span
                      layoutId="minimalTopNavUnderline"
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                      className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-full ${
                        palette.dark ? 'bg-amber-400' : 'bg-emerald-900'
                      }`}
                    />
                  )}
                </button>
              );
            })}

            {secondaryNav.length > 0 && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMoreMenuOpen(prev => !prev)}
                  className="flex items-center gap-1 whitespace-nowrap shrink-0 py-2 hover:opacity-80 cursor-pointer"
                >
                  <span>سایر بخش‌ها</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                {moreMenuOpen && (
                  <div
                    onMouseLeave={() => setMoreMenuOpen(false)}
                    className={`absolute right-0 mt-2 w-56 border rounded-xl shadow-xl p-1.5 z-50 space-y-0.5 ${
                      palette.dark
                        ? 'bg-[#13221D] border-[#253E35] text-stone-100'
                        : 'bg-white border-stone-200 text-stone-800'
                    }`}
                  >
                    {secondaryNav.map(item => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setActiveNav(item.id);
                            setMoreMenuOpen(false);
                          }}
                          className={`w-full text-right px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer ${
                            activeNav === item.id
                              ? palette.dark
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-emerald-50 text-emerald-900'
                              : palette.dark
                              ? 'hover:bg-white/5'
                              : 'hover:bg-stone-100'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5 opacity-70" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </nav>

          {/* Zone 3: Admin Studio / Theme Switcher + Primary CTA */}
          <div className="flex items-center gap-2 shrink-0">
            {isAdmin && (
              <button
                type="button"
                onClick={() => openStudio('appearance')}
                className="px-3 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-black flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
              >
                <Palette className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">ویرایشگر کامل صفحه</span>
              </button>
            )}

            {isOrganizationalRole(currentUser?.role) && (
              <div
                className={`hidden md:flex items-center gap-1 p-1 rounded-xl border text-[11px] font-bold ${
                  palette.dark ? 'bg-white/5 border-white/15' : 'bg-stone-100 border-stone-200'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelectTheme('portal')}
                  className="px-2 py-1 rounded-lg opacity-75 hover:opacity-100 cursor-pointer"
                >
                  تم ۱
                </button>
                <button
                  type="button"
                  onClick={() => onSelectTheme('crextio')}
                  className="px-2 py-1 rounded-lg opacity-75 hover:opacity-100 cursor-pointer"
                >
                  تم ۲
                </button>
                <span
                  className={`px-2 py-1 rounded-lg shadow-2xs ${
                    palette.dark ? 'bg-emerald-500 text-stone-950' : 'bg-white text-emerald-900'
                  }`}
                >
                  تم ۳
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={() => setActiveNav('People')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 transition-colors ${palette.accentBtn}`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>درخواست جدید</span>
            </button>

            <button
              type="button"
              onClick={logout}
              title="خروج از حساب"
              className="p-2 rounded-xl opacity-70 hover:opacity-100 hover:text-rose-500 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-7 space-y-6">
        {activeNav === 'Dashboard' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {blockOrder.map(blk => {
              const rendered = renderBlock(blk);
              if (!rendered) return null;
              const blkSpan = layoutsMap[blk]?.span || blockSpans[blk] || 'full';
              const colSpan =
                blkSpan === 'half' && (blk === 'honors_showcase' || blk === 'unified_showcase')
                  ? 'lg:col-span-6'
                  : 'lg:col-span-12';
              return (
                <div key={blk} className={`${colSpan} flex flex-col`}>
                  {rendered}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-4">
            <div
              className={`flex items-center justify-between pb-3 border-b ${
                palette.dark ? 'border-white/10' : 'border-stone-200'
              }`}
            >
              <button
                type="button"
                onClick={() => setActiveNav('Dashboard')}
                className={`text-xs font-bold flex items-center gap-1.5 cursor-pointer ${palette.accentText}`}
              >
                <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                <span>بازگشت به میز کار</span>
              </button>
            </div>

            {activeNav === 'Finance' ? (
              <FinanceSection />
            ) : activeNav === 'Alumni' ? (
              <Suspense fallback={<ModuleFallback />}>
                <AlumniDirectorySection onNavigate={setActiveNav} />
              </Suspense>
            ) : activeNav === 'Users' ? (
              <UserManagementModule />
            ) : activeNav === 'Admin' ? (
              <Suspense fallback={<ModuleFallback />}>
                <AdminControlCenter />
              </Suspense>
            ) : (
              <CrextioSubViews activeNav={activeNav} onNavigate={setActiveNav} />
            )}
          </div>
        )}
      </main>

      {/* Live 100% Page Studio Drawer for Admin */}
      {isAdmin && (
        <Theme3StudioDrawer
          isOpen={studioOpen}
          initialTab={studioTab}
          onClose={() => setStudioOpen(false)}
          crextioConfig={crextioConfig}
          updateCrextioConfig={updateCrextioConfig}
        />
      )}

      {/* Bottom Floating Alumni Preview Bar */}
      {currentUser?.role === 'alumni' && (
        <div className="fixed bottom-5 left-5 z-50 flex items-center gap-2.5 bg-stone-900 text-white px-4 py-2 rounded-xl border border-stone-700 shadow-lg text-xs">
          <span className="font-bold">نمای دانش‌آموخته</span>
          <button
            type="button"
            onClick={() => switchUserRole('admin')}
            className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-stone-950 rounded-lg font-black cursor-pointer"
          >
            بازگشت به مدیریت
          </button>
        </div>
      )}
    </div>
  );
};
