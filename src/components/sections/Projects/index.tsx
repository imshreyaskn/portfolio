import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { View, PerspectiveCamera } from '@react-three/drei';
import { useIsMobile } from '../../../hooks/useIsMobile';
import Saturn from './Saturn';
import ProjectNodes from './ProjectNodes';
import { generateParticles } from './data';
import './Projects.css';

const Projects = () => {
  const [hoveredPlanet, setHoveredPlanet] = useState<string | null>(null);
  const particles = useMemo(() => generateParticles(), []);
  const isMobile = useIsMobile();

  // Toggle for mobile tap — tapping the same planet again dismisses the label
  const handlePlanetTap = (name: string) => {
    setHoveredPlanet(prev => prev === name ? null : name);
  };

  return (
    <section id="projects" className="projects-section">
      {/* 3D Canvas */}
      <div className="projects-canvas-wrapper">
        <View className="projects-canvas-view">
          <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={45} />
          <group position={[0, 1.5, 0]}>
            <Saturn />
          </group>
        </View>
      </div>

      {/* 2D Hanging Threads Overlay */}
      <div className="projects-overlay-container projects-threads-overlay">
        <div className="hanging-thread" style={{ left: '0%',  height: '70%' }} />
        <div className="hanging-thread" style={{ left: '17%', height: '85%' }} />
        <div className="hanging-thread" style={{ left: '33%', height: '65%' }} />
        <div className="hanging-thread" style={{ left: '50%', height: '95%' }} />
        <div className="hanging-thread" style={{ left: '67%', height: '80%' }} />
        <div className="hanging-thread" style={{ left: '83%', height: '75%' }} />
        <div className="hanging-thread" style={{ left: '100%', height: '85%' }} />

        <div className="projects-swarm-mask">
          {particles.map((p, i) => (
            <div
              key={i}
              className="thread-particle"
              style={{
                left: p.left,
                top: p.top,
                animation: `${p.direction === 1 ? 'swarmDown' : 'swarmUp'} ${p.speed} linear ${p.animDelay} infinite`
              }}
            />
          ))}
        </div>
      </div>

      {/* 2D Line-Art Planets */}
      <div className="projects-overlay-container projects-nodes-overlay">
        <ProjectNodes
          setHoveredPlanet={setHoveredPlanet}
          onTapPlanet={handlePlanetTap}
        />
      </div>

      {/* Planet label HUD
          Desktop: slides in from the left at vertical center
          Mobile:  simple fade in at bottom-center (CSS positions it, we only animate opacity) */}
      <AnimatePresence>
        {hoveredPlanet && (
          <motion.div
            key={hoveredPlanet}
            initial={isMobile ? { opacity: 0 } : { opacity: 0, x: -20, y: '-50%' }}
            animate={isMobile ? { opacity: 1 } : { opacity: 1, x: 0,   y: '-50%' }}
            exit={isMobile   ? { opacity: 0 } : { opacity: 0, x: -20, y: '-50%' }}
            transition={{ duration: 0.25 }}
            className="projects-hover-label"
          >
            {hoveredPlanet}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default Projects;
