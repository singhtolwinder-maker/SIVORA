import ApiError from "./ApiError.js";

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 100;

export function readPagination(query = {}, { defaultLimit = DEFAULT_LIMIT } = {}) {
  const page = Math.max(1, Number.parseInt(query.page ?? "1", 10) || 1);
  const requested = Number.parseInt(query.limit ?? String(defaultLimit), 10) || defaultLimit;
  const limit = Math.min(Math.max(requested, 1), MAX_LIMIT);
  return { page, limit, skip: (page - 1) * limit };
}

/** Mongo ObjectId shaped check used before querying by :id. */
export function assertObjectId(value, label = "id") {
  if (!/^[a-f\d]{24}$/i.test(String(value))) {
    throw ApiError.badRequest(`Invalid ${label}.`, { field: label });
  }
  return value;
}

export function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
