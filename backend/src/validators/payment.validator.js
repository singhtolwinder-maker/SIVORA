import { z } from "zod";
import { objectId } from "./common.js";

export const createIntentSchema = z.object({
  orderId: objectId,
});

export const verifyPaymentSchema = z.object({
  orderId: objectId,
});

export const confirmPaymentSchema = z.object({
  orderId: objectId,
  paymentIntentId: z.string().trim().min(8).max(200),
});
