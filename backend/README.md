# Backend — Firebase Cloud Functions (ÜCRETSİZ Spark uyumlu)

Scheduled (cron) fonksiyonlar **Blaze** ister.  
Bu proje Spark’ta çalışacak şekilde tasarlandı:

| Fonksiyon | Tetikleyici | Plan |
|-----------|-------------|------|
| **weatherAdjustHttp** | HTTP POST (harici cron) | Spark ✅ |
| **taskRemindersHttp** | HTTP POST (harici cron) | Spark ✅ |
| **onCropCreated** | Firestore onCreate | Spark ✅ |
| **onTaskUpdated** | Firestore onUpdate | Spark ✅ |

Zamanlanmış işler için ücretsiz harici cron kullanılır → detay: **`docs/FREE_CRON.md`**

## Kurulum

```bash
cd backend/functions
npm install
npm run build

# Secret (zorunlu)
export CRON_SECRET="uzun-ve-rastgele-bir-anahtar-buraya"

firebase use <project-id>
firebase deploy --only functions
```

Deploy sonrası:
```
https://europe-west1-<PROJECT>.cloudfunctions.net/weatherAdjustHttp
https://europe-west1-<PROJECT>.cloudfunctions.net/taskRemindersHttp
```

## Ücretsiz cron bağlama (özet)

### cron-job.org
1. Ücretsiz hesap aç
2. Her gün 05:00 → POST `weatherAdjustHttp` + header `x-cron-secret: ...`
3. Her gün 07:00 → POST `taskRemindersHttp` + aynı header

### GitHub Actions
`.github/workflows/cron-weather.yml` hazır.  
Secrets: `CRON_SECRET`, `WEATHER_ADJUST_URL`, `REMINDERS_URL`

## Firestore index
`tasks`: `status` ASC + `plannedDate` ASC

## FCM token (mobil)
```ts
const token = await messaging().getToken();
await firestore().collection('users').doc(uid).set(
  { fcmTokens: firestore.FieldValue.arrayUnion(token) },
  { merge: true }
);
```

## cropTemplates seed
```bash
# Admin SDK credentials ile
npx ts-node src/seedTemplates.ts
```
