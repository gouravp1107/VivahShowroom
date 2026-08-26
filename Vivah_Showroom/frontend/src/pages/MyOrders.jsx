// ============================================================================
// pages/MyOrders.jsx — the "/orders" route (see App.jsx). Every booking the
// logged-in customer has placed through the Rent Now flow (see
// pages/RentBooking.jsx -> api/index.js's myOrdersRequest() ->
// GET /api/orders/mine).
// ============================================================================
import { useEffect, useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { Package } from 'lucide-react'
import { myOrdersRequest } from '../api'
import { useShowroom } from '../context/ShowroomContext'

const STATUS_LABEL = {
  pending: 'Pending', confirmed: 'Confirmed', processing: 'Processing',
  out_for_delivery: 'Out for delivery', delivered: 'Delivered',
  return_due: 'Return due', returned: 'Returned', cancelled: 'Cancelled',
}

export default function MyOrders() {
  const { user } = useShowroom()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    myOrdersRequest().then((d) => setOrders(d.orders || [])).finally(() => setLoading(false))
  }, [user])

  if (!user) return <Navigate to="/login" replace />

  return (
    <div className="max-w-4xl mx-auto px-6 sm:px-10 py-14">
      <h1 className="font-display italic text-3xl text-ink dark:text-ivory">My Orders</h1>
      <p className="text-sm text-ink/50 dark:text-ivory/50 mt-1">Everything you've booked with Vivah Showroom.</p>

      {loading ? (
        <p className="mt-10 text-sm text-ink/40 dark:text-ivory/40">Loading…</p>
      ) : orders.length === 0 ? (
        <div className="mt-14 text-center">
          <Package size={36} className="mx-auto text-ink/20 dark:text-ivory/20" />
          <p className="mt-3 text-ink/50 dark:text-ivory/50 text-sm">No bookings yet.</p>
          <Link to="/" className="inline-block mt-4 text-sm text-wine dark:text-gold-dark underline">Browse the collection</Link>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {orders.map((o) => (
            <div key={o._id} className="p-5 rounded-2xl border border-ink/10 dark:border-ivory/10 bg-ivory dark:bg-charcoal">
              <div className="flex flex-wrap justify-between gap-2">
                <span className="text-xs text-ink/40 dark:text-ivory/40">Order #{o._id.slice(-8)} · {new Date(o.createdAt).toLocaleDateString()}</span>
                <span className="text-xs font-label uppercase tracking-wide px-2.5 py-1 rounded-full bg-wine/10 text-wine dark:bg-gold-dark/10 dark:text-gold-dark">
                  {STATUS_LABEL[o.status] || o.status}
                </span>
              </div>
              <div className="mt-3 space-y-2">
                {o.items?.map((it, i) => (
                  <div key={i} className="flex justify-between text-sm text-ink dark:text-ivory">
                    <span>{it.product?.name || 'Item'} · Size {it.size} · {it.noOfDays} day{it.noOfDays === 1 ? '' : 's'}</span>
                    <span>₹{it.price}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-ink/10 dark:border-ivory/10 flex justify-between text-sm">
                <span className="text-ink/60 dark:text-ivory/60 uppercase text-xs">{o.paymentMode} · {o.paymentStatus}</span>
                <span className="font-display text-lg text-wine dark:text-gold-dark">₹{o.grandTotal?.toLocaleString('en-IN')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
