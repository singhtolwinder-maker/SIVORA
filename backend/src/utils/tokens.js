import jwt from "jsonwebtoken";
import config from "../config/env.js";
import ApiError from "./ApiError.js";

const ISSUER = "savora-api";
const AUDIENCE = "savora-web";

function sign(payload, secret, expiresIn) {
  return jwt.sign(payload, secret, { expiresIn, issuer: ISSUER, audience: AUDIENCE });
}

export function signAccessToken(user) {
  return sign({ sub: String(user._id), role: user.role, type: "access" }, config.JWT_ACCESS_SECRET, config.JWT_ACCESS_TTL);
}

export function signRefreshToken(user, tokenId) {
  return sign(
    { sub: String(user._id), jti: tokenId, type: "refresh" },
    config.JWT_REFRESH_SECRET,
    `${config.JWT_REFRESH_TTL_DAYS}d`,
  );
}

function verify(token, secret, expectedType) {
  try {
    const payload = jwt.verify(token, secret, { issuer: ISSUER, audience: AUDIENCE });
    if (payload.type !== expectedType) throw new Error("wrong token type");
    return payload;
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw ApiError.unauthorized("Your session has expired.", "TOKEN_EXPIRED");
    }
    throw ApiError.unauthorized("Invalid session token.", "INVALID_TOKEN");
  }
}

export const verifyAccessToken = (token) => verify(token, config.JWT_ACCESS_SECRET, "access");
export const verifyRefreshToken = (token) => verify(token, config.JWT_REFRESH_SECRET, "refresh");
