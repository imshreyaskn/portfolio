// ConstellationGraph.tsx — 2D skill constellation with floating chips
import { useRef, useEffect, useMemo, memo } from 'react';
import type { SkillItem } from './data';

interface ConstellationGraphProps {
  skills: SkillItem[];
  isMobile: boolean;
}

/** Distance threshold (in percentage units) for drawing edges between chips */
const EDGE_DISTANCE_THRESHOLD = 60;
/** Float amplitude in px */
const FLOAT_AMPLITUDE = 8;

const ConstellationGraph = memo(function ConstellationGraph({
  skills,
  isMobile,
}: ConstellationGraphProps) {
  const pathsRef = useRef<(SVGPathElement | null)[]>([]);
  const chipsRef = useRef<(HTMLDivElement | null)[]>([]);
  const dxRef = useRef<Float32Array>(new Float32Array(0));
  const dyRef = useRef<Float32Array>(new Float32Array(0));

  // Reallocate displacement buffers when skill count changes
  useEffect(() => {
    dxRef.current = new Float32Array(skills.length);
    dyRef.current = new Float32Array(skills.length);
  }, [skills.length]);

  // Compute edges once per skill set
  const edges = useMemo(() => {
    const arr: [number, number][] = [];
    for (let i = 0; i < skills.length; i++) {
      for (let j = i + 1; j < skills.length; j++) {
        const dx = skills[i].x - skills[j].x;
        const dy = skills[i].y - skills[j].y;
        if (Math.sqrt(dx * dx + dy * dy) < EDGE_DISTANCE_THRESHOLD) {
          arr.push([i, j]);
        }
      }
    }
    return arr;
  }, [skills]);

  // Animation loop
  useEffect(() => {

    let frameId: number;

    const animate = () => {
      const time = performance.now() * 0.001;
      const dx = dxRef.current;
      const dy = dyRef.current;

      for (let i = 0; i < skills.length; i++) {
        dy[i] = Math.sin(time * 0.4 + i * 2.5) * FLOAT_AMPLITUDE;
        dx[i] = Math.cos(time * 0.3 + i * 1.8) * FLOAT_AMPLITUDE;

        const chip = chipsRef.current[i];
        if (chip) {
          chip.style.transform =
            `translate(calc(-50% + ${dx[i]}px), calc(-50% + ${dy[i]}px))`;
        }
      }

      for (let idx = 0; idx < edges.length; idx++) {
        const [a, b] = edges[idx];
        const pathEl = pathsRef.current[idx];
        if (!pathEl) continue;

        const sX = skills[a].x + dx[a] / 4;
        const sY = skills[a].y + dy[a] / 4;
        const eX = skills[b].x + dx[b] / 4;
        const eY = skills[b].y + dy[b] / 4;

        pathEl.setAttribute('d', `M ${sX} ${sY} L ${eX} ${eY}`);
      }

      frameId = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(frameId);
  }, [skills, edges]);

  // Resolve positions: use mobile overrides when available
  const getPosition = (skill: SkillItem) => ({
    x: isMobile && skill.xMobile !== undefined ? skill.xMobile : skill.x,
    y: isMobile && skill.yMobile !== undefined ? skill.yMobile : skill.y,
  });

  return (
    <div
      className="skills-graph-container"
      role="img"
      aria-label={`Skill constellation for ${skills.map((s) => s.name).join(', ')}`}
    >
      {/* Edge lines */}
      <svg
        className="skills-graph-svg"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {edges.map((_, idx) => (
          <path
            key={`edge-${idx}`}
            ref={(el) => { pathsRef.current[idx] = el; }}
            fill="none"
            stroke="url(#animatedPremiumGrad)"
            strokeWidth="1.5"
            opacity="0.5"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>

      {/* Skill chips */}
      {skills.map((skill, idx) => {
        const { x, y } = getPosition(skill);
        const Icon = skill.icon;

        return (
          <div
            key={skill.id}
            ref={(el) => { chipsRef.current[idx] = el; }}
            className="skills-graph-chip-anchor"
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            <div className="skills-icon-chip">
              <Icon
                className="skills-chip-icon"
                style={{ fill: 'url(#animatedPremiumGrad)' }}
                aria-hidden="true"
              />
              <span className="skills-chip-name">{skill.name}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
});

export default ConstellationGraph;
