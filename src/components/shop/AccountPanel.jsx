import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { LogOut, X } from "lucide-react";
import { api } from "../../lib/api";
import { useShop } from "../../lib/shop";
import { dayLabel, dateTimeLabel, money, slotLabel, statusLabel } from "../../lib/format";

const CANCELLABLE_ORDERS = ["pending", "confirmed"];

export function AccountPanel() {
  const { accountOpen, closeAccount, user, signOut } = useShop();
  const [tab, setTab] = useState("orders");
  const [orders, setOrders] = useState(null);
  const [reservations, setReservations] = useState(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try {
      const [orderPayload, reservationPayload] = await Promise.all([
        api.myOrders(),
        api.myReservations(),
      ]);
      setOrders(orderPayload?.data ?? []);
      setReservations(reservationPayload?.data ?? []);
      setError("");
    } catch (apiError) {
      setError(apiError?.message || "Could not load your account.");
    }
  }, []);

  useEffect(() => {
    if (!accountOpen || !user) return;
    // Fetch when the panel opens; the loader commits state after its awaits.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [accountOpen, user, load]);

  useEffect(() => {
    if (!accountOpen) return;
    const onKey = (event) => {
      if (event.key === "Escape") closeAccount();
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [accountOpen, closeAccount]);

  const cancelOrder = async (id) => {
    setBusyId(id);
    setError("");
    try {
      await api.cancelOrder(id);
      await load();
    } catch (apiError) {
      setError(apiError?.message || "That order could not be cancelled.");
    } finally {
      setBusyId(null);
    }
  };

  const cancelReservation = async (id) => {
    setBusyId(id);
    setError("");
    try {
      await api.cancelReservation(id);
      await load();
    } catch (apiError) {
      setError(apiError?.message || "That reservation could not be cancelled.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AnimatePresence>
      {accountOpen && user && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[95]"
          role="dialog"
          aria-modal="true"
          aria-label="Your account"
        >
          <div className="absolute inset-0 bg-ink/80 backdrop-blur-sm" onClick={closeAccount} />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="absolute right-0 top-0 flex h-full w-full max-w-[34rem] flex-col overflow-y-auto border-l border-line bg-ink px-5 pb-10 pt-5 sm:px-7"
          >
            <div className="flex items-start justify-between border-b border-line/60 pb-4">
              <div>
                <p className="text-[9px] uppercase tracking-[0.3em] text-gold/80">Your account</p>
                <h2 className="mt-2 font-serif text-2xl font-light text-cream">{user.name}</h2>
                <p className="mt-1 text-[12px] text-sand/60">{user.email}</p>
              </div>
              <button
                type="button"
                onClick={closeAccount}
                aria-label="Close account panel"
                className="inline-flex size-10 items-center justify-center rounded-full border border-line text-cream/75 transition-colors hover:border-gold/60 hover:text-gold-light"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="flex gap-1 rounded-full border border-line/70 p-1">
                {[
                  ["orders", "Orders"],
                  ["reservations", "Reservations"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setTab(value)}
                    aria-pressed={tab === value}
                    className={`rounded-full px-4 py-2 text-[10px] uppercase tracking-[0.2em] transition-colors ${
                      tab === value ? "bg-gold text-ink" : "text-cream/60 hover:text-cream"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={signOut}
                className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-sand/60 transition-colors hover:text-cream"
              >
                <LogOut className="size-3.5" aria-hidden="true" />
                Sign out
              </button>
            </div>

            {error && (
              <p role="alert" className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-[12px] text-cream/90">
                {error}
              </p>
            )}

            <div className="mt-5">
              {tab === "orders" && (
                <>
                  {!orders && <p className="py-8 text-center text-sm text-sand/60">Loading orders…</p>}
                  {orders?.length === 0 && (
                    <p className="py-8 text-center text-[13px] text-sand/60">
                      No orders yet. Add a dish from the menu to get started.
                    </p>
                  )}
                  <ul className="space-y-3">
                    {orders?.map((order) => (
                      <li key={order.id} className="rounded-xl border border-line/70 bg-coal/40 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-mono text-[12px] tracking-wide text-gold-light">{order.orderNumber}</p>
                          <span className="rounded-full border border-line/70 px-2.5 py-0.5 text-[9px] uppercase tracking-[0.18em] text-cream/70">
                            {statusLabel(order.status)}
                          </span>
                        </div>
                        <p className="mt-2 text-[12px] leading-relaxed text-sand/75">
                          {order.items.map((item) => `${item.quantity}× ${item.name}`).join(", ")}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-sand/55">
                          <span>
                            {dateTimeLabel(order.createdAt)} · {order.type}
                          </span>
                          <span className="text-[13px] tabular-nums text-cream/90">{money(order.totalCents)}</span>
                        </div>
                        {CANCELLABLE_ORDERS.includes(order.status) && (
                          <button
                            type="button"
                            disabled={busyId === order.id}
                            onClick={() => cancelOrder(order.id)}
                            className="mt-3 text-[10px] uppercase tracking-[0.2em] text-destructive/80 transition-colors hover:text-destructive disabled:opacity-50"
                          >
                            {busyId === order.id ? "Cancelling…" : "Cancel order"}
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {tab === "reservations" && (
                <>
                  {!reservations && <p className="py-8 text-center text-sm text-sand/60">Loading reservations…</p>}
                  {reservations?.length === 0 && (
                    <p className="py-8 text-center text-[13px] text-sand/60">
                      No reservations yet. Book a table from the reservation section.
                    </p>
                  )}
                  <ul className="space-y-3">
                    {reservations?.map((reservation) => (
                      <li key={reservation.id ?? reservation.reservationCode} className="rounded-xl border border-line/70 bg-coal/40 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-mono text-[12px] tracking-wide text-gold-light">
                            {reservation.reservationCode}
                          </p>
                          <span className="rounded-full border border-line/70 px-2.5 py-0.5 text-[9px] uppercase tracking-[0.18em] text-cream/70">
                            {statusLabel(reservation.status)}
                          </span>
                        </div>
                        <p className="mt-2 text-[13px] text-cream/90">
                          {dayLabel(reservation.date)} · {slotLabel(reservation.time)}
                        </p>
                        <p className="mt-1 text-[11px] text-sand/60">{reservation.partySize} guests</p>
                        {["pending", "confirmed"].includes(reservation.status) && reservation.id && (
                          <button
                            type="button"
                            disabled={busyId === reservation.id}
                            onClick={() => cancelReservation(reservation.id)}
                            className="mt-3 text-[10px] uppercase tracking-[0.2em] text-destructive/80 transition-colors hover:text-destructive disabled:opacity-50"
                          >
                            {busyId === reservation.id ? "Cancelling…" : "Cancel reservation"}
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default AccountPanel;
