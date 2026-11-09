import React from 'react';
import { Home, Sliders, RotateCcw, Eye, EyeOff, X } from 'lucide-react';
import { CrextioDashboardConfig, CrextioHeroStatItem } from '../../../types';
import { toPersianNumbers } from '../../../utils/persianNumbers';

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
  if (activeTab === 'hero') {
    return (
      <div className="space-y-5">
        <div className="p-5 rounded-3xl bg-amber-50/80 border border-amber-200 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center font-bold">
                <Home className="w-5 h-5 text-amber-800" />
              </span>
              <div>
                <h4 className="font-extrabold text-sm text-amber-950">
                  تنظیمات و محتوای ۱۰۰٪ بنر هیرو و خوش‌آمدگویی
                </h4>
                <p className="text-[11px] text-amber-800/80 mt-0.5">
                  ویرایش کامل تیتر خوش‌آمد، زیرعنوان، نشان هیرو، و سوئیچ نمایش کارت پروفایل و آمار
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

          <div className="space-y-3 pt-2">
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

            <div>
              <label className="font-bold text-stone-700 block mb-1 text-xs">عنوان اصلی هیرو:</label>
              <input
                type="text"
                value={crextioConfig.heroTitle || ''}
                onChange={e => {
                  updateCrextioConfig({ heroTitle: e.target.value });
                  triggerSuccess();
                }}
                placeholder="سامانه و ویترین خدمات دانش‌آموختگان فقه و قضا"
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-stone-200 text-xs font-black text-stone-900"
              />
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
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
                  onChange={() => handleToggle('showHeroStats')}
                  className="w-4 h-4 accent-amber-800 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-stone-200 cursor-pointer hover:bg-amber-100/50 transition-colors">
                <span className="text-xs font-bold text-stone-800">کلیدهای دسترسی سریع</span>
                <input
                  type="checkbox"
                  checked={crextioConfig.showQuickActions !== false}
                  onChange={() => handleToggle('showQuickActions')}
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
