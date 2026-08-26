// ============================================================================
// admin/Dashboard.jsx — GET /api/admin/dashboard at-a-glance stats (see
// controllers/adminController.js's dashboardStats()).
// ============================================================================
import { useEffect, useState } from 'react'
import { Users, Shirt, Package, CalendarClock, MessageSquare, IndianRupee } from 'lucide-react'
import { fetchDashboard, fetchInventorySummary, fetchInventory } from '../api/adminApi'
import { useAdmin } from '../context/AdminContext'

const ICONS = { customers: Users, products: Shirt, orders: Package, pendingAppointments: CalendarClock, unreadMessages: MessageSquare, revenue: IndianRupee }
const LABELS = { customers: 'Customers', products: 'Products', orders: 'Orders', pendingAppointments: 'Pending Appointments', unreadMessages: 'Unread Messages', revenue: 'Revenue' }

export default function Dashboard() {
  const { forceLockOut } = useAdmin()
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')
  const [inventory, setInventory] = useState(null)
  const [lowStock, setLowStock] = useState([])

  useEffect(() => {
    Promise.all([fetchDashboard(), fetchInventorySummary(), fetchInventory('?lowStock=1')])
      .then(([dashboard, inv, low]) => {
        setStats(dashboard.stats || dashboard)
        setInventory(inv)
        setLowStock(low.inventory || [])
      })
      .catch((err) => {
        if (err.status === 423) return forceLockOut(err.message)
        setError(err.message)
      })
  }, [forceLockOut])

  return (
    <div>
      <h1 className="font-display italic text-3xl text-ink dark:text-ivory">Dashboard</h1>
      <p className="text-sm text-ink/50 dark:text-ivory/50 mt-1">A quick look at how the showroom is doing.</p>

      {error && <p className="mt-6 text-sm text-red-600">{error}</p>}

      {stats && (
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(LABELS).map(([key, label]) => {
            const Icon = ICONS[key]
            const value = stats[key]
            if (value === undefined) return null
            return (
              <div key={key} className="p-5 rounded-2xl bg-ivory dark:bg-charcoal border border-ink/10 dark:border-ivory/10">
                <div className="flex items-center gap-2 text-ink/50 dark:text-ivory/50 text-xs font-label tracking-wide uppercase">
                  <Icon size={14} /> {label}
                </div>
                <p className="mt-2 font-display text-3xl text-ink dark:text-ivory">
                  {key === 'revenue' ? `₹${Number(value).toLocaleString('en-IN')}` : value}
                </p>
              </div>
            )
          })}
        </div>
      )}


      {inventory && (
        <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            ['Inventory units', inventory.totalUnits],
            ['Reserved / rented', inventory.reservedUnits],
            ['Available', inventory.availableUnits],
            ['Low stock items', inventory.lowStockCount],
          ].map(([label, value]) => (
            <div key={label} className="p-5 rounded-2xl bg-ivory dark:bg-charcoal border border-ink/10 dark:border-ivory/10">
              <p className="text-[11px] uppercase tracking-wide text-ink/45 dark:text-ivory/45">{label}</p>
              <p className="mt-2 font-display text-3xl text-ink dark:text-ivory">{value}</p>
            </div>
          ))}
        </div>
      )}

      {lowStock.length > 0 && (
        <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/5 overflow-hidden">
          <div className="p-4 border-b border-amber-500/15 flex items-center justify-between">
            <div><h2 className="font-medium text-ink dark:text-ivory">Low stock alerts</h2><p className="text-xs text-ink/50 dark:text-ivory/50 mt-1">Items at or below their configured threshold.</p></div>
            <a href="#/admin/inventory" className="text-xs text-wine dark:text-gold-dark">Manage inventory →</a>
          </div>
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="text-left text-xs uppercase text-ink/40 dark:text-ivory/40"><tr><th className="p-4">Product</th><th className="p-4">Available</th><th className="p-4">Threshold</th></tr></thead><tbody>{lowStock.slice(0, 8).map((item) => <tr key={item.id} className="border-t border-amber-500/10"><td className="p-4 text-ink dark:text-ivory">{item.product?.name || 'Deleted product'}</td><td className="p-4 text-amber-600">{item.availableUnits}</td><td className="p-4 text-ink/60 dark:text-ivory/60">{item.lowStockThreshold}</td></tr>)}</tbody></table></div>
        </div>
      )}
    </div>
  )
}
