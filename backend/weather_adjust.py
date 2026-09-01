"""
Görev kaydırma mantığı — mobil ile aynı kurallar.
İleride Cloud Function veya FastAPI endpoint olarak kullanılabilir.
"""

from datetime import datetime, timedelta
from typing import Optional
import requests

OPEN_METEO = "https://api.open-meteo.com/v1/forecast"

DEFAULT_THRESHOLDS = {
    "rain_mm": 5.0,
    "wind_kmh": 15.0,
    "min_temp": 5.0,
    "max_temp": 35.0,
}


def fetch_forecast(lat: float, lng: float, days: int = 14) -> list[dict]:
    params = {
        "latitude": lat,
        "longitude": lng,
        "daily": "precipitation_sum,wind_speed_10m_max,temperature_2m_max,temperature_2m_min",
        "timezone": "Europe/Istanbul",
        "forecast_days": days,
    }
    r = requests.get(OPEN_METEO, params=params, timeout=10)
    r.raise_for_status()
    data = r.json()
    result = []
    for i, date in enumerate(data["daily"]["time"]):
        result.append({
            "date": date,
            "precipitation_sum": data["daily"]["precipitation_sum"][i] or 0,
            "wind_speed_max": data["daily"]["wind_speed_10m_max"][i] or 0,
            "temp_max": data["daily"]["temperature_2m_max"][i] or 0,
            "temp_min": data["daily"]["temperature_2m_min"][i] or 0,
        })
    return result


def is_suitable(day: dict, thresholds: dict, task_type: str) -> Optional[str]:
    sensitive = task_type in ("spraying", "fertilizing")
    if day["precipitation_sum"] >= thresholds["rain_mm"]:
        return f"Yağış bekleniyor ({day['precipitation_sum']:.1f} mm)"
    if day["wind_speed_max"] >= thresholds["wind_kmh"] and sensitive:
        return f"Rüzgar yüksek ({day['wind_speed_max']:.0f} km/h)"
    if day["temp_min"] < thresholds["min_temp"]:
        return f"Sıcaklık çok düşük (min {day['temp_min']}°C)"
    if day["temp_max"] > thresholds["max_temp"]:
        return f"Sıcaklık çok yüksek (max {day['temp_max']}°C)"
    return None


def find_next_suitable(
    original: datetime,
    forecast: list[dict],
    thresholds: dict,
    task_type: str,
    max_shift: int = 7,
) -> tuple[datetime, Optional[str]]:
    start_str = original.strftime("%Y-%m-%d")
    orig_day = next((d for d in forecast if d["date"] == start_str), None)
    if orig_day:
        reason = is_suitable(orig_day, thresholds, task_type)
        if reason is None:
            return original, None

    for i in range(1, max_shift + 1):
        cand = original + timedelta(days=i)
        cand_str = cand.strftime("%Y-%m-%d")
        day = next((d for d in forecast if d["date"] == cand_str), None)
        if day and is_suitable(day, thresholds, task_type) is None:
            return cand, f"Hava nedeniyle {i} gün kaydırıldı"

    return original, "Uygun gün bulunamadı"


if __name__ == "__main__":
    # Örnek: Ankara
    forecast = fetch_forecast(39.92, 32.85)
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    new_date, reason = find_next_suitable(today, forecast, DEFAULT_THRESHOLDS, "spraying")
    print(f"Orijinal: {today.date()} → Yeni: {new_date.date()} | {reason}")
