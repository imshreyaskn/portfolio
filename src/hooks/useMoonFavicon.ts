// src/hooks/useMoonFavicon.ts
import { useEffect } from 'react';

const SIZE = 32;
const TAU = Math.PI * 2;
const PHASE_COUNT = 8;

type PhaseRenderer = (ctx: CanvasRenderingContext2D) => void;

// Each renderer assumes a cleared canvas and opens its own path (fixes the
// path-accumulation bug — the original never called beginPath() on the first arc).
const MOON_PHASES: PhaseRenderer[] = [
  // 0: New Moon
  (ctx) => {
    ctx.beginPath();
    ctx.arc(16, 16, 14, 0, TAU);
    ctx.fillStyle = '#111';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(16, 16, 14, Math.PI * 0.5, Math.PI * 1.5);
    ctx.strokeStyle = 'rgba(200, 200, 220, 0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();
  },
  // 1: Waxing Crescent
  (ctx) => {
    ctx.beginPath();
    ctx.arc(16, 16, 14, 0, TAU);
    ctx.fillStyle = '#111';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(16, 16, 14, Math.PI * 0.5, Math.PI * 1.5);
    ctx.fillStyle = '#dcdce6';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(16, 16, 8, 14, 0, Math.PI * 0.5, Math.PI * 1.5);
    ctx.fillStyle = '#111';
    ctx.fill();
  },
  // 2: First Quarter
  (ctx) => {
    ctx.beginPath();
    ctx.arc(16, 16, 14, 0, TAU);
    ctx.fillStyle = '#111';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(16, 16, 14, Math.PI * 0.5, Math.PI * 1.5);
    ctx.fillStyle = '#dcdce6';
    ctx.fill();
  },
  // 3: Waxing Gibbous
  (ctx) => {
    ctx.beginPath();
    ctx.arc(16, 16, 14, 0, TAU);
    ctx.fillStyle = '#dcdce6';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(16, 16, 14, Math.PI * 1.5, Math.PI * 0.5);
    ctx.fillStyle = '#111';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(16, 16, 8, 14, 0, Math.PI * 1.5, Math.PI * 0.5);
    ctx.fillStyle = '#dcdce6';
    ctx.fill();
  },
  // 4: Full Moon
  (ctx) => {
    ctx.beginPath();
    ctx.arc(16, 16, 14, 0, TAU);
    ctx.fillStyle = '#dcdce6';
    ctx.fill();
  },
  // 5: Waning Gibbous
  (ctx) => {
    ctx.beginPath();
    ctx.arc(16, 16, 14, 0, TAU);
    ctx.fillStyle = '#dcdce6';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(16, 16, 14, Math.PI * 0.5, Math.PI * 1.5);
    ctx.fillStyle = '#111';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(16, 16, 8, 14, 0, Math.PI * 0.5, Math.PI * 1.5);
    ctx.fillStyle = '#dcdce6';
    ctx.fill();
  },
  // 6: Last Quarter
  (ctx) => {
    ctx.beginPath();
    ctx.arc(16, 16, 14, 0, TAU);
    ctx.fillStyle = '#111';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(16, 16, 14, Math.PI * 1.5, Math.PI * 0.5);
    ctx.fillStyle = '#dcdce6';
    ctx.fill();
  },
  // 7: Waning Crescent
  (ctx) => {
    ctx.beginPath();
    ctx.arc(16, 16, 14, 0, TAU);
    ctx.fillStyle = '#111';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(16, 16, 14, Math.PI * 1.5, Math.PI * 0.5);
    ctx.fillStyle = '#dcdce6';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(16, 16, 8, 14, 0, Math.PI * 1.5, Math.PI * 0.5);
    ctx.fillStyle = '#111';
    ctx.fill();
  },
];

export const useMoonFavicon = (): void => {
  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Encode all 8 phases ONCE. This is the only toDataURL work that ever happens.
    const cache: string[] = MOON_PHASES.map((draw) => {
      ctx.clearRect(0, 0, SIZE, SIZE);
      draw(ctx);
      return canvas.toDataURL('image/png');
    });

    let link = document.querySelector<HTMLLinkElement>(
      "link[rel='icon'], link[rel='shortcut icon']",
    );
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      link.type = 'image/png';
      document.head.appendChild(link);
    }

    let currentPhase = -1;
    let rafId = 0;

    const update = (): void => {
      rafId = 0;
      const maxScroll = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      const progress = Math.min(1, Math.max(0, window.scrollY / maxScroll));
      const phase = Math.min(PHASE_COUNT - 1, Math.floor(progress * PHASE_COUNT));
      if (phase === currentPhase) return; // no-op unless the phase actually changed
      currentPhase = phase;
      link!.href = cache[phase];
    };

    const schedule = (): void => {
      if (!rafId) rafId = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, []);
};
