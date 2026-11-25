/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        /* SAVORA core palette */
        ink: "#11110F",
        coal: "#191916",
        cream: "#F4EFE6",
        sand: "#A9A399",
        line: "rgba(198,164,106,0.22)",
        gold: {
          DEFAULT: "#C6A46A",
          light: "#D9B77A",
          deep: "#9A7B4B",
          ink: "#6E5633",
        },

        /* Re-mapped warm neutrals so every existing component inherits the palette */
        amber: {
          50: "#FBF7EF",
          100: "#F4EFE6",
          200: "#EADDC6",
          300: "#D9B77A",
          400: "#CFA96B",
          500: "#C6A46A",
          600: "#B08F58",
          700: "#8C6F42",
          800: "#6B5432",
          900: "#4A3A23",
          950: "#2A2115",
        },
        neutral: {
          50: "#FAF8F4",
          100: "#F5F0E8",
          200: "#E4DFD5",
          300: "#C9C3B8",
          400: "#A9A399",
          500: "#8C877D",
          600: "#6F6A61",
          700: "#54504A",
          800: "#3A3732",
          900: "#26241F",
          950: "#191916",
        },

        /* Semantic tokens for the conveyor + form primitives */
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },

        /* Kept for backwards compatibility with existing markup */
        savora: {
          gold: "#C6A46A",
          "gold-light": "#D9B77A",
          "gold-dark": "#9A7B4B",
          cream: "#F4EFE6",
          dark: "#11110F",
          charcoal: "#191916",
          ink: "#0D0D0B",
          smoke: "#191916",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "Segoe UI", "Roboto", "sans-serif"],
        serif: ["Playfair Display", "Georgia", "serif"],
        mono: ["ui-monospace", "Consolas", "monospace"],
      },
      letterSpacing: {
        widest: "0.24em",
        editorial: "0.34em",
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.75rem",
      },
      maxWidth: {
        "8xl": "90rem",
      },
      transitionTimingFunction: {
        silk: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "marquee-left": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        "slow-zoom": {
          from: { transform: "scale(1.02)" },
          to: { transform: "scale(1.1)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) both",
        "marquee-left": "marquee-left 38s linear infinite",
        shimmer: "shimmer 6s linear infinite",
        "slow-zoom": "slow-zoom 24s ease-in-out infinite alternate",
      },
    },
  },
  plugins: [],
}
