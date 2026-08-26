// ============================================================================
// controllers/orderController.js — logic for /api/orders/* routes (see
// routes/orderRoutes.js — everything here requires login via `protect`).
// This is what frontend/src/pages/RentBooking.jsx's "Confirm Booking" step
// calls after the customer has filled in size/dates/payment mode.
//
// CONNECTS TO: the Order model (what gets saved), the Product model (to
// look up authoritative prices/deposits/stock rather than trusting whatever
// the frontend sends), the Coupon model (server-side discount recheck).
//
// Order.items is stored as a JSONB array (it was an embedded Mongoose
// subdocument array before, never queried independently of its parent
// order) — so unlike Mongoose's `.populate('items.product')`, Prisma won't
// automatically expand `item.product` into a full Product object. This
// file's hydrateOrderItems() does that expansion manually wherever the old
// code relied on populate.
// ============================================================================
import prisma from '../lib/prisma.js'
import { withId, withIds } from '../utils/serialize.js'
import { reserveItems, releaseItems } from '../services/inventoryService.js'

// Replaces Mongoose's `.populate('items.product')` — fetches every distinct
// product referenced across one or more orders' items in a single query,
// then merges the full product object onto each item.
async function hydrateOrderItems(orders) {
  const list = Array.isArray(orders) ? orders : [orders]
  const productIds = [...new Set(list.flatMap((o) => (o.items || []).map((i) => i.product)).filter(Boolean))]
  if (!productIds.length) return orders

  const products = await prisma.product.findMany({ where: { id: { in: productIds } } })
  const byId = new Map(products.map((p) => [p.id, withId(p)]))
  for (const order of list) {
    order.items = (order.items || []).map((item) => ({ ...item, product: byId.get(item.product) || item.product }))
  }
  return orders
}

// POST /api/orders — creates a new rental booking from a list of items plus
// the chosen payment mode (cod/upi/qr) and an optional coupon code. Always
// re-derives prices/deposits/discount from the database rather than fully
// trusting client-sent numbers, and decrements inventory for each item so
// the CMS's stock counts and the public "Reserved" badge stay accurate.
export async function createOrder(req, res) {
  const { items, fulfilment, address, paymentMode, couponCode } = req.body
  if (!items?.length) return res.status(400).json({ message: 'At least one rental item is required' })
  if (!['cod', 'upi', 'qr'].includes(paymentMode)) {
    return res.status(400).json({ message: 'A payment mode (Cash on Delivery, UPI or QR) is required' })
  }

  let subtotal = 0
  let depositTotal = 0
  const resolvedItems = []

  for (const item of items) {
    const product = await prisma.product.findUnique({ where: { id: item.product } })
    if (!product) return res.status(404).json({ message: `Product ${item.product} was not found` })
    const price = item.price || product.rentalPrice
    subtotal += price
    depositTotal += product.deposit
    resolvedItems.push({ ...item, price, deposit: product.deposit })
  }

  // Reserve first so two customers cannot successfully book the same physical unit.
  try {
    await reserveItems(resolvedItems)
  } catch (err) {
    return res.status(409).json({ message: err.message || 'The selected item is no longer available.' })
  }

  let discountAmount = 0
  let appliedCouponCode = null
  try {
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({ where: { code: String(couponCode).toUpperCase().trim() } })
      const usable = coupon && coupon.isActive && (!coupon.expiresAt || coupon.expiresAt.getTime() > Date.now())
        && (!coupon.usageLimit || coupon.usedCount < coupon.usageLimit) && subtotal >= coupon.minOrderAmount
      if (usable) {
        discountAmount = coupon.discountType === 'percent' ? Math.round((subtotal * coupon.discountValue) / 100) : coupon.discountValue
        if (coupon.maxDiscountAmount) discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount)
        discountAmount = Math.min(discountAmount, subtotal)
        appliedCouponCode = coupon.code
        await prisma.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } })
      }
    }

    const order = await prisma.order.create({
      data: {
        userId: req.user._id,
        items: resolvedItems,
        fulfilment,
        address,
        subtotal,
        depositTotal,
        grandTotal: subtotal + depositTotal - discountAmount,
        paymentMode,
        couponCode: appliedCouponCode,
        discountAmount,
        paymentStatus: 'unpaid',
        status: 'pending',
        inventoryReleased: false,
      },
    })

    await hydrateOrderItems(order)
    res.status(201).json({ order: withId(order) })
  } catch (err) {
    // Order creation failed after inventory was reserved; put the units
    // back so inventory never gets stranded.
    await releaseItems(resolvedItems).catch(() => {})
    throw err
  }
}

// POST /api/orders/:id/confirm-payment — placeholder confirmation step for
// UPI/QR bookings until a real payment gateway (Razorpay/PayU/etc.) is
// connected. Marks the order paid + confirmed. Swap this for the gateway's
// webhook/verify-signature handler when credentials are available — the
// booking flow's frontend call site (RentBooking.jsx) stays the same either way.
export async function confirmPayment(req, res) {
  const order = await prisma.order.findUnique({ where: { id: req.params.id } })
  if (!order) return res.status(404).json({ message: 'Order not found' })
  if (order.userId !== req.user._id) {
    return res.status(403).json({ message: 'Not authorized to update this order' })
  }
  const updated = await prisma.order.update({ where: { id: order.id }, data: { paymentStatus: 'paid', status: 'confirmed' } })
  await hydrateOrderItems(updated)
  res.json({ order: withId(updated) })
}

export async function myOrders(req, res) {
  const orders = await prisma.order.findMany({ where: { userId: req.user._id }, orderBy: { createdAt: 'desc' } })
  await hydrateOrderItems(orders)
  res.json({ orders: withIds(orders) })
}

export async function getOrder(req, res) {
  const order = await prisma.order.findUnique({ where: { id: req.params.id } })
  if (!order) return res.status(404).json({ message: 'Order not found' })
  if (order.userId !== req.user._id && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized to view this order' })
  }
  await hydrateOrderItems(order)
  res.json({ order: withId(order) })
}

export async function requestReturn(req, res) {
  try {
    const order = await prisma.order.update({ where: { id: req.params.id }, data: { status: 'return_due' } })
    await hydrateOrderItems(order)
    res.json({ order: withId(order) })
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ message: 'Order not found' })
    throw err
  }
}

// --- Admin ---
export async function listAllOrders(req, res) {
  const { status } = req.query
  const where = status ? { status } : {}
  const orders = await prisma.order.findMany({
    where,
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  })
  await hydrateOrderItems(orders)
  res.json({ orders: withIds(orders) })
}

export async function updateOrderStatus(req, res) {
  const allowed = ['pending', 'confirmed', 'trial_scheduled', 'out_for_delivery', 'in_use', 'return_due', 'returned', 'cancelled']
  if (!allowed.includes(req.body.status)) return res.status(400).json({ message: 'Invalid order status' })

  const order = await prisma.order.findUnique({ where: { id: req.params.id } })
  if (!order) return res.status(404).json({ message: 'Order not found' })

  const data = { status: req.body.status }
  const shouldRelease = ['returned', 'cancelled'].includes(req.body.status) && !order.inventoryReleased
  if (shouldRelease) {
    await releaseItems(order.items)
    data.inventoryReleased = true
  }
  const updated = await prisma.order.update({ where: { id: order.id }, data })
  await hydrateOrderItems(updated)
  res.json({ order: withId(updated) })
}
