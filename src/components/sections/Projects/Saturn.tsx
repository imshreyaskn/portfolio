import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { DoubleSide, BackSide } from 'three';
import { PresentationControls, Html } from '@react-three/drei';

const Saturn = () => {
  const ringsRef = useRef<Group>(null);

  useFrame((_, delta) => {
    if (ringsRef.current) {
      ringsRef.current.rotation.z -= delta * 0.02;
    }
  });

  const ringData = [
    { inner: 1.20, outer: 1.90, opacity: 0.35 },
    { inner: 2.10, outer: 2.70, opacity: 0.15 },
    { inner: 2.90, outer: 3.30, opacity: 0.50 }
  ];

  return (
    // scale reduced from 0.5 → 0.35 to make Saturn smaller on screen
    <group rotation={[0.2, 0, 0]} scale={0.35}>
      {/* Central Planet — reduced from 32×32 to 20×20 segments.
          At scale 0.35 the sphere is tiny on screen; 20 subdivisions
          are completely indistinguishable from 32 at this render size. */}
      <mesh>
        <sphereGeometry args={[0.85, 20, 20]} />
        <meshBasicMaterial color="#000000" />
      </mesh>

      {/* Soft Animated Glow Behind */}
      <Html center position={[0, 0, -1]} zIndexRange={[-10, -1]}>
        <div className="saturn-glow" />
      </Html>

      {/* Crisp White Outline */}
      <mesh>
        <sphereGeometry args={[0.87, 20, 20]} />
        <meshBasicMaterial color="#FFFFFF" side={BackSide} />
      </mesh>

      {/* PresentationControls with global=false so only touches that START on Saturn
          trigger drag — everything else scrolls normally. */}
      <PresentationControls
        global={false}
        cursor={true}
        speed={1.5}
        polar={[-0.15, 0.15]}
        azimuth={[-0.15, 0.15]}
      >
        {/* Invisible interaction disc — serves as the actual hit surface.
            Rings are non-raycastable (raycast={()=>null}) so touches between
            the ring arcs don't intercept scroll. */}
        <mesh rotation={[Math.PI / 2 + 0.15, 0, 0]}>
          <circleGeometry args={[3.5, 32]} />
          <meshBasicMaterial visible={false} side={DoubleSide} />
        </mesh>

        {/* Ring segments reduced from 64 → 48.
            At scale 0.35 these thin rings are < 10px wide on a 1080p screen;
            64 vs 48 vertices is completely invisible at this size. */}
        <group ref={ringsRef} rotation={[Math.PI / 2 + 0.15, 0, 0]}>
          {ringData.map((ring, i) => (
            <mesh key={i} raycast={() => null}>
              <ringGeometry args={[ring.inner, ring.outer, 48]} />
              <meshBasicMaterial
                color="#FFFFFF"
                transparent
                opacity={ring.opacity}
                side={DoubleSide}
              />
            </mesh>
          ))}
        </group>
      </PresentationControls>
    </group>
  );
};

export default Saturn;
