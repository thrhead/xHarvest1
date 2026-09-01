# Kurulum Rehberi

## 1. Gereksinimler
- Node.js 20+
- Expo CLI / npx
- Firebase hesabı (ücretsiz)
- (Opsiyonel) MongoDB Atlas veya SQLite (Payload için)

## 2. Mobil (Expo)

```bash
cd mobile
npm install
# veya yarn
npx expo start
```

Firebase için:
1. console.firebase.google.com → yeni proje
2. Authentication → Email + Anonymous
3. Firestore → test mode ile başla (sonra rules sıkılaştır)
4. Android: `google-services.json` → `mobile/android/app/`
5. iOS: `GoogleService-Info.plist` → `mobile/ios/`

`src/services/firebase.ts` içindeki stub’ları gerçek `@react-native-firebase` import’larıyla değiştir.

## 3. Payload CMS

```bash
cd cms
npx create-payload-app@latest . --template blank
# Crops.ts collection’ını src/collections/ altına kopyala
# payload.config.ts içinde import et
npm run dev
```

Admin paneli: http://localhost:3000/admin

## 4. Open-Meteo
Hiçbir key gerekmez. Direkt `https://api.open-meteo.com` kullan.

## 5. Harita (OSM)
`react-native-maps` + custom tile:
```tsx
<MapView
  provider={PROVIDER_DEFAULT}
  mapType="none"
>
  <UrlTile urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
</MapView>
```

## 6. Bildirimler
```bash
npx expo install expo-notifications
```
İzin al + local notification schedule (hava kaydırma sonrası).

## Güvenlik Notları
- Firestore rules: kullanıcı sadece kendi `userId` verisini okuyup yazabilsin
- Payload access: crops public read, write sadece admin
- Production’da Firebase App Check ekle
