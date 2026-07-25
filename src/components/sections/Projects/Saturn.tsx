// Saturn.tsx — Raymarched black hole with gravitational lensing.
// Quality-adaptive: integration steps are tunable at runtime via uMaxSteps.
import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Matrix4, Vector3 } from 'three';
import type { Group, ShaderMaterial } from 'three';
import { PresentationControls, Billboard } from '@react-three/drei';

export const RAYMARCH_VERTEX = /* glsl */ `
varying vec3 vWorldPos;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

export const RAYMARCH_FRAGMENT = /* glsl */ `
uniform float uTime;
uniform vec3 u_camPosWorld;
uniform mat4 u_invMatrix;
uniform int uMaxSteps;
varying vec3 vWorldPos;

float hash21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float noise2(vec2 p){
  vec2 i=floor(p), f=fract(p);
  f=f*f*(3.0-2.0*f);
  float a=hash21(i), b=hash21(i+vec2(1.0,0.0)), c=hash21(i+vec2(0.0,1.0)), d=hash21(i+vec2(1.0,1.0));
  return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);
}
float fbm(vec2 p){
  float s=0.0, a=0.5;
  for(int i=0;i<2;i++){ s+=a*noise2(p); p*=2.02; a*=0.5; }
  return s;
}

const float R_IN=2.2;
const float R_OUT=12.0;
const float R_IN2=4.84;
const float R_OUT2=144.0;

void main() {
  vec3 localCam = (u_invMatrix * vec4(u_camPosWorld, 1.0)).xyz;
  vec3 localPos = (u_invMatrix * vec4(vWorldPos, 1.0)).xyz;
  vec3 pos = localCam;
  vec3 vel = normalize(localPos - localCam);
  vec3 col = vec3(0.0);
  float alpha = 0.0;
  bool horizon = false;

  vec3 hvec0 = cross(pos, vel);
  float neg15h2 = -1.5 * dot(hvec0, hvec0);

  // Compile-time bound (110) satisfies strict GLSL drivers; the dynamic
  // uMaxSteps break lets low-end tiers cut integration cost at runtime.
  for (int i = 0; i < 110; i++) {
    if (i >= uMaxSteps) break;
    if (alpha > 0.995) break;

    float r2 = dot(pos, pos);
    if (r2 < 1.0) { horizon = true; break; }
    if (r2 > 200.0 && dot(pos, vel) > 0.0) break;

    float r = sqrt(r2);
    float dt = clamp(0.1 * (r - 0.5), 0.04, 1.8);
    float invR = inversesqrt(r2);
    float r2i = r2 * r2;
    vec3 acc = (neg15h2 * invR / r2i) * pos;
    vel += acc * dt;
    float py = pos.y;
    pos += vel * dt;

    if (py * pos.y < 0.0) {
      vec3 cp = pos - vel * (pos.y / vel.y);
      float rho2 = dot(cp.xz, cp.xz);
      if (rho2 > R_IN2 && rho2 < R_OUT2) {
        float invRho = inversesqrt(rho2);
        float rho = rho2 * invRho;
        float rel = clamp((rho - R_IN) / (R_OUT - R_IN), 0.0, 1.0);
        float phi = atan(cp.z, cp.x);
        float omega = 0.55 * invRho * invRho * invRho;
        float period = 40.0;
        float phase0 = fract(uTime / period);
        float phase1 = fract(uTime / period + 0.5);
        float w0 = 1.0 - 2.0 * abs(phase0 - 0.5);
        float t0 = phase0 * period;
        float ang0 = phi - t0 * omega * 18.0;
        float ca0 = cos(ang0), sa0 = sin(ang0);
        float n1_0 = fbm(vec2(ca0 * 5.0, rho * 6.0 + sa0 * 3.0 + t0 * 0.18));
        float n2_0 = fbm(vec2(sa0 * 5.0 - t0 * 0.25, rho * 8.0 + ca0 * 2.0));
        float dens0 = (0.3 + 0.9 * n1_0) * (0.4 + 0.8 * n2_0);
        float t1 = phase1 * period;
        float ang1 = phi - t1 * omega * 18.0;
        float ca1 = cos(ang1), sa1 = sin(ang1);
        float n1_1 = fbm(vec2(ca1 * 5.0, rho * 6.0 + sa1 * 3.0 + t1 * 0.18));
        float n2_1 = fbm(vec2(sa1 * 5.0 - t1 * 0.25, rho * 8.0 + ca1 * 2.0));
        float dens1 = (0.3 + 0.9 * n1_1) * (0.4 + 0.8 * n2_1);
        float dens = mix(dens1, dens0, w0);
        dens *= smoothstep(0.0, 0.03, rel) * (1.0 - smoothstep(0.65, 1.0, rel));

        vec3 dc = mix(vec3(1.0, 1.0, 1.0), vec3(0.75, 0.78, 0.84), smoothstep(0.0, 0.42, rel));
        dc = mix(dc, vec3(0.35, 0.38, 0.45), smoothstep(0.42, 1.0, rel));
        float innerGlow = clamp(1.0 - rel * 3.0, 0.0, 1.0);
        innerGlow *= innerGlow; innerGlow *= innerGlow;
        dc += vec3(0.92, 0.96, 1.0) * 3.5 * innerGlow;

        vec3 tangent = vec3(-cp.z, 0.0, cp.x) * invRho;
        vec3 tocam = normalize(localCam - cp);
        float toward = dot(tangent, tocam);
        vec3 approachingShift = vec3(0.95, 0.98, 1.0);
        vec3 recedingShift = vec3(0.3, 0.32, 0.38);
        dc = mix(dc, approachingShift, max(0.0, toward) * 0.5);
        dc = mix(dc, recedingShift, max(0.0, -toward) * 0.5);
        dc *= 1.0 + 0.8 * toward;
        dens *= 1.0 + 0.25 * toward;

        float a = clamp(dens * 0.55, 0.0, 1.0);
        col += dc * a * (1.0 - alpha);
        alpha += a * (1.0 - alpha);
      }
    }
  }

  if (horizon) { alpha = 1.0; }
  col *= 1.6;
  col = (col * (2.51 * col + 0.03)) / (col * (2.43 * col + 0.59) + 0.14);
  gl_FragColor = vec4(col, alpha);
}
`;

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
      u_camPosWorld: { value: new Vector3() },
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
    materialRef.current.uniforms.u_camPosWorld.value.copy(camera.position);
    materialRef.current.uniforms.u_invMatrix.value.copy(groupRef.current.matrixWorld).invert();
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
