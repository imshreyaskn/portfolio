// ParticleSphere.tsx — R3F interactive particle sphere with ring select
// 1:1 desktop/mobile: rest = bare sphere, hold = repel +
// icons fade in, drag-release = select. Desktop path unchanged except the
// morph-guard perf fix; mobile skips all per-frame label DOM writes.
import { useMemo, useRef, useEffect, memo, useCallback } from 'react';
import {
  Vector3, Matrix4, Ray, Color,
  ShaderMaterial, DoubleSide, RingGeometry,
  Points, PointsMaterial, Group,
} from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { SKILLS_DATA, CATEGORY_COUNT } from './data';

const GLOBAL_OFFSET = -Math.PI / 10;
const SLICE_ANGLE = (Math.PI * 2) / CATEGORY_COUNT;
const IDLE_ROT_Y = 0.15;
const IDLE_ROT_X = 0.05;
const PARTICLE_LERP = 10;
const MORPH_LERP = 12;
const SETTLE_SQ = 1e-6;
// Local radius of the chevron (ring-arc) tip; mobile labels hug just outside it.
const RING_TIP = 0.774;

export const RING_VERTEX_SHADER = /* glsl */ `
  uniform float uMorph;
  uniform float uRadius;
  varying vec3 vWorldPos;
  void main() {
    float PI = 3.141592653589793;
    float sliceAngle = (PI * 2.0) / ${CATEGORY_COUNT}.0;
    float midAngle = sliceAngle / 2.0;
    float maxDist = sliceAngle / 2.0;
    float bx = position.x, by = position.y;
    float angleBase = atan(by, bx);
    float rBase = length(vec2(bx, by));
    float angleDist = angleBase - midAngle;
    float targetAngle = midAngle + (angleDist * 0.15);
    float currentAngle = mix(angleBase, targetAngle, uMorph);
    float distNorm = abs(angleBase - midAngle) / maxDist;
    float pushOut = 0.02, pullIn = 0.08;
    float thicknessBoost = rBase > (uRadius + 0.252) ? 0.006 : 0.0;
    float arrowR = rBase + thicknessBoost + pushOut - ((pushOut + pullIn) * distNorm);
    float currentR = mix(rBase, arrowR, uMorph);
    vec3 deformed = vec3(cos(currentAngle) * currentR, sin(currentAngle) * currentR, position.z);
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
    gl_FragColor = vec4(finalColor, mix(idleOpacity, 1.0, uMorph));
  }
`;

interface ParticleSphereProps {
  count?: number;
  radius?: number;
  onSelect?: (index: number) => void;
  portalRef?: React.RefObject<HTMLDivElement | null>;
  isPaused?: boolean;
  isMobile?: boolean;
}

const ParticleSphere = memo(function ParticleSphere({
  count = 300,
  radius = 0.5,
  onSelect,
  portalRef,
  isPaused = false,
  isMobile = false,
}: ParticleSphereProps) {
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
  const isMobileRef = useRef(isMobile);
  const aimedRef = useRef(-1);
  const labelsShownRef = useRef(false);

  // new refs, alongside the existing ones
  const holdPending = useRef(false);
  const holdStartPos = useRef({ x: 0, y: 0 });
  const holdStartTime = useRef(0);

  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);
  useEffect(() => { isMobileRef.current = isMobile; }, [isMobile]);

  const ringMaterial = useMemo(() => new ShaderMaterial({
    transparent: true, depthWrite: false, side: DoubleSide,
    uniforms: {
      uTime: { value: 0 }, uMorph: { value: 0 }, uRadius: { value: radius },
      uColor: { value: new Color(0x7a7a8c) }, uHighlightColor: { value: new Color(0xffffff) },
    },
    vertexShader: RING_VERTEX_SHADER, fragmentShader: RING_FRAGMENT_SHADER,
  }), [radius]);

  const ringGeometry = useMemo(
    () => new RingGeometry(radius + 0.25, radius + 0.254, 32, 1, 0, SLICE_ANGLE),
    [radius],
  );

  useEffect(() => () => { ringMaterial.dispose(); ringGeometry.dispose(); }, [ringMaterial, ringGeometry]);

  const tempVec = useMemo(() => new Vector3(), []);
  const particleBase = useMemo(() => new Vector3(), []);
  const closestPoint = useMemo(() => new Vector3(), []);
  const localRay = useMemo(() => new Ray(), []);
  const invMatrix = useMemo(() => new Matrix4(), []);

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

  const dynamicPositions = useMemo(() => new Float32Array(basePositions), [basePositions]);

  const arcAngleData = useMemo(() => SKILLS_DATA.map((_, i) => {
    const worldAngle = i * SLICE_ANGLE + SLICE_ANGLE / 2 + GLOBAL_OFFSET;
    return { cos: Math.cos(worldAngle), sin: Math.sin(worldAngle) };
  }), []);

  const handlePointerMove = useCallback(() => { isInteracting.current = true; isSettled.current = false; }, []);
  const handlePointerDown = useCallback((e: any) => {
    isInteracting.current = true;
    isSettled.current = false;
    if (isMobileRef.current) {
      // Don't commit to "hold" yet — wait a beat to see if this is a
      // scroll swipe or a deliberate press-and-hold.
      holdPending.current = true;
      holdStartPos.current.x = e.pointer?.x ?? 0;
      holdStartPos.current.y = e.pointer?.y ?? 0;
      holdStartTime.current = performance.now();
    } else {
      isHolding.current = true;
    }
  }, []);
  const handlePointerUp = useCallback(() => { isHolding.current = false; }, []);
  const handlePointerOut = useCallback(() => { isInteracting.current = false; }, []);

  useEffect(() => {
    const handleGlobalUp = () => {
      if (isHolding.current) {
        const { x: px, y: py } = pointerRef.current;
        const dist = Math.hypot(px, py);
        const threshold = isMobileRef.current ? 0.15 : 0.3;
        if (dist > threshold) {
          let angle = Math.atan2(py, px) - GLOBAL_OFFSET;
          if (angle < 0) angle += Math.PI * 2;
          if (angle >= Math.PI * 2) angle -= Math.PI * 2;
          onSelectRef.current?.(Math.floor(angle / SLICE_ANGLE));
        }
      }
      isHolding.current = false;
      holdPending.current = false; // NEW
    };
    window.addEventListener('pointerup', handleGlobalUp);
    window.addEventListener('pointercancel', handleGlobalUp);
    return () => {
      window.removeEventListener('pointerup', handleGlobalUp);
      window.removeEventListener('pointercancel', handleGlobalUp);
    };
  }, []);

  useFrame((state, delta) => {
    if (isPaused) return;

    // Mobile-only gesture arbitration: a fast/large movement within the
    // first ~120ms reads as "scrolling past", so we bail out of the hold
    // entirely instead of racing the browser for the gesture.
    if (isMobileRef.current && holdPending.current) {
      const dx = state.pointer.x - holdStartPos.current.x;
      const dy = state.pointer.y - holdStartPos.current.y;
      const moved = Math.hypot(dx, dy);
      const elapsed = performance.now() - holdStartTime.current;
      const MOVE_ABORT_THRESHOLD = 0.06; // normalized device coords
      const TIME_TO_COMMIT = 120; // ms

      if (moved > MOVE_ABORT_THRESHOLD) {
        holdPending.current = false;
        isInteracting.current = false; // let it settle back, this was a scroll
      } else if (elapsed > TIME_TO_COMMIT) {
        holdPending.current = false;
        isHolding.current = true; // confirmed deliberate hold
      }
      // else: still ambiguous, wait another frame
    }

    if (isInteracting.current || isHolding.current) {
      pointerRef.current.x = state.pointer.x;
      pointerRef.current.y = state.pointer.y;
    }
    if (isHolding.current && Math.hypot(state.pointer.x, state.pointer.y) > 0.75) {
      isHolding.current = false;
    }
    if (!pointsRef.current) return;

    pointsRef.current.rotation.y += delta * IDLE_ROT_Y;
    pointsRef.current.rotation.x += delta * IDLE_ROT_X;

    if (isInteracting.current) isSettled.current = false;
    if (!isSettled.current) {
      const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
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
        const ix = i * 3, iy = ix + 1, iz = ix + 2;
        let tx = basePositions[ix], ty = basePositions[iy], tz = basePositions[iz];

        if (isInteracting.current) {
          particleBase.set(tx, ty, tz);
          localRay.closestPointToPoint(particleBase, closestPoint);
          const dSq = particleBase.distanceToSquared(closestPoint);
          if (dSq < blastRadiusSq && dSq > 1e-4) {
            const d = Math.sqrt(dSq);
            const s = ((blastRadius - d) / blastRadius * maxRepulsion) / d;
            tempVec.subVectors(particleBase, closestPoint).multiplyScalar(s);
            tx += tempVec.x; ty += tempVec.y; tz += tempVec.z;
          }
        }

        const dx = tx - positions[ix], dy = ty - positions[iy], dz = tz - positions[iz];
        positions[ix] += dx * PARTICLE_LERP * delta;
        positions[iy] += dy * PARTICLE_LERP * delta;
        positions[iz] += dz * PARTICLE_LERP * delta;

        if (!isInteracting.current) {
          const m = dx * dx + dy * dy + dz * dz;
          if (m > maxDiffSq) maxDiffSq = m;
        }
      }

      if (!isInteracting.current && maxDiffSq < SETTLE_SQ) {
        positions.set(basePositions);
        isSettled.current = true;
      }
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }

    if (materialRef.current) {
      const mat = materialRef.current;
      const tSize = isHolding.current ? 0.024 : 0.012;
      const tOpac = isHolding.current ? 1.0 : 0.8;
      const ds = tSize - mat.size, dop = tOpac - mat.opacity;
      mat.size = Math.abs(ds) > 1e-4 ? mat.size + ds * MORPH_LERP * delta : tSize;
      mat.opacity = Math.abs(dop) > 1e-4 ? mat.opacity + dop * MORPH_LERP * delta : tOpac;
    }

    if (!ringGroupRef.current) return;
    const ringGroup = ringGroupRef.current;
    ringGroup.quaternion.copy(state.camera.quaternion);

    const targetMorph = isHolding.current ? 1.0 : 0.0;
    const prevMorph: number = ringGroup.userData.morphFactor ?? 0;
    let morph = prevMorph + (targetMorph - prevMorph) * MORPH_LERP * delta;
    if (Math.abs(morph - targetMorph) < 1e-4) morph = targetMorph;
    ringGroup.userData.morphFactor = morph;

    ringMaterial.uniforms.uTime.value = state.clock.elapsedTime;

    if (morph !== prevMorph) {
      ringMaterial.uniforms.uMorph.value = morph;
      const shown = morph > 0.01;
      if (shown !== labelsShownRef.current) {
        labelsShownRef.current = shown;
        if (!isMobile) {
          for (let i = 0; i < textRefs.current.length; i++) {
            const t = textRefs.current[i];
            if (t) t.style.display = shown ? 'block' : 'none';
          }
        }
      }
      for (let i = 0; i < textRefs.current.length; i++) {
        const t = textRefs.current[i];
        if (t) t.style.opacity = String(morph);
      }
    }

    let pointerAngle = 0, pointerDist = 0;
    if (isHolding.current) {
      const { x: px, y: py } = pointerRef.current;
      pointerAngle = Math.atan2(py, px) - GLOBAL_OFFSET;
      if (pointerAngle < 0) pointerAngle += Math.PI * 2;
      if (pointerAngle >= Math.PI * 2) pointerAngle -= Math.PI * 2;
      pointerDist = Math.hypot(px, py);
    }
    const baseOffset = isHolding.current ? 0.4 : 0;
    let aimedIdx = -1, aimedIntensity = 0.1;

    for (let i = 0; i < arcRefs.current.length; i++) {
      const arc = arcRefs.current[i];
      if (!arc) continue;
      const { cos, sin } = arcAngleData[i];
      let arcTargetOffset = baseOffset;

      if (isHolding.current && pointerDist > 0.1) {
        let angleDiff = Math.abs(pointerAngle - (i * SLICE_ANGLE + SLICE_ANGLE / 2));
        if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
        const aimAccuracy = Math.max(0, 1 - angleDiff / (Math.PI / 3));
        const dragIntensity = Math.min(1, (pointerDist - 0.1) / 0.5);
        const sel = aimAccuracy * dragIntensity;
        arcTargetOffset += 0.3 * sel;

        if (!isMobile) {
          const t = textRefs.current[i];
          if (t) {
            if (sel > 0.1) {
              t.style.filter =
                `drop-shadow(0 0 ${20 * sel}px rgba(107,156,255,${sel * 1.5})) ` +
                `drop-shadow(0 0 ${10 * sel}px rgba(255,255,255,${sel})) brightness(${1 + sel * 1.2})`;
              t.style.transform = `scale(${1 + sel * 0.2})`;
              t.style.transition = 'none';
            } else {
              t.style.filter = 'none';
              t.style.transform = 'scale(1)';
            }
          }
        } else if (sel > aimedIntensity) {
          aimedIntensity = sel; aimedIdx = i;
        }
      } else if (!isMobile) {
        const t = textRefs.current[i];
        if (t) { t.style.filter = 'none'; t.style.transform = 'scale(1)'; t.style.transition = 'all 0.2s ease-out'; }
      }

      const tx = cos * arcTargetOffset, ty = sin * arcTargetOffset;
      const dx = tx - arc.position.x, dy = ty - arc.position.y;
      arc.position.x = Math.abs(dx) > 1e-4 ? arc.position.x + dx * MORPH_LERP * delta : tx;
      arc.position.y = Math.abs(dy) > 1e-4 ? arc.position.y + dy * MORPH_LERP * delta : ty;
    }

    if (isMobile) {
      const newAim = isHolding.current ? aimedIdx : -1;
      if (newAim !== aimedRef.current) {
        const prev = aimedRef.current;
        if (prev >= 0 && textRefs.current[prev]) textRefs.current[prev]!.classList.remove('aimed');
        if (newAim >= 0 && textRefs.current[newAim]) textRefs.current[newAim]!.classList.add('aimed');
        aimedRef.current = newAim;
      }
    }
  });

  const textDist = isMobile ? RING_TIP + 0.18 : radius + 0.65;

  return (
    <group>
      <mesh
        onPointerMove={handlePointerMove}
        onPointerOut={handlePointerOut}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        <sphereGeometry args={[radius, 16, 16]} />
        <meshBasicMaterial visible={false} />
      </mesh>

      <group ref={ringGroupRef}>
        {SKILLS_DATA.map((skill, i) => {
          const rotation = i * SLICE_ANGLE + GLOBAL_OFFSET;
          const tipAngle = rotation + SLICE_ANGLE / 2;
          const textX = Math.cos(tipAngle) * textDist;
          const textY = Math.sin(tipAngle) * textDist;
          return (
            <group key={skill.id ?? i} ref={(el) => { arcRefs.current[i] = el; }}>
              <mesh rotation={[0, 0, rotation]} material={ringMaterial} geometry={ringGeometry} />
              <Html position={[textX, textY, 0]} center zIndexRange={[100, 0]}>
                <div
                  ref={(el) => { textRefs.current[i] = el; }}
                  className={isMobile ? 'skills-3d-label-mobile' : 'silver-glow-text label'}
                  style={{
                    opacity: 0,
                    pointerEvents: 'none',
                    whiteSpace: 'nowrap',
                    ...(isMobile
                      ? { display: 'flex', alignItems: 'center', justifyContent: 'center' }
                      : { display: 'none', fontSize: '14px', letterSpacing: '0.15em' }),
                  }}
                >
                  {isMobile ? (
                    <skill.icon
                      size={18}
                      style={{ fill: 'url(#animatedPremiumGrad)', filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.3))' }}
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

      <points ref={pointsRef} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={count} array={dynamicPositions} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial ref={materialRef} size={0.012} color="#FFFFFF" transparent opacity={0.8} sizeAttenuation depthWrite={false} />
      </points>
    </group>
  );
});

export default ParticleSphere;
