// ============================================================================
// routes/mediaRoutes.js — mounted at /api/media in app.js. The single
// shared upload endpoint for every admin image field in the CMS.
//   POST   /api/media/upload -> uploadMedia() (admin panel session only, multipart field "image")
//   GET    /api/media        -> listMedia()   (admin panel session only — Media Library browse)
//   DELETE /api/media/:id    -> deleteMedia() (admin panel session only)
// ============================================================================
import { Router } from 'express'
import { adminGuard } from '../middleware/auth.js'
import { upload } from '../config/upload.js'
import { uploadMedia, listMedia, deleteMedia } from '../controllers/mediaController.js'

const router = Router()

router.use(...adminGuard)
router.post('/upload', upload.single('image'), uploadMedia)
router.get('/', listMedia)
router.delete('/:id', deleteMedia)

export default router
