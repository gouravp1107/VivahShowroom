// ============================================================================
// services/inventoryService.js — owner stock management (InventoryItem/
// InventoryMovement), plus keeping Product.stock/available in sync with it.
// Both InventoryItem and Product now live in the SAME PostgreSQL database
// (they used to be split across Postgres/Mongo) — this file no longer needs
// a cross-database sync step, just Prisma calls against both tables,
// wrapped in transactions where reservation counts must stay consistent.
// ============================================================================
import prisma from '../lib/prisma.js'

export function cleanSizeRows(rows) {
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

export function availableForItem(item) {
  if (!item) return 0
  const available = Number(item.totalUnits || 0) - Number(item.reservedUnits || 0) - Number(item.damagedUnits || 0)
  return Math.max(0, available)
}

export function availableForSize(row) {
  if (!row) return 0
  return Math.max(0, Number(row.totalUnits || 0) - Number(row.reservedUnits || 0) - Number(row.damagedUnits || 0))
}

export function withAvailable(item) {
  if (!item) return item
  const sizeStock = Array.isArray(item.sizeStock)
    ? item.sizeStock.map((row) => ({ ...row, availableUnits: availableForSize(row) }))
    : []
  const availableUnits = sizeStock.length
    ? sizeStock.reduce((sum, row) => sum + row.availableUnits, 0)
    : availableForItem(item)
  return {
    ...item,
    sizeStock,
    availableUnits,
    lowStock: availableUnits <= Number(item.lowStockThreshold || 0),
  }
}

// `product` is a Prisma Product record (accepts either `.id` or a
// Mongo-style `._id` alias, in case a caller passes an already-serialized
// object — see utils/serialize.js).
export async function upsertInventoryFromProduct(product) {
  const productId = String(product?.id ?? product?._id ?? '')
  if (!productId) return null
  const existing = await prisma.inventoryItem.findUnique({ where: { productId } })
  // Inventory becomes authoritative once its record exists. Never overwrite
  // live reservations/physical counts from Product.stock, because Product.stock
  // is the public available count and therefore intentionally smaller after a
  // rental is booked.
  if (existing) return existing

  const sizeRows = cleanSizeRows(product.sizeStock)
  const totalUnits = sizeRows.length
    ? sizeRows.reduce((sum, row) => sum + row.totalUnits, 0)
    : Math.max(0, Number(product.stock || 0))

  return prisma.inventoryItem.create({
    data: {
      productId,
      totalUnits,
      reservedUnits: 0,
      damagedUnits: 0,
      lowStockThreshold: Math.max(0, Number(product.lowStockThreshold ?? 2)),
      sizeStock: sizeRows.length ? sizeRows : null,
    },
  })
}

// Pushes InventoryItem's current counts back onto the Product row (stock/
// available/sizeStock) so public browsing reflects real inventory. Used
// after every reservation/release.
export async function syncPublicProduct(productId) {
  const inventory = await prisma.inventoryItem.findUnique({ where: { productId: String(productId) } })
  if (!inventory) return null

  const rows = cleanSizeRows(inventory.sizeStock)
  const data = rows.length
    ? {
        sizeStock: rows.map((row) => ({ size: row.size, quantity: availableForSize(row) })),
        stock: rows.reduce((sum, row) => sum + availableForSize(row), 0),
      }
    : { stock: availableForItem(inventory) }
  data.available = data.stock > 0

  try {
    return await prisma.product.update({ where: { id: String(productId) }, data })
  } catch (err) {
    if (err.code === 'P2025') return null // product no longer exists
    throw err
  }
}

async function runSerializable(work, attempts = 3) {
  let lastError
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await prisma.$transaction(work, { isolationLevel: 'Serializable' })
    } catch (err) {
      lastError = err
      if (err?.code !== 'P2034' || attempt === attempts) throw err
    }
  }
  throw lastError
}

export async function reserveItems(items) {
  const normalized = items.map((item) => ({ productId: String(item.product), size: item.size || null }))

  await runSerializable(async (tx) => {
    for (const requested of normalized) {
      const inventory = await tx.inventoryItem.findUnique({ where: { productId: requested.productId } })
      if (!inventory) throw new Error(`Inventory record missing for product ${requested.productId}`)

      const rows = cleanSizeRows(inventory.sizeStock)
      if (rows.length) {
        if (!requested.size) throw new Error(`A size is required for product ${requested.productId}`)
        const row = rows.find((r) => r.size === requested.size)
        if (!row || availableForSize(row) < 1) throw new Error(`Selected size is out of stock for product ${requested.productId}`)
        row.reservedUnits += 1
        await tx.inventoryItem.update({
          where: { productId: requested.productId },
          data: { reservedUnits: { increment: 1 }, sizeStock: rows },
        })
      } else {
        if (availableForItem(inventory) < 1) throw new Error(`Product ${requested.productId} is out of stock`)
        await tx.inventoryItem.update({
          where: { productId: requested.productId },
          data: { reservedUnits: { increment: 1 } },
        })
      }
    }
  })

  for (const requested of normalized) await syncPublicProduct(requested.productId)
}

export async function releaseItems(items) {
  await runSerializable(async (tx) => {
    for (const item of items || []) {
      const productId = String(item.product?.id || item.product?._id || item.product || '')
      if (!productId) continue
      const inventory = await tx.inventoryItem.findUnique({ where: { productId } })
      if (!inventory) continue

      const nextReserved = Math.max(0, inventory.reservedUnits - 1)
      const rows = cleanSizeRows(inventory.sizeStock)
      if (rows.length) {
        if (!item.size) continue
        const row = rows.find((r) => r.size === item.size)
        if (!row) continue
        row.reservedUnits = Math.max(0, row.reservedUnits - 1)
        await tx.inventoryItem.update({
          where: { productId },
          data: { reservedUnits: nextReserved, sizeStock: rows },
        })
      } else {
        await tx.inventoryItem.update({
          where: { productId },
          data: { reservedUnits: nextReserved },
        })
      }
    }
  })

  for (const item of items || []) {
    const productId = String(item.product?.id || item.product?._id || item.product || '')
    if (productId) await syncPublicProduct(productId)
  }
}
