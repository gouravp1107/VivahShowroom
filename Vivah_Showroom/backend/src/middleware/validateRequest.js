// ============================================================================
// middleware/validateRequest.js — a small reusable checkpoint for
// express-validator rules (see routes/authRoutes.js and
// routes/appointmentRoutes.js for examples of `body('field').isEmail()`
// etc. validation rules defined right in the route declaration).
//
// USAGE PATTERN:
//   router.post('/register',
//     [ body('email').isEmail(), body('password').isLength({ min: 6 }) ], // rules
//     validateRequest,   // <- this file: checks the rules above, stops here if any failed
//     register           // <- only runs if validation passed
//   )
// ============================================================================
import { validationResult } from 'express-validator'

export function validateRequest(req, res, next) {
  const errors = validationResult(req) // collects results of any express-validator rules run earlier in this route's middleware chain
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: 'Validation failed', errors: errors.array() })
  }
  next()
}
