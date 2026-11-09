import React from 'react';
import { motion } from 'motion/react';
import { Course, CourseEnrollment } from '../../../types';
import { toPersianNumbers } from '../../../utils/persianNumbers';
import {
  ZoomIn,
  GraduationCap,
  User,
  Settings,
  CreditCard,
  Clock,
  Calendar,
  Award,
  Sparkles,
  CheckCircle2,
  PlayCircle,
  Lock,
  ChevronLeft,
  Users,
  SlidersHorizontal,
  Trash2
} from 'lucide-react';

interface CourseCardProps {
  course: Course;
  userEnrollment?: CourseEnrollment;
  isOfficial: boolean;
  onOpenRegistration: (course: Course) => void;
  onOpenAttendance: (course: Course) => void;
  onOpenDedicatedAdmin: (course: Course) => void;
  onOpenRoster: (course: Course) => void;
  onOpenBuilder: (course: Course) => void;
  onStartDelete: (course: Course) => void;
  onImageClick: (img: { url: string; title: string; subtitle?: string }) => void;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  userEnrollment,
  isOfficial,
  onOpenRegistration,
  onOpenAttendance,
  onOpenDedicatedAdmin,
  onOpenRoster,
  onOpenBuilder,
  onStartDelete,
  onImageClick,
}) => {
  const isEnrolled = Boolean(course.isEnrolled || userEnrollment);
  const enrollmentStatus = userEnrollment?.paymentStatus || course.enrollmentStatus || (course.isEnrolled ? 'confirmed' : undefined);
  const isConfirmed = enrollmentStatus === 'confirmed';
  const isPendingReview = enrollmentStatus === 'pending_review';
  const canAccessArchive = course.archiveAccess === 'all' || isOfficial || isConfirmed;
  const allowedMethod = course.allowedPaymentMethod || 'both';

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      className="glass-card rounded-3xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col justify-between shadow-lg group transition-all"
    >
      <div>
        {/* Course Banner Image with Lightbox Click Feature */}
        <div
          onClick={() => {
            if (course.coverImage) {
              onImageClick({
                url: course.coverImage,
                title: course.title,
                subtitle: `مدرس: ${course.instructor} · مدت: ${toPersianNumbers(course.hours)} ساعت`,
              });
            }
          }}
          className="relative h-44 w-full bg-slate-900 overflow-hidden cursor-pointer group/img"
          title="جهت مشاهده تصویر در ابعاد کامل و بزرگ کلیک کنید"
        >
          {course.coverImage ? (
            <>
              <img
                src={course.coverImage}
                alt={course.title}
                className="w-full h-full object-cover group-hover/img:scale-108 transition-transform duration-500 opacity-85"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white">
                <ZoomIn className="w-6 h-6 text-emerald-400 drop-shadow" />
                <span className="text-xs font-bold bg-black/60 px-2.5 py-1 rounded-xl backdrop-blur-sm">
                  مشاهده تصویر کامل
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
            ) : (
              <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-emerald-500 text-stone-950">
                در حال پذیرش
              </span>
            )}
          </div>

          {/* Instructor Avatar Badge */}
          <div className="absolute bottom-3 right-3 flex items-center gap-2 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/10 text-white pointer-events-none">
            <User className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-bold truncate max-w-[200px]">{course.instructor}</span>
          </div>
        </div>

        {/* Course Details Body */}
        <div className="p-5 space-y-3.5">
          <div className="flex items-start justify-between gap-2">
            <h3
              onClick={() => {
                if (isOfficial) {
                  onOpenDedicatedAdmin(course);
                } else {
                  onOpenRegistration(course);
                }
              }}
              className="text-base font-black text-slate-900 dark:text-white line-clamp-2 leading-relaxed min-h-[48px] cursor-pointer hover:text-emerald-600 transition-colors flex-1"
              title={isOfficial ? "کلیک جهت ورود به پنل مدیریت ویژه این دوره (ثبت‌نامی‌ها، پرداخت‌ها و تنظیم محتوا)" : "کلیک جهت مشاهده کامل توضیحات و ثبت‌نام"}
            >
              {course.title}
            </h3>
            {isOfficial && (
              <button
                onClick={() => onOpenDedicatedAdmin(course)}
                className="px-2.5 py-1 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-400 text-[10px] font-black border border-amber-500/30 flex items-center gap-1 shrink-0 transition-transform active:scale-95"
                title="ورود به پنل مدیریت این دوره"
              >
                <Settings className="w-3 h-3" />
                <span>مدیریت دوره</span>
              </button>
            )}
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
            {course.description}
          </p>

          {/* Payment Policy Indicator Tag */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
            <CreditCard className="w-4 h-4 text-emerald-500" />
            <span className="text-slate-400">شیوه پرداخت مجاز:</span>
            <strong className="font-bold text-slate-800 dark:text-slate-200">
              {allowedMethod === 'both' ? 'درگاه شتاب و فیش بانکی' : allowedMethod === 'gateway_only' ? 'فقط درگاه الکترونیک شتاب' : 'فقط ارسال فیش بانکی'}
            </strong>
          </div>

          {/* Key Attributes Tags */}
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-200/60 dark:border-slate-800 font-medium">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>{toPersianNumbers(course.hours)} ساعت آموزش</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-sky-500" />
              <span>ظرفیت: {toPersianNumbers(course.enrolledCount)} از {toPersianNumbers(course.capacity)}</span>
            </div>
          </div>

          {/* Value Add Tags (Certificate, Installments & Custom Tags) */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {course.hasCertificate && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                <Award className="w-3.5 h-3.5" />
                <span>گواهی رسمی</span>
              </span>
            )}
            {course.hasInstallments && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                <CreditCard className="w-3.5 h-3.5" />
                <span>اقساطی</span>
              </span>
            )}
            {course.customTags && course.customTags.map((tag, idx) => (
              <span key={idx} className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{tag}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="p-5 pt-3 border-t border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-slate-50/50 dark:bg-slate-900/30">
        <div>
          <span className="text-[10px] text-slate-400 block font-medium">شهریه ثبت‌نام:</span>
          <span className="text-xs font-black text-slate-900 dark:text-white">
            {course.price > 0 ? `${toPersianNumbers(course.price.toLocaleString('fa-IR'))} تومان` : 'رایگان (ویژه اعضا)'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {isOfficial ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onOpenDedicatedAdmin(course)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-emerald-700/20 cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-emerald-200" />
              <span>پنل مدیریت دوره</span>
            </motion.button>
          ) : (
            isEnrolled ? (
              isConfirmed ? (
                <motion.button
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
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onOpenRegistration(course)}
                className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-black flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                <span>مشاهده و ثبت‌نام</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </motion.button>
            )
          )}

          {isOfficial && (
            <div className="flex items-center gap-1 border-r border-slate-300 dark:border-slate-700 pr-1 mr-0.5">
              <button
                onClick={() => onOpenRoster(course)}
                className="p-2 rounded-xl text-sky-600 hover:text-sky-700 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition-colors"
                title="لیست شرکت‌کنندگان، مشخصات، شماره تماس و پیامک"
              >
                <Users className="w-4 h-4" />
              </button>

              <button
                onClick={() => onOpenBuilder(course)}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                title="ویرایش مشخصات دوره"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>

              <button
                onClick={() => onStartDelete(course)}
                className="p-2 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
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
