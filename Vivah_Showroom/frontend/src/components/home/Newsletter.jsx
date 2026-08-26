// ============================================================================
// components/home/Newsletter.jsx — the email signup band near the bottom of
// the homepage. This is FRONT-END ONLY: submitting the form just shows a
// "thank you" message locally (setSent(true)) — no email is actually saved
// or sent anywhere. To make this real, wire handleSubmit() to a backend
// endpoint (e.g. add a `/api/newsletter` route similar to
// backend/src/routes/miscRoutes.js's /contact route) or a third-party
// service like Mailchimp.
// ============================================================================
import { useState } from 'react'

export default function Newsletter() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    if (!email.includes('@')) return
    setSent(true)
  }

  return (
    <section className="py-20 px-6 bg-wine dark:bg-charcoal">
      <div className="max-w-xl mx-auto text-center">
        <h2 className="font-display italic text-3xl sm:text-4xl text-ivory">Join the Trousseau List</h2>
        <p className="text-ivory/70 mt-3 text-sm">New arrivals, seasonal edits and early appointment slots — straight to your inbox.</p>
        {sent ? (
          <p className="mt-6 text-gold-bright font-label tracking-wide">Thank you — you\u2019re on the list.</p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <label htmlFor="newsletter-email" className="sr-only">Email address</label>
            <input id="newsletter-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                   placeholder="you@email.com"
                   className="flex-1 px-5 py-3 rounded-full bg-ivory/10 border border-ivory/30 text-ivory placeholder:text-ivory/50 focus:outline-none focus:border-gold-bright" />
            <button type="submit" className="px-6 py-3 rounded-full bg-gold-bright text-ink font-medium hover:bg-ivory transition-colors">
              Subscribe
            </button>
          </form>
        )}
      </div>
    </section>
  )
}
