# Firebase Spark entegrasyon hazırlığı

Bu özellik seti Spark (ücretsiz) plan ile uyumludur.

## Servisler

| Özellik | Spark bileşeni | Not |
|---------|----------------|-----|
| Auth | Anonymous + Email | `DEMO_MODE=false` |
| Veri | Firestore | fields, crops, tasks, applicationLogs |
| Rules | firestore.rules | `applicationLogs` + ownsField |
| Yerel bildirim | expo-notifications | FCM zorunlu değil |
| Hava | Open-Meteo | Firebase kotası yemez |
| PHI / maliyet | applicationLogs alanları | phiDays, totalCostTry |
| Sezon özeti | İstemci hesabı | Ek sunucu yok |
| Günlük otomasyon | HTTP Function + harici cron | `docs/FREE_CRON.md` |

## Mobil geçiş

```bash
# .env
EXPO_PUBLIC_DEMO_MODE=false
```

1. Firebase Console → Spark proje
2. Auth aç
3. Firestore + rules deploy: `firebase deploy --only firestore:rules`
4. `google-services.json` / `GoogleService-Info.plist`
5. `@react-native-firebase/*` EAS build

## applicationLogs alanları (Spark Firestore)

- `phiDays` (number, opsiyonel)
- `harvestSafeDate` (timestamp)
- `unitCostTry`, `totalCostTry` (number)

## Bildirim

- Yerel: `mobile/src/services/notifications.ts` (Spark’tan bağımsız)
- İleride FCM: `saveFcmToken` → `users/{uid}.fcmToken` (Firestore Spark OK)
