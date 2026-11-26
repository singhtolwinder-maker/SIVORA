import { Router } from "express";
import * as paymentController from "../controllers/paymentController.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  confirmPaymentSchema,
  createIntentSchema,
  verifyPaymentSchema,
} from "../validators/payment.validator.js";

const router = Router();

router.get("/config", paymentController.status);
router.post("/intents", protect, validate({ body: createIntentSchema }), paymentController.createIntent);
router.post("/verify", protect, validate({ body: verifyPaymentSchema }), paymentController.verify);
router.post("/confirm", protect, validate({ body: confirmPaymentSchema }), paymentController.verify);

export default router;
