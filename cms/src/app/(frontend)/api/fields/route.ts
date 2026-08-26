import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Shared in-memory and default store for Fields across Web Portal and Mobile App
let inMemoryFields: any[] = []

export async function GET() {
  return NextResponse.json({
    success: true,
    fields: inMemoryFields,
    timestamp: Date.now(),
  })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    if (Array.isArray(body.fields)) {
      inMemoryFields = body.fields
      return NextResponse.json({ success: true, fields: inMemoryFields })
    }
    if (body.field) {
      const newField = {
        ...body.field,
        id: body.field.id || `f-${Date.now()}`,
        createdAt: body.field.createdAt || new Date().toISOString(),
      }
      inMemoryFields = [newField, ...inMemoryFields.filter((f) => f.id !== newField.id)]
      return NextResponse.json({ success: true, field: newField, fields: inMemoryFields })
    }
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to save' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (id) {
      inMemoryFields = inMemoryFields.filter((f) => f.id !== id)
      return NextResponse.json({ success: true, fields: inMemoryFields })
    }
    return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to delete' }, { status: 500 })
  }
}
