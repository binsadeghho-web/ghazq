import React, { useState, useMemo } from 'react';
import {
  Building2,
  MapPin,
  Moon,
  Phone,
  CheckCircle2,
  AlertCircle,
  Clock,
  XCircle,
  Send,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { JalaliDatePicker } from './JalaliDatePicker';
import { addDaysToIso, formatIsoToJalali, getTehranTodayIso } from '../../utils/jalaliDate';
import { toPersianNumbers } from '../../utils/persianNumbers';

export const WelfareAccommodationTab: React.FC = () => {
  const { currentUser, welfareRequests, welfarePortalConfig, submitAccommodationRequest } = useApp();

  const cities = welfarePortalConfig.accommodationCities?.length
    ? welfarePortalConfig.accommodationCities
    : ['قم', 'مشهد مقدس', 'تهران'];
  const maxNights = Math.max(1, Number(welfarePortalConfig.accommodationMaxNights || 3));
  const minLeadDays = Math.max(1, Number(welfarePortalConfig.accommodationMinLeadDays || 3));

  const defaultCheckInIso = useMemo(
    () => addDaysToIso(getTehranTodayIso(), minLeadDays),
    [minLeadDays]
  );

  const [selectedCity, setSelectedCity] = useState<string>(cities[0] || 'قم');
  const [checkInIso, setCheckInIso] = useState<string>(defaultCheckInIso);
  const [nights, setNights] = useState<number>(Math.min(2, maxNights));
  const [phone, setPhone] = useState<string>((currentUser as any)?.phone || '');
  const [description, setDescription] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const myAccommodationRequests = useMemo(
    () =>
      welfareRequests.filter(
        (r) => r.type === 'accommodation' && (!currentUser || r.applicantId === currentUser.id)
      ),
    [welfareRequests, currentUser]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await submitAccommodationRequest({
        city: selectedCity,
        checkInIso,
        nights,
        phone: phone.trim() || undefined,
        description: description.trim() || undefined,
      });
      setDescription('');
      setFeedback({
        type: 'success',
        text: res?.message || 'درخواست شما ثبت شد با شما تماس گرفته می‌شود',
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err?.message || 'خطا در ثبت درخواست اسکان. لطفاً تاریخ و شهر را بررسی کنید.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Executive Banner */}
      <div className="rounded-3xl bg-gradient-to-l from-[#071E17] via-[#0B2C22] to-[#0D3327] text-white p-5 sm:p-6 shadow-md border border-emerald-900/40 space-y-1.5">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-[#F3D078]" />
          <h2 className="text-base sm:text-lg font-black">
            {welfarePortalConfig.modulesConfig.accommodation.title}
          </h2>
        </div>
        <p className="text-xs text-stone-200 leading-relaxed">
          {welfarePortalConfig.modulesConfig.accommodation.subtitle}
        </p>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs sm:text-sm font-black flex items-center gap-2.5 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Single Cohesive Booking Box */}
      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border border-stone-200/90 bg-white p-5 sm:p-6 shadow-2xs space-y-5"
      >
        <div className="border-b border-stone-100 pb-3">
          <h3 className="text-sm font-black text-[#071E17]">فرم رزرو اقامتگاه و مهمانسرا</h3>
          <p className="text-[11px] text-stone-500 mt-0.5">
            شهر مقصد، تاریخ ورود از تقویم شمسی و تعداد شب اقامت (حداکثر {toPersianNumbers(maxNights)} شب) را انتخاب کنید.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: City, Nights, Phone, Notes */}
          <div className="lg:col-span-5 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-stone-800 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#071E17]" />
                <span>انتخاب شهر مقصد</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {cities.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedCity(c)}
                    className={`min-h-[44px] px-4 py-2 rounded-xl border text-xs font-black transition-all cursor-pointer ${
                      selectedCity === c
                        ? 'bg-[#071E17] text-[#F3D078] border-[#071E17] shadow-xs'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-stone-800 flex items-center gap-1.5">
                <Moon className="w-4 h-4 text-[#071E17]" />
                <span>مدت اقامت (حداکثر {toPersianNumbers(maxNights)} شب)</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: maxNights }).map((_, idx) => {
                  const n = idx + 1;
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setNights(n)}
                      className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs font-black tabular-nums transition-all cursor-pointer ${
                        nights === n
                          ? 'bg-[#071E17] text-[#F3D078] border-[#071E17]'
                          : 'bg-stone-50 text-stone-800 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {toPersianNumbers(n)} شب
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-stone-800 flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-[#071E17]" />
                <span>شماره تماس جهت هماهنگی اقامتگاه</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="09120000000"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-stone-300 text-xs font-bold tabular-nums bg-stone-50 focus:bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-stone-800 block">
                توضیحات تکمیلی (تعداد همراهان یا نیاز ویژه)
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="مثال: اقامت به همراه خانواده (۳ نفر)، ترجیحاً نزدیک به حرم مطهر یا مجتمع..."
                className="w-full p-3 rounded-xl border border-stone-300 text-xs leading-relaxed bg-stone-50 focus:bg-white"
              />
            </div>
          </div>

          {/* Right Column: RTL Jalali Calendar */}
          <div className="lg:col-span-7">
            <JalaliDatePicker
              valueIso={checkInIso}
              onChangeIso={setCheckInIso}
              minLeadDays={minLeadDays}
            />
          </div>
        </div>

        <div className="pt-3 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-stone-600 tabular-nums">
            خلاصه انتخاب:{' '}
            <strong className="text-[#071E17]">
              {selectedCity} · از {formatIsoToJalali(checkInIso, true)} · به مدت {toPersianNumbers(nights)} شب
            </strong>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="min-h-[46px] px-7 py-2.5 rounded-2xl bg-[#071E17] hover:bg-[#0B2C22] text-[#F3D078] text-xs font-black flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-60"
          >
            <Send className="w-4 h-4" />
            <span>{submitting ? 'در حال ثبت درخواست...' : 'ثبت درخواست اسکان'}</span>
          </button>
        </div>
      </form>

      {/* Accommodation Requests History */}
      <div className="rounded-3xl border border-stone-200/90 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <h3 className="text-sm font-black text-[#071E17]">سوابق درخواست‌های اسکان من</h3>
          <span className="text-xs font-bold text-stone-500 tabular-nums">
            {toPersianNumbers(myAccommodationRequests.length)} درخواست
          </span>
        </div>

        {myAccommodationRequests.length === 0 ? (
          <div className="py-8 text-center text-stone-400 text-xs font-bold">
            هنوز درخواست اسکانی ثبت نکرده‌اید.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {myAccommodationRequests.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-2xl border border-stone-200/80 bg-[#FCFCF9] space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs sm:text-sm font-black text-[#071E17]">{req.title}</span>
                  {req.status === 'approved' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" /> تایید شد
                    </span>
                  ) : req.status === 'rejected' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200">
                      <XCircle className="w-3 h-3" /> لغو / رد شد
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black bg-amber-50 text-amber-800 border border-amber-200">
                      <Clock className="w-3 h-3" /> در انتظار هماهنگی
                    </span>
                  )}
                </div>
                <div className="text-xs text-stone-700 font-bold tabular-nums">{req.requestedValue}</div>
                {req.description && <p className="text-[11px] text-stone-500">{req.description}</p>}
                {req.adminNote && (
                  <p className="text-[11px] font-bold text-emerald-900 bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-200">
                    پاسخ واحد رفاه: {req.adminNote}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
