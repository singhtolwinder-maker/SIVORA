import mongoose from "mongoose";
import config from "./env.js";

/**
 * Global Mongoose options. Exported so the test bootstrap applies exactly the
 * same configuration as the server — a mismatch here previously hid a bug
 * where query operators were silently rewritten.
 */
export function configureMongoose() {
  mongoose.set("strictQuery", true);

  // `sanitizeFilter` is deliberately NOT enabled. Mongoose implements it by
  // wrapping every object value in `$eq`, which also destroys legitimate
  // operators ($in, $gte, $gt, $ne) and turns them into CastErrors. Injection
  // is blocked upstream instead: middleware/sanitize.js rejects `$`-prefixed
  // and dotted keys outright, and every route parses its input through a Zod
  // schema that whitelists fields.
}

configureMongoose();

let connectionPromise = null;

/**
 * Connect once and reuse the connection. Safe to call from server.js and from
 * tests; subsequent calls return the in-flight promise.
 */
export function connectDatabase(uri = config.MONGODB_URI) {
  if (mongoose.connection.readyState === 1) return Promise.resolve(mongoose.connection);
  if (connectionPromise) return connectionPromise;

  connectionPromise = mongoose
    .connect(uri, {
      serverSelectionTimeoutMS: 10_000,
      socketTimeoutMS: 45_000,
      maxPoolSize: 20,
      minPoolSize: 2,
      autoIndex: !config.isProduction,
    })
    .then((instance) => {
      console.info(`[db] connected to ${instance.connection.host}/${instance.connection.name}`);
      return instance.connection;
    })
    .catch((error) => {
      connectionPromise = null;
      console.error(`[db] connection failed: ${error.message}`);
      throw error;
    });

  mongoose.connection.on("disconnected", () => console.warn("[db] disconnected"));
  mongoose.connection.on("reconnected", () => console.info("[db] reconnected"));

  return connectionPromise;
}

export async function disconnectDatabase() {
  connectionPromise = null;
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
}

export default { connectDatabase, disconnectDatabase };
