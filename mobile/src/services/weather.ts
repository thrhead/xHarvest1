import { DailyWeather, WeatherThresholds } from '../types';

const BASE = 'https://api.open-meteo.com/v1/forecast';

/**
 * Open-Meteo ile 14 günlük günlük hava + toprak verisi çeker.
 * API key gerekmez. Tarıma uygun: yağış, rüzgar, sıcaklık, ET0, toprak nemi.
 */
export async function fetchDailyForecast(
  lat: number,
  lng: number,
  days = 14
): Promise<DailyWeather[]> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lng.toString(),
    daily: [
      'precipitation_sum',
      'wind_speed_10m_max',
      'temperature_2m_max',
      'temperature_2m_min',
      'et0_fao_evapotranspiration',
    ].join(','),
    hourly: 'soil_moisture_0_to_1cm',
    timezone: 'Europe/Istanbul',
    forecast_days: days.toString(),
  });

  const res = await fetch(`${BASE}?${params}`);
  if (!res.ok) throw new Error(`Open-Meteo hatası: ${res.status}`);

  const data = await res.json();

  const result: DailyWeather[] = [];
  const times: string[] = data.daily.time;

  for (let i = 0; i < times.length; i++) {
    // Saatlik toprak nemini günlük ortalamaya çevir (basit)
    let soilAvg: number | undefined;
    if (data.hourly?.soil_moisture_0_to_1cm) {
      const start = i * 24;
      const slice = data.hourly.soil_moisture_0_to_1cm.slice(start, start + 24);
      const valid = slice.filter((v: number | null) => v != null);
      if (valid.length) {
        soilAvg = valid.reduce((a: number, b: number) => a + b, 0) / valid.length;
      }
    }

    result.push({
      date: times[i],
      precipitationSum: data.daily.precipitation_sum[i] ?? 0,
      windSpeedMax: data.daily.wind_speed_10m_max[i] ?? 0,
      tempMax: data.daily.temperature_2m_max[i] ?? 0,
      tempMin: data.daily.temperature_2m_min[i] ?? 0,
      et0: data.daily.et0_fao_evapotranspiration?.[i],
      soilMoisture: soilAvg,
    });
  }

  return result;
}

/**
 * Bir günün görev için uygun olup olmadığını kontrol eder.
 * Uygun değilse sebep string döner, uygunsa null.
 */
export function isDaySuitable(
  weather: DailyWeather,
  thresholds: WeatherThresholds,
  taskType: string
): string | null {
  // İlaçlama ve gübreleme için daha sıkı kurallar
  const isSensitive = taskType === 'spraying' || taskType === 'fertilizing';

  if (weather.precipitationSum >= thresholds.rainMm) {
    return `Yağış bekleniyor (${weather.precipitationSum.toFixed(1)} mm)`;
  }

  if (weather.windSpeedMax >= thresholds.windKmh && isSensitive) {
    return `Rüzgar yüksek (${weather.windSpeedMax.toFixed(0)} km/h) — ilaçlama/gübreleme riskli`;
  }

  if (weather.tempMin < thresholds.minTemp) {
    return `Sıcaklık çok düşük (min ${weather.tempMin}°C)`;
  }

  if (weather.tempMax > thresholds.maxTemp) {
    return `Sıcaklık çok yüksek (max ${weather.tempMax}°C)`;
  }

  return null; // uygun
}

/**
 * Görevi sonraki uygun güne kaydırır (max 7 gün ileri).
 * Uygun gün bulunamazsa orijinal tarihi korur.
 */
export function findNextSuitableDate(
  originalDate: Date,
  forecast: DailyWeather[],
  thresholds: WeatherThresholds,
  taskType: string,
  maxShiftDays = 7
): { newDate: Date; reason?: string } {
  const startStr = originalDate.toISOString().slice(0, 10);

  // Orijinal günü kontrol et
  const originalWeather = forecast.find((d) => d.date === startStr);
  if (originalWeather) {
    const reason = isDaySuitable(originalWeather, thresholds, taskType);
    if (!reason) {
      return { newDate: originalDate };
    }
  }

  // Sonraki günlere bak
  for (let i = 1; i <= maxShiftDays; i++) {
    const candidate = new Date(originalDate);
    candidate.setDate(candidate.getDate() + i);
    const candStr = candidate.toISOString().slice(0, 10);

    const w = forecast.find((d) => d.date === candStr);
    if (!w) continue;

    const reason = isDaySuitable(w, thresholds, taskType);
    if (!reason) {
      return {
        newDate: candidate,
        reason: `Hava nedeniyle ${i} gün kaydırıldı (orijinal: ${startStr})`,
      };
    }
  }

  // Hiç uygun gün yoksa orijinali bırak, uyarı ekle
  return {
    newDate: originalDate,
    reason: 'Uygun gün bulunamadı, orijinal tarih korundu',
  };
}
