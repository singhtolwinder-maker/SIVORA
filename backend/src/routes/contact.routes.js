import { Router } from "express";
import * as contactController from "../controllers/contactController.js";
import { requireAdmin } from "../middleware/auth.js";
import { formLimiter } from "../middleware/rateLimit.js";
import { validate } from "../middleware/validate.js";
import { idParams } from "../validators/common.js";
import {
  createContactMessageSchema,
  listMessagesSchema,
  updateMessageSchema,
} from "../validators/contact.validator.js";

const router = Router();

router.post("/", formLimiter, validate({ body: createContactMessageSchema }), contactController.create);

router.get(
  "/",
  ...requireAdmin,
  validate({ query: listMessagesSchema }),
  contactController.list,
);
router.get("/:id", ...requireAdmin, validate({ params: idParams }), contactController.detail);
router.patch(
  "/:id",
  ...requireAdmin,
  validate({ params: idParams, body: updateMessageSchema }),
  contactController.update,
);
router.delete("/:id", ...requireAdmin, validate({ params: idParams }), contactController.remove);

export default router;
