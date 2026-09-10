import { NextResponse } from 'next/server'
import { getPlanetScopeQuota } from '@/lib/satelliteDb'

export const dynamic = 'force-dynamic'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders })
}

export async function GET() {
  try {
    const quota = await getPlanetScopeQuota()
    return NextResponse.json({ ok: true, quota }, { status: 200, headers: corsHeaders })
  } catch (error: any) {
    console.error('[monitoring/planetscope-quota] Error:', error)
    return NextResponse.json(
      { ok: false, error: error?.message || 'PlanetScope kota bilgisi alınamadı' },
      { status: 500, headers: corsHeaders }
    )
  }
}
