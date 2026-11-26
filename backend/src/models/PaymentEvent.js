import mongoose from "mongoose";

/**
 * Ledger of provider webhook events. The unique index on eventId makes
 * processing idempotent: a replayed event cannot mark an order paid twice.
 */
const paymentEventSchema = new mongoose.Schema(
  {
    eventId: { type: String, required: true, unique: true, index: true },
    type: { type: String, required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
    amountCents: { type: Number, default: 0 },
    processedAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

export const PaymentEvent = mongoose.model("PaymentEvent", paymentEventSchema);
export default PaymentEvent;
