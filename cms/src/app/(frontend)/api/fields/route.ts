import { NextResponse } from 'next/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'

export const dynamic = 'force-dynamic'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS, PUT',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

async function getPayloadClient() {
  try {
    return await getPayloadHMR({ config: configPromise })
  } catch (e) {
    console.warn('[API /api/fields] Payload client init warning:', e)
    return null
  }
}

const SEED_FIELDS = [
  {
    name: 'Kuzey Parsel (Ankara)',
    cropName: 'Domates',
    type: 'field',
    areaDecares: 20,
    color: '#10b981',
    customId: 'f-ankara-1',
    coordinates: [
      [39.925, 32.845],
      [39.925, 32.855],
      [39.915, 32.855],
      [39.915, 32.845],
    ],
  },
  {
    name: 'Çukurova Sera-1',
    cropName: 'Biber',
    type: 'greenhouse',
    areaDecares: 8,
    color: '#059669',
    customId: 'f-cukurova-1',
    coordinates: [
      [36.995, 35.315],
      [36.995, 35.325],
      [36.985, 35.325],
      [36.985, 35.315],
    ],
  },
  {
    name: 'Konya Ovası Buğday',
    cropName: 'Buğday',
    type: 'field',
    areaDecares: 45,
    color: '#f59e0b',
    customId: 'f-konya-1',
    coordinates: [
      [37.875, 32.475],
      [37.875, 32.485],
      [37.865, 32.485],
      [37.865, 32.475],
    ],
  },
]

function formatDoc(doc: any) {
  const coords = Array.isArray(doc.coordinates) ? doc.coordinates : []
  const areaDec = typeof doc.areaDecares === 'number' ? doc.areaDecares : parseFloat(doc.areaDecares) || 10

  return {
    id: doc.customId || String(doc.id),
    dbId: doc.id,
    name: doc.name || 'Tarla',
    cropName: doc.cropName || 'Domates',
    type: doc.type || 'field',
    areaDecares: areaDec,
    areaHectare: areaDec / 10,
    coordinates: coords,
    color: doc.color || (doc.type === 'greenhouse' ? '#059669' : '#10b981'),
    createdAt: doc.createdAt || new Date().toISOString(),
    updatedAt: doc.updatedAt || new Date().toISOString(),
  }
}

export async function GET() {
  try {
    const payload = await getPayloadClient()
    if (payload) {
      const res = await payload.find({
        collection: 'fields',
        limit: 500,
        overrideAccess: true,
      })

      if (res && res.docs && res.docs.length > 0) {
        const fields = res.docs.map(formatDoc)
        return NextResponse.json(
          { success: true, fields, count: fields.length, timestamp: Date.now() },
          { headers: corsHeaders },
        )
      }

      // Auto-seed initial fields if database has 0 fields
      const createdSeedDocs: any[] = []
      for (const sf of SEED_FIELDS) {
        try {
          const doc = await payload.create({
            collection: 'fields',
            data: sf,
            overrideAccess: true,
          })
          createdSeedDocs.push(formatDoc(doc))
        } catch (seedErr: any) {
          console.warn('[API /api/fields] Seed item error:', seedErr?.message)
        }
      }

      if (createdSeedDocs.length > 0) {
        return NextResponse.json(
          { success: true, fields: createdSeedDocs, count: createdSeedDocs.length, seeded: true },
          { headers: corsHeaders },
        )
      }
    }
  } catch (e: any) {
    console.error('[API /api/fields] GET error:', e)
  }

  // Fallback if DB is temporarily connecting
  const fallback = SEED_FIELDS.map((sf, idx) => ({
    id: sf.customId || `f-${idx + 1}`,
    name: sf.name,
    cropName: sf.cropName,
    type: sf.type,
    areaDecares: sf.areaDecares,
    areaHectare: sf.areaDecares / 10,
    coordinates: sf.coordinates,
    color: sf.color,
    createdAt: new Date().toISOString(),
  }))

  return NextResponse.json(
    { success: true, fields: fallback, count: fallback.length, source: 'fallback' },
    { headers: corsHeaders },
  )
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const payload = await getPayloadClient()

    if (body.field) {
      const f = body.field
      const customId = f.id ? String(f.id) : `f_${Date.now()}`
      const areaDec = typeof f.areaDecares === 'number' ? f.areaDecares : parseFloat(f.areaDecares) || 10
      const coords = Array.isArray(f.coordinates) ? f.coordinates : []
      const fieldData = {
        name: f.name || 'Yeni Tarla',
        cropName: f.cropName || 'Domates',
        type: f.type || 'field',
        areaDecares: areaDec,
        coordinates: coords,
        color: f.color || (f.type === 'greenhouse' ? '#059669' : '#10b981'),
        customId: customId,
      }

      if (payload) {
        // Check if existing field with this customId or ID exists
        let existingId: string | number | null = null

        // If numeric ID was supplied
        if (typeof f.id === 'number' || (typeof f.id === 'string' && !isNaN(Number(f.id)))) {
          existingId = Number(f.id)
        }

        if (!existingId) {
          const findRes = await payload.find({
            collection: 'fields',
            where: {
              customId: {
                equals: customId,
              },
            },
            limit: 1,
            overrideAccess: true,
          })
          if (findRes.docs && findRes.docs.length > 0) {
            existingId = findRes.docs[0].id
          }
        }

        let resultDoc: any = null
        if (existingId) {
          resultDoc = await payload.update({
            collection: 'fields',
            id: existingId,
            data: fieldData,
            overrideAccess: true,
          })
        } else {
          resultDoc = await payload.create({
            collection: 'fields',
            data: fieldData,
            overrideAccess: true,
          })
        }

        return NextResponse.json(
          { success: true, field: formatDoc(resultDoc) },
          { headers: corsHeaders },
        )
      }

      return NextResponse.json(
        {
          success: true,
          field: {
            id: customId,
            ...fieldData,
            areaHectare: areaDec / 10,
            createdAt: new Date().toISOString(),
          },
        },
        { headers: corsHeaders },
      )
    }

    if (Array.isArray(body.fields)) {
      const results: any[] = []
      if (payload) {
        for (const f of body.fields) {
          try {
            const customId = f.id ? String(f.id) : `f_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
            const areaDec = typeof f.areaDecares === 'number' ? f.areaDecares : parseFloat(f.areaDecares) || 10
            const coords = Array.isArray(f.coordinates) ? f.coordinates : []
            
            // Check if already in DB
            const existing = await payload.find({
              collection: 'fields',
              where: {
                or: [
                  { customId: { equals: customId } },
                  { name: { equals: f.name } },
                ],
              },
              limit: 1,
              overrideAccess: true,
            })

            let doc: any = null
            if (existing.docs && existing.docs.length > 0) {
              doc = await payload.update({
                collection: 'fields',
                id: existing.docs[0].id,
                data: {
                  name: f.name,
                  cropName: f.cropName || 'Domates',
                  type: f.type || 'field',
                  areaDecares: areaDec,
                  coordinates: coords,
                  color: f.color,
                },
                overrideAccess: true,
              })
            } else {
              doc = await payload.create({
                collection: 'fields',
                data: {
                  name: f.name,
                  cropName: f.cropName || 'Domates',
                  type: f.type || 'field',
                  areaDecares: areaDec,
                  coordinates: coords,
                  color: f.color,
                  customId: customId,
                },
                overrideAccess: true,
              })
            }
            results.push(formatDoc(doc))
          } catch (e: any) {
            console.warn('[API /api/fields] Bulk item error:', e?.message)
          }
        }
      }

      return NextResponse.json(
        { success: true, fields: results, count: results.length },
        { headers: corsHeaders },
      )
    }

    return NextResponse.json({ error: 'Invalid payload' }, { status: 400, headers: corsHeaders })
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
      return NextResponse.json({ error: 'Missing id query parameter' }, { status: 400, headers: corsHeaders })
    }

    const payload = await getPayloadClient()
    if (payload) {
      // 1. Try deleting by numeric DB id
      if (!isNaN(Number(id))) {
        try {
          await payload.delete({
            collection: 'fields',
            id: Number(id),
            overrideAccess: true,
          })
          return NextResponse.json({ success: true, deletedId: id }, { headers: corsHeaders })
        } catch {}
      }

      // 2. Try finding by customId
      const found = await payload.find({
        collection: 'fields',
        where: {
          customId: {
            equals: id,
          },
        },
        limit: 1,
        overrideAccess: true,
      })

      if (found.docs && found.docs.length > 0) {
        await payload.delete({
          collection: 'fields',
          id: found.docs[0].id,
          overrideAccess: true,
        })
        return NextResponse.json({ success: true, deletedId: id }, { headers: corsHeaders })
      }
    }

    return NextResponse.json({ success: true, deletedId: id }, { headers: corsHeaders })
  } catch (err: any) {
    console.error('[API /api/fields] DELETE error:', err)
    return NextResponse.json(
      { error: err?.message || 'Failed to delete field' },
      { status: 500, headers: corsHeaders },
    )
  }
}
