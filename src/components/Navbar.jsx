import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, ArrowUpRight, Menu as MenuIcon, Phone, ShoppingBag, UserRound, X } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { useShop } from "@/lib/shop";

const menuGroups = [
  { title: "Prime Cuts", copy: "Dry-aged ribeye, filet mignon, tomahawk", price: "$58 – $145" },
  { title: "House Signatures", copy: "Lobster mac, Wagyu burger, hot chicken", price: "$22 – $36" },
  { title: "Starters & Sides", copy: "Truffle fries, onion rings, raw bar", price: "$12 – $18" },
  { title: "Dessert & Cellar", copy: "Cheesecake, bourbon list, pairings", price: "from $12" },
];

const navLinks = [
  { label: "Menu", href: "#menu", id: "menu" },
  { label: "Our Story", href: "#story", id: "story" },
  { label: "Gallery", href: "#gallery", id: "gallery" },
  { label: "Reviews", href: "#reviews", id: "reviews" },
  { label: "Contact", href: "#contact", id: "contact" },
];

const sectionIds = ["home", "menu", "story", "gallery", "reviews", "experiences", "contact"];

const drawerLinks = [
  { label: "Home", href: "#home" },
  ...navLinks.slice(0, 4),
  { label: "Experiences", href: "#experiences" },
  navLinks[4],
];

function useActiveSection() {
  const [active, setActive] = useState("home");

  useEffect(() => {
    if (typeof IntersectionObserver !== "function") return;
    const nodes = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: [0, 0.2, 0.5, 1] },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  return active;
}

const linkClass =
  "group relative inline-flex items-center px-3.5 py-2 text-[12px] font-medium uppercase tracking-[0.16em] text-cream/65 transition-colors duration-300 hover:text-cream";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const active = useActiveSection();
  const { user, itemCount, openCart, openAccount } = useShop();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-[60] transition-all duration-500 ease-silk ${
          scrolled
            ? "border-b border-line bg-ink/90 shadow-[0_24px_70px_-45px_rgba(0,0,0,1)] backdrop-blur-xl"
            : "border-b border-transparent bg-gradient-to-b from-ink/70 via-ink/25 to-transparent"
        }`}
      >
        <nav
          aria-label="Primary"
          className={`mx-auto flex w-full max-w-8xl items-center justify-between gap-5 px-5 transition-[height] duration-500 ease-silk sm:px-7 lg:px-10 ${
            scrolled ? "h-[4.5rem]" : "h-[5.5rem]"
          }`}
        >
          {/* Wordmark */}
          <a href="#home" className="group flex shrink-0 items-center gap-3.5" aria-label="SAVORA — home">
            <span className="relative flex size-10 items-center justify-center rounded-full border border-gold/40 transition-transform duration-700 ease-silk group-hover:rotate-[10deg]">
              <span className="absolute inset-[3px] rounded-full bg-gradient-to-br from-gold/25 via-transparent to-transparent" />
              <span className="relative font-serif text-[17px] leading-none text-gold-light">S</span>
            </span>
            <span className="flex flex-col leading-none">
              <span className="font-serif text-[1.22rem] tracking-[0.34em] text-cream">SAVORA</span>
              <span className="mt-1.5 text-[8px] uppercase tracking-[0.44em] text-sand/70">Est. 2024</span>
            </span>
          </a>

          {/* Desktop links */}
          <div className="hidden items-center lg:flex">
            {navLinks.slice(0, 1).map((link) => (
              <a
                key={link.href}
                href={link.href}
                aria-current={active === link.id ? "true" : undefined}
                className={`${linkClass} ${active === link.id ? "text-cream" : ""}`}
              >
                {link.label}
                <span
                  aria-hidden="true"
                  className={`absolute inset-x-3.5 -bottom-px h-px origin-left bg-gradient-to-r from-gold/80 to-transparent transition-transform duration-500 ease-silk ${
                    active === link.id ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                  }`}
                />
              </a>
            ))}

            <NavigationMenu viewport={false} className="max-w-none flex-none">
              <NavigationMenuList className="flex-none">
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="group h-auto gap-1.5 rounded-none bg-transparent px-3.5 py-2 text-[12px] font-medium uppercase tracking-[0.16em] text-cream/65 hover:bg-transparent hover:text-cream focus:bg-transparent focus:text-cream data-[state=open]:bg-transparent data-[state=open]:text-cream">
                    Tonight&rsquo;s Menu
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="absolute left-1/2 top-full z-50 mt-3 w-[30rem] min-w-[30rem] max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-2xl border border-line bg-coal/[0.98] p-2.5 shadow-[0_50px_120px_-50px_rgba(0,0,0,1)] backdrop-blur-xl md:w-[30rem] md:min-w-[30rem]">
                    <div className="flex items-center justify-between px-4 pb-2.5 pt-3">
                      <span className="text-[9px] uppercase tracking-[0.34em] text-sand/60">
                        Kitchen · 5 PM – 11:30 PM
                      </span>
                      <a
                        href="#menu"
                        className="inline-flex items-center gap-1 text-[11px] text-gold-light/90 transition-colors hover:text-cream"
                      >
                        Full menu
                        <ArrowUpRight className="size-3" aria-hidden="true" />
                      </a>
                    </div>
                    <ul className="grid gap-0.5">
                      {menuGroups.map((group) => (
                        <li key={group.title}>
                          <NavigationMenuLink
                            href="#menu"
                            className="group flex w-full flex-row items-center justify-between gap-4 rounded-xl px-4 py-3.5 transition-colors duration-300 hover:bg-cream/[0.04] focus:bg-cream/[0.04]"
                          >
                            <span className="flex flex-col">
                              <span className="font-serif text-[15px] text-cream transition-colors group-hover:text-gold-light">
                                {group.title}
                              </span>
                              <span className="mt-0.5 text-[11px] text-sand/70">{group.copy}</span>
                            </span>
                            <span className="shrink-0 font-mono text-[10px] tabular-nums tracking-wide text-gold/80">
                              {group.price}
                            </span>
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            {navLinks.slice(1).map((link) => (
              <a
                key={link.href}
                href={link.href}
                aria-current={active === link.id ? "true" : undefined}
                className={`${linkClass} ${active === link.id ? "text-cream" : ""}`}
              >
                {link.label}
                <span
                  aria-hidden="true"
                  className={`absolute inset-x-3.5 -bottom-px h-px origin-left bg-gradient-to-r from-gold/80 to-transparent transition-transform duration-500 ease-silk ${
                    active === link.id ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                  }`}
                />
              </a>
            ))}
          </div>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-2.5">
            <a
              href="tel:+12125550184"
              className="hidden items-center gap-2 text-[12px] tracking-wide text-sand/80 transition-colors duration-300 hover:text-gold-light xl:inline-flex"
            >
              <Phone className="size-3.5" aria-hidden="true" />
              (212) 555-0184
            </a>
            <button
              type="button"
              onClick={openCart}
              aria-label={itemCount > 0 ? `Your order, ${itemCount} items` : "Your order"}
              className="relative inline-flex size-11 items-center justify-center rounded-full border border-line text-cream/85 transition-colors duration-300 hover:border-gold/60 hover:text-gold-light"
            >
              <ShoppingBag className="size-[18px]" aria-hidden="true" />
              {itemCount > 0 && (
                <span className="absolute -right-1 -top-1 inline-flex min-w-[18px] items-center justify-center rounded-full bg-gold px-1 text-[9px] font-semibold leading-[18px] text-ink">
                  {itemCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => (user ? openAccount() : openCart())}
              aria-label={user ? "Your account" : "Sign in"}
              className="inline-flex size-11 items-center justify-center rounded-full border border-line text-cream/85 transition-colors duration-300 hover:border-gold/60 hover:text-gold-light"
            >
              <UserRound className="size-[18px]" aria-hidden="true" />
            </button>
            <a href="#reserve" className="btn-gold hidden !px-6 !py-3 sm:inline-flex">
              Reserve
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </a>
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              aria-expanded={open}
              className="inline-flex size-11 items-center justify-center rounded-full border border-line text-cream transition-colors duration-300 hover:border-gold/60 hover:text-gold-light lg:hidden"
            >
              <MenuIcon className="size-5" aria-hidden="true" />
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[80] lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
          >
            <div
              className="absolute inset-0 bg-ink/85 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 32 }}
              className="absolute right-0 top-0 flex h-full w-[min(90vw,25rem)] flex-col overflow-y-auto border-l border-line bg-ink px-6 pb-8 pt-6"
            >
              <div className="flex items-center justify-between">
                <span className="font-serif text-base tracking-[0.32em] text-cream">SAVORA</span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                  className="inline-flex size-11 items-center justify-center rounded-full border border-line text-cream/80 transition-colors hover:border-gold/60 hover:text-gold-light"
                >
                  <X className="size-5" aria-hidden="true" />
                </button>
              </div>

              <nav aria-label="Mobile" className="mt-10 flex flex-col">
                {drawerLinks.map((link, i) => (
                  <motion.a
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    initial={{ opacity: 0, x: 18 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.06 + i * 0.045, duration: 0.4 }}
                    className="group flex items-baseline justify-between border-b border-line/60 py-4"
                  >
                    <span className="font-serif text-2xl font-light text-cream/90 transition-colors group-hover:text-gold-light">
                      {link.label}
                    </span>
                    <span className="font-mono text-[10px] tracking-widest text-sand/40">
                      0{i + 1}
                    </span>
                  </motion.a>
                ))}
              </nav>

              <a href="#reserve" onClick={() => setOpen(false)} className="btn-gold mt-8 w-full">
                Reserve a Table
                <ArrowRight className="size-4" aria-hidden="true" />
              </a>

              <div className="mt-auto space-y-2 pt-10 text-center text-[11px] leading-relaxed text-sand/70">
                <p>Tue – Sun · 5:00 PM – 11:30 PM</p>
                <a href="tel:+12125550184" className="block transition-colors hover:text-gold-light">
                  (212) 555-0184
                </a>
                <p>1428 Hudson Street, New York</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default Navbar;
