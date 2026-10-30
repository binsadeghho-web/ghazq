import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowUpRight, TrendingUp, TrendingDown, Sparkles } from 'lucide-react';

export type AccentColor =
  | 'blue'
  | 'emerald'
  | 'amber'
  | 'purple'
  | 'rose'
  | 'cyan'
  | 'teal'
  | 'slate'
  | 'indigo';

export interface ModernDashboardCardProps {
  id: string;
  title: string;
  subtext: string;
  metricValue: string | number;
  metricUnit?: string;
  metricLabel?: string;
  trend?: {
    value: string;
    isPositive: boolean;
    label?: string;
  };
  icon: React.ReactNode;
  accentColor: AccentColor;
  onClick: () => void;
  isFeatured?: boolean;
  featuredBadge?: string;
  statusNote?: string;
  metadata?: string[];
}

const colorConfig: Record<
  AccentColor,
  {
    underglowHex: string;
    gradientBg: string;
    iconBg: string;
    iconText: string;
    spotlight: string;
  }
> = {
  blue: {
    underglowHex: '#3b82f6',
    gradientBg: 'from-blue-500/10 via-blue-500/5 to-transparent',
    iconBg: 'bg-blue-500/10 dark:bg-white/10 border-blue-500/20',
    iconText: 'text-blue-600 dark:text-blue-400',
    spotlight: 'rgba(59, 130, 246, 0.16)',
  },
  emerald: {
    underglowHex: '#10b981',
    gradientBg: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
    iconBg: 'bg-emerald-500/10 dark:bg-white/10 border-emerald-500/20',
    iconText: 'text-emerald-600 dark:text-emerald-400',
    spotlight: 'rgba(16, 185, 129, 0.16)',
  },
  amber: {
    underglowHex: '#f59e0b',
    gradientBg: 'from-amber-500/10 via-amber-500/5 to-transparent',
    iconBg: 'bg-amber-500/10 dark:bg-white/10 border-amber-500/20',
    iconText: 'text-amber-600 dark:text-amber-400',
    spotlight: 'rgba(245, 158, 11, 0.16)',
  },
  purple: {
    underglowHex: '#a855f7',
    gradientBg: 'from-purple-500/10 via-purple-500/5 to-transparent',
    iconBg: 'bg-purple-500/10 dark:bg-white/10 border-purple-500/20',
    iconText: 'text-purple-600 dark:text-purple-400',
    spotlight: 'rgba(168, 85, 247, 0.16)',
  },
  rose: {
    underglowHex: '#f43f5e',
    gradientBg: 'from-rose-500/10 via-rose-500/5 to-transparent',
    iconBg: 'bg-rose-500/10 dark:bg-white/10 border-rose-500/20',
    iconText: 'text-rose-600 dark:text-rose-400',
    spotlight: 'rgba(244, 63, 94, 0.16)',
  },
  cyan: {
    underglowHex: '#06b6d4',
    gradientBg: 'from-cyan-500/10 via-cyan-500/5 to-transparent',
    iconBg: 'bg-cyan-500/10 dark:bg-white/10 border-cyan-500/20',
    iconText: 'text-cyan-600 dark:text-cyan-400',
    spotlight: 'rgba(6, 182, 212, 0.16)',
  },
  teal: {
    underglowHex: '#14b8a6',
    gradientBg: 'from-teal-500/10 via-teal-500/5 to-transparent',
    iconBg: 'bg-teal-500/10 dark:bg-white/10 border-teal-500/20',
    iconText: 'text-teal-600 dark:text-teal-400',
    spotlight: 'rgba(20, 184, 166, 0.16)',
  },
  slate: {
    underglowHex: '#64748b',
    gradientBg: 'from-slate-500/10 via-slate-500/5 to-transparent',
    iconBg: 'bg-slate-500/10 dark:bg-white/10 border-slate-500/20',
    iconText: 'text-slate-700 dark:text-slate-300',
    spotlight: 'rgba(100, 116, 139, 0.16)',
  },
  indigo: {
    underglowHex: '#6366f1',
    gradientBg: 'from-indigo-500/10 via-indigo-500/5 to-transparent',
    iconBg: 'bg-indigo-500/10 dark:bg-white/10 border-indigo-500/20',
    iconText: 'text-indigo-600 dark:text-indigo-400',
    spotlight: 'rgba(99, 102, 241, 0.16)',
  },
};

export const ModernDashboardCard: React.FC<ModernDashboardCardProps> = ({
  title,
  subtext,
  metricValue,
  metricUnit,
  metricLabel,
  trend,
  icon,
  accentColor,
  onClick,
  isFeatured = false,
  featuredBadge,
  statusNote,
  metadata = [],
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const colors = colorConfig[accentColor] || colorConfig.blue;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <motion.div
      ref={cardRef}
      whileHover={{ y: -6, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className={`
        glass-card group relative p-6 rounded-2xl text-right cursor-pointer select-none
        border border-slate-200/90 dark:border-white/10
        bg-gradient-to-br ${colors.gradientBg}
      `}
    >
      {/* Ambient Diffuse Halo */}
      <div
        className="pointer-events-none absolute -inset-1 rounded-2xl opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-100 -z-10"
        style={{
          backgroundColor: colors.underglowHex,
          opacity: isHovered ? 0.2 : 0,
        }}
      />

      {/* Mouse Spotlight */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-200"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(260px circle at ${mousePos.x}px ${mousePos.y}px, ${colors.spotlight}, transparent 75%)`,
        }}
      />

      {/* Content Layout */}
      <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
        {/* Row 1: Title / Badge & Icon */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              {metricLabel || 'خدمات اختصاصی'}
            </p>
            <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              {title}
            </h3>
          </div>

          <div
            className={`
              p-3 rounded-xl border flex items-center justify-center shrink-0
              ${colors.iconBg} ${colors.iconText}
              transition-transform duration-200 group-hover:scale-100
            `}
          >
            {icon}
          </div>
        </div>

        {/* Subtext */}
        <p className="text-xs text-slate-500 dark:text-slate-300 leading-relaxed line-clamp-2">
          {subtext}
        </p>

        {/* Row 2: Metric Value */}
        <div className="pt-2 border-t border-slate-200/60 dark:border-white/10 flex items-baseline justify-between">
          <div className="flex items-baseline gap-1.5 font-bold text-2xl sm:text-3xl text-slate-900 dark:text-white tabular-nums">
            <span>{metricValue}</span>
            {metricUnit && (
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {metricUnit}
              </span>
            )}
          </div>

          {isFeatured && featuredBadge && (
            <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>{featuredBadge}</span>
            </span>
          )}
        </div>

        {/* Row 3: Trend & Arrow */}
        <div className="flex items-center justify-between text-xs pt-1">
          <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
            <ArrowUpRight className="w-4 h-4" />
            <span>{trend?.value || statusNote || 'اقدام سریع'}</span>
          </div>

          <div className="flex items-center gap-1 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white font-medium transition-colors">
            <span>ورود</span>
            <ArrowLeft className="w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-x-1" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

