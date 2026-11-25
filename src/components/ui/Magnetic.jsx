import { useRef } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";

/**
 * Magnetic hover: the child drifts a few pixels toward the pointer and springs
 * back on leave. Purely decorative, so it is disabled for reduced motion and
 * touch input.
 */
export function Magnetic({ children, strength = 0.22, className }) {
  const reduce = useReducedMotion();
  const ref = useRef(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, { stiffness: 220, damping: 18, mass: 0.4 });
  const y = useSpring(rawY, { stiffness: 220, damping: 18, mass: 0.4 });

  const onPointerMove = (event) => {
    if (reduce || event.pointerType === "touch") return;
    const box = ref.current?.getBoundingClientRect();
    if (!box) return;
    const dx = event.clientX - (box.left + box.width / 2);
    const dy = event.clientY - (box.top + box.height / 2);
    rawX.set(dx * strength);
    rawY.set(dy * strength);
  };

  const reset = () => {
    rawX.set(0);
    rawY.set(0);
  };

  return (
    <motion.span
      ref={ref}
      onPointerMove={onPointerMove}
      onPointerLeave={reset}
      onBlur={reset}
      style={reduce ? undefined : { x, y }}
      className={`inline-flex ${className ?? ""}`}
    >
      {children}
    </motion.span>
  );
}

export default Magnetic;
