import { z } from "zod";
import { ORDER_STATUSES, ORDER_TYPES } from "../config/constants.js";
import { email, paginationQuery, personName, phone } from "./common.js";

const address = z.object({
  line1: z.string().trim().min(4, "Street address is required.").max(160),
  city: z.string().trim().min(2, "City is required.").max(80),
  state: z.string().trim().min(2, "State is required.").max(40),
  zip: z.string().trim().regex(/^\d{5}(-\d{4})?$/, "Enter a 5-digit ZIP code."),
  instructions: z.string().trim().max(240).optional().default(""),
});

export const createOrderSchema = z
  .object({
    type: z.enum(ORDER_TYPES).default("pickup"),
    name: personName,
    email,
    phone: phone.optional().default(""),
    deliveryAddress: address.optional(),
    notes: z.string().trim().max(500).optional().default(""),
  })
  .refine((data) => data.type !== "delivery" || data.deliveryAddress, {
    path: ["deliveryAddress"],
    message: "A delivery address is required for delivery orders.",
  })
  .refine((data) => data.type !== "delivery" || data.phone, {
    path: ["phone"],
    message: "A phone number is required for delivery orders.",
  });

export const listOrdersSchema = z.object({
  ...paginationQuery,
  status: z.enum(ORDER_STATUSES).optional(),
  type: z.enum(ORDER_TYPES).optional(),
  search: z.string().trim().max(80).optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  note: z.string().trim().max(240).optional().default(""),
});

export const cancelOrderSchema = z.object({
  reason: z.string().trim().max(240).optional().default(""),
});
