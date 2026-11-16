import React, { useState } from 'react';
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
  GripVertical,
  Columns2,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { CrextioDashboardConfig } from '../../../types';
import { toPersianNumbers } from '../../../utils/persianNumbers';
import { CANONICAL_DASHBOARD_SECTION_ORDER } from '../../../context/ThemeContext';

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
  const sectionOrder =
    crextioConfig.dashboardSectionOrder && crextioConfig.dashboardSectionOrder.length > 0
      ? crextioConfig.dashboardSectionOrder
      : CANONICAL_DASHBOARD_SECTION_ORDER;
  const hiddenMap = crextioConfig.hiddenDashboardSections || {};
  const layoutsMap = crextioConfig.dashboardSectionLayouts || {};

  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const sectionMeta: Record<string, { title: string; desc: string }> = {
    top_vip_row: { title: 'بنر خوش‌آمدگویی بالای صفحه و پرتره', desc: 'کادر خوش‌آمدگویی هوشمند و آمار کلیدی' },
    rulings_showcase: { title: 'ویترین تالار نقد و مناظره آراء قضایی', desc: 'باکس دادنامه‌ها، استدلال‌ها و ثبت نقد و رأی' },
    research_promo: { title: 'ویترین باشگاه راهبری پژوهش و رساله‌ها', desc: 'حمایت علمی، استاد راهنما و اسکان پژوهشی' },
    course_showcase: { title: 'ویترین دوره‌های علمی و کارگاه‌ها', desc: 'معرفی دوره‌های توانمندسازی علمی فقه القضا' },
    counseling_promo: { title: 'ویترین خدمات مشاوره نخبگان', desc: 'درگاه مشاوره تخصصی شغلی و عمومی' },
    welfare_showcase: { title: 'ویترین خدمات رفاهی و تسهیلات', desc: 'وام قرض‌الحسنه، اسکان مشهد/قم و تعاونی' },
    multimedia_showcase: { title: 'ویترین درس‌گفتارها و چندرسانه‌ای', desc: 'درس‌گفتارهای صوتی خارج فقه القضا' },
    bento_grid: { title: 'شبکه جامع دسترسی سریع خدمات (Bento)', desc: 'کارت‌های اصلی دسترسی به ماژول‌های سامانه' },
    books_showcase: { title: 'ویترین کتب و منشورات تخصصی', desc: 'موسوعه‌ها و کتب مرجع فقهی و حقوقی' },
  };

  const handleUpdateSectionLayout = (
    key: string,
    patch: Partial<{ span: 'full' | 'half'; density: 'full' | 'minimal' }>
  ) => {
    const current = layoutsMap[key] || { span: 'full', density: 'full' };
    updateCrextioConfig({
      dashboardSectionLayouts: {
        ...layoutsMap,
        [key]: { ...current, ...patch },
      },
    });
    triggerSuccess();
  };

  const handleDropReorder = (targetIdx: number) => {
    if (draggedIdx === null || draggedIdx === targetIdx) {
      setDraggedIdx(null);
      setDragOverIdx(null);
      return;
    }
    const nextOrder = [...sectionOrder];
    const [moved] = nextOrder.splice(draggedIdx, 1);
    nextOrder.splice(targetIdx, 0, moved);
    updateCrextioConfig({ dashboardSectionOrder: nextOrder });
    triggerSuccess();
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  const applyMinimalHalfPairPreset = () => {
    updateCrextioConfig({
      dashboardSectionLayouts: {
        ...layoutsMap,
        research_promo: { span: 'half', density: 'minimal' },
        course_showcase: { span: 'half', density: 'minimal' },
        counseling_promo: { span: 'half', density: 'minimal' },
        welfare_showcase: { span: 'half', density: 'minimal' },
        multimedia_showcase: { span: 'half', density: 'minimal' },
        books_showcase: { span: 'half', density: 'minimal' },
      },
    });
    triggerSuccess();
  };

  return (
    <div className="space-y-6">
      {/* Default Alumni Theme Choice (Theme 2 vs Theme 3) */}
      <div className="p-4 rounded-3xl bg-stone-50 border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 className="font-extrabold text-xs sm:text-sm text-stone-900">
            تم پیش‌فرض ورود دانش‌آموختگان
          </h4>
          <p className="text-[11px] text-stone-500 mt-0.5">
            تعیین کنید دانش‌آموختگان به صورت پیش‌فرض با تم ۲ (کرکستیو) یا تم ۳ (مجمع مینیمال و هم‌افزایی) وارد شوند.
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-stone-200/70 p-1 rounded-2xl shrink-0">
          <button
            type="button"
            onClick={() => {
              updateCrextioConfig({ defaultAlumniTheme: 'crextio' });
              triggerSuccess();
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              (crextioConfig.defaultAlumniTheme || 'crextio') === 'crextio'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-stone-700 hover:bg-white/60'
            }`}
          >
            تم ۲: کرکستیو فاخر
          </button>
          <button
            type="button"
            onClick={() => {
              updateCrextioConfig({ defaultAlumniTheme: 'minimal' });
              triggerSuccess();
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              crextioConfig.defaultAlumniTheme === 'minimal'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-stone-700 hover:bg-white/60'
            }`}
          >
            تم ۳: مجمع مینیمال و هم‌افزایی
          </button>
        </div>
      </div>

      {/* Section Re-ordering & Sizing Box */}
      <div className="p-4 rounded-3xl bg-amber-50/80 border border-amber-200 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="font-extrabold text-sm text-amber-950 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-800" />
            چیدمان، جابه‌جایی (Drag & Drop)، نصف‌عرض‌سازی و نمای مینیمال ویترین‌ها
          </h4>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={applyMinimalHalfPairPreset}
              className="px-3 py-1 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>چیدمان پیش‌فرض مینیمال ۲تایی در خط</span>
            </button>

            <button
              type="button"
              onClick={() => {
                updateCrextioConfig({
                  dashboardSectionOrder: [...CANONICAL_DASHBOARD_SECTION_ORDER],
                  hiddenDashboardSections: {},
                  dashboardSectionLayouts: {},
                  showResearchPromoShowcase: true,
                  showRulingsShowcase: true,
                });
                triggerSuccess();
              }}
              className="px-3 py-1 rounded-full border border-amber-300 hover:bg-amber-100 text-amber-900 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>بازنشانی کامل پیش‌فرض</span>
            </button>
          </div>
        </div>
        <p className="text-[11px] text-amber-900/80 leading-relaxed">
          ویترین‌ها را می‌توانید با <strong>کشیدن و رها کردن (Drag & Drop)</strong> جابه‌جا کنید، عرض آن‌ها را به <strong>نصف‌عرض (۱/۲)</strong> تبدیل کنید تا دو ویترین (مثل دوره‌ها و پژوهش) در یک خط کنار هم بنشینند، و ظاهرشان را روی <strong>مینیمال</strong> بگذارید.
        </p>

        <div className="space-y-2 pt-1">
          {sectionOrder.map((key, idx) => {
            const isHidden = hiddenMap[key] === true;
            const meta = sectionMeta[key] || { title: key, desc: 'بخش داشبورد' };
            const layout = layoutsMap[key] || { span: 'full', density: 'full' };
            const isHalf = layout.span === 'half';
            const isMinimal = layout.density === 'minimal';
            const canResize = key !== 'top_vip_row' && key !== 'bento_grid';

            return (
              <div
                key={key}
                draggable
                onDragStart={() => setDraggedIdx(idx)}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverIdx(idx);
                }}
                onDragLeave={() => setDragOverIdx(null)}
                onDrop={() => handleDropReorder(idx)}
                onDragEnd={() => {
                  setDraggedIdx(null);
                  setDragOverIdx(null);
                }}
                className={`p-3 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-grab active:cursor-grabbing ${
                  dragOverIdx === idx
                    ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/30'
                    : !isHidden
                    ? 'bg-white border-stone-200'
                    : 'bg-stone-100 border-dashed border-stone-300 opacity-60'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <GripVertical className="w-4 h-4 text-stone-400 shrink-0" />
                  <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center font-black text-xs shrink-0">
                    {toPersianNumbers(idx + 1)}
                  </span>
                  <div className="min-w-0">
                    <h5 className="font-extrabold text-stone-900 text-xs truncate">{meta.title}</h5>
                    <p className="text-[10px] text-stone-500 truncate">{meta.desc}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap shrink-0 justify-end">
                  {canResize && (
                    <>
                      {/* Half vs Full Width */}
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateSectionLayout(key, { span: isHalf ? 'full' : 'half' })
                        }
                        title={isHalf ? 'تبدیل به تمام‌عرض' : 'نصف کردن عرض (۲ ویترین در یک خط)'}
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border flex items-center gap-1 cursor-pointer transition-colors ${
                          isHalf
                            ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                            : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        <Columns2 className="w-3 h-3" />
                        <span>{isHalf ? 'نصف‌عرض (۱/۲)' : 'تمام‌عرض'}</span>
                      </button>

                      {/* Minimal vs Standard Density */}
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateSectionLayout(key, {
                            density: isMinimal ? 'full' : 'minimal',
                          })
                        }
                        title={isMinimal ? 'تغییر به نمای کامل' : 'تغییر به طراحی مینیمال'}
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border flex items-center gap-1 cursor-pointer transition-colors ${
                          isMinimal
                            ? 'bg-teal-50 text-teal-800 border-teal-200'
                            : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        {isMinimal ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
                        <span>{isMinimal ? 'مینیمال' : 'نمای کامل'}</span>
                      </button>
                    </>
                  )}

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
        <h4 className="font-extrabold text-xs text-stone-900">تنظیمات فعال‌سازی ماژول‌های ویترین و تم پیش‌فرض:</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {[
            { key: 'showRulingsShowcase' as const, title: 'ویترین تالار نقد و مناظره آراء قضایی', desc: 'نمایش دادنامه‌های منتخب و امکان ثبت نقد مستقیم', icon: Scale },
            { key: 'showResearchPromoShowcase' as const, title: 'ویترین باشگاه راهبری پژوهش و رساله‌ها', desc: 'هدایت رساله، استاد راهنما و اسکان پژوهشی', icon: Sparkles },
            { key: 'showHeroBanner' as const, title: 'بنر خوش‌آمدگویی بالای صفحه (Hero)', desc: 'کادر معرفی و دسترسی سریع خدمات', icon: Sparkles },
            { key: 'showKpiRow' as const, title: 'کارت‌های آمار زنده (KPI Counter)', desc: 'شمارنده‌های پرونده‌ها، اعضا، آراء و کتب', icon: Sliders },
            { key: 'showCourseShowcase' as const, title: 'ویترین اختصاصی دوره‌ها', desc: 'معرفی دوره‌های علمی و کارگاه‌های فقه القضا', icon: GraduationCap },
            { key: 'showCartableSnippet' as const, title: 'کارتابل درخواست‌های اداری من', desc: 'لیست سریع آخرین پرونده‌ها و استعلام‌های ثبت‌شده', icon: Inbox },
            { key: 'showProfileCard' as const, title: 'کارت پرونده و پرتره قاضی/دانش‌آموخته', desc: 'نمایش عکس پرسنلی، سطح و اطلاعات قضایی کاربر', icon: Eye }
          ].map(item => {
            const isEnabled = crextioConfig[item.key] !== false;
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
