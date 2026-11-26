import { Router } from "express";
import { z } from "zod";
import * as reservationController from "../controllers/reservationController.js";
import { optionalAuth, protect } from "../middleware/auth.js";
import { formLimiter } from "../middleware/rateLimit.js";
import { validate } from "../middleware/validate.js";
import { idParams } from "../validators/common.js";
import {
  availabilitySchema,
  cancelReservationSchema,
  createReservationSchema,
  myReservationsSchema,
} from "../validators/reservation.validator.js";

const router = Router();

const reservationParams = z.object({ id: idParams.shape.id });

// Public: availability and booking. A signed-in guest is linked to their account.
router.get("/availability", validate({ query: availabilitySchema }), reservationController.availability);
router.post(
  "/",
  formLimiter,
  optionalAuth,
  validate({ body: createReservationSchema }),
  reservationController.create,
);

router.get("/mine", protect, validate({ query: myReservationsSchema }), reservationController.listMine);
router.get("/:id", protect, validate({ params: reservationParams }), reservationController.detail);
router.post(
  "/:id/cancel",
  protect,
  validate({ params: reservationParams, body: cancelReservationSchema }),
  reservationController.cancel,
);

export default router;
