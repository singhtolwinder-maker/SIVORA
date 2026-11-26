import crypto from "node:crypto";

export function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("hex");
}

export function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

/** Short, human-readable codes for reservations (e.g. SV-R4K2M9). */
export function publicCode(prefix = "SV") {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  const bytes = crypto.randomBytes(6);
  for (const byte of bytes) code += alphabet[byte % alphabet.length];
  return `${prefix}-${code}`;
}

export function orderNumber(date = new Date()) {
  const stamp = date.toISOString().slice(0, 10).replaceAll("-", "");
  const suffix = crypto.randomInt(1000, 9999);
  return `SAV-${stamp}-${suffix}`;
}
