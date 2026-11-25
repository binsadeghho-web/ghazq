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
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`${
          hideTriggerOnMobile ? 'hidden md:flex' : 'flex'
        } group relative items-center gap-3 px-4 py-2 sm:px-5 sm:py-2.5 min-h-[42px] rounded-2xl bg-[#071E17] hover:bg-[#0B2D22] text-[#FCFCF9] border border-[#F3D078]/35 hover:border-[#F3D078]/65 shadow-[0_8px_22px_-10px_rgba(7,30,23,0.45)] transition-all duration-200 cursor-pointer shrink-0 active:scale-[0.98]`}
      >
        <div className="w-7 h-7 rounded-xl bg-[#F3D078]/15 border border-[#F3D078]/35 text-[#F3D078] flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105">
          <LayoutGrid className="w-4 h-4 stroke-[2.2]" />
        </div>

        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="text-xs sm:text-[13px] font-black text-white tracking-tight">
            {resolvedNav.servicesMenuTitle}
          </span>
          <span aria-hidden="true" className="text-[#F3D078]/45 text-xs">
            ·
          </span>
          <span className="text-[11px] font-bold text-[#F3D078] tabular-nums">
            {toPersianNumbers(serviceCards.length)} بخش
          </span>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-[#F3D078]/80 transition-transform duration-200 mr-0.5 shrink-0 ${
            isOpen ? 'rotate-180 text-[#F3D078]' : 'group-hover:translate-y-0.5'
          }`}
        />
      </button>
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
              <div className="p-3 sm:px-6 bg-[#F6F3EA] border-b border-[#E2DAC3] flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3 shrink-0">
                <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-0.5 md:pb-0 scrollbar-none">
                  {categories.map(cat => {
                    const isCatActive = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`relative px-3.5 py-2 sm:py-1.5 min-h-[38px] rounded-xl text-xs font-extrabold transition-colors whitespace-nowrap cursor-pointer shrink-0 ${
                          isCatActive
                            ? 'text-[#F3D078]'
                            : 'bg-[#FCFCF9] text-[#525E58] hover:text-[#071E17] hover:bg-white border border-[#DFD8C4]'
                        }`}
                      >
                        {isCatActive && (
                          <motion.span
                            layoutId="servicesMenuCategoryPill"
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            className="absolute inset-0 rounded-xl bg-[#071E17] shadow-xs"
                          />
                        )}
                        <span className="relative z-10">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* جستجوی سریع */}
                <div className="flex items-center gap-2 bg-[#FCFCF9] border border-[#DFD8C4] rounded-xl px-3.5 py-2 sm:py-1.5 md:max-w-xs w-full focus-within:border-[#071E17]">
                  <Search className="w-3.5 h-3.5 text-[#525E58] shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="جستجوی سریع خدمات..."
                    className="bg-transparent text-xs text-[#071E17] placeholder-stone-400 focus:outline-none w-full"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="text-stone-400 hover:text-stone-700 p-1">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* بدنه ۲ ستونی موبایل و ۴ ستونی دسکتاپ کارت‌ها */}
              <div className="p-3 sm:p-6 overflow-y-auto flex-1 bg-[#FAF8F2]">
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
                        whileHover={{ y: -3, transition: { duration: 0.18 } }}
                        whileTap={{ scale: 0.97 }}
                        className={`group cursor-pointer rounded-2xl p-3.5 sm:p-4 border transition-all duration-200 flex flex-col justify-between relative bg-[#FCFCF9] overflow-hidden ${
                          isActive
                            ? 'border-[#071E17] ring-1 ring-[#071E17]/25 shadow-sm'
                            : 'border-[#E2DAC3] hover:border-[#071E17]/40 hover:bg-white hover:shadow-[0_10px_24px_-16px_rgba(7,30,23,0.18)]'
                        }`}
                      >
                        <div className="relative z-10 space-y-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <div
                              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-colors shrink-0 border ${
                                isActive
                                  ? 'bg-[#071E17] text-[#F3D078] border-[#071E17]'
                                  : 'bg-[#F5F2E8] text-[#071E17] border-[#DFD8C4] group-hover:bg-[#071E17] group-hover:text-[#F3D078]'
                              }`}
                            >
                              <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>

                            <span className="hidden sm:inline-block text-[10px] font-extrabold text-[#6B5A2B] truncate max-w-[120px]">
                              {card.badge}
                            </span>
                          </div>

                          <div>
                            <h4 className="text-xs sm:text-sm font-black text-[#071E17] transition-colors line-clamp-2 sm:line-clamp-1 leading-snug">
                              {card.title}
                            </h4>
                            <p className="hidden sm:line-clamp-2 text-[11px] text-[#525E58] mt-1 leading-relaxed font-medium">
                              {card.subtext}
                            </p>
                          </div>
                        </div>

                        <div className="relative z-10 pt-2.5 mt-3 border-t border-[#ECE6D6] flex items-center justify-between text-[10px] sm:text-[11px] font-medium">
                          <span className="text-[#0C4A38] font-bold truncate tabular-nums">{card.tag}</span>
                          <span className="flex items-center gap-1 text-[#071E17] font-extrabold shrink-0">
                            <span>ورود</span>
                            <ArrowLeft className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" />
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* فوتر */}
              <div className="p-3 sm:px-8 bg-[#F6F3EA] border-t border-[#E2DAC3] flex items-center justify-between text-xs sm:text-sm text-[#525E58] shrink-0">
                <span className="hidden sm:flex items-center gap-2 text-[#071E17] font-semibold">
                  <Sparkles className="w-4 h-4 text-[#B88928]" />
                  <span>انتخاب هر کارت شما را مستقیم به ماژول مربوطه هدایت می‌کند.</span>
                </span>
                <button
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
