import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertCircle, ArrowRight, Check, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useShop } from "../../lib/shop";
import { money, dateTimeLabel } from "../../lib/format";

const emptyCheckout = {
  name: "",
  email: "",
  phone: "",
  notes: "",
  line1: "",
  city: "New York",
  state: "NY",
  zip: "",
  instructions: "",
};

function AuthForm() {
  const { signIn, signUp, closeCart } = useShop();
  const [mode, setMode] = useState("login");
  const [values, setValues] = useState({ name: "", email: "", password: "", phone: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const update = (field) => (event) => setValues((current) => ({ ...current, [field]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "login") {
        await signIn({ email: values.email.trim(), password: values.password });
      } else {
        await signUp({
          name: values.name.trim(),
          email: values.email.trim(),
          password: values.password,
          phone: values.phone.trim(),
        });
      }
    } catch (apiError) {
      const details = Array.isArray(apiError?.details) ? apiError.details : [];
      setError(details[0]?.message || apiError?.message || "We could not sign you in.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <div className="flex gap-1 rounded-full border border-line/70 p-1">
        {[
          ["login", "Sign in"],
          ["register", "Create account"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setMode(value);
              setError("");
            }}
            aria-pressed={mode === value}
            className={`flex-1 rounded-full px-4 py-2 text-[10px] uppercase tracking-[0.2em] transition-colors ${
              mode === value ? "bg-gold text-ink" : "text-cream/60 hover:text-cream"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "register" && (
        <div>
          <label htmlFor="auth-name" className="field-label">
            Full name
          </label>
          <input
            id="auth-name"
            className="field"
            autoComplete="name"
            value={values.name}
            onChange={update("name")}
            required
          />
        </div>
      )}

      <div>
        <label htmlFor="auth-email" className="field-label">
          Email
        </label>
        <input
          id="auth-email"
          type="email"
          className="field"
          autoComplete="email"
          value={values.email}
          onChange={update("email")}
          required
        />
      </div>

      <div>
        <label htmlFor="auth-password" className="field-label">
          Password
        </label>
        <input
          id="auth-password"
          type="password"
          className="field"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          value={values.password}
          onChange={update("password")}
          required
        />
        {mode === "register" && (
          <p className="mt-2 text-[11px] leading-relaxed text-sand/55">
            At least 8 characters with an uppercase letter, a lowercase letter and a number.
          </p>
        )}
      </div>

      {mode === "register" && (
        <div>
          <label htmlFor="auth-phone" className="field-label">
            Phone <span className="normal-case tracking-normal text-sand/40">(optional)</span>
          </label>
          <input
            id="auth-phone"
            type="tel"
            className="field"
            autoComplete="tel"
            value={values.phone}
            onChange={update("phone")}
          />
        </div>
      )}

      {error && (
        <p role="alert" className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-[12px] leading-relaxed text-cream/90">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
          {error}
        </p>
      )}

      <button type="submit" disabled={busy} className="btn-gold w-full disabled:opacity-60">
        {busy ? "Please wait…" : mode === "login" ? "Sign in to order" : "Create account"}
        <ArrowRight className="size-4" aria-hidden="true" />
      </button>

      <p className="text-center text-[11px] leading-relaxed text-sand/55">
        An account keeps your cart, order history and reservations in one place.{" "}
        <button type="button" onClick={closeCart} className="text-gold-light underline decoration-gold/40 underline-offset-4">
          Keep browsing
        </button>
      </p>
    </form>
  );
}

function CartLines() {
  const { cart, setQuantity, removeItem, closeCart } = useShop();
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  const change = async (id, quantity) => {
    setBusyId(id);
    setError("");
    try {
      await setQuantity(id, quantity);
    } catch (apiError) {
      setError(apiError?.message || "Could not update the cart.");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id) => {
    setBusyId(id);
    setError("");
    try {
      await removeItem(id);
    } catch (apiError) {
      setError(apiError?.message || "Could not remove that dish.");
    } finally {
      setBusyId(null);
    }
  };

  if (!cart) {
    return <p className="py-10 text-center text-sm text-sand/60">Loading your order…</p>;
  }

  if (cart.items.length === 0) {
    return (
      <div className="flex flex-col items-center py-14 text-center">
        <span className="inline-flex size-14 items-center justify-center rounded-full border border-line text-gold/70">
          <ShoppingBag className="size-6" aria-hidden="true" />
        </span>
        <p className="mt-5 font-serif text-2xl text-cream">Your order is empty</p>
        <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-sand/70">
          Add a dish from tonight&rsquo;s menu and we&rsquo;ll have it ready for collection.
        </p>
        <button
          type="button"
          onClick={() => {
            closeCart();
            document.getElementById("menu")?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
          className="btn-ghost mt-6"
        >
          Browse the menu
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-[12px] text-cream/90">
          {error}
        </p>
      )}

      <ul className="divide-y divide-line/50 border-y border-line/50">
        {cart.items.map((line) => {
          const id = line.menuItem?.id;
          const disabled = !line.isAvailable || busyId === id;
          return (
            <li key={id} className="flex gap-3 py-4">
              {line.menuItem?.imageUrl && (
                <img
                  src={line.menuItem.imageUrl}
                  alt=""
                  className="size-16 shrink-0 rounded-lg object-cover"
                  loading="lazy"
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <p className="truncate font-serif text-[15px] text-cream">{line.menuItem?.name}</p>
                  <span className="shrink-0 text-[13px] tabular-nums text-gold-light">
                    {money(line.lineTotalCents)}
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-sand/55">{money(line.unitPriceCents)} each</p>

                {!line.isAvailable && (
                  <p className="mt-1 text-[11px] text-destructive">{line.reason}</p>
                )}

                <div className="mt-2 flex items-center gap-2">
                  <div className="inline-flex items-center rounded-full border border-line/70">
                    <button
                      type="button"
                      aria-label={`One less ${line.menuItem?.name}`}
                      disabled={disabled}
                      onClick={() => change(id, line.quantity - 1)}
                      className="inline-flex size-8 items-center justify-center rounded-full text-cream/70 transition-colors hover:text-gold-light disabled:opacity-40"
                    >
                      <Minus className="size-3" aria-hidden="true" />
                    </button>
                    <span className="w-6 text-center text-[12px] tabular-nums text-cream">{line.quantity}</span>
                    <button
                      type="button"
                      aria-label={`One more ${line.menuItem?.name}`}
                      disabled={disabled}
                      onClick={() => change(id, line.quantity + 1)}
                      className="inline-flex size-8 items-center justify-center rounded-full text-cream/70 transition-colors hover:text-gold-light disabled:opacity-40"
                    >
                      <Plus className="size-3" aria-hidden="true" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(id)}
                    disabled={disabled}
                    className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] text-sand/50 transition-colors hover:text-destructive disabled:opacity-40"
                  >
                    <Trash2 className="size-3" aria-hidden="true" />
                    Remove
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function CheckoutForm({ onPlaced }) {
  const { cart, cartType, setCartType, user, placeOrder } = useShop();
  // Seeded once from the signed-in account; the guest can still edit it.
  const [values, setValues] = useState(() => ({
    ...emptyCheckout,
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  }));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  const update = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const totals = cart?.totals ?? { subtotalCents: 0, taxCents: 0, deliveryFeeCents: 0, totalCents: 0 };

  const validate = () => {
    const found = {};
    if (values.name.trim().length < 2) found.name = "Tell us who the order is for.";
    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(values.email.trim())) found.email = "Enter a valid email.";
    if (values.phone.trim() && !/^[+()\d\s-]{7,18}$/.test(values.phone.trim())) found.phone = "Use digits or + ( ) - only.";
    if (cartType === "delivery") {
      if (values.line1.trim().length < 4) found.line1 = "Street address is required.";
      if (values.city.trim().length < 2) found.city = "City is required.";
      if (values.state.trim().length < 2) found.state = "State is required.";
      if (!/^\d{5}(-\d{4})?$/.test(values.zip.trim())) found.zip = "Enter a 5-digit ZIP.";
      if (!values.phone.trim()) found.phone = "A phone number is required for delivery.";
    }
    return found;
  };

  const submit = async (event) => {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    setFormError("");
    if (Object.keys(found).length > 0) return;

    setBusy(true);
    try {
      const order = await placeOrder({
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        notes: values.notes.trim(),
        ...(cartType === "delivery"
          ? {
              deliveryAddress: {
                line1: values.line1.trim(),
                city: values.city.trim(),
                state: values.state.trim(),
                zip: values.zip.trim(),
                instructions: values.instructions.trim(),
              },
            }
          : {}),
      });
      onPlaced(order);
    } catch (apiError) {
      const details = Array.isArray(apiError?.details) ? apiError.details : [];
      const mapped = details.reduce((accumulator, detail) => {
        const key = String(detail?.field || "").split(".").pop();
        if (key && !accumulator[key]) accumulator[key] = detail.message;
        return accumulator;
      }, {});
      if (Object.keys(mapped).length > 0) setErrors(mapped);
      else setFormError(apiError?.message || "We could not place that order. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const fieldError = (key) =>
    errors[key] ? <p className="mt-1.5 text-[11px] text-destructive">{errors[key]}</p> : null;

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <div className="grid grid-cols-2 gap-1 rounded-full border border-line/70 p-1">
        {[
          ["pickup", "Pickup"],
          ["delivery", "Delivery"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setCartType(value)}
            aria-pressed={cartType === value}
            className={`rounded-full px-4 py-2 text-[10px] uppercase tracking-[0.2em] transition-colors ${
              cartType === value ? "bg-gold text-ink" : "text-cream/60 hover:text-cream"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="co-name" className="field-label">Name</label>
          <input id="co-name" className="field" value={values.name} onChange={update("name")} autoComplete="name" />
          {fieldError("name")}
        </div>
        <div>
          <label htmlFor="co-phone" className="field-label">Phone</label>
          <input id="co-phone" className="field" type="tel" value={values.phone} onChange={update("phone")} autoComplete="tel" />
          {fieldError("phone")}
        </div>
      </div>

      <div>
        <label htmlFor="co-email" className="field-label">Email</label>
        <input id="co-email" className="field" type="email" value={values.email} onChange={update("email")} autoComplete="email" />
        {fieldError("email")}
      </div>

      {cartType === "delivery" && (
        <div className="space-y-3 rounded-xl border border-line/60 p-3">
          <div>
            <label htmlFor="co-line1" className="field-label">Street address</label>
            <input id="co-line1" className="field" value={values.line1} onChange={update("line1")} autoComplete="address-line1" />
            {fieldError("line1")}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="co-city" className="field-label">City</label>
              <input id="co-city" className="field" value={values.city} onChange={update("city")} autoComplete="address-level2" />
              {fieldError("city")}
            </div>
            <div>
              <label htmlFor="co-state" className="field-label">State</label>
              <input id="co-state" className="field" value={values.state} onChange={update("state")} autoComplete="address-level1" />
              {fieldError("state")}
            </div>
            <div>
              <label htmlFor="co-zip" className="field-label">ZIP</label>
              <input id="co-zip" className="field" value={values.zip} onChange={update("zip")} autoComplete="postal-code" inputMode="numeric" />
              {fieldError("zip")}
            </div>
          </div>
          <div>
            <label htmlFor="co-instructions" className="field-label">Delivery notes</label>
            <input id="co-instructions" className="field" value={values.instructions} onChange={update("instructions")} placeholder="Buzzer, floor, gate code" />
          </div>
        </div>
      )}

      <div>
        <label htmlFor="co-notes" className="field-label">Kitchen notes</label>
        <textarea id="co-notes" rows={2} className="field resize-none" value={values.notes} onChange={update("notes")} placeholder="Allergies, cut preferences" />
      </div>

      <dl className="space-y-1.5 border-t border-line/60 pt-4 text-[12px]">
        <div className="flex justify-between text-sand/70">
          <dt>Subtotal</dt>
          <dd className="tabular-nums">{money(totals.subtotalCents)}</dd>
        </div>
        <div className="flex justify-between text-sand/70">
          <dt>Tax</dt>
          <dd className="tabular-nums">{money(totals.taxCents)}</dd>
        </div>
        {totals.deliveryFeeCents > 0 && (
          <div className="flex justify-between text-sand/70">
            <dt>Delivery</dt>
            <dd className="tabular-nums">{money(totals.deliveryFeeCents)}</dd>
          </div>
        )}
        <div className="flex items-baseline justify-between pt-2 text-cream">
          <dt className="text-[10px] uppercase tracking-[0.24em] text-sand/70">Total</dt>
          <dd className="font-serif text-2xl tabular-nums text-gold-light">{money(totals.totalCents)}</dd>
        </div>
      </dl>

      {formError && (
        <p role="alert" className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-[12px] leading-relaxed text-cream/90">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
          {formError}
        </p>
      )}

      <button type="submit" disabled={busy || (cart?.items.length ?? 0) === 0} className="btn-gold w-full disabled:opacity-60">
        {busy ? "Placing order…" : `Place ${cartType} order`}
        <ArrowRight className="size-4" aria-hidden="true" />
      </button>

      <p className="text-center text-[11px] leading-relaxed text-sand/50">
        Card payment is not enabled yet. You pay at the restaurant on collection, or on delivery.
      </p>
    </form>
  );
}

export function CartDrawer() {
  const { cartOpen, closeCart, checking, user, cart } = useShop();
  const [placed, setPlaced] = useState(null);

  const close = () => {
    setPlaced(null);
    closeCart();
  };

  useEffect(() => {
    if (!cartOpen) return;
    const onKey = (event) => {
      if (event.key === "Escape") closeCart();
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [cartOpen, closeCart]);

  const lineCount = useMemo(() => cart?.items?.length ?? 0, [cart]);

  return (
    <AnimatePresence>
      {cartOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[95]"
          role="dialog"
          aria-modal="true"
          aria-label="Your order"
        >
          <div className="absolute inset-0 bg-ink/80 backdrop-blur-sm" onClick={close} />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="absolute right-0 top-0 flex h-full w-full max-w-[30rem] flex-col overflow-y-auto border-l border-line bg-ink px-5 pb-10 pt-5 sm:px-7"
          >
            <div className="flex items-center justify-between border-b border-line/60 pb-4">
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="size-4 text-gold" aria-hidden="true" />
                <h2 className="font-serif text-lg tracking-wide text-cream">
                  {placed ? "Order placed" : "Your order"}
                </h2>
                {!placed && lineCount > 0 && (
                  <span className="rounded-full border border-gold/30 px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] text-gold-light">
                    {lineCount} {lineCount === 1 ? "dish" : "dishes"}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Close your order"
                className="inline-flex size-10 items-center justify-center rounded-full border border-line text-cream/75 transition-colors hover:border-gold/60 hover:text-gold-light"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-5 flex-1">
              {placed ? (
                <div className="flex h-full flex-col items-center justify-center text-center" role="status">
                  <span className="inline-flex size-14 items-center justify-center rounded-full border border-gold/40 bg-gold/10 text-gold-light">
                    <Check className="size-6" aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 font-serif text-3xl font-light text-cream">Thank you</h3>
                  <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-sand/80">
                    Your order is with the kitchen. We will email you as soon as it is confirmed.
                  </p>
                  <p className="mt-5 font-mono text-sm tracking-[0.18em] text-gold-light">{placed.orderNumber}</p>
                  <dl className="mt-5 w-full divide-y divide-line/60 border-y border-line/60 text-left text-[12px]">
                    <div className="flex justify-between py-2.5">
                      <dt className="uppercase tracking-[0.18em] text-sand/55">Type</dt>
                      <dd className="capitalize text-cream/90">{placed.type}</dd>
                    </div>
                    <div className="flex justify-between py-2.5">
                      <dt className="uppercase tracking-[0.18em] text-sand/55">Ready</dt>
                      <dd className="text-cream/90">{dateTimeLabel(placed.estimatedReadyAt)}</dd>
                    </div>
                    <div className="flex justify-between py-2.5">
                      <dt className="uppercase tracking-[0.18em] text-sand/55">Total</dt>
                      <dd className="tabular-nums text-cream/90">{money(placed.totalCents)}</dd>
                    </div>
                    <div className="flex justify-between py-2.5">
                      <dt className="uppercase tracking-[0.18em] text-sand/55">Payment</dt>
                      <dd className="text-cream/90">Pay on {placed.type === "delivery" ? "delivery" : "collection"}</dd>
                    </div>
                  </dl>
                  <p className="mt-4 text-[11px] leading-relaxed text-sand/50">
                    A confirmation email is sent once our mail service is configured. Your order is visible in
                    your account now.
                  </p>
                  <button type="button" onClick={close} className="btn-ghost mt-6">
                    Back to the site
                  </button>
                </div>
              ) : checking ? (
                <p className="py-10 text-center text-sm text-sand/60">Checking your session…</p>
              ) : !user ? (
                <div className="space-y-5">
                  <p className="text-[13px] leading-relaxed text-sand/75">
                    Sign in to start an order. Your cart is saved to your account and can be finished on any device.
                  </p>
                  <AuthForm />
                </div>
              ) : (
                <div className="space-y-7">
                  <CartLines />
                  {(cart?.items.length ?? 0) > 0 && <CheckoutForm onPlaced={setPlaced} />}
                </div>
              )}
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default CartDrawer;
