import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** Ornek urun + rehber verisi: GET /api/seed */
export async function GET() {
  try {
    const { getPayload } = await import('payload')
    const config = (await import('@payload-config')).default
    const payload = await getPayload({ config })

    const existing = await payload.find({ collection: 'crops', limit: 1 })
    if (existing.totalDocs > 0) {
      return NextResponse.json({
        success: true,
        message: 'Zaten veri var. Yeni seed atlanadi.',
        crops: existing.totalDocs,
      })
    }

    const { runSeed } = await import('@/seed')
    await runSeed(payload)

    const [crops, guides] = await Promise.all([
      payload.find({ collection: 'crops', limit: 50 }),
      payload.find({ collection: 'guides', limit: 50 }),
    ])

    return NextResponse.json({
      success: true,
      message: 'Seed tamam. Adminde Crops ve Guides listelenmeli.',
      crops: crops.totalDocs,
      guides: guides.totalDocs,
    })
  } catch (e: any) {
    console.error('seed error', e)
    return NextResponse.json(
      { success: false, error: e?.message || String(e) },
      { status: 500 },
    )
  }
}
