# System Patterns

## Architecture
```
Expo App ──► Firebase (Auth/Firestore) [veya DEMO bellek]
    │              ▲
    │              │ Admin SDK
    ├─ Open-Meteo  │
    └─ Payload API ◄── Next.js CMS
         Cloud Functions (HTTP) ◄── harici cron
```

## Mobile
- **Expo Router** dosya tabanlı navigasyon (`app/`)
- **Zustand** global state (`appStore`)
- **DEMO_MODE**: Firebase native modül olmadan UI/akış testi
- Servis katmanı: `firebase.ts`, `weather.ts`, `payload.ts`, `taskWeather.ts`

## Application logs
- Koleksiyon: `applicationLogs`
- Görev tamamlanınca opsiyonel log (spraying / fertilizing)
- Filtre: fieldId, inputType, tarih aralığı, ürün adı
- Detay: `docs/APPLICATION_LOGS_API.md`

## CMS
- Payload collections public **read** (crops, guides)
- Route groups: `(payload)` admin/API, `(frontend)` portal

## Backend triggers
- Scheduled yok (Spark) → HTTP + secret header + harici cron
- Firestore triggers: onCropCreated, onTaskUpdated (Spark uyumlu)

## Maps
- `react-native-maps` + OSM `UrlTile`
- Çizim: köşe listesi → Polygon + shoelace alan (ha)
