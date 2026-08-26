// ============================================================================
// components/home/ContactStrip.jsx — the row of 3 quick-contact cards near
// the bottom of the homepage (Book Appointment / Call / WhatsApp). Purely
// presentational — ITEMS below is the only thing to edit if contact
// details change (also update FloatingSocial.jsx and Footer.jsx to match).
//
// COLOUR SCHEME IS DELIBERATELY INVERTED from the rest of the site: these
// three cards use a DARK card background with LIGHT text in light theme,
// and a LIGHT card background with DARK text in dark theme — the opposite
// of the ivory-background/dark-text (light theme) and noir-background/
// light-text (dark theme) convention everywhere else on the page. This
// makes the contact strip read as a distinct, high-contrast call-to-action
// band rather than blending into the surrounding section backgrounds.
// ============================================================================
import { Link } from 'react-router-dom'
import { Phone, MessageCircle, CalendarCheck } from 'lucide-react'
import EditOverlay from '../admin/EditOverlay'

const ITEMS = [
  { icon: CalendarCheck, label: 'Book an Appointment', desc: 'Reserve a fitting slot at the showroom', to: '/book-appointment' },
  { icon: Phone, label: 'Call Us', desc: '+91 90000 00000', href: 'tel:+919000000000' },
  { icon: MessageCircle, label: 'WhatsApp', desc: 'Chat with our stylists', href: 'https://wa.me/910000000000' },
]

export default function ContactStrip() {
  return (
    <section className="py-16 px-6 sm:px-10 max-w-7xl mx-auto grid sm:grid-cols-3 gap-6">
      {ITEMS.map(({ icon: Icon, label, desc, to, href }) => {
        const content = (
          <div className="relative flex items-center gap-4 p-6 rounded-2xl bg-ink dark:bg-ivory border border-ink dark:border-ivory hover:border-gold dark:hover:border-gold-dark transition-colors">
            <div className="w-11 h-11 rounded-full bg-ivory/10 dark:bg-ink/10 grid place-items-center text-gold dark:text-wine flex-shrink-0">
              <Icon size={18} />
            </div>
            <div>
              <p className="font-label text-xs tracking-wider uppercase text-ivory dark:text-ink">{label}</p>
              <p className="text-xs text-ivory/60 dark:text-ink/60 mt-1">{desc}</p>
            </div>
            <EditOverlay label={label} editTo="/admin" />
          </div>
        )
        return to ? <Link key={label} to={to}>{content}</Link> : <a key={label} href={href} target="_blank" rel="noreferrer">{content}</a>
      })}
    </section>
  )
}
