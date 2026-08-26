// ============================================================================
// data/products.js — GENERATES the entire demo product catalog from your
// photography, automatically. There is no hand-written list of products
// anywhere; instead, every image in imageManifest.json gets turned into one
// "product" with a generated name, price, deposit, and description. This is
// what powers the site when no backend is configured (see api/index.js).
//
// WHERE THE IMAGES COME FROM:
//   imageManifest.json is auto-generated (see the optimize/resize step this
//   project was built with) and simply lists every image filename inside
//   each folder under frontend/public/assets/. Example shape:
//     { "bride": ["bride-001.jpg", "bride-002.jpg", ...], "groom": [...] }
//
// THE GENERATION PIPELINE:
//   1. Loop over every category in data/categories.js (12 categories).
//   2. For each one, slice out its portion of images from the matching
//      manifest folder (category.start..category.end).
//   3. Turn each image into a product object via buildProduct() below —
//      the name/price/rating/etc. are all DETERMINISTICALLY derived from
//      hashing the product's ID (see hashCode()), so the same image always
//      gets the same generated name/price on every reload (not random).
//   4. Attach a 3-image "gallery" per product by grabbing that image plus
//      the next two in the same folder (wrapping around at the end) — this
//      is what lets the product page's zoom/thumbnail gallery show more
//      than one photo even though each real product only has one source photo.
//
// CONNECTS TO:
//   - data/categories.js        -> the 12 categories being sliced
//   - data/imageManifest.json   -> the raw list of image filenames
//   - api/index.js              -> imports getProduct/getProductsByCategory/
//                                  getFeatured as the "local fallback" data
//   - backend/src/utils/seed.js -> has a NEARLY IDENTICAL copy of this same
//                                  generation logic, so that seeding MongoDB
//                                  produces the same catalog you see in demo
//                                  mode. If you change the pricing/naming
//                                  logic here, consider updating seed.js too.
// ============================================================================
import manifest from './imageManifest.json'
import { CATEGORIES } from './categories'

// Word banks used to build generated product names like "Chandni Bridal Lehenga".
const ADJECTIVES = ['Aaradhya', 'Meherbaan', 'Noorani', 'Zaraah', 'Rangeela', 'Shaan', 'Suhaani', 'Ishaani', 'Firdaus', 'Manzil', 'Rivaaj', 'Aisha', 'Kesariya', 'Baraat', 'Rooh', 'Zoya', 'Aftaab', 'Chandni', 'Wajah', 'Aabroo']
const COLORWAYS = ['Maroon & Gold', 'Wine & Antique Gold', 'Ivory & Champagne', 'Emerald & Gold', 'Blush & Rose Gold', 'Midnight & Gold', 'Coral & Gold', 'Off-White & Silver']
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'Custom Fitting']

// Turns any string into a stable, positive pseudo-random-looking number.
// This is what makes "the same product always looks the same" — e.g.
// product id "bridal-lehenga-3" will ALWAYS get the same generated name,
// price, and rating, because hashCode("bridal-lehenga-3") never changes.
// (This is NOT a cryptographic hash — just a simple, fast, deterministic one.)
function hashCode(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0
  return Math.abs(h)
}

// Builds one product object from a single image file.
//   category        -> the category definition from data/categories.js
//   imgFile         -> e.g. "bride-014.jpg"
//   indexInCategory -> this image's position within its category's slice (0, 1, 2...)
function buildProduct(category, imgFile, indexInCategory) {
  const id = `${category.slug}-${indexInCategory + 1}` // e.g. "bridal-lehenga-1"
  const h = hashCode(id)

  // All of these "look random" but are 100% derived from `h`, so they're
  // consistent across reloads/rebuilds for the same product id.
  const name = `${ADJECTIVES[h % ADJECTIVES.length]} ${category.name.replace(/s$/, '')}` // e.g. "Chandni Bridal Lehenga"
  const rentalPrice = 2500 + (h % 18) * 750       // ranges roughly ₹2,500–₹15,250
  const deposit = Math.round(rentalPrice * 2.2 / 100) * 100 + 3000
  const rating = (3.9 + (h % 11) / 10).toFixed(1)  // ranges 3.9–4.9
  const reviews = 8 + (h % 140)

  return {
    id,
    name,
    category: category.slug,
    categoryName: category.name,
    image: `assets/${category.folder}/${imgFile}`,     // main card image
    gallery: [`assets/${category.folder}/${imgFile}`], // overwritten below with a real 3-image gallery
    rentalPrice,
    deposit,
    rating: Number(rating),
    reviews,
    colorway: COLORWAYS[h % COLORWAYS.length],
    sizes: SIZES,
    description: `${name} — a ${category.name.toLowerCase()} piece finished in ${COLORWAYS[h % COLORWAYS.length].toLowerCase()}, available for a 3, 5 or 7-day rental window with in-house alterations and a pre-event trial.`,
    available: h % 9 !== 0, // ~1 in 9 products show as "Reserved" for realism
  }
}

// THE ACTUAL CATALOG — built once when this module first loads, then reused
// everywhere (Category pages, Product pages, homepage sections, wishlist,
// bag) by importing PRODUCTS or the helper functions below.
//
// flatMap: for each of the 12 categories, produce an array of products, then
// flatten all 12 arrays into one big PRODUCTS array.
export const PRODUCTS = CATEGORIES.flatMap((category) => {
  const files = (manifest[category.folder] || []).slice(category.start, category.end)
  return files.map((file, i) => {
    const product = buildProduct(category, file, i)
    // Build a 3-photo gallery: this image + the next two in the same folder,
    // wrapping around with % so it never runs off the end of the array.
    const gallery = [file, files[(i + 1) % files.length], files[(i + 2) % files.length]]
      .filter(Boolean)
      .map((f) => `assets/${category.folder}/${f}`)
    return { ...product, gallery }
  })
})

// Used by pages/Category.jsx to list every product in one category.
export function getProductsByCategory(slug) {
  return PRODUCTS.filter((p) => p.category === slug)
}

// Used by pages/Product.jsx to load one product by its id (from the URL).
export function getProduct(id) {
  return PRODUCTS.find((p) => p.id === id)
}

// Used by pages/Product.jsx's "You May Also Like" section — other products
// in the same category, excluding the one currently being viewed.
export function getRelatedProducts(product, count = 4) {
  return PRODUCTS.filter((p) => p.category === product.category && p.id !== product.id).slice(0, count)
}

// Used by the homepage's "Trending Right Now" section. Rather than picking
// the first N products (which would all be from one category, since PRODUCTS
// is grouped by category), this takes every Nth product ("step") so the
// result is spread across all 12 categories.
export function getFeatured(count = 8) {
  const step = Math.max(1, Math.floor(PRODUCTS.length / count))
  const out = []
  for (let i = 0; i < PRODUCTS.length && out.length < count; i += step) out.push(PRODUCTS[i])
  return out
}
