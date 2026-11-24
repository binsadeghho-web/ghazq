import React from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
  Briefcase,
  GraduationCap,
  HeartHandshake,
  Brain,
  Scale,
  Compass,
  BookOpen,
  ArrowLeft,
} from 'lucide-react';
import { CounselingFieldItem } from '../../types';
import { toPersianNumbers } from '../../utils/persianNumbers';

interface CounselingFieldsShowcaseProps {
  badgeLabel?: string;
  title: string;
  subtitle?: string;
  helperText?: string;
  cardCtaLabel?: string;
  emptyText?: string;
  fields: CounselingFieldItem[];
  onSelectField: (field: CounselingFieldItem) => void;
  variant?: 'specialized' | 'general';
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  sparkles: Sparkles,
  briefcase: Briefcase,
  graduation: GraduationCap,
  heart: HeartHandshake,
  brain: Brain,
  scale: Scale,
  compass: Compass,
  book: BookOpen,
};

const ACCENT_MAP: Record<
  string,
  {
    badge: string;
    border: string;
    iconBg: string;
    glow: string;
    edgeGlow: string;
  }
> = {
  emerald: {
    badge: 'text-emerald-700 dark:text-emerald-300',
    border: 'hover:border-emerald-400/70 dark:hover:border-emerald-500/60',
    iconBg:
      'bg-gradient-to-br from-emerald-500/20 to-teal-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-400/35 shadow-inner',
    glow: 'group-hover:shadow-[0_14px_30px_-10px_rgba(16,185,129,0.35)]',
    edgeGlow: 'from-emerald-400/25 via-teal-400/10 to-transparent',
  },
  amber: {
    badge: 'text-amber-700 dark:text-amber-300',
    border: 'hover:border-amber-400/70 dark:hover:border-amber-500/60',
    iconBg:
      'bg-gradient-to-br from-amber-500/20 to-orange-500/15 text-amber-700 dark:text-amber-300 border-amber-400/35 shadow-inner',
    glow: 'group-hover:shadow-[0_14px_30px_-10px_rgba(245,158,11,0.32)]',
    edgeGlow: 'from-amber-400/25 via-orange-400/10 to-transparent',
  },
  indigo: {
    badge: 'text-indigo-700 dark:text-indigo-300',
    border: 'hover:border-indigo-400/70 dark:hover:border-indigo-500/60',
    iconBg:
      'bg-gradient-to-br from-indigo-500/20 to-sky-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-400/35 shadow-inner',
    glow: 'group-hover:shadow-[0_14px_30px_-10px_rgba(99,102,241,0.32)]',
    edgeGlow: 'from-indigo-400/25 via-sky-400/10 to-transparent',
  },
  teal: {
    badge: 'text-teal-700 dark:text-teal-300',
    border: 'hover:border-teal-400/70 dark:hover:border-teal-500/60',
    iconBg:
      'bg-gradient-to-br from-teal-500/20 to-cyan-500/15 text-teal-700 dark:text-teal-300 border-teal-400/35 shadow-inner',
    glow: 'group-hover:shadow-[0_14px_30px_-10px_rgba(20,184,166,0.35)]',
    edgeGlow: 'from-teal-400/25 via-cyan-400/10 to-transparent',
  },
  rose: {
    badge: 'text-rose-700 dark:text-rose-300',
    border: 'hover:border-rose-400/70 dark:hover:border-rose-500/60',
    iconBg:
      'bg-gradient-to-br from-rose-500/20 to-pink-500/15 text-rose-700 dark:text-rose-300 border-rose-400/35 shadow-inner',
    glow: 'group-hover:shadow-[0_14px_30px_-10px_rgba(244,63,94,0.32)]',
    edgeGlow: 'from-rose-400/25 via-pink-400/10 to-transparent',
  },
};

const COMPACT_PALETTES = ['emerald', 'teal', 'indigo', 'amber', 'rose', 'emerald'];

export const CounselingFieldsShowcase: React.FC<CounselingFieldsShowcaseProps> = ({
  badgeLabel,
  title,
  subtitle,
  helperText,
  cardCtaLabel,
  emptyText,
  fields,
  onSelectField,
  variant = 'general',
}) => {
  const activeFields = fields.filter(f => f.isActive);
  const resolvedBadge =
    badgeLabel !== undefined
      ? badgeLabel
      : variant === 'specialized'
      ? 'محورهای تخصصی هدایت شغلی و تحصیلی'
      : 'حوزه‌های خدمات روان‌شناختی';
  const resolvedHelper =
    helperText !== undefined
      ? helperText
      : 'روی هر زمینه کلیک کنید تا فرم ثبت درخواست با همان محور باز شود';
  const resolvedCta = cardCtaLabel || 'ثبت درخواست';
  const resolvedEmpty = emptyText || 'هنوز زمینه مشاوره‌ای برای این بخش تعریف نشده است.';

  const isCompactGeneral = variant === 'general';

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex items-end justify-between gap-2">
        <div className="min-w-0">
          {resolvedBadge && (
            <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1">
              <Compass className="w-4 h-4 shrink-0" />
              <span>{resolvedBadge}</span>
            </div>
          )}
          <h3 className="text-sm sm:text-lg font-black text-slate-900 dark:text-white truncate">{title}</h3>
          {subtitle && (
            <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
          )}
        </div>
        {resolvedHelper && (
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 shrink-0">
            <span className="sm:hidden">لمس برای رزرو</span>
            <span className="hidden sm:inline">{resolvedHelper}</span>
          </span>
        )}
      </div>

      {activeFields.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-6 sm:p-8 text-center text-xs text-slate-500 dark:text-slate-400">
          {resolvedEmpty}
        </div>
      ) : isCompactGeneral ? (
        <>
          {/* Mobile (< sm): Instant-scan 2-col compact jewel tap tiles — fits all 6 above the fold */}
          <div className="sm:hidden grid grid-cols-2 gap-2.5">
            {activeFields.map((field, idx) => {
              const IconComp = ICON_MAP[field.iconName || 'sparkles'] || Sparkles;
              const accentKey = field.accentColor || COMPACT_PALETTES[idx % COMPACT_PALETTES.length];
              const accent = ACCENT_MAP[accentKey] || ACCENT_MAP.emerald;

              return (
                <motion.button
                  key={field.id}
                  type="button"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: idx * 0.025 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => onSelectField(field)}
                  className={`group relative overflow-hidden text-right p-3 min-h-[82px] rounded-[20px] bg-white/95 dark:bg-slate-900/75 border border-stone-200/90 dark:border-white/10 shadow-[0_8px_20px_-14px_rgba(7,30,23,0.22)] active:border-emerald-500/60 transition-colors flex flex-col justify-between gap-2 cursor-pointer`}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accent.edgeGlow} opacity-35`}
                  />

                  <div className="relative z-10 flex items-center justify-between gap-2">
                    <div
                      className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${accent.iconBg}`}
                    >
                      <IconComp className="w-4 h-4" />
                    </div>
                    <ArrowLeft className="w-3.5 h-3.5 text-stone-400 group-active:text-emerald-700 shrink-0" />
                  </div>

                  <div className="relative z-10 space-y-0.5">
                    <h4 className="font-black text-[12.5px] text-slate-900 dark:text-white leading-snug line-clamp-1">
                      {field.title}
                    </h4>
                    {field.subtitle?.trim() && (
                      <p className={`text-[10px] font-bold truncate ${accent.badge}`}>
                        {field.subtitle}
                      </p>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Tablet & Desktop (>= sm): Original Luminous Frosted-Glass Jewel Grid */}
          <div className="hidden sm:grid grid-cols-3 lg:grid-cols-6 gap-3">
            {activeFields.map((field, idx) => {
              const IconComp = ICON_MAP[field.iconName || 'sparkles'] || Sparkles;
              const accentKey = field.accentColor || COMPACT_PALETTES[idx % COMPACT_PALETTES.length];
              const accent = ACCENT_MAP[accentKey] || ACCENT_MAP.emerald;

              return (
                <motion.button
                  key={field.id}
                  type="button"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: idx * 0.035 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => onSelectField(field)}
                  className={`group relative overflow-hidden text-right p-3.5 rounded-2xl bg-white/85 dark:bg-slate-900/65 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-[0_10px_26px_-14px_rgba(7,30,23,0.2)] transition-all duration-300 flex flex-col justify-between gap-2.5 cursor-pointer ${accent.border} ${accent.glow}`}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accent.edgeGlow} opacity-40 group-hover:opacity-90 transition-opacity duration-300`}
                  />
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -top-8 -left-8 w-16 h-16 rounded-full bg-white/40 dark:bg-white/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  />

                  <div className="relative z-10 flex items-center justify-between gap-2">
                    <div
                      className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105 ${accent.iconBg}`}
                    >
                      <IconComp className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-mono tabular-nums text-slate-400 dark:text-slate-500">
                      {toPersianNumbers(String(idx + 1).padStart(2, '0'))}
                    </span>
                  </div>

                  <div className="relative z-10 space-y-0.5 min-h-[34px] flex flex-col justify-center">
                    <h4 className="font-black text-[13px] text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors leading-snug line-clamp-2">
                      {field.title}
                    </h4>
                    {field.subtitle?.trim() && (
                      <p className={`text-[10px] font-bold truncate ${accent.badge}`}>
                        {field.subtitle}
                      </p>
                    )}
                  </div>

                  <div className="relative z-10 pt-2 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    <span className="truncate">{resolvedCta}</span>
                    <ArrowLeft className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:-translate-x-1 transition-all shrink-0" />
                  </div>
                </motion.button>
              );
            })}
          </div>
        </>
      ) : (
        <>
          {/* Mobile (< sm) Specialized Career Counseling: Clean scannable architectural rows */}
          <div className="sm:hidden space-y-2">
            {activeFields.map((field, idx) => {
              const IconComp = ICON_MAP[field.iconName || 'sparkles'] || Sparkles;
              const accent = ACCENT_MAP[field.accentColor || 'amber'] || ACCENT_MAP.amber;

              return (
                <motion.button
                  key={field.id}
                  type="button"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: idx * 0.025 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSelectField(field)}
                  className="w-full relative overflow-hidden text-right p-3.5 min-h-[68px] rounded-[20px] bg-white/95 dark:bg-slate-900/75 border border-stone-200/90 dark:border-white/10 shadow-[0_8px_20px_-14px_rgba(7,30,23,0.18)] flex items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${accent.iconBg}`}>
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-black text-[13px] text-slate-900 dark:text-white truncate">
                        {field.title}
                      </h4>
                      {(field.subtitle?.trim() || field.description?.trim()) && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {field.subtitle?.trim() || field.description?.trim()}
                        </p>
                      )}
                    </div>
                  </div>
                  <ArrowLeft className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                </motion.button>
              );
            })}
          </div>

          {/* Tablet & Desktop (>= sm) Specialized Career Counseling Rich Glass Cards */}
          <div className="hidden sm:grid grid-cols-2 lg:grid-cols-3 gap-4">
            {activeFields.map((field, idx) => {
              const IconComp = ICON_MAP[field.iconName || 'sparkles'] || Sparkles;
              const accent = ACCENT_MAP[field.accentColor || 'amber'] || ACCENT_MAP.amber;
              const hasDetails = Boolean(field.subtitle?.trim() || field.description?.trim());

              return (
                <motion.button
                  key={field.id}
                  type="button"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: idx * 0.04 }}
                  whileHover={{ y: -3 }}
                  onClick={() => onSelectField(field)}
                  className={`group relative overflow-hidden text-right p-5 rounded-2xl bg-white/85 dark:bg-slate-900/75 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-2xs transition-all flex flex-col justify-between gap-4 cursor-pointer ${accent.border} ${accent.glow}`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 ${accent.iconBg}`}>
                        <IconComp className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-mono tabular-nums text-slate-400">
                        #{toPersianNumbers(String(idx + 1).padStart(2, '0'))}
                      </span>
                    </div>

                    <div>
                      <h4 className={`font-black text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors ${hasDetails ? 'text-sm' : 'text-sm sm:text-base'}`}>
                        {field.title}
                      </h4>
                      {field.subtitle?.trim() && (
                        <p className={`text-[11px] font-bold mt-1 ${accent.badge}`}>
                          {field.subtitle}
                        </p>
                      )}
                    </div>

                    {field.description?.trim() && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
                        {field.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span>{resolvedCta}</span>
                    <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:-translate-x-1 transition-all" />
                  </div>
                </motion.button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
