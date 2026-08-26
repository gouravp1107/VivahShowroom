// ============================================================================
// utils/otp.js — small, dependency-free helpers for one-time codes used by
// the dual admin OTP flow (controllers/authController.js's adminLoginInit /
// adminVerifyOtp / adminResendOtp).
//
// Codes are always 6 digits, generated with crypto (not Math.random), and
// only ever stored/compared as a sha256 HASH — see AdminOtpChallenge.js.
// ============================================================================
import crypto from 'crypto'

export function generateOtp() {
  // crypto.randomInt is cryptographically strong and gives a uniform
  // distribution across the full 6-digit range (000000–999999).
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, '0')
}

export function hashOtp(code) {
  return crypto.createHash('sha256').update(String(code)).digest('hex')
}

export function verifyOtp(code, hash) {
  if (!code || !hash) return false
  const candidate = hashOtp(code)
  const a = Buffer.from(candidate)
  const b = Buffer.from(hash)
  // Constant-time comparison so response timing can't leak how many
  // leading digits were correct.
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

export function maskPhone(phone) {
  if (!phone) return null
  const digits = String(phone).replace(/\D/g, '')
  if (digits.length < 4) return '•••'
  return `••••••${digits.slice(-4)}`
}

export function maskEmail(email) {
  if (!email) return null
  const [name, domain] = String(email).split('@')
  if (!domain) return '•••'
  const visible = name.slice(0, 1)
  return `${visible}${'•'.repeat(Math.max(2, name.length - 1))}@${domain}`
}
