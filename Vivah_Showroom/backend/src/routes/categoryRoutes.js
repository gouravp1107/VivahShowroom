// ============================================================================
// routes/categoryRoutes.js — mounted at /api/categories in app.js.
//   GET    /api/categories     -> listCategories() (public)
//   POST   /api/categories     -> createCategory() (admin panel session only)
//   PUT    /api/categories/:id -> updateCategory() (admin panel session only)
//   DELETE /api/categories/:id -> deleteCategory() (admin panel session only)
// ============================================================================
import { Router } from 'express'
import { adminGuard } from '../middleware/auth.js'
import { listCategories, createCategory, updateCategory, deleteCategory } from '../controllers/categoryController.js'

const router = Router()

router.get('/', listCategories)
router.post('/', ...adminGuard, createCategory)
router.put('/:id', ...adminGuard, updateCategory)
router.delete('/:id', ...adminGuard, deleteCategory)

export default router
