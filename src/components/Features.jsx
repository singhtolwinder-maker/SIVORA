import { motion } from "motion/react";
import { Flame, ShieldCheck, Timer, Wine } from "lucide-react";

const pillars = [
  {
    icon: Timer,
    title: "28-Day Dry-Aged",
    copy: "USDA Prime beef rested in our Himalayan salt room until the flavour turns deep and nutty.",
  },
  {
    icon: Flame,
    title: "Live Oak Fire",
    copy: "Everything hits the open grill — white oak and hickory, never a gas flame.",
  },
  {
    icon: ShieldCheck,
    title: "Hand-Cut Daily",
    copy: "Butchered in-house each morning by our chef, so every plate is traced to the animal.",
  },
  {
    icon: Wine,
    title: "Cellar of 240",
    copy: "Napa classics, old-world Burgundy and a bourbon wall curated by our head sommelier.",
  },
];

const stats = [
  { value: "28", label: "Days aged" },
  { value: "12", label: "Hours smoked" },
  { value: "4.9", label: "Guest rating" },
  { value: "240", label: "Cellar labels" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] },
  }),
};

export function Features() {
  return (
    <section
      id="story"
      aria-labelledby="story-heading"
      className="relative scroll-mt-24 overflow-hidden border-t border-white/[0.06] bg-[#080808] py-20 lg:py-28"
    >
      {/* atmosphere */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -left-40 top-10 size-[32rem] rounded-full bg-amber-700/10 blur-[140px]" />
        <div className="absolute -right-32 bottom-0 size-[26rem] rounded-full bg-amber-500/[0.06] blur-[120px]" />
      </div>

      <div className="relative mx-auto grid w-full max-w-7xl gap-14 px-4 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)] lg:items-center lg:gap-20 lg:px-8">
        {/* Image column */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
          className="relative"
        >
          <div className="relative overflow-hidden rounded-3xl border border-amber-900/30">
            <img
              src="/images/chef-pass.jpg"
              alt="Chef plating a seared dry-aged ribeye at the SAVORA kitchen pass"
              loading="lazy"
              className="aspect-[4/5] w-full object-cover transition-transform duration-[1200ms] hover:scale-[1.03]"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 p-6">
              <p className="text-[10px] uppercase tracking-[0.34em] text-amber-300/80">
                The kitchen, 5:40 PM
              </p>
              <p className="mt-2 font-serif text-2xl font-light text-white">
                Every plate starts with live fire.
              </p>
            </div>
          </div>

          {/* floating gold frame accent */}
          <div
            className="pointer-events-none absolute -bottom-5 -right-5 hidden size-32 rounded-2xl border border-amber-500/25 lg:block"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -left-3 -top-3 hidden h-24 w-24 border-l border-t border-amber-500/40 lg:block"
            aria-hidden="true"
          />
        </motion.div>

        {/* Copy column */}
        <div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={fadeUp}
          >
            <p className="eyebrow">
              <span className="gold-rule" aria-hidden="true" />
              Our Philosophy
            </p>
            <h2
              id="story-heading"
              className="mt-5 font-serif text-4xl font-light leading-[1.08] text-white sm:text-5xl lg:text-[3.4rem]"
            >
              Fire, patience and
              <br />
              <span className="text-amber-300">the American table</span>
            </h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-neutral-400 sm:text-lg">
              SAVORA was built around one idea: take the comfort food America grew up on and give it
              the rigour of a fine-dining kitchen. Nothing rushed, nothing frozen, nothing wasted.
            </p>
          </motion.div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {pillars.map((pillar, i) => {
              const Icon = pillar.icon;
              return (
                <motion.div
                  key={pillar.title}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-60px" }}
                  variants={fadeUp}
                  className="card-surface group rounded-2xl p-5 hover:-translate-y-1 hover:border-amber-500/30 hover:bg-white/[0.04]"
                >
                  <span className="inline-flex size-10 items-center justify-center rounded-full border border-amber-500/25 bg-amber-500/10 text-amber-300 transition-colors duration-300 group-hover:border-amber-400/50 group-hover:text-amber-200">
                    <Icon className="size-[18px]" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-sm font-medium uppercase tracking-[0.14em] text-neutral-100">
                    {pillar.title}
                  </h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-neutral-400">{pillar.copy}</p>
                </motion.div>
              );
            })}
          </div>

          <motion.dl
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={fadeUp}
            className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.06] sm:grid-cols-4"
          >
            {stats.map((stat) => (
              <div key={stat.label} className="bg-[#0a0a0a] px-4 py-5 text-center">
                <dt className="order-2 mt-1 text-[10px] uppercase tracking-[0.24em] text-neutral-500">
                  {stat.label}
                </dt>
                <dd className="order-1 font-serif text-2xl font-light text-amber-200 sm:text-3xl">
                  {stat.value}
                </dd>
              </div>
            ))}
          </motion.dl>
        </div>
      </div>
    </section>
  );
}

export default Features;
