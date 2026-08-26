# Vivah Showroom — What Was Added (Implementation Notes)

This document explains everything added on top of the original uploaded project,
why it's structured the way it is, and what's still left for you to finish
(mainly: connecting a real payment gateway, and pointing a few public
components at the new banner/gallery CMS data).

## 1. Admin login "lock" system (single-admin-session + ownership transfer)

**Files:** `backend/src/models/AdminLock.js`, `backend/src/models/User.js`
(added `isActive`), `backend/src/controllers/authController.js` (new
`adminRegister`/`adminLogin`/`adminLogout`/`adminLockStatus`),
`backend/src/middleware/auth.js` (new `adminSessionGuard` + `adminGuard`),
`frontend/src/admin/AdminLogin.jsx`, `frontend/src/admin/AdminRegister.jsx`,
`frontend/src/context/AdminContext.jsx`.

**How it works:**
- Only ONE admin can be signed into `/admin` at a time. `AdminLock` is a
  singleton MongoDB document tracking who currently holds the session.
- `POST /api/auth/admin-login` checks the lock; if someone else holds it,
  it returns `423 Locked` with a clear message, until they log out
  (`POST /api/auth/admin-logout`) or the session auto-expires
  (`ADMIN_SESSION_HOURS` env var, default 12h — a safety net for a closed
  browser tab).
- **Ownership transfer:** a new owner never needs the previous owner's
  email/password. They go to `/admin/register` and create their own admin
  account using `ADMIN_SETUP_KEY` (a secret in `backend/.env` — share it with
  them privately, e.g. over phone/WhatsApp, at the time of sale). This
  automatically deactivates every other existing admin account
  (`isActive: false`), so the previous owner permanently loses access
  without their account/order history being deleted, and without them
  needing to be involved at all.
- **Regular customer login is completely untouched and always open** —
  `POST /api/auth/login` never checks the admin lock and refuses to log in
  any account with `role: 'admin'` (same generic error as a wrong password),
  so admin login is invisible to ordinary users even if they inspect the API.
- **Rotate `ADMIN_SETUP_KEY`** after each ownership transfer if you want to
  fully invalidate it for the next transfer.

**⚠️ Set this before deploying:** `ADMIN_SETUP_KEY` in `backend/.env` — pick
a long random string. Without it, `/admin/register` cannot be used at all
(intentional — it refuses with no key set).

## 2. No-code Media/Content CMS

**Files:** `backend/src/config/upload.js` (now Cloudinary-first, disk
fallback), `backend/src/models/Media.js`, `backend/src/controllers/
mediaController.js`, `backend/src/routes/mediaRoutes.js`,
`frontend/src/admin/components/ImageUploadField.jsx`,
`frontend/src/admin/components/FloatingModal.jsx`, `frontend/src/admin/
MediaLibrary.jsx`.

- Every admin "Add"/"Edit" action (Products, Categories, Banners, Gallery)
  opens a **floating modal** with a drag/click image upload box, matching
  what you described. No code editing required — ever.
- All uploads go through one shared endpoint, `POST /api/media/upload`,
  which uses Cloudinary automatically once `CLOUDINARY_CLOUD_NAME` /
  `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` are set in `backend/.env`
  (falls back to local disk for development only).
- The **Media Library** screen (`/admin/media`) is the "Google Drive"-style
  browser: every uploaded image in one grid, with copy-URL and delete.

**⚠️ Set these before deploying:** `CLOUDINARY_CLOUD_NAME`,
`CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` in `backend/.env`, and add
`multer-storage-cloudinary` to your installed packages (already added to
`backend/package.json` — just run `npm install`).

## 3. Products / Rentals CMS + inventory management

**Files:** `backend/src/models/Product.js` (added `status` lifecycle,
`sections`, `sizeStock`, `lowStockThreshold`), `backend/src/controllers/
productController.js` (added `adminListProducts`, `updateStock`, status
filtering), `frontend/src/admin/ProductsManager.jsx`.

- Full Draft → Published → Archived lifecycle. Public product listing/detail
  endpoints only ever return `published` products.
- Unlimited flexible content **sections** per product (Introduction,
  Features, Materials, Size & Fit, etc.) — not a fixed set of fields.
- **Per-size inventory**: set stock quantity for each size individually.
  `PUT /api/products/:id/stock` is the dedicated endpoint; the booking flow
  automatically decrements stock (and flips `available` to false when a
  size hits zero) when an order is placed.

## 4. Categories, Banners, Gallery CMS

**Files:** `backend/src/controllers/categoryController.js` /
`miscController.js` (filled in missing update/delete endpoints),
`frontend/src/admin/CategoriesManager.jsx`, `BannersManager.jsx`,
`GalleryManager.jsx`.

Full CRUD for all three, each with the same floating-modal + image-upload
pattern. **Not yet done:** wiring the public Home.jsx hero and Moments
Gallery components to actually read from `GET /api/banners` / `GET
/api/gallery` — right now they still render their original hardcoded
content. This is a small, safe follow-up (swap a hardcoded array for a
`useEffect` fetch) that intentionally wasn't touched yet so as not to risk
the "don't change the public site's appearance" rule without your review.

## 5. Coupons/Offers

**Files:** `backend/src/models/Coupon.js`, `couponController.js`,
`couponRoutes.js`, `frontend/src/admin/CouponsManager.jsx`.

Admin creates percent/flat discount codes with optional min order amount,
max discount cap, expiry and usage limit. The booking flow's offer step
validates codes live against the backend (never trusts a discount computed
in the browser) and the order creation endpoint re-validates again
server-side before applying it.

## 6. The new "Rent Now" full booking flow

**Files:** `frontend/src/pages/RentBooking.jsx` (new page, route
`/rent/:id`), `frontend/src/pages/MyOrders.jsx` (new page, route
`/orders`), `backend/src/models/Order.js` (added `returnDate`/`noOfDays`/
`rentalTime`/`paymentMode`/coupon fields), `backend/src/controllers/
orderController.js` (rewritten `createOrder`, new `confirmPayment`).

Exactly the flow you described:
1. Clicking **Rent Now** anywhere (`ProductCard.jsx`, `SpotlightCard.jsx`,
   or the **Rent Now** button on the product detail page `Product.jsx`) now
   navigates to `/rent/:id` — a full page, not a WhatsApp link or a modal —
   showing the same sizes/price-per-day/details/availability as the main
   product page.
2. Mandatory fields — **Size, Booking Date, Return Date, No. of Days (1-3),
   Time** — are outlined in red if you try to proceed with any left empty.
3. Optional coupon/offer field, checked live against the backend.
4. Once every mandatory field is filled, the button changes from **"Rent
   Now"** to **"Proceed"**.
5. Proceed opens the payment step: **Cash on Delivery / UPI / QR Code**.
6. Selecting a mode reveals **"Confirm Booking"**. For COD, this
   immediately creates the order and shows "Booking Confirmed". For UPI/QR,
   it shows a **placeholder payment step** ("I've Paid — Confirm") because
   no payment gateway is connected yet (see below) — clicking it marks the
   order paid and shows "Booking Confirmed" the same way.
7. Either way, the order now shows up under **My Orders** (`/orders`).

**⚠️ Payment gateway not connected yet** — you told me you're not sure which
one you'll use. The UPI/QR steps are working placeholders (`backend/src/
controllers/orderController.js`'s `confirmPayment()` and the frontend's
"I've Paid — Confirm" button) so the whole flow is clickable and testable
end-to-end today. When you pick a gateway (Razorpay is the most common for
UPI/QR in India), that placeholder confirm step gets replaced with the
gateway's actual checkout + webhook/signature verification — everything
else in the flow (order creation, stock decrement, coupon handling, My
Orders) stays exactly the same.

## 7. Admin dashboard, orders, appointments, messages, customers

**Files:** `frontend/src/admin/Dashboard.jsx`, `OrdersManager.jsx`,
`AppointmentsManager.jsx`, `MessagesManager.jsx`, `CustomersManager.jsx`,
`frontend/src/admin/components/AdminLayout.jsx` (sidebar shell),
`frontend/src/admin/AdminApp.jsx` (route table), `frontend/src/App.jsx`
(now splits into `PublicSite` + `/admin/*` — no shared navbar/footer).

## What's genuinely NOT done (be aware before you consider this "finished")

- **Payment gateway integration** — see §6 above.
- **Public Home.jsx hero/gallery still hardcoded** — not yet reading from
  the new Banner/Gallery CMS data (see §4). Safe, small follow-up.
- **No automated tests were run against a live MongoDB** — I verified every
  file's syntax and did a full production `vite build` (both passed
  cleanly), but there's no database in this environment to run the actual
  create/edit/delete/persistence tests listed in the original master
  prompt's "Test Before Finishing" section. Please run through that
  checklist yourself against a real MongoDB Atlas + Cloudinary setup before
  going live.
- **Category slug/URL migration** — existing category CRUD assumes the
  `Category` model's existing shape; I didn't touch slug-generation logic.
- The old `RentNowModal.jsx` and the customer-facing "add to local bag"
  flow (`ShowroomContext.addToBag`, `pages/Bag.jsx`) are left in the
  codebase but are no longer the way Rent Now works. You can remove them
  later if you don't want a separate "wishlist bag" concept anymore, or
  keep them for wishlist-style saving.

## Environment variables you need to set (backend/.env)

```
ADMIN_SETUP_KEY=<long random secret — share privately at time of sale>
ADMIN_SESSION_HOURS=12
CLOUDINARY_CLOUD_NAME=<from your Cloudinary dashboard>
CLOUDINARY_API_KEY=<from your Cloudinary dashboard>
CLOUDINARY_API_SECRET=<from your Cloudinary dashboard>
```

## Creating your first admin account

There's no admin account yet. Once the backend is deployed with
`ADMIN_SETUP_KEY` set:
1. Go to `yoursite.com/#/admin/register`
2. Fill in your name, email, a password (min 8 characters), and the setup key
3. Go to `/#/admin/login` and sign in

## 8. Utsav-style PostgreSQL / Prisma inventory

Vivah now uses the same owner-facing inventory architecture as the supplied
Utsav project, while deliberately keeping the existing MongoDB data model for
customers, products, orders, appointments, coupons and CMS content. This is
intentional: only inventory needed a PostgreSQL/Prisma migration, so the public
site and existing CMS features are not unnecessarily rewritten.

### PostgreSQL inventory fields

- `productId` — the existing MongoDB Product `_id`, stored as text
- `sku`
- `totalUnits`
- `reservedUnits`
- `damagedUnits`
- `lowStockThreshold`
- `location`
- `costPrice` (owner-only)
- `notes`
- `sizeStock` JSON for size-aware rental inventory

Available stock is calculated as:

`Available = Total − Reserved − Damaged`

### Admin inventory

The new `/admin/inventory` page follows the Utsav dashboard pattern:

- searchable stock table
- low-stock filter
- total/reserved/damaged/available columns
- quick +/- controls
- edit modal
- SKU, location, cost price and notes
- size-level total/reserved/damaged counts when the product has sizes
- dashboard inventory summary and low-stock alerts

### Rental lifecycle

A successful rental booking reserves inventory in PostgreSQL. The public
MongoDB Product stock is then synchronized to the calculated available count.
When an admin marks an order `returned` or `cancelled`, the reservation is
released exactly once and the public product availability is synchronized
again.

### Deployment

The root `render.yaml` defines both the Vivah Render web service and a separate Vivah PostgreSQL database. The service uses `backend/` as its root directory, runs `npx prisma generate` during build, `npx prisma migrate deploy` before deploy, and `npm run sync:inventory` once after the first successful deployment. Do not use the Utsav `maison-utsav-db` database.

This sync script does not delete MongoDB products or orders.

## 8. Dual-OTP Admin Login + Admin Login button + Inventory audit trail (this update)

This update adds three things on top of everything above, without touching
the public site's visual design beyond one small header addition.

### Admin Login button in the header

`frontend/src/components/layout/Navbar.jsx` now shows a small **"Admin
Login"** pill button at the far right corner of the existing header (desktop),
and a matching "Admin Login" line in the mobile menu, right under a "User
Login" line. This is the only frontend layout change — no other header
elements, spacing, colors, or components were touched. Clicking it goes to
`/admin`, which (via `AdminApp.jsx` → `AdminGuard.jsx`) shows the sign-in
screen below if nobody's currently signed in as admin, exactly like before.

### Dual OTP admin sign-in (mandatory, both codes required)

Admin sign-in is now a three-endpoint, two-step flow instead of a single
password check:

1. `POST /api/auth/admin-login/init` — email + password. On success, the
   server creates a short-lived `AdminOtpChallenge` (MongoDB,
   `backend/src/models/AdminOtpChallenge.js`) and sends **two independent
   codes**: one SMS to `ADMIN_PHONE_NUMBER` (via `backend/src/utils/sms.js`,
   a small Twilio REST wrapper — no SDK dependency needed), and one email to
   `ADMIN_OWNER_EMAIL` (via the existing `utils/mailer.js`). Both addresses
   are fixed server config — **never** taken from the request — so this
   can't be abused to spam/enumerate arbitrary contacts. No session/token is
   issued at this step.
2. `POST /api/auth/admin-login/verify` — both codes, in the same request.
   Only if **both** hashes match (`backend/src/utils/otp.js`, sha256 +
   constant-time compare, codes never stored in plaintext) does the server
   fall through to the exact same single-active-admin-session logic as
   before (`AdminLock` singleton) and issue the JWT. Verifying only one code
   is never sufficient — there's no code path that issues a session from
   partial verification.
3. `POST /api/auth/admin-login/resend` — resend one channel's code,
   rate-limited per channel (`OTP_RESEND_COOLDOWN_SECONDS`).

Codes expire after `OTP_EXPIRY_MINUTES` (default 5), a wrong-guess ceiling
(`OTP_MAX_ATTEMPTS`, default 5) discards the whole challenge, and a MongoDB
TTL index deletes any abandoned challenge automatically. All three routes
sit behind their own `express-rate-limit` limiters
(`backend/src/routes/authRoutes.js`) separate from the site-wide limiter.

**⚠️ Set these before deploying** (`backend/.env`): `ADMIN_PHONE_NUMBER`,
`ADMIN_OWNER_EMAIL`, and the SMS provider — `TWILIO_ACCOUNT_SID` /
`TWILIO_AUTH_TOKEN` / `TWILIO_FROM_NUMBER`. Without the Twilio vars, SMS
sending fails soft (console warning; in dev only, the code is also printed
to the server console so the flow is testable) — the phone OTP will not be
delivered in production until these are set.

`frontend/src/context/AdminContext.jsx`, `frontend/src/api/adminApi.js`, and
`frontend/src/admin/AdminLogin.jsx` were updated to drive this two-step flow
(credentials screen → OTP screen with two 6-digit inputs and per-channel
resend). Nothing else in the admin panel changed — once a session exists,
everything (session lock, logout, `adminSessionGuard`, etc.) works exactly
as documented in section 1 above.

### Inventory audit trail

Every inventory-changing action (create, edit, stock adjust, delete) now
writes an immutable `InventoryMovement` row in PostgreSQL
(`backend/prisma/schema.prisma`, migration
`20260821000000_inventory_audit_trail`) recording the admin's id/email, the
action, the field (for adjustments), previous/new values, an optional
reason, and a timestamp. `backend/src/routes/inventory.js` writes this on
every write path and exposes it read-only at
`GET /api/inventory/:productId/history` (admin-only, same `adminGuard` as
every other inventory route). The admin Inventory screen
(`frontend/src/admin/InventoryManager.jsx`) has a new history icon per row
that opens this log in a modal.

The route surface also now matches the documented API shape exactly:
`POST /api/inventory` (explicit create, 409s if inventory already exists for
that product), `PUT /api/inventory/:id` (create-or-update, used by "Add" and
"Edit" in the UI), `POST /api/inventory/:id/stock` (alias for the existing
`PATCH /:id/adjust`, same handler), `DELETE /api/inventory/:id`, and
`GET /api/inventory/:id/history`.

No normal User Login token can reach any of this — `adminGuard` (`protect`
+ `adminOnly` + `adminSessionGuard`) is applied to the whole inventory
router, and `adminOnly`/`adminSessionGuard` specifically reject any account
that isn't `role: 'admin'` and isn't the currently checked-out admin
session, even if someone calls the API directly rather than through the UI.

## 9. Full migration: MongoDB → PostgreSQL (entire app, not just inventory)

**This supersedes every earlier mention of MongoDB in this document
(sections 1–8 above describe the app as it was BEFORE this migration).**
The app is now MERN with PostgreSQL in place of MongoDB (PERN) —
one database for everything, no MongoDB connection anywhere. See
`README.md` §7 for the user-facing summary; this section is the
implementation log for anyone picking up this codebase later.

### What changed

- `backend/src/models/*.js` (every Mongoose schema — User, Category,
  Product, Order, Coupon, Appointment, Banner, Feedback, Gallery, Media,
  Message, Notification, Settings, AdminLock, AdminOtpChallenge, plus the
  pre-existing Prisma InventoryItem/InventoryMovement) were replaced with
  **one** `backend/prisma/schema.prisma` covering all of them.
- Every controller (`backend/src/controllers/*.js`), `middleware/auth.js`,
  `services/inventoryService.js`, `server.js`, and `app.js` were rewritten
  to query Prisma instead of Mongoose. `config/db.js` (the Mongoose
  connection helper) was deleted; `lib/prisma.js` (already existed for the
  old inventory-only Postgres connection) is now the only database client.
- `package.json`: removed the `mongoose` dependency; removed the now
  meaningless `sync:inventory` script (there's nothing to sync between two
  databases anymore — `npm run seed` populates the one database directly).
- `.env.example` / `render.yaml`: removed `MONGODB_URI` entirely;
  `DATABASE_URL` is now the only database variable, and it points at the
  single Postgres instance that holds everything.
- `backend/prisma/migrations/20260822000000_mern_postgres_init/migration.sql`
  is a **hand-authored, consolidated** migration creating every table at
  once (replacing the earlier `..._inventory_audit_trail` migration, which
  only created the two inventory tables). It was hand-authored rather than
  generated by `prisma migrate dev` because this sandbox has no network
  access to `binaries.prisma.sh` (the Prisma engine binary host) — **run
  `npx prisma validate` and `npx prisma migrate deploy` yourself against a
  real Postgres instance as a first sanity check before deploying.**

### Why the frontend needed ZERO changes

Mongoose documents have `_id`; Prisma models have `id`. Rather than
rewriting the ~30 frontend files that read `_id` (ProductCard, AdminLogin,
ProductsManager, OrdersManager, ...), every controller wraps its Prisma
results through `backend/src/utils/serialize.js`'s `withId()`/`withIds()`
before `res.json(...)`, which mirrors `id` onto `_id` (recursively for
nested relations like `order.user` or `product.category`). The API's JSON
shape is otherwise unchanged. This is a deliberate compatibility shim, not
an oversight — it's what let this migration touch only `backend/`.

### Design decisions worth knowing if you extend this

- **IDs**: every table uses Prisma's `cuid()` instead of a Mongo
  `ObjectId`. Both are opaque strings, so nothing that treated ids as
  opaque strings (which is everything in this codebase) needed to change.
- **Embedded subdocuments → JSONB, not new tables.** `Order.items`,
  `User.addresses`, and `Product.reviews`/`sections`/`durationOptions`/
  `sizeStock` were Mongoose embedded-array subdocuments, always
  read/written as a whole array, never queried independently of their
  parent document. Postgres `JSONB` columns are the direct equivalent —
  turning them into normalized relational tables would have been a much
  bigger, riskier change for no behavioral benefit here.
- **`.populate()` has no JSON equivalent.** Where old code relied on
  Mongoose's `.populate('items.product')`, `orderController.js`'s
  `hydrateOrderItems()` now does the equivalent manually: collect every
  distinct product id referenced across the JSON `items` arrays, fetch
  them all in one query, and merge the full product object back onto each
  item. Same end result, one extra explicit step.
- **No more instance methods/hooks.** Prisma models are plain data — no
  `pre('save')` hooks, no methods on the document. Password hashing
  (`User.comparePassword`, the old pre-save hash hook) moved to
  `utils/userAuth.js`; `AdminLock.getSingleton()` moved to
  `utils/adminLock.js`. Every call site that used to do `user.save()` and
  rely on a hook firing now calls these helpers explicitly instead.
- **No native TTL index.** MongoDB auto-deleted expired
  `AdminOtpChallenge` rows; Postgres has no equivalent used here, so
  `authController.js` deletes expired/consumed challenges explicitly
  (on every new login attempt, and immediately on successful/failed
  verification) rather than relying on background expiry. If challenge
  volume ever gets large enough to matter, add a periodic
  `DELETE FROM "AdminOtpChallenge" WHERE "expiresAt" < now()` cron job.
- **Inventory's Product relation is now a real foreign key.**
  `InventoryItem.productId` used to be a plain string with NO database-level
  relationship to Mongo's `Product` collection (different databases,
  couldn't have one). Now that both live in the same Postgres database,
  `InventoryItem.productId` is a proper `@relation` with `onDelete:
  Cascade` — deleting a product now automatically deletes its inventory
  record too, which is correct behavior that wasn't previously enforceable.
  `InventoryMovement.productId` deliberately stays a plain string with NO
  foreign key, so the audit trail survives a product deletion.

### What to do before deploying this

1. Provision a PostgreSQL database and set `DATABASE_URL` in `backend/.env`.
2. `cd backend && npx prisma generate && npx prisma migrate deploy`
   (applies the consolidated migration — **do this against a fresh
   database**; it wasn't tested against a live Postgres instance in this
   sandbox for the reason noted above).
3. `npm run seed` to populate the catalog (optional, safe to skip if you're
   bringing your own product data).
4. Set the OTP/Twilio/SMTP/Cloudinary variables per section 8 above.

## 10. Homepage layout/sizing fixes, Garba/Other sections, and public-site admin editing

### Layout & sizing fixes
- **Beautiful Moments** (`components/home/MomentsGallery.jsx`): every card
  is now a fixed 350×470px box (was a masonry-style grid with varying
  heights per card, cropping some photos much harder than others).
- **Couple Collection homepage spotlight** (`components/home/CoupleSpotlight.jsx`):
  the image column was an even 50/50 split (`md:grid-cols-2`); it's now
  `md:grid-cols-[6fr_5fr]` — slightly wider than half — same fixed
  `h-[28rem]` height, less aggressive `object-cover` cropping.
- **Book an Appointment / Call Us / WhatsApp cards** (`components/home/ContactStrip.jsx`):
  colours inverted from the site's usual convention — dark card background
  with light text in light theme, light card background with dark text in
  dark theme (`bg-ink dark:bg-ivory` / `text-ivory dark:text-ink`).

### New Garba and Other sections
Added to `data/categories.js` (frontend) and its mirrored copy in
`backend/src/utils/seed.js`: `garba` (slug `garba`, reuses the Couple
Collection photo folder — no dedicated Garba photography exists in the
image ZIP) and `other` (slug `other`, reuses a slice of the Pagdi folder) —
both standalone categories with no `hub`, same pattern as Couple
Collection, so `pages/Category.jsx` renders them automatically. Both got a
top-level link in `components/layout/Navbar.jsx`'s `NAV_LINKS`.

**The Showroom Rail** (`components/home/CategoryRail.jsx`) was rewritten
from "every category in file order" to an explicit 9-card sequence — Bride,
Groom, Couple, Garba, Bride Jewellery, Groom Jewellery, Bride Jutti, Groom
Jutti, Other — rendered twice in a row so scrolling feels continuous rather
than stopping abruptly.

### Admin can now edit cards directly from the live public site
New pieces:
- `hooks/useAdminEditMode.js` — a read-only check of the same
  `vivah-admin-token`/`vivah-admin-user` localStorage keys
  `context/AdminContext.jsx` already manages, so PUBLIC pages (not just
  `/admin/*`) can tell whether the current visitor is a signed-in admin,
  without pulling in the separate AdminProvider that only wraps `/admin/*`
  (see `App.jsx`). `AdminContext.jsx`'s `persist()` now also dispatches a
  `vivah-admin-auth-changed` window event so this updates immediately on
  login/logout, not just on next page load.
- `components/admin/EditOverlay.jsx` — a small pencil/trash button pair
  that renders **nothing at all** unless `useAdminEditMode()` is true. Edit
  navigates into the matching existing admin CMS screen
  (`/admin/products`, `/admin/categories`, `/admin/gallery`); Delete (where
  wired) calls the real admin API directly and asks for confirmation first.

Wired into: `ProductCard.jsx` (edit + real delete, used on every product
grid sitewide), `CategoryRail.jsx` (Showroom Rail cards), `MomentsGallery.jsx`
(Beautiful Moments cards), `CoupleSpotlight.jsx`, `ContactStrip.jsx`.

**Scope note:** this routes an admin into the existing, already-built admin
CMS screens rather than a full inline WYSIWYG editor embedded directly in
the public page — building true in-place editing (edit text/images without
leaving the page) for literally every section of the site is a
substantially larger undertaking than this pass covers. What's here is a
real, working bridge — one click from any wired-up card takes an admin
straight to the correct CMS screen to make the change — extendable to
further sections using the same `EditOverlay` component.

## 11. Follow-up refinements: empty Garba/Other, sizing corrections, spotlight sections, "add new" tiles, auto-sequencing

### Garba and Other are now genuinely empty
Section 10 above reused existing photo folders for Garba/Other as
placeholders. Per a follow-up, that was wrong — both are now seeded with
**zero** products (`start === end` in `data/categories.js` and the
matching `backend/src/utils/seed.js` copy), with "Other" explicitly scoped
to western wear in its blurb. Both categories/pages/nav links still exist
and work — they just start with nothing until an admin adds real products
through Inventory Management. `pages/Category.jsx` shows a plain "No
pieces here yet" message plus (admin-only) an `AddCardTile` in the empty
grid.

### Sizing corrections (superseding section 10's numbers)
- **Couple Collection homepage spotlight** (`CoupleSpotlight.jsx`): image
  column width changed again, this time to roughly **half** of the
  previous (wider) version — `md:grid-cols-[6fr_5fr]` → `md:grid-cols-[2fr_5fr]`
  (image ~55% → ~29% of the row). Height unchanged (`h-[28rem]`).
- **Beautiful Moments** (`MomentsGallery.jsx`): fixed card size corrected
  from 350×470px to **400×500px**.
- **Trending Right Now** (`TrendingRentals.jsx`): card height increased
  ~10% via a new `imageAspect` prop on `ProductCard.jsx` (defaults to
  `"3/4"` everywhere else; TrendingRentals passes `"3/4.4"` — 4×1.1 = 4.4,
  exactly 10% more height at the same width). Uses an inline
  `style={{ aspectRatio }}` rather than a Tailwind class since the ratio is
  a runtime prop value, not a fixed class Tailwind's build step can see.

### Spotlight: Bride/Groom Jewellery split, Garba/Other added
`pages/Spotlight.jsx`'s combined "Jewellery Spotlight" rail (bride +
groom jewellery mixed together) is now two separate rails — "Bride
Jewellery Spotlight" and "Groom Jewellery Spotlight" — matching how Bride
and Groom already each get their own section. Garba and Other sections
were added too; since both start empty, their rails only render for a
logged-in admin (showing just the `AddCardTile`) — a normal visitor never
sees an empty scrollable rail with nothing in it.

### "Add New" tiles alongside every "Edit" overlay
New component: `components/admin/AddCardTile.jsx` — a dashed-border "+"
tile, admin-only (same `useAdminEditMode()` gate as `EditOverlay.jsx`),
placed at the end of a card grid/rail. Clicking it navigates into the
matching admin CMS screen (Products/Categories/Gallery) to create a new
item — same "bridge into the real CMS screen" design as `EditOverlay`,
not an inline creation form. Wired into: the Showroom Rail, Beautiful
Moments, Trending Right Now, every category product grid
(`Category.jsx`, `CategoryHub.jsx`, `JewelleryTypeHub.jsx`, `Trending.jsx`),
and every Spotlight rail.

### New items now reliably sort first ("automatic sequencing")
`Category`/`Banner`/`Gallery` creation (`categoryController.js`,
`miscController.js`) now auto-assigns a new item's `order` field to one
less than the current lowest `order` in that table — **guaranteeing** it
sorts before every existing item, rather than relying on `createdAt` as an
implicit tiebreaker (which would break the instant anyone manually
reorders items later). `Product`'s default public listing order
(`productController.js`) simplified to plain `createdAt: desc` (was
`isFeatured desc, then createdAt desc`) so a newly added product always
appears first, not just first-among-non-featured-items.

### Confirmed: nobody is logged in by default
Checked `ShowroomContext.jsx` (customer) and `AdminContext.jsx` (admin) —
both already initialize their user state from `localStorage`, defaulting
to `null`/logged-out with no auto-login/demo-account code path anywhere.
This was already correct; no code change was needed here, only verification.

## 12. Nav Home/Back, availability badge, showroom-floor/testimonials swap

- **Navbar** (`components/layout/Navbar.jsx`): added an explicit **"Home"**
  link as the first `NAV_LINKS` entry (in front of Spotlight) — does the
  same `to="/"` navigation the wordmark already did, just as its own nav
  item too. Added a **Back** icon button (`ArrowLeft`, `navigate(-1)`) at
  the very front of the header, left of the wordmark, for one-step-back
  browser navigation. The wordmark itself still links home as before.
- **Product availability**: `ProductCard.jsx`'s top-left badge is now
  always shown (not just when unavailable) — green "Available" or red
  "Reserved," each with a matching icon (`CheckCircle2`/`XCircle`), so a
  grid's stock status is scannable at a glance. `EditOverlay.jsx` gained an
  optional `style` prop so `ProductCard` can nudge the admin Edit/Delete
  buttons down (`top: 2.75rem`) to sit below this badge instead of
  overlapping it.
- **Homepage section order**: swapped `Testimonials` ("What Our Couples
  Say") and `InstagramGallery` ("From the Showroom Floor") in
  `pages/Home.jsx` — Showroom Floor now comes first.
- **Showroom Floor card size**: `InstagramGallery.jsx` changed from a
  fluid 7-column CSS grid (card size = container width ÷ 7, ~160px) to a
  fixed 210×210px horizontally-scrolling rail — 210 ≈ 160 × 1.3, i.e. 30%
  larger — per an explicit request. A fluid grid has no way to be "30%
  bigger" while still filling the same container edge-to-edge; a rail with
  an explicit pixel size does.

## 13. Availability badge: icon only, no text

`ProductCard.jsx`'s availability badge (added in section 12) simplified to
just the icon — green circle + check for available, red circle + X for
unavailable — no "Available"/"Reserved" text label. The words are still
present as `aria-label`/`title` (screen readers + hover tooltip), just not
rendered visibly on the card.

## 14. Mobile-view card rework + Owner/User Login split

### ProductCard.jsx — applies everywhere (Trending, every category grid, Spotlight, Wishlist, Related Pieces)
- **"Rent Now" moved off the image** into the text section below it, as a
  normal always-visible button next to the price — it used to be an
  absolute-positioned overlay bar that faded in on hover, which crowded
  against the availability icon/wishlist heart/expand hint on small touch
  screens where hover doesn't really apply. Removing it from the image
  area also directly fixes the "too much margin between Rent Now/
  favourite/availability icon" issue, since those three no longer share
  the same overlay space.
- **Corners less rounded**: `rounded-3xl` → `rounded-2xl`.
- **Image section taller** (default `imageAspect` lengthened from `"3/4"`
  to `"3/4.6"`) — only the photo area grows; the text section's own
  padding/line-heights are untouched, so its height stays fixed.
- **Slightly more width per card on mobile**: every grid using
  `ProductCard` (`TrendingRentals.jsx`, `Category.jsx`, `CategoryHub.jsx`,
  `JewelleryTypeHub.jsx`, `Trending.jsx`) changed its grid gap from a flat
  `gap-6` to `gap-4 sm:gap-6` — smaller gap on mobile's 2-column layout
  gives each card more width there specifically.
- `TrendingRentals.jsx` no longer passes its own custom `imageAspect`
  override — it used to be intentionally ~10% taller than every other
  grid; now that ProductCard's shared default grew for everyone, it just
  uses the same default like every other section (matches the request
  that this change "will change everywhere this same format is followed").
- Every `AddCardTile` paired with a `ProductCard` grid updated to match
  (`rounded-2xl`, `aspectRatio: "3/4.6"`) so the admin-only "Add Product"
  tile stays visually consistent with its neighbors.

### Navbar — Owner Login / User Login split, with a live lock indicator
`components/layout/Navbar.jsx`'s single "Admin Login" pill is now TWO
separate, clearly labeled pills on desktop: **User Login** (was just a bare
icon; switches to "My Account" once signed in) and **Owner Login** (was
"Admin Login," renamed). Owner Login now polls the public
`GET /api/auth/admin-lock-status` endpoint every 30s and visually greys
out with a lock icon whenever a DIFFERENT admin currently holds the single
active admin session — purely a visual hint (it's still clickable, and
goes to `/admin`, which explains the lock and lets a different admin
account sign in); the actual single-session rule is unchanged and still
enforced entirely server-side (`middleware/auth.js`'s `adminSessionGuard`).
The mobile menu got the matching rename + lock indicator.

### Not addressed this round — needs more information
Two items from this request weren't actionable without more detail:
- **"navbar not working, no general content here yet"** — unclear what's
  broken without seeing it live. If this refers to the Garba/Other
  category pages showing "No pieces here yet," that's intentional (see
  section 11) — those two categories are seeded empty on purpose, waiting
  for an admin to add real products via Inventory Management. If it's a
  genuine navigation bug, a screenshot or the exact page/link that fails
  would help track it down.
- **Comprehensive site-wide inline editing** ("entire website ... each
  image card, text, add card, delete card etc ... editable ... only for
  owner") — this is the existing `EditOverlay`/`AddCardTile`/
  `useAdminEditMode` system from sections 10–11, already wired into 7-8
  components sitewide and unaffected by this round's changes. If specific
  sections still don't show edit controls after logging in as owner, name
  them and they can be wired up the same way.

## 15. Mobile: nav links now visible without opening the hamburger menu

The Home/Bride/Groom/Jewellery/Couple/Garba/Other links were only ever
reachable on mobile by tapping the hamburger icon (the row rendering
`NAV_LINKS` was `hidden lg:flex` — invisible below the desktop breakpoint,
with no other trace of it on screen). Added a second, always-visible strip
in `Navbar.jsx` — same `NAV_LINKS` list, horizontally scrollable, sitting
right under the header — shown only below `lg` (`lg:hidden`, so desktop is
unaffected, it still uses the original mega-menu row). The current page's
link highlights in wine/gold via `NavLink`'s `isActive`. Uses the
`rail-scroll` CSS class already defined in `index.css` for a slim styled
scrollbar, matching every other horizontal rail on the site (Showroom
Rail, Spotlight, Showroom Floor).

## 16. Sub-navigation header: auto-hide on scroll down, reappear on scroll up

`components/layout/HubHeader.jsx` — the tab bar (e.g. "Bridal Lehengas /
Sarees / Gowns / Jutti") shown on every hub page reached from the homepage
Showroom Rail — now slides away when scrolling down and reappears the
instant you scroll up, staying pinned visible only near the very top of
the page. Implemented once in this single shared component, so it applies
automatically to all four hub pages that use it: Bride, Groom (both via
`CategoryHub.jsx`), and both Jewellery hubs (`JewelleryHub.jsx`,
`JewelleryTypeHub.jsx`) — no per-page changes needed.
