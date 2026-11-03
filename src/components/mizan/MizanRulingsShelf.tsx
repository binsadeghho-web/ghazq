import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { toPersianNumbers } from '../../utils/persianNumbers';
import {
  Scale,
  MessageSquare,
  ArrowLeft,
  FileText,
  Building2,
  Sparkles
} from 'lucide-react';

interface MizanRulingsShelfProps {
  onNavigate: (tabId: string) => void;
}

export const MizanRulingsShelf: React.FC<MizanRulingsShelfProps> = ({ onNavigate }) => {
  const { rulings, mizanConfig } = useApp();
  const [activeCategory, setActiveCategory] = useState<'all' | 'civil' | 'criminal' | 'commercial' | 'family'>('all');

  if (mizanConfig.showRulingsShelf === false && mizanConfig.showRulingsPicks === false) return null;

  // فیلتر آراء بر اساس دسته‌بندی
  const filteredRulings = rulings.filter(r => {
    if (activeCategory === 'all') return true;
    return r.caseType === activeCategory;
  }).slice(0, 3);

  const categories = [
    { id: 'all', label: 'همه آراء منتخب' },
    { id: 'civil', label: 'حقوقی و مدنی' },
    { id: 'criminal', label: 'کیفری و جرایم' },
    { id: 'commercial', label: 'تجاری و ورشکستگی' },
    { id: 'family', label: 'خانواده و ارث' }
  ] as const;

  return (
    <section className="space-y-4">
      {/* هدر بخش و فیلترهای سبک */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#F8EED8] text-[#9A6418] flex items-center justify-center font-bold">
            <Scale className="w-4 h-4 text-[#9A6418]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#0D3829]">تالار منتخب دادنامه‌ها و آراء قضایی</h3>
            <p className="text-xs text-[#527768]">تحلیل علمی و تبادل نظر پیرامون آخرین دادنامه‌های محاکم دادگستری</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* تب‌های دسته‌بندی */}
          <div className="flex items-center gap-1 bg-[#EEF5F1] p-1 rounded-xl text-xs">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  activeCategory === cat.id
                    ? 'bg-white text-[#0D3829] shadow-sm font-bold'
                    : 'text-[#587E6F] hover:text-[#0D3829]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => onNavigate('rulings')}
            className="text-xs font-semibold text-[#158561] hover:text-[#0C583F] flex items-center gap-1 transition-colors px-2 py-1"
          >
            <span>ورود به تالار آراء</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* شبکه دادنامه‌ها */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filteredRulings.map(ruling => (
          <div
            key={ruling.id}
            onClick={() => onNavigate('rulings')}
            className="group cursor-pointer rounded-2xl bg-white border border-[#E3ECE8] p-5 shadow-sm hover:shadow-md hover:border-[#158561]/40 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              {/* شعبه و وضعیت رأی */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-[#EEF5F1] text-[#1E5C46]">
                  {ruling.caseTypeTitle || 'حقوقی'}
                </span>
                <span className="text-[11px] font-mono text-[#719588] flex items-center gap-1">
                  <FileText className="w-3 h-3 text-[#158561]" />
                  <span>پرونده {toPersianNumbers(ruling.id)}</span>
                </span>
              </div>

              {/* عنوان رأی */}
              <h4 className="text-sm font-bold text-[#143D2D] leading-snug group-hover:text-[#158561] transition-colors line-clamp-2">
                {ruling.title}
              </h4>

              {/* خلاصه مستندات و شرح قاضی */}
              <p className="text-xs text-[#527768] line-clamp-3 leading-relaxed">
                {ruling.summary || 'بررسی مستندات قانونی و اصول حاکم بر تفسیر قراردادها در رسیدگی دادگاه'}
              </p>

              {/* اصول حقوقی استنادشده */}
              {ruling.legalPrinciples && ruling.legalPrinciples.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {ruling.legalPrinciples.slice(0, 3).map((principle, i) => (
                    <span
                      key={i}
                      className="text-[10px] bg-[#F4F9F6] border border-[#DEEBE5] text-[#336150] px-2 py-0.5 rounded-md"
                    >
                      #{principle}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* فوتر رأی با شاخص نقدها و دادگاه صادرکننده */}
            <div className="pt-4 mt-4 border-t border-[#EDF3F0] flex items-center justify-between text-xs text-[#587E6F]">
              <div className="flex items-center gap-1 text-[11px] text-[#426C5D]">
                <Building2 className="w-3.5 h-3.5 text-[#158561]" />
                <span className="truncate max-w-[150px]">{ruling.courtBranch || 'شعبه صادرکننده'}</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-[#158561]">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span className="font-semibold text-[11px]">
                    {toPersianNumbers(ruling.discussions?.length || 3)} نقد
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[#158561] font-semibold text-[11px] group-hover:underline">
                  <span>تحلیل</span>
                  <ArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-0.5" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
