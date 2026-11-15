import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { useCallback, useState } from 'react';
import MagneticButton from '../MagneticButton';
import './Hero.css';

import { EASE_OUT as EASE_PREMIUM } from '../../lib/motion';

/* ─── Animation Constants (module-level: no re-creation per render) ─── */

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.3,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30, filter: 'blur(8px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 1.2, ease: EASE_PREMIUM },
  },
};

/* ─── Component ─── */

interface HeroProps {
  onOpenConnectModal: () => void;
  /** Held false by the Arrival until the readiness gate passes. */
  start: boolean;
}

const Hero = ({ onOpenConnectModal, start }: HeroProps) => {
  const [sheenDone, setSheenDone] = useState(false);
  const reducedMotion = useReducedMotion() ?? false;

  const handleConnectClick = useCallback(() => {
    onOpenConnectModal();
  }, [onOpenConnectModal]);

  return (
    <motion.section
      id="home"
      className="hero-section"
      aria-label="Introduction"
      initial={false}
      animate={
        start
          ? { scale: 1, opacity: 1, filter: 'blur(0px)' }
          : { scale: 0.95, opacity: 0, filter: 'blur(10px)' }
      }
      transition={{ duration: 1.5, ease: EASE_PREMIUM }}
    >
      {/* Decorative hero figure — anchored to right edge */}
      <div
        className={`hero-image-wrapper${start && !sheenDone && !reducedMotion ? ' hero-image-wrapper--sheen' : ''}`}
        aria-hidden="true"
      >
        <img
          src="/hero-figure.webp"
          alt=""
          className="hero-image"
          width={856}
          height={768}
          fetchPriority="high"
          decoding="async"
          draggable={false}
        />
      </div>

      {/* Primary content column */}
      <div className="hero-content-wrapper">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={start ? 'show' : 'hidden'}
          className="hero-content"
        >
          {/* Pretitle — Japanese particle */}
          <motion.p variants={itemVariants} className="hero-pretitle silver-glow-text" lang="ja">
            私は
          </motion.p>

          {/* Name */}
          <motion.div variants={itemVariants} className="hero-title-wrapper">
            <h1
              className={`hero-title${
                start && !sheenDone && !reducedMotion ? ' hero-title--sheen' : ''
              }`}
              onAnimationEnd={(e) => {
                // Self-clean: once the sweep lands, restore the pristine title
                if (e.animationName === 'image-sheen') setSheenDone(true);
              }}
            >
              shreyas
            </h1>
          </motion.div>

          {/* Description */}
          <motion.div variants={itemVariants} className="hero-desc-wrapper">
            <p className="hero-desc">
              a computer science student building ai agents, llm security tools,
              and automation systems.
              <br />
              <span className="silver-glow-text">at your service.</span>
            </p>
          </motion.div>

          {/* CTA */}
          <motion.div variants={itemVariants} className="hero-cta-wrapper">
            <MagneticButton
              onClick={handleConnectClick}
              className="framer-button hero-cta"
              aria-label="Open contact form to connect"
            >
              let's connect
            </MagneticButton>
          </motion.div>
        </motion.div>
      </div>
    </motion.section>
  );
};

export default Hero;
