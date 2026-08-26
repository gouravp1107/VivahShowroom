// ============================================================================
// pages/CategoryHub.jsx — powers BOTH /bride and /bride/:slug (and, with a
// different `hub` prop, /groom and /groom/:slug too — see App.jsx's routes,
// which render this same component for all four paths). One reusable page
// instead of four nearly-identical files.
//
// HOW IT DECIDES WHAT TO SHOW:
//   - `hub` prop ("bride" or "groom") picks which categories belong here —
//     see data/categories.js's getCategoriesByHub().
//   - `slug` comes from the URL (:slug param). If present (e.g.
//     "/bride/bridal-lehenga"), shows that ONE category's products.
//     If absent (e.g. plain "/bride"), defaults to the FIRST category in
//     the hub (so /bride never shows an empty page).
//   - HubHeader (components/layout/HubHeader.jsx) renders the tab row
//     (Bridal Lehengas / Sarees / Gowns / Jutti) plus a Back button that
//     always goes to "/" (Home) — one level up from a hub's top.
//
// Each PRODUCT TAB is a real route (not just a client-side state toggle),
// so the browser's address bar, refresh, and back/forward buttons all work
// naturally, and HubHeader's back button always has a real, predictable
// place to send you.
// ============================================================================
import { useMemo } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { getCategoriesByHub, getCategory } from '../data/categories'
import { getProductsByCategory } from '../data/products'
import ProductCard from '../components/product/ProductCard'
import HubHeader from '../components/layout/HubHeader'
import SectionHeading from '../components/ui/SectionHeading'
import AddCardTile from '../components/admin/AddCardTile'

const HUB_LABELS = { bride: 'Bride', groom: 'Groom' }

export default function CategoryHub({ hub }) {
  const { slug } = useParams()
  const categoriesInHub = getCategoriesByHub(hub)

  // No :slug in the URL (plain /bride or /groom) -> default to the first
  // category in this hub, so the hub's landing page always shows something.
  const activeSlug = slug || categoriesInHub[0]?.slug
  const category = getCategory(activeSlug)

  const products = useMemo(() => getProductsByCategory(activeSlug), [activeSlug])

  // Unknown hub or empty category list -> nowhere sensible to send them but home.
  if (!category) return <Navigate to="/" replace />

  const tabs = categoriesInHub.map((c) => ({ label: c.name, to: `/${hub}/${c.slug}` }))

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-10">
      <HubHeader
        tabs={tabs}
        activeTo={`/${hub}/${category.slug}`}
        backTo="/"
        backLabel="Home"
      />

      <div className="py-10">
        <SectionHeading eyebrow={`${HUB_LABELS[hub]} Collection`} title={category.name} subtitle={category.blurb} align="left" />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mt-10">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
          <AddCardTile label="Add Product" to="/admin/products" className="rounded-2xl" style={{ aspectRatio: "3/4.6" }} />
        </div>
      </div>
    </div>
  )
}
