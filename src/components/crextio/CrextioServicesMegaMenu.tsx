import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { toPersianNumbers } from '../../utils/persianNumbers';
import {
  LayoutGrid,
  Inbox,
  GraduationCap,
  BookOpen,
  HeartHandshake,
  Compass,
  Scale,
  Gift,
  Users2,
  Users,
  ShieldCheck,
  ChevronDown,
  Sparkles,
  ArrowLeft,
  Search,
  X,
  Home
} from 'lucide-react';

interface CrextioServicesMegaMenuProps {
  activeNav: string;
  onNavigate: (tabId: string) => void;
}

export const CrextioServicesMegaMenu: React.FC<CrextioServicesMegaMenuProps> = ({
  activeNav,
  onNavigate
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const menuRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const { currentUser, cartableRequests, courses, rulings, products, consultants, researchMentorships } = useApp();
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'supervisor';
  const pendingCartable = cartableRequests.filter(r => r.status === 'pending' || r.status === 'in_progress').length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMouseEnter = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 300);
  };

  const serviceCards = [
    {
      id: 'Dashboard',
      title: 'داشبورد اصلی و بوم یکپارچه',
      subtext: 'نمای کلی، آمار زنده، ویترین‌ها و بنرهای اختصاصی دانش‌آموختگان',
      badge: 'صفحه اصلی',
      tag: 'نمای کلان',
      icon: Home,
      accent: '#059669',
      category: 'عمومی'
    },
    {
      id: 'People',
      title: 'کارتابل خدمات اداری و استعلامات',
      subtext: 'ثبت، گردش اسناد رسمی و استعلام پایه‌های قضایی با پاسخگویی دبیرخانه',
      badge: 'پرتال اداری',
      tag: `${toPersianNumbers(pendingCartable)} پرونده جاری`,
      icon: Inbox,
      accent: '#2563EB',
      category: 'اداری'
    },
    {
      id: 'SpecializedCounseling',
      title: 'مشاوره تخصصی شغلی و تحصیلی',
      subtext: 'هدایت مسیر نخبگانی قضایی، موفقیت در اختبار، ترفیع رتبه و مصاحبه‌ها',
      badge: 'هدایت شغلی',
      tag: 'رزرو آنلاین مشاور',
      icon: Compass,
      accent: '#D97706',
      category: 'مشاوره'
    },
    {
      id: 'CounselingGeneral',
      title: 'خدمات مشاوره عمومی و فردی',
      subtext: 'روان‌شناختی، خانواده، زوج‌درمانی، تاب‌آوری شغلی و مدیریت اضطراب',
      badge: 'سلامت روان',
      tag: `${toPersianNumbers(consultants.length)} مشاور مجرب`,
      icon: HeartHandshake,
      accent: '#E11D48',
      category: 'مشاوره'
    },
    {
      id: 'Courses',
      title: 'دوره‌ها و کارگاه‌های تخصصی',
      subtext: 'کارگاه‌های عالی فقه کاربردی، اسناد و آرشیو صوتی و تصویری جلسات',
      badge: 'آموزش عالی',
      tag: `${toPersianNumbers(courses.length)} دوره فعال`,
      icon: GraduationCap,
      accent: '#0891B2',
      category: 'آموزش'
    },
    {
      id: 'Research',
      title: 'راهبری پایان‌نامه‌ها و رساله‌ها',
      subtext: 'هدایت رساله دکتری، مشاوره اساتید عالی‌رتبه و حمایت مادی از رساله‌ها',
      badge: 'راهبری علمی',
      tag: `${toPersianNumbers(researchMentorships?.length || 18)} رساله جاری`,
      icon: BookOpen,
      accent: '#B45309',
      category: 'آموزش'
    },
    {
      id: 'Rulings',
      title: 'تالار نقد و مباحثه آراء قضایی',
      subtext: 'نقد موشکافانه احکام توسط قضات تجدیدنظر و دیوان عالی کشور',
      badge: 'مباحثات فقهی',
      tag: `${toPersianNumbers(rulings.length)} رأی نقدشده`,
      icon: Scale,
      accent: '#CA8A04',
      category: 'قضایی'
    },
    {
      id: 'Products',
      title: 'محصولات، منشورات و کتب',
      subtext: 'دانشنامه‌های فقهی-حقوقی، آرای وحدت رویه و متون مرجع قضایی',
      badge: 'انتشارات مرجع',
      tag: `${toPersianNumbers(products.length)} اثر علمی`,
      icon: BookOpen,
      accent: '#7C3AED',
      category: 'آموزش'
    },
    {
      id: 'Welfare',
      title: 'تسهیلات رفاهی و اقامتگاه‌ها',
      subtext: 'وام قرض‌الحسنه صندوق رفاه، اقامتگاه مشهد و قم، تعاونی مصرف',
      badge: 'صندوق رفاهی',
      tag: 'تسهیلات زیارتی',
      icon: Gift,
      accent: '#DB2777',
      category: 'رفاه'
    },
    {
      id: 'Synergy',
      title: 'دیوار هم‌افزایی شغلی و تجربیات',
      subtext: 'تبادل مستقیم تجارب اداری، رویه‌های قضایی شعب و استعلامات محلی',
      badge: 'شبکه همکاران',
      tag: 'تبادل آراء',
      icon: HeartHandshake,
      accent: '#2563EB',
      category: 'قضایی'
    },
    ...(isAdmin ? [
      {
        id: 'Alumni',
        title: 'بانک جامع دانش‌آموختگان',
        subtext: 'فهرست ۱,۰۰۰ دانش‌آموخته حوزوی و قضایی، سوابق علمی و تخصصی',
        badge: 'دایرکتوری',
        tag: 'بانک اطلاعاتی',
        icon: Users2,
        accent: '#0D9488',
        category: 'مدیریت'
      },
      {
        id: 'Users',
        title: 'مدیریت کاربران و حساب‌ها',
        subtext: 'صدور حساب کاربری، قفل/فعال‌سازی، تعیین دسترسی و ماتریس نقش‌ها',
        badge: 'کنترل دسترسی',
        tag: 'امنیت نشست‌ها',
        icon: Users,
        accent: '#4F46E5',
        category: 'مدیریت'
      },
      {
        id: 'Admin',
        title: 'مرکز مدیریت و تنظیمات کلان',
        subtext: 'تنظیمات امنیتی، لاگ‌های سیستمی، نظارت بر کارتابل و تالارها',
        badge: 'مدیریت ارشد',
        tag: 'فرماندهی',
        icon: ShieldCheck,
        accent: '#DC2626',
        category: 'مدیریت'
      }
    ] : [])
  ];

  const categories = [
    { id: 'all', label: 'همه خدمات' },
    { id: 'اداری', label: 'اداری و کارتابل' },
    { id: 'مشاوره', label: 'مشاوره و هدایت' },
    { id: 'آموزش', label: 'آموزش و پژوهش' },
    { id: 'قضایی', label: 'رویه قضایی و آراء' },
    { id: 'رفاه', label: 'رفاهیات و تعاونی' },
    ...(isAdmin ? [{ id: 'مدیریت', label: 'مدیریت' }] : [])
  ];

  const filteredCards = serviceCards.filter(c => {
    const matchesSearch =
      c.title.includes(searchQuery) ||
      c.subtext.includes(searchQuery) ||
      c.category.includes(searchQuery);
    const matchesCategory = selectedCategory === 'all' || c.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div
      ref={menuRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative flex items-center justify-center z-50"
    >
      {/* دکمه مرکزی چشم‌نواز با تغییر رنگ زنده و انیمیشن پرتو */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="group relative flex items-center gap-2.5 px-5 py-2.5 rounded-2xl text-stone-900 font-black shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden border border-emerald-500/40 bg-white"
      >
        {/* کادر با گرادینت زمردی-زرین */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-50 via-amber-50/40 to-teal-50 opacity-90 transition-all group-hover:opacity-100" />
        
        {/* انیمیشن موج نور متحرک */}
        <motion.div
          animate={{ x: ['-100%', '200%'] }}
          transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
          className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-emerald-200/40 to-transparent skew-x-12 pointer-events-none"
        />

        {/* محتوای دکمه */}
        <div className="relative z-10 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-700 to-teal-800 text-white flex items-center justify-center shadow-xs group-hover:rotate-6 transition-transform">
            <LayoutGrid className="w-3.5 h-3.5 stroke-[2.3]" />
          </div>

          <div className="text-right">
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-black text-stone-900 tracking-tight group-hover:text-emerald-800 transition-colors">
                منو و خدمات نرم‌افزار
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-black px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                <span>۱۲ بخش</span>
              </span>
            </div>
          </div>

          <ChevronDown
            className={`w-3.5 h-3.5 text-stone-600 transition-transform duration-200 mr-0.5 ${
              isOpen ? 'rotate-180 text-emerald-700' : 'group-hover:translate-y-0.5'
            }`}
          />
        </div>
      </motion.button>

      {/* پنجره مگا منو متمرکز در مرکز صفحه با ابعاد متناسب (Light Daylight Style با موشن تم ۱) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed sm:absolute top-20 sm:top-full left-1/2 -translate-x-1/2 mt-3 w-[95vw] max-w-6xl xl:w-[1260px] bg-[#FCFCFA] rounded-[32px] border border-stone-300 shadow-2xl text-stone-900 z-50 flex flex-col overflow-hidden"
            dir="rtl"
          >
            {/* نوار سربرگ متمرکز با فیلتر دسته‌ها و جستجو */}
            <div className="p-3.5 sm:px-6 bg-[#F5F4ED] border-b border-stone-200 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
                      selectedCategory === cat.id
                        ? 'bg-emerald-800 text-white shadow-xs'
                        : 'bg-white text-stone-600 hover:text-stone-900 hover:bg-stone-100 border border-stone-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* جستجوی سریع */}
              <div className="flex items-center gap-2 bg-white border border-stone-300 rounded-xl px-3.5 py-1.5 max-w-xs w-full shadow-2xs">
                <Search className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="جستجوی سریع خدمات..."
                  className="bg-transparent text-xs text-stone-800 placeholder-stone-400 focus:outline-none w-full"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-stone-400 hover:text-stone-700">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* بدنه ۴ یا ۳ ستونی کارت‌ها با موشن و افکت‌های تم ۱ */}
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[76vh]">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5">
                {filteredCards.map(card => {
                  const Icon = card.icon;
                  const isActive = activeNav.toLowerCase() === card.id.toLowerCase();

                  return (
                    <motion.div
                      key={card.id}
                      onClick={() => {
                        onNavigate(card.id);
                        setIsOpen(false);
                      }}
                      whileHover={{ y: -4, scale: 1.02, transition: { duration: 0.18 } }}
                      whileTap={{ scale: 0.98 }}
                      className={`group cursor-pointer rounded-2xl p-4 border transition-all duration-200 flex flex-col justify-between relative bg-white overflow-hidden shadow-2xs hover:shadow-lg ${
                        isActive
                          ? 'border-emerald-600 ring-2 ring-emerald-500/20 shadow-md'
                          : 'border-stone-200/90 hover:border-emerald-400'
                      }`}
                    >
                      {/* هاله نور تعاملی تم ۱ در هاور */}
                      <div
                        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        style={{
                          background: `radial-gradient(180px circle at 50% 20%, ${card.accent}15, transparent 70%)`
                        }}
                      />

                      {/* خط نواری بالای کارت با شاین */}
                      <div
                        className="absolute top-0 right-0 left-0 h-1.5 rounded-t-2xl transition-all group-hover:h-2"
                        style={{ backgroundColor: card.accent }}
                      />

                      <div className="relative z-10 space-y-2.5 pt-1">
                        <div className="flex items-center justify-between">
                          <div
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-2xs"
                            style={{
                              backgroundColor: `${card.accent}18`,
                              color: card.accent
                            }}
                          >
                            <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                          </div>

                          <span
                            className="text-[11px] font-bold px-2 py-0.5 rounded-full border backdrop-blur-md"
                            style={{
                              backgroundColor: `${card.accent}10`,
                              color: card.accent,
                              borderColor: `${card.accent}25`
                            }}
                          >
                            {card.badge}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-xs sm:text-sm font-black text-stone-900 group-hover:text-emerald-900 transition-colors line-clamp-1">
                            {card.title}
                          </h4>
                          <p className="text-[11px] text-stone-600 mt-1 line-clamp-2 leading-relaxed font-medium">
                            {card.subtext}
                          </p>
                        </div>
                      </div>

                      <div className="relative z-10 pt-2.5 mt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500 font-medium">
                        <span className="text-emerald-700 font-bold">{card.tag}</span>
                        <span className="flex items-center gap-0.5 text-stone-700 group-hover:text-emerald-800 font-extrabold">
                          <span>ورود</span>
                          <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* فوتر مینیمال */}
            <div className="p-3.5 px-8 bg-[#F5F4ED] border-t border-stone-200 flex items-center justify-between text-xs sm:text-sm text-stone-600 shrink-0">
              <span className="flex items-center gap-2 text-stone-700 font-medium">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>انتخاب هر کارت شما را مستقیم به ماژول مربوطه هدایت می‌کند.</span>
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="text-stone-600 hover:text-stone-900 font-bold px-3 py-1.5 rounded-xl hover:bg-stone-200 transition-colors cursor-pointer"
              >
                بستن (ESC)
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
