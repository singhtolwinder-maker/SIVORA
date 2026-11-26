import config from "../config/env.js";

const ACCESS_TTL_MS = () => {
  // jsonwebtoken accepts a string like "15m"; mirror it for the cookie maxAge.
  const match = /^(\d+)([smhd])$/.exec(config.JWT_ACCESS_TTL);
  if (!match) return 15 * 60 * 1000;
  const value = Number(match[1]);
  const unit = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[match[2]];
  return value * unit;
};

const baseCookie = () => ({
  httpOnly: true,
  secure: config.cookieSecure,
  sameSite: "lax",
  ...(config.COOKIE_DOMAIN ? { domain: config.COOKIE_DOMAIN } : {}),
});

export function setAuthCookies(res, { accessToken, refreshToken }) {
  res.cookie(config.accessCookieName, accessToken, {
    ...baseCookie(),
    path: "/",
    maxAge: ACCESS_TTL_MS(),
  });

  res.cookie(config.refreshCookieName, refreshToken, {
    ...baseCookie(),
    path: "/api/auth",
    maxAge: config.JWT_REFRESH_TTL_DAYS * 86_400_000,
  });
}

export function clearAuthCookies(res) {
  res.clearCookie(config.accessCookieName, { ...baseCookie(), path: "/" });
  res.clearCookie(config.refreshCookieName, { ...baseCookie(), path: "/api/auth" });
}

export function readAccessToken(req) {
  const header = req.get("authorization");
  if (header?.toLowerCase().startsWith("bearer ")) return header.slice(7).trim();
  return req.cookies?.[config.accessCookieName] || null;
}

export function readRefreshToken(req) {
  return req.cookies?.[config.refreshCookieName] || null;
}
