/**
 * Open-Meteo hava durumu + görev uygunluk / kaydırma mantığı
 * (mobil taraftaki weather.ts ile aynı kurallar)
 */

export interface DailyWeather {
  date: string;
  precipitationSum: number;
  windSpeedMax: number;
  tempMax: number;
  tempMin: number;
}

export interface WeatherThresholds {
  rainMm: number;
  windKmh: number;
  minTemp: number;
  maxTemp: number;
}

export const DEFAULT_THRESHOLDS: WeatherThresholds = {
  rainMm: 5,
  windKmh: 15,
  minTemp: 5,
  maxTemp: 35,
};

export async function fetchDailyForecast(
  lat: number,
  lng: number,
  days = 14
): Promise<DailyWeather[]> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    daily: [
      "precipitation_sum",
      "wind_speed_10m_max",
      "temperature_2m_max",
      "temperature_2m_min",
    ].join(","),
    timezone: "Europe/Istanbul",
    forecast_days: String(days),
  });

  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!res.ok) {
    throw new Error(`Open-Meteo HTTP ${res.status}`);
  }

  const data = (await res.json()) as {
    daily: {
      time: string[];
      precipitation_sum: (number | null)[];
      wind_speed_10m_max: (number | null)[];
      temperature_2m_max: (number | null)[];
      temperature_2m_min: (number | null)[];
    };
  };

  return data.daily.time.map((date, i) => ({
    date,
    precipitationSum: data.daily.precipitation_sum[i] ?? 0,
    windSpeedMax: data.daily.wind_speed_10m_max[i] ?? 0,
    tempMax: data.daily.temperature_2m_max[i] ?? 0,
    tempMin: data.daily.temperature_2m_min[i] ?? 0,
  }));
}

export function isDaySuitable(
  weather: DailyWeather,
  thresholds: WeatherThresholds,
  taskType: string
): string | null {
  const sensitive = taskType === "spraying" || taskType === "fertilizing";

  if (weather.precipitationSum >= thresholds.rainMm) {
    return `Yağış bekleniyor (${weather.precipitationSum.toFixed(1)} mm)`;
  }
  if (weather.windSpeedMax >= thresholds.windKmh && sensitive) {
    return `Rüzgar yüksek (${weather.windSpeedMax.toFixed(0)} km/h)`;
  }
  if (weather.tempMin < thresholds.minTemp) {
    return `Sıcaklık çok düşük (min ${weather.tempMin}°C)`;
  }
  if (weather.tempMax > thresholds.maxTemp) {
    return `Sıcaklık çok yüksek (max ${weather.tempMax}°C)`;
  }
  return null;
}

export function findNextSuitableDate(
  originalDate: Date,
  forecast: DailyWeather[],
  thresholds: WeatherThresholds,
  taskType: string,
  maxShiftDays = 7
): { newDate: Date; reason?: string } {
  const toStr = (d: Date) => d.toISOString().slice(0, 10);
  const startStr = toStr(originalDate);

  const originalWeather = forecast.find((d) => d.date === startStr);
  if (originalWeather) {
    const reason = isDaySuitable(originalWeather, thresholds, taskType);
    if (!reason) return { newDate: originalDate };
  }

  for (let i = 1; i <= maxShiftDays; i++) {
    const candidate = new Date(originalDate);
    candidate.setDate(candidate.getDate() + i);
    const candStr = toStr(candidate);
    const w = forecast.find((d) => d.date === candStr);
    if (!w) continue;
    if (!isDaySuitable(w, thresholds, taskType)) {
      return {
        newDate: candidate,
        reason: `Hava nedeniyle ${i} gün kaydırıldı (orijinal: ${startStr})`,
      };
    }
  }

  return {
    newDate: originalDate,
    reason: "Uygun gün bulunamadı, orijinal tarih korundu",
  };
}
