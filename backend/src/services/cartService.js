import config from "../config/env.js";
import Cart from "../models/Cart.js";
import MenuItem from "../models/MenuItem.js";
import { MAX_CART_LINES, MAX_LINE_QUANTITY } from "../config/constants.js";
import ApiError from "../utils/ApiError.js";
import { calculateTax } from "../utils/money.js";

export function computeTotals({ lines, type = "pickup", deliveryFeeCents } = {}) {
  // Only available dishes contribute to the bill.
  const payable = lines.filter((line) => line.isAvailable);
  const subtotalCents = payable.reduce((total, line) => total + line.unitPriceCents * line.quantity, 0);

  const fee =
    type === "delivery" && subtotalCents > 0 && subtotalCents < config.FREE_DELIVERY_THRESHOLD_CENTS
      ? deliveryFeeCents ?? config.DELIVERY_FEE_CENTS
      : 0;

  const taxCents = calculateTax(subtotalCents, config.TAX_RATE);
  const totalCents = subtotalCents + taxCents + fee;

  return {
    subtotalCents,
    taxCents,
    deliveryFeeCents: fee,
    totalCents,
    itemCount: payable.reduce((count, line) => count + line.quantity, 0),
    currency: "usd",
    taxRate: config.TAX_RATE,
  };
}

function serialiseLine(item) {
  const dish = item.menuItem;
  const available = Boolean(dish?.isAvailable);
  const unitPriceCents = dish?.priceCents ?? 0;

  return {
    menuItem: dish
      ? {
          id: String(dish._id),
          name: dish.name,
          slug: dish.slug,
          category: dish.category,
          imageUrl: dish.imageUrl,
          priceCents: unitPriceCents,
          isAvailable: dish.isAvailable,
        }
      : null,
    quantity: item.quantity,
    unitPriceCents,
    lineTotalCents: unitPriceCents * item.quantity,
    isAvailable: available,
    reason: dish ? (available ? null : "Currently unavailable") : "No longer on the menu",
  };
}

export function serialiseCart(cart, type = "pickup") {
  const lines = (cart?.items || []).map(serialiseLine);
  return {
    id: cart ? String(cart._id) : null,
    items: lines,
    totals: computeTotals({ lines, type }),
    updatedAt: cart?.updatedAt ?? null,
  };
}

async function populatedCart(userId) {
  return Cart.findOne({ user: userId }).populate("items.menuItem");
}

export async function getCart(userId, type = "pickup") {
  const cart = await populatedCart(userId);
  return serialiseCart(cart, type);
}

export async function addItem(userId, { menuItemId, quantity }) {
  const dish = await MenuItem.findById(menuItemId);
  if (!dish) throw ApiError.notFound("That dish is not on the menu.", "MENU_ITEM_NOT_FOUND");
  if (!dish.isAvailable) {
    throw ApiError.conflict(`${dish.name} is not available right now.`, "ITEM_UNAVAILABLE");
  }

  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    try {
      cart = await Cart.create({ user: userId, items: [] });
    } catch (error) {
      if (error?.code === 11000) cart = await Cart.findOne({ user: userId });
      else throw error;
    }
  }

  const line = cart.items.find((item) => String(item.menuItem) === String(menuItemId));
  if (line) {
    const next = line.quantity + quantity;
    if (next > MAX_LINE_QUANTITY) {
      throw ApiError.badRequest(`You can order up to ${MAX_LINE_QUANTITY} of one dish.`, {
        field: "quantity",
      });
    }
    line.quantity = next;
  } else {
    if (cart.items.length >= MAX_CART_LINES) {
      throw ApiError.badRequest("Your cart is full. Place this order before adding more.");
    }
    cart.items.push({ menuItem: menuItemId, quantity });
  }

  await cart.save();
  return getCart(userId);
}

export async function updateQuantity(userId, menuItemId, quantity) {
  const cart = await Cart.findOne({ user: userId });
  if (!cart) throw ApiError.notFound("Your cart is empty.", "CART_EMPTY");

  const line = cart.items.find((item) => String(item.menuItem) === String(menuItemId));
  if (!line) throw ApiError.notFound("That dish is not in your cart.", "CART_ITEM_NOT_FOUND");

  if (quantity > MAX_LINE_QUANTITY) {
    throw ApiError.badRequest(`You can order up to ${MAX_LINE_QUANTITY} of one dish.`, { field: "quantity" });
  }

  line.quantity = quantity;
  await cart.save();
  return getCart(userId);
}

export async function removeItem(userId, menuItemId) {
  const cart = await Cart.findOne({ user: userId });
  if (!cart) throw ApiError.notFound("Your cart is empty.", "CART_EMPTY");

  const before = cart.items.length;
  cart.items = cart.items.filter((item) => String(item.menuItem) !== String(menuItemId));
  if (cart.items.length === before) {
    throw ApiError.notFound("That dish is not in your cart.", "CART_ITEM_NOT_FOUND");
  }

  await cart.save();
  return getCart(userId);
}

export async function clearCart(userId) {
  const cart = await Cart.findOne({ user: userId });
  if (cart) {
    cart.items = [];
    await cart.save();
  }
  return getCart(userId);
}

/** Internal: loaded, priced lines used by order creation. */
export async function loadPayableCart(userId, type) {
  const cart = await populatedCart(userId);
  if (!cart || cart.items.length === 0) {
    throw ApiError.badRequest("Your cart is empty.", { code: "CART_EMPTY" });
  }

  const lines = cart.items.map(serialiseLine);
  const unavailable = lines.filter((line) => !line.isAvailable);
  if (unavailable.length > 0) {
    throw ApiError.conflict(
      `${unavailable.map((line) => line.menuItem?.name ?? "A dish").join(", ")} is not available right now.`,
      "ITEMS_UNAVAILABLE",
      unavailable.map((line) => ({ menuItemId: line.menuItem?.id, reason: line.reason })),
    );
  }

  return { cart, lines, totals: computeTotals({ lines, type }), menuItems: cart.items.map((item) => item.menuItem) };
}

export default {
  getCart,
  addItem,
  updateQuantity,
  removeItem,
  clearCart,
  computeTotals,
  serialiseCart,
  loadPayableCart,
};
