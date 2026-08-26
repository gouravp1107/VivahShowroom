// ============================================================================
// admin/CustomersManager.jsx — read-only customer list (see
// backend/src/controllers/adminController.js's listCustomers()).
// ============================================================================
import { useEffect, useState } from 'react'
import { fetchCustomers } from '../api/adminApi'
import { useAdmin } from '../context/AdminContext'

export default function CustomersManager() {
  const { forceLockOut } = useAdmin()
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchCustomers()
      .then((d) => setCustomers(d.customers))
      .catch((err) => {
        if (err.status === 423) return forceLockOut(err.message)
        setError(err.message)
      })
      .finally(() => setLoading(false))
  }, [forceLockOut])

  return (
    <div>
      <h1 className="font-display italic text-3xl text-ink dark:text-ivory">Customers</h1>
      <p className="text-sm text-ink/50 dark:text-ivory/50 mt-1">Everyone registered on the site.</p>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6 rounded-2xl border border-ink/10 dark:border-ivory/10 overflow-hidden bg-ivory dark:bg-charcoal">
        {loading ? <p className="p-6 text-sm text-ink/40 dark:text-ivory/40">Loading…</p> : (
          <table className="w-full text-sm">
            <thead className="text-left text-ink/40 dark:text-ivory/40 text-xs uppercase border-b border-ink/10 dark:border-ivory/10">
              <tr><th className="p-4">Name</th><th className="p-4">Email</th><th className="p-4">Joined</th></tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c._id} className="border-b border-ink/5 dark:border-ivory/5 last:border-0">
                  <td className="p-4 text-ink dark:text-ivory">{c.name}</td>
                  <td className="p-4 text-ink/60 dark:text-ivory/60">{c.email}</td>
                  <td className="p-4 text-ink/40 dark:text-ivory/40">{new Date(c.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
