import { ZodError } from "zod";
import ApiError from "../utils/ApiError.js";

function formatIssues(error) {
  return error.issues.map((issue) => ({
    field: issue.path.join(".") || "(root)",
    message: issue.message,
    code: issue.code,
  }));
}

/**
 * Validates and coerces request data. Parsed values are exposed on
 * `req.valid.{body,query,params}` — Express 5 makes req.query read-only, so we
 * never mutate it.
 */
export function validate({ body, query, params } = {}) {
  return (req, _res, next) => {
    const valid = { body: req.body ?? {}, query: req.query ?? {}, params: req.params ?? {} };

    try {
      if (body) valid.body = body.parse(req.body ?? {});
      if (query) valid.query = query.parse(req.query ?? {});
      if (params) valid.params = params.parse(req.params ?? {});
    } catch (error) {
      if (error instanceof ZodError) {
        return next(ApiError.unprocessable("Please check the highlighted fields.", formatIssues(error)));
      }
      return next(error);
    }

    req.valid = valid;
    return next();
  };
}

export default validate;
