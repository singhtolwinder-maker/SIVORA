import config from "../config/env.js";
import MenuItem from "../models/MenuItem.js";
import ApiError from "../utils/ApiError.js";
import { toCents } from "../utils/money.js";
import { escapeRegex } from "../utils/pagination.js";

function slugify(value) {
  return String(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

async function uniqueSlug(name, ignoreId) {
  const base = slugify(name) || "dish";
  let candidate = base;
  let counter = 1;
  // Bounded loop: 50 attempts is far beyond any realistic collision.
  while (counter < 50) {
    const query = { slug: candidate };
    if (ignoreId) query._id = { $ne: ignoreId };
    const exists = await MenuItem.exists(query);
    if (!exists) return candidate;
    counter += 1;
    candidate = `${base}-${counter}`;
  }
  return `${base}-${Date.now()}`;
}

export async function listMenu({ limit, skip, search, category, minPrice, maxPrice, available, featured, sort }) {
  const filter = {};

  if (category) filter.category = category;
  if (available !== undefined) filter.isAvailable = available === "true";
  if (featured !== undefined) filter.isFeatured = featured === "true";
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.priceCents = {};
    if (minPrice !== undefined) filter.priceCents.$gte = toCents(minPrice);
    if (maxPrice !== undefined) filter.priceCents.$lte = toCents(maxPrice);
  }

  if (search) {
    // Regex search keeps behaviour identical with and without a text index
    // (Mongo's $text cannot do prefix matching or partial dish names).
    const pattern = new RegExp(escapeRegex(search), "i");
    filter.$or = [{ name: pattern }, { description: pattern }, { ingredients: pattern }];
  }

  const sortMap = {
    newest: { createdAt: -1 },
    name: { name: 1 },
    price_asc: { priceCents: 1 },
    price_desc: { priceCents: -1 },
    rating: { "rating.average": -1, "rating.count": -1 },
  };

  const [items, total] = await Promise.all([
    MenuItem.find(filter).sort(sortMap[sort] || sortMap.newest).skip(skip).limit(limit),
    MenuItem.countDocuments(filter),
  ]);

  return { items, total };
}

export async function getMenuItem(idOrSlug) {
  const query = /^[a-f\d]{24}$/i.test(idOrSlug) ? { _id: idOrSlug } : { slug: idOrSlug };
  const item = await MenuItem.findOne(query);
  if (!item) throw ApiError.notFound("That dish is not on the menu.", "MENU_ITEM_NOT_FOUND");
  return item;
}

export async function menuCategories() {
  const rows = await MenuItem.aggregate([
    { $group: { _id: "$category", count: { $sum: 1 }, minPriceCents: { $min: "$priceCents" }, maxPriceCents: { $max: "$priceCents" } } },
    { $sort: { minPriceCents: 1 } },
  ]);
  return rows.map((row) => ({
    category: row._id,
    count: row.count,
    minPriceCents: row.minPriceCents,
    maxPriceCents: row.maxPriceCents,
  }));
}

/** Maps validated API dollars to model cents and a generated slug. */
export async function payloadToDoc(payload, { existing } = {}) {
  const doc = {};

  if (payload.name !== undefined) {
    doc.name = payload.name;
    doc.slug = await uniqueSlug(payload.name, existing?._id);
  }
  if (payload.description !== undefined) doc.description = payload.description;
  if (payload.category !== undefined) doc.category = payload.category;
  if (payload.price !== undefined) doc.priceCents = toCents(payload.price);
  if (payload.compareAtPrice !== undefined) doc.compareAtCents = toCents(payload.compareAtPrice);
  if (payload.imageUrl !== undefined) doc.imageUrl = payload.imageUrl;
  if (payload.imageAlt !== undefined) doc.imageAlt = payload.imageAlt;
  if (payload.ingredients !== undefined) doc.ingredients = payload.ingredients;
  if (payload.allergens !== undefined) doc.allergens = payload.allergens;
  if (payload.dietaryTags !== undefined) doc.dietaryTags = payload.dietaryTags;
  if (payload.details !== undefined) doc.details = payload.details;
  if (payload.tier !== undefined) doc.tier = payload.tier;
  if (payload.isAvailable !== undefined) doc.isAvailable = payload.isAvailable;
  if (payload.isFeatured !== undefined) doc.isFeatured = payload.isFeatured;
  if (payload.prepMinutes !== undefined) doc.prepMinutes = payload.prepMinutes;
  if (payload.sortOrder !== undefined) doc.sortOrder = payload.sortOrder;
  if (payload.rating !== undefined) doc.rating = payload.rating;

  return doc;
}

export async function createMenuItem(payload) {
  const doc = await payloadToDoc(payload);
  if (!doc.name) throw ApiError.badRequest("Name is required.", { field: "name" });
  const created = await MenuItem.create(doc);
  return created;
}

export async function updateMenuItem(id, payload) {
  const existing = await MenuItem.findById(id);
  if (!existing) throw ApiError.notFound("That dish is not on the menu.", "MENU_ITEM_NOT_FOUND");

  const doc = await payloadToDoc(payload, { existing });
  Object.assign(existing, doc);
  await existing.save();
  return existing;
}

export async function deleteMenuItem(id) {
  const deleted = await MenuItem.findByIdAndDelete(id);
  if (!deleted) throw ApiError.notFound("That dish is not on the menu.", "MENU_ITEM_NOT_FOUND");
  return deleted;
}

export async function setAvailability(id, isAvailable) {
  const item = await MenuItem.findByIdAndUpdate(id, { $set: { isAvailable } }, { new: true });
  if (!item) throw ApiError.notFound("That dish is not on the menu.", "MENU_ITEM_NOT_FOUND");
  return item;
}

export const menuDefaults = {
  currency: "usd",
  taxRate: config.TAX_RATE,
};

export default {
  listMenu,
  getMenuItem,
  menuCategories,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  setAvailability,
};
