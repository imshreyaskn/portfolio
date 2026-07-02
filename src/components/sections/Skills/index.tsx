import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { OrbitControls, View, PerspectiveCamera } from '@react-three/drei';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { SKILLS_DATA, SkillItem } from './data';
import ParticleSphere from './ParticleSphere';
import { useIsMobile } from '../../../hooks/useIsMobile';
import './Skills.css';

const ConstellationGraph = ({ skills, isMobile }: { skills: SkillItem[]; isMobile: boolean }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pathsRef = useRef<(SVGPathElement | null)[]>([]);
  const chipsRef = useRef<(HTMLDivElement | null)[]>([]);

  // Compute initial edges based on distance
  const edges = useMemo(() => {
    const arr: [number, number][] = [];
    for (let i = 0; i < skills.length; i++) {
      for (let j = i + 1; j < skills.length; j++) {
        const dx = skills[i].x - skills[j].x;
        const dy = skills[i].y - skills[j].y;
        if (Math.sqrt(dx * dx + dy * dy) < 60) arr.push([i, j]);
      }
    }
    return arr;
  }, [skills]);


  const isInView = useInView(containerRef, { margin: "200px" });

  useEffect(() => {
    if (!isInView) return;
    let frameId: number;
    const animate = () => {
      const time = performance.now() * 0.001;
      
      const nodes = skills.map((skill, i) => {
        const driftY = Math.sin(time * 0.4 + i * 2.5) * 2.5; // ~10px drift
        const driftX = Math.cos(time * 0.3 + i * 1.8) * 1.5; // ~6px drift
        return {
          x: skill.x + driftX,
          y: skill.y + driftY
        };
      });

      // Sync DOM Chips
      chipsRef.current.forEach((chip, i) => {
        if (chip) {
          chip.style.left = `${nodes[i].x}%`;
          chip.style.top = `${nodes[i].y}%`;
        }
      });

      // Sync SVG Paths
      edges.forEach((edge, idx) => {
        const start = nodes[edge[0]];
        const end = nodes[edge[1]];
        const pathEl = pathsRef.current[idx];
        if (pathEl) {
          pathEl.setAttribute('d', `M ${start.x} ${start.y} L ${end.x} ${end.y}`);
        }
      });

      frameId = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(frameId);
  }, [skills, edges, isInView]);

  return (
    <div
      className="skills-graph-container"
      style={{
        position: 'relative',
        width: '100%',
        height: isMobile ? 'clamp(160px, 28vh, 220px)' : 'clamp(250px, 40vh, 400px)',
        marginTop: isMobile ? '0.5rem' : '1.5rem',
        overflow: 'visible',
      }}
      ref={containerRef}
    >
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none', overflow: 'visible' }}>
        {edges.map((_, idx) => (
          <path 
            key={`web-${idx}`} 
            ref={el => pathsRef.current[idx] = el}
            fill="none" 
            stroke="url(#animatedPremiumGrad)" 
            strokeWidth="1.5"
            opacity="0.5"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      {skills.map((skill, idx) => {
        const Icon = skill.icon;
        return (
          <div 
            key={skill.name} 
            ref={el => chipsRef.current[idx] = el}
            style={{
              position: 'absolute',
              left: `${skill.x}%`,
              top: `${skill.y}%`,
              transform: 'translate(-50%, -50%)',
              zIndex: 1
            }}
          >
            <div className="skills-icon-chip">
              <Icon className="skills-chip-icon" style={{ fill: 'url(#animatedPremiumGrad)' }} />
              <span className="skills-chip-name">{skill.name}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const Skills = () => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const isMobile = useIsMobile();
  const isNonDesktop = useIsMobile(1023);
  const viewRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { margin: "200px" });

  const handleSelect = useCallback((index: number) => {
    setSelectedIndex((prev) => (prev === index ? null : index));
  }, []);

  const closeDetails = useCallback(() => setSelectedIndex(null), []);

  const isRightSide = selectedIndex !== null ? SKILLS_DATA[selectedIndex].side === 'right' : false;

  // Desktop: shift orb ±25vw to share screen with card.
  // Mobile:  shift orb ±100vw so it slides fully off-screen.
  const canvasShift = selectedIndex === null
    ? '0vw'
    : isMobile
      ? (isRightSide ? '-100vw' : '100vw')
      : (isRightSide ? '-25vw' : '25vw');

  // Desktop: card occupies left or right 50%.
  // Mobile:  card always starts at left:0 (full-width).
  const paneLeft = isMobile ? '0%' : (isRightSide ? '50%' : '0%');

  // Card slides in from the direction the orb exited.
  const slideFrom = isMobile
    ? (isRightSide ? '100vw' : '-100vw')
    : (isRightSide ? '50vw' : '-50vw');

  const spotlightX = selectedIndex === null ? '50%' : (isRightSide ? '25%' : '75%');

  return (
    <section
      id="skills"
      className="skills-section"
      ref={sectionRef}
    >
      {/* Global Animated Gradient for Icons */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <linearGradient id="animatedPremiumGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff">
              <animate attributeName="stop-color" values="#ffffff;#7A7A8C;#ffffff" dur="4s" repeatCount="indefinite" />
            </stop>
            <stop offset="100%" stopColor="#7A7A8C">
              <animate attributeName="stop-color" values="#7A7A8C;#ffffff;#7A7A8C" dur="4s" repeatCount="indefinite" />
            </stop>
          </linearGradient>
        </defs>
      </svg>

      {/* Frosty glassmorphism overlay with dynamic spotlight */}
      <motion.div
        animate={{
          WebkitMaskImage: `radial-gradient(circle at ${spotlightX} 50%, transparent 5%, black 45%), linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)`,
          maskImage: `radial-gradient(circle at ${spotlightX} 50%, transparent 5%, black 45%), linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)`
        } as any}
        transition={{ type: 'spring', damping: 25, stiffness: 120 }}
        className="skills-glass-overlay"
      />

      {/* Details pane */}
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
            <div style={{ marginBottom: '2rem' }}>
              <motion.button
                onClick={closeDetails}
                className="framer-button skills-back-button"
              >
                ← back to matrix
              </motion.button>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={selectedIndex}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
              >
                <div className="skills-hybrid-layout">
                  <div className="skills-editorial-header">
                    <h2 className="skills-editorial-title silver-glow-text">
                      {SKILLS_DATA[selectedIndex].category.toUpperCase()}
                    </h2>
                    {SKILLS_DATA[selectedIndex].desc && (
                      <p className="skills-editorial-desc">
                        {SKILLS_DATA[selectedIndex].desc}
                      </p>
                    )}
                  </div>

                  <ConstellationGraph skills={SKILLS_DATA[selectedIndex].skills} isMobile={isMobile} />
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* R3F canvas wrapper — shifts opposite direction to the card */}
      <motion.div
        animate={{ x: canvasShift }}
        transition={{ type: 'spring', damping: 25, stiffness: 120 }}
        className="skills-canvas-wrapper"
      >
        <View className="skills-canvas-view" ref={viewRef} style={{ touchAction: isMobile ? 'pan-y' : 'none' }}>
          <PerspectiveCamera makeDefault position={[0, 0, 5.5]} fov={45} />
          {/* OrbitControls disabled on mobile to prevent scroll conflicts */}
          {selectedIndex === null && !isMobile && (
            <OrbitControls
              enableZoom={false}
              enablePan={false}
              enableDamping={true}
              dampingFactor={0.05}
              rotateSpeed={0.5}
            />
          )}
          <group scale={isMobile ? 0.5 : (isNonDesktop ? 0.65 : 1)}>
            <ParticleSphere count={300} radius={0.5} onSelect={handleSelect} portalRef={viewRef} isActive={isInView} />
          </group>
        </View>
      </motion.div>
    </section>
  );
};

export default Skills;
