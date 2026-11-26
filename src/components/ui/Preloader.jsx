import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

/**
 * Short branded curtain shown while the hero photography decodes. It waits for
 * the window load event but never holds the page for more than 2.4s.
 */
export function Preloader() {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(!reduce);

  useEffect(() => {
    if (reduce) return;
    const started = Date.now();
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      const elapsed = Date.now() - started;
      const wait = Math.max(0, 900 - elapsed);
      window.setTimeout(() => setOpen(false), wait);
    };

    const fallback = window.setTimeout(finish, 2400);
    if (document.readyState === "complete") finish();
    else window.addEventListener("load", finish, { once: true });

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.clearTimeout(fallback);
      window.removeEventListener("load", finish);
      document.body.style.overflow = previous;
    };
  }, [reduce]);

  useEffect(() => {
    if (!open) document.body.style.overflow = "";
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="preloader"
          aria-hidden="true"
          exit={{ opacity: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } }}
          // Decorative only: never intercept clicks, even if the exit animation
          // is paused (background tabs throttle rAF, which used to leave this
          // curtain covering the page and swallowing every interaction).
          style={{ pointerEvents: "none" }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-ink"
        >
          <div className="grain pointer-events-none absolute inset-0 opacity-[0.035]" />
          <motion.p
            initial={{ opacity: 0, y: 16, letterSpacing: "0.2em" }}
            animate={{ opacity: 1, y: 0, letterSpacing: "0.4em" }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            className="font-serif text-2xl text-cream sm:text-3xl"
          >
            SAVORA
          </motion.p>
          <motion.span
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 h-px w-40 origin-left bg-gradient-to-r from-transparent via-gold to-transparent"
          />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.8 }}
            className="mt-5 text-[9px] uppercase tracking-[0.4em] text-sand/60"
          >
            West Village · New York
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default Preloader;
