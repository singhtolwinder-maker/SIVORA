import * as contactService from "../services/contactService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { buildMeta, sendCreated, sendSuccess } from "../utils/apiResponse.js";
import { readPagination } from "../utils/pagination.js";

export const create = asyncHandler(async (req, res) => {
  const message = await contactService.createMessage(req.valid.body, {
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });

  return sendCreated(res, {
    message: "Message received. Our team replies within one business day.",
    data: { id: message._id, createdAt: message.createdAt },
  });
});

export const list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = readPagination(req.valid.query, { defaultLimit: 20 });
  const result = await contactService.listMessages({ ...req.valid.query, page, limit, skip });

  return sendSuccess(res, {
    data: result.items,
    meta: { ...buildMeta({ page, limit, total: result.total }), unread: result.unread },
  });
});

export const detail = asyncHandler(async (req, res) => {
  const message = await contactService.getMessage(req.valid.params.id);
  return sendSuccess(res, { data: message });
});

export const update = asyncHandler(async (req, res) => {
  const message = await contactService.updateMessage(req.valid.params.id, req.valid.body);
  return sendSuccess(res, { message: "Message updated.", data: message });
});

export const remove = asyncHandler(async (req, res) => {
  await contactService.deleteMessage(req.valid.params.id);
  return sendSuccess(res, { message: "Message deleted.", data: null });
});
