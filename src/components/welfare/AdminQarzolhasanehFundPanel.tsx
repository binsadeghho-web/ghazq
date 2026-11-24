import React, { useState } from 'react';
import {
  Landmark,
  Users,
  CreditCard,
  Sliders,
  CheckCircle2,
  XCircle,
  Clock,
  Save,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { toPersianNumbers } from '../../utils/persianNumbers';
import { formatIsoToJalali } from '../../utils/jalaliDate';

export const AdminQarzolhasanehFundPanel: React.FC = () => {
  const {
    welfarePortalConfig,
    allFundMemberships,
    allFundPayments,
    updateWelfarePortalConfig,
    reviewFundMembership,
    reviewFundPayment,
  } = useApp();

  const [subTab, setSubTab] = useState<'memberships' | 'payments' | 'settings'>('memberships');
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fc = welfarePortalConfig.fundConfig;
  const [fundTitle, setFundTitle] = useState(fc.fundTitle);
  const [charterText, setCharterText] = useState(fc.charterText);
  const [tiersText, setTiersText] = useState(fc.presetTiers.join(', '));
  const [minCustomAmount, setMinCustomAmount] = useState(fc.minCustomAmount);
  const [maxCustomAmount, setMaxCustomAmount] = useState(fc.maxCustomAmount);

  const handleMembershipAction = async (id: string, status: 'approved' | 'rejected') => {
    setBusyId(id);
    setFeedback(null);
    try {
      await reviewFundMembership(id, status, notesMap[id]);
      setFeedback({ type: 'success', text: 'وضعیت درخواست عضویت صندوق به‌روزرسانی شد.' });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'خطا در بررسی درخواست عضویت.' });
    } finally {
      setBusyId(null);
    }
  };

  const handlePaymentAction = async (id: string, status: 'verified' | 'rejected') => {
    setBusyId(id);
    setFeedback(null);
    try {
      await reviewFundPayment(id, status, notesMap[id]);
      setFeedback({ type: 'success', text: 'وضعیت واریز حق عضویت به‌روزرسانی شد.' });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'خطا در بررسی پرداخت.' });
    } finally {
      setBusyId(null);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedTiers = tiersText
      .split(/[,،\s]+/)
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n) && n > 0);
    setBusyId('settings');
    setFeedback(null);
    try {
      await updateWelfarePortalConfig({
        fundConfig: {
          fundTitle: fundTitle.trim() || fc.fundTitle,
          charterText: charterText.trim() || fc.charterText,
          presetTiers: parsedTiers.length > 0 ? parsedTiers : fc.presetTiers,
          minCustomAmount: Math.max(10000, Number(minCustomAmount) || 200000),
          maxCustomAmount: Math.max(100000, Number(maxCustomAmount) || 50000000),
        },
      });
      setFeedback({ type: 'success', text: 'تنظیمات و پلکان حق عضویت صندوق ذخیره شد.' });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'خطا در ذخیره تنظیمات صندوق.' });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5" dir="rtl">
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-stone-100 border border-stone-200">
        <button
          type="button"
          onClick={() => setSubTab('memberships')}
          className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer ${
            subTab === 'memberships' ? 'bg-[#071E17] text-[#F3D078]' : 'text-stone-700 hover:bg-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>درخواست‌ها و اعضای صندوق ({toPersianNumbers(allFundMemberships.length)})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('payments')}
          className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer ${
            subTab === 'payments' ? 'bg-[#071E17] text-[#F3D078]' : 'text-stone-700 hover:bg-white'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>واریزی‌های حق عضویت ({toPersianNumbers(allFundPayments.length)})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('settings')}
          className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer ${
            subTab === 'settings' ? 'bg-[#071E17] text-[#F3D078]' : 'text-stone-700 hover:bg-white'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>تنظیمات پلکان و اساسنامه صندوق</span>
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
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{feedback.text}</span>
        </div>
      )}

      {subTab === 'memberships' && (
        <div className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
            <Landmark className="w-4 h-4 text-[#071E17]" />
            <h3 className="text-sm font-black text-[#071E17]">مدیریت عضویت در صندوق قرض‌الحسنه</h3>
          </div>

          {allFundMemberships.length === 0 ? (
            <div className="py-10 text-center text-stone-400 text-xs font-bold">
              هنوز هیچ کاربری درخواست عضویت ثبت نکرده است.
            </div>
          ) : (
            <div className="space-y-3">
              {allFundMemberships.map((m) => (
                <div
                  key={m.id}
                  className="p-4 rounded-2xl border border-stone-200/80 bg-[#FCFCF9] space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-black text-[#071E17]">{m.userName}</div>
                      <div className="text-xs text-stone-600 tabular-nums">
                        حق عضویت ماهانه:{' '}
                        <strong className="text-emerald-900">
                          {toPersianNumbers(m.monthlyFeeAmount.toLocaleString('fa-IR'))} تومان
                        </strong>
                        {' · '}تاریخ درخواست: {formatIsoToJalali(m.createdAt)}
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-black border bg-white">
                      {m.status === 'approved' ? (
                        <span className="text-emerald-700 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> تایید شده
                        </span>
                      ) : m.status === 'rejected' ? (
                        <span className="text-rose-700 inline-flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" /> رد شده
                        </span>
                      ) : (
                        <span className="text-amber-700 inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> در انتظار تایید
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      type="text"
                      placeholder="یادداشت مدیریت..."
                      value={notesMap[m.id] ?? m.adminNote ?? ''}
                      onChange={(e) => setNotesMap((prev) => ({ ...prev, [m.id]: e.target.value }))}
                      className="flex-1 min-h-[40px] px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white"
                    />
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={busyId === m.id}
                        onClick={() => handleMembershipAction(m.id, 'approved')}
                        className="min-h-[40px] px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black cursor-pointer"
                      >
                        تایید عضویت
                      </button>
                      <button
                        type="button"
                        disabled={busyId === m.id}
                        onClick={() => handleMembershipAction(m.id, 'rejected')}
                        className="min-h-[40px] px-4 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-black cursor-pointer"
                      >
                        رد درخواست
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {subTab === 'payments' && (
        <div className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
          <h3 className="text-sm font-black text-[#071E17] border-b border-stone-100 pb-3">
            فهرست واریزی‌های حق عضویت اعضا
          </h3>

          {allFundPayments.length === 0 ? (
            <div className="py-10 text-center text-stone-400 text-xs font-bold">
              هنوز واریزی ثبت نشده است.
            </div>
          ) : (
            <div className="space-y-3">
              {allFundPayments.map((pay) => (
                <div
                  key={pay.id}
                  className="p-4 rounded-2xl border border-stone-200/80 bg-[#FCFCF9] space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-black text-[#071E17] tabular-nums">
                        {pay.userName} · {toPersianNumbers(pay.amount.toLocaleString('fa-IR'))} تومان
                      </div>
                      <div className="text-[11px] text-stone-500 tabular-nums">
                        دوره: {pay.periodLabel} · کد رهگیری: {pay.trackingCode} · تاریخ:{' '}
                        {formatIsoToJalali(pay.createdAt)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {pay.receiptUrl && (
                        <a
                          href={pay.receiptUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-bold text-teal-800 inline-flex items-center gap-1 underline"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> مشاهده رسید
                        </a>
                      )}
                      <span className="px-2.5 py-1 rounded-lg text-[11px] font-black border bg-white">
                        {pay.status === 'verified'
                          ? 'تایید شده'
                          : pay.status === 'rejected'
                          ? 'رد شده'
                          : 'در انتظار تایید'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      type="text"
                      placeholder="یادداشت حسابداری..."
                      value={notesMap[pay.id] ?? pay.adminNote ?? ''}
                      onChange={(e) => setNotesMap((prev) => ({ ...prev, [pay.id]: e.target.value }))}
                      className="flex-1 min-h-[40px] px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white"
                    />
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={busyId === pay.id}
                        onClick={() => handlePaymentAction(pay.id, 'verified')}
                        className="min-h-[40px] px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black cursor-pointer"
                      >
                        تایید واریز
                      </button>
                      <button
                        type="button"
                        disabled={busyId === pay.id}
                        onClick={() => handlePaymentAction(pay.id, 'rejected')}
                        className="min-h-[40px] px-4 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-black cursor-pointer"
                      >
                        رد واریز
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {subTab === 'settings' && (
        <form
          onSubmit={handleSaveSettings}
          className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6 shadow-2xs space-y-4"
        >
          <h3 className="text-sm font-black text-[#071E17] border-b border-stone-100 pb-3">
            تنظیمات صندوق و پلکان‌های پیشنهادی حق عضویت
          </h3>

          <div className="space-y-1.5">
            <label className="text-xs font-black text-stone-700 block">نام رسمی صندوق:</label>
            <input
              type="text"
              value={fundTitle}
              onChange={(e) => setFundTitle(e.target.value)}
              className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-stone-300 text-xs font-bold bg-stone-50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black text-stone-700 block">متن معرفی و اساسنامه صندوق:</label>
            <textarea
              rows={3}
              value={charterText}
              onChange={(e) => setCharterText(e.target.value)}
              className="w-full p-3.5 rounded-xl border border-stone-300 text-xs leading-relaxed bg-stone-50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black text-stone-700 block">
              مبالغ پیشنهادی حق عضویت ماهانه (با کاما جدا کنید — تومان):
            </label>
            <input
              type="text"
              dir="ltr"
              value={tiersText}
              onChange={(e) => setTiersText(e.target.value)}
              placeholder="500000, 1000000, 2000000, 5000000"
              className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-stone-300 text-xs font-mono bg-stone-50 text-left"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-stone-700 block">حداقل مبلغ دلخواه (تومان):</label>
              <input
                type="number"
                value={minCustomAmount}
                onChange={(e) => setMinCustomAmount(Number(e.target.value) || 0)}
                className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-stone-300 text-xs font-bold tabular-nums bg-stone-50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-black text-stone-700 block">حداکثر مبلغ دلخواه (تومان):</label>
              <input
                type="number"
                value={maxCustomAmount}
                onChange={(e) => setMaxCustomAmount(Number(e.target.value) || 0)}
                className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-stone-300 text-xs font-bold tabular-nums bg-stone-50"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={busyId === 'settings'}
              className="min-h-[44px] px-6 py-2 rounded-xl bg-[#071E17] text-[#F3D078] text-xs font-black flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{busyId === 'settings' ? 'در حال ذخیره...' : 'ذخیره تنظیمات صندوق'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
