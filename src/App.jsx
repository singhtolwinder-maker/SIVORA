import { Suspense, lazy, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { Menu } from "./components/Menu";
import { Features } from "./components/Features";
import { ChefSpecial } from "./components/ChefSpecial";
import { Gallery } from "./components/Gallery";
import { Testimonials } from "./components/Testimonials";
import { Experiences } from "./components/Experiences";
import { Reservation } from "./components/Reservation";
import { Footer } from "./components/Footer";
import { Preloader } from "./components/ui/Preloader";
import { BackToTop, ScrollProgress } from "./components/ui/ScrollProgress";
import { Marquee } from "./components/ui/Marquee";
import { CartDrawer } from "./components/shop/CartDrawer";
import { AccountPanel } from "./components/shop/AccountPanel";
import { ShopProvider, useShop } from "./lib/shop";

// The house dashboard is the only thing that is split out of the storefront
// bundle: no public visitor needs its tables, forms and extra icons, and it is
// fetched on demand when /admin is opened. The cart drawer and account panel
// stay in the entry bundle on purpose - they read shop state to know whether
// they are open, so a lazy import would be requested during the first render
// anyway and only add a round trip to the first click.
const AdminApp = lazy(() => import("./admin/AdminApp"));

const marqueeItems = [
  "Dry-aged 28 days",
  "Live oak fire",
  "240-label cellar",
  "Butchered in-house",
  "West Village, NY",
  "Dinner from 5 PM",
];

/** Confirmation for cart actions, with a shortcut into the order drawer. */
function ShopToast() {
  const { toast, openCart } = useShop();
  if (!toast) return null;

  return (
    <div
      role="status"
      className="fixed bottom-6 left-1/2 z-[90] flex -translate-x-1/2 items-center gap-3 rounded-full border border-line bg-coal/95 px-4 py-2.5 text-[12px] text-cream shadow-[0_30px_80px_-40px_rgba(0,0,0,1)] backdrop-blur-xl"
    >
      <span>{toast}</span>
      <button
        type="button"
        onClick={openCart}
        className="text-[10px] uppercase tracking-[0.18em] text-gold-light transition-colors hover:text-cream"
      >
        View order
      </button>
    </div>
  );
}

function Storefront() {
  // Deep links mount after the browser's first scroll attempt, so re-apply once
  // fonts and images have settled the layout.
  useEffect(() => {
    if (!window.location.hash) return;
    const target = document.querySelector(window.location.hash);
    if (!target) return;
    const jump = () => target.scrollIntoView({ block: "start", behavior: "auto" });
    const frame = requestAnimationFrame(jump);
    const timer = setTimeout(jump, 700);
    window.addEventListener("load", jump);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
      window.removeEventListener("load", jump);
    };
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col bg-ink">
      <Preloader />
      <ScrollProgress />
      <Navbar />

      <main id="main">
        <Hero />
        <Marquee items={marqueeItems} />
        <Menu />
        <Features />
        <ChefSpecial />
        <Gallery />
        <Testimonials />
        <Experiences />
        <Reservation />
      </main>

      <Footer />
      <BackToTop />
      <CartDrawer />
      <AccountPanel />
      <ShopToast />
    </div>
  );
}

/** Matches the dashboard's own dark shell, so the split chunk does not flash white. */
function AdminFallback() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-screen items-center justify-center bg-ink px-6 text-center text-[11px] uppercase tracking-[0.3em] text-sand/70"
    >
      Loading the house dashboard…
    </div>
  );
}

function App() {
  // The house dashboard is a second entry point on the same bundle, so it keeps
  // working with the Vite dev server and a static SPA fallback.
  if (window.location.pathname.replace(/\/+$/, "") === "/admin") {
    return (
      <Suspense fallback={<AdminFallback />}>
        <AdminApp />
      </Suspense>
    );
  }

  return (
    <ShopProvider>
      <Storefront />
    </ShopProvider>
  );
}

export default App;
