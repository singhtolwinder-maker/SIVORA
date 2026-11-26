import config from "../config/env.js";
import ContactMessage from "../models/ContactMessage.js";
import ApiError from "../utils/ApiError.js";
import { sha256 } from "../utils/ids.js";
import { escapeRegex } from "../utils/pagination.js";

export async function createMessage(payload, context = {}) {
  const message = await ContactMessage.create({
    name: payload.name,
    email: payload.email,
    phone: payload.phone || "",
    subject: payload.subject,
    message: payload.message,
    userAgent: (context.userAgent || "").slice(0, 300),
    ipHash: context.ip ? sha256(`${context.ip}:${config.IP_HASH_SALT}`) : undefined,
  });

  return message;
}

export function buildMessageFilter({ status, search }) {
  const filter = {};
  if (status) filter.status = status;
  if (search) {
    const pattern = new RegExp(escapeRegex(search), "i");
    filter.$or = [{ name: pattern }, { email: pattern }, { subject: pattern }, { message: pattern }];
  }
  return filter;
}

export async function listMessages(query) {
  const { page, limit, skip } = query;
  const filter = buildMessageFilter(query);

  const [items, total, unread] = await Promise.all([
    ContactMessage.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    ContactMessage.countDocuments(filter),
    ContactMessage.countDocuments({ status: "new" }),
  ]);

  return { items, total, page, limit, unread };
}

export async function getMessage(id) {
  const message = await ContactMessage.findById(id).select("+ipHash");
  if (!message) throw ApiError.notFound("Message not found.", "MESSAGE_NOT_FOUND");
  return message;
}

export async function updateMessage(id, payload) {
  const message = await ContactMessage.findById(id);
  if (!message) throw ApiError.notFound("Message not found.", "MESSAGE_NOT_FOUND");

  if (payload.status) {
    message.status = payload.status;
    if (payload.status === "read" && !message.readAt) message.readAt = new Date();
    if (payload.status === "replied" && !message.repliedAt) message.repliedAt = new Date();
  }
  if (payload.adminNote !== undefined) message.adminNote = payload.adminNote;

  await message.save();
  return message;
}

export async function deleteMessage(id) {
  const deleted = await ContactMessage.findByIdAndDelete(id);
  if (!deleted) throw ApiError.notFound("Message not found.", "MESSAGE_NOT_FOUND");
  return deleted;
}

export default { createMessage, listMessages, getMessage, updateMessage, deleteMessage };
