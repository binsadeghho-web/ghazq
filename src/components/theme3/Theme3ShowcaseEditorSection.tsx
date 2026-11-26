import React, { useRef, useState } from 'react';
import {
  CrextioMobileCustomCard,
  CrextioMobileShowcaseOverride,
  CrextioTheme3Config,
  MobileDetailedShowcaseId,
  MobileServiceShowcaseId,
} from '../../types';
import {
  CANONICAL_MOBILE_DETAILED_SHOWCASE_ORDER,
  CANONICAL_MOBILE_SHOWCASE_ORDER,
} from '../../context/ThemeContext';
import { api } from '../../services/apiClient';
import { toPersianNumbers } from '../../utils/persianNumbers';
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  Edit3,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Layers,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';

interface Theme3ShowcaseEditorSectionProps {
  theme3Config: Required<CrextioTheme3Config>;
  patchTheme3: (updates: Partial<CrextioTheme3Config>) => void;
}

const SHOWCASE_LABELS: Record<MobileServiceShowcaseId, string> = {
  counseling: 'خدمات روانشناختی و مشاوره',
  counseling_specialized: 'مشاوره شغلی قضا',
  courses: 'دوره‌ها و کارگاه‌های علمی',
  rulings: 'تالار نقد آراء قضایی',
  research: 'راهبری پژوهش و مقاله',
  welfare: 'تسهیلات، اقامتگاه و رفاهیات',
  products: 'کتاب و محصولات چند رسانه‌ای',
};

const DETAILED_SHOWCASE_META: Record<
  MobileDetailedShowcaseId,
  {
    label: string;
    defaultKicker: string;
    defaultTitle: string;
    defaultSubtitle: string;
    defaultCta: string;
  }
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
  welfare_recreation: {
    label: 'رفاهیات: تفریحی و گردشگری (تور و اردو)',
    defaultKicker: 'تور، اردو و برنامه‌های تفریحی',
    defaultTitle: 'برنامه‌های تفریحی و گردشگری اعضا',
    defaultSubtitle: 'مشاهده اطلاعیه‌ها، ظرفیت، هزینه، شیوه ثبت‌نام و جزئیات کامل تورها و اردوها',
    defaultCta: 'مشاهده برنامه‌ها',
  },
  products_featured: {
    label: 'کتاب و محصولات چند رسانه‌ای',
    defaultKicker: 'نشر و رسانه علمی',
    defaultTitle: 'کتاب‌ها، نشست‌ها و درس‌گفتارهای چندرسانه‌ای',
    defaultSubtitle: 'موسوعه‌های فقهی، آثار مرجع و فایل‌های صوتی جلسات',
    defaultCta: 'نمایشگاه آثار',
  },
};

const TARGET_VIEW_OPTIONS: Array<{
  value: string;
  label: string;
  subTabs?: Array<{ value: string; label: string }>;
}> = [
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
      { value: 'recreation_tourism', label: 'تفریحی و گردشگری' },
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

export const Theme3ShowcaseEditorSection: React.FC<Theme3ShowcaseEditorSectionProps> = ({
  theme3Config,
  patchTheme3,
}) => {
  const [expandedEditId, setExpandedEditId] = useState<string | null>(null);
  const [uploadingTarget, setUploadingTarget] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadCallbackRef = useRef<((url: string) => void) | null>(null);

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
      if (res?.url) cb(res.url);
    } catch (err: any) {
      window.dispatchEvent(
        new CustomEvent('app:toast', {
          detail: { message: `خطا در آپلود تصویر: ${err?.message || 'خطای سرور'}`, type: 'error' },
        })
      );
    } finally {
      setUploadingTarget(null);
      uploadCallbackRef.current = null;
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const updateSimpleOverride = (
    scId: MobileServiceShowcaseId,
    patch: Partial<CrextioMobileShowcaseOverride>
  ) => {
    const prev = theme3Config.showcaseOverrides?.[scId] || {};
    patchTheme3({
      showcaseOverrides: {
        ...(theme3Config.showcaseOverrides || {}),
        [scId]: { ...prev, ...patch },
      },
    });
  };

  const resetSimpleOverride = (scId: MobileServiceShowcaseId) => {
    const copy = { ...(theme3Config.showcaseOverrides || {}) };
    delete copy[scId];
    patchTheme3({ showcaseOverrides: copy });
  };

  const updateDetailedOverride = (
    dId: MobileDetailedShowcaseId,
    patch: Partial<CrextioMobileShowcaseOverride>
  ) => {
    const prev = theme3Config.detailedShowcaseOverrides?.[dId] || {};
    patchTheme3({
      detailedShowcaseOverrides: {
        ...(theme3Config.detailedShowcaseOverrides || {}),
        [dId]: { ...prev, ...patch },
      },
    });
  };

  const resetDetailedOverride = (dId: MobileDetailedShowcaseId) => {
    const copy = { ...(theme3Config.detailedShowcaseOverrides || {}) };
    delete copy[dId];
    patchTheme3({ detailedShowcaseOverrides: copy });
  };

  const updateCustomCard = (id: string, patch: Partial<CrextioMobileCustomCard>) => {
    const next = (theme3Config.customShowcaseCards || []).map(c =>
      c.id === id ? { ...c, ...patch } : c
    );
    patchTheme3({ customShowcaseCards: next });
  };

  const addCustomCard = () => {
    const newCard: CrextioMobileCustomCard = {
      id: `t3_custom_card_${Date.now()}`,
      enabled: true,
      kicker: 'ویترین اختصاصی تم ۳',
      title: 'کارت جدید ویترین خدمات',
      subtitle: 'توضیح کوتاه درباره این خدمت یا کارگاه',
      metaText: 'دسترسی مستقیم',
      ctaLabel: 'مشاهده جزئیات',
      targetView: 'CounselingGeneral',
      subTab: 'workshops',
    };
    patchTheme3({
      customShowcaseCards: [...(theme3Config.customShowcaseCards || []), newCard],
    });
    setExpandedEditId(`custom_${newCard.id}`);
  };

  const deleteCustomCard = (id: string) => {
    patchTheme3({
      customShowcaseCards: (theme3Config.customShowcaseCards || []).filter(c => c.id !== id),
    });
  };

  const renderInlineOverrideEditor = (
    editKey: string,
    ov: CrextioMobileShowcaseOverride | undefined,
    placeholders: {
      kicker: string;
      title: string;
      subtitle: string;
      metaText: string;
      ctaLabel: string;
    },
    onPatch: (patch: Partial<CrextioMobileShowcaseOverride>) => void,
    onReset: () => void
  ) => {
    const isUploading = uploadingTarget === editKey;
    return (
      <div className="mt-2 pt-3 border-t border-stone-200 space-y-2.5 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] font-bold text-stone-600 mb-1">
              برچسب بالای کارت (Kicker)
            </label>
            <input
              type="text"
              value={ov?.kicker ?? ''}
              onChange={e => onPatch({ kicker: e.target.value })}
              placeholder={placeholders.kicker}
              className="w-full px-2.5 py-2 rounded-xl border border-stone-300 bg-white font-bold text-xs"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-stone-600 mb-1">
              عنوان اصلی کارت
            </label>
            <input
              type="text"
              value={ov?.title ?? ''}
              onChange={e => onPatch({ title: e.target.value })}
              placeholder={placeholders.title}
              className="w-full px-2.5 py-2 rounded-xl border border-stone-300 bg-white font-bold text-xs"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[10px] font-bold text-stone-600 mb-1">
              زیرعنوان / توضیح کارت
            </label>
            <input
              type="text"
              value={ov?.subtitle ?? ''}
              onChange={e => onPatch({ subtitle: e.target.value })}
              placeholder={placeholders.subtitle}
              className="w-full px-2.5 py-2 rounded-xl border border-stone-300 bg-white text-xs"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-stone-600 mb-1">
              متن فوتر (Meta)
            </label>
            <input
              type="text"
              value={ov?.metaText ?? ''}
              onChange={e => onPatch({ metaText: e.target.value })}
              placeholder={placeholders.metaText}
              className="w-full px-2.5 py-2 rounded-xl border border-stone-300 bg-white text-xs"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-stone-600 mb-1">
              متن دکمه اقدام (CTA)
            </label>
            <input
              type="text"
              value={ov?.ctaLabel ?? ''}
              onChange={e => onPatch({ ctaLabel: e.target.value })}
              placeholder={placeholders.ctaLabel}
              className="w-full px-2.5 py-2 rounded-xl border border-stone-300 bg-white font-bold text-xs"
            />
          </div>
        </div>

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
            {isUploading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5" />
            )}
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
    <div className="space-y-5">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Mode Switcher + Cards List */}
      <div className="p-4 rounded-2xl border border-stone-200 bg-white space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="text-xs font-black text-stone-900 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-amber-700" />
              <span>مدیریت پیشرفته «ویترین خدمات» تم ۳ (متن، عکس، ترتیب و تفکیک زیرخدمات)</span>
            </h4>
            <p className="text-[10px] text-stone-500 mt-0.5">
              تمام تغییرات این بخش منحصراً برای تم ۳ ذخیره می‌شوند و تاثیری روی موبایل یا تم ۲ ندارند.
            </p>
          </div>

          <div className="inline-flex p-1 rounded-xl bg-stone-100 border border-stone-200 shrink-0">
            <button
              type="button"
              onClick={() => patchTheme3({ showcaseMode: 'simple' })}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                theme3Config.showcaseMode === 'simple'
                  ? 'bg-[#071E17] text-[#F3D078] shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              حالت ساده (۷ بخش)
            </button>
            <button
              type="button"
              onClick={() => patchTheme3({ showcaseMode: 'detailed' })}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                theme3Config.showcaseMode === 'detailed'
                  ? 'bg-[#071E17] text-[#F3D078] shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              حالت پیشرفته و تفصیلی (۱۴ کارت)
            </button>
          </div>
        </div>

        {/* SIMPLE MODE LIST */}
        {theme3Config.showcaseMode === 'simple' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-stone-600">
                کارت‌های بخش‌های اصلی ویترین خدمات تم ۳:
              </span>
              <button
                type="button"
                onClick={() =>
                  patchTheme3({
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

            {theme3Config.showcaseOrder.map((scId, idx) => {
              const hidden = Boolean(theme3Config.hiddenShowcases[scId]);
              const editKey = `simple_${scId}`;
              const isExpanded = expandedEditId === editKey;
              const ov = theme3Config.showcaseOverrides?.[scId];
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
                      <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 text-[11px] font-black flex items-center justify-center shrink-0 tabular-nums">
                        {toPersianNumbers(idx + 1)}
                      </span>
                      <div className="min-w-0">
                        <span className="text-xs font-black text-stone-900 block truncate">
                          {ov?.title || SHOWCASE_LABELS[scId] || scId}
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
                          patchTheme3({
                            showcaseOrder: moveItem(theme3Config.showcaseOrder, idx, -1),
                          })
                        }
                        className="p-1.5 rounded-lg bg-white border border-stone-200 hover:bg-stone-100 disabled:opacity-30 cursor-pointer"
                        title="انتقال به بالا"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === theme3Config.showcaseOrder.length - 1}
                        onClick={() =>
                          patchTheme3({
                            showcaseOrder: moveItem(theme3Config.showcaseOrder, idx, 1),
                          })
                        }
                        className="p-1.5 rounded-lg bg-white border border-stone-200 hover:bg-stone-100 disabled:opacity-30 cursor-pointer"
                        title="انتقال به پایین"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          patchTheme3({
                            hiddenShowcases: {
                              ...theme3Config.hiddenShowcases,
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
                        title: SHOWCASE_LABELS[scId],
                        subtitle: 'زیرعنوان توضیحی این بخش در تم ۳',
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
        {theme3Config.showcaseMode === 'detailed' && (
          <div className="space-y-2">
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] font-bold text-amber-950 flex flex-wrap items-center justify-between gap-2">
              <span>
                در حالت پیشرفته، زیربخش‌ها (کارگاه‌ها، اطلاعیه‌ها، ۶ بخش رفاهیات و...) به عنوان کارت‌های مجزا در ویترین خدمات تم ۳ نمایش داده می‌شوند.
              </span>
              <button
                type="button"
                onClick={() =>
                  patchTheme3({
                    detailedShowcaseOrder: [...CANONICAL_MOBILE_DETAILED_SHOWCASE_ORDER],
                    detailedShowcaseOverrides: {},
                  })
                }
                className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-amber-900 text-[10px] font-black cursor-pointer shrink-0"
              >
                بازنشانی تفصیلی
              </button>
            </div>

            {theme3Config.detailedShowcaseOrder.map((dId, idx) => {
              const meta = DETAILED_SHOWCASE_META[dId];
              const enabled = theme3Config.detailedShowcaseEnabled?.[dId] !== false;
              const editKey = `detailed_${dId}`;
              const isExpanded = expandedEditId === editKey;
              const ov = theme3Config.detailedShowcaseOverrides?.[dId];

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
                      <span className="w-6 h-6 rounded-full bg-emerald-900 text-[#F3D078] text-[11px] font-black flex items-center justify-center shrink-0 tabular-nums">
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
                          patchTheme3({
                            detailedShowcaseOrder: moveItem(
                              theme3Config.detailedShowcaseOrder,
                              idx,
                              -1
                            ),
                          })
                        }
                        className="p-1.5 rounded-lg bg-white border border-stone-200 hover:bg-stone-100 disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === theme3Config.detailedShowcaseOrder.length - 1}
                        onClick={() =>
                          patchTheme3({
                            detailedShowcaseOrder: moveItem(
                              theme3Config.detailedShowcaseOrder,
                              idx,
                              1
                            ),
                          })
                        }
                        className="p-1.5 rounded-lg bg-white border border-stone-200 hover:bg-stone-100 disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          patchTheme3({
                            detailedShowcaseEnabled: {
                              ...(theme3Config.detailedShowcaseEnabled || {}),
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

      {/* Custom Featured Cards */}
      <div className="p-4 rounded-2xl border border-stone-200 bg-white space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h4 className="text-xs font-black text-stone-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>کارت‌های ویژه اختصاصی در ویترین خدمات تم ۳</span>
            </h4>
            <p className="text-[10px] text-stone-500 mt-0.5">
              کارت‌های میانبر دلخواه با تصویر، متن و مقصد دقیق (مثلاً کارگاه‌های روانشناختی، تورها یا اطلاعیه‌ها) اضافه کنید.
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
          {(theme3Config.customShowcaseCards || []).map((card, idx) => {
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
                    <span className="w-6 h-6 rounded-full bg-[#071E17] text-[#F3D078] text-[11px] font-black flex items-center justify-center shrink-0 tabular-nums">
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
                        <label className="block text-[10px] font-bold text-stone-600 mb-1">
                          برچسب بالا
                        </label>
                        <input
                          type="text"
                          value={card.kicker}
                          onChange={e => updateCustomCard(card.id, { kicker: e.target.value })}
                          className="w-full px-2.5 py-2 rounded-xl border border-stone-300 bg-white font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-stone-600 mb-1">
                          عنوان کارت
                        </label>
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
                        <label className="block text-[10px] font-bold text-stone-600 mb-1">
                          متن پایین کارت
                        </label>
                        <input
                          type="text"
                          value={card.metaText || ''}
                          onChange={e => updateCustomCard(card.id, { metaText: e.target.value })}
                          className="w-full px-2.5 py-2 rounded-xl border border-stone-300 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-stone-600 mb-1">
                          متن دکمه
                        </label>
                        <input
                          type="text"
                          value={card.ctaLabel}
                          onChange={e => updateCustomCard(card.id, { ctaLabel: e.target.value })}
                          className="w-full px-2.5 py-2 rounded-xl border border-stone-300 bg-white font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-stone-600 mb-1">
                          بخش مقصد
                        </label>
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
                          <label className="block text-[10px] font-bold text-stone-600 mb-1">
                            زیرتب مقصد
                          </label>
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
                        onClick={() =>
                          triggerUpload(editKey, url => updateCustomCard(card.id, { imageUrl: url }))
                        }
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
          {(theme3Config.customShowcaseCards || []).length === 0 && (
            <p className="py-4 text-center text-xs text-stone-500 bg-stone-50 rounded-xl border border-dashed border-stone-200">
              کارت ویژه‌ای ثبت نشده است. با دکمه بالا کارت جدید اضافه کنید.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
