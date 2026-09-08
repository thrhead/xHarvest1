import { NextResponse } from 'next/server'
import { resolveRegionByCoords } from '@/lib/regionDb'

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

export async function POST(request: Request) {
  try {
    const body = await request.json()
    let lat: number | null = null
    let lng: number | null = null

    if (typeof body.lat === 'number' && typeof body.lng === 'number') {
      lat = body.lat
      lng = body.lng
    } else if (Array.isArray(body.coordinates) && body.coordinates.length > 0) {
      // Calculate Centroid of Polygon
      const coords = body.coordinates
      lat = coords.reduce((sum: number, c: any) => sum + (Array.isArray(c) ? c[0] : c.lat), 0) / coords.length
      lng = coords.reduce((sum: number, c: any) => sum + (Array.isArray(c) ? c[1] : c.lng), 0) / coords.length
    }

    if (lat == null || lng == null || isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { success: false, error: 'Geçersiz koordinat (lat, lng veya coordinates dizisi gerekli)' },
        {
          status: 400,
          headers: corsHeaders,
        }
      )
    }

    const result = await resolveRegionByCoords(lat, lng)

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      {
        status: 200,
        headers: corsHeaders,
      }
    )
  } catch (error: any) {
    console.error('[API /api/regions/resolve] Error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Bölge çözümlenemedi' },
      {
        status: 500,
        headers: corsHeaders,
      }
    )
  }
}
