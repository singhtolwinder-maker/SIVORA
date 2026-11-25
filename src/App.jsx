import { useEffect } from "react";
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

const marqueeItems = [
  "Dry-aged 28 days",
  "Live oak fire",
  "240-label cellar",
  "Butchered in-house",
  "West Village, NY",
  "Dinner from 5 PM",
];

function App() {
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
    </div>
  );
}

export default App;
