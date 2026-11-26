import * as adminService from "../services/adminService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { buildMeta, sendSuccess } from "../utils/apiResponse.js";
import { readPagination } from "../utils/pagination.js";

export const stats = asyncHandler(async (_req, res) => {
  const data = await adminService.getDashboardStats();
  return sendSuccess(res, { data });
});

export const customers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = readPagination(req.valid.query, { defaultLimit: 20 });
  const result = await adminService.listCustomers({ ...req.valid.query, page, limit, skip });

  return sendSuccess(res, {
    data: result.items,
    meta: buildMeta({ page, limit, total: result.total }),
  });
});

export const setCustomerActive = asyncHandler(async (req, res) => {
  const customer = await adminService.setCustomerActive(
    req.valid.params.id,
    req.valid.body.isActive,
  );
  return sendSuccess(res, {
    message: customer.isActive ? "Customer reactivated." : "Customer deactivated.",
    data: customer,
  });
});
