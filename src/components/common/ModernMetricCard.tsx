import React from 'react';
import { motion } from 'motion/react';

interface ModernMetricCardProps {
  title: string;
  value: string | number;
  periodLabel: string;
  unit?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  onClick?: () => void;
  icon?: React.ReactNode;
}

export const ModernMetricCard: React.FC<ModernMetricCardProps> = ({
  title,
  value,
  periodLabel,
  unit,
  trend,
  onClick,
  icon,
}) => {
  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.11 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`
        glass-card relative p-5 rounded-2xl text-right transition-all duration-200
        border border-slate-200/90 dark:border-white/10 hover:z-20 hover:shadow-xl
        ${onClick ? 'cursor-pointer' : ''}
      `}
    >
      {/* سطر اول: عنوان و دوره */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-3">
        <div className="flex items-center gap-2">
          {icon && (
            <div className="p-2 rounded-lg bg-indigo-500/10 dark:bg-white/10 text-indigo-600 dark:text-amber-400">
              {icon}
            </div>
          )}
          <span className="font-semibold text-slate-800 dark:text-slate-200">{title}</span>
        </div>
        <span className="text-[11px] text-slate-400 dark:text-slate-400">{periodLabel}</span>
      </div>

      {/* سطر دوم: عدد کلیدی با فونت تراز */}
      <div className="flex items-baseline gap-1.5 direction-ltr justify-end">
        {unit && (
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {unit}
          </span>
        )}
        <span className="text-2xl sm:text-3xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-white">
          {value}
        </span>
      </div>

      {/* سطر سوم: روند تغییرات */}
      {trend && (
        <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between text-xs">
          <span className="text-slate-400 dark:text-slate-400">نسبت به دوره قبل</span>
          <span
            className={`tabular-nums font-semibold ${
              trend.isPositive
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {trend.isPositive ? '+' : ''}{trend.value}
          </span>
        </div>
      )}
    </motion.div>
  );
};

