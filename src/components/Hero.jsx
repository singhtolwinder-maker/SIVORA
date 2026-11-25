import { motion } from "motion/react";
import { useRef, useEffect, useState } from "react";

export function Hero() {
  const heroRef = useRef(null);
  const foodImageRef = useRef(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isLoaded, setIsLoaded] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX / innerWidth - 0.5) * 2;
      const y = (e.clientY / innerHeight - 0.5) * 2;
      setMousePosition({ x, y });
    };

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const maxScroll = window.innerHeight;
      setScrollProgress(Math.min(scrollY / maxScroll, 1));
    };

    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0.1 }
    );
    if (heroRef.current) observer.observe(heroRef.current);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.85,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  const headingVariants = {
    hidden: { opacity: 0, y: 40, scale: 0.98 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 1.1,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  const imageVariants = {
    hidden: { opacity: 0, scale: 0.96, filter: "blur(24px)" },
    visible: {
      opacity: 1,
      scale: 1,
      filter: "blur(0px)",
      transition: {
        duration: 1.5,
        ease: [0.16, 1, 0.3, 1],
        delay: 0.3,
      },
    },
  };

  const badgeVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.7,
        ease: [0.16, 1, 0.3, 1],
        delay: 0.1,
      },
    },
  };

  return (
    <section
      ref={heroRef}
      id="home"
      className="relative flex min-h-screen scroll-mt-24 items-center justify-center overflow-hidden bg-[#050505] pt-20"
      aria-labelledby="hero-heading"
      style={{ willChange: "transform" }}
    >
      {/* Background Atmosphere Layers - Deep Black/Charcoal with Refined Gold */}
      <div className="absolute inset-0 z-0" aria-hidden="true">
        {/* Deep base - pure black */}
        <div className="absolute inset-0 bg-[#050505]" />

        {/* Charcoal gradient layer */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#050505] to-[#000000]" />

        {/* Primary radial warmth - center, refined gold */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] rounded-full bg-gradient-to-r from-amber-900/12 via-amber-800/4 to-transparent blur-3xl opacity-70"
          style={{ filter: "blur(140px)" }}
        />

        {/* Secondary glow - lower right, subtle ivory warmth */}
        <div
          className="absolute bottom-0 right-0 w-[700px] h-[700px] rounded-full bg-gradient-to-tr from-amber-700/8 via-amber-600/3 to-transparent blur-3xl opacity-50"
          style={{ filter: "blur(120px)", transform: "translate(35%, 35%)" }}
        />

        {/* Top accent glow - warm ivory */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-b from-amber-800/6 via-amber-700/2 to-transparent blur-3xl opacity-40"
        />

        {/* Deep vignette for cinematic depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />
        <div className="absolute inset-0 bg-gradient-to-l from-black/40 via-transparent to-black/40" />

        {/* Subtle grain texture overlay for film-like quality */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Elegant top border line - refined gold */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-px bg-gradient-to-r from-transparent via-amber-600/30 to-transparent"
        />

        {/* Subtle radial highlight for depth perception */}
        <div
          className="absolute top-1/3 left-1/3 w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-amber-500/3 to-transparent blur-3xl opacity-30"
          style={{ filter: "blur(80px)" }}
        />
      </div>

      {/* Floating Ambient Particles - Gold/Ivory dust motes */}
      <div className="absolute inset-0 z-[5] pointer-events-none overflow-hidden" aria-hidden="true">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <motion.div
            key={i}
            initial={false}
            animate={{
              y: [0, -30 + i * 3, 0],
              x: [0, 20 - i * 2, 0],
              opacity: [0.08, 0.25, 0.08],
              scale: [0.7, 1.3, 0.7],
            }}
            transition={{
              duration: 20 + i * 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 2.5,
            }}
            className="absolute rounded-full bg-gradient-to-r from-amber-300/40 to-amber-500/20 blur-xl"
            style={{
              width: 3 + i * 1.5,
              height: 3 + i * 1.5,
              top: 12 + i * 11,
              left: 8 + i * 16,
            }}
          />
        ))}
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={`right-${i}`}
            initial={false}
            animate={{
              y: [0, -25 + i * 2, 0],
              x: [0, -15 + i, 0],
              opacity: [0.06, 0.2, 0.06],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 22 + i * 5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1.5 + i * 3,
            }}
            className="absolute rounded-full bg-gradient-to-r from-amber-200/30 to-amber-400/15 blur-xl"
            style={{
              width: 2.5 + i,
              height: 2.5 + i,
              top: 20 + i * 16,
              right: 12 + i * 14,
            }}
          />
        ))}
        {/* Ivory particles near center */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={`center-${i}`}
            initial={false}
            animate={{
              y: [0, -18, 0],
              x: [0, 10 - i * 5, 0],
              opacity: [0.1, 0.3, 0.1],
              scale: [0.9, 1.15, 0.9],
            }}
            transition={{
              duration: 16 + i * 3,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5 + i * 2,
            }}
            className="absolute rounded-full bg-gradient-to-r from-amber-100/40 to-amber-200/20 blur-lg"
            style={{
              width: 4 + i,
              height: 4 + i,
              top: "45%",
              left: "48%",
              transform: `translate(-50%, -50%) rotate(${i * 120}deg) translateX(120px)`,
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* Content Column - Left */}
          <div className="relative z-20">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              className="space-y-8"
            >
              {/* Eyebrow / Badge - Refined Gold */}
              <motion.span
                variants={badgeVariants}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-amber-600/30 text-[11px] font-medium tracking-[0.35em] uppercase text-amber-300"
              >
                <span className="relative flex h-1.5 w-1.5">
                  <motion.span
                    className="absolute inset-0 h-1.5 w-1.5 rounded-full bg-amber-400 opacity-90"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.9, 1, 0.9] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <span className="relative h-1.5 w-1.5 rounded-full bg-amber-400" />
                </span>
                SAVORA — Est. 2024
              </motion.span>

              {/* Main Headline - "A Taste Worth Remembering" */}
              <motion.h1
                id="hero-heading"
                variants={headingVariants}
                className="relative font-serif text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-light leading-[1.02] tracking-tight text-white max-w-none"
                style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
              >
                <span className="block bg-gradient-to-r from-white via-amber-50 to-amber-200 bg-clip-text text-transparent">
                  A Taste Worth Remembering
                </span>
                {/* Decorative underline - refined gold */}
                <span
                  className="absolute -bottom-3 left-0 w-32 h-px bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 opacity-70"
                  aria-hidden="true"
                />
              </motion.h1>

              {/* Supporting Text */}
              <motion.p
                variants={itemVariants}
                className="text-base sm:text-lg lg:text-xl text-neutral-300/85 leading-relaxed max-w-xl font-light tracking-wide"
              >
                Discover exceptional food, unforgettable flavours, and moments worth sharing.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                variants={itemVariants}
                className="flex flex-col sm:flex-row items-start sm:items-center gap-4"
              >
                {/* Primary CTA - "Explore Our Menu" */}
                <motion.a
                  href="#menu"
                  whileHover={{ scale: 1.02, y: -3, boxShadow: "0 25px 60px -20px rgba(217,119,6,0.5)" }}
                  whileTap={{ scale: 0.97 }}
                  className="relative group inline-flex items-center justify-center gap-3 px-10 py-4 rounded-full bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 text-[#050505] font-medium text-lg tracking-wide overflow-hidden shadow-[0_20px_50px_-15px_rgba(217,119,6,0.4)] transition-all duration-500 ease-out"
                >
                  {/* Shine sweep effect - refined gold */}
                  <span
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full"
                    style={{ transform: "skewX(-20deg)" }}
                  >
                    <motion.span
                      initial={{ x: "-120%" }}
                      animate={{ x: "120%" }}
                      transition={{ duration: 3.5, repeat: Infinity, ease: "linear", delay: 1.2 }}
                      className="absolute inset-0"
                    />
                  </span>
                  {/* Subtle inner glow */}
                  <span className="absolute inset-0 bg-gradient-to-r from-amber-400/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" aria-hidden="true" />
                  <span className="relative z-10">Explore Our Menu</span>
                  <motion.svg
                    className="relative z-10 size-5 stroke-current transition-transform duration-300 group-hover:translate-x-1"
                    viewBox="0 0 24 24"
                    fill="none"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </motion.svg>
                </motion.a>

                {/* Secondary CTA - Glass/Ivory */}
                <motion.a
                  href="#experiences"
                  whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.12)", borderColor: "rgba(251,191,36,0.5)" }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full border border-amber-600/40 bg-white/5 backdrop-blur-md text-amber-100 font-medium text-lg tracking-wide hover:bg-white/10 hover:border-amber-500/60 hover:text-white transition-all duration-300 ease-out"
                >
                  Reserve a Table
                </motion.a>
              </motion.div>

              {/* Trust Indicators / Stats */}
              <motion.div
                variants={itemVariants}
                className="flex flex-wrap items-center gap-6 sm:gap-10 pt-6 border-t border-white/10"
              >
                <div className="flex items-center gap-3">
                  <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-500/15 to-amber-600/5 border border-amber-500/30">
                    <svg className="size-5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm tracking-wide">Reservations</p>
                    <p className="text-neutral-400 text-xs">Available Daily</p>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-3">
                  <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-500/15 to-amber-600/5 border border-amber-500/30">
                    <svg className="size-5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 6v6l4 2" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm tracking-wide">Tue – Sun</p>
                    <p className="text-neutral-400 text-xs">5 PM – 11:30 PM</p>
                  </div>
                </div>
                <div className="hidden md:flex items-center gap-3">
                  <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-500/15 to-amber-600/5 border border-amber-500/30">
                    <svg className="size-5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M21 10V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h4" />
                      <path d="M3 10h18M7 10v10a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-4" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm tracking-wide">Private Dining</p>
                    <p className="text-neutral-400 text-xs">Up to 40 Guests</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* Visual Column - Right: Premium American Food Photography */}
          <div className="relative z-10">
            <motion.div
              variants={imageVariants}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              className="relative"
              role="img"
              aria-label="Premium dry-aged ribeye steak with herb compound butter, charred edges, served on warm cast iron with roasted garlic, fresh thyme, and crispy shallots - fine dining presentation"
            >
              {/* Multi-layer ambient glow behind image */}
              <div
                className="absolute -inset-8 lg:-inset-12 -z-10 rounded-3xl bg-gradient-to-br from-amber-900/25 via-amber-800/8 to-transparent blur-3xl opacity-60"
                aria-hidden="true"
              />
              <div
                className="absolute -inset-4 lg:-inset-6 -z-10 rounded-3xl bg-gradient-to-br from-amber-700/15 to-transparent blur-2xl opacity-40"
                aria-hidden="true"
              />
              <div
                className="absolute -inset-1 lg:-inset-2 -z-10 rounded-3xl bg-gradient-to-tr from-amber-600/10 to-transparent blur-xl opacity-30"
                aria-hidden="true"
              />

              {/* Elegant frame/border - refined gold */}
              <div className="absolute inset-0 rounded-3xl border border-amber-700/40 bg-gradient-to-tr from-amber-600/8 to-transparent opacity-60" aria-hidden="true" />
              <div className="absolute inset-0 rounded-3xl border border-white/5" aria-hidden="true" />

              {/* Image Container */}
              <div className="relative rounded-2xl overflow-hidden">
                <img
                  ref={foodImageRef}
                  src="/images/hero-steak.jpg"
                  alt=""
                  className="w-full h-auto object-cover aspect-[4/3] sm:aspect-[5/4] lg:aspect-[4/3] transition-opacity duration-1000 ease-out"
                  style={{
                    opacity: isLoaded ? 1 : 0,
                    transform: `translate3d(${mousePosition.x * 8}px, ${mousePosition.y * 8}px, 0) scale(${1 + Math.abs(mousePosition.x) * 0.01})`,
                    willChange: "transform, opacity",
                  }}
                  onLoad={() => setIsLoaded(true)}
                  loading="eager"
                  fetchPriority="high"
                  width="1400"
                  height="1050"
                />

                {/* Subtle vignette overlay on image for depth */}
                <div
                  className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/8 to-transparent pointer-events-none"
                  aria-hidden="true"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent pointer-events-none"
                  aria-hidden="true"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-r from-black/15 via-transparent to-black/15 pointer-events-none"
                  aria-hidden="true"
                />

                {/* Bottom gold accent line */}
                <div
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4/5 h-px bg-gradient-to-r from-transparent via-amber-400/70 to-transparent"
                  aria-hidden="true"
                />

                {/* Corner accents - refined gold brackets */}
                <div className="absolute top-4 left-4 w-[72px] h-[72px] border-t-2 border-l-2 border-amber-400/50 rounded-tl-xl" aria-hidden="true" />
                <div className="absolute top-4 right-4 w-[72px] h-[72px] border-t-2 border-r-2 border-amber-400/50 rounded-tr-xl" aria-hidden="true" />
                <div className="absolute bottom-4 left-4 w-[72px] h-[72px] border-b-2 border-l-2 border-amber-400/50 rounded-bl-xl" aria-hidden="true" />
                <div className="absolute bottom-4 right-4 w-[72px] h-[72px] border-b-2 border-r-2 border-amber-400/50 rounded-br-xl" aria-hidden="true" />

                {/* Inner corner highlights */}
                <div className="absolute top-4 left-4 w-[72px] h-[72px] border-t-2 border-l-2 border-amber-200/20 rounded-tl-xl" aria-hidden="true" />
                <div className="absolute top-4 right-4 w-[72px] h-[72px] border-t-2 border-r-2 border-amber-200/20 rounded-tr-xl" aria-hidden="true" />
                <div className="absolute bottom-4 left-4 w-[72px] h-[72px] border-b-2 border-l-2 border-amber-200/20 rounded-bl-xl" aria-hidden="true" />
                <div className="absolute bottom-4 right-4 w-[72px] h-[72px] border-b-2 border-r-2 border-amber-200/20 rounded-br-xl" aria-hidden="true" />
              </div>

              {/* Floating label/badge on image - premium quality indicator */}
              <motion.div
                initial={false}
                animate={{ y: [0, -10, 0], opacity: [0.85, 1, 0.85] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-amber-500/40 bg-black/85 px-4 py-2.5 text-[10px] font-medium uppercase tracking-[0.18em] text-amber-100 shadow-[0_15px_50px_-15px_rgba(0,0,0,0.6)] backdrop-blur-md sm:px-6 sm:py-3 sm:text-xs sm:tracking-widest"
              >
                Dry-Aged 28 Days • USDA Prime
              </motion.div>

              {/* Subtle floating glow beneath badge */}
              <motion.div
                initial={false}
                animate={{ scale: [1, 1.08, 1], opacity: [0.25, 0.45, 0.25] }}
                transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full bg-gradient-to-r from-amber-500/15 to-transparent blur-3xl"
                aria-hidden="true"
              />

              {/* Premium steak temperature indicator */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 1.2, ease: [0.16, 1, 0.3, 1] }}
                className="absolute top-6 right-6 px-4 py-2.5 rounded-full bg-black/70 backdrop-blur-sm border border-amber-600/40 text-amber-200 text-xs font-medium tracking-wider uppercase shadow-[0_8px_30px_-8px_rgba(0,0,0,0.5)]"
              >
                Medium Rare • 130°F
              </motion.div>
            </motion.div>

            {/* Decorative geometric elements - refined gold */}
            <div className="absolute -top-10 -right-10 w-36 h-36 border-2 border-amber-500/15 rounded-full" aria-hidden="true" />
            <div className="absolute -bottom-10 -left-10 w-28 h-28 border-2 border-amber-500/10 rounded-full" aria-hidden="true" />
            <div className="absolute top-1/2 -right-14 w-px h-40 bg-gradient-to-b from-transparent via-amber-500/20 to-transparent" aria-hidden="true" />

            {/* Additional geometric accent - bottom left */}
            <div className="absolute bottom-20 left-20 w-2 h-24 bg-gradient-to-b from-amber-400/30 to-transparent rounded-full" aria-hidden="true" />
            <div className="absolute bottom-20 left-20 w-24 h-2 bg-gradient-to-r from-amber-400/30 to-transparent rounded-full" aria-hidden="true" />

            {/* Floating line accent - top right */}
            <div className="absolute top-20 right-20 w-32 h-px bg-gradient-to-r from-transparent to-amber-400/30" aria-hidden="true" />
            <div className="absolute top-20 right-20 w-px h-16 bg-gradient-to-b from-transparent to-amber-400/30" aria-hidden="true" />
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2, duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="absolute bottom-8 left-1/2 z-20 hidden -translate-x-1/2 flex-col items-center gap-3 text-neutral-500/60 lg:flex"
        aria-hidden="true"
      >
        <span className="text-[10px] font-medium tracking-[0.4em] uppercase text-neutral-400/50">Scroll to Discover</span>
        <motion.div
          animate={{ y: [0, 12, 0], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-amber-400/80"
          >
            <path d="M12 5v14M19 12l-7 7-7-7" />
          </svg>
        </motion.div>
      </motion.div>

      {/* Scroll Progress Bar - refined gold */}
      <motion.div
        className="fixed top-0 left-0 h-px w-full z-50 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 origin-left"
        style={{
          transform: `scaleX(${scrollProgress})`,
          transformOrigin: "left center",
        }}
        aria-hidden="true"
      />
    </section>
  );
}

export default Hero;