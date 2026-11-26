import config from "../config/env.js";
import * as authService from "../services/authService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendCreated, sendSuccess } from "../utils/apiResponse.js";
import { clearAuthCookies, readRefreshToken, setAuthCookies } from "../utils/cookies.js";

function sessionPayload(res, session) {
  setAuthCookies(res, { accessToken: session.accessToken, refreshToken: session.refreshToken });
  return { user: session.user };
}

export const register = asyncHandler(async (req, res) => {
  const session = await authService.register(req.valid.body);
  res.setHeader("Cache-Control", "no-store");
  return sendCreated(res, {
    message: "Welcome to SAVORA.",
    data: sessionPayload(res, session),
  });
});

export const login = asyncHandler(async (req, res) => {
  const session = await authService.login(req.valid.body);
  res.setHeader("Cache-Control", "no-store");
  return sendSuccess(res, { message: "Signed in.", data: sessionPayload(res, session) });
});

export const refresh = asyncHandler(async (req, res) => {
  const session = await authService.rotateSession(readRefreshToken(req));
  res.setHeader("Cache-Control", "no-store");
  return sendSuccess(res, { data: sessionPayload(res, session) });
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logout(readRefreshToken(req));
  clearAuthCookies(res);
  return sendSuccess(res, { message: "Signed out.", data: null });
});

/**
 * Public session probe: 200 with `user: null` for guests. The signed-in UI can
 * boot without a guaranteed 401 in the browser console on every page load.
 */
export const session = asyncHandler(async (req, res) => {
  res.setHeader("Cache-Control", "private, no-store");
  return sendSuccess(res, { data: { user: req.user ? req.user.toJSON() : null } });
});

export const me = asyncHandler(async (req, res) => {
  res.setHeader("Cache-Control", "private, no-store");
  return sendSuccess(res, { data: { user: req.user.toJSON() } });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await authService.updateProfile(req.user, req.valid.body);
  res.setHeader("Cache-Control", "private, no-store");
  return sendSuccess(res, { message: "Profile updated.", data: { user } });
});

export const changePassword = asyncHandler(async (req, res) => {
  const session = await authService.changePassword(req.user, req.valid.body);
  return sendSuccess(res, {
    message: "Password updated. Other devices have been signed out.",
    data: sessionPayload(res, session),
  });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.requestPasswordReset(req.valid.body.email);
  const message = "If that email is registered, a reset link is on its way.";

  // Never reveal whether the account exists. The link is echoed in non-production
  // only, so the flow can be completed without a mail server.
  return sendSuccess(res, {
    message,
    data: config.isProduction ? null : { devResetUrl: result.devUrl ?? null },
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.valid.body);
  clearAuthCookies(res);
  return sendSuccess(res, { message: "Password reset. Please sign in with your new password." });
});
