import { Facebook, Instagram, Mail, MapPin, Phone, Twitter } from "lucide-react";
import { Reveal } from "./ui/Reveal";
import { Magnetic } from "./ui/Magnetic";
import { ContactForm } from "./ContactForm";

const hours = [
  { day: "Tuesday – Thursday", time: "5:00 PM – 10:30 PM" },
  { day: "Friday – Saturday", time: "5:00 PM – 11:30 PM" },
  { day: "Sunday", time: "11:00 AM – 3:00 PM · 5:00 PM – 10:00 PM" },
  { day: "Monday", time: "Closed" },
];

const navigation = [
  { label: "Menu", href: "#menu" },
  { label: "Our Story", href: "#story" },
  { label: "Chef's Table", href: "#chef" },
  { label: "Gallery", href: "#gallery" },
  { label: "Experiences", href: "#experiences" },
];

const socials = [
  { label: "Instagram", href: "https://instagram.com", icon: Instagram },
  { label: "Facebook", href: "https://facebook.com", icon: Facebook },
  { label: "X", href: "https://x.com", icon: Twitter },
];

export function Footer() {
  return (
    <footer id="contact" className="relative scroll-mt-24 overflow-hidden bg-ink">
      {/* Reservation band */}
      <div className="relative isolate border-t border-line/60">
        <div className="absolute inset-0 -z-10">
          <img
            src="/images/interior-night.jpg"
            alt=""
            loading="lazy"
            className="size-full object-cover"
          />
          <div className="absolute inset-0 bg-ink/85" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/70 to-ink/40" />
        </div>

        <div className="section-shell flex flex-col items-start gap-8 py-16 text-left lg:flex-row lg:items-center lg:justify-between lg:py-20">
          <div>
            <p className="eyebrow">
              <span className="gold-rule" aria-hidden="true" />
              Your table is waiting
            </p>
            <h2 className="mt-4 max-w-lg font-serif text-3xl font-light leading-tight text-cream sm:text-[2.7rem]">
              Join us for dinner
              <br />
              <span className="italic text-gold-light">tonight.</span>
            </h2>
          </div>
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <Magnetic>
              <a href="tel:+12125550184" className="btn-ghost w-full sm:w-auto">
                <Phone className="size-4" aria-hidden="true" />
                (212) 555-0184
              </a>
            </Magnetic>
            <Magnetic>
              <a href="#reserve" className="btn-gold w-full sm:w-auto">
                Reserve a Table
              </a>
            </Magnetic>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="section-shell pb-10 pt-14 lg:pt-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3.5">
              <span className="relative flex size-10 items-center justify-center rounded-full border border-gold/40">
                <span className="absolute inset-[3px] rounded-full bg-gradient-to-br from-gold/25 via-transparent to-transparent" />
                <span className="relative font-serif text-[17px] leading-none text-gold-light">S</span>
              </span>
              <div className="flex flex-col leading-none">
                <span className="font-serif text-[1.22rem] tracking-[0.34em] text-cream">SAVORA</span>
                <span className="mt-1.5 text-[8px] uppercase tracking-[0.44em] text-sand/60">
                  American Restaurant
                </span>
              </div>
            </div>

            <p className="mt-6 max-w-xs text-[13px] leading-relaxed text-sand/75">
              A wood-fired American kitchen in the West Village — dry-aged beef, Gulf seafood and a
              cellar built for long dinners.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {["Wood-fired", "Dry-aged", "Full bar"].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-line/80 px-3 py-1 text-[9px] uppercase tracking-[0.2em] text-sand/65"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="mt-7 flex items-center gap-2.5">
              {socials.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={`SAVORA on ${social.label}`}
                    className="inline-flex size-9 items-center justify-center rounded-full border border-line text-cream/65 transition-colors duration-300 hover:border-gold/60 hover:text-gold-light"
                  >
                    <Icon className="size-4" aria-hidden="true" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Visit */}
          <div>
            <h3 className="text-[9px] font-medium uppercase tracking-[0.3em] text-sand/55">Visit</h3>
            <ul className="mt-5 space-y-4 text-[13px] text-cream/80">
              <li className="flex gap-3">
                <MapPin className="mt-0.5 size-3.5 shrink-0 text-gold/70" aria-hidden="true" />
                <span className="leading-relaxed">
                  1428 Hudson Street
                  <br />
                  New York, NY 10013
                </span>
              </li>
              <li className="flex gap-3">
                <Phone className="mt-0.5 size-3.5 shrink-0 text-gold/70" aria-hidden="true" />
                <a href="tel:+12125550184" className="transition-colors hover:text-gold-light">
                  (212) 555-0184
                </a>
              </li>
              <li className="flex gap-3">
                <Mail className="mt-0.5 size-3.5 shrink-0 text-gold/70" aria-hidden="true" />
                <a href="mailto:hello@savora.com" className="transition-colors hover:text-gold-light">
                  hello@savora.com
                </a>
              </li>
            </ul>
          </div>

          {/* Hours */}
          <div>
            <h3 className="text-[9px] font-medium uppercase tracking-[0.3em] text-sand/55">Hours</h3>
            <ul className="mt-5 space-y-3.5 text-[13px]">
              {hours.map((row) => (
                <li key={row.day} className="flex flex-col gap-0.5">
                  <span className="text-cream/80">{row.day}</span>
                  <span className={`text-[11px] ${row.time === "Closed" ? "text-gold/70" : "text-sand/55"}`}>
                    {row.time}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Explore */}
          <div>
            <h3 className="text-[9px] font-medium uppercase tracking-[0.3em] text-sand/55">Explore</h3>
            <ul className="mt-5 space-y-3 text-[13px]">
              {navigation.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="group inline-flex items-center gap-2 text-cream/75 transition-colors hover:text-gold-light"
                  >
                    {item.label}
                    <span
                      aria-hidden="true"
                      className="h-px w-0 bg-gold/60 transition-all duration-300 group-hover:w-4"
                    />
                  </a>
                </li>
              ))}
            </ul>
            <a href="#reserve" className="mt-6 inline-flex items-center gap-1.5 text-[9px] uppercase tracking-[0.24em] text-gold/80 transition-colors hover:text-gold-light">
              Reservations
              <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>

        {/* Contact */}
        <div className="mt-14 grid gap-8 rounded-2xl border border-line/70 bg-coal/40 p-6 lg:grid-cols-[0.85fr_1.15fr] lg:p-9">
          <div>
            <p className="eyebrow">
              <span className="gold-rule" aria-hidden="true" />
              Write to us
            </p>
            <h2 className="mt-4 font-serif text-2xl font-light leading-tight text-cream sm:text-3xl">
              Questions, private dining,
              <br />
              <span className="italic text-gold-light">or just a hello.</span>
            </h2>
            <p className="mt-4 max-w-sm text-[13px] leading-relaxed text-sand/80">
              Send a note and our team will reply within one business day. For same-day tables,
              call us directly.
            </p>
            <div className="mt-6 space-y-2 text-[13px] text-cream/80">
              <a href="tel:+12125550184" className="flex items-center gap-2.5 transition-colors hover:text-gold-light">
                <Phone className="size-3.5 text-gold/70" aria-hidden="true" />
                (212) 555-0184
              </a>
              <a href="mailto:hello@savora.com" className="flex items-center gap-2.5 transition-colors hover:text-gold-light">
                <Mail className="size-3.5 text-gold/70" aria-hidden="true" />
                hello@savora.com
              </a>
            </div>
          </div>

          <ContactForm />
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-line/60 pt-6 text-[10px] text-sand/45 sm:flex-row">
          <p>© {new Date().getFullYear()} SAVORA. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <a href="#home" className="transition-colors hover:text-cream">
              Back to top
            </a>
            <span className="text-line" aria-hidden="true">·</span>
            <span>West Village, New York</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
