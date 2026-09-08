import { NextResponse } from 'next/server'
import { getDbRegions } from '@/lib/regionDb'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const source = searchParams.get('source') || undefined
    const includeBoundary = searchParams.get('includeBoundary') === 'true'

    const rawRegions = await getDbRegions(source)

    // Optimization: Exclude heavy boundary string unless explicitly requested
    const regions = rawRegions.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      source: r.source,
      tuikCode: r.tuik_code,
      centerLat: r.center_lat,
      centerLng: r.center_lng,
      defaultZoom: r.default_zoom,
      boundary: includeBoundary && r.boundary_json ? JSON.parse(r.boundary_json) : undefined,
      parentId: r.parent_id,
      isActive: Boolean(r.is_active),
      sortOrder: r.sort_order,
    }))

    return NextResponse.json({
      success: true,
      count: regions.length,
      regions,
    })
  } catch (error: any) {
    console.error('[API /api/regions/public] Error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Bölgeler alınamadı' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  return GET(request)
}
