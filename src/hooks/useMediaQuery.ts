// hooks/useMediaQuery.ts — SSR-safe matchMedia primitive
import { useEffect, useState } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', onChange);
    setMatches(mql.matches); // sync in case SSR/initial guess was wrong
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

/**
 * Interaction capability, NOT viewport size. A 1024px touch tablet is
 * `canHover === false`; a 1920px touchscreen laptop with a mouse is `true`.
 * This is what gates hover vs. tap behavior.
 */
export const useCanHover = () => useMediaQuery('(hover: hover) and (pointer: fine)');
