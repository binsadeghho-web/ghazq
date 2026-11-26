import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/apiClient';
import {
  DEFAULT_SHOWCASE_IMAGES,
  resolveShowcaseImageUrl,
  handleImageErrorFallback,
} from '../../data/showcaseImages';
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
      window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: `خطا در آپلود تصویر: ${err.message || 'خطای سرور'}`, type: 'error' } }));
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
    <div className="w-full relative overflow-hidden rounded-2xl sm:rounded-[30px] bg-[#FCFCF9] border border-[#DFD8C4] shadow-[0_14px_38px_-24px_rgba(7,30,23,0.12)] p-3.5 sm:p-7 text-[#071E17] space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#ECE6D6] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#071E17] text-[#F3D078] border border-[#D4AF37]/40 flex items-center justify-center shrink-0">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-black text-[#071E17]">{title}</h3>
              <span className="text-[11px] font-bold text-[#8A6314]">
                · چندرسانه‌ای
              </span>
            </div>
            <p className="text-xs text-[#525E58] mt-0.5">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch md:self-auto flex-wrap w-full md:w-auto">
          {isAdmin && (
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-1.5 rounded-xl bg-[#FBF4E1] hover:bg-[#F6E8C3] text-[#6E5212] border border-[#E5C97B] text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
            >
              <Edit3 className="w-3.5 h-3.5 text-[#9A7116]" />
              <span>ویرایش ویترین چندرسانه‌ای</span>
            </button>
          )}

          <button
            onClick={onNavigateToCourses}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 rounded-xl bg-[#071E17] hover:bg-[#0D3227] text-[#F3D078] border border-[#D4AF37]/30 text-xs font-black transition-all shadow-xs cursor-pointer whitespace-nowrap"
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
            className="min-w-[74vw] sm:min-w-0 snap-start shrink-0 sm:shrink group p-3.5 sm:p-4 rounded-2xl bg-[#FAF8F2] hover:bg-white border border-[#E2DAC3] hover:border-[#071E17]/35 transition-all cursor-pointer flex flex-col justify-between space-y-3 hover:shadow-[0_12px_28px_-16px_rgba(7,30,23,0.18)]"
          >
            <div className="space-y-3">
              <div className="relative h-36 rounded-xl overflow-hidden bg-[#071E17] border border-[#E2DAC3]">
                <img
                  src={item.cover || showcaseBannerUrl || DEFAULT_SHOWCASE_IMAGES.multimedia_showcase}
                  alt={item.title}
                  referrerPolicy="no-referrer"
                  onError={e => handleImageErrorFallback(e, DEFAULT_SHOWCASE_IMAGES.multimedia_showcase)}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#071E17]/75 via-transparent to-transparent flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-[#071E17]/75 backdrop-blur-md text-[#F3D078] flex items-center justify-center group-hover:scale-110 transition-transform shadow-md border border-[#F3D078]/45">
                    <PlayCircle className="w-6 h-6" />
                  </div>
                </div>
                <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-[#071E17]/88 text-[#F3D078] text-[10px] font-black">
                  {item.tag}
                </span>
              </div>

              <div>
                <h4 className="font-black text-sm text-[#071E17] group-hover:text-[#0C4A38] transition-colors line-clamp-1">
                  {item.title}
                </h4>
                <p className="text-xs text-[#525E58] mt-1 line-clamp-1 font-medium">
                  استاد: {item.instructor}
                </p>
                <span className="text-[11px] text-[#8A6314] font-bold block mt-1">
                  {item.sessions}
                </span>
              </div>
            </div>

            <div className="pt-2.5 border-t border-[#ECE6D6] flex items-center justify-between text-xs font-extrabold text-[#071E17] group-hover:text-[#0C4A38]">
              <span>مشاهده و پخش آنلاین</span>
              <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Admin Edit Modal with Server Upload and MySQL Persistence */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-1 sm:p-4 bg-black/60 backdrop-blur-sm overflow-hidden" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-t-[26px] sm:rounded-3xl w-full max-w-3xl border border-stone-200 shadow-2xl text-stone-900 max-h-[92dvh] sm:max-h-[90vh] flex flex-col overflow-hidden"
            >
              <div className="px-5 py-4 sm:px-6 flex items-center justify-between gap-2 border-b border-stone-200 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <Edit3 className="w-5 h-5 text-cyan-700 shrink-0" />
                  <h4 className="font-black text-xs sm:text-sm text-stone-900 truncate">
                    ویرایش ویترین چندرسانه‌ای، تغییر پوستر و ذخیره در دیتابیس
                  </h4>
                </div>
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="w-10 h-10 rounded-full hover:bg-stone-100 text-stone-500 hover:text-stone-700 flex items-center justify-center shrink-0 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 sm:p-6 overflow-y-auto overscroll-y-contain space-y-5 flex-1 min-h-0">

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

              </div>

              <div className="px-5 py-3.5 sm:px-6 flex items-center justify-end gap-2 border-t border-stone-200 shrink-0 bg-stone-50 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 min-h-[42px] rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-5 py-2.5 min-h-[42px] rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-black shadow-md cursor-pointer"
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
