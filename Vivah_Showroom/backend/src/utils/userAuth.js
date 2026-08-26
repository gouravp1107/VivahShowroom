// ============================================================================
// utils/userAuth.js — replaces the instance methods/hooks that used to live
// directly on the Mongoose User model (models/User.js's pre('save') hash
// hook, comparePassword(), toSafeObject()). Prisma models are plain data —
// no hooks or methods — so this logic moves here and every controller that
// used to call `user.save()` (which triggered the hash hook automatically)
// now explicitly calls hashPassword() before writing to the database.
// ============================================================================
import bcrypt from 'bcryptjs'

export async function hashPassword(plain) {
  if (!plain) return null
  return bcrypt.hash(plain, 10)
}

export function comparePassword(candidate, hash) {
  if (!hash) return Promise.resolve(false)
  return bcrypt.compare(candidate, hash)
}

// Strips password/token fields before a user object goes into an API
// response — same job as the old toSafeObject().
export function toSafeUser(user) {
  if (!user) return user
  const { password, verificationToken, resetPasswordToken, resetPasswordExpires, ...safe } = user
  return safe
}
