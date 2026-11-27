import { sendSuccess } from "../utils/apiResponse.js";

const MAX_STACK_LINES = 12;

function trimStack(stack) {
  if (!stack) return undefined;
  return stack.split("\n").slice(0, MAX_STACK_LINES).join("\n");
}

/**
 * Accepts a render-error report from the storefront's error boundary.
 *
 * It is logged as one structured line so Render's log stream shows the message,
 * the route and the top of the stack next to the request id. Nothing is stored:
 * the endpoint exists so a crash is visible to the operator instead of living
 * only in the visitor's console, and it adds no collection or write path that
 * could become a data-retention problem.
 */
export function reportClientError(req, res) {
  const report = req.valid.body;

  console.warn(
    `[client-error] ${JSON.stringify({
      at: new Date().toISOString(),
      requestId: req.id,
      route: report.route,
      source: report.source,
      message: report.message,
      stack: trimStack(report.stack),
      componentStack: trimStack(report.componentStack),
    })}`,
  );

  return sendSuccess(res, { status: 202, message: "Report received.", data: null });
}

export default { reportClientError };
