import React, { useState, useRef } from 'react';
import { GraduationCap, HeartHandshake, Scale, Gift, BookOpen, Video, Upload, Loader2, RotateCcw } from 'lucide-react';
import { CrextioDashboardConfig } from '../../../types';
import { CustomizerTab } from '../ThemeCustomizerModal';
import { api } from '../../../services/apiClient';
import { resolveShowcaseImageUrl } from '../../../data/showcaseImages';

interface CustomizerShowcaseTabsProps {
  activeTab: CustomizerTab;
  crextioConfig: CrextioDashboardConfig;
  updateCrextioConfig: (updates: Partial<CrextioDashboardConfig>) => void;
  triggerSuccess: () => void;
  handleToggle: (key: keyof CrextioDashboardConfig) => void;
}

const ShowcaseCoverUploadBar: React.FC<{
  sectionKey: string;
  label: string;
  crextioConfig: CrextioDashboardConfig;
  updateCrextioConfig: (updates: Partial<CrextioDashboardConfig>) => void;
  triggerSuccess: () => void;
}> = ({ sectionKey, label, crextioConfig, updateCrextioConfig, triggerSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const overrides = crextioConfig.showcaseImageOverrides || {};
  const preview = resolveShowcaseImageUrl(sectionKey, overrides);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await api.uploadFile(file, 'misc');
      if (res?.url) {
        updateCrextioConfig({
          showcaseImageOverrides: { ...overrides, [sectionKey]: res.url },
        });
        triggerSuccess();
      }
    } catch (err: any) {
      alert(`خطا در آپلود تصویر: ${err.message || 'خطای سرور'}`);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="p-3 rounded-2xl bg-white border border-stone-200 flex items-center justify-between gap-3">
      <input ref={inputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
      <div className="flex items-center gap-2.5 min-w-0">
        {preview && (
          <img
            src={preview}
            alt={label}
            referrerPolicy="no-referrer"
            className="w-12 h-10 rounded-xl object-cover border border-stone-200 shrink-0"
          />
        )}
        <div className="min-w-0">
          <div className="text-xs font-black text-stone-900 truncate">{label}</div>
          <div className="text-[10px] text-stone-500">آپلود مستقیم روی سرور برای نمایش در ویترین و نمای ساده</div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
        >
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          <span>آپلود تصویر</span>
        </button>

        {overrides[sectionKey] && (
          <button
            type="button"
            onClick={() => {
              const next = { ...overrides };
              delete next[sectionKey];
              updateCrextioConfig({ showcaseImageOverrides: next });
              triggerSuccess();
            }}
            className="p-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 cursor-pointer"
            title="بازگشت به عکس پیش‌فرض"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

export const CustomizerShowcaseTabs: React.FC<CustomizerShowcaseTabsProps> = ({
  activeTab,
  crextioConfig,
  updateCrextioConfig,
  triggerSuccess,
  handleToggle,
}) => {
  if (activeTab === 'courses') {
    return (
      <div className="space-y-5">
        <div className="p-5 rounded-3xl bg-cyan-50/80 border border-cyan-200 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-xl bg-cyan-200 text-cyan-900 flex items-center justify-center font-bold">
                <GraduationCap className="w-5 h-5 text-cyan-800" />
              </span>
              <div>
                <h4 className="font-extrabold text-sm text-cyan-950">
                  تنظیمات و محتوای ۱۰۰٪ ویترین دوره‌های علمی و کارگاه‌ها
                </h4>
                <p className="text-[11px] text-cyan-800/80 mt-0.5">
                  ویرایش کامل تیتر، زیرعنوان، نشان، دکمه اقدام، شیوه نمایش اسلایدر و زمان چرخش
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleToggle('showCourseShowcase')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                crextioConfig.showCourseShowcase !== false
                  ? 'bg-cyan-800 text-white'
                  : 'bg-stone-300 text-stone-700'
              }`}
            >
              {crextioConfig.showCourseShowcase !== false ? 'نمایش ویترین: فعال' : 'نمایش ویترین: مخفی'}
            </button>
          </div>

          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-stone-700 block mb-1 text-xs">
                  نشان بالای ویترین (Badge):
                </label>
                <input
                  type="text"
                  value={crextioConfig.courseShowcaseBadge || ''}
                  onChange={e => {
                    updateCrextioConfig({ courseShowcaseBadge: e.target.value });
                    triggerSuccess();
                  }}
                  placeholder="مثال: کارگاه‌های عالی فقه و قضا"
                  className="w-full px-4 py-2.5 rounded-2xl bg-white border border-stone-200 text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-cyan-600"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1 text-xs">
                  متن دکمه اقدام (CTA):
                </label>
                <input
                  type="text"
                  value={crextioConfig.courseShowcaseCtaText || ''}
                  onChange={e => {
                    updateCrextioConfig({ courseShowcaseCtaText: e.target.value });
                    triggerSuccess();
                  }}
                  placeholder="مثال: مشاهده همه دوره‌ها و ثبت‌نام"
                  className="w-full px-4 py-2.5 rounded-2xl bg-white border border-stone-200 text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-cyan-600"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1 text-xs">
                عنوان اصلی ویترین دوره‌ها:
              </label>
              <input
                type="text"
                value={crextioConfig.courseShowcaseTitle || ''}
                onChange={e => {
                  updateCrextioConfig({ courseShowcaseTitle: e.target.value });
                  triggerSuccess();
                }}
                placeholder="مثال: دوره‌ها و کارگاه‌های تخصصی توانمندسازی علمی و قضایی"
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-stone-200 text-xs font-black text-stone-900 focus:outline-none focus:ring-2 focus:ring-cyan-600"
              />
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1 text-xs">
                زیرعنوان و توضیحات ویترین:
              </label>
              <input
                type="text"
                value={crextioConfig.courseShowcaseSubtitle || ''}
                onChange={e => {
                  updateCrextioConfig({ courseShowcaseSubtitle: e.target.value });
                  triggerSuccess();
                }}
                placeholder="مثال: آرشیو صوت و تصویر جلسات، اسناد فقه کاربردی و کارگاه‌های عالی..."
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-stone-200 text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-cyan-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-stone-700 block mb-1 text-xs">
                  حالت نمایش دوره‌ها (دو حالت مجزا):
                </label>
                <select
                  value={crextioConfig.courseShowcaseMode || 'carousel'}
                  onChange={e => {
                    updateCrextioConfig({ courseShowcaseMode: e.target.value as any });
                    triggerSuccess();
                  }}
                  className="w-full px-4 py-2.5 rounded-2xl bg-white border border-stone-200 text-xs font-bold text-stone-900 focus:outline-none"
                >
                  <option value="carousel">حالت اول: اسلایدر معرفی چرخشی (Carousel)</option>
                  <option value="grid">حالت دوم: شبکه‌ای ۳ ستونه (Grid)</option>
                  <option value="compact">حالت سوم: ردیف فشرده و افقی (Compact)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1 text-xs">
                  زمان توقف اسلایدر (ثانیه):
                </label>
                <input
                  type="number"
                  min={2}
                  max={60}
                  value={crextioConfig.courseShowcaseInterval || 5}
                  onChange={e => {
                    updateCrextioConfig({ courseShowcaseInterval: Math.max(2, Number(e.target.value) || 5) });
                    triggerSuccess();
                  }}
                  className="w-full px-4 py-2.5 rounded-2xl bg-white border border-stone-200 text-xs font-bold text-stone-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  updateCrextioConfig({
                    courseShowcaseAutoplay: crextioConfig.courseShowcaseAutoplay === false,
                  });
                  triggerSuccess();
                }}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold border cursor-pointer ${
                  crextioConfig.courseShowcaseAutoplay !== false
                    ? 'bg-cyan-800 text-white border-cyan-800'
                    : 'bg-white text-stone-700 border-stone-200'
                }`}
              >
                {crextioConfig.courseShowcaseAutoplay !== false ? 'تعویض خودکار اسلایدر دوره‌ها: روشن' : 'تعویض خودکار اسلایدر دوره‌ها: خاموش'}
              </button>

              <button
                type="button"
                onClick={() => {
                  updateCrextioConfig({
                    courseShowcaseShowPrice: crextioConfig.courseShowcaseShowPrice === false,
                  });
                  triggerSuccess();
                }}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold border cursor-pointer ${
                  crextioConfig.courseShowcaseShowPrice !== false
                    ? 'bg-emerald-800 text-white border-emerald-800'
                    : 'bg-white text-stone-700 border-stone-200'
                }`}
              >
                {crextioConfig.courseShowcaseShowPrice !== false ? 'نمایش شهریه در ویترین: فعال' : 'نمایش شهریه در ویترین: مخفی'}
              </button>
            </div>

            <ShowcaseCoverUploadBar
              sectionKey="course_showcase"
              label="تصویر اختصاصی ویترین دوره‌های علمی"
              crextioConfig={crextioConfig}
              updateCrextioConfig={updateCrextioConfig}
              triggerSuccess={triggerSuccess}
            />
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'counseling') {
    return (
      <div className="space-y-5">
        <div className="p-5 rounded-3xl bg-rose-50/80 border border-rose-200 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-xl bg-rose-200 text-rose-900 flex items-center justify-center font-bold">
                <HeartHandshake className="w-5 h-5 text-rose-800" />
              </span>
              <div>
                <h4 className="font-extrabold text-sm text-rose-950">
                  تنظیمات و محتوای ۱۰۰٪ ویترین خدمات مشاوره نخبگان
                </h4>
                <p className="text-[11px] text-rose-800/80 mt-0.5">
                  ویرایش کامل تیتر، زیرعنوان، کارت مشاوره تخصصی شغلی و کارت مشاوره عمومی
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleToggle('showCounselingPromo')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                crextioConfig.showCounselingPromo !== false
                  ? 'bg-rose-800 text-white'
                  : 'bg-stone-300 text-stone-700'
              }`}
            >
              {crextioConfig.showCounselingPromo !== false ? 'نمایش ویترین: فعال' : 'نمایش ویترین: مخفی'}
            </button>
          </div>

          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-stone-700 block mb-1 text-xs">
                  نشان بالای ویترین:
                </label>
                <input
                  type="text"
                  value={crextioConfig.counselingPromoBadge || ''}
                  onChange={e => {
                    updateCrextioConfig({ counselingPromoBadge: e.target.value });
                    triggerSuccess();
                  }}
                  placeholder="مثال: هدایت علمی، شغلی و روانی نخبگان"
                  className="w-full px-4 py-2.5 rounded-2xl bg-white border border-stone-200 text-xs font-bold text-stone-900"
                />
              </div>
              <div>
                <label className="font-bold text-stone-700 block mb-1 text-xs">
                  عنوان اصلی ویترین:
                </label>
                <input
                  type="text"
                  value={crextioConfig.counselingPromoTitle || ''}
                  onChange={e => {
                    updateCrextioConfig({ counselingPromoTitle: e.target.value });
                    triggerSuccess();
                  }}
                  placeholder="مثال: ویترین و درگاه جامع خدمات مشاوره نخبگان"
                  className="w-full px-4 py-2.5 rounded-2xl bg-white border border-stone-200 text-xs font-black text-stone-900"
                />
              </div>
            </div>

            <ShowcaseCoverUploadBar
              sectionKey="counseling_promo"
              label="تصویر اختصاصی ویترین خدمات مشاوره"
              crextioConfig={crextioConfig}
              updateCrextioConfig={updateCrextioConfig}
              triggerSuccess={triggerSuccess}
            />

            <div>
              <label className="font-bold text-stone-700 block mb-1 text-xs">
                زیرعنوان و توضیحات ویترین مشاوره:
              </label>
              <input
                type="text"
                value={crextioConfig.counselingPromoSubtitle || ''}
                onChange={e => {
                  updateCrextioConfig({ counselingPromoSubtitle: e.target.value });
                  triggerSuccess();
                }}
                placeholder="مثال: مشاوره تخصصی تحصیلی-شغلی قضایی و خدمات روان‌شناختی..."
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-stone-200 text-xs text-stone-900"
              />
            </div>

            {/* Specialized Card Config */}
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3">
              <h5 className="font-bold text-xs text-amber-950 flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-amber-700" />
                <span>تنظیمات کارت مشاوره تخصصی شغلی و تحصیلی قضاوت</span>
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1 text-[11px]">نشان ویژه کارت:</label>
                  <input
                    type="text"
                    value={crextioConfig.counselingPromoSpecializedBadge || ''}
                    onChange={e => {
                      updateCrextioConfig({ counselingPromoSpecializedBadge: e.target.value });
                      triggerSuccess();
                    }}
                    placeholder="ویژه قضات و پژوهشگران"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1 text-[11px]">متن دکمه اقدام:</label>
                  <input
                    type="text"
                    value={crextioConfig.counselingPromoSpecializedBtnText || ''}
                    onChange={e => {
                      updateCrextioConfig({ counselingPromoSpecializedBtnText: e.target.value });
                      triggerSuccess();
                    }}
                    placeholder="رزرو مشاوره تخصصی شغلی"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="font-bold text-stone-700 block mb-1 text-[11px]">تیتر کارت تخصصی:</label>
                <input
                  type="text"
                  value={crextioConfig.counselingPromoSpecializedTitle || ''}
                  onChange={e => {
                    updateCrextioConfig({ counselingPromoSpecializedTitle: e.target.value });
                    triggerSuccess();
                  }}
                  placeholder="مشاوره تخصصی شغلی و تحصیلی قضاوت"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs font-black"
                />
              </div>
              <div>
                <label className="font-bold text-stone-700 block mb-1 text-[11px]">توضیحات کارت تخصصی:</label>
                <textarea
                  rows={2}
                  value={crextioConfig.counselingPromoSpecializedDesc || ''}
                  onChange={e => {
                    updateCrextioConfig({ counselingPromoSpecializedDesc: e.target.value });
                    triggerSuccess();
                  }}
                  placeholder="هدایت مسیر اختبار، ارتقای رتبه به دیوان عالی..."
                  className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs"
                />
              </div>
            </div>

            {/* General Card Config */}
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3">
              <h5 className="font-bold text-xs text-emerald-950 flex items-center gap-1.5">
                <HeartHandshake className="w-4 h-4 text-emerald-700" />
                <span>تنظیمات کارت مشاوره عمومی و سلامت روان</span>
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1 text-[11px]">نشان ویژه کارت:</label>
                  <input
                    type="text"
                    value={crextioConfig.counselingPromoGeneralBadge || ''}
                    onChange={e => {
                      updateCrextioConfig({ counselingPromoGeneralBadge: e.target.value });
                      triggerSuccess();
                    }}
                    placeholder="سلامت روان و خانواده"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1 text-[11px]">متن دکمه اقدام:</label>
                  <input
                    type="text"
                    value={crextioConfig.counselingPromoGeneralBtnText || ''}
                    onChange={e => {
                      updateCrextioConfig({ counselingPromoGeneralBtnText: e.target.value });
                      triggerSuccess();
                    }}
                    placeholder="درخواست نوبت مشاوره عمومی"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="font-bold text-stone-700 block mb-1 text-[11px]">تیتر کارت عمومی:</label>
                <input
                  type="text"
                  value={crextioConfig.counselingPromoGeneralTitle || ''}
                  onChange={e => {
                    updateCrextioConfig({ counselingPromoGeneralTitle: e.target.value });
                    triggerSuccess();
                  }}
                  placeholder="خدمات مشاوره عمومی، خانواده و روان‌شناختی"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs font-black"
                />
              </div>
              <div>
                <label className="font-bold text-stone-700 block mb-1 text-[11px]">توضیحات کارت عمومی:</label>
                <textarea
                  rows={2}
                  value={crextioConfig.counselingPromoGeneralDesc || ''}
                  onChange={e => {
                    updateCrextioConfig({ counselingPromoGeneralDesc: e.target.value });
                    triggerSuccess();
                  }}
                  placeholder="روان‌شناسی بالینی، مشاوره ازدواج، مدیریت استرس شغلی..."
                  className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'welfare') {
    return (
      <div className="space-y-5">
        <div className="p-5 rounded-3xl bg-teal-50/80 border border-teal-200 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-xl bg-teal-200 text-teal-900 flex items-center justify-center font-bold">
                <Gift className="w-5 h-5 text-teal-800" />
              </span>
              <div>
                <h4 className="font-extrabold text-sm text-teal-950">
                  تنظیمات و محتوای ۱۰۰٪ ویترین خدمات رفاهی و تسهیلات
                </h4>
                <p className="text-[11px] text-teal-800/80 mt-0.5">
                  ویرایش کامل تیتر، زیرعنوان، نشان، دکمه اقدام و سقف وام قرض‌الحسنه صندوق حامی
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleToggle('showWelfareShowcase')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                crextioConfig.showWelfareShowcase !== false
                  ? 'bg-teal-800 text-white'
                  : 'bg-stone-300 text-stone-700'
              }`}
            >
              {crextioConfig.showWelfareShowcase !== false ? 'نمایش ویترین: فعال' : 'نمایش ویترین: مخفی'}
            </button>
          </div>

          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-stone-700 block mb-1 text-xs">نشان بالای ویترین:</label>
                <input
                  type="text"
                  value={crextioConfig.welfareShowcaseBadge || ''}
                  onChange={e => {
                    updateCrextioConfig({ welfareShowcaseBadge: e.target.value });
                    triggerSuccess();
                  }}
                  placeholder="صندوق رفاه نخبگان حوزوی و قضایی"
                  className="w-full px-4 py-2.5 rounded-2xl bg-white border border-stone-200 text-xs font-bold text-stone-900"
                />
              </div>
              <div>
                <label className="font-bold text-stone-700 block mb-1 text-xs">متن دکمه ورود (CTA):</label>
                <input
                  type="text"
                  value={crextioConfig.welfareShowcaseCtaText || ''}
                  onChange={e => {
                    updateCrextioConfig({ welfareShowcaseCtaText: e.target.value });
                    triggerSuccess();
                  }}
                  placeholder="میز کار رفاهیات و تسهیلات"
                  className="w-full px-4 py-2.5 rounded-2xl bg-white border border-stone-200 text-xs font-bold text-stone-900"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1 text-xs">عنوان اصلی ویترین رفاهیات:</label>
              <input
                type="text"
                value={crextioConfig.welfareShowcaseTitle || ''}
                onChange={e => {
                  updateCrextioConfig({ welfareShowcaseTitle: e.target.value });
                  triggerSuccess();
                }}
                placeholder="ویترین خدمات رفاهی، تسهیلات و اقامتگاه‌های زیارتی"
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-stone-200 text-xs font-black text-stone-900"
              />
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1 text-xs">زیرعنوان و توضیحات ویترین:</label>
              <input
                type="text"
                value={crextioConfig.welfareShowcaseSubtitle || ''}
                onChange={e => {
                  updateCrextioConfig({ welfareShowcaseSubtitle: e.target.value });
                  triggerSuccess();
                }}
                placeholder="وام قرض‌الحسنه صندوق حامی، اقامتگاه‌های مشهد و قم..."
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-stone-200 text-xs text-stone-900"
              />
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1 text-xs">سقف وام قرض‌الحسنه قابل نمایش:</label>
              <input
                type="text"
                value={crextioConfig.welfareShowcaseLoanAmount || ''}
                onChange={e => {
                  updateCrextioConfig({ welfareShowcaseLoanAmount: e.target.value });
                  triggerSuccess();
                }}
                placeholder="تا سقف ۲۰۰ میلیون تومان"
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-stone-200 text-xs font-bold text-teal-800"
              />
            </div>

            <ShowcaseCoverUploadBar
              sectionKey="welfare_showcase"
              label="تصویر اختصاصی ویترین خدمات رفاهی"
              crextioConfig={crextioConfig}
              updateCrextioConfig={updateCrextioConfig}
              triggerSuccess={triggerSuccess}
            />
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'books') {
    return (
      <div className="space-y-5">
        <div className="p-5 rounded-3xl bg-purple-50/80 border border-purple-200 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-xl bg-purple-200 text-purple-900 flex items-center justify-center font-bold">
                <BookOpen className="w-5 h-5 text-purple-800" />
              </span>
              <div>
                <h4 className="font-extrabold text-sm text-purple-950">
                  تنظیمات و محتوای ۱۰۰٪ ویترین کتاب و محصولات چند رسانه‌ای
                </h4>
                <p className="text-[11px] text-purple-800/80 mt-0.5">
                  ویرایش کامل تیتر، زیرعنوان، نشان، دکمه ورود و دسته‌بندی‌های نمایشی
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleToggle('showPublicationsGallery')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                crextioConfig.showPublicationsGallery !== false
                  ? 'bg-purple-800 text-white'
                  : 'bg-stone-300 text-stone-700'
              }`}
            >
              {crextioConfig.showPublicationsGallery !== false ? 'نمایش ویترین: فعال' : 'نمایش ویترین: مخفی'}
            </button>
          </div>

          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-stone-700 block mb-1 text-xs">نشان بالای ویترین:</label>
                <input
                  type="text"
                  value={crextioConfig.booksShowcaseBadge || ''}
                  onChange={e => {
                    updateCrextioConfig({ booksShowcaseBadge: e.target.value });
                    triggerSuccess();
                  }}
                  placeholder="کتاب و محصولات چند رسانه‌ای"
                  className="w-full px-4 py-2.5 rounded-2xl bg-white border border-stone-200 text-xs font-bold text-stone-900"
                />
              </div>
              <div>
                <label className="font-bold text-stone-700 block mb-1 text-xs">متن دکمه ورود (CTA):</label>
                <input
                  type="text"
                  value={crextioConfig.booksShowcaseCtaText || ''}
                  onChange={e => {
                    updateCrextioConfig({ booksShowcaseCtaText: e.target.value });
                    triggerSuccess();
                  }}
                  placeholder="ورود به کتاب و محصولات چند رسانه‌ای"
                  className="w-full px-4 py-2.5 rounded-2xl bg-white border border-stone-200 text-xs font-bold text-stone-900"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1 text-xs">عنوان اصلی ویترین:</label>
              <input
                type="text"
                value={crextioConfig.booksShowcaseTitle || ''}
                onChange={e => {
                  updateCrextioConfig({ booksShowcaseTitle: e.target.value });
                  triggerSuccess();
                }}
                placeholder="ویترین کتاب و محصولات چند رسانه‌ای"
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-stone-200 text-xs font-black text-stone-900"
              />
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1 text-xs">زیرعنوان و توضیحات ویترین:</label>
              <input
                type="text"
                value={crextioConfig.booksShowcaseSubtitle || ''}
                onChange={e => {
                  updateCrextioConfig({ booksShowcaseSubtitle: e.target.value });
                  triggerSuccess();
                }}
                placeholder="موسوعه‌ها، کتاب‌های مرجع فقهی و حقوقی، تقریرات خارج فقه..."
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-stone-200 text-xs text-stone-900"
              />
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1 text-xs">متن تخفیف ویژه دانش‌آموختگان:</label>
              <input
                type="text"
                value={crextioConfig.booksShowcaseDiscountNotice || ''}
                onChange={e => {
                  updateCrextioConfig({ booksShowcaseDiscountNotice: e.target.value });
                  triggerSuccess();
                }}
                placeholder="تخفیف ویژه ۴۰ درصدی دانش‌آموختگان"
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-stone-200 text-xs font-bold text-purple-900"
              />
            </div>

            <ShowcaseCoverUploadBar
              sectionKey="books_showcase"
              label="تصویر اختصاصی ویترین کتب و منشورات"
              crextioConfig={crextioConfig}
              updateCrextioConfig={updateCrextioConfig}
              triggerSuccess={triggerSuccess}
            />
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'multimedia') {
    return (
      <div className="space-y-5">
        <div className="p-5 rounded-3xl bg-blue-50/80 border border-blue-200 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-xl bg-blue-200 text-blue-900 flex items-center justify-center font-bold">
                <Video className="w-5 h-5 text-blue-800" />
              </span>
              <div>
                <h4 className="font-extrabold text-sm text-blue-950">
                  تنظیمات و محتوای ۱۰۰٪ ویترین درس‌گفتارها و چندرسانه‌ای
                </h4>
                <p className="text-[11px] text-blue-800/80 mt-0.5">
                  ویرایش کامل تیتر، زیرعنوان، نشان، دکمه اقدام و تعداد جلسات درس‌گفتار
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleToggle('showMultimediaShowcase')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                crextioConfig.showMultimediaShowcase !== false
                  ? 'bg-blue-800 text-white'
                  : 'bg-stone-300 text-stone-700'
              }`}
            >
              {crextioConfig.showMultimediaShowcase !== false ? 'نمایش ویترین: فعال' : 'نمایش ویترین: مخفی'}
            </button>
          </div>

          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-stone-700 block mb-1 text-xs">نشان بالای ویترین:</label>
                <input
                  type="text"
                  value={crextioConfig.multimediaShowcaseBadge || ''}
                  onChange={e => {
                    updateCrextioConfig({ multimediaShowcaseBadge: e.target.value });
                    triggerSuccess();
                  }}
                  placeholder="آرشیو صوتی و تصویری"
                  className="w-full px-4 py-2.5 rounded-2xl bg-white border border-stone-200 text-xs font-bold text-stone-900"
                />
              </div>
              <div>
                <label className="font-bold text-stone-700 block mb-1 text-xs">متن دکمه ورود (CTA):</label>
                <input
                  type="text"
                  value={crextioConfig.multimediaShowcaseCtaText || ''}
                  onChange={e => {
                    updateCrextioConfig({ multimediaShowcaseCtaText: e.target.value });
                    triggerSuccess();
                  }}
                  placeholder="ورود به آرشیو چندرسانه‌ای"
                  className="w-full px-4 py-2.5 rounded-2xl bg-white border border-stone-200 text-xs font-bold text-stone-900"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1 text-xs">عنوان اصلی ویترین چندرسانه‌ای:</label>
              <input
                type="text"
                value={crextioConfig.multimediaShowcaseTitle || ''}
                onChange={e => {
                  updateCrextioConfig({ multimediaShowcaseTitle: e.target.value });
                  triggerSuccess();
                }}
                placeholder="ویترین محصولات چندرسانه‌ای و درس‌گفتارها"
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-stone-200 text-xs font-black text-stone-900"
              />
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1 text-xs">زیرعنوان و توضیحات ویترین:</label>
              <input
                type="text"
                value={crextioConfig.multimediaShowcaseSubtitle || ''}
                onChange={e => {
                  updateCrextioConfig({ multimediaShowcaseSubtitle: e.target.value });
                  triggerSuccess();
                }}
                placeholder="درس‌گفتارهای صوتی خارج فقه القضا، جلسات نقد آراء..."
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-stone-200 text-xs text-stone-900"
              />
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1 text-xs">تعداد جلسات فعال:</label>
              <input
                type="text"
                value={crextioConfig.multimediaLecturesCount || ''}
                onChange={e => {
                  updateCrextioConfig({ multimediaLecturesCount: e.target.value });
                  triggerSuccess();
                }}
                placeholder="۴۸ جلسه"
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-stone-200 text-xs font-bold text-blue-900"
              />
            </div>

            <ShowcaseCoverUploadBar
              sectionKey="multimedia_showcase"
              label="تصویر اختصاصی ویترین چندرسانه‌ای"
              crextioConfig={crextioConfig}
              updateCrextioConfig={updateCrextioConfig}
              triggerSuccess={triggerSuccess}
            />
          </div>
        </div>
      </div>
    );
  }

  return null;
};
