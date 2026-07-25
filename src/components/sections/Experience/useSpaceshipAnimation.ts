// useSpaceshipAnimation.ts — Scroll-driven spaceship animation logic
import { useRef } from 'react';
import {
  useScroll,
  useSpring,
  useVelocity,
  useTransform,
  type MotionValue,
} from 'framer-motion';
import type { ViewportContext } from '../../../hooks/useViewport';

/* ─── Constants ─── */

/** Base scroll wrapper height in viewport-height units */
const SCROLL_HEIGHT_VH = 600;

/**
 * Velocity dead-zone: below this absolute velocity, the glow stays at idle.
 * Prevents flicker from useVelocity jitter on low-end devices.
 */
const VELOCITY_DEAD_ZONE = 0.03;

/** Swing amplitude in px — scales with viewport width */
const SWING_DESKTOP = 120;
const SWING_MOBILE = 80;

/** Glow filter strings */
const GLOW_ACTIVE =
  'drop-shadow(0 0 50px rgba(255,255,255,0.95)) ' +
  'drop-shadow(0 0 25px rgba(255,255,255,0.8)) ' +
  'drop-shadow(0 0 8px rgba(255,255,255,0.6))';

const GLOW_IDLE =
  'drop-shadow(0 0 10px rgba(255,255,255,0.3)) ' +
  'drop-shadow(0 0 5px rgba(255,255,255,0.15)) ' +
  'drop-shadow(0 0 0px rgba(255,255,255,0))';

/* ─── Types ─── */

export interface SpaceshipAnimation {
  wrapperRef: React.RefObject<HTMLDivElement | null>;
  spaceshipY: MotionValue<string>;
  spaceshipX: MotionValue<string>;
  spaceshipRotate: MotionValue<number>;
  spaceshipFilter: MotionValue<string>;
  /** Scroll-driven opacity/x for floating labels [index 0..2] */
  labelAnimations: {
    opacity: MotionValue<number>;
    x: MotionValue<string>;
  }[];
  /** Computed wrapper height in vh — responsive to viewport */
  scrollHeightVh: number;
}

/* ─── Hook ─── */

export function useSpaceshipAnimation(
  viewport: ViewportContext,
): SpaceshipAnimation {
  const { isMobile } = viewport;
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Responsive scroll height: shorter on mobile to prevent excessive scrolling
  const scrollHeightVh = isMobile ? 400 : SCROLL_HEIGHT_VH;

  const { scrollYProgress } = useScroll({
    target: wrapperRef,
    offset: ['start start', 'end end'],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const scrollVelocity = useVelocity(smoothProgress);

  /* ── Spaceship Y: linear scroll mapping ── */
  const spaceshipY = useTransform(
    smoothProgress,
    [0, 1],
    ['40vh', '-40vh'],
  );

  /* ── Spaceship X: sinusoidal swing ── */
  const swingAmplitude = isMobile ? SWING_MOBILE : SWING_DESKTOP;

  const spaceshipX = useTransform(smoothProgress, (p) => {
    return `${-swingAmplitude * Math.sin(4 * Math.PI * (p - 0.125))}px`;
  });

  /* ── Spaceship rotation ── */
  const spaceshipRotate = useTransform(smoothProgress, (p) => {
    return 40 * -Math.cos(4 * Math.PI * (p - 0.125));
  });

  /* ── Glow filter with velocity dead-zone ── */
  const spaceshipFilter = useTransform(scrollVelocity, (v) => {
    const absV = Math.abs(v);
    if (absV < VELOCITY_DEAD_ZONE) return GLOW_IDLE;
    // Smooth interpolation between idle and active based on velocity magnitude
    const t = Math.min(1, (absV - VELOCITY_DEAD_ZONE) / (0.5 - VELOCITY_DEAD_ZONE));
    return t > 0.5 ? GLOW_ACTIVE : GLOW_IDLE;
  });

  /* ── Floating label animations (3 labels, staggered scroll ranges) ── */
  const labelRanges: [number, number, number][] = [
    [0.65, 0.75, 0.85], // Label 0 (top moon)
    [0.40, 0.50, 0.60], // Label 1 (middle moon)
    [0.15, 0.25, 0.35], // Label 2 (bottom moon)
  ];

  const labelAnimations = labelRanges.map(([start, mid, end]) => ({
    opacity: useTransform(
      smoothProgress,
      [start, mid, end],
      [0, 1, 0],
    ),
    x: useTransform(
      smoothProgress,
      [start, mid, end],
      ['-50px', '0px', '50px'],
    ),
  }));

  return {
    wrapperRef,
    spaceshipY,
    spaceshipX,
    spaceshipRotate,
    spaceshipFilter,
    labelAnimations,
    scrollHeightVh,
  };
}
