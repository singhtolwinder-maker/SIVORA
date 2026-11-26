import mongoose from "mongoose";
import { MAX_LINE_QUANTITY } from "../config/constants.js";

const cartItemSchema = new mongoose.Schema(
  {
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem", required: true },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      max: MAX_LINE_QUANTITY,
      validate: { validator: Number.isInteger, message: "Quantity must be a whole number." },
    },
  },
  { _id: false },
);

const cartSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    items: { type: [cartItemSchema], default: [] },
  },
  { timestamps: true, versionKey: false },
);

export const Cart = mongoose.model("Cart", cartSchema);
export default Cart;
