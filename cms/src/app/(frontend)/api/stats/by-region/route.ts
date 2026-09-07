import { NextResponse } from 'next/server'
import { getDbFields } from '@/lib/fieldDb'
import { getDbRegions } from '@/lib/regionDb'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const [fields, regions] = await Promise.all([getDbFields(), getDbRegions()])

    const regionStatsMap: Record<
      string,
      {
        id: number
        name: string
        slug: string
        source: string
        tuikCode?: string | null
        centerLat: number
        centerLng: number
        fieldCount: number
        totalDecares: number
        totalHectares: number
        crops: Record<string, number>
        greenhouses: number
        openFields: number
      }
    > = {}

    // Group fields by regionName or regionId
    for (const field of fields) {
      const regName = field.regionName || 'Genel Bölge'
      const regId = field.regionId ? Number(field.regionId) : 0

      // Match with region from DB
      const matchingDbRegion =
        regions.find((r) => r.id === regId) ||
        regions.find((r) => regName.toLowerCase().includes(r.name.toLowerCase()))

      const key = matchingDbRegion ? matchingDbRegion.slug : regName

      if (!regionStatsMap[key]) {
        regionStatsMap[key] = {
          id: matchingDbRegion ? matchingDbRegion.id : regId,
          name: matchingDbRegion ? matchingDbRegion.name : regName,
          slug: key,
          source: matchingDbRegion ? matchingDbRegion.source : 'manual',
          tuikCode: matchingDbRegion ? matchingDbRegion.tuik_code : null,
          centerLat: matchingDbRegion
            ? matchingDbRegion.center_lat
            : field.coordinates[0]?.[0] || 39.0,
          centerLng: matchingDbRegion
            ? matchingDbRegion.center_lng
            : field.coordinates[0]?.[1] || 35.0,
          fieldCount: 0,
          totalDecares: 0,
          totalHectares: 0,
          crops: {},
          greenhouses: 0,
          openFields: 0,
        }
      }

      const stat = regionStatsMap[key]
      stat.fieldCount += 1
      stat.totalDecares += Number(field.areaDecares) || 0
      stat.totalHectares += Number(field.areaHectare) || 0

      const crop = field.cropName || 'Belirtilmemiş'
      stat.crops[crop] = (stat.crops[crop] || 0) + 1

      if (field.type === 'greenhouse') {
        stat.greenhouses += 1
      } else {
        stat.openFields += 1
      }
    }

    const statsList = Object.values(regionStatsMap).map((s) => ({
      ...s,
      totalDecares: Math.round(s.totalDecares * 10) / 10,
      totalHectares: Math.round(s.totalHectares * 10) / 10,
      topCrops: Object.entries(s.crops)
        .sort((a, b) => b[1] - a[1])
        .map(([crop, count]) => ({ crop, count })),
    }))

    // Sort by field count and total decares
    statsList.sort((a, b) => b.totalDecares - a.totalDecares)

    const totalFields = fields.length
    const totalDecares = fields.reduce((sum, f) => sum + (Number(f.areaDecares) || 0), 0)
    const activeRegionsCount = statsList.length

    return NextResponse.json({
      success: true,
      summary: {
        totalFields,
        totalDecares: Math.round(totalDecares * 10) / 10,
        totalHectares: Math.round((totalDecares / 10) * 10) / 10,
        activeRegionsCount,
      },
      regions: statsList,
    })
  } catch (error: any) {
    console.error('[API /api/stats/by-region] Error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Bölge istatistikleri alınamadı' },
      { status: 500 }
    )
  }
}
