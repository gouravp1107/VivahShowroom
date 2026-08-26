// ============================================================================
// pages/NotFound.jsx — the catch-all 404 page. Matched by App.jsx's
// <Route path="*" element={<NotFound />} /> — any URL that doesn't match
// any other route renders this instead of a browser error page.
// ============================================================================
import Button from '../components/ui/Button'

export default function NotFound() {
  return (
    <div className="max-w-lg mx-auto text-center px-6 py-32">
      <p className="font-label text-xs tracking-widest uppercase text-gold dark:text-gold-dark">404</p>
      <h1 className="font-display italic text-4xl mt-4 text-ink dark:text-ivory">This look isn\u2019t in our showroom.</h1>
      <p className="mt-3 text-ink/60 dark:text-ivory/60">The page you\u2019re looking for may have been moved or is no longer available.</p>
      <Button to="/" className="mt-8">Return Home</Button>
    </div>
  )
}
