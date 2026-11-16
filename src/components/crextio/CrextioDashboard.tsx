import React, { useState, useRef, useCallback, lazy, Suspense } from 'react';
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
} from 'lucide-react';
import { CourseShowcase } from './CourseShowcase';
import { CrextioServicesBento } from './CrextioServicesBento';
import { CounselingPromoShowcase } from './CounselingPromoShowcase';
import { BooksAndPublicationsShowcase } from './BooksAndPublicationsShowcase';
import { WelfareAndLoansShowcase } from './WelfareAndLoansShowcase';
import { MultimediaAndCoursesShowcase } from './MultimediaAndCoursesShowcase';
import { CrextioHeroStatsCustomizerModal } from './CrextioHeroStatsCustomizerModal';
import { CrextioRulingsShowcase } from './CrextioRulingsShowcase';
import { ResearchPromoShowcase } from './ResearchPromoShowcase';
import { MinimalShowcaseCard } from './MinimalShowcaseCard';
import { AnimatedCounter } from '../common/AnimatedCounter';
import { DEFAULT_HERO_STATS } from '../../data/mockData';
import { DashboardWidgetsSuite } from '../dashboard/DashboardWidgetsSuite';
import { CANONICAL_DASHBOARD_SECTION_ORDER, reconcileDashboardSectionOrder } from '../../context/ThemeContext';

const ThemeCustomizerModal = lazy(() =>
  import('../admin/ThemeCustomizerModal').then(m => ({ default: m.ThemeCustomizerModal }))
);

interface CrextioDashboardProps {
  onNavigateTab?: (tab: string) => void;
}

const SECTION_LABELS: Record<string, string> = {
  top_vip_row: 'بنر خوش‌آمدگویی و پرتره',
  rulings_showcase: 'ویترین تالار آراء قضایی',
  research_promo: 'ویترین راهبری پژوهش',
  course_showcase: 'ویترین دوره‌های علمی',
  counseling_promo: 'ویترین خدمات مشاوره',
  welfare_showcase: 'ویترین رفاهیات و تسهیلات',
  multimedia_showcase: 'ویترین درس‌گفتارها',
  bento_grid: 'شبکه جامع خدمات (Bento)',
  books_showcase: 'ویترین کتب و منشورات',
};

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

export const CrextioDashboard: React.FC<CrextioDashboardProps> = ({ onNavigateTab }) => {
  const {
    currentUser,
    courses,
    rulings,
    products,
    consultants,
    researchMentorships,
    crextioConfig,
    updateCrextioConfig,
    setDesignTheme,
  } = useApp();

  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [isHeroStatsModalOpen, setIsHeroStatsModalOpen] = useState(false);
  const [quickServiceSuccess, setQuickServiceSuccess] = useState<string | null>(null);
  const [isAlumniPreview, setIsAlumniPreview] = useState(false);

  // Live Drag & Drop and Resize Edit Mode
  const [isLayoutEditMode, setIsLayoutEditMode] = useState(false);
  const [draggedKey, setDraggedKey] = useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

  const isAlumni = currentUser?.role === 'alumni' || isAlumniPreview;
  const isAdmin =
    (currentUser?.role === 'admin' ||
      currentUser?.role === 'super_admin' ||
      currentUser?.role === 'alumni_manager' ||
      currentUser?.role === 'supervisor') &&
    !isAlumniPreview;

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
    patch: Partial<{ span: 'full' | 'half'; density: 'full' | 'minimal' }>
  ) => {
    const cur = layoutsMap[key] || { span: 'full', density: 'full' };
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

  const toggleHideSection = (key: string) => {
    updateCrextioConfig({
      hiddenDashboardSections: {
        ...hiddenMap,
        [key]: !hiddenMap[key],
      },
    });
  };

  const renderSectionContent = (sectionKey: string, density: 'full' | 'minimal') => {
    switch (sectionKey) {
      case 'top_vip_row':
        return (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-stretch">
            {crextioConfig.showProfileCard && (
              <div className="xl:col-span-1 h-full">
                <CrextioCard
                  glowColor="rgba(16, 185, 129, 0.3)"
                  className="relative h-full min-h-[260px] w-full rounded-[28px] overflow-hidden shadow-md border border-stone-200/90 group"
                >
                  <img
                    src={
                      isAlumni
                        ? '/assets/cleric_portrait.jpg'
                        : 'https://images.unsplash.com/photo-1576722108740-4573177651a3?auto=format&fit=crop&w=700&q=80'
                    }
                    alt="پرتره دانش‌آموخته"
                    className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A1A14] via-[#0A1A14]/60 to-transparent flex items-end p-5 text-white">
                    <div className="w-full space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-1 mb-1">
                            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                            <span className="text-[10px] font-bold text-amber-300">عضو رسمی مجمع</span>
                          </div>
                          <h3 className="text-lg font-black text-white">{currentUser?.fullName}</h3>
                          <p className="text-emerald-300 text-xs font-semibold">{currentUser?.roleTitle}</p>
                        </div>

                        <span className="px-3 py-1 rounded-full bg-emerald-500/30 border border-emerald-400/50 text-emerald-200 text-[11px] font-black backdrop-blur-md shadow-xs">
                          {isAlumni ? 'دانش‌آموخته' : 'مسئول خدمات'}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-white/15 flex items-center justify-between text-[11px] text-emerald-100 font-medium">
                        <span>{currentUser?.organization}</span>
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> تایید شده
                        </span>
                      </div>
                    </div>
                  </div>
                </CrextioCard>
              </div>
            )}

            {crextioConfig.showHeroBanner && (
              <div className={`${crextioConfig.showProfileCard ? 'xl:col-span-3' : 'xl:col-span-4'} h-full`}>
                <CrextioCard
                  glowColor="rgba(16, 185, 129, 0.20)"
                  className="h-full rounded-[28px] p-4 sm:p-5 border border-[#E3E0D3] bg-[#FCFCF9]/95 backdrop-blur-2xl shadow-md flex flex-col justify-between"
                >
                  <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-5">
                    <div className="space-y-2.5 max-w-2xl">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-stone-600 font-semibold">
                        <span className="text-amber-700 font-extrabold flex items-center gap-1">
                          <Scale className="w-3.5 h-3.5" />
                          طرح میزان
                        </span>
                        <span>·</span>
                        <span className="text-emerald-800">
                          {isAlumni ? 'مجمع نخبگان دانش‌آموختگان فقه و قضا' : 'درگاه مدیریت و کارتابل خدمات'}
                        </span>
                        <span>·</span>
                        <span>دوره {toPersianNumbers(currentUser?.graduationYear || '۱۳۹۵')}</span>
                      </div>

                      <div>
                        <h1 className="text-xl sm:text-2xl xl:text-3xl font-black text-stone-900 leading-snug tracking-tight">
                          {crextioConfig.heroTitle ||
                            `خوش آمدید، ${currentUser ? currentUser.fullName : 'جناب آقای دکتر میرزایی'}`}
                        </h1>
                        <p className="text-xs text-stone-600 mt-1.5 leading-relaxed font-medium">
                          {crextioConfig.heroSubtitle ||
                            `${currentUser?.organization} · آماده پیگیری درخواست‌های الکترونیک، هم‌افزایی و پژوهش`}
                        </p>
                      </div>

                      <div className="pt-2 flex flex-wrap items-center gap-2">
                        {[
                          { label: 'ثبت درخواست در کارتابل', icon: FileText, action: () => onNavigateTab?.('People') },
                          { label: 'مشارکت در هم‌افزایی', icon: Users, action: () => onNavigateTab?.('Synergy') },
                          { label: 'ثبت پروپوزال پژوهشی', icon: Compass, action: () => onNavigateTab?.('Research') },
                        ].map((btn, idx) => (
                          <button
                            key={idx}
                            onClick={btn.action}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-stone-800 hover:text-emerald-950 border border-stone-200/90 text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
                          >
                            <btn.icon className="w-3.5 h-3.5 text-emerald-700" />
                            <span>{btn.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {crextioConfig.showKpiRow && (
                      <div className="flex flex-col gap-2 shrink-0">
                        {isAdmin && (
                          <div className="flex justify-end">
                            <button
                              onClick={() => setIsHeroStatsModalOpen(true)}
                              className="px-2.5 py-1 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-900 border border-amber-500/30 text-[10px] font-black flex items-center gap-1 transition-all cursor-pointer"
                            >
                              <Sliders className="w-3 h-3 text-amber-700" />
                              <span>مدیریت آمار بنر</span>
                            </button>
                          </div>
                        )}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
                          {heroStats.map(stat => {
                            const Icon = getStatIconComponent(stat.icon);
                            return (
                              <CrextioCard
                                key={stat.id}
                                glowColor="rgba(245, 158, 11, 0.25)"
                                className="bg-white/95 p-3.5 rounded-2xl border border-[#E7E4D8] shadow-2xs flex flex-col items-center justify-center text-center space-y-1.5 group"
                              >
                                <div className={`p-2 rounded-xl ${stat.color} mx-auto`}>
                                  <Icon className="w-3.5 h-3.5" />
                                </div>
                                <span className="text-[10px] font-extrabold text-stone-600 line-clamp-1 block">
                                  {stat.label}
                                </span>
                                <span className="text-xl font-black text-stone-900 tracking-tight block tabular-nums">
                                  <AnimatedCounter value={toPersianNumbers(stat.val.toLocaleString('fa-IR'))} duration={1500} />
                                </span>
                              </CrextioCard>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </CrextioCard>
              </div>
            )}
          </div>
        );

      case 'rulings_showcase':
        if (crextioConfig.showRulingsShowcase === false) return null;
        if (density === 'minimal') {
          return (
            <MinimalShowcaseCard
              kicker="مباحثات تخصصی قضایی"
              title={crextioConfig.rulingsShowcaseTitle || 'تالار نقد و مباحثه آراء قضایی'}
              description="بررسی استدلال‌های حقوقی، نقد رویه قضایی و تبادل نظر نخبگان بر روی آراء منتخب."
              icon={<Scale className="w-5 h-5" />}
              accentTone="amber"
              stats={[
                { label: 'آراء در جریان بحث', value: toPersianNumbers(rulings.length) },
              ]}
              actions={[
                { label: 'ورود به تالار آراء', onClick: () => onNavigateTab?.('Rulings'), primary: true },
              ]}
            />
          );
        }
        return <CrextioRulingsShowcase onNavigateToRulings={() => onNavigateTab?.('Rulings')} />;

      case 'research_promo':
        if (crextioConfig.showResearchPromoShowcase === false) return null;
        if (density === 'minimal') {
          return (
            <MinimalShowcaseCard
              kicker="حمایت و هدایت پژوهشی"
              title={crextioConfig.researchPromoTitle || 'راهبری پژوهش‌ها، رساله‌ها و پایان‌نامه‌ها'}
              description="همراهی با اساتید راهنمای طراز اول، تخصیص گرنت پژوهشی و تسهیل اسکان علمی برای پیشبرد پژوهش‌ها."
              icon={<Compass className="w-5 h-5" />}
              accentTone="emerald"
              stats={[
                { label: 'پژوهش‌های فعال', value: toPersianNumbers(researchMentorships.length) },
                { label: 'گرنت تا سقف', value: '۵۰ میلیون' },
              ]}
              actions={[
                { label: 'میز راهبری پژوهش', onClick: () => onNavigateTab?.('Research'), primary: true },
              ]}
            />
          );
        }
        return <ResearchPromoShowcase onNavigateToResearch={() => onNavigateTab?.('Research')} />;

      case 'course_showcase':
        if (crextioConfig.showCourseShowcase === false) return null;
        if (density === 'minimal') {
          return (
            <MinimalShowcaseCard
              kicker="توانمندسازی علمی و کارگاه‌ها"
              title={crextioConfig.courseShowcaseTitle || 'دوره‌ها و کارگاه‌های تخصصی'}
              description="نشست‌ها و دوره‌های مهارتی فقه القضا، آیین دادرسی و کارگاه‌های علمی دانش‌آموختگان."
              icon={<GraduationCap className="w-5 h-5" />}
              accentTone="sky"
              stats={[
                { label: 'دوره فعال', value: toPersianNumbers(courses.length) },
              ]}
              actions={[
                { label: 'مشاهده دوره‌ها', onClick: () => onNavigateTab?.('Courses'), primary: true },
              ]}
            />
          );
        }
        return (
          <CourseShowcase
            courses={courses}
            mode={crextioConfig.courseShowcaseMode || 'carousel'}
            onSelectCourse={() => onNavigateTab?.('Courses')}
          />
        );

      case 'counseling_promo':
        if (crextioConfig.showCounselingPromo === false) return null;
        if (density === 'minimal') {
          return (
            <MinimalShowcaseCard
              kicker="هدایت شغلی، علمی و سلامت روان"
              title={crextioConfig.counselingPromoTitle || 'خدمات مشاوره نخبگان'}
              description="دریافت نوبت محرمانه مشاوره تخصصی قضایی-تحصیلی و مشاوره عمومی خانواده با اساتید برجسته."
              icon={<HeartHandshake className="w-5 h-5" />}
              accentTone="indigo"
              stats={[
                { label: 'مشاور و استاد راهنما', value: toPersianNumbers(consultants.length) },
              ]}
              actions={[
                { label: 'مشاوره عمومی', onClick: () => onNavigateTab?.('CounselingGeneral') },
                { label: 'مشاوره شغلی قضا', onClick: () => onNavigateTab?.('SpecializedCounseling'), primary: true },
              ]}
            />
          );
        }
        return (
          <CounselingPromoShowcase
            onNavigateToGeneral={() => onNavigateTab?.('CounselingGeneral')}
            onNavigateToSpecialized={() => onNavigateTab?.('SpecializedCounseling')}
          />
        );

      case 'welfare_showcase':
        if (density === 'minimal') {
          return (
            <MinimalShowcaseCard
              kicker="خدمات رفاهی و تسهیلات اعضا"
              title={crextioConfig.welfareShowcaseTitle || 'رفاهیات، اقامتگاه‌ها و صندوق تعاون'}
              description="ثبت درخواست اسکان زیارتی و پژوهشی در مشهد و قم، تسهیلات قرض‌الحسنه و تعاونی اعضا."
              icon={<Gift className="w-5 h-5" />}
              accentTone="emerald"
              actions={[
                { label: 'ورود به میز رفاهیات', onClick: () => onNavigateTab?.('Welfare'), primary: true },
              ]}
            />
          );
        }
        return <WelfareAndLoansShowcase onNavigateToWelfare={() => onNavigateTab?.('Welfare')} />;

      case 'multimedia_showcase':
        if (density === 'minimal') {
          return (
            <MinimalShowcaseCard
              kicker="آرشیو علمی و درس‌گفتارها"
              title={crextioConfig.multimediaShowcaseTitle || 'آرشیو صوت و تصویر درس‌گفتارها'}
              description="دسترسی به جلسات ضبط‌شده خارج فقه القضا و نشست‌های تحلیل قضایی."
              icon={<Headphones className="w-5 h-5" />}
              accentTone="stone"
              actions={[
                { label: 'مشاهده آرشیو', onClick: () => onNavigateTab?.('Courses'), primary: true },
              ]}
            />
          );
        }
        return <MultimediaAndCoursesShowcase onNavigateToCourses={() => onNavigateTab?.('Courses')} />;

      case 'bento_grid':
        return <CrextioServicesBento onNavigateTab={tab => onNavigateTab?.(tab)} />;

      case 'books_showcase':
        if (density === 'minimal') {
          return (
            <MinimalShowcaseCard
              kicker="مرکز نشر و پژوهش"
              title={crextioConfig.booksShowcaseTitle || 'منشورات و کتب مرجع فقه و قضا'}
              description="دسترسی به کتب علمی، موسوعه‌ها و آثار تألیفی اساتید و دانش‌آموختگان مجمع."
              icon={<BookMarked className="w-5 h-5" />}
              accentTone="amber"
              stats={[{ label: 'اثر ثبت‌شده', value: toPersianNumbers(products.length) }]}
              actions={[
                { label: 'مشاهده منشورات', onClick: () => onNavigateTab?.('Products'), primary: true },
              ]}
            />
          );
        }
        return <BooksAndPublicationsShowcase onNavigateToProducts={() => onNavigateTab?.('Products')} />;

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
      className="w-full space-y-6 text-stone-900 font-sans"
    >
      {/* QUICK NOTIFICATION TOAST */}
      <AnimatePresence>
        {quickServiceSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-900 text-white px-6 py-3.5 rounded-2xl shadow-2xl border border-emerald-400/40 flex items-center gap-3 text-xs sm:text-sm font-bold"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
            <span>{quickServiceSuccess}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ADMIN THEME & LAYOUT CUSTOMIZER LAUNCHER BAR */}
      {isAdmin && (
        <div className="w-full bg-stone-900 text-white rounded-2xl p-3.5 sm:px-5 flex flex-col lg:flex-row items-center justify-between gap-3 border border-stone-800 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <Sliders className="w-4 h-4" />
            </span>
            <div className="text-right">
              <span className="text-xs sm:text-sm font-bold text-white block">
                کنترل چیدمان ویترین‌ها، تغییر سایز و نمای مینیمال
              </span>
              <span className="text-[11px] text-stone-400">
                جابه‌جایی با کشیدن و رها کردن (Drag & Drop)، نصف‌عرض کردن ویترین‌ها در یک ردیف یا سوئیچ به تم ۳ مینیمال
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsLayoutEditMode(prev => !prev)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isLayoutEditMode
                  ? 'bg-amber-400 text-stone-950 shadow-md'
                  : 'bg-stone-800 hover:bg-stone-700 text-stone-100 border border-stone-700'
              }`}
            >
              {isLayoutEditMode ? <Check className="w-3.5 h-3.5" /> : <Move className="w-3.5 h-3.5 text-amber-400" />}
              <span>{isLayoutEditMode ? 'اتمام ویرایش چیدمان' : 'ویرایش زنده چیدمان (Drag & Drop)'}</span>
            </button>

            <button
              type="button"
              onClick={() => setDesignTheme('minimal')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>تم ۳ (مجمع مینیمال)</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCustomizerOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-black transition-all cursor-pointer"
            >
              <Palette className="w-3.5 h-3.5" />
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
              حالت ویرایش چیدمان فعال است: هر ویترین را بگیرید و روی جایگاه دیگر رها کنید؛ یا عرض آن را بین «تمام‌عرض» و «نصف‌عرض (۱/۲)» و ظاهر آن را به «مینیمال» تغییر دهید.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                updateCrextioConfig({
                  dashboardSectionLayouts: {
                    ...layoutsMap,
                    research_promo: { span: 'half', density: 'minimal' },
                    course_showcase: { span: 'half', density: 'minimal' },
                  },
                });
              }}
              className="px-3 py-1.5 rounded-xl bg-emerald-800 text-white font-bold text-[11px] hover:bg-emerald-900 cursor-pointer"
            >
              قراردادن دوره + پژوهش در یک خط (نصف‌عرض مینیمال)
            </button>
            <button
              type="button"
              onClick={() =>
                updateCrextioConfig({
                  dashboardSectionOrder: [...CANONICAL_DASHBOARD_SECTION_ORDER],
                  hiddenDashboardSections: {},
                  dashboardSectionLayouts: {},
                })
              }
              className="px-3 py-1.5 rounded-xl bg-white border border-amber-300 text-amber-900 font-bold text-[11px] hover:bg-amber-100 cursor-pointer"
            >
              بازنشانی چیدمان
            </button>
          </div>
        </div>
      )}

      {/* DASHBOARD BANNERS, STATUS WIDGET, EVENTS CALENDAR & ALUMNI PREVIEW */}
      <DashboardWidgetsSuite
        onNavigateTab={onNavigateTab}
        isAlumniPreview={isAlumniPreview}
        onToggleAlumniPreview={() => setIsAlumniPreview(prev => !prev)}
      />

      {/* DYNAMIC 12-COLUMN DASHBOARD SECTIONS GRID (Supports Half-Width Pairs + Minimal + Drag & Drop) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {sectionOrder.map(sectionKey => {
          const isHidden = hiddenMap[sectionKey] === true;
          if (isHidden && !isLayoutEditMode) return null;

          const layout = layoutsMap[sectionKey] || { span: 'full', density: 'full' };
          const span = layout.span === 'half' && sectionKey !== 'top_vip_row' && sectionKey !== 'bento_grid' ? 'half' : 'full';
          const density = layout.density === 'minimal' ? 'minimal' : 'full';

          const content = renderSectionContent(sectionKey, density);
          if (!content && !isLayoutEditMode) return null;

          const colClass = span === 'half' ? 'lg:col-span-6' : 'lg:col-span-12';
          const canResize = sectionKey !== 'top_vip_row' && sectionKey !== 'bento_grid';

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
                      <>
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
                          <span>{span === 'half' ? 'نصف‌عرض (۱/۲)' : 'تمام‌عرض'}</span>
                        </button>

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
                              : 'bg-stone-800 hover:bg-stone-700 text-stone-200'
                          }`}
                        >
                          {density === 'minimal' ? (
                            <Minimize2 className="w-3 h-3" />
                          ) : (
                            <Maximize2 className="w-3 h-3" />
                          )}
                          <span>{density === 'minimal' ? 'نمای مینیمال' : 'نمای کامل'}</span>
                        </button>
                      </>
                    )}

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

      {/* ADMIN LIVE CUSTOMIZER MODAL */}
      <Suspense fallback={null}>
        <ThemeCustomizerModal
          isOpen={isCustomizerOpen}
          onClose={() => setIsCustomizerOpen(false)}
        />
      </Suspense>

      {/* ADMIN HERO STATS CUSTOMIZER MODAL */}
      <CrextioHeroStatsCustomizerModal
        isOpen={isHeroStatsModalOpen}
        onClose={() => setIsHeroStatsModalOpen(false)}
      />
    </motion.div>
  );
};
