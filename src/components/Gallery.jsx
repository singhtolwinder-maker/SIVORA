import { useCallback, useEffect, useRef, useState } from "react";
import { lockBodyScroll } from "@/lib/scrollLock";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Expand, X } from "lucide-react";
import { Reveal } from "./ui/Reveal";
import { SectionHeading } from "./ui/SectionHeading";
import { ResponsiveImage } from "./ui/ResponsiveImage";

const shots = [
  {
    src: "/images/interior-night.jpg",
    alt: "The SAVORA dining room at night, lit by amber pendant lamps",
    caption: "The dining room",
    span: "col-span-2 row-span-2",
  },
  {
    src: "/images/chef-pass.jpg",
    alt: "A chef slicing a rested ribeye at the pass",
    caption: "At the pass",
    span: "",
  },
  {
    src: "/images/dish-ribeye.jpg",
    alt: "Dry-aged ribeye with herb butter",
    caption: "28-day ribeye",
    span: "",
  },
  {
    src: "/images/bar-whiskey.jpg",
    alt: "A bourbon old fashioned on the walnut bar",
    caption: "The bourbon wall",
    span: "col-span-2",
  },
  {
    src: "/images/dish-filet.jpg",
    alt: "Filet mignon with bordelaise and potato purée",
    caption: "Filet, bordelaise",
    span: "",
  },
  {
    src: "/images/dish-fries.jpg",
    alt: "Truffle parmesan fries with garlic aioli",
    caption: "Truffle fries",
    span: "",
  },
  {
    src: "/images/dish-mac-cheese.jpg",
    alt: "Lobster mac and cheese under a panko crust",
    caption: "Lobster mac",
    span: "",
  },
  {
    src: "/images/room-interior.jpg",
    alt: "The dining room before service, tables set with linen and glassware",
    caption: "Before service",
    span: "",
  },
];

export function Gallery() {
  const [index, setIndex] = useState(null);
  const open = index !== null;
  const closeRef = useRef(null);
  const lastFocused = useRef(null);

  const close = useCallback(() => setIndex(null), []);
  const step = useCallback(
    (direction) =>
      setIndex((current) =>
        current === null ? null : (current + direction + shots.length) % shots.length,
      ),
    [],
  );

  useEffect(() => {
    if (!open) return;
    const unlock = lockBodyScroll();
    closeRef.current?.focus();

    const onKey = (event) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowRight") step(1);
      if (event.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);

    return () => {
      unlock();
      window.removeEventListener("keydown", onKey);
      lastFocused.current?.focus?.({ preventScroll: true });
    };
  }, [open, close, step]);

  const active = open ? shots[index] : null;

  return (
    <section
      id="gallery"
      aria-labelledby="gallery-heading"
      className="relative scroll-mt-24 overflow-hidden border-t border-line/60 bg-ink py-20 lg:py-28"
    >
      <div className="section-shell">
        <SectionHeading
          id="gallery-heading"
          eyebrow="The Room"
          title={
            <>
              Low light,
              <br />
              <span className="italic text-gold-light">long evenings.</span>
            </>
          }
          copy="Oak, leather and candlelight. A look inside the dining room, the pass and the bar."
        />

        <div className="mt-12 grid auto-rows-[10rem] grid-cols-2 gap-3 sm:auto-rows-[12rem] lg:auto-rows-[15rem] lg:grid-cols-4">
          {shots.map((shot, i) => (
            <Reveal key={shot.src} delay={(i % 4) * 0.05} className={`group relative h-full ${shot.span}`}>
              <button
                type="button"
                onClick={(event) => {
                  lastFocused.current = event.currentTarget;
                  setIndex(i);
                }}
                className="relative block size-full cursor-pointer overflow-hidden rounded-xl border border-line/70 bg-coal text-left"
                aria-label={`View larger: ${shot.caption}`}
              >
                <ResponsiveImage
                  src={shot.src}
                  alt={shot.alt}
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  loading="lazy"
                  decoding="async"
                  className="size-full object-cover transition-transform duration-[1200ms] ease-silk group-hover:scale-[1.07]"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/10 to-transparent opacity-85 transition-opacity duration-500 group-hover:opacity-95" />

                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 p-4">
                  <span className="text-[9px] uppercase tracking-[0.26em] text-cream/85">
                    {shot.caption}
                  </span>
                  <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-cream/20 text-cream/70 transition-colors duration-300 group-hover:border-gold/60 group-hover:text-gold-light">
                    <Expand className="size-3" aria-hidden="true" />
                  </span>
                </div>
              </button>
            </Reveal>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[95] flex flex-col bg-ink/95 backdrop-blur-xl"
            role="dialog"
            aria-modal="true"
            aria-label={`Gallery: ${active.caption}`}
          >
            <div className="flex items-center justify-between px-5 py-4 sm:px-8">
              <span className="text-[10px] uppercase tracking-[0.3em] text-sand/70">
                {String(index + 1).padStart(2, "0")} / {String(shots.length).padStart(2, "0")}
              </span>
              <button
                ref={closeRef}
                type="button"
                onClick={close}
                aria-label="Close gallery"
                className="inline-flex size-10 items-center justify-center rounded-full border border-line text-cream/80 transition-colors hover:border-gold/60 hover:text-gold-light"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            <div className="flex min-h-0 flex-1 items-center justify-center px-3 pb-3 sm:px-8">
              <motion.figure
                key={active.src}
                initial={{ opacity: 0, scale: 0.985 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="flex max-h-full w-full max-w-4xl flex-col"
              >
                <ResponsiveImage
                  src={active.src}
                  alt={active.alt}
                  sizes="(min-width: 896px) 896px, 100vw"
                  className="max-h-[70svh] w-full rounded-xl border border-line object-contain"
                />
                <figcaption className="mt-4 text-center font-serif text-lg italic text-cream/85">
                  {active.caption}
                </figcaption>
              </motion.figure>
            </div>

            <div className="flex items-center justify-center gap-3 pb-7">
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label="Previous image"
                className="inline-flex size-11 items-center justify-center rounded-full border border-line text-cream/80 transition-colors hover:border-gold/60 hover:text-gold-light"
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                aria-label="Next image"
                className="inline-flex size-11 items-center justify-center rounded-full border border-line text-cream/80 transition-colors hover:border-gold/60 hover:text-gold-light"
              >
                <ArrowRight className="size-4" aria-hidden="true" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

export default Gallery;
