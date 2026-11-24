import React from 'react';
import {
  CrextioDashboardConfig,
  CrextioMobileConfig,
  MobileSectionId,
  MobileServiceShowcaseId,
  MobileServiceListTabId,
} from '../../types';
import { DEFAULT_CREXTIO_CONFIG } from '../../data/mockData';
import {
  resolveMobileConfig,
  CANONICAL_MOBILE_SECTION_ORDER,
  CANONICAL_MOBILE_SHOWCASE_ORDER,
  CANONICAL_MOBILE_SERVICES_LIST_ORDER,
} from '../../context/ThemeContext';
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

  const patchMobile = (updates: Partial<CrextioMobileConfig>) => {
    commit({
      mobileConfig: {
        ...m,
        ...updates,
      },
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

  return (
    <div className="space-y-6" dir="rtl">
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

      {/* 3. Main Mobile Section Order (Including Honors vs Services Showcase Ordering) */}
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

      {/* 4. Order & Visibility of Cards inside "ویترین خدمات" */}
      <div className="p-4 rounded-2xl border border-stone-200 bg-white space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h4 className="text-xs font-black text-stone-900 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-amber-700" />
              <span>ترتیب و نمایش کارت‌های داخل «ویترین خدمات»</span>
            </h4>
            <p className="text-[10px] text-stone-500 mt-0.5">
              هر خدمت را می‌توانید در ویترین خدمات موبایل جابه‌جا یا مخفی کنید.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              patchMobile({
                showcaseOrder: [...CANONICAL_MOBILE_SHOWCASE_ORDER],
                hiddenShowcases: {},
              })
            }
            className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-[10px] font-bold text-stone-700 cursor-pointer"
          >
            بازنشانی
          </button>
        </div>

        <div className="space-y-2">
          {m.showcaseOrder.map((scId, idx) => {
            const hidden = Boolean(m.hiddenShowcases[scId]);
            return (
              <div
                key={scId}
                className={`p-2.5 px-3 rounded-xl border flex items-center justify-between gap-2 ${
                  hidden ? 'bg-stone-100 border-dashed border-stone-300 opacity-65' : 'bg-white border-stone-200'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 text-[11px] font-black flex items-center justify-center shrink-0">
                    {toPersianNumbers(idx + 1)}
                  </span>
                  <span className="text-xs font-bold text-stone-900 truncate">
                    {MOBILE_SHOWCASE_LABELS[scId] || scId}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() =>
                      patchMobile({ showcaseOrder: moveItem(m.showcaseOrder, idx, -1) })
                    }
                    className="p-1.5 rounded-lg bg-stone-50 border border-stone-200 hover:bg-stone-100 disabled:opacity-30 cursor-pointer"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === m.showcaseOrder.length - 1}
                    onClick={() =>
                      patchMobile({ showcaseOrder: moveItem(m.showcaseOrder, idx, 1) })
                    }
                    className="p-1.5 rounded-lg bg-stone-50 border border-stone-200 hover:bg-stone-100 disabled:opacity-30 cursor-pointer"
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

      {/* 5. Order & Visibility of Independent Tabs inside "فهرست خدمات" */}
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
