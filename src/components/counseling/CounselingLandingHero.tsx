import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Info,
  ArrowLeft,
  CheckCircle2,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { CounselingFieldItem, CounselingLandingInfoCard } from '../../types';
import { CounselingFieldsShowcase } from './CounselingFieldsShowcase';
import { toPersianNumbers } from '../../utils/persianNumbers';

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
    glowBg: 'bg-emerald-500/25',
    ringBorder: 'border-emerald-400/50',
  },
  {
    name: 'لاجورد علمی',
    buttonBg: 'bg-gradient-to-l from-indigo-700 via-blue-600 to-indigo-900 hover:from-indigo-600 hover:to-blue-500',
    glowBg: 'bg-indigo-500/25',
    ringBorder: 'border-indigo-400/50',
  },
  {
    name: 'کهربای زرین',
    buttonBg: 'bg-gradient-to-l from-amber-700 via-orange-600 to-amber-800 hover:from-amber-600 hover:to-orange-500',
    glowBg: 'bg-amber-500/25',
    ringBorder: 'border-amber-400/50',
  },
  {
    name: 'یاقوت اصیل',
    buttonBg: 'bg-gradient-to-l from-rose-800 via-pink-700 to-rose-900 hover:from-rose-700 hover:to-pink-600',
    glowBg: 'bg-rose-500/25',
    ringBorder: 'border-rose-400/50',
  },
  {
    name: 'فیروزه حرم',
    buttonBg: 'bg-gradient-to-l from-cyan-800 via-sky-700 to-teal-900 hover:from-cyan-700 hover:to-sky-600',
    glowBg: 'bg-cyan-500/25',
    ringBorder: 'border-cyan-400/50',
  },
];

interface CounselingLandingHeroProps {
  variant: 'specialized' | 'general';
  badgeLabel: string;
  introTitle: string;
  introBody: string;
  historyButtonLabel?: string;
  calloutBadgeLabel?: string;
  calloutTitle: string;
  calloutSubtitle: string;
  ctaButtonLabel: string;
  calloutSecondaryLinkLabel?: string;
  descriptionButtonLabel: string;
  fieldsShowcaseBadgeLabel?: string;
  fieldsSectionTitle: string;
  fieldsSectionSubtitle?: string;
  fieldsShowcaseHelperText?: string;
  fieldsCardCtaLabel?: string;
  fieldsShowcaseEmptyText?: string;
  landingInfoCardsTitle?: string;
  landingInfoCardsSubtitle?: string;
  landingInfoCards?: CounselingLandingInfoCard[];
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
  historyButtonLabel = 'سوابق درخواست‌های من',
  calloutBadgeLabel = 'تکمیل مرحله‌به‌مرحله درخواست با راهنمای دائمی',
  calloutTitle,
  calloutSubtitle,
  ctaButtonLabel,
  calloutSecondaryLinkLabel,
  descriptionButtonLabel,
  fieldsShowcaseBadgeLabel,
  fieldsSectionTitle,
  fieldsSectionSubtitle,
  fieldsShowcaseHelperText,
  fieldsCardCtaLabel,
  fieldsShowcaseEmptyText,
  landingInfoCardsTitle,
  landingInfoCardsSubtitle,
  landingInfoCards = [],
  fields,
  myRequestsCount,
  onStartWizard,
  onOpenDescriptionModal,
  onViewHistory,
}) => {
  const [paletteIdx, setPaletteIdx] = useState(variant === 'specialized' ? 1 : 0);
  const [mobileIntroOpen, setMobileIntroOpen] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setPaletteIdx(prev => (prev + 1) % CTA_PALETTES.length);
    }, 30000);
    return () => window.clearInterval(timer);
  }, []);

  const palette = CTA_PALETTES[paletteIdx];
  const enabledInfoCards = (landingInfoCards || []).filter(c => c.enabled && (c.title?.trim() || c.body?.trim()));

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* =====================================================================
          MOBILE (< sm): Zero-Bloat Task-First Flow (Fields Immediately On Top)
         ===================================================================== */}
      <div className="sm:hidden space-y-4">
        <CounselingFieldsShowcase
          badgeLabel={fieldsShowcaseBadgeLabel}
          title={fieldsSectionTitle}
          subtitle={fieldsSectionSubtitle}
          helperText={fieldsShowcaseHelperText}
          cardCtaLabel={fieldsCardCtaLabel}
          emptyText={fieldsShowcaseEmptyText}
          fields={fields}
          onSelectField={f => onStartWizard(f)}
          variant={variant}
        />

        {/* Horizontal Snap Strip for Optional Guide Cards (Zero Vertical Scroll Bloat) */}
        {enabledInfoCards.length > 0 && (
          <div className="space-y-2">
            {landingInfoCardsTitle?.trim() && (
              <h4 className="text-xs font-black text-slate-800 dark:text-white px-0.5">
                {landingInfoCardsTitle}
              </h4>
            )}
            <div className="flex gap-2.5 overflow-x-auto snap-x snap-mandatory pb-1 scrollbar-none">
              {enabledInfoCards.map(card => (
                <div
                  key={card.id}
                  className="min-w-[235px] max-w-[265px] snap-start shrink-0 p-3.5 rounded-[20px] bg-white/95 dark:bg-slate-900/75 border border-stone-200/80 dark:border-white/10 shadow-2xs space-y-1.5"
                >
                  {card.badge?.trim() && (
                    <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 block">
                      {card.badge}
                    </span>
                  )}
                  {card.title?.trim() && (
                    <h5 className="font-black text-xs text-slate-900 dark:text-white leading-snug">
                      {card.title}
                    </h5>
                  )}
                  {card.body?.trim() && (
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
                      {card.body}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Compact Expandable Intro & Guide Accordion (Collapsed by default to avoid scroll bloat) */}
        {(introTitle?.trim() || introBody?.trim()) && (
          <div className="rounded-[20px] bg-white/90 dark:bg-slate-900/70 border border-stone-200/80 dark:border-white/10 overflow-hidden">
            <button
              type="button"
              onClick={() => setMobileIntroOpen(v => !v)}
              className="w-full px-3.5 py-3 min-h-[44px] flex items-center justify-between gap-2 text-right cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Info className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                <span className="text-xs font-black text-slate-800 dark:text-white truncate">
                  {introTitle || 'درباره خدمات و راهنمای پذیرش'}
                </span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                  mobileIntroOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            <AnimatePresence initial={false}>
              {mobileIntroOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22 }}
                  className="overflow-hidden"
                >
                  <div className="px-3.5 pb-3.5 pt-1 border-t border-stone-100 dark:border-slate-800 space-y-2.5">
                    {introBody && (
                      <p className="text-[11.5px] text-slate-600 dark:text-slate-300 leading-6 whitespace-pre-line">
                        {introBody}
                      </p>
                    )}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => onStartWizard()}
                        className="flex-1 py-2.5 min-h-[42px] rounded-xl bg-emerald-800 text-white text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>{ctaButtonLabel}</span>
                      </button>
                      <button
                        type="button"
                        onClick={onOpenDescriptionModal}
                        className="px-3.5 py-2.5 min-h-[42px] rounded-xl bg-stone-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer"
                      >
                        {descriptionButtonLabel || 'توضیحات'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* =====================================================================
          TABLET & DESKTOP (>= sm): Preserved Editorial Hero + Callout + Grid
         ===================================================================== */}
      <div className="hidden sm:block space-y-6">
        {/* Intro Hero — Luminous Glassmorphic Backdrop with Architectural Lattice */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="relative rounded-3xl overflow-hidden border border-emerald-500/20 bg-gradient-to-br from-[#071E17] via-[#0E3226] to-[#08221A] text-white shadow-[0_24px_60px_-22px_rgba(6,78,59,0.55)]"
        >
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 luxury-lattice-bg opacity-65" />
          <div className="absolute -top-28 -right-20 w-80 h-80 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-28 -left-20 w-80 h-80 rounded-full bg-amber-400/15 blur-3xl pointer-events-none" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-amber-300/55 to-transparent" />

          <div className="relative z-10 p-8 lg:p-9 space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
              <div className="space-y-3 max-w-3xl">
                {badgeLabel && (
                  <div className="inline-flex items-center gap-2 text-xs text-amber-300 font-bold">
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span>{badgeLabel}</span>
                  </div>
                )}

                <h2 className="text-2xl lg:text-3xl font-black text-white leading-tight tracking-tight">
                  {introTitle}
                </h2>

                {introBody && (
                  <p className="text-sm text-slate-200/90 leading-7 whitespace-pre-line">
                    {introBody}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap lg:flex-col items-stretch gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={onOpenDescriptionModal}
                  className="px-4 py-2.5 min-h-[40px] rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold flex items-center justify-center gap-2 transition-colors backdrop-blur-md whitespace-nowrap cursor-pointer"
                >
                  <Info className="w-4 h-4 text-amber-300 shrink-0" />
                  <span>{descriptionButtonLabel || 'توضیحات'}</span>
                </button>

                {myRequestsCount > 0 && (
                  <button
                    type="button"
                    onClick={onViewHistory}
                    className="px-4 py-2.5 min-h-[40px] rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-100 border border-emerald-400/35 text-xs font-bold flex items-center justify-center gap-2 transition-colors backdrop-blur-md whitespace-nowrap cursor-pointer tabular-nums"
                  >
                    <Layers className="w-4 h-4 shrink-0" />
                    <span>{historyButtonLabel} ({toPersianNumbers(myRequestsCount)})</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Prominent Glassmorphic Callout Box with Animated CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="relative rounded-3xl border border-white/70 dark:border-white/10 bg-white/75 dark:bg-slate-900/70 backdrop-blur-2xl p-8 shadow-[0_18px_45px_-22px_rgba(16,185,129,0.28)] overflow-hidden"
        >
          <motion.div
            animate={{ scale: [1, 1.06, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            className={`absolute -top-20 -left-20 w-72 h-72 rounded-full blur-3xl pointer-events-none transition-colors duration-[3000ms] ${palette.glowBg}`}
          />

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl text-center lg:text-right">
              {calloutBadgeLabel && (
                <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{calloutBadgeLabel}</span>
                </div>
              )}
              <h3 className="text-xl font-black text-slate-900 dark:text-white leading-snug">
                {calloutTitle}
              </h3>
              {calloutSubtitle && (
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-7">
                  {calloutSubtitle}
                </p>
              )}
            </div>

            <div className="flex flex-col items-center gap-2.5 shrink-0">
              <div className="relative">
                <motion.div
                  animate={{ scale: [1, 1.07, 1], opacity: [0.45, 0.14, 0.45] }}
                  transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                  className={`absolute -inset-2 rounded-2xl blur-md pointer-events-none transition-colors duration-[3000ms] ${palette.glowBg}`}
                />

                <motion.button
                  type="button"
                  onClick={() => onStartWizard()}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className={`relative overflow-hidden px-9 py-5 rounded-2xl text-white font-black text-base shadow-2xl border ${palette.ringBorder} ${palette.buttonBg} transition-all duration-[3500ms] ease-in-out flex items-center gap-3 whitespace-nowrap cursor-pointer`}
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
                {calloutSecondaryLinkLabel || `مشاهده ${descriptionButtonLabel || 'توضیحات'} پیش از شروع`}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Custom Editable Info Cards (Optional) */}
        {enabledInfoCards.length > 0 && (
          <div className="space-y-4">
            {(landingInfoCardsTitle?.trim() || landingInfoCardsSubtitle?.trim()) && (
              <div>
                {landingInfoCardsTitle?.trim() && (
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    {landingInfoCardsTitle}
                  </h3>
                )}
                {landingInfoCardsSubtitle?.trim() && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {landingInfoCardsSubtitle}
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {enabledInfoCards.map(card => (
                <div
                  key={card.id}
                  className="p-5 rounded-2xl bg-white/75 dark:bg-slate-900/70 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-sm space-y-2"
                >
                  {card.badge?.trim() && (
                    <span className="inline-block px-2.5 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold">
                      {card.badge}
                    </span>
                  )}
                  {card.title?.trim() && (
                    <h4 className="font-black text-sm text-slate-900 dark:text-white">{card.title}</h4>
                  )}
                  {card.body?.trim() && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
                      {card.body}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Counseling Fields Showcase */}
        <CounselingFieldsShowcase
          badgeLabel={fieldsShowcaseBadgeLabel}
          title={fieldsSectionTitle}
          subtitle={fieldsSectionSubtitle}
          helperText={fieldsShowcaseHelperText}
          cardCtaLabel={fieldsCardCtaLabel}
          emptyText={fieldsShowcaseEmptyText}
          fields={fields}
          onSelectField={f => onStartWizard(f)}
          variant={variant}
        />
      </div>
    </div>
  );
};
