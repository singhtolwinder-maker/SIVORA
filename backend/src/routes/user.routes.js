import { Router } from "express";
import * as authController from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { changePasswordSchema, updateProfileSchema } from "../validators/auth.validator.js";

const router = Router();

router.use(protect);
router.get("/me", authController.me);
router.patch("/me", validate({ body: updateProfileSchema }), authController.updateProfile);
router.post("/me/password", validate({ body: changePasswordSchema }), authController.changePassword);

export default router;
