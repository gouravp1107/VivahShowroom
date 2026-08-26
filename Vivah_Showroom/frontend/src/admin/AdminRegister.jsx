// ============================================================================
// admin/AdminRegister.jsx — "the business changed hands" flow. A new owner
// registers their OWN admin email + password here, without ever needing the
// previous owner's credentials — they only need the ADMIN_SETUP_KEY secret
// (set in backend/.env), which the actual business owner shares with them
// privately (phone/WhatsApp/in person) at the time of sale.
//
// Submitting this deactivates every other admin account (see
// controllers/authController.js's adminRegister()) — so the previous
// owner's login stops working immediately, permanently, without deleting
// their account/order history. The new owner can then sign in normally at
// /admin/login.
// ============================================================================
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { KeyRound } from 'lucide-react'
import { adminRegister } from '../api/adminApi'

export default function AdminRegister() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', setupKey: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit() {
    setError('')
    setBusy(true)
    try {
      await adminRegister(form)
      setDone(true)
    } catch (err) {
      setError(err.message || 'Registration failed')
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-ink dark:bg-noir flex items-center justify-center p-6">
        <div className="w-full max-w-sm bg-ivory dark:bg-charcoal rounded-3xl p-8 text-center">
          <h1 className="font-display italic text-2xl text-ink dark:text-ivory">Admin account created</h1>
          <p className="text-sm text-ink/60 dark:text-ivory/60 mt-3">
            The previous admin's access has been deactivated. You can now sign in with your new email and password.
          </p>
          <Link to="/admin/login" className="inline-block mt-6 px-6 py-3 rounded-full bg-wine text-ivory dark:bg-gold-dark dark:text-noir text-sm font-medium">
            Go to Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ink dark:bg-noir flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-ivory dark:bg-charcoal rounded-3xl p-8">
        <div className="w-12 h-12 rounded-full bg-wine/10 dark:bg-gold-dark/10 grid place-items-center mb-4">
          <KeyRound size={20} className="text-wine dark:text-gold-dark" />
        </div>
        <h1 className="font-display italic text-3xl text-ink dark:text-ivory">New Owner Setup</h1>
        <p className="text-sm text-ink/50 dark:text-ivory/50 mt-1">
          Create your own admin account using the setup key given to you by the seller/developer.
        </p>

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }} className="mt-6 space-y-4">
          <div>
            <label className="font-label text-xs tracking-wider uppercase text-ink dark:text-ivory mb-1 block">Your Name</label>
            <input required value={form.name} onChange={(e) => update('name', e.target.value)}
                   className="w-full px-4 py-2.5 rounded-xl border border-ink/20 dark:border-ivory/20 bg-transparent text-ink dark:text-ivory" />
          </div>
          <div>
            <label className="font-label text-xs tracking-wider uppercase text-ink dark:text-ivory mb-1 block">Your Email</label>
            <input type="email" required value={form.email} onChange={(e) => update('email', e.target.value)}
                   className="w-full px-4 py-2.5 rounded-xl border border-ink/20 dark:border-ivory/20 bg-transparent text-ink dark:text-ivory" />
          </div>
          <div>
            <label className="font-label text-xs tracking-wider uppercase text-ink dark:text-ivory mb-1 block">New Password (min 8 characters)</label>
            <input type="password" required minLength={8} value={form.password} onChange={(e) => update('password', e.target.value)}
                   className="w-full px-4 py-2.5 rounded-xl border border-ink/20 dark:border-ivory/20 bg-transparent text-ink dark:text-ivory" />
          </div>
          <div>
            <label className="font-label text-xs tracking-wider uppercase text-ink dark:text-ivory mb-1 block">Setup Key</label>
            <input type="password" required value={form.setupKey} onChange={(e) => update('setupKey', e.target.value)}
                   className="w-full px-4 py-2.5 rounded-xl border border-ink/20 dark:border-ivory/20 bg-transparent text-ink dark:text-ivory" />
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <button type="submit" disabled={busy}
                  className="w-full px-6 py-3 rounded-full bg-wine text-ivory dark:bg-gold-dark dark:text-noir text-sm font-medium disabled:opacity-50">
            {busy ? 'Creating account…' : 'Create Admin Account'}
          </button>
        </form>

        <p className="mt-6 text-xs text-ink/40 dark:text-ivory/40 text-center">
          Already have admin access? <Link to="/admin/login" className="text-wine dark:text-gold-dark underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
