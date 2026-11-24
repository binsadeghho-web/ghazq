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
  ShieldCheck,
  MapPin,
  Clock,
  Building2,
} from 'lucide-react';
import {
  User,
  Consultant,
  CounselingFieldItem,
  DynamicWizardField,
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
  submissionSuccessTitle?: string;
  submissionSuccessMessage: string;
  wizardSteps: DynamicWizardStep[];
  fieldsList: CounselingFieldItem[];
  preselectedField?: CounselingFieldItem | null;
  consultants: Consultant[];
  showConsultantsSelection: boolean;
  showFieldsSelectionStep?: boolean;
  wizardFieldStepTitle?: string;
  wizardFieldStepSubtitle?: string;
  wizardFieldNotice?: string;
  fieldSelectionOptional?: boolean;
  skipFieldSelectionLabel?: string;
  otherCities?: string[];
  includeFinalReviewStep?: boolean;
  showPhoneFieldInWizard?: boolean;
  showConsultantsInWizard?: boolean;
  submitButtonLabel?: string;
  nextButtonLabel?: string;
  prevButtonLabel?: string;
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
  submissionSuccessTitle = 'درخواست شما با موفقیت ثبت گردید',
  submissionSuccessMessage,
  wizardSteps,
  fieldsList,
  preselectedField,
  consultants,
  showConsultantsSelection,
  showFieldsSelectionStep = true,
  wizardFieldStepTitle = 'گام اول: انتخاب زمینه مشاوره',
  wizardFieldStepSubtitle,
  wizardFieldNotice = 'لطفاً زمینه مشاوره مورد نظر خود را انتخاب کنید:',
  fieldSelectionOptional = false,
  skipFieldSelectionLabel = 'انتخاب نمی‌کنم / ادامه بدون انتخاب زمینه',
  otherCities = [],
  includeFinalReviewStep = true,
  showPhoneFieldInWizard = true,
  showConsultantsInWizard = true,
  submitButtonLabel = 'تایید و ثبت قطعی درخواست',
  nextButtonLabel = 'ادامه و مرحله بعد',
  prevButtonLabel = 'مرحله قبل',
  showRatesButtonInEnd = false,
  ratesButtonLabel = 'اطلاع از نرخ نامه مشاوره مرکز',
  tariffs = [],
  currentUser,
  onSubmitBooking,
  onDoneSuccess,
}) => {
  const activeFieldsList = useMemo(
    () =>
      fieldsList
        .filter(f => f.counselingType === counselingType && f.isActive)
        .sort((a, b) => (a.displayOrder || 1) - (b.displayOrder || 1)),
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
    () =>
      consultants.filter(
        c =>
          c.isActive !== false &&
          (counselingType === 'specialized_career'
            ? c.counselingType === 'specialized_career'
            : c.counselingType !== 'specialized_career')
      ),
    [consultants, counselingType]
  );

  const hasFieldSelectionStep = showFieldsSelectionStep !== false && activeFieldsList.length > 0;
  const hasFinalReviewStep = includeFinalReviewStep !== false || ( !hasFieldSelectionStep && activeSteps.length === 0 );
  const totalStepsCount = Math.max(
    1,
    (hasFieldSelectionStep ? 1 : 0) + activeSteps.length + (hasFinalReviewStep ? 1 : 0)
  );

  const [stepIndex, setStepIndex] = useState(0);
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
        setStepIndex(hasFieldSelectionStep && totalStepsCount > 1 ? 1 : 0);
      } else if (!fieldSelectionOptional && hasFieldSelectionStep) {
        setSelectedFieldId(activeFieldsList[0]?.id || '');
        setSelectedFieldTitle(activeFieldsList[0]?.title || '');
        setStepIndex(0);
      } else {
        setSelectedFieldId('');
        setSelectedFieldTitle('');
        setStepIndex(0);
      }
      return;
    }

    setResponses(prev => ({ ...initDefaults, ...prev }));
    if (!fieldSelectionOptional && hasFieldSelectionStep) {
      setSelectedFieldId(prev => prev || preselectedField?.id || activeFieldsList[0]?.id || '');
      setSelectedFieldTitle(prev => prev || preselectedField?.title || activeFieldsList[0]?.title || '');
    }
    setUserPhone(prev => prev || currentUser?.phone || '');
  }, [
    isOpen,
    preselectedField,
    activeFieldsList,
    activeSteps,
    currentUser,
    fieldSelectionOptional,
    hasFieldSelectionStep,
    totalStepsCount,
  ]);

  if (!isOpen) return null;

  const safeStepIndex = Math.min(stepIndex, Math.max(0, totalStepsCount - 1));
  const isFieldStep = hasFieldSelectionStep && safeStepIndex === 0;
  const dynamicStepOffset = hasFieldSelectionStep ? 1 : 0;
  const isReviewStep = hasFinalReviewStep && safeStepIndex === dynamicStepOffset + activeSteps.length;
  const currentDynamicStep = !isFieldStep && !isReviewStep ? activeSteps[safeStepIndex - dynamicStepOffset] : null;
  const isLastStep = safeStepIndex === totalStepsCount - 1;

  const handleToggleCheckbox = (key: string, opt: string) => {
    setResponses(prev => {
      const currentArr: string[] = Array.isArray(prev[key]) ? prev[key] : [];
      const next = currentArr.includes(opt) ? currentArr.filter(x => x !== opt) : [...currentArr, opt];
      return { ...prev, [key]: next };
    });
    setErrorMsg('');
  };

  const validateCurrentDynamicStep = (): string | null => {
    if (!currentDynamicStep) return null;
    const enabledFields = (currentDynamicStep.fields || []).filter(f => f.enabled);
    for (const field of enabledFields) {
      if (!field.required) continue;
      const val = responses[field.key];
      if (field.type === 'checkbox') {
        if (!Array.isArray(val) || val.length === 0) {
          return `لطفاً حداقل یک گزینه برای «${field.label}» انتخاب کنید.`;
        }
      } else if (field.type === 'location_city') {
        const scope = responses[`${field.key}__scope`];
        const city = responses[`${field.key}__city`];
        if (!scope) {
          return `لطفاً برای «${field.label}»، گزینه ${field.primaryCityLabel || 'قم'} یا ${field.otherCitiesLabel || 'سایر شهرها'} را انتخاب نمایید.`;
        }
        if (scope === 'other' && (!city || !String(city).trim())) {
          return 'لطفاً شهر مورد نظر خود را از فهرست مراکز هماهنگی انتخاب نمایید.';
        }
      } else if (field.type === 'time_preference') {
        const isUndecided = Boolean(responses[`${field.key}__undecided`]);
        const dayPart = responses[`${field.key}__day`];
        const weekPart = responses[`${field.key}__week`];
        if (!isUndecided) {
          if (!dayPart && !weekPart) {
            return `لطفاً برای «${field.label}»، زمان مناسب یا گزینه «${field.undecidedLabel || 'فعلاً مشخص نیست'}» را انتخاب کنید.`;
          }
          if (!dayPart) {
            return `لطفاً بازه روز (${(field.dayTimeOptions || ['صبح', 'عصر']).join(' یا ')}) را مشخص کنید یا «${field.undecidedLabel || 'فعلاً مشخص نیست'}» را برگزینید.`;
          }
          if (!weekPart) {
            return `لطفاً زمان هفته (${(field.weekPeriodOptions || ['وسط هفته', 'آخر هفته']).join(' یا ')}) را مشخص کنید یا «${field.undecidedLabel || 'فعلاً مشخص نیست'}» را برگزینید.`;
          }
        }
      } else if (!val || !String(val).trim()) {
        return `تکمیل فیلد «${field.label}» الزامی است.`;
      }
    }
    return null;
  };

  const handleNext = () => {
    setErrorMsg('');
    if (isFieldStep) {
      if (!fieldSelectionOptional && !selectedFieldId && activeFieldsList.length > 0) {
        setErrorMsg('لطفاً یکی از زمینه‌های مشاوره را انتخاب نمایید.');
        return;
      }
      setStepIndex(prev => Math.min(totalStepsCount - 1, prev + 1));
      return;
    }

    if (currentDynamicStep) {
      const err = validateCurrentDynamicStep();
      if (err) {
        setErrorMsg(err);
        return;
      }
      setStepIndex(prev => Math.min(totalStepsCount - 1, prev + 1));
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

    if (isFieldStep && !fieldSelectionOptional && !selectedFieldId && activeFieldsList.length > 0) {
      setErrorMsg('لطفاً یکی از زمینه‌های مشاوره را انتخاب نمایید.');
      return;
    }

    if (currentDynamicStep) {
      const dynErr = validateCurrentDynamicStep();
      if (dynErr) {
        setErrorMsg(dynErr);
        return;
      }
    }

    if (showPhoneFieldInWizard !== false && !userPhone.trim()) {
      setErrorMsg('شماره تماس جهت هماهنگی الزامی است.');
      return;
    }

    setErrorMsg('');
    setSubmitting(true);
    try {
      const selectedConsultant = activeConsultants.find(c => c.id === preferredConsultantId);

      const summaryLines: string[] = [];
      if (selectedFieldTitle) {
        summaryLines.push(`زمینه مشاوره: ${selectedFieldTitle}`);
      }
      let hasLocationField = false;
      for (const st of activeSteps) {
        for (const fl of (st.fields || []).filter(f => f.enabled)) {
          if (fl.type === 'location_city') hasLocationField = true;
          const val = responses[fl.key];
          if (val !== undefined && val !== '' && (!Array.isArray(val) || val.length > 0)) {
            summaryLines.push(`${fl.label}: ${Array.isArray(val) ? val.join('، ') : val}`);
          }
        }
      }

      const cleanResponses: Record<string, any> = {};
      Object.entries(responses).forEach(([k, v]) => {
        if (v !== undefined && v !== '') {
          cleanResponses[k] = v;
        }
      });

      const modeVal = responses.meetingMode;
      const normalizedMode: 'حضوری' | 'برخط (تصویری امن)' | 'تلفنی' =
        modeVal === 'حضوری' || modeVal === 'تلفنی'
          ? modeVal
          : modeVal === 'برخط (تصویری امن)'
          ? modeVal
          : hasLocationField
          ? 'حضوری'
          : 'برخط (تصویری امن)';

      await onSubmitBooking({
        applicantId: currentUser.id,
        applicantName: currentUser.fullName,
        userNationalId: currentUser.nationalId,
        userPhone: userPhone.trim() || currentUser.phone || undefined,
        userRoleTitle: currentUser.roleTitle,
        category: counselingType === 'specialized_career' ? 'academic' : 'individual',
        categoryTitle: selectedFieldTitle || sectionTitle,
        counselingType,
        selectedFieldId: selectedFieldId || undefined,
        selectedFieldTitle: selectedFieldTitle || undefined,
        preferredConsultantId: selectedConsultant?.id,
        preferredConsultantName: selectedConsultant?.name,
        meetingMode: normalizedMode,
        description: summaryLines.join('\n') || 'درخواست ثبت‌شده از طریق سامانه مشاوره مرکز',
        formResponses: cleanResponses,
      });

      setIsSubmitted(true);
      if (onDoneSuccess) onDoneSuccess();
    } catch (err: any) {
      setErrorMsg(err?.message || 'خطا در ثبت نهایی درخواست مشاوره');
    } finally {
      setSubmitting(false);
    }
  };

  const renderLocationCityField = (field: DynamicWizardField) => {
    const primaryLabel = field.primaryCityLabel || 'قم';
    const otherLabel = field.otherCitiesLabel || 'سایر شهرها';
    const citiesList = (otherCities && otherCities.length > 0 ? otherCities : field.options || []).filter(Boolean);
    const scope = responses[`${field.key}__scope`] as 'primary' | 'other' | undefined;
    const chosenCity = (responses[`${field.key}__city`] as string) || '';

    return (
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              setResponses(prev => ({
                ...prev,
                [`${field.key}__scope`]: 'primary',
                [`${field.key}__city`]: primaryLabel,
                [field.key]: primaryLabel,
              }));
              setErrorMsg('');
            }}
            className={`p-4 rounded-2xl border text-right transition-all flex items-center justify-between gap-3 cursor-pointer ${
              scope === 'primary'
                ? 'border-emerald-500 bg-emerald-500/10 text-slate-900 dark:text-white font-black ring-2 ring-emerald-500/25'
                : 'border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-emerald-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <span className="text-sm font-black">{primaryLabel}</span>
            </div>
            {scope === 'primary' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
          </button>

          <button
            type="button"
            onClick={() => {
              setResponses(prev => ({
                ...prev,
                [`${field.key}__scope`]: 'other',
                [`${field.key}__city`]: '',
                [field.key]: '',
              }));
              setErrorMsg('');
            }}
            className={`p-4 rounded-2xl border text-right transition-all flex items-center justify-between gap-3 cursor-pointer ${
              scope === 'other'
                ? 'border-emerald-500 bg-emerald-500/10 text-slate-900 dark:text-white font-black ring-2 ring-emerald-500/25'
                : 'border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-emerald-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <span className="text-sm font-black">{otherLabel}</span>
            </div>
            {scope === 'other' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
          </button>
        </div>

        <AnimatePresence>
          {scope === 'other' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  مراکز و شهرهایی که امکان هماهنگی و معرفی مشاور در آن‌ها وجود دارد:
                </p>

                {citiesList.length === 0 ? (
                  <input
                    type="text"
                    value={chosenCity}
                    onChange={e => {
                      const c = e.target.value;
                      setResponses(prev => ({
                        ...prev,
                        [`${field.key}__city`]: c,
                        [field.key]: c.trim() ? `${otherLabel} - ${c.trim()}` : '',
                      }));
                      setErrorMsg('');
                    }}
                    placeholder="نام شهر خود را وارد نمایید..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {citiesList.map(city => {
                      const active = chosenCity === city;
                      return (
                        <button
                          key={city}
                          type="button"
                          onClick={() => {
                            setResponses(prev => ({
                              ...prev,
                              [`${field.key}__city`]: city,
                              [field.key]: `${otherLabel} - ${city}`,
                            }));
                            setErrorMsg('');
                          }}
                          className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-between gap-1.5 cursor-pointer ${
                            active
                              ? 'border-emerald-500 bg-emerald-600 text-white shadow-xs'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-emerald-400'
                          }`}
                        >
                          <span className="truncate">{city}</span>
                          {active && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const renderTimePreferenceField = (field: DynamicWizardField) => {
    const dayOpts = field.dayTimeOptions && field.dayTimeOptions.length > 0 ? field.dayTimeOptions : ['صبح', 'عصر'];
    const weekOpts =
      field.weekPeriodOptions && field.weekPeriodOptions.length > 0 ? field.weekPeriodOptions : ['وسط هفته', 'آخر هفته'];
    const undecidedLabel = field.undecidedLabel || 'فعلاً مشخص نیست';

    const selectedDay = (responses[`${field.key}__day`] as string) || '';
    const selectedWeek = (responses[`${field.key}__week`] as string) || '';
    const isUndecided = Boolean(responses[`${field.key}__undecided`]);

    const updateTimeParts = (nextDay: string, nextWeek: string, nextUndecided: boolean) => {
      const combined = nextUndecided
        ? undecidedLabel
        : [nextDay, nextWeek].filter(Boolean).join(' · ');
      setResponses(prev => ({
        ...prev,
        [`${field.key}__day`]: nextDay,
        [`${field.key}__week`]: nextWeek,
        [`${field.key}__undecided`]: nextUndecided,
        [field.key]: combined,
      }));
      setErrorMsg('');
    };

    return (
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Part 1: Day time (صبح / عصر) */}
          <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
              ساعت یا نوبت روز:
            </span>
            <div className="grid grid-cols-2 gap-2">
              {dayOpts.map(opt => {
                const active = !isUndecided && selectedDay === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => updateTimeParts(opt, selectedWeek, false)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      active
                        ? 'border-emerald-500 bg-emerald-600 text-white shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-emerald-400'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Part 2: Week period (وسط هفته / آخر هفته) */}
          <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
              بازه روزهای هفته:
            </span>
            <div className="grid grid-cols-2 gap-2">
              {weekOpts.map(opt => {
                const active = !isUndecided && selectedWeek === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => updateTimeParts(selectedDay, opt, false)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      active
                        ? 'border-emerald-500 bg-emerald-600 text-white shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-emerald-400'
                    }`}
                  >
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Standalone Undecided option */}
        <button
          type="button"
          onClick={() => updateTimeParts('', '', !isUndecided)}
          className={`w-full py-2.5 px-4 rounded-xl border text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
            isUndecided
              ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/20'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <span>{undecidedLabel}</span>
          {isUndecided && <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />}
        </button>
      </div>
    );
  };

  const renderInlineCompletionExtras = () => (
    <div className="space-y-4 pt-3 border-t border-slate-200/80 dark:border-slate-800">
      {showConsultantsSelection && showConsultantsInWizard && activeConsultants.length > 0 && (
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

      {showPhoneFieldInWizard !== false && (
        <div>
          <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
            <Phone className="w-4 h-4 text-emerald-600" />
            <span>شماره تماس جهت هماهنگی مشاوران مرکز *</span>
          </label>
          <input
            type="text"
            value={userPhone}
            onChange={e => {
              setUserPhone(e.target.value);
              setErrorMsg('');
            }}
            dir="ltr"
            placeholder="0912..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-left"
          />
        </div>
      )}

      {showRatesButtonInEnd && (
        <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-[11px] text-amber-900 dark:text-amber-200 font-medium">
            پیش از ثبت می‌توانید تعرفه‌های مصوب مرکز و یارانه اعضا را مشاهده فرمایید.
          </div>
          <button
            type="button"
            onClick={() => setShowTariffPopup(true)}
            className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>{ratesButtonLabel || 'اطلاع از نرخ نامه مشاوره مرکز'}</span>
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-1 sm:p-4 overflow-hidden" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-t-[26px] sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[92vh]"
      >
        {/* Top Modal Header with Persistent Description Button */}
        <div className="p-4 sm:p-6 bg-gradient-to-l from-emerald-950 via-slate-900 to-slate-950 text-white flex items-center justify-between gap-2.5 shrink-0">
          <div className="space-y-0.5 sm:space-y-1 min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] text-amber-300 font-bold truncate">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{sectionTitle}</span>
            </div>
            <h3 className="text-sm sm:text-base font-black truncate">
              {isSubmitted
                ? submissionSuccessTitle
                : isFieldStep
                ? wizardFieldStepTitle || 'انتخاب زمینه مشاوره'
                : isReviewStep
                ? 'مرور نهایی اطلاعات و ثبت قطعی درخواست'
                : currentDynamicStep?.title || 'تکمیل اطلاعات درخواست'}
            </h3>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={onOpenDescriptionModal}
              className="px-2.5 sm:px-3 py-1.5 min-h-[40px] rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Info className="w-3.5 h-3.5 text-amber-300" />
              <span>{descriptionButtonLabel || 'توضیحات'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 min-w-[40px] min-h-[40px] w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="بستن"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stepper Progress Bar */}
        {!isSubmitted && totalStepsCount > 1 && (
          <div className="px-4 sm:px-6 py-2.5 sm:py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 text-xs shrink-0">
            <span className="font-bold text-slate-600 dark:text-slate-300 tabular-nums shrink-0">
              مرحله {toPersianNumbers(safeStepIndex + 1)} از {toPersianNumbers(totalStepsCount)}
            </span>
            <div className="flex-1 max-w-xs h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div
                className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                style={{ width: `${Math.round(((safeStepIndex + 1) / totalStepsCount) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto overscroll-y-contain flex-1 min-h-0 space-y-4 sm:space-y-5 text-xs">
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
                  {submissionSuccessTitle}
                </h4>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 font-bold leading-relaxed whitespace-pre-line">
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
              {/* Prominent Privacy & Optional Notice Banner */}
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-500/40 dark:border-emerald-700/60 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  {fieldSelectionOptional ? <ShieldCheck className="w-5 h-5" /> : <Compass className="w-5 h-5" />}
                </div>
                <div className="space-y-1">
                  <h4 className="font-black text-xs sm:text-sm text-emerald-950 dark:text-emerald-200 leading-relaxed">
                    {wizardFieldNotice}
                  </h4>
                  {wizardFieldStepSubtitle && (
                    <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80">
                      {wizardFieldStepSubtitle}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                {activeFieldsList.map(f => {
                  const selected = selectedFieldId === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        if (selected && fieldSelectionOptional) {
                          setSelectedFieldId('');
                          setSelectedFieldTitle('');
                        } else {
                          setSelectedFieldId(f.id);
                          setSelectedFieldTitle(f.title);
                        }
                        setErrorMsg('');
                      }}
                      className={`p-3.5 sm:p-4 min-h-[54px] rounded-2xl border text-right transition-all space-y-1 cursor-pointer ${
                        selected
                          ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/30 text-slate-900 dark:text-white'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-black text-xs sm:text-sm">{f.title}</span>
                        {selected && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                      </div>
                      {f.subtitle?.trim() && (
                        <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">{f.subtitle}</p>
                      )}
                      {f.description?.trim() && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">{f.description}</p>
                      )}
                    </button>
                  );
                })}
              </div>

              {fieldSelectionOptional && (
                <div className="flex items-center justify-between gap-2 pt-1">
                  {selectedFieldId ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFieldId('');
                        setSelectedFieldTitle('');
                        setErrorMsg('');
                      }}
                      className="text-[11px] font-bold text-slate-500 hover:text-rose-600 cursor-pointer"
                    >
                      لغو انتخاب زمینه (ادامه بدون انتخاب)
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      انتخاب زمینه کاملاً اختیاری است؛ می‌توانید مستقیم به مرحله بعد بروید.
                    </span>
                  )}

                  {!isLastStep && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFieldId('');
                        setSelectedFieldTitle('');
                        setErrorMsg('');
                        setStepIndex(prev => Math.min(totalStepsCount - 1, prev + 1));
                      }}
                      className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 font-bold text-[11px] cursor-pointer shrink-0"
                    >
                      {skipFieldSelectionLabel}
                    </button>
                  )}
                </div>
              )}

              {isLastStep && !isReviewStep && renderInlineCompletionExtras()}
            </div>
          ) : currentDynamicStep ? (
            <div className="space-y-5">
              {currentDynamicStep.subtitle && (
                <p className="text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800">
                  {currentDynamicStep.subtitle}
                </p>
              )}

              <div className="space-y-5">
                {(currentDynamicStep.fields || [])
                  .filter(f => f.enabled)
                  .sort((a, b) => (a.order || 1) - (b.order || 1))
                  .map(field => {
                    const val = responses[field.key];
                    return (
                      <div key={field.id} className="space-y-2">
                        <label className="block font-black text-slate-800 dark:text-slate-200">
                          {field.label}
                          {field.required && <span className="text-rose-500 mr-1">*</span>}
                        </label>

                        {field.helperText && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">{field.helperText}</p>
                        )}

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
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
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

                        {field.type === 'location_city' && renderLocationCityField(field)}
                        {field.type === 'time_preference' && renderTimePreferenceField(field)}
                      </div>
                    );
                  })}
              </div>

              {/* If includeFinalReviewStep is false and this is the final step, show compact phone + submit extras inline */}
              {isLastStep && !isReviewStep && renderInlineCompletionExtras()}
            </div>
          ) : (
            /* Final Review Step */
            <div className="space-y-4">
              {showConsultantsSelection && showConsultantsInWizard && activeConsultants.length > 0 && (
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

              {showPhoneFieldInWizard !== false && (
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
              )}

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <h4 className="font-black text-slate-900 dark:text-white">خلاصه مشخصات و پاسخ‌های شما</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400">متقاضی: </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{currentUser?.fullName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">کد ملی: </span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {toPersianNumbers(currentUser?.nationalId || '')}
                    </span>
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
          <div className="p-3.5 sm:px-6 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900 flex items-center justify-between gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleBack}
              disabled={safeStepIndex === 0}
              className="px-4 py-2.5 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
              <span>{prevButtonLabel || 'مرحله قبل'}</span>
            </button>

            {isReviewStep || isLastStep ? (
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={submitting}
                className="flex-1 sm:flex-none px-5 sm:px-6 py-2.5 min-h-[44px] rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? 'در حال ثبت...' : submitButtonLabel || 'ثبت درخواست مشاوره'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 sm:flex-none px-5 sm:px-6 py-2.5 min-h-[44px] rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <span>{nextButtonLabel || 'ادامه و مرحله بعد'}</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </motion.div>

      {/* Rates Modal inside Wizard End */}
      <AnimatePresence>
        {showTariffPopup && (
          <div className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4" dir="rtl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-t-[28px] sm:rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] space-y-4 shadow-2xl max-h-[85dvh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-amber-600" />
                  <span>{ratesButtonLabel || 'اطلاع از نرخ نامه مشاوره مرکز'}</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setShowTariffPopup(false)}
                  className="p-2 min-h-[40px] min-w-[40px] rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 flex items-center justify-center cursor-pointer"
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
                        <div className="flex items-center justify-between gap-2 font-black text-slate-900 dark:text-white">
                          <span>{t.serviceTitle}</span>
                          <span className="text-emerald-700 dark:text-emerald-400 font-mono tabular-nums shrink-0">
                            سهم عضو: {toPersianNumbers(t.alumniSubsidizedFee.toLocaleString('en-US'))} تومان
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
                          <span>مدت جلسه: {toPersianNumbers(t.sessionDurationMinutes)} دقیقه · {t.meetingMode}</span>
                          <span className="line-through tabular-nums">تعرفه آزاد: {toPersianNumbers(t.standardFee.toLocaleString('en-US'))} تومان</span>
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
                  className="w-full sm:w-auto px-5 py-3 sm:py-2.5 min-h-[44px] rounded-xl bg-slate-900 text-white text-xs font-bold cursor-pointer"
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
