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
  ArrowLeft,
  Calculator,
  Upload,
  Paperclip,
  Trash2,
  Download,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/apiClient';
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
  const [failedLogos, setFailedLogos] = useState<Record<string, boolean>>({});

  const [requestedAmountStr, setRequestedAmountStr] = useState('');
  const [months, setMonths] = useState<number>(12);
  const [phone, setPhone] = useState((currentUser as any)?.phone || '');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState<Array<{ url: string; name: string; size?: number }>>([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const activePartners = useMemo(
    () => installmentPartners.filter((p) => p.isActive !== false),
    [installmentPartners]
  );

  const myRequests = useMemo(
    () =>
      installmentRequests.filter((r) => !currentUser || r.applicantId === currentUser.id),
    [installmentRequests, currentUser]
  );

  const openPartnerModal = (partner: WelfareInstallmentPartner) => {
    setSelectedPartner(partner);
    setRequestedAmountStr(
      partner.maxCreditLimit > 0 ? String(Math.min(partner.maxCreditLimit, 50000000)) : ''
    );
    setMonths(partner.durationMonths || 12);
    setDescription('');
    setAttachments([]);
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
        text: `حداکثر سقف اعتبار این فروشگاه ${toPersianNumbers(
          selectedPartner.maxCreditLimit.toLocaleString('fa-IR')
        )} تومان است.`,
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
        attachments: attachments.length > 0 ? attachments : undefined,
      });
      setSelectedPartner(null);
      setAttachments([]);
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
    if (status === 'approved') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-black">
          <CheckCircle2 className="w-3.5 h-3.5" /> تایید شده
        </span>
      );
    }
    if (status === 'completed') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 text-teal-900 border border-teal-200 text-[11px] font-black">
          <CheckCircle2 className="w-3.5 h-3.5" /> تکمیل‌شده
        </span>
      );
    }
    if (status === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-black">
          <XCircle className="w-3.5 h-3.5" /> رد شده
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-black">
        <Clock className="w-3.5 h-3.5" /> در حال بررسی
      </span>
    );
  };

  const parsedRequestedAmount = Number(String(requestedAmountStr).replace(/[^\d]/g, '') || 0);
  const estimatedMonthly =
    parsedRequestedAmount > 0 && months > 0
      ? Math.round(parsedRequestedAmount / months)
      : 0;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Dedicated Showroom Header */}
      <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-bl from-[#071E17] via-[#0B2C22] to-[#113D2F] text-white p-5 sm:p-7 border border-[#F3D078]/30 shadow-md">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-l from-transparent via-[#F3D078]/70 to-transparent"
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-bold text-[#F3D078]">
              <CreditCard className="w-4 h-4 shrink-0" />
              <span>صفحه اختصاصی بخش ۰۵ · معرفی‌نامه خرید اقساطی</span>
            </div>
            <h1 className="text-lg sm:text-2xl font-black text-white">
              {welfarePortalConfig.modulesConfig.installment_sales.title}
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/85 leading-relaxed">
              {welfarePortalConfig.modulesConfig.installment_sales.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-white/10 border border-white/15 shrink-0">
            <button
              type="button"
              onClick={() => setActiveSubTab('partners')}
              className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
                activeSubTab === 'partners'
                  ? 'bg-[#F3D078] text-[#071E17]'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <Store className="w-4 h-4 shrink-0" />
              <span>فروشگاه‌های طرف قرارداد</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('history')}
              className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
                activeSubTab === 'history'
                  ? 'bg-[#F3D078] text-[#071E17]'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <History className="w-4 h-4 shrink-0" />
              <span className="tabular-nums">
                سوابق اعتبار ({toPersianNumbers(myRequests.length)})
              </span>
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

      {activeSubTab === 'partners' ? (
        activePartners.length === 0 ? (
          <div className="rounded-[26px] border border-[#E2DAC3] bg-white py-14 text-center text-stone-400 text-xs font-bold">
            فروشگاه طرف قراردادی در حال حاضر فعال نیست.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {activePartners.map((partner) => {
              const showLogo = Boolean(partner.logoUrl) && !failedLogos[partner.id];
              return (
                <button
                  key={partner.id}
                  type="button"
                  onClick={() => openPartnerModal(partner)}
                  className="text-right rounded-[26px] border border-[#E2DAC3] bg-white p-5 sm:p-6 shadow-2xs hover:shadow-lg hover:border-[#071E17]/45 transition-all flex flex-col justify-between space-y-4 cursor-pointer group"
                >
                  <div className="space-y-3.5 w-full">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-13 h-13 rounded-2xl bg-[#071E17] text-[#F3D078] flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                          {showLogo ? (
                            <img
                              src={partner.logoUrl}
                              alt={partner.name}
                              referrerPolicy="no-referrer"
                              onError={() =>
                                setFailedLogos((prev) => ({ ...prev, [partner.id]: true }))
                              }
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Store className="w-6 h-6" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h2 className="text-base sm:text-lg font-black text-[#071E17] group-hover:text-emerald-900 truncate">
                            {partner.name}
                          </h2>
                          {partner.tagline && (
                            <p className="text-xs text-stone-500 font-bold mt-0.5 truncate">
                              {partner.tagline}
                            </p>
                          )}
                        </div>
                      </div>

                      <span className="text-xs font-black text-emerald-800 tabular-nums shrink-0">
                        بازپرداخت تا {toPersianNumbers(partner.durationMonths)} ماه
                      </span>
                    </div>

                    <p className="text-xs sm:text-[13px] text-stone-600 leading-relaxed">
                      {partner.description}
                    </p>

                    <div className="p-4 rounded-2xl bg-[#FCFCF9] border border-stone-200/85 space-y-2 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-stone-500 font-bold">سقف اعتبار خرید:</span>
                        <span className="font-black text-[#071E17] tabular-nums">
                          {toPersianNumbers(partner.creditLimitDisplay)}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-600 leading-relaxed pt-2 border-t border-stone-200/70">
                        {toPersianNumbers(partner.installmentTerms)}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-black text-[#071E17] w-full">
                    <span>مشاهده شرایط و ثبت درخواست اعتبار</span>
                    <span className="w-8 h-8 rounded-xl bg-[#071E17]/6 group-hover:bg-[#071E17] text-[#071E17] group-hover:text-[#F3D078] flex items-center justify-center transition-colors">
                      <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )
      ) : (
        <div className="rounded-[26px] border border-[#E2DAC3] bg-white p-5 sm:p-7 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3.5">
            <h2 className="text-sm sm:text-base font-black text-[#071E17]">
              سوابق درخواست‌های خرید اقساطی من
            </h2>
            <span className="text-xs font-bold text-stone-500 tabular-nums">
              {toPersianNumbers(myRequests.length)} درخواست
            </span>
          </div>

          {myRequests.length === 0 ? (
            <div className="py-12 text-center text-stone-400 space-y-2">
              <History className="w-10 h-10 mx-auto opacity-30" />
              <p className="text-xs font-bold text-stone-500">
                هنوز درخواستی برای خرید اقساطی ثبت نکرده‌اید.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {myRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-4 sm:p-5 rounded-2xl border border-stone-200/85 bg-[#FCFCF9] space-y-2"
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
                  {Array.isArray(req.attachments) && req.attachments.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                      <span className="font-bold text-stone-500 inline-flex items-center gap-1">
                        <Paperclip className="w-3.5 h-3.5 text-emerald-700" />
                        <span>مدارک پیوست:</span>
                      </span>
                      {req.attachments.map((att, idx) => (
                        <button
                          key={`${att.url}-${idx}`}
                          type="button"
                          onClick={async () => {
                            try {
                              await api.downloadPrivateFile(att.url, att.name);
                            } catch (err: any) {
                              setFeedback({ type: 'error', text: err?.message || 'خطا در دانلود فایل پیوست.' });
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
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-500 pt-2 border-t border-stone-200/70 tabular-nums">
                    <span>تاریخ ثبت: {formatIsoToJalali(req.createdAt)}</span>
                    {req.adminNote && (
                      <span className="text-emerald-900 font-bold">
                        پاسخ واحد رفاه: {req.adminNote}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Partner Credit Request Modal (Mobile-Safe Pinned Sheet + Live Installment Estimator) */}
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
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm font-black tabular-nums bg-stone-50 focus:bg-white focus:border-[#071E17] outline-none"
                />
                {parsedRequestedAmount > 0 && (
                  <p className="text-[11px] font-bold text-emerald-800 tabular-nums">
                    معادل: {toPersianNumbers(parsedRequestedAmount.toLocaleString('fa-IR'))} تومان
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

              {estimatedMonthly > 0 && (
                <div className="p-3.5 rounded-2xl bg-[#FCFCF9] border border-[#E2DAC3] flex items-center justify-between gap-2 text-xs">
                  <span className="flex items-center gap-1.5 font-bold text-stone-600">
                    <Calculator className="w-4 h-4 text-[#071E17]" />
                    <span>برآورد قسط ماهانه (پایه):</span>
                  </span>
                  <span className="font-black text-[#071E17] tabular-nums">
                    حدود {toPersianNumbers(estimatedMonthly.toLocaleString('fa-IR'))} تومان / ماه
                  </span>
                </div>
              )}

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

              <div className="p-3.5 rounded-2xl border border-dashed border-stone-300 bg-[#FCFCF9] space-y-2 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-black text-[#071E17] flex items-center gap-1.5">
                      <Paperclip className="w-3.5 h-3.5 text-emerald-700" />
                      <span>پیوست پیش‌فاکتور یا مدرک شغلی (اختیاری)</span>
                    </span>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      PDF، Word یا تصویر (حداکثر ۸ مگابایت)
                    </p>
                  </div>
                  <label className="px-3 py-2 min-h-[36px] rounded-xl bg-stone-200 hover:bg-stone-300 text-[#071E17] font-black inline-flex items-center gap-1.5 cursor-pointer shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingDoc ? 'در حال آپلود...' : 'انتخاب فایل'}</span>
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
