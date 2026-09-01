import { runWeatherAdjustCron } from '@/endpoints/weatherCron'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  return runWeatherAdjustCron(req)
}

export async function POST(req: Request) {
  return runWeatherAdjustCron(req)
}

