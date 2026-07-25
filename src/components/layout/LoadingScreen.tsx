import { useEffect, useState, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { useReadiness } from '../../lib/useReadiness';
import './LoadingScreen.css';

interface LoadingScreenProps {
  onReveal: () => void;
  onDone: () => void;
}

const LoadingScreen = ({ onReveal, onDone }: LoadingScreenProps) => {
  const controls = useAnimation();
  const { ready, progress } = useReadiness();
  const [isImploding, setIsImploding] = useState(false);
  const [showProgress, setShowProgress] = useState(true);
  const doneFired = useRef(false);
  const revealFired = useRef(false);

  // Start the infinite spin immediately on mount
  useEffect(() => {
    controls.start('visible');
  }, [controls]);

  // Throttle progress text updates to ~10fps instead of 60fps
  // This prevents LoadingScreen from re-rendering every frame
  const progressRef = useRef(progress);
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    if (!showProgress) return;
    const interval = setInterval(() => {
      // Force a re-render only for the text, not the whole component
      setShowProgress((prev) => prev); // no-op, but we read progressRef in render
    }, 100);
    return () => clearInterval(interval);
  }, [showProgress]);

  // Watch for the readiness gate to pass
  useEffect(() => {
    if (!ready || isImploding) return;

    setIsImploding(true);
    setShowProgress(false); // Stop progress updates

    const finishSequence = async () => {
      // 1. STOP all infinite animations FIRST — this is the critical fix.
      //    Without this, framer-motion tries to reconcile infinite rotateZ
      //    with the implode scale animation, causing frame spikes.
      await controls.start('stopSpin');

      // 2. Small delay to let the animation loop settle
      await new Promise((r) => setTimeout(r, 50));

      // 3. Start the implosion
      window.dispatchEvent(new CustomEvent('implosion-start'));
      const implodePromise = controls.start('implode');

      // 4. Fire onReveal at 80% through the implosion (not at the start)
      //    This prevents Hero/StarMap/OrbNavbar from mounting during peak animation load
      setTimeout(() => {
        if (!revealFired.current) {
          revealFired.current = true;
          onReveal();
        }
      }, 640); // 80% of 800ms implosion

      // 5. Wait for implosion to complete
      await implodePromise;

      // 6. Unmount
      if (!doneFired.current) {
        doneFired.current = true;
        onDone();
      }
    };

    finishSequence();
  }, [ready, isImploding, controls, onReveal, onDone]);

  const displayProgress = Math.round(progressRef.current * 100);

  return (
    <motion.div
      className="loading-screen-overlay"
      initial={{ backgroundColor: 'rgba(0, 0, 0, 1)' }}
      animate={{
        backgroundColor: isImploding ? 'rgba(0, 0, 0, 0)' : 'rgba(0, 0, 0, 1)',
      }}
      transition={{ duration: 0.8, ease: 'easeIn' }}
    >
      <div className="black-hole-container">
        {/* Outer Ring */}
        <motion.div
          className="accretion-disk-outer"
          initial={{ scale: 0, opacity: 0, rotateX: 70, rotateZ: 0 }}
          animate={controls}
          variants={{
            visible: {
              scale: 1,
              opacity: 1,
              rotateZ: 360,
              transition: {
                scale: { duration: 1.5, ease: 'easeOut' },
                opacity: { duration: 1.5 },
                rotateZ: { duration: 10, ease: 'linear', repeat: Infinity },
              },
            },
            stopSpin: {
              rotateZ: 0,
              transition: { duration: 0.3, ease: 'easeOut' },
            },
            implode: {
              scale: 0,
              opacity: 0,
              transition: { duration: 0.8, ease: [0.6, 0, 0.4, 1] },
            },
          }}
        />

        {/* Main Disk */}
        <motion.div
          className="accretion-disk"
          initial={{ scale: 0.2, opacity: 0, rotateX: 65, rotateZ: 0 }}
          animate={controls}
          variants={{
            visible: {
              scale: 1,
              opacity: 1,
              rotateZ: 360,
              transition: {
                scale: { duration: 1.2, ease: 'easeOut', delay: 0.2 },
                opacity: { duration: 1.2, delay: 0.2 },
                rotateZ: { duration: 3, ease: 'linear', repeat: Infinity },
              },
            },
            stopSpin: {
              rotateZ: 0,
              transition: { duration: 0.3, ease: 'easeOut' },
            },
            implode: {
              scale: 0,
              opacity: 0,
              rotateZ: 720,
              transition: { duration: 0.8, ease: [0.6, 0, 0.4, 1] },
            },
          }}
        />

        {/* Inner Disk */}
        <motion.div
          className="accretion-disk-inner"
          initial={{ scale: 0, opacity: 0, rotateX: 60, rotateZ: 0 }}
          animate={controls}
          variants={{
            visible: {
              scale: 1,
              opacity: 1,
              rotateZ: -360,
              transition: {
                scale: { duration: 1, ease: 'easeOut', delay: 0.4 },
                opacity: { duration: 1, delay: 0.4 },
                rotateZ: { duration: 2, ease: 'linear', repeat: Infinity },
              },
            },
            stopSpin: {
              rotateZ: 0,
              transition: { duration: 0.3, ease: 'easeOut' },
            },
            implode: {
              scale: 0,
              opacity: 0,
              rotateZ: -720,
              transition: { duration: 0.6, ease: [0.6, 0, 0.4, 1] },
            },
          }}
        />

        {/* Event Horizon — remove box-shadow during implosion to prevent repaint storms */}
        <motion.div
          className={`event-horizon${isImploding ? ' imploding' : ''}`}
          initial={{ scale: 0 }}
          animate={controls}
          variants={{
            visible: {
              scale: 1,
              transition: { duration: 1.8, ease: [0.16, 1, 0.3, 1] },
            },
            stopSpin: {},
            implode: {
              scale: 0,
              transition: { duration: 0.6, ease: 'easeIn', delay: 0.2 },
            },
          }}
        />

        {/* Progress Text — isolated from animation re-renders */}
        {showProgress && (
          <div className="loading-text">
            {displayProgress < 100
              ? `establishing orbit... ${displayProgress}%`
              : 'at your service.'}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default LoadingScreen;
