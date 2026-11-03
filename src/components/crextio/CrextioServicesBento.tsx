import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { toPersianNumbers } from '../../utils/persianNumbers';
import { CrextioBentoCardConfig } from '../../types';
import { DEFAULT_BENTO_CARDS } from '../../data/mockData';
import { CrextioBentoCustomizerModal } from './CrextioBentoCustomizerModal';
import {
  Inbox,
  GraduationCap,
  BookOpen,
  HeartHandshake,
  Compass,
  Scale,
  Gift,
  Users2,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  Sliders,
  Settings
} from 'lucide-react';

interface CrextioServicesBentoProps {
  onNavigateTab: (tab: string) => void;
}

const ICON_MAP: Record<string, any> = {
  People: Inbox,
  counseling_specialized: Compass,
  Counseling: HeartHandshake,
  Courses: GraduationCap,
  Research: BookOpen,
  Rulings: Scale,
  Products: BookOpen,
  Welfare: Gift,
  Synergy: Users2
};

const SIZE_CLASS_MAP: Record<string, string> = {
  '1-col': 'col-span-1 row-span-1',
  '2-col': 'col-span-1 md:col-span-2 row-span-1',
  '3-col': 'col-span-1 md:col-span-3 row-span-1',
  'full': 'col-span-1 md:col-span-3 lg:col-span-4 row-span-1'
};

export const CrextioServicesBento: React.FC<CrextioServicesBentoProps> = ({ onNavigateTab }) => {
  const { crextioConfig, currentUser, cartableRequests } = useApp();
  const [hoveredTile, setHoveredTile] = useState<string | null>(null);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'supervisor';
  const pendingCartable = cartableRequests.filter(r => r.status === 'pending' || r.status === 'in_progress').length;

  const rawCards: CrextioBentoCardConfig[] = crextioConfig.bentoCardsConfig || DEFAULT_BENTO_CARDS;

  // فیلتر و مرتب‌سازی کارت‌ها طبق چیدمان تعیین‌شده توسط ادمین
  const sortedCards = [...rawCards]
    .filter(c => c.isVisible !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <div className="space-y-4">
      {/* هدر بخش همراه با نشان رسمی میزان و دکمه مدیریت چیدمان کارت‌ها */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/95 border border-stone-200/90 p-4 sm:p-5 rounded-3xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 text-stone-950 flex items-center justify-center shadow-xs shrink-0 border border-amber-300">
            <Scale className="w-5 h-5 stroke-[2.3]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-stone-900">ویترین جامع خدمات سامانه (طرح میزان)</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                {toPersianNumbers(sortedCards.length)} درگاه فعال
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              دسترسی آنی به کارتابل، آموزش، مشاوره شغلی، تالار آراء و رفاهیات با هاور تعاملی
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* دکمه اختصاصی ادمین برای مدیریت جایگاه، اندازه و متن کارت‌ها */}
          {isAdmin && (
            <button
              onClick={() => setIsCustomizerOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
              title="تغییر مکان، اندازه و ویرایش متن کارت‌های خدمات توسط ادمین"
            >
              <Sliders className="w-4 h-4 text-amber-600" />
              <span>چیدمان و اندازه کارت‌ها (مدیریت)</span>
            </button>
          )}

          <div className="hidden lg:flex items-center gap-1.5 text-xs text-emerald-800 font-semibold px-2 py-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>هاور روی هر کارت = مشاهده زیرخدمات</span>
          </div>
        </div>
      </div>

      {/* شبکه بنتو گرید با چیدمان و اندازه‌های شخصی‌سازی‌شده */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {sortedCards.map(card => {
          const Icon = ICON_MAP[card.id] || Sparkles;
          const sizeClass = SIZE_CLASS_MAP[card.size] || 'col-span-1 row-span-1';
          const accentColor = card.accentColor || '#10B981';

          // اگر کارت کارتابل بود آمار پویای پرونده‌های فعال را نمایش دهد
          const badgeText = card.id === 'People' && pendingCartable > 0
            ? `${toPersianNumbers(pendingCartable)} پرونده در جریان`
            : card.badge;

          return (
            <motion.div
              key={card.id}
              onMouseEnter={() => setHoveredTile(card.id)}
              onMouseLeave={() => setHoveredTile(null)}
              onClick={() => onNavigateTab(card.id)}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className={`relative group cursor-pointer rounded-3xl bg-white/95 border border-stone-200/90 p-5 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between overflow-hidden ${sizeClass} hover:border-emerald-300 hover:bg-emerald-50/20`}
            >
              {/* هاله نور تعاملی پشت کارت */}
              <div
                className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: `radial-gradient(350px circle at 50% 25%, ${accentColor}18, transparent 70%)`
                }}
              />

              {/* خط باریک برندینگ رنگی بالای کارت */}
              <div
                className="absolute top-0 right-0 left-0 h-1 transition-all group-hover:h-1.5"
                style={{ backgroundColor: accentColor }}
              />

              <div className="relative z-10 space-y-3">
                {/* ردیف آیکون و برچسب وضعیت */}
                <div className="flex items-center justify-between">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-2xs transition-transform group-hover:scale-105"
                    style={{
                      backgroundColor: `${accentColor}15`,
                      color: accentColor,
                      border: `1px solid ${accentColor}30`
                    }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <span
                    className="text-[11px] font-bold px-2.5 py-1 rounded-full border backdrop-blur-md"
                    style={{
                      backgroundColor: `${accentColor}10`,
                      color: accentColor,
                      borderColor: `${accentColor}30`
                    }}
                  >
                    {badgeText}
                  </span>
                </div>

                {/* عنوان و توضیحات ویرایش‌شده */}
                <div>
                  <h3 className="text-sm sm:text-base font-black text-stone-900 group-hover:text-emerald-900 transition-colors leading-snug">
                    {card.title}
                  </h3>
                  <p className="text-xs text-stone-500 mt-1 line-clamp-2 leading-relaxed">
                    {card.subtext}
                  </p>
                </div>

                {/* فهرست زیرخدمات ویرایش‌شده */}
                {card.subServices && card.subServices.length > 0 && (
                  <div className="pt-2 border-t border-stone-200/70 space-y-1.5">
                    <div className="text-[10px] font-black text-stone-500 uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                      <span>زیرخدمات و امکانات:</span>
                    </div>
                    <div className="grid grid-cols-1 gap-1 text-[11px] text-stone-700">
                      {card.subServices.map((sub, sIdx) => (
                        <div
                          key={sIdx}
                          className="flex items-center gap-1.5 py-0.5 group-hover:text-stone-900 transition-colors"
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: accentColor }}
                          />
                          <span className="truncate">{sub}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* فوتر اقدام کارت */}
              <div className="relative z-10 pt-4 mt-3 border-t border-stone-200/70 flex items-center justify-between text-xs font-bold">
                <span
                  className="flex items-center gap-1 group-hover:underline"
                  style={{ color: accentColor }}
                >
                  <span>ورود به سامانه</span>
                  <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
                </span>

                <span className="text-[10px] font-mono text-stone-400 flex items-center gap-1">
                  <span>طرح میزان</span>
                  <Sparkles className="w-3 h-3 text-amber-500" />
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* مودال مدیریت و چیدمان کارت‌ها برای ادمین */}
      <CrextioBentoCustomizerModal
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
      />
    </div>
  );
};
