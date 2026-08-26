import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis

export const prisma = globalForPrisma.__vivahPrisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__vivahPrisma = prisma
}

export default prisma
