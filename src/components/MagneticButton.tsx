import { useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

interface MagneticButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  /** Radius of the attraction field beyond the button edge, in px. */
  field?: number;
  /** How far the button travels toward the cursor (0–1). */
  strength?: number;
}

const MagneticButton = ({
  children,
  onClick,
  className,
  field = 60,
  strength = 0.45,
  ...props
}: MagneticButtonProps) => {
  const btnRef = useRef<HTMLButtonElement>(null);

  // MotionValues drive the transform on the compositor — NO React re-renders.
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const spring = { stiffness: 150, damping: 15, mass: 0.1 };
  const sx = useSpring(x, spring);
  const sy = useSpring(y, spring);

  // Listener lives on the field wrapper, so it only fires within the
  // attraction zone — never globally on every mouse move on the page.
  const handleMouseMove = (e: React.MouseEvent): void => {
    const el = btnRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    const dist = Math.hypot(dx, dy);
    const maxDist = rect.width / 2 + field;
    if (dist < maxDist) {
      const pull = (1 - dist / maxDist) * strength;
      x.set(dx * pull);
      y.set(dy * pull);
    } else {
      x.set(0);
      y.set(0);
    }
  };

  const reset = (): void => {
    x.set(0);
    y.set(0);
  };

  return (
    <span
      className="magnetic-field"
      style={{ padding: field, margin: -field, display: 'inline-block' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={reset}
    >
      <motion.button
        ref={btnRef}
        type="button"
        className={className}
        onClick={onClick}
        style={{ x: sx, y: sy }}
        whileTap={{ scale: 0.98 }}
        {...props}
      >
        {children}
      </motion.button>
    </span>
  );
};

export default MagneticButton;
