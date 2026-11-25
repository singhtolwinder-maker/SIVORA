import { motion } from "motion/react";
import { ArrowRight, Check } from "lucide-react";

const experiences = [
  {
    id: "dining-room",
    name: "The Dining Room",
    price: "$65",
    unit: "per guest",
    blurb: "Our seasonal three-course menu, served under low amber light in the main room.",
    features: [
      "Three courses, chef's choice",
      "Prime cuts & wood-fired mains",
      "Optional wine pairing · $45",
      "Seating every 30 minutes",
    ],
    cta: "Reserve a Table",
    featured: false,
  },
  {
    id: "chefs-table",
    name: "The Chef's Table",
    price: "$185",
    unit: "per guest",
    blurb:
      "Eight seats at the pass, seven courses, and the full story of every plate from the chef himself.",
    features: [
      "Seven-course tasting menu",
      "Front-row seat at the open fire",
      "Sommelier pairing · $95",
      "Signed menu to take home",
    ],
    cta: "Book the Counter",
    featured: true,
  },
  {
    id: "private-dining",
    name: "Private Dining",
    price: "$1,200",
    unit: "per room, from",
    blurb: "The Library room, curtained and quiet, for celebrations that deserve their own service.",
    features: [
      "Up to 40 seated guests",
      "Dedicated captain & sommelier",
      "Custom printed menus",
      "A/V and projector included",
    ],
    cta: "Enquire Now",
    featured: false,
  },
];

export function Experiences() {
  return (
    <section
      id="experiences"
      aria-labelledby="experiences-heading"
      className="relative scroll-mt-24 overflow-hidden border-t border-white/[0.06] bg-gradient-to-b from-[#0a0a0a] via-[#0d0c0a] to-[#0a0a0a] py-20 lg:py-28"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute left-1/2 top-1/2 size-[46rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-700/[0.07] blur-[170px]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/25 to-transparent" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="eyebrow justify-center">
            <span className="gold-rule" aria-hidden="true" />
            Reservations
            <span className="gold-rule" aria-hidden="true" />
          </p>
          <h2
            id="experiences-heading"
            className="mt-5 font-serif text-4xl font-light leading-[1.08] text-white sm:text-5xl lg:text-[3.4rem]"
          >
            Choose your <span className="text-amber-300">evening</span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-neutral-400">
            Three ways to sit at our table. Prices are per guest unless noted; tax and service are
            additional.
          </p>
        </motion.div>

        <div className="mt-14 grid gap-5 lg:grid-cols-3 lg:items-stretch">
          {experiences.map((experience, i) => (
            <motion.div
              key={experience.id}
              initial={{ opacity: 0, y: 34 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.8, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className={`relative flex flex-col rounded-3xl p-7 transition-all duration-400 hover:-translate-y-1.5 sm:p-8 ${
                experience.featured
                  ? "border border-amber-500/40 bg-gradient-to-b from-amber-500/[0.09] via-white/[0.03] to-transparent shadow-[0_40px_100px_-50px_rgba(217,119,6,0.6)] lg:-mt-4 lg:mb-4"
                  : "card-surface hover:border-amber-500/25 hover:bg-white/[0.04]"
              }`}
            >
              {experience.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#0a0a0a] shadow-lg">
                  Most requested
                </span>
              )}

              <h3 className="font-serif text-2xl font-light text-white">{experience.name}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-neutral-400">{experience.blurb}</p>

              <div className="mt-6 flex items-baseline gap-2 border-y border-white/[0.07] py-5">
                <span className="font-serif text-4xl font-light text-amber-200">
                  {experience.price}
                </span>
                <span className="text-xs uppercase tracking-[0.16em] text-neutral-500">
                  {experience.unit}
                </span>
              </div>

              <ul className="mt-6 flex-1 space-y-3">
                {experience.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-neutral-300">
                    <span className="mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-300">
                      <Check className="size-2.5" strokeWidth={3} aria-hidden="true" />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>

              <a
                href="#contact"
                className={`mt-8 w-full ${
                  experience.featured ? "btn-gold" : "btn-ghost"
                }`}
              >
                {experience.cta}
                <ArrowRight className="size-4" aria-hidden="true" />
              </a>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-10 text-center text-xs text-neutral-500"
        >
          Parties of 7 or more are seated in the Library room. Dietary requirements are handled with
          24 hours&rsquo; notice.
        </motion.p>
      </div>
    </section>
  );
}

export default Experiences;
