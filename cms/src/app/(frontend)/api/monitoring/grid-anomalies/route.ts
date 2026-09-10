import { NextResponse } from 'next/server'
import { generateFieldGridAnomalies } from '@/lib/satelliteDb'

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
    const sceneId = searchParams.get('sceneId') || undefined

    if (!fieldId) {
      return NextResponse.json(
        { ok: false, error: 'fieldId parametresi zorunludur' },
        { status: 400, headers: corsHeaders }
      )
    }

    const gridData = await generateFieldGridAnomalies(fieldId, sceneId)

    return NextResponse.json(
      {
        ok: true,
        ...gridData,
      },
      { status: 200, headers: corsHeaders }
    )
  } catch (error: any) {
    console.error('[monitoring/grid-anomalies] Error:', error)
    return NextResponse.json(
      { ok: false, error: error?.message || 'Tarla grid anomali verisi hesaplanamadı' },
      { status: 500, headers: corsHeaders }
    )
  }
}
