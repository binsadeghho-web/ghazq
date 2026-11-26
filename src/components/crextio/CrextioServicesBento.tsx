import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { toPersianNumbers } from '../../utils/persianNumbers';
import { CrextioBentoCardConfig, WelfareModuleKey } from '../../types';
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
  onNavigateDeep?: (tab: string, subTab?: string) => void;
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

export const CrextioServicesBento: React.FC<CrextioServicesBentoProps> = ({
  onNavigateTab,
  onNavigateDeep,
}) => {
  const { crextioConfig, currentUser, cartableRequests, welfarePortalConfig, isAlumniPreview } = useApp();
  const [hoveredTile, setHoveredTile] = useState<string | null>(null);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);

  const isAdmin =
    (currentUser?.role === 'admin' ||
      currentUser?.role === 'super_admin' ||
      currentUser?.role === 'alumni_manager' ||
      currentUser?.role === 'supervisor') &&
    !isAlumniPreview;
  const pendingCartable = cartableRequests.filter(r => r.status === 'pending' || r.status === 'in_progress').length;

  const rawCards: CrextioBentoCardConfig[] = crextioConfig.bentoCardsConfig || DEFAULT_BENTO_CARDS;

  // فیلتر و مرتب‌سازی کارت‌ها طبق چیدمان تعیین‌شده توسط ادمین (با رعایت اصلاحیه ۵۷ برای دانش‌آموختگان)
  const sortedCards = [...rawCards]
    .filter(c => {
      if (c.isVisible === false) return false;
      if (!isAdmin && (c.id === 'Alumni' || c.id === 'Users' || c.id === 'Admin' || c.id === 'Setting' || c.id === 'Finance')) {
        return false;
      }
      return true;
    })
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <div className="space-y-4">
      {/* هدر بخش همراه با نشان رسمی میزان و دکمه مدیریت چیدمان کارت‌ها */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FCFCF9] border border-[#DFD8C4] p-4 sm:px-6 rounded-2xl sm:rounded-[26px] shadow-[0_8px_24px_-18px_rgba(7,30,23,0.12)]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#071E17] text-[#F3D078] flex items-center justify-center shrink-0 border border-[#F3D078]/35">
            <Scale className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm sm:text-base font-black text-[#071E17]">
                {crextioConfig.bentoSectionTitle || 'فهرست و درگاه‌های خدمات سامانه (طرح میزان)'}
              </span>
              <span aria-hidden="true" className="text-stone-300 text-xs">·</span>
              <span className="text-xs font-extrabold text-[#0C4A38] tabular-nums">
                {toPersianNumbers(sortedCards.length)} درگاه فعال
              </span>
            </div>
            <p className="text-xs text-[#525E58] mt-0.5 truncate">
              {crextioConfig.bentoSectionSubtitle || 'دسترسی مستقیم به کارتابل، دوره‌های آموزشی، مشاوره، تالار آراء، پژوهش و رفاهیات'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
          {/* دکمه اختصاصی ادمین برای مدیریت جایگاه، اندازه و متن کارت‌ها */}
          {isAdmin && (
            <button
              onClick={() => setIsCustomizerOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#071E17] hover:bg-[#0D3227] text-[#F3D078] border border-[#F3D078]/35 text-xs font-black transition-colors active:scale-95 cursor-pointer whitespace-nowrap"
              title="تغییر مکان، اندازه و ویرایش متن کارت‌های خدمات توسط ادمین"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>چیدمان و اندازه کارت‌ها</span>
            </button>
          )}
        </div>
      </div>

      {/* شبکه بنتو گرید با چیدمان و اندازه‌های شخصی‌سازی‌شده */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {sortedCards.map(card => {
          const Icon = ICON_MAP[card.id] || Sparkles;
          const sizeClass = SIZE_CLASS_MAP[card.size] || 'col-span-1 row-span-1';

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
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.985 }}
              className={`relative group cursor-pointer rounded-2xl sm:rounded-[24px] bg-[#FCFCF9] border border-[#E2DAC3] hover:border-[#071E17]/40 p-4 sm:p-5 shadow-[0_6px_18px_-14px_rgba(7,30,23,0.12)] hover:shadow-[0_14px_30px_-18px_rgba(7,30,23,0.2)] transition-all duration-200 flex flex-col justify-between overflow-hidden ${sizeClass} hover:bg-white`}
            >
              {/* Subtle top champagne-gold hairline revealed on hover */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-l from-transparent via-[#F3D078]/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              />

              <div className="relative z-10 space-y-3">
                {/* ردیف آیکون و متادیتای بدون pill */}
                <div className="flex items-center justify-between gap-2">
                  <div className="w-10 h-10 rounded-xl bg-[#F4F0E4] group-hover:bg-[#071E17] text-[#071E17] group-hover:text-[#F3D078] border border-[#DFD8C4] group-hover:border-[#071E17] flex items-center justify-center transition-colors duration-200 shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>

                  <span className="hidden sm:inline-block text-[11px] font-extrabold text-[#6E5A28] truncate max-w-[140px]">
                    {badgeText}
                  </span>
                </div>

                {/* عنوان و توضیحات */}
                <div>
                  <h3 className="text-[13px] sm:text-[15px] font-black text-[#071E17] leading-snug line-clamp-1 sm:line-clamp-none">
                    {card.title}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-[#525E58] mt-1 line-clamp-1 sm:line-clamp-2 leading-relaxed">
                    {card.subtext}
                  </p>
                </div>

                {/* فهرست زیرخدمات (با لینک مستقیم ۵ بخش برای کارت رفاهیات) */}
                {card.id === 'Welfare' ? (
                  <div className="pt-2.5 border-t border-[#ECE6D6] space-y-1.5">
                    <div className="text-[10px] font-black text-[#6E5A28] flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-[#0C4A38]" />
                      <span>بخش‌های ۶گانه رفاهیات:</span>
                    </div>
                    <div className="grid grid-cols-1 gap-1 text-[11px]">
                      {(
                        [
                          'emergency_loan',
                          'qarzolhasaneh_fund',
                          'accommodation',
                          'consumables',
                          'installment_sales',
                          'recreation_tourism',
                        ] as WelfareModuleKey[]
                      )
                        .filter(mk => welfarePortalConfig?.modulesConfig?.[mk]?.enabled !== false)
                        .map(mk => {
                          const title = welfarePortalConfig?.modulesConfig?.[mk]?.title || mk;
                          return (
                            <button
                              key={mk}
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                if (onNavigateDeep) {
                                  onNavigateDeep('Welfare', mk);
                                } else {
                                  onNavigateTab('Welfare');
                                }
                              }}
                              className="w-full text-right flex items-center justify-between gap-1.5 py-1 px-2 rounded-lg hover:bg-[#F2F7F4] text-[#071E17] font-bold transition-colors cursor-pointer"
                            >
                              <span className="flex items-center gap-1.5 min-w-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#0C4A38] shrink-0" />
                                <span className="truncate">{title}</span>
                              </span>
                              <ArrowLeft className="w-3 h-3 text-[#0C4A38] shrink-0 opacity-70" />
                            </button>
                          );
                        })}
                    </div>
                  </div>
                ) : (
                  card.subServices &&
                  card.subServices.length > 0 && (
                    <div className="hidden md:block pt-2.5 border-t border-[#ECE6D6] space-y-1.5">
                      <div className="text-[10px] font-black text-[#6E5A28] flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-[#0C4A38]" />
                        <span>زیرخدمات و امکانات:</span>
                      </div>
                      <div className="grid grid-cols-1 gap-1 text-[11px] text-[#3E4B45]">
                        {card.subServices.map((sub, sIdx) => (
                          <div
                            key={sIdx}
                            className="flex items-center gap-1.5 py-0.5 group-hover:text-[#071E17] transition-colors"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-[#B88928] shrink-0" />
                            <span className="truncate">{sub}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>

              {/* فوتر اقدام کارت */}
              <div className="relative z-10 pt-3 mt-3.5 border-t border-[#ECE6D6] flex items-center justify-between text-[11px] sm:text-xs font-extrabold">
                <span className="flex items-center gap-1.5 text-[#071E17] group-hover:text-[#0C4A38]">
                  <span>{crextioConfig.bentoCardCtaText || 'ورود به بخش'}</span>
                  <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
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
