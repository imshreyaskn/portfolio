// lib/useReadiness.ts — composes the gates into real progress + ready signal.
import { useEffect, useState, useRef } from 'react';
import {
  buildReadinessTasks,
  DWELL_MS,
  REVISIT_DWELL_MS,
  TASK_TIMEOUT_MS,
  HARD_CAP_MS,
  READINESS_LINES,
  withTimeout,
  type LineState,
  type ReadinessLineId,
} from './readiness';

export interface ReadinessState {
  progress: number;
  lines: Record<ReadinessLineId, LineState>;
  ready: boolean;
}

export function useReadiness(): ReadinessState {
  const [progress, setProgress] = useState(0);
  const [lines, setLines] = useState<Record<ReadinessLineId, LineState>>(
    () =>
      Object.fromEntries(READINESS_LINES.map((l) => [l.id, 'queued'])) as Record<
        ReadinessLineId,
        LineState
      >,
  );
  const [ready, setReady] = useState(false);
  const progressRef = useRef(0);

  useEffect(() => {
    const revisit = sessionStorage.getItem('observatory-visited') === '1';
    const dwell = revisit ? REVISIT_DWELL_MS : DWELL_MS;

    const tasks = buildReadinessTasks();
    const totalWeight = tasks.reduce((sum, t) => sum + t.weight, 0);
    let doneWeight = 0;
    let finished = false;
    const startedAt = performance.now();

    const settle = () => {
      if (finished) return;
      finished = true;
      progressRef.current = 1;
      setProgress(1);
      setReady(true);
      try {
        sessionStorage.setItem('observatory-visited', '1');
      } catch {
        /* private mode */
      }
    };

    // All tasks in parallel; lines flip to 'done' as each lands.
    tasks.forEach((task) => {
      setLines((s) => ({ ...s, [task.id]: 'working' }));
      withTimeout((async () => task.run())(), TASK_TIMEOUT_MS).then(() => {
        doneWeight += task.weight;
        setLines((s) => ({ ...s, [task.id]: 'done' }));
      });
    });

    let raf = 0;
    let lastUpdate = 0;
    const UPDATE_INTERVAL = 100; // Update progress at ~10fps, not 60fps

    const tick = (now: number) => {
      const taskPart = doneWeight / totalWeight;
      const dwellPart = Math.min(1, (now - startedAt) / dwell);
      const newProgress = Math.min(0.85 * taskPart + 0.15 * dwellPart, 1);
      
      progressRef.current = newProgress;

      // Only update React state at ~10fps to prevent re-render storms
      if (now - lastUpdate >= UPDATE_INTERVAL) {
        setProgress(newProgress);
        lastUpdate = now;
      }

      if (taskPart >= 1 - 1e-6 && dwellPart >= 1) {
        settle();
      } else {
        raf = requestAnimationFrame(tick);
      }
    };
    
    raf = requestAnimationFrame(tick);

    const cap = setTimeout(settle, HARD_CAP_MS);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(cap);
    };
  }, []);

  return { progress, lines, ready };
}
