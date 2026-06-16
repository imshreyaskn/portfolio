import { motion } from 'framer-motion';
import { useId } from 'react';
import { useIsMobile } from '../../../hooks/useIsMobile';

// ─── Planet SVG shapes ────────────────────────────────────────────────────────

const PlanetGasGiant = () => {
  const clipId = useId();
  return (
    <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }} aria-hidden="true">
      <circle cx="50" cy="50" r="48" fill="#000000" stroke="white" strokeWidth="2.5" />
      <clipPath id={clipId}>
        <circle cx="50" cy="50" r="48" />
      </clipPath>
      <g clipPath={`url(#${clipId})`}>
        <path d="M -10 30 Q 50 50 110 30" fill="transparent" stroke="white" strokeWidth="2" />
        <path d="M -10 50 Q 50 70 110 50" fill="transparent" stroke="white" strokeWidth="2" />
        <path d="M -10 70 Q 50 90 110 70" fill="transparent" stroke="white" strokeWidth="2" />
        <path d="M -10 10 Q 50 30 110 10" fill="transparent" stroke="white" strokeWidth="2" />
      </g>
    </svg>
  );
};

const PlanetRinged = () => (
  <svg viewBox="-20 -20 140 140" style={{ width: '100%', height: '100%', transform: 'rotate(-15deg)' }} aria-hidden="true">
    <path d="M -15 50 A 65 15 0 0 1 115 50" fill="transparent" stroke="white" strokeWidth="2.5" />
    <circle cx="50" cy="50" r="32" fill="#000000" stroke="white" strokeWidth="2.5" />
    <path d="M -15 50 A 65 15 0 0 0 115 50" fill="transparent" stroke="white" strokeWidth="2.5" />
  </svg>
);

const PlanetEarthLike = () => {
  const clipId = useId();
  return (
    <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }} aria-hidden="true">
      <circle cx="50" cy="50" r="48" fill="#000000" stroke="white" strokeWidth="2.5" />
      <clipPath id={clipId}>
        <circle cx="50" cy="50" r="48" />
      </clipPath>
      <g clipPath={`url(#${clipId})`}>
        <path d="M 5 25 C 15 5, 45 0, 55 20 C 65 40, 85 25, 95 35 C 105 45, 80 55, 60 45 C 40 35, 25 50, 5 45 Z" fill="transparent" stroke="white" strokeWidth="2" />
        <path d="M 25 20 Q 40 30 50 15" fill="transparent" stroke="white" strokeWidth="1.5" />
        <path d="M 15 70 C 35 55, 55 80, 75 65 C 95 50, 100 85, 85 105 C 70 125, 25 95, 10 90 Z" fill="transparent" stroke="white" strokeWidth="2" />
        <path d="M 35 75 Q 60 70 70 85" fill="transparent" stroke="white" strokeWidth="1.5" />
        <path d="M 45 95 Q 55 85 75 95" fill="transparent" stroke="white" strokeWidth="1.5" />
      </g>
    </svg>
  );
};

const PlanetCratered = () => {
  const clipId = useId();
  return (
    <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }} aria-hidden="true">
      <circle cx="50" cy="50" r="48" fill="#000000" stroke="white" strokeWidth="2.5" />
      <clipPath id={clipId}>
        <circle cx="50" cy="50" r="48" />
      </clipPath>
      <g clipPath={`url(#${clipId})`}>
        <circle cx="35" cy="35" r="15" fill="transparent" stroke="white" strokeWidth="2" />
        <path d="M 23 35 A 12 12 0 0 0 47 35" fill="transparent" stroke="white" strokeWidth="1.5" />
        <circle cx="70" cy="65" r="22" fill="transparent" stroke="white" strokeWidth="2" />
        <path d="M 52 65 A 18 18 0 0 0 88 65" fill="transparent" stroke="white" strokeWidth="1.5" />
        <circle cx="65" cy="55" r="4" fill="transparent" stroke="white" strokeWidth="1.5" />
        <circle cx="25" cy="75" r="9" fill="transparent" stroke="white" strokeWidth="2" />
        <path d="M 18 75 A 7 7 0 0 0 32 75" fill="transparent" stroke="white" strokeWidth="1.5" />
      </g>
      <circle cx="85" cy="15" r="6" fill="#000000" stroke="white" strokeWidth="1.5" />
    </svg>
  );
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface ProjectNodesProps {
  setHoveredPlanet: (p: string | null) => void;
  onTapPlanet: (name: string) => void;
}

// ─── Shared hit-area wrapper ──────────────────────────────────────────────────
// The visual SVG is centered inside a transparent container that is always at
// least 48×48 px so touch targets meet Apple HIG & Google Material minimums.

interface PlanetHitAreaProps {
  children: React.ReactNode;
  visualSize: string;
  posStyle: React.CSSProperties;
  name: string;
  isMobile: boolean;
  setHoveredPlanet: (p: string | null) => void;
  onTapPlanet: (name: string) => void;
  href: string;
  hoverAnim?: object;
  tapAnim?: object;
}

const PlanetHitArea = ({
  children,
  visualSize,
  posStyle,
  name,
  isMobile,
  setHoveredPlanet,
  onTapPlanet,
  href,
  hoverAnim,
  tapAnim,
}: PlanetHitAreaProps) => {
  const HIT_PX = 48;

  const handleClick = () => {
    if (isMobile) {
      onTapPlanet(name);
    } else {
      window.open(href, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <motion.div
      onHoverStart={() => !isMobile && setHoveredPlanet(name)}
      onHoverEnd={() => !isMobile && setHoveredPlanet(null)}
      whileHover={!isMobile ? hoverAnim : undefined}
      whileTap={tapAnim}
      onClick={handleClick}
      style={{
        pointerEvents: 'auto',
        position: 'absolute',
        // Transparent hit area — at least 48 px on all sides
        width: `max(${visualSize}, ${HIT_PX}px)`,
        height: `max(${visualSize}, ${HIT_PX}px)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        // Eliminate 300 ms tap delay; don't block page scroll
        touchAction: 'manipulation',
        zIndex: 10,
        ...posStyle,
      }}
    >
      {/* Visual planet — exact size, centered in the hit area */}
      <div style={{ width: visualSize, height: visualSize, flexShrink: 0 }}>
        {children}
      </div>
    </motion.div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const ProjectNodes = ({ setHoveredPlanet, onTapPlanet }: ProjectNodesProps) => {
  const isMobile = useIsMobile();

  // Visual sizes — clamp ensures ≥ 28 px visible on any phone
  // (old: 2.5 vh ≈ 16 px on a 667 px phone; old large: 4.8 vh ≈ 32 px)
  const sm = 'clamp(28px, 3.5vh, 42px)';
  const lg = 'clamp(44px, 6vh, 62px)';

  return (
    <>
      {/* 1. Gas Giant — Lucy */}
      <PlanetHitArea
        name="Lucy" visualSize={sm} isMobile={isMobile}
        setHoveredPlanet={setHoveredPlanet} onTapPlanet={onTapPlanet}
        href="https://github.com/imshreyaskn/Lucy"
        hoverAnim={{ scale: 1.15, rotate: 5 }} tapAnim={{ scale: 0.95 }}
        posStyle={{ top: '20%', left: '0%', x: '-50%', y: '-50%' } as React.CSSProperties}
      >
        <PlanetGasGiant />
      </PlanetHitArea>

      {/* 2. Cratered — Alethia */}
      <PlanetHitArea
        name="Alethia" visualSize={sm} isMobile={isMobile}
        setHoveredPlanet={setHoveredPlanet} onTapPlanet={onTapPlanet}
        href="https://github.com/imshreyaskn/Alethia"
        hoverAnim={{ scale: 1.15, rotate: 5 }} tapAnim={{ scale: 0.95 }}
        posStyle={{ top: '30%', left: '67%', x: '-50%', y: '-50%' } as React.CSSProperties}
      >
        <PlanetCratered />
      </PlanetHitArea>

      {/* 3. Ringed — Valerie (largest, already comfortably tappable) */}
      <PlanetHitArea
        name="Valerie" visualSize={lg} isMobile={isMobile}
        setHoveredPlanet={setHoveredPlanet} onTapPlanet={onTapPlanet}
        href="https://github.com/imshreyaskn/Valerie"
        hoverAnim={{ scale: 1.15, rotate: -5 }} tapAnim={{ scale: 0.95 }}
        posStyle={{ top: '50%', left: '33%', x: '-50%', y: '-50%' } as React.CSSProperties}
      >
        <PlanetRinged />
      </PlanetHitArea>

      {/* 4. Earth-like — Relay */}
      <PlanetHitArea
        name="Relay" visualSize={sm} isMobile={isMobile}
        setHoveredPlanet={setHoveredPlanet} onTapPlanet={onTapPlanet}
        href="https://github.com/imshreyaskn/Relay"
        hoverAnim={{ scale: 1.15, rotate: -5 }} tapAnim={{ scale: 0.95 }}
        posStyle={{ top: '60%', left: '100%', x: '-50%', y: '-50%' } as React.CSSProperties}
      >
        <PlanetEarthLike />
      </PlanetHitArea>
    </>
  );
};

export default ProjectNodes;
