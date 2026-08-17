import { NextResponse } from 'next/server'
import { bootstrapSchema } from '@/lib/bootstrapSchema'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/init-db          — eksik tablolari olustur
 * GET /api/init-db?fix=1    — preferences vb. duzelt, users KALIR
 * GET /api/init-db?reset=1  — her seyi sil + yeniden olustur
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const reset = url.searchParams.get('reset') === '1'
    const fix = url.searchParams.get('fix') === '1'
    const result = await bootstrapSchema({ reset, fix })
    return NextResponse.json({
      success: true,
      message: reset
        ? 'Sifirlandi. /admin ile yeni kullanici olustur.'
        : fix
          ? 'Schema duzeltildi (users korundu). /admin yeniden dene.'
          : 'Schema hazir.',
      ...result,
    })
  } catch (e: any) {
    console.error('init-db error', e)
    return NextResponse.json(
      { success: false, error: e?.message || String(e) },
      { status: 500 },
    )
  }
}

export async function POST(req: Request) {
  return GET(req)
}
