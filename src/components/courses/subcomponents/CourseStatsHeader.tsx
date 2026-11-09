import React from 'react';
import { motion } from 'motion/react';
import { ModernMetricCard } from '../../common/ModernMetricCard';
import {
  GraduationCap,
  CheckCircle,
  PlayCircle,
  ShieldCheck,
  Clock,
  Plus
} from 'lucide-react';

interface CourseStatsHeaderProps {
  availableCount: number;
  enrolledCount: number;
  archiveCount: number;
  pendingReceiptsCount: number;
  totalHours: number;
  isOfficial: boolean;
  onSelectTab: (tab: 'available' | 'my_courses' | 'archive' | 'admin_panel') => void;
  onOpenBuilder: () => void;
}

export const CourseStatsHeader: React.FC<CourseStatsHeaderProps> = ({
  availableCount,
  enrolledCount,
  archiveCount,
  pendingReceiptsCount,
  totalHours,
  isOfficial,
  onSelectTab,
  onOpenBuilder,
}) => {
  return (
    <div className="space-y-6">
      {/* 4 Modern Metric Cards Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <ModernMetricCard
          title="دوره‌های فعال و ترم جاری"
          value={availableCount}
          periodLabel="در حال ثبت‌نام و برگزاری"
          unit="دوره"
          icon={<GraduationCap className="w-4 h-4 text-emerald-500" />}
          onClick={() => onSelectTab('available')}
        />
        <ModernMetricCard
          title="دوره‌های ثبت‌نام‌شده من"
          value={enrolledCount}
          periodLabel="دارای دسترسی تاییدشده یا در انتظار"
          unit="دوره"
          icon={<CheckCircle className="w-4 h-4 text-sky-500" />}
          onClick={() => onSelectTab('my_courses')}
        />
        <ModernMetricCard
          title="آرشیو چندرسانه‌ای"
          value={archiveCount}
          periodLabel="صوت، ویدیو و جزوات تخصصی"
          unit="دوره"
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
            periodLabel="کارگاه‌های عملی و نظری"
            unit="ساعت"
            icon={<Clock className="w-4 h-4 text-indigo-500" />}
          />
        )}
      </div>

      {/* Main Header Bar */}
      <div className="glass-card rounded-3xl p-6 border border-slate-200 dark:border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              دوره‌های تخصصی و کاربردی فقه و قضا
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              ثبت‌نام آنلاین و ارسال مدارک، شیوه اختصاصی پرداخت، پیش‌نمایش تصویر دوره، مدیریت شرکت‌کنندگان و پیامک گروهی
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          {isOfficial && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onOpenBuilder}
              className="flex items-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-stone-950 rounded-2xl text-xs font-black shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>تعریف دوره تخصصی جدید</span>
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
};
