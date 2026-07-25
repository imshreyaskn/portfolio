import { useEffect, useRef } from 'react';
import { cursorPosition } from '../lib/cursorPosition';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  radius: number;
  alpha: number;
}

const MAX_PARTICLES = 40;
const GRAVITY_STRENGTH = 3500; // your tuning — verified stable, ~24% infall, no NaN
const FRICTION = 0.98;
const SWIRL = 0.25;
const CONSUME_RADIUS = 10;
const SPAWN_PER_SECOND = 18; // time-based, replaces the frame-rate-dependent Math.random()<0.3
const MAX_DPR = 2;
// Pre-computed camera frustum height at z=8, fov=45
const WORLD_HEIGHT = 2 * Math.tan((45 * Math.PI) / 360) * 8;

const GravityDust = ({ active }: { active: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const particles: Particle[] = [];

    // Mutable per-effect state (closure, not refs — never triggers re-render)
    let cssW = 0;
    let cssH = 0;
    let rectLeft = 0;
    let rectTop = 0;
    let spawnAccumulator = 0;
    let clearedWhileIdle = true;
    let raf = 0;
    let lastTime = performance.now();

    // Resize with DPR scaling so particles are crisp on retina displays.
    const measure = (): void => {
      const parent = canvas.parentElement;
      cssW = parent?.clientWidth ?? window.innerWidth;
      cssH = parent?.clientHeight ?? window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // draw in CSS pixels from here on
      const rect = canvas.getBoundingClientRect();
      rectLeft = rect.left;
      rectTop = rect.top;
    };
    measure();

    // Refresh the cached rect on scroll (canvas lives in a scrolling section).
    let scrollRaf = 0;
    const onScroll = (): void => {
      if (scrollRaf) return;
      scrollRaf = requestAnimationFrame(() => {
        scrollRaf = 0;
        const rect = canvas.getBoundingClientRect();
        rectLeft = rect.left;
        rectTop = rect.top;
      });
    };

    window.addEventListener('resize', measure, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });

    const tick = (now: number): void => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      // Idle fast-path: nothing to do, clear once and skip all simulation.
      if (!activeRef.current && particles.length === 0) {
        if (!clearedWhileIdle) {
          ctx.clearRect(0, 0, cssW, cssH);
          clearedWhileIdle = true;
        }
        return;
      }
      clearedWhileIdle = false;
      ctx.clearRect(0, 0, cssW, cssH);

      // Dynamically compute center matching useBlackHoleLayout()
      const aspect = cssW / (cssH || 1);
      const posY = aspect >= 1.5 ? 1.0 : 1.4;
      const singX = cssW * 0.5;
      const singY = cssH * (0.5 - posY / WORLD_HEIGHT);

      // Time-based spawning (frame-rate independent) at the shared cursor position.
      if (activeRef.current && cursorPosition.active) {
        spawnAccumulator += dt * SPAWN_PER_SECOND;
        const cx = cursorPosition.x - rectLeft;
        const cy = cursorPosition.y - rectTop;
        while (spawnAccumulator >= 1 && particles.length < MAX_PARTICLES) {
          spawnAccumulator -= 1;
          particles.push({
            x: cx + (Math.random() - 0.5) * 20,
            y: cy + (Math.random() - 0.5) * 20,
            vx: (Math.random() - 0.5) * 50,
            vy: (Math.random() - 0.5) * 50,
            life: 0,
            maxLife: 3.5 + Math.random() * 3.5,
            radius: (Math.random() * 0.8 + 0.4) * 1.6,
            alpha: Math.random() * 0.3 + 0.15,
          });
        }
      } else {
        spawnAccumulator = 0;
      }

      // Query DPR once per tick (ponytail: hoist window object reads out of loop)
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);

      // In-place compaction — no per-frame array allocation.
      let write = 0;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.life += dt;

        const gx = singX - p.x;
        const gy = singY - p.y;
        const dist = Math.sqrt(gx * gx + gy * gy) + 1;

        if (dist < CONSUME_RADIUS || p.life >= p.maxLife) continue; // consumed / faded

        const force = GRAVITY_STRENGTH / Math.pow(dist, 0.8);
        const nx = gx / dist;
        const ny = gy / dist;
        p.vx += (nx * force + -ny * force * SWIRL) * dt;
        p.vy += (ny * force + nx * force * SWIRL) * dt;
        p.vx *= FRICTION;
        p.vy *= FRICTION;
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        const lifeRatio = p.life / p.maxLife;
        let fade = 1;
        if (lifeRatio < 0.1) fade = lifeRatio / 0.1;
        else if (lifeRatio > 0.8) fade = 1 - (lifeRatio - 0.8) / 0.2;

        // Velocity-based spaghettification
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        const stretch = 1 + speed * 0.008;
        const heading = Math.atan2(p.vy, p.vx);

        const cos_h = Math.cos(heading);
        const sin_h = Math.sin(heading);
        const rs = p.radius * stretch;
        ctx.setTransform(cos_h * rs * dpr, sin_h * rs * dpr, -sin_h * p.radius * dpr, cos_h * p.radius * dpr, p.x * dpr, p.y * dpr);
        ctx.beginPath();
        ctx.arc(0, 0, 1, 0, TAU);
        ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha * fade})`;
        ctx.fill();

        particles[write++] = p;
      }
      particles.length = write;
      // Reset transform after setTransform-based particle rendering
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    // Pause entirely when the tab is hidden (battery).
    const onVisibility = (): void => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else if (!raf) {
        lastTime = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      if (scrollRaf) cancelAnimationFrame(scrollRaf);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 15,
        pointerEvents: 'none',
        opacity: active ? 1 : 0,
        transition: 'opacity 0.5s ease',
      }}
      aria-hidden="true"
    />
  );
};

const TAU = Math.PI * 2;
export default GravityDust;
