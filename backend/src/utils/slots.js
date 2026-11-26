import config from "../config/env.js";

const SLOT_START_HOUR = 17;
const SLOT_END_HOUR = 22;
const SLOT_STEP_MINUTES = 30;

export function buildSlotTimes() {
  const slots = [];
  for (let minutes = SLOT_START_HOUR * 60; minutes < SLOT_END_HOUR * 60; minutes += SLOT_STEP_MINUTES) {
    const hour = String(Math.floor(minutes / 60)).padStart(2, "0");
    const minute = String(minutes % 60).padStart(2, "0");
    slots.push(`${hour}:${minute}`);
  }
  return slots;
}

export const SERVICE_SLOTS = Object.freeze(buildSlotTimes());

/** Monday is the only closed day (0 = Sunday in getUTCDay). */
export function isClosedDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay() === 1;
}

export function normalizePartySize(value) {
  return Math.min(Math.max(Number(value) || 1, 1), config.RESERVATION_MAX_PARTY);
}

export function slotKey(dateString, timeString) {
  return `${dateString}_${timeString}`;
}
