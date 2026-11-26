/**
 * Loaded via `node --import ./tests/env.js` so configuration is in place before
 * any application module is evaluated.
 */
process.env.NODE_ENV = "test";
process.env.JWT_ACCESS_SECRET = "test-access-secret-0123456789abcdef0123456789";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret-0123456789abcdef0123456789";
process.env.RESERVATION_SLOT_CAPACITY = "24";
process.env.TAX_RATE = "0.08875";
process.env.DELIVERY_FEE_CENTS = "499";
process.env.STRIPE_SECRET_KEY = "";
process.env.STRIPE_WEBHOOK_SECRET = "";
