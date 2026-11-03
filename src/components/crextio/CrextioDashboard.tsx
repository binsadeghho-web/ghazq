import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { toPersianNumbers } from '../../utils/persianNumbers';
import {
  Users,
  Briefcase,
  Award,
  BookMarked,
  FileCheck,
  Inbox,
  AlertCircle,
  TrendingUp,
  Clock,
  CheckCircle2,
  Sparkles,
  BookOpen,
  Scale,
  ShieldCheck,
  ArrowUpRight,
  HeartHandshake,
  Search,
  ChevronLeft,
  Laptop,
  Gift,
  GraduationCap,
  Sliders,
  Palette,
  ExternalLink,
  Flame,
  Star,
  Activity,
  Send,
  Download,
  FileText
} from 'lucide-react';
import { CourseShowcase } from './CourseShowcase';
import { CrextioServicesBento } from './CrextioServicesBento';
import { CounselingPromoShowcase } from './CounselingPromoShowcase';
import { BooksAndPublicationsShowcase } from './BooksAndPublicationsShowcase';
import { WelfareAndLoansShowcase } from './WelfareAndLoansShowcase';
import { MultimediaAndCoursesShowcase } from './MultimediaAndCoursesShowcase';
import { CrextioHeroStatsCustomizerModal } from './CrextioHeroStatsCustomizerModal';
import { ThemeCustomizerModal } from '../admin/ThemeCustomizerModal';
import { AnimatedCounter } from '../common/AnimatedCounter';
import { DEFAULT_HERO_STATS } from '../../data/mockData';

interface CrextioDashboardProps {
  onNavigateTab?: (tab: string) => void;
}

// Reusable micro-component for interactive card mouse halo
const CrextioCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  onClick?: () => void;
}> = ({ children, className = '', glowColor = 'rgba(16, 185, 129, 0.16)', onClick }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      whileHover={{ y: -4, scale: 1.02, transition: { duration: 0.2 } }}
      className={`relative overflow-hidden transition-all duration-300 hover:z-30 hover:shadow-xl ${className}`}
    >
      {/* Dynamic Cursor Light Halo on Card (compact & refined 160px) */}
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(160px circle at ${mousePos.x}px ${mousePos.y}px, ${glowColor}, transparent 75%)`,
        }}
      />
      {/* Dynamic Specular Border Shine */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          border: '1px solid transparent',
          backgroundImage: `radial-gradient(130px circle at ${mousePos.x}px ${mousePos.y}px, rgba(245, 158, 11, 0.4), transparent 75%)`,
          maskImage: 'linear-gradient(black, black)',
          WebkitMaskImage: 'linear-gradient(black, black)',
          maskComposite: 'exclude',
          WebkitMaskComposite: 'xor',
        }}
      />
      <div className="relative z-10 w-full h-full">{children}</div>
    </motion.div>
  );
};

export const CrextioDashboard: React.FC<CrextioDashboardProps> = ({ onNavigateTab }) => {
  const {
    currentUser,
    courses,
    cartableRequests,
    rulings,
    products,
    crextioConfig,
    synergyPosts
  } = useApp();
  
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [isHeroStatsModalOpen, setIsHeroStatsModalOpen] = useState(false);
  const [quickServiceSuccess, setQuickServiceSuccess] = useState<string | null>(null);

  const isAlumni = currentUser?.role === 'alumni';
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'supervisor';

  const heroStats = (crextioConfig.heroStatsConfig || DEFAULT_HERO_STATS).filter(s => s.isVisible !== false);

  const getStatIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'users': return Users;
      case 'graduation': return GraduationCap;
      case 'scale': return Scale;
      case 'book': return BookOpen;
      case 'award': return Award;
      case 'activity': return Activity;
      case 'gift': return Gift;
      case 'shield': return ShieldCheck;
      default: return Sparkles;
    }
  };

  const myCartableRequests = isAlumni 
    ? cartableRequests.filter(r => r.applicantId === currentUser?.id || r.applicantName.includes(currentUser?.fullName || ''))
    : cartableRequests;

  const filteredCartable = myCartableRequests.filter(req => {
    if (selectedFilter === 'pending') return req.status === 'in_progress' || req.status === 'pending' || req.status === 'need_info';
    if (selectedFilter === 'completed') return req.status === 'completed';
    return true;
  });

  const handleQuickAction = (actionTitle: string) => {
    setQuickServiceSuccess(`درخواست «${actionTitle}» ثبت و کد رهگیری به شماره همراه شما پیامک شد.`);
    setTimeout(() => setQuickServiceSuccess(null), 4000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="w-full space-y-8 text-stone-900 font-sans"
    >
      {/* QUICK NOTIFICATION TOAST */}
      <AnimatePresence>
        {quickServiceSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-900 text-white px-6 py-3.5 rounded-2xl shadow-2xl border border-emerald-400/40 flex items-center gap-3 backdrop-blur-xl text-xs sm:text-sm font-bold"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
            <span>{quickServiceSuccess}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ADMIN THEME CUSTOMIZER LAUNCHER BAR */}
      {isAdmin && (
        <div className="w-full bg-gradient-to-r from-emerald-950 via-stone-900 to-teal-950 text-white rounded-3xl p-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl border border-emerald-500/30">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <Sliders className="w-5 h-5" />
            </span>
            <div className="text-right">
              <span className="text-sm font-bold text-white block">مرکز ویرایش زنده چیدمان و ظاهر تم ۲ (دانش‌آموختگان)</span>
              <span className="text-xs text-emerald-300/80">شخصی‌سازی ماژول‌ها، نحوه نمایش گالری‌ها، کادرها و رنگ‌بندی برای ۱,۰۰۰ دانش‌آموخته</span>
            </div>
          </div>

          <button
            onClick={() => setIsCustomizerOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-stone-950 text-xs font-black shadow-lg transition-all active:scale-95 shrink-0"
          >
            <Palette className="w-4 h-4" />
            <span>شخصی‌سازی و ویرایش چیدمان</span>
          </button>
        </div>
      )}

      {/* SECTION 1: TOP VIP ROW (HERO BANNER + ALUMNI PROFILE CARD) */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-stretch">
        {/* Alumni Profile Card (Moved to top alongside Hero Banner) */}
        {crextioConfig.showProfileCard && (
          <div className="xl:col-span-1 h-full">
            <CrextioCard
              glowColor="rgba(16, 185, 129, 0.3)"
              className="relative h-full min-h-[280px] w-full rounded-[28px] overflow-hidden shadow-md border border-stone-200/90 group"
            >
              <img 
                src={isAlumni 
                  ? "/assets/cleric_portrait.jpg" 
                  : "https://images.unsplash.com/photo-1576722108740-4573177651a3?auto=format&fit=crop&w=700&q=80"
                } 
                alt="پرتره دانش‌آموخته نخبه حوزوی و قضایی" 
                className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105" 
              />
              
              {/* Luminous Inner Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A1A14] via-[#0A1A14]/60 to-transparent flex items-end p-5 text-white">
                <div className="w-full space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span className="text-[10px] font-bold text-amber-300">عضو طلایی قضایی</span>
                      </div>
                      <h3 className="text-lg font-black text-white">{currentUser?.fullName}</h3>
                      <p className="text-emerald-300 text-xs font-semibold">{currentUser?.roleTitle}</p>
                    </div>

                    <span className="px-3 py-1 rounded-full bg-emerald-500/30 border border-emerald-400/50 text-emerald-200 text-[11px] font-black backdrop-blur-md shadow-xs">
                      {isAlumni ? 'دانش‌آموخته' : 'مسئول خدمات'}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-white/15 flex items-center justify-between text-[11px] text-emerald-100 font-medium">
                    <span>{currentUser?.organization}</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> احراز هویت شده
                    </span>
                  </div>
                </div>
              </div>
            </CrextioCard>
          </div>
        )}

        {/* Hero VIP Banner */}
        {crextioConfig.showHeroBanner && (
          <div className={`${crextioConfig.showProfileCard ? 'xl:col-span-3' : 'xl:col-span-4'} h-full`}>
            <CrextioCard
              glowColor="rgba(16, 185, 129, 0.20)"
              className="h-full rounded-[28px] p-4 sm:p-5 border border-[#E3E0D3] bg-[#FCFCF9]/95 backdrop-blur-2xl shadow-md flex flex-col justify-between"
            >
              {/* Animated Atmospheric Background Mesh */}
              <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-35">
                <motion.div 
                  animate={{ 
                    scale: [1, 1.25, 1],
                    x: [0, 40, 0],
                    y: [0, -30, 0]
                  }}
                  transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute -top-24 -right-24 w-[420px] h-[420px] rounded-full bg-gradient-to-br from-emerald-400/30 via-amber-300/20 to-teal-400/30 blur-3xl"
                />
                <motion.div 
                  animate={{ 
                    scale: [1.15, 1, 1.15],
                    x: [0, -45, 0],
                    y: [0, 35, 0]
                  }}
                  transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute -bottom-24 -left-24 w-[420px] h-[420px] rounded-full bg-gradient-to-tr from-amber-300/25 via-emerald-400/20 to-teal-400/25 blur-3xl"
                />
              </div>

              <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-5">
                <div className="space-y-2.5 max-w-2xl">
                  {/* VIP Member Tags & Status */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-600 text-stone-950 text-[11px] font-black shadow-xs flex items-center gap-1.5 border border-amber-300">
                      <Scale className="w-3.5 h-3.5 text-stone-950 stroke-[2.3]" />
                      <span>طرح میزان · نشان عدالت قضایی</span>
                    </span>

                    <span className="px-3 py-1 rounded-full bg-gradient-to-r from-emerald-800 to-teal-900 text-white text-[11px] font-black shadow-xs flex items-center gap-1.5 border border-emerald-600/40">
                      <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                      {isAlumni ? 'جامعه نخبگانی دانش‌آموختگان فقه و قضا' : 'درگاه مدیریت و کارتابل خدمات'}
                    </span>

                    <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-900 border border-amber-500/30 text-[11px] font-bold flex items-center gap-1.5">
                      <Flame className="w-3 h-3 text-amber-600 fill-amber-600" />
                      عضویت رسمی · {toPersianNumbers('۱,۰۴۲')} عضو فعال
                    </span>

                    <span className="px-3 py-1 rounded-full bg-white/90 text-stone-700 border border-stone-200 text-[11px] font-bold">
                      دوره فارغ‌التحصیلی: {toPersianNumbers(currentUser?.graduationYear || '۱۳۹۵')}
                    </span>
                  </div>

                  {/* Title & Greeting */}
                  <div>
                    <h1 className="text-xl sm:text-2xl xl:text-3xl font-black text-stone-900 leading-snug tracking-tight">
                      {crextioConfig.heroTitle || `خوش آمدید، ${currentUser ? currentUser.fullName : 'جناب آقای دکتر میرزایی'}`}
                    </h1>
                    <p className="text-xs text-stone-600 mt-1.5 leading-relaxed font-medium">
                      {crextioConfig.heroSubtitle || `${currentUser?.organization} · سمت: ${currentUser?.roleTitle} · آماده دریافت درخواست‌های الکترونیک و دوره‌های توانمندسازی قضایی`}
                    </p>
                  </div>

                  {/* VIP Quick Action Micro-buttons */}
                  <div className="pt-2 flex flex-wrap items-center gap-2">
                    {[
                      { label: 'صدور آنی گواهی اشتغال', icon: FileText, action: 'صدور آنی گواهی اشتغال به قضا' },
                      { label: 'استعلام ترفیع و رتبه', icon: Award, action: 'استعلام ارتقاء و پایه قضایی' },
                      { label: 'درخواست تسهیلات رفاهی', icon: Gift, action: 'درخواست تسهیلات اقامتی و زیارتی' },
                    ].map((btn, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleQuickAction(btn.action)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-stone-800 hover:text-emerald-950 border border-stone-200/90 text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
                      >
                        <btn.icon className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{btn.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live KPI Cards */}
                {crextioConfig.showKpiRow && (
                  <div className="flex flex-col gap-2 shrink-0">
                    {isAdmin && (
                      <div className="flex justify-end">
                        <button
                          onClick={() => setIsHeroStatsModalOpen(true)}
                          className="px-2.5 py-1 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-900 border border-amber-500/30 text-[10px] font-black flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                          title="تغییر عناوین، ارقام و مدیریت آمار بنر وی‌آی‌پی"
                        >
                          <Sliders className="w-3 h-3 text-amber-700" />
                          <span>مدیریت آمار بنر</span>
                        </button>
                      </div>
                    )}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
                      {heroStats.map(stat => {
                        const Icon = getStatIconComponent(stat.icon);
                        return (
                          <CrextioCard
                            key={stat.id}
                            glowColor="rgba(245, 158, 11, 0.25)"
                            className="bg-white/95 backdrop-blur-xl p-3.5 sm:p-4 rounded-2xl border border-[#E7E4D8] shadow-2xs flex flex-col items-center justify-center text-center space-y-1.5 group"
                          >
                            <div className={`p-2.5 rounded-xl ${stat.color} shadow-2xs mx-auto group-hover:scale-110 transition-transform`}>
                              <Icon className="w-3.5 h-3.5" />
                            </div>

                            <span className="text-[10px] font-extrabold text-stone-600 line-clamp-1 block text-center">
                              {stat.label}
                            </span>

                            <div className="space-y-0.5 text-center">
                              <span className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight block">
                                <AnimatedCounter value={toPersianNumbers(stat.val.toLocaleString('fa-IR'))} duration={1800} />
                              </span>
                              <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full inline-block">
                                {stat.trend}
                              </span>
                            </div>
                          </CrextioCard>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </CrextioCard>
          </div>
        )}
      </div>

      {/* SECTION 2: EXHIBITION SHOWCASE FOR COUNSELING (2s Infinite Auto-Switch & Image Upload) */}
      <CounselingPromoShowcase
        onNavigateToGeneral={() => onNavigateTab && onNavigateTab('CounselingGeneral')}
        onNavigateToSpecialized={() => onNavigateTab && onNavigateTab('SpecializedCounseling')}
      />

      {/* SECTION 3: BENTO GRID OF 9 CORE SERVICES */}
      <CrextioServicesBento onNavigateTab={(tab) => onNavigateTab && onNavigateTab(tab)} />

      {/* SECTION 4: SHOWCASE 1 - BOOKS & PUBLICATIONS */}
      <BooksAndPublicationsShowcase
        onNavigateToProducts={() => onNavigateTab && onNavigateTab('Products')}
      />

      {/* SECTION 5: SHOWCASE 2 - WELFARE, LOANS & COOPERATIVE */}
      <WelfareAndLoansShowcase
        onNavigateToWelfare={() => onNavigateTab && onNavigateTab('Welfare')}
      />

      {/* SECTION 6: SHOWCASE 3 - MULTIMEDIA & COURSES */}
      <MultimediaAndCoursesShowcase
        onNavigateToCourses={() => onNavigateTab && onNavigateTab('Courses')}
      />

      {/* ADMIN LIVE CUSTOMIZER MODAL */}
      <ThemeCustomizerModal
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
      />

      {/* ADMIN HERO STATS CUSTOMIZER MODAL */}
      <CrextioHeroStatsCustomizerModal
        isOpen={isHeroStatsModalOpen}
        onClose={() => setIsHeroStatsModalOpen(false)}
      />
    </motion.div>
  );
};
