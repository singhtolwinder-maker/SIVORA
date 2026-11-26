import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import config from "./config/env.js";
import routes from "./routes/index.js";
import * as paymentController from "./controllers/paymentController.js";
import { apiLimiter } from "./middleware/rateLimit.js";
import { sanitizeRequest } from "./middleware/sanitize.js";
import { originGuard, requestId } from "./middleware/requestContext.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import ApiError from "./utils/ApiError.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  if (config.isProduction) app.set("trust proxy", 1);

  app.use(requestId);
  app.use(
    helmet({
      contentSecurityPolicy: false, // API only; the site sets its own CSP.
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || config.CLIENT_ORIGINS.includes(origin)) return callback(null, true);
        return callback(ApiError.forbidden("Origin is not allowed.", "ORIGIN_NOT_ALLOWED"));
      },
      credentials: true,
      methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id", "Stripe-Signature"],
      maxAge: 86_400,
    }),
  );

  app.use(cookieParser());

  // Stripe needs the untouched request body; mount it before the JSON parser.
  app.post(
    `${config.API_PREFIX}/payments/webhook`,
    express.raw({ type: "application/json", limit: "1mb" }),
    paymentController.webhook,
  );

  app.use(express.json({ limit: "100kb" }));
  app.use(express.urlencoded({ extended: false, limit: "100kb" }));

  if (!config.isTest) {
    app.use(morgan(config.LOG_LEVEL || (config.isProduction ? "combined" : "dev")));
  }

  app.use(sanitizeRequest);
  app.use(originGuard);
  app.use(config.API_PREFIX, apiLimiter, routes);

  app.get("/", (_req, res) => {
    res.json({
      name: "SAVORA API",
      version: "1.0.0",
      docs: `${config.API_PREFIX}/health`,
    });
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export default createApp;
