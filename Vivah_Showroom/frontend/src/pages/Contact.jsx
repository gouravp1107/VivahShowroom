// ============================================================================
// pages/Contact.jsx — the "/contact" route: showroom address/phone/email on
// the left, a general-purpose contact form (with a Subject dropdown
// covering rental requests, returns, complaints, callbacks) on the right.
//
// submitContactMessage() (src/api/index.js) posts to the real backend's
// POST /api/contact when configured (see
// backend/src/controllers/miscController.js -> submitMessage(), saved to
// MongoDB's Message collection — staff view these via the admin-only
// GET /api/contact route), or is a no-op in demo mode.
// ============================================================================
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Mail, Phone, MapPin } from 'lucide-react'
import { submitContactMessage } from '../api'
import FormField from '../components/ui/FormField'
import { inputClass } from '../components/ui/input.css.js'
import Button from '../components/ui/Button'

export default function Contact() {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm()
  const [sent, setSent] = useState(false)

  return (
    <div className="max-w-5xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-14">
      <div>
        <h1 className="font-display italic text-4xl text-ink dark:text-ivory">Get in Touch</h1>
        <p className="mt-3 text-ink/60 dark:text-ivory/60 max-w-sm">
          Questions about a rental, a complaint, or a callback request — our team replies within one business day.
        </p>
        <div className="mt-8 space-y-4 text-sm text-ink/70 dark:text-ivory/70">
          <p className="flex items-center gap-3"><MapPin size={16} className="text-gold" /> 12 MG Road, Showroom District, India</p>
          <p className="flex items-center gap-3"><Phone size={16} className="text-gold" /> +91 90000 00000</p>
          <p className="flex items-center gap-3"><Mail size={16} className="text-gold" /> hello@vivahtrousseau.com</p>
        </div>
      </div>

      {sent ? (
        <div className="bg-parchment dark:bg-charcoal rounded-2xl p-8 self-start">
          <p className="font-display italic text-2xl text-wine dark:text-gold-dark">Message sent</p>
          <p className="mt-2 text-sm text-ink/60 dark:text-ivory/60">Thank you for reaching out — we\u2019ll be in touch shortly.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(async (data) => { await submitContactMessage(data); setSent(true); reset() })} className="space-y-5" noValidate>
          <FormField label="Name" error={errors.name}>
            <input className={inputClass} {...register('name', { required: 'Name is required' })} />
          </FormField>
          <FormField label="Email" error={errors.email}>
            <input type="email" className={inputClass} {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' } })} />
          </FormField>
          <FormField label="Subject" error={errors.subject}>
            <select className={inputClass} {...register('subject', { required: true })}>
              <option>General Inquiry</option>
              <option>Rental Request</option>
              <option>Return Request</option>
              <option>Complaint</option>
              <option>Callback Request</option>
            </select>
          </FormField>
          <FormField label="Message" error={errors.message}>
            <textarea rows={5} className={inputClass} {...register('message', { required: 'Please add a message' })} />
          </FormField>
          <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? 'Sending…' : 'Send Message'}</Button>
        </form>
      )}
    </div>
  )
}
