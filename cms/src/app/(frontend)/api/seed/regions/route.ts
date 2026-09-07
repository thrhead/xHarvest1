import { NextResponse } from 'next/server'
import { ensureRegionsTableAndSeed, getDbRegions } from '@/lib/regionDb'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const force = searchParams.get('force') === 'true'

    await ensureRegionsTableAndSeed(force)
    const regions = await getDbRegions()

    return NextResponse.json({
      success: true,
      message: `TÜİK İl ve Tarımsal Havza verileri başarıyla Turso DB'ye işlendi.`,
      count: regions.length,
      provincesCount: regions.filter((r) => r.source === 'tuik_il').length,
      basinsCount: regions.filter((r) => r.source === 'manual').length,
    })
  } catch (error: any) {
    console.error('[API /api/seed/regions] Error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Bölgeler seed edilemedi' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  return GET(request)
}
