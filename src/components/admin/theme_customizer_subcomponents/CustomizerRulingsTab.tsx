import React from 'react';
import { Scale } from 'lucide-react';
import { CrextioDashboardConfig, JudicialRuling } from '../../../types';
import { toPersianNumbers } from '../../../utils/persianNumbers';

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
  return (
    <div className="space-y-5">
      <div className="p-5 rounded-3xl bg-amber-50/80 border border-amber-200 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center font-bold">
              <Scale className="w-5 h-5" />
            </span>
            <div>
              <h4 className="font-extrabold text-sm text-amber-950">
                تنظیمات و محتوای ۱۰۰٪ ویترین تالار نقد آراء قضایی
              </h4>
              <p className="text-[11px] text-amber-800/80 mt-0.5">
                ویرایش کامل تیتر، زیرعنوان، نشان، دکمه اقدام، آراء و شعب قضایی
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-stone-700 block mb-1 text-xs">
                عنوان بالای ستون فهرست آراء (در حالت کامل):
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

            <div>
              <label className="font-bold text-stone-700 block mb-1 text-xs">
                حالت پیش‌فرض نمایش ویترین آراء (مدیریت انحصاری ادمین):
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    updateCrextioConfig({ rulingsShowcaseMode: 'expanded' });
                    triggerSuccess();
                  }}
                  className={`p-2 rounded-xl border text-right transition-all cursor-pointer ${
                    crextioConfig.rulingsShowcaseMode !== 'compact'
                      ? 'bg-amber-100 text-amber-950 border-amber-400 font-black shadow-xs'
                      : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <span className="block font-black text-xs">۱. حالت تفصیلی (کامل)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    updateCrextioConfig({ rulingsShowcaseMode: 'compact' });
                    triggerSuccess();
                  }}
                  className={`p-2 rounded-xl border text-right transition-all cursor-pointer ${
                    crextioConfig.rulingsShowcaseMode === 'compact'
                      ? 'bg-amber-100 text-amber-950 border-amber-400 font-black shadow-xs'
                      : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <span className="block font-black text-xs">۲. حالت مختصر (فشرده)</span>
                </button>
              </div>
            </div>
          </div>

          {/* آرای قضایی قابل ویرایش ۱۰۰ درصدی */}
          <div className="pt-3 border-t border-amber-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-extrabold text-xs text-amber-950 block">
                فهرست دادنامه‌های اختصاصی ویترین (ویرایش ۱۰۰٪ متن، شعب، قضات و استدلال‌ها):
              </label>
              <button
                type="button"
                onClick={() => {
                  const currentList = crextioConfig.rulingsCustomList || rulings;
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
              {(crextioConfig.rulingsCustomList || rulings).map((r: JudicialRuling, idx: number) => (
                <div key={r.id} className="p-4 rounded-2xl bg-white border border-stone-200 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-black text-xs">
                      دادنامه شماره {toPersianNumbers(idx + 1)}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const currentList = (crextioConfig.rulingsCustomList || rulings).filter((item: JudicialRuling) => item.id !== r.id);
                        updateCrextioConfig({ rulingsCustomList: currentList });
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
                        onChange={e => {
                          const currentList = [...(crextioConfig.rulingsCustomList || rulings)];
                          const target = currentList.find(item => item.id === r.id);
                          if (target) {
                            target.title = e.target.value;
                            updateCrextioConfig({ rulingsCustomList: currentList });
                          }
                        }}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-stone-200 text-xs font-bold text-stone-900"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-stone-500 font-bold block mb-0.5">دسته‌بندی موضوعی:</label>
                      <input
                        type="text"
                        value={r.caseTypeTitle}
                        onChange={e => {
                          const currentList = [...(crextioConfig.rulingsCustomList || rulings)];
                          const target = currentList.find(item => item.id === r.id);
                          if (target) {
                            target.caseTypeTitle = e.target.value;
                            updateCrextioConfig({ rulingsCustomList: currentList });
                          }
                        }}
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
                        onChange={e => {
                          const currentList = [...(crextioConfig.rulingsCustomList || rulings)];
                          const target = currentList.find(item => item.id === r.id);
                          if (target) {
                            target.courtBranch = e.target.value;
                            updateCrextioConfig({ rulingsCustomList: currentList });
                          }
                        }}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-stone-200 text-xs font-medium text-stone-900"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-stone-500 font-bold block mb-0.5">نام قاضی انشاءکننده:</label>
                      <input
                        type="text"
                        value={r.judgeName || ''}
                        onChange={e => {
                          const currentList = [...(crextioConfig.rulingsCustomList || rulings)];
                          const target = currentList.find(item => item.id === r.id);
                          if (target) {
                            target.judgeName = e.target.value;
                            updateCrextioConfig({ rulingsCustomList: currentList });
                          }
                        }}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-stone-200 text-xs font-medium text-stone-900"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-stone-500 font-bold block mb-0.5">تاریخ صدور:</label>
                      <input
                        type="text"
                        value={r.rulingDate || ''}
                        onChange={e => {
                          const currentList = [...(crextioConfig.rulingsCustomList || rulings)];
                          const target = currentList.find(item => item.id === r.id);
                          if (target) {
                            target.rulingDate = e.target.value;
                            updateCrextioConfig({ rulingsCustomList: currentList });
                          }
                        }}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-stone-200 text-xs font-medium text-stone-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-stone-500 font-bold block mb-0.5">چکیده استنباط حقوقی:</label>
                    <textarea
                      rows={2}
                      value={r.summary}
                      onChange={e => {
                        const currentList = [...(crextioConfig.rulingsCustomList || rulings)];
                        const target = currentList.find(item => item.id === r.id);
                        if (target) {
                          target.summary = e.target.value;
                          updateCrextioConfig({ rulingsCustomList: currentList });
                        }
                      }}
                      className="w-full p-2.5 rounded-xl border border-stone-200 text-xs text-stone-800 leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-stone-500 font-bold block mb-0.5">متن کامل دادنامه:</label>
                    <textarea
                      rows={3}
                      value={r.fullRulingText || ''}
                      onChange={e => {
                        const currentList = [...(crextioConfig.rulingsCustomList || rulings)];
                        const target = currentList.find(item => item.id === r.id);
                        if (target) {
                          target.fullRulingText = e.target.value;
                          updateCrextioConfig({ rulingsCustomList: currentList });
                        }
                      }}
                      placeholder="متن تفصیلی رأی..."
                      className="w-full p-2.5 rounded-xl border border-stone-200 text-xs text-stone-800 font-serif leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-stone-500 font-bold block mb-0.5">مستندات و قواعد فقهی (با ویرگول جدا کنید):</label>
                    <input
                      type="text"
                      value={r.legalPrinciples?.join('، ') || ''}
                      onChange={e => {
                        const currentList = [...(crextioConfig.rulingsCustomList || rulings)];
                        const target = currentList.find(item => item.id === r.id);
                        if (target) {
                          target.legalPrinciples = e.target.value.split('،').map(s => s.trim()).filter(Boolean);
                          updateCrextioConfig({ rulingsCustomList: currentList });
                        }
                      }}
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
