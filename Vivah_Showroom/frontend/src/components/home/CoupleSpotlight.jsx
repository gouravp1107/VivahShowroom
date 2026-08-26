// ============================================================================
// components/home/CoupleSpotlight.jsx — the "One love story, one
// coordinated wardrobe" homepage section promoting the Couple Collection
// category. The image path below is hand-picked (not generated from
// data/products.js) — swap it for any other file in
// frontend/public/assets/couple/ if needed.
//
// IMAGE BOX WIDTH: set to roughly HALF of what it was previously (the
// column ratio went from grid-cols-[6fr_5fr] — image ~55% of the row — to
// grid-cols-[2fr_5fr] — image ~29%, about half of 55%) per an explicit
// follow-up request with a screenshot showing the wider version. Height
// stays the same fixed h-[28rem].
// ============================================================================
import Button from '../ui/Button'
import EditOverlay from '../admin/EditOverlay'

export default function CoupleSpotlight() {
  return (
    <section className="py-24 px-6 sm:px-10 max-w-7xl mx-auto grid md:grid-cols-[2fr_5fr] gap-12 items-center">
      <div className="relative h-[28rem] rounded-[2rem] overflow-hidden">
        <img src="assets/couple/couple-020.jpg" alt="Couple collection" className="w-full h-full object-cover" loading="lazy" />
        <EditOverlay label="Couple Collection" editTo="/admin/categories" />
      </div>
      <div>
        <span className="font-label text-xs tracking-[0.3em] uppercase text-gold dark:text-gold-dark">Couple Collection</span>
        <h2 className="font-display italic text-4xl sm:text-5xl mt-4 text-ink dark:text-ivory">
          One love story,<br />one coordinated wardrobe.
        </h2>
        <p className="mt-5 text-ink/60 dark:text-ivory/60 max-w-md">
          Every couple set is styled together — fabric, colour and embroidery matched
          across bride and groom, so your photographs tell one story, not two.
        </p>
        <Button to="/category/couple-collection" className="mt-8">Explore Couple Looks</Button>
      </div>
    </section>
  )
}
