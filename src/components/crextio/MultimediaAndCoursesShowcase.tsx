import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { toPersianNumbers } from '../../utils/persianNumbers';
import {
  GraduationCap,
  ArrowUpRight,
  ChevronLeft,
  Edit3,
  X,
  Plus,
  Trash2,
  PlayCircle,
  Video,
  Mic,
  Sparkles,
  BookOpen,
  Camera
} from 'lucide-react';

interface MultimediaAndCoursesShowcaseProps {
  onNavigateToCourses?: () => void;
}

export const MultimediaAndCoursesShowcase: React.FC<MultimediaAndCoursesShowcaseProps> = ({
  onNavigateToCourses
}) => {
  const { courses, currentUser, crextioConfig, updateCrextioConfig } = useApp();
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'supervisor';

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const title = crextioConfig.multimediaShowcaseTitle || 'ویترین محصولات چندرسانه‌ای، درس‌گفتارها و کارگاه‌های تخصصی';
  const subtitle = crextioConfig.multimediaShowcaseSubtitle || 'دسترسی آنلاین به آرشیو صوت و ویدیوی جلسات خارج فقه القضا، کارگاه‌های مهارتی دادگاه و آیین دادرسی';

  const [editTitle, setEditTitle] = useState(title);
  const [editSubtitle, setEditSubtitle] = useState(subtitle);

  const defaultMediaCards = [
    {
      id: 'media-1',
      title: 'درس‌گفتارهای صوتی خارج فقه القضا (جلد ۵)',
      instructor: 'استاد آیت‌الله موسوی',
      sessions: '۴۸ جلسه کامل صوتی',
      type: 'صوتی MP3',
      tag: 'صوتی',
      accent: '#0891B2',
      cover: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=400&q=80'
    },
    {
      id: 'media-2',
      title: 'فیلم ویدیویی کارگاه تحلیلی ادله اثبات دعوا',
      instructor: 'دکتر میرزایی (مستشار دادگاه)',
      sessions: '۱۲ ساعت ویدیوی HD',
      type: 'ویدیویی 1080p',
      tag: 'ویدیویی',
      accent: '#2563EB',
      cover: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=400&q=80'
    },
    {
      id: 'media-3',
      title: 'دوره کاربردی مدیریت صحن دادگاه و انشای رأی',
      instructor: 'استاد رضایی (قاضی دیوان عالی)',
      sessions: '۱۶ جلسه ویدیویی و جزوه',
      type: 'چندرسانه‌ای',
      tag: 'دوره تخصصی',
      accent: '#D97706',
      cover: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=400&q=80'
    },
    {
      id: 'media-4',
      title: 'مجموعه پادکست‌های تحلیلی نقد آراء تجدیدنظر',
      instructor: 'هیئت تحریریه تالار آراء',
      sessions: '۲۴ اپیزود پادکست',
      type: 'پادکست',
      tag: 'پادکست علمی',
      accent: '#7C3AED',
      cover: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&w=400&q=80'
    }
  ];

  const [mediaCards, setMediaCards] = useState(defaultMediaCards);

  const handleUpdateCard = (id: string, field: string, val: any) => {
    setMediaCards(prev => prev.map(c => c.id === id ? { ...c, [field]: val } : c));
  };

  const handleFileUpload = (id: string, file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        handleUpdateCard(id, 'cover', e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddCard = () => {
    const newCard = {
      id: `media-${Date.now()}`,
      title: 'درس‌گفتار جدید خارج فقه و قضا',
      instructor: 'استاد حوزوی',
      sessions: '۲۰ جلسه صوتی و ویدیویی',
      type: 'چندرسانه‌ای',
      tag: 'جدید',
      accent: '#0891B2',
      cover: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=400&q=80'
    };
    setMediaCards(prev => [...prev, newCard]);
  };

  const handleRemoveCard = (id: string) => {
    if (mediaCards.length <= 1) return;
    setMediaCards(prev => prev.filter(c => c.id !== id));
  };

  const handleSave = () => {
    updateCrextioConfig({
      multimediaShowcaseTitle: editTitle,
      multimediaShowcaseSubtitle: editSubtitle
    });
    setIsEditModalOpen(false);
  };

  return (
    <div className="w-full relative overflow-hidden rounded-[32px] bg-[#FCFCFA] border border-stone-200/90 shadow-sm p-5 sm:p-7 text-stone-900 space-y-5">
      {/* Header */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-stone-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-50 text-cyan-700 border border-cyan-200 flex items-center justify-center shadow-2xs">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-stone-900">{title}</h3>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-900 border border-cyan-200 text-[10px] font-extrabold">
                چندرسانه‌ای
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          {isAdmin && (
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-600" />
              <span>ویرایش ویترین چندرسانه‌ای</span>
            </button>
          )}

          <button
            onClick={onNavigateToCourses}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            <span>مشاهده همه دوره‌ها و صوت/ویدیوها</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Multimedia Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {mediaCards.map(item => (
          <motion.div
            key={item.id}
            whileHover={{ y: -3 }}
            onClick={onNavigateToCourses}
            className="group p-4 rounded-2xl bg-white border border-stone-200/90 hover:border-cyan-300 transition-all cursor-pointer flex flex-col justify-between space-y-3 shadow-2xs hover:shadow-md"
          >
            <div className="space-y-3">
              <div className="relative h-36 rounded-xl overflow-hidden bg-stone-900 border border-stone-200">
                <img
                  src={item.cover}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-md text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-md border border-white/40">
                    <PlayCircle className="w-6 h-6 fill-white/20" />
                  </div>
                </div>
                <span className="absolute top-2 right-2 px-2.5 py-0.5 rounded-md bg-cyan-900/90 text-white text-[10px] font-black">
                  {item.tag}
                </span>
              </div>

              <div>
                <h4 className="font-bold text-sm text-stone-900 group-hover:text-cyan-900 transition-colors line-clamp-1">
                  {item.title}
                </h4>
                <p className="text-xs text-stone-500 mt-1 line-clamp-1 font-medium">
                  استاد: {item.instructor}
                </p>
                <span className="text-[11px] text-cyan-800 font-bold block mt-1">
                  {item.sessions}
                </span>
              </div>
            </div>

            <div className="pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-cyan-800">
              <span>مشاهده و پخش آنلاین</span>
              <ChevronLeft className="w-4 h-4" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Admin Edit Modal with Banner/Photo Upload and Add/Delete */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-3xl border border-stone-200 shadow-2xl p-6 text-stone-900 space-y-5 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-cyan-700" />
                  <h4 className="font-black text-sm text-stone-900">
                    ویرایش ویترین چندرسانه‌ای، تغییر پوستر/بنر و افزودن/حذف کارت‌ها
                  </h4>
                </div>
                <button onClick={() => setIsEditModalOpen(false)} className="p-1 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Title & Subtitle */}
              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">عنوان ویترین:</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-300 font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">توضیح کوتاه ویترین:</label>
                  <textarea
                    rows={2}
                    value={editSubtitle}
                    onChange={e => setEditSubtitle(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-300"
                  />
                </div>
              </div>

              {/* Cards Management */}
              <div className="space-y-3 pt-2 border-t border-stone-200 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h5 className="font-black text-xs text-stone-900">مدیریت کارت‌های چندرسانه‌ای و دوره‌ها:</h5>
                  <div className="flex items-center gap-2">
                    <select
                      onChange={(e) => {
                        const selectedCourse = courses.find(c => c.id === e.target.value);
                        if (selectedCourse) {
                          setMediaCards(prev => [
                            ...prev,
                            {
                              id: `media-${Date.now()}`,
                              title: selectedCourse.title,
                              instructor: selectedCourse.instructor,
                              sessions: `${selectedCourse.hours} ساعت آموزش تخصصی`,
                              type: selectedCourse.holdingFormat === 'online' ? 'برخط' : 'دوره تخصصی',
                              tag: selectedCourse.level || 'دوره علمی',
                              accent: '#0891B2',
                              cover: selectedCourse.coverImage || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=400&q=80'
                            }
                          ]);
                        }
                        e.target.value = '';
                      }}
                      className="p-1.5 rounded-xl bg-stone-100 border border-stone-300 text-xs font-bold text-stone-800"
                    >
                      <option value="">+ انتخاب مستقیم از دوره‌های موجود سیستم...</option>
                      {courses.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.title} ({c.instructor})
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={handleAddCard}
                      className="px-3 py-1.5 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>افزودن کارت دستی</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {mediaCards.map(item => (
                    <div key={item.id} className="p-3.5 rounded-2xl bg-cyan-50/60 border border-cyan-200 space-y-2.5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-stone-500 block">عنوان دوره / محتوا:</label>
                          <input
                            type="text"
                            value={item.title}
                            onChange={e => handleUpdateCard(item.id, 'title', e.target.value)}
                            className="w-full p-1.5 text-xs font-bold bg-white rounded-lg border border-stone-300"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-stone-500 block">استاد / مدرس:</label>
                          <input
                            type="text"
                            value={item.instructor}
                            onChange={e => handleUpdateCard(item.id, 'instructor', e.target.value)}
                            className="w-full p-1.5 text-xs bg-white rounded-lg border border-stone-300"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-stone-500 block">تعداد جلسات / مدت:</label>
                          <input
                            type="text"
                            value={item.sessions}
                            onChange={e => handleUpdateCard(item.id, 'sessions', e.target.value)}
                            className="w-full p-1.5 text-xs bg-white rounded-lg border border-stone-300"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-stone-500 block">برچسب نوع رسانه:</label>
                          <input
                            type="text"
                            value={item.tag}
                            onChange={e => handleUpdateCard(item.id, 'tag', e.target.value)}
                            className="w-full p-1.5 text-xs bg-white rounded-lg border border-stone-300"
                          />
                        </div>
                      </div>

                      {/* Photo / Banner Upload */}
                      <div>
                        <label className="text-[10px] text-stone-500 block mb-1">پوستر / بنر تصویر کاور:</label>
                        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                          <img
                            src={item.cover}
                            alt={item.title}
                            className="w-12 h-10 rounded-lg object-cover border border-cyan-300 shrink-0"
                          />
                          <input
                            type="text"
                            value={item.cover}
                            onChange={e => handleUpdateCard(item.id, 'cover', e.target.value)}
                            className="w-full p-1.5 text-[10px] font-mono bg-white rounded-lg border border-stone-300 min-w-0"
                          />
                          <label className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-100 hover:bg-cyan-200 text-cyan-900 font-bold text-[10px] cursor-pointer shrink-0">
                            <Camera className="w-3.5 h-3.5 text-cyan-800" />
                            <span>انتخاب عکس از دستگاه</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={e => e.target.files?.[0] && handleFileUpload(item.id, e.target.files[0])}
                            />
                          </label>
                        </div>
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => handleRemoveCard(item.id)}
                          className="text-red-600 hover:text-red-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف این کارت</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  onClick={handleSave}
                  className="px-5 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-black shadow-md cursor-pointer"
                >
                  ذخیره تغییرات و پوسترها
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
