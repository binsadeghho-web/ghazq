import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { toPersianNumbers } from '../../utils/persianNumbers';
import {
  Sparkles,
  Calendar,
  Clock,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  Users,
  Video,
  FileCheck2,
  X,
  ExternalLink,
  Flame,
  Award
} from 'lucide-react';

interface StoryItem {
  id: string;
  title: string;
  category: string;
  presenter: string;
  date: string;
  time: string;
  accent: string;
  bgLight: string;
  icon: typeof Video;
  tag: string;
  description: string;
  linkTab: string;
  participants: number;
}

interface MizanStoriesSliderProps {
  onNavigate: (tabId: string) => void;
}

export const MizanStoriesSlider: React.FC<MizanStoriesSliderProps> = ({ onNavigate }) => {
  const { mizanConfig } = useApp();
  const [selectedStory, setSelectedStory] = useState<StoryItem | null>(null);

  if (mizanConfig.showStoriesSlider === false) return null;

  const stories: StoryItem[] = [
    {
      id: 'story-1',
      title: 'کارگاه برخط: تحلیل شروط ضمن عقد نکاح در رویه شعب دیوان عالی کشور',
      category: 'کارگاه زنده عالی',
      presenter: 'دکتر علیرضا کاظمی (مستشار دیوان عالی کشور)',
      date: 'پنج‌شنبه ۱۷ آبان',
      time: 'ساعت ۱۶:۰۰',
      accent: '#158561',
      bgLight: '#EBF8F2',
      icon: Video,
      tag: 'پخش زنده تالار قضا',
      description: 'بررسی مصادیق اختلافی در اعمال وکالت در طلاق، شرط تنصیف دارایی و آخرین آرای وحدت رویه صادره از هیئت عمومی دیوان عالی کشور به همراه پرسش و پاسخ تعاملی.',
      linkTab: 'courses',
      participants: 184
    },
    {
      id: 'story-2',
      title: 'فراخوان حمایت مادی و علمی از رساله‌های دکتری با موضوع «تحول قضایی و هوش حقوقی»',
      category: 'گرنت پژوهشی',
      presenter: 'مرکز تحقیقات فقهی و حقوقی قوه قضائیه',
      date: 'مهلت تا ۳۰ آبان',
      time: 'ثبت در کارتابل',
      accent: '#A06316',
      bgLight: '#FCF3E6',
      icon: FileCheck2,
      tag: 'حمایت ویژه رساله',
      description: 'اعطای گرنت پژوهشی، دسترسی به پایگاه دادنامه‌های محاکم و معرفی استاد راهنما و مشاور از میان قضات عالی‌رتبه کشوری برای دانش‌آموختگان ممتاز.',
      linkTab: 'research',
      participants: 62
    },
    {
      id: 'story-3',
      title: 'آغاز ثبت‌نام دوره جامع «مهارت‌های ادله اثبات دعوا در امور کیفری اقتصادی»',
      category: 'دوره تخصصی',
      presenter: 'استاد مسعود رضوانی (قاضی مجتمع ویژه مفاسد اقتصادی)',
      date: 'شروع از ۲۵ آبان',
      time: '۱۲ جلسه کارگاهی',
      accent: '#00848B',
      bgLight: '#E6F9FA',
      icon: Award,
      tag: 'ظرفیت محدود',
      description: 'بررسی ردیابی تراکنش‌های مالی، پولشویی، اسناد الکترونیکی و الزامات صدور قرارهای تأمین کیفری متناسب در جرایم کلان اقتصادی.',
      linkTab: 'courses',
      participants: 96
    },
    {
      id: 'story-4',
      title: 'جلسه نقد حضوری رأی شعبه ۴۱ دادگاه تجدیدنظر پیرامون «تحدید حدود مالکیت ثبتی»',
      category: 'نشست علمی نقد رأی',
      presenter: 'با حضور قضات تجدیدنظر، اساتید حقوق ثبت و وکلای پایه یک',
      date: 'سه‌شنبه ۲۲ آبان',
      time: 'ساعت ۱۰:۰۰',
      accent: '#6E45E2',
      bgLight: '#F3EEFF',
      icon: Sparkles,
      tag: 'تالار گفتگوی آراء',
      description: 'واکاوی حقوقی دادنامه در خصوص ابطال اسناد معارض، رویه ثبتی هیئت نظارت و صلاحیت مراجع قضایی در ابطال اسناد رسمی کاداستری.',
      linkTab: 'rulings',
      participants: 120
    }
  ];

  return (
    <section className="space-y-3">
      {/* هدر بخش رویدادها و اخبار ویژه */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#EBF8F2] text-[#158561] flex items-center justify-center font-bold">
            <Flame className="w-4 h-4 text-[#158561]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#0D3829]">رویدادها، فراخوان‌ها و وبینارهای جاری</h3>
            <p className="text-xs text-[#527768]">فرصت‌های علمی و صنفی دارای مهلت ثبت‌نام در سامانه</p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('courses')}
          className="text-xs font-semibold text-[#158561] hover:text-[#0C583F] flex items-center gap-1 transition-colors group"
        >
          <span>مشاهده تقویم دوره‌ها</span>
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
        </button>
      </div>

      {/* اسلایدر افقی کارت‌های داستانی */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {stories.map(story => {
          const IconComponent = story.icon;
          return (
            <div
              key={story.id}
              onClick={() => setSelectedStory(story)}
              className="group cursor-pointer rounded-2xl bg-white border border-[#E3ECE8] p-4 shadow-sm hover:shadow-md hover:border-[#158561]/40 transition-all flex flex-col justify-between relative overflow-hidden"
            >
              {/* باریک‌خط رنگی برندینگ بالای کارت */}
              <div
                className="absolute top-0 right-0 left-0 h-1 transition-all group-hover:h-1.5"
                style={{ backgroundColor: story.accent }}
              />

              <div className="space-y-3 pt-1">
                {/* تگ وضعیت و آیکون */}
                <div className="flex items-center justify-between">
                  <span
                    className="text-[11px] font-bold px-2 py-0.5 rounded-md"
                    style={{ backgroundColor: story.bgLight, color: story.accent }}
                  >
                    {story.tag}
                  </span>
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: story.bgLight, color: story.accent }}
                  >
                    <IconComponent className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* عنوان و ارائه‌دهنده */}
                <h4 className="text-sm font-bold text-[#143D2D] line-clamp-2 leading-snug group-hover:text-[#158561] transition-colors">
                  {story.title}
                </h4>

                <p className="text-xs text-[#557B6C] line-clamp-1">
                  {story.presenter}
                </p>
              </div>

              {/* فوتر اطلاعات زمان و دکمه باز کردن */}
              <div className="pt-3 mt-3 border-t border-[#EDF3F0] flex items-center justify-between text-xs text-[#527768]">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-[#158561]" />
                  <span>{story.date}</span>
                </div>
                <div className="flex items-center gap-1 text-[#158561] font-medium text-[11px] group-hover:underline">
                  <span>جزئیات</span>
                  <ArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-0.5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* مودال نمایش تفصیلی رویداد منتخب */}
      <AnimatePresence>
        {selectedStory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl border border-[#D5E5DE] max-w-lg w-full overflow-hidden shadow-2xl relative text-right"
              dir="rtl"
            >
              {/* هدر مودال با رنگ زمینه ملایم */}
              <div
                className="p-6 relative text-white"
                style={{
                  background: `linear-gradient(135deg, ${selectedStory.accent} 0%, #03271A 100%)`
                }}
              >
                <button
                  onClick={() => setSelectedStory(null)}
                  className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md mb-2">
                  {selectedStory.category}
                </div>
                <h3 className="text-lg font-black text-white leading-relaxed">
                  {selectedStory.title}
                </h3>
                <p className="text-xs text-white/80 mt-1">
                  {selectedStory.presenter}
                </p>
              </div>

              {/* محتوای توضیحات و اطلاعات تکمیلی */}
              <div className="p-6 space-y-4">
                <p className="text-sm leading-relaxed text-[#234A3B]">
                  {selectedStory.description}
                </p>

                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-[#F4F9F6] border border-[#DEEBE5] text-xs">
                  <div className="flex items-center gap-2 text-[#2C5747]">
                    <Calendar className="w-4 h-4 text-[#158561]" />
                    <span><strong>تاریخ:</strong> {selectedStory.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#2C5747]">
                    <Clock className="w-4 h-4 text-[#158561]" />
                    <span><strong>ساعت:</strong> {selectedStory.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#2C5747]">
                    <Users className="w-4 h-4 text-[#158561]" />
                    <span><strong>شرکت‌کنندگان:</strong> {toPersianNumbers(selectedStory.participants)} نفر</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#2C5747]">
                    <Award className="w-4 h-4 text-[#158561]" />
                    <span><strong>اعطای گواهی:</strong> پایان دوره</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E8F1EC]">
                  <button
                    onClick={() => setSelectedStory(null)}
                    className="px-4 py-2.5 rounded-xl border border-[#D0DFD9] text-xs font-semibold text-[#527768] hover:bg-[#F2F8F5] transition-colors"
                  >
                    بستن
                  </button>
                  <button
                    onClick={() => {
                      const tab = selectedStory.linkTab;
                      setSelectedStory(null);
                      onNavigate(tab);
                    }}
                    className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-[#158561] hover:bg-[#0E6A4C] shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                  >
                    <span>ثبت‌نام و ورود به دوره</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};
