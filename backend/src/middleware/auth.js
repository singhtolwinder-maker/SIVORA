import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import { readAccessToken } from "../utils/cookies.js";
import { verifyAccessToken } from "../utils/tokens.js";

async function resolveUser(req) {
  const token = readAccessToken(req);
  if (!token) return null;

  const payload = verifyAccessToken(token);
  const user = await User.findById(payload.sub).select("+passwordHash");

  if (!user) throw ApiError.unauthorized("This account no longer exists.", "ACCOUNT_NOT_FOUND");
  if (!user.isActive) throw ApiError.forbidden("This account has been deactivated.", "ACCOUNT_DISABLED");

  // Tokens issued before a password change are no longer valid.
  if (user.passwordChangedAt && payload.iat * 1000 < user.passwordChangedAt.getTime()) {
    throw ApiError.unauthorized("Please sign in again.", "TOKEN_REVOKED");
  }

  return user;
}

/** Requires a valid session; attaches `req.user`. */
export async function protect(req, _res, next) {
  try {
    const user = await resolveUser(req);
    if (!user) throw ApiError.unauthorized("Sign in to continue.", "AUTH_REQUIRED");
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

/** Attaches `req.user` when a valid session exists, without failing otherwise. */
export async function optionalAuth(req, _res, next) {
  try {
    req.user = (await resolveUser(req)) || null;
  } catch {
    req.user = null;
  }
  next();
}

/** Role gate. Must run after `protect`. */
export function authorize(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized("Sign in to continue.", "AUTH_REQUIRED"));
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden("Administrator access is required.", "FORBIDDEN"));
    }
    return next();
  };
}

export const requireAdmin = [protect, authorize("admin")];
