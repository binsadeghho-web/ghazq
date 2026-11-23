import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CrextioDashboardConfig } from '../../types';
import { DEFAULT_CREXTIO_CONFIG } from '../../data/mockData';
import { api } from '../../services/apiClient';
import { resolveShowcaseImageUrl } from '../../data/showcaseImages';
import { toPersianNumbers } from '../../utils/persianNumbers';
import {
  CANONICAL_DASHBOARD_SECTION_ORDER,
  reconcileDashboardSectionOrder,
} from '../../context/ThemeContext';
import {
  HonorsManagerEditor,
  UnifiedShowcaseManagerEditor,
} from '../admin/theme_customizer_subcomponents/CustomizerHonorsUnifiedTab';
import { ShowcaseImagesStudioPanel } from '../admin/theme_customizer_subcomponents/ShowcaseImagesStudioPanel';
import { CustomizerNavigationTab } from '../admin/theme_customizer_subcomponents/CustomizerNavigationTab';
import { formatWelcomeBannerTitle } from '../../utils/welcomeBanner';
import { useApp } from '../../context/AppContext';
import {
  X,
  Sparkles,
  Type,
  LayoutGrid,
  Award,
  Sliders,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Columns2,
  Minimize2,
  Maximize2,
  Image as ImageIcon,
  Upload,
  Loader2,
  RotateCcw,
  Plus,
  Trash2,
  Palette,
  Menu,
} from 'lucide-react';

export type Theme2StudioTab =
  | 'hero_quick'
  | 'navigation'
  | 'all_banners'
  | 'layout_boxes'
  | 'honors_unified';

interface Theme2StudioDrawerProps {
  isOpen: boolean;
  initialTab?: Theme2StudioTab;
  onClose: () => void;
  onOpenAdvancedModal?: () => void;
  crextioConfig: CrextioDashboardConfig;
  updateCrextioConfig: (updates: Partial<CrextioDashboardConfig>) => void;
}

const SECTION_LABELS: Record<string, string> = {
  dashboard_banners: 'بنرها و اطلاعیه‌های سراسری داشبورد',
  status_widget: 'ویجت خلاصه وضعیت پرونده‌ها و خدمات',
  events_calendar: 'ویجت تقویم رویدادها و مهلت‌های مرکز',
  top_vip_row: 'بنر خوش‌آمدگویی و کارت پرتره عضو',
  honors_showcase: 'ویترین افتخارات و انتصابات نخبگان',
  unified_showcase: 'ویترین جامع یکپارچه (همه ویترین‌ها)',
  rulings_showcase: 'ویترین تالار نقد آراء قضایی',
  research_promo: 'ویترین راهبری پژوهش و رساله‌ها',
  course_showcase: 'ویترین دوره‌ها و کارگاه‌های علمی',
  counseling_promo: 'ویترین خدمات مشاوره تخصصی و نخبگان',
  counseling_general_showcase: 'ویترین خدمات مشاوره عمومی و خانواده',
  welfare_showcase: 'ویترین رفاهیات و تسهیلات',
  multimedia_showcase: 'ویترین درس‌گفتارها و چندرسانه‌ای',
  bento_grid: 'شبکه جامع خدمات (Bento)',
  books_showcase: 'ویترین کتب و منشورات تخصصی',
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

const MINIMAL_BOX_DEFAULTS: Array<{
  key: string;
  label: string;
  kicker: string;
  title: string;
  description: string;
  ctaLabel: string;
}> = [
  {
    key: 'rulings_showcase',
    label: 'باکس ساده تالار آراء',
    kicker: 'مباحثات تخصصی قضایی',
    title: 'تالار نقد و مباحثه آراء قضایی',
    description: 'بررسی استدلال‌های حقوقی، نقد رویه قضایی و تبادل نظر نخبگان بر روی آراء منتخب.',
    ctaLabel: 'ورود به تالار آراء',
  },
  {
    key: 'research_promo',
    label: 'باکس ساده راهبری پژوهش',
    kicker: 'حمایت و هدایت پژوهشی',
    title: 'راهبری پژوهش‌ها، رساله‌ها و پایان‌نامه‌ها',
    description: 'همراهی با اساتید راهنمای طراز اول، تخصیص گرنت پژوهشی و تسهیل اسکان علمی برای پیشبرد پژوهش‌ها.',
    ctaLabel: 'میز راهبری پژوهش',
  },
  {
    key: 'course_showcase',
    label: 'باکس ساده دوره‌ها',
    kicker: 'توانمندسازی علمی و کارگاه‌ها',
    title: 'دوره‌ها و کارگاه‌های تخصصی',
    description: 'نشست‌ها و دوره‌های مهارتی فقه القضا، آیین دادرسی و کارگاه‌های علمی دانش‌آموختگان.',
    ctaLabel: 'مشاهده دوره‌ها',
  },
  {
    key: 'counseling_promo',
    label: 'باکس ساده مشاوره تخصصی و نخبگان',
    kicker: 'هدایت شغلی، علمی و سلامت روان',
    title: 'خدمات مشاوره نخبگان',
    description: 'دریافت نوبت محرمانه مشاوره تخصصی قضایی-تحصیلی و مشاوره عمومی خانواده با اساتید برجسته.',
    ctaLabel: 'مشاوره شغلی قضا',
  },
  {
    key: 'counseling_general_showcase',
    label: 'باکس ساده مشاوره عمومی و خانواده',
    kicker: 'سلامت روان، خانواده و تاب‌آوری',
    title: 'خدمات مشاوره عمومی و خانواده',
    description: 'دریافت نوبت محرمانه مشاوره خانواده، زوج‌درمانی، پیش از ازدواج و مدیریت استرس شغلی.',
    ctaLabel: 'مشاوره عمومی و خانواده',
  },
  {
    key: 'welfare_showcase',
    label: 'باکس ساده رفاهیات',
    kicker: 'خدمات رفاهی و تسهیلات اعضا',
    title: 'رفاهیات، اقامتگاه‌ها و صندوق تعاون',
    description: 'ثبت درخواست اسکان زیارتی و پژوهشی در مشهد و قم، تسهیلات قرض‌الحسنه و تعاونی اعضا.',
    ctaLabel: 'ورود به میز رفاهیات',
  },
  {
    key: 'multimedia_showcase',
    label: 'باکس ساده درس‌گفتارها',
    kicker: 'آرشیو علمی و درس‌گفتارها',
    title: 'آرشیو صوت و تصویر درس‌گفتارها',
    description: 'دسترسی به جلسات ضبط‌شده خارج فقه القضا و نشست‌های تحلیل قضایی.',
    ctaLabel: 'مشاهده آرشیو',
  },
  {
    key: 'books_showcase',
    label: 'باکس ساده کتب و منشورات',
    kicker: 'مرکز نشر و پژوهش',
    title: 'منشورات و کتب مرجع فقه و قضا',
    description: 'دسترسی به کتب علمی، موسوعه‌ها و آثار تألیفی اساتید و دانش‌آموختگان مجمع.',
    ctaLabel: 'مشاهده منشورات',
  },
];

const NAV_TARGET_OPTIONS = [
  { value: 'People', label: 'کارتابل درخواست‌ها' },
  { value: 'Synergy', label: 'تالار هم‌افزایی' },
  { value: 'Research', label: 'راهبری پژوهش و مقاله (خدمات پژوهشی)' },
  { value: 'Courses', label: 'دوره‌های علمی' },
  { value: 'Rulings', label: 'تالار آراء قضایی' },
  { value: 'CounselingGeneral', label: 'مشاوره عمومی' },
  { value: 'SpecializedCounseling', label: 'مشاوره شغلی قضا' },
  { value: 'Welfare', label: 'خدمات رفاهی و وام' },
  { value: 'Products', label: 'کتاب و محصولات چند رسانه‌ای' },
  { value: 'Alumni', label: 'بانک نخبگان' },
];

export const Theme2StudioDrawer: React.FC<Theme2StudioDrawerProps> = ({
  isOpen,
  initialTab = 'hero_quick',
  onClose,
  onOpenAdvancedModal,
  crextioConfig,
  updateCrextioConfig,
}) => {
  const { currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<Theme2StudioTab>(initialTab);
  const [savedToast, setSavedToast] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const targetKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (isOpen) setActiveTab(initialTab);
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const pulseSaved = () => {
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 1800);
  };

  const commit = (updates: Partial<CrextioDashboardConfig>) => {
    updateCrextioConfig(updates);
    pulseSaved();
  };

  const sectionOrder = reconcileDashboardSectionOrder(crextioConfig.dashboardSectionOrder);
  const hiddenMap = crextioConfig.hiddenDashboardSections || {};
  const layoutsMap = crextioConfig.dashboardSectionLayouts || {};
  const quickButtons =
    crextioConfig.heroQuickButtons && crextioConfig.heroQuickButtons.length > 0
      ? crextioConfig.heroQuickButtons
      : DEFAULT_CREXTIO_CONFIG.heroQuickButtons || [];

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const key = targetKeyRef.current;
    if (!file || !key) return;
    setUploadingKey(key);
    try {
      const res = await api.uploadFile(file, 'misc');
      if (res?.url) {
        commit({
          showcaseImageOverrides: {
            ...(crextioConfig.showcaseImageOverrides || {}),
            [key]: res.url,
          },
        });
      }
    } catch (err: any) {
      alert(`خطا در آپلود تصویر: ${err.message || 'خطای سرور'}`);
    } finally {
      setUploadingKey(null);
      targetKeyRef.current = null;
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const updateMinimalBoxOverride = (
    boxKey: string,
    field: 'kicker' | 'title' | 'description' | 'ctaLabel',
    value: string
  ) => {
    const prevAll = crextioConfig.minimalBoxOverrides || {};
    const prevBox = prevAll[boxKey] || {};
    commit({
      minimalBoxOverrides: {
        ...prevAll,
        [boxKey]: {
          ...prevBox,
          [field]: value,
        },
      },
    });
  };

  const moveSection = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= sectionOrder.length) return;
    const next = [...sectionOrder];
    const [moved] = next.splice(idx, 1);
    next.splice(target, 0, moved);
    commit({ dashboardSectionOrder: next });
  };

  const updateSectionLayout = (
    key: string,
    patch: Partial<{
      span: 'full' | 'half';
      density: 'full' | 'minimal';
      scale: 'micro' | 'compact' | 'normal' | 'expanded';
      showImage: boolean;
    }>
  ) => {
    const cur = layoutsMap[key] || {
      span: 'full',
      density: 'full',
      scale: 'normal',
      showImage: true,
    };
    commit({
      dashboardSectionLayouts: {
        ...layoutsMap,
        [key]: { ...cur, ...patch },
      },
    });
  };

  const portraitUrl = resolveShowcaseImageUrl('hero_portrait', crextioConfig.showcaseImageOverrides);

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs"
        dir="rtl"
        onClick={onClose}
      >
        <motion.aside
          initial={{ x: '-100%' }}
          animate={{ x: 0 }}
          exit={{ x: '-100%' }}
          transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-4xl h-full bg-white text-stone-900 shadow-2xl border-r border-stone-200 flex flex-col overflow-hidden"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleUploadImage}
            className="hidden"
          />

          {/* Top Bar */}
          <div className="px-6 py-4 bg-stone-950 text-white flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-black">
                  ویرایشگر کامل صفحه تم ۲ (استودیو زنده کرکستیو)
                </h2>
                <p className="text-[11px] text-stone-400">
                  تمامی تغییرات به‌صورت آنی در صفحه اعمال و با OCC در پایگاه داده MySQL ثبت می‌شوند
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {savedToast && (
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-[11px] font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>ذخیره شد</span>
                </span>
              )}
              {onOpenAdvancedModal && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAdvancedModal();
                  }}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/30 text-[11px] font-bold cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>تنظیمات تکمیلی ویترین‌ها و فونت</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-6 pt-3 bg-stone-50 border-b border-stone-200 flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0">
            {[
              { id: 'hero_quick', label: 'بنر خوش‌آمد، برند و دسترسی سریع', icon: Palette },
              { id: 'navigation', label: 'ناوبری عمودی، افقی و منو خدمات', icon: Menu },
              { id: 'all_banners', label: 'ویرایش ۱۰۰٪ متون و بنرها', icon: Type },
              { id: 'layout_boxes', label: 'چیدمان، جابه‌جایی ویجت‌ها و تقویم', icon: LayoutGrid },
              { id: 'honors_unified', label: 'افتخارات و ویترین جامع', icon: Award },
            ].map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as Theme2StudioTab)}
                  className={`pb-3 px-3 text-xs font-bold border-b-2 whitespace-nowrap flex items-center gap-1.5 transition-colors cursor-pointer ${
                    active
                      ? 'border-emerald-800 text-emerald-950 font-black'
                      : 'border-transparent text-stone-500 hover:text-stone-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* TAB 1: HERO, QUICK ACCESS / STATS MODE & BRAND */}
            {activeTab === 'hero_quick' && (
              <div className="space-y-6">
                {/* Canvas Theme & Hero Scale */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50/70 space-y-2.5">
                    <h3 className="text-xs font-black text-stone-900">پالت پس‌زمینه بوم تم ۲</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'warm_ivory', label: 'عاجی گرم', bg: 'bg-[#F8F7F2]' },
                        { id: 'royal_emerald', label: 'زمرد سلطنتی', bg: 'bg-[#F2F7F4]' },
                        { id: 'pure_minimal', label: 'سفید خالص', bg: 'bg-white' },
                      ].map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => commit({ canvasTheme: c.id as any })}
                          className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all ${
                            (crextioConfig.canvasTheme || 'warm_ivory') === c.id
                              ? 'border-emerald-700 ring-1 ring-emerald-700/30 bg-emerald-50/50'
                              : 'border-stone-200 bg-white'
                          }`}
                        >
                          <div className={`w-full h-5 rounded-md border border-stone-200 mb-1.5 ${c.bg}`} />
                          <span className="text-[11px] font-bold text-stone-800">{c.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50/70 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-xs font-black text-stone-900">ابعاد بنر خوش‌آمد و کارت پرتره</h3>
                      <button
                        type="button"
                        onClick={() =>
                          commit({ showHeroPortrait: crextioConfig.showHeroPortrait === false })
                        }
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border cursor-pointer ${
                          crextioConfig.showHeroPortrait !== false
                            ? 'bg-emerald-800 text-white border-emerald-800'
                            : 'bg-white text-stone-600 border-stone-300'
                        }`}
                      >
                        {crextioConfig.showHeroPortrait !== false ? 'پرتره: فعال' : 'پرتره: مخفی'}
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={crextioConfig.heroBannerScale || 'normal'}
                        onChange={e => {
                          const val = e.target.value as 'micro' | 'compact' | 'normal' | 'expanded';
                          commit({
                            heroBannerScale: val,
                            dashboardSectionLayouts: {
                              ...layoutsMap,
                              top_vip_row: { ...(layoutsMap.top_vip_row || {}), scale: val },
                            },
                          });
                        }}
                        className="flex-1 px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs font-bold"
                      >
                        <option value="micro">خیلی کوچک / نوار باریک (Micro)</option>
                        <option value="compact">کوچک و جمع‌وجور (Compact)</option>
                        <option value="normal">استاندارد (Normal)</option>
                        <option value="expanded">بزرگ و شاخص (Expanded)</option>
                      </select>

                      <button
                        type="button"
                        disabled={uploadingKey === 'hero_portrait'}
                        onClick={() => {
                          targetKeyRef.current = 'hero_portrait';
                          fileInputRef.current?.click();
                        }}
                        className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        {uploadingKey === 'hero_portrait' ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Upload className="w-3.5 h-3.5" />
                        )}
                        <span>عکس پرتره</span>
                      </button>
                      {portraitUrl && (
                        <img
                          src={portraitUrl}
                          alt="پرتره"
                          referrerPolicy="no-referrer"
                          className="w-9 h-9 rounded-xl object-cover object-top border border-stone-300 shrink-0"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Stats vs Quick Actions Slot Mode Selector */}
                <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 space-y-3">
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-emerald-950">
                      انتخاب محتوای بخش مقابل در بنر خوش‌آمدگویی (آمار یا دکمه‌های دسترسی سریع)
                    </h3>
                    <p className="text-[11px] text-emerald-900/75 mt-0.5">
                      می‌توانید انتخاب کنید در بنر بالای تم ۲ فقط آمار زنده، فقط دکمه‌های دسترسی سریع، هر دو یا هیچ‌کدام نمایش داده شود.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'both', label: 'هر دو (آمار + دسترسی سریع)' },
                      { id: 'quick_actions', label: 'فقط دسترسی‌های سریع' },
                      { id: 'stats', label: 'فقط کارت‌های آمار' },
                      { id: 'none', label: 'هیچ‌کدام (حداقل‌گرا)' },
                    ].map(opt => {
                      const active = (crextioConfig.heroRightSlotMode || 'both') === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            const mode = opt.id as 'both' | 'quick_actions' | 'stats' | 'none';
                            const patch: Partial<CrextioDashboardConfig> = {
                              heroRightSlotMode: mode,
                              showHeroStats: mode === 'both' || mode === 'stats',
                              showKpiRow: mode === 'both' || mode === 'stats',
                              showQuickActions: mode === 'both' || mode === 'quick_actions',
                            };
                            if (mode === 'both' || mode === 'quick_actions') {
                              const hasVisible = quickButtons.some(b => b.visible !== false);
                              if (!hasVisible && quickButtons.length > 0) {
                                patch.heroQuickButtons = quickButtons.map((b, idx) =>
                                  idx < 4 ? { ...b, visible: true } : b
                                );
                              }
                            }
                            commit(patch);
                          }}
                          className={`p-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                            active
                              ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                              : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                  <div className="text-[11px] font-bold text-emerald-900/80 flex flex-wrap items-center gap-2 pt-1">
                    <span>
                      وضعیت فعال فعلی:{' '}
                      {(crextioConfig.heroRightSlotMode || 'both') === 'both'
                        ? 'نمایش هم‌زمان آمار زنده + دکمه‌های دسترسی سریع'
                        : crextioConfig.heroRightSlotMode === 'quick_actions'
                        ? 'فقط دکمه‌های دسترسی سریع در بخش مقابل'
                        : crextioConfig.heroRightSlotMode === 'stats'
                        ? 'فقط کارت‌های آمار زنده در بخش مقابل'
                        : 'حالت حداقل‌گرا (بدون آمار و بدون دسترسی سریع)'}
                    </span>
                  </div>
                </div>

                {/* Quick Action Buttons Full Editor */}
                <div className="p-4 rounded-2xl border border-stone-200 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h3 className="text-xs font-black text-stone-900">
                        ویرایش دکمه‌های دسترسی سریع بالای صفحه (تم ۲)
                      </h3>
                      <p className="text-[10px] text-stone-500 mt-0.5">
                        عنوان دکمه، مقصد هدایت و وضعیت نمایش هر دکمه را ویرایش یا دکمه جدید اضافه کنید.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        commit({
                          heroQuickButtons: [
                            ...quickButtons,
                            {
                              id: `hqb_${Date.now()}`,
                              label: 'دکمه دسترسی جدید',
                              targetNav: 'People',
                              visible: true,
                            },
                          ],
                        })
                      }
                      className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-black text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>افزودن دکمه</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {quickButtons.map((qb, i) => (
                      <div
                        key={qb.id}
                        className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 flex flex-wrap items-center gap-2"
                      >
                        <input
                          type="text"
                          value={qb.label}
                          onChange={e => {
                            const next = quickButtons.map((b, idx) =>
                              idx === i ? { ...b, label: e.target.value } : b
                            );
                            commit({ heroQuickButtons: next });
                          }}
                          className="flex-1 min-w-[120px] px-2.5 py-1.5 rounded-lg bg-white border border-stone-300 text-xs font-bold"
                          placeholder="عنوان دکمه"
                        />
                        <select
                          value={qb.targetNav}
                          onChange={e => {
                            const next = quickButtons.map((b, idx) =>
                              idx === i ? { ...b, targetNav: e.target.value } : b
                            );
                            commit({ heroQuickButtons: next });
                          }}
                          className="px-2 py-1.5 rounded-lg bg-white border border-stone-300 text-[11px] font-bold"
                        >
                          {NAV_TARGET_OPTIONS.map(nav => (
                            <option key={nav.value} value={nav.value}>
                              {nav.label}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            const next = quickButtons.map((b, idx) =>
                              idx === i ? { ...b, visible: !b.visible } : b
                            );
                            commit({ heroQuickButtons: next });
                          }}
                          className={`p-1.5 rounded-lg cursor-pointer ${
                            qb.visible ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-500'
                          }`}
                          title={qb.visible ? 'مخفی کردن' : 'نمایش'}
                        >
                          {qb.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const next = quickButtons.filter((_, idx) => idx !== i);
                            commit({ heroQuickButtons: next });
                          }}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 cursor-pointer"
                          title="حذف دکمه"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Header, Portrait Card & Hero Copy */}
                <div className="p-4 rounded-2xl border border-stone-200 space-y-3">
                  <h3 className="text-xs font-black text-stone-900">
                    متون نوار بالایی تم ۲، برند سامانه، کارت پرتره و بنر خوش‌آمدگویی
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-stone-600 mb-1">
                        متن نوار راهنمای بالای تم ۲ (برای مدیران/کاربران سازمانی)
                      </label>
                      <input
                        type="text"
                        value={crextioConfig.theme2TopBarTitle ?? 'تم دوم: سامانه و ویترین خدمات مرکز دانش‌آموختگان (طرح میزان)'}
                        onChange={e => commit({ theme2TopBarTitle: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 mb-1">عنوان اصلی برند در هدر</label>
                      <input
                        type="text"
                        value={crextioConfig.brandMainTitle ?? 'سامانه فقه و قضا'}
                        onChange={e => commit({ brandMainTitle: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 mb-1">نشان کنار برند (Badge)</label>
                      <input
                        type="text"
                        value={crextioConfig.brandBadgeText ?? 'میزان'}
                        onChange={e => commit({ brandBadgeText: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-stone-600 mb-1">زیرعنوان برند در هدر</label>
                      <input
                        type="text"
                        value={crextioConfig.brandSubtitleText ?? 'پرتال و ویترین خدمات نخبگان'}
                        onChange={e => commit({ brandSubtitleText: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 mb-1">برچسب طرح روی بنر خوش‌آمد</label>
                      <input
                        type="text"
                        value={crextioConfig.heroSchemeLabel ?? 'طرح میزان'}
                        onChange={e => commit({ heroSchemeLabel: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 mb-1">برچسب حوزه فعالیت بنر خوش‌آمد</label>
                      <input
                        type="text"
                        value={crextioConfig.heroDomainLabel ?? 'مجمع نخبگان دانش‌آموختگان فقه و قضا'}
                        onChange={e => commit({ heroDomainLabel: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 mb-1">
                        پیشوند خوش‌آمدگویی (برای نام پویا)
                      </label>
                      <input
                        type="text"
                        value={crextioConfig.heroGreetingPrefix ?? 'خوش آمدید'}
                        onChange={e => commit({ heroGreetingPrefix: e.target.value })}
                        placeholder="مثلاً: خوش آمدید، جناب آقای / سرکار خانم"
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 mb-1">
                        الگوی عنوان بنر خوش‌آمدگویی (با {'{name}'} نام هر کاربر درج می‌شود)
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={crextioConfig.heroTitle ?? 'خوش آمدید، {name}'}
                          onChange={e => commit({ heroTitle: e.target.value })}
                          placeholder="خوش آمدید، {name}"
                          className="flex-1 px-3 py-2 rounded-xl border border-stone-300 font-black"
                        />
                        <button
                          type="button"
                          onClick={() => commit({ heroTitle: 'خوش آمدید، {name}' })}
                          className="px-2.5 py-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-[10px] font-black shrink-0 cursor-pointer"
                          title="بازگردانی به الگوی پویا با نام کاربر"
                        >
                          {'{name}'}
                        </button>
                      </div>
                    </div>
                    <div className="sm:col-span-2 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-900 flex items-center justify-between gap-2">
                      <span>پیش‌نمایش زنده برای کاربر فعلی:</span>
                      <span className="font-black text-emerald-950">
                        {formatWelcomeBannerTitle(
                          crextioConfig.heroTitle,
                          crextioConfig.heroGreetingPrefix,
                          currentUser
                        )}
                      </span>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-stone-600 mb-1">زیرعنوان بنر خوش‌آمدگویی (Hero Subtitle)</label>
                      <input
                        type="text"
                        value={crextioConfig.heroSubtitle ?? ''}
                        onChange={e => commit({ heroSubtitle: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 mb-1">نشان بالای کارت پرتره</label>
                      <input
                        type="text"
                        value={crextioConfig.heroPortraitBadgeText ?? 'عضو رسمی مجمع'}
                        onChange={e => commit({ heroPortraitBadgeText: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 mb-1">برچسب تاییدیه پرتره</label>
                      <input
                        type="text"
                        value={crextioConfig.heroPortraitVerifiedText ?? 'تایید شده'}
                        onChange={e => commit({ heroPortraitVerifiedText: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 mb-1">برچسب نقش دانش‌آموخته روی پرتره</label>
                      <input
                        type="text"
                        value={crextioConfig.heroPortraitRoleLabelAlumni ?? 'دانش‌آموخته'}
                        onChange={e => commit({ heroPortraitRoleLabelAlumni: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 mb-1">برچسب نقش مدیر/کارشناس روی پرتره</label>
                      <input
                        type="text"
                        value={crextioConfig.heroPortraitRoleLabelStaff ?? 'مسئول خدمات'}
                        onChange={e => commit({ heroPortraitRoleLabelStaff: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: NAVIGATION ORDER & LABELS CUSTOMIZER */}
            {activeTab === 'navigation' && (
              <CustomizerNavigationTab
                crextioConfig={crextioConfig}
                updateCrextioConfig={updateCrextioConfig}
                triggerSuccess={pulseSaved}
              />
            )}

            {/* TAB 2: ALL BANNERS, WIDGETS, BENTO & SHOWCASE TEXTS */}
            {activeTab === 'all_banners' && (
              <div className="space-y-6">
                {/* Status Widget, Calendar & Bento Headers */}
                <div className="p-4 rounded-2xl border border-stone-200 space-y-3">
                  <h3 className="text-xs font-black text-stone-900">
                    ویرایش تیترهای ویجت وضعیت، تقویم رویدادها و شبکه جامع خدمات (Bento)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 mb-1">تیتر ویجت خلاصه وضعیت</label>
                      <input
                        type="text"
                        value={crextioConfig.statusWidgetTitle ?? 'ویجت خلاصه وضعیت پرونده‌ها و خدمات من'}
                        onChange={e => commit({ statusWidgetTitle: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 mb-1">زیرتیتر ویجت خلاصه وضعیت</label>
                      <input
                        type="text"
                        value={crextioConfig.statusWidgetSubtitle ?? 'نمای یکپارچه و بلادرنگ فعالیت‌های جاری شما در سامانه'}
                        onChange={e => commit({ statusWidgetSubtitle: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 mb-1">تیتر تقویم رویدادها</label>
                      <input
                        type="text"
                        value={crextioConfig.eventsCalendarTitle ?? 'تقویم رویدادها و مهلت‌های مرکز'}
                        onChange={e => commit({ eventsCalendarTitle: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 mb-1">زیرتیتر تقویم رویدادها</label>
                      <input
                        type="text"
                        value={crextioConfig.eventsCalendarSubtitle ?? 'نشست‌های علمی، کارگاه‌ها و فراخوان‌های پیش‌رو'}
                        onChange={e => commit({ eventsCalendarSubtitle: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 mb-1">تیتر شبکه خدمات (Bento)</label>
                      <input
                        type="text"
                        value={crextioConfig.bentoSectionTitle ?? 'ویترین جامع خدمات سامانه (طرح میزان)'}
                        onChange={e => commit({ bentoSectionTitle: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 mb-1">زیرتیتر شبکه خدمات</label>
                      <input
                        type="text"
                        value={crextioConfig.bentoSectionSubtitle ?? ''}
                        onChange={e => commit({ bentoSectionSubtitle: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 mb-1">متن دکمه کارت‌های Bento</label>
                      <input
                        type="text"
                        value={crextioConfig.bentoCardCtaText ?? 'ورود به سامانه'}
                        onChange={e => commit({ bentoCardCtaText: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 mb-1">برچسب طرح کارت‌های Bento</label>
                      <input
                        type="text"
                        value={crextioConfig.bentoCardSchemeText ?? 'طرح میزان'}
                        onChange={e => commit({ bentoCardSchemeText: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300"
                      />
                    </div>
                  </div>
                </div>

                {/* All Classic Showcases Texts */}
                <div className="p-4 rounded-2xl border border-stone-200 space-y-4">
                  <h3 className="text-xs font-black text-stone-900">
                    متون، بنرها و دکمه‌های تمامی ویترین‌های کلاسیک
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {/* Honors & Unified */}
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 mb-1">عنوان ویترین افتخارات و انتصابات</label>
                      <input
                        type="text"
                        value={crextioConfig.honorsShowcaseTitle ?? ''}
                        onChange={e => commit({ honorsShowcaseTitle: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 mb-1">عنوان ویترین جامع یکپارچه</label>
                      <input
                        type="text"
                        value={crextioConfig.unifiedShowcaseTitle ?? ''}
                        onChange={e => commit({ unifiedShowcaseTitle: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold"
                      />
                    </div>

                    {/* Rulings */}
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 mb-1">عنوان بنر تالار آراء</label>
                      <input
                        type="text"
                        value={crextioConfig.rulingsShowcaseTitle ?? ''}
                        onChange={e => commit({ rulingsShowcaseTitle: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 mb-1">نشان بنر تالار آراء</label>
                      <input
                        type="text"
                        value={crextioConfig.rulingsShowcaseBadge ?? ''}
                        onChange={e => commit({ rulingsShowcaseBadge: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-stone-600 mb-1">زیرعنوان بنر تالار آراء</label>
                      <input
                        type="text"
                        value={crextioConfig.rulingsShowcaseSubtitle ?? ''}
                        onChange={e => commit({ rulingsShowcaseSubtitle: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300"
                      />
                    </div>

                    {/* Research Promo */}
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 mb-1">عنوان بنر راهبری پژوهش</label>
                      <input
                        type="text"
                        value={crextioConfig.researchPromoTitle ?? ''}
                        onChange={e => commit({ researchPromoTitle: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 mb-1">متن گرنت پژوهشی</label>
                      <input
                        type="text"
                        value={crextioConfig.researchPromoGrantAmount ?? ''}
                        onChange={e => commit({ researchPromoGrantAmount: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 mb-1">متن دکمه اصلی پژوهش</label>
                      <input
                        type="text"
                        value={crextioConfig.researchPromoPrimaryBtnText ?? ''}
                        onChange={e => commit({ researchPromoPrimaryBtnText: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 mb-1">متن دکمه دوم پژوهش</label>
                      <input
                        type="text"
                        value={crextioConfig.researchPromoSecondaryBtnText ?? ''}
                        onChange={e => commit({ researchPromoSecondaryBtnText: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300"
                      />
                    </div>

                    {/* Courses */}
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 mb-1">عنوان ویترین دوره‌ها</label>
                      <input
                        type="text"
                        value={crextioConfig.courseShowcaseTitle ?? ''}
                        onChange={e => commit({ courseShowcaseTitle: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 mb-1">دکمه ویترین دوره‌ها</label>
                      <input
                        type="text"
                        value={crextioConfig.courseShowcaseCtaText ?? ''}
                        onChange={e => commit({ courseShowcaseCtaText: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300"
                      />
                    </div>

                    {/* Counseling */}
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 mb-1">عنوان بنر مشاوره نخبگان</label>
                      <input
                        type="text"
                        value={crextioConfig.counselingPromoTitle ?? ''}
                        onChange={e => commit({ counselingPromoTitle: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 mb-1">نشان بنر مشاوره نخبگان</label>
                      <input
                        type="text"
                        value={crextioConfig.counselingPromoBadge ?? ''}
                        onChange={e => commit({ counselingPromoBadge: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 mb-1">عنوان ویترین مشاوره عمومی</label>
                      <input
                        type="text"
                        value={crextioConfig.counselingGeneralShowcaseTitle ?? ''}
                        onChange={e => commit({ counselingGeneralShowcaseTitle: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 mb-1">دکمه ویترین مشاوره عمومی</label>
                      <input
                        type="text"
                        value={crextioConfig.counselingGeneralShowcaseBtnText ?? ''}
                        onChange={e => commit({ counselingGeneralShowcaseBtnText: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300"
                      />
                    </div>

                    {/* Welfare */}
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 mb-1">عنوان بنر رفاهیات و وام</label>
                      <input
                        type="text"
                        value={crextioConfig.welfareShowcaseTitle ?? ''}
                        onChange={e => commit({ welfareShowcaseTitle: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 mb-1">سقف مبلغ وام بنر رفاهیات</label>
                      <input
                        type="text"
                        value={crextioConfig.welfareShowcaseLoanAmount ?? ''}
                        onChange={e => commit({ welfareShowcaseLoanAmount: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300"
                      />
                    </div>

                    {/* Books & Multimedia */}
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 mb-1">عنوان ویترین کتب و منشورات</label>
                      <input
                        type="text"
                        value={crextioConfig.booksShowcaseTitle ?? ''}
                        onChange={e => commit({ booksShowcaseTitle: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 mb-1">اطلاعیه تخفیف کتب</label>
                      <input
                        type="text"
                        value={crextioConfig.booksShowcaseDiscountNotice ?? ''}
                        onChange={e => commit({ booksShowcaseDiscountNotice: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 mb-1">عنوان ویترین درس‌گفتارها</label>
                      <input
                        type="text"
                        value={crextioConfig.multimediaShowcaseTitle ?? ''}
                        onChange={e => commit({ multimediaShowcaseTitle: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 mb-1">دکمه ویترین درس‌گفتارها</label>
                      <input
                        type="text"
                        value={crextioConfig.multimediaShowcaseCtaText ?? ''}
                        onChange={e => commit({ multimediaShowcaseCtaText: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300"
                      />
                    </div>
                  </div>
                </div>

                {/* Minimal Mode Box Copy Overrides */}
                <div className="p-4 rounded-2xl border border-stone-200 space-y-3">
                  <div>
                    <h3 className="text-xs font-black text-stone-900">
                      ویرایش متن باکس‌ها در حالت طراحی «ساده (مینیمال)»
                    </h3>
                    <p className="text-[10px] text-stone-500 mt-0.5">
                      چنانچه هر ویترین را در حالت طراحی ساده قرار داده باشید، برچسب، تیتر، توضیح و دکمه آن از این مقادیر خوانده می‌شود.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {MINIMAL_BOX_DEFAULTS.map(box => {
                      const ov = crextioConfig.minimalBoxOverrides?.[box.key] || {};
                      return (
                        <div key={box.key} className="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                          <div className="text-[11px] font-black text-emerald-900">{box.label}</div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <input
                              type="text"
                              value={ov.kicker ?? box.kicker}
                              onChange={e => updateMinimalBoxOverride(box.key, 'kicker', e.target.value)}
                              placeholder="برچسب بالا (Kicker)"
                              className="px-2.5 py-1.5 rounded-lg bg-white border border-stone-300"
                            />
                            <input
                              type="text"
                              value={ov.title ?? box.title}
                              onChange={e => updateMinimalBoxOverride(box.key, 'title', e.target.value)}
                              placeholder="تیتر کارت"
                              className="px-2.5 py-1.5 rounded-lg bg-white border border-stone-300 font-bold"
                            />
                            <input
                              type="text"
                              value={ov.description ?? box.description}
                              onChange={e => updateMinimalBoxOverride(box.key, 'description', e.target.value)}
                              placeholder="توضیح کوتاه"
                              className="px-2.5 py-1.5 rounded-lg bg-white border border-stone-300"
                            />
                            <input
                              type="text"
                              value={ov.ctaLabel ?? box.ctaLabel}
                              onChange={e => updateMinimalBoxOverride(box.key, 'ctaLabel', e.target.value)}
                              placeholder="متن دکمه"
                              className="px-2.5 py-1.5 rounded-lg bg-white border border-stone-300 font-bold"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: LAYOUT, MOVABLE WIDGETS/CALENDAR, BOX DENSITY & IMAGES */}
            {activeTab === 'layout_boxes' && (
              <div className="space-y-6">
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-emerald-700" />
                      <span>تصاویر پیش‌زمینه باکس‌های ساده و تنظیم ترتیب تمام بخش‌ها</span>
                    </h4>
                    <p className="text-[11px] text-emerald-900/75 mt-0.5">
                      ویجت خلاصه وضعیت، تقویم رویدادها، بنرهای اطلاع‌رسانی و بنر خوش‌آمدگویی اکنون کاملاً قابل جابه‌جایی هستند (مثلاً می‌توانید بنر خوش‌آمدگویی را بالای ویجت و تقویم قرار دهید).
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        commit({
                          showShowcaseImagesInMinimal:
                            crextioConfig.showShowcaseImagesInMinimal === false,
                        })
                      }
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-black cursor-pointer ${
                        crextioConfig.showShowcaseImagesInMinimal !== false
                          ? 'bg-emerald-800 text-white'
                          : 'bg-white border border-stone-300 text-stone-700'
                      }`}
                    >
                      {crextioConfig.showShowcaseImagesInMinimal !== false
                        ? 'عکس باکس‌های ساده: فعال'
                        : 'عکس باکس‌های ساده: خاموش'}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        commit({
                          dashboardSectionOrder: [...CANONICAL_DASHBOARD_SECTION_ORDER],
                          hiddenDashboardSections: {},
                          dashboardSectionLayouts: { ...DEFAULT_CREXTIO_CONFIG.dashboardSectionLayouts },
                        })
                      }
                      className="px-3 py-1.5 rounded-xl bg-white border border-stone-300 text-stone-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer hover:bg-stone-100"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>بازنشانی چیدمان</span>
                    </button>
                  </div>
                </div>

                {/* Ordered Sections List */}
                <div className="space-y-2.5">
                  {sectionOrder.map((key, idx) => {
                    const lay = layoutsMap[key] || {
                      span: key === 'status_widget' || key === 'events_calendar' ? 'half' : 'full',
                      density: 'full',
                      scale: 'normal',
                      showImage: true,
                    };
                    const isHidden = hiddenMap[key] === true;
                    const canResize =
                      key !== 'top_vip_row' && key !== 'bento_grid' && key !== 'dashboard_banners';
                    const canScale = key !== 'bento_grid' && key !== 'dashboard_banners';
                    const hasClassicMinimal = CLASSIC_MINIMAL_KEYS.has(key);
                    const boxScale =
                      key === 'top_vip_row'
                        ? crextioConfig.heroBannerScale || lay.scale || 'normal'
                        : lay.scale || 'normal';

                    return (
                      <div
                        key={key}
                        className={`p-3 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isHidden
                            ? 'bg-stone-100 border-dashed border-stone-300 opacity-65'
                            : 'bg-white border-stone-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center font-black text-xs shrink-0">
                            {toPersianNumbers(idx + 1)}
                          </span>
                          <div className="min-w-0">
                            <div className="text-xs font-black text-stone-900 truncate">
                              {SECTION_LABELS[key] || key}
                            </div>
                            <div className="text-[10px] text-stone-500">
                              {lay.span === 'half' && canResize ? 'نصف‌عرض (۱/۲ ردیف)' : 'تمام‌عرض'}
                              {hasClassicMinimal &&
                                ` · ${lay.density === 'minimal' ? 'طراحی ساده' : 'طراحی کلاسیک'}`}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 justify-end">
                          {canResize && (
                            <button
                              type="button"
                              onClick={() =>
                                updateSectionLayout(key, {
                                  span: lay.span === 'half' ? 'full' : 'half',
                                })
                              }
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-1 cursor-pointer ${
                                lay.span === 'half'
                                  ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                                  : 'bg-stone-50 text-stone-700 border-stone-200'
                              }`}
                            >
                              <Columns2 className="w-3 h-3" />
                              <span>{lay.span === 'half' ? 'کوچک ۱/۲' : 'تمام‌عرض'}</span>
                            </button>
                          )}

                          {canScale && (
                            <select
                              value={boxScale}
                              onChange={e => {
                                const val = e.target.value as 'micro' | 'compact' | 'normal' | 'expanded';
                                if (key === 'top_vip_row') {
                                  commit({
                                    heroBannerScale: val,
                                    dashboardSectionLayouts: {
                                      ...layoutsMap,
                                      [key]: { ...(layoutsMap[key] || {}), scale: val },
                                    },
                                  });
                                } else {
                                  updateSectionLayout(key, { scale: val });
                                }
                              }}
                              className="px-2 py-1 rounded-lg bg-stone-50 border border-stone-200 text-[10px] font-bold"
                            >
                              <option value="micro">سایز: مینی</option>
                              <option value="compact">سایز: کوچک</option>
                              <option value="normal">سایز: عادی</option>
                              <option value="expanded">سایز: بزرگ</option>
                            </select>
                          )}

                          {hasClassicMinimal && (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  updateSectionLayout(key, {
                                    density: lay.density === 'minimal' ? 'full' : 'minimal',
                                  })
                                }
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-1 cursor-pointer ${
                                  lay.density === 'minimal'
                                    ? 'bg-teal-50 text-teal-800 border-teal-200'
                                    : 'bg-amber-50 text-amber-900 border-amber-200'
                                }`}
                              >
                                {lay.density === 'minimal' ? (
                                  <Minimize2 className="w-3 h-3" />
                                ) : (
                                  <Maximize2 className="w-3 h-3" />
                                )}
                                <span>{lay.density === 'minimal' ? 'ساده' : 'کلاسیک'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  updateSectionLayout(key, {
                                    showImage: lay.showImage === false,
                                  })
                                }
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold border cursor-pointer ${
                                  lay.showImage !== false
                                    ? 'bg-sky-50 text-sky-800 border-sky-200'
                                    : 'bg-stone-100 text-stone-500 border-stone-200'
                                }`}
                              >
                                {lay.showImage !== false ? 'عکس: روشن' : 'بی‌عکس'}
                              </button>
                            </>
                          )}

                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => moveSection(idx, -1)}
                            className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 border border-stone-200 disabled:opacity-30 cursor-pointer"
                            title="انتقال به بالا"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            disabled={idx === sectionOrder.length - 1}
                            onClick={() => moveSection(idx, 1)}
                            className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 border border-stone-200 disabled:opacity-30 cursor-pointer"
                            title="انتقال به پایین"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              commit({
                                hiddenDashboardSections: {
                                  ...hiddenMap,
                                  [key]: !isHidden,
                                },
                              })
                            }
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-1 cursor-pointer ${
                              !isHidden
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-stone-200 text-stone-600 border-stone-300'
                            }`}
                          >
                            {!isHidden ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                            <span>{!isHidden ? 'نمایش' : 'مخفی'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <ShowcaseImagesStudioPanel
                  crextioConfig={crextioConfig}
                  updateCrextioConfig={updateCrextioConfig}
                  triggerSuccess={pulseSaved}
                />
              </div>
            )}

            {/* TAB 4: HONORS & UNIFIED SHOWCASE */}
            {activeTab === 'honors_unified' && (
              <div className="space-y-6">
                <HonorsManagerEditor
                  crextioConfig={crextioConfig}
                  updateCrextioConfig={updateCrextioConfig}
                  triggerSuccess={pulseSaved}
                />

                <div className="pt-4 border-t border-stone-200">
                  <UnifiedShowcaseManagerEditor
                    crextioConfig={crextioConfig}
                    updateCrextioConfig={updateCrextioConfig}
                    triggerSuccess={pulseSaved}
                  />
                </div>
              </div>
            )}
          </div>
        </motion.aside>
      </div>
    </AnimatePresence>
  );
};
