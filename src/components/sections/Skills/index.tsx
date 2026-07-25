// index.tsx — Skills section: layout, glassmorphism, 3D canvas, details pane
import { useState, useCallback, useRef } from 'react';
import { OrbitControls, View, PerspectiveCamera } from '@react-three/drei';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { SKILLS_DATA } from './data';
import ParticleSphere from './ParticleSphere';
import ConstellationGraph from './ConstellationGraph';
import { useViewport } from '../../../hooks/useViewport';
import './Skills.css';

/* ─── Layout strategy: computes shift/slide values from viewport context ─── */

function useLayoutStrategy(
  selectedIndex: number | null,
  isMobile: boolean,
) {
  const isRightSide =
    selectedIndex !== null ? SKILLS_DATA[selectedIndex].side === 'right' : false;

  if (selectedIndex === null) {
    return {
      canvasShift: '0vw',
      paneLeft: '0%',
      slideFrom: '0vw',
      overlayShift: '0vw',
      isRightSide: false,
    };
  }

  if (isMobile) {
    return {
      canvasShift: isRightSide ? '-100vw' : '100vw',
      paneLeft: '0%',
      slideFrom: isRightSide ? '100vw' : '-100vw',
      overlayShift: '0vw', // No overlay shift on mobile (pane is full-width)
      isRightSide,
    };
  }

  return {
    canvasShift: isRightSide ? '-25vw' : '25vw',
    paneLeft: isRightSide ? '50%' : '0%',
    slideFrom: isRightSide ? '50vw' : '-50vw',
    overlayShift: isRightSide ? '-25vw' : '25vw',
    isRightSide,
  };
}

/* ─── Spring config (shared across all animated elements) ─── */
const SPRING_CONFIG = { type: 'spring' as const, damping: 25, stiffness: 120 };

/* ─── Component ─── */

const Skills = () => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const viewport = useViewport();
  const { isMobile, isTablet, dpr } = viewport;

  const viewRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef);

  const isPaused = !inView || (isMobile && selectedIndex !== null);

  const handleSelect = useCallback((index: number) => {
    setSelectedIndex((prev) => (prev === index ? null : index));
  }, []);

  const closeDetails = useCallback(() => setSelectedIndex(null), []);

  const layout = useLayoutStrategy(selectedIndex, isMobile);

  // Keyboard navigation for skill categories
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape' && selectedIndex !== null) {
        closeDetails();
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev === null ? 0 : (prev + 1) % SKILLS_DATA.length,
        );
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev === null
            ? SKILLS_DATA.length - 1
            : (prev - 1 + SKILLS_DATA.length) % SKILLS_DATA.length,
        );
      }
    },
    [selectedIndex, closeDetails],
  );

  // Sphere scale: mobile 0.5, tablet 0.65, desktop 1
  const sphereScale = isMobile ? 0.5 : isTablet ? 0.65 : 1;

  return (
    <section
      id="skills"
      className="skills-section"
      ref={sectionRef}
      aria-label="Technical skills"
      onKeyDown={handleKeyDown}
    >
      {/* Shared animated gradient definition */}
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <defs>
          <linearGradient id="animatedPremiumGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff">
              <animate
                attributeName="stop-color"
                values="#ffffff;#7A7A8C;#ffffff"
                dur="4s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="100%" stopColor="#7A7A8C">
              <animate
                attributeName="stop-color"
                values="#7A7A8C;#ffffff;#7A7A8C"
                dur="4s"
                repeatCount="indefinite"
              />
            </stop>
          </linearGradient>
        </defs>
      </svg>

      {/* Glassmorphism overlay */}
      <motion.div
        animate={{ x: layout.overlayShift }}
        transition={SPRING_CONFIG}
        className="skills-glass-overlay"
        aria-hidden="true"
      />

      {/* Details pane */}
      <AnimatePresence mode="wait">
        {selectedIndex !== null && (
          <motion.div
            key={layout.isRightSide ? 'right-pane' : 'left-pane'}
            initial={{ opacity: 0, x: layout.slideFrom }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: layout.slideFrom }}
            transition={SPRING_CONFIG}
            className="skills-details-pane"
            style={{ left: layout.paneLeft }}
            role="dialog"
            aria-label={`${SKILLS_DATA[selectedIndex].category} details`}
            aria-modal="false"
          >
            <div className="skills-details-header">
              <motion.button
                type="button"
                onClick={closeDetails}
                className="framer-button skills-back-button"
                aria-label="Back to skills overview"
              >
                ← back to matrix
              </motion.button>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={SKILLS_DATA[selectedIndex].id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
              >
                <div className="skills-hybrid-layout">
                  <header className="skills-editorial-header">
                    <h2 className="skills-editorial-title silver-glow-text">
                      {SKILLS_DATA[selectedIndex].category.toUpperCase()}
                    </h2>
                    {SKILLS_DATA[selectedIndex].desc && (
                      <p className="skills-editorial-desc">
                        {SKILLS_DATA[selectedIndex].desc}
                      </p>
                    )}
                  </header>

                  <ConstellationGraph
                    skills={SKILLS_DATA[selectedIndex].skills}
                    isMobile={isMobile}
                  />
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* R3F Canvas */}
      <motion.div
        animate={{ x: layout.canvasShift }}
        transition={SPRING_CONFIG}
        className="skills-canvas-wrapper"
      >
        <View
          className="skills-canvas-view"
          ref={viewRef}
          dpr={dpr}
          style={{ touchAction: isMobile ? 'pan-y' : 'none' }}
        >
          <PerspectiveCamera makeDefault position={[0, 0, 5.5]} fov={45} />

          {/* OrbitControls: desktop only, only in overview mode */}
          {selectedIndex === null && !isMobile && !isTablet && (
            <OrbitControls
              enableZoom={false}
              enablePan={false}
              enableDamping
              dampingFactor={0.05}
              rotateSpeed={0.5}
            />
          )}

          <group scale={sphereScale}>
            <ParticleSphere
              count={300}
              radius={0.5}
              onSelect={handleSelect}
              portalRef={viewRef}
              isPaused={isPaused}
              viewport={viewport}
            />
          </group>
        </View>
      </motion.div>

      {/* Screen-reader-only skill navigation (keyboard accessible) */}
      <nav className="skills-sr-nav" aria-label="Skill categories">
        <ul>
          {SKILLS_DATA.map((cat, i) => (
            <li key={cat.id}>
              <button
                type="button"
                onClick={() => handleSelect(i)}
                aria-pressed={selectedIndex === i}
                className="skills-sr-button"
              >
                {cat.category}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </section>
  );
};

export default Skills;
