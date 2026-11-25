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
      badge: 'پایش مستمر'
    },
    {
      label: 'دوره‌ها و کارگاه‌های عالی',
      value: coursesCount,
      unit: 'عنوان دوره',
      desc: 'کارگاه‌های تخصصی فقه القضا و اختبار',
      icon: GraduationCap,
      badge: 'ثبت‌نام فعال'
    },
    {
      label: 'دادنامه‌های نقد و ارزیابی‌شده',
      value: rulingsCount,
      unit: 'رأی مدلل',
      desc: 'نقد و مباحثه علمی در تالار آراء محاکم',
      icon: Scale,
      badge: 'مستندات متقن'
    },
    {
      label: 'شاخص رضایت و شفافیت',
      value: satisfactionRate,
      unit: 'کیفیت خدمت',
      desc: 'بر اساس نظرسنجی ادواری اعضای مجمع',
      icon: Award,
      badge: 'تضمین اعتبار'
    }
  ];

  return (
    <div className="bg-gradient-to-br from-[#071E17] via-[#0B2D22] to-[#113C2E] rounded-[28px] p-5 sm:p-6 border border-[#D4AF37]/25 text-white shadow-lg space-y-5 relative overflow-hidden">
      {/* Subtle Architectural Radial Glow */}
      <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#D4AF37]/10 blur-3xl pointer-events-none" />

      {/* Header with Mizan Scale Insignia */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#F3D078] text-[#071E17] flex items-center justify-center shadow-md shrink-0 border border-[#F3D078]/60">
            <Scale className="w-5 h-5 stroke-[2.2]" />
          </div>

          <div>
            <p className="text-[11px] font-extrabold text-[#F3D078] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#F3D078]" />
              نشان رسمی میزان · ویترین شفافیت خدمات
            </p>
            <h2 className="text-base sm:text-lg font-black tracking-tight text-white mt-0.5">{title}</h2>
            <p className="text-[11px] text-emerald-100/75 line-clamp-1">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white/5 px-3.5 py-2 rounded-xl border border-[#D4AF37]/25 text-[11px] font-bold text-[#F3D078] shrink-0 self-start md:self-auto">
          <ShieldCheck className="w-4 h-4 text-[#F3D078]" />
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
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
              className="bg-[#0B2D22]/75 rounded-2xl p-4 border border-[#D4AF37]/15 hover:border-[#F3D078]/45 transition-all duration-200 flex flex-col justify-between space-y-3 group relative overflow-hidden"
            >
              {/* Top Row: Label & Icon */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-emerald-50">{item.label}</span>
                <div className="w-9 h-9 rounded-xl bg-[#071E17] border border-[#D4AF37]/30 flex items-center justify-center text-[#F3D078] shrink-0 group-hover:bg-[#F3D078] group-hover:text-[#071E17] transition-colors">
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              {/* Middle Row: Animated Numeric Counter */}
              <div className="space-y-0.5">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black text-white tracking-tight tabular-nums">
                    <AnimatedCounter value={item.value} duration={1400 + idx * 200} />
                  </span>
                  <span className="text-[11px] text-[#F3D078] font-bold">{item.unit}</span>
                </div>
                <p className="text-[11px] text-emerald-100/70 leading-snug line-clamp-1">{item.desc}</p>
              </div>

              {/* Bottom Row: Micro status & trend indicator */}
              <div className="pt-2.5 border-t border-white/10 flex items-center justify-between text-[10px] font-bold">
                <span className="flex items-center gap-1 text-[#F3D078]">
                  <TrendingUp className="w-3 h-3" />
                  <span>{item.badge}</span>
                </span>
                <span className="text-emerald-100/65 tabular-nums flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5 text-[#F3D078]" />
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
