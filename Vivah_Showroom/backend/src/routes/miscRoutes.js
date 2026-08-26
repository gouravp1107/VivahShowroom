// ============================================================================
// routes/miscRoutes.js — mounted at /api (bare — no extra prefix) in
// app.js, so every path below IS the final /api/... path exactly as
// written (e.g. router.post('/feedback', ...) becomes POST /api/feedback).
//   POST   /api/feedback               -> submitFeedback()       (public)
//   POST   /api/contact                -> submitMessage()        (public)
//   GET    /api/contact                -> listMessages()         (admin panel session only)
//   GET    /api/notifications          -> myNotifications()      (requires login)
//   PUT    /api/notifications/:id/read -> markNotificationRead() (requires login)
//   GET    /api/banners                -> listBanners()          (public, active only)
//   POST   /api/banners                -> createBanner()         (admin panel session only)
//   PUT    /api/banners/:id            -> updateBanner()         (admin panel session only)
//   DELETE /api/banners/:id            -> deleteBanner()         (admin panel session only)
//   GET    /api/gallery                -> listGallery()          (public, active only)
//   POST   /api/gallery                -> addGalleryImage()      (admin panel session only)
//   PUT    /api/gallery/:id            -> updateGalleryImage()   (admin panel session only)
//   DELETE /api/gallery/:id            -> deleteGalleryImage()   (admin panel session only)
// ============================================================================
import { Router } from 'express'
import { protect, adminGuard } from '../middleware/auth.js'
import {
  submitFeedback, submitMessage, listMessages, myNotifications, markNotificationRead,
  listBanners, createBanner, updateBanner, deleteBanner,
  listGallery, addGalleryImage, updateGalleryImage, deleteGalleryImage,
} from '../controllers/miscController.js'

const router = Router()

router.post('/feedback', submitFeedback)
router.post('/contact', submitMessage)
router.get('/contact', ...adminGuard, listMessages)

router.get('/notifications', protect, myNotifications)
router.put('/notifications/:id/read', protect, markNotificationRead)

router.get('/banners', listBanners)
router.post('/banners', ...adminGuard, createBanner)
router.put('/banners/:id', ...adminGuard, updateBanner)
router.delete('/banners/:id', ...adminGuard, deleteBanner)

router.get('/gallery', listGallery)
router.post('/gallery', ...adminGuard, addGalleryImage)
router.put('/gallery/:id', ...adminGuard, updateGalleryImage)
router.delete('/gallery/:id', ...adminGuard, deleteGalleryImage)

export default router
