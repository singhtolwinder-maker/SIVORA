import { Router } from "express";
import { z } from "zod";
import * as menuController from "../controllers/menuController.js";
import { requireAdmin } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { idParams } from "../validators/common.js";
import {
  availabilitySchema,
  createMenuItemSchema,
  listMenuSchema,
  updateMenuItemSchema,
} from "../validators/menu.validator.js";

const router = Router();

const slugParams = z.object({
  idOrSlug: z.string().trim().min(1).max(90),
});

router.get("/", validate({ query: listMenuSchema }), menuController.list);
router.get("/categories", menuController.categories);

// Admin management is declared before "/:idOrSlug" so it can never be shadowed.
router.post(
  "/",
  ...requireAdmin,
  validate({ body: createMenuItemSchema }),
  menuController.create,
);
router.patch(
  "/:id/availability",
  ...requireAdmin,
  validate({ params: idParams, body: availabilitySchema }),
  menuController.setAvailability,
);
router.patch(
  "/:id",
  ...requireAdmin,
  validate({ params: idParams, body: updateMenuItemSchema }),
  menuController.update,
);
router.delete("/:id", ...requireAdmin, validate({ params: idParams }), menuController.remove);

router.get("/:idOrSlug", validate({ params: slugParams }), menuController.detail);

export default router;
