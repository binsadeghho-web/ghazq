import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Info,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Send,
  Sparkles,
  UserCheck,
  DollarSign,
  Phone,
  AlertCircle,
  Compass,
} from 'lucide-react';
import {
  User,
  Consultant,
  CounselingFieldItem,
  DynamicWizardStep,
  GeneralCounselingTariffItem,
} from '../../types';
import { toPersianNumbers } from '../../utils/persianNumbers';

interface CounselingDynamicWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  counselingType: 'general' | 'specialized_career';
  sectionTitle: string;
  descriptionButtonLabel: string;
  onOpenDescriptionModal: () => void;
  submissionSuccessMessage: string;
  wizardSteps: DynamicWizardStep[];
  fieldsList: CounselingFieldItem[];
  preselectedField?: CounselingFieldItem | null;
  consultants: Consultant[];
  showConsultantsSelection: boolean;
  showRatesButtonInEnd?: boolean;
  ratesButtonLabel?: string;
  tariffs?: GeneralCounselingTariffItem[];
  currentUser: User | null;
  onSubmitBooking: (payload: any) => Promise<void>;
  onDoneSuccess?: () => void;
}

export const CounselingDynamicWizardModal: React.FC<CounselingDynamicWizardModalProps> = ({
  isOpen,
  onClose,
  counselingType,
  sectionTitle,
  descriptionButtonLabel,
  onOpenDescriptionModal,
  submissionSuccessMessage,
  wizardSteps,
  fieldsList,
  preselectedField,
  consultants,
  showConsultantsSelection,
  showRatesButtonInEnd = false,
  ratesButtonLabel = 'اطلاع از نرخ نامه مشاوره مرکز',
  tariffs = [],
  currentUser,
  onSubmitBooking,
  onDoneSuccess,
}) => {
  const activeFieldsList = useMemo(
    () => fieldsList.filter(f => f.counselingType === counselingType && f.isActive),
    [fieldsList, counselingType]
  );

  const activeSteps = useMemo(
    () =>
      (wizardSteps || [])
        .filter(s => s.enabled)
        .sort((a, b) => (a.order || 1) - (b.order || 1)),
    [wizardSteps]
  );

  const activeConsultants = useMemo(
    () => consultants.filter(c => c.isActive !== false && (counselingType === 'specialized_career' ? c.counselingType === 'specialized_career' : c.counselingType !== 'specialized_career')),
    [consultants, counselingType]
  );

  const totalStepsCount = (activeFieldsList.length > 0 ? 1 : 0) + activeSteps.length + 1; // +1 for Review & Contact step

  const [stepIndex, setStepIndex] = useState(0); // 0..totalStepsCount-1, and 'success' state via submitted flag
  const [selectedFieldId, setSelectedFieldId] = useState<string>('');
  const [selectedFieldTitle, setSelectedFieldTitle] = useState<string>('');
  const [preferredConsultantId, setPreferredConsultantId] = useState<string>('');
  const [userPhone, setUserPhone] = useState<string>(currentUser?.phone || '');
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showTariffPopup, setShowTariffPopup] = useState(false);

  const wasOpenRef = useRef(false);
  const lastPreselectedIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      wasOpenRef.current = false;
      lastPreselectedIdRef.current = null;
      return;
    }

    const currentPreselectedId = preselectedField?.id || null;
    const isFreshOpen = !wasOpenRef.current || lastPreselectedIdRef.current !== currentPreselectedId;

    const initDefaults: Record<string, any> = {};
    for (const st of activeSteps) {
      for (const fl of st.fields || []) {
        if (fl.type === 'checkbox') {
          initDefaults[fl.key] = [];
        } else {
          initDefaults[fl.key] = '';
        }
      }
    }

    if (isFreshOpen) {
      wasOpenRef.current = true;
      lastPreselectedIdRef.current = currentPreselectedId;
      setErrorMsg('');
      setIsSubmitted(false);
      setShowTariffPopup(false);
      setUserPhone(currentUser?.phone || '');
      setPreferredConsultantId('');
      setResponses(initDefaults);

      if (preselectedField) {
        setSelectedFieldId(preselectedField.id);
        setSelectedFieldTitle(preselectedField.title);
        setStepIndex(activeFieldsList.length > 0 ? 1 : 0);
      } else if (activeFieldsList.length > 0) {
        setSelectedFieldId(activeFieldsList[0].id);
        setSelectedFieldTitle(activeFieldsList[0].title);
        setStepIndex(0);
      } else {
        setSelectedFieldId('');
        setSelectedFieldTitle('');
        setStepIndex(0);
      }
      return;
    }

    // While modal is already open, preserve stepIndex and user responses if background data refreshes
    setResponses(prev => ({ ...initDefaults, ...prev }));
    setSelectedFieldId(prev => {
      if (prev) return prev;
      if (preselectedField) return preselectedField.id;
      return activeFieldsList[0]?.id || '';
    });
    setSelectedFieldTitle(prev => {
      if (prev) return prev;
      if (preselectedField) return preselectedField.title;
      return activeFieldsList[0]?.title || '';
    });
    setUserPhone(prev => prev || currentUser?.phone || '');
  }, [isOpen, preselectedField, activeFieldsList, activeSteps, currentUser]);

  if (!isOpen) return null;

  const safeStepIndex = Math.min(stepIndex, Math.max(0, totalStepsCount - 1));
  const hasFieldSelectionStep = activeFieldsList.length > 0;
  const isFieldStep = hasFieldSelectionStep && safeStepIndex === 0;
  const dynamicStepOffset = hasFieldSelectionStep ? 1 : 0;
  const isReviewStep = safeStepIndex === dynamicStepOffset + activeSteps.length;
  const currentDynamicStep = !isFieldStep && !isReviewStep ? activeSteps[safeStepIndex - dynamicStepOffset] : null;

  const handleToggleCheckbox = (key: string, opt: string) => {
    setResponses(prev => {
      const currentArr: string[] = Array.isArray(prev[key]) ? prev[key] : [];
      const next = currentArr.includes(opt) ? currentArr.filter(x => x !== opt) : [...currentArr, opt];
      return { ...prev, [key]: next };
    });
    setErrorMsg('');
  };

  const handleNext = () => {
    setErrorMsg('');
    if (isFieldStep) {
      if (!selectedFieldId && activeFieldsList.length > 0) {
        setErrorMsg('لطفاً یکی از زمینه‌های مشاوره را انتخاب نمایید.');
        return;
      }
      setStepIndex(prev => prev + 1);
      return;
    }

    if (currentDynamicStep) {
      const enabledFields = (currentDynamicStep.fields || []).filter(f => f.enabled);
      for (const field of enabledFields) {
        if (!field.required) continue;
        const val = responses[field.key];
        if (field.type === 'checkbox') {
          if (!Array.isArray(val) || val.length === 0) {
            setErrorMsg(`لطفاً حداقل یک گزینه برای «${field.label}» انتخاب کنید.`);
            return;
          }
        } else if (!val || !String(val).trim()) {
          setErrorMsg(`تکمیل فیلد «${field.label}» الزامی است.`);
          return;
        }
      }
      setStepIndex(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setErrorMsg('');
    if (stepIndex > 0) {
      setStepIndex(prev => prev - 1);
    }
  };

  const handleFinalSubmit = async () => {
    if (!currentUser || submitting) return;
    if (!userPhone.trim()) {
      setErrorMsg('شماره تماس جهت هماهنگی الزامی است.');
      return;
    }

    setErrorMsg('');
    setSubmitting(true);
    try {
      const selectedConsultant = activeConsultants.find(c => c.id === preferredConsultantId);

      // Build readable summary from dynamic answers
      const summaryLines: string[] = [];
      if (selectedFieldTitle) {
        summaryLines.push(`زمینه مشاوره: ${selectedFieldTitle}`);
      }
      for (const st of activeSteps) {
        for (const fl of (st.fields || []).filter(f => f.enabled)) {
          const val = responses[fl.key];
          if (val !== undefined && val !== '' && (!Array.isArray(val) || val.length > 0)) {
            summaryLines.push(`${fl.label}: ${Array.isArray(val) ? val.join('، ') : val}`);
          }
        }
      }

      const modeVal = responses.meetingMode;
      const normalizedMode: 'حضوری' | 'برخط (تصویری امن)' | 'تلفنی' =
        modeVal === 'حضوری' || modeVal === 'تلفنی' ? modeVal : 'برخط (تصویری امن)';

      await onSubmitBooking({
        applicantId: currentUser.id,
        applicantName: currentUser.fullName,
        userNationalId: currentUser.nationalId,
        userPhone: userPhone.trim(),
        userRoleTitle: currentUser.roleTitle,
        category: counselingType === 'specialized_career' ? 'academic' : 'individual',
        categoryTitle: selectedFieldTitle || sectionTitle,
        counselingType,
        selectedFieldId: selectedFieldId || undefined,
        selectedFieldTitle: selectedFieldTitle || undefined,
        preferredConsultantId: selectedConsultant?.id,
        preferredConsultantName: selectedConsultant?.name,
        meetingMode: normalizedMode,
        description: summaryLines.join('\n') || 'درخواست ثبت‌شده از طریق ویزارد گام‌به‌گام',
        formResponses: responses,
      });

      setIsSubmitted(true);
      if (onDoneSuccess) onDoneSuccess();
    } catch (err: any) {
      setErrorMsg(err?.message || 'خطا در ثبت نهایی درخواست مشاوره');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Top Modal Header with Always-Accessible Description Button (Reform 46 / 50) */}
        <div className="p-5 sm:p-6 bg-gradient-to-l from-emerald-950 via-slate-900 to-slate-950 text-white flex items-center justify-between gap-3 shrink-0">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 text-[11px] text-amber-300 font-bold">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>{sectionTitle}</span>
            </div>
            <h3 className="text-sm sm:text-base font-black truncate">
              {isSubmitted
                ? 'ثبت نهایی درخواست مشاوره'
                : isFieldStep
                ? 'گام اول: انتخاب زمینه مشاوره'
                : isReviewStep
                ? 'مرور نهایی اطلاعات و ثبت قطعی درخواست'
                : currentDynamicStep?.title || 'تکمیل اطلاعات درخواست'}
            </h3>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onOpenDescriptionModal}
              className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Info className="w-3.5 h-3.5 text-amber-300" />
              <span>{descriptionButtonLabel || 'توضیحات'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              aria-label="بستن"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stepper Progress Bar */}
        {!isSubmitted && (
          <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 text-xs shrink-0">
            <span className="font-bold text-slate-600 dark:text-slate-300">
              مرحله {toPersianNumbers(stepIndex + 1)} از {toPersianNumbers(totalStepsCount)}
            </span>
            <div className="flex-1 max-w-xs h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div
                className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                style={{ width: `${Math.round(((stepIndex + 1) / totalStepsCount) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isSubmitted ? (
            <div className="py-8 text-center space-y-5">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div className="space-y-2 max-w-md mx-auto">
                <h4 className="text-base font-black text-slate-900 dark:text-white">
                  درخواست شما با موفقیت ثبت گردید
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {submissionSuccessMessage}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs cursor-pointer shadow-md"
              >
                بستن و مشاهده سوابق درخواست‌ها
              </button>
            </div>
          ) : isFieldStep ? (
            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Compass className="w-4 h-4 text-emerald-600" />
                  <span>لطفاً زمینه مشاوره مورد نظر خود را انتخاب کنید:</span>
                </h4>
                <p className="text-slate-500 dark:text-slate-400">
                  انتخاب زمینه به کارشناسان کمک می‌کند درخواست شما به مرتبط‌ترین متخصص ارجاع شود.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeFieldsList.map(f => {
                  const selected = selectedFieldId === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        setSelectedFieldId(f.id);
                        setSelectedFieldTitle(f.title);
                        setErrorMsg('');
                      }}
                      className={`p-4 rounded-2xl border text-right transition-all space-y-1.5 cursor-pointer ${
                        selected
                          ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/30 text-slate-900 dark:text-white'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-black text-xs">{f.title}</span>
                        {selected && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                      </div>
                      {f.subtitle && <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">{f.subtitle}</p>}
                      {f.description && <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">{f.description}</p>}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : currentDynamicStep ? (
            <div className="space-y-5">
              {currentDynamicStep.subtitle && (
                <p className="text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800">
                  {currentDynamicStep.subtitle}
                </p>
              )}

              <div className="space-y-4">
                {(currentDynamicStep.fields || [])
                  .filter(f => f.enabled)
                  .sort((a, b) => (a.order || 1) - (b.order || 1))
                  .map(field => {
                    const val = responses[field.key];
                    return (
                      <div key={field.id} className="space-y-2">
                        <label className="block font-bold text-slate-800 dark:text-slate-200">
                          {field.label}
                          {field.required && <span className="text-rose-500 mr-1">*</span>}
                        </label>

                        {field.type === 'text' && (
                          <input
                            type="text"
                            value={val || ''}
                            onChange={e => {
                              setResponses(prev => ({ ...prev, [field.key]: e.target.value }));
                              setErrorMsg('');
                            }}
                            placeholder={field.placeholder || ''}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        )}

                        {field.type === 'textarea' && (
                          <textarea
                            rows={4}
                            value={val || ''}
                            onChange={e => {
                              setResponses(prev => ({ ...prev, [field.key]: e.target.value }));
                              setErrorMsg('');
                            }}
                            placeholder={field.placeholder || ''}
                            className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none leading-relaxed"
                          />
                        )}

                        {field.type === 'select' && (
                          <select
                            value={val || ''}
                            onChange={e => {
                              setResponses(prev => ({ ...prev, [field.key]: e.target.value }));
                              setErrorMsg('');
                            }}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          >
                            <option value="">انتخاب نمایید...</option>
                            {(field.options || []).map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        )}

                        {field.type === 'radio' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {(field.options || []).map(opt => {
                              const checked = val === opt;
                              return (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => {
                                    setResponses(prev => ({ ...prev, [field.key]: opt }));
                                    setErrorMsg('');
                                  }}
                                  className={`p-3 rounded-xl border text-right transition-all flex items-center justify-between gap-2 cursor-pointer ${
                                    checked
                                      ? 'border-emerald-500 bg-emerald-500/10 text-slate-900 dark:text-white font-bold ring-2 ring-emerald-500/25'
                                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                                  }`}
                                >
                                  <span>{opt}</span>
                                  {checked && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {field.type === 'checkbox' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {(field.options || []).map(opt => {
                              const checked = Array.isArray(val) && val.includes(opt);
                              return (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => handleToggleCheckbox(field.key, opt)}
                                  className={`p-3 rounded-xl border text-right transition-all flex items-center justify-between gap-2 cursor-pointer ${
                                    checked
                                      ? 'border-emerald-500 bg-emerald-500/10 text-slate-900 dark:text-white font-bold'
                                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                                  }`}
                                >
                                  <span>{opt}</span>
                                  <span
                                    className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${
                                      checked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-400'
                                    }`}
                                  >
                                    {checked ? '✓' : ''}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          ) : (
            /* Final Review Step */
            <div className="space-y-4">
              {showConsultantsSelection && activeConsultants.length > 0 && (
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span>انتخاب مشاور یا روان‌شناس ترجیحی (اختیاری):</span>
                  </label>
                  <select
                    value={preferredConsultantId}
                    onChange={e => setPreferredConsultantId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="">انتخاب هوشمند توسط دبیرخانه مرکز بر اساس موضوع</option>
                    {activeConsultants.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} — {c.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-emerald-600" />
                  <span>شماره تماس جهت هماهنگی و ارسال زمان جلسه *</span>
                </label>
                <input
                  type="text"
                  value={userPhone}
                  onChange={e => setUserPhone(e.target.value)}
                  dir="ltr"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-left"
                />
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <h4 className="font-black text-slate-900 dark:text-white">خلاصه مشخصات و پاسخ‌های شما</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400">متقاضی: </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{currentUser?.fullName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">کد ملی: </span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{toPersianNumbers(currentUser?.nationalId || '')}</span>
                  </div>
                  {selectedFieldTitle && (
                    <div className="sm:col-span-2">
                      <span className="text-slate-400">زمینه انتخابی: </span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">{selectedFieldTitle}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700 space-y-1.5 text-[11px]">
                  {activeSteps.flatMap(st => (st.fields || []).filter(f => f.enabled)).map(f => {
                    const val = responses[f.key];
                    if (val === undefined || val === '' || (Array.isArray(val) && val.length === 0)) return null;
                    return (
                      <div key={f.id}>
                        <span className="font-bold text-slate-700 dark:text-slate-300">{f.label}: </span>
                        <span className="text-slate-600 dark:text-slate-400">
                          {Array.isArray(val) ? val.join('، ') : String(val)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reform 52: Clickable Tariff Notice in Wizard Final Step (General Counseling) */}
              {showRatesButtonInEnd && (
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-center justify-between gap-3">
                  <div className="text-[11px] text-amber-900 dark:text-amber-200 font-medium">
                    پیش از تایید نهایی می‌توانید تعرفه‌های مصوب مرکز و یارانه اعضا را مشاهده فرمایید.
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowTariffPopup(true)}
                    className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>{ratesButtonLabel || 'اطلاع از نرخ نامه مشاوره مرکز'}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Controls */}
        {!isSubmitted && (
          <div className="p-4 sm:px-6 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900 flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={handleBack}
              disabled={stepIndex === 0}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
              <span>مرحله قبل</span>
            </button>

            {isReviewStep ? (
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? 'در حال ثبت...' : 'تایید و ثبت قطعی درخواست'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black flex items-center gap-2 cursor-pointer shadow-md"
              >
                <span>ادامه و مرحله بعد</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </motion.div>

      {/* Rates Modal inside Wizard End */}
      <AnimatePresence>
        {showTariffPopup && (
          <div className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-xs flex items-center justify-center p-4" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-amber-600" />
                  <span>{ratesButtonLabel || 'اطلاع از نرخ نامه مشاوره مرکز'}</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setShowTariffPopup(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2.5 text-xs">
                {tariffs.filter(t => t.isActive).length === 0 ? (
                  <p className="text-center text-slate-500 py-6">نرخ‌نامه‌ای ثبت نشده است.</p>
                ) : (
                  tariffs
                    .filter(t => t.isActive)
                    .map(t => (
                      <div
                        key={t.id}
                        className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1.5"
                      >
                        <div className="flex items-center justify-between font-black text-slate-900 dark:text-white">
                          <span>{t.serviceTitle}</span>
                          <span className="text-emerald-700 dark:text-emerald-400 font-mono">
                            سهم عضو: {toPersianNumbers(t.alumniSubsidizedFee.toLocaleString('en-US'))} تومان
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>مدت جلسه: {toPersianNumbers(t.sessionDurationMinutes)} دقیقه · {t.meetingMode}</span>
                          <span className="line-through">تعرفه آزاد: {toPersianNumbers(t.standardFee.toLocaleString('en-US'))} تومان</span>
                        </div>
                        {t.notes && <p className="text-[11px] text-slate-600 dark:text-slate-400">{t.notes}</p>}
                      </div>
                    ))
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowTariffPopup(false)}
                  className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold cursor-pointer"
                >
                  بستن و بازگشت به ثبت درخواست
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
