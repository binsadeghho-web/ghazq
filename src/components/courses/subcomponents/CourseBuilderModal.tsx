import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Course } from '../../../types';
import {
  X,
  Image as ImageIcon,
  ZoomIn,
  UploadCloud,
  Check
} from 'lucide-react';

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

interface CourseBuilderModalProps {
  isOpen: boolean;
  courseToEdit: Course | null;
  onClose: () => void;
  onSave: (courseData: Partial<Course>) => Promise<void>;
  onImagePreview: (img: { url: string; title: string }) => void;
}

export const CourseBuilderModal: React.FC<CourseBuilderModalProps> = ({
  isOpen,
  courseToEdit,
  onClose,
  onSave,
  onImagePreview,
}) => {
  const courseCoverInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  useEffect(() => {
    if (courseToEdit) {
      setBuilderForm({
        title: courseToEdit.title,
        instructor: courseToEdit.instructor,
        instructorTitle: courseToEdit.instructorTitle || '',
        category: courseToEdit.category || 'فقه القضاء و فناوری',
        level: courseToEdit.level,
        hours: courseToEdit.hours,
        capacity: courseToEdit.capacity,
        schedule: courseToEdit.schedule,
        startDate: courseToEdit.startDate || '۱۴۰۳/۰۹/۰۱',
        endDate: courseToEdit.endDate || '۱۴۰۳/۱۰/۲۰',
        holdingFormat: courseToEdit.holdingFormat,
        venueAddress: courseToEdit.venueAddress || '',
        meetingLink: courseToEdit.meetingLink || 'https://lms.feqh-ghaza.ir/room/c',
        meetingAccessGuide: courseToEdit.meetingAccessGuide || '',
        hasCoverImage: Boolean(courseToEdit.coverImage),
        coverImage: courseToEdit.coverImage || PRESET_COURSE_COVERS[0].url,
        allowedPaymentMethod: courseToEdit.allowedPaymentMethod || 'both',
        price: courseToEdit.price,
        hasInstallments: courseToEdit.hasInstallments || false,
        installmentDetails: courseToEdit.installmentDetails || '',
        hasCertificate: courseToEdit.hasCertificate || false,
        certificateDetails: courseToEdit.certificateDetails || '',
        hasPrerequisites: Boolean(courseToEdit.prerequisites),
        prerequisites: courseToEdit.prerequisites || '',
        description: courseToEdit.description,
        topics: courseToEdit.topics || [],
        newTopicInput: '',
        customTags: courseToEdit.customTags || [],
        newTagInput: '',
        status: courseToEdit.status,
        archiveAccess: courseToEdit.archiveAccess || 'enrolled_only',
      });
    }
  }, [courseToEdit]);

  if (!isOpen) return null;

  const handleCourseCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setBuilderForm(prev => ({
            ...prev,
            hasCoverImage: true,
            coverImage: reader.result as string,
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await onSave({
        title: builderForm.title,
        instructor: builderForm.instructor,
        instructorTitle: builderForm.instructorTitle,
        category: builderForm.category,
        level: builderForm.level,
        hours: builderForm.hours,
        capacity: builderForm.capacity,
        schedule: builderForm.schedule,
        startDate: builderForm.startDate,
        endDate: builderForm.endDate,
        holdingFormat: builderForm.holdingFormat,
        venueAddress: builderForm.venueAddress,
        meetingLink: builderForm.meetingLink,
        meetingAccessGuide: builderForm.meetingAccessGuide,
        coverImage: builderForm.hasCoverImage ? builderForm.coverImage : undefined,
        allowedPaymentMethod: builderForm.allowedPaymentMethod,
        price: builderForm.price,
        hasInstallments: builderForm.hasInstallments,
        installmentDetails: builderForm.installmentDetails,
        hasCertificate: builderForm.hasCertificate,
        certificateDetails: builderForm.certificateDetails,
        prerequisites: builderForm.prerequisites,
        description: builderForm.description,
        topics: builderForm.topics,
        customTags: builderForm.customTags,
        status: builderForm.status,
        archiveAccess: builderForm.archiveAccess,
      });
      onClose();
    } catch (err) {
      console.error(err);
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
          className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-right text-slate-900 dark:text-slate-100 flex flex-col max-h-[90vh]"
          onClick={e => e.stopPropagation()}
        >
          <div className="p-5 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-amber-400 font-bold block mb-0.5">
                پنل هوشمند ویژه مسئول آموزش (تنظیمات شیوه پرداخت، تصویر دوره و سرفصل‌ها)
              </span>
              <h3 className="text-base font-black text-white">
                {courseToEdit ? 'ویرایش مشخصات و دسترسی‌های دوره' : 'تعریف دوره تخصصی و کارگاه آموزشی جدید'}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
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
                  <input
                    ref={courseCoverInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCourseCoverUpload}
                    className="hidden"
                  />

                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div
                      onClick={() => onImagePreview({ url: builderForm.coverImage, title: 'پیش‌نمایش بنر دوره' })}
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

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
              >
                انصراف
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
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
