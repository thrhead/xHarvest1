import { NextResponse } from 'next/server'
import { getTimeSeriesForField, getScenesForField } from '@/lib/satelliteDb'
import { CopernicusSentinel2Provider } from '@/lib/satelliteProvider'

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
    const indexCode = searchParams.get('indexCode') || 'NDVI'

    if (!fieldId) {
      return NextResponse.json(
        { ok: false, error: 'fieldId parametresi gereklidir.' },
        { status: 400, headers: corsHeaders }
      )
    }

    let series = await getTimeSeriesForField(fieldId, indexCode)

    if (series.length === 0) {
      // Auto-fetch scenes if empty
      const provider = new CopernicusSentinel2Provider()
      await provider.fetchScenesForField(fieldId)
      series = await getTimeSeriesForField(fieldId, indexCode)
    }

    return NextResponse.json(
      { ok: true, fieldId, indexCode, series },
      { status: 200, headers: corsHeaders }
    )
  } catch (error: any) {
    console.error('[monitoring/timeseries] Error:', error)
    return NextResponse.json(
      { ok: false, error: error?.message || 'Zaman serisi alınırken hata oluştu.' },
      { status: 500, headers: corsHeaders }
    )
  }
}
