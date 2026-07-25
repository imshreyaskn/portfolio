import { useState, useCallback, useEffect, useRef, useMemo, memo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { SKILLS_DATA, SkillItem } from './data';
import ParticleSphere from './ParticleSphere';
import { useIsMobile } from '../../../hooks/useIsMobile';
import './Skills.css';

const ConstellationGraph = memo(function ConstellationGraph({ skills, isMobile, active }: { skills: SkillItem[]; isMobile: boolean; active: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pathsRef = useRef<(SVGPathElement | null)[]>([]);
  const chipsRef = useRef<(HTMLDivElement | null)[]>([]);
  const dxRef = useRef<Float32Array>(new Float32Array(0));
  const dyRef = useRef<Float32Array>(new Float32Array(0));

  useEffect(() => {
    dxRef.current = new Float32Array(skills.length);
    dyRef.current = new Float32Array(skills.length);
  }, [skills]);

  const edges = useMemo(() => {
    const arr: [number, number][] = [];
    for (let i = 0; i < skills.length; i++)
      for (let j = i + 1; j < skills.length; j++) {
        const dx = skills[i].x - skills[j].x, dy = skills[i].y - skills[j].y;
        if (Math.sqrt(dx * dx + dy * dy) < 60) arr.push([i, j]);
      }
    return arr;
  }, [skills]);

  // Runs on both platforms now — mobile gets the same floating
  // scatter + edge-line effect as desktop, just visually smaller
  // via the container's height clamp in CSS.
  useEffect(() => {
    if (!active) return; // ponytail: pause RAF when section is off-screen
    let frameId: number;
    const animate = () => {
      const time = performance.now() * 0.001;
      const dx = dxRef.current, dy = dyRef.current;
      for (let i = 0; i < skills.length; i++) {
        dy[i] = Math.sin(time * 0.4 + i * 2.5) * 8;
        dx[i] = Math.cos(time * 0.3 + i * 1.8) * 8;
        const chip = chipsRef.current[i];
        if (chip) chip.style.transform = `translate(calc(-50% + ${dx[i]}px), calc(-50% + ${dy[i]}px))`;
      }
      for (let idx = 0; idx < edges.length; idx++) {
        const [a, b] = edges[idx];
        const p = pathsRef.current[idx];
        if (!p) continue;
        p.setAttribute('d',
          `M ${skills[a].x + dx[a] / 4} ${skills[a].y + dy[a] / 4} L ${skills[b].x + dx[b] / 4} ${skills[b].y + dy[b] / 4}`);
      }
      frameId = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(frameId);
  }, [skills, edges, active]);

  return (
    <div
      ref={containerRef}
      className={`skills-graph-container${isMobile ? ' skills-graph--mobile-scatter' : ''}`}
      style={{ position: 'relative', width: '100%', height: 'clamp(250px, 40vh, 400px)', marginTop: '1.5rem', overflow: 'visible' }}
    >
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none', overflow: 'visible' }}>
        {edges.map((_, idx) => (
          <path key={`web-${idx}`} ref={(el) => { pathsRef.current[idx] = el; }} fill="none" stroke="url(#animatedPremiumGrad)" strokeWidth="1.5" opacity="0.5" vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      {skills.map((skill, idx) => {
        const Icon = skill.icon;
        return (
          <div key={skill.name} ref={(el) => { chipsRef.current[idx] = el; }} style={{ position: 'absolute', left: `${skill.x}%`, top: `${skill.y}%`, transform: 'translate(-50%, -50%)', zIndex: 1 }}>
            <div className="skills-icon-chip">
              <Icon className="skills-chip-icon" style={{ fill: 'url(#animatedPremiumGrad)' }} />
              <span className="skills-chip-name">{skill.name}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
});

const Skills = () => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const isMobile = useIsMobile();
  const isNonDesktop = useIsMobile(1023);
  const viewRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef);
  const isPaused = !inView || (isMobile && selectedIndex !== null);

  const handleSelect = useCallback((index: number) => {
    setSelectedIndex((prev) => (prev === index ? null : index));
  }, []);
  const closeDetails = useCallback(() => setSelectedIndex(null), []);

  const isRightSide = selectedIndex !== null ? SKILLS_DATA[selectedIndex].side === 'right' : false;
  const canvasShift = selectedIndex === null ? '0vw'
    : isMobile ? (isRightSide ? '-100vw' : '100vw')
    : (isRightSide ? '-25vw' : '25vw');
  const paneLeft = isMobile ? '0%' : (isRightSide ? '50%' : '0%');
  const slideFrom = isMobile ? (isRightSide ? '100vw' : '-100vw') : (isRightSide ? '50vw' : '-50vw');
  const overlayShift = selectedIndex === null ? '0vw' : (isRightSide ? '-25vw' : '25vw');

  return (
    <section id="skills" className="skills-section" ref={sectionRef}>
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <linearGradient id="animatedPremiumGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff"><animate attributeName="stop-color" values="#ffffff;#7A7A8C;#ffffff" dur="4s" repeatCount="indefinite" /></stop>
            <stop offset="100%" stopColor="#7A7A8C"><animate attributeName="stop-color" values="#7A7A8C;#ffffff;#7A7A8C" dur="4s" repeatCount="indefinite" /></stop>
          </linearGradient>
        </defs>
      </svg>

      <motion.div animate={{ x: overlayShift }} transition={{ type: 'spring', damping: 25, stiffness: 120 }} className="skills-glass-overlay" />

      <AnimatePresence mode="wait">
        {selectedIndex !== null && (
          <motion.div
            key={isRightSide ? 'right-pane' : 'left-pane'}
            initial={{ opacity: 0, x: slideFrom }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: slideFrom }}
            transition={{ type: 'spring', damping: 25, stiffness: 120 }}
            className="skills-details-pane"
            style={{ left: paneLeft }}
          >
            <div className="skills-details-header">
              <motion.button onClick={closeDetails} className="framer-button skills-back-button" aria-label="Back to skills overview">
                ← back to matrix
              </motion.button>
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={selectedIndex} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.2 }}>
                <div className="skills-hybrid-layout">
                  <div className="skills-editorial-header">
                    <h2 className="skills-editorial-title silver-glow-text">{SKILLS_DATA[selectedIndex].category.toUpperCase()}</h2>
                    {SKILLS_DATA[selectedIndex].desc && <p className="skills-editorial-desc">{SKILLS_DATA[selectedIndex].desc}</p>}
                  </div>
                  <ConstellationGraph skills={SKILLS_DATA[selectedIndex].skills} isMobile={isMobile} active={inView} />
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div animate={{ x: canvasShift }} transition={{ type: 'spring', damping: 25, stiffness: 120 }} className="skills-canvas-wrapper">
        <div className="skills-canvas-view" ref={viewRef} style={{ touchAction: isMobile ? 'pan-y' : 'none' }}>
          <Canvas
            gl={{ antialias: false, powerPreference: 'high-performance' }}
            dpr={Math.min(window.devicePixelRatio || 1, 2)}
            style={{ width: '100%', height: '100%' }}
          >
            <PerspectiveCamera makeDefault position={[0, 0, 5.5]} fov={45} />
            {selectedIndex === null && !isMobile && (
              <OrbitControls enableZoom={false} enablePan={false} enableDamping dampingFactor={0.05} rotateSpeed={0.5} />
            )}
            <group scale={isMobile ? 0.5 : isNonDesktop ? 0.65 : 1}>
              <ParticleSphere
                count={isMobile ? 140 : 300}
                radius={0.5}
                onSelect={handleSelect}
                portalRef={viewRef}
                isPaused={isPaused}
                isMobile={isMobile}
              />
            </group>
          </Canvas>
        </div>
      </motion.div>
    </section>
  );
};

export default Skills;
