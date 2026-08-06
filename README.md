# Ekim-Hasat Takvimi ve Görev Yönetimi — MVP

Basit, pratik ve çiftçilerin gerçekten kullanacağı türden bir **ekim-hasat takvimi + görev yönetimi** mobil uygulaması.

## Özellikler (MVP Kapsamı)

| Özellik | Açıklama | Durum |
|---------|----------|-------|
| **Çoklu Tarla / Sera** | Kullanıcı birden fazla tarla veya sera ekleyebilir, haritada görüntüleyebilir | ✅ |
| **Ürüne göre takvim** | Ekim, gübreleme, ilaçlama, hasat hatırlatmaları (CMS’den şablon) | ✅ |
| **Görev yönetimi** | Görev oluşturma, tamamlama, erteleme | ✅ |
| **Hava durumuna göre kaydırma** | Yağış / rüzgar / sıcaklık eşiklerine göre görevleri otomatik kaydırma | ✅ |
| **Harita** | OpenStreetMap (react-native-maps + OSM tiles) | ✅ |
| **İçerik yönetimi** | Payload CMS ile ürün şablonları, rehberler, ilaç/gübre önerileri | ✅ |
| **Kimlik doğrulama** | Firebase Auth (e-posta + anonim) | ✅ |
| **AI (stub)** | Hastalık tespiti için TFLite / CNN iskeleti (ileride) | 🟡 Stub |

## Teknoloji Seçimi

| Katman | Teknoloji | Neden |
|--------|-----------|-------|
| Mobil | **Expo + React Native** (TypeScript) | Tek kodla iOS + Android, hızlı geliştirme |
| Backend / DB | **Firebase** (Auth + Firestore + Cloud Functions) | Hızlı başlangıç, gerçek zamanlı, offline destek |
| CMS | **Payload CMS v3** (Node.js + MongoDB/SQLite) | Ürün rehberleri, takvim şablonları, admin paneli |
| Hava durumu | **Open-Meteo** | Ücretsiz, API key yok, toprak nemi, ET₀, tarıma uygun |
| Harita | **react-native-maps** + OpenStreetMap tiles | Ücretsiz, Google Maps alternatifi |
| AI | Python + TensorFlow Lite (ileride) | Mobilde hafif inference |

## Proje Yapısı

```
ekim-hasat-mvp/
├── mobile/                 # Expo React Native uygulaması
│   ├── app/                # Expo Router ekranları
│   ├── src/
│   │   ├── components/
│   │   ├── services/       # Firebase, Open-Meteo, Payload
│   │   ├── hooks/
│   │   ├── types/
│   │   └── utils/
│   └── package.json
├── cms/                    # Payload CMS
│   ├── src/collections/    # Crops, Guides, Templates
│   └── package.json
├── backend/
│   ├── functions/          # Firebase Cloud Functions (otomatik tetikleyiciler)
│   │   └── src/
│   │       ├── index.ts    # scheduled + Firestore triggers
│   │       ├── weather.ts
│   │       └── seedTemplates.ts
│   └── weather_adjust.py   # Pure Python referans
└── docs/
    ├── ARCHITECTURE.md
    ├── SETUP.md
    └── API.md
```

## Hızlı Başlangıç

### 1. Mobil Uygulama
```bash
cd mobile
npx create-expo-app@latest . --template blank-typescript
# bağımlılıkları yükle (aşağıdaki package.json’a göre)
npx expo start
```

### 2. Payload CMS
```bash
cd cms
npx create-payload-app@latest . --template blank
# collections ekle
npm run dev
```

### 3. Firebase
1. Firebase Console’da proje oluştur (**Spark / ücretsiz** plan yeterli)
2. Authentication → Email/Password + Anonymous aç
3. Firestore Database oluştur
4. `mobile/google-services.json` ve `GoogleService-Info.plist` ekle

### 3b. Cloud Functions (ücretsiz — Blaze gerekmez)
```bash
cd backend/functions
npm install && npm run build
firebase use <project-id>
firebase deploy --only functions
```
Zamanlanmış işler = HTTP endpoint + ücretsiz harici cron (cron-job.org / GitHub Actions).

| Fonksiyon | Tetikleyici | Ne yapar |
|-----------|-------------|----------|
| `weatherAdjustHttp` | Harici cron → HTTP | Hava kontrolü + görev kaydırma + FCM |
| `taskRemindersHttp` | Harici cron → HTTP | Bugünkü görev hatırlatması |
| `onCropCreated` | Firestore (ücretsiz) | Şablondan görev üret |
| `onTaskUpdated` | Firestore (ücretsiz) | İstatistik güncelle |

Detay: `docs/FREE_CRON.md` · `backend/README.md`

### 4. Ortam Değişkenleri
`mobile/.env`:
```
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_PAYLOAD_URL=http://localhost:3000
EXPO_PUBLIC_OPEN_METEO_BASE=https://api.open-meteo.com/v1
```

## Temel Akışlar

1. **Kullanıcı giriş yapar** → Firebase Auth
2. **Tarla ekler** → Konum (harita), alan, toprak tipi
3. **Ürün seçer** → Payload’dan şablon çekilir → otomatik görevler oluşur
4. **Görevler listelenir** → Hava durumu kontrol edilir
5. **Uygun olmayan gün** (yağış > 5mm, rüzgar > 15 km/h vb.) → görev otomatik kaydırılır
6. **Hatırlatma** → Expo Notifications

## Sonraki Adımlar (MVP sonrası)
- Offline-first (Firestore persistence + lokal kuyruk)
- Hastalık tespiti (TFLite model)
- Gübre/ilaç stok takibi
- Çoklu dil (TR + EN)
- Dark mode + büyük font (tarla kullanımı)
- cropTemplates seed’ini Payload CMS ile senkronize etme

## Lisans
MIT — açık kaynak, çiftçiler için.
