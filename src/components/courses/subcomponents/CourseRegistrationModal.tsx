import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Course, CourseEnrollment, User } from '../../../types';
import { api } from '../../../services/apiClient';
import { toPersianNumbers } from '../../../utils/persianNumbers';
import {
  X,
  BookOpen,
  ZoomIn,
  User as UserIcon,
  CheckCircle2,
  UploadCloud,
  CreditCard,
  Paperclip,
  CheckCheck,
  ChevronRight,
  ChevronLeft,
  TicketPercent,
  CalendarClock,
  Loader2,
  AlertCircle,
  Clock,
  Users,
  Target,
} from 'lucide-react';

interface CourseRegistrationModalProps {
  course: Course | null;
  currentUser: User | null;
  existingEnrollment?: CourseEnrollment | null;
  onClose: () => void;
  onSubmitRegistration: (data: {
    paymentMethod: 'online_gateway' | 'bank_receipt';
    paymentPlanType?: 'full' | 'installment';
    discountCode?: string;
    trackingCode: string;
    receiptBankName: string;
    receiptDate: string;
    receiptFileUrl: string;
  }) => Promise<string>;
  onImageClick: (img: { url: string; title: string; subtitle?: string }) => void;
}

export const CourseRegistrationModal: React.FC<CourseRegistrationModalProps> = ({
  course,
  currentUser,
  existingEnrollment,
  onClose,
  onSubmitRegistration,
  onImageClick,
}) => {
  const [regStep, setRegStep] = useState<1 | 2 | 3>(1);
  const [regTermsAccepted, setRegTermsAccepted] = useState(false);
  const [regPaymentMethod, setRegPaymentMethod] = useState<'online_gateway' | 'bank_receipt'>('bank_receipt');
  const [paymentPlanType, setPaymentPlanType] = useState<'full' | 'installment'>('full');
  const [receiptTrackingCode, setReceiptTrackingCode] = useState('');
  const [receiptBankName, setReceiptBankName] = useState('بانک ملی ایران (واریز پایا)');
  const [receiptDate, setReceiptDate] = useState(new Date().toLocaleDateString('fa-IR'));
  const [receiptFileUrl, setReceiptFileUrl] = useState<string>('');
  const [receiptLocalPreview, setReceiptLocalPreview] = useState<string>('');
  const [receiptFileName, setReceiptFileName] = useState<string>('');
  const [receiptFileSize, setReceiptFileSize] = useState<string>('');
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);

  // Discount Code States
  const [discountInput, setDiscountInput] = useState('');
  const [validatingDiscount, setValidatingDiscount] = useState(false);
  const [discountResult, setDiscountResult] = useState<{
    valid: boolean;
    message?: string;
    code?: string;
    title?: string;
    discountType?: string;
    discountAmount?: number;
    finalAmount?: number;
  } | null>(null);

  const [lastSubmittedTracking, setLastSubmittedTracking] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const receiptFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let previewToRevoke = '';
    if (course) {
      setRegStep(1);
      setRegTermsAccepted(false);
      const policy = course.allowedPaymentMethod || 'both';
      setRegPaymentMethod(policy === 'gateway_only' ? 'online_gateway' : 'bank_receipt');
      setPaymentPlanType('full');
      setReceiptTrackingCode(`TRX-${Math.floor(1000000 + Math.random() * 9000000)}`);
      setReceiptFileUrl('');
      setReceiptLocalPreview('');
      setReceiptFileName('');
      setReceiptFileSize('');
      setDiscountInput('');
      setDiscountResult(null);
      setSubmitError(null);
    }
    return () => {
      if (previewToRevoke) URL.revokeObjectURL(previewToRevoke);
    };
  }, [course]);

  if (!course) return null;

  const hidden = new Set(course.hiddenFields || []);
  const isVisible = (key: string) => !hidden.has(key);
  const remainingCapacity =
    course.remainingCapacity !== undefined
      ? course.remainingCapacity
      : Math.max(0, (course.capacity || 0) - (course.enrolledCount || 0));
  const isFull = remainingCapacity <= 0;

  const isAlreadyEnrolled = Boolean(existingEnrollment && existingEnrollment.paymentStatus !== 'rejected');
  const installmentItems = course.hasInstallments && course.installmentPlan?.enabled ? course.installmentPlan.items || [] : [];
  const supportsInstallments = course.price > 0 && installmentItems.length > 0;

  const discountDeducted = discountResult?.valid ? discountResult.discountAmount || 0 : 0;
  const effectiveTotalPrice = Math.max(0, (course.price || 0) - discountDeducted);

  const firstInstallmentAmount = (() => {
    if (!supportsInstallments || paymentPlanType !== 'installment') return effectiveTotalPrice;
    const first = installmentItems[0];
    if (!first) return effectiveTotalPrice;
    if (first.fixedAmount && first.fixedAmount > 0 && course.price > 0) {
      const ratio = effectiveTotalPrice / course.price;
      return Math.round(first.fixedAmount * ratio);
    }
    const pct = first.percentage || Math.round(100 / installmentItems.length);
    return Math.round((effectiveTotalPrice * pct) / 100);
  })();

  const dueNowAmount = paymentPlanType === 'installment' ? firstInstallmentAmount : effectiveTotalPrice;

  const handleApplyDiscount = async () => {
    if (!discountInput.trim()) return;
    setValidatingDiscount(true);
    setSubmitError(null);
    try {
      const res = await api.validateCourseDiscountCode(course.id, discountInput.trim());
      setDiscountResult(res);
    } catch (err: any) {
      setDiscountResult({
        valid: false,
        message: err?.message || 'کد تخفیف معتبر نیست.',
      });
    } finally {
      setValidatingDiscount(false);
    }
  };

  const handleReceiptFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubmitError(null);
    setIsUploadingReceipt(true);
    try {
      if (file.type.startsWith('image/')) {
        const localObj = URL.createObjectURL(file);
        setReceiptLocalPreview(localObj);
      } else {
        setReceiptLocalPreview('');
      }
      const uploaded = await api.uploadFile(file, 'course_receipt');
      setReceiptFileUrl(uploaded.url);
      setReceiptFileName(file.name);
      setReceiptFileSize(`${Math.max(1, Math.round(file.size / 1024))} کیلوبایت`);
    } catch (err: any) {
      setSubmitError(err?.message || 'خطا در بارگذاری فایل فیش روی سرور.');
      setReceiptFileUrl('');
      setReceiptLocalPreview('');
    } finally {
      setIsUploadingReceipt(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    if (dueNowAmount > 0 && regPaymentMethod === 'bank_receipt') {
      if (!receiptTrackingCode.trim()) {
        setSubmitError('لطفاً کد رهگیری فیش بانکی را وارد فرمایید.');
        return;
      }
      if (!receiptFileUrl) {
        setSubmitError('لطفاً فایل تصویر یا PDF فیش واریزی خود را انتخاب و روی سرور ذخیره فرمایید.');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const tracking = await onSubmitRegistration({
        paymentMethod: dueNowAmount === 0 ? 'online_gateway' : regPaymentMethod,
        paymentPlanType: supportsInstallments ? paymentPlanType : 'full',
        discountCode: discountResult?.valid ? discountResult.code : undefined,
        trackingCode: receiptTrackingCode,
        receiptBankName,
        receiptDate,
        receiptFileUrl,
      });
      setLastSubmittedTracking(tracking);
      setRegStep(3);
    } catch (err: any) {
      setSubmitError(err?.message || 'خطا در ثبت‌نام دوره. لطفاً اطلاعات را بررسی و مجدداً تلاش کنید.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-right text-slate-900 dark:text-slate-100 flex flex-col max-h-[90vh]"
          onClick={e => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="p-5 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-emerald-400 font-bold block mb-0.5">
                مرحله {toPersianNumbers(regStep)} از ۳: {regStep === 1 ? 'معرفی جامع و شرایط دوره' : regStep === 2 ? 'کد تخفیف، اقساط و پرداخت' : 'تایید نهایی ثبت‌نام'}
              </span>
              <h3 className="text-base sm:text-lg font-black text-white truncate max-w-md">
                {course.title}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Step Flow Content */}
          <div className="p-6 overflow-y-auto space-y-5 flex-1">
            {/* STEP 1: DETAILED COURSE PRESENTATION LANDING */}
            {regStep === 1 && (
              <div className="space-y-4">
                {course.coverImage && (
                  <div
                    onClick={() => onImageClick({
                      url: course.coverImage!,
                      title: course.title,
                      subtitle: `مدرس: ${course.instructor}`,
                    })}
                    className="w-full h-44 rounded-2xl overflow-hidden relative shadow-md group/img cursor-pointer"
                    title="جهت مشاهده تصویر در ابعاد بزرگ کلیک فرمایید"
                  >
                    <img
                      src={course.coverImage}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-between p-4">
                      <span className="text-white text-xs font-bold">
                        استاد: {course.instructor} {course.instructorTitle && `(${course.instructorTitle})`}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] bg-black/60 text-emerald-300 px-2.5 py-1 rounded-xl backdrop-blur-md">
                        <ZoomIn className="w-3.5 h-3.5" />
                        <span>مشاهده تصویر کامل</span>
                      </span>
                    </div>
                  </div>
                )}

                {/* Specifications Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium">
                  <div>
                    <span className="text-slate-400 block text-[11px]">شیوه برگزاری:</span>
                    <strong className="text-slate-900 dark:text-white font-bold">
                      {course.holdingFormat === 'online' ? 'مجازی (برخط)' : course.holdingFormat === 'in_person' ? 'حضوری' : 'ترکیبی'}
                    </strong>
                  </div>
                  {isVisible('holdingTime') && (
                    <div>
                      <span className="text-slate-400 block text-[11px] flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-500" />
                        <span>ساعت برگزاری:</span>
                      </span>
                      <strong className="text-slate-900 dark:text-white font-bold">
                        {course.holdingTime || toPersianNumbers(course.schedule)}
                      </strong>
                    </div>
                  )}
                  {isVisible('price') && (
                    <div>
                      <span className="text-slate-400 block text-[11px]">شهریه ثبت‌نام:</span>
                      <strong className="text-emerald-600 dark:text-emerald-400 font-black">
                        {course.price > 0 ? `${toPersianNumbers(course.price.toLocaleString('fa-IR'))} تومان` : 'رایگان ویژه اعضا'}
                      </strong>
                    </div>
                  )}
                  {isVisible('capacity') && (
                    <div>
                      <span className="text-slate-400 block text-[11px] flex items-center gap-1">
                        <Users className="w-3 h-3 text-sky-500" />
                        <span>ظرفیت باقی‌مانده:</span>
                      </span>
                      <strong className={isFull ? 'text-rose-600 font-black' : 'text-emerald-600 dark:text-emerald-400 font-black'}>
                        {isFull ? 'تکمیل شده' : `${toPersianNumbers(remainingCapacity)} از ${toPersianNumbers(course.capacity)} نفر`}
                      </strong>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-400 block text-[11px]">تاریخ شروع و مدت:</span>
                    <span className="text-slate-800 dark:text-slate-200 font-bold">
                      {toPersianNumbers(course.startDate || 'هم‌اکنون')} ({toPersianNumbers(course.hours)} ساعت)
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">شیوه پرداخت مجاز:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      {course.allowedPaymentMethod === 'gateway_only' ? 'فقط درگاه شتاب' : course.allowedPaymentMethod === 'receipt_only' ? 'فقط ارسال فیش' : 'درگاه یا فیش'}
                    </span>
                  </div>
                </div>

                {/* Instructor Resume */}
                {isVisible('instructorResume') && course.instructorResume && (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                    <span className="font-black text-slate-900 dark:text-white block">رزومه و سوابق استاد {course.instructor}:</span>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">{course.instructorResume}</p>
                  </div>
                )}

                {/* Target Audiences */}
                {isVisible('targetAudiences') && course.targetAudiences && course.targetAudiences.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="font-bold text-slate-500 flex items-center gap-1">
                      <Target className="w-3.5 h-3.5 text-sky-500" />
                      <span>مخاطبین هدف:</span>
                    </span>
                    {course.targetAudiences.map((aud, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-xl bg-sky-500/10 text-sky-700 dark:text-sky-300 font-bold">
                        {aud}
                      </span>
                    ))}
                  </div>
                )}

                {/* Description & Necessity */}
                {isVisible('description') && (
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-emerald-500" />
                      <span>شرح و اهداف کاربردی دوره:</span>
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-medium">
                      {course.description}
                    </p>
                  </div>
                )}

                {isVisible('necessity') && course.necessity && (
                  <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-xs space-y-1">
                    <span className="font-black text-amber-900 dark:text-amber-300 block">ضرورت‌های اجرای دوره:</span>
                    <p className="text-amber-950 dark:text-amber-100 leading-relaxed">{course.necessity}</p>
                  </div>
                )}

                {/* Custom Fields */}
                {course.customFields && course.customFields.filter(f => f.visible !== false && f.value?.trim()).length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    {course.customFields
                      .filter(f => f.visible !== false && f.value?.trim())
                      .map(cf => (
                        <div key={cf.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                          <span className="text-[11px] text-slate-400 block">{cf.label}</span>
                          <strong className="text-slate-900 dark:text-white font-bold">{cf.value}</strong>
                        </div>
                      ))}
                  </div>
                )}

                {/* Topics Covered */}
                {isVisible('topics') && course.topics && course.topics.length > 0 && (
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white mb-2">
                      سرفصل‌های آموزشی دوره:
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {course.topics.map((t, i) => (
                        <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
                          <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 font-bold flex items-center justify-center text-[11px] shrink-0">
                            {toPersianNumbers(i + 1)}
                          </span>
                          <span className="text-slate-800 dark:text-slate-200 font-medium truncate">{t}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Terms Acknowledgment or Status */}
                {isAlreadyEnrolled ? (
                  <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-xs sm:text-sm font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span>
                      شما قبلاً در این دوره ثبت‌نام کرده‌اید ({existingEnrollment?.paymentStatus === 'confirmed' ? 'ثبت‌نام قطعی و تایید شده' : 'در حال بررسی فیش واریزی'}).
                    </span>
                  </div>
                ) : isFull ? (
                  <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-xs font-bold text-rose-700 dark:text-rose-300">
                    متأسفانه ظرفیت پذیرش این دوره تکمیل شده است. در صورت نیاز می‌توانید از بخش «حضور و گواهی» وارد لیست انتظار شوید.
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={regTermsAccepted}
                        onChange={e => setRegTermsAccepted(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 mt-0.5 cursor-pointer"
                      />
                      <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 leading-relaxed">
                        اینجانب کلیه شرایط، بازه زمانی، شیوه برگزاری و ضوابط حضور در دوره را مطالعه نموده و متمایل به ثبت‌نام می‌باشم.
                      </span>
                    </label>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: DISCOUNT CODE, INSTALLMENT PLAN & PAYMENT METHOD */}
            {regStep === 2 && (
              <div className="space-y-4">
                {/* Participant Verified Profile Card */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <UserIcon className="w-4 h-4 text-emerald-500" />
                    <span>مشخصات شرکت‌کننده در دوره:</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 text-[11px] block">نام و نام خانوادگی:</span>
                      <strong className="text-slate-900 dark:text-white font-bold">{currentUser?.fullName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">کد ملی:</span>
                      <strong className="font-mono text-slate-900 dark:text-white font-bold">{toPersianNumbers(currentUser?.nationalId || '')}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">شماره تلفن همراه:</span>
                      <strong className="font-mono text-slate-900 dark:text-white font-bold">{toPersianNumbers(currentUser?.phone || '')}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">سمت و رتبه:</span>
                      <strong className="text-slate-900 dark:text-white font-bold">{currentUser?.roleTitle || 'دانش‌آموخته مرکز'}</strong>
                    </div>
                  </div>
                </div>

                {/* Discount Code Section */}
                {course.price > 0 && (
                  <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/40 space-y-2.5 text-xs">
                    <label className="font-black text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                      <TicketPercent className="w-4 h-4 text-indigo-600" />
                      <span>اعمال کد تخفیف (ویژه دوره‌ها، مناسبتی یا اختصاصی):</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={discountInput}
                        onChange={e => setDiscountInput(e.target.value.toUpperCase())}
                        placeholder="کد تخفیف خود را وارد نمایید..."
                        className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 font-mono uppercase dir-ltr text-right"
                      />
                      <button
                        type="button"
                        disabled={validatingDiscount || !discountInput.trim()}
                        onClick={handleApplyDiscount}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {validatingDiscount && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        <span>بررسی و اعمال کد</span>
                      </button>
                      {discountResult?.valid && (
                        <button
                          type="button"
                          onClick={() => {
                            setDiscountInput('');
                            setDiscountResult(null);
                          }}
                          className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-600 font-bold cursor-pointer"
                        >
                          حذف
                        </button>
                      )}
                    </div>
                    {discountResult && (
                      <div
                        className={`p-2.5 rounded-xl font-bold flex items-center justify-between ${
                          discountResult.valid
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                            : 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                        }`}
                      >
                        <span>
                          {discountResult.valid
                            ? `کد «${discountResult.title}» با موفقیت اعمال شد (-${toPersianNumbers((discountResult.discountAmount || 0).toLocaleString('fa-IR'))} تومان)`
                            : discountResult.message}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Installment vs Full Payment Plan */}
                {supportsInstallments && (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
                    <label className="font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      <CalendarClock className="w-4 h-4 text-emerald-600" />
                      <span>انتخاب شیوه تسویه (یکجا یا پرداخت اقساطی زمان‌بندی‌شده):</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setPaymentPlanType('full')}
                        className={`p-3 rounded-xl border-2 text-right cursor-pointer transition-all ${
                          paymentPlanType === 'full'
                            ? 'border-emerald-500 bg-emerald-500/10 font-bold'
                            : 'border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <strong className="block text-slate-900 dark:text-white">پرداخت نقدی یکجا</strong>
                        <span className="text-[11px] text-emerald-600 font-black">
                          {toPersianNumbers(effectiveTotalPrice.toLocaleString('fa-IR'))} تومان
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentPlanType('installment')}
                        className={`p-3 rounded-xl border-2 text-right cursor-pointer transition-all ${
                          paymentPlanType === 'installment'
                            ? 'border-emerald-500 bg-emerald-500/10 font-bold'
                            : 'border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <strong className="block text-slate-900 dark:text-white">
                          پرداخت اقساطی ({toPersianNumbers(installmentItems.length)} قسط)
                        </strong>
                        <span className="text-[11px] text-emerald-600 font-black">
                          پیش‌پرداخت فعلی: {toPersianNumbers(firstInstallmentAmount.toLocaleString('fa-IR'))} تومان
                        </span>
                      </button>
                    </div>

                    {paymentPlanType === 'installment' && (
                      <div className="space-y-1.5 pt-1 text-[11px] text-slate-600 dark:text-slate-300">
                        <span className="font-bold block">جدول اقساط شما (در سررسید هر قسط، درگاه پرداخت در پنل شما باز می‌شود):</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {installmentItems.map((inst, idx) => (
                            <div key={idx} className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex justify-between">
                              <span>{inst.title}</span>
                              <span className="font-mono font-bold text-slate-500">{toPersianNumbers(inst.dueDateJalali)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Course & Final Price Summary */}
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold block">
                      {paymentPlanType === 'installment' ? 'مبلغ قسط اول (پیش‌پرداخت الان):' : 'مبلغ نهایی قابل پرداخت:'}
                    </span>
                    <strong className="text-slate-900 dark:text-white text-sm font-black">{course.title}</strong>
                  </div>
                  <div className="text-left">
                    {discountDeducted > 0 && (
                      <span className="text-[11px] text-slate-400 line-through block">
                        {toPersianNumbers(course.price.toLocaleString('fa-IR'))} تومان
                      </span>
                    )}
                    <strong className="text-emerald-600 dark:text-emerald-400 text-base font-black">
                      {dueNowAmount > 0 ? `${toPersianNumbers(dueNowAmount.toLocaleString('fa-IR'))} تومان` : 'رایگان'}
                    </strong>
                  </div>
                </div>

                {/* Payment Method Selector Gated by Supervisor Policy */}
                {dueNowAmount > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-black text-slate-800 dark:text-slate-200">
                        انتخاب شیوه پرداخت:
                      </label>
                      <span className="text-[11px] text-slate-400">(مشخص‌شده توسط مسئول آموزش)</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(course.allowedPaymentMethod === 'both' || course.allowedPaymentMethod === 'receipt_only') && (
                        <div
                          onClick={() => setRegPaymentMethod('bank_receipt')}
                          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                            regPaymentMethod === 'bank_receipt'
                              ? 'bg-emerald-500/15 border-emerald-500 shadow-md text-emerald-950 dark:text-emerald-200 font-bold'
                              : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1.5">
                            <UploadCloud className="w-4 h-4 text-emerald-500" />
                            <span className="font-extrabold text-xs">واریز کارت به کارت / فیش بانکی</span>
                          </div>
                          <p className="text-[11px] opacity-80 leading-relaxed font-normal">
                            ذخیره فایل فیش در پوشه اختصاصی دیسک سرور و بررسی توسط مدیر
                          </p>
                        </div>
                      )}

                      {(course.allowedPaymentMethod === 'both' || course.allowedPaymentMethod === 'gateway_only') && (
                        <div
                          onClick={() => setRegPaymentMethod('online_gateway')}
                          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                            regPaymentMethod === 'online_gateway'
                              ? 'bg-emerald-500/15 border-emerald-500 shadow-md text-emerald-950 dark:text-emerald-200 font-bold'
                              : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1.5">
                            <CreditCard className="w-4 h-4 text-emerald-500" />
                            <span className="font-extrabold text-xs">درگاه پرداخت الکترونیک شتاب</span>
                          </div>
                          <p className="text-[11px] opacity-80 leading-relaxed font-normal">
                            پرداخت آنلاین آنی و فعال‌سازی فوری دسترسی کلاس
                          </p>
                        </div>
                      )}
                    </div>

                    {regPaymentMethod === 'bank_receipt' ? (
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4">
                        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-800 dark:text-amber-300 space-y-1">
                          <span className="font-bold block">اطلاعات حساب بانکی رسمی مرکز نخبگان:</span>
                          <div className="font-mono text-[11px] space-y-0.5">
                            <div>شماره کارت: ۶۰۳۷-۹۹۷۵-۱۲۳۴-۵۶۷۸ (بانک ملی ایران)</div>
                            <div>شماره شبا: IR980120000000001234567890 (به نام مرکز دانش‌آموختگان)</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                              کد رهگیری / شماره ارجاع فیش:
                            </label>
                            <input
                              type="text"
                              required
                              value={receiptTrackingCode}
                              onChange={e => setReceiptTrackingCode(e.target.value)}
                              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono text-slate-900 dark:text-white"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                              بانک مبدأ و تاریخ واریز:
                            </label>
                            <div className="flex gap-1.5">
                              <input
                                type="text"
                                value={receiptBankName}
                                onChange={e => setReceiptBankName(e.target.value)}
                                className="flex-1 px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                              />
                              <input
                                type="text"
                                value={receiptDate}
                                onChange={e => setReceiptDate(e.target.value)}
                                className="w-24 px-2 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Real Disk Receipt Upload */}
                        <div className="space-y-2">
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            پیوست بارگذاری مستندات واریز (ذخیره در فایل اختصاصی روی دیسک):
                          </label>

                          <input
                            ref={receiptFileInputRef}
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={handleReceiptFileChange}
                            className="hidden"
                          />

                          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 flex flex-col sm:flex-row items-center gap-3.5">
                            {receiptLocalPreview ? (
                              <div
                                onClick={() => onImageClick({ url: receiptLocalPreview, title: 'تصویر پیوست فیش واریزی' })}
                                className="w-20 h-20 rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 shrink-0 bg-slate-200 cursor-pointer relative group/thumb"
                              >
                                <img
                                  src={receiptLocalPreview}
                                  alt="پیش‌نمایش فیش"
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
                                  <ZoomIn className="w-4 h-4 text-white" />
                                </div>
                              </div>
                            ) : (
                              <div className="w-20 h-20 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 shrink-0 flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                                <Paperclip className="w-6 h-6 text-slate-400" />
                              </div>
                            )}

                            <div className="space-y-2 flex-1 w-full text-right">
                              <button
                                type="button"
                                disabled={isUploadingReceipt}
                                onClick={() => receiptFileInputRef.current?.click()}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-black shadow-xs cursor-pointer disabled:opacity-60"
                              >
                                {isUploadingReceipt ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                                <span>{isUploadingReceipt ? 'در حال آپلود روی دیسک...' : 'انتخاب و ذخیره فیش روی دیسک'}</span>
                              </button>

                              {receiptFileUrl ? (
                                <div className="flex items-center gap-2 text-[11px] text-emerald-600 font-bold">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span className="truncate max-w-[200px]">{receiptFileName}</span>
                                  <span>({receiptFileSize})</span>
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-400 block">
                                  فرمت‌های مجاز: JPG, PNG, WEBP یا PDF (حداکثر ۸ مگابایت)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-emerald-950 border border-emerald-500/30 text-white space-y-3 shadow-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-emerald-400">درگاه پرداخت یکپارچه شاپرک</span>
                          <CreditCard className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div className="font-mono text-sm tracking-widest text-center py-2 bg-black/40 rounded-xl">
                          ۶۰۳۷ ···· ···· ۴۴۱۸
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-300 pt-1">
                          <span>پذیرنده: مرکز نخبگان فقه و قضا</span>
                          <span className="font-bold text-emerald-400">اتصال امن پروتکل شاپرک</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {submitError && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: SUBMISSION CONFIRMATION MESSAGE */}
            {regStep === 3 && (
              <div className="text-center py-8 px-4 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-lg">
                  <CheckCheck className="w-8 h-8" />
                </div>

                <h4 className="text-lg font-black text-slate-900 dark:text-white">
                  {dueNowAmount > 0 && regPaymentMethod === 'bank_receipt'
                    ? 'مستندات و فیش شما با موفقیت روی سرور ذخیره و ارسال شد'
                    : 'ثبت‌نام شما با موفقیت انجام شد'}
                </h4>

                <div className="max-w-md mx-auto p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  {dueNowAmount > 0 && regPaymentMethod === 'bank_receipt' ? (
                    <p>
                      تصویر فیش و اطلاعات واریز شما برای معاونت آموزش ارسال گردید. پس از بررسی و تایید مستندات توسط مسئول مربوطه، دسترسی شما به کلاس فعال خواهد شد.
                    </p>
                  ) : (
                    <p>
                      تراکنش ثبت‌نام شما با موفقیت ثبت و تایید شد. دسترسی شما به تالار کلاس و منابع دوره هم‌اکنون برقرار است.
                    </p>
                  )}

                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-800 dark:text-slate-200 font-bold flex justify-between">
                    <span>شماره پیگیری ثبت‌نام:</span>
                    <span className="text-emerald-600 dark:text-emerald-400">{toPersianNumbers(lastSubmittedTracking)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer Controls */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            {regStep > 1 && regStep < 3 ? (
              <button
                type="button"
                onClick={() => setRegStep(prev => (prev - 1) as 1 | 2 | 3)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
                <span>مرحله قبل</span>
              </button>
            ) : (
              <div />
            )}

            <div>
              {regStep === 1 && (
                isAlreadyEnrolled || isFull ? (
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-black cursor-pointer shadow-md"
                  >
                    بستن و بازگشت
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={!regTermsAccepted}
                    onClick={() => setRegStep(2)}
                    className={`flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-black transition-all ${
                      regTermsAccepted
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-stone-950 shadow-md shadow-emerald-500/20 cursor-pointer'
                        : 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <span>تایید و ورود به بخش تخفیف و پرداخت</span>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                )
              )}

              {regStep === 2 && (
                <button
                  type="button"
                  disabled={isSubmitting || isUploadingReceipt}
                  onClick={handleSubmit}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-black shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {isSubmitting
                      ? 'در حال ثبت...'
                      : dueNowAmount === 0
                      ? 'تکمیل ثبت‌نام رایگان'
                      : regPaymentMethod === 'bank_receipt'
                      ? 'نهایی‌سازی و ارسال فیش'
                      : 'پرداخت آنلاین و نهایی‌سازی'}
                  </span>
                </button>
              )}

              {regStep === 3 && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 text-stone-950 text-xs font-black cursor-pointer shadow-md"
                >
                  بستن و بازگشت به میز کار
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
