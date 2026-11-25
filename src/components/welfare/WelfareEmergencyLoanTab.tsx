import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Info,
  Send,
  X,
  CheckCircle2,
  Clock,
  XCircle,
  Banknote,
  AlertCircle,
  FileText,
  Upload,
  Paperclip,
  Trash2,
  Download,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/apiClient';
import { toPersianNumbers } from '../../utils/persianNumbers';
import { formatIsoToJalali } from '../../utils/jalaliDate';

const QUICK_AMOUNT_PRESETS = [10000000, 20000000, 30000000, 50000000];

export const WelfareEmergencyLoanTab: React.FC = () => {
  const { currentUser, welfareRequests, welfarePortalConfig, submitWelfareRequest } = useApp();

  const [amountInput, setAmountInput] = useState('');
  const [reasonInput, setReasonInput] = useState('');
  const [attachments, setAttachments] = useState<Array<{ url: string; name: string; size?: number }>>([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [isDescModalOpen, setIsDescModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const myLoanRequests = useMemo(
    () =>
      welfareRequests.filter(
        (r) =>
          (r.type === 'emergency_loan' || r.type === 'loan') &&
          (!currentUser || r.applicantId === currentUser.id)
      ),
    [welfareRequests, currentUser]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    const numericAmount = Number(String(amountInput).replace(/[^\d]/g, ''));
    if (!numericAmount || numericAmount <= 0) {
      setFeedback({ type: 'error', text: 'لطفاً مبلغ درخواستی معتبر را به تومان وارد کنید.' });
      return;
    }
    if (!reasonInput.trim() || reasonInput.trim().length < 5) {
      setFeedback({ type: 'error', text: 'لطفاً علت درخواست تسهیلات اضطراری را شرح دهید.' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    try {
      const formattedVal = `${toPersianNumbers(numericAmount.toLocaleString('fa-IR'))} تومان`;
      await submitWelfareRequest({
        type: 'emergency_loan',
        typeTitle: welfarePortalConfig.modulesConfig.emergency_loan.title || 'تسهیلات اضطراری',
        applicantId: currentUser.id,
        applicantName: currentUser.fullName,
        title: `درخواست تسهیلات اضطراری (${formattedVal})`,
        requestedValue: formattedVal,
        description: reasonInput.trim(),
        rulesAcknowledged: true,
        metadata: {
          amountToman: numericAmount,
          ...(attachments.length > 0 ? { attachments } : {}),
        },
      });
      setAmountInput('');
      setReasonInput('');
      setAttachments([]);
      setFeedback({
        type: 'success',
        text: 'درخواست تسهیلات اضطراری شما ثبت شد و در صف رسیدگی ۴۸ ساعته کارگروه قرار گرفت.',
      });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'خطا در ثبت درخواست تسهیلات.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStatusLabel = (status: string) => {
    if (status === 'approved') {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> تایید شده
        </span>
      );
    }
    if (status === 'disbursed') {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-teal-900 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-lg">
          <Banknote className="w-3.5 h-3.5 shrink-0" /> واریز شده
        </span>
      );
    }
    if (status === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg">
          <XCircle className="w-3.5 h-3.5 shrink-0" /> رد شده
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
        <Clock className="w-3.5 h-3.5 shrink-0" /> در حال بررسی کارگروه
      </span>
    );
  };

  const rawNum = Number(String(amountInput).replace(/[^\d]/g, '') || 0);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Dedicated Page Header */}
      <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-bl from-[#071E17] via-[#0B2C22] to-[#113D2F] text-white p-5 sm:p-7 border border-[#F3D078]/30 shadow-md">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-l from-transparent via-[#F3D078]/70 to-transparent"
        />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-bold text-[#F3D078]">
              <CreditCard className="w-4 h-4 shrink-0" />
              <span>صفحه اختصاصی بخش ۰۱ · حمایت مالی فوری</span>
            </div>
            <h1 className="text-lg sm:text-2xl font-black text-white">
              {welfarePortalConfig.modulesConfig.emergency_loan.title}
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/85 leading-relaxed">
              {welfarePortalConfig.modulesConfig.emergency_loan.subtitle}
            </p>
            {welfarePortalConfig.emergencyLoanMaxAmountLabel && (
              <p className="text-xs font-black text-[#F3D078] tabular-nums pt-1">
                {toPersianNumbers(welfarePortalConfig.emergencyLoanMaxAmountLabel)}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 shrink-0">
            <div className="text-right border-l border-white/15 pl-4">
              <div className="text-[11px] text-emerald-200/75 font-bold">پرونده‌های شما</div>
              <div className="text-xl font-black text-white tabular-nums mt-0.5">
                {toPersianNumbers(myLoanRequests.length)} مورد
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsDescModalOpen(true)}
              className="min-h-[44px] px-5 py-2.5 rounded-2xl bg-[#F3D078] hover:bg-amber-300 text-[#071E17] text-xs font-black flex items-center justify-center gap-2 whitespace-nowrap shrink-0 transition-colors shadow-sm cursor-pointer"
            >
              <Info className="w-4 h-4 shrink-0" />
              <span>ضوابط و راهنمای دریافت</span>
            </button>
          </div>
        </div>
      </section>

      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs sm:text-sm font-bold flex items-center gap-2.5 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Split Focus Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Form Workspace */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-5 rounded-[26px] border border-[#E2DAC3] bg-white p-5 sm:p-6 shadow-2xs space-y-5"
        >
          <div className="border-b border-stone-100 pb-3.5 space-y-1">
            <h2 className="text-sm sm:text-base font-black text-[#071E17]">
              فرم ثبت درخواست تسهیلات اضطراری
            </h2>
            <p className="text-[11px] text-stone-500">
              رسیدگی اولیه ظرف ۴۸ ساعت کاری در کارگروه رفاه انجام می‌شود.
            </p>
          </div>

          <div className="space-y-2.5">
            <label className="text-xs font-black text-stone-800 block">
              انتخاب سریع یا درج مبلغ درخواستی (تومان) <span className="text-rose-500">*</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2">
              {QUICK_AMOUNT_PRESETS.map((preset) => {
                const isSelected = rawNum === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmountInput(String(preset))}
                    className={`min-h-[40px] px-3 py-2 rounded-xl border text-xs font-black tabular-nums transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#071E17] text-[#F3D078] border-[#071E17]'
                        : 'bg-[#FCFCF9] text-stone-700 border-stone-200 hover:border-emerald-400'
                    }`}
                  >
                    {toPersianNumbers((preset / 1000000).toLocaleString('fa-IR'))} میلیون تومان
                  </button>
                );
              })}
            </div>

            <input
              type="text"
              inputMode="numeric"
              required
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value.replace(/[^\d]/g, ''))}
              placeholder="یا مبلغ دلخواه به تومان، مثال: 30000000"
              className="w-full min-h-[46px] px-4 py-2.5 rounded-xl border border-stone-300 text-sm font-black tabular-nums bg-stone-50 focus:bg-white focus:border-[#071E17] outline-none"
            />
            {rawNum > 0 && (
              <p className="text-xs text-emerald-800 font-black tabular-nums">
                معادل عددی: {toPersianNumbers(rawNum.toLocaleString('fa-IR'))} تومان
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black text-stone-800 block">
              علت درخواست و شرح نیاز <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              required
              value={reasonInput}
              onChange={(e) => setReasonInput(e.target.value)}
              placeholder="موضوع ضرورت، هزینه درمان، ودیعه مسکن یا شرایط پیش‌آمده را به صورت روشن شرح دهید..."
              className="w-full p-3.5 rounded-xl border border-stone-300 text-xs leading-relaxed bg-stone-50 focus:bg-white focus:border-[#071E17] outline-none"
            />
          </div>

          <div className="p-3.5 rounded-2xl border border-dashed border-stone-300 bg-[#FCFCF9] space-y-2 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="font-black text-[#071E17] flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-emerald-700" />
                  <span>مدارک یا فیش پشتیبان (اختیاری)</span>
                </span>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  PDF، Word یا تصویر (حداکثر ۸ مگابایت)
                </p>
              </div>
              <label className="px-3 py-2 min-h-[36px] rounded-xl bg-stone-200 hover:bg-stone-300 text-[#071E17] font-black inline-flex items-center gap-1.5 cursor-pointer shrink-0">
                <Upload className="w-3.5 h-3.5" />
                <span>{uploadingDoc ? 'در حال آپلود...' : 'انتخاب مدرک'}</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,image/jpeg,image/png,image/webp"
                  disabled={uploadingDoc}
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    e.target.value = '';
                    if (!f) return;
                    if (f.size > 8 * 1024 * 1024) {
                      setFeedback({ type: 'error', text: 'حجم فایل نباید بیشتر از ۸ مگابایت باشد.' });
                      return;
                    }
                    setUploadingDoc(true);
                    setFeedback(null);
                    try {
                      const up = await api.uploadFile(f, 'welfare_receipt');
                      if (up?.url) {
                        setAttachments((prev) => [
                          ...prev,
                          { url: up.url, name: up.originalName || f.name, size: up.sizeBytes || f.size },
                        ]);
                      }
                    } catch (err: any) {
                      setFeedback({ type: 'error', text: err?.message || 'آپلود مدرک با خطا مواجه شد.' });
                    } finally {
                      setUploadingDoc(false);
                    }
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
                    className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-white border border-stone-200"
                  >
                    <span className="truncate font-bold text-stone-700 flex items-center gap-1.5">
                      <Paperclip className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span className="truncate">{att.name}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                      className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full min-h-[48px] rounded-2xl bg-[#071E17] hover:bg-[#0B2C22] text-[#F3D078] text-xs font-black flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer disabled:opacity-60"
          >
            <Send className="w-4 h-4 shrink-0" />
            <span>{isSubmitting ? 'در حال ثبت درخواست...' : 'ارسال نهایی درخواست تسهیلات'}</span>
          </button>
        </form>

        {/* Live Tracking Ledger */}
        <div className="lg:col-span-7 rounded-[26px] border border-[#E2DAC3] bg-white p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3.5">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#071E17]" />
              <h2 className="text-sm sm:text-base font-black text-[#071E17]">
                کارنامه و وضعیت درخواست‌های من
              </h2>
            </div>
            <span className="text-xs font-bold text-stone-500 tabular-nums">
              {toPersianNumbers(myLoanRequests.length)} پرونده
            </span>
          </div>

          {myLoanRequests.length === 0 ? (
            <div className="py-12 text-center space-y-2.5 text-stone-400">
              <CreditCard className="w-10 h-10 mx-auto opacity-30" />
              <p className="text-xs font-bold text-stone-500">
                تاکنون درخواستی برای تسهیلات اضطراری ثبت نکرده‌اید.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {myLoanRequests.map((req) => {
                const isDone = req.status === 'approved' || req.status === 'disbursed';
                const isRejected = req.status === 'rejected';
                return (
                  <div
                    key={req.id}
                    className="p-4 sm:p-5 rounded-2xl border border-stone-200/85 bg-[#FCFCF9] space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="font-black text-sm text-[#071E17] tabular-nums">
                        {req.requestedValue || req.title}
                      </div>
                      {renderStatusLabel(req.status)}
                    </div>

                    <p className="text-xs text-stone-600 leading-relaxed">{req.description}</p>

                    {Array.isArray(req.metadata?.attachments) && req.metadata.attachments.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span className="font-bold text-stone-500 inline-flex items-center gap-1">
                          <Paperclip className="w-3.5 h-3.5 text-emerald-700" />
                          <span>مدارک پیوست:</span>
                        </span>
                        {req.metadata.attachments.map((att: any, idx: number) => (
                          <button
                            key={`${att.url}-${idx}`}
                            type="button"
                            onClick={async () => {
                              try {
                                await api.downloadPrivateFile(att.url, att.name);
                              } catch (err: any) {
                                setFeedback({ type: 'error', text: err?.message || 'خطا در دانلود مدرک پیوست.' });
                              }
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white hover:bg-emerald-50 text-[#071E17] border border-stone-200 font-bold cursor-pointer"
                          >
                            <Download className="w-3 h-3 text-emerald-700" />
                            <span>{att.name || `مدرک ${idx + 1}`}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* 3-Step Visual Progress */}
                    <div className="grid grid-cols-3 gap-2 pt-1 text-[10px] font-bold">
                      <div className="space-y-1">
                        <div className="h-1.5 rounded-full bg-emerald-700" />
                        <span className="text-emerald-900 block">۱. ثبت پرونده</span>
                      </div>
                      <div className="space-y-1">
                        <div
                          className={`h-1.5 rounded-full ${
                            isDone
                              ? 'bg-emerald-700'
                              : isRejected
                              ? 'bg-rose-400'
                              : 'bg-amber-400'
                          }`}
                        />
                        <span className="text-stone-700 block">۲. بررسی کارگروه</span>
                      </div>
                      <div className="space-y-1">
                        <div
                          className={`h-1.5 rounded-full ${
                            req.status === 'disbursed'
                              ? 'bg-emerald-700'
                              : isDone
                              ? 'bg-emerald-400'
                              : isRejected
                              ? 'bg-rose-600'
                              : 'bg-stone-200'
                          }`}
                        />
                        <span className="text-stone-600 block">
                          {isRejected ? '۳. عدم تایید' : '۳. تایید و واریز'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-500 pt-2 border-t border-stone-200/70">
                      <span className="tabular-nums">
                        تاریخ ثبت: {formatIsoToJalali(req.createdAt)}
                      </span>
                      {req.adminNote && (
                        <span className="text-emerald-900 font-bold">
                          پاسخ کارشناس: {req.adminNote}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Mobile-Safe Pinned Terms Modal */}
      {isDescModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setIsDescModalOpen(false)}
        >
          <div
            className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl border border-stone-200 shadow-2xl max-h-[92dvh] sm:max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-stone-200 bg-[#071E17] text-white">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-[#F3D078]" />
                <h3 className="text-sm font-black">ضوابط و شرایط تسهیلات اضطراری</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDescModalOpen(false)}
                className="min-h-[40px] min-w-[40px] rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
                aria-label="بستن"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain p-5 space-y-3 text-xs sm:text-sm text-stone-700 leading-7">
              <p className="whitespace-pre-line">
                {welfarePortalConfig.emergencyLoanDescription ||
                  'این بخش جهت رسیدگی به درخواست‌های ضروری اعضا طراحی شده است.'}
              </p>
              {welfarePortalConfig.emergencyLoanMaxAmountLabel && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs font-bold tabular-nums">
                  سقف و شرایط فعلی: {toPersianNumbers(welfarePortalConfig.emergencyLoanMaxAmountLabel)}
                </div>
              )}
            </div>

            <div className="shrink-0 px-5 py-3.5 border-t border-stone-200 bg-stone-50 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={() => setIsDescModalOpen(false)}
                className="w-full min-h-[44px] rounded-xl bg-[#071E17] text-[#F3D078] text-xs font-black cursor-pointer"
              >
                متوجه شدم
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
