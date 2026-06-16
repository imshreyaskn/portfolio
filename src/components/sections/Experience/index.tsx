import { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring, useVelocity, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { EXPERIENCES } from './data';
import './Experience.css';

const MoonSVG = ({ phase, className, onClick, ariaLabel }: { phase: number, className?: string, onClick?: () => void, ariaLabel?: string }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 100 100" 
      className={className} 
      onClick={onClick}
      role="button"
      aria-label={ariaLabel}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <defs>
        <linearGradient id={`sweepGrad-${phase}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="35%" stopColor="#7A7A8C" />
          <stop offset="50%" stopColor="#ffffff" />
          <stop offset="65%" stopColor="#7A7A8C" />
          <stop offset="100%" stopColor="#ffffff" />
          <animateTransform 
            attributeName="gradientTransform" 
            type="rotate" 
            from="0 0.5 0.5" 
            to="360 0.5 0.5" 
            dur="6s" 
            repeatCount="indefinite" 
          />
        </linearGradient>
      </defs>
      {phase === 0 && (
        <circle cx="50" cy="50" r="48" fill="#000000" stroke={`url(#sweepGrad-${phase})`} strokeWidth="1.5" />
      )}
      {phase === 1 && (
        <g transform="rotate(90 50 50)">
          <path d="M 50 2 A 48 48 0 0 1 50 98 Z" fill="#000000" stroke={`url(#sweepGrad-${phase})`} strokeWidth="1.5" strokeLinejoin="round" />
        </g>
      )}
      {phase === 2 && (
        <g transform="rotate(45 50 50)">
          <path d="M 50 2 A 48 48 0 0 1 50 98 A 34 48 0 0 0 50 2 Z" fill="#000000" stroke={`url(#sweepGrad-${phase})`} strokeWidth="1.5" strokeLinejoin="round" />
        </g>
      )}
    </svg>
  );
};

const Experience = () => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [selectedMoon, setSelectedMoon] = useState<number | null>(null);
  const [isPanelActive, setIsPanelActive] = useState(false);
  const isMobile = useIsMobile();
  const isMobileRef = useRef(false);

  // ─── Mobile reference sync ────────────────────────────────────────────────
  useEffect(() => {
    isMobileRef.current = isMobile;
  }, [isMobile]);

  // ─── Panel active state (drives border animation) ─────────────────────────
  useEffect(() => {
    if (selectedMoon !== null) {
      const timer = setTimeout(() => setIsPanelActive(true), 50);
      return () => { clearTimeout(timer); setIsPanelActive(false); };
    } else {
      setIsPanelActive(false);
    }
  }, [selectedMoon]);

  const handleSelectMoon = (id: number | null) => {
    setIsPanelActive(false);
    setSelectedMoon(id);
  };

  // ─── Scroll-driven spaceship animation ───────────────────────────────────
  const { scrollYProgress } = useScroll({
    target: wrapperRef,
    offset: ['start start', 'end end']
  });

  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  const scrollVelocity = useVelocity(smoothProgress);
  const smoothVelocity = useSpring(scrollVelocity, { stiffness: 50, damping: 20, restDelta: 0.001 });

  const spaceshipFilter = useTransform(
    smoothVelocity,
    [-0.5, 0, 0.5],
    [
      'drop-shadow(0 0 50px rgba(255,255,255,0.95)) drop-shadow(0 0 25px rgba(255,255,255,0.8)) drop-shadow(0 0 8px rgba(255,255,255,0.6))',
      'drop-shadow(0 0 10px rgba(255,255,255,0.3)) drop-shadow(0 0 5px rgba(255,255,255,0.15)) drop-shadow(0 0 0px rgba(255,255,255,0))',
      'drop-shadow(0 0 50px rgba(255,255,255,0.95)) drop-shadow(0 0 25px rgba(255,255,255,0.8)) drop-shadow(0 0 8px rgba(255,255,255,0.6))'
    ]
  );

  const spaceshipY = useTransform(smoothProgress, [0, 1], ['40vh', '-40vh']);

  // X swing widened for mobile so the rocket goes around the moons without overlapping
  const spaceshipX = useTransform(smoothProgress, p => {
    const swing = isMobileRef.current ? 80 : 120;
    return `${-swing * Math.sin(4 * Math.PI * (p - 0.125))}px`;
  });
  const spaceshipRotate = useTransform(smoothProgress, p => 40 * -Math.cos(4 * Math.PI * (p - 0.125)));

  // Opacity + x for floating labels (scroll-driven)
  const opacity1 = useTransform(smoothProgress, [0.65, 0.75, 0.85], [0, 1, 0]);
  const x1       = useTransform(smoothProgress, [0.65, 0.75, 0.85], ['-50px', '0px', '50px']);
  const opacity2 = useTransform(smoothProgress, [0.4, 0.5, 0.6],   [0, 1, 0]);
  const x2       = useTransform(smoothProgress, [0.4, 0.5, 0.6],   ['-50px', '0px', '50px']);
  const opacity3 = useTransform(smoothProgress, [0.15, 0.25, 0.35],[0, 1, 0]);
  const x3       = useTransform(smoothProgress, [0.15, 0.25, 0.35],['-50px', '0px', '50px']);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.4 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.9, filter: 'blur(10px)' },
    show: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] } }
  };

  // Desktop: moons shift to make room for panel (clamped).
  // Mobile:  moons slide fully off-screen; panel takes the whole view.
  const containerX = isMobile
    ? (selectedMoon === null ? '0px' : EXPERIENCES[selectedMoon].side === 'left' ? '100vw' : '-100vw')
    : (selectedMoon !== null ? (EXPERIENCES[selectedMoon].side === 'left' ? 'clamp(180px, 20vw, 360px)' : 'clamp(-360px, -20vw, -180px)') : '0px');

  // Panel slide direction based on data side.
  const panelFromX = (moon: number) => EXPERIENCES[moon].side === 'left' ? '-100vw' : '100vw';

  // On desktop the panel is vertically centred via y:"-50%". On mobile it fills the section (no y offset).
  const panelY = isMobile ? '0%' : '-50%';

  return (
    <div className="experience-wrapper" ref={wrapperRef}>
      <section id="experience" className="experience-section">

        {/* Moon cluster + spaceship — shifts off-screen when panel opens */}
        <motion.div
          className="experience-shift-wrapper"
          animate={{ x: containerX }}
          transition={{ type: 'spring', stiffness: 80, damping: 20 }}
          style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}
        >
          <motion.div
            className="spaceship"
            style={{ y: spaceshipY, x: spaceshipX, rotate: spaceshipRotate, filter: spaceshipFilter }}
          >
            <svg viewBox="0 0 24 24" width={isMobile ? "18" : "32"} height={isMobile ? "18" : "32"} fill="rgba(0,0,0,0.6)" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2 L6 12 L12 22 L18 12 Z" />
            </svg>
          </motion.div>

          <motion.div
            className="moon-images-container"
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-100px' }}
          >
            {/* Moon 0 */}
            <motion.div variants={itemVariants} style={{ position: 'relative' }}>
              <MoonSVG phase={0} className="moon-image glow-full" onClick={() => handleSelectMoon(0)} ariaLabel={EXPERIENCES[0].company} />
              <motion.div
                className="experience-label right"
                style={{
                  opacity: opacity1,
                  // On mobile: labels sit below the moon (CSS handles position), no x drift
                  x: isMobile ? undefined : x1,
                  y: isMobile ? undefined : '-50%'
                }}
              >
                {EXPERIENCES[0].company}
              </motion.div>
            </motion.div>

            {/* Moon 1 */}
            <motion.div variants={itemVariants} style={{ position: 'relative' }}>
              <MoonSVG phase={1} className="moon-image glow-bottom" onClick={() => handleSelectMoon(1)} ariaLabel={EXPERIENCES[1].company} />
              <motion.div
                className="experience-label left"
                style={{
                  opacity: opacity2,
                  x: isMobile ? undefined : x2,
                  y: isMobile ? undefined : '-50%'
                }}
              >
                {EXPERIENCES[1].company}
              </motion.div>
            </motion.div>

            {/* Moon 2 */}
            <motion.div variants={itemVariants} style={{ position: 'relative' }}>
              <MoonSVG phase={2} className="moon-image glow-bottom-right" onClick={() => handleSelectMoon(2)} ariaLabel={EXPERIENCES[2].company} />
              <motion.div
                className="experience-label right"
                style={{
                  opacity: opacity3,
                  x: isMobile ? undefined : x3,
                  y: isMobile ? undefined : '-50%'
                }}
              >
                {EXPERIENCES[2].company}
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Info panel — slides in from the direction opposite to where moons exited */}
            <AnimatePresence>
          {selectedMoon !== null && (
            <motion.div
              key={`side-panel-${selectedMoon}`}
              className={`experience-panel ${EXPERIENCES[selectedMoon].side === 'left' ? 'panel-left' : 'panel-right'} ${isPanelActive ? 'active' : ''}`}
              initial={{ x: panelFromX(selectedMoon), y: panelY, opacity: 0 }}
              animate={{ x: '0px',                   y: panelY, opacity: 1 }}
              exit={{    x: panelFromX(selectedMoon), y: panelY, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 85, damping: 18 }}
            >
              <div className="panel-floating-header">
                <button className="panel-close-btn" onClick={() => handleSelectMoon(null)}>
                  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                  </svg>
                </button>
                <h2 className="panel-floating-title">{EXPERIENCES[selectedMoon].company}</h2>
              </div>

              <div className="panel-content">
                <div className="panel-meta">
                  <h3 className="panel-role silver-glow-text">{EXPERIENCES[selectedMoon].role}</h3>
                  <div className="panel-company-duration">
                    <span className="panel-duration">{EXPERIENCES[selectedMoon].duration}</span>
                    {EXPERIENCES[selectedMoon].location && (
                      <>
                        <span>•</span>
                        <span className="panel-location">{EXPERIENCES[selectedMoon].location}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="panel-divider" />
                <ul className="panel-bullets">
                  {EXPERIENCES[selectedMoon].description.map((desc, idx) => (
                    <li key={idx}>{desc}</li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </section>
    </div>
  );
};

export default Experience;
