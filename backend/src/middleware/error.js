import config from "../config/env.js";
import ApiError from "../utils/ApiError.js";

export function notFoundHandler(req, _res, next) {
  next(ApiError.notFound(`No route matches ${req.method} ${req.originalUrl}.`, "ROUTE_NOT_FOUND"));
}

function normalize(error) {
  if (error instanceof ApiError) return error;

  if (error?.name === "ZodError") {
    return ApiError.unprocessable(
      "Please check the highlighted fields.",
      error.issues.map((issue) => ({ field: issue.path.join("."), message: issue.message })),
    );
  }

  if (error?.name === "CastError") {
    return ApiError.badRequest(`Invalid value for ${error.path}.`);
  }

  if (error?.name === "ValidationError") {
    return ApiError.unprocessable(
      "Please check the highlighted fields.",
      Object.values(error.errors).map((entry) => ({ field: entry.path, message: entry.message })),
    );
  }

  if (error?.code === 11000) {
    const field = Object.keys(error.keyValue || error.keyPattern || {})[0] || "value";
    return ApiError.conflict(`That ${field} is already in use.`, "DUPLICATE_KEY", { field });
  }

  if (error?.type === "entity.parse.failed") {
    return ApiError.badRequest("Request body must be valid JSON.");
  }

  return error;
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(error, req, res, _next) {
  const normalized = normalize(error);
  const statusCode = normalized.statusCode && normalized.statusCode >= 400 ? normalized.statusCode : 500;
  const isServerError = statusCode >= 500;

  if (isServerError) {
    console.error(`[error] ${req.method} ${req.originalUrl} (${req.id}):`, error);
  }

  // Intentional 5xx responses (e.g. payments disabled) keep their code and
  // message; unexpected ones are masked in production.
  const unexpected = isServerError && !normalized.isOperational;
  const body = {
    success: false,
    error: {
      code: unexpected ? "INTERNAL_ERROR" : normalized.code,
      message:
        unexpected && config.isProduction
          ? "Something went wrong on our side. Please try again."
          : normalized.message || "Unexpected error.",
    },
    requestId: req.id,
  };

  if (!isServerError && normalized.details) body.error.details = normalized.details;

  if (unexpected && !config.isProduction && error?.stack) body.error.stack = error.stack;

  res.status(statusCode).json(body);
}

export default errorHandler;
