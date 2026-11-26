import Stripe from "stripe";
import config from "../config/env.js";
import Order from "../models/Order.js";
import PaymentEvent from "../models/PaymentEvent.js";
import ApiError from "../utils/ApiError.js";

let stripeClient = null;

export function paymentsEnabled() {
  return config.paymentsEnabled;
}

function client() {
  if (!config.paymentsEnabled) {
    throw ApiError.serviceUnavailable(
      "Online payments are not configured. Please pay at the restaurant or call us.",
      "PAYMENTS_DISABLED",
    );
  }
  stripeClient ||= new Stripe(config.STRIPE_SECRET_KEY);
  return stripeClient;
}

async function loadOwnedOrder(user, orderId) {
  const order = await Order.findById(orderId);
  if (!order) throw ApiError.notFound("Order not found.", "ORDER_NOT_FOUND");
  if (String(order.user) !== String(user._id)) {
    throw ApiError.forbidden("That order belongs to another account.", "ORDER_FORBIDDEN");
  }
  if (order.status === "cancelled") {
    throw ApiError.conflict("Cancelled orders cannot be paid.", "ORDER_CANCELLED");
  }
  if (order.payment.status === "paid") {
    throw ApiError.conflict("That order is already paid.", "ORDER_ALREADY_PAID");
  }
  if (order.totalCents <= 0) {
    throw ApiError.badRequest("That order has no amount due.", { code: "NOTHING_DUE" });
  }
  return order;
}

export async function createPaymentIntent(user, orderId) {
  // Fail closed before touching the order if payments are not configured.
  const stripe = client();
  const order = await loadOwnedOrder(user, orderId);

  const intent = await stripe.paymentIntents.create(
    {
      amount: order.totalCents,
      currency: order.currency || "usd",
      automatic_payment_methods: { enabled: true },
      description: `SAVORA order ${order.orderNumber}`,
      metadata: {
        orderId: String(order._id),
        orderNumber: order.orderNumber,
        userId: String(order.user),
      },
    },
    // A retried request reuses the same intent instead of charging twice.
    { idempotencyKey: `savora-intent-${order._id}-${order.totalCents}` },
  );

  order.payment.provider = "stripe";
  order.payment.intentId = intent.id;
  await order.save();

  return {
    orderId: String(order._id),
    orderNumber: order.orderNumber,
    clientSecret: intent.client_secret,
    paymentIntentId: intent.id,
    amountCents: order.totalCents,
    currency: order.currency || "usd",
  };
}

function intentMatchesOrder(intent, order) {
  const amount = intent.amount_received || intent.amount || 0;
  const currency = String(intent.currency || "").toLowerCase();
  return amount === order.totalCents && currency === (order.currency || "usd");
}

async function markOrderPaid(order, intent) {
  if (order.payment.status === "paid") return false;

  order.payment.provider = "stripe";
  order.payment.status = "paid";
  order.payment.intentId = intent.id;
  order.payment.reference = intent.latest_charge ? String(intent.latest_charge) : intent.id;
  order.payment.paidAt = new Date();

  if (order.status === "pending") {
    order.status = "confirmed";
    order.statusHistory.push({ status: "confirmed", note: "Payment received" });
  }

  await order.save();
  return true;
}

/** Server-side check after the browser reports a successful card entry. */
export async function verifyPayment(user, orderId, { paymentIntentId } = {}) {
  const order = await loadOwnedOrder(user, orderId);
  const stripe = client();

  const intentId = paymentIntentId || order.payment.intentId;
  if (!intentId) throw ApiError.badRequest("No payment has been started for this order.", { code: "NO_INTENT" });
  if (order.payment.intentId && paymentIntentId && order.payment.intentId !== paymentIntentId) {
    throw ApiError.badRequest("That payment does not belong to this order.", { code: "INTENT_MISMATCH" });
  }

  const intent = await stripe.paymentIntents.retrieve(intentId);

  // An intent may only ever settle the order it was created for. Without this,
  // an intent belonging to a different order of the same amount could be used
  // to mark this one paid.
  const intentOrderId = intent.metadata?.orderId ? String(intent.metadata.orderId) : null;
  if (intentOrderId) {
    if (intentOrderId !== String(order._id)) {
      throw ApiError.conflict("That payment belongs to a different order.", "PAYMENT_ORDER_MISMATCH");
    }
  } else if (order.payment.intentId !== intent.id) {
    throw ApiError.badRequest("That payment does not belong to this order.", { code: "INTENT_MISMATCH" });
  }

  if (intent.status !== "succeeded") {
    return { paid: false, paymentStatus: intent.status, order };
  }

  if (!intentMatchesOrder(intent, order)) {
    throw ApiError.conflict("Payment amount does not match the order total.", "PAYMENT_AMOUNT_MISMATCH");
  }

  await markOrderPaid(order, intent);
  return { paid: true, paymentStatus: "paid", order };
}

/** Stripe webhook: signature-verified and idempotent per event id. */
export async function handleWebhook(rawBody, signature) {
  if (!config.STRIPE_WEBHOOK_SECRET) {
    throw ApiError.serviceUnavailable("Webhook signing secret is not configured.", "WEBHOOK_NOT_CONFIGURED");
  }

  let event;
  try {
    event = client().webhooks.constructEvent(rawBody, signature, config.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    throw ApiError.badRequest(`Webhook signature verification failed: ${error.message}`);
  }

  let ledger;
  try {
    ledger = await PaymentEvent.create({ eventId: event.id, type: event.type });
  } catch (error) {
    if (error?.code === 11000) return { received: true, duplicate: true };
    throw error;
  }

  try {
    if (event.type === "payment_intent.succeeded") {
      const intent = event.data.object;
      const order = intent.metadata?.orderId
        ? await Order.findById(intent.metadata.orderId)
        : await Order.findOne({ "payment.intentId": intent.id });

      if (!order) {
        console.warn(`[stripe] succeeded event for unknown order (${intent.id})`);
      } else if (!intentMatchesOrder(intent, order)) {
        console.warn(`[stripe] amount mismatch for order ${order.orderNumber}; not marking paid`);
      } else {
        await markOrderPaid(order, intent);
        ledger.order = order._id;
        ledger.amountCents = order.totalCents;
        await ledger.save();
      }
    } else if (event.type === "payment_intent.payment_failed") {
      const intent = event.data.object;
      await Order.updateOne(
        { "payment.intentId": intent.id, "payment.status": { $ne: "paid" } },
        { $set: { "payment.status": "failed" } },
      );
    } else if (event.type === "charge.refunded") {
      const charge = event.data.object;
      await Order.updateOne(
        { "payment.reference": String(charge.id) },
        { $set: { "payment.status": "refunded" } },
      );
    }

    return { received: true, duplicate: false, type: event.type };
  } catch (error) {
    // Remove the ledger entry so Stripe's retry is processed again.
    await PaymentEvent.deleteOne({ _id: ledger._id });
    throw error;
  }
}

export default { createPaymentIntent, verifyPayment, handleWebhook, paymentsEnabled };
