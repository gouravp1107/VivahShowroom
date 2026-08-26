// ============================================================================
// components/home/CategoryRail.jsx — "The Showroom Rail": a horizontally
// scrollable strip evoking a physical rack of hanging outfits.
//
// CARD ORDER is deliberately fixed (not just "every category in file
// order") to a specific sequence: Bride, Groom, Couple, Garba, Bride
// Jewellery, Groom Jewellery, Bride Jutti, Groom Jutti, Other — then the
// exact same nine cards repeat a second time, so scrolling the rail feels
// like a continuous loop rather than stopping abruptly after nine cards.
// Each entry links to that section's landing page (its hub for Bride/
// Groom/Jewellery, or straight to the category for the others).
// ============================================================================
import { Link } from 'react-router-dom'
import { getCategory, categoryPath } from '../../data/categories'
import { getProductsByCategory } from '../../data/products'
import SectionHeading from '../ui/SectionHeading'
import EditOverlay from '../admin/EditOverlay'
import AddCardTile from '../admin/AddCardTile'

// One representative cover category per rail card — `cover` is whichever
// category's first product photo best represents that card (e.g. the Bride
// card shows a Bridal Lehenga photo, even though the card links to the
// whole /bride hub with all 4 bride categories).
const RAIL_ITEMS = [
  { key: 'bride', name: 'Bride', cover: 'bridal-lehenga', to: '/bride' },
  { key: 'groom', name: 'Groom', cover: 'groom-sherwani', to: '/groom' },
  { key: 'couple', name: 'Couple', cover: 'couple-collection', to: categoryPath('couple-collection') },
  { key: 'garba', name: 'Garba', cover: 'garba', to: categoryPath('garba') },
  { key: 'bride-jewellery', name: 'Bride Jewellery', cover: 'bridal-jewellery', to: '/jewellery/bride' },
  { key: 'groom-jewellery', name: 'Groom Jewellery', cover: 'groom-jewellery', to: '/jewellery/groom' },
  { key: 'bride-jutti', name: 'Bride Jutti', cover: 'bridal-jutti', to: categoryPath('bridal-jutti') },
  { key: 'groom-jutti', name: 'Groom Jutti', cover: 'groom-jutti', to: categoryPath('groom-jutti') },
  { key: 'other', name: 'Other', cover: 'other', to: categoryPath('other') },
]

export default function CategoryRail() {
  // Doubled so the rail keeps going instead of visibly running out after
  // nine cards — "loop" is just a repeated render, not actual infinite
  // scroll wrap-around (kept simple on purpose).
  const cards = [...RAIL_ITEMS, ...RAIL_ITEMS]

  return (
    <section className="py-24 px-6 sm:px-10 max-w-7xl mx-auto">
      <SectionHeading eyebrow="Shop by Category" title="The Showroom Rail" align="left" />
      <div className="flex gap-5 overflow-x-auto rail-scroll pb-6 mt-10 -mx-6 px-6 sm:mx-0 sm:px-0">
        {cards.map((item, i) => {
          const coverCategory = getCategory(item.cover)
          const cover = coverCategory ? getProductsByCategory(coverCategory.slug)[0] : null
          return (
            <Link key={`${item.key}-${i}`} to={item.to}
                  className="group relative flex-shrink-0 w-56 sm:w-64 h-80 rounded-[2rem] overflow-hidden shadow-lg">
              {cover && <img src={cover.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />}
              <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/10 to-transparent" />
              <div className="absolute bottom-0 p-5">
                <h3 className="font-display italic text-white text-xl">{item.name}</h3>
                <p className="text-white/70 text-xs mt-1 font-label tracking-wider uppercase">View Collection →</p>
              </div>
              {/* Admin-only edit affordance — see components/admin/EditOverlay.jsx.
                  Routes into the Categories manager (the existing admin CMS
                  screen), rather than an inline editor — keeps the public
                  rail's markup simple while still giving admins a one-click
                  path to the real edit form for this category. */}
              <EditOverlay label={item.name} editTo="/admin/categories" />
            </Link>
          )
        })}
        <AddCardTile label="Add Category" to="/admin/categories" className="flex-shrink-0 w-56 sm:w-64 h-80 rounded-[2rem]" />
      </div>
    </section>
  )
}
