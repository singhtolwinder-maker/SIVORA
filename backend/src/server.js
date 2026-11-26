import config from "./config/env.js";
import { connectDatabase, disconnectDatabase } from "./config/db.js";
import createApp from "./app.js";

/**
 * Wait for MongoDB before listening. A missing database used to kill the
 * process immediately, so the Vite proxy answered every /api request with an
 * unexplained 502 even though the last log line said "listening". Retrying
 * gives a freshly started mongod time to accept connections and prints one
 * actionable line per attempt.
 */
async function connectWithRetry({ attempts = 12, delayMs = 5000 } = {}) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await connectDatabase();
    } catch (error) {
      if (attempt === attempts) throw error;
      console.warn(
        `[server] MongoDB unavailable (attempt ${attempt}/${attempts}): ${error.message}. ` +
          `Retrying in ${Math.round(delayMs / 1000)}s — is mongod running?`,
      );
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw new Error("database connection failed");
}

async function main() {
  const app = createApp();

  try {
    await connectWithRetry();
  } catch (error) {
    console.error(`[server] cannot start without a database connection: ${error.message}`);
    console.error("[server] start MongoDB (mongod) or point MONGODB_URI at a reachable server.");
    process.exit(1);
  }

  const server = app.listen(config.PORT, () => {
    const { port, address } = server.address();
    const host = address === "::" || address === "0.0.0.0" ? "127.0.0.1" : address;
    console.info(`[server] SAVORA API listening on http://${host}:${port}${config.API_PREFIX}`);
    console.info(`[server] environment=${config.NODE_ENV} payments=${config.paymentsEnabled ? "on" : "off"}`);
    for (const warning of config.warnings) console.warn(`[config] ${warning}`);
  });

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.error(`[server] port ${config.PORT} is already in use.`);
      process.exit(1);
    }
    throw error;
  });

  let shuttingDown = false;
  const shutdown = async (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.info(`[server] ${signal} received, shutting down.`);

    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });

    setTimeout(() => {
      console.error("[server] forced shutdown after timeout.");
      process.exit(1);
    }, 10_000).unref();
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  process.on("unhandledRejection", (reason) => {
    console.error("[server] unhandled rejection:", reason);
  });
  process.on("uncaughtException", (error) => {
    console.error("[server] uncaught exception:", error);
    shutdown("uncaughtException");
  });
}

main();
