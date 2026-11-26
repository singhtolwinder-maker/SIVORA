import config from "../config/env.js";

/**
 * Converts a restaurant-local wall-clock date and time into a real UTC instant.
 * `Date` has no timezone database, so we ask Intl what offset the zone had at
 * that moment and correct for it (handles DST transitions).
 */
export function zonedToUtc(dateString, timeString, timeZone = config.RESTAURANT_TIMEZONE) {
  const [year, month, day] = dateString.split("-").map(Number);
  const [hour, minute] = timeString.split(":").map(Number);

  const guess = Date.UTC(year, month - 1, day, hour, minute);
  const firstOffset = offsetAt(guess, timeZone);
  let timestamp = guess - firstOffset;
  // Re-check after the first correction: the offset may differ across a DST edge.
  const secondOffset = offsetAt(timestamp, timeZone);
  if (secondOffset !== firstOffset) timestamp = guess - secondOffset;
  return new Date(timestamp);
}

function offsetAt(timestamp, timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(timestamp));

  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const asUtc = Date.UTC(
    Number(lookup.year),
    Number(lookup.month) - 1,
    Number(lookup.day),
    Number(lookup.hour) % 24,
    Number(lookup.minute),
    Number(lookup.second),
  );
  return asUtc - timestamp;
}

/** Restaurant-local calendar date string for "today". */
export function todayInZone(timeZone = config.RESTAURANT_TIMEZONE) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${lookup.year}-${lookup.month}-${lookup.day}`;
}

export function addDays(dateString, days) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

export function formatSlotLabel(dateString, timeString) {
  const date = zonedToUtc(dateString, timeString);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: config.RESTAURANT_TIMEZONE,
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date);
}
