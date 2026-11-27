/**
 * SAVORA — live HTTP audit.
 *
 * Boots the real server (`node src/server.js`) against a throwaway database
 * (`savora_audit_<timestamp>`) on the real local MongoDB instance, then drives
 * every feature over HTTP with a cookie jar, exactly like a browser.
 *
 * The `savora` production database is never touched, and the throwaway
 * database is dropped at the end.
 *
 *   node audit/live-audit.mjs
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const PORT = Number(process.env.AUDIT_PORT || 4100);
const DB_NAME = `savora_audit_${Date.now()}`;
const MONGO_URI = `mongodb://127.0.0.1:27017/${DB_NAME}`;
const BASE = `http://127.0.0.1:${PORT}`;
const ACCESS_SECRET = "audit-access-secret-0123456789abcdef0123456789";
const REFRESH_SECRET = "audit-refresh-secret-0123456789abcdef0123456789";
const LOG = path.join(ROOT, "audit", "server.log");

const results = [];
let failures = 0;

function record(area, name, status, detail) {
  const ok = status === "PASS";
  if (!ok) failures += 1;
  results.push({ area, name, status, detail: detail ?? "" });
  const mark = ok ? "  PASS" : "  FAIL";
  console.log(`${mark}  [${area}] ${name}${detail ? ` — ${detail}` : ""}`);
}

function check(area, name, condition, detail) {
  record(area, name, condition ? "PASS" : "FAIL", condition ? detail : `expected pass: ${detail}`);
}

/* ------------------------------------------------------------------ cookies */
class Jar {
  constructor() {
    this.cookies = new Map();
  }

  header() {
    return [...this.cookies.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
  }

  absorb(response) {
    const raw = response.headers.getSetCookie?.() ?? [];
    for (const cookie of raw) {
      const [pair] = cookie.split(";");
      const index = pair.indexOf("=");
      const name = pair.slice(0, index).trim();
      const value = pair.slice(index + 1).trim();
      if (value === "" || /Expires=Thu, 01 Jan 1970/i.test(cookie)) this.cookies.delete(name);
      else this.cookies.set(name, value);
    }
  }

  get(name) {
    return this.cookies.get(name);
  }
}

let requestId = 0;

async function call(jar, method, urlPath, { body, headers = {}, raw } = {}) {
  const hdrs = { ...headers };
  const cookie = jar?.header();
  if (cookie) hdrs.cookie = cookie;

  let payload;
  if (raw !== undefined) {
    payload = raw;
    hdrs["content-type"] = hdrs["content-type"] ?? "application/json";
  } else if (body !== undefined) {
    payload = JSON.stringify(body);
    hdrs["content-type"] = "application/json";
  }

  const response = await fetch(`${BASE}${urlPath}`, { method, headers: hdrs, body: payload });
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  jar?.absorb(response);
  requestId += 1;
  return { status: response.status, headers: response.headers, body: json, text, seq: requestId };
}

function datePlus(days) {
  const now = new Date();
  const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + days));
  return date.toISOString().slice(0, 10);
}

function nextOpenDate(offset = 1) {
  for (let step = 0; step < 10; step += 1) {
    const date = datePlus(offset + step);
    const [year, month, day] = date.split("-").map(Number);
    if (new Date(Date.UTC(year, month - 1, day)).getUTCDay() !== 1) return date;
  }
  throw new Error("no open date found");
}

function nextMonday() {
  for (let step = 1; step < 10; step += 1) {
    const date = datePlus(step);
    const [year, month, day] = date.split("-").map(Number);
    if (new Date(Date.UTC(year, month - 1, day)).getUTCDay() === 1) return date;
  }
  throw new Error("no Monday found");
}

const PASSWORD = "Savora!2026";
const digits = (index) => String(1000 + index);

/* --------------------------------------------------------------- bootstrap */
async function waitForHealth(timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  let lastError = "no attempt";
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${BASE}/api/health`);
      if (response.ok) return await response.json();
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error.message;
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error(`server never became healthy (${lastError})`);
}

async function createAdmin(email) {
  const passwordHash = await bcrypt.hash(PASSWORD, 12);
  await mongoose.connection.db.collection("users").insertOne({
    name: "Audit Admin",
    email,
    passwordHash,
    phone: "",
    role: "admin",
    defaultAddress: { line1: "", city: "", state: "", zip: "", instructions: "" },
    isActive: true,
    refreshTokens: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    __v: 0,
  });
}

let server = null;
let logStream = null;

/** True when something already answers on the audit port (stale run). */
async function portBusy() {
  try {
    await fetch(`${BASE}/api/health`, { signal: AbortSignal.timeout(800) });
    return true;
  } catch {
    return false;
  }
}

/* -------------------------------------------------------------------- main */
async function main() {
  if (await portBusy()) {
    throw new Error(`Port ${PORT} is already serving — stop that process before auditing.`);
  }

  logStream = fs.createWriteStream(LOG, { flags: "w" });
  // Spawn the real interpreter directly (no shell wrapper) so the audit can
  // stop exactly the process it started.
  server = spawn(process.execPath, ["src/server.js"], {
    cwd: ROOT,
    env: {
      ...process.env,
      NODE_ENV: "development",
      PORT: String(PORT),
      MONGODB_URI: MONGO_URI,
      JWT_ACCESS_SECRET: ACCESS_SECRET,
      JWT_REFRESH_SECRET: REFRESH_SECRET,
      CLIENT_ORIGINS: "http://localhost:5173",
      RESERVATION_SLOT_CAPACITY: "24",
      RESERVATION_MAX_PARTY: "12",
      STRIPE_SECRET_KEY: "",
      STRIPE_WEBHOOK_SECRET: "",
      SEED_ADMIN_EMAIL: "admin@savora.audit",
      SEED_ADMIN_PASSWORD: PASSWORD,
      LOG_LEVEL: "tiny",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  server.stdout.pipe(logStream);
  server.stderr.pipe(logStream);

  let health;
  try {
    health = await waitForHealth();
  } catch (error) {
    console.error("Boot failed:", error.message);
    console.error(fs.readFileSync(LOG, "utf8").slice(-3000));
    server.kill();
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
  await createAdmin("admin@savora.audit");

  check("infra", "health endpoint reports a connected database", health.data?.status === "ok", `db=${health.data?.database}`);
  check("infra", "target database is the throwaway audit DB", mongoose.connection.name === DB_NAME, mongoose.connection.name);

  const guest = new Jar();
  const other = new Jar();
  const admin = new Jar();
  const guestEmail = `guest.${Date.now()}@savora.audit`;
  const otherEmail = `other.${Date.now()}@savora.audit`;

  /* ------------------------------------------------------------- infra */
  const root = await call(null, "GET", "/");
  check("infra", "GET / returns the service banner", root.status === 200 && root.body?.name === "SAVORA API", `HTTP ${root.status}`);

  const missing = await call(null, "GET", "/api/does-not-exist");
  check(
    "infra",
    "unknown route returns the 404 envelope",
    missing.status === 404 && missing.body?.error?.code === "ROUTE_NOT_FOUND" && Boolean(missing.body?.requestId),
    `HTTP ${missing.status}`,
  );

  const badJson = await call(null, "POST", "/api/auth/login", { raw: '{"email":' });
  check("infra", "malformed JSON is rejected with 400", badJson.status === 400 && badJson.body?.error?.code === "BAD_REQUEST", `HTTP ${badJson.status}`);

  const headers = await call(null, "GET", "/api/health");
  check(
    "infra",
    "security headers present (helmet)",
    headers.headers.get("x-content-type-options") === "nosniff" && headers.headers.get("x-frame-options") !== null,
    `x-frame-options=${headers.headers.get("x-frame-options")}`,
  );
  check("infra", "no X-Powered-By header", headers.headers.get("x-powered-by") === null, "header absent");
  check("infra", "rate limit headers present", headers.headers.get("ratelimit") !== null, headers.headers.get("ratelimit") ?? "missing");

  /* -------------------------------------------------------------- auth */
  const weak = await call(guest, "POST", "/api/auth/register", {
    body: { name: "Weak Pass", email: "weak@savora.audit", password: "password" },
  });
  check(
    "auth",
    "weak password rejected with field details",
    weak.status === 422 && weak.body?.error?.details?.some((d) => d.field === "password"),
    `HTTP ${weak.status}`,
  );

  const registered = await call(guest, "POST", "/api/auth/register", {
    body: { name: "Audit Guest", email: guestEmail, password: PASSWORD },
  });
  const setCookies = registered.headers.getSetCookie?.() ?? [];
  check("auth", "customer registration returns 201", registered.status === 201, `HTTP ${registered.status}`);
  check("auth", "registration response omits the password hash", registered.body?.data?.user?.passwordHash === undefined, "no passwordHash");
  check(
    "auth",
    "access cookie is httpOnly",
    setCookies.some((c) => c.startsWith("savora_at=") && /HttpOnly/i.test(c)),
    setCookies.map((c) => c.split(";")[0].split("=")[0]).join(","),
  );
  check("auth", "refresh cookie is scoped to /api/auth", setCookies.some((c) => c.startsWith("savora_rt=") && /Path=\/api\/auth/i.test(c)), "path=/api/auth");

  const stored = await mongoose.connection.db.collection("users").findOne({ email: guestEmail });
  check(
    "auth",
    "password stored as a bcrypt hash",
    /^\$2[aby]\$/.test(stored?.passwordHash ?? "") && stored.passwordHash !== PASSWORD,
    stored?.passwordHash?.slice(0, 7),
  );

  const dup = await call(other, "POST", "/api/auth/register", {
    body: { name: "Duplicate", email: guestEmail, password: PASSWORD },
  });
  check("auth", "duplicate email blocked with 409", dup.status === 409 && dup.body?.error?.code === "EMAIL_IN_USE", `HTTP ${dup.status}`);

  const wrongPass = await call(new Jar(), "POST", "/api/auth/login", { body: { email: guestEmail, password: "Nope!2026x" } });
  const ghost = await call(new Jar(), "POST", "/api/auth/login", { body: { email: "ghost@savora.audit", password: "Nope!2026x" } });
  check(
    "auth",
    "bad credentials return 401 with an identical message",
    wrongPass.status === 401 && ghost.status === 401 && wrongPass.body?.error?.message === ghost.body?.error?.message,
    `HTTP ${wrongPass.status}/${ghost.status}`,
  );

  const otherReg = await call(other, "POST", "/api/auth/register", {
    body: { name: "Audit Other", email: otherEmail, password: PASSWORD },
  });
  check("auth", "second customer registered", otherReg.status === 201, `HTTP ${otherReg.status}`);

  const me = await call(guest, "GET", "/api/auth/me");
  check("auth", "authenticated profile via cookie", me.status === 200 && me.body?.data?.user?.email === guestEmail, `HTTP ${me.status}`);

  const bearer = guest.get("savora_at");
  const meBearer = await call(null, "GET", "/api/auth/me", { headers: { authorization: `Bearer ${bearer}` } });
  check("auth", "Bearer token accepted as well as the cookie", meBearer.status === 200, `HTTP ${meBearer.status}`);

  const invalidToken = await call(null, "GET", "/api/auth/me", { headers: { authorization: "Bearer not.a.real.token" } });
  check(
    "auth",
    "invalid token rejected with 401",
    invalidToken.status === 401 && invalidToken.body?.error?.code === "INVALID_TOKEN",
    `${invalidToken.status} ${invalidToken.body?.error?.code}`,
  );

  const expired = jwt.sign({ sub: String(stored._id), role: "customer", type: "access" }, ACCESS_SECRET, {
    expiresIn: -60,
    issuer: "savora-api",
    audience: "savora-web",
  });
  const expiredCall = await call(null, "GET", "/api/auth/me", { headers: { authorization: `Bearer ${expired}` } });
  check(
    "auth",
    "expired token rejected with TOKEN_EXPIRED",
    expiredCall.status === 401 && expiredCall.body?.error?.code === "TOKEN_EXPIRED",
    `${expiredCall.status} ${expiredCall.body?.error?.code}`,
  );

  const noAuth = await call(null, "GET", "/api/auth/me");
  check("auth", "protected route requires a session", noAuth.status === 401 && noAuth.body?.error?.code === "AUTH_REQUIRED", `HTTP ${noAuth.status}`);

  // Refresh rotation: the presented token is single-use.
  const oldRefresh = guest.get("savora_rt");
  const refreshOne = await call(guest, "POST", "/api/auth/refresh");
  const rotatedRefresh = guest.get("savora_rt");
  check("auth", "refresh issues a new session", refreshOne.status === 200, `HTTP ${refreshOne.status}`);
  check("auth", "refresh token rotates", Boolean(rotatedRefresh) && rotatedRefresh !== oldRefresh, "token changed");

  const replayJar = new Jar();
  replayJar.cookies.set("savora_rt", oldRefresh);
  const replay = await call(replayJar, "POST", "/api/auth/refresh");
  check(
    "auth",
    "replayed refresh token is rejected",
    replay.status === 401 && replay.body?.error?.code === "SESSION_REVOKED",
    `${replay.status} ${replay.body?.error?.code}`,
  );

  const profile = await call(guest, "PATCH", "/api/users/me", { body: { name: "Audit Guest Updated", phone: "(212) 555-0199" } });
  check("users", "profile update persists", profile.status === 200 && profile.body?.data?.user?.name === "Audit Guest Updated", `HTTP ${profile.status}`);

  /* --------------------------------------------------- authorization */
  const custStats = await call(guest, "GET", "/api/admin/stats");
  check("authz", "customer blocked from admin stats (403)", custStats.status === 403 && custStats.body?.error?.code === "FORBIDDEN", `HTTP ${custStats.status}`);

  const custMenu = await call(guest, "POST", "/api/menu", {
    body: { name: "Customer Dish", description: "Should never be created by a customer.", category: "Signatures", price: 10, imageUrl: "/x.jpg" },
  });
  check("authz", "customer blocked from creating dishes (403)", custMenu.status === 403, `HTTP ${custMenu.status}`);

  const anonStats = await call(null, "GET", "/api/admin/stats");
  check("authz", "signed-out admin access is 401", anonStats.status === 401, `HTTP ${anonStats.status}`);

  const adminLogin = await call(admin, "POST", "/api/auth/login", { body: { email: "admin@savora.audit", password: PASSWORD } });
  check("authz", "administrator can sign in", adminLogin.status === 200 && adminLogin.body?.data?.user?.role === "admin", `HTTP ${adminLogin.status}`);

  const adminStats = await call(admin, "GET", "/api/admin/stats");
  check("admin", "dashboard stats available to admin", adminStats.status === 200 && typeof adminStats.body?.data?.revenue?.totalCents === "number", `HTTP ${adminStats.status}`);

  const customers = await call(admin, "GET", "/api/admin/customers");
  const leaked = (customers.body?.data ?? []).some((c) => c.passwordHash !== undefined);
  check("admin", "customer list never exposes hashes", customers.status === 200 && !leaked, `HTTP ${customers.status}, rows=${customers.body?.data?.length}`);

  /* -------------------------------------------------------------- menu */
  const created = await call(admin, "POST", "/api/menu", {
    body: {
      name: "Audit Wagyu Burger",
      description: "American Wagyu, aged cheddar, caramelised onions, truffle aioli.",
      category: "Signatures",
      price: 28,
      imageUrl: "/images/dish-burger.jpg",
      ingredients: ["beef", "cheddar"],
      isAvailable: true,
    },
  });
  const dishId = created.body?.data?.id;
  check("menu", "admin creates a dish with dollar input", created.status === 201 && created.body?.data?.priceCents === 2800, `HTTP ${created.status}, ${created.body?.data?.priceCents}c`);
  check("menu", "slug generated from the name", created.body?.data?.slug === "audit-wagyu-burger", created.body?.data?.slug);

  const badDish = await call(admin, "POST", "/api/menu", { body: { name: "X", description: "too short", category: "Nope", price: -5, imageUrl: "" } });
  check("menu", "invalid dish payload rejected with 422", badDish.status === 422 && badDish.body?.error?.code === "VALIDATION_ERROR", `HTTP ${badDish.status}`);

  const secondary = await call(admin, "POST", "/api/menu", {
    body: { name: "Audit Truffle Fries", description: "Hand-cut fries, black truffle oil, parmesan and garlic aioli.", category: "Starters", price: 16, imageUrl: "/images/dish-fries.jpg" },
  });
  const friesId = secondary.body?.data?.id;
  check("menu", "second dish created", secondary.status === 201, `HTTP ${secondary.status}`);

  const unavailable = await call(admin, "POST", "/api/menu", {
    body: { name: "Audit Sold Out Special", description: "A dish that is deliberately unavailable for cart checks.", category: "Desserts", price: 12, imageUrl: "/images/x.jpg", isAvailable: false },
  });
  const soldOutId = unavailable.body?.data?.id;
  check("menu", "unavailable dish created for cart validation", unavailable.status === 201, `HTTP ${unavailable.status}`);

  const list = await call(null, "GET", "/api/menu?limit=2");
  check("menu", "public list paginates", list.status === 200 && list.body?.data?.length === 2 && list.body?.meta?.total === 3, `HTTP ${list.status}, total=${list.body?.meta?.total}`);

  const bySlug = await call(null, "GET", "/api/menu/audit-wagyu-burger");
  check("menu", "dish retrievable by slug", bySlug.status === 200 && bySlug.body?.data?.priceCents === 2800, `HTTP ${bySlug.status}`);

  const byId = await call(null, "GET", `/api/menu/${dishId}`);
  check("menu", "dish retrievable by id", byId.status === 200 && byId.body?.data?.id === dishId, `HTTP ${byId.status}`);

  const unknownDish = await call(null, "GET", "/api/menu/no-such-dish");
  check("menu", "unknown dish returns 404", unknownDish.status === 404, `HTTP ${unknownDish.status}`);

  const filtered = await call(null, "GET", "/api/menu?category=Starters&minPrice=10&maxPrice=20");
  check("menu", "category and price filters", filtered.status === 200 && filtered.body?.data?.length === 1 && filtered.body.data[0].name === "Audit Truffle Fries", `n=${filtered.body?.data?.length}`);

  const searched = await call(null, "GET", "/api/menu?search=truffle");
  const hits = searched.body?.data ?? [];
  // The seed ships real truffle dishes too, so assert relevance rather than a count.
  const allRelevant = hits.length > 0 && hits.every((item) =>
    `${item.name} ${item.description} ${(item.ingredients || []).join(" ")}`.toLowerCase().includes("truffle"),
  );
  check("menu", "search returns only matching dishes", searched.status === 200 && allRelevant, `n=${hits.length} allMatch=${allRelevant}`);

  const sorted = await call(null, "GET", "/api/menu?sort=price_asc");
  const prices = (sorted.body?.data ?? []).map((d) => d.priceCents);
  check("menu", "price sort ascending", prices.join(",") === [...prices].sort((a, b) => a - b).join(","), prices.join(","));

  const categories = await call(null, "GET", "/api/menu/categories");
  check("menu", "categories aggregate with counts", categories.status === 200 && categories.body?.data?.length >= 3, `HTTP ${categories.status}`);

  const updated = await call(admin, "PATCH", `/api/menu/${dishId}`, { body: { price: 31, isFeatured: true } });
  check("menu", "admin updates price and flags", updated.status === 200 && updated.body?.data?.priceCents === 3100 && updated.body?.data?.isFeatured === true, `HTTP ${updated.status}`);

  /* -------------------------------------------------------------- cart */
  const anonCart = await call(null, "GET", "/api/cart");
  check("cart", "cart requires authentication", anonCart.status === 401, `HTTP ${anonCart.status}`);

  const add = await call(guest, "POST", "/api/cart/items", { body: { menuItemId: dishId, quantity: 2 } });
  const totals = add.body?.data?.totals ?? {};
  check("cart", "add item returns server totals", add.status === 200 && totals.subtotalCents === 6200, `HTTP ${add.status}, subtotal=${totals.subtotalCents}`);
  check("cart", "tax computed at 8.875%", totals.taxCents === Math.round(6200 * 0.08875), `tax=${totals.taxCents}`);
  check("cart", "pickup has no delivery fee", totals.deliveryFeeCents === 0, `fee=${totals.deliveryFeeCents}`);
  check("cart", "total = subtotal + tax + fee", totals.totalCents === totals.subtotalCents + totals.taxCents + totals.deliveryFeeCents, `total=${totals.totalCents}`);

  const deliveryView = await call(guest, "GET", "/api/cart?type=delivery");
  check("cart", "delivery adds the fee below the free threshold", deliveryView.body?.data?.totals?.deliveryFeeCents === 499, `fee=${deliveryView.body?.data?.totals?.deliveryFeeCents}`);

  const merged = await call(guest, "POST", "/api/cart/items", { body: { menuItemId: dishId, quantity: 1 } });
  check("cart", "duplicate lines merge", merged.body?.data?.items?.length === 1 && merged.body?.data?.items[0]?.quantity === 3, `qty=${merged.body?.data?.items?.[0]?.quantity}`);

  const zeroQty = await call(guest, "POST", "/api/cart/items", { body: { menuItemId: dishId, quantity: 0 } });
  check("cart", "zero quantity rejected", zeroQty.status === 422, `HTTP ${zeroQty.status}`);

  const hugeQty = await call(guest, "PATCH", `/api/cart/items/${dishId}`, { body: { quantity: 99 } });
  check("cart", "quantity above the line maximum rejected", hugeQty.status === 422, `HTTP ${hugeQty.status}`);

  const soldOut = await call(guest, "POST", "/api/cart/items", { body: { menuItemId: soldOutId, quantity: 1 } });
  check("cart", "unavailable dish rejected with 409", soldOut.status === 409 && soldOut.body?.error?.code === "ITEM_UNAVAILABLE", `HTTP ${soldOut.status}`);

  const badId = await call(guest, "POST", "/api/cart/items", { body: { menuItemId: "not-an-object-id", quantity: 1 } });
  check("cart", "malformed dish id rejected", badId.status === 422, `HTTP ${badId.status}`);

  const removedLine = await call(guest, "DELETE", `/api/cart/items/${dishId}`);
  check("cart", "line removal works", removedLine.status === 200 && removedLine.body?.data?.items?.length === 0, `HTTP ${removedLine.status}`);

  /* ------------------------------------------------------------ orders */
  await call(guest, "POST", "/api/cart/items", { body: { menuItemId: dishId, quantity: 2 } });
  const emptyOther = await call(other, "POST", "/api/orders", { body: { type: "pickup", name: "Audit Other", email: otherEmail } });
  check("orders", "ordering with an empty cart is refused", emptyOther.status === 400, `HTTP ${emptyOther.status}`);

  const orderRes = await call(guest, "POST", "/api/orders", {
    body: { type: "pickup", name: "Audit Guest", email: guestEmail, phone: "(212) 555-0102", subtotalCents: 1, totalCents: 1 },
  });
  const order = orderRes.body?.data;
  check("orders", "order created", orderRes.status === 201, `HTTP ${orderRes.status}`);
  check("orders", "totals recomputed server-side (client values ignored)", order?.subtotalCents === 6200 && order?.totalCents !== 1, `subtotal=${order?.subtotalCents}, total=${order?.totalCents}`);
  check("orders", "order number format", /^SAV-\d{8}-\d{4}$/.test(order?.orderNumber ?? ""), order?.orderNumber);
  check("orders", "item snapshot stores name and unit price", order?.items?.[0]?.name === "Audit Wagyu Burger" && order?.items?.[0]?.unitPriceCents === 3100, `${order?.items?.[0]?.name} @ ${order?.items?.[0]?.unitPriceCents}`);

  const cartAfter = await call(guest, "GET", "/api/cart");
  check("orders", "cart emptied after checkout", cartAfter.body?.data?.items?.length === 0, `lines=${cartAfter.body?.data?.items?.length}`);

  const foreignOrder = await call(other, "GET", `/api/orders/${order.id}`);
  check("orders", "another customer cannot read the order (403)", foreignOrder.status === 403 && foreignOrder.body?.error?.code === "ORDER_FORBIDDEN", `HTTP ${foreignOrder.status}`);

  const mine = await call(guest, "GET", "/api/orders");
  const theirs = await call(other, "GET", "/api/orders");
  check("orders", "order lists are scoped to the owner", mine.body?.data?.length === 1 && theirs.body?.data?.length === 0, `mine=${mine.body?.data?.length}, theirs=${theirs.body?.data?.length}`);

  const deliveryMissing = await call(guest, "POST", "/api/orders", { body: { type: "delivery", name: "Audit Guest", email: guestEmail } });
  check("orders", "delivery without an address rejected", deliveryMissing.status === 400 || deliveryMissing.status === 422, `HTTP ${deliveryMissing.status}`);

  const illegalStep = await call(admin, "PATCH", `/api/admin/orders/${order.id}/status`, { body: { status: "delivered" } });
  check("orders", "illegal status jump rejected (409)", illegalStep.status === 409 && illegalStep.body?.error?.code === "INVALID_STATUS_TRANSITION", `HTTP ${illegalStep.status}`);

  const pipeline = [];
  for (const status of ["confirmed", "preparing", "ready", "delivered"]) {
    const step = await call(admin, "PATCH", `/api/admin/orders/${order.id}/status`, { body: { status } });
    pipeline.push(`${status}:${step.status}`);
  }
  check("orders", "kitchen pipeline accepted in order", pipeline.every((entry) => entry.endsWith(":200")), pipeline.join(" → "));

  const history = await call(guest, "GET", `/api/orders/${order.id}`);
  check(
    "orders",
    "status history recorded",
    history.body?.data?.statusHistory?.map((e) => e.status).join(",") === "pending,confirmed,preparing,ready,delivered",
    history.body?.data?.statusHistory?.map((e) => e.status).join(","),
  );

  // Cancellation rules on a fresh order.
  await call(guest, "POST", "/api/cart/items", { body: { menuItemId: friesId, quantity: 1 } });
  const second = await call(guest, "POST", "/api/orders", { body: { type: "pickup", name: "Audit Guest", email: guestEmail } });
  const cancel = await call(guest, "POST", `/api/orders/${second.body?.data?.id}/cancel`, { body: { reason: "Changed plans" } });
  check("orders", "customer can cancel a pending order", cancel.status === 200 && cancel.body?.data?.status === "cancelled", `HTTP ${cancel.status}`);
  const cancelAgain = await call(guest, "POST", `/api/orders/${second.body?.data?.id}/cancel`, { body: {} });
  check("orders", "double cancellation rejected", cancelAgain.status === 409, `HTTP ${cancelAgain.status}`);

  /* ------------------------------------------------------ reservations */
  const openDate = nextOpenDate(2);
  const availability = await call(null, "GET", `/api/reservations/availability?date=${openDate}`);
  check("reservations", "availability returns capacity per seating", availability.status === 200 && availability.body?.data?.slots?.length === 10, `HTTP ${availability.status}, slots=${availability.body?.data?.slots?.length}`);

  const monday = await call(null, "POST", "/api/reservations", {
    body: { name: "Audit Guest", email: guestEmail, date: nextMonday(), time: "19:00", partySize: 2 },
  });
  check("reservations", "Mondays rejected", monday.status === 400 && /Monday/i.test(monday.body?.error?.message ?? ""), `HTTP ${monday.status}`);

  const past = await call(null, "POST", "/api/reservations", {
    body: { name: "Audit Guest", email: guestEmail, date: "2020-01-02", time: "19:00", partySize: 2 },
  });
  check("reservations", "past dates rejected", past.status === 400, `HTTP ${past.status}`);

  const oversized = await call(null, "POST", "/api/reservations", {
    body: { name: "Audit Guest", email: guestEmail, date: openDate, time: "19:00", partySize: 13 },
  });
  check("reservations", "party size above the maximum rejected", oversized.status === 400, `HTTP ${oversized.status}`);

  const badTime = await call(null, "POST", "/api/reservations", {
    body: { name: "Audit Guest", email: guestEmail, date: openDate, time: "7:30 PM", partySize: 2 },
  });
  check("reservations", "non-slot time rejected", badTime.status === 422, `HTTP ${badTime.status}`);

  const bookingBody = { name: "Audit Guest", email: guestEmail, phone: "(212) 555-0103", date: openDate, time: "20:00", partySize: 2 };
  const booking = await call(null, "POST", "/api/reservations", { body: bookingBody });
  check("reservations", "public booking succeeds", booking.status === 201 && /^SV-[A-Z0-9]{6}$/.test(booking.body?.data?.reservationCode ?? ""), `${booking.status} ${booking.body?.data?.reservationCode}`);

  const duplicate = await call(null, "POST", "/api/reservations", { body: bookingBody });
  check("reservations", "duplicate seating request rejected (409)", duplicate.status === 409 && duplicate.body?.error?.code === "DUPLICATE_RESERVATION", `HTTP ${duplicate.status}`);

  const capacityDate = nextOpenDate(3);
  const capacityPosts = [];
  for (const [index, size] of [12, 12, 1].entries()) {
    const attempt = await call(null, "POST", "/api/reservations", {
      body: { name: `Cap ${index}`, email: `cap${index}.${digits(index)}@savora.audit`, date: capacityDate, time: "18:00", partySize: size },
    });
    capacityPosts.push(attempt.status);
  }
  check("reservations", "slot capacity enforced (24 seats)", capacityPosts.join(",") === "201,201,409", capacityPosts.join(","));

  const fullSlot = await call(null, "GET", `/api/reservations/availability?date=${capacityDate}`);
  const slot = fullSlot.body?.data?.slots?.find((s) => s.time === "18:00");
  check("reservations", "availability reflects the full slot", slot?.seatsLeft === 0 && slot?.available === false, `seatsLeft=${slot?.seatsLeft}`);

  const release = await call(admin, "POST", `/api/reservations/${booking.body?.data?.id}/cancel`, { body: { reason: "Audit cleanup" } });
  check("reservations", "staff cancellation succeeds", release.status === 200 && release.body?.data?.status === "cancelled", `HTTP ${release.status}`);
  const afterRelease = await call(null, "GET", `/api/reservations/availability?date=${openDate}`);
  const releasedSlot = afterRelease.body?.data?.slots?.find((s) => s.time === "20:00");
  check("reservations", "cancelled booking releases seats", releasedSlot?.seatsLeft === 24, `seatsLeft=${releasedSlot?.seatsLeft}`);

  const guestMine = await call(guest, "GET", "/api/reservations/mine");
  check("reservations", "signed-in guest sees reservations by email", guestMine.status === 200 && (guestMine.body?.data?.length ?? 0) >= 1, `n=${guestMine.body?.data?.length}`);

  const adminRes = await call(admin, "GET", "/api/admin/reservations");
  check("reservations", "admin reservation list", adminRes.status === 200 && (adminRes.body?.data?.length ?? 0) >= 3, `n=${adminRes.body?.data?.length}`);

  /* ---------------------------------------------------------- contact */
  const contactBody = { name: "Alex Morgan", email: "alex@savora.audit", phone: "(212) 555-0104", subject: "Private dining", message: "We would like to book the Library room for twelve guests in December." };
  const msg = await call(null, "POST", "/api/contact", { body: contactBody });
  check("contact", "public message accepted", msg.status === 201 && Boolean(msg.body?.data?.id), `HTTP ${msg.status}`);

  const shortMsg = await call(null, "POST", "/api/contact", { body: { ...contactBody, message: "Hi" } });
  check("contact", "short message rejected", shortMsg.status === 422, `HTTP ${shortMsg.status}`);

  const honeypot = await call(null, "POST", "/api/contact", { body: { ...contactBody, company: "Spam Inc" } });
  check("contact", "honeypot rejected", honeypot.status === 422, `HTTP ${honeypot.status}`);

  const custInbox = await call(guest, "GET", "/api/contact");
  check("contact", "customer cannot read the inbox (403)", custInbox.status === 403, `HTTP ${custInbox.status}`);

  const inbox = await call(admin, "GET", "/api/contact");
  check("contact", "admin inbox lists messages with unread count", inbox.status === 200 && inbox.body?.meta?.unread === 1, `unread=${inbox.body?.meta?.unread}`);

  const marked = await call(admin, "PATCH", `/api/contact/${msg.body?.data?.id}`, { body: { status: "read" } });
  check("contact", "message marked read with timestamp", marked.status === 200 && Boolean(marked.body?.data?.readAt), `HTTP ${marked.status}`);

  const deleted = await call(admin, "DELETE", `/api/contact/${msg.body?.data?.id}`);
  check("contact", "message deleted", deleted.status === 200, `HTTP ${deleted.status}`);

  /* --------------------------------------------------------- payments */
  const payConfig = await call(null, "GET", "/api/payments/config");
  check("payments", "payments reported disabled without Stripe keys", payConfig.status === 200 && payConfig.body?.data?.enabled === false, `enabled=${payConfig.body?.data?.enabled}`);

  const intent = await call(guest, "POST", "/api/payments/intents", { body: { orderId: order.id } });
  check("payments", "intent creation fails closed with 503", intent.status === 503 && intent.body?.error?.code === "PAYMENTS_DISABLED", `${intent.status} ${intent.body?.error?.code}`);

  const noSig = await call(null, "POST", "/api/payments/webhook", { body: { id: "evt_audit" } });
  check("payments", "webhook without a signature is rejected", noSig.status === 400, `HTTP ${noSig.status}`);

  const badSig = await call(null, "POST", "/api/payments/webhook", { body: { id: "evt_audit" }, headers: { "stripe-signature": "t=1,v1=deadbeef" } });
  check("payments", "webhook with a bad signature is rejected", badSig.status === 400 || badSig.status === 503, `HTTP ${badSig.status}`);

  /* --------------------------------------------------------- security */
  const injection = await call(null, "POST", "/api/auth/login", { body: { email: { $gt: "" }, password: "whatever" } });
  check("security", "Mongo operator injection rejected", injection.status === 400 && /unsupported property/i.test(injection.body?.error?.message ?? ""), `HTTP ${injection.status}`);

  const proto = await call(null, "POST", "/api/contact", { raw: '{"__proto__":{"role":"admin"},"name":"X","email":"x@y.com"}' });
  check("security", "prototype pollution key rejected", proto.status === 400, `HTTP ${proto.status}`);

  const evilOrigin = await call(null, "POST", "/api/contact", { body: contactBody, headers: { origin: "https://evil.example" } });
  check("security", "cross-origin mutation rejected", evilOrigin.status === 403 && evilOrigin.body?.error?.code === "ORIGIN_NOT_ALLOWED", `HTTP ${evilOrigin.status}`);

  const evilCors = await call(null, "GET", "/api/health", { headers: { origin: "https://evil.example" } });
  check("security", "cross-origin read rejected", evilCors.status === 403, `HTTP ${evilCors.status}`);

  const preflight = await fetch(`${BASE}/api/auth/login`, { method: "OPTIONS", headers: { origin: "http://localhost:5173", "access-control-request-method": "POST" } });
  check("security", "CORS preflight allowed for the configured origin", preflight.status === 204, `HTTP ${preflight.status}`);

  const queryInjection = await call(null, "GET", "/api/menu?search%5B%24ne%5D=x");
  check(
    "security",
    "operator-shaped query param is ignored, not executed",
    queryInjection.status === 200 && queryInjection.body?.meta?.total === 3,
    `HTTP ${queryInjection.status}, total=${queryInjection.body?.meta?.total}`,
  );

  const bigBody = await call(null, "POST", "/api/contact", { body: { ...contactBody, message: "x".repeat(200_000) } });
  check("security", "oversized body rejected", bigBody.status === 400 || bigBody.status === 413, `HTTP ${bigBody.status}`);

  /* ------------------------------------------------------------ logout */
  const logout = await call(guest, "POST", "/api/auth/logout");
  check("auth", "logout succeeds", logout.status === 200, `HTTP ${logout.status}`);
  const afterLogout = await call(guest, "GET", "/api/auth/me");
  check("auth", "session cleared after logout", afterLogout.status === 401, `HTTP ${afterLogout.status}`);

  /* ------------------------------------------------------------ report */
  console.log("\n──────────────────────── SUMMARY ────────────────────────");
  const byArea = new Map();
  for (const row of results) {
    const bucket = byArea.get(row.area) ?? { pass: 0, fail: 0 };
    if (row.status === "PASS") bucket.pass += 1;
    else bucket.fail += 1;
    byArea.set(row.area, bucket);
  }
  for (const [area, bucket] of byArea) {
    console.log(`${area.padEnd(14)} ${String(bucket.pass).padStart(3)} pass  ${bucket.fail} fail`);
  }
  console.log(`TOTAL          ${results.length - failures}/${results.length} passed`);
  console.log(`database       ${DB_NAME}`);
  console.log(`server log     ${LOG}`);

  await mongoose.connection.db.dropDatabase();
  await mongoose.disconnect();
  server.kill();
  await new Promise((resolve) => setTimeout(resolve, 400));
  process.exit(failures === 0 ? 0 : 1);
}

main().catch(async (error) => {
  console.error("AUDIT CRASHED:", error);
  try {
    server?.kill();
  } catch {
    /* best effort */
  }
  await new Promise((resolve) => setTimeout(resolve, 250));
  logStream?.end();
  try {
    const tail = fs.readFileSync(LOG, "utf8").slice(-2500);
    if (tail.trim()) console.error(`--- server log tail ---\n${tail}`);
  } catch {
    /* best effort */
  }
  try {
    if (mongoose.connection.readyState === 1 && mongoose.connection.name.startsWith("savora_audit_")) {
      await mongoose.connection.db.dropDatabase();
    }
    await mongoose.disconnect();
  } catch {
    /* best effort */
  }
  process.exit(1);
});

