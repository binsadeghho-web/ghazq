import React from 'react';
import { ArrowLeft } from 'lucide-react';

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
}

const ACCENT_MAP: Record<NonNullable<MinimalShowcaseCardProps['accentTone']>, {
  iconBox: string;
  kickerText: string;
  primaryBtn: string;
}> = {
  emerald: {
    iconBox: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    kickerText: 'text-emerald-700',
    primaryBtn: 'bg-emerald-800 hover:bg-emerald-900 text-white',
  },
  amber: {
    iconBox: 'bg-amber-50 text-amber-800 border-amber-200/80',
    kickerText: 'text-amber-800',
    primaryBtn: 'bg-amber-600 hover:bg-amber-700 text-white',
  },
  sky: {
    iconBox: 'bg-sky-50 text-sky-800 border-sky-200/80',
    kickerText: 'text-sky-800',
    primaryBtn: 'bg-sky-800 hover:bg-sky-900 text-white',
  },
  indigo: {
    iconBox: 'bg-indigo-50 text-indigo-800 border-indigo-200/80',
    kickerText: 'text-indigo-800',
    primaryBtn: 'bg-indigo-800 hover:bg-indigo-900 text-white',
  },
  stone: {
    iconBox: 'bg-stone-100 text-stone-800 border-stone-200',
    kickerText: 'text-stone-600',
    primaryBtn: 'bg-stone-900 hover:bg-black text-white',
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
}) => {
  const tone = ACCENT_MAP[accentTone];

  return (
    <div
      className="h-full rounded-2xl bg-white border border-stone-200/90 p-5 flex flex-col justify-between gap-4 transition-colors hover:border-stone-300"
      dir="rtl"
    >
      {/* Top Info */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${tone.iconBox}`}>
              {icon}
            </div>
            <div className="min-w-0">
              <span className={`text-[11px] font-bold block ${tone.kickerText}`}>
                {kicker}
              </span>
              <h3 className="text-sm sm:text-base font-extrabold text-stone-900 truncate mt-0.5">
                {title}
              </h3>
            </div>
          </div>
        </div>

        <p className="text-xs text-stone-600 leading-relaxed line-clamp-2">
          {description}
        </p>
      </div>

      {/* Inline Stats + Actions Footer */}
      <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3">
        {stats.length > 0 ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-stone-500 font-medium">
            {stats.map((st, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span aria-hidden="true" className="text-stone-300">·</span>}
                <span>
                  {st.label}:{' '}
                  <strong className="text-stone-900 font-extrabold tabular-nums">{st.value}</strong>
                </span>
              </React.Fragment>
            ))}
          </div>
        ) : (
          <span />
        )}

        <div className="flex items-center gap-2 shrink-0">
          {actions.map((act, idx) => (
            <button
              key={idx}
              type="button"
              onClick={act.onClick}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                act.primary
                  ? tone.primaryBtn
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
  );
};
