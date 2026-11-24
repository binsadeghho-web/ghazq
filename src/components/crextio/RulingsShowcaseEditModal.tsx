import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Edit3,
  X,
  Plus,
  Trash2,
  Check,
  Upload,
  Loader2,
  Clock,
  Scale,
} from 'lucide-react';
import { CrextioDashboardConfig, JudicialRuling } from '../../types';
import { api } from '../../services/apiClient';
import { resolveShowcaseImageUrl } from '../../data/showcaseImages';
import { toPersianNumbers } from '../../utils/persianNumbers';

interface RulingsShowcaseEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  crextioConfig: CrextioDashboardConfig;
  updateCrextioConfig: (updates: Partial<CrextioDashboardConfig>) => void;
  allRulings: JudicialRuling[];
}

export const RulingsShowcaseEditModal: React.FC<RulingsShowcaseEditModalProps> = ({
  isOpen,
  onClose,
  crextioConfig,
  updateCrextioConfig,
  allRulings,
}) => {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const baseList: JudicialRuling[] =
    crextioConfig.rulingsCustomList && crextioConfig.rulingsCustomList.length > 0
      ? crextioConfig.rulingsCustomList
      : allRulings;

  const selectedIds =
    crextioConfig.rulingsSelectedIds && crextioConfig.rulingsSelectedIds.length > 0
      ? crextioConfig.rulingsSelectedIds
      : baseList.map(r => r.id);

  const currentMode = crextioConfig.rulingsShowcaseMode || 'expanded';
  const intervalSeconds = Math.max(2, Number(crextioConfig.rulingsShowcaseIntervalSeconds) || 5);
  const coverImg =
    crextioConfig.rulingsShowcaseBgImage ||
    resolveShowcaseImageUrl('rulings_showcase', crextioConfig.showcaseImageOverrides);

  const toggleSelectRuling = (id: string) => {
    if (selectedIds.includes(id)) {
      if (selectedIds.length <= 1) return;
      updateCrextioConfig({
        rulingsSelectedIds: selectedIds.filter(rId => rId !== id),
      });
    } else {
      updateCrextioConfig({
        rulingsSelectedIds: [...selectedIds, id],
      });
    }
  };

  const handleRulingFieldChange = (id: string, patch: Partial<JudicialRuling>) => {
    const nextList = baseList.map(item => (item.id === id ? { ...item, ...patch } : item));
    updateCrextioConfig({ rulingsCustomList: nextList });
  };

  const handleAddRuling = () => {
    const newItem: JudicialRuling = {
      id: `rul_${Date.now()}`,
      title: 'دادنامه جدید: تحدید شرط وجه التزام نامتعارف در قراردادها',
      courtBranch: 'شعبه تخصصی دیوان عالی کشور',
      judgeName: 'دکتر علیرضا میرزایی',
      rulingDate: '۱۴۰۴/۰۸/۱۰',
      caseType: 'civil',
      caseTypeTitle: 'حقوقی و قراردادها',
      summary: 'خلاصه استدلال حقوقی و فقهی رأی برای نمایش در ویترین خلاصه و تالار مباحثه اعضا.',
      fullRulingText: 'متن تفصیلی دادنامه و مستندات قانونی رأی...',
      legalPrinciples: ['قاعده لاضرر و لاضرار', 'ماده ۹۷۵ قانون مدنی و نظم عمومی'],
      status: 'selected',
      submittedById: 'usr_admin',
      submittedByName: 'دبیرخانه تالار آراء',
      likesCount: 14,
      likedBy: [],
      dislikesCount: 0,
      dislikedBy: [],
      discussions: [],
    };
    const nextList = [newItem, ...baseList];
    updateCrextioConfig({
      rulingsCustomList: nextList,
      rulingsSelectedIds: [newItem.id, ...selectedIds],
    });
  };

  const handleDeleteRuling = (id: string) => {
    if (baseList.length <= 1) return;
    const nextList = baseList.filter(r => r.id !== id);
    const nextSelected = selectedIds.filter(sId => sId !== id);
    updateCrextioConfig({
      rulingsCustomList: nextList,
      rulingsSelectedIds: nextSelected.length > 0 ? nextSelected : [nextList[0].id],
    });
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
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
      }
    } catch (err: any) {
      alert(`خطا در آپلود تصویر: ${err.message || 'خطای سرور'}`);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-1 sm:p-4 bg-black/60 backdrop-blur-sm overflow-hidden"
        dir="rtl"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          onClick={e => e.stopPropagation()}
          className="bg-white rounded-t-[26px] sm:rounded-3xl w-full max-w-3xl border border-stone-200 shadow-2xl text-stone-900 max-h-[92dvh] sm:max-h-[90vh] flex flex-col overflow-hidden"
        >
          <input ref={fileRef} type="file" accept="image/*" onChange={handleUploadImage} className="hidden" />

          <div className="px-5 py-4 sm:px-6 flex items-center justify-between gap-2 border-b border-stone-200 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <Scale className="w-5 h-5 text-amber-700 shrink-0" />
              <h4 className="font-black text-xs sm:text-sm text-stone-900 truncate">
                تنظیمات و ویرایش ۱۰۰٪ ویترین آراء قضایی
              </h4>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full hover:bg-stone-100 text-stone-500 hover:text-stone-700 flex items-center justify-center shrink-0 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 sm:p-6 overflow-y-auto overscroll-y-contain space-y-5 flex-1 min-h-0">

          {/* Mode + Timer Row */}
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { id: 'summary_carousel', title: '۱. اسلایدر خلاصه آراء منتخب (حالت اول)', desc: 'نمایش چرخشی خلاصه ۱ یا چند رأی با تایمر' },
                { id: 'expanded', title: '۲. حالت تفصیلی دو ستونه', desc: 'فهرست آراء + پرونده ۴تبه‌ای نقد زنده' },
                { id: 'compact', title: '۳. حالت شبکه‌ای فشرده', desc: 'کارت‌های ۳ ستونه آراء' },
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => updateCrextioConfig({ rulingsShowcaseMode: opt.id as any })}
                  className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                    currentMode === opt.id
                      ? 'bg-amber-800 text-white border-amber-900 shadow-xs'
                      : 'bg-white text-stone-800 border-stone-200 hover:bg-amber-100/50'
                  }`}
                >
                  <div className="text-xs font-black">{opt.title}</div>
                  <div className={`text-[10px] mt-0.5 ${currentMode === opt.id ? 'text-amber-100' : 'text-stone-500'}`}>
                    {opt.desc}
                  </div>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[11px] font-bold text-stone-700 flex items-center gap-1 mb-1">
                  <Clock className="w-3.5 h-3.5 text-amber-700" />
                  <span>زمان تعویض خودکار آراء در حالت اول (ثانیه):</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={2}
                    max={60}
                    value={intervalSeconds}
                    onChange={e =>
                      updateCrextioConfig({
                        rulingsShowcaseIntervalSeconds: Math.max(2, Number(e.target.value) || 5),
                      })
                    }
                    className="w-28 px-3 py-1.5 rounded-xl bg-white border border-stone-300 text-xs font-mono font-bold"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      updateCrextioConfig({
                        rulingsSummaryAutoplay: crextioConfig.rulingsSummaryAutoplay === false,
                      })
                    }
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border cursor-pointer ${
                      crextioConfig.rulingsSummaryAutoplay !== false
                        ? 'bg-emerald-800 text-white border-emerald-900'
                        : 'bg-white text-stone-700 border-stone-300'
                    }`}
                  >
                    {crextioConfig.rulingsSummaryAutoplay !== false ? 'چرخش خودکار: روشن' : 'چرخش خودکار: خاموش'}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-700 block mb-1">
                  تصویر و پوستر ویترین آراء:
                </label>
                <div className="flex items-center gap-2">
                  {coverImg && (
                    <img
                      src={coverImg}
                      alt="تصویر ویترین آراء"
                      referrerPolicy="no-referrer"
                      className="w-12 h-9 rounded-lg object-cover border border-stone-300 shrink-0"
                    />
                  )}
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => fileRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-stone-100 border border-stone-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    <span>آپلود تصویر جدید روی سرور</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Reform 16 & 19: Showcase Content Depth, Visible Tabs & Reactions Controls */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-4 text-xs">
            <div className="space-y-2">
              <label className="font-black text-stone-900 block">
                بخش‌های قابل نمایش از هر رأی درون ویترین داشبورد (اصلاح ۱۶):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { id: 'title_only', label: 'فقط عنوان رأی' },
                  { id: 'title_summary', label: 'عنوان + چکیده رأی' },
                  { id: 'tabbed', label: 'چندسربرگی کامل (تب‌های قابل انتخاب)' },
                ].map(opt => {
                  const active = (crextioConfig.rulingsShowcaseContentMode || 'tabbed') === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => updateCrextioConfig({ rulingsShowcaseContentMode: opt.id as any })}
                      className={`p-2.5 rounded-xl border font-bold text-right cursor-pointer transition-colors ${
                        active
                          ? 'bg-emerald-800 text-white border-emerald-900'
                          : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tabs selector & custom labels */}
            {(crextioConfig.rulingsShowcaseContentMode || 'tabbed') === 'tabbed' && (
              <div className="space-y-2 pt-2 border-t border-stone-200">
                <label className="font-bold text-stone-700 block">
                  سربرگ‌های فعال و عنوان دلخواه هر سربرگ در ویترین:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(
                    [
                      { key: 'summary', defLabel: 'چکیده استنباط' },
                      { key: 'principles', defLabel: 'مستندات و قواعد فقهی' },
                      { key: 'discussions', defLabel: 'نقدها و مباحثات' },
                      { key: 'fullText', defLabel: 'متن دادنامه' },
                    ] as const
                  ).map(t => {
                    const activeTabs = crextioConfig.rulingsShowcaseVisibleTabs || [
                      'summary',
                      'principles',
                      'discussions',
                      'fullText',
                    ];
                    const isEnabled = activeTabs.includes(t.key);
                    const customLabels = crextioConfig.rulingsShowcaseTabLabels || {};
                    return (
                      <div
                        key={t.key}
                        className="flex items-center gap-2 p-2 rounded-xl bg-white border border-stone-200"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            const next = isEnabled
                              ? activeTabs.length > 1
                                ? activeTabs.filter(x => x !== t.key)
                                : activeTabs
                              : [...activeTabs, t.key];
                            updateCrextioConfig({ rulingsShowcaseVisibleTabs: next });
                          }}
                          className={`w-5 h-5 rounded flex items-center justify-center border shrink-0 cursor-pointer ${
                            isEnabled ? 'bg-amber-700 text-white border-amber-800' : 'bg-stone-100 border-stone-300'
                          }`}
                        >
                          {isEnabled && <Check className="w-3.5 h-3.5" />}
                        </button>
                        <input
                          type="text"
                          value={customLabels[t.key] ?? t.defLabel}
                          onChange={e =>
                            updateCrextioConfig({
                              rulingsShowcaseTabLabels: {
                                ...customLabels,
                                [t.key]: e.target.value,
                              },
                            })
                          }
                          className="flex-1 px-2 py-1 rounded-lg border border-stone-200 text-xs font-bold"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Likes / Dislikes / Comments visibility toggles */}
            <div className="space-y-2 pt-2 border-t border-stone-200">
              <label className="font-bold text-stone-700 block">
                تنظیم نمایش دکمه‌ها و آمار تعامل در ویترین داشبورد (اصلاح ۱۹):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { key: 'rulingsShowLikesInShowcase' as const, label: 'نمایش تعداد و دکمه پسند' },
                  { key: 'rulingsShowDislikesInShowcase' as const, label: 'نمایش تعداد و دکمه عدم پسند' },
                  { key: 'rulingsShowCommentsInShowcase' as const, label: 'نمایش تعداد دیدگاه‌ها' },
                ].map(item => {
                  const enabled = crextioConfig[item.key] !== false;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => updateCrextioConfig({ [item.key]: !enabled })}
                      className={`p-2.5 rounded-xl border flex items-center justify-between font-bold cursor-pointer ${
                        enabled
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-950'
                          : 'bg-white border-stone-200 text-stone-500'
                      }`}
                    >
                      <span>{item.label}</span>
                      <span className="text-[10px]">{enabled ? 'روشن' : 'مخفی'}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Header Texts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="font-bold text-stone-700 block mb-1">عنوان اصلی ویترین آراء:</label>
              <input
                type="text"
                value={crextioConfig.rulingsShowcaseTitle || ''}
                onChange={e => updateCrextioConfig({ rulingsShowcaseTitle: e.target.value })}
                className="w-full p-2 rounded-xl border border-stone-300 font-bold"
              />
            </div>
            <div>
              <label className="font-bold text-stone-700 block mb-1">نشان ویژه بالای ویترین:</label>
              <input
                type="text"
                value={crextioConfig.rulingsShowcaseBadge || ''}
                onChange={e => updateCrextioConfig({ rulingsShowcaseBadge: e.target.value })}
                className="w-full p-2 rounded-xl border border-stone-300 font-bold"
              />
            </div>
            <div>
              <label className="font-bold text-stone-700 block mb-1">زیرعنوان ویترین:</label>
              <input
                type="text"
                value={crextioConfig.rulingsShowcaseSubtitle || ''}
                onChange={e => updateCrextioConfig({ rulingsShowcaseSubtitle: e.target.value })}
                className="w-full p-2 rounded-xl border border-stone-300"
              />
            </div>
            <div>
              <label className="font-bold text-stone-700 block mb-1">متن دکمه ورود به تالار:</label>
              <input
                type="text"
                value={crextioConfig.rulingsPrimaryBtnText || ''}
                onChange={e => updateCrextioConfig({ rulingsPrimaryBtnText: e.target.value })}
                className="w-full p-2 rounded-xl border border-stone-300 font-bold"
              />
            </div>
          </div>

          {/* Select Featured Rulings + Full Edit */}
          <div className="space-y-3 pt-2 border-t border-stone-200 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h5 className="font-black text-stone-900">
                انتخاب آراء قابل نمایش ({toPersianNumbers(selectedIds.length)} از {toPersianNumbers(baseList.length)}) و ویرایش کامل:
              </h5>
              <button
                type="button"
                onClick={handleAddRuling}
                className="px-3 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>افزودن رأی جدید به ویترین</span>
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {baseList.map((r, idx) => {
                const isSelected = selectedIds.includes(r.id);
                return (
                  <div
                    key={r.id}
                    className={`p-3.5 rounded-2xl border space-y-2.5 ${
                      isSelected ? 'bg-amber-50/40 border-amber-300' : 'bg-stone-50 border-stone-200 opacity-70'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => toggleSelectRuling(r.id)}
                        className="flex items-center gap-2 font-black text-xs cursor-pointer"
                      >
                        <span
                          className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                            isSelected ? 'bg-amber-700 text-white border-amber-800' : 'bg-white border-stone-300'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </span>
                        <span>نمایش رأی شماره {toPersianNumbers(idx + 1)} در ویترین</span>
                      </button>

                      {baseList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteRuling(r.id)}
                          className="text-rose-600 hover:text-rose-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="sm:col-span-2">
                        <label className="text-[10px] text-stone-500 block">عنوان رأی:</label>
                        <input
                          type="text"
                          value={r.title}
                          onChange={e => handleRulingFieldChange(r.id, { title: e.target.value })}
                          className="w-full p-1.5 rounded-lg bg-white border border-stone-300 font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-stone-500 block">موضوع / شعبه:</label>
                        <input
                          type="text"
                          value={r.courtBranch}
                          onChange={e => handleRulingFieldChange(r.id, { courtBranch: e.target.value })}
                          className="w-full p-1.5 rounded-lg bg-white border border-stone-300"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-stone-500 block">قاضی / مرجع صادرکننده:</label>
                        <input
                          type="text"
                          value={r.judgeName}
                          onChange={e => handleRulingFieldChange(r.id, { judgeName: e.target.value })}
                          className="w-full p-1.5 rounded-lg bg-white border border-stone-300"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-stone-500 block">تاریخ دادنامه:</label>
                        <input
                          type="text"
                          value={r.rulingDate}
                          onChange={e => handleRulingFieldChange(r.id, { rulingDate: e.target.value })}
                          className="w-full p-1.5 rounded-lg bg-white border border-stone-300"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-stone-500 block">خلاصه رأی (نمایش در حالت اول و خلاصه کارت):</label>
                      <textarea
                        rows={2}
                        value={r.summary}
                        onChange={e => handleRulingFieldChange(r.id, { summary: e.target.value })}
                        className="w-full p-1.5 rounded-lg bg-white border border-stone-300"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-stone-500 block">قواعد فقهی و مستندات (جداشده با ویرگول «،»):</label>
                      <input
                        type="text"
                        value={(r.legalPrinciples || []).join('، ')}
                        onChange={e =>
                          handleRulingFieldChange(r.id, {
                            legalPrinciples: e.target.value.split('،').map(s => s.trim()).filter(Boolean),
                          })
                        }
                        className="w-full p-1.5 rounded-lg bg-white border border-stone-300"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          </div>

          <div className="px-5 py-3.5 sm:px-6 flex items-center justify-between gap-2 border-t border-stone-200 shrink-0 bg-stone-50 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
            <span className="text-[11px] text-emerald-800 font-bold items-center gap-1 hidden sm:flex">
              <Edit3 className="w-3.5 h-3.5" />
              تمام تغییرات مستقیماً در MySQL ذخیره می‌شوند
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 min-h-[42px] rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-black text-xs shadow-md cursor-pointer mr-auto"
            >
              تایید و بستن
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
