import React from 'react';
import { Course, CourseEnrollment } from '../../../types';
import { toPersianNumbers } from '../../../utils/persianNumbers';
import {
  Archive,
  CheckCircle2,
  Users,
  RotateCcw
} from 'lucide-react';

interface CourseDeletedTabProps {
  deletedCourses: Course[];
  courseEnrollments: CourseEnrollment[];
  onSelectCourseRoster: (course: Course) => void;
  onRestoreCourse: (course: Course) => Promise<void>;
  onImageClick: (img: { url: string; title: string }) => void;
}

export const CourseDeletedTab: React.FC<CourseDeletedTabProps> = ({
  deletedCourses,
  courseEnrollments,
  onSelectCourseRoster,
  onRestoreCourse,
  onImageClick,
}) => {
  return (
    <div className="glass-card rounded-3xl border border-rose-500/20 dark:border-rose-500/10 overflow-hidden shadow-xl p-6 space-y-5 bg-rose-500/5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-rose-500/20">
        <div>
          <h2 className="text-base sm:text-lg font-black text-rose-700 dark:text-rose-400 flex items-center gap-2">
            <Archive className="w-5 h-5 text-rose-500" />
            <span>دوره‌های حذف‌شده منطقی (بایگانی امن - Safe Deleted)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            این دوره‌ها به واسطه تایید دوعاملی پین کد امنیتی از دید عموم خارج شده‌اند، اما کلیه اطلاعات ثبت‌نامی‌ها، فیش‌ها و سوابق مالی به طور ماندگار حفظ شده است.
          </p>
        </div>
        <span className="px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-bold">
          تعداد: {toPersianNumbers(deletedCourses.length)} دوره بایگانی‌شده
        </span>
      </div>

      {deletedCourses.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-400 space-y-2">
          <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500/40" />
          <p className="font-bold text-slate-600 dark:text-slate-300">هیچ دوره‌ای در وضعیت حذف منطقی وجود ندارد.</p>
          <p>تمام دوره‌های تعریف‌شده در وضعیت عادی و فعال قرار دارند.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {deletedCourses.map(delCourse => {
            const totalCourseEnrollments = courseEnrollments.filter(e => e.courseId === delCourse.id);
            return (
              <div
                key={delCourse.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-rose-300/40 dark:border-rose-900/40 shadow-md space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 border border-rose-500/20">
                      حذف منطقی شده
                    </span>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white mt-1.5">
                      {delCourse.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      استاد: {delCourse.instructor} · رده: {delCourse.category}
                    </p>
                  </div>

                  {delCourse.coverImage && (
                    <img
                      src={delCourse.coverImage}
                      alt={delCourse.title}
                      className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-800 cursor-pointer"
                      onClick={() => onImageClick({ url: delCourse.coverImage!, title: delCourse.title })}
                    />
                  )}
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-[11px] space-y-1">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span>تاریخ حذف منطقی:</span>
                    <strong className="font-mono">{delCourse.deletedAt ? toPersianNumbers(new Date(delCourse.deletedAt).toLocaleString('fa-IR')) : 'ثبت شده'}</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span>حذف‌کننده با پین امنیتی:</span>
                    <strong>{delCourse.deletedBy || 'مدیر سیستم'}</strong>
                  </div>
                  <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                    <span>شرکت‌کنندگان و سوابق مالی ماندگار:</span>
                    <span>{toPersianNumbers(totalCourseEnrollments.length)} ثبت‌نام محفوظ</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => onSelectCourseRoster(delCourse)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>مشاهده سوابق ثبت‌نامی‌ها</span>
                  </button>

                  <button
                    onClick={() => onRestoreCourse(delCourse)}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-black flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>بازگردانی دوره به سامانه</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
