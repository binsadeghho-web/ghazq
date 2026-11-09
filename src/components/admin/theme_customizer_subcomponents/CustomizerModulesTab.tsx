import React from 'react';
import {
  Sliders,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Scale,
  Sparkles,
  GraduationCap,
  Inbox,
} from 'lucide-react';
import { CrextioDashboardConfig } from '../../../types';
import { toPersianNumbers } from '../../../utils/persianNumbers';

interface CustomizerModulesTabProps {
  crextioConfig: CrextioDashboardConfig;
  updateCrextioConfig: (updates: Partial<CrextioDashboardConfig>) => void;
  handleToggle: (key: keyof CrextioDashboardConfig) => void;
  triggerSuccess: () => void;
}

export const CustomizerModulesTab: React.FC<CustomizerModulesTabProps> = ({
  crextioConfig,
  updateCrextioConfig,
  handleToggle,
  triggerSuccess,
}) => {
  const defaultOrder = [
    'top_vip_row',
    'rulings_showcase',
    'research_promo',
    'course_showcase',
    'counseling_promo',
    'welfare_showcase',
    'multimedia_showcase',
    'bento_grid',
    'books_showcase'
  ];
  const sectionOrder = crextioConfig.dashboardSectionOrder && crextioConfig.dashboardSectionOrder.length > 0
    ? crextioConfig.dashboardSectionOrder
    : defaultOrder;
  const hiddenMap = crextioConfig.hiddenDashboardSections || {};

  const sectionMeta: Record<string, { title: string; desc: string }> = {
    top_vip_row: { title: 'بنر وی‌آی‌پی بالای صفحه و کارت پرتره دانش‌آموخته', desc: 'کادر خوش‌آمدگویی هوشمند و پرتره پرسنلی قاضی/دانش‌آموخته' },
    rulings_showcase: { title: 'ویترین تالار نقد و مناظره آراء قضایی (جدید)', desc: 'باکس تعاملی دادنامه‌های داغ، استدلال‌ها و ثبت مستقیم نقد و رأی' },
    research_promo: { title: 'ویترین ترغیبی و تبلیغی باشگاه راهبری پژوهش (جدید)', desc: 'جذب نخبگان به رساله‌ها با گرنت ۵۰ میلیونی، اسکان و اساتید طراز اول' },
    course_showcase: { title: 'ویترین ویژه دوره‌های علمی (اسلایدر دوره‌ها)', desc: 'اسلایدر متحرک دوره‌های توانمندسازی علمی فقه القضا' },
    counseling_promo: { title: 'ویترین خدمات مشاوره و روانشناسی نخبگان', desc: 'درگاه مشاوره تخصصی شغلی و عمومی با اسلاید ۴ ثانیه‌ای' },
    welfare_showcase: { title: 'ویترین خدمات رفاهی، تسهیلات و وام‌ها', desc: 'وام ۱۰۰ میلیونی، اسکان مشهد/قم، خدمات درمانی و اقلام تعاونی' },
    multimedia_showcase: { title: 'ویترین محصولات چندرسانه‌ای و درس‌گفتارها', desc: 'درس‌گفتارهای صوتی خارج فقه القضا و ویدیوهای آموزشی' },
    bento_grid: { title: 'ویترین جامع خدمات سامانه (Bento Grid 9 تایی)', desc: 'ماتریس کارت‌های اصلی دسترسی به ماژول‌های سامانه' },
    books_showcase: { title: 'ویترین جامع کتب، انتشارات و منشورات تخصصی', desc: 'موسوعه‌ها، کتاب‌های مرجع فقهی و حقوقی در انتهای داشبورد' }
  };

  return (
    <div className="space-y-6">
      {/* Section Re-ordering Box */}
      <div className="p-4 rounded-3xl bg-amber-50/80 border border-amber-200 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-extrabold text-sm text-amber-950 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-800" />
            مدیریت ترتیب قرارگیری و جابه‌جایی تمام ویترین‌ها و بخش‌های داشبورد
          </h4>
          <button
            type="button"
            onClick={() => {
              updateCrextioConfig({
                dashboardSectionOrder: [
                  'top_vip_row',
                  'course_showcase',
                  'counseling_promo',
                  'welfare_showcase',
                  'multimedia_showcase',
                  'bento_grid',
                  'books_showcase'
                ],
                hiddenDashboardSections: {}
              });
              triggerSuccess();
            }}
            className="px-3 py-1 rounded-full border border-amber-300 hover:bg-amber-100 text-amber-900 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>بازنشانی ترتیب پیش‌فرض</span>
          </button>
        </div>
        <p className="text-[11px] text-amber-900/80">
          با استفاده از دکمه‌های بالا و پایین، موقعیت قرارگیری هر ویترین یا بخش را در داشبورد تغییر دهید یا هر ویترین را کاملاً مخفی نمایید:
        </p>

        <div className="space-y-2 pt-1">
          {sectionOrder.map((key, idx) => {
            const isHidden = hiddenMap[key] === true;
            const meta = sectionMeta[key] || { title: key, desc: 'بخش داشبورد' };

            return (
              <div
                key={key}
                className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                  !isHidden ? 'bg-white border-stone-200' : 'bg-stone-100 border-dashed border-stone-300 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center font-black text-xs shrink-0">
                    {toPersianNumbers(idx + 1)}
                  </span>
                  <div className="min-w-0">
                    <h5 className="font-extrabold text-stone-900 text-xs truncate">{meta.title}</h5>
                    <p className="text-[10px] text-stone-500 truncate">{meta.desc}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => {
                      const newOrder = [...sectionOrder];
                      const temp = newOrder[idx - 1];
                      newOrder[idx - 1] = newOrder[idx];
                      newOrder[idx] = temp;
                      updateCrextioConfig({ dashboardSectionOrder: newOrder });
                      triggerSuccess();
                    }}
                    title="انتقال به بالاتر"
                    className="w-7 h-7 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-200 disabled:opacity-20 flex items-center justify-center text-stone-700 cursor-pointer"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    disabled={idx === sectionOrder.length - 1}
                    onClick={() => {
                      const newOrder = [...sectionOrder];
                      const temp = newOrder[idx + 1];
                      newOrder[idx + 1] = newOrder[idx];
                      newOrder[idx] = temp;
                      updateCrextioConfig({ dashboardSectionOrder: newOrder });
                      triggerSuccess();
                    }}
                    title="انتقال به پایین‌تر"
                    className="w-7 h-7 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-200 disabled:opacity-20 flex items-center justify-center text-stone-700 cursor-pointer"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const updatedHidden = { ...hiddenMap, [key]: !isHidden };
                      updateCrextioConfig({ hiddenDashboardSections: updatedHidden });
                      triggerSuccess();
                    }}
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border flex items-center gap-1 cursor-pointer transition-colors ${
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
      </div>

      {/* Sub-module Toggles */}
      <div className="space-y-3">
        <h4 className="font-extrabold text-xs text-stone-900">تنظیمات ریزماژول‌های داخل بنر و کادرها:</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {[
            { key: 'showRulingsShowcase' as const, title: 'ویترین تالار نقد و مناظره آراء قضایی', desc: 'نمایش دادنامه‌های جنجالی و داغ و امکان ثبت نقد مستقیم', icon: Scale },
            { key: 'showResearchPromoShowcase' as const, title: 'ویترین ترغیبی باشگاه راهبری رساله‌ها', desc: 'بنر مجلل ترغیب نخبگان با گرنت، اسکان و اساتید طراز اول', icon: Sparkles },
            { key: 'showHeroBanner' as const, title: 'بنر متحرک بالای صفحه (Hero Banner)', desc: 'باکس خوش‌آمدگویی هوشمند همراه با امواج نوری زنده', icon: Sparkles },
            { key: 'showKpiRow' as const, title: 'کارت‌های آمار زنده (KPI Counter)', desc: 'شمارنده‌های پرونده‌ها، اعضا، آراء و کتب', icon: Sliders },
            { key: 'showCourseShowcase' as const, title: 'ویترین اختصاصی دوره‌ها (Course Showcase)', desc: 'اسلایدر متحرک یا گالری دوره‌های علمی فقه القضا', icon: GraduationCap },
            { key: 'showCartableSnippet' as const, title: 'کارتابل درخواست‌های اداری من', desc: 'لیست سریع آخرین پرونده‌ها و استعلام‌های ثبت‌شده', icon: Inbox },
            { key: 'showProfileCard' as const, title: 'کارت پرونده و پرتره قاضی/دانش‌آموخته', desc: 'نمایش عکس پرسنلی، سطح و اطلاعات قضایی کاربر', icon: Eye }
          ].map(item => {
            const isEnabled = crextioConfig[item.key];
            const Icon = item.icon;
            return (
              <div
                key={item.key}
                onClick={() => handleToggle(item.key)}
                className={`p-3.5 rounded-3xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                  isEnabled
                    ? 'bg-emerald-50/70 border-emerald-300 shadow-2xs'
                    : 'bg-stone-50 border-stone-200 opacity-60 hover:opacity-100'
                }`}
              >
                <div className={`p-2 rounded-2xl shrink-0 ${
                  isEnabled ? 'bg-emerald-800 text-white' : 'bg-stone-200 text-stone-600'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-stone-900">{item.title}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isEnabled ? 'bg-emerald-700 text-white' : 'bg-stone-300 text-stone-700'
                    }`}>
                      {isEnabled ? 'فعال' : 'مخفی'}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 leading-normal">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
