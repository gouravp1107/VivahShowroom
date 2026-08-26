// ============================================================================
// admin/AdminLogin.jsx — the /admin login screen, reached via the "Admin
// Login" button at the right corner of the public site's header (see
// components/layout/Navbar.jsx). Two steps:
//   1. Email + password (credentials) -> loginInit() -> server creates an
//      OTP challenge and sends one code to the registered admin PHONE and a
//      second, independent code to the registered owner EMAIL.
//   2. Both codes entered together -> verifyOtp() -> only now is a session
//      actually created. Verifying just one code is never sufficient — the
//      backend enforces this regardless of what the UI does.
//
// Also shows the single-admin-session LOCK state up front (fetched from
// GET /api/auth/admin-lock-status, public precisely so this page can show
// it before anyone logs in) — if another admin is currently checked out,
// this explains that clearly instead of just failing oddly.
// ============================================================================
import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Lock, ShieldAlert, Smartphone, Mail } from 'lucide-react'
import { useAdmin } from '../context/AdminContext'
import { adminLockStatus } from '../api/adminApi'

export default function AdminLogin() {
  const { loginInit, verifyOtp, resendOtp, lockNotice, setLockNotice } = useAdmin()
  const navigate = useNavigate()

  const [step, setStep] = useState('credentials') // 'credentials' | 'otp'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phoneOtp, setPhoneOtp] = useState('')
  const [emailOtp, setEmailOtp] = useState('')
  const [challenge, setChallenge] = useState(null) // { challengeId, maskedPhone, maskedEmail, expiresAt }
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [lock, setLock] = useState(null)

  useEffect(() => {
    adminLockStatus().then(setLock).catch(() => {})
  }, [])

  async function handleCredentials() {
    setError('')
    setBusy(true)
    try {
      const result = await loginInit(email, password)
      setChallenge(result)
      setStep('otp')
      setNotice(`Codes sent to ${result.maskedPhone} and ${result.maskedEmail}. Enter both below.`)
    } catch (err) {
      setError(err.message || 'Sign-in failed')
      adminLockStatus().then(setLock).catch(() => {})
    } finally {
      setBusy(false)
    }
  }

  async function handleVerify() {
    setError('')
    setBusy(true)
    try {
      await verifyOtp(challenge.challengeId, phoneOtp, emailOtp)
      navigate('/admin/dashboard')
    } catch (err) {
      setError(err.message || 'Verification failed')
      if (err.status === 423) adminLockStatus().then(setLock).catch(() => {})
    } finally {
      setBusy(false)
    }
  }

  async function handleResend(channel) {
    setError('')
    setNotice('')
    try {
      const res = await resendOtp(challenge.challengeId, channel)
      setNotice(res.message)
    } catch (err) {
      setError(err.message || 'Could not resend code')
    }
  }

  function backToCredentials() {
    setStep('credentials')
    setChallenge(null)
    setPhoneOtp('')
    setEmailOtp('')
    setError('')
    setNotice('')
  }

  return (
    <div className="min-h-screen bg-ink dark:bg-noir flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-ivory dark:bg-charcoal rounded-3xl p-8">
        <div className="w-12 h-12 rounded-full bg-wine/10 dark:bg-gold-dark/10 grid place-items-center mb-4">
          <Lock size={20} className="text-wine dark:text-gold-dark" />
        </div>
        <h1 className="font-display italic text-3xl text-ink dark:text-ivory">Admin Sign In</h1>
        <p className="text-sm text-ink/50 dark:text-ivory/50 mt-1">
          {step === 'credentials'
            ? 'Owner-only access to Vivah Showroom\u2019s CMS.'
            : 'Two-step verification required — enter both codes to continue.'}
        </p>

        {lockNotice && (
          <p className="mt-4 text-xs bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-xl px-3 py-2">{lockNotice}</p>
        )}
        {lock?.locked && step === 'credentials' && (
          <p className="mt-4 text-xs bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-xl px-3 py-2 flex items-start gap-2">
            <ShieldAlert size={14} className="mt-0.5 shrink-0" />
            Another admin is currently signed in. You can sign in with a different admin account, or wait for their session to end.
          </p>
        )}
        {notice && (
          <p className="mt-4 text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-xl px-3 py-2">{notice}</p>
        )}

        {step === 'credentials' && (
          <form onSubmit={(e) => { e.preventDefault(); handleCredentials() }} className="mt-6 space-y-4">
            <div>
              <label className="font-label text-xs tracking-wider uppercase text-ink dark:text-ivory mb-1 block">Admin Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                     className="w-full px-4 py-2.5 rounded-xl border border-ink/20 dark:border-ivory/20 bg-transparent text-ink dark:text-ivory" />
            </div>
            <div>
              <label className="font-label text-xs tracking-wider uppercase text-ink dark:text-ivory mb-1 block">Password</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                     className="w-full px-4 py-2.5 rounded-xl border border-ink/20 dark:border-ivory/20 bg-transparent text-ink dark:text-ivory" />
            </div>

            {error && <p className="text-xs text-red-600">{error}</p>}

            <button type="submit" disabled={busy}
                    className="w-full px-6 py-3 rounded-full bg-wine text-ivory dark:bg-gold-dark dark:text-noir text-sm font-medium disabled:opacity-50">
              {busy ? 'Checking…' : 'Continue'}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={(e) => { e.preventDefault(); handleVerify() }} className="mt-6 space-y-4">
            <div>
              <label className="font-label text-xs tracking-wider uppercase text-ink dark:text-ivory mb-1 flex items-center gap-1.5">
                <Smartphone size={13} /> Phone Code ({challenge?.maskedPhone})
              </label>
              <div className="flex gap-2">
                <input type="text" inputMode="numeric" maxLength={6} required value={phoneOtp}
                       onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, ''))}
                       placeholder="6-digit code"
                       className="flex-1 px-4 py-2.5 rounded-xl border border-ink/20 dark:border-ivory/20 bg-transparent text-ink dark:text-ivory tracking-[0.3em]" />
                <button type="button" onClick={() => handleResend('phone')}
                        className="text-xs px-3 rounded-xl border border-ink/20 dark:border-ivory/20 text-ink/60 dark:text-ivory/60 hover:text-wine dark:hover:text-gold-dark">
                  Resend
                </button>
              </div>
            </div>
            <div>
              <label className="font-label text-xs tracking-wider uppercase text-ink dark:text-ivory mb-1 flex items-center gap-1.5">
                <Mail size={13} /> Email Code ({challenge?.maskedEmail})
              </label>
              <div className="flex gap-2">
                <input type="text" inputMode="numeric" maxLength={6} required value={emailOtp}
                       onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ''))}
                       placeholder="6-digit code"
                       className="flex-1 px-4 py-2.5 rounded-xl border border-ink/20 dark:border-ivory/20 bg-transparent text-ink dark:text-ivory tracking-[0.3em]" />
                <button type="button" onClick={() => handleResend('email')}
                        className="text-xs px-3 rounded-xl border border-ink/20 dark:border-ivory/20 text-ink/60 dark:text-ivory/60 hover:text-wine dark:hover:text-gold-dark">
                  Resend
                </button>
              </div>
            </div>

            {error && <p className="text-xs text-red-600">{error}</p>}

            <button type="submit" disabled={busy || phoneOtp.length !== 6 || emailOtp.length !== 6}
                    className="w-full px-6 py-3 rounded-full bg-wine text-ivory dark:bg-gold-dark dark:text-noir text-sm font-medium disabled:opacity-50">
              {busy ? 'Verifying…' : 'Verify & Sign In'}
            </button>
            <button type="button" onClick={backToCredentials}
                    className="w-full text-xs text-ink/40 dark:text-ivory/40 hover:underline">
              ← Use a different account
            </button>
          </form>
        )}

        {step === 'credentials' && (
          <p className="mt-6 text-xs text-ink/40 dark:text-ivory/40 text-center">
            New owner taking over this business?{' '}
            <Link to="/admin/register" className="text-wine dark:text-gold-dark underline">Register with your setup key</Link>
          </p>
        )}
      </div>
    </div>
  )
}
