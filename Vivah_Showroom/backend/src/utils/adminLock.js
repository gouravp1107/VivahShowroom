// ============================================================================
// utils/adminLock.js — replaces the AdminLock.getSingleton() static method
// that used to live on the Mongoose AdminLock model. Prisma models can't
// have custom static methods, so "always fetch/create the one singleton
// row with id 'admin-lock'" moves here instead. See prisma/schema.prisma's
// AdminLock model and controllers/authController.js for how it's used.
// ============================================================================
import prisma from '../lib/prisma.js'

export async function getAdminLockSingleton() {
  return prisma.adminLock.upsert({
    where: { id: 'admin-lock' },
    update: {},
    create: { id: 'admin-lock' },
  })
}
