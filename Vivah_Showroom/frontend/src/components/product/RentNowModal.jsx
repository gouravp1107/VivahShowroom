// ============================================================================
// components/product/RentNowModal.jsx — the fullscreen booking view opened
// by the "Rent Now" button on every product card (see ProductCard.jsx).
// This is deliberately a DIFFERENT fullscreen view than Lightbox.jsx:
//   - Lightbox   -> just the photo, manual zoom, no booking info (opened by
//                   clicking the image itself)
//   - RentNowModal -> the photo PLUS name, description, size picker, rental
//                   duration, an event-date/time picker, live price, and a
//                   "Book Now" button — everything needed to reserve the
//                   item without leaving the current page. Opened by the
//                   separate "Rent Now" button on the card.
//
// Booking logic mirrors pages/Product.jsx's detail page (same DURATIONS
// list/multipliers, same addToBag() call into ShowroomContext.jsx) — this
// is essentially that page's booking widget, repackaged as a modal so it
// can be triggered from anywhere a product grid appears (Trending,
// Spotlight, every hub page, etc.) without a full page navigation.
// ============================================================================
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { X, Star, ShieldCheck, Truck, ArrowUpRight } from 'lucide-react'
import { useShowroom } from '../../context/ShowroomContext'

const DURATIONS = [
  { label: '3 Days', multiplier: 1 },
  { label: '5 Days', multiplier: 1.4 },
  { label: '7 Days', multiplier: 1.8 },
]

export default function RentNowModal({ product, onClose }) {
  const { addToBag } = useShowroom()
  const [size, setSize] = useState('M')
  const [duration, setDuration] = useState(DURATIONS[0])
  const [date, setDate] = useState('')
  const [booked, setBooked] = useState(false)

  const price = Math.round(product.rentalPrice * duration.multiplier)

  function handleBookNow() {
    addToBag(product.id, { size, duration: duration.label, date, price })
    setBooked(true) // swap the form for a confirmation state instead of closing immediately
  }

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/80 flex items-start sm:items-center justify-center overflow-y-auto p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      onClick={onClose} // click the dark backdrop to close
    >
      <div
        className="bg-ivory dark:bg-charcoal rounded-3xl w-full max-w-4xl grid md:grid-cols-2 overflow-hidden relative"
        onClick={(e) => e.stopPropagation()} // clicks inside the modal shouldn't close it
      >
        <button onClick={onClose} aria-label="Close"
                className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-ink/60 text-ivory grid place-items-center hover:bg-ink/80">
          <X size={18} />
        </button>

        <div className="aspect-[3/4] md:aspect-auto md:h-full">
          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
        </div>

        <div className="p-6 sm:p-8 overflow-y-auto max-h-[85vh]">
          {booked ? (
            // ---- Confirmation state, shown after "Book Now" is clicked ----
            <div className="h-full flex flex-col justify-center text-center py-10">
              <p className="font-display italic text-3xl text-wine dark:text-gold-dark">Added to your rental bag</p>
              <p className="mt-3 text-sm text-ink/60 dark:text-ivory/60">
                {product.name} · Size {size} · {duration.label}{date ? ` · Event: ${date}` : ''}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
                <Link to="/bag" onClick={onClose}
                      className="px-6 py-3 rounded-full bg-wine text-ivory dark:bg-gold-dark dark:text-noir text-sm font-medium">
                  View Rental Bag
                </Link>
                <button onClick={onClose}
                        className="px-6 py-3 rounded-full border border-ink/20 dark:border-ivory/20 text-ink dark:text-ivory text-sm font-medium">
                  Keep Browsing
                </button>
              </div>
            </div>
          ) : (
            // ---- Booking form state ----
            <>
              <p className="font-label text-xs tracking-widest uppercase text-gold dark:text-gold-dark">{product.categoryName}</p>
              <h2 className="font-display italic text-3xl mt-2 text-ink dark:text-ivory">{product.name}</h2>
              <div className="flex items-center gap-3 mt-2 text-sm text-ink/60 dark:text-ivory/60">
                <span className="flex items-center gap-1"><Star size={13} className="fill-gold text-gold" /> {product.rating}</span>
                <span>·</span>
                <span>{product.reviews} reviews</span>
                <span>·</span>
                <span className={product.available ? 'text-green-700 dark:text-green-400' : 'text-red-600'}>
                  {product.available ? 'Available' : 'Reserved — check next slot'}
                </span>
              </div>
              <p className="mt-4 text-sm text-ink/70 dark:text-ivory/70 leading-relaxed">{product.description}</p>

              <div className="mt-6 space-y-5">
                <div>
                  <p className="font-label text-xs tracking-wider uppercase text-ink dark:text-ivory mb-2">Size</p>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((s) => (
                      <button key={s} onClick={() => setSize(s)}
                              className={`px-3.5 py-2 rounded-full text-xs border ${size === s ? 'bg-wine text-ivory border-wine dark:bg-gold-dark dark:text-noir dark:border-gold-dark' : 'border-ink/20 dark:border-ivory/20 text-ink/70 dark:text-ivory/70'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="font-label text-xs tracking-wider uppercase text-ink dark:text-ivory mb-2">Rental Duration</p>
                  <div className="flex flex-wrap gap-2">
                    {DURATIONS.map((d) => (
                      <button key={d.label} onClick={() => setDuration(d)}
                              className={`px-3.5 py-2 rounded-full text-xs border ${duration.label === d.label ? 'bg-wine text-ivory border-wine dark:bg-gold-dark dark:text-noir dark:border-gold-dark' : 'border-ink/20 dark:border-ivory/20 text-ink/70 dark:text-ivory/70'}`}>
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="rentnow-date" className="font-label text-xs tracking-wider uppercase text-ink dark:text-ivory mb-2 block">Event Date</label>
                  <input id="rentnow-date" type="date" value={date} onChange={(e) => setDate(e.target.value)}
                         className="px-4 py-2.5 rounded-xl border border-ink/20 dark:border-ivory/20 bg-transparent text-ink dark:text-ivory w-full" />
                </div>

                <div className="flex items-baseline gap-3">
                  <span className="font-display text-3xl text-wine dark:text-gold-dark">₹{price.toLocaleString('en-IN')}</span>
                  <span className="text-sm text-ink/50 dark:text-ivory/50">+ ₹{product.deposit.toLocaleString('en-IN')} refundable deposit</span>
                </div>

                <button onClick={handleBookNow} disabled={!product.available}
                        className="w-full px-6 py-3.5 rounded-full bg-wine text-ivory dark:bg-gold-dark dark:text-noir text-sm font-medium disabled:opacity-40">
                  Book Now
                </button>

                <Link to={`/product/${product.id}`} onClick={onClose}
                      className="flex items-center justify-center gap-1.5 text-xs text-ink/60 dark:text-ivory/60 hover:text-gold dark:hover:text-gold-dark">
                  View full product page <ArrowUpRight size={13} />
                </Link>

                <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-ink/10 dark:border-ivory/10 text-xs text-ink/60 dark:text-ivory/60">
                  <span className="flex items-center gap-2"><ShieldCheck size={15} className="text-gold" /> Trial appointment included</span>
                  <span className="flex items-center gap-2"><Truck size={15} className="text-gold" /> Pickup or doorstep delivery</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
