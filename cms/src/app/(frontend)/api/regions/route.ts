import { NextResponse } from 'next/server'
import { getDbRegions } from '@/lib/regionDb'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const rawRegions = await getDbRegions()
    return NextResponse.json({
      docs: rawRegions.map((r) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        source: r.source,
        tuikCode: r.tuik_code,
        centerLat: r.center_lat,
        centerLng: r.center_lng,
        defaultZoom: r.default_zoom,
        isActive: Boolean(r.is_active),
        sortOrder: r.sort_order,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      })),
      totalDocs: rawRegions.length,
      limit: 100,
      totalPages: 1,
      page: 1,
      pagingCounter: 1,
      hasPrevPage: false,
      hasNextPage: false,
      prevPage: null,
      nextPage: null,
    })
  } catch (error: any) {
    console.error('[API /api/regions] Error:', error)
    return NextResponse.json({ docs: [], totalDocs: 0, error: error?.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  return GET(request)
}
