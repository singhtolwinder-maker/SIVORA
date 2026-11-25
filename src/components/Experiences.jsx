import { ArrowRight, Check } from "lucide-react";
import { Reveal } from "./ui/Reveal";
import { SectionHeading } from "./ui/SectionHeading";

const experiences = [
  {
    id: "dining-room",
    name: "The Dining Room",
    price: "$65",
    unit: "per guest",
    blurb: "Our seasonal three-course menu, served under low light in the main room.",
    features: [
      "Three courses, chef's choice",
      "Prime cuts & wood-fired mains",
      "Wine pairing · $45",
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
      className="relative scroll-mt-24 overflow-hidden border-t border-line/60 bg-ink py-20 lg:py-28"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute left-1/2 top-1/2 size-[48rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(198,164,106,0.07),transparent_65%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/25 to-transparent" />
      </div>

      <div className="section-shell relative">
        <SectionHeading
          id="experiences-heading"
          eyebrow="How to Dine"
          title={
            <>
              Three ways to sit
              <br />
              <span className="italic text-gold-light">at our table.</span>
            </>
          }
          copy="Prices are per guest unless noted. Tax and service are additional; every experience includes the full room."
        />

        <div className="mt-12 grid gap-5 lg:grid-cols-3 lg:items-stretch">
          {experiences.map((experience, i) => (
            <Reveal
              key={experience.id}
              delay={i * 0.08}
              className={`group relative flex flex-col rounded-2xl p-7 transition-all duration-500 ease-silk hover:-translate-y-1.5 sm:p-8 ${
                experience.featured
                  ? "border border-gold/35 bg-gradient-to-b from-gold/[0.07] via-coal/40 to-transparent shadow-[0_50px_120px_-60px_rgba(198,164,106,0.6)] lg:-mt-4 lg:mb-4"
                  : "border border-line/70 bg-coal/30 hover:border-gold/30"
              }`}
            >
              {experience.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-gold-light to-gold px-4 py-1 text-[8px] font-semibold uppercase tracking-[0.26em] text-ink">
                  Most requested
                </span>
              )}

              <div className="flex items-start justify-between gap-4">
                <h3 className="font-serif text-2xl font-light text-cream">{experience.name}</h3>
                <span className="mt-1 font-mono text-[9px] tracking-widest text-sand/35">
                  0{i + 1}
                </span>
              </div>

              <p className="mt-2 text-[13px] leading-relaxed text-sand/80">{experience.blurb}</p>

              <div className="mt-6 flex items-baseline gap-2 border-y border-line/60 py-5">
                <span className="font-serif text-4xl font-light text-gold-light">
                  {experience.price}
                </span>
                <span className="text-[9px] uppercase tracking-[0.2em] text-sand/55">
                  {experience.unit}
                </span>
              </div>

              <ul className="mt-6 flex-1 space-y-3">
                {experience.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-[13px] text-cream/75">
                    <span className="mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold-light">
                      <Check className="size-2.5" strokeWidth={3} aria-hidden="true" />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>

              <a
                href={experience.featured ? "#reserve" : "#contact"}
                className={`mt-8 w-full ${experience.featured ? "btn-gold" : "btn-ghost"}`}
              >
                {experience.cta}
                <ArrowRight className="size-4" aria-hidden="true" />
              </a>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.1} className="mt-10 text-center text-[11px] leading-relaxed text-sand/55">
          Parties of seven or more are seated in the Library room. Dietary requirements handled with
          24 hours&rsquo; notice.
        </Reveal>
      </div>
    </section>
  );
}

export default Experiences;
