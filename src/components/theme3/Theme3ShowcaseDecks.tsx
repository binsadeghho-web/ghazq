import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  autoMotion?: boolean;
  motionSpeedPxPerSec?: number;
}

export const Theme3ShowcaseDeck: React.FC<Theme3ShowcaseDeckProps> = ({
  title,
  headerIcon: HeaderIcon = Sparkles,
  slides,
  fallbackImageUrl,
  cardsPerPageDesktop = 3,
  goldBorderAccent = false,
  autoMotion = true,
  motionSpeedPxPerSec = 26,
}) => {
  const [slideImgFailed, setSlideImgFailed] = useState<Record<string, boolean>>({});
  const [isPaused, setIsPaused] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);

  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const isPausedRef = useRef(false);
  const stepAnimRef = useRef<{
    startOffset: number;
    delta: number;
    startTime: number;
    duration: number;
  } | null>(null);

  isPausedRef.current = isPaused;

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const updateWidth = () => {
      const w = el.clientWidth;
      if (w > 0) setContainerWidth(w);
    };
    updateWidth();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => updateWidth());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const visibleCount =
    containerWidth > 0 && containerWidth < 768
      ? 1
      : containerWidth > 0 && containerWidth < 1024
      ? 2
      : Math.max(1, cardsPerPageDesktop);

  const gap = 16;
  const cardWidth =
    containerWidth > 0
      ? Math.max(220, (containerWidth - gap * (visibleCount - 1)) / visibleCount)
      : 320;
  const slotWidth = cardWidth + gap;
  const isTrackMode = slides.length >= 2;
  const copies = isTrackMode ? Math.max(2, Math.ceil((visibleCount + 2) / slides.length) + 1) : 1;
  const cycleWidth = isTrackMode ? slides.length * slotWidth : 0;

  const applyTransform = useCallback(() => {
    if (!trackRef.current || cycleWidth <= 0) return;
    const normalized = ((offsetRef.current % cycleWidth) + cycleWidth) % cycleWidth;
    offsetRef.current = normalized;
    trackRef.current.style.transform = `translate3d(${-normalized}px, 0, 0)`;
  }, [cycleWidth]);

  useEffect(() => {
    if (!isTrackMode || cycleWidth <= 0) return;
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let rafId = 0;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(50, Math.max(0, now - lastTime));
      lastTime = now;

      if (stepAnimRef.current) {
        const anim = stepAnimRef.current;
        const t = Math.min(1, (now - anim.startTime) / anim.duration);
        const eased = 1 - Math.pow(1 - t, 3);
        offsetRef.current = anim.startOffset + anim.delta * eased;
        applyTransform();
        if (t >= 1) {
          stepAnimRef.current = null;
        }
      } else if (autoMotion && !prefersReducedMotion && !isPausedRef.current) {
        offsetRef.current += (motionSpeedPxPerSec * dt) / 1000;
        applyTransform();
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isTrackMode, cycleWidth, autoMotion, motionSpeedPxPerSec, applyTransform]);

  if (slides.length === 0) return null;

  const handleStep = (direction: -1 | 1) => {
    if (!isTrackMode || cycleWidth <= 0) return;
    stepAnimRef.current = {
      startOffset: offsetRef.current,
      delta: direction * slotWidth,
      startTime: performance.now(),
      duration: 320,
    };
  };

  const renderCard = (slide: Theme3VisualSlide, sIdx: number, copyIdx: number) => {
    const SlideIcon = slide.icon;
    const imgFailed = Boolean(slideImgFailed[slide.id]);
    return (
      <motion.button
        key={`${slide.id}_copy_${copyIdx}`}
        type="button"
        dir="rtl"
        whileHover={{ y: -4 }}
        whileTap={{ scale: 0.985 }}
        onClick={slide.onPress}
        style={isTrackMode ? { width: `${cardWidth}px`, marginRight: `${gap}px` } : undefined}
        className={`${
          isTrackMode ? 'shrink-0' : 'w-full'
        } h-[228px] relative rounded-[26px] overflow-hidden text-right border ${
          goldBorderAccent ? 'border-[#F3D078]/35' : 'border-[#F3D078]/22'
        } shadow-[0_18px_40px_-22px_rgba(7,30,23,0.55)] transition-shadow hover:shadow-[0_24px_48px_-20px_rgba(7,30,23,0.65)] cursor-pointer group bg-gradient-to-br ${slide.accentGradient}`}
      >
        {slide.imageUrl && !imgFailed ? (
          <img
            src={slide.imageUrl}
            alt={slide.title}
            referrerPolicy="no-referrer"
            loading={sIdx === 0 && copyIdx === 0 ? 'eager' : 'lazy'}
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
  };

  return (
    <section
      aria-label={title}
      className="space-y-3.5"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      <div className="flex items-center justify-between gap-3 px-0.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#071E17] to-[#113D30] text-[#F3D078] flex items-center justify-center shrink-0 border border-[#F3D078]/35 shadow-xs">
            <HeaderIcon className="w-4 h-4" />
          </span>
          <h2 className="text-[15px] font-black text-stone-900 truncate">{title}</h2>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-bold text-stone-500 tabular-nums">
            {toPersianNumbers(slides.length)} کارت فعال
          </span>

          {isTrackMode && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleStep(-1)}
                className="w-9 h-9 rounded-xl bg-white hover:bg-[#F5F2E8] border border-[#DFD8C4] text-[#071E17] flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                aria-label="اسلاید قبلی"
              >
                <ChevronRight className="w-[18px] h-[18px]" />
              </button>
              <button
                type="button"
                onClick={() => handleStep(1)}
                className="w-9 h-9 rounded-xl bg-white hover:bg-[#F5F2E8] border border-[#DFD8C4] text-[#071E17] flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                aria-label="اسلاید بعدی"
              >
                <ChevronLeft className="w-[18px] h-[18px]" />
              </button>
            </div>
          )}
        </div>
      </div>

      {isTrackMode ? (
        <div ref={viewportRef} dir="ltr" className="overflow-hidden py-1 -my-1">
          <div ref={trackRef} className="flex w-max will-change-transform">
            {Array.from({ length: copies }).map((_, copyIdx) =>
              slides.map((slide, sIdx) => renderCard(slide, sIdx, copyIdx))
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {slides.map((slide, sIdx) => renderCard(slide, sIdx, 0))}
        </div>
      )}
    </section>
  );
};
