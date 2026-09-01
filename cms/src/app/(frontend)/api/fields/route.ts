import { NextResponse } from 'next/server'
import { getDbFields, saveDbField, deleteDbField, type DbField } from '@/lib/fieldDb'

export const dynamic = 'force-dynamic'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS, PUT',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function GET() {
  try {
    const fields = await getDbFields()
    return NextResponse.json(
      { success: true, fields, count: fields.length, timestamp: Date.now() },
      { headers: corsHeaders },
    )
  } catch (err: any) {
    console.error('[API /api/fields] GET error:', err)
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch fields', fields: [] },
      { status: 500, headers: corsHeaders },
    )
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    if (body.field) {
      const savedField = await saveDbField(body.field)
      return NextResponse.json(
        { success: true, field: savedField },
        { headers: corsHeaders },
      )
    }

    if (Array.isArray(body.fields)) {
      const savedList: DbField[] = []
      for (const f of body.fields) {
        const sf = await saveDbField(f)
        savedList.push(sf)
      }
      return NextResponse.json(
        { success: true, fields: savedList, count: savedList.length },
        { headers: corsHeaders },
      )
    }

    return NextResponse.json(
      { error: 'Invalid payload: expected { field: {...} } or { fields: [...] }' },
      { status: 400, headers: corsHeaders },
    )
  } catch (err: any) {
    console.error('[API /api/fields] POST error:', err)
    return NextResponse.json(
      { error: err?.message || 'Failed to save field' },
      { status: 500, headers: corsHeaders },
    )
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json(
        { error: 'Missing id query parameter' },
        { status: 400, headers: corsHeaders },
      )
    }

    const success = await deleteDbField(id)
    return NextResponse.json(
      { success, deletedId: id },
      { headers: corsHeaders },
    )
  } catch (err: any) {
    console.error('[API /api/fields] DELETE error:', err)
    return NextResponse.json(
      { error: err?.message || 'Failed to delete field' },
      { status: 500, headers: corsHeaders },
    )
  }
}
