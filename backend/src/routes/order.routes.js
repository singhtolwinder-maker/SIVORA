import { Router } from "express";
import { z } from "zod";
import * as orderController from "../controllers/orderController.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { idParams } from "../validators/common.js";
import {
  cancelOrderSchema,
  createOrderSchema,
  listOrdersSchema,
} from "../validators/order.validator.js";

const router = Router();

router.use(protect);

router.post("/", validate({ body: createOrderSchema }), orderController.create);
router.get("/", validate({ query: listOrdersSchema }), orderController.listMine);

const orderParams = z.object({ id: idParams.shape.id });
router.get("/:id", validate({ params: orderParams }), orderController.detail);
router.post("/:id/cancel", validate({ params: orderParams, body: cancelOrderSchema }), orderController.cancel);

export default router;
