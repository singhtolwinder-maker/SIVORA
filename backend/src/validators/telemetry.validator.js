import { z } from "zod";

/**
 * A browser crash report. Deliberately narrow: this is a log line, not a
 * database row, so nothing here is trusted for anything but diagnostics.
 */
export const clientErrorSchema = z.object({
  message: z.string().trim().min(1).max(500),
  stack: z.string().max(4000).optional(),
  componentStack: z.string().max(4000).optional(),
  source: z.string().trim().max(300).optional(),
  route: z.string().trim().max(200).optional(),
});
