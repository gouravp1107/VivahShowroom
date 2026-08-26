// ============================================================================
// pages/Login.jsx — the "/login" route. Uses react-hook-form for validation
// (see the `register('field', { rules })` calls below — each rule set shows
// the matching error message via FormField's `error` prop when invalid).
//
// On submit: calls loginRequest() from src/api/index.js, which either hits
// the real backend's POST /api/auth/login (if VITE_API_URL is set) or fakes
// a successful login locally in demo mode. Either way, the returned
// { user, token } gets handed to ShowroomContext's login(), which stores
// the user profile + JWT token and is what the rest of the app (Navbar,
// Profile page, etc.) reads to know someone's signed in.
//
// "Continue as Guest" skips the API entirely — see loginAsGuest() in
// ShowroomContext.jsx.
// ============================================================================
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { useShowroom } from '../context/ShowroomContext'
import { loginRequest } from '../api'
import FormField from '../components/ui/FormField'
import { inputClass } from '../components/ui/input.css.js'
import Button from '../components/ui/Button'
import Divider from '../components/ui/Divider'

export default function Login() {
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm()
  const { login, loginAsGuest } = useShowroom()
  const navigate = useNavigate()

  async function onSubmit(data) {
    try {
      const { user, token } = await loginRequest(data.email, data.password)
      login(user, token)
      navigate('/')
    } catch (err) {
      setError('root', { message: err.message || 'Invalid email or password' })
    }
  }

  return (
    <div className="max-w-md mx-auto px-6 py-20">
      <h1 className="font-display italic text-4xl text-center text-ink dark:text-ivory">Welcome Back</h1>
      <p className="text-center text-sm text-ink/50 dark:text-ivory/50 mt-2">Sign in to view your saved looks and rentals.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-10 space-y-5" noValidate>
        <FormField label="Email" error={errors.email}>
          <input type="email" className={inputClass} placeholder="you@email.com"
                 {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' } })} />
        </FormField>
        <FormField label="Password" error={errors.password}>
          <input type="password" className={inputClass} placeholder="••••••••"
                 {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'At least 6 characters' } })} />
        </FormField>
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-xs text-gold dark:text-gold-dark hover:underline">Forgot password?</Link>
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? 'Signing In…' : 'Sign In'}</Button>
        {errors.root && <p className="text-xs text-red-600 text-center">{errors.root.message}</p>}
      </form>

      <Divider className="my-8" />
      <Button variant="outline" className="w-full" onClick={() => { loginAsGuest(); navigate('/') }}>Continue as Guest</Button>

      <p className="text-center text-sm text-ink/60 dark:text-ivory/60 mt-8">
        New here? <Link to="/register" className="text-gold dark:text-gold-dark hover:underline">Create an account</Link>
      </p>
    </div>
  )
}
