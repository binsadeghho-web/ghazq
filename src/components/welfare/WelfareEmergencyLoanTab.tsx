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
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { toPersianNumbers } from '../../utils/persianNumbers';
import { formatIsoToJalali } from '../../utils/jalaliDate';

export const WelfareEmergencyLoanTab: React.FC = () => {
  const { currentUser, welfareRequests, welfarePortalConfig, submitWelfareRequest } = useApp();

  const [amountInput, setAmountInput] = useState('');
  const [reasonInput, setReasonInput] = useState('');
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
        metadata: { amountToman: numericAmount },
      });
      setAmountInput('');
      setReasonInput('');
      setFeedback({
        type: 'success',
        text: 'درخواست تسهیلات اضطراری شما با موفقیت ثبت شد و برای بررسی به کارگروه رفاه ارسال گردید.',
      });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'خطا در ثبت درخواست تسهیلات.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStatus = (status: string) => {
    if (status === 'approved')
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5" /> تایید شده
        </span>
      );
    if (status === 'disbursed')
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-black bg-teal-50 text-teal-900 border border-teal-200">
          <Banknote className="w-3.5 h-3.5" /> واریز شده
        </span>
      );
    if (status === 'rejected')
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-black bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle className="w-3.5 h-3.5" /> رد شده
        </span>
      );
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-black bg-amber-50 text-amber-800 border border-amber-200">
        <Clock className="w-3.5 h-3.5" /> در حال بررسی
      </span>
    );
  };

  const rawNum = Number(String(amountInput).replace(/[^\d]/g, '') || 0);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header Card with Prominent "توضیحات" Button */}
      <div className="rounded-3xl bg-gradient-to-l from-[#071E17] via-[#0B2C22] to-[#0D3327] text-white p-5 sm:p-6 shadow-md border border-emerald-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#F3D078]" />
            <h2 className="text-base sm:text-lg font-black">
              {welfarePortalConfig.modulesConfig.emergency_loan.title}
            </h2>
          </div>
          <p className="text-xs text-stone-200 leading-relaxed max-w-2xl">
            {welfarePortalConfig.modulesConfig.emergency_loan.subtitle}
          </p>
          {welfarePortalConfig.emergencyLoanMaxAmountLabel && (
            <p className="text-[11px] text-[#F3D078] font-bold">
              {toPersianNumbers(welfarePortalConfig.emergencyLoanMaxAmountLabel)}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsDescModalOpen(true)}
          className="min-h-[44px] px-4 py-2.5 rounded-2xl bg-[#F3D078] hover:bg-amber-300 text-[#071E17] text-xs font-black flex items-center justify-center gap-2 shrink-0 transition-all shadow-sm cursor-pointer"
        >
          <Info className="w-4 h-4" />
          <span>توضیحات و ضوابط</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Request Form */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-5 rounded-3xl border border-stone-200/90 bg-white p-5 sm:p-6 shadow-2xs space-y-4"
        >
          <h3 className="text-sm font-black text-[#071E17] border-b border-stone-100 pb-3">
            ثبت درخواست جدید تسهیلات اضطراری
          </h3>

          <div className="space-y-1.5">
            <label className="text-xs font-black text-stone-700 block">
              مبلغ درخواستی (تومان) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              required
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value.replace(/[^\d]/g, ''))}
              placeholder="مثال: 30000000"
              className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm font-black tabular-nums bg-stone-50 focus:bg-white focus:border-[#071E17] outline-none"
            />
            {rawNum > 0 && (
              <p className="text-[11px] text-emerald-800 font-bold tabular-nums">
                معادل: {toPersianNumbers(rawNum.toLocaleString('fa-IR'))} تومان
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black text-stone-700 block">
              علت درخواست و شرح نیاز اضطراری <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              required
              value={reasonInput}
              onChange={(e) => setReasonInput(e.target.value)}
              placeholder="موضوع ضرورت، هزینه درمان، مسکن یا شرایط پیش‌آمده را به صورت مختصر شرح دهید..."
              className="w-full p-3.5 rounded-xl border border-stone-300 text-xs leading-relaxed bg-stone-50 focus:bg-white focus:border-[#071E17] outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full min-h-[46px] rounded-2xl bg-[#071E17] hover:bg-[#0B2C22] text-[#F3D078] text-xs font-black flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer disabled:opacity-60"
          >
            <Send className="w-4 h-4" />
            <span>{isSubmitting ? 'در حال ثبت درخواست...' : 'ارسال درخواست تسهیلات اضطراری'}</span>
          </button>
        </form>

        {/* Request History */}
        <div className="lg:col-span-7 rounded-3xl border border-stone-200/90 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h3 className="text-sm font-black text-[#071E17]">سوابق درخواست‌های تسهیلات من</h3>
            <span className="text-xs font-bold text-stone-500 tabular-nums">
              {toPersianNumbers(myLoanRequests.length)} پرونده
            </span>
          </div>

          {myLoanRequests.length === 0 ? (
            <div className="py-10 text-center space-y-2 text-stone-400">
              <CreditCard className="w-10 h-10 mx-auto opacity-30" />
              <p className="text-xs font-bold">تاکنون درخواستی برای تسهیلات اضطراری ثبت نکرده‌اید.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myLoanRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-4 rounded-2xl border border-stone-200/80 bg-[#FCFCF9] space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-black text-xs sm:text-sm text-[#071E17] tabular-nums">
                      {req.requestedValue || req.title}
                    </div>
                    {renderStatus(req.status)}
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed">{req.description}</p>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-500 pt-1 border-t border-stone-200/60">
                    <span className="tabular-nums">تاریخ ثبت: {formatIsoToJalali(req.createdAt)}</span>
                    {req.adminNote && (
                      <span className="text-emerald-900 font-bold">پاسخ کارشناس: {req.adminNote}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile-Safe Pinned Description Modal */}
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
                <h3 className="text-sm font-black">توضیحات و ضوابط تسهیلات اضطراری</h3>
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
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs font-bold">
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
