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
      console.warn('[taskDb] Remote Turso error, executing on local SQLite fallback:', err?.message || err)
      const localClient = createClient({ url: `file:${defaultDbPath}` })
      return await localClient.execute(sql)
    }
    throw err
  }
}

export interface DbTask {
  id: string
  userId?: string
  fieldId: string
  fieldName?: string
  cropId?: string
  cropName?: string
  type: string
  title: string
  description?: string
  plannedDate: string
  originalDate?: string
  status: 'pending' | 'completed' | 'skipped' | 'rescheduled' | 'delayed'
  weatherReason?: string
  notes?: string
  photoUris?: string[]
  isCustom?: boolean
  source?: 'crop_plan' | 'manual'
  productName?: string
  dosage?: string
  targetPestOrPurpose?: string
  completedAt?: string
  createdAt?: string
  updatedAt?: string
}

let tableInitialized = false

export async function ensureTasksTable(): Promise<void> {
  if (tableInitialized) return

  const ddl = `
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      user_id TEXT DEFAULT 'demo-user-id',
      field_id TEXT NOT NULL,
      field_name TEXT,
      crop_id TEXT,
      crop_name TEXT,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      planned_date TEXT NOT NULL,
      original_date TEXT,
      status TEXT DEFAULT 'pending',
      weather_reason TEXT,
      notes TEXT,
      photo_uris TEXT,
      is_custom INTEGER DEFAULT 0,
      source TEXT DEFAULT 'crop_plan',
      product_name TEXT,
      dosage TEXT,
      target_pest_or_purpose TEXT,
      completed_at TEXT,
      created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    )
  `
  await executeSql(ddl)
  tableInitialized = true
}

function mapRowToTask(row: any): DbTask {
  let photoUris: string[] = []
  if (row.photo_uris) {
    try {
      photoUris = JSON.parse(row.photo_uris)
    } catch {
      photoUris = []
    }
  }

  return {
    id: String(row.id),
    userId: row.user_id || 'demo-user-id',
    fieldId: String(row.field_id),
    fieldName: row.field_name || undefined,
    cropId: row.crop_id || undefined,
    cropName: row.crop_name || undefined,
    type: String(row.type || 'other'),
    title: String(row.title || ''),
    description: row.description || undefined,
    plannedDate: String(row.planned_date || ''),
    originalDate: row.original_date || undefined,
    status: (row.status as any) || 'pending',
    weatherReason: row.weather_reason || undefined,
    notes: row.notes || undefined,
    photoUris,
    isCustom: Boolean(row.is_custom === 1 || row.is_custom === true),
    source: (row.source as any) || (row.is_custom ? 'manual' : 'crop_plan'),
    productName: row.product_name || undefined,
    dosage: row.dosage || undefined,
    targetPestOrPurpose: row.target_pest_or_purpose || undefined,
    completedAt: row.completed_at || undefined,
    createdAt: row.created_at || undefined,
    updatedAt: row.updated_at || undefined,
  }
}

export async function getDbTasks(opts?: { fieldId?: string; status?: string }): Promise<DbTask[]> {
  await ensureTasksTable()

  let sql = `SELECT * FROM tasks`
  const args: any[] = []
  const conditions: string[] = []

  if (opts?.fieldId) {
    conditions.push(`field_id = ?`)
    args.push(opts.fieldId)
  }
  if (opts?.status) {
    conditions.push(`status = ?`)
    args.push(opts.status)
  }

  if (conditions.length > 0) {
    sql += ` WHERE ` + conditions.join(' AND ')
  }
  sql += ` ORDER BY planned_date ASC, created_at DESC`

  const res = await executeSql({ sql, args })
  const rows = res.rows || []

  // If table is completely empty and no filters were applied, seed initial tasks
  if (rows.length === 0 && !opts?.fieldId && !opts?.status) {
    const defaultTasks: DbTask[] = [
      {
        id: 't-hasat-domates-1',
        fieldId: 'f-1',
        fieldName: 'Konya Ovası Tarlası',
        cropName: 'Domates',
        type: 'harvesting',
        title: 'Konya Domates Ekimi Hasat ve Toplama Görevi',
        description: 'Olgun domateslerin sabah erken saatte kasalara toplanması ve gölgede istiflenmesi.',
        plannedDate: '2026-08-15',
        status: 'pending',
        isCustom: true,
        source: 'manual',
        targetPestOrPurpose: 'Pazar & Toptan Satış',
      },
      {
        id: 't-ilac-1',
        fieldId: 'f-1',
        fieldName: 'Güney Domates Tarlası',
        cropName: 'Domates',
        type: 'spraying',
        title: 'Mildiyö Koruyucu Fungisit İlaçlaması',
        description: 'Rutubet ve yağış sonrası yaprak lekesi ve mildiyö oluşumunu engelleme.',
        plannedDate: '2026-08-10',
        status: 'delayed',
        weatherReason: 'Aşırı rüzgar (22 km/s) uyarısı nedeniyle +1 gün ertelendi',
        isCustom: false,
        source: 'crop_plan',
        productName: 'Bakır Oksiklorür 50 WP',
        dosage: '300 g / 100 L',
        targetPestOrPurpose: 'Mildiyö Mantarı',
      },
      {
        id: 't-gubre-1',
        fieldId: 'f-2',
        fieldName: 'Kuzey Biber Sahası',
        cropName: 'Biber',
        type: 'fertilizing',
        title: 'Damla Sulama ile Potasyum Nitrat Besleme',
        description: 'Meyve büyütme ve renk kalitesi için damla sulama gübrelemesi.',
        plannedDate: '2026-08-04',
        status: 'completed',
        completedAt: '2026-08-04T09:30:00Z',
        isCustom: false,
        source: 'crop_plan',
        productName: 'Potasyum Nitrat (13-0-46)',
        dosage: '4 kg / da',
        targetPestOrPurpose: 'Meyve Dolgunluğu',
      },
      {
        id: 't-sulama-1',
        fieldId: 'f-3',
        fieldName: 'Doğu Mısır Tarlası',
        cropName: 'Mısır',
        type: 'irrigation',
        title: 'Koçan Dönemi Sıra Arası Karık Sulama',
        description: 'Tane bağlama evresinde su stresini önleme sulaması.',
        plannedDate: '2026-08-12',
        status: 'pending',
        isCustom: true,
        source: 'manual',
      },
      {
        id: 't-bakim-1',
        fieldId: 'f-1',
        fieldName: 'Güney Domates Tarlası',
        cropName: 'Domates',
        type: 'other',
        title: 'Domates Koltuk Alma ve İpe Alma Bakımı',
        description: 'Verimsiz sürgünlerin elle budanması ve havalandırma.',
        plannedDate: '2026-08-06',
        status: 'skipped',
        weatherReason: 'İşçi planı nedeniyle bu evre atlandı',
        isCustom: true,
        source: 'manual',
      },
    ]

    for (const t of defaultTasks) {
      await saveDbTask(t)
    }
    return defaultTasks
  }

  return rows.map(mapRowToTask)
}

export async function saveDbTask(task: DbTask): Promise<DbTask> {
  await ensureTasksTable()

  const id = task.id || `t_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const nowIso = new Date().toISOString()
  const photosJson = JSON.stringify(task.photoUris || [])
  const isCustomInt = task.isCustom ? 1 : 0
  const source = task.source || (task.isCustom ? 'manual' : 'crop_plan')

  const upsertSql = `
    INSERT INTO tasks (
      id, user_id, field_id, field_name, crop_id, crop_name,
      type, title, description, planned_date, original_date,
      status, weather_reason, notes, photo_uris, is_custom, source,
      product_name, dosage, target_pest_or_purpose, completed_at,
      updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?
    )
    ON CONFLICT(id) DO UPDATE SET
      field_id = excluded.field_id,
      field_name = COALESCE(excluded.field_name, tasks.field_name),
      crop_id = COALESCE(excluded.crop_id, tasks.crop_id),
      crop_name = COALESCE(excluded.crop_name, tasks.crop_name),
      type = excluded.type,
      title = excluded.title,
      description = excluded.description,
      planned_date = excluded.planned_date,
      original_date = COALESCE(excluded.original_date, tasks.original_date),
      status = excluded.status,
      weather_reason = excluded.weather_reason,
      notes = excluded.notes,
      photo_uris = excluded.photo_uris,
      is_custom = excluded.is_custom,
      source = excluded.source,
      product_name = excluded.product_name,
      dosage = excluded.dosage,
      target_pest_or_purpose = excluded.target_pest_or_purpose,
      completed_at = excluded.completed_at,
      updated_at = excluded.updated_at
  `

  await executeSql({
    sql: upsertSql,
    args: [
      id,
      task.userId || 'demo-user-id',
      task.fieldId,
      task.fieldName || null,
      task.cropId || null,
      task.cropName || null,
      task.type || 'other',
      task.title,
      task.description || null,
      task.plannedDate,
      task.originalDate || task.plannedDate,
      task.status || 'pending',
      task.weatherReason || null,
      task.notes || null,
      photosJson,
      isCustomInt,
      source,
      task.productName || null,
      task.dosage || null,
      task.targetPestOrPurpose || null,
      task.completedAt || null,
      nowIso,
    ],
  })

  return {
    ...task,
    id,
    source,
    isCustom: Boolean(isCustomInt),
    updatedAt: nowIso,
  }
}

export async function saveDbTasks(taskList: DbTask[]): Promise<DbTask[]> {
  await ensureTasksTable()
  const savedList: DbTask[] = []
  for (const t of taskList) {
    const s = await saveDbTask(t)
    savedList.push(s)
  }
  return savedList
}

export async function deleteDbTask(id: string): Promise<boolean> {
  await ensureTasksTable()
  await executeSql({
    sql: `DELETE FROM tasks WHERE id = ?`,
    args: [id],
  })
  return true
}

export async function updateDbTaskStatus(
  id: string,
  status: 'pending' | 'completed' | 'skipped' | 'rescheduled' | 'delayed',
  completedAt?: string
): Promise<boolean> {
  await ensureTasksTable()
  const nowIso = new Date().toISOString()
  await executeSql({
    sql: `UPDATE tasks SET status = ?, completed_at = ?, updated_at = ? WHERE id = ?`,
    args: [status, completedAt || (status === 'completed' ? nowIso : null), nowIso, id],
  })
  return true
}
