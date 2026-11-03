import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Clock,
  UserCheck,
  CheckCircle2,
  Edit3,
  X,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Check,
  RotateCcw
} from 'lucide-react';
import { Course } from '../../types';
import { toPersianNumbers } from '../../utils/persianNumbers';
import { useApp } from '../../context/AppContext';

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
  const { currentUser } = useApp();
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'supervisor';

  const [index, setIndex] = useState(0);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Showcase Configuration State
  const [showPrice, setShowPrice] = useState<boolean>(true);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>(
    initialCourses.map(c => c.id)
  );
  const [customCourseData, setCustomCourseData] = useState<Record<string, Partial<Course>>>({});

  // Filter courses based on admin selections
  const displayCourses = initialCourses
    .filter(c => selectedCourseIds.includes(c.id))
    .map(c => ({
      ...c,
      ...(customCourseData[c.id] || {})
    }));

  useEffect(() => {
    if (!displayCourses || displayCourses.length === 0 || mode !== 'carousel') return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % displayCourses.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [displayCourses, mode]);

  if (!displayCourses || displayCourses.length === 0) {
    if (isAdmin) {
      return (
        <div className="w-full p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-2">
          <p className="text-xs font-bold text-emerald-900">ویترین دوره‌های علمی (هیچ دوره‌ای انتخاب نشده است)</p>
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="px-4 py-1.5 rounded-xl bg-emerald-700 text-white text-xs font-bold"
          >
            ویرایش و انتخاب دوره‌ها
          </button>
        </div>
      );
    }
    return null;
  }

  const handleUpdateCourseField = (id: string, field: string, val: any) => {
    setCustomCourseData(prev => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
        [field]: val
      }
    }));
  };

  const toggleCourseSelection = (id: string) => {
    if (selectedCourseIds.includes(id)) {
      if (selectedCourseIds.length <= 1) return; // keep at least 1
      setSelectedCourseIds(prev => prev.filter(cId => cId !== id));
    } else {
      setSelectedCourseIds(prev => [...prev, id]);
    }
  };

  const currentCourse = displayCourses[index % displayCourses.length];

  return (
    <div className="relative w-full">
      {/* Admin Quick Floating Edit Button */}
      {isAdmin && (
        <button
          onClick={() => setIsEditModalOpen(true)}
          className="absolute top-4 left-4 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 hover:bg-white text-stone-800 border border-stone-300 text-xs font-bold shadow-md backdrop-blur-md transition-all active:scale-95 cursor-pointer"
        >
          <Edit3 className="w-3.5 h-3.5 text-amber-600" />
          <span>ویرایش ویترین دوره‌ها</span>
        </button>
      )}

      {mode === 'grid' ? (
        <div className="w-full space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-700" />
              <h3 className="font-extrabold text-base text-stone-900">ویترین شبکه‌ای دوره‌های تخصصی فقه و قضا</h3>
            </div>
            <span className="text-xs font-bold text-stone-500 bg-stone-100 px-3 py-1 rounded-full">
              {toPersianNumbers(displayCourses.length)} دوره فعال
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {displayCourses.slice(0, 3).map((c) => (
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
                  {showPrice ? (
                    <span className="font-bold text-emerald-300">
                      {c.price > 0 ? `${toPersianNumbers(c.price.toLocaleString('fa-IR'))} تومان` : 'رایگان اعضا'}
                    </span>
                  ) : (
                    <span className="font-bold text-emerald-300">ویژه اعضای کانون</span>
                  )}
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
      ) : mode === 'compact' ? (
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
                <span className="text-xs font-bold text-stone-900">{currentCourse.title}</span>
              </div>
              <p className="text-[11px] text-stone-500 mt-0.5">
                مدرس: {currentCourse.instructor} · مدت: {toPersianNumbers(currentCourse.hours)} ساعت · سطح: {currentCourse.level}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {showPrice && (
              <span className="text-xs font-bold text-emerald-800 ml-2">
                {currentCourse.price > 0 ? `${toPersianNumbers(currentCourse.price.toLocaleString('fa-IR'))} تومان` : 'رایگان'}
              </span>
            )}
            <button
              onClick={() => onSelectCourse?.(currentCourse)}
              className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all"
            >
              ورود به دوره
            </button>
          </div>
        </div>
      ) : (
        /* Carousel View (Default) */
        <div className="relative w-full min-h-[280px] overflow-hidden rounded-[36px] shadow-xl group bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900 border border-emerald-500/20 text-white p-6 sm:p-8 flex flex-col justify-between">
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
              {showPrice ? (
                <span className="text-base font-bold text-emerald-400">
                  {currentCourse.price > 0 ? `${toPersianNumbers(currentCourse.price.toLocaleString('fa-IR'))} تومان` : 'رایگان (ویژه اعضا)'}
                </span>
              ) : (
                <span className="text-sm font-bold text-emerald-300">
                  دوره تخصصی کانون دانش‌آموختگان
                </span>
              )}
              {currentCourse.isEnrolled && (
                <span className="px-3 py-1 rounded-full bg-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  ثبت‌نام شده
                </span>
              )}
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

      {/* ADMIN FULL EDIT MODAL FOR COURSE SHOWCASE */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-2xl border border-stone-200 shadow-2xl p-6 text-stone-900 space-y-5 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-emerald-800" />
                  <h4 className="font-black text-sm text-stone-900">
                    مدیریت و ویرایش کامل ویترین دوره‌های علمی
                  </h4>
                </div>
                <button onClick={() => setIsEditModalOpen(false)} className="p-1 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Price Toggle */}
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div>
                  <h5 className="font-extrabold text-xs text-emerald-950">نمایش یا حذف مبلغ دوره‌ها در ویترین:</h5>
                  <p className="text-[10px] text-emerald-800">با خاموش کردن، قیمت دوره از ویترین حذف می‌شود.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPrice(!showPrice)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-colors ${
                    showPrice ? 'bg-emerald-800 text-white' : 'bg-stone-200 text-stone-700'
                  }`}
                >
                  {showPrice ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  <span>{showPrice ? 'قیمت نمایش داده می‌شود' : 'قیمت مخفی شد'}</span>
                </button>
              </div>

              {/* Select Active Courses to Include/Exclude */}
              <div className="space-y-2 text-xs">
                <h5 className="font-black text-xs text-stone-900">
                  انتخاب دوره‌های فعال جهت نمایش در ویترین (انتخاب/حذف):
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {initialCourses.map(c => {
                    const isSelected = selectedCourseIds.includes(c.id);
                    return (
                      <div
                        key={c.id}
                        onClick={() => toggleCourseSelection(c.id)}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                          isSelected ? 'bg-emerald-50 border-emerald-300 font-bold text-emerald-950' : 'bg-stone-50 border-stone-200 text-stone-500 opacity-60'
                        }`}
                      >
                        <div className="min-w-0 flex-1 pl-2">
                          <p className="truncate">{c.title}</p>
                          <p className="text-[10px] text-stone-500 font-normal">مدرس: {c.instructor}</p>
                        </div>
                        <span className={`w-5 h-5 rounded-lg flex items-center justify-center border text-xs ${
                          isSelected ? 'bg-emerald-800 text-white border-emerald-900' : 'bg-white border-stone-300'
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 100% Content Editing for selected courses */}
              <div className="space-y-3 pt-3 border-t border-stone-200 text-xs">
                <h5 className="font-black text-xs text-stone-900">ویرایش ۱۰۰٪ مشخصات و عناوین دوره‌های ویترین:</h5>
                <div className="space-y-3">
                  {displayCourses.map(c => (
                    <div key={c.id} className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-stone-500 block">عنوان دوره:</label>
                          <input
                            type="text"
                            value={c.title}
                            onChange={e => handleUpdateCourseField(c.id, 'title', e.target.value)}
                            className="w-full p-1.5 text-xs font-bold bg-white rounded-lg border border-stone-300 text-stone-900"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-stone-500 block">نام مدرس و استاد:</label>
                          <input
                            type="text"
                            value={c.instructor}
                            onChange={e => handleUpdateCourseField(c.id, 'instructor', e.target.value)}
                            className="w-full p-1.5 text-xs bg-white rounded-lg border border-stone-300 text-stone-900"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] text-stone-500 block">سطح علمی:</label>
                          <input
                            type="text"
                            value={c.level}
                            onChange={e => handleUpdateCourseField(c.id, 'level', e.target.value)}
                            className="w-full p-1.5 text-xs bg-white rounded-lg border border-stone-300 text-stone-900"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-stone-500 block">مدت آموزش (ساعت):</label>
                          <input
                            type="number"
                            value={c.hours}
                            onChange={e => handleUpdateCourseField(c.id, 'hours', parseInt(e.target.value) || 0)}
                            className="w-full p-1.5 text-xs bg-white rounded-lg border border-stone-300 text-stone-900"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-stone-500 block">قیمت (تومان):</label>
                          <input
                            type="number"
                            value={c.price}
                            onChange={e => handleUpdateCourseField(c.id, 'price', parseInt(e.target.value) || 0)}
                            className="w-full p-1.5 text-xs bg-white rounded-lg border border-stone-300 text-stone-900"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] text-stone-500 block">توضیحات کوتاه ویترین:</label>
                        <textarea
                          rows={2}
                          value={c.description}
                          onChange={e => handleUpdateCourseField(c.id, 'description', e.target.value)}
                          className="w-full p-1.5 text-xs bg-white rounded-lg border border-stone-300 text-stone-900 leading-relaxed"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs shadow-md cursor-pointer"
                >
                  ذخیره و بستن
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
