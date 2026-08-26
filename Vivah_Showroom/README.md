# Vivah Trousseau — Indian Wedding Rental Showroom

A full-stack wedding rental platform: React/Vite/Tailwind frontend, Express/PostgreSQL backend (Prisma) for everything — catalog, customers, orders, CMS, and owner inventory all live in one PostgreSQL database. (MERN with Postgres standing in for Mongo — sometimes called "PERN.")

```
WeddingRentalWebsite/
├── frontend/          React + Vite + Tailwind app (frontend/dist is the existing pre-built public snapshot)
├── backend/           Express + PostgreSQL/Prisma API (one database for everything)
├── Open Site.html     Double-click to open the site directly — no install, no server
├── Open Website.bat   Windows one-click full dev-mode launcher (npm servers + backend)
└── README.md          You are here
```

## Two ways to open this

### A) Just look at it — double-click `Open Site.html`
Works immediately, on any OS, with nothing installed. It opens the
pre-built, self-contained `frontend/dist/index.html` straight in your
browser from disk. This is demo mode: all product data is the bundled
catalog, wishlist/bag are saved in your browser only, and there's no live
backend. This is the fastest way to see the actual site.

If you edit any frontend code, this static copy won't update until you
rebuild it: `cd frontend && npm run build` (regenerates `frontend/dist`).

### B) Full local development — `Open Website.bat` (or manual steps below)
Runs the real Vite dev server (with hot reload) and, if you've set up
PostgreSQL, the real Express backend — for actually building on this project
or testing the live API.

## What's real vs. demo-mode

The frontend works **standalone**, with no backend, using a bundled product
catalog generated from the showroom's own photography (`frontend/src/data`).
This is what you get out of the box, and what `Open Website.bat` shows you
immediately.

Point it at the real backend by setting `VITE_API_URL` in
`frontend/.env` (copy from `frontend/.env.example`) once you've deployed the
API and seeded the database — see below. The frontend's `src/api` layer calls the
real API when configured and silently falls back to demo data otherwise, so
nothing breaks if the backend isn't reachable yet.

---

## 1. Local Development

### Prerequisites
- Node.js 18+
- A PostgreSQL database (Render, Railway, Neon, or Supabase all have free
  tiers) — only needed once you want real data/auth instead of demo mode.

### Quick start (Windows)
Double-click **`Open Website.bat`**. It starts both servers and opens Chrome
to `http://localhost:5173`. (Requires `npm install` to have been run once in
both `frontend/` and `backend/` — see manual steps below.)

### Manual setup (any OS)

**Frontend:**
```bash
cd frontend
npm install
cp .env.example .env      # optional — leave VITE_API_URL unset to run in demo mode
npm run dev                # http://localhost:5173
```

**Backend:**
```bash
cd backend
npm install
cp .env.example .env       # fill in DATABASE_URL (PostgreSQL) + JWT + admin OTP settings
npm run prisma:migrate:dev # create every table locally (users, products, orders, inventory, ...)
npm run seed                # populates the catalog (development only — see utils/seed.js)
npm run dev                 # http://localhost:5000
```

---

## 2. Environment Variables

### `frontend/.env`
| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL of the deployed backend, e.g. `https://your-api.onrender.com/api`. Leave unset for demo mode. |

### `backend/.env`
See `backend/.env.example` for the full list, including `DATABASE_URL`
(the one PostgreSQL database for the whole app), `JWT_SECRET`,
`CORS_ORIGINS`, SMTP credentials, Twilio credentials (phone OTP delivery),
Cloudinary keys, and the admin setup/session keys. There is no MongoDB
anywhere in this project anymore — everything lives in one Postgres
database, defined in `backend/prisma/schema.prisma`.

---

## 3. Deployment

### Frontend → Vercel
1. Push this repo to GitHub.
2. Import the repo in Vercel and set the **root directory** to `frontend`.
3. Vercel builds the frontend from `frontend/package.json` and `frontend/vercel.json`.
4. Add the `VITE_API_URL` environment variable pointing at your Render backend.

### Backend + PostgreSQL → Render
1. Create a **Blueprint** from the repository and use the root `render.yaml`.
2. The Blueprint creates a separate `vivah-showroom-backend` web service and a separate `vivah-showroom-db` PostgreSQL database — the only database this project uses.
3. The web service uses `backend/` as its root directory. It runs Prisma generation during build, migrations before deploy, and the catalog seed once after the first successful deploy.
4. Fill the prompted secret values for `ADMIN_SETUP_KEY`, `ADMIN_PHONE_NUMBER`/`ADMIN_OWNER_EMAIL`, Twilio, Cloudinary, CORS and SMTP. `DATABASE_URL` is wired automatically to the new Vivah PostgreSQL database.
5. If you have other projects on the same Render account (e.g. a similarly-structured "Utsav" project), never point Vivah's `DATABASE_URL` at another project's database — each project's Blueprint provisions its own.

---

## 4. API Overview

Base path: `/api`. All list/detail GET endpoints are public; everything
else requires `Authorization: Bearer <token>` (returned from
login/register/guest endpoints). Admin-only routes additionally require the
user's `role` to be `admin` (set this manually in the database for your admin
account, or use `POST /auth/admin-register` with `ADMIN_SETUP_KEY` — there's
no public sign-up path to admin by design).

| Resource | Endpoints |
|---|---|
| Auth | `POST /auth/register`, `/login`, `/guest`, `/forgot-password`, `/reset-password`, `GET /auth/verify-email/:token`, `/auth/me` |
| Admin Auth | `POST /auth/admin-register` (setup-key gated), `/auth/admin-login/init`, `/auth/admin-login/verify`, `/auth/admin-login/resend`, `/auth/admin-logout`, `GET /auth/admin-lock-status` |
| Users | `PUT /users/profile`, `/users/change-password`, `POST/DELETE /users/addresses`, `GET /users/wishlist`, `POST /users/wishlist/toggle` |
| Products | `GET /products` (filters: `category`, `tag`, `sort`, `available`, `search`, `page`, `limit`), `GET /products/:id`, `/:id/related`, `POST /products/:id/reviews`; admin: `GET/POST/PUT/DELETE /admin/products`, `PUT /products/:id/stock` |
| Categories | `GET /categories`; admin: `GET /admin/categories`, `POST/PUT/DELETE /categories` |
| Orders (rentals) | `POST /orders`, `GET /orders/mine`, `/orders/:id`, `POST /orders/:id/return`; admin: `GET /orders`, `PUT /orders/:id/status` |
| Appointments | `POST /appointments`, `GET /appointments/mine`; admin: `GET /appointments`, `PUT /appointments/:id/status` |
| Misc | `POST /feedback`, `POST /contact`; admin `GET /contact`; `GET /notifications`, `PUT /notifications/:id/read`; `GET/POST /banners`, `GET/POST /gallery` |
| Admin | `GET /admin/dashboard`, `GET /admin/customers` |
| Inventory (admin-only) | `GET /inventory`, `/inventory/summary`, `GET /inventory/:productId`, `GET /inventory/:productId/history`, `POST /inventory`, `PUT /inventory/:productId`, `PATCH /inventory/:productId/adjust`, `POST /inventory/:productId/stock`, `DELETE /inventory/:productId` |

`GET /api/health` returns `{ status: "ok" }` and is used as Render's health
check.

---

## 5. Project Notes

- **Images**: all 691 source images are optimized (resized, compressed) and
  organized under `frontend/public/assets/<category>/`, with a manifest at
  `frontend/src/data/imageManifest.json` that both the frontend demo catalog
  and the backend seed script read from, so every image is used and stays
  in sync between the two.
- **Design system**: colours, fonts, and the signature "kundan-thread
  divider" motif are defined as CSS variables in `frontend/src/index.css`.
- **Routing**: uses React Router's `HashRouter` (URLs look like
  `#/bride/bridal-lehenga`) and a single self-contained build
  (`vite-plugin-singlefile`, all JS/CSS inlined into `index.html`)
  specifically so the site can be opened straight from disk via
  `Open Site.html` — regular `BrowserRouter` and normal multi-file builds
  break under the `file://` protocol (browsers block ES module script
  loading there). This works identically once deployed to Vercel too, so
  there's no separate "web build" vs "local build."
- **Navigation structure**: Bride, Groom, and Jewellery are nested
  drill-down sections rather than flat category pages. See
  `frontend/src/data/categories.js`'s top comment block for the full
  diagram, or in short:
  ```
  /bride                 -> tabs for every bride category, back button -> Home
  /bride/:slug            -> that one category's products, same tabs, same back button
  /groom, /groom/:slug     -> identical pattern for Groom
  /jewellery               -> "Bridal Jewellery" / "Groom Jewellery" buttons
                              + a mixed grid of both by default
  /jewellery/bride         -> tabs for jewellery TYPES (Necklace, Earrings,
                              Bangles, plus a "Trending" tab), back -> /jewellery
  /jewellery/bride/:slug   -> that one type's products, same tabs/back
  /jewellery/groom, /jewellery/groom/:slug -> identical pattern for Groom Jewellery
  ```
  Every level's back button (see `components/layout/HubHeader.jsx`) goes up
  exactly ONE level in this hierarchy — it's a fixed link, not browser
  history, so it behaves correctly even if someone lands on a deep page
  directly from a shared link. Couple Collection has no hub — it's still a
  single flat page at `/category/couple-collection`.
- **Fullscreen image view**: clicking any product image (in a grid card or
  on the product detail page) opens a fullscreen `Lightbox`
  (`components/product/Lightbox.jsx`) with **manual** zoom controls (+/−
  buttons, click-to-zoom-one-step, Esc/arrow-key navigation). There is
  deliberately no hover-triggered auto-zoom anywhere on the site — an
  earlier version had that on the product detail page and it was removed
  in favor of this consistent, manual, sitewide behavior.
- **OTP verification**: customer email verification fields (`isVerified`/
  `verificationToken`) are in place on `User`, but actual dispatch needs
  `sendMail()` wired into `register()` (see `controllers/authController.js`).
  Admin sign-in's dual phone+email OTP, by contrast, is fully wired —
  see §7 below.
- **Payments**: order totals (rental price + deposit) are calculated, but no
  payment gateway is integrated — add Razorpay/Stripe in
  `backend/src/controllers/orderController.js` when ready to take real
  payments.

## 6. Performance & Accessibility

The frontend lazy-loads below-the-fold images, uses `prefers-reduced-motion`
handling, and keeps semantic HTML/labels on all forms. Before a production
launch, also run a Lighthouse pass and address anything specific to your
final hosting setup (image CDN caching headers, etc.) — targets weren't
independently benchmarked as part of this build.

## 7. Stack: MERN, with PostgreSQL in place of MongoDB

This project is **MERN** — React frontend, Express/Node backend — with
**PostgreSQL standing in for MongoDB** (sometimes called "PERN"). Every
piece of data (users, products, categories, orders, appointments, banners,
gallery, media, messages, notifications, coupons, settings, the admin
session lock, admin OTP challenges, and owner inventory) lives in one
PostgreSQL database, modeled and queried through Prisma
(`backend/prisma/schema.prisma`). There is no MongoDB connection anywhere
in this codebase.

**The frontend needed zero changes for this.** Every API response still
returns Mongo-style `_id` fields (aliased from Prisma's `id` — see
`backend/src/utils/serialize.js`), so every existing React component that
reads `product._id`, `order._id`, etc. keeps working exactly as before.

A couple of Mongoose-specific patterns don't have a direct Prisma
equivalent and were re-implemented deliberately differently — worth knowing
if you're extending this code:
- **Embedded subdocuments** (`Order.items`, `User.addresses`,
  `Product.reviews`/`sections`/`durationOptions`/`sizeStock`) are now JSONB
  columns rather than relational tables, since they were always
  read/written as a whole array in Mongo too, never queried independently.
- **`.populate()`** doesn't exist in Prisma for JSON fields. Where the old
  code relied on it (`Order.items[].product`), `orderController.js`'s
  `hydrateOrderItems()` does the equivalent lookup manually.
- **Mongoose instance methods/hooks** (password hashing on save, singleton
  helpers) moved into plain functions: `utils/userAuth.js` and
  `utils/adminLock.js`.
- **MongoDB's TTL index** (auto-deleting expired `AdminOtpChallenge` rows)
  has no Postgres equivalent used here; expired/consumed challenges are
  deleted explicitly in code instead (see `authController.js`).
