// ============================================================================
// components/product/SpotlightCard.jsx — the product box used ONLY on
// pages/Spotlight.jsx. Sized identically to the standard
// components/product/ProductCard.jsx box (same aspect-[3/4] ratio used
// throughout the site, e.g. the Jewellery hub pages) so Spotlight's boxes
// look consistent with every other product grid — this component's
// difference from ProductCard.jsx is purely about INTERACTION, not size:
//
//   - Click behavior: clicking the image navigates straight to the full
//     booking page at /rent/:id (see pages/RentBooking.jsx) — there's no
//     separate photo-only Lightbox step here, unlike ProductCard.jsx. This
//     page is meant to feel like a fast, impressive "tap what you love,
//     book immediately" showcase rather than a browse-first grid.
//   - Visual style: name/price/rating are hidden until hover, revealed as
//     a gradient overlay sliding up from the bottom of the image — kept
//     purely photographic until you interact with it, for a more editorial/
//     lookbook feel than the standard card-with-caption-below layout.
//
// Used inside a horizontally-scrolling rail (see pages/Spotlight.jsx) with
// a fixed width, the same way components/home/CategoryRail.jsx sizes its
// own cards (w-56 sm:w-64) — that fixed width plus flex-shrink-0 is what
// keeps every box the same size while letting the row scroll sideways.
// ============================================================================
import { Link } from 'react-router-dom'
import { Heart, Star } from 'lucide-react'
import { useShowroom } from '../../context/ShowroomContext'

export default function SpotlightCard({ product }) {
  const { wishlist, toggleWishlist } = useShowroom()
  const saved = wishlist.includes(product.id)

  return (
    <div className="relative group rounded-3xl overflow-hidden flex-shrink-0 w-56 sm:w-64 aspect-[3/4]">
      <Link
        to={`/rent/${product.id}`}
        aria-label={`Book ${product.name}`}
        className="block w-full h-full"
      >
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          loading="lazy"
        />

        {!product.available && (
          <span className="absolute top-3 left-3 text-[10px] font-label tracking-wider uppercase bg-ink/80 text-ivory px-2.5 py-1 rounded-full pointer-events-none">
            Reserved
          </span>
        )}

        {/* Gradient caption — hidden until hover, then slides up from the
            bottom. translate-y-full pushes it fully below the box at rest;
            group-hover:translate-y-0 brings it into view. */}
        <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-ink/90 via-ink/40 to-transparent
                         translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out">
          <h3 className="font-display italic text-white text-lg leading-tight">{product.name}</h3>
          <div className="flex items-center justify-between mt-1">
            <span className="text-gold-bright text-sm font-medium">₹{product.rentalPrice.toLocaleString('en-IN')}</span>
            <span className="flex items-center gap-1 text-white/80 text-xs">
              <Star size={11} className="fill-gold text-gold" /> {product.rating}
            </span>
          </div>
          <span className="inline-block mt-2 text-[10px] font-label tracking-widest uppercase text-white/70">
            Tap to book →
          </span>
        </div>

        {/* Always-visible subtle vignette so text stays readable even
            before hover reveals the full gradient — keeps every box
            looking intentional, not just a bare photo. */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />
      </Link>

      <button
        onClick={(e) => { e.stopPropagation(); toggleWishlist(product.id) }}
        aria-label="Toggle wishlist"
        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-ivory/90 dark:bg-noir/80 grid place-items-center shadow opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Heart size={14} className={saved ? 'fill-wine text-wine dark:fill-gold-dark dark:text-gold-dark' : 'text-ink dark:text-ivory'} />
      </button>
    </div>
  )
}
