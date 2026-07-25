// MoonSVG.tsx — Accessible moon phase SVG with animated gradient
import { memo, useId } from 'react';

interface MoonSVGProps {
  phase: 0 | 1 | 2;
  className?: string;
  onClick?: () => void;
  ariaLabel?: string;
  ariaPressed?: boolean;
}

/**
 * Shared gradient definition — rendered once in the parent <svg> or <defs>.
 * Each MoonSVG references this by ID instead of creating its own <defs>.
 */
export const MOON_GRADIENT_ID = 'moon-sweep-grad';

export const MoonGradientDefs = memo(function MoonGradientDefs() {
  return (
    <svg
      width="0"
      height="0"
      style={{ position: 'absolute' }}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient
          id={MOON_GRADIENT_ID}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="35%" stopColor="#7A7A8C" />
          <stop offset="50%" stopColor="#ffffff" />
          <stop offset="65%" stopColor="#7A7A8C" />
          <stop offset="100%" stopColor="#ffffff" />
          <animateTransform
            attributeName="gradientTransform"
            type="rotate"
            from="0 0.5 0.5"
            to="360 0.5 0.5"
            dur="6s"
            repeatCount="indefinite"
          />
        </linearGradient>
      </defs>
    </svg>
  );
});

const MoonSVG = memo(function MoonSVG({
  phase,
  className,
  onClick,
  ariaLabel,
  ariaPressed = false,
}: MoonSVGProps) {
  const gradientRef = `url(#${MOON_GRADIENT_ID})`;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      className={className}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      focusable="true"
    >
      {phase === 0 && (
        <circle
          cx="50"
          cy="50"
          r="48"
          fill="#000000"
          stroke={gradientRef}
          strokeWidth="1.5"
        />
      )}

      {phase === 1 && (
        <g transform="rotate(90 50 50)">
          <path
            d="M 50 2 A 48 48 0 0 1 50 98 Z"
            fill="#000000"
            stroke={gradientRef}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </g>
      )}

      {phase === 2 && (
        <g transform="rotate(45 50 50)">
          <path
            d="M 50 2 A 48 48 0 0 1 50 98 A 34 48 0 0 0 50 2 Z"
            fill="#000000"
            stroke={gradientRef}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </g>
      )}
    </svg>
  );
});

export default MoonSVG;
