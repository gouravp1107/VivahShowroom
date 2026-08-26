// ============================================================================
// utils/seed.js — populates a real PostgreSQL database with the same
// showroom catalog you see in demo mode, so switching from "no backend
// configured" to "real backend + database" doesn't change what customers
// see. Run with: npm run seed (see package.json's "scripts" — requires
// DATABASE_URL set in backend/.env first, and the migration already
// applied via `npm run prisma:migrate`).
//
// THIS FILE DELIBERATELY DUPLICATES LOGIC FROM THE FRONTEND:
//   CATEGORY_DEFS below is a near-exact copy of frontend/src/data/
//   categories.js's CATEGORIES array, and the product-generation logic
//   further down (hashCode, ADJECTIVES, COLORWAYS, etc.) mirrors
//   frontend/src/data/products.js's buildProduct(). They're kept as two
//   separate copies — one generating plain JS objects for the frontend's
//   no-backend demo mode, one creating real PostgreSQL rows here — rather
//   than sharing one module, because the frontend and backend are two
//   separate npm projects that don't share code by default in this setup.
//   IF YOU CHANGE PRICING/NAMING LOGIC, update both files to keep demo
//   mode and the real database showing the same catalog.
//
// WHAT RUNNING THIS SCRIPT ACTUALLY DOES:
//   1. Connects to PostgreSQL (via lib/prisma.js).
//   2. WIPES all existing Product and Category rows — safe to re-run
//      anytime during development, but be aware it's destructive on a
//      database with real orders/inventory already referencing these
//      products (Order.items references products by id, and deleting +
//      recreating products generates NEW ids, breaking those references —
//      don't re-run this against a live production database with existing
//      orders). InventoryItem rows for these products are cascade-deleted
//      automatically (see prisma/schema.prisma).
//   3. Creates one Category row per entry in CATEGORY_DEFS.
//   4. For each category, slices out its portion of imageManifest.json
//      (same manifest the frontend uses) and generates one Product row per
//      image, using the identical hash-based name/price/rating logic as
//      the frontend's demo catalog, then creates a matching InventoryItem
//      so the admin Inventory screen has real stock to manage immediately.
// ============================================================================
import 'dotenv/config'
import prisma from '../lib/prisma.js'
import manifest from '../data/imageManifest.json' with { type: 'json' }

// Mirrors frontend/src/data/categories.js's CATEGORIES array — see that
// file's comments for why categories are "slices" of 7 physical image
// folders rather than one folder per category.
const CATEGORY_DEFS = [
  { slug: 'bridal-lehenga', name: 'Bridal Lehengas', group: 'bride', folder: 'bride', start: 0, end: 48, blurb: 'Hand-embroidered lehengas in zardozi, gota-patti and dabka work.' },
  { slug: 'bridal-saree', name: 'Bridal Sarees', group: 'bride', folder: 'bride', start: 48, end: 92, blurb: 'Kanjeevaram silks and Banarasi weaves for the pheras and beyond.' },
  { slug: 'bridal-gown', name: 'Bridal Gowns', group: 'bride', folder: 'bride', start: 92, end: 135, blurb: 'Contemporary silhouettes for the reception and cocktail evening.' },
  { slug: 'groom-sherwani', name: 'Groom Sherwani', group: 'groom', folder: 'groom', start: 0, end: 42, blurb: 'Regal sherwanis in raw silk and velvet, built for the mandap.' },
  { slug: 'groom-indo-western', name: 'Groom Indo-Western', group: 'groom', folder: 'groom', start: 42, end: 82, blurb: 'Bandhgalas and drape jackets for the sangeet and cocktail night.' },
  { slug: 'groom-suit', name: 'Groom Suits', group: 'groom', folder: 'groom', start: 82, end: 121, blurb: 'Tailored suits for the reception, engagement and after-party.' },
  // "Trending" jewellery entries — the full, unsliced folder each of the
  // three type-specific slices below is cut from. Mirrors the isTrending
  // entries in frontend/src/data/categories.js.
  { slug: 'bridal-jewellery', name: 'Trending', group: 'jewellery', folder: 'jewellery-bride', start: 0, end: 99, blurb: 'Kundan, polki and temple sets, rented by the day.' },
  { slug: 'bridal-jewellery-necklace', name: 'Necklace & Sets', group: 'jewellery', folder: 'jewellery-bride', start: 0, end: 40, blurb: 'Statement kundan and polki necklace sets for the mandap.' },
  { slug: 'bridal-jewellery-earrings', name: 'Earrings & Maang Tikka', group: 'jewellery', folder: 'jewellery-bride', start: 40, end: 70, blurb: 'Jhumkas, chandbalis and maang tikka to frame the face.' },
  { slug: 'bridal-jewellery-bangles', name: 'Bangles & Rings', group: 'jewellery', folder: 'jewellery-bride', start: 70, end: 99, blurb: 'Kada, chooda and cocktail rings finished in antique gold.' },
  { slug: 'groom-jewellery', name: 'Trending', group: 'jewellery', folder: 'jewellery-groom', start: 0, end: 109, blurb: "Kalgi, mala and brooch sets to finish the groom's look." },
  { slug: 'groom-jewellery-mala', name: 'Mala & Chains', group: 'jewellery', folder: 'jewellery-groom', start: 0, end: 40, blurb: 'Layered pearl and rudraksha mala for the baraat.' },
  { slug: 'groom-jewellery-kalgi', name: 'Kalgi & Brooch', group: 'jewellery', folder: 'jewellery-groom', start: 40, end: 75, blurb: 'Kalgi, sarpech and brooch pins to finish the pagdi.' },
  { slug: 'groom-jewellery-bracelet', name: 'Bracelets & Rings', group: 'jewellery', folder: 'jewellery-groom', start: 75, end: 109, blurb: 'Kada and statement rings in antique and matte gold.' },
  { slug: 'groom-pagdi', name: 'Groom Pagdi & Safa', group: 'groom', folder: 'pagdi', start: 0, end: 105, blurb: 'Rajasthani safas and Marwari pagdis, pre-tied and pinned.' },
  { slug: 'bridal-jutti', name: 'Bridal Jutti', group: 'footwear', folder: 'jutti', start: 0, end: 29, blurb: 'Juttis and mojaris to match every bridal look, true to size.' },
  { slug: 'groom-jutti', name: 'Groom Jutti', group: 'footwear', folder: 'jutti', start: 29, end: 58, blurb: 'Hand-embellished mojaris for the groom and his baraatis.' },
  { slug: 'couple-collection', name: 'Couple Collection', group: 'couple', folder: 'couple', start: 0, end: 64, blurb: 'Coordinated bride-and-groom looks, styled to photograph as one.' },
  // Garba and Other are deliberately seeded EMPTY (start === end) — see
  // frontend/src/data/categories.js's matching entries for why. Real
  // products for these two go in through the admin Inventory Management
  // screen after deploy, not this seed script.
  { slug: 'garba', name: 'Garba & Sangeet', group: 'garba', folder: 'couple', start: 0, end: 0, blurb: 'Vibrant chaniya cholis, kediyus and mirror-work sets for dandiya nights — added by the showroom team.' },
  { slug: 'other', name: 'Other', group: 'other', folder: 'pagdi', start: 0, end: 0, blurb: 'Western wear and anything else that doesn\u2019t fit a specific section — added by the showroom team.' },
]

const ADJECTIVES = ['Aaradhya', 'Meherbaan', 'Noorani', 'Zaraah', 'Rangeela', 'Shaan', 'Suhaani', 'Ishaani', 'Firdaus', 'Manzil', 'Rivaaj', 'Aisha', 'Kesariya', 'Baraat', 'Rooh', 'Zoya', 'Aftaab', 'Chandni', 'Wajah', 'Aabroo']
const COLORWAYS = ['Maroon & Gold', 'Wine & Antique Gold', 'Ivory & Champagne', 'Emerald & Gold', 'Blush & Rose Gold', 'Midnight & Gold', 'Coral & Gold', 'Off-White & Silver']
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'Custom Fitting']
const DURATIONS = [
  { label: '3 Days', multiplier: 1 },
  { label: '5 Days', multiplier: 1.4 },
  { label: '7 Days', multiplier: 1.8 },
]

function hashCode(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0
  return Math.abs(h)
}

async function seed() {
  console.log('Clearing existing categories and products...')
  // Order matters: Product has a required FK to Category, and
  // InventoryItem cascade-deletes when its Product is deleted (see
  // prisma/schema.prisma), so deleting products first is enough.
  await prisma.product.deleteMany({})
  await prisma.category.deleteMany({})

  const categoryRows = {}
  let order = 0
  for (const def of CATEGORY_DEFS) {
    const files = (manifest[def.folder] || []).slice(def.start, def.end)
    const row = await prisma.category.create({
      data: {
        name: def.name,
        slug: def.slug,
        group: def.group,
        description: def.blurb,
        bannerImage: files[0] ? `/assets/${def.folder}/${files[0]}` : '',
        order: order++,
      },
    })
    categoryRows[def.slug] = { row, def, files }
    console.log(`Created category: ${def.name} (${files.length} images)`)
  }

  let productCount = 0
  for (const slug of Object.keys(categoryRows)) {
    const { row, def, files } = categoryRows[slug]
    for (let i = 0; i < files.length; i += 1) {
      const file = files[i]
      const id = `${slug}-${i + 1}`
      const h = hashCode(id)
      const name = `${ADJECTIVES[h % ADJECTIVES.length]} ${def.name.replace(/s$/, '')}`
      const rentalPrice = 2500 + (h % 18) * 750
      const deposit = Math.round((rentalPrice * 2.2) / 100) * 100 + 3000
      const colorway = COLORWAYS[h % COLORWAYS.length]
      const gallery = [file, files[(i + 1) % files.length], files[(i + 2) % files.length]]
        .filter(Boolean)
        .map((f) => `/assets/${def.folder}/${f}`)
      const available = h % 9 !== 0
      const stock = available ? 1 + (h % 4) : 0

      const product = await prisma.product.create({
        data: {
          name,
          categoryId: row.id,
          description: `${name} — a ${def.name.toLowerCase()} piece finished in ${colorway.toLowerCase()}, available for a 3, 5 or 7-day rental window with in-house alterations and a pre-event trial.`,
          images: gallery,
          colorway,
          sizes: SIZES,
          rentalPrice,
          deposit,
          durationOptions: DURATIONS,
          available,
          stock,
          rating: Number((3.9 + (h % 11) / 10).toFixed(1)),
          tags: [def.group, slug],
          isFeatured: i % 12 === 0,
        },
      })

      await prisma.inventoryItem.create({
        data: { productId: product.id, totalUnits: stock, reservedUnits: 0, damagedUnits: 0, lowStockThreshold: 1 },
      })
      productCount += 1
    }
  }

  console.log(`Seeded ${Object.keys(categoryRows).length} categories and ${productCount} products (with matching inventory records).`)
}

seed()
  .catch((err) => {
    console.error('Seeding failed:', err)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
