import { motion, useReducedMotion } from "motion/react";

const EASE = [0.16, 1, 0.3, 1];

/**
 * Scroll-triggered reveal. Wraps any block and fades it up once as it enters
 * the viewport. Honors prefers-reduced-motion.
 */
export function Reveal({
  children,
  as = "div",
  delay = 0,
  y = 26,
  duration = 0.9,
  once = true,
  className,
  ...rest
}) {
  const reduce = useReducedMotion();
  const Comp = motion[as] ?? motion.div;

  return (
    <Comp
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "-70px" }}
      transition={{ duration, delay, ease: EASE }}
      className={className}
      {...rest}
    >
      {children}
    </Comp>
  );
}

/** Stagger container: pair with <RevealItem> children. */
export function RevealGroup({
  children,
  as = "div",
  stagger = 0.08,
  delay = 0,
  className,
  ...rest
}) {
  const reduce = useReducedMotion();
  const Comp = motion[as] ?? motion.div;

  return (
    <Comp
      initial={reduce ? false : "hidden"}
      whileInView="visible"
      viewport={{ once: true, margin: "-70px" }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: stagger, delayChildren: delay } },
      }}
      className={className}
      {...rest}
    >
      {children}
    </Comp>
  );
}

export function RevealItem({ children, as = "div", y = 24, className, ...rest }) {
  const Comp = motion[as] ?? motion.div;

  return (
    <Comp
      variants={{
        hidden: { opacity: 0, y },
        visible: { opacity: 1, y: 0, transition: { duration: 0.85, ease: EASE } },
      }}
      className={className}
      {...rest}
    >
      {children}
    </Comp>
  );
}

export { EASE };
