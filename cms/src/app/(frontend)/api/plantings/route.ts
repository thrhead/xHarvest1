import { NextResponse } from 'next/server'
import {
  getDbPlantings,
  upsertDbPlanting,
  upsertDbPlantingsBatch,
  deleteDbPlanting,
  deleteDbPlantingsByFieldAndCrop,
  deleteDbPlantingsByFieldId,
} from '@/lib/plantingDb'
import {
  deleteDbTasksByCropId,
  deleteDbTasksByPlanting,
} from '@/lib/taskDb'

export const dynamic = 'force-dynamic'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId') || undefined
    const plantings = await getDbPlantings(userId)
    return NextResponse.json(
      { success: true, count: plantings.length, plantings },
      { headers: corsHeaders }
    )
  } catch (err: any) {
    console.error('[API /api/plantings] GET error:', err)
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch plantings', plantings: [] },
      { status: 500, headers: corsHeaders }
    )
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    if (Array.isArray(body.plantings)) {
      await upsertDbPlantingsBatch(body.plantings)
      return NextResponse.json(
        { success: true, count: body.plantings.length },
        { headers: corsHeaders }
      )
    } else if (body.planting) {
      await upsertDbPlanting(body.planting)
      return NextResponse.json(
        { success: true, id: body.planting.id },
        { headers: corsHeaders }
      )
    }
    return NextResponse.json(
      { error: 'Invalid body: expected { planting } or { plantings: [] }' },
      { status: 400, headers: corsHeaders }
    )
  } catch (err: any) {
    console.error('[API /api/plantings] POST error:', err)
    return NextResponse.json(
      { error: err?.message || 'Failed to save planting' },
      { status: 500, headers: corsHeaders }
    )
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const fieldId = searchParams.get('fieldId')
    const cropName = searchParams.get('cropName')

    if (id || (fieldId && cropName)) {
      if (id) {
        await deleteDbPlanting(id)
        await deleteDbTasksByCropId(id)
      }
      if (fieldId && cropName) {
        await deleteDbPlantingsByFieldAndCrop(fieldId, cropName)
        await deleteDbTasksByPlanting(fieldId, cropName, id || undefined)
      }
      return NextResponse.json(
        { success: true, deletedPlantingId: id },
        { headers: corsHeaders }
      )
    }

    if (fieldId) {
      await deleteDbPlantingsByFieldId(fieldId)
      return NextResponse.json(
        { success: true, deletedForFieldId: fieldId },
        { headers: corsHeaders }
      )
    }

    return NextResponse.json(
      { error: 'Missing id or fieldId parameter' },
      { status: 400, headers: corsHeaders }
    )
  } catch (err: any) {
    console.error('[API /api/plantings] DELETE error:', err)
    return NextResponse.json(
      { error: err?.message || 'Failed to delete planting' },
      { status: 500, headers: corsHeaders }
    )
  }
}
