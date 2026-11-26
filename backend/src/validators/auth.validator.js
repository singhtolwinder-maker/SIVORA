import { z } from "zod";
import { email, password, personName, phone } from "./common.js";

export const registerSchema = z
  .object({
    name: personName,
    email,
    password,
    confirmPassword: z.string().optional(),
    phone,
  })
  .refine((data) => !data.confirmPassword || data.confirmPassword === data.password, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password."),
});

export const updateProfileSchema = z
  .object({
    name: personName.optional(),
    phone,
    defaultAddress: z
      .object({
        line1: z.string().trim().max(160).optional(),
        city: z.string().trim().max(80).optional(),
        state: z.string().trim().max(40).optional(),
        zip: z.string().trim().max(12).optional(),
        instructions: z.string().trim().max(240).optional(),
      })
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "Nothing to update." });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: password,
    confirmPassword: z.string().optional(),
  })
  .refine((data) => !data.confirmPassword || data.confirmPassword === data.newPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    path: ["newPassword"],
    message: "Choose a password you have not used before.",
  });

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z.object({
  token: z.string().min(20, "Reset token is invalid."),
  password,
});
