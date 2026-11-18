import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Course, CourseEnrollment } from '../../../types';
import { toPersianNumbers } from '../../../utils/persianNumbers';
import {
  X,
  ZoomIn,
  GraduationCap,
  UserCheck,
  Clock,
  Calendar,
  MapPin,
  Sparkles,
  BookOpen,
  Users,
  Award,
  CreditCard,
  CheckCircle2,
  PlayCircle,
  Lock,
  Settings,
  Target,
  FileText,
  Layers,
} from 'lucide-react';

interface CourseDetailModalProps {
  course: Course | null;
  userEnrollment?: CourseEnrollment;
  isOfficial: boolean;
  onClose: () => void;
  onOpenRegistration: (course: Course) => void;
  onOpenAttendance: (course: Course) => void;
  onOpenDedicatedAdmin?: (course: Course) => void;
  onImageClick: (img: { url: string; title: string; subtitle?: string }) => void;
}

export const CourseDetailModal: React.FC<CourseDetailModalProps> = ({
  course,
  userEnrollment,
  isOfficial,
  onClose,
  onOpenRegistration,
  onOpenAttendance,
  onOpenDedicatedAdmin,
  onImageClick,
}) => {
  if (!course) return null;

  const hidden = new Set(course.hiddenFields || []);
  const isVisible = (key: string) => !hidden.has(key);

  const remainingCapacity =
    course.remainingCapacity !== undefined
      ? course.remainingCapacity
      : Math.max(0, (course.capacity || 0) - (course.enrolledCount || 0));

  const isEnrolled = Boolean(course.isEnrolled || (userEnrollment && userEnrollment.paymentStatus !== 'rejected'));
  const enrollmentStatus = userEnrollment?.paymentStatus || course.enrollmentStatus;
  const isConfirmed = enrollmentStatus === 'confirmed';
  const isPendingReview = enrollmentStatus === 'pending_review';
  const isFull = remainingCapacity <= 0;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md"
        dir="rtl"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] text-right text-slate-900 dark:text-slate-100"
          onClick={e => e.stopPropagation()}
        >
          {/* Hero Header / Cover Photo */}
          <div className="relative h-52 sm:h-64 bg-slate-900 shrink-0 overflow-hidden">
            {course.coverImage ? (
              <>
                <img
                  src={course.coverImage}
                  alt={course.title}
                  className="w-full h-full object-cover opacity-80"
                />
                <button
                  type="button"
                  onClick={() =>
                    onImageClick({
                      url: course.coverImage!,
                      title: course.title,
                      subtitle: `مدرس: ${course.instructor}`,
                    })
                  }
                  className="absolute bottom-4 left-4 px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 text-white text-xs font-bold flex items-center gap-1.5 backdrop-blur-sm transition-colors cursor-pointer z-10"
                >
                  <ZoomIn className="w-4 h-4 text-emerald-400" />
                  <span>بزرگنمایی تصویر</span>
                </button>
              </>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 flex items-center justify-center">
                <GraduationCap className="w-20 h-20 text-emerald-400/20" />
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />

            {/* Top Controls */}
            <div className="absolute top-4 inset-x-4 flex items-center justify-between z-10">
              <div className="flex flex-wrap items-center gap-2">
                {course.category && (
                  <span className="px-3 py-1 rounded-xl bg-emerald-500 text-stone-950 text-[11px] font-black shadow-sm">
                    {course.category}
                  </span>
                )}
                <span className="px-3 py-1 rounded-xl bg-white/15 backdrop-blur-md text-white text-[11px] font-bold border border-white/20">
                  {course.holdingFormat === 'online'
                    ? 'برخط (آنلاین)'
                    : course.holdingFormat === 'in_person'
                    ? 'حضوری'
                    : 'ترکیبی (حضوری + آنلاین)'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {isOfficial && onOpenDedicatedAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenDedicatedAdmin(course);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>مدیریت دوره</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="w-9 h-9 rounded-xl bg-black/50 hover:bg-rose-600 text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Title Overlay */}
            <div className="absolute bottom-4 right-5 left-36 z-10 space-y-1">
              {isVisible('level') && course.level && (
                <span className="text-[11px] text-emerald-300 font-bold block">{course.level}</span>
              )}
              <h2 className="text-lg sm:text-2xl font-black text-white leading-snug drop-shadow">
                {course.title}
              </h2>
            </div>
          </div>

          {/* Scrollable Body */}
          <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6 text-xs sm:text-sm">
            {/* Key Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {isVisible('holdingTime') && (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[11px] text-slate-500 flex items-center gap-1 font-bold">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>ساعت و زمان برگزاری</span>
                  </span>
                  <strong className="text-xs font-black text-slate-900 dark:text-white block">
                    {course.holdingTime || course.schedule || 'طبق تقویم آموزشی'}
                  </strong>
                  {course.schedule && course.holdingTime && (
                    <span className="text-[10px] text-slate-500 block">{course.schedule}</span>
                  )}
                </div>
              )}

              {isVisible('startDate') && (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[11px] text-slate-500 flex items-center gap-1 font-bold">
                    <Calendar className="w-3.5 h-3.5 text-sky-600" />
                    <span>تاریخ شروع و مدت</span>
                  </span>
                  <strong className="text-xs font-black text-slate-900 dark:text-white block">
                    {course.startDate ? toPersianNumbers(course.startDate) : 'اعلام متعاقب'}
                  </strong>
                  {isVisible('hours') && (
                    <span className="text-[10px] text-slate-500 block">
                      مجموعاً {toPersianNumbers(course.hours)} ساعت آموزشی
                    </span>
                  )}
                </div>
              )}

              {isVisible('capacity') && (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[11px] text-slate-500 flex items-center gap-1 font-bold">
                    <Users className="w-3.5 h-3.5 text-amber-600" />
                    <span>ظرفیت باقی‌مانده</span>
                  </span>
                  <strong
                    className={`text-xs font-black block ${
                      isFull ? 'text-rose-600' : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {isFull
                      ? 'ظرفیت تکمیل شده است'
                      : `${toPersianNumbers(remainingCapacity)} نفر از ${toPersianNumbers(course.capacity)} نفر`}
                  </strong>
                  <span className="text-[10px] text-slate-500 block">
                    ثبت‌نام قطعی: {toPersianNumbers(course.enrolledCount)} نفر
                  </span>
                </div>
              )}

              {isVisible('price') && (
                <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 space-y-1">
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-400 flex items-center gap-1 font-bold">
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>شهریه دوره</span>
                  </span>
                  <strong className="text-sm font-black text-emerald-700 dark:text-emerald-300 block">
                    {course.price > 0
                      ? `${toPersianNumbers(course.price.toLocaleString('fa-IR'))} تومان`
                      : 'رایگان'}
                  </strong>
                  {course.hasInstallments && course.price > 0 && (
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold block">
                      امکان پرداخت اقساطی و اعمال کد تخفیف
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* 1. Instructor Resume Card */}
            {isVisible('instructorResume') && (
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center gap-3.5">
                  {course.instructorAvatarUrl ? (
                    <img
                      src={course.instructorAvatarUrl}
                      alt={course.instructor}
                      className="w-14 h-14 rounded-2xl object-cover border border-slate-300 dark:border-slate-700 shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black text-lg shrink-0">
                      <UserCheck className="w-7 h-7" />
                    </div>
                  )}
                  <div>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold block">
                      مدرس و استاد دوره
                    </span>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">{course.instructor}</h3>
                    {course.instructorTitle && (
                      <span className="text-xs text-slate-500 dark:text-slate-400">{course.instructorTitle}</span>
                    )}
                  </div>
                </div>
                {course.instructorResume && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    <strong className="text-slate-900 dark:text-white block mb-1">رزومه و سوابق علمی استاد:</strong>
                    {course.instructorResume}
                  </div>
                )}
              </div>
            )}

            {/* 2. Target Audiences (طلاب، قضات، وکلا و...) */}
            {isVisible('targetAudiences') && course.targetAudiences && course.targetAudiences.length > 0 && (
              <div className="p-4 rounded-2xl bg-sky-50/60 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-900/40 space-y-2">
                <h4 className="text-xs font-black text-sky-900 dark:text-sky-300 flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-sky-600" />
                  <span>مخاطبین هدف دوره:</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {course.targetAudiences.map((aud, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-xl bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-200 text-xs font-bold shadow-2xs"
                    >
                      {aud}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Course Description & Necessity & Manager Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isVisible('description') && course.description && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-emerald-600" />
                    <span>توضیحات جامع دوره</span>
                  </h4>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {course.description}
                  </p>
                </div>
              )}

              {isVisible('necessity') && course.necessity && (
                <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-2">
                  <h4 className="text-xs font-black text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>ضرورت‌های اجرای دوره</span>
                  </h4>
                  <p className="text-xs text-amber-950 dark:text-amber-100 leading-relaxed whitespace-pre-line">
                    {course.necessity}
                  </p>
                </div>
              )}
            </div>

            {/* Manager Supplementary Explanations */}
            {isVisible('managerNotes') && course.managerNotes && (
              <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/40 space-y-1.5">
                <h4 className="text-xs font-black text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span>توضیحات تکمیلی مدیر آموزش:</span>
                </h4>
                <p className="text-xs text-indigo-950 dark:text-indigo-100 leading-relaxed whitespace-pre-line">
                  {course.managerNotes}
                </p>
              </div>
            )}

            {/* 4. Syllabus / Topics & Prerequisites */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isVisible('topics') && course.topics && course.topics.length > 0 && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-emerald-600" />
                    <span>سرفصل‌های آموزشی</span>
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                    {course.topics.map((topic, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                          {toPersianNumbers(i + 1)}
                        </span>
                        <span className="leading-relaxed">{topic}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-3">
                {isVisible('prerequisites') && course.prerequisites && (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
                    <h4 className="text-xs font-black text-slate-900 dark:text-white">پیش‌نیازها و شرایط شرکت:</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{course.prerequisites}</p>
                  </div>
                )}

                {isVisible('venueAddress') && course.holdingFormat !== 'online' && course.venueAddress && (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
                    <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-rose-500" />
                      <span>نشانی محل برگزاری حضوری:</span>
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{course.venueAddress}</p>
                  </div>
                )}

                {isVisible('certificate') && course.hasCertificate && (
                  <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 space-y-1">
                    <h4 className="text-xs font-black text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-emerald-600" />
                      <span>گواهی پایان دوره:</span>
                    </h4>
                    <p className="text-xs text-emerald-900 dark:text-emerald-200">
                      {course.certificateDetails || 'گواهی رسمی پایان دوره به همراه فایل معتبر در کارنامه دوره ارائه می‌شود.'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 5. Installment Plan Schedule Summary */}
            {isVisible('installments') && course.hasInstallments && course.installmentPlan?.enabled && course.installmentPlan.items?.length > 0 && (
              <div className="p-4 rounded-2xl bg-teal-50/60 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900/40 space-y-2.5">
                <h4 className="text-xs font-black text-teal-900 dark:text-teal-300 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-teal-600" />
                  <span>جدول زمان‌بندی پرداخت اقساطی شهریه:</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {course.installmentPlan.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-800/60 text-xs space-y-0.5"
                    >
                      <strong className="text-slate-900 dark:text-white block font-black">{item.title}</strong>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold block">
                        {item.fixedAmount
                          ? `${toPersianNumbers(item.fixedAmount.toLocaleString('fa-IR'))} تومان`
                          : `${toPersianNumbers(item.percentage || 0)}٪ شهریه`}
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        سررسید: {toPersianNumbers(item.dueDateJalali)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 6. Custom Admin Dynamic Fields */}
            {course.customFields && course.customFields.filter(f => f.visible !== false && f.value?.trim()).length > 0 && (
              <div className="space-y-2.5">
                <h4 className="text-xs font-black text-slate-900 dark:text-white">اطلاعات تکمیلی دوره:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {course.customFields
                    .filter(f => f.visible !== false && f.value?.trim())
                    .map(field => (
                      <div
                        key={field.id}
                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1"
                      >
                        <span className="text-[11px] font-bold text-slate-500 block">{field.label}</span>
                        <div className="text-xs font-bold text-slate-900 dark:text-white whitespace-pre-line leading-relaxed">
                          {field.value}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer CTA */}
          <div className="p-4 sm:px-6 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
            >
              بستن پنجره
            </button>

            <div className="flex items-center gap-2">
              {(isConfirmed || course.archiveAccess === 'all' || isOfficial) && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAttendance(course);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-2 shadow-md cursor-pointer"
                >
                  <PlayCircle className="w-4 h-4" />
                  <span>ورود به تالار کلاس و منابع</span>
                </button>
              )}

              {!isEnrolled && !isPendingReview && (
                <button
                  type="button"
                  disabled={isFull}
                  onClick={() => {
                    onClose();
                    onOpenRegistration(course);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 text-stone-950 text-xs font-black flex items-center gap-2 shadow-md cursor-pointer"
                >
                  {isFull ? <Lock className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>{isFull ? 'ظرفیت دوره تکمیل شده' : 'ثبت‌نام در دوره'}</span>
                </button>
              )}

              {isPendingReview && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenRegistration(course);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-black cursor-pointer"
                >
                  فیش واریزی در انتظار تایید ادمین
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
