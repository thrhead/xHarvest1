import { NextResponse } from 'next/server'
import config from '@payload-config'
import { getPayload } from 'payload'

export async function GET(req: Request) {
  try {
    const payload = await getPayload({ config })
    const { getRouteData } = await import('@payloadcms/next/dist/views/Root/getRouteData.js')
    
    const user = await payload.find({
      collection: 'users',
      where: { email: { equals: 'tahir.kahraman85@gmail.com' } },
    })

    const routeData = getRouteData({
      config: payload.config,
      segments: ['collections', 'crops', '14'],
      searchParams: {},
    })

    return NextResponse.json({
      ok: true,
      routeData: {
        type: routeData.type,
        collectionSlug: routeData.collectionSlug,
        globalSlug: routeData.globalSlug,
        docID: routeData.docID,
        viewKey: routeData.viewKey,
        customView: Boolean(routeData.customView),
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message, stack: err.stack }, { status: 500 })
  }
}
