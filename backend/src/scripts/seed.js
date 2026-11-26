import mongoose from "mongoose";
import config from "../config/env.js";
import { connectDatabase, disconnectDatabase } from "../config/db.js";
import MenuItem from "../models/MenuItem.js";
import User from "../models/User.js";
import { ROLES } from "../config/constants.js";
import { seedMenu } from "./seedData.js";

/** Development convenience only; production must supply its own password. */
const DEV_FALLBACK_PASSWORD = "ChangeMe!2026";

async function seedAdmin() {
  const email = config.SEED_ADMIN_EMAIL.toLowerCase();
  const existing = await User.findOne({ email }).select("+passwordHash");

  if (existing) {
    if (existing.role !== ROLES.ADMIN) {
      existing.role = ROLES.ADMIN;
      await existing.save();
      console.info(`[seed] promoted ${email} to admin.`);
    } else {
      console.info(`[seed] admin ${email} already exists (password unchanged).`);
    }
    return;
  }

  const password = config.SEED_ADMIN_PASSWORD || (config.isProduction ? "" : DEV_FALLBACK_PASSWORD);

  if (password.length < 8) {
    throw new Error(
      config.isProduction
        ? "SEED_ADMIN_PASSWORD is required in production and must be at least 8 characters."
        : "SEED_ADMIN_PASSWORD must be at least 8 characters.",
    );
  }

  if (!config.SEED_ADMIN_PASSWORD) {
    console.warn(
      "[seed] SEED_ADMIN_PASSWORD is not set — using the well-known development default. Set it before deploying.",
    );
  }

  await User.create({
    name: config.SEED_ADMIN_NAME,
    email,
    passwordHash: password,
    role: ROLES.ADMIN,
  });
  console.info(`[seed] created admin ${email}. Change the password after first sign-in.`);
}

async function seedMenuItems() {
  let created = 0;
  let updated = 0;

  for (const dish of seedMenu) {
    const existing = await MenuItem.findOne({ slug: dish.slug });
    if (existing) {
      // Keep operational fields (availability) untouched when reseeding.
      const { isAvailable, ...rest } = dish;
      void isAvailable;
      Object.assign(existing, rest);
      await existing.save();
      updated += 1;
    } else {
      await MenuItem.create(dish);
      created += 1;
    }
  }

  console.info(`[seed] menu: ${created} created, ${updated} updated.`);
}

async function main() {
  try {
    await connectDatabase();
    await Promise.all([User.init(), MenuItem.init()]);
    await seedAdmin();
    await seedMenuItems();
    await mongoose.connection.close();
    console.info("[seed] done.");
    process.exit(0);
  } catch (error) {
    console.error("[seed] failed:", error);
    await disconnectDatabase().catch(() => {});
    process.exit(1);
  }
}

main();
