/**
 * Every expected failure in the API is an ApiError. The error middleware turns
 * these into the public error envelope; anything else becomes a 500.
 */
export class ApiError extends Error {
  constructor(statusCode, message, { code, details, cause } = {}) {
    super(message, cause ? { cause } : undefined);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code || defaultCode(statusCode);
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace?.(this, ApiError);
  }

  static badRequest(message = "Invalid request.", details) {
    return new ApiError(400, message, { code: "BAD_REQUEST", details });
  }

  static unauthorized(message = "You are not signed in.", code = "UNAUTHORIZED") {
    return new ApiError(401, message, { code });
  }

  static forbidden(message = "You do not have access to this resource.", code = "FORBIDDEN") {
    return new ApiError(403, message, { code });
  }

  static notFound(message = "Resource not found.", code = "NOT_FOUND") {
    return new ApiError(404, message, { code });
  }

  static conflict(message = "That conflicts with an existing record.", code = "CONFLICT", details) {
    return new ApiError(409, message, { code, details });
  }

  static unprocessable(message = "Validation failed.", details) {
    return new ApiError(422, message, { code: "VALIDATION_ERROR", details });
  }

  static tooMany(message = "Too many requests. Please slow down.") {
    return new ApiError(429, message, { code: "RATE_LIMITED" });
  }

  static serviceUnavailable(message = "Service temporarily unavailable.", code = "SERVICE_UNAVAILABLE") {
    return new ApiError(503, message, { code });
  }
}

function defaultCode(statusCode) {
  return (
    {
      400: "BAD_REQUEST",
      401: "UNAUTHORIZED",
      403: "FORBIDDEN",
      404: "NOT_FOUND",
      409: "CONFLICT",
      422: "VALIDATION_ERROR",
      429: "RATE_LIMITED",
    }[statusCode] || "INTERNAL_ERROR"
  );
}

export default ApiError;
