import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Course, CourseEnrollment, User } from '../../../types';
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
  ChevronLeft
} from 'lucide-react';

const SAMPLE_RECEIPT_IMAGE = 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=60';

interface CourseRegistrationModalProps {
  course: Course | null;
  currentUser: User | null;
  existingEnrollment?: CourseEnrollment | null;
  onClose: () => void;
  onSubmitRegistration: (data: {
    paymentMethod: 'online_gateway' | 'bank_receipt';
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
  const [receiptTrackingCode, setReceiptTrackingCode] = useState('');
  const [receiptBankName, setReceiptBankName] = useState('بانک ملی ایران (واریز پایا)');
  const [receiptDate, setReceiptDate] = useState('۱۴۰۳/۰۸/۰۵');
  const [receiptFilePreview, setReceiptFilePreview] = useState<string>(SAMPLE_RECEIPT_IMAGE);
  const [receiptFileName, setReceiptFileName] = useState<string>('receipt_scan_national_bank.jpg');
  const [receiptFileSize, setReceiptFileSize] = useState<string>('۲۴۵ کیلوبایت');
  const [lastSubmittedTracking, setLastSubmittedTracking] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const receiptFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (course) {
      setRegStep(1);
      setRegTermsAccepted(false);
      const policy = course.allowedPaymentMethod || 'both';
      if (policy === 'gateway_only') {
        setRegPaymentMethod('online_gateway');
      } else {
        setRegPaymentMethod('bank_receipt');
      }
      setReceiptTrackingCode(`TRX-${Math.floor(1000000 + Math.random() * 9000000)}`);
    }
  }, [course]);

  if (!course) return null;

  const isAlreadyEnrolled = Boolean(existingEnrollment);

  const handleReceiptFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFileName(file.name);
      setReceiptFileSize(`${Math.round(file.size / 1024)} کیلوبایت`);
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setReceiptFilePreview(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const tracking = await onSubmitRegistration({
        paymentMethod: regPaymentMethod,
        trackingCode: receiptTrackingCode,
        receiptBankName,
        receiptDate,
        receiptFileUrl: receiptFilePreview,
      });
      setLastSubmittedTracking(tracking);
      setRegStep(3);
    } catch (err) {
      console.error(err);
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
                مرحله {toPersianNumbers(regStep)} از ۳: {regStep === 1 ? 'معرفی جامع دوره' : regStep === 2 ? 'تکمیل مشخصات و شیوه پرداخت' : 'تایید نهایی ثبت‌نام'}
              </span>
              <h3 className="text-base sm:text-lg font-black text-white truncate max-w-md">
                {course.title}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Step Flow Content */}
          <div className="p-6 overflow-y-auto space-y-5 flex-1">
            {/* STEP 1: DETAILED COURSE PRESENTATION LANDING */}
            {regStep === 1 && (
              <div className="space-y-5">
                {/* Course Banner Image with Lightbox Zoom Click */}
                {course.coverImage && (
                  <div
                    onClick={() => onImageClick({
                      url: course.coverImage!,
                      title: course.title,
                      subtitle: `مدرس: ${course.instructor}`,
                    })}
                    className="w-full h-48 rounded-2xl overflow-hidden relative shadow-md group/img cursor-pointer"
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
                  <div>
                    <span className="text-slate-400 block text-[11px]">مدت آموزش:</span>
                    <strong className="text-slate-900 dark:text-white font-bold">{toPersianNumbers(course.hours)} ساعت تخصصی</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">شهریه ثبت‌نام:</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 font-black">
                      {course.price > 0 ? `${toPersianNumbers(course.price.toLocaleString('fa-IR'))} تومان` : 'رایگان ویژه اعضا'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">تاریخ شروع:</span>
                    <span className="text-slate-800 dark:text-slate-200 font-bold">{toPersianNumbers(course.startDate || 'هم‌اکنون')}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">زمان‌بندی جلسات:</span>
                    <span className="text-slate-800 dark:text-slate-200 font-bold">{toPersianNumbers(course.schedule)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">شیوه پرداخت مجاز:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      {course.allowedPaymentMethod === 'gateway_only' ? 'فقط درگاه پرداخت شتاب' : course.allowedPaymentMethod === 'receipt_only' ? 'فقط ارسال فیش واریز' : 'درگاه پرداخت یا ارسال فیش'}
                    </span>
                  </div>
                </div>

                {/* Full Description */}
                <div>
                  <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white mb-2.5 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-emerald-500" />
                    <span>شرح و اهداف کاربردی دوره:</span>
                  </h4>
                  <p className="text-sm sm:text-base text-slate-700 dark:text-slate-200 leading-relaxed p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-medium">
                    {course.description}
                  </p>
                </div>

                {/* Topics Covered */}
                {course.topics && course.topics.length > 0 && (
                  <div>
                    <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white mb-3">
                      سرفصل‌های آموزشی و مباحث مطروحه:
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {course.topics.map((t, i) => (
                        <div key={i} className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm">
                          <span className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-600 font-bold flex items-center justify-center text-xs shrink-0">
                            {toPersianNumbers(i + 1)}
                          </span>
                          <span className="text-slate-800 dark:text-slate-200 font-medium truncate">{t}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Terms Acknowledgment or Already Enrolled Notice */}
                {isAlreadyEnrolled ? (
                  <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-xs sm:text-sm font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span>
                      شما قبلاً در این دوره ثبت‌نام کرده‌اید ({existingEnrollment?.paymentStatus === 'confirmed' ? 'ثبت‌نام قطعی و تایید شده' : 'در حال بررسی فیش واریزی'}). امکان ثبت‌نام مجدد وجود ندارد.
                    </span>
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
                        اینجانب کلیه شرایط، بازه زمانی، شیوه برگزاری و ضوابط حضور در دوره را مطالعه نموده و متمایل به ثبت‌نام و ادامه فرایند می‌باشم.
                      </span>
                    </label>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: PARTICIPANT VERIFICATION & PAYMENT METHOD */}
            {regStep === 2 && (
              <div className="space-y-5">
                {/* Participant Verified Profile Card */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
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
                      <strong className="font-mono text-slate-900 dark:text-white font-bold">{toPersianNumbers(currentUser?.nationalId || '0019988776')}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">شماره تلفن همراه:</span>
                      <strong className="font-mono text-slate-900 dark:text-white font-bold">{toPersianNumbers(currentUser?.phone || '09127778899')}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">سمت و رتبه:</span>
                      <strong className="text-slate-900 dark:text-white font-bold">{currentUser?.roleTitle || 'دانش‌آموخته مرکز'}</strong>
                    </div>
                  </div>
                </div>

                {/* Course & Price Summary */}
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold block">دوره انتخابی:</span>
                    <strong className="text-slate-900 dark:text-white text-sm font-black">{course.title}</strong>
                  </div>
                  <div className="text-left">
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold block">مبلغ قابل پرداخت:</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 text-base font-black">
                      {course.price > 0 ? `${toPersianNumbers(course.price.toLocaleString('fa-IR'))} تومان` : 'رایگان'}
                    </strong>
                  </div>
                </div>

                {/* Payment Method Selector Gated by Supervisor Policy */}
                {course.price > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-black text-slate-800 dark:text-slate-200">
                        انتخاب شیوه پرداخت شهریه:
                      </label>
                      <span className="text-[11px] text-slate-400">
                        (مشخص‌شده توسط مسئول آموزش)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Option 1: Bank Transfer Slip */}
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
                            واریز به حساب مرکز، بارگذاری تصویر فیش و ثبت کد رهگیری
                          </p>
                        </div>
                      )}

                      {/* Option 2: Online Gateway */}
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
                            ورود به درگاه امن شتاب و ثبت‌نام آنی بدون نیاز به تایید دستی
                          </p>
                        </div>
                      )}
                    </div>

                    {/* If Bank Receipt Selected */}
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
                              placeholder="مثال: TRX-7821940"
                              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                              بانک مبدأ و شیوه واریز:
                            </label>
                            <input
                              type="text"
                              value={receiptBankName}
                              onChange={e => setReceiptBankName(e.target.value)}
                              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>
                        </div>

                        {/* Working Receipt File Attachment */}
                        <div className="space-y-2">
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            پیوست بارگذاری مدارک واریز (تصویر یا فایل فیش):
                          </label>

                          <input
                            ref={receiptFileInputRef}
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={handleReceiptFileChange}
                            className="hidden"
                          />

                          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 flex flex-col sm:flex-row items-center gap-3.5">
                            <div
                              onClick={() => onImageClick({ url: receiptFilePreview, title: 'تصویر پیوست فیش واریزی' })}
                              className="w-20 h-20 rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 shrink-0 bg-slate-200 cursor-pointer relative group/thumb"
                              title="جهت بزرگنمایی تصویر فیش کلیک کنید"
                            >
                              <img
                                src={receiptFilePreview}
                                alt="پیش‌نمایش فیش"
                                className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
                                <ZoomIn className="w-4 h-4 text-white" />
                              </div>
                            </div>

                            <div className="space-y-2 flex-1 w-full text-right">
                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => receiptFileInputRef.current?.click()}
                                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-bold shadow-xs cursor-pointer transition-colors"
                                >
                                  <UploadCloud className="w-3.5 h-3.5" />
                                  <span>انتخاب فایل فیش از دستگاه</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setReceiptFilePreview(SAMPLE_RECEIPT_IMAGE);
                                    setReceiptFileName('sample_official_receipt.jpg');
                                    setReceiptFileSize('۲۴۰ کیلوبایت');
                                  }}
                                  className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-300 text-xs font-medium cursor-pointer transition-colors"
                                >
                                  استفاده از رسید نمونه
                                </button>
                              </div>

                              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                                <Paperclip className="w-3.5 h-3.5 text-emerald-500" />
                                <span className="font-mono text-slate-700 dark:text-slate-300 font-bold truncate max-w-[200px]">
                                  {receiptFileName}
                                </span>
                                <span>({receiptFileSize})</span>
                                <span className="text-emerald-600 font-bold mr-auto">✓ فایل آماده ارسال</span>
                              </div>
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
              </div>
            )}

            {/* STEP 3: SUBMISSION CONFIRMATION MESSAGE */}
            {regStep === 3 && (
              <div className="text-center py-8 px-4 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-lg">
                  <CheckCheck className="w-8 h-8" />
                </div>

                <h4 className="text-lg font-black text-slate-900 dark:text-white">
                  {regPaymentMethod === 'bank_receipt' ? 'مستندات و فیش شما با موفقیت ارسال شد' : 'ثبت‌نام شما با موفقیت انجام شد'}
                </h4>

                <div className="max-w-md mx-auto p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  {regPaymentMethod === 'bank_receipt' ? (
                    <p>
                      تصویر فیش و اطلاعات واریز شما برای معاونت آموزش ارسال گردید. پس از بررسی و تایید مستندات توسط مسئول مربوطه، پیامک تایید و دسترسی مستقیم به تالار آنلاین برای شما صادر خواهد شد.
                    </p>
                  ) : (
                    <p>
                      تراکنش درگاه پرداخت شاپرک با موفقیت تایید شد. دسترسی شما به کلاس و منابع آرشیو هم‌اکنون فعال است.
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
                onClick={() => setRegStep(prev => (prev - 1) as any)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
                <span>مرحله قبل</span>
              </button>
            ) : <div />}

            <div>
              {regStep === 1 && (
                isAlreadyEnrolled ? (
                  <button
                    onClick={onClose}
                    className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-black cursor-pointer shadow-md"
                  >
                    بستن و بازگشت
                  </button>
                ) : (
                  <button
                    disabled={!regTermsAccepted}
                    onClick={() => setRegStep(2)}
                    className={`flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-black transition-all ${
                      regTermsAccepted
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-stone-950 shadow-md shadow-emerald-500/20 cursor-pointer'
                        : 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <span>تایید و ورود به بخش پرداخت</span>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                )
              )}

              {regStep === 2 && (
                <button
                  disabled={isSubmitting}
                  onClick={handleSubmit}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-black shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {isSubmitting ? 'در حال ثبت...' : regPaymentMethod === 'bank_receipt' ? 'نهایی‌سازی و ارسال مستندات' : 'اتصال به درگاه و نهایی‌سازی'}
                  </span>
                </button>
              )}

              {regStep === 3 && (
                <button
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
