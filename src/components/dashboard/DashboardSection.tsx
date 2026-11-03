import React, { useState, useRef, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { NavTabId } from '../layout/Sidebar';
import { ModernDashboardCard } from '../ModernDashboardCard';
import { toPersianNumbers } from '../../utils/persianNumbers';
import {
  Inbox,
  GraduationCap,
  BookOpen,
  HeartHandshake,
  FileText,
  Scale,
  Gift,
  Users2,
  Users,
  ShieldCheck,
  LayoutDashboard,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers
} from 'lucide-react';

interface DashboardSectionProps {
  onNavigate: (tabId: NavTabId) => void;
}

export const DashboardSection: React.FC<DashboardSectionProps> = ({ onNavigate }) => {
  const {
    currentUser,
    users,
    cartableRequests,
    courses,
    products,
    consultants,
    researchMentorships,
    rulings,
    welfareRequests,
    consumables,
    synergyPosts,
    auditLogs,
  } = useApp();

  const headerRef = useRef<HTMLDivElement>(null);
  const [headerMousePos, setHeaderMousePos] = useState({ x: 0, y: 0 });

  const handleHeaderMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!headerRef.current) return;
    const rect = headerRef.current.getBoundingClientRect();
    setHeaderMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);

  const pendingRequestsCount = cartableRequests.filter(
    r => r.status === 'pending' || r.status === 'need_info'
  ).length;

  const showAdminCard = currentUser?.role === 'admin' || currentUser?.role === 'supervisor';

  return (
    <div className="space-y-6">
      {/* 
        ========================================================================
        باکس بالای داشبورد با طیف رنگی انیمیشنی پویا و تغییرکننده (Aurora Spectrum Header)
        طیف نوری چندلایه با امواج نوری ارگانیک، بلر کریستالی و فیزیک موس
        ========================================================================
      */}
      <div
        ref={headerRef}
        onMouseMove={handleHeaderMouseMove}
        className="relative overflow-hidden rounded-3xl p-6 sm:p-7 border border-slate-200/90 dark:border-white/15 shadow-xl transition-all select-none group"
        style={{
          ['--mouse-x' as string]: `${headerMousePos.x}px`,
          ['--mouse-y' as string]: `${headerMousePos.y}px`,
        }}
      >
        {/* لایه ۱: زمینه اصلی شیشه‌ای مات عمیق */}
        <div className="absolute inset-0 bg-white/75 dark:bg-slate-900/80 backdrop-blur-2xl z-0 transition-colors" />

        {/* 
          لایه ۲: امواج طیف نوری انیمیشنی تغییرکننده (Fluid Aurora Spectrum Waves)
          این گوی‌ها و امواج رنگی پیوسته با چرخش، تغییر اسکیل و پالس نرم جابه‌جا می‌شوند
        */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-80 dark:opacity-90">
          {/* موج رنگی ۱: نیلی و بنفش کهکشانی */}
          <div className="absolute -top-1/4 -right-1/4 w-[500px] h-[350px] rounded-full bg-gradient-to-tr from-indigo-500/35 via-violet-500/30 to-purple-500/25 blur-3xl animate-aurora-slow" />
          
          {/* موج رنگی ۲: فیروزه‌ای و زمردی درخشان */}
          <div className="absolute -bottom-1/3 left-1/4 w-[450px] h-[320px] rounded-full bg-gradient-to-br from-cyan-400/30 via-emerald-400/25 to-teal-500/25 blur-3xl animate-aurora-fast" />

          {/* موج رنگی ۳: کهربایی طلایی و یاقوتی گرم */}
          <div className="absolute top-1/4 -left-1/4 w-[400px] h-[300px] rounded-full bg-gradient-to-r from-amber-400/25 via-rose-500/25 to-pink-500/20 blur-3xl animate-aurora-pulse" />

          {/* نورافکن نوری تعقیب‌کننده نشانگر موس روی طیف نوری با حجم جمع‌وجور و دقیق */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            style={{
              background: `radial-gradient(160px circle at var(--mouse-x, 0px) var(--mouse-y, 0px), rgba(255, 255, 255, 0.35), transparent 75%)`,
            }}
          />
        </div>

        {/* لایه ۳: خط مویی بازتابی لبه سقف با برق کریستالی (Specular Hairline) */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/90 dark:via-white/30 to-transparent pointer-events-none z-10" />

        {/* لایه ۴: گرید محتوای متن و اکشن‌های سربرگ */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="relative p-2.5 rounded-2xl bg-gradient-to-br from-indigo-500/20 via-purple-500/15 to-amber-500/20 border border-white/40 dark:border-white/20 text-indigo-600 dark:text-amber-400 shadow-md backdrop-blur-md">
                <LayoutDashboard className="w-6 h-6" />
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    داشبورد خدمات جامع دانش‌آموختگان فقه و قضا
                  </h1>
                  <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                    <Sparkles className="w-3 h-3" />
                    <span>نسخه پیشرفته ۳.۰</span>
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed max-w-2xl font-normal">
                  پرتال یکپارچه خدمات الکترونیک اداری، آموزش‌های تخصصی، مشاوره روان‌شناختی، راهبری پژوهش و تسهیلات رفاهی
                </p>
              </div>
            </div>
          </div>

          {/* نشانگرهای وضعیت زنده و تقویم رسمی */}
          <div className="flex items-center gap-3 shrink-0 flex-wrap text-xs">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/50 dark:bg-slate-800/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 text-emerald-600 dark:text-emerald-400 font-semibold shadow-xs">
              <CheckCircle2 className="w-4 h-4" />
              <span>سامانه برخط و متصل</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/50 dark:bg-slate-800/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-300 font-medium shadow-xs">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span className="tabular-nums">۸ آبان ۱۴۰۳</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 backdrop-blur-md border border-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-bold">
              <Layers className="w-3.5 h-3.5" />
              <span>۸ درگاه تخصصی</span>
            </div>
          </div>
        </div>
      </div>

      {/* 
        شبکه واکنش‌گرای کارت‌های مدرن بخش‌های اصلی
        Grid Breakpoints:
        - Mobile: 1 column
        - Tablet (sm/md): 2 columns
        - Desktop (lg): 3 columns
        - Ultra-wide (xl): 4 columns
      */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
        
        {/* ۱. خدمات اداری و آموزشی (کارتابل) */}
        <ModernDashboardCard
          title="خدمات اداری و آموزشی"
          accent="indigo"
          icon={<Inbox className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />}
          subValue="پیگیری مطالبات اداری، ارتقای رتبه، صدور گواهی‌ها و تبادل اسناد رسمی"
          trendContext={pendingRequestsCount > 0 ? `${pendingRequestsCount} درخواست در انتظار پاسخ مسئول` : 'کارتابل آماده و پاسخ‌گویی برخط'}
          badgeText="پرتال اداری"
          notificationCount={pendingRequestsCount}
          hasNotification={pendingRequestsCount > 0}
          onClick={() => onNavigate('cartable')}
        />

        {/* ۲. دوره‌های تخصصی و کارگاه‌ها */}
        <ModernDashboardCard
          title="دوره‌های تخصصی"
          accent="violet"
          icon={<GraduationCap className="w-6 h-6 text-violet-600 dark:text-violet-400" />}
          subValue="کارگاه‌های عالی فقه کاربردی، اسناد و آرشیو صوتی جلسات آموزشی"
          trendContext={`${courses.length} دوره آموزشی و کارگاه فعال`}
          badgeText="آموزش تخصصی"
          onClick={() => onNavigate('courses')}
        />

        {/* ۳. محصولات و کتب تخصصی */}
        <ModernDashboardCard
          title="محصولات و کتب"
          accent="emerald"
          icon={<BookOpen className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />}
          subValue="دانشنامه‌های فقهی-حقوقی، آرای وحدت رویه و متون مرجع قضایی"
          trendContext={`${products.length} اثر و نشریه علمی منتشرشده`}
          badgeText="انتشارات مرجع"
          onClick={() => onNavigate('products')}
        />

        {/* ۴. خدمات روان‌شناختی و مشاوره عمومی */}
        <ModernDashboardCard
          title="خدمات مشاوره عمومی"
          accent="rose"
          icon={<HeartHandshake className="w-6 h-6 text-rose-600 dark:text-rose-400" />}
          subValue="سلامت روان، تحکیم خانواده، مشاوره فردی، زوج‌درمانی و سبک زندگی"
          trendContext={`${consultants.filter(c => c.counselingType !== 'specialized_career').length} روان‌شناس و مشاور ارشد`}
          badgeText="مشاوره عمومی"
          onClick={() => onNavigate('counseling')}
        />

        {/* ۴.۵. مشاوره تخصصی تحصیلی و شغلی قضا (کارت مستقل) */}
        <ModernDashboardCard
          title="مشاوره تخصصی شغلی قضا"
          accent="amber"
          icon={<Scale className="w-6 h-6 text-amber-600 dark:text-amber-400" />}
          subValue="هدایت شغلی-تحصیلی با قضات پیشکسوت دیوان عالی، ارتقای پایه و اختبار"
          trendContext={`${consultants.filter(c => c.counselingType === 'specialized_career').length} استاد و قاضی پیشکسوت`}
          badgeText="هدایت شغلی قضا"
          onClick={() => onNavigate('specialized_counseling')}
        />

        {/* ۵. راهبری پژوهش و رساله‌ها */}
        <ModernDashboardCard
          title="پژوهش و پایان‌نامه‌ها"
          accent="amber"
          icon={<FileText className="w-6 h-6 text-amber-600 dark:text-amber-400" />}
          subValue="هدایت رساله دکتری، استاد ناظر و اسکان پژوهشی قم و تهران"
          trendContext={`${researchMentorships.length} طرح و رساله در حال هدایت`}
          badgeText="راهبری علمی"
          onClick={() => onNavigate('research')}
        />

        {/* ۶. تالار رأی قضایی */}
        <ModernDashboardCard
          title="تالار رأی قضایی"
          accent="cyan"
          icon={<Scale className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />}
          subValue="نقد موشکافانه احکام توسط قضات تجدیدنظر و دیوان عالی کشور"
          trendContext={`${rulings.length} دادنامه نقدشده`}
          badgeText="مباحثات فقهی"
          onClick={() => onNavigate('rulings')}
        />

        {/* ۷. تسهیلات و رفاهیات */}
        <ModernDashboardCard
          title="تسهیلات و رفاهیات"
          accent="teal"
          icon={<Gift className="w-6 h-6 text-teal-600 dark:text-teal-400" />}
          subValue="وام قرض‌الحسنه صندوق حامی، اقامتگاه مشهد و قم، تعاونی مصرف"
          trendContext={`${welfareRequests.length + consumables.length} طرح رفاهی آماده`}
          badgeText="صندوق رفاهی"
          onClick={() => onNavigate('welfare')}
        />

        {/* ۸. دیوار هم‌افزایی شغلی و همدلی */}
        <ModernDashboardCard
          title="دیوار هم‌افزایی"
          accent="purple"
          icon={<Users2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />}
          subValue="استعلام‌های رویه‌ای استانی با شناسه ناشناس و پویش‌های همدلی اعضا"
          trendContext={`${synergyPosts.length} گفتگو و استعلام رویه‌ای`}
          badgeText="تعاون همکاران"
          onClick={() => onNavigate('synergy')}
        />

        {/* ۹. کارت ویژه دانش‌آموختگان (فقط برای ادمین و مسئولین) */}
        {showAdminCard && (
          <ModernDashboardCard
            title="دانش‌آموختگان"
            accent="emerald"
            icon={<GraduationCap className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />}
            subValue="بانک جامع سوابق هویتی، قضایی، پژوهشی، رساله‌ها و ثبت پرونده‌های تفصیلی"
            trendContext={`${toPersianNumbers(users.filter(u => u.role === 'alumni' || u.judicialGrade).length)} پرونده ثبت‌شده دانش‌آموخته`}
            badgeText="بانک دانش‌آموختگان"
            onClick={() => onNavigate('alumni')}
          />
        )}

        {/* ۱۰. کارت ویژه مدیریت کاربران {حساب‌های کاربری} */}
        {showAdminCard && (
          <ModernDashboardCard
            title="مدیریت کاربران {حساب‌های کاربری}"
            accent="indigo"
            icon={<Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />}
            subValue="مدیریت حساب‌های کاربری همه سطوح، رمزهای عبور، وضعیت نشست‌ها و سطوح دسترسی"
            trendContext={`${toPersianNumbers(users.length)} حساب کاربری فعال`}
            badgeText="حساب‌های کاربری و دسترسی‌ها"
            onClick={() => onNavigate('users')}
          />
        )}

        {/* ۱۱. کارت مدیریت (نام اصلاح‌شده از فرماندهی و مدیریت به مدیریت) */}
        {showAdminCard && (
          <ModernDashboardCard
            title="مدیریت"
            accent="amber"
            icon={<ShieldCheck className="w-6 h-6 text-amber-600 dark:text-amber-400" />}
            subValue="پایش سلامت سرور، زنجیره غیرقابل‌دستکاری SHA-256 و عیب‌یابی آنی سامانه"
            trendContext={`${toPersianNumbers(auditLogs.length)} رکورد در زنجیره وقایع`}
            badgeText="مدیریت سیستم"
            onClick={() => onNavigate('admin')}
          />
        )}

      </div>
    </div>
  );
};
