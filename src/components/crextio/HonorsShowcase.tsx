import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { HonorAppointmentItem } from '../../types';
import { resolveHonorImageUrl } from '../../data/showcaseImages';
import { toPersianNumbers } from '../../utils/persianNumbers';
import {
  Award,
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  Edit3,
  Pause,
  Play,
  Sparkles,
} from 'lucide-react';

interface HonorsShowcaseProps {
  span?: 'full' | 'half';
  scale?: 'micro' | 'compact' | 'normal' | 'expanded';
  darkSurface?: boolean;
  isAdmin?: boolean;
  onNavigateTab?: (tab: string) => void;
  onOpenEditor?: () => void;
}

const FALLBACK_HONORS: HonorAppointmentItem[] = [
  {
    id: 'honor_fallback_1',
    category: 'انتصاب قضایی',
    title: 'تبریک انتصاب جناب آقای دکتر محمدمهدی حسینی به سمت دادستان محترم عمومی و انقلاب مرکز استان',
    honoreeName: 'جناب آقای دکتر محمدمهدی حسینی',
    positionOrAchievement: 'دادستان عمومی و انقلاب مرکز استان (دانش‌آموخته دوره نهم فقه و قضا)',
    description:
      'مجمع دانش‌آموختگان فقه و قضا ضمن تبریک صمیمانه، توفیق روزافزون ایشان را در احقاق حق و گسترش عدالت مسئلت می‌نماید.',
    dateOrLocation: 'آبان ۱۴۰۴ · قوه قضائیه',
    imageUrl: 'builtin:judicial_appointment',
    textPosition: 'bottom_right',
    scrimStrength: 'medium',
    ctaLabel: 'تبریک و مشاهده بانک نخبگان',
    ctaAction: 'navigate_alumni',
  },
  {
    id: 'honor_fallback_2',
    category: 'رتبه برتر علمی',
    title: 'کسب رتبه نخست کشوری در همایش سالانه نقد آراء قضایی و اجتهاد کاربردی',
    honoreeName: 'پژوهشکده و کارگروه حقوق جزای مجمع',
    positionOrAchievement: 'برگزیده نخست بخش مقالات و تحلیل دادنامه‌های دیوان عالی کشور',
    description:
      'با اهتمام پژوهشگران و قضات عضو مجمع، مجموعه نقدهای تحلیلی کارگروه حائز امتیاز برتر هیئت داوران کشوری گردید.',
    dateOrLocation: 'مهر ۱۴۰۴ · تهران و قم',
    imageUrl: 'builtin:academic_award',
    textPosition: 'bottom_right',
    scrimStrength: 'medium',
    ctaLabel: 'ورود به تالار آراء',
    ctaAction: 'navigate_rulings',
  },
];

export const HonorsShowcase: React.FC<HonorsShowcaseProps> = ({
  span = 'full',
  scale = 'normal',
  darkSurface = false,
  isAdmin = false,
  onNavigateTab,
  onOpenEditor,
}) => {
  const { crextioConfig } = useApp();

  const items =
    crextioConfig.honorsItems && crextioConfig.honorsItems.length > 0
      ? crextioConfig.honorsItems
      : FALLBACK_HONORS;

  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [imgErrorMap, setImgErrorMap] = useState<Record<string, boolean>>({});

  const safeIdx = currentIdx >= items.length ? 0 : currentIdx;
  const activeItem = items[safeIdx] || items[0];
  const autoplayMs = Math.max(3, Number(crextioConfig.honorsAutoplaySeconds) || 7) * 1000;

  useEffect(() => {
    if (items.length <= 1 || isPaused) return;
    const timer = setInterval(() => {
      setCurrentIdx(prev => (prev + 1) % items.length);
    }, autoplayMs);
    return () => clearInterval(timer);
  }, [items.length, isPaused, autoplayMs]);

  const handleCta = (item: HonorAppointmentItem) => {
    if (!item.ctaAction || item.ctaAction === 'none') return;
    if (item.ctaAction === 'navigate_alumni') onNavigateTab?.('Alumni');
    else if (item.ctaAction === 'navigate_rulings') onNavigateTab?.('Rulings');
    else if (item.ctaAction === 'navigate_research') onNavigateTab?.('Research');
    else if (item.ctaAction === 'external_link' && item.ctaUrl) {
      window.open(item.ctaUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const stageHeightClass =
    scale === 'micro'
      ? span === 'half'
        ? 'min-h-[190px] sm:min-h-[210px]'
        : 'min-h-[210px] sm:min-h-[230px]'
      : scale === 'compact'
      ? span === 'half'
        ? 'min-h-[230px] sm:min-h-[290px]'
        : 'min-h-[240px] sm:min-h-[310px]'
      : scale === 'expanded'
      ? span === 'half'
        ? 'min-h-[280px] sm:min-h-[420px]'
        : 'min-h-[300px] sm:min-h-[460px]'
      : span === 'half'
      ? 'min-h-[250px] sm:min-h-[350px]'
      : 'min-h-[260px] sm:min-h-[390px]';

  const scrimClass =
    activeItem.scrimStrength === 'soft'
      ? 'bg-gradient-to-t from-black/75 via-black/30 to-black/10'
      : activeItem.scrimStrength === 'strong'
      ? 'bg-gradient-to-t from-black/95 via-black/65 to-black/25'
      : 'bg-gradient-to-t from-black/88 via-black/45 to-black/15';

  const resolvedImgSrc = resolveHonorImageUrl(activeItem.imageUrl, safeIdx);
  const hasImgFailed = imgErrorMap[activeItem.id];

  return (
    <section
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`rounded-2xl sm:rounded-3xl border overflow-hidden transition-colors ${
        darkSurface
          ? 'bg-[#111F1A] border-[#243B32] text-stone-100'
          : 'bg-white border-stone-200/90 text-stone-900 shadow-sm'
      }`}
      dir="rtl"
    >
      {/* Clean Header Bar */}
      <div
        className={`px-3.5 sm:px-5 py-3 sm:py-3.5 border-b flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 ${
          darkSurface ? 'border-white/10 bg-[#14251F]' : 'border-stone-100 bg-stone-50/70'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              darkSurface
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-amber-100 text-amber-800 border border-amber-200'
            }`}
          >
            <Award className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h2
              className={`text-sm sm:text-base font-black truncate ${
                darkSurface ? 'text-white' : 'text-stone-900'
              }`}
            >
              {crextioConfig.honorsShowcaseTitle || 'تالار افتخارات، انتصابات و دستاوردهای نخبگان'}
            </h2>
            {span === 'full' && (
              <p
                className={`text-[11px] truncate ${
                  darkSurface ? 'text-stone-400' : 'text-stone-500'
                }`}
              >
                {crextioConfig.honorsShowcaseSubtitle ||
                  'تبریک انتصابات قضایی، رتبه‌های برتر علمی و مفاخر مجمع'}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {items.length > 1 && (
            <div className="flex items-center gap-1.5">
              <span
                className={`text-[11px] font-mono tabular-nums font-bold px-2 ${
                  darkSurface ? 'text-stone-300' : 'text-stone-600'
                }`}
              >
                {toPersianNumbers(safeIdx + 1)} / {toPersianNumbers(items.length)}
              </span>

              <button
                type="button"
                onClick={() => setIsPaused(p => !p)}
                title={isPaused ? 'ادامه پخش خودکار' : 'توقف اسلایدر'}
                className={`w-9 h-9 sm:w-8 sm:h-8 rounded-xl sm:rounded-lg border flex items-center justify-center cursor-pointer transition-colors ${
                  darkSurface
                    ? 'border-white/15 text-stone-300 hover:bg-white/10'
                    : 'border-stone-200 text-stone-600 hover:bg-stone-100'
                }`}
              >
                {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={() => setCurrentIdx((safeIdx - 1 + items.length) % items.length)}
                title="صفحه قبلی"
                className={`w-9 h-9 sm:w-8 sm:h-8 rounded-xl sm:rounded-lg border flex items-center justify-center cursor-pointer transition-colors ${
                  darkSurface
                    ? 'border-white/15 text-stone-200 hover:bg-white/10'
                    : 'border-stone-200 text-stone-700 hover:bg-stone-100'
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setCurrentIdx((safeIdx + 1) % items.length)}
                title="صفحه بعدی"
                className={`w-9 h-9 sm:w-8 sm:h-8 rounded-xl sm:rounded-lg border flex items-center justify-center cursor-pointer transition-colors ${
                  darkSurface
                    ? 'border-white/15 text-stone-200 hover:bg-white/10'
                    : 'border-stone-200 text-stone-700 hover:bg-stone-100'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          )}

          {isAdmin && onOpenEditor && (
            <button
              type="button"
              onClick={onOpenEditor}
              className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-[11px] font-black flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Edit3 className="w-3 h-3" />
              <span>ویرایش صفحات</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Photographic Stage with Crossfade & Ken Burns Motion */}
      <div className={`relative w-full ${stageHeightClass} overflow-hidden bg-stone-950`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeItem.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0"
          >
            {!hasImgFailed ? (
              <motion.img
                src={resolvedImgSrc}
                alt={activeItem.title}
                referrerPolicy="no-referrer"
                onError={() => setImgErrorMap(prev => ({ ...prev, [activeItem.id]: true }))}
                initial={{ scale: 1.06 }}
                animate={{ scale: 1 }}
                transition={{ duration: 7, ease: 'easeOut' }}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-emerald-950 via-stone-900 to-amber-950 flex items-center justify-center">
                <Award className="w-20 h-20 text-amber-400/20" />
              </div>
            )}

            {/* Measured Contrast Scrim */}
            <div className={`absolute inset-0 ${scrimClass}`} />

            {/* Overlay Text Content */}
            <div
              className={`absolute inset-0 p-4 pb-8 sm:p-8 flex flex-col text-white ${
                activeItem.textPosition === 'center'
                  ? 'items-center justify-center text-center'
                  : 'items-start justify-end text-right'
              }`}
            >
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className={`${
                  activeItem.textPosition === 'bottom_bar'
                    ? 'w-full rounded-2xl bg-black/55 backdrop-blur-md border border-white/15 p-4 sm:p-5'
                    : activeItem.textPosition === 'center'
                    ? 'max-w-2xl space-y-3'
                    : 'max-w-3xl space-y-2.5'
                }`}
              >
                {/* Zero-Pill Typographic Metadata Line */}
                <div
                  className={`flex flex-wrap items-center gap-2 text-xs font-bold text-amber-300 ${
                    activeItem.textPosition === 'center' ? 'justify-center' : ''
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{activeItem.category || 'افتخار و انتصاب'}</span>
                  {activeItem.dateOrLocation && (
                    <>
                      <span aria-hidden="true" className="text-white/40">
                        ·
                      </span>
                      <span className="text-stone-200 font-medium">{activeItem.dateOrLocation}</span>
                    </>
                  )}
                </div>

                <h3
                  className={`font-black leading-snug text-white ${
                    span === 'half' ? 'text-base sm:text-xl' : 'text-lg sm:text-2xl lg:text-[26px]'
                  }`}
                  style={{ textWrap: 'balance' }}
                >
                  {activeItem.title}
                </h3>

                <div
                  className={`text-xs sm:text-sm font-bold text-emerald-300 ${
                    activeItem.textPosition === 'center' ? 'mx-auto' : ''
                  }`}
                >
                  {activeItem.honoreeName}
                  {activeItem.positionOrAchievement && (
                    <span className="text-stone-200 font-medium">
                      {' '}
                      — {activeItem.positionOrAchievement}
                    </span>
                  )}
                </div>

                {activeItem.description && (
                  <p
                    className={`text-xs sm:text-[13px] text-stone-200/90 leading-relaxed line-clamp-2 ${
                      activeItem.textPosition === 'center' ? 'max-w-xl mx-auto' : 'max-w-2xl'
                    }`}
                  >
                    {activeItem.description}
                  </p>
                )}

                {activeItem.ctaLabel && activeItem.ctaAction && activeItem.ctaAction !== 'none' && (
                  <div className="pt-1.5">
                    <button
                      type="button"
                      onClick={() => handleCta(activeItem)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-black transition-all cursor-pointer active:scale-95"
                    >
                      <span>{activeItem.ctaLabel}</span>
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Bottom Progress Navigation Strip */}
        {items.length > 1 && (
          <div className="absolute bottom-3 left-5 right-5 z-20 flex items-center gap-1.5 pointer-events-auto">
            {items.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setCurrentIdx(idx)}
                title={item.honoreeName || item.title}
                className="flex-1 h-1.5 rounded-full overflow-hidden bg-white/25 hover:bg-white/40 transition-colors cursor-pointer"
              >
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    idx === safeIdx ? 'bg-amber-400 w-full' : idx < safeIdx ? 'bg-white/70 w-full' : 'w-0'
                  }`}
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
