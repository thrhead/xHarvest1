# Tech Context

## Runtimes
- Node 20+ (CMS, Functions)
- Expo SDK ~52 / RN 0.76
- TypeScript strict (mobil + CMS)

## Key packages
### mobile
- expo, expo-router, expo-location, expo-notifications
- react-native-maps, react-native-calendars
- zustand, date-fns
- @react-native-firebase/* (production; demo’da stub)

### cms
- payload ^3, @payloadcms/next, @payloadcms/db-sqlite
- next 15.4.x (peer uyumu için pin önerilir)
- react 19

### backend/functions
- firebase-admin, firebase-functions v2
- Open-Meteo fetch (Node 18+ native fetch)

## Config / secrets
- `PAYLOAD_SECRET`, `DATABASE_URI`
- `CRON_SECRET` (HTTP function header)
- `EXPO_PUBLIC_DEMO_MODE`, `EXPO_PUBLIC_PAYLOAD_URL`

## Constraints
- Firebase Spark: onSchedule yok
- Sandbox/CI: düşük RAM → monorepo `npm install` zorlanabilir
- `npm install --legacy-peer-deps` sık gerekli

## Docs map
| Dosya | Konu |
|-------|------|
| docs/SETUP.md | Kurulum |
| docs/ARCHITECTURE.md | Veri modelleri |
| docs/FREE_CRON.md | Ücretsiz zamanlama |
| docs/APPLICATION_LOGS_API.md | Log API + sequence |
| firestore.rules | Güvenlik kuralları |
