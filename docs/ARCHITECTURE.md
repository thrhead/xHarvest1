# Mimari

## Genel Bakış

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  React Native   │────▶│   Firebase       │◀────│  Payload CMS    │
│  (Expo)         │     │  Auth + Firestore │     │  (İçerik)       │
└────────┬────────┘     └────────┬─────────┘     └────────┬────────┘
         │                       │                        │
         │                       ▼                        │
         │              ┌─────────────────┐               │
         └─────────────▶│  Open-Meteo API │◀──────────────┘
                        │  (Hava + Toprak)│
                        └─────────────────┘
```

## Veri Modelleri (Firestore)

### users/{userId}
```ts
{
  email: string
  displayName: string
  createdAt: Timestamp
  settings: {
    language: 'tr' | 'en'
    notificationHour: number  // 0-23
    weatherThresholds: {
      rainMm: number        // varsayılan 5
      windKmh: number       // varsayılan 15
      minTemp: number
      maxTemp: number
    }
  }
}
```

### fields/{fieldId}
```ts
{
  userId: string
  name: string
  type: 'field' | 'greenhouse'
  location: { lat: number, lng: number }
  areaHectare: number
  soilType?: string
  createdAt: Timestamp
}
```

### crops/{cropId}  (kullanıcıya özel ekim)
```ts
{
  userId: string
  fieldId: string
  cropTemplateId: string   // Payload’daki ürün ID
  variety?: string
  plantingDate: Timestamp
  expectedHarvestDate?: Timestamp
  status: 'planned' | 'active' | 'harvested'
  notes?: string
}
```

### tasks/{taskId}
```ts
{
  userId: string
  fieldId: string
  cropId: string
  type: 'planting' | 'fertilizing' | 'spraying' | 'harvesting' | 'irrigation' | 'other'
  title: string
  description?: string
  plannedDate: Timestamp
  originalDate: Timestamp   // hava nedeniyle kaydırılmadan önceki
  status: 'pending' | 'completed' | 'skipped' | 'rescheduled'
  weatherCheckedAt?: Timestamp
  weatherReason?: string    // "Yağış bekleniyor (12 mm)"
  completedAt?: Timestamp
}
```

## Payload CMS Collections

- **Crops** → Ürün şablonları (domates, buğday, mısır…)
- **CropStages** → Ekim → hasat arası aşamalar + gün aralıkları
- **Guides** → Rehber yazıları, ilaçlama takvimleri
- **Media** → Fotoğraflar

## Hava Durumu Entegrasyonu (Open-Meteo)

Endpoint örneği:
```
https://api.open-meteo.com/v1/forecast?
  latitude=39.92&longitude=32.85
  &daily=precipitation_sum,wind_speed_10m_max,temperature_2m_max,temperature_2m_min,et0_fao_evapotranspiration
  &hourly=soil_moisture_0_to_1cm,soil_temperature_0cm
  &timezone=Europe/Istanbul
  &forecast_days=14
```

Görev kaydırma mantığı (`mobile/src/services/weatherAdjust.ts`):
1. Görev planlanan güne bak
2. O gün için yağış / rüzgar / sıcaklık kontrol et
3. Eşik aşılırsa → sonraki uygun güne kaydır (max 7 gün)
4. Kullanıcıya bildir

## Offline Strateji
- Firestore `enablePersistence()`
- Görevler lokal kuyrukta tutulur, internet gelince senkron
- Hava verisi 6 saatte bir cache’lenir
