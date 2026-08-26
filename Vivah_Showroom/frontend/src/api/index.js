// ============================================================================
// api/index.js — the data-access layer. THIS is the file pages/components
// actually import from (not api/client.js directly). Every function here
// follows the same pattern:
//
//   1. If a real backend is configured (VITE_API_URL is set — see client.js),
//      try calling it via apiFetch().
//   2. If that call fails OR no backend is configured at all, silently fall
//      back to the bundled demo data from src/data/products.js.
//
// This is what makes the site fully functional standalone (see
// "Open Site.html" at the project root) AND ready to go live the moment a
// real backend/database exists — no code changes needed on this file's
// callers, just set VITE_API_URL and redeploy.
//
// WHO CALLS THIS FILE:
//   - pages/Category.jsx, pages/Product.jsx  -> fetchProductsByCategory, fetchProduct
//   - pages/Login.jsx, pages/Register.jsx    -> loginRequest, registerRequest
//   - pages/BookAppointment.jsx              -> submitAppointment
//   - pages/Contact.jsx                      -> submitContactMessage
//   - components/home/TrendingRentals.jsx    -> fetchFeatured (currently uses
//     the synchronous local getFeatured() directly — see data/products.js —
//     but could be swapped to fetchFeatured() here for live data too)
//
// CORRESPONDING BACKEND ROUTES (see backend/src/routes/):
//   fetchProductsByCategory -> GET /api/products?category=...   (productRoutes.js)
//   fetchProduct            -> GET /api/products/:id            (productRoutes.js)
//   submitAppointment       -> POST /api/appointments           (appointmentRoutes.js)
//   submitContactMessage    -> POST /api/contact                (miscRoutes.js)
//   loginRequest            -> POST /api/auth/login             (authRoutes.js)
//   registerRequest         -> POST /api/auth/register          (authRoutes.js)
// ============================================================================
import { apiFetch, isApiConfigured } from './client'
import {
  PRODUCTS, getProduct as getLocalProduct, getProductsByCategory as getLocalByCategory,
  getRelatedProducts as getLocalRelated, getFeatured as getLocalFeatured,
} from '../data/products'

// Used by pages/Category.jsx to load all products in a category.
export async function fetchProductsByCategory(slug) {
  if (isApiConfigured) {
    try {
      const { products } = await apiFetch(`/products?category=${slug}&limit=100`)
      return products
    } catch (err) {
      console.warn('Falling back to local data:', err.message) // e.g. backend is down/misconfigured
    }
  }
  return getLocalByCategory(slug)
}

// Used by pages/Product.jsx to load a single product's detail page.
export async function fetchProduct(id) {
  if (isApiConfigured) {
    try {
      const { product } = await apiFetch(`/products/${id}`)
      return product
    } catch (err) {
      console.warn('Falling back to local data:', err.message)
    }
  }
  return getLocalProduct(id)
}

// Used for the homepage's "Trending Right Now" section.
export async function fetchFeatured(count = 8) {
  if (isApiConfigured) {
    try {
      const { products } = await apiFetch(`/products?limit=${count}&sort=newest`)
      return products
    } catch (err) {
      console.warn('Falling back to local data:', err.message)
    }
  }
  return getLocalFeatured(count)
}

// Used by pages/BookAppointment.jsx's form submit handler.
// In demo mode (no backend), this just echoes the form data back — no
// appointment is actually saved anywhere.
export async function submitAppointment(payload) {
  if (isApiConfigured) return apiFetch('/appointments', { method: 'POST', body: JSON.stringify(payload) })
  return { appointment: payload } // demo-mode no-op
}

// Used by pages/Contact.jsx's form submit handler. Same demo-mode caveat as above.
export async function submitContactMessage(payload) {
  if (isApiConfigured) return apiFetch('/contact', { method: 'POST', body: JSON.stringify(payload) })
  return { message: payload }
}

// Used by pages/Login.jsx. In demo mode, ANY email/password "succeeds" and
// just logs you in locally with a fake token — there's no real password
// checking without a backend. See backend/src/controllers/authController.js
// for the real login logic (bcrypt password comparison + JWT issuing).
export async function loginRequest(email, password) {
  if (isApiConfigured) return apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
  return { user: { name: email.split('@')[0], email }, token: 'demo-token' }
}

// Used by pages/Register.jsx. Same demo-mode behavior as loginRequest above.
export async function registerRequest(payload) {
  if (isApiConfigured) return apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(payload) })
  return { user: { name: payload.name, email: payload.email }, token: 'demo-token' }
}

// ============================================================================
// Rent Now booking flow (see pages/RentBooking.jsx) + My Orders
// (pages/MyOrders.jsx). Same "real backend if configured, otherwise a local
// demo fallback" pattern as everything else in this file — in demo mode,
// orders are kept in localStorage (`vivah-orders`) so the flow is still
// fully clickable/testable without a running backend, they just aren't
// shared with any server.
// ============================================================================
function readLocalOrders() {
  try { return JSON.parse(localStorage.getItem('vivah-orders') || '[]') } catch { return [] }
}
function writeLocalOrders(orders) {
  localStorage.setItem('vivah-orders', JSON.stringify(orders))
}

// Used by pages/RentBooking.jsx's offer/coupon step.
export async function validateCouponRequest(code, orderAmount) {
  if (isApiConfigured) {
    return apiFetch('/coupons/validate', { method: 'POST', body: JSON.stringify({ code, orderAmount }) })
  }
  return { valid: false, message: 'Coupons require a live backend connection.' }
}

// Used by pages/RentBooking.jsx's "Confirm Booking" step.
export async function createOrderRequest(payload) {
  if (isApiConfigured) return apiFetch('/orders', { method: 'POST', body: JSON.stringify(payload) })
  const order = {
    _id: `demo-${Date.now()}`,
    ...payload,
    subtotal: payload.items.reduce((s, i) => s + i.price, 0),
    grandTotal: payload.items.reduce((s, i) => s + i.price, 0) - (payload.discountAmount || 0),
    paymentStatus: payload.paymentMode === 'cod' ? 'unpaid' : 'unpaid',
    status: 'pending',
    createdAt: new Date().toISOString(),
  }
  const orders = readLocalOrders()
  orders.unshift(order)
  writeLocalOrders(orders)
  return { order }
}

// Used by pages/RentBooking.jsx's payment step for UPI/QR (placeholder
// confirmation until a real payment gateway is connected — see
// backend/src/controllers/orderController.js's confirmPayment()).
export async function confirmPaymentRequest(orderId) {
  if (isApiConfigured) return apiFetch(`/orders/${orderId}/confirm-payment`, { method: 'POST' })
  const orders = readLocalOrders()
  const order = orders.find((o) => o._id === orderId)
  if (order) { order.paymentStatus = 'paid'; order.status = 'confirmed'; writeLocalOrders(orders) }
  return { order }
}

// Used by pages/MyOrders.jsx.
export async function myOrdersRequest() {
  if (isApiConfigured) return apiFetch('/orders/mine')
  return { orders: readLocalOrders() }
}

// Re-exported so a few places can still import PRODUCTS directly from
// '../api' instead of reaching into '../data/products' themselves.
export { PRODUCTS }
