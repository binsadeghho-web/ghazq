import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Course } from '../../types';
import { ModernMetricCard } from '../common/ModernMetricCard';
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
  Search
} from 'lucide-react';

export const CoursesSection: React.FC = () => {
  const { currentUser, courses, enrollCourse, addCourse } = useApp();
  
  const [activeTab, setActiveTab] = useState<'available' | 'my_courses'>('available');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [newCourseModalOpen, setNewCourseModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // New Course Form State
  const [newTitle, setNewTitle] = useState('');
  const [newInstructor, setNewInstructor] = useState('');
  const [newLevel, setNewLevel] = useState('تخصصی قضات و پژوهشگران');
  const [newHours, setNewHours] = useState(20);
  const [newCapacity, setNewCapacity] = useState(40);
  const [newSchedule, setNewSchedule] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newMeetingLink, setNewMeetingLink] = useState('https://lms.feqh-ghaza.ir/class/');
  const [newPrice, setNewPrice] = useState(500000);

  const isOfficial = currentUser?.role === 'admin' || currentUser?.role === 'supervisor';

  const myEnrolledCourses = courses.filter(c => c.isEnrolled);

  const filteredCourses = (activeTab === 'available' ? courses : myEnrolledCourses).filter(c => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return c.title.toLowerCase().includes(q) || c.instructor.toLowerCase().includes(q);
  });

  const handleEnroll = (courseId: string) => {
    enrollCourse(courseId);
    alert('ثبت‌نام شما با موفقیت انجام شد! مشخصات ورود به کلاس و فایل‌های آرشیو برای شما فعال گردید.');
    if (selectedCourse?.id === courseId) {
      setSelectedCourse({ ...selectedCourse, isEnrolled: true, hasArchiveAccess: true });
    }
  };

  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    addCourse({
      title: newTitle,
      instructor: newInstructor,
      level: newLevel,
      hours: Number(newHours),
      capacity: Number(newCapacity),
      schedule: newSchedule,
      description: newDescription,
      topics: ['مبانی نظری و فقهی', 'بررسی چالش‌های تطبیقی در محاکم', 'تحلیل آراء وحدت رویه مرتبط'],
      meetingLink: newMeetingLink,
      price: Number(newPrice),
      status: 'enrolling',
    });

    setNewTitle('');
    setNewInstructor('');
    setNewSchedule('');
    setNewDescription('');
    setNewCourseModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* 3 Metric Cards Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ModernMetricCard
          title="کل دوره‌های تخصصی"
          value={courses.length}
          periodLabel="ترم جاری و پیش‌رو"
          unit="دوره"
          icon={<GraduationCap className="w-4 h-4" />}
          onClick={() => setActiveTab('available')}
        />
        <ModernMetricCard
          title="دوره‌های ثبت‌نام‌شده من"
          value={myEnrolledCourses.length}
          periodLabel="دارای دسترسی آرشیو"
          unit="دوره"
          icon={<BookOpen className="w-4 h-4 text-emerald-500" />}
          onClick={() => setActiveTab('my_courses')}
        />
        <ModernMetricCard
          title="مجموع ساعات آموزشی"
          value={courses.reduce((acc, c) => acc + c.hours, 0)}
          periodLabel="کارگاه‌های عملی و نظری"
          unit="ساعت"
          icon={<Clock className="w-4 h-4 text-blue-500" />}
        />
      </div>

      {/* Header Bar */}
      <div className="glass-card rounded-2xl p-6 border border-slate-200/90 dark:border-white/10 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            دوره‌های تخصصی و کاربردی فقه و قضا
          </h1>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
            <span>آموزش‌های مهارتی، ادله دیجیتال، داوری تجاری و فقه القضاء نوین</span>
            <span aria-hidden="true">·</span>
            <span>آرشیو دائمی صوت، تصویر و جزوات جلسات</span>
          </div>
        </div>

        {isOfficial && (
          <button
            onClick={() => setNewCourseModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md active:scale-[0.98] shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>تعریف دوره جدید</span>
          </button>
        )}
      </div>

      {/* Segmented Control and Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 glass-panel p-2.5 rounded-2xl border border-slate-200/90 dark:border-white/10 shadow-xs">
        <div className="flex items-center gap-1 p-1 bg-slate-100/80 dark:bg-slate-800/80 rounded-xl text-xs backdrop-blur-md">
          <button
            onClick={() => setActiveTab('available')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'available'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            تمامی دوره‌ها ({courses.length})
          </button>
          <button
            onClick={() => setActiveTab('my_courses')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'my_courses'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            آرشیو دوره‌های من ({myEnrolledCourses.length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="جستجو در نام دوره یا استاد..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-3 pr-9 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white/70 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all backdrop-blur-sm"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.length === 0 ? (
          <div className="col-span-full py-16 text-center glass-card rounded-2xl border border-slate-200/90 dark:border-white/10">
            <GraduationCap className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400">دوره‌ای با شرایط انتخابی یافت نشد.</p>
          </div>
        ) : (
          filteredCourses.map(course => {
            const isFull = course.enrolledCount >= course.capacity;
            return (
              <div
                key={course.id}
                className="glass-card rounded-2xl border border-slate-200/90 dark:border-white/10 p-5 flex flex-col justify-between space-y-4 hover:-translate-y-1 hover:border-indigo-500/40 dark:hover:border-indigo-400/30 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 group"
              >
                <div className="space-y-3">
                  {/* Unboxed Metadata (Zero-Pill) */}
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-700 dark:text-slate-300">{course.level}</span>
                      <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
                      <span className="font-mono tabular-nums">{course.hours} ساعت</span>
                    </div>
                    {course.isEnrolled && (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                        عضو دوره
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug line-clamp-2 min-h-[40px]">
                    {course.title}
                  </h3>

                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="line-clamp-1">{course.instructor}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="line-clamp-1 font-mono tabular-nums">{course.schedule}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {course.description}
                  </p>

                  {/* Clean Tabular Capacity Progress */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>ظرفیت ثبت‌نام:</span>
                      <span className="font-mono tabular-nums">
                        {course.enrolledCount} از {course.capacity} نفر
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1 overflow-hidden">
                      <div
                        className="bg-slate-900 dark:bg-amber-400 h-1 rounded-full"
                        style={{ width: `${Math.min(100, (course.enrolledCount / course.capacity) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400">شهریه دوره:</span>
                    <span className="text-xs font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                      {course.price > 0 ? `${course.price.toLocaleString('fa-IR')} تومان` : 'رایگان (اعضا)'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedCourse(course)}
                      className="px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors active:scale-[0.98]"
                    >
                      سرفصل‌ها
                    </button>

                    {course.isEnrolled ? (
                      <button
                        onClick={() => setSelectedCourse(course)}
                        className="px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                      >
                        ورود به آرشیو
                      </button>
                    ) : (
                      <button
                        onClick={() => handleEnroll(course.id)}
                        disabled={isFull}
                        className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-40 rounded-lg transition-colors active:scale-[0.98]"
                      >
                        {isFull ? 'تکمیل ظرفیت' : 'ثبت‌نام'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Course Detail Modal */}
      {selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden text-right">
            <div className="bg-slate-900 p-6 text-white flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs text-amber-300 mb-1">
                  <span>{selectedCourse.level}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">{selectedCourse.hours} ساعت آموزشی</span>
                </div>
                <h2 className="text-base font-bold text-white leading-snug">
                  {selectedCourse.title}
                </h2>
                <p className="text-xs text-slate-300 mt-1">
                  مدرس: {selectedCourse.instructor}
                </p>
              </div>
              <button
                onClick={() => setSelectedCourse(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">اهداف و رویکرد دوره:</span>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                  {selectedCourse.description}
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">سرفصل‌های مصوب:</span>
                <div className="grid grid-cols-1 gap-2">
                  {selectedCourse.topics.map((t, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800">
                      <span className="w-4 h-4 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center text-[10px] font-mono shrink-0">
                        {idx + 1}
                      </span>
                      <span>{t}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Archive or Enrollment Status */}
              {selectedCourse.isEnrolled ? (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                    <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>عضویت فعال در دوره (دسترسی به محتوای آرشیو)</span>
                  </div>
                  {selectedCourse.archiveNotes && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {selectedCourse.archiveNotes}
                    </p>
                  )}
                  <div className="pt-2 flex flex-wrap gap-2">
                    <a
                      href={selectedCourse.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 text-white rounded-lg text-xs font-medium"
                    >
                      <PlayCircle className="w-4 h-4" />
                      <span>اتصال به کلاس آنلاین</span>
                    </a>
                    <button
                      onClick={() => alert('دانلود جزوه و درس‌گفتار مدون (PDF) آغاز شد.')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium hover:bg-white"
                    >
                      <FileDown className="w-4 h-4" />
                      <span>دانلود جزوه ۳۴ صفحه‌ای</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="text-xs text-slate-600 dark:text-slate-300">
                    ظرفیت باقیمانده: <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-white">{selectedCourse.capacity - selectedCourse.enrolledCount} نفر</span>
                  </div>
                  <button
                    onClick={() => handleEnroll(selectedCourse.id)}
                    className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg active:scale-[0.98]"
                  >
                    ثبت‌نام آنی در دوره
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Course Modal (Admin) */}
      {newCourseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden text-right">
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">افزودن دوره آموزشی جدید</h3>
                <p className="text-xs text-slate-400 mt-0.5">ثبت مشخصات و انتشار در تالار دوره‌های تخصصی</p>
              </div>
              <button
                onClick={() => setNewCourseModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">عنوان دوره:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: فقه القضاء نوین و ادله اثبات دعوی"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">استاد / مدرس:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: آیت‌الله دکتر علوی"
                  value={newInstructor}
                  onChange={e => setNewInstructor(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">ساعت آموزشی:</label>
                  <input
                    type="number"
                    value={newHours}
                    onChange={e => setNewHours(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">ظرفیت کلاس:</label>
                  <input
                    type="number"
                    value={newCapacity}
                    onChange={e => setNewCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">زمان‌بندی و روزهای برگزاری:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: پنج‌شنبه‌ها از ساعت ۰۹:۰۰ الی ۱۲:۰۰"
                  value={newSchedule}
                  onChange={e => setNewSchedule(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">توضیحات و اهداف دوره:</label>
                <textarea
                  rows={3}
                  required
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  className="w-full p-3 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewCourseModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-lg text-xs font-semibold active:scale-[0.98]"
                >
                  انتشار دوره
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
