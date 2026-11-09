import React from 'react';
import { GraduationCap, BookOpen, Palette, Award } from 'lucide-react';
import { CrextioDashboardConfig } from '../../../types';
import { CustomizerTab } from '../ThemeCustomizerModal';

interface CustomizerStylingModesTabProps {
  activeTab: CustomizerTab;
  crextioConfig: CrextioDashboardConfig;
  updateCrextioConfig: (updates: Partial<CrextioDashboardConfig>) => void;
  triggerSuccess: () => void;
  handleToggle: (key: keyof CrextioDashboardConfig) => void;
}

export const CustomizerStylingModesTab: React.FC<CustomizerStylingModesTabProps> = ({
  activeTab,
  crextioConfig,
  updateCrextioConfig,
  triggerSuccess,
  handleToggle,
}) => {
  if (activeTab === 'modes') {
    return (
      <div className="space-y-6">
        {/* Course Showcase Mode */}
        <div className="p-5 rounded-3xl bg-[#F5F4EE] border border-stone-200 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-sm text-stone-900 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-emerald-800" />
              نحوه نمایش دوره‌های آموزشی (Course Showcase Layout)
            </h4>
            <span className="text-stone-500 text-[11px]">ویترین دوره‌های علمی</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { mode: 'carousel' as const, title: 'چرخشی خودکار (Slider)', desc: 'اسلایدر هوشمند متحرک تمام‌عرض با فلش و نقطه' },
              { mode: 'grid' as const, title: 'شبکه کارتی (۳ تایی)', desc: 'نمایش همزمان تمام دوره‌های برگزیده کنار یکدیگر' },
              { mode: 'compact' as const, title: 'فشرده و مینی‌مال (Compact)', desc: 'ارتفاع کمتر برای تمرکز بر اطلاعات پرونده‌ها' }
            ].map(opt => (
              <button
                key={opt.mode}
                type="button"
                onClick={() => {
                  updateCrextioConfig({ courseShowcaseMode: opt.mode });
                  triggerSuccess();
                }}
                className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer ${
                  crextioConfig.courseShowcaseMode === opt.mode
                    ? 'bg-emerald-800 text-white border-emerald-900 shadow-md font-bold'
                    : 'bg-white hover:bg-stone-100 border-stone-200 text-stone-800'
                }`}
              >
                <p className="font-extrabold text-xs">{opt.title}</p>
                <p className={`text-[10px] mt-1 ${crextioConfig.courseShowcaseMode === opt.mode ? 'text-emerald-100' : 'text-stone-500'}`}>
                  {opt.desc}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Publications Mode */}
        <div className="p-5 rounded-3xl bg-[#F5F4EE] border border-stone-200 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-sm text-stone-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-800" />
              سبک نمایش ویترین انتشارات (Publications View)
            </h4>
            <span className="text-stone-500 text-[11px]">موسوعه‌ها و کتب تخصصی</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { mode: 'cards' as const, title: 'کارت‌های تصویری دو ستونه', desc: 'طراحی ویژه کتاب با آیکون نفیس و قیمت به تومان' },
              { mode: 'list' as const, title: 'لیست سطری فشرده', desc: 'نمایش نواری سریع برای کتابخانه‌های پرحجم' }
            ].map(opt => (
              <button
                key={opt.mode}
                type="button"
                onClick={() => {
                  updateCrextioConfig({ publicationsMode: opt.mode });
                  triggerSuccess();
                }}
                className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer ${
                  crextioConfig.publicationsMode === opt.mode
                    ? 'bg-emerald-800 text-white border-emerald-900 shadow-md font-bold'
                    : 'bg-white hover:bg-stone-100 border-stone-200 text-stone-800'
                }`}
              >
                <p className="font-extrabold text-xs">{opt.title}</p>
                <p className={`text-[10px] mt-1 ${crextioConfig.publicationsMode === opt.mode ? 'text-emerald-100' : 'text-stone-500'}`}>
                  {opt.desc}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'styling') {
    return (
      <div className="space-y-5">
        {/* Canvas Theme Selector */}
        <div className="p-5 rounded-3xl bg-[#F5F4EE] border border-stone-200 space-y-3">
          <h4 className="font-extrabold text-sm text-stone-900 flex items-center gap-2">
            <Palette className="w-4 h-4 text-emerald-800" />
            تمپلیت رنگی بوم تم دوم (Canvas Palette Tone)
          </h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { tone: 'warm_ivory' as const, title: 'عاجی گرم و کهربایی (پیش‌فرض)', bg: 'bg-[#F8F7F2]', border: 'border-[#E5E3D8]' },
              { tone: 'royal_emerald' as const, title: 'زمردی تیره سلطنتی', bg: 'bg-[#182622] text-white', border: 'border-[#2A423B]' },
              { tone: 'pure_minimal' as const, title: 'سفید مینیمال بدون حاشیه', bg: 'bg-white', border: 'border-stone-200' },
            ].map(t => (
              <button
                key={t.tone}
                type="button"
                onClick={() => {
                  updateCrextioConfig({ canvasTheme: t.tone });
                  triggerSuccess();
                }}
                className={`p-4 rounded-2xl border text-right transition-all cursor-pointer ${
                  crextioConfig.canvasTheme === t.tone
                    ? 'ring-2 ring-emerald-600 font-bold shadow-sm'
                    : 'hover:bg-white'
                }`}
              >
                <div className={`w-full h-8 rounded-xl ${t.bg} ${t.border} border mb-2 flex items-center justify-center text-[10px] font-bold`}>
                  نمونه بافت
                </div>
                <p className="font-extrabold text-xs text-stone-900">{t.title}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Editable Titles */}
        <div className="p-5 rounded-3xl bg-[#F5F4EE] border border-stone-200 space-y-3">
          <h4 className="font-extrabold text-sm text-stone-900">تیتر اختصاصی هدر داشبورد</h4>
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-stone-600">عنوان اصلی:</label>
            <input
              type="text"
              value={crextioConfig.heroTitle || ''}
              onChange={e => updateCrextioConfig({ heroTitle: e.target.value })}
              className="w-full px-4 py-2.5 rounded-2xl bg-white border border-stone-200 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-bold"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-stone-600">زیرعنوان توضیحی:</label>
            <input
              type="text"
              value={crextioConfig.heroSubtitle || ''}
              onChange={e => updateCrextioConfig({ heroSubtitle: e.target.value })}
              className="w-full px-4 py-2.5 rounded-2xl bg-white border border-stone-200 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium"
            />
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'showcase') {
    return (
      <div className="space-y-4">
        <div className="p-5 rounded-3xl bg-[#F5F4EE] border border-stone-200 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-sm text-stone-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-800" />
              مدیریت ویترین گزارش خدمات و ارقام آماری
            </h4>
            <button
              type="button"
              onClick={() => handleToggle('showShowcaseSection')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                crextioConfig.showShowcaseSection !== false
                  ? 'bg-emerald-800 text-white'
                  : 'bg-stone-300 text-stone-700'
              }`}
            >
              {crextioConfig.showShowcaseSection !== false ? 'نمایش ویترین: فعال' : 'نمایش ویترین: مخفی'}
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="font-bold text-stone-700 block mb-1">عنوان ویترین گزارش خدمات:</label>
              <input
                type="text"
                value={crextioConfig.showcaseTitle || ''}
                onChange={e => updateCrextioConfig({ showcaseTitle: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-stone-200 text-xs text-stone-900 font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">توضیحات زیرعنوان:</label>
              <input
                type="text"
                value={crextioConfig.showcaseSubtitle || ''}
                onChange={e => updateCrextioConfig({ showcaseSubtitle: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-stone-200 text-xs text-stone-900 font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="font-bold text-stone-700 block mb-1">آمار دانش‌آموختگان:</label>
                <input
                  type="text"
                  value={crextioConfig.showcaseAlumniCount || ''}
                  onChange={e => updateCrextioConfig({ showcaseAlumniCount: e.target.value })}
                  className="w-full px-4 py-2 rounded-2xl bg-white border border-stone-200 text-xs text-stone-900 font-bold"
                />
              </div>
              <div>
                <label className="font-bold text-stone-700 block mb-1">تعداد دوره‌های تخصصی:</label>
                <input
                  type="text"
                  value={crextioConfig.showcaseCoursesCount || ''}
                  onChange={e => updateCrextioConfig({ showcaseCoursesCount: e.target.value })}
                  className="w-full px-4 py-2 rounded-2xl bg-white border border-stone-200 text-xs text-stone-900 font-bold"
                />
              </div>
              <div>
                <label className="font-bold text-stone-700 block mb-1">تعداد دادنامه‌ها و آراء:</label>
                <input
                  type="text"
                  value={crextioConfig.showcaseRulingsCount || ''}
                  onChange={e => updateCrextioConfig({ showcaseRulingsCount: e.target.value })}
                  className="w-full px-4 py-2 rounded-2xl bg-white border border-stone-200 text-xs text-stone-900 font-bold"
                />
              </div>
              <div>
                <label className="font-bold text-stone-700 block mb-1">شاخص رضایت‌مندی:</label>
                <input
                  type="text"
                  value={crextioConfig.showcaseSatisfactionRate || ''}
                  onChange={e => updateCrextioConfig({ showcaseSatisfactionRate: e.target.value })}
                  className="w-full px-4 py-2 rounded-2xl bg-white border border-stone-200 text-xs text-stone-900 font-bold"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
