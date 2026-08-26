// ============================================================================
// controllers/couponController.js — offers/coupons. Public validateCoupon()
// is called from the Rent Now booking flow's offer step (see
// frontend/src/pages/RentBooking.jsx); the rest are admin CMS CRUD.
// ============================================================================
import prisma from '../lib/prisma.js'
import { withId, withIds } from '../utils/serialize.js'

// GET /api/coupons — public list of currently-usable coupons, so the
// booking flow's "Offers" panel can show what's available without the
// customer needing to already know a code.
export async function listActiveCoupons(req, res) {
  const coupons = await prisma.coupon.findMany({
    where: { isActive: true, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
    select: { id: true, code: true, description: true, discountType: true, discountValue: true, minOrderAmount: true, maxDiscountAmount: true },
  })
  res.json({ coupons: withIds(coupons) })
}

// POST /api/coupons/validate — { code, orderAmount } -> { valid, discountAmount, message }
export async function validateCoupon(req, res) {
  const { code, orderAmount = 0 } = req.body
  if (!code) return res.status(400).json({ valid: false, message: 'Enter a coupon code' })

  const coupon = await prisma.coupon.findUnique({ where: { code: String(code).toUpperCase().trim() } })
  if (!coupon || !coupon.isActive) return res.status(404).json({ valid: false, message: 'Invalid coupon code' })
  if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) {
    return res.status(400).json({ valid: false, message: 'This coupon has expired' })
  }
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    return res.status(400).json({ valid: false, message: 'This coupon has reached its usage limit' })
  }
  if (orderAmount < coupon.minOrderAmount) {
    return res.status(400).json({ valid: false, message: `Minimum order amount is ₹${coupon.minOrderAmount}` })
  }

  let discountAmount = coupon.discountType === 'percent' ? Math.round((orderAmount * coupon.discountValue) / 100) : coupon.discountValue
  if (coupon.maxDiscountAmount) discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount)
  discountAmount = Math.min(discountAmount, orderAmount)

  res.json({ valid: true, code: coupon.code, discountAmount, description: coupon.description })
}

// --- Admin CMS ---
export async function adminListCoupons(req, res) {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } })
  res.json({ coupons: withIds(coupons) })
}

export async function createCoupon(req, res) {
  const coupon = await prisma.coupon.create({ data: { ...req.body, code: String(req.body.code).toUpperCase().trim() } })
  res.status(201).json({ coupon: withId(coupon) })
}

export async function updateCoupon(req, res) {
  const data = { ...req.body }
  if (data.code) data.code = String(data.code).toUpperCase().trim()
  try {
    const coupon = await prisma.coupon.update({ where: { id: req.params.id }, data })
    res.json({ coupon: withId(coupon) })
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ message: 'Coupon not found' })
    throw err
  }
}

export async function deleteCoupon(req, res) {
  try {
    await prisma.coupon.delete({ where: { id: req.params.id } })
    res.json({ message: 'Coupon deleted' })
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ message: 'Coupon not found' })
    throw err
  }
}
