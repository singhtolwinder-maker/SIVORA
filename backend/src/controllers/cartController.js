import * as cartService from "../services/cartService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";

const orderType = (req) => (req.query?.type === "delivery" ? "delivery" : "pickup");

export const getCart = asyncHandler(async (req, res) => {
  const cart = await cartService.getCart(req.user._id, orderType(req));
  res.setHeader("Cache-Control", "private, no-store");
  return sendSuccess(res, { data: cart });
});

export const addItem = asyncHandler(async (req, res) => {
  const cart = await cartService.addItem(req.user._id, req.valid.body);
  return sendSuccess(res, { message: "Added to your cart.", data: cart });
});

export const updateItem = asyncHandler(async (req, res) => {
  const cart = await cartService.updateQuantity(
    req.user._id,
    req.valid.params.menuItemId,
    req.valid.body.quantity,
  );
  return sendSuccess(res, { message: "Cart updated.", data: cart });
});

export const removeItem = asyncHandler(async (req, res) => {
  const cart = await cartService.removeItem(req.user._id, req.valid.params.menuItemId);
  return sendSuccess(res, { message: "Item removed.", data: cart });
});

export const clear = asyncHandler(async (req, res) => {
  const cart = await cartService.clearCart(req.user._id);
  return sendSuccess(res, { message: "Cart emptied.", data: cart });
});
