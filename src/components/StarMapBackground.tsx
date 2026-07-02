import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

interface Line {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

const TARGET_FPS = 30;
const TARGET_INTERVAL = 1000 / TARGET_FPS;
const CONNECT_DIST = 110;
const CONNECT_DIST_SQ = CONNECT_DIST * CONNECT_DIST;

const StarMapBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let resizeTimer: ReturnType<typeof setTimeout>;
    let lastFrameTime = 0;

    let lastScrollY = window.scrollY || 0;
    let w = window.innerWidth;
    let h = window.innerHeight * 1.2;

    const fgParticles: Particle[] = [];
    const bgParticles: Particle[] = [];

    // Zero-allocation buckets to prevent Garbage Collection pauses during render loop
    const fgBuckets: Particle[][] = Array.from({ length: 8 }, () => []);
    const fgBucketCounts = new Int32Array(8);

    const bgBuckets: Particle[][] = Array.from({ length: 6 }, () => []);
    const bgBucketCounts = new Int32Array(6);

    const lineBuckets: Line[][] = Array.from({ length: 5 }, () => []);
    const lineBucketCounts = new Int32Array(5);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = window.innerWidth;
      h = window.innerHeight * 1.2;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      initParticles();
    };

    const initParticles = () => {
      fgParticles.length = 0;
      bgParticles.length = 0;
      const numParticles = Math.min(Math.floor((w * h) / 15000), 250);
      
      for (let i = 0; i < numParticles; i++) {
        fgParticles.push({
          x: Math.random() > 0.6 ? Math.random() * (w * 0.4) : Math.random() * w,
          y: Math.random() * h,
          vx: Math.random() * 0.4 + 0.1,
          vy: (Math.random() - 0.5) * 0.3,
          radius: Math.random() * 1.2 + 0.4
        });
      }

      for (let i = 0; i < numParticles * 0.8; i++) {
        bgParticles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: Math.random() * 0.1 + 0.02,
          vy: (Math.random() - 0.5) * 0.05,
          radius: Math.random() * 0.6 + 0.7
        });
      }
    };

    const draw = (timestamp: number) => {
      animationFrameId = requestAnimationFrame(draw);

      if (timestamp - lastFrameTime < TARGET_INTERVAL) return;
      lastFrameTime = timestamp;

      const currentScrollY = window.scrollY;
      const scrollDelta = currentScrollY - lastScrollY;
      lastScrollY = currentScrollY;

      const fgScroll = scrollDelta * 0.25;
      const bgScroll = scrollDelta * 0.1;

      ctx.clearRect(0, 0, w, h);
      
      fgBucketCounts.fill(0);
      bgBucketCounts.fill(0);
      lineBucketCounts.fill(0);

      // Process BG (Inlined for zero function overhead)
      for (let i = 0; i < bgParticles.length; i++) {
        const p = bgParticles[i];
        p.x += p.vx;
        p.y += p.vy - bgScroll;
        if (p.x > w + 10) { p.x = -10; p.y = Math.random() * h; }
        while (p.y < -10) p.y += h + 20;
        while (p.y > h + 10) p.y -= h + 20;

        let rawOpacity = 0.6 * (1 - p.x / w);
        if (rawOpacity < 0.1) rawOpacity = 0.1;
        let idx = Math.round(rawOpacity * 10) - 1;
        if (idx < 0) idx = 0;
        if (idx > 5) idx = 5;
        bgBuckets[idx][bgBucketCounts[idx]++] = p;
      }

      // Process FG (Inlined)
      for (let i = 0; i < fgParticles.length; i++) {
        const p = fgParticles[i];
        p.x += p.vx;
        p.y += p.vy - fgScroll;
        if (p.x > w + 10) { p.x = -10; p.y = Math.random() * h; }
        while (p.y < -10) p.y += h + 20;
        while (p.y > h + 10) p.y -= h + 20;

        let rawOpacity = 0.8 * (1 - p.x / w);
        if (rawOpacity < 0.1) rawOpacity = 0.1;
        let idx = Math.round(rawOpacity * 10) - 1;
        if (idx < 0) idx = 0;
        if (idx > 7) idx = 7;
        fgBuckets[idx][fgBucketCounts[idx]++] = p;
      }

      // Draw BG (Using fillRect for tiny background particles is up to 5x faster than arc paths)
      for (let i = 0; i < 6; i++) {
        const count = bgBucketCounts[i];
        if (count === 0) continue;
        
        ctx.fillStyle = `rgba(180, 200, 255, ${(i + 1) * 0.1})`;
        const bucket = bgBuckets[i];
        for (let j = 0; j < count; j++) {
          const p = bucket[j];
          // Background particles are 0.7 to 1.3px radius. Rectangles are perfectly visually equivalent to circles here.
          ctx.fillRect(p.x - p.radius, p.y - p.radius, p.radius * 2, p.radius * 2);
        }
      }

      // Draw FG (Foreground particles are larger, so we keep standard arc paths but batched)
      const TWO_PI = Math.PI * 2;
      for (let i = 0; i < 8; i++) {
        const count = fgBucketCounts[i];
        if (count === 0) continue;
        
        ctx.beginPath();
        const bucket = fgBuckets[i];
        for (let j = 0; j < count; j++) {
          const p = bucket[j];
          ctx.moveTo(p.x + p.radius, p.y);
          ctx.arc(p.x, p.y, p.radius, 0, TWO_PI);
        }
        ctx.fillStyle = `rgba(255, 255, 255, ${(i + 1) * 0.1})`;
        ctx.fill();
      }

      // Sort EVERY frame! V8's Timsort is O(N) for nearly sorted arrays.
      // This is mathematically required to make the inner-loop Sweep-and-Prune 'break' condition safe and 100% effective.
      fgParticles.sort((a, b) => a.x - b.x);

      ctx.lineWidth = 0.4;

      // Sweep and Prune collision lines
      for (let i = 0; i < fgParticles.length; i++) {
        const p1 = fgParticles[i];
        for (let j = i + 1; j < fgParticles.length; j++) {
          const p2 = fgParticles[j];
          const dx = p1.x - p2.x;
          // dx is guaranteed to be <= 0 because array is strictly sorted ascending.
          // Therefore dx*dx is equivalent to (p2.x - p1.x)^2. If this exceeds dist, ALL subsequent j will also exceed it!
          if (dx * dx > CONNECT_DIST_SQ) break;
          
          const dy = p1.y - p2.y;
          const distSq = dx * dx + dy * dy;
          
          if (distSq < CONNECT_DIST_SQ) {
            const dist = Math.sqrt(distSq);
            const lineOpacity = 0.1 * (1 - dist / CONNECT_DIST);
            if (lineOpacity <= 0.01) continue;
            
            let idx = Math.ceil(lineOpacity / 0.02) - 1;
            if (idx < 0) idx = 0;
            if (idx > 4) idx = 4;
            
            const lineBucket = lineBuckets[idx];
            const lineIdx = lineBucketCounts[idx]++;
            
            if (lineIdx < lineBucket.length) {
              const l = lineBucket[lineIdx];
              l.x1 = p1.x; l.y1 = p1.y; l.x2 = p2.x; l.y2 = p2.y;
            } else {
              lineBucket.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y });
            }
          }
        }
      }

      // Draw Lines
      for (let i = 0; i < 5; i++) {
        const count = lineBucketCounts[i];
        if (count === 0) continue;
        
        ctx.beginPath();
        const bucket = lineBuckets[i];
        for (let j = 0; j < count; j++) {
          const l = bucket[j];
          ctx.moveTo(l.x1, l.y1);
          ctx.lineTo(l.x2, l.y2);
        }
        ctx.strokeStyle = `rgba(255, 255, 255, ${(i + 1) * 0.02})`;
        ctx.stroke();
      }
    };

    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 150);
    };

    // Pause the animation loop when the tab is hidden
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
