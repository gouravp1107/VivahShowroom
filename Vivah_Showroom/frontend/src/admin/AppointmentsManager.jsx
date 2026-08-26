// ============================================================================
// admin/AppointmentsManager.jsx — showroom visit appointments (see
// backend/src/controllers/appointmentController.js).
// ============================================================================
import { useEffect, useState } from 'react'
import { fetchAdminAppointments, updateAppointmentStatus } from '../api/adminApi'
import { useAdmin } from '../context/AdminContext'

const STATUSES = ['pending', 'confirmed', 'completed', 'cancelled']

export default function AppointmentsManager() {
  const { forceLockOut } = useAdmin()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    try { setAppointments((await fetchAdminAppointments()).appointments) } catch (err) {
      if (err.status === 423) return forceLockOut(err.message)
      setError(err.message)
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  async function changeStatus(a, status) {
    try { await updateAppointmentStatus(a._id, status); load() } catch (err) {
      if (err.status === 423) return forceLockOut(err.message)
      setError(err.message)
    }
  }

  return (
    <div>
      <h1 className="font-display italic text-3xl text-ink dark:text-ivory">Appointments</h1>
      <p className="text-sm text-ink/50 dark:text-ivory/50 mt-1">Showroom visit requests.</p>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6 rounded-2xl border border-ink/10 dark:border-ivory/10 overflow-hidden bg-ivory dark:bg-charcoal">
        {loading ? <p className="p-6 text-sm text-ink/40 dark:text-ivory/40">Loading…</p> : appointments.length === 0 ? (
          <p className="p-6 text-sm text-ink/40 dark:text-ivory/40">No appointments yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-ink/40 dark:text-ivory/40 text-xs uppercase border-b border-ink/10 dark:border-ivory/10">
              <tr><th className="p-4">Name</th><th className="p-4">Contact</th><th className="p-4">Preferred Date</th><th className="p-4">Status</th></tr>
            </thead>
            <tbody>
              {appointments.map((a) => (
                <tr key={a._id} className="border-b border-ink/5 dark:border-ivory/5 last:border-0">
                  <td className="p-4 text-ink dark:text-ivory">{a.name}</td>
                  <td className="p-4 text-ink/60 dark:text-ivory/60">{a.phone}<br />{a.email}</td>
                  <td className="p-4 text-ink/60 dark:text-ivory/60">{a.preferredDate}</td>
                  <td className="p-4">
                    <select value={a.status} onChange={(e) => changeStatus(a, e.target.value)}
                            className="text-xs px-2 py-1 rounded-full border border-ink/20 dark:border-ivory/20 bg-transparent text-ink dark:text-ivory">
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
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
