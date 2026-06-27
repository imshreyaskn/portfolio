import { useEffect, useRef } from 'react';

const StarMapBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animationFrameId: number;
    let particles: {x: number, y: number, vx: number, vy: number, radius: number}[] = [];
    let resizeTimer: ReturnType<typeof setTimeout>;
    let frameCount = 0;

    // ~30fps cap: only process a frame if at least 33ms have elapsed.
    // Stars drift slowly so 30fps is visually indistinguishable from 60fps,
    // but halves the CPU cost of the particle loop and O(n log n) sort.
    let lastFrameTime = 0;
    const TARGET_INTERVAL = 1000 / 30; // 33.3ms
    
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const h = window.innerHeight * 1.2;
      canvas.width = window.innerWidth * dpr;
      canvas.height = h * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      initParticles();
    };

    const initParticles = () => {
      particles = [];
      const h = window.innerHeight * 1.2;
      const numParticles = Math.min(Math.floor((window.innerWidth * h) / 15000), 250);
      
      for (let i = 0; i < numParticles; i++) {
        let xPos = Math.random() * window.innerWidth;
        if (Math.random() > 0.6) {
           xPos = Math.random() * (window.innerWidth * 0.4); 
        }

        particles.push({
          x: xPos,
          y: Math.random() * h,
          vx: Math.random() * 0.4 + 0.1,
          vy: (Math.random() - 0.5) * 0.3,
          radius: Math.random() * 1.2 + 0.4
        });
      }
    };

    const draw = (timestamp: number) => {
      // Throttle to ~30fps — request next frame first so we don't miss a slot,
      // then bail out early if not enough time has elapsed.
      animationFrameId = requestAnimationFrame(draw);

      if (timestamp - lastFrameTime < TARGET_INTERVAL) return;
      lastFrameTime = timestamp;

      const h = window.innerHeight * 1.2;
      ctx.clearRect(0, 0, window.innerWidth, h);
      
      const buckets: Record<string, typeof particles> = {
        '0.1': [], '0.2': [], '0.3': [], '0.4': [], '0.5': [], '0.6': [], '0.7': [], '0.8': []
      };

      for (let i = 0; i < particles.length; i++) {
        let p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        
        if (p.x > window.innerWidth + 10) {
          p.x = -10;
          p.y = Math.random() * h;
        }
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;

        const opacity = Math.max(0.1, 0.8 * (1 - p.x / window.innerWidth));
        const bucketKey = Math.max(0.1, Math.min(0.8, Math.round(opacity * 10) / 10)).toFixed(1);
        buckets[bucketKey].push(p);
      }

      for (const opacityStr in buckets) {
        const bucketParticles = buckets[opacityStr];
        if (bucketParticles.length === 0) continue;
        ctx.beginPath();
        for (let i = 0; i < bucketParticles.length; i++) {
          const p = bucketParticles[i];
          ctx.moveTo(p.x + p.radius, p.y);
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        }
        ctx.fillStyle = `rgba(255, 255, 255, ${opacityStr})`;
        ctx.fill();
      }

      // Amortize sort: only sort every 10 frames to reduce O(n log n) overhead
      frameCount++;
      if (frameCount % 10 === 0) {
        particles.sort((a, b) => a.x - b.x);
      }

      const connectDistSq = 110 * 110;
      ctx.lineWidth = 0.4;
      
      const lineBuckets: Record<string, {x1: number, y1: number, x2: number, y2: number}[]> = {
        '0.02': [], '0.04': [], '0.06': [], '0.08': [], '0.10': []
      };

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          // Because particles are sorted by x, if dx > connectDist, no further j can be close enough
          if (dx * dx > connectDistSq) break;
          
          const dy = particles[i].y - particles[j].y;
          const distSq = dx * dx + dy * dy;
          
          if (distSq < connectDistSq) {
            const dist = Math.sqrt(distSq);
            const lineOpacity = 0.1 * (1 - dist / 110);
            if (lineOpacity <= 0.01) continue;
            
            const bucketKey = Math.min(0.10, Math.ceil(lineOpacity / 0.02) * 0.02).toFixed(2);
            if (lineBuckets[bucketKey]) {
              lineBuckets[bucketKey].push({
                x1: particles[i].x, y1: particles[i].y,
                x2: particles[j].x, y2: particles[j].y
              });
            }
          }
        }
      }

      for (const opacityStr in lineBuckets) {
        const lines = lineBuckets[opacityStr];
        if (lines.length === 0) continue;
        ctx.beginPath();
        for (let i = 0; i < lines.length; i++) {
          const l = lines[i];
          ctx.moveTo(l.x1, l.y1);
          ctx.lineTo(l.x2, l.y2);
        }
        ctx.strokeStyle = `rgba(255, 255, 255, ${opacityStr})`;
        ctx.stroke();
      }
    };

    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 150);
    };

    // Pause the animation loop when the tab is hidden (user switched away).
    // Resume when they come back. Avoids wasting CPU/GPU on invisible frames.
    const handleVisibilityChange = () => {
      if (document.hidden) {
        cancelAnimationFrame(animationFrameId);
      } else {
        lastFrameTime = 0; // allow immediate first frame on resume
        animationFrameId = requestAnimationFrame(draw);
      }
    };

    window.addEventListener('resize', handleResize, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange, { passive: true });
    resize();
    animationFrameId = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearTimeout(resizeTimer);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div 
      aria-hidden="true" 
      style={{ 
        position: 'fixed', 
        top: 0, left: 0, 
        width: '100vw', height: '120dvh',
        zIndex: 0,
        pointerEvents: 'none',
        background: 'transparent'
      }}
    >
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '70vw',
        height: '120vh',
        background: 'radial-gradient(circle at -10% 50%, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 30%, rgba(107, 156, 255, 0.06) 60%, transparent 85%)',
        filter: 'blur(30px)',
        zIndex: 1,
        pointerEvents: 'none',
        willChange: 'transform',
        contain: 'strict'
      }} />
      <canvas ref={canvasRef} style={{ display: 'block', opacity: 0.9, position: 'relative', zIndex: 2, contain: 'strict' }} />
    </div>
  );
};

export default StarMapBackground;
