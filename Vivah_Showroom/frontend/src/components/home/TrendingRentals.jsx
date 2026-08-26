// ============================================================================
// components/home/TrendingRentals.jsx — the "Trending Right Now" product
// grid on the homepage. getFeatured(12) (see data/products.js) picks 12
// products spread evenly across all categories, then each renders as a
// ProductCard (components/product/ProductCard.jsx). A "Show All Trending"
// button links to pages/Trending.jsx, a dedicated page with a much larger
// trending selection for anyone who wants to keep browsing past the
// homepage's 12. Currently reads directly from the local demo catalog
// rather than going through src/api/index.js's fetchFeatured() — swap to
// that if you want this section to reflect live backend data once one is
// connected.
//
// CARD SIZE: uses ProductCard's own default sizing (no custom imageAspect
// override anymore) — per a mobile-view follow-up, ProductCard's shared
// default grew taller/less-rounded/Rent-Now-moved-into-text-area across
// the WHOLE site, so this section no longer needs its own one-off
// "slightly taller than everyone else" treatment; it now matches every
// other product grid exactly. gap-4 on mobile (was gap-6) gives the 2
// columns a bit more width each on small screens.
// ============================================================================
import { getFeatured } from '../../data/products'
import SectionHeading from '../ui/SectionHeading'
import ProductCard from '../product/ProductCard'
import Button from '../ui/Button'
import AddCardTile from '../admin/AddCardTile'

export default function TrendingRentals() {
  const products = getFeatured(12)
  return (
    <section className="py-24 px-6 sm:px-10 max-w-7xl mx-auto">
      <SectionHeading eyebrow="Most Rented This Season" title="Trending Right Now" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mt-12">
        {products.map((p) => <ProductCard key={p.id} product={p} />)}
        <AddCardTile label="Add Product" to="/admin/products" className="rounded-2xl" style={{ aspectRatio: '3/4.6' }} />
      </div>
      <div className="flex justify-center mt-12">
        <Button to="/trending" variant="outline">Show All Trending</Button>
      </div>
    </section>
  )
}
