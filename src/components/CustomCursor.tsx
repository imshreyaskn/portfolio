import { useEffect, useRef } from 'react';
import { useIsMobile } from '../hooks/useIsMobile';
import { setCursorPosition } from '../lib/cursorPosition';

// --------------------------------------------------------
// PHYSICS & CONFIGURATION
// --------------------------------------------------------
const CURSOR_CONFIG = {
  baseSize: 35,
  springTracking: 12.0, // dt-based spring constant (higher = stiffer)
  trailTracking: 18.0,  // dt-based
  trailCount: 4,
  trailBaseSize: 22,
  trailSizeDecay: 0.7,
  trailOpacityBase: 0.4,
  trailOpacityDecay: 0.08,
  velocityStretchMax: 0.45,
  velocityStretchFactor: 0.0005, // scaled for dt-velocity
  velocityAngleThreshold: 150, // dt-adjusted velocity threshold
  hoverScaleTarget: 12 / 35,
  trailFadeVelocityMin: 200, // scaled for dt-velocity
  trailFadeVelocityMax: 800,
  
  // Gravity Physics
  gravityRadius: 500,
  eventHorizon: 100, // 100% capture radius
};

// --------------------------------------------------------
// MATH UTILITIES
// --------------------------------------------------------
const shortestAngle = (target: number, current: number) => {
  let diff = target - current;
  while (diff <= -180) diff += 360;
  while (diff > 180) diff -= 360;
  if (diff > 90) diff -= 180;
  else if (diff < -90) diff += 180;
  return diff;
};

const lerp = (start: number, end: number, t: number) => {
  return start + (end - start) * t;
};

// Frame-independent spring damping interpolation
const damp = (current: number, target: number, lambda: number, dt: number) => {
  return lerp(current, target, 1 - Math.exp(-lambda * dt));
};

// --------------------------------------------------------
// COMPONENT
// --------------------------------------------------------
const CustomCursor = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const trailRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isHoveringRef = useRef(false);
  const isMobile = useIsMobile();
  
  // Cache the Black Hole DOM Rect to avoid layout thrashing in rAF
  const bhRectRef = useRef<{x: number, y: number, isValid: boolean}>({ x: 0, y: 0, isValid: false });

  useEffect(() => {
    if (isMobile) return;

    // --------------------------------------------------------
    // STATE
    // --------------------------------------------------------
    let rawX = -100;
    let rawY = -100;
    let lastRawX = -100;
    let lastRawY = -100;
    let virtualX = -100;
    let virtualY = -100;
    let currentX = -100;
    let currentY = -100;
    
    let currentScaleX = 1;
    let currentScaleY = 1;
    let currentHoverScale = 1;
    let currentAngle = 0;
    
    const trailPositions = Array.from({ length: CURSOR_CONFIG.trailCount }, () => ({
      x: -100, y: -100, scaleX: 1, scaleY: 1, angle: 0, opacity: 0
    }));

    let lastTime = performance.now();
    let frameId: number;

    const scrollPosRef = { x: typeof window !== 'undefined' ? window.scrollX : 0, y: typeof window !== 'undefined' ? window.scrollY : 0 };
    const updateScrollPos = () => {
      scrollPosRef.x = window.scrollX;
      scrollPosRef.y = window.scrollY;
    };
    window.addEventListener('scroll', updateScrollPos, { passive: true });

    const handleMouseMove = (e: MouseEvent) => {
      rawX = e.clientX;
      rawY = e.clientY;
      if (virtualX === -100) {
        virtualX = rawX;
        virtualY = rawY;
      }
    };

    const HOVER_SELECTOR = 'a, button, [role="button"], [data-hoverable], input, textarea';

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target || !target.closest) return;
      if (target.closest(HOVER_SELECTOR)) {
        isHoveringRef.current = true;
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const relatedTarget = e.relatedTarget as HTMLElement | null;
      if (!relatedTarget || !relatedTarget.closest || !relatedTarget.closest(HOVER_SELECTOR)) {
        isHoveringRef.current = false;
      }
    };

    const handleMouseLeave = () => {
      setCursorPosition(0, 0, false);
    };

    // Throttled/Debounced Rect Cacher
    let resizeTimeout: ReturnType<typeof setTimeout>;
    const updateBhRect = () => {
      const bhEl = (document.querySelector('.saturn-glow') || document.querySelector('.projects-canvas-wrapper')) as HTMLElement;
      if (bhEl) {
        const rect = bhEl.getBoundingClientRect();
        if (rect.width > 0) {
          // Store ABSOLUTE document coordinates to avoid reflows on scroll
          bhRectRef.current = {
            x: rect.left + window.scrollX + rect.width / 2,
            y: rect.top + window.scrollY + rect.height / 2,
            isValid: true
          };
          return true;
        }
      }
      bhRectRef.current.isValid = false;
      return false;
    };

    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(updateBhRect, 50);
    };

    // Extremely cheap scroll listener: only polls DOM if we haven't found the black hole yet (lazy loading fix)
    let scrollTimeout: ReturnType<typeof setTimeout>;
    const handleScroll = () => {
      if (!bhRectRef.current.isValid) {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(updateBhRect, 100);
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseover', handleMouseOver, { passive: true });
    document.addEventListener('mouseout', handleMouseOut, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Initial fetch
    setTimeout(updateBhRect, 100);

    // --------------------------------------------------------
    // RENDER LOOP (World Class Physics Engine)
    // --------------------------------------------------------
    let lastHoverApplied = false;
    
    const animate = (time: number) => {
      // 1. Time Update (Delta Time)
      const dt = Math.min((time - lastTime) / 1000, 0.1); // Cap dt at 100ms to prevent massive jumps
      lastTime = time;

      // 2. Hardware Mouse Velocity
      let rawVelocity = 0;
      if (lastRawX !== -100) {
        const rawDx = rawX - lastRawX;
        const rawDy = rawY - lastRawY;
        rawVelocity = Math.sqrt(rawDx * rawDx + rawDy * rawDy) / (dt || 0.016);
      }
      lastRawX = rawX;
      lastRawY = rawY;

      const isMoving = rawVelocity > 30.0; // px/s
      const hovering = isHoveringRef.current;

      // 3. Mouse Tether (Spring virtualX towards rawX)
      // When hovering an interactive element/planet, virtualX instantly snaps to rawX
      // so there is ZERO gravitational drift or pull lag over planets!
      if (hovering) {
        virtualX = rawX;
        virtualY = rawY;
      } else if (virtualX !== -100) {
        const mdx = rawX - virtualX;
        const mdy = rawY - virtualY;
        const tetherK = isMoving ? 15.0 : 1.5; 
        virtualX += mdx * tetherK * dt;
        virtualY += mdy * tetherK * dt;
      }

      // 4. Calculate Forces & Targets (Disabled completely when hovering planets/buttons)
      let targetX = virtualX;
      let targetY = virtualY;
      let blackHoleSuctionFactor = 1.0;

      if (bhRectRef.current.isValid && virtualX !== -100 && !hovering) {
        const currentBhViewportX = bhRectRef.current.x - scrollPosRef.current.x;
        const currentBhViewportY = bhRectRef.current.y - scrollPosRef.current.y;

        const gdx = currentBhViewportX - virtualX;
        const gdy = currentBhViewportY - virtualY;
        const dist = Math.sqrt(gdx * gdx + gdy * gdy);
        
        if (dist < CURSOR_CONFIG.gravityRadius) {
          const norm = dist / CURSOR_CONFIG.gravityRadius;
          
          let pullSpeed = 3500 * Math.pow(1.0 - norm, 7.0); // pixels per second drift
          if (isMoving) {
            pullSpeed *= 0.5; // Reduce gravity strength to 50% when in motion
          }
          
          if (dist < CURSOR_CONFIG.eventHorizon) {
             // 100% swallowed into the singularity
             virtualX = currentBhViewportX;
             virtualY = currentBhViewportY;
             blackHoleSuctionFactor = 0.05; 
          } else {
             // Actively pull the virtual mouse
             virtualX += (gdx / dist) * pullSpeed * dt;
             virtualY += (gdy / dist) * pullSpeed * dt;
             
             // Spaghettification (Scale down as it approaches singularity)
             blackHoleSuctionFactor = Math.max(0.05, Math.min(1.0, norm * 2.0));
          }

          targetX = virtualX;
          targetY = virtualY;
        }
      }

      // 3. Integrate Main Cursor Physics
      currentX = damp(currentX, targetX, CURSOR_CONFIG.springTracking, dt);
      currentY = damp(currentY, targetY, CURSOR_CONFIG.springTracking, dt);
      
      setCursorPosition(currentX, currentY, !hovering && virtualX !== -100);
      
      const dx = targetX - currentX;
      const dy = targetY - currentY;
      
      // Velocity mapped per second (frame independent)
      const velocity = Math.sqrt(dx * dx + dy * dy) / (dt || 0.016);
      
      const baseTargetHoverScale = hovering ? CURSOR_CONFIG.hoverScaleTarget : 1;
      const targetHoverScale = baseTargetHoverScale * blackHoleSuctionFactor;

      const stretch = Math.min(velocity * CURSOR_CONFIG.velocityStretchFactor, CURSOR_CONFIG.velocityStretchMax);
      const targetScaleX = 1 + stretch;
      const targetScaleY = 1 - (stretch * 0.4);

      currentScaleX = damp(currentScaleX, targetScaleX, 15.0, dt);
      currentScaleY = damp(currentScaleY, targetScaleY, 15.0, dt);

      if (velocity > CURSOR_CONFIG.velocityAngleThreshold) {
        const targetAngle = Math.atan2(dy, dx) * (180 / Math.PI);
        const diff = shortestAngle(targetAngle, currentAngle);
        currentAngle += diff * (dt * 15.0); 
      }

      currentHoverScale = damp(currentHoverScale, targetHoverScale, 15.0, dt);

      // 4. Render Main Cursor
      if (cursorRef.current) {
        const finalScaleX = currentScaleX * currentHoverScale;
        const finalScaleY = currentScaleY * currentHoverScale;
        const size = CURSOR_CONFIG.baseSize;
        
        const transform = hovering 
          ? `translate3d(${(currentX - size/2).toFixed(2)}px, ${(currentY - size/2).toFixed(2)}px, 0) scale(${currentHoverScale.toFixed(2)}, ${currentHoverScale.toFixed(2)})`
          : `translate3d(${(currentX - size/2).toFixed(2)}px, ${(currentY - size/2).toFixed(2)}px, 0) rotate(${currentAngle.toFixed(2)}deg) scale(${finalScaleX.toFixed(2)}, ${finalScaleY.toFixed(2)})`;
        
        if (cursorRef.current.style.transform !== transform) {
          cursorRef.current.style.transform = transform;
        }
        if (hovering !== lastHoverApplied) {
          cursorRef.current.classList.toggle('hovering', hovering);
          lastHoverApplied = hovering;
        }
        
        // 5. Integrate & Render Trails
        let prevX = currentX;
        let prevY = currentY;
        
        for (let i = 0; i < CURSOR_CONFIG.trailCount; i++) {
          const tp = trailPositions[i];
          const tx = prevX;
          const ty = prevY;
          
          tp.x = damp(tp.x, tx, CURSOR_CONFIG.trailTracking, dt);
          tp.y = damp(tp.y, ty, CURSOR_CONFIG.trailTracking, dt);
          
          const tdx = tx - tp.x;
          const tdy = ty - tp.y;
          const tVelocity = Math.sqrt(tdx*tdx + tdy*tdy) / (dt || 0.016);
          
          const tStretch = Math.min(tVelocity * 0.001, i === 0 ? 0.8 : 0.5); 
          tp.scaleX = 1 + tStretch;
          tp.scaleY = 1 - (tStretch * 0.3);
          
          if (tVelocity > 50) {
             const targetAngle = Math.atan2(tdy, tdx) * (180 / Math.PI);
             const diff = shortestAngle(targetAngle, tp.angle);
             tp.angle += diff * (dt * 20.0);
          }
          
          prevX = tp.x;
          prevY = tp.y;
          
          const el = trailRefs.current[i];
          if (el) {
            const trailSize = Math.max(5, Math.round(CURSOR_CONFIG.trailBaseSize * Math.pow(CURSOR_CONFIG.trailSizeDecay, i)));
            const tTransform = hovering 
              ? `translate3d(${tp.x - trailSize/2}px, ${tp.y - trailSize/2}px, 0) scale(0)`
              : `translate3d(${tp.x - trailSize/2}px, ${tp.y - trailSize/2}px, 0) rotate(${tp.angle}deg) scale(${tp.scaleX}, ${tp.scaleY})`;
              
            if (el.style.transform !== tTransform) {
              el.style.transform = tTransform;
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
            
            if (Math.abs(tp.opacity - dynamicOpacity) > 0.01) {
              tp.opacity = dynamicOpacity;
              el.style.opacity = dynamicOpacity.toFixed(2);
            }
          }
        }
      }

      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', updateScrollPos);
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(resizeTimeout);
      clearTimeout(scrollTimeout);
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
