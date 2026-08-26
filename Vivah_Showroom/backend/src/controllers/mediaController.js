// ============================================================================
// controllers/mediaController.js — the ONE shared image upload endpoint
// every admin image field in the CMS posts to (products, banners, gallery,
// category art). This is what makes "upload an image" work like Google
// Drive from the admin's point of view: pick a file -> it uploads -> you get
// back a URL to attach to whatever you're editing -> it shows up in the
// Media Library to reuse or delete later.
//
// CONNECTS TO: config/upload.js (Multer + Cloudinary/disk storage engine,
// already wired as middleware on the routes in routes/mediaRoutes.js),
// prisma/schema.prisma's Media model (the browsable record of every upload).
// ============================================================================
import { v2 as cloudinary } from 'cloudinary'
import prisma from '../lib/prisma.js'
import { withId, withIds } from '../utils/serialize.js'
import { usingCloudinary } from '../config/upload.js'

// POST /api/media/upload — expects a single multipart field named "image"
// (see routes/mediaRoutes.js's upload.single('image')). By the time this
// handler runs, Multer has ALREADY uploaded the file (to Cloudinary or
// local disk, per config/upload.js) — req.file holds the result either way.
export async function uploadMedia(req, res) {
  if (!req.file) return res.status(400).json({ message: 'No image file was received' })

  // multer-storage-cloudinary sets req.file.path to the full Cloudinary URL
  // and req.file.filename to its public_id; local disk storage instead sets
  // req.file.filename to the saved filename, so the URL has to be built
  // manually pointing at the /uploads static route (see app.js).
  const url = usingCloudinary ? req.file.path : `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`
  const publicId = usingCloudinary ? req.file.filename : null

  const media = await prisma.media.create({
    data: {
      url,
      publicId,
      filename: req.file.originalname,
      usedIn: req.body.usedIn || null,
      uploadedById: req.user._id,
    },
  })

  res.status(201).json({ media: withId(media) })
}

// GET /api/media — the admin Media Library's browse view, newest first.
export async function listMedia(req, res) {
  const { usedIn, page = 1, limit = 40 } = req.query
  const where = usedIn ? { usedIn } : {}
  const [media, total] = await Promise.all([
    prisma.media.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    }),
    prisma.media.count({ where }),
  ])
  res.json({ media: withIds(media), total })
}

// DELETE /api/media/:id — removes the Media record AND, if this was a
// Cloudinary upload, the actual file from Cloudinary too (so deleting from
// the library doesn't leave orphaned storage behind). If a product/banner/
// gallery item still references this image's URL, that reference is left
// as-is — the admin should replace it there first; this endpoint only
// manages the Media Library entry + the underlying file.
export async function deleteMedia(req, res) {
  const media = await prisma.media.findUnique({ where: { id: req.params.id } })
  if (!media) return res.status(404).json({ message: 'Media item not found' })

  if (media.publicId && usingCloudinary) {
    try {
      await cloudinary.uploader.destroy(media.publicId)
    } catch (err) {
      console.warn('Cloudinary delete failed (continuing to remove the library record):', err.message)
    }
  }

  await prisma.media.delete({ where: { id: media.id } })
  res.json({ message: 'Image deleted' })
}
