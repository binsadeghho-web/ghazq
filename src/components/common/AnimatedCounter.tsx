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
        const elapsed = timestamp - startTimestamp;
        const progress = Math.min(elapsed / duration, 1);

        // Smooth cubic ease-out calculation: 1 - (1 - progress)^3
        const easeProgress = 1 - Math.pow(1 - progress, 3);
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

    // Scroll observer
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            startCounting();
            hasBeenVisibleRef.current = true;
          } else {
            if (hasBeenVisibleRef.current) {
              setDisplayValue('۰');
            }
          }
        });
      },
      {
        threshold: 0.15,
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
        animate={{ scale: isAnimating ? [1, 1.03, 1] : 1 }}
        transition={{ duration: 0.3 }}
      >
        {displayValue}
      </motion.span>
    </span>
  );
};
