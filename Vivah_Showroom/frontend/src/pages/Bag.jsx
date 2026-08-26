// ============================================================================
// pages/Bag.jsx — the "/bag" route: the customer's rental cart. Each entry
// in ShowroomContext's `bag` array (added via addToBag() when someone clicks
// "Reserve This Piece" on pages/Product.jsx) only stores a productId + the
// chosen size/duration/date/price — this page re-looks-up the full product
// details (image, name) via getProduct() from data/products.js for display.
//
// "Proceed to Reservation" is currently a dead-end button (no onClick) —
// wiring real checkout would mean calling POST /api/orders (see
// backend/src/controllers/orderController.js -> createOrder(), which
// expects roughly this same { product, size, duration, price } shape per
// item) and then clearing the local bag on success.
// ============================================================================
import { Link } from 'react-router-dom'
import { X } from 'lucide-react'
import { useShowroom } from '../context/ShowroomContext'
import { getProduct } from '../data/products'
import Button from '../components/ui/Button'

export default function Bag() {
  const { bag, removeFromBag } = useShowroom()
  const total = bag.reduce((sum, item) => sum + (item.price || 0), 0)

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="font-display italic text-4xl text-ink dark:text-ivory">Your Rental Bag</h1>
      {bag.length === 0 ? (
        <div className="mt-10 text-center py-20">
          <p className="text-ink/50 dark:text-ivory/50">Your rental bag is empty.</p>
          <Button to="/" className="mt-6">Browse the Showroom</Button>
        </div>
      ) : (
        <>
          <div className="mt-10 divide-y divide-ink/10 dark:divide-ivory/10">
            {bag.map((item, i) => {
              const product = getProduct(item.productId)
              if (!product) return null
              return (
                <div key={i} className="flex items-center gap-4 py-5">
                  <img src={product.image} alt={product.name} className="w-20 h-24 rounded-xl object-cover" />
                  <div className="flex-1">
                    <Link to={`/product/${product.id}`} className="font-display italic text-lg text-ink dark:text-ivory">{product.name}</Link>
                    <p className="text-xs text-ink/50 dark:text-ivory/50">Size {item.size} · {item.duration}{item.date ? ` · Event: ${item.date}` : ''}</p>
                  </div>
                  <span className="text-sm font-medium text-wine dark:text-gold-dark">₹{(item.price || 0).toLocaleString('en-IN')}</span>
                  <button onClick={() => removeFromBag(i)} aria-label="Remove"><X size={16} className="text-ink/40 hover:text-red-600" /></button>
                </div>
              )
            })}
          </div>
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-ink/10 dark:border-ivory/10">
            <span className="font-label uppercase text-xs tracking-wider text-ink dark:text-ivory">Estimated Total</span>
            <span className="font-display text-2xl text-wine dark:text-gold-dark">₹{total.toLocaleString('en-IN')}</span>
          </div>
          <Button className="w-full mt-6">Proceed to Reservation</Button>
        </>
      )}
    </div>
  )
}
