# PRD: Tarla Bölge Yönetimi (CMS + Mobil Parite + TÜİK + İstatistik)

| Alan | Değer |
|------|--------|
| **Ürün** | Ekim-Hasat |
| **Özellik** | Bölgelerin Payload CMS’te yönetimi; web ve **mobil** tarla akışında API tabanlı seçim; konuma göre otomatik öneri; **TÜİK il/ilçe sınır toplu import**; **bölge bazlı istatistik dashboard** |
| **Versiyon** | 1.1 |
| **Durum** | Taslak |
| **Tarih** | 2026-09-03 |
| **Önceki** | PRD v1.0 (hardcoded bölgeler → CMS) |

---

## 1. Özet

Tarla bölgelerinin kodda sabit tanımlardan çıkarılarak **Turso + Payload** üzerinde yönetilmesi; **web ve mobil**de aynı region kaynağı ve tarla–bölge bağının kullanılması; **TÜİK il/ilçe** sınırlarının toplu yüklenmesi; CMS’te **bölge bazlı istatistik** paneli sunulması.

---

## 2. Problem

| Sorun | Etki |
|--------|------|
| Bölgeler hardcoded (web) | Deploy olmadan bölge eklenemez; mobil ile uyumsuz kaynak |
| Mobilde ayrı / eksik bölge mantığı | Web’de yapılan tarla–bölge deneyimi mobilde yok |
| Tarımsal isim vs idari sınır karışık | “Çukurova” ile “Adana ili” aynı sistemde net değil |
| Bölge performansı görünmüyor | Kaç tarla, kaç görev, hangi bölgede yoğunluk bilinmiyor |

---

## 3. Hedefler

1. **Regions** Payload’da yönetilsin (CRUD, aktif/pasif).  
2. **Web ve mobil** tarla ekleme / düzenleme: region listesi API’den; kayıtta `regionId`.  
3. Konuma göre **otomatik bölge önerisi** (boundary veya en yakın merkez) — web + mobil.  
4. **TÜİK il/ilçe** sınırları toplu import (GeoJSON/shapefile → Region veya ayrı AdminUnit).  
5. **Bölge bazlı istatistik dashboard** (CMS frontend / admin).  
6. Hardcoded bölge listeleri kaldırılsın.

### Başarı metrikleri

| Metrik | Hedef |
|--------|--------|
| Yeni region | CMS’ten eklenince web **ve** mobil select’te görünür (aktifse) |
| Tarla create | `regionId` doluluk ≥ %95 (web + mobil) |
| TÜİK | 81 il (+ ilçeler fazına göre) import sonrası select/harita kullanılabilir |
| Dashboard | Bölge bazında tarla sayısı, açık görev, isteğe bağlı alan toplamı |
| Hardcode | Web bileşenlerinde sabit bölge listesi = 0 |

### Kapsam dışı

- Verim ML / LLM asistanı  
- Her işletmeye ayrı region DB’si  
- Gerçek zamanlı collab harita editörü  
- Mağaza / EAS release süreci (mobil özellik kodda + API; store çıkışı ayrı iş)

---

## 4. Kullanıcılar ve senaryolar

| Rol | İhtiyaç |
|-----|---------|
| **Platform admin** | Region / TÜİK birim yönetimi; istatistikleri izleme |
| **Web kullanıcısı** | Tarla eklerken bölge seçimi / öneri |
| **Mobil kullanıcısı** | **Web ile aynı:** tarla ekleme, bölge listesi, öneri, kayıt |
| **Sistem** | Resolve API; import job; dashboard agregasyon |

### User story’ler

1. Admin olarak CMS’ten bölge eklerim; aynı gün mobilde de listelenir.  
2. Mobilde tarla çizerim/konum seçerim; önerilen bölgeyi görür ve kaydederim.  
3. Admin olarak TÜİK il sınırlarını toplu yüklerim; tarlalar idari birime bağlanabilir.  
4. Admin olarak “Konya bölgesinde kaç tarla / açık görev var?” görürüm.  

---

## 5. Fonksiyonel gereksinimler

### 5.1 Veri modeli

#### A) `regions` (tarımsal veya genel kullanım bölgeleri)

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| `name` | text | Evet | |
| `slug` | text unique | Evet | |
| `centerLat` / `centerLng` | number | Evet | |
| `defaultZoom` | number | Hayır | |
| `boundary` | json | Hayır | GeoJSON Polygon/MultiPolygon |
| `source` | select | Hayır | `manual` \| `tuik_il` \| `tuik_ilce` \| `custom` |
| `tuikCode` | text | Hayır | Resmi kod (il/ilçe) |
| `parent` | relationship | Hayır | İlçe → il |
| `isActive` | boolean | Evet | |
| `sortOrder` | number | Hayır | |

*Not:* TÜİK birimleri de `regions` içinde `source=tuik_*` ile tutulabilir **veya** ayrı `admin-units` collection + tarlada `region` + `adminUnit`. **PRD kararı:** tek collection `regions`; `source` + `tuikCode` + `parent` ile ayrım (basitlik).

#### B) Field (tarla)

- `region` → `regions` (**zorunlu** create’te)  
- Konum/poligon alanları mevcut yapıya uygun  
- Backfill: region boş eski kayıtlar → nearest center veya manuel

### 5.2 API (web + mobil ortak)

| Endpoint / işlem | Açıklama |
|------------------|----------|
| `GET` aktif regions | Mobil ve web; filtre: `source`, `parent`, `q` |
| `GET` region by id | Detay + boundary (isteğe bağlı) |
| `POST /api/regions/resolve` | `{ lat, lng }` → önerilen region(s) |
| Field create/update | `region` id; mobil DEMO_MODE sonrası gerçek API |

Yetki: okuma authenticated (veya aktif region public read); yazma admin; resolve authenticated.

### 5.3 Web UI

- `DashboardView` / `InteractiveMap`: API listesi; hardcode yok  
- Bölge seçince merkez + zoom  
- Resolve sonrası öneri banner + select  
- Kayıt validasyonu: region zorunlu  

### 5.4 Mobil UI (parite — zorunlu)

Web’de yapılan tarla–bölge davranışının mobil karşılığı:

| Web | Mobil |
|-----|--------|
| Region select (API) | Aynı liste (`add-field` / harita akışı) |
| Merkeze göre harita konumu | `react-native-maps` initial region |
| Poligon/nokta sonrası öneri | Resolve API + onay UI |
| `regionId` ile kayıt | Aynı payload alanı |
| Pasif region gizli | Aynı |

Ekranlar: en az `add-field`, `pick-location` / `draw-polygon`, tarla düzenleme varsa orası.  
Offline: son çekilen region listesi cache (AsyncStorage); resolve online tercih.

### 5.5 TÜİK il/ilçe toplu import

| Gereksinim | Detay |
|------------|--------|
| Kaynak | Resmi / açık lisanslı il (ve ilçe) sınır GeoJSON veya eşdeğeri |
| İşlem | Admin tetiklemeli veya seed script: parse → upsert `regions` |
| Alan eşlemesi | `name`, `tuikCode`, `boundary`, `centerLat/Lng` (centroid), `source`, `parent` (ilçe) |
| Idempotent | Aynı `tuikCode` tekrar import’ta update |
| Sonuç raporu | eklenen / güncellenen / hata sayısı |
| UI | Payload admin: “TÜİK import” (upload veya sabit URL) **veya** documented CLI seed |

**Faz içi minimum:** 81 il boundary + merkez.  
**İlçe:** aynı pipeline; performans için boundary liste API’sinde lazy.

Lisans ve kaynak URL dokümante edilir; telif/uygun kullanım kontrolü implementasyon öncesi yapılır.

### 5.6 Bölge bazlı istatistik dashboard

CMS frontend (veya Payload custom view) — **Bölge İstatistikleri**:

| Metrik | Açıklama |
|--------|----------|
| Tarla sayısı | `regionId` bazında |
| Toplam alan | ha/da (alan alanı varsa) |
| Açık görev sayısı | pending/rescheduled, region üzerinden field join |
| Aktif ekim / ürün | veri modeline göre |
| İşletme sayısı | o bölgede tarlası olan farm (multi-tenant) |

**UX**

- Tablo: bölge adı | tarla | alan | açık görev | …  
- Sıralama, `source` filtresi (manuel vs TÜİK)  
- İsteğe bağlı basit bar chart  
- Tarih filtresi v1’de opsiyonel; yoksa “anlık snapshot”

**API:** `GET /api/stats/by-region` agregasyon (Turso sorguları); cache kısa TTL.

### 5.7 Admin

- Regions CRUD  
- Import sonucu log  
- İstatistik sayfasına menü linki  

---

## 6. Otomatik bölge atama kuralları

1. Temsil noktası: poligon centroid veya tek nokta  
2. `boundary` içindeki aktif region (çakışmada: daha spesifik `tuik_ilce` > `tuik_il` > `manual` veya küçük alan)  
3. Eşleşme yoksa en yakın `center`  
4. UI öneriyi gösterir; kullanıcı değiştirmeden kayıtta da `region` zorunlu  

---

## 7. Non-fonksiyonel

| Konu | Gereksinim |
|------|------------|
| Parite | Region ile ilgili tarla create akışı web ↔ mobil özellik eşitliği |
| Performans | 81+ il boundary; liste endpoint boundary’siz; resolve tek nokta hızlı |
| Import | 81 il makul sürede (script/timeout dokümante) |
| Mobil | DEMO_MODE’da mock regions ile UI test; production API |
| Güvenlik | Import sadece admin; stats sadece admin/platform |

---

## 8. Faz planı

| Faz | Kapsam | Çıktı |
|-----|--------|--------|
| **F1** | `regions` collection, seed 6 tarımsal bölge, GET API, web select + regionId, hardcode sil | Temel CMS + web |
| **F2** | Mobil parite (liste, seçim, kayıt, cache) | Web = mobil |
| **F3** | `POST resolve` + web/mobil öneri UI | Otomatik öneri |
| **F4** | TÜİK il toplu import (+ centroid, tuikCode) | İdari sınırlar |
| **F5** | İlçe import + parent ilişki | İnce idari granülerlik |
| **F6** | Stats API + bölge istatistik dashboard | Yönetim görünürlüğü |

*Bağımlılık:* F2, F1 bitmeden complete sayılmaz. F6 için tarlalarda `regionId` doluluğu kritik (F1–F3).

---

## 9. Kabul kriterleri

### F1 – CMS + web  
- [ ] Admin region ekleyince web select’te görünür  
- [ ] 6 seed bölge seçilebilir  
- [ ] Hardcoded bölge yok  
- [ ] Yeni tarla `region` dolu  

### F2 – Mobil parite  
- [ ] Mobil region listesi aynı API  
- [ ] Mobil tarla kaydında `regionId`  
- [ ] Pasif region mobilde de gizli  
- [ ] Web’de yapılabilen bölge seçimi / merkeze konumlama mobilde de yapılabilir  

### F3 – Resolve  
- [ ] lat/lng → öneri döner  
- [ ] Web ve mobil öneriyi gösterip değiştirebilir  

### F4–F5 – TÜİK  
- [ ] İl import idempotent; boundary + merkez  
- [ ] İlçeler parent il ile (F5)  
- [ ] `source` / `tuikCode` dolu  

### F6 – Dashboard  
- [ ] Bölge bazlı tarla ve açık görev sayıları doğru  
- [ ] Filtre/sıralama temel düzeyde çalışır  
- [ ] Admin menüden erişilir  

---

## 10. Riskler

| Risk | Azaltma |
|------|---------|
| Mobil harita + boundary performansı | Resolve sunucuda; mobilde sadece sonuç |
| TÜİK veri lisansı / format | Import öncesi kaynak onayı; adapter katmanı |
| İlçe sayısı ve JSON boyutu | Boundary’siz liste; detayda boundary |
| Stats’ta region null tarlalar | Backfill job + dashboard’da “atanmamış” satırı |
| DEMO_MODE sapması | Mobil production path’te gerçek API zorunluluğu dokümante |

---

## 11. Karar özeti

| Konu | Karar |
|------|--------|
| Mobil | **Web ile parite zorunlu** (aynı API ve regionId) |
| TÜİK | **Kapsam içi** toplu import (il → ilçe) |
| İstatistik | **Kapsam içi** bölge bazlı dashboard |
| Region zorunlu | Tarla create’te **evet** |
| Tek collection | `regions` + `source` / `tuikCode` / `parent` |

---

## 12. Tek cümle

> Bölgeler CMS’te yönetilir; web ve mobil aynı API ile tarlaya `regionId` yazar; TÜİK il/ilçe sınırları toplu yüklenir; admin bölge bazlı istatistikleri dashboard’dan izler.

Bu PRD F1→F6 iş paketlerine doğrudan bölünebilir.
