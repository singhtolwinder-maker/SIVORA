import mongoose from "mongoose";
import { ORDER_STATUSES, ORDER_TYPES, PAYMENT_STATUSES } from "../config/constants.js";
import { fromCents } from "../utils/money.js";

const orderItemSchema = new mongoose.Schema(
  {
    // Kept as a reference for reporting only; the snapshot below is authoritative.
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem", default: null },
    name: { type: String, required: true },
    imageUrl: { type: String, default: "" },
    unitPriceCents: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    lineTotalCents: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const statusEntrySchema = new mongoose.Schema(
  {
    status: { type: String, enum: ORDER_STATUSES, required: true },
    at: { type: Date, default: Date.now },
    by: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    note: { type: String, maxlength: 240, default: "" },
  },
  { _id: false },
);

const addressSchema = new mongoose.Schema(
  {
    line1: { type: String, trim: true, maxlength: 160, default: "" },
    city: { type: String, trim: true, maxlength: 80, default: "" },
    state: { type: String, trim: true, maxlength: 40, default: "" },
    zip: { type: String, trim: true, maxlength: 12, default: "" },
    instructions: { type: String, trim: true, maxlength: 240, default: "" },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    items: {
      type: [orderItemSchema],
      validate: [(items) => items.length > 0, "An order needs at least one item."],
    },
    type: { type: String, enum: ORDER_TYPES, default: "pickup" },
    status: { type: String, enum: ORDER_STATUSES, default: "pending", index: true },
    contact: {
      name: { type: String, required: true, trim: true, maxlength: 80 },
      email: { type: String, required: true, trim: true, lowercase: true, maxlength: 160 },
      phone: { type: String, trim: true, maxlength: 24, default: "" },
    },
    deliveryAddress: { type: addressSchema, default: undefined },
    notes: { type: String, trim: true, maxlength: 500, default: "" },
    subtotalCents: { type: Number, required: true, min: 0 },
    taxCents: { type: Number, required: true, min: 0 },
    deliveryFeeCents: { type: Number, required: true, min: 0, default: 0 },
    totalCents: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "usd" },
    payment: {
      provider: { type: String, enum: ["stripe", "none"], default: "none" },
      status: { type: String, enum: PAYMENT_STATUSES, default: "unpaid" },
      intentId: { type: String, default: "" },
      paidAt: { type: Date, default: null },
      reference: { type: String, default: "" },
    },
    statusHistory: { type: [statusEntrySchema], default: [] },
    cancelledAt: { type: Date, default: null },
    cancelReason: { type: String, maxlength: 240, default: "" },
    estimatedReadyAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      versionKey: false,
      transform: (_doc, ret) => {
        ret.id = String(ret._id);
        ret.subtotal = fromCents(ret.subtotalCents);
        ret.tax = fromCents(ret.taxCents);
        ret.deliveryFee = fromCents(ret.deliveryFeeCents);
        ret.total = fromCents(ret.totalCents);
        return ret;
      },
    },
  },
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ "payment.intentId": 1 });

export const Order = mongoose.model("Order", orderSchema);
export default Order;
