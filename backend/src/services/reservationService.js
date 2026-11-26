import config from "../config/env.js";
import Reservation from "../models/Reservation.js";
import ReservationSlot from "../models/ReservationSlot.js";
import {
  RESERVATION_HOLDING_STATUSES,
  RESERVATION_STATUS_FLOW,
  ROLES,
} from "../config/constants.js";
import ApiError from "../utils/ApiError.js";
import { publicCode } from "../utils/ids.js";
import { escapeRegex } from "../utils/pagination.js";
import { SERVICE_SLOTS, isClosedDate, normalizePartySize } from "../utils/slots.js";
import { addDays, formatSlotLabel, todayInZone, zonedToUtc } from "../utils/time.js";
import { sendReservationConfirmation } from "../utils/mailer.js";

const HOLDING = new Set(RESERVATION_HOLDING_STATUSES);

function assertBookableDate(date) {
  const today = todayInZone();
  if (date < today) {
    throw ApiError.badRequest("That date has already passed.", { field: "date" });
  }
  if (date > addDays(today, config.RESERVATION_LEAD_DAYS)) {
    throw ApiError.badRequest(
      `We take bookings up to ${config.RESERVATION_LEAD_DAYS} days ahead.`,
      { field: "date" },
    );
  }
  if (isClosedDate(date)) {
    throw ApiError.badRequest("We are closed on Mondays.", { field: "date" });
  }
}

function assertPartySize(partySize) {
  if (partySize > config.RESERVATION_MAX_PARTY) {
    throw ApiError.badRequest(
      `For parties larger than ${config.RESERVATION_MAX_PARTY}, please call us or email reservations@savora.com.`,
      { field: "partySize" },
    );
  }
}

function assertLeadTime(date, time) {
  if (date !== todayInZone()) return;
  const startsAt = zonedToUtc(date, time);
  if (startsAt.getTime() < Date.now() + 30 * 60 * 1000) {
    throw ApiError.badRequest("That seating is less than 30 minutes away. Please call the restaurant.", {
      field: "time",
    });
  }
}

async function readSlots(date) {
  const rows = await ReservationSlot.find({ date }).lean();
  return new Map(rows.map((row) => [row.time, row]));
}

export async function getAvailability(date) {
  assertBookableDate(date);
  const existing = await readSlots(date);

  return SERVICE_SLOTS.map((time) => {
    const row = existing.get(time);
    const booked = row?.bookedGuests ?? 0;
    const capacity = row?.capacity ?? config.RESERVATION_SLOT_CAPACITY;
    const startsAt = zonedToUtc(date, time);
    const tooSoon = startsAt.getTime() < Date.now() + 30 * 60 * 1000;
    const seatsLeft = Math.max(0, capacity - booked);
    return {
      time,
      label: formatSlotLabel(date, time),
      capacity,
      booked,
      seatsLeft,
      available: seatsLeft > 0 && !tooSoon,
    };
  });
}

export async function createReservation(payload, user = null) {
  // Check the requested size before clamping, so oversized parties get a
  // clear 400 instead of silently shrinking to the maximum.
  assertPartySize(Number(payload.partySize));
  const partySize = normalizePartySize(payload.partySize);
  assertBookableDate(payload.date);
  assertLeadTime(payload.date, payload.time);

  const existing = await Reservation.findOne({
    "guest.email": payload.email,
    date: payload.date,
    time: payload.time,
    status: { $in: RESERVATION_HOLDING_STATUSES },
  });
  if (existing) {
    throw ApiError.conflict(
      "You already have a table requested for that seating. We will confirm it shortly.",
      "DUPLICATE_RESERVATION",
      { reservationCode: existing.reservationCode },
    );
  }

  // Ensure the slot document exists, then claim seats with one conditional
  // atomic update. If two requests race, only one can pass the capacity test.
  await ReservationSlot.updateOne(
    { date: payload.date, time: payload.time },
    { $setOnInsert: { capacity: config.RESERVATION_SLOT_CAPACITY } },
    { upsert: true },
  );

  // Raw collection call keeps this atomic check at the driver level, so the
  // capacity test and the increment happen in a single round trip.
  const claim = await ReservationSlot.collection.findOneAndUpdate(
    {
      date: payload.date,
      time: payload.time,
      $expr: { $lte: [{ $add: ["$bookedGuests", partySize] }, "$capacity"] },
    },
    { $inc: { bookedGuests: partySize } },
    { returnDocument: "after" },
  );

  if (!claim) {
    throw ApiError.conflict("That seating is fully booked. Please choose another time.", "SLOT_FULL", {
      field: "time",
    });
  }

  const startsAt = zonedToUtc(payload.date, payload.time);
  const reservation = new Reservation({
    reservationCode: publicCode(),
    user: user?._id ?? null,
    guest: { name: payload.name, email: payload.email, phone: payload.phone || "" },
    date: payload.date,
    time: payload.time,
    startsAt,
    partySize,
    occasion: payload.occasion || "",
    notes: payload.notes || "",
    status: "pending",
    source: "web",
    statusHistory: [{ status: "pending", note: "Requested online" }],
  });

  try {
    await reservation.save();
  } catch (error) {
    // Give the seats back if the reservation could not be stored.
    await ReservationSlot.collection.updateOne(
      { date: payload.date, time: payload.time, bookedGuests: { $gte: partySize } },
      { $inc: { bookedGuests: -partySize } },
    );
    if (error?.code === 11000) {
      reservation.reservationCode = publicCode();
      await reservation.save();
    } else {
      throw error;
    }
  }

  await sendReservationConfirmation({ reservation });
  return reservation;
}

async function releaseSeats(reservation, partySize = reservation.partySize) {
  await ReservationSlot.collection.updateOne(
    { date: reservation.date, time: reservation.time, bookedGuests: { $gte: partySize } },
    { $inc: { bookedGuests: -partySize } },
  );
}

export function buildReservationFilter({ user, isAdmin, status, date, search }) {
  const filter = {};

  if (!isAdmin) {
    filter.$or = [{ user: user._id }, { "guest.email": user.email }];
  }
  if (status) filter.status = status;
  if (date) filter.date = date;
  if (search) {
    const pattern = new RegExp(escapeRegex(search), "i");
    const clause = [
      { reservationCode: pattern },
      { "guest.name": pattern },
      { "guest.email": pattern },
      { "guest.phone": pattern },
    ];
    if (filter.$or) filter.$and = [{ $or: filter.$or }, { $or: clause }];
    else filter.$or = clause;
  }

  return filter;
}

export async function listReservations({ user, isAdmin, query }) {
  const { page, limit, skip } = query;
  const filter = buildReservationFilter({ user, isAdmin, ...query });

  const [items, total] = await Promise.all([
    Reservation.find(filter).sort({ date: -1, time: -1 }).skip(skip).limit(limit),
    Reservation.countDocuments(filter),
  ]);

  return { items, total, page, limit };
}

export async function getReservation({ user, isAdmin, id }) {
  const reservation = await Reservation.findById(id);
  if (!reservation) throw ApiError.notFound("Reservation not found.", "RESERVATION_NOT_FOUND");

  const ownsIt =
    String(reservation.user) === String(user._id) || reservation.guest.email === user.email;
  if (!isAdmin && !ownsIt) {
    throw ApiError.forbidden("That reservation belongs to another guest.", "RESERVATION_FORBIDDEN");
  }
  return reservation;
}

export async function cancelReservation({ actor, reservation, reason }) {
  if (reservation.status === "cancelled") {
    throw ApiError.conflict("That reservation is already cancelled.", "RESERVATION_ALREADY_CANCELLED");
  }
  if (["completed", "no_show"].includes(reservation.status)) {
    throw ApiError.conflict("That reservation can no longer be cancelled.", "RESERVATION_NOT_CANCELLABLE");
  }

  const wasHolding = HOLDING.has(reservation.status);
  reservation.status = "cancelled";
  reservation.cancelledAt = new Date();
  reservation.cancelReason =
    reason || (actor.role === ROLES.ADMIN ? "Cancelled by restaurant" : "Cancelled by guest");
  reservation.statusHistory.push({
    status: "cancelled",
    by: actor._id,
    note: reservation.cancelReason,
  });
  await reservation.save();

  if (wasHolding) await releaseSeats(reservation);
  return reservation;
}

export async function updateReservationStatus({ actor, reservation, status, note }) {
  if (reservation.status === status) return reservation;

  const allowed = RESERVATION_STATUS_FLOW[reservation.status] || [];
  if (!allowed.includes(status)) {
    throw ApiError.conflict(
      `A reservation cannot move from "${reservation.status}" to "${status}".`,
      "INVALID_STATUS_TRANSITION",
      { from: reservation.status, to: status, allowed },
    );
  }

  const wasHolding = HOLDING.has(reservation.status);
  const willHold = HOLDING.has(status);

  reservation.status = status;
  if (status === "cancelled") {
    reservation.cancelledAt = new Date();
    reservation.cancelReason = note || "Cancelled";
  }
  reservation.statusHistory.push({ status, by: actor._id, note: note || "" });
  await reservation.save();

  if (wasHolding && !willHold) await releaseSeats(reservation);
  if (!wasHolding && willHold) {
    await ReservationSlot.updateOne(
      { date: reservation.date, time: reservation.time },
      { $inc: { bookedGuests: reservation.partySize } },
    );
  }

  return reservation;
}

export default {
  getAvailability,
  createReservation,
  listReservations,
  getReservation,
  cancelReservation,
  updateReservationStatus,
};
