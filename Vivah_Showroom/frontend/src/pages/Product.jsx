// ============================================================================
// pages/Product.jsx — the "/product/:id" route (see App.jsx). The single
// product detail page: image gallery, size/duration/date pickers, live
// price calculation, wishlist/share/reserve actions, and a "Related Pieces"
// grid at the bottom. This IS the "full page view" showing sizes, price/day,
// details and availability — its "Rent Now" button below hands off to the
// dedicated booking flow at /rent/:id (see pages/RentBooking.jsx) for the
// mandatory date/size/payment steps, rather than silently adding to the bag.
//
// `id` comes from the URL (e.g. "/product/bridal-lehenga-3" -> id ===
// "bridal-lehenga-3"), looked up via getProduct() from data/products.js.
// If the id doesn't exist, <Navigate to="/" /> redirects home.
//
// PRICE CALCULATION: the displayed price isn't just product.rentalPrice —
// it's multiplied by the selected rental duration's `multiplier` (see
// DURATIONS below), so choosing "7 Days" costs more than "3 Days". This
// preview is purely informational here; the actual booking (mandatory
// size/dates/payment) happens on the /rent/:id page linked below.
//
// Like Category.jsx, this reads products synchronously from the local demo
// catalog rather than src/api/index.js's fetchProduct() — swap that in if
// you want this page to hit a real backend.
// ============================================================================
import { useState } from 'react'
import { useParams, Navigate, Link } from 'react-router-dom'
import { Heart, Share2, ShieldCheck, Truck, Star } from 'lucide-react'
import { getProduct, getRelatedProducts } from '../data/products'
import { categoryPath } from '../data/categories'
import { useShowroom } from '../context/ShowroomContext'
import ProductGallery from '../components/product/ProductGallery'
import ProductCard from '../components/product/ProductCard'
import Button from '../components/ui/Button'
import SectionHeading from '../components/ui/SectionHeading'

// Rental duration options and their price multipliers — e.g. a 7-day rental
// costs 1.8x the base 3-day price. Edit multipliers here to change pricing
// logic sitewide (this is the ONLY place these numbers live).
const DURATIONS = [
  { label: '3 Days', multiplier: 1 },
  { label: '5 Days', multiplier: 1.4 },
  { label: '7 Days', multiplier: 1.8 },
]

export default function Product() {
  const { id } = useParams()
  const product = getProduct(id)
  const { wishlist, toggleWishlist } = useShowroom()
  const [size, setSize] = useState('M')               // currently selected size chip
  const [duration, setDuration] = useState(DURATIONS[0]) // currently selected rental duration
  const [date, setDate] = useState('')                  // customer's chosen event date

  if (!product) return <Navigate to="/" replace /> // unknown product id -> bounce home
  const saved = wishlist.includes(product.id)
  const related = getRelatedProducts(product)
  // Live price = base rental price × the selected duration's multiplier,
  // recalculated on every render (cheap enough not to need useMemo here).
  const price = Math.round(product.rentalPrice * duration.multiplier)

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-10 py-14">
      <p className="text-xs text-ink/40 dark:text-ivory/40 mb-6">
        <Link to="/" className="hover:text-gold">Home</Link> / <Link to={categoryPath(product.category)} className="hover:text-gold">{product.categoryName}</Link> / {product.name}
      </p>

      <div className="grid md:grid-cols-2 gap-12">
        <ProductGallery images={product.gallery} name={product.name} />

        <div>
          <p className="font-label text-xs tracking-widest uppercase text-gold dark:text-gold-dark">{product.categoryName}</p>
          <h1 className="font-display italic text-3xl sm:text-4xl mt-2 text-ink dark:text-ivory">{product.name}</h1>
          <div className="flex items-center gap-3 mt-3 text-sm text-ink/60 dark:text-ivory/60">
            <span className="flex items-center gap-1"><Star size={14} className="fill-gold text-gold" /> {product.rating}</span>
            <span>·</span>
            <span>{product.reviews} reviews</span>
            <span>·</span>
            <span className={product.available ? 'text-green-700 dark:text-green-400' : 'text-red-600'}>
              {product.available ? 'Available' : 'Reserved — check next slot'}
            </span>
          </div>

          <p className="mt-6 text-ink/70 dark:text-ivory/70 leading-relaxed">{product.description}</p>

          <div className="mt-8 space-y-6">
            <div>
              <p className="font-label text-xs tracking-wider uppercase text-ink dark:text-ivory mb-2">Size</p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button key={s} onClick={() => setSize(s)}
                          className={`px-4 py-2 rounded-full text-xs border ${size === s ? 'bg-wine text-ivory border-wine dark:bg-gold-dark dark:text-noir dark:border-gold-dark' : 'border-ink/20 dark:border-ivory/20 text-ink/70 dark:text-ivory/70'}`}>
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
                          className={`px-4 py-2 rounded-full text-xs border ${duration.label === d.label ? 'bg-wine text-ivory border-wine dark:bg-gold-dark dark:text-noir dark:border-gold-dark' : 'border-ink/20 dark:border-ivory/20 text-ink/70 dark:text-ivory/70'}`}>
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="event-date" className="font-label text-xs tracking-wider uppercase text-ink dark:text-ivory mb-2 block">Event Date</label>
              <input id="event-date" type="date" value={date} onChange={(e) => setDate(e.target.value)}
                     className="px-4 py-2.5 rounded-xl border border-ink/20 dark:border-ivory/20 bg-transparent text-ink dark:text-ivory w-full sm:w-64" />
            </div>

            <div className="flex items-baseline gap-3">
              <span className="font-display text-3xl text-wine dark:text-gold-dark">₹{price.toLocaleString('en-IN')}</span>
              <span className="text-sm text-ink/50 dark:text-ivory/50">+ ₹{product.deposit.toLocaleString('en-IN')} refundable deposit</span>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button to={`/rent/${product.id}`} disabled={!product.available}>Rent Now</Button>
              <Button variant="outline" onClick={() => toggleWishlist(product.id)}>
                <Heart size={16} className={saved ? 'fill-wine dark:fill-gold-dark' : ''} /> {saved ? 'Saved' : 'Wishlist'}
              </Button>
              <Button variant="ghost" onClick={() => navigator.share ? navigator.share({ title: product.name, url: window.location.href }) : null}>
                <Share2 size={16} /> Share
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 pt-6 border-t border-ink/10 dark:border-ivory/10 text-xs text-ink/60 dark:text-ivory/60">
              <span className="flex items-center gap-2"><ShieldCheck size={16} className="text-gold" /> Trial appointment included</span>
              <span className="flex items-center gap-2"><Truck size={16} className="text-gold" /> Pickup or doorstep delivery</span>
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <div className="mt-24">
          <SectionHeading eyebrow="You May Also Like" title="Related Pieces" align="left" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-10">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}
    </div>
  )
}
