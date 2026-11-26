import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { toPersianNumbers } from '../../utils/persianNumbers';
import { CrextioBentoCardConfig, WelfareModuleKey } from '../../types';
import { DEFAULT_BENTO_CARDS } from '../../data/mockData';
import { CrextioBentoCustomizerModal } from './CrextioBentoCustomizerModal';
import {
  Inbox,
  GraduationCap,
  BookOpen,
  HeartHandshake,
  Compass,
  Scale,
  Gift,
  Users2,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  Sliders,
  ChevronLeft,
} from 'lucide-react';

interface CrextioServicesBentoProps {
  onNavigateTab: (tab: string) => void;
  onNavigateDeep?: (tab: string, subTab?: string) => void;
}

interface ServicePalette {
  accentHex: string;
  glowRgba: string;
  surfaceClass: string;
  borderClass: string;
  iconBoxClass: string;
  iconHoverClass: string;
  kickerTextClass: string;
  ctaTextClass: string;
  topLineGradient: string;
  bulletBgClass: string;
  isSignatureDark?: boolean;
}

const SERVICE_PALETTES: Record<string, ServicePalette> = {
  People: {
    accentHex: '#059669',
    glowRgba: 'rgba(5, 150, 105, 0.14)',
    surfaceClass: 'bg-gradient-to-bl from-white via-[#FCFCF9] to-emerald-50/75',
    borderClass: 'border-emerald-200/80 hover:border-emerald-500/50',
    iconBoxClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/90',
    iconHoverClass: 'group-hover:bg-gradient-to-br group-hover:from-emerald-600 group-hover:to-teal-700 group-hover:text-white group-hover:border-emerald-600 group-hover:shadow-md group-hover:shadow-emerald-900/15',
    kickerTextClass: 'text-emerald-800',
    ctaTextClass: 'text-emerald-900 group-hover:text-emerald-700',
    topLineGradient: 'from-transparent via-emerald-500/80 to-transparent',
    bulletBgClass: 'bg-emerald-600',
  },
  counseling_specialized: {
    accentHex: '#D97706',
    glowRgba: 'rgba(217, 119, 6, 0.14)',
    surfaceClass: 'bg-gradient-to-bl from-white via-[#FCFCF9] to-amber-50/75',
    borderClass: 'border-amber-200/85 hover:border-amber-500/55',
    iconBoxClass: 'bg-amber-50 text-amber-700 border-amber-200/90',
    iconHoverClass: 'group-hover:bg-gradient-to-br group-hover:from-amber-500 group-hover:to-orange-600 group-hover:text-white group-hover:border-amber-500 group-hover:shadow-md group-hover:shadow-amber-900/15',
    kickerTextClass: 'text-amber-800',
    ctaTextClass: 'text-amber-950 group-hover:text-amber-700',
    topLineGradient: 'from-transparent via-amber-500/85 to-transparent',
    bulletBgClass: 'bg-amber-600',
  },
  Counseling: {
    accentHex: '#E11D48',
    glowRgba: 'rgba(225, 29, 72, 0.12)',
    surfaceClass: 'bg-gradient-to-bl from-white via-[#FCFCF9] to-rose-50/70',
    borderClass: 'border-rose-200/80 hover:border-rose-400/60',
    iconBoxClass: 'bg-rose-50 text-rose-700 border-rose-200/90',
    iconHoverClass: 'group-hover:bg-gradient-to-br group-hover:from-rose-500 group-hover:to-pink-600 group-hover:text-white group-hover:border-rose-500 group-hover:shadow-md group-hover:shadow-rose-900/15',
    kickerTextClass: 'text-rose-800',
    ctaTextClass: 'text-rose-950 group-hover:text-rose-700',
    topLineGradient: 'from-transparent via-rose-500/80 to-transparent',
    bulletBgClass: 'bg-rose-500',
  },
  Courses: {
    accentHex: '#0891B2',
    glowRgba: 'rgba(8, 145, 178, 0.14)',
    surfaceClass: 'bg-gradient-to-bl from-white via-[#FCFCF9] to-cyan-50/70',
    borderClass: 'border-cyan-200/80 hover:border-cyan-500/55',
    iconBoxClass: 'bg-cyan-50 text-cyan-700 border-cyan-200/90',
    iconHoverClass: 'group-hover:bg-gradient-to-br group-hover:from-cyan-600 group-hover:to-sky-700 group-hover:text-white group-hover:border-cyan-600 group-hover:shadow-md group-hover:shadow-cyan-900/15',
    kickerTextClass: 'text-cyan-800',
    ctaTextClass: 'text-cyan-950 group-hover:text-cyan-700',
    topLineGradient: 'from-transparent via-cyan-500/80 to-transparent',
    bulletBgClass: 'bg-cyan-600',
  },
  Research: {
    accentHex: '#0D9488',
    glowRgba: 'rgba(13, 148, 136, 0.14)',
    surfaceClass: 'bg-gradient-to-bl from-white via-[#FCFCF9] to-teal-50/75',
    borderClass: 'border-teal-200/80 hover:border-teal-500/55',
    iconBoxClass: 'bg-teal-50 text-teal-700 border-teal-200/90',
    iconHoverClass: 'group-hover:bg-gradient-to-br group-hover:from-teal-600 group-hover:to-emerald-700 group-hover:text-white group-hover:border-teal-600 group-hover:shadow-md group-hover:shadow-teal-900/15',
    kickerTextClass: 'text-teal-800',
    ctaTextClass: 'text-teal-950 group-hover:text-teal-700',
    topLineGradient: 'from-transparent via-teal-500/80 to-transparent',
    bulletBgClass: 'bg-teal-600',
  },
  Rulings: {
    accentHex: '#B45309',
    glowRgba: 'rgba(180, 83, 9, 0.14)',
    surfaceClass: 'bg-gradient-to-bl from-white via-[#FDFBF4] to-[#FBF3DC]/80',
    borderClass: 'border-[#DFD1A7] hover:border-[#B88928]/70',
    iconBoxClass: 'bg-[#FAF2DA] text-[#8E6516] border-[#E5D4A1]',
    iconHoverClass: 'group-hover:bg-gradient-to-br group-hover:from-[#9F7319] group-hover:to-[#6E4D0D] group-hover:text-[#FFF8DF] group-hover:border-[#9F7319] group-hover:shadow-md group-hover:shadow-amber-900/15',
    kickerTextClass: 'text-[#8E6516]',
    ctaTextClass: 'text-[#071E17] group-hover:text-[#8E6516]',
    topLineGradient: 'from-transparent via-[#D4AF37]/90 to-transparent',
    bulletBgClass: 'bg-[#B88928]',
  },
  Products: {
    accentHex: '#7C3AED',
    glowRgba: 'rgba(124, 58, 237, 0.13)',
    surfaceClass: 'bg-gradient-to-bl from-white via-[#FCFCF9] to-violet-50/70',
    borderClass: 'border-violet-200/80 hover:border-violet-500/50',
    iconBoxClass: 'bg-violet-50 text-violet-700 border-violet-200/90',
    iconHoverClass: 'group-hover:bg-gradient-to-br group-hover:from-violet-600 group-hover:to-indigo-700 group-hover:text-white group-hover:border-violet-600 group-hover:shadow-md group-hover:shadow-violet-900/15',
    kickerTextClass: 'text-violet-800',
    ctaTextClass: 'text-violet-950 group-hover:text-violet-700',
    topLineGradient: 'from-transparent via-violet-500/80 to-transparent',
    bulletBgClass: 'bg-violet-600',
  },
  Welfare: {
    accentHex: '#F3D078',
    glowRgba: 'rgba(243, 208, 120, 0.18)',
    surfaceClass: 'bg-gradient-to-bl from-[#071E17] via-[#0C2F24] to-[#134434] text-white',
    borderClass: 'border-[#F3D078]/35 hover:border-[#F3D078]/75',
    iconBoxClass: 'bg-[#F3D078]/15 text-[#F3D078] border-[#F3D078]/40',
    iconHoverClass: 'group-hover:bg-[#F3D078] group-hover:text-[#071E17] group-hover:border-[#F3D078] group-hover:shadow-md group-hover:shadow-black/30',
    kickerTextClass: 'text-[#F3D078]',
    ctaTextClass: 'text-[#F3D078] group-hover:text-[#FFF0BE]',
    topLineGradient: 'from-transparent via-[#F3D078]/90 to-transparent',
    bulletBgClass: 'bg-[#F3D078]',
    isSignatureDark: true,
  },
  Synergy: {
    accentHex: '#2563EB',
    glowRgba: 'rgba(37, 99, 235, 0.13)',
    surfaceClass: 'bg-gradient-to-bl from-white via-[#FCFCF9] to-sky-50/75',
    borderClass: 'border-sky-200/80 hover:border-sky-500/55',
    iconBoxClass: 'bg-sky-50 text-sky-700 border-sky-200/90',
    iconHoverClass: 'group-hover:bg-gradient-to-br group-hover:from-blue-600 group-hover:to-sky-600 group-hover:text-white group-hover:border-blue-600 group-hover:shadow-md group-hover:shadow-sky-900/15',
    kickerTextClass: 'text-sky-800',
    ctaTextClass: 'text-sky-950 group-hover:text-blue-700',
    topLineGradient: 'from-transparent via-sky-500/80 to-transparent',
    bulletBgClass: 'bg-blue-600',
  },
};

const DEFAULT_PALETTE: ServicePalette = {
  accentHex: '#0C4A38',
  glowRgba: 'rgba(12, 74, 56, 0.13)',
  surfaceClass: 'bg-gradient-to-bl from-white via-[#FCFCF9] to-[#F4EFE0]/70',
  borderClass: 'border-[#DFD8C4] hover:border-[#071E17]/45',
  iconBoxClass: 'bg-[#F4F0E4] text-[#071E17] border-[#DFD8C4]',
  iconHoverClass: 'group-hover:bg-[#071E17] group-hover:text-[#F3D078] group-hover:border-[#071E17]',
  kickerTextClass: 'text-[#6E5A28]',
  ctaTextClass: 'text-[#071E17] group-hover:text-[#0C4A38]',
  topLineGradient: 'from-transparent via-[#F3D078]/85 to-transparent',
  bulletBgClass: 'bg-[#B88928]',
};

const ICON_MAP: Record<string, any> = {
  People: Inbox,
  counseling_specialized: Compass,
  Counseling: HeartHandshake,
  Courses: GraduationCap,
  Research: BookOpen,
  Rulings: Scale,
  Products: BookOpen,
  Welfare: Gift,
  Synergy: Users2,
};

const SIZE_CLASS_MAP: Record<string, string> = {
  '1-col': 'col-span-1 row-span-1',
  '2-col': 'col-span-1 md:col-span-2 row-span-1',
  '3-col': 'col-span-1 md:col-span-3 row-span-1',
  full: 'col-span-1 md:col-span-3 lg:col-span-4 row-span-1',
};

const InteractiveBentoTile: React.FC<{
  card: CrextioBentoCardConfig;
  index: number;
  badgeText: string;
  palette: ServicePalette;
  sizeClass: string;
  Icon: any;
  ctaLabel: string;
  welfarePortalConfig: any;
  onNavigateTab: (tab: string) => void;
  onNavigateDeep?: (tab: string, subTab?: string) => void;
}> = ({
  card,
  index,
  badgeText,
  palette,
  sizeClass,
  Icon,
  ctaLabel,
  welfarePortalConfig,
  onNavigateTab,
  onNavigateDeep,
}) => {
  const tileRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });
  const [hovered, setHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!tileRef.current) return;
    const rect = tileRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);

  const isDark = Boolean(palette.isSignatureDark);

  return (
    <motion.div
      ref={tileRef}
      initial={{ opacity: 0, y: 18, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{
        duration: 0.36,
        delay: Math.min(index * 0.045, 0.36),
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={{ y: -5, transition: { type: 'spring', stiffness: 360, damping: 24 } }}
      whileTap={{ scale: 0.985 }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onNavigateTab(card.id)}
      className={`relative group cursor-pointer rounded-2xl sm:rounded-[26px] border p-4 sm:p-5 shadow-[0_8px_22px_-16px_rgba(7,30,23,0.14)] hover:shadow-[0_20px_40px_-20px_rgba(7,30,23,0.24)] transition-colors duration-200 flex flex-col justify-between overflow-hidden ${sizeClass} ${palette.surfaceClass} ${palette.borderClass}`}
    >
      {/* Pointer-Tracking Radial Jewel Spotlight */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-px transition-opacity duration-300"
        style={{
          opacity: hovered ? 1 : 0,
          background: `radial-gradient(240px circle at ${mousePos.x}px ${mousePos.y}px, ${palette.glowRgba}, transparent 75%)`,
        }}
      />

      {/* Signature Lattice Backdrop on Featured Welfare Card */}
      {isDark && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 luxury-lattice-bg opacity-45"
        />
      )}

      {/* Luminous Top Hairline Edge on Hover */}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-8 top-0 h-[1.5px] bg-gradient-to-l ${palette.topLineGradient} ${
          isDark ? 'opacity-70 group-hover:opacity-100' : 'opacity-0 group-hover:opacity-100'
        } transition-opacity duration-300`}
      />

      {/* Ambient Decorative Corner Icon Motif */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute -bottom-4 -left-4 transition-all duration-500 ease-out group-hover:scale-110 group-hover:-rotate-6 ${
          isDark ? 'text-[#F3D078]/[0.07] group-hover:text-[#F3D078]/[0.13]' : 'text-stone-900/[0.035] group-hover:text-stone-900/[0.065]'
        }`}
      >
        <Icon className="w-24 h-24 stroke-[1.2]" />
      </div>

      <div className="relative z-10 space-y-3.5">
        {/* Top Row: Animated Jewel Icon + Unboxed Clean Metadata */}
        <div className="flex items-center justify-between gap-2">
          <div
            className={`w-11 h-11 rounded-2xl border flex items-center justify-center transition-all duration-300 ease-out group-hover:scale-110 group-hover:-rotate-3 shrink-0 ${palette.iconBoxClass} ${palette.iconHoverClass}`}
          >
            <Icon className="w-5 h-5 stroke-[2.1]" />
          </div>

          <span
            className={`hidden sm:inline-block text-[11px] font-extrabold truncate max-w-[155px] tabular-nums ${palette.kickerTextClass}`}
          >
            {badgeText}
          </span>
        </div>

        {/* Title & Subtitle */}
        <div>
          <h3
            className={`text-[13px] sm:text-[15.5px] font-black leading-snug line-clamp-1 sm:line-clamp-none transition-colors ${
              isDark ? 'text-white' : 'text-[#071E17]'
            }`}
          >
            {card.title}
          </h3>
          <p
            className={`text-[11px] sm:text-xs mt-1.5 line-clamp-2 leading-relaxed ${
              isDark ? 'text-emerald-100/80' : 'text-[#4C5C54]'
            }`}
          >
            {card.subtext}
          </p>
        </div>

        {/* Sub-Services / Interactive Welfare 6-Module Launchers */}
        {card.id === 'Welfare' ? (
          <div className="pt-3 border-t border-white/15 space-y-2">
            <div className="text-[10px] font-black text-[#F3D078] flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#F3D078]" />
              <span>بخش‌های ۶گانه رفاهیات:</span>
            </div>
            <div className="grid grid-cols-1 gap-1 text-[11px]">
              {(
                [
                  'emergency_loan',
                  'qarzolhasaneh_fund',
                  'accommodation',
                  'consumables',
                  'installment_sales',
                  'recreation_tourism',
                ] as WelfareModuleKey[]
              )
                .filter(mk => welfarePortalConfig?.modulesConfig?.[mk]?.enabled !== false)
                .map((mk, mkIdx) => {
                  const title = welfarePortalConfig?.modulesConfig?.[mk]?.title || mk;
                  return (
                    <button
                      key={mk}
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        if (onNavigateDeep) {
                          onNavigateDeep('Welfare', mk);
                        } else {
                          onNavigateTab('Welfare');
                        }
                      }}
                      className="w-full text-right flex items-center justify-between gap-2 py-1.5 px-2.5 rounded-xl bg-white/[0.06] hover:bg-[#F3D078] text-emerald-50 hover:text-[#071E17] border border-white/10 hover:border-[#F3D078] font-bold transition-all duration-150 cursor-pointer group/sub hover:-translate-x-0.5"
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] font-black text-[#F3D078] group-hover/sub:text-[#071E17] tabular-nums shrink-0">
                          {toPersianNumbers(`0${mkIdx + 1}`)}
                        </span>
                        <span className="truncate">{title}</span>
                      </span>
                      <ChevronLeft className="w-3.5 h-3.5 text-[#F3D078] group-hover/sub:text-[#071E17] group-hover/sub:-translate-x-0.5 transition-transform shrink-0" />
                    </button>
                  );
                })}
            </div>
          </div>
        ) : (
          card.subServices &&
          card.subServices.length > 0 && (
            <div className="hidden md:block pt-3 border-t border-stone-200/70 space-y-1.5">
              <div className={`text-[10px] font-black flex items-center gap-1.5 ${palette.kickerTextClass}`}>
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>زیرخدمات و امکانات:</span>
              </div>
              <div className="grid grid-cols-1 gap-1 text-[11px] text-[#3B4A43]">
                {card.subServices.map((sub, sIdx) => (
                  <div
                    key={sIdx}
                    className="flex items-center gap-2 py-0.5 group-hover:text-[#071E17] transition-transform duration-200 group-hover:-translate-x-0.5"
                  >
                    <span className={`w-1.5 h-1.5 rounded-[2px] rotate-45 ${palette.bulletBgClass} shrink-0`} />
                    <span className="truncate font-medium">{sub}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        )}
      </div>

      {/* Footer CTA Bar */}
      <div
        className={`relative z-10 pt-3 mt-4 border-t flex items-center justify-between text-[11px] sm:text-xs font-extrabold ${
          isDark ? 'border-white/15' : 'border-stone-200/75'
        }`}
      >
        <span className={`flex items-center gap-1.5 transition-colors ${palette.ctaTextClass}`}>
          <span>{ctaLabel}</span>
          <ArrowLeft className="w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-x-1.5" />
        </span>

        <span
          className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all duration-200 ${
            isDark
              ? 'bg-white/10 text-[#F3D078] group-hover:bg-[#F3D078] group-hover:text-[#071E17]'
              : 'bg-stone-100/90 text-stone-600 group-hover:bg-[#071E17] group-hover:text-[#F3D078]'
          }`}
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" />
        </span>
      </div>
    </motion.div>
  );
};

export const CrextioServicesBento: React.FC<CrextioServicesBentoProps> = ({
  onNavigateTab,
  onNavigateDeep,
}) => {
  const { crextioConfig, currentUser, cartableRequests, welfarePortalConfig, isAlumniPreview } = useApp();
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);

  const isAdmin =
    (currentUser?.role === 'admin' ||
      currentUser?.role === 'super_admin' ||
      currentUser?.role === 'alumni_manager' ||
      currentUser?.role === 'supervisor') &&
    !isAlumniPreview;
  const pendingCartable = cartableRequests.filter(r => r.status === 'pending' || r.status === 'in_progress').length;

  const rawCards: CrextioBentoCardConfig[] = crextioConfig.bentoCardsConfig || DEFAULT_BENTO_CARDS;

  const sortedCards = [...rawCards]
    .filter(c => {
      if (c.isVisible === false) return false;
      if (!isAdmin && (c.id === 'Alumni' || c.id === 'Users' || c.id === 'Admin' || c.id === 'Setting' || c.id === 'Finance')) {
        return false;
      }
      return true;
    })
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Luminous Architectural Emerald & Gold Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 bg-gradient-to-bl from-[#071E17] via-[#0C3025] to-[#134434] text-white border border-[#F3D078]/30 p-4 sm:px-6 sm:py-5 rounded-2xl sm:rounded-[26px] shadow-[0_18px_42px_-24px_rgba(7,30,23,0.55)]"
      >
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 luxury-lattice-bg opacity-55" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 w-44 bg-gradient-to-r from-transparent via-[#F3D078]/10 to-transparent luxury-sheen"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-l from-transparent via-[#F3D078]/75 to-transparent"
        />

        <div className="relative z-10 flex items-center gap-3.5 min-w-0">
          <motion.div
            whileHover={{ rotate: [0, -8, 8, 0], scale: 1.06 }}
            transition={{ duration: 0.4 }}
            className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#F3D078] to-[#D9A73E] text-[#071E17] flex items-center justify-center shrink-0 shadow-md shadow-black/25 border border-[#FFF2BE]/60"
          >
            <Scale className="w-5 h-5 stroke-[2.2]" />
          </motion.div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm sm:text-base font-black text-white tracking-tight">
                {crextioConfig.bentoSectionTitle || 'فهرست و درگاه‌های خدمات سامانه (طرح میزان)'}
              </span>
              <span aria-hidden="true" className="text-[#F3D078]/45 text-xs">·</span>
              <span className="text-xs font-black text-[#F3D078] tabular-nums">
                {toPersianNumbers(sortedCards.length)} درگاه فعال
              </span>
            </div>
            <p className="text-xs text-emerald-100/80 mt-0.5 truncate">
              {crextioConfig.bentoSectionSubtitle || 'دسترسی مستقیم به کارتابل، دوره‌های آموزشی، مشاوره، تالار آراء، پژوهش و رفاهیات'}
            </p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2.5 self-start sm:self-auto shrink-0">
          {isAdmin && (
            <motion.button
              type="button"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setIsCustomizerOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-[#F3D078] text-[#F3D078] hover:text-[#071E17] border border-[#F3D078]/35 text-xs font-black transition-colors cursor-pointer whitespace-nowrap backdrop-blur-xs"
              title="تغییر مکان، اندازه و ویرایش متن کارت‌های خدمات توسط ادمین"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>چیدمان و اندازه کارت‌ها</span>
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Living Vibrant Bento Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {sortedCards.map((card, idx) => {
          const Icon = ICON_MAP[card.id] || Sparkles;
          const sizeClass = SIZE_CLASS_MAP[card.size] || 'col-span-1 row-span-1';
          const palette = SERVICE_PALETTES[card.id] || DEFAULT_PALETTE;
          const badgeText =
            card.id === 'People' && pendingCartable > 0
              ? `${toPersianNumbers(pendingCartable)} پرونده در جریان`
              : card.badge;

          return (
            <InteractiveBentoTile
              key={card.id}
              card={card}
              index={idx}
              badgeText={badgeText}
              palette={palette}
              sizeClass={sizeClass}
              Icon={Icon}
              ctaLabel={crextioConfig.bentoCardCtaText || 'ورود به بخش'}
              welfarePortalConfig={welfarePortalConfig}
              onNavigateTab={onNavigateTab}
              onNavigateDeep={onNavigateDeep}
            />
          );
        })}
      </div>

      {/* Admin Layout & Card Customizer Modal */}
      <CrextioBentoCustomizerModal
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
      />
    </div>
  );
};
