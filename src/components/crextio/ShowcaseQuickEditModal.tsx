import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CrextioDashboardConfig } from '../../types';
import { api } from '../../services/apiClient';
import { resolveShowcaseImageUrl } from '../../data/showcaseImages';
import {
  X,
  Upload,
  RotateCcw,
  Loader2,
  Image as ImageIcon,
  Type,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface ShowcaseQuickEditModalProps {
  sectionKey: string | null;
  sectionLabel: string;
  currentDensity: 'full' | 'minimal';
  hasClassicMinimalToggle: boolean;
  crextioConfig: CrextioDashboardConfig;
  updateCrextioConfig: (updates: Partial<CrextioDashboardConfig>) => void;
  onClose: () => void;
  onOpenStudioTab?: (tab: 'hero_quick' | 'all_banners' | 'layout_boxes' | 'honors_unified') => void;
  onSavedToast?: (msg: string) => void;
}

interface TextFieldSpec {
  configKey: keyof CrextioDashboardConfig;
  label: string;
  placeholder?: string;
  multiline?: boolean;
  defaultValue: string;
}

const IMAGE_KEY_MAP: Record<string, string> = {
  top_vip_row: 'hero_portrait',
  honors_showcase: 'honors_showcase',
  unified_showcase: 'unified_showcase',
  rulings_showcase: 'rulings_showcase',
  research_promo: 'research_promo',
  course_showcase: 'course_showcase',
  counseling_promo: 'counseling_promo',
  counseling_general_showcase: 'counseling_general_showcase',
  welfare_showcase: 'welfare_showcase',
  multimedia_showcase: 'multimedia_showcase',
  books_showcase: 'books_showcase',
};

const MINIMAL_DEFAULTS_MAP: Record<
  string,
  { kicker: string; title: string; description: string; ctaLabel: string }
> = {
  rulings_showcase: {
    kicker: 'مباحثات تخصصی قضایی',
    title: 'تالار نقد و مباحثه آراء قضایی',
    description:
      'بررسی استدلال‌های حقوقی، نقد رویه قضایی و تبادل نظر نخبگان بر روی آراء منتخب.',
    ctaLabel: 'ورود به تالار آراء',
  },
  research_promo: {
    kicker: 'حمایت و هدایت پژوهشی',
    title: 'راهبری پژوهش‌ها، رساله‌ها و پایان‌نامه‌ها',
    description:
      'همراهی با اساتید راهنمای طراز اول، تخصیص گرنت پژوهشی و تسهیل اسکان علمی برای پیشبرد پژوهش‌ها.',
    ctaLabel: 'میز راهبری پژوهش',
  },
  course_showcase: {
    kicker: 'توانمندسازی علمی و کارگاه‌ها',
    title: 'دوره‌ها و کارگاه‌های تخصصی',
    description:
      'نشست‌ها و دوره‌های مهارتی فقه القضا، آیین دادرسی و کارگاه‌های علمی دانش‌آموختگان.',
    ctaLabel: 'مشاهده دوره‌ها',
  },
  counseling_promo: {
    kicker: 'هدایت شغلی، علمی و سلامت روان',
    title: 'خدمات مشاوره نخبگان (تخصصی)',
    description:
      'دریافت نوبت محرمانه مشاوره تخصصی قضایی-تحصیلی و راهنمایی ارتقای شغلی با اساتید برجسته.',
    ctaLabel: 'مشاوره شغلی قضا',
  },
  counseling_general_showcase: {
    kicker: 'سلامت روان، خانواده و تاب‌آوری',
    title: 'خدمات مشاوره عمومی و خانواده',
    description:
      'دریافت نوبت محرمانه مشاوره خانواده، زوج‌درمانی، پیش از ازدواج و مدیریت استرس شغلی.',
    ctaLabel: 'مشاوره عمومی و خانواده',
  },
  welfare_showcase: {
    kicker: 'خدمات رفاهی و تسهیلات اعضا',
    title: 'رفاهیات، اقامتگاه‌ها و صندوق تعاون',
    description:
      'ثبت درخواست اسکان زیارتی و پژوهشی در مشهد و قم، تسهیلات قرض‌الحسنه و تعاونی اعضا.',
    ctaLabel: 'ورود به میز رفاهیات',
  },
  multimedia_showcase: {
    kicker: 'آرشیو علمی و درس‌گفتارها',
    title: 'آرشیو صوت و تصویر درس‌گفتارها',
    description:
      'دسترسی به جلسات ضبط‌شده خارج فقه القضا و نشست‌های تحلیل قضایی.',
    ctaLabel: 'مشاهده آرشیو',
  },
  books_showcase: {
    kicker: 'مرکز نشر و رسانه',
    title: 'کتاب و محصولات چند رسانه‌ای',
    description:
      'عرضه کتب تخصصی، محصولات چندرسانه‌ای و صوت با انتخاب نسخه دیجیتال یا فیزیکی.',
    ctaLabel: 'ورود به کتاب و محصولات چند رسانه‌ای',
  },
};

const CLASSIC_FIELDS_MAP: Record<string, TextFieldSpec[]> = {
  top_vip_row: [
    {
      configKey: 'heroBadgeText',
      label: 'نشان بالای بنر خوش‌آمدگویی',
      defaultValue: 'میزان · پرتال و ویترین خدمات نخبگان',
    },
    {
      configKey: 'heroTitle',
      label: 'تیتر اصلی بنر خوش‌آمدگویی',
      defaultValue: 'سامانه و ویترین خدمات دانش‌آموختگان فقه و قضا',
    },
    {
      configKey: 'heroSubtitle',
      label: 'توضیح زیر تیتر بنر',
      multiline: true,
      defaultValue:
        'دسترسی سریع به کارتابل اداری، گالری دوره‌های آموزشی، انتشارات و تالار آراء',
    },
    {
      configKey: 'heroSchemeLabel',
      label: 'عنوان طرح (سمت راست بنر)',
      defaultValue: 'طرح میزان',
    },
  ],
  honors_showcase: [
    {
      configKey: 'honorsShowcaseTitle',
      label: 'عنوان ویترین افتخارات و انتصابات',
      defaultValue: 'تالار افتخارات، انتصابات و دستاوردهای نخبگان',
    },
    {
      configKey: 'honorsShowcaseSubtitle',
      label: 'زیرعنوان ویترین افتخارات',
      multiline: true,
      defaultValue:
        'تبریک انتصابات قضایی، رتبه‌های برتر علمی و مفاخر مجمع دانش‌آموختگان فقه و قضا',
    },
  ],
  unified_showcase: [
    {
      configKey: 'unifiedShowcaseTitle',
      label: 'عنوان ویترین جامع یکپارچه',
      defaultValue: 'نمایشگاه جامع خدمات، پژوهش، آموزش و تالارها',
    },
    {
      configKey: 'unifiedShowcaseSubtitle',
      label: 'توضیح ویترین جامع',
      multiline: true,
      defaultValue: 'مرور یکپارچه ویترین‌های تخصصی در یک قاب متمرکز',
    },
  ],
  rulings_showcase: [
    {
      configKey: 'rulingsShowcaseBadge',
      label: 'نشان بالای ویترین آراء',
      defaultValue: 'آراء بحث‌برانگیز و منتخب دیوان و تجدیدنظر',
    },
    {
      configKey: 'rulingsShowcaseTitle',
      label: 'عنوان ویترین تالار آراء',
      defaultValue: 'تالار نقد، ارزیابی و مباحثه آراء و دادنامه‌های قضایی',
    },
    {
      configKey: 'rulingsShowcaseSubtitle',
      label: 'توضیح ویترین تالار آراء',
      multiline: true,
      defaultValue:
        'میدان تحلیل رویه‌های قضایی، آراء وحدت رویه و نقدهای حقوقی مستند دانش‌آموختگان نخبه',
    },
    {
      configKey: 'rulingsPrimaryBtnText',
      label: 'متن دکمه ورود به تالار',
      defaultValue: 'ورود به تالار آراء',
    },
  ],
  research_promo: [
    {
      configKey: 'researchPromoBadge',
      label: 'نشان بالای ویترین پژوهش',
      defaultValue: 'حمایت مادی و معنوی ویژه نخبگان',
    },
    {
      configKey: 'researchPromoTitle',
      label: 'عنوان ویترین راهبری پژوهش',
      defaultValue:
        'باشگاه نخبگانی راهبری رساله‌ها، پایان‌نامه‌ها و پژوهش‌های تحول قضایی',
    },
    {
      configKey: 'researchPromoSubtitle',
      label: 'توضیحات ویترین پژوهش',
      multiline: true,
      defaultValue:
        'تطبیق با اساتید برجسته خارج فقه و دکتری، تخصیص گرنت پژوهشی، چاپ کتاب و دفاع مقتدرانه',
    },
    {
      configKey: 'researchPromoGrantAmount',
      label: 'متن مبلغ گرنت و اسکان',
      defaultValue: 'تا ۵۰ میلیون تومان گرنت پژوهشی + اسکان مشهد و قم',
    },
    {
      configKey: 'researchPromoPrimaryBtnText',
      label: 'متن دکمه اول (اصلی)',
      defaultValue: 'ثبت فوری پروپوزال و دریافت اسکان',
    },
    {
      configKey: 'researchPromoSecondaryBtnText',
      label: 'متن دکمه دوم',
      defaultValue: 'میز کار راهبری پژوهش',
    },
  ],
  course_showcase: [
    {
      configKey: 'courseShowcaseBadge',
      label: 'نشان بالای ویترین دوره‌ها',
      defaultValue: 'کارگاه‌های عالی فقه و قضا',
    },
    {
      configKey: 'courseShowcaseTitle',
      label: 'عنوان ویترین دوره‌ها',
      defaultValue: 'دوره‌ها و کارگاه‌های تخصصی توانمندسازی علمی و قضایی',
    },
    {
      configKey: 'courseShowcaseSubtitle',
      label: 'توضیح ویترین دوره‌ها',
      multiline: true,
      defaultValue:
        'آرشیو صوت و تصویر جلسات، اسناد فقه کاربردی و کارگاه‌های عالی فقه القضا',
    },
    {
      configKey: 'courseShowcaseCtaText',
      label: 'متن دکمه اقدام',
      defaultValue: 'مشاهده همه دوره‌ها و ثبت‌نام',
    },
  ],
  counseling_promo: [
    {
      configKey: 'counselingPromoBadge',
      label: 'نشان بالای ویترین مشاوره',
      defaultValue: 'هدایت علمی، شغلی و روانی نخبگان',
    },
    {
      configKey: 'counselingPromoTitle',
      label: 'عنوان ویترین مشاوره نخبگان',
      defaultValue: 'ویترین و درگاه جامع خدمات مشاوره نخبگان',
    },
    {
      configKey: 'counselingPromoSubtitle',
      label: 'توضیح ویترین مشاوره',
      multiline: true,
      defaultValue:
        'مشاوره تخصصی تحصیلی-شغلی قضایی و خدمات روان‌شناختی، خانواده و تاب‌آوری',
    },
    {
      configKey: 'counselingPromoSpecializedTitle',
      label: 'تیتر بخش مشاوره تخصصی شغلی',
      defaultValue: 'مشاوره تخصصی شغلی و تحصیلی قضاوت',
    },
    {
      configKey: 'counselingPromoSpecializedBtnText',
      label: 'دکمه مشاوره تخصصی',
      defaultValue: 'رزرو مشاوره تخصصی شغلی',
    },
  ],
  counseling_general_showcase: [
    {
      configKey: 'counselingGeneralShowcaseBadge',
      label: 'نشان بالای ویترین مشاوره عمومی',
      defaultValue: 'آرامش روانی، سلامت خانواده و تاب‌آوری',
    },
    {
      configKey: 'counselingGeneralShowcaseTitle',
      label: 'عنوان ویترین مشاوره عمومی',
      defaultValue: 'ویترین خدمات مشاوره عمومی، خانواده و روان‌شناختی',
    },
    {
      configKey: 'counselingGeneralShowcaseSubtitle',
      label: 'زیرعنوان ویترین مشاوره عمومی',
      defaultValue:
        'دسترسی محرمانه به مشاوران خانواده، زوج‌درمانی، پیش از ازدواج و مدیریت فشارهای روانی شغلی',
    },
    {
      configKey: 'counselingGeneralShowcaseDesc',
      label: 'متن توضیحات کامل باکس',
      multiline: true,
      defaultValue:
        'کلینیک تخصصی مشاوره عمومی و خانواده مرکز فقه و قضا با حضور مجرب‌ترین روان‌شناسان و مشاوران، خدماتی کاملاً محرمانه برای تحکیم بنیان خانواده و تاب‌آوری شغلی اعضا ارائه می‌دهد.',
    },
    {
      configKey: 'counselingGeneralShowcaseBtnText',
      label: 'متن دکمه اقدام',
      defaultValue: 'ورود به خدمات مشاوره عمومی و نوبت‌دهی',
    },
  ],
  welfare_showcase: [
    {
      configKey: 'welfareShowcaseBadge',
      label: 'نشان بالای ویترین رفاهیات',
      defaultValue: 'صندوق رفاه نخبگان حوزوی و قضایی',
    },
    {
      configKey: 'welfareShowcaseTitle',
      label: 'عنوان ویترین رفاهیات',
      defaultValue: 'ویترین خدمات رفاهی، تسهیلات و اقامتگاه‌های زیارتی',
    },
    {
      configKey: 'welfareShowcaseSubtitle',
      label: 'توضیح ویترین رفاهیات',
      multiline: true,
      defaultValue:
        'وام قرض‌الحسنه صندوق حامی، اقامتگاه‌های مشهد و قم، خدمات درمانی و بن‌های خرید تعاونی',
    },
    {
      configKey: 'welfareShowcaseLoanAmount',
      label: 'سقف وام نمایشی',
      defaultValue: 'تا سقف ۲۰۰ میلیون تومان',
    },
    {
      configKey: 'welfareShowcaseCtaText',
      label: 'متن دکمه اقدام',
      defaultValue: 'میز کار رفاهیات و تسهیلات',
    },
  ],
  multimedia_showcase: [
    {
      configKey: 'multimediaShowcaseBadge',
      label: 'نشان بالای ویترین درس‌گفتارها',
      defaultValue: 'آرشیو صوتی و تصویری',
    },
    {
      configKey: 'multimediaShowcaseTitle',
      label: 'عنوان ویترین درس‌گفتارها',
      defaultValue: 'ویترین محصولات چندرسانه‌ای و درس‌گفتارها',
    },
    {
      configKey: 'multimediaShowcaseSubtitle',
      label: 'توضیح ویترین درس‌گفتارها',
      multiline: true,
      defaultValue:
        'درس‌گفتارهای صوتی خارج فقه القضا، جلسات نقد آراء و ویدیوهای مستند آموزشی',
    },
    {
      configKey: 'multimediaLecturesCount',
      label: 'برچسب تعداد جلسات',
      defaultValue: '۴۸ جلسه',
    },
    {
      configKey: 'multimediaShowcaseCtaText',
      label: 'متن دکمه اقدام',
      defaultValue: 'ورود به آرشیو چندرسانه‌ای',
    },
  ],
  books_showcase: [
    {
      configKey: 'booksShowcaseBadge',
      label: 'نشان بالای ویترین محصولات',
      defaultValue: 'کتاب و محصولات چند رسانه‌ای',
    },
    {
      configKey: 'booksShowcaseTitle',
      label: 'عنوان ویترین کتاب و محصولات',
      defaultValue: 'ویترین کتاب و محصولات چند رسانه‌ای',
    },
    {
      configKey: 'booksShowcaseSubtitle',
      label: 'توضیح ویترین محصولات',
      multiline: true,
      defaultValue:
        'موسوعه‌ها و کتب مرجع، محصولات چندرسانه‌ای و درس‌گفتارهای صوتی تخصصی مرکز',
    },
    {
      configKey: 'booksShowcaseDiscountNotice',
      label: 'اطلاعیه تخفیف اعضا',
      defaultValue: 'تخفیف ویژه دانش‌آموختگان و تحویل دیجیتال/فیزیکی',
    },
    {
      configKey: 'booksShowcaseCtaText',
      label: 'متن دکمه اقدام',
      defaultValue: 'ورود به کتاب و محصولات چند رسانه‌ای',
    },
  ],
  status_widget: [
    {
      configKey: 'statusWidgetTitle',
      label: 'عنوان ویجت خلاصه وضعیت',
      defaultValue: 'ویجت خلاصه وضعیت پرونده‌ها و خدمات من',
    },
    {
      configKey: 'statusWidgetSubtitle',
      label: 'توضیح ویجت وضعیت',
      defaultValue: 'نمای یکپارچه و بلادرنگ فعالیت‌های جاری شما در سامانه',
    },
  ],
  events_calendar: [
    {
      configKey: 'eventsCalendarTitle',
      label: 'عنوان ویجت تقویم رویدادها',
      defaultValue: 'تقویم رویدادها و مهلت‌های مرکز',
    },
    {
      configKey: 'eventsCalendarSubtitle',
      label: 'توضیح ویجت تقویم',
      defaultValue: 'نشست‌های علمی، کارگاه‌ها و فراخوان‌های پیش‌رو',
    },
  ],
  bento_grid: [
    {
      configKey: 'bentoSectionTitle',
      label: 'عنوان بخش شبکه جامع خدمات (Bento)',
      defaultValue: 'ویترین جامع خدمات سامانه (طرح میزان)',
    },
    {
      configKey: 'bentoSectionSubtitle',
      label: 'توضیح بخش شبکه جامع',
      multiline: true,
      defaultValue:
        'دسترسی آنی به کارتابل، آموزش، مشاوره شغلی، تالار آراء و رفاهیات با هاور تعاملی',
    },
    {
      configKey: 'bentoCardCtaText',
      label: 'متن دکمه کارت‌های شبکه',
      defaultValue: 'ورود به سامانه',
    },
    {
      configKey: 'bentoCardSchemeText',
      label: 'برچسب طرح کارت‌ها',
      defaultValue: 'طرح میزان',
    },
  ],
};

export const ShowcaseQuickEditModal: React.FC<ShowcaseQuickEditModalProps> = ({
  sectionKey,
  sectionLabel,
  currentDensity,
  hasClassicMinimalToggle,
  crextioConfig,
  updateCrextioConfig,
  onClose,
  onOpenStudioTab,
  onSavedToast,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [classicValues, setClassicValues] = useState<Record<string, string>>({});
  const [minimalValues, setMinimalValues] = useState({
    kicker: '',
    title: '',
    description: '',
    ctaLabel: '',
  });
  const [imageOverrideUrl, setImageOverrideUrl] = useState<string | undefined>(undefined);
  const [showImageInBox, setShowImageInBox] = useState<boolean>(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const imageKey = sectionKey ? IMAGE_KEY_MAP[sectionKey] : undefined;
  const classicSpecs = sectionKey ? CLASSIC_FIELDS_MAP[sectionKey] || [] : [];
  const minimalDef = sectionKey ? MINIMAL_DEFAULTS_MAP[sectionKey] : undefined;

  useEffect(() => {
    if (!sectionKey) return;
    setUploadError(null);

    const initClassic: Record<string, string> = {};
    (CLASSIC_FIELDS_MAP[sectionKey] || []).forEach(spec => {
      const raw = crextioConfig[spec.configKey];
      initClassic[spec.configKey as string] =
        typeof raw === 'string' ? raw : spec.defaultValue;
    });
    setClassicValues(initClassic);

    const minOv = crextioConfig.minimalBoxOverrides?.[sectionKey] || {};
    const minDef = MINIMAL_DEFAULTS_MAP[sectionKey];
    setMinimalValues({
      kicker: minOv.kicker ?? minDef?.kicker ?? '',
      title: minOv.title ?? minDef?.title ?? '',
      description: minOv.description ?? minDef?.description ?? '',
      ctaLabel: minOv.ctaLabel ?? minDef?.ctaLabel ?? '',
    });

    const imgKey = IMAGE_KEY_MAP[sectionKey];
    if (imgKey) {
      const currentOverride =
        crextioConfig.showcaseImageOverrides?.[imgKey] ??
        (sectionKey === 'research_promo'
          ? crextioConfig.researchPromoBgImage || undefined
          : sectionKey === 'rulings_showcase'
          ? crextioConfig.rulingsShowcaseBgImage || undefined
          : undefined);
      setImageOverrideUrl(currentOverride || undefined);
    } else {
      setImageOverrideUrl(undefined);
    }

    if (sectionKey === 'top_vip_row') {
      setShowImageInBox(crextioConfig.showHeroPortrait !== false);
    } else {
      const lay = crextioConfig.dashboardSectionLayouts?.[sectionKey];
      setShowImageInBox(lay?.showImage !== false);
    }
  }, [sectionKey, crextioConfig]);

  if (!sectionKey) return null;

  const previewUrl = imageKey
    ? imageOverrideUrl || resolveShowcaseImageUrl(imageKey)
    : undefined;

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !imageKey) return;
    setUploadError(null);
    setUploading(true);
    try {
      const res = await api.uploadFile(file, 'misc');
      if (res?.url) {
        setImageOverrideUrl(res.url);
      } else {
        setUploadError('پاسخ معتبری از سرور دریافت نشد.');
      }
    } catch (err: any) {
      setUploadError(err?.message || 'خطا در آپلود تصویر روی سرور');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = () => {
    const updates: Partial<CrextioDashboardConfig> = {};

    classicSpecs.forEach(spec => {
      (updates as any)[spec.configKey] = classicValues[spec.configKey as string] ?? '';
    });

    if (hasClassicMinimalToggle && minimalDef) {
      updates.minimalBoxOverrides = {
        ...(crextioConfig.minimalBoxOverrides || {}),
        [sectionKey]: {
          kicker: minimalValues.kicker,
          title: minimalValues.title,
          description: minimalValues.description,
          ctaLabel: minimalValues.ctaLabel,
        },
      };
    }

    if (imageKey) {
      const nextOverrides = { ...(crextioConfig.showcaseImageOverrides || {}) };
      if (imageOverrideUrl) {
        nextOverrides[imageKey] = imageOverrideUrl;
      } else {
        delete nextOverrides[imageKey];
      }
      updates.showcaseImageOverrides = nextOverrides;

      if (sectionKey === 'research_promo') {
        updates.researchPromoBgImage = imageOverrideUrl || '';
      } else if (sectionKey === 'rulings_showcase') {
        updates.rulingsShowcaseBgImage = imageOverrideUrl || '';
      }
    }

    if (sectionKey === 'top_vip_row') {
      updates.showHeroPortrait = showImageInBox;
    } else if (hasClassicMinimalToggle) {
      const prevLayouts = crextioConfig.dashboardSectionLayouts || {};
      const curLayout = prevLayouts[sectionKey] || {
        span: 'full',
        density: 'full',
        scale: 'normal',
        showImage: true,
      };
      updates.dashboardSectionLayouts = {
        ...prevLayouts,
        [sectionKey]: {
          ...curLayout,
          showImage: showImageInBox,
        },
      };
    }

    updateCrextioConfig(updates);
    onSavedToast?.(`محتوا و تصویر «${sectionLabel}» در پایگاه داده ذخیره و همگام‌سازی شد.`);
    onClose();
  };

  const MinimalEditorSection =
    hasClassicMinimalToggle && minimalDef ? (
      <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-700" />
            <div>
              <h4 className="text-xs font-black text-emerald-950">
                متن باکس در حالت طراحی ساده (مینیمال)
              </h4>
              <p className="text-[11px] text-emerald-800/80">
                {currentDensity === 'minimal'
                  ? 'این ویترین هم‌اکنون در حالت طراحی ساده است و متن‌های زیر مستقیماً روی کارت نمایش داده می‌شوند.'
                  : 'چنانچه این ویترین را به حالت طراحی ساده تغییر دهید، این متن‌ها نمایش داده می‌شوند.'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-stone-700 mb-1">
              برچسب بالای کارت (Kicker)
            </label>
            <input
              type="text"
              value={minimalValues.kicker}
              onChange={e => setMinimalValues(p => ({ ...p, kicker: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 font-bold text-stone-900"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-stone-700 mb-1">
              متن دکمه اقدام
            </label>
            <input
              type="text"
              value={minimalValues.ctaLabel}
              onChange={e => setMinimalValues(p => ({ ...p, ctaLabel: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 font-bold text-stone-900"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold text-stone-700 mb-1">
              تیتر کارت ساده
            </label>
            <input
              type="text"
              value={minimalValues.title}
              onChange={e => setMinimalValues(p => ({ ...p, title: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 font-black text-stone-900"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold text-stone-700 mb-1">
              توضیح کوتاه کارت ساده
            </label>
            <textarea
              rows={2}
              value={minimalValues.description}
              onChange={e => setMinimalValues(p => ({ ...p, description: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-stone-800"
            />
          </div>
        </div>
      </div>
    ) : null;

  const ClassicEditorSection =
    classicSpecs.length > 0 ? (
      <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
        <div className="flex items-center gap-2">
          <Type className="w-4 h-4 text-stone-800" />
          <div>
            <h4 className="text-xs font-black text-stone-900">
              {hasClassicMinimalToggle
                ? 'متن و محتوای حالت طراحی کلاسیک (کامل)'
                : 'متن و محتوای این بخش'}
            </h4>
            <p className="text-[11px] text-stone-500">
              تغییرات بلافاصله برای تمامی دانش‌آموختگان ثبت و همگام‌سازی می‌شود.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {classicSpecs.map(spec => {
            const val = classicValues[spec.configKey as string] ?? '';
            return (
              <div
                key={String(spec.configKey)}
                className={spec.multiline ? 'sm:col-span-2' : ''}
              >
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  {spec.label}
                </label>
                {spec.multiline ? (
                  <textarea
                    rows={2}
                    value={val}
                    onChange={e =>
                      setClassicValues(prev => ({
                        ...prev,
                        [spec.configKey as string]: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-stone-900 leading-relaxed"
                  />
                ) : (
                  <input
                    type="text"
                    value={val}
                    onChange={e =>
                      setClassicValues(prev => ({
                        ...prev,
                        [spec.configKey as string]: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 font-bold text-stone-900"
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    ) : null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
        dir="rtl"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.18 }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl border border-stone-200 shadow-2xl flex flex-col overflow-hidden"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelected}
            className="hidden"
          />

          {/* Modal Header */}
          <div className="px-5 py-4 bg-stone-950 text-white flex items-center justify-between gap-3 shrink-0">
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-amber-300">
                ویرایش سریع متن و عکس ویترین
              </div>
              <h3 className="text-sm sm:text-base font-black truncate mt-0.5">
                {sectionLabel}
              </h3>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="بستن"
              className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-200 flex items-center justify-center cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Showcase Image Section */}
            {imageKey && (
              <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-sky-800" />
                    <div>
                      <h4 className="text-xs font-black text-stone-900">
                        تصویر اختصاصی این ویترین
                      </h4>
                      <p className="text-[11px] text-stone-600">
                        در ویترین اصلی و نمای ساده (در صورت فعال بودن عکس) نمایش داده می‌شود.
                      </p>
                    </div>
                  </div>

                  {(hasClassicMinimalToggle || sectionKey === 'top_vip_row') && (
                    <button
                      type="button"
                      onClick={() => setShowImageInBox(v => !v)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border cursor-pointer transition-colors ${
                        showImageInBox
                          ? 'bg-sky-700 text-white border-sky-700'
                          : 'bg-white text-stone-600 border-stone-300'
                      }`}
                    >
                      {sectionKey === 'top_vip_row'
                        ? showImageInBox
                          ? 'نمایش پرتره: روشن'
                          : 'نمایش پرتره: خاموش'
                        : showImageInBox
                        ? 'نمایش عکس در باکس: روشن'
                        : 'نمایش عکس در باکس: خاموش'}
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-full sm:w-44 h-28 rounded-2xl overflow-hidden bg-stone-200 border border-stone-300 shrink-0">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt={sectionLabel}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-400">
                        <ImageIcon className="w-7 h-7" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 w-full space-y-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={uploading}
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                      >
                        {uploading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Upload className="w-3.5 h-3.5" />
                        )}
                        <span>{uploading ? 'در حال آپلود...' : 'انتخاب و آپلود عکس جدید'}</span>
                      </button>

                      {imageOverrideUrl && (
                        <button
                          type="button"
                          onClick={() => setImageOverrideUrl(undefined)}
                          className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 text-xs font-bold cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>بازگشت به پیش‌فرض</span>
                        </button>
                      )}
                    </div>

                    {uploadError && (
                      <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-bold flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{uploadError}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Place whichever density is currently active FIRST for instant clarity */}
            {currentDensity === 'minimal' ? (
              <>
                {MinimalEditorSection}
                {ClassicEditorSection}
              </>
            ) : (
              <>
                {ClassicEditorSection}
                {MinimalEditorSection}
              </>
            )}

            {(sectionKey === 'honors_showcase' ||
              sectionKey === 'unified_showcase') &&
              onOpenStudioTab && (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-amber-950">
                    برای افزودن/حذف اسلایدهای افتخارات یا انتخاب زیرمجموعه‌های ویترین جامع:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenStudioTab('honors_unified');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold cursor-pointer"
                  >
                    <span>باز کردن مدیریت آیتم‌ها در استودیو</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
          </div>

          {/* Modal Footer */}
          <div className="px-5 py-3.5 bg-stone-50 border-t border-stone-200 flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 text-xs font-bold cursor-pointer"
            >
              انصراف
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-black shadow-xs cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>ذخیره تغییرات ویترین</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
