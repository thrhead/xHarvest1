# Karar Kayıtları (Decision Log) — Otomatik Bölge Atama & TÜİK Entegrasyonu

Bu belge, **Otomatik Bölge Atama (PRD v1.1)** geliştirme süreci kapsamında alınan mimari ve ürün kararlarını tarih ve gerekçeleriyle kayıt altına alır.

---

## Karar 1: TÜİK Veri Kapsamı ve İlçe Kademesi Stratejisi
- **Tarih:** 2026-09-07
- **Karar:** 
  - İlk aşamada (Faz 1-4) yalnızca **81 ilin** resmi merkez koordinatları, sınırları (bounding box / poligon) ve TÜİK plaka kodları seed edilecektir.
  - İlçe hiyerarşisi için veri modeli ve veritabanı şeması (`parent` ilişkisi ve `source='tuik_ilce'`) ilk andan itibaren hazır tutulacak, ancak 973 ilçenin veri yüklemesi **Faz 5**'e bırakılacaktır.
- **Gerekçe:** 
  - 81 il verisi ile hızlı ve kesintisiz MVP canlıya alma sağlanır; gereksiz GeoJSON yükü ve bellek şişmesi engellenir. Şema baştan ilçe hiyerarşisini desteklediği için ileride geri dönük kırılma veya migrasyon maliyeti oluşmaz.

---

## Karar 2: Web Arayüzünde Bölge İstatistik Paneli Konumlandırması
- **Tarih:** 2026-09-07
- **Karar:** 
  - Web Dashboard (`DashboardView.tsx`) ana navigasyon çubuğuna 4. sekme olarak **[📊 Bölge İstatistikleri]** eklenecektir:
    `[🗺️ Saha Haritası] | [📋 Saha Görevleri & Defter] | [📅 Takvim & Ajanda] | [📊 Bölge İstatistikleri]`
- **Gerekçe:** 
  - Saha haritası ve defter sekmelerini kalabalıklaştırmadan, bölge bazlı tarla dağılımı, toplam ekim alanı (dönüm/ha), ürün çeşitliliği ve operasyonel görev yoğunluğu ayrı ve odaklanmış bir analitik görünümde sunulur.

---

## Karar 3: TÜİK İl ve Tarımsal Bölge Öncelik Sıralaması (Primary vs Secondary)
- **Tarih:** 2026-09-07
- **Karar:** 
  - Koordinat çözümleme (`resolve`) sonucunda **TÜİK İl** her zaman **Birincil (Primary)** etiket/bölge olarak atanacaktır.
  - Tarımsal Havza / Bölge (Örn: Çukurova, Konya Ovası, Ege Havzası) ise **İkincil (Secondary)** analitik etiket olarak korunacak ve UI üzerinde birlikte gösterilecektir.
  - *Örnek UI Formatı:* `📍 Adana (Çukurova Havzası)` veya `📍 Konya (Konya Ovası)`.
- **Gerekçe:** 
  - Resmi ve meteorolojik entegrasyonlar (MGM / TÜİK / ÇKS) il idari sınırlarına dayanır. Tarımsal havzalar ise agronomik tavsiyeler ve ürün desenleri için değer katar; bu sayede hem resmi standardizasyon hem de tarımsal bağlam aynı anda korunur.

---

## Karar 4: Kapsam Sınırlandırması (Mobil Simülatör Kapsam Dışı)
- **Tarih:** 2026-09-07
- **Karar:** 
  - Geliştirmeler **sadece Web Uygulama (CMS Dashboard & InteractiveMap)** ve **Mobil Uygulama (Expo / React Native)** katmanlarında yapılacaktır.
  - CMS içindeki `MobileSimulator.tsx` bileşeni üzerinde herhangi bir geliştirme veya değişiklik yapılmayacaktır.
- **Gerekçe:** 
  - Gerçek kullanıcı deneyimine ve mobil/web çekirdek fonksiyonlarına odaklanarak gereksiz kod karmaşıklığı ve bakım maliyeti engellenmiştir.
