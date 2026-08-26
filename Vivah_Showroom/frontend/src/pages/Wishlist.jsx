// ============================================================================
// pages/Wishlist.jsx — the "/wishlist" route. Reads the `wishlist` array of
// product IDs from ShowroomContext.jsx (populated by clicking heart icons
// on ProductCard.jsx or the product detail page), then filters the full
// PRODUCTS catalog (data/products.js) down to just those IDs. Purely
// derived from existing state — this page has no state of its own.
// ============================================================================
import { Link } from 'react-router-dom'
import { useShowroom } from '../context/ShowroomContext'
import { PRODUCTS } from '../data/products'
import ProductCard from '../components/product/ProductCard'
import Button from '../components/ui/Button'

export default function Wishlist() {
  const { wishlist } = useShowroom()
  const items = PRODUCTS.filter((p) => wishlist.includes(p.id))

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-10 py-16">
      <h1 className="font-display italic text-4xl text-ink dark:text-ivory">Your Wishlist</h1>
      {items.length === 0 ? (
        <div className="mt-10 text-center py-20">
          <p className="text-ink/50 dark:text-ivory/50">Nothing saved yet — tap the heart on any piece to add it here.</p>
          <Button to="/" className="mt-6">Browse the Showroom</Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-10">
          {items.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  )
}
