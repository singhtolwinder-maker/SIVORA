import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import {
  CANCELLABLE_ORDER_MESSAGE,
  CUSTOMER_CANCELLABLE_STATUSES,
  ORDER_STATUS_FLOW,
  ROLES,
} from "../config/constants.js";
import ApiError from "../utils/ApiError.js";
import { orderNumber } from "../utils/ids.js";
import { escapeRegex } from "../utils/pagination.js";
import { loadPayableCart } from "./cartService.js";

function buildSnapshot(lines) {
  return lines.map((line) => ({
    menuItem: line.menuItem?.id ?? null,
    name: line.menuItem.name,
    imageUrl: line.menuItem.imageUrl,
    unitPriceCents: line.unitPriceCents,
    quantity: line.quantity,
    lineTotalCents: line.unitPriceCents * line.quantity,
  }));
}

export async function createOrder(user, payload) {
  // Totals come from the database, never from the request body.
  const { lines, totals } = await loadPayableCart(user._id, payload.type);

  const items = buildSnapshot(lines);
  const longestPrep = Math.max(0, ...items.map((item) => item.quantity * 2));
  const estimatedReadyAt = new Date(Date.now() + (20 + longestPrep) * 60 * 1000);

  const order = new Order({
    orderNumber: orderNumber(),
    user: user._id,
    items,
    type: payload.type,
    status: "pending",
    contact: {
      name: payload.name || user.name,
      email: payload.email || user.email,
      phone: payload.phone || user.phone || "",
    },
    deliveryAddress: payload.type === "delivery" ? payload.deliveryAddress : undefined,
    notes: payload.notes || "",
    subtotalCents: totals.subtotalCents,
    taxCents: totals.taxCents,
    deliveryFeeCents: totals.deliveryFeeCents,
    totalCents: totals.totalCents,
    statusHistory: [{ status: "pending", by: user._id, note: "Order placed" }],
    estimatedReadyAt,
  });

  // Retry once on the (very unlikely) order-number collision.
  try {
    await order.save();
  } catch (error) {
    if (error?.code === 11000) {
      order.orderNumber = orderNumber();
      await order.save();
    } else {
      throw error;
    }
  }

  // Empty the cart only after the order is safely stored.
  await Cart.updateOne({ user: user._id }, { $set: { items: [] } });

  return order;
}

export function buildOrderFilter({ user, status, type, search }, { isAdmin }) {
  const filter = {};

  if (!isAdmin) filter.user = user._id;
  if (status) filter.status = status;
  if (type) filter.type = type;

  if (search) {
    const pattern = new RegExp(escapeRegex(search), "i");
    const searchClause = [
      { orderNumber: pattern },
      { "contact.name": pattern },
      { "contact.email": pattern },
    ];
    if (isAdmin) {
      Object.assign(filter, { $or: searchClause });
    } else {
      filter.$and = [{ $or: searchClause }];
    }
  }

  return filter;
}

export async function listOrders({ user, isAdmin, query }) {
  const { page, limit, skip } = query;
  const filter = buildOrderFilter({ user, ...query }, { isAdmin });

  const [items, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments(filter),
  ]);

  return { items, total, page, limit };
}

export async function getOrderForUser({ user, isAdmin, id }) {
  const order = await Order.findById(id);
  if (!order) throw ApiError.notFound("Order not found.", "ORDER_NOT_FOUND");
  if (!isAdmin && String(order.user) !== String(user._id)) {
    throw ApiError.forbidden("That order belongs to another account.", "ORDER_FORBIDDEN");
  }
  return order;
}

export async function cancelOrder({ actor, order, reason }) {
  if (order.status === "cancelled") {
    throw ApiError.conflict("That order is already cancelled.", "ORDER_ALREADY_CANCELLED");
  }
  if (order.status === "delivered" || order.status === "out_for_delivery") {
    throw ApiError.conflict("Delivered or dispatched orders cannot be cancelled.", "ORDER_NOT_CANCELLABLE");
  }

  const isAdmin = actor.role === ROLES.ADMIN;
  if (!isAdmin && !CUSTOMER_CANCELLABLE_STATUSES.includes(order.status)) {
    throw ApiError.conflict(CANCELLABLE_ORDER_MESSAGE, "ORDER_NOT_CANCELLABLE");
  }

  order.status = "cancelled";
  order.cancelledAt = new Date();
  order.cancelReason = reason || (isAdmin ? "Cancelled by restaurant" : "Cancelled by customer");
  order.statusHistory.push({ status: "cancelled", by: actor._id, note: order.cancelReason });
  await order.save();
  return order;
}

export async function updateOrderStatus({ actor, order, status, note }) {
  if (order.status === status) return order;

  const allowed = ORDER_STATUS_FLOW[order.status] || [];
  if (!allowed.includes(status)) {
    throw ApiError.conflict(
      `An order cannot move from "${order.status.replaceAll("_", " ")}" to "${status.replaceAll("_", " ")}".`,
      "INVALID_STATUS_TRANSITION",
      { from: order.status, to: status, allowed },
    );
  }

  order.status = status;
  if (status === "cancelled") {
    order.cancelledAt = new Date();
    order.cancelReason = note || "Cancelled";
  }
  order.statusHistory.push({ status, by: actor._id, note: note || "" });
  await order.save();
  return order;
}

export function orderStatsPipeline() {
  return [
    { $match: { status: { $ne: "cancelled" } } },
    {
      $group: {
        _id: null,
        orders: { $sum: 1 },
        revenueCents: { $sum: "$totalCents" },
        averageOrderCents: { $avg: "$totalCents" },
      },
    },
  ];
}

export default {
  createOrder,
  listOrders,
  getOrderForUser,
  cancelOrder,
  updateOrderStatus,
  buildOrderFilter,
};
