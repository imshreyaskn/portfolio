import { useEffect, useRef } from 'react';

type DepthLayer = 0 | 1 | 2;

const STARFIELD_CONFIG = {
  particleDensity: 15000,
  maxParticles: 250,
  targetFps: 30,
  mouseSmoothing: 0.05,
  scrollSmoothing: 0.15,
  baseRadius: [0.6, 1.0, 1.6],
  baseSpeed: [0.4, 1.0, 1.8],
  parallaxFactor: [2, 6, 12],
  scrollFactor: [0.02, 0.08, 0.15],
  opacityFactor: [0.3, 0.6, 0.9],
  baseConnectDist: 110,
};

const StarMapBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // a11y: Respect OS settings for reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const motionMultiplier = prefersReducedMotion ? 0.3 : 1;

    let animationFrameId: number;
    let particles: {x: number, y: number, rx: number, ry: number, vx: number, vy: number, radius: number, z: DepthLayer}[] = [];
    let resizeTimer: ReturnType<typeof setTimeout>;
    let frameCount = 0;
    let currentConnectDistSq = STARFIELD_CONFIG.baseConnectDist * STARFIELD_CONFIG.baseConnectDist;
    
    // Pre-allocated flat arrays to eliminate GC overhead
    const particleBuckets = Array.from({ length: 19 }, () => new Float32Array(STARFIELD_CONFIG.maxParticles * 3));
    const particleBucketCounts = new Int32Array(19);

    const MAX_LINES_PER_BUCKET = 3000;
    const lineBuckets = Array.from({ length: 6 }, () => new Float32Array(MAX_LINES_PER_BUCKET * 4));
    const lineBucketCounts = new Int32Array(6);
    
    let cachedWindowWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
    let cachedH = typeof window !== 'undefined' ? window.innerHeight : 1000;
    
    // Mouse tracking for parallax
    let targetMouseX = 0;
    let targetMouseY = 0;
    let currentMouseX = 0;
    let currentMouseY = 0;
    
    // Scroll tracking for parallax
    let targetScrollY = window.scrollY || 0;
    let currentScrollY = window.scrollY || 0;
    
    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = (e.clientX / window.innerWidth) - 0.5;
      targetMouseY = (e.clientY / window.innerHeight) - 0.5;
    };
    
    const handleScroll = () => {
      targetScrollY = window.scrollY;
    };
    
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });

    const TARGET_INTERVAL = 1000 / STARFIELD_CONFIG.targetFps;
    let lastFrameTime = 0;

    const resize = () => {
      cachedWindowWidth = window.innerWidth;
      cachedH = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = cachedWindowWidth * dpr;
      canvas.height = cachedH * dpr;
      canvas.style.width = cachedWindowWidth + 'px';
      canvas.style.height = cachedH + 'px';
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      
      // Dynamic connection scaling: denser screens get tighter connections
      const densityScaling = Math.min(1, cachedWindowWidth / 1200);
      const scaledDist = Math.max(50, STARFIELD_CONFIG.baseConnectDist * densityScaling);
      currentConnectDistSq = scaledDist * scaledDist;
      
      initParticles();
    };

    const resetVelocity = (p: typeof particles[0]) => {
      const speedMultiplier = STARFIELD_CONFIG.baseSpeed[p.z] * motionMultiplier;
      p.vx = (Math.random() * 0.4 + 0.1) * speedMultiplier;
      p.vy = (Math.random() - 0.5) * 0.3 * speedMultiplier;
    };

    const initParticles = () => {
      particles = [];
      const numParticles = Math.min(Math.floor((cachedWindowWidth * cachedH) / STARFIELD_CONFIG.particleDensity), STARFIELD_CONFIG.maxParticles);
      
      for (let i = 0; i < numParticles; i++) {
        let xPos = Math.random() * cachedWindowWidth;
        if (Math.random() > 0.6) {
           xPos = Math.random() * (cachedWindowWidth * 0.4); 
        }
        
        const z = Math.floor(Math.random() * 3) as DepthLayer;
        const radiusBase = STARFIELD_CONFIG.baseRadius[z];

        const p = {
          x: xPos,
          y: Math.random() * cachedH,
          rx: xPos,
          ry: Math.random() * cachedH,
          vx: 0,
          vy: 0,
          radius: (Math.random() * 0.8 + 0.4) * radiusBase,
          z
        };
        resetVelocity(p);
        particles.push(p);
      }
    };

    const draw = (timestamp: number) => {
      // Throttle to ~30fps — request next frame first so we don't miss a slot,
      // then bail out early if not enough time has elapsed.
      animationFrameId = requestAnimationFrame(draw);

      if (timestamp - lastFrameTime < TARGET_INTERVAL) return;
      lastFrameTime = timestamp;

      ctx.clearRect(0, 0, cachedWindowWidth, cachedH);
      
      // Reset buffer counts
      particleBucketCounts.fill(0);
      lineBucketCounts.fill(0);

      // Smooth tracking for parallax
      currentMouseX += (targetMouseX - currentMouseX) * STARFIELD_CONFIG.mouseSmoothing;
      currentMouseY += (targetMouseY - currentMouseY) * STARFIELD_CONFIG.mouseSmoothing;
      currentScrollY += (targetScrollY - currentScrollY) * STARFIELD_CONFIG.scrollSmoothing;

      for (let i = 0; i < particles.length; i++) {
        let p = particles[i];

        p.x += p.vx;
        p.y += p.vy;
        
        const outOfBounds = p.x > cachedWindowWidth + 10 || p.x < -10 || p.y < -10 || p.y > cachedH + 10;
        
        if (outOfBounds) {
          // Normal wrap
          if (p.x > cachedWindowWidth + 10) {
            p.x = -10;
            p.y = Math.random() * cachedH;
          } else if (p.x < -10) {
            p.x = cachedWindowWidth + 10;
            p.y = Math.random() * cachedH;
          }
          if (p.y < -10) p.y = cachedH + 10;
          if (p.y > cachedH + 10) p.y = -10;
        }
        
        // Calculate parallax render coordinates
        const parallaxFactor = STARFIELD_CONFIG.parallaxFactor[p.z] * motionMultiplier;
        p.rx = p.x + currentMouseX * parallaxFactor;
        
        // Calculate scroll offset based on depth layer
        const scrollFactor = STARFIELD_CONFIG.scrollFactor[p.z] * motionMultiplier;
        const scrollParallax = currentScrollY * scrollFactor;
        const rawRy = p.y + currentMouseY * parallaxFactor - scrollParallax;
        
        // Mathematically generalize the modulo wrap logic to prevent stars from popping off-screen.
        const bleedMargin = (STARFIELD_CONFIG.baseRadius[2] * 1.2) + Math.sqrt(currentConnectDistSq);
        const wrapH = cachedH + (bleedMargin * 2);
        p.ry = ((rawRy + bleedMargin) % wrapH + wrapH) % wrapH - bleedMargin;

        // Base opacity modulates by layer depth
        const zOpacityFactor = STARFIELD_CONFIG.opacityFactor[p.z];
        const opacity = Math.max(0.05, zOpacityFactor * (1 - p.x / cachedWindowWidth));
        let bIdx = Math.round(opacity * 20);
        if (bIdx < 1) bIdx = 1;
        if (bIdx > 18) bIdx = 18;
        
        const count = particleBucketCounts[bIdx];
        const bucket = particleBuckets[bIdx];
        bucket[count * 3] = p.rx;
        bucket[count * 3 + 1] = p.ry;
        bucket[count * 3 + 2] = p.radius;
        particleBucketCounts[bIdx]++;
      }

      for (let i = 1; i <= 18; i++) {
        const count = particleBucketCounts[i];
        if (count === 0) continue;
        const bucket = particleBuckets[i];
        
        ctx.beginPath();
        for (let j = 0; j < count; j++) {
          const idx = j * 3;
          const rx = bucket[idx];
          const ry = bucket[idx+1];
          const radius = bucket[idx+2];
          ctx.moveTo(rx + radius, ry);
          ctx.arc(rx, ry, radius, 0, Math.PI * 2);
        }
        ctx.fillStyle = `rgba(255, 255, 255, ${i * 0.05})`;
        ctx.fill();
      }

      // Amortize sort: only sort every 10 frames to reduce O(n log n) overhead
      frameCount++;
      if (frameCount % 10 === 0) {
        // Sort by render X for efficient line drawing cutoff
        particles.sort((a, b) => a.rx - b.rx);
      }

      ctx.lineWidth = 0.4;
      
      const currentConnectDist = Math.sqrt(currentConnectDistSq);

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].rx - particles[j].rx;
          if (dx * dx > currentConnectDistSq) break;
          
          if (Math.abs(particles[i].z - particles[j].z) > 1) continue;
          
          const dy = particles[i].ry - particles[j].ry;
          const distSq = dx * dx + dy * dy;
          
          if (distSq < currentConnectDistSq) {
            const dist = Math.sqrt(distSq);
            const lineOpacity = 0.1 * (1 - dist / currentConnectDist);
            if (lineOpacity <= 0.01) continue;
            
            let bIdx = Math.ceil(lineOpacity * 50);
            if (bIdx < 1) bIdx = 1;
            if (bIdx > 5) bIdx = 5;
            
            const count = lineBucketCounts[bIdx];
            if (count < MAX_LINES_PER_BUCKET) {
               const bucket = lineBuckets[bIdx];
               const idx = count * 4;
               bucket[idx] = particles[i].rx;
               bucket[idx+1] = particles[i].ry;
               bucket[idx+2] = particles[j].rx;
               bucket[idx+3] = particles[j].ry;
               lineBucketCounts[bIdx]++;
            }
          }
        }
      }

      for (let i = 1; i <= 5; i++) {
        const count = lineBucketCounts[i];
        if (count === 0) continue;
        const bucket = lineBuckets[i];
        
        ctx.beginPath();
        for (let j = 0; j < count; j++) {
          const idx = j * 4;
          ctx.moveTo(bucket[idx], bucket[idx+1]);
          ctx.lineTo(bucket[idx+2], bucket[idx+3]);
        }
        ctx.strokeStyle = `rgba(255, 255, 255, ${i * 0.02})`;
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
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
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
        width: '100vw', height: '100dvh',
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
        height: '100vh',
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
