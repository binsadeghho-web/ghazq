import React from 'react';
import { RequestStatus } from '../../types';
import { toPersianNumbers } from '../../utils/persianNumbers';
import { Clock, FolderKanban, BadgeAlert, Archive } from 'lucide-react';

interface CartableStatsCardsProps {
  isOfficial: boolean;
  totalCount: number;
  pendingCount: number;
  inProgressCount: number;
  unreadCount: number;
  archivedCount: number;
  statusFilter: 'all' | RequestStatus;
  onSelectFilter: (status: 'all' | RequestStatus, switchToAllRequests?: boolean) => void;
}

export const CartableStatsCards: React.FC<CartableStatsCardsProps> = ({
  isOfficial,
  totalCount,
  pendingCount,
  inProgressCount,
  unreadCount,
  archivedCount,
  statusFilter,
  onSelectFilter,
}) => {
  if (isOfficial) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl px-4 py-2.5 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center flex-wrap gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => onSelectFilter('all', true)}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'all'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <span>همه پرونده‌ها</span>
            <span className="font-mono tabular-nums opacity-80">{toPersianNumbers(totalCount)}</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectFilter(statusFilter === 'pending' ? 'all' : 'pending', true)}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'pending'
                ? 'bg-amber-500 text-stone-950 font-black'
                : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>جدید / باز</span>
            <span className="font-mono tabular-nums">{toPersianNumbers(pendingCount)}</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectFilter(statusFilter === 'in_progress' ? 'all' : 'in_progress', true)}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'in_progress'
                ? 'bg-sky-500 text-stone-950 font-black'
                : 'bg-sky-500/10 text-sky-700 dark:text-sky-300 hover:bg-sky-500/20'
            }`}
          >
            <FolderKanban className="w-3.5 h-3.5" />
            <span>در حال جریان</span>
            <span className="font-mono tabular-nums">{toPersianNumbers(inProgressCount)}</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectFilter(statusFilter === 'archived' ? 'all' : 'archived', true)}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'archived'
                ? 'bg-emerald-500 text-stone-950 font-black'
                : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>مختومه / انجام‌شده</span>
            <span className="font-mono tabular-nums">{toPersianNumbers(archivedCount)}</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold">
            <BadgeAlert className="w-3.5 h-3.5" />
            <span>پیام‌های نخوانده:</span>
            <span className="font-mono tabular-nums font-black">{toPersianNumbers(unreadCount)}</span>
          </span>
        </div>
      </div>
    );
  }

  // ============================================================================
  // ALUMNI VIEW (اصلاح ۵): طراحی جدید زیبا، سبک و ۱۰٪ کوچک‌تر از حالت قبلی
  // ============================================================================
  const cards = [
    {
      id: 'pending' as const,
      title: 'درخواست‌های جدید / باز',
      subtitle: 'در انتظار بررسی مسئول',
      value: pendingCount,
      unit: 'مورد',
      icon: Clock,
      accentBar: 'from-amber-400 via-amber-500 to-orange-400',
      iconWrap: 'bg-amber-500/12 text-amber-600 dark:text-amber-400 border-amber-500/20',
      activeBorder: 'ring-2 ring-amber-500/50 border-amber-500/60',
    },
    {
      id: 'in_progress' as const,
      title: 'در حال جریان',
      subtitle: 'پیگیری و اقدام اداری',
      value: inProgressCount,
      unit: 'مورد',
      icon: FolderKanban,
      accentBar: 'from-sky-400 via-sky-500 to-cyan-400',
      iconWrap: 'bg-sky-500/12 text-sky-600 dark:text-sky-400 border-sky-500/20',
      activeBorder: 'ring-2 ring-sky-500/50 border-sky-500/60',
    },
    {
      id: 'unread' as const,
      title: 'پاسخ و اعلان جدید',
      subtitle: 'پیام‌های خوانده‌نشده',
      value: unreadCount,
      unit: 'پیام',
      icon: BadgeAlert,
      accentBar: 'from-rose-400 via-rose-500 to-pink-400',
      iconWrap: 'bg-rose-500/12 text-rose-600 dark:text-rose-400 border-rose-500/20',
      activeBorder: 'ring-2 ring-rose-500/50 border-rose-500/60',
    },
    {
      id: 'archived' as const,
      title: 'پرونده‌های مختومه',
      subtitle: 'بایگانی و تکمیل‌شده',
      value: archivedCount,
      unit: 'پرونده',
      icon: Archive,
      accentBar: 'from-emerald-400 via-emerald-500 to-teal-400',
      iconWrap: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      activeBorder: 'ring-2 ring-emerald-500/50 border-emerald-500/60',
    },
  ];

  return (
    <div dir="rtl">
      {/* Compact Luxury Mobile KPI Strip (< sm) */}
      <div className="sm:hidden flex items-center gap-2 overflow-x-auto scrollbar-none pb-0.5">
        {cards.map(card => {
          const Icon = card.icon;
          const isActive = card.id !== 'unread' && statusFilter === card.id;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => {
                if (card.id === 'unread') {
                  onSelectFilter('all', true);
                } else {
                  onSelectFilter(statusFilter === card.id ? 'all' : card.id, true);
                }
              }}
              className={`flex items-center gap-2 px-3 py-2 min-h-[42px] rounded-2xl border text-xs shrink-0 transition-all cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-l from-[#071E17] to-emerald-800 text-white border-amber-400/30 shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-slate-200/90 dark:border-slate-800'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-amber-300' : 'text-emerald-700'}`} />
              <span className="font-bold whitespace-nowrap">{card.title.split(' ')[0]}</span>
              <span
                className={`px-1.5 py-0.5 rounded-lg text-[10px] font-black tabular-nums ${
                  isActive
                    ? 'bg-white/15 text-amber-200'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                }`}
              >
                {toPersianNumbers(card.value)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tablet & Desktop KPI Grid (>= sm) */}
      <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map(card => {
          const Icon = card.icon;
          const isActive = card.id !== 'unread' && statusFilter === card.id;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => {
                if (card.id === 'unread') {
                  onSelectFilter('all', true);
                } else {
                  onSelectFilter(statusFilter === card.id ? 'all' : card.id, true);
                }
              }}
              className={`group relative overflow-hidden text-right rounded-2xl p-3.5 bg-white dark:bg-slate-900 border transition-all duration-200 cursor-pointer hover:shadow-md hover:-translate-y-0.5 ${
                isActive
                  ? card.activeBorder
                  : 'border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {/* Subtle top accent stripe */}
              <div className={`absolute top-0 inset-x-0 h-[3px] bg-gradient-to-l ${card.accentBar} opacity-80`} />

              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 truncate">
                  {card.title}
                </span>
                <span className={`w-7 h-7 rounded-xl border flex items-center justify-center shrink-0 ${card.iconWrap}`}>
                  <Icon className="w-3.5 h-3.5" />
                </span>
              </div>

              <div className="flex items-baseline justify-between gap-2">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-black text-slate-900 dark:text-white font-mono tabular-nums tracking-tight">
                    {toPersianNumbers(card.value)}
                  </span>
                  <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
                    {card.unit}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate">
                  {card.subtitle}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

