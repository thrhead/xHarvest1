import { createClient, type Client } from '@libsql/client'
import path from 'path'
import { fileURLToPath } from 'url'
import { getFieldById, getAllFields } from './fieldDb'
import { createTask, getAllTasks } from './taskDb'
import { PRESET_CUSTOM_INDICES, validateFormula } from './customIndexEvaluator'

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
      console.warn('[satelliteDb] Remote Turso error, fallback to local SQLite:', err?.message || err)
      const localClient = createClient({ url: `file:${defaultDbPath}` })
      return await localClient.execute(sql)
    }
    throw err
  }
}

// -----------------------------------------------------------------------------
// Interfaces (Aligned with PRD Section 9 & MVP Requirements)
// -----------------------------------------------------------------------------

export interface SatelliteSource {
  id: string
  name: string
  provider: string
  resolution: string
  availableBands: string[]
  licenseType: 'open_access' | 'commercial'
  status: 'active' | 'maintenance' | 'deprecated'
  createdAt: string
  updatedAt: string
}

export interface SatelliteScene {
  id: string
  sourceId: string
  fieldId: string
  sceneIdentifier: string
  captureDate: string
  processingDate: string
  cloudPercent: number
  cirrusPercent: number
  cloudShadowPercent: number
  validPixelPercent: number
  qualityLevel: 'high' | 'medium' | 'low' | 'unusable'
  storageReference?: string
  processingStatus: 'completed' | 'processing' | 'failed'
  errorMessage?: string
  createdAt: string
}

export interface IndexDefinition {
  id: string
  code: string
  name: string
  description: string
  formula: string
  requiredBands: string[]
  supportedSources: string[]
  valueMin: number
  valueMax: number
  colorRamp: { value: number; color: string; label: string }[]
  cropStages?: string
  isSystemDefined: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface IndexResult {
  id: string
  fieldId: string
  sceneId: string
  indexCode: string
  meanValue: number
  minValue: number
  maxValue: number
  standardDeviation: number
  validPixelPercent: number
  colorMapJson?: string
  statisticsJson?: string
  createdAt: string
}

export interface FieldMonitoringConfig {
  id: string
  fieldId: string
  cropId?: string
  active: boolean
  preferredSource: string
  preferredIndices: string[]
  maxCloudPercent: number
  minValidPixelPercent: number
  alertEnabled: boolean
  emailEnabled: boolean
  notificationFrequency: string
  createdAt: string
  updatedAt: string
}

export interface FieldAnomaly {
  id: string
  fieldId: string
  indexResultId?: string
  sceneId?: string
  riskType: 'vigor_drop' | 'water_stress' | 'nutrient_deficiency' | 'chlorophyll_loss' | 'uneven_growth'
  riskLevel: 'info' | 'low' | 'medium' | 'high' | 'critical'
  changePercent: number
  confidenceScore: number
  explanation: string
  status: 'new' | 'investigating' | 'task_created' | 'verified' | 'false_alarm' | 'resolved' | 'archived'
  associatedTaskId?: string
  feedbackStatus?: 'unreviewed' | 'confirmed' | 'false_alarm'
  feedbackNotes?: string
  detectedAt: string
  resolvedAt?: string
  createdAt: string
}

export interface CustomIndexRecord {
  id: string
  code: string
  name: string
  description: string
  formula: string
  requiredBands: string[]
  valueMin: number
  valueMax: number
  colorRamp: { value: number; color: string; label: string }[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface PhenologyBenchmark {
  id: string
  cropName: string
  stageName: string
  stageOrder: number
  dayStart: number
  dayEnd: number
  expectedNdviMin: number
  expectedNdviMax: number
  expectedNdreMin?: number
  expectedNdreMax?: number
  description: string
}

export interface GridAnomalyCell {
  id: string
  row: number
  col: number
  centerLat: number
  centerLng: number
  bounds: [[number, number], [number, number]]
  ndvi: number
  zScore: number
  status: 'stress' | 'normal' | 'thriving'
  explanation: string
}

export interface PlanetScopeQuota {
  monthlyLimitHectares: number
  usedHectares: number
  renewalDate: string
  apiStatus: string
}

export interface MonitoringAlert {
  id: string
  fieldId: string
  anomalyId: string
  channel: 'in_app' | 'email'
  recipientId?: string
  title: string
  message: string
  status: 'pending' | 'sent' | 'read' | 'failed'
  sentAt?: string
  readAt?: string
  createdAt: string
}

// -----------------------------------------------------------------------------
// System Index Definitions (5 MVP Indices: PRD FR-05)
// -----------------------------------------------------------------------------

export const SYSTEM_INDEX_DEFINITIONS: Omit<IndexDefinition, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    code: 'NDVI',
    name: 'Normalize Edilmiş Fark Bitki İndeksi (NDVI)',
    description: 'Bitki örtüsü canlılığı, biyokütle yoğunluğu ve genel fotosentez kapasitesini ölçer.',
    formula: '(NIR - Red) / (NIR + Red)',
    requiredBands: ['B04_Red', 'B08_NIR'],
    supportedSources: ['sentinel-2', 'planetscope'],
    valueMin: -1,
    valueMax: 1,
    colorRamp: [
      { value: 0.1, color: '#d73027', label: 'Çıplak Toprak / Çok Düşük' },
      { value: 0.25, color: '#fc8d59', label: 'Zayıf Vejetasyon / Başlangıç' },
      { value: 0.45, color: '#fee08b', label: 'Orta Canlılık / Gelişme' },
      { value: 0.65, color: '#91cf60', label: 'İyi Canlılık / Sağlıklı' },
      { value: 0.85, color: '#1a9850', label: 'Mükemmel / Yoğun Biyokütle' },
    ],
    cropStages: 'Tüm fenolojik evrelerde genel canlılık izleme için uygundur.',
    isSystemDefined: true,
    isActive: true,
  },
  {
    code: 'NDRE',
    name: 'Normalize Edilmiş Kırmızı Kenar İndeksi (NDRE)',
    description: 'Yoğun bitki örtüsünde klorofil içeriğini ve azot stresini NDVI doyumuna ulaşmadan önce erken tespit eder.',
    formula: '(NIR - RedEdge) / (NIR + RedEdge)',
    requiredBands: ['B05_RedEdge', 'B08_NIR'],
    supportedSources: ['sentinel-2', 'planetscope'],
    valueMin: -1,
    valueMax: 1,
    colorRamp: [
      { value: 0.15, color: '#d73027', label: 'Şiddetli Klorofil / Azot Stresi' },
      { value: 0.3, color: '#fee08b', label: 'Orta Düzey Klorofil' },
      { value: 0.55, color: '#1a9850', label: 'Yüksek Azot ve Sağlıklı Klorofil' },
    ],
    cropStages: 'Sapa kalkma, başaklanma ve meyve büyüme evrelerinde kritik azot takibi.',
    isSystemDefined: true,
    isActive: true,
  },
  {
    code: 'MSAVI',
    name: 'Modifiye Toprak Düzeltmeli Bitki İndeksi (MSAVI)',
    description: 'Erken gelişim evresinde veya seyrek ekimlerde toprak yansımasının yarattığı yanıltıcı etkileri minimize eder.',
    formula: '(2 * NIR + 1 - sqrt((2 * NIR + 1)^2 - 8 * (NIR - Red))) / 2',
    requiredBands: ['B04_Red', 'B08_NIR'],
    supportedSources: ['sentinel-2', 'planetscope'],
    valueMin: -1,
    valueMax: 1,
    colorRamp: [
      { value: 0.1, color: '#d73027', label: 'Toprak Baskın / Çok Zayıf Çıkış' },
      { value: 0.3, color: '#fee08b', label: 'Filizlenme / Erken Çıkış' },
      { value: 0.6, color: '#1a9850', label: 'Kuvvetli Yapraklanma' },
    ],
    cropStages: 'Çıkış, fide ve erken vejetatif gelişim dönemleri için en güvenilir indeks.',
    isSystemDefined: true,
    isActive: true,
  },
  {
    code: 'RECI',
    name: 'Kırmızı Kenar Klorofil İndeksi (RECI)',
    description: 'Klorofil konsantrasyonuna doğrusal yanıt verir. Gübreleme ihtiyacını ve yaprak yaşlanmasını izler.',
    formula: '(NIR / RedEdge) - 1',
    requiredBands: ['B05_RedEdge', 'B08_NIR'],
    supportedSources: ['sentinel-2'],
    valueMin: 0,
    valueMax: 10,
    colorRamp: [
      { value: 1.0, color: '#d73027', label: 'Klorofil Yetersizliği' },
      { value: 3.0, color: '#fee08b', label: 'Normal Klorofil' },
      { value: 5.5, color: '#1a9850', label: 'Yüksek Klorofil Yoğunluğu' },
    ],
    cropStages: 'Üst gübreleme zamanlaması ve yaprak sağlığı kontrolü.',
    isSystemDefined: true,
    isActive: true,
  },
  {
    code: 'NDMI',
    name: 'Normalize Edilmiş Nem İndeksi (NDMI)',
    description: 'Kısa dalga kızılötesi (SWIR) kullanarak bitki yapraklarındaki su içeriğini ve kuraklık stresini saptar.',
    formula: '(NIR - SWIR) / (NIR + SWIR)',
    requiredBands: ['B08_NIR', 'B11_SWIR'],
    supportedSources: ['sentinel-2'],
    valueMin: -1,
    valueMax: 1,
    colorRamp: [
      { value: -0.2, color: '#d73027', label: 'Aşırı Su Stresi / Kuruma' },
      { value: 0.1, color: '#fee08b', label: 'Hafif Su Açığı' },
      { value: 0.35, color: '#2b83ba', label: 'Yeterli Nem / Optimum Su Durumu' },
      { value: 0.55, color: '#014636', label: 'Çok Yüksek Nem / Doygun' },
    ],
    cropStages: 'Sulama planlaması, kuraklık kontrolü ve hasat öncesi su kesme takibi.',
    isSystemDefined: true,
    isActive: true,
  },
]

// -----------------------------------------------------------------------------
// Database Initialization & Seeding
// -----------------------------------------------------------------------------

export async function ensureSatelliteTablesAndSeed() {
  const tableStatements = [
    `CREATE TABLE IF NOT EXISTS satellite_sources (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      provider TEXT NOT NULL,
      resolution TEXT NOT NULL,
      available_bands TEXT,
      license_type TEXT DEFAULT 'open_access',
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    )`,
    `CREATE TABLE IF NOT EXISTS satellite_scenes (
      id TEXT PRIMARY KEY,
      source_id TEXT NOT NULL,
      field_id TEXT NOT NULL,
      scene_identifier TEXT NOT NULL,
      capture_date TEXT NOT NULL,
      processing_date TEXT NOT NULL,
      cloud_percent REAL DEFAULT 0,
      cirrus_percent REAL DEFAULT 0,
      cloud_shadow_percent REAL DEFAULT 0,
      valid_pixel_percent REAL DEFAULT 100,
      quality_level TEXT DEFAULT 'high',
      storage_reference TEXT,
      processing_status TEXT DEFAULT 'completed',
      error_message TEXT,
      created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    )`,
    `CREATE TABLE IF NOT EXISTS index_definitions (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT,
      formula TEXT,
      required_bands TEXT,
      supported_sources TEXT,
      value_min REAL DEFAULT -1,
      value_max REAL DEFAULT 1,
      color_ramp TEXT,
      crop_stages TEXT,
      is_system_defined INTEGER DEFAULT 1,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    )`,
    `CREATE TABLE IF NOT EXISTS index_results (
      id TEXT PRIMARY KEY,
      field_id TEXT NOT NULL,
      scene_id TEXT NOT NULL,
      index_code TEXT NOT NULL,
      mean_value REAL NOT NULL,
      min_value REAL NOT NULL,
      max_value REAL NOT NULL,
      standard_deviation REAL NOT NULL,
      valid_pixel_percent REAL NOT NULL,
      color_map_json TEXT,
      statistics_json TEXT,
      created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    )`,
    `CREATE TABLE IF NOT EXISTS field_monitoring_configs (
      id TEXT PRIMARY KEY,
      field_id TEXT NOT NULL UNIQUE,
      crop_id TEXT,
      active INTEGER DEFAULT 1,
      preferred_source TEXT DEFAULT 'sentinel-2',
      preferred_indices TEXT DEFAULT '["NDVI","NDRE","MSAVI","RECI","NDMI"]',
      max_cloud_percent REAL DEFAULT 40,
      min_valid_pixel_percent REAL DEFAULT 60,
      alert_enabled INTEGER DEFAULT 1,
      email_enabled INTEGER DEFAULT 0,
      notification_frequency TEXT DEFAULT 'instant',
      created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    )`,
    `CREATE TABLE IF NOT EXISTS field_anomalies (
      id TEXT PRIMARY KEY,
      field_id TEXT NOT NULL,
      index_result_id TEXT,
      scene_id TEXT,
      risk_type TEXT NOT NULL,
      risk_level TEXT NOT NULL,
      change_percent REAL NOT NULL,
      confidence_score REAL DEFAULT 0.85,
      explanation TEXT NOT NULL,
      status TEXT DEFAULT 'new',
      associated_task_id TEXT,
      detected_at TEXT NOT NULL,
      resolved_at TEXT,
      created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    )`,
    `CREATE TABLE IF NOT EXISTS monitoring_alerts (
      id TEXT PRIMARY KEY,
      field_id TEXT NOT NULL,
      anomaly_id TEXT NOT NULL,
      channel TEXT NOT NULL DEFAULT 'in_app',
      recipient_id TEXT,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT DEFAULT 'sent',
      sent_at TEXT,
      read_at TEXT,
      created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    )`,
    `CREATE TABLE IF NOT EXISTS custom_index_definitions (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT,
      formula TEXT NOT NULL,
      required_bands TEXT,
      value_min REAL DEFAULT -1,
      value_max REAL DEFAULT 1,
      color_ramp TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    )`,
    `CREATE TABLE IF NOT EXISTS crop_phenology_benchmarks (
      id TEXT PRIMARY KEY,
      crop_name TEXT NOT NULL,
      stage_name TEXT NOT NULL,
      stage_order INTEGER NOT NULL,
      day_start INTEGER NOT NULL,
      day_end INTEGER NOT NULL,
      expected_ndvi_min REAL NOT NULL,
      expected_ndvi_max REAL NOT NULL,
      expected_ndre_min REAL,
      expected_ndre_max REAL,
      description TEXT,
      created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    )`,
    `CREATE TABLE IF NOT EXISTS planetscope_quota (
      id TEXT PRIMARY KEY,
      monthly_limit_hectares REAL DEFAULT 500,
      used_hectares REAL DEFAULT 42.5,
      renewal_date TEXT,
      api_status TEXT DEFAULT 'ready',
      updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    )`,
    // Indexes for fast lookups
    `CREATE INDEX IF NOT EXISTS idx_satellite_scenes_field ON satellite_scenes(field_id, capture_date DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_index_results_field_scene ON index_results(field_id, scene_id, index_code)`,
    `CREATE INDEX IF NOT EXISTS idx_field_anomalies_field ON field_anomalies(field_id, detected_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_anomaly ON monitoring_alerts(anomaly_id)`,
    `CREATE INDEX IF NOT EXISTS idx_crop_phenology_crop ON crop_phenology_benchmarks(crop_name, stage_order ASC)`,
  ]

  for (const sql of tableStatements) {
    try {
      await executeSql(sql)
    } catch (err) {
      console.warn('[satelliteDb] Table statement warning:', err)
    }
  }

  // Column migrations for field_anomalies feedback
  try {
    await executeSql(`ALTER TABLE field_anomalies ADD COLUMN feedback_status TEXT DEFAULT 'unreviewed'`)
  } catch {}
  try {
    await executeSql(`ALTER TABLE field_anomalies ADD COLUMN feedback_notes TEXT`)
  } catch {}

  // Seed satellite sources
  await seedSatelliteSources()

  // Seed default vegetation indices
  await seedIndexDefinitions()

  // Seed Phase 2 presets & benchmarks
  await seedCustomIndexPresets()
  await seedCropPhenologyBenchmarks()
  await seedPlanetScopeQuota()
}

async function seedSatelliteSources() {
  const sources = [
    {
      id: 'sentinel-2',
      name: 'Copernicus Sentinel-2',
      provider: 'ESA / Copernicus',
      resolution: '10m',
      availableBands: JSON.stringify(['B02_Blue', 'B03_Green', 'B04_Red', 'B05_RedEdge', 'B08_NIR', 'B11_SWIR']),
      licenseType: 'open_access',
      status: 'active',
    },
    {
      id: 'planetscope',
      name: 'Planet PlanetScope',
      provider: 'Planet Labs PBC',
      resolution: '3m',
      availableBands: JSON.stringify(['Blue', 'Green', 'Red', 'RedEdge', 'NIR']),
      licenseType: 'commercial',
      status: 'active',
    },
  ]

  for (const src of sources) {
    try {
      await executeSql({
        sql: `INSERT INTO satellite_sources (id, name, provider, resolution, available_bands, license_type, status)
              VALUES (?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(id) DO UPDATE SET
                name = excluded.name,
                provider = excluded.provider,
                resolution = excluded.resolution,
                available_bands = excluded.available_bands`,
        args: [src.id, src.name, src.provider, src.resolution, src.availableBands, src.licenseType, src.status],
      })
    } catch {}
  }
}

async function seedIndexDefinitions() {
  for (const idx of SYSTEM_INDEX_DEFINITIONS) {
    const id = `idx_${idx.code.toLowerCase()}`
    try {
      await executeSql({
        sql: `INSERT INTO index_definitions (id, code, name, description, formula, required_bands, supported_sources, value_min, value_max, color_ramp, crop_stages, is_system_defined, is_active)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(code) DO UPDATE SET
                name = excluded.name,
                description = excluded.description,
                formula = excluded.formula,
                required_bands = excluded.required_bands,
                supported_sources = excluded.supported_sources,
                value_min = excluded.value_min,
                value_max = excluded.value_max,
                color_ramp = excluded.color_ramp,
                crop_stages = excluded.crop_stages`,
        args: [
          id,
          idx.code,
          idx.name,
          idx.description,
          idx.formula,
          JSON.stringify(idx.requiredBands),
          JSON.stringify(idx.supportedSources),
          idx.valueMin,
          idx.valueMax,
          JSON.stringify(idx.colorRamp),
          idx.cropStages || null,
          1,
          1,
        ],
      })
    } catch {}
  }
}

async function seedCustomIndexPresets() {
  for (const item of PRESET_CUSTOM_INDICES) {
    const id = `custom_${item.code.toLowerCase()}`
    try {
      await executeSql({
        sql: `INSERT INTO custom_index_definitions (id, code, name, description, formula, required_bands, value_min, value_max, color_ramp, is_active)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
              ON CONFLICT(code) DO UPDATE SET
                name = excluded.name,
                description = excluded.description,
                formula = excluded.formula,
                required_bands = excluded.required_bands,
                value_min = excluded.value_min,
                value_max = excluded.value_max,
                color_ramp = excluded.color_ramp`,
        args: [
          id,
          item.code,
          item.name,
          item.description,
          item.formula,
          JSON.stringify(item.requiredBands),
          item.valueMin,
          item.valueMax,
          JSON.stringify(item.colorRamp),
        ],
      })
    } catch {}
  }
}

async function seedCropPhenologyBenchmarks() {
  const benchmarks = [
    // Buğday
    { crop: 'Buğday', stage: 'Çimlenme & Fide', order: 1, dStart: 1, dEnd: 30, ndviMin: 0.15, ndviMax: 0.32, ndreMin: 0.10, ndreMax: 0.22, desc: 'İlk yaprak çıkışı ve zayıf örtü' },
    { crop: 'Buğday', stage: 'Kardeşlenme & Sapa Kalkma', order: 2, dStart: 31, dEnd: 75, ndviMin: 0.35, ndviMax: 0.68, ndreMin: 0.22, ndreMax: 0.45, desc: 'Hızlı vejetatif gelişim ve azot emilimi' },
    { crop: 'Buğday', stage: 'Başaklanma & Çiçeklenme', order: 3, dStart: 76, dEnd: 115, ndviMin: 0.68, ndviMax: 0.88, ndreMin: 0.45, ndreMax: 0.62, desc: 'Maksimum fotosentez ve tepe biyokütlesi' },
    { crop: 'Buğday', stage: 'Sarı / Hamur Olum', order: 4, dStart: 116, dEnd: 145, ndviMin: 0.42, ndviMax: 0.65, ndreMin: 0.28, ndreMax: 0.42, desc: 'Tane doldurma ve yeşil alan azalması' },
    { crop: 'Buğday', stage: 'Tam Olum / Hasat', order: 5, dStart: 146, dEnd: 170, ndviMin: 0.18, ndviMax: 0.35, ndreMin: 0.12, ndreMax: 0.22, desc: 'Kuruma ve hasada hazır durum' },
    // Mısır
    { crop: 'Mısır', stage: 'Çıkış & Erken Vejetatif (V1-V4)', order: 1, dStart: 1, dEnd: 25, ndviMin: 0.18, ndviMax: 0.38, ndreMin: 0.12, ndreMax: 0.25, desc: 'Fide yerleşimi' },
    { crop: 'Mısır', stage: 'Hızlı Büyüme (V6-V12)', order: 2, dStart: 26, dEnd: 60, ndviMin: 0.45, ndviMax: 0.78, ndreMin: 0.30, ndreMax: 0.52, desc: 'Gövde uzaması ve üst gübreleme periyodu' },
    { crop: 'Mısır', stage: 'Tepe Püskülü & Koçan (R1)', order: 3, dStart: 61, dEnd: 90, ndviMin: 0.78, ndviMax: 0.92, ndreMin: 0.52, ndreMax: 0.68, desc: 'Kritik su ve polenlenme evresi' },
    { crop: 'Mısır', stage: 'Tane Dolumu (R3-R4)', order: 4, dStart: 91, dEnd: 120, ndviMin: 0.62, ndviMax: 0.82, ndreMin: 0.38, ndreMax: 0.55, desc: 'Süt olumu ve nişasta depolama' },
    { crop: 'Mısır', stage: 'Hasat Olumu (R6)', order: 5, dStart: 121, dEnd: 145, ndviMin: 0.25, ndviMax: 0.45, ndreMin: 0.15, ndreMax: 0.28, desc: 'Siyah nokta tabakası ve kuruma' },
    // Domates
    { crop: 'Domates', stage: 'Şaşırtma & Köklenme', order: 1, dStart: 1, dEnd: 20, ndviMin: 0.20, ndviMax: 0.38, ndreMin: 0.14, ndreMax: 0.25, desc: 'Fide tutumu' },
    { crop: 'Domates', stage: 'Vejetatif Gelişme & İlk Çiçek', order: 2, dStart: 21, dEnd: 50, ndviMin: 0.42, ndviMax: 0.72, ndreMin: 0.28, ndreMax: 0.48, desc: 'Gövde dallanması ve çiçek salkımı' },
    { crop: 'Domates', stage: 'Meyve Tutumu & İrilme', order: 3, dStart: 51, dEnd: 85, ndviMin: 0.72, ndviMax: 0.88, ndreMin: 0.48, ndreMax: 0.64, desc: 'Yoğun su ve besin tüketimi' },
    { crop: 'Domates', stage: 'Hasat & Olgunlaşma', order: 4, dStart: 86, dEnd: 125, ndviMin: 0.48, ndviMax: 0.68, ndreMin: 0.32, ndreMax: 0.46, desc: 'Kademeli hasat dönemi' },
    // Ayçiçeği
    { crop: 'Ayçiçeği', stage: 'Fide & Rozet', order: 1, dStart: 1, dEnd: 30, ndviMin: 0.20, ndviMax: 0.40, ndreMin: 0.14, ndreMax: 0.26, desc: 'İlk 4-8 yaprak oluşumu' },
    { crop: 'Ayçiçeği', stage: 'Yıldız Tabla & Hızlı Boylanma', order: 2, dStart: 31, dEnd: 60, ndviMin: 0.48, ndviMax: 0.78, ndreMin: 0.32, ndreMax: 0.54, desc: 'Tomurcuklanma evresi' },
    { crop: 'Ayçiçeği', stage: 'Çiçeklenme', order: 3, dStart: 61, dEnd: 80, ndviMin: 0.75, ndviMax: 0.90, ndreMin: 0.52, ndreMax: 0.66, desc: 'Sarı taç yapraklar ve tepe canlılığı' },
    { crop: 'Ayçiçeği', stage: 'Tane Dolumu & Hasat', order: 4, dStart: 81, dEnd: 110, ndviMin: 0.32, ndviMax: 0.56, ndreMin: 0.20, ndreMax: 0.36, desc: 'Tabla kuruması ve yağ bağlama' },
    // Pamuk
    { crop: 'Pamuk', stage: 'Çıkış & Fide', order: 1, dStart: 1, dEnd: 35, ndviMin: 0.18, ndviMax: 0.35, ndreMin: 0.12, ndreMax: 0.24, desc: 'Kök derinleşmesi ve ilk taraklar' },
    { crop: 'Pamuk', stage: 'Taraklanma & Çiçeklenme', order: 2, dStart: 36, dEnd: 80, ndviMin: 0.45, ndviMax: 0.76, ndreMin: 0.30, ndreMax: 0.52, desc: 'Beyaz/pembe çiçekler ve tepe gelişimi' },
    { crop: 'Pamuk', stage: 'Koza Gelişimi', order: 3, dStart: 81, dEnd: 120, ndviMin: 0.72, ndviMax: 0.86, ndreMin: 0.48, ndreMax: 0.62, desc: 'Lif uzaması ve koza dolumu' },
    { crop: 'Pamuk', stage: 'Koza Açımı & Hasat', order: 4, dStart: 121, dEnd: 155, ndviMin: 0.28, ndviMax: 0.50, ndreMin: 0.18, ndreMax: 0.32, desc: 'Defoliasyon ve lif hasadı' },
  ]

  for (const b of benchmarks) {
    const id = `bm_${b.crop.toLowerCase()}_${b.order}`
    try {
      await executeSql({
        sql: `INSERT INTO crop_phenology_benchmarks (id, crop_name, stage_name, stage_order, day_start, day_end, expected_ndvi_min, expected_ndvi_max, expected_ndre_min, expected_ndre_max, description)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(id) DO UPDATE SET
                expected_ndvi_min = excluded.expected_ndvi_min,
                expected_ndvi_max = excluded.expected_ndvi_max`,
        args: [id, b.crop, b.stage, b.order, b.dStart, b.dEnd, b.ndviMin, b.ndviMax, b.ndreMin, b.ndreMax, b.desc],
      })
    } catch {}
  }
}

async function seedPlanetScopeQuota() {
  try {
    const now = new Date()
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().slice(0, 10)
    await executeSql({
      sql: `INSERT INTO planetscope_quota (id, monthly_limit_hectares, used_hectares, renewal_date, api_status)
            VALUES ('ps_quota_default', 500.0, 48.5, ?, 'ready')
            ON CONFLICT(id) DO NOTHING`,
      args: [nextMonth],
    })
  } catch {}
}

// -----------------------------------------------------------------------------
// Scene, Index and Anomaly Operations
// -----------------------------------------------------------------------------

export async function getIndexDefinitions(): Promise<IndexDefinition[]> {
  await ensureSatelliteTablesAndSeed()
  const res = await executeSql(`SELECT * FROM index_definitions WHERE is_active = 1 ORDER BY is_system_defined DESC, code ASC`)
  return (res.rows || []).map((r: any) => ({
    id: String(r.id),
    code: String(r.code),
    name: String(r.name),
    description: String(r.description || ''),
    formula: String(r.formula || ''),
    requiredBands: typeof r.required_bands === 'string' ? JSON.parse(r.required_bands) : [],
    supportedSources: typeof r.supported_sources === 'string' ? JSON.parse(r.supported_sources) : [],
    valueMin: Number(r.value_min),
    valueMax: Number(r.value_max),
    colorRamp: typeof r.color_ramp === 'string' ? JSON.parse(r.color_ramp) : [],
    cropStages: r.crop_stages ? String(r.crop_stages) : undefined,
    isSystemDefined: Boolean(r.is_system_defined),
    isActive: Boolean(r.is_active),
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  }))
}

export async function getScenesForField(fieldId: string, limit = 20): Promise<SatelliteScene[]> {
  await ensureSatelliteTablesAndSeed()
  const res = await executeSql({
    sql: `SELECT * FROM satellite_scenes WHERE field_id = ? ORDER BY capture_date DESC LIMIT ?`,
    args: [String(fieldId), limit],
  })

  return (res.rows || []).map((r: any) => ({
    id: String(r.id),
    sourceId: String(r.source_id),
    fieldId: String(r.field_id),
    sceneIdentifier: String(r.scene_identifier),
    captureDate: String(r.capture_date),
    processingDate: String(r.processing_date),
    cloudPercent: Number(r.cloud_percent || 0),
    cirrusPercent: Number(r.cirrus_percent || 0),
    cloudShadowPercent: Number(r.cloud_shadow_percent || 0),
    validPixelPercent: Number(r.valid_pixel_percent || 100),
    qualityLevel: (r.quality_level || 'high') as any,
    storageReference: r.storage_reference ? String(r.storage_reference) : undefined,
    processingStatus: (r.processing_status || 'completed') as any,
    errorMessage: r.error_message ? String(r.error_message) : undefined,
    createdAt: String(r.created_at),
  }))
}

export async function getIndexResultsForScene(sceneId: string): Promise<IndexResult[]> {
  await ensureSatelliteTablesAndSeed()
  const res = await executeSql({
    sql: `SELECT * FROM index_results WHERE scene_id = ?`,
    args: [String(sceneId)],
  })

  return (res.rows || []).map((r: any) => ({
    id: String(r.id),
    fieldId: String(r.field_id),
    sceneId: String(r.scene_id),
    indexCode: String(r.index_code),
    meanValue: Number(r.mean_value),
    minValue: Number(r.min_value),
    maxValue: Number(r.max_value),
    standardDeviation: Number(r.standard_deviation),
    validPixelPercent: Number(r.valid_pixel_percent),
    colorMapJson: r.color_map_json ? String(r.color_map_json) : undefined,
    statisticsJson: r.statistics_json ? String(r.statistics_json) : undefined,
    createdAt: String(r.created_at),
  }))
}

export async function getTimeSeriesForField(fieldId: string, indexCode = 'NDVI'): Promise<any[]> {
  await ensureSatelliteTablesAndSeed()
  const res = await executeSql({
    sql: `SELECT s.capture_date, s.cloud_percent, s.valid_pixel_percent, s.quality_level,
                 r.mean_value, r.min_value, r.max_value, r.standard_deviation, r.index_code
          FROM index_results r
          JOIN satellite_scenes s ON r.scene_id = s.id
          WHERE r.field_id = ? AND r.index_code = ?
          ORDER BY s.capture_date ASC`,
    args: [String(fieldId), indexCode],
  })

  return (res.rows || []).map((r: any) => ({
    date: String(r.capture_date),
    mean: Number(r.mean_value),
    min: Number(r.min_value),
    max: Number(r.max_value),
    stdDev: Number(r.standard_deviation),
    cloudPercent: Number(r.cloud_percent),
    validPixelPercent: Number(r.valid_pixel_percent),
    quality: String(r.quality_level),
    indexCode: String(r.index_code),
  }))
}

export async function getAnomaliesForField(fieldId?: string): Promise<FieldAnomaly[]> {
  await ensureSatelliteTablesAndSeed()
  const sql = fieldId
    ? `SELECT * FROM field_anomalies WHERE field_id = ? ORDER BY detected_at DESC`
    : `SELECT * FROM field_anomalies ORDER BY detected_at DESC LIMIT 50`
  const args = fieldId ? [String(fieldId)] : []

  const res = await executeSql({ sql, args })
  return (res.rows || []).map((r: any) => ({
    id: String(r.id),
    fieldId: String(r.field_id),
    indexResultId: r.index_result_id ? String(r.index_result_id) : undefined,
    sceneId: r.scene_id ? String(r.scene_id) : undefined,
    riskType: r.risk_type as any,
    riskLevel: r.risk_level as any,
    changePercent: Number(r.change_percent),
    confidenceScore: Number(r.confidence_score),
    explanation: String(r.explanation),
    status: r.status as any,
    associatedTaskId: r.associated_task_id ? String(r.associated_task_id) : undefined,
    detectedAt: String(r.detected_at),
    resolvedAt: r.resolved_at ? String(r.resolved_at) : undefined,
    createdAt: String(r.created_at),
  }))
}

export async function createTaskFromAnomaly(anomalyId: string, assignedTo?: string, customNote?: string): Promise<{ ok: boolean; task?: any; error?: string }> {
  await ensureSatelliteTablesAndSeed()

  const anomRes = await executeSql({
    sql: `SELECT * FROM field_anomalies WHERE id = ?`,
    args: [String(anomalyId)],
  })

  if (!anomRes.rows || anomRes.rows.length === 0) {
    return { ok: false, error: 'Anomali kaydı bulunamadı' }
  }

  const anom: any = anomRes.rows[0]
  const fieldId = String(anom.field_id)
  const field = await getFieldById(fieldId)
  const fieldName = field ? field.name : `Tarla #${fieldId}`

  let titleTr = 'Uydu Analizi Saha Kontrolü'
  let description = `Uydu izleme sistemi tarafından tespit edilen anomali: ${anom.explanation}`

  if (anom.risk_type === 'water_stress') {
    titleTr = 'Su Stresi ve Sulama İncelemesi'
    description = `NDMI nem indeksi düşüşü tespit edildi (${anom.change_percent}%). Sulama hatlarını ve toprak nemini sahada kontrol edin.`
  } else if (anom.risk_type === 'nutrient_deficiency' || anom.risk_type === 'chlorophyll_loss') {
    titleTr = 'Klorofil & Azot Düzeyi Kontrolü'
    description = `NDRE/RECI seviyesinde gerileme görüldü (${anom.change_percent}%). Yaprak rengini ve üst gübreleme durumunu inceleyin.`
  } else if (anom.risk_type === 'vigor_drop') {
    titleTr = 'Bitki Canlılık Kaybı İncelemesi'
    description = `NDVI bitki canlılığında ani düşüş (${anom.change_percent}%). Hastalık, zararlı veya bölgesel gelişim geriliği kontrolü yapın.`
  }

  if (customNote) {
    description += `\nNot: ${customNote}`
  }

  const nowIso = new Date().toISOString()
  const todayYmd = nowIso.slice(0, 10)

  // Create real task in tasks table
  const createdTask = await createTask({
    fieldId,
    type: 'inspection',
    title: 'Satellite Risk Inspection',
    titleTr,
    description,
    plannedDate: todayYmd,
    status: 'pending',
  })

  // Mark anomaly status as task_created and link task id
  await executeSql({
    sql: `UPDATE field_anomalies SET status = 'task_created', associated_task_id = ? WHERE id = ?`,
    args: [createdTask.id, String(anomalyId)],
  })

  // Create in-app alert log
  await executeSql({
    sql: `INSERT INTO monitoring_alerts (id, field_id, anomaly_id, channel, title, message, status, sent_at)
          VALUES (?, ?, ?, 'in_app', ?, ?, 'sent', ?)`,
    args: [
      `alt_${Date.now()}`,
      fieldId,
      String(anomalyId),
      `${fieldName}: Saha Görevi Oluşturuldu`,
      `"${titleTr}" görevi ajandaya eklendi.`,
      nowIso,
    ],
  })

  return { ok: true, task: createdTask }
}

// -----------------------------------------------------------------------------
// Phase 2: Custom Indices Operations
// -----------------------------------------------------------------------------

export async function getCustomIndices(): Promise<CustomIndexRecord[]> {
  await ensureSatelliteTablesAndSeed()
  const res = await executeSql(`SELECT * FROM custom_index_definitions WHERE is_active = 1 ORDER BY code ASC`)
  return (res.rows || []).map((r: any) => ({
    id: String(r.id),
    code: String(r.code),
    name: String(r.name),
    description: String(r.description || ''),
    formula: String(r.formula),
    requiredBands: typeof r.required_bands === 'string' ? JSON.parse(r.required_bands) : [],
    valueMin: Number(r.value_min ?? -1),
    valueMax: Number(r.value_max ?? 1),
    colorRamp: typeof r.color_ramp === 'string' ? JSON.parse(r.color_ramp) : [],
    isActive: Boolean(r.is_active),
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  }))
}

export async function createCustomIndex(input: {
  code: string
  name: string
  description?: string
  formula: string
  colorRamp?: { value: number; color: string; label: string }[]
}): Promise<{ ok: boolean; index?: CustomIndexRecord; error?: string }> {
  await ensureSatelliteTablesAndSeed()

  const code = input.code.trim().toUpperCase()
  if (!code || !/^[A-Z0-9_]{2,12}$/.test(code)) {
    return { ok: false, error: 'İndeks kodu 2-12 karakter arası alfanümerik olmalıdır (örn: GNDVI, SAVI)' }
  }

  const validation = validateFormula(input.formula)
  if (!validation.isValid) {
    return { ok: false, error: validation.error || 'Formül geçersiz' }
  }

  const id = `custom_${code.toLowerCase()}_${Date.now()}`
  const name = input.name.trim() || code
  const description = input.description?.trim() || 'Özel kullanıcı tanımlı spektral vejetasyon indeksi'
  const requiredBandsJson = JSON.stringify(validation.requiredBands)

  const defaultColorRamp = input.colorRamp && input.colorRamp.length > 0
    ? input.colorRamp
    : [
        { value: 0.1, color: '#d73027', label: 'Düşük Değer' },
        { value: 0.4, color: '#fee08b', label: 'Orta Değer' },
        { value: 0.7, color: '#1a9850', label: 'Yüksek Değer' },
      ]

  try {
    await executeSql({
      sql: `INSERT INTO custom_index_definitions (id, code, name, description, formula, required_bands, value_min, value_max, color_ramp, is_active)
            VALUES (?, ?, ?, ?, ?, ?, -1, 1, ?, 1)`,
      args: [id, code, name, description, input.formula.trim(), requiredBandsJson, JSON.stringify(defaultColorRamp)],
    })

    return {
      ok: true,
      index: {
        id,
        code,
        name,
        description,
        formula: input.formula.trim(),
        requiredBands: validation.requiredBands,
        valueMin: -1,
        valueMax: 1,
        colorRamp: defaultColorRamp,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    }
  } catch (err: any) {
    if (String(err?.message || '').includes('UNIQUE')) {
      return { ok: false, error: `"${code}" kodlu bir indeks zaten mevcut.` }
    }
    return { ok: false, error: err?.message || 'Veritabanına kaydedilirken hata oluştu' }
  }
}

export async function deleteCustomIndex(idOrCode: string): Promise<{ ok: boolean; error?: string }> {
  await ensureSatelliteTablesAndSeed()
  try {
    await executeSql({
      sql: `DELETE FROM custom_index_definitions WHERE id = ? OR code = ?`,
      args: [idOrCode, idOrCode],
    })
    return { ok: true }
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Silinemedi' }
  }
}

// -----------------------------------------------------------------------------
// Phase 2: Phenology Benchmarks
// -----------------------------------------------------------------------------

export async function getCropPhenologyBenchmarks(cropName?: string): Promise<PhenologyBenchmark[]> {
  await ensureSatelliteTablesAndSeed()
  const sql = cropName
    ? `SELECT * FROM crop_phenology_benchmarks WHERE crop_name = ? ORDER BY stage_order ASC`
    : `SELECT * FROM crop_phenology_benchmarks ORDER BY crop_name ASC, stage_order ASC`
  const args = cropName ? [cropName] : []

  const res = await executeSql({ sql, args })
  return (res.rows || []).map((r: any) => ({
    id: String(r.id),
    cropName: String(r.crop_name),
    stageName: String(r.stage_name),
    stageOrder: Number(r.stage_order),
    dayStart: Number(r.day_start),
    dayEnd: Number(r.day_end),
    expectedNdviMin: Number(r.expected_ndvi_min),
    expectedNdviMax: Number(r.expected_ndvi_max),
    expectedNdreMin: r.expected_ndre_min ? Number(r.expected_ndre_min) : undefined,
    expectedNdreMax: r.expected_ndre_max ? Number(r.expected_ndre_max) : undefined,
    description: String(r.description || ''),
  }))
}

// -----------------------------------------------------------------------------
// Phase 2: Anomaly Feedback Loop
// -----------------------------------------------------------------------------

export async function updateAnomalyFeedback(
  anomalyId: string,
  feedbackStatus: 'confirmed' | 'false_alarm',
  feedbackNotes?: string
): Promise<{ ok: boolean; error?: string }> {
  await ensureSatelliteTablesAndSeed()
  try {
    await executeSql({
      sql: `UPDATE field_anomalies
            SET feedback_status = ?, feedback_notes = COALESCE(?, feedback_notes)
            WHERE id = ?`,
      args: [feedbackStatus, feedbackNotes || null, anomalyId],
    })
    return { ok: true }
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Geri bildirim kaydedilemedi' }
  }
}

// -----------------------------------------------------------------------------
// Phase 2: PlanetScope Quota
// -----------------------------------------------------------------------------

export async function getPlanetScopeQuota(): Promise<PlanetScopeQuota> {
  await ensureSatelliteTablesAndSeed()
  const res = await executeSql(`SELECT * FROM planetscope_quota LIMIT 1`)
  if (res.rows && res.rows.length > 0) {
    const r: any = res.rows[0]
    return {
      monthlyLimitHectares: Number(r.monthly_limit_hectares || 500),
      usedHectares: Number(r.used_hectares || 48.5),
      renewalDate: String(r.renewal_date || ''),
      apiStatus: String(r.api_status || 'ready'),
    }
  }
  return {
    monthlyLimitHectares: 500,
    usedHectares: 48.5,
    renewalDate: '2026-10-01',
    apiStatus: 'ready',
  }
}

// -----------------------------------------------------------------------------
// Phase 2: Grid-Based Zonal Anomaly Generator (10m x 10m Pixel Decomposition)
// -----------------------------------------------------------------------------

export async function generateFieldGridAnomalies(fieldId: string, sceneId?: string): Promise<{
  fieldId: string
  meanNdvi: number
  stdDev: number
  gridRows: number
  gridCols: number
  totalCells: number
  stressCellCount: number
  cells: GridAnomalyCell[]
}> {
  await ensureSatelliteTablesAndSeed()
  const field = await getFieldById(fieldId)

  // Determine center and bounding box
  let centerLat = 38.4237
  let centerLng = 27.1428
  let minLat = centerLat - 0.002
  let maxLat = centerLat + 0.002
  let minLng = centerLng - 0.003
  let maxLng = centerLng + 0.003

  if (field && Array.isArray(field.polygonCoordinates) && field.polygonCoordinates.length > 2) {
    const lats = field.polygonCoordinates.map((c: any) => c.lat || c[0])
    const lngs = field.polygonCoordinates.map((c: any) => c.lng || c[1])
    minLat = Math.min(...lats)
    maxLat = Math.max(...lats)
    minLng = Math.min(...lngs)
    maxLng = Math.max(...lngs)
    centerLat = (minLat + maxLat) / 2
    centerLng = (minLng + maxLng) / 2
  } else if (field && field.latitude && field.longitude) {
    centerLat = field.latitude
    centerLng = field.longitude
    minLat = centerLat - 0.0025
    maxLat = centerLat + 0.0025
    minLng = centerLng - 0.0035
    maxLng = centerLng + 0.0035
  }

  const rows = 6
  const cols = 7
  const dLat = (maxLat - minLat) / rows
  const dLng = (maxLng - minLng) / cols

  // Generate deterministic synthetic values representing realistic intra-field variance
  const seed = (Math.abs(centerLat * 1000) + Math.abs(centerLng * 1000)) % 100
  const cells: { row: number; col: number; cLat: number; cLng: number; bounds: [[number, number], [number, number]]; ndvi: number }[] = []

  let sum = 0
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const south = minLat + r * dLat
      const north = south + dLat
      const west = minLng + c * dLng
      const east = west + dLng
      const cellCenterLat = (south + north) / 2
      const cellCenterLng = (west + east) / 2

      // Spatial gradient + localized low spots
      const distToCorner = Math.sqrt(r * r + c * c) / 9
      const noise = (Math.sin(r * 2.5 + seed) * Math.cos(c * 2.1 + seed) * 0.08)
      let ndviVal = 0.68 - distToCorner * 0.12 + noise

      // Create a localized stress cluster in bottom-left cells (e.g., r=1, c=1; r=1, c=2; r=2, c=1)
      if ((r === 1 && (c === 1 || c === 2)) || (r === 2 && c === 1)) {
        ndviVal = 0.32 + Math.abs(noise * 0.5) // noticeable stress drop
      }

      ndviVal = Math.max(0.15, Math.min(0.92, Math.round(ndviVal * 1000) / 1000))
      sum += ndviVal

      cells.push({
        row: r,
        col: c,
        cLat: cellCenterLat,
        cLng: cellCenterLng,
        bounds: [[south, west], [north, east]],
        ndvi: ndviVal,
      })
    }
  }

  const mean = sum / cells.length
  const variance = cells.reduce((acc, curr) => acc + Math.pow(curr.ndvi - mean, 2), 0) / cells.length
  const stdDev = Math.max(0.01, Math.sqrt(variance))

  let stressCount = 0
  const finalCells: GridAnomalyCell[] = cells.map((cell, idx) => {
    const zScore = Math.round(((cell.ndvi - mean) / stdDev) * 100) / 100
    let status: 'stress' | 'normal' | 'thriving' = 'normal'
    let explanation = `Normal vejetasyon (NDVI: ${cell.ndvi.toFixed(2)})`

    if (zScore < -1.5) {
      status = 'stress'
      explanation = `Lokal stres / gerilik odağı (NDVI: ${cell.ndvi.toFixed(2)}, Z-Score: ${zScore.toFixed(2)})`
      stressCount++
    } else if (zScore > 1.4) {
      status = 'thriving'
      explanation = `Üstün canlılık ve biyokütle (NDVI: ${cell.ndvi.toFixed(2)}, Z-Score: +${zScore.toFixed(2)})`
    }

    return {
      id: `cell_${cell.row}_${cell.col}`,
      row: cell.row,
      col: cell.col,
      centerLat: cell.cLat,
      centerLng: cell.cLng,
      bounds: cell.bounds,
      ndvi: cell.ndvi,
      zScore,
      status,
      explanation,
    }
  })

  return {
    fieldId,
    meanNdvi: Math.round(mean * 1000) / 1000,
    stdDev: Math.round(stdDev * 1000) / 1000,
    gridRows: rows,
    gridCols: cols,
    totalCells: cells.length,
    stressCellCount: stressCount,
    cells: finalCells,
  }
}

// -----------------------------------------------------------------------------
// Phase 2: Portfolio Summary & Risk Ranking
// -----------------------------------------------------------------------------

export interface PortfolioFieldSummary {
  fieldId: string
  fieldName: string
  cropType: string
  areaDecares: number
  location: string
  latestNdvi: number
  ndviTrend: number // % change compared to previous
  anomalyCount: number
  unreviewedAnomalies: number
  healthScore: number // 0 - 100
  riskLevel: 'critical' | 'warning' | 'optimal'
  lastCaptureDate: string
  recommendedAction: string
}

export async function getPortfolioSummary(): Promise<PortfolioFieldSummary[]> {
  await ensureSatelliteTablesAndSeed()
  const fields = await getAllFields()
  const portfolio: PortfolioFieldSummary[] = []

  for (const field of fields) {
    const scenes = await getScenesForField(field.id, 2)
    const latestScene = scenes[0]
    let latestNdvi = 0.65
    let prevNdvi = 0.68
    let lastCapture = latestScene ? latestScene.captureDate : '2026-09-02'

    if (latestScene) {
      const results = await getIndexResultsForScene(latestScene.id)
      const ndviRes = results.find(r => r.indexCode === 'NDVI')
      if (ndviRes) latestNdvi = ndviRes.meanValue
    }

    if (scenes.length > 1) {
      const prevResults = await getIndexResultsForScene(scenes[1].id)
      const prevNdviRes = prevResults.find(r => r.indexCode === 'NDVI')
      if (prevNdviRes) prevNdvi = prevNdviRes.meanValue
    }

    const anomalies = await getAnomaliesForField(field.id)
    const unreviewed = anomalies.filter(a => !a.feedbackStatus || a.feedbackStatus === 'unreviewed').length
    const criticalCount = anomalies.filter(a => a.riskLevel === 'high' || a.riskLevel === 'critical').length

    const trend = prevNdvi > 0 ? Math.round(((latestNdvi - prevNdvi) / prevNdvi) * 1000) / 10 : 0

    // Compute 0-100 composite health score
    let score = Math.round(latestNdvi * 100)
    if (trend < -10) score -= 15
    if (criticalCount > 0) score -= 20
    score = Math.max(10, Math.min(98, score))

    let riskLevel: 'critical' | 'warning' | 'optimal' = 'optimal'
    let recommendedAction = 'Rutin gelişim takibi devam ediyor.'

    if (score < 45 || criticalCount > 0 || trend < -18) {
      riskLevel = 'critical'
      recommendedAction = 'Acil saha teftişi ve sulama/besin kontrolü önerilir.'
    } else if (score < 65 || anomalies.length > 0 || trend < -5) {
      riskLevel = 'warning'
      recommendedAction = 'Bölgesel vejetasyon düşüşü tespit edildi; 48 saat içinde kontrol edilmeli.'
    }

    portfolio.push({
      fieldId: field.id,
      fieldName: field.name,
      cropType: field.cropType || 'Belirtilmemiş',
      areaDecares: field.areaDecares || 0,
      location: [field.ilce, field.il].filter(Boolean).join(', ') || 'Belirtilmemiş',
      latestNdvi: Math.round(latestNdvi * 100) / 100,
      ndviTrend: trend,
      anomalyCount: anomalies.length,
      unreviewedAnomalies: unreviewed,
      healthScore: score,
      riskLevel,
      lastCaptureDate: lastCapture,
      recommendedAction,
    })
  }

  // Sort by priority risk: critical first, then lowest health score
  portfolio.sort((a, b) => {
    const riskWeight = { critical: 3, warning: 2, optimal: 1 }
    if (riskWeight[b.riskLevel] !== riskWeight[a.riskLevel]) {
      return riskWeight[b.riskLevel] - riskWeight[a.riskLevel]
    }
    return a.healthScore - b.healthScore
  })

  return portfolio
}
