import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Save,
  CheckCircle2,
  XCircle,
  Banknote,
  Clock,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { toPersianNumbers } from '../../utils/persianNumbers';
import { formatIsoToJalali } from '../../utils/jalaliDate';

export const AdminEmergencyLoanPanel: React.FC = () => {
  const { welfareRequests, welfarePortalConfig, updateWelfareStatus, updateWelfarePortalConfig } = useApp();

  const [descriptionText, setDescriptionText] = useState(
    welfarePortalConfig.emergencyLoanDescription || ''
  );
  const [maxLabelText, setMaxLabelText] = useState(
    welfarePortalConfig.emergencyLoanMaxAmountLabel || ''
  );
  const [adminNotesMap, setAdminNotesMap] = useState<Record<string, string>>({});
  const [savingConfig, setSavingConfig] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loanRequests = useMemo(
    () => welfareRequests.filter((r) => r.type === 'emergency_loan' || r.type === 'loan'),
    [welfareRequests]
  );

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    setFeedback(null);
    try {
      await updateWelfarePortalConfig({
        emergencyLoanDescription: descriptionText.trim(),
        emergencyLoanMaxAmountLabel: maxLabelText.trim(),
      });
      setFeedback({ type: 'success', text: 'متن توضیحات و ضوابط تسهیلات اضطراری ذخیره شد.' });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'خطا در ذخیره توضیحات.' });
    } finally {
      setSavingConfig(false);
    }
  };

  const handleReview = async (id: string, status: 'approved' | 'disbursed' | 'rejected') => {
    setBusyId(id);
    setFeedback(null);
    try {
      const target = loanRequests.find((r) => r.id === id);
      const note = adminNotesMap[id] ?? target?.adminNote ?? '';
      await updateWelfareStatus(id, status, note);
      setFeedback({ type: 'success', text: 'وضعیت درخواست تسهیلات با موفقیت به‌روزرسانی شد.' });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'خطا در تغییر وضعیت درخواست.' });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {feedback && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Editable Description & Guidelines Box */}
      <form
        onSubmit={handleSaveConfig}
        className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6 shadow-2xs space-y-4"
      >
        <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
          <FileText className="w-4 h-4 text-[#071E17]" />
          <h3 className="text-sm font-black text-[#071E17]">
            ویرایش متن دکمه «توضیحات» و شرایط تسهیلات اضطراری
          </h3>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-black text-stone-700 block">عنوان سقف و شرایط خلاصه:</label>
          <input
            type="text"
            value={maxLabelText}
            onChange={(e) => setMaxLabelText(e.target.value)}
            placeholder="مثال: بر اساس مصوبه کارگروه رفاه (قابل بررسی تا سقف جاری صندوق)"
            className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-stone-300 text-xs font-bold bg-stone-50"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-black text-stone-700 block">
            متن کامل پنجره توضیحات (قابل مشاهده با کلیک روی دکمه «توضیحات»):
          </label>
          <textarea
            rows={4}
            value={descriptionText}
            onChange={(e) => setDescriptionText(e.target.value)}
            className="w-full p-3.5 rounded-xl border border-stone-300 text-xs leading-relaxed bg-stone-50"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={savingConfig}
            className="min-h-[44px] px-5 py-2 rounded-xl bg-[#071E17] text-[#F3D078] text-xs font-black flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{savingConfig ? 'در حال ذخیره...' : 'ذخیره توضیحات تسهیلات'}</span>
          </button>
        </div>
      </form>

      {/* Requests Queue */}
      <div className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#071E17]" />
            <h3 className="text-sm font-black text-[#071E17]">کارتابل درخواست‌های تسهیلات اضطراری</h3>
          </div>
          <span className="text-xs font-bold text-stone-500 tabular-nums">
            {toPersianNumbers(loanRequests.length)} پرونده
          </span>
        </div>

        {loanRequests.length === 0 ? (
          <div className="py-10 text-center text-stone-400 text-xs font-bold">
            درخواستی در صف بررسی قرار ندارد.
          </div>
        ) : (
          <div className="space-y-3">
            {loanRequests.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-2xl border border-stone-200/80 bg-[#FCFCF9] space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-black text-[#071E17]">
                      {req.applicantName} ·{' '}
                      <span className="text-emerald-900 tabular-nums">{req.requestedValue}</span>
                    </div>
                    <div className="text-[11px] text-stone-500 tabular-nums">
                      تاریخ ثبت: {formatIsoToJalali(req.createdAt)}
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg text-[11px] font-black bg-stone-100 border border-stone-200 text-stone-800">
                    {req.status === 'approved'
                      ? 'تایید شده'
                      : req.status === 'disbursed'
                      ? 'واریز شده'
                      : req.status === 'rejected'
                      ? 'رد شده'
                      : 'در حال بررسی'}
                  </span>
                </div>

                <p className="text-xs text-stone-700 bg-white p-3 rounded-xl border border-stone-200/70 leading-relaxed">
                  علت درخواست: {req.description}
                </p>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="یادداشت یا پاسخ کارشناس به متقاضی..."
                    value={adminNotesMap[req.id] ?? req.adminNote ?? ''}
                    onChange={(e) =>
                      setAdminNotesMap((prev) => ({ ...prev, [req.id]: e.target.value }))
                    }
                    className="flex-1 min-h-[42px] px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white"
                  />
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      disabled={busyId === req.id}
                      onClick={() => handleReview(req.id, 'approved')}
                      className="min-h-[42px] px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> تایید
                    </button>
                    <button
                      type="button"
                      disabled={busyId === req.id}
                      onClick={() => handleReview(req.id, 'disbursed')}
                      className="min-h-[42px] px-3.5 py-1.5 rounded-xl bg-[#071E17] text-[#F3D078] text-xs font-black flex items-center gap-1 cursor-pointer"
                    >
                      <Banknote className="w-3.5 h-3.5" /> واریز شد
                    </button>
                    <button
                      type="button"
                      disabled={busyId === req.id}
                      onClick={() => handleReview(req.id, 'rejected')}
                      className="min-h-[42px] px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-black flex items-center gap-1 cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" /> رد
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
