// ============================================================================
// config/cloudinary.js — optional production image hosting setup.
// Cloudinary is NOT used by default (see config/upload.js, which uses local
// disk storage out of the box) — this file just prepares the Cloudinary SDK
// so it's a one-line swap to enable once you have a Cloudinary account.
//
// TO ACTUALLY ENABLE IT:
//   1. Set CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET
//      in backend/.env (see .env.example).
//   2. Call configureCloudinary() somewhere at startup (e.g. in server.js).
//   3. In config/upload.js, replace the multer.diskStorage(...) call with
//      a CloudinaryStorage instance from the `multer-storage-cloudinary`
//      package (not currently installed — add it with npm install first),
//      using the `cloudinary` instance returned here.
// ============================================================================
import { v2 as cloudinary } from 'cloudinary'

// Returns null (does nothing) if Cloudinary env vars aren't set, so calling
// this is always safe even if you haven't set up Cloudinary yet.
export function configureCloudinary() {
  if (!process.env.CLOUDINARY_CLOUD_NAME) return null
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })
  return cloudinary
}
