import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
  BookOpen,
  Compass,
  Home,
  Info,
  Phone,
  Clock,
  MapPin,
  MessageSquare,
  ArrowLeft,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import { ResearchPortalConfig } from '../../../types';
import { resolveShowcaseImageUrl } from '../../../data/showcaseImages';

interface ResearchLandingHeroProps {
  config: ResearchPortalConfig;
  imageOverrides?: Record<string, string>;
  onStartWizard: () => void;
  onOpenGuidance: () => void;
  onViewMyRequests: () => void;
  myRequestsCount: number;
}

interface CtaPalette {
  name: string;
  buttonBg: string;
  glowBg: string;
  ringBorder: string;
}

// Curated high-contrast WCAG AA palettes that rotate smoothly every 30 seconds (Reform 32)
const CTA_PALETTES: CtaPalette[] = [
  {
    name: 'زمرد سلطنتی',
    buttonBg: 'bg-gradient-to-l from-emerald-700 via-teal-600 to-emerald-800 hover:from-emerald-600 hover:to-teal-500',
    glowBg: 'bg-emerald-500/30',
    ringBorder: 'border-emerald-400/50',
  },
  {
    name: 'لاجورد علمی',
    buttonBg: 'bg-gradient-to-l from-indigo-700 via-blue-600 to-indigo-900 hover:from-indigo-600 hover:to-blue-500',
    glowBg: 'bg-indigo-500/30',
    ringBorder: 'border-indigo-400/50',
  },
  {
    name: 'کهربای زرین',
    buttonBg: 'bg-gradient-to-l from-amber-700 via-orange-600 to-amber-800 hover:from-amber-600 hover:to-orange-500',
    glowBg: 'bg-amber-500/30',
    ringBorder: 'border-amber-400/50',
  },
  {
    name: 'یاقوت پژوهشی',
    buttonBg: 'bg-gradient-to-l from-rose-800 via-pink-700 to-rose-900 hover:from-rose-700 hover:to-pink-600',
    glowBg: 'bg-rose-500/30',
    ringBorder: 'border-rose-400/50',
  },
  {
    name: 'فیروزه حرم',
    buttonBg: 'bg-gradient-to-l from-cyan-800 via-sky-700 to-teal-900 hover:from-cyan-700 hover:to-sky-600',
    glowBg: 'bg-cyan-500/30',
    ringBorder: 'border-cyan-400/50',
  },
];

export const ResearchLandingHero: React.FC<ResearchLandingHeroProps> = ({
  config,
  imageOverrides,
  onStartWizard,
  onOpenGuidance,
  onViewMyRequests,
  myRequestsCount,
}) => {
  const [paletteIdx, setPaletteIdx] = useState(0);

  // Reform 32: Smoothly shift button palette every 30 seconds
  useEffect(() => {
    const timer = window.setInterval(() => {
      setPaletteIdx(prev => (prev + 1) % CTA_PALETTES.length);
    }, 30000);
    return () => window.clearInterval(timer);
  }, []);

  const palette = CTA_PALETTES[paletteIdx];
  const heroBgSrc = resolveShowcaseImageUrl('research_promo', imageOverrides);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Main Architectural Intro Banner */}
      <div className="relative rounded-[26px] sm:rounded-3xl overflow-hidden border border-[#F3D078]/25 sm:border-slate-200/80 dark:border-slate-800 bg-[#071E17] sm:bg-slate-950 text-white shadow-xl">
        <div className="absolute inset-0 pointer-events-none opacity-30">
          <img
            src={heroBgSrc}
            alt={config.sectionTitle}
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#071E17] via-[#071E17]/85 to-[#071E17]/55 sm:from-slate-950 sm:via-slate-950/85 sm:to-slate-950/50" />
        </div>
        <div className="absolute inset-0 luxury-lattice-bg opacity-35 pointer-events-none" />
        <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#F3D078]/70 to-transparent pointer-events-none" />

        <div className="relative z-10 p-4 sm:p-8 lg:p-10 space-y-5 sm:space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2 text-xs text-amber-300 font-bold">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>معاونت پژوهش مرکز فقه و حقوق اسلامی</span>
                <span className="text-slate-500">·</span>
                <span className="text-emerald-300">راهبری پایان‌نامه و مقاله</span>
              </div>

              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white leading-tight">
                {config.landingIntroTitle}
              </h2>

              <p className="text-xs sm:text-sm text-slate-200/90 leading-7 whitespace-pre-line">
                {config.landingIntroBody}
              </p>
            </div>

            {/* Reform 36 Always-accessible Guidance Button & Quick My-Requests Link */}
            <div className="flex flex-wrap lg:flex-col items-stretch gap-2.5 shrink-0">
              <button
                type="button"
                onClick={onOpenGuidance}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold flex items-center justify-center gap-2 transition-colors backdrop-blur-sm cursor-pointer"
              >
                <Info className="w-4 h-4 text-amber-300 shrink-0" />
                <span>توضیحات و راهنمای کامل</span>
              </button>

              {myRequestsCount > 0 && (
                <button
                  type="button"
                  onClick={onViewMyRequests}
                  className="px-4 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Layers className="w-4 h-4 shrink-0" />
                  <span>مشاهده درخواست‌های من ({myRequestsCount})</span>
                </button>
              )}
            </div>
          </div>

          {/* Service Pillars Explaining What Is Provided (Reform 32) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 backdrop-blur-xs">
              <div className="flex items-center gap-2.5 text-amber-300 font-black text-xs">
                <BookOpen className="w-4 h-4 shrink-0" />
                <span>پک کامل راهبری پایان‌نامه و مقاله</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                همراهی جامع از ایده‌پردازی، انتخاب موضوع، نگارش پروپوزال و فصل‌بندی تا ویراستاری علمی و آماده‌سازی دفاع یا چاپ، به‌صورت حضوری یا آنلاین.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 backdrop-blur-xs">
              <div className="flex items-center gap-2.5 text-emerald-300 font-black text-xs">
                <Compass className="w-4 h-4 shrink-0" />
                <span>مشورت و راهبری موردی تخصصی</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                رفع نیازهای مشخص پژوهش شامل گزینش موضوع، اصلاح پروپوزال، طراحی ساختار، یا بازبینی و نقد علمی متن تدوین‌شده.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 backdrop-blur-xs">
              <div className="flex items-center gap-2.5 text-sky-300 font-black text-xs">
                <Home className="w-4 h-4 shrink-0" />
                <span>استاد معین و اسکان مطالعاتی قم</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                بهره‌مندی از اساتید برجسته فقه و حقوق اسلامی به همراه امکان درخواست اسکان موقت مطالعاتی در شهر مقدس قم برای پک کامل حضوری.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Prominent Interactive Callout Box with 30-second Color-Shifting Animated CTA Button (Reform 32) */}
      <div className="relative rounded-[26px] sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-8 lg:p-10 shadow-lg overflow-hidden">
        {/* Soft syncing ambient halo */}
        <motion.div
          animate={{ scale: [1, 1.06, 1], opacity: [0.35, 0.55, 0.35] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className={`absolute -top-20 -left-20 w-72 h-72 rounded-full blur-3xl pointer-events-none transition-colors duration-[3000ms] ${palette.glowBg}`}
        />
        <motion.div
          animate={{ scale: [1, 1.08, 1], opacity: [0.25, 0.45, 0.25] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
          className={`absolute -bottom-24 -right-24 w-72 h-72 rounded-full blur-3xl pointer-events-none transition-colors duration-[3000ms] ${palette.glowBg}`}
        />

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl text-center lg:text-right">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-400">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>مسیر گام‌به‌گام و هوشمند درخواست خدمات پژوهشی</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-snug">
              {config.landingCalloutTitle}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-7">
              {config.landingCalloutSubtitle}
            </p>
          </div>

          <div className="flex flex-col items-center gap-2.5 shrink-0">
            <div className="relative">
              {/* Outer pulse aura */}
              <motion.div
                animate={{ scale: [1, 1.07, 1], opacity: [0.45, 0.12, 0.45] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                className={`absolute -inset-2 rounded-2xl blur-md pointer-events-none transition-colors duration-[3000ms] ${palette.glowBg}`}
              />

              <motion.button
                type="button"
                onClick={onStartWizard}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                className={`relative overflow-hidden px-8 py-4 sm:px-10 sm:py-5 rounded-2xl text-white font-black text-sm sm:text-base shadow-2xl border ${palette.ringBorder} ${palette.buttonBg} transition-all duration-[3500ms] ease-in-out flex items-center gap-3 cursor-pointer`}
              >
                {/* Continuous light sweep effect */}
                <motion.span
                  aria-hidden="true"
                  animate={{ x: ['140%', '-160%'] }}
                  transition={{ duration: 2.8, repeat: Infinity, repeatDelay: 2.6, ease: 'easeInOut' }}
                  className="pointer-events-none absolute inset-y-0 w-24 bg-gradient-to-l from-transparent via-white/30 to-transparent skew-x-[-20deg]"
                />

                <motion.span
                  animate={{ rotate: [0, 14, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="relative z-10 w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center shrink-0"
                >
                  <Sparkles className="w-5 h-5 text-amber-200" />
                </motion.span>

                <span className="relative z-10 tracking-tight">
                  {config.ctaButtonLabel || 'ثبت درخواست راهبری'}
                </span>

                <ArrowLeft className="relative z-10 w-5 h-5 shrink-0" />
              </motion.button>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
              <span>تغییر طیف رنگ هر ۳۰ ثانیه: {palette.name}</span>
              <span>·</span>
              <button
                type="button"
                onClick={onOpenGuidance}
                className="font-bold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
              >
                مشاهده توضیحات قبل از ثبت
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reform 37: Always Visible Center Contact Phones & Support Channels */}
      <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/70 p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                {config.contactCenterTitle}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                پاسخگویی مستقیم کارشناسان دبیرخانه پژوهش در ساعات اداری
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenGuidance}
            className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer self-start md:self-auto"
          >
            <Info className="w-3.5 h-3.5 text-amber-500" />
            <span>توضیحات</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">شماره تماس مستقیم مرکز:</span>
            <div className="font-mono tabular-nums font-black text-sm text-slate-900 dark:text-white">
              {config.contactPhone}
            </div>
            {config.contactExtension && (
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold block">
                {config.contactExtension}
              </span>
            )}
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5 text-sky-500" />
              <span>همراه / پیام‌رسان دبیرخانه:</span>
            </span>
            <div className="font-bold text-slate-900 dark:text-white leading-relaxed">
              {config.contactMobileOrMessenger || 'ثبت نشده'}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>ساعات پاسخگویی:</span>
            </span>
            <div className="font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
              {config.contactHours || 'شنبه تا چهارشنبه ۸:۳۰ الی ۱۴:۳۰'}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              <span>نشانی دبیرخانه:</span>
            </span>
            <div className="font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
              {config.contactAddress || 'قم، مجتمع علمی مرکز فقه و حقوق اسلامی'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
