import { useState } from 'react';
import { motion } from 'framer-motion';
import { useId } from 'react';
import { useIsMobile } from '../../../hooks/useIsMobile';

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

interface ProjectNodesProps {
  setHoveredPlanet: (p: string | null) => void;
  onTapPlanet: (name: string) => void;
}

const ProjectNodes = ({ setHoveredPlanet, onTapPlanet }: ProjectNodesProps) => {
  const isMobile = useIsMobile();

  const hoverProps = (name: string) => isMobile
    ? {}  // No hover on mobile — use onTap instead
    : {
        onHoverStart: () => setHoveredPlanet(name),
        onHoverEnd:   () => setHoveredPlanet(null),
      };

  return (
    <>
      {/* 1. Gas Giant: "Lucy" */}
      <motion.div
        {...hoverProps('Lucy')}
        whileHover={{ scale: 1.15, rotate: 5 }}
        whileTap={{ scale: 0.95 }}
        onTap={() => isMobile && onTapPlanet('Lucy')}
        onClick={() => window.open('https://github.com/imshreyaskn/Lucy', '_blank', 'noopener,noreferrer')}
        style={{ pointerEvents: 'auto', position: 'absolute', top: '20%', left: '0%', x: '-50%', y: '-50%', width: '2.5vh', height: '2.5vh', zIndex: 10, cursor: 'pointer' }}
      >
        <PlanetGasGiant />
      </motion.div>

      {/* 2. Cratered: "Alethia" */}
      <motion.div
        {...hoverProps('Alethia')}
        whileHover={{ scale: 1.15, rotate: 5 }}
        whileTap={{ scale: 0.95 }}
        onTap={() => isMobile && onTapPlanet('Alethia')}
        onClick={() => window.open('https://github.com/imshreyaskn/Alethia', '_blank', 'noopener,noreferrer')}
        style={{ pointerEvents: 'auto', position: 'absolute', top: '30%', left: '67%', x: '-50%', y: '-50%', width: '2.5vh', height: '2.5vh', zIndex: 10, cursor: 'pointer' }}
      >
        <PlanetCratered />
      </motion.div>

      {/* 3. Ringed: "Valerie" */}
      <motion.div
        {...hoverProps('Valerie')}
        whileHover={{ scale: 1.15, rotate: -5 }}
        whileTap={{ scale: 0.95 }}
        onTap={() => isMobile && onTapPlanet('Valerie')}
        onClick={() => window.open('https://github.com/imshreyaskn/Valerie', '_blank', 'noopener,noreferrer')}
        style={{ pointerEvents: 'auto', position: 'absolute', top: '50%', left: '33%', x: '-50%', y: '-50%', width: '4.8vh', height: '4.8vh', zIndex: 10, cursor: 'pointer' }}
      >
        <PlanetRinged />
      </motion.div>

      {/* 4. Earth-like: "Relay" */}
      <motion.div
        {...hoverProps('Relay')}
        whileHover={{ scale: 1.15, rotate: -5 }}
        whileTap={{ scale: 0.95 }}
        onTap={() => isMobile && onTapPlanet('Relay')}
        onClick={() => window.open('https://github.com/imshreyaskn/Relay', '_blank', 'noopener,noreferrer')}
        style={{ pointerEvents: 'auto', position: 'absolute', top: '60%', left: '100%', x: '-50%', y: '-50%', width: '2.5vh', height: '2.5vh', zIndex: 10, cursor: 'pointer' }}
      >
        <PlanetEarthLike />
      </motion.div>
    </>
  );
};

export default ProjectNodes;
