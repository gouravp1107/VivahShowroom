// ============================================================================
// utils/generateToken.js — creates the JWT (JSON Web Token) issued on
// login/register/guest-login/admin-login (see controllers/authController.js,
// the only place this gets called). This token is what the frontend stores
// in localStorage (`vivah-token` for customers, `vivah-admin-token` for the
// admin panel — see ShowroomContext.jsx / admin/AdminContext.jsx) and sends
// back on every subsequent request via the Authorization header (see
// frontend/src/api/client.js). middleware/auth.js's protect() function
// verifies this token using the SAME JWT_SECRET to authenticate requests.
//
// The token encodes { id, role, jti }. `jti` (JWT ID) is only meaningful for
// admin tokens — it's a random id unique to THIS login, stashed alongside
// the singleton AdminLock record (see prisma/schema.prisma's AdminLock model) so
// middleware/auth.js's adminSessionGuard can tell "this is the currently
// checked-out admin session" apart from an older admin token that's
// technically still unexpired but should no longer work (e.g. after the
// admin logged out, or another admin later logged in).
// ============================================================================
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

export function generateToken(userId, role = 'customer', options = {}) {
  const { jti, expiresIn } = options
  return jwt.sign({ id: userId, role, jti: jti || undefined }, process.env.JWT_SECRET, {
    expiresIn: expiresIn || process.env.JWT_EXPIRES_IN || '7d', // how long before the user needs to log in again
  })
}

// A fresh random session id for a new admin login — see AdminLock.tokenJti above.
export function newSessionId() {
  return crypto.randomBytes(16).toString('hex')
}
