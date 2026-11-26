import * as menuService from "../services/menuService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { buildMeta, sendCreated, sendSuccess } from "../utils/apiResponse.js";
import { readPagination } from "../utils/pagination.js";

export const list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = readPagination(req.valid.query, { defaultLimit: 12 });
  const { items, total } = await menuService.listMenu({ ...req.valid.query, page, limit, skip });

  return sendSuccess(res, {
    data: items,
    meta: buildMeta({ page, limit, total }),
  });
});

export const detail = asyncHandler(async (req, res) => {
  const item = await menuService.getMenuItem(req.valid.params.idOrSlug);
  return sendSuccess(res, { data: item });
});

export const categories = asyncHandler(async (_req, res) => {
  const rows = await menuService.menuCategories();
  return sendSuccess(res, { data: rows });
});

export const create = asyncHandler(async (req, res) => {
  const item = await menuService.createMenuItem(req.valid.body);
  return sendCreated(res, { message: "Dish added to the menu.", data: item });
});

export const update = asyncHandler(async (req, res) => {
  const item = await menuService.updateMenuItem(req.valid.params.id, req.valid.body);
  return sendSuccess(res, { message: "Dish updated.", data: item });
});

export const remove = asyncHandler(async (req, res) => {
  await menuService.deleteMenuItem(req.valid.params.id);
  return sendSuccess(res, { message: "Dish removed from the menu.", data: null });
});

export const setAvailability = asyncHandler(async (req, res) => {
  const item = await menuService.setAvailability(req.valid.params.id, req.valid.body.isAvailable);
  return sendSuccess(res, {
    message: item.isAvailable ? "Dish is available." : "Dish marked unavailable.",
    data: item,
  });
});
