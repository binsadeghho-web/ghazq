import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/apiClient';
import { DEFAULT_SHOWCASE_IMAGES, resolveShowcaseImageUrl } from '../../data/showcaseImages';
import {
  ArrowUpRight,
  ChevronLeft,
  Edit3,
  X,
  Plus,
  Trash2,
  PlayCircle,
  Video,
  Camera,
  Loader2,
  Upload,
} from 'lucide-react';

interface MultimediaAndCoursesShowcaseProps {
  onNavigateToCourses?: () => void;
}

export const MultimediaAndCoursesShowcase: React.FC<MultimediaAndCoursesShowcaseProps> = ({
  onNavigateToCourses
}) => {
  const { courses, currentUser, crextioConfig, updateCrextioConfig, isAlumniPreview } = useApp();
  const isAdmin =
    (currentUser?.role === 'admin' ||
      currentUser?.role === 'super_admin' ||
      currentUser?.role === 'alumni_manager' ||
      currentUser?.role === 'supervisor') &&
    !isAlumniPreview;

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const title = crextioConfig.multimediaShowcaseTitle || 'ویترین محصولات چندرسانه‌ای، درس‌گفتارها و کارگاه‌های تخصصی';
  const subtitle = crextioConfig.multimediaShowcaseSubtitle || 'دسترسی آنلاین به آرشیو صوت و ویدیوی جلسات خارج فقه القضا، کارگاه‌های مهارتی دادگاه و آیین دادرسی';

  const defaultMediaCards = [
    {
      id: 'media-1',
      title: 'درس‌گفتارهای صوتی خارج فقه القضا (جلد ۵)',
      instructor: 'استاد آیت‌الله موسوی',
      sessions: '۴۸ جلسه کامل صوتی',
      type: 'صوتی MP3',
      tag: 'صوتی',
      accent: '#0891B2',
      cover: DEFAULT_SHOWCASE_IMAGES.multimedia_showcase,
    },
    {
      id: 'media-2',
      title: 'فیلم ویدیویی کارگاه تحلیلی ادله اثبات دعوا',
      instructor: 'دکتر میرزایی (مستشار دادگاه)',
      sessions: '۱۲ ساعت ویدیوی HD',
      type: 'ویدیویی 1080p',
      tag: 'ویدیویی',
      accent: '#2563EB',
      cover: DEFAULT_SHOWCASE_IMAGES.course_showcase,
    },
    {
      id: 'media-3',
      title: 'دوره کاربردی مدیریت صحن دادگاه و انشای رأی',
      instructor: 'استاد رضایی (قاضی دیوان عالی)',
      sessions: '۱۶ جلسه ویدیویی و جزوه',
      type: 'چندرسانه‌ای',
      tag: 'دوره تخصصی',
      accent: '#D97706',
      cover: DEFAULT_SHOWCASE_IMAGES.rulings_showcase,
    },
    {
      id: 'media-4',
      title: 'مجموعه پادکست‌های تحلیلی نقد آراء تجدیدنظر',
      instructor: 'هیئت تحریریه تالار آراء',
      sessions: '۲۴ اپیزود پادکست',
      type: 'پادکست',
      tag: 'پادکست علمی',
      accent: '#7C3AED',
      cover: DEFAULT_SHOWCASE_IMAGES.books_showcase,
    }
  ];

  const savedCards =
    crextioConfig.multimediaCustomCards && crextioConfig.multimediaCustomCards.length > 0
      ? crextioConfig.multimediaCustomCards
      : defaultMediaCards;

  const [editTitle, setEditTitle] = useState(title);
  const [editSubtitle, setEditSubtitle] = useState(subtitle);
  const [mediaCards, setMediaCards] = useState(savedCards);

  useEffect(() => {
    setEditTitle(title);
    setEditSubtitle(subtitle);
    setMediaCards(
      crextioConfig.multimediaCustomCards && crextioConfig.multimediaCustomCards.length > 0
        ? crextioConfig.multimediaCustomCards
        : defaultMediaCards
    );
  }, [title, subtitle, crextioConfig.multimediaCustomCards]);

  const showcaseBannerUrl = resolveShowcaseImageUrl(
    'multimedia_showcase',
    crextioConfig.showcaseImageOverrides
  );

  const handleUpdateCard = (id: string, field: string, val: any) => {
    setMediaCards(prev => prev.map(c => c.id === id ? { ...c, [field]: val } : c));
  };

  const handleFileUpload = async (id: string, file: File) => {
    if (!file) return;
    setUploadingId(id);
    try {
      const res = await api.uploadFile(file, 'misc');
      if (res?.url) {
        if (id === '__showcase_banner__') {
          updateCrextioConfig({
            showcaseImageOverrides: {
              ...(crextioConfig.showcaseImageOverrides || {}),
              multimedia_showcase: res.url,
            },
          });
        } else {
          handleUpdateCard(id, 'cover', res.url);
        }
      }
    } catch (err: any) {
      alert(`خطا در آپلود تصویر: ${err.message || 'خطای سرور'}`);
    } finally {
      setUploadingId(null);
    }
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
      cover: showcaseBannerUrl || DEFAULT_SHOWCASE_IMAGES.multimedia_showcase,
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
      multimediaShowcaseSubtitle: editSubtitle,
      multimediaCustomCards: mediaCards,
    });
    setIsEditModalOpen(false);
  };

  return (
    <div className="w-full relative overflow-hidden rounded-2xl sm:rounded-[32px] bg-[#FCFCFA] border border-stone-200/90 shadow-sm p-3.5 sm:p-7 text-stone-900 space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-stone-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-50 text-cyan-700 border border-cyan-200 flex items-center justify-center shadow-2xs">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-black text-stone-900">{title}</h3>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-900 border border-cyan-200 text-[10px] font-extrabold">
                چندرسانه‌ای
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch md:self-auto flex-wrap w-full md:w-auto">
          {isAdmin && (
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-600" />
              <span>ویرایش ویترین چندرسانه‌ای</span>
            </button>
          )}

          <button
            onClick={onNavigateToCourses}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            <span>مشاهده همه دوره‌ها و صوت/ویدیوها</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Multimedia Cards Grid */}
      <div className="flex overflow-x-auto snap-x snap-mandatory gap-3 pb-2 scrollbar-none sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-4 sm:overflow-visible sm:pb-0">
        {mediaCards.map(item => (
          <motion.div
            key={item.id}
            whileHover={{ y: -3 }}
            onClick={onNavigateToCourses}
            className="min-w-[74vw] sm:min-w-0 snap-start shrink-0 sm:shrink group p-3.5 sm:p-4 rounded-2xl bg-white border border-stone-200/90 hover:border-cyan-300 transition-all cursor-pointer flex flex-col justify-between space-y-3 shadow-2xs hover:shadow-md"
          >
            <div className="space-y-3">
              <div className="relative h-36 rounded-xl overflow-hidden bg-stone-900 border border-stone-200">
                <img
                  src={item.cover || showcaseBannerUrl || DEFAULT_SHOWCASE_IMAGES.multimedia_showcase}
                  alt={item.title}
                  referrerPolicy="no-referrer"
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

      {/* Admin Edit Modal with Server Upload and MySQL Persistence */}
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
                    ویرایش ویترین چندرسانه‌ای، تغییر پوستر و ذخیره در دیتابیس
                  </h4>
                </div>
                <button onClick={() => setIsEditModalOpen(false)} className="p-1 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Showcase General Banner Override */}
              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {showcaseBannerUrl && (
                    <img
                      src={showcaseBannerUrl}
                      alt="تصویر باکس"
                      referrerPolicy="no-referrer"
                      className="w-14 h-12 rounded-xl object-cover border border-stone-300 shrink-0"
                    />
                  )}
                  <div>
                    <div className="text-xs font-black text-stone-800">تصویر کاور ویترین چندرسانه‌ای (در نمایشگاه جامع و باکس ساده)</div>
                    <div className="text-[10px] text-stone-500">آپلود مستقیم روی سرور</div>
                  </div>
                </div>
                <label className="px-3 py-1.5 rounded-xl bg-cyan-800 hover:bg-cyan-900 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0">
                  {uploadingId === '__showcase_banner__' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  <span>آپلود تصویر باکس</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => e.target.files?.[0] && handleFileUpload('__showcase_banner__', e.target.files[0])}
                  />
                </label>
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
                  <div className="flex items-center gap-2 flex-wrap">
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
                              cover: selectedCourse.coverImage || DEFAULT_SHOWCASE_IMAGES.course_showcase,
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

                      {/* Photo / Banner Upload to Server */}
                      <div>
                        <label className="text-[10px] text-stone-500 block mb-1">پوستر / تصویر کاور (ذخیره روی سرور):</label>
                        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                          <img
                            src={item.cover}
                            alt={item.title}
                            referrerPolicy="no-referrer"
                            className="w-12 h-10 rounded-lg object-cover border border-cyan-300 shrink-0"
                          />
                          <input
                            type="text"
                            value={item.cover}
                            onChange={e => handleUpdateCard(item.id, 'cover', e.target.value)}
                            className="w-full p-1.5 text-[10px] font-mono bg-white rounded-lg border border-stone-300 min-w-0"
                          />
                          <label className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-800 hover:bg-cyan-900 text-white font-bold text-[10px] cursor-pointer shrink-0">
                            {uploadingId === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                            <span>آپلود عکس</span>
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
                  ذخیره دائمی تغییرات در پایگاه داده
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
