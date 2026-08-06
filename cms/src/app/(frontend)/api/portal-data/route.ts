import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const payload = await getPayload({ config })
    const [cropsRes, guidesRes] = await Promise.all([
      payload.find({ collection: 'crops', limit: 50 }),
      payload.find({ collection: 'guides', limit: 50 }),
    ])

    return NextResponse.json({
      crops: cropsRes.docs || [],
      guides: guidesRes.docs || [],
    })
  } catch (error) {
    console.error('Portal data fetch error:', error)
    return NextResponse.json({ crops: [], guides: [] }, { status: 500 })
  }
}
