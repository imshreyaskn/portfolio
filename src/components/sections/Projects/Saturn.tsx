// Saturn.tsx — Raymarched black hole with gravitational lensing.
// Quality-adaptive: integration steps are tunable at runtime via uMaxSteps.
import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Matrix4, Vector3 } from 'three';
import type { Group, ShaderMaterial } from 'three';
import { PresentationControls, Billboard } from '@react-three/drei';
import { RAYMARCH_VERTEX, RAYMARCH_FRAGMENT } from './shaders';


interface SaturnProps {
  isPaused?: boolean;
  raymarchSteps?: number;
  circleSegments?: number;
}

export default function Saturn({
  isPaused = false,
  raymarchSteps = 110,
  circleSegments = 32,
}: SaturnProps) {
  const groupRef = useRef<Group>(null);
  const materialRef = useRef<ShaderMaterial>(null);
  const frozenTime = useRef(0);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      u_localCam: { value: new Vector3() },
      u_invMatrix: { value: new Matrix4() },
      uMaxSteps: { value: raymarchSteps },
    }),
    [],
  );

  // Reflect quality-tier changes without rebuilding the material
  useEffect(() => {
    uniforms.uMaxSteps.value = raymarchSteps;
  }, [raymarchSteps, uniforms]);

  useFrame(({ clock, camera }) => {
    if (isPaused) return;
    if (!materialRef.current || !groupRef.current) return;

    const t = clock.getElapsedTime();
    materialRef.current.uniforms.uTime.value = t * 4.5;
    frozenTime.current = t * 4.5;

    // Camera + inverse-group matrix are cheap; always refresh so drag
    // rotation (PresentationControls) keeps lensing correctly.
    const invMat = materialRef.current.uniforms.u_invMatrix.value;
    invMat.copy(groupRef.current.matrixWorld).invert();
    materialRef.current.uniforms.u_localCam.value.copy(camera.position).applyMatrix4(invMat);
  });

  return (
    <group rotation={[0.42, 0.08, -0.06]} scale={0.14}>
      <PresentationControls
        global={false}
        cursor
        speed={1.5}
        polar={[-0.4, 0.4]}
        azimuth={[-0.6, 0.6]}
      >
        <group ref={groupRef}>
          <Billboard>
            <mesh>
              {/* Circle tightly wraps the disk — saves fill-rate vs a quad */}
              <circleGeometry args={[14, circleSegments]} />
              <shaderMaterial
                ref={materialRef}
                transparent
                premultipliedAlpha
                depthWrite={false}
                vertexShader={RAYMARCH_VERTEX}
                fragmentShader={RAYMARCH_FRAGMENT}
                uniforms={uniforms}
              />
            </mesh>
          </Billboard>
        </group>
      </PresentationControls>
    </group>
  );
}
