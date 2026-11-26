/**
 * Business rules and shared enums. Values that operators may tune live in
 * environment variables (see config/env.js); everything here is structural.
 */

export const ROLES = Object.freeze({
  CUSTOMER: "customer",
  ADMIN: "admin",
});

export const MENU_CATEGORIES = Object.freeze([
  "Prime Cuts",
  "Signatures",
  "Starters",
  "Desserts",
  "Sides",
  "Drinks",
]);

export const ORDER_TYPES = Object.freeze(["pickup", "delivery"]);

export const ORDER_STATUSES = Object.freeze([
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "out_for_delivery",
  "delivered",
  "cancelled",
]);

/** Forward-only kitchen pipeline. Cancellation is handled separately. */
export const ORDER_STATUS_FLOW = Object.freeze({
  pending: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["ready"],
  ready: ["out_for_delivery", "delivered"],
  out_for_delivery: ["delivered"],
  delivered: [],
  cancelled: [],
});

/** Customers may only cancel before the kitchen starts cooking. */
export const CUSTOMER_CANCELLABLE_STATUSES = Object.freeze(["pending", "confirmed"]);

export const RESERVATION_STATUSES = Object.freeze([
  "pending",
  "confirmed",
  "seated",
  "completed",
  "cancelled",
  "no_show",
]);

/** Statuses that occupy seats in a slot. */
export const RESERVATION_HOLDING_STATUSES = Object.freeze(["pending", "confirmed", "seated"]);

export const RESERVATION_STATUS_FLOW = Object.freeze({
  pending: ["confirmed", "cancelled", "no_show"],
  confirmed: ["seated", "cancelled", "no_show"],
  seated: ["completed", "no_show"],
  completed: [],
  cancelled: [],
  no_show: [],
});

export const MESSAGE_STATUSES = Object.freeze(["new", "read", "replied", "archived"]);

export const PAYMENT_STATUSES = Object.freeze([
  "unpaid",
  "processing",
  "paid",
  "failed",
  "refunded",
]);

export const CANCELLABLE_ORDER_MESSAGE =
  "Orders can only be cancelled before the kitchen starts preparing them.";

export const MAX_CART_LINES = 40;
export const MAX_LINE_QUANTITY = 20;
