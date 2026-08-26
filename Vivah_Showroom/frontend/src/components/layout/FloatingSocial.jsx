// ============================================================================
// components/layout/FloatingSocial.jsx — the two floating round buttons
// (WhatsApp chat, phone call) fixed to the bottom-right corner on every
// page. Rendered once in App.jsx, positioned with `fixed` so it stays put
// while the page scrolls. z-40 keeps it above normal content but below
// modals/overlays (the mobile Navbar menu uses z-60, Toast uses z-100).
//
// Update the phone number / WhatsApp link here AND in Footer.jsx's contact
// list AND pages/Contact.jsx — they're not linked to a single shared
// constant, so all three need editing together if the business number changes.
// ============================================================================
import { MessageCircle, Phone } from 'lucide-react'

export default function FloatingSocial() {
  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3">
      <a href="https://wa.me/910000000000" aria-label="Chat on WhatsApp"
         className="w-12 h-12 rounded-full bg-[#25D366] text-white grid place-items-center shadow-lg hover:scale-105 transition-transform">
        <MessageCircle size={22} />
      </a>
      <a href="tel:+919000000000" aria-label="Call the showroom"
         className="w-12 h-12 rounded-full bg-wine dark:bg-gold-dark text-ivory dark:text-noir grid place-items-center shadow-lg hover:scale-105 transition-transform">
        <Phone size={20} />
      </a>
    </div>
  )
}
