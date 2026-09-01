# Ekim-Hasat Mobile → Vercel (Expo Web)

Diğer projenizdeki (`field-service-management-mobile`) ayarların karşılığı.

## Vercel proje ayarları

| Alan | Değer |
|------|--------|
| **Root Directory** | `mobile` (monorepo; `apps/mobile` değil) |
| **Framework Preset** | Other |
| **Build Command** | `npx expo export --platform web` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install --force` |

Include files outside root: isteğe bağlı (genelde kapalı yeter).

## Ortam değişkenleri (Vercel → Environment Variables)

- `EXPO_PUBLIC_PAYLOAD_URL` = `https://ekim-hasat-cms.vercel.app` (CMS API)
- `EXPO_PUBLIC_DEMO_MODE` = `true` (Firebase yokken demo veri)

## Yerel test

```bash
cd mobile
npm install --force
npm run web
# veya
npm run export:web && npx serve dist
```

## Native (EAS)

Web deploy native yerine geçmez. Mağaza için ayrı EAS Build kullanın (önceki projenizdeki gibi).

## Bilinen sınırlar

- `react-native-maps` web’de sınırlı / stub olabilir
- `@react-native-firebase/*` web’de çalışmaz → DEMO_MODE veya web stub kullanın
- Konum / bildirim tarayıcı izinlerine bağlıdır
