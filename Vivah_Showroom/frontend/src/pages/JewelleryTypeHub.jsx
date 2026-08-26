// ============================================================================
// pages/JewelleryTypeHub.jsx — powers /jewellery/bride, /jewellery/bride/:slug,
// /jewellery/groom, and /jewellery/groom/:slug (see App.jsx's routes — same
// component rendered for both sides via the `side` prop, same pattern as
// CategoryHub.jsx for Bride/Groom).
//
// This is the SECOND level of the jewellery section — one level below
// JewelleryHub.jsx ("/jewellery", which just offers the Bride/Groom choice
// + a mixed view), one level above nothing (this is where individual
// products are actually shown).
//
// Tabs here come from data/categories.js's hub:'jewellery-bride' or
// 'jewellery-groom' categories, which — by design — always start with a
// "Trending" tab (the isTrending:true category, showing that side's FULL
// photo range) followed by the specific jewellery TYPE tabs (Necklace &
// Sets, Earrings & Maang Tikka, Bangles & Rings, etc — see that file for
// the exact list per side).
//
// Back button goes to "/jewellery" (one level up — the Bride/Groom choice
// screen), not all the way to Home, consistent with every other hub page's
// "back goes up exactly one level" rule.
// ============================================================================
import { useMemo } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { getCategoriesByHub, getCategory } from '../data/categories'
import { getProductsByCategory } from '../data/products'
import ProductCard from '../components/product/ProductCard'
import HubHeader from '../components/layout/HubHeader'
import SectionHeading from '../components/ui/SectionHeading'
import AddCardTile from '../components/admin/AddCardTile'

const SIDE_LABELS = { bride: 'Bridal Jewellery', groom: 'Groom Jewellery' }

export default function JewelleryTypeHub({ side }) {
  const { slug } = useParams()
  const hub = `jewellery-${side}` // 'jewellery-bride' or 'jewellery-groom'
  const categoriesInHub = getCategoriesByHub(hub)

  // No :slug -> default to the first tab, which is always the "Trending" one.
  const activeSlug = slug || categoriesInHub[0]?.slug
  const category = getCategory(activeSlug)

  const products = useMemo(() => getProductsByCategory(activeSlug), [activeSlug])

  if (!category) return <Navigate to="/jewellery" replace />

  const basePath = `/jewellery/${side}`
  const tabs = categoriesInHub.map((c) => ({ label: c.name, to: `${basePath}/${c.slug}` }))

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-10">
      <HubHeader
        tabs={tabs}
        activeTo={`${basePath}/${category.slug}`}
        backTo="/jewellery"
        backLabel="Jewellery"
      />

      <div className="py-10">
        <SectionHeading eyebrow={SIDE_LABELS[side]} title={category.name} subtitle={category.blurb} align="left" />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mt-10">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
          <AddCardTile label="Add Product" to="/admin/products" className="rounded-2xl" style={{ aspectRatio: "3/4.6" }} />
        </div>
      </div>
    </div>
  )
}
