import { z } from "zod";
import { MESSAGE_STATUSES } from "../config/constants.js";
import { email, paginationQuery, personName, phone } from "./common.js";

export const CONTACT_SUBJECTS = [
  "General enquiry",
  "Private dining",
  "Large party",
  "Feedback",
  "Careers",
  "Accessibility",
];

export const createContactMessageSchema = z.object({
  name: personName,
  email,
  phone,
  subject: z.enum(CONTACT_SUBJECTS, {
    errorMap: () => ({ message: "Choose a subject." }),
  }),
  message: z
    .string()
    .trim()
    .min(10, "Tell us a little more (10 characters minimum).")
    .max(2000, "Please keep it under 2000 characters."),
  // Simple honeypot: real users never fill a hidden field.
  company: z.string().max(0).optional(),
});

export const listMessagesSchema = z.object({
  ...paginationQuery,
  status: z.enum(MESSAGE_STATUSES).optional(),
  search: z.string().trim().max(80).optional(),
});

export const updateMessageSchema = z
  .object({
    status: z.enum(MESSAGE_STATUSES).optional(),
    adminNote: z.string().trim().max(1000).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "Nothing to update." });
