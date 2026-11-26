import React, { useState, useMemo } from 'react';
import {
  Compass,
  MapPin,
  Calendar,
  Users,
  Wallet,
  CreditCard,
  Upload,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Info,
  X,
  Phone,
  FileText,
  Download,
  Ticket,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { WelfareRecreationProgram } from '../../types';
import { api } from '../../services/apiClient';
import { toPersianNumbers } from '../../utils/persianNumbers';
import { formatIsoToJalali } from '../../utils/jalaliDate';

function resolveRecreationCover(url?: string): string {
  if (!url || !url.trim() || url.includes('unsplash.com')) {
    return '/assets/recreation/default.jpg';
  }
  return url;
}

function getRegistrationMethodLabel(prog: WelfareRecreationProgram): string {
  if (prog.isFree || prog.registrationMethod === 'direct_free') {
    return 'ثبت‌نام مستقیم رایگان';
  }
  if (prog.registrationMethod === 'online_gateway') {
    return 'پرداخت آنلاین و ثبت قطعی';
  }
  if (prog.registrationMethod === 'bank_receipt') {
    return 'واریز به حساب و بارگذاری فیش';
  }
  return 'پرداخت آنلاین یا بارگذاری فیش واریزی';
}

export const WelfareRecreationTab: React.FC = () => {
  const {
    currentUser,
    welfarePortalConfig,
    recreationPrograms,
    recreationRegistrations,
    registerRecreationProgram,
  } = useApp();

  const [activeView, setActiveView] = useState<'programs' | 'history'>('programs');
  const [selectedProgram, setSelectedProgram] = useState<WelfareRecreationProgram | null>(null);
  const [companionsCount, setCompanionsCount] = useState<number>(0);
  const [phone, setPhone] = useState<string>((currentUser as any)?.phone || '');
  const [paymentMethod, setPaymentMethod] = useState<'free' | 'online_gateway' | 'bank_receipt'>('online_gateway');
  const [receiptUrl, setReceiptUrl] = useState<string>('');
  const [receiptName, setReceiptName] = useState<string>('');
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const activePrograms = useMemo(
    () => (recreationPrograms || []).filter((p) => p.isActive !== false),
    [recreationPrograms]
  );

  const myRegistrations = useMemo(
    () =>
      (recreationRegistrations || []).filter(
        (r) => !currentUser || r.userId === currentUser.id
      ),
    [recreationRegistrations, currentUser]
  );

  const activeRegistrationByProgram = useMemo(() => {
    const map = new Map<string, typeof myRegistrations[number]>();
    for (const reg of myRegistrations) {
      if (reg.status === 'pending_review' || reg.status === 'confirmed') {
        map.set(reg.programId, reg);
      }
    }
    return map;
  }, [myRegistrations]);

  const openProgramModal = (prog: WelfareRecreationProgram) => {
    setSelectedProgram(prog);
    setCompanionsCount(0);
    setPhone((currentUser as any)?.phone || '');
    setNotes('');
    setReceiptUrl('');
    setReceiptName('');
    setFeedback(null);
    if (prog.isFree || prog.registrationMethod === 'direct_free') {
      setPaymentMethod('free');
    } else if (prog.registrationMethod === 'bank_receipt') {
      setPaymentMethod('bank_receipt');
    } else {
      setPaymentMethod('online_gateway');
    }
  };

  const handleUploadReceipt = async (file: File) => {
    if (file.size > 8 * 1024 * 1024) {
      setFeedback({ type: 'error', text: 'حجم فایل فیش نباید بیشتر از ۸ مگابایت باشد.' });
      return;
    }
    setUploadingReceipt(true);
    setFeedback(null);
    try {
      const res = await api.uploadFile(file, 'welfare_receipt');
      if (res?.url) {
        setReceiptUrl(res.url);
        setReceiptName(res.originalName || file.name);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'آپلود تصویر فیش با خطا مواجه شد.' });
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProgram) return;
    if (paymentMethod === 'bank_receipt' && !receiptUrl) {
      setFeedback({ type: 'error', text: 'لطفاً ابتدا تصویر فیش واریزی را بارگذاری نمایید.' });
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    try {
      const created = await registerRecreationProgram({
        programId: selectedProgram.id,
        companionsCount,
        paymentMethod: selectedProgram.isFree ? 'free' : paymentMethod,
        receiptUrl: paymentMethod === 'bank_receipt' ? receiptUrl : undefined,
        notes: notes.trim() || undefined,
        phone: phone.trim() || undefined,
      });
      setSelectedProgram(null);
      setActiveView('history');
      setFeedback({
        type: 'success',
        text:
          created.status === 'pending_review'
            ? `ثبت‌نام شما با کد رهگیری ${created.trackingCode} ثبت شد و در انتظار بررسی فیش است.`
            : `ثبت‌نام قطعی شما با کد رهگیری ${created.trackingCode} با موفقیت انجام شد.`,
      });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'خطا در ثبت‌نام برنامه تفریحی.' });
    } finally {
      setSubmitting(false);
    }
  };

  const renderStatusLabel = (status: string) => {
    if (status === 'confirmed') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> ثبت‌نام قطعی
        </span>
      );
    }
    if (status === 'rejected' || status === 'cancelled') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-black text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg">
          <XCircle className="w-3.5 h-3.5 shrink-0" /> {status === 'cancelled' ? 'لغو شده' : 'رد شده'}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-black text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
        <Clock className="w-3.5 h-3.5 shrink-0" /> در انتظار تایید فیش
      </span>
    );
  };

  const moduleMeta = welfarePortalConfig.modulesConfig.recreation_tourism;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Dedicated Header */}
      <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-bl from-[#071E17] via-[#0B2C22] to-[#113D2F] text-white p-5 sm:p-7 border border-[#F3D078]/30 shadow-md">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-l from-transparent via-[#F3D078]/70 to-transparent"
        />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-bold text-[#F3D078]">
              <Compass className="w-4 h-4 shrink-0" />
              <span>صفحه اختصاصی بخش ۰۶ · تفریحی و گردشگری</span>
            </div>
            <h1 className="text-lg sm:text-2xl font-black text-white">
              {moduleMeta?.title || 'تفریحی و گردشگری'}
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/85 leading-relaxed">
              {moduleMeta?.subtitle ||
                'اطلاع‌رسانی و ثبت‌نام تورها، اردوها و برنامه‌های فرهنگی و تفریحی اعضا'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-5 border-t lg:border-t-0 lg:border-r border-white/15 pt-4 lg:pt-0 lg:pr-6 shrink-0">
            <div>
              <div className="text-[10px] text-emerald-200/75 font-bold">برنامه‌های فعال</div>
              <div className="text-lg font-black text-[#F3D078] tabular-nums mt-0.5">
                {toPersianNumbers(activePrograms.length)} برنامه
              </div>
            </div>
            <div>
              <div className="text-[10px] text-emerald-200/75 font-bold">ثبت‌نام‌های من</div>
              <div className="text-lg font-black text-white tabular-nums mt-0.5">
                {toPersianNumbers(myRegistrations.length)} مورد
              </div>
            </div>
          </div>
        </div>
      </section>

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

      {/* Segmented View Switch */}
      <div className="inline-flex items-center gap-1.5 p-1.5 rounded-2xl bg-[#F3EFE2] border border-[#E2DAC3]">
        <button
          type="button"
          onClick={() => setActiveView('programs')}
          className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-colors cursor-pointer ${
            activeView === 'programs'
              ? 'bg-[#071E17] text-[#F3D078] shadow-xs'
              : 'text-stone-700 hover:bg-white/70'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>اطلاعیه‌ها و برنامه‌های فعال</span>
          <span className="tabular-nums text-[11px] opacity-80">
            ({toPersianNumbers(activePrograms.length)})
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveView('history')}
          className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-colors cursor-pointer ${
            activeView === 'history'
              ? 'bg-[#071E17] text-[#F3D078] shadow-xs'
              : 'text-stone-700 hover:bg-white/70'
          }`}
        >
          <Ticket className="w-4 h-4" />
          <span>سوابق ثبت‌نام من</span>
          <span className="tabular-nums text-[11px] opacity-80">
            ({toPersianNumbers(myRegistrations.length)})
          </span>
        </button>
      </div>

      {/* VIEW 1: PROGRAMS & ANNOUNCEMENTS */}
      {activeView === 'programs' && (
        activePrograms.length === 0 ? (
          <div className="rounded-[26px] border border-[#E2DAC3] bg-white p-12 text-center space-y-2.5 text-stone-400">
            <Compass className="w-10 h-10 mx-auto opacity-30" />
            <p className="text-sm font-black text-stone-700">
              در حال حاضر تور یا برنامه تفریحی فعالی برای ثبت‌نام اعلام نشده است.
            </p>
            <p className="text-xs text-stone-500">
              به‌محض انتشار اطلاعیه جدید توسط واحد رفاهی، برنامه در همین صفحه قابل مشاهده و ثبت‌نام خواهد بود.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {activePrograms.map((prog) => {
              const isUnlimited = prog.capacity === 0;
              const remaining = isUnlimited
                ? null
                : Math.max(0, prog.capacity - prog.registeredCount);
              const isFull = !isUnlimited && remaining === 0;
              const myActiveReg = activeRegistrationByProgram.get(prog.id);

              return (
                <article
                  key={prog.id}
                  className="rounded-[26px] border border-[#E2DAC3] bg-[#FCFCF9] hover:bg-white shadow-[0_8px_24px_-16px_rgba(7,30,23,0.16)] hover:shadow-[0_18px_36px_-18px_rgba(7,30,23,0.28)] overflow-hidden flex flex-col justify-between transition-all"
                >
                  <div>
                    <div className="relative h-48 bg-stone-200 overflow-hidden">
                      <img
                        src={resolveRecreationCover(prog.coverImage)}
                        alt={prog.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#071E17]/90 via-[#071E17]/40 to-transparent p-4 flex items-end justify-between gap-2">
                        <div className="text-xs font-bold text-[#F3D078] flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{prog.destination}</span>
                        </div>
                        <span className="text-[11px] font-black text-white/95 shrink-0">
                          {prog.programType}
                        </span>
                      </div>
                    </div>

                    <div className="p-5 space-y-3.5">
                      <h2 className="text-base font-black text-[#071E17] leading-snug">
                        {prog.title}
                      </h2>

                      {prog.summary && (
                        <p className="text-xs text-stone-600 leading-relaxed line-clamp-3">
                          {prog.summary}
                        </p>
                      )}

                      <div className="pt-3 border-t border-stone-200/75 space-y-2 text-xs">
                        {(prog.scheduleText || prog.startDate) && (
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-stone-500 flex items-center gap-1.5 shrink-0">
                              <Calendar className="w-3.5 h-3.5 text-[#071E17]" />
                              <span>زمان‌بندی:</span>
                            </span>
                            <span className="font-bold text-[#071E17] text-left truncate">
                              {prog.scheduleText || prog.startDate}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between gap-2">
                          <span className="text-stone-500 flex items-center gap-1.5 shrink-0">
                            <Users className="w-3.5 h-3.5 text-[#071E17]" />
                            <span>ظرفیت:</span>
                          </span>
                          <span
                            className={`font-black tabular-nums ${
                              isFull ? 'text-rose-700' : 'text-emerald-900'
                            }`}
                          >
                            {isUnlimited
                              ? 'نامحدود'
                              : isFull
                              ? 'تکمیل ظرفیت'
                              : `${toPersianNumbers(remaining ?? 0)} نفر باقی‌مانده از ${toPersianNumbers(prog.capacity)}`}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <span className="text-stone-500 flex items-center gap-1.5 shrink-0">
                            <Wallet className="w-3.5 h-3.5 text-[#071E17]" />
                            <span>هزینه (هر نفر):</span>
                          </span>
                          <span className="font-black text-[#071E17] tabular-nums">
                            {prog.isFree
                              ? 'رایگان (تسهیلات مجتمع)'
                              : `${toPersianNumbers(prog.feeAmount.toLocaleString('fa-IR'))} تومان`}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <span className="text-stone-500 flex items-center gap-1.5 shrink-0">
                            <CreditCard className="w-3.5 h-3.5 text-[#071E17]" />
                            <span>شیوه ثبت‌نام:</span>
                          </span>
                          <span className="font-bold text-stone-700 truncate">
                            {getRegistrationMethodLabel(prog)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="px-5 pb-5 pt-1">
                    {myActiveReg ? (
                      <button
                        type="button"
                        onClick={() => openProgramModal(prog)}
                        className="w-full min-h-[44px] px-4 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-black flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>
                          ثبت‌نام شده (کد {myActiveReg.trackingCode}) · مشاهده اطلاعیه
                        </span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openProgramModal(prog)}
                        className={`w-full min-h-[46px] px-4 py-2.5 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                          isFull
                            ? 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                            : 'bg-[#071E17] hover:bg-[#0B2C22] text-[#F3D078] shadow-xs'
                        }`}
                      >
                        <Info className="w-4 h-4 shrink-0" />
                        <span>
                          {isFull ? 'مشاهده جزئیات (تکمیل ظرفیت)' : 'مشاهده توضیحات کامل و ثبت‌نام'}
                        </span>
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )
      )}

      {/* VIEW 2: MY REGISTRATIONS LEDGER */}
      {activeView === 'history' && (
        <div className="rounded-[26px] border border-[#E2DAC3] bg-white p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3.5">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#071E17]" />
              <h2 className="text-sm sm:text-base font-black text-[#071E17]">
                سوابق ثبت‌نام تورها و برنامه‌های تفریحی من
              </h2>
            </div>
            <span className="text-xs font-bold text-stone-500 tabular-nums">
              {toPersianNumbers(myRegistrations.length)} ثبت‌نام
            </span>
          </div>

          {myRegistrations.length === 0 ? (
            <div className="py-12 text-center space-y-2 text-stone-400">
              <Ticket className="w-10 h-10 mx-auto opacity-30" />
              <p className="text-xs font-bold text-stone-500">
                هنوز در هیچ برنامه تفریحی یا گردشگری ثبت‌نام نکرده‌اید.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myRegistrations.map((reg) => (
                <div
                  key={reg.id}
                  className="p-4 sm:p-5 rounded-2xl border border-stone-200/85 bg-[#FCFCF9] space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-black text-sm text-[#071E17]">{reg.programTitle}</div>
                    {renderStatusLabel(reg.status)}
                  </div>

                  <div className="text-xs text-stone-600 flex flex-wrap items-center gap-x-2 gap-y-1 tabular-nums">
                    {reg.destination && <span>مقصد: {reg.destination}</span>}
                    {reg.scheduleText && (
                      <>
                        <span className="text-stone-300">·</span>
                        <span>{reg.scheduleText}</span>
                      </>
                    )}
                  </div>

                  <div className="text-xs font-bold text-stone-800 flex flex-wrap items-center gap-x-3 gap-y-1 tabular-nums border-t border-stone-200/70 pt-2.5">
                    <span>
                      تعداد نفرات: {toPersianNumbers(reg.seatsReserved)} نفر (
                      {reg.companionsCount > 0
                        ? `خود عضو + ${toPersianNumbers(reg.companionsCount)} همراه`
                        : 'بدون همراه'}
                      )
                    </span>
                    <span className="text-stone-300">·</span>
                    <span>
                      مبلغ کل:{' '}
                      {reg.totalAmount === 0
                        ? 'رایگان'
                        : `${toPersianNumbers(reg.totalAmount.toLocaleString('fa-IR'))} تومان`}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-500 tabular-nums">
                    <span>کد پیگیری: <strong className="text-[#071E17]">{reg.trackingCode}</strong></span>
                    <span>ثبت: {formatIsoToJalali(reg.createdAt)}</span>
                  </div>

                  {reg.receiptUrl && (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await api.downloadPrivateFile(reg.receiptUrl!, `فیش-${reg.trackingCode}`);
                        } catch (err: any) {
                          setFeedback({ type: 'error', text: err?.message || 'خطا در دانلود فیش واریزی.' });
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-[#071E17] border border-stone-200 text-xs font-bold cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-700" />
                      <span>دریافت فیش واریزی</span>
                    </button>
                  )}

                  {reg.adminNote && (
                    <p className="text-[11px] font-bold text-emerald-900 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200">
                      پاسخ واحد رفاهی: {reg.adminNote}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* DETAILS & REGISTRATION MODAL */}
      {selectedProgram && (
        <div
          className="fixed inset-0 z-50 bg-stone-950/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-1 sm:p-4 overflow-hidden"
          onClick={() => setSelectedProgram(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-t-[26px] sm:rounded-3xl max-w-2xl w-full shadow-2xl border border-stone-200 max-h-[92dvh] sm:max-h-[90vh] flex flex-col overflow-hidden"
          >
            {/* Pinned Header */}
            <div className="shrink-0 flex items-center justify-between px-4 py-3.5 sm:px-6 sm:py-4 border-b border-stone-200">
              <div className="min-w-0">
                <span className="text-[11px] font-bold text-emerald-800 block">
                  {selectedProgram.programType} · {selectedProgram.destination}
                </span>
                <h3 className="font-black text-sm sm:text-base text-[#071E17] truncate">
                  {selectedProgram.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProgram(null)}
                aria-label="بستن"
                className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <form
              id="recreation-register-form"
              onSubmit={handleRegister}
              className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain p-4 sm:p-6 space-y-5"
            >
              <div className="h-48 sm:h-56 rounded-2xl overflow-hidden border border-stone-200 bg-stone-100">
                <img
                  src={resolveRecreationCover(selectedProgram.coverImage)}
                  alt={selectedProgram.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Key Announcement Facts */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-[#FAF8F2] border border-[#E2DAC3] text-xs">
                <div>
                  <span className="text-[10px] text-stone-500 font-bold block">ظرفیت باقی‌مانده</span>
                  <span className="font-black text-[#071E17] tabular-nums mt-0.5 block">
                    {selectedProgram.capacity === 0
                      ? 'نامحدود'
                      : `${toPersianNumbers(
                          Math.max(0, selectedProgram.capacity - selectedProgram.registeredCount)
                        )} از ${toPersianNumbers(selectedProgram.capacity)} نفر`}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 font-bold block">هزینه هر نفر</span>
                  <span className="font-black text-[#071E17] tabular-nums mt-0.5 block">
                    {selectedProgram.isFree
                      ? 'رایگان'
                      : `${toPersianNumbers(selectedProgram.feeAmount.toLocaleString('fa-IR'))} تومان`}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 font-bold block">تاریخ / زمان اجرا</span>
                  <span className="font-black text-[#071E17] mt-0.5 block">
                    {selectedProgram.startDate || selectedProgram.scheduleText || 'اعلام متعاقب'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 font-bold block">مهلت ثبت‌نام</span>
                  <span className="font-black text-[#071E17] mt-0.5 block">
                    {selectedProgram.registrationDeadline || 'تا تکمیل ظرفیت'}
                  </span>
                </div>
              </div>

              {/* Full Announcement Description */}
              <div className="space-y-2 text-xs">
                <h4 className="font-black text-[#071E17]">توضیحات، خدمات و جزئیات برنامه</h4>
                <p className="text-stone-700 leading-relaxed whitespace-pre-line bg-stone-50 p-4 rounded-2xl border border-stone-200/80">
                  {selectedProgram.description || selectedProgram.summary}
                </p>
                {selectedProgram.scheduleText && (
                  <p className="text-stone-600 font-bold">
                    زمان و محل حرکت: <span className="text-[#071E17]">{selectedProgram.scheduleText}</span>
                  </p>
                )}
              </div>

              {selectedProgram.paymentInstructions && (
                <div className="p-3.5 rounded-2xl bg-amber-50/75 border border-amber-200 text-xs text-amber-950 space-y-1">
                  <div className="font-black">شیوه ثبت‌نام و نکات پرداخت:</div>
                  <p className="leading-relaxed">{selectedProgram.paymentInstructions}</p>
                  {selectedProgram.cardNumber && (
                    <p className="font-black tabular-nums pt-1">
                      شماره کارت جهت واریز: {toPersianNumbers(selectedProgram.cardNumber)}
                    </p>
                  )}
                </div>
              )}

              {/* Registration Controls */}
              {(() => {
                const existingReg = activeRegistrationByProgram.get(selectedProgram.id);
                const remaining =
                  selectedProgram.capacity === 0
                    ? 99
                    : Math.max(0, selectedProgram.capacity - selectedProgram.registeredCount);

                if (existingReg) {
                  return (
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-bold">
                      شما پیش‌تر در این برنامه با کد رهگیری{' '}
                      <span className="font-black">{existingReg.trackingCode}</span> برای{' '}
                      {toPersianNumbers(existingReg.seatsReserved)} نفر ثبت‌نام کرده‌اید.
                    </div>
                  );
                }

                if (selectedProgram.capacity > 0 && remaining <= 0) {
                  return (
                    <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-black">
                      ظرفیت این برنامه تکمیل شده است.
                    </div>
                  );
                }

                const maxCompanions = Math.min(10, Math.max(0, remaining - 1));
                const totalSeats = 1 + companionsCount;
                const totalAmount = selectedProgram.isFree
                  ? 0
                  : selectedProgram.feeAmount * totalSeats;

                return (
                  <div className="space-y-4 pt-3 border-t border-stone-200">
                    <h4 className="font-black text-sm text-[#071E17]">تکمیل فرم ثبت‌نام</h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                      <div className="space-y-1.5">
                        <label className="font-black text-stone-700 block">
                          تعداد همراهان (علاوه بر شخص شما):
                        </label>
                        <select
                          value={companionsCount}
                          onChange={(e) => setCompanionsCount(Number(e.target.value))}
                          className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-stone-300 bg-stone-50 font-black"
                        >
                          {Array.from({ length: maxCompanions + 1 }).map((_, idx) => (
                            <option key={idx} value={idx}>
                              {idx === 0
                                ? 'فقط خودم (۱ نفر)'
                                : `خودم + ${toPersianNumbers(idx)} همراه (${toPersianNumbers(idx + 1)} نفر)`}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-black text-stone-700 flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-[#071E17]" />
                          <span>شماره تماس هماهنگی:</span>
                        </label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="09120000000"
                          className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-stone-300 bg-stone-50 font-bold tabular-nums"
                        />
                      </div>
                    </div>

                    {!selectedProgram.isFree && selectedProgram.registrationMethod === 'both' && (
                      <div className="space-y-2 text-xs">
                        <label className="font-black text-stone-700 block">روش پرداخت هزینه:</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('online_gateway')}
                            className={`min-h-[46px] px-3.5 py-2 rounded-xl border text-xs font-black cursor-pointer ${
                              paymentMethod === 'online_gateway'
                                ? 'bg-[#071E17] text-[#F3D078] border-[#071E17]'
                                : 'bg-stone-50 text-stone-700 border-stone-200'
                            }`}
                          >
                            پرداخت آنلاین و صدور کد پیگیری فوری
                          </button>
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('bank_receipt')}
                            className={`min-h-[46px] px-3.5 py-2 rounded-xl border text-xs font-black cursor-pointer ${
                              paymentMethod === 'bank_receipt'
                                ? 'bg-[#071E17] text-[#F3D078] border-[#071E17]'
                                : 'bg-stone-50 text-stone-700 border-stone-200'
                            }`}
                          >
                            واریز بانکی و بارگذاری فیش
                          </button>
                        </div>
                      </div>
                    )}

                    {!selectedProgram.isFree && paymentMethod === 'bank_receipt' && (
                      <div className="p-3.5 rounded-2xl border border-dashed border-stone-300 bg-[#FCFCF9] space-y-2 text-xs">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <span className="font-black text-[#071E17] block">
                              بارگذاری تصویر فیش واریزی <span className="text-rose-500">*</span>
                            </span>
                            <span className="text-[11px] text-stone-500">
                              {receiptName
                                ? `فایل انتخاب‌شده: ${receiptName}`
                                : 'تصویر یا PDF فیش واریزی (حداکثر ۸ مگابایت)'}
                            </span>
                          </div>
                          <label className="px-3.5 py-2 rounded-xl bg-[#071E17] text-[#F3D078] font-black inline-flex items-center gap-1.5 cursor-pointer">
                            <Upload className="w-3.5 h-3.5" />
                            <span>{uploadingReceipt ? 'در حال آپلود...' : 'انتخاب فیش'}</span>
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp,.pdf"
                              disabled={uploadingReceipt}
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                e.target.value = '';
                                if (f) handleUploadReceipt(f);
                              }}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    )}

                    <div className="space-y-1.5 text-xs">
                      <label className="font-black text-stone-700 block">
                        یادداشت یا توضیحات (نام همراهان، سن فرزندان یا ملاحظات غذایی):
                      </label>
                      <textarea
                        rows={2}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="در صورت نیاز مشخصات همراهان یا توضیحات تکمیلی را بنویسید..."
                        className="w-full p-3 rounded-xl border border-stone-300 bg-stone-50"
                      />
                    </div>

                    <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between text-xs font-black text-[#071E17] tabular-nums">
                      <span>جمع کل قابل پرداخت ({toPersianNumbers(totalSeats)} نفر):</span>
                      <span className="text-sm">
                        {totalAmount === 0
                          ? 'رایگان'
                          : `${toPersianNumbers(totalAmount.toLocaleString('fa-IR'))} تومان`}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </form>

            {/* Pinned Footer */}
            <div className="shrink-0 flex items-center justify-end gap-2 px-4 py-3 sm:px-6 sm:py-4 border-t border-stone-200 bg-white pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={() => setSelectedProgram(null)}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-black cursor-pointer"
              >
                بستن
              </button>
              {(() => {
                const existingReg = activeRegistrationByProgram.get(selectedProgram.id);
                const remaining =
                  selectedProgram.capacity === 0
                    ? 99
                    : Math.max(0, selectedProgram.capacity - selectedProgram.registeredCount);
                if (existingReg || (selectedProgram.capacity > 0 && remaining <= 0)) return null;
                return (
                  <button
                    type="submit"
                    form="recreation-register-form"
                    disabled={submitting || uploadingReceipt}
                    className="min-h-[44px] px-6 py-2 rounded-xl bg-[#071E17] hover:bg-[#0B2C22] text-[#F3D078] text-xs font-black cursor-pointer disabled:opacity-60"
                  >
                    {submitting ? 'در حال ثبت...' : 'تایید و ثبت‌نام نهایی'}
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
