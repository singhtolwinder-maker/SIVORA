import { Router } from "express";
import mongoose from "mongoose";
import authRoutes from "./auth.routes.js";
import userRoutes from "./user.routes.js";
import menuRoutes from "./menu.routes.js";
import cartRoutes from "./cart.routes.js";
import orderRoutes from "./order.routes.js";
import reservationRoutes from "./reservation.routes.js";
import contactRoutes from "./contact.routes.js";
import paymentRoutes from "./payment.routes.js";
import adminRoutes from "./admin.routes.js";
import telemetryRoutes from "./telemetry.routes.js";
import { sendSuccess } from "../utils/apiResponse.js";

const router = Router();

const DB_STATES = ["disconnected", "connected", "connecting", "disconnecting"];

router.get("/health", (req, res) => {
  const state = DB_STATES[mongoose.connection.readyState] || "unknown";
  const healthy = state === "connected";
  const data = {
    status: healthy ? "ok" : "degraded",
    database: state,
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  };

  if (healthy) return sendSuccess(res, { data });

  // The envelope must agree with the status line: a 503 is never `success: true`.
  return res.status(503).json({
    success: false,
    error: { code: "DATABASE_UNAVAILABLE", message: "The database is not connected." },
    data,
    requestId: req.id,
  });
});

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/menu", menuRoutes);
router.use("/cart", cartRoutes);
router.use("/orders", orderRoutes);
router.use("/reservations", reservationRoutes);
router.use("/contact", contactRoutes);
router.use("/payments", paymentRoutes);
router.use("/admin", adminRoutes);
router.use("/client-errors", telemetryRoutes);

export default router;
