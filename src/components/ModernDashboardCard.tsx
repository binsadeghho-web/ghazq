import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';

export type CardAccentColor = 'emerald' | 'indigo' | 'amber' | 'rose' | 'cyan' | 'violet' | 'teal' | 'purple';

export interface ModernDashboardCardProps {
  /** عنوان اصلی بخش (مثلاً "دوره‌های تخصصی") */
  title?: string;
  /** مقدار ثانویه یا آمار اختیاری */
  value?: string | number;
  /** زیرعنوان یا توضیح کوتاه مقداری */
  subValue?: string;
  /** درصد یا مقدار تغییر روند */
  trendText?: string;
  /** جهت فلش روند */
  trendDirection?: 'up' | 'down' | 'neutral';
  /** بازه مقایسه‌ای یا بافت متنی */
  trendContext?: string;
  /** آیکون اختیاری */
  icon?: React.ReactNode;
  /** رنگ زمینه نوری و نورافکن */
  accent?: CardAccentColor;
  /** چراغ وضعیت زنده */
  status?: 'active' | 'warning' | 'idle';
  /** برچسب متنی کوچک در گوشه */
  badgeText?: string;
  /** رویداد کلیک */
  onClick?: () => void;
  className?: string;
}

// پالت‌های رنگی غنی منطبق بر دستورالعمل دقیق سیستم و ارتقای پیشرفته
const ACCENT_STYLES: Record<CardAccentColor, {
  glow: string;
  spotlight: string;
  gradientBg: string;
  iconBg: string;
  iconGlow: string;
  badgeColor: string;
  rimBorder: string;
  accentText: string;
  accentBorder: string;
}> = {
  emerald: {
    glow: 'rgba(16, 185, 129, 0.22)',
    spotlight: 'rgba(16, 185, 129, 0.16)',
    gradientBg: 'from-emerald-500/12 via-emerald-500/4 to-transparent',
    iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 group-hover:border-emerald-500/40',
    iconGlow: 'rgba(16, 185, 129, 0.25)',
    badgeColor: 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20',
    rimBorder: 'group-hover:border-emerald-500/40',
    accentText: 'group-hover:text-emerald-600 dark:group-hover:text-emerald-400',
    accentBorder: 'hover:border-emerald-500/40',
  },
  indigo: {
    glow: 'rgba(99, 102, 241, 0.22)',
    spotlight: 'rgba(99, 102, 241, 0.16)',
    gradientBg: 'from-indigo-500/12 via-indigo-500/4 to-transparent',
    iconBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 group-hover:border-indigo-500/40',
    iconGlow: 'rgba(99, 102, 241, 0.25)',
    badgeColor: 'text-indigo-700 dark:text-indigo-300 bg-indigo-500/10 border border-indigo-500/20',
    rimBorder: 'group-hover:border-indigo-500/40',
    accentText: 'group-hover:text-indigo-600 dark:group-hover:text-indigo-400',
    accentBorder: 'hover:border-indigo-500/40',
  },
  amber: {
    glow: 'rgba(245, 158, 11, 0.22)',
    spotlight: 'rgba(245, 158, 11, 0.16)',
    gradientBg: 'from-amber-500/12 via-amber-500/4 to-transparent',
    iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 group-hover:border-amber-500/40',
    iconGlow: 'rgba(245, 158, 11, 0.25)',
    badgeColor: 'text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/20',
    rimBorder: 'group-hover:border-amber-500/40',
    accentText: 'group-hover:text-amber-600 dark:group-hover:text-amber-400',
    accentBorder: 'hover:border-amber-500/40',
  },
  rose: {
    glow: 'rgba(244, 63, 94, 0.22)',
    spotlight: 'rgba(244, 63, 94, 0.16)',
    gradientBg: 'from-rose-500/12 via-rose-500/4 to-transparent',
    iconBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 group-hover:border-rose-500/40',
    iconGlow: 'rgba(244, 63, 94, 0.25)',
    badgeColor: 'text-rose-700 dark:text-rose-300 bg-rose-500/10 border border-rose-500/20',
    rimBorder: 'group-hover:border-rose-500/40',
    accentText: 'group-hover:text-rose-600 dark:group-hover:text-rose-400',
    accentBorder: 'hover:border-rose-500/40',
  },
  cyan: {
    glow: 'rgba(6, 182, 212, 0.22)',
    spotlight: 'rgba(6, 182, 212, 0.16)',
    gradientBg: 'from-cyan-500/12 via-cyan-500/4 to-transparent',
    iconBg: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20 group-hover:border-cyan-500/40',
    iconGlow: 'rgba(6, 182, 212, 0.25)',
    badgeColor: 'text-cyan-700 dark:text-cyan-300 bg-cyan-500/10 border border-cyan-500/20',
    rimBorder: 'group-hover:border-cyan-500/40',
    accentText: 'group-hover:text-cyan-600 dark:group-hover:text-cyan-400',
    accentBorder: 'hover:border-cyan-500/40',
  },
  violet: {
    glow: 'rgba(139, 92, 246, 0.22)',
    spotlight: 'rgba(139, 92, 246, 0.16)',
    gradientBg: 'from-violet-500/12 via-violet-500/4 to-transparent',
    iconBg: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20 group-hover:border-violet-500/40',
    iconGlow: 'rgba(139, 92, 246, 0.25)',
    badgeColor: 'text-violet-700 dark:text-violet-300 bg-violet-500/10 border border-violet-500/20',
    rimBorder: 'group-hover:border-violet-500/40',
    accentText: 'group-hover:text-violet-600 dark:group-hover:text-violet-400',
    accentBorder: 'hover:border-violet-500/40',
  },
  teal: {
    glow: 'rgba(20, 184, 166, 0.22)',
    spotlight: 'rgba(20, 184, 166, 0.16)',
    gradientBg: 'from-teal-500/12 via-teal-500/4 to-transparent',
    iconBg: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20 group-hover:border-teal-500/40',
    iconGlow: 'rgba(20, 184, 166, 0.25)',
    badgeColor: 'text-teal-700 dark:text-teal-300 bg-teal-500/10 border border-teal-500/20',
    rimBorder: 'group-hover:border-teal-500/40',
    accentText: 'group-hover:text-teal-600 dark:group-hover:text-teal-400',
    accentBorder: 'hover:border-teal-500/40',
  },
  purple: {
    glow: 'rgba(168, 85, 247, 0.22)',
    spotlight: 'rgba(168, 85, 247, 0.16)',
    gradientBg: 'from-purple-500/12 via-purple-500/4 to-transparent',
    iconBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 group-hover:border-purple-500/40',
    iconGlow: 'rgba(168, 85, 247, 0.25)',
    badgeColor: 'text-purple-700 dark:text-purple-300 bg-purple-500/10 border border-purple-500/20',
    rimBorder: 'group-hover:border-purple-500/40',
    accentText: 'group-hover:text-purple-600 dark:group-hover:text-purple-400',
    accentBorder: 'hover:border-purple-500/40',
  },
};

export const ModernDashboardCard: React.FC<ModernDashboardCardProps> = ({
  title,
  subValue,
  trendContext,
  icon,
  accent = 'indigo',
  badgeText,
  onClick,
  className = '',
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);

  const styleConfig = ACCENT_STYLES[accent] || ACCENT_STYLES.indigo;
  const mainTitle = title || badgeText || 'بخش اصلی';

  return (
    <motion.div
      ref={cardRef}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      role={onClick ? 'button' : 'region'}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={e => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      dir="rtl"
      className={`
        glass-card group relative p-6 rounded-2xl select-none cursor-pointer flex flex-col justify-between
        border border-slate-200/90 dark:border-white/10 min-h-[220px]
        bg-gradient-to-br ${styleConfig.gradientBg}
        ${styleConfig.rimBorder}
        hover:z-30 hover:shadow-2xl transition-all duration-300
        ${className}
      `}
      style={{
        ['--mouse-x' as string]: `${mousePos.x}px`,
        ['--mouse-y' as string]: `${mousePos.y}px`,
      }}
    >
      {/* هاله نور پس‌زمینه کارت با حجم کنترل‌شده و متمرکز (Ambient Diffuse Halo) */}
      <div
        className="pointer-events-none absolute -inset-1 rounded-2xl opacity-0 blur-lg transition-opacity duration-500 group-hover:opacity-100 -z-10"
        style={{
          background: `radial-gradient(160px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${styleConfig.glow}, transparent 75%)`,
        }}
      />

      {/* خط افق مویی بازتابی سقف کارت (Specular Top Edge) */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/90 dark:via-white/25 to-transparent opacity-80 group-hover:opacity-100 transition-opacity"
        aria-hidden="true"
      />

      {/* نورافکن تعقیب‌کننده موس با حجم جمع‌وجور و دقیق (Interactive Spotlight) */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(140px circle at var(--mouse-x, 0px) var(--mouse-y, 0px), ${styleConfig.spotlight}, transparent 75%)`,
        }}
        aria-hidden="true"
      />

      {/* ردیف بالا: باکس آیکون مدرن با هاله نوری و مرز کریستالی + برچسب دسته‌بندی */}
      <div className="flex items-center justify-between gap-3 mb-3">
        {icon && (
          <div className="relative group/icon">
            {/* هاله نوری اختصاصی پشت باکس آیکون */}
            <div
              className="absolute -inset-1 rounded-2xl opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-100 pointer-events-none"
              style={{ background: styleConfig.iconGlow }}
            />
            {/* بدنه باکس آیکون با شفافیت 10% و مرز نوری 20% به 40% در هاور */}
            <div
              className={`
                relative w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0
                backdrop-blur-md transition-all duration-300 group-hover:scale-110 group-hover:rotate-2
                shadow-xs ${styleConfig.iconBg}
              `}
            >
              {/* بازتاب افقی داخلی لبه سقف آیکون */}
              <div className="absolute inset-x-0 top-0 h-px bg-white/40 dark:bg-white/20 rounded-t-2xl pointer-events-none" />
              {icon}
            </div>
          </div>
        )}

        {badgeText && (
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-xl backdrop-blur-xs transition-colors ${styleConfig.badgeColor}`}>
            {badgeText}
          </span>
        )}
      </div>

      {/* بخش مرکزی: عنوان اصلی بزرگ و برجسته با فونت فوق‌العاده خوانا */}
      <div className="my-2 space-y-2">
        <h2 className={`text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-snug transition-colors duration-200 ${styleConfig.accentText}`}>
          {mainTitle}
        </h2>

        {subValue && (
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal line-clamp-2">
            {subValue}
          </p>
        )}
      </div>

      {/* ردیف پایین: درگاه اختصاصی و دکمه ورود تعاملی */}
      <div className="pt-3 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between text-xs mt-3">
        <span className="text-[11px] text-slate-400 dark:text-slate-400 font-medium">
          {trendContext || 'درگاه اختصاصی'}
        </span>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/5 dark:bg-white/10 group-hover:bg-slate-900 dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-slate-950 font-bold text-slate-700 dark:text-slate-200 transition-all shadow-xs">
          <span>ورود به بخش</span>
          <ArrowLeft className="w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-x-1" />
        </div>
      </div>
    </motion.div>
  );
};
