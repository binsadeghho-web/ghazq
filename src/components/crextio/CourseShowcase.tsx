import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  UserCheck,
  CheckCircle2,
  Edit3,
  Pause,
  Play,
} from 'lucide-react';
import { Course } from '../../types';
import { toPersianNumbers } from '../../utils/persianNumbers';
import { useApp } from '../../context/AppContext';
import { resolveShowcaseImageUrl } from '../../data/showcaseImages';
import { CourseShowcaseEditModal } from './CourseShowcaseEditModal';

interface CourseShowcaseProps {
  courses: Course[];
  onSelectCourse?: (course: Course) => void;
  mode?: 'carousel' | 'grid' | 'compact';
}

export const CourseShowcase: React.FC<CourseShowcaseProps> = ({
  courses: initialCourses,
  onSelectCourse,
  mode = 'carousel'
}) => {
  const { currentUser, crextioConfig, updateCrextioConfig, isAlumniPreview } = useApp();
  const isAdmin =
    (currentUser?.role === 'admin' ||
      currentUser?.role === 'super_admin' ||
      currentUser?.role === 'alumni_manager' ||
      currentUser?.role === 'supervisor') &&
    !isAlumniPreview;

  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const activeMode = crextioConfig.courseShowcaseMode || mode;
  const showPrice = crextioConfig.courseShowcaseShowPrice !== false;
  const intervalSeconds = Math.max(2, Number(crextioConfig.courseShowcaseInterval) || 5);
  const autoplay = crextioConfig.courseShowcaseAutoplay !== false;
  const selectedIds = crextioConfig.courseShowcaseSelectedIds;
  const customCourseData = crextioConfig.courseShowcaseCustomData || {};
  const showcaseCoverImg = resolveShowcaseImageUrl(
    'course_showcase',
    crextioConfig.showcaseImageOverrides
  );

  const displayCourses = useMemo(() => {
    const filtered =
      Array.isArray(selectedIds) && selectedIds.length > 0
        ? initialCourses.filter(c => selectedIds.includes(c.id))
        : initialCourses;
    const base = filtered.length > 0 ? filtered : initialCourses;
    return base.map(c => ({
      ...c,
      ...(customCourseData[c.id] || {}),
    }));
  }, [initialCourses, selectedIds, customCourseData]);

  useEffect(() => {
    if (!displayCourses || displayCourses.length <= 1 || activeMode !== 'carousel' || !autoplay || isPaused) {
      return;
    }
    const interval = setInterval(() => {
      setIndex(prev => (prev + 1) % displayCourses.length);
    }, intervalSeconds * 1000);
    return () => clearInterval(interval);
  }, [displayCourses, activeMode, autoplay, isPaused, intervalSeconds]);

  if (!displayCourses || displayCourses.length === 0) {
    if (isAdmin) {
      return (
        <div className="w-full p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-2">
          <p className="text-xs font-bold text-emerald-900">ویترین دوره‌های علمی (هیچ دوره‌ای انتخاب نشده است)</p>
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="px-4 py-1.5 rounded-xl bg-emerald-700 text-white text-xs font-bold cursor-pointer"
          >
            ویرایش و انتخاب دوره‌ها
          </button>
          <CourseShowcaseEditModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            initialCourses={initialCourses}
            crextioConfig={crextioConfig}
            updateCrextioConfig={updateCrextioConfig}
          />
        </div>
      );
    }
    return null;
  }

  const currentCourse = displayCourses[index % displayCourses.length];

  return (
    <div
      className="relative w-full"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Admin Quick Floating Edit Button */}
      {isAdmin && (
        <button
          onClick={() => setIsEditModalOpen(true)}
          className="mb-2.5 sm:mb-0 sm:absolute sm:top-4 sm:left-4 z-30 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 hover:bg-white text-stone-800 border border-stone-300 text-xs font-bold shadow-md backdrop-blur-md transition-all active:scale-95 cursor-pointer"
        >
          <Edit3 className="w-3.5 h-3.5 text-amber-600" />
          <span>ویرایش ویترین دوره‌ها</span>
        </button>
      )}

      {activeMode === 'grid' ? (
        <div className="w-full space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-700" />
                <h3 className="font-extrabold text-base text-stone-900">
                  {crextioConfig.courseShowcaseTitle || 'ویترین شبکه‌ای دوره‌های تخصصی فقه و قضا'}
                </h3>
              </div>
              {crextioConfig.courseShowcaseSubtitle && (
                <p className="text-xs text-stone-500 mt-0.5">{crextioConfig.courseShowcaseSubtitle}</p>
              )}
            </div>
            <span className="text-xs font-bold text-stone-500 bg-stone-100 px-3 py-1 rounded-full">
              {toPersianNumbers(displayCourses.length)} دوره فعال
            </span>
          </div>
          <div className="flex overflow-x-auto snap-x snap-mandatory gap-3 pb-2 scrollbar-none md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:pb-0">
            {displayCourses.slice(0, 3).map((c) => {
              const cardCover = c.coverImage || showcaseCoverImg;
              return (
                <motion.div
                  key={c.id}
                  whileHover={{ y: -4 }}
                  className="min-w-[78vw] sm:min-w-[300px] md:min-w-0 snap-start shrink-0 md:shrink bg-gradient-to-br from-[#122A22] to-[#0A1713] text-white rounded-2xl sm:rounded-[28px] border border-emerald-600/30 shadow-md flex flex-col justify-between overflow-hidden"
                >
                  {cardCover && (
                    <div className="relative h-28 w-full overflow-hidden">
                      <img
                        src={cardCover}
                        alt={c.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0A1713] via-black/30 to-transparent" />
                    </div>
                  )}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                          {c.level}
                        </span>
                        <span className="text-stone-300 font-medium">
                          {toPersianNumbers(c.hours)} ساعت
                        </span>
                      </div>
                      <h4 className="font-extrabold text-sm text-white line-clamp-1">{c.title}</h4>
                      <p className="text-xs text-emerald-200/80 font-medium">{c.instructor}</p>
                      <p className="text-xs text-stone-300/80 line-clamp-2 leading-relaxed">{c.description}</p>
                    </div>
                    <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                      {showPrice ? (
                        <span className="font-bold text-emerald-300">
                          {c.price > 0 ? `${toPersianNumbers(c.price.toLocaleString('fa-IR'))} تومان` : 'رایگان اعضا'}
                        </span>
                      ) : (
                        <span className="font-bold text-emerald-300">ویژه اعضای کانون</span>
                      )}
                      <button
                        onClick={() => onSelectCourse?.(c)}
                        className="px-3 py-1 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all cursor-pointer"
                      >
                        {isAdmin ? 'مدیریت دوره' : crextioConfig.courseShowcaseCtaText || 'مشاهده و ثبت‌نام'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      ) : activeMode === 'compact' ? (
        <div className="w-full bg-[#FCFCF9]/95 p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border border-[#E3E0D3] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-800 text-white flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-bold">
                  {crextioConfig.courseShowcaseBadge || 'ویترین فشرده دوره‌ها'}
                </span>
                <span className="text-xs font-bold text-stone-900">{currentCourse.title}</span>
              </div>
              <p className="text-[11px] text-stone-500 mt-0.5">
                مدرس: {currentCourse.instructor} · مدت: {toPersianNumbers(currentCourse.hours)} ساعت · سطح: {currentCourse.level}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
            {showPrice && (
              <span className="text-xs font-bold text-emerald-800 sm:ml-2">
                {currentCourse.price > 0 ? `${toPersianNumbers(currentCourse.price.toLocaleString('fa-IR'))} تومان` : 'رایگان'}
              </span>
            )}
            <button
              onClick={() => onSelectCourse?.(currentCourse)}
              className="px-3.5 py-2 sm:py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              {isAdmin ? 'مدیریت دوره' : crextioConfig.courseShowcaseCtaText || 'ورود به دوره'}
            </button>
          </div>
        </div>
      ) : (
        /* Carousel View (Mode 1: Featured Courses Slider with configurable timer + cover image) */
        <div className="relative w-full min-h-[240px] sm:min-h-[280px] overflow-hidden rounded-2xl sm:rounded-[36px] shadow-xl group bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900 border border-emerald-500/20 text-white p-4 sm:p-8 flex flex-col justify-between">
          {(currentCourse.coverImage || showcaseCoverImg) && (
            <div className="absolute inset-0 pointer-events-none opacity-25">
              <img
                src={currentCourse.coverImage || showcaseCoverImg}
                alt={currentCourse.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-950/75 to-transparent" />
            </div>
          )}
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          <AnimatePresence mode="wait">
            <motion.div
              key={currentCourse.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="relative z-10 space-y-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5 backdrop-blur-md">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                  {crextioConfig.courseShowcaseBadge || 'ویترین ویژه دوره‌های علمی'}
                </span>
                <span className="px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs font-medium">
                  سطح: {currentCourse.level}
                </span>
                <span className="px-3 py-1 rounded-full bg-emerald-600/40 text-emerald-200 text-xs font-bold">
                  {toPersianNumbers(currentCourse.hours)} ساعت آموزش
                </span>
                <span className="text-[11px] text-emerald-200/80 font-medium">
                  هر {toPersianNumbers(intervalSeconds)} ثانیه
                </span>
              </div>

              <div className="space-y-2">
                <h2 className="text-lg sm:text-3xl font-extrabold text-white leading-tight">
                  {currentCourse.title}
                </h2>
                <p className="text-emerald-100/80 text-xs sm:text-sm font-medium flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  مدرس: {currentCourse.instructor}
                </p>
              </div>

              <p className="text-white/70 text-xs sm:text-sm line-clamp-2 max-w-2xl leading-relaxed">
                {currentCourse.description}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Footer Controls & CTA */}
          <div className="relative z-10 pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-white/10 mt-4">
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full sm:w-auto justify-between sm:justify-start">
              {showPrice ? (
                <span className="text-sm sm:text-base font-bold text-emerald-400">
                  {currentCourse.price > 0 ? `${toPersianNumbers(currentCourse.price.toLocaleString('fa-IR'))} تومان` : 'رایگان (ویژه اعضا)'}
                </span>
              ) : (
                <span className="text-xs sm:text-sm font-bold text-emerald-300">
                  دوره تخصصی کانون دانش‌آموختگان
                </span>
              )}
              {currentCourse.isEnrolled && (
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  ثبت‌نام شده
                </span>
              )}
              <button
                onClick={() => onSelectCourse?.(currentCourse)}
                className="px-4 py-2 sm:py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-xs shadow-md transition-all cursor-pointer"
              >
                {isAdmin ? 'پنل مدیریت دوره' : 'مشاهده و ثبت‌نام'}
              </button>
            </div>

            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
              <div className="flex items-center gap-1.5">
                {displayCourses.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setIndex(i)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      i === index % displayCourses.length ? 'w-6 bg-emerald-400' : 'w-2 bg-white/30 hover:bg-white/50'
                    }`}
                    title={`دوره ${toPersianNumbers(i + 1)}`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPaused(p => !p)}
                  className="w-9 h-9 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer"
                  title={isPaused ? 'ادامه پخش' : 'توقف'}
                >
                  {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setIndex((prev) => (prev - 1 + displayCourses.length) % displayCourses.length)}
                  className="w-9 h-9 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors active:scale-95 cursor-pointer"
                  aria-label="قبلی"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIndex((prev) => (prev + 1) % displayCourses.length)}
                  className="w-9 h-9 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors active:scale-95 cursor-pointer"
                  aria-label="بعدی"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN FULL EDIT MODAL (MySQL-persisted) */}
      <CourseShowcaseEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        initialCourses={initialCourses}
        crextioConfig={crextioConfig}
        updateCrextioConfig={updateCrextioConfig}
      />
    </div>
  );
};


