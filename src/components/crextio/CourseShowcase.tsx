import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Clock,
  UserCheck,
  CheckCircle2
} from 'lucide-react';
import { Course } from '../../types';
import { toPersianNumbers } from '../../utils/persianNumbers';

interface CourseShowcaseProps {
  courses: Course[];
  onSelectCourse?: (course: Course) => void;
  mode?: 'carousel' | 'grid' | 'compact';
}

export const CourseShowcase: React.FC<CourseShowcaseProps> = ({ courses, onSelectCourse, mode = 'carousel' }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!courses || courses.length === 0 || mode !== 'carousel') return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % courses.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [courses, mode]);

  if (!courses || courses.length === 0) return null;

  if (mode === 'grid') {
    return (
      <div className="w-full space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-700" />
            <h3 className="font-extrabold text-base text-stone-900">ویترین شبکه‌ای دوره‌های تخصصی فقه و قضا</h3>
          </div>
          <span className="text-xs font-bold text-stone-500 bg-stone-100 px-3 py-1 rounded-full">
            {toPersianNumbers(courses.length)} دوره فعال
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {courses.slice(0, 3).map((c) => (
            <motion.div
              key={c.id}
              whileHover={{ y: -4 }}
              className="bg-gradient-to-br from-[#122A22] to-[#0A1713] text-white p-5 rounded-[28px] border border-emerald-600/30 shadow-md flex flex-col justify-between space-y-3"
            >
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
                <span className="font-bold text-emerald-300">
                  {c.price > 0 ? `${toPersianNumbers(c.price.toLocaleString('fa-IR'))} تومان` : 'رایگان اعضا'}
                </span>
                <button
                  onClick={() => onSelectCourse?.(c)}
                  className="px-3 py-1 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all"
                >
                  مشاهده و ثبت‌نام
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  if (mode === 'compact') {
    const compactCourse = courses[index % courses.length];
    return (
      <div className="w-full bg-[#FCFCF9]/95 p-4 rounded-3xl border border-[#E3E0D3] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-800 text-white flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5 text-emerald-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-bold">
                ویترین فشرده دوره‌ها
              </span>
              <span className="text-xs font-bold text-stone-900">{compactCourse.title}</span>
            </div>
            <p className="text-[11px] text-stone-500 mt-0.5">
              مدرس: {compactCourse.instructor} · مدت: {toPersianNumbers(compactCourse.hours)} ساعت · سطح: {compactCourse.level}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => setIndex((prev) => (prev - 1 + courses.length) % courses.length)}
            className="p-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIndex((prev) => (prev + 1) % courses.length)}
            className="p-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onSelectCourse?.(compactCourse)}
            className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all"
          >
            ورود به دوره
          </button>
        </div>
      </div>
    );
  }

  const currentCourse = courses[index];

  return (
    <div className="relative w-full min-h-[280px] overflow-hidden rounded-[36px] shadow-xl group bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900 border border-emerald-500/20 text-white p-6 sm:p-8 flex flex-col justify-between">
      {/* Dynamic Background Glow Effect */}
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
              ویترین ویژه دوره‌های علمی
            </span>
            <span className="px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs font-medium">
              سطح: {currentCourse.level}
            </span>
            <span className="px-3 py-1 rounded-full bg-emerald-600/40 text-emerald-200 text-xs font-bold">
              {toPersianNumbers(currentCourse.hours)} ساعت آموزش
            </span>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
              {currentCourse.title}
            </h2>
            <p className="text-emerald-100/80 text-sm font-medium flex items-center gap-2">
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
        <div className="flex items-center gap-3">
          <span className="text-base font-bold text-emerald-400">
            {currentCourse.price > 0 ? `${toPersianNumbers(currentCourse.price.toLocaleString('fa-IR'))} تومان` : 'رایگان (ویژه اعضا)'}
          </span>
          {currentCourse.isEnrolled && (
            <span className="px-3 py-1 rounded-full bg-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              ثبت‌نام شده
            </span>
          )}
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {courses.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`h-2 rounded-full transition-all ${
                  i === index ? 'w-6 bg-emerald-400' : 'w-2 bg-white/30 hover:bg-white/50'
                }`}
                title={`دوره ${toPersianNumbers(i + 1)}`}
              />
            ))}
          </div>

          {/* Nav arrows */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIndex((prev) => (prev - 1 + courses.length) % courses.length)}
              className="w-9 h-9 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors active:scale-95"
              aria-label="قبلی"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIndex((prev) => (prev + 1) % courses.length)}
              className="w-9 h-9 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors active:scale-95"
              aria-label="بعدی"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
