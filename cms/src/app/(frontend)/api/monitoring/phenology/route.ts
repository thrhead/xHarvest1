import { NextResponse } from 'next/server'
import { getCropPhenologyBenchmarks } from '@/lib/satelliteDb'

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
    const cropName = searchParams.get('cropName') || undefined

    const benchmarks = await getCropPhenologyBenchmarks(cropName)

    return NextResponse.json(
      {
        ok: true,
        benchmarks,
      },
      { status: 200, headers: corsHeaders }
    )
  } catch (error: any) {
    console.error('[monitoring/phenology] Error:', error)
    return NextResponse.json(
      { ok: false, error: error?.message || 'Fenolojik referanslar alınamadı' },
      { status: 500, headers: corsHeaders }
    )
  }
}
