// ============================================================================
// ShowroomContext.jsx — the app's shared "shopping state": wishlist, rental
// bag, logged-in user, and toast notifications. This is the second (and
// larger) of the two React Contexts the app uses (see ThemeContext.jsx for
// the other, simpler one — read that file first if Context is new to you).
//
// Everything here is kept in the BROWSER's localStorage (not a database),
// which is why this works even in demo mode with no backend running — see
// src/api/index.js for how login/register optionally talk to a real backend
// while everything in THIS file just stores the result locally.
//
// WHO USES THIS:
//   - Navbar.jsx        -> shows wishlist/bag item counts, account icon link
//   - ProductCard.jsx    -> the heart icon calls toggleWishlist()
//   - Product.jsx (page) -> "Reserve This Piece" calls addToBag()
//   - Wishlist.jsx, Bag.jsx (pages) -> read `wishlist` / `bag` to list items
//   - Login.jsx, Register.jsx -> call login() after a successful API call
//   - Toast.jsx          -> reads `toast` and renders the little popup message
//   - Profile.jsx        -> reads `user`, calls logout()
//
// localStorage KEYS USED (so you can find them in browser DevTools):
//   vivah-wishlist  -> array of product IDs
//   vivah-bag       -> array of { productId, size, duration, date, price }
//   vivah-user      -> the logged-in user's profile object (or null)
//   vivah-token     -> JWT auth token from the backend (read by api/client.js)
// ============================================================================
import { createContext, useContext, useEffect, useState } from 'react'

const ShowroomContext = createContext(null)

// Small helper: safely reads and JSON-parses a localStorage key, falling
// back to a default value if it's missing, corrupt, or we're not in a
// browser (e.g. during a server-side build step).
function readStore(key, fallback) {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function ShowroomProvider({ children }) {
  // Each piece of state is initialized from localStorage so a page refresh
  // doesn't wipe out the user's wishlist/bag/login.
  const [wishlist, setWishlist] = useState(() => readStore('vivah-wishlist', []))
  const [bag, setBag] = useState(() => readStore('vivah-bag', []))
  const [user, setUser] = useState(() => readStore('vivah-user', null))
  const [toast, setToast] = useState(null) // toast has no localStorage — it's transient (see notify() below)

  // Whenever wishlist/bag/user change, mirror them back into localStorage
  // so the next page load (or browser restart) picks up where we left off.
  useEffect(() => localStorage.setItem('vivah-wishlist', JSON.stringify(wishlist)), [wishlist])
  useEffect(() => localStorage.setItem('vivah-bag', JSON.stringify(bag)), [bag])
  useEffect(() => localStorage.setItem('vivah-user', JSON.stringify(user)), [user])

  // Shows a small popup message (rendered by components/ui/Toast.jsx) for
  // ~2.4 seconds, then clears it. Re-calling notify() while one is showing
  // resets the timer instead of stacking multiple toasts.
  function notify(message) {
    setToast(message)
    window.clearTimeout(notify._t)
    notify._t = window.setTimeout(() => setToast(null), 2400)
  }

  // Adds/removes a product ID from the wishlist array. Used by the heart
  // icon on ProductCard.jsx and the product detail page.
  function toggleWishlist(productId) {
    setWishlist((list) => {
      const exists = list.includes(productId)
      notify(exists ? 'Removed from wishlist' : 'Saved to wishlist')
      return exists ? list.filter((id) => id !== productId) : [...list, productId]
    })
  }

  // Adds a rental to the bag. `options` carries the size/duration/date/price
  // the customer picked on the product page (see pages/Product.jsx).
  function addToBag(productId, options = {}) {
    setBag((list) => [...list, { productId, ...options, addedAt: Date.now() }])
    notify('Added to your rental bag')
  }

  function removeFromBag(index) {
    setBag((list) => list.filter((_, i) => i !== index))
  }

  // Called after a successful login/register/guest API call (see src/api/index.js).
  // Saves the user's profile here, and the JWT token separately so
  // src/api/client.js can attach it to future authenticated requests.
  function login(profile, token) {
    setUser(profile)
    if (token) localStorage.setItem('vivah-token', token)
    notify(`Welcome, ${profile.name.split(' ')[0]}`)
  }

  // "Continue as Guest" on the login page — no backend call, no token,
  // just a local placeholder user so the UI has someone to greet.
  function loginAsGuest() {
    setUser({ name: 'Guest', email: null, guest: true })
    notify('Continuing as guest')
  }

  function logout() {
    setUser(null)
    localStorage.removeItem('vivah-token')
    notify('Signed out')
  }

  // Everything above is made available to any component via useShowroom() below.
  return (
    <ShowroomContext.Provider
      value={{ wishlist, toggleWishlist, bag, addToBag, removeFromBag, user, login, loginAsGuest, logout, toast, notify }}
    >
      {children}
    </ShowroomContext.Provider>
  )
}

// Custom hook — call this from any component to read/update shopping state:
// const { wishlist, toggleWishlist, bag, addToBag, user, login, logout } = useShowroom()
export function useShowroom() {
  const ctx = useContext(ShowroomContext)
  if (!ctx) throw new Error('useShowroom must be used within ShowroomProvider')
  return ctx
}
