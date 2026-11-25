import React, { useState, useRef } from 'react';
import { Home, Sliders, RotateCcw, Eye, EyeOff, X, Upload, Loader2, Plus, Trash2 } from 'lucide-react';
import { CrextioDashboardConfig, CrextioHeroStatItem } from '../../../types';
import { DEFAULT_CREXTIO_CONFIG } from '../../../data/mockData';
import { toPersianNumbers } from '../../../utils/persianNumbers';
import { api } from '../../../services/apiClient';
import { resolveShowcaseImageUrl } from '../../../data/showcaseImages';

interface CustomizerHeroStatsTabProps {
  activeTab: 'hero' | 'stats';
  crextioConfig: CrextioDashboardConfig;
  updateCrextioConfig: (updates: Partial<CrextioDashboardConfig>) => void;
  triggerSuccess: () => void;
  handleToggle: (key: keyof CrextioDashboardConfig) => void;
  currentHeroStats: CrextioHeroStatItem[];
  handleAddHeroStat: () => void;
  handleHeroStatUpdate: (stats: CrextioHeroStatItem[]) => void;
  handleToggleStatVisibility: (id: string) => void;
  handleDeleteHeroStat: (id: string) => void;
  handleStatFieldChange: (id: string, field: 'label' | 'val' | 'trend', value: any) => void;
  defaultHeroStats: CrextioHeroStatItem[];
}

export const CustomizerHeroStatsTab: React.FC<CustomizerHeroStatsTabProps> = ({
  activeTab,
  crextioConfig,
  updateCrextioConfig,
  triggerSuccess,
  handleToggle,
  currentHeroStats,
  handleAddHeroStat,
  handleHeroStatUpdate,
  handleToggleStatVisibility,
  handleDeleteHeroStat,
  handleStatFieldChange,
  defaultHeroStats,
}) => {
  const [uploadingPortrait, setUploadingPortrait] = useState(false);
  const portraitInputRef = useRef<HTMLInputElement>(null);

  const handlePortraitUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPortrait(true);
    try {
      const res = await api.uploadFile(file, 'misc');
      if (res?.url) {
        updateCrextioConfig({
          showcaseImageOverrides: {
            ...(crextioConfig.showcaseImageOverrides || {}),
            hero_portrait: res.url,
          },
        });
        triggerSuccess();
      }
    } catch (err: any) {
      window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: `خطا در آپلود تصویر: ${err.message || 'خطای سرور'}`, type: 'error' } }));
    } finally {
      setUploadingPortrait(false);
      if (portraitInputRef.current) portraitInputRef.current.value = '';
    }
  };

  if (activeTab === 'hero') {
    const portraitUrl = resolveShowcaseImageUrl('hero_portrait', crextioConfig.showcaseImageOverrides);
    const quickButtons =
      crextioConfig.heroQuickButtons && crextioConfig.heroQuickButtons.length > 0
        ? crextioConfig.heroQuickButtons
        : DEFAULT_CREXTIO_CONFIG.heroQuickButtons || [];

    return (
      <div className="space-y-5">
        <input
          ref={portraitInputRef}
          type="file"
          accept="image/*"
          onChange={handlePortraitUpload}
          className="hidden"
        />

        <div className="p-5 rounded-3xl bg-amber-50/80 border border-amber-200 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center font-bold">
                <Home className="w-5 h-5 text-amber-800" />
              </span>
              <div>
                <h4 className="font-extrabold text-sm text-amber-950">
                  تنظیمات سایز، تصویر، آمار/دسترسی سریع و محتوای بنر خوش‌آمدگویی (Hero)
                </h4>
                <p className="text-[11px] text-amber-800/80 mt-0.5">
                  تنظیم سایز بنر، آپلود تصویر پرتره، انتخاب نمایش آمار یا دسترسی‌های سریع و ویرایش تمامی متون
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleToggle('showHeroBanner')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                crextioConfig.showHeroBanner !== false
                  ? 'bg-amber-800 text-white'
                  : 'bg-stone-300 text-stone-700'
              }`}
            >
              {crextioConfig.showHeroBanner !== false ? 'نمایش هیرو: فعال' : 'نمایش هیرو: مخفی'}
            </button>
          </div>

          {/* Hero Size & Portrait Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-white border border-amber-200">
            <div>
              <label className="font-bold text-stone-800 block mb-1.5 text-xs">
                سایز و ارتفاع بنر خوش‌آمدگویی (مشترک در تم ۲ و تم ۳):
              </label>
              <select
                value={crextioConfig.heroBannerScale || 'normal'}
                onChange={e => {
                  const val = e.target.value as 'micro' | 'compact' | 'normal' | 'expanded';
                  updateCrextioConfig({
                    heroBannerScale: val,
                  });
                  triggerSuccess();
                }}
                className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-xs font-black text-stone-900"
              >
                <option value="micro">خیلی کوچک / نوار فشرده (Micro)</option>
                <option value="compact">کوچک و جمع‌وجور (Compact)</option>
                <option value="normal">استاندارد (Normal)</option>
                <option value="expanded">بزرگ و شاخص (Expanded)</option>
              </select>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                {portraitUrl && (
                  <img
                    src={portraitUrl}
                    alt="تصویر بنر خوش‌آمد"
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-xl object-cover object-top border border-amber-300 shrink-0"
                  />
                )}
                <div className="min-w-0">
                  <div className="text-xs font-black text-stone-800 truncate">تصویر کنار بنر خوش‌آمد</div>
                  <div className="text-[10px] text-stone-500">آپلود روی سرور</div>
                </div>
              </div>

              <button
                type="button"
                disabled={uploadingPortrait}
                onClick={() => portraitInputRef.current?.click()}
                className="px-3 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50"
              >
                {uploadingPortrait ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                <span>آپلود تصویر</span>
              </button>
            </div>
          </div>

          {/* Right Slot Mode (Stats vs Quick Actions) */}
          <div className="p-3.5 rounded-2xl bg-white border border-amber-200 space-y-2">
            <label className="font-black text-stone-800 block text-xs">
              نوع محتوای سمت مقابل بنر در تم ۲ (آمار زنده یا دسترسی‌های سریع):
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'both', label: 'هر دو (آمار + دسترسی)' },
                { id: 'quick_actions', label: 'فقط دسترسی‌های سریع' },
                { id: 'stats', label: 'فقط آمار زنده' },
                { id: 'none', label: 'هیچ‌کدام' },
              ].map(opt => (
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
                    updateCrextioConfig(patch);
                    triggerSuccess();
                  }}
                  className={`p-2 rounded-xl border text-[11px] font-bold cursor-pointer ${
                    (crextioConfig.heroRightSlotMode || 'both') === opt.id
                      ? 'bg-emerald-800 text-white border-emerald-800'
                      : 'bg-stone-50 text-stone-700 border-stone-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Buttons Manager */}
          <div className="p-3.5 rounded-2xl bg-white border border-amber-200 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-black text-stone-800 text-xs">دکمه‌های دسترسی سریع بالای صفحه (تم ۲):</span>
              <button
                type="button"
                onClick={() => {
                  updateCrextioConfig({
                    heroQuickButtons: [
                      ...quickButtons,
                      { id: `hqb_${Date.now()}`, label: 'دکمه جدید', targetNav: 'People', visible: true },
                    ],
                  });
                  triggerSuccess();
                }}
                className="px-2.5 py-1 rounded-lg bg-stone-900 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>افزودن دکمه</span>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {quickButtons.map((qb, i) => (
                <div key={qb.id} className="p-2 rounded-xl bg-stone-50 border border-stone-200 flex items-center gap-1.5">
                  <input
                    type="text"
                    value={qb.label}
                    onChange={e => {
                      const next = quickButtons.map((b, idx) => (idx === i ? { ...b, label: e.target.value } : b));
                      updateCrextioConfig({ heroQuickButtons: next });
                      triggerSuccess();
                    }}
                    className="flex-1 px-2 py-1 rounded-lg bg-white border border-stone-300 text-xs font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const next = quickButtons.map((b, idx) => (idx === i ? { ...b, visible: !b.visible } : b));
                      updateCrextioConfig({ heroQuickButtons: next });
                      triggerSuccess();
                    }}
                    className={`p-1.5 rounded-lg cursor-pointer ${qb.visible ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-500'}`}
                  >
                    {qb.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const next = quickButtons.filter((_, idx) => idx !== i);
                      updateCrextioConfig({ heroQuickButtons: next });
                      triggerSuccess();
                    }}
                    className="p-1.5 rounded-lg bg-rose-50 text-rose-700 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-stone-700 block mb-1 text-xs">عنوان برند در نوار بالا:</label>
                <input
                  type="text"
                  value={crextioConfig.brandMainTitle || ''}
                  onChange={e => {
                    updateCrextioConfig({ brandMainTitle: e.target.value });
                    triggerSuccess();
                  }}
                  placeholder="سامانه فقه و قضا"
                  className="w-full px-3.5 py-2 rounded-2xl bg-white border border-stone-200 text-xs font-bold text-stone-900"
                />
              </div>
              <div>
                <label className="font-bold text-stone-700 block mb-1 text-xs">برچسب بالای کارت پرتره:</label>
                <input
                  type="text"
                  value={crextioConfig.heroPortraitBadgeText || ''}
                  onChange={e => {
                    updateCrextioConfig({ heroPortraitBadgeText: e.target.value });
                    triggerSuccess();
                  }}
                  placeholder="عضو رسمی مجمع"
                  className="w-full px-3.5 py-2 rounded-2xl bg-white border border-stone-200 text-xs font-bold text-stone-900"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1 text-xs">نشان بالای هیرو (Badge):</label>
              <input
                type="text"
                value={crextioConfig.heroBadgeText || ''}
                onChange={e => {
                  updateCrextioConfig({ heroBadgeText: e.target.value });
                  triggerSuccess();
                }}
                placeholder="میزان · پرتال و ویترین خدمات نخبگان"
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-stone-200 text-xs font-bold text-stone-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-stone-700 block mb-1 text-xs">پیشوند خوش‌آمدگویی:</label>
                <input
                  type="text"
                  value={crextioConfig.heroGreetingPrefix ?? 'خوش آمدید'}
                  onChange={e => {
                    updateCrextioConfig({ heroGreetingPrefix: e.target.value });
                    triggerSuccess();
                  }}
                  placeholder="خوش آمدید"
                  className="w-full px-4 py-2.5 rounded-2xl bg-white border border-stone-200 text-xs font-bold text-stone-900"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1 text-xs">
                  عنوان اصلی هیرو (از {'{name}'} برای نام کاربر استفاده کنید):
                </label>
                <input
                  type="text"
                  value={crextioConfig.heroTitle || 'خوش آمدید، {name}'}
                  onChange={e => {
                    updateCrextioConfig({ heroTitle: e.target.value });
                    triggerSuccess();
                  }}
                  placeholder="خوش آمدید، {name}"
                  className="w-full px-4 py-2.5 rounded-2xl bg-white border border-stone-200 text-xs font-black text-stone-900"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1 text-xs">زیرعنوان و متن خوش‌آمدگویی:</label>
              <input
                type="text"
                value={crextioConfig.heroSubtitle || ''}
                onChange={e => {
                  updateCrextioConfig({ heroSubtitle: e.target.value });
                  triggerSuccess();
                }}
                placeholder="دسترسی سریع به کارتابل اداری، گالری دوره‌های آموزشی..."
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-stone-200 text-xs text-stone-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              <label className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-stone-200 cursor-pointer hover:bg-amber-100/50 transition-colors">
                <span className="text-xs font-bold text-stone-800">نمایش تصویر بنر</span>
                <input
                  type="checkbox"
                  checked={crextioConfig.showHeroPortrait !== false}
                  onChange={() => {
                    updateCrextioConfig({ showHeroPortrait: crextioConfig.showHeroPortrait === false });
                    triggerSuccess();
                  }}
                  className="w-4 h-4 accent-amber-800 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-stone-200 cursor-pointer hover:bg-amber-100/50 transition-colors">
                <span className="text-xs font-bold text-stone-800">کارت پروفایل کاربر</span>
                <input
                  type="checkbox"
                  checked={crextioConfig.showProfileCard !== false}
                  onChange={() => handleToggle('showProfileCard')}
                  className="w-4 h-4 accent-amber-800 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-stone-200 cursor-pointer hover:bg-amber-100/50 transition-colors">
                <span className="text-xs font-bold text-stone-800">آمار و شاخص‌های هیرو</span>
                <input
                  type="checkbox"
                  checked={crextioConfig.showHeroStats !== false}
                  onChange={() => {
                    const nextStats = crextioConfig.showHeroStats === false;
                    const curQuick = crextioConfig.showQuickActions !== false;
                    const nextMode = nextStats && curQuick ? 'both' : nextStats ? 'stats' : curQuick ? 'quick_actions' : 'none';
                    updateCrextioConfig({ showHeroStats: nextStats, showKpiRow: nextStats, heroRightSlotMode: nextMode });
                    triggerSuccess();
                  }}
                  className="w-4 h-4 accent-amber-800 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-stone-200 cursor-pointer hover:bg-amber-100/50 transition-colors">
                <span className="text-xs font-bold text-stone-800">کلیدهای دسترسی سریع</span>
                <input
                  type="checkbox"
                  checked={crextioConfig.showQuickActions !== false}
                  onChange={() => {
                    const nextQuick = crextioConfig.showQuickActions === false;
                    const curStats = crextioConfig.showHeroStats !== false;
                    const nextMode = curStats && nextQuick ? 'both' : nextQuick ? 'quick_actions' : curStats ? 'stats' : 'none';
                    updateCrextioConfig({ showQuickActions: nextQuick, heroRightSlotMode: nextMode });
                    triggerSuccess();
                  }}
                  className="w-4 h-4 accent-amber-800 rounded cursor-pointer"
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'stats') {
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-3xl bg-amber-50/80 border border-amber-200 flex items-center justify-between">
          <div>
            <h4 className="font-extrabold text-sm text-amber-950 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-800" />
              مدیریت آمار و شاخص‌های بنر دانش‌آموختگان (VIP Hero Stats)
            </h4>
            <p className="text-[11px] text-amber-900/80 mt-0.5">
              تعیین عناوین، ارقام (شمارش از ۰ تا عدد نهایی)، روندهای رشد و مدیریت نمایش یا حذف هر شاخص
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddHeroStat}
              className="px-3 py-1.5 rounded-full bg-amber-700 hover:bg-amber-800 text-white font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>+ افزودن شاخص</span>
            </button>
            <button
              type="button"
              onClick={() => {
                handleHeroStatUpdate(defaultHeroStats);
              }}
              className="px-3 py-1.5 rounded-full border border-amber-300 hover:bg-amber-100 text-amber-900 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>پیش‌فرض</span>
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {currentHeroStats.map((stat, idx) => {
            const isVisible = stat.isVisible !== false;

            return (
              <div
                key={stat.id}
                className={`p-4 rounded-3xl border transition-all ${
                  isVisible
                    ? 'bg-stone-50 border-stone-200'
                    : 'bg-stone-100 border-dashed border-stone-300 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-white border border-stone-200 flex items-center justify-center text-xs font-black text-stone-700">
                      {toPersianNumbers(idx + 1)}
                    </span>
                    <span className="font-extrabold text-stone-900 text-xs sm:text-sm">
                      {stat.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleToggleStatVisibility(stat.id)}
                      className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                        isVisible
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-stone-200 text-stone-600 border-stone-300'
                      }`}
                      title={isVisible ? 'مخفی کردن' : 'نمایش مجدد'}
                    >
                      {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteHeroStat(stat.id)}
                      className="p-1.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      title="حذف شاخص"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-stone-700 block mb-1">
                      عنوان شاخص:
                    </label>
                    <input
                      type="text"
                      value={stat.label}
                      onChange={e => handleStatFieldChange(stat.id, 'label', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-white border border-stone-200 text-xs font-bold text-stone-900 focus:outline-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-stone-700 block mb-1">
                      مقدار عددی هدف (شمارش از صفر):
                    </label>
                    <input
                      type="number"
                      value={stat.val}
                      onChange={e =>
                        handleStatFieldChange(stat.id, 'val', parseInt(e.target.value) || 0)
                      }
                      className="w-full px-3 py-1.5 rounded-xl bg-white border border-stone-200 text-xs font-black text-stone-900 focus:outline-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-stone-700 block mb-1">
                      برچسب روند/رشد:
                    </label>
                    <input
                      type="text"
                      value={stat.trend}
                      onChange={e => handleStatFieldChange(stat.id, 'trend', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-white border border-stone-200 text-xs font-bold text-emerald-800 focus:outline-emerald-600"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
};
