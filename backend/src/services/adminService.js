import Order from "../models/Order.js";
import Reservation from "../models/Reservation.js";
import ContactMessage from "../models/ContactMessage.js";
import MenuItem from "../models/MenuItem.js";
import User from "../models/User.js";
import { ROLES, RESERVATION_HOLDING_STATUSES } from "../config/constants.js";
import ApiError from "../utils/ApiError.js";
import { escapeRegex } from "../utils/pagination.js";
import { todayInZone } from "../utils/time.js";

export async function getDashboardStats() {
  const today = todayInZone();
  const now = new Date();

  const [
    totalCustomers,
    totalOrders,
    pendingOrders,
    completedOrders,
    revenueRows,
    menuTotal,
    unavailableDishes,
    todayReservations,
    upcomingReservations,
    pendingReservations,
    unreadMessages,
    statusBreakdown,
    topItems,
    recentOrders,
    recentReservations,
    recentMessages,
  ] = await Promise.all([
    User.countDocuments({ role: ROLES.CUSTOMER }),
    Order.countDocuments({}),
    Order.countDocuments({ status: { $in: ["pending", "confirmed", "preparing", "ready", "out_for_delivery"] } }),
    Order.countDocuments({ status: "delivered" }),
    Order.aggregate([
      { $match: { status: { $ne: "cancelled" }, "payment.status": "paid" } },
      { $group: { _id: null, revenueCents: { $sum: "$totalCents" }, paidOrders: { $sum: 1 } } },
    ]),
    MenuItem.countDocuments({}),
    MenuItem.countDocuments({ isAvailable: false }),
    Reservation.countDocuments({ date: today, status: { $in: RESERVATION_HOLDING_STATUSES } }),
    Reservation.countDocuments({
      startsAt: { $gte: now },
      status: { $in: RESERVATION_HOLDING_STATUSES },
    }),
    Reservation.countDocuments({ status: "pending" }),
    ContactMessage.countDocuments({ status: "new" }),
    Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
    Order.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.name",
          quantity: { $sum: "$items.quantity" },
          revenueCents: { $sum: "$items.lineTotalCents" },
        },
      },
      { $sort: { quantity: -1 } },
      { $limit: 5 },
    ]),
    Order.find({}).sort({ createdAt: -1 }).limit(5),
    Reservation.find({}).sort({ createdAt: -1 }).limit(5),
    ContactMessage.find({}).sort({ createdAt: -1 }).limit(5),
  ]);

  const revenueCents = revenueRows[0]?.revenueCents ?? 0;
  const paidOrders = revenueRows[0]?.paidOrders ?? 0;

  const activities = [
    ...recentOrders.map((order) => ({
      type: "order",
      id: order._id,
      title: `Order ${order.orderNumber}`,
      detail: `${order.status.replaceAll("_", " ")} · $${(order.totalCents / 100).toFixed(2)}`,
      at: order.createdAt,
    })),
    ...recentReservations.map((reservation) => ({
      type: "reservation",
      id: reservation._id,
      title: `Reservation ${reservation.reservationCode}`,
      detail: `${reservation.date} ${reservation.time} · ${reservation.partySize} guests`,
      at: reservation.createdAt,
    })),
    ...recentMessages.map((message) => ({
      type: "message",
      id: message._id,
      title: `Message from ${message.name}`,
      detail: message.subject,
      at: message.createdAt,
    })),
  ]
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 10);

  return {
    customers: { total: totalCustomers },
    orders: {
      total: totalOrders,
      pending: pendingOrders,
      completed: completedOrders,
      byStatus: Object.fromEntries(statusBreakdown.map((row) => [row._id, row.count])),
    },
    revenue: {
      totalCents: revenueCents,
      paidOrders,
      averageOrderCents: paidOrders ? Math.round(revenueCents / paidOrders) : 0,
    },
    reservations: {
      today: todayReservations,
      upcoming: upcomingReservations,
      pending: pendingReservations,
    },
    messages: { unread: unreadMessages },
    menu: { total: menuTotal, unavailable: unavailableDishes },
    topDishes: topItems.map((row) => ({
      name: row._id,
      quantity: row.quantity,
      revenueCents: row.revenueCents,
    })),
    recent: { orders: recentOrders, reservations: recentReservations, messages: recentMessages },
    activities,
  };
}

export async function listCustomers({ page, limit, skip, search }) {
  const filter = { role: ROLES.CUSTOMER };
  if (search) {
    const pattern = new RegExp(escapeRegex(search), "i");
    filter.$or = [{ name: pattern }, { email: pattern }, { phone: pattern }];
  }

  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  // Attach order counts without N+1 queries.
  const ids = items.map((user) => user._id);
  const counts = await Order.aggregate([
    { $match: { user: { $in: ids } } },
    { $group: { _id: "$user", orders: { $sum: 1 }, spentCents: { $sum: "$totalCents" } } },
  ]);
  const byUser = new Map(counts.map((row) => [String(row._id), row]));

  return {
    items: items.map((user) => ({
      ...user.toJSON(),
      stats: {
        orders: byUser.get(String(user._id))?.orders ?? 0,
        spentCents: byUser.get(String(user._id))?.spentCents ?? 0,
      },
    })),
    total,
    page,
    limit,
  };
}

export async function setCustomerActive(id, isActive) {
  const user = await User.findOneAndUpdate(
    { _id: id, role: ROLES.CUSTOMER },
    { $set: { isActive } },
    { new: true },
  );
  if (!user) throw ApiError.notFound("Customer not found.", "CUSTOMER_NOT_FOUND");
  return user;
}

export default { getDashboardStats, listCustomers, setCustomerActive };
