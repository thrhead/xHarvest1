# Active Context

## Current Work Focus
- **Uydu Verileriyle Uzaktan Tarla İzleme (Remote Field Monitoring - PRD v1.0)**:
  - **FAZ 1 (MVP) & Görsel Katmanlar — TAMAMLANDI & DOĞRULANDI**:
    - **Tarla Sınırları & Koordinat Normalizasyonu**: `InteractiveMap.tsx` içinde `normalizeCoords` fonksiyonu ile tüm koordinat varyasyonları güvenceye alındı; poligon kaybolma sorunu tamamen çözüldü.
    - **Yüksek Çözünürlüklü Uydu Altlığı**: Esri World Imagery entegre edildi (`🛰️ Uydu` / `🗺️ Sokak` tek tıkla geçiş).
    - **Spektral Vejetasyon Isı Haritası (NDVI / NDMI)**: Beyaz sınır konturları, tarla içi vejetasyon renk skalası, parsel merkezinde yüzen canlılık etiketi (`0.85 NDVI`) ve EOSDA / OneSoil stili renk göstergesi (Legend) aktif.
    - **Müstakil Uydu İzleme Haritası (`SatelliteMapViewer.tsx`)**: Opacity slider (%0-%100), ham uydu / vejetasyon katmanı kıyası, animasyonlu anomali pini (`⚠️ -18% Seyrelme`) eklendi.
    - **Hata Düzeltmeleri**: `Uncaught ReferenceError: activeField is not defined` ve `Encountered two children with the same key ... records.tasks` sorunları giderildi.
    - **Tüm Temel MVP Bileşenleri**: SQLite şeması (7 tablo), Sentinel-2 Adaptörü (`satelliteProvider.ts`), 5 REST API uç noktası, Web CMS sekmesi (`SatelliteMonitoringComponent.tsx`) ve Mobil Expo ekranı (`mobile/app/satellite.tsx`) devrede.

  - **FAZ 2: İKİNCİ FAZ (Gelişmiş Analitik, Özel İndeksler & Ziraat Operasyonları) — TAMAMLANDI & DOĞRULANDI**:
    - **Özel İndeks Formül Editörü (Custom Index Builder)**: Kullanıcı tanımlı matematiksel formüller (`(NIR - RedEdge) / (NIR + RedEdge)`), güvenli AST parser (`customIndexEvaluator.ts`), test önizleme ve REST API entegre edildi.
    - **Tarla İçi Grid Tabanlı Bölgesel Anomali Haritası**: 10m Sentinel-2 hücreleri, Z-Score istatistiksel varyans haritası ve mikro hücre seçici `SatelliteMapViewer.tsx` içine yerleştirildi.
    - **Fenolojik Evre Benchmark Kartı**: Ürün tipine göre beklenen NDVI referans aralığı, fenolojik evre takibi ve durum analizi (`CropPhenologyBenchmarkCard.tsx`) canlıya alındı.
    - **Toplu Tarla Portföy Sağlık Paneli**: Kritik riskteki parsellerin tespiti, acil görev açma ve CSV dışa aktarımı (`PortfolioHealthDashboard.tsx`) tamamlandı; ticari PlanetScope kota kutusu kullanıcı talebiyle arayüzden kaldırıldı.
    - **Anomali Geri Bildirim Döngüsü (Ground-Truth Feedback)**: Kullanıcıların anomalileri "Doğrulandı" veya "Yanlış Alarm" olarak etiketlemesi sağlandı.
    - **Tüm Dashboard Entegrasyonu & Sıfır Hata**: `satellite-monitoring-component.tsx` içerisinde iki ana sekme (Parsel İzleme / Portföy Sıralaması), özel indeks butonları ve modal tetikleyicisi bağlandı; `compile_applet` ile doğrulandı.

## Key Technical Decisions (Faz 2 Mimari Kararları - 2026-09-08)
1. **Piksel/Grid Tabanlı Bölgesel Analiz Mimarisi**:
   - Parsel poligonu içine 10m x 10m Sentinel-2 hücrelerine karşılık gelen sanal grid matrisi (`ZoneCell[][]`) yerleştirilir.
   - Her hücre için Z-score (`(x - μ) / σ`) hesaplanarak tarla içi heterojenlik (örneğin kuzeybatıdaki sulama yetersizliği veya drenaj göllenmesi) görsel hücrelerle haritada vurgulanır.
2. **Güvenli Özel İndeks Formül Değerlendiricisi**:
   - İstemci veya sunucuda `eval()` kesinlikle kullanılmaz.
   - Formüller tokenize edilir; izin verilen token'lar yalnızca spektral bant değişkenleri (`NIR`, `RED`, `GREEN`, `BLUE`, `REDEDGE`, `SWIR1`, `SWIR2`) ve temel aritmetik operatörlerdir (`+`, `-`, `*`, `/`, `(`, `)`).
3. **Çok Yıllı Zaman Serisi Bindirme (Multi-Year Overlay)**:
   - Farklı yılların gün ve ay değerleri ortak bir `DayOfYear (1-365)` indeksine normalize edilerek Recharts üzerinde `2024 (Kesikli Gri)`, `2025 (Mavi)`, `2026 (Koyu Yeşil)` olarak karşılaştırmalı çizdirilir.
4. **Tarla Sağlık Karnesi ve Rapor Dışa Aktarım**:
   - Tarayıcı içi DOM-to-Print / PDF şablonu ve UTF-8 CSV dışa aktarımı oluşturulur.
5. **Geri Bildirim Döngüsü (Anomaly Feedback Loop)**:
   - `field_anomalies` tablosuna `feedbackStatus: 'unreviewed' | 'confirmed' | 'false_alarm'` ve `feedbackNotes` eklenir.

---

## Faz 2 Uygulama Adımları (Next Steps)
- **Adım 1**: Faz 2 Veritabanı Genişletmesi (`satelliteDb.ts` içine özel indeksler, fenoloji referansları, tarla karnesi ve anomali geri bildirim tabloları).
- **Adım 2**: Özel İndeks Formül Motoru & API (`/api/monitoring/custom-indices`, güvenli parser).
- **Adım 3**: Grid Tabanlı Tarla İçi Zonal Anomali Haritası (`SatelliteMapViewer.tsx` içine grid hücresi katmanı).
- **Adım 4**: Fenolojik Gelişim Bantları & Çok Yıllı Karşılaştırma Zaman Serisi (`SatelliteMonitoringComponent.tsx`).
- **Adım 5**: Toplu Tarla Risk Paneli (Portfolio Ranking) & Rapor Dışa Aktarım (PDF/Excel).
