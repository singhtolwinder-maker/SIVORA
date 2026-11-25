import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Quote, Star } from "lucide-react";
import { Reveal } from "./ui/Reveal";
import { SectionHeading } from "./ui/SectionHeading";

const reviews = [
  {
    quote:
      "The ribeye arrived still whispering from the grill. It is the best steak I have eaten in this city, and I have eaten a lot of them.",
    name: "Marcus Ellison",
    meta: "OpenTable · February",
    detail: "Dry-aged ribeye, 16 oz",
  },
  {
    quote:
      "We booked the chef's counter for an anniversary and ended up staying three hours. The service reads the table perfectly — warm, never hovering.",
    name: "Priya Raman",
    meta: "Google review · January",
    detail: "Chef's table, seven courses",
  },
  {
    quote:
      "Lobster mac that justifies the price, a bourbon list with real depth, and a room that makes you want to linger. We are regulars now.",
    name: "Daniel & Kate Whitmore",
    meta: "Resy · December",
    detail: "The Library room",
  },
];

const press = ["Michelin Guide", "Eater NY", "Time Out", "Bon Appétit", "The Infatuation"];

export function Testimonials() {
  const [index, setIndex] = useState(0);
  const review = reviews[index];

  const go = (direction) => setIndex((current) => (current + direction + reviews.length) % reviews.length);

  return (
    <section
      id="reviews"
      aria-labelledby="reviews-heading"
      className="relative scroll-mt-24 overflow-hidden border-t border-line/60 bg-coal py-20 lg:py-28"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute left-1/2 top-0 size-[44rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(198,164,106,0.09),transparent_66%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/25 to-transparent" />
      </div>

      <div className="section-shell relative">
        <SectionHeading
          id="reviews-heading"
          eyebrow="The Guest Book"
          title={
            <>
              What the room
              <br />
              <span className="italic text-gold-light">says after.</span>
            </>
          }
        >
          <div className="mt-5 flex items-center justify-center gap-3 text-sm text-sand">
            <span className="flex items-center gap-0.5" aria-hidden="true">
              {[0, 1, 2, 3, 4].map((i) => (
                <Star key={i} className="size-3.5 fill-gold text-gold" />
              ))}
            </span>
            <span>
              <span className="font-medium text-cream">4.9</span> from 2,400+ reviews
            </span>
          </div>
        </SectionHeading>

        <div className="mx-auto mt-12 grid max-w-5xl gap-8 lg:grid-cols-[1.35fr_0.65fr] lg:gap-12">
          {/* Quote */}
          <Reveal className="relative overflow-hidden rounded-2xl border border-line bg-ink/50 p-7 sm:p-10">
            <Quote className="size-8 text-gold/40" aria-hidden="true" strokeWidth={1.4} />
            <div className="relative mt-6 min-h-[11rem] sm:min-h-[9.5rem]" aria-live="polite">
              <AnimatePresence mode="wait">
                <motion.blockquote
                  key={review.name}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                >
                  <p className="font-serif text-[1.35rem] font-light leading-relaxed text-cream sm:text-[1.65rem]">
                    &ldquo;{review.quote}&rdquo;
                  </p>
                  <footer className="mt-6 flex items-center justify-between gap-4 border-t border-line/60 pt-4">
                    <div>
                      <p className="text-[13px] text-cream/90">{review.name}</p>
                      <p className="mt-0.5 text-[9px] uppercase tracking-[0.24em] text-sand/55">
                        {review.meta}
                      </p>
                    </div>
                    <span className="flex items-center gap-0.5" aria-label="Rated 5 out of 5">
                      {[0, 1, 2, 3, 4].map((star) => (
                        <Star key={star} className="size-3 fill-gold text-gold" aria-hidden="true" />
                      ))}
                    </span>
                  </footer>
                </motion.blockquote>
              </AnimatePresence>
            </div>

            <div className="mt-7 flex items-center gap-2">
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Previous review"
                className="inline-flex size-9 items-center justify-center rounded-full border border-line text-cream/75 transition-colors hover:border-gold/60 hover:text-gold-light"
              >
                <ArrowLeft className="size-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Next review"
                className="inline-flex size-9 items-center justify-center rounded-full border border-line text-cream/75 transition-colors hover:border-gold/60 hover:text-gold-light"
              >
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </button>
              <span className="ml-2 font-mono text-[10px] tracking-widest text-sand/45">
                {String(index + 1).padStart(2, "0")} / {String(reviews.length).padStart(2, "0")}
              </span>
            </div>
          </Reveal>

          {/* Selector */}
          <Reveal delay={0.1} className="flex flex-col justify-center">
            <p className="text-[9px] uppercase tracking-[0.3em] text-sand/50">Choose a guest</p>
            <div className="mt-4 divide-y divide-line/60 border-y border-line/60">
              {reviews.map((item, i) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-pressed={i === index}
                  className="group flex w-full items-center justify-between gap-3 py-4 text-left"
                >
                  <span>
                    <span
                      className={`block font-serif text-lg transition-colors duration-300 ${
                        i === index ? "text-gold-light" : "text-cream/70 group-hover:text-cream"
                      }`}
                    >
                      {item.name}
                    </span>
                    <span className="mt-0.5 block text-[10px] uppercase tracking-[0.2em] text-sand/50">
                      {item.detail}
                    </span>
                  </span>
                  <span
                    aria-hidden="true"
                    className={`h-px transition-all duration-500 ${
                      i === index ? "w-8 bg-gold" : "w-4 bg-line group-hover:w-6"
                    }`}
                  />
                </button>
              ))}
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.1} as="ul" className="mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 border-t border-line/60 pt-9">
          {press.map((name) => (
            <li
              key={name}
              className="font-serif text-[13px] italic tracking-wide text-sand/55 transition-colors duration-300 hover:text-gold-light"
            >
              {name}
            </li>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

export default Testimonials;
