import React from 'react';
import { motion } from 'motion/react';
import { CourseScope } from '../../../types';
import { ModernMetricCard } from '../../common/ModernMetricCard';
import { toPersianNumbers } from '../../../utils/persianNumbers';
import {
  GraduationCap,
  CheckCircle,
  PlayCircle,
  ShieldCheck,
  Clock,
  Plus,
  Sparkles,
} from 'lucide-react';
import type { CourseTab } from './CourseFilterBar';

interface CourseStatsHeaderProps {
  mode?: CourseScope;
  availableCount: number;
  enrolledCount: number;
  archiveCount: number;
  pendingReceiptsCount: number;
  totalHours: number;
  isOfficial: boolean;
  onSelectTab: (tab: CourseTab) => void;
  onOpenBuilder: () => void;
  onOpenShowcaseEditor?: () => void;
}

export const CourseStatsHeader: React.FC<CourseStatsHeaderProps> = ({
  mode = 'specialized',
  availableCount,
  enrolledCount,
  archiveCount,
  pendingReceiptsCount,
  totalHours,
  isOfficial,
  onSelectTab,
  onOpenBuilder,
  onOpenShowcaseEditor,
}) => {
  const isWorkshop = mode === 'counseling_workshop';
  const noun = isWorkshop ? 'کارگاه' : 'دوره';
  const pluralNoun = isWorkshop ? 'کارگاه‌های' : 'دوره‌های';

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Luxury Obsidian-Emerald Mobile Header & 1-Row Stat Pills (< sm) */}
      <div className="sm:hidden space-y-3">
        <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#071E17] via-[#0E3226] to-[#08221A] text-white p-4 border border-amber-400/20 shadow-[0_14px_34px_-16px_rgba(7,30,23,0.65)] space-y-3">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 luxury-lattice-bg opacity-65" />
          <span aria-hidden="true" className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-l from-transparent via-amber-300/60 to-transparent" />
          <div className="relative z-10 flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-amber-400/15 border border-amber-300/35 text-amber-300 flex items-center justify-center shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm font-black text-white truncate">
                  {isWorkshop ? 'کارگاه‌های آموزشی و مشاوره' : 'دوره‌های تخصصی فقه و قضا'}
                </h1>
                <p className="text-[10px] text-emerald-100/80 truncate mt-0.5">
                  ثبت‌نام، کلاس‌های آنلاین/حضوری و آرشیو جلسات
                </p>
              </div>
            </div>
            {isOfficial && (
              <button
                type="button"
                onClick={onOpenBuilder}
                className="px-3 py-2 min-h-[38px] rounded-xl bg-amber-400 text-stone-950 text-xs font-black flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>جدید</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-0.5">
          <button
            type="button"
            onClick={() => onSelectTab('available')}
            className="flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold shrink-0 cursor-pointer"
          >
            <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
            <span>در حال پذیرش</span>
            <span className="px-1.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 font-black tabular-nums text-[10px]">
              {toPersianNumbers(availableCount)}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('my_courses')}
            className="flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold shrink-0 cursor-pointer"
          >
            <CheckCircle className="w-3.5 h-3.5 text-sky-600" />
            <span>ثبت‌نام‌شده من</span>
            <span className="px-1.5 py-0.5 rounded-lg bg-sky-50 text-sky-800 font-black tabular-nums text-[10px]">
              {toPersianNumbers(enrolledCount)}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('archive')}
            className="flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold shrink-0 cursor-pointer"
          >
            <PlayCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>آرشیو</span>
            <span className="px-1.5 py-0.5 rounded-lg bg-amber-50 text-amber-800 font-black tabular-nums text-[10px]">
              {toPersianNumbers(archiveCount)}
            </span>
          </button>

          <div className="flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold shrink-0">
            <Clock className="w-3.5 h-3.5 text-indigo-600" />
            <span className="tabular-nums">{toPersianNumbers(totalHours)} ساعت</span>
          </div>
        </div>
      </div>

      {/* 4 Modern Metric Cards Overview (Tablet & Desktop >= sm) */}
      <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ModernMetricCard
          title={`${pluralNoun} فعال و در حال پذیرش`}
          value={availableCount}
          periodLabel="در حال ثبت‌نام و برگزاری"
          unit={noun}
          icon={<GraduationCap className="w-4 h-4 text-emerald-500" />}
          onClick={() => onSelectTab('available')}
        />
        <ModernMetricCard
          title={`${pluralNoun} ثبت‌نام‌شده من`}
          value={enrolledCount}
          periodLabel="دارای دسترسی تاییدشده یا در انتظار"
          unit={noun}
          icon={<CheckCircle className="w-4 h-4 text-sky-500" />}
          onClick={() => onSelectTab('my_courses')}
        />
        <ModernMetricCard
          title={`آرشیو ${pluralNoun} برگزارشده`}
          value={archiveCount}
          periodLabel="صوت، ویدیو و جزوات تخصصی"
          unit={noun}
          icon={<PlayCircle className="w-4 h-4 text-amber-500" />}
          onClick={() => onSelectTab('archive')}
        />
        {isOfficial ? (
          <ModernMetricCard
            title="فیش‌های در نوبت بررسی"
            value={pendingReceiptsCount}
            periodLabel="تایید مالی و اختصاص دسترسی"
            unit="رسید"
            icon={<ShieldCheck className="w-4 h-4 text-rose-500" />}
            onClick={() => onSelectTab('admin_panel')}
          />
        ) : (
          <ModernMetricCard
            title="مجموع ساعات آموزش"
            value={totalHours}
            periodLabel={isWorkshop ? 'کارگاه‌های روانشناسی و مشاوره' : 'کارگاه‌های عملی و نظری'}
            unit="ساعت"
            icon={<Clock className="w-4 h-4 text-indigo-500" />}
          />
        )}
      </div>

      {/* Main Header Bar (Tablet & Desktop >= sm) */}
      <div className="hidden sm:flex glass-card rounded-3xl p-6 border border-slate-200 dark:border-white/10 flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {isWorkshop
                ? 'کارگاه‌های آموزشی و توانمندسازی روانشناختی و مشاوره'
                : 'دوره‌های تخصصی و کاربردی فقه و قضا'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isWorkshop
                ? 'ثبت‌نام آنلاین یا ارسال فیش بانکی، حضور و غیاب چندجلسه‌ای، کدهای تخفیف، اقساط، گواهینامه و دانلود فایل‌های کارگاه روی دیسک'
                : 'ثبت‌نام آنلاین و ارسال مدارک، شیوه اختصاصی پرداخت، پیش‌نمایش تصویر دوره، مدیریت شرکت‌کنندگان و پیامک گروهی'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          {isOfficial && isWorkshop && onOpenShowcaseEditor && (
            <button
              type="button"
              onClick={onOpenShowcaseEditor}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-black border border-slate-200 dark:border-slate-700 transition-colors whitespace-nowrap cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>تنظیم ویترین داشبورد</span>
            </button>
          )}
          {isOfficial && (
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onOpenBuilder}
              className="flex items-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-stone-950 rounded-2xl text-xs font-black shadow-lg shadow-emerald-500/20 transition-all whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isWorkshop ? 'تعریف کارگاه آموزشی جدید' : 'تعریف دوره تخصصی جدید'}</span>
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
};
