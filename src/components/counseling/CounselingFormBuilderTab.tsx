import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Plus,
  Trash2,
  Save,
  ChevronUp,
  ChevronDown,
  Layers,
  Check,
  Info,
} from 'lucide-react';
import {
  DynamicWizardStep,
  DynamicWizardField,
  DynamicWizardFieldType,
  SpecializedCounselingPortalConfig,
  GeneralCounselingPortalConfig,
} from '../../types';
import { useApp } from '../../context/AppContext';
import { CounselingFieldsManager } from './CounselingFieldsManager';
import { toPersianNumbers } from '../../utils/persianNumbers';

interface CounselingFormBuilderTabProps {
  counselingType: 'general' | 'specialized_career';
}

const FIELD_TYPES: Array<{ id: DynamicWizardFieldType; label: string }> = [
  { id: 'text', label: 'متن کوتاه (تک‌خطی)' },
  { id: 'textarea', label: 'توضیحات تشریحی (چندخطی)' },
  { id: 'radio', label: 'انتخاب تک‌گزینه‌ای (رادیویی)' },
  { id: 'select', label: 'فهرست بازشو (Select)' },
  { id: 'checkbox', label: 'انتخاب چندگزینه‌ای (Checkbox)' },
];

export const CounselingFormBuilderTab: React.FC<CounselingFormBuilderTabProps> = ({ counselingType }) => {
  const {
    specializedConfig,
    generalConfig,
    updateSpecializedConfig,
    updateGeneralConfig,
  } = useApp();

  const sourceConfig = counselingType === 'specialized_career' ? specializedConfig : generalConfig;
  const [draft, setDraft] = useState<any>(() => JSON.parse(JSON.stringify(sourceConfig)));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(JSON.parse(JSON.stringify(sourceConfig)));
  }, [sourceConfig]);

  const steps: DynamicWizardStep[] = Array.isArray(draft.wizardSteps) ? draft.wizardSteps : [];

  const handleSavePortal = async () => {
    setSaving(true);
    try {
      if (counselingType === 'specialized_career') {
        await updateSpecializedConfig(draft as Partial<SpecializedCounselingPortalConfig>);
      } else {
        await updateGeneralConfig(draft as Partial<GeneralCounselingPortalConfig>);
      }
    } finally {
      setSaving(false);
    }
  };

  const addStep = () => {
    const nextIdx = steps.length + 1;
    const newStep: DynamicWizardStep = {
      id: `step_${Date.now()}`,
      title: `مرحله جدید ${toPersianNumbers(nextIdx)}`,
      subtitle: '',
      enabled: true,
      order: nextIdx,
      fields: [
        {
          id: `fld_${Date.now()}`,
          key: `field_${Date.now()}`,
          label: 'عنوان سوال یا فیلد',
          type: 'text',
          placeholder: '',
          required: true,
          enabled: true,
          order: 1,
        },
      ],
    };
    setDraft({ ...draft, wizardSteps: [...steps, newStep] });
  };

  const updateStep = (stepId: string, updates: Partial<DynamicWizardStep>) => {
    setDraft({
      ...draft,
      wizardSteps: steps.map(s => (s.id === stepId ? { ...s, ...updates } : s)),
    });
  };

  const removeStep = (stepId: string) => {
    setDraft({
      ...draft,
      wizardSteps: steps
        .filter(s => s.id !== stepId)
        .map((s, i) => ({ ...s, order: i + 1 })),
    });
  };

  const moveStep = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= steps.length) return;
    const next = [...steps];
    const tmp = next[idx];
    next[idx] = next[target];
    next[target] = tmp;
    setDraft({
      ...draft,
      wizardSteps: next.map((s, i) => ({ ...s, order: i + 1 })),
    });
  };

  const addFieldToStep = (stepId: string) => {
    setDraft({
      ...draft,
      wizardSteps: steps.map(s => {
        if (s.id !== stepId) return s;
        const fields = s.fields || [];
        const nf: DynamicWizardField = {
          id: `fld_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
          key: `custom_${Date.now()}`,
          label: 'سوال یا فیلد جدید',
          type: 'text',
          placeholder: '',
          options: ['گزینه اول', 'گزینه دوم'],
          required: false,
          enabled: true,
          order: fields.length + 1,
        };
        return { ...s, fields: [...fields, nf] };
      }),
    });
  };

  const updateFieldInStep = (stepId: string, fieldId: string, updates: Partial<DynamicWizardField>) => {
    setDraft({
      ...draft,
      wizardSteps: steps.map(s => {
        if (s.id !== stepId) return s;
        return {
          ...s,
          fields: (s.fields || []).map(f => (f.id === fieldId ? { ...f, ...updates } : f)),
        };
      }),
    });
  };

  const removeFieldFromStep = (stepId: string, fieldId: string) => {
    setDraft({
      ...draft,
      wizardSteps: steps.map(s => {
        if (s.id !== stepId) return s;
        return {
          ...s,
          fields: (s.fields || []).filter(f => f.id !== fieldId),
        };
      }),
    });
  };

  return (
    <div className="space-y-6 text-xs">
      {/* 1. Counseling Fields CRUD ("زمینه‌های مشاوره") */}
      <CounselingFieldsManager counselingType={counselingType} />

      {/* 2. Landing Copy & Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800 space-y-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-600" />
              <span>تنظیمات صفحه ورودی، دکمه توضیحات و قوانین نمایش</span>
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              تمامی متون و تنظیمات پس از کلیک بر روی «ذخیره در پایگاه داده» به‌صورت زنده برای دانش‌آموختگان اعمال می‌شود.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSavePortal}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50 shrink-0"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'در حال ذخیره...' : 'ذخیره در پایگاه داده'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">عنوان اصلی صفحه ورودی</label>
            <input
              type="text"
              value={draft.landingIntroTitle || ''}
              onChange={e => setDraft({ ...draft, landingIntroTitle: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">متن دکمه شروع ثبت درخواست (CTA)</label>
            <input
              type="text"
              value={draft.ctaButtonLabel || ''}
              onChange={e => setDraft({ ...draft, ctaButtonLabel: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>
        </div>

        <div>
          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">متن معرفی صفحه ورودی</label>
          <textarea
            rows={2}
            value={draft.landingIntroBody || ''}
            onChange={e => setDraft({ ...draft, landingIntroBody: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 leading-relaxed"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">تیتر باکس فراخوان (Callout)</label>
            <input
              type="text"
              value={draft.landingCalloutTitle || ''}
              onChange={e => setDraft({ ...draft, landingCalloutTitle: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">متن دکمه راهنما (همیشه نمایش داده می‌شود)</label>
            <input
              type="text"
              value={draft.descriptionButtonLabel || 'توضیحات'}
              onChange={e => setDraft({ ...draft, descriptionButtonLabel: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center gap-2 font-black text-slate-800 dark:text-slate-200">
            <Info className="w-4 h-4 text-amber-500" />
            <span>محتوای پنجره «توضیحات» (در صفحه اول و تمامی مراحل فرم در دسترس است)</span>
          </div>
          <input
            type="text"
            value={draft.descriptionModalTitle || ''}
            onChange={e => setDraft({ ...draft, descriptionModalTitle: e.target.value })}
            placeholder="عنوان پنجره توضیحات"
            className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold"
          />
          <textarea
            rows={3}
            value={draft.descriptionModalBody || ''}
            onChange={e => setDraft({ ...draft, descriptionModalBody: e.target.value })}
            placeholder="متن کامل راهنما و توضیحات..."
            className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 leading-relaxed"
          />
        </div>

        {/* Role/Feature Specific Toggle */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {counselingType === 'specialized_career' ? (
            <label className="flex items-center justify-between p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20 cursor-pointer">
              <div>
                <span className="font-black text-slate-900 dark:text-white block">
                  نمایش نام و توضیحات مشاوران به دانش‌آموختگان
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  در صورت فعال بودن، سربرگ مشاوران و امکان انتخاب مشاور در مرحله پایانی فرم نمایش داده می‌شود.
                </span>
              </div>
              <input
                type="checkbox"
                checked={Boolean(draft.showAdvisorsToStudents)}
                onChange={e => setDraft({ ...draft, showAdvisorsToStudents: e.target.checked })}
                className="w-5 h-5 accent-emerald-600 cursor-pointer"
              />
            </label>
          ) : (
            <label className="flex items-center justify-between p-4 rounded-2xl border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 cursor-pointer">
              <div>
                <span className="font-black text-slate-900 dark:text-white block">
                  نمایش دکمه «اطلاع از نرخ نامه مشاوره مرکز» در مرحله نهایی فرم
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  در صورت فعال بودن، متقاضی در مرحله آخر ثبت درخواست می‌تواند جدول نرخ‌نامه را باز کند.
                </span>
              </div>
              <input
                type="checkbox"
                checked={Boolean(draft.showRatesInWizardEnd)}
                onChange={e => setDraft({ ...draft, showRatesInWizardEnd: e.target.checked })}
                className="w-5 h-5 accent-amber-600 cursor-pointer"
              />
            </label>
          )}

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">پیام تایید نهایی پس از ثبت درخواست</label>
            <textarea
              rows={2}
              value={draft.submissionSuccessMessage || ''}
              onChange={e => setDraft({ ...draft, submissionSuccessMessage: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>
        </div>
      </div>

      {/* 3. Dynamic 100% Admin-Editable Wizard Steps & Fields Builder */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800 space-y-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>طراح ۱۰۰٪ پویای مراحل و فیلدهای ویزارد ثبت درخواست</span>
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              مراحل فرم را اضافه یا حذف کنید و برای هر مرحله فیلدهای متنی، تشریحی، تک‌گزینه‌ای یا چندگزینه‌ای بسازید.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={addStep}
              className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-amber-300" />
              <span>افزودن مرحله جدید</span>
            </button>
            <button
              type="button"
              onClick={handleSavePortal}
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{saving ? 'در حال ذخیره...' : 'ثبت نهایی ساختار فرم'}</span>
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {steps.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-slate-500">
              هنوز هیچ مرحله سفارشی‌ای تعریف نشده است. روی «افزودن مرحله جدید» کلیک کنید.
            </div>
          ) : (
            steps.map((step, sIdx) => (
              <div
                key={step.id}
                className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/70 dark:border-slate-700">
                  <div className="flex items-center gap-2.5 flex-1">
                    <span className="w-7 h-7 rounded-xl bg-emerald-700 text-white font-black flex items-center justify-center shrink-0">
                      {toPersianNumbers(sIdx + 1)}
                    </span>
                    <input
                      type="text"
                      value={step.title}
                      onChange={e => updateStep(step.id, { title: e.target.value })}
                      placeholder="عنوان مرحله"
                      className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-black"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={step.enabled}
                        onChange={e => updateStep(step.id, { enabled: e.target.checked })}
                        className="accent-emerald-600"
                      />
                      <span className="font-bold">فعال</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => moveStep(sIdx, -1)}
                      disabled={sIdx === 0}
                      className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveStep(sIdx, 1)}
                      disabled={sIdx === steps.length - 1}
                      className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeStep(step.id)}
                      className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-600 border border-rose-200 dark:border-rose-900 cursor-pointer"
                      title="حذف مرحله"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <input
                  type="text"
                  value={step.subtitle || ''}
                  onChange={e => updateStep(step.id, { subtitle: e.target.value })}
                  placeholder="توضیح کوتاه بالای این مرحله (اختیاری)..."
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                />

                {/* Step Fields */}
                <div className="space-y-2.5 pr-3 border-r-2 border-emerald-500/30">
                  {(step.fields || []).map(fld => (
                    <div
                      key={fld.id}
                      className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2.5"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                        <input
                          type="text"
                          value={fld.label}
                          onChange={e => updateFieldInStep(step.id, fld.id, { label: e.target.value })}
                          placeholder="عنوان فیلد / سوال"
                          className="sm:col-span-5 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                        />

                        <select
                          value={fld.type}
                          onChange={e => updateFieldInStep(step.id, fld.id, { type: e.target.value as DynamicWizardFieldType })}
                          className="sm:col-span-3 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                        >
                          {FIELD_TYPES.map(t => (
                            <option key={t.id} value={t.id}>{t.label}</option>
                          ))}
                        </select>

                        <label className="sm:col-span-2 flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={fld.required}
                            onChange={e => updateFieldInStep(step.id, fld.id, { required: e.target.checked })}
                            className="accent-rose-600"
                          />
                          <span className="font-bold">اجباری</span>
                        </label>

                        <div className="sm:col-span-2 flex items-center justify-end gap-1">
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={fld.enabled}
                              onChange={e => updateFieldInStep(step.id, fld.id, { enabled: e.target.checked })}
                              className="accent-emerald-600"
                            />
                            <span>فعال</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => removeFieldFromStep(step.id, fld.id)}
                            className="p-1 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {(fld.type === 'select' || fld.type === 'radio' || fld.type === 'checkbox') ? (
                        <div>
                          <label className="block text-[11px] text-slate-500 mb-1">گزینه‌ها (هر گزینه را با کاما یا خط جدید جدا کنید):</label>
                          <input
                            type="text"
                            value={(fld.options || []).join('، ')}
                            onChange={e =>
                              updateFieldInStep(step.id, fld.id, {
                                options: e.target.value.split(/[،,\n]/).map(s => s.trim()).filter(Boolean),
                              })
                            }
                            placeholder="گزینه ۱، گزینه ۲، گزینه ۳"
                            className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                          />
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={fld.placeholder || ''}
                          onChange={e => updateFieldInStep(step.id, fld.id, { placeholder: e.target.value })}
                          placeholder="متن راهنمای داخل فیلد (Placeholder)..."
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                        />
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => addFieldToStep(step.id)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>افزودن فیلد به این مرحله</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
