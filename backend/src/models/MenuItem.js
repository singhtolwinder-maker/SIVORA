import mongoose from "mongoose";
import { MENU_CATEGORIES } from "../config/constants.js";
import { fromCents } from "../utils/money.js";

const menuItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 90 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, required: true, trim: true, maxlength: 600 },
    category: { type: String, required: true, enum: MENU_CATEGORIES, index: true },
    priceCents: {
      type: Number,
      required: true,
      min: [0, "Price cannot be negative."],
      validate: {
        validator: Number.isInteger,
        message: "Price must be an integer number of cents.",
      },
    },
    compareAtCents: { type: Number, min: 0, default: null },
    imageUrl: { type: String, required: true, trim: true },
    imageAlt: { type: String, trim: true, maxlength: 160, default: "" },
    ingredients: { type: [String], default: [] },
    allergens: { type: [String], default: [] },
    dietaryTags: { type: [String], default: [] },
    details: { type: [String], default: [] },
    rating: {
      average: { type: Number, min: 0, max: 5, default: 0 },
      count: { type: Number, min: 0, default: 0 },
    },
    tier: { type: Number, min: 1, max: 5, default: 3 },
    isAvailable: { type: Boolean, default: true, index: true },
    isFeatured: { type: Boolean, default: false },
    prepMinutes: { type: Number, min: 0, max: 240, default: 20 },
    sortOrder: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: {
      versionKey: false,
      transform: (_doc, ret) => {
        ret.id = String(ret._id);
        ret.price = fromCents(ret.priceCents);
        if (ret.compareAtCents != null) ret.compareAt = fromCents(ret.compareAtCents);
        return ret;
      },
    },
  },
);

menuItemSchema.index({ name: "text", description: "text", ingredients: "text" });
menuItemSchema.index({ category: 1, sortOrder: 1, name: 1 });
menuItemSchema.index({ priceCents: 1 });
menuItemSchema.index({ isAvailable: 1, category: 1 });

export const MenuItem = mongoose.model("MenuItem", menuItemSchema);
export default MenuItem;
