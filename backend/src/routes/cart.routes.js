import { Router } from "express";
import * as cartController from "../controllers/cartController.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  addCartItemSchema,
  cartItemParams,
  updateCartItemSchema,
} from "../validators/cart.validator.js";

const router = Router();

router.use(protect);

router.get("/", cartController.getCart);
router.post("/items", validate({ body: addCartItemSchema }), cartController.addItem);
router.patch(
  "/items/:menuItemId",
  validate({ params: cartItemParams, body: updateCartItemSchema }),
  cartController.updateItem,
);
router.delete("/items/:menuItemId", validate({ params: cartItemParams }), cartController.removeItem);
router.delete("/", cartController.clear);

export default router;
