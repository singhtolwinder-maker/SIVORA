import { Router } from "express";
import { z } from "zod";
import * as adminController from "../controllers/adminController.js";
import * as menuController from "../controllers/menuController.js";
import * as orderController from "../controllers/orderController.js";
import * as reservationController from "../controllers/reservationController.js";
import * as contactController from "../controllers/contactController.js";
import { requireAdmin } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { idParams, paginationQuery } from "../validators/common.js";
import {
  adminReservationsSchema,
  updateReservationStatusSchema,
} from "../validators/reservation.validator.js";
import { listOrdersSchema, updateOrderStatusSchema } from "../validators/order.validator.js";
import { listMessagesSchema, updateMessageSchema } from "../validators/contact.validator.js";
import { updateMenuItemSchema } from "../validators/menu.validator.js";

const router = Router();

router.use(...requireAdmin);

router.get("/stats", adminController.stats);
router.get(
  "/customers",
  validate({ query: z.object({ ...paginationQuery, search: z.string().trim().max(80).optional() }) }),
  adminController.customers,
);
router.patch(
  "/customers/:id",
  validate({ params: idParams, body: z.object({ isActive: z.boolean() }) }),
  adminController.setCustomerActive,
);

router.get("/orders", validate({ query: listOrdersSchema }), orderController.adminList);
router.patch(
  "/orders/:id/status",
  validate({ params: idParams, body: updateOrderStatusSchema }),
  orderController.adminUpdateStatus,
);

router.get("/reservations", validate({ query: adminReservationsSchema }), reservationController.adminList);
router.patch(
  "/reservations/:id/status",
  validate({ params: idParams, body: updateReservationStatusSchema }),
  reservationController.adminUpdate,
);

router.get("/messages", validate({ query: listMessagesSchema }), contactController.list);
router.patch(
  "/messages/:id",
  validate({ params: idParams, body: updateMessageSchema }),
  contactController.update,
);

router.patch(
  "/menu/:id",
  validate({ params: idParams, body: updateMenuItemSchema }),
  menuController.update,
);

export default router;
