import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { 
  DoubleSide, 
  BackSide, 
  BufferGeometry, 
  Float32BufferAttribute, 
  PointsMaterial, 
  Color, 
  AdditiveBlending 
} from 'three';
import type { Group, ShaderMaterial } from 'three';
import { PresentationControls, Html } from '@react-three/drei';

// ─────────────────────────────────────────────────────────────────────────────
// 1. SHADERS (Photon Ring / Event Horizon)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ponytail: We skip actual gravitational lensing (screen-space distortion)
 * because rendering a 100px element with a full-scene render target just 
 * to warp the stars behind it burns massive GPU budget for zero UX gain.
 * Instead, we fake the light-bending with a sharp Fresnel rim shader.
 */
const PHOTON_RING_VERTEX = /* glsl */`
  varying vec3 vViewPos;
  varying vec3 vNormal;
  void main() {
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vViewPos = mvPos.xyz;
    vNormal = normalMatrix * normal;
    gl_Position = projectionMatrix * mvPos;
  }
`;

const PHOTON_RING_FRAGMENT = /* glsl */`
  uniform float uTime;
  varying vec3 vViewPos;
  varying vec3 vNormal;

  vec3 getSweepColor(float t) {
    vec3 pureWhite = vec3(1.0);
    vec3 coolGrey  = vec3(0.478, 0.478, 0.549); // #7A7A8C
    if (t < 0.35) return mix(pureWhite, coolGrey, t / 0.35);
    else if (t < 0.5) return mix(coolGrey, pureWhite, (t - 0.35) / 0.15);
    else if (t < 0.65) return mix(pureWhite, coolGrey, (t - 0.5) / 0.15);
    else return mix(coolGrey, pureWhite, (t - 0.65) / 0.35);
  }

  void main() {
    // Angular sweep based on time
    float angle = atan(vViewPos.y, vViewPos.x) - uTime * 1.0472;
    float t = fract(angle / (2.0 * 3.14159265));
    vec3 baseColor = getSweepColor(t);

    vec3 n = gl_FrontFacing ? vNormal : -vNormal;
    vec3 viewDir = normalize(-vViewPos);
    
    // Grazing angle determines fresnel intensity
    float d = clamp(abs(dot(normalize(n), viewDir)), 0.0, 1.0);
    float fresnel = pow(1.0 - d, 7.0);
    float edgeFade = smoothstep(0.0, 0.15, d); // Prevents hard clipping at geometry bounds

    // Pure white blowout at the brightest points
    vec3 finalColor = mix(baseColor, vec3(1.0), fresnel * 0.9);
    float alpha = clamp(fresnel * edgeFade * 2.0, 0.0, 1.0);

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
// 2. ACCRETION DISK (Particle System)
// ─────────────────────────────────────────────────────────────────────────────

interface RingConfig {
  inner: number;
  outer: number;
  count: number;
  opacity: number;
  size: number;
}

const ACCRETION_DISKS: RingConfig[] = [
  { inner: 1.40, outer: 2.50, count: 1200, opacity: 0.40, size: 0.016 },
  { inner: 2.60, outer: 3.40, count: 800, opacity: 0.15, size: 0.014 },
  { inner: 3.50, outer: 4.30, count: 1000, opacity: 0.50, size: 0.018 },
];

function buildDiskGeometry(innerR: number, outerR: number, count: number) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  
  const hot = new Color('#FFFFFF');
  const cool = new Color('#7A7A8C');

  for (let i = 0; i < count; i++) {
    const bias = Math.pow(Math.random(), 3); // Cluster at inner horizon
    const r = innerR + bias * (outerR - innerR);
    const theta = Math.random() * Math.PI * 2;
    const z = (Math.random() - 0.5) * (0.04 + bias * 0.1); 
    
    positions[i * 3]     = Math.cos(theta) * r;
    positions[i * 3 + 1] = Math.sin(theta) * r;
    positions[i * 3 + 2] = z;

    const heat = 1 - bias;
    const c = hot.clone().lerp(cool, 1 - Math.pow(heat, 0.4)); 
    
    colors[i * 3] = c.r; 
    colors[i * 3 + 1] = c.g; 
    colors[i * 3 + 2] = c.b;
  }
  
  return { positions, colors };
}

const AccretionRing = ({ inner, outer, count, opacity, size }: RingConfig) => {
  const geometry = useMemo(() => {
    const { positions, colors } = buildDiskGeometry(inner, outer, count);
    const geo = new BufferGeometry();
    geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new Float32BufferAttribute(colors, 3));
    return geo;
  }, [inner, outer, count]);

  const material = useMemo(
    () => new PointsMaterial({ 
      vertexColors: true, 
      size, 
      transparent: true, 
      opacity: opacity * 1.5,
      sizeAttenuation: true, 
      depthWrite: false,
      blending: AdditiveBlending
    }),
    [opacity, size]
  );

  return <points geometry={geometry} material={material} raycast={() => null} />;
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. MAIN COMPONENT (The Black Hole)
// ─────────────────────────────────────────────────────────────────────────────

export default function Saturn({ isPaused = false }: { isPaused?: boolean }) {
  const diskRef = useRef<Group>(null);
  const photonRingRef = useRef<ShaderMaterial>(null);

  const photonUniforms = useMemo(() => ({ uTime: { value: 0 } }), []);

  useFrame(({ clock }) => {
    if (isPaused) return;
    
    const t = clock.getElapsedTime();
    if (diskRef.current) {
      diskRef.current.rotation.z = -t * 0.05;
    }
    if (photonRingRef.current) {
      photonRingRef.current.uniforms.uTime.value = t;
    }
  });

  return (
    <group rotation={[0.2, 0, 0]} scale={0.35}>
      
      {/* Event Horizon */}
      <mesh>
        <sphereGeometry args={[0.85, 32, 32]} />
        <meshBasicMaterial color="#000000" />
      </mesh>

      {/* Ambient Deep Glow (CSS-based to save GPU fill rate) */}
      <Html center position={[0, 0, -1]} zIndexRange={[-10, -1]}>
        <div className="saturn-glow" />
      </Html>

      {/* Photon Ring (Trapped light) */}
      <mesh>
        <sphereGeometry args={[0.90, 48, 48]} />
        <shaderMaterial
          ref={photonRingRef}
          side={BackSide}
          transparent
          depthWrite={false}
          depthTest={false} // Renders inside the event horizon bounds
          blending={AdditiveBlending}
          vertexShader={PHOTON_RING_VERTEX}
          fragmentShader={PHOTON_RING_FRAGMENT}
          uniforms={photonUniforms}
        />
      </mesh>

      {/* Interactive Zone & Accretion Disk */}
      <PresentationControls
        global={false}
        cursor={true}
        speed={1.5}
        polar={[-0.15, 0.15]}
        azimuth={[-0.15, 0.15]}
      >
        <mesh rotation={[Math.PI / 2 + 0.15, 0, 0]}>
          <circleGeometry args={[4.5, 32]} />
          <meshBasicMaterial visible={false} side={DoubleSide} />
        </mesh>

        <group ref={diskRef} rotation={[Math.PI / 2 + 0.15, 0, 0]}>
          {ACCRETION_DISKS.map((ring, i) => (
            <AccretionRing key={i} {...ring} />
          ))}
        </group>
      </PresentationControls>

    </group>
  );
}
