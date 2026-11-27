# SAVORA — Final Engineering Report

Status labels used throughout: **PASS**, **FIXED**, **FAILED**, **BLOCKED**, **NOT TESTED**.
Nothing is marked PASS unless it was executed and observed. Where a result comes from an
earlier session rather than a run today, it says so.

- Repository: `https://github.com/singhtolwinder-maker/SIVORA` — branch `main`
- Frontend: `https://savora-restaurant-five.vercel.app` (Vercel, static + SPA fallback)
- Backend: `https://savora-backend-4haz.onrender.com` (Render, Express 5)
- Database: MongoDB Atlas, database `savora`
- Report written after commit `c5e1f10`

---

## 1. Executive summary

The application is deployed and working end to end against real infrastructure. The
failure the owner originally reported — `403 /api/auth/login`, "Origin is not allowed." —
was a configuration failure mode, not an unconditional bug: the API only accepts origins
listed in `CLIENT_ORIGINS`, and the browser now reaches the API through a same-origin
`/api` rewrite on Vercel, so the request no longer crosses an origin boundary at all.
Wildcard CORS was rejected deliberately and explicitly.

The underlying reasons the site *felt* broken were engineering faults, and each was
reproduced before being fixed: Mongoose global `sanitizeFilter` collapsing `$in`/`$gte`
queries into 400s, refresh tokens stored as reversible digests, a missing SPA fallback that
made `/admin` a hard 404 on the host, an invisible preloader that swallowed clicks, a Vite
dev server bound to an unreachable address, and an unseeded production database.

This final pass added four things the earlier work had not: the redundant preload that
produced a Chrome warning on `/admin` was removed and the removal was measured against LCP;
the frontend now sends a real security-header set including a CSP; ESLint was repaired from
45 errors (three of them parse failures) to zero and became a CI gate; and the deployed
build was re-verified in a real browser across 16 functional checks with no console output.

Remaining gaps are not code: a production admin password to rotate, an email provider, a
payment contract, and one dependency advisory whose fix is a major upgrade.

---

## 2. Original project condition

A React 19 + Vite 8 storefront with Tailwind, Motion, and a second `/admin` entry point on
the same bundle, talking to an Express 5 + Mongoose API with JWT access/refresh cookies.
The visual layer was complete; the functional layer was not reliable.

Observed at the start of the recovery:

| Symptom | What was actually happening |
| --- | --- |
| `403 "Origin is not allowed."` on login | `CLIENT_ORIGINS` exact-match allowlist; the deployed origin was not in it, and the frontend was calling the API cross-origin |
| Menu empty in production, `502` earlier | Atlas database had no documents; the API was correct |
| `/admin` returned the host's 404 | `vercel.json` had an `/api` rewrite but no SPA fallback |
| Menu filters returned `400` | Global `sanitizeFilter` stripped `$in`/`$gte`, so price and category queries were malformed |
| Clicking did nothing | The preloader element covered the page and never released pointer events |
| `http://127.0.0.1:5173` refused | Vite bound to `localhost` (IPv6 `::1` on Windows) |
| Test suite could not run | `node --test tests/` is a directory import error on Node 22 |
| `npm run lint` failed | 45 errors, 3 of them parse failures in `.tsx` |

---

## 3. Complete audit findings

Audited: all 11 storefront sections, the shop surfaces (cart, checkout, account), `/admin`,
all 10 backend route groups, 11 models, 8 middleware modules, 20 validators, the Vite and
Vercel configuration, the Tailwind theme, both `package.json` files, `.github/workflows`, and
the live deployments over HTTP and in a real browser.

The single source of truth used throughout was runtime behaviour: HTTP responses from the
live services and a headless Chromium session against production, not source reading alone.

---

## 4. All discovered bugs

Severity, and where each was confirmed:

| ID | Bug | Severity | Confirmed by |
| --- | --- | --- | --- |
| C-1 | Global `sanitizeFilter` turned `$in`/`$gte` filters into broken queries → 400 on 6 endpoints | Critical | HTTP 400 reproduced locally, then covered by tests |
| C-2 | Refresh tokens stored with a reversible transform; comparison not constant-time | Critical | Code audit + regression test |
| H-1 | Seed script created an admin with a published default password in production | High | Code audit |
| H-2 | Test suite ran with development config, so production guards were untested | High | Test run output |
| H-3 | Preloader captured clicks | High | Browser reproduction |
| H-4 | Vite dev server unreachable on `127.0.0.1` | High | Browser reproduction |
| H-5 | No Mongo retry at boot; a slow Atlas start killed the process | High | Server log |
| H-6 | Cart, checkout, account and admin screens did not exist | High | Code audit |
| H-7 | Production `/admin` returned 404 | High | Production HTTP 404 |
| M-2 | No rate limiting on refresh/logout | Medium | Code audit |
| L-1 | Stripe intent not bound to the order it pays for | Low | Code audit |
| L-2 | Health check returned 200 while the DB was down | Low | Code audit |
| L-3 | Public `IP_HASH_SALT` default used silently | Low | Boot warning |
| L-4 | Authenticated profile response not marked private | Low | Header inspection |
| P-1 | Chrome: "resource preloaded but not used" on `/admin` | Low | Browser console on production |
| P-2 | Cookie `SameSite` not configurable | Low | Code audit |
| P-3 | Empty menu produced a silent, unexplained 200 | Low | Code audit |
| P-5 | No admin password recovery path | Low | Code audit |

---

## 5. Root cause of each issue

- **C-1** — the maintainer's reflex against NoSQL injection was applied globally instead of
  per-field. `sanitizeFilter` walks into operator objects and removes the operators the
  application legitimately builds, so filters became `{}` or invalid. Fixed by removing the
  global hook and relying on explicit `typeof`/allowlist validation in the validators, which
  is where untrusted input actually enters.
- **C-2** — token rotation "hashed" with a non-cryptographic transform. Replaced with
  SHA-256 digests compared with `timingSafeEqual`.
- **H-7** — the host serves static files; without a catch-all rewrite, a client-side route
  has no file. The fix belongs in hosting configuration, not in the router, and it does not
  weaken authentication: `/admin` still renders a sign-in gate and all admin APIs still
  return 401 to guests.
- **P-1** — `index.html` preloaded the storefront hero image globally, but `/admin` never
  mounts the storefront, so the preload was never consumed on that route. Chrome warns after
  a few seconds. The image already carried `fetchpriority="high"`, and measurement showed
  the LCP element is the H1 text, not the image, so the preload was pure overhead.
- **P-3** — an empty collection is indistinguishable from a healthy one by status code, so
  the server now logs an explicit warning when the menu is empty.

---

## 6. Files modified

Earlier recovery (summary): `backend/src/config/db.js`, `models/User.js`,
`services/paymentService.js`, `routes/auth.routes.js`, `routes/index.js`,
`controllers/authController.js`, `config/env.js`, `utils/cookies.js`, `server.js`,
`scripts/seed.js`, `scripts/reset-admin.js` (new), `backend/package.json`,
`tests/api.test.js`, `backend/audit/live-audit.mjs` (new), `backend/audit/e2e-flow.mjs`
(new), `backend/.env.example`, `src/lib/shop.jsx` (new), `src/lib/format.js` (new),
`src/components/shop/CartDrawer.jsx` (new), `src/components/shop/AccountPanel.jsx` (new),
`src/admin/AdminApp.jsx` (new), `src/components/{Menu,Navbar,Reservation,App}.jsx`,
`src/components/ui/Preloader.jsx`, `src/lib/api.js`, `vite.config.js`, `vercel.json`,
`.github/workflows/ci.yml` (new), `README.md`, `DEPLOYMENT.md`, `docs/API.md` (new).

This session:

| File | Change |
| --- | --- |
| `index.html` | removed the redundant hero-image preload |
| `vercel.json` | added CSP, `nosniff`, frame, referrer and permissions headers |
| `eslint.config.js` | TypeScript parsing; Node globals for build config and the API package |
| `package.json` / `package-lock.json` | added `typescript-eslint` dev dependency |
| `.github/workflows/ci.yml` | added the `Lint` gate before the production build |
| `src/components/Menu.jsx` | dish card unified into one surface with an inset action footer |
| `src/components/Features.jsx` | removed a stray empty decorative frame |
| `src/components/Footer.jsx` | removed an unused `Reveal` import |
| `src/components/ui/Reveal.jsx` | removed an unused `EASE` re-export |
| `src/components/ui/navigation-menu.tsx` | documented `react-refresh` scope for the shadcn export pattern |
| `src/components/ui/sushi-conveyor-menu.tsx` | documented imperative-rAF rule scope; extracted `hasDishes` |
| `backend/src/services/menuService.js` | dropped an unused parameter and a no-op directive |
| `backend/src/{server.js,services/authService.js,scripts/sync-indexes.js}` | dropped no-op lint directives |
| `backend/tests/api.test.js`, `backend/audit/live-audit.mjs` | dropped no-op lint directives |
| `SAVORA_AUDIT_INITIAL.md`, `docs/screenshots/*.png` | initial audit and production captures |

---

## 7. Changes implemented

**Correctness.** Operator-safe query construction, constant-time token comparison, atomic
reservation claiming, production-config test coverage, Mongo connection retry, and explicit
503 health reporting.

**Product.** A real cart and checkout (pickup and delivery, server-computed totals), customer
account with order and reservation history, and an admin dashboard for today's numbers,
reservations, orders, messages, customers and menu availability.

**Hosting.** SPA fallback for `/admin`, documented `/api` rewrite, and a security-header set.

**Tooling.** A CI workflow that runs the API suite, lint and the production build on every
push and pull request, with public failure annotations.

**Delivery.** Redundant preload removed after measuring that LCP is unchanged.

---

## 8. Security improvements

- **Secrets** — no `.env` file is tracked; `backend/.env.example` ships an empty seed
  password; production refuses to boot without distinct ≥32-character JWT secrets.
- **Tokens** — access tokens short-lived, refresh tokens rotated and stored as SHA-256
  digests compared in constant time.
- **Cookies** — `httpOnly`, `SameSite=lax` by default (configurable), `Secure` forced in
  production, session revocation on logout.
- **Authorisation** — every admin route is behind `requireAuth` + `requireRole("admin")`;
  every customer resource is scoped by `user._id`, never by a client-supplied id.
- **CORS** — explicit allowlist, wildcard rejected by the schema, credentials limited to
  listed origins.
- **Transport surface** — `helmet` on the API; the frontend now also sends
  `Content-Security-Policy` (`script-src 'self'`, Google Fonts allowed for styles/fonts,
  `frame-ancestors 'none'`), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
  `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, and Vercel's
  HSTS.
- **Input** — zod schemas per route, body size capped at 100 kB, IP-hash salt for rate-limit
  keys, `x-powered-by` disabled.
- **Rate limiting** — global API limiter plus stricter auth limiter, including refresh and
  logout.
- **Dependencies** — frontend production tree: 0 vulnerabilities. Backend production tree:
  1 high (`zod`, memory exhaustion while validating oversized constrained collections),
  carried forward as a known item because the fix is a major upgrade; exposure is limited by
  the 100 kB body cap and the global rate limiter.
- No secret value appears in any report, commit, log excerpt, or client bundle.

---

## 9. Frontend improvements

- Brand identity preserved: same warm-black palette, gold accents, cream serif type; no
  palette, type-scale or token change.
- Dish card: previously two disconnected boxes with a duplicated "tap the plate" hint; now a
  single bordered surface, image on top, inset footer with one "View details" and one "Add".
- Removed a decorative empty gold frame in the features panel that read as a broken element.
- Security headers added without breaking anything: verified that fonts, stylesheets,
  images and the same-origin API all still load under the CSP.
- Mobile: no horizontal overflow at 360 px; the mobile navigation dialog opens and closes.
- Accessibility touches already in place: labelled dialogs, `aria-expanded` on the menu
  toggle, decorative images with empty `alt`, focus-visible styles, reduced-motion handling.

---

## 10. Backend improvements

Express 5 with a consistent envelope (`{ success, data, meta }` on success; `{ success:false,
error: { code, message, details } }` on failure), request ids, centralised error handling,
health endpoint that reports database state, Stripe webhook mounted before the JSON parser so
signatures see raw bytes, and reset/recovery scripting that never prints a secret.

`menuService.listMenu` no longer accepts a parameter it never used; the empty-menu warning
in `server.js` now explains a silent failure mode.

---

## 11. Database verification

| Check | Result |
| --- | --- |
| Connection from the live API | **PASS** — `/api/health` → `{"status":"ok","database":"connected"}` |
| Seeded content | **PASS** — 13 menu items across 4 categories (Prime Cuts 3, Signatures 7, Starters 2, Desserts 1) |
| Indexes on hot paths | **PASS** (verified in an earlier session via `sync-indexes.js` output) |
| Booking concurrency | **PASS** — atomic claim and increment, covered by an API test |
| Production data changed by this pass | **None.** No writes, no migrations, no reseeds, no deletions |

---

## 12. Tests performed

1. Backend API suite — `cd backend && npm test` (56 tests, in-memory MongoDB 8.0.5).
2. Production build — `npm run build`.
3. Lint — `npm run lint` (was 45 errors, now 0 problems).
4. Live HTTP matrix against frontend and API: health, menu, categories, guest session,
   signed-out admin, signed-out me, CORS preflight from the production origin and from a
   foreign origin, login with invalid credentials, response headers.
5. Real-browser production journey — 16 checks (below).
6. Same journey against the freshly built bundle served with the production headers.
7. Console and network capture on `/` and `/admin` on production.
8. CSP validation: built app served with the exact `vercel.json` header set.
9. Performance measurement: FCP/LCP and hero-image timing, before and after the preload
   removal, three runs each.
10. Dependency audit, frontend and backend production trees.

Not run today: the 105-assertion live audit and the 45-assertion end-to-end journey
(they write records and are confined to a throwaway stack; both passed in an earlier
session).

---

## 13. Test results

**Backend suite — PASS.** 56 tests, 11 suites, 0 failures. Includes regressions for the
`sanitizeFilter` collapse, refresh-token digest comparison, cookie `SameSite` configuration,
production config guards, reservation claiming, admin aggregation queries and menu price
filters.

**Lint — PASS.** 0 errors, 0 warnings.

**Production journey — PASS, 16/16.**

| Check | Result |
| --- | --- |
| Home page renders one `h1` | PASS |
| Menu renders 13 cards | PASS |
| `PRIME CUTS` filter narrows grid to 3 | PASS |
| `ALL` restores 13 | PASS |
| Dish dialog opens with details | PASS |
| Dialog closes on Escape | PASS |
| Guest `/api/auth/session` → `{user:null}` | PASS |
| `/api/admin/stats` as guest → 401 | PASS |
| Reservation availability returns slots | PASS |
| No console errors on storefront | PASS |
| No horizontal overflow at 360 px | PASS |
| Mobile navigation opens | PASS |
| Mobile navigation closes | PASS |
| `/admin` renders the sign-in form | PASS |
| Invalid credentials rejected in the UI | PASS |
| No dashboard data leaks while signed out | PASS |

**Live HTTP matrix — PASS.**

| Request | Result |
| --- | --- |
| `GET /api/health` | 200, `database: connected` |
| `GET /api/menu` | 200, 13 items, meta total 13 |
| `GET /api/menu/categories` | 200, 4 categories with price ranges |
| `GET /api/auth/session` (guest) | 200, `user: null` |
| `GET /api/auth/me` (signed out) | 401 |
| `GET /api/admin/stats` (signed out) | 401 |
| `OPTIONS /api/auth/login`, Origin = production | 204 |
| `OPTIONS /api/auth/login`, Origin = `https://evil.example` | 403 |
| `POST /api/auth/login`, invalid credentials, production Origin | 401 (not `ORIGIN_NOT_ALLOWED`) |
| Frontend response headers | CSP, nosniff, DENY, referrer, permissions, HSTS all present |

**Console — PASS.** `/` and `/admin` on production: 0 console errors, 0 warnings, 0 failed
requests. The preload warning is gone from `/admin`.

**CSP — PASS.** With the exact production header set, `/` and `/admin` both render with 0
console messages, 0 CSP violations, 39 images with 0 broken, 13 menu cards loading through
`/api`, and Google Fonts applied (`"Playfair Display", Georgia, serif`).

**Performance — PASS (no regression).**

| Metric | Before preload removal | After | Note |
| --- | --- | --- | --- |
| LCP (avg of 3, 1440×900) | 2104 ms | 2047 ms | within noise; LCP element is the H1 text in both cases |
| FCP (avg of 3) | 848 ms | 701 ms | |
| Hero image `responseEnd` | 206 ms | 713 ms | later, as expected without a preload; not the LCP element |

**Dependency audit.** Frontend production tree: 0 vulnerabilities. Backend production tree:
1 high (`zod`) — see §17.

---

## 14. Build results

**PASS.** `vite build` completes in ~2.5–4 s:

```
dist/index.html                   1.44 kB │ gzip:   0.67 kB
dist/assets/index-CM3y8y4H.css   65.28 kB │ gzip:  12.20 kB
dist/assets/index-B69NRqge.js   609.68 kB │ gzip: 180.99 kB
```

The 500 kB chunk warning is expected for a single-bundle SPA and is recorded as technical
debt, not a failure.

---

## 15. Deployment results

**PASS.** Architecture: Vercel builds the frontend from `main` on push; Render runs the API
from the backend package; GitHub Actions gates both with tests, lint and build.

| Commit | Change | State |
| --- | --- | --- |
| `40167b2` | dish card unified, stray frame removed | Deployed, verified |
| `6675a29` | initial audit + six production screenshots | Pushed |
| `f0a950b` | preload removed, security headers added | Deployed, verified live |
| `c5e1f10` | lint repaired, CI lint gate added | Deployed, verified live |

Verification of the live deployment after `c5e1f10`: production serves
`assets/index-B69NRqge.js`; `/` and `/admin` return 200; all six security headers are present;
the 16-check journey passes against production with zero console output. GitHub Actions run on
`c5e1f10`: **success** — Backend tests, Lint and Frontend build all green.

---

## 16. Production URL

- Storefront: `https://savora-restaurant-five.vercel.app`
- Admin: `https://savora-restaurant-five.vercel.app/admin` (200, sign-in gate)
- API: `https://savora-backend-4haz.onrender.com/api` (also reachable same-origin at
  `/api` on the Vercel domain)
- Health: `https://savora-backend-4haz.onrender.com/api/health`

---

## 17. Remaining issues

| Item | Status | Detail |
| --- | --- | --- |
| `zod` high advisory | BLOCKED (known) | Memory exhaustion while validating oversized constrained collections; fix requires zod 4 (major, breaking). Mitigated by the 100 kB body cap and the global rate limiter. Deferred rather than risk the live API on an untested major upgrade. |
| Transactional email | NOT IMPLEMENTED | `SMTP_URL` is not in the env schema; mail is console-only while the API implies delivery |
| Stripe payments | NOT IMPLEMENTED | Code exists and fails closed; keys absent and the webhook route is written but not enabled end to end |
| Reviews | NOT IMPLEMENTED | No model, route or UI; `MenuItem.rating` is a static editorial field |
| Customer profile editing | NOT IMPLEMENTED | `PATCH /api/users/me` works; no screen calls it |
| Bundle size | OPEN | Single 610 kB chunk; `React.lazy` on `/admin` is the obvious split |
| Contrast / Lighthouse / axe | NOT TESTED | No audit was run, so no score is claimed |
| Production write journey | NOT TESTED | Registration → order → admin confirm was verified on a throwaway stack only; it was not repeated against production to avoid creating fake records |
| Admin password in a browser session | NOT TESTED | The admin API sign-in was verified earlier over HTTP, and the deployed sign-in screen renders and rejects bad credentials, but the real credentials were not typed into a page |

---

## 18. External actions still required

1. **Rotate the production admin password** at `/admin`, then remove `SEED_ADMIN_PASSWORD`
   from the Render environment. If it is lost, set a new value and run
   `npm run admin:reset` against the production `MONGODB_URI`.
2. **Set `IP_HASH_SALT`** to a private random value in the Render environment; the server
   warns at boot while the public default is in use.
3. **Email provider** — choose a transactional provider, add its URL as `SMTP_URL`, wire it
   into `backend/src/config/env.js`, then send one real password reset and one reservation
   confirmation.
4. **Payments** — contract Stripe, set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`,
   enable the webhook with raw-body signature verification, then test one real charge and a
   webhook replay.
5. **Atlas** — confirm a least-privilege database user, an IP access list matching Render's
   egress, and daily backups with one tested restore.
6. **`vercel.json`** — if the Render service URL changes, update the `/api` rewrite
   destination and redeploy; add any new exact origin to `CLIENT_ORIGINS`.
7. **Decide on reviews and profile editing** — both are documented as not implemented.

---

## 19. Final production readiness assessment

**Ready for production within its implemented scope.** The storefront, menu, cart, checkout,
reservations, contact, accounts and admin dashboard all work against real infrastructure, the
build and tests are green, lint and CI gate every push, the deployment is live and verified in
a real browser, and no secrets are exposed.

The application is **not yet feature-complete** for a restaurant that needs email receipts,
card payments and customer reviews: those three are unimplemented or unconfigured, and they
are the honest boundary of this delivery. They are not silent gaps — each is listed above with
what it would take to finish.

---

## 20. Independent re-verification — 27 November 2026

The whole verification set was re-run from a clean checkout state at commit `683135b`, with no
code changes, to confirm nothing had drifted. Every check below was executed today.

| Check | Command / method | Result |
| --- | --- | --- |
| Backend suite | `npm test` in `backend/` | **PASS** — 56 tests, 11 suites, 0 fail |
| Lint | `npm run lint` | **PASS** — exit 0, no output |
| Production build | `npm run build` | **PASS** — 2030 modules, `index-B69NRqge.js` 609.69 kB / 181.04 kB gzip |
| Deployed bundle identity | sha256 of local `dist/` vs served asset | **PASS** — identical (`3b9221ae…`) |
| Frontend root | `GET /` | **PASS** — 200 |
| Admin SPA fallback | `GET /admin` | **PASS** — 200, renders the sign-in gate |
| Security headers | response headers on `/` | **PASS** — CSP, `nosniff`, `DENY`, `Referrer-Policy`, `Permissions-Policy` |
| API health | `GET /api/health` | **PASS** — `database: connected` |
| Same-origin API rewrite | `GET /api/menu` via Vercel | **PASS** — 200 |
| Menu payload | `GET /api/menu?limit=100&available=true&sort=newest` | **PASS** — 13 items, `total: 13`, no duplicate slugs |
| Foreign-origin CORS | `OPTIONS` with `Origin: https://evil.example.com` | **PASS** — 403, no `Access-Control-Allow-Origin` |
| Foreign-origin write | `POST /api/auth/login` with foreign origin | **PASS** — 403 |
| Protected reads | `GET /api/cart`, `POST /api/menu` | **PASS** — 401 for both |
| Unknown API route | `GET /api/nope` | **PASS** — 404 |
| Invalid query | `GET /api/menu?limit=999` | **PASS** — 422 `VALIDATION_ERROR` with a field-level message |
| CI status | GitHub Actions, latest three commits | **PASS** — `683135b`, `c5e1f10`, `f0a950b` all green |

Live browser pass — Playwright, real Chromium at 1440×900 then 360×800, against production:

| Journey | Result |
| --- | --- |
| Menu renders one card per dish | **PASS** — 13 cards, 13 unique |
| Plate counter matches the card count | **PASS** |
| Dish dialog opens with the right dish | **PASS** — “Dry-Aged Tomahawk” |
| Dialog close button | **PASS** — closes, body scroll released |
| Dialog Escape key | **PASS** |
| Order drawer opens | **PASS** — “Your order / Sign in to start an order.” |
| Order drawer Escape key | **PASS** |
| In-page navigation anchors | **PASS** — all 9 resolve to real elements |
| Horizontal overflow at 360 px | **PASS** — 0 px |
| Console errors and warnings | **PASS** — none |

**12/12 journey checks passed, 16/16 network and API checks passed.**

### Two false alarms investigated and dismissed

During this pass the automation briefly reported two defects, and both were traced to the
inspection environment rather than to the application:

1. **“26 dish cards for 13 dishes.”** A DOM read taken mid-swap showed every dish twice. The
   menu initially renders the house fallback menu and replaces it with live API data; the
   `AnimatePresence` exit animation for the 13 outgoing cards had not finished at capture time.
   A delayed re-read showed 13 cards, and the Playwright pass — where animation frames actually
   run — confirmed 13. The duplicates were committed by the transition, not the data: the API
   returns 13 unique slugs for the exact URL the page requests.
2. **“The dish dialog does not close.”** The close button released React state but the node
   stayed in the DOM. The cause was `document.hidden === true` with **0** animation frames in
   one second inside the side-panel browser, so framer-motion never ran the exit animation. In a
   real Chromium the dialog closes on both the close button and Escape, and body scroll is
   restored.

Neither is a product defect. Both are recorded because an audit that silently drops its own
false positives is not trustworthy.

### Unchanged classification

Nothing in this re-verification alters the assessment in §17–§19. The remaining gaps are still
the owner-only items in §18: production admin password rotation, `SEED_ADMIN_PASSWORD` removal,
`IP_HASH_SALT`, a transactional email provider, the payment contract, Atlas access and backup
hardening, and the deliberate decisions on reviews and profile editing. The `zod` advisory
remains **BLOCKED**: its only fix is the semver-major `zod@4` upgrade, which changes the
validation layer wholesale and needs its own test pass.

## 21. Bundle splitting and scroll-lock remediation — 28 November 2026

### 21.1 What the 609 kB actually was

The number was real but its cause had never been measured. Building with a temporary
`generateBundle` reporter (since removed) and ranking modules by rendered size gave:

| Module | Size (pre-minify) | Verdict |
| --- | --- | --- |
| `react-dom/cjs/react-dom-client.production.js` | 517.1 kB | Framework floor, cannot be split away |
| `src/components/ui/sushi-conveyor-menu.tsx` | 51.8 kB | In use (rendered by `Menu.jsx`) |
| `motion-dom/.../create-projection-node.mjs` | 43.7 kB | Layout-projection feature of `motion` |
| `src/admin/AdminApp.jsx` | 40.5 kB | **Should never have been in the public entry** |
| `tailwind-merge/dist/bundle-mjs.mjs` | 37.2 kB | Used by `cn()` in the Radix nav menu |
| `src/components/shop/CartDrawer.jsx` | 29.8 kB | Public, opens on click |
| `@radix-ui/react-navigation-menu` | 28.4 kB | Public nav |
| `src/components/Menu.jsx` | 27.5 kB | Public |

So the bundle was not fat with stray dependencies: React plus ReactDOM is roughly
85% of the minified bytes, and the only genuine mistake was that the admin dashboard
— a screen no public visitor needs — shipped in the storefront entry.

### 21.2 Changes made

1. **Route-level split of the dashboard.** `src/App.jsx` now imports `AdminApp` through
   `React.lazy` inside a `Suspense` boundary. The fallback is a dark, centred
   `role="status"` line using the same tokens as the dashboard, so the split never
   flashes a white screen on the black-and-gold shell.
2. **Vendor chunking.** `vite.config.js` gained `build.rollupOptions.output.manualChunks`
   that separates `react`/`react-dom`/`scheduler` and `motion`/`motion-dom`/`motion-utils`
   into long-lived chunks. This is a caching change as much as a size change: after a site
   deploy, a returning visitor re-downloads only the app chunk, and the lazily loaded admin
   route reuses the same cached React instead of fetching a second copy.
3. **Lazy drawers were tried and reverted — with evidence.** `CartDrawer` and `AccountPanel`
   were split first, but instrumentation showed the browser requesting both chunks during the
   *first* render: the components read `useShop()` to decide whether they are open, so
   `Suspense` mounts them immediately. That produced extra chunks and a round trip on the first
   cart click while deferring nothing. They were returned to static imports, and the reasoning
   is recorded in a comment in `App.jsx` so the experiment is not repeated blindly.
4. **Reference-counted scroll lock.** See §21.4 — a real bug, found while verifying the split.

### 21.3 Measurements

| Build | Files | Raw | Gzip |
| --- | --- | --- | --- |
| Before | `index-B69NRqge.js` | 609.69 kB | 181.04 kB |
| After — entry | `index-BYgQuto2.js` | 213.66 kB | 58.07 kB |
| After — React vendor | `react-Ibbx6Gbr.js` | 210.53 kB | 65.70 kB |
| After — motion vendor | `motion-BFLdOOnU.js` | 161.84 kB | 55.07 kB |
| After — runtime | `rolldown-runtime-*.js` | 0.59 kB | 0.36 kB |
| After — admin (lazy) | `AdminApp-BFYr5MgE.js` | 24.48 kB | 5.22 kB |

- Public first load: **586.6 kB / 179.2 kB gzip**, down from 609.7 kB / 181.0 kB gzip
  (−23.1 kB raw, −1.8 kB gzip). Modest, and honestly reported: splitting cannot shrink React.
- The `/admin` payload (24.5 kB / 5.2 kB gzip) is no longer part of any
  public page load.
- Per-deploy cache transfer for a returning visitor drops from 181.0 kB to 58.1 kB gzip.
- The Vite "chunks larger than 500 kB" warning is gone; every emitted chunk is under 500 kB.
- CSS is unchanged at 65.28 kB / 12.20 kB gzip.

What is *not* claimed: total JavaScript on a cold first visit is essentially unchanged.
There is no honest way to remove ReactDOM's ~210 kB, and `motion`'s layout-projection code
would need a `LazyMotion`/`m` refactor across fifteen components to drop materially — a
behavioural change deliberately not attempted here.

### 21.4 Defect found during verification: the page could freeze after closing the cart

Verification of the split opened the cart drawer immediately after page load and found
`document.body.style.overflow === "hidden"` after the drawer had closed, with scrolling dead.

Root cause: six overlays each captured `document.body.style.overflow` when they opened and
wrote that captured value back when they closed. The preloader locks the body on mount; a
drawer opened while the curtain was still up therefore captured `"hidden"` as its "previous"
value and restored `"hidden"` on close, after the preloader had already released its own lock.
Last write won, and the page stayed frozen until another overlay cycle.

Fix: `src/lib/scrollLock.js` — a reference-counted lock with a single shared restore value,
released idempotently (React StrictMode runs cleanups twice). All seven call sites now use it:
`Preloader`, `Navbar` (mobile menu), `Menu` dish dialog, `Gallery` lightbox,
`sushi-conveyor-menu` dish dialog, `CartDrawer`, `AccountPanel`. No direct
`document.body.style.overflow` writes remain outside `scrollLock.js`.

Reproduction matrix in Chromium against the production build (`vite preview`):

| Scenario | Before | After |
| --- | --- | --- |
| Open drawer 2.5 s after load, close | `overflow=""`, scrolls | `overflow=""`, scrolls |
| Open drawer 250 ms after load (curtain up), close at 3 s | `overflow="hidden"`, **frozen** | `overflow=""`, scrolls |
| Open drawer 150 ms after load, close at 0.9 s | `overflow="hidden"`, **frozen** | `overflow=""`, scrolls |
| Scroll to 900 px after closing | 0 px | 900 px |

### 21.5 Verification run

| Check | Command | Result |
| --- | --- | --- |
| Production build | `npm run build` | **PASS** — 2032 modules, exit 0, no size warning |
| Lint | `npm run lint` | **PASS** — exit 0, no output |
| Backend regression suite | `cd backend && npm test` | **PASS** — 56/56 tests, 11 suites |
| Admin chunk isolation | Playwright, network log | **PASS** — `AdminApp-*.js` absent from `/`, present on `/admin` |
| Admin gate after split | Playwright | **PASS** — "House dashboard · Sign in with an administrator account", 2 inputs |
| Storefront menu | Playwright | **PASS** — 13 add-to-cart buttons, `<h1>` intact |
| Cart drawer | Playwright | **PASS** — opens, "Sign in to start an order.", closes (0 dialogs) |
| Mobile 360 px | Playwright | **PASS** — 0 px horizontal overflow |
| Console / page errors | Playwright | **PASS** — 0 `pageerror` on `/`, `/admin`, 360 px. The only console errors are `502` for `/api/*`, because `vite preview` has no proxy; on Vercel that path is rewritten to the API (§15) |

The renderer was exercised in real Chromium, not the side preview panel, so the
animation-throttling artefact described in §20 did not apply.

### 21.6 Files changed

`src/App.jsx`, `vite.config.js`, `src/lib/scrollLock.js` (new),
`src/components/ui/Preloader.jsx`, `src/components/Navbar.jsx`, `src/components/Menu.jsx`,
`src/components/Gallery.jsx`, `src/components/shop/CartDrawer.jsx`,
`src/components/shop/AccountPanel.jsx`, `src/components/ui/sushi-conveyor-menu.tsx`.
No component was restyled, no feature removed, no dependency added or upgraded.

### 21.7 Classification

- **Fixed and verified:** admin dashboard removed from the public bundle; React and motion
  vendor chunks; the scroll-lock freeze (three reproduction scenarios + scroll assertion).
- **Fixed but not yet verified in production:** all of the above, locally. The committed
  build has not been deployed — see §21.8.
- **Still unresolved:** cold-load JavaScript is 586.6 kB because ReactDOM dominates; a
  further reduction needs a `LazyMotion` refactor of `motion` usage (estimated 25–35 kB gzip)
  and is a separate, risky change. The 51.8 kB `sushi-conveyor-menu` is genuinely rendered
  and was not removed. `tailwind-merge` (37.2 kB pre-minify) is only needed for the Radix nav
  menu's `cn()` merging and was left alone.
- **Requires approval:** `git push` and a Vercel production deployment. Nothing was pushed,
  no deployment was triggered, and no production data was modified.

### 21.8 Deployment and owner-only follow-ups (pending approval)

To verify these fixes in production, explicit approval is required to (a) push the local
commit to `origin/main` and (b) trigger a Vercel production deployment of the frontend.
Nothing has been pushed and no deployment has been triggered.

Owner-only configuration items that remain outside this change (§18):

- Rotate the production admin password and remove `SEED_ADMIN_PASSWORD` from the environment.
- Set `IP_HASH_SALT` for hashed IP logging.
- Configure the SMTP provider for transactional email.
- Add Stripe keys and the webhook endpoint.
- Move Atlas to a least-privilege user and enable backups.

Blocked (not attempted): the `zod` high advisory, which requires a semver-major upgrade to
`zod@4.6.7` plus a full retest of the validation layer. Deferred: a `LazyMotion`/`m` refactor
across ~15 components (est. 25–35 kB gzip), a separate, behavioural change.
## 22. Production release and live verification — 27 November 2026

This section records the first release made under explicit authorisation: the verified commit was
pushed to GitHub, deployed to Vercel production, and then inspected in a real browser at five
widths. Nothing in it is inferred from a successful build; every claim below names the check that
produced it.

### 22.1 Release identity

| Item | Value |
| --- | --- |
| Repository | `https://github.com/singhtolwinder-maker/SIVORA` |
| Branch pushed | `main` → `origin/main` (fast-forward, no force, no history rewrite) |
| Commit | `cf2f443ab2d48ef51043943a711274b18a3d563a` |
| Remote after push | `git fetch` + `git rev-parse origin/main` returned the same SHA |
| Vercel project | `savora-restaurant` (`prj_MdGBrQEzh5sAhhqbwYilBQXRsAmZ`), owner `singhtolwinder-maker` |
| Framework / production branch | Vite / `main` |
| First deployment (CLI, `vercel --prod`) | `dpl_47RWwpjarwaih3RMRrvghCAhpSzf`, target `production`, `READY` |
| First deployment created | 2026-11-27 10:29:44 UTC (15:29:44 IST), build → ready 7.7 s |
| Deployment now live | `dpl_4b4zZCZ8tjMxdg1wikm2ii4PTHpr`, target `production`, `READY` |
| Live deployment created | 2026-11-27 10:47:16 UTC (16:17:16 IST), triggered by the Git integration on push |
| Deployment URL | `https://savora-restaurant-935w05fhv-singhtolwinder-maker.vercel.app` |
| Production alias | `https://savora-restaurant-five.vercel.app` (plus `-singhtolwinder-maker` and `-git-main-singhtolwinder-maker`) |

The first deployment was produced by `vercel --prod` from the working tree of `cf2f443`, not by
Vercel's Git integration, so its metadata carries no commit SHA. Identity was established by content
instead: the served HTML references `index-BYgQuto2.js`, `react-Ibbx6Gbr.js`, `motion-BFLdOOnU.js`,
`rolldown-runtime-WkwZ5CU-.js` and `AdminApp-BFYr5MgE.js` — byte-for-byte the asset names emitted by
`npm run build` on `cf2f443` (§21.3). A different commit or a stale build would have produced
different hashes.

Pushing the report commit `ea9b50a` then made Vercel's Git integration build and promote a second
deployment automatically. `ea9b50a` changes only `SAVORA_FINAL_ENGINEERING_REPORT.md` and
`.gitignore`, so its asset hashes are identical; the alias was re-fetched after the switch and still
returns `index-BYgQuto2.js`. Production therefore matches `HEAD` (`ea9b50a`) and the deployed
application code is exactly the `cf2f443` build.

### 22.2 Pre-release gate

Run in this order, on a clean tree, before anything was pushed.

| Gate | Command | Result |
| --- | --- | --- |
| Working tree | `git status --porcelain` | **PASS** — empty |
| Commit present | `git cat-file -t cf2f443` | **PASS** — `commit`, full SHA above |
| Production build | `npm run build` | **PASS** — 2032 modules, exit 0, no chunk-size warning |
| Lint | `npm run lint` | **PASS** — exit 0, no output |
| Backend suite | `cd backend && npm test` | **PASS** — 56/56 tests, 11 suites |
| Secret scan (tracked files) | `git grep -E "sk_live\|sk_test\|AKIA…\|ghp_\|xox[baprs]-\|BEGIN … PRIVATE KEY\|mongodb+srv://[^<]"` | **PASS** — no matches; only `.env.example` templates are tracked |
| Secrets in served bundles | `curl` each of the four emitted JS files, grep for `VERCEL_OIDC`, `eyJhbGciOi`, `sk_live`, `mongodb+srv` | **PASS** — 0 matches in all four |
| Remote / project | `git remote -v`, `vercel projects ls`, `vercel project inspect` | **PASS** — expected repo, expected project, `main` |

`vercel link` wrote a local `.env.local` containing a deployment OIDC token, and extended
`.gitignore` with `.vercel` and `.env*`. That `.gitignore` change is kept (it is the correct
hygiene); the token file was deleted after confirming no secret reached any served asset.

Vercel environment variables were listed by name only: the project holds a single secret,
`CLIENT_ORIGINS`, which belongs to the API's CORS allow-list rather than to Vite. The frontend needs
no `VITE_*` variable in production because it calls `/api` on its own origin and `vercel.json`
rewrites that path to `https://savora-backend-4haz.onrender.com/api/:path*` (§15). No value was read
or printed.

### 22.3 Response headers as served

```
HTTP/1.1 200 OK
Cache-Control: public, max-age=0, must-revalidate
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'
  https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:;
  connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
```

`connect-src 'self'` is still correct because the browser only ever talks to the site's own origin;
the API is reached through the rewrite. Observation, not a defect: hashed files under `/assets/` are
served with `max-age=0, must-revalidate` rather than a long `immutable` lifetime, so a returning
visitor revalidates each asset (cheap `304`s) instead of skipping the request. The bandwidth claim in
§21.3 — 181.0 kB → 58.1 kB gzip per deploy — still holds; only the round trips differ. Left
unchanged deliberately, as it is not release-blocking.

### 22.3b Re-verification after the second deployment

Because the alias moved to a new deployment after the first sweep, the checks were repeated against
the promoted one rather than assumed to carry over.

| Check | 1440×900 | 390×844 |
| --- | --- | --- |
| Horizontal overflow | none | none |
| Dish cards | 13 | 13 |
| Broken images | 0 | 0 |
| Console / page errors | 0 | 0 |
| Failed requests (`status >= 400`) | 0 | 0 |
| `GET /api/menu`, `GET /api/auth/session` | 200, 200 | 200, 200 |
| Cart drawer opens, closes to 0 dialogs | yes, `overflow=""` | yes, `overflow=""` |
| `scrollTo(0, 800)` after closing | 800 px | 800 px |
| `/admin` gate (1440) | "House dashboard", 2 inputs, 0 console errors | — |
| `GET /api/health` | 200, `{status:"ok", database:"connected"}` | — |

### 22.4 Live inspection

Real Chromium (Playwright 1.65.1, headless) against the production alias. The side preview panel was
not used for verdicts: it reports `document.hidden` and pauses `requestAnimationFrame`, which stalls
motion exits (§20).

| Width | Height | Page height | Horizontal overflow | Broken images | Console errors | Failed requests |
| --- | --- | --- | --- | --- | --- | --- |
| 1440 | 900 | 12,772 px | none | 0 | 0 | 0 |
| 1366 | 768 | 12,745 px | none | 0 | 0 | 0 |
| 768 | 1024 | 17,793 px | none | 0 | 0 | 0 |
| 390 | 844 | 21,326 px | none | 0 | 0 | 0 |
| 360 | 780 | 20,869 px | none | 0 | 0 | 0 |

`scrollWidth === clientWidth` at every width, including with the mobile menu open. 13 dish cards
rendered at every width. Header items were additionally measured for overlap at 1366 and 1024: 11
interactive elements, zero overlapping pairs, no clipping.

Areas inspected, all against the live site:

1. **Homepage / hero** — headline, eyebrow, CTAs, the "Tonight at SAVORA" card, stats rows. Text wraps
   cleanly at 360; no element escapes the viewport.
2. **Navigation** — desktop bar, the "Tonight's Menu" dropdown (opens on hover, lists Kitchen hours,
   Full menu, Prime Cuts $58–$145, House Signatures $22–$36, Starters & Sides $12–$18, Dessert &
   Cellar from $12), mobile hamburger overlay at 768 / 390 / 360 (10 interactive items, no overflow).
3. **Menu and conveyor** — plates render with dish photography, gold rims, an enlarged active plate, a
   label pill and caption, plus prev/pause/next controls. Belt measured 864×270 at 1440, 639×254 at
   768, 298×245 at 390; 13 plates at every width.
4. **Food imagery and cards** — every card image loaded (`naturalWidth > 0`, `object-cover`, no
   distortion); category filters verified: PRIME CUTS returns exactly the three prime cuts, ALL
   returns 13.
5. **Cart and checkout entry** — drawer opens from the header, shows the signed-out state
   ("Sign in to start an order"), and closes with Escape. **The §21 scroll-lock fix holds in
   production**: after closing, `body.overflow` is `""` and `scrollTo(0, 900)` lands at 900 px.
6. **Sign in / registration** — header "Sign in" opens the order drawer in sign-in mode; switching to
   Create account exposes name, email, password (with the stated rule) and optional phone.
7. **Reservation** — inline validation fires on an empty submit ("Please tell us your name.", "We need
   an email to confirm.", "Choose a date.", "Choose a seating time.") with zero network calls, and a
   complete payload reaches the confirmation view ("Table requested").
8. **Admin login** — `/admin` renders the dark "House dashboard" gate with email and password fields
   at 1440 and at 390 (form 353 px wide, no overflow).
9. **Admin management pages** — not reachable without administrator credentials; see §22.8.
10. **Footer and links** — address, hours, four link columns, social links, the "Write to us" form and
    the closing CTA. Every internal anchor (`#home #menu #story #chef #gallery #reviews #experiences
    #contact #reserve`) resolves to an existing element.

### 22.5 Functional verification

| Check | Method | Result |
| --- | --- | --- |
| Backend health via the site's rewrite | `GET /api/health` | **PASS** — 200, `{status:"ok", database:"connected"}` |
| Backend health direct on Render | `GET https://savora-backend-4haz.onrender.com/api/health` | **PASS** — 200, same payload |
| Menu data | `GET /api/menu?limit=3&available=true` | **PASS** — 200, real dish documents |
| Anonymous session | `GET /api/auth/session` | **PASS** — 200, `{user:null}` |
| Admin API protection | `GET /api/admin/reservations` (no cookie) | **PASS** — 401 `AUTH_REQUIRED` |
| Bad password rejected | `POST /api/auth/login` with a wrong password | **PASS** — 401 `INVALID_CREDENTIALS` |
| Registration | UI form → `POST /api/auth/register` | **PASS** — 201, session now returns the user, header switches to "Your account" |
| Signed-in cart | UI "ADD" → `POST /api/cart/items` | **PASS** — 200, line created |
| Account panel | Header → Your account | **PASS** — name, email, Orders / Reservations / Sign out tabs load |
| Sign out | UI → `POST /api/auth/logout` | **PASS** — 200, session back to `{user:null}` |
| Dish dialog | "View details" on Dry-Aged Tomahawk | **PASS** — image, price, specs, ADD TO ORDER, RESERVE A TABLE; closes to 0 dialogs, body unlocked |
| Gallery lightbox | First tile | **PASS** — "01 / 08 The dining room", 1392×752 image, Escape closes |
| Back to top | Footer/scroll control | **PASS** — returns `scrollY` to 0 |
| Contact form validation | Empty submit | **PASS** — three inline errors, zero network calls |
| Contact form payload | Filled submit, request intercepted | **PASS** — correct JSON body, "Message received" state |
| SPA fallback | `GET /does-not-exist` | **PASS** — 200, storefront renders, no console errors |

### 22.6 Screenshot evidence

Captured at `E:\AI website trial 1\qa-screenshots` (deliberately outside the repository so the repo
keeps no binary QA assets):

- `desktop-1440-home.png`, `laptop-1366-home.png`, `tablet-768-home.png`, `mobile-390-home.png`,
  `mobile-360-home.png` — full-page captures at each width.
- `sections/{1440,768,390}-*.jpg` — per-section captures: hero, menu, story, chef, gallery, reviews,
  experiences, reservation.
- `mobile-390-mobile-menu.png`, `mobile-360-mobile-menu.png` — open hamburger overlay.
- `belt-01-viewport.png`, `belt-390.png`, `belt-768.png` — the conveyor with real dish photography.
- `interaction-1440-cart.png`, `auth-01-filled.png`, `auth-03-cart-signed-in.png`,
  `auth-04-account-panel.png` — order drawer and account flow.
- `flow-reservation-invalid.png`, `flow-reservation-success.png` — validation and confirmation.
- `interaction-1440-admin-gate.png`, `admin-390-gate.png` — the dashboard gate.
- `int-01-nav-dropdown.png`, `int-03-dish-dialog.png`, `int-04-lightbox.png` — navigation, dish
  dialog, gallery lightbox.
- `footer-1440-bottom.png` — footer, contact form and closing CTA.

Machine-readable results are alongside them: `qa-report.json`, `flow-report.json`,
`auth-report.json`, `interact-report.json`, `final-report.json`.

### 22.7 Defects found

**None that warranted a code change.** Two things looked like defects during the sweep and were
disproved; both are recorded so the next inspection does not repeat the cost.

1. **Empty conveyor plates.** Per-section element screenshots showed 13 blank dark circles, which
   reads as "dish photography missing". A viewport capture with the animations running showed the
   plates fully populated, and the DOM agreed: images `complete`, `naturalWidth` 700–1024,
   `checkVisibility()` true, `object-cover`, no filter or mask. The blank plates were an artefact of
   element screenshots of a tall, animated section, not a rendering bug.
2. **"Registration sends no request."** The first attempt clicked the *Create account* mode tab rather
   than the submit button, because both carry the accessible name "Create account". Targeting
   `button[type="submit"]` produced `201 /api/auth/register`. The site was correct; the test selector
   was not.

A text-overflow detector flagged the belt plate buttons (`scrollWidth` 103–206 vs `clientWidth` 103).
Those are absolutely positioned hover labels inside an `overflow: visible` circular button that only
appear on hover, so the flag is a false positive of the heuristic, not visible clipping.

No layout, spacing, typography, colour, image or animation defect was observed at any of the five
widths, and the black-and-gold identity is intact throughout.

### 22.8 What was deliberately not done

- **Authenticated admin pages.** No administrator credentials exist for this release engineer and none
  were created or guessed. The gate, the 401 on admin APIs and the chunk isolation are verified; the
  dashboard behind the gate is **not tested**. Owner action: sign in at `/admin` and exercise menu,
  orders, reservations and customers.
- **Real reservation and contact writes.** Both flows were driven to a complete payload with the POST
  intercepted and answered locally, so the client path (validation, payload shape, success state) is
  verified without writing production rows. The server-side create path is exercised only by the
  backend's own 56-test suite.
- **Payments.** No charge was attempted; Stripe keys are still unset, so the payment endpoints are
  expected to answer 503 (§18).
- **One throwaway account.** Verifying registration end to end created a real customer record,
  `qa.release.1795776101030@savora.test` (display name "QA Release Check"), with one Dry-Aged Ribeye
  line in its cart. It must be deleted from the production database; no other production data was
  written.
- **`/assets/` cache lifetime.** See §22.3 — an optimisation, not a release blocker, left unchanged.

### 22.9 Remaining blockers and owner-only configuration

Unchanged from §18, plus the deferred item from §21:

- Rotate the production administrator password and remove `SEED_ADMIN_PASSWORD` from the environment.
- Set `IP_HASH_SALT`; configure the SMTP provider; add Stripe keys and the webhook endpoint.
- Move Atlas to a least-privilege user and enable backups.
- Delete the QA account named in §22.8.
- `zod` high advisory: requires a semver-major upgrade to `zod@4.6.7` and a full retest of the
  validation layer.
- `LazyMotion` / `m` refactor across roughly fifteen components (estimated 25–35 kB gzip).

### 22.10 Classification

- **Released and verified:** GitHub `main` at `cf2f443`; Vercel production `READY` on that build's
  exact assets; storefront, all five widths, navigation, conveyor, menu filters, dish dialog, gallery
  lightbox, cart, registration, sign-in, sign-out, reservation validation and confirmation, contact
  validation and payload, admin gate, footer and internal anchors.
- **Released, not verified:** authenticated admin screens (no credentials); server-side reservation
  and contact writes (deliberately not exercised).
- **Not released:** nothing — the deployed assets are exactly the `cf2f443` build.
