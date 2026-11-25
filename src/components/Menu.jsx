"use client";

import { SushiConveyorMenu } from "@/components/ui/sushi-conveyor-menu";
import { motion } from "motion/react";

const dishes = [
  {
    id: "gourmet-burger",
    name: "Gourmet Wagyu Burger",
    description: "American Wagyu beef, aged cheddar, caramelized onions, truffle aioli, brioche bun",
    price: "$28",
    tier: 3,
    image: "/images/dish-burger.jpg",
    details: ["8 oz Wagyu", "Truffle fries", "Contains gluten, dairy"],
  },
  {
    id: "ribeye-steak",
    name: "Dry-Aged Ribeye",
    description: "28-day dry-aged USDA Prime ribeye, herb compound butter, roasted garlic, thyme jus",
    price: "$58",
    tier: 5,
    image: "/images/dish-ribeye.jpg",
    details: ["16 oz", "Grass-fed", "Gluten-free option"],
  },
  {
    id: "bbq-ribs",
    name: "Smoked BBQ Pork Ribs",
    description: "Slow-smoked 12 hours, house BBQ sauce, coleslaw, cornbread, pickles",
    price: "$36",
    tier: 4,
    image: "/images/dish-ribs.jpg",
    details: ["Full rack", "Hickory smoked", "Contains gluten"],
  },
  {
    id: "crispy-chicken",
    name: "Buttermilk Fried Chicken",
    description: "Double-dipped in buttermilk, hot honey glaze, pickled slaw, house-made biscuits",
    price: "$32",
    tier: 4,
    image: "/images/dish-fried-chicken.jpg",
    details: ["Half bird", "24hr brine", "Contains gluten, dairy"],
  },
  {
    id: "loaded-fries",
    name: "Loaded Truffle Fries",
    description: "Hand-cut fries, black truffle oil, parmesan, garlic aioli, scallions, bacon crumbles",
    price: "$16",
    tier: 2,
    image: "/images/dish-fries.jpg",
    details: ["Shareable", "Vegetarian option", "Contains dairy"],
  },
  {
    id: "mac-cheese",
    name: "Lobster Mac & Cheese",
    description: "Cavatappi, aged cheddar, gruyère, Maine lobster, panko crust, chives",
    price: "$34",
    tier: 4,
    image: "/images/dish-mac-cheese.jpg",
    details: ["Maine lobster", "Three-cheese blend", "Contains gluten, dairy, shellfish"],
  },
  {
    id: "smash-burger",
    name: "Double Smash Burger",
    description: "Two smashed patties, American cheese, special sauce, lettuce, tomato, potato bun",
    price: "$22",
    tier: 3,
    image: "/images/dish-smash-burger.jpg",
    details: ["Two 4oz patties", "Classic style", "Contains gluten, dairy"],
  },
  {
    id: "filet-mignon",
    name: "Filet Mignon",
    description: "Center-cut filet, bordelaise sauce, pomme purée, roasted asparagus, crispy shallots",
    price: "$62",
    tier: 5,
    image: "/images/dish-filet.jpg",
    details: ["8 oz", "USDA Prime", "Gluten-free option"],
  },
  {
    id: "chicken-sandwich",
    name: "Nashville Hot Chicken Sandwich",
    description: "Crispy chicken, cayenne glaze, dill pickles, slaw, brioche bun, comeback sauce",
    price: "$24",
    tier: 3,
    image: "/images/dish-chicken-sandwich.jpg",
    details: ["Spicy level 3/5", "Buttermilk brine", "Contains gluten, dairy"],
  },
  {
    id: "onion-rings",
    name: "Beer-Battered Onion Rings",
    description: "Sweet onions, craft beer batter, chipotle ranch, smoked paprika salt",
    price: "$14",
    tier: 1,
    image: "/images/dish-onion-rings.jpg",
    details: ["Hand-battered", "Vegetarian", "Contains gluten, dairy"],
  },
  {
    id: "pulled-pork",
    name: "Pulled Pork Sandwich",
    description: "Slow-braised pork shoulder, Carolina gold sauce, slaw, brioche, fried onions",
    price: "$26",
    tier: 3,
    image: "/images/dish-pulled-pork.jpg",
    details: ["12hr braised", "House pickles", "Contains gluten, dairy"],
  },
  {
    id: "cheesecake",
    name: "New York Cheesecake",
    description: "Classic dense cheesecake, graham crust, strawberry compote, whipped cream",
    price: "$12",
    tier: 1,
    image: "/images/dish-cheesecake.jpg",
    details: ["Made daily", "Vegetarian", "Contains gluten, dairy, eggs"],
  },
];

const tierData = [
  { tier: 1, label: "Starters & Sides", range: "$12–14", color: "bg-chart-1" },
  { tier: 2, label: "Shareables", range: "$16", color: "bg-chart-2" },
  { tier: 3, label: "Sandwiches & Burgers", range: "$22–28", color: "bg-chart-3" },
  { tier: 4, label: "Mains", range: "$32–36", color: "bg-chart-4" },
  { tier: 5, label: "Premium Cuts", range: "$58–62", color: "bg-chart-5" },
];

export function Menu() {
  return (
    <section
      id="menu"
      className="relative scroll-mt-24 overflow-hidden bg-savora-dark pt-20 lg:pt-28 pb-16 lg:pb-24"
      aria-labelledby="menu-heading"
    >
      {/* Background atmosphere - sophisticated layered depth */}
      <div className="absolute inset-0 z-0" aria-hidden="true">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-savora-dark via-savora-charcoal to-savora-dark" />
        {/* Central amber glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-gradient-to-r from-savora-gold/10 via-savora-gold/5 to-transparent blur-3xl opacity-60" />
        {/* Subtle vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-savora-dark/80 via-transparent to-savora-dark/80" />
        {/* Top accent line */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-px bg-gradient-to-r from-transparent via-savora-gold/30 to-transparent" />
        {/* Bottom accent line */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] h-px bg-gradient-to-r from-transparent via-savora-gold/30 to-transparent" />
        {/* Noise texture overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }} />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header - Refined typography with Playfair Display */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-center mb-10 lg:mb-12"
        >
          {/* Eyebrow - refined with gold keyline */}
          <div className="flex items-center justify-center gap-3 mb-5">
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-savora-gold/50 to-transparent" />
            <span className="relative px-4 py-1.5 text-savora-cream text-sm font-medium tracking-[0.3em] uppercase">
              DINNER MENU
              <span className="absolute bottom-[2px] left-1/2 -translate-x-1/2 w-[60%] h-0.5 bg-gradient-to-r from-transparent via-savora-gold to-transparent rounded-full" />
            </span>
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-savora-gold/50 to-transparent" />
          </div>
          {/* Heading - Playfair Display, gold accent on "Featured Selections" */}
          <h2 id="menu-heading" className="font-serif text-4xl sm:text-5xl lg:text-6xl font-light leading-[1.05] tracking-tight text-white">
            Featured
            <br />
            <span className="font-medium text-savora-gold-light">Selections</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-balance text-lg leading-relaxed text-neutral-400 sm:text-xl">
            Handcrafted dishes made with premium ingredients and time-honored techniques.
            Pick a plate to discover more.
          </p>
        </motion.div>

        {/* Conveyor Menu Wrapper - sophisticated belt presentation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.15 }}
          className="relative"
        >
          {/* Conveyor ambient glow */}
          <div className="absolute inset-0 -z-10 pointer-events-none" aria-hidden="true">
            <div className="absolute left-1/2 -translate-x-1/2 top-0 w-full h-full max-w-5xl bg-gradient-to-b from-savora-gold/5 via-transparent to-transparent blur-2xl opacity-30" />
            <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-full h-32 bg-gradient-to-t from-savora-gold/8 via-transparent to-transparent blur-xl opacity-20" />
          </div>

          <SushiConveyorMenu
            items={dishes}
            eyebrow=""
            heading=""
            caption="Drag the belt, or pick a plate to explore tonight's dish."
            speed={22}
            autoplay={true}
            interval={3500}
            // The tier cards below already explain the pricing — hide the belt's
            // derived legend by handing it an empty map.
            legend={{}}
            labels={{
              add: "Add to order",
              close: "Close",
              previous: "Previous dish",
              next: "Next dish",
              pause: "Pause conveyor",
            }}
            onAdd={(item) => {
              console.log("Added to order:", item.name);
            }}
            className="mx-auto max-w-4xl bg-transparent"
          />
        </motion.div>

        {/* Legend / Tier Guide - Refined gold/cream palette cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.3 }}
          className="mt-10"
        >
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 max-w-5xl mx-auto">
            {tierData.map((t) => (
              <motion.div
                key={t.tier}
                whileHover={{ y: -3, boxShadow: "0 20px 40px -20px rgba(217, 119, 6, 0.25)" }}
                transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="group relative p-4 sm:p-5 rounded-xl bg-savora-charcoal/60 border border-neutral-800 hover:border-savora-gold/40 transition-all duration-300 backdrop-blur-sm"
              >
                {/* Subtle top gold accent line */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-px bg-gradient-to-r from-transparent via-savora-gold/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="flex items-center gap-3 mb-2.5">
                  {/* Tier indicator dot with gold ring */}
                  <div className="relative flex-shrink-0">
                    <span className={`w-3 h-3 rounded-full ${t.color} relative z-10`} />
                    <span className="absolute inset-0 rounded-full border-2 border-savora-gold/30 scale-125 opacity-0 group-hover:opacity-100 transition-all duration-300" />
                  </div>
                  <span className="text-sm font-medium text-savora-cream uppercase tracking-wider">{t.label}</span>
                </div>
                <p className="text-savora-gold font-mono text-lg font-medium tabular-nums">{t.range}</p>
                {/* Subtle bottom shimmer */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] h-px bg-gradient-to-r from-transparent via-savora-gold/20 to-transparent" />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA - Refined gold gradient with sophisticated hover effects */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.45 }}
          className="mt-10 text-center"
        >
          <a
            href="#experiences"
            className="relative inline-flex items-center justify-center gap-3 px-10 py-4 rounded-full bg-gradient-to-r from-savora-gold via-savora-gold-light to-savora-gold text-savora-dark font-medium text-lg hover:from-savora-gold-light hover:via-savora-gold hover:to-savora-gold-light active:scale-[0.97] transition-all duration-400 ease-out shadow-[0_8px_32px_-8px_rgba(217,119,6,0.4),0_0_0_1px_rgba(217,119,6,0.2)] focus:outline-none focus-visible:ring-2 focus-visible:ring-savora-gold focus-visible:ring-offset-2 focus-visible:ring-offset-savora-dark overflow-hidden"
            style={{ backgroundSize: "200% 100%" }}
          >
            {/* Shine sweep effect */}
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" aria-hidden="true" />
            <span className="relative z-10">Reserve a Table</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="relative z-10 transition-transform group-hover:translate-x-1">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
          <p className="mt-4 text-neutral-500 text-sm">Or <a href="#experiences" className="text-savora-gold hover:text-savora-gold-light underline underline-offset-2 transition-colors duration-200">book the chef&rsquo;s table</a></p>
        </motion.div>
      </div>
    </section>
  );
}

export default Menu;