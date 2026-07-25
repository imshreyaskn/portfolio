// OrbNavbar.tsx — 3D-projected orb navigation.
// The RAF loop is a pure function of elapsed time (deterministic across
// browsers/refresh rates) and writes to the DOM only (no layout reads).
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAnimationFrame, dampFactor } from '../../hooks/useAnimationFrame';
import { useCanHover } from '../../hooks/useMediaQuery';
import { useSystemScale } from '../../hooks/useSystemScale';
import { useActiveSection } from '../../hooks/useActiveSection';
import tooltipStar from '../../assets/tooltip-star.png';
import './OrbNavbar.css';

export interface NavNode {
  id: string;
  label: string;
  angleOffset: number;
}

interface TriadPoint {
  x: number;
  y: number;
}

/* ─── Tuning constants (documented against the original 60fps values) ─── */
const ORBIT_RADIUS = 10;          // original R
const FOCAL_LENGTH = 250;         // original FL
// Original advanced 0.015 per 60fps frame = 0.9 per second.
const TIME_RATE = 0.9;
// Original per-frame damping at 60fps (state: *0.1 → retain 0.9; rotation: *0.05 → retain 0.95).
const STATE_RETENTION = 0.9;
const ROTATION_RETENTION = 0.95;
const TRIAD_MIN_DIST = 25;

/* ─── Triad layout (pure — returns a new formation) ─── */
const generateTriad = (): TriadPoint[] => {
  const dist = (a: TriadPoint, b: TriadPoint) => Math.hypot(a.x - b.x, a.y - b.y);
  for (let attempt = 0; attempt < 50; attempt++) {
    const p0 = { x: Math.random() * 30, y: Math.random() * 20 - 5 };
    const p1 = { x: Math.random() * 20 - 5, y: Math.random() * 30 + 20 };
    const p2 = { x: Math.random() * 30 + 25, y: Math.random() * 20 + 10 };
    if (
      dist(p0, p1) > TRIAD_MIN_DIST &&
      dist(p1, p2) > TRIAD_MIN_DIST &&
      dist(p0, p2) > TRIAD_MIN_DIST
    ) {
      return [p0, p1, p2];
    }
  }
  return [
    { x: 0, y: 0 },
    { x: -10, y: 30 },
    { x: 30, y: 20 },
  ];
};

const OrbNavbar = () => {
  const canHover = useCanHover();
  const systemScale = useSystemScale();
  const activeSection = useActiveSection();

  const [isExpanded, setIsExpanded] = useState(false);
  const isExpandedRef = useRef(false);

  const containerRef = useRef<HTMLElement>(null);
  const containerRectRef = useRef<DOMRect | null>(null);

  const nodesData: NavNode[] = useMemo(
    () => [
      { id: 'experience', label: 'work', angleOffset: 0 },
      { id: 'projects', label: 'projects', angleOffset: (Math.PI * 2) / 3 },
      { id: 'skills', label: 'skills', angleOffset: (Math.PI * 4) / 3 },
    ],
    [],
  );

  /* ─── Mutable animation state (refs — never trigger re-renders) ─── */
  const currentTriadRef = useRef<TriadPoint[]>([
    { x: 10, y: -10 },
    { x: -5, y: 25 },
    { x: 30, y: 15 },
  ]);
  const orbRefs = useRef<(HTMLDivElement | null)[]>([]);
  const svgLinesRef = useRef<SVGPathElement>(null);
  const timeRef = useRef(0);
  const targetRotation = useRef({ x: 0, y: 0 });
  const currentRotation = useRef({ x: 0, y: 0 });
  const stateInterpolation = useRef(0);

  /* ─── Write-dedup caches (skip no-op DOM writes) ─── */
  const lastTransforms = useRef<string[]>([]);
  const lastOpacities = useRef<string[]>([]);
  const lastZIndexes = useRef<string[]>([]);
  const lastPathD = useRef('');
  const lastStrokeOpacity = useRef('');

  /* ─── Cache the container rect on resize (fixed-position → stable across
         scroll). mousemove reads this instead of forcing layout. ─── */
  useEffect(() => {
    const updateRect = () => {
      if (containerRef.current) {
        containerRectRef.current = containerRef.current.getBoundingClientRect();
      }
    };
    updateRect();
    let rafId = 0;
    const onResize = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateRect);
    };
    window.addEventListener('resize', onResize, { passive: true });
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  /* ─── The 60fps loop: write-only, time-based, deterministic ─── */
  const tick = useCallback(
    (delta: number) => {
      timeRef.current += delta * TIME_RATE;
      const t = timeRef.current;

      // Frame-rate-independent interpolation (exact at any refresh rate).
      const stateK = dampFactor(STATE_RETENTION, delta);
      const targetState = isExpandedRef.current ? 1 : 0;
      stateInterpolation.current += (targetState - stateInterpolation.current) * stateK;

      const rotK = dampFactor(ROTATION_RETENTION, delta);
      currentRotation.current.x += (targetRotation.current.x - currentRotation.current.x) * rotK;
      currentRotation.current.y += (targetRotation.current.y - currentRotation.current.y) * rotK;

      // Cache per-frame trig ONCE (was recomputed per node, 3×).
      const tX = t * 0.3;
      const tY = t * 0.4;
      const cosTX = Math.cos(tX), sinTX = Math.sin(tX);
      const cosTY = Math.cos(tY), sinTY = Math.sin(tY);
      const mX = currentRotation.current.x;
      const mY = currentRotation.current.y;
      const cosMX = Math.cos(mX), sinMX = Math.sin(mX);
      const cosMY = Math.cos(mY), sinMY = Math.sin(mY);

      const interp = stateInterpolation.current;
      const triad = currentTriadRef.current;
      const projected: TriadPoint[] = [];

      for (let i = 0; i < nodesData.length; i++) {
        const node = nodesData[i];
        const angle = t + node.angleOffset;
        const x = Math.cos(angle) * ORBIT_RADIUS;
        const y = Math.sin(t * 0.5 + node.angleOffset) * (ORBIT_RADIUS * 0.5);
        const z = Math.sin(angle) * ORBIT_RADIUS;

        // Tumble rotations (preserved exactly from the original).
        const y1 = y * cosTX - z * sinTX;
        const z1 = y * sinTX + z * cosTX;
        const x2 = x * cosTY + z1 * sinTY;
        const z2 = -x * sinTY + z1 * cosTY; 

        const finalX = x2 * cosMX + z2 * sinMX;
        const finalY = y1 * cosMY - z2 * sinMY;
        const finalZ = -x2 * sinMX + z2 * cosMX;

        const scale3D = FOCAL_LENGTH / (FOCAL_LENGTH - finalZ);
        const projX = finalX * scale3D;
        const projY = finalY * scale3D;
        const opacity3D = Math.max(0.2, Math.min(1, scale3D - 0.5));

        const curX = projX + (triad[i].x - projX) * interp;
        const curY = projY + (triad[i].y - projY) * interp;
        const curScale = scale3D + (1 - scale3D) * interp;
        const curOpacity = opacity3D + (1 - opacity3D) * interp;
        projected.push({ x: curX, y: curY });

        const el = orbRefs.current[i];
        if (!el) continue;

        const transform = `translate(-50%, -50%) translate3d(${curX.toFixed(2)}px, ${curY.toFixed(2)}px, 0) scale(${curScale.toFixed(2)})`;
        const opacity = curOpacity.toFixed(2);
        const zIndex = String(Math.round(curScale * 100));

        if (lastTransforms.current[i] !== transform) {
          el.style.transform = transform;
          lastTransforms.current[i] = transform;
        }
        if (lastOpacities.current[i] !== opacity) {
          el.style.opacity = opacity;
          lastOpacities.current[i] = opacity;
        }
        if (lastZIndexes.current[i] !== zIndex) {
          el.style.zIndex = zIndex;
          lastZIndexes.current[i] = zIndex;
        }
      }

      // SVG connector — guarded writes; 0.01px precision is sub-render.
      const path = svgLinesRef.current;
      if (path) {
        const d =
          `M ${projected[0].x.toFixed(2)} ${projected[0].y.toFixed(2)} ` +
          `L ${projected[1].x.toFixed(2)} ${projected[1].y.toFixed(2)} ` +
          `L ${projected[2].x.toFixed(2)} ${projected[2].y.toFixed(2)} Z`;
        if (lastPathD.current !== d) {
          path.setAttribute('d', d);
          lastPathD.current = d;
        }
        const strokeOpacity = (0.4 - interp * 0.2).toFixed(2);
        if (lastStrokeOpacity.current !== strokeOpacity) {
          path.style.stroke = `rgba(255, 255, 255, ${strokeOpacity})`;
          lastStrokeOpacity.current = strokeOpacity;
        }
      }
    },
    [nodesData],
  );

  useAnimationFrame(tick);

  /* ─── Expansion control (single source of truth for state + ref) ─── */
  const setExpanded = useCallback((value: boolean) => {
    if (value && !isExpandedRef.current) {
      currentTriadRef.current = generateTriad();
    }
    if (!value) {
      targetRotation.current = { x: 0, y: 0 };
    }
    isExpandedRef.current = value;
    setIsExpanded(value);
  }, []);

  /* ─── Pointer handlers (hover only when the device can hover) ─── */
  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = containerRectRef.current;
    if (!rect || isExpanded || !canHover) return;
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    targetRotation.current = { x: (y / rect.height) * 0.5, y: (x / rect.width) * 0.5 };
  };

  const handleMouseEnter = () => {
    if (canHover) setExpanded(true);
  };

  const handleMouseLeave = () => {
    if (canHover) setExpanded(false);
  };

  // Touch: tap the cluster to toggle expansion.
  const handleContainerClick = () => {
    if (!canHover) setExpanded(!isExpandedRef.current);
  };

  // Touch: tapping an orb navigates, then collapses the nav.
  const handleOrbClick = () => {
    if (!canHover) setExpanded(false);
  };

  /* ─── Keyboard: focusing any orb expands the triad; leaving collapses ─── */
  const handleFocusCapture = () => setExpanded(true);
  const handleBlurCapture = (e: React.FocusEvent<HTMLElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setExpanded(false);
    }
  };

  return (
    <>
      <nav
        ref={containerRef}
        aria-label="Section navigation"
        className="orb-navbar-container"
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleContainerClick}
        onFocusCapture={handleFocusCapture}
        onBlurCapture={handleBlurCapture}
      >
        <div className="orb-navbar-system" style={{ transform: `scale(${systemScale})` }}>
          <svg className="orb-navbar-svg" aria-hidden="true">
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
              ref={(el) => {
                orbRefs.current[i] = el;
              }}
              isExpanded={isExpanded}
              canHover={canHover}
              isActive={activeSection === node.id}
              onOrbClick={handleOrbClick}
            />
          ))}
        </div>
      </nav>

      {/* Active section label — decorative duplicate of nav state */}
      <AnimatePresence>
        {activeSection && activeSection !== 'home' && activeSection !== 'footer' && !isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="orb-active-section-label"
            aria-hidden="true"
          >
            {activeSection === 'experience' ? 'work' : activeSection}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Context tooltip */}
      <div
        style={{ position: 'fixed', left: '2vw', bottom: '2vw', zIndex: 90, pointerEvents: 'none' }}
        aria-hidden="true"
      >
        <AnimatePresence mode="wait">
          {activeSection && activeSection !== 'footer' && (
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.3 }}
              className="section-tooltip"
            >
              <img src={tooltipStar} alt="" className="section-tooltip-icon" aria-hidden="true" />
              <span>
                {activeSection === 'home' &&
                  (canHover ? 'Hover top right orb to navigate' : 'Tap the orb cluster to navigate')}
                {activeSection === 'skills' &&
                  (canHover
                    ? 'Drag and spin the particle sphere to explore'
                    : 'Spin the particle sphere to explore')}
                {activeSection === 'experience' && 'Scroll to explore timeline'}
                {activeSection === 'projects' &&
                  (canHover
                    ? 'Orbit the singularity • Select planets to explore projects'
                    : 'Orbit the singularity • Tap planets to explore projects')}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

/* ─── Orb sub-component ─── */
interface OrbProps {
  node: NavNode;
  isExpanded: boolean;
  canHover: boolean;
  isActive: boolean;
  onOrbClick: () => void;
}

const Orb = React.forwardRef<HTMLDivElement, OrbProps>(
  ({ node, isExpanded, canHover, isActive, onOrbClick }, ref) => {
    const [isOrbHovered, setIsOrbHovered] = useState(false);
    // Hover devices: label on orb hover. Touch: labels always show when expanded.
    const showLabel = isExpanded && (!canHover || isOrbHovered);

    return (
      <div
        ref={ref}
        className="orb-node-container"
        onMouseEnter={() => canHover && setIsOrbHovered(true)}
        onMouseLeave={() => canHover && setIsOrbHovered(false)}
      >
        <a
          href={`#${node.id}`}
          className={`orb-hit-area ${isExpanded ? 'expanded' : 'collapsed'}`}
          aria-label={node.label}
          aria-current={isActive ? 'location' : undefined}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onOrbClick();
            document.getElementById(node.id)?.scrollIntoView({ behavior: 'smooth' });
          }}
        />
        <div className={`orb-glow-dot ${isExpanded && isOrbHovered ? 'hovered' : ''} ${isActive ? 'active-memory' : ''}`} />
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
  },
);
Orb.displayName = 'Orb';

export default OrbNavbar;
