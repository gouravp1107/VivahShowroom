// ============================================================================
// pages/JewelleryHub.jsx — the "/jewellery" landing page. This is the TOP
// of the jewellery section, one level above JewelleryTypeHub.jsx (which
// handles /jewellery/bride and /jewellery/groom).
//
// Shows exactly two big buttons — Bridal Jewellery / Groom Jewellery — via
// HubHeader (reusing the same tab-bar component every other hub page uses,
// just with two "tabs" that are really more like two big entry points).
// Below that, by default (before picking a side), it shows a MIXED grid
// combining every bridal AND groom jewellery product together — a "browse
// everything" view for visitors who don't know which side they want yet.
//
// getProductsByCategory('bridal-jewellery') / ('groom-jewellery') pulls
// each side's full "Trending" category (see data/categories.js — those two
// slugs are marked isTrending: true and cover the FULL, unsliced photo
// range for each side) rather than every type-specific sub-category, so
// this mixed view doesn't show heavy duplication of the same photos
// appearing under their type tabs too.
// ============================================================================
import { getProductsByCategory } from '../data/products'
import ProductCard from '../components/product/ProductCard'
import HubHeader from '../components/layout/HubHeader'
import SectionHeading from '../components/ui/SectionHeading'

export default function JewelleryHub() {
  const mixed = [
    ...getProductsByCategory('bridal-jewellery'),
    ...getProductsByCategory('groom-jewellery'),
  ]

  const tabs = [
    { label: 'Bridal Jewellery', to: '/jewellery/bride' },
    { label: 'Groom Jewellery', to: '/jewellery/groom' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-10">
      <HubHeader tabs={tabs} activeTo={null} backTo="/" backLabel="Home" />

      <div className="py-10">
        <SectionHeading
          eyebrow="Jewellery"
          title="The Full Jewellery Edit"
          subtitle="Bridal and groom pieces together — choose a side above to browse by type, or explore everything here."
          align="left"
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-10">
          {mixed.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </div>
    </div>
  )
}
