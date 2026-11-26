import { z } from "zod";
import { MAX_LINE_QUANTITY } from "../config/constants.js";
import { objectId } from "./common.js";

const quantity = z.coerce
  .number()
  .int("Quantity must be a whole number.")
  .min(1, "Add at least one.")
  .max(MAX_LINE_QUANTITY, `Maximum ${MAX_LINE_QUANTITY} per dish.`);

export const addCartItemSchema = z.object({
  menuItemId: objectId,
  quantity: quantity.default(1),
});

export const updateCartItemSchema = z.object({ quantity });

export const cartItemParams = z.object({ menuItemId: objectId });
