import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Info,
  BookOpen,
  FileText,
  Layers,
  ListChecks,
  MapPin,
  Monitor,
  Home,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Phone,
  UserCheck,
  AlertCircle,
  Send,
  Sparkles,
} from 'lucide-react';
import { ResearchMentorship, ResearchPortalConfig, User } from '../../../types';
import { getDeliveryModeLabel } from './researchUiHelpers';

interface ResearchWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ResearchPortalConfig;
  currentUser: User | null;
  editingRequest?: ResearchMentorship | null;
  onOpenGuidance: () => void;
  onSubmitNew: (payload: any) => Promise<ResearchMentorship | null>;
  onSubmitEdit: (id: string, payload: any) => Promise<ResearchMentorship | null>;
  onDoneSuccess: () => void;
}

type WizardStep = 1 | 2 | 3 | 4 | 'review' | 'success';

export const ResearchWizardModal: React.FC<ResearchWizardModalProps> = ({
  isOpen,
  onClose,
  config,
  currentUser,
  editingRequest,
  onOpenGuidance,
  onSubmitNew,
  onSubmitEdit,
  onDoneSuccess,
}) => {
  const w = config.wizardConfig;

  const [step, setStep] = useState<WizardStep>(1);
  const [researchCategory, setResearchCategory] = useState<'thesis' | 'article'>('thesis');
  const [selectedStep1Label, setSelectedStep1Label] = useState('راهبری پایان‌نامه');
  const [serviceScope, setServiceScope] = useState<'full_pack' | 'partial_mentorship'>('full_pack');
  const [selectedStep2Label, setSelectedStep2Label] = useState('نیاز به پک کامل راهبری دارم');
  const [selectedPartialTopics, setSelectedPartialTopics] = useState<string[]>([]);
  const [deliveryMode, setDeliveryMode] = useState<'in_person' | 'online'>('in_person');
  const [accommodationRequested, setAccommodationRequested] = useState<boolean>(false);
  const [briefSummary, setBriefSummary] = useState('');
  const [thesisTitle, setThesisTitle] = useState('');
  const [field, setField] = useState('فقه و حقوق جزا و جرم‌شناسی');
  const [targetInstitution, setTargetInstitution] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Track open transitions so background 10s polling / SSE config updates NEVER reset the active wizard step or user inputs
  const wasOpenRef = useRef(false);
  const lastEditingIdRef = useRef<string | null>(null);
  const latestWizardConfigRef = useRef(w);
  latestWizardConfigRef.current = w;
  const latestEditingRequestRef = useRef(editingRequest);
  latestEditingRequestRef.current = editingRequest;

  const currentEditingId = editingRequest?.id ?? null;

  // Sync state ONLY when opening the modal (false -> true) or switching to a different editingRequest ID
  useEffect(() => {
    if (!isOpen) {
      wasOpenRef.current = false;
      lastEditingIdRef.current = null;
      return;
    }

    const justOpened = !wasOpenRef.current;
    const editingTargetChanged = currentEditingId !== lastEditingIdRef.current;
    if (!justOpened && !editingTargetChanged) {
      return;
    }

    wasOpenRef.current = true;
    lastEditingIdRef.current = currentEditingId;

    const currentWizard = latestWizardConfigRef.current;
    const activeEdit = latestEditingRequestRef.current;

    setErrorMsg('');
    if (activeEdit) {
      setStep(1);
      setResearchCategory(activeEdit.researchCategory || 'thesis');
      const matchedStep1 = currentWizard.step1Options.find(
        o => o.id === (activeEdit.researchCategory || 'thesis')
      );
      setSelectedStep1Label(
        matchedStep1?.label || (activeEdit.researchCategory === 'article' ? 'راهبری مقاله' : 'راهبری پایان‌نامه')
      );
      setServiceScope(activeEdit.serviceScope || 'full_pack');
      const matchedStep2 = currentWizard.step2Options.find(
        o => o.id === (activeEdit.serviceScope || 'full_pack')
      );
      setSelectedStep2Label(
        matchedStep2?.label ||
          (activeEdit.serviceScope === 'partial_mentorship'
            ? 'نیاز به راهبری بخشی از پژوهش دارم'
            : 'نیاز به پک کامل راهبری دارم')
      );
      setSelectedPartialTopics(activeEdit.selectedPartialTopics || []);
      setDeliveryMode(activeEdit.deliveryMode || 'in_person');
      setAccommodationRequested(Boolean(activeEdit.accommodationRequested));
      setBriefSummary(activeEdit.briefSummary || '');
      setThesisTitle(activeEdit.thesisTitle || '');
      setField(activeEdit.field || 'فقه و حقوق جزا و جرم‌شناسی');
      setTargetInstitution(activeEdit.targetInstitution || '');
    } else {
      setStep(1);
      setResearchCategory('thesis');
      setSelectedStep1Label(currentWizard.step1Options[0]?.label || 'راهبری پایان‌نامه');
      setServiceScope('full_pack');
      setSelectedStep2Label(currentWizard.step2Options[0]?.label || 'نیاز به پک کامل راهبری دارم');
      setSelectedPartialTopics([]);
      setDeliveryMode('in_person');
      setAccommodationRequested(false);
      setBriefSummary('');
      setThesisTitle('');
      setField('فقه و حقوق جزا و جرم‌شناسی');
      setTargetInstitution('');
    }
  }, [isOpen, currentEditingId]);

  if (!isOpen) return null;

  const enabledStep1 = w.step1Options.filter(o => o.enabled);
  const enabledStep2 = w.step2Options.filter(o => o.enabled);
  const enabledPartialTopics = w.partialTopics.filter(o => o.enabled);

  const showAccommodationQuestion =
    serviceScope === 'full_pack' &&
    deliveryMode === 'in_person' &&
    Boolean(config.accommodationEnabledInWizard);

  const handleSelectStep1 = (optId: string, optLabel: string) => {
    const normalized: 'thesis' | 'article' = optId === 'article' ? 'article' : 'thesis';
    setResearchCategory(normalized);
    setSelectedStep1Label(optLabel);
    setErrorMsg('');
    setStep(2);
  };

  const handleSelectStep2 = (optId: string, optLabel: string) => {
    const normalized: 'full_pack' | 'partial_mentorship' =
      optId === 'partial_mentorship' ? 'partial_mentorship' : 'full_pack';
    setServiceScope(normalized);
    setSelectedStep2Label(optLabel);
    if (normalized === 'partial_mentorship') {
      setAccommodationRequested(false);
    }
    setErrorMsg('');
    setStep(3);
  };

  const togglePartialTopic = (label: string) => {
    setSelectedPartialTopics(prev =>
      prev.includes(label) ? prev.filter(item => item !== label) : [...prev, label]
    );
    setErrorMsg('');
  };

  const handleNextFromStep3 = () => {
    setErrorMsg('');
    if (serviceScope === 'full_pack') {
      if (!briefSummary.trim() || briefSummary.trim().length < 8) {
        setErrorMsg('لطفاً شرح مختصری از درخواست راهبری (حداقل ۸ کاراکتر) وارد نمایید.');
        return;
      }
      setStep('review');
    } else {
      if (enabledPartialTopics.length > 0 && selectedPartialTopics.length === 0) {
        setErrorMsg('لطفاً حداقل یک مورد از بخش‌های مورد نیاز برای مشورت یا راهبری موردی را انتخاب کنید.');
        return;
      }
      setStep(4);
    }
  };

  const handleNextFromStep4 = () => {
    setErrorMsg('');
    if (!briefSummary.trim() || briefSummary.trim().length < 8) {
      setErrorMsg('لطفاً شرح مختصری از درخواست راهبری (حداقل ۸ کاراکتر) وارد نمایید.');
      return;
    }
    setStep('review');
  };

  const handleBack = () => {
    setErrorMsg('');
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
    else if (step === 4) setStep(3);
    else if (step === 'review') setStep(serviceScope === 'full_pack' ? 3 : 4);
  };

  const handleFinalSubmit = async () => {
    if (!currentUser || submitting) return;
    setErrorMsg('');
    setSubmitting(true);
    try {
      const derivedTitle =
        thesisTitle.trim() ||
        briefSummary.trim().slice(0, 110) ||
        `${selectedStep1Label} (${selectedStep2Label})`;

      const payload = {
        researchCategory,
        serviceScope,
        selectedPartialTopics: serviceScope === 'partial_mentorship' ? selectedPartialTopics : [],
        deliveryMode,
        accommodationRequested: showAccommodationQuestion ? accommodationRequested : false,
        accommodationCity: showAccommodationQuestion && accommodationRequested ? 'قم' : undefined,
        briefSummary: briefSummary.trim(),
        thesisTitle: derivedTitle,
        field: field.trim() || 'فقه و حقوق اسلامی',
        targetInstitution: targetInstitution.trim(),
      };

      const res = editingRequest
        ? await onSubmitEdit(editingRequest.id, payload)
        : await onSubmitNew(payload);

      if (res) {
        setStep('success');
      } else {
        setErrorMsg('ثبت درخواست با خطا مواجه شد. لطفاً مقادیر را بررسی کرده و مجدداً تلاش کنید.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const stepIndexDisplay =
    step === 'review'
      ? serviceScope === 'full_pack'
        ? '۴ از ۴'
        : '۵ از ۵'
      : step === 'success'
      ? 'تکمیل'
      : `${step} از ${serviceScope === 'full_pack' ? '۴' : '۵'}`;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[60] bg-slate-950/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-1 sm:p-4 overflow-hidden"
        dir="rtl"
        role="dialog"
        aria-modal="true"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 16 }}
          onClick={e => e.stopPropagation()}
          className="bg-white dark:bg-slate-900 rounded-t-[26px] sm:rounded-3xl w-full max-w-3xl max-h-[92dvh] sm:max-h-[92vh] flex flex-col border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100"
        >
          {/* Persistent Header with Reform 36 "توضیحات" Button */}
          <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/60 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
                  {editingRequest ? 'ویرایش درخواست راهبری پژوهش' : 'ثبت درخواست راهبری پژوهش و مقاله'}
                </h2>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="font-mono tabular-nums font-bold text-amber-700 dark:text-amber-400">
                    مرحله {stepIndexDisplay}
                  </span>
                  <span>·</span>
                  <span className="truncate">{config.sectionTitle}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Reform 36: Persistent Explanations Button on every wizard step */}
              <button
                type="button"
                onClick={onOpenGuidance}
                className="px-2.5 sm:px-3 py-2 min-h-[40px] rounded-xl border border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Info className="w-4 h-4 shrink-0" />
                <span>توضیحات</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="shrink-0 min-w-[40px] min-h-[40px] w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-200/70 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 cursor-pointer"
                aria-label="بستن فرم"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain p-4 sm:p-7 space-y-5 sm:space-y-6">
            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* STEP 1: Research Type */}
            {step === 1 && (
              <div className="space-y-5">
                <div className="space-y-1">
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {w.step1Title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    نوع اثر پژوهشی خود را جهت هدایت به مسیر متناسب انتخاب فرمایید.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {enabledStep1.map(opt => {
                    const isSelected = researchCategory === (opt.id === 'article' ? 'article' : 'thesis');
                    const Icon = opt.id === 'article' ? FileText : BookOpen;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSelectStep1(opt.id, opt.label)}
                        className={`p-5 rounded-2xl border-2 text-right transition-all space-y-3 cursor-pointer group ${
                          isSelected
                            ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/30 shadow-md'
                            : 'border-slate-200 dark:border-slate-700 hover:border-amber-400/70 bg-white dark:bg-slate-800/60'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="w-11 h-11 rounded-2xl bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 flex items-center justify-center">
                            <Icon className="w-5 h-5" />
                          </div>
                          <ChevronLeft className="w-5 h-5 text-slate-400 group-hover:text-amber-600 transition-transform group-hover:-translate-x-1" />
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm font-black text-slate-900 dark:text-white">
                            {opt.label}
                          </div>
                          {opt.description && (
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                              {opt.description}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 2: Service Scope */}
            {step === 2 && (
              <div className="space-y-5">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-amber-700 dark:text-amber-400">
                    انتخاب مرحله قبل: {selectedStep1Label}
                  </div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {w.step2Title}
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {enabledStep2.map((opt, idx) => {
                    const scopeVal: 'full_pack' | 'partial_mentorship' =
                      opt.id === 'partial_mentorship' ? 'partial_mentorship' : 'full_pack';
                    const isSelected = serviceScope === scopeVal;
                    const Icon = scopeVal === 'full_pack' ? Layers : ListChecks;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSelectStep2(opt.id, opt.label)}
                        className={`p-5 rounded-2xl border-2 text-right transition-all flex items-start justify-between gap-4 cursor-pointer group ${
                          isSelected
                            ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/30 shadow-md'
                            : 'border-slate-200 dark:border-slate-700 hover:border-amber-400/70 bg-white dark:bg-slate-800/60'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-11 h-11 rounded-2xl bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 flex items-center justify-center shrink-0">
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="space-y-1">
                            <div className="text-xs font-bold text-slate-400">
                              مسیر {idx === 0 ? 'الف' : 'ب'}
                            </div>
                            <div className="text-sm font-black text-slate-900 dark:text-white">
                              {opt.label}
                            </div>
                            {opt.description && (
                              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                {opt.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <ChevronLeft className="w-5 h-5 text-slate-400 group-hover:text-amber-600 shrink-0 mt-2" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 3 — PATH A: Full Pack Delivery + Qom Accommodation + Brief Summary */}
            {step === 3 && serviceScope === 'full_pack' && (
              <div className="space-y-5">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-amber-700 dark:text-amber-400">
                    {selectedStep1Label} · {selectedStep2Label}
                  </div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {w.fullPackDeliveryTitle}
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <button
                    type="button"
                    onClick={() => setDeliveryMode('in_person')}
                    className={`p-4 rounded-2xl border-2 text-right transition-all flex items-center gap-3 cursor-pointer ${
                      deliveryMode === 'in_person'
                        ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/30'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-900 dark:text-white">
                        ۱. {w.fullPackInPersonLabel}
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        حضور در مجتمع علمی و جلسات مستقیم
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDeliveryMode('online');
                      setAccommodationRequested(false);
                    }}
                    className={`p-4 rounded-2xl border-2 text-right transition-all flex items-center gap-3 cursor-pointer ${
                      deliveryMode === 'online'
                        ? 'border-sky-600 bg-sky-50/70 dark:bg-sky-950/30'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0">
                      <Monitor className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-900 dark:text-white">
                        ۲. {w.fullPackOnlineLabel}
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        راهبری و برگزاری جلسات به‌صورت برخط
                      </span>
                    </div>
                  </button>
                </div>

                {/* Conditional Qom Accommodation Question (Only Option 1 + Admin enabled) */}
                {showAccommodationQuestion && (
                  <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-black text-slate-900 dark:text-white">
                      <Home className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>{w.accommodationQuestionLabel}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                      <button
                        type="button"
                        onClick={() => setAccommodationRequested(true)}
                        className={`p-3 rounded-xl border-2 font-bold transition-all cursor-pointer ${
                          accommodationRequested
                            ? 'border-amber-600 bg-amber-600 text-white'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        بله، درخواست اسکان موقت در قم دارم
                      </button>
                      <button
                        type="button"
                        onClick={() => setAccommodationRequested(false)}
                        className={`p-3 rounded-xl border-2 font-bold transition-all cursor-pointer ${
                          !accommodationRequested
                            ? 'border-slate-800 dark:border-amber-500 bg-slate-800 dark:bg-amber-500 text-white dark:text-slate-950'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        خیر، نیازی به اسکان ندارم
                      </button>
                    </div>
                  </div>
                )}

                {/* Brief Summary & Details on SAME page per Reform 33 */}
                <div className="space-y-4 pt-1 border-t border-slate-200 dark:border-slate-800">
                  <div>
                    <label className="block text-xs font-black text-slate-800 dark:text-slate-100 mb-1.5">
                      {w.briefSummaryLabel} <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={4}
                      value={briefSummary}
                      onChange={e => setBriefSummary(e.target.value)}
                      placeholder={w.briefSummaryPlaceholder}
                      className="w-full p-3.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        عنوان پیشنهادی / مصوب (اختیاری):
                      </label>
                      <input
                        type="text"
                        value={thesisTitle}
                        onChange={e => setThesisTitle(e.target.value)}
                        placeholder="در صورت داشتن عنوان مشخص وارد کنید..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        نهاد، دانشگاه یا مجله هدف (اختیاری):
                      </label>
                      <input
                        type="text"
                        value={targetInstitution}
                        onChange={e => setTargetInstitution(e.target.value)}
                        placeholder="مثلاً: دانشگاه علوم قضایی، پژوهشگاه حوزه..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="text-xs">
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      گرایش تخصصی:
                    </label>
                    <input
                      type="text"
                      value={field}
                      onChange={e => setField(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3 — PATH B: Partial Mentorship Checklist */}
            {step === 3 && serviceScope === 'partial_mentorship' && (
              <div className="space-y-5">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-amber-700 dark:text-amber-400">
                    {selectedStep1Label} · {selectedStep2Label}
                  </div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {w.partialTopicsTitle}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    یک یا چند مورد از محورهای زیر را که نیاز به راهبری یا مشورت دارید انتخاب کنید.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {enabledPartialTopics.map(topic => {
                    const checked = selectedPartialTopics.includes(topic.label);
                    return (
                      <button
                        key={topic.id}
                        type="button"
                        onClick={() => togglePartialTopic(topic.label)}
                        className={`p-4 rounded-2xl border-2 text-right transition-all flex items-center gap-3 cursor-pointer ${
                          checked
                            ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/30'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:border-amber-400/60'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                            checked
                              ? 'bg-amber-500 border-amber-500 text-slate-950'
                              : 'border-slate-300 dark:border-slate-600'
                          }`}
                        >
                          {checked && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {topic.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 4 — PATH B: Presence Option + Brief Summary (NO Accommodation Question per Reform 33) */}
            {step === 4 && serviceScope === 'partial_mentorship' && (
              <div className="space-y-5">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-amber-700 dark:text-amber-400">
                    موارد انتخاب‌شده: {selectedPartialTopics.join('، ')}
                  </div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {w.partialDeliveryTitle}
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <button
                    type="button"
                    onClick={() => setDeliveryMode('in_person')}
                    className={`p-4 rounded-2xl border-2 text-right transition-all flex items-center gap-3 cursor-pointer ${
                      deliveryMode === 'in_person'
                        ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/30'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div className="text-xs font-black text-slate-900 dark:text-white">
                      {w.partialInPersonLabel}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryMode('online')}
                    className={`p-4 rounded-2xl border-2 text-right transition-all flex items-center gap-3 cursor-pointer ${
                      deliveryMode === 'online'
                        ? 'border-sky-600 bg-sky-50/70 dark:bg-sky-950/30'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0">
                      <Monitor className="w-5 h-5" />
                    </div>
                    <div className="text-xs font-black text-slate-900 dark:text-white">
                      {w.partialOnlineLabel}
                    </div>
                  </button>
                </div>

                <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div>
                    <label className="block text-xs font-black text-slate-800 dark:text-slate-100 mb-1.5">
                      {w.briefSummaryLabel} <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={4}
                      value={briefSummary}
                      onChange={e => setBriefSummary(e.target.value)}
                      placeholder={w.briefSummaryPlaceholder}
                      className="w-full p-3.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        عنوان اثر / موضوع (اختیاری):
                      </label>
                      <input
                        type="text"
                        value={thesisTitle}
                        onChange={e => setThesisTitle(e.target.value)}
                        placeholder="در صورت مشخص بودن عنوان وارد کنید..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        نهاد یا نشریه مقصد (اختیاری):
                      </label>
                      <input
                        type="text"
                        value={targetInstitution}
                        onChange={e => setTargetInstitution(e.target.value)}
                        placeholder="نام دانشگاه، حوزه یا مجله..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* FINAL REVIEW STEP */}
            {step === 'review' && (
              <div className="space-y-5">
                <div className="space-y-1">
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {w.reviewStepTitle}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    مشخصات هویتی شما به صورت خودکار به پرونده پیوست می‌شود تا کارشناسان با شما تماس بگیرند.
                  </p>
                </div>

                {/* User Identity Preview */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                  <div className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span>مشخصات متقاضی (ارسالی برای کارشناس مرکز):</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700 dark:text-slate-300">
                    <div>نام و نام خانوادگی: <strong>{currentUser?.fullName || '—'}</strong></div>
                    <div>تلفن تماس: <strong className="font-mono tabular-nums">{currentUser?.phone || '—'}</strong></div>
                    <div>کد ملی: <strong className="font-mono tabular-nums">{currentUser?.nationalId || '—'}</strong></div>
                    <div>سمت / رشته: <strong>{currentUser?.fieldOfStudy || currentUser?.organization || currentUser?.roleTitle || '—'}</strong></div>
                  </div>
                </div>

                {/* Selected Wizard Summary */}
                <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/25 border border-amber-200 dark:border-amber-800/60 space-y-2.5 text-xs">
                  <div className="font-black text-amber-900 dark:text-amber-300">
                    خلاصه انتخاب‌های شما:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-800 dark:text-slate-200">
                    <div>نوع پژوهش: <strong>{selectedStep1Label}</strong></div>
                    <div>نوع راهبری: <strong>{selectedStep2Label}</strong></div>
                    <div>نحوه برگزاری: <strong>{getDeliveryModeLabel(deliveryMode)}</strong></div>
                    {showAccommodationQuestion && (
                      <div>
                        اسکان موقت در قم: <strong>{accommodationRequested ? 'بله، نیاز دارم' : 'خیر'}</strong>
                      </div>
                    )}
                    {serviceScope === 'partial_mentorship' && selectedPartialTopics.length > 0 && (
                      <div className="sm:col-span-2">
                        محورهای مورد نیاز: <strong>{selectedPartialTopics.join('، ')}</strong>
                      </div>
                    )}
                    {targetInstitution && (
                      <div className="sm:col-span-2">نهاد مقصد: <strong>{targetInstitution}</strong></div>
                    )}
                  </div>
                  <div className="pt-2 border-t border-amber-200/70 dark:border-amber-800/50">
                    <span className="text-slate-500 dark:text-slate-400 block mb-1">شرح مختصر درخواست:</span>
                    <p className="text-slate-900 dark:text-white leading-relaxed whitespace-pre-wrap font-medium">
                      {briefSummary}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* SUCCESS STEP */}
            {step === 'success' && (
              <div className="py-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {editingRequest ? 'تغییرات درخواست با موفقیت ذخیره شد' : 'درخواست شما با موفقیت ثبت شد'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-lg mx-auto leading-7">
                  {config.submissionSuccessMessage}
                </p>
                <div className="pt-2 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={onDoneSuccess}
                    className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 text-xs font-black transition-colors cursor-pointer"
                  >
                    مشاهده وضعیت در درخواست‌های من
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer Navigation + Reform 37 Center Contact Strip */}
          {step !== 'success' && (
            <div className="px-4 sm:px-6 py-3.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-slate-200 dark:border-slate-800 bg-slate-50/95 dark:bg-slate-950/95 space-y-2.5 shrink-0">
              <div className="flex items-center justify-between gap-2.5">
                <div>
                  {step !== 1 && (
                    <button
                      type="button"
                      onClick={handleBack}
                      className="px-4 py-2.5 min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                      <span>مرحله قبل</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {(step === 3 || step === 4) && (
                    <button
                      type="button"
                      onClick={step === 3 ? handleNextFromStep3 : handleNextFromStep4}
                      className="px-5 py-2.5 min-h-[44px] rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 text-xs font-black flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>مرحله بعد</span>
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  )}

                  {step === 'review' && (
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={handleFinalSubmit}
                      className="px-5 sm:px-6 py-2.5 min-h-[44px] rounded-xl bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-black flex items-center gap-2 shadow-md cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>
                        {submitting
                          ? 'در حال ثبت...'
                          : editingRequest
                          ? 'ذخیره تغییرات درخواست'
                          : 'ثبت نهایی درخواست'}
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* Reform 37 compact phone strip inside wizard */}
              <div className="hidden sm:flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200/70 dark:border-slate-800 pt-2">
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>پشتیبانی دبیرخانه:</span>
                  <strong className="font-mono tabular-nums text-slate-800 dark:text-slate-200">
                    {config.contactPhone}
                  </strong>
                  {config.contactExtension && <span>({config.contactExtension})</span>}
                </div>
                {config.contactMobileOrMessenger && (
                  <span className="truncate">{config.contactMobileOrMessenger}</span>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
