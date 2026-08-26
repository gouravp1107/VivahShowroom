// ============================================================================
// api/client.js — the LOWEST-level piece of the frontend-to-backend bridge.
// Nothing else in the app calls `fetch()` directly for backend data — every
// request goes through apiFetch() here, so auth headers and error handling
// are consistent everywhere. src/api/index.js (the file right next to this
// one) is what the rest of the app actually imports and calls.
//
// VITE_API_URL comes from frontend/.env (copy .env.example -> .env and set
// it to your deployed backend, e.g. https://your-api.onrender.com/api).
// If it's NOT set, isApiConfigured is false, and src/api/index.js falls back
// to the bundled demo data instead of calling this file at all — that's how
// the site works standalone with zero backend setup.
// ============================================================================
const BASE_URL = import.meta.env.VITE_API_URL || ''

// Read by src/api/index.js to decide "real backend" vs "local demo data" per call.
export const isApiConfigured = Boolean(BASE_URL)

// The JWT token saved by ShowroomContext.jsx's login() function after a
// successful sign-in — see backend/src/utils/generateToken.js for where
// this token is originally created, and backend/src/middleware/auth.js for
// how the backend verifies it on protected routes.
function getToken() {
  return localStorage.getItem('vivah-token')
}

// Generic fetch wrapper used for every backend call.
//   path    -> e.g. '/products?category=bridal-lehenga'  (appended to BASE_URL)
//   options -> standard fetch() options (method, body, etc.)
// Automatically:
//   - Sets Content-Type: application/json
//   - Attaches "Authorization: Bearer <token>" if the user is logged in
//   - Parses the JSON response and throws a readable Error on failure,
//     so callers can just try/catch instead of checking res.ok manually.
export async function apiFetch(path, options = {}) {
  if (!BASE_URL) throw new Error('API not configured (VITE_API_URL is unset)')

  const token = getToken()
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  const data = await res.json().catch(() => ({})) // tolerate empty/non-JSON responses
  if (!res.ok) throw new Error(data.message || `Request failed: ${res.status}`)
  return data
}
