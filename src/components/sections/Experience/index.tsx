// index.tsx — Experience section: scroll-driven animation, moon selection, details panel
import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EXPERIENCES } from './data';
import MoonSVG, { MoonGradientDefs } from './MoonSVG';
import { useSpaceshipAnimation } from './useSpaceshipAnimation';
import { useViewport } from '../../../hooks/useViewport';
import './Experience.css';

/* ─── Animation variants (module-level: stable references) ─── */

const EASE_PREMIUM = [0.16, 1, 0.3, 1] as const;

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.4 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 50, scale: 0.9, filter: 'blur(10px)' },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: { duration: 1.2, ease: EASE_PREMIUM },
  },
};

const PANEL_SPRING = { type: 'spring' as const, stiffness: 85, damping: 18 };
const SHIFT_SPRING = { type: 'spring' as const, stiffness: 80, damping: 20 };

/* ─── Layout strategy ─── */

function usePanelLayout(
  selectedIndex: number | null,
  isMobile: boolean,
) {
  return useMemo(() => {
    if (selectedIndex === null) {
      return {
        containerX: '0px',
        panelFromX: '0px',
        panelY: isMobile ? '0%' : '-50%',
        panelSide: 'right' as const,
      };
    }

    const side = EXPERIENCES[selectedIndex].side;
    const isLeft = side === 'left';

    if (isMobile) {
      return {
        containerX: isLeft ? '100vw' : '-100vw',
        panelFromX: isLeft ? '-100vw' : '100vw',
        panelY: '0%',
        panelSide: side,
      };
    }

    // Desktop: compute pixel offset from vw to avoid clamp() string issue
    // 20vw clamped to [180px, 360px]
    const vwOffset = Math.min(360, Math.max(180, window.innerWidth * 0.2));

    return {
      containerX: isLeft ? `${vwOffset}px` : `${-vwOffset}px`,
      panelFromX: isLeft ? '-100vw' : '100vw',
      panelY: '-50%',
      panelSide: side,
    };
  }, [selectedIndex, isMobile]);
}

/* ─── Component ─── */

const Experience = () => {
  const [selectedMoon, setSelectedMoon] = useState<number | null>(null);
  const viewport = useViewport();
  const { isMobile } = viewport;

  const {
    wrapperRef,
    spaceshipY,
    spaceshipX,
    spaceshipRotate,
    spaceshipFilter,
    labelAnimations,
    scrollHeightVh,
  } = useSpaceshipAnimation(viewport);

  const layout = usePanelLayout(selectedMoon, isMobile);

  /* ── Handlers ── */

  const handleSelectMoon = useCallback((id: number | null) => {
    setSelectedMoon(id);
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedMoon(null);
  }, []);

  const handleMoonKeyDown = useCallback(
    (index: number) => (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedMoon(null);
      }
    },
    [],
  );

  /* ── Derived state ── */

  const isPanelOpen = selectedMoon !== null;
  const selectedExperience = selectedMoon !== null ? EXPERIENCES[selectedMoon] : null;

  return (
    <div
      className="experience-wrapper"
      ref={wrapperRef}
      style={{ height: `${scrollHeightVh}vh` }}
    >
      {/* Shared gradient definition for all moons */}
      <MoonGradientDefs />

      <section
        id="experience"
        className="experience-section"
        aria-label="Work experience"
      >
        {/* Moon cluster + spaceship — shifts when panel opens */}
        <motion.div
          className="experience-shift-wrapper"
          animate={{ x: layout.containerX }}
          transition={SHIFT_SPRING}
        >
          {/* Spaceship */}
          <motion.div
            className="spaceship"
            style={{
              y: spaceshipY,
              x: spaceshipX,
              rotate: spaceshipRotate,
              filter: spaceshipFilter,
            }}
            aria-hidden="true"
          >
            <svg
              viewBox="0 0 24 24"
              width={isMobile ? 18 : 32}
              height={isMobile ? 18 : 32}
              fill="rgba(0,0,0,0.6)"
              stroke="white"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2 L6 12 L12 22 L18 12 Z" />
            </svg>
          </motion.div>

          {/* Moon cluster */}
          <motion.div
            className="moon-images-container"
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-100px' }}
          >
            {EXPERIENCES.map((exp, index) => (
              <motion.div
                key={exp.id}
                variants={itemVariants}
                className="moon-item"
              >
                <MoonSVG
                  phase={exp.moonPhase}
                  className={`moon-image glow-${
                    exp.moonPhase === 0
                      ? 'full'
                      : exp.moonPhase === 1
                        ? 'bottom'
                        : 'bottom-right'
                  }`}
                  onClick={() => handleSelectMoon(index)}
                  ariaLabel={exp.title}
                  ariaPressed={selectedMoon === index}
                />

                {/* Floating label */}
                <motion.div
                  className={`experience-label ${
                    index % 2 === 0 ? 'right' : 'left'
                  }`}
                  style={{
                    opacity: labelAnimations[index].opacity,
                    x: isMobile ? undefined : labelAnimations[index].x,
                    y: isMobile ? undefined : '-50%',
                  }}
                  aria-hidden="true"
                >
                  {exp.company}
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Details panel */}
        <AnimatePresence>
          {selectedExperience && selectedMoon !== null && (
            <motion.div
              key={`panel-${selectedExperience.id}`}
              className={`experience-panel panel-${layout.panelSide}`}
              initial={{
                x: layout.panelFromX,
                y: layout.panelY,
                opacity: 0,
              }}
              animate={{
                x: '0px',
                y: layout.panelY,
                opacity: 1,
              }}
              exit={{
                x: layout.panelFromX,
                y: layout.panelY,
                opacity: 0,
              }}
              transition={PANEL_SPRING}
              role="dialog"
              aria-label={`${selectedExperience.company} — ${selectedExperience.role}`}
              aria-modal="false"
            >
              {/* Panel header */}
              <div className="panel-floating-header">
                <button
                  type="button"
                  className="panel-close-btn"
                  onClick={handleClosePanel}
                  aria-label={`Close ${selectedExperience.company} details`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="24"
                    height="24"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                  </svg>
                </button>
                <h2 className="panel-floating-title">
                  {selectedExperience.company}
                </h2>
              </div>

              {/* Panel content */}
              <div className="panel-content">
                <div className="panel-meta">
                  <h3 className="panel-role silver-glow-text">
                    {selectedExperience.role}
                  </h3>
                  <div className="panel-company-duration">
                    <span className="panel-duration">
                      {selectedExperience.duration}
                    </span>
                    {selectedExperience.location && (
                      <>
                        <span aria-hidden="true">•</span>
                        <span className="panel-location">
                          {selectedExperience.location}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="panel-divider" role="separator" />

                <ul className="panel-bullets">
                  {selectedExperience.description.map((desc, idx) => (
                    <li key={`${selectedExperience.id}-desc-${idx}`}>
                      {desc}
                    </li>
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
