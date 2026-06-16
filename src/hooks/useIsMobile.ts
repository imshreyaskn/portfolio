import { useState, useEffect } from 'react';

export const useIsMobile = (breakpoint = 767) => {
  // Initialize synchronously so the very first render already has the correct
  // value — avoids a desktop-layout flash on mobile before the effect fires.
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(`(max-width: ${breakpoint}px)`).matches
  );

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const update = () => setIsMobile(mq.matches);
    
    // Listen for changes (e.g. window resize / orientation change)
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [breakpoint]);

  return isMobile;
};
