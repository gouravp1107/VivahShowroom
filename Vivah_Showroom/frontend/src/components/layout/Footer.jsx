// ============================================================================
// components/layout/Footer.jsx — site-wide footer, rendered once in
// App.jsx below every page's content.
//
// The Bride/Groom link columns are generated from data/categories.js
// (filtered by `group`), so adding a new category there automatically
// appears here too — no footer edits needed.
//
// Instagram/Facebook icons are drawn as small inline SVGs (see the two
// helper components below) rather than imported from lucide-react, because
// that icon library dropped brand/logo icons in the version this project
// uses — see README for the note on this.
// ============================================================================
// ============================================================================
// components/layout/Footer.jsx — site-wide footer, rendered once in
// App.jsx below every page's content.
//
// The Bride/Groom link columns are generated from data/categories.js
// (filtered by `hub`, matching the same Bride/Groom hub grouping used by
// pages/CategoryHub.jsx and the Navbar's mega-menu — so a category shows
// up here, in the nav dropdown, AND as its own hub tab all from one single
// definition in data/categories.js). Links use categoryPath() so they
// always point at the correct nested URL (e.g. /bride/bridal-jutti).
//
// Instagram/Facebook icons are drawn as small inline SVGs (see the two
// helper components below) rather than imported from lucide-react, because
// that icon library dropped brand/logo icons in the version this project
// uses — see README for the note on this.
// ============================================================================
import { Link } from 'react-router-dom'
import { MessageCircle, Mail, Phone } from 'lucide-react'
import { getCategoriesByHub, categoryPath } from '../../data/categories'

// Hand-drawn brand icons (lucide-react no longer ships these) — simple
// enough to inline directly rather than adding an icon-library dependency.
function Instagram(props) {
  return (
    <svg viewBox="0 0 24 24" width={props.size || 18} height={props.size || 18} fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}
function Facebook(props) {
  return (
    <svg viewBox="0 0 24 24" width={props.size || 18} height={props.size || 18} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M15 4h-2a4 4 0 0 0-4 4v3H7v3h2v6h3v-6h2.5l.5-3H12V8a1 1 0 0 1 1-1h2Z" />
    </svg>
  )
}

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="bg-ink dark:bg-charcoal text-ivory/80 mt-24">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 py-16 grid grid-cols-2 md:grid-cols-5 gap-10">
        <div className="col-span-2">
          <span className="font-label text-lg tracking-widest text-gold-bright">VIVAH TROUSSEAU</span>
          <p className="mt-4 text-sm leading-relaxed text-ivory/60 max-w-xs">
            A designer wardrobe for your wedding week — bridal, groom and family looks,
            rented with fitting, styling and delivery included.
          </p>
          <div className="flex gap-4 mt-6">
            <a href="https://instagram.com" aria-label="Instagram" className="hover:text-gold-bright"><Instagram size={18} /></a>
            <a href="https://facebook.com" aria-label="Facebook" className="hover:text-gold-bright"><Facebook size={18} /></a>
            <a href="https://wa.me/910000000000" aria-label="WhatsApp" className="hover:text-gold-bright"><MessageCircle size={18} /></a>
          </div>
        </div>
        <div>
          <h4 className="font-label text-xs tracking-widest uppercase text-gold-bright mb-4">Bride</h4>
          <ul className="space-y-2 text-sm">
            {getCategoriesByHub('bride').map((c) => (
              <li key={c.slug}><Link to={categoryPath(c.slug)} className="hover:text-gold-bright">{c.name}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-label text-xs tracking-widest uppercase text-gold-bright mb-4">Groom</h4>
          <ul className="space-y-2 text-sm">
            {getCategoriesByHub('groom').map((c) => (
              <li key={c.slug}><Link to={categoryPath(c.slug)} className="hover:text-gold-bright">{c.name}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-label text-xs tracking-widest uppercase text-gold-bright mb-4">Showroom</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/book-appointment" className="hover:text-gold-bright">Book an appointment</Link></li>
            <li><Link to="/contact" className="hover:text-gold-bright">Contact us</Link></li>
            <li className="flex items-center gap-2"><Phone size={13} /> +91 90000 00000</li>
            <li className="flex items-center gap-2"><Mail size={13} /> hello@vivahtrousseau.com</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-ivory/10 py-6 text-center text-xs text-ivory/40">
        © {year} Vivah Trousseau. All rights reserved.
      </div>
    </footer>
  )
}
