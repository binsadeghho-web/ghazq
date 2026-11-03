import React from 'react';
import { motion } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { AnimatedCounter } from '../common/AnimatedCounter';
import {
  Users,
  GraduationCap,
  Scale,
  Award,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Clock
} from 'lucide-react';

export const ServicesShowcase: React.FC = () => {
  const { crextioConfig } = useApp();

  if (crextioConfig.showShowcaseSection === false) return null;

  const title = crextioConfig.showcaseTitle || 'ویترین گزارش خدمات و دستاوردهای سامانه فقه و قضا';
  const subtitle = crextioConfig.showcaseSubtitle || 'گزارش شفاف آمار فعالیت‌ها، خدمت‌رسانی به نخبگان و رضایت‌مندی اعضا';
  const alumniCount = crextioConfig.showcaseAlumniCount || '۱,۰۴۲';
  const coursesCount = crextioConfig.showcaseCoursesCount || '۴۸';
  const rulingsCount = crextioConfig.showcaseRulingsCount || '۳۲۰';
  const satisfactionRate = crextioConfig.showcaseSatisfactionRate || '۹۹.۸٪';

  const stats = [
    {
      label: 'دانش‌آموختگان و قضات عضو',
      value: alumniCount,
      unit: 'نفر نخبه',
      desc: 'قضات، مستشاران و اعضای هیئت علمی',
      icon: Users,
      accent: 'from-emerald-500 to-teal-600',
      glow: 'rgba(16, 185, 129, 0.25)',
      badge: 'پایش مستمر'
    },
    {
      label: 'دوره‌ها و کارگاه‌های عالی',
      value: coursesCount,
      unit: 'عنوان دوره',
      desc: 'کارگاه‌های تخصصی فقه القضا و اختبار',
      icon: GraduationCap,
      accent: 'from-amber-500 to-orange-600',
      glow: 'rgba(245, 158, 11, 0.25)',
      badge: 'ثبت‌نام فعال'
    },
    {
      label: 'دادنامه‌های نقد و ارزیابی‌شده',
      value: rulingsCount,
      unit: 'رأی مدلل',
      desc: 'نقد و مباحثه علمی در تالار آراء محاکم',
      icon: Scale,
      accent: 'from-cyan-500 to-blue-600',
      glow: 'rgba(6, 182, 212, 0.25)',
      badge: 'مستندات متقن'
    },
    {
      label: 'شاخص رضایت و شفافیت',
      value: satisfactionRate,
      unit: 'کیفیت خدمت',
      desc: 'بر اساس نظرسنجی ادواری اعضای مجمع',
      icon: Award,
      accent: 'from-purple-500 to-indigo-600',
      glow: 'rgba(168, 85, 247, 0.25)',
      badge: 'تضمین اعتبار'
    }
  ];

  return (
    <div className="bg-gradient-to-br from-[#10201B] via-[#152B24] to-[#0D1A16] rounded-[30px] p-4 sm:p-6 border border-emerald-500/25 text-white shadow-xl space-y-4 relative overflow-hidden">
      {/* Decorative Aurora Mesh Glows */}
      <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />

      {/* Header - Compact 30% reduction with Mizan Scale Insignia */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          {/* نشان زرین میزان و ترازوی قضاوت */}
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 text-stone-950 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0 border border-amber-300/50">
            <Scale className="w-5 h-5 stroke-[2.3]" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-300 fill-amber-300" />
                نشان رسمی میزان · ویترین شفافیت خدمات
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-black tracking-tight text-white mt-0.5">{title}</h2>
            <p className="text-[11px] text-stone-300 line-clamp-1">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-[11px] font-bold text-emerald-300 shrink-0 self-start md:self-auto">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>تایید دبیرخانه مرکزی و ارزیابی عملکرد</span>
        </div>
      </div>

      {/* Statistics Showcase Grid - Animated count-up from 0 */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
        {stats.map((item, idx) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08, duration: 0.3 }}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 hover:border-emerald-400/40 transition-all duration-300 flex flex-col justify-between space-y-3 group relative overflow-hidden"
            >
              {/* Top Row: Label & Glowing Icon Badge */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-200">{item.label}</span>
                <div
                  className={`w-9 h-9 rounded-xl bg-gradient-to-br ${item.accent} flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform`}
                >
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              {/* Middle Row: Animated Numeric Counter Counting up from 0 */}
              <div className="space-y-0.5">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black text-white tracking-tight tabular-nums">
                    <AnimatedCounter value={item.value} duration={1400 + idx * 200} />
                  </span>
                  <span className="text-[11px] text-emerald-300 font-bold">{item.unit}</span>
                </div>
                <p className="text-[10px] text-stone-400 leading-snug line-clamp-1">{item.desc}</p>
              </div>

              {/* Bottom Row: Micro status badge & trend indicator */}
              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-emerald-300 font-bold">
                <span className="flex items-center gap-1 text-emerald-400">
                  <TrendingUp className="w-3 h-3" />
                  <span>{item.badge}</span>
                </span>
                <span className="text-stone-400 font-mono text-[9px] flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5 text-amber-400" />
                  برخط
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
