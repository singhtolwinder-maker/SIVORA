# SAVORA

A premium American restaurant platform: a black-and-gold storefront, online ordering,
table reservations and a staff dashboard.

This repository contains **two deployable pieces**:

| Piece | Stack | Directory | Dev port |
| --- | --- | --- | --- |
| Storefront + `/admin` dashboard | React 19, Vite 8, Tailwind 3 | `src/` | 5173 |
| REST API | Node 20+, Express 5, Mongoose 8 | `backend/` | 4000 |
| Database | MongoDB (Atlas in production) | — | 27017 |

Sessions are `httpOnly` cookies, so in production the site and its `/api` are served
from **one origin** (the `vercel.json` rewrite, or an nginx proxy). See
[`DEPLOYMENT.md`](DEPLOYMENT.md) for the full operations runbook.

## Features

* Editorial landing page (hero, chef's special, experiences, gallery, testimonials).
* Live menu with categories, search, price filters, dish detail dialogs and cart ordering.
* Accounts: registration, sign-in, refresh-token rotation, sign-out, password change and reset.
* Server-side cart with tax, delivery fee and free-delivery threshold — never client priced.
* Pickup and delivery checkout, order history, customer cancellation window.
* Reservations with an availability grid, atomic seat capacity and duplicate protection.
* `/admin`: statistics, order pipeline, reservation statuses, menu CRUD, contact inbox, customers.
* Contact form with a honeypot and rate limiting.

## Quick start

```bash
# 1 — database (MongoDB installed and running)
mongod --dbpath <data dir>

# 2 — API
cd backend
npm install
cp .env.example .env          # fill in MONGODB_URI, JWT secrets, CLIENT_ORIGINS
npm run seed                  # admin account + 13 house dishes (idempotent)
npm run dev                   # http://127.0.0.1:4000/api

# 3 — site (new terminal)
npm install
npm run dev                   # http://127.0.0.1:5173
```

* Storefront — <http://127.0.0.1:5173>
* Staff dashboard — <http://127.0.0.1:5173/admin>

The dev server binds IPv4 loopback explicitly and proxies `/api` to
`VITE_API_PROXY` (default `http://127.0.0.1:4000`).

## Environment

Frontend (`my-site/.env`, all optional in development): `VITE_API_URL` (default `/api`),
`VITE_API_PROXY`. Both are documented in [`.env.example`](.env.example).

Backend (`backend/.env`): copy [`backend/.env.example`](backend/.env.example). Values are
validated by Zod at boot and an invalid file stops the process with a readable list.
`DEPLOYMENT.md` §2 is the authoritative table.

Never commit `.env`. Both are git-ignored.

## Scripts

| Command | Where | Purpose |
| --- | --- | --- |
| `npm run dev` | root | Vite dev server |
| `npm run build` | root | production bundle → `dist/` |
| `npm run preview` | root | serve the built bundle |
| `npm run lint` | root | ESLint (see *Known gaps*) |
| `npm run dev` | `backend/` | API with `--watch` |
| `npm start` | `backend/` | API in production mode |
| `npm test` | `backend/` | unit + integration suite (in-memory MongoDB) |
| `npm run seed` | `backend/` | seed admin + menu |
| `npm run admin:reset` | `backend/` | set/recover the admin password from `SEED_ADMIN_PASSWORD` |

Audit harnesses (real server, real `mongod`, throwaway databases):

```bash
cd backend
node audit/live-audit.mjs                       # 105 HTTP assertions
node audit/e2e-flow.mjs http://127.0.0.1:5173   # 45 end-to-end assertions
```

`e2e-flow.mjs` writes a customer, a reservation and an order — never point it at
the client's live database.

## Project structure

```
src/
  App.jsx                  page composition, providers, /admin entry
  components/              landing sections + shop drawers (cart, account)
  components/ui/           motion and layout primitives (mixed JS/TS)
  admin/AdminApp.jsx       staff dashboard (auth gate + tabs)
  lib/api.js               single API client: relative /api, cookies, 401→refresh
  lib/shop.jsx             session + cart context
backend/
  src/routes/              route tables (auth, users, menu, cart, orders,
                           reservations, contact, payments, admin)
  src/controllers/         HTTP layer, response envelope
  src/services/            business rules, pricing, capacity, state machines
  src/models/              Mongoose schemas and indexes
  src/middleware/          auth, validation, sanitisation, rate limits, errors
  src/validators/          Zod schemas per endpoint
  src/scripts/             seed, admin reset, index sync
  tests/                   node:test + supertest
  audit/                   live HTTP and end-to-end harnesses
```

## API

All routes are under `/api`. Successful responses are
`{ success: true, message?, data, meta? }`; failures are
`{ success: false, error: { code, message, details? }, requestId }`.

Every endpoint, its payload, status codes and error codes are documented in
[`docs/API.md`](docs/API.md).

## Security notes

* Passwords: bcrypt cost 12. Refresh tokens: SHA-256 digests with rotation and
  `timingSafeEqual` comparison; reuse of a rotated token returns 401 `SESSION_REVOKED`.
* Authorisation is enforced server-side: `/api/admin/*` requires role `admin`, and
  every cart/order/reservation query is scoped to the authenticated user.
* Origin allowlist (`CLIENT_ORIGINS`) rejects state-changing requests from foreign
  origins with 403 `ORIGIN_NOT_ALLOWED`.
* Mongo operator injection is blocked twice: `$`-prefixed and dotted keys are
  rejected in `middleware/sanitize.js`, and every body is whitelisted by Zod.
* Rate limits on the global API, auth endpoints and public forms.

## Known gaps

* **Payments** — no Stripe keys; endpoints answer `503 PAYMENTS_DISABLED` by design.
* **Transactional email** — `SMTP_URL` is not part of the validated env schema yet;
  reset and reservation mail is written to the server log.
* **Reviews** — no model, route or UI.
* **Customer profile editing UI** — `PATCH /api/users/me` exists but is not surfaced.
* **Lint** — the ESLint config has no TypeScript parser, so `src/lib/utils.ts`,
  `src/components/ui/*.tsx` and `navigation-menu.tsx` report parsing errors. The
  JS/JSX sources lint clean; fixing it needs `typescript-eslint`.
* The production bundle is one ~610 kB chunk (181 kB gzipped); `React.lazy` on
  `/admin` is the obvious split.

## Documentation

| File | Contents |
| --- | --- |
| [`DEPLOYMENT.md`](DEPLOYMENT.md) | deployment topology, env table, nginx, seeding, backups, troubleshooting |
| [`docs/API.md`](docs/API.md) | endpoint reference |
| [`SAVORA_COMPLETE_ENGINEERING_REPORT.md`](SAVORA_COMPLETE_ENGINEERING_REPORT.md) | audit, defect register, root causes, security and readiness report |
