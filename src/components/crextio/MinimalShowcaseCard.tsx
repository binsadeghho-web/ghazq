import React, { useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { DEFAULT_SHOWCASE_IMAGES, handleImageErrorFallback } from '../../data/showcaseImages';

interface MinimalShowcaseStat {
  label: string;
  value: string;
}

interface MinimalShowcaseAction {
  label: string;
  onClick: () => void;
  primary?: boolean;
}

interface MinimalShowcaseCardProps {
  kicker: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  accentTone?: 'emerald' | 'amber' | 'sky' | 'indigo' | 'stone';
  stats?: MinimalShowcaseStat[];
  actions: MinimalShowcaseAction[];
  imageUrl?: string;
  showImage?: boolean;
  scale?: 'micro' | 'compact' | 'normal' | 'expanded';
  darkSurface?: boolean;
  motionEnabled?: boolean;
}

const ACCENT_MAP: Record<
  NonNullable<MinimalShowcaseCardProps['accentTone']>,
  {
    iconBox: string;
    iconBoxDark: string;
    kickerText: string;
    kickerTextDark: string;
    primaryBtn: string;
    spotlight: string;
  }
> = {
  emerald: {
    iconBox: 'bg-[#F4F0E4] text-[#071E17] border-[#DFD8C4]',
    iconBoxDark: 'bg-[#F3D078]/15 text-[#F3D078] border-[#F3D078]/30',
    kickerText: 'text-[#0C4A38]',
    kickerTextDark: 'text-[#F3D078]',
    primaryBtn: 'bg-[#071E17] hover:bg-[#0D3227] text-[#F3D078] border border-[#F3D078]/35',
    spotlight: 'rgba(243, 208, 120, 0.14)',
  },
  amber: {
    iconBox: 'bg-[#FAF5E6] text-[#8A6314] border-[#E7CE8A]',
    iconBoxDark: 'bg-[#F3D078]/15 text-[#F3D078] border-[#F3D078]/30',
    kickerText: 'text-[#8A6314]',
    kickerTextDark: 'text-[#F3D078]',
    primaryBtn: 'bg-[#071E17] hover:bg-[#0D3227] text-[#F3D078] border border-[#F3D078]/35',
    spotlight: 'rgba(243, 208, 120, 0.16)',
  },
  sky: {
    iconBox: 'bg-[#F4F0E4] text-[#071E17] border-[#DFD8C4]',
    iconBoxDark: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    kickerText: 'text-[#0C4A38]',
    kickerTextDark: 'text-sky-300',
    primaryBtn: 'bg-[#071E17] hover:bg-[#0D3227] text-[#F3D078] border border-[#F3D078]/35',
    spotlight: 'rgba(12, 74, 56, 0.12)',
  },
  indigo: {
    iconBox: 'bg-[#F4F0E4] text-[#071E17] border-[#DFD8C4]',
    iconBoxDark: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    kickerText: 'text-[#0C4A38]',
    kickerTextDark: 'text-indigo-300',
    primaryBtn: 'bg-[#071E17] hover:bg-[#0D3227] text-[#F3D078] border border-[#F3D078]/35',
    spotlight: 'rgba(12, 74, 56, 0.12)',
  },
  stone: {
    iconBox: 'bg-[#F4F0E4] text-[#071E17] border-[#DFD8C4]',
    iconBoxDark: 'bg-stone-700/40 text-stone-200 border-stone-600/40',
    kickerText: 'text-[#525E58]',
    kickerTextDark: 'text-stone-300',
    primaryBtn: 'bg-[#071E17] hover:bg-[#0D3227] text-[#F3D078] border border-[#F3D078]/35',
    spotlight: 'rgba(120, 113, 108, 0.12)',
  },
};

export const MinimalShowcaseCard: React.FC<MinimalShowcaseCardProps> = ({
  kicker,
  title,
  description,
  icon,
  accentTone = 'emerald',
  stats = [],
  actions,
  imageUrl,
  showImage = false,
  scale = 'normal',
  darkSurface = false,
  motionEnabled = true,
}) => {
  const tone = ACCENT_MAP[accentTone];
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: -500, y: -500 });
  const [hovered, setHovered] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!motionEnabled || !cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    },
    [motionEnabled]
  );

  const hasValidImage = Boolean(showImage && imageUrl && !imgError);

  const paddingClass =
    scale === 'micro'
      ? 'p-3 gap-2'
      : scale === 'compact'
      ? 'p-3.5 sm:p-4 gap-2.5 sm:gap-3'
      : scale === 'expanded'
      ? 'p-4 sm:p-6 gap-3.5 sm:gap-5'
      : 'p-3.5 sm:p-5 gap-3 sm:gap-4';
  const imgHeightClass =
    scale === 'micro'
      ? 'h-24'
      : scale === 'compact'
      ? 'h-32'
      : scale === 'expanded'
      ? 'h-48'
      : 'h-40';

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileHover={motionEnabled ? { y: -3, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } } : undefined}
      className={`group relative h-full rounded-2xl sm:rounded-[24px] border overflow-hidden flex flex-col justify-between transition-colors ${
        darkSurface
          ? 'bg-[#0B231B] border-[#253E35] hover:border-[#34584C] text-stone-100'
          : 'bg-[#FCFCF9] border-[#E2DAC3] hover:border-[#071E17]/40 text-[#071E17] shadow-[0_6px_18px_-14px_rgba(7,30,23,0.12)] hover:shadow-[0_14px_28px_-18px_rgba(7,30,23,0.2)]'
      }`}
      dir="rtl"
    >
      {/* Subtle Cursor Spotlight */}
      {motionEnabled && (
        <div
          className="pointer-events-none absolute -inset-px transition-opacity duration-300 z-0"
          style={{
            opacity: hovered ? 1 : 0,
            background: `radial-gradient(220px circle at ${mousePos.x}px ${mousePos.y}px, ${tone.spotlight}, transparent 75%)`,
          }}
        />
      )}

      {/* Optional Bespoke Photographic Header (Admin-Togglable) */}
      {hasValidImage && (
        <div className={`relative w-full ${imgHeightClass} overflow-hidden shrink-0 bg-stone-200`}>
          <img
            src={imageUrl}
            alt={title}
            referrerPolicy="no-referrer"
            onError={e => {
              const fallback = DEFAULT_SHOWCASE_IMAGES.unified_showcase;
              if (fallback && e.currentTarget.src !== fallback && e.currentTarget.dataset.fallbackApplied !== '1') {
                handleImageErrorFallback(e, fallback);
              } else {
                setImgError(true);
              }
            }}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
          <div className="absolute bottom-3 right-4 left-4 flex items-end justify-between gap-2 text-white">
            <span className="text-[11px] font-bold text-amber-200/95 tracking-wide">
              {kicker}
            </span>
            <div className="w-8 h-8 rounded-lg bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center shrink-0 text-white">
              {icon}
            </div>
          </div>
        </div>
      )}

      {/* Fallback gradient ribbon when image fails to load */}
      {showImage && imageUrl && imgError && (
        <div className="h-24 w-full bg-gradient-to-l from-emerald-950 via-stone-900 to-stone-800 flex items-center justify-between px-4 text-white/80">
          <span className="text-[11px] font-bold text-amber-300">{kicker}</span>
          <ImageIcon className="w-5 h-5 opacity-60" />
        </div>
      )}

      {/* Card Body */}
      <div className={`relative z-10 flex-1 flex flex-col justify-between ${paddingClass}`}>
        <div className="space-y-2.5">
          {!hasValidImage && (
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
                    darkSurface ? tone.iconBoxDark : tone.iconBox
                  }`}
                >
                  {icon}
                </div>
                <div className="min-w-0">
                  <span
                    className={`text-[11px] font-bold block ${
                      darkSurface ? tone.kickerTextDark : tone.kickerText
                    }`}
                  >
                    {kicker}
                  </span>
                  <h3
                    className={`font-extrabold truncate mt-0.5 ${
                      scale === 'expanded' ? 'text-base sm:text-lg' : 'text-sm sm:text-base'
                    } ${darkSurface ? 'text-white' : 'text-stone-900'}`}
                  >
                    {title}
                  </h3>
                </div>
              </div>
            </div>
          )}

          {hasValidImage && (
            <h3
              className={`font-extrabold leading-snug line-clamp-1 ${
                scale === 'expanded' ? 'text-base sm:text-lg' : 'text-sm sm:text-base'
              } ${darkSurface ? 'text-white' : 'text-stone-900'}`}
            >
              {title}
            </h3>
          )}

          <p
            className={`text-xs leading-relaxed ${
              scale === 'micro' || scale === 'compact' ? 'line-clamp-1' : 'line-clamp-2'
            } ${darkSurface ? 'text-stone-300' : 'text-stone-600'}`}
          >
            {description}
          </p>
        </div>

        {/* Inline Stats + Actions Footer */}
        <div
          className={`pt-3 border-t flex flex-wrap items-center justify-between gap-3 ${
            darkSurface ? 'border-white/10' : 'border-stone-100'
          }`}
        >
          {stats.length > 0 ? (
            <div
              className={`flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] font-medium ${
                darkSurface ? 'text-stone-400' : 'text-stone-500'
              }`}
            >
              {stats.map((st, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && (
                    <span aria-hidden="true" className="opacity-40">
                      ·
                    </span>
                  )}
                  <span>
                    {st.label}:{' '}
                    <strong
                      className={`font-extrabold tabular-nums ${
                        darkSurface ? 'text-white' : 'text-stone-900'
                      }`}
                    >
                      {st.value}
                    </strong>
                  </span>
                </React.Fragment>
              ))}
            </div>
          ) : (
            <span />
          )}

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto shrink-0">
            {actions.map((act, idx) => (
              <button
                key={idx}
                type="button"
                onClick={act.onClick}
                className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 sm:py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                  act.primary
                    ? `${tone.primaryBtn} flex-1 sm:flex-initial`
                    : darkSurface
                    ? 'bg-white/10 hover:bg-white/15 text-stone-100 border border-white/15'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200/80'
                }`}
              >
                <span>{act.label}</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
