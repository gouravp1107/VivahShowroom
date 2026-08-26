// ============================================================================
// routes/authRoutes.js — mounted at /api/auth in app.js. Defines WHICH
// HTTP method + path triggers WHICH function in controllers/authController.js,
// plus any express-validator rules that must pass first (see
// middleware/validateRequest.js for how those rules get enforced).
//
// Full endpoint list:
//   POST /api/auth/register            -> register()          (name/email/password required)
//   POST /api/auth/login               -> login()              (email/password required — customers AND admins; NEVER grants an admin panel session)
//   POST /api/auth/guest               -> guestLogin()         (no body needed)
//   POST /api/auth/forgot-password     -> forgotPassword()     (email required)
//   POST /api/auth/reset-password      -> resetPassword()      (token/password required)
//   GET  /api/auth/verify-email/:token -> verifyEmail()
//   GET  /api/auth/me                  -> me()                 (requires login)
//   POST /api/auth/admin-register      -> adminRegister()      (requires setupKey === ADMIN_SETUP_KEY — how a new owner takes over)
//   POST /api/auth/admin-login/init    -> adminLoginInit()    (credentials -> creates a dual-OTP challenge)
//   POST /api/auth/admin-login/verify  -> adminVerifyOtp()    (both OTPs -> checks out the single-admin-session lock)
//   POST /api/auth/admin-login/resend  -> adminResendOtp()    (resend one channel's code, rate-limited)
//   POST /api/auth/admin-logout        -> adminLogout()        (releases the lock — requires an admin session)
//   GET  /api/auth/admin-lock-status   -> adminLockStatus()    (public; lets the /admin login page show "in use" state)
// ============================================================================
import { Router } from 'express'
import { body } from 'express-validator'
import { validateRequest } from '../middleware/validateRequest.js'
import { protect, adminOnly } from '../middleware/auth.js'
import {
  register, login, guestLogin, forgotPassword, resetPassword, verifyEmail, me,
  adminRegister, adminLoginInit, adminVerifyOtp, adminResendOtp, adminLogout, adminLockStatus,
} from '../controllers/authController.js'
import rateLimit from 'express-rate-limit'

// Rate limits specific to the admin auth surface — separate from any
// general API-wide limiter — so brute-forcing the password step or the OTP
// step can't be hidden inside normal traffic volume.
const adminLoginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false })
const adminOtpLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false })

const router = Router()

router.post(
  '/register',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  validateRequest,
  register
)

router.post(
  '/login',
  [body('email').isEmail(), body('password').notEmpty()],
  validateRequest,
  login
)

router.post('/guest', guestLogin)
router.post('/forgot-password', [body('email').isEmail()], validateRequest, forgotPassword)
router.post('/reset-password', [body('token').notEmpty(), body('password').isLength({ min: 6 })], validateRequest, resetPassword)
router.get('/verify-email/:token', verifyEmail)
router.get('/me', protect, me)

// --- Admin-only auth (see controllers/authController.js's "ADMIN AUTH" section) ---
router.post(
  '/admin-register',
  [
    body('name').notEmpty(),
    body('email').isEmail(),
    body('password').isLength({ min: 8 }).withMessage('Admin password must be at least 8 characters'),
    body('setupKey').notEmpty(),
  ],
  validateRequest,
  adminRegister
)
// --- Dual-OTP admin sign-in (three steps — see controllers/authController.js) ---
router.post(
  '/admin-login/init',
  adminLoginLimiter,
  [body('email').isEmail(), body('password').notEmpty()],
  validateRequest,
  adminLoginInit
)
router.post(
  '/admin-login/verify',
  adminOtpLimiter,
  [body('challengeId').notEmpty(), body('phoneOtp').notEmpty(), body('emailOtp').notEmpty()],
  validateRequest,
  adminVerifyOtp
)
router.post(
  '/admin-login/resend',
  adminOtpLimiter,
  [body('challengeId').notEmpty(), body('channel').isIn(['phone', 'email'])],
  validateRequest,
  adminResendOtp
)
router.post('/admin-logout', protect, adminOnly, adminLogout)
router.get('/admin-lock-status', adminLockStatus)

export default router
