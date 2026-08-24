import { buildConfig } from 'payload'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Crops } from './collections/Crops'
import { Guides } from './collections/Guides'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const isVercel = Boolean(process.env.VERCEL)
const dbFilePath = isVercel
  ? path.join('/tmp', 'ekim-hasat.db')
  : path.resolve(dirname, '../ekim-hasat.db')

const isBuilding =
  process.env.NEXT_PHASE === 'phase-production-build' ||
  process.argv.some((arg) => arg.includes('build'))

const dbUrl = process.env.DATABASE_URI || process.env.TURSO_DATABASE_URL || `file:${dbFilePath}`
const authToken = process.env.DATABASE_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN
const isRemoteLibsql = dbUrl.startsWith('libsql://') || dbUrl.startsWith('https://')

const serverURL =
  process.env.NEXT_PUBLIC_SERVER_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'https://ekim-hasat-cms.vercel.app')

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: '— Ekim Hasat CMS',
    },
    dateFormat: 'dd.MM.yyyy HH:mm',
  },
  collections: [Users, Media, Crops, Guides],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || 'ekim-hasat-payload-secret-key-32chars-min-safe!!',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: sqliteAdapter({
    client: {
      url: dbUrl,
      ...(authToken ? { authToken } : {}),
    },
    ...(isRemoteLibsql ? {} : { busyTimeout: 30000, wal: true }),
    push: !isBuilding && !isVercel,
  }),
  sharp,
  cors: [
    '*',
    'http://localhost:3000',
    'https://ekim-hasat-cms.vercel.app',
    'https://ekim-hasat-cms-tahirs-projects-4b50ac9a.vercel.app',
  ],
  csrf: [
    'https://ekim-hasat-cms.vercel.app',
    'https://ekim-hasat-cms-tahirs-projects-4b50ac9a.vercel.app',
    'http://localhost:3000',
  ],
  serverURL,
  onInit: async (payload) => {
    if (isBuilding || process.env.PAYLOAD_SEED === 'false') return
    try {
      // Ensure database schema and missing columns (like 'role') are created/migrated
      const { bootstrapSchema } = await import('./lib/bootstrapSchema')
      await bootstrapSchema().catch((e: any) =>
        payload.logger.warn(`bootstrapSchema notice: ${e?.message || e}`)
      )

      // Auto seed initial admin user if not present
      const users = await payload.find({ collection: 'users', limit: 1 }).catch(() => ({ totalDocs: 0, docs: [] }))
      if (users.totalDocs === 0) {
        payload.logger.info('Creating initial admin user: tahir.kahraman85@gmail.com')
        await payload.create({
          collection: 'users',
          data: {
            email: 'tahir.kahraman85@gmail.com',
            password: 'Password123!',
            name: 'Tahir Kahraman',
            role: 'admin',
          },
        }).catch((e) => payload.logger.warn(`User seed skipped: ${e?.message || e}`))
      }

      // Auto seed crops and guides
      const crops = await payload.find({ collection: 'crops', limit: 1 }).catch(() => ({ totalDocs: 0, docs: [] }))
      if (crops.totalDocs === 0) {
        payload.logger.info('Auto-seeding initial crops and guides...')
        const { runSeed } = await import('./seed/index')
        await runSeed(payload).catch((e: any) => payload.logger.warn(`Crop seed warning: ${e?.message || e}`))
      }
    } catch (err: any) {
      payload.logger.warn(`Init seeding notice: ${err?.message || err}`)
    }
  },
})
