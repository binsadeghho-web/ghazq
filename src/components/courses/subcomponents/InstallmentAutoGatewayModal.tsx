import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CourseInstallmentRecord } from '../../../types';
import { toPersianNumbers } from '../../../utils/persianNumbers';
import { api } from '../../../services/apiClient';
import {
  X,
  CreditCard,
  CalendarClock,
  UploadCloud,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Paperclip,
} from 'lucide-react';

interface InstallmentAutoGatewayModalProps {
  installment: CourseInstallmentRecord | null;
  allMyInstallments?: CourseInstallmentRecord[];
  isAutoTriggered?: boolean;
  onClose: () => void;
  onPaymentSuccess: () => Promise<void> | void;
}

export const InstallmentAutoGatewayModal: React.FC<InstallmentAutoGatewayModalProps> = ({
  installment,
  allMyInstallments = [],
  isAutoTriggered = false,
  onClose,
  onPaymentSuccess,
}) => {
  const [selectedInstallment, setSelectedInstallment] = useState<CourseInstallmentRecord | null>(installment);
  const [paymentMethod, setPaymentMethod] = useState<'online_gateway' | 'bank_receipt'>('online_gateway');
  const [trackingCode, setTrackingCode] = useState(`INST-${Math.floor(100000 + Math.random() * 900000)}`);
  const [bankName, setBankName] = useState('بانک ملی ایران');
  const [receiptDate, setReceiptDate] = useState(new Date().toLocaleDateString('fa-IR'));
  const [receiptFileUrl, setReceiptFileUrl] = useState('');
  const [receiptFileName, setReceiptFileName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setSelectedInstallment(installment);
    setErrorMsg(null);
    setSuccessMsg(null);
    setReceiptFileUrl('');
    setReceiptFileName('');
  }, [installment]);

  if (!selectedInstallment) return null;

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg(null);
    setIsUploading(true);
    try {
      const uploaded = await api.uploadFile(file, 'course_receipt');
      setReceiptFileUrl(uploaded.url);
      setReceiptFileName(file.name);
    } catch (err: any) {
      setErrorMsg(err?.message || 'خطا در بارگذاری فایل فیش روی دیسک سرور.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    setErrorMsg(null);
    if (paymentMethod === 'bank_receipt' && !receiptFileUrl) {
      setErrorMsg('لطفاً ابتدا تصویر یا فایل PDF فیش واریزی خود را آپلود فرمایید.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.payCourseInstallment(selectedInstallment.id, {
        paymentMethod,
        trackingCode: trackingCode.trim() || undefined,
        receiptFileUrl: receiptFileUrl || undefined,
        receiptBankName: bankName,
        receiptDate,
        expectedVersion: selectedInstallment.version,
      });

      setSuccessMsg(
        paymentMethod === 'online_gateway'
          ? `پرداخت آنلاین قسط «${res.title}» با موفقیت انجام و تسویه ثبت شد.`
          : `فیش پرداخت قسط «${res.title}» روی دیسک ذخیره و جهت تایید به کارتابل ادمین ارسال شد.`
      );
      await onPaymentSuccess();
    } catch (err: any) {
      setErrorMsg(err?.message || 'خطا در ثبت پرداخت قسط.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const upcomingForSameEnrollment = allMyInstallments.filter(
    i => i.enrollmentId === selectedInstallment.enrollmentId
  );

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
        dir="rtl"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-emerald-500/30 overflow-hidden text-right text-slate-900 dark:text-slate-100 flex flex-col max-h-[90vh]"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-5 bg-gradient-to-l from-emerald-950 via-slate-900 to-slate-900 text-white flex items-center justify-between border-b border-emerald-800/40">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center justify-center">
                <CalendarClock className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-black text-emerald-300 block">
                  {isAutoTriggered
                    ? 'یادآور خودکار سررسید پرداخت قسط دوره'
                    : 'درگاه و سامانه پرداخت اقساط دوره'}
                </span>
                <h3 className="text-sm sm:text-base font-black text-white">
                  {selectedInstallment.courseTitle}
                </h3>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-rose-600 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
            {/* Auto Alert Banner */}
            {isAutoTriggered && !successMsg && (
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed font-semibold">
                  موعد سررسید قسط <strong>{selectedInstallment.title}</strong> فرا رسیده است. درگاه پرداخت جهت تسویه به صورت خودکار در پنل شما باز شده است.
                </p>
              </div>
            )}

            {/* Installment Summary Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
                <div>
                  <span className="text-slate-500 text-[11px] block">عنوان قسط سررسیدشده:</span>
                  <strong className="text-sm font-black text-slate-900 dark:text-white">
                    {selectedInstallment.title}
                  </strong>
                </div>
                <div className="text-left">
                  <span className="text-slate-500 text-[11px] block">تاریخ سررسید:</span>
                  <strong className="font-mono font-bold text-rose-600 dark:text-rose-400">
                    {toPersianNumbers(selectedInstallment.dueDateJalali)}
                  </strong>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-600 dark:text-slate-300">مبلغ قابل پرداخت این قسط:</span>
                <strong className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                  {toPersianNumbers(selectedInstallment.amount.toLocaleString('fa-IR'))} تومان
                </strong>
              </div>

              {selectedInstallment.adminNote && (
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-[11px]">
                  <strong>پیام مدیر:</strong> {selectedInstallment.adminNote}
                </div>
              )}
            </div>

            {successMsg ? (
              <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <p className="text-sm font-black text-emerald-900 dark:text-emerald-200">{successMsg}</p>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs cursor-pointer"
                >
                  بازگشت به پنل دوره‌ها
                </button>
              </div>
            ) : (
              <>
                {/* Payment Method Switch */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('online_gateway')}
                    className={`p-3.5 rounded-2xl border-2 text-right transition-all cursor-pointer ${
                      paymentMethod === 'online_gateway'
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-emerald-600 mb-1" />
                    <strong className="block text-slate-900 dark:text-white font-black">درگاه آنلاین شاپرک</strong>
                    <span className="text-[11px] text-slate-500">تایید آنی و ثبت خودکار تسویه قسط</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('bank_receipt')}
                    className={`p-3.5 rounded-2xl border-2 text-right transition-all cursor-pointer ${
                      paymentMethod === 'bank_receipt'
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <Paperclip className="w-5 h-5 text-sky-600 mb-1" />
                    <strong className="block text-slate-900 dark:text-white font-black">بارگذاری فیش بانکی</strong>
                    <span className="text-[11px] text-slate-500">ذخیره فایل مستندات در دیسک امن</span>
                  </button>
                </div>

                {paymentMethod === 'bank_receipt' && (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">کد رهگیری واریز</label>
                        <input
                          type="text"
                          value={trackingCode}
                          onChange={e => setTrackingCode(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">بانک مبدأ</label>
                        <input
                          type="text"
                          value={bankName}
                          onChange={e => setBankName(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">تاریخ واریز</label>
                        <input
                          type="text"
                          value={receiptDate}
                          onChange={e => setReceiptDate(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-1">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleReceiptUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        disabled={isUploading}
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold flex items-center gap-2 cursor-pointer disabled:opacity-60"
                      >
                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                        <span>{isUploading ? 'در حال آپلود روی دیسک...' : 'انتخاب و ذخیره فیش در دیسک'}</span>
                      </button>
                      {receiptFileName && (
                        <span className="text-[11px] text-emerald-600 font-bold truncate max-w-[200px]">
                          ذخیره شد: {receiptFileName}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-bold">
                    {errorMsg}
                  </div>
                )}

                {/* Other installments in this course */}
                {upcomingForSameEnrollment.length > 1 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold text-slate-500 block">وضعیت کل اقساط شما در این دوره:</span>
                    <div className="flex flex-wrap gap-2">
                      {upcomingForSameEnrollment.map(inst => (
                        <button
                          key={inst.id}
                          type="button"
                          onClick={() => {
                            if (inst.status !== 'paid') setSelectedInstallment(inst);
                          }}
                          className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all ${
                            inst.id === selectedInstallment.id
                              ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                              : inst.status === 'paid'
                              ? 'border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600'
                              : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {inst.title} ·{' '}
                          {inst.status === 'paid'
                            ? 'پرداخت شده'
                            : inst.status === 'awaiting_verification'
                            ? 'در انتظار تایید'
                            : toPersianNumbers(inst.dueDateJalali)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
                  >
                    پرداخت در زمان دیگر
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting || isUploading}
                    onClick={handleSubmit}
                    className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-60"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                    <span>
                      {paymentMethod === 'online_gateway'
                        ? 'پرداخت آنلاین قسط از درگاه'
                        : 'ثبت نهایی و ارسال فیش'}
                    </span>
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
