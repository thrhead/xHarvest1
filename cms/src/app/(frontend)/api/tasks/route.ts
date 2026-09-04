import { NextResponse } from 'next/server'
import {
  getDbTasks,
  saveDbTask,
  saveDbTasks,
  deleteDbTask,
  deleteDbTasksByFieldId,
  deleteAllDbTasks,
  purgeOrphanDbTasks,
  updateDbTaskStatus,
  type DbTask,
} from '@/lib/taskDb'

export const dynamic = 'force-dynamic'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS, PUT',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const fieldId = searchParams.get('fieldId') || undefined
    const status = searchParams.get('status') || undefined

    // Purge orphan records on fetch to keep Turso DB clean
    const purgedCount = await purgeOrphanDbTasks()

    const tasks = await getDbTasks({ fieldId, status })
    return NextResponse.json(
      { success: true, tasks, count: tasks.length, purgedCount, timestamp: Date.now() },
      { headers: corsHeaders }
    )
  } catch (err: any) {
    console.error('[API /api/tasks] GET error:', err)
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch tasks', tasks: [] },
      { status: 500, headers: corsHeaders }
    )
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // 1. Quick status toggle or update
    if (body.action === 'update_status' && body.id && body.status) {
      await updateDbTaskStatus(body.id, body.status, body.completedAt)
      return NextResponse.json(
        { success: true, id: body.id, status: body.status },
        { headers: corsHeaders }
      )
    }

    // 2. Single task upsert
    if (body.task) {
      const savedTask = await saveDbTask(body.task)
      return NextResponse.json(
        { success: true, task: savedTask },
        { headers: corsHeaders }
      )
    }

    // 3. Batch task upsert
    if (Array.isArray(body.tasks)) {
      const savedList = await saveDbTasks(body.tasks)
      return NextResponse.json(
        { success: true, tasks: savedList, count: savedList.length },
        { headers: corsHeaders }
      )
    }

    return NextResponse.json(
      { error: 'Invalid payload: expected { task: {...} } or { tasks: [...] } or { action: "update_status", ... }' },
      { status: 400, headers: corsHeaders }
    )
  } catch (err: any) {
    console.error('[API /api/tasks] POST error:', err)
    return NextResponse.json(
      { error: err?.message || 'Failed to save tasks' },
      { status: 500, headers: corsHeaders }
    )
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    if (body.id && body.status) {
      await updateDbTaskStatus(body.id, body.status, body.completedAt)
      return NextResponse.json(
        { success: true, id: body.id, status: body.status },
        { headers: corsHeaders }
      )
    }
    return NextResponse.json(
      { error: 'Missing id or status in request body' },
      { status: 400, headers: corsHeaders }
    )
  } catch (err: any) {
    console.error('[API /api/tasks] PATCH error:', err)
    return NextResponse.json(
      { error: err?.message || 'Failed to update task' },
      { status: 500, headers: corsHeaders }
    )
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const clearAll = searchParams.get('clearAll') === 'true'
    const fieldId = searchParams.get('fieldId')
    const id = searchParams.get('id')

    if (clearAll) {
      const success = await deleteAllDbTasks()
      return NextResponse.json(
        { success, clearedAll: true },
        { headers: corsHeaders }
      )
    }

    if (fieldId) {
      const success = await deleteDbTasksByFieldId(fieldId)
      return NextResponse.json(
        { success, fieldId },
        { headers: corsHeaders }
      )
    }

    if (!id) {
      return NextResponse.json(
        { error: 'Missing id, fieldId or clearAll query parameter' },
        { status: 400, headers: corsHeaders }
      )
    }

    const success = await deleteDbTask(id)
    return NextResponse.json(
      { success, deletedId: id },
      { headers: corsHeaders }
    )
  } catch (err: any) {
    console.error('[API /api/tasks] DELETE error:', err)
    return NextResponse.json(
      { error: err?.message || 'Failed to delete task' },
      { status: 500, headers: corsHeaders }
    )
  }
}
