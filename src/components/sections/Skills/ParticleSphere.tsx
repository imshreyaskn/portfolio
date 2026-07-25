// ParticleSphere.tsx — R3F interactive particle sphere with ring selector
import { useMemo, useRef, useEffect, memo, useCallback } from 'react';
import {
  Vector3, Matrix4, Ray, Color,
  ShaderMaterial, DoubleSide, RingGeometry,
  Points, PointsMaterial, Group,
} from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { SKILLS_DATA, CATEGORY_COUNT } from './data';
import type { ViewportContext } from '../../../hooks/useViewport';

/* ─── Constants ─── */

const GLOBAL_OFFSET = -Math.PI / 10;
const SLICE_ANGLE = (Math.PI * 2) / CATEGORY_COUNT;
const IDLE_ROTATION_SPEED_Y = 0.15;
const IDLE_ROTATION_SPEED_X = 0.05;
const PARTICLE_LERP_FACTOR = 10;
const MORPH_LERP_FACTOR = 12;
const SETTLE_THRESHOLD_SQ = 1e-6;

/* ─── Shader Source ─── */

export const RING_VERTEX_SHADER = /* glsl */ `
  uniform float uMorph;
  uniform float uRadius;
  varying vec3 vWorldPos;

  void main() {
    float PI = 3.141592653589793;
    float sliceAngle = (PI * 2.0) / ${CATEGORY_COUNT}.0;
    float midAngle = sliceAngle / 2.0;
    float maxDist = sliceAngle / 2.0;

    float bx = position.x;
    float by = position.y;
    float angleBase = atan(by, bx);
    float rBase = length(vec2(bx, by));

    float angleDist = angleBase - midAngle;
    float targetAngle = midAngle + (angleDist * 0.15);
    float currentAngle = mix(angleBase, targetAngle, uMorph);

    float distNorm = abs(angleBase - midAngle) / maxDist;
    float pushOut = 0.02;
    float pullIn = 0.08;
    float thicknessBoost = rBase > (uRadius + 0.252) ? 0.006 : 0.0;

    float arrowR = rBase + thicknessBoost + pushOut - ((pushOut + pullIn) * distNorm);
    float currentR = mix(rBase, arrowR, uMorph);

    vec3 deformed = vec3(
      cos(currentAngle) * currentR,
      sin(currentAngle) * currentR,
      position.z
    );

    vec4 worldPosition = modelMatrix * vec4(deformed, 1.0);
    vWorldPos = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

export const RING_FRAGMENT_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uMorph;
  uniform vec3 uColor;
  uniform vec3 uHighlightColor;
  varying vec3 vWorldPos;

  void main() {
    float sweep = fract((uTime * 0.2) - (vWorldPos.x * 0.3));
    float shine = smoothstep(0.3, 0.5, sweep) * smoothstep(0.7, 0.5, sweep);

    vec3 finalColor = mix(uColor, uHighlightColor, shine);
    finalColor = mix(finalColor, uHighlightColor, uMorph);

    float idleOpacity = 0.5 + (shine * 0.5);
    float finalOpacity = mix(idleOpacity, 1.0, uMorph);

    gl_FragColor = vec4(finalColor, finalOpacity);
  }
`;

/* ─── Types ─── */

interface ParticleSphereProps {
  count?: number;
  radius?: number;
  onSelect?: (index: number) => void;
  portalRef?: React.RefObject<HTMLDivElement | null>;
  isPaused?: boolean;
  viewport: ViewportContext;
}

/* ─── Component ─── */

const ParticleSphere = memo(function ParticleSphere({
  count = 300,
  radius = 0.5,
  onSelect,
  portalRef,
  isPaused = false,
  viewport,
}: ParticleSphereProps) {
  const { isMobile, interactionMode } = viewport;
  const isTouchPrimary = interactionMode !== 'pointer';

  /* ── Refs ── */
  const pointsRef = useRef<Points>(null);
  const materialRef = useRef<PointsMaterial>(null);
  const ringGroupRef = useRef<Group>(null);
  const arcRefs = useRef<(Group | null)[]>([]);
  const textRefs = useRef<(HTMLDivElement | null)[]>([]);
  const pointerRef = useRef({ x: 0, y: 0 });
  const isInteracting = useRef(false);
  const isHolding = useRef(false);
  const isSettled = useRef(false);
  const onSelectRef = useRef(onSelect);

  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);

  /* ── Shader material & geometry via useMemo (not render-body side effect) ── */
  const ringMaterial = useMemo(() => {
    return new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
      uniforms: {
        uTime: { value: 0 },
        uMorph: { value: 0 },
        uRadius: { value: radius },
        uColor: { value: new Color(0x7a7a8c) },
        uHighlightColor: { value: new Color(0xffffff) },
      },
      vertexShader: RING_VERTEX_SHADER,
      fragmentShader: RING_FRAGMENT_SHADER,
    });
  }, [radius]);

  const ringGeometry = useMemo(() => {
    return new RingGeometry(
      radius + 0.25,
      radius + 0.254,
      32,
      1,
      0,
      SLICE_ANGLE,
    );
  }, [radius]);

  // Dispose on unmount
  useEffect(() => {
    return () => {
      ringMaterial.dispose();
      ringGeometry.dispose();
    };
  }, [ringMaterial, ringGeometry]);

  /* ── Pre-allocated math objects (zero GC in the frame loop) ── */
  const tempVec = useMemo(() => new Vector3(), []);
  const particleBase = useMemo(() => new Vector3(), []);
  const closestPoint = useMemo(() => new Vector3(), []);
  const localRay = useMemo(() => new Ray(), []);
  const invMatrix = useMemo(() => new Matrix4(), []);

  /* ── Fibonacci sphere base positions ── */
  const basePositions = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const phi = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const theta = phi * i;
      positions[i * 3] = Math.cos(theta) * r * radius;
      positions[i * 3 + 1] = y * radius;
      positions[i * 3 + 2] = Math.sin(theta) * r * radius;
    }
    return positions;
  }, [count, radius]);

  const dynamicPositions = useMemo(
    () => new Float32Array(basePositions),
    [basePositions],
  );

  /* ── Pre-computed arc trig (stable across renders) ── */
  const arcAngleData = useMemo(() => {
    return SKILLS_DATA.map((_, i) => {
      const centerAngle = i * SLICE_ANGLE + SLICE_ANGLE / 2;
      const worldAngle = centerAngle + GLOBAL_OFFSET;
      return { centerAngle, cos: Math.cos(worldAngle), sin: Math.sin(worldAngle) };
    });
  }, []);

  /* ── Pointer handlers ── */
  const handlePointerMove = useCallback(() => {
    isInteracting.current = true;
    isSettled.current = false;
  }, []);

  const handlePointerDown = useCallback(() => {
    isInteracting.current = true;
    isHolding.current = true;
    isSettled.current = false;
  }, []);

  const handlePointerUp = useCallback(() => {
    isHolding.current = false;
  }, []);

  const handlePointerOut = useCallback(() => {
    isInteracting.current = false;
  }, []);

  /* ── Global pointerup for selection (fires even if released outside canvas) ── */
  useEffect(() => {
    const handleGlobalUp = () => {
      if (!isHolding.current) return;
      isHolding.current = false;

      const { x: px, y: py } = pointerRef.current;
      const dist = Math.sqrt(px * px + py * py);
      if (dist <= 0.3) return; // Too close to center — no selection

      let angle = Math.atan2(py, px) - GLOBAL_OFFSET;
      if (angle < 0) angle += Math.PI * 2;
      if (angle >= Math.PI * 2) angle -= Math.PI * 2;

      const index = Math.floor(angle / SLICE_ANGLE);
      onSelectRef.current?.(index);
    };

    window.addEventListener('pointerup', handleGlobalUp);
    return () => window.removeEventListener('pointerup', handleGlobalUp);
  }, []);

  /* ── Frame loop (split into logical phases with early exits) ── */
  useFrame((state, delta) => {
    if (isPaused) return;

    // Capture pointer position when active
    if (isInteracting.current || isHolding.current) {
      pointerRef.current.x = state.pointer.x;
      pointerRef.current.y = state.pointer.y;
    }

    // Break hold if pointer drifts too far from center
    if (isHolding.current) {
      const dist = Math.hypot(state.pointer.x, state.pointer.y);
      if (dist > 0.75) isHolding.current = false;
    }

    if (!pointsRef.current) return;

    /* Phase 1: Idle rotation (skipped if reduced motion) */
    pointsRef.current.rotation.y += delta * IDLE_ROTATION_SPEED_Y;
    pointsRef.current.rotation.x += delta * IDLE_ROTATION_SPEED_X;

    /* Phase 2: Particle physics */
    if (isInteracting.current) isSettled.current = false;

    if (!isSettled.current) {
      const positions = pointsRef.current.geometry.attributes.position
        .array as Float32Array;

      if (isInteracting.current) {
        invMatrix.copy(pointsRef.current.matrixWorld).invert();
        localRay.copy(state.raycaster.ray).applyMatrix4(invMatrix);
      }

      const morph = ringGroupRef.current?.userData.morphFactor ?? 0;
      const blastRadius = 0.3 + 0.5 * morph;
      const blastRadiusSq = blastRadius * blastRadius;
      const maxRepulsion = 0.2 + 0.3 * morph;
      let maxDiffSq = 0;

      for (let i = 0; i < count; i++) {
        const ix = i * 3;
        const iy = ix + 1;
        const iz = ix + 2;

        let targetX = basePositions[ix];
        let targetY = basePositions[iy];
        let targetZ = basePositions[iz];

        if (isInteracting.current) {
          particleBase.set(targetX, targetY, targetZ);
          localRay.closestPointToPoint(particleBase, closestPoint);
          const distSq = particleBase.distanceToSquared(closestPoint);

          if (distSq < blastRadiusSq && distSq > 1e-4) {
            const dist = Math.sqrt(distSq);
            const force = (blastRadius - dist) / blastRadius;
            const scalar = (force * maxRepulsion) / dist;
            tempVec.subVectors(particleBase, closestPoint).multiplyScalar(scalar);
            targetX += tempVec.x;
            targetY += tempVec.y;
            targetZ += tempVec.z;
          }
        }

        const diffX = targetX - positions[ix];
        const diffY = targetY - positions[iy];
        const diffZ = targetZ - positions[iz];

        positions[ix] += diffX * PARTICLE_LERP_FACTOR * delta;
        positions[iy] += diffY * PARTICLE_LERP_FACTOR * delta;
        positions[iz] += diffZ * PARTICLE_LERP_FACTOR * delta;

        if (!isInteracting.current) {
          const dSq = diffX * diffX + diffY * diffY + diffZ * diffZ;
          if (dSq > maxDiffSq) maxDiffSq = dSq;
        }
      }

      // Snap to base and stop updating when settled
      if (!isInteracting.current && maxDiffSq < SETTLE_THRESHOLD_SQ) {
        positions.set(basePositions); // single typed-array copy
        isSettled.current = true;
      }

      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }

    /* Phase 3: Point glow (size + opacity lerp) */
    if (materialRef.current) {
      const mat = materialRef.current;
      const targetSize = isHolding.current ? 0.024 : 0.012;
      const targetOpacity = isHolding.current ? 1.0 : 0.8;

      const sizeDiff = targetSize - mat.size;
      const opacityDiff = targetOpacity - mat.opacity;

      mat.size = Math.abs(sizeDiff) > 1e-4
        ? mat.size + sizeDiff * MORPH_LERP_FACTOR * delta
        : targetSize;
      mat.opacity = Math.abs(opacityDiff) > 1e-4
        ? mat.opacity + opacityDiff * MORPH_LERP_FACTOR * delta
        : targetOpacity;
    }

    /* Phase 4: Ring billboard + morph + label animation */
    if (!ringGroupRef.current) return;
    const ringGroup = ringGroupRef.current;

    // Billboard: always face camera
    ringGroup.quaternion.copy(state.camera.quaternion);

    // Morph interpolation
    const targetMorph = isHolding.current ? 1.0 : 0.0;
    const prevMorph: number = ringGroup.userData.morphFactor ?? 0;
    let morph = prevMorph + (targetMorph - prevMorph) * MORPH_LERP_FACTOR * delta;
    if (Math.abs(morph - targetMorph) < 1e-4) morph = targetMorph;
    ringGroup.userData.morphFactor = morph;

    // Shader time (always advances for idle sweep)
    ringMaterial.uniforms.uTime.value = state.clock.elapsedTime;

    // Only update morph uniform + DOM when morph is active or changing
    if (morph !== prevMorph || morph > 0) {
      ringMaterial.uniforms.uMorph.value = morph;

      for (let i = 0; i < textRefs.current.length; i++) {
        const txt = textRefs.current[i];
        if (!txt) continue;
        txt.style.opacity = String(morph);
        txt.style.display = morph > 0.01 ? 'block' : 'none';
      }
    }

    // Arc positions + label effects
    let pointerAngle = 0;
    let pointerDist = 0;
    if (isHolding.current) {
      const { x: px, y: py } = pointerRef.current;
      pointerAngle = Math.atan2(py, px) - GLOBAL_OFFSET;
      if (pointerAngle < 0) pointerAngle += Math.PI * 2;
      if (pointerAngle >= Math.PI * 2) pointerAngle -= Math.PI * 2;
      pointerDist = Math.hypot(px, py);
    }

    const baseOffset = isHolding.current ? 0.4 : 0;

    for (let i = 0; i < arcRefs.current.length; i++) {
      const arc = arcRefs.current[i];
      if (!arc) continue;

      const { centerAngle, cos, sin } = arcAngleData[i];
      let arcTargetOffset = baseOffset;

      if (isHolding.current && pointerDist > 0.1) {
        let angleDiff = Math.abs(pointerAngle - centerAngle);
        if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

        const aimAccuracy = Math.max(0, 1 - angleDiff / (Math.PI / 3));
        const dragIntensity = Math.min(1, (pointerDist - 0.1) / 0.5);
        const selectionIntensity = aimAccuracy * dragIntensity;

        arcTargetOffset += 0.3 * selectionIntensity;

        const txt = textRefs.current[i];
        if (txt) {
          if (selectionIntensity > 0.1) {
            txt.style.filter =
              `drop-shadow(0 0 ${20 * selectionIntensity}px rgba(107,156,255,${selectionIntensity * 1.5})) ` +
              `drop-shadow(0 0 ${10 * selectionIntensity}px rgba(255,255,255,${selectionIntensity})) ` +
              `brightness(${1 + selectionIntensity * 1.2})`;
            txt.style.transform = `scale(${1 + selectionIntensity * 0.2})`;
            txt.style.transition = 'none';
          } else {
            txt.style.filter = 'none';
            txt.style.transform = 'scale(1)';
          }
        }
      } else {
        const txt = textRefs.current[i];
        if (txt) {
          txt.style.filter = 'none';
          txt.style.transform = 'scale(1)';
          txt.style.transition = 'all 0.2s ease-out';
        }
      }

      // Lerp arc position
      const targetX = cos * arcTargetOffset;
      const targetY = sin * arcTargetOffset;
      const dx = targetX - arc.position.x;
      const dy = targetY - arc.position.y;

      arc.position.x = Math.abs(dx) > 1e-4
        ? arc.position.x + dx * MORPH_LERP_FACTOR * delta
        : targetX;
      arc.position.y = Math.abs(dy) > 1e-4
        ? arc.position.y + dy * MORPH_LERP_FACTOR * delta
        : targetY;
    }
  });

  /* ── Render ── */
  return (
    <group>
      {/* Invisible hit sphere for raycasting */}
      <mesh
        onPointerMove={isTouchPrimary ? undefined : handlePointerMove}
        onPointerOut={isTouchPrimary ? undefined : handlePointerOut}
        onPointerDown={isTouchPrimary ? undefined : handlePointerDown}
        onPointerUp={isTouchPrimary ? undefined : handlePointerUp}
      >
        <sphereGeometry args={[radius, 16, 16]} />
        <meshBasicMaterial visible={false} />
      </mesh>

      {/* Ring arcs + labels */}
      <group ref={ringGroupRef}>
        {SKILLS_DATA.map((skill, i) => {
          const rotation = i * SLICE_ANGLE + GLOBAL_OFFSET;
          const tipAngle = rotation + SLICE_ANGLE / 2;
          const textDist = radius + 0.65;
          const textX = Math.cos(tipAngle) * textDist;
          const textY = Math.sin(tipAngle) * textDist;

          return (
            <group key={skill.id} ref={(el) => { arcRefs.current[i] = el; }}>
              <mesh
                rotation={[0, 0, rotation]}
                material={ringMaterial}
                geometry={ringGeometry}
              />
              <Html
                position={[textX, textY, 0]}
                center
                zIndexRange={[100, 0]}
                portal={portalRef as any}
              >
                <div
                  ref={(el) => { textRefs.current[i] = el; }}
                  className={isMobile ? 'skills-3d-label-mobile' : 'silver-glow-text label'}
                  style={{
                    opacity: 0,
                    display: 'none',
                    pointerEvents: 'none',
                    whiteSpace: 'nowrap',
                    ...(isMobile ? {} : { fontSize: '14px', letterSpacing: '0.15em' }),
                  }}
                >
                  {isMobile ? (
                    <skill.icon
                      size={20}
                      style={{
                        fill: 'url(#animatedPremiumGrad)',
                        filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.3))',
                      }}
                    />
                  ) : (
                    skill.category
                  )}
                </div>
              </Html>
            </group>
          );
        })}
      </group>

      {/* Particle cloud */}
      <points ref={pointsRef} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={count}
            array={dynamicPositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          ref={materialRef}
          size={0.012}
          color="#FFFFFF"
          transparent
          opacity={0.8}
          sizeAttenuation
          depthWrite={false}
        />
      </points>
    </group>
  );
});

export default ParticleSphere;
