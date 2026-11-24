import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Course, CourseEnrollment } from '../../../types';
import { toPersianNumbers } from '../../../utils/persianNumbers';
import {
  X,
  MessageSquare,
  Search,
  Phone,
  Copy,
  Eye,
  Send,
  FileText,
  CheckCheck,
  RefreshCw,
  UserMinus,
  RotateCcw,
} from 'lucide-react';

interface CourseRosterModalProps {
  course: Course | null;
  enrollments: CourseEnrollment[];
  hideNationalId?: boolean;
  onClose: () => void;
  onReviewEnrollment: (enrollmentId: string, status: 'confirmed' | 'rejected', adminNote?: string) => Promise<void>;
  onRemoveFromClass?: (courseId: string, enrollmentId: string, reason?: string) => Promise<void>;
  onRestoreToClass?: (courseId: string, enrollmentId: string) => Promise<void>;
  onSendCourseSms: (courseId: string, recipientPhone: string | 'all', message: string, recipientName?: string) => Promise<{ success: boolean; count: number; message: string }>;
  onInspectReceipt: (enr: CourseEnrollment) => void;
}

export const CourseRosterModal: React.FC<CourseRosterModalProps> = ({
  course,
  enrollments,
  hideNationalId = false,
  onClose,
  onReviewEnrollment,
  onRemoveFromClass,
  onRestoreToClass,
  onSendCourseSms,
  onInspectReceipt,
}) => {
  const [rosterSearch, setRosterSearch] = useState('');
  const [rosterStatusFilter, setRosterStatusFilter] = useState<'all' | 'confirmed' | 'pending_review' | 'rejected'>('all');
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  // SMS Modal State
  const [smsModal, setSmsModal] = useState<{
    course: Course;
    recipient: 'all' | CourseEnrollment;
  } | null>(null);
  const [smsMessage, setSmsMessage] = useState('');
  const [smsTemplateKey, setSmsTemplateKey] = useState<string>('custom');
  const [isSendingSms, setIsSendingSms] = useState(false);
  const [smsFeedback, setSmsFeedback] = useState<string | null>(null);
  const [inlineAction, setInlineAction] = useState<{
    enrollmentId: string;
    userName: string;
    mode: 'reject' | 'note' | 'remove_class';
    currentStatus: CourseEnrollment['paymentStatus'];
    text: string;
  } | null>(null);
  const [savingInlineAction, setSavingInlineAction] = useState(false);

  const courseEnrollmentsList = useMemo(() => {
    if (!course) return [];
    return enrollments.filter(e => e.courseId === course.id);
  }, [course, enrollments]);

  const filteredEnrollments = useMemo(() => {
    return courseEnrollmentsList.filter(e => {
      if (rosterStatusFilter !== 'all' && e.paymentStatus !== rosterStatusFilter) return false;
      if (rosterSearch.trim()) {
        const q = rosterSearch.toLowerCase();
        return (
          e.userName.toLowerCase().includes(q) ||
          e.userPhone.includes(q) ||
          (!hideNationalId && (e.userNationalId || '').includes(q)) ||
          e.trackingCode.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [courseEnrollmentsList, rosterStatusFilter, rosterSearch, hideNationalId]);

  if (!course) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPhone(id);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  const handleOpenSmsModal = (recipient: 'all' | CourseEnrollment) => {
    setSmsModal({ course, recipient });
    setSmsFeedback(null);
    setSmsTemplateKey('custom');
    setSmsMessage('');
  };

  const handleApplySmsTemplate = (key: string) => {
    setSmsTemplateKey(key);
    if (!smsModal) return;
    const courseTitle = smsModal.course.title;
    const recipientName = smsModal.recipient === 'all' ? 'فراگیر گرامی' : smsModal.recipient.userName;

    switch (key) {
      case 'welcome':
        setSmsMessage(`سلام علیکم ${recipientName}؛ ثبت‌نام قطعی شما در دوره تخصصی [${courseTitle}] با موفقیت تایید شد. دسترسی شما به کلاس هم‌اکنون فعال است. مرکز نخبگان فقه و قضا.`);
        break;
      case 'link':
        setSmsMessage(`سلام علیکم ${recipientName}؛ لینک ورود مستقیم به کلاس برخط دوره [${courseTitle}]: ${smsModal.course.meetingLink} - نام کاربری: کد ملی شما. لطفا ۱۰ دقیقه قبل از شروع وارد شوید.`);
        break;
      case 'schedule':
        setSmsMessage(`سلام علیکم ${recipientName}؛ جلسه بعدی دوره [${courseTitle}] در زمان ${smsModal.course.schedule} تشکیل خواهد شد. حضور به موقع مزید امتنان است.`);
        break;
      case 'receipt_fix':
        setSmsMessage(`سلام علیکم ${recipientName}؛ متاسفانه فیش واریزی شما برای دوره [${courseTitle}] دارای نقص یا عدم وضوح است. خواهشمند است به میز کار خود مراجعه و فیش جدید را بارگذاری فرمایید.`);
        break;
      case 'certificate':
        setSmsMessage(`سلام علیکم ${recipientName}؛ گواهی رسمی پایان دوره تخصصی [${courseTitle}] ممهور به تمبر مرکز صادر گردید. جهت دریافت فایل به سامانه مراجعه فرمایید.`);
        break;
      default:
        setSmsMessage('');
        break;
    }
  };

  const handleSendSms = async () => {
    if (!smsModal || !smsMessage.trim()) return;
    try {
      setIsSendingSms(true);
      setSmsFeedback(null);
      const recipientPhone = smsModal.recipient === 'all' ? 'all' : smsModal.recipient.userPhone;
      const recipientName = smsModal.recipient === 'all' ? 'کلیه شرکت‌کنندگان' : smsModal.recipient.userName;

      const res = await onSendCourseSms(smsModal.course.id, recipientPhone, smsMessage.trim(), recipientName);
      setSmsFeedback(res.message);
      setTimeout(() => {
        setSmsModal(null);
      }, 2000);
    } catch {
      setSmsFeedback('خطا در ارسال پیامک. لطفاً اتصال سرور را بررسی فرمایید.');
    } finally {
      setIsSendingSms(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-1 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-hidden" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-t-[26px] sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-right flex flex-col max-h-[92dvh] sm:max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 sm:p-5 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
              <div className="min-w-0">
                <span className="text-[11px] text-emerald-400 font-bold block mb-0.5 truncate">
                  فهرست شرکت‌کنندگان و سامانه پیام‌رسانی دوره
                </span>
                <h3 className="text-sm sm:text-base font-black text-white truncate">{course.title}</h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="بستن"
                className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Action Bar & Stats */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
              {/* Stats */}
              <div className="flex items-center gap-3 font-bold text-slate-600 dark:text-slate-300">
                <span>کل ثبت‌نام‌ها: <strong className="text-slate-900 dark:text-white font-black">{toPersianNumbers(courseEnrollmentsList.length)}</strong> نفر</span>
                <span className="text-emerald-600">قطعی: {toPersianNumbers(courseEnrollmentsList.filter(e => e.paymentStatus === 'confirmed').length)}</span>
                <span className="text-amber-600">در بررسی: {toPersianNumbers(courseEnrollmentsList.filter(e => e.paymentStatus === 'pending_review').length)}</span>
              </div>

              {/* Bulk SMS Button */}
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleOpenSmsModal('all')}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-stone-950 rounded-xl font-black shadow-xs cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>ارسال پیامک گروهی به کلیه شرکت‌کنندگان</span>
                </motion.button>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="p-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={rosterSearch}
                  onChange={e => setRosterSearch(e.target.value)}
                  placeholder={
                    hideNationalId
                      ? 'جستجوی نام شرکت‌کننده، شماره موبایل یا کد رهگیری...'
                      : 'جستجوی نام شرکت‌کننده، کد ملی، شماره موبایل یا کد رهگیری...'
                  }
                  className="w-full pr-8 pl-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <select
                value={rosterStatusFilter}
                onChange={e => setRosterStatusFilter(e.target.value as any)}
                className="px-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="confirmed">فقط تایید شده‌ها</option>
                <option value="pending_review">در نوبت بررسی فیش</option>
                <option value="rejected">رد شده‌ها</option>
              </select>
            </div>

            {/* Participants Roster List */}
            <div className="p-4 overflow-y-auto overscroll-y-contain space-y-2.5 flex-1 min-h-0 divide-y divide-slate-100 dark:divide-slate-800">
              {inlineAction && (
                <div className="p-3 mb-2 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-emerald-500/40 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 text-xs">
                  <span className="font-black text-slate-800 dark:text-slate-100 whitespace-nowrap">
                    {inlineAction.mode === 'reject'
                      ? `علت رد ثبت‌نام ${inlineAction.userName}:`
                      : inlineAction.mode === 'remove_class'
                      ? `علت حذف ${inlineAction.userName} از کلاس (مالی محفوظ):`
                      : `یادداشت مدیر برای ${inlineAction.userName}:`}
                  </span>
                  <input
                    type="text"
                    value={inlineAction.text}
                    onChange={e => setInlineAction({ ...inlineAction, text: e.target.value })}
                    className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                    placeholder={
                      inlineAction.mode === 'reject'
                        ? 'علت رد را بنویسید...'
                        : inlineAction.mode === 'remove_class'
                        ? 'علت حذف از کلاس...'
                        : 'متن یادداشت...'
                    }
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={savingInlineAction || (inlineAction.mode === 'reject' && !inlineAction.text.trim())}
                      onClick={async () => {
                        setSavingInlineAction(true);
                        try {
                          if (inlineAction.mode === 'remove_class' && onRemoveFromClass) {
                            await onRemoveFromClass(course.id, inlineAction.enrollmentId, inlineAction.text.trim() || undefined);
                          } else {
                            const targetStatus =
                              inlineAction.mode === 'reject'
                                ? 'rejected'
                                : inlineAction.currentStatus === 'rejected'
                                ? 'rejected'
                                : 'confirmed';
                            await onReviewEnrollment(inlineAction.enrollmentId, targetStatus, inlineAction.text.trim());
                          }
                          setInlineAction(null);
                        } finally {
                          setSavingInlineAction(false);
                        }
                      }}
                      className={`px-3.5 py-1.5 rounded-xl font-black text-white disabled:opacity-50 cursor-pointer ${
                        inlineAction.mode === 'reject' || inlineAction.mode === 'remove_class'
                          ? 'bg-rose-600 hover:bg-rose-700'
                          : 'bg-emerald-600 hover:bg-emerald-700'
                      }`}
                    >
                      {savingInlineAction
                        ? 'در حال ثبت...'
                        : inlineAction.mode === 'reject'
                        ? 'ثبت رد'
                        : inlineAction.mode === 'remove_class'
                        ? 'تایید حذف از کلاس'
                        : 'ذخیره یادداشت'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setInlineAction(null)}
                      className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
                    >
                      انصراف
                    </button>
                  </div>
                </div>
              )}
              {filteredEnrollments.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  هیچ شرکت‌کننده‌ای با مشخصات جستجو یافت نشد.
                </div>
              ) : (
                filteredEnrollments.map(enr => (
                  <div key={enr.id} className="pt-2.5 first:pt-0 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong className="text-sm font-black text-slate-900 dark:text-white">{enr.userName}</strong>
                        <span className="text-[11px] text-slate-400">({enr.userRoleTitle})</span>
                        {enr.classStatus === 'removed' && (
                          <span className="px-2 py-0.5 rounded-lg bg-rose-500/15 text-rose-600 border border-rose-500/30 text-[10px] font-black">
                            حذف‌شده از کلاس (مالی محفوظ)
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                        {/* Mobile Phone Display with Copy */}
                        <div className="flex items-center gap-1 font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md">
                          <Phone className="w-3 h-3" />
                          <span>{toPersianNumbers(enr.userPhone)}</span>
                          <button
                            onClick={() => handleCopy(enr.userPhone, enr.id)}
                            className="text-slate-400 hover:text-emerald-600 ml-1"
                            title="کپی شماره موبایل"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          {copiedPhone === enr.id && <span className="text-[9px] text-emerald-600 font-sans">کپی شد</span>}
                        </div>

                        {!hideNationalId && enr.userNationalId && (
                          <div className="flex items-center gap-1 font-mono tabular-nums">
                            <span className="text-slate-400">کد ملی:</span>
                            <span>{toPersianNumbers(enr.userNationalId)}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-1 font-mono">
                          <span className="text-slate-400">رهگیری:</span>
                          <span>{toPersianNumbers(enr.trackingCode)}</span>
                        </div>
                      </div>

                      {enr.adminNote && (
                        <div className="text-[11px] text-slate-500 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800 mt-1">
                          <strong>یادداشت مدیر: </strong>{enr.adminNote}
                        </div>
                      )}
                    </div>

                    {/* Status & Actions */}
                    <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
                      <span className={`px-2.5 py-1 rounded-xl text-[11px] font-black border ${
                        enr.paymentStatus === 'confirmed'
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                          : enr.paymentStatus === 'pending_review'
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                          : 'bg-rose-500/15 text-rose-600 border-rose-500/30'
                      }`}>
                        {enr.paymentStatus === 'confirmed' ? 'تایید شده' : enr.paymentStatus === 'pending_review' ? 'در نوبت بررسی' : 'رد شده'}
                      </span>

                      {enr.receiptFileUrl && (
                        <button
                          onClick={() => onInspectReceipt(enr)}
                          className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-emerald-500"
                          title="مشاهده بزرگ فیش واریزی"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => handleOpenSmsModal(enr)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-500/15 text-sky-700 dark:text-sky-300 font-bold hover:bg-sky-500/25 transition-colors"
                        title="ارسال پیامک اختصاصی به این شرکت‌کننده"
                      >
                        <Send className="w-3 h-3" />
                        <span>پیامک</span>
                      </button>

                      {enr.paymentStatus !== 'confirmed' && (
                        <button
                          onClick={() => onReviewEnrollment(enr.id, 'confirmed', 'مدارک و فیش بانکی تایید و ثبت‌نام قطعی شد.')}
                          className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black transition-colors"
                        >
                          تایید
                        </button>
                      )}

                      {enr.paymentStatus !== 'rejected' && enr.classStatus !== 'removed' && (
                        <button
                          onClick={() =>
                            setInlineAction({
                              enrollmentId: enr.id,
                              userName: enr.userName,
                              mode: 'reject',
                              currentStatus: enr.paymentStatus,
                              text: 'نقص در مدارک واریزی',
                            })
                          }
                          className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 text-rose-600 border border-rose-500/30 font-bold hover:bg-rose-500/20 cursor-pointer"
                        >
                          رد
                        </button>
                      )}

                      {onRemoveFromClass && enr.paymentStatus === 'confirmed' && enr.classStatus !== 'removed' && (
                        <button
                          onClick={() =>
                            setInlineAction({
                              enrollmentId: enr.id,
                              userName: enr.userName,
                              mode: 'remove_class',
                              currentStatus: enr.paymentStatus,
                              text: 'حذف از کلاس با حفظ تراکنش‌های مالی',
                            })
                          }
                          className="px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-1 cursor-pointer"
                          title="حذف از کلاس (تراکنش مالی محفوظ می‌ماند)"
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                          <span>حذف از کلاس</span>
                        </button>
                      )}

                      {onRestoreToClass && enr.classStatus === 'removed' && (
                        <button
                          onClick={() => onRestoreToClass(course.id, enr.id)}
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>بازگردانی به کلاس</span>
                        </button>
                      )}

                      <button
                        onClick={() =>
                          setInlineAction({
                            enrollmentId: enr.id,
                            userName: enr.userName,
                            mode: 'note',
                            currentStatus: enr.paymentStatus,
                            text: enr.adminNote || '',
                          })
                        }
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                        title="ویرایش یادداشت مدیر"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      </AnimatePresence>

      {/* Nested SMS Modal */}
      <AnimatePresence>
        {smsModal && (
          <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-1 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-hidden" onClick={() => setSmsModal(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-[26px] sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-right flex flex-col max-h-[92dvh] sm:max-h-[90vh]"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-4 sm:p-5 flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 shrink-0">
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 min-w-0">
                  <MessageSquare className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="truncate">
                    {smsModal.recipient === 'all'
                      ? 'ارسال پیامک گروهی به کلیه شرکت‌کنندگان دوره'
                      : `ارسال پیامک اختصاصی به ${smsModal.recipient.userName}`}
                  </span>
                </h3>
                <button
                  type="button"
                  onClick={() => setSmsModal(null)}
                  aria-label="بستن"
                  className="w-10 h-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 flex items-center justify-center shrink-0 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 sm:p-6 overflow-y-auto overscroll-y-contain flex-1 min-h-0 space-y-4">
                {/* Recipient Details */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">دوره مربوطه:</span>
                    <strong className="text-slate-800 dark:text-slate-200">{smsModal.course.title}</strong>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span className="text-slate-400">گیرنده(ها):</span>
                    <strong className="text-emerald-600 dark:text-emerald-400">
                      {smsModal.recipient === 'all'
                        ? `کلیه شرکت‌کنندگان دوره (${toPersianNumbers(courseEnrollmentsList.length)} شماره همراه)`
                        : `${smsModal.recipient.userName} (${toPersianNumbers(smsModal.recipient.userPhone)})`}
                    </strong>
                  </div>
                </div>

                {/* Templates Dropdown */}
                <div className="space-y-1.5 text-xs">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    انتخاب الگوی آماده پیامک:
                  </label>
                  <select
                    value={smsTemplateKey}
                    onChange={e => handleApplySmsTemplate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                  >
                    <option value="welcome">تایید ثبت‌نام و خوش‌آمدگویی</option>
                    <option value="link">ارسال لینک مستقیم ورود به کلاس آنلاین</option>
                    <option value="schedule">اطلاع‌رسانی زمان برگزاری و شروع جلسه</option>
                    <option value="receipt_fix">یادآوری اصلاح یا بارگذاری مجدد فیش واریزی</option>
                    <option value="certificate">اعلام صدور گواهی رسمی پایان دوره</option>
                    <option value="custom">متن دلخواه و سفارشی</option>
                  </select>
                </div>

                {/* Message Text Area */}
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between items-center text-[11px] text-slate-400">
                    <span>متن پیامک (ارسال از طریق سرشماره رسمی سامانه):</span>
                    <span className="font-mono">{toPersianNumbers(smsMessage.length)} کاراکتر ({toPersianNumbers(Math.ceil(smsMessage.length / 70) || 1)} پیامک)</span>
                  </div>
                  <textarea
                    rows={4}
                    value={smsMessage}
                    onChange={e => setSmsMessage(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="متن پیامک را در این قسمت درج فرمایید..."
                  />
                </div>

                {/* Delivery Feedback */}
                {smsFeedback && (
                  <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{smsFeedback}</span>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-slate-50 dark:bg-slate-950 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setSmsModal(null)}
                  className="px-4 py-2.5 min-h-[42px] rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  disabled={isSendingSms || !smsMessage.trim()}
                  onClick={handleSendSms}
                  className="flex items-center gap-2 px-5 py-2.5 min-h-[42px] rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-black shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSendingSms ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>ارسال پیامک از سرشماره ۳۰۰۰</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
