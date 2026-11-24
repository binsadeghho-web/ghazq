import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Course } from '../../../types';
import { api } from '../../../services/apiClient';
import { toPersianNumbers } from '../../../utils/persianNumbers';
import {
  X,
  ZoomIn,
  Sparkles,
  Radio,
  Copy,
  ExternalLink,
  Download,
  Video,
  FileText,
  Calendar,
  Loader2,
  ShieldAlert,
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
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  if (!course) return null;

  const isRemovedFromClass = course.classStatus === 'removed';

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDownloadResource = async (
    key: string,
    url?: string,
    suggestedName?: string
  ) => {
    if (!url) return;
    setDownloadError(null);
    if (url.startsWith('/api/storage/private/')) {
      setDownloadingKey(key);
      try {
        await api.downloadPrivateFile(url, suggestedName);
      } catch (err: any) {
        setDownloadError(
          err?.message || 'دسترسی دانلود به این فایل مسدود یا با خطا مواجه شد.'
        );
      } finally {
        setDownloadingKey(null);
      }
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const bannerImg = course.postEnrollmentBanner || course.coverImage;
  const hidden = new Set(course.hiddenFields || []);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-1 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-hidden" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-t-[26px] sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-right text-slate-900 dark:text-slate-100 flex flex-col max-h-[92dvh] sm:max-h-[88vh]"
          onClick={e => e.stopPropagation()}
        >
          <div className="p-4 sm:p-5 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
            <div className="min-w-0">
              <span className="text-[11px] text-emerald-400 font-bold block mb-0.5 truncate">
                تالار اختصاصی دوره، برنامه جلسات و منابع دانلودی
              </span>
              <h3 className="text-sm sm:text-base font-black text-white truncate">{course.title}</h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="بستن"
              className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 sm:p-6 overflow-y-auto overscroll-y-contain space-y-5 flex-1 min-h-0">
            {isRemovedFromClass ? (
              <div className="p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border-2 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 space-y-2 text-center">
                <ShieldAlert className="w-10 h-10 mx-auto text-rose-600" />
                <h4 className="text-sm font-black">
                  عضویت کلاسی شما در این دوره توسط مدیر آموزش لغو شده است
                </h4>
                <p className="text-xs leading-relaxed opacity-90">
                  دسترسی شما به جلسات آنلاین و فایل‌های اختصاصی دوره غیرفعال گردیده است. کلیه سوابق مالی و فیش‌های پرداختی شما در سامانه محفوظ است.
                </p>
              </div>
            ) : (
              <>
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

                {/* 2. Admin Configured Message */}
                {course.postEnrollmentMessage ? (
                  <div
                    className={`p-4 rounded-2xl border transition-all ${
                      course.welcomeBoxBgColor === 'amber'
                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-950 dark:text-amber-100 border-amber-300 dark:border-amber-800'
                        : course.welcomeBoxBgColor === 'slate'
                        ? 'bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700'
                        : course.welcomeBoxBgColor === 'indigo'
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-100 border-indigo-300 dark:border-indigo-800'
                        : course.welcomeBoxBgColor === 'rose'
                        ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-950 dark:text-rose-100 border-rose-300 dark:border-rose-800'
                        : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 border-emerald-300 dark:border-emerald-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2 font-black text-xs opacity-80">
                      <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>پیام و راهنمای دوره ویژه ثبت‌نام‌شدگان گرامی:</span>
                    </div>
                    <p
                      className={`font-semibold leading-relaxed ${
                        course.welcomeBoxFontSize === 'sm'
                          ? 'text-xs'
                          : course.welcomeBoxFontSize === 'lg'
                          ? 'text-base'
                          : course.welcomeBoxFontSize === 'xl'
                          ? 'text-lg font-black'
                          : 'text-sm'
                      }`}
                    >
                      {course.postEnrollmentMessage}
                    </p>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100 text-sm font-semibold leading-relaxed">
                    ضمن تشکر و تبریک ثبت‌نام قطعی شما در دوره تخصصی «{course.title}»، دسترسی شما به تالار کلاس و منابع آموزشی برقرار گردید.
                  </div>
                )}

                {/* 3. Multi-Session Schedule (if defined) */}
                {!hidden.has('sessions') && course.sessions && course.sessions.length > 0 && (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
                    <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-sky-600" />
                      <span>برنامه جلسات دوره ({toPersianNumbers(course.sessions.length)} جلسه):</span>
                    </h4>
                    <div className="space-y-2">
                      {course.sessions.map((sess, idx) => (
                        <div
                          key={sess.id || idx}
                          className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded bg-sky-500/15 text-sky-700 dark:text-sky-300 font-black text-[10px] tabular-nums">
                                جلسه {toPersianNumbers(sess.sessionNumber || idx + 1)}
                              </span>
                              <strong className="text-slate-900 dark:text-white">{sess.title}</strong>
                            </div>
                            {sess.presenterMode !== 'unspecified' && sess.presenterName && (
                              <span className="text-[11px] text-slate-500 block">
                                ارائه‌دهنده: {sess.presenterName}
                                {sess.presenterTitle ? ` (${sess.presenterTitle})` : ''}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 tabular-nums">
                            {sess.sessionDate && <span>{toPersianNumbers(sess.sessionDate)}</span>}
                            {sess.startTime && <span>ساعت {toPersianNumbers(sess.startTime)}</span>}
                            {sess.meetingLink && (
                              <a
                                href={sess.meetingLink}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1 hover:bg-emerald-500/25"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>ورود</span>
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Online Class Meeting Box */}
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
                        <strong>راهنمای ورود: </strong>
                        {course.meetingAccessGuide}
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

                {/* 5. Offline Course Downloads Section (Uses Authenticated Blob Download for Private Disk Files) */}
                <div className="p-4 rounded-2xl bg-sky-50/60 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-900/50 space-y-3">
                  <div className="flex items-center justify-between border-b border-sky-200 dark:border-sky-900/50 pb-2">
                    <h4 className="text-xs font-black text-sky-900 dark:text-sky-300 flex items-center gap-2">
                      <Download className="w-4 h-4 text-sky-600" />
                      <span>فایل‌های دوره، جلسات ضبط‌شده و جزوات جهت دانلود:</span>
                    </h4>
                    <span className="text-[10px] font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full">
                      دسترسی اختصاصی شرکت‌کنندگان
                    </span>
                  </div>

                  {course.offlineDownloadGuide && (
                    <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
                      {course.offlineDownloadGuide}
                    </p>
                  )}

                  {downloadError && (
                    <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold">
                      {downloadError}
                    </div>
                  )}

                  {course.offlineDownloadFiles && course.offlineDownloadFiles.length > 0 ? (
                    <div className="space-y-2">
                      {course.offlineDownloadFiles.map((file, idx) => {
                        const fileUrl = file.url || file.downloadUrl || '';
                        const fileKey = file.id || String(idx);
                        const isDownloading = downloadingKey === fileKey;
                        return (
                          <div
                            key={fileKey}
                            className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs shadow-2xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="w-9 h-8 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center font-bold text-[10px] shrink-0">
                                {file.format || file.fileType || 'FILE'}
                              </span>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <strong className="text-slate-900 dark:text-white font-bold truncate">
                                    {file.title}
                                  </strong>
                                  {file.sessionNumber && (
                                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 text-[10px] font-bold shrink-0">
                                      جلسه {toPersianNumbers(file.sessionNumber)}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-400 font-mono tabular-nums">
                                  حجم: {file.size || 'نامشخص'}
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              disabled={!fileUrl || isDownloading}
                              onClick={() =>
                                handleDownloadResource(fileKey, fileUrl, file.filename || file.title)
                              }
                              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs transition-colors shrink-0 cursor-pointer disabled:opacity-60"
                            >
                              {isDownloading ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Download className="w-3.5 h-3.5" />
                              )}
                              <span>{isDownloading ? 'در حال دریافت...' : 'دانلود فایل'}</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : course.archiveResources && course.archiveResources.length > 0 ? (
                    <div className="space-y-2">
                      {course.archiveResources.map((res, idx) => {
                        const fileKey = res.id || `arch_${idx}`;
                        const isDownloading = downloadingKey === fileKey;
                        return (
                          <div
                            key={fileKey}
                            className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2.5">
                              {res.type === 'video' ? (
                                <Video className="w-4 h-4 text-sky-500" />
                              ) : (
                                <FileText className="w-4 h-4 text-emerald-500" />
                              )}
                              <div>
                                <span className="font-bold text-slate-900 dark:text-white block">
                                  {res.title}
                                </span>
                                {res.size && (
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    حجم: {res.size}
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              type="button"
                              disabled={!res.url || isDownloading}
                              onClick={() => handleDownloadResource(fileKey, res.url, res.title)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs cursor-pointer"
                            >
                              {isDownloading ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Download className="w-3.5 h-3.5" />
                              )}
                              <span>دریافت فایل</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 text-center text-[11px] text-slate-500">
                      فایل‌های جلسات آموزشی این دوره به زودی در این قسمت قرار خواهد گرفت.
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
