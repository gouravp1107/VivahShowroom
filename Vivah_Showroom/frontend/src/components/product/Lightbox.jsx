// ============================================================================
// components/product/Lightbox.jsx — the full-screen image viewer opened by
// clicking a product image (see ProductCard.jsx's image click handler, and
// ProductGallery.jsx's "expand" button on the product detail page).
//
// ZOOM IS MANUAL ONLY, ON PURPOSE:
// An earlier version of this site auto-zoomed the product-detail image
// whenever your mouse moved over it (hover-triggered). That's been
// removed everywhere — zooming now only happens when the visitor clicks
// the + / − buttons (or the image itself, which zooms in one step)
// below. When zoomed in past 1x, the image container scrolls
// (overflow: auto) so you can pan around by scrolling/dragging, rather
// than the image following your cursor automatically.
//
// Supports an optional multi-image gallery (used on the product detail
// page): pass `images` (array of paths) + `initialIndex`, and prev/next
// arrows appear. ProductCard.jsx instead passes a single-image array since
// grid cards only have one photo each.
// ============================================================================
import { useEffect, useState } from 'react'
import { X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'

const MIN_ZOOM = 1
const MAX_ZOOM = 3
const ZOOM_STEP = 0.5

export default function Lightbox({ images, initialIndex = 0, alt = '', onClose }) {
  const [index, setIndex] = useState(initialIndex)
  const [zoom, setZoom] = useState(1)

  // Resets zoom back to 1x whenever the visitor switches images — starting
  // the next photo pre-zoomed-in would be confusing.
  useEffect(() => setZoom(1), [index])

  // Lets visitors close the lightbox with the Escape key, and left/right
  // arrow keys to move between images — standard, expected lightbox behavior.
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') setIndex((i) => (i + 1) % images.length)
      if (e.key === 'ArrowLeft') setIndex((i) => (i - 1 + images.length) % images.length)
    }
    window.addEventListener('keydown', handleKey)
    // Prevents the page behind the lightbox from scrolling while it's open.
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [images.length, onClose])

  function zoomIn() {
    setZoom((z) => Math.min(MAX_ZOOM, z + ZOOM_STEP))
  }
  function zoomOut() {
    setZoom((z) => Math.max(MIN_ZOOM, z - ZOOM_STEP))
  }

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      // Clicking the dark backdrop (but not the image/controls) closes the lightbox.
      onClick={onClose}
    >
      {/* Top-right controls: zoom out, reset, zoom in, close. stopPropagation
          so clicking these doesn't also trigger the backdrop's onClose. */}
      <div className="absolute top-5 right-5 flex items-center gap-2 z-10" onClick={(e) => e.stopPropagation()}>
        <button onClick={zoomOut} disabled={zoom <= MIN_ZOOM} aria-label="Zoom out"
                className="w-10 h-10 rounded-full bg-white/10 text-white grid place-items-center hover:bg-white/20 disabled:opacity-30 transition-colors">
          <ZoomOut size={18} />
        </button>
        <button onClick={() => setZoom(1)} aria-label="Reset zoom"
                className="w-10 h-10 rounded-full bg-white/10 text-white grid place-items-center hover:bg-white/20 transition-colors">
          <RotateCcw size={16} />
        </button>
        <button onClick={zoomIn} disabled={zoom >= MAX_ZOOM} aria-label="Zoom in"
                className="w-10 h-10 rounded-full bg-white/10 text-white grid place-items-center hover:bg-white/20 disabled:opacity-30 transition-colors">
          <ZoomIn size={18} />
        </button>
        <span className="text-white/70 text-xs font-label tracking-wider w-10 text-center">{Math.round(zoom * 100)}%</span>
        <button onClick={onClose} aria-label="Close fullscreen view"
                className="w-10 h-10 rounded-full bg-white/10 text-white grid place-items-center hover:bg-white/20 transition-colors ml-2">
          <X size={20} />
        </button>
      </div>

      {/* Prev/next arrows — only rendered when there's more than one image. */}
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); setIndex((i) => (i - 1 + images.length) % images.length) }}
            aria-label="Previous image"
            className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 text-white grid place-items-center hover:bg-white/20 transition-colors z-10"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setIndex((i) => (i + 1) % images.length) }}
            aria-label="Next image"
            className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 text-white grid place-items-center hover:bg-white/20 transition-colors z-10"
          >
            <ChevronRight size={22} />
          </button>
        </>
      )}

      {/* The image itself. When zoomed in, overflow:auto on the wrapper lets
          the visitor scroll/pan to see parts of the zoomed image outside
          the viewport — this is the "manual" pan/zoom behavior replacing
          the old cursor-follow auto-zoom. Clicking the image itself is a
          quick way to zoom in one step (or reset if already at max). */}
      <div
        className="w-full h-full flex items-center justify-center overflow-auto p-6 sm:p-16"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={images[index]}
          alt={alt}
          onClick={() => setZoom((z) => (z >= MAX_ZOOM ? 1 : z + ZOOM_STEP))}
          className="max-w-full max-h-full object-contain transition-transform duration-200 cursor-zoom-in select-none"
          style={{ transform: `scale(${zoom})` }}
          draggable={false}
        />
      </div>
    </div>
  )
}
