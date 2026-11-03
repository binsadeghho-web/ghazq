import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { toPersianNumbers } from '../../utils/persianNumbers';
import {
  Inbox,
  GraduationCap,
  BookOpen,
  HeartHandshake,
  Compass,
  Scale,
  Gift,
  Users2,
  ArrowLeft,
  ChevronLeft,
  Sparkles,
  CheckCircle2,
  FileCheck
} from 'lucide-react';

interface MizanBentoGridProps {
  onNavigate: (tabId: string) => void;
}

export const MizanBentoGrid: React.FC<MizanBentoGridProps> = ({ onNavigate }) => {
  const { cartableRequests, courses, products, consultants, rulings, consumables, synergyPosts, researchMentorships } = useApp();
  const [hoveredTile, setHoveredTile] = useState<string | null>(null);

  const pendingCartable = cartableRequests.filter(r => r.status === 'pending' || r.status === 'in_progress').length;

  const tiles = [
    {
      id: 'cartable',
      title: 'کارتابل خدمات اداری و استعلامات',
      subtext: 'ثبت، گردش اسناد رسمی و استعلام پایه‌های قضایی با پاسخگویی دبیرخانه',
      icon: Inbox,
      accentColor: '#158561',
      softBg: '#DDF5E9',
      textColor: '#006042',
      badge: `${toPersianNumbers(pendingCartable)} پرونده در جریان`,
      size: 'col-span-1 md:col-span-2 row-span-2',
      subServices: [
        'درخواست گواهی اشتغال به قضا',
        'استعلام ترفیع و ارتقای رتبه قضایی',
        'درخواست اسناد آموزشی و مدارک'
      ],
      quickStat: `${toPersianNumbers(cartableRequests.length)} درخواست ثبت‌شده`,
      highlight: true
    },
    {
      id: 'courses',
      title: 'دوره‌های تخصصی و کارگاه‌های علمی',
      subtext: 'کارگاه‌های عالی فقه القضاء، آیین دادرسی، جلسات درس خارج و آرشیو صوتی',
      icon: GraduationCap,
      accentColor: '#00848B',
      softBg: '#D8F5F6',
      textColor: '#005F65',
      badge: `${toPersianNumbers(courses.length)} دوره آموزشی فعال`,
      size: 'col-span-1 md:col-span-2',
      subServices: [
        'وبینارهای برخط هفتگی',
        'آرشیو درس‌گفتارهای صوتی خارج',
        'صدور گواهینامه‌های رسمی معتبر'
      ],
      quickStat: '۴ کارگاه در حال ثبت‌نام'
    },
    {
      id: 'rulings',
      title: 'تالار نقد و ارزیابی آراء قضایی',
      subtext: 'دادنامه‌های مدلل محاکم بدوی، تجدیدنظر و دیوان عالی با مباحثات فقهی',
      icon: Scale,
      accentColor: '#9A6418',
      softBg: '#FCECD9',
      textColor: '#724400',
      badge: `${toPersianNumbers(rulings.length)} دادنامه نقدشده`,
      size: 'col-span-1 md:col-span-1 row-span-2',
      subServices: [
        'بررسی مبانی استدلال فقهی دادنامه‌ها',
        'مشارکت در نقدهای تخصصی همکاران',
        'ثبت رأی برگزیده برای داوری'
      ],
      quickStat: '۱۲ گفت‌وگوی فقهی امروز'
    },
    {
      id: 'counseling',
      title: 'خدمات مشاوره عمومی و سلامت',
      subtext: 'کوچینگ سلامت روان، خانواده، زوج‌درمانی و تاب‌آوری در برابر تنش دادرسی',
      icon: HeartHandshake,
      accentColor: '#5F6BB1',
      softBg: '#E8EDFF',
      textColor: '#404986',
      badge: 'مشاوره محرمانه',
      size: 'col-span-1',
      subServices: [
        'مشاوره خانواده و پیش از ازدواج',
        'مدیریت اضطراب و بهزیستی فردی',
        'جلسات حضوری و برخط رمزنگاری‌شده'
      ],
      quickStat: `${toPersianNumbers(consultants.filter(c => c.counselingType !== 'specialized_career').length)} مشاور ارشد`
    },
    {
      id: 'specialized_counseling',
      title: 'مشاوره تخصصی شغلی قضاوت',
      subtext: 'هدایت شغلی-تحصیلی با قضات پیشکسوت دیوان عالی، ارتقای پایه و اختبار',
      icon: Scale,
      accentColor: '#DBB155',
      softBg: '#FDF7E7',
      textColor: '#755914',
      badge: '۷۰٪ یارانه مرکز',
      size: 'col-span-1',
      subServices: [
        'آمادگی برای آزمون اختبار و مصاحبه',
        'مشاوره ارتقای پایه و تغییر سمت',
        'راهنمایی نگارش احکام سنگین کیفری'
      ],
      quickStat: `${toPersianNumbers(consultants.filter(c => c.counselingType === 'specialized_career').length)} قاضی پیشکسوت`
    },
    {
      id: 'research',
      title: 'راهبری پژوهش و رساله‌ها',
      subtext: 'کوچینگ نگارش پایان‌نامه سطح ۳ و ۴، استاد راهنما و اسکان پژوهشی قم',
      icon: Compass,
      accentColor: '#955890',
      softBg: '#FBE8F8',
      textColor: '#6E396A',
      badge: `${toPersianNumbers(researchMentorships.length)} طرح در حال هدایت`,
      size: 'col-span-1',
      subServices: [
        'تایید عنوان و مسئله‌شناسی فقهی',
        'اسکان پژوهشی در قم و تهران',
        'معرفی به اساتید ناظر حوزوی'
      ],
      quickStat: 'هدایت تا دفاع نهایی'
    },
    {
      id: 'products',
      title: 'محصولات و کتب تخصصی',
      subtext: 'موسوعه‌های فقه القضاء، آرای وحدت رویه، جزوات و ارسال پستی رایگان',
      icon: BookOpen,
      accentColor: '#2579AB',
      softBg: '#DDF2FF',
      textColor: '#005581',
      badge: `${toPersianNumbers(products.length)} عنوان اثر`,
      size: 'col-span-1',
      subServices: [
        'دریافت فایل دانلودی آنی آثار',
        'ارسال کتب چاپی با پست پیشتاز',
        'تخفیف ویژه دانش‌آموختگان'
      ],
      quickStat: 'کتابخانه دیجیتال'
    },
    {
      id: 'welfare',
      title: 'تسهیلات رفاهی و اقامتگاه‌ها',
      subtext: 'وام قرض‌الحسنه صندوق حامی، اقامتگاه‌های زیارتی مشهد و قم و تعاونی',
      icon: Gift,
      accentColor: '#6A7B27',
      softBg: '#ECF2DC',
      textColor: '#495704',
      badge: 'وام تا ۱۵۰ میلیون',
      size: 'col-span-1',
      subServices: [
        'ثبت‌نام اقامتگاه زیارتی مشهد مقدس',
        'درخواست وام قرض‌الحسنه رفاه',
        'اقلام معیشتی تعاونی مصرف'
      ],
      quickStat: `${toPersianNumbers(consumables.length)} طرح معیشتی فعال`
    },
    {
      id: 'synergy',
      title: 'دیوار هم‌افزایی شغلی اعضا',
      subtext: 'تبادل رویه‌های قضایی استانی، استعلام ناشناس و پویش‌های همیاری صنفی',
      icon: Users2,
      accentColor: '#A75463',
      softBg: '#FFE7EA',
      textColor: '#7C3543',
      badge: `${toPersianNumbers(synergyPosts.length)} استعلام فعال`,
      size: 'col-span-1 md:col-span-2',
      subServices: [
        'استعلام رویه قضایی با حفظ گمنامی',
        'اشتراک تجارب دادرسی شعب مختلف',
        'پویش‌های همدلی و تعاون اعضا'
      ],
      quickStat: 'پاسخگویی سریع همکاران'
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-[#0F1E18] flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#207E5D]" />
            <span>ویترین جامع خدمات سامانه</span>
          </h2>
          <p className="text-xs text-[#5E6D66] mt-0.5">
            دسترسی متوازن به کلیه بخش‌ها بر اساس اهمیت و وزن کاری
          </p>
        </div>
        <span className="text-xs text-[#207E5D] font-bold bg-[#E9FAF2] px-3 py-1 rounded-full border border-[#D4F4E5] hidden sm:inline-block">
          معماری متوازن بنتو (Bento Grid)
        </span>
      </div>

      {/* شبکه بنتو ۸ کاشی */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {tiles.map(tile => {
          const Icon = tile.icon;
          const isHovered = hoveredTile === tile.id;

          return (
            <motion.div
              key={tile.id}
              onMouseEnter={() => setHoveredTile(tile.id)}
              onMouseLeave={() => setHoveredTile(null)}
              onClick={() => onNavigate(tile.id)}
              whileHover={{ y: -3 }}
              transition={{ duration: 0.2 }}
              className={`${tile.size} relative bg-[#F8FBF9] hover:bg-white rounded-2xl p-5 border border-[#D1DAD5] hover:border-[${tile.accentColor}]/60 transition-all shadow-[0_4px_16px_rgba(7,52,36,0.06)] hover:shadow-[0_12px_28px_rgba(7,52,36,0.12)] cursor-pointer flex flex-col justify-between overflow-hidden group`}
              style={{
                borderTop: `3px solid ${tile.accentColor}`,
              }}
            >
              {/* بخش بالایی کارت */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs transition-transform group-hover:scale-105"
                    style={{ backgroundColor: tile.softBg, color: tile.textColor }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <span
                    className="text-[11px] font-bold px-2.5 py-0.5 rounded-full border shrink-0"
                    style={{
                      backgroundColor: tile.softBg,
                      borderColor: `${tile.accentColor}33`,
                      color: tile.textColor,
                    }}
                  >
                    {tile.badge}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-[#0F1E18] group-hover:text-[#207E5D] transition-colors leading-snug">
                    {tile.title}
                  </h3>
                  <p className="text-xs text-[#3B4C44] mt-1 line-clamp-2 leading-relaxed">
                    {tile.subtext}
                  </p>
                </div>
              </div>

              {/* زیرخدمات (نمایش روان در هاور یا همیشه در کارت‌های بزرگ) */}
              <div className="mt-4 pt-3 border-t border-[#E4ECE8] space-y-2">
                <div className="space-y-1">
                  {tile.subServices.slice(0, isHovered || tile.highlight ? 3 : 2).map((sub, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[11px] text-[#5E6D66]">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tile.accentColor }} />
                      <span className="truncate">{sub}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] font-bold text-[#5E6D66]">{tile.quickStat}</span>
                  <div className="flex items-center gap-1 text-xs font-bold text-[#207E5D] group-hover:translate-x-[-3px] transition-transform">
                    <span>ورود به بخش</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
