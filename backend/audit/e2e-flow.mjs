/**
 * SAVORA end-to-end flow check.
 *
 * Runs against a running stack (normally the Vite dev server, so the proxy and
 * cookie behaviour are exercised too). Uses a throwaway database; never point
 * this at the live `savora` database unless you accept test accounts there.
 *
 *   node backend/audit/e2e-flow.mjs http://127.0.0.1:5174
 */
const BASE = (process.argv[2] || "http://127.0.0.1:5174").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || "admin@savora.com";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || "";

let passed = 0;
const failures = [];

function check(name, condition, detail = "") {
  if (condition) {
    passed += 1;
    console.log(`  ok   ${name}`);
  } else {
    failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
    console.log(`  FAIL ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

class CookieJar {
  constructor() {
    this.cookies = new Map();
  }

  store(response) {
    const list = response.headers.getSetCookie?.() ?? [];
    for (const cookie of list) {
      const [pair] = cookie.split(";");
      const index = pair.indexOf("=");
      if (index < 1) continue;
      const name = pair.slice(0, index);
      const value = pair.slice(index + 1);
      if (value === "") this.cookies.delete(name);
      else this.cookies.set(name, value);
    }
  }

  header() {
    return [...this.cookies].map(([name, value]) => `${name}=${value}`).join("; ");
  }
}

async function call(jar, path, { method = "GET", body } = {}) {
  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const cookie = jar?.header();
  if (cookie) headers.Cookie = cookie;

  const response = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  jar?.store(response);

  let json = null;
  const text = await response.text();
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
  }
  return { status: response.status, json };
}

function nextOpenDate() {
  const date = new Date(Date.now() + 86_400_000);
  // The house is closed on Mondays.
  if (date.getDay() === 1) date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

async function main() {
  const guest = new CookieJar();
  const admin = new CookieJar();
  const date = nextOpenDate();

  console.log(`\nSAVORA E2E — ${BASE}\n`);

  console.log("Public menu");
  const menu = await call(guest, "/api/menu?limit=100&available=true&sort=newest");
  check("GET /api/menu returns 200", menu.status === 200, `status ${menu.status}`);
  const dishes = menu.json?.data ?? [];
  check("menu has dishes", dishes.length > 0, `${dishes.length} dishes`);

  const categories = await call(guest, "/api/menu/categories");
  check("GET /api/menu/categories returns 200", categories.status === 200);

  console.log("\nReservations");
  const availability = await call(guest, `/api/reservations/availability?date=${date}`);
  check("availability returns 200", availability.status === 200, `status ${availability.status}`);
  const slots = availability.json?.data?.slots ?? [];
  check("availability lists slots", slots.length > 0, `${slots.length} slots`);

  const invalid = await call(guest, "/api/reservations", {
    method: "POST",
    body: { name: "A", email: "not-an-email", date, time: "19:00", partySize: 2 },
  });
  // The API reports schema failures as 422 VALIDATION_ERROR (not 400).
  check("invalid reservation is rejected with 422", invalid.status === 422, `status ${invalid.status}`);
  check(
    "invalid reservation returns field details",
    Array.isArray(invalid.json?.error?.details) && invalid.json.error.details.length > 0,
  );

  const bookingBody = {
    name: "E2E Guest",
    email: `e2e.${Date.now()}@example.com`,
    phone: "(212) 555-0199",
    date,
    time: slots.find((slot) => slot.available)?.time ?? "19:00",
    partySize: 2,
    occasion: "Anniversary",
    notes: "Window table if possible",
  };
  const booking = await call(guest, "/api/reservations", { method: "POST", body: bookingBody });
  check("valid reservation returns 201", booking.status === 201, `status ${booking.status}`);
  check(
    "reservation is pending, not confirmed",
    booking.json?.data?.status === "pending",
    booking.json?.data?.status,
  );
  check("reservation has a public code", /^SV-[A-Z0-9]{6}$/.test(booking.json?.data?.reservationCode ?? ""));

  const duplicate = await call(guest, "/api/reservations", { method: "POST", body: bookingBody });
  check("duplicate reservation returns 409", duplicate.status === 409, `status ${duplicate.status}`);

  console.log("\nCustomer account and cart");
  const unauth = await call(guest, "/api/cart");
  check("cart requires a session (401)", unauth.status === 401, `status ${unauth.status}`);

  const customer = new CookieJar();
  const email = `e2e.${Date.now()}@example.com`;
  const registration = await call(customer, "/api/auth/register", {
    method: "POST",
    body: { name: "E2E Customer", email, password: "Passw0rdTest", phone: "(212) 555-0110" },
  });
  check("registration returns 201", registration.status === 201, `status ${registration.status}`);
  check("registration sets a session cookie", customer.cookies.size > 0);
  check("registration hides the password hash", !JSON.stringify(registration.json).includes("passwordHash"));

  const me = await call(customer, "/api/auth/me");
  check("GET /api/auth/me returns 200", me.status === 200);
  check("session belongs to the new account", me.json?.data?.user?.email === email);

  const dish = dishes[0];
  const add = await call(customer, "/api/cart/items", {
    method: "POST",
    body: { menuItemId: dish.id, quantity: 2 },
  });
  check("add to cart returns 200", add.status === 200, `status ${add.status}`);
  check("cart counts two items", add.json?.data?.totals?.itemCount === 2, String(add.json?.data?.totals?.itemCount));

  const patch = await call(customer, `/api/cart/items/${dish.id}`, {
    method: "PATCH",
    body: { quantity: 3 },
  });
  check("quantity update returns 200", patch.status === 200);
  check("cart counts three items", patch.json?.data?.totals?.itemCount === 3);

  const cart = await call(customer, "/api/cart?type=delivery");
  check(
    "delivery cart quotes a fee below the free threshold",
    (cart.json?.data?.totals?.deliveryFeeCents ?? 0) > 0 || cart.json?.data?.totals?.subtotalCents >= 7500,
  );

  console.log("\nCheckout");
  const order = await call(customer, "/api/orders", {
    method: "POST",
    body: { type: "pickup", name: "E2E Customer", email, phone: "(212) 555-0110", notes: "No onions" },
  });
  check("place order returns 201", order.status === 201, `status ${order.status}`);
  check("order number matches SAV-########-####", /^SAV-\d{8}-\d{4}$/.test(order.json?.data?.orderNumber ?? ""));
  check("order is pending and unpaid", order.json?.data?.status === "pending" && order.json?.data?.payment?.status === "unpaid");
  const orderId = order.json?.data?.id;

  const afterOrder = await call(customer, "/api/cart");
  check("cart is emptied after checkout", (afterOrder.json?.data?.items ?? []).length === 0);

  const history = await call(customer, "/api/orders?limit=20");
  check("order history includes the new order", (history.json?.data ?? []).some((row) => row.id === orderId));

  const cancel = await call(customer, `/api/orders/${orderId}/cancel`, { method: "POST", body: {} });
  check("customer can cancel a pending order", cancel.status === 200 && cancel.json?.data?.status === "cancelled");

  const reservationList = await call(customer, "/api/reservations/mine");
  check("reservation history is reachable", reservationList.status === 200);

  const forbidden = await call(customer, "/api/admin/stats");
  check("customer is refused the admin dashboard (403)", forbidden.status === 403, `status ${forbidden.status}`);

  console.log("\nAdministration");
  const adminLogin = await call(admin, "/api/auth/login", {
    method: "POST",
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  check("admin login returns 200", adminLogin.status === 200, `status ${adminLogin.status}`);
  check("admin role is present", adminLogin.json?.data?.user?.role === "admin");

  const stats = await call(admin, "/api/admin/stats");
  check("dashboard stats return 200", stats.status === 200, `status ${stats.status}`);

  const reservations = await call(admin, "/api/admin/reservations?limit=50");
  check("admin can list reservations", reservations.status === 200);
  const ourReservation = (reservations.json?.data ?? []).find(
    (row) => row.reservationCode === booking.json?.data?.reservationCode,
  );
  check("the new reservation is visible to the restaurant", Boolean(ourReservation));

  if (ourReservation) {
    const confirm = await call(admin, `/api/admin/reservations/${ourReservation.id}/status`, {
      method: "PATCH",
      body: { status: "confirmed", note: "Table 12" },
    });
    check("admin can confirm a reservation", confirm.status === 200 && confirm.json?.data?.status === "confirmed");

    const illegal = await call(admin, `/api/admin/reservations/${ourReservation.id}/status`, {
      method: "PATCH",
      body: { status: "pending" },
    });
    check("illegal status transition is rejected (409)", illegal.status === 409, `status ${illegal.status}`);
  }

  const orders = await call(admin, "/api/admin/orders?limit=50");
  check("admin can list orders", orders.status === 200);

  const created = await call(admin, "/api/menu", {
    method: "POST",
    body: {
      name: "E2E Tasting Plate",
      description: "A temporary dish created by the end-to-end check, removed immediately after.",
      category: "Starters",
      price: 19.5,
      imageUrl: "/images/dish-fries.jpg",
      tier: 2,
      isAvailable: true,
    },
  });
  check("admin can create a dish", created.status === 201, `status ${created.status}`);
  const dishId = created.json?.data?.id;

  const toggle = await call(admin, `/api/menu/${dishId}/availability`, {
    method: "PATCH",
    body: { isAvailable: false },
  });
  check("admin can mark a dish unavailable", toggle.status === 200 && toggle.json?.data?.isAvailable === false);

  const removals = await call(admin, `/api/menu/${dishId}`, { method: "DELETE" });
  check("admin can delete a dish", removals.status === 200, `status ${removals.status}`);

  const messages = await call(admin, "/api/admin/messages?limit=50");
  check("admin can list contact messages", messages.status === 200);

  const customers = await call(admin, "/api/admin/customers?limit=50");
  check("admin can list customers", customers.status === 200);

  console.log("\nSession lifecycle");
  const logout = await call(customer, "/api/auth/logout", { method: "POST" });
  check("logout returns 200", logout.status === 200);
  const after = await call(customer, "/api/auth/me");
  check("session is gone after logout (401)", after.status === 401, `status ${after.status}`);

  console.log(`\nE2E RESULT: ${passed} passed, ${failures.length} failed`);
  if (failures.length > 0) {
    for (const failure of failures) console.log(`  - ${failure}`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("[e2e] crashed:", error);
  process.exitCode = 1;
});
