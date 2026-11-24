import React, { useState, useMemo } from 'react';
import {
  Landmark,
  UserPlus,
  Edit3,
  Trash2,
  CreditCard,
  History,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  X,
  Upload,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/apiClient';
import { toPersianNumbers } from '../../utils/persianNumbers';
import {
  JALALI_MONTH_NAMES,
  formatIsoToJalali,
  getTehranTodayIso,
  isoToJalali,
} from '../../utils/jalaliDate';

export const WelfareQarzolhasanehFundTab: React.FC = () => {
  const {
    welfarePortalConfig,
    myFundMembership,
    myFundPayments,
    applyFundMembership,
    editPendingFundMembership,
    deletePendingFundMembership,
    payFundFee,
  } = useApp();

  const fundConfig = welfarePortalConfig.fundConfig;

  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState<number>(fundConfig.presetTiers[0] || 1000000);
  const [customFeeStr, setCustomFeeStr] = useState<string>('');
  const [useCustomFee, setUseCustomFee] = useState(false);

  const [activeApprovedSubTab, setActiveApprovedSubTab] = useState<'pay' | 'history'>('pay');
  const [payAmount, setPayAmount] = useState<number>(myFundMembership?.monthlyFeeAmount || 1000000);
  const currentJalaliPeriod = useMemo(() => {
    const j = isoToJalali(getTehranTodayIso());
    return `${JALALI_MONTH_NAMES[j.jm - 1]} ${toPersianNumbers(j.jy)}`;
  }, []);
  const [periodLabel, setPeriodLabel] = useState<string>(currentJalaliPeriod);
  const [paymentMethod, setPaymentMethod] = useState<
    'online_gateway' | 'card_transfer' | 'payroll_deduction'
  >('online_gateway');
  const [receiptUrl, setReceiptUrl] = useState<string>('');
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);

  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const totalVerifiedBalance = useMemo(
    () =>
      myFundPayments
        .filter((p) => p.status === 'verified')
        .reduce((acc, p) => acc + Number(p.amount || 0), 0),
    [myFundPayments]
  );

  const resolvedFeeAmount = useCustomFee
    ? Number(String(customFeeStr).replace(/[^\d]/g, '') || 0)
    : selectedFee;

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvedFeeAmount || resolvedFeeAmount <= 0) {
      setFeedback({ type: 'error', text: 'لطفاً مبلغ حق عضویت ماهانه را مشخص کنید.' });
      return;
    }
    setBusy(true);
    setFeedback(null);
    try {
      await applyFundMembership(resolvedFeeAmount);
      setIsApplyModalOpen(false);
      setFeedback({
        type: 'success',
        text: 'درخواست عضویت شما در صندوق قرض‌الحسنه ثبت شد و در انتظار تایید مدیریت صندوق است.',
      });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'خطا در ثبت عضویت صندوق.' });
    } finally {
      setBusy(false);
    }
  };

  const handleEditPendingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myFundMembership) return;
    if (!resolvedFeeAmount || resolvedFeeAmount <= 0) {
      setFeedback({ type: 'error', text: 'مبلغ حق عضویت جدید نامعتبر است.' });
      return;
    }
    setBusy(true);
    setFeedback(null);
    try {
      await editPendingFundMembership(myFundMembership.id, resolvedFeeAmount);
      setIsEditModalOpen(false);
      setFeedback({ type: 'success', text: 'مبلغ حق عضویت درخواستی شما با موفقیت ویرایش شد.' });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'خطا در ویرایش درخواست عضویت.' });
    } finally {
      setBusy(false);
    }
  };

  const handleDeletePending = async () => {
    if (!myFundMembership) return;
    setBusy(true);
    setFeedback(null);
    try {
      await deletePendingFundMembership(myFundMembership.id);
      setFeedback({
        type: 'success',
        text: 'درخواست عضویت در انتظار بررسی شما لغو و حذف شد.',
      });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'خطا در حذف درخواست عضویت.' });
    } finally {
      setBusy(false);
    }
  };

  const handleUploadReceipt = async (file: File | undefined) => {
    if (!file) return;
    setIsUploadingReceipt(true);
    try {
      const uploaded = await api.uploadFile(file, 'misc');
      if (uploaded?.url) setReceiptUrl(uploaded.url);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'خطا در بارگذاری تصویر فیش واریزی.' });
    } finally {
      setIsUploadingReceipt(false);
    }
  };

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(payAmount || myFundMembership?.monthlyFeeAmount || 0);
    if (!amt || amt <= 0) {
      setFeedback({ type: 'error', text: 'مبلغ واریز نامعتبر است.' });
      return;
    }
    setBusy(true);
    setFeedback(null);
    try {
      await payFundFee({
        amount: amt,
        periodLabel: periodLabel.trim() || currentJalaliPeriod,
        paymentMethod,
        receiptUrl: receiptUrl || undefined,
      });
      setReceiptUrl('');
      setActiveApprovedSubTab('history');
      setFeedback({
        type: 'success',
        text: 'پرداخت حق عضویت با موفقیت ثبت شد و در دفترچه سوابق شما قرار گرفت.',
      });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'خطا در ثبت پرداخت حق عضویت.' });
    } finally {
      setBusy(false);
    }
  };

  const openFeeModal = (mode: 'apply' | 'edit') => {
    const initialAmount = myFundMembership?.monthlyFeeAmount || fundConfig.presetTiers[0] || 1000000;
    if (fundConfig.presetTiers.includes(initialAmount)) {
      setUseCustomFee(false);
      setSelectedFee(initialAmount);
    } else {
      setUseCustomFee(true);
      setCustomFeeStr(String(initialAmount));
    }
    if (mode === 'apply') setIsApplyModalOpen(true);
    else setIsEditModalOpen(true);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Dedicated Page Header */}
      <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-bl from-[#071E17] via-[#0B2C22] to-[#113D2F] text-white p-5 sm:p-7 border border-[#F3D078]/30 shadow-md">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-l from-transparent via-[#F3D078]/70 to-transparent"
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-bold text-[#F3D078]">
              <Landmark className="w-4 h-4 shrink-0" />
              <span>صفحه اختصاصی بخش ۰۲ · پس‌انداز و همیاری اعضا</span>
            </div>
            <h1 className="text-lg sm:text-2xl font-black text-white">{fundConfig.fundTitle}</h1>
            <p className="text-xs sm:text-sm text-emerald-100/85 leading-relaxed">
              {fundConfig.charterText}
            </p>
          </div>

          <div className="shrink-0">
            {!myFundMembership ? (
              <button
                type="button"
                onClick={() => openFeeModal('apply')}
                className="min-h-[46px] px-5 py-2.5 rounded-2xl bg-[#F3D078] hover:bg-amber-300 text-[#071E17] text-xs font-black flex items-center gap-2 whitespace-nowrap shadow-sm cursor-pointer"
              >
                <UserPlus className="w-4 h-4 shrink-0" />
                <span>ثبت درخواست عضویت</span>
              </button>
            ) : myFundMembership.status === 'approved' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-t lg:border-t-0 lg:border-r border-white/15 pt-4 lg:pt-0 lg:pr-6">
                <div>
                  <div className="text-[10px] text-emerald-200/75 font-bold">حق عضویت ماهانه</div>
                  <div className="text-sm sm:text-base font-black text-[#F3D078] tabular-nums mt-0.5">
                    {toPersianNumbers(myFundMembership.monthlyFeeAmount.toLocaleString('fa-IR'))} ت
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-emerald-200/75 font-bold">اندوخته تاییدشده</div>
                  <div className="text-sm sm:text-base font-black text-white tabular-nums mt-0.5">
                    {toPersianNumbers(totalVerifiedBalance.toLocaleString('fa-IR'))} ت
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-emerald-200/75 font-bold">وضعیت عضویت</div>
                  <div className="text-xs font-black text-emerald-300 flex items-center gap-1 mt-1 whitespace-nowrap">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>عضو رسمی</span>
                  </div>
                </div>
              </div>
            ) : myFundMembership.status === 'pending' ? (
              <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/15 border border-amber-400/35 text-[#F3D078] text-xs font-black">
                <Clock className="w-4 h-4 shrink-0" />
                <span>در انتظار تایید مدیریت صندوق</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => openFeeModal('apply')}
                className="min-h-[46px] px-5 py-2.5 rounded-2xl bg-[#F3D078] hover:bg-amber-300 text-[#071E17] text-xs font-black flex items-center gap-2 whitespace-nowrap shadow-sm cursor-pointer"
              >
                <UserPlus className="w-4 h-4 shrink-0" />
                <span>درخواست مجدد عضویت</span>
              </button>
            )}
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

      {/* STATE 1: NON-MEMBER */}
      {!myFundMembership && (
        <div className="rounded-[28px] border border-[#E2DAC3] bg-white p-6 sm:p-9 shadow-2xs text-center space-y-5">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#071E17] text-[#F3D078] flex items-center justify-center shadow-sm">
            <Landmark className="w-7 h-7" />
          </div>
          <div className="space-y-2 max-w-xl mx-auto">
            <h2 className="text-base sm:text-lg font-black text-[#071E17]">
              آغاز عضویت در صندوق قرض‌الحسنه مجتمع
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              مبلغ حق عضویت ماهانه متناسب با توان خود را انتخاب کنید تا پس از تایید مدیریت، امکان واریز آنلاین و ثبت سوابق برای شما فعال شود.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2.5 pt-1">
            {fundConfig.presetTiers.map((tier) => (
              <span
                key={tier}
                className="px-3.5 py-2 rounded-xl bg-[#FCFCF9] border border-stone-200 text-xs font-black text-[#071E17] tabular-nums"
              >
                {toPersianNumbers(tier.toLocaleString('fa-IR'))} تومان / ماه
              </span>
            ))}
          </div>
          <div className="pt-1">
            <button
              type="button"
              onClick={() => openFeeModal('apply')}
              className="min-h-[48px] px-7 py-3 rounded-2xl bg-[#071E17] hover:bg-[#0B2C22] text-[#F3D078] text-xs font-black inline-flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <UserPlus className="w-4 h-4 shrink-0" />
              <span>انتخاب حق عضویت و ثبت درخواست</span>
            </button>
          </div>
        </div>
      )}

      {/* STATE 2: PENDING MEMBERSHIP */}
      {myFundMembership && myFundMembership.status === 'pending' && (
        <div className="rounded-[26px] border border-amber-300/80 bg-amber-50/50 p-5 sm:p-7 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-200/70 pb-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h2 className="text-sm sm:text-base font-black text-stone-900">
                  درخواست عضویت در صندوق در انتظار تایید است
                </h2>
                <p className="text-xs text-stone-700 tabular-nums">
                  مبلغ حق عضویت انتخابی:{' '}
                  <strong className="text-[#071E17]">
                    {toPersianNumbers(myFundMembership.monthlyFeeAmount.toLocaleString('fa-IR'))} تومان
                  </strong>
                  {' · '}ثبت در تاریخ {formatIsoToJalali(myFundMembership.createdAt)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                disabled={busy}
                onClick={() => openFeeModal('edit')}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-white hover:bg-stone-50 border border-stone-300 text-stone-800 text-xs font-black flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <Edit3 className="w-4 h-4 text-[#071E17]" />
                <span>ویرایش مبلغ</span>
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={handleDeletePending}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-black flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>لغو درخواست</span>
              </button>
            </div>
          </div>

          <p className="text-xs text-stone-600 leading-relaxed">
            تا پیش از تایید نهایی مدیریت صندوق، می‌توانید مبلغ حق عضویت ماهانه را ویرایش یا درخواست را لغو کنید. پس از تایید، ابزارهای پرداخت ماهانه و دفترچه سوابق در همین صفحه فعال می‌شود.
          </p>
        </div>
      )}

      {/* STATE 3: REJECTED MEMBERSHIP */}
      {myFundMembership && myFundMembership.status === 'rejected' && (
        <div className="rounded-[26px] border border-rose-200 bg-rose-50/50 p-5 sm:p-7 space-y-3">
          <div className="flex items-center gap-2 text-rose-800 font-black text-sm">
            <XCircle className="w-5 h-5 shrink-0" />
            <span>درخواست عضویت قبلی تایید نشد</span>
          </div>
          {myFundMembership.adminNote && (
            <p className="text-xs text-stone-700 bg-white p-3.5 rounded-xl border border-rose-200">
              توضیح مدیریت: {myFundMembership.adminNote}
            </p>
          )}
          <button
            type="button"
            onClick={() => openFeeModal('apply')}
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#071E17] text-[#F3D078] text-xs font-black cursor-pointer"
          >
            ثبت مجدد درخواست عضویت
          </button>
        </div>
      )}

      {/* STATE 4: APPROVED MEMBER */}
      {myFundMembership && myFundMembership.status === 'approved' && (
        <div className="space-y-5">
          {/* Segmented Workspace Switcher */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#F4F0E5] border border-[#E2DAC3] w-full sm:w-fit">
            <button
              type="button"
              onClick={() => {
                setPayAmount(myFundMembership.monthlyFeeAmount);
                setActiveApprovedSubTab('pay');
              }}
              className={`flex-1 sm:flex-initial min-h-[44px] px-5 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
                activeApprovedSubTab === 'pay'
                  ? 'bg-[#071E17] text-[#F3D078] shadow-xs'
                  : 'text-stone-700 hover:text-[#071E17]'
              }`}
            >
              <CreditCard className="w-4 h-4 shrink-0" />
              <span>واریز حق عضویت</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveApprovedSubTab('history')}
              className={`flex-1 sm:flex-initial min-h-[44px] px-5 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
                activeApprovedSubTab === 'history'
                  ? 'bg-[#071E17] text-[#F3D078] shadow-xs'
                  : 'text-stone-700 hover:text-[#071E17]'
              }`}
            >
              <History className="w-4 h-4 shrink-0" />
              <span className="tabular-nums">
                دفترچه سوابق ({toPersianNumbers(myFundPayments.length)})
              </span>
            </button>
          </div>

          {activeApprovedSubTab === 'pay' ? (
            <form
              onSubmit={handlePaySubmit}
              className="rounded-[26px] border border-[#E2DAC3] bg-white p-5 sm:p-7 shadow-2xs space-y-5"
            >
              <div className="border-b border-stone-100 pb-3.5">
                <h2 className="text-sm sm:text-base font-black text-[#071E17]">
                  ثبت واریز حق عضویت ماهانه
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-stone-700 block">مبلغ واریز (تومان)</label>
                  <input
                    type="number"
                    required
                    min={10000}
                    value={payAmount}
                    onChange={(e) => setPayAmount(Number(e.target.value) || 0)}
                    className="w-full min-h-[46px] px-4 py-2.5 rounded-xl border border-stone-300 text-sm font-black tabular-nums bg-stone-50 focus:bg-white focus:border-[#071E17] outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-stone-700 block">بابت ماه / دوره</label>
                  <input
                    type="text"
                    required
                    value={periodLabel}
                    onChange={(e) => setPeriodLabel(e.target.value)}
                    placeholder="مثال: آذر ۱۴۰۵"
                    className="w-full min-h-[46px] px-4 py-2.5 rounded-xl border border-stone-300 text-xs font-bold bg-stone-50 focus:bg-white focus:border-[#071E17] outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-stone-700 block">روش پرداخت</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: 'online_gateway', label: 'درگاه پرداخت آنلاین' },
                    { id: 'card_transfer', label: 'کارت به کارت / فیش واریزی' },
                    { id: 'payroll_deduction', label: 'کسر از حقوق / حساب سازمانی' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`min-h-[46px] px-3.5 py-2.5 rounded-xl border text-xs font-black transition-colors cursor-pointer ${
                        paymentMethod === m.id
                          ? 'bg-[#071E17] text-[#F3D078] border-[#071E17]'
                          : 'bg-[#FCFCF9] text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod === 'card_transfer' && (
                <div className="p-4 rounded-2xl bg-[#FCFCF9] border border-stone-200 space-y-2.5">
                  <label className="text-xs font-bold text-stone-700 block">
                    تصویر فیش یا رسید بانکی (اختیاری)
                  </label>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="min-h-[44px] px-4 py-2 rounded-xl bg-white border border-stone-300 text-xs font-bold text-stone-800 flex items-center gap-2 cursor-pointer hover:bg-stone-100">
                      <Upload className="w-4 h-4" />
                      <span>{isUploadingReceipt ? 'در حال بارگذاری...' : 'انتخاب فایل رسید'}</span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => handleUploadReceipt(e.target.files?.[0])}
                      />
                    </label>
                    {receiptUrl && (
                      <span className="text-xs font-black text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> رسید با موفقیت پیوست شد
                      </span>
                    )}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full sm:w-auto min-h-[48px] px-7 py-2.5 rounded-2xl bg-[#071E17] hover:bg-[#0B2C22] text-[#F3D078] text-xs font-black flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                <CreditCard className="w-4 h-4 shrink-0" />
                <span>{busy ? 'در حال ثبت...' : 'ثبت نهایی پرداخت حق عضویت'}</span>
              </button>
            </form>
          ) : (
            <div className="rounded-[26px] border border-[#E2DAC3] bg-white p-5 sm:p-7 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3.5">
                <h2 className="text-sm sm:text-base font-black text-[#071E17]">
                  دفترچه سوابق پرداخت حق عضویت
                </h2>
                <span className="text-xs font-bold text-stone-500 tabular-nums">
                  {toPersianNumbers(myFundPayments.length)} تراکنش
                </span>
              </div>

              {myFundPayments.length === 0 ? (
                <div className="py-12 text-center text-stone-400 space-y-2">
                  <History className="w-9 h-9 mx-auto opacity-30" />
                  <p className="text-xs font-bold text-stone-500">
                    هنوز پرداختی در سوابق شما ثبت نشده است.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myFundPayments.map((pay) => (
                    <div
                      key={pay.id}
                      className="p-4 rounded-2xl border border-stone-200/85 bg-[#FCFCF9] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-black text-[#071E17] tabular-nums">
                            {toPersianNumbers(pay.amount.toLocaleString('fa-IR'))} تومان
                          </span>
                          <span className="text-xs font-bold text-stone-600">
                            · {pay.periodLabel}
                          </span>
                        </div>
                        <div className="text-[11px] text-stone-500 tabular-nums">
                          کد رهگیری: <span className="font-mono font-bold">{pay.trackingCode}</span> ·
                          تاریخ: {formatIsoToJalali(pay.createdAt)}
                        </div>
                        {pay.adminNote && (
                          <div className="text-[11px] font-bold text-emerald-900">
                            توضیح مدیریت: {pay.adminNote}
                          </div>
                        )}
                      </div>

                      <div>
                        {pay.status === 'verified' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-black">
                            <CheckCircle2 className="w-3.5 h-3.5" /> تایید شده
                          </span>
                        ) : pay.status === 'rejected' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-black">
                            <XCircle className="w-3.5 h-3.5" /> رد شده
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-black">
                            <Clock className="w-3.5 h-3.5" /> در انتظار تایید
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* APPLY OR EDIT PENDING FEE MODAL */}
      {(isApplyModalOpen || isEditModalOpen) && (
        <div
          className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => {
            setIsApplyModalOpen(false);
            setIsEditModalOpen(false);
          }}
        >
          <div
            className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl border border-stone-200 shadow-2xl max-h-[92dvh] sm:max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-stone-200 bg-[#071E17] text-white">
              <h3 className="text-sm font-black">
                {isEditModalOpen
                  ? 'ویرایش مبلغ حق عضویت ماهانه'
                  : 'عضویت در صندوق قرض‌الحسنه مجتمع'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsApplyModalOpen(false);
                  setIsEditModalOpen(false);
                }}
                className="min-h-[40px] min-w-[40px] rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
                aria-label="بستن"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              id="fund-membership-form"
              onSubmit={isEditModalOpen ? handleEditPendingSubmit : handleApplySubmit}
              className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain p-5 space-y-4"
            >
              <p className="text-xs text-stone-600 leading-relaxed">
                لطفاً مبلغ حق عضویت ماهانه خود را از مبالغ پیشنهادی انتخاب کنید یا مبلغ دلخواه وارد نمایید:
              </p>

              <div className="grid grid-cols-2 gap-2.5">
                {fundConfig.presetTiers.map((tier) => (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => {
                      setUseCustomFee(false);
                      setSelectedFee(tier);
                    }}
                    className={`min-h-[48px] p-3 rounded-2xl border text-xs font-black tabular-nums transition-all cursor-pointer ${
                      !useCustomFee && selectedFee === tier
                        ? 'bg-[#071E17] text-[#F3D078] border-[#071E17] shadow-sm'
                        : 'bg-stone-50 text-stone-800 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {toPersianNumbers(tier.toLocaleString('fa-IR'))} تومان
                  </button>
                ))}
              </div>

              <div className="space-y-2 pt-2 border-t border-stone-100">
                <label className="flex items-center gap-2 text-xs font-black text-stone-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useCustomFee}
                    onChange={(e) => setUseCustomFee(e.target.checked)}
                    className="w-4 h-4 accent-[#071E17]"
                  />
                  <span>وارد کردن مبلغ دلخواه (تومان)</span>
                </label>

                {useCustomFee && (
                  <div className="space-y-1">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={customFeeStr}
                      onChange={(e) => setCustomFeeStr(e.target.value.replace(/[^\d]/g, ''))}
                      placeholder={`بین ${toPersianNumbers(
                        fundConfig.minCustomAmount.toLocaleString('fa-IR')
                      )} تا ${toPersianNumbers(fundConfig.maxCustomAmount.toLocaleString('fa-IR'))}`}
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm font-black tabular-nums bg-stone-50"
                    />
                    <p className="text-[11px] text-stone-500 tabular-nums">
                      بازه مجاز: {toPersianNumbers(fundConfig.minCustomAmount.toLocaleString('fa-IR'))}{' '}
                      تا {toPersianNumbers(fundConfig.maxCustomAmount.toLocaleString('fa-IR'))} تومان
                    </p>
                  </div>
                )}
              </div>
            </form>

            <div className="shrink-0 flex items-center justify-end gap-2 px-5 py-3.5 border-t border-stone-200 bg-stone-50 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={() => {
                  setIsApplyModalOpen(false);
                  setIsEditModalOpen(false);
                }}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-stone-200 text-stone-700 text-xs font-bold cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="submit"
                form="fund-membership-form"
                disabled={busy}
                className="min-h-[44px] px-6 py-2 rounded-xl bg-[#071E17] text-[#F3D078] text-xs font-black cursor-pointer disabled:opacity-60"
              >
                {busy
                  ? 'در حال ثبت...'
                  : isEditModalOpen
                  ? 'ذخیره مبلغ جدید'
                  : 'ثبت درخواست عضویت'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
