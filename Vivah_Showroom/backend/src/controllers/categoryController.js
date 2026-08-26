// ============================================================================
// controllers/categoryController.js — logic for /api/categories/* routes
// (see routes/categoryRoutes.js). The public GET route is used by the
// frontend for the category list; the create/update/delete routes are
// admin-only (see routes/categoryRoutes.js's protect+adminOnly guards) and
// would be used by an admin dashboard UI. See controllers/adminController.js
// for the analytics/dashboard-stats side that also exists.
// ============================================================================
import prisma from '../lib/prisma.js'
import { withId, withIds } from '../utils/serialize.js'

// GET /api/categories — public list of active categories. Ordered newest
// first (createdAt desc) so a category an admin just added shows up at the
// front immediately, rather than waiting on a manual `order` value nobody
// set yet — see IMPLEMENTATION_NOTES.md's "automatic sequencing" note.
export async function listCategories(req, res) {
  const categories = await prisma.category.findMany({ where: { isActive: true }, orderBy: [{ order: 'asc' }, { createdAt: 'desc' }] })
  res.json({ categories: withIds(categories) })
}

// GET /api/admin/categories — admin CMS list, includes inactive categories too.
export async function adminListCategories(req, res) {
  const categories = await prisma.category.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'desc' }] })
  res.json({ categories: withIds(categories) })
}

export async function createCategory(req, res) {
  // Auto-assign `order` one lower than whatever currently sorts first, so
  // a newly created category is GUARANTEED to appear at the very front of
  // every list (Showroom Rail, admin manager, etc.) — not just "usually
  // first because it's newest," which a future manual reorder could break.
  // Only kicks in when the caller didn't explicitly set `order` themselves.
  if (req.body.order === undefined) {
    const lowest = await prisma.category.findFirst({ orderBy: { order: 'asc' }, select: { order: true } })
    req.body.order = (lowest?.order ?? 0) - 1
  }
  const category = await prisma.category.create({ data: req.body })
  res.status(201).json({ category: withId(category) })
}

export async function updateCategory(req, res) {
  try {
    const category = await prisma.category.update({ where: { id: req.params.id }, data: req.body })
    res.json({ category: withId(category) })
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ message: 'Category not found' })
    throw err
  }
}

export async function deleteCategory(req, res) {
  try {
    await prisma.category.delete({ where: { id: req.params.id } })
    res.json({ message: 'Category deleted' })
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ message: 'Category not found' })
    throw err
  }
}
