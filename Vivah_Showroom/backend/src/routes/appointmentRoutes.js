// ============================================================================
// routes/appointmentRoutes.js — mounted at /api/appointments in app.js.
//   POST /api/appointments            -> bookAppointment()        (PUBLIC — no login required, guests can book)
//   GET  /api/appointments/mine       -> myAppointments()         (requires login)
//   GET  /api/appointments            -> listAppointments()       (admin only)
//   PUT  /api/appointments/:id/status -> updateAppointmentStatus()(admin only)
// ============================================================================
import { Router } from 'express'
import { body } from 'express-validator'
import { validateRequest } from '../middleware/validateRequest.js'
import { protect, adminGuard } from '../middleware/auth.js'
import {
  bookAppointment, myAppointments, listAppointments, updateAppointmentStatus,
} from '../controllers/appointmentController.js'

const router = Router()

router.post(
  '/',
  [
    body('name').notEmpty(),
    body('phone').notEmpty(),
    body('email').isEmail(),
    body('preferredDate').notEmpty(),
  ],
  validateRequest,
  bookAppointment
)

router.get('/mine', protect, myAppointments)
router.get('/', ...adminGuard, listAppointments)
router.put('/:id/status', ...adminGuard, updateAppointmentStatus)

export default router
