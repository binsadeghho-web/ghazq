import React, { useRef, useState } from 'react';
import {
  CrextioDashboardConfig,
  CrextioMobileConfig,
  CrextioMobileCustomCard,
  CrextioMobileShowcaseOverride,
  MobileDetailedShowcaseId,
  MobileSectionId,
  MobileServiceListTabId,
  MobileServiceShowcaseId,
} from '../../types';
import { DEFAULT_CREXTIO_CONFIG } from '../../data/mockData';
import {
  resolveMobileConfig,
  CANONICAL_MOBILE_SECTION_ORDER,
  CANONICAL_MOBILE_SHOWCASE_ORDER,
  CANONICAL_MOBILE_DETAILED_SHOWCASE_ORDER,
  CANONICAL_MOBILE_SERVICES_LIST_ORDER,
} from '../../context/ThemeContext';
import { api } from '../../services/apiClient';
import { toPersianNumbers } from '../../utils/persianNumbers';
import {
  Smartphone,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  RotateCcw,
  Sparkles,
  Layers,
  ListOrdered,
  Split,
  Edit3,
  Upload,
  Loader2,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
} from 'lucide-react';

interface MobileStudioPanelProps {
  crextioConfig: CrextioDashboardConfig;
  commit: (updates: Partial<CrextioDashboardConfig>) => void;
}

const MOBILE_SECTION_LABELS: Record<MobileSectionId, string> = {
  hero: 'کارت خوش‌آمدگویی و هویت عضو',
  quick_dock: 'نوار «درگاه‌های دسترسی سریع»',
  status_ledger: 'دفتر وضعیت پرونده‌ها، اطلاعیه‌ها و تقویم',
  honors_showcase: 'بخش مستقل «ویترین انتصاب و افتخارات»',
  services_showcase: 'بخش «ویترین خدمات» (کارت‌های تصویری)',
  services_list: 'بخش «فهرست خدمات» (نمای تفصیلی زیربخش‌ها)',
};

const MOBILE_SHOWCASE_LABELS: Record<MobileServiceShowcaseId, string> = {
  counseling: 'خدمات روانشناختی و مشاوره',
  counseling_specialized: 'مشاوره شغلی قضا',
  courses: 'دوره‌ها و کارگاه‌های علمی',
  rulings: 'تالار نقد آراء قضایی',
  research: 'راهبری پژوهش و مقاله',
  welfare: 'تسهیلات، اقامتگاه و رفاهیات',
  products: 'کتاب و محصولات چند رسانه‌ای',
};

const MOBILE_DETAILED_SHOWCASE_META: Record<
  MobileDetailedShowcaseId,
  { label: string; defaultKicker: string; defaultTitle: string; defaultSubtitle: string; defaultCta: string }
> = {
  counseling_workshops: {
    label: 'کارگاه‌های روانشناختی و سلامت روان',
    defaultKicker: 'خدمات روانشناختی · کارگاه فعال',
    defaultTitle: 'کارگاه‌های آموزشی روانشناختی و خانواده',
    defaultSubtitle: 'مشاهده کارگاه‌های در حال ثبت‌نام و آرشیو جلسات تخصصی',
    defaultCta: 'مشاهده کارگاه‌ها',
  },
  counseling_announcements: {
    label: 'اطلاعیه‌ها و فراخوان‌های مشاوره',
    defaultKicker: 'اطلاعیه کلینیک مشاوره',
    defaultTitle: 'اطلاعیه‌ها و فراخوان‌های خدمات روانشناختی',
    defaultSubtitle: 'برنامه‌ها، نشست‌های تخصصی و اطلاعیه‌های جاری مرکز مشاوره',
    defaultCta: 'مشاهده اطلاعیه‌ها',
  },
  counseling_booking: {
    label: 'رزرو وقت خدمات روانشناختی و مشاوره',
    defaultKicker: 'رزرو نوبت محرمانه',
    defaultTitle: 'رزرو وقت خدمات روانشناختی و مشاوره',
    defaultSubtitle: 'مشاوره فردی، خانواده، زوج‌درمانی و روان‌سنجی با روان‌شناسان مرکز',
    defaultCta: 'رزرو نوبت',
  },
  counseling_career: {
    label: 'مشاوره شغلی قضا و ارتقای علمی',
    defaultKicker: 'هدایت شغلی و قضایی',
    defaultTitle: 'مشاوره شغلی قضا',
    defaultSubtitle: 'گفت‌وگوی تخصصی با قضات پیشکسوت دیوان عالی و اساتید برجسته',
    defaultCta: 'دریافت مشاوره',
  },
  courses_active: {
    label: 'دوره‌ها و کارگاه‌های علمی فعال',
    defaultKicker: 'آموزش عالی',
    defaultTitle: 'دوره‌ها و نشست‌های تخصصی فقه و قضا',
    defaultSubtitle: 'کارگاه‌های مهارت‌افزایی و آرشیو صوتی جلسات',
    defaultCta: 'گالری دوره‌ها',
  },
  rulings_featured: {
    label: 'تالار نقد و مباحثه آراء قضایی',
    defaultKicker: 'مباحثات قضایی',
    defaultTitle: 'تالار نقد و مباحثه آراء قضایی',
    defaultSubtitle: 'بررسی استدلال‌های حقوقی و تبادل نظر نخبگان بر روی آراء منتخب',
    defaultCta: 'ورود به تالار',
  },
  research_guidance: {
    label: 'راهبری پژوهش، مقاله و رساله',
    defaultKicker: 'معاونت پژوهش',
    defaultTitle: 'راهبری پژوهش‌ها، رساله‌ها و مقالات',
    defaultSubtitle: 'اساتید معین طراز اول، گرنت پژوهشی و تسهیل اسکان مطالعاتی در قم',
    defaultCta: 'میز پژوهش',
  },
  welfare_emergency: {
    label: 'رفاهیات: درخواست تسهیلات اضطراری',
    defaultKicker: 'تسهیلات و رفاهیات',
    defaultTitle: 'تسهیلات اضطراری اعضا',
    defaultSubtitle: 'ثبت درخواست وام اضطراری با ثبت مبلغ و علت درخواست',
    defaultCta: 'ثبت درخواست',
  },
  welfare_fund: {
    label: 'رفاهیات: صندوق قرض‌الحسنه مجتمع فقه و حقوق',
    defaultKicker: 'صندوق قرض‌الحسنه',
    defaultTitle: 'صندوق قرض‌الحسنه مجتمع فقه و حقوق اسلامی',
    defaultSubtitle: 'درخواست عضویت در صندوق، پرداخت حق عضویت ماهانه و سوابق',
    defaultCta: 'ورود به صندوق',
  },
  welfare_accommodation: {
    label: 'رفاهیات: اسکان در قم و سایر شهرها',
    defaultKicker: 'اسکان و مهمانسرا',
    defaultTitle: 'رزرو اسکان در قم و سایر شهرها',
    defaultSubtitle: 'ثبت درخواست اسکان با تقویم شمسی و انتخاب تعداد شب اقامت',
    defaultCta: 'رزرو اسکان',
  },
  welfare_consumables: {
    label: 'رفاهیات: تهیه اقلام مصرفی و تعاونی',
    defaultKicker: 'فروشگاه تعاونی',
    defaultTitle: 'تهیه اقلام مصرفی با نرخ تعاونی',
    defaultSubtitle: 'مشاهده کالاهای یارانه‌ای، انتخاب روش ارسال و ثبت سفارش',
    defaultCta: 'مشاهده اقلام',
  },
  welfare_installments: {
    label: 'رفاهیات: فروش اقساطی و فروشگاه‌های طرف قرارداد',
    defaultKicker: 'خرید اقساطی',
    defaultTitle: 'فروش اقساطی (سرای ایرانی، آمال و ...)',
    defaultSubtitle: 'مشاهده سقف اعتبار، شرایط اقساط و ثبت درخواست اعتبار',
    defaultCta: 'مشاهده شرایط',
  },
  products_featured: {
    label: 'کتاب و محصولات چند رسانه‌ای',
    defaultKicker: 'نشر و رسانه علمی',
    defaultTitle: 'کتاب‌ها، نشست‌ها و درس‌گفتارهای چندرسانه‌ای',
    defaultSubtitle: 'موسوعه‌های فقهی، آثار مرجع و فایل‌های صوتی جلسات',
    defaultCta: 'نمایشگاه آثار',
  },
};

const MOBILE_SERVICES_LIST_LABELS: Record<MobileServiceListTabId, string> = {
  courses: 'دوره‌ها و کارگاه‌ها',
  counseling: 'خدمات روانشناختی و مشاوره',
  specialized_counseling: 'مشاوره شغلی قضا',
  rulings: 'تالار نقد آراء',
  research: 'خدمات پژوهشی',
  welfare: 'رفاهیات و تسهیلات',
  products: 'کتاب و رسانه',
  cartable: 'کارتابل درخواست‌ها',
  synergy: 'دیوار هم‌افزایی',
};

const TARGET_VIEW_OPTIONS: Array<{ value: string; label: string; subTabs?: Array<{ value: string; label: string }> }> = [
  {
    value: 'CounselingGeneral',
    label: 'خدمات روانشناختی و مشاوره',
    subTabs: [
      { value: 'workshops', label: 'کارگاه‌های روانشناختی' },
      { value: 'announcements', label: 'اطلاعیه‌های روانشناختی' },
      { value: 'booking', label: 'رزرو وقت مشاوره' },
      { value: 'consultants', label: 'فهرست روان‌شناسان' },
      { value: 'tariffs', label: 'نرخ‌نامه' },
    ],
  },
  {
    value: 'Welfare',
    label: 'تسهیلات و رفاهیات',
    subTabs: [
      { value: 'emergency_loan', label: 'تسهیلات اضطراری' },
      { value: 'qarzolhasaneh_fund', label: 'صندوق قرض‌الحسنه' },
      { value: 'accommodation', label: 'اسکان در قم و سایر شهرها' },
      { value: 'consumables', label: 'تهیه اقلام مصرفی' },
      { value: 'installment_sales', label: 'فروش اقساطی' },
    ],
  },
  { value: 'Courses', label: 'دوره‌ها و کارگاه‌های علمی' },
  { value: 'SpecializedCounseling', label: 'مشاوره شغلی قضا' },
  { value: 'Rulings', label: 'تالار نقد آراء قضایی' },
  { value: 'Research', label: 'راهبری پژوهش و مقاله' },
  { value: 'Products', label: 'کتاب و محصولات چند رسانه‌ای' },
  { value: 'People', label: 'کارتابل درخواست‌ها' },
  { value: 'Synergy', label: 'دیوار هم‌افزایی' },
];

function moveItem<T>(arr: T[], idx: number, dir: -1 | 1): T[] {
  const target = idx + dir;
  if (target < 0 || target >= arr.length) return arr;
  const copy = [...arr];
  const [item] = copy.splice(idx, 1);
  copy.splice(target, 0, item);
  return copy;
}

export const MobileStudioPanel: React.FC<MobileStudioPanelProps> = ({
  crextioConfig,
  commit,
}) => {
  const m = resolveMobileConfig(crextioConfig.mobileConfig);
  const [expandedEditId, setExpandedEditId] = useState<string | null>(null);
  const [uploadingTarget, setUploadingTarget] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadCallbackRef = useRef<((url: string) => void) | null>(null);

  const patchMobile = (updates: Partial<CrextioMobileConfig>) => {
    commit({
      mobileConfig: {
        ...m,
        ...updates,
      },
    });
  };

  const triggerUpload = (targetId: string, onDone: (url: string) => void) => {
    setUploadingTarget(targetId);
    uploadCallbackRef.current = onDone;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const cb = uploadCallbackRef.current;
    if (!file || !cb) {
      setUploadingTarget(null);
      return;
    }
    try {
      const res = await api.uploadFile(file, 'misc');
      if (res?.url) {
        cb(res.url);
      }
    } catch (err: any) {
      window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: `خطا در آپلود تصویر: ${err?.message || 'خطای سرور'}`, type: 'error' } }));
    } finally {
      setUploadingTarget(null);
      uploadCallbackRef.current = null;
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const updateSimpleOverride = (scId: MobileServiceShowcaseId, patch: Partial<CrextioMobileShowcaseOverride>) => {
    const prev = m.showcaseOverrides?.[scId] || {};
    patchMobile({
      showcaseOverrides: {
        ...(m.showcaseOverrides || {}),
        [scId]: { ...prev, ...patch },
      },
    });
  };

  const resetSimpleOverride = (scId: MobileServiceShowcaseId) => {
    const copy = { ...(m.showcaseOverrides || {}) };
    delete copy[scId];
    patchMobile({ showcaseOverrides: copy });
  };

  const updateDetailedOverride = (
    dId: MobileDetailedShowcaseId,
    patch: Partial<CrextioMobileShowcaseOverride>
  ) => {
    const prev = m.detailedShowcaseOverrides?.[dId] || {};
    patchMobile({
      detailedShowcaseOverrides: {
        ...(m.detailedShowcaseOverrides || {}),
        [dId]: { ...prev, ...patch },
      },
    });
  };

  const resetDetailedOverride = (dId: MobileDetailedShowcaseId) => {
    const copy = { ...(m.detailedShowcaseOverrides || {}) };
    delete copy[dId];
    patchMobile({ detailedShowcaseOverrides: copy });
  };

  const updateCustomCard = (id: string, patch: Partial<CrextioMobileCustomCard>) => {
    const next = (m.customShowcaseCards || []).map(c => (c.id === id ? { ...c, ...patch } : c));
    patchMobile({ customShowcaseCards: next });
  };

  const addCustomCard = () => {
    const newCard: CrextioMobileCustomCard = {
      id: `custom_card_${Date.now()}`,
      enabled: true,
      kicker: 'ویترین اختصاصی',
      title: 'کارت جدید ویترین خدمات',
      subtitle: 'توضیح کوتاه درباره این خدمت یا کارگاه',
      metaText: 'دسترسی مستقیم',
      ctaLabel: 'مشاهده جزئیات',
      targetView: 'CounselingGeneral',
      subTab: 'workshops',
    };
    patchMobile({ customShowcaseCards: [...(m.customShowcaseCards || []), newCard] });
    setExpandedEditId(`custom_${newCard.id}`);
  };

  const deleteCustomCard = (id: string) => {
    patchMobile({
      customShowcaseCards: (m.customShowcaseCards || []).filter(c => c.id !== id),
    });
  };

  const toggleItems: Array<{
    key: keyof Pick<
      CrextioMobileConfig,
      | 'showHeroBanner'
      | 'showHeroPortrait'
      | 'showWelcomeQuickButtons'
      | 'showHeroStats'
      | 'showQuickDock'
      | 'showStatusLedger'
      | 'showHonorsShowcase'
      | 'separateHonorsShowcase'
      | 'showServicesShowcase'
      | 'showServicesList'
    >;
    title: string;
    subtitle: string;
    value: boolean;
  }> = [
    {
      key: 'showHeroBanner',
      title: 'نمایش کارت خوش‌آمدگویی',
      subtitle: 'کارت هویت، دوره عضویت و خوش‌آمد در بالای صفحه موبایل',
      value: m.showHeroBanner,
    },
    {
      key: 'showHeroPortrait',
      title: 'نمایش تصویر پرتره کاربر در کارت خوش‌آمدگویی',
      subtitle: 'نمایش عکس پروفایل یا آواتار در هدر کارت',
      value: m.showHeroPortrait,
    },
    {
      key: 'showWelcomeQuickButtons',
      title: 'دکمه‌های اقدام سریع کارت خوش‌آمدگویی (کارتابل / هم‌افزایی)',
      subtitle: 'پیش‌فرض در موبایل خاموش است تا کارت خوش‌آمدگویی خلوت بماند',
      value: m.showWelcomeQuickButtons,
    },
    {
      key: 'showHeroStats',
      title: 'نمایش نوار آمار زنده در کارت خوش‌آمدگویی',
      subtitle: 'پیش‌فرض در موبایل خاموش است',
      value: m.showHeroStats,
    },
    {
      key: 'showQuickDock',
      title: 'نمایش بخش «درگاه‌های دسترسی سریع»',
      subtitle: 'نوار آیکون‌های دسترسی سریع افقی (پیش‌فرض خاموش در موبایل)',
      value: m.showQuickDock,
    },
    {
      key: 'showStatusLedger',
      title: 'نمایش دفتر وضعیت پرونده‌ها، اطلاعیه‌ها و تقویم',
      subtitle: 'شمارنده پرونده‌های فعال، اطلاعیه‌ها و رویدادهای پیش‌رو',
      value: m.showStatusLedger,
    },
    {
      key: 'showHonorsShowcase',
      title: 'نمایش «ویترین انتصاب و افتخارات»',
      subtitle: 'کارت‌های انتصابات قضایی و رتبه‌های برتر نخبگان',
      value: m.showHonorsShowcase,
    },
    {
      key: 'separateHonorsShowcase',
      title: 'جداسازی «ویترین انتصاب و افتخارات» از «ویترین خدمات»',
      subtitle: 'در صورت فعال بودن (پیش‌فرض)، این دو ویترین به صورت مستقل نمایش داده می‌شوند',
      value: m.separateHonorsShowcase,
    },
    {
      key: 'showServicesShowcase',
      title: 'نمایش بخش «ویترین خدمات»',
      subtitle: 'کاروسل تصویری معرفی خدمات تخصصی مرکز در موبایل',
      value: m.showServicesShowcase,
    },
    {
      key: 'showServicesList',
      title: 'نمایش بخش «فهرست خدمات»',
      subtitle: 'نمای تفصیلی و بزرگ هر زیربخش پس از انتخاب توسط کاربر',
      value: m.showServicesList,
    },
  ];

  const renderInlineOverrideEditor = (
    editKey: string,
    ov: CrextioMobileShowcaseOverride | undefined,
    placeholders: { kicker: string; title: string; subtitle: string; metaText: string; ctaLabel: string },
    onPatch: (patch: Partial<CrextioMobileShowcaseOverride>) => void,
    onReset: () => void
  ) => {
    const isUploading = uploadingTarget === editKey;
    return (
      <div className="mt-2 pt-3 border-t border-stone-200 space-y-2.5 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] font-bold text-stone-600 mb-1">برچسب بالای کارت (Kicker)</label>
            <input
              type="text"
              value={ov?.kicker ?? ''}
              onChange={e => onPatch({ kicker: e.target.value })}
              placeholder={placeholders.kicker}
              className="w-full px-2.5 py-2 rounded-xl border border-stone-300 bg-white font-bold text-xs"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-stone-600 mb-1">عنوان اصلی کارت</label>
            <input
              type="text"
              value={ov?.title ?? ''}
              onChange={e => onPatch({ title: e.target.value })}
              placeholder={placeholders.title}
              className="w-full px-2.5 py-2 rounded-xl border border-stone-300 bg-white font-bold text-xs"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[10px] font-bold text-stone-600 mb-1">زیرعنوان / توضیح کارت</label>
            <input
              type="text"
              value={ov?.subtitle ?? ''}
              onChange={e => onPatch({ subtitle: e.target.value })}
              placeholder={placeholders.subtitle}
              className="w-full px-2.5 py-2 rounded-xl border border-stone-300 bg-white text-xs"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-stone-600 mb-1">متن فوتر (Meta)</label>
            <input
              type="text"
              value={ov?.metaText ?? ''}
              onChange={e => onPatch({ metaText: e.target.value })}
              placeholder={placeholders.metaText}
              className="w-full px-2.5 py-2 rounded-xl border border-stone-300 bg-white text-xs"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-stone-600 mb-1">متن دکمه اقدام (CTA)</label>
            <input
              type="text"
              value={ov?.ctaLabel ?? ''}
              onChange={e => onPatch({ ctaLabel: e.target.value })}
              placeholder={placeholders.ctaLabel}
              className="w-full px-2.5 py-2 rounded-xl border border-stone-300 bg-white font-bold text-xs"
            />
          </div>
        </div>

        {/* Image Override + Upload */}
        <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 flex flex-wrap items-center gap-2">
          {ov?.imageUrl ? (
            <img
              src={ov.imageUrl}
              alt="پیش‌نمایش"
              className="w-11 h-11 rounded-lg object-cover border border-stone-300 shrink-0"
            />
          ) : (
            <div className="w-11 h-11 rounded-lg bg-stone-200/70 text-stone-500 flex items-center justify-center shrink-0">
              <ImageIcon className="w-5 h-5" />
            </div>
          )}
          <input
            type="text"
            value={ov?.imageUrl ?? ''}
            onChange={e => onPatch({ imageUrl: e.target.value })}
            placeholder="آدرس عکس سفارشی (یا با دکمه آپلود بارگذاری کنید)"
            className="flex-1 min-w-[160px] px-2.5 py-2 rounded-lg border border-stone-300 bg-white text-[11px] dir-ltr"
          />
          <button
            type="button"
            disabled={isUploading}
            onClick={() => triggerUpload(editKey, url => onPatch({ imageUrl: url }))}
            className="px-3 py-2 min-h-[38px] rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-[11px] font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            <span>آپلود عکس</span>
          </button>
          <button
            type="button"
            onClick={onReset}
            className="px-2.5 py-2 min-h-[38px] rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-700 text-[11px] font-bold cursor-pointer shrink-0"
          >
            بازنشانی کارت
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6" dir="rtl">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Header Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-l from-[#071E17] via-[#0E3226] to-[#113D30] text-white border border-[#F3D078]/30 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-[#F3D078]/35 flex items-center justify-center text-[#F3D078] shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white">
              استودیو اختصاصی چیدمان و تم موبایل
            </h3>
            <p className="text-[11px] text-emerald-100/80 mt-0.5">
              تغییرات این بخش منحصراً روی نمایش موبایل اعمال شده و هیچ خللی در نسخه لپ‌تاپ ایجاد نمی‌کند.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            commit({
              mobileConfig: {
                ...(DEFAULT_CREXTIO_CONFIG.mobileConfig as CrextioMobileConfig),
              },
            })
          }
          className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-[#F3D078] border border-[#F3D078]/30 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>بازگردانی پیش‌فرض موبایل</span>
        </button>
      </div>

      {/* 1. Visibility & Separation Controls */}
      <div className="p-4 rounded-2xl border border-stone-200 bg-white space-y-3">
        <h4 className="text-xs font-black text-stone-900 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-emerald-700" />
          <span>تنظیمات نمایش اجزای صفحه اول موبایل</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {toggleItems.map(item => (
            <button
              key={item.key}
              type="button"
              onClick={() => patchMobile({ [item.key]: !item.value } as Partial<CrextioMobileConfig>)}
              className={`p-3 rounded-xl border text-right flex items-start justify-between gap-3 transition-all cursor-pointer ${
                item.value
                  ? 'bg-emerald-50/70 border-emerald-300'
                  : 'bg-stone-50 border-stone-200 opacity-85'
              }`}
            >
              <div className="min-w-0">
                <div className="text-xs font-black text-stone-900">{item.title}</div>
                <div className="text-[10px] text-stone-500 mt-0.5 leading-relaxed">
                  {item.subtitle}
                </div>
              </div>
              <span
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black shrink-0 ${
                  item.value
                    ? 'bg-emerald-800 text-white'
                    : 'bg-stone-200 text-stone-600'
                }`}
              >
                {item.value ? 'فعال' : 'خاموش'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Editable Mobile Section Titles */}
      <div className="p-4 rounded-2xl border border-stone-200 bg-white space-y-3">
        <h4 className="text-xs font-black text-stone-900 flex items-center gap-1.5">
          <Split className="w-4 h-4 text-amber-700" />
          <span>عنوان‌های اختصاصی ویترین‌ها و فهرست موبایل</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-stone-600 mb-1">
              عنوان ویترین انتصاب و افتخارات
            </label>
            <input
              type="text"
              value={m.honorsShowcaseTitle}
              onChange={e => patchMobile({ honorsShowcaseTitle: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-stone-600 mb-1">
              عنوان ویترین خدمات
            </label>
            <input
              type="text"
              value={m.servicesShowcaseTitle}
              onChange={e => patchMobile({ servicesShowcaseTitle: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-stone-600 mb-1">
              عنوان فهرست خدمات
            </label>
            <input
              type="text"
              value={m.servicesListTitle}
              onChange={e => patchMobile({ servicesListTitle: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold"
            />
          </div>
        </div>
      </div>

      {/* 3. Main Mobile Section Order */}
      <div className="p-4 rounded-2xl border border-stone-200 bg-white space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h4 className="text-xs font-black text-stone-900 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-700" />
              <span>ترتیب نمایش بخش‌ها و ویترین‌ها در موبایل</span>
            </h4>
            <p className="text-[10px] text-stone-500 mt-0.5">
              ترتیب نمایش ویترین انتصاب و افتخارات، ویترین خدمات و سایر بخش‌های صفحه اول موبایل را تنظیم کنید.
            </p>
          </div>
          <button
            type="button"
            onClick={() => patchMobile({ mobileSectionOrder: [...CANONICAL_MOBILE_SECTION_ORDER] })}
            className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-[10px] font-bold text-stone-700 cursor-pointer"
          >
            ترتیب پیش‌فرض
          </button>
        </div>

        <div className="space-y-2">
          {m.mobileSectionOrder.map((secId, idx) => (
            <div
              key={secId}
              className="p-2.5 px-3 rounded-xl border border-stone-200 bg-stone-50/70 flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-6 h-6 rounded-full bg-[#071E17] text-[#F3D078] text-[11px] font-black flex items-center justify-center shrink-0">
                  {toPersianNumbers(idx + 1)}
                </span>
                <span className="text-xs font-extrabold text-stone-900 truncate">
                  {MOBILE_SECTION_LABELS[secId] || secId}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() =>
                    patchMobile({ mobileSectionOrder: moveItem(m.mobileSectionOrder, idx, -1) })
                  }
                  className="p-1.5 rounded-lg bg-white border border-stone-200 hover:bg-stone-100 disabled:opacity-30 cursor-pointer"
                  title="انتقال به بالا"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={idx === m.mobileSectionOrder.length - 1}
                  onClick={() =>
                    patchMobile({ mobileSectionOrder: moveItem(m.mobileSectionOrder, idx, 1) })
                  }
                  className="p-1.5 rounded-lg bg-white border border-stone-200 hover:bg-stone-100 disabled:opacity-30 cursor-pointer"
                  title="انتقال به پایین"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Dual Showcase Mode (Simple vs Detailed) + Inline Text/Photo Editing */}
      <div className="p-4 rounded-2xl border border-stone-200 bg-white space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="text-xs font-black text-stone-900 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-amber-700" />
              <span>مدیریت پیشرفته «ویترین خدمات» موبایل (متن، عکس، ترتیب و تفکیک زیرخدمات)</span>
            </h4>
            <p className="text-[10px] text-stone-500 mt-0.5">
              بین حالت ساده (۷ بخش اصلی) یا حالت پیشرفته و تفصیلی (نمایش مستقیم کارگاه‌ها، اطلاعیه‌ها، تسهیلات اضطراری، صندوق، اسکان و...) جابه‌جا شوید و متن و تصویر هر کارت را مستقیماً ویرایش کنید.
            </p>
          </div>

          <div className="inline-flex p-1 rounded-xl bg-stone-100 border border-stone-200 shrink-0">
            <button
              type="button"
              onClick={() => patchMobile({ showcaseMode: 'simple' })}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                m.showcaseMode === 'simple'
                  ? 'bg-[#071E17] text-[#F3D078] shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              حالت ساده (بخش‌ها)
            </button>
            <button
              type="button"
              onClick={() => patchMobile({ showcaseMode: 'detailed' })}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                m.showcaseMode === 'detailed'
                  ? 'bg-[#071E17] text-[#F3D078] shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              حالت پیشرفته و تفصیلی
            </button>
          </div>
        </div>

        {/* SIMPLE MODE LIST */}
        {m.showcaseMode === 'simple' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-stone-600">
                کارت‌های بخش‌های اصلی ویترین خدمات:
              </span>
              <button
                type="button"
                onClick={() =>
                  patchMobile({
                    showcaseOrder: [...CANONICAL_MOBILE_SHOWCASE_ORDER],
                    hiddenShowcases: {},
                    showcaseOverrides: {},
                  })
                }
                className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-[10px] font-bold text-stone-700 cursor-pointer"
              >
                بازنشانی همه
              </button>
            </div>

            {m.showcaseOrder.map((scId, idx) => {
              const hidden = Boolean(m.hiddenShowcases[scId]);
              const editKey = `simple_${scId}`;
              const isExpanded = expandedEditId === editKey;
              const ov = m.showcaseOverrides?.[scId];
              const hasOverride = Boolean(
                ov && (ov.title || ov.subtitle || ov.kicker || ov.metaText || ov.ctaLabel || ov.imageUrl)
              );

              return (
                <div
                  key={scId}
                  className={`p-3 rounded-xl border ${
                    hidden
                      ? 'bg-stone-100 border-dashed border-stone-300 opacity-75'
                      : 'bg-stone-50/50 border-stone-200'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 text-[11px] font-black flex items-center justify-center shrink-0">
                        {toPersianNumbers(idx + 1)}
                      </span>
                      <div className="min-w-0">
                        <span className="text-xs font-black text-stone-900 block truncate">
                          {ov?.title || MOBILE_SHOWCASE_LABELS[scId] || scId}
                        </span>
                        {hasOverride && (
                          <span className="text-[10px] font-bold text-emerald-700">
                            ویرایش سفارشی اعمال شده
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setExpandedEditId(isExpanded ? null : editKey)}
                        className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black border flex items-center gap-1 cursor-pointer ${
                          isExpanded
                            ? 'bg-amber-500 text-stone-950 border-amber-600'
                            : 'bg-white text-stone-800 border-stone-300 hover:bg-stone-100'
                        }`}
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>متن و عکس</span>
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>

                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() =>
                          patchMobile({ showcaseOrder: moveItem(m.showcaseOrder, idx, -1) })
                        }
                        className="p-1.5 rounded-lg bg-white border border-stone-200 hover:bg-stone-100 disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === m.showcaseOrder.length - 1}
                        onClick={() =>
                          patchMobile({ showcaseOrder: moveItem(m.showcaseOrder, idx, 1) })
                        }
                        className="p-1.5 rounded-lg bg-white border border-stone-200 hover:bg-stone-100 disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          patchMobile({
                            hiddenShowcases: {
                              ...m.hiddenShowcases,
                              [scId]: !hidden,
                            },
                          })
                        }
                        className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border flex items-center gap-1 cursor-pointer ${
                          !hidden
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-stone-200 text-stone-600 border-stone-300'
                        }`}
                      >
                        {!hidden ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        <span>{!hidden ? 'نمایش' : 'مخفی'}</span>
                      </button>
                    </div>
                  </div>

                  {isExpanded &&
                    renderInlineOverrideEditor(
                      editKey,
                      ov,
                      {
                        kicker: 'برچسب بالای کارت',
                        title: MOBILE_SHOWCASE_LABELS[scId],
                        subtitle: 'زیرعنوان توضیحی این بخش در موبایل',
                        metaText: 'متن اطلاعات پایین کارت',
                        ctaLabel: 'مشاهده و ورود',
                      },
                      patch => updateSimpleOverride(scId, patch),
                      () => resetSimpleOverride(scId)
                    )}
                </div>
              );
            })}
          </div>
        )}

        {/* DETAILED MODE LIST */}
        {m.showcaseMode === 'detailed' && (
          <div className="space-y-2">
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] font-bold text-amber-950 flex flex-wrap items-center justify-between gap-2">
              <span>
                در حالت پیشرفته، زیربخش‌ها (کارگاه‌های روانشناختی، اطلاعیه‌ها، ۵ ماژول رفاهیات و...) به عنوان کارت‌های مجزا در ویترین خدمات موبایل نمایش داده می‌شوند.
              </span>
              <button
                type="button"
                onClick={() =>
                  patchMobile({
                    detailedShowcaseOrder: [...CANONICAL_MOBILE_DETAILED_SHOWCASE_ORDER],
                    detailedShowcaseOverrides: {},
                  })
                }
                className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-amber-900 text-[10px] font-black cursor-pointer shrink-0"
              >
                بازنشانی تفصیلی
              </button>
            </div>

            {m.detailedShowcaseOrder.map((dId, idx) => {
              const meta = MOBILE_DETAILED_SHOWCASE_META[dId];
              const enabled = m.detailedShowcaseEnabled?.[dId] !== false;
              const editKey = `detailed_${dId}`;
              const isExpanded = expandedEditId === editKey;
              const ov = m.detailedShowcaseOverrides?.[dId];

              return (
                <div
                  key={dId}
                  className={`p-3 rounded-xl border ${
                    !enabled
                      ? 'bg-stone-100 border-dashed border-stone-300 opacity-75'
                      : 'bg-stone-50/50 border-stone-200'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-emerald-900 text-[#F3D078] text-[11px] font-black flex items-center justify-center shrink-0">
                        {toPersianNumbers(idx + 1)}
                      </span>
                      <span className="text-xs font-black text-stone-900 truncate">
                        {ov?.title || meta?.label || dId}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setExpandedEditId(isExpanded ? null : editKey)}
                        className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black border flex items-center gap-1 cursor-pointer ${
                          isExpanded
                            ? 'bg-amber-500 text-stone-950 border-amber-600'
                            : 'bg-white text-stone-800 border-stone-300 hover:bg-stone-100'
                        }`}
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>متن و عکس</span>
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>

                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() =>
                          patchMobile({
                            detailedShowcaseOrder: moveItem(m.detailedShowcaseOrder, idx, -1),
                          })
                        }
                        className="p-1.5 rounded-lg bg-white border border-stone-200 hover:bg-stone-100 disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === m.detailedShowcaseOrder.length - 1}
                        onClick={() =>
                          patchMobile({
                            detailedShowcaseOrder: moveItem(m.detailedShowcaseOrder, idx, 1),
                          })
                        }
                        className="p-1.5 rounded-lg bg-white border border-stone-200 hover:bg-stone-100 disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          patchMobile({
                            detailedShowcaseEnabled: {
                              ...(m.detailedShowcaseEnabled || {}),
                              [dId]: !enabled,
                            },
                          })
                        }
                        className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border flex items-center gap-1 cursor-pointer ${
                          enabled
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-stone-200 text-stone-600 border-stone-300'
                        }`}
                      >
                        {enabled ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        <span>{enabled ? 'فعال' : 'غیرفعال'}</span>
                      </button>
                    </div>
                  </div>

                  {isExpanded &&
                    meta &&
                    renderInlineOverrideEditor(
                      editKey,
                      ov,
                      {
                        kicker: meta.defaultKicker,
                        title: meta.defaultTitle,
                        subtitle: meta.defaultSubtitle,
                        metaText: 'دسترسی مستقیم',
                        ctaLabel: meta.defaultCta,
                      },
                      patch => updateDetailedOverride(dId, patch),
                      () => resetDetailedOverride(dId)
                    )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Custom Featured Showcase Cards (Workshops / Announcements / Direct Links) */}
      <div className="p-4 rounded-2xl border border-stone-200 bg-white space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h4 className="text-xs font-black text-stone-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>کارت‌های ویژه ویترین (کارگاه‌های روانشناختی، اطلاعیه‌ها و لینک مستقیم)</span>
            </h4>
            <p className="text-[10px] text-stone-500 mt-0.5">
              این کارت‌ها علاوه بر کارت‌های بالا در ویترین خدمات موبایل نمایش داده می‌شوند و با لمس آن‌ها کاربر مستقیماً به تب موردنظر هدایت می‌شود.
            </p>
          </div>
          <button
            type="button"
            onClick={addCustomCard}
            className="px-3 py-1.5 rounded-xl bg-[#071E17] hover:bg-[#0E3226] text-[#F3D078] text-[11px] font-black flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>افزودن کارت ویژه</span>
          </button>
        </div>

        <div className="space-y-2.5">
          {(m.customShowcaseCards || []).map((card, idx) => {
            const editKey = `custom_${card.id}`;
            const isExpanded = expandedEditId === editKey;
            const targetObj = TARGET_VIEW_OPTIONS.find(t => t.value === card.targetView);

            return (
              <div
                key={card.id}
                className={`p-3 rounded-xl border ${
                  card.enabled
                    ? 'bg-emerald-50/35 border-emerald-200'
                    : 'bg-stone-100 border-dashed border-stone-300 opacity-75'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-[#071E17] text-[#F3D078] text-[11px] font-black flex items-center justify-center shrink-0">
                      {toPersianNumbers(idx + 1)}
                    </span>
                    <div className="min-w-0">
                      <span className="text-xs font-black text-stone-900 block truncate">
                        {card.title}
                      </span>
                      <span className="text-[10px] text-stone-500 truncate block">
                        مقصد: {targetObj?.label || card.targetView}
                        {card.subTab ? ` · ${card.subTab}` : ''}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setExpandedEditId(isExpanded ? null : editKey)}
                      className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black border flex items-center gap-1 cursor-pointer ${
                        isExpanded
                          ? 'bg-amber-500 text-stone-950 border-amber-600'
                          : 'bg-white text-stone-800 border-stone-300'
                      }`}
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>ویرایش</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => updateCustomCard(card.id, { enabled: !card.enabled })}
                      className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border flex items-center gap-1 cursor-pointer ${
                        card.enabled
                          ? 'bg-emerald-700 text-white border-emerald-700'
                          : 'bg-stone-200 text-stone-700 border-stone-300'
                      }`}
                    >
                      {card.enabled ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      <span>{card.enabled ? 'فعال' : 'خاموش'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteCustomCard(card.id)}
                      className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 cursor-pointer"
                      title="حذف کارت"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-stone-200 space-y-2.5 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-stone-600 mb-1">برچسب بالا</label>
                        <input
                          type="text"
                          value={card.kicker}
                          onChange={e => updateCustomCard(card.id, { kicker: e.target.value })}
                          className="w-full px-2.5 py-2 rounded-xl border border-stone-300 bg-white font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-stone-600 mb-1">عنوان کارت</label>
                        <input
                          type="text"
                          value={card.title}
                          onChange={e => updateCustomCard(card.id, { title: e.target.value })}
                          className="w-full px-2.5 py-2 rounded-xl border border-stone-300 bg-white font-bold"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-stone-600 mb-1">توضیح</label>
                        <input
                          type="text"
                          value={card.subtitle}
                          onChange={e => updateCustomCard(card.id, { subtitle: e.target.value })}
                          className="w-full px-2.5 py-2 rounded-xl border border-stone-300 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-stone-600 mb-1">متن پایین کارت</label>
                        <input
                          type="text"
                          value={card.metaText || ''}
                          onChange={e => updateCustomCard(card.id, { metaText: e.target.value })}
                          className="w-full px-2.5 py-2 rounded-xl border border-stone-300 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-stone-600 mb-1">متن دکمه</label>
                        <input
                          type="text"
                          value={card.ctaLabel}
                          onChange={e => updateCustomCard(card.id, { ctaLabel: e.target.value })}
                          className="w-full px-2.5 py-2 rounded-xl border border-stone-300 bg-white font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-stone-600 mb-1">بخش مقصد</label>
                        <select
                          value={card.targetView}
                          onChange={e => {
                            const nextTarget = e.target.value;
                            const found = TARGET_VIEW_OPTIONS.find(t => t.value === nextTarget);
                            updateCustomCard(card.id, {
                              targetView: nextTarget,
                              subTab: found?.subTabs?.[0]?.value || undefined,
                            });
                          }}
                          className="w-full px-2.5 py-2 rounded-xl border border-stone-300 bg-white font-bold"
                        >
                          {TARGET_VIEW_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      {targetObj?.subTabs && (
                        <div>
                          <label className="block text-[10px] font-bold text-stone-600 mb-1">زیرتب مقصد</label>
                          <select
                            value={card.subTab || ''}
                            onChange={e => updateCustomCard(card.id, { subTab: e.target.value })}
                            className="w-full px-2.5 py-2 rounded-xl border border-stone-300 bg-white font-bold"
                          >
                            {targetObj.subTabs.map(st => (
                              <option key={st.value} value={st.value}>
                                {st.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    <div className="p-2.5 rounded-xl bg-white border border-stone-200 flex flex-wrap items-center gap-2">
                      {card.imageUrl && (
                        <img
                          src={card.imageUrl}
                          alt={card.title}
                          className="w-11 h-11 rounded-lg object-cover border border-stone-300 shrink-0"
                        />
                      )}
                      <input
                        type="text"
                        value={card.imageUrl || ''}
                        onChange={e => updateCustomCard(card.id, { imageUrl: e.target.value })}
                        placeholder="آدرس تصویر کارت"
                        className="flex-1 min-w-[160px] px-2.5 py-2 rounded-lg border border-stone-300 text-[11px] dir-ltr"
                      />
                      <button
                        type="button"
                        disabled={uploadingTarget === editKey}
                        onClick={() => triggerUpload(editKey, url => updateCustomCard(card.id, { imageUrl: url }))}
                        className="px-3 py-2 min-h-[38px] rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-[11px] font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        {uploadingTarget === editKey ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Upload className="w-3.5 h-3.5" />
                        )}
                        <span>آپلود عکس</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. Order & Visibility of Independent Tabs inside "فهرست خدمات" */}
      <div className="p-4 rounded-2xl border border-stone-200 bg-white space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h4 className="text-xs font-black text-stone-900 flex items-center gap-1.5">
              <ListOrdered className="w-4 h-4 text-emerald-700" />
              <span>ترتیب و نمایش بخش‌های مستقل در «فهرست خدمات»</span>
            </h4>
            <p className="text-[10px] text-stone-500 mt-0.5">
              تمام بخش‌ها به صورت مستقل و تفکیک‌شده نمایش داده می‌شوند؛ ترتیب یا وضعیت نمایش آن‌ها را تغییر دهید.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              patchMobile({
                servicesListOrder: [...CANONICAL_MOBILE_SERVICES_LIST_ORDER],
                hiddenServicesListItems: {},
              })
            }
            className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-[10px] font-bold text-stone-700 cursor-pointer"
          >
            بازنشانی
          </button>
        </div>

        <div className="space-y-2">
          {m.servicesListOrder.map((tabId, idx) => {
            const hidden = Boolean(m.hiddenServicesListItems[tabId]);
            return (
              <div
                key={tabId}
                className={`p-2.5 px-3 rounded-xl border flex items-center justify-between gap-2 ${
                  hidden ? 'bg-stone-100 border-dashed border-stone-300 opacity-65' : 'bg-white border-stone-200'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-900 text-[11px] font-black flex items-center justify-center shrink-0">
                    {toPersianNumbers(idx + 1)}
                  </span>
                  <span className="text-xs font-bold text-stone-900 truncate">
                    {MOBILE_SERVICES_LIST_LABELS[tabId] || tabId}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() =>
                      patchMobile({ servicesListOrder: moveItem(m.servicesListOrder, idx, -1) })
                    }
                    className="p-1.5 rounded-lg bg-stone-50 border border-stone-200 hover:bg-stone-100 disabled:opacity-30 cursor-pointer"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === m.servicesListOrder.length - 1}
                    onClick={() =>
                      patchMobile({ servicesListOrder: moveItem(m.servicesListOrder, idx, 1) })
                    }
                    className="p-1.5 rounded-lg bg-stone-50 border border-stone-200 hover:bg-stone-100 disabled:opacity-30 cursor-pointer"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      patchMobile({
                        hiddenServicesListItems: {
                          ...m.hiddenServicesListItems,
                          [tabId]: !hidden,
                        },
                      })
                    }
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-1 cursor-pointer ${
                      !hidden
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-stone-200 text-stone-600 border-stone-300'
                    }`}
                  >
                    {!hidden ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    <span>{!hidden ? 'نمایش' : 'مخفی'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
