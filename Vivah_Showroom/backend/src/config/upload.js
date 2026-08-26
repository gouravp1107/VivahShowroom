// ============================================================================
// config/upload.js — file upload handling via Multer, used by every admin
// image upload in the CMS (products, banners, gallery, category images —
// see routes/mediaRoutes.js's POST /api/media/upload, the single shared
// upload endpoint every admin image field in the frontend posts to).
//
// BEHAVIOR:
//   - If CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET are set (see backend/.env),
//     uploads stream straight to Cloudinary via multer-storage-cloudinary —
//     this is what makes images survive a Render redeploy/restart.
//   - Otherwise, falls back to local disk storage under uploads/ (fine for
//     local development only — Render's filesystem is ephemeral).
//
// Only JPG/JPEG/PNG/WEBP are accepted, capped at 5MB per file, matching the
// master prompt's "Supported image types" section.
// ============================================================================
import multer from 'multer'
import path from 'path'
import { configureCloudinary } from './cloudinary.js'

function fileFilter(req, file, cb) {
  const allowed = /jpeg|jpg|png|webp/
  const ok = allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype)
  cb(ok ? null : new Error('Only JPG, JPEG, PNG and WEBP image files are allowed'), ok)
}

const cloudinary = configureCloudinary()

let storage
if (cloudinary) {
  // Lazily import so the app still boots if multer-storage-cloudinary isn't
  // installed yet and Cloudinary env vars simply aren't set (see the
  // disk-storage fallback below in that case).
  const { CloudinaryStorage } = await import('multer-storage-cloudinary')
  storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: 'vivah-showroom',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      // Keep the original aspect ratio; just cap max dimensions so huge
      // phone-camera uploads don't bloat storage/bandwidth.
      transformation: [{ width: 2000, height: 2000, crop: 'limit' }],
    },
  })
  console.log('Image uploads: using Cloudinary (persistent storage)')
} else {
  storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`),
  })
  console.log('Image uploads: using local disk storage (set CLOUDINARY_* env vars for production).')
}

export const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }) // 5MB max per file
export const usingCloudinary = Boolean(cloudinary)
