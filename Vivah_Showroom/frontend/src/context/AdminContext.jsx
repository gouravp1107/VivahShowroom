// ============================================================================
// context/AdminContext.jsx — the admin panel's auth state. Deliberately a
// SEPARATE context/provider from ShowroomContext.jsx (the customer-facing
// one): admin login/logout here never touches the customer's `vivah-user`/
// `vivah-token`, so someone can be logged in as a customer AND as admin (or
// neither, or just one) at the same time without conflict — see
// api/adminClient.js for the separate `vivah-admin-token` storage key.
//
// This also tracks the single-admin-session LOCK state (see
// backend/src/models/AdminLock.js): `lockedOut` becomes true whenever a
// request comes back 423 (another admin is checked out, or this session's
// token got superseded/expired) — admin/AdminGuard.jsx watches this and
// bounces back to the login screen with a clear explanation.
// ============================================================================
import { createContext, useContext, useState, useCallback } from 'react'
import { getAdminToken, setAdminToken } from '../api/adminClient'
import {
  adminLoginInit as apiAdminLoginInit,
  adminVerifyOtp as apiAdminVerifyOtp,
  adminResendOtp as apiAdminResendOtp,
  adminLogout as apiAdminLogout,
  adminMe,
} from '../api/adminApi'

const AdminContext = createContext(null)

function readAdmin() {
  try {
    const raw = localStorage.getItem('vivah-admin-user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AdminProvider({ children }) {
  const [admin, setAdmin] = useState(readAdmin)
  const [lockNotice, setLockNotice] = useState(null) // e.g. "Admin panel is in use by X..."

  const persist = (user) => {
    setAdmin(user)
    if (user) localStorage.setItem('vivah-admin-user', JSON.stringify(user))
    else localStorage.removeItem('vivah-admin-user')
    // Lets the public site's useAdminEditMode() hook (hooks/useAdminEditMode.js)
    // react immediately to a login/logout without needing a full page reload —
    // 'storage' alone doesn't fire in the SAME tab/window that made the change.
    window.dispatchEvent(new CustomEvent('vivah-admin-auth-changed'))
  }

  // STEP 1 — email + password. Returns the OTP challenge info (masked
  // phone/email + challengeId); does NOT log the admin in yet. No token is
  // stored until verifyOtp() below succeeds with BOTH codes.
  const loginInit = useCallback(async (email, password) => {
    const challenge = await apiAdminLoginInit(email, password)
    setLockNotice(null)
    return challenge // { challengeId, maskedPhone, maskedEmail, expiresAt }
  }, [])

  // STEP 2 — both OTP codes together. Only this call can create a session.
  const verifyOtp = useCallback(async (challengeId, phoneOtp, emailOtp) => {
    const { user, token } = await apiAdminVerifyOtp(challengeId, phoneOtp, emailOtp)
    setAdminToken(token)
    persist(user)
    return user
  }, [])

  const resendOtp = useCallback((challengeId, channel) => apiAdminResendOtp(challengeId, channel), [])

  const logout = useCallback(async () => {
    try {
      if (getAdminToken()) await apiAdminLogout()
    } catch {
      // even if the network call fails, still clear local state below
    }
    setAdminToken(null)
    persist(null)
  }, [])

  // Called by AdminGuard whenever an API call reports the session ended
  // (423 ADMIN_SESSION_ENDED) — clears local state and shows why.
  const forceLockOut = useCallback((message) => {
    setAdminToken(null)
    persist(null)
    setLockNotice(message || 'Your admin session has ended. Please log in again.')
  }, [])

  // Confirms the stored token is still valid (called once on app load if a
  // token is present) — catches "logged in on another device/tab, then
  // logged out elsewhere" without waiting for the next CRUD call to fail.
  const verifySession = useCallback(async () => {
    if (!getAdminToken()) return false
    try {
      const { user } = await adminMe()
      if (user.role !== 'admin') throw new Error('not admin')
      persist(user)
      return true
    } catch {
      forceLockOut(null)
      return false
    }
  }, [forceLockOut])

  return (
    <AdminContext.Provider value={{ admin, loginInit, verifyOtp, resendOtp, logout, forceLockOut, verifySession, lockNotice, setLockNotice }}>
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  const ctx = useContext(AdminContext)
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider')
  return ctx
}
