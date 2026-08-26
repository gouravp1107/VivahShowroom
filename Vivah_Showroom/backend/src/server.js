// ============================================================================
// server.js — the backend's actual entry point (what `npm start` / `npm run
// dev` runs — see package.json's "main"/"scripts" fields). This file's ONLY
// job is startup sequencing: connect to PostgreSQL first, THEN start
// accepting HTTP requests. The Express app itself (all routes/middleware)
// is built separately in app.js, so it can be imported and tested without
// needing a real database connection first.
//
// The whole app — every model, not just inventory — now lives in this one
// PostgreSQL database via Prisma (see prisma/schema.prisma). There is no
// MongoDB connection anymore.
// ============================================================================
import 'dotenv/config' // loads backend/.env into process.env — see .env.example for required variables
import { createApp } from './app.js'
import prisma from './lib/prisma.js'

const PORT = process.env.PORT || 5000

async function start() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set. Copy .env.example to .env and fill in your PostgreSQL connection string.')
    process.exit(1)
  }
  try {
    await prisma.$connect()
    console.log('PostgreSQL connected (Prisma)')
  } catch (err) {
    console.error('PostgreSQL connection error:', err.message)
    process.exit(1)
  }

  const app = createApp() // builds the Express app: middleware + all /api/* routes — see app.js
  app.listen(PORT, () => {
    console.log(`Vivah Trousseau API running on port ${PORT}`)
  })
}

start()

process.on('SIGTERM', async () => {
  await prisma.$disconnect().catch(() => {})
  process.exit(0)
})
