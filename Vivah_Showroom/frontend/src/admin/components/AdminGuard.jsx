// ============================================================================
// admin/components/AdminGuard.jsx — wraps every /admin/* route except
// /admin/login and /admin/register. Redirects to the login screen if
// nobody's signed in, and re-verifies the stored token once on mount so a
// session that ended elsewhere (another admin logged in, this one expired)
// is caught immediately rather than on the next failed CRUD call.
// ============================================================================
import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAdmin } from '../../context/AdminContext'

export default function AdminGuard({ children }) {
  const { admin, verifySession } = useAdmin()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    verifySession().finally(() => setChecked(true))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!checked) {
    return <div className="min-h-screen grid place-items-center text-ink/40 dark:text-ivory/40 text-sm">Checking admin session…</div>
  }
  if (!admin) return <Navigate to="/admin/login" replace />
  return children
}
