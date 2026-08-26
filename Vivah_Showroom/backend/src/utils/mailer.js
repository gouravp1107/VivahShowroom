// ============================================================================
// utils/mailer.js — a thin wrapper around Nodemailer for sending real
// emails (password reset links, order confirmations, etc.) once SMTP
// credentials are configured (see backend/.env.example's SMTP_* variables).
//
// NOT currently called from anywhere in the codebase — it's ready
// infrastructure for when you want to actually send emails. The obvious
// places to call sendMail() are:
//   - controllers/authController.js's forgotPassword() (currently has a
//     comment marking exactly where the reset-link email would be sent)
//   - controllers/authController.js's register() (email verification link)
//   - controllers/orderController.js's createOrder() (order confirmation)
//
// Deliberately "fails soft": if SMTP_HOST isn't set, sendMail() just logs a
// warning and does nothing, rather than throwing — so the rest of the app
// keeps working in local development even without real email credentials.
// ============================================================================
import nodemailer from 'nodemailer'

// Lazily creates the transporter so the app can boot even if SMTP env vars
// aren't set yet (e.g. during local frontend-only development).
let transporter = null

function getTransporter() {
  if (transporter) return transporter // reuse the same connection across calls
  if (!process.env.SMTP_HOST) return null
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465, // port 465 uses implicit TLS; 587 uses STARTTLS
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  })
  return transporter
}

// Call this to actually send an email: sendMail({ to, subject, html })
export async function sendMail({ to, subject, html }) {
  const t = getTransporter()
  if (!t) {
    console.warn('SMTP not configured — skipping email send. Set SMTP_* vars in .env to enable.')
    return
  }
  await t.sendMail({ from: process.env.EMAIL_FROM, to, subject, html })
}
