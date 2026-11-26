import "dotenv/config";
import { z } from "zod";

const isProduction = process.env.NODE_ENV === "production";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  // 0 asks the OS for a free port (useful in tests and containers).
  PORT: z.preprocess(
    (value) => (value === undefined || value === "" ? 4000 : value),
    z.coerce.number().int().min(0).max(65535),
  ),
  API_PREFIX: z.string().startsWith("/").default("/api"),

  MONGODB_URI: z.string().min(1).default("mongodb://127.0.0.1:27017/savora"),

  CLIENT_ORIGINS: z
    .string()
    .default("http://localhost:5173,http://127.0.0.1:5173")
    .transform((value) =>
      value
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
    )
    .refine((origins) => !origins.includes("*"), {
      message: "wildcard origins are not allowed; use explicit origin URLs",
    }),

  JWT_ACCESS_SECRET: z.string().optional(),
  JWT_REFRESH_SECRET: z.string().optional(),
  JWT_ACCESS_TTL: z.string().default("15m"),
  JWT_REFRESH_TTL_DAYS: z.coerce.number().int().min(1).max(365).default(30),

  COOKIE_DOMAIN: z.string().optional(),
  COOKIE_SECURE: z
    .string()
    .optional()
    .transform((value) => value === "true"),

  RESTAURANT_TIMEZONE: z.string().default("America/New_York"),
  TAX_RATE: z.coerce.number().min(0).max(0.5).default(0.08875),
  DELIVERY_FEE_CENTS: z.coerce.number().int().min(0).default(499),
  FREE_DELIVERY_THRESHOLD_CENTS: z.coerce.number().int().min(0).default(7500),

  RESERVATION_SLOT_CAPACITY: z.coerce.number().int().min(1).max(500).default(24),
  RESERVATION_MAX_PARTY: z.coerce.number().int().min(1).max(50).default(12),
  RESERVATION_LEAD_DAYS: z.coerce.number().int().min(1).max(365).default(90),

  APP_URL: z.string().default("http://localhost:5173"),

  STRIPE_SECRET_KEY: z.string().optional().default(""),
  STRIPE_WEBHOOK_SECRET: z.string().optional().default(""),

  SEED_ADMIN_EMAIL: z.string().optional().default("admin@savora.com"),
  // Intentionally blank: the seed script refuses to create an administrator in
  // production without an explicit value, instead of shipping a known password.
  SEED_ADMIN_PASSWORD: z.string().optional().default(""),
  SEED_ADMIN_NAME: z.string().optional().default("Savora Admin"),

  IP_HASH_SALT: z.string().optional().default("savora-dev-salt"),

  LOG_LEVEL: z.enum(["dev", "combined", "common", "short", "tiny"]).optional(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `  • ${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("\n");
  throw new Error(`Invalid environment configuration:\n${details}`);
}

const env = parsed.data;

// Development convenience: deterministic-but-warned secrets so `npm run dev`
// works on a fresh clone. Production refuses to boot without real ones.
const DEV_ACCESS_SECRET = "dev-only-access-secret-do-not-use-in-production-0001";
const DEV_REFRESH_SECRET = "dev-only-refresh-secret-do-not-use-in-production-0002";

const warnings = [];

if (!env.JWT_ACCESS_SECRET || !env.JWT_REFRESH_SECRET) {
  if (isProduction) {
    throw new Error("JWT_ACCESS_SECRET and JWT_REFRESH_SECRET are required in production.");
  }
  warnings.push("JWT secrets are not set — using insecure development defaults.");
  env.JWT_ACCESS_SECRET ||= DEV_ACCESS_SECRET;
  env.JWT_REFRESH_SECRET ||= DEV_REFRESH_SECRET;
}

if (env.JWT_ACCESS_SECRET.length < 32 || env.JWT_REFRESH_SECRET.length < 32) {
  if (isProduction) throw new Error("JWT secrets must be at least 32 characters long.");
  warnings.push("JWT secrets are shorter than 32 characters.");
}

if (env.JWT_ACCESS_SECRET === env.JWT_REFRESH_SECRET) {
  if (isProduction) throw new Error("JWT access and refresh secrets must differ.");
  warnings.push("JWT access and refresh secrets are identical.");
}

if (isProduction && env.COOKIE_SECURE === false) {
  warnings.push("COOKIE_SECURE=false ignored in production; cookies will be Secure.");
}

if (isProduction && env.MONGODB_URI.includes("127.0.0.1")) {
  warnings.push("MONGODB_URI points at localhost in production.");
}

if (isProduction && env.IP_HASH_SALT === "savora-dev-salt") {
  warnings.push("IP_HASH_SALT is the public development default; set a private salt.");
}

export const config = Object.freeze({
  ...env,
  isProduction,
  isTest: env.NODE_ENV === "test",
  isDevelopment: env.NODE_ENV === "development",
  cookieSecure: isProduction || env.COOKIE_SECURE,
  paymentsEnabled: Boolean(env.STRIPE_SECRET_KEY),
  warnings,
  accessCookieName: "savora_at",
  refreshCookieName: "savora_rt",
});

export default config;
