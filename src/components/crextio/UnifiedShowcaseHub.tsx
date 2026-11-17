import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { resolveShowcaseImageUrl } from '../../data/showcaseImages';
import { toPersianNumbers } from '../../utils/persianNumbers';
import {
  Scale,
  Compass,
  GraduationCap,
  HeartHandshake,
  Gift,
  Headphones,
  BookMarked,
  ArrowLeft,
  Sliders,
  Sparkles,
  CheckCircle2,
  Pause,
  Play,
} from 'lucide-react';

interface UnifiedShowcaseHubProps {
  span?: 'full' | 'half';
  scale?: 'micro' | 'compact' | 'normal' | 'expanded';
  darkSurface?: boolean;
  isAdmin?: boolean;
  onNavigateTab?: (tab: string) => void;
  onOpenEditor?: () => void;
}

interface ShowcaseMetaItem {
  key: string;
  shortLabel: string;
  kicker: string;
  title: string;
  description: string;
  highlights: string[];
  targetNav: string;
  ctaLabel: string;
  icon: any;
  toneClass: string;
  statLabel: string;
}

export const ALL_UNIFIED_SHOWCASE_KEYS = [
  'rulings_showcase',
  'research_promo',
  'course_showcase',
  'counseling_promo',
  'welfare_showcase',
  'multimedia_showcase',
  'books_showcase',
];

export const UnifiedShowcaseHub: React.FC<UnifiedShowcaseHubProps> = ({
  span = 'full',
  scale = 'normal',
  darkSurface = false,
  isAdmin = false,
  onNavigateTab,
  onOpenEditor,
}) => {
  const {
    crextioConfig,
    rulings,
    researchMentorships,
    courses,
    consultants,
    products,
  } = useApp();

  const includedKeys = useMemo(() => {
    const list = crextioConfig.unifiedShowcaseIncludedKeys;
    if (Array.isArray(list) && list.length > 0) {
      return list.filter(k => ALL_UNIFIED_SHOWCASE_KEYS.includes(k));
    }
    return ALL_UNIFIED_SHOWCASE_KEYS;
  }, [crextioConfig.unifiedShowcaseIncludedKeys]);

  const visibleRulings = useMemo(() => {
    const sorted = [...rulings].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
    if (isAdmin) return sorted;
    return sorted.filter(r => r.status === 'selected' && r.isVisibleToAlumni !== false);
  }, [rulings, isAdmin]);

  const catalog: ShowcaseMetaItem[] = useMemo(
    () => [
      {
        key: 'rulings_showcase',
        shortLabel: 'تالار آراء',
        kicker: 'مباحثه و نقد قضایی',
        title: crextioConfig.rulingsShowcaseTitle || 'تالار نقد و مباحثه آراء قضایی',
        description:
          crextioConfig.rulingsShowcaseSubtitle ||
          'تحلیل مستند رویه‌های قضایی، دادنامه‌های منتخب دیوان عالی و تبادل استدلال فقهی-حقوقی اعضا.',
        highlights: [
          visibleRulings[0]?.title || 'نقد آراء وحدت رویه و پرونده‌های چالشی',
          'ثبت استدلال فقهی و رأی مشورتی قضات عضو',
          'دسته‌بندی تخصصی حقوقی، کیفری، خانواده و تجاری',
        ],
        targetNav: 'Rulings',
        ctaLabel: 'ورود به تالار آراء',
        icon: Scale,
        toneClass: 'text-amber-600 dark:text-amber-400',
        statLabel: `${toPersianNumbers(visibleRulings.length)} دادنامه فعال`,
      },
      {
        key: 'research_promo',
        shortLabel: 'راهبری پژوهش',
        kicker: 'حمایت علمی و پایان‌نامه',
        title:
          crextioConfig.researchPromoTitle ||
          'باشگاه راهبری پژوهش، رساله‌ها و پایان‌نامه‌ها',
        description:
          crextioConfig.researchPromoSubtitle ||
          'همراهی با اساتید راهنمای طراز اول، تخصیص گرنت پژوهشی تا سقف ۵۰ میلیون تومان و اسکان علمی در مشهد و قم.',
        highlights: [
          'تخصیص گرنت پژوهشی و حمایت از تدوین رساله',
          'اسکان پژوهشی رایگان در جوار کتابخانه‌های مرجع',
          'چاپ و نشر رساله‌های برگزیده با نشان مجمع',
        ],
        targetNav: 'Research',
        ctaLabel: 'ورود به میز پژوهش',
        icon: Compass,
        toneClass: 'text-emerald-700 dark:text-emerald-400',
        statLabel: `${toPersianNumbers(researchMentorships.length)} پرونده پژوهشی`,
      },
      {
        key: 'course_showcase',
        shortLabel: 'دوره‌های علمی',
        kicker: 'آموزش و کارگاه‌های مهارتی',
        title:
          crextioConfig.courseShowcaseTitle ||
          'دوره‌ها و کارگاه‌های تخصصی فقه القضا',
        description:
          crextioConfig.courseShowcaseSubtitle ||
          'کارگاه‌های کاربردی ادله اثبات دعوا، مهارت‌های قضایی و صدور گواهینامه معتبر پایان دوره.',
        highlights: [
          courses[0]?.title || 'دوره‌های کاربردی ویژه قضات و پژوهشگران',
          'گواهینامه معتبر و حضور و غیاب منعطف جلسات',
          'دسترسی به فایل‌ها و منابع آموزشی هر دوره',
        ],
        targetNav: 'Courses',
        ctaLabel: 'مشاهده دوره‌ها و ثبت‌نام',
        icon: GraduationCap,
        toneClass: 'text-sky-700 dark:text-sky-400',
        statLabel: `${toPersianNumbers(courses.length)} دوره فعال`,
      },
      {
        key: 'counseling_promo',
        shortLabel: 'مشاوره نخبگان',
        kicker: 'هدایت شغلی و سلامت روان',
        title:
          crextioConfig.counselingPromoTitle ||
          'درگاه جامع خدمات مشاوره تخصصی و عمومی',
        description:
          crextioConfig.counselingPromoSubtitle ||
          'رزرو نوبت محرمانه با قضات عالی‌رتبه در مسیر ترفیع و اختبار و مشاوران خانواده و تاب‌آوری.',
        highlights: [
          'مشاوره تخصصی مسیر قضایی، اختبار و ترفیع پایه',
          'مشاوره عمومی خانواده و مدیریت استرس شغلی',
          'محرمانگی کامل و برگزاری حضوری یا آنلاین',
        ],
        targetNav: 'SpecializedCounseling',
        ctaLabel: 'رزرو نوبت مشاوره',
        icon: HeartHandshake,
        toneClass: 'text-indigo-700 dark:text-indigo-400',
        statLabel: `${toPersianNumbers(consultants.length)} استاد و مشاور`,
      },
      {
        key: 'welfare_showcase',
        shortLabel: 'رفاهیات',
        kicker: 'تسهیلات و اقامتگاه‌ها',
        title:
          crextioConfig.welfareShowcaseTitle ||
          'خدمات رفاهی، وام قرض‌الحسنه و اسکان زیارتی',
        description:
          crextioConfig.welfareShowcaseSubtitle ||
          'ثبت درخواست اسکان در مشهد و قم، تسهیلات قرض‌الحسنه صندوق حامی و بسته‌های رفاهی تعاونی اعضا.',
        highlights: [
          crextioConfig.welfareShowcaseLoanAmount || 'وام قرض‌الحسنه تا سقف ۲۰۰ میلیون تومان',
          'رزرو مستقیم اقامتگاه‌های علمی و زیارتی مشهد و قم',
          'پیگیری شفاف وضعیت درخواست‌های رفاهی',
        ],
        targetNav: 'Welfare',
        ctaLabel: 'میز کار رفاهیات',
        icon: Gift,
        toneClass: 'text-teal-700 dark:text-teal-400',
        statLabel: 'پشتیبانی اعضا',
      },
      {
        key: 'multimedia_showcase',
        shortLabel: 'درس‌گفتارها',
        kicker: 'آرشیو صوت و تصویر',
        title:
          crextioConfig.multimediaShowcaseTitle ||
          'آرشیو درس‌گفتارها و نشست‌های چندرسانه‌ای',
        description:
          crextioConfig.multimediaShowcaseSubtitle ||
          'دسترسی به فایل‌های ضبط‌شده دروس خارج فقه القضا و نشست‌های تخصصی تحلیل رویه‌های قضایی.',
        highlights: [
          `${crextioConfig.multimediaLecturesCount || '۴۸ جلسه'} درس‌گفتار تخصصی`,
          'طبقه‌بندی‌شده بر اساس موضوعات قضایی و فقهی',
          'دسترسی آسان برای دانش‌آموختگان سراسر کشور',
        ],
        targetNav: 'Courses',
        ctaLabel: 'ورود به آرشیو علمی',
        icon: Headphones,
        toneClass: 'text-blue-700 dark:text-blue-400',
        statLabel: crextioConfig.multimediaLecturesCount || '۴۸ جلسه',
      },
      {
        key: 'books_showcase',
        shortLabel: 'کتب و منشورات',
        kicker: 'مرکز نشر نخبگان',
        title:
          crextioConfig.booksShowcaseTitle ||
          'منشورات، موسوعه‌ها و کتب مرجع فقه و قضا',
        description:
          crextioConfig.booksShowcaseSubtitle ||
          'تهیه کتب تالیفی اساتید، تقریرات فقهی و مجموعه‌های حقوقی با تخفیف ویژه اعضای مجمع.',
        highlights: [
          crextioConfig.booksShowcaseDiscountNotice || 'تخفیف ویژه دانش‌آموختگان',
          products[0]?.title || 'موسوعه‌ها و کتب مرجع تخصصی قضا',
          'ارسال پستی یا تحویل حضوری در دبیرخانه',
        ],
        targetNav: 'Products',
        ctaLabel: 'مشاهده منشورات',
        icon: BookMarked,
        toneClass: 'text-purple-700 dark:text-purple-400',
        statLabel: `${toPersianNumbers(products.length)} اثر تخصصی`,
      },
    ],
    [crextioConfig, visibleRulings, researchMentorships, courses, consultants, products]
  );

  const activeItems = useMemo(
    () => catalog.filter(item => includedKeys.includes(item.key)),
    [catalog, includedKeys]
  );

  const [selectedKey, setSelectedKey] = useState<string>(activeItems[0]?.key || 'research_promo');
  const [paused, setPaused] = useState(false);

  const currentItem =
    activeItems.find(item => item.key === selectedKey) || activeItems[0] || catalog[0];

  const styleMode = crextioConfig.unifiedShowcaseStyle || 'cinematic';
  const autoplay = crextioConfig.unifiedShowcaseAutoplay !== false;
  const autoplaySeconds = Math.max(1, Number(crextioConfig.unifiedShowcaseAutoplaySeconds) || 4);
  const isMicro = scale === 'micro';
  const isCompactScale = scale === 'compact' || isMicro;

  useEffect(() => {
    if (!autoplay || paused || activeItems.length <= 1 || styleMode !== 'cinematic') return;
    const timer = setInterval(() => {
      setSelectedKey(prev => {
        const idx = activeItems.findIndex(i => i.key === prev);
        const nextIdx = idx === -1 ? 0 : (idx + 1) % activeItems.length;
        return activeItems[nextIdx].key;
      });
    }, autoplaySeconds * 1000);
    return () => clearInterval(timer);
  }, [autoplay, paused, activeItems, styleMode, autoplaySeconds]);

  if (activeItems.length === 0) return null;

  const CurrentIcon = currentItem.icon;
  const imgUrl = resolveShowcaseImageUrl(currentItem.key, crextioConfig.showcaseImageOverrides);

  return (
    <section
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className={`rounded-3xl border overflow-hidden transition-colors ${
        darkSurface
          ? 'bg-[#111F1A] border-[#243B32] text-stone-100'
          : 'bg-white border-stone-200/90 text-stone-900 shadow-sm'
      }`}
      dir="rtl"
    >
      {/* Unified Header + Interactive Tab Selector */}
      <div
        className={`${isMicro ? 'px-3.5 py-2.5 space-y-2' : isCompactScale ? 'px-4 py-3 space-y-2.5' : 'px-5 py-4 space-y-3'} border-b ${
          darkSurface ? 'border-white/10 bg-[#14251F]' : 'border-stone-100 bg-stone-50/60'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className={`${isMicro ? 'w-7 h-7 rounded-lg' : 'w-9 h-9 rounded-xl'} flex items-center justify-center shrink-0 ${
                darkSurface
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-emerald-900 text-amber-300'
              }`}
            >
              <Sparkles className={isMicro ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
            </div>
            <div className="min-w-0">
              <h2
                className={`${isMicro ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'} font-black truncate ${
                  darkSurface ? 'text-white' : 'text-stone-900'
                }`}
              >
                {crextioConfig.unifiedShowcaseTitle || 'نمایشگاه جامع خدمات، پژوهش، آموزش و تالارها'}
              </h2>
              {span === 'full' && !isMicro && (
                <p
                  className={`text-[11px] truncate ${
                    darkSurface ? 'text-stone-400' : 'text-stone-500'
                  }`}
                >
                  {crextioConfig.unifiedShowcaseSubtitle ||
                    'مرور یکپارچه ویترین‌های تخصصی در یک قاب متمرکز'}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {styleMode === 'cinematic' && activeItems.length > 1 && (
              <button
                type="button"
                onClick={() => setPaused(p => !p)}
                title={paused ? 'پخش خودکار' : 'توقف'}
                className={`w-7 h-7 rounded-lg border flex items-center justify-center cursor-pointer transition-colors ${
                  darkSurface
                    ? 'border-white/15 text-stone-300 hover:bg-white/10'
                    : 'border-stone-200 text-stone-600 hover:bg-stone-100'
                }`}
              >
                {paused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
              </button>
            )}

            {isAdmin && onOpenEditor && (
              <button
                type="button"
                onClick={onOpenEditor}
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border flex items-center gap-1.5 cursor-pointer transition-colors ${
                  darkSurface
                    ? 'bg-white/10 hover:bg-white/15 border-white/15 text-emerald-300'
                    : 'bg-white hover:bg-stone-100 border-stone-200 text-stone-800'
                }`}
              >
                <Sliders className="w-3 h-3" />
                <span>انتخاب ویترین‌های زیرمجموعه</span>
              </button>
            )}
          </div>
        </div>

        {/* Interactive Selector Tabs with Spring Underline */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
          {activeItems.map(item => {
            const Icon = item.icon;
            const isActive = currentItem.key === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setSelectedKey(item.key)}
                className={`relative px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isActive
                    ? darkSurface
                      ? 'text-stone-950'
                      : 'text-white'
                    : darkSurface
                    ? 'text-stone-300 hover:bg-white/10'
                    : 'text-stone-600 hover:bg-stone-200/70'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="unifiedShowcaseActiveTab"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    className={`absolute inset-0 rounded-xl ${
                      darkSurface ? 'bg-amber-400' : 'bg-emerald-900'
                    }`}
                  />
                )}
                <Icon className="w-3.5 h-3.5 relative z-10 shrink-0" />
                <span className="relative z-10">{item.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Body Stage */}
      {styleMode === 'tabbed_grid' ? (
        <div className={`${isMicro ? 'p-3 gap-2.5' : isCompactScale ? 'p-4 gap-3' : 'p-5 gap-4'} grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3`}>
          {activeItems.map(item => {
            const Icon = item.icon;
            const thumb = resolveShowcaseImageUrl(item.key, crextioConfig.showcaseImageOverrides);
            return (
              <div
                key={item.key}
                onClick={() => onNavigateTab?.(item.targetNav)}
                className={`group rounded-2xl border overflow-hidden cursor-pointer transition-all hover:-translate-y-0.5 ${
                  darkSurface
                    ? 'bg-[#172822] border-white/10 hover:border-emerald-500/40'
                    : 'bg-stone-50/70 border-stone-200 hover:border-emerald-600/40 hover:bg-white'
                }`}
              >
                {thumb && (
                  <div className={`relative ${isMicro ? 'h-20' : isCompactScale ? 'h-24' : 'h-28'} w-full overflow-hidden`}>
                    <img
                      src={thumb}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <span className="absolute bottom-2 right-3 text-[11px] font-bold text-amber-300">
                      {item.kicker}
                    </span>
                  </div>
                )}
                <div className="p-3.5 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 ${item.toneClass}`} />
                      <h3 className="text-xs font-extrabold truncate">{item.title}</h3>
                    </div>
                  </div>
                  <p
                    className={`text-[11px] line-clamp-2 leading-relaxed ${
                      darkSurface ? 'text-stone-400' : 'text-stone-600'
                    }`}
                  >
                    {item.description}
                  </p>
                  <div className="pt-2 flex items-center justify-between text-[11px] font-bold">
                    <span className={darkSurface ? 'text-stone-400' : 'text-stone-500'}>
                      {item.statLabel}
                    </span>
                    <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      <span>{item.ctaLabel}</span>
                      <ArrowLeft className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Cinematic Stage View */
        <AnimatePresence mode="wait">
          <motion.div
            key={currentItem.key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className={`grid grid-cols-1 ${
              span === 'half' ? '' : 'lg:grid-cols-12'
            } items-stretch`}
          >
            {/* Visual Stage Column */}
            <div
              className={`${
                span === 'half'
                  ? isMicro
                    ? 'h-24'
                    : isCompactScale
                    ? 'h-32'
                    : scale === 'expanded'
                    ? 'h-56'
                    : 'h-44'
                  : isMicro
                  ? 'lg:col-span-3 h-28 lg:h-auto lg:min-h-[140px]'
                  : isCompactScale
                  ? 'lg:col-span-4 min-h-[175px] lg:min-h-[200px]'
                  : scale === 'expanded'
                  ? 'lg:col-span-5 min-h-[300px] lg:min-h-[350px]'
                  : 'lg:col-span-5 min-h-[240px] lg:min-h-[290px]'
              } relative overflow-hidden bg-stone-900`}
            >
              {imgUrl && (
                <motion.img
                  src={imgUrl}
                  alt={currentItem.title}
                  referrerPolicy="no-referrer"
                  initial={{ scale: 1.05 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 5, ease: 'easeOut' }}
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
              <div className={`absolute ${isMicro ? 'bottom-2.5 right-3 left-3' : 'bottom-4 right-5 left-5'} text-white flex items-end justify-between gap-2`}>
                <div>
                  <span className="text-[10px] font-bold text-amber-300 block">
                    {currentItem.kicker}
                  </span>
                  <span className={`${isMicro ? 'text-xs' : 'text-sm'} font-black tabular-nums`}>{currentItem.statLabel}</span>
                </div>
                {!isMicro && (
                  <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center">
                    <CurrentIcon className="w-5 h-5 text-amber-300" />
                  </div>
                )}
              </div>
            </div>

            {/* Content & Highlights Column */}
            <div
              className={`${
                span === 'half'
                  ? isMicro
                    ? 'p-3 gap-2'
                    : isCompactScale
                    ? 'p-3.5 gap-2.5'
                    : 'p-4 gap-3'
                  : isMicro
                  ? 'lg:col-span-9 p-3.5 sm:px-5 sm:py-3 gap-2'
                  : isCompactScale
                  ? 'lg:col-span-8 p-4 gap-3'
                  : 'lg:col-span-7 p-5 sm:p-6 gap-4'
              } flex flex-col justify-between`}
            >
              <div className={isMicro ? 'space-y-1.5' : 'space-y-3'}>
                <h3
                  className={`font-black leading-snug ${
                    isMicro
                      ? 'text-xs sm:text-sm line-clamp-1'
                      : span === 'half'
                      ? 'text-base'
                      : 'text-lg sm:text-xl'
                  } ${darkSurface ? 'text-white' : 'text-stone-900'}`}
                >
                  {currentItem.title}
                </h3>

                <p
                  className={`${isMicro ? 'text-[11px] line-clamp-1' : isCompactScale ? 'text-xs line-clamp-2' : 'text-xs sm:text-[13px]'} leading-relaxed ${
                    darkSurface ? 'text-stone-300' : 'text-stone-600'
                  }`}
                >
                  {currentItem.description}
                </p>

                {!isCompactScale && (
                  <ul className="space-y-1.5 pt-1">
                    {currentItem.highlights.map((hl, i) => (
                      <li
                        key={i}
                        className={`flex items-center gap-2 text-xs font-medium ${
                          darkSurface ? 'text-stone-200' : 'text-stone-700'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>{hl}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div
                className={`${isMicro ? 'pt-2' : 'pt-3'} border-t flex flex-wrap items-center justify-between gap-2 ${
                  darkSurface ? 'border-white/10' : 'border-stone-100'
                }`}
              >
                <span
                  className={`text-[11px] font-semibold ${
                    darkSurface ? 'text-stone-400' : 'text-stone-500'
                  }`}
                >
                  {toPersianNumbers(activeItems.length)} ویترین · هر {toPersianNumbers(autoplaySeconds)} ثانیه
                </span>

                <button
                  type="button"
                  onClick={() => onNavigateTab?.(currentItem.targetNav)}
                  className={`${isMicro ? 'px-3 py-1.5 text-[11px]' : 'px-4 py-2 text-xs'} rounded-xl font-black flex items-center gap-2 transition-all cursor-pointer active:scale-95 ${
                    darkSurface
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-stone-950'
                      : 'bg-emerald-900 hover:bg-emerald-950 text-white'
                  }`}
                >
                  <span>{currentItem.ctaLabel}</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </section>
  );
};
