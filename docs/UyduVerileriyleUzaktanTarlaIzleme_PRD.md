# PRD: Uydu Verileriyle Uzaktan Tarla İzleme

**Ürün:** Ekim-Hasat Takvimi ve Görev Yönetimi  
**Özellik:** Remote Field Monitoring / Uydu Tabanlı Tarla İzleme  
**Doküman durumu:** Taslak  
**Hedef platformlar:** Web portalı, mobil uygulama  
**Hedef kullanıcılar:** Çiftçiler, ziraat mühendisleri, tarım işletmeleri ve sera yöneticileri

## 1. Özellik Özeti

Kullanıcıların tarlalarını saha ziyareti yapmadan uydu görüntüleri ve vejetasyon indeksleri üzerinden takip etmesini sağlayan bir izleme modülüdür.

Modül:

- Tarla poligonlarını uydu görüntüleri üzerinde gösterir.
- Sentinel-2 ve PlanetScope görüntülerini destekler.
- Bulut, sirüs bulutu ve bulut gölgesi etkilerini azaltır.
- NDVI, NDRE, MSAVI, RECI, NDMI gibi indeksleri hesaplar ve görselleştirir.
- Tarlanın zaman içerisindeki bitki sağlığı değişimini gösterir.
- Anormal değişimlerde kullanıcıya uygulama içi ve e-posta bildirimleri gönderir.
- İndeksleri ürün gelişim aşamalarıyla ilişkilendirir.
- Kullanıcının özel formüllerle özel indeks tanımlamasına izin verir.
- Uydu analizlerinden elde edilen sonuçları görev yönetimi ve hava durumu modülüyle ilişkilendirir.

## 2. Problem Tanımı

Mevcut sistem hava koşullarına göre görevleri planlayabilmektedir; ancak kullanıcının tarladaki gerçek bitki durumunu uzaktan değerlendirmesine yardımcı olmamaktadır.

Kullanıcılar şu sorulara hızlıca cevap bulamamaktadır:

- Bitki gelişimi tarlanın tamamında dengeli mi?
- Hangi parsellerde stres veya gelişim geriliği var?
- Son sulama veya gübreleme işlemi bitki sağlığını etkiledi mi?
- Tarlanın hangi bölgeleri saha ziyareti gerektiriyor?
- Bitki sağlığı önceki haftaya göre kötüleşiyor mu?
- Hasat veya ilaçlama öncesinde tarlada bölgesel farklılık var mı?

Bu özellik, uydu gözlemlerini tarla operasyonlarıyla birleştirerek saha ziyaretlerinin daha hedefli yapılmasını amaçlar.

## 3. Hedefler

### Birincil hedefler

1. Tarlanın güncel ve geçmiş uydu görüntülerini kullanıcıya sunmak.
2. Bitki sağlığını indeksler üzerinden kolayca yorumlanabilir hale getirmek.
3. Bölgesel stres ve ani değişimleri otomatik tespit etmek.
4. Riskleri uygulama içi ve e-posta bildirimleriyle kullanıcıya iletmek.
5. Uydu analizlerini mevcut ekim, gelişim ve görev takvimiyle ilişkilendirmek.
6. Kullanıcıya “hangi tarlaya veya bölgeye öncelikle bakmalıyım?” sorusunun cevabını vermek.

### İkincil hedefler

- Saha ziyaretlerinin daha verimli planlanmasını sağlamak.
- Geçmiş sezonlarla karşılaştırmalı analiz sunmak.
- Uydu bulgularına göre görev oluşturmayı kolaylaştırmak.
- Ziraat mühendislerinin müşterileri için uzaktan takip yapabilmesini sağlamak.

### Hedef dışı konular

İlk sürümde aşağıdaki özellikler kapsam dışıdır:

- Hastalık veya zararlının kesin teşhisi.
- Uydu verisiyle ürün türünün otomatik ve yüzde 100 doğru tespiti.
- Uydu görüntüsünden doğrudan ilaç veya gübre dozunun otomatik belirlenmesi.
- Drone görüntülerinin işlenmesi.
- Gerçek zamanlı video veya sürekli canlı görüntü.
- Uydu görüntüsü olmayan günlerde yapay görüntü üretimi.
- Otomatik tarımsal kararların kullanıcı onayı olmadan uygulanması.

Uydu verileri risk göstergesi olarak kullanılmalı, nihai agronomik kararların yerine geçmemelidir.

## 4. Kullanıcı Personaları

### Çiftçi

- Birden fazla tarlayı hızlıca kontrol etmek ister.
- Karmaşık bilimsel grafikler yerine renkli durum göstergelerini tercih eder.
- Sadece sorun olan bölgeler için uyarı almak ister.
- Mobil cihazdan düşük bağlantı kalitesiyle çalışır.

### Ziraat mühendisi

- Aynı anda çok sayıda tarlayı analiz eder.
- Farklı indeksleri ve tarih aralıklarını karşılaştırır.
- Bölgesel anomalileri incelemek ister.
- Kendi eşiklerini ve özel indekslerini tanımlamak ister.

### Tarım işletmesi yöneticisi

- Genel portföy durumunu görmek ister.
- Tarlaları risk seviyesine göre sıralamak ister.
- Operasyon ekiplerine görev atamak ister.
- Rapor ve geçmiş kayıtlarını dışa aktarmak ister.

### Sistem yöneticisi

- Uydu veri sağlayıcılarını yönetir.
- İndeks tanımlarını ve ürün aşamalarını yapılandırır.
- Bildirim kurallarını ve kota bilgilerini izler.

## 5. Kullanıcı Akışları

### 5.1. İlk tarla analizi

1. Kullanıcı mevcut tarlalarından birini seçer.
2. Sistem tarla poligonunu kontrol eder.
3. Kullanıcı veri kaynağını seçer:
   - Sentinel-2
   - PlanetScope
   - Otomatik seçim
4. Tarih aralığı seçilir.
5. Sistem uygun görüntüleri listeler.
6. Kullanıcı bir görüntüyü veya indeks katmanını açar.
7. Harita üzerinde tarla ve indeks renk skalası gösterilir.
8. Sistem temel yorum sunar:
   - Genel sağlık durumu
   - Önceki görüntüye göre değişim
   - Bulutluluk oranı
   - Riskli bölgeler

### 5.2. Risk uyarısı

1. Yeni uydu görüntüsü sisteme alınır.
2. Görüntü kalite kontrolünden geçirilir.
3. Bulut ve gölge maskeleri uygulanır.
4. Seçili indeksler hesaplanır.
5. Önceki görüntülerle karşılaştırma yapılır.
6. Tanımlı eşik aşılırsa risk olayı oluşturulur.
7. Kullanıcının bildirim tercihleri kontrol edilir.
8. Uygulama içi bildirim gönderilir.
9. Kullanıcı e-posta bildirimini etkinleştirdiyse e-posta gönderilir.
10. Kullanıcı uyarıyı inceler, doğrular veya görev oluşturur.

### 5.3. Saha görevi oluşturma

1. Kullanıcı indeks haritasında riskli bölgeyi açar.
2. “Saha görevi oluştur” seçeneğine tıklar.
3. Sistem görev formunu önceden doldurur:
   - Tarla
   - Risk tipi
   - Tespit tarihi
   - Riskli bölge
   - İlgili indeks
4. Kullanıcı not ve sorumlu kişi ekler.
5. Görev mevcut görev yönetimi modülüne kaydedilir.

## 6. Fonksiyonel Gereksinimler

### FR-01: Uydu veri kaynağı yönetimi

Sistem aşağıdaki veri kaynaklarını desteklemelidir:

- Sentinel-2
- PlanetScope

Veri kaynağına ilişkin bilgiler:

- Görüntü tarihi
- Veri sağlayıcı
- Mekânsal çözünürlük
- Bulutluluk oranı
- İşleme durumu
- Kullanılabilir bantlar
- Veri erişim lisansı veya kota durumu

Kullanıcı “otomatik seçim” seçtiğinde sistem şu kriterlere göre uygun görüntüyü seçmelidir:

1. Tarla poligonunu yeterli oranda kapsaması
2. Kabul edilebilir bulutluluk oranı
3. En güncel tarih
4. Seçili veri kaynağı önceliği
5. Kullanıcının abonelik ve veri erişim yetkisi

> Sentinel-2 görüntüleri temel olarak 10 metre sınıfında çözünürlük sağlarken, yaklaşık 3 metre çözünürlük PlanetScope tarafında beklenmelidir. Arayüzde çözünürlük, veri kaynağına göre açıkça gösterilmelidir.

### FR-02: Görüntü arama ve filtreleme

Kullanıcılar görüntüleri aşağıdaki kriterlere göre filtreleyebilmelidir:

- Tarih aralığı
- Veri kaynağı
- Maksimum bulutluluk oranı
- Görüntü kalitesi
- İşlenmiş / işlenmemiş durumu
- İndeks türü
- Ürün gelişim aşaması

Sistem, uygun görüntü bulunamadığında kullanıcıya nedenini açıklamalıdır:

- Tarih aralığında görüntü yok
- Bulutluluk çok yüksek
- Tarla yeterince kapsanmıyor
- Sağlayıcı verisi geçici olarak kullanılamıyor
- İşleme henüz tamamlanmadı

### FR-03: Harita ve katman gösterimi

Harita ekranında aşağıdaki özellikler bulunmalıdır:

- Tarla poligonu
- Uydu görüntüsü
- İndeks raster katmanı
- Risk bölgeleri
- Renk skalası
- Harita üzerinde tarih bilgisi
- Görüntü kaynağı ve çözünürlük bilgisi
- Bulut ve gölge maskeleri
- Önceki görüntüyle karşılaştırma
- Yan yana karşılaştırma
- Şeffaflık ayarı
- Yakınlaştırma ve tarla sınırına odaklanma

Mobil arayüzde performans için yüksek çözünürlüklü raster görüntüler yerine uygun seviyede önbelleklenmiş tile katmanları kullanılmalıdır.

### FR-04: Bulut ve gölge filtreleme

Sistem aşağıdaki maskeleme işlemlerini desteklemelidir:

- Yoğun bulut maskesi
- Sirüs bulutu maskesi
- Bulut gölgesi maskesi
- Geçersiz piksel maskesi
- Görüntü kenarı veya eksik kapsama maskesi

Her görüntü için aşağıdaki kalite bilgileri tutulmalıdır:

- Toplam bulutluluk oranı
- Tarla içindeki bulutluluk oranı
- Geçerli piksel oranı
- Bulut gölgesi oranı
- Kullanılabilir tarla alanı
- Kalite seviyesi

Önerilen kalite sınıfları:

- **Yüksek:** Geçerli piksel oranı yüzde 85 ve üzeri
- **Orta:** Yüzde 60–84
- **Düşük:** Yüzde 40–59
- **Kullanılamaz:** Yüzde 40’ın altında

Bu değerler yönetici panelinden değiştirilebilir olmalıdır.

### FR-05: Hazır vejetasyon indeksleri

İlk sürümde aşağıdaki indeksler desteklenmelidir:

| İndeks | Temel kullanım | Örnek formül |
|---|---|---|
| NDVI | Genel bitki canlılığı | \((NIR - Red)/(NIR + Red)\) |
| NDRE | Klorofil ve azot stresi | \((NIR - RedEdge)/(NIR + RedEdge)\) |
| MSAVI | Seyrek bitki örtüsünde bitki yoğunluğu | MSAVI formülü |
| RECI | Klorofil yoğunluğu | \((NIR/RedEdge)-1\) |
| NDMI | Bitki su durumu | \((NIR - SWIR)/(NIR + SWIR)\) |
| GNDVI | Yeşil bitki ve azot takibi | \((NIR - Green)/(NIR + Green)\) |
| EVI | Yoğun bitki örtüsünde canlılık | EVI formülü |
| SAVI | Toprak etkisini azaltılmış canlılık | SAVI formülü |
| OSAVI | Düşük bitki örtüsünde analiz | OSAVI formülü |
| VARI | RGB tabanlı bitki canlılığı | VARI formülü |
| NBR | Yanık ve ciddi stres analizi | \((NIR - SWIR2)/(NIR + SWIR2)\) |
| NDWI | Su ve nem takibi | Kaynağa göre tanımlanabilir |

Her indeks için sistemde şunlar bulunmalıdır:

- İndeks adı
- Açıklama
- Kullanılan bantlar
- Formül
- Desteklenen veri kaynakları
- Geçerli değer aralığı
- Renk skalası
- Ürün gelişim aşaması önerileri
- Uyarı eşikleri
- Bilinen sınırlamalar

### FR-06: Gelişim aşamasına göre yorumlama

İndeks sonuçları, kullanıcının seçtiği ürün ve gelişim aşamasıyla ilişkilendirilmelidir.

Örneğin:

- Çıkış dönemi
- Vejetatif gelişim
- Sapa kalkma veya gövde gelişimi
- Çiçeklenme
- Meyve veya dane gelişimi
- Olgunlaşma
- Hasat öncesi dönem

Sistem her aşama için şu bilgileri gösterebilmelidir:

- Beklenen indeks davranışı
- Tipik değer aralığı
- Düşük değerin olası anlamı
- Yüksek değerin olası anlamı
- İzlenmesi gereken ek göstergeler
- Önerilen saha kontrolü

Değer aralıkları kesin teşhis olarak değil, “referans aralık” olarak gösterilmelidir. Aynı ürünün çeşidi, ekim tarihi, toprak yapısı, sulama durumu ve görüntü tarihindeki hava koşulları değerleri değiştirebilir.

### FR-07: Özel indeks tanımlama

Yetkili kullanıcılar özel indeks oluşturabilmelidir.

Özel indeks formunda:

- İndeks adı
- Açıklama
- Formül
- Kullanılan bantlar
- Birim veya değer aralığı
- Uygun ürünler
- Uygun gelişim aşamaları
- Renk skalası
- Uyarı eşikleri
- Yalnızca belirli veri kaynaklarında çalışması
- Aktif/pasif durumu

Formül çalıştırma güvenliği için kullanıcıdan doğrudan kod çalıştırılmamalıdır. Bunun yerine kontrollü bir formül dili kullanılmalıdır.

Örnek:

```text
(NIR - RedEdge1) / (NIR + RedEdge1)
```

Desteklenebilecek fonksiyonlar:

```text
+  -  *  /
min()
max()
abs()
sqrt()
log()
```

Sistem şu kontrolleri yapmalıdır:

- Kullanılmayan bant
- Sıfıra bölme
- Desteklenmeyen operatör
- Geçersiz parantez
- Veri kaynağında bulunmayan bant
- Aşırı değer üretimi
- İşlem zaman aşımı

### FR-08: Zaman serisi ve karşılaştırma

Kullanıcı, bir tarla için indeks değişimini zaman içinde görebilmelidir.

Grafiklerde:

- Tarih
- Ortalama indeks değeri
- Minimum değer
- Maksimum değer
- Standart sapma
- Geçerli piksel oranı
- Önceki görüntüye göre değişim
- Önceki dönem ortalamasına göre değişim

gösterilmelidir.

Kullanıcı şu karşılaştırmaları yapabilmelidir:

- İki tarih arasında
- Aynı tarlanın farklı bölgeleri arasında
- Aynı ürünün farklı tarlaları arasında
- Mevcut sezon ile önceki sezon arasında
- Uydu verisi ile operasyon kayıtları arasında

### FR-09: Bölgesel anomalilerin tespiti

Sistem tarla içinde indeks değerlerini bölgesel olarak analiz etmelidir.

Önerilen yöntemler:

- Grid tabanlı analiz
- Z-score veya benzeri istatistiksel sapma
- Önceki görüntüye göre yüzde değişim
- Komşu piksellere göre sapma
- Tarla ortalamasına göre sapma
- Sürekli tekrar eden düşük değer bölgeleri

Her riskli bölge için:

- Koordinat veya poligon
- Risk seviyesi
- İlgili indeks
- Tespit tarihi
- Değişim oranı
- Güven skoru
- Görüntü kalitesi
- Önerilen saha kontrolü

saklanmalıdır.

### FR-10: Risk bildirimleri

Sistem aşağıdaki risk türlerini desteklemelidir:

- Bitki sağlığında ani düşüş
- NDVI veya NDRE düşüşü
- Bölgesel gelişim farklılığı
- Su stresi göstergesi
- Aşırı nem göstergesi
- Görüntü kalitesinin yetersiz olması
- Uzun süre yeni görüntü alınamaması
- Ürün gelişim aşamasından beklenmeyen indeks davranışı

Bildirim kanalları:

- Uygulama içi bildirim
- Web bildirimleri
- E-posta
- İleride SMS veya WhatsApp entegrasyonu

Bildirim içeriği açık ve eyleme dönük olmalıdır.

Örnek:

> “Kuzey parselinde NDVI değeri son görüntüye göre yüzde 18 azaldı. Görüntü tarihi: 8 Eylül 2026. Önerilen işlem: Bölgeyi saha ziyaretiyle kontrol edin.”

Bildirimlerde mümkünse şu bilgiler bulunmalıdır:

- Tarla adı
- Risk tipi
- Risk seviyesi
- Değişim miktarı
- Görüntü tarihi
- Veri kaynağı
- Görüntü kalitesi
- Haritada görüntüle bağlantısı
- Görev oluştur bağlantısı

### FR-11: Risk eşikleri

Kullanıcı veya yönetici aşağıdaki eşikleri tanımlayabilmelidir:

- Mutlak indeks değeri
- Önceki görüntüye göre yüzde değişim
- Art arda kaç görüntüde görülmesi gerektiği
- Minimum geçerli piksel oranı
- Minimum riskli alan yüzdesi
- Bildirim sıklığı
- Aynı risk için tekrar bildirim süresi

Örnek kural:

```text
NDVI değişimi <= -15%
AND geçerli piksel oranı >= 70%
AND riskli alan >= 10%
AND değişim iki görüntüde ardışık görülürse
THEN yüksek öncelikli uyarı oluştur
```

Tek görüntüdeki ani değişimler, görüntü kalitesi düşükse doğrudan alarm üretmemelidir.

### FR-12: Görev yönetimi entegrasyonu

Uydu riskleri mevcut görev sistemiyle entegre edilmelidir.

Kullanıcı bir risk üzerinden:

- Saha kontrolü görevi
- Sulama kontrolü
- Bitki gelişimi inceleme görevi
- Fotoğraf çekme görevi
- Ziraat mühendisi inceleme görevi
- Numune alma görevi

oluşturabilmelidir.

Oluşturulan göreve otomatik olarak şu bilgiler aktarılmalıdır:

- Tarla
- Riskli alan
- Tespit tarihi
- İlgili indeks
- Değişim oranı
- Uydu görüntüsü
- Harita bağlantısı
- Önerilen açıklama

### FR-13: Çevrimdışı kullanım

Mobil uygulamada aşağıdaki veriler önbelleğe alınmalıdır:

- Son başarılı uydu görüntüsü
- Son indeks özeti
- Son risk bildirimleri
- Tarla poligonu
- Zaman serisi özeti
- Görev bağlantıları

Çevrimdışı durumda kullanıcı:

- Son görüntüyü inceleyebilmeli
- Riskleri görebilmeli
- Saha notu alabilmeli
- Görev taslağı oluşturabilmeli

Yeni uydu analizi için internet bağlantısı gereklidir.

## 7. Önerilen Ekranlar

### 7.1. Tarla izleme özeti

Kartlar:

- Genel sağlık durumu
- Son görüntü tarihi
- Veri kaynağı
- Bulutluluk
- NDVI değişimi
- Aktif risk sayısı
- Son başarılı analiz

### 7.2. Uydu haritası

Kontroller:

- Görüntü / indeks seçimi
- Tarih seçimi
- Veri kaynağı
- Şeffaflık
- Renk skalası
- Bulut maskesi
- Gölge maskesi
- Önceki tarihle karşılaştırma
- Riskli bölgeleri göster
- Görev oluştur

### 7.3. Zaman serisi

- İndeks grafiği
- Tarih aralığı seçimi
- Ürün gelişim aşaması işaretleri
- Ekim tarihi
- Gübreleme ve sulama tarihleri
- İlaçlama kayıtları
- Hasat tarihi
- Anomali işaretleri

### 7.4. Risk merkezi

Riskler şu filtrelerle listelenmelidir:

- Tarla
- Risk seviyesi
- Risk tipi
- Tarih
- Durum
- Atanan kullanıcı

Risk durumları:

- Yeni
- İnceleniyor
- Saha kontrolü gerekli
- Doğrulandı
- Yanlış alarm
- Çözüldü
- Arşivlendi

### 7.5. İndeks kütüphanesi

Her indeks için:

- Görsel açıklama
- Formül
- Kullanım amacı
- Uygun ürün aşamaları
- Referans aralıklar
- Veri kaynağı desteği
- Sınırlamalar

### 7.6. Bildirim ayarları

Kullanıcı:

- Hangi tarlaları takip edeceğini
- Hangi indeksleri kullanacağını
- Hangi risk seviyelerinde bildirim alacağını
- E-posta alıp almayacağını
- Bildirim sıklığını
- Sessiz saatleri

belirleyebilmelidir.

## 8. Teknik Mimari

Mevcut sistemle uyumlu önerilen akış:

```text
Uydu Veri Sağlayıcıları
        ↓
Veri Alma Servisi
        ↓
Görüntü ve Metadata Depolama
        ↓
Bulut / Gölge Maskeleme
        ↓
Raster İşleme ve İndeks Hesaplama
        ↓
Kalite Kontrol
        ↓
Zaman Serisi ve Anomali Analizi
        ↓
Risk Motoru
        ↓
Web / Mobil / E-posta Bildirimleri
```

### Önerilen bileşenler

- Next.js 15 web portalı
- Expo / React Native mobil uygulama
- Payload CMS v3
- Postgres / PostGIS
- Raster metadata ve analiz sonuçları için PostGIS raster veya uyumlu raster depolama
- Tile servis katmanı
- Nesne depolama
- Background job worker
- Cron veya event-driven processing
- E-posta bildirim servisi
- Mevcut `eh_fields_sync` olay mekanizması

Uydu veri işleme, kullanıcı isteği sırasında yapılmamalıdır. Ağır işlemler arka plan görevleri olarak çalıştırılmalıdır.

## 9. Veri Modeli

### SatelliteSource

```text
id
name
provider
resolution
availableBands
licenseType
status
createdAt
updatedAt
```

### SatelliteScene

```text
id
sourceId
sceneIdentifier
captureDate
processingDate
coverageGeometry
fieldCoveragePercent
cloudPercent
cirrusPercent
cloudShadowPercent
validPixelPercent
qualityLevel
storageReference
processingStatus
errorMessage
createdAt
```

### FieldMonitoringConfig

```text
id
fieldId
cropId
active
preferredSource
preferredIndices
maxCloudPercent
minValidPixelPercent
alertEnabled
emailEnabled
notificationFrequency
createdAt
updatedAt
```

### IndexDefinition

```text
id
code
name
description
formula
requiredBands
supportedSources
valueMin
valueMax
colorRamp
cropStages
isSystemDefined
isActive
createdAt
updatedAt
```

### IndexResult

```text
id
fieldId
sceneId
indexDefinitionId
meanValue
minValue
maxValue
standardDeviation
validPixelPercent
rasterReference
statistics
createdAt
```

### FieldAnomaly

```text
id
fieldId
indexResultId
geometry
riskType
riskLevel
changePercent
confidenceScore
explanation
status
detectedAt
resolvedAt
```

### MonitoringAlert

```text
id
fieldId
anomalyId
channel
recipientId
title
message
status
sentAt
readAt
createdAt
```

### CustomIndexDefinition

```text
id
createdBy
name
formula
requiredBands
supportedSources
validationStatus
isActive
createdAt
updatedAt
```

## 10. API Gereksinimleri

### Görüntü sorgulama

```http
GET /api/fields/{fieldId}/satellite-scenes
```

Parametreler:

```text
from
to
source
maxCloudPercent
quality
```

### İndeks sonucu

```http
GET /api/fields/{fieldId}/indices/{indexCode}
```

Parametreler:

```text
from
to
sceneId
stage
```

### Zaman serisi

```http
GET /api/fields/{fieldId}/monitoring/timeseries
```

### Harita katmanı

```http
GET /api/fields/{fieldId}/monitoring/tiles/{layerId}/{z}/{x}/{y}
```

### Riskler

```http
GET /api/fields/{fieldId}/monitoring/anomalies
```

### Özel indeks

```http
POST /api/monitoring/custom-indices
```

### Riskten görev oluşturma

```http
POST /api/monitoring/anomalies/{anomalyId}/create-task
```

### Manuel analiz başlatma

```http
POST /api/fields/{fieldId}/monitoring/analyze
```

Manuel analiz isteği kuyruğa alınmalı ve kullanıcıya işlem durumu gösterilmelidir:

- Bekliyor
- İndiriliyor
- İşleniyor
- İndeks hesaplanıyor
- Risk analizi yapılıyor
- Tamamlandı
- Hata oluştu

## 11. İşleme ve Güncelleme Stratejisi

“Günlük güncelleme” ürün hedefi olarak korunabilir; ancak kullanıcı arayüzünde bunun “uygun veri bulunduğunda günlük kontrol” şeklinde ifade edilmesi daha doğru olur.

Sistem:

1. Günde en az bir kez yeni görüntü kontrolü yapar.
2. Yeni görüntü varsa indirme kuyruğuna ekler.
3. Tarla poligonlarını keser.
4. Bulut ve gölge maskelerini uygular.
5. İndeksleri hesaplar.
6. Kalite kontrolü yapar.
7. Zaman serisini günceller.
8. Risk kurallarını çalıştırır.
9. Gerekli bildirimleri gönderir.

Görüntü alınamayan günlerde sistem kullanıcıya risk alarmı göndermemeli; bunun yerine ayrı bir “veri güncellemesi yok” bilgilendirmesi gösterebilmelidir.

## 12. Risk Seviyeleri

| Seviye | Anlam | Önerilen aksiyon |
|---|---|---|
| Bilgi | Küçük veya izlenmesi gereken değişim | İzlemeye devam et |
| Düşük | Normalden sapma başlangıcı | Sonraki görüntüyü bekle veya kontrol planla |
| Orta | Belirgin bölgesel veya zamansal değişim | Saha kontrolü oluştur |
| Yüksek | Ani ve geniş alanlı değişim | Öncelikli saha kontrolü |
| Kritik | Güçlü değişim, tekrarlı anomali veya ciddi veri göstergesi | Ziraat mühendisi incelemesi |

Risk seviyesi yalnızca indeks değerine değil, aşağıdaki bileşenlere göre belirlenmelidir:

- Değişimin büyüklüğü
- Etkilenen alan
- Değişimin sürekliliği
- Görüntü kalitesi
- Ürünün gelişim aşaması
- Hava durumu
- Son operasyon kayıtları

## 13. Hava Durumu ve Görev Modülüyle Entegrasyon

Uydu bulguları mevcut hava durumu modülüyle birleştirilebilir.

Örnek:

- NDMI düşüşü + yağış yokluğu → su stresi riski
- NDVI düşüşü + aşırı sıcaklık → sıcaklık stresi olasılığı
- Düşük indeks + yoğun yağış → su baskını veya kök bölgesi problemi kontrolü
- NDRE düşüşü + gübreleme yapılmamış olması → besin stresi incelemesi
- Bitki sağlığı düşüşü + rüzgâr → fiziksel hasar kontrolü

Bu kombinasyonlar kesin teşhis olarak sunulmamalıdır. Arayüzde:

> “Bu kombinasyon su stresiyle uyumlu olabilir. Saha kontrolü önerilir.”

gibi olasılıksal metinler kullanılmalıdır.

## 14. Bildirim Kuralları

Bildirimlerin gereksiz tekrar üretmesini önlemek için:

- Aynı risk 24 saat içinde tekrar gönderilmemelidir.
- Düşük riskler gruplanabilmelidir.
- Kullanıcı tarla bazında bildirimleri kapatabilmelidir.
- Kalitesi düşük görüntüler otomatik risk üretmemelidir.
- Kullanıcı “yanlış alarm” işaretlediğinde benzer bildirimlerin sıklığı azaltılabilmelidir.
- Kritik bildirimler okunmadıysa belirlenen süreden sonra yeniden gösterilebilmelidir.

## 15. Non-Functional Requirements

### Performans

- Tarla özet ekranı 3 saniye içinde açılmalı.
- Hazır tile katmanı 2 saniye içinde görüntülenmeli.
- Zaman serisi 5 saniye içinde gösterilmeli.
- Uzun süren raster analizleri arka planda yürütülmeli.
- Mobil uygulama son başarılı sonucu çevrimdışı açabilmeli.

### Güvenilirlik

- İşleme görevleri tekrar çalıştırılabilir olmalı.
- Başarısız veri alımlarında retry mekanizması bulunmalı.
- Aynı sahne ikinci kez işlenmemeli.
- Tüm işlemler izlenebilir log üretmeli.
- Sağlayıcı erişim kesintileri kullanıcıya anlaşılır şekilde gösterilmeli.

### Güvenlik

- Kullanıcı yalnızca yetkili olduğu tarlaları görebilmeli.
- Özel indeksler kullanıcı veya organizasyon seviyesinde izole edilmeli.
- Formül değerlendirme sandbox içinde çalışmalı.
- Uydu sağlayıcı anahtarları istemciye gönderilmemeli.
- E-posta alıcıları ve bildirim ayarları yetkilendirilmelidir.

### Ölçeklenebilirlik

- Aynı anda binlerce tarla için toplu işlem desteklenmeli.
- İşleme kuyruğu önceliklendirme yapabilmeli.
- PlanetScope gibi ücretli veri kaynaklarında kota takibi yapılmalı.
- Kullanıcı bazlı ve organizasyon bazlı kullanım sınırları tanımlanabilmeli.

## 16. MVP Kapsamı

İlk sürümde aşağıdakiler yeterlidir:

1. Mevcut tarla poligonlarını kullanma
2. Sentinel-2 entegrasyonu
3. PlanetScope entegrasyonuna hazır sağlayıcı mimarisi
4. Görüntü tarihi ve bulutluluk filtresi
5. Bulut ve gölge maskesi
6. NDVI, NDRE, MSAVI, RECI ve NDMI
7. Harita katmanı gösterimi
8. Tarla ortalama indeks değeri
9. Basit zaman serisi
10. Tarla ortalamasında ani değişim tespiti
11. Uygulama içi bildirim
12. E-posta bildirimi
13. Riskten görev oluşturma
14. Son görüntüyü mobilde önbelleğe alma
15. Sistem yöneticisi tarafından eşik tanımlama

## 17. İkinci Faz

- PlanetScope yüksek çözünürlüklü görüntüler
- Tarla içi bölgesel anomali haritası
- Özel indeks oluşturucu
- Ürün gelişim aşamasına göre referans aralıklar
- Geçmiş sezon karşılaştırması
- Operasyonlarla indeks değişimi korelasyonu
- Toplu tarla analizi
- PDF ve Excel raporları
- Ziraat mühendisi çalışma alanı
- Kullanıcı tarafından etiketlenen anomalilerle kural iyileştirme

## 18. Üçüncü Faz

- Makine öğrenmesiyle anomali tahmini
- Ürün ve gelişim aşaması otomatik önerisi
- Hastalık ve zararlı risk modeli
- Drone görüntüsü entegrasyonu
- Bitki sayımı ve sıra analizi
- Verim tahmini
- API üzerinden kurumsal entegrasyon
- Çoklu işletme ve bayi yönetimi

## 19. Kabul Kriterleri

### Görüntüleme

- Kullanıcı mevcut bir tarlayı seçtiğinde uygun uydu görüntülerini görebilmeli.
- Görüntü tarihi, veri kaynağı, çözünürlük ve bulutluluk gösterilmeli.
- Tarla poligonu görüntü üzerinde doğru yerde görünmeli.
- Kullanıcı görüntü ve indeks katmanı arasında geçiş yapabilmeli.

### Filtreleme

- Bulutlu alanlar maskelenmeli.
- Bulut gölgeleri mümkün olduğunca analiz dışında bırakılmalı.
- Kullanıcı görüntünün geçerli piksel oranını görebilmeli.
- Düşük kaliteli görüntüler açıkça etiketlenmeli.

### İndeksler

- NDVI ve diğer MVP indeksleri hesaplanmalı.
- Harita üzerinde renk skalası bulunmalı.
- Tarla ortalama, minimum ve maksimum değerleri gösterilmeli.
- İndeks zaman serisi görüntülenebilmeli.

### Riskler

- Belirlenen eşik aşıldığında risk oluşturulmalı.
- Düşük kaliteli veri yanlış alarm üretmemeli.
- Risk harita üzerinde gösterilmeli.
- Kullanıcı riskten görev oluşturabilmeli.
- Bildirimler tekrar tekrar gönderilmemeli.

### Mobil

- Son analiz sonucu internet olmadan açılabilmeli.
- Mobil haritada tarla ve riskli alan görüntülenebilmeli.
- Kullanıcı çevrimdışı saha notu oluşturabilmeli.
- Bağlantı geldiğinde not ve görev senkronize edilmeli.

## 20. Başarı Metrikleri

### Kullanım metrikleri

- İzlemeyi etkinleştiren tarla oranı
- Haftalık aktif izleme kullanıcıları
- Tarla başına incelenen görüntü sayısı
- İndeks haritası görüntüleme oranı
- Risk ekranı görüntüleme oranı

### Operasyon metrikleri

- Oluşturulan saha kontrolü görevi sayısı
- Riskten göreve dönüşüm oranı
- Riskin incelenme süresi
- Kullanıcı tarafından doğrulanan risk oranı
- Yanlış alarm oranı

### Sistem metrikleri

- Yeni görüntünün işlenme süresi
- Görüntü işleme başarı oranı
- Ortalama harita açılma süresi
- Bildirim teslim oranı
- Uydu sağlayıcı hata oranı
- Geçerli piksel oranı

### Ürün değeri metrikleri

- Saha ziyaretlerinde azalma veya daha iyi hedefleme
- Kullanıcıların erken tespit ettiğini belirttiği sorun sayısı
- Uydu izleme özelliğini kullanan tarlalarda görev tamamlama oranı
- Kullanıcı memnuniyeti
- Yenileme veya ücretli plan dönüşüm oranı

## 21. Önemli Ürün Kararları

1. “Günlük görüntü” ifadesi, her gün kesinlikle yeni görüntü varmış gibi sunulmamalıdır. Sistem uygun görüntü bulunduğunda güncelleme yapmalıdır.
2. Sentinel-2 ve PlanetScope çözünürlükleri arayüzde birbirinden ayrılmalıdır.
3. Bulut maskesi uygulanmış olması, görüntünün tamamen hatasız olduğu anlamına gelmez.
4. İndeks değerleri ürün, çeşit, tarih, sensör ve hava koşullarına göre değişebilir.
5. Risk bildirimleri kesin hastalık veya gübre eksikliği teşhisi gibi sunulmamalıdır.
6. Ücretli veri kaynaklarında kota, lisans ve kullanım maliyeti ayrıca takip edilmelidir.
7. Uydu analizleri mevcut görev yönetiminden bağımsız bir ekran olmamalı; riskten doğrudan saha görevi oluşturulabilmelidir.
8. İlk sürümde tüm gelişmiş analizler yerine güvenilir veri kalitesi, NDVI zaman serisi ve anlaşılır risk bildirimleri önceliklendirilmelidir.

## 22. Örnek Kullanıcı Hikâyeleri

- Bir çiftçi olarak, tarlamın son uydu görüntüsünü görmek istiyorum; böylece sahaya gitmeden genel durumu kontrol edebileyim.
- Bir çiftçi olarak, bitki sağlığında önemli bir düşüş olduğunda bildirim almak istiyorum; böylece zamanında saha kontrolü yapabileyim.
- Bir ziraat mühendisi olarak, NDVI ve NDRE değişimini birlikte incelemek istiyorum; böylece stresin muhtemel nedenini daha iyi değerlendirebileyim.
- Bir kullanıcı olarak, aynı tarlanın iki farklı tarihini karşılaştırmak istiyorum; böylece operasyonların etkisini izleyebileyim.
- Bir kullanıcı olarak, riskli bölgeden saha görevi oluşturmak istiyorum; böylece problemi takip edilebilir bir operasyona dönüştürebileyim.
- Bir yönetici olarak, farklı tarlaları risk seviyesine göre sıralamak istiyorum; böylece ekipleri öncelikli bölgelere yönlendirebileyim.
- Bir uzman kullanıcı olarak, kendi indeks formülümü tanımlamak istiyorum; böylece işletmeme özel analizler yapabileyim.

Bu PRD’nin temel MVP önerisi şudur: **Önce güvenilir uydu veri alma, kalite kontrolü, NDVI/NDRE zaman serisi ve anlaşılır risk bildirimleri kurulmalı; özel indeksler, gelişmiş bölgesel analizler ve makine öğrenmesi sonraki fazlara bırakılmalıdır.**
