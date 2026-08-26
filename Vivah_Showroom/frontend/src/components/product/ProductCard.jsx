// ============================================================================
// components/product/ProductCard.jsx — the product tile used everywhere a
// grid/list of products is shown: CategoryHub.jsx, JewelleryHub.jsx,
// JewelleryTypeHub.jsx, Category.jsx (Couple Collection), Spotlight.jsx,
// Trending.jsx, TrendingRentals.jsx (home), Wishlist.jsx, and the
// "Related Pieces" section on Product.jsx. Takes one `product` object (see
// data/products.js for its shape: id, name, image, rentalPrice, rating,
// available, etc.) and renders it consistently everywhere — a change here
// applies to every single one of those.
//
// THREE SEPARATE INTERACTIONS ON EVERY CARD:
//   - Clicking the IMAGE opens a full-screen Lightbox (see
//     components/product/Lightbox.jsx) — just the photo, with manual zoom
//     controls. It does NOT navigate anywhere or show booking details.
//   - Clicking "Rent Now" navigates to the full-page booking flow at
//     /rent/:id (see pages/RentBooking.jsx) — size/dates/payment, ending in
//     a confirmed order under My Orders.
//   - Clicking the PRODUCT NAME navigates to the full product detail page
//     (/product/:id) instead — for people who want the complete page
//     (bigger gallery, related items, etc.) rather than jumping straight
//     to booking.
//
// LAYOUT, PER A MOBILE-VIEW FOLLOW-UP:
//   - "Rent Now" moved OFF the image (it used to float as an
//     opacity-on-hover overlay bar at the bottom of the photo, which
//     crowded against the availability icon/wishlist heart/expand hint on
//     small touch screens where hover states don't really apply) — it's
//     now a normal button in the text section below the image, next to
//     the price, with no absolute-positioning collisions to manage.
//   - Corners are LESS rounded (rounded-2xl, was rounded-3xl) — a smaller,
//     subtler curve reads less "bubbly" at this card's now-larger size.
//   - The image area is taller (`imageAspect` default lengthened from
//     "3/4" to "3/4.6") so the photo gets noticeably bigger without
//     touching the text section's own height — that section's own
//     padding/line-heights are unchanged, only the image above it grew.
//   - Width still comes from the surrounding grid (2 columns on mobile,
//     unchanged) — grids using this card were given a smaller gap
//     (gap-4 instead of gap-6) on mobile specifically so each of the 2
//     columns gets a bit more width too. See CategoryHub.jsx,
//     JewelleryTypeHub.jsx, Category.jsx, Trending.jsx, TrendingRentals.jsx.
//
// PRICE/DETAILS "INSIDE" THE CARD: the image and its name/price/rating are
// wrapped in ONE bordered, backgrounded card — not just an image with
// plain text floating below it — so in a dense grid it's never ambiguous
// which price belongs to which photo, even when a neighboring card's
// image is a different aspect ratio or row heights don't quite line up.
// ============================================================================
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Star, Expand, CheckCircle2, XCircle } from 'lucide-react'
import { useShowroom } from '../../context/ShowroomContext'
import { deleteProduct } from '../../api/adminApi'
import Lightbox from './Lightbox'
import EditOverlay from '../admin/EditOverlay'

export default function ProductCard({ product, imageAspect = '3/4.6' }) {
  const { wishlist, toggleWishlist } = useShowroom()
  const saved = wishlist.includes(product.id)
  const [lightboxOpen, setLightboxOpen] = useState(false) // photo-only fullscreen view
  const [removed, setRemoved] = useState(false) // optimistically hides the card the instant an admin deletes it

  async function handleDelete() {
    try {
      await deleteProduct(product.id)
      setRemoved(true)
    } catch (err) {
      window.alert(err.message || 'Could not delete this product.')
    }
  }

  if (removed) return null

  return (
    <div className="group relative rounded-2xl overflow-hidden border border-ink/10 dark:border-ivory/10 bg-ivory dark:bg-charcoal shadow-sm">
      {/* Admin-only edit/delete — see components/admin/EditOverlay.jsx.
          Sits on the LEFT so it never collides with the wishlist heart on
          the right (below). Pushed down (style) so it sits below the
          availability icon rather than on top of it. Edit routes into the
          real Products manager; Delete calls the real API directly since
          it needs no form. */}
      <EditOverlay label={product.name} editTo="/admin/products" onDelete={handleDelete} position="top-left" style={{ top: '2.75rem' }} />

      {/* Image section only — Rent Now is NOT in here anymore (see file
          header comment), so the only things sharing this space are the
          availability icon (top-left), wishlist heart (top-right), and the
          hover-only expand hint (bottom-right) — no more crowding. */}
      <div className="relative w-full bg-blush/40 dark:bg-noir" style={{ aspectRatio: imageAspect }}>
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          aria-label={`View ${product.name} full screen`}
          className="block w-full h-full"
        >
          <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
        </button>

        {/* Available/Unavailable status — icon ONLY, no text label, so it
            reads at a glance without cluttering the card. Always shown
            (not just when unavailable). */}
        <span
          className={`absolute top-3 left-3 w-7 h-7 rounded-full grid place-items-center pointer-events-none ${
            product.available ? 'bg-emerald-600/90 text-white' : 'bg-red-600/90 text-white'
          }`}
          aria-label={product.available ? 'Available' : 'Unavailable'}
          title={product.available ? 'Available' : 'Unavailable'}
        >
          {product.available ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
        </span>

        {/* Small expand hint that appears on hover, signalling the image is clickable */}
        <span className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-ink/60 text-ivory grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <Expand size={14} />
        </span>

        <button onClick={() => toggleWishlist(product.id)} aria-label="Toggle wishlist"
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-ivory/90 dark:bg-noir/80 grid place-items-center shadow">
          <Heart size={16} className={saved ? 'fill-wine text-wine dark:fill-gold-dark dark:text-gold-dark' : 'text-ink dark:text-ivory'} />
        </button>
      </div>

      {/* Text section — its own padded box, still inside the same card
          border as the image above. "Rent Now" lives here now (bottom of
          this section), a normal always-visible button rather than a
          hover-fade overlay on the photo. This section's height is fixed
          regardless of imageAspect — only the image above grows. */}
      <div className="p-4">
        <Link to={`/product/${product.id}`}>
          <h3 className="font-display italic text-lg text-ink dark:text-ivory">{product.name}</h3>
        </Link>
        <p className="text-xs text-ink/50 dark:text-ivory/50">{product.colorway}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm font-medium text-wine dark:text-gold-dark">₹{product.rentalPrice.toLocaleString('en-IN')} / rental</span>
          <span className="flex items-center gap-1 text-xs text-ink/60 dark:text-ivory/60">
            <Star size={12} className="fill-gold text-gold" /> {product.rating}
          </span>
        </div>
        <Link
          to={`/rent/${product.id}`}
          className="block mt-3 py-2.5 rounded-full bg-wine dark:bg-gold-dark text-ivory dark:text-noir text-xs font-label tracking-wider uppercase text-center"
        >
          Rent Now
        </Link>
      </div>

      {lightboxOpen && (
        <Lightbox images={[product.image]} alt={product.name} onClose={() => setLightboxOpen(false)} />
      )}
    </div>
  )
}
