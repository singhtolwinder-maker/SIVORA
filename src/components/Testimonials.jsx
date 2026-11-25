import { motion } from "motion/react";
import { Quote, Star } from "lucide-react";

const reviews = [
  {
    quote:
      "The ribeye arrived still whispering from the grill. It is the best steak I have eaten in this city, and I have eaten a lot of them.",
    name: "Marcus Ellison",
    meta: "OpenTable Diner · February",
    initials: "ME",
  },
  {
    quote:
      "We booked the chef's counter for an anniversary and ended up staying three hours. The service reads the table perfectly — warm, never hovering.",
    name: "Priya Raman",
    meta: "Google Review · January",
    initials: "PR",
  },
  {
    quote:
      "Lobster mac and cheese that justifies the price, a bourbon list with real depth, and a room that makes you want to linger. We are regulars now.",
    name: "Daniel & Kate Whitmore",
    meta: "Resy Guest · December",
    initials: "DW",
  },
];

const press = ["Michelin Guide", "Eater NY", "Time Out", "Bon Appétit", "The Infatuation"];

export function Testimonials() {
  return (
    <section
      id="reviews"
      aria-labelledby="reviews-heading"
      className="relative scroll-mt-24 overflow-hidden border-t border-white/[0.06] bg-[#0a0a0a] py-20 lg:py-28"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute left-1/2 top-0 h-px w-[70%] -translate-x-1/2 bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
        <div className="absolute left-1/2 top-1/3 size-[40rem] -translate-x-1/2 rounded-full bg-amber-600/[0.06] blur-[160px]" />
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
            The Guest Book
            <span className="gold-rule" aria-hidden="true" />
          </p>
          <h2
            id="reviews-heading"
            className="mt-5 font-serif text-4xl font-light leading-[1.08] text-white sm:text-5xl"
          >
            Table talk
          </h2>
          <div className="mt-4 flex items-center justify-center gap-3 text-sm text-neutral-400">
            <span className="flex items-center gap-0.5" aria-hidden="true">
              {[0, 1, 2, 3, 4].map((i) => (
                <Star key={i} className="size-3.5 fill-amber-400 text-amber-400" />
              ))}
            </span>
            <span>
              <span className="font-medium text-amber-100">4.9</span> from 2,400+ reviews
            </span>
          </div>
        </motion.div>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {reviews.map((review, i) => (
            <motion.figure
              key={review.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.75, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="card-surface relative flex h-full flex-col rounded-3xl p-7 hover:-translate-y-1.5 hover:border-amber-500/30 hover:bg-white/[0.04]"
            >
              <Quote
                className="size-7 shrink-0 text-amber-500/40"
                aria-hidden="true"
                strokeWidth={1.5}
              />
              <blockquote className="mt-5 flex-1 text-[15px] leading-relaxed text-neutral-300">
                &ldquo;{review.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-7 flex items-center gap-3 border-t border-white/[0.07] pt-5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-amber-500/25 bg-amber-500/10 font-serif text-xs tracking-wider text-amber-200">
                  {review.initials}
                </span>
                <div>
                  <p className="text-sm font-medium text-neutral-100">{review.name}</p>
                  <p className="mt-0.5 text-[11px] uppercase tracking-[0.16em] text-neutral-500">
                    {review.meta}
                  </p>
                </div>
                <span className="ml-auto flex items-center gap-0.5" aria-label="Rated 5 out of 5">
                  {[0, 1, 2, 3, 4].map((star) => (
                    <Star key={star} className="size-3 fill-amber-400 text-amber-400" aria-hidden="true" />
                  ))}
                </span>
              </figcaption>
            </motion.figure>
          ))}
        </div>

        <motion.ul
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, delay: 0.2 }}
          className="mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 border-t border-white/[0.06] pt-10"
        >
          {press.map((name) => (
            <li
              key={name}
              className="font-serif text-sm tracking-[0.18em] text-neutral-500 transition-colors duration-300 hover:text-amber-200/80"
            >
              {name}
            </li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}

export default Testimonials;
