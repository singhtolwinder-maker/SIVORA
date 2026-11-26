import { z } from "zod";
import { MENU_CATEGORIES } from "../config/constants.js";
import { paginationQuery } from "./common.js";

const sortOptions = ["newest", "name", "price_asc", "price_desc", "rating"];

export const listMenuSchema = z.object({
  ...paginationQuery,
  search: z.string().trim().max(80).optional(),
  category: z.enum(MENU_CATEGORIES).optional(),
  minPrice: z.coerce.number().min(0).max(10_000).optional(),
  maxPrice: z.coerce.number().min(0).max(10_000).optional(),
  available: z.enum(["true", "false"]).optional(),
  featured: z.enum(["true", "false"]).optional(),
  sort: z.enum(sortOptions).optional().default("newest"),
});

const menuItemFields = {
  name: z.string().trim().min(2).max(90),
  description: z.string().trim().min(10).max(600),
  category: z.enum(MENU_CATEGORIES),
  price: z.coerce.number().min(0).max(10_000),
  compareAtPrice: z.coerce.number().min(0).max(10_000).optional(),
  imageUrl: z.string().trim().min(1).max(500),
  imageAlt: z.string().trim().max(160).optional(),
  ingredients: z.array(z.string().trim().min(1).max(60)).max(40).optional(),
  allergens: z.array(z.string().trim().min(1).max(60)).max(20).optional(),
  dietaryTags: z.array(z.string().trim().min(1).max(60)).max(20).optional(),
  details: z.array(z.string().trim().min(1).max(120)).max(20).optional(),
  tier: z.coerce.number().int().min(1).max(5).optional(),
  isAvailable: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  prepMinutes: z.coerce.number().int().min(0).max(240).optional(),
  sortOrder: z.coerce.number().int().min(-999).max(999).optional(),
  rating: z
    .object({
      average: z.coerce.number().min(0).max(5),
      count: z.coerce.number().int().min(0).max(100_000),
    })
    .optional(),
};

export const createMenuItemSchema = z.object({
  ...menuItemFields,
  ingredients: menuItemFields.ingredients.default([]),
  allergens: menuItemFields.allergens.default([]),
  dietaryTags: menuItemFields.dietaryTags.default([]),
  details: menuItemFields.details.default([]),
});

// Every field optional, but at least one must be present.
export const updateMenuItemSchema = z
  .object(
    Object.fromEntries(
      Object.entries(menuItemFields).map(([key, schema]) => [key, schema.optional()]),
    ),
  )
  .refine((data) => Object.keys(data).length > 0, { message: "Nothing to update." });

export const availabilitySchema = z.object({ isAvailable: z.boolean() });
