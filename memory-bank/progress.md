# Progress Status

## Completed

### Core MVP
- [x] Monorepo (cms, mobile, backend)
- [x] Expo mobile: tarla, ürün, görev, takvim
- [x] Open-Meteo hava + görev kaydırma (istemci + functions mantığı)
- [x] Harita OSM + konum seç + **tarla poligonu**
- [x] Payload CMS: Crops, Guides, Media, Users
- [x] HTTP Cloud Functions (weatherAdjustHttp, taskRemindersHttp, onCropCreated, onTaskUpdated)
- [x] Ücretsiz cron dokümantasyonu (`docs/FREE_CRON.md`)
- [x] Memory bank

### Application logs (ilaçlama / gübre)
- [x] `ApplicationLog` tipi
- [x] Demo CRUD + `ApplicationLogFilter`
- [x] `logs` / `add-log` / `log-detail`
- [x] Store: createLog, updateLog, deleteLog, refreshLogs
- [x] Görev tamamla → kayıt akışı
- [x] Tarla detayında son uygulamalar
- [x] Firestore rules `applicationLogs`
- [x] `docs/APPLICATION_LOGS_API.md` (imzalar + sequence)

## In progress / partial
- [ ] Gerçek Firebase (DEMO_MODE=false)
- [ ] FCM push (token kaydı iskeleti var)
- [ ] Native date picker (şu an YYYY-MM-DD text)
- [ ] Kullanıcıya özel “son ürün” (şimdilik sabit liste)

## Not started
- [ ] Offline-first kuyruk
- [ ] TFLite hastalık tespiti
- [ ] Yerel sabah bildirimleri
- [ ] Production CMS Postgres

## Verification
- Kod tabanı GitHub `main` ile hizalanmalı (bu progress push sonrası güncel sayılır).
- Tam `npm run build` / Expo bu ortamda RAM kısıtı nedeniyle her zaman doğrulanamayabilir; lokal test önerilir.
