# Portfolio — Shreyas K N

A high-fidelity, interactive portfolio built with React, Three.js, and Framer Motion. Desktop-only by design — engineered for precision, not compromise.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| 3D / WebGL | Three.js via @react-three/fiber + @react-three/drei |
| Animation | Framer Motion |
| Build | Vite 8 |
| Styling | Vanilla CSS with CSS custom properties |

## Architecture

```
src/
├── components/
│   ├── CustomCursor.tsx         # Physics-based liquid cursor
│   ├── StarMapBackground.tsx    # Animated star particle canvas
│   ├── canvas/                  # Shared R3F canvas components
│   ├── layout/
│   │   └── OrbNavbar.tsx        # 3D orbiting nav — zero-React rAF loop
│   └── sections/
│       ├── Hero.tsx             # Landing section
│       ├── Skills/              # Interactive particle sphere (R3F)
│       ├── Experience/          # Scroll-driven moon timeline
│       └── Projects/            # Saturn 3D + hanging thread overlay
├── hooks/                       # Custom hooks (reserved)
├── canvas/                      # Reserved for shared 3D primitives
├── index.css                    # Design system tokens + global CSS
└── App.tsx                      # Root with shared R3F Canvas
```

## Key Design Decisions

- **Shared R3F Canvas** (`App.tsx`) — A single `<Canvas>` with `<View.Port>` handles all 3D scenes across sections, preventing the compositor layer cost of multiple WebGL contexts.
- **Zero-React rAF loops** — `OrbNavbar` and `CustomCursor` use raw `requestAnimationFrame` with direct DOM mutation for 60fps animation without triggering React re-renders.
- **`useRef` for Three.js objects** — `ShaderMaterial` and `RingGeometry` are stored in `useRef` (not `useState`) to survive Strict Mode double-invocations without leaking GPU memory.
- **X-sorted connection loop** — The `StarMapBackground` particle connection pass is sorted by X before the O(n²) loop, enabling an early-exit when `dx > connectDist`. Reduces average comparisons by ~60%.
- **Code splitting** — Vite manual chunks separate `three-vendor` and `framer-motion` so the initial JS payload is minimal.
- **WebP images** — Moon phase assets converted from PNG to WebP (moon1: 24KB → 6.6KB, moon2: 14KB → 3.8KB, moon3: 6.9KB → 2.2KB).

## Running

```bash
npm install
npm run dev
```

Runs at `http://localhost:5173` (or next available port).

## Notes

- **Desktop only** — Mobile shows a blocker by design; the cursor-driven interactions don't translate to touch.
- The `canvas/` and `hooks/` directories are scaffolded for future extraction of 3D primitives and reusable hooks.
