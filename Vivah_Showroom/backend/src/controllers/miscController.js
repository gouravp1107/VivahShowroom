// ============================================================================
// controllers/miscController.js — a grab-bag of smaller, less complex
// resources that didn't need their own dedicated controller file: customer
// feedback, contact messages, in-app notifications, homepage banners, and
// gallery photos. See routes/miscRoutes.js for exactly which HTTP
// method+path maps to each function below, and which ones need login/admin.
//
// CALLED BY (frontend): pages/Contact.jsx -> submitMessage (via
// submitContactMessage() in src/api/index.js). The banner/gallery/
// notification endpoints aren't called by the frontend yet — see
// prisma/schema.prisma's Banner/Gallery models comments for what wiring
// them up would look like.
// ============================================================================
import prisma from '../lib/prisma.js'
import { withId, withIds } from '../utils/serialize.js'

// POST /api/feedback — a star rating + comment, optionally tied to an order.
export async function submitFeedback(req, res) {
  const { orderRef, ...rest } = req.body
  const feedback = await prisma.feedback.create({ data: { ...rest, orderRefId: orderRef || null } })
  res.status(201).json({ feedback: withId(feedback) })
}

export async function submitMessage(req, res) {
  const message = await prisma.message.create({ data: req.body })
  res.status(201).json({ message: withId(message) })
}

export async function listMessages(req, res) {
  const messages = await prisma.message.findMany({ orderBy: { createdAt: 'desc' } })
  res.json({ messages: withIds(messages) })
}

export async function myNotifications(req, res) {
  const notifications = await prisma.notification.findMany({ where: { userId: req.user._id }, orderBy: { createdAt: 'desc' } })
  res.json({ notifications: withIds(notifications) })
}

export async function markNotificationRead(req, res) {
  const { count } = await prisma.notification.updateMany({
    where: { id: req.params.id, userId: req.user._id },
    data: { read: true },
  })
  if (!count) return res.status(404).json({ notification: null })
  const notification = await prisma.notification.findUnique({ where: { id: req.params.id } })
  res.json({ notification: withId(notification) })
}

export async function listBanners(req, res) {
  const banners = await prisma.banner.findMany({ where: { isActive: true }, orderBy: [{ order: 'asc' }, { createdAt: 'desc' }] })
  res.json({ banners: withIds(banners) })
}

export async function createBanner(req, res) {
  // Same "guaranteed to sort first" auto-order assignment as
  // createCategory() — see that function's comment for why.
  if (req.body.order === undefined) {
    const lowest = await prisma.banner.findFirst({ orderBy: { order: 'asc' }, select: { order: true } })
    req.body.order = (lowest?.order ?? 0) - 1
  }
  const banner = await prisma.banner.create({ data: req.body })
  res.status(201).json({ banner: withId(banner) })
}

// PUT /api/banners/:id — admin edits/replaces a banner (title, image, link,
// order, active state). Used by the admin Banners/Hero screen's floating
// edit form.
export async function updateBanner(req, res) {
  try {
    const banner = await prisma.banner.update({ where: { id: req.params.id }, data: req.body })
    res.json({ banner: withId(banner) })
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ message: 'Banner not found' })
    throw err
  }
}

export async function deleteBanner(req, res) {
  try {
    await prisma.banner.delete({ where: { id: req.params.id } })
    res.json({ message: 'Banner deleted' })
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ message: 'Banner not found' })
    throw err
  }
}

// GET /api/admin/banners — admin CMS list, includes inactive banners too.
export async function adminListBanners(req, res) {
  const banners = await prisma.banner.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'desc' }] })
  res.json({ banners: withIds(banners) })
}

export async function listGallery(req, res) {
  const gallery = await prisma.gallery.findMany({ where: { isActive: true }, orderBy: [{ order: 'asc' }, { createdAt: 'desc' }] })
  res.json({ gallery: withIds(gallery) })
}

export async function addGalleryImage(req, res) {
  // Same "guaranteed to sort first" auto-order assignment as
  // createCategory() — see that function's comment for why.
  if (req.body.order === undefined) {
    const lowest = await prisma.gallery.findFirst({ orderBy: { order: 'asc' }, select: { order: true } })
    req.body.order = (lowest?.order ?? 0) - 1
  }
  const image = await prisma.gallery.create({ data: req.body })
  res.status(201).json({ image: withId(image) })
}

export async function updateGalleryImage(req, res) {
  try {
    const image = await prisma.gallery.update({ where: { id: req.params.id }, data: req.body })
    res.json({ image: withId(image) })
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ message: 'Gallery image not found' })
    throw err
  }
}

export async function deleteGalleryImage(req, res) {
  try {
    await prisma.gallery.delete({ where: { id: req.params.id } })
    res.json({ message: 'Gallery image deleted' })
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ message: 'Gallery image not found' })
    throw err
  }
}

// GET /api/admin/gallery — admin CMS list, includes hidden gallery items too.
export async function adminListGallery(req, res) {
  const gallery = await prisma.gallery.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'desc' }] })
  res.json({ gallery: withIds(gallery) })
}
