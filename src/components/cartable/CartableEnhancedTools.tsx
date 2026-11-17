import React, { useState, useRef, useEffect } from 'react';
import { CartableRequest } from '../../types';
import { api } from '../../services/apiClient';
import { toPersianNumbers } from '../../utils/persianNumbers';
import {
  CheckCircle2,
  Clock,
  Paperclip,
  Upload,
  Building2,
  ArrowLeftRight,
  Timer,
  Check,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { CARTABLE_FILE_ACCEPT, validateCartableClientFile } from './cartableTypes';
import { CartableAttachmentList } from './CartableAttachmentList';

interface CartableEnhancedToolsProps {
  request: CartableRequest;
  isOfficial: boolean;
  onRequestUpdated: (updated: CartableRequest) => void;
}

const DEPARTMENTS = [
  'مدیر دانش‌آموختگان (مدیریت کل پرونده و کارگزینی)',
  'مسئول اداری و مالی (صدور احکام، امور مالی و تسویه‌حساب)',
  'معاونت آموزش (تطبیق واحدهای حوزوی و دانشگاهی، دوره‌ها)',
  'معاونت فرهنگی و رفاهی (امور اقامتی، تسهیلات و وام صندوق)',
  'معاونت اجرایی و پژوهش (پایان‌نامه‌ها، مقالات و انتشارات)',
  'ناظر کل سامانه (بازرسی و رسیدگی به شکایات)',
  'دبیرخانه مرکزی خدمات قضایی',
  'مدیر ارشد سامانه (تصمیم‌گیری نهایی)',
];

export const CartableEnhancedTools: React.FC<CartableEnhancedToolsProps> = ({
  request,
  isOfficial,
  onRequestUpdated,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [referralDept, setReferralDept] = useState<string>(
    request.referredDepartment || DEPARTMENTS[0]
  );
  const [referralNote, setReferralNote] = useState<string>(
    request.internalReferralNote || ''
  );
  const [savingReferral, setSavingReferral] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Admin compact bar drawers
  const [showReferralForm, setShowReferralForm] = useState(false);
  const [showAttachmentsDrawer, setShowAttachmentsDrawer] = useState(false);

  // Sync referral fields when switching between cases
  useEffect(() => {
    setReferralDept(request.referredDepartment || DEPARTMENTS[0]);
    setReferralNote(request.internalReferralNote || '');
    setShowReferralForm(false);
    setShowAttachmentsDrawer(false);
  }, [request.id, request.referredDepartment, request.internalReferralNote]);

  const showToast = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  // Alumni Stepper calculation (ONLY rendered when !isOfficial)
  const getStepIndex = (status: CartableRequest['status'], hasReferral: boolean): number => {
    if (status === 'completed' || status === 'rejected' || status === 'archived') return 4;
    if (status === 'in_progress' || status === 'need_info') return 3;
    if (hasReferral) return 2;
    return 1;
  };

  const hasReferral = Boolean(request.referredDepartment);
  const currentStep = getStepIndex(request.status, hasReferral);

  const steps = [
    { id: 1, label: 'ثبت درخواست', sub: 'دریافت کد رهگیری' },
    { id: 2, label: 'ارجاع به کارشناس', sub: request.referredDepartment || 'دبیرخانه مرکزی' },
    { id: 3, label: 'در حال پیگیری', sub: request.status === 'need_info' ? 'نیازمند تکمیل مدارک' : 'بررسی تخصصی پرونده' },
    { id: 4, label: 'صدور نتیجه نهایی', sub: request.status === 'completed' ? 'انجام شد' : request.status === 'rejected' ? 'رد شده' : 'مختومه' },
  ];

  const slaHours = Number(request.slaDeadlineHours) || (request.priority === 'urgent' ? 24 : 48);
  const isClosed = request.status === 'completed' || request.status === 'rejected' || request.status === 'archived';

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateCartableClientFile(file);
    if (!validation.ok) {
      showToast(validation.error || 'فرمت فایل مجاز نیست.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploading(true);
    try {
      const targetFolder = isOfficial ? 'cartable_officials' : 'cartable_alumni';
      const uploaded = await api.uploadFile(file, targetFolder);
      if (uploaded?.url) {
        const expectedVersion = request.version || 1;
        const updated = await api.uploadCartableAttachment(request.id, uploaded.url, expectedVersion);
        onRequestUpdated(updated);
        setShowAttachmentsDrawer(true);
        showToast(
          isOfficial
            ? 'فایل / گواهی مسئول با موفقیت در پوشه امن مسئولین ذخیره و به پرونده الصاق شد.'
            : 'مدرک پیوست با موفقیت در پوشه امن دانش‌آموختگان ذخیره و به پرونده الصاق شد.'
        );
      }
    } catch (err: any) {
      showToast(`خطا در بارگذاری پیوست: ${err.message || 'خطای سرور'}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingReferral(true);
    try {
      const expectedVersion = request.version || 1;
      const updated = await api.updateCartableReferral(request.id, {
        referredDepartment: referralDept,
        internalReferralNote: referralNote,
        expectedVersion,
      });
      onRequestUpdated(updated);
      setShowReferralForm(false);
      showToast('ارجاع داخلی پرونده با موفقیت در پایگاه داده ثبت گردید.');
    } catch (err: any) {
      showToast(`خطا در ثبت ارجاع داخلی: ${err.message || 'خطای سرور'}`);
    } finally {
      setSavingReferral(false);
    }
  };

  const attachments: string[] = Array.isArray(request.attachments)
    ? request.attachments
    : [];

  // =========================================================================
  // ADMIN / OFFICIAL COMPACT VIEW (بدون مراحل پردازش پرونده - ویژه سرعت عمل مدیر)
  // =========================================================================
  if (isOfficial) {
    return (
      <div className="space-y-2.5 pt-2.5 border-t border-slate-200 dark:border-slate-800" dir="rtl">
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileUpload}
          className="hidden"
          accept={CARTABLE_FILE_ACCEPT}
        />

        {feedbackMsg && (
          <div className="px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
            <Check className="w-3.5 h-3.5 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Single Compact Quick Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 min-w-0">
            <Building2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span className="font-semibold text-slate-500 dark:text-slate-400">واحد مرجع:</span>
            <span className="font-bold text-slate-900 dark:text-white truncate max-w-[230px]">
              {request.referredDepartment || 'دبیرخانه مرکزی (ارجاع نشده)'}
            </span>
            {request.internalReferralNote && (
              <span
                title={request.internalReferralNote}
                className="hidden md:inline text-[11px] text-slate-400 truncate max-w-[180px]"
              >
                · {request.internalReferralNote}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setShowReferralForm(prev => !prev)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border flex items-center gap-1.5 transition-colors cursor-pointer ${
                showReferralForm
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>ارجاع داخلی</span>
              {showReferralForm ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            <button
              type="button"
              onClick={() => setShowAttachmentsDrawer(prev => !prev)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border flex items-center gap-1.5 transition-colors cursor-pointer ${
                showAttachmentsDrawer
                  ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/40'
                  : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              <Paperclip className="w-3.5 h-3.5 text-amber-500" />
              <span>پیوست‌ها ({toPersianNumbers(attachments.length)})</span>
            </button>

            {request.status !== 'archived' && (
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-[11px] font-black flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                <span>{uploading ? 'بارگذاری...' : 'افزودن فایل'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Expandable Inline Attachments List */}
        {showAttachmentsDrawer && (
          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            {attachments.length === 0 ? (
              <p className="text-[11px] text-slate-400">
                هنوز فایل یا مدرکی به این پرونده پیوست نشده است.
              </p>
            ) : (
              <CartableAttachmentList attachments={attachments} compact />
            )}
          </div>
        )}

        {/* Expandable Inline Internal Referral Form */}
        {showReferralForm && (
          <form
            onSubmit={handleSaveReferral}
            className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900/50 space-y-2.5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
              <div className="sm:col-span-5">
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  واحد مقصد ارجاع
                </label>
                <select
                  value={referralDept}
                  onChange={e => setReferralDept(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-lg text-xs font-bold bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  {DEPARTMENTS.map(dept => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-5">
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  هامش یا دستور ارجاع
                </label>
                <input
                  type="text"
                  value={referralNote}
                  onChange={e => setReferralNote(e.target.value)}
                  placeholder="جهت استعلام سوابق و اقدام لازم..."
                  className="w-full px-2.5 py-2 rounded-lg text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={savingReferral}
                  className="w-full px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black flex items-center justify-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{savingReferral ? 'ثبت...' : 'ثبت ارجاع'}</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    );
  }

  // =========================================================================
  // ALUMNI VIEW (شامل فرآیند ۴ مرحله‌ای پردازش پرونده، شاخص انتظار و پیوست‌ها)
  // =========================================================================
  return (
    <div className="space-y-4 pt-3 border-t border-slate-200 dark:border-slate-800" dir="rtl">
      {feedbackMsg && (
        <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* ۱. مراحل پردازش پرونده + شاخص زمان انتظار (منحصر به پنل دانش‌آموخته) */}
      <div className="bg-white dark:bg-slate-900/90 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-emerald-500" />
            <span>فرآیند و مراحل پردازش پرونده:</span>
          </span>

          {/* شاخص زمان انتظار (SLA Waiting Time Indicator) */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-bold border ${
              isClosed
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                : request.priority === 'urgent'
                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                : 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30'
            }`}
          >
            <Timer className="w-3.5 h-3.5" />
            <span>
              شاخص زمان انتظار:{' '}
              {isClosed
                ? 'تکمیل و پاسخ‌دهی شده'
                : `حداکثر ${toPersianNumbers(slaHours)} ساعت کاری (${
                    request.priority === 'urgent' ? 'فوری' : 'عادی'
                  })`}
            </span>
          </div>
        </div>

        {/* 4-Stage Stepper */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {steps.map(step => {
            const isDone = currentStep > step.id || (step.id === 4 && isClosed);
            const isActive = currentStep === step.id && !isClosed;
            return (
              <div
                key={step.id}
                className={`p-2.5 rounded-xl border text-right transition-all ${
                  isDone
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200'
                    : isActive
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-900 dark:text-amber-200 ring-1 ring-amber-500/30'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono font-black">
                    مرحله {toPersianNumbers(step.id)}
                  </span>
                  {isDone ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  ) : isActive ? (
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  ) : null}
                </div>
                <div className="text-xs font-extrabold">{step.label}</div>
                <div className="text-[10px] opacity-80 truncate mt-0.5">{step.sub}</div>
              </div>
            );
          })}
        </div>

        {/* نمایش وضعیت ارجاع داخلی فعلی */}
        {(request.referredDepartment || request.internalReferralNote) && (
          <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 font-bold">
              <Building2 className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>واحد مرجع رسیدگی: {request.referredDepartment || 'دبیرخانه مرکزی'}</span>
            </div>
            {request.internalReferralNote && (
              <span className="text-[11px] text-slate-600 dark:text-slate-300">
                هامش ارجاع: {request.internalReferralNote}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ۲. پیوست مدارک و ذخیره در دیسک سرور */}
      <div className="bg-white dark:bg-slate-900/90 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Paperclip className="w-4 h-4 text-amber-500" />
            <span>فایل‌ها و مدارک پیوست پرونده ({toPersianNumbers(attachments.length)} فایل در دیسک):</span>
          </span>

          {request.status !== 'archived' && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                className="hidden"
                accept={CARTABLE_FILE_ACCEPT}
              />
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                <span>{uploading ? 'در حال ذخیره در دیسک...' : 'افزودن فایل پیوست'}</span>
              </button>
            </div>
          )}
        </div>

        {attachments.length === 0 ? (
          <p className="text-[11px] text-slate-400">
            هنوز فایل یا مدرکی به این درخواست پیوست نشده است. (فرمت‌های مجاز: تصویر، PDF و Word)
          </p>
        ) : (
          <CartableAttachmentList attachments={attachments} />
        )}
      </div>
    </div>
  );
};
