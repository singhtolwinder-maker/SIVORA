import { Router } from "express";
import * as authController from "../controllers/authController.js";
import { optionalAuth, protect } from "../middleware/auth.js";
import { authLimiter, passwordResetLimiter } from "../middleware/rateLimit.js";
import { validate } from "../middleware/validate.js";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "../validators/auth.validator.js";

const router = Router();

router.post("/register", authLimiter, validate({ body: registerSchema }), authController.register);
router.post("/login", authLimiter, validate({ body: loginSchema }), authController.login);
// `authLimiter` skips successful responses, so only repeated failures (stale or
// forged cookies) count against the limit.
router.post("/refresh", authLimiter, authController.refresh);
router.post("/logout", authLimiter, authController.logout);
router.get("/session", optionalAuth, authController.session);
router.get("/me", protect, authController.me);
router.post(
  "/change-password",
  protect,
  authLimiter,
  validate({ body: changePasswordSchema }),
  authController.changePassword,
);
router.post(
  "/forgot-password",
  passwordResetLimiter,
  validate({ body: forgotPasswordSchema }),
  authController.forgotPassword,
);
router.post(
  "/reset-password",
  passwordResetLimiter,
  validate({ body: resetPasswordSchema }),
  authController.resetPassword,
);

export default router;
