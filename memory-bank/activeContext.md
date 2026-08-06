# Active Context

## Source of truth
- **Repo:** https://github.com/thrhead/xHarvest1
- **Branch:** `main`
- Yerel çalışma kopyası bu repo ile senkron tutulmalı.

## Current focus (2026-08)
- İlaçlama / gübre **applicationLogs** özelliği tamamlandı (MVP):
  - Liste (tür + tarla filtresi), ekle/düzenle, detay, sil
  - Görev tamamla diyalogu: İptal / Sadece tamamla / Kayıt ekle
  - Tarla kartında son uygulamalar
  - Servis filtre API + `docs/APPLICATION_LOGS_API.md`
  - `firestore.rules` → `applicationLogs` (ownsField, validasyon)
- Statik `preview-logs.html` kaldırıldı (sandbox localStorage sorunları).

## Stack snapshot
- Mobile: Expo Router ekranları + Zustand + demo Firebase
- CMS: Payload v3 + Next 15 portal
- Backend: HTTP functions (Spark uyumlu cron)
- Weather: Open-Meteo

## Next candidates
1. Yerel bildirimler (`expo-notifications`)
2. Ekim tarihi date-picker (native)
3. `DEMO_MODE=false` + gerçek Firebase / FCM
4. Offline kuyruk
5. Composite index dokümantasyonu (Firestore console)

## Working notes
- CMS `npm install` için sıkça `--legacy-peer-deps` gerekir (Next / Payload peer aralığı).
- `cms/package.json` içinde `next` 15.4.x pinlenebilir.
