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
  } else if (options?.fix) {
    for (const t of DROP_SAFE) {
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
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      _order INTEGER NOT NULL DEFAULT 0,
      _parent_id INTEGER NOT NULL,
      name TEXT,
      name_tr TEXT,
      day_offset NUMERIC,
      duration_days NUMERIC,
      FOREIGN KEY (_parent_id) REFERENCES crops(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS crops_stages_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      _order INTEGER NOT NULL DEFAULT 0,
      _parent_id INTEGER NOT NULL,
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
    // Payload parent_id bekler (parent degil)
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
  ]

  for (const sql of statements) {
    await client.execute(sql)
  }

  // Safe migrations for columns added later or missing on existing databases
  const safeAlters = [
    `ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'admin'`,
    `ALTER TABLE users ADD COLUMN name TEXT`,
    `ALTER TABLE users ADD COLUMN login_attempts NUMERIC DEFAULT 0`,
    `ALTER TABLE users ADD COLUMN lock_until TEXT`,
    `ALTER TABLE users ADD COLUMN reset_password_token TEXT`,
    `ALTER TABLE users ADD COLUMN reset_password_expiration TEXT`,
    `ALTER TABLE users ADD COLUMN salt TEXT`,
    `ALTER TABLE users ADD COLUMN hash TEXT`,
    `ALTER TABLE crops ADD COLUMN name_tr TEXT`,
    `ALTER TABLE crops ADD COLUMN category TEXT DEFAULT 'vegetable'`,
    `ALTER TABLE crops ADD COLUMN default_duration_days NUMERIC DEFAULT 120`,
    `ALTER TABLE crops_stages ADD COLUMN name_tr TEXT`,
    `ALTER TABLE crops_stages ADD COLUMN day_offset NUMERIC`,
    `ALTER TABLE crops_stages ADD COLUMN duration_days NUMERIC`,
    `ALTER TABLE crops_stages_tasks ADD COLUMN title_tr TEXT`,
    `ALTER TABLE guides ADD COLUMN title_tr TEXT`,
    `ALTER TABLE guides ADD COLUMN slug TEXT`,
    `ALTER TABLE guides ADD COLUMN category TEXT`,
    `ALTER TABLE guides ADD COLUMN summary TEXT`,
    `ALTER TABLE guides ADD COLUMN body TEXT`,
    `ALTER TABLE fields ADD COLUMN color TEXT`,
    `ALTER TABLE fields ADD COLUMN coordinates TEXT`,
    `ALTER TABLE fields ADD COLUMN crop_name TEXT`,
    `ALTER TABLE fields ADD COLUMN area_decares NUMERIC DEFAULT 10`,
    `ALTER TABLE fields ADD COLUMN custom_id TEXT`,
  ]

  for (const alt of safeAlters) {
    try {
      await client.execute(alt)
    } catch {
      // Column already exists or table freshly created
    }
  }

  return {
    ok: true,
    tables: statements.length,
    reset: Boolean(options?.reset),
    fix: Boolean(options?.fix),
  }
}
