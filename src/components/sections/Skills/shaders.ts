// shaders.ts — GLSL for the skill-sphere ring. Kept free of three.js imports so
// the loading screen can pre-compile it without pulling the 3D bundle.

export const RING_VERTEX_SHADER = /* glsl */ `
  uniform float uMorph;
  uniform float uRadius;
  uniform float uSliceAngle;
  varying vec3 vWorldPos;
  void main() {
    float sliceAngle = uSliceAngle; // 2π / number of skill categories
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
