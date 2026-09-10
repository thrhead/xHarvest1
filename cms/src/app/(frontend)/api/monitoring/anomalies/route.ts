import { NextResponse } from 'next/server'
import { getAnomaliesForField } from '@/lib/satelliteDb'
import { runAnomalyDetection } from '@/lib/satelliteProvider'

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
    const fieldId = searchParams.get('fieldId') || undefined

    if (fieldId) {
      try {
        await runAnomalyDetection(fieldId)
      } catch (e) {
        console.warn('[monitoring/anomalies] Detection run warning:', e)
      }
    }

    const anomalies = await getAnomaliesForField(fieldId)

    return NextResponse.json(
      { ok: true, count: anomalies.length, anomalies },
      { status: 200, headers: corsHeaders }
    )
  } catch (error: any) {
    console.error('[monitoring/anomalies] Error:', error)
    return NextResponse.json(
      { ok: false, error: error?.message || 'Anomali verileri alınırken hata oluştu.' },
      { status: 500, headers: corsHeaders }
    )
  }
}
