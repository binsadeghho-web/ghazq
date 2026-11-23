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
  MapPin,
  FileText,
  Compass,
  ShieldCheck,
  LayoutGrid,
} from 'lucide-react';
import {
  DynamicWizardStep,
  DynamicWizardField,
  DynamicWizardFieldType,
  CounselingLandingInfoCard,
  SpecializedCounselingPortalConfig,
  GeneralCounselingPortalConfig,
} from '../../types';
import { useApp } from '../../context/AppContext';
import { CounselingFieldsManager } from './CounselingFieldsManager';
import { toPersianNumbers } from '../../utils/persianNumbers';
import { isReadOnlyObserverRole } from '../../utils/rbacPolicy';

interface CounselingFormBuilderTabProps {
  counselingType: 'general' | 'specialized_career';
}

const FIELD_TYPES: Array<{ id: DynamicWizardFieldType; label: string }> = [
  { id: 'text', label: 'متن کوتاه (تک‌خطی)' },
  { id: 'textarea', label: 'توضیحات تشریحی (چندخطی)' },
  { id: 'radio', label: 'انتخاب تک‌گزینه‌ای (رادیویی)' },
  { id: 'select', label: 'فهرست بازشو (Select)' },
  { id: 'checkbox', label: 'انتخاب چندگزینه‌ای (Checkbox)' },
  { id: 'location_city', label: 'مکان برگزاری (قم / سایر شهرها)' },
  { id: 'time_preference', label: 'زمان برگزاری (صبح/عصر · وسط/آخر هفته)' },
];

export const CounselingFormBuilderTab: React.FC<CounselingFormBuilderTabProps> = ({ counselingType }) => {
  const {
    currentUser,
    specializedConfig,
    generalConfig,
    updateSpecializedConfig,
    updateGeneralConfig,
  } = useApp();

  const isObserver = isReadOnlyObserverRole(currentUser?.role);
  const sourceConfig = counselingType === 'specialized_career' ? specializedConfig : generalConfig;
  const [draft, setDraft] = useState<any>(() => JSON.parse(JSON.stringify(sourceConfig)));
  const [saving, setSaving] = useState(false);
  const [builderSubTab, setBuilderSubTab] = useState<'fields_cities' | 'page_content' | 'wizard_steps'>('fields_cities');
  const [newCityInput, setNewCityInput] = useState('');

  useEffect(() => {
    setDraft(JSON.parse(JSON.stringify(sourceConfig)));
  }, [sourceConfig.version, counselingType]);

  const steps: DynamicWizardStep[] = Array.isArray(draft.wizardSteps) ? draft.wizardSteps : [];
  const otherCities: string[] = Array.isArray(draft.otherCities) ? draft.otherCities : [];
  const infoCards: CounselingLandingInfoCard[] = Array.isArray(draft.landingInfoCards) ? draft.landingInfoCards : [];

  const handleSavePortal = async () => {
    if (isObserver) return;
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

  // --- Cities Management ("سایر شهرها") ---
  const addCity = () => {
    if (isObserver) return;
    const clean = newCityInput.trim();
    if (!clean) return;
    if (otherCities.includes(clean)) {
      setNewCityInput('');
      return;
    }
    setDraft({ ...draft, otherCities: [...otherCities, clean] });
    setNewCityInput('');
  };

  const updateCityAt = (idx: number, value: string) => {
    const next = [...otherCities];
    next[idx] = value;
    setDraft({ ...draft, otherCities: next });
  };

  const moveCity = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= otherCities.length) return;
    const next = [...otherCities];
    const tmp = next[idx];
    next[idx] = next[target];
    next[target] = tmp;
    setDraft({ ...draft, otherCities: next });
  };

  const removeCityAt = (idx: number) => {
    setDraft({
      ...draft,
      otherCities: otherCities.filter((_, i) => i !== idx),
    });
  };

  // --- Custom Landing Info Cards ---
  const addInfoCard = () => {
    const card: CounselingLandingInfoCard = {
      id: `card_${Date.now()}`,
      badge: 'نکته مهم',
      title: 'عنوان کارت راهنما',
      body: 'توضیحات تکمیلی درباره این خدمت یا راهنمای مراجعان...',
      enabled: true,
    };
    setDraft({ ...draft, landingInfoCards: [...infoCards, card] });
  };

  const updateInfoCard = (id: string, updates: Partial<CounselingLandingInfoCard>) => {
    setDraft({
      ...draft,
      landingInfoCards: infoCards.map(c => (c.id === id ? { ...c, ...updates } : c)),
    });
  };

  const removeInfoCard = (id: string) => {
    setDraft({
      ...draft,
      landingInfoCards: infoCards.filter(c => c.id !== id),
    });
  };

  // --- Dynamic Wizard Steps & Fields ---
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
          primaryCityLabel: 'قم',
          otherCitiesLabel: 'سایر شهرها',
          dayTimeOptions: ['صبح', 'عصر'],
          weekPeriodOptions: ['وسط هفته', 'آخر هفته'],
          undecidedLabel: 'فعلاً مشخص نیست',
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

  const moveFieldInStep = (stepId: string, fIdx: number, dir: -1 | 1) => {
    setDraft({
      ...draft,
      wizardSteps: steps.map(s => {
        if (s.id !== stepId) return s;
        const fields = [...(s.fields || [])];
        const target = fIdx + dir;
        if (target < 0 || target >= fields.length) return s;
        const tmp = fields[fIdx];
        fields[fIdx] = fields[target];
        fields[target] = tmp;
        return { ...s, fields: fields.map((fl, i) => ({ ...fl, order: i + 1 })) };
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
      {isObserver && (
        <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 text-sky-900 dark:text-sky-200 font-bold">
          حالت ناظر کل (فقط مشاهده): می‌توانید ساختار فرم و تنظیمات صفحه را ببینید، اما امکان ایجاد تغییر یا ذخیره وجود ندارد.
        </div>
      )}

      {/* Top Sticky Save Bar + Builder Sub-Navigation */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
          {[
            { id: 'fields_cities', label: 'زمینه‌های مشاوره و لیست شهرها', icon: Compass },
            { id: 'page_content', label: 'ویرایش ۱۰۰٪ محتوای صفحه و کارت‌ها', icon: FileText },
            { id: 'wizard_steps', label: 'طراح مراحل و فیلدهای فرم', icon: Layers },
          ].map(tab => {
            const Icon = tab.icon;
            const active = builderSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setBuilderSubTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-xl font-bold whitespace-nowrap flex items-center gap-2 transition-all cursor-pointer ${
                  active
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {!isObserver && (
          <button
            type="button"
            onClick={handleSavePortal}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50 shrink-0"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'در حال ذخیره...' : 'ذخیره تغییرات صفحه و فرم'}</span>
          </button>
        )}
      </div>

      {/* Sub-Tab 1: Counseling Fields + Other Cities Manager */}
      {builderSubTab === 'fields_cities' && (
        <div className="space-y-6">
          <CounselingFieldsManager counselingType={counselingType} readOnly={isObserver} />

          {/* Coordinated Cities ("سایر شهرها") Manager */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800 space-y-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-600" />
                  <span>مدیریت لیست شهرها و مراکز («سایر شهرها»)</span>
                </h3>
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                  وقتی متقاضی در مرحله انتخاب مکان روی گزینه «سایر شهرها» کلیک می‌کند، شهرهای زیر به‌عنوان مراکز قابل هماهنگی به او نمایش داده می‌شوند.
                </p>
              </div>
              {!isObserver && (
                <button
                  type="button"
                  onClick={handleSavePortal}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                >
                  <Check className="w-4 h-4" />
                  <span>{saving ? 'در حال ذخیره...' : 'ذخیره لیست شهرها'}</span>
                </button>
              )}
            </div>

            {!isObserver && (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newCityInput}
                  onChange={e => setNewCityInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCity();
                    }
                  }}
                  placeholder="نام شهر جدید (مثال: اهواز، کرمان، یزد)..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={addCity}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4 text-amber-300" />
                  <span>افزودن شهر</span>
                </button>
              </div>
            )}

            <div className="space-y-2">
              {otherCities.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-slate-500">
                  هنوز شهری برای بخش «سایر شهرها» تعریف نشده است.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {otherCities.map((city, idx) => (
                    <div
                      key={`${idx}-${city}`}
                      className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center gap-2"
                    >
                      <span className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-black flex items-center justify-center shrink-0 text-[11px]">
                        {toPersianNumbers(idx + 1)}
                      </span>
                      <input
                        type="text"
                        disabled={isObserver}
                        value={city}
                        onChange={e => updateCityAt(idx, e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold"
                      />
                      {!isObserver && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => moveCity(idx, -1)}
                            disabled={idx === 0}
                            className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 disabled:opacity-40 cursor-pointer"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveCity(idx, 1)}
                            disabled={idx === otherCities.length - 1}
                            className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 disabled:opacity-40 cursor-pointer"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeCityAt(idx)}
                            className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-600 border border-rose-200 dark:border-rose-900 cursor-pointer"
                            title="حذف شهر"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 2: 100% Editable Landing Page Copy, Tabs & Info Cards */}
      {builderSubTab === 'page_content' && (
        <div className="space-y-6">
          {/* Header & Tabs */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800 space-y-4 shadow-2xs">
            <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Sliders className="w-4 h-4 text-emerald-600" />
              <span>ویرایش سربرگ بخش و عناوین تب‌های ناوبری</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold mb-1">برچسب بالای سربرگ</label>
                <input
                  type="text"
                  disabled={isObserver}
                  value={draft.headerBadgeLabel || ''}
                  onChange={e => setDraft({ ...draft, headerBadgeLabel: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">عنوان اصلی بخش</label>
                <input
                  type="text"
                  disabled={isObserver}
                  value={draft.sectionTitle || ''}
                  onChange={e => setDraft({ ...draft, sectionTitle: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">زیرعنوان اصلی بخش</label>
                <input
                  type="text"
                  disabled={isObserver}
                  value={draft.sectionSubtitle || ''}
                  onChange={e => setDraft({ ...draft, sectionSubtitle: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
              <div>
                <label className="block font-bold mb-1">عنوان تب اول</label>
                <input
                  type="text"
                  disabled={isObserver}
                  value={draft.tabRequestLabel || ''}
                  onChange={e => setDraft({ ...draft, tabRequestLabel: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">عنوان تب مشاوران</label>
                <input
                  type="text"
                  disabled={isObserver}
                  value={draft.tabConsultantsLabel || ''}
                  onChange={e => setDraft({ ...draft, tabConsultantsLabel: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
              {counselingType === 'general' && (
                <>
                  <div>
                    <label className="block font-bold mb-1">عنوان تب نرخ‌نامه</label>
                    <input
                      type="text"
                      disabled={isObserver}
                      value={draft.tabTariffsLabel || ''}
                      onChange={e => setDraft({ ...draft, tabTariffsLabel: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">عنوان تب تست‌ها</label>
                    <input
                      type="text"
                      disabled={isObserver}
                      value={draft.tabTestsLabel || ''}
                      onChange={e => setDraft({ ...draft, tabTestsLabel: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                </>
              )}
              <div>
                <label className="block font-bold mb-1">عنوان تب سوابق</label>
                <input
                  type="text"
                  disabled={isObserver}
                  value={draft.tabHistoryLabel || ''}
                  onChange={e => setDraft({ ...draft, tabHistoryLabel: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>
          </div>

          {/* Hero & Callout Boxes */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800 space-y-5 shadow-2xs">
            <h3 className="font-black text-sm text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
              ویرایش باکس معرفی بالا و باکس دعوت به اقدام (رزرو وقت مشاوره)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold mb-1">برچسب بالای باکس معرفی</label>
                <input
                  type="text"
                  disabled={isObserver}
                  value={draft.heroBadgeLabel || ''}
                  onChange={e => setDraft({ ...draft, heroBadgeLabel: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">تیتر اصلی باکس معرفی</label>
                <input
                  type="text"
                  disabled={isObserver}
                  value={draft.landingIntroTitle || ''}
                  onChange={e => setDraft({ ...draft, landingIntroTitle: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">متن دکمه سوابق در باکس معرفی</label>
                <input
                  type="text"
                  disabled={isObserver}
                  value={draft.heroHistoryButtonLabel || ''}
                  onChange={e => setDraft({ ...draft, heroHistoryButtonLabel: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold mb-1">متن کامل باکس معرفی</label>
              <textarea
                rows={3}
                disabled={isObserver}
                value={draft.landingIntroBody || ''}
                onChange={e => setDraft({ ...draft, landingIntroBody: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 leading-relaxed"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold mb-1">نشان کوچک باکس وسط</label>
                <input
                  type="text"
                  disabled={isObserver}
                  value={draft.calloutBadgeLabel || ''}
                  onChange={e => setDraft({ ...draft, calloutBadgeLabel: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">تیتر باکس فراخوان (Callout)</label>
                <input
                  type="text"
                  disabled={isObserver}
                  value={draft.landingCalloutTitle || ''}
                  onChange={e => setDraft({ ...draft, landingCalloutTitle: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">متن توضیح زیر تیتر باکس فراخوان</label>
                <input
                  type="text"
                  disabled={isObserver}
                  value={draft.landingCalloutSubtitle || ''}
                  onChange={e => setDraft({ ...draft, landingCalloutSubtitle: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">متن دکمه اصلی شروع (CTA)</label>
                <input
                  type="text"
                  disabled={isObserver}
                  value={draft.ctaButtonLabel || ''}
                  onChange={e => setDraft({ ...draft, ctaButtonLabel: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-bold mb-1">متن لینک راهنما زیر دکمه</label>
                <input
                  type="text"
                  disabled={isObserver}
                  value={draft.calloutSecondaryLinkLabel || ''}
                  onChange={e => setDraft({ ...draft, calloutSecondaryLinkLabel: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>
          </div>

          {/* Fields Showcase Section Texts */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800 space-y-4 shadow-2xs">
            <h3 className="font-black text-sm text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
              متن‌های بخش زمینه‌های مشاوره و پنجره توضیحات
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold mb-1">برچسب بالای زمینه‌ها</label>
                <input
                  type="text"
                  disabled={isObserver}
                  value={draft.fieldsShowcaseBadgeLabel || ''}
                  onChange={e => setDraft({ ...draft, fieldsShowcaseBadgeLabel: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">عنوان بخش زمینه‌ها</label>
                <input
                  type="text"
                  disabled={isObserver}
                  value={draft.fieldsSectionTitle || ''}
                  onChange={e => setDraft({ ...draft, fieldsSectionTitle: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">زیرعنوان بخش زمینه‌ها</label>
                <input
                  type="text"
                  disabled={isObserver}
                  value={draft.fieldsSectionSubtitle || ''}
                  onChange={e => setDraft({ ...draft, fieldsSectionSubtitle: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">متن راهنمای سمت چپ</label>
                <input
                  type="text"
                  disabled={isObserver}
                  value={draft.fieldsShowcaseHelperText || ''}
                  onChange={e => setDraft({ ...draft, fieldsShowcaseHelperText: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">متن پایین هر کارت زمینه</label>
                <input
                  type="text"
                  disabled={isObserver}
                  value={draft.fieldsCardCtaLabel || ''}
                  onChange={e => setDraft({ ...draft, fieldsCardCtaLabel: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">متن دکمه توضیحات</label>
                <input
                  type="text"
                  disabled={isObserver}
                  value={draft.descriptionButtonLabel || 'توضیحات'}
                  onChange={e => setDraft({ ...draft, descriptionButtonLabel: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center gap-2 font-black text-slate-800 dark:text-slate-200">
                <Info className="w-4 h-4 text-amber-500" />
                <span>محتوای پنجره «توضیحات»</span>
              </div>
              <input
                type="text"
                disabled={isObserver}
                value={draft.descriptionModalTitle || ''}
                onChange={e => setDraft({ ...draft, descriptionModalTitle: e.target.value })}
                placeholder="عنوان پنجره توضیحات"
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold"
              />
              <textarea
                rows={3}
                disabled={isObserver}
                value={draft.descriptionModalBody || ''}
                onChange={e => setDraft({ ...draft, descriptionModalBody: e.target.value })}
                placeholder="متن کامل راهنما و توضیحات..."
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold mb-1">تیتر صفحه تایید پس از ثبت درخواست</label>
                <input
                  type="text"
                  disabled={isObserver}
                  value={draft.submissionSuccessTitle || ''}
                  onChange={e => setDraft({ ...draft, submissionSuccessTitle: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">متن پیام نهایی پس از ثبت درخواست</label>
                <input
                  type="text"
                  disabled={isObserver}
                  value={draft.submissionSuccessMessage || ''}
                  onChange={e => setDraft({ ...draft, submissionSuccessMessage: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                />
              </div>
            </div>
          </div>

          {/* Custom Info Cards Editor */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800 space-y-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4 text-emerald-600" />
                  <span>کارت‌های اطلاع‌رسانی و راهنمای صفحه (اختیاری)</span>
                </h3>
                <p className="text-slate-500 mt-0.5">
                  می‌توانید کارت‌های دلخواه با متن و برچسب اختصاصی به صفحه اضافه، ویرایش یا از صفحه حذف کنید.
                </p>
              </div>
              {!isObserver && (
                <button
                  type="button"
                  onClick={addInfoCard}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4 text-amber-300" />
                  <span>افزودن کارت راهنما</span>
                </button>
              )}
            </div>

            {infoCards.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">عنوان بخش کارت‌ها (اختیاری)</label>
                  <input
                    type="text"
                    disabled={isObserver}
                    value={draft.landingInfoCardsTitle || ''}
                    onChange={e => setDraft({ ...draft, landingInfoCardsTitle: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">زیرعنوان بخش کارت‌ها (اختیاری)</label>
                  <input
                    type="text"
                    disabled={isObserver}
                    value={draft.landingInfoCardsSubtitle || ''}
                    onChange={e => setDraft({ ...draft, landingInfoCardsSubtitle: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>
            )}

            {infoCards.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-slate-500">
                کارتی برای نمایش اضافی تعریف نشده است.
              </div>
            ) : (
              <div className="space-y-3">
                {infoCards.map(card => (
                  <div
                    key={card.id}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30 space-y-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-[220px]">
                        <input
                          type="text"
                          disabled={isObserver}
                          value={card.badge || ''}
                          onChange={e => updateInfoCard(card.id, { badge: e.target.value })}
                          placeholder="برچسب (اختیاری)"
                          className="w-32 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                        />
                        <input
                          type="text"
                          disabled={isObserver}
                          value={card.title}
                          onChange={e => updateInfoCard(card.id, { title: e.target.value })}
                          placeholder="عنوان کارت"
                          className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold"
                        />
                      </div>
                      {!isObserver && (
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={card.enabled}
                              onChange={e => updateInfoCard(card.id, { enabled: e.target.checked })}
                              className="accent-emerald-600"
                            />
                            <span>فعال</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => removeInfoCard(card.id)}
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                    <textarea
                      rows={2}
                      disabled={isObserver}
                      value={card.body}
                      onChange={e => updateInfoCard(card.id, { body: e.target.value })}
                      placeholder="متن کارت..."
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sub-Tab 3: Dynamic Wizard Steps & Flow Builder */}
      {builderSubTab === 'wizard_steps' && (
        <div className="space-y-6">
          {/* Step 1: Field Selection Step Settings */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800 space-y-4 shadow-2xs">
            <div className="flex items-center gap-2 font-black text-sm text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>تنظیمات مرحله اول فرم (انتخاب زمینه مشاوره و متن محرمانگی)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 cursor-pointer">
                <span className="font-bold">نمایش مرحله انتخاب زمینه در ابتدای فرم</span>
                <input
                  type="checkbox"
                  disabled={isObserver}
                  checked={draft.showFieldsSelectionStep !== false}
                  onChange={e => setDraft({ ...draft, showFieldsSelectionStep: e.target.checked })}
                  className="w-4 h-4 accent-emerald-600"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20 cursor-pointer">
                <span className="font-bold">انتخاب زمینه اختیاری باشد (امکان عبور بدون انتخاب)</span>
                <input
                  type="checkbox"
                  disabled={isObserver}
                  checked={Boolean(draft.fieldSelectionOptional)}
                  onChange={e => setDraft({ ...draft, fieldSelectionOptional: e.target.checked })}
                  className="w-4 h-4 accent-emerald-600"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold mb-1">عنوان مرحله انتخاب زمینه</label>
                <input
                  type="text"
                  disabled={isObserver}
                  value={draft.wizardFieldStepTitle || ''}
                  onChange={e => setDraft({ ...draft, wizardFieldStepTitle: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">متن دکمه عبور بدون انتخاب</label>
                <input
                  type="text"
                  disabled={isObserver}
                  value={draft.skipFieldSelectionLabel || ''}
                  onChange={e => setDraft({ ...draft, skipFieldSelectionLabel: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-bold mb-1">متن اعلان محرمانگی و راهنمای مرحله اول</label>
                <input
                  type="text"
                  disabled={isObserver}
                  value={draft.wizardFieldNotice || ''}
                  onChange={e => setDraft({ ...draft, wizardFieldNotice: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                />
              </div>
            </div>
          </div>

          {/* Dynamic Steps & Fields Builder */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800 space-y-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  <span>طراح ۱۰۰٪ پویای مراحل و فیلدهای فرم</span>
                </h3>
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                  مراحل را اضافه، ویرایش، جابه‌جا یا حذف کنید و هر نوع فیلدی (متنی، گزینه‌ای، مکان قم/سایر شهرها، زمان صبح/عصر) را تنظیم نمایید.
                </p>
              </div>

              {!isObserver && (
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
              )}
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
                          disabled={isObserver}
                          value={step.title}
                          onChange={e => updateStep(step.id, { title: e.target.value })}
                          placeholder="عنوان مرحله"
                          className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-black"
                        />
                      </div>

                      {!isObserver && (
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
                      )}
                    </div>

                    <input
                      type="text"
                      disabled={isObserver}
                      value={step.subtitle || ''}
                      onChange={e => updateStep(step.id, { subtitle: e.target.value })}
                      placeholder="توضیح کوتاه بالای این مرحله (اختیاری)..."
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                    />

                    {/* Step Fields */}
                    <div className="space-y-2.5 pr-3 border-r-2 border-emerald-500/30">
                      {(step.fields || []).map((fld, fIdx) => (
                        <div
                          key={fld.id}
                          className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2.5"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                            <input
                              type="text"
                              disabled={isObserver}
                              value={fld.label}
                              onChange={e => updateFieldInStep(step.id, fld.id, { label: e.target.value })}
                              placeholder="عنوان فیلد / سوال"
                              className="sm:col-span-4 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                            />

                            <select
                              disabled={isObserver}
                              value={fld.type}
                              onChange={e =>
                                updateFieldInStep(step.id, fld.id, {
                                  type: e.target.value as DynamicWizardFieldType,
                                })
                              }
                              className="sm:col-span-4 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                            >
                              {FIELD_TYPES.map(t => (
                                <option key={t.id} value={t.id}>{t.label}</option>
                              ))}
                            </select>

                            <label className="sm:col-span-2 flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                disabled={isObserver}
                                checked={fld.required}
                                onChange={e => updateFieldInStep(step.id, fld.id, { required: e.target.checked })}
                                className="accent-rose-600"
                              />
                              <span className="font-bold">اجباری</span>
                            </label>

                            {!isObserver && (
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
                                  onClick={() => moveFieldInStep(step.id, fIdx, -1)}
                                  disabled={fIdx === 0}
                                  className="p-1 rounded-lg hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                                >
                                  <ChevronUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveFieldInStep(step.id, fIdx, 1)}
                                  disabled={fIdx === (step.fields || []).length - 1}
                                  className="p-1 rounded-lg hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                                >
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeFieldFromStep(step.id, fld.id)}
                                  className="p-1 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>

                          {(fld.type === 'select' || fld.type === 'radio' || fld.type === 'checkbox') && (
                            <div>
                              <label className="block text-[11px] text-slate-500 mb-1">
                                گزینه‌ها (هر گزینه را با کاما یا خط جدید جدا کنید):
                              </label>
                              <input
                                type="text"
                                disabled={isObserver}
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
                          )}

                          {fld.type === 'location_city' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                              <div>
                                <label className="block text-[11px] text-slate-500 mb-1">عنوان گزینه شهر اصلی:</label>
                                <input
                                  type="text"
                                  disabled={isObserver}
                                  value={fld.primaryCityLabel || 'قم'}
                                  onChange={e =>
                                    updateFieldInStep(step.id, fld.id, { primaryCityLabel: e.target.value })
                                  }
                                  className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] text-slate-500 mb-1">عنوان گزینه سایر شهرها:</label>
                                <input
                                  type="text"
                                  disabled={isObserver}
                                  value={fld.otherCitiesLabel || 'سایر شهرها'}
                                  onChange={e =>
                                    updateFieldInStep(step.id, fld.id, { otherCitiesLabel: e.target.value })
                                  }
                                  className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                                />
                              </div>
                              <p className="sm:col-span-2 text-[11px] text-emerald-700 dark:text-emerald-400">
                                لیست شهرهای قابل انتخاب در تب «زمینه‌های مشاوره و لیست شهرها» مدیریت می‌شود ({toPersianNumbers(otherCities.length)} شهر فعال).
                              </p>
                            </div>
                          )}

                          {fld.type === 'time_preference' && (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                              <div>
                                <label className="block text-[11px] text-slate-500 mb-1">بازه روز (با کاما):</label>
                                <input
                                  type="text"
                                  disabled={isObserver}
                                  value={(fld.dayTimeOptions || ['صبح', 'عصر']).join('، ')}
                                  onChange={e =>
                                    updateFieldInStep(step.id, fld.id, {
                                      dayTimeOptions: e.target.value.split(/[،,\n]/).map(s => s.trim()).filter(Boolean),
                                    })
                                  }
                                  className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] text-slate-500 mb-1">بازه هفته (با کاما):</label>
                                <input
                                  type="text"
                                  disabled={isObserver}
                                  value={(fld.weekPeriodOptions || ['وسط هفته', 'آخر هفته']).join('، ')}
                                  onChange={e =>
                                    updateFieldInStep(step.id, fld.id, {
                                      weekPeriodOptions: e.target.value.split(/[،,\n]/).map(s => s.trim()).filter(Boolean),
                                    })
                                  }
                                  className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] text-slate-500 mb-1">عنوان گزینه نامشخص:</label>
                                <input
                                  type="text"
                                  disabled={isObserver}
                                  value={fld.undecidedLabel || 'فعلاً مشخص نیست'}
                                  onChange={e =>
                                    updateFieldInStep(step.id, fld.id, { undecidedLabel: e.target.value })
                                  }
                                  className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                                />
                              </div>
                            </div>
                          )}

                          {(fld.type === 'text' || fld.type === 'textarea') && (
                            <input
                              type="text"
                              disabled={isObserver}
                              value={fld.placeholder || ''}
                              onChange={e => updateFieldInStep(step.id, fld.id, { placeholder: e.target.value })}
                              placeholder="متن راهنمای داخل فیلد (Placeholder)..."
                              className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                            />
                          )}
                        </div>
                      ))}

                      {!isObserver && (
                        <button
                          type="button"
                          onClick={() => addFieldToStep(step.id)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>افزودن فیلد به این مرحله</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Final Step Behavior & Button Labels */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800 space-y-4 shadow-2xs">
            <h3 className="font-black text-sm text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
              رفتار مرحله پایانی و متون دکمه‌های فرم
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 cursor-pointer">
                <div>
                  <span className="font-bold block">نمایش صفحه مرور نهایی جداگانه</span>
                  <span className="text-[11px] text-slate-500">در صورت غیرفعال بودن، در پایان آخرین مرحله مستقیم دکمه ثبت نهایی نمایش داده می‌شود.</span>
                </div>
                <input
                  type="checkbox"
                  disabled={isObserver}
                  checked={draft.includeFinalReviewStep !== false}
                  onChange={e => setDraft({ ...draft, includeFinalReviewStep: e.target.checked })}
                  className="w-4 h-4 accent-emerald-600"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 cursor-pointer">
                <span className="font-bold">نمایش فیلد شماره تماس در مرحله آخر</span>
                <input
                  type="checkbox"
                  disabled={isObserver}
                  checked={draft.showPhoneFieldInWizard !== false}
                  onChange={e => setDraft({ ...draft, showPhoneFieldInWizard: e.target.checked })}
                  className="w-4 h-4 accent-emerald-600"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 cursor-pointer">
                <span className="font-bold">امکان انتخاب مشاور/روان‌شناس ترجیحی داخل فرم</span>
                <input
                  type="checkbox"
                  disabled={isObserver}
                  checked={Boolean(draft.showConsultantsInWizard)}
                  onChange={e => setDraft({ ...draft, showConsultantsInWizard: e.target.checked })}
                  className="w-4 h-4 accent-emerald-600"
                />
              </label>

              {counselingType === 'specialized_career' ? (
                <label className="flex items-center justify-between p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20 cursor-pointer">
                  <span className="font-bold">نمایش نام و تب مشاوران به دانش‌آموختگان</span>
                  <input
                    type="checkbox"
                    disabled={isObserver}
                    checked={Boolean(draft.showAdvisorsToStudents)}
                    onChange={e => setDraft({ ...draft, showAdvisorsToStudents: e.target.checked })}
                    className="w-4 h-4 accent-emerald-600"
                  />
                </label>
              ) : (
                <label className="flex items-center justify-between p-3.5 rounded-2xl border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 cursor-pointer">
                  <span className="font-bold">نمایش دکمه نرخ‌نامه در پایان فرم</span>
                  <input
                    type="checkbox"
                    disabled={isObserver}
                    checked={Boolean(draft.showRatesInWizardEnd)}
                    onChange={e => setDraft({ ...draft, showRatesInWizardEnd: e.target.checked })}
                    className="w-4 h-4 accent-amber-600"
                  />
                </label>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold mb-1">متن دکمه ثبت نهایی</label>
                <input
                  type="text"
                  disabled={isObserver}
                  value={draft.submitButtonLabel || ''}
                  onChange={e => setDraft({ ...draft, submitButtonLabel: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">متن دکمه مرحله بعد</label>
                <input
                  type="text"
                  disabled={isObserver}
                  value={draft.nextButtonLabel || ''}
                  onChange={e => setDraft({ ...draft, nextButtonLabel: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">متن دکمه مرحله قبل</label>
                <input
                  type="text"
                  disabled={isObserver}
                  value={draft.prevButtonLabel || ''}
                  onChange={e => setDraft({ ...draft, prevButtonLabel: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
