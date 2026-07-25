// hooks/useActiveSection.ts — IntersectionObserver scrollspy.
// Only triggers a React re-render when the winning section actually changes.
import { useEffect, useState } from 'react';

const SECTION_IDS = ['home', 'skills', 'experience', 'projects', 'footer'] as const;
const THRESHOLDS = [0.3, 0.6];
const MAX_OBSERVE_ATTEMPTS = 20; // cap retries; don't poll forever

export function useActiveSection(): string | null {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    const ratios = new Map<string, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          ratios.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
        }
        // Pick the most-visible section; bail out if unchanged (no re-render).
        let best: string | null = null;
        let bestRatio = 0;
        ratios.forEach((ratio, id) => {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            best = id;
          }
        });
        setActiveSection((prev) => (bestRatio > 0 && prev !== best ? best : prev));
      },
      { threshold: THRESHOLDS },
    );

    // Sections may mount after the navbar; retry briefly, then stop.
    const observed = new Set<Element>();
    let attempts = 0;
    const tryObserve = () => {
      attempts += 1;
      let allFound = true;
      for (const id of SECTION_IDS) {
        const el = document.getElementById(id);
        if (el) {
          if (!observed.has(el)) {
            observer.observe(el);
            observed.add(el);
          }
        } else {
          allFound = false;
        }
      }
      if (allFound || attempts >= MAX_OBSERVE_ATTEMPTS) clearInterval(interval);
    };

    const interval = setInterval(tryObserve, 500);
    tryObserve();

    return () => {
      clearInterval(interval);
      observer.disconnect();
    };
  }, []);

  return activeSection;
}
