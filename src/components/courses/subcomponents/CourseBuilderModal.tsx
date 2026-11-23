import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Course,
  CourseCustomField,
  CourseInstallmentPlan,
  CourseInstructorItem,
  CourseSessionItem,
  CourseScope,
} from '../../../types';
import { api } from '../../../services/apiClient';
import { CourseBuilderAdvancedTabs, CourseOfflineFileEntry } from './CourseBuilderAdvancedTabs';
import { compressImageFast, formatFileSizeLabel } from '../../../utils/imageCompression';
import { toPersianNumbers } from '../../../utils/persianNumbers';
import {
  X,
  Image as ImageIcon,
  ZoomIn,
  UploadCloud,
  Loader2,
  GraduationCap,
  Trash2,
} from 'lucide-react';

interface CourseBuilderModalProps {
  mode?: CourseScope;
  isOpen: boolean;
  courseToEdit: Course | null;
  onClose: () => void;
  onSave: (courseData: Partial<Course>) => Promise<void>;
  onImagePreview: (img: { url: string; title: string }) => void;
}

const buildDefaultInstallmentPlan = (price: number): CourseInstallmentPlan => {
  const today = new Date();
  const nextMonth = new Date(Date.now() + 30 * 86400 * 1000);
  return {
    enabled: false,
    count: 2,
    items: [
      {
        installmentNumber: 1,
        title: 'قسط اول (پیش‌پرداخت ثبت‌نام)',
        percentage: 50,
        fixedAmount: Math.round(price * 0.5),
        dueDateIso: today.toISOString().slice(0, 10),
        dueDateJalali: today.toLocaleDateString('fa-IR'),
      },
      {
        installmentNumber: 2,
        title: 'قسط دوم (نیمه دوره)',
        percentage: 50,
        fixedAmount: Math.round(price * 0.5),
        dueDateIso: nextMonth.toISOString().slice(0, 10),
        dueDateJalali: nextMonth.toLocaleDateString('fa-IR'),
      },
    ],
  };
};

export const CourseBuilderModal: React.FC<CourseBuilderModalProps> = ({
  mode = 'specialized',
  isOpen,
  courseToEdit,
  onClose,
  onSave,
  onImagePreview,
}) => {
  const effectiveScope: CourseScope = mode || courseToEdit?.courseScope || 'specialized';
  const isWorkshop = effectiveScope === 'counseling_workshop';
  const unitNoun = isWorkshop ? 'کارگاه' : 'دوره';
  const courseCoverInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [coverPreviewLocal, setCoverPreviewLocal] = useState<string | null>(null);
  const [coverStats, setCoverStats] = useState<string | null>(null);
  const [draftFolderKey, setDraftFolderKey] = useState<string>(() => `new_${Date.now().toString(36)}`);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [builderForm, setBuilderForm] = useState<{
    title: string;
    instructor: string;
    instructorTitle: string;
    instructorAvatarUrl: string;
    instructorResume: string;
    instructors: CourseInstructorItem[];
    sessions: CourseSessionItem[];
    offlineDownloadGuide: string;
    offlineDownloadFiles: CourseOfflineFileEntry[];
    category: string;
    level: string;
    hours: number;
    capacity: number;
    schedule: string;
    holdingTime: string;
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
    installmentPlan: CourseInstallmentPlan;
    hasCertificate: boolean;
    certificateDetails: string;
    hasPrerequisites: boolean;
    prerequisites: string;
    description: string;
    necessity: string;
    managerNotes: string;
    targetAudiences: string[];
    customFields: CourseCustomField[];
    hiddenFields: string[];
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
    instructorAvatarUrl: '',
    instructorResume: '',
    instructors: [],
    sessions: [],
    offlineDownloadGuide: '',
    offlineDownloadFiles: [],
    category: 'فقه القضاء و فناوری',
    level: 'تخصصی عالی (سطح ۴ و دکتری)',
    hours: 20,
    capacity: 40,
    schedule: 'پنج‌شنبه‌ها از ساعت ۰۹:۰۰ الی ۱۲:۰۰',
    holdingTime: 'پنج‌شنبه‌ها ساعت ۰۹:۰۰ الی ۱۲:۰۰',
    startDate: '۱۴۰۳/۰۹/۰۱',
    endDate: '۱۴۰۳/۱۰/۲۰',
    holdingFormat: 'online',
    venueAddress: 'قم، مجتمع نخبگان فقه و قضا، سالن همایش‌ها',
    meetingLink: 'https://lms.feqh-ghaza.ir/room/new-course',
    meetingAccessGuide: 'ورود با نام کاربری کد ملی و کلمه عبور اختصاصی پیامک‌شده.',
    hasCoverImage: false,
    coverImage: '',
    allowedPaymentMethod: 'both',
    price: 750000,
    hasInstallments: false,
    installmentDetails: 'امکان پرداخت در ۲ قسط ۵۰ درصدی.',
    installmentPlan: buildDefaultInstallmentPlan(750000),
    hasCertificate: true,
    certificateDetails: 'گواهی پایان دوره رسمی ممهور به تمبر و مهر مرکز نخبگان.',
    hasPrerequisites: true,
    prerequisites: 'دانش‌آموختگان سطح ۳ و ۴ حوزوی، قضات محاکم یا وکلای دادگستری.',
    description: 'تحلیل تطبیقی و کاربردی مسائل مستحدثه با رویکرد فقهی و حقوقی معاصر.',
    necessity: '',
    managerNotes: '',
    targetAudiences: ['طلاب سطوح عالی و خارج', 'قضات دادگستری', 'وکلای پایه یک'],
    customFields: [],
    hiddenFields: [],
    topics: ['مبانی نظری و فقهی', 'بررسی رویه قضایی و آرای وحدت رویه مرتبط'],
    newTopicInput: '',
    customTags: ['گواهی رسمی ممهور'],
    newTagInput: '',
    status: 'enrolling',
    archiveAccess: 'enrolled_only',
  });

  useEffect(() => {
    setSaveError(null);
    setCoverPreviewLocal(null);
    setCoverStats(null);
    if (courseToEdit) {
      const initialInstructors: CourseInstructorItem[] =
        courseToEdit.instructors && courseToEdit.instructors.length > 0
          ? courseToEdit.instructors
          : courseToEdit.instructor
          ? [
              {
                id: `inst_primary_${courseToEdit.id}`,
                fullName: courseToEdit.instructor,
                title: courseToEdit.instructorTitle || undefined,
                roleLabel: 'مدرس اصلی دوره',
                avatarUrl: courseToEdit.instructorAvatarUrl || undefined,
                resume: courseToEdit.instructorResume || undefined,
                isPrimary: true,
              },
            ]
          : [];
      setBuilderForm({
        title: courseToEdit.title,
        instructor: courseToEdit.instructor,
        instructorTitle: courseToEdit.instructorTitle || '',
        instructorAvatarUrl: courseToEdit.instructorAvatarUrl || '',
        instructorResume: courseToEdit.instructorResume || '',
        instructors: initialInstructors,
        sessions: courseToEdit.sessions || [],
        offlineDownloadGuide: courseToEdit.offlineDownloadGuide || '',
        offlineDownloadFiles: (courseToEdit.offlineDownloadFiles || []).map(f => ({ ...f })),
        category: courseToEdit.category || 'فقه القضاء و فناوری',
        level: courseToEdit.level,
        hours: courseToEdit.hours,
        capacity: courseToEdit.capacity,
        schedule: courseToEdit.schedule,
        holdingTime: courseToEdit.holdingTime || courseToEdit.schedule || '',
        startDate: courseToEdit.startDate || '۱۴۰۳/۰۹/۰۱',
        endDate: courseToEdit.endDate || '۱۴۰۳/۱۰/۲۰',
        holdingFormat: courseToEdit.holdingFormat,
        venueAddress: courseToEdit.venueAddress || '',
        meetingLink: courseToEdit.meetingLink || 'https://lms.feqh-ghaza.ir/room/c',
        meetingAccessGuide: courseToEdit.meetingAccessGuide || '',
        hasCoverImage: Boolean(courseToEdit.coverImage),
        coverImage: courseToEdit.coverImage || '',
        allowedPaymentMethod: courseToEdit.allowedPaymentMethod || 'both',
        price: courseToEdit.price,
        hasInstallments: courseToEdit.hasInstallments || false,
        installmentDetails: courseToEdit.installmentDetails || '',
        installmentPlan:
          courseToEdit.installmentPlan && courseToEdit.installmentPlan.items?.length > 0
            ? courseToEdit.installmentPlan
            : buildDefaultInstallmentPlan(courseToEdit.price),
        hasCertificate: courseToEdit.hasCertificate || false,
        certificateDetails: courseToEdit.certificateDetails || '',
        hasPrerequisites: Boolean(courseToEdit.prerequisites),
        prerequisites: courseToEdit.prerequisites || '',
        description: courseToEdit.description,
        necessity: courseToEdit.necessity || '',
        managerNotes: courseToEdit.managerNotes || '',
        targetAudiences: courseToEdit.targetAudiences || [],
        customFields: courseToEdit.customFields || [],
        hiddenFields: courseToEdit.hiddenFields || [],
        topics: courseToEdit.topics || [],
        newTopicInput: '',
        customTags: courseToEdit.customTags || [],
        newTagInput: '',
        status: courseToEdit.status,
        archiveAccess: courseToEdit.archiveAccess || 'enrolled_only',
      });
    } else if (isOpen) {
      setDraftFolderKey(`new_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`);
      setBuilderForm({
        title: '',
        instructor: '',
        instructorTitle: '',
        instructorAvatarUrl: '',
        instructorResume: '',
        instructors: [],
        sessions: [],
        offlineDownloadGuide: '',
        offlineDownloadFiles: [],
        category: 'فقه القضاء و فناوری',
        level: 'تخصصی عالی (سطح ۴ و دکتری)',
        hours: 20,
        capacity: 40,
        schedule: 'پنج‌شنبه‌ها از ساعت ۰۹:۰۰ الی ۱۲:۰۰',
        holdingTime: 'پنج‌شنبه‌ها ساعت ۰۹:۰۰ الی ۱۲:۰۰',
        startDate: '۱۴۰۳/۰۹/۰۱',
        endDate: '۱۴۰۳/۱۰/۲۰',
        holdingFormat: 'online',
        venueAddress: 'قم، مجتمع نخبگان فقه و قضا',
        meetingLink: 'https://lms.feqh-ghaza.ir/room/new-course',
        meetingAccessGuide: 'ورود با نام کاربری کد ملی و کلمه عبور اختصاصی پیامک‌شده.',
        hasCoverImage: false,
        coverImage: '',
        allowedPaymentMethod: 'both',
        price: 750000,
        hasInstallments: false,
        installmentDetails: 'امکان پرداخت در ۲ قسط ۵۰ درصدی.',
        installmentPlan: buildDefaultInstallmentPlan(750000),
        hasCertificate: true,
        certificateDetails: 'گواهی پایان دوره رسمی ممهور به تمبر و مهر مرکز نخبگان.',
        hasPrerequisites: true,
        prerequisites: 'دانش‌آموختگان سطح ۳ و ۴ حوزوی، قضات محاکم یا وکلای دادگستری.',
        description: 'تحلیل تطبیقی و کاربردی مسائل مستحدثه با رویکرد فقهی و حقوقی معاصر.',
        necessity: '',
        managerNotes: '',
        targetAudiences: ['طلاب سطوح عالی و خارج', 'قضات دادگستری', 'وکلای پایه یک'],
        customFields: [],
        hiddenFields: [],
        topics: ['مبانی نظری و فقهی', 'بررسی رویه قضایی و آرای وحدت رویه مرتبط'],
        newTopicInput: '',
        customTags: ['گواهی رسمی ممهور'],
        newTagInput: '',
        status: 'enrolling',
        archiveAccess: 'enrolled_only',
      });
    }
  }, [courseToEdit, isOpen]);

  if (!isOpen) return null;

  const handleCourseCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;
    setSaveError(null);
    setUploadingCover(true);
    const prevUrl = builderForm.coverImage;
    try {
      const compressed = await compressImageFast(rawFile, 'cover');
      setCoverPreviewLocal(compressed.previewUrl);
      setCoverStats(
        compressed.savedPercent > 0
          ? `فشرده‌سازی ${toPersianNumbers(compressed.savedPercent)}٪ (${formatFileSizeLabel(compressed.compressedBytes)})`
          : formatFileSizeLabel(compressed.compressedBytes)
      );
      const uploaded = await api.uploadFile(compressed.file, 'course', {
        previousUrl: prevUrl && prevUrl.startsWith('/api/storage/') ? prevUrl : undefined,
      });
      setBuilderForm(prev => ({
        ...prev,
        hasCoverImage: true,
        coverImage: uploaded.url,
      }));
    } catch (err: any) {
      setSaveError(err?.message || 'خطا در آپلود تصویر بنر دوره روی سرور.');
    } finally {
      setUploadingCover(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    try {
      setIsSubmitting(true);
      const effectiveInstructors: CourseInstructorItem[] =
        builderForm.instructors.length > 0
          ? builderForm.instructors.map((inst, idx) =>
              idx === 0 || inst.isPrimary
                ? {
                    ...inst,
                    fullName: builderForm.instructor || inst.fullName,
                    title: builderForm.instructorTitle || inst.title,
                    avatarUrl: builderForm.instructorAvatarUrl || undefined,
                    resume: builderForm.instructorResume || inst.resume,
                  }
                : inst
            )
          : builderForm.instructor.trim()
          ? [
              {
                id: `inst_primary_${Date.now()}`,
                fullName: builderForm.instructor.trim(),
                title: builderForm.instructorTitle.trim() || undefined,
                roleLabel: 'مدرس اصلی دوره',
                avatarUrl: builderForm.instructorAvatarUrl || undefined,
                resume: builderForm.instructorResume || undefined,
                isPrimary: true,
              },
            ]
          : [];

      await onSave({
        title: builderForm.title,
        instructor: builderForm.instructor,
        instructorTitle: builderForm.instructorTitle,
        instructorAvatarUrl: builderForm.instructorAvatarUrl ? builderForm.instructorAvatarUrl : ('' as any),
        instructorResume: builderForm.instructorResume,
        instructors: effectiveInstructors,
        sessions: builderForm.sessions,
        sessionsCount:
          builderForm.sessions.length > 0
            ? builderForm.sessions.length
            : courseToEdit?.sessionsCount || 4,
        offlineDownloadGuide: builderForm.offlineDownloadGuide,
        offlineDownloadFiles: builderForm.offlineDownloadFiles,
        ...(!courseToEdit ? { draftFolderKey } : {}),
        category: builderForm.category,
        level: builderForm.level,
        hours: builderForm.hours,
        capacity: builderForm.capacity,
        schedule: builderForm.schedule,
        holdingTime: builderForm.holdingTime,
        startDate: builderForm.startDate,
        endDate: builderForm.endDate,
        holdingFormat: builderForm.holdingFormat,
        venueAddress: builderForm.venueAddress,
        meetingLink: builderForm.meetingLink,
        meetingAccessGuide: builderForm.meetingAccessGuide,
        coverImage:
          builderForm.hasCoverImage && builderForm.coverImage
            ? builderForm.coverImage
            : ('' as any),
        allowedPaymentMethod: builderForm.allowedPaymentMethod,
        price: builderForm.price,
        hasInstallments: builderForm.hasInstallments,
        installmentDetails: builderForm.installmentDetails,
        installmentPlan: builderForm.installmentPlan,
        hasCertificate: builderForm.hasCertificate,
        certificateDetails: builderForm.certificateDetails,
        prerequisites: builderForm.prerequisites,
        description: builderForm.description,
        necessity: builderForm.necessity,
        managerNotes: builderForm.managerNotes,
        targetAudiences: builderForm.targetAudiences,
        customFields: builderForm.customFields,
        hiddenFields: builderForm.hiddenFields,
        topics: builderForm.topics,
        customTags: builderForm.customTags,
        status: builderForm.status,
        archiveAccess: builderForm.archiveAccess,
      });
      onClose();
    } catch (err: any) {
      setSaveError(err?.message || 'خطا در ذخیره اطلاعات دوره در پایگاه داده.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-right text-slate-900 dark:text-slate-100 flex flex-col max-h-[92vh]"
          onClick={e => e.stopPropagation()}
        >
          <div className="p-5 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-amber-400 font-bold block mb-0.5">
                {isWorkshop
                  ? 'پنل هوشمند ویژه مسئول مشاوره و آموزش کارگاه‌ها (رزومه استاد، فیلدهای پویا، اقساط زمان‌بندی‌شده و جلسات)'
                  : 'پنل هوشمند ویژه مسئول آموزش (رزومه استاد، فیلدهای پویا، اقساط زمان‌بندی‌شده و سرفصل‌ها)'}
              </span>
              <h3 className="text-base font-black text-white">
                {courseToEdit
                  ? `ویرایش مشخصات و فیلدهای ${unitNoun}`
                  : isWorkshop
                  ? 'تعریف کارگاه آموزشی و روانشناختی جدید'
                  : 'تعریف دوره تخصصی و کارگاه آموزشی جدید'}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
            {saveError && (
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold">
                {saveError}
              </div>
            )}

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

            {/* 2. Course Image Management */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1">
                <h4 className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4" />
                  <span>۲. مدیریت تصویر و بنر دوره (ذخیره روی دیسک سرور):</span>
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
                  <input
                    ref={courseCoverInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCourseCoverUpload}
                    className="hidden"
                  />

                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div
                      onClick={() => {
                        const previewSrc = coverPreviewLocal || builderForm.coverImage;
                        if (previewSrc) {
                          onImagePreview({ url: previewSrc, title: 'پیش‌نمایش بنر دوره' });
                        }
                      }}
                      className="w-32 h-20 rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 shrink-0 bg-slate-900 cursor-pointer relative group flex items-center justify-center"
                      title="جهت بزرگنمایی کلیک کنید"
                    >
                      {coverPreviewLocal || builderForm.coverImage ? (
                        <>
                          <img
                            src={coverPreviewLocal || builderForm.coverImage}
                            alt="بنر دوره"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <ZoomIn className="w-4 h-4 text-white" />
                          </div>
                        </>
                      ) : (
                        <GraduationCap className="w-8 h-8 text-emerald-500/40" />
                      )}
                    </div>

                    <div className="space-y-2 flex-1 w-full text-right">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          disabled={uploadingCover}
                          onClick={() => courseCoverInputRef.current?.click()}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-bold shadow-xs cursor-pointer disabled:opacity-60"
                        >
                          {uploadingCover ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                          <span>{uploadingCover ? 'در حال فشرده‌سازی و ذخیره...' : 'بارگذاری سریع بنر از دستگاه'}</span>
                        </button>
                        {(coverPreviewLocal || builderForm.coverImage) && (
                          <button
                            type="button"
                            onClick={() => {
                              setCoverPreviewLocal(null);
                              setCoverStats(null);
                              setBuilderForm(prev => ({ ...prev, coverImage: '', hasCoverImage: false }));
                            }}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 text-xs font-bold cursor-pointer"
                            title="حذف بنر و پاکسازی از دیسک پس از ذخیره"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>حذف بنر</span>
                          </button>
                        )}
                        {coverStats && (
                          <span className="px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold tabular-nums">
                            {coverStats}
                          </span>
                        )}
                      </div>

                      <input
                        type="text"
                        value={builderForm.coverImage}
                        onChange={e => {
                          setCoverPreviewLocal(null);
                          setBuilderForm({ ...builderForm, coverImage: e.target.value });
                        }}
                        placeholder="/api/storage/courses/..."
                        className="w-full px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono dir-ltr"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Payment Method Policy Selector */}
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
                    تگ‌ها و برچسب‌های سفارشی دوره:
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

            <CourseBuilderAdvancedTabs
              courseId={courseToEdit?.id}
              draftFolderKey={draftFolderKey}
              primaryInstructorName={builderForm.instructor}
              onPrimaryInstructorNameChange={val => setBuilderForm(prev => ({ ...prev, instructor: val }))}
              instructorTitle={builderForm.instructorTitle}
              onInstructorTitleChange={val => setBuilderForm(prev => ({ ...prev, instructorTitle: val }))}
              instructorAvatarUrl={builderForm.instructorAvatarUrl}
              onInstructorAvatarChange={val => setBuilderForm(prev => ({ ...prev, instructorAvatarUrl: val }))}
              instructorResume={builderForm.instructorResume}
              onInstructorResumeChange={val => setBuilderForm(prev => ({ ...prev, instructorResume: val }))}
              instructors={builderForm.instructors}
              onInstructorsChange={val => setBuilderForm(prev => ({ ...prev, instructors: val }))}
              sessions={builderForm.sessions}
              onSessionsChange={val => setBuilderForm(prev => ({ ...prev, sessions: val }))}
              offlineDownloadFiles={builderForm.offlineDownloadFiles}
              onOfflineDownloadFilesChange={val => setBuilderForm(prev => ({ ...prev, offlineDownloadFiles: val }))}
              offlineDownloadGuide={builderForm.offlineDownloadGuide}
              onOfflineDownloadGuideChange={val => setBuilderForm(prev => ({ ...prev, offlineDownloadGuide: val }))}
              holdingTime={builderForm.holdingTime}
              onHoldingTimeChange={val => setBuilderForm(prev => ({ ...prev, holdingTime: val }))}
              necessity={builderForm.necessity}
              onNecessityChange={val => setBuilderForm(prev => ({ ...prev, necessity: val }))}
              managerNotes={builderForm.managerNotes}
              onManagerNotesChange={val => setBuilderForm(prev => ({ ...prev, managerNotes: val }))}
              targetAudiences={builderForm.targetAudiences}
              onTargetAudiencesChange={val => setBuilderForm(prev => ({ ...prev, targetAudiences: val }))}
              customFields={builderForm.customFields}
              onCustomFieldsChange={val => setBuilderForm(prev => ({ ...prev, customFields: val }))}
              hiddenFields={builderForm.hiddenFields}
              onHiddenFieldsChange={val => setBuilderForm(prev => ({ ...prev, hiddenFields: val }))}
              hasInstallments={builderForm.hasInstallments}
              onHasInstallmentsChange={val => setBuilderForm(prev => ({ ...prev, hasInstallments: val }))}
              installmentPlan={builderForm.installmentPlan}
              onInstallmentPlanChange={val => setBuilderForm(prev => ({ ...prev, installmentPlan: val }))}
              coursePrice={builderForm.price}
            />

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="submit"
                disabled={isSubmitting || uploadingCover}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-black shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'در حال ثبت...' : courseToEdit ? 'ذخیره تغییرات دوره' : 'ثبت و انتشار دوره'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
