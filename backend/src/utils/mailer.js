import config from "../config/env.js";

/**
 * Outbound mail. This project ships with a console transport so local
 * development and tests never depend on an SMTP account. Wire a real provider
 * (Resend, SES, Postmark, SMTP) by replacing `deliver` — the call sites only
 * need a recipient, subject and text.
 */
async function deliver({ to, subject, text }) {
  if (config.isProduction && !config.SMTP_URL) {
    // Never pretend an email was sent in production.
    throw new Error("No mail transport configured (set SMTP_URL and implement utils/mailer.js).");
  }
  if (config.isTest) return;
  console.info(`[mail] to=${to} subject="${subject}"`);
  if (!config.isProduction) console.info(text);
}

export async function sendPasswordResetEmail({ user, token }) {
  const url = `${config.APP_URL.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(token)}`;
  const text = [
    `Hello ${user.name},`,
    "",
    "We received a request to reset your SAVORA password. The link below is valid for 30 minutes:",
    url,
    "",
    "If you did not ask for this, you can ignore this email — your password stays unchanged.",
  ].join("\n");

  await deliver({ to: user.email, subject: "Reset your SAVORA password", text });
  return url;
}

export async function sendReservationConfirmation({ reservation }) {
  const text = [
    `Hello ${reservation.guest.name},`,
    "",
    `Your table request is in: ${reservation.date} at ${reservation.time} for ${reservation.partySize} guest(s).`,
    `Reference: ${reservation.reservationCode}`,
    "",
    "We confirm every booking by email during service hours. Reply to this message for changes.",
  ].join("\n");

  try {
    await deliver({ to: reservation.guest.email, subject: `SAVORA reservation ${reservation.reservationCode}`, text });
  } catch (error) {
    // Booking must not fail because mail is unavailable; log for follow-up.
    console.warn(`[mail] reservation confirmation failed: ${error.message}`);
  }
}

export default { sendPasswordResetEmail, sendReservationConfirmation };
