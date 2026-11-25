import { motion } from "motion/react";
import { ArrowRight, Flame, Leaf, UtensilsCrossed } from "lucide-react";
import { Reveal } from "./ui/Reveal";
import { Magnetic } from "./ui/Magnetic";

const courses = [
  { number: "I", name: "Raw & Cured", copy: "Hudson Valley trout, smoked crème fraîche, rye crisp" },
  { number: "II", name: "The Butcher's Cut", copy: "45-day ribeye, bone marrow butter, charred spring onion" },
  { number: "III", name: "The Finish", copy: "Burnt honey cheesecake, bourbon caramel, sea salt" },
];

const notes = [
  { icon: Flame, label: "Live oak only" },
  { icon: Leaf, label: "Market-led produce" },
  { icon: UtensilsCrossed, label: "Eight seats nightly" },
];

export function ChefSpecial() {
  return (
    <section
      id="chef"
      aria-labelledby="chef-heading"
      className="relative scroll-mt-24 overflow-hidden border-t border-line/60 bg-coal py-20 lg:py-28"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -left-32 top-1/4 size-[34rem] rounded-full bg-[radial-gradient(circle,rgba(198,164,106,0.1),transparent_66%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/25 to-transparent" />
      </div>

      <div className="section-shell relative grid gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:gap-20">
        {/* Portrait */}
        <Reveal className="relative order-2 lg:order-1">
          <div className="relative overflow-hidden rounded-2xl border border-line">
            <img
              src="/images/chef-pass.jpg"
              alt="SAVORA's chef slicing a rested ribeye under the pass lights"
              loading="lazy"
              decoding="async"
              className="aspect-[4/5] w-full object-cover transition-transform duration-[1600ms] ease-silk hover:scale-[1.04]"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/15 to-transparent" />

            <motion.blockquote
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-x-0 bottom-0 p-6 sm:p-8"
            >
              <p className="font-serif text-xl font-light italic leading-snug text-cream sm:text-2xl">
                &ldquo;A steak is only as good as the thirty seconds before you serve it.&rdquo;
              </p>
              <footer className="mt-4 flex items-center gap-3">
                <span className="h-px w-6 bg-gold/60" aria-hidden="true" />
                <span className="text-[9px] uppercase tracking-[0.3em] text-sand/75">
                  Elena Marchetti · Executive Chef
                </span>
              </footer>
            </motion.blockquote>
          </div>

          <div
            className="pointer-events-none absolute -bottom-4 -right-4 hidden size-28 rounded-xl border border-gold/25 lg:block"
            aria-hidden="true"
          />
        </Reveal>

        {/* Copy */}
        <div className="order-1 lg:order-2">
          <Reveal>
            <p className="eyebrow">
              <span className="gold-rule" aria-hidden="true" />
              Chef&rsquo;s Special
            </p>
            <h2
              id="chef-heading"
              className="mt-5 font-serif text-[2.15rem] font-light leading-[1.06] text-cream sm:text-5xl lg:text-[3.4rem]"
            >
              The Butcher&rsquo;s
              <br />
              <span className="italic text-gold-light">Selection</span>
            </h2>
            <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-sand">
              Three courses written each morning around what the butcher and the market bring in.
              No printed menu, no repeats — just one table, one seating, and whatever the fire
              decides.
            </p>
          </Reveal>

          <Reveal delay={0.1} className="mt-9 border-y border-line/70">
            <ol className="divide-y divide-line/60">
              {courses.map((course) => (
                <li key={course.number} className="group flex items-baseline gap-5 py-4">
                  <span className="w-6 shrink-0 font-serif text-sm text-gold/70">{course.number}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-serif text-lg text-cream transition-colors duration-300 group-hover:text-gold-light">
                      {course.name}
                    </p>
                    <p className="mt-0.5 text-[12px] leading-relaxed text-sand/70">{course.copy}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Reveal>

          <Reveal delay={0.15} className="mt-8">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="font-serif text-4xl font-light text-cream">
                  $185
                  <span className="ml-2 text-[10px] uppercase tracking-[0.22em] text-sand/60">
                    per guest
                  </span>
                </p>
                <p className="mt-1.5 text-[11px] text-sand/60">Wine pairing $95 · eight seats nightly</p>
              </div>
              <Magnetic>
                <a href="#reserve" className="btn-gold">
                  Book the Chef&rsquo;s Table
                  <ArrowRight className="size-4" aria-hidden="true" />
                </a>
              </Magnetic>
            </div>

            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
              {notes.map((note) => {
                const Icon = note.icon;
                return (
                  <li key={note.label} className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-sand/65">
                    <Icon className="size-3.5 text-gold/80" aria-hidden="true" />
                    {note.label}
                  </li>
                );
              })}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export default ChefSpecial;
