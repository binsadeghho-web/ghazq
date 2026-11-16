import React, { useState, lazy, Suspense } from 'react';
import { useApp } from '../../context/AppContext';
import { toPersianNumbers } from '../../utils/persianNumbers';
import {
  canViewSection,
  useRbacPolicies,
  getRoleMetadata,
  isOrganizationalRole,
} from '../../utils/rbacPolicy';
import { AppSectionId } from '../../types';
import { MinimalShowcaseCard } from '../crextio/MinimalShowcaseCard';
import { ModuleFallback } from '../common/ModuleFallback';
import { CrextioSubViews } from '../crextio/CrextioSubViews';
import { FinanceSection } from '../finance/FinanceSection';
import { UserManagementModule } from '../admin/UserManagementModule';
import { DashboardWidgetsSuite } from '../dashboard/DashboardWidgetsSuite';
import {
  Scale,
  Inbox,
  Users2,
  Compass,
  HeartHandshake,
  GraduationCap,
  Gift,
  BookOpen,
  ShieldCheck,
  Users,
  Wallet,
  LogOut,
  Plus,
  ArrowLeft,
  ChevronDown,
  LayoutGrid,
  GripVertical,
  Eye,
  EyeOff,
  Columns2,
  Check,
  Move,
} from 'lucide-react';

const AdminControlCenter = lazy(() =>
  import('../admin/AdminControlCenter').then(m => ({ default: m.AdminControlCenter }))
);
const AlumniDirectorySection = lazy(() =>
  import('../alumni/AlumniDirectorySection').then(m => ({ default: m.AlumniDirectorySection }))
);

interface MinimalThemeLayoutProps {
  onSelectTheme: (theme: 'portal' | 'crextio' | 'minimal') => void;
}

const MINIMAL_SHOWCASE_KEYS = [
  'research_promo',
  'course_showcase',
  'counseling_promo',
  'rulings_showcase',
  'welfare_showcase',
];

const SHOWCASE_LABELS: Record<string, string> = {
  research_promo: 'راهبری پژوهش و رساله‌ها',
  course_showcase: 'دوره‌ها و کارگاه‌های علمی',
  counseling_promo: 'خدمات مشاوره نخبگان',
  rulings_showcase: 'تالار نقد آراء قضایی',
  welfare_showcase: 'تسهیلات و امور رفاهی',
};

export const MinimalThemeLayout: React.FC<MinimalThemeLayoutProps> = ({ onSelectTheme }) => {
  const {
    currentUser,
    logout,
    switchUserRole,
    cartableRequests,
    synergyPosts,
    rulings,
    courses,
    researchMentorships,
    consultants,
    crextioConfig,
    updateCrextioConfig,
  } = useApp();
  const { rolePolicies } = useRbacPolicies();

  const [activeNav, setActiveNav] = useState<string>('Dashboard');
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [isAlumniPreview, setIsAlumniPreview] = useState(false);
  const [isEditLayout, setIsEditLayout] = useState(false);
  const [draggedKey, setDraggedKey] = useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

  const isStaff = isOrganizationalRole(currentUser?.role) && !isAlumniPreview;
  const isAdmin =
    (currentUser?.role === 'admin' ||
      currentUser?.role === 'super_admin' ||
      currentUser?.role === 'alumni_manager' ||
      currentUser?.role === 'supervisor') &&
    !isAlumniPreview;

  const currentRoleMeta = getRoleMetadata(currentUser?.role);

  const allPrimaryNav: Array<{ id: string; sectionId: AppSectionId; label: string }> = [
    { id: 'Dashboard', sectionId: 'dashboard', label: 'میز کار' },
    { id: 'People', sectionId: 'cartable', label: 'کارتابل' },
    { id: 'Synergy', sectionId: 'synergy', label: 'هم‌افزایی' },
    { id: 'Research', sectionId: 'research', label: 'پژوهش' },
    { id: 'Counseling', sectionId: 'counseling', label: 'مشاوره' },
    { id: 'Rulings', sectionId: 'rulings', label: 'تالار آراء' },
  ];
  const primaryNav = allPrimaryNav.filter(item =>
    canViewSection(currentUser, item.sectionId, rolePolicies)
  );

  const allSecondaryNav: Array<{ id: string; sectionId: AppSectionId; label: string; icon: any }> = [
    { id: 'SpecializedCounseling', sectionId: 'counseling', label: 'مشاوره تخصصی قضا', icon: Scale },
    { id: 'Courses', sectionId: 'courses', label: 'دوره‌های آموزشی', icon: GraduationCap },
    { id: 'Welfare', sectionId: 'welfare', label: 'رفاهیات و تسهیلات', icon: Gift },
    { id: 'Products', sectionId: 'products', label: 'منشورات و کتب', icon: BookOpen },
    { id: 'Alumni', sectionId: 'alumni', label: 'بانک دانش‌آموختگان', icon: GraduationCap },
    { id: 'Finance', sectionId: 'finance', label: 'امور مالی', icon: Wallet },
    { id: 'Users', sectionId: 'users', label: 'مدیریت کاربران', icon: Users },
    { id: 'Admin', sectionId: 'admin', label: 'پایش و امنیت', icon: ShieldCheck },
  ];
  const secondaryNav = allSecondaryNav.filter(item =>
    canViewSection(currentUser, item.sectionId, rolePolicies)
  );

  const myRecentCartable = (
    isStaff
      ? cartableRequests
      : cartableRequests.filter(r => r.applicantId === currentUser?.id)
  ).slice(0, 4);

  const recentSynergy = synergyPosts.slice(0, 4);

  // Order & layouts synced with crextioConfig in MySQL
  const savedOrder = (crextioConfig.dashboardSectionOrder || []).filter(k =>
    MINIMAL_SHOWCASE_KEYS.includes(k)
  );
  const minimalOrder = [
    ...savedOrder,
    ...MINIMAL_SHOWCASE_KEYS.filter(k => !savedOrder.includes(k)),
  ];
  const hiddenMap = crextioConfig.hiddenDashboardSections || {};
  const layoutsMap = crextioConfig.dashboardSectionLayouts || {};

  // Default spans in Minimal Theme: research_promo and course_showcase default to 'half' so they sit on 1 line
  const getLayout = (key: string) => {
    const saved = layoutsMap[key];
    if (saved) return { span: saved.span || 'half', density: 'minimal' as const };
    if (key === 'research_promo' || key === 'course_showcase') {
      return { span: 'half' as const, density: 'minimal' as const };
    }
    return { span: 'half' as const, density: 'minimal' as const };
  };

  const handleToggleSpan = (key: string) => {
    const cur = getLayout(key);
    updateCrextioConfig({
      dashboardSectionLayouts: {
        ...layoutsMap,
        [key]: { ...cur, span: cur.span === 'half' ? 'full' : 'half' },
      },
    });
  };

  const handleToggleHide = (key: string) => {
    updateCrextioConfig({
      hiddenDashboardSections: {
        ...hiddenMap,
        [key]: !hiddenMap[key],
      },
    });
  };

  const handleDropMinimal = (targetKey: string) => {
    if (!draggedKey || draggedKey === targetKey) {
      setDraggedKey(null);
      setDragOverKey(null);
      return;
    }
    const baseOrder =
      crextioConfig.dashboardSectionOrder && crextioConfig.dashboardSectionOrder.length > 0
        ? [...crextioConfig.dashboardSectionOrder]
        : [...minimalOrder];
    if (!baseOrder.includes(draggedKey)) baseOrder.push(draggedKey);
    if (!baseOrder.includes(targetKey)) baseOrder.push(targetKey);
    const fromIdx = baseOrder.indexOf(draggedKey);
    const toIdx = baseOrder.indexOf(targetKey);
    const [moved] = baseOrder.splice(fromIdx, 1);
    baseOrder.splice(toIdx, 0, moved);
    updateCrextioConfig({ dashboardSectionOrder: baseOrder });
    setDraggedKey(null);
    setDragOverKey(null);
  };

  const renderMinimalShowcase = (key: string) => {
    switch (key) {
      case 'research_promo':
        return (
          <MinimalShowcaseCard
            kicker="راهبری علمی"
            title="پژوهش‌ها، رساله‌ها و پایان‌نامه‌ها"
            description="تطبیق با استاد راهنمای طراز اول، گرنت پژوهشی و تسهیل اسکان علمی برای پیشبرد پژوهش‌ها."
            icon={<Compass className="w-5 h-5" />}
            accentTone="emerald"
            stats={[{ label: 'پژوهش فعال', value: toPersianNumbers(researchMentorships.length) }]}
            actions={[{ label: 'ورود به میز پژوهش', onClick: () => setActiveNav('Research'), primary: true }]}
          />
        );
      case 'course_showcase':
        return (
          <MinimalShowcaseCard
            kicker="آموزش تخصصی"
            title="دوره‌ها و کارگاه‌های توانمندسازی"
            description="نشست‌های علمی فقه القضا، کارگاه‌های رویه‌ای و آرشیو جلسات آموزشی دانش‌آموختگان."
            icon={<GraduationCap className="w-5 h-5" />}
            accentTone="sky"
            stats={[{ label: 'دوره فعال', value: toPersianNumbers(courses.length) }]}
            actions={[{ label: 'مشاهده دوره‌ها', onClick: () => setActiveNav('Courses'), primary: true }]}
          />
        );
      case 'counseling_promo':
        return (
          <MinimalShowcaseCard
            kicker="مشاوره محرمانه"
            title="مشاوره شغلی قضا و سلامت روان"
            description="دریافت نوبت گفت‌وگو با اساتید راهنمای شغلی و مشاوران خانواده و تاب‌آوری."
            icon={<HeartHandshake className="w-5 h-5" />}
            accentTone="indigo"
            stats={[{ label: 'مشاور فعال', value: toPersianNumbers(consultants.length) }]}
            actions={[
              { label: 'عمومی', onClick: () => setActiveNav('Counseling') },
              { label: 'تخصصی قضا', onClick: () => setActiveNav('SpecializedCounseling'), primary: true },
            ]}
          />
        );
      case 'rulings_showcase':
        return (
          <MinimalShowcaseCard
            kicker="مباحثه حقوقی"
            title="تالار نقد و بررسی آراء قضایی"
            description="تبادل استدلال و نقد مستند بر روی دادنامه‌های منتخب دیوان عالی و تجدیدنظر."
            icon={<Scale className="w-5 h-5" />}
            accentTone="amber"
            stats={[{ label: 'رأی ثبت‌شده', value: toPersianNumbers(rulings.length) }]}
            actions={[{ label: 'ورود به تالار', onClick: () => setActiveNav('Rulings'), primary: true }]}
          />
        );
      case 'welfare_showcase':
        return (
          <MinimalShowcaseCard
            kicker="تعاون و رفاه"
            title="تسهیلات رفاهی و اقامتگاه‌ها"
            description="ثبت درخواست اسکان علمی-زیارتی مشهد و قم و تسهیلات قرض‌الحسنه اعضا."
            icon={<Gift className="w-5 h-5" />}
            accentTone="stone"
            actions={[{ label: 'میز رفاهیات', onClick: () => setActiveNav('Welfare'), primary: true }]}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8F7] text-stone-900 font-sans antialiased" dir="rtl">
      {/* 3-Zone Top Bar Contract (Clean, single-row, zero bloat) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-6">
          {/* Zone 1: Single-line Brand Title */}
          <button
            type="button"
            onClick={() => setActiveNav('Dashboard')}
            className="text-base font-black text-stone-900 tracking-tight whitespace-nowrap shrink-0 flex items-center gap-2.5 cursor-pointer"
          >
            <span className="w-8 h-8 rounded-lg bg-emerald-900 text-amber-300 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </span>
            <span>مجمع دانش‌آموختگان فقه و قضا</span>
          </button>

          {/* Zone 2: Clean Typography Nav Links */}
          <nav className="hidden lg:flex items-center gap-5 text-xs font-bold text-stone-600">
            {primaryNav.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveNav(item.id)}
                className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors cursor-pointer ${
                  activeNav === item.id
                    ? 'text-emerald-900 border-emerald-800 font-black'
                    : 'border-transparent hover:text-stone-900'
                }`}
              >
                {item.label}
              </button>
            ))}

            {secondaryNav.length > 0 && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMoreMenuOpen(prev => !prev)}
                  className="flex items-center gap-1 whitespace-nowrap shrink-0 py-1 text-stone-600 hover:text-stone-900 cursor-pointer"
                >
                  <span>سایر بخش‌ها</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                {moreMenuOpen && (
                  <div
                    onMouseLeave={() => setMoreMenuOpen(false)}
                    className="absolute right-0 mt-3 w-56 bg-white border border-stone-200 rounded-xl shadow-lg p-1.5 z-50 space-y-0.5"
                  >
                    {secondaryNav.map(item => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setActiveNav(item.id);
                            setMoreMenuOpen(false);
                          }}
                          className={`w-full text-right px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer ${
                            activeNav === item.id
                              ? 'bg-emerald-50 text-emerald-900'
                              : 'text-stone-700 hover:bg-stone-100'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5 text-stone-500" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </nav>

          {/* Zone 3: Theme Switcher + User Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {isOrganizationalRole(currentUser?.role) && (
              <div className="hidden sm:flex items-center gap-1 p-1 bg-stone-100 rounded-lg border border-stone-200 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => onSelectTheme('portal')}
                  className="px-2 py-1 rounded text-stone-600 hover:text-stone-900 cursor-pointer"
                >
                  تم ۱
                </button>
                <button
                  type="button"
                  onClick={() => onSelectTheme('crextio')}
                  className="px-2 py-1 rounded text-stone-600 hover:text-stone-900 cursor-pointer"
                >
                  تم ۲
                </button>
                <span className="px-2 py-1 rounded bg-white text-emerald-900 shadow-2xs">
                  تم ۳
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={() => setActiveNav('People')}
              className="px-3.5 py-2 rounded-lg bg-emerald-900 hover:bg-emerald-950 text-white text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>درخواست جدید</span>
            </button>

            <button
              type="button"
              onClick={logout}
              title="خروج از حساب"
              className="p-2 rounded-lg text-stone-500 hover:text-rose-600 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-7 space-y-6">
        {activeNav === 'Dashboard' ? (
          <>
            {/* Calm Minimal Hero Strip */}
            <section className="rounded-2xl bg-white border border-stone-200 p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-stone-500 font-medium">
                  <span>{currentRoleMeta.title}</span>
                  <span aria-hidden="true">·</span>
                  <span>{currentUser?.organization || 'مجمع دانش‌آموختگان فقه و قضا'}</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
                  سلام، {currentUser?.fullName}
                </h1>
                <p className="text-xs text-stone-600">
                  درگاه متمرکز هم‌افزایی اعضا، پیگیری کارتابل خدمات، راهبری پژوهش‌ها و دریافت مشاوره تخصصی
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveNav('People')}
                  className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Inbox className="w-3.5 h-3.5 text-emerald-800" />
                  <span>کارتابل خدمات</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveNav('Synergy')}
                  className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Users2 className="w-3.5 h-3.5 text-indigo-700" />
                  <span>دیوار هم‌افزایی</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveNav('Research')}
                  className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Compass className="w-3.5 h-3.5 text-amber-700" />
                  <span>راهبری پژوهش</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveNav('Counseling')}
                  className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <HeartHandshake className="w-3.5 h-3.5 text-rose-700" />
                  <span>مشاوره</span>
                </button>
              </div>
            </section>

            {/* Banners, Events & Alumni Preview Widget (Controlled by Admin) */}
            <DashboardWidgetsSuite
              onNavigateTab={setActiveNav}
              isAlumniPreview={isAlumniPreview}
              onToggleAlumniPreview={() => setIsAlumniPreview(prev => !prev)}
            />

            {/* Primary Community & Operations Split Row (Cartable + Synergy) */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              {/* Recent Cartable Cases */}
              <div className="lg:col-span-6 rounded-2xl bg-white border border-stone-200 p-5 flex flex-col justify-between gap-4">
                <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                  <div className="flex items-center gap-2">
                    <Inbox className="w-4 h-4 text-emerald-800" />
                    <h2 className="text-sm font-black text-stone-900">
                      {isStaff ? 'آخرین درخواست‌های کارتابل' : 'پیگیری درخواست‌های من'}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveNav('People')}
                    className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer"
                  >
                    <span>مشاهده همه</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                </div>

                {myRecentCartable.length === 0 ? (
                  <p className="text-xs text-stone-400 py-6 text-center">
                    هنوز درخواستی در کارتابل ثبت نشده است.
                  </p>
                ) : (
                  <div className="divide-y divide-stone-100">
                    {myRecentCartable.map(req => (
                      <button
                        key={req.id}
                        type="button"
                        onClick={() => setActiveNav('People')}
                        className="w-full py-2.5 text-right flex items-center justify-between gap-3 hover:bg-stone-50 px-2 rounded-lg transition-colors cursor-pointer"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-stone-900 truncate">{req.title}</p>
                          <p className="text-[11px] text-stone-500 mt-0.5 truncate">
                            {req.applicantName} · کد {toPersianNumbers(req.trackingNumber)}
                          </p>
                        </div>
                        <span className="text-[11px] font-bold text-stone-600 shrink-0">
                          {req.status === 'pending'
                            ? 'در انتظار'
                            : req.status === 'in_progress'
                            ? 'در حال پیگیری'
                            : req.status === 'completed'
                            ? 'انجام شد'
                            : req.status === 'archived'
                            ? 'مختومه'
                            : 'نیازمند تکمیل'}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Synergy Posts */}
              <div className="lg:col-span-6 rounded-2xl bg-white border border-stone-200 p-5 flex flex-col justify-between gap-4">
                <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                  <div className="flex items-center gap-2">
                    <Users2 className="w-4 h-4 text-indigo-700" />
                    <h2 className="text-sm font-black text-stone-900">
                      تازه‌های دیوار هم‌افزایی و تبادل تجربه
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveNav('Synergy')}
                    className="text-xs font-bold text-indigo-700 hover:text-indigo-950 flex items-center gap-1 cursor-pointer"
                  >
                    <span>ورود به دیوار هم‌افزایی</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                </div>

                {recentSynergy.length === 0 ? (
                  <p className="text-xs text-stone-400 py-6 text-center">
                    هنوز پستی در دیوار هم‌افزایی منتشر نشده است.
                  </p>
                ) : (
                  <div className="divide-y divide-stone-100">
                    {recentSynergy.map(post => (
                      <button
                        key={post.id}
                        type="button"
                        onClick={() => setActiveNav('Synergy')}
                        className="w-full py-2.5 text-right flex items-center justify-between gap-3 hover:bg-stone-50 px-2 rounded-lg transition-colors cursor-pointer"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-stone-900 truncate">{post.title}</p>
                          <p className="text-[11px] text-stone-500 mt-0.5 truncate">
                            {post.authorPseudonym} · {toPersianNumbers(post.responses?.length || 0)} دیدگاه
                          </p>
                        </div>
                        <ArrowLeft className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Minimal Half-Width Showcases with Live Drag & Drop Reorder for Admin */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black text-stone-600 flex items-center gap-1.5">
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>درگاه‌های علمی، پژوهشی و خدماتی</span>
                </h2>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setIsEditLayout(prev => !prev)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-colors cursor-pointer ${
                      isEditLayout
                        ? 'bg-amber-400 text-stone-950 border-amber-500'
                        : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {isEditLayout ? <Check className="w-3.5 h-3.5" /> : <Move className="w-3.5 h-3.5" />}
                    <span>{isEditLayout ? 'پایان ویرایش چیدمان' : 'تغییر چیدمان و اندازه (Drag & Drop)'}</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                {minimalOrder.map(key => {
                  const isHidden = hiddenMap[key] === true;
                  if (isHidden && !isEditLayout) return null;
                  const layout = getLayout(key);
                  const colClass = layout.span === 'full' ? 'lg:col-span-12' : 'lg:col-span-6';

                  return (
                    <div
                      key={key}
                      draggable={isEditLayout}
                      onDragStart={() => isEditLayout && setDraggedKey(key)}
                      onDragOver={e => {
                        if (!isEditLayout) return;
                        e.preventDefault();
                        setDragOverKey(key);
                      }}
                      onDragLeave={() => setDragOverKey(null)}
                      onDrop={() => isEditLayout && handleDropMinimal(key)}
                      onDragEnd={() => {
                        setDraggedKey(null);
                        setDragOverKey(null);
                      }}
                      className={`${colClass} flex flex-col ${
                        isEditLayout
                          ? `rounded-2xl border-2 border-dashed p-1.5 ${
                              dragOverKey === key ? 'border-emerald-600 bg-emerald-50/40' : 'border-amber-400/70'
                            } ${isHidden ? 'opacity-45' : ''}`
                          : ''
                      }`}
                    >
                      {isEditLayout && (
                        <div className="mb-1.5 px-2.5 py-1 rounded-xl bg-stone-900 text-white flex items-center justify-between text-[11px] font-bold">
                          <span className="flex items-center gap-1.5 cursor-grab">
                            <GripVertical className="w-3.5 h-3.5 text-amber-400" />
                            <span>{SHOWCASE_LABELS[key] || key}</span>
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleToggleSpan(key)}
                              className="px-2 py-0.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 flex items-center gap-1 cursor-pointer"
                            >
                              <Columns2 className="w-3 h-3" />
                              <span>{layout.span === 'half' ? '۱/۲ خط' : 'تمام‌عرض'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleHide(key)}
                              className="px-2 py-0.5 rounded bg-stone-800 hover:bg-rose-600 text-stone-200 flex items-center gap-1 cursor-pointer"
                            >
                              {isHidden ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                              <span>{isHidden ? 'نمایش' : 'مخفی'}</span>
                            </button>
                          </div>
                        </div>
                      )}
                      <div className="flex-1">{renderMinimalShowcase(key)}</div>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <button
                type="button"
                onClick={() => setActiveNav('Dashboard')}
                className="text-xs font-bold text-stone-600 hover:text-stone-900 flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                <span>بازگشت به میز کار</span>
              </button>
            </div>

            {activeNav === 'Finance' ? (
              <FinanceSection />
            ) : activeNav === 'Alumni' ? (
              <Suspense fallback={<ModuleFallback />}>
                <AlumniDirectorySection onNavigate={setActiveNav} />
              </Suspense>
            ) : activeNav === 'Users' ? (
              <UserManagementModule />
            ) : activeNav === 'Admin' ? (
              <Suspense fallback={<ModuleFallback />}>
                <AdminControlCenter />
              </Suspense>
            ) : (
              <CrextioSubViews activeNav={activeNav} onNavigate={setActiveNav} />
            )}
          </div>
        )}
      </main>

      {/* Bottom Floating Alumni Preview Bar */}
      {currentUser?.role === 'alumni' && (
        <div className="fixed bottom-5 left-5 z-50 flex items-center gap-2.5 bg-stone-900 text-white px-4 py-2 rounded-xl border border-stone-700 shadow-lg text-xs">
          <span className="font-bold">نمای دانش‌آموخته</span>
          <button
            type="button"
            onClick={() => switchUserRole('admin')}
            className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-stone-950 rounded-lg font-black cursor-pointer"
          >
            بازگشت به مدیریت
          </button>
        </div>
      )}
    </div>
  );
};
