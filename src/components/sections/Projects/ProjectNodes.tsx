// ProjectNodes.tsx — Interactive line-art planet SVGs with 48px hit areas.
import { motion } from 'framer-motion';
import { useId } from 'react';
import { PROJECT_LINKS, PROJECT_TECH_STACKS } from './data';

/* ─── Shared animation constants (stable references) ─── */
const HOVER_CW = { scale: 1.15, rotate: 5 };
const HOVER_CCW = { scale: 1.15, rotate: -5 };
const TAP = { scale: 0.95 };
const HIT_PX = 48; // WCAG 2.5.5 / Apple HIG minimum touch target

/* ─── Planet SVG shapes ─── */
const SilverGradient = ({ id }: { id: string }) => (
  <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stopColor="#FFFFFF" />
    <stop offset="35%" stopColor="#E2E8F0" />
    <stop offset="70%" stopColor="#94A3B8" />
    <stop offset="100%" stopColor="#CBD5E1" />
  </linearGradient>
);

const PlanetGasGiant = () => {
  const clipId = useId();
  const gradId = useId();
  return (
    <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }} aria-hidden="true">
      <defs><SilverGradient id={gradId} /></defs>
      <circle cx="50" cy="50" r="47" fill="#06080C" stroke={`url(#${gradId})`} strokeWidth="6" />
      <clipPath id={clipId}><circle cx="50" cy="50" r="47" /></clipPath>
      <g clipPath={`url(#${clipId})`}>
        <path d="M -10 30 Q 50 50 110 30" fill="transparent" stroke={`url(#${gradId})`} strokeWidth="4.5" />
        <path d="M -10 50 Q 50 70 110 50" fill="transparent" stroke={`url(#${gradId})`} strokeWidth="4.5" />
        <path d="M -10 70 Q 50 90 110 70" fill="transparent" stroke={`url(#${gradId})`} strokeWidth="4.5" />
        <path d="M -10 10 Q 50 30 110 10" fill="transparent" stroke={`url(#${gradId})`} strokeWidth="4.5" />
      </g>
    </svg>
  );
};

const PlanetRinged = () => {
  const gradId = useId();
  return (
    <svg viewBox="-20 -20 140 140" style={{ width: '100%', height: '100%', transform: 'rotate(-15deg)' }} aria-hidden="true">
      <defs><SilverGradient id={gradId} /></defs>
      <path d="M -15 50 A 65 15 0 0 1 115 50" fill="transparent" stroke={`url(#${gradId})`} strokeWidth="5.5" />
      <circle cx="50" cy="50" r="32" fill="#06080C" stroke={`url(#${gradId})`} strokeWidth="5.5" />
      <path d="M -15 50 A 65 15 0 0 0 115 50" fill="transparent" stroke={`url(#${gradId})`} strokeWidth="5.5" />
    </svg>
  );
};

const PlanetEarthLike = () => {
  const clipId = useId();
  const gradId = useId();
  return (
    <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }} aria-hidden="true">
      <defs><SilverGradient id={gradId} /></defs>
      <circle cx="50" cy="50" r="47" fill="#06080C" stroke={`url(#${gradId})`} strokeWidth="6" />
      <clipPath id={clipId}><circle cx="50" cy="50" r="47" /></clipPath>
      <g clipPath={`url(#${clipId})`}>
        <path d="M 5 25 C 15 5, 45 0, 55 20 C 65 40, 85 25, 95 35 C 105 45, 80 55, 60 45 C 40 35, 25 50, 5 45 Z" fill="transparent" stroke={`url(#${gradId})`} strokeWidth="4.5" />
        <path d="M 25 20 Q 40 30 50 15" fill="transparent" stroke={`url(#${gradId})`} strokeWidth="3.5" />
        <path d="M 15 70 C 35 55, 55 80, 75 65 C 95 50, 100 85, 85 105 C 70 125, 25 95, 10 90 Z" fill="transparent" stroke={`url(#${gradId})`} strokeWidth="4.5" />
        <path d="M 35 75 Q 60 70 70 85" fill="transparent" stroke={`url(#${gradId})`} strokeWidth="3.5" />
        <path d="M 45 95 Q 55 85 75 95" fill="transparent" stroke={`url(#${gradId})`} strokeWidth="3.5" />
      </g>
    </svg>
  );
};

const PlanetCratered = () => {
  const clipId = useId();
  const gradId = useId();
  return (
    <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }} aria-hidden="true">
      <defs><SilverGradient id={gradId} /></defs>
      <circle cx="50" cy="50" r="47" fill="#06080C" stroke={`url(#${gradId})`} strokeWidth="6" />
      <clipPath id={clipId}><circle cx="50" cy="50" r="47" /></clipPath>
      <g clipPath={`url(#${clipId})`}>
        <circle cx="35" cy="35" r="15" fill="transparent" stroke={`url(#${gradId})`} strokeWidth="4" />
        <path d="M 23 35 A 12 12 0 0 0 47 35" fill="transparent" stroke={`url(#${gradId})`} strokeWidth="3" />
        <circle cx="70" cy="65" r="22" fill="transparent" stroke={`url(#${gradId})`} strokeWidth="4" />
        <path d="M 52 65 A 18 18 0 0 0 88 65" fill="transparent" stroke={`url(#${gradId})`} strokeWidth="3" />
        <circle cx="65" cy="55" r="4" fill="transparent" stroke={`url(#${gradId})`} strokeWidth="3" />
        <circle cx="25" cy="75" r="9" fill="transparent" stroke={`url(#${gradId})`} strokeWidth="4" />
        <path d="M 18 75 A 7 7 0 0 0 32 75" fill="transparent" stroke={`url(#${gradId})`} strokeWidth="3" />
      </g>
      <circle cx="85" cy="15" r="6" fill="#06080C" stroke={`url(#${gradId})`} strokeWidth="3.5" />
    </svg>
  );
};

const PlanetMatrix = () => {
  const clipId = useId();
  const gradId = useId();
  return (
    <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }} aria-hidden="true">
      <defs><SilverGradient id={gradId} /></defs>
      <circle cx="50" cy="50" r="47" fill="#06080C" stroke={`url(#${gradId})`} strokeWidth="6" />
      <clipPath id={clipId}><circle cx="50" cy="50" r="47" /></clipPath>
      <g clipPath={`url(#${clipId})`}>
        {/* Equator and Prime Meridian */}
        <path d="M 0 50 L 100 50" fill="none" stroke={`url(#${gradId})`} strokeWidth="1.5" opacity="0.4" />
        <path d="M 50 0 L 50 100" fill="none" stroke={`url(#${gradId})`} strokeWidth="1.5" opacity="0.4" />
        
        {/* Latitudes (curving toward equator to create 3D spherical depth) */}
        <path d="M -10 20 Q 50 58 110 20" fill="none" stroke={`url(#${gradId})`} strokeWidth="2.5" opacity="0.75" />
        <path d="M -10 80 Q 50 42 110 80" fill="none" stroke={`url(#${gradId})`} strokeWidth="2.5" opacity="0.75" />
        
        {/* Longitudes (curving toward meridian to create 3D spherical depth) */}
        <path d="M 20 -10 Q 58 50 20 110" fill="none" stroke={`url(#${gradId})`} strokeWidth="2.5" opacity="0.75" />
        <path d="M 80 -10 Q 42 50 80 110" fill="none" stroke={`url(#${gradId})`} strokeWidth="2.5" opacity="0.75" />
        
        {/* Core firewall nexus */}
        <circle cx="50" cy="50" r="6" fill="#06080C" stroke={`url(#${gradId})`} strokeWidth="2" />
        <circle cx="50" cy="50" r="2.5" fill={`url(#${gradId})`} />
        
        {/* Intersection glowing data nodes */}
        <circle cx="31" cy="31" r="2" fill={`url(#${gradId})`} opacity="0.9" />
        <circle cx="69" cy="69" r="2" fill={`url(#${gradId})`} opacity="0.9" />
        <circle cx="69" cy="31" r="2" fill={`url(#${gradId})`} opacity="0.9" />
        <circle cx="31" cy="69" r="2" fill={`url(#${gradId})`} opacity="0.9" />
      </g>
    </svg>
  );
};

/* ─── Hit-area wrapper ─── */
interface PlanetHitAreaProps {
  name: string;
  visualSize: string;
  top: string;
  left: string;
  /** Touch-primary input → tap-to-reveal; pointer → hover + click-through to GitHub */
  isTouchPrimary: boolean;
  setHoveredPlanet: (p: string | null) => void;
  onTapPlanet: (name: string) => void;
  hoverAnim: typeof HOVER_CW;
  children: React.ReactNode;
}

const PlanetHitArea = ({
  name,
  visualSize,
  top,
  left,
  isTouchPrimary,
  setHoveredPlanet,
  onTapPlanet,
  hoverAnim,
  children,
}: PlanetHitAreaProps) => {
  const href = PROJECT_LINKS[name];

  const handleClick = () => {
    if (isTouchPrimary) {
      onTapPlanet(name);
    } else {
      window.open(href, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <motion.div
      role="button"
      className="planet-hit-area"
      aria-label={`${name} — ${PROJECT_TECH_STACKS[name]}. ${
        isTouchPrimary ? 'Tap to toggle details.' : 'Opens GitHub repository.'
      }`}
      data-hoverable="true"
      onHoverStart={() => !isTouchPrimary && setHoveredPlanet(name)}
      onHoverEnd={() => !isTouchPrimary && setHoveredPlanet(null)}
      whileHover={!isTouchPrimary ? hoverAnim : undefined}
      whileTap={TAP}
      onClick={handleClick}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      initial={{ x: "-50%", y: "-50%" }}
      style={{
        x: "-50%",
        y: "-50%",
        pointerEvents: 'auto',
        position: 'absolute',
        top,
        left,
        width: `max(${visualSize}, ${HIT_PX}px)`,
        height: `max(${visualSize}, ${HIT_PX}px)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        touchAction: 'manipulation', // no 300ms tap delay; never blocks scroll
        zIndex: 10,
      }}
    >
      {/* Visual planet — exact size, centered in the hit area.
          No permanent will-change; framer-motion promotes only while animating. */}
      <div
        style={{
          width: visualSize,
          height: visualSize,
          flexShrink: 0,
          filter: 'drop-shadow(0 0 4px rgba(226,232,240,0.4))',
        }}
      >
        {children}
      </div>
    </motion.div>
  );
};

/* ─── Main component ─── */
interface ProjectNodesProps {
  isTouchPrimary: boolean;
  setHoveredPlanet: (p: string | null) => void;
  onTapPlanet: (name: string) => void;
}

const ProjectNodes = ({ isTouchPrimary, setHoveredPlanet, onTapPlanet }: ProjectNodesProps) => {
  // clamp() guarantees a visible minimum on short viewports
  const sm = 'clamp(18px, 2.4vh, 28px)';
  const lg = 'clamp(28px, 4vh, 40px)';

  return (
    <>
      <PlanetHitArea name="Lucy" visualSize={sm} top="22%" left="18.09%"
        isTouchPrimary={isTouchPrimary} setHoveredPlanet={setHoveredPlanet}
        onTapPlanet={onTapPlanet} hoverAnim={HOVER_CW}>
        <PlanetGasGiant />
      </PlanetHitArea>

      <PlanetHitArea name="Lurien Matrix" visualSize={sm} top="34%" left="65.72%"
        isTouchPrimary={isTouchPrimary} setHoveredPlanet={setHoveredPlanet}
        onTapPlanet={onTapPlanet} hoverAnim={HOVER_CCW}>
        <PlanetMatrix />
      </PlanetHitArea>

      <PlanetHitArea name="Alethia" visualSize={sm} top="46%" left="57.36%"
        isTouchPrimary={isTouchPrimary} setHoveredPlanet={setHoveredPlanet}
        onTapPlanet={onTapPlanet} hoverAnim={HOVER_CW}>
        <PlanetCratered />
      </PlanetHitArea>

      <PlanetHitArea name="Valerie" visualSize={lg} top="58%" left="42.36%"
        isTouchPrimary={isTouchPrimary} setHoveredPlanet={setHoveredPlanet}
        onTapPlanet={onTapPlanet} hoverAnim={HOVER_CCW}>
        <PlanetRinged />
      </PlanetHitArea>

      <PlanetHitArea name="Relay" visualSize={sm} top="70%" left="72.90%"
        isTouchPrimary={isTouchPrimary} setHoveredPlanet={setHoveredPlanet}
        onTapPlanet={onTapPlanet} hoverAnim={HOVER_CCW}>
        <PlanetEarthLike />
      </PlanetHitArea>
    </>
  );
};

export default ProjectNodes;
