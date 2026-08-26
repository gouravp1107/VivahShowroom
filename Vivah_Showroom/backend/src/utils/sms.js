// ============================================================================
// utils/sms.js — sends the phone OTP (see controllers/authController.js's
// adminLoginInit/adminResendOtp) via Twilio's plain REST API using the
// built-in `fetch` (Node 18+ — no extra SDK/dependency needed). Mirrors
// utils/mailer.js's "fails soft" pattern: if TWILIO_* env vars aren't set,
// sendSms() logs a warning and does nothing rather than crashing the app,
// so local development still works without a real SMS account.
//
// ⚠️ PRODUCTION: TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_FROM_NUMBER
// (backend/.env) MUST be set for the phone OTP to actually be delivered.
// Without them, admin login can never complete dual verification — that is
// intentional (fail closed on the auth path, fail soft on delivery only in
// non-production so the OTP is still visible in the server console for
// local testing).
// ============================================================================
const TWILIO_API = 'https://api.twilio.com/2010-04-01'

function twilioConfigured() {
  return Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER)
}

export async function sendSms({ to, body }) {
  if (!twilioConfigured()) {
    console.warn('TWILIO_* not configured — skipping SMS send. Set TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN/TWILIO_FROM_NUMBER in .env to enable.')
    if (process.env.NODE_ENV !== 'production') {
      // Local-dev-only convenience so the OTP flow is testable without a
      // real Twilio account. Never happens in production.
      console.log(`[DEV ONLY] SMS to ${to}: ${body}`)
    }
    return { sent: false }
  }

  const sid = process.env.TWILIO_ACCOUNT_SID
  const auth = Buffer.from(`${sid}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64')
  const params = new URLSearchParams({ To: to, From: process.env.TWILIO_FROM_NUMBER, Body: body })

  const res = await fetch(`${TWILIO_API}/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`SMS provider error (${res.status}): ${text.slice(0, 200)}`)
  }

  return { sent: true }
}
