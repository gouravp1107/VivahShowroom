// ============================================================================
// components/home/Testimonials.jsx — the "What Our Couples Say" carousel.
// REVIEWS below is a small hand-written array (name/role/quote/photo) — this
// is placeholder/sample content, not connected to any real review data or
// backend/src/models/Feedback.js. `i` tracks which review is currently
// shown; the two arrow buttons step forward/backward with wraparound (the
// `% REVIEWS.length` math loops back to the start/end instead of erroring
// past the array bounds).
// ============================================================================
import { useState } from 'react'
import { Star, ChevronLeft, ChevronRight } from 'lucide-react'
import SectionHeading from '../ui/SectionHeading'

const REVIEWS = [
  { name: 'Ananya & Rohit', role: 'Reception, Jaipur', text: 'Our couple set looked like it was custom-made — the maroon and gold matched perfectly in every photo. Fitting was done two days before and it was flawless.', img: 'assets/couple/couple-010.jpg' },
  { name: 'Priya Sharma', role: 'Bridal Lehenga, Delhi', text: 'I saved so much by renting instead of buying a lehenga I\u2019d wear once. The zardozi work was exactly as pictured and the trial appointment removed all my worry.', img: 'assets/bride/bride-030.jpg' },
  { name: 'Karan Mehta', role: 'Groom Sherwani, Mumbai', text: 'The sherwani fit better than any I\u2019ve bought before. Pickup and return were smooth, and the pagdi pairing suggestion was perfect.', img: 'assets/groom/groom-070.jpg' },
]

export default function Testimonials() {
  const [i, setI] = useState(0)
  const r = REVIEWS[i]
  return (
    <section className="py-24 px-6 sm:px-10 max-w-5xl mx-auto">
      <SectionHeading eyebrow="Real Weddings" title="What Our Couples Say" />
      <div className="mt-12 flex flex-col md:flex-row items-center gap-10 bg-parchment dark:bg-charcoal rounded-[2rem] p-8 sm:p-12">
        <img src={r.img} alt={r.name} className="w-32 h-32 rounded-full object-cover flex-shrink-0" loading="lazy" />
        <div className="text-center md:text-left">
          <div className="flex justify-center md:justify-start gap-1 text-gold mb-3">
            {Array.from({ length: 5 }).map((_, s) => <Star key={s} size={14} className="fill-gold" />)}
          </div>
          <p className="font-display italic text-xl sm:text-2xl text-ink dark:text-ivory leading-relaxed">"{r.text}"</p>
          <p className="mt-4 font-label text-xs tracking-widest uppercase text-wine dark:text-gold-dark">{r.name} — {r.role}</p>
        </div>
      </div>
      <div className="flex justify-center gap-4 mt-6">
        <button aria-label="Previous review" onClick={() => setI((i - 1 + REVIEWS.length) % REVIEWS.length)} className="w-10 h-10 rounded-full border border-ink/20 dark:border-ivory/20 grid place-items-center hover:border-gold">
          <ChevronLeft size={16} />
        </button>
        <button aria-label="Next review" onClick={() => setI((i + 1) % REVIEWS.length)} className="w-10 h-10 rounded-full border border-ink/20 dark:border-ivory/20 grid place-items-center hover:border-gold">
          <ChevronRight size={16} />
        </button>
      </div>
    </section>
  )
}
