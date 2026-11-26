import crypto from "node:crypto";
import config from "../config/env.js";
import ApiError from "../utils/ApiError.js";

export function requestId(req, res, next) {
  req.id = req.get("x-request-id")?.slice(0, 64) || crypto.randomUUID();
  res.setHeader("x-request-id", req.id);
  next();
}

/**
 * CSRF defence-in-depth for cookie sessions: browsers always send Origin on
 * cross-site state-changing requests, so anything not on the allowlist is
 * rejected. Requests with no Origin (curl, server-to-server) are allowed and
 * still require the session cookie.
 */
export function originGuard(req, _res, next) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();

  const origin = req.get("origin");
  if (!origin) return next();

  if (!config.CLIENT_ORIGINS.includes(origin)) {
    return next(ApiError.forbidden("Request origin is not allowed.", "ORIGIN_NOT_ALLOWED"));
  }
  return next();
}

export default { requestId, originGuard };
