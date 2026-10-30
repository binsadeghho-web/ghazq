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
import { ThemeCustomizerModal } from '../admin/ThemeCustomizerModal';

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
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`relative overflow-hidden transition-all duration-300 ${className}`}
    >
      {/* Dynamic Cursor Light Halo on Card */}
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(320px circle at ${mousePos.x}px ${mousePos.y}px, ${glowColor}, transparent 75%)`,
        }}
      />
      {/* Dynamic Specular Border Shine */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          border: '1px solid transparent',
          backgroundImage: `radial-gradient(220px circle at ${mousePos.x}px ${mousePos.y}px, rgba(245, 158, 11, 0.4), transparent 75%)`,
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
  const [quickServiceSuccess, setQuickServiceSuccess] = useState<string | null>(null);

  const isAlumni = currentUser?.role === 'alumni';
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'supervisor';

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

      {/* SECTION 1: HERO VIP BANNER WITH DYNAMIC LUMINOUS AURORA */}
      {crextioConfig.showHeroBanner && (
        <CrextioCard
          glowColor="rgba(16, 185, 129, 0.22)"
          className="rounded-[40px] p-6 sm:p-9 border border-[#E3E0D3] bg-[#FCFCF9]/95 backdrop-blur-2xl shadow-xl"
        >
          {/* Animated Atmospheric Background Mesh */}
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-40">
            <motion.div 
              animate={{ 
                scale: [1, 1.25, 1],
                x: [0, 40, 0],
                y: [0, -30, 0]
              }}
              transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-24 -right-24 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-emerald-400/30 via-amber-300/20 to-teal-400/30 blur-3xl"
            />
            <motion.div 
              animate={{ 
                scale: [1.15, 1, 1.15],
                x: [0, -45, 0],
                y: [0, 35, 0]
              }}
              transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -bottom-24 -left-24 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-amber-300/25 via-emerald-400/20 to-teal-400/25 blur-3xl"
            />
          </div>

          <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-8">
            <div className="space-y-4 max-w-2xl">
              {/* VIP Member Tags & Status */}
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-emerald-800 to-teal-900 text-white text-xs font-black shadow-md flex items-center gap-2 border border-emerald-600/40">
                  <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
                  {isAlumni ? 'جامعه نخبگانی دانش‌آموختگان فقه و قضا' : 'درگاه مدیریت و کارتابل خدمات'}
                </span>

                <span className="px-3.5 py-1.5 rounded-full bg-amber-500/15 text-amber-900 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
                  عضویت رسمی · {toPersianNumbers('۱,۰۴۲')} عضو فعال
                </span>

                <span className="px-3.5 py-1.5 rounded-full bg-white/90 text-stone-700 border border-stone-200 text-xs font-bold">
                  دوره فارغ‌التحصیلی: {toPersianNumbers(currentUser?.graduationYear || '۱۳۹۵')}
                </span>
              </div>

              {/* Title & Greeting */}
              <div>
                <h1 className="text-2xl sm:text-4xl font-black text-stone-900 leading-snug tracking-tight">
                  {crextioConfig.heroTitle || `خوش آمدید، ${currentUser ? currentUser.fullName : 'جناب آقای دکتر میرزایی'}`}
                </h1>
                <p className="text-xs sm:text-sm text-stone-600 mt-2 leading-relaxed font-medium">
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
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-emerald-50 text-stone-800 hover:text-emerald-950 border border-stone-200/90 text-xs font-bold transition-all shadow-xs active:scale-95"
                  >
                    <btn.icon className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{btn.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Live KPI Cards with Shimmer Borders */}
            {crextioConfig.showKpiRow && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 xl:gap-4 shrink-0">
                {[
                  { 
                    label: isAlumni ? 'پرونده‌های فعال من' : 'کل دانش‌آموختگان', 
                    val: isAlumni ? myCartableRequests.length : 1042, 
                    icon: Users, 
                    color: 'text-emerald-800 bg-emerald-100', 
                    trend: '+۸٪ این ماه' 
                  },
                  { 
                    label: 'دوره‌های اختصاصی', 
                    val: courses.length, 
                    icon: GraduationCap, 
                    color: 'text-teal-800 bg-teal-100', 
                    trend: '۴ وبینار زنده' 
                  },
                  { 
                    label: 'آراء در تالار نقد', 
                    val: rulings.length, 
                    icon: Scale, 
                    color: 'text-amber-800 bg-amber-100', 
                    trend: '۱۲ مباحثه فقهی' 
                  },
                  { 
                    label: 'کتاب‌ها و رسائل', 
                    val: products.length || 18, 
                    icon: BookOpen, 
                    color: 'text-emerald-900 bg-emerald-100', 
                    trend: '۳ اثر جدید' 
                  }
                ].map((stat, i) => (
                  <CrextioCard
                    key={i}
                    glowColor="rgba(245, 158, 11, 0.25)"
                    className="bg-white/95 backdrop-blur-xl p-4 sm:p-5 rounded-3xl border border-[#E7E4D8] shadow-md flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-bold text-stone-500">{stat.label}</span>
                      <div className={`p-2.5 rounded-2xl ${stat.color} shadow-xs`}>
                        <stat.icon className="w-4 h-4" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight block">
                        {toPersianNumbers(stat.val)}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block">
                        {stat.trend}
                      </span>
                    </div>
                  </CrextioCard>
                ))}
              </div>
            )}
          </div>
        </CrextioCard>
      )}

      {/* SECTION 2: FEATURED SERVICE SHOWCASE (CAROUSEL / GRID / COMPACT) */}
      {crextioConfig.showCourseShowcase && (
        <CourseShowcase
          courses={courses}
          mode={crextioConfig.courseShowcaseMode || 'carousel'}
          onSelectCourse={() => onNavigateTab && onNavigateTab('Courses')}
        />
      )}

      {/* SECTION 3: MAIN 4-COLUMN RICH GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-start">
        
        {/* COLUMN 1: USER PROFILE & OPERATIONAL SCORE */}
        {(crextioConfig.showProfileCard || crextioConfig.showPerformanceCard) && (
          <div className="space-y-6">
            {/* Profile Card with Luxury Insignia */}
            {crextioConfig.showProfileCard && (
              <CrextioCard
                glowColor="rgba(16, 185, 129, 0.3)"
                className="relative h-[360px] w-full rounded-[38px] overflow-hidden shadow-xl border border-emerald-800/30 group"
              >
                <img 
                  src={isAlumni 
                    ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=700&q=80" 
                    : "https://images.unsplash.com/photo-1576722108740-4573177651a3?auto=format&fit=crop&w=700&q=80"
                  } 
                  alt="user profile" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                />
                
                {/* Luminous Inner Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A1A14] via-[#0A1A14]/60 to-transparent flex items-end p-6 text-white">
                  <div className="w-full space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                          <span className="text-[11px] font-bold text-amber-300">عضو سطح طلایی قضایی</span>
                        </div>
                        <h3 className="text-xl font-black text-white">{currentUser?.fullName}</h3>
                        <p className="text-emerald-300 text-xs font-semibold">{currentUser?.roleTitle}</p>
                      </div>

                      <span className="px-3.5 py-1.5 rounded-full bg-emerald-500/30 border border-emerald-400/50 text-emerald-200 text-xs font-black backdrop-blur-md shadow-md">
                        {isAlumni ? 'دانش‌آموخته' : 'مسئول خدمات'}
                      </span>
                    </div>

                    <div className="pt-2.5 border-t border-white/15 flex items-center justify-between text-xs text-emerald-100 font-medium">
                      <span>سازمان: {currentUser?.organization}</span>
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> احراز هویت شده
                      </span>
                    </div>
                  </div>
                </div>
              </CrextioCard>
            )}

            {/* Operational Progress & Judicial Career Score */}
            {crextioConfig.showPerformanceCard && (
              <CrextioCard
                glowColor="rgba(245, 158, 11, 0.2)"
                className="bg-[#FCFCF9]/95 p-6 rounded-[38px] border border-[#E3E0D3] shadow-lg space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-sm text-stone-900 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-700" />
                    وضعیت پرونده و پایه قضایی
                  </h4>
                  <span className="text-xs font-black text-emerald-950 bg-emerald-200/90 px-3 py-1 rounded-full border border-emerald-300">
                    پایه {toPersianNumbers(currentUser?.judicialGrade || (isAlumni ? 9 : 11))} قضایی
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-stone-600 font-bold">
                    <span>امتیاز پژوهشی و سوابق علمی</span>
                    <span className="text-emerald-800">{toPersianNumbers(isAlumni ? 75 : 90)}٪</span>
                  </div>
                  <div className="w-full h-3 bg-stone-200/80 rounded-full overflow-hidden p-0.5 border border-stone-300/60 shadow-inner">
                    <div className="h-full bg-gradient-to-r from-emerald-600 via-teal-500 to-amber-500 rounded-full w-[75%]" />
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-200/80 flex items-center justify-between text-xs text-stone-600 font-medium">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    شماره پرسنلی:
                  </span>
                  <span className="font-bold text-emerald-900 bg-emerald-100/90 px-3 py-0.5 rounded-full font-mono">
                    {toPersianNumbers(currentUser?.personnelId || '۹۹۴۰۱۲')}
                  </span>
                </div>
              </CrextioCard>
            )}
          </div>
        )}

        {/* COLUMN 2: PUBLICATIONS SHOWCASE & CARTABLE REQUESTS */}
        <div className={`${(crextioConfig.showProfileCard || crextioConfig.showPerformanceCard) ? 'xl:col-span-2' : 'xl:col-span-3'} space-y-6`}>
          {/* Publications Showcase Gallery */}
          {crextioConfig.showPublicationsGallery && (
            <CrextioCard
              glowColor="rgba(16, 185, 129, 0.18)"
              className="bg-[#FCFCF9]/95 p-6 sm:p-7 rounded-[38px] border border-[#E3E0D3] shadow-lg space-y-5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-base text-stone-900 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-emerald-700" />
                    ویترین آثار و درس‌گفتارهای خارج فقه و قضا
                  </h3>
                  <p className="text-xs text-stone-500 mt-1">جدیدترین موسوعه‌ها، کتب تخصصی و درس‌گفتارهای فقه القضا ویژه اعضا</p>
                </div>
                {onNavigateTab && (
                  <button 
                    onClick={() => onNavigateTab('Products')}
                    className="text-xs font-black text-emerald-800 hover:text-emerald-950 flex items-center gap-1 hover:underline"
                  >
                    مشاهده کل آثار <ChevronLeft className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Publications Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {products.slice(0, 2).map(prod => (
                  <div 
                    key={prod.id} 
                    className="bg-white/90 hover:bg-emerald-50/50 border border-stone-200/90 hover:border-emerald-300 p-4 rounded-3xl transition-all shadow-xs flex flex-col justify-between space-y-3 group"
                  >
                    <div className="flex gap-3.5">
                      <div className="w-13 h-15 rounded-2xl bg-gradient-to-br from-emerald-800 to-teal-950 text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                        <BookMarked className="w-6 h-6 text-amber-300" />
                      </div>
                      <div className="space-y-1 min-w-0 flex-1">
                        <h4 className="font-bold text-sm text-stone-900 truncate">{prod.title}</h4>
                        <p className="text-xs text-stone-600 font-medium truncate">{prod.authorOrPresenter}</p>
                        <span className="inline-block text-[11px] font-bold text-emerald-900 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                          {prod.formatTitle}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-stone-200/80 flex items-center justify-between text-xs">
                      <span className="font-black text-stone-900">
                        {prod.price > 0 ? `${toPersianNumbers(prod.price.toLocaleString('fa-IR'))} تومان` : 'رایگان ویژه اعضا'}
                      </span>
                      <button 
                        onClick={() => onNavigateTab && onNavigateTab('Products')}
                        className="px-3.5 py-1.5 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold transition-all shadow-xs active:scale-95 flex items-center gap-1"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>دریافت اثر</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </CrextioCard>
          )}

          {/* Pending Cartable Requests Showcase */}
          {crextioConfig.showCartableSnippet && (
            <CrextioCard
              glowColor="rgba(245, 158, 11, 0.18)"
              className="bg-[#FCFCF9]/95 p-6 sm:p-7 rounded-[38px] border border-[#E3E0D3] shadow-lg space-y-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-black text-base text-stone-900 flex items-center gap-2">
                    <Inbox className="w-5 h-5 text-emerald-700" />
                    {isAlumni ? 'کارتابل درخواست‌های اداری و آموزشی من' : 'کارتابل درخواست‌های اعضا و استعلامات'}
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">وضعیت پرونده‌های حقوقی، صدور احکام و گواهی‌های ثبت‌شده</p>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1.5 bg-stone-200/70 p-1 rounded-full text-xs self-start sm:self-auto">
                  <button 
                    onClick={() => setSelectedFilter('all')}
                    className={`px-3 py-1 rounded-full font-bold transition-all ${
                      selectedFilter === 'all' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    همه ({toPersianNumbers(filteredCartable.length)})
                  </button>
                  <button 
                    onClick={() => setSelectedFilter('pending')}
                    className={`px-3 py-1 rounded-full font-bold transition-all ${
                      selectedFilter === 'pending' ? 'bg-white text-amber-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    در جریان
                  </button>
                  <button 
                    onClick={() => setSelectedFilter('completed')}
                    className={`px-3 py-1 rounded-full font-bold transition-all ${
                      selectedFilter === 'completed' ? 'bg-white text-emerald-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    تکمیل‌شده
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {filteredCartable.slice(0, 4).map(req => (
                  <div 
                    key={req.id} 
                    className="p-4 bg-white/90 hover:bg-emerald-50/60 border border-stone-200/90 rounded-3xl transition-all space-y-2.5 shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[11px] font-black text-emerald-900 bg-emerald-100 px-2.5 py-0.5 rounded-full font-mono">
                        کد: #{toPersianNumbers(req.trackingNumber)}
                      </span>
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        req.status === 'completed' 
                          ? 'bg-emerald-100 text-emerald-900' 
                          : req.status === 'in_progress'
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-stone-200 text-stone-800'
                      }`}>
                        {req.status === 'completed' ? 'تکمیل‌شده' : req.status === 'in_progress' ? 'در حال بررسی' : 'ثبت‌شده'}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-stone-900 line-clamp-1">{req.title}</h4>
                    
                    <div className="flex items-center justify-between text-xs text-stone-500 pt-1.5 border-t border-stone-200/70 font-medium">
                      <span>متقاضی: {req.applicantName}</span>
                      <button 
                        onClick={() => onNavigateTab && onNavigateTab('People')}
                        className="text-emerald-800 hover:underline font-bold flex items-center gap-0.5"
                      >
                        مشاهده جزئیات <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </CrextioCard>
          )}
        </div>

        {/* COLUMN 3: QUICK ACTIONS MATRIX & COURT RULINGS */}
        {(crextioConfig.showQuickActions || crextioConfig.showRulingsSnippet) && (
          <div className="space-y-6">
            {/* Quick Action Matrix Card with Sleek Dark Emerald Glass */}
            {crextioConfig.showQuickActions && (
              <CrextioCard
                glowColor="rgba(52, 211, 153, 0.35)"
                className="bg-gradient-to-br from-[#122A22] via-[#0D1F19] to-[#0A1713] text-white rounded-[38px] p-6 shadow-2xl space-y-5 border border-emerald-500/30"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-300" />
                    دسترسی سریع و خدمات ۱۰۰۰ عضو
                  </h3>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[
                    ...(currentUser?.role === 'admin' || currentUser?.role === 'supervisor' ? [
                      { label: 'دانش‌آموختگان', icon: GraduationCap, tab: 'Alumni' },
                      { label: 'کاربران', icon: Users, tab: 'Users' },
                      { label: 'مدیریت', icon: ShieldCheck, tab: 'Admin' },
                    ] : []),
                    { label: 'کارتابل', icon: FileCheck, tab: 'People' },
                    { label: 'آموزش', icon: BookOpen, tab: 'Courses' },
                    { label: 'آراء قضایی', icon: Scale, tab: 'Rulings' },
                    { label: 'مشاوره', icon: Laptop, tab: 'Counseling' },
                    { label: 'رفاهیات', icon: Gift, tab: 'Welfare' },
                    { label: 'هم‌افزایی', icon: HeartHandshake, tab: 'Synergy' }
                  ].map((act, i) => (
                    <motion.button 
                      key={i} 
                      whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.18)" }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onNavigateTab && onNavigateTab(act.tab)}
                      className="flex flex-col items-center gap-2 bg-white/10 rounded-2xl p-3.5 border border-white/15 text-white hover:border-emerald-400/60 transition-all text-center group"
                    >
                      <act.icon className="w-5 h-5 text-emerald-300 group-hover:scale-110 transition-transform" />
                      <span className="text-[11px] font-black">{act.label}</span>
                    </motion.button>
                  ))}
                </div>
              </CrextioCard>
            )}

            {/* Court Rulings Showcase Snippet */}
            {crextioConfig.showRulingsSnippet && (
              <CrextioCard
                glowColor="rgba(245, 158, 11, 0.2)"
                className="bg-[#FCFCF9]/95 p-6 rounded-[38px] border border-[#E3E0D3] shadow-lg space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-sm text-stone-900 flex items-center gap-2">
                    <Scale className="w-4 h-4 text-emerald-700" />
                    آخرین آراء صادره در تالار نقد
                  </h4>
                  {onNavigateTab && (
                    <button 
                      onClick={() => onNavigateTab('Rulings')}
                      className="text-xs text-emerald-800 font-bold hover:underline"
                    >
                      تالار آراء
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {rulings.slice(0, 3).map(r => (
                    <div key={r.id} className="p-3.5 rounded-2xl bg-white hover:bg-emerald-50/60 border border-stone-200/90 flex items-start gap-2.5 text-xs transition-colors shadow-2xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                      <div className="space-y-1 min-w-0 flex-1">
                        <p className="font-bold text-stone-900 truncate">{r.title}</p>
                        <div className="flex items-center justify-between text-[11px] text-stone-500 font-medium">
                          <span>{r.courtBranch}</span>
                          <span className="text-emerald-800 font-bold">
                            {toPersianNumbers(r.discussions?.length || 0)} نقد حقوقی
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CrextioCard>
            )}
          </div>
        )}

      </div>

      {/* ADMIN LIVE CUSTOMIZER MODAL */}
      <ThemeCustomizerModal
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
      />
    </motion.div>
  );
};
