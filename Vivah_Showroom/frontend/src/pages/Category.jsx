// ============================================================================
// pages/Category.jsx — the "/category/:slug" route (see App.jsx). Now only
// used by the standalone Couple Collection page — every other category
// (bride/groom/jewellery) moved to the nested hub pages (see
// pages/CategoryHub.jsx, JewelleryHub.jsx, JewelleryTypeHub.jsx) since
// those are grouped under Bride/Groom/Jewellery drill-down navigation with
// their own back buttons. This route stays as a generic
// "any category with no `hub`" page — currently that's only
// couple-collection, but it'll keep working for any future category added
// to data/categories.js without a `hub` field too.
//
// `slug` comes straight from the URL via useParams() — e.g. visiting
// "/category/couple-collection" makes slug === "couple-collection".
// getCategory() (data/categories.js) looks up that category's display
// info; if the slug doesn't match any known category, <Navigate to="/" />
// redirects home instead of showing a broken page.
// ============================================================================
import { useMemo, useState } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { ArrowLeft, SlidersHorizontal } from 'lucide-react'
import { getCategory } from '../data/categories'
import { getProductsByCategory } from '../data/products'
import ProductCard from '../components/product/ProductCard'
import SectionHeading from '../components/ui/SectionHeading'
import AddCardTile from '../components/admin/AddCardTile'

// Sort comparator functions used by Array.prototype.sort() below, keyed by
// the <select> dropdown's value.
const SORTS = {
  featured: (a, b) => 0, // no-op — keeps the catalog's natural order
  'price-asc': (a, b) => a.rentalPrice - b.rentalPrice,
  'price-desc': (a, b) => b.rentalPrice - a.rentalPrice,
  rating: (a, b) => b.rating - a.rating,
}

export default function Category() {
  const { slug } = useParams() // reads the :slug part of the current URL
  const category = getCategory(slug)
  const [sort, setSort] = useState('featured')
  const [availableOnly, setAvailableOnly] = useState(false)

  // Recomputes the filtered + sorted product list only when slug/sort/
  // availableOnly actually change (useMemo avoids re-filtering on every
  // unrelated re-render).
  const products = useMemo(() => {
    let list = getProductsByCategory(slug)
    if (availableOnly) list = list.filter((p) => p.available)
    return [...list].sort(SORTS[sort]) // spread into a new array — .sort() mutates in place otherwise
  }, [slug, sort, availableOnly])

  // Unknown/mistyped category slug in the URL -> bounce back to the homepage.
  if (!category) return <Navigate to="/" replace />

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-10 py-16">
      <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-label tracking-wider uppercase text-ink/70 dark:text-ivory/70 hover:text-gold dark:hover:text-gold-dark mb-6">
        <ArrowLeft size={14} /> Home
      </Link>

      <SectionHeading eyebrow="Collection" title={category.name} subtitle={category.blurb} align="left" />

      <div className="flex flex-wrap items-center justify-between gap-4 mt-8 mb-6">
        <p className="text-sm text-ink/50 dark:text-ivory/50">{products.length} pieces</p>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-ink/60 dark:text-ivory/60">
            <input type="checkbox" checked={availableOnly} onChange={(e) => setAvailableOnly(e.target.checked)} />
            Available now
          </label>
          <div className="flex items-center gap-2 text-xs">
            <SlidersHorizontal size={14} className="text-ink/50 dark:text-ivory/50" />
            <select value={sort} onChange={(e) => setSort(e.target.value)}
                    className="bg-transparent border border-ink/15 dark:border-ivory/15 rounded-full px-3 py-1.5 text-ink dark:text-ivory">
              <option value="featured">Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>
        </div>
      </div>

      {products.length === 0 && (
        <p className="py-6 text-center text-ink/40 dark:text-ivory/40">
          No pieces here yet — check back soon, or sign in as admin to add the first one.
        </p>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {products.map((p) => <ProductCard key={p.id} product={p} />)}
        <AddCardTile label="Add Product" to="/admin/products" className="rounded-2xl" style={{ aspectRatio: "3/4.6" }} />
      </div>
    </div>
  )
}
