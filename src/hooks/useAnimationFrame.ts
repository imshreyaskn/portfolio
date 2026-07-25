// hooks/useAnimationFrame.ts — timestamp-normalized RAF loop.
// Decoupled from scroll/layout: the callback must be write-only.
import { useEffect, useRef } from 'react';

/** Clamp per-frame delta so a background-tab resume never causes a time leap. */
const MAX_DELTA = 0.1; // seconds

/**
 * Runs `callback(deltaSeconds)` every animation frame.
 * - `delta` is derived from the RAF timestamp, NOT a fixed increment,
 *   so motion speed is identical at 60Hz, 120Hz, 144Hz, or throttled 30Hz.
 * - Pauses when the tab is hidden; resets the time baseline on resume.
 */
export function useAnimationFrame(callback: (delta: number) => void): void {
  const callbackRef = useRef(callback);

  // Keep the latest callback without re-subscribing the loop.
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    let rafId: number | undefined;
    let lastTimestamp: number | null = null;

    const tick = (now: number) => {
      if (lastTimestamp === null) lastTimestamp = now;
      const rawDelta = (now - lastTimestamp) / 1000;
      lastTimestamp = now;

      callbackRef.current(Math.min(rawDelta, MAX_DELTA));
      rafId = requestAnimationFrame(tick);
    };

    const handleVisibility = () => {
      if (document.hidden) {
        if (rafId !== undefined) cancelAnimationFrame(rafId);
        rafId = undefined;
      } else if (rafId === undefined) {
        lastTimestamp = null; // avoid a huge delta on resume
        rafId = requestAnimationFrame(tick);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    rafId = requestAnimationFrame(tick);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (rafId !== undefined) cancelAnimationFrame(rafId);
    };
  }, []);
}

/**
 * Frame-rate-independent damping that EXACTLY reproduces the original
 * per-frame lerp at 60fps. `retention` is the fraction of distance retained
 * per 60fps frame (original: 0.9 for state, 0.95 for rotation).
 *
 *   original:  x += (target - x) * 0.1          // per 60fps frame
 *   equivalent continuous form, exact at any delta:
 *              x += (target - x) * (1 - 0.9^(delta*60))
 */
export function dampFactor(retentionPerFrame60: number, delta: number): number {
  return 1 - Math.pow(retentionPerFrame60, delta * 60);
}
