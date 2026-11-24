import React, { useState, useMemo } from 'react';
import {
  Store,
  History,
  CreditCard,
  X,
  Send,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  ChevronLeft,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { WelfareInstallmentPartner } from '../../types';
import { toPersianNumbers } from '../../utils/persianNumbers';
import { formatIsoToJalali } from '../../utils/jalaliDate';

export const WelfareInstallmentsTab: React.FC = () => {
  const {
    currentUser,
    welfarePortalConfig,
    installmentPartners,
    installmentRequests,
    submitInstallmentRequest,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'partners' | 'history'>('partners');
  const [selectedPartner, setSelectedPartner] = useState<WelfareInstallmentPartner | null>(null);

  const [requestedAmountStr, setRequestedAmountStr] = useState('');
  const [months, setMonths] = useState<number>(12);
  const [phone, setPhone] = useState((currentUser as any)?.phone || '');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const activePartners = useMemo(
    () => installmentPartners.filter((p) => p.isActive !== false),
    [installmentPartners]
  );

  const myRequests = useMemo(
    () =>
      installmentRequests.filter(
        (r) => !currentUser || r.applicantId === currentUser.id
      ),
    [installmentRequests, currentUser]
  );

  const openPartnerModal = (partner: WelfareInstallmentPartner) => {
    setSelectedPartner(partner);
    setRequestedAmountStr(
      partner.maxCreditLimit > 0 ? String(Math.min(partner.maxCreditLimit, 50000000)) : ''
    );
    setMonths(partner.durationMonths || 12);
    setDescription('');
    setFeedback(null);
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartner) return;
    const amt = Number(String(requestedAmountStr).replace(/[^\d]/g, '') || 0);
    if (!amt || amt <= 0) {
      setFeedback({ type: 'error', text: 'لطفاً مبلغ اعتبار درخواستی را به تومان وارد کنید.' });
      return;
    }
    if (selectedPartner.maxCreditLimit > 0 && amt > selectedPartner.maxCreditLimit) {
      setFeedback({
        type: 'error',
        text: `حداکثر سقف اعتبار این فروشگاه ${toPersianNumbers(selectedPartner.maxCreditLimit.toLocaleString('fa-IR'))} تومان است.`,
      });
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    try {
      await submitInstallmentRequest({
        partnerId: selectedPartner.id,
        requestedAmount: amt,
        months,
        phone: phone.trim() || undefined,
        description: description.trim() || undefined,
      });
      setSelectedPartner(null);
      setActiveSubTab('history');
      setFeedback({
        type: 'success',
        text: 'درخواست خرید اقساطی شما ثبت شد و در وضعیت «در حال بررسی» قرار گرفت.',
      });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'خطا در ثبت درخواست خرید اقساطی.' });
    } finally {
      setSubmitting(false);
    }
  };

  const renderStatus = (status: string) => {
    if (status === 'approved')
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-black">
          <CheckCircle2 className="w-3.5 h-3.5" /> تایید شده
        </span>
      );
    if (status === 'completed')
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 text-teal-900 border border-teal-200 text-[11px] font-black">
          <CheckCircle2 className="w-3.5 h-3.5" /> تکمیل‌شده
        </span>
      );
    if (status === 'rejected')
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-black">
          <XCircle className="w-3.5 h-3.5" /> رد شده
        </span>
      );
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-black">
        <Clock className="w-3.5 h-3.5" /> در حال بررسی
      </span>
    );
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header + Dedicated "سوابق" Tab Switcher */}
      <div className="rounded-3xl bg-gradient-to-l from-[#071E17] via-[#0B2C22] to-[#0D3327] text-white p-5 sm:p-6 shadow-md border border-emerald-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#F3D078]" />
            <h2 className="text-base sm:text-lg font-black">
              {welfarePortalConfig.modulesConfig.installment_sales.title}
            </h2>
          </div>
          <p className="text-xs text-stone-200 leading-relaxed max-w-2xl">
            {welfarePortalConfig.modulesConfig.installment_sales.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2 p-1 rounded-2xl bg-white/10 border border-white/15 shrink-0">
          <button
            type="button"
            onClick={() => setActiveSubTab('partners')}
            className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all ${
              activeSubTab === 'partners'
                ? 'bg-[#F3D078] text-[#071E17]'
                : 'text-white hover:bg-white/10'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>فروشگاه‌های طرف قرارداد</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('history')}
            className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all ${
              activeSubTab === 'history'
                ? 'bg-[#F3D078] text-[#071E17]'
                : 'text-white hover:bg-white/10'
            }`}
          >
            <History className="w-4 h-4" />
            <span>سوابق ({toPersianNumbers(myRequests.length)})</span>
          </button>
        </div>
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

      {activeSubTab === 'partners' ? (
        activePartners.length === 0 ? (
          <div className="rounded-3xl border border-stone-200 bg-white py-12 text-center text-stone-400 text-xs font-bold">
            فروشگاه طرف قراردادی در حال حاضر فعال نیست.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {activePartners.map((partner) => (
              <div
                key={partner.id}
                onClick={() => openPartnerModal(partner)}
                className="rounded-3xl border border-stone-200/90 bg-white p-5 sm:p-6 shadow-2xs hover:shadow-md hover:border-[#071E17]/40 transition-all flex flex-col justify-between space-y-4 cursor-pointer group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#071E17] text-[#F3D078] flex items-center justify-center shrink-0 overflow-hidden">
                        {partner.logoUrl ? (
                          <img src={partner.logoUrl} alt={partner.name} className="w-full h-full object-cover" />
                        ) : (
                          <Store className="w-6 h-6" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-base font-black text-[#071E17] group-hover:text-emerald-900">
                          {partner.name}
                        </h3>
                        {partner.tagline && (
                          <p className="text-xs text-stone-500 font-bold mt-0.5">{partner.tagline}</p>
                        )}
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] font-black tabular-nums shrink-0">
                      تا {toPersianNumbers(partner.durationMonths)} ماه
                    </span>
                  </div>

                  <p className="text-xs text-stone-600 leading-relaxed">{partner.description}</p>

                  <div className="p-3.5 rounded-2xl bg-[#FCFCF9] border border-stone-200/80 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-stone-500 font-bold">سقف اعتبار خرید:</span>
                      <span className="font-black text-[#071E17] tabular-nums">
                        {toPersianNumbers(partner.creditLimitDisplay)}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-600 leading-relaxed pt-1 border-t border-stone-200/60">
                      {toPersianNumbers(partner.installmentTerms)}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs font-black text-[#071E17]">
                  <span>مشاهده شرایط و ثبت درخواست خرید اقساطی</span>
                  <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="rounded-3xl border border-stone-200/90 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h3 className="text-sm font-black text-[#071E17]">سوابق درخواست‌های خرید اقساطی</h3>
            <span className="text-xs font-bold text-stone-500 tabular-nums">
              {toPersianNumbers(myRequests.length)} درخواست
            </span>
          </div>

          {myRequests.length === 0 ? (
            <div className="py-10 text-center text-stone-400 space-y-2">
              <History className="w-10 h-10 mx-auto opacity-30" />
              <p className="text-xs font-bold">هنوز درخواستی برای خرید اقساطی ثبت نکرده‌اید.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-4 rounded-2xl border border-stone-200/80 bg-[#FCFCF9] space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-sm font-black text-[#071E17]">{req.partnerName}</span>
                      <span className="text-xs text-stone-500 font-bold mr-2 tabular-nums">
                        · مبلغ: {toPersianNumbers(req.requestedAmount.toLocaleString('fa-IR'))} تومان ·{' '}
                        {toPersianNumbers(req.months)} قسط ماهانه
                      </span>
                    </div>
                    {renderStatus(req.status)}
                  </div>
                  {req.description && <p className="text-xs text-stone-600">{req.description}</p>}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-500 pt-1 border-t border-stone-200/60 tabular-nums">
                    <span>تاریخ ثبت: {formatIsoToJalali(req.createdAt)}</span>
                    {req.adminNote && (
                      <span className="text-emerald-900 font-bold">پاسخ واحد رفاه: {req.adminNote}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Partner Detail & Credit Request Modal (Mobile-Safe Pinned Header/Footer) */}
      {selectedPartner && (
        <div
          className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setSelectedPartner(null)}
        >
          <div
            className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl border border-stone-200 shadow-2xl max-h-[92dvh] sm:max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-stone-200 bg-[#071E17] text-white">
              <div>
                <h3 className="text-sm font-black">درخواست خرید اقساطی از «{selectedPartner.name}»</h3>
                <p className="text-[11px] text-[#F3D078] font-bold mt-0.5 tabular-nums">
                  {toPersianNumbers(selectedPartner.creditLimitDisplay)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPartner(null)}
                className="min-h-[40px] min-w-[40px] rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
                aria-label="بستن"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              id="installment-request-form"
              onSubmit={handleSubmitRequest}
              className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain p-5 space-y-4"
            >
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-stone-700 space-y-1 leading-relaxed">
                <div className="font-black text-[#071E17]">شرایط اقساط و ضوابط فروشگاه:</div>
                <p>{toPersianNumbers(selectedPartner.installmentTerms)}</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-stone-800 block">
                  مبلغ اعتبار درخواستی (تومان) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={requestedAmountStr}
                  onChange={(e) => setRequestedAmountStr(e.target.value.replace(/[^\d]/g, ''))}
                  placeholder="مثال: 50000000"
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm font-black tabular-nums bg-stone-50"
                />
                {Number(requestedAmountStr || 0) > 0 && (
                  <p className="text-[11px] font-bold text-emerald-800 tabular-nums">
                    معادل: {toPersianNumbers(Number(requestedAmountStr).toLocaleString('fa-IR'))} تومان
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-stone-800 block">تعداد اقساط (ماه)</label>
                  <input
                    type="number"
                    min={1}
                    max={selectedPartner.durationMonths || 36}
                    value={months}
                    onChange={(e) => setMonths(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-stone-300 text-xs font-black tabular-nums bg-stone-50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-stone-800 block">شماره تماس</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="09120000000"
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-stone-300 text-xs font-bold tabular-nums bg-stone-50"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-stone-800 block">
                  شرح کالا یا توضیحات تکمیلی
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="نوع کالای مورد نظر، شعبه ترجیحی یا توضیحات تکمیلی..."
                  className="w-full p-3 rounded-xl border border-stone-300 text-xs leading-relaxed bg-stone-50"
                />
              </div>
            </form>

            <div className="shrink-0 flex items-center justify-end gap-2 px-5 py-3.5 border-t border-stone-200 bg-stone-50 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={() => setSelectedPartner(null)}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-stone-200 text-stone-700 text-xs font-bold cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="submit"
                form="installment-request-form"
                disabled={submitting}
                className="min-h-[44px] px-6 py-2 rounded-xl bg-[#071E17] text-[#F3D078] text-xs font-black flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? 'در حال ثبت...' : 'ارسال درخواست (در حال بررسی)'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
