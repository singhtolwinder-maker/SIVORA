import { ROLES } from "../config/constants.js";
import * as orderService from "../services/orderService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { buildMeta, sendCreated, sendSuccess } from "../utils/apiResponse.js";
import { readPagination } from "../utils/pagination.js";

export const create = asyncHandler(async (req, res) => {
  const order = await orderService.createOrder(req.user, req.valid.body);
  return sendCreated(res, {
    message: `Order ${order.orderNumber} placed. We will confirm shortly.`,
    data: order,
  });
});

export const listMine = asyncHandler(async (req, res) => {
  const { page, limit, skip } = readPagination(req.valid.query, { defaultLimit: 10 });
  const { items, total } = await orderService.listOrders({
    user: req.user,
    isAdmin: false,
    query: { ...req.valid.query, page, limit, skip },
  });

  return sendSuccess(res, { data: items, meta: buildMeta({ page, limit, total }) });
});

export const detail = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderForUser({
    user: req.user,
    isAdmin: req.user.role === ROLES.ADMIN,
    id: req.valid.params.id,
  });
  return sendSuccess(res, { data: order });
});

export const cancel = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderForUser({
    user: req.user,
    isAdmin: req.user.role === ROLES.ADMIN,
    id: req.valid.params.id,
  });
  const cancelled = await orderService.cancelOrder({
    actor: req.user,
    order,
    reason: req.valid.body.reason,
  });
  return sendSuccess(res, { message: "Order cancelled.", data: cancelled });
});

export const adminList = asyncHandler(async (req, res) => {
  const { page, limit, skip } = readPagination(req.valid.query, { defaultLimit: 20 });
  const { items, total } = await orderService.listOrders({
    user: req.user,
    isAdmin: true,
    query: { ...req.valid.query, page, limit, skip },
  });

  return sendSuccess(res, { data: items, meta: buildMeta({ page, limit, total }) });
});

export const adminUpdateStatus = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderForUser({ user: req.user, isAdmin: true, id: req.valid.params.id });
  const updated = await orderService.updateOrderStatus({
    actor: req.user,
    order,
    status: req.valid.body.status,
    note: req.valid.body.note,
  });
  return sendSuccess(res, { message: "Order status updated.", data: updated });
});
