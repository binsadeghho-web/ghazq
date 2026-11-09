import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Course } from '../../../types';
import {
  X,
  ZoomIn,
  Sparkles,
  Radio,
  Copy,
  ExternalLink,
  Download,
  Video,
  FileText
} from 'lucide-react';

interface CourseAttendanceModalProps {
  course: Course | null;
  onClose: () => void;
  onImageClick: (img: { url: string; title: string }) => void;
}

export const CourseAttendanceModal: React.FC<CourseAttendanceModalProps> = ({
  course,
  onClose,
  onImageClick,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);

  if (!course) return null;

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const bannerImg = course.postEnrollmentBanner || course.coverImage;

  return (
    <AnimatePresence>
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
              <h3 className="text-base font-black text-white">{course.title}</h3>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto space-y-5 flex-1">
            {/* 1. Custom Post-Enrollment Banner or Course Cover */}
            {bannerImg && (
              <div
                onClick={() => onImageClick({ url: bannerImg, title: course.title })}
                className="w-full h-44 rounded-2xl overflow-hidden relative shadow-md cursor-pointer group border border-slate-200 dark:border-slate-800"
                title="جهت مشاهده تصویر در اندازه اصلی کلیک فرمایید"
              >
                <img
                  src={bannerImg}
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-bold">
                  <ZoomIn className="w-4 h-4 text-emerald-400" />
                  <span>مشاهده تصویر بزرگ</span>
                </div>
              </div>
            )}

            {/* 2. Admin Configured Message & Reminder Box with dynamic font size and colors */}
            {course.postEnrollmentMessage ? (
              <div className={`p-4 rounded-2xl border transition-all ${
                course.welcomeBoxBgColor === 'amber'
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-950 dark:text-amber-100 border-amber-300 dark:border-amber-800'
                  : course.welcomeBoxBgColor === 'slate'
                  ? 'bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700'
                  : course.welcomeBoxBgColor === 'indigo'
                  ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-100 border-indigo-300 dark:border-indigo-800'
                  : course.welcomeBoxBgColor === 'rose'
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-950 dark:text-rose-100 border-rose-300 dark:border-rose-800'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 border-emerald-300 dark:border-emerald-800'
              }`}>
                <div className="flex items-center gap-2 mb-2 font-black text-xs opacity-80">
                  <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>پیام و راهنمای دوره ویژه ثبت‌نام‌شدگان گرامی:</span>
                </div>
                <p className={`font-semibold leading-relaxed ${
                  course.welcomeBoxFontSize === 'sm' ? 'text-xs' : course.welcomeBoxFontSize === 'lg' ? 'text-base' : course.welcomeBoxFontSize === 'xl' ? 'text-lg font-black' : 'text-sm'
                }`}>
                  {course.postEnrollmentMessage}
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100 text-sm font-semibold leading-relaxed">
                ضمن تشکر و تبریک ثبت‌نام قطعی شما در دوره تخصصی «{course.title}»، دسترسی شما به تالار کلاس و منابع آموزشی برقرار گردید.
              </div>
            )}

            {/* 3. Online Class Meeting Box (اگر آنلاین باشد یا لینک داشته باشد) */}
            {(course.holdingFormat !== 'in_person' || course.meetingLink) && (
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
                {(course.reminderDate || course.reminderSchedule || course.schedule) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div>
                      <span className="text-slate-400 block text-[10px]">تاریخ برگزاری / شروع:</span>
                      <strong className="text-slate-900 dark:text-white font-bold">
                        {course.reminderDate || course.startDate || 'طبق تقویم آموزشی'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">ساعت و روزهای برگزاری:</span>
                      <strong className="text-slate-900 dark:text-white font-bold">
                        {course.reminderSchedule || course.schedule}
                      </strong>
                    </div>
                  </div>
                )}

                {/* Meeting Link & Quick Copy */}
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-800 dark:text-slate-200 truncate dir-ltr max-w-sm">
                    {course.meetingLink}
                  </span>
                  <button
                    onClick={() => handleCopyLink(course.meetingLink)}
                    className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedLink ? 'کپی شد' : 'کپی لینک'}</span>
                  </button>
                </div>

                {course.meetingAccessGuide && (
                  <div className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                    <strong>راهنمای ورود: </strong>{course.meetingAccessGuide}
                  </div>
                )}

                <a
                  href={course.meetingLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-stone-950 rounded-xl text-xs font-black shadow-md cursor-pointer transition-colors"
                >
                  <span>ورود مستقیم به تالار مجازی کلاس آنلاین</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            )}

            {/* 4. Offline Course Downloads Section */}
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

              {course.offlineDownloadGuide && (
                <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
                  {course.offlineDownloadGuide}
                </p>
              )}

              {/* Offline Download Files List */}
              {course.offlineDownloadFiles && course.offlineDownloadFiles.length > 0 ? (
                <div className="space-y-2">
                  {course.offlineDownloadFiles.map(file => (
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
              ) : course.archiveResources && course.archiveResources.length > 0 ? (
                <div className="space-y-2">
                  {course.archiveResources.map(res => (
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
    </AnimatePresence>
  );
};
