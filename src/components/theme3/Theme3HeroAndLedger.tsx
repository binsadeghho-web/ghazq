import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Scale,
  ArrowLeft,
  LayoutGrid,
  Users2,
  Bell,
  ChevronLeft,
  Inbox,
  GraduationCap,
  Calendar,
  ChevronUp,
  ChevronDown,
  SlidersHorizontal,
  Palette,
  Eye,
  EyeOff,
} from 'lucide-react';
import { toPersianNumbers } from '../../utils/persianNumbers';
import { DEFAULT_SHOWCASE_IMAGES, handleImageErrorFallback } from '../../data/showcaseImages';
import type { CrextioHeroStatItem, User } from '../../types';
import type { Theme3StudioTab } from './Theme3StudioPanel';

interface QuickBtnItem {
  id: string;
  label: string;
  targetNav: string;
  visible?: boolean;
}

interface Theme3HeroAndLedgerProps {
  showHero: boolean;
  showStatusLedger: boolean;
  showLedgerBanner?: boolean;
  showLedgerCounters?: boolean;
  showLedgerCalendar?: boolean;
  showHeroPortrait: boolean;
  showWelcomeQuickButtons: boolean;
  showHeroStats: boolean;
  heroPortraitSrc: string;
  welcomeTitle: string;
  heroSchemeLabel?: string;
  currentUser: User | null;
  isAlumni: boolean;
  completionPct: number;
  quickHeroBtns: QuickBtnItem[];
  heroStats: CrextioHeroStatItem[];
  onOpenIdentityCard: () => void;
  onNavigateTab?: (tab: string) => void;
  onOpenAllServices?: () => void;
  banners: any[];
  events: any[];
  widgetConfig: {
    showStatusSummaryWidget: boolean;
    showEventsCalendarWidget: boolean;
  };
  totalActiveRequests: number;
  myEnrolledCourses: number;
  isRealAdmin: boolean;
  isAlumniPreview: boolean;
  onOpenStudio?: (tab: Theme3StudioTab) => void;
  onOpenCustomizer?: () => void;
  onToggleAlumniPreview?: () => void;
}

export const Theme3HeroAndLedger: React.FC<Theme3HeroAndLedgerProps> = ({
  showHero,
  showStatusLedger,
  showLedgerBanner = true,
  showLedgerCounters = true,
  showLedgerCalendar = true,
  showHeroPortrait,
  showWelcomeQuickButtons,
  showHeroStats,
  heroPortraitSrc,
  welcomeTitle,
  heroSchemeLabel,
  currentUser,
  isAlumni,
  completionPct,
  quickHeroBtns,
  heroStats,
  onOpenIdentityCard,
  onNavigateTab,
  onOpenAllServices,
  banners,
  events,
  widgetConfig,
  totalActiveRequests,
  myEnrolledCourses,
  isRealAdmin,
  isAlumniPreview,
  onOpenStudio,
  onOpenCustomizer,
  onToggleAlumniPreview,
}) => {
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [bannerIdx, setBannerIdx] = useState(0);
  const [calendarExpanded, setCalendarExpanded] = useState(false);

  const activeBanners = banners.filter(b => b.isActive);
  const safeBannerIdx = activeBanners.length > 0 ? bannerIdx % activeBanners.length : 0;
  const topBanner = showLedgerBanner ? activeBanners[safeBannerIdx] : undefined;

  const showCountersBlock = showLedgerCounters && widgetConfig.showStatusSummaryWidget !== false;
  const showCalendarBlock =
    showLedgerCalendar && widgetConfig.showEventsCalendarWidget !== false && events.length > 0;

  const hasLedgerContent =
    showStatusLedger && Boolean(topBanner || showCountersBlock || showCalendarBlock);

  if (!showHero && !hasLedgerContent && !isRealAdmin) return null;

  const completionClamped = Math.max(0, Math.min(100, completionPct));
  const ringCircumference = 2 * Math.PI * 14;
  const ringOffset = ringCircumference * (1 - completionClamped / 100);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* HERO / MEMBER PASS (Inspired directly by Mobile Hero Member Pass) */}
        {showHero && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className={`${
              hasLedgerContent ? 'lg:col-span-7' : 'lg:col-span-12'
            } relative overflow-hidden rounded-[30px] bg-gradient-to-br from-[#061A14] via-[#0B2A20] to-[#082119] text-white p-6 xl:p-7 border border-[#F3D078]/28 shadow-[0_24px_54px_-24px_rgba(6,26,20,0.72)] flex flex-col justify-between gap-5`}
          >
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 luxury-lattice-bg opacity-65" />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-l from-transparent via-[#F3D078]/80 to-transparent"
            />

            <div className="relative z-10 space-y-5">
              {/* Top Member Pass Identity Bar */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  {showHeroPortrait && (
                    <div className="relative p-[2.5px] rounded-[20px] bg-gradient-to-br from-[#F3D078] via-amber-500/50 to-emerald-400/40 shrink-0 shadow-md">
                      {heroPortraitSrc && !heroImgFailed ? (
                        <img
                          src={heroPortraitSrc}
                          alt={currentUser?.fullName || 'تصویر کاربر'}
                          referrerPolicy="no-referrer"
                          onError={e => {
                            const fallback = DEFAULT_SHOWCASE_IMAGES.hero_portrait;
                            if (fallback && e.currentTarget.src !== fallback) {
                              handleImageErrorFallback(e, fallback);
                            } else {
                              setHeroImgFailed(true);
                            }
                          }}
                          className="w-14 h-14 xl:w-16 xl:h-16 rounded-[18px] object-cover object-top bg-[#09231B]"
                        />
                      ) : (
                        <div className="w-14 h-14 xl:w-16 xl:h-16 rounded-[18px] bg-[#0B291F] flex items-center justify-center font-black text-base text-[#F3D078]">
                          {currentUser?.avatarText || 'ف'}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#F3D078]">
                      <Scale className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{heroSchemeLabel || 'طرح میزان'}</span>
                      <span aria-hidden="true" className="opacity-45">·</span>
                      <span className="text-emerald-200/90 truncate tabular-nums">
                        دوره {toPersianNumbers(currentUser?.graduationYear || '۱۳۹۵')}
                      </span>
                    </div>
                    <p className="text-sm text-emerald-100/90 font-semibold truncate mt-1">
                      {currentUser?.roleTitle || (isAlumni ? 'دانش‌آموخته مجمع' : 'مدیر سامانه')}
                    </p>
                  </div>
                </div>

                {currentUser && (
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onOpenIdentityCard}
                    className="flex items-center gap-2.5 px-3.5 py-2 min-h-[48px] rounded-2xl bg-white/10 hover:bg-white/16 border border-[#F3D078]/35 text-xs font-black text-white transition-colors cursor-pointer shrink-0"
                    aria-label="کارت اطلاعات هویتی من"
                  >
                    <svg className="w-8 h-8 -rotate-90 shrink-0" viewBox="0 0 34 34" aria-hidden="true">
                      <circle
                        cx="17"
                        cy="17"
                        r="14"
                        fill="none"
                        stroke="rgba(255,255,255,0.16)"
                        strokeWidth="2.5"
                      />
                      <motion.circle
                        cx="17"
                        cy="17"
                        r="14"
                        fill="none"
                        stroke="#F3D078"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeDasharray={ringCircumference}
                        initial={{ strokeDashoffset: ringCircumference }}
                        animate={{ strokeDashoffset: ringOffset }}
                        transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                      />
                    </svg>
                    <div className="text-right leading-tight">
                      <span className="block text-[10px] text-[#F3D078] font-bold">کارت هویت</span>
                      <span className="tabular-nums text-xs font-black">{toPersianNumbers(completionPct)}٪ تکمیل</span>
                    </div>
                  </motion.button>
                )}
              </div>

              {/* Editorial Welcome Headline */}
              <div className="space-y-1.5">
                <h1 className="text-xl xl:text-[24px] leading-[1.4] font-black text-white tracking-tight text-balance">
                  {welcomeTitle}
                </h1>
                {currentUser?.organization && (
                  <p className="text-xs text-emerald-100/75 font-medium truncate">
                    {currentUser.organization}
                  </p>
                )}
              </div>

              {/* Quick Action Buttons */}
              {showWelcomeQuickButtons && (
                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  {quickHeroBtns.length > 0 ? (
                    <>
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.96 }}
                        onClick={() => onNavigateTab?.(quickHeroBtns[0].targetNav)}
                        className="min-h-[44px] px-5 py-2.5 rounded-2xl bg-gradient-to-l from-[#D4AF37] via-[#E8C15A] to-[#F3D078] text-[#071E17] text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-black/25 cursor-pointer whitespace-nowrap"
                      >
                        <span>{quickHeroBtns[0].label}</span>
                        <ArrowLeft className="w-4 h-4 shrink-0" />
                      </motion.button>
                      {quickHeroBtns[1] ? (
                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.96 }}
                          onClick={() => onNavigateTab?.(quickHeroBtns[1].targetNav)}
                          className="min-h-[44px] px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/18 border border-white/15 text-white text-xs font-bold flex items-center justify-center cursor-pointer whitespace-nowrap"
                        >
                          <span>{quickHeroBtns[1].label}</span>
                        </motion.button>
                      ) : (
                        onOpenAllServices && (
                          <motion.button
                            type="button"
                            whileTap={{ scale: 0.96 }}
                            onClick={onOpenAllServices}
                            className="min-h-[44px] px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/18 border border-white/15 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                          >
                            <LayoutGrid className="w-4 h-4 text-[#F3D078]" />
                            <span>همه خدمات</span>
                          </motion.button>
                        )
                      )}
                    </>
                  ) : (
                    <>
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.96 }}
                        onClick={() => onNavigateTab?.('People')}
                        className="min-h-[44px] px-5 py-2.5 rounded-2xl bg-gradient-to-l from-[#D4AF37] via-[#E8C15A] to-[#F3D078] text-[#071E17] text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-black/25 cursor-pointer whitespace-nowrap"
                      >
                        <span>کارتابل و پیگیری</span>
                        <ArrowLeft className="w-4 h-4 shrink-0" />
                      </motion.button>
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.96 }}
                        onClick={() => onNavigateTab?.('Synergy')}
                        className="min-h-[44px] px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/18 border border-white/15 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        <Users2 className="w-4 h-4 text-[#F3D078]" />
                        <span>هم‌افزایی</span>
                      </motion.button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Stats Row */}
            {showHeroStats && heroStats.length > 0 && (
              <div className="relative z-10 pt-4 border-t border-[#F3D078]/18 grid grid-cols-3 gap-3 text-center">
                {heroStats.map((stat, statIdx) => (
                  <div
                    key={stat.id}
                    className={`min-w-0 ${statIdx > 0 ? 'border-r border-white/10 pr-3' : ''}`}
                  >
                    <p className="text-lg xl:text-xl font-black text-[#F3D078] tabular-nums tracking-tight">
                      {toPersianNumbers(stat.val.toLocaleString('fa-IR'))}
                    </p>
                    <p className="text-[11px] text-emerald-100/80 font-medium truncate mt-0.5">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </motion.section>
        )}

        {/* STATUS LEDGER CARD (Banners, Active Counters, Events Calendar) */}
        {hasLedgerContent && (
          <section
            aria-label="وضعیت جاری و تقویم"
            className={`${
              showHero ? 'lg:col-span-5' : 'lg:col-span-12'
            } bg-white rounded-[30px] border border-[#DDD3B8]/85 overflow-hidden shadow-[0_14px_34px_-20px_rgba(7,30,23,0.16)] divide-y divide-stone-100 flex flex-col justify-between`}
          >
            {topBanner && (
              <div className="bg-[#FBF8EF] p-4 px-5 flex items-center justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-800 flex items-center justify-center shrink-0">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-stone-900 truncate">{topBanner.title}</p>
                    <p className="text-[11px] text-stone-600 line-clamp-1 mt-0.5">{topBanner.message}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {activeBanners.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setBannerIdx(i => (i + 1) % activeBanners.length)}
                      className="w-9 h-9 rounded-xl bg-white border border-amber-200/80 flex items-center justify-center text-stone-700 hover:bg-amber-50 cursor-pointer"
                      aria-label="اطلاعیه بعدی"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  )}
                  {topBanner.actionTab && (
                    <button
                      type="button"
                      onClick={() => onNavigateTab?.(topBanner.actionTab)}
                      className="px-3 py-1.5 min-h-[36px] rounded-xl bg-[#071E17] hover:bg-[#0D3327] text-[#F3D078] text-[11px] font-black cursor-pointer whitespace-nowrap"
                    >
                      {topBanner.actionLabel || 'مشاهده'}
                    </button>
                  )}
                </div>
              </div>
            )}

            {showCountersBlock && (
              <div className="grid grid-cols-2 divide-x divide-x-reverse divide-stone-100 flex-1">
                <button
                  type="button"
                  onClick={() => onNavigateTab?.('People')}
                  className="p-5 flex items-center justify-between gap-3 text-right hover:bg-stone-50/80 active:scale-[0.985] transition-all cursor-pointer"
                >
                  <div className="min-w-0">
                    <span className="text-3xl font-black text-stone-900 tabular-nums leading-none block">
                      {toPersianNumbers(totalActiveRequests)}
                    </span>
                    <span className="text-xs font-bold text-stone-600 mt-2 block truncate">
                      پرونده و نوبت فعال
                    </span>
                  </div>
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-100 flex items-center justify-center shrink-0">
                    <Inbox className="w-5 h-5" />
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateTab?.('Courses')}
                  className="p-5 flex items-center justify-between gap-3 text-right hover:bg-stone-50/80 active:scale-[0.985] transition-all cursor-pointer"
                >
                  <div className="min-w-0">
                    <span className="text-3xl font-black text-stone-900 tabular-nums leading-none block">
                      {toPersianNumbers(myEnrolledCourses)}
                    </span>
                    <span className="text-xs font-bold text-stone-600 mt-2 block truncate">
                      دوره ثبت‌نام‌شده
                    </span>
                  </div>
                  <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-800 border border-amber-100 flex items-center justify-center shrink-0">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                </button>
              </div>
            )}

            {showCalendarBlock && (
              <div>
                <button
                  type="button"
                  onClick={() => events.length > 1 && setCalendarExpanded(v => !v)}
                  className="w-full p-4 px-5 flex items-center justify-between gap-3 text-right hover:bg-stone-50/70 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-stone-100 text-emerald-900 flex items-center justify-center shrink-0">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-stone-900 truncate">{events[0].title}</p>
                      <p className="text-[11px] text-stone-500 mt-0.5 truncate tabular-nums">
                        <span>{toPersianNumbers(events[0].eventDate)}</span>
                        {events[0].eventTime && (
                          <>
                            <span aria-hidden="true"> · </span>
                            <span>{toPersianNumbers(events[0].eventTime)}</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  {events.length > 1 && (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-800 shrink-0 tabular-nums">
                      <span>{toPersianNumbers(events.length)} رویداد</span>
                      {calendarExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </span>
                  )}
                </button>

                <AnimatePresence initial={false}>
                  {calendarExpanded && events.length > 1 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="px-5 pb-3.5 pt-1 border-t border-stone-100 divide-y divide-stone-100 overflow-hidden bg-stone-50/40"
                    >
                      {events.slice(1, 5).map(ev => (
                        <div key={ev.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                          <span className="font-bold text-stone-800 truncate">{ev.title}</span>
                          <span className="text-[11px] text-emerald-800 font-bold shrink-0 tabular-nums">
                            {toPersianNumbers(ev.eventDate)}
                          </span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </section>
        )}
      </div>

      {/* Admin Compact Controls directly under Hero */}
      {isRealAdmin && (
        <div className="flex flex-wrap items-center gap-2">
          {!isAlumniPreview && onOpenStudio && (
            <>
              <button
                type="button"
                onClick={() => onOpenStudio('layout')}
                className="flex items-center gap-1.5 px-3.5 py-2 min-h-[38px] rounded-xl bg-[#071E17] text-[#F3D078] text-xs font-bold hover:bg-[#0D3327] transition-colors cursor-pointer border border-[#F3D078]/25 whitespace-nowrap"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>تنظیمات کامل تم ۳</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenStudio('hero_dock')}
                className="flex items-center gap-1.5 px-3.5 py-2 min-h-[38px] rounded-xl bg-white border border-stone-200/90 text-stone-800 hover:bg-stone-50 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-700" />
                <span>ویرایش دسترسی‌های سریع</span>
              </button>
            </>
          )}
          {!isAlumniPreview && onOpenCustomizer && (
            <button
              type="button"
              onClick={onOpenCustomizer}
              className="flex items-center gap-1.5 px-3.5 py-2 min-h-[38px] rounded-xl bg-white border border-stone-200/90 text-stone-800 hover:bg-stone-50 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
            >
              <Palette className="w-3.5 h-3.5 text-emerald-700" />
              <span>افتخارات و منوی اصلی</span>
            </button>
          )}
          {onToggleAlumniPreview && (
            <button
              type="button"
              onClick={onToggleAlumniPreview}
              className={`flex items-center gap-1.5 px-3.5 py-2 min-h-[38px] rounded-xl text-xs font-bold transition-colors cursor-pointer border whitespace-nowrap ${
                isAlumniPreview
                  ? 'bg-amber-500 text-stone-950 border-amber-600'
                  : 'bg-white border-stone-200/90 text-stone-700 hover:bg-stone-50'
              }`}
            >
              {isAlumniPreview ? (
                <EyeOff className="w-3.5 h-3.5" />
              ) : (
                <Eye className="w-3.5 h-3.5 text-emerald-700" />
              )}
              <span>{isAlumniPreview ? 'خروج از پیش‌نمایش' : 'نمای دانش‌آموخته'}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
