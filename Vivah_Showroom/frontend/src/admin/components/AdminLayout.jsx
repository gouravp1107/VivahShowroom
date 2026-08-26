// ============================================================================
// admin/components/AdminLayout.jsx — the sidebar + top bar shell every
// admin screen renders inside (Dashboard, ProductsManager, etc — see
// admin/App.jsx's route table). Intentionally its own separate visual
// system from the public site's Navbar/Footer (see App.jsx), so nothing
// here touches the public frontend's design per the "do not redesign the
// public site" rule.
// ============================================================================
import { NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard, Shirt, Boxes, FolderTree, Image, GalleryHorizontal, Ticket,
  Package, CalendarCheck, MessageSquare, Users, LogOut, ExternalLink,
} from 'lucide-react'
import { useAdmin } from '../../context/AdminContext'

const NAV = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/products', label: 'Products / Rentals', icon: Shirt },
  { to: '/admin/inventory', label: 'Inventory', icon: Boxes },
  { to: '/admin/categories', label: 'Categories', icon: FolderTree },
  { to: '/admin/media', label: 'Media Library', icon: Image },
  { to: '/admin/banners', label: 'Banners / Hero', icon: GalleryHorizontal },
  { to: '/admin/gallery', label: 'Gallery / Lookbook', icon: GalleryHorizontal },
  { to: '/admin/coupons', label: 'Offers / Coupons', icon: Ticket },
  { to: '/admin/orders', label: 'Orders', icon: Package },
  { to: '/admin/appointments', label: 'Appointments', icon: CalendarCheck },
  { to: '/admin/messages', label: 'Messages', icon: MessageSquare },
  { to: '/admin/customers', label: 'Customers', icon: Users },
]

export default function AdminLayout() {
  const { admin, logout } = useAdmin()

  return (
    <div className="min-h-screen flex bg-blush/20 dark:bg-noir">
      <aside className="w-64 shrink-0 hidden md:flex flex-col bg-ivory dark:bg-charcoal border-r border-ink/10 dark:border-ivory/10">
        <div className="px-6 py-6 border-b border-ink/10 dark:border-ivory/10">
          <p className="font-display italic text-xl text-ink dark:text-ivory">Vivah Admin</p>
          <p className="text-xs text-ink/40 dark:text-ivory/40 mt-0.5 truncate">{admin?.email}</p>
        </div>
        <nav className="flex-1 py-4 overflow-y-auto">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-6 py-2.5 text-sm ${isActive ? 'text-wine dark:text-gold-dark bg-wine/5 dark:bg-gold-dark/10 font-medium' : 'text-ink/60 dark:text-ivory/60 hover:text-ink dark:hover:text-ivory'}`
              }
            >
              <Icon size={16} /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-ink/10 dark:border-ivory/10 space-y-2">
          <a href="#/" className="flex items-center gap-2 px-2 py-2 text-xs text-ink/50 dark:text-ivory/50 hover:text-ink dark:hover:text-ivory">
            <ExternalLink size={14} /> View public site
          </a>
          <button onClick={logout} className="w-full flex items-center gap-2 px-2 py-2 text-xs text-red-600 hover:text-red-700">
            <LogOut size={14} /> Log out (unlocks admin login)
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 p-5 sm:p-8">
        <Outlet />
      </main>
    </div>
  )
}
