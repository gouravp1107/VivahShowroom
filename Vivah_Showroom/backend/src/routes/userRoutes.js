// ============================================================================
// routes/userRoutes.js — mounted at /api/users in app.js.
//   PUT    /api/users/profile            -> updateProfile()
//   PUT    /api/users/change-password    -> changePassword()
//   POST   /api/users/addresses          -> addAddress()
//   DELETE /api/users/addresses/:addressId -> deleteAddress()
//   GET    /api/users/wishlist           -> getWishlist()
//   POST   /api/users/wishlist/toggle    -> toggleWishlist()
// ============================================================================
import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import {
  updateProfile, changePassword, addAddress, deleteAddress, toggleWishlist, getWishlist,
} from '../controllers/userController.js'

const router = Router()

// router.use(protect) applies to EVERY route below at once — every /api/users/*
// endpoint requires login, there's no public one in this file.
router.use(protect)
router.put('/profile', updateProfile)
router.put('/change-password', changePassword)
router.post('/addresses', addAddress)
router.delete('/addresses/:addressId', deleteAddress)
router.get('/wishlist', getWishlist)
router.post('/wishlist/toggle', toggleWishlist)

export default router
