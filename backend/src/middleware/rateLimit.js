import { rateLimit } from "express-rate-limit";
import config from "../config/env.js";
import ApiError from "../utils/ApiError.js";

const skip = () => config.isTest;

const handler = (_req, _res, next) => next(ApiError.tooMany());

const base = {
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip,
  handler,
};

/** Broad protection for every API route. */
export const apiLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 600,
  message: "Too many requests.",
});

/** Credential endpoints: brute-force protection. */
export const authLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 20,
  skipSuccessfulRequests: true,
});

/** Password reset requests are expensive and abusable. */
export const passwordResetLimiter = rateLimit({
  ...base,
  windowMs: 60 * 60 * 1000,
  limit: 5,
});

/** Public forms (reservations, contact): spam protection. */
export const formLimiter = rateLimit({
  ...base,
  windowMs: 10 * 60 * 1000,
  limit: 12,
});

export default apiLimiter;
