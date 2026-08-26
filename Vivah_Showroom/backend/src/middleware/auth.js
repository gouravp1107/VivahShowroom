// ============================================================================
// middleware/auth.js — the two guards used to protect routes:
//   protect()   -> requires ANY logged-in user (attaches req.user)
//   adminOnly() -> requires req.user.role === 'admin' (use AFTER protect())
//
// USAGE PATTERN (see any file in routes/ for real examples):
//   router.get('/mine', protect, myOrders)                    // any logged-in user
//   router.get('/', protect, adminOnly, listAllOrders)          // admin only
//
// HOW protect() WORKS:
//   1. Looks for a JWT in the "Authorization: Bearer <token>" header (the
//      normal case — see frontend's src/api/client.js, which attaches this
//      header automatically once someone's logged in) or, as a fallback,
//      in a "token" cookie (cookieParser is set up in app.js).
//   2. Verifies the token's signature/expiry using JWT_SECRET (must match
//      the same secret used to CREATE the token — see
//      utils/generateToken.js). An invalid or expired token, or no token
//      at all, results in a 401 response and the request goes no further.
//   3. Looks up the actual User in PostgreSQL by the id encoded in the
//      token, and attaches it to req.user (password field excluded) so
//      every route handler downstream can read req.user.
//
// adminOnly() just checks req.user.role — there's no separate "admin
// login" role assignment path; you make a user an admin by editing their
// `role` column to 'admin' directly in the database (see README's note on
// this — there's intentionally no public sign-up path to admin, other than
// the ADMIN_SETUP_KEY-gated adminRegister() flow).
// ============================================================================
import jwt from 'jsonwebtoken'
import prisma from '../lib/prisma.js'
import { getAdminLockSingleton } from '../utils/adminLock.js'
import { toSafeUser } from '../utils/userAuth.js'
import { withId } from '../utils/serialize.js'

export async function protect(req, res, next) {
  try {
    const header = req.headers.authorization
    const token = header && header.startsWith('Bearer ') ? header.split(' ')[1] : req.cookies?.token
    if (!token) return res.status(401).json({ message: 'Not authorized, no token' })

    const decoded = jwt.verify(token, process.env.JWT_SECRET) // throws if invalid/expired -> caught below
    const user = await prisma.user.findUnique({ where: { id: decoded.id } })
    if (!user) return res.status(401).json({ message: 'User no longer exists' })

    req.user = toSafeUser(withId(user)) // includes both `.id` and a Mongo-style `._id` alias — see utils/serialize.js — and never exposes the hashed password downstream
    next()
  } catch (err) {
    return res.status(401).json({ message: 'Not authorized, token invalid or expired' })
  }
}

// Must run AFTER protect() (needs req.user to already be set).
export function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Admin access required' })
  if (req.user?.isActive === false) return res.status(403).json({ message: 'This admin account is no longer active' })
  next()
}

// Stronger guard for the actual /admin panel routes (not just "role is
// admin"): also confirms the request's token is the CURRENTLY checked-out
// session held in the AdminLock singleton (see prisma/schema.prisma's
// AdminLock model). This stops an old admin token from still working after
// that admin logged out, or after a different admin has since logged in
// and taken the lock. Must run AFTER protect() + adminOnly().
export async function adminSessionGuard(req, res, next) {
  try {
    const header = req.headers.authorization
    const token = header && header.startsWith('Bearer ') ? header.split(' ')[1] : req.cookies?.token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const lock = await getAdminLockSingleton()

    const stillHeld = lock.heldById && lock.tokenJti && lock.heldById === req.user._id && lock.tokenJti === decoded.jti
    const notExpired = !lock.expiresAt || lock.expiresAt.getTime() > Date.now()

    if (!stillHeld || !notExpired) {
      return res.status(423).json({ message: 'Your admin session has ended. Please log in to /admin again.', code: 'ADMIN_SESSION_ENDED' })
    }
    next()
  } catch (err) {
    return res.status(401).json({ message: 'Admin session invalid or expired' })
  }
}

// Convenience bundle for any route that should only work from an active,
// checked-out /admin panel session — spread it into a route's middleware
// list: router.post('/', ...adminGuard, createProduct)
export const adminGuard = [protect, adminOnly, adminSessionGuard]
