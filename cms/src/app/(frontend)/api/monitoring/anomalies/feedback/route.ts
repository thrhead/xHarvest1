import { NextResponse } from 'next/server'
import { updateAnomalyFeedback } from '@/lib/satelliteDb'

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
    const { anomalyId, feedbackStatus, feedbackNotes } = body

    if (!anomalyId || !['confirmed', 'false_alarm'].includes(feedbackStatus)) {
      return NextResponse.json(
        { ok: false, error: 'anomalyId ve geçerli feedbackStatus (confirmed | false_alarm) zorunludur' },
        { status: 400, headers: corsHeaders }
      )
    }

    const res = await updateAnomalyFeedback(anomalyId, feedbackStatus, feedbackNotes)
    if (!res.ok) {
      return NextResponse.json({ ok: false, error: res.error }, { status: 400, headers: corsHeaders })
    }

    return NextResponse.json({ ok: true, message: 'Geri bildirim başarıyla kaydedildi' }, { status: 200, headers: corsHeaders })
  } catch (error: any) {
    console.error('[monitoring/anomalies/feedback] Error:', error)
    return NextResponse.json(
      { ok: false, error: error?.message || 'Geri bildirim işlenirken hata oluştu' },
      { status: 500, headers: corsHeaders }
    )
  }
}
