// ============================================================================
// pages/BookAppointment.jsx — the "/book-appointment" route. A fitting/trial
// request form (name, phone, email, date, category, time slot, notes).
//
// submitAppointment() (src/api/index.js) posts to the real backend's
// POST /api/appointments when configured (see
// backend/src/controllers/appointmentController.js -> bookAppointment(),
// which saves it to MongoDB's Appointment collection for staff to review),
// or is a no-op in demo mode. Either way, this page shows a local
// confirmation message (`confirmed` state) using the submitted form data —
// it doesn't wait for/display any real confirmation from the backend beyond
// "the request didn't throw an error."
//
// The "Category of Interest" dropdown is generated from data/categories.js,
// so it automatically includes any new categories added there.
// ============================================================================
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { submitAppointment } from '../api'
import FormField from '../components/ui/FormField'
import { inputClass } from '../components/ui/input.css.js'
import Button from '../components/ui/Button'
import { CATEGORIES } from '../data/categories'

export default function BookAppointment() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm()
  const [confirmed, setConfirmed] = useState(null)

  async function onSubmit(data) {
    await submitAppointment(data)
    setConfirmed(data)
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-20">
      <h1 className="font-display italic text-4xl text-center text-ink dark:text-ivory">Book a Fitting Appointment</h1>
      <p className="text-center text-sm text-ink/50 dark:text-ivory/50 mt-2 max-w-md mx-auto">
        Reserve a slot at our showroom for a private trial before you confirm your rental.
      </p>

      {confirmed ? (
        <div className="mt-10 text-center bg-parchment dark:bg-charcoal rounded-2xl p-8">
          <p className="font-display italic text-2xl text-wine dark:text-gold-dark">Appointment requested</p>
          <p className="mt-2 text-sm text-ink/60 dark:text-ivory/60">
            {confirmed.name}, we\u2019ll confirm your slot on {confirmed.date} for {confirmed.category} by phone or email shortly.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="mt-10 grid sm:grid-cols-2 gap-5" noValidate>
          <FormField label="Full Name" error={errors.name}>
            <input className={inputClass} {...register('name', { required: 'Name is required' })} />
          </FormField>
          <FormField label="Phone" error={errors.phone}>
            <input type="tel" className={inputClass} {...register('phone', { required: 'Phone is required' })} />
          </FormField>
          <FormField label="Email" error={errors.email}>
            <input type="email" className={inputClass} {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' } })} />
          </FormField>
          <FormField label="Preferred Date" error={errors.date}>
            <input type="date" className={inputClass} {...register('date', { required: 'Please choose a date' })} />
          </FormField>
          <FormField label="Category of Interest" error={errors.category}>
            <select className={inputClass} {...register('category', { required: true })}>
              {CATEGORIES.map((c) => <option key={c.slug} value={c.name}>{c.name}</option>)}
            </select>
          </FormField>
          <FormField label="Preferred Time" error={errors.time}>
            <select className={inputClass} {...register('time', { required: true })}>
              <option>11:00 AM</option><option>1:00 PM</option><option>3:00 PM</option><option>5:00 PM</option><option>7:00 PM</option>
            </select>
          </FormField>
          <div className="sm:col-span-2">
            <FormField label="Notes (optional)">
              <textarea rows={3} className={inputClass} {...register('notes')} />
            </FormField>
          </div>
          <Button type="submit" className="sm:col-span-2" disabled={isSubmitting}>{isSubmitting ? 'Sending…' : 'Request Appointment'}</Button>
        </form>
      )}
    </div>
  )
}
