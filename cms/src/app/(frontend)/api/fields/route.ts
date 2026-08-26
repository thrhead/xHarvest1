import { NextResponse } from 'next/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'

export const dynamic = 'force-dynamic'

// Shared in-memory backup cache
let inMemoryFields: any[] = []

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

async function getPayloadClient() {
  try {
    return await getPayloadHMR({ config: configPromise })
  } catch (e) {
    return null
  }
}

export async function GET() {
  try {
    const payload = await getPayloadClient()
    if (payload) {
      const res = await payload.find({
        collection: 'fields',
        limit: 100,
        overrideAccess: true,
      })
      if (res && res.docs && res.docs.length > 0) {
        const dbFields = res.docs.map((doc: any) => ({
          id: doc.id ? String(doc.id) : `f-${Date.now()}`,
          name: doc.name,
          cropName: doc.cropName || 'Domates',
          type: doc.type || 'field',
          areaDecares: doc.areaDecares || 10,
          coordinates: doc.coordinates || [],
          createdAt: doc.createdAt || new Date().toISOString(),
        }))

        // Merge DB fields with in-memory fields
        const merged = [...dbFields]
        inMemoryFields.forEach((im) => {
          if (!merged.some((f) => f.id === im.id)) {
            merged.push(im)
          }
        })
        inMemoryFields = merged

        return NextResponse.json(
          { success: true, fields: merged, source: 'payload-db', timestamp: Date.now() },
          { headers: corsHeaders },
        )
      }
    }
  } catch (e: any) {
    console.error('Payload GET error:', e)
  }

  return NextResponse.json(
    { success: true, fields: inMemoryFields, source: 'cache', timestamp: Date.now() },
    { headers: corsHeaders },
  )
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    if (Array.isArray(body.fields)) {
      inMemoryFields = body.fields
      const payload = await getPayloadClient()
      if (payload) {
        for (const f of body.fields) {
          try {
            await payload.create({
              collection: 'fields',
              data: {
                name: f.name || 'Tarla',
                cropName: f.cropName || 'Domates',
                type: f.type || 'field',
                areaDecares: f.areaDecares || 10,
                coordinates: f.coordinates || [],
              },
              overrideAccess: true,
            })
          } catch (e) {}
        }
      }
      return NextResponse.json({ success: true, fields: inMemoryFields }, { headers: corsHeaders })
    }

    if (body.field) {
      const fieldData = body.field
      const newField = {
        ...fieldData,
        id: fieldData.id || `f-${Date.now()}`,
        createdAt: fieldData.createdAt || new Date().toISOString(),
      }

      // 1. Update in-memory cache
      inMemoryFields = [newField, ...inMemoryFields.filter((f) => f.id !== newField.id)]

      // 2. Persist into Payload CMS Database
      const payload = await getPayloadClient()
      if (payload) {
        try {
          const createdDoc = await payload.create({
            collection: 'fields',
            data: {
              name: newField.name,
              cropName: newField.cropName || 'Domates',
              type: newField.type || 'field',
              areaDecares: newField.areaDecares || 10,
              coordinates: newField.coordinates || [],
            },
            overrideAccess: true,
          })
          if (createdDoc && createdDoc.id) {
            newField.id = String(createdDoc.id)
          }
        } catch (dbErr: any) {
          console.warn('Payload create warning:', dbErr?.message)
        }
      }

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
      const payload = await getPayloadClient()
      if (payload) {
        try {
          await payload.delete({
            collection: 'fields',
            id: id,
            overrideAccess: true,
          })
        } catch (e) {}
      }
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
