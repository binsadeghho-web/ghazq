import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import { resolveProductCoverUrl, resolveShowcaseImageUrl } from '../../data/showcaseImages';
import { toPersianNumbers } from '../../utils/persianNumbers';
import {
  formatPresentersText,
  formatTomans,
  getProductCategoryLabel,
} from '../products/subcomponents/productUiHelpers';
import { ProductIntroModal } from '../products/subcomponents/ProductIntroModal';
import { ProductCheckoutModal } from '../products/subcomponents/ProductCheckoutModal';
import { ProductBuilderModal } from '../products/subcomponents/ProductBuilderModal';
import { ProductLightboxModal } from '../products/subcomponents/ProductLightboxModal';
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
  Eye,
  EyeOff,
  Edit3,
  ShoppingBag,
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
  'counseling_general_showcase',
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
    currentUser,
    crextioConfig,
    rulings,
    researchMentorships,
    courses,
    consultants,
    products,
    productsStoreConfig,
    updateProductsStoreConfig,
    updateProduct,
    toggleProductShowcase,
    purchaseProduct,
  } = useApp();

  const [introProduct, setIntroProduct] = useState<Product | null>(null);
  const [purchasingProduct, setPurchasingProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string; subtitle?: string } | null>(null);
  const [togglingShowcaseId, setTogglingShowcaseId] = useState<string | null>(null);

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

  // Showcase products: newly added products appear here by default (showInShowcase !== false)
  // Admins see all active products so they can activate, deactivate, or edit them right in the showcase
  const showcaseProducts = useMemo(() => {
    return [...products]
      .filter(p => {
        if (p.isDeleted || !p.isAvailable) return false;
        if (currentUser?.role === 'customer' && p.visibleToCustomer === false) return false;
        if (!isAdmin) {
          if (!productsStoreConfig.isStoreEnabled) return false;
          if (p.showInShowcase === false) return false;
          if (productsStoreConfig.enabledCategories?.[p.format] === false) return false;
        }
        return true;
      })
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }, [
    products,
    currentUser?.role,
    isAdmin,
    productsStoreConfig.isStoreEnabled,
    productsStoreConfig.enabledCategories,
  ]);

  const activeShowcaseProductsCount = useMemo(
    () => showcaseProducts.filter(p => p.showInShowcase !== false).length,
    [showcaseProducts]
  );

  const activeIntroProduct = useMemo(() => {
    if (!introProduct) return null;
    return products.find(p => p.id === introProduct.id) || introProduct;
  }, [introProduct, products]);

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
          'درگاه جامع خدمات مشاوره تخصصی و خدمات روانشناختی',
        description:
          crextioConfig.counselingPromoSubtitle ||
          'رزرو نوبت محرمانه با قضات عالی‌رتبه در مسیر ترفیع و اختبار و مشاوران خانواده و تاب‌آوری.',
        highlights: [
          'مشاوره تخصصی مسیر قضایی، اختبار و ترفیع پایه',
          'خدمات روانشناختی و مشاوره خانواده و مدیریت استرس شغلی',
          'محرمانگی کامل و برگزاری حضوری یا آنلاین',
        ],
        targetNav: 'SpecializedCounseling',
        ctaLabel: 'رزرو نوبت مشاوره تخصصی',
        icon: HeartHandshake,
        toneClass: 'text-indigo-700 dark:text-indigo-400',
        statLabel: `${toPersianNumbers(consultants.length)} استاد و مشاور`,
      },
      {
        key: 'counseling_general_showcase',
        shortLabel: 'روانشناختی و مشاوره',
        kicker:
          crextioConfig.counselingGeneralShowcaseBadge || 'سلامت روان و خانواده',
        title:
          crextioConfig.counselingGeneralShowcaseTitle ||
          'خدمات روانشناختی و مشاوره و خانواده',
        description:
          crextioConfig.counselingGeneralShowcaseSubtitle ||
          'دسترسی محرمانه به مشاوران خانواده، زوج‌درمانی، پیش از ازدواج و مدیریت فشارهای روانی شغلی.',
        highlights: [
          'مشاوره پیش از ازدواج، زوج‌درمانی و تحکیم خانواده',
          'مدیریت استرس شغلی و پیشگیری از فرسودگی',
          'پرونده کاملاً محرمانه با یارانه ویژه کانون نخبگان',
        ],
        targetNav: 'CounselingGeneral',
        ctaLabel:
          crextioConfig.counselingGeneralShowcaseBtnText ||
          'ورود به خدمات روانشناختی و مشاوره',
        icon: HeartHandshake,
        toneClass: 'text-rose-700 dark:text-rose-400',
        statLabel: `${toPersianNumbers(
          consultants.filter(c => c.counselingType !== 'specialized_career').length
        )} مشاور خانواده`,
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
        shortLabel: 'محصولات',
        kicker: 'کتب، نشست‌ها و درس‌گفتارها',
        title:
          crextioConfig.booksShowcaseTitle ||
          'کتاب و محصولات چند رسانه‌ای',
        description:
          crextioConfig.booksShowcaseSubtitle ||
          'عرضه کتب مرجع، نشست‌های علمی صوتی و تصویری و درس‌گفتارها با لینک دانلود فایل‌ها پس از ثبت‌نام یا ارسال نسخه فیزیکی.',
        highlights: [
          showcaseProducts[0]?.title || crextioConfig.booksShowcaseDiscountNotice || 'تخفیف ویژه دانش‌آموختگان',
          showcaseProducts[1]?.title || 'موسوعه‌ها، نشست‌های صوتی/تصویری و درس‌گفتارها',
          'دریافت آنی لینک دانلود جلسات پس از ثبت‌نام و تایید سفارش',
        ],
        targetNav: 'Products',
        ctaLabel: 'مشاهده همه محصولات',
        icon: BookMarked,
        toneClass: 'text-purple-700 dark:text-purple-400',
        statLabel: `${toPersianNumbers(activeShowcaseProductsCount)} محصول در ویترین`,
      },
    ],
    [
      crextioConfig,
      visibleRulings,
      researchMentorships,
      courses,
      consultants,
      showcaseProducts,
      activeShowcaseProductsCount,
    ]
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
  const modalOpen = Boolean(introProduct || purchasingProduct || builderOpen || lightboxImage);

  useEffect(() => {
    if (!autoplay || paused || modalOpen || activeItems.length <= 1 || styleMode !== 'cinematic') return;
    const timer = setInterval(() => {
      setSelectedKey(prev => {
        const idx = activeItems.findIndex(i => i.key === prev);
        const nextIdx = idx === -1 ? 0 : (idx + 1) % activeItems.length;
        return activeItems[nextIdx].key;
      });
    }, autoplaySeconds * 1000);
    return () => clearInterval(timer);
  }, [autoplay, paused, modalOpen, activeItems, styleMode, autoplaySeconds]);

  if (activeItems.length === 0) return null;

  const CurrentIcon = currentItem.icon;
  const imgUrl = resolveShowcaseImageUrl(currentItem.key, crextioConfig.showcaseImageOverrides);

  const handleToggleProductInShowcase = async (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setTogglingShowcaseId(product.id);
      await toggleProductShowcase(product.id, product.showInShowcase === false);
    } finally {
      setTogglingShowcaseId(null);
    }
  };

  const handleOpenEditProduct = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProduct(product);
    setBuilderOpen(true);
  };

  const renderShowcaseProductsGrid = (compact = false) => {
    if (showcaseProducts.length === 0) {
      return (
        <div
          className={`p-4 rounded-2xl border text-center text-xs ${
            darkSurface ? 'bg-white/5 border-white/10 text-stone-300' : 'bg-stone-50 border-stone-200 text-stone-500'
          }`}
        >
          در حال حاضر محصول فعالی برای نمایش در ویترین وجود ندارد.
        </div>
      );
    }

    const visibleSlice = showcaseProducts.slice(0, compact ? 4 : 6);

    return (
      <div className={`flex overflow-x-auto snap-x snap-mandatory gap-3 pb-2 scrollbar-none sm:grid ${compact ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2 xl:grid-cols-3'} sm:overflow-visible sm:pb-0`}>
        {visibleSlice.map((prod, idx) => {
          const prodCover = resolveProductCoverUrl(prod.coverImage, prod.format, idx);
          const displayPrice =
            prod.supportsDigital !== false
              ? Number(prod.digitalPrice ?? prod.price ?? 0)
              : Number(prod.physicalPrice ?? prod.price ?? 0);
          const isShown = prod.showInShowcase !== false;

          return (
            <div
              key={prod.id}
              onClick={() => setIntroProduct(prod)}
              className={`min-w-[74vw] sm:min-w-0 snap-start shrink-0 sm:shrink group rounded-2xl border p-3 transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                !isShown ? 'opacity-65 border-dashed ' : ''
              }${
                darkSurface
                  ? 'bg-[#172822] border-white/10 hover:border-amber-400/50 text-white'
                  : 'bg-white border-stone-200 hover:border-emerald-600/40 text-stone-900 shadow-2xs hover:shadow-sm'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <img
                  src={prodCover}
                  alt={prod.title}
                  className="w-14 h-14 rounded-xl object-cover shrink-0 border border-black/10"
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-1 text-[10px] font-bold">
                    <span className={darkSurface ? 'text-amber-300' : 'text-amber-700'}>
                      {getProductCategoryLabel(prod.format, prod.formatTitle, productsStoreConfig)}
                    </span>
                    {isAdmin && !isShown && (
                      <span className="text-rose-500 font-black">مخفی از ویترین</span>
                    )}
                  </div>
                  <h4 className="text-xs font-black line-clamp-1 leading-snug group-hover:text-amber-500 transition-colors">
                    {prod.title}
                  </h4>
                  <p className={`text-[11px] line-clamp-1 ${darkSurface ? 'text-stone-400' : 'text-stone-500'}`}>
                    {formatPresentersText(prod)}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-black/5 dark:border-white/10 flex items-center justify-between gap-2">
                <strong className={`text-xs font-black tabular-nums ${darkSurface ? 'text-emerald-300' : 'text-emerald-700'}`}>
                  {formatTomans(displayPrice)}
                </strong>

                <div className="flex items-center gap-1">
                  {isAdmin && (
                    <>
                      <button
                        type="button"
                        disabled={togglingShowcaseId === prod.id}
                        onClick={e => handleToggleProductInShowcase(prod, e)}
                        title={isShown ? 'غیرفعال کردن در ویترین' : 'فعال کردن در ویترین'}
                        className={`p-1.5 rounded-lg border text-[10px] font-bold cursor-pointer transition-colors ${
                          isShown
                            ? darkSurface
                              ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
                              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : darkSurface
                            ? 'border-white/15 bg-white/5 text-stone-400'
                            : 'border-stone-200 bg-stone-100 text-stone-500'
                        }`}
                      >
                        {isShown ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={e => handleOpenEditProduct(prod, e)}
                        title="ویرایش محصول"
                        className={`p-1.5 rounded-lg border text-[10px] font-bold cursor-pointer transition-colors ${
                          darkSurface
                            ? 'border-white/15 bg-white/5 text-amber-300 hover:bg-white/10'
                            : 'border-stone-200 bg-stone-50 text-amber-700 hover:bg-amber-50'
                        }`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      setPurchasingProduct(prod);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-black flex items-center gap-1 cursor-pointer ${
                      darkSurface
                        ? 'bg-amber-400 hover:bg-amber-300 text-stone-950'
                        : 'bg-emerald-900 hover:bg-emerald-950 text-white'
                    }`}
                  >
                    <ShoppingBag className="w-3 h-3" />
                    <span>مشاهده</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <section
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className={`rounded-2xl sm:rounded-3xl border overflow-hidden transition-colors ${
        darkSurface
          ? 'bg-[#111F1A] border-[#243B32] text-stone-100'
          : 'bg-white border-stone-200/90 text-stone-900 shadow-sm'
      }`}
      dir="rtl"
    >
      {/* Unified Header + Interactive Tab Selector */}
      <div
        className={`${isMicro ? 'px-3.5 py-2.5 space-y-2' : isCompactScale ? 'px-3.5 sm:px-4 py-3 space-y-2.5' : 'px-3.5 sm:px-5 py-3.5 sm:py-4 space-y-3'} border-b ${
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
                {crextioConfig.unifiedShowcaseTitle || 'نمایشگاه جامع خدمات، پژوهش، آموزش و محصولات'}
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
                className={`w-9 h-9 sm:w-8 sm:h-8 rounded-xl sm:rounded-lg border flex items-center justify-center cursor-pointer transition-colors ${
                  darkSurface
                    ? 'border-white/15 text-stone-300 hover:bg-white/10'
                    : 'border-stone-200 text-stone-600 hover:bg-stone-100'
                }`}
              >
                {paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
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

        {/* Interactive Selector Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
          {activeItems.map(item => {
            const Icon = item.icon;
            const isActive = currentItem.key === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setSelectedKey(item.key)}
                className={`relative px-3 py-2 sm:py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 flex items-center gap-1.5 transition-colors cursor-pointer ${
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
        <div className="space-y-4">
          <div className={`${isMicro ? 'p-3 gap-2.5' : isCompactScale ? 'p-3.5 sm:p-4 gap-3' : 'p-3.5 sm:p-5 gap-3 sm:gap-4'} flex overflow-x-auto snap-x snap-mandatory scrollbar-none md:grid md:grid-cols-2 lg:grid-cols-3 md:overflow-visible`}>
            {activeItems.map(item => {
              const Icon = item.icon;
              const thumb = resolveShowcaseImageUrl(item.key, crextioConfig.showcaseImageOverrides);
              return (
                <div
                  key={item.key}
                  onClick={() => onNavigateTab?.(item.targetNav)}
                  className={`min-w-[76vw] sm:min-w-[300px] md:min-w-0 snap-start shrink-0 md:shrink group rounded-2xl border overflow-hidden cursor-pointer transition-all hover:-translate-y-0.5 ${
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

          {includedKeys.includes('books_showcase') && showcaseProducts.length > 0 && (
            <div className={`px-5 pb-5 space-y-3 border-t pt-4 ${darkSurface ? 'border-white/10' : 'border-stone-100'}`}>
              <div className="flex items-center justify-between">
                <h3 className="text-xs sm:text-sm font-black">
                  محصولات، کتب، نشست‌ها و درس‌گفتارهای فعال در ویترین
                </h3>
                <button
                  type="button"
                  onClick={() => onNavigateTab?.('Products')}
                  className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 cursor-pointer hover:underline"
                >
                  <span>مشاهده بخش کامل</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              </div>
              {renderShowcaseProductsGrid(true)}
            </div>
          )}
        </div>
      ) : currentItem.key === 'books_showcase' ? (
        /* Interactive Live Products Showcase Stage inside UnifiedShowcaseHub */
        <AnimatePresence mode="wait">
          <motion.div
            key="books_showcase_live"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className={`${isMicro ? 'p-3.5 space-y-3' : isCompactScale ? 'p-4 space-y-3.5' : 'p-5 sm:p-6 space-y-4'}`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                    {currentItem.kicker}
                  </span>
                  <span className="text-[11px] opacity-60">· {currentItem.statLabel}</span>
                </div>
                <h3 className={`font-black ${isMicro ? 'text-sm' : 'text-base sm:text-lg'} ${darkSurface ? 'text-white' : 'text-stone-900'}`}>
                  {currentItem.title}
                </h3>
                {!isMicro && (
                  <p className={`text-xs ${darkSurface ? 'text-stone-300' : 'text-stone-600'}`}>
                    {currentItem.description}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => onNavigateTab?.('Products')}
                className={`${isMicro ? 'px-3 py-2 text-[11px]' : 'px-4 py-2.5 sm:py-2 text-xs'} w-full sm:w-auto justify-center rounded-xl font-black flex items-center gap-1.5 shrink-0 cursor-pointer transition-all ${
                  darkSurface
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-stone-950'
                    : 'bg-emerald-900 hover:bg-emerald-950 text-white'
                }`}
              >
                <span>{currentItem.ctaLabel}</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            </div>

            {renderShowcaseProductsGrid(isCompactScale || span === 'half')}
          </motion.div>
        </AnimatePresence>
      ) : (
        /* Cinematic Stage View for other tabs */
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
                  ? 'lg:col-span-3 h-24 sm:h-28 lg:h-auto lg:min-h-[140px]'
                  : isCompactScale
                  ? 'lg:col-span-4 h-36 sm:min-h-[175px] lg:min-h-[200px]'
                  : scale === 'expanded'
                  ? 'lg:col-span-5 h-44 sm:min-h-[300px] lg:min-h-[350px]'
                  : 'lg:col-span-5 h-40 sm:min-h-[240px] lg:min-h-[290px]'
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
                className={`${isMicro ? 'pt-2' : 'pt-3'} border-t flex flex-wrap items-center justify-between gap-2.5 ${
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
                  className={`${isMicro ? 'px-3 py-2 text-[11px]' : 'px-4 py-2.5 sm:py-2 text-xs'} w-full sm:w-auto justify-center rounded-xl font-black flex items-center gap-2 transition-all cursor-pointer active:scale-95 ${
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

      {/* Interactive Product Modals launched directly from Showcase */}
      <ProductIntroModal
        product={activeIntroProduct}
        storeConfig={productsStoreConfig}
        isOfficial={isAdmin}
        onClose={() => setIntroProduct(null)}
        onOpenPurchase={setPurchasingProduct}
        onOpenLightbox={setLightboxImage}
      />

      <ProductCheckoutModal
        product={purchasingProduct}
        currentUser={currentUser}
        storeConfig={productsStoreConfig}
        onClose={() => setPurchasingProduct(null)}
        onSubmitPurchase={payload => {
          if (!purchasingProduct) {
            return Promise.reject(new Error('محصول انتخاب نشده است'));
          }
          return purchaseProduct(purchasingProduct.id, payload);
        }}
      />

      <ProductBuilderModal
        isOpen={builderOpen}
        editingProduct={editingProduct}
        storeConfig={productsStoreConfig}
        onClose={() => {
          setBuilderOpen(false);
          setEditingProduct(null);
        }}
        onSave={async (payload, editingId) => {
          if (editingId) {
            await updateProduct(editingId, payload);
          }
        }}
        onUpdateStoreConfig={updateProductsStoreConfig}
      />

      <ProductLightboxModal
        image={lightboxImage}
        onClose={() => setLightboxImage(null)}
      />
    </section>
  );
};
