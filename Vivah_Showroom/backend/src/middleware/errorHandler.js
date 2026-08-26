// ============================================================================
// middleware/errorHandler.js — the two pieces registered LAST in app.js
// (after every real route), so they only run when nothing else handled the
// request.
//
// notFound     -> runs when a request's URL didn't match ANY route above it
//                 in app.js — returns a clean 404 JSON response instead of
//                 Express's default HTML error page.
// errorHandler -> Express's special 4-argument (err, req, res, next)
//                 signature marks this as an ERROR handler specifically —
//                 it catches anything thrown, or passed to next(err), by
//                 any route/controller anywhere in the app, and turns it
//                 into one consistent JSON error shape: { message, stack }.
//                 The stack trace is only included outside production, so
//                 real users never see internal file paths/code details.
// ============================================================================
export function notFound(req, res, next) {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` })
}

export function errorHandler(err, req, res, next) {
  const status = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500
  console.error(err) // always log server-side, regardless of environment
  res.status(status).json({
    message: err.message || 'Server error',
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  })
}
