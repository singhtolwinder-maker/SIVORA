import { motion } from "motion/react";
import { Flame, ShieldCheck, Timer, Wine } from "lucide-react";
import { Reveal, RevealGroup, RevealItem } from "./ui/Reveal";
import { SplitText } from "./ui/SplitText";

const pillars = [
  {
    number: "01",
    icon: Timer,
    title: "28-day dry-aged",
    copy: "USDA Prime beef rested in our Himalayan salt room until the flavour turns deep and nutty.",
  },
  {
    number: "02",
    icon: Flame,
    title: "Live oak fire",
    copy: "Everything meets the open grill — white oak and hickory, never a gas flame.",
  },
  {
    number: "03",
    icon: ShieldCheck,
    title: "Cut in-house daily",
    copy: "Butchered each morning by our chef, so every plate can be traced to the animal.",
  },
  {
    number: "04",
    icon: Wine,
    title: "Cellar of 240",
    copy: "Napa classics, old-world Burgundy and a bourbon wall chosen by our sommelier.",
  },
];

const stats = [
  { value: "28", label: "Days aged" },
  { value: "12", label: "Hours smoked" },
  { value: "4.9", label: "Guest rating" },
  { value: "240", label: "Cellar labels" },
];

export function Features() {
  return (
    <section
      id="story"
      aria-labelledby="story-heading"
      className="relative scroll-mt-24 overflow-hidden border-t border-line/60 bg-ink py-20 lg:py-28"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -left-48 top-1/4 size-[36rem] rounded-full bg-[radial-gradient(circle,rgba(198,164,106,0.08),transparent_66%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/25 to-transparent" />
      </div>

      <div className="section-shell relative grid gap-14 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:gap-20">
        {/* Image */}
        <Reveal className="relative">
          <div className="relative overflow-hidden rounded-2xl border border-line">
            <motion.img
              src="/images/room-interior.jpg"
              alt="The SAVORA dining room before service, set with linen and glassware"
              loading="lazy"
              decoding="async"
              initial={{ scale: 1.12 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
              className="aspect-[4/5] w-full object-cover brightness-[0.68] contrast-[1.08] saturate-[0.85]"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/10 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 p-6 sm:p-8">
              <p className="text-[9px] uppercase tracking-[0.34em] text-gold-light/80">
                The room · 4:45 PM
              </p>
              <p className="mt-2 max-w-xs font-serif text-2xl font-light leading-snug text-cream">
                Set by hand, every afternoon.
              </p>
            </div>
          </div>

          <div className="pointer-events-none absolute -bottom-4 -right-4 hidden size-32 rounded-xl border border-gold/25 lg:block" aria-hidden="true" />
          <div className="pointer-events-none absolute -left-4 -top-4 hidden h-24 w-24 border-l border-t border-gold/40 lg:block" aria-hidden="true" />
        </Reveal>

        {/* Copy */}
        <div>
          <Reveal>
            <p className="eyebrow">
              <span className="gold-rule" aria-hidden="true" />
              Our Story
            </p>
            <SplitText
              as="h2"
              text="Fire, patience and the American table"
              delay={0.1}
              className="mt-5 max-w-xl font-serif text-[2.15rem] font-light leading-[1.06] text-cream sm:text-5xl lg:text-[3.3rem]"
              wordClassName="[&:nth-child(3)]:italic"
            />
            <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-sand sm:text-base">
              SAVORA began with a simple idea: take the comfort food America grew up on and give it
              the rigour of a fine-dining kitchen. Nothing rushed, nothing frozen, nothing wasted.
            </p>
          </Reveal>

          <RevealGroup className="mt-10 grid gap-px overflow-hidden rounded-xl border border-line/70 bg-line/40 sm:grid-cols-2">
            {pillars.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <RevealItem
                  key={pillar.number}
                  className="group relative bg-ink p-5 transition-colors duration-500 hover:bg-coal"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex size-9 items-center justify-center rounded-full border border-line text-gold/85 transition-colors duration-300 group-hover:border-gold/60 group-hover:text-gold-light">
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <span className="font-mono text-[10px] tracking-widest text-sand/35">
                      {pillar.number}
                    </span>
                  </div>
                  <h3 className="mt-4 font-serif text-lg text-cream">{pillar.title}</h3>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-sand/75">{pillar.copy}</p>
                </RevealItem>
              );
            })}
          </RevealGroup>

          <Reveal delay={0.1} as="dl" className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label}>
                <dd className="font-serif text-3xl font-light text-gold-light sm:text-4xl">
                  {stat.value}
                </dd>
                <dt className="mt-1 text-[9px] uppercase tracking-[0.24em] text-sand/55">
                  {stat.label}
                </dt>
              </div>
            ))}
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export default Features;
