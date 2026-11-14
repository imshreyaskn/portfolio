import type { RefObject } from 'react';
import { useFrame } from '@react-three/fiber';

/**
 * Takes over r3f's render step and only draws while `active`.
 *
 * Any useFrame with a positive priority disables r3f's automatic render, so
 * this component decides when gl.render runs. The GPU work (the expensive
 * part, e.g. the black-hole raymarcher) stops while the section is offscreen,
 * but the Canvas props never change. Toggling <Canvas frameloop> instead made
 * r3f re-render the whole scene graph, including drei <Html> labels, and cost
 * a ~230ms hitch the first time the section scrolled into view. `activeRef`
 * is a ref (not a prop) for the same reason: flipping it re-renders nothing.
 */
export default function RenderGate({ activeRef }: { activeRef: RefObject<boolean> }) {
  useFrame(({ gl, scene, camera }) => {
    if (activeRef.current) gl.render(scene, camera);
  }, 1);
  return null;
}
