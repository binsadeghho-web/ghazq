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

interface CounselingFieldsShowcaseProps {
  title: string;
  subtitle?: string;
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

const ACCENT_MAP: Record<string, { badge: string; border: string; iconBg: string }> = {
  emerald: {
    badge: 'text-emerald-700 dark:text-emerald-300',
    border: 'hover:border-emerald-400/70 dark:hover:border-emerald-600/70',
    iconBg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
  },
  amber: {
    badge: 'text-amber-700 dark:text-amber-300',
    border: 'hover:border-amber-400/70 dark:hover:border-amber-600/70',
    iconBg: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
  },
  indigo: {
    badge: 'text-indigo-700 dark:text-indigo-300',
    border: 'hover:border-indigo-400/70 dark:hover:border-indigo-600/70',
    iconBg: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20',
  },
  teal: {
    badge: 'text-teal-700 dark:text-teal-300',
    border: 'hover:border-teal-400/70 dark:hover:border-teal-600/70',
    iconBg: 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20',
  },
  rose: {
    badge: 'text-rose-700 dark:text-rose-300',
    border: 'hover:border-rose-400/70 dark:hover:border-rose-600/70',
    iconBg: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
  },
};

export const CounselingFieldsShowcase: React.FC<CounselingFieldsShowcaseProps> = ({
  title,
  subtitle,
  fields,
  onSelectField,
  variant = 'general',
}) => {
  const activeFields = fields.filter(f => f.isActive);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1">
            <Compass className="w-4 h-4 shrink-0" />
            <span>{variant === 'specialized' ? 'محورهای تخصصی هدایت شغلی و تحصیلی' : 'حوزه‌های خدمات روان‌شناختی'}</span>
          </div>
          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">{title}</h3>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
          )}
        </div>
        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
          روی هر زمینه کلیک کنید تا فرم ثبت درخواست با همان محور باز شود
        </span>
      </div>

      {activeFields.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center text-xs text-slate-500 dark:text-slate-400">
          هنوز زمینه مشاوره‌ای برای این بخش تعریف نشده است.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeFields.map((field, idx) => {
            const IconComp = ICON_MAP[field.iconName || 'sparkles'] || Sparkles;
            const accent = ACCENT_MAP[field.accentColor || (variant === 'specialized' ? 'amber' : 'emerald')] || ACCENT_MAP.emerald;

            return (
              <motion.button
                key={field.id}
                type="button"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: idx * 0.04 }}
                onClick={() => onSelectField(field)}
                className={`group text-right p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between gap-4 cursor-pointer ${accent.border}`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 ${accent.iconBg}`}>
                      <IconComp className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      #{String(idx + 1).padStart(2, '0')}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-black text-sm text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
                      {field.title}
                    </h4>
                    {field.subtitle && (
                      <p className={`text-[11px] font-bold mt-1 ${accent.badge}`}>
                        {field.subtitle}
                      </p>
                    )}
                  </div>

                  {field.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
                      {field.description}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>ثبت درخواست در این زمینه</span>
                  <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:-translate-x-1 transition-all" />
                </div>
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
};
