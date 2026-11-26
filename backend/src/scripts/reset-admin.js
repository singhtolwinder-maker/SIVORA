/**
 * Apply SEED_ADMIN_PASSWORD from the environment to the administrator account.
 *
 * Use this when the admin password is unknown, or to rotate it. It never prints
 * the password itself — set it in `backend/.env` first (generate one with
 * `node -e "console.log(require('crypto').randomBytes(18).toString('base64url'))"`),
 * then run `npm run admin:reset`.
 *
 * Safe to run repeatedly: it only touches the configured administrator account.
 */
import mongoose from "mongoose";
import config from "../config/env.js";
import { connectDatabase, disconnectDatabase } from "../config/db.js";
import User from "../models/User.js";
import { ROLES } from "../config/constants.js";

async function main() {
  const email = config.SEED_ADMIN_EMAIL.toLowerCase();
  const password = config.SEED_ADMIN_PASSWORD;

  if (!password) {
    throw new Error(
      "SEED_ADMIN_PASSWORD is empty. Set it in backend/.env (8+ characters) before running this command.",
    );
  }
  if (password.length < 8) {
    throw new Error("SEED_ADMIN_PASSWORD must be at least 8 characters.");
  }
  if (config.isProduction && password.length < 12) {
    throw new Error("In production, SEED_ADMIN_PASSWORD must be at least 12 characters.");
  }

  await connectDatabase();
  await User.init();

  const user = await User.findOne({ email }).select("+passwordHash +refreshTokens");

  if (user) {
    user.passwordHash = password;
    user.role = ROLES.ADMIN;
    user.isActive = true;
    // Sign out every existing session for this account.
    user.refreshTokens = [];
    await user.save();
    console.info(`[admin:reset] password updated for ${email} (role: ${user.role}). Existing sessions revoked.`);
  } else {
    await User.create({
      name: config.SEED_ADMIN_NAME,
      email,
      passwordHash: password,
      role: ROLES.ADMIN,
    });
    console.info(`[admin:reset] created administrator ${email}.`);
  }

  await mongoose.connection.close();
  process.exit(0);
}

main().catch(async (error) => {
  console.error("[admin:reset] failed:", error.message);
  await disconnectDatabase().catch(() => {});
  process.exit(1);
});
