import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Shared in-memory and default store for Fields across Web Portal and Mobile App
let inMemoryFields: any[] = []

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function GET() {
  return NextResponse.json(
    {
      success: true,
      fields: inMemoryFields,
      timestamp: Date.now(),
    },
    { headers: corsHeaders },
  )
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    if (Array.isArray(body.fields)) {
      inMemoryFields = body.fields
      return NextResponse.json({ success: true, fields: inMemoryFields }, { headers: corsHeaders })
    }
    if (body.field) {
      const newField = {
        ...body.field,
        id: body.field.id || `f-${Date.now()}`,
        createdAt: body.field.createdAt || new Date().toISOString(),
      }
      inMemoryFields = [newField, ...inMemoryFields.filter((f) => f.id !== newField.id)]
      return NextResponse.json(
        { success: true, field: newField, fields: inMemoryFields },
        { headers: corsHeaders },
      )
    }
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400, headers: corsHeaders })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to save' },
      { status: 500, headers: corsHeaders },
    )
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (id) {
      inMemoryFields = inMemoryFields.filter((f) => f.id !== id)
      return NextResponse.json({ success: true, fields: inMemoryFields }, { headers: corsHeaders })
    }
    return NextResponse.json({ error: 'Missing id' }, { status: 400, headers: corsHeaders })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to delete' },
      { status: 500, headers: corsHeaders },
    )
  }
}

