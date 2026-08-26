// ============================================================================
// admin/OrdersManager.jsx — every rental booking placed through the Rent
// Now flow (see backend/src/controllers/orderController.js's
// listAllOrders()/updateOrderStatus()). Lets the admin move an order
// through its lifecycle (pending -> confirmed -> out-for-delivery ->
// returned, etc — whatever statuses your Order model defines).
// ============================================================================
import { useEffect, useState } from 'react'
import { fetchAdminOrders, updateOrderStatus } from '../api/adminApi'
import { useAdmin } from '../context/AdminContext'

const STATUSES = ['pending', 'confirmed', 'trial_scheduled', 'out_for_delivery', 'in_use', 'return_due', 'returned', 'cancelled']

export default function OrdersManager() {
  const { forceLockOut } = useAdmin()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    try { setOrders((await fetchAdminOrders()).orders) } catch (err) {
      if (err.status === 423) return forceLockOut(err.message)
      setError(err.message)
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  async function changeStatus(order, status) {
    try { await updateOrderStatus(order._id, status); load() } catch (err) {
      if (err.status === 423) return forceLockOut(err.message)
      setError(err.message)
    }
  }

  return (
    <div>
      <h1 className="font-display italic text-3xl text-ink dark:text-ivory">Orders</h1>
      <p className="text-sm text-ink/50 dark:text-ivory/50 mt-1">Every rental booking placed on the site.</p>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6 rounded-2xl border border-ink/10 dark:border-ivory/10 overflow-hidden bg-ivory dark:bg-charcoal">
        {loading ? <p className="p-6 text-sm text-ink/40 dark:text-ivory/40">Loading…</p> : orders.length === 0 ? (
          <p className="p-6 text-sm text-ink/40 dark:text-ivory/40">No orders yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-ink/40 dark:text-ivory/40 text-xs uppercase border-b border-ink/10 dark:border-ivory/10">
              <tr><th className="p-4">Customer</th><th className="p-4">Items</th><th className="p-4">Total</th><th className="p-4">Payment</th><th className="p-4">Status</th></tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o._id} className="border-b border-ink/5 dark:border-ivory/5 last:border-0 align-top">
                  <td className="p-4 text-ink dark:text-ivory">{o.user?.name}<br /><span className="text-xs text-ink/40 dark:text-ivory/40">{o.user?.email}</span></td>
                  <td className="p-4 text-ink/60 dark:text-ivory/60">
                    {o.items?.map((it, i) => <div key={i}>{it.product?.name} · {it.size} · {it.noOfDays}d</div>)}
                  </td>
                  <td className="p-4 text-ink/60 dark:text-ivory/60">₹{o.grandTotal}{o.discountAmount ? <span className="block text-xs text-green-600">-₹{o.discountAmount} ({o.couponCode})</span> : null}</td>
                  <td className="p-4 text-ink/60 dark:text-ivory/60 uppercase text-xs">{o.paymentMode} · {o.paymentStatus}</td>
                  <td className="p-4">
                    <select value={o.status} onChange={(e) => changeStatus(o, e.target.value)}
                            className="text-xs px-2 py-1 rounded-full border border-ink/20 dark:border-ivory/20 bg-transparent text-ink dark:text-ivory">
                      {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
