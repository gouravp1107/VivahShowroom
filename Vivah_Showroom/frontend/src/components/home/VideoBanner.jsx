// ============================================================================
// components/home/VideoBanner.jsx — the full-width "Watch & Shop" banner on
// the homepage (below the video banner section). Background image is
// frontend/public/assets/banners/watch-and-shop.jpg — swap that file (keep
// the same filename) to change it again later.
// ============================================================================
import Button from '../ui/Button'

export default function VideoBanner() {
  return (
    <section className="relative h-[70vh] my-8 overflow-hidden">
      <img src="assets/banners/watch-and-shop.jpg" alt="Watch and shop the collection" className="w-full h-full object-cover" loading="lazy" />
      <div className="absolute inset-0 bg-ink/60 flex flex-col items-center justify-center text-center px-6">
        <span className="font-label text-xs tracking-[0.4em] uppercase text-gold-bright">The Lookbook Film</span>
        <h2 className="font-display italic text-white text-4xl sm:text-5xl mt-4 max-w-xl">
          Watch a full bridal look, styled start to finish.
        </h2>
        <Button to="/bride/bridal-lehenga" className="mt-8">Watch & Shop</Button>
      </div>
    </section>
  )
}
