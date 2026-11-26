import ApiError from "../utils/ApiError.js";

const FORBIDDEN_KEYS = new Set(["__proto__", "constructor", "prototype"]);

function inspect(value, path, depth = 0) {
  if (depth > 8 || value === null || typeof value !== "object") return;

  if (Array.isArray(value)) {
    value.forEach((entry, index) => inspect(entry, `${path}[${index}]`, depth + 1));
    return;
  }

  for (const key of Object.keys(value)) {
    if (FORBIDDEN_KEYS.has(key)) {
      throw ApiError.badRequest("Request contains a forbidden property.", { field: `${path}.${key}` });
    }
    // Mongo operators ($gt, $where, ...) and dotted paths ($set fields) are
    // never legitimate input for this API.
    if (key.startsWith("$") || key.includes(".")) {
      throw ApiError.badRequest("Request contains an unsupported property.", { field: `${path}.${key}` });
    }
    inspect(value[key], `${path}.${key}`, depth + 1);
  }
}

/**
 * Rejects payloads carrying Mongo operators or prototype keys instead of
 * silently stripping them, so clients get a clear error. Combined with
 * mongoose's `sanitizeFilter`, this closes the classic injection paths.
 */
export function sanitizeRequest(req, _res, next) {
  try {
    inspect(req.body, "body");
    inspect(req.query, "query");
    inspect(req.params, "params");
    next();
  } catch (error) {
    next(error);
  }
}

export default sanitizeRequest;
