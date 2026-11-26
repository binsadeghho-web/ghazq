import React, { useRef, useState } from 'react';
import {
  CrextioDashboardConfig,
  CrextioTheme3Config,
  MobileSectionId,
  MobileServiceListTabId,
} from '../../types';
import { DEFAULT_CREXTIO_CONFIG } from '../../data/mockData';
import {
  CANONICAL_MOBILE_SECTION_ORDER,
  CANONICAL_MOBILE_SERVICES_LIST_ORDER,
  CANONICAL_THEME3_QUICK_DOCK_ORDER,
  resolveMobileConfig,
  resolveTheme3Config,
} from '../../context/ThemeContext';
import { Theme3ShowcaseEditorSection } from './Theme3ShowcaseEditorSection';
import { api } from '../../services/apiClient';
import { toPersianNumbers } from '../../utils/persianNumbers';
import {
  ArrowDown,
  ArrowUp,
  Compass,
  Copy,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Layers,
  LayoutGrid,
  ListOrdered,
  Loader2,
  Monitor,
  Plus,
  RotateCcw,
  Sparkles,
  Split,
  Trash2,
  Upload,
} from 'lucide-react';

export type Theme3StudioTab = 'layout' | 'hero_dock' | 'showcases' | 'services_list';

interface Theme3StudioPanelProps {
  crextioConfig: CrextioDashboardConfig;
  commit: (updates: Partial<CrextioDashboardConfig>) => void;
  activeTab: Theme3StudioTab;
  onTabChange: (tab: Theme3StudioTab) => void;
}

const SECTION_LABELS: Record<MobileSectionId, string> = {
  hero: 'کارت خوش‌آمدگویی و هویت عضو',
  quick_dock: 'نوار «درگاه‌های دسترسی سریع»',
  status_ledger: 'دفتر وضعیت پرونده‌ها، اطلاعیه‌ها و تقویم',
  honors_showcase: 'بخش مستقل «ویترین انتصاب و افتخارات»',
  services_showcase: 'بخش «ویترین خدمات» (کارت‌های تصویری)',
  services_list: 'بخش «فهرست خدمات» (نمای تفصیلی زیربخش‌ها)',
};

const QUICK_DOCK_LABELS: Record<string, string> = {
  People: 'کارتابل',
  Courses: 'دوره‌ها',
  CounselingGeneral: 'مشاوره و سلامت',
  SpecializedCounseling: 'مشاوره قضا',
  Rulings: 'تالار آراء',
  Research: 'پژوهش',
  Welfare: 'رفاهیات',
  Products: 'انتشارات',
  Synergy: 'هم‌افزایی',
  Finance: 'امور مالی',
  Alumni: 'دانش‌آموختگان',
  Users: 'کاربران',
  Admin: 'مدیریت',
};

const SERVICES_LIST_LABELS: Record<MobileServiceListTabId, string> = {
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

const NAV_TARGET_OPTIONS = [
  { value: 'People', label: 'کارتابل درخواست‌ها' },
  { value: 'Synergy', label: 'تالار هم‌افزایی' },
  { value: 'Research', label: 'راهبری پژوهش و مقاله' },
  { value: 'Courses', label: 'دوره‌های علمی' },
  { value: 'Rulings', label: 'تالار آراء قضایی' },
  { value: 'CounselingGeneral', label: 'خدمات روانشناختی و مشاوره' },
  { value: 'SpecializedCounseling', label: 'مشاوره شغلی قضا' },
  { value: 'Welfare', label: 'خدمات رفاهی و وام' },
  { value: 'Products', label: 'کتاب و محصولات چند رسانه‌ای' },
  { value: 'Alumni', label: 'بانک نخبگان' },
];

function moveItem<T>(arr: T[], idx: number, dir: -1 | 1): T[] {
  const target = idx + dir;
  if (target < 0 || target >= arr.length) return arr;
  const copy = [...arr];
  const [item] = copy.splice(idx, 1);
  copy.splice(target, 0, item);
  return copy;
}

export const Theme3StudioPanel: React.FC<Theme3StudioPanelProps> = ({
  crextioConfig,
  commit,
  activeTab,
  onTabChange,
}) => {
  const t3 = resolveTheme3Config(crextioConfig.theme3Config);
  const [uploadingPortrait, setUploadingPortrait] = useState(false);
  const portraitInputRef = useRef<HTMLInputElement>(null);

  const patchTheme3 = (updates: Partial<CrextioTheme3Config>) => {
    const nextOrder = updates.theme3SectionOrder ?? t3.theme3SectionOrder;
    commit({
      theme3Config: {
        ...t3,
        ...updates,
        theme3SectionOrder: nextOrder,
        mobileSectionOrder: nextOrder,
      },
    });
  };

  const handleCopyFromMobile = () => {
    const m = resolveMobileConfig(crextioConfig.mobileConfig);
    patchTheme3({
      showHeroBanner: m.showHeroBanner,
      showHeroPortrait: m.showHeroPortrait,
      showWelcomeQuickButtons: m.showWelcomeQuickButtons,
      showHeroStats: m.showHeroStats,
      showQuickDock: m.showQuickDock,
      showStatusLedger: m.showStatusLedger,
      showHonorsShowcase: m.showHonorsShowcase,
      separateHonorsShowcase: m.separateHonorsShowcase,
      honorsShowcaseTitle: m.honorsShowcaseTitle,
      showServicesShowcase: m.showServicesShowcase,
      servicesShowcaseTitle: m.servicesShowcaseTitle,
      showcaseMode: m.showcaseMode,
      showcaseOrder: [...m.showcaseOrder],
      hiddenShowcases: { ...m.hiddenShowcases },
      showcaseOverrides: { ...m.showcaseOverrides },
      detailedShowcaseOrder: [...m.detailedShowcaseOrder],
      detailedShowcaseEnabled: { ...m.detailedShowcaseEnabled },
      detailedShowcaseOverrides: { ...m.detailedShowcaseOverrides },
      customShowcaseCards: [...(m.customShowcaseCards || [])],
      showServicesList: m.showServicesList,
      showServicesListHeaderBox: m.showServicesListHeaderBox,
      servicesListTitle: m.servicesListTitle,
      servicesListOrder: [...m.servicesListOrder],
      hiddenServicesListItems: { ...m.hiddenServicesListItems },
      theme3SectionOrder: [...m.mobileSectionOrder],
    });
    window.dispatchEvent(
      new CustomEvent('app:toast', {
        detail: { message: 'تنظیمات فعلی موبایل در تم ۳ کپی و ذخیره شد.', type: 'success' },
      })
    );
  };

  const handleUploadPortrait = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPortrait(true);
    try {
      const res = await api.uploadFile(file, 'misc');
      if (res?.url) {
        patchTheme3({ heroPortraitOverride: res.url });
      }
    } catch (err: any) {
      window.dispatchEvent(
        new CustomEvent('app:toast', {
          detail: { message: `خطا در آپلود تصویر: ${err?.message || 'خطای سرور'}`, type: 'error' },
        })
      );
    } finally {
      setUploadingPortrait(false);
      if (portraitInputRef.current) portraitInputRef.current.value = '';
    }
  };

  const toggleItems: Array<{
    key: keyof Pick<
      CrextioTheme3Config,
      | 'showTopNavBar'
      | 'showHeroBanner'
      | 'showHeroPortrait'
      | 'showWelcomeQuickButtons'
      | 'showHeroStats'
      | 'showQuickDock'
      | 'showQuickDockMoreButton'
      | 'showStatusLedger'
      | 'showLedgerBanner'
      | 'showLedgerCounters'
      | 'showLedgerCalendar'
      | 'showHonorsShowcase'
      | 'separateHonorsShowcase'
      | 'showServicesShowcase'
      | 'showServicesList'
      | 'showServicesListHeaderBox'
      | 'showActiveWorkshopsSpotlight'
    >;
    title: string;
    subtitle: string;
    value: boolean;
  }> = [
    {
      key: 'showTopNavBar',
      title: 'نمایش نوار منوی افقی بالای تم ۳ در لپ‌تاپ',
      subtitle: 'در صورت خاموش کردن، منوی افقی بالای صفحه پنهان و فضا جمع‌وجورتر می‌شود',
      value: t3.showTopNavBar,
    },
    {
      key: 'showHeroBanner',
      title: 'نمایش کارت خوش‌آمدگویی و هویت عضو',
      subtitle: 'کارت اصلی بالای تم ۳ با مشخصات، دوره عضویت و کارت هویت',
      value: t3.showHeroBanner,
    },
    {
      key: 'showHeroPortrait',
      title: 'نمایش تصویر پرتره کاربر در کارت خوش‌آمدگویی',
      subtitle: 'نمایش عکس پروفایل یا آواتار با قاب طلایی',
      value: t3.showHeroPortrait,
    },
    {
      key: 'showWelcomeQuickButtons',
      title: 'دکمه‌های اقدام سریع کارت خوش‌آمدگویی',
      subtitle: 'دکمه‌های کارتابل، هم‌افزایی و «همه خدمات» داخل کارت بالایی',
      value: t3.showWelcomeQuickButtons,
    },
    {
      key: 'showHeroStats',
      title: 'نوار آمار زنده در پایین کارت خوش‌آمدگویی',
      subtitle: 'نمایش شاخص‌های کلان (دانش‌آموختگان، دوره‌ها، دادنامه‌ها)',
      value: t3.showHeroStats,
    },
    {
      key: 'showQuickDock',
      title: 'نمایش کامل بخش «درگاه‌های دسترسی سریع»',
      subtitle: 'با خاموش کردن این گزینه، کل نوار دسترسی سریع در تم ۳ مخفی می‌شود',
      value: t3.showQuickDock,
    },
    {
      key: 'showQuickDockMoreButton',
      title: 'نمایش دکمه‌های «همه بخش‌ها / بیشتر» در دسترسی سریع',
      subtitle: 'دکمه باز کردن منوی جامع همه خدمات در بخش دسترسی سریع',
      value: t3.showQuickDockMoreButton,
    },
    {
      key: 'showStatusLedger',
      title: 'نمایش کارت «وضعیت جاری، اطلاعیه‌ها و تقویم»',
      subtitle: 'کارت کنار خوش‌آمدگویی شامل بنر، شمارنده پرونده‌ها و تقویم',
      value: t3.showStatusLedger,
    },
    {
      key: 'showLedgerBanner',
      title: 'نمایش بخش «بنر اطلاعیه» در کارت وضعیت جاری',
      subtitle: 'نوار اطلاعیه بالای کارت وضعیت جاری',
      value: t3.showLedgerBanner,
    },
    {
      key: 'showLedgerCounters',
      title: 'نمایش شمارنده پرونده‌ها و دوره‌ها در کارت وضعیت',
      subtitle: 'نمایش تعداد پرونده‌های فعال و دوره‌های ثبت‌نامی',
      value: t3.showLedgerCounters,
    },
    {
      key: 'showLedgerCalendar',
      title: 'نمایش بخش «تقویم رویدادها» در کارت وضعیت',
      subtitle: 'رویدادهای پیش‌رو در پایین کارت وضعیت جاری',
      value: t3.showLedgerCalendar,
    },
    {
      key: 'showHonorsShowcase',
      title: 'نمایش «ویترین انتصاب و افتخارات»',
      subtitle: 'کارت‌های انتصابات قضایی و رتبه‌های برتر نخبگان',
      value: t3.showHonorsShowcase,
    },
    {
      key: 'separateHonorsShowcase',
      title: 'جداسازی «ویترین افتخارات» از «ویترین خدمات»',
      subtitle: 'نمایش مستقل کارت‌های افتخارات به عنوان یک بخش جداگانه',
      value: t3.separateHonorsShowcase,
    },
    {
      key: 'showServicesShowcase',
      title: 'نمایش بخش «ویترین خدمات» (کارت‌های تصویری)',
      subtitle: 'کارت‌های تصویری و اسلایدهای خدمات مرکز در تم ۳',
      value: t3.showServicesShowcase,
    },
    {
      key: 'showServicesList',
      title: 'نمایش بخش «فهرست خدمات» (میز کار پایین صفحه)',
      subtitle: 'تب‌های تعاملی با جزئیات کامل هر خدمت در صفحه اول تم ۳',
      value: t3.showServicesList,
    },
    {
      key: 'showServicesListHeaderBox',
      title: 'نمایش باکس عنوان «فهرست خدمات»',
      subtitle: 'فقط باکس تیتر بالای سربرگ‌ها را مخفی می‌کند؛ تب‌ها و محتوای خدمات فعال می‌مانند',
      value: t3.showServicesListHeaderBox,
    },
    {
      key: 'showActiveWorkshopsSpotlight',
      title: 'نمایش کارت ویژه «کارگاه در حال برگزاری» کنار فهرست خدمات',
      subtitle: 'کارت اطلاع‌رسانی و ثبت‌نام سریع کارگاه‌های فعال',
      value: t3.showActiveWorkshopsSpotlight,
    },
  ];

  const studioTabs: Array<{ id: Theme3StudioTab; label: string; icon: any }> = [
    { id: 'layout', label: 'اجزا، نمایش و ترتیب بخش‌ها', icon: LayoutGrid },
    { id: 'hero_dock', label: 'هدر و دسترسی‌های سریع', icon: Compass },
    { id: 'showcases', label: 'ویترین‌های تصویری و کارت‌ها', icon: Sparkles },
    { id: 'services_list', label: 'فهرست خدمات و تب‌ها', icon: ListOrdered },
  ];

  return (
    <div className="space-y-5" dir="rtl">
      <input
        ref={portraitInputRef}
        type="file"
        accept="image/*"
        onChange={handleUploadPortrait}
        className="hidden"
      />

      {/* Top Info + Actions */}
      <div className="p-4 rounded-2xl bg-gradient-to-l from-[#071E17] via-[#0E3226] to-[#113D30] text-white border border-[#F3D078]/30 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-[#F3D078]/35 flex items-center justify-center text-[#F3D078] shrink-0">
            <Monitor className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-black text-white truncate">
              تنظیمات کاملاً مستقل تم ۳ (نمای لپ‌تاپ موبایل‌محور)
            </h3>
            <p className="text-[11px] text-emerald-100/80 mt-0.5">
              تغییرات این بخش منحصراً برای تم ۳ ذخیره می‌شوند و هیچ تغییری در موبایل، تم ۱ یا تم ۲ ایجاد نمی‌کنند.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopyFromMobile}
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5 text-[#F3D078]" />
            <span>کپی چیدمان از موبایل</span>
          </button>
          <button
            type="button"
            onClick={() =>
              commit({
                theme3Config: {
                  ...(DEFAULT_CREXTIO_CONFIG.theme3Config as CrextioTheme3Config),
                },
              })
            }
            className="px-3 py-2 rounded-xl bg-[#F3D078]/15 hover:bg-[#F3D078]/25 text-[#F3D078] border border-[#F3D078]/35 text-[11px] font-black flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>بازگردانی پیش‌فرض تم ۳</span>
          </button>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none border-b border-stone-200 pb-2">
        {studioTabs.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`px-3.5 py-2 min-h-[40px] rounded-xl text-xs font-black whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
                active
                  ? 'bg-[#071E17] text-[#F3D078] shadow-xs'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200/80'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: LAYOUT, VISIBILITY & ORDER */}
      {activeTab === 'layout' && (
        <div className="space-y-5">
          {/* Alumni Default Theme Selector (Theme 2 vs Theme 3) */}
          <div className="p-4 rounded-2xl border border-[#DFD8C4] bg-[#FAF8F2] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-black text-[#071E17]">
                تم نمایشی پیش‌فرض برای تمام دانش‌آموختگان
              </h4>
              <p className="text-[11px] text-stone-600 mt-0.5">
                انتخاب کنید کاربران با نقش دانش‌آموخته هنگام ورود، سامانه را در تم ۲ یا تم ۳ مشاهده کنند (بلافاصله برای همه اعمال و ذخیره می‌شود).
              </p>
            </div>
            <div className="inline-flex p-1 rounded-xl bg-white border border-stone-200 shrink-0">
              <button
                type="button"
                onClick={() => {
                  commit({ alumniDefaultTheme: 'crextio' });
                  window.dispatchEvent(
                    new CustomEvent('app:toast', {
                      detail: { message: 'تم نمایشی دانش‌آموختگان روی «تم ۲ (میزان)» تنظیم و ذخیره شد.', type: 'success' },
                    })
                  );
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-black cursor-pointer transition-colors ${
                  (crextioConfig.alumniDefaultTheme || 'crextio') === 'crextio'
                    ? 'bg-[#071E17] text-[#F3D078]'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                تم ۲ (میزان)
              </button>
              <button
                type="button"
                onClick={() => {
                  commit({ alumniDefaultTheme: 'theme3' });
                  window.dispatchEvent(
                    new CustomEvent('app:toast', {
                      detail: { message: 'تم نمایشی دانش‌آموختگان روی «تم ۳ (موبایل‌محور)» تنظیم و ذخیره شد.', type: 'success' },
                    })
                  );
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-black cursor-pointer transition-colors ${
                  crextioConfig.alumniDefaultTheme === 'theme3'
                    ? 'bg-[#071E17] text-[#F3D078]'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                تم ۳ (موبایل‌محور)
              </button>
            </div>
          </div>

          {/* Visibility Toggles */}
          <div className="p-4 rounded-2xl border border-stone-200 bg-white space-y-3">
            <h4 className="text-xs font-black text-stone-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-700" />
              <span>فعال یا غیرفعال‌سازی تک‌تک اجزای تم ۳</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {toggleItems.map(item => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() =>
                    patchTheme3({ [item.key]: !item.value } as Partial<CrextioTheme3Config>)
                  }
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

          {/* Section Titles & Desktop Cards Per Row */}
          <div className="p-4 rounded-2xl border border-stone-200 bg-white space-y-4">
            <h4 className="text-xs font-black text-stone-900 flex items-center gap-1.5">
              <Split className="w-4 h-4 text-amber-700" />
              <span>عنوان بخش‌ها و تعداد کارت در هر ردیف لپ‌تاپ</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">
                  عنوان بخش دسترسی سریع
                </label>
                <input
                  type="text"
                  value={t3.quickDockTitle}
                  onChange={e => patchTheme3({ quickDockTitle: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">
                  عنوان ویترین انتصاب و افتخارات
                </label>
                <input
                  type="text"
                  value={t3.honorsShowcaseTitle}
                  onChange={e => patchTheme3({ honorsShowcaseTitle: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">
                  عنوان ویترین خدمات
                </label>
                <input
                  type="text"
                  value={t3.servicesShowcaseTitle}
                  onChange={e => patchTheme3({ servicesShowcaseTitle: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">
                  عنوان فهرست خدمات
                </label>
                <input
                  type="text"
                  value={t3.servicesListTitle}
                  onChange={e => patchTheme3({ servicesListTitle: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-stone-800">
                  تعداد کارت ویترین افتخارات در ردیف:
                </span>
                <div className="inline-flex p-0.5 rounded-lg bg-white border border-stone-200">
                  {([2, 3, 4] as const).map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => patchTheme3({ honorsCardsPerRow: n })}
                      className={`px-2.5 py-1 rounded-md text-xs font-black cursor-pointer tabular-nums ${
                        t3.honorsCardsPerRow === n
                          ? 'bg-[#071E17] text-[#F3D078]'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      {toPersianNumbers(n)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-stone-800">
                  تعداد کارت ویترین خدمات در ردیف:
                </span>
                <div className="inline-flex p-0.5 rounded-lg bg-white border border-stone-200">
                  {([2, 3, 4] as const).map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => patchTheme3({ servicesCardsPerRow: n })}
                      className={`px-2.5 py-1 rounded-md text-xs font-black cursor-pointer tabular-nums ${
                        t3.servicesCardsPerRow === n
                          ? 'bg-[#071E17] text-[#F3D078]'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      {toPersianNumbers(n)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section Order */}
          <div className="p-4 rounded-2xl border border-stone-200 bg-white space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-black text-stone-900 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-emerald-700" />
                  <span>ترتیب نمایش بخش‌های اصلی در صفحه تم ۳</span>
                </h4>
                <p className="text-[10px] text-stone-500 mt-0.5">
                  نکته: «کارت خوش‌آمدگویی» و «دفتر وضعیت جاری» در نمای لپ‌تاپ در ردیف بالای دو ستونی کنار هم قرار می‌گیرند.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  patchTheme3({ theme3SectionOrder: [...CANONICAL_MOBILE_SECTION_ORDER] })
                }
                className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-[10px] font-bold text-stone-700 cursor-pointer"
              >
                ترتیب پیش‌فرض
              </button>
            </div>

            <div className="space-y-2">
              {t3.theme3SectionOrder.map((secId, idx) => (
                <div
                  key={secId}
                  className="p-2.5 px-3 rounded-xl border border-stone-200 bg-stone-50/70 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-[#071E17] text-[#F3D078] text-[11px] font-black flex items-center justify-center shrink-0 tabular-nums">
                      {toPersianNumbers(idx + 1)}
                    </span>
                    <span className="text-xs font-extrabold text-stone-900 truncate">
                      {SECTION_LABELS[secId] || secId}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() =>
                        patchTheme3({
                          theme3SectionOrder: moveItem(t3.theme3SectionOrder, idx, -1),
                        })
                      }
                      className="p-1.5 rounded-lg bg-white border border-stone-200 hover:bg-stone-100 disabled:opacity-30 cursor-pointer"
                      title="انتقال به بالا"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === t3.theme3SectionOrder.length - 1}
                      onClick={() =>
                        patchTheme3({
                          theme3SectionOrder: moveItem(t3.theme3SectionOrder, idx, 1),
                        })
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
        </div>
      )}

      {/* TAB 2: HERO OVERRIDES + QUICK ACCESS DOCK FULL MANAGER */}
      {activeTab === 'hero_dock' && (
        <div className="space-y-5">
          {/* Hero Overrides */}
          <div className="p-4 rounded-2xl border border-stone-200 bg-white space-y-3 text-xs">
            <h4 className="text-xs font-black text-stone-900">
              تنظیمات متون و تصویر پرتره اختصاصی کارت خوش‌آمد تم ۳
            </h4>
            <p className="text-[10px] text-stone-500">
              در صورت خالی ماندن این فیلدها، الگوی پویا و تصویر پروفایل پیش‌فرض استفاده می‌شود. در متن عنوان می‌توانید از {'{name}'} برای نام کاربر استفاده کنید.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">
                  متن جایگزین عنوان خوش‌آمدگویی تم ۳
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={t3.heroTitleOverride}
                    onChange={e => patchTheme3({ heroTitleOverride: e.target.value })}
                    placeholder={crextioConfig.heroTitle || 'خوش آمدید، {name}'}
                    className="flex-1 px-3 py-2 rounded-xl border border-stone-300 font-bold"
                  />
                  {t3.heroTitleOverride && (
                    <button
                      type="button"
                      onClick={() => patchTheme3({ heroTitleOverride: '' })}
                      className="px-2.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-[10px] font-bold cursor-pointer"
                    >
                      پاک کردن
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">
                  برچسب طرح روی کارت عضویت تم ۳
                </label>
                <input
                  type="text"
                  value={t3.heroSchemeLabelOverride}
                  onChange={e => patchTheme3({ heroSchemeLabelOverride: e.target.value })}
                  placeholder={crextioConfig.heroSchemeLabel || 'طرح میزان'}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold"
                />
              </div>
              <div className="sm:col-span-2 p-2.5 rounded-xl bg-stone-50 border border-stone-200 flex flex-wrap items-center gap-2">
                {t3.heroPortraitOverride ? (
                  <img
                    src={t3.heroPortraitOverride}
                    alt="پرتره تم ۳"
                    className="w-11 h-11 rounded-xl object-cover object-top border border-stone-300 shrink-0"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-xl bg-stone-200/70 text-stone-500 flex items-center justify-center shrink-0">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                )}
                <input
                  type="text"
                  value={t3.heroPortraitOverride}
                  onChange={e => patchTheme3({ heroPortraitOverride: e.target.value })}
                  placeholder="آدرس عکس پرتره پیش‌فرض اختصاصی تم ۳ (اختیاری)"
                  className="flex-1 min-w-[160px] px-2.5 py-2 rounded-lg border border-stone-300 bg-white text-[11px] dir-ltr"
                />
                <button
                  type="button"
                  disabled={uploadingPortrait}
                  onClick={() => portraitInputRef.current?.click()}
                  className="px-3 py-2 min-h-[38px] rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-[11px] font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  {uploadingPortrait ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  <span>آپلود پرتره</span>
                </button>
                {t3.heroPortraitOverride && (
                  <button
                    type="button"
                    onClick={() => patchTheme3({ heroPortraitOverride: '' })}
                    className="px-2.5 py-2 min-h-[38px] rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-700 text-[11px] font-bold cursor-pointer"
                  >
                    حذف
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Hero Quick Buttons Manager */}
          <div className="p-4 rounded-2xl border border-stone-200 bg-white space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-black text-stone-900">
                  دکمه‌های اقدام سریع داخل کارت خوش‌آمدگویی تم ۳
                </h4>
                <p className="text-[10px] text-stone-500 mt-0.5">
                  دکمه‌های فعال در کارت مشکی-طلایی بالای صفحه تم ۳ (می‌توانید کل دکمه‌ها یا تک‌تک آن‌ها را مخفی و ویرایش کنید).
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    patchTheme3({ showWelcomeQuickButtons: !t3.showWelcomeQuickButtons })
                  }
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-black border cursor-pointer ${
                    t3.showWelcomeQuickButtons
                      ? 'bg-emerald-800 text-white border-emerald-800'
                      : 'bg-stone-100 text-stone-600 border-stone-300'
                  }`}
                >
                  {t3.showWelcomeQuickButtons ? 'نمایش دکمه‌ها: فعال' : 'نمایش دکمه‌ها: خاموش'}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    patchTheme3({
                      heroQuickButtons: [
                        ...t3.heroQuickButtons,
                        {
                          id: `t3_qb_${Date.now()}`,
                          label: 'دکمه جدید',
                          targetNav: 'People',
                          visible: true,
                        },
                      ],
                    })
                  }
                  className="px-3 py-1.5 rounded-xl bg-[#071E17] text-[#F3D078] text-[11px] font-black flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>افزودن دکمه</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {t3.heroQuickButtons.map((btn, idx) => (
                <div
                  key={btn.id}
                  className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 flex flex-wrap items-center gap-2"
                >
                  <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 text-[11px] font-black flex items-center justify-center shrink-0 tabular-nums">
                    {toPersianNumbers(idx + 1)}
                  </span>
                  <input
                    type="text"
                    value={btn.label}
                    onChange={e =>
                      patchTheme3({
                        heroQuickButtons: t3.heroQuickButtons.map((b, i) =>
                          i === idx ? { ...b, label: e.target.value } : b
                        ),
                      })
                    }
                    className="flex-1 min-w-[130px] px-2.5 py-1.5 rounded-lg bg-white border border-stone-300 text-xs font-bold"
                  />
                  <select
                    value={btn.targetNav}
                    onChange={e =>
                      patchTheme3({
                        heroQuickButtons: t3.heroQuickButtons.map((b, i) =>
                          i === idx ? { ...b, targetNav: e.target.value } : b
                        ),
                      })
                    }
                    className="px-2.5 py-1.5 rounded-lg bg-white border border-stone-300 text-[11px] font-bold"
                  >
                    {NAV_TARGET_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() =>
                      patchTheme3({ heroQuickButtons: moveItem(t3.heroQuickButtons, idx, -1) })
                    }
                    className="p-1.5 rounded-lg bg-white border border-stone-200 hover:bg-stone-100 disabled:opacity-30 cursor-pointer"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === t3.heroQuickButtons.length - 1}
                    onClick={() =>
                      patchTheme3({ heroQuickButtons: moveItem(t3.heroQuickButtons, idx, 1) })
                    }
                    className="p-1.5 rounded-lg bg-white border border-stone-200 hover:bg-stone-100 disabled:opacity-30 cursor-pointer"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      patchTheme3({
                        heroQuickButtons: t3.heroQuickButtons.map((b, i) =>
                          i === idx ? { ...b, visible: b.visible === false } : b
                        ),
                      })
                    }
                    className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border flex items-center gap-1 cursor-pointer ${
                      btn.visible !== false
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-stone-200 text-stone-600 border-stone-300'
                    }`}
                  >
                    {btn.visible !== false ? (
                      <Eye className="w-3 h-3" />
                    ) : (
                      <EyeOff className="w-3 h-3" />
                    )}
                    <span>{btn.visible !== false ? 'نمایش' : 'مخفی'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      patchTheme3({
                        heroQuickButtons: t3.heroQuickButtons.filter((_, i) => i !== idx),
                      })
                    }
                    className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 cursor-pointer"
                    title="حذف دکمه"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Access Dock Manager (درگاه‌های دسترسی سریع) */}
          <div className="p-4 rounded-2xl border border-stone-200 bg-white space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-black text-stone-900 flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-emerald-700" />
                  <span>مدیریت کامل بخش «{t3.quickDockTitle || 'درگاه‌های دسترسی سریع'}»</span>
                </h4>
                <p className="text-[10px] text-stone-500 mt-0.5">
                  کل این بخش را غیرفعال کنید یا تک‌تک آیکون‌های دسترسی سریع را فعال/غیرفعال، جابه‌جا و ویرایش نام کنید.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => patchTheme3({ showQuickDock: !t3.showQuickDock })}
                  className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black border cursor-pointer ${
                    t3.showQuickDock
                      ? 'bg-emerald-800 text-white border-emerald-800'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  {t3.showQuickDock ? 'کل بخش: فعال' : 'کل بخش: غیرفعال'}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    patchTheme3({ showQuickDockMoreButton: !t3.showQuickDockMoreButton })
                  }
                  className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border cursor-pointer ${
                    t3.showQuickDockMoreButton
                      ? 'bg-amber-50 text-amber-900 border-amber-200'
                      : 'bg-stone-100 text-stone-600 border-stone-300'
                  }`}
                >
                  {t3.showQuickDockMoreButton ? 'دکمه «بیشتر»: فعال' : 'دکمه «بیشتر»: خاموش'}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    patchTheme3({
                      quickDockOrder: [...CANONICAL_THEME3_QUICK_DOCK_ORDER],
                      hiddenQuickDockItems: {},
                      quickDockLabelOverrides: {},
                    })
                  }
                  className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-[10px] font-bold text-stone-700 cursor-pointer"
                >
                  بازنشانی دسترسی سریع
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={t3.quickDockTitle}
                onChange={e => patchTheme3({ quickDockTitle: e.target.value })}
                placeholder="عنوان بخش دسترسی سریع"
                className="flex-1 min-w-[200px] px-3 py-2 rounded-xl border border-stone-300 text-xs font-bold"
              />
              <button
                type="button"
                onClick={() => patchTheme3({ hiddenQuickDockItems: {} })}
                className="px-2.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-bold cursor-pointer"
              >
                فعال‌سازی همه آیکون‌ها
              </button>
              <button
                type="button"
                onClick={() => {
                  const allHidden: Record<string, boolean> = {};
                  t3.quickDockOrder.forEach(id => {
                    allHidden[id] = true;
                  });
                  patchTheme3({ hiddenQuickDockItems: allHidden });
                }}
                className="px-2.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 text-[11px] font-bold cursor-pointer"
              >
                مخفی‌سازی همه آیکون‌ها
              </button>
            </div>

            <div className="space-y-2">
              {t3.quickDockOrder.map((dockId, idx) => {
                const isHidden = Boolean(t3.hiddenQuickDockItems?.[dockId]);
                const defaultLabel = QUICK_DOCK_LABELS[dockId] || dockId;
                const customLabel = t3.quickDockLabelOverrides?.[dockId] ?? '';
                return (
                  <div
                    key={dockId}
                    className={`p-2.5 px-3 rounded-xl border flex flex-wrap items-center justify-between gap-2 ${
                      isHidden
                        ? 'bg-stone-100 border-dashed border-stone-300 opacity-70'
                        : 'bg-stone-50/60 border-stone-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-[180px]">
                      <span className="w-6 h-6 rounded-full bg-[#071E17] text-[#F3D078] text-[11px] font-black flex items-center justify-center shrink-0 tabular-nums">
                        {toPersianNumbers(idx + 1)}
                      </span>
                      <input
                        type="text"
                        value={customLabel}
                        onChange={e =>
                          patchTheme3({
                            quickDockLabelOverrides: {
                              ...(t3.quickDockLabelOverrides || {}),
                              [dockId]: e.target.value,
                            },
                          })
                        }
                        placeholder={defaultLabel}
                        className="flex-1 min-w-[120px] px-2.5 py-1.5 rounded-lg bg-white border border-stone-300 text-xs font-bold"
                      />
                      <span className="text-[10px] text-stone-400 hidden sm:inline shrink-0">
                        ({defaultLabel})
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() =>
                          patchTheme3({ quickDockOrder: moveItem(t3.quickDockOrder, idx, -1) })
                        }
                        className="p-1.5 rounded-lg bg-white border border-stone-200 hover:bg-stone-100 disabled:opacity-30 cursor-pointer"
                        title="انتقال به راست/بالا"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === t3.quickDockOrder.length - 1}
                        onClick={() =>
                          patchTheme3({ quickDockOrder: moveItem(t3.quickDockOrder, idx, 1) })
                        }
                        className="p-1.5 rounded-lg bg-white border border-stone-200 hover:bg-stone-100 disabled:opacity-30 cursor-pointer"
                        title="انتقال به چپ/پایین"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          patchTheme3({
                            hiddenQuickDockItems: {
                              ...(t3.hiddenQuickDockItems || {}),
                              [dockId]: !isHidden,
                            },
                          })
                        }
                        className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border flex items-center gap-1 cursor-pointer ${
                          !isHidden
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-stone-200 text-stone-600 border-stone-300'
                        }`}
                      >
                        {!isHidden ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        <span>{!isHidden ? 'فعال' : 'غیرفعال'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SHOWCASES & CUSTOM CARDS */}
      {activeTab === 'showcases' && (
        <Theme3ShowcaseEditorSection theme3Config={t3} patchTheme3={patchTheme3} />
      )}

      {/* TAB 4: SERVICES LIST TABS & LABELS */}
      {activeTab === 'services_list' && (
        <div className="p-4 rounded-2xl border border-stone-200 bg-white space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="text-xs font-black text-stone-900 flex items-center gap-1.5">
                <ListOrdered className="w-4 h-4 text-emerald-700" />
                <span>ترتیب، نام و نمایش تب‌های «{t3.servicesListTitle || 'فهرست خدمات'}»</span>
              </h4>
              <p className="text-[10px] text-stone-500 mt-0.5">
                هر یک از ۹ بخش داخل میز فهرست خدمات تم ۳ را به صورت مستقل تغییر نام، مرتب یا غیرفعال کنید.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => patchTheme3({ showServicesListHeaderBox: !t3.showServicesListHeaderBox })}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black border cursor-pointer ${
                  t3.showServicesListHeaderBox
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                {t3.showServicesListHeaderBox ? 'باکس عنوان: فعال' : 'باکس عنوان: مخفی'}
              </button>
              <button
                type="button"
                onClick={() => patchTheme3({ showServicesList: !t3.showServicesList })}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black border cursor-pointer ${
                  t3.showServicesList
                    ? 'bg-emerald-800 text-white border-emerald-800'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                {t3.showServicesList ? 'کل فهرست: فعال' : 'کل فهرست: مخفی'}
              </button>
              <button
                type="button"
                onClick={() =>
                  patchTheme3({
                    servicesListOrder: [...CANONICAL_MOBILE_SERVICES_LIST_ORDER],
                    hiddenServicesListItems: {},
                    servicesListLabelOverrides: {},
                  })
                }
                className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-[10px] font-bold text-stone-700 cursor-pointer"
              >
                بازنشانی
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {t3.servicesListOrder.map((tabId, idx) => {
              const hidden = Boolean(t3.hiddenServicesListItems?.[tabId]);
              const defaultLabel = SERVICES_LIST_LABELS[tabId] || tabId;
              const customLabel = t3.servicesListLabelOverrides?.[tabId] ?? '';
              return (
                <div
                  key={tabId}
                  className={`p-2.5 px-3 rounded-xl border flex flex-wrap items-center justify-between gap-2 ${
                    hidden
                      ? 'bg-stone-100 border-dashed border-stone-300 opacity-65'
                      : 'bg-white border-stone-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-[180px]">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-900 text-[11px] font-black flex items-center justify-center shrink-0 tabular-nums">
                      {toPersianNumbers(idx + 1)}
                    </span>
                    <input
                      type="text"
                      value={customLabel}
                      onChange={e =>
                        patchTheme3({
                          servicesListLabelOverrides: {
                            ...(t3.servicesListLabelOverrides || {}),
                            [tabId]: e.target.value,
                          },
                        })
                      }
                      placeholder={defaultLabel}
                      className="flex-1 min-w-[120px] px-2.5 py-1.5 rounded-lg bg-stone-50 border border-stone-300 text-xs font-bold"
                    />
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() =>
                        patchTheme3({
                          servicesListOrder: moveItem(t3.servicesListOrder, idx, -1),
                        })
                      }
                      className="p-1.5 rounded-lg bg-stone-50 border border-stone-200 hover:bg-stone-100 disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === t3.servicesListOrder.length - 1}
                      onClick={() =>
                        patchTheme3({
                          servicesListOrder: moveItem(t3.servicesListOrder, idx, 1),
                        })
                      }
                      className="p-1.5 rounded-lg bg-stone-50 border border-stone-200 hover:bg-stone-100 disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        patchTheme3({
                          hiddenServicesListItems: {
                            ...t3.hiddenServicesListItems,
                            [tabId]: !hidden,
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
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
