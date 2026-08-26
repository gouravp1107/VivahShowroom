// ============================================================================
// hooks/useAdminEditMode.js — lets any PUBLIC-site component (ProductCard,
// CategoryRail, MomentsGallery, ContactStrip, ...) know "is the person
// currently browsing this page also logged in as the site admin?" without
// pulling in the full admin/context/AdminContext.jsx + AdminProvider stack,
// which only wraps the separate /admin/* branch (see App.jsx).
//
// This is intentionally a thin, read-only check of the SAME localStorage
// keys AdminContext.jsx already writes (`vivah-admin-token` /
// `vivah-admin-user` — see api/adminClient.js) — logging in/out still only
// ever happens through the real /admin sign-in flow (dual OTP, single
// active session, etc., all unchanged); this hook just lets the public
// pages notice that state and show inline Edit/Delete affordances when it's
// true. It never mutates admin state itself.
//
// WHAT THIS POWERS: components/admin/EditOverlay.jsx (the pencil/trash
// buttons that appear on cards across the public site once this is true).
// ============================================================================
import { useEffect, useState } from 'react'

function readAdminUser() {
  try {
    const raw = localStorage.getItem('vivah-admin-user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function computeIsAdmin() {
  const admin = readAdminUser()
  const token = localStorage.getItem('vivah-admin-token')
  return Boolean(admin && token && admin.role === 'admin')
}

export function useAdminEditMode() {
  const [isAdmin, setIsAdmin] = useState(computeIsAdmin)

  useEffect(() => {
    const sync = () => setIsAdmin(computeIsAdmin())
    // 'storage' fires automatically in OTHER tabs/windows when localStorage
    // changes; AdminContext.jsx also fires a 'vivah-admin-auth-changed'
    // CustomEvent on login/logout so a same-tab admin session change (e.g.
    // logging out mid-browse) is picked up immediately too.
    window.addEventListener('storage', sync)
    window.addEventListener('vivah-admin-auth-changed', sync)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener('vivah-admin-auth-changed', sync)
    }
  }, [])

  return isAdmin
}
