import { z } from "zod";

export const objectId = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Must be a valid identifier.");

export const email = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Email is required.")
  .max(160, "Email is too long.")
  .email("Enter a valid email address.");

export const phone = z
  .string()
  .trim()
  .max(24, "Phone number is too long.")
  .regex(/^[+()\d\s-]{7,24}$/, "Use digits, spaces or + ( ) - only.")
  .optional()
  .or(z.literal(""));

export const personName = z
  .string()
  .trim()
  .min(2, "Please enter a name.")
  .max(80, "Name is too long.");

export const password = z
  .string()
  .min(8, "Use at least 8 characters.")
  .max(72, "Use at most 72 characters.")
  .regex(/[a-z]/, "Include a lowercase letter.")
  .regex(/[A-Z]/, "Include an uppercase letter.")
  .regex(/\d/, "Include a number.");

export const paginationQuery = {
  page: z.coerce.number().int().min(1).max(10_000).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(12),
};

export const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use the YYYY-MM-DD format.")
  .refine((value) => !Number.isNaN(Date.parse(`${value}T12:00:00Z`)), "That date does not exist.");

export const idParams = z.object({ id: objectId });
