import mongoose from "mongoose";
import { RESERVATION_STATUSES, RESERVATION_HOLDING_STATUSES } from "../config/constants.js";

const reservationSchema = new mongoose.Schema(
  {
    reservationCode: { type: String, required: true, unique: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    guest: {
      name: { type: String, required: true, trim: true, maxlength: 80 },
      email: { type: String, required: true, trim: true, lowercase: true, maxlength: 160 },
      phone: { type: String, trim: true, maxlength: 24, default: "" },
    },
    date: {
      type: String,
      required: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD."],
      index: true,
    },
    time: {
      type: String,
      required: true,
      match: [/^\d{2}:\d{2}$/, "Time must be HH:mm."],
    },
    startsAt: { type: Date, required: true, index: true },
    partySize: { type: Number, required: true, min: 1, max: 50 },
    occasion: { type: String, trim: true, maxlength: 60, default: "" },
    notes: { type: String, trim: true, maxlength: 500, default: "" },
    status: { type: String, enum: RESERVATION_STATUSES, default: "pending", index: true },
    source: { type: String, enum: ["web", "phone", "admin"], default: "web" },
    statusHistory: {
      type: [
        {
          status: { type: String, enum: RESERVATION_STATUSES },
          at: { type: Date, default: Date.now },
          by: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
          note: { type: String, maxlength: 240, default: "" },
        },
      ],
      default: [],
    },
    cancelledAt: { type: Date, default: null },
    cancelReason: { type: String, maxlength: 240, default: "" },
  },
  { timestamps: true, versionKey: false },
);

reservationSchema.set("toJSON", {
  transform: (_doc, ret) => {
    ret.id = String(ret._id);
    return ret;
  },
});

reservationSchema.index({ date: 1, time: 1 });
reservationSchema.index({ "guest.email": 1, createdAt: -1 });
reservationSchema.index({ status: 1, date: 1 });

reservationSchema.statics.holdingStatuses = RESERVATION_HOLDING_STATUSES;

export const Reservation = mongoose.model("Reservation", reservationSchema);
export default Reservation;
