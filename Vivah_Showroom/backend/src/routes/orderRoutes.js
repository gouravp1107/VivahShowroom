// ============================================================================
// routes/orderRoutes.js — mounted at /api/orders in app.js. Every route
// here requires login (router.use(protect) below); the admin-only ones use
// adminGuard (protect + adminOnly + adminSessionGuard — see middleware/auth.js).
//   POST /api/orders               -> createOrder()      (any logged-in user — the Rent Now booking flow's "Confirm Booking")
//   GET  /api/orders/mine          -> myOrders()          (any logged-in user — "My Orders")
//   GET  /api/orders/:id           -> getOrder()          (owner or admin — checked inside the controller)
//   POST /api/orders/:id/confirm-payment -> confirmPayment() (any logged-in user — UPI/QR payment step)
//   POST /api/orders/:id/return    -> requestReturn()     (any logged-in user)
//   GET  /api/orders               -> listAllOrders()     (admin panel session only)
//   PUT  /api/orders/:id/status    -> updateOrderStatus() (admin panel session only)
// ============================================================================
import { Router } from 'express'
import { protect, adminGuard } from '../middleware/auth.js'
import {
  createOrder, myOrders, getOrder, confirmPayment, requestReturn, listAllOrders, updateOrderStatus,
} from '../controllers/orderController.js'

const router = Router()

router.use(protect)
router.post('/', createOrder)
router.get('/mine', myOrders)
router.get('/:id', getOrder)
router.post('/:id/confirm-payment', confirmPayment)
router.post('/:id/return', requestReturn)

router.get('/', ...adminGuard, listAllOrders)
router.put('/:id/status', ...adminGuard, updateOrderStatus)

export default router
