import { useState, useEffect } from 'react';

export const useIsSmallScreen = (breakpoint = 767) => {
  const getMatches = () => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(`(max-width: ${breakpoint}px)`).matches;
  };

  const [isSmallScreen, setIsSmallScreen] = useState(getMatches);

  useEffect(() => {
    const mqWidth = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const update = () => setIsSmallScreen(getMatches());
    
    try {
      mqWidth.addEventListener('change', update);
    } catch (e) {
      mqWidth.addListener(update);
    }
    return () => {
      try {
        mqWidth.removeEventListener('change', update);
      } catch (e) {
        mqWidth.removeListener(update);
      }
    };
  }, [breakpoint]);

  return isSmallScreen;
};

export const useIsMobile = (breakpoint = 767) => {
  const getMatches = () => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(`(max-width: ${breakpoint}px)`).matches || window.matchMedia('(pointer: coarse)').matches;
  };

  const [isMobile, setIsMobile] = useState(getMatches);

  useEffect(() => {
    const mqWidth = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const mqTouch = window.matchMedia('(pointer: coarse)');
    const update = () => setIsMobile(getMatches());
    
    try {
      mqWidth.addEventListener('change', update);
      mqTouch.addEventListener('change', update);
    } catch (e) {
      mqWidth.addListener(update);
      mqTouch.addListener(update);
    }
    return () => {
      try {
        mqWidth.removeEventListener('change', update);
        mqTouch.removeEventListener('change', update);
      } catch (e) {
        mqWidth.removeListener(update);
        mqTouch.removeListener(update);
      }
    };
  }, [breakpoint]);

  return isMobile;
};
