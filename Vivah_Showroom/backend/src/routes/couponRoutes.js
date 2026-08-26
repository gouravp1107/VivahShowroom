// ============================================================================
// routes/couponRoutes.js — mounted at /api/coupons in app.js.
//   GET    /api/coupons          -> listActiveCoupons() (public)
//   POST   /api/coupons/validate -> validateCoupon()    (public — booking flow's offer step)
//   POST   /api/coupons          -> createCoupon()      (admin panel session only)
//   PUT    /api/coupons/:id      -> updateCoupon()      (admin panel session only)
//   DELETE /api/coupons/:id      -> deleteCoupon()      (admin panel session only)
// ============================================================================
import { Router } from 'express'
import { adminGuard } from '../middleware/auth.js'
import {
  listActiveCoupons, validateCoupon, adminListCoupons, createCoupon, updateCoupon, deleteCoupon,
} from '../controllers/couponController.js'

const router = Router()

router.get('/', listActiveCoupons)
router.post('/validate', validateCoupon)

router.get('/admin', ...adminGuard, adminListCoupons)
router.post('/', ...adminGuard, createCoupon)
router.put('/:id', ...adminGuard, updateCoupon)
router.delete('/:id', ...adminGuard, deleteCoupon)

export default router
