import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { ArrowDown, ArrowRight, Star } from "lucide-react";
import { Magnetic } from "./ui/Magnetic";
import { ResponsiveImage } from "./ui/ResponsiveImage";

const EASE = [0.16, 1, 0.3, 1];

const facts = [
  { value: "28", unit: "days", label: "Dry-aged in-house" },
  { value: "Oak", unit: "fire", label: "No gas, ever" },
  { value: "240", unit: "labels", label: "Cellar & bourbon" },
];

const line = {
  hidden: { y: "115%" },
  visible: (i) => ({
    y: "0%",
    transition: { duration: 1.15, delay: 0.15 + i * 0.12, ease: EASE },
  }),
};

export function Hero() {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "16%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 70]);
  const fade = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  return (
    <section
      ref={ref}
      id="home"
      aria-labelledby="hero-heading"
      className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden bg-ink pt-24"
    >
      {/* Cinematic backdrop */}
      <motion.div style={reduce ? undefined : { y: imageY }} className="absolute inset-0 z-0 scale-[1.08]">
        <ResponsiveImage
          src="/images/interior-night.jpg"
          alt=""
          sizes="100vw"
          width="1392"
          height="752"
          fetchPriority="high"
          decoding="async"
          className="size-full object-cover object-center brightness-[1.22] contrast-[1.03] saturate-[1.05]"
        />
      </motion.div>

      {/* Light shaping */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-r from-ink via-ink/70 to-ink/10" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-t from-ink via-ink/10 to-ink/60" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(60%_60%_at_18%_50%,rgba(17,17,15,0.72),transparent_72%)]" aria-hidden="true" />
      <div className="grain pointer-events-none absolute inset-0 z-0 opacity-[0.05]" aria-hidden="true" />

      <motion.div
        style={reduce ? undefined : { y: contentY, opacity: fade }}
        className="section-shell relative z-10 w-full pb-12 pt-16 sm:pb-16 lg:pb-20"
      >
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-end">
          {/* Editorial column */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.25, ease: EASE }}
              className="flex flex-wrap items-center gap-x-5 gap-y-3"
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-line bg-ink/40 px-3.5 py-1.5 text-[9px] font-medium uppercase tracking-[0.3em] text-cream/75 backdrop-blur-sm">
                <span className="relative flex size-1.5">
                  <span className="absolute inset-0 animate-ping rounded-full bg-gold opacity-70 motion-reduce:animate-none" />
                  <span className="relative size-1.5 rounded-full bg-gold-light" />
                </span>
                West Village · Est. 2024
              </span>
              <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.24em] text-sand/75">
                <Star className="size-3 fill-gold text-gold" aria-hidden="true" />
                4.9 · 2,400 reviews
              </span>
            </motion.div>

            <h1
              id="hero-heading"
              className="mt-7 font-serif text-[3.15rem] font-light leading-[0.98] tracking-[-0.015em] text-cream sm:text-[4.5rem] lg:text-[5.5rem] xl:text-[6.4rem]"
            >
              <span className="block overflow-hidden pb-[0.06em]">
                <motion.span custom={0} variants={line} initial="hidden" animate="visible" className="block">
                  A Taste
                </motion.span>
              </span>
              <span className="block overflow-hidden pb-[0.06em]">
                <motion.span custom={1} variants={line} initial="hidden" animate="visible" className="block">
                  Worth
                </motion.span>
              </span>
              <span className="block overflow-hidden pb-[0.08em]">
                <motion.span
                  custom={2}
                  variants={line}
                  initial="hidden"
                  animate="visible"
                  className="block italic text-gold-light"
                >
                  Remembering
                </motion.span>
              </span>
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.75, ease: EASE }}
              className="mt-7 max-w-lg text-[15px] leading-relaxed text-cream/70 sm:text-lg"
            >
              Dry-aged beef, live oak fire and a dining room built for long evenings. American
              cooking with the patience it deserves.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.9, ease: EASE }}
              className="mt-9 flex flex-col items-start gap-3.5 sm:flex-row sm:items-center"
            >
              <Magnetic>
                <a href="#reserve" className="btn-gold w-full sm:w-auto">
                  Reserve a Table
                  <ArrowRight className="size-4" aria-hidden="true" />
                </a>
              </Magnetic>
              <Magnetic>
                <a href="#menu" className="btn-ghost w-full sm:w-auto">
                  Explore the Menu
                </a>
              </Magnetic>
            </motion.div>
          </div>

          {/* Detail column */}
          <motion.div
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1, ease: EASE }}
            className="w-full lg:justify-self-end"
          >
            <div className="relative max-w-sm border border-line bg-ink/80 p-6 shadow-[0_40px_90px_-50px_rgba(0,0,0,0.95)] backdrop-blur-md sm:p-7 lg:ml-auto">
              <span className="pointer-events-none absolute left-0 top-0 h-8 w-px bg-gold/60" aria-hidden="true" />
              <span className="pointer-events-none absolute left-0 top-0 h-px w-8 bg-gold/60" aria-hidden="true" />
              <span className="pointer-events-none absolute bottom-0 right-0 h-8 w-px bg-gold/60" aria-hidden="true" />
              <span className="pointer-events-none absolute bottom-0 right-0 h-px w-8 bg-gold/60" aria-hidden="true" />

              <p className="text-[9px] uppercase tracking-[0.32em] text-gold/80">Tonight at SAVORA</p>
              <p className="mt-3 font-serif text-[1.6rem] leading-snug text-cream">
                Five o&rsquo;clock fire,
                <br />
                <span className="italic text-gold-light">until late.</span>
              </p>

              <dl className="mt-6 divide-y divide-line/70 border-y border-line/70">
                {facts.map((fact) => (
                  <div key={fact.label} className="flex items-baseline justify-between gap-4 py-3">
                    <dt className="text-[11px] uppercase tracking-[0.18em] text-sand/70">{fact.label}</dt>
                    <dd className="font-serif text-lg text-cream">
                      {fact.value}
                      <span className="ml-1.5 text-[10px] uppercase tracking-[0.18em] text-sand/60">
                        {fact.unit}
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>

              <p className="mt-5 text-[11px] leading-relaxed text-sand/65">
                Walk-ins welcome at the bar. Smart casual. Kitchen closes thirty minutes before the
                room.
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Bottom cue */}
      <div className="section-shell relative z-10 hidden pb-7 lg:block">
        <div className="flex items-center justify-between border-t border-line/60 pt-5">
          <span className="text-[9px] uppercase tracking-[0.36em] text-sand/50">Scroll to discover</span>
          <motion.span
            aria-hidden="true"
            animate={reduce ? undefined : { y: [0, 7, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            className="inline-flex size-9 items-center justify-center rounded-full border border-line text-gold/80"
          >
            <ArrowDown className="size-3.5" />
          </motion.span>
          <span className="text-[9px] uppercase tracking-[0.36em] text-sand/50">40.7191° N · 74.0087° W</span>
        </div>
      </div>
    </section>
  );
}

export default Hero;
