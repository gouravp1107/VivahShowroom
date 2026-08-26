// ============================================================================
// controllers/adminController.js — logic for /api/admin/* routes (see
// routes/adminRoutes.js — EVERYTHING under /api/admin requires both
// `protect` AND `adminOnly`, applied once via router.use() rather than
// per-route). This is the backend for an admin dashboard's overview page —
// no matching frontend UI is built in this project, but any admin panel
// could call GET /api/admin/dashboard to render the stat cards a typical
// e-commerce dashboard shows (total customers, products, orders, etc).
// ============================================================================
import prisma from '../lib/prisma.js'
import { withIds } from '../utils/serialize.js'
import { toSafeUser } from '../utils/userAuth.js'

// GET /api/admin/dashboard — a handful of at-a-glance counts, all run in
// PARALLEL via Promise.all() rather than one at a time, since none of
// these queries depend on each other's results.
export async function dashboardStats(req, res) {
  const [customers, products, orders, pendingAppointments, unreadMessages, revenueAgg] = await Promise.all([
    prisma.user.count({ where: { role: 'customer' } }),
    prisma.product.count(),
    prisma.order.count(),
    prisma.appointment.count({ where: { status: 'requested' } }),
    prisma.message.count({ where: { status: 'new' } }),
    prisma.order.aggregate({ where: { paymentStatus: 'paid' }, _sum: { grandTotal: true } }),
  ])

  res.json({
    customers,
    products,
    orders,
    pendingAppointments,
    unreadMessages,
    revenue: revenueAgg._sum.grandTotal || 0,
  })
}

export async function listCustomers(req, res) {
  const customers = await prisma.user.findMany({ where: { role: 'customer' }, orderBy: { createdAt: 'desc' } })
  res.json({ customers: withIds(customers.map(toSafeUser)) })
}
