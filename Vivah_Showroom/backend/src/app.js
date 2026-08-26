// ============================================================================
// app.js — builds and configures the Express application: security
// middleware, then mounts every route group under /api/*. Deliberately
// separated from server.js (which calls createApp() and starts listening)
// so this file can be imported on its own — e.g. in tests — without
// requiring a live PostgreSQL connection first.
//
// REQUEST FLOW (middleware runs top-to-bottom for every request):
//   helmet          -> sets security-related HTTP headers
//   cors            -> only allows requests from origins listed in
//                      CORS_ORIGINS env var (comma-separated) — this is
//                      what lets the deployed frontend (Vercel) talk to
//                      this deployed backend (Render) while blocking
//                      random other websites from calling the API
//   express.json    -> parses incoming JSON request bodies into req.body
//   cookieParser    -> parses cookies into req.cookies (used as a fallback
//                      auth method in middleware/auth.js, alongside the
//                      more common Authorization: Bearer header)
//   morgan          -> logs each request to the console (verbose in dev,
//                      compact "combined" format in production)
//   rateLimit       -> caps each IP to 300 requests per 15 minutes on any
//                      /api/* route, as basic abuse protection
//   /uploads        -> serves locally-stored uploaded files (see
//                      config/upload.js) as static files, e.g. an admin-
//                      uploaded banner image becomes reachable at
//                      /uploads/<filename>
//
// ROUTE GROUPS (each file in routes/ owns one resource — open any of them
// to see its specific endpoints):
//   /api/auth          -> routes/authRoutes.js       (register/login/guest/reset password)
//   /api/users         -> routes/userRoutes.js        (profile, addresses, wishlist)
//   /api/products      -> routes/productRoutes.js     (browse/search products, reviews)
//   /api/categories    -> routes/categoryRoutes.js    (the 12 shoppable categories)
//   /api/orders        -> routes/orderRoutes.js        (rentals/bookings)
//   /api/appointments  -> routes/appointmentRoutes.js (fitting/trial bookings)
//   /api (misc)        -> routes/miscRoutes.js         (feedback, contact, notifications, banners, gallery)
//   /api/admin         -> routes/adminRoutes.js         (dashboard stats, customer list — admin-only)
//
// Any request that doesn't match one of the above hits `notFound` (404
// JSON response); any error thrown/passed to next() in any route handler
// ends up in `errorHandler` (see middleware/errorHandler.js for both).
// ============================================================================
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import path from 'path'
import { fileURLToPath } from 'url'

import authRoutes from './routes/authRoutes.js'
import userRoutes from './routes/userRoutes.js'
import productRoutes from './routes/productRoutes.js'
import categoryRoutes from './routes/categoryRoutes.js'
import orderRoutes from './routes/orderRoutes.js'
import appointmentRoutes from './routes/appointmentRoutes.js'
import miscRoutes from './routes/miscRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import couponRoutes from './routes/couponRoutes.js'
import mediaRoutes from './routes/mediaRoutes.js'
import inventoryRoutes from './routes/inventory.js'
import { notFound, errorHandler } from './middleware/errorHandler.js'

// ESM modules don't have __dirname built in like CommonJS does — this
// recreates it from import.meta.url, needed below to locate the uploads/ folder.
const __dirname = path.dirname(fileURLToPath(import.meta.url))

export function createApp() {
  const app = express()

  // Which frontend URLs are allowed to call this API — set via the
  // CORS_ORIGINS env var (comma-separated list), defaulting to the local
  // Vite dev server URL if unset. See backend/.env.example.
  const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())

  app.use(helmet({ crossOriginResourcePolicy: false })) // security headers; CORP disabled so uploaded images can be embedded cross-origin
  app.use(
    cors({
      origin: (origin, callback) => {
        // `origin` is undefined for same-origin/non-browser requests (e.g. Postman, curl) — always allow those.
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
        callback(new Error('Not allowed by CORS'))
      },
      credentials: true, // allows cookies to be sent cross-origin (used by the cookie-based auth fallback in middleware/auth.js)
    })
  )
  app.use(express.json({ limit: '2mb' })) // parses JSON bodies into req.body; 2mb cap guards against huge payloads
  app.use(express.urlencoded({ extended: true }))
  app.use(cookieParser())
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev')) // request logging to the console

  // Basic anti-abuse: max 300 requests per IP per 15-minute window, applied
  // to every /api/* route.
  const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300 })
  app.use('/api', limiter)

  // Serves files uploaded via Multer (see config/upload.js) as plain static
  // files — e.g. a file saved as uploads/169...-photo.jpg becomes reachable
  // at GET /uploads/169...-photo.jpg.
  app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

  // Health check endpoint — used by Render's `healthCheckPath` (see
  // backend/render.yaml) to confirm the service is alive after deploy.
  app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }))

  // Mount every resource's routes under its own /api/... prefix.
  // See README.md's "API Overview" table for a quick-reference list of
  // every individual endpoint these expose.
  app.use('/api/auth', authRoutes)
  app.use('/api/users', userRoutes)
  app.use('/api/products', productRoutes)
  app.use('/api/categories', categoryRoutes)
  app.use('/api/orders', orderRoutes)
  app.use('/api/appointments', appointmentRoutes)
  app.use('/api', miscRoutes) // this file defines its own sub-paths like /feedback, /contact, /notifications, /banners, /gallery
  app.use('/api/admin', adminRoutes)
  app.use('/api/coupons', couponRoutes)
  app.use('/api/media', mediaRoutes) // shared admin image upload/library endpoint (see routes/mediaRoutes.js)
  app.use('/api/inventory', inventoryRoutes) // owner inventory — same PostgreSQL database as everything else

  // Must be registered LAST: notFound catches any unmatched route (404),
  // errorHandler catches any error passed via next(err) from route handlers
  // above and turns it into a consistent JSON error response.
  app.use(notFound)
  app.use(errorHandler)

  return app
}
