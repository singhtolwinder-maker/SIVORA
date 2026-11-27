# SAVORA — Initial Audit (Phase 1)

This is the Phase 1 audit record, written before repairs began. It is preserved as-is
except for a short status note per item, so the repair history stays honest. The full
engineering report is [`SAVORA_COMPLETE_ENGINEERING_REPORT.md`](SAVORA_COMPLETE_ENGINEERING_REPORT.md);
the API reference is [`docs/API.md`](docs/API.md).

Scope inspected: the whole repository, the local stack (Vite + Express + local MongoDB),
the deployed frontend on Vercel and the deployed API on Render. No edits were made during
this phase.

---

## 1. Confirmed problems

Each item was reproduced with a command, a browser session or a log line before it was
changed. "Fixed" here means a later phase corrected it; the evidence for the fix lives in
the report's defect register.

| ID | Severity | Evidence | Finding |
| --- | --- | --- | --- |
| C-1 | CRITICAL | `GET /api/admin/stats` and price filters returned `400 CastError`; traced to `mongoose.set("sanitizeFilter", true)` in `backend/src/config/db.js` | The global `sanitizeFilter` flag wrapped operator objects (`$in`, `$gte`, `$ne`) in `$eq`, so six endpoints failed with 400 once real data existed. |
| C-2 | HIGH (security) | Replayed a rotated refresh cookie against `/api/auth/refresh` → accepted | `bcrypt` truncates at 72 bytes and all JWTs for one user share that prefix, so old refresh tokens compared equal to new ones. A stolen cookie survived rotation. |
| P-1 | CRITICAL (production) | `https://savora-restaurant-five.vercel.app` served an empty menu; `/api/menu` returned `total: 0` on Atlas | The production Atlas database had never been seeded. An empty cluster connects successfully, so nothing failed loudly. |
| H-7 | HIGH (production) | `curl -o /dev/null -w "%{http_code}" .../admin` → `404 NOT_FOUND` while `/` and `/api/health` returned 200 | `vercel.json` had a `/api` rewrite but no SPA fallback, so Vercel looked for a file named `admin` and served its own 404 before the bundle loaded. |
| H-3 | HIGH | Clicking anything did nothing while the page looked complete | `src/components/ui/Preloader.jsx` removed its full-screen overlay only via a Motion exit animation; with animation frames throttled the overlay stayed mounted and swallowed every click. |
| H-5 | HIGH | Browser showed `502`; `backend` process absent | The API connected to Mongo before listening and called `process.exit(1)` when Mongo was not ready yet. |
| H-4 | HIGH | `http://127.0.0.1:5173` refused connections; `localhost` worked | Vite's default host resolved to IPv6 `::1` on Windows. |
| H-2 | HIGH (process) | Suite green while production returned 400 (C-1) | Tests never imported `src/config/db.js`, so production Mongoose settings were never active under test. |
| H-6 | HIGH | No cart, checkout, account or dashboard component existed in `src/` | Those features were backend-only; no UI called them. |
| H-1 | HIGH | `backend/.env.example` published the seeded admin password | The seed script had a hardcoded dev fallback used in every environment. |
| P-2 | HIGH | Cookie was hardcoded `sameSite: "lax"` in `backend/src/utils/cookies.js` | A genuine cross-site deployment (frontend and API on different sites) could not authenticate. |
| M-3 | LOW | Cart drawer did not open after sign-in; empty checkout form rendered | Context value memoised without `cartOpen`/`accountOpen`; checkout form mounted unconditionally. |
| M-2 | LOW | Unlimited refresh/logout attempts accepted | No limiter on those two auth routes. |
| L-1 | LOW | `paymentService.verifyPayment` accepted an intent belonging to a different same-amount order | `metadata.orderId` was never compared. |
| L-2 | LOW | Health endpoint answered 503 with `success: true` | Envelope was built by the success helper. |
| L-3 | LOW | Boot log warned about the default IP hash salt | `IP_HASH_SALT` unset, so contact IP hashes used the public dev value. |
| L-4 | LOW | `PATCH` profile response lacked a cache header | Unlike `/auth/me`, the response was cacheable. |

### The reported "Origin is not allowed." / 403

Traced to two guards, both reading one exact-match allowlist:

* `backend/src/app.js:33` — the `cors()` origin callback returns
  `ApiError.forbidden("Origin is not allowed.", "ORIGIN_NOT_ALLOWED")`.
* `backend/src/middleware/requestContext.js:24` — a second guard returning
  `"Request origin is not allowed."` with the same code.

Both run before the routers, which is why a missing allowlist entry blocks writes with a
403 while GETs without an `Origin` header still succeed. Reproduced by sending a request
with a foreign `Origin`, and the allowed origin was accepted. Against the **current**
deployment the Vercel origin preflights with `204` and reaches validation, so the deployed
allowlist was already correct: the 403 was a configuration failure mode, not a bug
reproducible in production at audit time. What actually made production look broken was
P-1, an unseeded database. Wildcard CORS was explicitly rejected as a fix.

---

## 2. Potential risks

| Risk | Why it matters |
| --- | --- |
| `CLIENT_ORIGINS` is a single exact-match list | Any domain or preview-URL change silently produces the 403 until the variable is updated. Needs documenting, not loosening. |
| Seeded admin password | Until the owner rotates it and removes `SEED_ADMIN_PASSWORD` from Render, a known credential exists. |
| `IP_HASH_SALT` default | Contact-form IP hashes are reversible-ish with a public salt. |
| `SMTP_URL` absent from `backend/src/config/env.js` | `deliver()` throws and the caller swallows it, so the API implies an email that never sends. |
| Stripe integration present but unmounted | Webhook route has no raw-body signature verification mounted; a real charge is untested. |
| Atlas network access list and backups | Not inspectable without the owner's Atlas account; no restore drill has been run. |
| Single 610 kB JS chunk | `/admin` ships in the same chunk as the storefront; no route-level code splitting. |
| ESLint has no TypeScript parser | `npm run lint` fails on the three `.ts`/`.tsx` files, so lint cannot be a CI gate. |
| `vercel.json` hardcodes the Render hostname | Unavoidable in that file; moving the API requires editing and redeploying the frontend. |

---

## 3. Missing functionality

| Item | State at audit |
| --- | --- |
| Cart, checkout, customer account, admin dashboard UI | Backend existed; no frontend called it. |
| Customer profile editing screen | `PATCH /api/users/me` works; no UI. |
| Reviews | No model, route or UI. `MenuItem.rating` is a static editorial field. |
| Card payments | Code written, fails closed with `503 PAYMENTS_DISABLED`; no keys, webhook not mounted. |
| Transactional email | Console-only mailer; no provider configured. |
| Automated browser tests | No Playwright/E2E suite in the repository; ad-hoc harnesses were used instead. |
| Sitemap / robots / structured data | Absent. |
| Lighthouse or accessibility audit | Never run; no score exists. |

---

## 4. Existing working functionality

Verified by reading the code and exercising the local and deployed stacks:

* Express 5 API with helmet, rate limiting, Zod validation, a central error handler and
  `GET /api/health` reporting database state.
* MongoDB/Mongoose models with unique email, order-owner and reservation indexes.
* Registration, login, logout, session probe, password change and reset token flow.
* Role-based admin middleware on the server; the frontend gate is UX only.
* Menu read endpoints, categories, filters, dish rename and image handling.
* Reservation availability, atomic booking and duplicate guard.
* Cart and order endpoints with server-computed totals.
* Contact endpoint with IP hashing.
* The SAVORA black-and-gold storefront: hero, story, menu, gallery, testimonials,
  reservation, contact, footer, with Motion animations that respect reduced motion.
* Vercel `/api` proxy rewrite and a working production deploy pipeline from `main`.
* Build and production start both succeed locally.

---

## 5. Recommended repair order

The order actually followed, because each step unblocked the next:

1. C-1 and H-2 together — fix the query corruption and make the suite run under the same
   Mongoose configuration as production, otherwise every later "green" result is worthless.
2. P-1 — seed the production database so the deployed site has data to serve.
3. H-7 — restore the production `/admin` deep link at the hosting layer (SPA fallback),
   without touching routing or weakening auth.
4. H-5, H-4 — make the API survive a slow database start and make the dev server bind to
   IPv4 so local and production behaviour can be compared.
5. H-3 — remove the click-blocking overlay that made a working page feel frozen.
6. C-2, H-1, P-2, M-2, L-1, L-2, L-4 — security: token rotation digests, seed guard and
   admin reset, configurable `SameSite`, auth limiters, payment intent binding, error
   envelope, cache headers.
7. H-6, M-3 — build the missing customer and admin surfaces against the existing API
   contracts, and fix the context dependencies they exposed.
8. Documentation and gates — `README.md`, `DEPLOYMENT.md`, `docs/API.md`, `.env.example`
   files, then CI running the API suite and the production build on every push.
9. Owner-only items last: admin password rotation, `IP_HASH_SALT`, email provider, Stripe
   keys, Atlas access list and backups.

Verification for every step is recorded in the report's test table; local results and
production results are kept separate throughout.
