import React, { useRef, useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '../../hooks/useIsMobile';
import './OrbNavbar.css';

export interface NavNode {
  id: string;
  label: string;
  angleOffset: number;
}

// ─── Shared: generate a valid triad layout ───────────────────────────────
const generateTriad = (currentTriadRef: React.MutableRefObject<{x: number, y: number}[]>) => {
  const minDist = 25;
  let p0 = { x: 0, y: 0 }, p1 = { x: 0, y: 0 }, p2 = { x: 0, y: 0 };
  let valid = false;
  let attempts = 0;
  const dist = (a: { x: number; y: number }, b: { x: number; y: number }) =>
    Math.hypot(a.x - b.x, a.y - b.y);

  while (!valid && attempts < 50) {
    p0 = { x: Math.random() * 30,      y: Math.random() * 20 - 5  };
    p1 = { x: Math.random() * 20 - 5,  y: Math.random() * 30 + 20 };
    p2 = { x: Math.random() * 30 + 25, y: Math.random() * 20 + 10 };
    if (dist(p0, p1) > minDist && dist(p1, p2) > minDist && dist(p0, p2) > minDist) valid = true;
    attempts++;
  }
  if (!valid) { p0 = { x: 0, y: 0 }; p1 = { x: -10, y: 30 }; p2 = { x: 30, y: 20 }; }
  currentTriadRef.current = [p0, p1, p2];
};

const OrbNavbar = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const isHoveredRef = useRef(false);
  const isMobileRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    isMobileRef.current = isMobile;
  }, [isMobile]);

  // Track the active section via IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Find the most visible section
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.3 } // 30% visibility is enough
    );

    const observedElements = new Set<Element>();
    
    let interval: NodeJS.Timeout;
    const checkAndObserve = () => {
      const sectionIds = ['home', 'skills', 'experience', 'projects', 'footer'];
      let allFound = true;
      sectionIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          if (!observedElements.has(el)) {
            observer.observe(el);
            observedElements.add(el);
          }
        } else {
          allFound = false;
        }
      });
      if (allFound) {
        clearInterval(interval);
      }
    };
    
    checkAndObserve();
    interval = setInterval(checkAndObserve, 1000);

    return () => {
      clearInterval(interval);
      observer.disconnect();
    };
  }, []);

  const nodesData: NavNode[] = useMemo(() => [
    { id: 'experience', label: 'work',     angleOffset: 0 },
    { id: 'projects',   label: 'projects', angleOffset: Math.PI * 2 / 3 },
    { id: 'skills',     label: 'skills',   angleOffset: Math.PI * 4 / 3 }
  ], []);

  const currentTriadRef = useRef([
    { x: 10, y: -10 },
    { x: -5, y: 25 },
    { x: 30, y: 15 }
  ]);

  const orbRefs = useRef<(HTMLDivElement | null)[]>([]);
  const svgLinesRef = useRef<SVGPathElement>(null);
  const animationRef = useRef<number | null>(null);

  const timeRef = useRef(0);
  const targetRotation = useRef({ x: 0, y: 0 });
  const currentRotation = useRef({ x: 0, y: 0 });
  const lastTransforms = useRef<string[]>([]);
  const lastOpacities = useRef<string[]>([]);
  const lastZIndexes = useRef<string[]>([]);

  const R = 10;
  const FL = 250;
  const stateInterpolation = useRef(0);



  // ─── 60fps render loop (DOM mutations, no React re-renders) ──────────────
  useEffect(() => {
    const renderLoop = () => {
      timeRef.current += 0.015;

      const targetState = isHoveredRef.current ? 1 : 0;
      stateInterpolation.current += (targetState - stateInterpolation.current) * 0.1;

      currentRotation.current.x += (targetRotation.current.x - currentRotation.current.x) * 0.05;
      currentRotation.current.y += (targetRotation.current.y - currentRotation.current.y) * 0.05;

      const projectedNodes = nodesData.map((node, i) => {
        const angle = timeRef.current + node.angleOffset;

        let x = Math.cos(angle) * R;
        let y = Math.sin(timeRef.current * 0.5 + node.angleOffset) * (R * 0.5);
        let z = Math.sin(angle) * R;

        const tX = timeRef.current * 0.3;
        const tY = timeRef.current * 0.4;

        let x1 = x, y1 = y * Math.cos(tX) - z * Math.sin(tX), z1 = y * Math.sin(tX) + z * Math.cos(tX);
        let x2 = x1 * Math.cos(tY) + z1 * Math.sin(tY), y2 = y1, z2 = -x1 * Math.sin(tY) + z1 * Math.cos(tY);

        const mX = currentRotation.current.x;
        const mY = currentRotation.current.y;
        let finalX = x2 * Math.cos(mX) + z2 * Math.sin(mX);
        let finalY = y2 * Math.cos(mY) - z2 * Math.sin(mY);
        let finalZ = -x2 * Math.sin(mX) + z2 * Math.cos(mX);

        const scale3D = FL / (FL - finalZ);
        const projX_3D = finalX * scale3D;
        const projY_3D = finalY * scale3D;
        const opacity3D = Math.max(0.2, Math.min(1, scale3D - 0.5));

        const triadX = currentTriadRef.current[i].x;
        const triadY = currentTriadRef.current[i].y;

        const t = stateInterpolation.current;
        const currentX = projX_3D + (triadX - projX_3D) * t;
        const currentY = projY_3D + (triadY - projY_3D) * t;
        const currentScale = scale3D + (1 - scale3D) * t;
        const currentOpacity = opacity3D + (1 - opacity3D) * t;

        if (orbRefs.current[i]) {
          const newTransform = `translate(-50%, -50%) translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0) scale(${currentScale.toFixed(2)})`;
          const newOpacity = currentOpacity.toFixed(2);
          const newZIndex = Math.round(currentScale * 100).toString();

          if (lastTransforms.current[i] !== newTransform) {
            orbRefs.current[i]!.style.transform = newTransform;
            lastTransforms.current[i] = newTransform;
          }
          if (lastOpacities.current[i] !== newOpacity) {
            orbRefs.current[i]!.style.opacity = newOpacity;
            lastOpacities.current[i] = newOpacity;
          }
          if (lastZIndexes.current[i] !== newZIndex) {
            orbRefs.current[i]!.style.zIndex = newZIndex;
            lastZIndexes.current[i] = newZIndex;
          }
        }

        return { x: currentX, y: currentY };
      });

      if (svgLinesRef.current) {
        const d = `M ${projectedNodes[0].x} ${projectedNodes[0].y}
                   L ${projectedNodes[1].x} ${projectedNodes[1].y}
                   L ${projectedNodes[2].x} ${projectedNodes[2].y} Z`;
        svgLinesRef.current.setAttribute('d', d);
        svgLinesRef.current.style.stroke = `rgba(255, 255, 255, ${0.4 - stateInterpolation.current * 0.2})`;
      }

      animationRef.current = requestAnimationFrame(renderLoop);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
      } else {
        animationRef.current = requestAnimationFrame(renderLoop);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    animationRef.current = requestAnimationFrame(renderLoop);
    
    return () => { 
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (animationRef.current) cancelAnimationFrame(animationRef.current); 
    };
  }, [nodesData]);

  // ─── Desktop mouse handlers ───────────────────────────────────────────────
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current || isHovered || isMobileRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    targetRotation.current = { x: (y / rect.height) * 0.5, y: (x / rect.width) * 0.5 };
  };

  const handleMouseLeave = () => {
    if (isMobileRef.current) return;
    targetRotation.current = { x: 0, y: 0 };
    isHoveredRef.current = false;
    setIsHovered(false);
  };

  const handleMouseEnter = () => {
    if (isMobileRef.current) return;
    generateTriad(currentTriadRef);
    isHoveredRef.current = true;
    setIsHovered(true);
  };

  // ─── Mobile tap handler ───────────────────────────────────────────────────
  const handleContainerClick = () => {
    if (!isMobileRef.current) return;
    if (isHoveredRef.current) {
      targetRotation.current = { x: 0, y: 0 };
      isHoveredRef.current = false;
      setIsHovered(false);
    } else {
      generateTriad(currentTriadRef);
      isHoveredRef.current = true;
      setIsHovered(true);
    }
  };

  // Called by Orb when its link is tapped (mobile only — collapses nav after scroll)
  const handleOrbClick = () => {
    if (!isMobileRef.current) return;
    targetRotation.current = { x: 0, y: 0 };
    isHoveredRef.current = false;
    setIsHovered(false);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleContainerClick}
      className="orb-navbar-container"
    >
      <div className="orb-navbar-system">
        <svg className="orb-navbar-svg">
          <g transform="translate(100, 100)">
            <path
              ref={svgLinesRef}
              fill="none"
              stroke="rgba(255, 255, 255, 0.4)"
              strokeWidth="0.8"
              strokeLinejoin="round"
            />
          </g>
        </svg>

        {nodesData.map((node, i) => (
          <Orb
            key={node.id}
            node={node}
            ref={el => { orbRefs.current[i] = el; }}
            isExpanded={isHovered}
            isMobile={isMobile}
            onOrbClick={handleOrbClick}
          />
        ))}
      </div>

      {/* Active Section Label */}
      <AnimatePresence>
        {activeSection && activeSection !== 'home' && activeSection !== 'footer' && !isHovered && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="orb-active-section-label"
          >
            {activeSection === 'experience' ? 'work' : activeSection}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Left Context Tooltip */}
      <div style={{ position: 'fixed', left: '2vw', bottom: '2vw', zIndex: 90, pointerEvents: 'none' }}>
        <AnimatePresence mode="wait">
          {activeSection && (
            <motion.div
              key={activeSection === 'footer' ? 'projects' : activeSection}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.3 }}
              className="section-tooltip"
            >
              <span style={{ fontSize: '14px', opacity: 0.8 }}>✦</span>
              <span>
                {activeSection === 'home' && "Hover top right orb to navigate"}
                {activeSection === 'skills' && "Drag and spin the particle sphere to explore"}
                {activeSection === 'experience' && "Scroll to explore timeline"}
                {(activeSection === 'projects' || activeSection === 'footer') && "Drag to orbit Saturn and click planets to explore projects"}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// ─── Orb sub-component ────────────────────────────────────────────────────────
const Orb = React.forwardRef<
  HTMLDivElement,
  { node: NavNode; isExpanded: boolean; isMobile: boolean; onOrbClick: () => void }
>(({ node, isExpanded, isMobile, onOrbClick }, ref) => {
  const [isOrbHovered, setIsOrbHovered] = useState(false);

  // Desktop: label on orb hover. Mobile: label always when nav is expanded.
  const showLabel = isExpanded && (isMobile || isOrbHovered);

  return (
    <div
      ref={ref}
      onMouseEnter={() => { if (!isMobile) setIsOrbHovered(true); }}
      onMouseLeave={() => { if (!isMobile) setIsOrbHovered(false); }}
      className="orb-node-container"
    >
      {/* Invisible hit area — only active when expanded */}
      <a
        href={`#${node.id}`}
        className={`orb-hit-area ${isExpanded ? 'expanded' : 'collapsed'}`}
        onClick={(e) => { 
          e.stopPropagation(); 
          onOrbClick(); 
          
          // Force manual scroll for Mac Chrome / Safari compatibility
          const target = document.getElementById(node.id);
          if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
          }
        }}
      />

      {/* Glowing dot */}
      <div className={`orb-glow-dot ${isExpanded && isOrbHovered ? 'hovered' : ''}`} />

      {/* Label */}
      <AnimatePresence>
        {showLabel && (
          <motion.div
            initial={{ opacity: 0, x: 10, y: -10 }}
            animate={{ opacity: 1, x: 20, y: -10 }}
            exit={{ opacity: 0, x: 10, y: -10 }}
            transition={{ duration: 0.2 }}
            className="orb-label"
          >
            {node.label}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
Orb.displayName = 'Orb';

export default OrbNavbar;
