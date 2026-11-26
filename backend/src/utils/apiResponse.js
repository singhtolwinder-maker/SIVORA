/**
 * Consistent response envelope:
 *   success: { success: true, message, data, meta? }
 *   failure: { success: false, error: { code, message, details? }, requestId }
 */
export function sendSuccess(res, { status = 200, message, data = null, meta } = {}) {
  const body = { success: true };
  if (message) body.message = message;
  body.data = data;
  if (meta) body.meta = meta;
  return res.status(status).json(body);
}

export function sendCreated(res, payload = {}) {
  return sendSuccess(res, { status: 201, ...payload });
}

export function sendNoContent(res) {
  return res.status(204).end();
}

export function buildMeta({ page, limit, total }) {
  const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}
