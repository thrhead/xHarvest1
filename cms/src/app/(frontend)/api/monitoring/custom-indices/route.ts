import { NextResponse } from 'next/server'
import { getCustomIndices, createCustomIndex, deleteCustomIndex } from '@/lib/satelliteDb'
import { validateFormula } from '@/lib/customIndexEvaluator'

export const dynamic = 'force-dynamic'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders })
}

export async function GET() {
  try {
    const indices = await getCustomIndices()
    return NextResponse.json({ ok: true, customIndices: indices }, { status: 200, headers: corsHeaders })
  } catch (error: any) {
    console.error('[monitoring/custom-indices] GET Error:', error)
    return NextResponse.json(
      { ok: false, error: error?.message || 'Özel indeksler alınamadı' },
      { status: 500, headers: corsHeaders }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { code, name, description, formula, colorRamp } = body

    if (!code || !formula) {
      return NextResponse.json(
        { ok: false, error: 'İndeks kodu ve formülü zorunludur' },
        { status: 400, headers: corsHeaders }
      )
    }

    const validation = validateFormula(formula)
    if (!validation.isValid) {
      return NextResponse.json(
        { ok: false, error: validation.error || 'Formül sözdizimi geçersiz' },
        { status: 400, headers: corsHeaders }
      )
    }

    const res = await createCustomIndex({
      code,
      name: name || code,
      description,
      formula,
      colorRamp,
    })

    if (!res.ok) {
      return NextResponse.json({ ok: false, error: res.error }, { status: 400, headers: corsHeaders })
    }

    return NextResponse.json({ ok: true, index: res.index }, { status: 201, headers: corsHeaders })
  } catch (error: any) {
    console.error('[monitoring/custom-indices] POST Error:', error)
    return NextResponse.json(
      { ok: false, error: error?.message || 'Özel indeks oluşturulamadı' },
      { status: 500, headers: corsHeaders }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id') || searchParams.get('code')

    if (!id) {
      return NextResponse.json(
        { ok: false, error: 'Silinecek indeks id veya kodu belirtilmedi' },
        { status: 400, headers: corsHeaders }
      )
    }

    const res = await deleteCustomIndex(id)
    return NextResponse.json(res, { status: 200, headers: corsHeaders })
  } catch (error: any) {
    console.error('[monitoring/custom-indices] DELETE Error:', error)
    return NextResponse.json(
      { ok: false, error: error?.message || 'Özel indeks silinemedi' },
      { status: 500, headers: corsHeaders }
    )
  }
}
