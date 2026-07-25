// hooks/useSystemScale.ts — single source of truth for the orb system scale.
import { useEffect, useState } from 'react';

const REF_WIDTH = 1920;
const REF_HEIGHT = 1080;
const SCALE_MIN = 0.7;
const SCALE_MAX = 2.5;

/**
 * Multi-axis scale: the tighter of the width/height ratios wins.
 * - 1920×1080 → min(1, 1) = 1.0   (identical to the original at 1080p)
 * - 3440×1440 → min(1.79, 1.33) = 1.33  (height now binds — no over-scaling)
 * - ≤1344px wide or ≤756px tall → clamps to 0.7 (original floor preserved)
 */
export function computeSystemScale(width: number, height: number): number {
  const widthRatio = width / REF_WIDTH;
  const heightRatio = height / REF_HEIGHT;
  return Math.max(SCALE_MIN, Math.min(SCALE_MAX, Math.min(widthRatio, heightRatio)));
}

export function useSystemScale(): number {
  const [scale, setScale] = useState<number>(() =>
    typeof window !== 'undefined'
      ? computeSystemScale(window.innerWidth, window.innerHeight)
      : 1,
  );

  useEffect(() => {
    let rafId = 0;
    const handleResize = () => {
      cancelAnimationFrame(rafId);
      // rAF-throttle: coalesce bursts of resize events into one state update.
      rafId = requestAnimationFrame(() => {
        setScale(computeSystemScale(window.innerWidth, window.innerHeight));
      });
    };

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', handleResize, { passive: true });
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return scale;
}
