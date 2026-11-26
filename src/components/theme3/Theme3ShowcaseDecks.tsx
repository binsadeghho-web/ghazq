import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { toPersianNumbers } from '../../utils/persianNumbers';
import { handleImageErrorFallback } from '../../data/showcaseImages';

export interface Theme3VisualSlide {
  id: string;
  kicker: string;
  title: string;
  subtitle: string;
  metaText: string;
  ctaLabel: string;
  imageUrl?: string;
  accentGradient: string;
  icon: any;
  onPress: () => void;
}

interface Theme3ShowcaseDeckProps {
  title: string;
  headerIcon?: any;
  slides: Theme3VisualSlide[];
  fallbackImageUrl: string;
  cardsPerPageDesktop?: number;
  goldBorderAccent?: boolean;
}

export const Theme3ShowcaseDeck: React.FC<Theme3ShowcaseDeckProps> = ({
  title,
  headerIcon: HeaderIcon = Sparkles,
  slides,
  fallbackImageUrl,
  cardsPerPageDesktop = 3,
  goldBorderAccent = false,
}) => {
  const [pageIdx, setPageIdx] = useState(0);
  const [slideImgFailed, setSlideImgFailed] = useState<Record<string, boolean>>({});

  if (slides.length === 0) return null;

  const totalPages = Math.max(1, Math.ceil(slides.length / cardsPerPageDesktop));
  const safePageIdx = Math.min(pageIdx, totalPages - 1);
  const startIdx = safePageIdx * cardsPerPageDesktop;
  const visibleSlides = slides.slice(startIdx, startIdx + cardsPerPageDesktop);

  return (
    <section aria-label={title} className="space-y-3.5">
      <div className="flex items-center justify-between gap-3 px-0.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#071E17] to-[#113D30] text-[#F3D078] flex items-center justify-center shrink-0 border border-[#F3D078]/35 shadow-xs">
            <HeaderIcon className="w-4 h-4" />
          </span>
          <h2 className="text-[15px] font-black text-stone-900 truncate">{title}</h2>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-bold text-stone-500 tabular-nums">
            {toPersianNumbers(startIdx + 1)} تا{' '}
            {toPersianNumbers(Math.min(startIdx + cardsPerPageDesktop, slides.length))} از{' '}
            {toPersianNumbers(slides.length)}
          </span>

          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPageIdx(p => (p - 1 + totalPages) % totalPages)}
                className="w-8 h-8 rounded-xl bg-white hover:bg-[#F5F2E8] border border-[#DFD8C4] text-[#071E17] flex items-center justify-center transition-colors cursor-pointer"
                aria-label="صفحه قبلی"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setPageIdx(p => (p + 1) % totalPages)}
                className="w-8 h-8 rounded-xl bg-white hover:bg-[#F5F2E8] border border-[#DFD8C4] text-[#071E17] flex items-center justify-center transition-colors cursor-pointer"
                aria-label="صفحه بعدی"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div
        className={`grid grid-cols-1 md:grid-cols-2 ${
          cardsPerPageDesktop >= 4 ? 'lg:grid-cols-3 xl:grid-cols-4' : 'lg:grid-cols-3'
        } gap-4`}
      >
        {visibleSlides.map((slide, sIdx) => {
          const SlideIcon = slide.icon;
          const imgFailed = Boolean(slideImgFailed[slide.id]);
          return (
            <motion.button
              key={slide.id}
              type="button"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(sIdx * 0.04, 0.2), duration: 0.25 }}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.985 }}
              onClick={slide.onPress}
              className={`h-[228px] relative rounded-[26px] overflow-hidden text-right border ${
                goldBorderAccent ? 'border-[#F3D078]/35' : 'border-[#F3D078]/22'
              } shadow-[0_18px_40px_-22px_rgba(7,30,23,0.55)] transition-shadow hover:shadow-[0_24px_48px_-20px_rgba(7,30,23,0.65)] cursor-pointer group bg-gradient-to-br ${slide.accentGradient}`}
            >
              {slide.imageUrl && !imgFailed ? (
                <img
                  src={slide.imageUrl}
                  alt={slide.title}
                  referrerPolicy="no-referrer"
                  loading={sIdx === 0 ? 'eager' : 'lazy'}
                  onError={e => {
                    if (
                      fallbackImageUrl &&
                      e.currentTarget.src !== fallbackImageUrl &&
                      e.currentTarget.dataset.fallbackApplied !== '1'
                    ) {
                      handleImageErrorFallback(e, fallbackImageUrl);
                    } else {
                      setSlideImgFailed(prev => ({ ...prev, [slide.id]: true }));
                    }
                  }}
                  className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 luxury-lattice-bg opacity-55 flex items-center justify-center">
                  <SlideIcon className="w-20 h-20 text-[#F3D078]/20" />
                </div>
              )}

              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-[#04120D] via-[#04120D]/70 to-black/20"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-l from-transparent via-[#F3D078]/75 to-transparent"
              />

              <div className="relative z-10 h-full p-5 flex flex-col justify-between text-white">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-black text-[#F3D078] truncate flex items-center gap-1.5">
                    <SlideIcon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{slide.kicker}</span>
                  </span>
                  <span className="w-8 h-8 rounded-full bg-white/15 group-hover:bg-[#F3D078] group-hover:text-[#071E17] border border-white/20 flex items-center justify-center shrink-0 text-[#F3D078] transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-[15px] font-black leading-snug line-clamp-2 text-white">
                    {slide.title}
                  </h3>
                  <p className="text-[11px] text-stone-200/90 line-clamp-1 font-medium">
                    {slide.subtitle}
                  </p>
                  <div className="pt-2 border-t border-white/15 flex items-center justify-between gap-2 text-[11px]">
                    <span className="text-emerald-200/90 font-semibold truncate">{slide.metaText}</span>
                    <span className="font-black text-[#F3D078] shrink-0 whitespace-nowrap">
                      {slide.ctaLabel} ←
                    </span>
                  </div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
};
