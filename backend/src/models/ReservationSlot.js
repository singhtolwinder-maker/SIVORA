import mongoose from "mongoose";

/**
 * One document per date+time holding the number of guests already committed.
 * Conditional atomic updates on this document are what make capacity checks
 * race-safe when two guests book the same slot at once.
 */
const reservationSlotSchema = new mongoose.Schema(
  {
    date: { type: String, required: true },
    time: { type: String, required: true },
    capacity: { type: Number, required: true, min: 1 },
    bookedGuests: { type: Number, required: true, min: 0, default: 0 },
  },
  { timestamps: true, versionKey: false },
);

reservationSlotSchema.index({ date: 1, time: 1 }, { unique: true });

export const ReservationSlot = mongoose.model("ReservationSlot", reservationSlotSchema);
export default ReservationSlot;
