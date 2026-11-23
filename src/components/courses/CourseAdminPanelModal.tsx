import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'motion/react';
import {
  X,
  Users,
  Settings,
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
  Plus,
  Trash2,
  FileText,
  Sparkles,
  Search,
  ClipboardCheck,
  UserMinus,
  RotateCcw,
  FolderOpen,
  RefreshCw,
  HardDrive,
  Loader2,
  Calendar,
} from 'lucide-react';
import { Course, CourseEnrollment, CourseAttendanceRecord } from '../../types';
import { toPersianNumbers } from '../../utils/persianNumbers';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/apiClient';
import { compressImageFast, formatFileSizeLabel } from '../../utils/imageCompression';

interface CourseAdminPanelModalProps {
  course: Course;
  onClose: () => void;
  onOpenSmsModal: (course: Course, recipient: 'all' | CourseEnrollment) => void;
  onInspectReceipt: (enrollment: CourseEnrollment) => void;
  onOpenBuilder: (course: Course) => void;
}

type AdminTabType = 'roster' | 'attendance' | 'post_enrollment' | 'course_info';
type AttendanceStatusType = 'present' | 'late' | 'excused' | 'absent';

export const CourseAdminPanelModal: React.FC<CourseAdminPanelModalProps> = ({
  course,
  onClose,
  onOpenSmsModal,
  onInspectReceipt,
  onOpenBuilder,
}) => {
  const {
    courseEnrollments,
    reviewCourseEnrollment,
    removeCourseEnrollmentFromClass,
    restoreCourseEnrollmentToClass,
    updateCourse,
  } = useApp();

  const [activeTab, setActiveTab] = useState<AdminTabType>('roster');

  // Roster Search & Filters
  const [rosterSearch, setRosterSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'pending_review' | 'rejected'>('all');
  const [classFilter, setClassFilter] = useState<'all' | 'active' | 'removed'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Reject & Remove-from-Class Inline Forms
  const [rejectTarget, setRejectTarget] = useState<{ enrollmentId: string; userName: string; reason: string } | null>(null);
  const [removeTarget, setRemoveTarget] = useState<{ enrollmentId: string; userName: string; reason: string } | null>(null);
  const [rosterActionBusy, setRosterActionBusy] = useState<string | null>(null);
  const [rosterError, setRosterError] = useState<string | null>(null);

  // Integrated Attendance State (Tab 2)
  const [opsLoading, setOpsLoading] = useState(false);
  const [selectedSessionNum, setSelectedSessionNum] = useState<number>(1);
  const [serverAttendance, setServerAttendance] = useState<CourseAttendanceRecord[]>([]);
  const [draftAttendance, setDraftAttendance] = useState<
    Record<string, { status: AttendanceStatusType; note: string }>
  >({});
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [attendanceFeedback, setAttendanceFeedback] = useState<string | null>(null);

  // Post-Enrollment Content & Files State (Tab 3)
  const courseFileInputRef = useRef<HTMLInputElement>(null);
  const [isSavingPostContent, setIsSavingPostContent] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);
  const [postSaveError, setPostSaveError] = useState<string | null>(null);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [bannerPreviewLocal, setBannerPreviewLocal] = useState<string | null>(null);
  const [bannerStats, setBannerStats] = useState<string | null>(null);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [offlineFileError, setOfflineFileError] = useState<string | null>(null);

  const [postBanner, setPostBanner] = useState(course.postEnrollmentBanner || course.coverImage || '');
  const [postMessage, setPostMessage] = useState(
    course.postEnrollmentMessage ||
      `ضمن تشکر از ثبت‌نام شما در دوره تخصصی «${course.title}»، جلسه با موضوع «${course.topics?.[0] || 'مباحث پیشرفته فقه و قضا'}» طبق برنامه اعلامی برگزار خواهد شد.`
  );
  const [welcomeFontSize, setWelcomeFontSize] = useState<'sm' | 'base' | 'lg' | 'xl'>(course.welcomeBoxFontSize || 'base');
  const [welcomeBgColor, setWelcomeBgColor] = useState<'emerald' | 'amber' | 'slate' | 'indigo' | 'rose'>(
    course.welcomeBoxBgColor || 'emerald'
  );
  const [reminderDate, setReminderDate] = useState(course.reminderDate || course.startDate || '۱۴۰۳/۰۹/۰۱');
  const [reminderSchedule, setReminderSchedule] = useState(
    course.reminderSchedule || course.schedule || 'پنج‌شنبه‌ها از ساعت ۰۹:۰۰ الی ۱۲:۰۰'
  );
  const [onlineMeetingLink, setOnlineMeetingLink] = useState(
    course.meetingLink || 'https://lms.feqh-ghaza.ir/room/online'
  );
  const [accessGuide, setAccessGuide] = useState(
    course.meetingAccessGuide || 'نام کاربری کد ملی و کلمه عبور شماره همراه بدون صفر.'
  );

  // Offline / Disk Download Files
  const [offlineUrl, setOfflineUrl] = useState(course.offlineDownloadUrl || '');
  const [offlineGuide, setOfflineGuide] = useState(
    course.offlineDownloadGuide || 'فایل‌های جلسات شامل ویدیوها، صوت و جزوات آموزشی را از طریق فهرست زیر دریافت نمایید.'
  );
  const [offlineFiles, setOfflineFiles] = useState<
    Array<{
      id: string;
      title: string;
      url: string;
      size?: string;
      fileSizeBytes?: number;
      format?: string;
      sessionNumber?: number;
      sourceType?: 'upload' | 'disk' | 'external';
      filename?: string;
    }>
  >(
    (course.offlineDownloadFiles || []).map(f => ({
      id: f.id,
      title: f.title,
      url: f.url || f.downloadUrl || '',
      size: f.size || '',
      fileSizeBytes: f.fileSizeBytes,
      format: f.format || f.fileType || 'FILE',
      sessionNumber: f.sessionNumber,
      sourceType: f.sourceType,
      filename: f.filename,
    }))
  );
  const [newFileTitle, setNewFileTitle] = useState('');
  const [newFileUrl, setNewFileUrl] = useState('');
  const [newFileSize, setNewFileSize] = useState('');
  const [newFileSessionNum, setNewFileSessionNum] = useState<string>('');
  const [uploadingCourseFile, setUploadingCourseFile] = useState(false);
  const [scanningDisk, setScanningDisk] = useState(false);
  const [diskInfo, setDiskInfo] = useState<{
    relativeDiskPath: string;
    files: Array<{ filename: string; sizeLabel: string; sizeBytes: number; format: string; url: string }>;
  } | null>(null);
  const [downloadingUrl, setDownloadingUrl] = useState<string | null>(null);

  const loadAttendanceData = useCallback(async () => {
    setOpsLoading(true);
    try {
      const ops = await api.getCourseOperations(course.id);
      setServerAttendance(Array.isArray(ops?.attendance) ? ops.attendance : []);
    } catch {
      // handled cleanly
    } finally {
      setOpsLoading(false);
    }
  }, [course.id]);

  const handleScanDiskFolder = useCallback(async () => {
    setScanningDisk(true);
    setOfflineFileError(null);
    try {
      const res = await api.getCourseDiskFiles(course.id);
      setDiskInfo({
        relativeDiskPath: res.relativeDiskPath,
        files: res.files || [],
      });
    } catch (err: any) {
      setOfflineFileError(err?.message || 'خطا در خواندن پوشه دیسک دوره.');
    } finally {
      setScanningDisk(false);
    }
  }, [course.id]);

  useEffect(() => {
    if (activeTab === 'attendance') {
      loadAttendanceData();
    } else if (activeTab === 'post_enrollment' && !diskInfo) {
      handleScanDiskFolder();
    }
  }, [activeTab, loadAttendanceData, handleScanDiskFolder, diskInfo]);

  // Derived Sessions List (uses course.sessions if defined, otherwise 1..sessionsCount)
  const sessionsList =
    course.sessions && course.sessions.length > 0
      ? course.sessions
      : Array.from({ length: Math.max(1, course.sessionsCount || 4) }, (_, idx) => ({
          id: `default_sess_${idx + 1}`,
          sessionNumber: idx + 1,
          title: `جلسه ${toPersianNumbers(idx + 1)}`,
          presenterMode: 'course_instructor' as const,
          presenterName: course.instructor,
        }));

  // Sync draft attendance when selectedSessionNum or serverAttendance changes
  useEffect(() => {
    const nextDraft: Record<string, { status: AttendanceStatusType; note: string }> = {};
    serverAttendance
      .filter(a => Number(a.sessionNumber) === selectedSessionNum)
      .forEach(a => {
        nextDraft[a.userId] = {
          status: (a.status as AttendanceStatusType) || 'present',
          note: a.note || '',
        };
      });
    setDraftAttendance(nextDraft);
  }, [selectedSessionNum, serverAttendance]);

  // Enrollments for this course
  const enrollments = courseEnrollments.filter(e => e.courseId === course.id);
  const activeClassEnrollments = enrollments.filter(
    e => e.classStatus !== 'removed' && e.paymentStatus !== 'rejected'
  );
  const removedCount = enrollments.filter(e => e.classStatus === 'removed').length;

  const filteredEnrollments = enrollments.filter(e => {
    if (statusFilter !== 'all' && e.paymentStatus !== statusFilter) return false;
    const isRemoved = e.classStatus === 'removed';
    if (classFilter === 'active' && isRemoved) return false;
    if (classFilter === 'removed' && !isRemoved) return false;
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
  // Financial totals MUST always include all confirmed payments (never zeroed on class removal)
  const totalRevenue = enrollments
    .filter(e => e.paymentStatus === 'confirmed')
    .reduce((sum, e) => sum + (e.amountPaid || 0), 0);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Fast compressed banner upload + auto cleanup via previousUrl
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerUploading(true);
    setBannerError(null);
    const prevUrl = postBanner;
    try {
      const compressed = await compressImageFast(file, 'banner');
      setBannerPreviewLocal(compressed.previewUrl);
      setBannerStats(
        compressed.savedPercent > 0
          ? `فشرده‌سازی ${toPersianNumbers(compressed.savedPercent)}٪ (${formatFileSizeLabel(compressed.compressedBytes)})`
          : formatFileSizeLabel(compressed.compressedBytes)
      );
      const res = await api.uploadFile(compressed.file, 'course', {
        previousUrl: prevUrl && prevUrl.startsWith('/api/storage/') ? prevUrl : undefined,
      });
      if (res.url) {
        setPostBanner(res.url);
      }
    } catch (err: any) {
      setBannerError(err?.message || 'خطا در آپلود تصویر بنر');
    } finally {
      setBannerUploading(false);
      e.target.value = '';
    }
  };

  const handleUploadCourseDiskFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOfflineFileError(null);
    setUploadingCourseFile(true);
    try {
      const uploaded = await api.uploadFile(file, 'course_file', { courseId: course.id });
      const ext = file.name.split('.').pop()?.toUpperCase() || 'FILE';
      setOfflineFiles(prev => [
        ...prev,
        {
          id: `cf_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          title: file.name.replace(/\.[^.]+$/, '') || file.name,
          url: uploaded.url,
          size: formatFileSizeLabel(uploaded.sizeBytes || file.size),
          fileSizeBytes: uploaded.sizeBytes || file.size,
          format: ext,
          sessionNumber: newFileSessionNum ? Number(newFileSessionNum) : undefined,
          sourceType: 'upload',
          filename: uploaded.filename,
        },
      ]);
      await handleScanDiskFolder();
    } catch (err: any) {
      setOfflineFileError(err?.message || 'خطا در آپلود فایل در پوشه دیسک دوره');
    } finally {
      setUploadingCourseFile(false);
      e.target.value = '';
    }
  };

  const handleAttachDiskFile = (df: {
    filename: string;
    sizeLabel: string;
    sizeBytes: number;
    format: string;
    url: string;
  }) => {
    if (offlineFiles.some(f => f.url === df.url)) return;
    const cleanTitle = df.filename.replace(/\.[^.]+$/, '').replace(/^[0-9]+_[a-z0-9]+_/i, '') || df.filename;
    setOfflineFiles(prev => [
      ...prev,
      {
        id: `disk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        title: cleanTitle,
        url: df.url,
        size: df.sizeLabel,
        fileSizeBytes: df.sizeBytes,
        format: df.format,
        sourceType: 'disk',
        filename: df.filename,
      },
    ]);
  };

  const handleDeleteDiskFile = async (filename: string, url: string) => {
    try {
      await api.deleteCourseDiskFile(course.id, filename);
      setOfflineFiles(prev => prev.filter(f => f.url !== url));
      await handleScanDiskFolder();
    } catch (err: any) {
      setOfflineFileError(err?.message || 'خطا در حذف فایل از دیسک');
    }
  };

  const handleAddOfflineFile = () => {
    setOfflineFileError(null);
    if (!newFileTitle.trim() || !newFileUrl.trim()) {
      setOfflineFileError('لطفاً عنوان فایل و لینک دانلود را وارد فرمایید.');
      return;
    }
    const cleanUrl = newFileUrl.trim();
    const extMatch = cleanUrl.split('?')[0].split('.').pop()?.toUpperCase();
    const fmt = extMatch && extMatch.length <= 5 ? extMatch : 'LINK';
    const newEntry = {
      id: String(Date.now()),
      title: newFileTitle.trim(),
      url: cleanUrl,
      size: newFileSize.trim() || 'نامشخص',
      format: fmt,
      sessionNumber: newFileSessionNum ? Number(newFileSessionNum) : undefined,
      sourceType: (cleanUrl.startsWith('/api/storage/private/') ? 'disk' : 'external') as 'disk' | 'external',
    };
    setOfflineFiles([...offlineFiles, newEntry]);
    setNewFileTitle('');
    setNewFileUrl('');
    setNewFileSize('');
    setNewFileSessionNum('');
  };

  const handleRemoveOfflineFile = (id: string) => {
    setOfflineFiles(offlineFiles.filter(f => f.id !== id));
  };

  const handleDownloadPreview = async (fileUrl: string, title: string, filename?: string) => {
    if (!fileUrl) return;
    if (fileUrl.startsWith('/api/storage/private/')) {
      setDownloadingUrl(fileUrl);
      try {
        await api.downloadPrivateFile(fileUrl, filename || title);
      } catch (err: any) {
        setOfflineFileError(err?.message || 'خطا در دانلود فایل خصوصی');
      } finally {
        setDownloadingUrl(null);
      }
    } else {
      window.open(fileUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleSavePostContent = async () => {
    setIsSavingPostContent(true);
    setSaveSuccessNotice(false);
    setPostSaveError(null);

    try {
      await updateCourse(course.id, {
        postEnrollmentBanner: postBanner ? postBanner : ('' as any),
        postEnrollmentMessage: postMessage,
        welcomeBoxFontSize: welcomeFontSize,
        welcomeBoxBgColor: welcomeBgColor,
        reminderDate,
        reminderSchedule,
        meetingLink: onlineMeetingLink,
        meetingAccessGuide: accessGuide,
        offlineDownloadUrl: offlineUrl,
        offlineDownloadGuide: offlineGuide,
        offlineDownloadFiles: offlineFiles,
      });

      setSaveSuccessNotice(true);
      setTimeout(() => setSaveSuccessNotice(false), 3000);
    } catch (err: any) {
      setPostSaveError(err?.message || 'خطا در ذخیره‌سازی تنظیمات دوره');
    } finally {
      setIsSavingPostContent(false);
    }
  };

  const handleMarkAllPresentForSession = () => {
    setDraftAttendance(prev => {
      const next = { ...prev };
      activeClassEnrollments.forEach(enr => {
        next[enr.userId] = {
          status: 'present',
          note: prev[enr.userId]?.note || '',
        };
      });
      return next;
    });
  };

  const handleSaveSessionAttendance = async () => {
    const activeSessionObj = sessionsList.find(s => Number(s.sessionNumber) === selectedSessionNum);
    const recordsToSave = activeClassEnrollments
      .filter(enr => Boolean(draftAttendance[enr.userId]?.status))
      .map(enr => ({
        userId: enr.userId,
        userName: enr.userName,
        sessionNumber: selectedSessionNum,
        sessionTitle: activeSessionObj?.title || `جلسه ${toPersianNumbers(selectedSessionNum)}`,
        sessionId: activeSessionObj?.id,
        status: draftAttendance[enr.userId].status,
        note: draftAttendance[enr.userId].note || undefined,
      }));

    if (recordsToSave.length === 0) {
      setAttendanceFeedback('ابتدا وضعیت حداقل یک شرکت‌کننده را انتخاب نمایید.');
      return;
    }

    setSavingAttendance(true);
    setAttendanceFeedback(null);
    try {
      await api.recordCourseAttendanceBulk(course.id, recordsToSave);
      await loadAttendanceData();
      setAttendanceFeedback(
        `حضور و غیاب ${toPersianNumbers(recordsToSave.length)} نفر برای «${
          activeSessionObj?.title || `جلسه ${toPersianNumbers(selectedSessionNum)}`
        }» در پایگاه داده ذخیره شد.`
      );
      setTimeout(() => setAttendanceFeedback(null), 4000);
    } catch (err: any) {
      setAttendanceFeedback(`خطا در ثبت حضور و غیاب: ${err?.message || 'خطای سرور'}`);
    } finally {
      setSavingAttendance(false);
    }
  };

  const selectedSessionObj = sessionsList.find(s => Number(s.sessionNumber) === selectedSessionNum);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md"
      dir="rtl"
    >
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
                  {course.holdingFormat === 'online'
                    ? 'دوره آنلاین (برخط)'
                    : course.holdingFormat === 'in_person'
                    ? 'دوره حضوری'
                    : 'دوره ترکیبی/آفلاین'}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white mt-1">{course.title}</h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenBuilder(course)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer"
              title="ویرایش مشخصات، اساتید، جلسات و شهریه"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
              <span>ویرایش ساختار دوره</span>
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-rose-600 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 4 Main Action Tabs */}
        <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-6 gap-2 text-xs font-bold overflow-x-auto">
          <button
            onClick={() => setActiveTab('roster')}
            className={`py-3.5 px-4 border-b-2 flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'roster'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 font-black bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>۱. ثبت‌نامی‌ها، حذف از کلاس و مالی ({toPersianNumbers(enrollments.length)})</span>
          </button>

          <button
            onClick={() => setActiveTab('attendance')}
            className={`py-3.5 px-4 border-b-2 flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'attendance'
                ? 'border-sky-600 text-sky-700 dark:text-sky-400 font-black bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <ClipboardCheck className="w-4 h-4 text-sky-500" />
            <span>۲. ثبت حضور و غیاب جلسات ({toPersianNumbers(sessionsList.length)})</span>
          </button>

          <button
            onClick={() => setActiveTab('post_enrollment')}
            className={`py-3.5 px-4 border-b-2 flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'post_enrollment'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 font-black bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>۳. فایل‌های دیسک دوره و محتوای تالار</span>
          </button>

          <button
            onClick={() => setActiveTab('course_info')}
            className={`py-3.5 px-4 border-b-2 flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'course_info'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 font-black bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>۴. خلاصه مالی و مشخصات</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs text-slate-800 dark:text-slate-200">
          {/* TAB 1: ROSTER, PAYMENT REVIEW & REMOVE FROM CLASS */}
          {activeTab === 'roster' && (
            <div className="space-y-4">
              {/* Financial KPI Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 block">کل درخواست‌ها</span>
                  <strong className="text-lg font-black text-slate-900 dark:text-white tabular-nums">
                    {toPersianNumbers(enrollments.length)} نفر
                  </strong>
                </div>
                <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50">
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-400 block font-bold">فعال در کلاس</span>
                  <strong className="text-lg font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {toPersianNumbers(activeClassEnrollments.filter(e => e.paymentStatus === 'confirmed').length)} نفر
                  </strong>
                </div>
                <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50">
                  <span className="text-[11px] text-amber-700 dark:text-amber-400 block font-bold">در نوبت بررسی فیش</span>
                  <strong className="text-lg font-black text-amber-600 dark:text-amber-400 tabular-nums">
                    {toPersianNumbers(pendingCount)} مورد
                  </strong>
                </div>
                <div className="p-3.5 rounded-2xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50">
                  <span className="text-[11px] text-rose-700 dark:text-rose-400 block font-bold">حذف‌شده از کلاس</span>
                  <strong className="text-lg font-black text-rose-600 dark:text-rose-400 tabular-nums">
                    {toPersianNumbers(removedCount)} نفر
                  </strong>
                </div>
                <div className="p-3.5 rounded-2xl bg-teal-50/80 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900/50">
                  <span className="text-[11px] text-teal-700 dark:text-teal-400 block font-bold">مجموع واریزی‌های قطعی</span>
                  <strong className="text-sm sm:text-base font-black text-teal-700 dark:text-teal-300 tabular-nums">
                    {toPersianNumbers(totalRevenue.toLocaleString('fa-IR'))} تومان
                  </strong>
                </div>
              </div>

              {rosterError && (
                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-bold">
                  {rosterError}
                </div>
              )}

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

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value as any)}
                    className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                  >
                    <option value="all">همه وضعیت‌های واریز</option>
                    <option value="confirmed">فقط ثبت‌نام‌های قطعی ({toPersianNumbers(confirmedCount)})</option>
                    <option value="pending_review">در انتظار بررسی فیش</option>
                    <option value="rejected">رد شده / مخدوش</option>
                  </select>

                  <select
                    value={classFilter}
                    onChange={e => setClassFilter(e.target.value as any)}
                    className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                  >
                    <option value="all">همه وضعیت‌های کلاسی</option>
                    <option value="active">فعال در کلاس</option>
                    <option value="removed">حذف‌شده از کلاس</option>
                  </select>

                  <button
                    onClick={() => onOpenSmsModal(course, 'all')}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black flex items-center gap-1.5 shadow-sm whitespace-nowrap cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>پیامک گروهی</span>
                  </button>
                </div>
              </div>

              {/* Roster Table */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto shadow-xs">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-3">نام و وضعیت کلاسی</th>
                      <th className="p-3">شماره تماس و کد ملی</th>
                      <th className="p-3">شیوه پرداخت و مبلغ</th>
                      <th className="p-3">کد پیگیری و بانک</th>
                      <th className="p-3 text-center">وضعیت پرداخت</th>
                      <th className="p-3 text-center">عملیات مدیریتی</th>
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
                      filteredEnrollments.map(enr => {
                        const isRemoved = enr.classStatus === 'removed';
                        const isBusy = rosterActionBusy === enr.id;
                        return (
                          <tr
                            key={enr.id}
                            className={`transition-colors ${
                              isRemoved
                                ? 'bg-rose-50/40 dark:bg-rose-950/10'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                            }`}
                          >
                            <td className="p-3">
                              <strong className="text-slate-900 dark:text-white block font-black text-sm">
                                {enr.userName}
                              </strong>
                              <span className="text-[11px] text-slate-500 block">
                                {enr.userRoleTitle || 'دانش‌آموخته'}
                              </span>
                              {isRemoved && (
                                <div className="mt-1 inline-flex flex-col gap-0.5 px-2 py-0.5 rounded-lg bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-[10px] font-black">
                                  <span>حذف‌شده از کلاس (سوابق مالی محفوظ)</span>
                                  {enr.removalReason && (
                                    <span className="font-normal opacity-85">علت: {enr.removalReason}</span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="p-3 font-mono tabular-nums">
                              <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                                <Phone className="w-3.5 h-3.5" />
                                <span>{toPersianNumbers(enr.userPhone)}</span>
                                <button
                                  onClick={() => handleCopy(enr.userPhone, enr.id)}
                                  className="text-slate-400 hover:text-emerald-600 mr-1 cursor-pointer"
                                  title="کپی شماره"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                                {copiedId === enr.id && <span className="text-[9px] text-emerald-600">کپی شد</span>}
                              </div>
                              <span className="text-[11px] text-slate-400 block mt-0.5">
                                کد ملی: {toPersianNumbers(enr.userNationalId)}
                              </span>
                            </td>
                            <td className="p-3 tabular-nums">
                              <span className="font-bold text-slate-900 dark:text-white block">
                                {toPersianNumbers(enr.amountPaid.toLocaleString('fa-IR'))} تومان
                              </span>
                              <span className="text-[11px] text-slate-500">
                                {enr.paymentMethod === 'online_gateway' ? 'درگاه شتاب آنلاین' : 'واریز فیش / کارت‌به‌کارت'}
                              </span>
                            </td>
                            <td className="p-3 font-mono tabular-nums">
                              <span className="text-slate-800 dark:text-slate-200 font-bold block">
                                {toPersianNumbers(enr.trackingCode)}
                              </span>
                              <span className="text-[11px] text-slate-500">
                                {enr.receiptBankName || 'بانک مبدأ'} · {toPersianNumbers(enr.receiptDate || '')}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[11px] font-black inline-flex items-center gap-1 ${
                                  enr.paymentStatus === 'confirmed'
                                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                                    : enr.paymentStatus === 'pending_review'
                                    ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                    : 'bg-rose-100 text-rose-900 border border-rose-200'
                                }`}
                              >
                                {enr.paymentStatus === 'confirmed' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />}
                                {enr.paymentStatus === 'pending_review' && <Clock className="w-3.5 h-3.5 text-amber-700" />}
                                <span>
                                  {enr.paymentStatus === 'confirmed'
                                    ? 'واریز قطعی'
                                    : enr.paymentStatus === 'pending_review'
                                    ? 'در بررسی فیش'
                                    : 'رد شده'}
                                </span>
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                {enr.receiptFileUrl && (
                                  <button
                                    onClick={() => onInspectReceipt(enr)}
                                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 cursor-pointer"
                                    title="مشاهده تصویر فیش"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => onOpenSmsModal(course, enr)}
                                  className="p-1.5 rounded-lg bg-sky-100 dark:bg-sky-950 hover:bg-sky-200 text-sky-800 dark:text-sky-300 cursor-pointer"
                                  title="ارسال پیامک به این کاربر"
                                >
                                  <Send className="w-4 h-4" />
                                </button>
                                {enr.paymentStatus !== 'confirmed' && (
                                  <button
                                    disabled={isBusy}
                                    onClick={() => reviewCourseEnrollment(enr.id, 'confirmed', 'فیش واریزی توسط مدیر تایید شد.')}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] cursor-pointer disabled:opacity-50"
                                  >
                                    تایید
                                  </button>
                                )}
                                {enr.paymentStatus !== 'rejected' && !isRemoved && (
                                  <button
                                    disabled={isBusy}
                                    onClick={() =>
                                      setRejectTarget({
                                        enrollmentId: enr.id,
                                        userName: enr.userName,
                                        reason: 'نقص اطلاعات واریز',
                                      })
                                    }
                                    className="px-2 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-[11px] cursor-pointer"
                                  >
                                    رد
                                  </button>
                                )}

                                {enr.paymentStatus === 'confirmed' && !isRemoved && (
                                  <button
                                    disabled={isBusy}
                                    onClick={() => {
                                      setRosterError(null);
                                      setRemoveTarget({
                                        enrollmentId: enr.id,
                                        userName: enr.userName,
                                        reason: 'حذف اداری از کلاس با حفظ سابقه مالی',
                                      });
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                    title="حذف از کلاس (تراکنش‌های مالی و اقساط کاربر حفظ می‌شود)"
                                  >
                                    <UserMinus className="w-3.5 h-3.5" />
                                    <span>حذف از کلاس</span>
                                  </button>
                                )}

                                {isRemoved && (
                                  <button
                                    disabled={isBusy}
                                    onClick={async () => {
                                      setRosterError(null);
                                      setRosterActionBusy(enr.id);
                                      try {
                                        await restoreCourseEnrollmentToClass(course.id, enr.id);
                                      } catch (err: any) {
                                        setRosterError(err?.message || 'خطا در بازگردانی به کلاس');
                                      } finally {
                                        setRosterActionBusy(null);
                                      }
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span>بازگردانی به کلاس</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Reject Receipt Form */}
              {rejectTarget && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <span className="font-black text-rose-800 dark:text-rose-200 whitespace-nowrap">
                    علت رد فیش {rejectTarget.userName}:
                  </span>
                  <input
                    type="text"
                    value={rejectTarget.reason}
                    onChange={e => setRejectTarget({ ...rejectTarget, reason: e.target.value })}
                    className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-700 text-xs text-slate-900 dark:text-white"
                    placeholder="علت رد فیش را وارد کنید..."
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        if (!rejectTarget.reason.trim()) return;
                        await reviewCourseEnrollment(rejectTarget.enrollmentId, 'rejected', rejectTarget.reason.trim());
                        setRejectTarget(null);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs cursor-pointer"
                    >
                      ثبت رد فیش
                    </button>
                    <button
                      type="button"
                      onClick={() => setRejectTarget(null)}
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
                    >
                      انصراف
                    </button>
                  </div>
                </div>
              )}

              {/* Remove From Class Form (Preserving Financial Transactions) */}
              {removeTarget && (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border-2 border-rose-400/60 dark:border-rose-800 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <strong className="text-rose-800 dark:text-rose-300 font-black">
                      حذف شرکت‌کننده قطعی «{removeTarget.userName}» از فهرست کلاس:
                    </strong>
                    <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                      تراکنش‌های مالی، فیش‌ها و اقساط ثبت‌شده کاربر ۱۰۰٪ محفوظ می‌مانند.
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      type="text"
                      value={removeTarget.reason}
                      onChange={e => setRemoveTarget({ ...removeTarget, reason: e.target.value })}
                      className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-700 text-xs"
                      placeholder="علت حذف از کلاس (مثلاً انصراف با حفظ تراکنش یا عدم حضور)..."
                    />
                    <button
                      type="button"
                      disabled={rosterActionBusy === removeTarget.enrollmentId}
                      onClick={async () => {
                        setRosterActionBusy(removeTarget.enrollmentId);
                        setRosterError(null);
                        try {
                          await removeCourseEnrollmentFromClass(
                            course.id,
                            removeTarget.enrollmentId,
                            removeTarget.reason.trim() || undefined
                          );
                          setRemoveTarget(null);
                        } catch (err: any) {
                          setRosterError(err?.message || 'خطا در حذف شرکت‌کننده از کلاس');
                        } finally {
                          setRosterActionBusy(null);
                        }
                      }}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs cursor-pointer disabled:opacity-50"
                    >
                      تایید حذف از کلاس
                    </button>
                    <button
                      type="button"
                      onClick={() => setRemoveTarget(null)}
                      className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
                    >
                      انصراف
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SESSION-LEVEL ATTENDANCE */}
          {activeTab === 'attendance' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-sky-50/70 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-900/50 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="font-black text-sm text-sky-950 dark:text-sky-200 flex items-center gap-2">
                    <ClipboardCheck className="w-4 h-4 text-sky-600" />
                    <span>ثبت حضور و غیاب جلسات دوره ({toPersianNumbers(sessionsList.length)} جلسه)</span>
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                    شرکت‌کنندگان فعال کلاس ({toPersianNumbers(activeClassEnrollments.length)} نفر) نمایش داده می‌شوند.{' '}
                    {removedCount > 0 && `(${toPersianNumbers(removedCount)} نفر حذف‌شده از کلاس مستثنی شده‌اند)`}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleMarkAllPresentForSession}
                    className="px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 font-black cursor-pointer"
                  >
                    ثبت همه حاضر برای این جلسه
                  </button>
                  <button
                    type="button"
                    disabled={savingAttendance}
                    onClick={handleSaveSessionAttendance}
                    className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-black flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-60"
                  >
                    {savingAttendance ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>{savingAttendance ? 'در حال ذخیره...' : 'ذخیره تغییرات حضور و غیاب'}</span>
                  </button>
                </div>
              </div>

              {attendanceFeedback && (
                <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-bold">
                  {attendanceFeedback}
                </div>
              )}

              {/* Session Selector Strip */}
              <div className="flex items-center gap-2 flex-wrap">
                {sessionsList.map(sess => {
                  const num = Number(sess.sessionNumber);
                  const active = selectedSessionNum === num;
                  const recordedCount = serverAttendance.filter(a => Number(a.sessionNumber) === num).length;
                  return (
                    <button
                      key={sess.id || num}
                      type="button"
                      onClick={() => setSelectedSessionNum(num)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black border transition-all cursor-pointer flex items-center gap-2 ${
                        active
                          ? 'bg-slate-900 dark:bg-sky-600 text-white border-slate-900 dark:border-sky-500 shadow-sm'
                          : 'bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{sess.title || `جلسه ${toPersianNumbers(num)}`}</span>
                      {sess.presenterMode !== 'unspecified' && sess.presenterName && (
                        <span className="opacity-75 text-[10px]">({sess.presenterName})</span>
                      )}
                      {recordedCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-500 text-[10px] tabular-nums">
                          {toPersianNumbers(recordedCount)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {selectedSessionObj && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <div className="font-bold text-slate-700 dark:text-slate-300">
                    جلسه انتخاب‌شده: <strong className="text-slate-900 dark:text-white">{selectedSessionObj.title}</strong>
                  </div>
                  <div className="text-slate-500">
                    {selectedSessionObj.presenterMode === 'unspecified'
                      ? 'ارائه‌دهنده: بدون ذکر مدرس'
                      : `ارائه‌دهنده: ${selectedSessionObj.presenterName || course.instructor}`}
                  </div>
                </div>
              )}

              {/* Attendance Table */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-3">نام شرکت‌کننده</th>
                      <th className="p-3 text-center">نسبت حضور کل</th>
                      <th className="p-3 text-center">وضعیت در این جلسه</th>
                      <th className="p-3">یادداشت استاد / مدیر</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {opsLoading ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-slate-400">
                          در حال بارگذاری سوابق حضور و غیاب...
                        </td>
                      </tr>
                    ) : activeClassEnrollments.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-slate-400">
                          شرکت‌کننده فعالی برای ثبت حضور و غیاب وجود ندارد.
                        </td>
                      </tr>
                    ) : (
                      activeClassEnrollments.map(enr => {
                        const draft = draftAttendance[enr.userId];
                        const currentStatus = draft?.status;
                        const totalPresent = serverAttendance.filter(
                          a => a.userId === enr.userId && (a.status === 'present' || a.status === 'late')
                        ).length;

                        return (
                          <tr key={enr.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="p-3">
                              <strong className="text-slate-900 dark:text-white block font-black">
                                {enr.userName}
                              </strong>
                              <span className="text-[10px] text-slate-400 font-mono tabular-nums">
                                {toPersianNumbers(enr.userNationalId || enr.userPhone)}
                              </span>
                            </td>
                            <td className="p-3 text-center font-mono font-bold tabular-nums text-slate-600 dark:text-slate-300">
                              {toPersianNumbers(totalPresent)} از {toPersianNumbers(sessionsList.length)} جلسه
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1 flex-wrap">
                                {[
                                  { key: 'present', label: 'حاضر', activeCls: 'bg-emerald-600 text-white', idleCls: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' },
                                  { key: 'late', label: 'با تاخیر', activeCls: 'bg-sky-600 text-white', idleCls: 'bg-sky-500/10 text-sky-700 dark:text-sky-300' },
                                  { key: 'excused', label: 'موجه', activeCls: 'bg-amber-600 text-white', idleCls: 'bg-amber-500/10 text-amber-700 dark:text-amber-300' },
                                  { key: 'absent', label: 'غایب', activeCls: 'bg-rose-600 text-white', idleCls: 'bg-rose-500/10 text-rose-700 dark:text-rose-300' },
                                ].map(opt => (
                                  <button
                                    key={opt.key}
                                    type="button"
                                    onClick={() =>
                                      setDraftAttendance(prev => ({
                                        ...prev,
                                        [enr.userId]: {
                                          status: opt.key as AttendanceStatusType,
                                          note: prev[enr.userId]?.note || '',
                                        },
                                      }))
                                    }
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                                      currentStatus === opt.key ? opt.activeCls : opt.idleCls
                                    }`}
                                  >
                                    {opt.label}
                                  </button>
                                ))}
                              </div>
                            </td>
                            <td className="p-3">
                              <input
                                type="text"
                                value={draft?.note || ''}
                                onChange={e =>
                                  setDraftAttendance(prev => ({
                                    ...prev,
                                    [enr.userId]: {
                                      status: prev[enr.userId]?.status || 'present',
                                      note: e.target.value,
                                    },
                                  }))
                                }
                                placeholder="توضیح اختیاری..."
                                className="w-full px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs"
                              />
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: POST-ENROLLMENT CUSTOMIZATION & DISK FILES */}
          {activeTab === 'post_enrollment' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-950 dark:text-amber-200 space-y-1">
                <div className="flex items-center gap-2 font-black text-sm">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>مدیریت محتوای تالار کلاس، لینک‌های آنلاین و پوشه فایل‌های دیسک دوره</span>
                </div>
                <p className="text-[11px] leading-relaxed opacity-90">
                  کلیه شرکت‌کنندگان تاییدشده (به‌جز افراد حذف‌شده از کلاس) به فایل‌ها و لینک‌های این بخش دسترسی خواهند داشت.
                </p>
              </div>

              {saveSuccessNotice && (
                <div className="p-3.5 rounded-2xl bg-emerald-100 text-emerald-900 font-bold flex items-center gap-2 border border-emerald-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                  <span>تنظیمات و فایل‌های دوره با موفقیت در پایگاه داده ذخیره گردید.</span>
                </div>
              )}
              {postSaveError && (
                <div className="p-3.5 rounded-2xl bg-rose-100 text-rose-900 font-bold flex items-center gap-2 border border-rose-300">
                  <span>{postSaveError}</span>
                </div>
              )}

              {/* 1. Post-Enrollment Banner with fast compression */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <h4 className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-emerald-600" />
                    <span>بنر اختصاصی بالای صفحه تالار دوره:</span>
                  </h4>
                  {bannerStats && (
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold tabular-nums">
                      {bannerStats}
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {bannerPreviewLocal || postBanner ? (
                    <div className="w-44 h-24 rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-700 shrink-0 relative group">
                      <img src={bannerPreviewLocal || postBanner} alt="بنر دوره" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setBannerPreviewLocal(null);
                          setBannerStats(null);
                          setPostBanner('');
                        }}
                        className="absolute top-1 left-1 p-1 rounded-full bg-rose-600 text-white shadow-xs cursor-pointer"
                        title="حذف بنر (پاکسازی از دیسک پس از ذخیره)"
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
                    <div className="flex items-center gap-2 flex-wrap">
                      <label className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer inline-flex items-center gap-1.5 shadow-sm">
                        {bannerUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                        <span>{bannerUploading ? 'در حال فشرده‌سازی و ذخیره...' : 'آپلود سریع تصویر بنر'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleBannerUpload}
                          disabled={bannerUploading}
                          className="hidden"
                        />
                      </label>
                      <span className="text-slate-400 text-[11px]">یا لینک مستقیم تصویر:</span>
                    </div>
                    {bannerError && <p className="text-[11px] font-bold text-rose-600">{bannerError}</p>}
                    <input
                      type="text"
                      value={postBanner}
                      onChange={e => {
                        setBannerPreviewLocal(null);
                        setPostBanner(e.target.value);
                      }}
                      placeholder="https://... یا /api/storage/..."
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
                    <span>باکس پیام خوش‌آمدگویی و راهنمای ثبت‌نام:</span>
                  </h4>
                  <div className="flex items-center gap-3">
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

                <textarea
                  rows={3}
                  value={postMessage}
                  onChange={e => setPostMessage(e.target.value)}
                  className="w-full p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium leading-relaxed"
                />
              </div>

              {/* 3. Online Courses Settings */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4">
                <h4 className="font-black text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                  <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
                  <span>تنظیمات جلسه آنلاین (زمان‌بندی و لینک ورود):</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 dark:text-slate-300">تاریخ برگزاری / اولین جلسه:</label>
                    <input
                      type="text"
                      value={reminderDate}
                      onChange={e => setReminderDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 dark:text-slate-300">روزها و ساعت برگزاری:</label>
                    <input
                      type="text"
                      value={reminderSchedule}
                      onChange={e => setReminderSchedule(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="font-bold text-slate-700 dark:text-slate-300">لینک ورود به کلاس آنلاین:</label>
                    <input
                      type="text"
                      value={onlineMeetingLink}
                      onChange={e => setOnlineMeetingLink(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono dir-ltr font-bold text-emerald-700 dark:text-emerald-400"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="font-bold text-slate-700 dark:text-slate-300">راهنمای ورود:</label>
                    <input
                      type="text"
                      value={accessGuide}
                      onChange={e => setAccessGuide(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Per-Course Disk Folder + Download Links */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                  <div>
                    <h4 className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <HardDrive className="w-4 h-4 text-sky-600" />
                      <span>پوشه دیسک اختصاصی و فایل‌های دانلودی دوره (آفلاین / جلسات):</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      می‌توانید فایل را اینجا بارگذاری کنید، مستقیماً در پوشه دیسک قرار داده و اسکن کنید، یا لینک خارجی بیفزایید.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-[10px] font-mono dir-ltr">
                    storage/uploads/course_files/course_{course.id}/
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 dark:text-slate-300">راهنمای دانلود برای شرکت‌کنندگان:</label>
                    <textarea
                      rows={2}
                      value={offlineGuide}
                      onChange={e => setOfflineGuide(e.target.value)}
                      className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                    />
                  </div>

                  {/* Upload & Disk Scan Controls */}
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      ref={courseFileInputRef}
                      type="file"
                      accept=".zip,.rar,.7z,.pdf,.doc,.docx,.ppt,.pptx,.mp3,.mp4,.m4a,.wav,.webm,.jpg,.jpeg,.png,.webp"
                      onChange={handleUploadCourseDiskFile}
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={uploadingCourseFile}
                      onClick={() => courseFileInputRef.current?.click()}
                      className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-black text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                    >
                      {uploadingCourseFile ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                      <span>{uploadingCourseFile ? 'در حال ذخیره در پوشه دوره...' : 'بارگذاری فایل روی دیسک دوره'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={scanningDisk}
                      onClick={handleScanDiskFolder}
                      className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                    >
                      {scanningDisk ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderOpen className="w-4 h-4 text-amber-400" />}
                      <span>اسکن فایل‌های موجود در پوشه دیسک دوره</span>
                    </button>
                  </div>

                  {/* Disk Folder Browser */}
                  {diskInfo && (
                    <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800/60 space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-600 dark:text-slate-300">
                          محتوای فعلی پوشه دیسک (<span className="font-mono dir-ltr">{diskInfo.relativeDiskPath}</span>):
                        </span>
                        <button
                          type="button"
                          onClick={handleScanDiskFolder}
                          className="text-sky-600 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>بازخوانی</span>
                        </button>
                      </div>

                      {diskInfo.files.length === 0 ? (
                        <p className="text-[11px] text-slate-400">
                          فایلی روی دیسک در پوشه این دوره موجود نیست.
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          {diskInfo.files.map(df => {
                            const attached = offlineFiles.some(f => f.url === df.url);
                            return (
                              <div
                                key={df.filename}
                                className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-800 font-mono text-[10px] font-bold">
                                    {df.format}
                                  </span>
                                  <span className="font-mono text-[11px] truncate dir-ltr">{df.filename}</span>
                                  <span className="text-[10px] text-slate-400 tabular-nums shrink-0">{df.sizeLabel}</span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {attached ? (
                                    <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 text-[10px] font-bold">
                                      در لیست دانلود
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleAttachDiskFile(df)}
                                      className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-[10px] font-bold cursor-pointer"
                                    >
                                      + اتصال به لیست دانلود
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteDiskFile(df.filename, df.url)}
                                    className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                                    title="حذف فیزیکی از دیسک"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Active Offline/Download Files List */}
                  <div className="space-y-2">
                    <label className="font-bold text-slate-700 dark:text-slate-300 block">
                      فهرست فایل‌ها و لینک‌های ارائه‌شده به شرکت‌کنندگان ({toPersianNumbers(offlineFiles.length)}):
                    </label>
                    {offlineFiles.length === 0 ? (
                      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 text-center text-slate-400">
                        هنوز فایل یا لینک دانلودی برای این دوره ثبت نشده است.
                      </div>
                    ) : (
                      offlineFiles.map((file, idx) => (
                        <div
                          key={file.id || idx}
                          className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-9 h-8 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center font-bold text-[10px] shrink-0">
                              {file.format || 'FILE'}
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900 dark:text-white truncate">{file.title}</span>
                                {file.sessionNumber && (
                                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 text-[10px] font-bold shrink-0">
                                    جلسه {toPersianNumbers(file.sessionNumber)}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono truncate block dir-ltr">
                                {file.url} · {file.size}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              disabled={downloadingUrl === file.url}
                              onClick={() => handleDownloadPreview(file.url, file.title, file.filename)}
                              className="px-2.5 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-700 dark:text-sky-300 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                            >
                              {downloadingUrl === file.url ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Download className="w-3.5 h-3.5" />
                              )}
                              <span>تست دانلود</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveOfflineFile(file.id)}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                              title="حذف از فهرست دوره"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add New File Row */}
                  <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 space-y-2">
                    <span className="font-bold text-emerald-900 dark:text-emerald-300 text-[11px] block">
                      افزودن لینک دانلود جدید (خارجی یا مسیر دیسک):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                      <input
                        type="text"
                        value={newFileTitle}
                        onChange={e => setNewFileTitle(e.target.value)}
                        placeholder="عنوان فایل (مثال: صوت جلسه اول)"
                        className="sm:col-span-4 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs"
                      />
                      <input
                        type="text"
                        value={newFileUrl}
                        onChange={e => setNewFileUrl(e.target.value)}
                        placeholder="لینک دانلود (https://...)"
                        className="sm:col-span-4 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono dir-ltr"
                      />
                      <input
                        type="text"
                        value={newFileSize}
                        onChange={e => setNewFileSize(e.target.value)}
                        placeholder="حجم"
                        className="sm:col-span-2 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleAddOfflineFile}
                        className="sm:col-span-2 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>افزودن</span>
                      </button>
                    </div>
                    {offlineFileError && <p className="text-[11px] font-bold text-rose-600 pt-1">{offlineFileError}</p>}
                  </div>
                </div>
              </div>

              {/* Save Button for Tab 3 */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  disabled={isSavingPostContent}
                  onClick={handleSavePostContent}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md flex items-center gap-2 cursor-pointer transition-transform active:scale-95 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingPostContent ? 'در حال ذخیره‌سازی...' : 'ذخیره دائمی تنظیمات و فایل‌های دوره'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: COURSE INFO SUMMARY */}
          {activeTab === 'course_info' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="font-black text-slate-900 dark:text-white">مشخصات کلی، اساتید و جلسات دوره:</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">اساتید دوره:</span>
                    <strong className="text-slate-900 dark:text-white">
                      {course.instructors && course.instructors.length > 0
                        ? course.instructors.map(i => i.fullName).join('، ')
                        : course.instructor}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">شهریه رسمی:</span>
                    <strong className="text-emerald-600 font-bold tabular-nums">
                      {course.price > 0 ? `${toPersianNumbers(course.price.toLocaleString('fa-IR'))} تومان` : 'رایگان'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">تعداد جلسات / ساعت:</span>
                    <strong className="text-slate-900 dark:text-white tabular-nums">
                      {toPersianNumbers(sessionsList.length)} جلسه · {toPersianNumbers(course.hours)} ساعت
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">شیوه پرداخت مجاز:</span>
                    <strong className="text-slate-900 dark:text-white">
                      {course.allowedPaymentMethod === 'both'
                        ? 'درگاه شتاب + فیش'
                        : course.allowedPaymentMethod === 'gateway_only'
                        ? 'فقط درگاه آنلاین'
                        : 'فقط فیش بانکی'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">وضعیت برگزاری:</span>
                    <strong className="text-slate-900 dark:text-white">
                      {course.status === 'enrolling'
                        ? 'در حال ثبت‌نام'
                        : course.status === 'ongoing'
                        ? 'در حال برگزاری'
                        : 'آرشیو شده'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">ظرفیت کل کلاس:</span>
                    <strong className="text-slate-900 dark:text-white tabular-nums">
                      {toPersianNumbers(course.capacity)} نفر
                    </strong>
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
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs flex items-center gap-2 cursor-pointer"
                >
                  <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
                  <span>ویرایش کامل ساختار، اساتید و جلسات در سازنده دوره</span>
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
            className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
          >
            بستن پنل مدیریتی
          </button>
        </div>
      </motion.div>
    </div>
  );
};
