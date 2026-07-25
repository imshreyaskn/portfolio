// lib/readiness.ts — the Arrival's readiness gates.
// Every line on screen maps to a real promise. Nothing theatrical is fake.
import { RAYMARCH_VERTEX, RAYMARCH_FRAGMENT } from '../components/sections/Projects/Saturn';
import { RING_VERTEX_SHADER, RING_FRAGMENT_SHADER } from '../components/sections/Skills/ParticleSphere';

export type LineState = 'queued' | 'working' | 'done';

export const READINESS_LINES = [
  { id: 'optics',   label: 'warming the optics' },
  { id: 'type',     label: 'setting the type' },
  { id: 'portrait', label: 'developing the portrait' },
] as const;

export type ReadinessLineId = (typeof READINESS_LINES)[number]['id'];

export const DWELL_MS = 2000;         // min 2 secs of loading
export const REVISIT_DWELL_MS = 2000; // min 2 secs for revisits too
export const TASK_TIMEOUT_MS = 3500;  // per-task leash
export const HARD_CAP_MS = 5000;      // the doors ALWAYS open, no matter what

export const withTimeout = (p: Promise<unknown>, ms: number): Promise<void> =>
  new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    p.then(
      () => { clearTimeout(timer); resolve(); },
      () => { clearTimeout(timer); resolve(); },
    );
  });

/**
 * Compile + link + one draw call on a throwaway context.
 * Warms the driver's shader binary cache BEFORE the real scenes get their
 * first visible frame, so the raymarcher doesn't hitch on reveal.
 * Best-effort: any failure resolves silently.
 */
export async function warmUpShaders(sources: { vs: string; fs: string }[]): Promise<void> {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const gl = (canvas.getContext('webgl2') ||
      canvas.getContext('webgl')) as WebGLRenderingContext | null;
    if (!gl) return;

    for (const { vs, fs } of sources) {
      const compile = (type: number, src: string) => {
        const shader = gl.createShader(type);
        if (!shader) throw new Error('shader alloc failed');
        gl.shaderSource(shader, src);
        gl.compileShader(shader);
        return shader;
      };
      const v = compile(gl.VERTEX_SHADER, vs);
      const f = compile(gl.FRAGMENT_SHADER, fs);
      const prog = gl.createProgram();
      if (!prog) throw new Error('program alloc failed');
      gl.attachShader(prog, v);
      gl.attachShader(prog, f);
      gl.linkProgram(prog);
      gl.useProgram(prog);
      gl.drawArrays(gl.POINTS, 0, 1); // forces the driver to finish compilation
      gl.deleteProgram(prog);
      gl.deleteShader(v);
      gl.deleteShader(f);
    }
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  } catch {
    /* never block arrival on warm-up failure */
  }
}

const loadFonts = async () => {
  if (typeof document === 'undefined' || !('fonts' in document)) return;
  await Promise.all([
    document.fonts.load('400 96px "Italiana"'),
    document.fonts.load('300 16px "Jost"'),
    document.fonts.load('400 16px "Jost"'),
    document.fonts.load('300 16px "Inter"'),
  ]).catch(() => {});
};

const decodeHeroFigure = async () => {
  const img = new Image();
  img.src = '/hero-figure.webp'; // same URL as <Hero> → shared cache entry
  if (typeof img.decode === 'function') {
    await img.decode().catch(() => {});
  } else {
    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.onerror = () => resolve();
    });
  }
};

export interface ReadinessTask {
  id: ReadinessLineId;
  weight: number;
  run: () => Promise<unknown>;
}

export const buildReadinessTasks = (): ReadinessTask[] => [
  {
    id: 'optics',
    weight: 0.35,
    run: () =>
      warmUpShaders([
        { vs: RAYMARCH_VERTEX, fs: RAYMARCH_FRAGMENT },
        { vs: RING_VERTEX_SHADER, fs: RING_FRAGMENT_SHADER },
      ]),
  },
  { id: 'type', weight: 0.25, run: loadFonts },
  { id: 'portrait', weight: 0.25, run: decodeHeroFigure },
];
