// ============================================================================
// components/home/FAQ.jsx — the expandable FAQ accordion on the homepage.
// FAQS below is a plain array of question/answer pairs — add/edit entries
// there directly. `open` tracks which single question is currently expanded
// (by array index); clicking the currently-open question again collapses it
// (sets open to -1, which matches nothing).
// ============================================================================
import { useState } from 'react'
import { Plus, Minus } from 'lucide-react'
import SectionHeading from '../ui/SectionHeading'

const FAQS = [
  { q: 'How does the rental period work?', a: 'Most rentals run 3, 5 or 7 days, covering your event and a buffer for pickup/return. Extended rentals can be arranged for destination weddings.' },
  { q: 'Is there a security deposit?', a: 'Yes — a refundable deposit is collected at booking and returned within 5 business days of the item being checked back in, provided there\u2019s no damage beyond normal wear.' },
  { q: 'Can I try the outfit before booking?', a: 'Yes, book a fitting appointment at our showroom or request a home trial in select cities before you confirm your rental dates.' },
  { q: 'What if the outfit needs alteration?', a: 'In-house tailors handle minor alterations at no extra cost, completed before your scheduled pickup or delivery date.' },
  { q: 'Do you offer delivery and pickup?', a: 'Both are available — choose showroom pickup or doorstep delivery/return at checkout, subject to your city.' },
]

export default function FAQ() {
  const [open, setOpen] = useState(0)
  return (
    <section className="py-24 px-6 sm:px-10 max-w-3xl mx-auto">
      <SectionHeading eyebrow="Good to Know" title="Frequently Asked Questions" />
      <div className="mt-10 divide-y divide-ink/10 dark:divide-ivory/10">
        {FAQS.map((f, i) => (
          <div key={f.q} className="py-5">
            <button onClick={() => setOpen(open === i ? -1 : i)} className="w-full flex items-center justify-between text-left gap-4">
              <span className="font-display italic text-lg sm:text-xl text-ink dark:text-ivory">{f.q}</span>
              {open === i ? <Minus size={18} className="text-gold flex-shrink-0" /> : <Plus size={18} className="text-gold flex-shrink-0" />}
            </button>
            {open === i && <p className="mt-3 text-sm text-ink/60 dark:text-ivory/60 leading-relaxed">{f.a}</p>}
          </div>
        ))}
      </div>
    </section>
  )
}
