import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toPersianNumbers } from '../../utils/persianNumbers';

interface AnimatedCounterProps {
  value: string; // e.g. "۱,۴۸۵", "۲۴۸", "۸۶۵", "۱,۱۹۰"
  duration?: number;
  className?: string;
  replayOnScroll?: boolean;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 2600,
  className = '',
  replayOnScroll = true
}) => {
  const [displayValue, setDisplayValue] = useState<string>('۰');
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const containerRef = useRef<HTMLSpanElement>(null);
  const hasBeenVisibleRef = useRef<boolean>(false);

  useEffect(() => {
    const isPercent = value.includes('٪') || value.includes('%');

    // تبدیل ارقام فارسی به انگلیسی جهت استخراج مقدار عددی
    const englishDigits = value
      .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
      .replace(/[,،]/g, '')
      .replace(/[٪%]/g, '')
      .trim();

    const targetNumber = parseFloat(englishDigits);
    if (isNaN(targetNumber)) {
      setDisplayValue(value);
      return;
    }

    const hasDecimal = englishDigits.includes('.');
    const decimalPlaces = hasDecimal ? englishDigits.split('.')[1].length : 0;

    let animationFrameId: number;
    let startTimestamp: number | null = null;

    const startCounting = () => {
      startTimestamp = null;
      setIsAnimating(true);

      const step = (timestamp: number) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);

        // منحنی نرم و تدریجی کاهش شتاب (easeOutCubic / easeOutExpo)
        const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -8 * progress);
        const currentNumber = easeProgress * targetNumber;

        let formattedNumber: string;
        if (hasDecimal) {
          formattedNumber = currentNumber.toFixed(decimalPlaces);
        } else {
          formattedNumber = Math.round(currentNumber).toLocaleString('en-US');
        }

        let persianResult = toPersianNumbers(formattedNumber);
        if (isPercent) {
          persianResult += '٪';
        }

        setDisplayValue(persianResult);

        if (progress < 1) {
          animationFrameId = requestAnimationFrame(step);
        } else {
          setDisplayValue(value);
          setIsAnimating(false);
        }
      };

      animationFrameId = requestAnimationFrame(step);
    };

    if (!replayOnScroll || typeof IntersectionObserver === 'undefined') {
      startCounting();
      return () => cancelAnimationFrame(animationFrameId);
    }

    // مشاهده‌گر اسکرول: هر بار از دید خارج شد و دوباره وارد دید شد، شمارش از اول آغاز شود
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            startCounting();
            hasBeenVisibleRef.current = true;
          } else {
            // وقتی از کادر خارج شد، مجدداً ریست به صفر جهت آماده‌سازی انیمیشن بعدی
            if (hasBeenVisibleRef.current) {
              setDisplayValue('۰');
            }
          }
        });
      },
      {
        threshold: 0.25,
        rootMargin: '0px'
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
      cancelAnimationFrame(animationFrameId);
    };
  }, [value, duration, replayOnScroll]);

  return (
    <span ref={containerRef} className={`inline-flex items-center justify-center transition-transform ${className}`}>
      <motion.span
        key={displayValue}
        initial={{ opacity: 0.85, scale: isAnimating ? 0.98 : 1 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.15 }}
      >
        {displayValue}
      </motion.span>
    </span>
  );
};
