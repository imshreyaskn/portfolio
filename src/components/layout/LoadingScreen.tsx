import { useEffect, useMemo } from 'react';
import { motion, useAnimation } from 'framer-motion';
import './LoadingScreen.css';

interface LoadingScreenProps {
  onComplete: () => void;
}

const LoadingScreen = ({ onComplete }: LoadingScreenProps) => {
  const controls = useAnimation();

  useEffect(() => {
    // Lock body scroll so users can't scroll while loading
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    const runAnimation = async () => {
      // 1. Fade in stars
      await controls.start('starsVisible');
      // 2. Draw lines sequentially
      await controls.start('linesDrawn');
      // 3. Short pause to admire
      await new Promise(resolve => setTimeout(resolve, 300));
      // 4. Gather stars in the center while fading lines
      await controls.start('gatherCenter');
      // 5. Trigger unmount directly (no jumpy pulse)
      onComplete();
      
      // Unlock body scroll
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };

    runAnimation();

    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [controls, onComplete]);

  // Diamond shape points with gather offsets
  const points = [
    { cx: 50, cy: 20, gatherX: 0, gatherY: 30 },   // Top
    { cx: 80, cy: 50, gatherX: -30, gatherY: 0 },  // Right
    { cx: 50, cy: 80, gatherX: 0, gatherY: -30 },  // Bottom
    { cx: 20, cy: 50, gatherX: 30, gatherY: 0 },   // Left
  ];

  // Path lines connecting them
  const lines = [
    { x1: points[0].cx, y1: points[0].cy, x2: points[1].cx, y2: points[1].cy }, // Top -> Right
    { x1: points[1].cx, y1: points[1].cy, x2: points[2].cx, y2: points[2].cy }, // Right -> Bottom
    { x1: points[2].cx, y1: points[2].cy, x2: points[3].cx, y2: points[3].cy }, // Bottom -> Left
    { x1: points[3].cx, y1: points[3].cy, x2: points[0].cx, y2: points[0].cy }, // Left -> Top
    { x1: points[0].cx, y1: points[0].cy, x2: points[2].cx, y2: points[2].cy }, // Top -> Bottom (Cross)
    { x1: points[3].cx, y1: points[3].cy, x2: points[1].cx, y2: points[1].cy }, // Left -> Right (Cross)
  ];

  return (
    <motion.div 
      className="loading-screen-overlay"
      initial={{ 
        opacity: 1,
        background: 'radial-gradient(circle at 50% 50%, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 100%)'
      }}
      exit={{ 
        opacity: 0, 
        background: 'radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 30%, rgba(0,0,0,1) 100%)',
        transition: { duration: 1.5, ease: "easeInOut" } 
      }}
    >
      <svg 
        viewBox="0 0 100 100" 
        className="constellation-svg"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="silverLineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="50%" stopColor="#A8A8B3" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>
        </defs>

        {lines.map((line, i) => (
          <motion.line
            key={`line-${i}`}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke="url(#silverLineGrad)"
            strokeWidth="0.15"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={controls}
            variants={{
              linesDrawn: { 
                pathLength: 1, 
                opacity: 0.6,
                transition: { duration: 0.5, delay: i * 0.35, ease: "easeInOut" } 
              },
              gatherCenter: {
                opacity: 0,
                transition: { duration: 0.4, ease: "easeOut" }
              }
            }}
          />
        ))}

        {points.map((pt, i) => (
          <motion.g
            key={`star-${i}`}
            style={{ originX: `${pt.cx}px`, originY: `${pt.cy}px` }}
            initial={{ x: 0, y: 0, scale: 1, opacity: 0 }}
            animate={controls}
            variants={{
              starsVisible: { 
                opacity: 1, 
                transition: { duration: 0.8, delay: i * 0.2, ease: "easeInOut" } 
              },
              gatherCenter: {
                x: pt.gatherX,
                y: pt.gatherY,
                opacity: 0, /* smoothly fade out as they gather */
                transition: { duration: 0.8, ease: "backIn" }
              }
            }}
          >
            {/* Diffuse outer glow */}
            <circle cx={pt.cx} cy={pt.cy} r="2.5" fill="rgba(255, 255, 255, 0.2)" filter="blur(1.5px)" />
            {/* Mid intense glow */}
            <circle cx={pt.cx} cy={pt.cy} r="1" fill="rgba(255, 255, 255, 0.5)" filter="blur(0.5px)" />
            {/* Sharp, tiny core */}
            <circle cx={pt.cx} cy={pt.cy} r="0.3" fill="#ffffff" />
          </motion.g>
        ))}
      </svg>
    </motion.div>
  );
};

export default LoadingScreen;
