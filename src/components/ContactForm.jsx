import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Check } from "lucide-react";
import { api } from "@/lib/api";

const subjects = [
  "General enquiry",
  "Private dining",
  "Large party",
  "Feedback",
  "Careers",
  "Accessibility",
];

const empty = { name: "", email: "", phone: "", subject: "General enquiry", message: "" };

function validate(values) {
  const errors = {};
  if (!values.name.trim()) errors.name = "Please tell us your name.";
  if (!values.email.trim()) errors.email = "We need an email to reply.";
  else if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(values.email.trim())) errors.email = "Check the email address.";
  if (values.message.trim().length < 10) errors.message = "Tell us a little more (10 characters minimum).";
  return errors;
}

export function ContactForm() {
  const [values, setValues] = useState(empty);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");
  const [notice, setNotice] = useState("");

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
    setNotice("");
    if (Object.keys(found).length > 0) return;

    setStatus("sending");
    try {
      await api.sendContactMessage({
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        subject: values.subject,
        message: values.message.trim(),
      });
      setStatus("sent");
      setValues(empty);
    } catch (error) {
      setStatus("idle");
      const fields = error.fieldErrors?.() ?? {};
      if (Object.keys(fields).length > 0) setErrors(fields);
      setNotice(error.message || "We could not send that message. Please try again.");
    }
  };

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        {status === "sent" ? (
          <motion.div
            key="sent"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="flex min-h-[16rem] flex-col items-center justify-center rounded-xl border border-line/70 bg-ink/50 p-6 text-center"
            role="status"
          >
            <span className="inline-flex size-11 items-center justify-center rounded-full border border-gold/40 bg-gold/10 text-gold-light">
              <Check className="size-5" aria-hidden="true" />
            </span>
            <p className="mt-4 font-serif text-2xl font-light text-cream">Message received</p>
            <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-sand">
              Thank you. Our team replies within one business day.
            </p>
            <button type="button" onClick={() => setStatus("idle")} className="btn-ghost mt-5">
              Send another
            </button>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            onSubmit={handleSubmit}
            noValidate
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="contact-name" className="field-label">
                  Name
                </label>
                <input
                  id="contact-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Alex Morgan"
                  value={values.name}
                  onChange={update("name")}
                  aria-invalid={Boolean(errors.name)}
                  className={`field ${errors.name ? "border-destructive/70" : ""}`}
                />
                {errors.name && <p className="mt-1.5 text-[11px] text-destructive">{errors.name}</p>}
              </div>
              <div>
                <label htmlFor="contact-email" className="field-label">
                  Email
                </label>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="alex@example.com"
                  value={values.email}
                  onChange={update("email")}
                  aria-invalid={Boolean(errors.email)}
                  className={`field ${errors.email ? "border-destructive/70" : ""}`}
                />
                {errors.email && <p className="mt-1.5 text-[11px] text-destructive">{errors.email}</p>}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="contact-phone" className="field-label">
                  Phone <span className="normal-case tracking-normal text-sand/40">(optional)</span>
                </label>
                <input
                  id="contact-phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="(212) 555-0184"
                  value={values.phone}
                  onChange={update("phone")}
                  className="field"
                />
              </div>
              <div>
                <label htmlFor="contact-subject" className="field-label">
                  Subject
                </label>
                <select
                  id="contact-subject"
                  name="subject"
                  value={values.subject}
                  onChange={update("subject")}
                  className="field appearance-none bg-[length:14px] bg-[right_1rem_center] bg-no-repeat pr-10"
                  style={{
                    backgroundImage:
                      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23A9A399' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
                  }}
                >
                  {subjects.map((subject) => (
                    <option key={subject} value={subject} className="bg-ink">
                      {subject}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="contact-message" className="field-label">
                Message
              </label>
              <textarea
                id="contact-message"
                name="message"
                rows={3}
                placeholder="Tell us about the evening you have in mind."
                value={values.message}
                onChange={update("message")}
                aria-invalid={Boolean(errors.message)}
                className={`field resize-none ${errors.message ? "border-destructive/70" : ""}`}
              />
              {errors.message && <p className="mt-1.5 text-[11px] text-destructive">{errors.message}</p>}
            </div>

            {notice && (
              <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-[12px] text-cream">
                {notice}
              </p>
            )}

            <button type="submit" disabled={status === "sending"} className="btn-gold w-full disabled:cursor-not-allowed disabled:opacity-60">
              {status === "sending" ? "Sending…" : "Send Message"}
              {status !== "sending" && <ArrowRight className="size-4" aria-hidden="true" />}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ContactForm;
