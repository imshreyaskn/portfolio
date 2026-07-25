// index.tsx — Projects section. The 2D overlay (threads + planets) and the
// saturn glow are plain CSS-anchored DOM boxes, NOT drei <Html>. They scroll
// on the compositor together with the canvas → zero cross-browser desync.
import { useState, useMemo, useRef, useLayoutEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import Saturn from './Saturn';
import ProjectNodes from './ProjectNodes';
import { generateParticles, PROJECT_TECH_STACKS } from './data';
import { useDeviceCapability } from './hooks/useDeviceCapability';
import { useBlackHoleLayout } from './hooks/useBlackHoleAnchor';
import { useViewport } from '../../../hooks/useViewport';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import GravityDust from '../../GravityDust';
import './Projects.css';

/* ─── Hanging threads SVG (static geometry, shared gradient) ─── */
const ThreadsSVG = memo(function ThreadsSVG() { return (
  <svg
    viewBox="-60 0 220 100"
    preserveAspectRatio="none"
    style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      overflow: 'visible',
      pointerEvents: 'none',
    }}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="threadGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
        <stop offset="20%" stopColor="#FFFFFF" stopOpacity="0.5" />
        <stop offset="70%" stopColor="#FFFFFF" stopOpacity="0.2" />
        <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
      </linearGradient>
    </defs>
    <path d="M -60 0 C -60 3, 0 12, 0 70" stroke="url(#threadGradient)" strokeWidth="1" fill="none" vectorEffect="non-scaling-stroke" />
    <path d="M -25 0 C -25 3, 16.67 12, 16.67 85" stroke="url(#threadGradient)" strokeWidth="1" fill="none" vectorEffect="non-scaling-stroke" />
    <path d="M 10 0 C 10 3, 33.33 12, 33.33 65" stroke="url(#threadGradient)" strokeWidth="1" fill="none" vectorEffect="non-scaling-stroke" />
    <path d="M 38 0 C 38 3, 50 12, 50 95" stroke="url(#threadGradient)" strokeWidth="1" fill="none" vectorEffect="non-scaling-stroke" />
    <path d="M 62 0 C 62 3, 66.67 12, 66.67 80" stroke="url(#threadGradient)" strokeWidth="1" fill="none" vectorEffect="non-scaling-stroke" />
    <path d="M 90 0 C 90 3, 83.33 12, 83.33 75" stroke="url(#threadGradient)" strokeWidth="1" fill="none" vectorEffect="non-scaling-stroke" />
    <path d="M 125 0 C 125 3, 100 12, 100 85" stroke="url(#threadGradient)" strokeWidth="1" fill="none" vectorEffect="non-scaling-stroke" />
  </svg>
); });

const Projects = () => {
  const [hoveredPlanet, setHoveredPlanet] = useState<string | null>(null);
  const sectionRef = useRef<HTMLElement>(null);

  const capability = useDeviceCapability();
  const { interactionMode } = useViewport();
  const isTouchPrimary = interactionMode !== 'pointer';
  // Mirror the CSS docking media query EXACTLY so JS animation and CSS
  // position can never disagree (fixes the tablet slide/dock mismatch).
  const isHudDocked = useMediaQuery('(max-width: 1100px), (pointer: coarse)');

  // Deterministic particle field (seeded), sized by device tier
  const particles = useMemo(
    () => generateParticles(capability.particleCount),
    [capability.particleCount],
  );

  // Pause the raymarcher when <30% visible (was amount:0 → froze at edges)
  const inView = useInView(sectionRef, { amount: 0.3 });

  // Black-hole screen anchor, recomputed only on resize/orientation
  const { posY, anchorY, glowY } = useBlackHoleLayout();

  // Write anchors as CSS custom properties BEFORE paint (no flash)
  useLayoutEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    el.style.setProperty('--bh-anchor-y', `${(anchorY * 100).toFixed(3)}%`);
    el.style.setProperty('--bh-glow-y', `${(glowY * 100).toFixed(3)}%`);
  }, [anchorY, glowY]);

  const handlePlanetTap = useCallback((name: string) => {
    setHoveredPlanet((prev) => (prev === name ? null : name));
  }, []);

  const handleHover = useCallback((p: string | null) => setHoveredPlanet(p), []);

  const canvasElement = useMemo(
    () => (
      <div className="projects-canvas-wrapper">
        <Canvas
          gl={{ antialias: false, powerPreference: 'high-performance' }}
          dpr={capability.dpr}
          style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
        >
          <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={45} />
          <group position={[0, posY, 0]}>
            <Saturn
              isPaused={!inView}
              raymarchSteps={capability.raymarchSteps}
              circleSegments={capability.circleSegments}
            />
          </group>
        </Canvas>
      </div>
    ),
    [capability.dpr, capability.raymarchSteps, capability.circleSegments, posY, inView],
  );

  const projectNodesElement = useMemo(
    () => (
      <div className="projects-overlay-anchor projects-nodes-anchor" aria-hidden="true">
        <div className="projects-overlay-container projects-nodes-overlay">
          <ProjectNodes
            isTouchPrimary={isTouchPrimary}
            setHoveredPlanet={handleHover}
            onTapPlanet={handlePlanetTap}
          />
        </div>
      </div>
    ),
    [isTouchPrimary, handleHover, handlePlanetTap],
  );

  return (
    <section id="projects" className="projects-section" ref={sectionRef} aria-label="Projects">
      <GravityDust active={inView} />
      {/* Ambient glow — CSS-anchored behind the canvas (was drei Html) */}
      <div className="saturn-glow" aria-hidden="true" />

      {/* 2D threads overlay — hangs down BEHIND the black hole canvas (z-index 5) */}
      <div className="projects-overlay-anchor projects-threads-anchor" aria-hidden="true">
        <div className="projects-overlay-container projects-threads-overlay">
          <ThreadsSVG />
          <div className="projects-swarm-mask">
            {particles.map((p, i) => (
              <div
                key={i}
                className="thread-particle"
                style={{
                  left: p.left,
                  top: p.top,
                  animation: `${p.direction === 1 ? 'swarmDown' : 'swarmUp'} ${p.speed} linear ${p.animDelay} infinite`,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {canvasElement}

      {projectNodesElement}

      {/* Planet label HUD */}
      <AnimatePresence>
        {hoveredPlanet && (
          <motion.div
            key={hoveredPlanet}
            initial={isHudDocked ? { opacity: 0 } : { opacity: 0, x: -20, y: '-50%' }}
            animate={isHudDocked ? { opacity: 1 } : { opacity: 1, x: 0, y: '-50%' }}
            exit={isHudDocked ? { opacity: 0 } : { opacity: 0, x: -20, y: '-50%' }}
            transition={{ duration: 0.25 }}
            className="projects-hover-label"
            role="status"
          >
            <div className="project-title silver-glow-text">{hoveredPlanet}</div>
            <div className="project-tech-stack">{PROJECT_TECH_STACKS[hoveredPlanet]}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default Projects;
