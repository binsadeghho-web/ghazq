import React, { useRef, useState } from 'react';
import {
  CourseCustomField,
  CourseInstallmentPlan,
  CourseInstallmentPlanItem,
} from '../../../types';
import { api } from '../../../services/apiClient';
import { toPersianNumbers } from '../../../utils/persianNumbers';
import {
  UserCheck,
  UploadCloud,
  Loader2,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  CalendarClock,
  Target,
  Sparkles,
  Layers,
} from 'lucide-react';

const BUILT_IN_HIDEABLE_FIELDS: { key: string; label: string }[] = [
  { key: 'instructorResume', label: 'رزومه و سوابق استاد' },
  { key: 'necessity', label: 'ضرورت اجرای دوره' },
  { key: 'targetAudiences', label: 'مخاطبین هدف' },
  { key: 'managerNotes', label: 'توضیحات تکمیلی مدیر' },
  { key: 'holdingTime', label: 'ساعت و زمان برگزاری' },
  { key: 'capacity', label: 'ظرفیت باقی‌مانده و کل' },
  { key: 'topics', label: 'سرفصل‌های آموزشی' },
  { key: 'prerequisites', label: 'پیش‌نیازها' },
  { key: 'certificate', label: 'گواهی پایان دوره' },
  { key: 'installments', label: 'جدول پرداخت اقساطی' },
  { key: 'price', label: 'مبلغ شهریه' },
];

const QUICK_AUDIENCE_OPTIONS = [
  'طلاب سطوح عالی و خارج',
  'قضات دادگستری',
  'وکلای پایه یک',
  'دانشجویان و پژوهشگران حقوق',
  'کارشناسان رسمی قوه قضاییه',
];

interface CourseBuilderAdvancedTabsProps {
  instructorTitle: string;
  onInstructorTitleChange: (val: string) => void;
  instructorAvatarUrl: string;
  onInstructorAvatarChange: (val: string) => void;
  instructorResume: string;
  onInstructorResumeChange: (val: string) => void;
  holdingTime: string;
  onHoldingTimeChange: (val: string) => void;
  necessity: string;
  onNecessityChange: (val: string) => void;
  managerNotes: string;
  onManagerNotesChange: (val: string) => void;
  targetAudiences: string[];
  onTargetAudiencesChange: (val: string[]) => void;
  customFields: CourseCustomField[];
  onCustomFieldsChange: (val: CourseCustomField[]) => void;
  hiddenFields: string[];
  onHiddenFieldsChange: (val: string[]) => void;
  hasInstallments: boolean;
  onHasInstallmentsChange: (val: boolean) => void;
  installmentPlan: CourseInstallmentPlan;
  onInstallmentPlanChange: (val: CourseInstallmentPlan) => void;
  coursePrice: number;
}

export const CourseBuilderAdvancedTabs: React.FC<CourseBuilderAdvancedTabsProps> = ({
  instructorTitle,
  onInstructorTitleChange,
  instructorAvatarUrl,
  onInstructorAvatarChange,
  instructorResume,
  onInstructorResumeChange,
  holdingTime,
  onHoldingTimeChange,
  necessity,
  onNecessityChange,
  managerNotes,
  onManagerNotesChange,
  targetAudiences,
  onTargetAudiencesChange,
  customFields,
  onCustomFieldsChange,
  hiddenFields,
  onHiddenFieldsChange,
  hasInstallments,
  onHasInstallmentsChange,
  installmentPlan,
  onInstallmentPlanChange,
  coursePrice,
}) => {
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [newAudience, setNewAudience] = useState('');
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError(null);
    setUploadingAvatar(true);
    try {
      const uploaded = await api.uploadFile(file, 'course');
      onInstructorAvatarChange(uploaded.url);
    } catch (err: any) {
      setAvatarError(err?.message || 'خطا در بارگذاری تصویر استاد.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const toggleAudience = (aud: string) => {
    if (targetAudiences.includes(aud)) {
      onTargetAudiencesChange(targetAudiences.filter(a => a !== aud));
    } else {
      onTargetAudiencesChange([...targetAudiences, aud]);
    }
  };

  const addCustomAudience = () => {
    const clean = newAudience.trim();
    if (!clean) return;
    if (!targetAudiences.includes(clean)) {
      onTargetAudiencesChange([...targetAudiences, clean]);
    }
    setNewAudience('');
  };

  const toggleHiddenField = (key: string) => {
    if (hiddenFields.includes(key)) {
      onHiddenFieldsChange(hiddenFields.filter(k => k !== key));
    } else {
      onHiddenFieldsChange([...hiddenFields, key]);
    }
  };

  const addCustomField = () => {
    if (!newFieldLabel.trim()) return;
    onCustomFieldsChange([
      ...customFields,
      {
        id: `cf_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        label: newFieldLabel.trim(),
        value: newFieldValue.trim(),
        visible: true,
      },
    ]);
    setNewFieldLabel('');
    setNewFieldValue('');
  };

  const updateInstallmentItem = (idx: number, patch: Partial<CourseInstallmentPlanItem>) => {
    const nextItems = installmentPlan.items.map((item, i) => (i === idx ? { ...item, ...patch } : item));
    onInstallmentPlanChange({
      ...installmentPlan,
      items: nextItems,
      count: nextItems.length,
    });
  };

  const addInstallmentItem = () => {
    const nextNum = installmentPlan.items.length + 1;
    const futureDate = new Date(Date.now() + (nextNum - 1) * 30 * 86400 * 1000);
    const iso = futureDate.toISOString().slice(0, 10);
    const jalali = futureDate.toLocaleDateString('fa-IR');
    const nextItems: CourseInstallmentPlanItem[] = [
      ...installmentPlan.items,
      {
        installmentNumber: nextNum,
        title: `قسط ${toPersianNumbers(nextNum)}`,
        percentage: Math.round(100 / nextNum),
        fixedAmount: coursePrice > 0 ? Math.round(coursePrice / nextNum) : 0,
        dueDateIso: iso,
        dueDateJalali: jalali,
      },
    ];
    onInstallmentPlanChange({
      ...installmentPlan,
      enabled: true,
      count: nextItems.length,
      items: nextItems,
    });
  };

  const removeInstallmentItem = (idx: number) => {
    const nextItems = installmentPlan.items
      .filter((_, i) => i !== idx)
      .map((item, i) => ({ ...item, installmentNumber: i + 1 }));
    onInstallmentPlanChange({
      ...installmentPlan,
      count: nextItems.length,
      items: nextItems,
    });
  };

  return (
    <div className="space-y-6">
      {/* A. Instructor Title, Avatar & Resume */}
      <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
        <h4 className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-1.5">
          <UserCheck className="w-4 h-4" />
          <span>۷. رزومه جامع، مرتبه علمی و تصویر استاد:</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              مرتبه علمی / سمت استاد:
            </label>
            <input
              type="text"
              value={instructorTitle}
              onChange={e => onInstructorTitleChange(e.target.value)}
              placeholder="مثال: مدرس خارج فقه و قاضی دیوان عالی کشور"
              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
            {instructorAvatarUrl ? (
              <img
                src={instructorAvatarUrl}
                alt="تصویر استاد"
                className="w-12 h-12 rounded-xl object-cover border border-emerald-500/30 shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center shrink-0">
                <UserCheck className="w-5 h-5 text-slate-400" />
              </div>
            )}
            <div className="flex-1 space-y-1">
              <button
                type="button"
                disabled={uploadingAvatar}
                onClick={() => avatarInputRef.current?.click()}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                {uploadingAvatar ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                <span>{uploadingAvatar ? 'در حال آپلود...' : 'بارگذاری عکس استاد روی سرور'}</span>
              </button>
              {avatarError && <span className="text-[10px] text-rose-600 block">{avatarError}</span>}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
            رزومه علمی، تالیفات و سوابق تدریس استاد:
          </label>
          <textarea
            rows={3}
            value={instructorResume}
            onChange={e => onInstructorResumeChange(e.target.value)}
            placeholder="سوابق تدریس در حوزه و دانشگاه، تالیفات فقهی-حقوقی، سوابق قضایی و علمی استاد..."
            className="w-full p-3 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 resize-none leading-relaxed"
          />
        </div>
      </div>

      {/* B. Target Audiences, Holding Time, Necessity & Manager Notes */}
      <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
        <h4 className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-1.5">
          <Target className="w-4 h-4" />
          <span>۸. ساعت برگزاری، مخاطبین هدف، ضرورت دوره و توضیحات مدیر:</span>
        </h4>

        <div>
          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
            ساعت دقیق برگزاری دوره:
          </label>
          <input
            type="text"
            value={holdingTime}
            onChange={e => onHoldingTimeChange(e.target.value)}
            placeholder="مثال: پنج‌شنبه‌ها ساعت ۱۶:۰۰ الی ۱۸:۳۰"
            className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
            مخاطبین هدف دوره (انتخاب گروهی یا افزودن دستی):
          </label>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_AUDIENCE_OPTIONS.map(opt => {
              const selected = targetAudiences.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggleAudience(opt)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                    selected
                      ? 'bg-sky-600 text-white border-sky-500'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                  }`}
                >
                  {selected ? '✓ ' : '+ '}
                  {opt}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newAudience}
              onChange={e => setNewAudience(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustomAudience();
                }
              }}
              placeholder="افزودن مخاطب هدف دلخواه..."
              className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
            />
            <button
              type="button"
              onClick={addCustomAudience}
              className="px-3 py-1.5 rounded-xl bg-slate-800 text-white text-xs font-bold cursor-pointer"
            >
              افزودن
            </button>
          </div>
          {targetAudiences.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {targetAudiences.map(aud => (
                <span
                  key={aud}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-500/15 text-sky-700 dark:text-sky-300 text-[11px] font-bold"
                >
                  <span>{aud}</span>
                  <button type="button" onClick={() => toggleAudience(aud)} className="text-rose-500 cursor-pointer">
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              ضرورت‌های اجرای دوره:
            </label>
            <textarea
              rows={3}
              value={necessity}
              onChange={e => onNecessityChange(e.target.value)}
              placeholder="چرایی و ضرورت برگزاری این دوره تخصصی و حل نیازهای قضایی و پژوهشی..."
              className="w-full p-2.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 resize-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              توضیحات تکمیلی و نکات مدیر آموزش:
            </label>
            <textarea
              rows={3}
              value={managerNotes}
              onChange={e => onManagerNotesChange(e.target.value)}
              placeholder="توضیحات اضافی، ضوابط امتیاز پژوهشی یا توصیه‌های مدیر..."
              className="w-full p-2.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 resize-none"
            />
          </div>
        </div>
      </div>

      {/* C. Dynamic Fields Builder & Hidden Built-in Fields */}
      <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
        <h4 className="text-xs font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-1.5">
          <Layers className="w-4 h-4" />
          <span>۹. سفارشی‌سازی فیلدها (افزودن فیلد جدید یا کسر فیلدهای پیش‌فرض توسط مدیر):</span>
        </h4>

        <div>
          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1.5">
            کسر / مخفی‌سازی فیلدهای پیش‌فرض برای این دوره (فیلدهای انتخاب‌شده مخفی می‌شوند):
          </span>
          <div className="flex flex-wrap gap-1.5">
            {BUILT_IN_HIDEABLE_FIELDS.map(f => {
              const isHidden = hiddenFields.includes(f.key);
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => toggleHiddenField(f.key)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border flex items-center gap-1 cursor-pointer transition-all ${
                    isHidden
                      ? 'bg-rose-500/15 border-rose-500/40 text-rose-700 dark:text-rose-300 line-through'
                      : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {isHidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3 text-emerald-500" />}
                  <span>{f.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-2 space-y-2 border-t border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>افزودن فیلد سفارشی جدید توسط ادمین:</span>
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
            <input
              type="text"
              value={newFieldLabel}
              onChange={e => setNewFieldLabel(e.target.value)}
              placeholder="عنوان فیلد (مثلاً: امتیاز ضمن خدمت)"
              className="sm:col-span-2 px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
            />
            <input
              type="text"
              value={newFieldValue}
              onChange={e => setNewFieldValue(e.target.value)}
              placeholder="مقدار / توضیح فیلد..."
              className="sm:col-span-2 px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
            />
            <button
              type="button"
              onClick={addCustomField}
              className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>افزودن فیلد</span>
            </button>
          </div>

          {customFields.length > 0 && (
            <div className="space-y-2 pt-1">
              {customFields.map((cf, idx) => (
                <div
                  key={cf.id}
                  className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2 text-xs"
                >
                  <input
                    type="text"
                    value={cf.label}
                    onChange={e => {
                      const next = customFields.map((x, i) => (i === idx ? { ...x, label: e.target.value } : x));
                      onCustomFieldsChange(next);
                    }}
                    className="w-40 px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 font-bold"
                  />
                  <input
                    type="text"
                    value={cf.value}
                    onChange={e => {
                      const next = customFields.map((x, i) => (i === idx ? { ...x, value: e.target.value } : x));
                      onCustomFieldsChange(next);
                    }}
                    className="flex-1 min-w-[160px] px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const next = customFields.map((x, i) => (i === idx ? { ...x, visible: !cf.visible } : x));
                      onCustomFieldsChange(next);
                    }}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer ${
                      cf.visible !== false
                        ? 'bg-emerald-500/15 text-emerald-700'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {cf.visible !== false ? 'نمایش فعال' : 'مخفی'}
                  </button>
                  <button
                    type="button"
                    onClick={() => onCustomFieldsChange(customFields.filter((_, i) => i !== idx))}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* D. Scheduled Installment Plan Table */}
      <div className="space-y-3 p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200 dark:border-emerald-900/40 pb-2">
          <h4 className="text-xs font-black text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
            <CalendarClock className="w-4 h-4" />
            <span>۱۰. زمان‌بندی سررسید اقساط (بازشدن خودکار درگاه پرداخت در پنل کاربر):</span>
          </h4>

          <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
            <input
              type="checkbox"
              checked={hasInstallments && installmentPlan.enabled}
              onChange={e => {
                const checked = e.target.checked;
                onHasInstallmentsChange(checked);
                onInstallmentPlanChange({
                  ...installmentPlan,
                  enabled: checked,
                  count: installmentPlan.items.length,
                });
              }}
              className="rounded text-emerald-600"
            />
            <span>فعال‌سازی جدول سررسید اقساط هوشمند</span>
          </label>
        </div>

        {hasInstallments && installmentPlan.enabled && (
          <div className="space-y-2.5">
            {installmentPlan.items.map((item, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/50 text-xs items-center"
              >
                <div className="sm:col-span-3">
                  <span className="text-[10px] text-slate-400 block">عنوان قسط</span>
                  <input
                    type="text"
                    value={item.title}
                    onChange={e => updateInstallmentItem(idx, { title: e.target.value })}
                    className="w-full px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 font-bold"
                  />
                </div>
                <div className="sm:col-span-2">
                  <span className="text-[10px] text-slate-400 block">درصد شهریه</span>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={item.percentage ?? 0}
                    onChange={e => updateInstallmentItem(idx, { percentage: Number(e.target.value) })}
                    className="w-full px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <span className="text-[10px] text-slate-400 block">مبلغ ثابت (اختیاری)</span>
                  <input
                    type="number"
                    min={0}
                    value={item.fixedAmount ?? 0}
                    onChange={e => updateInstallmentItem(idx, { fixedAmount: Number(e.target.value) })}
                    className="w-full px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <span className="text-[10px] text-slate-400 block">سررسید میلادی (تریگر خودکار)</span>
                  <input
                    type="date"
                    value={item.dueDateIso}
                    onChange={e => updateInstallmentItem(idx, { dueDateIso: e.target.value })}
                    className="w-full px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 font-mono text-[11px]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <span className="text-[10px] text-slate-400 block">تاریخ نمایشی شمسی</span>
                  <input
                    type="text"
                    value={item.dueDateJalali}
                    onChange={e => updateInstallmentItem(idx, { dueDateJalali: e.target.value })}
                    className="w-full px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div className="sm:col-span-1 flex justify-end pt-3">
                  <button
                    type="button"
                    onClick={() => removeInstallmentItem(idx)}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                    title="حذف قسط"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addInstallmentItem}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>افزودن ردیف قسط و تاریخ سررسید</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
