// ============================================================================
// pages/Register.jsx — the "/register" route. Same pattern as Login.jsx:
// react-hook-form handles validation (note the "Confirm Password" field
// uses `validate: (v) => v === watch('password')` to cross-check against
// the password field live), then registerRequest() (src/api/index.js) talks
// to the real backend's POST /api/auth/register when configured, or fakes
// success in demo mode. On success, ShowroomContext's login() signs the new
// user in immediately (no separate "verify your email" step in this flow,
// even though the backend has that infrastructure — see
// backend/src/controllers/authController.js's verifyEmail()).
// ============================================================================
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { useShowroom } from '../context/ShowroomContext'
import { registerRequest } from '../api'
import FormField from '../components/ui/FormField'
import { inputClass } from '../components/ui/input.css.js'
import Button from '../components/ui/Button'

export default function Register() {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting }, setError } = useForm()
  const { login } = useShowroom()
  const navigate = useNavigate()

  async function onSubmit(data) {
    try {
      const { user, token } = await registerRequest(data)
      login(user, token)
      navigate('/')
    } catch (err) {
      setError('root', { message: err.message || 'Could not create account' })
    }
  }

  return (
    <div className="max-w-md mx-auto px-6 py-20">
      <h1 className="font-display italic text-4xl text-center text-ink dark:text-ivory">Create Your Account</h1>
      <p className="text-center text-sm text-ink/50 dark:text-ivory/50 mt-2">Track rentals, save favourites, and book fittings faster.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-10 space-y-5" noValidate>
        <FormField label="Full Name" error={errors.name}>
          <input className={inputClass} placeholder="Ananya Sharma" {...register('name', { required: 'Name is required' })} />
        </FormField>
        <FormField label="Email" error={errors.email}>
          <input type="email" className={inputClass} placeholder="you@email.com"
                 {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' } })} />
        </FormField>
        <FormField label="Phone" error={errors.phone}>
          <input type="tel" className={inputClass} placeholder="+91 90000 00000"
                 {...register('phone', { required: 'Phone number is required', minLength: { value: 10, message: 'Enter a valid phone number' } })} />
        </FormField>
        <FormField label="Password" error={errors.password}>
          <input type="password" className={inputClass} placeholder="••••••••"
                 {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'At least 6 characters' } })} />
        </FormField>
        <FormField label="Confirm Password" error={errors.confirm}>
          <input type="password" className={inputClass} placeholder="••••••••"
                 {...register('confirm', { required: 'Please confirm your password', validate: (v) => v === watch('password') || 'Passwords do not match' })} />
        </FormField>
        <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? 'Creating…' : 'Create Account'}</Button>
        {errors.root && <p className="text-xs text-red-600 text-center">{errors.root.message}</p>}
      </form>

      <p className="text-center text-sm text-ink/60 dark:text-ivory/60 mt-8">
        Already have an account? <Link to="/login" className="text-gold dark:text-gold-dark hover:underline">Sign in</Link>
      </p>
    </div>
  )
}
