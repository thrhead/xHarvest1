import { createClient, type Client } from '@libsql/client'
import path from 'path'
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const isVercel = Boolean(process.env.VERCEL)
const defaultDbPath = isVercel
  ? path.join('/tmp', 'ekim-hasat.db')
  : path.resolve(dirname, '../../ekim-hasat.db')

function isPlaceholderToken(token?: string): boolean {
  if (!token) return true
  const t = token.trim()
  return t === '' || t.includes('YOUR_TURSO') || t === 'change-me'
}

function getDatabaseConfig() {
  let rawUrl = process.env.DATABASE_URI || process.env.TURSO_DATABASE_URL || `file:${defaultDbPath}`
  // Clean double 'l' typo if exists
  if (rawUrl.startsWith('llibsql://')) {
    rawUrl = 'libsql://' + rawUrl.slice(10)
  }
  const authToken = (process.env.DATABASE_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN || '').trim()
  const isRemote = rawUrl.startsWith('libsql://') || rawUrl.startsWith('https://')

  if (isRemote && !isPlaceholderToken(authToken)) {
    return { url: rawUrl, authToken, isRemote: true }
  }
  return { url: `file:${defaultDbPath}`, isRemote: false }
}

function createDbClient(): Client {
  const config = getDatabaseConfig()
  try {
    return createClient(config)
  } catch {
    return createClient({ url: `file:${defaultDbPath}` })
  }
}

async function executeSql(sql: string | { sql: string; args: any[] }) {
  const client = createDbClient()
  try {
    return await client.execute(sql)
  } catch (err: any) {
    const config = getDatabaseConfig()
    if (config.isRemote) {
      console.warn('[fieldDb] Remote Turso error, executing on local SQLite fallback:', err?.message || err)
      const localClient = createClient({ url: `file:${defaultDbPath}` })
      return await localClient.execute(sql)
    }
    throw err
  }
}

export interface DbField {
  id: string
  dbId?: number
  name: string
  cropName: string
  type: 'field' | 'greenhouse'
  areaDecares: number
  areaHectare: number
  coordinates: [number, number][]
  color: string
  createdAt?: string
  updatedAt?: string
}

export const SEED_FIELDS = [
  {
    name: 'Kuzey Parsel (Ankara)',
    cropName: 'Domates',
    type: 'field',
    areaDecares: 20,
    color: '#10b981',
    customId: 'f-ankara-1',
    coordinates: [
      [39.925, 32.845],
      [39.925, 32.855],
      [39.915, 32.855],
      [39.915, 32.845],
    ],
  },
  {
    name: 'Çukurova Sera-1',
    cropName: 'Biber',
    type: 'greenhouse',
    areaDecares: 8,
    color: '#059669',
    customId: 'f-cukurova-1',
    coordinates: [
      [36.995, 35.315],
      [36.995, 35.325],
      [36.985, 35.325],
      [36.985, 35.315],
    ],
  },
  {
    name: 'Konya Ovası Buğday',
    cropName: 'Buğday',
    type: 'field',
    areaDecares: 45,
    color: '#f59e0b',
    customId: 'f-konya-1',
    coordinates: [
      [37.875, 32.475],
      [37.875, 32.485],
      [37.865, 32.485],
      [37.865, 32.475],
    ],
  },
]

export async function ensureFieldsTable(): Promise<void> {
  const ddl = `
    CREATE TABLE IF NOT EXISTS fields (
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
    )
  `
  await executeSql(ddl)
  try {
    await executeSql(`ALTER TABLE fields ADD COLUMN custom_id TEXT`)
  } catch {}
  try {
    await executeSql(`ALTER TABLE fields ADD COLUMN color TEXT`)
  } catch {}
  try {
    await executeSql(`ALTER TABLE fields ADD COLUMN coordinates TEXT`)
  } catch {}
  try {
    await executeSql(`ALTER TABLE fields ADD COLUMN crop_name TEXT`)
  } catch {}
  try {
    await executeSql(`ALTER TABLE fields ADD COLUMN area_decares NUMERIC DEFAULT 10`)
  } catch {}
}

function parseCoordinates(raw: any): [number, number][] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

function rowToField(row: any): DbField {
  const decares = typeof row.area_decares === 'number' ? row.area_decares : parseFloat(row.area_decares) || 10
  const customId = row.custom_id || (row.id ? `f-${row.id}` : `f-${Date.now()}`)
  return {
    id: customId,
    dbId: row.id != null ? Number(row.id) : undefined,
    name: row.name || 'Tarla',
    cropName: row.crop_name || 'Domates',
    type: row.type === 'greenhouse' ? 'greenhouse' : 'field',
    areaDecares: decares,
    areaHectare: decares / 10,
    coordinates: parseCoordinates(row.coordinates),
    color: row.color || (row.type === 'greenhouse' ? '#059669' : '#10b981'),
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  }
}

export async function getDbFields(): Promise<DbField[]> {
  await ensureFieldsTable()
  try {
    const res = await executeSql(`SELECT * FROM fields ORDER BY id ASC`)
    if (res.rows && res.rows.length > 0) {
      return res.rows.map(rowToField)
    }

    // Auto-seed initial fields if DB has 0 fields
    for (const sf of SEED_FIELDS) {
      await executeSql({
        sql: `INSERT INTO fields (name, crop_name, type, area_decares, coordinates, color, custom_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
          sf.name,
          sf.cropName,
          sf.type,
          sf.areaDecares,
          JSON.stringify(sf.coordinates),
          sf.color,
          sf.customId,
        ],
      })
    }

    const seededRes = await executeSql(`SELECT * FROM fields ORDER BY id ASC`)
    return seededRes.rows.map(rowToField)
  } catch (err) {
    console.error('[fieldDb] getDbFields fallback error:', err)
    return SEED_FIELDS.map((sf, idx) => ({
      id: sf.customId || `f-${idx + 1}`,
      name: sf.name,
      cropName: sf.cropName,
      type: sf.type as any,
      areaDecares: sf.areaDecares,
      areaHectare: sf.areaDecares / 10,
      coordinates: sf.coordinates as [number, number][],
      color: sf.color,
      createdAt: new Date().toISOString(),
    }))
  }
}

export async function saveDbField(field: any): Promise<DbField> {
  await ensureFieldsTable()

  const customId = field.id ? String(field.id) : `f-${Date.now()}`
  const name = (field.name || 'Yeni Tarla').trim()
  const cropName = (field.cropName || field.crop || 'Domates').trim()
  const type = field.type === 'greenhouse' ? 'greenhouse' : 'field'
  const areaDec = typeof field.areaDecares === 'number'
    ? field.areaDecares
    : parseFloat(field.areaDecares || (field.areaHectare ? field.areaHectare * 10 : 10)) || 10
  const coords = Array.isArray(field.coordinates) ? field.coordinates : []
  const coordsJson = JSON.stringify(coords)
  const color = field.color || (type === 'greenhouse' ? '#059669' : '#10b981')
  const now = new Date().toISOString()

  try {
    const isNumericId = !isNaN(Number(customId)) && Number(customId) > 0
    const existing = await executeSql({
      sql: `SELECT id FROM fields WHERE custom_id = ? OR (id = ? AND ? = 1) LIMIT 1`,
      args: [customId, isNumericId ? Number(customId) : 0, isNumericId ? 1 : 0],
    })

    if (existing.rows && existing.rows.length > 0) {
      const dbId = Number(existing.rows[0].id)
      await executeSql({
        sql: `UPDATE fields SET name = ?, crop_name = ?, type = ?, area_decares = ?, coordinates = ?, color = ?, updated_at = ? WHERE id = ?`,
        args: [name, cropName, type, areaDec, coordsJson, color, now, dbId],
      })

      const updated = await executeSql({
        sql: `SELECT * FROM fields WHERE id = ?`,
        args: [dbId],
      })
      return rowToField(updated.rows[0])
    }

    const insertRes = await executeSql({
      sql: `INSERT INTO fields (name, crop_name, type, area_decares, coordinates, color, custom_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [name, cropName, type, areaDec, coordsJson, color, customId, now, now],
    })

    const newId = insertRes.lastInsertRowid ? Number(insertRes.lastInsertRowid) : undefined
    return {
      id: customId,
      dbId: newId,
      name,
      cropName,
      type,
      areaDecares: areaDec,
      areaHectare: areaDec / 10,
      coordinates: coords,
      color,
      createdAt: now,
      updatedAt: now,
    }
  } catch (err) {
    console.error('[fieldDb] saveDbField error:', err)
    return {
      id: customId,
      name,
      cropName,
      type,
      areaDecares: areaDec,
      areaHectare: areaDec / 10,
      coordinates: coords,
      color,
      createdAt: now,
    }
  }
}

export async function deleteDbField(id: string): Promise<boolean> {
  await ensureFieldsTable()
  try {
    const isNum = !isNaN(Number(id)) && Number(id) > 0
    await executeSql({
      sql: `DELETE FROM fields WHERE custom_id = ? OR (id = ? AND ? = 1)`,
      args: [id, isNum ? Number(id) : 0, isNum ? 1 : 0],
    })
    return true
  } catch (err) {
    console.error('[fieldDb] deleteDbField error:', err)
    return false
  }
}
