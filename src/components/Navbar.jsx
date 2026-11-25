import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Menu as MenuIcon, Phone, X } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

const menuGroups = [
  { title: "Prime Cuts", copy: "Dry-aged ribeye, filet mignon, tomahawk", price: "$58 – $92" },
  { title: "House Signatures", copy: "Lobster mac, Wagyu burger, hot chicken", price: "$22 – $34" },
  { title: "Starters & Sides", copy: "Truffle fries, onion rings, raw bar", price: "$12 – $18" },
  { title: "Dessert & Cellar", copy: "Cheesecake, bourbon list, pairings", price: "from $12" },
];

const navLinks = [
  { label: "Our Story", href: "#story" },
  { label: "Experiences", href: "#experiences" },
  { label: "Reviews", href: "#reviews" },
  { label: "Contact", href: "#contact" },
];

const linkClass =
  "relative inline-flex items-center rounded-full px-4 py-2 text-[13px] font-medium tracking-wide text-neutral-300 transition-colors duration-300 hover:text-amber-200 focus-visible:text-amber-200";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen]);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          scrolled
            ? "border-b border-white/10 bg-[#080808]/90 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.9)] backdrop-blur-xl"
            : "border-b border-transparent bg-gradient-to-b from-black/70 to-transparent"
        }`}
      >
        <nav
          aria-label="Primary"
          className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8"
        >
          {/* Wordmark */}
          <a href="#home" className="group flex shrink-0 items-center gap-3">
            <span className="relative flex size-10 items-center justify-center rounded-full border border-amber-500/40 bg-gradient-to-br from-amber-500/25 via-amber-600/10 to-transparent transition-transform duration-500 group-hover:rotate-[8deg]">
              <span className="font-serif text-lg leading-none text-amber-200">S</span>
            </span>
            <span className="flex flex-col leading-none">
              <span className="font-serif text-xl tracking-[0.26em] text-amber-50">SAVORA</span>
              <span className="mt-1.5 text-[9px] uppercase tracking-[0.42em] text-neutral-500">
                Est. 2024
              </span>
            </span>
          </a>

          {/* Desktop navigation */}
          <div className="hidden items-center gap-0.5 lg:flex">
            <a href="#home" className={linkClass}>
              Home
            </a>

            <NavigationMenu viewport={false} className="max-w-none flex-none">
              <NavigationMenuList className="flex-none gap-0.5">
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="h-auto gap-1.5 rounded-full bg-transparent px-4 py-2 text-[13px] font-medium tracking-wide text-neutral-300 hover:bg-transparent hover:text-amber-200 focus:bg-transparent focus:text-amber-200 data-[state=open]:bg-transparent data-[state=open]:text-amber-200">
                    Menu
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="absolute left-1/2 top-full z-50 mt-4 w-[32rem] min-w-[32rem] max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-2xl border border-white/10 bg-[#0b0b0b]/97 p-2 shadow-[0_40px_100px_-40px_rgba(0,0,0,1)] backdrop-blur-xl md:w-[32rem] md:min-w-[32rem]">
                    <div className="mb-1 flex items-center justify-between px-4 pb-2 pt-3">
                      <span className="text-[10px] uppercase tracking-[0.32em] text-neutral-500">
                        Tonight&rsquo;s Menu
                      </span>
                      <a href="#menu" className="text-[11px] text-amber-300/90 hover:text-amber-200">
                        View all
                      </a>
                    </div>
                    <ul className="grid gap-0.5">
                      {menuGroups.map((group) => (
                        <li key={group.title}>
                          <NavigationMenuLink
                            href="#menu"
                            className="group flex w-full flex-row items-center justify-between gap-4 rounded-xl px-4 py-3 transition-colors duration-200 hover:bg-white/[0.05] focus:bg-white/[0.05]"
                          >
                            <span className="flex flex-col">
                              <span className="text-sm font-medium text-neutral-100 group-hover:text-amber-100">
                                {group.title}
                              </span>
                              <span className="mt-0.5 text-xs text-neutral-500">{group.copy}</span>
                            </span>
                            <span className="shrink-0 font-mono text-[11px] tabular-nums text-amber-400/80">
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

            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className={linkClass}>
                {link.label}
              </a>
            ))}
          </div>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-3">
            <a
              href="tel:+12125550184"
              className="hidden items-center gap-2 text-[13px] text-neutral-400 transition-colors duration-300 hover:text-amber-200 xl:inline-flex"
            >
              <Phone className="size-3.5" aria-hidden="true" />
              (212) 555-0184
            </a>
            <a href="#experiences" className="btn-gold hidden px-5 py-2.5 text-[13px] sm:inline-flex">
              Reserve a Table
              <ArrowRight className="size-4" aria-hidden="true" />
            </a>
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              aria-expanded={mobileOpen}
              className="inline-flex size-11 items-center justify-center rounded-full border border-white/15 text-neutral-200 transition-colors hover:border-amber-500/50 hover:text-amber-200 lg:hidden"
            >
              <MenuIcon className="size-5" aria-hidden="true" />
            </button>
          </div>
        </nav>

        {/* Hairline gold accent */}
        <div
          aria-hidden="true"
          className={`mx-auto h-px max-w-7xl bg-gradient-to-r from-transparent via-amber-500/30 to-transparent transition-opacity duration-500 ${
            scrolled ? "opacity-100" : "opacity-0"
          }`}
        />
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[60] lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
          >
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="absolute right-0 top-0 flex h-full w-[min(88vw,24rem)] flex-col border-l border-white/10 bg-[#0a0a0a] px-6 pb-8 pt-6"
            >
              <div className="flex items-center justify-between">
                <span className="font-serif text-base tracking-[0.3em] text-amber-100">SAVORA</span>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                  className="inline-flex size-11 items-center justify-center rounded-full border border-white/15 text-neutral-300 hover:border-amber-500/50 hover:text-amber-200"
                >
                  <X className="size-5" aria-hidden="true" />
                </button>
              </div>

              <nav aria-label="Mobile" className="mt-10 flex flex-col">
                {[{ label: "Home", href: "#home" }, { label: "Menu", href: "#menu" }, ...navLinks].map(
                  (link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="group flex items-center justify-between border-b border-white/[0.07] py-4 text-lg font-light text-neutral-200 transition-colors hover:text-amber-200"
                    >
                      {link.label}
                      <ArrowRight className="size-4 -translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" aria-hidden="true" />
                    </a>
                  ),
                )}
              </nav>

              <div className="mt-auto space-y-4 pt-8">
                <a
                  href="#experiences"
                  onClick={() => setMobileOpen(false)}
                  className="btn-gold w-full"
                >
                  Reserve a Table
                  <ArrowRight className="size-4" aria-hidden="true" />
                </a>
                <div className="space-y-1 text-center text-xs text-neutral-500">
                  <p>Tue – Sun · 5:00 PM – 11:30 PM</p>
                  <a href="tel:+12125550184" className="transition-colors hover:text-amber-300">
                    (212) 555-0184
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default Navbar;
