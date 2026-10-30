import React, { useRef, useState, useCallback } from 'react';
import { motion, HTMLMotionProps } from 'motion/react';

interface SpotlightCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  borderColor?: string;
  spotlightRadius?: number;
}

export const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  className = '',
  glowColor = 'rgba(16, 185, 129, 0.16)',
  borderColor = 'rgba(16, 185, 129, 0.35)',
  spotlightRadius = 320,
  ...props
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative overflow-hidden ${className}`}
      {...props}
    >
      {/* Dynamic Cursor Halo Spotlight */}
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(${spotlightRadius}px circle at ${mousePos.x}px ${mousePos.y}px, ${glowColor}, transparent 80%)`,
        }}
      />

      {/* Dynamic Border Glow */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          border: '1px solid transparent',
          backgroundImage: `radial-gradient(${spotlightRadius * 0.75}px circle at ${mousePos.x}px ${mousePos.y}px, ${borderColor}, transparent 80%)`,
          maskImage: 'linear-gradient(black, black)',
          WebkitMaskImage: 'linear-gradient(black, black)',
          maskComposite: 'exclude',
          WebkitMaskComposite: 'xor',
        }}
      />

      <div className="relative z-10 w-full h-full">{children}</div>
    </motion.div>
  );
};
