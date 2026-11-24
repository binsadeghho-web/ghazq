import React, { useState, useMemo } from 'react';
import {
  Building2,
  MapPin,
  Plus,
  X,
  Save,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { toPersianNumbers } from '../../utils/persianNumbers';
import { formatIsoToJalali } from '../../utils/jalaliDate';

export const AdminAccommodationPanel: React.FC = () => {
  const { welfareRequests, welfarePortalConfig, updateWelfareStatus, updateWelfarePortalConfig } =
    useApp();

  const [cities, setCities] = useState<string[]>(welfarePortalConfig.accommodationCities || ['قم']);
  const [newCity, setNewCity] = useState('');
  const [maxNights, setMaxNights] = useState<number>(welfarePortalConfig.accommodationMaxNights || 3);
  const [minLeadDays, setMinLeadDays] = useState<number>(
    welfarePortalConfig.accommodationMinLeadDays || 3
  );
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const accommodationRequests = useMemo(
    () => welfareRequests.filter((r) => r.type === 'accommodation'),
    [welfareRequests]
  );

  const handleAddCity = () => {
    const clean = newCity.trim();
    if (!clean || cities.includes(clean)) return;
    setCities((prev) => [...prev, clean]);
    setNewCity('');
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cities.length === 0) {
      setFeedback({ type: 'error', text: 'حداقل یک شهر باید فعال باشد.' });
      return;
    }
    setBusyId('cfg');
    setFeedback(null);
    try {
      await updateWelfarePortalConfig({
        accommodationCities: cities,
        accommodationMaxNights: Math.max(1, Number(maxNights) || 3),
        accommodationMinLeadDays: Math.max(1, Number(minLeadDays) || 3),
      });
      setFeedback({ type: 'success', text: 'تنظیمات شهرها و محدودیت‌های اسکان با موفقیت ذخیره شد.' });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'خطا در ذخیره تنظیمات اسکان.' });
    } finally {
      setBusyId(null);
    }
  };

  const handleReview = async (id: string, status: 'approved' | 'rejected') => {
    setBusyId(id);
    setFeedback(null);
    try {
      const target = accommodationRequests.find((r) => r.id === id);
      await updateWelfareStatus(id, status, notesMap[id] ?? target?.adminNote ?? '');
      setFeedback({ type: 'success', text: 'وضعیت درخواست اسکان به‌روزرسانی شد.' });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'خطا در به‌روزرسانی درخواست.' });
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

      {/* Cities & Rules Configuration */}
      <form
        onSubmit={handleSaveSettings}
        className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6 shadow-2xs space-y-4"
      >
        <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
          <MapPin className="w-4 h-4 text-[#071E17]" />
          <h3 className="text-sm font-black text-[#071E17]">مدیریت شهرهای اسکان و قوانین تقویم</h3>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black text-stone-700 block">شهرهای فعال برای اسکان:</label>
          <div className="flex flex-wrap gap-2">
            {cities.map((c) => (
              <span
                key={c}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 border border-stone-200 text-xs font-black text-[#071E17]"
              >
                <span>{c}</span>
                {cities.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setCities((prev) => prev.filter((item) => item !== c))}
                    className="text-stone-400 hover:text-rose-600 cursor-pointer"
                    aria-label={`حذف ${c}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-1 max-w-md">
            <input
              type="text"
              value={newCity}
              onChange={(e) => setNewCity(e.target.value)}
              placeholder="نام شهر جدید (مثال: تبریز)"
              className="flex-1 min-h-[42px] px-3.5 py-2 rounded-xl border border-stone-300 text-xs bg-stone-50"
            />
            <button
              type="button"
              onClick={handleAddCity}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-black flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> افزودن شهر
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-black text-stone-700 block">حداکثر تعداد شب قابل انتخاب:</label>
            <input
              type="number"
              min={1}
              max={14}
              value={maxNights}
              onChange={(e) => setMaxNights(Math.max(1, Number(e.target.value) || 3))}
              className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-stone-300 text-xs font-black tabular-nums bg-stone-50"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-black text-stone-700 block">
              حداقل فاصله روز از امروز (قفل تقویم — پیش‌فرض ۳):
            </label>
            <input
              type="number"
              min={1}
              max={30}
              value={minLeadDays}
              onChange={(e) => setMinLeadDays(Math.max(1, Number(e.target.value) || 3))}
              className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-stone-300 text-xs font-black tabular-nums bg-stone-50"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={busyId === 'cfg'}
            className="min-h-[44px] px-6 py-2 rounded-xl bg-[#071E17] text-[#F3D078] text-xs font-black flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{busyId === 'cfg' ? 'در حال ذخیره...' : 'ذخیره تنظیمات اسکان'}</span>
          </button>
        </div>
      </form>

      {/* Requests Queue */}
      <div className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#071E17]" />
            <h3 className="text-sm font-black text-[#071E17]">کارتابل درخواست‌های اسکان</h3>
          </div>
          <span className="text-xs font-bold text-stone-500 tabular-nums">
            {toPersianNumbers(accommodationRequests.length)} رزرو
          </span>
        </div>

        {accommodationRequests.length === 0 ? (
          <div className="py-10 text-center text-stone-400 text-xs font-bold">
            هنوز درخواست اسکانی ثبت نشده است.
          </div>
        ) : (
          <div className="space-y-3">
            {accommodationRequests.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-2xl border border-stone-200/80 bg-[#FCFCF9] space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-black text-[#071E17]">
                      {req.applicantName} · {req.title}
                    </div>
                    <div className="text-xs text-stone-600 tabular-nums mt-0.5">
                      تاریخ و مدت: <strong>{req.requestedValue}</strong>
                      {req.metadata?.phone ? ` · تماس: ${toPersianNumbers(req.metadata.phone)}` : ''}
                      {' · '}ثبت: {formatIsoToJalali(req.createdAt)}
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg text-[11px] font-black border bg-white">
                    {req.status === 'approved'
                      ? 'تایید و هماهنگ شد'
                      : req.status === 'rejected'
                      ? 'لغو / رد شده'
                      : 'در انتظار تماس'}
                  </span>
                </div>

                {req.description && (
                  <p className="text-xs text-stone-600 bg-white p-2.5 rounded-xl border border-stone-200/60">
                    {req.description}
                  </p>
                )}

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    placeholder="نشانی مهمانسرا، کد پذیرش یا یادداشت هماهنگی..."
                    value={notesMap[req.id] ?? req.adminNote ?? ''}
                    onChange={(e) => setNotesMap((prev) => ({ ...prev, [req.id]: e.target.value }))}
                    className="flex-1 min-h-[40px] px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white"
                  />
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={busyId === req.id}
                      onClick={() => handleReview(req.id, 'approved')}
                      className="min-h-[40px] px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> تایید رزرو
                    </button>
                    <button
                      type="button"
                      disabled={busyId === req.id}
                      onClick={() => handleReview(req.id, 'rejected')}
                      className="min-h-[40px] px-4 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-black flex items-center gap-1 cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" /> رد / عدم ظرفیت
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
