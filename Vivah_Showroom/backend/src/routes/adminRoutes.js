// ============================================================================
// routes/adminRoutes.js — mounted at /api/admin in app.js.
// router.use(...adminGuard) below applies to EVERY route in this file at
// once — protect (logged in) + adminOnly (role check) + adminSessionGuard
// (must be the currently checked-out /admin session — see
// prisma/schema.prisma's AdminLock model and middleware/auth.js).
//   GET /api/admin/dashboard -> dashboardStats() (customer/product/order counts, revenue)
//   GET /api/admin/customers -> listCustomers()  (full customer list)
// ============================================================================
import { Router } from 'express'
import { adminGuard } from '../middleware/auth.js'
import { dashboardStats, listCustomers } from '../controllers/adminController.js'
import { adminListProducts } from '../controllers/productController.js'
import { adminListCategories } from '../controllers/categoryController.js'
import { adminListBanners, adminListGallery } from '../controllers/miscController.js'

const router = Router()

router.use(...adminGuard)
router.get('/dashboard', dashboardStats)
router.get('/customers', listCustomers)
router.get('/products', adminListProducts) // full CMS product list (all statuses) — see productController.js
router.get('/categories', adminListCategories) // includes inactive categories too
router.get('/banners', adminListBanners) // includes inactive banners too
router.get('/gallery', adminListGallery) // includes hidden gallery items too

export default router
