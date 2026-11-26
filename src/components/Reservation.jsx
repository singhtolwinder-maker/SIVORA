import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, CalendarCheck, Check, Clock, MapPin, Phone, Users } from "lucide-react";
import { api } from "../lib/api";
import { Reveal } from "./ui/Reveal";

const times = ["5:00 PM", "5:30 PM", "6:00 PM", "6:30 PM", "7:00 PM", "7:30 PM", "8:00 PM", "8:30 PM", "9:00 PM", "9:30 PM"];
const partySizes = ["1 guest", "2 guests", "3 guests", "4 guests", "5 guests", "6 guests", "7+ guests"];
const occasions = ["No occasion", "Birthday", "Anniversary", "Business dinner", "Celebration"];

const today = new Date().toISOString().slice(0, 10);

/** "7:00 PM" -> "19:00", the 24h format the API expects. */
function to24Hour(label) {
  const [clock, meridiem] = label.split(" ");
  const [hour, minute] = clock.split(":").map(Number);
  const hours = meridiem === "PM" ? (hour % 12) + 12 : hour % 12;
  return `${String(hours).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/** "4 guests" -> 4; "7+ guests" -> 7 (the team calls for larger parties). */
function toPartySize(label) {
  return Number.parseInt(label, 10) || 1;
}

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  date: "",
  time: "",
  guests: "2 guests",
  occasion: "No occasion",
  notes: "",
};

function validate(values) {
  const errors = {};

  if (!values.name.trim()) errors.name = "Please tell us your name.";
  else if (values.name.trim().length < 2) errors.name = "That name looks a little short.";

  if (!values.email.trim()) errors.email = "We need an email to confirm.";
  else if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(values.email.trim())) errors.email = "Check the email address.";

  if (values.phone.trim() && !/^[+()\d\s-]{7,18}$/.test(values.phone.trim()))
    errors.phone = "Use digits, spaces or + ( ) - only.";

  if (!values.date) errors.date = "Choose a date.";
  else if (values.date < today) errors.date = "That date has already passed.";

  if (!values.time) errors.time = "Choose a seating time.";

  return errors;
}

const fieldOrder = ["name", "email", "phone", "date", "time"];

export function Reservation() {
  const [values, setValues] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const formRef = useRef(null);

  const update = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const found = validate(values);
    setErrors(found);
    setFormError("");

    if (Object.keys(found).length > 0) {
      const first = fieldOrder.find((field) => found[field]);
      if (first) formRef.current?.querySelector(`[name="${first}"]`)?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.createReservation({
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        date: values.date,
        time: to24Hour(values.time),
        partySize: toPartySize(values.guests),
        occasion: values.occasion === "No occasion" ? "" : values.occasion,
        notes: values.notes.trim(),
      });

      setSubmitted({ ...values, code: response?.data?.reservationCode ?? "" });
    } catch (error) {
      // Field-level validation comes back as `details`; anything else is shown
      // as a single message above the button.
      const details = Array.isArray(error?.details) ? error.details : [];
      const mapped = details.reduce((accumulator, detail) => {
        if (detail?.field && !accumulator[detail.field]) accumulator[detail.field] = detail.message;
        return accumulator;
      }, {});

      if (Object.keys(mapped).length > 0) {
        setErrors(mapped);
        const first = fieldOrder.find((field) => mapped[field]);
        if (first) formRef.current?.querySelector(`[name="${first}"]`)?.focus();
      } else {
        setFormError(error?.message || "We could not reach the reservation desk. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setValues(emptyForm);
    setErrors({});
    setFormError("");
    setSubmitted(null);
  };

  const prettyDate = useMemo(() => {
    if (!submitted?.date) return "";
    const date = new Date(`${submitted.date}T12:00:00`);
    return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  }, [submitted]);

  return (
    <section
      id="reserve"
      aria-labelledby="reserve-heading"
      className="relative scroll-mt-24 overflow-hidden border-t border-line/60 bg-coal py-20 lg:py-28"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute right-0 top-0 size-[36rem] rounded-full bg-[radial-gradient(circle,rgba(198,164,106,0.1),transparent_65%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/25 to-transparent" />
      </div>

      <div className="section-shell relative grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        {/* Details */}
        <div>
          <Reveal>
            <p className="eyebrow">
              <span className="gold-rule" aria-hidden="true" />
              Reservations
            </p>
            <h2
              id="reserve-heading"
              className="mt-5 font-serif text-[2.15rem] font-light leading-[1.06] text-cream sm:text-5xl"
            >
              Your table,
              <br />
              <span className="italic text-gold-light">waiting.</span>
            </h2>
            <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-sand">
              We hold every table for fifteen minutes. For parties of seven or more, our team will
              call to arrange the Library room.
            </p>
          </Reveal>

          <Reveal delay={0.12} className="mt-9 space-y-4">
            {[
              { icon: Clock, title: "Hours", copy: "Tue – Sun · 5:00 PM – 11:30 PM\nMonday closed" },
              { icon: MapPin, title: "Find us", copy: "1428 Hudson Street\nNew York, NY 10013" },
              { icon: Phone, title: "Prefer to call", copy: "(212) 555-0184", href: "tel:+12125550184" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex gap-4 border-b border-line/60 pb-4">
                  <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-line text-gold/80">
                    <Icon className="size-3.5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.28em] text-sand/70">{item.title}</p>
                    {item.href ? (
                      <a href={item.href} className="mt-1 block text-sm text-cream/90 transition-colors hover:text-gold-light">
                        {item.copy}
                      </a>
                    ) : (
                      <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-cream/85">{item.copy}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </Reveal>

          <Reveal delay={0.18} className="mt-6 rounded-xl border border-line/70 bg-ink/40 p-5">
            <p className="text-[9px] uppercase tracking-[0.28em] text-gold/80">Private dining</p>
            <p className="mt-2 text-[13px] leading-relaxed text-sand/80">
              The Library room seats up to 40 with a dedicated captain and sommelier. Ask for
              <a href="mailto:reservations@savora.com" className="mx-1 text-cream underline decoration-gold/40 underline-offset-4 transition-colors hover:text-gold-light">
                reservations@savora.com
              </a>
              and we&rsquo;ll send the room pack.
            </p>
          </Reveal>
        </div>

        {/* Form */}
        <Reveal delay={0.08}>
          <div className="relative rounded-2xl border border-line bg-ink/60 p-6 backdrop-blur-sm sm:p-9">
            <AnimatePresence mode="wait">
              {submitted ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  className="flex min-h-[26rem] flex-col items-center justify-center text-center"
                  role="status"
                >
                  <span className="inline-flex size-14 items-center justify-center rounded-full border border-gold/40 bg-gold/10 text-gold-light">
                    <Check className="size-6" aria-hidden="true" />
                  </span>
                  <h3 className="mt-6 font-serif text-3xl font-light text-cream">Table requested</h3>
                  <p className="mt-3 max-w-sm text-sm leading-relaxed text-sand">
                    Thank you, {submitted.name.split(" ")[0]}. We&rsquo;ve noted your request and will
                    confirm by email within the hour.
                  </p>

                  <dl className="mt-7 w-full max-w-sm divide-y divide-line/60 border-y border-line/60 text-left">
                    {[
                      { icon: CalendarCheck, label: "Date", value: prettyDate },
                      { icon: Clock, label: "Seating", value: submitted.time },
                      { icon: Users, label: "Party", value: submitted.guests },
                    ].map((row) => {
                      const Icon = row.icon;
                      return (
                        <div key={row.label} className="flex items-center justify-between gap-4 py-3">
                          <dt className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-sand/60">
                            <Icon className="size-3.5 text-gold/70" aria-hidden="true" />
                            {row.label}
                          </dt>
                          <dd className="text-sm text-cream/90">{row.value}</dd>
                        </div>
                      );
                    })}
                  </dl>

                  <p className="mt-5 text-[11px] text-sand/60">
                    We&rsquo;ll confirm by email at {submitted.email} within the hour.
                  </p>

                  {submitted.code && (
                    <p className="mt-3 text-[10px] uppercase tracking-[0.24em] text-gold/80">
                      Reference{" "}
                      <span className="ml-1 font-mono text-xs normal-case tracking-normal text-cream/90">
                        {submitted.code}
                      </span>
                    </p>
                  )}

                  <button type="button" onClick={reset} className="btn-ghost mt-7">
                    Make another reservation
                  </button>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  ref={formRef}
                  onSubmit={handleSubmit}
                  noValidate
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  className="space-y-5"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[9px] uppercase tracking-[0.3em] text-sand/60">Book a table</p>
                    <p className="text-[9px] uppercase tracking-[0.3em] text-sand/40">5 min</p>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="res-name" className="field-label">
                        Full name
                      </label>
                      <input
                        id="res-name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        placeholder="Alex Morgan"
                        value={values.name}
                        onChange={update("name")}
                        aria-invalid={Boolean(errors.name)}
                        aria-describedby={errors.name ? "res-name-error" : undefined}
                        className={`field ${errors.name ? "border-destructive/70" : ""}`}
                      />
                      {errors.name && (
                        <p id="res-name-error" className="mt-1.5 text-[11px] text-destructive">
                          {errors.name}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="res-email" className="field-label">
                        Email
                      </label>
                      <input
                        id="res-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        placeholder="alex@example.com"
                        value={values.email}
                        onChange={update("email")}
                        aria-invalid={Boolean(errors.email)}
                        aria-describedby={errors.email ? "res-email-error" : undefined}
                        className={`field ${errors.email ? "border-destructive/70" : ""}`}
                      />
                      {errors.email && (
                        <p id="res-email-error" className="mt-1.5 text-[11px] text-destructive">
                          {errors.email}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="res-phone" className="field-label">
                        Phone <span className="normal-case tracking-normal text-sand/40">(optional)</span>
                      </label>
                      <input
                        id="res-phone"
                        name="phone"
                        type="tel"
                        autoComplete="tel"
                        placeholder="(212) 555-0184"
                        value={values.phone}
                        onChange={update("phone")}
                        aria-invalid={Boolean(errors.phone)}
                        aria-describedby={errors.phone ? "res-phone-error" : undefined}
                        className={`field ${errors.phone ? "border-destructive/70" : ""}`}
                      />
                      {errors.phone && (
                        <p id="res-phone-error" className="mt-1.5 text-[11px] text-destructive">
                          {errors.phone}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="res-guests" className="field-label">
                        Party size
                      </label>
                      <select
                        id="res-guests"
                        name="guests"
                        value={values.guests}
                        onChange={update("guests")}
                        className="field appearance-none bg-[length:14px] bg-[right_1rem_center] bg-no-repeat pr-10"
                        style={{
                          backgroundImage:
                            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23A9A399' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
                        }}
                      >
                        {partySizes.map((size) => (
                          <option key={size} value={size} className="bg-ink">
                            {size}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="res-date" className="field-label">
                        Date
                      </label>
                      <input
                        id="res-date"
                        name="date"
                        type="date"
                        min={today}
                        value={values.date}
                        onChange={update("date")}
                        aria-invalid={Boolean(errors.date)}
                        aria-describedby={errors.date ? "res-date-error" : undefined}
                        className={`field [color-scheme:dark] ${errors.date ? "border-destructive/70" : ""}`}
                      />
                      {errors.date && (
                        <p id="res-date-error" className="mt-1.5 text-[11px] text-destructive">
                          {errors.date}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="res-time" className="field-label">
                        Seating
                      </label>
                      <select
                        id="res-time"
                        name="time"
                        value={values.time}
                        onChange={update("time")}
                        aria-invalid={Boolean(errors.time)}
                        aria-describedby={errors.time ? "res-time-error" : undefined}
                        className={`field appearance-none bg-[length:14px] bg-[right_1rem_center] bg-no-repeat pr-10 ${
                          errors.time ? "border-destructive/70" : ""
                        }`}
                        style={{
                          backgroundImage:
                            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23A9A399' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
                        }}
                      >
                        <option value="" className="bg-ink">
                          Choose a time
                        </option>
                        {times.map((time) => (
                          <option key={time} value={time} className="bg-ink">
                            {time}
                          </option>
                        ))}
                      </select>
                      {errors.time && (
                        <p id="res-time-error" className="mt-1.5 text-[11px] text-destructive">
                          {errors.time}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="res-occasion" className="field-label">
                        Occasion
                      </label>
                      <select
                        id="res-occasion"
                        name="occasion"
                        value={values.occasion}
                        onChange={update("occasion")}
                        className="field appearance-none bg-[length:14px] bg-[right_1rem_center] bg-no-repeat pr-10"
                        style={{
                          backgroundImage:
                            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23A9A399' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
                        }}
                      >
                        {occasions.map((occasion) => (
                          <option key={occasion} value={occasion} className="bg-ink">
                            {occasion}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="res-notes" className="field-label">
                        Notes <span className="normal-case tracking-normal text-sand/40">(optional)</span>
                      </label>
                      <input
                        id="res-notes"
                        name="notes"
                        type="text"
                        placeholder="Allergies, seating, quiet table"
                        value={values.notes}
                        onChange={update("notes")}
                        className="field"
                      />
                    </div>
                  </div>

                  {formError && (
                    <p
                      role="alert"
                      className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-[12px] leading-relaxed text-destructive"
                    >
                      {formError}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="btn-gold w-full disabled:pointer-events-none disabled:opacity-60"
                    disabled={submitting}
                    aria-busy={submitting}
                  >
                    {submitting ? "Requesting…" : "Request Reservation"}
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </button>

                  <p className="text-center text-[10px] leading-relaxed text-sand/55">
                    This is a request, not a confirmed booking. We reply within the hour during
                    service.
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default Reservation;
