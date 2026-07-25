// components/preloader/Preloader.tsx — the Arrival.
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useReadiness } from '../../lib/useReadiness';
import { READINESS_LINES } from '../../lib/readiness';
import './Preloader.css';

const EASE_PREMIUM = [0.16, 1, 0.3, 1] as const;

interface PreloaderProps {
  /** Gate passed — begin the site's entrance beneath the doors, unlock scroll. */
  onReveal: () => void;
  /** Doors fully open — safe to unmount. */
  onDone: () => void;
}

const Preloader = ({ onReveal, onDone }: PreloaderProps) => {
  const { progress, lines, ready } = useReadiness();
  const [exiting, setExiting] = useState(false);
  const doneFired = useRef(false);

  const reduced = false; // Forced false

  // Gate passed → reveal the site beneath, give the status line a beat, then part.
  useEffect(() => {
    if (!ready) return;
    onReveal();
    const beat = setTimeout(() => setExiting(true), 340);
    return () => clearTimeout(beat);
  }, [ready, onReveal]);

  const doorDuration = 0.95;

  const handleDoorComplete = () => {
    if (exiting && !doneFired.current) {
      doneFired.current = true;
      onDone();
    }
  };

  return (
    <div className="preloader" role="status" aria-label="Preparing the observatory">
      {/* ── Stage: sigil, name, boot log, meter ── */}
      <motion.div
        className="preloader-stage"
        initial={false}
        animate={
          exiting
            ? { opacity: 0, y: -14, filter: 'blur(6px)' }
            : { opacity: 1, y: 0, filter: 'blur(0px)' }
        }
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <div className="preloader-frame" aria-hidden="true">
          <span className="pf-corner pf-tl" />
          <span className="pf-corner pf-tr" />
          <span className="pf-corner pf-bl" />
          <span className="pf-corner pf-br" />
        </div>

        <div className="preloader-sigil" aria-hidden="true">✦</div>
        <h1 className="preloader-title silver-glow-text">shreyas</h1>
        <p className="preloader-sub">private observatory</p>

        <ul className="preloader-log">
          {READINESS_LINES.map((line, i) => {
            const state = lines[line.id];
            return (
              <li
                key={line.id}
                className={`pl-line pl-${state}`}
                style={{ '--i': i } as React.CSSProperties}
              >
                <span className="pl-label">{line.label}</span>
                <span className="pl-dots" aria-hidden="true" />
                <span className="pl-state" aria-hidden="true">
                  {state === 'done' ? 'ok' : state === 'working' ? '···' : '—'}
                </span>
              </li>
            );
          })}
        </ul>

        <div className="preloader-meter" aria-hidden="true">
          <div
            className="preloader-meter-fill"
            style={{ transform: `scaleX(${progress})` }}
          />
        </div>

        <motion.p
          className="preloader-status"
          initial={false}
          animate={{ opacity: progress >= 1 ? 1 : 0 }}
          transition={{ duration: 0.4 }}
        >
          at your service.
        </motion.p>
      </motion.div>

      {/* ── Airlock doors ── */}
      <motion.div
        className="preloader-door preloader-door--top"
        initial={false}
        animate={
          exiting
            ? reduced
              ? { opacity: 0 }
              : { y: '-101%' }
            : { y: '0%', opacity: 1 }
        }
        transition={{ duration: doorDuration, ease: EASE_PREMIUM }}
        onAnimationComplete={handleDoorComplete}
      />
      <motion.div
        className="preloader-door preloader-door--bottom"
        initial={false}
        animate={
          exiting
            ? reduced
              ? { opacity: 0 }
              : { y: '101%' }
            : { y: '0%', opacity: 1 }
        }
        transition={{ duration: doorDuration, ease: EASE_PREMIUM }}
      />

      {/* ── Seam flare as the doors part ── */}
      {!reduced && (
        <motion.div
          className="preloader-seam"
          initial={false}
          animate={
            exiting
              ? { scaleX: [0, 1, 1], opacity: [0, 1, 0] }
              : { scaleX: 0, opacity: 0 }
          }
          transition={{ duration: doorDuration, times: [0, 0.3, 1], ease: 'easeOut' }}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default Preloader;
