import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
  Info,
  ArrowLeft,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import { CounselingFieldItem } from '../../types';
import { CounselingFieldsShowcase } from './CounselingFieldsShowcase';

interface CtaPalette {
  name: string;
  buttonBg: string;
  glowBg: string;
  ringBorder: string;
}

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
    name: 'یاقوت اصیل',
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

interface CounselingLandingHeroProps {
  variant: 'specialized' | 'general';
  badgeLabel: string;
  introTitle: string;
  introBody: string;
  calloutTitle: string;
  calloutSubtitle: string;
  ctaButtonLabel: string;
  descriptionButtonLabel: string;
  fieldsSectionTitle: string;
  fieldsSectionSubtitle?: string;
  fields: CounselingFieldItem[];
  myRequestsCount: number;
  onStartWizard: (preselectedField?: CounselingFieldItem) => void;
  onOpenDescriptionModal: () => void;
  onViewHistory: () => void;
}

export const CounselingLandingHero: React.FC<CounselingLandingHeroProps> = ({
  variant,
  badgeLabel,
  introTitle,
  introBody,
  calloutTitle,
  calloutSubtitle,
  ctaButtonLabel,
  descriptionButtonLabel,
  fieldsSectionTitle,
  fieldsSectionSubtitle,
  fields,
  myRequestsCount,
  onStartWizard,
  onOpenDescriptionModal,
  onViewHistory,
}) => {
  const [paletteIdx, setPaletteIdx] = useState(variant === 'specialized' ? 1 : 0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setPaletteIdx(prev => (prev + 1) % CTA_PALETTES.length);
    }, 30000);
    return () => window.clearInterval(timer);
  }, []);

  const palette = CTA_PALETTES[paletteIdx];

  return (
    <div className="space-y-7">
      {/* Simple & Clear Intro Hero (Reforms 45 / 49) */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-gradient-to-br from-slate-950 via-[#0E1E19] to-slate-950 text-white shadow-xl">
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 p-6 sm:p-8 lg:p-10 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="flex items-center gap-2 text-xs text-amber-300 font-bold">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>{badgeLabel}</span>
              </div>

              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white leading-tight">
                {introTitle}
              </h2>

              <p className="text-xs sm:text-sm text-slate-200/90 leading-7 whitespace-pre-line">
                {introBody}
              </p>
            </div>

            <div className="flex flex-wrap lg:flex-col items-stretch gap-2.5 shrink-0">
              <button
                type="button"
                onClick={onOpenDescriptionModal}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold flex items-center justify-center gap-2 transition-colors backdrop-blur-sm cursor-pointer"
              >
                <Info className="w-4 h-4 text-amber-300 shrink-0" />
                <span>{descriptionButtonLabel || 'توضیحات'}</span>
              </button>

              {myRequestsCount > 0 && (
                <button
                  type="button"
                  onClick={onViewHistory}
                  className="px-4 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Layers className="w-4 h-4 shrink-0" />
                  <span>سوابق درخواست‌های من ({myRequestsCount})</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Prominent Callout Box with 30s Animated Color-Shifting CTA */}
      <div className="relative rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-lg overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.06, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className={`absolute -top-20 -left-20 w-72 h-72 rounded-full blur-3xl pointer-events-none transition-colors duration-[3000ms] ${palette.glowBg}`}
        />

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl text-center lg:text-right">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>تکمیل مرحله‌به‌مرحله درخواست با راهنمای دائمی</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-snug">
              {calloutTitle}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-7">
              {calloutSubtitle}
            </p>
          </div>

          <div className="flex flex-col items-center gap-2.5 shrink-0">
            <div className="relative">
              <motion.div
                animate={{ scale: [1, 1.07, 1], opacity: [0.45, 0.12, 0.45] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                className={`absolute -inset-2 rounded-2xl blur-md pointer-events-none transition-colors duration-[3000ms] ${palette.glowBg}`}
              />

              <motion.button
                type="button"
                onClick={() => onStartWizard()}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                className={`relative overflow-hidden px-7 py-4 sm:px-9 sm:py-5 rounded-2xl text-white font-black text-sm sm:text-base shadow-2xl border ${palette.ringBorder} ${palette.buttonBg} transition-all duration-[3500ms] ease-in-out flex items-center gap-3 cursor-pointer`}
              >
                <motion.span
                  aria-hidden="true"
                  animate={{ x: ['140%', '-160%'] }}
                  transition={{ duration: 2.8, repeat: Infinity, repeatDelay: 2.6, ease: 'easeInOut' }}
                  className="pointer-events-none absolute inset-y-0 w-24 bg-gradient-to-l from-transparent via-white/30 to-transparent skew-x-[-20deg]"
                />
                <Sparkles className="relative z-10 w-5 h-5 text-amber-200 shrink-0" />
                <span className="relative z-10 tracking-tight">{ctaButtonLabel}</span>
                <ArrowLeft className="relative z-10 w-5 h-5 shrink-0" />
              </motion.button>
            </div>

            <button
              type="button"
              onClick={onOpenDescriptionModal}
              className="text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:underline cursor-pointer"
            >
              مشاهده {descriptionButtonLabel || 'توضیحات'} پیش از شروع
            </button>
          </div>
        </div>
      </div>

      {/* Counseling Fields Showcase (زمینه‌های مشاوره) */}
      <CounselingFieldsShowcase
        title={fieldsSectionTitle}
        subtitle={fieldsSectionSubtitle}
        fields={fields}
        onSelectField={f => onStartWizard(f)}
        variant={variant}
      />
    </div>
  );
};
