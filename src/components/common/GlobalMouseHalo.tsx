import React, { useEffect, useRef } from 'react';

interface GlobalMouseHaloProps {
  theme?: 'portal' | 'crextio';
}

export const GlobalMouseHalo: React.FC<GlobalMouseHaloProps> = ({ theme = 'portal' }) => {
  const haloRef = useRef<HTMLDivElement>(null);
  const coreRef = useRef<HTMLDivElement>(null);
  const trailCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let mouseX = -1000;
    let mouseY = -1000;
    let currentX = -1000;
    let currentY = -1000;
    let isVisible = false;
    let rafId: number;

    // Particle system for Theme 2 luxury trail
    interface Particle {
      x: number;
      y: number;
      size: number;
      alpha: number;
      vx: number;
      vy: number;
      color: string;
    }
    const particles: Particle[] = [];
    const colors = theme === 'crextio'
      ? ['#10b981', '#34d399', '#f59e0b', '#fbbf24', '#06b6d4', '#6ee7b7']
      : ['#6366f1', '#818cf8', '#f59e0b', '#a855f7', '#38bdf8', '#c084fc'];

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!isVisible) {
        isVisible = true;
        currentX = mouseX;
        currentY = mouseY;
      }

      // Add a couple of subtle micro-particles on movement in theme 2
      if (theme === 'crextio' && Math.random() < 0.35) {
        particles.push({
          x: mouseX + (Math.random() - 0.5) * 20,
          y: mouseY + (Math.random() - 0.5) * 20,
          size: Math.random() * 2.8 + 1,
          alpha: 0.7,
          vx: (Math.random() - 0.5) * 0.8,
          vy: (Math.random() - 0.5) * 0.8 - 0.3,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
        if (particles.length > 35) particles.shift();
      }
    };

    const handleMouseLeave = () => {
      isVisible = false;
    };

    const handleMouseEnter = () => {
      isVisible = true;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    const canvas = trailCanvasRef.current;
    const ctx = canvas?.getContext('2d');

    const resizeCanvas = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Smooth animation loop using lerp
    const render = () => {
      // Lerp easing for ultra fluid movement
      const ease = 0.14;
      currentX += (mouseX - currentX) * ease;
      currentY += (mouseY - currentY) * ease;

      if (haloRef.current) {
        haloRef.current.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`;
        haloRef.current.style.opacity = isVisible ? '1' : '0';
      }

      if (coreRef.current) {
        coreRef.current.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
        coreRef.current.style.opacity = isVisible ? '1' : '0';
      }

      // Render micro-particles for Theme 2
      if (ctx && canvas && theme === 'crextio') {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.alpha -= 0.015;
          if (p.alpha <= 0) {
            particles.splice(i, 1);
            continue;
          }
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha;
          ctx.shadowBlur = 8;
          ctx.shadowColor = p.color;
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
      }

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(rafId);
    };
  }, [theme]);

  // Color schemes for Theme 1 vs Theme 2
  const isCrextio = theme === 'crextio';

  return (
    <div className="fixed inset-0 pointer-events-none z-20 overflow-hidden" aria-hidden="true">
      {/* Canvas for Theme 2 micro-particle dust */}
      {isCrextio && (
        <canvas
          ref={trailCanvasRef}
          className="absolute inset-0 pointer-events-none z-25"
        />
      )}

      {/* Layer 1: Wide Soft Ambient Halo (illuminates empty spaces, margins, and backgrounds) */}
      <div
        ref={haloRef}
        className="absolute top-0 left-0 w-[550px] h-[550px] rounded-full will-change-transform transition-opacity duration-300"
        style={{
          background: isCrextio
            ? 'radial-gradient(circle, rgba(16, 185, 129, 0.18) 0%, rgba(245, 158, 11, 0.10) 35%, rgba(6, 182, 212, 0.05) 60%, transparent 80%)'
            : 'radial-gradient(circle, rgba(99, 102, 241, 0.18) 0%, rgba(245, 158, 11, 0.10) 35%, rgba(168, 85, 247, 0.06) 60%, transparent 80%)',
          filter: 'blur(32px)',
          opacity: 0,
        }}
      />

      {/* Layer 2: Refined Inner Core Spotlight right under the cursor */}
      <div
        ref={coreRef}
        className="absolute top-0 left-0 w-[220px] h-[220px] rounded-full will-change-transform transition-opacity duration-150"
        style={{
          background: isCrextio
            ? 'radial-gradient(circle, rgba(52, 211, 153, 0.28) 0%, rgba(251, 191, 36, 0.18) 40%, transparent 75%)'
            : 'radial-gradient(circle, rgba(129, 140, 248, 0.28) 0%, rgba(251, 191, 36, 0.16) 40%, transparent 75%)',
          filter: 'blur(16px)',
          opacity: 0,
        }}
      />
    </div>
  );
};
