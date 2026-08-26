// ============================================================================
// pages/Profile.jsx — the "/profile" route: shows the logged-in user's name/
// email/initial avatar plus a grid of links (My Orders, Wishlist, etc).
// If nobody's logged in (`user` is null in ShowroomContext), redirects to
// /login instead of showing an empty profile.
//
// Several links below currently just point back to /profile itself (Saved
// Addresses, Notifications) as placeholders — those pages/features don't
// exist yet, even though the backend already has matching support (see
// backend/src/models/User.js's `addresses` array +
// backend/src/routes/userRoutes.js's /addresses and /wishlist routes, and
// backend/src/models/Notification.js). Building a real "My Addresses" page
// would follow the same pattern as Wishlist.jsx.
// ============================================================================
import { Navigate, Link } from 'react-router-dom'
import { useShowroom } from '../context/ShowroomContext'
import Button from '../components/ui/Button'

export default function Profile() {
  const { user, logout } = useShowroom()
  if (!user) return <Navigate to="/login" replace />

  return (
    <div className="max-w-2xl mx-auto px-6 py-20">
      <div className="flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-wine/10 dark:bg-gold-dark/10 grid place-items-center font-display italic text-2xl text-wine dark:text-gold-dark">
          {user.name?.[0]?.toUpperCase() || 'G'}
        </div>
        <div>
          <h1 className="font-display italic text-3xl text-ink dark:text-ivory">{user.name}</h1>
          {user.email && <p className="text-sm text-ink/50 dark:text-ivory/50">{user.email}</p>}
        </div>
      </div>

      <div className="mt-10 grid sm:grid-cols-2 gap-4">
        {[
          { label: 'My Orders', to: '/bag' },
          { label: 'Rental History', to: '/bag' },
          { label: 'Wishlist', to: '/wishlist' },
          { label: 'Saved Addresses', to: '/profile' },
          { label: 'Notifications', to: '/profile' },
          { label: 'Change Password', to: '/forgot-password' },
        ].map((item) => (
          <Link key={item.label} to={item.to} className="p-5 rounded-2xl border border-ink/10 dark:border-ivory/10 hover:border-gold dark:hover:border-gold-dark text-ink dark:text-ivory font-label text-sm tracking-wide">
            {item.label}
          </Link>
        ))}
      </div>

      <Button variant="outline" className="mt-10" onClick={logout}>Sign Out</Button>
    </div>
  )
}
