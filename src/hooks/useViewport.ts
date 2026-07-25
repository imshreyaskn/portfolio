// hooks/useViewport.ts — Single source of truth for viewport context
import { useMemo, useState, useEffect } from 'react';
import { useMediaQuery } from './useMediaQuery';

export type InteractionMode = 'touch' | 'pointer' | 'hybrid';

export interface ViewportContext {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  interactionMode: InteractionMode;
  /** Viewport height in px — used for scroll-distance calculations */
  viewportHeight: number;
}

export function useViewport(): ViewportContext {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const hasFinePointer = useMediaQuery('(hover: hover) and (pointer: fine)');
  const hasCoarsePointer = useMediaQuery('(pointer: coarse)');

  // Track viewport height for scroll-distance scaling
  const [viewportHeight, setViewportHeight] = useState(
    typeof window !== 'undefined' ? window.innerHeight : 1080,
  );

  useEffect(() => {
    const onResize = () => setViewportHeight(window.innerHeight);
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return useMemo(() => {
    const interactionMode: InteractionMode =
      hasFinePointer && !hasCoarsePointer ? 'pointer'
      : hasCoarsePointer && !hasFinePointer ? 'touch'
      : 'hybrid';

    return {
      isMobile,
      isTablet,
      isDesktop,
      interactionMode,
      viewportHeight,
    };
  }, [isMobile, isTablet, isDesktop, hasFinePointer, hasCoarsePointer, viewportHeight]);
}
