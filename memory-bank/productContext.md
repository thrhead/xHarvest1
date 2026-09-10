# Product Context

## Why This Project Exists
Farming operations heavily depend on weather conditions and precise crop growth stages. Traditional static calendars fail when unexpected rain, heavy wind, or sudden temperature drops make pesticide spraying or soil fertilization ineffective or hazardous.

This application bridges verified crop knowledge (templates from Payload CMS) with real-time micro-location weather data (Open-Meteo) and satellite-based remote sensing to provide an adaptive field task list that adjusts automatically, while maintaining synchronized records across web management consoles and mobile field interfaces.

## Problems Solved
- **Wasted Agrochemicals & Cost**: Prevents spraying pesticides right before heavy rain, saving chemicals, labor costs, and reducing environmental runoff.
- **Forgotten Agricultural Operations**: Provides clear timeline stages for critical fertilization, irrigation, and harvesting windows.
- **Double Entry & Out-of-Sync Records**: Any planting or field created in the web portal or mobile simulator is instantly reflected in both interfaces via unified event-driven synchronization (`eh_fields_sync` & localStorage persistence).
- **Field Confusion & Regional Ambiguity**: Visualizes parcel coordinates and polygons on map views with click-to-focus navigation. Automatically identifies and suggests TÜİK Administrative Province and Agricultural Basin upon drawing polygons or clicking GPS coordinates, saving time and ensuring accurate regional analytics.
- **Blind Field Visits & Undetected Crop Stress**: Eliminates the uncertainty of field health without on-site visits. Informs the farmer whether vegetative growth is balanced, where stress or developmental lag exists, and which specific parcel regions demand physical inspection.

## User Experience Goals
- **Field-Friendly UI**: High-contrast, clean layout readable under direct sunlight with prominent status pills and touch-friendly controls.
- **Clean State & User-Driven Data**: No synthetic mock tasks or artificial logs—farmers start with a clean slate and build their true field operations.
- **Automated Weather Shield**: Automatic task rescheduling with clear explanations (e.g., "Shifted due to predicted 12mm rain").
- **Instant Reactive Feedback**: Immediate visual confirmation and dialog alerts when planting records or tasks are created or updated.
- **Offline & Low-Bandwidth Reliability**: Local data persistence so farmers can view tasks, parcel info, and cached satellite analyses even without cellular connectivity.

---

## Uydu Verileriyle Uzaktan Tarla İzleme (Remote Field Monitoring - PRD Kapsamı)

### PRD Bölüm 3: Birincil Hedefler (Faz 1 MVP — Başarıyla Tamamlandı & Operasyonel)
1. [x] Tarlanın güncel ve geçmiş uydu görüntülerini kullanıcıya sunmak (Sentinel-2 10m ve PlanetScope mimarisi).
2. [x] Bitki sağlığını indeksler (NDVI, NDRE, MSAVI, RECI, NDMI) üzerinden kolayca yorumlanabilir hale getirmek.
3. [x] Bölgesel stres ve ani değişimleri (>%15 NDVI düşüşü) otomatik tespit etmek.
4. [x] Tespit edilen riskleri uygulama içi bildirimlerle (Web & Mobil) kullanıcıya iletmek; e-posta altyapısını hazır tutmak.
5. [x] Uydu analizlerini mevcut ekim, gelişim aşamaları ve görev takvimiyle ilişkilendirmek.
6. [x] Kullanıcıya “hangi tarlaya veya bölgeye öncelikle bakmalıyım?” sorusunun cevabını vermek.
7. [x] Gerçek uydu altlığı (Esri World Imagery) ve spektral vejetasyon ısı haritası katmanları.

---

### PRD Bölüm 17: İkinci Faz (FAZ 2: Aktif Faz — Gelişmiş Analitik, Özel İndeksler & Ziraat Operasyonları)
Faz 1 MVP'nin başarıyla tamamlanmasının ardından sistem İkinci Faza geçirilmiştir. Bu fazın ürün hedefleri ve kullanıcı değerleri şunlardır:

1. **Tarla İçi Grid Tabanlı Bölgesel Anomali Haritası (Z-Score Piksel Sapması)**:
   - *Problem*: Sadece tarlanın genel ortalamasına bakmak, tarlanın belirli bir köşesindeki (örneğin bozuk bir damlama borusu veya drenaj sorunu) lokal stresleri gözden kaçırabilir.
   - *Çözüm*: Parsel içine 10m x 10m mikro-grid hücreleri giydirilir. Ortalama vejetasyondan istatistiksel olarak negatif ayrışan (Z-score < -1.5) hücreler kırmızı stres odağı olarak haritada görselleştirilir.
2. **Özel İndeks Oluşturucu (Formül Editörü & Güvenli Sandbox)**:
   - *Problem*: Farklı bitki türleri (pamuk, mısır, zeytin, bağ vb.) veya özel agronomik araştırmalar için standart 5 indeks yetersiz kalabilir.
   - *Çözüm*: Kullanıcı kendi spektral bant formülünü (örn: `(NIR - RedEdge) / (NIR + RedEdge)` veya `(NIR - Green) / (NIR + Green)`) tanımlayabilir, adlandırabilir, renk paletini seçip anında tarla üzerinde haritalandırabilir.
3. **Ürün Gelişim Aşamasına Göre Fenolojik Referans Aralıkları**:
   - *Problem*: Fide döneminde 0.35 NDVI normal ve sağlıklıyken, başaklanma/çiçeklenme döneminde 0.35 NDVI şiddetli kuraklık veya verim kaybı anlamına gelir.
   - *Çözüm*: Ürünün fenolojik takvimine göre beklenen indeks bantları (Confidence Bands) grafikte gölgeli alan olarak gösterilir; bitkinin dönemine göre ileride mi geride mi olduğu anında anlaşılır.
4. **Geçmiş Sezonlarla Yıllık Karşılaştırma (Multi-Year Benchmark)**:
   - *Problem*: Çiftçi tarlasının bu yıl geçen yıla veya önceki yıla göre nasıl bir gelişim gösterdiğini kıyaslayamaz.
   - *Çözüm*: 2024, 2025 ve 2026 sezonlarının vejetasyon eğrileri aynı zaman ekseninde üst üste bindirilerek sezonlar arası performans farkı sunulur.
5. **Operasyonlarla İndeks Değişimi Korelasyonu**:
   - *Problem*: Yapılan bir üst gübreleme veya sulama operasyonunun bitkiye gerçekten yarayıp yaramadığı tespit edilemez.
   - *Çözüm*: Takvimdeki gübreleme/sulama/ilaçlama görevleri zaman serisi grafiğinde dikey rozetlerle işaretlenir; işlem sonrası NDVI sıçraması doğrulanır.
6. **Toplu Tarla Analizi & Risk Sıralaması (Portfolio Dashboard)**:
   - *Problem*: Çok sayıda tarlası olan çiftçi veya ziraat mühendisi tarlaları tek tek gezmek zorunda kalır.
   - *Çözüm*: Tüm tarlalar tek bir tabloda sağlık skoru, anomali sayısı ve son tarama tarihine göre taranıp "Öncelikli Saha Kontrolü Gerekenler" en üstte listelenir.
7. **Tarla Sağlık Karnesi ve Rapor Dışa Aktarımı (PDF & Excel)**:
   - *Problem*: Çiftçiler tarla analizlerini bankalara, sigorta eksperlerine veya ortaklarına fiziksel/resmi belge olarak sunamaz.
   - *Çözüm*: Tek tıkla yazdırılabilir A4 Tarla Sağlık Karnesi (PDF) ve zaman serisi verilerinin Excel/CSV dökümü üretilir.
8. **Ziraat Mühendisi / Danışman Çalışma Alanı**:
   - *Problem*: Danışmanlar farklı üreticilerin parsellerini toplu yönetmekte zorlanır.
   - *Çözüm*: Portföy görünümü, reçete ve uzman inceleme notları ekleme modülü.
9. **Kullanıcı Geri Bildirimiyle Kural İyileştirme**:
   - *Problem*: Bulut gölgesi veya hasat sonrası saman kalıntısı gibi durumlar sahte stres uyarısı üretebilir.
   - *Çözüm*: Kullanıcı "Yanlış Alarm" veya "Doğrulandı" butonuna basarak sistemi eğitir; tolerans katsayıları adapte olur.
10. **PlanetScope 3m Yüksek Çözünürlük Sağlayıcı & Kota Takibi**:
    - *Problem*: Ticari yüksek çözünürlüklü uydu verilerinin maliyet ve kota kontrolü gereklidir.
    - *Çözüm*: Kota limitleri, alan bazlı harcama sayacı ve sağlayıcı seçim mekanizması.

---

### PRD Bölüm 3: Hedef Dışı Konular (Strictly Out-of-Scope)
İlk iki sürümde aşağıdaki özellikler kesinlikle kapsam dışı kalmaya devam eder:
- Hastalık veya zararlının laboratuvar düzeyinde kesin teşhisi (yalnızca spektral stres risk göstergesi olarak sunulur).
- Uydu görüntüsünden doğrudan kimyasal ilaç veya gübre dozu reçete edilmesi (dozaj uzman ziraat mühendisi sorumluluğundadır).
- Drone ortofoto mozaikleme motoru (Faz 3'e aittir).
- Gerçek zamanlı canlı video akışı.
- Otomatik tarımsal müdahalelerin çiftçi onayı olmadan fiziksel ekipmana iletilmesi.

---

### PRD Bölüm 18: Üçüncü Faz Konuları (İleri Düzey Yol Haritası - Gelecek Faz)
1. **Makine Öğrenmesiyle Anomali ve Stres Tahmini**: Geçmiş verilerden öğrenen yapay zeka modelleri.
2. **Ürün ve Gelişim Aşaması Otomatik Önerisi**: Spektral imzadan ürün tahmini.
3. **Hastalık ve Zararlı Erken Uyarı Modeli**: Hava durumu + mikroiklim + spektral stres birleşik risk modeli.
4. **Drone Görüntüsü Entegrasyonu**: Yüksek çözünürlüklü ortofoto harita ve multispektral drone verilerinin işlenmesi.
5. **Bitki Sayımı ve Sıra Analizi**: Seyreklik ve çıkış başarısı analitiği.
6. **Hasat Öncesi Verim Tahmini**: Dekar başına beklenen rekolte tahmini.
7. **API Üzerinden Kurumsal Entegrasyon**: ERP ve tarım işletmeleri için harici REST API.
8. **Çoklu İşletme ve Bayi Yönetimi**: Kooperatifler ve bayiler için hiyerarşik organizasyon mimarisi.
