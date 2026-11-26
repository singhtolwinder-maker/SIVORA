# SAVORA API reference

Base URL: `/api` on the site origin (the Vite dev proxy, the `vercel.json` rewrite and
the nginx example all keep it relative). Every request and response is JSON.

## Envelope

Success:

```json
{ "success": true, "message": "Optional human sentence.", "data": {}, "meta": { } }
```

Failure:

```json
{
  "success": false,
  "error": { "code": "VALIDATION_ERROR", "message": "Please check the highlighted fields.",
             "details": [{ "field": "email", "message": "Enter a valid email address." }] },
  "requestId": "b3f1…"
}
```

`meta` is present on paginated lists: `page`, `limit`, `total`, `totalPages`,
`hasNextPage`, `hasPreviousPage`. The contact inbox adds `unread`.

## Authentication

Two mechanisms, accepted on every protected route:

* **Cookies** — `savora_at` (path `/`) and `savora_rt` (path `/api/auth`), both
  `httpOnly`. Set by register/login/refresh/change-password, cleared by logout and
  password reset. `SameSite` is `lax` by default (`COOKIE_SAMESITE`), `Secure` in production.
* **Bearer** — `Authorization: Bearer <accessToken>` for non-browser clients.

Access tokens live `JWT_ACCESS_TTL` (default 15 min). `POST /api/auth/refresh` rotates the
refresh token; replaying a rotated token returns `401 SESSION_REVOKED`.

Roles: `customer` (default) and `admin`. Anything under `/api/admin` requires `admin`.

| Missing / invalid credential | Status | Code |
| --- | --- | --- |
| No credential on a protected route | 401 | `UNAUTHORIZED` |
| Expired access token, valid refresh cookie | 401 | `TOKEN_EXPIRED` (the client refreshes once and retries) |
| Authenticated but not an admin | 403 | `FORBIDDEN` |
| Foreign `Origin` on any request | 403 | `ORIGIN_NOT_ALLOWED` |

## Error codes

| Status | Codes |
| --- | --- |
| 400 | `BAD_REQUEST`, `CART_EMPTY`, `CART_ITEM_NOT_FOUND` (malformed JSON, bad ObjectId, bad quantity) |
| 401 | `UNAUTHORIZED`, `INVALID_TOKEN`, `TOKEN_EXPIRED`, `SESSION_REVOKED`, `INVALID_CREDENTIALS` |
| 403 | `FORBIDDEN`, `ORIGIN_NOT_ALLOWED`, `ORDER_FORBIDDEN`, `RESERVATION_FORBIDDEN` |
| 404 | `NOT_FOUND`, `ROUTE_NOT_FOUND`, `MENU_ITEM_NOT_FOUND`, `ORDER_NOT_FOUND`, `RESERVATION_NOT_FOUND` |
| 409 | `DUPLICATE_KEY`, `ITEM_UNAVAILABLE`, `ITEMS_UNAVAILABLE`, `SLOT_FULL`, `DUPLICATE_RESERVATION`, `INVALID_STATUS_TRANSITION`, `ORDER_NOT_CANCELLABLE`, `ORDER_ALREADY_CANCELLED`, `RESERVATION_NOT_CANCELLABLE`, `RESERVATION_ALREADY_CANCELLED` |
| 413 | body over 100 kB |
| 422 | `VALIDATION_ERROR` — `details[]` names each field |
| 429 | `RATE_LIMITED` |
| 503 | `DATABASE_UNAVAILABLE`, `PAYMENTS_DISABLED` |

Every failure carries `requestId`; quote it when reporting a problem. In production
unexpected 5xx errors are masked as `INTERNAL_ERROR` and no stack is returned.

## Rate limits

| Scope | Applied to |
| --- | --- |
| Global API | all routes |
| `authLimiter` | register, login, refresh, logout, change-password — successful responses are not counted |
| `passwordResetLimiter` | forgot-password, reset-password |
| `formLimiter` | `POST /contact`, `POST /reservations` |

Exceeding a limit returns `429 RATE_LIMITED` with `RateLimit-*` headers.

---

## Health

### `GET /api/health`
Public. No auth.

`200` — `{ status: "ok", database: "connected", uptimeSeconds, timestamp }`
`503` — `error.code = "DATABASE_UNAVAILABLE"`, `success: false` (the envelope and the
status line agree).

---

## Auth — `/api/auth`

### `POST /api/auth/register`
Public. Sets both cookies.

```json
{ "name": "Ada Lovelace", "email": "ada@example.com",
  "password": "S3curePass", "confirmPassword": "S3curePass", "phone": "+1 555 0100" }
```

`password` is 8–72 chars with a lowercase, an uppercase and a digit. `phone` is optional.
`201` → `{ user }`. `409 DUPLICATE_KEY` when the email exists (case-insensitive).

### `POST /api/auth/login`
Public. `{ "email": "...", "password": "..." }` → `200 { user }` + cookies.
`401 INVALID_CREDENTIALS` — the message never reveals whether the email exists.

### `POST /api/auth/refresh`
Requires the `savora_rt` cookie. Rotates the pair → `200 { user }`.
`401 SESSION_REVOKED` / `INVALID_TOKEN` when the token was already rotated or is unknown.

### `POST /api/auth/logout`
Requires the refresh cookie. Removes that session and clears cookies → `200 { data: null }`.
Idempotent: a missing cookie is still `200`.

### `GET /api/auth/session`
Optional auth. `200 { user: null }` for guests, `200 { user }` when signed in.
Use this to boot the UI without a guaranteed 401 per page load.

### `GET /api/auth/me`
Protected. `200 { user }`. `Cache-Control: private, no-store`.

### `GET /api/users/me`
Alias of the above under the users router.

### `PATCH /api/users/me`
Protected. Any subset of:

```json
{ "name": "Ada L.", "phone": "+1 555 0100",
  "defaultAddress": { "line1": "1 Main St", "city": "New York",
                      "state": "NY", "zip": "10001", "instructions": "Ring twice" } }
```

`200 { user }`, `422` for an empty body or an invalid field. Role and email are not
writable — mass assignment of `role` is impossible.

### `POST /api/auth/change-password` · `POST /api/users/me/password`
Protected. `{ currentPassword, newPassword, confirmPassword? }`.
`200` + fresh cookies; every other session is revoked. `401` when the current password is wrong.

### `POST /api/auth/forgot-password`
Public, rate-limited. `{ email }`. Always `200` with the same sentence.
Outside production the body adds `data.devResetUrl` (mail is not wired — see
`DEPLOYMENT.md` §6).

### `POST /api/auth/reset-password`
Public, rate-limited. `{ token, password }` → `200`, cookies cleared, all sessions revoked.
`400 INVALID_TOKEN` when the token is unknown or expired.

### User object

```json
{ "id": "665f…", "_id": "665f…", "name": "Ada Lovelace", "email": "ada@example.com",
  "phone": "", "role": "customer", "isActive": true,
  "defaultAddress": { "line1": "", "city": "", "state": "", "zip": "", "instructions": "" },
  "lastLoginAt": "2026-11-26T10:00:00.000Z", "createdAt": "…", "updatedAt": "…" }
```

`passwordHash`, `refreshTokens` and reset-token fields are never serialised.

---

## Menu — `/api/menu` (public reads)

### `GET /api/menu`
| Query | Type | Default |
| --- | --- | --- |
| `page` | 1…10000 | 1 |
| `limit` | 1…100 | 12 |
| `search` | string ≤ 80 | — (regex over name, description, ingredients) |
| `category` | `Prime Cuts` \| `Signatures` \| `Starters` \| `Desserts` \| `Sides` \| `Drinks` | — |
| `minPrice` / `maxPrice` | number, dollars | — |
| `available` | `true` \| `false` | — |
| `featured` | `true` \| `false` | — |
| `sort` | `newest` \| `name` \| `price_asc` \| `price_desc` \| `rating` | `newest` |

`200` → `data: [menuItem]` + `meta`. A dish serialises `price` (dollars) alongside
`priceCents`, plus `id`, `name`, `slug`, `description`, `category`, `imageUrl`,
`imageAlt`, `ingredients[]`, `allergens[]`, `dietaryTags[]`, `details[]`, `rating`,
`tier`, `isAvailable`, `isFeatured`, `prepMinutes`, `sortOrder`, timestamps.

### `GET /api/menu/categories`
`200` → `[{ category, count, minPriceCents, maxPriceCents }]` for every category that
has dishes, ordered by lowest price.

### `GET /api/menu/:idOrSlug`
`200 { menuItem }`, `404 MENU_ITEM_NOT_FOUND`.

### Admin menu writes (also available under `/api/admin/menu/:id`)

| Method | Path | Body |
| --- | --- | --- |
| `POST` | `/api/menu` | full dish — `name` 2–90, `description` 10–600, `category`, `price` (dollars), `imageUrl`, optional arrays/flags |
| `PATCH` | `/api/menu/:id` | any subset of the same fields, at least one |
| `PATCH` | `/api/menu/:id/availability` | `{ "isAvailable": false }` |
| `DELETE` | `/api/menu/:id` | — |

`201` on create, `200` otherwise, `422` on invalid payloads, `403` for non-admins.
`slug` is generated from the name and kept unique.

---

## Cart — `/api/cart` (protected)

The cart is server-side and priced by the server. `priceCents` in a request is always ignored.

`GET /api/cart?type=pickup|delivery` — `type` only selects the delivery fee.
All cart routes return the same shape:

```json
{ "id": "665f…",
  "items": [{ "menuItem": { "id": "…", "name": "…", "slug": "…", "category": "…",
                            "imageUrl": "…", "priceCents": 4200, "isAvailable": true },
              "quantity": 2, "unitPriceCents": 4200, "lineTotalCents": 8400,
              "isAvailable": true, "reason": null }],
  "totals": { "subtotalCents": 8400, "taxCents": 746, "deliveryFeeCents": 0,
              "totalCents": 9146, "itemCount": 2, "currency": "usd", "taxRate": 0.08875 },
  "updatedAt": "…" }
```

| Method | Path | Body | Notes |
| --- | --- | --- | --- |
| `GET` | `/api/cart` | — | `Cache-Control: private, no-store` |
| `POST` | `/api/cart/items` | `{ menuItemId, quantity = 1 }` | merges lines; `409 ITEM_UNAVAILABLE`; max 20 per line, 40 lines |
| `PATCH` | `/api/cart/items/:menuItemId` | `{ quantity }` | 1–20 |
| `DELETE` | `/api/cart/items/:menuItemId` | — | `404 CART_ITEM_NOT_FOUND` |
| `DELETE` | `/api/cart` | — | empties the cart |

Unavailable lines stay visible but are excluded from the totals and block checkout
with `409 ITEMS_UNAVAILABLE`.

---

## Orders — `/api/orders` (protected)

### `POST /api/orders`
```json
{ "type": "delivery", "name": "Ada Lovelace", "email": "ada@example.com",
  "phone": "+1 555 0100", "notes": "Leave at the door",
  "deliveryAddress": { "line1": "1 Main St", "city": "New York",
                       "state": "NY", "zip": "10001", "instructions": "" } }
```

`delivery` requires `phone` and `deliveryAddress` (ZIP must be `12345` or `12345-6789`).
Totals are recomputed from the cart; the cart is emptied on success.
`201` → order with `orderNumber` `SAV-YYYYMMDD-NNNN`.
`400 CART_EMPTY`, `409 ITEMS_UNAVAILABLE`.

### `GET /api/orders`
Owner-scoped. `page`, `limit` (default 10), `status`, `type`, `search` → `data[]` + `meta`.

### `GET /api/orders/:id`
Owner or admin. `403 ORDER_FORBIDDEN` for another customer's order, `404 ORDER_NOT_FOUND`
if absent.

### `POST /api/orders/:id/cancel`
Owner or admin. `{ reason? }`. A customer may cancel only while `pending` or `confirmed`
(`409 ORDER_NOT_CANCELLABLE` otherwise); an admin cannot cancel a `delivered` or
`out_for_delivery` order. Re-cancelling returns `409 ORDER_ALREADY_CANCELLED`.

### Order object

```json
{ "id": "665f…", "orderNumber": "SAV-20261126-4176", "user": "665f…",
  "items": [{ "menuItem": "665f…", "name": "…", "imageUrl": "…",
              "unitPriceCents": 4200, "quantity": 1, "lineTotalCents": 4200 }],
  "type": "pickup", "status": "pending",
  "contact": { "name": "…", "email": "…", "phone": "" },
  "notes": "", "subtotal": 42, "tax": 3.73, "deliveryFee": 0, "total": 45.73,
  "subtotalCents": 4200, "taxCents": 373, "deliveryFeeCents": 0, "totalCents": 4573,
  "currency": "usd",
  "payment": { "provider": "none", "status": "unpaid", "intentId": "", "paidAt": null },
  "statusHistory": [{ "status": "pending", "at": "…", "by": null, "note": "" }],
  "cancelledAt": null, "cancelReason": "", "estimatedReadyAt": null,
  "createdAt": "…", "updatedAt": "…" }
```

Money exists as integer cents (authoritative) and as dollars (`subtotal`, `tax`,
`deliveryFee`, `total`) for display. Item fields are snapshots: changing the menu later
never alters a placed order.

---

## Reservations — `/api/reservations`

Seatings are every 30 minutes from 17:00 to 21:30; the restaurant is closed on Mondays.

### `GET /api/reservations/availability?date=YYYY-MM-DD`
Public. `200` →

```json
{ "date": "2026-12-04",
  "slots": [{ "time": "19:30", "label": "Fri, Dec 4 · 7:30 PM", "capacity": 24,
              "booked": 8, "seatsLeft": 16, "available": true }] }
```

`422 VALIDATION_ERROR` for a malformed date. `400 BAD_REQUEST` with `details.field =
"date"` for a past date, a Monday (closed) or a date beyond `RESERVATION_LEAD_DAYS`.
A seating less than 30 minutes away is returned with `available: false`.

### `POST /api/reservations`
Public, rate-limited, optional auth (a signed-in guest gets the booking linked to their account).

```json
{ "name": "Ada Lovelace", "email": "ada@example.com", "phone": "+1 555 0100",
  "date": "2026-12-04", "time": "19:30", "partySize": 4,
  "occasion": "Birthday", "notes": "Window table please" }
```

`201` → reservation with `reservationCode` `SV-XXXXXX`, status `pending`.
`409 SLOT_FULL` (capacity is claimed atomically), `409 DUPLICATE_RESERVATION`,
`400 BAD_REQUEST` for a party size over `RESERVATION_MAX_PARTY`, a past date, a Monday
or a seating under 30 minutes away, and `422` for an unknown seating time or a malformed
field.

The API records a *request*: the UI must say "we will confirm", never "confirmed".

### `GET /api/reservations/mine`
Protected. `page`, `limit` (10), `status` → `data[]` + `meta`.

### `GET /api/reservations/:id`
Owner or admin.

### `POST /api/reservations/:id/cancel`
Owner or admin. `{ reason? }`. Releases the held seats.

### Reservation object

```json
{ "id": "665f…", "reservationCode": "SV-7K2M9Q", "user": null,
  "guest": { "name": "…", "email": "…", "phone": "" },
  "date": "2026-12-04", "time": "19:30", "startsAt": "2026-12-04T00:30:00.000Z",
  "partySize": 4, "occasion": "", "notes": "", "status": "pending", "source": "web",
  "statusHistory": [ { "status": "pending", "at": "…", "by": null, "note": "" } ],
  "cancelledAt": null, "cancelReason": "", "createdAt": "…", "updatedAt": "…" }
```

---

## Contact — `/api/contact`

### `POST /api/contact`
Public, rate-limited.

```json
{ "name": "Ada", "email": "ada@example.com", "phone": "",
  "subject": "General enquiry", "message": "At least ten characters.", "company": "" }
```

`subject` ∈ `General enquiry`, `Private dining`, `Large party`, `Feedback`, `Careers`,
`Accessibility`. `company` is a honeypot and must be empty. `message` is 10–2000 chars.
`201 { id, createdAt }`. The client IP is stored only as a salted hash.

### Admin inbox
| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/api/contact?page&limit&status&search` | `meta.unread` included |
| `GET` | `/api/contact/:id` | full message |
| `PATCH` | `/api/contact/:id` | `{ status?: new\|read\|replied\|archived, adminNote? }` |
| `DELETE` | `/api/contact/:id` | — |

Equivalent admin aliases: `GET /api/admin/messages`, `PATCH /api/admin/messages/:id`.

---

## Payments — `/api/payments`

Card payment is **not enabled**; without `STRIPE_SECRET_KEY` these routes fail closed.

| Method | Path | Auth | Result |
| --- | --- | --- | --- |
| `GET` | `/api/payments/config` | public | `200 { enabled: false, provider: "stripe", currency: "usd" }` |
| `POST` | `/api/payments/intents` | protected | `503 PAYMENTS_DISABLED` while unconfigured |
| `POST` | `/api/payments/verify` | protected | `{ orderId, paymentIntentId }` |
| `POST` | `/api/payments/confirm` | protected | alias of `/verify` |

`/api/payments/webhook` exists in `paymentService` but is not mounted on the router, so
`POST /api/payments/webhook` currently returns `404 ROUTE_NOT_FOUND`. Wire it together
with the Stripe keys.

---

## Admin — `/api/admin` (role `admin`, `403` otherwise)

| Method | Path | Query / body |
| --- | --- | --- |
| `GET` | `/api/admin/stats` | — |
| `GET` | `/api/admin/customers` | `page`, `limit` (20), `search` |
| `PATCH` | `/api/admin/customers/:id` | `{ isActive: boolean }` |
| `GET` | `/api/admin/orders` | `page`, `limit` (20), `status`, `type`, `search` |
| `PATCH` | `/api/admin/orders/:id/status` | `{ status, note? }` |
| `GET` | `/api/admin/reservations` | `page`, `limit` (20), `status`, `date`, `search` |
| `PATCH` | `/api/admin/reservations/:id/status` | `{ status, note? }` |
| `GET` | `/api/admin/messages` | `page`, `limit`, `status`, `search` |
| `PATCH` | `/api/admin/messages/:id` | `{ status?, adminNote? }` |
| `PATCH` | `/api/admin/menu/:id` | any subset of the dish fields |

Order pipeline (`409 INVALID_STATUS_TRANSITION` for anything else):

```
pending → confirmed → preparing → ready → out_for_delivery → delivered
   ↓          ↓
cancelled  cancelled
```

Reservations: `pending → confirmed → seated → completed`, with `cancelled` and
`no_show` reachable from the earlier states. Statuses that hold seats are `pending`,
`confirmed` and `seated`.

`GET /api/admin/stats` returns counts and revenue summaries for customers, orders,
reservations, messages, menu size and today's service.
