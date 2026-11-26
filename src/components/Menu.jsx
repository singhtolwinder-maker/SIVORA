import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, ArrowUpRight, Check, Plus, X } from "lucide-react";
import { SushiConveyorMenu } from "@/components/ui/sushi-conveyor-menu";
import { api } from "@/lib/api";
import { useShop } from "@/lib/shop";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

const EASE = [0.16, 1, 0.3, 1];

/** The house menu. Rendered instantly, then replaced by the live API menu. */
const fallbackDishes = [
  {
    id: "tomahawk",
    name: "Dry-Aged Tomahawk",
    category: "Prime Cuts",
    price: "$145",
    description:
      "Thirty-two ounces of 28-day dry-aged ribeye, grilled over white oak and carved at the table for two.",
    details: ["32 oz · serves two", "45 minutes over oak", "Carved tableside", "Bone-in"],
    image: "/images/chef-special.jpg",
    tier: 5,
    tag: "Chef's cut",
  },
  {
    id: "ribeye-steak",
    name: "Dry-Aged Ribeye",
    category: "Prime Cuts",
    price: "$58",
    description:
      "28-day dry-aged USDA Prime ribeye, herb compound butter, roasted garlic and thyme jus.",
    details: ["16 oz", "Grass-fed", "Gluten-free option"],
    image: "/images/dish-ribeye.jpg",
    tier: 5,
  },
  {
    id: "filet-mignon",
    name: "Filet Mignon",
    category: "Prime Cuts",
    price: "$62",
    description:
      "Center-cut filet, bordelaise sauce, pomme purée, roasted asparagus and crispy shallots.",
    details: ["8 oz", "USDA Prime", "Gluten-free option"],
    image: "/images/dish-filet.jpg",
    tier: 5,
  },
  {
    id: "gourmet-burger",
    name: "Wagyu Burger",
    category: "Signatures",
    price: "$28",
    description:
      "American Wagyu beef, aged cheddar, caramelised onions, truffle aioli on a brioche bun.",
    details: ["8 oz Wagyu", "Truffle fries", "Contains gluten, dairy"],
    image: "/images/dish-burger.jpg",
    tier: 3,
  },
  {
    id: "mac-cheese",
    name: "Lobster Mac & Cheese",
    category: "Signatures",
    price: "$34",
    description:
      "Cavatappi, aged cheddar, gruyère, Maine lobster, panko crust and chives.",
    details: ["Maine lobster", "Three-cheese blend", "Contains shellfish"],
    image: "/images/dish-mac-cheese.jpg",
    tier: 4,
  },
  {
    id: "bbq-ribs",
    name: "Smoked Pork Ribs",
    category: "Signatures",
    price: "$36",
    description:
      "Slow-smoked for twelve hours, house BBQ glaze, coleslaw, cornbread and pickles.",
    details: ["Full rack", "Hickory smoked", "Contains gluten"],
    image: "/images/dish-ribs.jpg",
    tier: 4,
  },
  {
    id: "crispy-chicken",
    name: "Buttermilk Fried Chicken",
    category: "Signatures",
    price: "$32",
    description:
      "Double-dipped in buttermilk, hot honey glaze, pickled slaw and house-made biscuits.",
    details: ["Half bird", "24-hour brine", "Contains gluten, dairy"],
    image: "/images/dish-fried-chicken.jpg",
    tier: 4,
  },
  {
    id: "smash-burger",
    name: "Double Smash Burger",
    category: "Signatures",
    price: "$22",
    description:
      "Two smashed patties, American cheese, special sauce, lettuce, tomato and a potato bun.",
    details: ["Two 4 oz patties", "Classic style", "Contains gluten, dairy"],
    image: "/images/dish-smash-burger.jpg",
    tier: 3,
  },
  {
    id: "pulled-pork",
    name: "Pulled Pork Sandwich",
    category: "Signatures",
    price: "$26",
    description:
      "Slow-braised shoulder, Carolina gold sauce, slaw, brioche and fried onions.",
    details: ["12-hour braise", "House pickles", "Contains gluten, dairy"],
    image: "/images/dish-pulled-pork.jpg",
    tier: 3,
  },
  {
    id: "chicken-sandwich",
    name: "Nashville Hot Chicken",
    category: "Signatures",
    price: "$24",
    description:
      "Crispy chicken, cayenne glaze, dill pickles, slaw, brioche and comeback sauce.",
    details: ["Heat level 3/5", "Buttermilk brine", "Contains gluten, dairy"],
    image: "/images/dish-chicken-sandwich.jpg",
    tier: 3,
  },
  {
    id: "loaded-fries",
    name: "Truffle Fries",
    category: "Starters",
    price: "$16",
    description:
      "Hand-cut fries, black truffle oil, parmesan, garlic aioli, scallions and bacon crumble.",
    details: ["Shareable", "Vegetarian option", "Contains dairy"],
    image: "/images/dish-fries.jpg",
    tier: 2,
  },
  {
    id: "onion-rings",
    name: "Beer-Battered Onion Rings",
    category: "Starters",
    price: "$14",
    description:
      "Sweet onions, craft beer batter, chipotle ranch and smoked paprika salt.",
    details: ["Hand-battered", "Vegetarian", "Contains gluten, dairy"],
    image: "/images/dish-onion-rings.jpg",
    tier: 1,
  },
  {
    id: "cheesecake",
    name: "New York Cheesecake",
    category: "Desserts",
    price: "$12",
    description:
      "Classic dense cheesecake, graham crust, blueberry compote and whipped cream.",
    details: ["Made daily", "Vegetarian", "Contains gluten, dairy, eggs"],
    image: "/images/dish-cheesecake.jpg",
    tier: 1,
  },
];

function priceLabel(cents) {
  const value = Number(cents) / 100;
  return `$${Number.isInteger(value) ? value : value.toFixed(2)}`;
}

/** Maps an API dish to the shape the conveyor and grid already render. */
function mapApiDish(item) {
  return {
    // Ordering needs the database id; the slug is kept for deep links.
    id: item.id || item._id,
    slug: item.slug,
    name: item.name,
    category: item.category,
    price: priceLabel(item.priceCents),
    description: item.description,
    details: item.details?.length ? item.details : item.ingredients || [],
    image: item.imageUrl,
    tier: item.tier ?? 3,
    tag: item.isFeatured ? "Chef's cut" : undefined,
  };
}

function useLockBody(locked) {
  useEffect(() => {
    if (!locked) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [locked]);
}

function DishDialog({ dish, onClose, onAdd }) {
  const closeRef = useRef(null);
  useLockBody(Boolean(dish));

  useEffect(() => {
    if (!dish) return;
    closeRef.current?.focus();
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dish, onClose]);

  return (
    <AnimatePresence>
      {dish && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[90] flex items-end justify-center p-0 sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="dish-dialog-title"
        >
          <div className="absolute inset-0 bg-ink/85 backdrop-blur-md" onClick={onClose} />
          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 24, opacity: 0, scale: 0.99 }}
            transition={{ duration: 0.45, ease: EASE }}
            className="relative max-h-[92svh] w-full max-w-3xl overflow-y-auto border border-line bg-coal shadow-[0_60px_140px_-50px_rgba(0,0,0,1)] sm:rounded-2xl"
          >
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Close dish details"
              className="absolute right-4 top-4 z-10 inline-flex size-10 items-center justify-center rounded-full border border-line bg-ink/70 text-cream/80 backdrop-blur-md transition-colors hover:border-gold/60 hover:text-gold-light"
            >
              <X className="size-4" aria-hidden="true" />
            </button>

            <div className="grid sm:grid-cols-2">
              <div className="relative h-56 overflow-hidden sm:h-full">
                <img
                  src={dish.image}
                  alt={dish.name}
                  className="size-full object-cover"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-coal/70 via-transparent to-transparent sm:bg-gradient-to-r" />
              </div>

              <div className="p-6 sm:p-8">
                <p className="text-[9px] uppercase tracking-[0.32em] text-gold/80">{dish.category}</p>
                <h3 id="dish-dialog-title" className="mt-3 font-serif text-3xl font-light text-cream">
                  {dish.name}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-sand">{dish.description}</p>

                <p className="mt-6 font-serif text-3xl text-gold-light">{dish.price}</p>

                <ul className="mt-6 space-y-2.5">
                  {dish.details.map((detail) => (
                    <li key={detail} className="flex items-start gap-2.5 text-[13px] text-cream/75">
                      <Check className="mt-0.5 size-3.5 shrink-0 text-gold" aria-hidden="true" />
                      {detail}
                    </li>
                  ))}
                </ul>

                <div className="mt-8 flex flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      onAdd(dish);
                      onClose();
                    }}
                    className="btn-gold w-full"
                  >
                    Add to order
                    <Plus className="size-4" aria-hidden="true" />
                  </button>
                  <a href="#reserve" onClick={onClose} className="btn-ghost w-full">
                    Reserve a Table
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </a>
                  <p className="text-center text-[11px] text-sand/60">
                    Allergies? Tell us when you book — we adapt every plate.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DishCard({ dish, index, onOpen, onAdd }) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12, transition: { duration: 0.25 } }}
      transition={{ duration: 0.6, delay: Math.min(index * 0.05, 0.3), ease: EASE }}
      className="group relative"
    >
      <button
        type="button"
        onClick={() => onOpen(dish)}
        className="block w-full cursor-pointer text-left"
        aria-label={`${dish.name}, ${dish.price}. View details.`}
      >
        <div className="relative overflow-hidden rounded-xl border border-line/80 bg-coal">
          <img
            src={dish.image}
            alt={dish.name}
            loading="lazy"
            decoding="async"
            width="600"
            height="750"
            className="aspect-[4/5] w-full object-cover transition-transform duration-[1100ms] ease-silk group-hover:scale-[1.06]"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/10 to-transparent opacity-90 transition-opacity duration-500 group-hover:opacity-75" />

          <span className="absolute left-3.5 top-3.5 rounded-full border border-line bg-ink/70 px-2.5 py-1 text-[8px] uppercase tracking-[0.24em] text-cream/80 backdrop-blur-sm">
            {dish.category}
          </span>

          {dish.tag && (
            <span className="absolute right-3.5 top-3.5 rounded-full bg-gold px-2.5 py-1 text-[8px] font-semibold uppercase tracking-[0.2em] text-ink">
              {dish.tag}
            </span>
          )}

          <div className="absolute inset-x-0 bottom-0 p-4">
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="min-w-0 font-serif text-[1.28rem] leading-[1.15] text-cream transition-colors duration-300 group-hover:text-gold-light">
                {dish.name}
              </h3>
              <span className="shrink-0 rounded-full border border-line/70 bg-ink/70 px-2 py-0.5 font-serif text-[0.95rem] tabular-nums text-gold-light backdrop-blur-sm">
                {dish.price}
              </span>
            </div>
            <p className="mt-1.5 line-clamp-2 text-[12px] leading-relaxed text-sand/80">
              {dish.description}
            </p>
            <span className="mt-3 inline-flex items-center gap-1.5 text-[9px] uppercase tracking-[0.26em] text-cream/55 transition-colors duration-300 group-hover:text-gold-light">
              <Plus className="size-3" aria-hidden="true" />
              Details
            </span>
          </div>
        </div>
      </button>

      <div className="flex items-center justify-between gap-3 border-t border-line/60 bg-coal px-4 py-2.5">
        <span className="text-[9px] uppercase tracking-[0.22em] text-sand/45">
          Tap the plate for details
        </span>
        <button
          type="button"
          onClick={() => onAdd(dish)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-gold/40 px-3.5 py-1.5 text-[9px] uppercase tracking-[0.18em] text-gold-light transition-colors duration-300 hover:bg-gold/10 hover:text-cream"
          aria-label={`Add ${dish.name} to your order`}
        >
          <Plus className="size-3" aria-hidden="true" />
          Add
        </button>
      </div>
    </motion.article>
  );
}

export function Menu() {
  const [category, setCategory] = useState("All");
  const [openDish, setOpenDish] = useState(null);
  const [toast, setToast] = useState("");
  const [dishes, setDishes] = useState(fallbackDishes);
  const [menuState, setMenuState] = useState("loading");
  const reduce = useReducedMotion();
  const { addItem } = useShop();

  // The live menu comes from MongoDB; the house menu above keeps the section
  // usable if the API is unreachable.
  useEffect(() => {
    const controller = new AbortController();
    api
      .getMenu({ limit: 100, signal: controller.signal })
      .then((payload) => {
        const mapped = (payload?.data ?? []).map(mapApiDish).filter((dish) => dish.name && dish.image);
        if (mapped.length === 0) {
          setMenuState("fallback");
          return;
        }
        setDishes(mapped);
        setMenuState("live");
      })
      .catch((error) => {
        if (error?.name !== "AbortError") setMenuState("fallback");
      });

    return () => controller.abort();
  }, []);

  const allCategories = useMemo(() => {
    const found = [...new Set(dishes.map((dish) => dish.category))];
    const preferred = ["Prime Cuts", "Signatures", "Starters", "Desserts", "Sides", "Drinks"];
    return [
      "All",
      ...preferred.filter((name) => found.includes(name)),
      ...found.filter((name) => !preferred.includes(name)),
    ];
  }, [dishes]);

  const featuredDish =
    dishes.find((dish) => dish.slug === "dry-aged-tomahawk" || dish.slug === "tomahawk") ??
    dishes[0] ??
    fallbackDishes[0];

  const filtered = useMemo(
    () => (category === "All" ? dishes : dishes.filter((dish) => dish.category === category)),
    [category, dishes],
  );

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 4200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const closeDish = () => setOpenDish(null);

  // The house fallback menu is not in the database, so only live dishes can be
  // ordered. The API expects the Mongo id, never the slug.
  const handleAdd = async (dish) => {
    if (!/^[a-f\d]{24}$/i.test(String(dish?.id ?? ""))) {
      setToast("Online ordering is unavailable for this dish right now.");
      return;
    }
    try {
      const result = await addItem(dish.id, 1);
      if (result?.needsAuth) setToast("Sign in to start your order.");
    } catch (error) {
      setToast(error?.message || "Could not add that dish to your order.");
    }
  };

  return (
    <section
      id="menu"
      aria-labelledby="menu-heading"
      className="relative scroll-mt-24 overflow-hidden border-t border-line/60 bg-ink py-20 lg:py-28"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute left-1/2 top-0 h-px w-[70%] -translate-x-1/2 bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
        <div className="absolute left-1/2 top-24 size-[46rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(198,164,106,0.09),transparent_65%)]" />
      </div>

      <div className="section-shell relative">
        <SectionHeading
          id="menu-heading"
          eyebrow="The Menu"
          title={
            <>
              Cooked over fire,
              <br />
              <span className="italic text-gold-light">served with intent.</span>
            </>
          }
          copy="One grill, nothing frozen. Pick a plate from the belt or browse the full card below."
        />

        {/* Conveyor — original animation, retinted */}
        <Reveal delay={0.1} className="mt-12 lg:mt-14">
          <div className="relative rounded-2xl border border-line/70 bg-gradient-to-b from-coal/60 to-ink/40 px-3 py-6 sm:px-6 sm:py-8">
            <SushiConveyorMenu
              items={dishes}
              eyebrow=""
              heading=""
              caption="Drag the belt, or pick a plate to read tonight's dish."
              speed={20}
              autoplay
              interval={3800}
              legend={{}}
              labels={{
                add: "Reserve for this dish",
                close: "Close",
                previous: "Previous dish",
                next: "Next dish",
                pause: "Pause the belt",
              }}
              onAdd={handleAdd}
              className="mx-auto max-w-4xl bg-transparent"
            />
          </div>
        </Reveal>

        <AnimatePresence>
          {toast && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              role="status"
              className="mx-auto mt-4 flex max-w-md items-center justify-center gap-2 rounded-full border border-line bg-coal/80 px-4 py-2 text-center text-[11px] tracking-wide text-cream/85"
            >
              <Check className="size-3.5 text-gold" aria-hidden="true" />
              {toast}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Featured cut */}
        <Reveal className="mt-16 lg:mt-24">
          <div className="grid overflow-hidden rounded-2xl border border-line bg-coal/40 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="relative min-h-[18rem] overflow-hidden lg:min-h-[26rem]">
              <img
                src={featuredDish.image}
                alt="Tomahawk ribeye sliced to reveal a medium-rare centre"
                loading="lazy"
                decoding="async"
                className="size-full object-cover transition-transform duration-[1400ms] ease-silk hover:scale-[1.04]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-coal/40" />
              <span className="absolute left-5 top-5 rounded-full border border-gold/40 bg-ink/70 px-3 py-1.5 text-[9px] uppercase tracking-[0.28em] text-gold-light backdrop-blur-sm">
                Chef&rsquo;s cut · limited nightly
              </span>
            </div>

            <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-12">
              <p className="eyebrow">
                <span className="gold-rule" aria-hidden="true" />
                The signature
              </p>
              <h3 className="mt-4 font-serif text-3xl font-light leading-tight text-cream sm:text-[2.6rem]">
                Dry-Aged
                <br />
                <span className="italic text-gold-light">Tomahawk for Two</span>
              </h3>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-sand">
                Thirty-two ounces of bone-in ribeye, rested for twenty-eight days, seared hard over
                white oak and carved beside the table. Served with bone marrow butter and charred
                spring onions.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] uppercase tracking-[0.2em] text-sand/65">
                <span>32 oz</span>
                <span className="size-1 rotate-45 bg-gold/50" aria-hidden="true" />
                <span>45 min over oak</span>
                <span className="size-1 rotate-45 bg-gold/50" aria-hidden="true" />
                <span>Carved tableside</span>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-5">
                <span className="font-serif text-4xl text-cream">{featuredDish.price}</span>
                <a href="#reserve" className="btn-gold">
                  Reserve for Two
                  <ArrowRight className="size-4" aria-hidden="true" />
                </a>
                <button
                  type="button"
                  onClick={() => setOpenDish(featuredDish)}
                  className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.24em] text-cream/60 transition-colors hover:text-gold-light"
                >
                  Details
                  <ArrowUpRight className="size-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Filters */}
        <div className="mt-16 flex flex-col gap-6 border-t border-line/60 pt-10 sm:mt-20 lg:flex-row lg:items-end lg:justify-between">
          <Reveal>
            <p className="font-serif text-2xl font-light text-cream sm:text-3xl">The full card</p>
            <p className="mt-1.5 text-[12px] uppercase tracking-[0.22em] text-sand/60" aria-live="polite">
              {filtered.length} {filtered.length === 1 ? "plate" : "plates"}
              {category !== "All" ? ` · ${category}` : ""}
            </p>
            {menuState !== "live" && (
              <p className="mt-1 text-[9px] uppercase tracking-[0.26em] text-sand/40">
                {menuState === "loading"
                  ? "Syncing tonight's menu…"
                  : "House menu · live menu unavailable"}
              </p>
            )}
          </Reveal>

          <Reveal delay={0.1}>
            <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1" role="group" aria-label="Filter the menu">
              {allCategories.map((item) => {
                const selected = item === category;
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setCategory(item)}
                    aria-pressed={selected}
                    className={`relative isolate shrink-0 rounded-full border px-4 py-2 text-[10px] uppercase tracking-[0.2em] transition-colors duration-300 ${
                      selected
                        ? "border-gold/60 text-ink"
                        : "border-line/70 text-cream/60 hover:border-gold/40 hover:text-cream"
                    }`}
                  >
                    {selected && (
                      <motion.span
                        layoutId="menu-filter-pill"
                        transition={{ duration: reduce ? 0 : 0.4, ease: EASE }}
                        className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-gold-light to-gold"
                      />
                    )}
                    <span className="relative">{item}</span>
                  </button>
                );
              })}
            </div>
          </Reveal>
        </div>

        {/* Dish grid */}
        <motion.div layout className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((dish, i) => (
              <DishCard key={dish.id} dish={dish} index={i} onOpen={setOpenDish} onAdd={handleAdd} />
            ))}
          </AnimatePresence>
        </motion.div>

        <Reveal className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-line/60 pt-7 sm:flex-row">
          <p className="text-[11px] leading-relaxed text-sand/60">
            Prices exclude tax and service. Dietary adaptations with 24 hours&rsquo; notice.
          </p>
          <a
            href="#reserve"
            className="group inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.26em] text-gold-light transition-colors hover:text-cream"
          >
            Book your table
            <ArrowRight
              className="size-3.5 transition-transform duration-300 group-hover:translate-x-1"
              aria-hidden="true"
            />
          </a>
        </Reveal>
      </div>

      <DishDialog dish={openDish} onClose={closeDish} onAdd={handleAdd} />
    </section>
  );
}

export default Menu;
