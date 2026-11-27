import { useCallback, useEffect, useState } from "react";
import { AlertCircle, ArrowLeft, LogOut, Plus, RefreshCw, Trash2 } from "lucide-react";
import { api } from "../lib/api";
import { ResponsiveImage } from "../components/ui/ResponsiveImage";
import {
  ORDER_STATUS_FLOW,
  RESERVATION_STATUS_FLOW,
  dateTimeLabel,
  dayLabel,
  money,
  slotLabel,
  statusLabel,
} from "../lib/format";

const TABS = ["Overview", "Reservations", "Orders", "Menu", "Messages", "Customers"];
const CATEGORIES = ["Prime Cuts", "Signatures", "Starters", "Desserts", "Sides", "Drinks"];

function useResource(loader) {
  const [state, setState] = useState({ loading: true, data: null, error: "" });

  const load = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: "" }));
    try {
      const data = await loader();
      setState({ loading: false, data, error: "" });
    } catch (error) {
      setState({ loading: false, data: null, error: error?.message || "Request failed." });
    }
  }, [loader]);

  useEffect(() => {
    // Fetch-on-mount: state is committed by the awaited loader, not during render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  return { ...state, reload: load };
}

function Notice({ error, onRetry }) {
  if (!error) return null;
  return (
    <div role="alert" className="mb-5 flex items-start justify-between gap-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-[13px] text-cream/90">
      <span className="flex items-start gap-2">
        <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
        {error}
      </span>
      {onRetry && (
        <button type="button" onClick={onRetry} className="shrink-0 text-[10px] uppercase tracking-[0.18em] text-gold-light">
          Retry
        </button>
      )}
    </div>
  );
}

function StatCard({ label, value, note }) {
  return (
    <div className="rounded-xl border border-line/70 bg-coal/40 p-4">
      <p className="text-[9px] uppercase tracking-[0.26em] text-sand/60">{label}</p>
      <p className="mt-2 font-serif text-3xl font-light text-cream">{value}</p>
      {note && <p className="mt-1 text-[11px] text-sand/55">{note}</p>}
    </div>
  );
}

function StatusPill({ status }) {
  const tone =
    status === "cancelled" || status === "no_show"
      ? "border-destructive/40 text-destructive"
      : status === "delivered" || status === "completed" || status === "confirmed" || status === "seated"
        ? "border-gold/40 text-gold-light"
        : "border-line/70 text-cream/70";
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[9px] uppercase tracking-[0.16em] ${tone}`}>
      {statusLabel(status)}
    </span>
  );
}

function AdminLogin({ onSignedIn }) {
  const [values, setValues] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const payload = await api.login({ email: values.email.trim(), password: values.password });
      const signedIn = payload?.data?.user ?? null;
      if (signedIn?.role !== "admin") {
        await api.logout().catch(() => {});
        throw new Error("That account does not have administrator access.");
      }
      onSignedIn(signedIn);
    } catch (apiError) {
      setError(apiError?.message || "Could not sign in.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-5 py-16">
      <div className="w-full max-w-sm">
        <a href="/" className="mb-8 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-sand/60 transition-colors hover:text-cream">
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Back to the site
        </a>
        <p className="text-[9px] uppercase tracking-[0.34em] text-gold/80">SAVORA</p>
        <h1 className="mt-3 font-serif text-3xl font-light text-cream">House dashboard</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-sand/65">
          Sign in with an administrator account to manage service.
        </p>

        <form onSubmit={submit} className="mt-7 space-y-4" noValidate>
          <div>
            <label htmlFor="admin-email" className="field-label">Email</label>
            <input
              id="admin-email"
              type="email"
              className="field"
              autoComplete="username"
              value={values.email}
              onChange={(event) => setValues((current) => ({ ...current, email: event.target.value }))}
              required
            />
          </div>
          <div>
            <label htmlFor="admin-password" className="field-label">Password</label>
            <input
              id="admin-password"
              type="password"
              className="field"
              autoComplete="current-password"
              value={values.password}
              onChange={(event) => setValues((current) => ({ ...current, password: event.target.value }))}
              required
            />
          </div>

          {error && (
            <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-[12px] text-cream/90">
              {error}
            </p>
          )}

          <button type="submit" disabled={busy} className="btn-gold w-full disabled:opacity-60">
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Overview() {
  const loader = useCallback(() => api.admin.stats(), []);
  const { loading, data, error, reload } = useResource(loader);

  if (loading && !data) return <p className="py-10 text-sm text-sand/60">Loading today&rsquo;s numbers…</p>;

  const stats = data?.data;

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-serif text-2xl font-light text-cream">Service overview</h2>
        <button type="button" onClick={reload} className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-sand/60 hover:text-cream">
          <RefreshCw className="size-3.5" aria-hidden="true" /> Refresh
        </button>
      </div>
      <Notice error={error} onRetry={reload} />

      {stats && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Orders" value={stats.orders.total} note={`${stats.orders.pending} open`} />
            <StatCard label="Paid revenue" value={money(stats.revenue.totalCents)} note={`${stats.revenue.paidOrders} paid orders`} />
            <StatCard label="Reservations" value={stats.reservations.today} note={`${stats.reservations.pending} awaiting confirmation`} />
            <StatCard label="Customers" value={stats.customers.total} note={`${stats.menu.unavailable} dishes unavailable`} />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <section className="rounded-xl border border-line/70 bg-coal/30 p-5">
              <h3 className="text-[10px] uppercase tracking-[0.24em] text-sand/60">Latest activity</h3>
              <ul className="mt-4 space-y-3">
                {(stats.activities ?? []).map((activity, index) => (
                  <li key={`${activity.type}-${activity.id}-${index}`} className="border-b border-line/40 pb-2.5 last:border-0">
                    <p className="text-[13px] text-cream/85">{activity.title}</p>
                    <p className="text-[11px] text-sand/55">{activity.detail}</p>
                  </li>
                ))}
                {(stats.activities ?? []).length === 0 && (
                  <li className="text-[12px] text-sand/55">No orders, reservations or messages yet.</li>
                )}
              </ul>
            </section>

            <section className="rounded-xl border border-line/70 bg-coal/30 p-5">
              <h3 className="text-[10px] uppercase tracking-[0.24em] text-sand/60">Top dishes</h3>
              <ul className="mt-4 space-y-3">
                {(stats.topDishes ?? []).map((dish) => (
                  <li key={dish.name} className="flex items-center justify-between gap-4 border-b border-line/40 pb-2.5 last:border-0">
                    <span className="text-[13px] text-cream/85">{dish.name}</span>
                    <span className="text-[11px] tabular-nums text-sand/60">
                      {dish.quantity} sold · {money(dish.revenueCents)}
                    </span>
                  </li>
                ))}
                {(stats.topDishes ?? []).length === 0 && (
                  <li className="text-[12px] text-sand/55">No sales recorded yet.</li>
                )}
              </ul>
            </section>
          </div>
        </>
      )}
    </div>
  );
}

function ReservationsPanel() {
  const loader = useCallback(() => api.admin.reservations(), []);
  const { loading, data, error, reload } = useResource(loader);
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState("");

  const rows = data?.data ?? [];

  const change = async (id, status) => {
    setBusyId(id);
    setActionError("");
    try {
      await api.admin.setReservationStatus(id, status);
      await reload();
    } catch (apiError) {
      setActionError(apiError?.message || "Could not update that reservation.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-serif text-2xl font-light text-cream">Reservations</h2>
        <button type="button" onClick={reload} className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-sand/60 hover:text-cream">
          <RefreshCw className="size-3.5" aria-hidden="true" /> Refresh
        </button>
      </div>
      <Notice error={error || actionError} onRetry={reload} />

      {loading && !data && <p className="py-10 text-sm text-sand/60">Loading reservations…</p>}

      {data && rows.length === 0 && <p className="py-10 text-sm text-sand/55">No reservations booked yet.</p>}

      <div className="space-y-3">
        {rows.map((reservation) => (
          <article key={reservation.id} className="rounded-xl border border-line/70 bg-coal/30 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-mono text-[11px] tracking-wide text-gold-light">{reservation.reservationCode}</p>
                <p className="mt-1 text-[14px] text-cream/90">
                  {reservation.guest?.name} · {reservation.partySize} guests
                </p>
                <p className="text-[12px] text-sand/60">
                  {dayLabel(reservation.date)} · {slotLabel(reservation.time)} · {reservation.guest?.email}
                </p>
                {(reservation.occasion || reservation.notes) && (
                  <p className="mt-1 text-[11px] text-sand/50">
                    {[reservation.occasion, reservation.notes].filter(Boolean).join(" — ")}
                  </p>
                )}
              </div>
              <StatusPill status={reservation.status} />
            </div>

            {(RESERVATION_STATUS_FLOW[reservation.status] ?? []).length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {RESERVATION_STATUS_FLOW[reservation.status].map((next) => (
                  <button
                    key={next}
                    type="button"
                    disabled={busyId === reservation.id}
                    onClick={() => change(reservation.id, next)}
                    className={`rounded-full border px-3 py-1.5 text-[9px] uppercase tracking-[0.16em] transition-colors disabled:opacity-50 ${
                      next === "cancelled" || next === "no_show"
                        ? "border-destructive/40 text-destructive hover:bg-destructive/10"
                        : "border-gold/40 text-gold-light hover:bg-gold/10"
                    }`}
                  >
                    {next === "confirmed" ? "Confirm" : next === "seated" ? "Seat guests" : statusLabel(next)}
                  </button>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}

function OrdersPanel() {
  const loader = useCallback(() => api.admin.orders(), []);
  const { loading, data, error, reload } = useResource(loader);
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState("");

  const rows = data?.data ?? [];

  const change = async (id, status) => {
    setBusyId(id);
    setActionError("");
    try {
      await api.admin.setOrderStatus(id, status);
      await reload();
    } catch (apiError) {
      setActionError(apiError?.message || "Could not update that order.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-serif text-2xl font-light text-cream">Orders</h2>
        <button type="button" onClick={reload} className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-sand/60 hover:text-cream">
          <RefreshCw className="size-3.5" aria-hidden="true" /> Refresh
        </button>
      </div>
      <Notice error={error || actionError} onRetry={reload} />

      {loading && !data && <p className="py-10 text-sm text-sand/60">Loading orders…</p>}
      {data && rows.length === 0 && <p className="py-10 text-sm text-sand/55">No orders placed yet.</p>}

      <div className="space-y-3">
        {rows.map((order) => (
          <article key={order.id} className="rounded-xl border border-line/70 bg-coal/30 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[11px] tracking-wide text-gold-light">{order.orderNumber}</p>
                <p className="mt-1 text-[14px] text-cream/90">
                  {order.contact?.name} · {order.type}
                </p>
                <p className="text-[12px] text-sand/60">
                  {order.items.map((item) => `${item.quantity}× ${item.name}`).join(", ")}
                </p>
                <p className="mt-1 text-[11px] text-sand/50">
                  {dateTimeLabel(order.createdAt)} · {money(order.totalCents)} · payment {order.payment?.status}
                </p>
              </div>
              <StatusPill status={order.status} />
            </div>

            {(ORDER_STATUS_FLOW[order.status] ?? []).length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {ORDER_STATUS_FLOW[order.status].map((next) => (
                  <button
                    key={next}
                    type="button"
                    disabled={busyId === order.id}
                    onClick={() => change(order.id, next)}
                    className={`rounded-full border px-3 py-1.5 text-[9px] uppercase tracking-[0.16em] transition-colors disabled:opacity-50 ${
                      next === "cancelled"
                        ? "border-destructive/40 text-destructive hover:bg-destructive/10"
                        : "border-gold/40 text-gold-light hover:bg-gold/10"
                    }`}
                  >
                    {statusLabel(next)}
                  </button>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}

const emptyDish = {
  name: "",
  description: "",
  category: "Prime Cuts",
  price: "",
  imageUrl: "/images/dish-ribeye.jpg",
  tier: "3",
  isAvailable: true,
};

function MenuPanel() {
  const loader = useCallback(() => api.getMenuAll(), []);
  const { loading, data, error, reload } = useResource(loader);
  const [form, setForm] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState("");
  const [saving, setSaving] = useState(false);

  const rows = data?.data ?? [];

  const toggle = async (item) => {
    setBusyId(item.id);
    setActionError("");
    try {
      await api.setMenuAvailability(item.id, !item.isAvailable);
      await reload();
    } catch (apiError) {
      setActionError(apiError?.message || "Could not change availability.");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (item) => {
    if (!window.confirm(`Remove "${item.name}" from the menu?`)) return;
    setBusyId(item.id);
    setActionError("");
    try {
      await api.deleteMenuItem(item.id);
      await reload();
    } catch (apiError) {
      setActionError(apiError?.message || "Could not remove that dish.");
    } finally {
      setBusyId(null);
    }
  };

  const startEdit = (item) => {
    setForm({
      id: item.id,
      name: item.name,
      description: item.description,
      category: item.category,
      price: String(item.price ?? item.priceCents / 100),
      imageUrl: item.imageUrl,
      tier: String(item.tier ?? 3),
      isAvailable: Boolean(item.isAvailable),
    });
  };

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setActionError("");
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category,
        price: Number(form.price),
        imageUrl: form.imageUrl.trim(),
        tier: Number(form.tier),
        isAvailable: Boolean(form.isAvailable),
      };
      if (form.id) await api.updateMenuItem(form.id, payload);
      else await api.createMenuItem(payload);
      setForm(null);
      await reload();
    } catch (apiError) {
      const details = Array.isArray(apiError?.details) ? apiError.details : [];
      setActionError(details[0]?.message || apiError?.message || "Could not save that dish.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-2xl font-light text-cream">Menu</h2>
        <div className="flex items-center gap-4">
          <button type="button" onClick={reload} className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-sand/60 hover:text-cream">
            <RefreshCw className="size-3.5" aria-hidden="true" /> Refresh
          </button>
          <button type="button" onClick={() => setForm({ ...emptyDish })} className="btn-gold !px-5 !py-2.5 !text-[10px]">
            <Plus className="size-3.5" aria-hidden="true" /> New dish
          </button>
        </div>
      </div>

      <Notice error={error || actionError} onRetry={reload} />

      {form && (
        <form onSubmit={save} className="mb-6 space-y-3 rounded-xl border border-gold/30 bg-coal/40 p-4">
          <p className="text-[10px] uppercase tracking-[0.24em] text-gold/80">
            {form.id ? "Edit dish" : "New dish"}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="dish-name" className="field-label">Name</label>
              <input id="dish-name" className="field" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            </div>
            <div>
              <label htmlFor="dish-category" className="field-label">Category</label>
              <select id="dish-category" className="field" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
                {CATEGORIES.map((category) => (
                  <option key={category} value={category} className="bg-ink">{category}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="dish-description" className="field-label">Description</label>
            <textarea id="dish-description" rows={2} className="field resize-none" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor="dish-price" className="field-label">Price (USD)</label>
              <input id="dish-price" className="field" inputMode="decimal" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} required />
            </div>
            <div>
              <label htmlFor="dish-tier" className="field-label">Tier (1–5)</label>
              <input id="dish-tier" className="field" inputMode="numeric" value={form.tier} onChange={(event) => setForm({ ...form, tier: event.target.value })} />
            </div>
            <div>
              <label htmlFor="dish-image" className="field-label">Image URL</label>
              <input id="dish-image" className="field" value={form.imageUrl} onChange={(event) => setForm({ ...form, imageUrl: event.target.value })} required />
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <label className="inline-flex items-center gap-2 text-[11px] text-sand/70">
              <input type="checkbox" checked={form.isAvailable} onChange={(event) => setForm({ ...form, isAvailable: event.target.checked })} className="size-4 accent-gold" />
              Available for ordering
            </label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setForm(null)} className="btn-ghost !px-5 !py-2.5 !text-[10px]">Cancel</button>
              <button type="submit" disabled={saving} className="btn-gold !px-5 !py-2.5 !text-[10px] disabled:opacity-60">
                {saving ? "Saving…" : "Save dish"}
              </button>
            </div>
          </div>
        </form>
      )}

      {loading && !data && <p className="py-10 text-sm text-sand/60">Loading menu…</p>}

      <div className="space-y-2">
        {rows.map((item) => (
          <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line/60 bg-coal/25 px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              {item.imageUrl && (
                <ResponsiveImage
                  src={item.imageUrl}
                  alt=""
                  sizes="44px"
                  className="size-11 rounded-lg object-cover"
                  loading="lazy"
                />
              )}
              <div className="min-w-0">
                <p className="truncate text-[13px] text-cream/90">{item.name}</p>
                <p className="text-[11px] text-sand/55">
                  {item.category} · {money(item.priceCents)} · tier {item.tier}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={busyId === item.id}
                onClick={() => toggle(item)}
                className={`rounded-full border px-3 py-1.5 text-[9px] uppercase tracking-[0.16em] transition-colors disabled:opacity-50 ${
                  item.isAvailable ? "border-gold/40 text-gold-light" : "border-line/70 text-sand/60"
                }`}
              >
                {item.isAvailable ? "Available" : "Unavailable"}
              </button>
              <button type="button" onClick={() => startEdit(item)} className="rounded-full border border-line/70 px-3 py-1.5 text-[9px] uppercase tracking-[0.16em] text-cream/70 hover:border-gold/40 hover:text-gold-light">
                Edit
              </button>
              <button type="button" onClick={() => remove(item)} disabled={busyId === item.id} aria-label={`Delete ${item.name}`} className="inline-flex size-8 items-center justify-center rounded-full border border-line/70 text-sand/60 hover:border-destructive/50 hover:text-destructive">
                <Trash2 className="size-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MessagesPanel() {
  const loader = useCallback(() => api.admin.messages(), []);
  const { loading, data, error, reload } = useResource(loader);
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState("");

  const rows = data?.data ?? [];

  const setStatus = async (id, status) => {
    setBusyId(id);
    setActionError("");
    try {
      await api.admin.setMessageStatus(id, status);
      await reload();
    } catch (apiError) {
      setActionError(apiError?.message || "Could not update that message.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-serif text-2xl font-light text-cream">Messages</h2>
        <button type="button" onClick={reload} className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-sand/60 hover:text-cream">
          <RefreshCw className="size-3.5" aria-hidden="true" /> Refresh
        </button>
      </div>
      <Notice error={error || actionError} onRetry={reload} />

      {loading && !data && <p className="py-10 text-sm text-sand/60">Loading messages…</p>}
      {data && rows.length === 0 && <p className="py-10 text-sm text-sand/55">No contact messages yet.</p>}

      <div className="space-y-3">
        {rows.map((message) => (
          <article key={message.id} className="rounded-xl border border-line/70 bg-coal/30 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[13px] text-cream/90">
                {message.name} <span className="text-sand/50">· {message.email}</span>
              </p>
              <StatusPill status={message.status} />
            </div>
            <p className="mt-1 text-[12px] text-gold-light/90">{message.subject}</p>
            <p className="mt-2 whitespace-pre-line text-[12px] leading-relaxed text-sand/70">{message.message}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {["read", "replied", "archived"].map((status) => (
                <button
                  key={status}
                  type="button"
                  disabled={busyId === message.id || message.status === status}
                  onClick={() => setStatus(message.id, status)}
                  className="rounded-full border border-line/70 px-3 py-1.5 text-[9px] uppercase tracking-[0.16em] text-cream/70 transition-colors hover:border-gold/40 hover:text-gold-light disabled:opacity-40"
                >
                  Mark {status}
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function CustomersPanel() {
  const loader = useCallback(() => api.admin.customers(), []);
  const { loading, data, error, reload } = useResource(loader);
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState("");

  const rows = data?.data ?? [];

  const toggle = async (customer) => {
    setBusyId(customer.id);
    setActionError("");
    try {
      await api.admin.setCustomerActive(customer.id, !customer.isActive);
      await reload();
    } catch (apiError) {
      setActionError(apiError?.message || "Could not update that customer.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-serif text-2xl font-light text-cream">Customers</h2>
        <button type="button" onClick={reload} className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-sand/60 hover:text-cream">
          <RefreshCw className="size-3.5" aria-hidden="true" /> Refresh
        </button>
      </div>
      <Notice error={error || actionError} onRetry={reload} />

      {loading && !data && <p className="py-10 text-sm text-sand/60">Loading customers…</p>}
      {data && rows.length === 0 && <p className="py-10 text-sm text-sand/55">No customer accounts yet.</p>}

      <div className="space-y-2">
        {rows.map((customer) => (
          <div key={customer.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line/60 bg-coal/25 px-4 py-3">
            <div>
              <p className="text-[13px] text-cream/90">{customer.name}</p>
              <p className="text-[11px] text-sand/55">
                {customer.email} · {customer.stats?.orders ?? 0} orders · {money(customer.stats?.spentCents ?? 0)}
              </p>
            </div>
            <button
              type="button"
              disabled={busyId === customer.id}
              onClick={() => toggle(customer)}
              className={`rounded-full border px-3 py-1.5 text-[9px] uppercase tracking-[0.16em] transition-colors disabled:opacity-50 ${
                customer.isActive ? "border-gold/40 text-gold-light" : "border-destructive/40 text-destructive"
              }`}
            >
              {customer.isActive ? "Active" : "Deactivated"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminApp() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState("Overview");

  useEffect(() => {
    let alive = true;
    api
      .session()
      .then((payload) => {
        const found = payload?.data?.user ?? null;
        if (alive) setUser(found?.role === "admin" ? found : null);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setChecking(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (checking) {
    return <div className="flex min-h-screen items-center justify-center bg-ink text-sm text-sand/60">Connecting…</div>;
  }

  if (!user) return <AdminLogin onSignedIn={setUser} />;

  const signOut = async () => {
    await api.logout().catch(() => {});
    setUser(null);
  };

  return (
    <div className="min-h-screen bg-ink text-cream">
      <header className="sticky top-0 z-40 border-b border-line bg-ink/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-3 sm:px-7">
          <div className="flex items-center gap-3">
            <a href="/" className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-sand/55 hover:text-cream">
              <ArrowLeft className="size-3.5" aria-hidden="true" /> Site
            </a>
            <span className="font-serif text-sm tracking-[0.3em] text-cream">SAVORA</span>
            <span className="rounded-full border border-gold/30 px-2 py-0.5 text-[8px] uppercase tracking-[0.2em] text-gold-light">
              House
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-[11px] text-sand/55 sm:block">{user.email}</span>
            <button type="button" onClick={signOut} className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-sand/60 hover:text-cream">
              <LogOut className="size-3.5" aria-hidden="true" /> Sign out
            </button>
          </div>
        </div>
        <nav className="no-scrollbar mx-auto flex max-w-7xl gap-1 overflow-x-auto px-5 pb-2 sm:px-7" aria-label="Dashboard sections">
          {TABS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              aria-current={tab === item ? "page" : undefined}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-[10px] uppercase tracking-[0.16em] transition-colors ${
                tab === item ? "bg-gold/15 text-gold-light" : "text-cream/55 hover:text-cream"
              }`}
            >
              {item}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-7">
        {tab === "Overview" && <Overview />}
        {tab === "Reservations" && <ReservationsPanel />}
        {tab === "Orders" && <OrdersPanel />}
        {tab === "Menu" && <MenuPanel />}
        {tab === "Messages" && <MessagesPanel />}
        {tab === "Customers" && <CustomersPanel />}
      </main>
    </div>
  );
}
