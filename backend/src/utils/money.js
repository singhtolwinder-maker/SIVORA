/**
 * Money is stored and transported in integer cents to avoid float drift.
 * Prices are always recalculated from database values — never trusted from
 * the browser.
 */
export function toCents(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.round(number * 100);
}

export function fromCents(cents) {
  return Math.round(cents) / 100;
}

/** Tax is rounded half-up to the nearest cent. */
export function calculateTax(subtotalCents, rate) {
  return Math.round(subtotalCents * rate);
}

export function sumLines(lines) {
  return lines.reduce((total, line) => total + line.unitPriceCents * line.quantity, 0);
}

export function formatUsd(cents) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}
