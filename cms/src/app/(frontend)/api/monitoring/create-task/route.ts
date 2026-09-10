import { NextResponse } from 'next/server'
import { createTaskFromAnomaly } from '@/lib/satelliteDb'

export const dynamic = 'force-dynamic'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { anomalyId, assignedTo, customNote } = body

    if (!anomalyId) {
      return NextResponse.json(
        { ok: false, error: 'anomalyId parametresi zorunludur.' },
        { status: 400, headers: corsHeaders }
      )
    }

    const result = await createTaskFromAnomaly(anomalyId, assignedTo, customNote)

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error || 'Görev oluşturulamadı.' },
        { status: 400, headers: corsHeaders }
      )
    }

    return NextResponse.json(
      {
        ok: true,
        message: 'Uydu riskinden başarıyla saha görevi oluşturuldu.',
        task: result.task,
      },
      { status: 200, headers: corsHeaders }
    )
  } catch (error: any) {
    console.error('[monitoring/create-task] Error:', error)
    return NextResponse.json(
      { ok: false, error: error?.message || 'Görev oluşturulurken sunucu hatası oluştu.' },
      { status: 500, headers: corsHeaders }
    )
  }
}
