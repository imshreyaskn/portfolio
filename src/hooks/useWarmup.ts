import { useEffect, useState } from 'react';

/**
 * True for the first `ms` after mount, then false.
 *
 * The 3D sections pause their render loop while offscreen. If they never
 * render before the visitor first scrolls to them, shaders and drei overlays
 * initialise at that moment and the page hitches for ~150–250ms. Rendering
 * fully during this window — which overlaps the loading screen — does that
 * work up front instead.
 */
export function useWarmup(ms = 4000): boolean {
  const [warm, setWarm] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setWarm(false), ms);
    return () => clearTimeout(t);
  }, [ms]);
  return warm;
}
