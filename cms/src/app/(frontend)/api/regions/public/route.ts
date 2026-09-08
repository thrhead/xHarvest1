import { NextResponse } from 'next/server'
import { getDbRegions } from '@/lib/regionDb'

export const dynamic = 'force-dynamic'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400',
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  })
}

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

    return NextResponse.json(
      {
        success: true,
        count: regions.length,
        regions,
      },
      {
        status: 200,
        headers: corsHeaders,
      }
    )
  } catch (error: any) {
    console.error('[API /api/regions/public] Error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Bölgeler alınamadı' },
      {
        status: 500,
        headers: corsHeaders,
      }
    )
  }
}

export async function POST(request: Request) {
  return GET(request)
}
