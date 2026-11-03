import React from 'react';
import { useApp } from '../../context/AppContext';
import { toPersianNumbers } from '../../utils/persianNumbers';
import { Users, GraduationCap, Scale, Award, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const MizanImpactSection: React.FC = () => {
  const { mizanConfig } = useApp();

  if (mizanConfig.showImpactSection === false) return null;

  const items = [
    {
      label: 'دانش‌آموختگان و قضات عضو',
      value: mizanConfig.impactAlumniCount || '۱,۰۴۲',
      unit: 'نفر نخبه قضایی',
      source: mizanConfig.impactAlumniSource || 'دبیرخانه مجمع دانش‌آموختگان فقه و قضا - آبان ۱۴۰۳',
      icon: Users,
      color: '#158561',
      bg: '#DDF5E9'
    },
    {
      label: 'کارگاه‌ها و دوره‌های عالی',
      value: mizanConfig.impactCoursesCount || '۴۸',
      unit: 'عنوان دوره تخصصی',
      source: mizanConfig.impactCoursesSource || 'معاونت آموزش‌های تخصصی و کاربردی',
      icon: GraduationCap,
      color: '#00848B',
      bg: '#D8F5F6'
    },
    {
      label: 'دادنامه‌های بررسی و نقدشده',
      value: mizanConfig.impactRulingsCount || '۳۲۰',
      unit: 'رأی مدلل محاکم',
      source: mizanConfig.impactRulingsSource || 'کمیسیون علمی نقد و داوری احکام قضایی',
      icon: Scale,
      color: '#9A6418',
      bg: '#FCECD9'
    },
    {
      label: 'شاخص رضایت اعضا و شفافیت',
      value: mizanConfig.impactSatisfactionRate || '۹۹.۴٪',
      unit: 'تضمین کیفیت خدمت',
      source: mizanConfig.impactSatisfactionSource || 'نظرسنجی ادواری خدمات و بازخورد اعضا',
      icon: Award,
      color: '#DBB155',
      bg: '#FDF7E7'
    }
  ];

  return (
    <div className="bg-[#F8FBF9] rounded-2xl p-6 sm:p-7 border border-[#D1DAD5] shadow-[0_4px_16px_rgba(7,52,36,0.06)] space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E4ECE8] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#207E5D]" />
            <h3 className="text-base font-extrabold text-[#0F1E18]">
              شاخص‌های شفاف عملکرد و اثرگذاری سامانه
            </h3>
          </div>
          <p className="text-xs text-[#5E6D66] mt-0.5">
            کلیه آمارها بر اساس آخرین مستندات ثبتی دبیرخانه و با ذکر منبع رسمی درج شده‌اند
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-[#176449] font-bold bg-[#E9FAF2] px-3 py-1.5 rounded-xl border border-[#D4F4E5] self-start sm:self-auto">
          <ShieldCheck className="w-4 h-4 text-[#207E5D]" />
          <span>پایش دوره‌ای و شفافیت آماری</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {items.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-xl p-4 border border-[#E4ECE8] hover:border-[#D1DAD5] transition-colors flex flex-col justify-between space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#3B4C44]">{item.label}</span>
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: item.bg, color: item.color }}
                >
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-[#0F1E18] tabular-nums tracking-tight">
                    {item.value}
                  </span>
                  <span className="text-[11px] font-bold text-[#5E6D66]">{item.unit}</span>
                </div>
                <div className="mt-2 pt-2 border-t border-[#F0F5F2] flex items-start gap-1 text-[10px] text-[#5E6D66] leading-relaxed">
                  <CheckCircle2 className="w-3 h-3 text-[#207E5D] shrink-0 mt-0.5" />
                  <span className="line-clamp-2">منبع: {item.source}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
