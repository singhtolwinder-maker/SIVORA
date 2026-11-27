/**
 * End-to-end API tests. Each request goes through the real Express app and a
 * real (in-memory) MongoDB, so validation, cookies, middleware and indexes are
 * all exercised.
 *
 *   npm test
 */
process.env.NODE_ENV = "test";
process.env.JWT_ACCESS_SECRET = "test-access-secret-0123456789abcdef0123456789";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret-0123456789abcdef0123456789";
process.env.RESERVATION_SLOT_CAPACITY = "24";
process.env.TAX_RATE = "0.08875";
process.env.DELIVERY_FEE_CENTS = "499";
process.env.STRIPE_SECRET_KEY = "";
process.env.STRIPE_WEBHOOK_SECRET = "";

import { after, before, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";

import User from "../src/models/User.js";
import MenuItem from "../src/models/MenuItem.js";
import Cart from "../src/models/Cart.js";
import Order from "../src/models/Order.js";
import Reservation from "../src/models/Reservation.js";
import ReservationSlot from "../src/models/ReservationSlot.js";
import ContactMessage from "../src/models/ContactMessage.js";
import PaymentEvent from "../src/models/PaymentEvent.js";
import { todayInZone } from "../src/utils/time.js";
// Side-effect import: apply the same global Mongoose options the server uses.
// Without this, production-only query behaviour is invisible to the suite.
import "../src/config/db.js";

let mongo;
let app;
let api;
let adminAgent;
let guestAgent;
let otherAgent;
let menu;

const PASSWORD = "Savora!2026";

function datePlus(days) {
  const [year, month, day] = todayInZone().split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

/** Next non-Monday date at least one day ahead. */
function nextOpenDate() {
  for (let offset = 1; offset < 10; offset += 1) {
    const date = datePlus(offset);
    const [year, month, day] = date.split("-").map(Number);
    if (new Date(Date.UTC(year, month - 1, day)).getUTCDay() !== 1) return date;
  }
  throw new Error("no open date found");
}

function nextMonday() {
  for (let offset = 1; offset < 10; offset += 1) {
    const date = datePlus(offset);
    const [year, month, day] = date.split("-").map(Number);
    if (new Date(Date.UTC(year, month - 1, day)).getUTCDay() === 1) return date;
  }
  throw new Error("no Monday found");
}

async function makeUser({ name, email, role = "customer" }) {
  return User.create({ name, email, passwordHash: PASSWORD, role });
}

async function login(agent, email) {
  const response = await agent.post("/api/auth/login").send({ email, password: PASSWORD });
  assert.equal(response.status, 200, `login failed for ${email}: ${JSON.stringify(response.body)}`);
  return response;
}

/** Raw refresh cookie value from a response, so a token can be replayed. */
function refreshCookieOf(response) {
  const header = response.headers["set-cookie"] || [];
  const cookie = header.find((entry) => entry.startsWith("savora_rt="));
  return cookie?.split(";")[0].slice("savora_rt=".length);
}

before(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri("savora_test"));
  const { createApp } = await import("../src/app.js");
  app = createApp();
  api = request(app);

  await Promise.all([User.init(), MenuItem.init(), Order.init(), Reservation.init()]);
  await makeUser({ name: "Admin User", email: "admin@savora.test", role: "admin" });
  await makeUser({ name: "Guest User", email: "guest@savora.test" });
  await makeUser({ name: "Other Guest", email: "other@savora.test" });
  await makeUser({ name: "Password User", email: "password@savora.test" });

  adminAgent = request.agent(app);
  guestAgent = request.agent(app);
  otherAgent = request.agent(app);

  await login(adminAgent, "admin@savora.test");
  await login(guestAgent, "guest@savora.test");
  await login(otherAgent, "other@savora.test");
});

after(async () => {
  await mongoose.disconnect();
  await mongo?.stop();
});

beforeEach(async () => {
  await Promise.all([
    Cart.deleteMany({}),
    Order.deleteMany({}),
    Reservation.deleteMany({}),
    ReservationSlot.deleteMany({}),
    ContactMessage.deleteMany({}),
    PaymentEvent.deleteMany({}),
    MenuItem.deleteMany({}),
  ]);

  const created = await MenuItem.create([
    {
      name: "Dry-Aged Ribeye",
      slug: "dry-aged-ribeye",
      description: "28-day dry-aged ribeye with herb butter and thyme jus.",
      category: "Prime Cuts",
      priceCents: 5800,
      imageUrl: "/images/dish-ribeye.jpg",
      tier: 5,
      prepMinutes: 30,
    },
    {
      name: "Wagyu Burger",
      slug: "wagyu-burger",
      description: "American Wagyu, aged cheddar, caramelised onions, truffle aioli.",
      category: "Signatures",
      priceCents: 2800,
      imageUrl: "/images/dish-burger.jpg",
      tier: 3,
      prepMinutes: 20,
    },
    {
      name: "Truffle Fries",
      slug: "truffle-fries",
      description: "Hand-cut fries, black truffle oil, parmesan and garlic aioli.",
      category: "Starters",
      priceCents: 1600,
      imageUrl: "/images/dish-fries.jpg",
      tier: 2,
      prepMinutes: 12,
    },
    {
      name: "New York Cheesecake",
      slug: "new-york-cheesecake",
      description: "Classic dense cheesecake with blueberry compote.",
      category: "Desserts",
      priceCents: 1200,
      imageUrl: "/images/dish-cheesecake.jpg",
      isAvailable: false,
      tier: 1,
    },
  ]);

  menu = Object.fromEntries(created.map((item) => [item.slug, item]));
});

describe("infrastructure", () => {
  it("reports a healthy database", async () => {
    const response = await api.get("/api/health");
    assert.equal(response.status, 200);
    assert.equal(response.body.data.status, "ok");
    assert.equal(response.body.data.database, "connected");
  });

  // Verification depends on knowing which build answers, so the field must be
  // present even where the host exports no commit (null here, a sha on Render).
  it("names the build it was started from", async () => {
    const response = await api.get("/api/health");

    assert.equal(response.status, 200);
    assert.ok("commit" in response.body.data);
    assert.ok(response.body.data.commit === null || /^[0-9a-f]{7}$/.test(response.body.data.commit));
  });

  it("returns a consistent 404 envelope", async () => {
    const response = await api.get("/api/nope");
    assert.equal(response.status, 404);
    assert.equal(response.body.success, false);
    assert.equal(response.body.error.code, "ROUTE_NOT_FOUND");
    assert.ok(response.body.requestId);
    assert.ok(response.headers["x-request-id"]);
  });

  it("rejects malformed JSON", async () => {
    const response = await api
      .post("/api/auth/login")
      .set("Content-Type", "application/json")
      .send('{"email": ');
    assert.equal(response.status, 400);
    assert.equal(response.body.error.code, "BAD_REQUEST");
  });

  it("accepts an anonymous browser error report", async () => {
    const response = await api.post("/api/client-errors").send({
      message: "Cannot read properties of undefined (reading 'length')",
      stack: "TypeError: Cannot read properties of undefined\n    at Menu",
      route: "/#menu",
      source: "storefront",
    });
    assert.equal(response.status, 202);
    assert.equal(response.body.success, true);
  });

  it("rejects an empty browser error report", async () => {
    const response = await api.post("/api/client-errors").send({ message: "" });
    assert.equal(response.status, 422);
    assert.equal(response.body.error.code, "VALIDATION_ERROR");
  });
});

describe("authentication", () => {
  it("rejects a weak password with field details", async () => {
    const response = await api
      .post("/api/auth/register")
      .send({ name: "New Guest", email: "weak@example.com", password: "password" });

    assert.equal(response.status, 422);
    assert.equal(response.body.error.code, "VALIDATION_ERROR");
    assert.ok(response.body.error.details.some((detail) => detail.field === "password"));
  });

  it("registers a customer, sets httpOnly cookies and never returns the hash", async () => {
    const agent = request.agent(app);
    const response = await agent
      .post("/api/auth/register")
      .send({ name: "Ada Lovelace", email: "ada@example.com", password: "Ada!2026x" });

    assert.equal(response.status, 201);
    assert.equal(response.body.data.user.email, "ada@example.com");
    assert.equal(response.body.data.user.role, "customer");
    assert.equal(response.body.data.user.passwordHash, undefined);

    const cookies = response.headers["set-cookie"].join(";");
    assert.match(cookies, /savora_at=/);
    assert.match(cookies, /HttpOnly/);

    const me = await agent.get("/api/auth/me");
    assert.equal(me.status, 200);
    assert.equal(me.body.data.user.name, "Ada Lovelace");

    const stored = await User.findOne({ email: "ada@example.com" }).select("+passwordHash");
    assert.notEqual(stored.passwordHash, "Ada!2026x");
    assert.match(stored.passwordHash, /^\$2[aby]\$/);
  });

  it("blocks duplicate emails", async () => {
    const response = await api
      .post("/api/auth/register")
      .send({ name: "Duplicate", email: "guest@savora.test", password: "Another!2026" });

    assert.equal(response.status, 409);
    assert.equal(response.body.error.code, "EMAIL_IN_USE");
    assert.equal(response.body.error.details.field, "email");
  });

  it("rejects wrong credentials without revealing which field failed", async () => {
    const wrongPassword = await api
      .post("/api/auth/login")
      .send({ email: "guest@savora.test", password: "TotallyWrong!1" });
    const unknownEmail = await api
      .post("/api/auth/login")
      .send({ email: "ghost@savora.test", password: "TotallyWrong!1" });

    assert.equal(wrongPassword.status, 401);
    assert.equal(unknownEmail.status, 401);
    assert.equal(wrongPassword.body.error.message, unknownEmail.body.error.message);
  });

  it("requires a session for private endpoints", async () => {
    const response = await api.get("/api/auth/me");
    assert.equal(response.status, 401);
    assert.equal(response.body.error.code, "AUTH_REQUIRED");
  });

  it("reports a guest session without a 401", async () => {
    const anonymous = await api.get("/api/auth/session");
    assert.equal(anonymous.status, 200);
    assert.equal(anonymous.body.data.user, null);

    const signedIn = await guestAgent.get("/api/auth/session");
    assert.equal(signedIn.status, 200);
    assert.equal(signedIn.body.data.user.email, "guest@savora.test");
  });

  it("rotates the refresh cookie", async () => {
    const response = await guestAgent.post("/api/auth/refresh");
    assert.equal(response.status, 200);
    assert.equal(response.body.data.user.email, "guest@savora.test");

    const me = await guestAgent.get("/api/auth/me");
    assert.equal(me.status, 200);
  });

  it("rejects a replayed refresh token after rotation", async () => {
    const register = await api.post("/api/auth/register").send({
      name: "Replay Tester",
      email: "replay@example.com",
      password: "Replay!2026x",
    });
    assert.equal(register.status, 201);

    const originalCookie = refreshCookieOf(register);
    assert.ok(originalCookie, "registration should set a refresh cookie");

    const rotated = await api.post("/api/auth/refresh").set("Cookie", `savora_rt=${originalCookie}`);
    assert.equal(rotated.status, 200);
    const freshCookie = refreshCookieOf(rotated);
    assert.notEqual(freshCookie, originalCookie);

    // The consumed token is single-use: replaying it must not open a session.
    const replay = await api.post("/api/auth/refresh").set("Cookie", `savora_rt=${originalCookie}`);
    assert.equal(replay.status, 401);
    assert.equal(replay.body.error.code, "SESSION_REVOKED");

    const stillValid = await api.post("/api/auth/refresh").set("Cookie", `savora_rt=${freshCookie}`);
    assert.equal(stillValid.status, 200);
  });

  it("ends only the session that logs out", async () => {
    const first = await api.post("/api/auth/login").send({ email: "other@savora.test", password: PASSWORD });
    const second = await api.post("/api/auth/login").send({ email: "other@savora.test", password: PASSWORD });
    const firstCookie = refreshCookieOf(first);
    const secondCookie = refreshCookieOf(second);
    assert.ok(firstCookie && secondCookie);

    const out = await api.post("/api/auth/logout").set("Cookie", `savora_rt=${firstCookie}`);
    assert.equal(out.status, 200);

    const revoked = await api.post("/api/auth/refresh").set("Cookie", `savora_rt=${firstCookie}`);
    assert.equal(revoked.status, 401);

    const alive = await api.post("/api/auth/refresh").set("Cookie", `savora_rt=${secondCookie}`);
    assert.equal(alive.status, 200);
  });

  it("updates the profile", async () => {
    const response = await guestAgent
      .patch("/api/users/me")
      .send({ name: "Guest Updated", phone: "(212) 555-0101" });

    assert.equal(response.status, 200);
    assert.equal(response.body.data.user.name, "Guest Updated");
    assert.equal(response.body.data.user.phone, "(212) 555-0101");
  });

  it("completes the forgot/reset password flow and revokes old sessions", async () => {
    const agent = request.agent(app);
    await login(agent, "password@savora.test");

    const forgot = await api
      .post("/api/auth/forgot-password")
      .send({ email: "password@savora.test" });
    assert.equal(forgot.status, 200);
    const url = forgot.body.data.devResetUrl;
    assert.ok(url, "development reset url should be returned");
    const token = new URL(url).searchParams.get("token");

    const reset = await api
      .post("/api/auth/reset-password")
      .send({ token, password: "BrandNew!2026" });
    assert.equal(reset.status, 200);

    const oldLogin = await api
      .post("/api/auth/login")
      .send({ email: "password@savora.test", password: PASSWORD });
    assert.equal(oldLogin.status, 401);

    const newLogin = await api
      .post("/api/auth/login")
      .send({ email: "password@savora.test", password: "BrandNew!2026" });
    assert.equal(newLogin.status, 200);
  });

  it("logs out and clears cookies", async () => {
    const agent = request.agent(app);
    await login(agent, "other@savora.test");

    const response = await agent.post("/api/auth/logout");
    assert.equal(response.status, 200);

    const me = await agent.get("/api/auth/me");
    assert.equal(me.status, 401);
  });
});

describe("authorization", () => {
  it("prevents customers from reaching admin APIs", async () => {
    const stats = await guestAgent.get("/api/admin/stats");
    assert.equal(stats.status, 403);
    assert.equal(stats.body.error.code, "FORBIDDEN");

    const create = await guestAgent.post("/api/menu").send({
      name: "Chef's Secret",
      description: "Should never be created by a customer.",
      category: "Signatures",
      price: 99,
      imageUrl: "/images/x.jpg",
    });
    assert.equal(create.status, 403);
  });

  it("prevents signed-out access to admin APIs", async () => {
    const response = await api.get("/api/admin/stats");
    assert.equal(response.status, 401);
  });

  it("returns dashboard metrics for administrators", async () => {
    const response = await adminAgent.get("/api/admin/stats");
    assert.equal(response.status, 200);
    assert.equal(response.body.data.menu.total, 4);
    assert.equal(response.body.data.menu.unavailable, 1);
    assert.equal(typeof response.body.data.revenue.totalCents, "number");
    assert.ok(Array.isArray(response.body.data.activities));
  });
});

describe("menu", () => {
  it("lists available dishes with pagination metadata", async () => {
    const response = await api.get("/api/menu?limit=2");
    assert.equal(response.status, 200);
    assert.equal(response.body.data.length, 2);
    assert.equal(response.body.meta.total, 4);
    assert.equal(response.body.meta.totalPages, 2);
  });

  it("filters by category, price and availability", async () => {
    const prime = await api.get("/api/menu?category=Prime%20Cuts");
    assert.equal(prime.body.data.length, 1);
    assert.equal(prime.body.data[0].name, "Dry-Aged Ribeye");

    const midRange = await api.get("/api/menu?minPrice=20&maxPrice=30");
    assert.deepEqual(midRange.body.data.map((item) => item.name), ["Wagyu Burger"]);

    const unavailable = await api.get("/api/menu?available=false");
    assert.equal(unavailable.body.data.length, 1);
    assert.equal(unavailable.body.data[0].name, "New York Cheesecake");
  });

  it("searches dish names and descriptions", async () => {
    // "truffle" appears in the fries name and in the burger description.
    const response = await api.get("/api/menu?search=truffle");
    assert.equal(response.status, 200);
    assert.deepEqual(
      response.body.data.map((item) => item.name).sort(),
      ["Truffle Fries", "Wagyu Burger"],
    );

    const exact = await api.get("/api/menu?search=cheesecake");
    assert.deepEqual(exact.body.data.map((item) => item.name), ["New York Cheesecake"]);
  });

  it("returns a dish by slug and 404s unknown slugs", async () => {
    const found = await api.get("/api/menu/dry-aged-ribeye");
    assert.equal(found.status, 200);
    assert.equal(found.body.data.priceCents, 5800);
    assert.equal(found.body.data.price, 58);

    const missing = await api.get("/api/menu/not-a-dish");
    assert.equal(missing.status, 404);
  });

  it("lets an administrator create, update and delete a dish", async () => {
    const created = await adminAgent.post("/api/menu").send({
      name: "Oak-Smoked Duck",
      description: "Whole duck smoked over white oak with cherry gastrique.",
      category: "Signatures",
      price: 46.5,
      imageUrl: "/images/dish-duck.jpg",
      ingredients: ["duck", "cherry"],
      isAvailable: true,
    });

    assert.equal(created.status, 201);
    assert.equal(created.body.data.priceCents, 4650);
    assert.equal(created.body.data.slug, "oak-smoked-duck");

    const updated = await adminAgent
      .patch(`/api/menu/${created.body.data.id}`)
      .send({ price: 49, isFeatured: true });
    assert.equal(updated.status, 200);
    assert.equal(updated.body.data.priceCents, 4900);
    assert.equal(updated.body.data.isFeatured, true);

    const toggled = await adminAgent
      .patch(`/api/menu/${created.body.data.id}/availability`)
      .send({ isAvailable: false });
    assert.equal(toggled.status, 200);
    assert.equal(toggled.body.data.isAvailable, false);

    const removed = await adminAgent.delete(`/api/menu/${created.body.data.id}`);
    assert.equal(removed.status, 200);
    assert.equal(await MenuItem.findById(created.body.data.id), null);
  });
});

describe("cart", () => {
  it("requires authentication", async () => {
    const response = await api.get("/api/cart");
    assert.equal(response.status, 401);
  });

  it("adds items and calculates totals on the server", async () => {
    const response = await guestAgent
      .post("/api/cart/items")
      .send({ menuItemId: String(menu["dry-aged-ribeye"]._id), quantity: 2 });

    assert.equal(response.status, 200);
    assert.equal(response.body.data.items.length, 1);
    assert.equal(response.body.data.items[0].quantity, 2);
    assert.equal(response.body.data.totals.subtotalCents, 11600);
    assert.equal(response.body.data.totals.taxCents, 1030);
    assert.equal(response.body.data.totals.deliveryFeeCents, 0);
    assert.equal(response.body.data.totals.totalCents, 12630);
  });

  it("merges duplicate lines and rejects unavailable or invalid quantities", async () => {
    const id = String(menu["wagyu-burger"]._id);
    await guestAgent.post("/api/cart/items").send({ menuItemId: id, quantity: 1 });
    const merged = await guestAgent.post("/api/cart/items").send({ menuItemId: id, quantity: 2 });
    assert.equal(merged.body.data.items[0].quantity, 3);

    const unavailable = await guestAgent
      .post("/api/cart/items")
      .send({ menuItemId: String(menu["new-york-cheesecake"]._id), quantity: 1 });
    assert.equal(unavailable.status, 409);
    assert.equal(unavailable.body.error.code, "ITEM_UNAVAILABLE");

    const tooMany = await guestAgent
      .patch(`/api/cart/items/${id}`)
      .send({ quantity: 99 });
    assert.equal(tooMany.status, 422);

    const zero = await guestAgent.post("/api/cart/items").send({ menuItemId: id, quantity: 0 });
    assert.equal(zero.status, 422);
  });

  it("charges delivery under the free-delivery threshold", async () => {
    await guestAgent
      .post("/api/cart/items")
      .send({ menuItemId: String(menu["truffle-fries"]._id), quantity: 1 });

    const response = await guestAgent.get("/api/cart?type=delivery");
    assert.equal(response.body.data.totals.subtotalCents, 1600);
    assert.equal(response.body.data.totals.deliveryFeeCents, 499);
    assert.equal(response.body.data.totals.taxCents, 142);
    assert.equal(response.body.data.totals.totalCents, 2241);
  });

  it("removes and clears items", async () => {
    const id = String(menu["wagyu-burger"]._id);
    await guestAgent.post("/api/cart/items").send({ menuItemId: id, quantity: 1 });

    const removed = await guestAgent.delete(`/api/cart/items/${id}`);
    assert.equal(removed.status, 200);
    assert.equal(removed.body.data.items.length, 0);

    await guestAgent.post("/api/cart/items").send({ menuItemId: id, quantity: 2 });
    const cleared = await guestAgent.delete("/api/cart");
    assert.equal(cleared.status, 200);
    assert.equal(cleared.body.data.items.length, 0);
  });
});

describe("orders", () => {
  async function fillCart(agent, items) {
    for (const [slug, quantity] of items) {
      const response = await agent
        .post("/api/cart/items")
        .send({ menuItemId: String(menu[slug]._id), quantity });
      assert.equal(response.status, 200);
    }
  }

  const contact = { name: "Guest User", email: "guest@savora.test", phone: "(212) 555-0102" };

  it("refuses to order an empty cart", async () => {
    const response = await guestAgent.post("/api/orders").send({ type: "pickup", ...contact });
    assert.equal(response.status, 400);
  });

  it("creates an order with server totals and an immutable snapshot", async () => {
    await fillCart(guestAgent, [["wagyu-burger", 2]]);

    const response = await guestAgent.post("/api/orders").send({
      type: "pickup",
      ...contact,
      subtotalCents: 1,
      totalCents: 1,
    });

    assert.equal(response.status, 201);
    const order = response.body.data;
    assert.match(order.orderNumber, /^SAV-\d{8}-\d{4}$/);
    assert.equal(order.status, "pending");
    assert.equal(order.subtotalCents, 5600);
    assert.equal(order.taxCents, 497);
    assert.equal(order.totalCents, 6097);
    assert.equal(order.items[0].name, "Wagyu Burger");
    assert.equal(order.items[0].unitPriceCents, 2800);
    assert.equal(order.items[0].lineTotalCents, 5600);

    const cart = await guestAgent.get("/api/cart");
    assert.equal(cart.body.data.items.length, 0);

    // Changing the menu price later must not alter the stored order.
    await MenuItem.updateOne({ slug: "wagyu-burger" }, { $set: { priceCents: 9900 } });
    const reread = await guestAgent.get(`/api/orders/${order.id}`);
    assert.equal(reread.body.data.totalCents, 6097);
    assert.equal(reread.body.data.items[0].unitPriceCents, 2800);
  });

  it("validates delivery details", async () => {
    await fillCart(guestAgent, [["truffle-fries", 1]]);

    const missingAddress = await guestAgent
      .post("/api/orders")
      .send({ type: "delivery", ...contact });
    assert.equal(missingAddress.status, 422);
    assert.ok(
      missingAddress.body.error.details.some((detail) => detail.field === "deliveryAddress"),
    );

    const created = await guestAgent.post("/api/orders").send({
      type: "delivery",
      ...contact,
      deliveryAddress: {
        line1: "1428 Hudson Street",
        city: "New York",
        state: "NY",
        zip: "10013",
      },
    });
    assert.equal(created.status, 201);
    assert.equal(created.body.data.deliveryFeeCents, 499);
    assert.equal(created.body.data.totalCents, 2241);
  });

  it("keeps orders private and allows cancellation before cooking", async () => {
    await fillCart(guestAgent, [["dry-aged-ribeye", 1]]);
    const created = await guestAgent.post("/api/orders").send({ type: "pickup", ...contact });
    const id = created.body.data.id;

    const foreign = await otherAgent.get(`/api/orders/${id}`);
    assert.equal(foreign.status, 403);
    assert.equal(foreign.body.error.code, "ORDER_FORBIDDEN");

    const cancelled = await guestAgent.post(`/api/orders/${id}/cancel`).send({ reason: "Changed plans" });
    assert.equal(cancelled.status, 200);
    assert.equal(cancelled.body.data.status, "cancelled");

    const again = await guestAgent.post(`/api/orders/${id}/cancel`).send({});
    assert.equal(again.status, 409);
  });

  it("enforces the kitchen status pipeline", async () => {
    await fillCart(guestAgent, [["wagyu-burger", 1]]);
    const created = await guestAgent.post("/api/orders").send({ type: "pickup", ...contact });
    const id = created.body.data.id;

    const illegal = await adminAgent
      .patch(`/api/admin/orders/${id}/status`)
      .send({ status: "delivered" });
    assert.equal(illegal.status, 409);
    assert.equal(illegal.body.error.code, "INVALID_STATUS_TRANSITION");

    for (const status of ["confirmed", "preparing", "ready", "delivered"]) {
      const step = await adminAgent.patch(`/api/admin/orders/${id}/status`).send({ status });
      assert.equal(step.status, 200, `transition to ${status} failed`);
      assert.equal(step.body.data.status, status);
    }

    const history = await guestAgent.get(`/api/orders/${id}`);
    assert.deepEqual(
      history.body.data.statusHistory.map((entry) => entry.status),
      ["pending", "confirmed", "preparing", "ready", "delivered"],
    );
  });

  it("blocks customer cancellation once cooking has started", async () => {
    await fillCart(guestAgent, [["wagyu-burger", 1]]);
    const created = await guestAgent.post("/api/orders").send({ type: "pickup", ...contact });
    const id = created.body.data.id;

    await adminAgent.patch(`/api/admin/orders/${id}/status`).send({ status: "confirmed" });
    await adminAgent.patch(`/api/admin/orders/${id}/status`).send({ status: "preparing" });

    const response = await guestAgent.post(`/api/orders/${id}/cancel`).send({});
    assert.equal(response.status, 409);
    assert.equal(response.body.error.code, "ORDER_NOT_CANCELLABLE");
  });

  it("lists only the signed-in customer's orders", async () => {
    await fillCart(guestAgent, [["truffle-fries", 1]]);
    await guestAgent.post("/api/orders").send({ type: "pickup", ...contact });

    const mine = await guestAgent.get("/api/orders");
    assert.equal(mine.body.data.length, 1);

    const theirs = await otherAgent.get("/api/orders");
    assert.equal(theirs.body.data.length, 0);
  });
});

describe("reservations", () => {
  const baseBooking = () => ({
    name: "Guest User",
    email: "guest@savora.test",
    phone: "(212) 555-0103",
    date: nextOpenDate(),
    time: "19:00",
    partySize: 2,
    occasion: "Anniversary",
    notes: "Quiet corner if possible",
  });

  it("returns availability with capacity per seating", async () => {
    const date = nextOpenDate();
    const response = await api.get(`/api/reservations/availability?date=${date}`);
    assert.equal(response.status, 200);
    assert.ok(response.body.data.slots.length >= 9);
    assert.ok(response.body.data.slots.every((slot) => slot.seatsLeft === 24));
  });

  it("rejects past dates, Mondays and oversized parties", async () => {
    const past = await api
      .post("/api/reservations")
      .send({ ...baseBooking(), date: "2020-01-02" });
    assert.equal(past.status, 400);

    const monday = await api
      .post("/api/reservations")
      .send({ ...baseBooking(), date: nextMonday() });
    assert.equal(monday.status, 400);
    assert.match(monday.body.error.message, /Monday/i);

    const big = await api
      .post("/api/reservations")
      .send({ ...baseBooking(), partySize: 13 });
    assert.equal(big.status, 400);

    const badTime = await api
      .post("/api/reservations")
      .send({ ...baseBooking(), time: "7:30 PM" });
    assert.equal(badTime.status, 422);
  });

  it("books a table and rejects a duplicate request for the same seating", async () => {
    const payload = baseBooking();
    const created = await api.post("/api/reservations").send(payload);

    assert.equal(created.status, 201);
    assert.match(created.body.data.reservationCode, /^SV-[A-Z0-9]{6}$/);
    assert.equal(created.body.data.status, "pending");
    assert.equal(created.body.data.partySize, 2);
    assert.equal(Date.parse(created.body.data.startsAt) > Date.now(), true);

    const duplicate = await api.post("/api/reservations").send(payload);
    assert.equal(duplicate.status, 409);
    assert.equal(duplicate.body.error.code, "DUPLICATE_RESERVATION");
  });

  it("prevents double booking when a slot reaches capacity", async () => {
    const date = nextOpenDate();
    const first = await api
      .post("/api/reservations")
      .send({ ...baseBooking(), email: "first@example.com", partySize: 12 });
    assert.equal(first.status, 201);

    const second = await api
      .post("/api/reservations")
      .send({ ...baseBooking(), email: "second@example.com", partySize: 12 });
    assert.equal(second.status, 201);

    const third = await api
      .post("/api/reservations")
      .send({ ...baseBooking(), email: "third@example.com", partySize: 1 });
    assert.equal(third.status, 409);
    assert.equal(third.body.error.code, "SLOT_FULL");

    const availability = await api.get(`/api/reservations/availability?date=${date}`);
    const slot = availability.body.data.slots.find((entry) => entry.time === "19:00");
    assert.equal(slot.seatsLeft, 0);
    assert.equal(slot.available, false);
  });

  it("releases seats when a reservation is cancelled", async () => {
    const created = await api.post("/api/reservations").send(baseBooking());
    assert.equal(created.status, 201);

    const cancelled = await adminAgent
      .post(`/api/reservations/${created.body.data.id}/cancel`)
      .send({ reason: "Guest called" });
    assert.equal(cancelled.status, 200);

    const availability = await api.get(
      `/api/reservations/availability?date=${baseBooking().date}`,
    );
    const slot = availability.body.data.slots.find((entry) => entry.time === "19:00");
    assert.equal(slot.seatsLeft, 24);
  });

  it("shows a guest their own reservations only", async () => {
    const created = await api
      .post("/api/reservations")
      .send({ ...baseBooking(), email: "guest@savora.test" });

    const mine = await guestAgent.get("/api/reservations/mine");
    assert.equal(mine.status, 200);
    assert.equal(mine.body.data.some((entry) => entry.id === created.body.data.id), true);

    const theirs = await otherAgent.get("/api/reservations/mine");
    assert.equal(theirs.status, 200);
    assert.equal(theirs.body.data.length, 0);

    const forbidden = await otherAgent.get(`/api/reservations/${created.body.data.id}`);
    assert.equal(forbidden.status, 403);
  });

  it("lets staff confirm and seat a booking", async () => {
    const created = await api.post("/api/reservations").send(baseBooking());
    const id = created.body.data.id;

    const confirmed = await adminAgent
      .patch(`/api/admin/reservations/${id}/status`)
      .send({ status: "confirmed" });
    assert.equal(confirmed.status, 200);

    const seated = await adminAgent
      .patch(`/api/admin/reservations/${id}/status`)
      .send({ status: "seated" });
    assert.equal(seated.status, 200);

    const completed = await adminAgent
      .patch(`/api/admin/reservations/${id}/status`)
      .send({ status: "completed" });
    assert.equal(completed.status, 200);
    assert.equal(completed.body.data.status, "completed");

    const stored = await Reservation.findById(id);
    assert.ok(stored.statusHistory.length >= 4);
  });
});

describe("contact messages", () => {
  const message = {
    name: "Alex Morgan",
    email: "alex@example.com",
    phone: "(212) 555-0104",
    subject: "Private dining",
    message: "We would like to book the Library room for twelve guests in December.",
  };

  it("accepts a valid message and rejects short copy", async () => {
    const created = await api.post("/api/contact").send(message);
    assert.equal(created.status, 201);
    assert.ok(created.body.data.id);

    const tooShort = await api.post("/api/contact").send({ ...message, message: "Hi" });
    assert.equal(tooShort.status, 422);
  });

  it("rejects the honeypot field", async () => {
    const response = await api
      .post("/api/contact")
      .send({ ...message, company: "Spam Inc" });
    assert.equal(response.status, 422);
  });

  it("gives administrators an inbox with read tracking", async () => {
    const created = await api.post("/api/contact").send(message);
    const id = created.body.data.id;

    const list = await adminAgent.get("/api/contact");
    assert.equal(list.status, 200);
    assert.equal(list.body.data.length, 1);
    assert.equal(list.body.meta.unread, 1);

    const customer = await guestAgent.get("/api/contact");
    assert.equal(customer.status, 403);

    const read = await adminAgent.patch(`/api/contact/${id}`).send({ status: "read" });
    assert.equal(read.status, 200);
    assert.equal(read.body.data.status, "read");
    assert.ok(read.body.data.readAt);

    const refreshed = await adminAgent.get("/api/contact");
    assert.equal(refreshed.body.meta.unread, 0);

    const deleted = await adminAgent.delete(`/api/contact/${id}`);
    assert.equal(deleted.status, 200);
  });
});

describe("payments", () => {
  it("reports payments as disabled without credentials", async () => {
    const response = await api.get("/api/payments/config");
    assert.equal(response.status, 200);
    assert.equal(response.body.data.enabled, false);
  });

  it("fails closed instead of faking a charge", async () => {
    const response = await guestAgent.post("/api/payments/intents").send({
      orderId: String(new mongoose.Types.ObjectId()),
    });
    assert.equal(response.status, 503);
    assert.equal(response.body.error.code, "PAYMENTS_DISABLED");
  });

  it("requires a configured webhook secret", async () => {
    const response = await api
      .post("/api/payments/webhook")
      .set("Content-Type", "application/json")
      .send({ id: "evt_test" });
    assert.equal(response.status, 400); // missing stripe-signature
  });
});

describe("security", () => {
  it("rejects Mongo operator injection", async () => {
    const response = await api
      .post("/api/auth/login")
      .send({ email: { $gt: "" }, password: "whatever" });
    assert.equal(response.status, 400);
    assert.match(response.body.error.message, /unsupported property/i);
  });

  it("rejects prototype pollution keys", async () => {
    const response = await api
      .post("/api/contact")
      .set("Content-Type", "application/json")
      .send('{"__proto__":{"admin":true},"name":"X","email":"x@y.com"}');
    assert.equal(response.status, 400);
  });

  it("rejects cross-origin state changes", async () => {
    const response = await api
      .post("/api/contact")
      .set("Origin", "https://evil.example")
      .send({ name: "Bad", email: "bad@example.com", subject: "Feedback", message: "Trying to post from another origin." });
    assert.equal(response.status, 403);
    assert.equal(response.body.error.code, "ORIGIN_NOT_ALLOWED");
  });

  it("scopes session cookies and sets SameSite protection", async () => {
    const response = await api
      .post("/api/auth/login")
      .send({ email: "guest@savora.test", password: PASSWORD });
    assert.equal(response.status, 200);

    const cookies = response.headers["set-cookie"];
    const access = cookies.find((entry) => entry.startsWith("savora_at="));
    const refresh = cookies.find((entry) => entry.startsWith("savora_rt="));

    assert.match(access, /HttpOnly/);
    assert.match(access, /SameSite=Lax/);
    assert.match(refresh, /Path=\/api\/auth/);
    assert.match(refresh, /SameSite=Lax/);
  });

  it("never leaks the password hash through the admin customer list", async () => {
    const response = await adminAgent.get("/api/admin/customers");
    assert.equal(response.status, 200);
    for (const customer of response.body.data) {
      assert.equal(customer.passwordHash, undefined);
      assert.equal(customer.refreshTokens, undefined);
      assert.ok(customer.stats);
    }
  });
});

