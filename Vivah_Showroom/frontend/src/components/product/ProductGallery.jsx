// ============================================================================
// components/product/ProductGallery.jsx — the image viewer on the product
// detail page (pages/Product.jsx). Shows the active image large, with
// small thumbnail buttons below to switch between the product's `images`
// array (each product has 3 gallery photos — see data/products.js for how
// that 3-photo set is generated from the source folder).
//
// ZOOM IS MANUAL, NOT AUTOMATIC:
// This used to zoom automatically wherever the cursor hovered (a "magnifying
// glass" effect). That's been removed sitewide — clicking the main image
// (or the expand icon) now opens the same full-screen Lightbox used by
// product grid cards (see components/product/Lightbox.jsx), where zoom
// only happens via explicit +/- button clicks. This keeps the zoom
// behavior consistent everywhere on the site, and avoids the jumpy/
// unintentional zooming hover-zoom can cause on trackpads and touch devices.
// ============================================================================
import { useState } from 'react'
import { Expand } from 'lucide-react'
import Lightbox from './Lightbox'

export default function ProductGallery({ images, name }) {
  const [active, setActive] = useState(0)          // index of the currently large/shown image
  const [lightboxOpen, setLightboxOpen] = useState(false)

  return (
    <div>
      <button
        type="button"
        onClick={() => setLightboxOpen(true)}
        aria-label={`View ${name} full screen`}
        className="group relative w-full aspect-[3/4] rounded-3xl overflow-hidden bg-blush/30 dark:bg-charcoal block"
      >
        <img src={images[active]} alt={name} className="w-full h-full object-cover" />
        <span className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-ink/70 text-ivory grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Expand size={16} />
        </span>
      </button>

      <div className="flex gap-3 mt-4">
        {images.map((src, i) => (
          <button key={src} onClick={() => setActive(i)}
                  className={`w-20 h-24 rounded-xl overflow-hidden border-2 ${i === active ? 'border-gold' : 'border-transparent'}`}>
            <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
          </button>
        ))}
      </div>
      <p className="text-xs text-ink/40 dark:text-ivory/40 mt-2">Click the image for a full-screen, manual-zoom view · 360° view coming soon</p>

      {lightboxOpen && (
        <Lightbox images={images} initialIndex={active} alt={name} onClose={() => setLightboxOpen(false)} />
      )}
    </div>
  )
}
