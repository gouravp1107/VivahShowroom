// ============================================================================
// admin/MessagesManager.jsx — contact form submissions (see
// backend/src/controllers/miscController.js's listMessages()).
// ============================================================================
import { useEffect, useState } from 'react'
import { fetchAdminMessages } from '../api/adminApi'
import { useAdmin } from '../context/AdminContext'

export default function MessagesManager() {
  const { forceLockOut } = useAdmin()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchAdminMessages()
      .then((d) => setMessages(d.messages))
      .catch((err) => {
        if (err.status === 423) return forceLockOut(err.message)
        setError(err.message)
      })
      .finally(() => setLoading(false))
  }, [forceLockOut])

  return (
    <div>
      <h1 className="font-display italic text-3xl text-ink dark:text-ivory">Messages</h1>
      <p className="text-sm text-ink/50 dark:text-ivory/50 mt-1">Contact form submissions from the site.</p>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6 space-y-3">
        {loading ? <p className="text-sm text-ink/40 dark:text-ivory/40">Loading…</p> : messages.length === 0 ? (
          <p className="text-sm text-ink/40 dark:text-ivory/40">No messages yet.</p>
        ) : messages.map((m) => (
          <div key={m._id} className="p-5 rounded-2xl bg-ivory dark:bg-charcoal border border-ink/10 dark:border-ivory/10">
            <div className="flex justify-between text-sm">
              <span className="text-ink dark:text-ivory font-medium">{m.name}</span>
              <span className="text-ink/40 dark:text-ivory/40 text-xs">{new Date(m.createdAt).toLocaleDateString()}</span>
            </div>
            <p className="text-xs text-ink/40 dark:text-ivory/40">{m.email} · {m.phone}</p>
            <p className="mt-2 text-sm text-ink/70 dark:text-ivory/70">{m.message}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
