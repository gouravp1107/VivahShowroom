// Owner/admin-only inventory API. Inventory and the product catalog now
// share the same PostgreSQL database (they used to be split across
// Postgres/MongoDB) — productId is a real foreign key to Product.id (see
// prisma/schema.prisma's InventoryItem model).
//
// Every write here (create/update/adjust/delete) also writes an
// InventoryMovement row (see prisma/schema.prisma) capturing who made the
// change, what changed, and when — the mandatory audit trail. Reads of that
// trail are exposed via GET /:productId/history, admin-only like everything
// else in this router (adminGuard is applied to the whole router below, and
// adminSessionGuard specifically rejects any token that isn't the CURRENT
// checked-out admin session — see middleware/auth.js — so a normal User
// Login token, or a stale/logged-out admin token, is refused by the
// backend itself even if someone calls these APIs directly).
import { Router } from 'express'
import { adminGuard } from '../middleware/auth.js'
import prisma from '../lib/prisma.js'
import { withAvailable, availableForItem, cleanSizeRows } from '../services/inventoryService.js'

const router = Router()
router.use(...adminGuard)

function normalizeSizeRows(rows) {
  if (!Array.isArray(rows)) return []
  return rows
    .filter((row) => row && row.size)
    .map((row) => ({
      size: String(row.size),
      totalUnits: Math.max(0, Number(row.totalUnits ?? row.quantity ?? 0)),
      reservedUnits: Math.max(0, Number(row.reservedUnits ?? 0)),
      damagedUnits: Math.max(0, Number(row.damagedUnits ?? 0)),
    }))
}

async function productMap(ids) {
  const products = await prisma.product.findMany({
    where: { id: { in: ids } },
    include: { category: { select: { id: true, name: true, slug: true, group: true } } },
  })
  return new Map(products.map((p) => [String(p.id), p]))
}

function mapRow(item, products) {
  const product = products.get(item.productId)
  return withAvailable({
    ...item,
    product: product ? {
      _id: product.id,
      name: product.name,
      slug: product.slug,
      status: product.status,
      rentalPrice: product.rentalPrice,
      images: product.images,
      category: product.category ? { ...product.category, _id: product.category.id } : null,
    } : null,
  })
}

// Writes one immutable audit row. Never let a logging failure silently
// swallow a real inventory error, but also never let it block the response
// if the write itself already succeeded — logging failures are caught and
// reported to the server console instead.
async function logMovement(req, { productId, action, field = null, previousValue = null, newValue = null, reason = null }) {
  try {
    await prisma.inventoryMovement.create({
      data: {
        productId: String(productId),
        action,
        field,
        previousValue: previousValue === null ? undefined : previousValue,
        newValue: newValue === null ? undefined : newValue,
        adminId: String(req.user._id),
        adminEmail: req.user.email,
        reason: reason || null,
      },
    })
  } catch (err) {
    console.error('Failed to write InventoryMovement audit record:', err)
  }
}

router.get('/', async (req, res) => {
  const items = await prisma.inventoryItem.findMany({ orderBy: { updatedAt: 'desc' } })
  const products = await productMap(items.map((i) => i.productId))
  let inventory = items.map((item) => mapRow(item, products))
  if (req.query.lowStock === '1') inventory = inventory.filter((item) => item.lowStock)
  if (req.query.category) inventory = inventory.filter((item) => String(item.product?.category?._id || item.product?.category) === req.query.category)
  if (req.query.search) {
    const q = String(req.query.search).toLowerCase()
    inventory = inventory.filter((item) => `${item.product?.name || ''} ${item.sku || ''}`.toLowerCase().includes(q))
  }
  if (req.query.sort) {
    const [field, dir] = String(req.query.sort).split(':')
    const mul = dir === 'desc' ? -1 : 1
    inventory = [...inventory].sort((a, b) => {
      const av = field === 'name' ? a.product?.name || '' : field === 'sku' ? a.sku || '' : field === 'updatedAt' ? a.updatedAt : a.availableUnits
      const bv = field === 'name' ? b.product?.name || '' : field === 'sku' ? b.sku || '' : field === 'updatedAt' ? b.updatedAt : b.availableUnits
      return av > bv ? mul : av < bv ? -mul : 0
    })
  }
  res.json({ inventory })
})

router.get('/summary', async (req, res) => {
  const items = await prisma.inventoryItem.findMany()
  const mapped = items.map(withAvailable)
  res.json({
    totalItems: mapped.length,
    totalUnits: mapped.reduce((sum, item) => sum + item.totalUnits, 0),
    reservedUnits: mapped.reduce((sum, item) => sum + item.reservedUnits, 0),
    damagedUnits: mapped.reduce((sum, item) => sum + item.damagedUnits, 0),
    availableUnits: mapped.reduce((sum, item) => sum + item.availableUnits, 0),
    lowStockCount: mapped.filter((item) => item.lowStock).length,
  })
})

router.get('/:productId', async (req, res) => {
  const item = await prisma.inventoryItem.findUnique({ where: { productId: req.params.productId } })
  if (!item) return res.status(404).json({ message: 'No inventory record for this product yet.' })
  const products = await productMap([item.productId])
  res.json({ inventory: mapRow(item, products) })
})

// GET /api/inventory/:productId/history — the audit log for one product,
// newest first. Admin-only (adminGuard above); no route anywhere lets a
// normal user read or write these records.
router.get('/:productId/history', async (req, res) => {
  const movements = await prisma.inventoryMovement.findMany({
    where: { productId: req.params.productId },
    orderBy: { createdAt: 'desc' },
    take: Math.min(200, Number(req.query.limit) || 100),
  })
  res.json({ history: movements })
})

// Shared create/update logic used by both POST / (explicit create) and
// PUT /:productId (create-or-update / "upsert"). Kept as one function so
// the audit trail, validation, and Product-sync logic can't drift apart
// between the two entry points.
async function createOrUpdateInventory(req, res, { requireNew = false } = {}) {
  const productId = req.params.productId || req.body.productId
  if (!productId) return res.status(400).json({ message: 'productId is required.' })

  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product) return res.status(404).json({ message: 'Product not found' })

  const existing = await prisma.inventoryItem.findUnique({ where: { productId: String(product.id) } })
  if (requireNew && existing) {
    return res.status(409).json({ message: 'Inventory already exists for this product — use PUT to edit it.' })
  }

  const suppliedSizes = req.body.sizeStock !== undefined ? normalizeSizeRows(req.body.sizeStock) : null
  const sizeRows = suppliedSizes
    ? suppliedSizes.map((row) => {
        const old = cleanSizeRows(existing?.sizeStock).find((r) => r.size === row.size)
        return {
          ...row,
          reservedUnits: Math.min(row.totalUnits, Number(old?.reservedUnits || 0)),
          damagedUnits: Math.min(Math.max(0, row.totalUnits - Number(old?.reservedUnits || 0)), Number(old?.damagedUnits || 0)),
        }
      })
    : cleanSizeRows(existing?.sizeStock)

  let totalUnits = Number(req.body.totalUnits ?? existing?.totalUnits ?? product.stock ?? 0)
  let reservedUnits = Number(req.body.reservedUnits ?? existing?.reservedUnits ?? 0)
  let damagedUnits = Number(req.body.damagedUnits ?? existing?.damagedUnits ?? 0)
  if (suppliedSizes) {
    totalUnits = sizeRows.reduce((sum, row) => sum + row.totalUnits, 0)
    reservedUnits = sizeRows.reduce((sum, row) => sum + row.reservedUnits, 0)
    damagedUnits = sizeRows.reduce((sum, row) => sum + row.damagedUnits, 0)
  }

  totalUnits = Math.max(0, Math.trunc(totalUnits))
  reservedUnits = Math.max(0, Math.trunc(reservedUnits))
  damagedUnits = Math.max(0, Math.trunc(damagedUnits))
  if (reservedUnits + damagedUnits > totalUnits) {
    return res.status(400).json({ message: 'Reserved + damaged units cannot exceed total units.' })
  }

  const item = await prisma.inventoryItem.upsert({
    where: { productId: String(product.id) },
    update: {
      sku: req.body.sku === undefined ? existing?.sku ?? null : (req.body.sku || null),
      totalUnits,
      reservedUnits,
      damagedUnits,
      lowStockThreshold: Math.max(0, Math.trunc(Number(req.body.lowStockThreshold ?? existing?.lowStockThreshold ?? 2))),
      location: req.body.location === undefined ? existing?.location ?? null : (req.body.location || null),
      costPrice: req.body.costPrice === undefined ? existing?.costPrice ?? null : (req.body.costPrice === null || req.body.costPrice === '' ? null : Number(req.body.costPrice)),
      notes: req.body.notes === undefined ? existing?.notes ?? null : (req.body.notes || null),
      sizeStock: sizeRows.length ? sizeRows : null,
    },
    create: {
      productId: String(product.id),
      sku: req.body.sku || null,
      totalUnits,
      reservedUnits,
      damagedUnits,
      lowStockThreshold: Math.max(0, Math.trunc(Number(req.body.lowStockThreshold ?? 2))),
      location: req.body.location || null,
      costPrice: req.body.costPrice === null || req.body.costPrice === '' || req.body.costPrice === undefined ? null : Number(req.body.costPrice),
      notes: req.body.notes || null,
      sizeStock: sizeRows.length ? sizeRows : null,
    },
  })

  await prisma.product.update({
    where: { id: product.id },
    data: {
      stock: withAvailable(item).availableUnits,
      available: withAvailable(item).availableUnits > 0,
      ...(sizeRows.length ? { sizeStock: sizeRows.map((row) => ({ size: row.size, quantity: Math.max(0, row.totalUnits - row.reservedUnits - row.damagedUnits) })) } : {}),
    },
  })

  await logMovement(req, {
    productId: product.id,
    action: existing ? 'update' : 'create',
    previousValue: existing ? { totalUnits: existing.totalUnits, reservedUnits: existing.reservedUnits, damagedUnits: existing.damagedUnits, sku: existing.sku } : null,
    newValue: { totalUnits, reservedUnits, damagedUnits, sku: item.sku },
    reason: req.body.reason,
  })

  const products = await productMap([item.productId])
  res.status(existing ? 200 : 201).json({ inventory: mapRow(item, products) })
}

// POST /api/inventory — explicit "add a new inventory item" (requires
// productId in the body and 409s if inventory already exists for it).
router.post('/', (req, res) => createOrUpdateInventory(req, res, { requireNew: true }))

// PUT /api/inventory/:productId — create-or-update ("upsert"), the primary
// entry point the admin UI uses for both "Add" and "Edit".
router.put('/:productId', (req, res) => createOrUpdateInventory(req, res))

async function adjustStock(req, res) {
  const { field, delta, reason } = req.body
  if (!['totalUnits', 'reservedUnits', 'damagedUnits'].includes(field) || !Number.isInteger(Number(delta))) {
    return res.status(400).json({ message: 'field must be totalUnits, reservedUnits, or damagedUnits and delta must be an integer.' })
  }

  const item = await prisma.inventoryItem.findUnique({ where: { productId: req.params.productId } })
  if (!item) return res.status(404).json({ message: 'No inventory record for this product yet.' })

  const next = {
    totalUnits: item.totalUnits,
    reservedUnits: item.reservedUnits,
    damagedUnits: item.damagedUnits,
  }
  next[field] += Number(delta)
  if (next.totalUnits < 0 || next.reservedUnits < 0 || next.damagedUnits < 0 || next.reservedUnits + next.damagedUnits > next.totalUnits) {
    return res.status(400).json({ message: 'That adjustment would create an invalid inventory count.' })
  }

  const previousValue = item[field]
  const updated = await prisma.inventoryItem.update({ where: { productId: req.params.productId }, data: { [field]: Number(delta) < 0 ? { decrement: Math.abs(Number(delta)) } : { increment: Number(delta) } } })
  const available = availableForItem(updated)
  await prisma.product.update({ where: { id: req.params.productId }, data: { stock: available, available: available > 0 } })

  await logMovement(req, {
    productId: req.params.productId,
    action: 'adjust',
    field,
    previousValue,
    newValue: updated[field],
    reason,
  })

  const products = await productMap([updated.productId])
  res.json({ inventory: mapRow(updated, products) })
}

// PATCH /api/inventory/:productId/adjust — the original stock-adjustment
// endpoint (increment/decrement one field by a signed delta).
router.patch('/:productId/adjust', adjustStock)
// POST /api/inventory/:productId/stock — same operation, alternate verb/path
// to match the spec's documented API surface. Both stay in sync since they
// share adjustStock() above.
router.post('/:productId/stock', adjustStock)

router.delete('/:productId', async (req, res) => {
  const existing = await prisma.inventoryItem.findUnique({ where: { productId: req.params.productId } })
  try {
    await prisma.inventoryItem.delete({ where: { productId: req.params.productId } })
    await logMovement(req, {
      productId: req.params.productId,
      action: 'delete',
      previousValue: existing ? { totalUnits: existing.totalUnits, reservedUnits: existing.reservedUnits, damagedUnits: existing.damagedUnits, sku: existing.sku } : null,
      newValue: null,
      reason: req.body?.reason,
    })
    res.json({ message: 'Inventory record deleted' })
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ message: 'Inventory record not found.' })
    throw err
  }
})

export default router
