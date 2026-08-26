// ============================================================================
// api/adminClient.js — the admin panel's equivalent of api/client.js, kept
// completely separate on purpose:
//   - Uses its OWN localStorage token key (`vivah-admin-token`), never mixed
//     with the customer `vivah-token` — so a customer being logged in never
//     grants admin API access and vice versa (see context/AdminContext.jsx).
//   - Understands multipart/FormData uploads (for image fields), which
//     api/client.js doesn't need.
//   - Surfaces the backend's 423 "admin session ended/locked" responses as
//     a distinguishable error code so AdminContext.jsx can react (bounce to
//     the lock screen) instead of just showing a generic error.
// ============================================================================
const BASE_URL = import.meta.env.VITE_API_URL || ''

export function getAdminToken() {
  return localStorage.getItem('vivah-admin-token')
}

export function setAdminToken(token) {
  if (token) localStorage.setItem('vivah-admin-token', token)
  else localStorage.removeItem('vivah-admin-token')
}

// JSON request helper — used by every admin CRUD call (products, categories,
// banners, gallery, coupons, orders, etc).
export async function adminFetch(path, options = {}) {
  if (!BASE_URL) throw new Error('API not configured (VITE_API_URL is unset) — the admin panel needs a live backend.')
  const token = getAdminToken()
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.message || `Request failed: ${res.status}`)
    err.status = res.status
    err.code = data.code
    throw err
  }
  return data
}

// Multipart upload helper — used for the "upload an image" flow (see
// admin/components/ImageUploadField.jsx). Deliberately does NOT set
// Content-Type itself; the browser sets the correct multipart boundary
// automatically when the body is a FormData instance.
export async function adminUploadFetch(path, formData) {
  if (!BASE_URL) throw new Error('API not configured (VITE_API_URL is unset).')
  const token = getAdminToken()
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: formData,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.message || `Upload failed: ${res.status}`)
    err.status = res.status
    err.code = data.code
    throw err
  }
  return data
}
