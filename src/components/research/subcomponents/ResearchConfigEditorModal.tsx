import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Plus, Trash2, Settings, Phone, ListChecks, Info } from 'lucide-react';
import { ResearchPortalConfig, ResearchWizardOption } from '../../../types';

interface ResearchConfigEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ResearchPortalConfig;
  onSaveConfig: (updates: Partial<ResearchPortalConfig>) => Promise<ResearchPortalConfig | null>;
}

export const ResearchConfigEditorModal: React.FC<ResearchConfigEditorModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [tab, setTab] = useState<'texts' | 'contacts' | 'wizard'>('texts');
  const [draft, setDraft] = useState<ResearchPortalConfig>(config);
  const [saving, setSaving] = useState(false);
  const wasOpenRef = useRef(false);
  const latestConfigRef = useRef(config);
  latestConfigRef.current = config;

  useEffect(() => {
    if (!isOpen) {
      wasOpenRef.current = false;
      return;
    }
    if (!wasOpenRef.current) {
      wasOpenRef.current = true;
      setDraft(JSON.parse(JSON.stringify(latestConfigRef.current)));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const updateWizard = (patch: Partial<ResearchPortalConfig['wizardConfig']>) => {
    setDraft(prev => ({
      ...prev,
      wizardConfig: {
        ...prev.wizardConfig,
        ...patch,
      },
    }));
  };

  const updateOptionList = (
    listKey: 'step1Options' | 'step2Options' | 'partialTopics',
    index: number,
    patch: Partial<ResearchWizardOption>
  ) => {
    const next = [...draft.wizardConfig[listKey]];
    next[index] = { ...next[index], ...patch };
    updateWizard({ [listKey]: next } as any);
  };

  const addOptionItem = (listKey: 'step1Options' | 'step2Options' | 'partialTopics') => {
    const newItem: ResearchWizardOption = {
      id: `opt_${Date.now().toString(36)}`,
      label: 'گزینه جدید',
      description: listKey !== 'partialTopics' ? 'توضیح تکمیلی گزینه...' : undefined,
      enabled: true,
    };
    updateWizard({ [listKey]: [...draft.wizardConfig[listKey], newItem] } as any);
  };

  const removeOptionItem = (
    listKey: 'step1Options' | 'step2Options' | 'partialTopics',
    index: number
  ) => {
    const next = draft.wizardConfig[listKey].filter((_, i) => i !== index);
    updateWizard({ [listKey]: next } as any);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const saved = await onSaveConfig(draft);
      if (saved) {
        onClose();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[75] bg-slate-950/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-1 sm:p-4 overflow-hidden"
      dir="rtl"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-t-[26px] sm:rounded-3xl w-full max-w-4xl max-h-[92dvh] sm:max-h-[92vh] flex flex-col border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100"
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <Settings className="w-5 h-5 text-amber-500 shrink-0" />
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
                تنظیمات و ویرایشگر ۱۰۰٪ بخش راهبری پژوهش و مقاله
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                تمامی تغییرات در پایگاه داده ذخیره و بدون نیاز به رفرش برای همه کاربران همگام‌سازی می‌شوند.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Subtabs */}
        <div className="px-6 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center gap-2 overflow-x-auto text-xs shrink-0">
          <button
            type="button"
            onClick={() => setTab('texts')}
            className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              tab === 'texts'
                ? 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
            }`}
          >
            <Info className="w-4 h-4" />
            <span>معرفی، دکمه و متن توضیحات</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('contacts')}
            className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              tab === 'contacts'
                ? 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
            }`}
          >
            <Phone className="w-4 h-4" />
            <span>شماره‌های تماس و نشانی</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('wizard')}
            className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              tab === 'wizard'
                ? 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
            }`}
          >
            <ListChecks className="w-4 h-4" />
            <span>مراحل، گزینه‌ها و اسکان الگوریتم</span>
          </button>
        </div>

        {/* Form Body */}
        <form id="research-config-form" onSubmit={handleSave} className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain p-4 sm:p-6 space-y-5 text-xs">
          {tab === 'texts' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold mb-1">عنوان اصلی بخش:</label>
                  <input
                    type="text"
                    value={draft.sectionTitle}
                    onChange={e => setDraft(p => ({ ...p, sectionTitle: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">متن دکمه متحرک ثبت درخواست:</label>
                  <input
                    type="text"
                    value={draft.ctaButtonLabel}
                    onChange={e => setDraft(p => ({ ...p, ctaButtonLabel: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">زیرعنوان هدر:</label>
                <input
                  type="text"
                  value={draft.sectionSubtitle}
                  onChange={e => setDraft(p => ({ ...p, sectionSubtitle: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">تیتر معرفی صفحه اول:</label>
                <input
                  type="text"
                  value={draft.landingIntroTitle}
                  onChange={e => setDraft(p => ({ ...p, landingIntroTitle: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">توضیح خدمات ارائه‌شده در صفحه اول:</label>
                <textarea
                  rows={4}
                  value={draft.landingIntroBody}
                  onChange={e => setDraft(p => ({ ...p, landingIntroBody: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold mb-1">تیتر باکس فراخوان درخواست:</label>
                  <input
                    type="text"
                    value={draft.landingCalloutTitle}
                    onChange={e => setDraft(p => ({ ...p, landingCalloutTitle: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">پیام تایید پس از ثبت نهایی:</label>
                  <input
                    type="text"
                    value={draft.submissionSuccessMessage}
                    onChange={e => setDraft(p => ({ ...p, submissionSuccessMessage: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">توضیح باکس معرفی بالای کارت‌ها:</label>
                <textarea
                  rows={2}
                  value={draft.landingCalloutSubtitle}
                  onChange={e => setDraft(p => ({ ...p, landingCalloutSubtitle: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              {Array.isArray(draft.pillarCards) && draft.pillarCards.length > 0 && (
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
                  <span className="font-black text-slate-900 dark:text-white block">
                    ویرایش متون سه کارت درخشان صفحه پژوهش:
                  </span>
                  <div className="space-y-3">
                    {draft.pillarCards.map((card, cIdx) => (
                      <div
                        key={card.id}
                        className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-black text-emerald-800 dark:text-amber-300">
                            کارت {card.indexLabel}: {card.title}
                          </span>
                          <label className="flex items-center gap-1.5 cursor-pointer font-bold">
                            <input
                              type="checkbox"
                              checked={card.enabled !== false}
                              onChange={e => {
                                const nextCards = [...(draft.pillarCards || [])];
                                nextCards[cIdx] = { ...nextCards[cIdx], enabled: e.target.checked };
                                setDraft(p => ({ ...p, pillarCards: nextCards }));
                              }}
                            />
                            <span>فعال</span>
                          </label>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <input
                            type="text"
                            value={card.title}
                            onChange={e => {
                              const nextCards = [...(draft.pillarCards || [])];
                              nextCards[cIdx] = { ...nextCards[cIdx], title: e.target.value };
                              setDraft(p => ({ ...p, pillarCards: nextCards }));
                            }}
                            placeholder="عنوان کارت"
                            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                          />
                          <input
                            type="text"
                            value={card.badgeText}
                            onChange={e => {
                              const nextCards = [...(draft.pillarCards || [])];
                              nextCards[cIdx] = { ...nextCards[cIdx], badgeText: e.target.value };
                              setDraft(p => ({ ...p, pillarCards: nextCards }));
                            }}
                            placeholder="برچسب کارت"
                            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                          />
                          <input
                            type="text"
                            value={card.ctaLabel}
                            onChange={e => {
                              const nextCards = [...(draft.pillarCards || [])];
                              nextCards[cIdx] = { ...nextCards[cIdx], ctaLabel: e.target.value };
                              setDraft(p => ({ ...p, pillarCards: nextCards }));
                            }}
                            placeholder="متن دکمه کارت"
                            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                          />
                        </div>
                        <textarea
                          rows={2}
                          value={card.subtitle}
                          onChange={e => {
                            const nextCards = [...(draft.pillarCards || [])];
                            nextCards[cIdx] = { ...nextCards[cIdx], subtitle: e.target.value };
                            setDraft(p => ({ ...p, pillarCards: nextCards }));
                          }}
                          placeholder="توضیحات کارت"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <div>
                  <label className="block font-bold mb-1">عنوان پنجره «توضیحات»:</label>
                  <input
                    type="text"
                    value={draft.guidanceNotesTitle}
                    onChange={e => setDraft(p => ({ ...p, guidanceNotesTitle: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">متن کامل «توضیحات» (نمایش در صفحه اول و تمام مراحل فرم):</label>
                  <textarea
                    rows={5}
                    value={draft.guidanceNotesBody}
                    onChange={e => setDraft(p => ({ ...p, guidanceNotesBody: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 leading-relaxed"
                  />
                </div>
              </div>
            </div>
          )}

          {tab === 'contacts' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block font-bold mb-1">عنوان باکس ارتباطی مرکز:</label>
                <input
                  type="text"
                  value={draft.contactCenterTitle}
                  onChange={e => setDraft(p => ({ ...p, contactCenterTitle: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">شماره تلفن ثابت دبیرخانه:</label>
                <input
                  type="text"
                  value={draft.contactPhone}
                  onChange={e => setDraft(p => ({ ...p, contactPhone: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">داخلی پاسخگویی:</label>
                <input
                  type="text"
                  value={draft.contactExtension || ''}
                  onChange={e => setDraft(p => ({ ...p, contactExtension: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">شماره همراه / پیام‌رسان:</label>
                <input
                  type="text"
                  value={draft.contactMobileOrMessenger || ''}
                  onChange={e => setDraft(p => ({ ...p, contactMobileOrMessenger: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">ساعات پاسخگویی:</label>
                <input
                  type="text"
                  value={draft.contactHours || ''}
                  onChange={e => setDraft(p => ({ ...p, contactHours: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-bold mb-1">نشانی حضوری:</label>
                <input
                  type="text"
                  value={draft.contactAddress || ''}
                  onChange={e => setDraft(p => ({ ...p, contactAddress: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
            </div>
          )}

          {tab === 'wizard' && (
            <div className="space-y-6">
              {/* Accommodation Toggle */}
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-3">
                <label className="flex items-center justify-between cursor-pointer font-black">
                  <span>امکان درخواست اسکان موقت در قم در فرم پک کامل حضوری فعال باشد</span>
                  <input
                    type="checkbox"
                    checked={draft.accommodationEnabledInWizard}
                    onChange={e => setDraft(p => ({ ...p, accommodationEnabledInWizard: e.target.checked }))}
                    className="w-4 h-4 accent-amber-600"
                  />
                </label>
                <div>
                  <label className="block font-bold mb-1">متن پرسش اسکان در قم:</label>
                  <input
                    type="text"
                    value={draft.wizardConfig.accommodationQuestionLabel}
                    onChange={e => updateWizard({ accommodationQuestionLabel: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              {/* Step 1 Options */}
              <div className="space-y-2.5 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="font-black text-slate-900 dark:text-white">مرحله ۱ — انتخاب نوع پژوهش</span>
                  <button
                    type="button"
                    onClick={() => addOptionItem('step1Options')}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> افزودن گزینه
                  </button>
                </div>
                <input
                  type="text"
                  value={draft.wizardConfig.step1Title}
                  onChange={e => updateWizard({ step1Title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                />
                {draft.wizardConfig.step1Options.map((opt, idx) => (
                  <div key={opt.id} className="grid grid-cols-12 gap-2 items-center">
                    <input
                      type="text"
                      value={opt.label}
                      onChange={e => updateOptionList('step1Options', idx, { label: e.target.value })}
                      className="col-span-4 px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                    <input
                      type="text"
                      value={opt.description || ''}
                      onChange={e => updateOptionList('step1Options', idx, { description: e.target.value })}
                      placeholder="توضیح کوتاه..."
                      className="col-span-6 px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                    <label className="col-span-1 flex justify-center cursor-pointer" title="فعال">
                      <input
                        type="checkbox"
                        checked={opt.enabled}
                        onChange={e => updateOptionList('step1Options', idx, { enabled: e.target.checked })}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => removeOptionItem('step1Options', idx)}
                      className="col-span-1 p-1.5 text-rose-500 flex justify-center cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Step 2 Options */}
              <div className="space-y-2.5 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="font-black text-slate-900 dark:text-white">مرحله ۲ — مسیر الف (پک کامل) و مسیر ب (موردی)</span>
                  <button
                    type="button"
                    onClick={() => addOptionItem('step2Options')}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> افزودن گزینه
                  </button>
                </div>
                <input
                  type="text"
                  value={draft.wizardConfig.step2Title}
                  onChange={e => updateWizard({ step2Title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                />
                {draft.wizardConfig.step2Options.map((opt, idx) => (
                  <div key={opt.id} className="grid grid-cols-12 gap-2 items-center">
                    <input
                      type="text"
                      value={opt.label}
                      onChange={e => updateOptionList('step2Options', idx, { label: e.target.value })}
                      className="col-span-5 px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                    <input
                      type="text"
                      value={opt.description || ''}
                      onChange={e => updateOptionList('step2Options', idx, { description: e.target.value })}
                      className="col-span-5 px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                    <label className="col-span-1 flex justify-center cursor-pointer" title="فعال">
                      <input
                        type="checkbox"
                        checked={opt.enabled}
                        onChange={e => updateOptionList('step2Options', idx, { enabled: e.target.checked })}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => removeOptionItem('step2Options', idx)}
                      className="col-span-1 p-1.5 text-rose-500 flex justify-center cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Partial Topics Checklist */}
              <div className="space-y-2.5 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="font-black text-slate-900 dark:text-white">گزینه‌های چک‌لیست راهبری موردی (مسیر ب)</span>
                  <button
                    type="button"
                    onClick={() => addOptionItem('partialTopics')}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> افزودن محور
                  </button>
                </div>
                <input
                  type="text"
                  value={draft.wizardConfig.partialTopicsTitle}
                  onChange={e => updateWizard({ partialTopicsTitle: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                />
                {draft.wizardConfig.partialTopics.map((opt, idx) => (
                  <div key={opt.id} className="grid grid-cols-12 gap-2 items-center">
                    <input
                      type="text"
                      value={opt.label}
                      onChange={e => updateOptionList('partialTopics', idx, { label: e.target.value })}
                      className="col-span-10 px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                    <label className="col-span-1 flex justify-center cursor-pointer" title="فعال">
                      <input
                        type="checkbox"
                        checked={opt.enabled}
                        onChange={e => updateOptionList('partialTopics', idx, { enabled: e.target.checked })}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => removeOptionItem('partialTopics', idx)}
                      className="col-span-1 p-1.5 text-rose-500 flex justify-center cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Delivery & Brief Summary Labels */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div>
                  <label className="block font-bold mb-1">عنوان گزینه حضوری (پک کامل):</label>
                  <input
                    type="text"
                    value={draft.wizardConfig.fullPackInPersonLabel}
                    onChange={e => updateWizard({ fullPackInPersonLabel: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">عنوان گزینه آنلاین (پک کامل):</label>
                  <input
                    type="text"
                    value={draft.wizardConfig.fullPackOnlineLabel}
                    onChange={e => updateWizard({ fullPackOnlineLabel: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">عنوان گزینه حضور (راهبری موردی):</label>
                  <input
                    type="text"
                    value={draft.wizardConfig.partialInPersonLabel}
                    onChange={e => updateWizard({ partialInPersonLabel: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">عنوان گزینه آنلاین (راهبری موردی):</label>
                  <input
                    type="text"
                    value={draft.wizardConfig.partialOnlineLabel}
                    onChange={e => updateWizard({ partialOnlineLabel: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold mb-1">عنوان فیلد شرح مختصر درخواست:</label>
                  <input
                    type="text"
                    value={draft.wizardConfig.briefSummaryLabel}
                    onChange={e => updateWizard({ briefSummaryLabel: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>
            </div>
          )}

        </form>

        {/* Pinned Footer Submit */}
        <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2 shrink-0 text-xs">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-700 font-bold cursor-pointer"
          >
            انصراف
          </button>
          <button
            type="submit"
            form="research-config-form"
            disabled={saving}
            className="px-6 py-2.5 min-h-[42px] rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 font-black flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'در حال ذخیره...' : 'ذخیره تنظیمات در پایگاه داده'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
