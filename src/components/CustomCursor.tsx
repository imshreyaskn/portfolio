import { useEffect, useRef } from 'react';
import { useIsMobile } from '../hooks/useIsMobile';

const CustomCursor = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
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

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);

    let frameId: number;

    const animate = () => {
      currentX += (targetX - currentX) * 0.15;
      currentY += (targetY - currentY) * 0.15;

      const dx = targetX - currentX;
      const dy = targetY - currentY;
      const velocity = Math.sqrt(dx * dx + dy * dy);
      
      const stretch = Math.min(velocity * 0.02, 0.45);
      const targetScaleX = 1 + stretch;
      const targetScaleY = 1 - (stretch * 0.4);

      currentScaleX += (targetScaleX - currentScaleX) * 0.2;
      currentScaleY += (targetScaleY - currentScaleY) * 0.2;

      if (velocity > 1.5) {
        const targetAngle = Math.atan2(dy, dx) * (180 / Math.PI);
        let diff = targetAngle - currentAngle;
        
        while (diff <= -180) diff += 360;
        while (diff > 180) diff -= 360;

        if (diff > 90) {
          diff -= 180;
        } else if (diff < -90) {
          diff += 180;
        }
        
        currentAngle += diff * 0.25; 
      }

      if (cursorRef.current) {
        const hovering = isHoveringRef.current;
        const targetHoverScale = hovering ? (12 / 35) : 1;
        currentHoverScale += (targetHoverScale - currentHoverScale) * 0.2;
        
        const finalScaleX = currentScaleX * currentHoverScale;
        const finalScaleY = currentScaleY * currentHoverScale;
        
        const size = 35; // base size
        const transform = hovering 
          ? `translate3d(${currentX - size/2}px, ${currentY - size/2}px, 0) rotate(0deg) scale(${currentHoverScale}, ${currentHoverScale})`
          : `translate3d(${currentX - size/2}px, ${currentY - size/2}px, 0) rotate(${currentAngle}deg) scale(${finalScaleX}, ${finalScaleY})`;
        
        cursorRef.current.style.transform = transform;
        cursorRef.current.classList.toggle('hovering', hovering);
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
          // backdrop-filter removed: it caused a full repaint of everything behind
          // the cursor on every mousemove at 60fps (heavy GPU cost on shared VRAM).
          // The visual is preserved via layered box-shadows matching the original.
          background: 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0) 50%, rgba(0, 0, 0, 0.15) 85%, rgba(255, 255, 255, 0.1) 100%)',
          boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.6), inset 0 0 8px rgba(255, 255, 255, 0.2), inset 0 0 15px rgba(0, 0, 0, 0.5), 0 0 10px rgba(255, 255, 255, 0.15), 0 5px 15px rgba(0,0,0,0.2)',
          // will-change: transform promotes the element to its own compositor layer
          // once at mount — from that point, only GPU compositing is needed for movement.
          willChange: 'transform',
          transformOrigin: 'center center'
        }}
      />
  );
};

export default CustomCursor;

