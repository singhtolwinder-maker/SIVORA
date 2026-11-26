import config from "../config/env.js";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import { randomToken, sha256 } from "../utils/ids.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/tokens.js";
import { sendPasswordResetEmail } from "../utils/mailer.js";

const MAX_SESSIONS_PER_USER = 5;
const RESET_TTL_MS = 30 * 60 * 1000;

async function issueSession(user) {
  // Refresh tokens are stored hashed; the plaintext lives only in the cookie.
  const tokenId = randomToken(12);
  const refreshToken = signRefreshToken(user, tokenId);
  const tokenHash = await User.hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + config.JWT_REFRESH_TTL_DAYS * 86_400_000);

  user.refreshTokens = [
    ...(user.refreshTokens || []).filter((entry) => entry.expiresAt > new Date()),
    { tokenHash, expiresAt },
  ].slice(-MAX_SESSIONS_PER_USER);

  await user.save({ validateBeforeSave: false });

  return {
    user: user.toJSON(),
    accessToken: signAccessToken(user),
    refreshToken,
  };
}

export async function register({ name, email, password, phone }) {
  const existing = await User.exists({ email });
  if (existing) {
    throw ApiError.conflict("An account with that email already exists.", "EMAIL_IN_USE", { field: "email" });
  }

  const user = new User({ name, email, passwordHash: password, phone: phone || "" });
  try {
    await user.save();
  } catch (error) {
    if (error?.code === 11000) {
      throw ApiError.conflict("An account with that email already exists.", "EMAIL_IN_USE", { field: "email" });
    }
    throw error;
  }

  return issueSession(user);
}

export async function login({ email, password }) {
  const user = await User.findOne({ email }).select("+passwordHash +refreshTokens");
  // Constant-ish response: same error whether the email or password is wrong.
  if (!user) throw ApiError.unauthorized("Email or password is incorrect.", "INVALID_CREDENTIALS");

  const matches = await user.verifyPassword(password);
  if (!matches) throw ApiError.unauthorized("Email or password is incorrect.", "INVALID_CREDENTIALS");

  if (!user.isActive) throw ApiError.forbidden("This account has been deactivated.", "ACCOUNT_DISABLED");

  user.lastLoginAt = new Date();
  return issueSession(user);
}

export async function rotateSession(rawRefreshToken) {
  if (!rawRefreshToken) throw ApiError.unauthorized("No session to refresh.", "REFRESH_MISSING");

  const payload = verifyRefreshToken(rawRefreshToken);
  const user = await User.findById(payload.sub).select("+refreshTokens");
  if (!user || !user.isActive) throw ApiError.unauthorized("Please sign in again.", "SESSION_REVOKED");

  const stored = (user.refreshTokens || []).filter((entry) => entry.expiresAt > new Date());
  let matchedIndex = -1;
  for (let index = 0; index < stored.length; index += 1) {
    // eslint-disable-next-line no-await-in-loop
    if (await User.verifyToken(rawRefreshToken, stored[index].tokenHash)) {
      matchedIndex = index;
      break;
    }
  }
  if (matchedIndex === -1) throw ApiError.unauthorized("Please sign in again.", "SESSION_REVOKED");

  // Rotate: the presented token is single-use.
  user.refreshTokens = stored.filter((_entry, index) => index !== matchedIndex);
  const session = await issueSession(user);
  return session;
}

export async function logout(rawRefreshToken) {
  if (!rawRefreshToken) return;

  try {
    const payload = verifyRefreshToken(rawRefreshToken);
    const user = await User.findById(payload.sub).select("+refreshTokens");
    if (!user) return;

    const remaining = [];
    for (const entry of user.refreshTokens || []) {
      // eslint-disable-next-line no-await-in-loop
      if (!(await User.verifyToken(rawRefreshToken, entry.tokenHash))) remaining.push(entry);
    }
    user.refreshTokens = remaining;
    await user.save({ validateBeforeSave: false });
  } catch {
    // An expired or tampered token needs no server-side cleanup.
  }
}

export async function requestPasswordReset(email) {
  const user = await User.findOne({ email });
  // Always report success so the endpoint cannot enumerate accounts.
  if (!user || !user.isActive) return { delivered: false };

  const token = randomToken(32);
  user.resetTokenHash = sha256(token);
  user.resetTokenExpiresAt = new Date(Date.now() + RESET_TTL_MS);
  await user.save({ validateBeforeSave: false });

  try {
    const url = await sendPasswordResetEmail({ user, token });
    return { delivered: true, devUrl: url };
  } catch (error) {
    console.warn(`[auth] reset email failed: ${error.message}`);
    return { delivered: false };
  }
}

export async function resetPassword({ token, password }) {
  const user = await User.findOne({
    resetTokenHash: sha256(token),
    resetTokenExpiresAt: { $gt: new Date() },
  }).select("+resetTokenHash +resetTokenExpiresAt");

  if (!user) {
    throw ApiError.badRequest("That reset link is invalid or has expired.", { field: "token" });
  }

  user.passwordHash = password;
  user.resetTokenHash = undefined;
  user.resetTokenExpiresAt = undefined;
  user.refreshTokens = [];
  await user.save();
  return user.toJSON();
}

export async function changePassword(user, { currentPassword, newPassword }) {
  const fresh = await User.findById(user._id).select("+passwordHash +refreshTokens");
  if (!fresh) throw ApiError.unauthorized("Account not found.", "ACCOUNT_NOT_FOUND");

  const matches = await fresh.verifyPassword(currentPassword);
  if (!matches) {
    throw ApiError.badRequest("Current password is incorrect.", { field: "currentPassword" });
  }

  fresh.passwordHash = newPassword;
  fresh.refreshTokens = [];
  await fresh.save();

  // Old sessions are revoked by the passwordChangedAt check; start a new one.
  return issueSession(fresh);
}

export async function updateProfile(user, payload) {
  const updates = {};
  if (payload.name !== undefined) updates.name = payload.name;
  if (payload.phone !== undefined) updates.phone = payload.phone;
  if (payload.defaultAddress !== undefined) {
    updates.defaultAddress = { ...(user.defaultAddress?.toObject?.() ?? user.defaultAddress ?? {}), ...payload.defaultAddress };
  }

  const updated = await User.findByIdAndUpdate(user._id, { $set: updates }, { new: true, runValidators: true });
  return updated?.toJSON();
}

export default {
  register,
  login,
  rotateSession,
  logout,
  requestPasswordReset,
  resetPassword,
  changePassword,
  updateProfile,
};
