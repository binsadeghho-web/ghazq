import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Course, CourseEnrollment, User } from '../../../types';
import { api } from '../../../services/apiClient';
import { toPersianNumbers } from '../../../utils/persianNumbers';
import {
  X,
  CheckCircle2,
  ClipboardCheck,
  Award,
  Clock,
  Printer,
  ToggleLeft,
  ToggleRight,
  Users,
  Check,
  UserPlus,
  Sparkles,
  Calendar,
} from 'lucide-react';

interface CourseAttendanceWaitlistCertModalProps {
  course: Course | null;
  currentUser: User | null;
  enrollments: CourseEnrollment[];
  isOfficial: boolean;
  onClose: () => void;
}

export const CourseAttendanceWaitlistCertModal: React.FC<CourseAttendanceWaitlistCertModalProps> = ({
  course,
  currentUser,
  enrollments,
  isOfficial,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'attendance' | 'waitlist' | 'certificates'>('attendance');
  const [sessionsCount, setSessionsCount] = useState<number>(Number((course as any)?.sessionsCount) || 5);
  const [waitlistEnabled, setWaitlistEnabled] = useState<boolean>(
    (course as any)?.waitlistEnabled !== undefined ? Boolean((course as any).waitlistEnabled) : true
  );
  const [selectedSession, setSelectedSession] = useState<number>(1);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [waitlistItems, setWaitlistItems] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [printingCert, setPrintingCert] = useState<any | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadCourseOpsData = useCallback(async () => {
    if (!course) return;
    setLoading(true);
    try {
      const [att, wl, certs] = await Promise.all([
        api.getCourseAttendance(course.id),
        api.getCourseWaitlist(course.id),
        api.getCourseCertificates(course.id),
      ]);
      if (Array.isArray(att)) setAttendanceRecords(att);
      if (Array.isArray(wl)) setWaitlistItems(wl);
      if (Array.isArray(certs)) setCertificates(certs);
    } catch {
      // handled gracefully
    } finally {
      setLoading(false);
    }
  }, [course]);

  useEffect(() => {
    if (course) {
      setSessionsCount(Number((course as any)?.sessionsCount) || 5);
      setWaitlistEnabled(
        (course as any)?.waitlistEnabled !== undefined ? Boolean((course as any).waitlistEnabled) : true
      );
      setSelectedSession(1);
      loadCourseOpsData();
    }
  }, [course, loadCourseOpsData]);

  useEffect(() => {
    if (!course) return;
    const unsub = api.subscribeToEvents(ev => {
      if (
        ev.type.startsWith('courses.attendance') ||
        ev.type.startsWith('courses.waitlist') ||
        ev.type.startsWith('courses.certificate') ||
        ev.type === 'courses.updated'
      ) {
        loadCourseOpsData();
      }
    });
    return () => unsub();
  }, [course, loadCourseOpsData]);

  if (!course) return null;

  const courseEnrollments = enrollments.filter(e => e.courseId === course.id);

  const handleSaveOpsConfig = async (newSessionsCount: number, newWaitlistEnabled: boolean) => {
    try {
      await api.updateCourseOpsConfig(course.id, {
        sessionsCount: newSessionsCount,
        waitlistEnabled: newWaitlistEnabled,
        expectedVersion: (course as any).version || 1,
      });
      setSessionsCount(newSessionsCount);
      setWaitlistEnabled(newWaitlistEnabled);
      if (selectedSession > newSessionsCount) {
        setSelectedSession(1);
      }
      showToast('پیکربندی جلسات حضور و غیاب و وضعیت لیست انتظار ذخیره شد.');
    } catch (err: any) {
      showToast(`خطا: ${err.message || 'عدم ذخیره تنظیمات'}`);
    }
  };

  const handleSetAttendance = async (
    participant: { userId: string; userName: string },
    sessionNum: number,
    status: 'present' | 'absent' | 'excused'
  ) => {
    try {
      await api.recordCourseAttendance(course.id, {
        userId: participant.userId,
        userName: participant.userName,
        sessionNumber: sessionNum,
        sessionTitle: `جلسه ${toPersianNumbers(sessionNum)}`,
        status,
      });
      await loadCourseOpsData();
      showToast(`وضعیت حضور «${participant.userName}» در جلسه ${toPersianNumbers(sessionNum)} ثبت گردید.`);
    } catch (err: any) {
      showToast(`خطا در ثبت حضور و غیاب: ${err.message}`);
    }
  };

  const handleJoinWaitlist = async () => {
    try {
      await api.joinCourseWaitlist(course.id);
      await loadCourseOpsData();
      showToast('نام شما با موفقیت در لیست انتظار این دوره ثبت شد.');
    } catch (err: any) {
      showToast(`خطا در ثبت لیست انتظار: ${err.message}`);
    }
  };

  const handleUpdateWaitlistStatus = async (waitlistId: string, status: 'waiting' | 'invited' | 'enrolled' | 'cancelled') => {
    try {
      await api.updateCourseWaitlistStatus(course.id, waitlistId, status);
      await loadCourseOpsData();
      showToast('وضعیت متقاضی در لیست انتظار به‌روزرسانی شد.');
    } catch (err: any) {
      showToast(`خطا: ${err.message}`);
    }
  };

  const handleIssueCertificate = async (participant: { userId: string; userName: string; nationalId?: string }) => {
    try {
      await api.issueCourseCertificate(course.id, {
        userId: participant.userId,
        userName: participant.userName,
        userNationalId: participant.nationalId || '',
        courseTitle: course.title,
        instructorName: course.instructor,
        hours: course.hours,
        gradeText: 'عالی (احراز کامل ساعت آموزشی)',
      });
      await loadCourseOpsData();
      showToast(`گواهینامه رسمی دوره برای «${participant.userName}» صادر گردید.`);
    } catch (err: any) {
      showToast(`خطا در صدور گواهینامه: ${err.message}`);
    }
  };

  const myWaitlistEntry = waitlistItems.find(w => w.userId === currentUser?.id);
  const visibleCertificates = isOfficial
    ? certificates
    : certificates.filter(c => c.userId === currentUser?.id);

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
        dir="rtl"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-right text-slate-900 dark:text-slate-100 flex flex-col max-h-[88vh]"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-5 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-emerald-400 font-bold block mb-0.5">
                سامانه حضور و غیاب چندجلسه‌ای، لیست انتظار و صدور گواهینامه رسمی
              </span>
              <h3 className="text-base font-black text-white">{course.title}</h3>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {toastMsg && (
            <div className="mx-6 mt-4 p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{toastMsg}</span>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="px-6 pt-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto bg-slate-50 dark:bg-slate-950/50">
            <button
              onClick={() => setActiveTab('attendance')}
              className={`px-4 py-2.5 rounded-t-2xl text-xs font-black flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'attendance'
                  ? 'border-emerald-500 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>لیست حضور و غیاب ({toPersianNumbers(sessionsCount)} جلسه)</span>
            </button>

            <button
              onClick={() => setActiveTab('waitlist')}
              className={`px-4 py-2.5 rounded-t-2xl text-xs font-black flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'waitlist'
                  ? 'border-amber-500 text-amber-700 dark:text-amber-400 bg-white dark:bg-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>
                لیست انتظار ({toPersianNumbers(waitlistItems.length)} نفر) —{' '}
                {waitlistEnabled ? 'فعال' : 'غیرفعال'}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('certificates')}
              className={`px-4 py-2.5 rounded-t-2xl text-xs font-black flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'certificates'
                  ? 'border-indigo-500 text-indigo-700 dark:text-indigo-400 bg-white dark:bg-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>صدور و دریافت گواهینامه ({toPersianNumbers(visibleCertificates.length)})</span>
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto flex-1 space-y-5">
            {loading && (
              <div className="text-xs text-slate-400 text-center py-2">در حال بارگذاری اطلاعات...</div>
            )}

            {/* TAB 1: MULTI-SESSION ATTENDANCE */}
            {activeTab === 'attendance' && (
              <div className="space-y-5">
                {/* Admin Session Builder Bar */}
                {isOfficial && (
                  <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-black text-slate-900 dark:text-white block">
                        تنظیم تعداد جلسات دوره جهت ساخت خودکار لیست حضور و غیاب:
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        تعداد جلسات دوره (مثلاً ۱ جلسه، ۵ جلسه، ۱۰ جلسه و...) را انتخاب یا وارد نمایید:
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {[1, 3, 5, 8, 10, 12, 16].map(num => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => handleSaveOpsConfig(num, waitlistEnabled)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                            sessionsCount === num
                              ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {toPersianNumbers(num)} جلسه
                        </button>
                      ))}
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={sessionsCount}
                        onChange={e => {
                          const val = Math.max(1, Math.min(50, Number(e.target.value) || 1));
                          setSessionsCount(val);
                        }}
                        onBlur={() => handleSaveOpsConfig(sessionsCount, waitlistEnabled)}
                        className="w-16 px-2 py-1.5 rounded-xl text-xs font-mono font-bold text-center border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                        title="تعداد دلخواه جلسات"
                      />
                    </div>
                  </div>
                )}

                {/* Session Selector Pills (Session 1 .. N) */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400 block">
                    انتخاب جلسه جهت مشاهده یا ثبت حضور و غیاب:
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {Array.from({ length: sessionsCount }, (_, idx) => idx + 1).map(sessNum => (
                      <button
                        key={sessNum}
                        type="button"
                        onClick={() => setSelectedSession(sessNum)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                          selectedSession === sessNum
                            ? 'bg-slate-900 dark:bg-emerald-500 text-white dark:text-stone-950 shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>جلسه {toPersianNumbers(sessNum)}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Attendance Roster Table for Selected Session */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-black border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="p-3.5">نام شرکت‌کننده</th>
                        <th className="p-3.5">وضعیت در جلسه {toPersianNumbers(selectedSession)}</th>
                        <th className="p-3.5">مجموع حضور در کل جلسات</th>
                        {isOfficial && <th className="p-3.5 text-center">ثبت وضعیت توسط ادمین</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
                      {(isOfficial
                        ? courseEnrollments
                        : courseEnrollments.filter(e => e.userId === currentUser?.id)
                      ).length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-slate-400">
                            هنوز شرکت‌کننده‌ای در این دوره ثبت‌نام نکرده است.
                          </td>
                        </tr>
                      ) : (
                        (isOfficial
                          ? courseEnrollments
                          : courseEnrollments.filter(e => e.userId === currentUser?.id)
                        ).map(enr => {
                          const rec = attendanceRecords.find(
                            a => a.userId === enr.userId && Number(a.sessionNumber) === selectedSession
                          );
                          const totalPresent = attendanceRecords.filter(
                            a => a.userId === enr.userId && a.status === 'present'
                          ).length;
                          const currentStatus = rec?.status || 'unrecorded';

                          return (
                            <tr key={enr.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                              <td className="p-3.5 font-extrabold text-slate-900 dark:text-white">
                                {enr.userName}
                              </td>
                              <td className="p-3.5">
                                {currentStatus === 'present' && (
                                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-black">
                                    حاضر در جلسه
                                  </span>
                                )}
                                {currentStatus === 'absent' && (
                                  <span className="px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-700 dark:text-rose-300 font-black">
                                    غایب
                                  </span>
                                )}
                                {currentStatus === 'excused' && (
                                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 font-black">
                                    غیبت موجه (مرخصی)
                                  </span>
                                )}
                                {currentStatus === 'unrecorded' && (
                                  <span className="text-slate-400">ثبت نشده</span>
                                )}
                              </td>
                              <td className="p-3.5 font-mono font-bold text-slate-600 dark:text-slate-300">
                                {toPersianNumbers(totalPresent)} از {toPersianNumbers(sessionsCount)} جلسه
                              </td>
                              {isOfficial && (
                                <td className="p-3.5 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleSetAttendance(
                                          { userId: enr.userId, userName: enr.userName },
                                          selectedSession,
                                          'present'
                                        )
                                      }
                                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                                        currentStatus === 'present'
                                          ? 'bg-emerald-600 text-white'
                                          : 'bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20'
                                      }`}
                                    >
                                      حاضر
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleSetAttendance(
                                          { userId: enr.userId, userName: enr.userName },
                                          selectedSession,
                                          'excused'
                                        )
                                      }
                                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                                        currentStatus === 'excused'
                                          ? 'bg-amber-600 text-white'
                                          : 'bg-amber-500/10 text-amber-700 hover:bg-amber-500/20'
                                      }`}
                                    >
                                      موجه
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleSetAttendance(
                                          { userId: enr.userId, userName: enr.userName },
                                          selectedSession,
                                          'absent'
                                        )
                                      }
                                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                                        currentStatus === 'absent'
                                          ? 'bg-rose-600 text-white'
                                          : 'bg-rose-500/10 text-rose-700 hover:bg-rose-500/20'
                                      }`}
                                    >
                                      غایب
                                    </button>
                                  </div>
                                </td>
                              )}
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2: TOGGLEABLE WAITLIST */}
            {activeTab === 'waitlist' && (
              <div className="space-y-5">
                {isOfficial && (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-black text-slate-900 dark:text-white block">
                        وضعیت فعال‌سازی لیست انتظار برای این دوره:
                      </span>
                      <span className="text-[11px] text-slate-600 dark:text-slate-300">
                        در صورت فعال بودن، متقاضیان پس از تکمیل ظرفیت دوره می‌توانند در نوبت رزرو قرار گیرند.
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSaveOpsConfig(sessionsCount, !waitlistEnabled)}
                      className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
                        waitlistEnabled
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {waitlistEnabled ? (
                        <>
                          <ToggleRight className="w-4 h-4" />
                          <span>لیست انتظار فعال است</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-4 h-4" />
                          <span>لیست انتظار غیرفعال است</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {!isOfficial && (
                  <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-black text-slate-900 dark:text-white block">
                        ثبت‌نام در لیست انتظار دوره
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {waitlistEnabled
                          ? 'در صورت تکمیل ظرفیت، با ثبت نام در لیست انتظار به محض افزایش ظرفیت مطلع خواهید شد.'
                          : 'لیست انتظار برای این دوره توسط مدیر سامانه غیرفعال شده است.'}
                      </span>
                    </div>

                    {waitlistEnabled && !myWaitlistEntry && (
                      <button
                        type="button"
                        onClick={handleJoinWaitlist}
                        className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-black flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>ثبت در لیست انتظار</span>
                      </button>
                    )}

                    {myWaitlistEntry && (
                      <span className="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-black">
                        شما در لیست انتظار قرار دارید ({myWaitlistEntry.status === 'invited' ? 'دعوت به ثبت‌نام' : 'در نوبت'})
                      </span>
                    )}
                  </div>
                )}

                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-black border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="p-3.5">ردیف نوبت</th>
                        <th className="p-3.5">نام متقاضی</th>
                        <th className="p-3.5">تلفن تماس</th>
                        <th className="p-3.5">وضعیت</th>
                        {isOfficial && <th className="p-3.5 text-center">مدیریت نوبت</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
                      {waitlistItems.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-400">
                            لیست انتظار این دوره خالی است.
                          </td>
                        </tr>
                      ) : (
                        waitlistItems.map((item, idx) => (
                          <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="p-3.5 font-mono font-black">
                              نوبت {toPersianNumbers(idx + 1)}
                            </td>
                            <td className="p-3.5 font-bold">{item.userName}</td>
                            <td className="p-3.5 font-mono">{toPersianNumbers(item.userPhone || '---')}</td>
                            <td className="p-3.5">
                              <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold">
                                {item.status === 'invited'
                                  ? 'دعوت شده به ثبت‌نام'
                                  : item.status === 'enrolled'
                                  ? 'ثبت‌نام قطعی شد'
                                  : item.status === 'cancelled'
                                  ? 'انصراف'
                                  : 'در نوبت انتظار'}
                              </span>
                            </td>
                            {isOfficial && (
                              <td className="p-3.5 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateWaitlistStatus(item.id, 'invited')}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-bold cursor-pointer"
                                  >
                                    فراخوان ثبت‌نام
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateWaitlistStatus(item.id, 'cancelled')}
                                    className="px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-700 text-[11px] font-bold cursor-pointer"
                                  >
                                    حذف
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: OFFICIAL CERTIFICATE ISSUANCE */}
            {activeTab === 'certificates' && (
              <div className="space-y-5">
                {isOfficial && (
                  <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-3">
                    <span className="text-xs font-black text-indigo-900 dark:text-indigo-200 block">
                      صدور گواهینامه پایان دوره برای شرکت‌کنندگان تاییدشده:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {courseEnrollments.map(enr => {
                        const alreadyIssued = certificates.some(c => c.userId === enr.userId);
                        return (
                          <button
                            key={enr.id}
                            type="button"
                            onClick={() =>
                              handleIssueCertificate({
                                userId: enr.userId,
                                userName: enr.userName,
                                nationalId: enr.userNationalId,
                              })
                            }
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border cursor-pointer transition-all ${
                              alreadyIssued
                                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                                : 'bg-white dark:bg-slate-900 border-indigo-500/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500 hover:text-white'
                            }`}
                          >
                            <Award className="w-3.5 h-3.5" />
                            <span>
                              {alreadyIssued ? `به‌روزرسانی گواهی: ${enr.userName}` : `صدور گواهی: ${enr.userName}`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {visibleCertificates.length === 0 ? (
                  <div className="p-10 text-center text-xs text-slate-400 border border-slate-200 dark:border-slate-800 rounded-2xl">
                    هنوز گواهینامه‌ای در این دوره صادر نشده است.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {visibleCertificates.map(cert => (
                      <div
                        key={cert.id}
                        className="p-6 rounded-3xl bg-gradient-to-br from-amber-50/90 via-white to-emerald-50/70 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/30 border-2 border-amber-500/40 shadow-md space-y-4"
                      >
                        <div className="flex items-start justify-between gap-4 border-b border-amber-500/20 pb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center font-black">
                              <Award className="w-6 h-6" />
                            </div>
                            <div>
                              <span className="text-[11px] font-black text-amber-800 dark:text-amber-400 block">
                                گواهینامه رسمی پایان دوره تخصصی مرکز فقه و قضا
                              </span>
                              <h4 className="text-sm font-black text-slate-900 dark:text-white">
                                {cert.courseTitle}
                              </h4>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setPrintingCert(cert);
                              setTimeout(() => window.print(), 150);
                            }}
                            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5 text-amber-400" />
                            <span>چاپ گواهینامه رسمی</span>
                          </button>
                        </div>

                        <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-200">
                          بدین‌وسیله گواهی می‌شود جناب آقای / سرکار خانم{' '}
                          <strong className="font-black text-slate-900 dark:text-white">
                            {cert.userName}
                          </strong>{' '}
                          دوره آموزشی تخصصی «<strong>{cert.courseTitle}</strong>» به مدت{' '}
                          <strong>{toPersianNumbers(cert.hours)} ساعت</strong> زیر نظر استاد{' '}
                          <strong>{cert.instructorName}</strong> را با درجه ارزشیابی{' '}
                          <strong className="text-emerald-700 dark:text-emerald-400">
                            {cert.gradeText}
                          </strong>{' '}
                          با موفقیت به پایان رسانده است.
                        </p>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-amber-500/20 text-[11px] text-slate-500 font-mono">
                          <span>شماره ثبت و استعلام گواهینامه: {cert.certificateNumber}</span>
                          <span>تاریخ صدور: {toPersianNumbers(cert.issuedDate)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
