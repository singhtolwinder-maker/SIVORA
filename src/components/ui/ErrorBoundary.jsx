import { Component } from "react";
import { api } from "../../lib/api";

/**
 * Root error boundary.
 *
 * Until now a render error blanked the page and left nothing behind: the
 * visitor saw an empty black screen and the operator only found out when a
 * customer called. This catches the error, sends one compact report to
 * `POST /api/client-errors` (which writes it to the API log) and shows a
 * branded recovery screen instead of a blank page.
 *
 * Reporting is best-effort and never throws: if the network is the problem, the
 * visitor still gets a working Reload button.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // React can invoke this more than once for a single failure (StrictMode
    // double-invokes in development), and a crash loop would otherwise flood
    // the rate-limited endpoint with duplicates.
    if (this.reported) return;
    this.reported = true;

    const route = `${window.location.pathname}${window.location.hash}`;

    console.error("[savora] unhandled render error", error, info?.componentStack);

    api
      .reportClientError({
        message: String(error?.message ?? error).slice(0, 480),
        stack: typeof error?.stack === "string" ? error.stack.slice(0, 3900) : undefined,
        componentStack: info?.componentStack?.slice(0, 3900),
        route,
        source: "storefront",
      })
      .catch(() => {
        // Diagnostics must never turn a recoverable error into a second one.
      });
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div
        role="alert"
        className="flex min-h-screen flex-col items-center justify-center bg-ink px-6 py-16 text-center"
      >
        <span className="inline-flex size-11 items-center justify-center rounded-full border border-gold/40 font-serif text-lg text-gold-light">
          S
        </span>
        <h1 className="mt-6 font-serif text-3xl font-light text-cream sm:text-4xl">
          This page did not finish loading
        </h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-sand/80">
          Something interrupted the page. Your account, order and reservation are safe — this is
          only the screen. Reload to continue.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
          <button type="button" onClick={() => window.location.reload()} className="btn-gold">
            Reload the page
          </button>
          <a href="/" className="btn-ghost">
            Back to the restaurant
          </a>
        </div>
        <p className="mt-8 max-w-md break-words text-[10px] uppercase tracking-[0.22em] text-sand/40">
          Reference: {String(error?.message ?? "unknown error").slice(0, 120)}
        </p>
      </div>
    );
  }
}

export default ErrorBoundary;
