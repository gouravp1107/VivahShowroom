// ============================================================================
// controllers/userController.js — logic for /api/users/* routes (see
// routes/userRoutes.js — every one of these routes requires `protect`
// middleware first, so req.user is always the currently logged-in user;
// there's no "look up any user by id" here, only "act on MYSELF").
//
// CONNECTS TO:
//   - prisma/schema.prisma's User model -> reads/writes the logged-in
//     user's row. `addresses` is a JSONB array (was an embedded Mongoose
//     subdocument array with its own _id per entry) — each address gets an
//     app-generated id here (crypto.randomUUID()) instead of a Mongo
//     ObjectId, used the same way for later deleteAddress() lookups.
//   - frontend: NOT currently called by the frontend at all — profile
//     editing, address management, and server-synced wishlist are built
//     here on the backend but pages/Profile.jsx's "Saved Addresses" link
//     is still a placeholder, and the frontend's wishlist lives only in
//     localStorage via ShowroomContext.jsx rather than calling
//     toggleWishlist/getWishlist below. Wiring either up would follow the
//     same fetch-then-render pattern as pages/Wishlist.jsx already uses
//     for the local version.
// ============================================================================
import crypto from 'crypto'
import prisma from '../lib/prisma.js'
import { hashPassword, comparePassword, toSafeUser } from '../utils/userAuth.js'
import { withId, withIds } from '../utils/serialize.js'

// PUT /api/users/profile — updates name/phone only (email is immutable
// here; changing it would need its own re-verification flow).
export async function updateProfile(req, res) {
  const { name, phone } = req.body
  const data = {}
  if (name) data.name = name
  if (phone) data.phone = phone
  const user = await prisma.user.update({ where: { id: req.user._id }, data })
  res.json({ user: withId(toSafeUser(user)) })
}

export async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body
  const user = await prisma.user.findUnique({ where: { id: req.user._id } })
  if (!(await comparePassword(currentPassword, user.password))) {
    return res.status(400).json({ message: 'Current password is incorrect' })
  }
  await prisma.user.update({ where: { id: user.id }, data: { password: await hashPassword(newPassword) } })
  res.json({ message: 'Password updated successfully' })
}

export async function addAddress(req, res) {
  const user = await prisma.user.findUnique({ where: { id: req.user._id } })
  const addresses = [...(Array.isArray(user.addresses) ? user.addresses : []), { id: crypto.randomUUID(), ...req.body }]
  const updated = await prisma.user.update({ where: { id: user.id }, data: { addresses } })
  res.status(201).json({ addresses: updated.addresses })
}

export async function deleteAddress(req, res) {
  const user = await prisma.user.findUnique({ where: { id: req.user._id } })
  const addresses = (Array.isArray(user.addresses) ? user.addresses : []).filter((a) => a.id !== req.params.addressId)
  const updated = await prisma.user.update({ where: { id: user.id }, data: { addresses } })
  res.json({ addresses: updated.addresses })
}

// POST /api/users/wishlist/toggle — adds the product if not already
// wishlisted, removes it if it is (same toggle behavior as the frontend's
// local-only toggleWishlist() in ShowroomContext.jsx, just persisted to
// PostgreSQL instead of localStorage).
export async function toggleWishlist(req, res) {
  const user = await prisma.user.findUnique({ where: { id: req.user._id } })
  const { productId } = req.body
  const has = user.wishlist.includes(productId)
  const wishlist = has ? user.wishlist.filter((id) => id !== productId) : [...user.wishlist, productId]
  const updated = await prisma.user.update({ where: { id: user.id }, data: { wishlist } })
  res.json({ wishlist: updated.wishlist })
}

export async function getWishlist(req, res) {
  const user = await prisma.user.findUnique({ where: { id: req.user._id } })
  if (!user.wishlist.length) return res.json({ wishlist: [] })
  const products = await prisma.product.findMany({ where: { id: { in: user.wishlist } } })
  res.json({ wishlist: withIds(products) })
}
