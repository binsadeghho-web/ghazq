import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Users,
  Settings,
  CreditCard,
  MessageSquare,
  Radio,
  Download,
  UploadCloud,
  CheckCircle2,
  Clock,
  Eye,
  Phone,
  Copy,
  Send,
  Save,
  SlidersHorizontal,
  Image as ImageIcon,
  ExternalLink,
  Plus,
  Trash2,
  FileText,
  Calendar,
  Sparkles,
  Search,
  Check
} from 'lucide-react';
import { Course, CourseEnrollment } from '../../types';
import { toPersianNumbers } from '../../utils/persianNumbers';
import { useApp } from '../../context/AppContext';
import { apiClient } from '../../services/apiClient';

interface CourseAdminPanelModalProps {
  course: Course;
  onClose: () => void;
  onOpenSmsModal: (course: Course, recipient: 'all' | CourseEnrollment) => void;
  onInspectReceipt: (enrollment: CourseEnrollment) => void;
  onOpenBuilder: (course: Course) => void;
}

export const CourseAdminPanelModal: React.FC<CourseAdminPanelModalProps> = ({
  course,
  onClose,
  onOpenSmsModal,
  onInspectReceipt,
  onOpenBuilder
}) => {
  const { courseEnrollments, reviewCourseEnrollment, updateCourse } = useApp();

  // Active Tab: 'roster' | 'post_enrollment' | 'course_info'
  const [activeTab, setActiveTab] = useState<'roster' | 'post_enrollment' | 'course_info'>('roster');

  // Search & Filter within this course's enrollments
  const [rosterSearch, setRosterSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'pending_review' | 'rejected'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form State for Post-Enrollment Page Settings
  const [isSavingPostContent, setIsSavingPostContent] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  const [postBanner, setPostBanner] = useState(course.postEnrollmentBanner || course.coverImage || '');
  const [postMessage, setPostMessage] = useState(
    course.postEnrollmentMessage ||
    `ضمن تشکر از ثبت‌نام شما در دوره تخصصی «${course.title}»، جلسه با موضوع «${course.topics?.[0] || 'مباحث پیشرفته فقه و قضا'}» طبق برنامه اعلامی برگزار خواهد شد. لطفاً پیش از موعد، نرم‌افزارهای مورد نیاز را آماده فرمایید.`
  );
  const [welcomeFontSize, setWelcomeFontSize] = useState<'sm' | 'base' | 'lg' | 'xl'>(course.welcomeBoxFontSize || 'base');
  const [welcomeBgColor, setWelcomeBgColor] = useState<'emerald' | 'amber' | 'slate' | 'indigo' | 'rose'>(course.welcomeBoxBgColor || 'emerald');

  const [reminderDate, setReminderDate] = useState(course.reminderDate || course.startDate || '۱۴۰۳/۰۹/۰۱');
  const [reminderSchedule, setReminderSchedule] = useState(course.reminderSchedule || course.schedule || 'پنج‌شنبه‌ها از ساعت ۰۹:۰۰ الی ۱۲:۰۰');
  const [onlineMeetingLink, setOnlineMeetingLink] = useState(course.meetingLink || 'https://lms.feqh-ghaza.ir/room/online');
  const [accessGuide, setAccessGuide] = useState(course.meetingAccessGuide || 'نام کاربری کد ملی و کلمه عبور شماره همراه بدون صفر.');

  // Offline Courses Specific Settings
  const [offlineUrl, setOfflineUrl] = useState(course.offlineDownloadUrl || '');
  const [offlineGuide, setOfflineGuide] = useState(course.offlineDownloadGuide || 'فایل‌های فشرده جلسات شامل ویدیوها و اسلایدهای آموزشی را از طریق لینک‌های زیر دریافت نمایید.');
  const [offlineFiles, setOfflineFiles] = useState<Array<{ id: string; title: string; url: string; size?: string; format?: string }>>(
    (course.offlineDownloadFiles || []).map(f => ({
      id: f.id,
      title: f.title,
      url: f.url || f.downloadUrl || '',
      size: f.size || '',
      format: f.format || f.fileType || 'ZIP'
    })).length > 0
      ? (course.offlineDownloadFiles || []).map(f => ({
          id: f.id,
          title: f.title,
          url: f.url || f.downloadUrl || '',
          size: f.size || '',
          format: f.format || f.fileType || 'ZIP'
        }))
      : [
          { id: '1', title: 'بسته جامع جلسات ۱ الی ۵ (ویدیو Full HD + اسلایدها)', url: 'https://dl.feqh-ghaza.ir/courses/part1.zip', size: '۱.۲ گیگابایت', format: 'ZIP' },
          { id: '2', title: 'جزوه مدون و احکام استخراجی کارگاه', url: 'https://dl.feqh-ghaza.ir/courses/handout.pdf', size: '۱۸ مگابایت', format: 'PDF' }
        ]
  );
  const [newFileTitle, setNewFileTitle] = useState('');
  const [newFileUrl, setNewFileUrl] = useState('');
  const [newFileSize, setNewFileSize] = useState('');

  // Course Enrollments Filtered
  const enrollments = courseEnrollments.filter(e => e.courseId === course.id);

  const filteredEnrollments = enrollments.filter(e => {
    if (statusFilter !== 'all' && e.paymentStatus !== statusFilter) return false;
    if (rosterSearch.trim()) {
      const q = rosterSearch.toLowerCase();
      const matchName = e.userName.toLowerCase().includes(q);
      const matchNational = e.userNationalId.includes(q);
      const matchPhone = e.userPhone.includes(q);
      const matchTrack = e.trackingCode.toLowerCase().includes(q);
      if (!matchName && !matchNational && !matchPhone && !matchTrack) return false;
    }
    return true;
  });

  const confirmedCount = enrollments.filter(e => e.paymentStatus === 'confirmed').length;
  const pendingCount = enrollments.filter(e => e.paymentStatus === 'pending_review').length;
  const rejectedCount = enrollments.filter(e => e.paymentStatus === 'rejected').length;

  const totalRevenue = enrollments
    .filter(e => e.paymentStatus === 'confirmed')
    .reduce((sum, e) => sum + (e.amountPaid || 0), 0);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const base64 = evt.target?.result as string;
      if (!base64) return;
      try {
        const res = await apiClient.uploadProfilePicture(base64, file.name);
        if (res.success && res.url) {
          setPostBanner(res.url);
        }
      } catch {
        setPostBanner(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddOfflineFile = () => {
    if (!newFileTitle.trim() || !newFileUrl.trim()) {
      alert('لطفاً عنوان فایل و لینک دانلود را وارد فرمایید.');
      return;
    }
    const newEntry = {
      id: String(Date.now()),
      title: newFileTitle.trim(),
      url: newFileUrl.trim(),
      size: newFileSize.trim() || 'نامشخص',
      format: newFileUrl.endsWith('.pdf') ? 'PDF' : newFileUrl.endsWith('.mp3') ? 'MP3' : newFileUrl.endsWith('.mp4') ? 'MP4' : 'ZIP'
    };
    setOfflineFiles([...offlineFiles, newEntry]);
    setNewFileTitle('');
    setNewFileUrl('');
    setNewFileSize('');
  };

  const handleRemoveOfflineFile = (id: string) => {
    setOfflineFiles(offlineFiles.filter(f => f.id !== id));
  };

  const handleSavePostContent = async () => {
    setIsSavingPostContent(true);
    setSaveSuccessNotice(false);

    try {
      await updateCourse(course.id, {
        postEnrollmentBanner: postBanner,
        postEnrollmentMessage: postMessage,
        welcomeBoxFontSize: welcomeFontSize,
        welcomeBoxBgColor: welcomeBgColor,
        reminderDate,
        reminderSchedule,
        meetingLink: onlineMeetingLink,
        meetingAccessGuide: accessGuide,
        offlineDownloadUrl: offlineUrl,
        offlineDownloadGuide: offlineGuide,
        offlineDownloadFiles: offlineFiles
      });

      setSaveSuccessNotice(true);
      setTimeout(() => setSaveSuccessNotice(false), 3000);
    } catch (err: any) {
      alert(`خطا در ذخیره‌سازی تنظیمات: ${err?.message || err}`);
    } finally {
      setIsSavingPostContent(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md" dir="rtl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] text-right font-sans"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white border-b border-emerald-900/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center justify-center font-black">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-black">
                  پنل مدیریت ویژه دوره
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white text-[10px] font-bold">
                  {course.holdingFormat === 'online' ? 'دوره آنلاین (برخط)' : course.holdingFormat === 'in_person' ? 'دوره حضوری' : 'دوره ترکیبی/آفلاین'}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white mt-1">
                {course.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenBuilder(course)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all"
              title="ویرایش اطلاعات پایه‌ای و شهریه"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
              <span>مشخصات پایه دوره</span>
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-rose-600 text-white flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 3 Main Action Tabs */}
        <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-6 gap-2 text-xs font-bold overflow-x-auto">
          <button
            onClick={() => setActiveTab('roster')}
            className={`py-3.5 px-4 border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'roster'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 font-black bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>۱. لیست ثبت‌نامی‌ها و وضعیت پرداخت‌ها ({toPersianNumbers(enrollments.length)})</span>
          </button>

          <button
            onClick={() => setActiveTab('post_enrollment')}
            className={`py-3.5 px-4 border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'post_enrollment'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 font-black bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>۲. تنظیم محتوای ویژه پس از ثبت‌نام و تایید (آنلاین / آفلاین)</span>
          </button>

          <button
            onClick={() => setActiveTab('course_info')}
            className={`py-3.5 px-4 border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'course_info'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 font-black bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>۳. خلاصه مالی و مشخصات دوره</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs text-slate-800 dark:text-slate-200">
          
          {/* TAB 1: LIST OF REGISTRATIONS & PAYMENT STATUS */}
          {activeTab === 'roster' && (
            <div className="space-y-4">
              {/* Financial KPI Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 block">کل درخواست‌ها</span>
                  <strong className="text-lg font-black text-slate-900 dark:text-white">
                    {toPersianNumbers(enrollments.length)} نفر
                  </strong>
                </div>
                <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50">
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-400 block font-bold">ثبت‌نام قطعی و واریز شده</span>
                  <strong className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                    {toPersianNumbers(confirmedCount)} نفر
                  </strong>
                </div>
                <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50">
                  <span className="text-[11px] text-amber-700 dark:text-amber-400 block font-bold">در نوبت بررسی فیش</span>
                  <strong className="text-lg font-black text-amber-600 dark:text-amber-400">
                    {toPersianNumbers(pendingCount)} مورد
                  </strong>
                </div>
                <div className="p-3.5 rounded-2xl bg-teal-50/80 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900/50">
                  <span className="text-[11px] text-teal-700 dark:text-teal-400 block font-bold">مجموع واریزی‌های قطعی</span>
                  <strong className="text-sm sm:text-base font-black text-teal-700 dark:text-teal-300">
                    {toPersianNumbers(totalRevenue.toLocaleString('fa-IR'))} تومان
                  </strong>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={rosterSearch}
                    onChange={e => setRosterSearch(e.target.value)}
                    placeholder="جستجوی نام شرکت‌کننده، کد ملی، شماره تماس یا کد رهگیری فیش..."
                    className="w-full pr-9 pl-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value as any)}
                    className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                  >
                    <option value="all">همه وضعیت‌های واریز</option>
                    <option value="confirmed">فقط ثبت‌نام‌های قطعی (تایید شده)</option>
                    <option value="pending_review">در انتظار بررسی فیش</option>
                    <option value="rejected">رد شده / مخدوش</option>
                  </select>

                  <button
                    onClick={() => onOpenSmsModal(course, 'all')}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black flex items-center gap-1.5 shadow-sm whitespace-nowrap cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>پیامک گروهی به ثبت‌نامی‌ها</span>
                  </button>
                </div>
              </div>

              {/* Roster Table */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-3">نام و سمت</th>
                      <th className="p-3">شماره تماس و کد ملی</th>
                      <th className="p-3">شیوه پرداخت و مبلغ</th>
                      <th className="p-3">کد پیگیری و بانک</th>
                      <th className="p-3 text-center">وضعیت پرداخت</th>
                      <th className="p-3 text-center">عملیات بررسی</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredEnrollments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400">
                          هیچ ثبت‌نامی با فیلترهای انتخابی یافت نشد.
                        </td>
                      </tr>
                    ) : (
                      filteredEnrollments.map(enr => (
                        <tr key={enr.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="p-3">
                            <strong className="text-slate-900 dark:text-white block font-black text-sm">{enr.userName}</strong>
                            <span className="text-[11px] text-slate-500">{enr.userRoleTitle || 'دانش‌آموخته'}</span>
                          </td>
                          <td className="p-3 font-mono">
                            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                              <Phone className="w-3.5 h-3.5" />
                              <span>{toPersianNumbers(enr.userPhone)}</span>
                              <button
                                onClick={() => handleCopy(enr.userPhone, enr.id)}
                                className="text-slate-400 hover:text-emerald-600 mr-1"
                                title="کپی شماره"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                              {copiedId === enr.id && <span className="text-[9px] text-emerald-600">کپی شد</span>}
                            </div>
                            <span className="text-[11px] text-slate-400 block mt-0.5">کد ملی: {toPersianNumbers(enr.userNationalId)}</span>
                          </td>
                          <td className="p-3">
                            <span className="font-bold text-slate-900 dark:text-white block">
                              {toPersianNumbers(enr.amountPaid.toLocaleString('fa-IR'))} تومان
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {enr.paymentMethod === 'online_gateway' ? 'درگاه شتاب آنلاین' : 'واریز فیش / کارت‌به‌کارت'}
                            </span>
                          </td>
                          <td className="p-3 font-mono">
                            <span className="text-slate-800 dark:text-slate-200 font-bold block">{toPersianNumbers(enr.trackingCode)}</span>
                            <span className="text-[11px] text-slate-500">{enr.receiptBankName || 'بانک مبدأ'} · {toPersianNumbers(enr.receiptDate || '')}</span>
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-black inline-flex items-center gap-1 ${
                              enr.paymentStatus === 'confirmed'
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                                : enr.paymentStatus === 'pending_review'
                                ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                : 'bg-rose-100 text-rose-900 border border-rose-200'
                            }`}>
                              {enr.paymentStatus === 'confirmed' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />}
                              {enr.paymentStatus === 'pending_review' && <Clock className="w-3.5 h-3.5 text-amber-700" />}
                              <span>{enr.paymentStatus === 'confirmed' ? 'واریز قطعی' : enr.paymentStatus === 'pending_review' ? 'در بررسی فیش' : 'رد شده'}</span>
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {enr.receiptFileUrl && (
                                <button
                                  onClick={() => onInspectReceipt(enr)}
                                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300"
                                  title="مشاهده تصویر فیش"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => onOpenSmsModal(course, enr)}
                                className="p-1.5 rounded-lg bg-sky-100 dark:bg-sky-950 hover:bg-sky-200 text-sky-800 dark:text-sky-300"
                                title="ارسال پیامک به این کاربر"
                              >
                                <Send className="w-4 h-4" />
                              </button>
                              {enr.paymentStatus !== 'confirmed' && (
                                <button
                                  onClick={() => reviewCourseEnrollment(enr.id, 'confirmed', 'فیش واریزی توسط مدیر تایید شد.')}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px]"
                                >
                                  تایید
                                </button>
                              )}
                              {enr.paymentStatus !== 'rejected' && (
                                <button
                                  onClick={() => {
                                    const reason = prompt('علت رد فیش:', 'نقص اطلاعات واریز');
                                    if (reason) reviewCourseEnrollment(enr.id, 'rejected', reason);
                                  }}
                                  className="px-2 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-[11px]"
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
          )}

          {/* TAB 2: POST-ENROLLMENT CUSTOMIZATION (ONLINE & OFFLINE) */}
          {activeTab === 'post_enrollment' && (
            <div className="space-y-6">
              
              {/* Notice */}
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-950 dark:text-amber-200 space-y-1">
                <div className="flex items-center gap-2 font-black text-sm">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>مدیریت محتوای صفحه اختصاصی ورود به دوره پس از تایید ثبت‌نام</span>
                </div>
                <p className="text-[11px] leading-relaxed opacity-90">
                  این محتوا دقیقاً همان چیزی است که دانش‌آموخته پس از ورود به سامانه و کلیک بر روی «ورود به کلاس» در تالار اختصاصی دوره مشاهده خواهد کرد. تنظیمات برای هر دو حالت برگزاری آنلاین و دوره‌های فایل‌محور آفلاین در نظر گرفته شده است.
                </p>
              </div>

              {saveSuccessNotice && (
                <div className="p-3.5 rounded-2xl bg-emerald-100 text-emerald-900 font-bold flex items-center gap-2 border border-emerald-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                  <span>تنظیمات محتوای دوره با موفقیت در پایگاه داده ذخیره و برای همه کاربران اعمال گردید.</span>
                </div>
              )}

              {/* 1. Post-Enrollment Banner */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <h4 className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-emerald-600" />
                    <span>بنر اختصاصی بالای صفحه ورود به دوره:</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">اختیاری - در صورت نیاز بنر اختصاصی قرار دهید</span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {postBanner ? (
                    <div className="w-44 h-24 rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-700 shrink-0 relative group">
                      <img src={postBanner} alt="بنر دوره" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setPostBanner('')}
                        className="absolute top-1 left-1 p-1 rounded-full bg-rose-600 text-white shadow-xs"
                        title="حذف بنر"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-44 h-24 rounded-2xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-400 text-xs shrink-0 border border-dashed border-slate-300 dark:border-slate-700">
                      بدون بنر
                    </div>
                  )}

                  <div className="flex-1 space-y-2 w-full">
                    <div className="flex items-center gap-2">
                      <label className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer inline-flex items-center gap-1.5 shadow-sm">
                        <UploadCloud className="w-4 h-4" />
                        <span>آپلود تصویر بنر از سیستم</span>
                        <input type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
                      </label>
                      <span className="text-slate-400 text-[11px]">یا لینک مستقیم تصویر را وارد کنید:</span>
                    </div>
                    <input
                      type="text"
                      value={postBanner}
                      onChange={e => setPostBanner(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono dir-ltr"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Welcome Message & Formatting Box */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                  <h4 className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    <span>باکس پیام خوش‌آمدگویی و راهنمای ثبت‌نام به دانش‌آموخته:</span>
                  </h4>
                  <div className="flex items-center gap-3">
                    {/* Font Size Selector */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 font-bold">اندازه فونت:</span>
                      <select
                        value={welcomeFontSize}
                        onChange={e => setWelcomeFontSize(e.target.value as any)}
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold"
                      >
                        <option value="sm">ریز (sm)</option>
                        <option value="base">متوسط (base)</option>
                        <option value="lg">بزرگ (lg)</option>
                        <option value="xl">خیلی بزرگ (xl)</option>
                      </select>
                    </div>

                    {/* Color Theme Selector */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 font-bold">تم باکس:</span>
                      <select
                        value={welcomeBgColor}
                        onChange={e => setWelcomeBgColor(e.target.value as any)}
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold"
                      >
                        <option value="emerald">سبز زمردی (رسمی)</option>
                        <option value="amber">کهربایی (توجه)</option>
                        <option value="slate">نوک مدادی</option>
                        <option value="indigo">نیلی پژوهشی</option>
                        <option value="rose">زرشکی</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block">
                    متن پیام، تشکر از ثبت‌نام، موضوع و یادآوری سرفصل‌ها:
                  </label>
                  <textarea
                    rows={4}
                    value={postMessage}
                    onChange={e => setPostMessage(e.target.value)}
                    placeholder="ضمن تشکر از ثبت‌نام شما در دوره فلان با موضوع فلان..."
                    className="w-full p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium leading-relaxed"
                  />
                </div>

                {/* Live Preview of the Box */}
                <div className="pt-2">
                  <span className="text-[11px] font-bold text-slate-400 block mb-1.5">پیش‌نمایش باکس پیام برای دانش‌آموخته:</span>
                  <div className={`p-4 rounded-2xl border transition-all ${
                    welcomeBgColor === 'emerald'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 border-emerald-300 dark:border-emerald-800'
                      : welcomeBgColor === 'amber'
                      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-950 dark:text-amber-100 border-amber-300 dark:border-amber-800'
                      : welcomeBgColor === 'slate'
                      ? 'bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700'
                      : welcomeBgColor === 'indigo'
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-100 border-indigo-300 dark:border-indigo-800'
                      : 'bg-rose-50 dark:bg-rose-950/40 text-rose-950 dark:text-rose-100 border-rose-300 dark:border-rose-800'
                  }`}>
                    <p className={`font-semibold leading-relaxed ${
                      welcomeFontSize === 'sm' ? 'text-xs' : welcomeFontSize === 'lg' ? 'text-base' : welcomeFontSize === 'xl' ? 'text-lg font-black' : 'text-sm'
                    }`}>
                      {postMessage}
                    </p>
                  </div>
                </div>
              </div>

              {/* 3. Online Courses Settings (تاریخ، ساعت و لینک ورود) */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-2">
                  <h4 className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
                    <span>تنظیمات دوره آنلاین (زمان‌بندی و لینک ورود به جلسه):</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    در صورتی که دوره در تاریخ مشخص یا زمان‌های خاص برگزار می‌شود، اطلاعات زیر را جهت یادآوری تنظیم نمایید.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 dark:text-slate-300">تاریخ برگزاری / اولین جلسه:</label>
                    <input
                      type="text"
                      value={reminderDate}
                      onChange={e => setReminderDate(e.target.value)}
                      placeholder="مثال: پنج‌شنبه ۱۵ آذر ۱۴۰۳"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 dark:text-slate-300">روزها و ساعت برگزاری جلسه:</label>
                    <input
                      type="text"
                      value={reminderSchedule}
                      onChange={e => setReminderSchedule(e.target.value)}
                      placeholder="مثال: پنج‌شنبه‌ها از ساعت ۰۹:۰۰ الی ۱۲:۰۰"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="font-bold text-slate-700 dark:text-slate-300">لینک ورود به تالار آنلاین اسکای‌روم / وبینار:</label>
                    <input
                      type="text"
                      value={onlineMeetingLink}
                      onChange={e => setOnlineMeetingLink(e.target.value)}
                      placeholder="https://lms.feqh-ghaza.ir/room/..."
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono dir-ltr font-bold text-emerald-700 dark:text-emerald-400"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="font-bold text-slate-700 dark:text-slate-300">راهنما و شرایط ورود به جلسه آنلاین:</label>
                    <input
                      type="text"
                      value={accessGuide}
                      onChange={e => setAccessGuide(e.target.value)}
                      placeholder="کد کاربری کد ملی و رمز عبور شماره تلفن بدون صفر است..."
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Offline Courses Settings (فایل‌ها و آدرس دانلود دوره آفلاین) */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-2">
                  <h4 className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Download className="w-4 h-4 text-sky-600" />
                    <span>تنظیمات دوره آفلاین (آدرس و فایل‌های قابل دانلود دوره):</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    اگر دوره خریداری‌شده به صورت فایل آفلاین، ویدیویی یا صوتی ضبط‌شده است، لینک‌های دانلود و راهنمای دریافت را اینجا قرار دهید.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 dark:text-slate-300">توضیحات و راهنمای دانلود برای خریدار دوره آفلاین:</label>
                    <textarea
                      rows={2}
                      value={offlineGuide}
                      onChange={e => setOfflineGuide(e.target.value)}
                      placeholder="توضیحات مربوط به نحوه دانلود، خارج کردن از حالت فشرده و مشاهده آفلاین..."
                      className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>

                  {/* List of Offline Files */}
                  <div className="space-y-2">
                    <label className="font-bold text-slate-700 dark:text-slate-300 block">فایل‌های دانلودی بارگذاری‌شده برای این دوره:</label>
                    {offlineFiles.map((file, idx) => (
                      <div key={file.id || idx} className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 truncate">
                          <span className="w-7 h-7 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center font-bold text-xs shrink-0">
                            {file.format || 'ZIP'}
                          </span>
                          <div className="truncate">
                            <span className="font-bold text-slate-900 dark:text-white block truncate">{file.title}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{file.url} · {file.size}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveOfflineFile(file.id)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          title="حذف این فایل"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add New File Row */}
                  <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 space-y-2">
                    <span className="font-bold text-emerald-900 dark:text-emerald-300 text-[11px] block">افزودن لینک فایل دانلودی جدید:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={newFileTitle}
                        onChange={e => setNewFileTitle(e.target.value)}
                        placeholder="عنوان فایل (مثال: ویدیوی جلسه اول)"
                        className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs"
                      />
                      <input
                        type="text"
                        value={newFileUrl}
                        onChange={e => setNewFileUrl(e.target.value)}
                        placeholder="لینک دانلود (https://...)"
                        className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono dir-ltr"
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newFileSize}
                          onChange={e => setNewFileSize(e.target.value)}
                          placeholder="حجم (مثال: ۴۵۰ مگ)"
                          className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs flex-1"
                        />
                        <button
                          type="button"
                          onClick={handleAddOfflineFile}
                          className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1 shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>افزودن</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Save Button for Tab 2 */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  disabled={isSavingPostContent}
                  onClick={handleSavePostContent}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md flex items-center gap-2 cursor-pointer transition-transform active:scale-95 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingPostContent ? 'در حال ذخیره‌سازی...' : 'ذخیره دائمی تنظیمات نمایش دوره'}</span>
                </button>
              </div>

            </div>
          )}

          {/* TAB 3: COURSE INFO SUMMARY */}
          {activeTab === 'course_info' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="font-black text-slate-900 dark:text-white">مشخصات کلی و ساختاری دوره:</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">مدرس دوره:</span>
                    <strong className="text-slate-900 dark:text-white">{course.instructor}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">شهریه رسمی:</span>
                    <strong className="text-emerald-600 font-bold">
                      {course.price > 0 ? `${toPersianNumbers(course.price.toLocaleString('fa-IR'))} تومان` : 'رایگان'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">ساعت آموزشی:</span>
                    <strong className="text-slate-900 dark:text-white">{toPersianNumbers(course.hours)} ساعت</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">شیوه پرداخت مجاز:</span>
                    <strong className="text-slate-900 dark:text-white">
                      {course.allowedPaymentMethod === 'both' ? 'درگاه شتاب + فیش' : course.allowedPaymentMethod === 'gateway_only' ? 'فقط درگاه آنلاین' : 'فقط فیش بانکی'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">وضعیت برگزاری:</span>
                    <strong className="text-slate-900 dark:text-white">
                      {course.status === 'enrolling' ? 'در حال ثبت‌نام' : course.status === 'ongoing' ? 'در حال برگزاری' : 'آرشیو شده'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">ظرفیت کل کلاس:</span>
                    <strong className="text-slate-900 dark:text-white">{toPersianNumbers(course.capacity)} نفر</strong>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 block text-[11px] mb-1">توضیحات دوره:</span>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{course.description}</p>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => onOpenBuilder(course)}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs flex items-center gap-2"
                >
                  <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
                  <span>ویرایش کامل سرفصل‌ها و گزینه‌های دوره در سازنده</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            شناسه دوره: <span className="font-mono">{course.id}</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
          >
            بستن پنل مدیریتی
          </button>
        </div>

      </motion.div>
    </div>
  );
};
