import { useEffect, useRef } from 'react';
import { useIsMobile } from '../hooks/useIsMobile';

const CURSOR_CONFIG = {
  baseSize: 35,
  springTracking: 0.15,
  trailTracking: 0.35,
  trailCount: 4,
  trailBaseSize: 22,
  trailSizeDecay: 0.7,
  trailOpacityBase: 0.4,
  trailOpacityDecay: 0.08,
  velocityStretchMax: 0.45,
  velocityStretchFactor: 0.02,
  velocityAngleThreshold: 1.5,
  hoverScaleTarget: 12 / 35,
  trailFadeVelocityMin: 15,
  trailFadeVelocityMax: 45
};

const shortestAngle = (target: number, current: number) => {
  let diff = target - current;
  while (diff <= -180) diff += 360;
  while (diff > 180) diff -= 360;
  if (diff > 90) diff -= 180;
  else if (diff < -90) diff += 180;
  return diff;
};

const CustomCursor = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const trailRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isHoveringRef = useRef(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isMobile) return;

    let targetX = -100;
    let targetY = -100;
    let currentX = -100;
    let currentY = -100;
    
    let currentScaleX = 1;
    let currentScaleY = 1;
    let currentHoverScale = 1;
    let currentAngle = 0;
    
    // Trail state
    const trailPositions = Array.from({ length: CURSOR_CONFIG.trailCount }, () => ({
      x: -100, y: -100, scaleX: 1, scaleY: 1, angle: 0
    }));
    let prevHovering = false;

    const handleMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('a, button, [role="button"], input, select, textarea')) {
        isHoveringRef.current = true;
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      // We only care when the mouse leaves an interactive element and goes to a non-interactive one.
      // relatedTarget is the element the mouse is entering.
      const relatedTarget = e.relatedTarget as HTMLElement | null;
      if (!relatedTarget || !relatedTarget.closest('a, button, [role="button"], input, select, textarea')) {
        isHoveringRef.current = false;
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseover', handleMouseOver, { passive: true });
    document.addEventListener('mouseout', handleMouseOut, { passive: true });

    let frameId: number;

    const animate = () => {
      const dx = targetX - currentX;
      const dy = targetY - currentY;
      const velocitySq = dx * dx + dy * dy;
      
      const hovering = isHoveringRef.current;
      const targetHoverScale = hovering ? CURSOR_CONFIG.hoverScaleTarget : 1;

      // Idle bail-out: If everything is stationary, sleep this frame to save CPU
      if (velocitySq < 0.001 && Math.abs(currentHoverScale - targetHoverScale) < 0.001 && hovering === prevHovering) {
        let trailsSettled = true;
        for (let i = 0; i < CURSOR_CONFIG.trailCount; i++) {
          const tdx = currentX - trailPositions[i].x;
          const tdy = currentY - trailPositions[i].y;
          if (tdx * tdx + tdy * tdy > 0.1) {
            trailsSettled = false;
            break;
          }
        }
        if (trailsSettled) {
          frameId = requestAnimationFrame(animate);
          return;
        }
      }

      currentX += dx * CURSOR_CONFIG.springTracking;
      currentY += dy * CURSOR_CONFIG.springTracking;
      const velocity = Math.sqrt(velocitySq);
      
      const stretch = Math.min(velocity * CURSOR_CONFIG.velocityStretchFactor, CURSOR_CONFIG.velocityStretchMax);
      const targetScaleX = 1 + stretch;
      const targetScaleY = 1 - (stretch * 0.4);

      currentScaleX += (targetScaleX - currentScaleX) * 0.2;
      currentScaleY += (targetScaleY - currentScaleY) * 0.2;

      if (velocity > CURSOR_CONFIG.velocityAngleThreshold) {
        const targetAngle = Math.atan2(dy, dx) * (180 / Math.PI);
        const diff = shortestAngle(targetAngle, currentAngle);
        currentAngle += diff * 0.25; 
      }

      if (cursorRef.current) {
        currentHoverScale += (targetHoverScale - currentHoverScale) * 0.2;
        
        const finalScaleX = currentScaleX * currentHoverScale;
        const finalScaleY = currentScaleY * currentHoverScale;
        
        const size = CURSOR_CONFIG.baseSize;
        
        const isSettled = velocitySq < 0.001 && 
                          Math.abs(currentHoverScale - targetHoverScale) < 0.001 && 
                          Math.abs(currentScaleX - targetScaleX) < 0.001;

        if (!isSettled || hovering !== cursorRef.current.classList.contains('hovering')) {
          const transform = hovering 
            ? `translate3d(${currentX - size/2}px, ${currentY - size/2}px, 0) rotate(0deg) scale(${currentHoverScale}, ${currentHoverScale})`
            : `translate3d(${currentX - size/2}px, ${currentY - size/2}px, 0) rotate(${currentAngle}deg) scale(${finalScaleX}, ${finalScaleY})`;
          
          cursorRef.current.style.transform = transform;
          if (hovering !== cursorRef.current.classList.contains('hovering')) {
            cursorRef.current.classList.toggle('hovering', hovering);
          }
        }
        
        // Update trails
        let prevX = currentX;
        let prevY = currentY;
        
        for (let i = 0; i < CURSOR_CONFIG.trailCount; i++) {
          const tp = trailPositions[i];
          const tx = prevX;
          const ty = prevY;
          
          tp.x += (tx - tp.x) * CURSOR_CONFIG.trailTracking;
          tp.y += (ty - tp.y) * CURSOR_CONFIG.trailTracking;
          
          const dx = tx - tp.x;
          const dy = ty - tp.y;
          const tVelocity = Math.sqrt(dx*dx + dy*dy);
          
          // Higher stretch factor than the main cursor for a "smear" effect
          const stretch = Math.min(tVelocity * 0.04, i === 0 ? 0.8 : 0.5); 
          tp.scaleX = 1 + stretch;
          tp.scaleY = 1 - (stretch * 0.3);
          
          if (tVelocity > 0.5) {
             const targetAngle = Math.atan2(dy, dx) * (180 / Math.PI);
             const diff = shortestAngle(targetAngle, tp.angle);
             tp.angle += diff * 0.4;
          }
          
          prevX = tp.x;
          prevY = tp.y;
          
          const el = trailRefs.current[i];
          if (el) {
            const trailSize = Math.max(5, Math.round(CURSOR_CONFIG.trailBaseSize * Math.pow(CURSOR_CONFIG.trailSizeDecay, i)));
            const transform = hovering 
              ? `translate3d(${tp.x - trailSize/2}px, ${tp.y - trailSize/2}px, 0) scale(0)`
              : `translate3d(${tp.x - trailSize/2}px, ${tp.y - trailSize/2}px, 0) rotate(${tp.angle}deg) scale(${tp.scaleX}, ${tp.scaleY})`;
              
            // Epsilon check to prevent unnecessary DOM writes
            if (el.style.transform !== transform) {
              el.style.transform = transform;
            }
            
            let dynamicOpacity = 0;
            if (!hovering) {
               const baseOpacity = CURSOR_CONFIG.trailOpacityBase - (i * CURSOR_CONFIG.trailOpacityDecay);
               const vRange = CURSOR_CONFIG.trailFadeVelocityMax - CURSOR_CONFIG.trailFadeVelocityMin;
               let velocityFactor = (velocity - CURSOR_CONFIG.trailFadeVelocityMin) / vRange; 
               if (velocityFactor < 0) velocityFactor = 0;
               if (velocityFactor > 1) velocityFactor = 1;
               
               dynamicOpacity = baseOpacity * velocityFactor;
            }
            
            const currentOpacity = parseFloat(el.style.opacity || '0');
            if (Math.abs(currentOpacity - dynamicOpacity) > 0.01) {
              el.style.opacity = `${dynamicOpacity}`;
            }
          }
        }
        prevHovering = hovering;
      }

      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
      cancelAnimationFrame(frameId);
    };
  }, [isMobile]);

  if (isMobile) return null;

  return (
    <>
      <div 
        ref={cursorRef}
        aria-hidden="true"
        className="liquid-cursor"
        style={{
          position: 'fixed',
          top: 0, 
          left: 0,
          pointerEvents: 'none',
          zIndex: 99999,
          width: '35px',
          height: '35px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 50%, rgba(0, 0, 0, 0.15) 85%, rgba(255, 255, 255, 0.15) 100%)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.6), inset 0 0 8px rgba(255, 255, 255, 0.2), inset 0 0 15px rgba(0, 0, 0, 0.5), 0 0 10px rgba(255, 255, 255, 0.15), 0 5px 15px rgba(0,0,0,0.2)',
          willChange: 'transform',
          transformOrigin: 'center center'
        }}
      />
      {/* Decaying plasma trail */}
      {Array.from({ length: CURSOR_CONFIG.trailCount }).map((_, i) => {
        const size = Math.max(5, Math.round(CURSOR_CONFIG.trailBaseSize * Math.pow(CURSOR_CONFIG.trailSizeDecay, i)));
        return (
          <div
            key={i}
            ref={el => trailRefs.current[i] = el}
            aria-hidden="true"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              pointerEvents: 'none',
              zIndex: 99998 - i, // underneath main cursor
              width: `${size}px`,
              height: `${size}px`,
              borderRadius: '50%',
              background: 'rgba(107, 156, 255, 0.4)', // glowing plasma blue
              boxShadow: `0 0 ${size * 1.5}px rgba(107, 156, 255, 0.6), 0 0 ${size / 2}px rgba(255, 255, 255, 0.8)`,
              opacity: CURSOR_CONFIG.trailOpacityBase - (i * CURSOR_CONFIG.trailOpacityDecay),
              willChange: 'transform, opacity',
              transition: 'opacity 0.2s ease-out',
              mixBlendMode: 'screen',
              transformOrigin: 'center center'
            }}
          />
        );
      })}
    </>
  );
};

export default CustomCursor;

