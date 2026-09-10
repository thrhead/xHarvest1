import { NextResponse } from 'next/server'
import { getIndexDefinitions, getIndexResultsForScene } from '@/lib/satelliteDb'

export const dynamic = 'force-dynamic'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders })
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sceneId = searchParams.get('sceneId')

    const definitions = await getIndexDefinitions()

    let results: any[] = []
    if (sceneId) {
      results = await getIndexResultsForScene(sceneId)
    }

    return NextResponse.json(
      {
        ok: true,
        definitions,
        results,
      },
      { status: 200, headers: corsHeaders }
    )
  } catch (error: any) {
    console.error('[monitoring/indices] Error:', error)
    return NextResponse.json(
      { ok: false, error: error?.message || 'İndeks verileri alınırken hata oluştu.' },
      { status: 500, headers: corsHeaders }
    )
  }
}
