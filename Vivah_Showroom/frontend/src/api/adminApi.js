// ============================================================================
// api/adminApi.js — every backend call the admin panel makes, grouped by
// resource. Thin wrappers around adminFetch()/adminUploadFetch() (see
// adminClient.js) — this file is what admin/*.jsx components actually import.
// ============================================================================
import { adminFetch, adminUploadFetch } from './adminClient'

// --- Auth / session lock (dual-OTP admin sign-in — see backend
// controllers/authController.js's adminLoginInit/adminVerifyOtp/adminResendOtp) ---
export const adminLockStatus = () => adminFetch('/auth/admin-lock-status')
export const adminLoginInit = (email, password) =>
  adminFetch('/auth/admin-login/init', { method: 'POST', body: JSON.stringify({ email, password }) })
export const adminVerifyOtp = (challengeId, phoneOtp, emailOtp) =>
  adminFetch('/auth/admin-login/verify', { method: 'POST', body: JSON.stringify({ challengeId, phoneOtp, emailOtp }) })
export const adminResendOtp = (challengeId, channel) =>
  adminFetch('/auth/admin-login/resend', { method: 'POST', body: JSON.stringify({ challengeId, channel }) })
export const adminRegister = (payload) =>
  adminFetch('/auth/admin-register', { method: 'POST', body: JSON.stringify(payload) })
export const adminLogout = () => adminFetch('/auth/admin-logout', { method: 'POST' })
export const adminMe = () => adminFetch('/auth/me')

// --- Dashboard / customers ---
export const fetchDashboard = () => adminFetch('/admin/dashboard')
export const fetchCustomers = () => adminFetch('/admin/customers')

// --- Inventory (PostgreSQL / Prisma, Utsav-style owner dashboard) ---
export const fetchInventory = (params = '') => adminFetch(`/inventory${params}`)
export const fetchInventorySummary = () => adminFetch('/inventory/summary')
export const fetchInventoryItem = (productId) => adminFetch(`/inventory/${productId}`)
export const fetchInventoryHistory = (productId, limit = 100) => adminFetch(`/inventory/${productId}/history?limit=${limit}`)
export const createInventory = (payload) => adminFetch('/inventory', { method: 'POST', body: JSON.stringify(payload) })
export const updateInventory = (productId, payload) => adminFetch(`/inventory/${productId}`, { method: 'PUT', body: JSON.stringify(payload) })
export const adjustInventory = (productId, field, delta, reason) => adminFetch(`/inventory/${productId}/adjust`, { method: 'PATCH', body: JSON.stringify({ field, delta, reason }) })
export const deleteInventory = (productId, reason) => adminFetch(`/inventory/${productId}`, { method: 'DELETE', body: JSON.stringify({ reason }) })

// --- Products ---
export const fetchAdminProducts = (params = '') => adminFetch(`/admin/products${params}`)
export const createProduct = (payload) => adminFetch('/products', { method: 'POST', body: JSON.stringify(payload) })
export const updateProduct = (id, payload) => adminFetch(`/products/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
export const updateProductStock = (id, payload) => adminFetch(`/products/${id}/stock`, { method: 'PUT', body: JSON.stringify(payload) })
export const deleteProduct = (id) => adminFetch(`/products/${id}`, { method: 'DELETE' })

// --- Categories ---
export const fetchAdminCategories = () => adminFetch('/admin/categories')
export const createCategory = (payload) => adminFetch('/categories', { method: 'POST', body: JSON.stringify(payload) })
export const updateCategory = (id, payload) => adminFetch(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
export const deleteCategory = (id) => adminFetch(`/categories/${id}`, { method: 'DELETE' })

// --- Banners ---
export const fetchAdminBanners = () => adminFetch('/admin/banners')
export const createBanner = (payload) => adminFetch('/banners', { method: 'POST', body: JSON.stringify(payload) })
export const updateBanner = (id, payload) => adminFetch(`/banners/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
export const deleteBanner = (id) => adminFetch(`/banners/${id}`, { method: 'DELETE' })

// --- Gallery ---
export const fetchAdminGallery = () => adminFetch('/admin/gallery')
export const createGalleryImage = (payload) => adminFetch('/gallery', { method: 'POST', body: JSON.stringify(payload) })
export const updateGalleryImage = (id, payload) => adminFetch(`/gallery/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
export const deleteGalleryImage = (id) => adminFetch(`/gallery/${id}`, { method: 'DELETE' })

// --- Coupons ---
export const fetchAdminCoupons = () => adminFetch('/coupons/admin')
export const createCoupon = (payload) => adminFetch('/coupons', { method: 'POST', body: JSON.stringify(payload) })
export const updateCoupon = (id, payload) => adminFetch(`/coupons/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
export const deleteCoupon = (id) => adminFetch(`/coupons/${id}`, { method: 'DELETE' })

// --- Orders / Appointments / Messages ---
export const fetchAdminOrders = (params = '') => adminFetch(`/orders${params}`)
export const updateOrderStatus = (id, status) => adminFetch(`/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) })
export const fetchAdminAppointments = () => adminFetch('/appointments')
export const updateAppointmentStatus = (id, status) => adminFetch(`/appointments/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) })
export const fetchAdminMessages = () => adminFetch('/contact')

// --- Media Library (Drive-like image upload/browse/delete) ---
export const fetchMedia = (params = '') => adminFetch(`/media${params}`)
export const uploadImage = (file, usedIn) => {
  const formData = new FormData()
  formData.append('image', file)
  if (usedIn) formData.append('usedIn', usedIn)
  return adminUploadFetch('/media/upload', formData)
}
export const deleteMedia = (id) => adminFetch(`/media/${id}`, { method: 'DELETE' })
