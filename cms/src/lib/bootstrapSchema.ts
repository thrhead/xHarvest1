import { createClient } from '@libsql/client'
import path from 'path'
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const isVercel = Boolean(process.env.VERCEL)
const defaultDbPath = isVercel
  ? path.join('/tmp', 'ekim-hasat.db')
  : path.resolve(dirname, '../../ekim-hasat.db')

function clientFromEnv() {
  const url = process.env.DATABASE_URI || process.env.TURSO_DATABASE_URL || `file:${defaultDbPath}`
  const authToken = process.env.DATABASE_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN
  const isRemote = url.startsWith('libsql://') || url.startsWith('https://')
  if (isRemote && !authToken) {
    throw new Error('DATABASE_AUTH_TOKEN required for remote Turso/LibSQL database')
  }
  return createClient({ url, ...(authToken ? { authToken } : {}) })
}

const DROP_ALL = [
  'users_sessions',
  'payload_preferences_rels',
  'payload_preferences',
  'payload_locked_documents_rels',
  'payload_locked_documents',
  'payload_kv',
  'payload_migrations',
  'crops_stages_tasks',
  'crops_stages',
  'crops',
  'guides_rels',
  'guides',
  'media',
  'users',
]

/** Kullaniciyi koruyarak sadece bozuk / eksik tablolari duzelt */
const DROP_SAFE = [
  'payload_preferences_rels',
  'payload_preferences',
  'payload_locked_documents_rels',
  'payload_locked_documents',
  'payload_kv',
  'guides_rels',
  'crops_stages_tasks',
  'crops_stages',
]

export async function bootstrapSchema(options?: { reset?: boolean; fix?: boolean }) {
  const client = clientFromEnv()

  if (options?.reset) {
    for (const t of DROP_ALL) {
      await client.execute(`DROP TABLE IF EXISTS ${t}`)
    }
  }

  const statements = [
    `CREATE TABLE IF NOT EXISTS fields (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      crop_name TEXT,
      type TEXT DEFAULT 'field',
      area_decares NUMERIC DEFAULT 10,
      coordinates TEXT,
      color TEXT,
      custom_id TEXT,
      updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    )`,
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      role TEXT DEFAULT 'admin',
      updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      email TEXT NOT NULL UNIQUE,
      reset_password_token TEXT,
      reset_password_expiration TEXT,
      salt TEXT,
      hash TEXT,
      login_attempts NUMERIC DEFAULT 0,
      lock_until TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS users_sessions (
      id TEXT PRIMARY KEY,
      _order INTEGER NOT NULL DEFAULT 0,
      _parent_id INTEGER NOT NULL,
      created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      expires_at TEXT,
      FOREIGN KEY (_parent_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS crops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      name_tr TEXT,
      category TEXT DEFAULT 'vegetable',
      default_duration_days NUMERIC DEFAULT 120,
      updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    )`,
    `CREATE TABLE IF NOT EXISTS crops_stages (
      id TEXT PRIMARY KEY,
      _order INTEGER NOT NULL DEFAULT 0,
      _parent_id INTEGER NOT NULL,
      name TEXT,
      name_tr TEXT,
      day_offset NUMERIC,
      duration_days NUMERIC,
      tasks TEXT,
      FOREIGN KEY (_parent_id) REFERENCES crops(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS crops_stages_tasks (
      id TEXT PRIMARY KEY,
      _order INTEGER NOT NULL DEFAULT 0,
      _parent_id TEXT NOT NULL,
      type TEXT,
      title TEXT,
      title_tr TEXT,
      description TEXT,
      FOREIGN KEY (_parent_id) REFERENCES crops_stages(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS guides (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      title_tr TEXT,
      slug TEXT UNIQUE,
      category TEXT,
      summary TEXT,
      body TEXT,
      updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    )`,
    `CREATE TABLE IF NOT EXISTS guides_rels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      "order" INTEGER,
      parent_id INTEGER NOT NULL,
      path TEXT NOT NULL,
      crops_id INTEGER,
      FOREIGN KEY (parent_id) REFERENCES guides(id) ON DELETE CASCADE,
      FOREIGN KEY (crops_id) REFERENCES crops(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS media (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      alt TEXT,
      url TEXT,
      updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    )`,
    `CREATE TABLE IF NOT EXISTS payload_kv (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE,
      data TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS payload_locked_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      global_slug TEXT,
      updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    )`,
    `CREATE TABLE IF NOT EXISTS payload_locked_documents_rels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      "order" INTEGER,
      parent_id INTEGER NOT NULL,
      path TEXT NOT NULL,
      users_id INTEGER,
      media_id INTEGER,
      crops_id INTEGER,
      guides_id INTEGER,
      FOREIGN KEY (parent_id) REFERENCES payload_locked_documents(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS payload_preferences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT,
      value TEXT,
      updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    )`,
    `CREATE TABLE IF NOT EXISTS payload_preferences_rels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      "order" INTEGER,
      parent_id INTEGER NOT NULL,
      path TEXT NOT NULL,
      users_id INTEGER,
      FOREIGN KEY (parent_id) REFERENCES payload_preferences(id) ON DELETE CASCADE,
      FOREIGN KEY (users_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS payload_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      batch NUMERIC,
      updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    )`,
    // IF NOT EXISTS Indexes
    `CREATE INDEX IF NOT EXISTS users_created_at_idx ON users (created_at)`,
    `CREATE INDEX IF NOT EXISTS users_updated_at_idx ON users (updated_at)`,
    `CREATE INDEX IF NOT EXISTS crops_created_at_idx ON crops (created_at)`,
    `CREATE INDEX IF NOT EXISTS crops_updated_at_idx ON crops (updated_at)`,
    `CREATE INDEX IF NOT EXISTS crops_stages_order_idx ON crops_stages (_order)`,
    `CREATE INDEX IF NOT EXISTS crops_stages_parent_id_idx ON crops_stages (_parent_id)`,
    `CREATE INDEX IF NOT EXISTS crops_stages_tasks_order_idx ON crops_stages_tasks (_order)`,
    `CREATE INDEX IF NOT EXISTS crops_stages_tasks_parent_id_idx ON crops_stages_tasks (_parent_id)`,
    `CREATE INDEX IF NOT EXISTS guides_created_at_idx ON guides (created_at)`,
    `CREATE INDEX IF NOT EXISTS guides_updated_at_idx ON guides (updated_at)`,
    `CREATE INDEX IF NOT EXISTS media_created_at_idx ON media (created_at)`,
    `CREATE INDEX IF NOT EXISTS media_updated_at_idx ON media (updated_at)`,
    `CREATE INDEX IF NOT EXISTS payload_migrations_created_at_idx ON payload_migrations (created_at)`,
    `CREATE INDEX IF NOT EXISTS payload_migrations_updated_at_idx ON payload_migrations (updated_at)`,
  ]

  for (const sql of statements) {
    await client.execute(sql)
  }

  const safeAlters = [
    `ALTER TABLE fields ADD COLUMN color TEXT`,
    `ALTER TABLE fields ADD COLUMN coordinates TEXT`,
    `ALTER TABLE fields ADD COLUMN crop_name TEXT`,
    `ALTER TABLE fields ADD COLUMN area_decares NUMERIC DEFAULT 10`,
    `ALTER TABLE fields ADD COLUMN custom_id TEXT`,
    `ALTER TABLE crops_stages ADD COLUMN tasks TEXT`,
  ]

  for (const alt of safeAlters) {
    try {
      await client.execute(alt)
    } catch {
      // Column already exists
    }
  }

  return {
    ok: true,
    tables: statements.length,
    reset: Boolean(options?.reset),
  }
}
