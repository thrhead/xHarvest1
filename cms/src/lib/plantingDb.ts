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
      console.warn('[plantingDb] Remote Turso error, executing on local fallback:', err?.message || err)
      const localClient = createClient({ url: `file:${defaultDbPath}` })
      return await localClient.execute(sql)
    }
    throw err
  }
}

export interface DbPlanting {
  id: string
  userId?: string
  fieldId: string
  fieldName?: string
  cropTemplateId?: string
  cropNameTr: string
  plantingDate: string
  status?: 'active' | 'hasat_edildi' | 'completed'
  areaDa?: number
  taskProgress?: Record<string, boolean>
  createdAt?: string
  updatedAt?: string
}

let tableInitialized = false

export async function ensurePlantingsTable(): Promise<void> {
  if (tableInitialized) return

  const ddl = `
    CREATE TABLE IF NOT EXISTS plantings (
      id TEXT PRIMARY KEY,
      user_id TEXT DEFAULT 'demo-user-id',
      field_id TEXT NOT NULL,
      field_name TEXT,
      crop_template_id TEXT,
      crop_name_tr TEXT NOT NULL,
      planting_date TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      area_da REAL DEFAULT 10,
      task_progress TEXT DEFAULT '{}',
      created_at TEXT,
      updated_at TEXT
    );
  `
  try {
    await executeSql(ddl)
    tableInitialized = true
  } catch (err) {
    console.error('[plantingDb] Error ensuring plantings table:', err)
  }
}

export async function getDbPlantings(userId?: string): Promise<DbPlanting[]> {
  await ensurePlantingsTable()
  let sql = `SELECT * FROM plantings`
  const args: any[] = []
  if (userId && userId !== 'all' && userId !== 'demo-user-id') {
    sql += ` WHERE user_id = ? OR user_id = 'demo-user-id' OR user_id IS NULL`
    args.push(userId)
  }
  sql += ` ORDER BY planting_date DESC`
  const rs = await executeSql({ sql, args })

  return rs.rows.map((row: any) => {
    let taskProgress: Record<string, boolean> = {}
    try {
      if (row.task_progress) {
        taskProgress = typeof row.task_progress === 'string' ? JSON.parse(row.task_progress) : row.task_progress
      }
    } catch {}

    return {
      id: String(row.id),
      userId: row.user_id ? String(row.user_id) : 'demo-user-id',
      fieldId: String(row.field_id),
      fieldName: row.field_name ? String(row.field_name) : undefined,
      cropTemplateId: row.crop_template_id ? String(row.crop_template_id) : undefined,
      cropNameTr: String(row.crop_name_tr || 'Ürün'),
      plantingDate: String(row.planting_date),
      status: (row.status as any) || 'active',
      areaDa: Number(row.area_da) || 10,
      taskProgress,
      createdAt: row.created_at ? String(row.created_at) : undefined,
      updatedAt: row.updated_at ? String(row.updated_at) : undefined,
    }
  })
}

export async function upsertDbPlanting(planting: DbPlanting): Promise<void> {
  await ensurePlantingsTable()
  const nowIso = new Date().toISOString()
  const progressJson = JSON.stringify(planting.taskProgress || {})

  const upsertSql = `
    INSERT INTO plantings (
      id, user_id, field_id, field_name, crop_template_id, crop_name_tr,
      planting_date, status, area_da, task_progress, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?
    )
    ON CONFLICT(id) DO UPDATE SET
      field_id = excluded.field_id,
      field_name = COALESCE(excluded.field_name, plantings.field_name),
      crop_template_id = COALESCE(excluded.crop_template_id, plantings.crop_template_id),
      crop_name_tr = excluded.crop_name_tr,
      planting_date = excluded.planting_date,
      status = excluded.status,
      area_da = excluded.area_da,
      task_progress = excluded.task_progress,
      updated_at = excluded.updated_at
  `

  await executeSql({
    sql: upsertSql,
    args: [
      planting.id,
      planting.userId || 'demo-user-id',
      planting.fieldId,
      planting.fieldName || null,
      planting.cropTemplateId || null,
      planting.cropNameTr,
      planting.plantingDate,
      planting.status || 'active',
      planting.areaDa || 10,
      progressJson,
      planting.createdAt || nowIso,
      nowIso,
    ],
  })
}

export async function upsertDbPlantingsBatch(plantings: DbPlanting[]): Promise<void> {
  for (const p of plantings) {
    await upsertDbPlanting(p)
  }
}

export async function deleteDbPlanting(id: string): Promise<boolean> {
  await ensurePlantingsTable()
  await executeSql({
    sql: `DELETE FROM plantings WHERE id = ?`,
    args: [id],
  })
  return true
}

export async function deleteDbPlantingsByFieldId(fieldId: string): Promise<boolean> {
  await ensurePlantingsTable()
  await executeSql({
    sql: `DELETE FROM plantings WHERE field_id = ?`,
    args: [fieldId],
  })
  return true
}
