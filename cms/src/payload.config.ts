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

const dbFilePath = path.resolve(dirname, '../ekim-hasat.db')

const isBuilding = process.env.NEXT_PHASE === 'phase-production-build' || process.argv.some(arg => arg.includes('build'))

export default buildConfig({
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: '— Ekim-Hasat CMS',
    },
    suppressHydrationWarning: true,
  },
  collections: [Users, Media, Crops, Guides],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || 'dev-secret-change-me-32chars-min!!',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: sqliteAdapter({
    client: {
      url: process.env.DATABASE_URI || `file:${dbFilePath}`,
    },
    busyTimeout: 30000,
    wal: true,
    push: isBuilding ? false : process.env.PAYLOAD_PUSH !== 'false',
  }),
  sharp,
  cors: ['*'],
  csrf: [],
  onInit: async (payload) => {
    if (!isBuilding && process.env.PAYLOAD_SEED !== 'false') {
      try {
        const users = await payload.find({ collection: 'users', limit: 1 })
        if (users.totalDocs === 0) {
          payload.logger.info('Auto-seeding initial database...')
          const { runSeed } = await import('./seed')
          await runSeed(payload)
        }
      } catch (err) {
        payload.logger.error({ err, msg: 'Error auto-seeding database' })
      }
    }
  },
})
