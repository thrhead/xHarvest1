# Ücretsiz Zamanlanmış İşler (Blaze / Cloud Scheduler yok)

Firebase **Spark (ücretsiz)** planında `onSchedule` çalışmaz.  
Çözüm: **HTTP Cloud Function** (ücretsiz) + **harici ücretsiz cron**.

## Mimari

```
Ücretsiz Cron Servisi          Firebase Spark (ücretsiz)
┌─────────────────┐            ┌──────────────────────────┐
│ cron-job.org    │  POST      │ weatherAdjustHttp        │
│ GitHub Actions  │ ─────────▶ │ taskRemindersHttp        │
│ Cloudflare Cron │  + secret  │ onCropCreated (Firestore) │
└─────────────────┘            │ onTaskUpdated (Firestore) │
                               └──────────────────────────┘
```

## 1. Fonksiyonları deploy et (Spark yeterli)

```bash
cd backend/functions
npm install && npm run build

# Secret ayarla (önemli!)
firebase functions:config:set cron.secret="KENDI_UZUN_GIZLI_ANAHTARIN"
# veya .env / params ile CRON_SECRET

firebase deploy --only functions
```

Deploy sonrası URL’ler:
```
https://europe-west1-<PROJECT_ID>.cloudfunctions.net/weatherAdjustHttp
https://europe-west1-<PROJECT_ID>.cloudfunctions.net/taskRemindersHttp
```

> Not: v2 functions’ta env için `firebase functions:secrets:set CRON_SECRET` veya
> `defineSecret` kullanabilirsiniz. Kod `process.env.CRON_SECRET` okur.

## 2. Seçenek A — cron-job.org (en basit, tamamen ücretsiz)

1. https://cron-job.org → ücretsiz hesap
2. **Create cronjob**
   - Title: `Ekim-Hasat Hava`
   - URL: `https://europe-west1-....cloudfunctions.net/weatherAdjustHttp`
   - Schedule: her gün **05:00** (timezone: Europe/Istanbul)
   - Request method: **POST**
   - Headers: `x-cron-secret: KENDI_GIZLI_ANAHTARIN`
3. İkinci job: `taskRemindersHttp` → her gün **07:00**, aynı header

Ücretsiz plan: dakikada 1 istek, yeterli.

## 3. Seçenek B — GitHub Actions (repo zaten GitHub’daysa)

Dosya hazır: `.github/workflows/cron-weather.yml`

Repo → Settings → Secrets and variables → Actions:
| Secret | Değer |
|--------|--------|
| `CRON_SECRET` | Gizli anahtar |
| `WEATHER_ADJUST_URL` | weatherAdjustHttp URL |
| `REMINDERS_URL` | taskRemindersHttp URL |

Public repo’da Actions ücretsiz; private’da aylık 2000 dk ücretsiz (bu job saniyeler sürer).

Manuel test: Actions → Daily Farm Cron → Run workflow

## 4. Seçenek C — Cloudflare Workers Cron (ücretsiz)

```js
// worker.js — Cron Trigger: 0 2 * * * ve 0 4 * * *
export default {
  async scheduled(event, env) {
    const url = event.cron === "0 2 * * *"
      ? env.WEATHER_URL
      : env.REMINDERS_URL;
    await fetch(url, {
      method: "POST",
      headers: { "x-cron-secret": env.CRON_SECRET },
    });
  },
};
```

Cloudflare free: 3 cron trigger / hesap.

## Hangisini seçmeli?

| Yöntem | Kurulum | Güvenilirlik | Tavsiye |
|--------|---------|--------------|---------|
| **cron-job.org** | 2 dk | İyi | En hızlı başlangıç |
| **GitHub Actions** | 5 dk | Çok iyi | Repo zaten GH’da ise |
| **Cloudflare Workers** | 10 dk | Mükemmel | Biraz daha teknik |

## Güvenlik

- URL’yi gizli tutmaya gerek yok; **`x-cron-secret` header zorunlu**
- Secret’ı en az 32 karakter yapın
- Production’da secret’ı Firebase Secret Manager / env ile verin, koda yazmayın

## Test

```bash
curl -X POST \
  -H "x-cron-secret: KENDI_GIZLI_ANAHTARIN" \
  https://europe-west1-<PROJECT>.cloudfunctions.net/weatherAdjustHttp
```

Beklenen cevap:
```json
{ "ok": true, "shifted": 0 }
```
