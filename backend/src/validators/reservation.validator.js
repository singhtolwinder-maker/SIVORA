import { z } from "zod";
import { RESERVATION_STATUSES } from "../config/constants.js";
import { SERVICE_SLOTS } from "../utils/slots.js";
import { dateString, email, paginationQuery, personName, phone } from "./common.js";

export const availabilitySchema = z.object({ date: dateString });

export const createReservationSchema = z.object({
  name: personName,
  email,
  phone,
  date: dateString,
  time: z.enum(SERVICE_SLOTS, { errorMap: () => ({ message: "Choose one of our seating times." }) }),
  partySize: z.coerce.number().int().min(1).max(20),
  occasion: z.string().trim().max(60).optional().default(""),
  notes: z.string().trim().max(500).optional().default(""),
});

export const myReservationsSchema = z.object({
  ...paginationQuery,
  status: z.enum(RESERVATION_STATUSES).optional(),
});

export const adminReservationsSchema = z.object({
  ...paginationQuery,
  status: z.enum(RESERVATION_STATUSES).optional(),
  date: dateString.optional(),
  search: z.string().trim().max(80).optional(),
});

export const updateReservationStatusSchema = z.object({
  status: z.enum(RESERVATION_STATUSES),
  note: z.string().trim().max(240).optional().default(""),
});

export const cancelReservationSchema = z.object({
  reason: z.string().trim().max(240).optional().default(""),
});
