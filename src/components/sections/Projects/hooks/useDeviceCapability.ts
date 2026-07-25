// hooks/useDeviceCapability.ts — GPU/CPU heuristic for render-quality tiering
import { useMemo } from 'react';

export type QualityTier = 'high' | 'medium' | 'low';

export interface DeviceCapability {
  tier: QualityTier;
  /** Requested DPR range for the parent <Canvas> */
  dpr: [number, number];
  /** Raymarch integration steps per fragment */
  raymarchSteps: number;
  /** Thread particle count */
  particleCount: number;
  /** Circle geometry segments wrapping the accretion disk */
  circleSegments: number;
}

export function useDeviceCapability(): DeviceCapability {
  return useMemo(() => {
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const cores = navigator.hardwareConcurrency || 4;
    const screenArea = window.screen.width * window.screen.height;

    // Low-end: few cores, or high-DPR small screen (phones)
    if (cores <= 4 || (dpr >= 2.5 && screenArea < 500_000)) {
      return { tier: 'low', dpr: [1, 1.5], raymarchSteps: 40, particleCount: 10, circleSegments: 24 };
    }
    // Mid-range: moderate core count
    if (cores <= 8) {
      return { tier: 'medium', dpr: [1, 2], raymarchSteps: 70, particleCount: 14, circleSegments: 32 };
    }
    // High-end desktop — matches the original 110-step / 18-particle build
    return { tier: 'high', dpr: [1, 2], raymarchSteps: 110, particleCount: 18, circleSegments: 32 };
  }, []);
}
