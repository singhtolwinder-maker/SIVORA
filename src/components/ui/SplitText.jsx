import { motion, useReducedMotion } from "motion/react";

const EASE = [0.16, 1, 0.3, 1];

/**
 * Word-by-word heading reveal. Each word rises out of its own mask, which reads
 * as an editorial animation without any layout shift.
 */
export function SplitText({
  text,
  as = "span",
  className,
  wordClassName,
  delay = 0,
  stagger = 0.055,
  duration = 1,
  once = true,
}) {
  const reduce = useReducedMotion();
  const Tag = as;

  if (reduce) {
    return <Tag className={className}>{text}</Tag>;
  }

  const words = text.split(" ");

  return (
    <Tag className={className}>
      <span className="sr-only">{text}</span>
      <motion.span
        aria-hidden="true"
        initial="hidden"
        whileInView="visible"
        viewport={{ once, margin: "-60px" }}
        variants={{ hidden: {}, visible: { transition: { staggerChildren: stagger, delayChildren: delay } } }}
        className="inline"
      >
        {words.map((word, i) => (
          <span key={`${word}-${i}`} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
            <motion.span
              variants={{
                hidden: { y: "110%", opacity: 0 },
                visible: { y: "0%", opacity: 1, transition: { duration, ease: EASE } },
              }}
              className={`inline-block ${wordClassName ?? ""}`}
            >
              {word}
              {i < words.length - 1 ? "\u00A0" : ""}
            </motion.span>
          </span>
        ))}
      </motion.span>
    </Tag>
  );
}

export default SplitText;
