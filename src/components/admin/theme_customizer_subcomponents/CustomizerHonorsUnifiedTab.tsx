import React, { useState, useRef } from 'react';
import { CrextioDashboardConfig, HonorAppointmentItem } from '../../../types';
import { api } from '../../../services/apiClient';
import { resolveHonorImageUrl } from '../../../data/showcaseImages';
import { toPersianNumbers } from '../../../utils/persianNumbers';
import {
  Award,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Upload,
  Loader2,
  Check,
  Sparkles,
  Columns2,
  Sliders,
} from 'lucide-react';

interface EditorBaseProps {
  crextioConfig: CrextioDashboardConfig;
  updateCrextioConfig: (updates: Partial<CrextioDashboardConfig>) => void;
  triggerSuccess?: () => void;
}

export const HonorsManagerEditor: React.FC<EditorBaseProps> = ({
  crextioConfig,
  updateCrextioConfig,
  triggerSuccess,
}) => {
  const items: HonorAppointmentItem[] = crextioConfig.honorsItems || [];
  const layoutsMap = crextioConfig.dashboardSectionLayouts || {};
  const honorLayout = layoutsMap.honors_showcase || { span: 'full', density: 'full', scale: 'normal' };

  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeUploadTargetRef = useRef<string | null>(null);

  const commitItems = (nextItems: HonorAppointmentItem[]) => {
    updateCrextioConfig({ honorsItems: nextItems });
    triggerSuccess?.();
  };

  const handleAddPage = () => {
    const newPage: HonorAppointmentItem = {
      id: `honor_${Date.now()}`,
      category: 'انتصاب قضایی',
      title: 'تبریک انتصاب جناب آقای ... به سمت ...',
      honoreeName: 'نام و نام خانوادگی افتخارآفرین',
      positionOrAchievement: 'سمت جدید یا عنوان رتبه کسب‌شده',
      description: 'مجمع دانش‌آموختگان فقه و قضا ضمن تبریک صمیمانه، توفیق روزافزون ایشان را مسئلت می‌نماید.',
      dateOrLocation: '۱۴۰۴ · قوه قضائیه',
      imageUrl: 'builtin:judicial_appointment',
      textPosition: 'bottom_right',
      scrimStrength: 'medium',
      ctaLabel: 'مشاهده بانک نخبگان',
      ctaAction: 'navigate_alumni',
    };
    commitItems([...items, newPage]);
  };

  const handleUpdateField = (
    id: string,
    patch: Partial<HonorAppointmentItem>
  ) => {
    commitItems(items.map(it => (it.id === id ? { ...it, ...patch } : it)));
  };

  const handleMove = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(idx, 1);
    next.splice(target, 0, moved);
    commitItems(next);
  };

  const handleDelete = (id: string) => {
    commitItems(items.filter(it => it.id !== id));
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const targetId = activeUploadTargetRef.current;
    if (!file || !targetId) return;
    setUploadingId(targetId);
    try {
      const res = await api.uploadFile(file, 'misc');
      if (res?.url) {
        handleUpdateField(targetId, { imageUrl: res.url });
      }
    } catch (err: any) {
      alert(`خطا در آپلود تصویر: ${err.message || 'خطای سرور'}`);
    } finally {
      setUploadingId(null);
      activeUploadTargetRef.current = null;
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-5" dir="rtl">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleUploadImage}
        className="hidden"
      />

      {/* General Settings & Span Size */}
      <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-800" />
            <h4 className="font-extrabold text-xs sm:text-sm text-stone-900">
              تنظیمات کلی ویترین افتخارات و انتصابات ({toPersianNumbers(items.length)} صفحه)
            </h4>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                updateCrextioConfig({
                  showHonorsShowcase: crextioConfig.showHonorsShowcase === false,
                });
                triggerSuccess?.();
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer border ${
                crextioConfig.showHonorsShowcase !== false
                  ? 'bg-emerald-800 text-white border-emerald-800'
                  : 'bg-white text-stone-600 border-stone-300'
              }`}
            >
              {crextioConfig.showHonorsShowcase !== false ? 'ویترین فعال است' : 'ویترین مخفی است'}
            </button>

            <button
              type="button"
              onClick={() => {
                const nextSpan = honorLayout.span === 'half' ? 'full' : 'half';
                updateCrextioConfig({
                  dashboardSectionLayouts: {
                    ...layoutsMap,
                    honors_showcase: {
                      ...honorLayout,
                      span: nextSpan,
                    },
                  },
                  theme3Config: {
                    ...(crextioConfig.theme3Config || {}),
                    blockSpans: {
                      ...(crextioConfig.theme3Config?.blockSpans || {}),
                      honors_showcase: nextSpan,
                    },
                  },
                });
                triggerSuccess?.();
              }}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-stone-100 border border-amber-300 text-amber-950 text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <Columns2 className="w-3.5 h-3.5" />
              <span>{honorLayout.span === 'half' ? 'حالت فعلی: نیم‌صفحه (۱/۲)' : 'حالت فعلی: تمام‌صفحه (۱/۱)'}</span>
            </button>

            <button
              type="button"
              onClick={handleAddPage}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-black flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>افزودن صفحه جدید</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-stone-700 mb-1">تیتر بخش</label>
            <input
              type="text"
              value={crextioConfig.honorsShowcaseTitle || ''}
              onChange={e => updateCrextioConfig({ honorsShowcaseTitle: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-xs font-bold"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-stone-700 mb-1">زیرتیتر بخش</label>
            <input
              type="text"
              value={crextioConfig.honorsShowcaseSubtitle || ''}
              onChange={e => updateCrextioConfig({ honorsShowcaseSubtitle: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-xs"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-stone-700 mb-1">زمان تعویض خودکار (ثانیه)</label>
            <input
              type="number"
              min={2}
              max={30}
              value={crextioConfig.honorsAutoplaySeconds || 7}
              onChange={e => updateCrextioConfig({ honorsAutoplaySeconds: Number(e.target.value) || 7 })}
              className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-xs font-mono"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-stone-700 mb-1">ارتفاع ویترین</label>
            <select
              value={honorLayout.scale || 'normal'}
              onChange={e => {
                updateCrextioConfig({
                  dashboardSectionLayouts: {
                    ...layoutsMap,
                    honors_showcase: {
                      ...honorLayout,
                      scale: e.target.value as any,
                    },
                  },
                });
                triggerSuccess?.();
              }}
              className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-xs font-bold"
            >
              <option value="micro">خیلی کوچک (مینی)</option>
              <option value="compact">فشرده</option>
              <option value="normal">استاندارد</option>
              <option value="expanded">بزرگ</option>
            </select>
          </div>
        </div>
      </div>

      {/* Pages List */}
      <div className="space-y-4">
        {items.map((item, idx) => (
          <div
            key={item.id}
            className="p-4 rounded-2xl bg-white border border-stone-200 space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 font-black text-xs flex items-center justify-center">
                  {toPersianNumbers(idx + 1)}
                </span>
                <span className="text-xs font-black text-stone-900 truncate max-w-[260px]">
                  {item.honoreeName || item.title}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => handleMove(idx, -1)}
                  className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 disabled:opacity-30 cursor-pointer"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={idx === items.length - 1}
                  onClick={() => handleMove(idx, 1)}
                  className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 disabled:opacity-30 cursor-pointer"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer"
                  title="حذف این صفحه"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
              {/* Thumbnail + Disk Upload */}
              <div className="md:col-span-4 space-y-2">
                <div className="relative h-32 rounded-xl overflow-hidden border border-stone-200 bg-stone-100">
                  <img
                    src={resolveHonorImageUrl(item.imageUrl, idx)}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={uploadingId === item.id}
                    onClick={() => {
                      activeUploadTargetRef.current = item.id;
                      fileInputRef.current?.click();
                    }}
                    className="flex-1 px-2.5 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {uploadingId === item.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>آپلود عکس روی سرور</span>
                  </button>

                  <select
                    value={item.imageUrl.startsWith('builtin:') ? item.imageUrl : ''}
                    onChange={e => e.target.value && handleUpdateField(item.id, { imageUrl: e.target.value })}
                    className="px-2 py-1.5 rounded-xl bg-stone-100 border border-stone-200 text-[10px] font-bold"
                  >
                    <option value="">عکس پیش‌فرض...</option>
                    <option value="builtin:judicial_appointment">تالار انتصاب</option>
                    <option value="builtin:academic_award">تندیس علمی</option>
                    <option value="builtin:research_library">کتابخانه پژوهش</option>
                    <option value="builtin:rulings_justice">ترازوی قضا</option>
                  </select>
                </div>
              </div>

              {/* Fields */}
              <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 mb-1">نوع / دسته‌بندی</label>
                  <input
                    type="text"
                    value={item.category}
                    onChange={e => handleUpdateField(item.id, { category: e.target.value })}
                    placeholder="مثال: انتصاب قضایی / رتبه ۱ کشوری"
                    className="w-full px-2.5 py-1.5 rounded-xl border border-stone-300 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 mb-1">تاریخ یا محل</label>
                  <input
                    type="text"
                    value={item.dateOrLocation || ''}
                    onChange={e => handleUpdateField(item.id, { dateOrLocation: e.target.value })}
                    placeholder="آبان ۱۴۰۴ · دادگستری استان"
                    className="w-full px-2.5 py-1.5 rounded-xl border border-stone-300"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-stone-500 mb-1">متن اصلی تبریک / تیتر روی عکس</label>
                  <input
                    type="text"
                    value={item.title}
                    onChange={e => handleUpdateField(item.id, { title: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-stone-300 font-extrabold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-stone-500 mb-1">نام فرد / گروه</label>
                  <input
                    type="text"
                    value={item.honoreeName}
                    onChange={e => handleUpdateField(item.id, { honoreeName: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-stone-300 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-stone-500 mb-1">سمت یا دستاورد</label>
                  <input
                    type="text"
                    value={item.positionOrAchievement}
                    onChange={e => handleUpdateField(item.id, { positionOrAchievement: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-stone-300"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-stone-500 mb-1">توضیحات تکمیلی روی عکس</label>
                  <textarea
                    rows={2}
                    value={item.description || ''}
                    onChange={e => handleUpdateField(item.id, { description: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-stone-300 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-stone-500 mb-1">چیدمان متن روی تصویر</label>
                  <select
                    value={item.textPosition || 'bottom_right'}
                    onChange={e => handleUpdateField(item.id, { textPosition: e.target.value as any })}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-stone-300 font-bold"
                  >
                    <option value="bottom_right">پایین راست (کلاسیک)</option>
                    <option value="center">وسط‌چین سینمایی</option>
                    <option value="bottom_bar">نوار شیشه‌ای پایین عکس</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-stone-500 mb-1">عمق سایه‌روشن خوانایی</label>
                  <select
                    value={item.scrimStrength || 'medium'}
                    onChange={e => handleUpdateField(item.id, { scrimStrength: e.target.value as any })}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-stone-300 font-bold"
                  >
                    <option value="soft">ملایم</option>
                    <option value="medium">متعادل (پیشنهادی)</option>
                    <option value="strong">تیره قوی</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const UNIFIED_CANDIDATES = [
  { key: 'rulings_showcase', title: 'تالار نقد و مباحثه آراء قضایی' },
  { key: 'research_promo', title: 'باشگاه راهبری پژوهش و رساله‌ها' },
  { key: 'course_showcase', title: 'دوره‌ها و کارگاه‌های علمی' },
  { key: 'counseling_promo', title: 'خدمات مشاوره نخبگان (تخصصی و عمومی)' },
  { key: 'welfare_showcase', title: 'تسهیلات رفاهی، وام و اقامتگاه‌ها' },
  { key: 'multimedia_showcase', title: 'درس‌گفتارها و آرشیو چندرسانه‌ای' },
  { key: 'books_showcase', title: 'کتب، موسوعه‌ها و منشورات تخصصی' },
];

export const UnifiedShowcaseManagerEditor: React.FC<EditorBaseProps> = ({
  crextioConfig,
  updateCrextioConfig,
  triggerSuccess,
}) => {
  const included =
    crextioConfig.unifiedShowcaseIncludedKeys && crextioConfig.unifiedShowcaseIncludedKeys.length > 0
      ? crextioConfig.unifiedShowcaseIncludedKeys
      : UNIFIED_CANDIDATES.map(c => c.key);

  const layoutsMap = crextioConfig.dashboardSectionLayouts || {};
  const unifiedLayout = layoutsMap.unified_showcase || { span: 'full', density: 'full', scale: 'normal' };

  const toggleItem = (key: string) => {
    const exists = included.includes(key);
    if (exists && included.length <= 1) {
      alert('حداقل یک ویترین باید در نمایشگاه جامع انتخاب شده باشد.');
      return;
    }
    const next = exists ? included.filter(k => k !== key) : [...included, key];
    updateCrextioConfig({ unifiedShowcaseIncludedKeys: next });
    triggerSuccess?.();
  };

  return (
    <div className="space-y-5" dir="rtl">
      <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-800" />
            <h4 className="font-extrabold text-xs sm:text-sm text-stone-900">
              پیکربندی ویترین جامع یکپارچه (مشترک در تم ۲ و تم ۳)
            </h4>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                updateCrextioConfig({
                  showUnifiedShowcase: crextioConfig.showUnifiedShowcase === false,
                });
                triggerSuccess?.();
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer border ${
                crextioConfig.showUnifiedShowcase !== false
                  ? 'bg-emerald-800 text-white border-emerald-800'
                  : 'bg-white text-stone-600 border-stone-300'
              }`}
            >
              {crextioConfig.showUnifiedShowcase !== false ? 'ویترین جامع فعال' : 'ویترین جامع مخفی'}
            </button>

            <button
              type="button"
              onClick={() => {
                const nextSpan = unifiedLayout.span === 'half' ? 'full' : 'half';
                updateCrextioConfig({
                  dashboardSectionLayouts: {
                    ...layoutsMap,
                    unified_showcase: {
                      ...unifiedLayout,
                      span: nextSpan,
                    },
                  },
                  theme3Config: {
                    ...(crextioConfig.theme3Config || {}),
                    blockSpans: {
                      ...(crextioConfig.theme3Config?.blockSpans || {}),
                      unified_showcase: nextSpan,
                    },
                  },
                });
                triggerSuccess?.();
              }}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-stone-100 border border-emerald-300 text-emerald-950 text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <Columns2 className="w-3.5 h-3.5" />
              <span>{unifiedLayout.span === 'half' ? 'حالت فعلی: نیم‌صفحه (۱/۲)' : 'حالت فعلی: تمام‌صفحه (۱/۱)'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-stone-700 mb-1">تیتر ویترین جامع</label>
            <input
              type="text"
              value={crextioConfig.unifiedShowcaseTitle || ''}
              onChange={e => updateCrextioConfig({ unifiedShowcaseTitle: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-xs font-bold"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold text-stone-700 mb-1">زیرتیتر</label>
            <input
              type="text"
              value={crextioConfig.unifiedShowcaseSubtitle || ''}
              onChange={e => updateCrextioConfig({ unifiedShowcaseSubtitle: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-xs"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-stone-700 mb-1">سبک نمایش</label>
            <select
              value={crextioConfig.unifiedShowcaseStyle || 'cinematic'}
              onChange={e => updateCrextioConfig({ unifiedShowcaseStyle: e.target.value as any })}
              className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-xs font-bold"
            >
              <option value="cinematic">اسلایدر سینمایی با تب و تصویر</option>
              <option value="tabbed_grid">کارت‌های شبکه‌ای همزمان</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-stone-700 mb-1">اندازه و ارتفاع (شامل خیلی کوچک در سینمایی)</label>
            <select
              value={unifiedLayout.scale || 'normal'}
              onChange={e => {
                updateCrextioConfig({
                  dashboardSectionLayouts: {
                    ...layoutsMap,
                    unified_showcase: {
                      ...unifiedLayout,
                      scale: e.target.value as any,
                    },
                  },
                });
                triggerSuccess?.();
              }}
              className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-xs font-bold"
            >
              <option value="micro">خیلی کوچک / باریک (Micro)</option>
              <option value="compact">کوچک و فشرده (Compact)</option>
              <option value="normal">استاندارد</option>
              <option value="expanded">بزرگ (Expanded)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-stone-700 mb-1">زمان تعویض اسلاید (ثانیه — پیش‌فرض ۴)</label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={2}
                max={30}
                value={crextioConfig.unifiedShowcaseAutoplaySeconds ?? 4}
                onChange={e => {
                  updateCrextioConfig({ unifiedShowcaseAutoplaySeconds: Math.max(2, Number(e.target.value) || 4) });
                  triggerSuccess?.();
                }}
                className="w-20 px-3 py-2 rounded-xl bg-white border border-stone-300 text-xs font-mono font-bold text-center"
              />
              <button
                type="button"
                onClick={() => {
                  updateCrextioConfig({
                    unifiedShowcaseAutoplay: crextioConfig.unifiedShowcaseAutoplay === false,
                  });
                  triggerSuccess?.();
                }}
                className={`flex-1 px-2.5 py-2 rounded-xl text-[11px] font-bold border cursor-pointer ${
                  crextioConfig.unifiedShowcaseAutoplay !== false
                    ? 'bg-emerald-800 text-white border-emerald-800'
                    : 'bg-white text-stone-700 border-stone-300'
                }`}
              >
                {crextioConfig.unifiedShowcaseAutoplay !== false ? 'چرخش: روشن' : 'چرخش: خاموش'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Selectable Sub-Showcases */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-stone-800 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-emerald-700" />
            <span>انتخاب کنید کدام ویترین‌ها درون این ویترین جامع نمایش داده شوند:</span>
          </span>
          <button
            type="button"
            onClick={() => {
              updateCrextioConfig({
                unifiedShowcaseIncludedKeys: UNIFIED_CANDIDATES.map(c => c.key),
              });
              triggerSuccess?.();
            }}
            className="text-[11px] font-bold text-emerald-800 hover:underline cursor-pointer"
          >
            انتخاب همه ({toPersianNumbers(UNIFIED_CANDIDATES.length)})
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {UNIFIED_CANDIDATES.map(cand => {
            const active = included.includes(cand.key);
            return (
              <button
                key={cand.key}
                type="button"
                onClick={() => toggleItem(cand.key)}
                className={`p-3 rounded-2xl border text-right flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                  active
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold'
                    : 'bg-white border-stone-200 text-stone-500 hover:bg-stone-50'
                }`}
              >
                <span className="text-xs">{cand.title}</span>
                <span
                  className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                    active ? 'bg-emerald-700 text-white' : 'bg-stone-200 text-stone-400'
                  }`}
                >
                  {active && <Check className="w-3.5 h-3.5" />}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
