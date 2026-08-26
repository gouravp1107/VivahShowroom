// ============================================================================
// components/home/MomentsGallery.jsx — "Beautiful Moments": a gallery of
// image cards on the homepage, deliberately made of CANDID/ATMOSPHERE
// photography (couples laughing, a groom mid-walk, a bride's portrait)
// rather than flat product/outfit shots — the goal is mood and
// storytelling, not another product grid (that's what
// TrendingRentals.jsx and the hub pages are for).
//
// Because these aren't tied to a specific rentable product, clicking a card
// opens the plain photo Lightbox (components/product/Lightbox.jsx, manual
// zoom, no booking info) — there's no "Rent Now" button here, unlike
// ProductCard.jsx's grid boxes.
//
// CARD SIZING: every card is the exact SAME fixed size — 300px wide,
// 400px tall — rather than the earlier masonry layout (which varied each
// card's height and let a plain flexible-width grid column stretch/shrink
// each card's width, cropping some photos much harder than others).
// Fixed dimensions on every card means every photo gets cropped by
// object-cover the same consistent amount, not more on some cards than
// others. The row wraps responsively (flex-wrap) rather than forcing a
// fixed column count, so it still looks right on any screen width.
// ============================================================================
import { useState } from 'react'
import SectionHeading from '../ui/SectionHeading'
import Lightbox from '../product/Lightbox'
import EditOverlay from '../admin/EditOverlay'
import AddCardTile from '../admin/AddCardTile'

const MOMENTS = [
  { image: 'assets/couple/couple-015.jpg', alt: 'Couple sharing a quiet moment' },
  { image: 'assets/bride/bride-060.jpg', alt: 'Bride portrait' },
  { image: 'assets/groom/groom-045.jpg', alt: 'Groom candid moment' },
  { image: 'assets/bride/bride-025.jpg', alt: 'Bridal detail' },
  { image: 'assets/couple/couple-035.jpg', alt: 'Couple walking together' },
  { image: 'assets/groom/groom-090.jpg', alt: 'Groom portrait' },
  { image: 'assets/jewellery-bride/jewellery-bride-060.jpg', alt: 'Jewellery detail' },
  { image: 'assets/bride/bride-110.jpg', alt: 'Bride in motion' },
]

export default function MomentsGallery() {
  const [openIndex, setOpenIndex] = useState(null)

  return (
    <section className="py-24 px-6 sm:px-10 max-w-7xl mx-auto">
      <SectionHeading eyebrow="Real Weddings, Real Moments" title="Beautiful Moments" subtitle="Not another product shelf — just the feeling this wardrobe is dressed for." />

      {/* Fixed 300x400 cards (see file header comment), laid out as a
          proper CSS grid — exactly 4 per row on larger screens, fewer on
          smaller ones — rather than a flex-wrap row, so every card lines
          up into clean rows/columns with the SAME gap both horizontally
          and vertically (gap-8 sets both at once), instead of flex-wrap's
          uneven-looking left-aligned leftover space on partial rows. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 justify-items-center mt-12">
        {MOMENTS.map((m, i) => (
          <div key={m.image} className="relative">
            <button
              type="button"
              onClick={() => setOpenIndex(i)}
              aria-label={`View "${m.alt}" full screen`}
              className="relative block w-[300px] max-w-full h-[400px] rounded-2xl overflow-hidden group"
            >
              <img src={m.image} alt={m.alt} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
              <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/15 transition-colors" />
            </button>
            <EditOverlay label={m.alt} editTo="/admin/gallery" />
          </div>
        ))}
        <AddCardTile label="Add Moment" to="/admin/gallery" className="w-[300px] max-w-full h-[400px] rounded-2xl" />
      </div>

      {openIndex !== null && (
        <Lightbox
          images={MOMENTS.map((m) => m.image)}
          initialIndex={openIndex}
          alt={MOMENTS[openIndex].alt}
          onClose={() => setOpenIndex(null)}
        />
      )}
    </section>
  )
}
