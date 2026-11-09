import React, { useState, useMemo } from 'react';
import { Course, CourseEnrollment } from '../../../types';
import { toPersianNumbers } from '../../../utils/persianNumbers';
import { ShieldCheck, Eye } from 'lucide-react';

interface CourseAdminPanelTabProps {
  courses: Course[];
  courseEnrollments: CourseEnrollment[];
  onInspectReceipt: (enrollment: CourseEnrollment) => void;
  onReviewEnrollment: (enrollmentId: string, status: 'confirmed' | 'rejected', adminNote?: string) => Promise<void>;
}

export const CourseAdminPanelTab: React.FC<CourseAdminPanelTabProps> = ({
  courses,
  courseEnrollments,
  onInspectReceipt,
  onReviewEnrollment,
}) => {
  const [adminEnrollmentStatusFilter, setAdminEnrollmentStatusFilter] = useState<'all' | 'pending_review' | 'confirmed' | 'rejected'>('all');
  const [adminEnrollmentCourseFilter, setAdminEnrollmentCourseFilter] = useState<string>('all');

  const filteredEnrollments = useMemo(() => {
    return courseEnrollments.filter(e => {
      if (adminEnrollmentStatusFilter !== 'all' && e.paymentStatus !== adminEnrollmentStatusFilter) return false;
      if (adminEnrollmentCourseFilter !== 'all' && e.courseId !== adminEnrollmentCourseFilter) return false;
      return true;
    });
  }, [courseEnrollments, adminEnrollmentStatusFilter, adminEnrollmentCourseFilter]);

  return (
    <div className="glass-card rounded-3xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-xl space-y-6 p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-500" />
            <span>بررسی و تایید ثبت‌نام‌ها و فیش‌های واریزی متقاضیان</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            استعلام شماره پیگیری بانکی، بررسی تصویر پیوست فیش، تایید نهایی دسترسی کلاس و رد مستندات مخدوش
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={adminEnrollmentStatusFilter}
            onChange={e => setAdminEnrollmentStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
          >
            <option value="all">همه وضعیت‌های ثبت‌نام</option>
            <option value="pending_review">در انتظار تایید فیش</option>
            <option value="confirmed">ثبت‌نام قطعی (تایید شده)</option>
            <option value="rejected">رد شده (نقص مدارک)</option>
          </select>

          <select
            value={adminEnrollmentCourseFilter}
            onChange={e => setAdminEnrollmentCourseFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold max-w-[200px] truncate"
          >
            <option value="all">همه دوره‌های آموزشی</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Enrollments Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-right text-xs">
          <thead>
            <tr className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-black border-b border-slate-200 dark:border-slate-700">
              <th className="p-3.5">نام متقاضی و سمت</th>
              <th className="p-3.5">عنوان دوره تخصصی</th>
              <th className="p-3.5">شیوه پرداخت و مبلغ</th>
              <th className="p-3.5">کد رهگیری و تاریخ</th>
              <th className="p-3.5 text-center">پیوست فیش واریز</th>
              <th className="p-3.5 text-center">وضعیت</th>
              <th className="p-3.5 text-center">عملیات بررسی</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {filteredEnrollments.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400">
                  هیچ درخواستی با فیلتر انتخابی یافت نشد.
                </td>
              </tr>
            ) : (
              filteredEnrollments.map(enr => (
                <tr key={enr.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-3.5">
                    <div className="font-bold text-slate-900 dark:text-white">{enr.userName}</div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">{toPersianNumbers(enr.userPhone)} · {enr.userRoleTitle}</div>
                  </td>

                  <td className="p-3.5 font-bold text-slate-800 dark:text-slate-200 max-w-[220px] truncate">
                    {enr.courseTitle}
                  </td>

                  <td className="p-3.5">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      enr.paymentMethod === 'online_gateway'
                        ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400'
                        : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {enr.paymentMethod === 'online_gateway' ? 'درگاه شتاب' : 'فیش بانکی'}
                    </span>
                    <div className="font-black text-slate-900 dark:text-white mt-1">
                      {toPersianNumbers(enr.amountPaid.toLocaleString('fa-IR'))} تومان
                    </div>
                  </td>

                  <td className="p-3.5">
                    <span className="font-mono text-slate-700 dark:text-slate-300 font-bold block">{toPersianNumbers(enr.trackingCode)}</span>
                    <span className="text-[10px] text-slate-400">{toPersianNumbers(enr.enrolledAt.slice(0, 10))}</span>
                  </td>

                  <td className="p-3.5 text-center">
                    {enr.receiptFileUrl ? (
                      <button
                        onClick={() => onInspectReceipt(enr)}
                        className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1 mx-auto transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-emerald-500" />
                        <span>مشاهده فیش</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400">ثبت خودکار شتاب</span>
                    )}
                  </td>

                  <td className="p-3.5 text-center">
                    <span className={`px-2.5 py-1 rounded-xl text-[11px] font-black border ${
                      enr.paymentStatus === 'confirmed'
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                        : enr.paymentStatus === 'pending_review'
                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 animate-pulse'
                        : 'bg-rose-500/15 text-rose-600 border-rose-500/30'
                    }`}>
                      {enr.paymentStatus === 'confirmed' ? 'ثبت‌نام قطعی' : enr.paymentStatus === 'pending_review' ? 'در حال بررسی' : 'رد شده'}
                    </span>
                  </td>

                  <td className="p-3.5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {enr.paymentStatus !== 'confirmed' && (
                        <button
                          onClick={() => onReviewEnrollment(enr.id, 'confirmed', 'مدارک و فیش بانکی با موفقیت تایید و ثبت‌نام نهایی شد.')}
                          className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-xs shadow-xs transition-colors cursor-pointer"
                        >
                          تایید مستندات
                        </button>
                      )}
                      {enr.paymentStatus !== 'rejected' && (
                        <button
                          onClick={() => {
                            const reason = prompt('لطفاً دلیل عدم تایید یا نقص فیش را بنویسید:', 'شماره پیگیری فیش در صورتحساب مرکز مشاهده نشد.');
                            if (reason) onReviewEnrollment(enr.id, 'rejected', reason);
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 border border-rose-500/30 font-bold text-xs transition-colors cursor-pointer"
                        >
                          رد
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
