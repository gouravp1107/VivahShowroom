// ============================================================================
// admin/AdminApp.jsx — the /admin route tree, mounted from App.jsx as a
// completely separate branch from the public site (no shared Navbar/Footer).
//   /admin/login    -> AdminLogin (public — but linked from nowhere else)
//   /admin/register -> AdminRegister (new-owner takeover, needs ADMIN_SETUP_KEY)
//   /admin/*        -> everything else, behind AdminGuard + AdminLayout
// ============================================================================
import { Routes, Route, Navigate } from 'react-router-dom'
import AdminLogin from './AdminLogin'
import AdminRegister from './AdminRegister'
import AdminGuard from './components/AdminGuard'
import AdminLayout from './components/AdminLayout'
import Dashboard from './Dashboard'
import ProductsManager from './ProductsManager'
import InventoryManager from './InventoryManager'
import CategoriesManager from './CategoriesManager'
import MediaLibrary from './MediaLibrary'
import BannersManager from './BannersManager'
import GalleryManager from './GalleryManager'
import CouponsManager from './CouponsManager'
import OrdersManager from './OrdersManager'
import AppointmentsManager from './AppointmentsManager'
import MessagesManager from './MessagesManager'
import CustomersManager from './CustomersManager'

export default function AdminApp() {
  return (
    <Routes>
      <Route path="login" element={<AdminLogin />} />
      <Route path="register" element={<AdminRegister />} />

      <Route
        element={
          <AdminGuard>
            <AdminLayout />
          </AdminGuard>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="products" element={<ProductsManager />} />
        <Route path="inventory" element={<InventoryManager />} />
        <Route path="categories" element={<CategoriesManager />} />
        <Route path="media" element={<MediaLibrary />} />
        <Route path="banners" element={<BannersManager />} />
        <Route path="gallery" element={<GalleryManager />} />
        <Route path="coupons" element={<CouponsManager />} />
        <Route path="orders" element={<OrdersManager />} />
        <Route path="appointments" element={<AppointmentsManager />} />
        <Route path="messages" element={<MessagesManager />} />
        <Route path="customers" element={<CustomersManager />} />
      </Route>
    </Routes>
  )
}
