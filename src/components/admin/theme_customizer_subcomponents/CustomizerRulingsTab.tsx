import React, { useState, useRef } from 'react';
import { Scale, Upload, Loader2, Check } from 'lucide-react';
import { CrextioDashboardConfig, JudicialRuling } from '../../../types';
import { toPersianNumbers } from '../../../utils/persianNumbers';
import { api } from '../../../services/apiClient';
import { resolveShowcaseImageUrl } from '../../../data/showcaseImages';

interface CustomizerRulingsTabProps {
  crextioConfig: CrextioDashboardConfig;
  updateCrextioConfig: (updates: Partial<CrextioDashboardConfig>) => void;
  triggerSuccess: () => void;
  rulings: JudicialRuling[];
  handleToggle: (key: keyof CrextioDashboardConfig) => void;
}

export const CustomizerRulingsTab: React.FC<CustomizerRulingsTabProps> = ({
  crextioConfig,
  updateCrextioConfig,
  triggerSuccess,
  rulings,
  handleToggle,
}) => {
  const [uploadingBg, setUploadingBg] = useState(false);
  const bgFileRef = useRef<HTMLInputElement>(null);

  const currentList: JudicialRuling[] =
    crextioConfig.rulingsCustomList && crextioConfig.rulingsCustomList.length > 0
      ? crextioConfig.rulingsCustomList
      : rulings;

  const selectedIds = crextioConfig.rulingsSelectedIds || [];
  const bgImageUrl =
    crextioConfig.rulingsShowcaseBgImage ||
    resolveShowcaseImageUrl('rulings_showcase', crextioConfig.showcaseImageOverrides);

  const updateRulingField = (id: string, patch: Partial<JudicialRuling>) => {
    const nextList = currentList.map(item => (item.id === id ? { ...item, ...patch } : item));
    updateCrextioConfig({ rulingsCustomList: nextList });
  };

  const toggleSelectRuling = (id: string) => {
    const exists = selectedIds.includes(id);
    const next = exists ? selectedIds.filter(x => x !== id) : [...selectedIds, id];
    updateCrextioConfig({ rulingsSelectedIds: next });
    triggerSuccess();
  };

  const handleUploadBg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBg(true);
    try {
      const res = await api.uploadFile(file, 'misc');
      if (res?.url) {
        updateCrextioConfig({
          rulingsShowcaseBgImage: res.url,
          showcaseImageOverrides: {
            ...(crextioConfig.showcaseImageOverrides || {}),
            rulings_showcase: res.url,
          },
        });
        triggerSuccess();
      }
    } catch (err: any) {
      alert(`خطا در آپلود تصویر: ${err.message || 'خطای سرور'}`);
    } finally {
      setUploadingBg(false);
      if (bgFileRef.current) bgFileRef.current.value = '';
    }
  };

  return (
    <div className="space-y-5">
      <input
        ref={bgFileRef}
        type="file"
        accept="image/*"
        onChange={handleUploadBg}
        className="hidden"
      />

      <div className="p-5 rounded-3xl bg-amber-50/80 border border-amber-200 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center font-bold">
              <Scale className="w-5 h-5" />
            </span>
            <div>
              <h4 className="font-extrabold text-sm text-amber-950">
                تنظیمات و محتوای ۱۰۰٪ ویترین تالار نقد آراء قضایی
              </h4>
              <p className="text-[11px] text-amber-800/80 mt-0.5">
                انتخاب حالت نمایش (خلاصه چرخشی یا تفصیلی فعلی)، تایمر تعویض، انتخاب آراء منتخب و آپلود عکس
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleToggle('showRulingsShowcase')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
              crextioConfig.showRulingsShowcase !== false
                ? 'bg-amber-800 text-white'
                : 'bg-stone-300 text-stone-700'
            }`}
          >
            {crextioConfig.showRulingsShowcase !== false ? 'نمایش ویترین: فعال' : 'نمایش ویترین: مخفی'}
          </button>
        </div>

        {/* Display Mode (3 modes including summary_carousel) & Rotation Interval */}
        <div className="p-4 rounded-2xl bg-white border border-amber-200 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {[
              {
                id: 'summary_carousel' as const,
                title: 'حالت اول: گزیده چرخشی آراء',
                desc: 'نمایش خلاصه و نکات کلیدی یک یا چند رأی منتخب به صورت اسلایدر با زمان‌بندی',
              },
              {
                id: 'expanded' as const,
                title: 'حالت دوم: تفصیلی دو ستونه',
                desc: 'فهرست آراء در کنار پیش‌نمایش کامل متن و نظرات',
              },
              {
                id: 'compact' as const,
                title: 'حالت سوم: شبکه‌ای فشرده',
                desc: 'نمایش کارت‌های آراء کنار هم به صورت مینیمال',
              },
            ].map(modeOpt => {
              const active = (crextioConfig.rulingsShowcaseMode || 'expanded') === modeOpt.id;
              return (
                <button
                  key={modeOpt.id}
                  type="button"
                  onClick={() => {
                    updateCrextioConfig({ rulingsShowcaseMode: modeOpt.id });
                    triggerSuccess();
                  }}
                  className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                    active
                      ? 'bg-amber-100 text-amber-950 border-amber-400 font-black shadow-xs'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  <span className="block font-black text-xs">{modeOpt.title}</span>
                  <span className="block text-[10px] text-stone-600 font-normal mt-1 leading-snug">
                    {modeOpt.desc}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-stone-100">
            <div>
              <label className="font-bold text-stone-700 block mb-1 text-xs">
                زمان تعویض خودکار آراء در حالت اول (ثانیه):
              </label>
              <input
                type="number"
                min={2}
                max={60}
                value={crextioConfig.rulingsShowcaseIntervalSeconds ?? 5}
                onChange={e => {
                  updateCrextioConfig({
                    rulingsShowcaseIntervalSeconds: Math.max(2, Number(e.target.value) || 5),
                  });
                  triggerSuccess();
                }}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-mono font-bold"
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={() => {
                  updateCrextioConfig({
                    rulingsSummaryAutoplay: crextioConfig.rulingsSummaryAutoplay === false,
                  });
                  triggerSuccess();
                }}
                className={`w-full px-3 py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                  crextioConfig.rulingsSummaryAutoplay !== false
                    ? 'bg-emerald-800 text-white border-emerald-800'
                    : 'bg-stone-100 text-stone-700 border-stone-300'
                }`}
              >
                {crextioConfig.rulingsSummaryAutoplay !== false ? 'تعویض خودکار: روشن' : 'تعویض خودکار: خاموش'}
              </button>
            </div>

            <div className="flex items-center justify-between gap-2 bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-200">
              {bgImageUrl && (
                <img
                  src={bgImageUrl}
                  alt="عکس آراء"
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-lg object-cover border shrink-0"
                />
              )}
              <button
                type="button"
                disabled={uploadingBg}
                onClick={() => bgFileRef.current?.click()}
                className="flex-1 px-2.5 py-1.5 rounded-lg bg-amber-800 hover:bg-amber-900 text-white text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
              >
                {uploadingBg ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                <span>آپلود تصویر کاور آراء</span>
              </button>
            </div>
          </div>
        </div>

        {/* Select Featured Rulings */}
        <div className="p-4 rounded-2xl bg-white border border-amber-200 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-stone-800">
              انتخاب آراء نمایش‌داده‌شده در ویترین (خالی = نمایش همه):
            </label>
            {selectedIds.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  updateCrextioConfig({ rulingsSelectedIds: [] });
                  triggerSuccess();
                }}
                className="text-[11px] font-bold text-amber-800 hover:underline cursor-pointer"
              >
                نمایش همه ({toPersianNumbers(currentList.length)})
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
            {currentList.map(r => {
              const checked = selectedIds.length === 0 || selectedIds.includes(r.id);
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => toggleSelectRuling(r.id)}
                  className={`p-2.5 rounded-xl border text-right flex items-center justify-between gap-2 text-xs cursor-pointer ${
                    checked
                      ? 'bg-amber-50 border-amber-400 text-amber-950 font-bold'
                      : 'bg-stone-50 border-stone-200 text-stone-500'
                  }`}
                >
                  <span className="truncate">{r.title}</span>
                  <span className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${checked ? 'bg-amber-700 text-white' : 'bg-stone-200'}`}>
                    {checked && <Check className="w-3 h-3" />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-stone-700 block mb-1 text-xs">
                نشان ویژه بالای ویترین (Badge):
              </label>
              <input
                type="text"
                value={crextioConfig.rulingsShowcaseBadge || ''}
                onChange={e => {
                  updateCrextioConfig({ rulingsShowcaseBadge: e.target.value });
                  triggerSuccess();
                }}
                placeholder="مثال: تالار مناظره و نقد آراء منتخب"
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-stone-200 text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-600"
              />
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1 text-xs">
                متن دکمه ورود به تالار (CTA):
              </label>
              <input
                type="text"
                value={crextioConfig.rulingsPrimaryBtnText || ''}
                onChange={e => {
                  updateCrextioConfig({ rulingsPrimaryBtnText: e.target.value });
                  triggerSuccess();
                }}
                placeholder="مثال: ورود به تالار جامع آراء"
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-stone-200 text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-600"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-stone-700 block mb-1 text-xs">
              عنوان اصلی ویترین آراء:
            </label>
            <input
              type="text"
              value={crextioConfig.rulingsShowcaseTitle || ''}
              onChange={e => {
                updateCrextioConfig({ rulingsShowcaseTitle: e.target.value });
                triggerSuccess();
              }}
              placeholder="مثال: تالار نقد، ارزیابی و مباحثه آراء و دادنامه‌های قضایی"
              className="w-full px-4 py-2.5 rounded-2xl bg-white border border-stone-200 text-xs font-black text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-600"
            />
          </div>

          <div>
            <label className="font-bold text-stone-700 block mb-1 text-xs">
              زیرعنوان و توضیحات ویترین آراء:
            </label>
            <input
              type="text"
              value={crextioConfig.rulingsShowcaseSubtitle || ''}
              onChange={e => {
                updateCrextioConfig({ rulingsShowcaseSubtitle: e.target.value });
                triggerSuccess();
              }}
              placeholder="مثال: میدان تحلیل رویه‌های قضایی، آراء وحدت رویه و نقدهای حقوقی..."
              className="w-full px-4 py-2.5 rounded-2xl bg-white border border-stone-200 text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-600"
            />
          </div>

          <div>
            <label className="font-bold text-stone-700 block mb-1 text-xs">
              عنوان بالای ستون فهرست آراء (در حالت تفصیلی):
            </label>
            <input
              type="text"
              value={crextioConfig.rulingsShowcaseSectionTitle || ''}
              onChange={e => {
                updateCrextioConfig({ rulingsShowcaseSectionTitle: e.target.value });
                triggerSuccess();
              }}
              placeholder="مثال: دادنامه‌های داغ و برگزیده این هفته"
              className="w-full px-4 py-2.5 rounded-2xl bg-white border border-stone-200 text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-600"
            />
          </div>

          {/* آرای قضایی قابل ویرایش ۱۰۰ درصدی با بروزرسانی تغییرناپذیر */}
          <div className="pt-3 border-t border-amber-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-extrabold text-xs text-amber-950 block">
                فهرست دادنامه‌های اختصاصی ویترین (ویرایش ۱۰۰٪ متن، شعب، قضات و استدلال‌ها):
              </label>
              <button
                type="button"
                onClick={() => {
                  const newRulingItem: JudicialRuling = {
                    id: `rul_${Date.now()}`,
                    title: 'دادنامه جدید: عدم نفوذ شرط وجه التزام گزاف در قراردادهای الحاقی',
                    courtBranch: 'شعبه تخصصی دیوان عالی کشور',
                    judgeName: 'دکتر علیرضا میرزایی',
                    rulingDate: '۱۴۰۳/۰۸/۰۵',
                    caseType: 'civil',
                    caseTypeTitle: 'حقوقی و قراردادها',
                    summary: 'دادگاه با بررسی موازین انصاف و منع سوءاستفاده از حق، تعهدات نامتعارف الحاقی را تحدید نمود.',
                    fullRulingText: 'متن رأی صادر شده جهت مباحثه حقوقدانان...',
                    legalPrinciples: ['قاعده لاضرر و لاضرار', 'ماده ۹۷۵ قانون مدنی و نظم عمومی'],
                    status: 'selected',
                    submittedById: 'usr_admin',
                    submittedByName: 'مدیر سامانه',
                    likesCount: 12,
                    likedBy: [],
                    discussions: []
                  };
                  updateCrextioConfig({ rulingsCustomList: [newRulingItem, ...currentList] });
                  triggerSuccess();
                }}
                className="px-3 py-1 rounded-full bg-amber-700 hover:bg-amber-800 text-white font-bold text-[11px] cursor-pointer"
              >
                + افزودن رأی جدید به ویترین
              </button>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
              {currentList.map((r: JudicialRuling, idx: number) => (
                <div key={r.id} className="p-4 rounded-2xl bg-white border border-stone-200 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-black text-xs">
                      دادنامه شماره {toPersianNumbers(idx + 1)}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        updateCrextioConfig({
                          rulingsCustomList: currentList.filter(item => item.id !== r.id),
                        });
                        triggerSuccess();
                      }}
                      className="text-[11px] text-red-600 hover:text-red-800 font-bold cursor-pointer"
                    >
                      حذف این دادنامه
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="sm:col-span-2">
                      <label className="text-[10px] text-stone-500 font-bold block mb-0.5">عنوان دادنامه:</label>
                      <input
                        type="text"
                        value={r.title}
                        onChange={e => updateRulingField(r.id, { title: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-stone-200 text-xs font-bold text-stone-900"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-stone-500 font-bold block mb-0.5">دسته‌بندی موضوعی:</label>
                      <input
                        type="text"
                        value={r.caseTypeTitle}
                        onChange={e => updateRulingField(r.id, { caseTypeTitle: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-stone-200 text-xs font-bold text-amber-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-stone-500 font-bold block mb-0.5">مرجع صدور و شعبه:</label>
                      <input
                        type="text"
                        value={r.courtBranch}
                        onChange={e => updateRulingField(r.id, { courtBranch: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-stone-200 text-xs font-medium text-stone-900"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-stone-500 font-bold block mb-0.5">نام قاضی انشاءکننده:</label>
                      <input
                        type="text"
                        value={r.judgeName || ''}
                        onChange={e => updateRulingField(r.id, { judgeName: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-stone-200 text-xs font-medium text-stone-900"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-stone-500 font-bold block mb-0.5">تاریخ صدور:</label>
                      <input
                        type="text"
                        value={r.rulingDate || ''}
                        onChange={e => updateRulingField(r.id, { rulingDate: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-stone-200 text-xs font-medium text-stone-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-stone-500 font-bold block mb-0.5">چکیده استنباط حقوقی:</label>
                    <textarea
                      rows={2}
                      value={r.summary}
                      onChange={e => updateRulingField(r.id, { summary: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-stone-200 text-xs text-stone-800 leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-stone-500 font-bold block mb-0.5">متن کامل دادنامه:</label>
                    <textarea
                      rows={3}
                      value={r.fullRulingText || ''}
                      onChange={e => updateRulingField(r.id, { fullRulingText: e.target.value })}
                      placeholder="متن تفصیلی رأی..."
                      className="w-full p-2.5 rounded-xl border border-stone-200 text-xs text-stone-800 font-serif leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-stone-500 font-bold block mb-0.5">مستندات و قواعد فقهی (با ویرگول جدا کنید):</label>
                    <input
                      type="text"
                      value={r.legalPrinciples?.join('، ') || ''}
                      onChange={e =>
                        updateRulingField(r.id, {
                          legalPrinciples: e.target.value
                            .split('،')
                            .map(s => s.trim())
                            .filter(Boolean),
                        })
                      }
                      placeholder="قاعده لاضرر، ماده ۹۷۵ قانون مدنی"
                      className="w-full px-2.5 py-1.5 rounded-xl border border-stone-200 text-xs font-medium text-emerald-900"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
