// ============================================================================
// routes/productRoutes.js — mounted at /api/products in app.js.
//   GET    /api/products              -> listProducts()      (public — browsing/search/filter)
//   GET    /api/products/:id          -> getProduct()        (public — product detail)
//   GET    /api/products/:id/related  -> getRelatedProducts()(public)
//   POST   /api/products/:id/reviews  -> addReview()         (requires login)
//   POST   /api/products              -> createProduct()     (admin panel session only)
//   PUT    /api/products/:id          -> updateProduct()     (admin panel session only)
//   PUT    /api/products/:id/stock    -> updateStock()       (admin panel session only — inventory)
//   DELETE /api/products/:id          -> deleteProduct()     (admin panel session only)
// ============================================================================
import { Router } from 'express'
import { protect, adminGuard } from '../middleware/auth.js'
import {
  listProducts, getProduct, getRelatedProducts, addReview,
  createProduct, updateProduct, updateStock, deleteProduct,
} from '../controllers/productController.js'

const router = Router()

router.get('/', listProducts)
router.get('/:id', getProduct)
router.get('/:id/related', getRelatedProducts)
router.post('/:id/reviews', protect, addReview)

router.post('/', ...adminGuard, createProduct)
router.put('/:id', ...adminGuard, updateProduct)
router.put('/:id/stock', ...adminGuard, updateStock)
router.delete('/:id', ...adminGuard, deleteProduct)

export default router
