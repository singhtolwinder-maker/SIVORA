const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

/** Integer cents -> "$58.00" */
export function money(cents = 0) {
  return usd.format((Number(cents) || 0) / 100);
}

/** "out_for_delivery" -> "Out for delivery" */
export function statusLabel(status = "") {
  const text = String(status).replaceAll("_", " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** ISO timestamp -> "Tue, Nov 25 · 7:30 PM" */
export function dateTimeLabel(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** "2026-11-28" -> "Sat, Nov 28" (avoid UTC drift with a midday anchor) */
export function dayLabel(value) {
  if (!value) return "—";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

/** "19:00" -> "7:00 PM" */
export function slotLabel(time = "") {
  const [hour, minute] = time.split(":").map(Number);
  if (Number.isNaN(hour)) return time;
  const meridiem = hour >= 12 ? "PM" : "AM";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:${String(minute || 0).padStart(2, "0")} ${meridiem}`;
}

export const ORDER_STATUS_FLOW = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["ready"],
  ready: ["out_for_delivery", "delivered"],
  out_for_delivery: ["delivered"],
  delivered: [],
  cancelled: [],
};

export const RESERVATION_STATUS_FLOW = {
  pending: ["confirmed", "cancelled", "no_show"],
  confirmed: ["seated", "cancelled", "no_show"],
  seated: ["completed", "no_show"],
  completed: [],
  cancelled: [],
  no_show: [],
};
