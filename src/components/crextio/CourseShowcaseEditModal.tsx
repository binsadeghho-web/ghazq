import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Edit3,
  X,
  Eye,
  EyeOff,
  Check,
  Clock,
  Upload,
  Loader2,
  GraduationCap,
} from 'lucide-react';
import { Course, CrextioDashboardConfig } from '../../types';
import { api } from '../../services/apiClient';
import { resolveShowcaseImageUrl } from '../../data/showcaseImages';

interface CourseShowcaseEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCourses: Course[];
  crextioConfig: CrextioDashboardConfig;
  updateCrextioConfig: (updates: Partial<CrextioDashboardConfig>) => void;
}

export const CourseShowcaseEditModal: React.FC<CourseShowcaseEditModalProps> = ({
  isOpen,
  onClose,
  initialCourses,
  crextioConfig,
  updateCrextioConfig,
}) => {
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadTargetRef = useRef<string | null>(null);

  if (!isOpen) return null;

  const showPrice = crextioConfig.courseShowcaseShowPrice !== false;
  const selectedIds =
    crextioConfig.courseShowcaseSelectedIds && crextioConfig.courseShowcaseSelectedIds.length > 0
      ? crextioConfig.courseShowcaseSelectedIds
      : initialCourses.map(c => c.id);
  const customMap = crextioConfig.courseShowcaseCustomData || {};
  const intervalSeconds = Math.max(2, Number(crextioConfig.courseShowcaseInterval) || 5);
  const currentMode = crextioConfig.courseShowcaseMode || 'carousel';
  const showcaseCoverImg = resolveShowcaseImageUrl(
    'course_showcase',
    crextioConfig.showcaseImageOverrides
  );

  const displayCourses = initialCourses
    .filter(c => selectedIds.includes(c.id))
    .map(c => ({ ...c, ...(customMap[c.id] || {}) }));

  const toggleCourseSelection = (id: string) => {
    if (selectedIds.includes(id)) {
      if (selectedIds.length <= 1) return;
      updateCrextioConfig({
        courseShowcaseSelectedIds: selectedIds.filter(cId => cId !== id),
      });
    } else {
      updateCrextioConfig({
        courseShowcaseSelectedIds: [...selectedIds, id],
      });
    }
  };

  const handleUpdateCourseField = (id: string, field: keyof Course, val: any) => {
    updateCrextioConfig({
      courseShowcaseCustomData: {
        ...customMap,
        [id]: {
          ...(customMap[id] || {}),
          [field]: val,
        },
      },
    });
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const target = uploadTargetRef.current;
    if (!file || !target) return;
    setUploadingKey(target);
    try {
      const res = await api.uploadFile(file, 'misc');
      if (res?.url) {
        if (target === '__showcase__') {
          updateCrextioConfig({
            showcaseImageOverrides: {
              ...(crextioConfig.showcaseImageOverrides || {}),
              course_showcase: res.url,
            },
          });
        } else {
          handleUpdateCourseField(target, 'coverImage', res.url);
        }
      }
    } catch (err: any) {
      window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: `خطا در آپلود تصویر: ${err.message || 'خطای سرور'}`, type: 'error' } }));
    } finally {
      setUploadingKey(null);
      uploadTargetRef.current = null;
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
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={e => e.stopPropagation()}
          className="bg-white rounded-t-[26px] sm:rounded-3xl w-full max-w-3xl border border-stone-200 shadow-2xl text-stone-900 max-h-[92dvh] sm:max-h-[90vh] flex flex-col overflow-hidden"
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleUploadImage}
            className="hidden"
          />

          <div className="px-5 py-4 sm:px-6 flex items-center justify-between gap-2 border-b border-stone-200 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <GraduationCap className="w-5 h-5 text-emerald-800 shrink-0" />
              <h4 className="font-black text-xs sm:text-sm text-stone-900 truncate">
                مدیریت و ویرایش ۱۰۰٪ ویترین دوره‌های علمی
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

          {/* Mode + Timer + Price + Main Cover */}
          <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { id: 'carousel', title: '۱. اسلایدر دوره‌های منتخب (حالت اول)', desc: 'نمایش چرخشی خلاصه دوره‌ها با تایمر' },
                { id: 'grid', title: '۲. حالت شبکه‌ای ۳ ستونه', desc: 'نمایش همزمان کارت دوره‌های منتخب' },
                { id: 'compact', title: '۳. حالت فشرده نواری', desc: 'معرفی خطی و سریع دوره فعال' },
              ].map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => updateCrextioConfig({ courseShowcaseMode: m.id as any })}
                  className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                    currentMode === m.id
                      ? 'bg-emerald-900 text-white border-emerald-950 shadow-xs'
                      : 'bg-white text-stone-800 border-stone-200 hover:bg-emerald-100/50'
                  }`}
                >
                  <div className="text-xs font-black">{m.title}</div>
                  <div className={`text-[10px] mt-0.5 ${currentMode === m.id ? 'text-emerald-200' : 'text-stone-500'}`}>
                    {m.desc}
                  </div>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div>
                <label className="text-[11px] font-bold text-stone-700 flex items-center gap-1 mb-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-700" />
                  <span>زمان تعویض دوره (ثانیه):</span>
                </label>
                <input
                  type="number"
                  min={2}
                  max={60}
                  value={intervalSeconds}
                  onChange={e =>
                    updateCrextioConfig({
                      courseShowcaseInterval: Math.max(2, Number(e.target.value) || 5),
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-xl bg-white border border-stone-300 text-xs font-mono font-bold"
                />
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => updateCrextioConfig({ courseShowcaseShowPrice: !showPrice })}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                    showPrice ? 'bg-emerald-800 text-white' : 'bg-stone-200 text-stone-700'
                  }`}
                >
                  {showPrice ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>{showPrice ? 'مبلغ دوره‌ها: نمایش' : 'مبلغ دوره‌ها: مخفی'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {showcaseCoverImg && (
                  <img
                    src={showcaseCoverImg}
                    alt="پوستر ویترین دوره‌ها"
                    referrerPolicy="no-referrer"
                    className="w-10 h-9 rounded-lg object-cover border border-stone-300 shrink-0"
                  />
                )}
                <button
                  type="button"
                  disabled={uploadingKey === '__showcase__'}
                  onClick={() => {
                    uploadTargetRef.current = '__showcase__';
                    fileRef.current?.click();
                  }}
                  className="flex-1 px-2.5 py-2 rounded-xl bg-white hover:bg-stone-100 border border-stone-300 text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                >
                  {uploadingKey === '__showcase__' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  <span>تغییر عکس ویترین</span>
                </button>
              </div>
            </div>
          </div>

          {/* Header & CTA Texts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="font-bold text-stone-700 block mb-1">نشان بالای ویترین:</label>
              <input
                type="text"
                value={crextioConfig.courseShowcaseBadge || ''}
                onChange={e => updateCrextioConfig({ courseShowcaseBadge: e.target.value })}
                className="w-full p-2 rounded-xl border border-stone-300 font-bold"
              />
            </div>
            <div>
              <label className="font-bold text-stone-700 block mb-1">متن دکمه اقدام:</label>
              <input
                type="text"
                value={crextioConfig.courseShowcaseCtaText || ''}
                onChange={e => updateCrextioConfig({ courseShowcaseCtaText: e.target.value })}
                className="w-full p-2 rounded-xl border border-stone-300 font-bold"
              />
            </div>
            <div>
              <label className="font-bold text-stone-700 block mb-1">تیتر بخش (در حالت شبکه‌ای):</label>
              <input
                type="text"
                value={crextioConfig.courseShowcaseTitle || ''}
                onChange={e => updateCrextioConfig({ courseShowcaseTitle: e.target.value })}
                className="w-full p-2 rounded-xl border border-stone-300 font-bold"
              />
            </div>
            <div>
              <label className="font-bold text-stone-700 block mb-1">زیرعنوان بخش:</label>
              <input
                type="text"
                value={crextioConfig.courseShowcaseSubtitle || ''}
                onChange={e => updateCrextioConfig({ courseShowcaseSubtitle: e.target.value })}
                className="w-full p-2 rounded-xl border border-stone-300"
              />
            </div>
          </div>

          {/* Select Active Courses */}
          <div className="space-y-2 text-xs">
            <h5 className="font-black text-xs text-stone-900">
              انتخاب دوره‌های فعال جهت نمایش در ویترین (ذخیره در پایگاه داده):
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
              {initialCourses.map(c => {
                const isSelected = selectedIds.includes(c.id);
                return (
                  <div
                    key={c.id}
                    onClick={() => toggleCourseSelection(c.id)}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-300 font-bold text-emerald-950'
                        : 'bg-stone-50 border-stone-200 text-stone-500 opacity-60'
                    }`}
                  >
                    <div className="min-w-0 flex-1 pl-2">
                      <p className="truncate">{customMap[c.id]?.title || c.title}</p>
                      <p className="text-[10px] text-stone-500 font-normal">
                        مدرس: {customMap[c.id]?.instructor || c.instructor}
                      </p>
                    </div>
                    <span
                      className={`w-5 h-5 rounded-lg flex items-center justify-center border text-xs ${
                        isSelected
                          ? 'bg-emerald-800 text-white border-emerald-900'
                          : 'bg-white border-stone-300'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 100% Content + Cover Editing */}
          <div className="space-y-3 pt-3 border-t border-stone-200 text-xs">
            <h5 className="font-black text-xs text-stone-900">
              ویرایش ۱۰۰٪ محتوا و تصویر هر دوره در ویترین:
            </h5>
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {displayCourses.map(c => (
                <div key={c.id} className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-stone-500 block">عنوان دوره در ویترین:</label>
                      <input
                        type="text"
                        value={c.title}
                        onChange={e => handleUpdateCourseField(c.id, 'title', e.target.value)}
                        className="w-full p-1.5 text-xs font-bold bg-white rounded-lg border border-stone-300"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-stone-500 block">نام مدرس و استاد:</label>
                      <input
                        type="text"
                        value={c.instructor}
                        onChange={e => handleUpdateCourseField(c.id, 'instructor', e.target.value)}
                        className="w-full p-1.5 text-xs bg-white rounded-lg border border-stone-300"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 items-end">
                    <div>
                      <label className="text-[10px] text-stone-500 block">سطح علمی:</label>
                      <input
                        type="text"
                        value={c.level}
                        onChange={e => handleUpdateCourseField(c.id, 'level', e.target.value)}
                        className="w-full p-1.5 text-xs bg-white rounded-lg border border-stone-300"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-stone-500 block">مدت (ساعت):</label>
                      <input
                        type="number"
                        value={c.hours}
                        onChange={e =>
                          handleUpdateCourseField(c.id, 'hours', parseInt(e.target.value) || 0)
                        }
                        className="w-full p-1.5 text-xs bg-white rounded-lg border border-stone-300"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-stone-500 block">شهریه (تومان):</label>
                      <input
                        type="number"
                        value={c.price}
                        onChange={e =>
                          handleUpdateCourseField(c.id, 'price', parseInt(e.target.value) || 0)
                        }
                        className="w-full p-1.5 text-xs bg-white rounded-lg border border-stone-300"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={uploadingKey === c.id}
                      onClick={() => {
                        uploadTargetRef.current = c.id;
                        fileRef.current?.click();
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-stone-100 border border-stone-300 text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                    >
                      {uploadingKey === c.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Upload className="w-3 h-3" />
                      )}
                      <span>عکس دوره</span>
                    </button>
                  </div>

                  <div>
                    <label className="text-[10px] text-stone-500 block">توضیحات کوتاه ویترین:</label>
                    <textarea
                      rows={2}
                      value={c.description}
                      onChange={e => handleUpdateCourseField(c.id, 'description', e.target.value)}
                      className="w-full p-1.5 text-xs bg-white rounded-lg border border-stone-300 leading-relaxed"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          </div>

          <div className="px-5 py-3.5 sm:px-6 flex items-center justify-between gap-2 border-t border-stone-200 shrink-0 bg-stone-50 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
            <span className="text-[11px] text-emerald-800 font-bold items-center gap-1 hidden sm:flex">
              <Edit3 className="w-3.5 h-3.5" />
              تمام تغییرات به صورت زنده در MySQL ثبت می‌شوند
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 min-h-[42px] rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs shadow-md cursor-pointer mr-auto"
            >
              تایید و بستن
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
