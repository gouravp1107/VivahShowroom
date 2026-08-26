// ============================================================================
// pages/ForgotPassword.jsx — the "/forgot-password" route.
// NOT wired to src/api/index.js or the backend at all — submitting just
// flips local `sent` state to show a generic "check your email" message.
// The real backend endpoint already exists and works
// (POST /api/auth/forgot-password — see
// backend/src/controllers/authController.js's forgotPassword(), which
// deliberately gives the same response whether or not the email exists, to
// avoid leaking which emails are registered). To make this page live, call
// that endpoint here the same way Login.jsx calls loginRequest().
// ============================================================================
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import FormField from '../components/ui/FormField'
import { inputClass } from '../components/ui/input.css.js'
import Button from '../components/ui/Button'

export default function ForgotPassword() {
  const { register, handleSubmit, formState: { errors } } = useForm()
  const [sent, setSent] = useState(false)

  return (
    <div className="max-w-md mx-auto px-6 py-20">
      <h1 className="font-display italic text-4xl text-center text-ink dark:text-ivory">Reset Password</h1>
      <p className="text-center text-sm text-ink/50 dark:text-ivory/50 mt-2">
        We\u2019ll send a reset link (and OTP, where enabled) to your registered email.
      </p>

      {sent ? (
        <p className="mt-10 text-center text-sm text-ink/70 dark:text-ivory/70">
          If an account exists for that email, a reset link is on its way.
          <Link to="/login" className="block mt-4 text-gold dark:text-gold-dark hover:underline">Back to sign in</Link>
        </p>
      ) : (
        <form onSubmit={handleSubmit(() => setSent(true))} className="mt-10 space-y-5" noValidate>
          <FormField label="Email" error={errors.email}>
            <input type="email" className={inputClass} placeholder="you@email.com"
                   {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' } })} />
          </FormField>
          <Button type="submit" className="w-full">Send Reset Link</Button>
        </form>
      )}
    </div>
  )
}
