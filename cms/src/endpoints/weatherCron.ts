import type { PayloadRequest } from 'payload'

interface ForecastDay {
  date: string
  precipitation_sum: number
  wind_speed_max: number
  temp_max: number
  temp_min: number
}

// In-memory execution log for cron runs
const jobLogs: Array<{
  id: string
  ranAt: string
  scanned: number
  moved: number
  errors: string[]
  durationMs: number
  source: string
}> = []

function checkAuth(req: Request | PayloadRequest): boolean {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    // If not set in environment, allow for open access
    return true
  }

  // 1. Check Authorization header (Bearer <token>)
  const authHeader = req.headers.get('authorization')
  if (authHeader) {
    const parts = authHeader.split(' ')
    if (parts.length === 2 && parts[0].toLowerCase() === 'bearer' && parts[1] === cronSecret) {
      return true
    }
  }

  // 2. Check x-cron-secret header
  const xCronSecret = req.headers.get('x-cron-secret')
  if (xCronSecret && xCronSecret === cronSecret) {
    return true
  }

  // 3. Check URL search param (?secret=...)
  try {
    const url = new URL(req.url, 'http://localhost')
    const querySecret = url.searchParams.get('secret')
    if (querySecret && querySecret === cronSecret) {
      return true
    }
  } catch {
    // ignore
  }

  return false
}

async function fetchForecast(lat: number, lng: number, days = 14): Promise<ForecastDay[]> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=precipitation_sum,wind_speed_10m_max,temperature_2m_max,temperature_2m_min&timezone=Europe/Istanbul&forecast_days=${days}`
  const res = await fetch(url, { next: { revalidate: 3600 } })
  if (!res.ok) {
    throw new Error(`Open-Meteo error (${res.status}): ${await res.text()}`)
  }
  const data = await res.json()
  const list: ForecastDay[] = []
  if (data?.daily?.time && Array.isArray(data.daily.time)) {
    data.daily.time.forEach((dateStr: string, idx: number) => {
      list.push({
        date: dateStr,
        precipitation_sum: data.daily.precipitation_sum?.[idx] ?? 0,
        wind_speed_max: data.daily.wind_speed_10m_max?.[idx] ?? 0,
        temp_max: data.daily.temperature_2m_max?.[idx] ?? 25,
        temp_min: data.daily.temperature_2m_min?.[idx] ?? 12,
      })
    })
  }
  return list
}

function isWeatherUnsuitable(
  day: ForecastDay,
  taskType: string,
  thresholds: { rainMm: number; windKmh: number; minTemp: number; maxTemp: number }
): string | null {
  const isSensitive = taskType === 'spraying' || taskType === 'fertilizing'
  if (day.precipitation_sum >= thresholds.rainMm) {
    return `Yağış bekleniyor (${day.precipitation_sum.toFixed(1)} mm)`
  }
  if (day.wind_speed_max >= thresholds.windKmh && isSensitive) {
    return `Rüzgar yüksek (${day.wind_speed_max.toFixed(0)} km/s)`
  }
  if (day.temp_min < thresholds.minTemp) {
    return `Sıcaklık çok düşük (min ${day.temp_min}°C)`
  }
  if (day.temp_max > thresholds.maxTemp) {
    return `Sıcaklık çok yüksek (max ${day.temp_max}°C)`
  }
  return null
}

export async function runWeatherAdjustCron(req: Request | PayloadRequest): Promise<Response> {
  const startTime = Date.now()

  // 1. Auth check
  if (!checkAuth(req)) {
    return Response.json(
      {
        ok: false,
        error: 'Unauthorized: Invalid or missing CRON_SECRET header or parameter',
      },
      { status: 401 }
    )
  }

  const errors: string[] = []
  let scannedCount = 0
  let movedCount = 0

  const thresholds = {
    rainMm: Number(process.env.WEATHER_RAIN_MM) || 5.0,
    windKmh: Number(process.env.WEATHER_WIND_KMH) || 15.0,
    minTemp: Number(process.env.WEATHER_MIN_TEMP) || 5.0,
    maxTemp: Number(process.env.WEATHER_MAX_TEMP) || 35.0,
  }

  try {
    const fieldsList = [
      { id: 'f-1', name: 'güney domates tarlası', coordinates: [[39.88, 32.8]] },
      { id: 'f-2', name: 'anadolu tarlası', coordinates: [[39.925, 32.85]] },
      { id: 'f-3', name: 'salatalık tarlası', coordinates: [[39.95, 32.78]] },
    ]

    const sampleTasks = [
      {
        id: 't-cron-1',
        fieldId: 'f-1',
        type: 'spraying',
        title: 'Mildiyö Koruyucu İlaçlama',
        plannedDate: new Date().toISOString().split('T')[0],
        status: 'pending',
      },
      {
        id: 't-cron-2',
        fieldId: 'f-2',
        type: 'fertilizing',
        title: 'Üst Gübreleme (Üre %46)',
        plannedDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
        status: 'pending',
      },
    ]

    scannedCount = sampleTasks.length

    for (const task of sampleTasks) {
      const field = fieldsList.find((f) => f.id === task.fieldId) || fieldsList[0]
      const lat = field?.coordinates?.[0]?.[0] ?? 39.92
      const lng = field?.coordinates?.[0]?.[1] ?? 32.85

      try {
        const forecast = await fetchForecast(lat, lng)
        const currentPlanned = task.plannedDate
        const dayData = forecast.find((f) => f.date === currentPlanned)

        if (dayData) {
          const reason = isWeatherUnsuitable(dayData, task.type, thresholds)
          if (reason) {
            let shifted = false
            for (let i = 1; i <= 7; i++) {
              const nextDate = new Date(new Date(currentPlanned).getTime() + i * 86400000)
                .toISOString()
                .split('T')[0]
              const nextDay = forecast.find((f) => f.date === nextDate)
              if (nextDay && !isWeatherUnsuitable(nextDay, task.type, thresholds)) {
                task.plannedDate = nextDate
                ;(task as any).weatherReason = `${reason} → ${i} gün sonraya kaydırıldı.`
                shifted = true
                movedCount++
                break
              }
            }
            if (!shifted) {
              ;(task as any).weatherReason = `${reason} (Önümüzdeki 7 gün boyunca uygun hava bulunamadı)`
            }
          }
        }
      } catch (err: any) {
        errors.push(`Tarla ${field.name || task.fieldId} hava durumu hatası: ${err.message}`)
      }
    }

    const durationMs = Date.now() - startTime
    const logEntry = {
      id: `job-${Date.now()}`,
      ranAt: new Date().toISOString(),
      scanned: scannedCount,
      moved: movedCount,
      errors,
      durationMs,
      source: 'cron-job.org',
    }
    jobLogs.unshift(logEntry)
    if (jobLogs.length > 50) jobLogs.pop()

    return Response.json({
      ok: true,
      message: 'Weather adjust cron completed successfully',
      scanned: scannedCount,
      moved: movedCount,
      errors,
      durationMs,
      jobLog: logEntry,
      tasks: sampleTasks,
    })
  } catch (error: any) {
    return Response.json(
      {
        ok: false,
        error: error?.message || 'Weather adjustment cron execution failed',
      },
      { status: 500 }
    )
  }
}
