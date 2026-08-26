// ============================================================================
// pages/Trending.jsx — the "/trending" route: "Show All Trending" from the
// homepage's TrendingRentals section (components/home/TrendingRentals.jsx)
// links here. Same getFeatured() sampling function as the homepage section,
// just asked for a much larger count (48 instead of 12) so this page has
// real depth to browse rather than repeating the homepage's short list.
// ============================================================================
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { getFeatured } from '../data/products'
import ProductCard from '../components/product/ProductCard'
import SectionHeading from '../components/ui/SectionHeading'
import AddCardTile from '../components/admin/AddCardTile'

export default function Trending() {
  const products = getFeatured(48)

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-10 py-16">
      <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-label tracking-wider uppercase text-ink/70 dark:text-ivory/70 hover:text-gold dark:hover:text-gold-dark mb-6">
        <ArrowLeft size={14} /> Home
      </Link>

      <SectionHeading eyebrow="Most Rented This Season" title="All Trending Rentals" subtitle={`${products.length} pieces our customers are booking right now, across every category.`} align="left" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mt-10">
        {products.map((p) => <ProductCard key={p.id} product={p} />)}
          <AddCardTile label="Add Product" to="/admin/products" className="rounded-2xl" style={{ aspectRatio: "3/4.6" }} />
      </div>
    </div>
  )
}
