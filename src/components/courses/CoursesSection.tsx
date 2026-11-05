import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { Course, CourseEnrollment, CourseResource } from '../../types';
import { ModernMetricCard } from '../common/ModernMetricCard';
import { toPersianNumbers } from '../../utils/persianNumbers';
import {
  GraduationCap,
  Calendar,
  Clock,
  User,
  ExternalLink,
  CheckCircle,
  Plus,
  PlayCircle,
  FileDown,
  BookOpen,
  X,
  Search,
  Filter,
  CreditCard,
  UploadCloud,
  FileText,
  ShieldCheck,
  Video,
  MapPin,
  Award,
  HelpCircle,
  AlertCircle,
  CheckCircle2,
  Copy,
  ChevronLeft,
  ChevronRight,
  Eye,
  Layers,
  Sparkles,
  Lock,
  Unlock,
  Radio,
  Building,
  CheckCheck,
  RotateCcw,
  SlidersHorizontal,
  Info,
  Trash2,
  MessageSquare,
  Send,
  Users,
  ZoomIn,
  Image as ImageIcon,
  KeyRound,
  ShieldAlert,
  Phone,
  Smartphone,
  RefreshCw,
  Archive,
  ArrowRight,
  Download,
  Check,
  XCircle,
  Paperclip,
  Settings
} from 'lucide-react';
import { CourseAdminPanelModal } from './CourseAdminPanelModal';

const PRESET_COURSE_COVERS = [
  {
    title: 'فقه القضاء و فناوری',
    url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
  },
  {
    title: 'داوری تجاری و قراردادها',
    url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=80',
  },
  {
    title: 'دادگاه کیفری و ادله اثبات',
    url: 'https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=800&auto=format&fit=crop&q=80',
  },
  {
    title: 'بلاک‌چین و جرایم رمزارز',
    url: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=800&auto=format&fit=crop&q=80',
  },
  {
    title: 'متون فقهی و دروس حوزوی',
    url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop&q=80',
  },
  {
    title: 'اقتصاد و رسیدگی به مفاسد',
    url: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&auto=format&fit=crop&q=80',
  },
];

const SAMPLE_RECEIPT_IMAGE = 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=60';

export const CoursesSection: React.FC = () => {
  const {
    currentUser,
    courses,
    courseEnrollments,
    enrollCourseWithDetails,
    addCourse,
    updateCourse,
    softDeleteCourse,
    restoreCourse,
    sendCourseSms,
    reviewCourseEnrollment,
    sendPinOtpSms,
    securityPin,
  } = useApp();

  const isOfficial = currentUser?.role === 'admin' || currentUser?.role === 'supervisor';

  // Navigation Tabs: 'available' | 'my_courses' | 'archive' | 'admin_panel' | 'deleted_courses'
  const [activeTab, setActiveTab] = useState<'available' | 'my_courses' | 'archive' | 'admin_panel' | 'deleted_courses'>('available');
  const [searchQuery, setSearchQuery] = useState('');
  const [formatFilter, setFormatFilter] = useState<'all' | 'online' | 'in_person' | 'hybrid'>('all');

  // Image Lightbox Viewer
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string; subtitle?: string } | null>(null);

  // Modals
  const [registrationCourse, setRegistrationCourse] = useState<Course | null>(null);
  const [regStep, setRegStep] = useState<1 | 2 | 3>(1);
  const [regTermsAccepted, setRegTermsAccepted] = useState(false);
  const [regPaymentMethod, setRegPaymentMethod] = useState<'online_gateway' | 'bank_receipt'>('bank_receipt');

  const existingEnrollment = useMemo(() => {
    if (!registrationCourse || !currentUser) return null;
    return courseEnrollments.find(e => e.courseId === registrationCourse.id && e.userId === currentUser.id);
  }, [registrationCourse, currentUser, courseEnrollments]);

  const isAlreadyEnrolled = Boolean(existingEnrollment);
  
  // Bank Receipt Form Data
  const [receiptTrackingCode, setReceiptTrackingCode] = useState('');
  const [receiptBankName, setReceiptBankName] = useState('بانک ملی ایران (واریز پایا)');
  const [receiptDate, setReceiptDate] = useState('۱۴۰۳/۰۸/۰۵');
  const [receiptFilePreview, setReceiptFilePreview] = useState<string>(SAMPLE_RECEIPT_IMAGE);
  const [receiptFileName, setReceiptFileName] = useState<string>('receipt_scan_national_bank.jpg');
  const [receiptFileSize, setReceiptFileSize] = useState<string>('۲۴۵ کیلوبایت');
  const [lastSubmittedTracking, setLastSubmittedTracking] = useState<string>('');
  const receiptFileInputRef = useRef<HTMLInputElement>(null);

  // Course Details / Attendance Modal
  const [attendanceCourse, setAttendanceCourse] = useState<Course | null>(null);

  // Dedicated Admin Course Management Modal
  const [dedicatedCourseAdmin, setDedicatedCourseAdmin] = useState<Course | null>(null);

  // Admin Receipt Inspection Modal
  const [inspectingEnrollment, setInspectingEnrollment] = useState<CourseEnrollment | null>(null);

  // Participant Roster Modal for a Specific Course
  const [courseForRoster, setCourseForRoster] = useState<Course | null>(null);
  const [rosterSearch, setRosterSearch] = useState('');
  const [rosterStatusFilter, setRosterStatusFilter] = useState<'all' | 'confirmed' | 'pending_review' | 'rejected'>('all');
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  // Bulk & Single SMS Dispatch Modal
  const [smsModal, setSmsModal] = useState<{
    course: Course;
    recipient: 'all' | CourseEnrollment;
  } | null>(null);
  const [smsMessage, setSmsMessage] = useState('');
  const [smsTemplateKey, setSmsTemplateKey] = useState<string>('custom');
  const [isSendingSms, setIsSendingSms] = useState(false);
  const [smsFeedback, setSmsFeedback] = useState<string | null>(null);

  // Soft Delete Course with PIN Verification Modal
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [deletePinInput, setDeletePinInput] = useState('');
  const [deleteSmsNotice, setDeleteSmsNotice] = useState<string | null>(null);
  const [isDeletingCourse, setIsDeletingCourse] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Course Builder / Editor Modal
  const [courseBuilderOpen, setCourseBuilderOpen] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const courseCoverInputRef = useRef<HTMLInputElement>(null);
  const [builderForm, setBuilderForm] = useState<{
    title: string;
    instructor: string;
    instructorTitle: string;
    category: string;
    level: string;
    hours: number;
    capacity: number;
    schedule: string;
    startDate: string;
    endDate: string;
    holdingFormat: 'online' | 'in_person' | 'hybrid';
    venueAddress: string;
    meetingLink: string;
    meetingAccessGuide: string;
    hasCoverImage: boolean;
    coverImage: string;
    allowedPaymentMethod: 'both' | 'gateway_only' | 'receipt_only';
    price: number;
    hasInstallments: boolean;
    installmentDetails: string;
    hasCertificate: boolean;
    certificateDetails: string;
    hasPrerequisites: boolean;
    prerequisites: string;
    description: string;
    topics: string[];
    newTopicInput: string;
    customTags: string[];
    newTagInput: string;
    status: 'enrolling' | 'ongoing' | 'completed';
    archiveAccess: 'all' | 'enrolled_only' | 'restricted';
  }>({
    title: '',
    instructor: '',
    instructorTitle: '',
    category: 'فقه القضاء و فناوری',
    level: 'تخصصی عالی (سطح ۴ و دکتری)',
    hours: 20,
    capacity: 40,
    schedule: 'پنج‌شنبه‌ها از ساعت ۰۹:۰۰ الی ۱۲:۰۰',
    startDate: '۱۴۰۳/۰۹/۰۱',
    endDate: '۱۴۰۳/۱۰/۲۰',
    holdingFormat: 'online',
    venueAddress: 'تهران، مجتمع نخبگان فقه و قضا، سالن شهید بهشتی',
    meetingLink: 'https://lms.feqh-ghaza.ir/room/new-course',
    meetingAccessGuide: 'ورود با نام کاربری کد ملی و کلمه عبور اختصاصی پیامک‌شده.',
    hasCoverImage: true,
    coverImage: PRESET_COURSE_COVERS[0].url,
    allowedPaymentMethod: 'both',
    price: 750000,
    hasInstallments: true,
    installmentDetails: 'امکان پرداخت در ۲ قسط ۵۰ درصدی (زمان ثبت‌نام و نیمه دوره).',
    hasCertificate: true,
    certificateDetails: 'گواهی پایان دوره رسمی ممهور به تمبر و مهر مرکز نخبگان.',
    hasPrerequisites: true,
    prerequisites: 'دانش‌آموختگان سطح ۳ و ۴ حوزوی، قضات محاکم یا کارشناسان ارشد حقوق.',
    description: 'تحلیل تطبیقی و کاربردی مسائل مستحدثه با رویکرد فقهی و حقوقی معاصر.',
    topics: ['مبانی نظری و فقهی', 'بررسی رویه قضایی و آرای وحدت رویه مرتبط'],
    newTopicInput: '',
    customTags: ['گواهی رسمی ممهور', 'امکان پرداخت اقساطی'],
    newTagInput: '',
    status: 'enrolling',
    archiveAccess: 'enrolled_only',
  });

  // Admin Enrollments Filter State
  const [adminEnrollmentStatusFilter, setAdminEnrollmentStatusFilter] = useState<'all' | 'pending_review' | 'confirmed' | 'rejected'>('all');
  const [adminEnrollmentCourseFilter, setAdminEnrollmentCourseFilter] = useState<string>('all');

  // Filtered Courses based on Active Tab
  // IMPORTANT: Non-deleted courses are used for catalog views
  const activeCourses = useMemo(() => courses.filter(c => !c.isDeleted), [courses]);
  const deletedCourses = useMemo(() => courses.filter(c => c.isDeleted), [courses]);

  const availableCourses = useMemo(() => activeCourses.filter(c => c.status === 'enrolling' || c.status === 'ongoing'), [activeCourses]);
  const myEnrolledCourses = useMemo(() => {
    return activeCourses.filter(c => {
      const hasEnroll = courseEnrollments.some(e => e.courseId === c.id && e.userId === currentUser?.id);
      return c.isEnrolled || hasEnroll;
    });
  }, [activeCourses, courseEnrollments, currentUser]);
  const archivedCourses = useMemo(() => activeCourses.filter(c => c.status === 'completed'), [activeCourses]);

  // Pending Enrollments Count for Admin
  const pendingReceiptsCount = useMemo(() => {
    return courseEnrollments.filter(e => e.paymentStatus === 'pending_review').length;
  }, [courseEnrollments]);

  const currentList = useMemo(() => {
    let list: Course[] = [];
    if (activeTab === 'available') list = availableCourses;
    else if (activeTab === 'my_courses') list = myEnrolledCourses;
    else if (activeTab === 'archive') list = archivedCourses;
    else if (activeTab === 'deleted_courses') list = deletedCourses;
    else list = activeCourses;

    return list.filter(c => {
      if (formatFilter !== 'all' && c.holdingFormat !== formatFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          c.title.toLowerCase().includes(q) ||
          c.instructor.toLowerCase().includes(q) ||
          (c.category && c.category.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [activeTab, availableCourses, myEnrolledCourses, archivedCourses, deletedCourses, activeCourses, formatFilter, searchQuery]);

  // Handler: Start Registration Journey
  const handleOpenRegistration = (course: Course) => {
    setRegistrationCourse(course);
    setRegStep(1);
    setRegTermsAccepted(false);

    // Gating payment method based on course policy
    const policy = course.allowedPaymentMethod || 'both';
    if (policy === 'gateway_only') {
      setRegPaymentMethod('online_gateway');
    } else {
      setRegPaymentMethod('bank_receipt');
    }

    setReceiptTrackingCode(`TRX-${Math.floor(1000000 + Math.random() * 9000000)}`);
  };

  // Handler: Real Receipt File Upload via FileReader
  const handleReceiptFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setReceiptFileName(file.name);
    const sizeKb = Math.round(file.size / 1024);
    setReceiptFileSize(`${toPersianNumbers(sizeKb)} کیلوبایت`);

    const reader = new FileReader();
    reader.onload = event => {
      if (typeof event.target?.result === 'string') {
        setReceiptFilePreview(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handler: Real Course Cover Image File Upload via FileReader
  const handleCourseCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      if (typeof event.target?.result === 'string') {
        setBuilderForm(prev => ({
          ...prev,
          coverImage: event.target?.result as string,
          hasCoverImage: true,
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Handler: Submit Registration (Step 2 -> Step 3)
  const handleSubmitRegistration = async () => {
    if (!registrationCourse) return;

    const trackingCode = regPaymentMethod === 'online_gateway'
      ? `SHP-${Date.now().toString().slice(-7)}`
      : receiptTrackingCode.trim() || `TRX-${Date.now().toString().slice(-7)}`;

    setLastSubmittedTracking(trackingCode);

    try {
      await enrollCourseWithDetails(registrationCourse.id, {
        paymentMethod: regPaymentMethod,
        trackingCode,
        receiptBankName: receiptBankName,
        receiptDate: receiptDate,
        receiptFileUrl: receiptFilePreview,
        amountPaid: registrationCourse.price,
      });

      setRegStep(3);
    } catch {
      // Handled in AppContext
    }
  };

  // Handler: Open Attendance Modal
  const handleOpenAttendance = (course: Course) => {
    setAttendanceCourse(course);
  };

  // Handler: Start Soft Delete Course (PIN required)
  const handleStartCourseDelete = async (course: Course) => {
    setCourseToDelete(course);
    setDeletePinInput('');
    setDeleteError(null);
    setDeleteSmsNotice('در حال صدور و ارسال رمز یک‌بارمصرف (PIN) به تلفن همراه...');

    try {
      const otpRes = await sendPinOtpSms();
      setDeleteSmsNotice(`کد تایید ۶ رقمی امنیتی (${otpRes.otpCode}) به شماره همراه مدیر سامانه ارسال گردید.`);
    } catch {
      setDeleteSmsNotice('کد تایید امنیتی به شماره همراه شما پیامک گردید. (پین پیش‌فرض: 123456)');
    }
  };

  // Handler: Execute Soft Delete with PIN
  const handleConfirmSoftDelete = async () => {
    if (!courseToDelete) return;
    if (!deletePinInput || deletePinInput.trim().length < 4) {
      setDeleteError('لطفاً پین کد امنیتی حداقل ۴ رقمی را وارد نمایید.');
      return;
    }

    setIsDeletingCourse(true);
    setDeleteError(null);

    try {
      await softDeleteCourse(courseToDelete.id, deletePinInput.trim());
      setCourseToDelete(null);
      setDeletePinInput('');
      alert(`دوره [${courseToDelete.title}] با موفقیت حذف منطقی (Safe Delete) شد. کلیه سوابق ثبت‌نام و پرداخت‌های مالی به طور ماندگار حفظ گردیدند.`);
    } catch (err: any) {
      setDeleteError(err.message || 'پین کد امنیتی وارد شده نادرست است.');
    } finally {
      setIsDeletingCourse(false);
    }
  };

  // Handler: Restore a soft-deleted course
  const handleRestoreCourse = async (course: Course) => {
    try {
      await restoreCourse(course.id);
      alert(`دوره [${course.title}] با موفقیت از بایگانی بازیابی شد و به فهرست دوره‌های فعال بازگشت.`);
    } catch (err: any) {
      alert(`خطا در بازیابی دوره: ${err.message}`);
    }
  };

  // Handler: Open SMS Modal
  const handleOpenSmsModal = (course: Course, recipient: 'all' | CourseEnrollment) => {
    setSmsModal({ course, recipient });
    setSmsFeedback(null);
    setSmsTemplateKey('welcome');

    if (recipient === 'all') {
      setSmsMessage(`سلام علیکم؛ با توجه به نزدیکی زمان آغاز دوره تخصصی [${course.title}]، اطلاعات حضور و لینک کلاس به زودی در میز کار شما فعال خواهد شد. دبیرخانه آموزش مرکز نخبگان فقه و قضا`);
    } else {
      setSmsMessage(`سلام علیکم جناب آقای ${recipient.userName}؛ ثبت‌نام شما در دوره تخصصی [${course.title}] بررسی شد. لطفاً جهت پیگیری امور آموزشی به سامانه نخبگان مراجعه فرمایید.`);
    }
  };

  // Handler: Apply Template to SMS
  const handleApplySmsTemplate = (key: string) => {
    setSmsTemplateKey(key);
    if (!smsModal) return;

    const courseTitle = smsModal.course.title;
    const recipientName = smsModal.recipient === 'all' ? 'فراگیر گرامی' : smsModal.recipient.userName;

    switch (key) {
      case 'link':
        setSmsMessage(`سلام علیکم ${recipientName}؛ لینک ورود مستقیم به کلاس برخط دوره [${courseTitle}]: ${smsModal.course.meetingLink} - نام کاربری: کد ملی شما. لطفا ۱۰ دقیقه قبل از شروع وارد شوید.`);
        break;
      case 'schedule':
        setSmsMessage(`سلام علیکم ${recipientName}؛ جلسه بعدی دوره [${courseTitle}] در زمان ${smsModal.course.schedule} تشکیل خواهد شد. حضور به موقع مزید امتنان است.`);
        break;
      case 'receipt_fix':
        setSmsMessage(`سلام علیکم ${recipientName}؛ فیش واریزی ارسالی شما برای دوره [${courseTitle}] دارای نقص است. لطفاً نسبت به بارگذاری مجدد تصویر فیش واضح در سامانه اقدام فرمایید.`);
        break;
      case 'certificate':
        setSmsMessage(`سلام علیکم ${recipientName}؛ گواهی رسمی پایان دوره تخصصی [${courseTitle}] صادر گردید و در پرونده آموزشی شما در سامانه قابل دریافت است.`);
        break;
      case 'welcome':
      default:
        setSmsMessage(`سلام علیکم ${recipientName}؛ ثبت‌نام شما در دوره [${courseTitle}] با موفقیت تایید شد. راهنمای کلاس در پنل کاربری در دسترس است.`);
        break;
    }
  };

  // Handler: Send SMS
  const handleSendSms = async () => {
    if (!smsModal || !smsMessage.trim()) return;

    setIsSendingSms(true);
    setSmsFeedback(null);

    try {
      const recipientPhone = smsModal.recipient === 'all' ? 'all' : smsModal.recipient.userPhone;
      const recipientName = smsModal.recipient === 'all' ? 'کلیه شرکت‌کنندگان' : smsModal.recipient.userName;

      const res = await sendCourseSms(smsModal.course.id, recipientPhone, smsMessage.trim(), recipientName);
      setSmsFeedback(res.message);
      setTimeout(() => {
        setSmsModal(null);
        setSmsFeedback(null);
      }, 2000);
    } catch (err: any) {
      alert(`خطا در ارسال پیامک: ${err.message}`);
    } finally {
      setIsSendingSms(false);
    }
  };

  // Handler: Open Course Builder for Add or Edit
  const handleOpenCourseBuilder = (courseToEdit?: Course) => {
    if (courseToEdit) {
      setEditingCourseId(courseToEdit.id);
      setBuilderForm({
        title: courseToEdit.title,
        instructor: courseToEdit.instructor,
        instructorTitle: courseToEdit.instructorTitle || '',
        category: courseToEdit.category || 'فقه القضاء',
        level: courseToEdit.level,
        hours: courseToEdit.hours,
        capacity: courseToEdit.capacity,
        schedule: courseToEdit.schedule,
        startDate: courseToEdit.startDate || '۱۴۰۳/۰۹/۰۱',
        endDate: courseToEdit.endDate || '۱۴۰۳/۱۰/۲۰',
        holdingFormat: courseToEdit.holdingFormat || 'online',
        venueAddress: courseToEdit.venueAddress || '',
        meetingLink: courseToEdit.meetingLink || '',
        meetingAccessGuide: courseToEdit.meetingAccessGuide || '',
        hasCoverImage: Boolean(courseToEdit.coverImage),
        coverImage: courseToEdit.coverImage || PRESET_COURSE_COVERS[0].url,
        allowedPaymentMethod: courseToEdit.allowedPaymentMethod || 'both',
        price: courseToEdit.price,
        hasInstallments: Boolean(courseToEdit.hasInstallments),
        installmentDetails: courseToEdit.installmentDetails || '',
        hasCertificate: Boolean(courseToEdit.hasCertificate),
        certificateDetails: courseToEdit.certificateDetails || '',
        hasPrerequisites: Boolean(courseToEdit.prerequisites),
        prerequisites: courseToEdit.prerequisites || '',
        description: courseToEdit.description,
        topics: courseToEdit.topics || [],
        newTopicInput: '',
        customTags: courseToEdit.customTags || ['گواهی رسمی ممهور', 'امکان پرداخت اقساطی'],
        newTagInput: '',
        status: courseToEdit.status,
        archiveAccess: courseToEdit.archiveAccess || 'enrolled_only',
      });
    } else {
      setEditingCourseId(null);
      setBuilderForm({
        title: '',
        instructor: '',
        instructorTitle: '',
        category: 'فقه القضاء و فناوری',
        level: 'تخصصی عالی (سطح ۴ و دکتری)',
        hours: 20,
        capacity: 40,
        schedule: 'پنج‌شنبه‌ها از ساعت ۰۹:۰۰ الی ۱۲:۰۰',
        startDate: '۱۴۰۳/۰۹/۰۱',
        endDate: '۱۴۰۳/۱۰/۲۰',
        holdingFormat: 'online',
        venueAddress: 'تهران، مجتمع نخبگان فقه و قضا، سالن شهید بهشتی',
        meetingLink: 'https://lms.feqh-ghaza.ir/room/new-course',
        meetingAccessGuide: 'ورود با نام کاربری کد ملی و کلمه عبور اختصاصی پیامک‌شده.',
        hasCoverImage: true,
        coverImage: PRESET_COURSE_COVERS[0].url,
        allowedPaymentMethod: 'both',
        price: 750000,
        hasInstallments: true,
        installmentDetails: 'امکان پرداخت در ۲ قسط ۵۰ درصدی.',
        hasCertificate: true,
        certificateDetails: 'اعطای گواهی معتبر ممهور به مهر مرکز نخبگان.',
        hasPrerequisites: true,
        prerequisites: 'دانش‌آموختگان سطح ۳ و ۴ حوزوی، قضات محاکم یا کارشناسان ارشد حقوق.',
        description: 'تحلیل تطبیقی و کاربردی مسائل مستحدثه با رویکرد فقهی و حقوقی معاصر.',
        topics: ['مبانی نظری و فقهی', 'بررسی رویه قضایی و آرای وحدت رویه'],
        newTopicInput: '',
        customTags: ['گواهی رسمی ممهور', 'امکان پرداخت اقساطی'],
        newTagInput: '',
        status: 'enrolling',
        archiveAccess: 'enrolled_only',
      });
    }
    setCourseBuilderOpen(true);
  };

  // Handler: Save Course Builder
  const handleSaveCourseBuilder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!builderForm.title.trim() || !builderForm.instructor.trim()) {
      alert('لطفاً عنوان دوره و نام استاد را وارد نمایید.');
      return;
    }

    const payload: Partial<Course> = {
      title: builderForm.title.trim(),
      instructor: builderForm.instructor.trim(),
      instructorTitle: builderForm.instructorTitle.trim(),
      category: builderForm.category,
      level: builderForm.level,
      hours: Number(builderForm.hours),
      capacity: Number(builderForm.capacity),
      schedule: builderForm.schedule,
      startDate: builderForm.startDate,
      endDate: builderForm.endDate,
      holdingFormat: builderForm.holdingFormat,
      venueAddress: builderForm.holdingFormat !== 'online' ? builderForm.venueAddress : undefined,
      meetingLink: builderForm.holdingFormat !== 'in_person' ? builderForm.meetingLink : 'https://lms.feqh-ghaza.ir/class',
      meetingAccessGuide: builderForm.meetingAccessGuide,
      coverImage: builderForm.hasCoverImage ? builderForm.coverImage : undefined,
      allowedPaymentMethod: builderForm.allowedPaymentMethod,
      price: Number(builderForm.price),
      hasInstallments: builderForm.hasInstallments,
      installmentDetails: builderForm.hasInstallments ? builderForm.installmentDetails : undefined,
      hasCertificate: builderForm.hasCertificate,
      certificateDetails: builderForm.hasCertificate ? builderForm.certificateDetails : undefined,
      prerequisites: builderForm.hasPrerequisites ? builderForm.prerequisites : undefined,
      description: builderForm.description,
      topics: builderForm.topics,
      customTags: builderForm.customTags,
      status: builderForm.status,
      archiveAccess: builderForm.archiveAccess,
    };

    if (editingCourseId) {
      await updateCourse(editingCourseId, payload);
    } else {
      await addCourse(payload);
    }
    setCourseBuilderOpen(false);
  };

  // Copy helper with feedback
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPhone(id);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  // Admin filtered enrollments list for General Tab
  const filteredEnrollments = courseEnrollments.filter(e => {
    if (adminEnrollmentStatusFilter !== 'all' && e.paymentStatus !== adminEnrollmentStatusFilter) return false;
    if (adminEnrollmentCourseFilter !== 'all' && e.courseId !== adminEnrollmentCourseFilter) return false;
    return true;
  });

  // Enrollments specific to the selected course roster modal
  const rosterEnrollments = useMemo(() => {
    if (!courseForRoster) return [];
    return courseEnrollments.filter(e => {
      if (e.courseId !== courseForRoster.id) return false;
      if (rosterStatusFilter !== 'all' && e.paymentStatus !== rosterStatusFilter) return false;
      if (rosterSearch.trim()) {
        const q = rosterSearch.toLowerCase();
        return (
          e.userName.toLowerCase().includes(q) ||
          e.userPhone.includes(q) ||
          e.userNationalId.includes(q) ||
          e.trackingCode.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [courseForRoster, courseEnrollments, rosterStatusFilter, rosterSearch]);

  return (
    <div className="space-y-6" dir="rtl">
      {/* 4 Modern Metric Cards Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <ModernMetricCard
          title="دوره‌های فعال و ترم جاری"
          value={availableCourses.length}
          periodLabel="در حال ثبت‌نام و برگزاری"
          unit="دوره"
          icon={<GraduationCap className="w-4 h-4 text-emerald-500" />}
          onClick={() => setActiveTab('available')}
        />
        <ModernMetricCard
          title="دوره‌های ثبت‌نام‌شده من"
          value={myEnrolledCourses.length}
          periodLabel="دارای دسترسی تاییدشده یا در انتظار"
          unit="دوره"
          icon={<CheckCircle className="w-4 h-4 text-sky-500" />}
          onClick={() => setActiveTab('my_courses')}
        />
        <ModernMetricCard
          title="آرشیو چندرسانه‌ای"
          value={archivedCourses.length}
          periodLabel="صوت، ویدیو و جزوات تخصصی"
          unit="دوره"
          icon={<PlayCircle className="w-4 h-4 text-amber-500" />}
          onClick={() => setActiveTab('archive')}
        />
        {isOfficial ? (
          <ModernMetricCard
            title="فیش‌های در نوبت بررسی"
            value={pendingReceiptsCount}
            periodLabel="تایید مالی و اختصاص دسترسی"
            unit="رسید"
            icon={<ShieldCheck className="w-4 h-4 text-rose-500" />}
            onClick={() => setActiveTab('admin_panel')}
          />
        ) : (
          <ModernMetricCard
            title="مجموع ساعات آموزش"
            value={activeCourses.reduce((acc, c) => acc + c.hours, 0)}
            periodLabel="کارگاه‌های عملی و نظری"
            unit="ساعت"
            icon={<Clock className="w-4 h-4 text-indigo-500" />}
          />
        )}
      </div>

      {/* Main Header Bar */}
      <div className="glass-card rounded-3xl p-6 border border-slate-200 dark:border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              دوره‌های تخصصی و کاربردی فقه و قضا
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              ثبت‌نام آنلاین و ارسال مدارک، شیوه اختصاصی پرداخت، پیش‌نمایش تصویر دوره، مدیریت شرکت‌کنندگان و پیامک گروهی
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          {isOfficial && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleOpenCourseBuilder()}
              className="flex items-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-stone-950 rounded-2xl text-xs font-black shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>تعریف دوره تخصصی جدید</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* Secondary Navigation & Filter Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 glass-card p-3 rounded-2xl border border-slate-200 dark:border-white/10 shadow-xs">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-800/70 rounded-xl text-xs overflow-x-auto scrollbar-none font-bold">
          <button
            onClick={() => setActiveTab('available')}
            className={`px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'available'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            دوره‌های در حال ثبت‌نام ({toPersianNumbers(availableCourses.length)})
          </button>

          <button
            onClick={() => setActiveTab('my_courses')}
            className={`px-4 py-2 rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'my_courses'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>دوره‌های من</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
              {toPersianNumbers(myEnrolledCourses.length)}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('archive')}
            className={`px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'archive'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            آرشیو دوره‌های سابق ({toPersianNumbers(archivedCourses.length)})
          </button>

          {isOfficial && (
            <button
              onClick={() => setActiveTab('admin_panel')}
              className={`px-4 py-2 rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'admin_panel'
                  ? 'bg-amber-500 text-stone-950 shadow-xs font-black'
                  : 'text-amber-600 dark:text-amber-400 hover:text-amber-700'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>پنل تایید فیش‌ها</span>
              {pendingReceiptsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white animate-pulse">
                  {toPersianNumbers(pendingReceiptsCount)}
                </span>
              )}
            </button>
          )}

          {isOfficial && (
            <button
              onClick={() => setActiveTab('deleted_courses')}
              className={`px-4 py-2 rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'deleted_courses'
                  ? 'bg-rose-500 text-white shadow-xs font-black'
                  : 'text-rose-600 dark:text-rose-400 hover:text-rose-700'
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              <span>دوره‌های بایگانی / حذف منطقی ({toPersianNumbers(deletedCourses.length)})</span>
            </button>
          )}
        </div>

        {/* Search & Format Filter */}
        {activeTab !== 'admin_panel' && activeTab !== 'deleted_courses' && (
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-800/70 rounded-xl text-xs">
              <button
                onClick={() => setFormatFilter('all')}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                  formatFilter === 'all'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                همه
              </button>
              <button
                onClick={() => setFormatFilter('online')}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                  formatFilter === 'online'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                مجازی (برخط)
              </button>
              <button
                onClick={() => setFormatFilter('in_person')}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                  formatFilter === 'in_person'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                حضوری
              </button>
            </div>

            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="جستجو در عنوان، استاد، فقه القضا..."
                className="w-full pr-8.5 pl-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-white/5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-slate-400"
              />
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          CONTENT SECTION 1: CATALOG / MY COURSES / ARCHIVE
          ========================================================================= */}
      {activeTab !== 'admin_panel' && activeTab !== 'deleted_courses' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentList.length === 0 ? (
            <div className="col-span-full p-16 text-center text-xs text-slate-400 space-y-3 glass-card rounded-3xl border border-slate-200 dark:border-white/10">
              <GraduationCap className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="font-extrabold text-slate-700 dark:text-slate-300 text-sm">هیچ دوره‌ای با شرایط انتخابی یافت نشد.</p>
              <p>می‌توانید فیلترها را تغییر داده یا از جستجوی دوره استفاده فرمایید.</p>
            </div>
          ) : (
            currentList.map(course => {
              const userEnrollment = courseEnrollments.find(e => e.courseId === course.id && e.userId === currentUser?.id);
              const isEnrolled = Boolean(course.isEnrolled || userEnrollment);
              const enrollmentStatus = userEnrollment?.paymentStatus || course.enrollmentStatus || (course.isEnrolled ? 'confirmed' : undefined);
              const isConfirmed = enrollmentStatus === 'confirmed';
              const isPendingReview = enrollmentStatus === 'pending_review';
              const canAccessArchive = course.archiveAccess === 'all' || isOfficial || isConfirmed;

              const allowedMethod = course.allowedPaymentMethod || 'both';

              return (
                <motion.div
                  key={course.id}
                  whileHover={{ y: -4, scale: 1.01 }}
                  className="glass-card rounded-3xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col justify-between shadow-lg group transition-all"
                >
                  <div>
                    {/* Course Banner Image with Lightbox Click Feature */}
                    <div
                      onClick={() => {
                        if (course.coverImage) {
                          setLightboxImage({
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
                              setDedicatedCourseAdmin(course);
                            } else {
                              handleOpenRegistration(course);
                            }
                          }}
                          className="text-base font-black text-slate-900 dark:text-white line-clamp-2 leading-relaxed min-h-[48px] cursor-pointer hover:text-emerald-600 transition-colors flex-1"
                          title={isOfficial ? "کلیک جهت ورود به پنل مدیریت ویژه این دوره (ثبت‌نامی‌ها، پرداخت‌ها و تنظیم محتوا)" : "کلیک جهت مشاهده کامل توضیحات و ثبت‌نام"}
                        >
                          {course.title}
                        </h3>
                        {isOfficial && (
                          <button
                            onClick={() => setDedicatedCourseAdmin(course)}
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
                      {/* Action buttons: When user is official (Admin/Supervisor), show dedicated course management button instead of user enrollment/class entry */}
                      {isOfficial ? (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setDedicatedCourseAdmin(course)}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-emerald-700/20 cursor-pointer"
                        >
                          <Settings className="w-3.5 h-3.5 text-emerald-200" />
                          <span>پنل مدیریت دوره</span>
                        </motion.button>
                      ) : (
                        /* Regular Alumni Actions */
                        isEnrolled ? (
                          isConfirmed ? (
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleOpenAttendance(course)}
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
                              onClick={() => handleOpenAttendance(course)}
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
                            onClick={() => handleOpenRegistration(course)}
                            className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-black flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
                          >
                            <span>مشاهده و ثبت‌نام</span>
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </motion.button>
                        )
                      )}

                      {/* Officials Management Actions: Roster, Edit, Soft Delete */}
                      {isOfficial && (
                        <div className="flex items-center gap-1 border-r border-slate-300 dark:border-slate-700 pr-1 mr-0.5">
                          <button
                            onClick={() => setCourseForRoster(course)}
                            className="p-2 rounded-xl text-sky-600 hover:text-sky-700 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition-colors"
                            title="لیست شرکت‌کنندگان، مشخصات، شماره تماس و پیامک"
                          >
                            <Users className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleOpenCourseBuilder(course)}
                            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                            title="ویرایش مشخصات دوره"
                          >
                            <SlidersHorizontal className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleStartCourseDelete(course)}
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
            })
          )}
        </div>
      )}

      {/* =========================================================================
          CONTENT SECTION 2: SOFT-DELETED COURSES (بایگانی امن و امکان بازگردانی)
          ========================================================================= */}
      {isOfficial && activeTab === 'deleted_courses' && (
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
                          onClick={() => setLightboxImage({ url: delCourse.coverImage!, title: delCourse.title })}
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
                        onClick={() => setCourseForRoster(delCourse)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>مشاهده سوابق ثبت‌نامی‌ها</span>
                      </button>

                      <button
                        onClick={() => handleRestoreCourse(delCourse)}
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
      )}

      {/* =========================================================================
          CONTENT SECTION 3: ADMIN & SUPERVISOR REGISTRATION MANAGEMENT
          ========================================================================= */}
      {isOfficial && activeTab === 'admin_panel' && (
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
                            onClick={() => setInspectingEnrollment(enr)}
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
                              onClick={() => reviewCourseEnrollment(enr.id, 'confirmed', 'مدارک و فیش بانکی با موفقیت تایید و ثبت‌نام نهایی شد.')}
                              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-xs shadow-xs transition-colors cursor-pointer"
                            >
                              تایید مستندات
                            </button>
                          )}
                          {enr.paymentStatus !== 'rejected' && (
                            <button
                              onClick={() => {
                                const reason = prompt('لطفاً دلیل عدم تایید یا نقص فیش را بنویسید:', 'شماره پیگیری فیش در صورتحساب مرکز مشاهده نشد.');
                                if (reason) reviewCourseEnrollment(enr.id, 'rejected', reason);
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
      )}

      {/* =========================================================================
          MODAL 1: MULTI-STEP COURSE REGISTRATION JOURNEY
          ========================================================================= */}
      <AnimatePresence>
        {registrationCourse && (
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
                    {registrationCourse.title}
                  </h3>
                </div>
                <button
                  onClick={() => setRegistrationCourse(null)}
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
                    {registrationCourse.coverImage && (
                      <div
                        onClick={() => setLightboxImage({
                          url: registrationCourse.coverImage!,
                          title: registrationCourse.title,
                          subtitle: `مدرس: ${registrationCourse.instructor}`,
                        })}
                        className="w-full h-48 rounded-2xl overflow-hidden relative shadow-md group/img cursor-pointer"
                        title="جهت مشاهده تصویر در ابعاد بزرگ کلیک فرمایید"
                      >
                        <img
                          src={registrationCourse.coverImage}
                          alt={registrationCourse.title}
                          className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-between p-4">
                          <span className="text-white text-xs font-bold">
                            استاد: {registrationCourse.instructor} {registrationCourse.instructorTitle && `(${registrationCourse.instructorTitle})`}
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
                          {registrationCourse.holdingFormat === 'online' ? 'مجازی (برخط)' : registrationCourse.holdingFormat === 'in_person' ? 'حضوری' : 'ترکیبی'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">مدت آموزش:</span>
                        <strong className="text-slate-900 dark:text-white font-bold">{toPersianNumbers(registrationCourse.hours)} ساعت تخصصی</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">شهریه ثبت‌نام:</span>
                        <strong className="text-emerald-600 dark:text-emerald-400 font-black">
                          {registrationCourse.price > 0 ? `${toPersianNumbers(registrationCourse.price.toLocaleString('fa-IR'))} تومان` : 'رایگان ویژه اعضا'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">تاریخ شروع:</span>
                        <span className="text-slate-800 dark:text-slate-200 font-bold">{toPersianNumbers(registrationCourse.startDate || 'هم‌اکنون')}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">زمان‌بندی جلسات:</span>
                        <span className="text-slate-800 dark:text-slate-200 font-bold">{toPersianNumbers(registrationCourse.schedule)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">شیوه پرداخت مجاز:</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          {registrationCourse.allowedPaymentMethod === 'gateway_only' ? 'فقط درگاه پرداخت شتاب' : registrationCourse.allowedPaymentMethod === 'receipt_only' ? 'فقط ارسال فیش واریز' : 'درگاه پرداخت یا ارسال فیش'}
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
                        {registrationCourse.description}
                      </p>
                    </div>

                    {/* Topics Covered */}
                    {registrationCourse.topics && registrationCourse.topics.length > 0 && (
                      <div>
                        <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white mb-3">
                          سرفصل‌های آموزشی و مباحث مطروحه:
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {registrationCourse.topics.map((t, i) => (
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
                        <User className="w-4 h-4 text-emerald-500" />
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
                        <strong className="text-slate-900 dark:text-white text-sm font-black">{registrationCourse.title}</strong>
                      </div>
                      <div className="text-left">
                        <span className="text-emerald-700 dark:text-emerald-400 font-bold block">مبلغ قابل پرداخت:</span>
                        <strong className="text-emerald-600 dark:text-emerald-400 text-base font-black">
                          {registrationCourse.price > 0 ? `${toPersianNumbers(registrationCourse.price.toLocaleString('fa-IR'))} تومان` : 'رایگان'}
                        </strong>
                      </div>
                    </div>

                    {/* Payment Method Selector Gated by Supervisor Policy */}
                    {registrationCourse.price > 0 && (
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
                          {(registrationCourse.allowedPaymentMethod === 'both' || registrationCourse.allowedPaymentMethod === 'receipt_only') && (
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
                          {(registrationCourse.allowedPaymentMethod === 'both' || registrationCourse.allowedPaymentMethod === 'gateway_only') && (
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

                              {/* Hidden file input */}
                              <input
                                ref={receiptFileInputRef}
                                type="file"
                                accept="image/*,application/pdf"
                                onChange={handleReceiptFileChange}
                                className="hidden"
                              />

                              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 flex flex-col sm:flex-row items-center gap-3.5">
                                {/* Thumbnail */}
                                <div
                                  onClick={() => setLightboxImage({ url: receiptFilePreview, title: 'تصویر پیوست فیش واریزی' })}
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
                          /* Online Gateway Card Simulation */
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
                        onClick={() => setRegistrationCourse(null)}
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
                      onClick={handleSubmitRegistration}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-black shadow-lg shadow-emerald-500/20 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{regPaymentMethod === 'bank_receipt' ? 'نهایی‌سازی و ارسال مستندات' : 'اتصال به درگاه و نهایی‌سازی'}</span>
                    </button>
                  )}

                  {regStep === 3 && (
                    <button
                      onClick={() => setRegistrationCourse(null)}
                      className="px-6 py-2.5 rounded-xl bg-emerald-500 text-stone-950 text-xs font-black cursor-pointer shadow-md"
                    >
                      بستن و بازگشت به میز کار
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          MODAL 2: COURSE DETAILS & ONLINE ATTENDANCE / ARCHIVE
          ========================================================================= */}
      <AnimatePresence>
        {attendanceCourse && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-right text-slate-900 dark:text-slate-100 flex flex-col max-h-[85vh]"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-5 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-emerald-400 font-bold block mb-0.5">
                    تالار اختصاصی دوره و اطلاعات حضور
                  </span>
                  <h3 className="text-base font-black text-white">{attendanceCourse.title}</h3>
                </div>
                <button
                  onClick={() => setAttendanceCourse(null)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-5 flex-1">
                {/* 1. Custom Post-Enrollment Banner or Course Cover */}
                {(attendanceCourse.postEnrollmentBanner || attendanceCourse.coverImage) && (
                  <div
                    onClick={() => setLightboxImage({ url: (attendanceCourse.postEnrollmentBanner || attendanceCourse.coverImage)!, title: attendanceCourse.title })}
                    className="w-full h-44 rounded-2xl overflow-hidden relative shadow-md cursor-pointer group border border-slate-200 dark:border-slate-800"
                    title="جهت مشاهده تصویر در اندازه اصلی کلیک فرمایید"
                  >
                    <img
                      src={attendanceCourse.postEnrollmentBanner || attendanceCourse.coverImage}
                      alt={attendanceCourse.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-bold">
                      <ZoomIn className="w-4 h-4 text-emerald-400" />
                      <span>مشاهده تصویر بزرگ</span>
                    </div>
                  </div>
                )}

                {/* 2. Admin Configured Message & Reminder Box with dynamic font size and colors */}
                {attendanceCourse.postEnrollmentMessage ? (
                  <div className={`p-4 rounded-2xl border transition-all ${
                    attendanceCourse.welcomeBoxBgColor === 'amber'
                      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-950 dark:text-amber-100 border-amber-300 dark:border-amber-800'
                      : attendanceCourse.welcomeBoxBgColor === 'slate'
                      ? 'bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700'
                      : attendanceCourse.welcomeBoxBgColor === 'indigo'
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-100 border-indigo-300 dark:border-indigo-800'
                      : attendanceCourse.welcomeBoxBgColor === 'rose'
                      ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-950 dark:text-rose-100 border-rose-300 dark:border-rose-800'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 border-emerald-300 dark:border-emerald-800'
                  }`}>
                    <div className="flex items-center gap-2 mb-2 font-black text-xs opacity-80">
                      <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>پیام و راهنمای دوره ویژه ثبت‌نام‌شدگان گرامی:</span>
                    </div>
                    <p className={`font-semibold leading-relaxed ${
                      attendanceCourse.welcomeBoxFontSize === 'sm' ? 'text-xs' : attendanceCourse.welcomeBoxFontSize === 'lg' ? 'text-base' : attendanceCourse.welcomeBoxFontSize === 'xl' ? 'text-lg font-black' : 'text-sm'
                    }`}>
                      {attendanceCourse.postEnrollmentMessage}
                    </p>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100 text-sm font-semibold leading-relaxed">
                    ضمن تشکر و تبریک ثبت‌نام قطعی شما در دوره تخصصی «{attendanceCourse.title}»، دسترسی شما به تالار کلاس و منابع آموزشی برقرار گردید.
                  </div>
                )}

                {/* 3. Online Class Meeting Box (اگر آنلاین باشد یا لینک داشته باشد) */}
                {(attendanceCourse.holdingFormat !== 'in_person' || attendanceCourse.meetingLink) && (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                      <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                        <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
                        <span>اطلاعات ورود به جلسه آنلاین / وبینار برخط:</span>
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-600">
                        پخش زنده Skyroom
                      </span>
                    </div>

                    {/* Schedule Reminders */}
                    {(attendanceCourse.reminderDate || attendanceCourse.reminderSchedule || attendanceCourse.schedule) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <div>
                          <span className="text-slate-400 block text-[10px]">تاریخ برگزاری / شروع:</span>
                          <strong className="text-slate-900 dark:text-white font-bold">
                            {attendanceCourse.reminderDate || attendanceCourse.startDate || 'طبق تقویم آموزشی'}
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">ساعت و روزهای برگزاری:</span>
                          <strong className="text-slate-900 dark:text-white font-bold">
                            {attendanceCourse.reminderSchedule || attendanceCourse.schedule}
                          </strong>
                        </div>
                      </div>
                    )}

                    {/* Meeting Link & Quick Copy */}
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-800 dark:text-slate-200 truncate dir-ltr max-w-sm">
                        {attendanceCourse.meetingLink}
                      </span>
                      <button
                        onClick={() => handleCopy(attendanceCourse.meetingLink, 'link')}
                        className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copiedPhone === 'link' ? 'کپی شد' : 'کپی لینک'}</span>
                      </button>
                    </div>

                    {attendanceCourse.meetingAccessGuide && (
                      <div className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                        <strong>راهنمای ورود: </strong>{attendanceCourse.meetingAccessGuide}
                      </div>
                    )}

                    <a
                      href={attendanceCourse.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-2 w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-stone-950 rounded-xl text-xs font-black shadow-md cursor-pointer transition-colors"
                    >
                      <span>ورود مستقیم به تالار مجازی کلاس آنلاین</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                )}

                {/* 4. Offline Course Downloads Section (اگر فایل دانلودی یا راهنمای آفلاین داشته باشد) */}
                <div className="p-4 rounded-2xl bg-sky-50/60 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-900/50 space-y-3">
                  <div className="flex items-center justify-between border-b border-sky-200 dark:border-sky-900/50 pb-2">
                    <h4 className="text-xs font-black text-sky-900 dark:text-sky-300 flex items-center gap-2">
                      <Download className="w-4 h-4 text-sky-600" />
                      <span>فایل‌های دوره آفلاین و اسلایدهای آموزشی جهت دانلود:</span>
                    </h4>
                    <span className="text-[10px] font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full">
                      دانلود با ترافیک نیم‌بهاء
                    </span>
                  </div>

                  {attendanceCourse.offlineDownloadGuide && (
                    <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
                      {attendanceCourse.offlineDownloadGuide}
                    </p>
                  )}

                  {/* Offline Download Files List */}
                  {attendanceCourse.offlineDownloadFiles && attendanceCourse.offlineDownloadFiles.length > 0 ? (
                    <div className="space-y-2">
                      {attendanceCourse.offlineDownloadFiles.map(file => (
                        <div
                          key={file.id}
                          className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs shadow-2xs"
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <span className="w-8 h-8 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center font-bold text-xs shrink-0">
                              {file.format || 'ZIP'}
                            </span>
                            <div className="truncate">
                              <strong className="text-slate-900 dark:text-white block font-bold truncate">{file.title}</strong>
                              <span className="text-[10px] text-slate-400 font-mono">حجم: {file.size || 'نامشخص'}</span>
                            </div>
                          </div>

                          <a
                            href={file.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs transition-colors shrink-0"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>دانلود فایل</span>
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : attendanceCourse.archiveResources && attendanceCourse.archiveResources.length > 0 ? (
                    <div className="space-y-2">
                      {attendanceCourse.archiveResources.map(res => (
                        <div
                          key={res.id}
                          className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            {res.type === 'video' ? <Video className="w-4 h-4 text-sky-500" /> : <FileText className="w-4 h-4 text-emerald-500" />}
                            <div>
                              <span className="font-bold text-slate-900 dark:text-white block">{res.title}</span>
                              {res.size && <span className="text-[10px] text-slate-400 font-mono">حجم: {res.size}</span>}
                            </div>
                          </div>
                          <a
                            href={res.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>دریافت فایل</span>
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 text-center text-[11px] text-slate-500">
                      فایل‌های جلسات آموزشی این دوره به زودی در این قسمت قرار خواهد گرفت.
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          MODAL 2.5: DEDICATED COURSE ADMIN PANEL (پنل مدیریت ویژه دوره برای ادمین)
          شامل لیست ثبت‌نامی‌ها، وضعیت پرداخت‌ها و تنظیم محتوای پس از ثبت‌نام
          ========================================================================= */}
      <AnimatePresence>
        {dedicatedCourseAdmin && (
          <CourseAdminPanelModal
            course={dedicatedCourseAdmin}
            onClose={() => setDedicatedCourseAdmin(null)}
            onOpenSmsModal={(c, recipient) => handleOpenSmsModal(c, recipient)}
            onInspectReceipt={(enr) => setInspectingEnrollment(enr)}
            onOpenBuilder={(c) => {
              setDedicatedCourseAdmin(null);
              handleOpenCourseBuilder(c);
            }}
          />
        )}
      </AnimatePresence>

      {/* =========================================================================
          MODAL 3: PARTICIPANTS ROSTER & INLINE MODERATION (لیست شرکت‌کنندگان هر دوره)
          ========================================================================= */}
      <AnimatePresence>
        {courseForRoster && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-right flex flex-col max-h-[90vh]"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-5 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-emerald-400 font-bold block mb-0.5">
                    فهرست شرکت‌کنندگان و سامانه پیام‌رسانی دوره
                  </span>
                  <h3 className="text-base font-black text-white">{courseForRoster.title}</h3>
                </div>
                <button
                  onClick={() => setCourseForRoster(null)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Action Bar & Stats */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
                {/* Stats */}
                <div className="flex items-center gap-3 font-bold text-slate-600 dark:text-slate-300">
                  <span>کل ثبت‌نام‌ها: <strong className="text-slate-900 dark:text-white font-black">{toPersianNumbers(rosterEnrollments.length)}</strong> نفر</span>
                  <span className="text-emerald-600">قطعی: {toPersianNumbers(rosterEnrollments.filter(e => e.paymentStatus === 'confirmed').length)}</span>
                  <span className="text-amber-600">در بررسی: {toPersianNumbers(rosterEnrollments.filter(e => e.paymentStatus === 'pending_review').length)}</span>
                </div>

                {/* Bulk SMS Button */}
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleOpenSmsModal(courseForRoster, 'all')}
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
                    placeholder="جستجوی نام شرکت‌کننده، کد ملی، شماره موبایل یا کد رهگیری..."
                    className="w-full pr-8 pl-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex items-center gap-1 text-xs">
                  <button
                    onClick={() => setRosterStatusFilter('all')}
                    className={`px-3 py-1.5 rounded-xl font-bold ${rosterStatusFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}
                  >
                    همه
                  </button>
                  <button
                    onClick={() => setRosterStatusFilter('confirmed')}
                    className={`px-3 py-1.5 rounded-xl font-bold ${rosterStatusFilter === 'confirmed' ? 'bg-emerald-500 text-stone-950' : 'text-slate-500'}`}
                  >
                    ثبت‌نام قطعی
                  </button>
                  <button
                    onClick={() => setRosterStatusFilter('pending_review')}
                    className={`px-3 py-1.5 rounded-xl font-bold ${rosterStatusFilter === 'pending_review' ? 'bg-amber-500 text-stone-950' : 'text-slate-500'}`}
                  >
                    در نوبت بررسی
                  </button>
                </div>
              </div>

              {/* Participants Roster List */}
              <div className="p-4 overflow-y-auto space-y-3 flex-1">
                {rosterEnrollments.length === 0 ? (
                  <div className="p-10 text-center text-xs text-slate-400 space-y-2">
                    <Users className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                    <p className="font-bold">هیچ شرکت‌کننده‌ای با این مشخصات یافت نشد.</p>
                  </div>
                ) : (
                  rosterEnrollments.map(enr => (
                    <div
                      key={enr.id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs"
                    >
                      {/* User Info with Mobile Number Display */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <strong className="text-sm font-black text-slate-900 dark:text-white">{enr.userName}</strong>
                          <span className="text-[11px] text-slate-400">({enr.userRoleTitle})</span>
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

                          <div className="flex items-center gap-1 font-mono">
                            <span className="text-slate-400">کد ملی:</span>
                            <span>{toPersianNumbers(enr.userNationalId)}</span>
                          </div>

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
                        {/* Status Badge */}
                        <span className={`px-2.5 py-1 rounded-xl text-[11px] font-black border ${
                          enr.paymentStatus === 'confirmed'
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                            : enr.paymentStatus === 'pending_review'
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                            : 'bg-rose-500/15 text-rose-600 border-rose-500/30'
                        }`}>
                          {enr.paymentStatus === 'confirmed' ? 'تایید شده' : enr.paymentStatus === 'pending_review' ? 'در نوبت بررسی' : 'رد شده'}
                        </span>

                        {/* View Receipt */}
                        {enr.receiptFileUrl && (
                          <button
                            onClick={() => setLightboxImage({ url: enr.receiptFileUrl!, title: `فیش بانکی: ${enr.userName}`, subtitle: `کد پیگیری: ${enr.trackingCode}` })}
                            className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-emerald-500"
                            title="مشاهده بزرگ فیش واریزی"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Send Individual SMS */}
                        <button
                          onClick={() => handleOpenSmsModal(courseForRoster, enr)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-500/15 text-sky-700 dark:text-sky-300 font-bold hover:bg-sky-500/25 transition-colors"
                          title="ارسال پیامک اختصاصی به این شرکت‌کننده"
                        >
                          <Send className="w-3 h-3" />
                          <span>پیامک</span>
                        </button>

                        {/* Inline Review Action Buttons */}
                        {enr.paymentStatus !== 'confirmed' && (
                          <button
                            onClick={() => reviewCourseEnrollment(enr.id, 'confirmed', 'مدارک و فیش بانکی تایید و ثبت‌نام قطعی شد.')}
                            className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black transition-colors"
                          >
                            تایید
                          </button>
                        )}

                        {enr.paymentStatus !== 'rejected' && (
                          <button
                            onClick={() => {
                              const reason = prompt('علت رد ثبت‌نام را وارد فرمایید:', 'نقص در مدارک واریزی');
                              if (reason) reviewCourseEnrollment(enr.id, 'rejected', reason);
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 text-rose-600 border border-rose-500/30 font-bold hover:bg-rose-500/20"
                          >
                            رد
                          </button>
                        )}

                        {/* Edit Note */}
                        <button
                          onClick={() => {
                            const newNote = prompt('ویرایش یادداشت مدیر برای این پرونده:', enr.adminNote || '');
                            if (newNote !== null) {
                              reviewCourseEnrollment(enr.id, enr.paymentStatus === 'rejected' ? 'rejected' : 'confirmed', newNote);
                            }
                          }}
                          className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
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
        )}
      </AnimatePresence>

      {/* =========================================================================
          MODAL 4: BULK & INDIVIDUAL SMS DISPATCH MODAL
          ========================================================================= */}
      <AnimatePresence>
        {smsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-right p-6 space-y-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-500" />
                  <span>
                    {smsModal.recipient === 'all'
                      ? 'ارسال پیامک گروهی به کلیه شرکت‌کنندگان دوره'
                      : `ارسال پیامک اختصاصی به ${smsModal.recipient.userName}`}
                  </span>
                </h3>
                <button
                  onClick={() => setSmsModal(null)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

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
                      ? `کلیه شرکت‌کنندگان دوره (${toPersianNumbers(courseEnrollments.filter(e => e.courseId === smsModal.course.id).length)} شماره همراه)`
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
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
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
                  <CheckCheck className="w-4 h-4 text-emerald-500" />
                  <span>{smsFeedback}</span>
                </div>
              )}

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSmsModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  disabled={isSendingSms || !smsMessage.trim()}
                  onClick={handleSendSms}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-black shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSendingSms ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>ارسال پیامک از سرشماره ۳۰۰۰</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          MODAL 5: SOFT DELETE WITH SMS PIN VERIFICATION (حذف منطقی با پین موبایل)
          ========================================================================= */}
      <AnimatePresence>
        {courseToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-rose-500/30 overflow-hidden text-right p-6 space-y-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-rose-500/20">
                <h3 className="text-sm font-black text-rose-600 dark:text-rose-400 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-500" />
                  <span>تایید امنیتی حذف منطقی دوره (Safe Delete)</span>
                </h3>
                <button
                  onClick={() => setCourseToDelete(null)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Course Being Deleted Info */}
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-xs space-y-1.5">
                <strong className="text-slate-900 dark:text-white block font-black">{courseToDelete.title}</strong>
                <p className="text-slate-600 dark:text-slate-400">
                  مدرس: {courseToDelete.instructor} · شرکت‌کنندگان فعلی: {toPersianNumbers(courseToDelete.enrolledCount)} نفر
                </p>
                <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold pt-1 border-t border-rose-200/60 dark:border-rose-900/60 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>تضمین عدم حذف آبشاری: کلیه سوابق ثبت‌نام و فیش‌های مالی ماندگار می‌مانند.</span>
                </div>
              </div>

              {/* SMS PIN Notice */}
              {deleteSmsNotice && (
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-700 dark:text-slate-300 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-sky-600 dark:text-sky-400">
                    <Smartphone className="w-4 h-4" />
                    <span>{deleteSmsNotice}</span>
                  </div>
                  <p className="text-slate-500">جهت تایید عملیات حذف دوره، پین کد ۶ رقمی امنیتی را وارد نمایید.</p>
                </div>
              )}

              {/* PIN Code Input */}
              <div className="space-y-1.5 text-xs">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  ورود پین کد امنیتی ارسال‌شده به شماره همراه:
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    maxLength={6}
                    autoFocus
                    value={deletePinInput}
                    onChange={e => setDeletePinInput(e.target.value)}
                    placeholder="پین کد ۶ رقمی (مثلاً 123456)"
                    className="w-full pr-9 pl-3 py-2 text-center tracking-widest text-sm font-mono rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                {deleteError && (
                  <p className="text-[11px] text-rose-600 font-bold mt-1">{deleteError}</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const res = await sendPinOtpSms();
                      setDeleteSmsNotice(`کد پیامکی جدید مجدداً ارسال گردید (${res.otpCode}).`);
                    } catch {
                      setDeleteSmsNotice('کد مجدداً ارسال گردید. (پین پیش‌فرض: 123456)');
                    }
                  }}
                  className="text-xs text-sky-600 hover:underline font-bold"
                >
                  ارسال مجدد کد به موبایل
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCourseToDelete(null)}
                    className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
                  >
                    انصراف
                  </button>

                  <button
                    type="button"
                    disabled={isDeletingCourse || deletePinInput.length < 4}
                    onClick={handleConfirmSoftDelete}
                    className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {isDeletingCourse ? 'در حال ثبت...' : 'تایید و انتقال به بایگانی امن'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          MODAL 6: HIGH-RESOLUTION LIGHTBOX IMAGE VIEWER (مشاهده کامل عکس دوره/فیش)
          ========================================================================= */}
      <AnimatePresence>
        {lightboxImage && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
            onClick={() => setLightboxImage(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-4xl w-full max-h-[92vh] flex flex-col items-center justify-center"
              onClick={e => e.stopPropagation()}
            >
              {/* Lightbox Controls Top Bar */}
              <div className="w-full flex items-center justify-between p-3 bg-black/60 backdrop-blur-md rounded-2xl text-white mb-2 border border-white/10 text-xs font-bold">
                <div className="flex items-center gap-2 truncate">
                  <ImageIcon className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="truncate">{lightboxImage.title}</span>
                  {lightboxImage.subtitle && (
                    <span className="text-slate-400 font-normal hidden sm:inline">({lightboxImage.subtitle})</span>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={lightboxImage.url}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                    title="دانلود یا باز کردن در زبانه جدید"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => setLightboxImage(null)}
                    className="p-1.5 rounded-xl bg-white/10 hover:bg-rose-500 text-white transition-colors cursor-pointer"
                    title="بستن پنجره"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Full Image */}
              <div className="w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black flex items-center justify-center max-h-[80vh]">
                <img
                  src={lightboxImage.url}
                  alt={lightboxImage.title}
                  className="w-full h-full object-contain max-h-[78vh]"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          MODAL 7: ADMIN RECEIPT INSPECTION
          ========================================================================= */}
      <AnimatePresence>
        {inspectingEnrollment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-right p-6 space-y-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-500" />
                  <span>بررسی تصویر فیش واریزی: {inspectingEnrollment.userName}</span>
                </h3>
                <button
                  onClick={() => setInspectingEnrollment(null)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-slate-400 block text-[10px]">کد رهگیری فیش:</span>
                    <strong className="font-mono text-slate-900 dark:text-white">{toPersianNumbers(inspectingEnrollment.trackingCode)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">مبلغ واریزی:</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 font-black">
                      {toPersianNumbers(inspectingEnrollment.amountPaid.toLocaleString('fa-IR'))} تومان
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">شماره همراه متقاضی:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{toPersianNumbers(inspectingEnrollment.userPhone)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">بانک و تاریخ:</span>
                    <span className="text-slate-800 dark:text-slate-200 font-bold">{inspectingEnrollment.receiptBankName || 'بانک ملی'} · {toPersianNumbers(inspectingEnrollment.receiptDate || '')}</span>
                  </div>
                </div>

                {inspectingEnrollment.receiptFileUrl && (
                  <div
                    onClick={() => setLightboxImage({ url: inspectingEnrollment.receiptFileUrl!, title: `فیش بانکی: ${inspectingEnrollment.userName}` })}
                    className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-72 bg-slate-950 flex items-center justify-center cursor-pointer group"
                    title="جهت بزرگنمایی تصویر فیش کلیک کنید"
                  >
                    <img
                      src={inspectingEnrollment.receiptFileUrl}
                      alt="فیش واریزی"
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                    />
                  </div>
                )}

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => {
                      reviewCourseEnrollment(inspectingEnrollment.id, 'confirmed', 'فیش بانکی استعلام و تایید گردید.');
                      setInspectingEnrollment(null);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-xs shadow-md transition-colors cursor-pointer"
                  >
                    تایید نهایی و صدور ثبت‌نام قطعی
                  </button>
                  <button
                    onClick={() => setInspectingEnrollment(null)}
                    className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
                  >
                    بستن
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          MODAL 8: ADVANCED COURSE BUILDER / EDITOR
          ========================================================================= */}
      <AnimatePresence>
        {courseBuilderOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-right text-slate-900 dark:text-slate-100 flex flex-col max-h-[90vh]"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-5 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-amber-400 font-bold block mb-0.5">
                    پنل هوشمند ویژه مسئول آموزش (تنظیمات شیوه پرداخت، تصویر دوره و سرفصل‌ها)
                  </span>
                  <h3 className="text-base font-black text-white">
                    {editingCourseId ? 'ویرایش مشخصات و دسترسی‌های دوره' : 'تعریف دوره تخصصی و کارگاه آموزشی جدید'}
                  </h3>
                </div>
                <button
                  onClick={() => setCourseBuilderOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveCourseBuilder} className="p-6 space-y-5 overflow-y-auto flex-1">
                {/* 1. Basic Identity */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-emerald-600 dark:text-emerald-400 border-b border-slate-200 dark:border-slate-800 pb-1">
                    ۱. مشخصات هویتی و عنوان دوره:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        عنوان کامل دوره:
                      </label>
                      <input
                        type="text"
                        required
                        value={builderForm.title}
                        onChange={e => setBuilderForm({ ...builderForm, title: e.target.value })}
                        placeholder="مثال: کارگاه جامع داوری تجاری بین‌الملل"
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        نام و عنوان استاد / مدرس:
                      </label>
                      <input
                        type="text"
                        required
                        value={builderForm.instructor}
                        onChange={e => setBuilderForm({ ...builderForm, instructor: e.target.value })}
                        placeholder="مثال: حضرت آیت‌الله دکتر سید ابراهیم علوی"
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Course Image Management (بارگذاری عکس یا انتخاب الگو) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1">
                    <h4 className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4" />
                      <span>۲. مدیریت تصویر و بنر دوره (آپلود عکس یا انتخاب از آلبوم):</span>
                    </h4>
                    <label className="flex items-center gap-2 cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={builderForm.hasCoverImage}
                        onChange={e => setBuilderForm({ ...builderForm, hasCoverImage: e.target.checked })}
                        className="rounded text-emerald-600"
                      />
                      <span className="font-bold">دوره دارای تصویر بنر باشد</span>
                    </label>
                  </div>

                  {builderForm.hasCoverImage && (
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                      {/* Hidden image input */}
                      <input
                        ref={courseCoverInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleCourseCoverUpload}
                        className="hidden"
                      />

                      <div className="flex flex-col sm:flex-row items-center gap-4">
                        {/* Current Preview */}
                        <div
                          onClick={() => setLightboxImage({ url: builderForm.coverImage, title: 'پیش‌نمایش بنر دوره' })}
                          className="w-32 h-20 rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 shrink-0 bg-slate-200 cursor-pointer relative group"
                          title="جهت بزرگنمایی کلیک کنید"
                        >
                          <img
                            src={builderForm.coverImage}
                            alt="بنر دوره"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <ZoomIn className="w-4 h-4 text-white" />
                          </div>
                        </div>

                        <div className="space-y-2 flex-1 w-full text-right">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => courseCoverInputRef.current?.click()}
                              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-bold shadow-xs cursor-pointer"
                            >
                              <UploadCloud className="w-3.5 h-3.5" />
                              <span>بارگذاری عکس از دستگاه</span>
                            </button>
                            <span className="text-[11px] text-slate-400">یا نشانی مستقیم تصویر را بنویسید:</span>
                          </div>

                          <input
                            type="text"
                            value={builderForm.coverImage}
                            onChange={e => setBuilderForm({ ...builderForm, coverImage: e.target.value })}
                            placeholder="https://..."
                            className="w-full px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono dir-ltr"
                          />
                        </div>
                      </div>

                      {/* Preset Cover Library */}
                      <div className="pt-2">
                        <span className="text-[11px] font-bold text-slate-500 block mb-2">تصاویر پیشنهادی موضوعی:</span>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                          {PRESET_COURSE_COVERS.map((preset, idx) => (
                            <div
                              key={idx}
                              onClick={() => setBuilderForm({ ...builderForm, coverImage: preset.url })}
                              className={`h-14 rounded-xl overflow-hidden border-2 cursor-pointer transition-all relative ${
                                builderForm.coverImage === preset.url
                                  ? 'border-emerald-500 scale-105 shadow-md'
                                  : 'border-transparent hover:border-slate-400 opacity-75 hover:opacity-100'
                              }`}
                              title={preset.title}
                            >
                              <img src={preset.url} alt={preset.title} className="w-full h-full object-cover" />
                              {builderForm.coverImage === preset.url && (
                                <div className="absolute inset-0 bg-emerald-500/30 flex items-center justify-center">
                                  <Check className="w-4 h-4 text-white drop-shadow font-bold" />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Payment Method Policy Selector (مسئول مشخص میکند) */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-emerald-600 dark:text-emerald-400 border-b border-slate-200 dark:border-slate-800 pb-1">
                    ۳. سیاست شیوه پرداخت شهریه (تعیین توسط مسئول دوره):
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <label className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                      builderForm.allowedPaymentMethod === 'both'
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-950 dark:text-emerald-200 font-bold'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      <input
                        type="radio"
                        name="builderPaymentPolicy"
                        value="both"
                        checked={builderForm.allowedPaymentMethod === 'both'}
                        onChange={() => setBuilderForm({ ...builderForm, allowedPaymentMethod: 'both' })}
                        className="mt-1 text-emerald-600"
                      />
                      <div>
                        <strong className="text-xs block">هر دو شیوه (درگاه + فیش)</strong>
                        <span className="text-[10px] opacity-75 font-normal">متقاضی می‌تواند بین شتاب و واریز کارت به کارت انتخاب کند.</span>
                      </div>
                    </label>

                    <label className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                      builderForm.allowedPaymentMethod === 'gateway_only'
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-950 dark:text-emerald-200 font-bold'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      <input
                        type="radio"
                        name="builderPaymentPolicy"
                        value="gateway_only"
                        checked={builderForm.allowedPaymentMethod === 'gateway_only'}
                        onChange={() => setBuilderForm({ ...builderForm, allowedPaymentMethod: 'gateway_only' })}
                        className="mt-1 text-emerald-600"
                      />
                      <div>
                        <strong className="text-xs block">فقط درگاه پرداخت شتاب</strong>
                        <span className="text-[10px] opacity-75 font-normal">ثبت‌نام فقط با پرداخت آنلاین آنی بدون ارسال فیش دستی.</span>
                      </div>
                    </label>

                    <label className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                      builderForm.allowedPaymentMethod === 'receipt_only'
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-950 dark:text-emerald-200 font-bold'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      <input
                        type="radio"
                        name="builderPaymentPolicy"
                        value="receipt_only"
                        checked={builderForm.allowedPaymentMethod === 'receipt_only'}
                        onChange={() => setBuilderForm({ ...builderForm, allowedPaymentMethod: 'receipt_only' })}
                        className="mt-1 text-emerald-600"
                      />
                      <div>
                        <strong className="text-xs block">فقط ارسال مدارک واریز</strong>
                        <span className="text-[10px] opacity-75 font-normal">متقاضی حتماً باید فیش انتقال به حساب را بارگذاری نماید.</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* 4. Format & Scheduling */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-emerald-600 dark:text-emerald-400 border-b border-slate-200 dark:border-slate-800 pb-1">
                    ۴. شیوه برگزاری، تاریخ و ساعت:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        شیوه برگزاری:
                      </label>
                      <select
                        value={builderForm.holdingFormat}
                        onChange={e => setBuilderForm({ ...builderForm, holdingFormat: e.target.value as any })}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                      >
                        <option value="online">مجازی (برخط با لینک اسکای‌روم)</option>
                        <option value="in_person">حضوری در محل مرکز</option>
                        <option value="hybrid">ترکیبی (حضوری + پخش برخط)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        طول دوره (ساعت آموزشی):
                      </label>
                      <input
                        type="number"
                        value={builderForm.hours}
                        onChange={e => setBuilderForm({ ...builderForm, hours: Number(e.target.value) })}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        ظرفیت پذیرش (نفر):
                      </label>
                      <input
                        type="number"
                        value={builderForm.capacity}
                        onChange={e => setBuilderForm({ ...builderForm, capacity: Number(e.target.value) })}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                      />
                    </div>
                  </div>

                  {builderForm.holdingFormat !== 'in_person' && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        لینک ورود به کلاس آنلاین اسکای‌روم / وبینار:
                      </label>
                      <input
                        type="text"
                        value={builderForm.meetingLink}
                        onChange={e => setBuilderForm({ ...builderForm, meetingLink: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono dir-ltr"
                      />
                    </div>
                  )}

                  {builderForm.holdingFormat !== 'online' && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        آدرس دقیق محل تشکیل کلاس حضوری:
                      </label>
                      <input
                        type="text"
                        value={builderForm.venueAddress}
                        onChange={e => setBuilderForm({ ...builderForm, venueAddress: e.target.value })}
                        placeholder="مثال: قم، مدرسه فیضیه، مدرس شماره ۲"
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                      />
                    </div>
                  )}
                </div>

                {/* 5. Tuition & Options */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-emerald-600 dark:text-emerald-400 border-b border-slate-200 dark:border-slate-800 pb-1">
                    ۵. شهریه و امکانات دوره:
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        مبلغ شهریه (تومان - صفر یعنی رایگان):
                      </label>
                      <input
                        type="number"
                        value={builderForm.price}
                        onChange={e => setBuilderForm({ ...builderForm, price: Number(e.target.value) })}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        وضعیت دوره در سامانه:
                      </label>
                      <select
                        value={builderForm.status}
                        onChange={e => setBuilderForm({ ...builderForm, status: e.target.value as any })}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                      >
                        <option value="enrolling">در حال پذیرش و ثبت‌نام</option>
                        <option value="ongoing">در حال برگزاری</option>
                        <option value="completed">پایان‌یافته و آرشیو شده</option>
                      </select>
                    </div>
                  </div>

                  {/* Installments & Certificate toggles */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer text-xs">
                        <input
                          type="checkbox"
                          checked={builderForm.hasInstallments}
                          onChange={e => setBuilderForm({ ...builderForm, hasInstallments: e.target.checked })}
                          className="rounded text-emerald-600"
                        />
                        <span className="font-bold">امکان پرداخت اقساطی شهریه</span>
                      </label>
                      {builderForm.hasInstallments && (
                        <input
                          type="text"
                          value={builderForm.installmentDetails}
                          onChange={e => setBuilderForm({ ...builderForm, installmentDetails: e.target.value })}
                          placeholder="تعداد اقساط و موعدها"
                          className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                        />
                      )}
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer text-xs">
                        <input
                          type="checkbox"
                          checked={builderForm.hasCertificate}
                          onChange={e => setBuilderForm({ ...builderForm, hasCertificate: e.target.checked })}
                          className="rounded text-emerald-600"
                        />
                        <span className="font-bold">اعطای گواهی رسمی پایان دوره</span>
                      </label>
                      {builderForm.hasCertificate && (
                        <input
                          type="text"
                          value={builderForm.certificateDetails}
                          onChange={e => setBuilderForm({ ...builderForm, certificateDetails: e.target.value })}
                          placeholder="مشخصات گواهی و مرجع صادرکننده"
                          className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* 6. Description & Topics */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-emerald-600 dark:text-emerald-400 border-b border-slate-200 dark:border-slate-800 pb-1">
                    ۶. شرح توضیحات و سرفصل‌ها:
                  </h4>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      توضیحات و اهداف دوره:
                    </label>
                    <textarea
                      rows={3}
                      value={builderForm.description}
                      onChange={e => setBuilderForm({ ...builderForm, description: e.target.value })}
                      className="w-full p-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      سرفصل‌های آموزشی دوره:
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={builderForm.newTopicInput}
                        onChange={e => setBuilderForm({ ...builderForm, newTopicInput: e.target.value })}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (builderForm.newTopicInput.trim()) {
                              setBuilderForm({
                                ...builderForm,
                                topics: [...builderForm.topics, builderForm.newTopicInput.trim()],
                                newTopicInput: '',
                              });
                            }
                          }
                        }}
                        placeholder="افزودن سرفصل جدید (اینتر بزنید)..."
                        className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (builderForm.newTopicInput.trim()) {
                            setBuilderForm({
                              ...builderForm,
                              topics: [...builderForm.topics, builderForm.newTopicInput.trim()],
                              newTopicInput: '',
                            });
                          }
                        }}
                        className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold"
                      >
                        افزودن
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {builderForm.topics.map((top, idx) => (
                        <span
                          key={idx}
                          className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold border border-emerald-500/20"
                        >
                          <span>{top}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setBuilderForm({
                                ...builderForm,
                                topics: builderForm.topics.filter((_, i) => i !== idx),
                              });
                            }}
                            className="hover:text-rose-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>

                    {/* Custom Tags Builder Input */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        تگ‌ها و برچسب‌های سفارشی دوره (مانند گواهی رسمی، اقساطی، تخفیف ویژه و...):
                      </label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={builderForm.newTagInput}
                          onChange={e => setBuilderForm({ ...builderForm, newTagInput: e.target.value })}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (builderForm.newTagInput.trim()) {
                                setBuilderForm({
                                  ...builderForm,
                                  customTags: [...builderForm.customTags, builderForm.newTagInput.trim()],
                                  newTagInput: '',
                                });
                              }
                            }
                          }}
                          placeholder="افزودن تگ سفارشی جدید (اینتر بزنید)..."
                          className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (builderForm.newTagInput.trim()) {
                              setBuilderForm({
                                ...builderForm,
                                customTags: [...builderForm.customTags, builderForm.newTagInput.trim()],
                                newTagInput: '',
                              });
                            }
                          }}
                          className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold"
                        >
                          افزودن تگ
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {builderForm.customTags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-sky-500/10 text-sky-700 dark:text-sky-300 text-xs font-bold border border-sky-500/20"
                          >
                            <span>{tag}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setBuilderForm({
                                  ...builderForm,
                                  customTags: builderForm.customTags.filter((_, i) => i !== idx),
                                });
                              }}
                              className="hover:text-rose-500"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setCourseBuilderOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-black shadow-md shadow-emerald-500/20 cursor-pointer"
                  >
                    {editingCourseId ? 'ذخیره تغییرات دوره' : 'ثبت و انتشار دوره'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
