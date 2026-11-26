import mongoose from "mongoose";
import { connectDatabase, disconnectDatabase } from "../config/db.js";

// Import every model so mongoose knows about them before syncing.
import "../models/User.js";
import "../models/MenuItem.js";
import "../models/Cart.js";
import "../models/Order.js";
import "../models/Reservation.js";
import "../models/ReservationSlot.js";
import "../models/ContactMessage.js";
import "../models/PaymentEvent.js";

async function main() {
  try {
    await connectDatabase();
    for (const model of Object.values(mongoose.models)) {
      // eslint-disable-next-line no-await-in-loop
      const result = await model.syncIndexes();
      console.info(`[indexes] ${model.modelName}: ${result.length} index synced.`);
    }
    await disconnectDatabase();
    process.exit(0);
  } catch (error) {
    console.error("[indexes] failed:", error);
    await disconnectDatabase().catch(() => {});
    process.exit(1);
  }
}

main();
