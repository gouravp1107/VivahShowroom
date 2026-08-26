// ============================================================================
// data/categories.js — defines every shoppable category on the site, and
// maps each one to a slice of the raw photography in
// frontend/public/assets/<folder>/.
//
// WHY "folder" + "start"/"end" INSTEAD OF ONE FOLDER PER CATEGORY:
// The original image ZIP only had 7 physical folders (bride, groom, couple,
// jewellery-bride, jewellery-groom, jutti, pagdi) but the business brief
// asked for many more specific categories (e.g. "bride" photos split into
// Lehengas/Sarees/Gowns; jewellery split further into necklace/earrings/
// bangles types). So each category here just claims a slice — start/end
// are INDEXES into that folder's file list — rather than physically
// duplicating images into many folders. Some images are deliberately
// reused across more than one category slice (e.g. a jewellery photo can
// appear both in its type-specific tab AND in the hub's "Trending" tab) —
// that mirrors how real e-commerce sites tag one product under multiple
// browsing paths. See data/products.js for how slices become actual
// product cards with names/prices.
//
// THE NAVIGATION HIERARCHY THIS POWERS (see pages/CategoryHub.jsx and
// pages/JewelleryHub.jsx / JewelleryTypeHub.jsx for the pages that consume
// this structure, and components/layout/HubHeader.jsx for the shared
// tab-bar + back-button UI they all use):
//
//   Home
//    ├─ /bride                     -> tabs: every category with hub:'bride'
//    │    └─ /bride/:slug          -> that one category's product grid
//    ├─ /groom                     -> tabs: every category with hub:'groom'
//    │    └─ /groom/:slug          -> that one category's product grid
//    └─ /jewellery                 -> two buttons (Bridal / Groom Jewellery)
//         │                           + a MIXED grid of every jewellery
//         │                           category's products by default
//         ├─ /jewellery/bride       -> tabs: every category with hub:'jewellery-bride'
//         │    └─ /jewellery/bride/:slug  -> that type's product grid
//         └─ /jewellery/groom       -> tabs: every category with hub:'jewellery-groom'
//              └─ /jewellery/groom/:slug  -> that type's product grid
//
// `hub` is what groups categories into the tab bars above — it's separate
// from `group`, which is the older, simpler grouping still used by
// components/layout/Navbar.jsx's mega-menu and Footer.jsx's link columns.
//
// `isTrending: true` marks the ONE category per jewellery hub (the full,
// unsliced jewellery-bride/jewellery-groom folder) that's shown under a
// "Trending" tab — i.e. it's not really a distinct "type" of jewellery,
// it's the same photos as the type tabs combined, standing in for a
// "browse everything" view since there's no real trending/sales data to
// rank by.
//
// CONNECTS TO:
//   - data/products.js              -> reads CATEGORIES to generate the product catalog
//   - components/layout/Navbar.jsx  -> mega-menu groups categories by `group`
//   - components/layout/Footer.jsx  -> footer link columns, also by `group`
//   - pages/Category.jsx            -> getCategory(slug) for the standalone
//                                      Couple Collection page (the one
//                                      category NOT part of a hub)
//   - pages/CategoryHub.jsx, JewelleryHub.jsx, JewelleryTypeHub.jsx -> use
//     getCategoriesByHub(hub) to build each page's tab bar
//   - components/home/CategoryRail.jsx -> lists all CATEGORIES as a scrollable rail
//
// backend/src/utils/seed.js has its OWN copy of this same category list
// (CATEGORY_DEFS) used to populate PostgreSQL — the two are meant to stay in
// sync if you add/rename a category. See that file's comments for details.
// ============================================================================
export const CATEGORIES = [
  // ---- BRIDE HUB (/bride) ----
  {
    slug: 'bridal-lehenga', name: 'Bridal Lehengas', group: 'bride', hub: 'bride',
    folder: 'bride', start: 0, end: 48,
    blurb: 'Hand-embroidered lehengas in zardozi, gota-patti and dabka work.',
  },
  {
    slug: 'bridal-saree', name: 'Bridal Sarees', group: 'bride', hub: 'bride',
    folder: 'bride', start: 48, end: 92,
    blurb: 'Kanjeevaram silks and Banarasi weaves for the pheras and beyond.',
  },
  {
    slug: 'bridal-gown', name: 'Bridal Gowns', group: 'bride', hub: 'bride',
    folder: 'bride', start: 92, end: 135,
    blurb: 'Contemporary silhouettes for the reception and cocktail evening.',
  },
  {
    slug: 'bridal-jutti', name: 'Bridal Jutti', group: 'footwear', hub: 'bride',
    folder: 'jutti', start: 0, end: 29,
    blurb: 'Juttis and mojaris to match every bridal look, true to size.',
  },

  // ---- GROOM HUB (/groom) ----
  {
    slug: 'groom-sherwani', name: 'Groom Sherwani', group: 'groom', hub: 'groom',
    folder: 'groom', start: 0, end: 42,
    blurb: 'Regal sherwanis in raw silk and velvet, built for the mandap.',
  },
  {
    slug: 'groom-indo-western', name: 'Groom Indo-Western', group: 'groom', hub: 'groom',
    folder: 'groom', start: 42, end: 82,
    blurb: 'Bandhgalas and drape jackets for the sangeet and cocktail night.',
  },
  {
    slug: 'groom-suit', name: 'Groom Suits', group: 'groom', hub: 'groom',
    folder: 'groom', start: 82, end: 121,
    blurb: 'Tailored suits for the reception, engagement and after-party.',
  },
  {
    slug: 'groom-pagdi', name: 'Groom Pagdi & Safa', group: 'groom', hub: 'groom',
    folder: 'pagdi', start: 0, end: 105,
    blurb: 'Rajasthani safas and Marwari pagdis, pre-tied and pinned.',
  },
  {
    slug: 'groom-jutti', name: 'Groom Jutti', group: 'footwear', hub: 'groom',
    folder: 'jutti', start: 29, end: 58,
    blurb: 'Hand-embellished mojaris for the groom and his baraatis.',
  },

  // ---- JEWELLERY: BRIDAL SIDE (/jewellery/bride) ----
  // "Trending" tab — the full, unsliced folder (same photos the 3 type
  // tabs below are sliced from), standing in for a "see everything" view.
  {
    slug: 'bridal-jewellery', name: 'Trending', group: 'jewellery', hub: 'jewellery-bride', isTrending: true,
    folder: 'jewellery-bride', start: 0, end: 99,
    blurb: 'Kundan, polki and temple sets — rented by the day, not the decade.',
  },
  {
    slug: 'bridal-jewellery-necklace', name: 'Necklace & Sets', group: 'jewellery', hub: 'jewellery-bride',
    folder: 'jewellery-bride', start: 0, end: 40,
    blurb: 'Statement kundan and polki necklace sets for the mandap.',
  },
  {
    slug: 'bridal-jewellery-earrings', name: 'Earrings & Maang Tikka', group: 'jewellery', hub: 'jewellery-bride',
    folder: 'jewellery-bride', start: 40, end: 70,
    blurb: 'Jhumkas, chandbalis and maang tikka to frame the face.',
  },
  {
    slug: 'bridal-jewellery-bangles', name: 'Bangles & Rings', group: 'jewellery', hub: 'jewellery-bride',
    folder: 'jewellery-bride', start: 70, end: 99,
    blurb: 'Kada, chooda and cocktail rings finished in antique gold.',
  },

  // ---- JEWELLERY: GROOM SIDE (/jewellery/groom) ----
  {
    slug: 'groom-jewellery', name: 'Trending', group: 'jewellery', hub: 'jewellery-groom', isTrending: true,
    folder: 'jewellery-groom', start: 0, end: 109,
    blurb: 'Kalgi, mala and brooch sets to finish the groom\u2019s look.',
  },
  {
    slug: 'groom-jewellery-mala', name: 'Mala & Chains', group: 'jewellery', hub: 'jewellery-groom',
    folder: 'jewellery-groom', start: 0, end: 40,
    blurb: 'Layered pearl and rudraksha mala for the baraat.',
  },
  {
    slug: 'groom-jewellery-kalgi', name: 'Kalgi & Brooch', group: 'jewellery', hub: 'jewellery-groom',
    folder: 'jewellery-groom', start: 40, end: 75,
    blurb: 'Kalgi, sarpech and brooch pins to finish the pagdi.',
  },
  {
    slug: 'groom-jewellery-bracelet', name: 'Bracelets & Rings', group: 'jewellery', hub: 'jewellery-groom',
    folder: 'jewellery-groom', start: 75, end: 109,
    blurb: 'Kada and statement rings in antique and matte gold.',
  },

  // ---- STANDALONE (no hub — its own top-level page at /category/couple-collection) ----
  {
    slug: 'couple-collection', name: 'Couple Collection', group: 'couple',
    folder: 'couple', start: 0, end: 64,
    blurb: 'Coordinated bride-and-groom looks, styled to photograph as one.',
  },

  // ---- GARBA (standalone, no hub — its own top-level page at
  // /category/garba, and its own top-level nav link in Navbar.jsx).
  // DELIBERATELY EMPTY: start === end means getProductsByCategory('garba')
  // (data/products.js) always returns []. No demo/reused photos are seeded
  // here on purpose — this category exists so an admin can add real Garba
  // products through the Inventory Management screen (see
  // admin/InventoryManager.jsx / admin/ProductsManager.jsx); it starts
  // with nothing rather than borrowed Couple Collection photos. ----
  {
    slug: 'garba', name: 'Garba & Sangeet', group: 'garba',
    folder: 'couple', start: 0, end: 0,
    blurb: 'Vibrant chaniya cholis, kediyus and mirror-work sets for dandiya nights — added by the showroom team.',
  },

  // ---- OTHER (standalone, no hub — its own top-level page at
  // /category/other, and its own top-level nav link). A catch-all for
  // anything that doesn't belong under Bride/Groom/Jewellery/Couple/Garba
  // — currently reserved for WESTERN WEAR specifically. Same "deliberately
  // empty" reasoning as Garba above — populated via Inventory Management,
  // not seeded demo photos. ----
  {
    slug: 'other', name: 'Other', group: 'other',
    folder: 'pagdi', start: 0, end: 0,
    blurb: 'Western wear and anything else that doesn\u2019t fit a specific section — added by the showroom team.',
  },
]

// Occasion-based groupings (Wedding, Reception, Engagement, etc.) — each one
// just points at a few of the CATEGORIES above rather than having its own
// photos. Not yet wired into a page/route, but ready for an "Occasions" nav
// section or landing pages if needed later.
export const OCCASIONS = [
  { slug: 'wedding', name: 'Wedding', categories: ['bridal-lehenga', 'groom-sherwani', 'bridal-jewellery'] },
  { slug: 'reception', name: 'Reception', categories: ['bridal-gown', 'groom-suit', 'couple-collection'] },
  { slug: 'engagement', name: 'Engagement', categories: ['bridal-gown', 'groom-indo-western'] },
  { slug: 'haldi', name: 'Haldi', categories: ['bridal-saree', 'groom-indo-western'] },
  { slug: 'mehendi', name: 'Mehendi', categories: ['bridal-saree', 'bridal-jutti'] },
  { slug: 'sangeet', name: 'Sangeet', categories: ['groom-indo-western', 'bridal-gown'] },
  { slug: 'family', name: 'Family Collection', categories: ['couple-collection', 'groom-suit'] },
]

// Looks up a single category object by its URL slug — used by
// pages/Category.jsx (Couple Collection) and every hub/sub page that needs
// one specific category's details.
export function getCategory(slug) {
  return CATEGORIES.find((c) => c.slug === slug)
}

// Returns every category belonging to one hub, IN FILE ORDER (which is also
// display order) — this is what builds each hub page's tab bar. E.g.
// getCategoriesByHub('bride') returns [Bridal Lehengas, Bridal Sarees,
// Bridal Gowns, Bridal Jutti] in that order.
export function getCategoriesByHub(hub) {
  return CATEGORIES.filter((c) => c.hub === hub)
}

// Given a category slug, returns the correct URL for it under the nested
// hub navigation — this is the ONE place that knows how to turn a slug
// into a path, so every link across the site (Navbar, Footer, Hero,
// CategoryRail, product breadcrumbs, etc.) stays consistent even if the
// URL structure changes later. Used instead of hand-writing paths like
// `/category/${slug}` or `/bride/${slug}` directly in components.
//
//   bride/groom category            -> /bride/:slug or /groom/:slug
//   jewellery-bride/-groom category -> /jewellery/bride/:slug or /jewellery/groom/:slug
//   anything else (e.g. Couple Collection, which has no `hub`) -> /category/:slug
export function categoryPath(slug) {
  const category = getCategory(slug)
  if (!category?.hub) return `/category/${slug}`
  if (category.hub === 'bride' || category.hub === 'groom') return `/${category.hub}/${slug}`
  if (category.hub === 'jewellery-bride') return `/jewellery/bride/${slug}`
  if (category.hub === 'jewellery-groom') return `/jewellery/groom/${slug}`
  return `/category/${slug}`
}
