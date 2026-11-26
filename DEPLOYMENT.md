# SAVORA — Deployment & Operations

This project is two deployable pieces that share one origin in production:

| Piece | Stack | Location | Dev port |
| --- | --- | --- | --- |
| Storefront + house dashboard | React 19, Vite, Tailwind | `my-site/src` | 5173 |
| REST API | Node 20+, Express 5, Mongoose 8 | `my-site/backend` | 4000 |
| Database | MongoDB | `savora` | 27017 |

Keeping `/api` on the same origin as the site is required: sessions are httpOnly
cookies (`savora_at` at `/`, `savora_rt` at `/api/auth`) and cross-site cookies
would need `SameSite=None; Secure` plus a third-party-cookie exemption.

---

## 1. Local development

```bash
# terminal 1 — database (MongoDB must already be installed/running)
mongod --dbpath <data dir>

# terminal 2 — API
cd my-site/backend
npm install
cp .env.example .env          # then fill in the values
npm run seed                  # creates the admin + the 13 house dishes (idempotent)
npm run dev                   # http://127.0.0.1:4000/api

# terminal 3 — site
cd my-site
npm install
npm run dev                   # http://127.0.0.1:5173
```

Open **http://127.0.0.1:5173** (the dev server binds IPv4 loopback explicitly).
The house dashboard is **http://127.0.0.1:5173/admin**.

The Vite dev server proxies `/api` to `VITE_API_PROXY` (default
`http://127.0.0.1:4000`). If the API is not running the proxy logs
`[vite] /api proxy could not reach …` and the browser receives a 502 — that is a
proxy error, not an application response.

If `mongod` is not up, the API now retries for ~60 seconds and prints one line
per attempt instead of exiting immediately.

### Checks

```bash
cd my-site/backend && npm test                 # API + integration suite (52 tests)
node audit/e2e-flow.mjs http://127.0.0.1:5173  # 45 end-to-end assertions
node audit/live-audit.mjs                      # 105 HTTP assertions on a throwaway DB
cd my-site && npm run build                    # production bundle
cd my-site && npm run lint                     # see note in §7
```

`audit/e2e-flow.mjs` needs an administrator in the database it runs against
(`E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`). Never point it at the client's live
database: it creates a customer, a reservation and an order.

---

## 2. Environment variables (backend)

Copy `backend/.env.example` to `backend/.env` on the server. Values are validated
by Zod at boot; an invalid file stops the process with a readable list.

| Variable | Required | Notes |
| --- | --- | --- |
| `NODE_ENV` | yes | `production` on the server |
| `PORT` | yes | default `4000` |
| `API_PREFIX` | no | default `/api` |
| `MONGODB_URI` | yes | Atlas SRV string or `mongodb://…` |
| `CLIENT_ORIGINS` | yes | comma-separated exact origins, e.g. `https://savora.com,https://www.savora.com` |
| `JWT_ACCESS_SECRET` | yes | random, ≥ 32 chars, different from the refresh secret |
| `JWT_REFRESH_SECRET` | yes | random, ≥ 32 chars |
| `JWT_ACCESS_TTL` | no | default `15m` |
| `JWT_REFRESH_TTL_DAYS` | no | default `30` |
| `COOKIE_SECURE` | no | forced on in production |
| `COOKIE_DOMAIN` | no | only when the API is on a subdomain of the site |
| `APP_URL` | yes | public site URL (used in emails) |
| `RESTAURANT_TIMEZONE` | no | default `America/New_York` |
| `TAX_RATE` | no | default `0.08875` |
| `DELIVERY_FEE_CENTS` | no | default `499` |
| `FREE_DELIVERY_THRESHOLD_CENTS` | no | default `7500` |
| `RESERVATION_SLOT_CAPACITY` | no | default `24` seats per seating |
| `RESERVATION_MAX_PARTY` | no | default `12` |
| `RESERVATION_LEAD_DAYS` | no | default `90` |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` / `SEED_ADMIN_NAME` | for seeding | the seed refuses to create an admin in production without a password |
| `IP_HASH_SALT` | yes in production | private salt; the public dev default is warned about at boot |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | no | leave empty until payments are contracted |
| `SMTP_URL` | no | not yet wired into `config/env.js`; emails currently log to the console |

Frontend build-time variables (`my-site/.env`):

| Variable | Default | Notes |
| --- | --- | --- |
| `VITE_API_URL` | `/api` | keep relative in production (same origin) |
| `VITE_API_PROXY` | `http://127.0.0.1:4000` | development only |

---

## 3. Build the site

```bash
cd my-site
npm ci
npm run build      # → my-site/dist
```

Serve `dist` from any static host or CDN with a **SPA fallback**: unknown paths
must return `index.html` (the dashboard lives at `/admin` and is resolved
client-side). Hashed assets under `/assets` can be cached immutably;
`index.html` must not be.

---

## 4. Run the API

```bash
cd my-site/backend
npm ci --omit=dev
node src/scripts/sync-indexes.js   # ensure unique/compound indexes exist
NODE_ENV=production node src/server.js
```

Use a process manager (systemd, PM2, Docker restart policy) so a crash restarts
the service. The process handles `SIGINT`/`SIGTERM` with a 10-second graceful
shutdown, logs unhandled rejections, and exits non-zero if the port is in use.

Reverse proxy (nginx example) — one origin, HTTPS, `/api` to the API:

```nginx
server {
  listen 443 ssl http2;
  server_name savora.com;

  root /srv/savora/dist;
  index index.html;

  location /api/ {
    proxy_pass http://127.0.0.1:4000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location / {
    try_files $uri $uri/ /index.html;
  }

  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
  add_header X-Content-Type-Options nosniff always;
  add_header Referrer-Policy strict-origin-when-cross-origin always;
}
```

The API already sends Helmet's headers, writes `trust proxy = 1` in production,
and refuses state-changing requests whose `Origin` is not in `CLIENT_ORIGINS`.

For the Vercel frontend and Render API deployment, `vercel.json` proxies `/api/*`
to the Render service so browser requests and auth cookies stay on the frontend
origin. Set the Render API's `CLIENT_ORIGINS` to
`https://savora-restaurant-five.vercel.app`, then redeploy the frontend so the
rewrite takes effect.

---

## 5. First production deploy

1. Create the database (Atlas M10 or larger for a live restaurant; M0 is only
   suitable for staging).
2. Set every required variable in the hosting secret manager.
3. Run `npm run seed` **once** with a strong `SEED_ADMIN_PASSWORD`; store that
   password in the client's password manager and delete it from the server env
   afterwards. The seed never uses the public development fallback in production.
4. Deploy the API, confirm `GET /api/health` returns `200` and
   `{"data":{"status":"ok","database":"connected"}}`.
5. Deploy `dist`, confirm the menu is live (it is fetched from `/api/menu`) and
   that `/admin` shows the sign-in screen.
6. Sign in as the admin, rotate the password, create the real menu.

### Resetting the administrator password

The seed never overwrites an existing password. To set or recover the admin
password, put the new value in `backend/.env` as `SEED_ADMIN_PASSWORD` and run:

```bash
cd backend
npm run admin:reset   # updates the configured admin, promotes it, revokes old sessions
```

It prints the affected email and role but never the password. Use this instead
of editing the database by hand.

MongoDB backups: enable daily snapshots/point-in-time restore on the cluster and
test one restore before handover. Application data lives only in MongoDB; there
are no local file uploads (dish images are static assets referenced by URL).

---

## 6. What is intentionally not enabled

* **Card payments** — no Stripe keys are configured; `/api/payments/*` answers
  `503 PAYMENTS_DISABLED`. Orders are stored `unpaid` and the UI says the guest
  pays on collection/delivery. Do not tell the client payments are ready.
* **Transactional email** — `utils/mailer.js` needs an SMTP/provider URL that is
  not part of the validated env schema yet. Reservation and reset emails are
  written to the server log. Password reset returns a dev-only link outside
  production.
* **Reviews** — no model, route or UI exists; the homepage testimonials are
  editorial content, not collected reviews.

---

## 7. Known tooling gaps

* `npm run lint` reports parsing errors in `src/lib/utils.ts`,
  `src/components/ui/*.tsx` and `navigation-menu.tsx` because the ESLint config
  has no TypeScript parser. The JavaScript/JSX sources added in this pass lint
  clean; fixing the TS setup means adding `typescript-eslint` (a new dev
  dependency) and is left as a deliberate follow-up.
* The production bundle is a single ~610 kB chunk (181 kB gzipped) and Vite warns
  above 500 kB. Code-splitting the dashboard (`React.lazy`) is the obvious next
  step if the warning matters for the client's performance budget.
* `GET /api/auth/session` was added so anonymous page loads do not log a 401 in
  the browser console; `/api/auth/me` still returns 401 for guests by design.
