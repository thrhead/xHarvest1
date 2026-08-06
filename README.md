# xHarvest1 — Ekim-Hasat Takvimi ve Görev Yönetimi

Çiftçiler için **ekim–hasat takvimi**, **görev yönetimi**, **hava durumuna göre kaydırma**, **harita / tarla poligonu** ve **ilaçlama–gübre uygulama geçmişi**.

Repo: [github.com/thrhead/xHarvest1](https://github.com/thrhead/xHarvest1)

---

## Özellikler

| Özellik | Açıklama | Durum |
|---------|----------|--------|
| Çoklu tarla / sera | Konum, alan, tip | ✅ |
| Tarla poligonu | Haritada sınır çizme, alan (ha) hesabı | ✅ |
| Harita | OSM tiles + pin / poligon (`react-native-maps`) | ✅ |
| Ürün takvimi | CMS / yerel şablondan görev üretimi | ✅ |
| Görev yönetimi | Liste, tamamlama, hava kaydırma | ✅ |
| Hava entegrasyonu | Open-Meteo (API key yok); eşiklere göre kaydırma | ✅ |
| İlaçlama / gübre kaydı | Geçmiş defteri (stok değil): ekle, listele, detay, düzenle, sil | ✅ |
| Görev → kayıt | Tamamla: İptal / Sadece tamamla / Kayıt ekle | ✅ |
| Payload CMS | Ürün şablonları, rehberler, admin | ✅ |
| Otomatik tetikleyiciler | HTTP Cloud Functions + ücretsiz harici cron (Spark) | ✅ |
| Firebase Auth / Firestore | İskelet + demo mod; production bağlama opsiyonel | 🟡 |
| AI hastalık tespiti | TFLite planı | 🟡 Stub |
| Yerel bildirimler | expo-notifications bağımlılığı var | 🟡 Sonraki |

---

## Teknoloji

| Katman | Stack |
|--------|--------|
| Mobil | Expo ~52, React Native, Expo Router, TypeScript, Zustand |
| Web / CMS | Next.js 15, Payload CMS v3, SQLite (dev), Tailwind |
| Veri | Firebase Auth + Firestore (demo bellek veya gerçek) |
| Functions | Firebase Functions v2 HTTP (ücretsiz Spark uyumlu) |
| Hava | Open-Meteo |
| Harita | react-native-maps + OpenStreetMap |

---

## Proje yapısı

```
xHarvest1/
├── mobile/                 # Expo uygulaması
│   ├── app/                # Ekranlar (index, tasks, logs, map, …)
│   └── src/
│       ├── components/     # FieldMap (poligon)
│       ├── services/       # firebase, weather, payload
│       ├── store/          # zustand
│       ├── types/
│       └── utils/
├── cms/                    # Payload + Next portal
│   └── src/collections/    # Crops, Guides, Media, Users
├── backend/
│   └── functions/          # weatherAdjustHttp, taskRemindersHttp, …
├── docs/
│   ├── ARCHITECTURE.md
│   ├── SETUP.md
│   ├── FREE_CRON.md        # Blaze’siz zamanlama
│   └── APPLICATION_LOGS_API.md
├── memory-bank/            # AI / ekip bağlam dokümanları
├── firestore.rules
└── package.json            # npm workspaces (cms, mobile)
```

### Mobil ekranlar

| Rota | Açıklama |
|------|----------|
| `index` | Ana özet |
| `fields` / `add-field` | Tarlalar + son uygulamalar |
| `map` / `pick-location` / `draw-polygon` | Harita ve sınır |
| `tasks` / `calendar` | Görevler ve takvim |
| `add-crop` | Ürün + otomatik görev |
| `logs` / `add-log` / `log-detail` | İlaçlama–gübre geçmişi |

---

## Hızlı başlangıç

### Mobil

```bash
cd mobile
npm install
# İsteğe bağlı: EXPO_PUBLIC_DEMO_MODE=true (varsayılan demo)
npx expo start
```

### CMS (web)

```bash
cd cms
cp .env.example .env   # veya mevcut .env
# PAYLOAD_SECRET ≥ 32 karakter
npm install --legacy-peer-deps
npm run dev
# http://localhost:3000  |  /admin  |  /api/crops
```

### Cloud Functions (opsiyonel)

```bash
cd backend/functions
npm install && npm run build
firebase deploy --only functions
```

Zamanlanmış işler için **Blaze gerekmez**: HTTP endpoint + [cron-job.org](https://cron-job.org) veya GitHub Actions — detay: `docs/FREE_CRON.md`.

---

## İlaçlama / gübre kaydı

- **Amaç:** Ne, ne kadar, hangi tarlaya uygulandı (geçmiş; stok yok).
- **API imzaları ve sequence:** `docs/APPLICATION_LOGS_API.md`
- Firestore koleksiyonu: `applicationLogs` (kurallar `firestore.rules` içinde)

---

## Ortam değişkenleri

**mobile**

```
EXPO_PUBLIC_DEMO_MODE=true
EXPO_PUBLIC_PAYLOAD_URL=http://localhost:3000
```

**cms**

```
PAYLOAD_SECRET=...
DATABASE_URI=file:./ekim-hasat.db
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
```

---

## Lisans

MIT — açık kaynak, tarım kullanımı için.
