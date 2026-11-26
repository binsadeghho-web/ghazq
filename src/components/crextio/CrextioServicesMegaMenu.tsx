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
  Wallet,
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
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
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
    }, 320);
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
      accent: '#059669',
      category: 'اداری',
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
      category: 'مشاوره',
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
      category: 'مشاوره',
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
      category: 'آموزش',
    },
    {
      id: 'Research',
      sectionId: 'research',
      title: 'راهبری پژوهش و مقاله (خدمات پژوهشی)',
      subtext: 'پک کامل یا مشورت موردی برای پایان‌نامه و مقاله، اساتید مجرب و اسکان مطالعاتی قم',
      badge: 'خدمات پژوهشی',
      tag: `${toPersianNumbers(researchMentorships?.length || 18)} رساله جاری`,
      icon: BookOpen,
      accent: '#0D9488',
      category: 'آموزش',
    },
    {
      id: 'Rulings',
      sectionId: 'rulings',
      title: 'تالار نقد و مباحثه آراء قضایی',
      subtext: 'نقد موشکافانه احکام توسط قضات تجدیدنظر و دیوان عالی کشور',
      badge: 'مباحثات فقهی',
      tag: `${toPersianNumbers(rulings.length)} رأی نقدشده`,
      icon: Scale,
      accent: '#B45309',
      category: 'قضایی',
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
      category: 'آموزش',
    },
    {
      id: 'Welfare',
      sectionId: 'welfare',
      title: 'تسهیلات رفاهی و اقامتگاه‌ها',
      subtext: 'وام قرض‌الحسنه صندوق رفاه، اقامتگاه مشهد و قم، تعاونی مصرف و تفریحی',
      badge: '۶ خدمت رفاهی',
      tag: 'تسهیلات و اسکان',
      icon: Gift,
      accent: '#DB2777',
      category: 'رفاه',
    },
    {
      id: 'Synergy',
      sectionId: 'synergy',
      title: 'دیوار هم‌افزایی شغلی و تجربیات',
      subtext: 'تبادل مستقیم تجارب اداری، رویه‌های قضایی شعب و استعلامات محلی',
      badge: 'شبکه همکاران',
      tag: 'تبادل آراء',
      icon: Users2,
      accent: '#2563EB',
      category: 'قضایی',
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
      category: 'مدیریت',
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
      category: 'مدیریت',
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
      category: 'مدیریت',
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
      category: 'مدیریت',
    },
  ];

  const customizedCards = applyNavigationCustomization(
    allServiceCards,
    resolvedNav.servicesMenuItems,
    { hideInvisible: true }
  );

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
    { id: 'مدیریت', label: 'مدیریت' },
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
          type="button"
          whileHover={{ y: -1.5, scale: 1.015 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setIsOpen(!isOpen)}
          className={`${
            hideTriggerOnMobile ? 'hidden md:flex' : 'flex'
          } group relative overflow-hidden items-center gap-3 px-4 py-2 sm:px-5 sm:py-2.5 min-h-[44px] rounded-2xl bg-gradient-to-l from-[#071E17] via-[#0D3327] to-[#134636] text-[#FCFCF9] border border-[#F3D078]/45 hover:border-[#F3D078]/85 shadow-[0_10px_26px_-10px_rgba(7,30,23,0.55)] transition-all duration-200 cursor-pointer shrink-0`}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-[#F3D078]/18 to-transparent luxury-sheen"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-l from-transparent via-[#F3D078]/75 to-transparent"
          />

          <div className="relative z-10 w-7 h-7 rounded-xl bg-[#F3D078]/18 border border-[#F3D078]/45 text-[#F3D078] flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
            <LayoutGrid className="w-4 h-4 stroke-[2.2]" />
          </div>

          <div className="relative z-10 flex items-center gap-2 whitespace-nowrap">
            <span className="text-xs sm:text-[13px] font-black text-white tracking-tight">
              {resolvedNav.servicesMenuTitle}
            </span>
            <span aria-hidden="true" className="text-[#F3D078]/50 text-xs">
              ·
            </span>
            <span className="text-[11px] font-black text-[#F3D078] tabular-nums">
              {toPersianNumbers(serviceCards.length)} بخش
            </span>
          </div>

          <ChevronDown
            className={`relative z-10 w-4 h-4 text-[#F3D078]/85 transition-transform duration-200 mr-0.5 shrink-0 ${
              isOpen ? 'rotate-180 text-[#F3D078]' : 'group-hover:translate-y-0.5'
            }`}
          />
        </motion.button>
      )}

      {/* پنجره مگامنو (در موبایل Bottom Sheet تمام‌لمسی و در دسکتاپ مگامنو متمرکز) */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="md:hidden fixed inset-0 bg-stone-950/65 backdrop-blur-xs z-50"
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.975 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.975 }}
              transition={{ type: 'spring', stiffness: 360, damping: 28 }}
              className="fixed inset-x-0 bottom-0 md:bottom-auto md:inset-x-auto md:absolute md:top-full md:left-1/2 md:-translate-x-1/2 md:mt-3 w-full md:w-[min(94vw,1260px)] max-h-[86vh] md:max-h-[84vh] bg-[#FCFCFA] rounded-t-[28px] md:rounded-[32px] border border-[#D8CEB4] shadow-[0_28px_70px_-20px_rgba(7,30,23,0.42)] text-stone-900 z-50 flex flex-col overflow-hidden safe-area-bottom"
              dir="rtl"
            >
              {/* Atmospheric Obsidian-Emerald Top Header (Desktop + Mobile) */}
              <div className="relative overflow-hidden bg-gradient-to-bl from-[#071E17] via-[#0C3025] to-[#134434] text-white border-b border-[#F3D078]/25 shrink-0">
                <div aria-hidden="true" className="pointer-events-none absolute inset-0 luxury-lattice-bg opacity-60" />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 w-44 bg-gradient-to-r from-transparent via-[#F3D078]/12 to-transparent luxury-sheen"
                />

                {/* Mobile Drag Handle */}
                <div className="md:hidden relative z-10 flex justify-center pt-2.5">
                  <div className="w-10 h-1 rounded-full bg-[#F3D078]/50" />
                </div>

                <div className="relative z-10 px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#F3D078] to-[#D6A53D] text-[#071E17] flex items-center justify-center shrink-0 shadow-md border border-[#FFF2C6]/60">
                      <LayoutGrid className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-black text-white truncate">
                          {resolvedNav.servicesMenuTitle}
                        </span>
                        <span aria-hidden="true" className="text-[#F3D078]/45 text-xs">·</span>
                        <span className="text-[11px] font-black text-[#F3D078] tabular-nums shrink-0">
                          {toPersianNumbers(serviceCards.length)} سامانه فعال
                        </span>
                      </div>
                      <p className="hidden sm:block text-[11px] text-emerald-100/80 mt-0.5 truncate">
                        دسترسی سریع به درگاه‌های تخصصی اداری، آموزشی، پژوهشی، قضایی و رفاهی
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white transition-colors cursor-pointer shrink-0"
                    aria-label="بستن منو"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* نوار فیلتر دسته‌ها و جستجو */}
              <div className="p-3 sm:px-6 bg-[#F6F3EA] border-b border-[#E2DAC3] flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3 shrink-0">
                <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-0.5 md:pb-0 scrollbar-none">
                  {categories.map(cat => {
                    const isCatActive = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`relative px-3.5 py-2 sm:py-1.5 min-h-[38px] rounded-xl text-xs font-extrabold transition-colors whitespace-nowrap cursor-pointer shrink-0 ${
                          isCatActive
                            ? 'text-[#F3D078]'
                            : 'bg-[#FCFCF9] text-[#4C5852] hover:text-[#071E17] hover:bg-white border border-[#DFD8C4]'
                        }`}
                      >
                        {isCatActive && (
                          <motion.span
                            layoutId="servicesMenuCategoryPill"
                            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                            className="absolute inset-0 rounded-xl bg-gradient-to-l from-[#071E17] to-[#113D30] shadow-xs border border-[#F3D078]/30"
                          />
                        )}
                        <span className="relative z-10">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* جستجوی سریع */}
                <div className="flex items-center gap-2 bg-[#FCFCF9] border border-[#DFD8C4] rounded-xl px-3.5 py-2 sm:py-1.5 md:max-w-xs w-full focus-within:border-[#071E17] focus-within:ring-2 focus-within:ring-emerald-900/10 transition-all">
                  <Search className="w-3.5 h-3.5 text-[#525E58] shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="جستجوی سریع خدمات..."
                    className="bg-transparent text-xs text-[#071E17] placeholder-stone-400 focus:outline-none w-full"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* بدنه کارت‌های رنگارنگ و زنده */}
              <div className="p-3 sm:p-6 overflow-y-auto flex-1 bg-gradient-to-b from-[#FAF8F2] to-[#F4F0E5]">
                {filteredCards.length === 0 ? (
                  <div className="py-12 text-center space-y-2">
                    <p className="text-sm font-black text-[#071E17]">خدمتی با این عبارت یافت نشد</p>
                    <p className="text-xs text-[#525E58]">عبارت جستجو یا دسته‌بندی را تغییر دهید.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3.5">
                    {filteredCards.map((card, cardIdx) => {
                      const Icon = card.icon;
                      const isActive = activeNav.toLowerCase() === card.id.toLowerCase();
                      const isHovered = hoveredCardId === card.id;

                      return (
                        <motion.div
                          key={card.id}
                          initial={{ opacity: 0, y: 12, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{
                            type: 'spring',
                            stiffness: 340,
                            damping: 26,
                            delay: Math.min(cardIdx * 0.025, 0.22),
                          }}
                          whileHover={{ y: -4, transition: { type: 'spring', stiffness: 380, damping: 24 } }}
                          whileTap={{ scale: 0.97 }}
                          onMouseEnter={() => setHoveredCardId(card.id)}
                          onMouseLeave={() => setHoveredCardId(null)}
                          onClick={() => {
                            onNavigate(card.id);
                            setIsOpen(false);
                          }}
                          className={`group cursor-pointer rounded-2xl p-3.5 sm:p-4 border transition-all duration-200 flex flex-col justify-between relative bg-white/95 overflow-hidden ${
                            isActive
                              ? 'border-[#071E17] ring-2 ring-[#071E17]/15 shadow-md'
                              : 'border-[#E2DAC3] hover:border-stone-400/60 hover:shadow-[0_16px_34px_-18px_rgba(7,30,23,0.22)]'
                          }`}
                        >
                          {/* Dynamic Corner Color Wash */}
                          <div
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-0 transition-opacity duration-300"
                            style={{
                              opacity: isActive || isHovered ? 1 : 0.45,
                              background: `radial-gradient(180px circle at 100% 0%, ${card.accent}1A, transparent 70%)`,
                            }}
                          />

                          {/* Luminous Top Edge Beam */}
                          <span
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-x-6 top-0 h-[2px] transition-opacity duration-300"
                            style={{
                              opacity: isActive || isHovered ? 0.95 : 0,
                              background: `linear-gradient(to left, transparent, ${card.accent}, transparent)`,
                            }}
                          />

                          <div className="relative z-10 space-y-2.5">
                            <div className="flex items-center justify-between gap-2">
                              <div
                                className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center transition-all duration-300 shrink-0 border group-hover:scale-110 group-hover:-rotate-3"
                                style={{
                                  backgroundColor: isActive || isHovered ? card.accent : `${card.accent}14`,
                                  color: isActive || isHovered ? '#FFFFFF' : card.accent,
                                  borderColor: isActive || isHovered ? card.accent : `${card.accent}35`,
                                  boxShadow: isHovered ? `0 8px 18px -6px ${card.accent}66` : undefined,
                                }}
                              >
                                <Icon className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                              </div>

                              <span
                                className="hidden sm:inline-block text-[10px] font-black truncate max-w-[125px]"
                                style={{ color: card.accent }}
                              >
                                {card.badge}
                              </span>
                            </div>

                            <div>
                              <h4 className="text-xs sm:text-sm font-black text-[#071E17] leading-snug line-clamp-2 sm:line-clamp-1">
                                {card.title}
                              </h4>
                              <p className="hidden sm:line-clamp-2 text-[11px] text-[#525E58] mt-1 leading-relaxed font-medium">
                                {card.subtext}
                              </p>
                            </div>
                          </div>

                          <div className="relative z-10 pt-2.5 mt-3 border-t border-[#ECE6D6] flex items-center justify-between text-[10px] sm:text-[11px] font-medium">
                            <span className="text-[#0C4A38] font-bold truncate tabular-nums">{card.tag}</span>
                            <span className="flex items-center gap-1 text-[#071E17] font-black shrink-0">
                              <span>ورود</span>
                              <ArrowLeft className="w-3 h-3 transition-transform duration-200 group-hover:-translate-x-1.5" />
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* فوتر */}
              <div className="p-3 sm:px-8 bg-[#F6F3EA] border-t border-[#E2DAC3] flex items-center justify-between text-xs sm:text-sm text-[#525E58] shrink-0">
                <span className="hidden sm:flex items-center gap-2 text-[#071E17] font-semibold">
                  <Sparkles className="w-4 h-4 text-[#B88928]" />
                  <span>انتخاب هر کارت شما را مستقیم به ماژول مربوطه هدایت می‌کند.</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-full sm:w-auto text-[#071E17] bg-[#E8E2D0]/70 sm:bg-transparent font-bold px-4 py-2.5 sm:py-1.5 rounded-xl hover:bg-[#E8E2D0] transition-colors cursor-pointer whitespace-nowrap"
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
