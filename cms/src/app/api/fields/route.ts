import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Shared in-memory and default store for Fields across Web Portal and Mobile App
let inMemoryFields = [
  {
    id: 'f-1',
    name: 'güney domates tarlası',
    cropName: 'Salatalık (Hıyar)',
    areaDecares: 1914.0,
    color: '#06b6d4',
    coordinates: [
      [39.88, 32.8],
      [39.89, 32.82],
      [39.87, 32.84],
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'f-2',
    name: 'anadolu tarlası',
    cropName: 'Domates',
    areaDecares: 20.0,
    color: '#ef4444',
    coordinates: [
      [39.925, 32.85],
      [39.928, 32.855],
      [39.923, 32.86],
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'f-3',
    name: 'salatalık tarlası',
    cropName: 'Salatalık (Hıyar)',
    areaDecares: 4150.0,
    color: '#06b6d4',
    coordinates: [
      [39.95, 32.78],
      [39.96, 32.81],
      [39.94, 32.83],
    ],
    createdAt: new Date().toISOString(),
  },
]

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
