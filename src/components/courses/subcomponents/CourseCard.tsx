import React from 'react';
import { motion } from 'motion/react';
import { Course, CourseEnrollment, CourseScope } from '../../../types';
import { toPersianNumbers } from '../../../utils/persianNumbers';
import {
  Eye,
  GraduationCap,
  User,
  Settings,
  CreditCard,
  Clock,
  Users,
  Award,
  Sparkles,
  CheckCircle2,
  PlayCircle,
  Lock,
  ChevronLeft,
  SlidersHorizontal,
  Trash2,
  Target
} from 'lucide-react';

interface CourseCardProps {
  mode?: CourseScope;
  course: Course;
  userEnrollment?: CourseEnrollment;
  isOfficial: boolean;
  onOpenDetail: (course: Course) => void;
  onOpenRegistration: (course: Course) => void;
  onOpenAttendance: (course: Course) => void;
  onOpenDedicatedAdmin: (course: Course) => void;
  onOpenRoster: (course: Course) => void;
  onOpenBuilder: (course: Course) => void;
  onStartDelete: (course: Course) => void;
  onImageClick: (img: { url: string; title: string; subtitle?: string }) => void;
  onOpenCourseOps?: (course: Course) => void;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  mode,
  course,
  userEnrollment,
  isOfficial,
  onOpenDetail,
  onOpenRegistration,
  onOpenAttendance,
  onOpenDedicatedAdmin,
  onOpenRoster,
  onOpenBuilder,
  onStartDelete,
  onOpenCourseOps,
}) => {
  const unitNoun = (mode || course.courseScope) === 'counseling_workshop' ? 'کارگاه' : 'دوره';
  const isRemovedFromClass = Boolean(
    userEnrollment?.classStatus === 'removed' || course.classStatus === 'removed'
  );
  const isEnrolled = Boolean(
    !isRemovedFromClass &&
      (course.isEnrolled || (userEnrollment && userEnrollment.paymentStatus !== 'rejected'))
  );
  const enrollmentStatus = userEnrollment?.paymentStatus || course.enrollmentStatus || (course.isEnrolled ? 'confirmed' : undefined);
  const isConfirmed = enrollmentStatus === 'confirmed' && !isRemovedFromClass;
  const isPendingReview = enrollmentStatus === 'pending_review' && !isRemovedFromClass;
  const canAccessArchive = !isRemovedFromClass && (course.archiveAccess === 'all' || isOfficial || isConfirmed);

  const hidden = new Set(course.hiddenFields || []);
  const isVisible = (key: string) => !hidden.has(key);

  const remainingCapacity =
    course.remainingCapacity !== undefined
      ? course.remainingCapacity
      : Math.max(0, (course.capacity || 0) - (course.enrolledCount || 0));
  const isFull = remainingCapacity <= 0;

  const visibleCustomFields = (course.customFields || []).filter(
    f => f.visible !== false && f.label?.trim() && f.value?.trim()
  );

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.985 }}
      onClick={() => onOpenDetail(course)}
      className="glass-card rounded-[26px] sm:rounded-3xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col justify-between shadow-lg group transition-all cursor-pointer"
    >
      <div>
        {/* Course Banner Image — Clicking opens Full Course Details Modal */}
        <div
          className="relative h-40 sm:h-44 w-full bg-slate-900 overflow-hidden group/img"
          title="کلیک جهت مشاهده کامل توضیحات، رزومه استاد و مشخصات دوره"
        >
          {course.coverImage ? (
            <>
              <img
                src={course.coverImage}
                alt={course.title}
                className="w-full h-full object-cover group-hover/img:scale-108 transition-transform duration-500 opacity-90"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-black/20" />
              <div className="absolute inset-0 bg-black/45 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white">
                <Eye className="w-5 h-5 text-emerald-400 drop-shadow" />
                <span className="text-xs font-black bg-black/65 px-3 py-1.5 rounded-xl backdrop-blur-sm">
                  مشاهده جزئیات کامل {unitNoun}
                </span>
              </div>
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 flex items-center justify-center">
              <GraduationCap className="w-16 h-16 text-emerald-500/20" />
            </div>
          )}

          {/* Floating Badges */}
          <div className="absolute top-3 right-3 flex flex-wrap gap-1.5 z-10 pointer-events-none">
            <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-slate-900/80 backdrop-blur-md text-white border border-white/20">
              {course.holdingFormat === 'online' ? 'مجازی (برخط)' : course.holdingFormat === 'in_person' ? 'حضوری' : 'ترکیبی'}
            </span>
            {course.category && (
              <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-emerald-500/90 text-stone-950">
                {course.category}
              </span>
            )}
          </div>

          <div className="absolute top-3 left-3 z-10 pointer-events-none">
            {course.status === 'completed' ? (
              <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-stone-800/90 text-stone-300 border border-stone-700">
                آرشیو شده
              </span>
            ) : course.status === 'ongoing' ? (
              <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-sky-500/90 text-white">
                در حال برگزاری
              </span>
            ) : isFull ? (
              <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-rose-500 text-white">
                تکمیل ظرفیت
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-emerald-500 text-stone-950">
                در حال پذیرش
              </span>
            )}
          </div>

          {/* Instructor Avatar Badge (Multi-instructor summary) */}
          <div className="absolute bottom-3 right-3 flex items-center gap-2 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/10 text-white pointer-events-none max-w-[88%]">
            <User className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-xs font-bold truncate">
              {course.instructor}
              {course.instructors && course.instructors.length > 1
                ? ` + ${toPersianNumbers(course.instructors.length - 1)} مدرس دیگر`
                : ''}
            </span>
            {course.sessions && course.sessions.length > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-black shrink-0 tabular-nums">
                {toPersianNumbers(course.sessions.length)} جلسه
              </span>
            )}
          </div>
        </div>

        {/* Course Details Body */}
        <div className="p-5 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3
              className="text-base font-black text-slate-900 dark:text-white line-clamp-2 leading-relaxed min-h-[46px] group-hover:text-emerald-600 transition-colors flex-1"
              title="کلیک جهت مشاهده مشخصات جامع دوره"
            >
              {course.title}
            </h3>
            {isOfficial && (
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  onOpenDedicatedAdmin(course);
                }}
                className="px-2.5 py-1 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-400 text-[10px] font-black border border-amber-500/30 flex items-center gap-1 shrink-0 transition-transform active:scale-95 whitespace-nowrap cursor-pointer"
                title={`ورود به پنل مدیریت این ${unitNoun}`}
              >
                <Settings className="w-3 h-3" />
                <span>مدیریت {unitNoun}</span>
              </button>
            )}
          </div>

          {isVisible('description') && (
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
              {course.description}
            </p>
          )}

          {/* Target Audiences */}
          {isVisible('targetAudiences') && course.targetAudiences && course.targetAudiences.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
              <span className="text-slate-400 flex items-center gap-1 font-bold">
                <Target className="w-3 h-3 text-sky-500" />
                <span>مخاطبین:</span>
              </span>
              {course.targetAudiences.slice(0, 4).map((aud, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-lg bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20 font-bold"
                >
                  {aud}
                </span>
              ))}
            </div>
          )}

          {/* Key Attributes Tags: Holding Time & Remaining Capacity */}
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-200/60 dark:border-slate-800 font-medium">
            {isVisible('holdingTime') && (
              <div className="flex items-center gap-1.5 truncate">
                <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="truncate">{course.holdingTime || `${toPersianNumbers(course.hours)} ساعت آموزش`}</span>
              </div>
            )}
            {isVisible('capacity') && (
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                <span className={isFull ? 'text-rose-600 font-bold' : 'text-emerald-700 dark:text-emerald-400 font-bold'}>
                  {isFull
                    ? 'ظرفیت تکمیل'
                    : `باقی‌مانده: ${toPersianNumbers(remainingCapacity)} از ${toPersianNumbers(course.capacity)}`}
                </span>
              </div>
            )}
          </div>

          {/* Custom Dynamic Fields Preview */}
          {visibleCustomFields.length > 0 && (
            <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
              {visibleCustomFields.slice(0, 2).map(cf => (
                <div key={cf.id} className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700 truncate">
                  <span className="text-slate-400 font-bold">{cf.label}: </span>
                  <strong className="text-slate-800 dark:text-slate-200">{cf.value}</strong>
                </div>
              ))}
            </div>
          )}

          {/* Value Add Tags */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {isVisible('certificate') && course.hasCertificate && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                <Award className="w-3 h-3" />
                <span>گواهی رسمی</span>
              </span>
            )}
            {isVisible('installments') && course.hasInstallments && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                <CreditCard className="w-3 h-3" />
                <span>پرداخت اقساطی</span>
              </span>
            )}
            {course.customTags && course.customTags.slice(0, 2).map((tag, idx) => (
              <span key={idx} className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20">
                <Sparkles className="w-3 h-3" />
                <span>{tag}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Card Footer Actions */}
      <div
        onClick={e => e.stopPropagation()}
        className="p-4 sm:p-5 pt-3 border-t border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-slate-50/50 dark:bg-slate-900/30"
      >
        {isVisible('price') ? (
          <div>
            <span className="text-[10px] text-slate-400 block font-medium">شهریه ثبت‌نام:</span>
            <span className="text-xs font-black text-slate-900 dark:text-white">
              {course.price > 0 ? `${toPersianNumbers(course.price.toLocaleString('fa-IR'))} تومان` : 'رایگان (ویژه اعضا)'}
            </span>
          </div>
        ) : (
          <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
            مشاهده جزئیات دوره
          </div>
        )}

        <div className="flex items-center gap-1.5">
          {isOfficial ? (
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onOpenDedicatedAdmin(course)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-emerald-700/20 cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-emerald-200" />
              <span>پنل مدیریت {unitNoun}</span>
            </motion.button>
          ) : isRemovedFromClass ? (
            <span className="px-3 py-1.5 rounded-xl bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 text-[11px] font-black">
              لغو عضویت کلاسی (مالی محفوظ)
            </span>
          ) : isEnrolled ? (
            isConfirmed ? (
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onOpenAttendance(course)}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-stone-950 text-xs font-black flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>ورود به کلاس</span>
              </motion.button>
            ) : isPendingReview ? (
              <span className="px-3 py-1.5 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 animate-spin" />
                <span>بررسی فیش</span>
              </span>
            ) : (
              <span className="px-3 py-1.5 rounded-xl bg-rose-500/15 text-rose-600 text-xs font-bold">
                عدم تایید
              </span>
            )
          ) : course.status === 'completed' ? (
            canAccessArchive ? (
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onOpenAttendance(course)}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <PlayCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>آرشیو جلسات</span>
              </motion.button>
            ) : (
              <span className="px-3 py-1.5 rounded-xl bg-stone-500/10 text-stone-400 border border-stone-500/20 text-xs font-medium flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" />
                <span>مخصوص اعضا</span>
              </span>
            )
          ) : (
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onOpenRegistration(course)}
              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-black flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              <span>مشاهده و ثبت‌نام</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </motion.button>
          )}

          {onOpenCourseOps && (
            <button
              type="button"
              onClick={() => onOpenCourseOps(course)}
              className="px-2.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 border border-amber-500/30 text-[11px] font-black flex items-center gap-1 transition-all cursor-pointer"
              title="لیست حضور و غیاب چندجلسه‌ای، لیست انتظار و آپلود/دریافت گواهینامه"
            >
              <Award className="w-3.5 h-3.5" />
              <span>حضور و گواهی</span>
            </button>
          )}

          {isOfficial && (
            <div className="flex items-center gap-1 border-r border-slate-300 dark:border-slate-700 pr-1 mr-0.5">
              <button
                type="button"
                onClick={() => onOpenRoster(course)}
                className="p-2 rounded-xl text-sky-600 hover:text-sky-700 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition-colors cursor-pointer"
                title="لیست شرکت‌کنندگان، مشخصات، شماره تماس و پیامک"
              >
                <Users className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onOpenBuilder(course)}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="ویرایش مشخصات و فیلدهای دوره"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onStartDelete(course)}
                className="p-2 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                title="حذف منطقی دوره (نیازمند تایید پین پیامکی)"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
