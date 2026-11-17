import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CrextioDashboardConfig, Theme3CustomizationConfig } from '../../types';
import { api } from '../../services/apiClient';
import { resolveShowcaseImageUrl } from '../../data/showcaseImages';
import { toPersianNumbers } from '../../utils/persianNumbers';
import {
  HonorsManagerEditor,
  UnifiedShowcaseManagerEditor,
} from '../admin/theme_customizer_subcomponents/CustomizerHonorsUnifiedTab';
import { ShowcaseImagesStudioPanel } from '../admin/theme_customizer_subcomponents/ShowcaseImagesStudioPanel';
import {
  X,
  Palette,
  Type,
  Award,
  LayoutGrid,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Columns2,
  Image as ImageIcon,
  Upload,
  Loader2,
  RotateCcw,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface Theme3StudioDrawerProps {
  isOpen: boolean;
  initialTab?: 'appearance' | 'texts_layout' | 'honors' | 'unified_boxes';
  onClose: () => void;
  crextioConfig: CrextioDashboardConfig;
  updateCrextioConfig: (updates: Partial<CrextioDashboardConfig>) => void;
}

const DEFAULT_BLOCK_ORDER = [
  'hero',
  'widgets',
  'honors_showcase',
  'unified_showcase',
  'operations_split',
  'individual_showcases',
];

const BLOCK_LABELS: Record<string, string> = {
  hero: 'باکس خوش‌آمدگویی و دکمه‌های دسترسی سریع',
  widgets: 'ویجت‌ها، تقویم و بنرهای اطلاع‌رسانی',
  honors_showcase: 'ویترین افتخارات و انتصابات نخبگان',
  unified_showcase: 'ویترین جامع یکپارچه (تمامی ویترین‌های تم ۲)',
  operations_split: 'بخش دو ستونه کارتابل خدمات و دیوار هم‌افزایی',
  individual_showcases: 'درگاه‌ها و باکس‌های اختصاصی خدمات',
};

const SHOWCASE_BOXES = [
  { key: 'rulings_showcase', title: 'تالار نقد آراء قضایی' },
  { key: 'research_promo', title: 'راهبری پژوهش و رساله‌ها' },
  { key: 'course_showcase', title: 'دوره‌ها و کارگاه‌های علمی' },
  { key: 'counseling_promo', title: 'خدمات مشاوره نخبگان' },
  { key: 'welfare_showcase', title: 'تسهیلات رفاهی و اقامتگاه‌ها' },
  { key: 'multimedia_showcase', title: 'درس‌گفتارها و چندرسانه‌ای' },
  { key: 'books_showcase', title: 'کتب و منشورات تخصصی' },
];

export const Theme3StudioDrawer: React.FC<Theme3StudioDrawerProps> = ({
  isOpen,
  initialTab = 'appearance',
  onClose,
  crextioConfig,
  updateCrextioConfig,
}) => {
  const [activeTab, setActiveTab] = useState<'appearance' | 'texts_layout' | 'honors' | 'unified_boxes'>(initialTab);
  const [savedToast, setSavedToast] = useState(false);
  const [uploadingBoxKey, setUploadingBoxKey] = useState<string | null>(null);
  const boxFileRef = useRef<HTMLInputElement>(null);
  const targetBoxKeyRef = useRef<string | null>(null);

  React.useEffect(() => {
    if (isOpen) setActiveTab(initialTab);
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const t3: Theme3CustomizationConfig = crextioConfig.theme3Config || {};
  const layoutsMap = crextioConfig.dashboardSectionLayouts || {};
  const hiddenMap = crextioConfig.hiddenDashboardSections || {};
  const blockOrder =
    t3.blockOrder && t3.blockOrder.length > 0 ? t3.blockOrder : DEFAULT_BLOCK_ORDER;
  const blockSpans = t3.blockSpans || {};

  const pulseSaved = () => {
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 1800);
  };

  const patchT3 = (updates: Partial<Theme3CustomizationConfig>) => {
    updateCrextioConfig({
      theme3Config: {
        ...t3,
        ...updates,
      },
    });
    pulseSaved();
  };

  const moveBlock = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= blockOrder.length) return;
    const next = [...blockOrder];
    const [moved] = next.splice(idx, 1);
    next.splice(target, 0, moved);
    patchT3({ blockOrder: next });
  };

  const handleUploadBoxImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const key = targetBoxKeyRef.current;
    if (!file || !key) return;
    setUploadingBoxKey(key);
    try {
      const res = await api.uploadFile(file, 'misc');
      if (res?.url) {
        updateCrextioConfig({
          showcaseImageOverrides: {
            ...(crextioConfig.showcaseImageOverrides || {}),
            [key]: res.url,
          },
        });
        pulseSaved();
      }
    } catch (err: any) {
      alert(`خطا در آپلود عکس: ${err.message || 'خطای سرور'}`);
    } finally {
      setUploadingBoxKey(null);
      targetBoxKeyRef.current = null;
      if (boxFileRef.current) boxFileRef.current.value = '';
    }
  };

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
          className="w-full max-w-3xl h-full bg-white text-stone-900 shadow-2xl border-r border-stone-200 flex flex-col overflow-hidden"
        >
          <input
            ref={boxFileRef}
            type="file"
            accept="image/*"
            onChange={handleUploadBoxImage}
            className="hidden"
          />

          {/* Top Bar */}
          <div className="px-6 py-4 bg-stone-950 text-white flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-black">
                  استودیو طراحی زنده و ویرایشگر جامع صفحه (تم ۳)
                </h2>
                <p className="text-[11px] text-stone-400">
                  تغییرات بلافاصله در صفحه اعمال و با OCC در پایگاه داده MySQL ذخیره می‌شوند
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
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Studio Tabs */}
          <div className="px-6 pt-3 bg-stone-50 border-b border-stone-200 flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0">
            {[
              { id: 'appearance', label: 'ظاهر، پالت و افکت‌ها', icon: Palette },
              { id: 'texts_layout', label: 'متون، بخش‌ها و چیدمان', icon: Type },
              { id: 'honors', label: 'افتخارات و انتصابات', icon: Award },
              { id: 'unified_boxes', label: 'ویترین جامع و باکس‌ها', icon: LayoutGrid },
            ].map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
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

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                {/* Palette Picker */}
                <div className="space-y-2.5">
                  <h3 className="text-xs font-black text-stone-900">پالت رنگی و اتمسفر بوم</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      {
                        id: 'emerald_ivory',
                        title: 'مرمر روشن و زمرد سلطنتی',
                        desc: 'روشن، رسمی و باوقار با تاکید زمردی و طلایی',
                        swatch: 'from-[#F6F7F5] via-emerald-900 to-amber-500',
                      },
                      {
                        id: 'lapis_parchment',
                        title: 'کاغذ گرم و لاجورد قضایی',
                        desc: 'زمینه گرم خواندنی با رنگ‌های لاجوردی و برنزی',
                        swatch: 'from-[#FBF8F1] via-blue-900 to-amber-700',
                      },
                      {
                        id: 'bronze_graphite',
                        title: 'نوک‌مدادی روشن و برنز مات',
                        desc: 'مینیمالیسم مدرن و خنثی با خط‌کشی تمیز',
                        swatch: 'from-[#F4F4F5] via-stone-900 to-amber-600',
                      },
                      {
                        id: 'obsidian_emerald',
                        title: 'سبز یشمی تیره (Dark Luxury)',
                        desc: 'تم شب لوکس، آرامش چشم و کنتراست طلایی',
                        swatch: 'from-[#0D1915] via-emerald-600 to-amber-400',
                      },
                    ].map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => patchT3({ palette: p.id as any })}
                        className={`p-3.5 rounded-2xl border text-right flex items-center gap-3 cursor-pointer transition-all ${
                          (t3.palette || 'emerald_ivory') === p.id
                            ? 'border-emerald-700 bg-emerald-50/70 ring-1 ring-emerald-700/30'
                            : 'border-stone-200 hover:bg-stone-50'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${p.swatch} shrink-0 border border-black/10`} />
                        <div>
                          <div className="text-xs font-black text-stone-900">{p.title}</div>
                          <div className="text-[10px] text-stone-500 mt-0.5">{p.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Accent Color + Motion + Surface + Radius */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl border border-stone-200 space-y-2">
                    <label className="block text-xs font-black text-stone-800">سبک سطح کارت‌ها</label>
                    <select
                      value={t3.cardSurface || 'elevated'}
                      onChange={e => patchT3({ cardSurface: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-bold"
                    >
                      <option value="elevated">برجسته نرم و مدرن (پیشنهادی)</option>
                      <option value="glass">شیشه‌ای شفاف (Glassmorphism)</option>
                      <option value="hairline">مینیمال خطی تخت</option>
                    </select>
                  </div>

                  <div className="p-4 rounded-2xl border border-stone-200 space-y-2">
                    <label className="block text-xs font-black text-stone-800">گردی گوشه کارت‌ها</label>
                    <select
                      value={t3.borderRadius || 'balanced'}
                      onChange={e => patchT3({ borderRadius: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-bold"
                    >
                      <option value="sharp">رسمی و زاویه‌دار</option>
                      <option value="balanced">متعادل مدرن (پیشنهادی)</option>
                      <option value="pill_modern">نرم و بسیار گرد</option>
                    </select>
                  </div>

                  <div className="p-4 rounded-2xl border border-stone-200 space-y-2">
                    <label className="block text-xs font-black text-stone-800">سطح موشن، افکت و نورپردازی</label>
                    <select
                      value={t3.motionLevel || 'cinematic'}
                      onChange={e => patchT3({ motionLevel: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-bold"
                    >
                      <option value="cinematic">سینمایی کامل (نور ماوس + انیمیشن فنری + Ken Burns)</option>
                      <option value="gentle">ملایم و استاندارد</option>
                      <option value="minimal">حداقل انیمیشن</option>
                    </select>
                  </div>

                  <div className="p-4 rounded-2xl border border-stone-200 space-y-2">
                    <label className="block text-xs font-black text-stone-800">اندازه تایپوگرافی تیترها</label>
                    <select
                      value={t3.headlineSize || 'normal'}
                      onChange={e => patchT3({ headlineSize: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-bold"
                    >
                      <option value="compact">فشرده</option>
                      <option value="normal">استاندارد</option>
                      <option value="large">درشت و شاخص</option>
                    </select>
                  </div>

                  <div className="p-4 rounded-2xl border border-stone-200 space-y-2 sm:col-span-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="block text-xs font-black text-stone-800">اندازه بنر خوش‌آمدگویی و تصویر پرتره</label>
                      <button
                        type="button"
                        onClick={() => {
                          updateCrextioConfig({ showHeroPortrait: crextioConfig.showHeroPortrait === false });
                          pulseSaved();
                        }}
                        className={`px-3 py-1 rounded-lg text-[11px] font-bold border cursor-pointer ${
                          crextioConfig.showHeroPortrait !== false
                            ? 'bg-emerald-800 text-white border-emerald-800'
                            : 'bg-stone-100 text-stone-600 border-stone-300'
                        }`}
                      >
                        {crextioConfig.showHeroPortrait !== false ? 'تصویر پرتره بنر: روشن' : 'تصویر پرتره بنر: خاموش'}
                      </button>
                    </div>
                    <select
                      value={t3.heroScale || crextioConfig.heroBannerScale || 'normal'}
                      onChange={e => {
                        const val = e.target.value as any;
                        updateCrextioConfig({
                          heroBannerScale: val,
                          theme3Config: { ...t3, heroScale: val },
                        });
                        pulseSaved();
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-bold"
                    >
                      <option value="micro">خیلی کوچک / نوار باریک (Micro)</option>
                      <option value="compact">کوچک و جمع‌وجور (Compact)</option>
                      <option value="normal">استاندارد (Normal)</option>
                      <option value="expanded">بزرگ و شاخص (Expanded)</option>
                    </select>
                  </div>
                </div>

                {/* Global Image Toggle on Minimal Boxes */}
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-emerald-700" />
                      <span>استفاده از تصویر زیبا در پیش‌زمینه باکس‌های ساده/مینیمال</span>
                    </h4>
                    <p className="text-[11px] text-emerald-900/70 mt-0.5">
                      با فعال بودن این گزینه، تمامی باکس‌های ساده در تم ۲ و تم ۳ دارای تصویر اختصاصی متناسب با موضوع خواهند بود.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      updateCrextioConfig({
                        showShowcaseImagesInMinimal: crextioConfig.showShowcaseImagesInMinimal === false,
                      });
                      pulseSaved();
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-black shrink-0 cursor-pointer transition-colors ${
                      crextioConfig.showShowcaseImagesInMinimal !== false
                        ? 'bg-emerald-800 text-white'
                        : 'bg-white text-stone-700 border border-stone-300'
                    }`}
                  >
                    {crextioConfig.showShowcaseImagesInMinimal !== false ? 'تصاویر فعال است' : 'تصاویر غیرفعال'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'texts_layout' && (
              <div className="space-y-6">
                {/* Editable Texts */}
                <div className="p-4 rounded-2xl border border-stone-200 space-y-3">
                  <h3 className="text-xs font-black text-stone-900">ویرایش متون و عناوین اصلی صفحه</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 mb-1">عنوان برند در نوار بالا</label>
                      <input
                        type="text"
                        value={t3.brandTitle ?? 'مجمع دانش‌آموختگان فقه و قضا'}
                        onChange={e => patchT3({ brandTitle: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 mb-1">برچسب بالای خوش‌آمدگویی</label>
                      <input
                        type="text"
                        value={t3.heroBadgeText ?? 'پایگاه هم‌افزایی و تکریم نخبگان قضایی و حوزوی'}
                        onChange={e => patchT3({ heroBadgeText: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 mb-1">پیشوند سلام / خوش‌آمد</label>
                      <input
                        type="text"
                        value={t3.heroGreetingPrefix ?? 'سلام'}
                        onChange={e => patchT3({ heroGreetingPrefix: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 mb-1">تیتر بخش کارتابل</label>
                      <input
                        type="text"
                        value={t3.cartableSectionTitle ?? 'آخرین درخواست‌های کارتابل'}
                        onChange={e => patchT3({ cartableSectionTitle: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-stone-600 mb-1">متن زیرتیتر خوش‌آمدگویی</label>
                      <input
                        type="text"
                        value={t3.heroSubtitle ?? ''}
                        onChange={e => patchT3({ heroSubtitle: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 mb-1">تیتر دیوار هم‌افزایی</label>
                      <input
                        type="text"
                        value={t3.synergySectionTitle ?? 'تازه‌های دیوار هم‌افزایی و تبادل تجربه'}
                        onChange={e => patchT3({ synergySectionTitle: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 mb-1">تیتر بخش درگاه‌ها و باکس‌ها</label>
                      <input
                        type="text"
                        value={t3.individualShowcasesHeading ?? 'درگاه‌های علمی، پژوهشی و خدماتی'}
                        onChange={e => patchT3({ individualShowcasesHeading: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300"
                      />
                    </div>
                  </div>
                </div>

                {/* Quick Buttons Edit */}
                {Array.isArray(t3.quickButtons) && (
                  <div className="p-4 rounded-2xl border border-stone-200 space-y-2.5">
                    <h3 className="text-xs font-black text-stone-900">ویرایش دکمه‌های دسترسی سریع بالای صفحه</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {t3.quickButtons.map((qb, i) => (
                        <div key={qb.id} className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 flex items-center gap-2">
                          <input
                            type="text"
                            value={qb.label}
                            onChange={e => {
                              const next = t3.quickButtons!.map((b, idx) =>
                                idx === i ? { ...b, label: e.target.value } : b
                              );
                              patchT3({ quickButtons: next });
                            }}
                            className="flex-1 px-2.5 py-1 rounded-lg bg-white border border-stone-300 text-xs font-bold"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const next = t3.quickButtons!.map((b, idx) =>
                                idx === i ? { ...b, visible: !b.visible } : b
                              );
                              patchT3({ quickButtons: next });
                            }}
                            className={`p-1.5 rounded-lg cursor-pointer ${
                              qb.visible ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-500'
                            }`}
                          >
                            {qb.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* All Blocks Order & Visibility */}
                <div className="p-4 rounded-2xl border border-stone-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-stone-900">ترتیب، نمایش و تمام/نیم‌عرض بودن بخش‌های صفحه</h3>
                    <button
                      type="button"
                      onClick={() =>
                        patchT3({
                          blockOrder: DEFAULT_BLOCK_ORDER,
                          blockSpans: {},
                          showHero: true,
                          showWidgets: true,
                          showOperationsSplit: true,
                          showIndividualShowcases: true,
                        })
                      }
                      className="text-[11px] font-bold text-stone-600 hover:text-stone-900 flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>بازنشانی ترتیب</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {blockOrder.map((blk, idx) => {
                      const isVisible =
                        blk === 'hero'
                          ? t3.showHero !== false
                          : blk === 'widgets'
                          ? t3.showWidgets !== false
                          : blk === 'honors_showcase'
                          ? crextioConfig.showHonorsShowcase !== false
                          : blk === 'unified_showcase'
                          ? crextioConfig.showUnifiedShowcase !== false
                          : blk === 'operations_split'
                          ? t3.showOperationsSplit !== false
                          : t3.showIndividualShowcases !== false;

                      const toggleBlk = () => {
                        if (blk === 'hero') patchT3({ showHero: !isVisible });
                        else if (blk === 'widgets') patchT3({ showWidgets: !isVisible });
                        else if (blk === 'honors_showcase') {
                          updateCrextioConfig({ showHonorsShowcase: !isVisible });
                          pulseSaved();
                        } else if (blk === 'unified_showcase') {
                          updateCrextioConfig({ showUnifiedShowcase: !isVisible });
                          pulseSaved();
                        } else if (blk === 'operations_split') patchT3({ showOperationsSplit: !isVisible });
                        else patchT3({ showIndividualShowcases: !isVisible });
                      };

                      const spanVal = layoutsMap[blk]?.span || blockSpans[blk] || 'full';
                      const canHalf = blk === 'honors_showcase' || blk === 'unified_showcase';

                      return (
                        <div
                          key={blk}
                          className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex flex-wrap items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-stone-200 text-stone-800 text-[10px] font-black flex items-center justify-center">
                              {toPersianNumbers(idx + 1)}
                            </span>
                            <span className="text-xs font-bold">{BLOCK_LABELS[blk] || blk}</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {canHalf && (
                              <button
                                type="button"
                                onClick={() => {
                                  const nextSpan = spanVal === 'half' ? 'full' : 'half';
                                  updateCrextioConfig({
                                    theme3Config: {
                                      ...t3,
                                      blockSpans: {
                                        ...blockSpans,
                                        [blk]: nextSpan,
                                      },
                                    },
                                    dashboardSectionLayouts: {
                                      ...layoutsMap,
                                      [blk]: {
                                        ...(layoutsMap[blk] || { density: 'full', scale: 'normal' }),
                                        span: nextSpan,
                                      },
                                    },
                                  });
                                  pulseSaved();
                                }}
                                className="px-2.5 py-1 rounded-lg bg-white border border-stone-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <Columns2 className="w-3 h-3" />
                                <span>{spanVal === 'half' ? 'نیم‌عرض (۱/۲)' : 'تمام‌عرض'}</span>
                              </button>
                            )}

                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => moveBlock(idx, -1)}
                              className="p-1.5 rounded-lg bg-white border border-stone-200 disabled:opacity-30 cursor-pointer"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === blockOrder.length - 1}
                              onClick={() => moveBlock(idx, 1)}
                              className="p-1.5 rounded-lg bg-white border border-stone-200 disabled:opacity-30 cursor-pointer"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={toggleBlk}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer ${
                                isVisible
                                  ? 'bg-emerald-100 text-emerald-900'
                                  : 'bg-stone-200 text-stone-600'
                              }`}
                            >
                              {isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                              <span>{isVisible ? 'نمایش' : 'مخفی'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'honors' && (
              <HonorsManagerEditor
                crextioConfig={crextioConfig}
                updateCrextioConfig={updateCrextioConfig}
                triggerSuccess={pulseSaved}
              />
            )}

            {activeTab === 'unified_boxes' && (
              <div className="space-y-6">
                <UnifiedShowcaseManagerEditor
                  crextioConfig={crextioConfig}
                  updateCrextioConfig={updateCrextioConfig}
                  triggerSuccess={pulseSaved}
                />

                {/* Per-Box Configuration (Design Mode, Width, Scale, Image Toggle, Upload) */}
                <div className="pt-4 border-t border-stone-200 space-y-3">
                  <h4 className="text-xs font-black text-stone-900">
                    تنظیم مستقل هر باکس (سبک کلاسیک/ساده، بزرگ/کوچک، عکس پیش‌زمینه)
                  </h4>

                  <div className="space-y-2.5">
                    {SHOWCASE_BOXES.map(box => {
                      const lay = layoutsMap[box.key] || {
                        span: 'half',
                        density: 'minimal',
                        scale: 'normal',
                        showImage: true,
                      };
                      const isHidden = hiddenMap[box.key] === true;
                      const imgSrc = resolveShowcaseImageUrl(box.key, crextioConfig.showcaseImageOverrides);
                      const showImg =
                        crextioConfig.showShowcaseImagesInMinimal !== false &&
                        lay.showImage !== false;

                      return (
                        <div
                          key={box.key}
                          className="p-3 rounded-2xl border border-stone-200 bg-stone-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {imgSrc && (
                              <img
                                src={imgSrc}
                                alt={box.title}
                                referrerPolicy="no-referrer"
                                className={`w-12 h-10 rounded-lg object-cover border border-stone-200 shrink-0 ${
                                  showImg ? 'opacity-100' : 'opacity-30 grayscale'
                                }`}
                              />
                            )}
                            <div className="min-w-0">
                              <div className="text-xs font-black text-stone-900 truncate">{box.title}</div>
                              <div className="text-[10px] text-stone-500">
                                {lay.density === 'full' ? 'طراحی کلاسیک کامل' : 'طراحی جدید ساده'} ·{' '}
                                {lay.span === 'full' ? 'تمام‌عرض' : 'نصف‌عرض ۱/۲'}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                updateCrextioConfig({
                                  dashboardSectionLayouts: {
                                    ...layoutsMap,
                                    [box.key]: {
                                      ...lay,
                                      density: lay.density === 'full' ? 'minimal' : 'full',
                                    },
                                  },
                                });
                                pulseSaved();
                              }}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold border cursor-pointer ${
                                lay.density === 'full'
                                  ? 'bg-amber-100 border-amber-300 text-amber-950'
                                  : 'bg-white border-stone-300 text-stone-700'
                              }`}
                            >
                              {lay.density === 'full' ? 'کلاسیک' : 'ساده'}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                updateCrextioConfig({
                                  dashboardSectionLayouts: {
                                    ...layoutsMap,
                                    [box.key]: {
                                      ...lay,
                                      span: lay.span === 'full' ? 'half' : 'full',
                                    },
                                  },
                                });
                                pulseSaved();
                              }}
                              className="px-2 py-1 rounded-lg bg-white border border-stone-300 text-[10px] font-bold cursor-pointer"
                            >
                              {lay.span === 'full' ? 'تمام‌عرض' : 'نصف‌عرض'}
                            </button>

                            <select
                              value={lay.scale || 'normal'}
                              onChange={e => {
                                updateCrextioConfig({
                                  dashboardSectionLayouts: {
                                    ...layoutsMap,
                                    [box.key]: { ...lay, scale: e.target.value as any },
                                  },
                                });
                                pulseSaved();
                              }}
                              className="px-2 py-1 rounded-lg bg-white border border-stone-300 text-[10px] font-bold"
                            >
                              <option value="micro">خیلی کوچک (مینی)</option>
                              <option value="compact">کوچک</option>
                              <option value="normal">متوسط</option>
                              <option value="expanded">بزرگ</option>
                            </select>

                            <button
                              type="button"
                              onClick={() => {
                                updateCrextioConfig({
                                  dashboardSectionLayouts: {
                                    ...layoutsMap,
                                    [box.key]: { ...lay, showImage: lay.showImage === false },
                                  },
                                });
                                pulseSaved();
                              }}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold border cursor-pointer ${
                                lay.showImage !== false
                                  ? 'bg-emerald-100 border-emerald-300 text-emerald-900'
                                  : 'bg-stone-200 border-stone-300 text-stone-600'
                              }`}
                            >
                              {lay.showImage !== false ? 'عکس: روشن' : 'عکس: خاموش'}
                            </button>

                            <button
                              type="button"
                              disabled={uploadingBoxKey === box.key}
                              onClick={() => {
                                targetBoxKeyRef.current = box.key;
                                boxFileRef.current?.click();
                              }}
                              title="آپلود عکس اختصاصی برای این باکس"
                              className="p-1.5 rounded-lg bg-white border border-stone-300 hover:bg-stone-100 cursor-pointer"
                            >
                              {uploadingBoxKey === box.key ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Upload className="w-3 h-3" />
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                updateCrextioConfig({
                                  hiddenDashboardSections: {
                                    ...hiddenMap,
                                    [box.key]: !isHidden,
                                  },
                                });
                                pulseSaved();
                              }}
                              className={`p-1.5 rounded-lg cursor-pointer ${
                                !isHidden ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'
                              }`}
                            >
                              {!isHidden ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* All-Site Showcase Image Editor inside Theme 3 Studio */}
                <ShowcaseImagesStudioPanel
                  crextioConfig={crextioConfig}
                  updateCrextioConfig={updateCrextioConfig}
                  triggerSuccess={pulseSaved}
                />
              </div>
            )}
          </div>
        </motion.aside>
      </div>
    </AnimatePresence>
  );
};
