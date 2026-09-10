import { NextResponse } from 'next/server'
import { getScenesForField } from '@/lib/satelliteDb'
import { CopernicusSentinel2Provider, runAnomalyDetection } from '@/lib/satelliteProvider'

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
    const fieldId = searchParams.get('fieldId')
    const limit = Number(searchParams.get('limit') || 15)

    if (!fieldId) {
      return NextResponse.json(
        { ok: false, error: 'fieldId parametresi gereklidir.' },
        { status: 400, headers: corsHeaders }
      )
    }

    let scenes = await getScenesForField(fieldId, limit)

    // If no scenes yet, query or generate via Sentinel-2 Provider
    if (scenes.length === 0) {
      const provider = new CopernicusSentinel2Provider()
      scenes = await provider.fetchScenesForField(fieldId)
      // Run anomaly scanner on the newly fetched scenes
      try {
        await runAnomalyDetection(fieldId)
      } catch (err) {
        console.warn('[monitoring/scenes] Anomaly detection note:', err)
      }
    }

    return NextResponse.json(
      { ok: true, count: scenes.length, scenes },
      { status: 200, headers: corsHeaders }
    )
  } catch (error: any) {
    console.error('[monitoring/scenes] Error:', error)
    return NextResponse.json(
      { ok: false, error: error?.message || 'Uydu sahneleri alınırken hata oluştu.' },
      { status: 500, headers: corsHeaders }
    )
  }
}
