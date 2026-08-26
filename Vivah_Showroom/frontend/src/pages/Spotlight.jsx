// ============================================================================
// pages/Spotlight.jsx — the "/spotlight" route: a single, animated showcase
// pulling highlights from EVERY part of the showroom (Bride, Groom, Bride
// Jewellery, Groom Jewellery, Garba, Couple, Other) onto one page, rather
// than making a visitor dig through each hub separately. Linked from the
// Navbar's "Spotlight" button (see components/layout/Navbar.jsx).
//
// LAYOUT: each section is a horizontally-scrolling rail of uniform,
// same-size boxes — the same aspect-[3/4] box size used everywhere else on
// the site (e.g. the Jewellery hub pages' product grids) — rather than a
// wrapping grid, so a section with many picks doesn't turn into an
// endless vertical scroll; you scroll sideways through each category's
// highlights instead. Same rail pattern as
// components/home/CategoryRail.jsx's homepage "Showroom Rail."
//
// SECTIONS: Bride Jewellery and Groom Jewellery are separate rails (were
// previously merged into one combined "Jewellery Spotlight" — split apart
// per a follow-up request so each side gets its own section, matching how
// Bride and Groom already each get their own). Garba and Other are
// included too — since both start out with zero seeded products (see
// data/categories.js), their sections simply don't render any product
// cards until an admin adds something via Inventory Management; an admin
// still sees the section with just its "Add Product" tile, so there's an
// obvious way to fill it in. A logged-out visitor never sees an empty rail.
//
// DELIBERATELY DIFFERENT FROM THE HUB PAGES:
//   - Uses SpotlightCard.jsx (not the standard ProductCard.jsx) — clicking
//     an image jumps STRAIGHT into the fullscreen booking view
//     (RentNowModal) rather than a photo-only preview first. See that
//     file's header comment for the full reasoning.
//   - Each rail animates in with a staggered scroll-triggered reveal (see
//     components/ui/Reveal.jsx) — cards fade/slide into place a beat apart
//     as their section scrolls into view, rather than everything
//     appearing at once.
// ============================================================================
import { getProductsByCategory } from '../data/products'
import SpotlightCard from '../components/product/SpotlightCard'
import SectionHeading from '../components/ui/SectionHeading'
import Divider from '../components/ui/Divider'
import Reveal from '../components/ui/Reveal'
import AddCardTile from '../components/admin/AddCardTile'
import { useAdminEditMode } from '../hooks/useAdminEditMode'

// One curated pick per section — a handful of products per group, pulled
// from a spread of categories so the spotlight doesn't just repeat one
// category's products four times.
function spotlightPicks() {
  const pick = (slug, count) => getProductsByCategory(slug).slice(0, count)
  return {
    bride: [...pick('bridal-lehenga', 4), ...pick('bridal-saree', 4), ...pick('bridal-gown', 4)],
    groom: [...pick('groom-sherwani', 4), ...pick('groom-indo-western', 4), ...pick('groom-suit', 4)],
    'bride-jewellery': pick('bridal-jewellery', 8),
    'groom-jewellery': pick('groom-jewellery', 8),
    garba: pick('garba', 12),
    couple: pick('couple-collection', 12),
    other: pick('other', 12),
  }
}

const SECTIONS = [
  { key: 'bride', eyebrow: 'Bride Spotlight', title: 'This Season\u2019s Bridal Edit' },
  { key: 'groom', eyebrow: 'Groom Spotlight', title: 'This Season\u2019s Groom Edit' },
  { key: 'bride-jewellery', eyebrow: 'Bride Jewellery Spotlight', title: 'Heirloom Pieces, Handpicked' },
  { key: 'groom-jewellery', eyebrow: 'Groom Jewellery Spotlight', title: 'Finishing Touches for the Groom' },
  { key: 'garba', eyebrow: 'Garba Spotlight', title: 'Dandiya Night Edit' },
  { key: 'couple', eyebrow: 'Couple Spotlight', title: 'Looks Styled to Match' },
  { key: 'other', eyebrow: 'Other', title: 'Western Wear & More' },
]

export default function Spotlight() {
  const picks = spotlightPicks()
  const isAdmin = useAdminEditMode()
  // A section with zero picks only renders for an admin (so they have an
  // obvious "Add Product" tile to fill it in) — a logged-out visitor never
  // sees an empty rail.
  const visibleSections = SECTIONS.filter((s) => picks[s.key].length > 0 || isAdmin)

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-10 py-16">
      <Reveal>
        <SectionHeading
          eyebrow="The Full Showroom"
          title="Spotlight"
          subtitle="A single, curated tour of the season's best bridal, groom, jewellery and couple looks. Scroll sideways through each edit, and tap any photo to book it instantly."
        />
      </Reveal>

      {visibleSections.map((section, i) => (
        <div key={section.key} className={i === 0 ? 'mt-16' : 'mt-20'}>
          {i > 0 && <Divider className="mb-16" />}

          <Reveal>
            <SectionHeading eyebrow={section.eyebrow} title={section.title} align="left" />
          </Reveal>

          <Reveal delay={150}>
            <div className="flex gap-5 overflow-x-auto rail-scroll pb-4 mt-10 -mx-6 px-6 sm:mx-0 sm:px-0">
              {picks[section.key].map((p) => <SpotlightCard key={p.id} product={p} />)}
              <AddCardTile label="Add Product" to="/admin/products" className="w-56 sm:w-64 rounded-3xl" style={{ aspectRatio: '3/4' }} />
            </div>
          </Reveal>
        </div>
      ))}
    </div>
  )
}
