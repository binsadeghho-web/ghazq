import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutGrid,
  Sparkles,
  ArrowLeft,
  GraduationCap,
  ChevronLeft,
  CheckCircle2,
  Compass,
  Scale,
  BookOpen,
  CreditCard,
  Landmark,
  Building2,
  ShoppingBag,
  Store,
  Gift,
  BookMarked,
  Inbox,
  Clock,
  Users2,
  MessageSquare,
} from 'lucide-react';
import { toPersianNumbers } from '../../utils/persianNumbers';
import {
  DEFAULT_SHOWCASE_IMAGES,
  resolveShowcaseImageUrl,
  resolveCourseCoverUrl,
  resolveProductCoverUrl,
  handleImageErrorFallback,
} from '../../data/showcaseImages';
import type {
  Course,
  Consultant,
  CounselingFieldItem,
  JudicialRuling,
  Product,
  ResearchMentorship,
  CartableRequest,
  SynergyPost,
  ConsumableItem,
  WelfarePortalConfig,
  WelfareInstallmentPartner,
  WelfareRecreationProgram,
  CrextioDashboardConfig,
  MobileServiceListTabId,
  WelfareModuleKey,
  User,
} from '../../types';

export interface Theme3FeedTabItem {
  id: MobileServiceListTabId;
  label: string;
  icon: any;
}

interface Theme3ServicesWorkbenchProps {
  title: string;
  feedTabs: Theme3FeedTabItem[];
  resolvedFeedTab: MobileServiceListTabId;
  onSelectTab: (tab: MobileServiceListTabId) => void;
  showActiveWorkshopsSpotlight?: boolean;
  combinedWorkshopsCount: number;
  activeWorkshops: any[];
  activeWorkshopCourses: Course[];
  crextioConfig: CrextioDashboardConfig;
  courses: Course[];
  activeCourses: Course[];
  generalConsultants: Consultant[];
  specializedConsultants: Consultant[];
  generalFieldsList: CounselingFieldItem[];
  specializedFieldsList: CounselingFieldItem[];
  rulings: JudicialRuling[];
  featuredRulings: JudicialRuling[];
  researchMentorships: ResearchMentorship[];
  products: Product[];
  featuredProducts: Product[];
  cartableRequests: CartableRequest[];
  myCartableActive: number;
  synergyPosts: SynergyPost[];
  welfarePortalConfig: WelfarePortalConfig;
  myFundMembership: any;
  installmentPartners: WelfareInstallmentPartner[];
  activeConsumables: ConsumableItem[];
  recreationPrograms: WelfareRecreationProgram[];
  currentUser: User | null;
  onNavigateTab?: (tab: string) => void;
  navigateDeep: (tab: string, subTab?: string) => void;
  onBookGeneralCounseling?: () => void;
}

export const Theme3ServicesWorkbench: React.FC<Theme3ServicesWorkbenchProps> = ({
  title,
  feedTabs,
  resolvedFeedTab,
  onSelectTab,
  showActiveWorkshopsSpotlight = true,
  combinedWorkshopsCount,
  activeWorkshops,
  activeWorkshopCourses,
  crextioConfig,
  courses,
  activeCourses,
  generalConsultants,
  specializedConsultants,
  generalFieldsList,
  specializedFieldsList,
  rulings,
  featuredRulings,
  researchMentorships,
  products,
  featuredProducts,
  cartableRequests,
  myCartableActive,
  synergyPosts,
  welfarePortalConfig,
  myFundMembership,
  installmentPartners,
  activeConsumables,
  recreationPrograms,
  currentUser,
  onNavigateTab,
  navigateDeep,
  onBookGeneralCounseling,
}) => {
  if (feedTabs.length === 0) return null;

  const showSpotlight = showActiveWorkshopsSpotlight && combinedWorkshopsCount > 0;

  const tabAccentColor: Record<string, string> = {
    courses: 'text-cyan-700',
    counseling: 'text-rose-600',
    specialized_counseling: 'text-amber-700',
    rulings: 'text-amber-800',
    research: 'text-teal-700',
    welfare: 'text-pink-600',
    products: 'text-violet-700',
    cartable: 'text-emerald-700',
    synergy: 'text-blue-600',
  };

  return (
    <section aria-label={title} className="space-y-4">
      {/* Header + Standout Active Workshop Spotlight side-by-side on laptop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
        <div
          className={`${
            showSpotlight ? 'lg:col-span-7' : 'lg:col-span-12'
          } relative overflow-hidden rounded-[22px] bg-gradient-to-l from-[#071E17] via-[#0C3025] to-[#134434] text-white px-5 py-4 border border-[#F3D078]/30 flex items-center justify-between gap-3 shadow-sm`}
        >
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 luxury-lattice-bg opacity-45" />
          <div className="relative z-10 flex items-center gap-3 min-w-0">
            <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F3D078] to-[#D6A53D] text-[#071E17] flex items-center justify-center shrink-0 shadow-xs">
              <LayoutGrid className="w-5 h-5 stroke-[2.2]" />
            </span>
            <div className="min-w-0">
              <h2 className="text-[15px] font-black text-white truncate">{title}</h2>
              <p className="text-[11px] text-emerald-100/80 truncate mt-0.5">
                انتخاب بخش جهت مشاهده امکانات زنده و ورود سریع
              </p>
            </div>
          </div>
          <span className="relative z-10 px-3 py-1 rounded-xl bg-white/10 border border-[#F3D078]/30 text-xs font-black text-[#F3D078] tabular-nums shrink-0">
            {toPersianNumbers(feedTabs.length)} خدمت
          </span>
        </div>

        {showSpotlight && (
          <motion.button
            type="button"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.985 }}
            onClick={() => navigateDeep('CounselingGeneral', 'workshops')}
            className="lg:col-span-5 relative overflow-hidden rounded-[22px] bg-gradient-to-l from-[#071E17] via-[#0F3528] to-[#134232] text-white p-4 px-5 border border-[#F3D078]/35 shadow-[0_14px_30px_-16px_rgba(7,30,23,0.65)] text-right flex items-center justify-between gap-3 cursor-pointer"
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-[#F3D078]/15 to-transparent luxury-sheen"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-l from-transparent via-[#F3D078]/80 to-transparent"
            />
            <div className="relative z-10 flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-[#F3D078]/15 border border-[#F3D078]/40 text-[#F3D078] flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[10px] font-black text-[#F3D078]">
                  <span>کارگاه در حال برگزاری</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">{toPersianNumbers(combinedWorkshopsCount)} کارگاه فعال</span>
                </div>
                <p className="text-xs font-black text-white truncate mt-0.5">
                  {activeWorkshops[0]?.title || activeWorkshopCourses[0]?.title || 'کارگاه‌های تخصصی مرکز'}
                </p>
              </div>
            </div>
            <span className="relative z-10 px-3.5 py-2 rounded-xl bg-[#F3D078] text-[#071E17] text-[11px] font-black shrink-0 whitespace-nowrap flex items-center gap-1">
              <span>ثبت‌نام</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </span>
          </motion.button>
        )}
      </div>

      {/* Horizontal Segmented Service Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
        {feedTabs.map(tab => {
          const Icon = tab.icon;
          const isSelected = resolvedFeedTab === tab.id;
          const hasLiveWorkshop =
            combinedWorkshopsCount > 0 && (tab.id === 'counseling' || tab.id === 'courses');

          return (
            <motion.button
              key={tab.id}
              type="button"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onSelectTab(tab.id)}
              className={`relative flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-2xl text-xs font-extrabold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                isSelected
                  ? 'text-white'
                  : 'bg-white text-stone-700 border border-[#DFD8C4] hover:text-stone-950 shadow-2xs'
              }`}
            >
              {isSelected && (
                <motion.span
                  layoutId="theme3FeedTabPill"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  className="absolute inset-0 rounded-2xl bg-gradient-to-l from-[#071E17] via-[#0C3126] to-[#134434] shadow-md border border-[#F3D078]/35 overflow-hidden"
                >
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-l from-transparent via-[#F3D078]/85 to-transparent"
                  />
                </motion.span>
              )}
              <Icon
                className={`relative z-10 w-4 h-4 ${
                  isSelected ? 'text-[#F3D078]' : tabAccentColor[tab.id] || 'text-emerald-700'
                }`}
              />
              <span className="relative z-10">{tab.label}</span>
              {hasLiveWorkshop && (
                <span
                  className={`relative z-10 text-[10px] font-black tabular-nums ${
                    isSelected ? 'text-[#F3D078]' : 'text-emerald-700'
                  }`}
                >
                  · {toPersianNumbers(combinedWorkshopsCount)} کارگاه
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Expanded Rich Multi-Column Detail Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={resolvedFeedTab}
          initial={{ opacity: 0, y: 12, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.99 }}
          transition={{ type: 'spring', stiffness: 360, damping: 28 }}
          className="relative bg-gradient-to-b from-[#FCFCF9] to-[#F7F3E7] rounded-[30px] border border-[#DDD3B8] overflow-hidden shadow-[0_18px_40px_-20px_rgba(7,30,23,0.2)]"
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-12 top-0 h-[1.5px] bg-gradient-to-l from-transparent via-[#D4AF37]/80 to-transparent"
          />

          {/* 1. COURSES */}
          {resolvedFeedTab === 'courses' && (
            <div className="p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#071E17] to-[#113D30] text-[#F3D078] flex items-center justify-center shrink-0 border border-[#F3D078]/30 shadow-xs">
                    <GraduationCap className="w-7 h-7" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <h3 className="text-base font-black text-stone-900">
                      {crextioConfig.courseShowcaseTitle || 'دوره‌ها و کارگاه‌های علمی فقه و قضا'}
                    </h3>
                    <p className="text-xs text-stone-600 leading-relaxed max-w-2xl">
                      دوره‌های تخصصی حقوق، آیین دادرسی و کارگاه‌های مهارتی با صدور گواهی‌نامه معتبر و امکان ثبت‌نام برخط.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigateTab?.('Courses')}
                  className="px-5 py-3 min-h-[44px] rounded-2xl bg-[#071E17] hover:bg-[#0E3226] text-[#F3D078] text-xs font-black flex items-center justify-center gap-2 shadow-md cursor-pointer shrink-0 whitespace-nowrap"
                >
                  <span>مشاهده تمامی دوره‌ها ({toPersianNumbers(courses.length)})</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {activeCourses.slice(0, 3).map((course, cIdx) => {
                  const thumbSrc = resolveCourseCoverUrl(course.coverImage, cIdx);
                  return (
                    <button
                      key={course.id}
                      type="button"
                      onClick={() => onNavigateTab?.('Courses')}
                      className="p-3.5 rounded-2xl bg-white border border-stone-200/85 hover:border-emerald-400 flex items-start gap-3 text-right cursor-pointer group hover:-translate-y-0.5 transition-all shadow-2xs"
                    >
                      <div className="w-16 h-16 rounded-xl bg-emerald-950 overflow-hidden shrink-0 border border-stone-200/80">
                        <img
                          src={thumbSrc}
                          alt={course.title}
                          referrerPolicy="no-referrer"
                          onError={e => handleImageErrorFallback(e, DEFAULT_SHOWCASE_IMAGES.course_showcase)}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-xs font-black text-stone-900 group-hover:text-emerald-800 leading-snug line-clamp-2">
                          {course.title}
                        </p>
                        <p className="text-[11px] text-stone-600 line-clamp-1">
                          {course.description || `مدرس دوره: ${course.instructor}`}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-stone-500 pt-0.5 tabular-nums">
                          <span className="text-emerald-800">{course.instructor}</span>
                          <span>·</span>
                          <span>{toPersianNumbers(course.hours)} ساعت</span>
                          {course.isEnrolled && (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-black">
                              ثبت‌نام‌شده
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
                {activeCourses.length === 0 && (
                  <p className="lg:col-span-3 py-6 text-center text-xs text-stone-500 bg-white rounded-2xl border border-stone-200/70">
                    دوره فعالی برای نمایش ثبت نشده است.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 2. PSYCHOLOGICAL & GENERAL COUNSELING */}
          {resolvedFeedTab === 'counseling' && (
            <div className="p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-stone-200 bg-emerald-950">
                    <img
                      src={
                        resolveShowcaseImageUrl(
                          'counseling_general_showcase',
                          crextioConfig.showcaseImageOverrides
                        ) || DEFAULT_SHOWCASE_IMAGES.counseling_general_showcase
                      }
                      alt="خدمات روانشناختی و مشاوره"
                      referrerPolicy="no-referrer"
                      onError={e => handleImageErrorFallback(e, DEFAULT_SHOWCASE_IMAGES.counseling_general_showcase)}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <h3 className="text-base font-black text-stone-900">
                      خدمات روانشناختی و مشاوره مرکز
                    </h3>
                    <p className="text-xs text-stone-600 leading-relaxed max-w-2xl">
                      مشاوره محرمانه سلامت روان، تحکیم خانواده، زوج‌درمانی، پیش از ازدواج، مدیریت استرس شغلی و تست‌های استاندارد روان‌شناختی.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      onBookGeneralCounseling
                        ? onBookGeneralCounseling()
                        : navigateDeep('CounselingGeneral', 'booking')
                    }
                    className="px-4 py-2.5 min-h-[44px] rounded-2xl bg-[#071E17] hover:bg-[#0E3226] text-[#F3D078] text-xs font-black flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <span>رزرو نوبت مشاوره</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateDeep('CounselingGeneral', 'workshops')}
                    className="px-4 py-2.5 min-h-[44px] rounded-2xl bg-white hover:bg-stone-50 border border-stone-300 text-stone-900 text-xs font-black cursor-pointer whitespace-nowrap"
                  >
                    کارگاه‌ها و اطلاعیه‌ها
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-5 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-2xl bg-white border border-stone-200/80">
                      <span className="text-[11px] font-bold text-stone-500 block">کادر روان‌شناسی</span>
                      <span className="text-base font-black text-emerald-900 mt-1 block tabular-nums">
                        {toPersianNumbers(generalConsultants.length)} مشاور و روان‌شناس
                      </span>
                    </div>
                    <div className="p-4 rounded-2xl bg-white border border-stone-200/80">
                      <span className="text-[11px] font-bold text-stone-500 block">کارگاه‌های سلامت</span>
                      <span className="text-base font-black text-amber-800 mt-1 block tabular-nums">
                        {toPersianNumbers(activeWorkshops.length)} کارگاه فعال
                      </span>
                    </div>
                  </div>

                  {generalFieldsList.length > 0 && (
                    <div className="p-4 rounded-2xl bg-white border border-stone-200/80 space-y-2">
                      <span className="text-xs font-black text-stone-800 block">محورهای خدمات قابل رزرو:</span>
                      <div className="space-y-1.5">
                        {generalFieldsList.slice(0, 3).map(field => (
                          <div key={field.id} className="flex items-start gap-2 text-xs text-stone-700">
                            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                            <span className="font-bold">{field.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="lg:col-span-7">
                  {activeWorkshops.length > 0 ? (
                    <div className="h-full p-5 rounded-2xl bg-gradient-to-l from-[#071E17] to-[#10382B] text-white border border-[#F3D078]/35 space-y-3 shadow-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-black text-[#F3D078] flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4" />
                          <span>کارگاه‌های فعال روانشناختی ({toPersianNumbers(activeWorkshops.length)})</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => navigateDeep('CounselingGeneral', 'workshops')}
                          className="text-[11px] font-black text-[#F3D078] underline cursor-pointer"
                        >
                          مشاهده همه
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {activeWorkshops.slice(0, 4).map(wk => (
                          <button
                            key={wk.id}
                            type="button"
                            onClick={() => navigateDeep('CounselingGeneral', 'workshops')}
                            className="p-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-right flex items-center justify-between gap-2 cursor-pointer transition-colors"
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-black text-white truncate">{wk.title}</p>
                              {(wk.presenter || wk.scheduleText) && (
                                <p className="text-[10px] text-emerald-100/85 truncate mt-0.5">
                                  {[wk.presenter, wk.scheduleText].filter(Boolean).join(' · ')}
                                </p>
                              )}
                            </div>
                            <ChevronLeft className="w-4 h-4 text-[#F3D078] shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="h-full p-5 rounded-2xl bg-white border border-stone-200/80 flex items-center justify-center text-xs text-stone-500">
                      برای مشاهده لیست کامل مشاوران و انتخاب زمان جلسه، دکمه رزرو نوبت مشاوره را انتخاب کنید.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 3. SPECIALIZED JUDICIAL COUNSELING */}
          {resolvedFeedTab === 'specialized_counseling' && (
            <div className="p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1C2736] to-[#0A221B] text-[#F3D078] flex items-center justify-center shrink-0 border border-[#F3D078]/30">
                    <Compass className="w-7 h-7" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <h3 className="text-base font-black text-stone-900">
                      مشاوره شغلی قضا و هدایت علمی نخبگان
                    </h3>
                    <p className="text-xs text-stone-600 leading-relaxed max-w-2xl">
                      گفت‌وگوی تخصصی با قضات پیشکسوت دیوان عالی و اساتید برجسته در زمینه مسیر شغلی قضاوت، ارتقای پایه، انتقالات و ادامه تحصیل.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigateTab?.('SpecializedCounseling')}
                  className="px-5 py-3 min-h-[44px] rounded-2xl bg-[#071E17] hover:bg-[#0E3226] text-[#F3D078] text-xs font-black flex items-center justify-center gap-2 shadow-md cursor-pointer shrink-0 whitespace-nowrap"
                >
                  <span>ورود به میز مشاوره شغلی قضا</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {specializedConsultants.slice(0, 2).map(cons => (
                  <div
                    key={cons.id}
                    className="p-4 rounded-2xl bg-white border border-stone-200/80 flex items-center gap-3"
                  >
                    <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-black text-sm shrink-0 border border-amber-200/70">
                      {cons.name.slice(0, 1)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-black text-stone-900 truncate">{cons.name}</p>
                      <p className="text-[11px] text-stone-600 truncate mt-0.5">{cons.title}</p>
                      <p className="text-[10px] text-emerald-800 font-bold mt-0.5 truncate">{cons.availability}</p>
                    </div>
                  </div>
                ))}
                {specializedFieldsList.length > 0 && (
                  <div className="p-4 rounded-2xl bg-[#F4F1E7] border border-[#E2D9C2] text-xs text-stone-800 space-y-1.5">
                    <span className="text-[11px] font-black text-amber-900 block">محورهای فعال:</span>
                    <p className="font-bold leading-relaxed">
                      {specializedFieldsList.slice(0, 3).map(f => f.title).join(' · ')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. RULINGS */}
          {resolvedFeedTab === 'rulings' && (
            <div className="p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#2C200E] to-[#12261E] text-[#F3D078] flex items-center justify-center shrink-0 border border-[#F3D078]/30">
                    <Scale className="w-7 h-7" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <h3 className="text-base font-black text-stone-900">
                      {crextioConfig.rulingsShowcaseTitle || 'تالار نقد و مباحثه آراء قضایی'}
                    </h3>
                    <p className="text-xs text-stone-600 leading-relaxed max-w-2xl">
                      بررسی مبانی فقهی و استدلالی دادنامه‌های منتخب شعب بدوی، تجدیدنظر و دیوان عالی کشور و مشارکت قضات در تحلیل‌های علمی.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigateTab?.('Rulings')}
                  className="px-5 py-3 min-h-[44px] rounded-2xl bg-[#071E17] hover:bg-[#0E3226] text-[#F3D078] text-xs font-black flex items-center justify-center gap-2 shadow-md cursor-pointer shrink-0 whitespace-nowrap"
                >
                  <span>ورود به تالار نقد آراء ({toPersianNumbers(rulings.length)})</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {featuredRulings.slice(0, 3).map(ruling => (
                  <button
                    key={ruling.id}
                    type="button"
                    onClick={() => onNavigateTab?.('Rulings')}
                    className="p-4 rounded-2xl bg-white border border-stone-200/80 hover:border-amber-400 flex flex-col justify-between gap-2 text-right cursor-pointer group hover:-translate-y-0.5 transition-all"
                  >
                    <div className="space-y-1.5">
                      <p className="text-xs font-black text-stone-900 group-hover:text-emerald-800 leading-snug line-clamp-2">
                        {ruling.title}
                      </p>
                      {ruling.summary && (
                        <p className="text-[11px] text-stone-600 line-clamp-2 leading-relaxed">
                          {ruling.summary}
                        </p>
                      )}
                    </div>
                    <p className="text-[10px] font-bold text-amber-800 pt-1.5 border-t border-stone-100 truncate">
                      {ruling.caseTypeTitle} · {ruling.courtBranch}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 5. RESEARCH */}
          {resolvedFeedTab === 'research' && (
            <div className="p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0A222E] to-[#071E17] text-[#F3D078] flex items-center justify-center shrink-0 border border-[#F3D078]/30">
                    <BookOpen className="w-7 h-7" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <h3 className="text-base font-black text-stone-900">
                      {crextioConfig.researchPromoTitle || 'راهبری پژوهش‌ها، مقالات و رساله‌های علمی'}
                    </h3>
                    <p className="text-xs text-stone-600 leading-relaxed max-w-2xl">
                      حمایت تخصصی از پژوهش‌های قضایی و فقهی، تخصیص اساتید راهنمای معین، گرنت پژوهشی و تسهیل اسکان مطالعاتی در شهر قم.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigateTab?.('Research')}
                  className="px-5 py-3 min-h-[44px] rounded-2xl bg-[#071E17] hover:bg-[#0E3226] text-[#F3D078] text-xs font-black flex items-center justify-center gap-2 shadow-md cursor-pointer shrink-0 whitespace-nowrap"
                >
                  <span>ورود به میز خدمات پژوهشی</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <div className="p-4 rounded-2xl bg-white border border-stone-200/80">
                  <span className="text-[11px] font-bold text-stone-500 block">پرونده‌های پژوهشی</span>
                  <span className="text-base font-black text-emerald-900 mt-1 block tabular-nums">
                    {toPersianNumbers(researchMentorships.length)} طرح فعال
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-stone-200/80">
                  <span className="text-[11px] font-bold text-stone-500 block">سقف گرنت پژوهشی</span>
                  <span className="text-base font-black text-amber-800 mt-1 block">
                    {crextioConfig.researchPromoGrantAmount || 'تا ۵۰ میلیون تومان'}
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-stone-200/80 space-y-1.5 text-xs text-stone-700">
                  <div className="flex items-center gap-2 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>راهبری پایان‌نامه و همکاری مقاله</span>
                  </div>
                  <div className="flex items-center gap-2 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>پیشنهاد برگزاری نشست‌های علمی و اسکان قم</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 6. WELFARE — 6 MODULES */}
          {resolvedFeedTab === 'welfare' &&
            (() => {
              const activePartnersList = (installmentPartners || []).filter(p => p.isActive !== false);
              const fundStatusSubtitle =
                myFundMembership?.status === 'approved'
                  ? 'عضو فعال صندوق · واریز حق عضویت و مشاهده سوابق'
                  : myFundMembership?.status === 'pending'
                    ? 'درخواست عضویت در حال بررسی · امکان ویرایش یا لغو'
                    : 'عضویت آنلاین با انتخاب مبلغ حق عضویت ماهانه';

              const welfareSubCards: Array<{
                key: WelfareModuleKey;
                indexLabel: string;
                title: string;
                subtitle: string;
                metaText: string;
                icon: any;
                iconClass: string;
                glowBg: string;
                featured?: boolean;
              }> = [
                {
                  key: 'emergency_loan' as WelfareModuleKey,
                  indexLabel: '۰۱',
                  title: welfarePortalConfig.modulesConfig.emergency_loan?.title || 'تسهیلات اضطراری',
                  subtitle:
                    welfarePortalConfig.modulesConfig.emergency_loan?.subtitle ||
                    'ثبت درخواست وام ضروری با درج مبلغ و علت درخواست',
                  metaText: 'بررسی کارگروه رفاه · ۴۸ تا ۷۲ ساعت کاری',
                  icon: CreditCard,
                  iconClass: 'bg-[#F3D078]/15 text-[#F3D078] border-[#F3D078]/40',
                  glowBg: 'from-[#071E17] via-[#0B2D22] to-[#124030] text-white border-[#F3D078]/50',
                  featured: true,
                },
                {
                  key: 'qarzolhasaneh_fund' as WelfareModuleKey,
                  indexLabel: '۰۲',
                  title:
                    welfarePortalConfig.modulesConfig.qarzolhasaneh_fund?.title ||
                    'صندوق قرض‌الحسنه مجتمع فقه و حقوق اسلامی',
                  subtitle: fundStatusSubtitle,
                  metaText: `${toPersianNumbers((welfarePortalConfig.fundConfig?.presetTiers || []).length)} پلن پیشنهادی + مبلغ دلخواه`,
                  icon: Landmark,
                  iconClass: 'bg-amber-50 text-amber-800 border-amber-200',
                  glowBg: 'from-white via-white to-[#FBF5E4]/80 text-stone-900 border-[#E5DEC9]',
                },
                {
                  key: 'accommodation' as WelfareModuleKey,
                  indexLabel: '۰۳',
                  title:
                    welfarePortalConfig.modulesConfig.accommodation?.title ||
                    'اسکان در قم و سایر شهرها',
                  subtitle: 'انتخاب شهر، تعداد شب و ثبت تاریخ ورود از تقویم شمسی',
                  metaText: `${toPersianNumbers(welfarePortalConfig.accommodationCities.length)} شهر · حداکثر ${toPersianNumbers(welfarePortalConfig.accommodationMaxNights)} شب`,
                  icon: Building2,
                  iconClass: 'bg-teal-50 text-teal-800 border-teal-200',
                  glowBg: 'from-white via-white to-teal-50/50 text-stone-900 border-[#E5DEC9]',
                },
                {
                  key: 'consumables' as WelfareModuleKey,
                  indexLabel: '۰۴',
                  title:
                    welfarePortalConfig.modulesConfig.consumables?.title || 'تهیه اقلام مصرفی',
                  subtitle: 'سفارش اقلام تعاونی با قیمت مصوب و مقایسه نرخ بازار',
                  metaText: `${toPersianNumbers(activeConsumables.length)} قلم فعال · تحویل حضوری، پست یا پیک`,
                  icon: ShoppingBag,
                  iconClass: 'bg-indigo-50 text-indigo-800 border-indigo-200',
                  glowBg: 'from-white via-white to-indigo-50/45 text-stone-900 border-[#E5DEC9]',
                },
                {
                  key: 'installment_sales' as WelfareModuleKey,
                  indexLabel: '۰۵',
                  title:
                    welfarePortalConfig.modulesConfig.installment_sales?.title || 'فروش اقساطی',
                  subtitle: 'خرید اعتباری و اقساطی از فروشگاه‌های طرف قرارداد',
                  metaText: `${activePartnersList.slice(0, 2).map(p => p.name).join(' و ') || 'سرای ایرانی و آمال'} · تب سوابق`,
                  icon: Store,
                  iconClass: 'bg-orange-50 text-orange-800 border-orange-200',
                  glowBg: 'from-white via-white to-amber-50/55 text-stone-900 border-[#E5DEC9]',
                },
                {
                  key: 'recreation_tourism' as WelfareModuleKey,
                  indexLabel: '۰۶',
                  title:
                    welfarePortalConfig.modulesConfig.recreation_tourism?.title ||
                    'تفریحی و گردشگری',
                  subtitle:
                    welfarePortalConfig.modulesConfig.recreation_tourism?.subtitle ||
                    'تورها، اردوها و برنامه‌های تفریحی با ظرفیت، هزینه و ثبت‌نام آنلاین',
                  metaText: `${toPersianNumbers((recreationPrograms || []).filter(p => p.isActive !== false).length)} برنامه فعال · تور و اردو`,
                  icon: Compass,
                  iconClass: 'bg-sky-50 text-sky-800 border-sky-200',
                  glowBg: 'from-white via-white to-sky-50/55 text-stone-900 border-[#E5DEC9]',
                },
              ].filter(item => {
                const cfg = welfarePortalConfig?.modulesConfig?.[item.key];
                if (cfg && cfg.enabled === false) return false;
                if (currentUser?.role === 'customer' && item.key !== 'consumables') return false;
                return true;
              });

              return (
                <div className="p-6 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#0B2922] to-[#071E17] text-[#F3D078] flex items-center justify-center shrink-0 border border-[#F3D078]/35 shadow-sm">
                        <Gift className="w-6 h-6" />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-800">
                          <span>میز خدمات رفاهی مجتمع</span>
                          <span aria-hidden="true">·</span>
                          <span className="tabular-nums">{toPersianNumbers(welfareSubCards.length)} بخش مستقل</span>
                        </div>
                        <h3 className="text-base font-black text-stone-900">
                          {crextioConfig.welfareShowcaseTitle || 'تسهیلات و رفاهیات مجتمع فقه و حقوق اسلامی'}
                        </h3>
                        <p className="text-xs text-stone-600 leading-relaxed">
                          با انتخاب هر یک از ۶ خدمت زیر مستقیماً به صفحه اختصاصی درخواست و سوابق آن بخش هدایت می‌شوید.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => navigateDeep('Welfare')}
                      className="px-5 py-3 min-h-[44px] rounded-2xl bg-[#071E17] hover:bg-[#0E3226] text-[#F3D078] text-xs font-black flex items-center justify-center gap-2 shadow-md cursor-pointer shrink-0 whitespace-nowrap"
                    >
                      <span>ورود به نمای کامل رفاهیات</span>
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {welfareSubCards.map(item => {
                      const SubIcon = item.icon;
                      return (
                        <motion.button
                          key={item.key}
                          type="button"
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.985 }}
                          onClick={() => navigateDeep('Welfare', item.key)}
                          className={`relative overflow-hidden text-right p-4 rounded-2xl border bg-gradient-to-l ${item.glowBg} shadow-xs transition-all flex items-center justify-between gap-3 cursor-pointer`}
                        >
                          {item.featured && (
                            <span
                              aria-hidden="true"
                              className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-l from-transparent via-[#F3D078]/80 to-transparent"
                            />
                          )}
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${item.iconClass}`}
                            >
                              <SubIcon className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`text-[10px] font-black tabular-nums ${
                                    item.featured ? 'text-[#F3D078]' : 'text-stone-400'
                                  }`}
                                >
                                  {item.indexLabel}
                                </span>
                                <span className="text-xs font-black truncate">{item.title}</span>
                              </div>
                              <p
                                className={`text-[11px] leading-snug line-clamp-1 ${
                                  item.featured ? 'text-emerald-100/90' : 'text-stone-600'
                                }`}
                              >
                                {item.subtitle}
                              </p>
                              <p
                                className={`text-[10px] font-bold truncate ${
                                  item.featured ? 'text-[#F3D078]/85' : 'text-emerald-800'
                                }`}
                              >
                                {item.metaText}
                              </p>
                            </div>
                          </div>
                          <ChevronLeft
                            className={`w-4 h-4 shrink-0 ${
                              item.featured ? 'text-[#F3D078]' : 'text-stone-500'
                            }`}
                          />
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

          {/* 7. PRODUCTS */}
          {resolvedFeedTab === 'products' && (
            <div className="p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#192038] to-[#0A221A] text-[#F3D078] flex items-center justify-center shrink-0 border border-[#F3D078]/30">
                    <BookMarked className="w-7 h-7" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <h3 className="text-base font-black text-stone-900">
                      {crextioConfig.booksShowcaseTitle || 'کتاب‌ها، منشورات و محصولات چندرسانه‌ای'}
                    </h3>
                    <p className="text-xs text-stone-600 leading-relaxed max-w-2xl">
                      عرضه کتب مرجع فقه القضا، جزوات تحلیلی و درس‌گفتارهای صوتی و تصویری با تخفیف ویژه اعضای مرکز.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigateTab?.('Products')}
                  className="px-5 py-3 min-h-[44px] rounded-2xl bg-[#071E17] hover:bg-[#0E3226] text-[#F3D078] text-xs font-black flex items-center justify-center gap-2 shadow-md cursor-pointer shrink-0 whitespace-nowrap"
                >
                  <span>مشاهده تمامی آثار ({toPersianNumbers(products.length)})</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {featuredProducts.slice(0, 3).map((prod, idx) => (
                  <button
                    key={prod.id}
                    type="button"
                    onClick={() => onNavigateTab?.('Products')}
                    className="p-3.5 rounded-2xl bg-white border border-stone-200/80 hover:border-emerald-400 flex items-start gap-3 text-right cursor-pointer group hover:-translate-y-0.5 transition-all"
                  >
                    <img
                      src={resolveProductCoverUrl(prod.coverImage, prod.format, idx)}
                      alt={prod.title}
                      referrerPolicy="no-referrer"
                      onError={e => handleImageErrorFallback(e, DEFAULT_SHOWCASE_IMAGES.books_showcase)}
                      className="w-16 h-16 rounded-xl object-cover bg-stone-100 border border-stone-200/80 shrink-0"
                    />
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-xs font-black text-stone-900 group-hover:text-emerald-800 leading-snug line-clamp-2">
                        {prod.title}
                      </p>
                      <p className="text-[11px] text-stone-500 truncate">
                        {prod.authorOrPresenter} · {prod.formatTitle}
                      </p>
                      <p className="text-[11px] font-black text-emerald-800 tabular-nums">
                        {toPersianNumbers((prod.digitalPrice ?? prod.price).toLocaleString('fa-IR'))} تومان
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 8. CARTABLE */}
          {resolvedFeedTab === 'cartable' && (
            <div className="p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#071E17] to-[#113D30] text-[#F3D078] flex items-center justify-center shrink-0 border border-[#F3D078]/30">
                    <Inbox className="w-7 h-7" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <h3 className="text-base font-black text-stone-900">
                      کارتابل مکاتبات، درخواست‌ها و پیگیری اداری
                    </h3>
                    <p className="text-xs text-stone-600 leading-relaxed max-w-2xl">
                      ارسال درخواست رسمی به دبیرخانه و کمیسیون‌ها، دریافت کد رهگیری و مشاهده پاسخ کارشناسان به صورت لحظه‌ای.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigateTab?.('People')}
                  className="px-5 py-3 min-h-[44px] rounded-2xl bg-[#071E17] hover:bg-[#0E3226] text-[#F3D078] text-xs font-black flex items-center justify-center gap-2 shadow-md cursor-pointer shrink-0 whitespace-nowrap"
                >
                  <span>ورود به کارتابل و ثبت درخواست</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <div className="p-4 rounded-2xl bg-white border border-stone-200/80">
                  <span className="text-[11px] font-bold text-stone-500 block">درخواست‌های فعال</span>
                  <span className="text-base font-black text-emerald-900 mt-1 block tabular-nums">
                    {toPersianNumbers(myCartableActive)} پرونده در جریان
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-stone-200/80">
                  <span className="text-[11px] font-bold text-stone-500 block">کل سوابق مکاتبات</span>
                  <span className="text-base font-black text-stone-800 mt-1 block tabular-nums">
                    {toPersianNumbers(cartableRequests.length)} درخواست
                  </span>
                </div>
                {cartableRequests.slice(0, 1).map(req => (
                  <div
                    key={req.id}
                    className="p-4 rounded-2xl bg-white border border-stone-200/80 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-black text-stone-900 truncate">{req.title}</p>
                      <p className="text-[11px] text-stone-500 mt-1 tabular-nums">
                        کد رهگیری: {toPersianNumbers(req.trackingNumber)}
                      </p>
                    </div>
                    <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 9. SYNERGY */}
          {resolvedFeedTab === 'synergy' && (
            <div className="p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1D1B36] to-[#0B261E] text-[#F3D078] flex items-center justify-center shrink-0 border border-[#F3D078]/30">
                    <Users2 className="w-7 h-7" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <h3 className="text-base font-black text-stone-900">
                      دیوار هم‌افزایی و همفکری نخبگان
                    </h3>
                    <p className="text-xs text-stone-600 leading-relaxed max-w-2xl">
                      طرح ایده‌های علمی و اجرایی، همکاری پژوهشی میان دانش‌آموختگان و تبادل تجربه‌های قضایی در شبکه نخبگان.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigateTab?.('Synergy')}
                  className="px-5 py-3 min-h-[44px] rounded-2xl bg-[#071E17] hover:bg-[#0E3226] text-[#F3D078] text-xs font-black flex items-center justify-center gap-2 shadow-md cursor-pointer shrink-0 whitespace-nowrap"
                >
                  <span>ورود به دیوار هم‌افزایی ({toPersianNumbers(synergyPosts.length)})</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {synergyPosts.slice(0, 2).map(post => (
                  <div
                    key={post.id}
                    className="p-4 rounded-2xl bg-white border border-stone-200/80 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-black text-stone-900 truncate">{post.title}</span>
                      <MessageSquare className="w-4 h-4 text-emerald-700 shrink-0" />
                    </div>
                    <p className="text-[11px] text-stone-600 line-clamp-2 leading-relaxed">
                      {post.content}
                    </p>
                  </div>
                ))}
                {synergyPosts.length === 0 && (
                  <p className="md:col-span-2 p-5 text-center text-xs text-stone-500 bg-white rounded-2xl border border-stone-200/70">
                    موضوعات و گفتگوهای هم‌افزایی را در تالار مشاهده کنید.
                  </p>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </section>
  );
};
