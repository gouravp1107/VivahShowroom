// ============================================================================
// controllers/productController.js — logic for /api/products/* routes (see
// routes/productRoutes.js). This is the backend's equivalent of
// frontend/src/data/products.js's getProductsByCategory/getProduct/etc —
// same job (finding/filtering products), but querying PostgreSQL via Prisma
// instead of an in-memory generated array. The frontend's src/api/index.js
// calls these endpoints when VITE_API_URL is configured, falling back to
// the local generated catalog otherwise.
// ============================================================================
import prisma from '../lib/prisma.js'
import { withId, withIds } from '../utils/serialize.js'
import { upsertInventoryFromProduct } from '../services/inventoryService.js'

const CATEGORY_SELECT = { id: true, name: true, slug: true, group: true }

// GET /api/products — the main product-browsing endpoint. Supports:
//   ?category=<slug>   filter to one category (resolved to its id first)
//   ?tag=<tag>          filter by an occasion tag (see prisma schema's Product.tags)
//   ?available=true     only show in-stock items
//   ?search=<text>      search across name/description/tags (case-insensitive)
//   ?sort=price-asc|price-desc|rating|newest   (default: featured items first, then newest)
//   ?page=&limit=       pagination
export async function listProducts(req, res) {
  const { category, tag, sort, available, search, page = 1, limit = 24 } = req.query
  // Public browsing only ever sees published products — draft/archived items
  // are only visible via GET /api/admin/products (see adminListProducts()
  // below, mounted behind adminGuard).
  const where = { status: 'published' }

  if (category) {
    // Category is stored by slug on the frontend but referenced by id on
    // Product rows, so resolve slug -> Category.id first.
    const cat = await prisma.category.findUnique({ where: { slug: category } })
    if (cat) where.categoryId = cat.id
  }
  if (tag) where.tags = { has: tag }
  if (available === 'true') where.available = true
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { tags: { has: search } },
    ]
  }

  const sortMap = {
    'price-asc': { rentalPrice: 'asc' },
    'price-desc': { rentalPrice: 'desc' },
    rating: { rating: 'desc' },
    newest: { createdAt: 'desc' },
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: { select: CATEGORY_SELECT } },
      // Default (no ?sort= given): newest first, so a product an admin just
      // added shows up at the very front of every grid immediately — see
      // IMPLEMENTATION_NOTES.md's "automatic sequencing" note.
      orderBy: sortMap[sort] || { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    }),
    prisma.product.count({ where }),
  ])

  res.json({ products: withIds(products), total, page: Number(page), pages: Math.ceil(total / Number(limit)) })
}

export async function getProduct(req, res) {
  const product = await prisma.product.findUnique({ where: { id: req.params.id }, include: { category: { select: CATEGORY_SELECT } } })
  if (!product) return res.status(404).json({ message: 'Product not found' })
  res.json({ product: withId(product) })
}

export async function getRelatedProducts(req, res) {
  const product = await prisma.product.findUnique({ where: { id: req.params.id } })
  if (!product) return res.status(404).json({ message: 'Product not found' })
  const related = await prisma.product.findMany({
    where: { categoryId: product.categoryId, id: { not: product.id } },
    take: 8,
  })
  res.json({ products: withIds(related) })
}

export async function addReview(req, res) {
  const { rating, comment } = req.body
  const product = await prisma.product.findUnique({ where: { id: req.params.id } })
  if (!product) return res.status(404).json({ message: 'Product not found' })

  const reviews = [...(Array.isArray(product.reviews) ? product.reviews : []), {
    userId: req.user._id,
    name: req.user.name,
    rating,
    comment,
    createdAt: new Date().toISOString(),
  }]
  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length

  const updated = await prisma.product.update({ where: { id: product.id }, data: { reviews, rating: avgRating } })
  res.status(201).json({ reviews: updated.reviews, rating: updated.rating })
}

// --- Admin ---

// GET /api/admin/products — the CMS product list. Unlike the public
// listProducts() above, this sees every status (draft/published/archived)
// and supports ?status= filtering plus the same search/category/pagination
// params, for the admin panel's product table.
export async function adminListProducts(req, res) {
  const { category, status, search, page = 1, limit = 20 } = req.query
  const where = {}
  if (status) where.status = status
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { tags: { has: search } },
    ]
  }
  if (category) {
    const cat = await prisma.category.findUnique({ where: { slug: category } })
    if (cat) where.categoryId = cat.id
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: { select: CATEGORY_SELECT } },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    }),
    prisma.product.count({ where }),
  ])
  res.json({ products: withIds(products), total, page: Number(page), pages: Math.ceil(total / Number(limit)) })
}

export async function createProduct(req, res) {
  const { stock, sizeStock, lowStockThreshold, category, ...productPayload } = req.body
  const initialSizeStock = Array.isArray(sizeStock)
    ? sizeStock
        .filter((row) => row && row.size)
        .map((row) => ({ size: String(row.size), quantity: Math.max(0, Number(row.quantity || 0)) }))
    : []
  const product = await prisma.product.create({
    data: {
      ...productPayload,
      categoryId: category,
      stock: initialSizeStock.length ? initialSizeStock.reduce((sum, row) => sum + row.quantity, 0) : Number(stock ?? 1),
      sizeStock: initialSizeStock,
      lowStockThreshold: Number(lowStockThreshold ?? 2),
    },
  })
  await upsertInventoryFromProduct(product)
  res.status(201).json({ product: withId(product) })
}

export async function updateProduct(req, res) {
  // Inventory is now managed from /admin/inventory. Product edits
  // deliberately do not overwrite total/reserved/damaged stock.
  const { stock, sizeStock, lowStockThreshold, category, ...productPayload } = req.body
  const data = { ...productPayload }
  if (category) data.categoryId = category

  let product
  try {
    product = await prisma.product.update({ where: { id: req.params.id }, data })
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ message: 'Product not found' })
    throw err
  }
  if (typeof lowStockThreshold === 'number') {
    await prisma.inventoryItem.updateMany({ where: { productId: product.id }, data: { lowStockThreshold: Math.max(0, Math.trunc(lowStockThreshold)) } })
  }
  res.json({ product: withId(product) })
}

// PUT /api/products/:id/stock — dedicated inventory endpoint so the admin
// Media/Inventory screen can adjust stock without resending the whole
// product form. Accepts either { stock } (single pooled count) or
// { sizeStock: [{ size, quantity }] } (per-size). `available` is derived
// automatically from whichever is provided, so the public site's "Reserved"
// badge (see frontend ProductCard.jsx) stays correct without a separate admin toggle.
export async function updateStock(req, res) {
  const { stock, sizeStock, lowStockThreshold } = req.body
  const product = await prisma.product.findUnique({ where: { id: req.params.id } })
  if (!product) return res.status(404).json({ message: 'Product not found' })

  const existing = await prisma.inventoryItem.findUnique({ where: { productId: product.id } })
  if (!existing) await upsertInventoryFromProduct(product)

  const inventory = await prisma.inventoryItem.findUnique({ where: { productId: product.id } })
  if (Array.isArray(sizeStock)) {
    const oldRows = Array.isArray(inventory?.sizeStock) ? inventory.sizeStock : []
    const rows = sizeStock.map((row) => {
      const old = oldRows.find((r) => r?.size === row.size)
      const totalUnits = Math.max(0, Number(row.quantity || 0))
      return {
        size: String(row.size),
        totalUnits,
        reservedUnits: Math.min(totalUnits, Math.max(0, Number(old?.reservedUnits || 0))),
        damagedUnits: Math.min(totalUnits, Math.max(0, Number(old?.damagedUnits || 0))),
      }
    })
    const reservedUnits = rows.reduce((s, r) => s + r.reservedUnits, 0)
    const damagedUnits = rows.reduce((s, r) => s + r.damagedUnits, 0)
    await prisma.inventoryItem.update({
      where: { productId: product.id },
      data: {
        sizeStock: rows,
        totalUnits: rows.reduce((s, r) => s + r.totalUnits, 0),
        reservedUnits,
        damagedUnits,
        lowStockThreshold: Number(lowStockThreshold ?? inventory?.lowStockThreshold ?? 2),
      },
    })
  } else if (typeof stock === 'number') {
    const safeTotal = Math.max(stock, inventory?.reservedUnits || 0, inventory?.damagedUnits || 0)
    await prisma.inventoryItem.update({ where: { productId: product.id }, data: { totalUnits: safeTotal, lowStockThreshold: Number(lowStockThreshold ?? inventory?.lowStockThreshold ?? 2) } })
  } else if (typeof lowStockThreshold === 'number') {
    await prisma.inventoryItem.update({ where: { productId: product.id }, data: { lowStockThreshold } })
  }

  const fresh = await prisma.inventoryItem.findUnique({ where: { productId: product.id } })
  const available = Math.max(0, fresh.totalUnits - fresh.reservedUnits - fresh.damagedUnits)
  const data = { stock: available, available: available > 0 }
  if (Array.isArray(sizeStock)) data.sizeStock = sizeStock.map((row) => ({ size: row.size, quantity: Number(row.quantity || 0) }))
  if (typeof lowStockThreshold === 'number') data.lowStockThreshold = lowStockThreshold
  const updated = await prisma.product.update({ where: { id: product.id }, data })
  res.json({ product: withId(updated) })
}

export async function deleteProduct(req, res) {
  try {
    // InventoryItem is cascade-deleted automatically (see prisma/schema.prisma's
    // onDelete: Cascade on InventoryItem.product) — InventoryMovement audit
    // rows deliberately have NO foreign key, so that history survives.
    await prisma.product.delete({ where: { id: req.params.id } })
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ message: 'Product not found' })
    throw err
  }
  res.json({ message: 'Product deleted' })
}
