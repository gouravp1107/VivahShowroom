// ============================================================================
// utils/serialize.js — the ENTIRE reason the frontend needed zero changes
// when the database moved from MongoDB to PostgreSQL/Prisma.
//
// Mongoose documents have `_id`; Prisma models have `id`. Every frontend
// component (ProductCard, AdminLogin, ProductsManager, ...) reads `_id`,
// exactly the way any Mongoose-backed React app would. Rather than hunting
// down and rewriting every `.{_id}` reference across ~30 frontend files,
// every controller below wraps its Prisma results in withId()/withIds()
// before res.json(...), which simply mirrors `id` onto `_id` (and does the
// same for any nested relation objects, e.g. Product.category, Order.user).
//
// This is a deliberate compatibility shim, not a coincidence — see
// IMPLEMENTATION_NOTES.md's MERN/Postgres migration section for the full
// reasoning.
// ============================================================================

const RELATION_KEYS = ['category', 'user', 'product', 'heldBy', 'admin', 'uploadedBy', 'orderRef']

export function withId(record) {
  if (!record || typeof record !== 'object') return record
  const out = { ...record, _id: record.id }
  for (const key of RELATION_KEYS) {
    if (out[key] && typeof out[key] === 'object' && !Array.isArray(out[key])) {
      out[key] = withId(out[key])
    }
  }
  return out
}

export function withIds(records) {
  return (records || []).map(withId)
}
