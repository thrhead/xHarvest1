import { openDb } from './bootstrapSchema'
import { TUIK_PROVINCES_SEED, AGRICULTURAL_BASINS_SEED, RegionSeedData } from '../seed/regionsData'

export interface DbRegion {
  id: number
  name: string
  slug: string
  source: 'tuik_il' | 'manual' | 'tuik_ilce'
  tuik_code?: string | null
  center_lat: number
  center_lng: number
  default_zoom: number
  boundary_json?: string | null
  parent_id?: number | null
  is_active: number
  sort_order: number
  created_at: string
  updated_at: string
}

// Haversine distance formula (in km)
export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Checks if a point (lat, lng) falls within a Bounding Box [minLat, minLng, maxLat, maxLng]
export function isPointInBBox(
  lat: number,
  lng: number,
  bbox: [number, number, number, number]
): boolean {
  const [minLat, minLng, maxLat, maxLng] = bbox
  return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng
}

// Ray-Casting algorithm for point-in-polygon (for GeoJSON coordinates array)
export function isPointInPolygon(
  lat: number,
  lng: number,
  polygon: Array<[number, number]> | Array<{ lat: number; lng: number }>
): boolean {
  let inside = false
  const points: Array<[number, number]> = polygon.map((p) =>
    Array.isArray(p) ? [p[0], p[1]] : [p.lat, p.lng]
  )

  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const xi = points[i][0]
    const yi = points[i][1]
    const xj = points[j][0]
    const yj = points[j][1]

    const intersect =
      yi > lng !== yj > lng && lat < ((xj - xi) * (lng - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }

  return inside
}

// Initialize regions table and seed if empty
export async function ensureRegionsTableAndSeed(force = false): Promise<void> {
  const db = openDb()

  await db.execute(`
    CREATE TABLE IF NOT EXISTS regions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      source TEXT NOT NULL DEFAULT 'tuik_il',
      tuik_code TEXT,
      center_lat REAL NOT NULL,
      center_lng REAL NOT NULL,
      default_zoom INTEGER NOT NULL DEFAULT 9,
      boundary_json TEXT,
      parent_id INTEGER,
      is_active INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)

  // Ensure index on slug and coordinates
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_regions_slug ON regions(slug);`)
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_regions_source ON regions(source);`)

  // Check count
  const countRes = await db.execute(`SELECT COUNT(*) as count FROM regions;`)
  const count = Number(countRes.rows[0]?.count ?? 0)

  if (count === 0 || force) {
    console.log(`[regionDb] Seeding 81 TÜİK Provinces and Agricultural Basins (force=${force})...`)

    // 1. Insert Basins
    for (let i = 0; i < AGRICULTURAL_BASINS_SEED.length; i++) {
      const b = AGRICULTURAL_BASINS_SEED[i]
      await db.execute({
        sql: `INSERT OR REPLACE INTO regions (name, slug, source, center_lat, center_lng, default_zoom, boundary_json, is_active, sort_order, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, datetime('now'), datetime('now'))`,
        args: [
          b.name,
          b.slug,
          b.source,
          b.centerLat,
          b.centerLng,
          b.defaultZoom,
          JSON.stringify({ bbox: b.bbox }),
          10 + i,
        ],
      })
    }

    // 2. Insert 81 Provinces
    for (let i = 0; i < TUIK_PROVINCES_SEED.length; i++) {
      const p = TUIK_PROVINCES_SEED[i]
      await db.execute({
        sql: `INSERT OR REPLACE INTO regions (name, slug, source, tuik_code, center_lat, center_lng, default_zoom, boundary_json, is_active, sort_order, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, datetime('now'), datetime('now'))`,
        args: [
          p.name,
          p.slug,
          p.source,
          p.tuikCode || null,
          p.centerLat,
          p.centerLng,
          p.defaultZoom,
          JSON.stringify({
            bbox: p.bbox,
            basinSlug: p.basinSlug,
            basinName: p.basinName,
          }),
          100 + i,
        ],
      })
    }

    console.log('[regionDb] Seeding completed: 81 Provinces & 6 Basins created/updated.')
  }
}

// Fetch all active regions
export async function getDbRegions(source?: string): Promise<DbRegion[]> {
  await ensureRegionsTableAndSeed()
  const db = openDb()

  const sql = source
    ? `SELECT * FROM regions WHERE is_active = 1 AND source = ? ORDER BY sort_order ASC, name ASC`
    : `SELECT * FROM regions WHERE is_active = 1 ORDER BY sort_order ASC, name ASC`
  const args = source ? [source] : []

  const res = await db.execute({ sql, args })
  return res.rows as unknown as DbRegion[]
}

export interface ResolveRegionResult {
  primaryRegion: {
    id: number
    name: string
    slug: string
    tuikCode?: string | null
    source: string
    centerLat: number
    centerLng: number
    distanceKm: number
  }
  secondaryRegion?: {
    id?: number
    name: string
    slug: string
  } | null
  formattedLabel: string // e.g. "Adana (Çukurova Tarımsal Havzası)" or "Konya"
  confidence: 'high' | 'medium' | 'fallback'
  alternatives?: Array<{
    id: number
    name: string
    slug: string
    distanceKm: number
  }>
}

// Resolve region by coordinates (lat, lng) with Point-in-Polygon -> BBox -> Haversine fallback
export async function resolveRegionByCoords(
  lat: number,
  lng: number
): Promise<ResolveRegionResult> {
  const regions = await getDbRegions()

  // Separate provinces and basins
  const provinces = regions.filter((r) => r.source === 'tuik_il')
  const basins = regions.filter((r) => r.source === 'manual')

  let matchedProvince: DbRegion | null = null
  let matchedBasin: DbRegion | null = null
  let confidence: 'high' | 'medium' | 'fallback' = 'fallback'

  // Step 1: Check Bounding Box match for Provinces (TÜİK İl - Primary)
  const bboxCandidates: DbRegion[] = []
  for (const prov of provinces) {
    if (prov.boundary_json) {
      try {
        const parsed = JSON.parse(prov.boundary_json)
        if (parsed.bbox && isPointInBBox(lat, lng, parsed.bbox)) {
          bboxCandidates.push(prov)
        }
      } catch {}
    }
  }

  if (bboxCandidates.length === 1) {
    matchedProvince = bboxCandidates[0]
    confidence = 'high'
  } else if (bboxCandidates.length > 1) {
    // If overlapping bounding boxes, find the closest province centroid
    let closestDist = Infinity
    for (const c of bboxCandidates) {
      const dist = haversineDistance(lat, lng, c.center_lat, c.center_lng)
      if (dist < closestDist) {
        closestDist = dist
        matchedProvince = c
      }
    }
    confidence = 'medium'
  }

  // Step 2: If no BBox match, find closest province by Haversine Distance (Centroid fallback)
  if (!matchedProvince && provinces.length > 0) {
    let closestDist = Infinity
    for (const prov of provinces) {
      const dist = haversineDistance(lat, lng, prov.center_lat, prov.center_lng)
      if (dist < closestDist) {
        closestDist = dist
        matchedProvince = prov
      }
    }
    confidence = 'fallback'
  }

  // Step 3: Check Secondary Agricultural Basin Context
  if (matchedProvince?.boundary_json) {
    try {
      const parsed = JSON.parse(matchedProvince.boundary_json)
      if (parsed.basinSlug) {
        const b = basins.find((basin) => basin.slug === parsed.basinSlug)
        if (b) matchedBasin = b
      }
    } catch {}
  }

  // If no basin from province link, check basin BBoxes
  if (!matchedBasin) {
    for (const b of basins) {
      if (b.boundary_json) {
        try {
          const parsed = JSON.parse(b.boundary_json)
          if (parsed.bbox && isPointInBBox(lat, lng, parsed.bbox)) {
            matchedBasin = b
            break
          }
        } catch {}
      }
    }
  }

  // Fallback default if completely empty
  const primary = matchedProvince || {
    id: 1,
    name: 'Ankara',
    slug: 'ankara',
    tuik_code: '06',
    source: 'tuik_il',
    center_lat: 39.92,
    center_lng: 32.85,
  }

  const primaryDistance = haversineDistance(
    lat,
    lng,
    primary.center_lat,
    primary.center_lng
  )

  // Calculate top 3 alternative closest provinces
  const alternatives = provinces
    .filter((p) => p.id !== primary.id)
    .map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      distanceKm: Math.round(haversineDistance(lat, lng, p.center_lat, p.center_lng)),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 3)

  const formattedLabel = matchedBasin
    ? `${primary.name} (${matchedBasin.name})`
    : primary.name

  return {
    primaryRegion: {
      id: primary.id,
      name: primary.name,
      slug: primary.slug,
      tuikCode: primary.tuik_code,
      source: primary.source,
      centerLat: primary.center_lat,
      centerLng: primary.center_lng,
      distanceKm: Math.round(primaryDistance * 10) / 10,
    },
    secondaryRegion: matchedBasin
      ? {
          id: matchedBasin.id,
          name: matchedBasin.name,
          slug: matchedBasin.slug,
        }
      : null,
    formattedLabel,
    confidence,
    alternatives,
  }
}
