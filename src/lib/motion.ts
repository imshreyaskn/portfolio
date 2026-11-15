// lib/motion.ts — shared motion vocabulary for framer-motion.
// Mirrors the --ease-* / --dur-* tokens in index.css so CSS and JS animations
// feel like one system.
import type { Easing } from 'framer-motion';

/** Entrances and reveals: fast start, long soft landing. */
export const EASE_OUT: Easing = [0.16, 1, 0.3, 1];
/** State swaps and loops. */
export const EASE_IN_OUT: Easing = [0.65, 0, 0.35, 1];
/** Exits: gather speed, leave quickly. */
export const EASE_IN: Easing = [0.7, 0, 0.84, 0];

/** Durations in seconds (framer-motion units). */
export const DUR = {
  instant: 0.12,
  fast: 0.2,
  base: 0.35,
  slow: 0.6,
  reveal: 1.0,
} as const;

/** Standard spring for UI elements that follow the pointer or settle into place. */
export const SPRING_UI = { type: 'spring', stiffness: 150, damping: 20, mass: 0.6 } as const;

/** One-shot check for raw rAF/canvas loops that can't use framer's hook. */
export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
