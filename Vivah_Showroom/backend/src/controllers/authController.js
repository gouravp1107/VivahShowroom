// ============================================================================
// controllers/authController.js — the actual logic behind every
// /api/auth/* route (see routes/authRoutes.js for how these functions get
// attached to specific HTTP methods/paths + validation rules).
//
// A "controller" function is just the request handler itself: it receives
// (req, res), reads whatever it needs from req.body/req.params/req.user,
// talks to the database via Prisma, and sends back res.json(...). Keeping
// this logic in separate controller files (rather than inline in the route
// files) keeps routes/*.js focused on "which URL maps to which function"
// while controllers/*.js hold the "what actually happens" code.
//
// CONNECTS TO:
//   - prisma/schema.prisma's User model -> prisma.user.create/findUnique,
//     with password hashing/checking now in utils/userAuth.js (Prisma
//     models don't support Mongoose-style instance methods/hooks, so that
//     logic moved out of the model and into this file's call sites)
//   - utils/generateToken.js -> issues the JWT returned to the frontend
//   - middleware/auth.js     -> verifies that JWT on later requests
//   - frontend/src/api/index.js -> loginRequest()/registerRequest() call
//     these via POST /api/auth/login and /api/auth/register
// ============================================================================
import prisma from '../lib/prisma.js'
import { getAdminLockSingleton } from '../utils/adminLock.js'
import { generateToken, newSessionId } from '../utils/generateToken.js'
import { generateOtp, hashOtp, verifyOtp, maskPhone, maskEmail } from '../utils/otp.js'
import { hashPassword, comparePassword, toSafeUser } from '../utils/userAuth.js'
import { withId } from '../utils/serialize.js'
import { sendSms } from '../utils/sms.js'
import { sendMail } from '../utils/mailer.js'
import crypto from 'crypto'

// --- Dual-OTP admin login tuning (see .env.example) ---
const OTP_EXPIRY_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES || 5)
const OTP_MAX_ATTEMPTS = Number(process.env.OTP_MAX_ATTEMPTS || 5)
const OTP_RESEND_COOLDOWN_SECONDS = Number(process.env.OTP_RESEND_COOLDOWN_SECONDS || 60)

// How long a checked-out admin session may stay active before it auto-expires
// and releases the lock even if nobody explicitly logged out (safety net for
// a closed browser tab / crashed device). Kept shorter than the 7-day
// customer token lifetime on purpose.
const ADMIN_SESSION_HOURS = Number(process.env.ADMIN_SESSION_HOURS || 12)

function safe(user) {
  return withId(toSafeUser(user))
}

// POST /api/auth/register — creates a new account and immediately logs
// them in (returns a token right away, no separate "confirm your email
// then log in" step, even though verification infrastructure exists below).
export async function register(req, res) {
  const { name, email, password, phone } = req.body
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return res.status(409).json({ message: 'An account with this email already exists' })

  const verificationToken = crypto.randomBytes(20).toString('hex')
  const user = await prisma.user.create({
    data: { name, email, phone, verificationToken, password: await hashPassword(password) },
  })

  // Email verification / OTP dispatch would be wired here via nodemailer in production.
  const token = generateToken(user.id, user.role)
  res.status(201).json({ user: safe(user), token })
}

// POST /api/auth/login — standard email+password check for CUSTOMERS.
// Deliberately refuses admin accounts here (they get a generic "invalid
// email or password" like any other mismatch, so this endpoint gives no
// hint that admin-login even exists) — admins must use the
// /api/auth/admin-login/* endpoints instead, the only place that checks
// the single-admin-session lock and issues an admin-usable token. This is
// what keeps the admin login entry point invisible to ordinary users even
// if they inspect the API.
export async function login(req, res) {
  const { email, password } = req.body
  const user = await prisma.user.findUnique({ where: { email } })
  // Deliberately give the SAME error for "no such user", "wrong password"
  // and "this is actually an admin account" so attackers can't use this to
  // guess valid emails or discover admin accounts.
  if (!user || user.role === 'admin' || !(await comparePassword(password, user.password))) {
    return res.status(401).json({ message: 'Invalid email or password' })
  }
  const token = generateToken(user.id, user.role)
  res.json({ user: safe(user), token })
}

// POST /api/auth/guest — "Continue as Guest" on the frontend's login page.
// Creates a throwaway account with a random fake email and isGuest: true
// (guest accounts skip the password requirement entirely), so the rest of
// the app (wishlist, orders, etc.) still has a real user id to attach things to.
export async function guestLogin(req, res) {
  const guestId = crypto.randomBytes(8).toString('hex')
  const user = await prisma.user.create({
    data: { name: 'Guest', email: `guest_${guestId}@vivahtrousseau.local`, isGuest: true },
  })
  const token = generateToken(user.id, user.role)
  res.status(201).json({ user: safe(user), token })
}

// POST /api/auth/forgot-password — generates a reset token, valid 30
// minutes, and (in production) would email it as a reset link via
// utils/mailer.js. The response wording is IDENTICAL whether or not the
// email exists — this prevents "account enumeration" (an attacker probing
// which emails are registered by watching for different responses).
export async function forgotPassword(req, res) {
  const { email } = req.body
  const user = await prisma.user.findUnique({ where: { email } })
  // Always respond the same way whether or not the account exists, to avoid account enumeration.
  if (user) {
    const resetToken = crypto.randomBytes(20).toString('hex')
    // Store only a HASH of the reset token in the database (same idea as
    // password hashing) — even if the database were compromised, the raw
    // token that would need to appear in a URL couldn't be reconstructed.
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: crypto.createHash('sha256').update(resetToken).digest('hex'),
        resetPasswordExpires: new Date(Date.now() + 1000 * 60 * 30), // 30 minutes from now
      },
    })
    // In production: email the resetToken (the RAW one, not the hash) as a link via nodemailer.
  }
  res.json({ message: 'If an account exists for that email, a reset link has been sent.' })
}

// POST /api/auth/reset-password — the second half of the forgot-password
// flow: takes the raw token (from the emailed link) + a new password,
// re-hashes the token the same way to find the matching user, and checks
// it hasn't expired.
export async function resetPassword(req, res) {
  const { token, password } = req.body
  const hashed = crypto.createHash('sha256').update(token).digest('hex')
  const user = await prisma.user.findFirst({ where: { resetPasswordToken: hashed, resetPasswordExpires: { gt: new Date() } } })
  if (!user) return res.status(400).json({ message: 'Reset token is invalid or has expired' })

  await prisma.user.update({
    where: { id: user.id },
    data: { password: await hashPassword(password), resetPasswordToken: null, resetPasswordExpires: null },
  })
  res.json({ message: 'Password has been reset. Please sign in.' })
}

// GET /api/auth/verify-email/:token — the link a user would click from a
// verification email sent at registration (email sending isn't actually
// wired up yet — see the comment in register() above).
export async function verifyEmail(req, res) {
  const { token } = req.params
  const user = await prisma.user.findFirst({ where: { verificationToken: token } })
  if (!user) return res.status(400).json({ message: 'Invalid or expired verification link' })
  await prisma.user.update({ where: { id: user.id }, data: { isVerified: true, verificationToken: null } })
  res.json({ message: 'Email verified successfully' })
}

// GET /api/auth/me — returns the currently logged-in user's profile.
// Requires the `protect` middleware to run first (see routes/authRoutes.js),
// which is what populates req.user in the first place.
export async function me(req, res) {
  res.json({ user: req.user })
}

// ============================================================================
// ADMIN AUTH — completely separate from the customer login above. Regular
// customer login (POST /api/auth/login) intentionally still works for
// anyone, admin included, but customer login never checks/holds the admin
// lock and never returns an admin-usable session — only the
// admin-login/init+verify pair below does that. This is what keeps "Admin
// Login" invisible/meaningless to normal users: even if they find the
// endpoint, admin accounts only ever come from adminRegister() (which
// requires ADMIN_SETUP_KEY), and only adminVerifyOtp() checks out the
// single shared admin session lock.
// ============================================================================

// POST /api/auth/admin-register — creates a NEW admin account. Requires
// `setupKey` to match ADMIN_SETUP_KEY (set in backend/.env, shared with a
// new owner out-of-band — e.g. over phone/WhatsApp — at the time the
// business changes hands). This is the "transfer ownership" mechanism: the
// new owner never needs the previous admin's email/password.
//
// By default this also deactivates every OTHER existing admin account
// (isActive: false), so the previous owner permanently loses admin access
// once the new owner's account is created — while their account/order
// history stays in the database rather than being deleted. Pass
// `deactivateOthers: false` in the body to skip that (e.g. to add a second
// co-admin instead of replacing the owner).
export async function adminRegister(req, res) {
  const { name, email, password, setupKey, deactivateOthers = true } = req.body
  if (!process.env.ADMIN_SETUP_KEY || setupKey !== process.env.ADMIN_SETUP_KEY) {
    return res.status(403).json({ message: 'Invalid setup key' })
  }
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required' })
  }
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return res.status(409).json({ message: 'An account with this email already exists' })

  const admin = await prisma.user.create({
    data: { name, email, role: 'admin', isActive: true, isVerified: true, password: await hashPassword(password) },
  })

  if (deactivateOthers) {
    await prisma.user.updateMany({ where: { role: 'admin', id: { not: admin.id } }, data: { isActive: false } })
    // Release any lock the previous owner might currently be holding, so
    // the new owner isn't blocked waiting for a session that will never log out.
    await prisma.adminLock.upsert({
      where: { id: 'admin-lock' },
      update: { heldById: null, heldByEmail: null, tokenJti: null, lockedAt: null, expiresAt: null },
      create: { id: 'admin-lock' },
    })
  }

  res.status(201).json({ message: 'Admin account created. You can now log in at /admin.', admin: safe(admin) })
}

// Shared by adminVerifyOtp() below — the actual "create the single active
// admin session" logic, unchanged in behavior from the old single-step
// adminLogin(), just now only reachable AFTER both OTPs have been verified.
async function issueAdminSession(user) {
  const lock = await getAdminLockSingleton()
  const lockedByAnother = lock.heldById && lock.heldById !== user.id && lock.expiresAt && lock.expiresAt.getTime() > Date.now()
  if (lockedByAnother) {
    const err = new Error(`Admin panel is currently in use by ${lock.heldByEmail || 'another admin'}. Ask them to log out, or wait for the session to expire.`)
    err.status = 423
    err.code = 'ADMIN_LOCKED'
    err.expiresAt = lock.expiresAt
    throw err
  }

  const jti = newSessionId()
  const expiresIn = `${ADMIN_SESSION_HOURS}h`
  const token = generateToken(user.id, 'admin', { jti, expiresIn })
  const expiresAt = new Date(Date.now() + ADMIN_SESSION_HOURS * 60 * 60 * 1000)

  await prisma.adminLock.upsert({
    where: { id: 'admin-lock' },
    update: { heldById: user.id, heldByEmail: user.email, tokenJti: jti, lockedAt: new Date(), expiresAt },
    create: { id: 'admin-lock', heldById: user.id, heldByEmail: user.email, tokenJti: jti, lockedAt: new Date(), expiresAt },
  })

  return { user: safe(user), token, lockExpiresAt: expiresAt }
}

// Builds + sends one fresh OTP for one channel ('phone' | 'email') and
// returns its hash — used by both adminLoginInit() and adminResendOtp().
// Codes are ALWAYS sent to the fixed server-configured contact (never to
// anything supplied by the request), per the "never send OTPs to
// arbitrary user-provided phone/email" requirement.
async function dispatchOtp(channel) {
  const code = generateOtp()
  if (channel === 'phone') {
    const to = process.env.ADMIN_PHONE_NUMBER
    if (!to) throw Object.assign(new Error('ADMIN_PHONE_NUMBER is not configured on the server.'), { status: 500 })
    await sendSms({ to, body: `Your Vivah Showroom admin verification code is ${code}. It expires in ${OTP_EXPIRY_MINUTES} minutes. Never share this code.` })
  } else {
    const to = process.env.ADMIN_OWNER_EMAIL
    if (!to) throw Object.assign(new Error('ADMIN_OWNER_EMAIL is not configured on the server.'), { status: 500 })
    await sendMail({
      to,
      subject: 'Vivah Showroom — Admin sign-in verification code',
      html: `<p>Your admin verification code is <strong>${code}</strong>.</p><p>It expires in ${OTP_EXPIRY_MINUTES} minutes. Never share this code with anyone.</p>`,
    })
  }
  return hashOtp(code)
}

// POST /api/auth/admin-login/init — STEP 1 of admin sign-in: checks the
// email+password like the old single-step adminLogin() used to, but instead
// of issuing a session immediately, it creates an AdminOtpChallenge and
// sends one OTP to the registered admin PHONE and a second, independent OTP
// to the registered showroom OWNER EMAIL (both fixed server config, not
// user input). No admin session/JWT exists yet — see adminVerifyOtp() below,
// which is the only place a session gets created.
export async function adminLoginInit(req, res) {
  const { email, password } = req.body
  const user = await prisma.user.findFirst({ where: { email, role: 'admin' } })
  // Same generic error for "no such admin", "wrong password" — never reveal
  // which one, so this can't be used to enumerate admin accounts.
  if (!user || !(await comparePassword(password, user.password))) {
    return res.status(401).json({ message: 'Invalid email or password' })
  }
  if (!user.isActive) {
    return res.status(403).json({ message: 'This admin account is no longer active. Contact the current business owner.' })
  }

  // Reject up front (before spending an OTP) if another admin already holds
  // the single active session — same check issueAdminSession() will repeat
  // after OTP verification, in case the lock changes in the meantime.
  const lock = await getAdminLockSingleton()
  const lockedByAnother = lock.heldById && lock.heldById !== user.id && lock.expiresAt && lock.expiresAt.getTime() > Date.now()
  if (lockedByAnother) {
    return res.status(423).json({
      message: `Admin panel is currently in use by ${lock.heldByEmail || 'another admin'}. Ask them to log out, or wait for the session to expire.`,
      code: 'ADMIN_LOCKED',
      expiresAt: lock.expiresAt,
    })
  }

  if (!process.env.ADMIN_PHONE_NUMBER || !process.env.ADMIN_OWNER_EMAIL) {
    return res.status(500).json({ message: 'Admin OTP delivery is not configured on the server (ADMIN_PHONE_NUMBER / ADMIN_OWNER_EMAIL).' })
  }

  // Clear out any previous unfinished (or expired — Postgres has no native
  // TTL index like Mongo did, so this doubles as manual cleanup) challenge
  // for this admin first, so only ever one is live and old codes can't
  // linger as valid.
  await prisma.adminOtpChallenge.deleteMany({ where: { OR: [{ adminId: user.id }, { expiresAt: { lt: new Date() } }] } })

  const [phoneOtpHash, emailOtpHash] = await Promise.all([dispatchOtp('phone'), dispatchOtp('email')])

  const challenge = await prisma.adminOtpChallenge.create({
    data: {
      adminId: user.id,
      phoneOtpHash,
      emailOtpHash,
      maskedPhone: maskPhone(process.env.ADMIN_PHONE_NUMBER),
      maskedEmail: maskEmail(process.env.ADMIN_OWNER_EMAIL),
      ip: req.ip,
      expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
    },
  })

  res.json({
    challengeId: challenge.id,
    maskedPhone: challenge.maskedPhone,
    maskedEmail: challenge.maskedEmail,
    expiresAt: challenge.expiresAt,
    message: 'Enter the code sent to the registered admin phone and the code sent to the registered owner email.',
  })
}

// POST /api/auth/admin-login/verify — STEP 2: both the phone OTP and the
// email OTP must be correct in the SAME request for a session to be
// created. Verifying only one is deliberately never sufficient — there's no
// code path here that issues a session from partial verification.
export async function adminVerifyOtp(req, res) {
  const { challengeId, phoneOtp, emailOtp } = req.body
  const challenge = await prisma.adminOtpChallenge.findUnique({ where: { id: challengeId }, include: { admin: true } })
  if (!challenge) {
    return res.status(400).json({ message: 'This verification session has expired or is invalid. Please sign in again.' })
  }
  if (challenge.expiresAt.getTime() <= Date.now()) {
    await prisma.adminOtpChallenge.delete({ where: { id: challenge.id } })
    return res.status(400).json({ message: 'These codes have expired. Please sign in again.' })
  }
  if (challenge.phoneAttempts >= OTP_MAX_ATTEMPTS || challenge.emailAttempts >= OTP_MAX_ATTEMPTS) {
    await prisma.adminOtpChallenge.delete({ where: { id: challenge.id } })
    return res.status(429).json({ message: 'Too many incorrect attempts. Please sign in again.' })
  }

  const phoneOk = verifyOtp(phoneOtp, challenge.phoneOtpHash)
  const emailOk = verifyOtp(emailOtp, challenge.emailOtpHash)

  if (!phoneOk || !emailOk) {
    await prisma.adminOtpChallenge.update({
      where: { id: challenge.id },
      data: { phoneAttempts: { increment: 1 }, emailAttempts: { increment: 1 } },
    })
    return res.status(401).json({ message: 'One or both verification codes are incorrect.' })
  }

  try {
    const session = await issueAdminSession(challenge.admin)
    await prisma.adminOtpChallenge.delete({ where: { id: challenge.id } }) // one-time use — consumed the moment a session is issued
    return res.json(session)
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message, code: err.code, expiresAt: err.expiresAt })
    throw err
  }
}

// POST /api/auth/admin-login/resend — resends ONE channel's code
// ('phone' or 'email') for an in-progress challenge, rate-limited per
// channel so this can't be used to spam the admin's phone/inbox.
export async function adminResendOtp(req, res) {
  const { challengeId, channel } = req.body
  if (!['phone', 'email'].includes(channel)) {
    return res.status(400).json({ message: 'channel must be "phone" or "email"' })
  }
  const challenge = await prisma.adminOtpChallenge.findUnique({ where: { id: challengeId } })
  if (!challenge) return res.status(400).json({ message: 'This verification session has expired or is invalid. Please sign in again.' })
  if (challenge.expiresAt.getTime() <= Date.now()) {
    await prisma.adminOtpChallenge.delete({ where: { id: challenge.id } })
    return res.status(400).json({ message: 'These codes have expired. Please sign in again.' })
  }

  const lastSentField = channel === 'phone' ? 'phoneLastSentAt' : 'emailLastSentAt'
  const secondsSinceLastSend = (Date.now() - new Date(challenge[lastSentField]).getTime()) / 1000
  if (secondsSinceLastSend < OTP_RESEND_COOLDOWN_SECONDS) {
    return res.status(429).json({ message: `Please wait ${Math.ceil(OTP_RESEND_COOLDOWN_SECONDS - secondsSinceLastSend)}s before requesting another code.` })
  }

  const newHash = await dispatchOtp(channel)
  await prisma.adminOtpChallenge.update({
    where: { id: challenge.id },
    data: channel === 'phone'
      ? { phoneOtpHash: newHash, phoneAttempts: 0, phoneLastSentAt: new Date() }
      : { emailOtpHash: newHash, emailAttempts: 0, emailLastSentAt: new Date() },
  })
  res.json({ message: `A new code was sent to the registered ${channel === 'phone' ? 'admin phone' : 'owner email'}.` })
}

// POST /api/auth/admin-logout — releases the lock (only if the requester is
// the one currently holding it), unlocking /admin for the next login.
export async function adminLogout(req, res) {
  const lock = await getAdminLockSingleton()
  if (lock.heldById && lock.heldById === req.user._id) {
    await prisma.adminLock.update({
      where: { id: 'admin-lock' },
      data: { heldById: null, heldByEmail: null, tokenJti: null, lockedAt: null, expiresAt: null },
    })
  }
  res.json({ message: 'Logged out of admin panel' })
}

// GET /api/auth/admin-lock-status — public-ish (no admin required) so the
// admin LOGIN page itself can show "in use by X, try again after Y" without
// needing to be logged in yet. Deliberately returns no sensitive info beyond
// a masked hint of who's holding it.
export async function adminLockStatus(req, res) {
  const lock = await getAdminLockSingleton()
  const active = Boolean(lock.heldById) && lock.expiresAt && lock.expiresAt.getTime() > Date.now()
  res.json({
    locked: active,
    expiresAt: active ? lock.expiresAt : null,
  })
}
