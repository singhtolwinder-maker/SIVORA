import { ArrowUpRight, Clock, Mail, MapPin, Phone } from "lucide-react";

const hours = [
  { day: "Tuesday – Thursday", time: "5:00 PM – 10:30 PM" },
  { day: "Friday – Saturday", time: "5:00 PM – 11:30 PM" },
  { day: "Sunday", time: "11:00 AM – 3:00 PM · 5:00 PM – 10:00 PM" },
  { day: "Monday", time: "Closed" },
];

const navigation = [
  { label: "Menu", href: "#menu" },
  { label: "Our Story", href: "#story" },
  { label: "Experiences", href: "#experiences" },
  { label: "Reviews", href: "#reviews" },
];

export function Footer() {
  return (
    <footer id="contact" className="relative scroll-mt-24 overflow-hidden bg-[#060606]">
      {/* Reservation band */}
      <div className="relative border-y border-white/[0.07] bg-[url('/images/room-interior.jpg')] bg-cover bg-center">
        <div className="absolute inset-0 bg-[#080808]/75" aria-hidden="true" />
        <div className="relative mx-auto flex w-full max-w-7xl flex-col items-center gap-6 px-4 py-16 text-center sm:px-6 lg:flex-row lg:justify-between lg:px-8 lg:text-left">
          <div>
            <p className="eyebrow justify-center lg:justify-start">
              <span className="gold-rule" aria-hidden="true" />
              Your table is waiting
            </p>
            <h2 className="mt-4 font-serif text-3xl font-light leading-tight text-white sm:text-4xl">
              Join us for dinner tonight.
            </h2>
          </div>
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <a href="tel:+12125550184" className="btn-ghost">
              <Phone className="size-4" aria-hidden="true" />
              (212) 555-0184
            </a>
            <a href="mailto:reservations@savora.com" className="btn-gold">
              Reserve by Email
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="mx-auto w-full max-w-7xl px-4 pb-10 pt-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full border border-amber-500/40 bg-gradient-to-br from-amber-500/25 to-transparent">
                <span className="font-serif text-lg leading-none text-amber-200">S</span>
              </span>
              <div className="flex flex-col leading-none">
                <span className="font-serif text-xl tracking-[0.26em] text-amber-50">SAVORA</span>
                <span className="mt-1.5 text-[9px] uppercase tracking-[0.42em] text-neutral-500">
                  American Restaurant
                </span>
              </div>
            </div>
            <p className="mt-6 max-w-xs text-sm leading-relaxed text-neutral-400">
              A wood-fired American kitchen in the West Village — dry-aged beef, Gulf seafood and a
              cellar built for long dinners.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["Wood-fired", "Dry-aged", "Full bar"].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-neutral-400"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Visit */}
          <div>
            <h3 className="text-[11px] font-medium uppercase tracking-[0.28em] text-neutral-500">
              Visit
            </h3>
            <ul className="mt-5 space-y-4 text-sm text-neutral-300">
              <li className="flex gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-amber-500/80" aria-hidden="true" />
                <span>
                  1428 Hudson Street
                  <br />
                  New York, NY 10013
                </span>
              </li>
              <li className="flex gap-3">
                <Phone className="mt-0.5 size-4 shrink-0 text-amber-500/80" aria-hidden="true" />
                <a href="tel:+12125550184" className="transition-colors hover:text-amber-200">
                  (212) 555-0184
                </a>
              </li>
              <li className="flex gap-3">
                <Mail className="mt-0.5 size-4 shrink-0 text-amber-500/80" aria-hidden="true" />
                <a
                  href="mailto:hello@savora.com"
                  className="transition-colors hover:text-amber-200"
                >
                  hello@savora.com
                </a>
              </li>
            </ul>
          </div>

          {/* Hours */}
          <div>
            <h3 className="text-[11px] font-medium uppercase tracking-[0.28em] text-neutral-500">
              Hours
            </h3>
            <ul className="mt-5 space-y-3 text-sm">
              {hours.map((row) => (
                <li key={row.day} className="flex flex-col gap-0.5">
                  <span className="text-neutral-300">{row.day}</span>
                  <span
                    className={`text-xs ${
                      row.time === "Closed" ? "text-amber-600/80" : "text-neutral-500"
                    }`}
                  >
                    {row.time}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Explore */}
          <div>
            <h3 className="text-[11px] font-medium uppercase tracking-[0.28em] text-neutral-500">
              Explore
            </h3>
            <ul className="mt-5 space-y-3 text-sm">
              {navigation.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="group inline-flex items-center gap-1.5 text-neutral-300 transition-colors hover:text-amber-200"
                  >
                    {item.label}
                    <ArrowUpRight
                      className="size-3.5 -translate-x-0.5 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100"
                      aria-hidden="true"
                    />
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex items-center gap-2 text-xs text-neutral-500">
              <Clock className="size-3.5" aria-hidden="true" />
              Kitchen closes 30 min before the room
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/[0.07] pt-7 text-xs text-neutral-600 sm:flex-row">
          <p>© {new Date().getFullYear()} SAVORA. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <a href="#home" className="transition-colors hover:text-neutral-400">
              Back to top
            </a>
            <span className="text-neutral-800" aria-hidden="true">
              |
            </span>
            <span>West Village, New York</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
