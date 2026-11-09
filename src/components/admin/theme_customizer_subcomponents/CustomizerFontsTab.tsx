import React from 'react';
import { Edit3, Scale, Sparkles, Award, Sliders } from 'lucide-react';
import { CrextioDashboardConfig } from '../../../types';

interface CustomizerFontsTabProps {
  crextioConfig: CrextioDashboardConfig;
  updateCrextioConfig: (updates: Partial<CrextioDashboardConfig>) => void;
  triggerSuccess: () => void;
}

export const CustomizerFontsTab: React.FC<CustomizerFontsTabProps> = ({
  crextioConfig,
  updateCrextioConfig,
  triggerSuccess,
}) => {
  return (
    <div className="space-y-5">
      <div className="p-5 rounded-3xl bg-teal-50/80 border border-teal-200 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-teal-200 text-teal-900 flex items-center justify-center font-bold">
              <Edit3 className="w-5 h-5 text-teal-800" />
            </span>
            <div>
              <h4 className="font-extrabold text-sm text-teal-950">
                تنظیمات تفکیکی سایز فونت متون در تمامی ویترین‌های داشبورد
              </h4>
              <p className="text-[11px] text-teal-800/80 mt-0.5">
                امکان تنظیم مجزای اندازه تیترها، زیرعنوان‌ها، متن‌های بدنه و برچسب‌های کارت‌ها
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* 1. Rulings Showcase Fonts */}
          <div className="p-4 rounded-2xl bg-white border border-stone-200 space-y-3">
            <h5 className="font-black text-xs text-stone-900 flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-amber-700" />
              <span>ویترین تالار آراء قضایی</span>
            </h5>

            <div>
              <label className="text-[11px] font-bold text-stone-600 block mb-1">اندازه تیتر اصلی ویترین آراء:</label>
              <select
                value={crextioConfig.fontSizes?.rulingsTitle || 'text-lg'}
                onChange={e => {
                  updateCrextioConfig({
                    fontSizes: {
                      ...crextioConfig.fontSizes,
                      rulingsTitle: e.target.value as any
                    }
                  });
                  triggerSuccess();
                }}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-bold text-stone-900"
              >
                <option value="text-sm">کوچک (14px)</option>
                <option value="text-base">متوسط استاندارد (16px)</option>
                <option value="text-lg">بزرگ (18px - پیش‌فرض)</option>
                <option value="text-xl">خیلی بزرگ (20px)</option>
                <option value="text-2xl">برجسته ویژه (24px)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-stone-600 block mb-1">اندازه متن بدنه و چکیده‌ها:</label>
              <select
                value={crextioConfig.fontSizes?.rulingsBody || 'text-xs'}
                onChange={e => {
                  updateCrextioConfig({
                    fontSizes: {
                      ...crextioConfig.fontSizes,
                      rulingsBody: e.target.value as any
                    }
                  });
                  triggerSuccess();
                }}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-bold text-stone-900"
              >
                <option value="text-[10px]">بسیار ریز (10px)</option>
                <option value="text-[11px]">ریز بهینه (11px)</option>
                <option value="text-xs">استاندارد (12px - پیش‌فرض)</option>
                <option value="text-sm">خوانا و درشت (14px)</option>
              </select>
            </div>
          </div>

          {/* 2. Research Promo Showcase Fonts */}
          <div className="p-4 rounded-2xl bg-white border border-stone-200 space-y-3">
            <h5 className="font-black text-xs text-stone-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-700" />
              <span>ویترین ترغیبی راهبری پژوهش</span>
            </h5>

            <div>
              <label className="text-[11px] font-bold text-stone-600 block mb-1">اندازه عنوان جذاب پژوهش:</label>
              <select
                value={crextioConfig.fontSizes?.researchTitle || 'text-2xl'}
                onChange={e => {
                  updateCrextioConfig({
                    fontSizes: {
                      ...crextioConfig.fontSizes,
                      researchTitle: e.target.value as any
                    }
                  });
                  triggerSuccess();
                }}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-bold text-stone-900"
              >
                <option value="text-base">متوسط (16px)</option>
                <option value="text-lg">بزرگ (18px)</option>
                <option value="text-xl">خیلی بزرگ (20px)</option>
                <option value="text-2xl">بسیار درشت (24px - پیش‌فرض)</option>
                <option value="text-3xl">حداکثر برجستگی (30px)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-stone-600 block mb-1">اندازه زیرعنوان و کارت‌ها:</label>
              <select
                value={crextioConfig.fontSizes?.researchBody || 'text-xs'}
                onChange={e => {
                  updateCrextioConfig({
                    fontSizes: {
                      ...crextioConfig.fontSizes,
                      researchBody: e.target.value as any
                    }
                  });
                  triggerSuccess();
                }}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-bold text-stone-900"
              >
                <option value="text-[10px]">بسیار ریز (10px)</option>
                <option value="text-[11px]">ریز بهینه (11px)</option>
                <option value="text-xs">استاندارد (12px - پیش‌فرض)</option>
                <option value="text-sm">خوانا و درشت (14px)</option>
              </select>
            </div>
          </div>

          {/* 3. Hero VIP Banner Fonts */}
          <div className="p-4 rounded-2xl bg-white border border-stone-200 space-y-3">
            <h5 className="font-black text-xs text-stone-900 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-teal-700" />
              <span>بنر وی‌آی‌پی خوش‌آمدگویی هدر</span>
            </h5>

            <div>
              <label className="text-[11px] font-bold text-stone-600 block mb-1">سایز تیتر خوش‌آمدگویی:</label>
              <select
                value={crextioConfig.fontSizes?.heroTitle || 'text-2xl'}
                onChange={e => {
                  updateCrextioConfig({
                    fontSizes: {
                      ...crextioConfig.fontSizes,
                      heroTitle: e.target.value as any
                    }
                  });
                  triggerSuccess();
                }}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-bold text-stone-900"
              >
                <option value="text-lg">متوسط (18px)</option>
                <option value="text-xl">بزرگ (20px)</option>
                <option value="text-2xl">بسیار درشت (24px - پیش‌فرض)</option>
                <option value="text-3xl">عظیم (30px)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-stone-600 block mb-1">سایز متن سمت و سازمان:</label>
              <select
                value={crextioConfig.fontSizes?.heroSubtitle || 'text-xs'}
                onChange={e => {
                  updateCrextioConfig({
                    fontSizes: {
                      ...crextioConfig.fontSizes,
                      heroSubtitle: e.target.value as any
                    }
                  });
                  triggerSuccess();
                }}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-bold text-stone-900"
              >
                <option value="text-[10px]">بسیار ریز (10px)</option>
                <option value="text-[11px]">ریز (11px)</option>
                <option value="text-xs">استاندارد (12px - پیش‌فرض)</option>
                <option value="text-sm">درشت (14px)</option>
              </select>
            </div>
          </div>

          {/* 4. Bento Grid Cards Fonts */}
          <div className="p-4 rounded-2xl bg-white border border-stone-200 space-y-3">
            <h5 className="font-black text-xs text-stone-900 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-emerald-700" />
              <span>کارت‌های شبکه ۹‌گانه (Bento Grid)</span>
            </h5>

            <div>
              <label className="text-[11px] font-bold text-stone-600 block mb-1">سایز عناوین کارت‌های خدمات:</label>
              <select
                value={crextioConfig.fontSizes?.cardTitles || 'text-sm'}
                onChange={e => {
                  updateCrextioConfig({
                    fontSizes: {
                      ...crextioConfig.fontSizes,
                      cardTitles: e.target.value as any
                    }
                  });
                  triggerSuccess();
                }}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-bold text-stone-900"
              >
                <option value="text-xs">ریز (12px)</option>
                <option value="text-sm">استاندارد (14px - پیش‌فرض)</option>
                <option value="text-base">بزرگ (16px)</option>
                <option value="text-lg">خیلی بزرگ (18px)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-stone-600 block mb-1">سایز زیرعناوین و زیرخدمات:</label>
              <select
                value={crextioConfig.fontSizes?.cardSubtitles || 'text-[11px]'}
                onChange={e => {
                  updateCrextioConfig({
                    fontSizes: {
                      ...crextioConfig.fontSizes,
                      cardSubtitles: e.target.value as any
                    }
                  });
                  triggerSuccess();
                }}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-bold text-stone-900"
              >
                <option value="text-[10px]">بسیار ریز (10px)</option>
                <option value="text-[11px]">ریز بهینه (11px - پیش‌فرض)</option>
                <option value="text-xs">استاندارد (12px)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
