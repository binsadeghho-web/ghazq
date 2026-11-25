import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Info,
  BookOpen,
  FileText,
  Mic,
  Layers,
  ListChecks,
  MapPin,
  Monitor,
  Globe2,
  Home,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Phone,
  UserCheck,
  AlertCircle,
  Send,
  Sparkles,
  Upload,
  Paperclip,
  Trash2,
} from 'lucide-react';
import {
  ResearchCategory,
  ResearchMentorship,
  ResearchPortalConfig,
  User,
} from '../../../types';
import { api } from '../../../services/apiClient';
import { getDeliveryModeLabel } from './researchUiHelpers';

interface ResearchWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ResearchPortalConfig;
  currentUser: User | null;
  initialCategory?: ResearchCategory | null;
  editingRequest?: ResearchMentorship | null;
  onOpenGuidance: () => void;
  onSubmitNew: (payload: any) => Promise<ResearchMentorship | null>;
  onSubmitEdit: (id: string, payload: any) => Promise<ResearchMentorship | null>;
  onDoneSuccess: () => void;
}

type WizardStep = 1 | 2 | 3 | 4 | 'session_form' | 'review' | 'success';

const SESSION_FIELD_PRESETS = [
  'فقه القضاء و رویه دادرسی',
  'حقوق جزا و جرم‌شناسی',
  'حقوق خصوصی و قراردادها',
  'حقوق عمومی و فقه حکومتی',
  'حقوق خانواده و تحولات اجتماعی',
  'فناوری‌های نوین و حقوق دیجیتال',
];

const SESSION_AXES_SUGGESTIONS = [
  'واکاوی آرای متعارض قضایی',
  'بررسی فقهی و مبانی شرعی موضوع',
  'نقد و بررسی قانون یا لایحه جدید',
  'چالش‌های اجرایی در محاکم و دادسراها',
  'تجربیات تطبیقی و نظام‌های حقوقی',
  'کرسی ترویجی و مناظره علمی',
];

export const ResearchWizardModal: React.FC<ResearchWizardModalProps> = ({
  isOpen,
  onClose,
  config,
  currentUser,
  initialCategory,
  editingRequest,
  onOpenGuidance,
  onSubmitNew,
  onSubmitEdit,
  onDoneSuccess,
}) => {
  const w = config.wizardConfig;

  const [step, setStep] = useState<WizardStep>(1);
  const [researchCategory, setResearchCategory] = useState<ResearchCategory>('thesis');
  const [selectedStep1Label, setSelectedStep1Label] = useState('راهبری پایان‌نامه');
  const [serviceScope, setServiceScope] = useState<'full_pack' | 'partial_mentorship' | 'session_proposal'>('full_pack');
  const [selectedStep2Label, setSelectedStep2Label] = useState('نیاز به پک کامل راهبری دارم');
  const [selectedPartialTopics, setSelectedPartialTopics] = useState<string[]>([]);
  const [deliveryMode, setDeliveryMode] = useState<'in_person' | 'online' | 'hybrid'>('in_person');
  const [accommodationRequested, setAccommodationRequested] = useState<boolean>(false);
  const [briefSummary, setBriefSummary] = useState('');
  const [thesisTitle, setThesisTitle] = useState('');
  const [field, setField] = useState('فقه القضاء و رویه دادرسی');
  const [targetInstitution, setTargetInstitution] = useState('');
  const [attachments, setAttachments] = useState<Array<{ url: string; name: string; size?: number }>>([]);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const wasOpenRef = useRef(false);
  const lastEditingIdRef = useRef<string | null>(null);
  const latestWizardConfigRef = useRef(w);
  latestWizardConfigRef.current = w;
  const latestEditingRequestRef = useRef(editingRequest);
  latestEditingRequestRef.current = editingRequest;
  const latestInitialCatRef = useRef(initialCategory);
  latestInitialCatRef.current = initialCategory;

  const currentEditingId = editingRequest?.id ?? null;

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
    const initCat = latestInitialCatRef.current;

    setErrorMsg('');
    if (activeEdit) {
      const cat: ResearchCategory = activeEdit.researchCategory || 'thesis';
      setResearchCategory(cat);
      const matchedStep1 = currentWizard.step1Options.find(o => o.id === cat);
      setSelectedStep1Label(
        matchedStep1?.label ||
          (cat === 'session_proposal'
            ? 'پیشنهاد برگزاری نشست علمی'
            : cat === 'article'
            ? 'همکاری در مقاله و انتشار'
            : 'راهبری پایان‌نامه')
      );

      if (cat === 'session_proposal') {
        setStep('session_form');
        setServiceScope('session_proposal');
        setSelectedStep2Label('پیشنهاد برگزاری نشست علمی');
      } else {
        setStep(2);
        const scopeVal = activeEdit.serviceScope === 'partial_mentorship' ? 'partial_mentorship' : 'full_pack';
        setServiceScope(scopeVal);
        const matchedStep2 = currentWizard.step2Options.find(o => o.id === scopeVal);
        setSelectedStep2Label(
          matchedStep2?.label ||
            (scopeVal === 'partial_mentorship'
              ? 'نیاز به مشورت و یا همکاری موردی دارم'
              : 'نیاز به پک کامل راهبری دارم')
        );
      }

      setSelectedPartialTopics(activeEdit.selectedPartialTopics || []);
      setDeliveryMode(activeEdit.deliveryMode || 'in_person');
      setAccommodationRequested(Boolean(activeEdit.accommodationRequested));
      setBriefSummary(activeEdit.briefSummary || '');
      setThesisTitle(activeEdit.thesisTitle || '');
      setField(activeEdit.field || 'فقه القضاء و رویه دادرسی');
      setTargetInstitution(activeEdit.targetInstitution || '');
      setAttachments(Array.isArray(activeEdit.attachments) ? activeEdit.attachments : []);
    } else {
      const startCat: ResearchCategory = initCat || 'thesis';
      setResearchCategory(startCat);
      const matchedOpt = currentWizard.step1Options.find(o => o.id === startCat);
      setSelectedStep1Label(
        matchedOpt?.label ||
          (startCat === 'session_proposal'
            ? 'پیشنهاد برگزاری نشست علمی'
            : startCat === 'article'
            ? 'همکاری در مقاله و انتشار'
            : 'راهبری پایان‌نامه')
      );

      if (initCat === 'session_proposal') {
        setStep('session_form');
        setServiceScope('session_proposal');
        setSelectedStep2Label('پیشنهاد برگزاری نشست علمی');
        setDeliveryMode('hybrid');
      } else if (initCat === 'thesis' || initCat === 'article') {
        setStep(2);
        setServiceScope('full_pack');
        setSelectedStep2Label(currentWizard.step2Options[0]?.label || 'نیاز به پک کامل راهبری دارم');
        setDeliveryMode('in_person');
      } else {
        setStep(1);
        setServiceScope('full_pack');
        setSelectedStep2Label(currentWizard.step2Options[0]?.label || 'نیاز به پک کامل راهبری دارم');
        setDeliveryMode('in_person');
      }

      setSelectedPartialTopics([]);
      setAccommodationRequested(false);
      setBriefSummary('');
      setThesisTitle('');
      setField('فقه القضاء و رویه دادرسی');
      setTargetInstitution('');
      setAttachments([]);
    }
  }, [isOpen, currentEditingId]);

  if (!isOpen) return null;

  const handleUploadResearchFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      setErrorMsg('حجم هر فایل پیوست پژوهشی نباید بیشتر از ۸ مگابایت باشد.');
      return;
    }
    setUploadingAttachment(true);
    setErrorMsg('');
    try {
      const uploaded = await api.uploadFile(file, 'research');
      if (uploaded?.url) {
        setAttachments(prev => [
          ...prev,
          { url: uploaded.url, name: uploaded.originalName || file.name, size: uploaded.sizeBytes || file.size },
        ]);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'آپلود فایل پیوست با خطا مواجه شد.');
    } finally {
      setUploadingAttachment(false);
    }
  };

  const renderResearchAttachmentsBox = () => (
    <div className="p-3.5 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 space-y-2.5 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            <Paperclip className="w-3.5 h-3.5 text-amber-600" />
            <span>پیوست پروپوزال، پیش‌نویس یا فایل مستندات (اختیاری)</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            فرمت‌های مجاز: PDF، Word (DOC/DOCX) یا تصویر (حداکثر ۸ مگابایت) — ذخیره امن در پوشه اختصاصی پژوهش
          </p>
        </div>
        <label className="px-3.5 py-2 min-h-[38px] rounded-xl bg-[#071E17] hover:bg-[#0D3227] text-[#F3D078] font-black inline-flex items-center gap-1.5 cursor-pointer shrink-0">
          <Upload className="w-3.5 h-3.5" />
          <span>{uploadingAttachment ? 'در حال آپلود...' : 'انتخاب فایل'}</span>
          <input
            type="file"
            accept=".pdf,.doc,.docx,image/jpeg,image/png,image/webp"
            disabled={uploadingAttachment}
            onChange={e => {
              const f = e.target.files?.[0];
              e.target.value = '';
              handleUploadResearchFile(f);
            }}
            className="hidden"
          />
        </label>
      </div>
      {attachments.length > 0 && (
        <div className="space-y-1.5 pt-1">
          {attachments.map((att, idx) => (
            <div
              key={`${att.url}-${idx}`}
              className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
            >
              <span className="truncate font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">{att.name}</span>
              </span>
              <button
                type="button"
                onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer shrink-0"
                title="حذف فایل پیوست"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const enabledStep1 = w.step1Options.filter(o => o.enabled);
  const enabledStep2 = w.step2Options.filter(o => o.enabled);
  const enabledPartialTopics = w.partialTopics.filter(o => o.enabled);

  const isSessionMode = researchCategory === 'session_proposal';
  const showAccommodationQuestion =
    !isSessionMode &&
    serviceScope === 'full_pack' &&
    deliveryMode === 'in_person' &&
    Boolean(config.accommodationEnabledInWizard);

  const handleSelectStep1 = (optId: string, optLabel: string) => {
    const normalized: ResearchCategory =
      optId === 'session_proposal'
        ? 'session_proposal'
        : optId === 'article'
        ? 'article'
        : 'thesis';
    setResearchCategory(normalized);
    setSelectedStep1Label(optLabel);
    setErrorMsg('');

    if (normalized === 'session_proposal') {
      setServiceScope('session_proposal');
      setSelectedStep2Label('پیشنهاد برگزاری نشست علمی');
      setDeliveryMode('hybrid');
      setAccommodationRequested(false);
      setStep('session_form');
    } else {
      setServiceScope('full_pack');
      if (deliveryMode === 'hybrid') setDeliveryMode('in_person');
      setStep(2);
    }
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
        setErrorMsg('لطفاً شرح مختصری از درخواست (حداقل ۸ کاراکتر) وارد نمایید.');
        return;
      }
      setStep('review');
    } else {
      if (enabledPartialTopics.length > 0 && selectedPartialTopics.length === 0) {
        setErrorMsg('لطفاً حداقل یک مورد از بخش‌های مورد نیاز را انتخاب کنید.');
        return;
      }
      setStep(4);
    }
  };

  const handleNextFromStep4 = () => {
    setErrorMsg('');
    if (!briefSummary.trim() || briefSummary.trim().length < 8) {
      setErrorMsg('لطفاً شرح مختصری از درخواست (حداقل ۸ کاراکتر) وارد نمایید.');
      return;
    }
    setStep('review');
  };

  const handleNextFromSessionForm = () => {
    setErrorMsg('');
    if (!thesisTitle.trim() || thesisTitle.trim().length < 4) {
      setErrorMsg('لطفاً موضوع یا عنوان پیشنهادی نشست علمی را وارد نمایید.');
      return;
    }
    if (!briefSummary.trim() || briefSummary.trim().length < 8) {
      setErrorMsg('لطفاً شرح ضرورت، اهداف و محورهای برگزاری نشست را (حداقل ۸ کاراکتر) وارد نمایید.');
      return;
    }
    setStep('review');
  };

  const handleBack = () => {
    setErrorMsg('');
    if (step === 'session_form') setStep(1);
    else if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
    else if (step === 4) setStep(3);
    else if (step === 'review') {
      if (isSessionMode) setStep('session_form');
      else setStep(serviceScope === 'full_pack' ? 3 : 4);
    }
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
        serviceScope: isSessionMode ? 'session_proposal' : serviceScope,
        selectedPartialTopics:
          isSessionMode || serviceScope === 'partial_mentorship' ? selectedPartialTopics : [],
        deliveryMode,
        accommodationRequested: showAccommodationQuestion ? accommodationRequested : false,
        accommodationCity: showAccommodationQuestion && accommodationRequested ? 'قم' : undefined,
        briefSummary: briefSummary.trim(),
        thesisTitle: derivedTitle,
        field: field.trim() || 'فقه و حقوق اسلامی',
        targetInstitution: targetInstitution.trim(),
        attachments: attachments.length > 0 ? attachments : undefined,
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

  const stepIndexDisplay = isSessionMode
    ? step === 'session_form'
      ? '۱ از ۲'
      : step === 'review'
      ? '۲ از ۲'
      : step === 'success'
      ? 'تکمیل'
      : 'انتخاب بخش'
    : step === 'review'
    ? serviceScope === 'full_pack'
      ? '۴ از ۴'
      : '۵ از ۵'
    : step === 'success'
    ? 'تکمیل'
    : `${step} از ${serviceScope === 'full_pack' ? '۴' : '۵'}`;

  const modalTitle = editingRequest
    ? isSessionMode
      ? 'ویرایش پیشنهاد برگزاری نشست علمی'
      : 'ویرایش درخواست پژوهشی'
    : isSessionMode
    ? 'پیشنهاد برگزاری نشست علمی'
    : researchCategory === 'article'
    ? 'همکاری در مقاله و کمک به انتشار'
    : step === 1
    ? 'ثبت درخواست یا پیشنهاد پژوهشی'
    : 'ثبت درخواست راهبری پایان‌نامه';

  const ModalHeaderIcon = isSessionMode
    ? Mic
    : researchCategory === 'article'
    ? FileText
    : Sparkles;

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
          {/* Persistent Header */}
          <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/60 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#071E17] text-[#F3D078] flex items-center justify-center shrink-0">
                <ModalHeaderIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
                  {modalTitle}
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

            {/* STEP 1: Select Pillar (All 3 Tracks) */}
            {step === 1 && (
              <div className="space-y-5">
                <div className="space-y-1">
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {w.step1Title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    مسیر پژوهشی یا پیشنهادی خود را انتخاب فرمایید.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {enabledStep1.map(opt => {
                    const isSelected = researchCategory === opt.id;
                    const Icon =
                      opt.id === 'session_proposal'
                        ? Mic
                        : opt.id === 'article'
                        ? FileText
                        : BookOpen;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSelectStep1(opt.id, opt.label)}
                        className={`p-4 sm:p-5 rounded-2xl border-2 text-right transition-all space-y-3 cursor-pointer group flex flex-col justify-between ${
                          isSelected
                            ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/30 shadow-md'
                            : 'border-slate-200 dark:border-slate-700 hover:border-amber-400/70 bg-white dark:bg-slate-800/60'
                        }`}
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="w-11 h-11 rounded-2xl bg-[#071E17] text-[#F3D078] flex items-center justify-center">
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
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SESSION PROPOSAL DEDICATED STREAMLINED FORM */}
            {step === 'session_form' && (
              <div className="space-y-5">
                <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-950 dark:text-emerald-100 leading-relaxed">
                  <strong>پیشنهاد برگزاری نشست علمی:</strong> ایده، مسئله حقوقی یا موضوع فقهی مد نظر خود را پیشنهاد دهید تا پس از بررسی شورای علمی مرکز، در قالب نشست تخصصی یا کرسی ترویجی برنامه‌ریزی و برگزار شود.
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-black text-slate-800 dark:text-slate-100 mb-1.5">
                      موضوع یا عنوان پیشنهادی نشست علمی <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={thesisTitle}
                      onChange={e => setThesisTitle(e.target.value)}
                      placeholder="مثال: چالش‌های فقهی و حقوقی ادله الکترونیک در آرای جدید دیوان عالی کشور..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    />
                  </div>

                  <div>
                    <label className="block font-black text-slate-800 dark:text-slate-100 mb-1.5">
                      حوزه تخصصی نشست:
                    </label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {SESSION_FIELD_PRESETS.map(preset => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setField(preset)}
                          className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold cursor-pointer transition-colors ${
                            field === preset
                              ? 'bg-[#071E17] text-[#F3D078] border-[#071E17]'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={field}
                      onChange={e => setField(e.target.value)}
                      placeholder="یا حوزه تخصصی دیگری وارد نمایید..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-black text-slate-800 dark:text-slate-100 mb-1.5">
                      شیوه پیشنهادی برگزاری نشست:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {[
                        { id: 'in_person', label: 'حضوری (در مجتمع مرکز)', Icon: MapPin },
                        { id: 'online', label: 'آنلاین (برخط)', Icon: Monitor },
                        { id: 'hybrid', label: 'ترکیبی (حضوری + آنلاین)', Icon: Globe2 },
                      ].map(mode => {
                        const active = deliveryMode === mode.id;
                        return (
                          <button
                            key={mode.id}
                            type="button"
                            onClick={() => setDeliveryMode(mode.id as any)}
                            className={`p-3 rounded-xl border-2 text-right flex items-center gap-2.5 cursor-pointer transition-all ${
                              active
                                ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/30 font-black'
                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 font-bold'
                            }`}
                          >
                            <mode.Icon className={`w-4 h-4 shrink-0 ${active ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400'}`} />
                            <span className="text-xs text-slate-900 dark:text-white">{mode.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block font-black text-slate-800 dark:text-slate-100 mb-1.5">
                      محورها و قالب پیشنهادی نشست (اختیاری):
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {SESSION_AXES_SUGGESTIONS.map(axis => {
                        const checked = selectedPartialTopics.includes(axis);
                        return (
                          <button
                            key={axis}
                            type="button"
                            onClick={() => togglePartialTopic(axis)}
                            className={`p-2.5 rounded-xl border text-right flex items-center gap-2 cursor-pointer transition-colors ${
                              checked
                                ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/30 font-bold'
                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50'
                            }`}
                          >
                            <div
                              className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                checked
                                  ? 'bg-amber-500 border-amber-500 text-slate-950'
                                  : 'border-slate-300 dark:border-slate-600'
                              }`}
                            >
                              {checked && <CheckCircle2 className="w-3 h-3" />}
                            </div>
                            <span className="text-slate-900 dark:text-white">{axis}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      اساتید، سخنرانان یا نهاد همکار پیشنهادی (اختیاری):
                    </label>
                    <input
                      type="text"
                      value={targetInstitution}
                      onChange={e => setTargetInstitution(e.target.value)}
                      placeholder="نام اساتید مدعو، قضات، یا مخاطبان هدف نشست..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-black text-slate-800 dark:text-slate-100 mb-1.5">
                      شرح ضرورت علمی، پرسش‌های محوری و خروجی مورد انتظار <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={4}
                      value={briefSummary}
                      onChange={e => setBriefSummary(e.target.value)}
                      placeholder="توضیح دهید چرا طرح این موضوع در شرایط فعلی ضروری است و چه ابهامات یا نیازهای علمی و قضایی را پاسخ می‌دهد..."
                      className="w-full p-3.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    />
                  </div>
                  {renderResearchAttachmentsBox()}
                </div>
              </div>
            )}

            {/* STEP 2: Service Scope (For Thesis or Article) */}
            {step === 2 && !isSessionMode && (
              <div className="space-y-5">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-amber-700 dark:text-amber-400">
                    بخش انتخابی: {selectedStep1Label}
                  </div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {w.step2Title}
                  </h3>
                  {researchCategory === 'article' && (
                    <p className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold">
                      همکاری در مقاله شامل تدوین، نقد علمی و همچنین کمک در معرفی نشریه معتبر، ارسال و انتشار مقاله است.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {enabledStep2.map((opt, idx) => {
                    const scopeVal: 'full_pack' | 'partial_mentorship' =
                      opt.id === 'partial_mentorship' ? 'partial_mentorship' : 'full_pack';
                    const isSelected = serviceScope === scopeVal;
                    const Icon = scopeVal === 'full_pack' ? Layers : ListChecks;
                    const customDesc =
                      researchCategory === 'article' && scopeVal === 'full_pack'
                        ? 'همراهی کامل از ایده و نگارش تا استانداردسازی، ارسال به نشریه معتبر علمی‌پژوهشی و پیگیری انتشار'
                        : opt.description;
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
                          <div className="w-11 h-11 rounded-2xl bg-[#071E17] text-[#F3D078] flex items-center justify-center shrink-0">
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="space-y-1">
                            <div className="text-xs font-bold text-slate-400">
                              مسیر {idx === 0 ? 'الف' : 'ب'}
                            </div>
                            <div className="text-sm font-black text-slate-900 dark:text-white">
                              {opt.label}
                            </div>
                            {customDesc && (
                              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                {customDesc}
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
            {step === 3 && !isSessionMode && serviceScope === 'full_pack' && (
              <div className="space-y-5">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-amber-700 dark:text-amber-400">
                    {selectedStep1Label} · {selectedStep2Label}
                  </div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {w.fullPackDeliveryTitle}
                  </h3>
                </div>

                {researchCategory === 'article' && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-950 dark:text-emerald-100 leading-relaxed">
                    در بسته کامل <strong>همکاری و انتشار مقاله</strong>، علاوه بر راهبری ساختار و محتوا، کارشناسان در معرفی نشریه مناسب علمی‌پژوهشی، آماده‌سازی فایل ارسال و اصلاحات داوری تا چاپ کنار شما خواهند بود.
                  </div>
                )}

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

                <div className="space-y-4 pt-1 border-t border-slate-200 dark:border-slate-800">
                  <div>
                    <label className="block text-xs font-black text-slate-800 dark:text-slate-100 mb-1.5">
                      {w.briefSummaryLabel} <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={4}
                      value={briefSummary}
                      onChange={e => setBriefSummary(e.target.value)}
                      placeholder={
                        researchCategory === 'article'
                          ? 'موضوع یا چکیده مقاله، وضعیت نگارش فعلی، و اینکه آیا نشریه علمی‌پژوهشی خاصی مد نظرتان هست را بنویسید...'
                          : w.briefSummaryPlaceholder
                      }
                      className="w-full p-3.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {researchCategory === 'article'
                          ? 'عنوان پیشنهادی یا فعلی مقاله (اختیاری):'
                          : 'عنوان پیشنهادی / مصوب پایان‌نامه (اختیاری):'}
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
                        {researchCategory === 'article'
                          ? 'مجله یا فصلنامه علمی هدف (اختیاری):'
                          : 'نهاد یا دانشگاه هدف (اختیاری):'}
                      </label>
                      <input
                        type="text"
                        value={targetInstitution}
                        onChange={e => setTargetInstitution(e.target.value)}
                        placeholder={
                          researchCategory === 'article'
                            ? 'مثلاً: فصلنامه مطالعات فقه و حقوق، مجله علمی‌پژوهشی...'
                            : 'مثلاً: دانشگاه علوم قضایی، پژوهشگاه حوزه...'
                        }
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
                  {renderResearchAttachmentsBox()}
                </div>
              </div>
            )}

            {/* STEP 3 — PATH B: Partial Mentorship Checklist (Includes Article Publication Help!) */}
            {step === 3 && !isSessionMode && serviceScope === 'partial_mentorship' && (
              <div className="space-y-5">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-amber-700 dark:text-amber-400">
                    {selectedStep1Label} · {selectedStep2Label}
                  </div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {w.partialTopicsTitle}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    یک یا چند مورد از محورهای زیر را که نیاز به همکاری، مشورت یا پشتیبانی انتشار دارید انتخاب کنید.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {enabledPartialTopics.map(topic => {
                    const checked = selectedPartialTopics.includes(topic.label);
                    const isPubOption =
                      topic.id === 'article_publication' || topic.label.includes('انتشار');
                    return (
                      <button
                        key={topic.id}
                        type="button"
                        onClick={() => togglePartialTopic(topic.label)}
                        className={`p-4 rounded-2xl border-2 text-right transition-all flex items-center gap-3 cursor-pointer ${
                          isPubOption && researchCategory === 'article' ? 'sm:col-span-2' : ''
                        } ${
                          checked
                            ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/30'
                            : isPubOption && researchCategory === 'article'
                            ? 'border-emerald-300 dark:border-emerald-700/70 bg-emerald-50/50 dark:bg-emerald-950/20 hover:border-emerald-500'
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

            {/* STEP 4 — PATH B: Presence Option + Brief Summary */}
            {step === 4 && !isSessionMode && serviceScope === 'partial_mentorship' && (
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
                      placeholder={
                        researchCategory === 'article'
                          ? 'توضیح دهید مقاله در چه مرحله‌ای است و کدام بخش (نگارش، اصلاح یا انتشار در نشریه) مد نظر شماست...'
                          : w.briefSummaryPlaceholder
                      }
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
                        placeholder="نام دانشگاه، حوزه یا مجله علمی‌پژوهشی..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                  {renderResearchAttachmentsBox()}
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
                    مشخصات هویتی شما به صورت خودکار به پرونده پیوست می‌شود تا کارشناسان با شما در ارتباط باشند.
                  </p>
                </div>

                {/* User Identity Preview */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                  <div className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span>مشخصات ثبت‌کننده (ارسالی برای کارشناس مرکز):</span>
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
                    خلاصه اطلاعات ثبتی شما:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-800 dark:text-slate-200">
                    <div>بخش انتخابی: <strong>{selectedStep1Label}</strong></div>
                    {isSessionMode ? (
                      <>
                        <div>موضوع نشست: <strong>{thesisTitle}</strong></div>
                        <div>حوزه تخصصی: <strong>{field}</strong></div>
                        <div>شیوه برگزاری: <strong>{getDeliveryModeLabel(deliveryMode)}</strong></div>
                      </>
                    ) : (
                      <>
                        <div>سطح خدمات: <strong>{selectedStep2Label}</strong></div>
                        <div>نحوه برگزاری: <strong>{getDeliveryModeLabel(deliveryMode)}</strong></div>
                        {showAccommodationQuestion && (
                          <div>
                            اسکان موقت در قم: <strong>{accommodationRequested ? 'بله، نیاز دارم' : 'خیر'}</strong>
                          </div>
                        )}
                      </>
                    )}

                    {selectedPartialTopics.length > 0 && (
                      <div className="sm:col-span-2">
                        {isSessionMode ? 'محورهای کلیدی نشست:' : 'محورهای مورد نیاز:'}{' '}
                        <strong>{selectedPartialTopics.join('، ')}</strong>
                      </div>
                    )}
                    {targetInstitution && (
                      <div className="sm:col-span-2">
                        {isSessionMode ? 'سخنرانان / نهاد همکار پیشنهادی:' : 'نهاد یا نشریه مقصد:'}{' '}
                        <strong>{targetInstitution}</strong>
                      </div>
                    )}
                  </div>
                  <div className="pt-2 border-t border-amber-200/70 dark:border-amber-800/50">
                    <span className="text-slate-500 dark:text-slate-400 block mb-1">
                      {isSessionMode ? 'شرح ضرورت و اهداف نشست:' : 'شرح مختصر درخواست:'}
                    </span>
                    <p className="text-slate-900 dark:text-white leading-relaxed whitespace-pre-wrap font-medium">
                      {briefSummary}
                    </p>
                  </div>
                  {attachments.length > 0 && (
                    <div className="pt-2 border-t border-amber-200/70 dark:border-amber-800/50">
                      <span className="text-slate-500 dark:text-slate-400 block mb-1">فایل‌های پیوست‌شده:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {attachments.map((att, idx) => (
                          <span
                            key={`${att.url}-${idx}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-amber-300/60 text-slate-800 dark:text-slate-200 font-bold"
                          >
                            <Paperclip className="w-3 h-3 text-emerald-600" />
                            <span>{att.name}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
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
                  {editingRequest
                    ? 'تغییرات با موفقیت ذخیره شد'
                    : isSessionMode
                    ? 'پیشنهاد برگزاری نشست علمی شما ثبت شد'
                    : 'درخواست شما با موفقیت ثبت شد'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-lg mx-auto leading-7">
                  {config.submissionSuccessMessage}
                </p>
                <div className="pt-2 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={onDoneSuccess}
                    className="px-6 py-3 min-h-[44px] rounded-xl bg-[#071E17] hover:bg-[#0D3227] text-[#F3D078] text-xs font-black transition-colors cursor-pointer"
                  >
                    مشاهده و پیگیری در همین صفحه
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer Navigation */}
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
                      <span>{step === 2 || step === 'session_form' ? 'تغییر بخش' : 'مرحله قبل'}</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {(step === 3 || step === 4 || step === 'session_form') && (
                    <button
                      type="button"
                      onClick={
                        step === 'session_form'
                          ? handleNextFromSessionForm
                          : step === 3
                          ? handleNextFromStep3
                          : handleNextFromStep4
                      }
                      className="px-5 py-2.5 min-h-[44px] rounded-xl bg-[#071E17] hover:bg-[#0D3227] text-[#F3D078] text-xs font-black flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>بازبینی و مرحله بعد</span>
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
                          ? 'ذخیره تغییرات'
                          : isSessionMode
                          ? 'ثبت پیشنهاد نشست'
                          : 'ثبت نهایی درخواست'}
                      </span>
                    </button>
                  )}
                </div>
              </div>

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
