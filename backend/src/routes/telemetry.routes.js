import { Router } from "express";
import * as telemetryController from "../controllers/telemetryController.js";
import { formLimiter } from "../middleware/rateLimit.js";
import { validate } from "../middleware/validate.js";
import { clientErrorSchema } from "../validators/telemetry.validator.js";

const router = Router();

router.post(
  "/",
  formLimiter,
  validate({ body: clientErrorSchema }),
  telemetryController.reportClientError,
);

export default router;
