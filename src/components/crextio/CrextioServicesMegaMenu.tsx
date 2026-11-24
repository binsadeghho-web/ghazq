import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { toPersianNumbers } from '../../utils/persianNumbers';
import { AppSectionId } from '../../types';
import { canViewSection, useRbacPolicies, isOrganizationalRole } from '../../utils/rbacPolicy';
import {
  applyNavigationCustomization,
  getResolvedNavigationConfig,
} from '../../utils/navigationConfig';
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
  Home,
  Wallet
} from 'lucide-react';

interface CrextioServicesMegaMenuProps {
  activeNav: string;
  onNavigate: (tabId: string) => void;
  externalOpen?: boolean;
  onExternalOpenChange?: (open: boolean) => void;
  hideTriggerOnMobile?: boolean;
}

export const CrextioServicesMegaMenu: React.FC<CrextioServicesMegaMenuProps> = ({
  activeNav,
  onNavigate,
  externalOpen,
  onExternalOpenChange,
  hideTriggerOnMobile = false,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  const setIsOpen = (val: boolean | ((prev: boolean) => boolean)) => {
    const next = typeof val === 'function' ? val(isOpen) : val;
    if (onExternalOpenChange) onExternalOpenChange(next);
    else setInternalOpen(next);
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isMdUp, setIsMdUp] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );
  const menuRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const checkWidth = () => setIsMdUp(window.innerWidth >= 768);
    window.addEventListener('resize', checkWidth, { passive: true });
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  const {
    currentUser,
    cartableRequests,
    courses,
    rulings,
    products,
    consultants,
    researchMentorships,
    productsStoreConfig,
    isAlumniPreview,
    crextioConfig,
  } = useApp();
  const { rolePolicies } = useRbacPolicies();
  const pendingCartable = cartableRequests.filter(r => r.status === 'pending' || r.status === 'in_progress').length;
  const isStaff = isOrganizationalRole(currentUser?.role) && !isAlumniPreview;
  const resolvedNav = getResolvedNavigationConfig(crextioConfig.navigationConfig);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (typeof window !== 'undefined' && window.innerWidth < 768) return;
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleMouseEnter = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 300);
  };

  const allServiceCards: Array<{
    id: string;
    sectionId: AppSectionId;
    title: string;
    subtext: string;
    badge: string;
    tag: string;
    icon: any;
    accent: string;
    category: string;
  }> = [
    {
      id: 'People',
      sectionId: 'cartable',
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
      sectionId: 'specialized_counseling',
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
      sectionId: 'counseling',
      title: 'خدمات روانشناختی و مشاوره',
      subtext: 'روان‌شناختی، خانواده، زوج‌درمانی، تاب‌آوری شغلی و مدیریت اضطراب',
      badge: 'سلامت روان',
      tag: `${toPersianNumbers(consultants.length)} مشاور مجرب`,
      icon: HeartHandshake,
      accent: '#E11D48',
      category: 'مشاوره'
    },
    {
      id: 'Courses',
      sectionId: 'courses',
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
      sectionId: 'research',
      title: 'راهبری پژوهش و مقاله (خدمات پژوهشی)',
      subtext: 'پک کامل یا مشورت موردی برای پایان‌نامه و مقاله، اساتید مجرب و اسکان مطالعاتی قم',
      badge: 'خدمات پژوهشی',
      tag: `${toPersianNumbers(researchMentorships?.length || 18)} رساله جاری`,
      icon: BookOpen,
      accent: '#B45309',
      category: 'آموزش'
    },
    {
      id: 'Rulings',
      sectionId: 'rulings',
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
      sectionId: 'products',
      title: 'کتاب و محصولات چند رسانه‌ای',
      subtext: 'کتب مرجع، نشست‌های علمی صوتی/تصویری و درس‌گفتارها با دانلود پس از ثبت‌نام یا ارسال پستی',
      badge: !productsStoreConfig.isStoreEnabled ? 'موقتاً غیرفعال' : 'انتشارات و رسانه',
      tag: `${toPersianNumbers(products.length)} اثر علمی`,
      icon: BookOpen,
      accent: '#7C3AED',
      category: 'آموزش'
    },
    {
      id: 'Welfare',
      sectionId: 'welfare',
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
      sectionId: 'synergy',
      title: 'دیوار هم‌افزایی شغلی و تجربیات',
      subtext: 'تبادل مستقیم تجارب اداری، رویه‌های قضایی شعب و استعلامات محلی',
      badge: 'شبکه همکاران',
      tag: 'تبادل آراء',
      icon: HeartHandshake,
      accent: '#2563EB',
      category: 'قضایی'
    },
    {
      id: 'Finance',
      sectionId: 'finance',
      title: 'امور مالی، حسابداری و درآمدها',
      subtext: 'مدیریت جامع درآمدها، فیش‌های واریزی و تسویه‌حساب‌ها',
      badge: 'امور مالی',
      tag: 'حسابداری و مالی',
      icon: Wallet,
      accent: '#059669',
      category: 'مدیریت'
    },
    {
      id: 'Alumni',
      sectionId: 'alumni',
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
      sectionId: 'users',
      title: 'مدیریت کاربران، نقش‌ها و حساب‌ها',
      subtext: 'صدور حساب کاربری، مدیریت ۹ نقش سازمانی، ویترین مشتریان و ماتریس دسترسی',
      badge: 'کنترل دسترسی',
      tag: '۹ نقش سازمانی',
      icon: Users,
      accent: '#4F46E5',
      category: 'مدیریت'
    },
    {
      id: 'Admin',
      sectionId: 'admin',
      title: 'مرکز مدیریت و تنظیمات کلان',
      subtext: 'تنظیمات امنیتی، لاگ‌های سیستمی، نظارت بر کارتابل و تالارها',
      badge: 'مدیریت ارشد',
      tag: 'فرماندهی',
      icon: ShieldCheck,
      accent: '#DC2626',
      category: 'مدیریت'
    }
  ];

  // Apply customized order, labels, subtexts, badges, and visibility overrides
  const customizedCards = applyNavigationCustomization(
    allServiceCards,
    resolvedNav.servicesMenuItems,
    { hideInvisible: true }
  );

  // Strict Menu Cloaking: Hide Alumni, Users, Admin, Finance from alumni & preview mode
  const serviceCards = customizedCards.filter(card => {
    if (!isStaff && (card.sectionId === 'alumni' || card.sectionId === 'users' || card.sectionId === 'admin' || card.sectionId === 'finance')) {
      return false;
    }
    return canViewSection(currentUser, card.sectionId, rolePolicies);
  });

  const visibleCategoriesSet = new Set(serviceCards.map(c => c.category));
  const categories = [
    { id: 'all', label: 'همه خدمات' },
    { id: 'اداری', label: 'اداری و کارتابل' },
    { id: 'مشاوره', label: 'مشاوره و هدایت' },
    { id: 'آموزش', label: 'آموزش و پژوهش' },
    { id: 'قضایی', label: 'رویه قضایی و آراء' },
    { id: 'رفاه', label: 'رفاهیات و تعاونی' },
    { id: 'مدیریت', label: 'مدیریت' }
  ].filter(cat => cat.id === 'all' || visibleCategoriesSet.has(cat.id));

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
      {/* دکمه مرکزی در دسکتاپ/تبلت */}
      {(!hideTriggerOnMobile || isMdUp) && (
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.04, y: -2 }}
        whileTap={{ scale: 0.96 }}
        animate={{
          borderColor: [
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.9)',
            'rgba(79, 70, 229, 0.9)',
            'rgba(225, 29, 72, 0.9)',
            'rgba(13, 148, 136, 0.9)',
            'rgba(16, 185, 129, 0.8)'
          ],
          boxShadow: [
            '0 0 25px rgba(16, 185, 129, 0.4), 0 6px 16px rgba(0,0,0,0.15)',
            '0 0 30px rgba(245, 158, 11, 0.5), 0 6px 16px rgba(0,0,0,0.15)',
            '0 0 30px rgba(79, 70, 229, 0.5), 0 6px 16px rgba(0,0,0,0.15)',
            '0 0 30px rgba(225, 29, 72, 0.5), 0 6px 16px rgba(0,0,0,0.15)',
            '0 0 25px rgba(16, 185, 129, 0.4), 0 6px 16px rgba(0,0,0,0.15)'
          ]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        className={`${hideTriggerOnMobile ? 'hidden md:flex' : 'flex'} group relative items-center gap-3 px-5 py-2.5 sm:px-6 sm:py-3 rounded-2xl text-stone-900 font-black shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden border-2 bg-white`}
      >
        {/* کادر با گرادینت درخشان که به طور کامل در چرخه رنگی تغییر می‌کند */}
        <motion.div
          animate={{
            background: [
              'linear-gradient(135deg, rgba(236, 253, 245, 0.98), rgba(254, 243, 199, 0.8), rgba(204, 251, 241, 0.98))',
              'linear-gradient(135deg, rgba(254, 243, 199, 0.98), rgba(254, 226, 226, 0.8), rgba(254, 240, 138, 0.98))',
              'linear-gradient(135deg, rgba(238, 242, 255, 0.98), rgba(224, 231, 255, 0.8), rgba(254, 226, 226, 0.98))',
              'linear-gradient(135deg, rgba(255, 228, 230, 0.98), rgba(254, 243, 199, 0.8), rgba(236, 253, 245, 0.98))',
              'linear-gradient(135deg, rgba(236, 253, 245, 0.98), rgba(254, 243, 199, 0.8), rgba(204, 251, 241, 0.98))'
            ]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 opacity-95 transition-all group-hover:opacity-100"
        />
        
        {/* انیمیشن موج نور درخشان و برق سریع که هر ۴ ثانیه تکرار می‌شود */}
        <motion.div
          animate={{ x: ['-180%', '280%'] }}
          transition={{ repeat: Infinity, duration: 0.8, repeatDelay: 3.2, ease: 'easeInOut' }}
          className="absolute inset-y-0 w-32 bg-gradient-to-r from-transparent via-white/90 to-transparent skew-x-12 pointer-events-none filter blur-[1px]"
        />

        {/* محتوای دکمه با ایکون و تگ درخشان */}
        <div className="relative z-10 flex items-center gap-3">
          <motion.div
            animate={{
              rotate: [0, 10, -10, 0],
              scale: [1, 1.12, 1]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-600 via-teal-600 to-indigo-700 text-white flex items-center justify-center shadow-md"
          >
            <LayoutGrid className="w-4 h-4 stroke-[2.5]" />
          </motion.div>

          <div className="text-right">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-black text-stone-900 tracking-tight group-hover:text-emerald-900 transition-colors drop-shadow-xs">
                {resolvedNav.servicesMenuTitle}
              </span>
              <motion.span
                animate={{
                  scale: [1, 1.05, 1],
                  borderColor: ['rgba(16, 185, 129, 0.4)', 'rgba(245, 158, 11, 0.7)', 'rgba(16, 185, 129, 0.4)']
                }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border shadow-xs"
              >
                <Sparkles className="w-3 h-3 text-amber-600 animate-spin" style={{ animationDuration: '6s' }} />
                <span>{toPersianNumbers(serviceCards.length)} بخش فعال</span>
              </motion.span>
            </div>
          </div>

          <ChevronDown
            className={`w-4 h-4 text-stone-700 transition-transform duration-300 mr-1 ${
              isOpen ? 'rotate-180 text-emerald-700' : 'group-hover:translate-y-0.5'
            }`}
          />
        </div>
      </motion.button>
      )}

      {/* پنجره مگامنو (در موبایل به صورت Bottom Sheet تمام‌لمسی و در دسکتاپ به صورت مگامنو متمرکز) */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Mobile Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="md:hidden fixed inset-0 bg-stone-950/60 backdrop-blur-xs z-50"
            />
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-x-0 bottom-0 md:bottom-auto md:inset-x-auto md:absolute md:top-full md:left-1/2 md:-translate-x-1/2 md:mt-3 w-full md:w-[min(94vw,1260px)] max-h-[86vh] md:max-h-[82vh] bg-[#FCFCFA] rounded-t-[28px] md:rounded-[32px] border border-stone-300 shadow-2xl text-stone-900 z-50 flex flex-col overflow-hidden safe-area-bottom"
              dir="rtl"
            >
              {/* Mobile Sheet Drag Pill & Obsidian-Emerald Luxury Header */}
              <div className="md:hidden relative overflow-hidden flex flex-col items-center pt-2.5 pb-3 px-4 bg-gradient-to-br from-[#071E17] via-[#0E3226] to-[#08221A] text-white border-b border-amber-400/25 shrink-0">
                <div className="pointer-events-none absolute inset-0 luxury-lattice-bg opacity-65" />
                <div className="relative z-10 w-10 h-1 rounded-full bg-amber-300/45 mb-2.5" />
                <div className="relative z-10 w-full flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-400/15 border border-amber-300/35 text-amber-300 flex items-center justify-center">
                      <LayoutGrid className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-black text-white block">
                        {resolvedNav.servicesMenuTitle}
                      </span>
                      <span className="text-[10px] text-emerald-200/80">
                        {toPersianNumbers(serviceCards.length)} سامانه فعال
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white cursor-pointer"
                    aria-label="بستن منو"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* نوار سربرگ متمرکز با فیلتر دسته‌ها و جستجو */}
              <div className="p-3 sm:px-6 bg-[#F5F4ED] border-b border-stone-200 flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3 shrink-0">
                <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-0.5 md:pb-0 scrollbar-none">
                  {categories.map(cat => {
                    const isCatActive = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`relative px-3.5 py-2 sm:py-1.5 min-h-[38px] rounded-xl text-xs font-extrabold transition-colors whitespace-nowrap cursor-pointer shrink-0 ${
                          isCatActive
                            ? 'text-white'
                            : 'bg-white text-stone-600 hover:text-stone-900 hover:bg-stone-100 border border-stone-200'
                        }`}
                      >
                        {isCatActive && (
                          <motion.span
                            layoutId="servicesMenuCategoryPill"
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            className="absolute inset-0 rounded-xl bg-gradient-to-l from-[#071E17] to-emerald-800 shadow-xs"
                          />
                        )}
                        <span className="relative z-10">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* جستجوی سریع */}
                <div className="flex items-center gap-2 bg-white border border-stone-300 rounded-xl px-3.5 py-2 sm:py-1.5 md:max-w-xs w-full shadow-2xs">
                  <Search className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="جستجوی سریع خدمات..."
                    className="bg-transparent text-xs text-stone-800 placeholder-stone-400 focus:outline-none w-full"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="text-stone-400 hover:text-stone-700 p-1">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* بدنه ۲ ستونی موبایل و ۴ ستونی دسکتاپ کارت‌ها */}
              <div className="p-3 sm:p-6 overflow-y-auto flex-1 bg-[#FAF9F5]">
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3.5">
                  {filteredCards.map((card, cardIdx) => {
                    const Icon = card.icon;
                    const isActive = activeNav.toLowerCase() === card.id.toLowerCase();

                    return (
                      <motion.div
                        key={card.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.22, delay: Math.min(cardIdx * 0.025, 0.2) }}
                        onClick={() => {
                          onNavigate(card.id);
                          setIsOpen(false);
                        }}
                        whileHover={{ y: -4, scale: 1.02, transition: { duration: 0.18 } }}
                        whileTap={{ scale: 0.96 }}
                        className={`group cursor-pointer rounded-2xl p-3 sm:p-4 border transition-all duration-200 flex flex-col justify-between relative bg-white overflow-hidden shadow-2xs hover:shadow-lg ${
                          isActive
                            ? 'border-emerald-600 ring-2 ring-emerald-500/20 shadow-md'
                            : 'border-stone-200/90 hover:border-emerald-400'
                        }`}
                      >
                        {/* هاله نور تعاملی در هاور */}
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

                        <div className="relative z-10 space-y-2 pt-1">
                          <div className="flex items-center justify-between gap-1">
                            <div
                              className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-2xs shrink-0"
                              style={{
                                backgroundColor: `${card.accent}18`,
                                color: card.accent
                              }}
                            >
                              <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>

                            <span
                              className="hidden sm:inline-block text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full border backdrop-blur-md truncate max-w-[110px]"
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
                            <h4 className="text-xs sm:text-sm font-black text-stone-900 group-hover:text-emerald-900 transition-colors line-clamp-2 sm:line-clamp-1 leading-snug">
                              {card.title}
                            </h4>
                            <p className="hidden sm:line-clamp-2 text-[11px] text-stone-600 mt-1 leading-relaxed font-medium">
                              {card.subtext}
                            </p>
                          </div>
                        </div>

                        <div className="relative z-10 pt-2 mt-2 border-t border-stone-100 flex items-center justify-between text-[10px] sm:text-[11px] text-stone-500 font-medium">
                          <span className="text-emerald-700 font-bold truncate">{card.tag}</span>
                          <span className="flex items-center gap-0.5 text-stone-700 group-hover:text-emerald-800 font-extrabold shrink-0">
                            <span>ورود</span>
                            <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* فوتر */}
              <div className="p-3 sm:px-8 bg-[#F5F4ED] border-t border-stone-200 flex items-center justify-between text-xs sm:text-sm text-stone-600 shrink-0">
                <span className="hidden sm:flex items-center gap-2 text-stone-700 font-medium">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>انتخاب هر کارت شما را مستقیم به ماژول مربوطه هدایت می‌کند.</span>
                </span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full sm:w-auto text-stone-700 hover:text-stone-900 bg-stone-200/70 sm:bg-transparent font-bold px-4 py-2.5 sm:py-1.5 rounded-xl hover:bg-stone-200 transition-colors cursor-pointer"
                >
                  بستن منوی خدمات
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
