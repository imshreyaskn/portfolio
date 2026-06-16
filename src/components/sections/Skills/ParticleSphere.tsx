import { useMemo, useRef, useEffect, useState, memo } from 'react';
import { Vector3, Matrix4, Ray, Color, ShaderMaterial, DoubleSide, RingGeometry, Points, PointsMaterial, Group } from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { SKILLS_DATA } from './data';
import { useIsMobile } from '../../../hooks/useIsMobile';

const GLOBAL_OFFSET = -Math.PI / 10; // Rotates the 5-item layout so index 1 is straight up (90 deg)

interface ParticleSphereProps {
  count?: number;
  radius?: number;
  onSelect?: (index: number) => void;
  portalRef?: React.RefObject<HTMLElement | null>;
}

const ParticleSphere = memo(({ count = 300, radius = 0.5, onSelect, portalRef }: ParticleSphereProps) => {
  const isMobile = useIsMobile();
  const pointsRef = useRef<Points>(null);
  const materialRef = useRef<PointsMaterial>(null);
  const ringGroupRef = useRef<Group>(null);
  const arcRefs = useRef<(Group | null)[]>([]);
  const textRefs = useRef<(HTMLDivElement | null)[]>([]);
  const pointerRef = useRef({ x: 0, y: 0 });
  
  // Interactive physics state
  const isInteracting = useRef(false);
  const isHolding = useRef(false);
  const isSettled = useRef(false); // Track if particles have returned to base positions

  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  // Global pointer release to ensure the hold effect ends even if released outside the mesh
  useEffect(() => {
    const handleGlobalUp = () => {
      if (isHolding.current) {
        const px = pointerRef.current.x;
        const py = pointerRef.current.y;
        const dist = Math.sqrt(px * px + py * py);
        
        if (dist > 0.3) {
          let angle = Math.atan2(py, px); // -PI to PI
          angle -= GLOBAL_OFFSET;
          if (angle < 0) angle += Math.PI * 2; // 0 to 2PI
          if (angle >= Math.PI * 2) angle -= Math.PI * 2;
          
          const sliceAngle = (Math.PI * 2) / SKILLS_DATA.length;
          const index = Math.floor(angle / sliceAngle);
          if (onSelectRef.current) onSelectRef.current(index);
        }
      }
      isHolding.current = false;
    };
    window.addEventListener('pointerup', handleGlobalUp);
    return () => window.removeEventListener('pointerup', handleGlobalUp);
  }, []);

  // Pre-allocate math objects to avoid garbage collection stutters at 60fps
  const tempVec = useMemo(() => new Vector3(), []);
  const particleBase = useMemo(() => new Vector3(), []);
  const closestPoint = useMemo(() => new Vector3(), []);
  const localRay = useMemo(() => new Ray(), []);
  const invMatrix = useMemo(() => new Matrix4(), []);

  const ringMaterialRef = useRef(new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uMorph: { value: 0 },
      uRadius: { value: radius },
      uColor: { value: new Color(0x7A7A8C) }, // Exact var(--text-secondary) color
      uHighlightColor: { value: new Color(0xFFFFFF) } 
    },
    vertexShader: `
      uniform float uMorph;
      uniform float uRadius;
      varying vec3 vWorldPos;
      void main() {
        float PI = 3.141592653589793;
        float sliceAngle = (PI * 2.0) / float(${SKILLS_DATA.length});
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

        float thicknessBoost = 0.0;
        if (rBase > (uRadius + 0.252)) {
          thicknessBoost = 0.006;
        }

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
    `,
    fragmentShader: `
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
        float idleOpacity = 0.5 + (shine * 0.5); // Much more solid to match text
        float finalOpacity = mix(idleOpacity, 1.0, uMorph);
        gl_FragColor = vec4(finalColor, finalOpacity);
      }
    `
  }));

  // Shared geometry for the ring segments based on data length
  const ringGeoRef = useRef(new RingGeometry(radius + 0.25, radius + 0.254, 32, 1, 0, (Math.PI * 2) / SKILLS_DATA.length));

  useEffect(() => {
    const mat = ringMaterialRef.current;
    const geo = ringGeoRef.current;
    return () => {
      mat.dispose();
      geo.dispose();
    };
  }, []);

  // Generate perfectly even distributed points on a sphere using Fibonacci lattice
  const basePositions = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle

    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2; // y goes from 1 to -1
      const r = Math.sqrt(1 - y * y); // radius at y

      const theta = phi * i; // golden angle increment

      positions[i * 3] = Math.cos(theta) * r * radius;
      positions[i * 3 + 1] = y * radius;
      positions[i * 3 + 2] = Math.sin(theta) * r * radius;
    }
    return positions;
  }, [count, radius]);

  // Dynamic positions that get mutated and sent to GPU
  const dynamicPositions = useMemo(() => new Float32Array(basePositions), [basePositions]);

  const handlePointerMove = () => {
    isInteracting.current = true;
    isSettled.current = false;
  };

  const handlePointerDown = () => {
    isInteracting.current = true;
    isHolding.current = true;
    isSettled.current = false;
  };

  const handlePointerUp = () => {
    isHolding.current = false;
  };

  const handlePointerOut = () => {
    isInteracting.current = false;
  };

  // 60FPS Physics Loop
  useFrame((state, delta) => {
    // Only capture pointer position if active
    if (isInteracting.current || isHolding.current) {
      pointerRef.current.x = state.pointer.x;
      pointerRef.current.y = state.pointer.y;
    }

    if (isHolding.current) {
      const distFromCenter = Math.sqrt(state.pointer.x ** 2 + state.pointer.y ** 2);
      const breakThreshold = 0.75; 
      if (distFromCenter > breakThreshold) {
        isHolding.current = false;
      }
    }
    if (!pointsRef.current) return;

    // 1. Idle Rotation (Always runs, extremely cheap as it only updates matrix rotation)
    pointsRef.current.rotation.y += delta * 0.15; 
    pointsRef.current.rotation.x += delta * 0.05; 

    // 2. Physics calculation (Only runs when not settled)
    if (isInteracting.current) {
      isSettled.current = false;
    }

    if (!isSettled.current) {
      const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
      
      if (isInteracting.current) {
        invMatrix.copy(pointsRef.current.matrixWorld).invert();
        localRay.copy(state.raycaster.ray).applyMatrix4(invMatrix);
      }

      const morph = ringGroupRef.current?.userData.morphFactor || 0;
      const blastRadius = 0.3 + (0.5 * morph); 
      const maxRepulsion = 0.2 + (0.3 * morph); 

      let maxDiffSq = 0;

      for (let i = 0; i < count; i++) {
        const ix = i * 3;
        const iy = i * 3 + 1;
        const iz = i * 3 + 2;

        let targetX = basePositions[ix];
        let targetY = basePositions[iy];
        let targetZ = basePositions[iz];

        if (isInteracting.current) {
          particleBase.set(targetX, targetY, targetZ);
          
          localRay.closestPointToPoint(particleBase, closestPoint);
          const distSq = particleBase.distanceToSquared(closestPoint);
          
          if (distSq < blastRadius * blastRadius && distSq > 0.0001) {
            const dist = Math.sqrt(distSq);
            const force = (blastRadius - dist) / blastRadius; 
            
            tempVec.subVectors(particleBase, closestPoint).normalize().multiplyScalar(force * maxRepulsion);
            
            targetX += tempVec.x;
            targetY += tempVec.y;
            targetZ += tempVec.z;
          }
        }

        const diffX = targetX - positions[ix];
        const diffY = targetY - positions[iy];
        const diffZ = targetZ - positions[iz];

        positions[ix] += diffX * 10 * delta;
        positions[iy] += diffY * 10 * delta;
        positions[iz] += diffZ * 10 * delta;

        if (!isInteracting.current) {
          const distToBaseSq = diffX * diffX + diffY * diffY + diffZ * diffZ;
          if (distToBaseSq > maxDiffSq) {
            maxDiffSq = distToBaseSq;
          }
        }
      }

      // If we are idle and particles are back at base, snap and pause updates
      if (!isInteracting.current && maxDiffSq < 0.000001) {
        for (let i = 0; i < count * 3; i++) {
          positions[i] = basePositions[i];
        }
        isSettled.current = true;
      }

      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }

    // 3. Dynamic Glow Effect (Only animate when values are changing)
    if (materialRef.current) {
      const targetSize = isHolding.current ? 0.024 : 0.012;
      const targetOpacity = isHolding.current ? 1.0 : 0.8;
      
      const sizeDiff = targetSize - materialRef.current.size;
      const opacityDiff = targetOpacity - materialRef.current.opacity;
      
      if (Math.abs(sizeDiff) > 0.0001) {
        materialRef.current.size += sizeDiff * 12 * delta;
      } else {
        materialRef.current.size = targetSize;
      }
      
      if (Math.abs(opacityDiff) > 0.0001) {
        materialRef.current.opacity += opacityDiff * 12 * delta;
      } else {
        materialRef.current.opacity = targetOpacity;
      }
    }

    // 4. Ring Billboard & Sweeping Shader Animation
    if (ringGroupRef.current) {
      ringGroupRef.current.quaternion.copy(state.camera.quaternion);

      const targetMorph = isHolding.current ? 1.0 : 0.0;
      ringGroupRef.current.userData.morphFactor = ringGroupRef.current.userData.morphFactor || 0;
      const prevMorph = ringGroupRef.current.userData.morphFactor;
      
      ringGroupRef.current.userData.morphFactor += (targetMorph - prevMorph) * 12 * delta;
      if (Math.abs(ringGroupRef.current.userData.morphFactor - targetMorph) < 0.0001) {
        ringGroupRef.current.userData.morphFactor = targetMorph;
      }
      const morph = ringGroupRef.current.userData.morphFactor;

      // Always update uTime so the idle gradient animation keeps playing
      ringMaterialRef.current.uniforms.uTime.value = state.clock.elapsedTime;

      // Only update uniforms & DOM styles if morph factor is moving or active
      if (morph !== prevMorph || morph > 0) {
        ringMaterialRef.current.uniforms.uMorph.value = morph;
        textRefs.current.forEach((txt) => {
          if (!txt) return;
          txt.style.opacity = morph.toString();
          txt.style.display = morph > 0.01 ? 'block' : 'none';
        });
      }

      const px = pointerRef.current.x;
      const py = pointerRef.current.y;
      
      let pointerAngle = Math.atan2(py, px);
      pointerAngle -= GLOBAL_OFFSET;
      if (pointerAngle < 0) pointerAngle += Math.PI * 2;
      if (pointerAngle >= Math.PI * 2) pointerAngle -= Math.PI * 2;
      
      const pointerDist = Math.sqrt(px * px + py * py);
      const baseOffset = isHolding.current ? 0.4 : 0; 
      
      const sliceAngle = (Math.PI * 2) / SKILLS_DATA.length;
      arcRefs.current.forEach((arc, i) => {
        if (!arc) return;
        
        const centerAngle = (i * sliceAngle) + (sliceAngle / 2);
        const actualWorldAngle = centerAngle + GLOBAL_OFFSET;
        let arcTargetOffset = baseOffset;
        
        if (isHolding.current && pointerDist > 0.1) {
          let angleDiff = Math.abs(pointerAngle - centerAngle);
          if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
          
          const aimAccuracy = Math.max(0, 1 - (angleDiff / (Math.PI / 3))); 
          const dragIntensity = Math.min(1, (pointerDist - 0.1) / 0.5); 
          
          arcTargetOffset += 0.3 * aimAccuracy * dragIntensity; 
        }
        
        const targetX = Math.cos(actualWorldAngle) * arcTargetOffset;
        const targetY = Math.sin(actualWorldAngle) * arcTargetOffset;
        
        const diffX = targetX - arc.position.x;
        const diffY = targetY - arc.position.y;
        
        if (Math.abs(diffX) > 0.0001) {
          arc.position.x += diffX * 12 * delta;
        } else {
          arc.position.x = targetX;
        }
        
        if (Math.abs(diffY) > 0.0001) {
          arc.position.y += diffY * 12 * delta;
        } else {
          arc.position.y = targetY;
        }
      });
    }
  });

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
          const sliceAngle = (Math.PI * 2) / SKILLS_DATA.length;
          const rotation = (i * sliceAngle) + GLOBAL_OFFSET;
          const tipAngle = rotation + (sliceAngle / 2);
          
          const textDist = radius + 0.65;
          const textX = Math.cos(tipAngle) * textDist;
          const textY = Math.sin(tipAngle) * textDist;

          return (
              <group key={i} ref={(el) => { arcRefs.current[i] = el; }}>
                <mesh rotation={[0, 0, rotation]} material={ringMaterialRef.current} geometry={ringGeoRef.current} />
                <Html
                  position={[textX, textY, 0]}
                  center
                  zIndexRange={[100, 0]}
                  portal={portalRef}
                >
                  <div 
                    ref={(el) => { textRefs.current[i] = el; }}
                    className={isMobile ? "skills-3d-label-mobile" : "silver-glow-text label"}
                    style={{
                      opacity: 0,
                      display: 'none', // Initially hidden
                      pointerEvents: 'none',
                      whiteSpace: 'nowrap',
                      ...(isMobile ? {} : { fontSize: '14px', letterSpacing: '0.15em' })
                    }}
                  >
                    {isMobile ? (() => {
                      const IconComponent = skill.icon;
                      return <IconComponent size={20} style={{ fill: 'url(#animatedPremiumGrad)', filter: 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.3))' }} />;
                    })() : skill.category}
                  </div>
                </Html>
            </group>
          );
        })}
      </group>

      <points ref={pointsRef}>
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
          sizeAttenuation={true}
          depthWrite={false}
        />
      </points>
    </group>
  );
});

export default ParticleSphere;
