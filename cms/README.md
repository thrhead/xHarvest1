# Ekim-Hasat — Payload CMS

Ürün şablonları (Crops), rehberler (Guides) ve medya yönetimi.

## Hızlı başlangıç

```bash
cd cms
cp .env.example .env
# PAYLOAD_SECRET değerini değiştirin (min 32 karakter)

npm install
npm run dev
```

- Admin: http://localhost:3000/admin (ilk açılışta kullanıcı oluşturursunuz)
- API: http://localhost:3000/api/crops
- Ana sayfa: http://localhost:3000

## Seed (örnek ürünler)

Sunucu çalışırken ayrı terminalde:

```bash
npm run seed
```

Domates, Buğday, Mısır şablonları eklenir.

## Collections

| Collection | Public read | Açıklama |
|------------|-------------|----------|
| `crops` | ✅ | Ürün şablonları + aşamalar + görevler |
| `guides` | ✅ | Rehber yazıları |
| `media` | ✅ | Görseller |
| `users` | ❌ | Admin kullanıcılar |

## Mobil bağlantı

`mobile/.env`:
```
EXPO_PUBLIC_PAYLOAD_URL=http://localhost:3000
```

Android emülatör: `http://10.0.2.2:3000`  
Fiziksel cihaz: bilgisayarın LAN IP’si

Mobil `payload.ts` önce CMS’e istek atar; başarısız olursa yerel fallback kullanır.

## Production

- SQLite yerine PostgreSQL (`@payloadcms/db-postgres`) önerilir
- `PAYLOAD_SECRET` güçlü olsun
- CORS’u production domain ile sınırlayın
