// hooks/useBlackHoleAnchor.ts — projects the black hole's world position to a
// screen-space anchor, computed once per resize (NOT per frame). This replaces
// drei's rAF-driven <Html> projection and is the core of the cross-browser fix.
import { useState, useEffect, useMemo } from 'react';

const CAMERA_Z = 8;
const CAMERA_FOV = 45; // degrees

/** Visible world height of the frustum at a given distance from the camera */
function worldHeightAt(distance: number): number {
  return 2 * Math.tan((CAMERA_FOV * Math.PI) / 360) * distance;
}

/**
 * Project a world-space point (on the camera axis plane) to a fraction of
 * viewport height measured from the top. Mirrors drei's Html projection:
 *   fractionFromTop = 0.5 − worldY / (2·d·tan(fov/2))
 */
export function projectToScreenY(worldY: number, worldZ = 0): number {
  const distance = CAMERA_Z - worldZ;
  return 0.5 - worldY / worldHeightAt(distance);
}

/**
 * Adaptive black-hole Y position. The original keyed off R3F's
 * `viewport.height < 7.0`, but that value is the world-space frustum height
 * (≈6.63) — a constant — so the branch never fired. The real signal is the
 * screen aspect ratio. Calibrated so 1080p (aspect ≈1.78) yields 1.0,
 * identical to the original's effective output.
 */
function computePosY(): number {
  const aspect = window.innerWidth / window.innerHeight;
  return aspect >= 1.5 ? 1.0 : 1.4; // wide/short → lower; tall → higher
}

export function useBlackHoleLayout() {
  const [posY, setPosY] = useState(computePosY);

  useEffect(() => {
    const onResize = () => setPosY(computePosY());
    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('orientationchange', onResize, { passive: true });
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, []);

  return useMemo(() => {
    // Overlay anchor: Html was at group-local [0, -0.05, 0] → world [0, posY-0.05, 0]
    const anchorY = projectToScreenY(posY - 0.05, 0);
    // Glow anchor: Html was at group-local [0, 0, -1] → world [0, posY, -1]
    const glowY = projectToScreenY(posY, -1);
    return { posY, anchorY, glowY };
  }, [posY]);
}
