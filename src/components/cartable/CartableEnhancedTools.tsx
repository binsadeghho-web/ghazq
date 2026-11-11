import React, { useState, useRef } from 'react';
import { CartableRequest } from '../../types';
import { api } from '../../services/apiClient';
import { toPersianNumbers } from '../../utils/persianNumbers';
import {
  CheckCircle2,
  Clock,
  Paperclip,
  Upload,
  FileText,
  Download,
  Building2,
  ArrowLeftRight,
  Timer,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface CartableEnhancedToolsProps {
  request: CartableRequest;
  isOfficial: boolean;
  onRequestUpdated: (updated: CartableRequest) => void;
}

const DEPARTMENTS = [
  'دبیرخانه مرکزی خدمات قضایی',
  'واحد صدور گواهی و استعلامات اداری',
  'کارگروه تطبیق واحدهای آموزشی و حوزوی',
  'کمیته منابع انسانی و ارتقای پایه قضایی',
  'واحد پشتیبانی حقوقی و رفاهی',
];

export const CartableEnhancedTools: React.FC<CartableEnhancedToolsProps> = ({
  request,
  isOfficial,
  onRequestUpdated,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [referralDept, setReferralDept] = useState<string>(
    (request as any).referredDepartment || DEPARTMENTS[0]
  );
  const [referralNote, setReferralNote] = useState<string>(
    (request as any).internalReferralNote || ''
  );
  const [savingReferral, setSavingReferral] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  // Determine active step (1..4)
  // Stages: ۱. ثبت درخواست -> ۲. ارجاع به کارشناس -> ۳. در حال پیگیری -> ۴. صدور نتیجه نهایی
  const getStepIndex = (status: CartableRequest['status'], hasReferral: boolean): number => {
    if (status === 'completed' || status === 'rejected' || status === 'archived') return 4;
    if (status === 'in_progress' || status === 'need_info') return 3;
    if (hasReferral) return 2;
    return 1;
  };

  const hasReferral = Boolean((request as any).referredDepartment);
  const currentStep = getStepIndex(request.status, hasReferral);

  const steps = [
    { id: 1, label: 'ثبت درخواست', sub: 'دریافت کد رهگیری' },
    { id: 2, label: 'ارجاع به کارشناس', sub: (request as any).referredDepartment || 'دبیرخانه مرکزی' },
    { id: 3, label: 'در حال پیگیری', sub: request.status === 'need_info' ? 'نیازمند تکمیل مدارک' : 'بررسی تخصصی پرونده' },
    { id: 4, label: 'صدور نتیجه نهایی', sub: request.status === 'completed' ? 'انجام شد' : request.status === 'rejected' ? 'رد شده' : 'مختومه' },
  ];

  // SLA / Waiting Time Indicator calculation
  const slaHours = Number((request as any).slaDeadlineHours) || (request.priority === 'urgent' ? 24 : 48);
  const isClosed = request.status === 'completed' || request.status === 'rejected' || request.status === 'archived';

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await api.uploadFile(file, 'misc');
      if (uploaded?.url) {
        const expectedVersion = (request as any).version || 1;
        const updated = await api.uploadCartableAttachment(request.id, uploaded.url, expectedVersion);
        onRequestUpdated(updated);
        showToast('فایل پیوست با موفقیت در دیسک سرور ذخیره و به پرونده الصاق شد.');
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
      const expectedVersion = (request as any).version || 1;
      const updated = await api.updateCartableReferral(request.id, {
        referredDepartment: referralDept,
        internalReferralNote: referralNote,
        expectedVersion,
      });
      onRequestUpdated(updated);
      showToast('ارجاع داخلی پرونده با موفقیت در پایگاه داده ثبت گردید.');
    } catch (err: any) {
      showToast(`خطا در ثبت ارجاع داخلی: ${err.message || 'خطای سرور'}`);
    } finally {
      setSavingReferral(false);
    }
  };

  const attachments: string[] = Array.isArray((request as any).attachments)
    ? (request as any).attachments
    : [];

  return (
    <div className="space-y-4 pt-3 border-t border-slate-200 dark:border-slate-800" dir="rtl">
      {feedbackMsg && (
        <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* ۱. مراحل پردازش پرونده (با «در حال پیگیری» طبق دستور کاربر) + شاخص زمان انتظار */}
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
        {((request as any).referredDepartment || (request as any).internalReferralNote) && (
          <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 font-bold">
              <Building2 className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>واحد مرجع رسیدگی: {(request as any).referredDepartment || 'دبیرخانه مرکزی'}</span>
            </div>
            {(request as any).internalReferralNote && (
              <span className="text-[11px] text-slate-600 dark:text-slate-300">
                هامش ارجاع: {(request as any).internalReferralNote}
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
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.zip"
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
            هنوز فایل یا مدرکی به این درخواست پیوست نشده است.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {attachments.map((url, idx) => {
              const fileName = url.split('/').pop() || `پیوست-${idx + 1}`;
              return (
                <a
                  key={idx}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500/15 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="truncate max-w-[160px]" dir="ltr">
                    {fileName}
                  </span>
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                </a>
              );
            })}
          </div>
        )}
      </div>

      {/* ۳. ارجاع داخلی بین واحدها (مخصوص ادمین و مسئولین) */}
      {isOfficial && (
        <form
          onSubmit={handleSaveReferral}
          className="bg-slate-100/80 dark:bg-slate-900/90 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 space-y-3"
        >
          <span className="text-xs font-black text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
            <ArrowLeftRight className="w-4 h-4" />
            <span>ارجاع داخلی پرونده به واحدهای تخصصی مرکز:</span>
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                انتخاب واحد مقصد ارجاع:
              </label>
              <select
                value={referralDept}
                onChange={e => setReferralDept(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
              >
                {DEPARTMENTS.map(dept => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                دستور یا یادداشت ارجاع داخلی:
              </label>
              <input
                type="text"
                value={referralNote}
                onChange={e => setReferralNote(e.target.value)}
                placeholder="مثال: جهت استعلام سوابق آموزشی و صدور معرفی‌نامه..."
                className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingReferral}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>{savingReferral ? 'در حال ثبت ارجاع...' : 'ثبت و ارسال ارجاع داخلی'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
