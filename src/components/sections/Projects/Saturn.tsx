import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { DoubleSide, BackSide, BufferGeometry, Float32BufferAttribute, ShaderMaterial, PointsMaterial } from 'three';
import { PresentationControls, Html } from '@react-three/drei';

// ─── Particle ring helpers ────────────────────────────────────────────────────

function buildRingParticles(innerR: number, outerR: number, count: number): Float32Array {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = Math.sqrt(
      Math.random() * (outerR * outerR - innerR * innerR) + innerR * innerR
    );
    const theta = Math.random() * Math.PI * 2;
    const z = (Math.random() - 0.5) * 0.04;
    positions[i * 3]     = Math.cos(theta) * r;
    positions[i * 3 + 1] = Math.sin(theta) * r;
    positions[i * 3 + 2] = z;
  }
  return positions;
}

interface RingParticlesProps {
  innerR: number;
  outerR: number;
  count: number;
  opacity: number;
  size?: number;
}

const RingParticles = ({ innerR, outerR, count, opacity, size = 0.018 }: RingParticlesProps) => {
  const geometry = useMemo(() => {
    const geo = new BufferGeometry();
    geo.setAttribute('position', new Float32BufferAttribute(buildRingParticles(innerR, outerR, count), 3));
    return geo;
  }, [innerR, outerR, count]);

  // Reuse a single PointsMaterial per instance
  const material = useMemo(
    () => new PointsMaterial({ color: '#FFFFFF', size, transparent: true, opacity, sizeAttenuation: true, depthWrite: false }),
    [opacity, size]
  );

  return <points geometry={geometry} material={material} raycast={() => null} />;
};

// ─── Animated sweep outline shader (matches MoonSVG gradient exactly) ─────────
//
// Moon gradient: white(0%) → #7A7A8C(35%) → white(50%) → #7A7A8C(65%) → white(100%)
// Rotates 360° in 6 s — angular speed = 2π / 6 ≈ 1.047 rad/s

const SWEEP_VERTEX = /* glsl */`
  varying vec3 vViewPos;
  void main() {
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vViewPos = mvPos.xyz;
    gl_Position = projectionMatrix * mvPos;
  }
`;

const SWEEP_FRAGMENT = /* glsl */`
  uniform float uTime;
  varying vec3 vViewPos;

  vec3 sweepColor(float t) {
    // t in [0,1] around the circle
    vec3 white = vec3(1.0);
    vec3 grey  = vec3(0.478, 0.478, 0.549); // #7A7A8C

    if (t < 0.35) {
      return mix(white, grey, t / 0.35);
    } else if (t < 0.5) {
      return mix(grey, white, (t - 0.35) / 0.15);
    } else if (t < 0.65) {
      return mix(white, grey, (t - 0.5) / 0.15);
    } else {
      return mix(grey, white, (t - 0.65) / 0.35);
    }
  }

  void main() {
    // Angle in view-space XY plane, rotated by time
    float angle = atan(vViewPos.y, vViewPos.x) - uTime * 1.0472; // 2PI/6s
    float t = fract(angle / (2.0 * 3.14159265));
    vec3 col = sweepColor(t);
    gl_FragColor = vec4(col, 1.0);
  }
`;

// ─── Saturn ────────────────────────────────────────────────────────────────────

const Saturn = () => {
  const ringsRef       = useRef<any>(null);
  const outlineMatRef  = useRef<ShaderMaterial>(null);

  const outlineUniforms = useMemo(() => ({ uTime: { value: 0 } }), []);

  useFrame(({ clock }, delta) => {
    // Rotate particle rings slowly
    if (ringsRef.current) {
      ringsRef.current.rotation.z -= delta * 0.02;
    }
    // Drive the sweep animation
    if (outlineMatRef.current) {
      outlineMatRef.current.uniforms.uTime.value = clock.elapsedTime;
    }
  });

  const ringData = [
    { inner: 1.10, outer: 2.20, count: 1200, opacity: 0.55, size: 0.016 },
    { inner: 2.30, outer: 3.10, count: 800, opacity: 0.25, size: 0.014 },
    { inner: 3.20, outer: 4.00, count: 1000, opacity: 0.70, size: 0.018 },
  ];

  return (
    <group rotation={[0.2, 0, 0]} scale={0.35}>

      {/* Central black fill */}
      <mesh>
        <sphereGeometry args={[0.85, 20, 20]} />
        <meshBasicMaterial color="#000000" />
      </mesh>

      {/* Soft glow behind */}
      <Html center position={[0, 0, -1]} zIndexRange={[-10, -1]}>
        <div className="saturn-glow" />
      </Html>

      {/* Sweeping-gradient outline — mirrors the MoonSVG animated border */}
      <mesh>
        <sphereGeometry args={[0.875, 32, 32]} />
        <shaderMaterial
          ref={outlineMatRef}
          side={BackSide}
          vertexShader={SWEEP_VERTEX}
          fragmentShader={SWEEP_FRAGMENT}
          uniforms={outlineUniforms}
        />
      </mesh>

      {/* PresentationControls — drag only starts on Saturn itself */}
      <PresentationControls
        global={false}
        cursor={true}
        speed={1.5}
        polar={[-0.15, 0.15]}
        azimuth={[-0.15, 0.15]}
      >
        {/* Invisible interaction disc */}
        <mesh rotation={[Math.PI / 2 + 0.15, 0, 0]}>
          <circleGeometry args={[4.2, 32]} />
          <meshBasicMaterial visible={false} side={DoubleSide} />
        </mesh>

        {/* Particle ring cluster */}
        <group ref={ringsRef} rotation={[Math.PI / 2 + 0.15, 0, 0]}>
          {ringData.map((ring, i) => (
            <RingParticles
              key={i}
              innerR={ring.inner}
              outerR={ring.outer}
              count={ring.count}
              opacity={ring.opacity}
              size={ring.size}
            />
          ))}
        </group>
      </PresentationControls>
    </group>
  );
};

export default Saturn;
