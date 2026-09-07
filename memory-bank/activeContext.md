# Active Context

## Current Work Focus
- Implementing the **Otomatik Bölge Atama & TÜİK Entegrasyonu** (Automatic Region Assignment PRD v1.1) across Web CMS and Mobile Expo application.
- Ensuring robust bi-directional data synchronization between the Web Dashboard (`DashboardView.tsx`) and Expo React Native mobile client (`/mobile`).
- Real-time event-driven state updates across planting records, spraying/fertilizing application logs, parcel polygons, and regional boundaries.

## Architecture Decisions (PRD Decision Log: 2026-09-07)
1. **TÜİK Scope**: Phase 1 includes official centroid coordinates, bounding boxes, and TÜİK codes for all **81 provinces**. District (`tuik_ilce`) hierarchy schema is prepared from Day 1 for Phase 5.
2. **Dashboard Placement**: Dedicated **[📊 Bölge İstatistikleri]** tab added to `DashboardView.tsx` navigation alongside Saha Haritası, Saha Görevleri & Defter, and Takvim & Ajanda.
3. **Primary vs Secondary Tagging**: **TÜİK İl** serves as the primary standard administrative region; **Tarımsal Havza / Bölge** serves as the secondary agronomical context (e.g. `📍 Adana (Çukurova Havzası)`).
4. **Scope Isolation**: Scope applies strictly to Web CMS (`InteractiveMap.tsx`, `DashboardView.tsx`, Payload Backend) and Expo Mobile App (`add-field.tsx`, `appStore.ts`, `firebase.ts`). `MobileSimulator.tsx` is strictly excluded.

## Recent Architectural & Feature Fixes
1. **Mobile Tasks & Calendar UX Reorganization (De-cluttering & Agenda Architecture)**:
   - **Eliminated Duplicate Views**: Previously, both the "Görevler" (Tasks) tab and the "Takvim" (Calendar) tab listed all tasks vertically in an identical, cluttered manner.
   - **Restructured Mobile Calendar (`calendar.tsx`)**: Transformed the calendar into a focused, date-driven agricultural agenda featuring:
     - Interactive 7-day timeline strip with day-level task counter badges.
     - Time-scope filter buttons: `[Gün]` (Day), `[Bu Hafta]` (This Week), `[Bu Ay]` (This Month), and `[Tümü]` (All).
     - Clean agenda cards displaying operation icon, time, parcel name, and quick completion toggles.
     - Direct CTA link to the comprehensive task management view.
   - **Restructured Mobile & Web Tasks View (`tasks.tsx` & `DashboardView.tsx`)**: Introduced dynamic grouping with a 4-mode segmented switcher:
     - `🗓️ Zamana Göre (Timeline)`: Groups tasks into Delay/Weather alerts, Today/Upcoming, Future plans, and Completed.
     - `📍 Tarlaya Göre (By Field)`: Organizes tasks parcel by parcel so field visits can be handled sequentially with area metrics.
     - `🏷️ İşleme Göre (By Type)`: Categorizes tasks into Spraying, Fertilizing, Irrigation, Planting, and Harvesting.
     - `🌱 Ürüne Göre (By Crop)`: Aggregates tasks by agricultural crop (e.g. Elma, Salatalık, Domates, Zeytin) across parcels with crop-specific progress.
     - Compact card layout with high visual density, clear type badges, status pills, and one-tap completion circles.
   - **Intelligent Crop Resolution**: Resolved issue where default parcel types masked active planting records; tasks and calendar now display true active crop names hierarchically.

## 5-Phase Technical Implementation Plan (Otomatik Bölge Atama & TÜİK)
- **FAZ 1: Veritabanı Modeli, Payload CMS & TÜİK 81 İl Seed Altyapısı**
  - `Regions` koleksiyonu (`name`, `slug`, `centerLat`, `centerLng`, `boundary`, `source: 'tuik_il' | 'manual' | 'tuik_ilce'`, `tuikCode`, `parent`, `isActive`).
  - `fields` tablosuna ve Payload `Fields` koleksiyonuna `region_id` ve `region_name` alanlarının güvenli alter/migration ile eklenmesi.
  - 81 il + 6 tarımsal havza seed verisi ve eski tarlalar için otomatik centroid backfill.
- **FAZ 2: Backend API & Çözümleme (Resolve) Motoru**
  - `POST /api/regions/resolve`: Point-in-Polygon (Ray Casting), BBox ve Haversine algoritmalarıyla Primary (TÜİK İl) + Secondary (Tarımsal Havza) tespiti.
  - `GET /api/regions`: Aktif bölgeleri listeleyen hafif endpoint (`includeBoundary=false`).
  - `GET /api/stats/by-region`: Bölge bazlı dönüm, tarla, ürün ve görev istatistik agregasyonu.
- **FAZ 3: Web Arayüzü Geliştirmeleri (Harita & İstatistik Sekmesi)**
  - `InteractiveMap.tsx`: Hardcoded 6'lı liste yerine dinamik bölge seçimi; haritada poligon çizildiğinde otomatik `resolve` rozeti önerisi.
  - `DashboardView.tsx`: Üst navigasyona 4. sekme **[📊 Bölge İstatistikleri]** (bölge bazlı dönüm/ürün grafikleri, görev yoğunluğu, zoom-to-region). Tarla listesinde Bölge sütunu.
- **FAZ 4: Mobil Uygulama Geliştirmeleri (Expo)**
  - `mobile/src/types/index.ts` & `firebase.ts`: `Region` modeli ve `resolveRegion` API servisleri + AsyncStorage çevrimdışı önbellekleme.
  - `mobile/app/add-field.tsx`: GPS veya nokta seçiminde otomatik bölge öneri rozeti (`📍 Adana (Çukurova)`).
  - Mobil parsel kartlarında ve detayında bölge rozeti gösterimi.
- **FAZ 5: Doğrulama, Test Senaryoları & Kabul Kriterleri**
  - Adana, Konya, İzmir, Edirne koordinat doğruluk testleri.
  - Çevrimdışı ve sınır noktası fallback testleri.
  - Web & Mobil veri senkronizasyonunun (`eh_fields_sync`) ve `compile_applet` / `lint_applet` testlerinin eksiksiz geçirilmesi.
2. **Web <-> Mobile Planting Records Synchronization**:
   - Web `DashboardView.tsx` now writes planting additions directly to `localStorage['eh_web_plantings']` and broadcasts `eh_fields_sync` custom events with `{ source: 'web', plantings }`.
   - `MobileSimulator.tsx` accepts `plantingRecords` as props and renders them seamlessly inside the Mobile Calendar view ("Ekim -> Hasat Planı") alongside field-level crops.
   - Mobile service layer (`/mobile/src/services/firebase.ts`) synchronizes `eh_web_plantings` into `targetDemo.crops` upon start and focus events.
2. **Mobile Simulator Task to Web Log Dispatch**:
   - Tasks created in `MobileSimulator.tsx` (especially spraying and fertilizing) now automatically trigger `onAddWebRecord`, creating live application records in the Web Portal's `webRecords` state without page reloads.
3. **Clean Slate / Zero Synthetic Data**:
   - Removed pre-seeded mock tasks (`t-1` to `t-6`) and mock application logs (`log1`, `log2`) from initial simulator and demo states so farmers manage only authentic tasks.
4. **Event-Driven Reactive Sync Architecture**:
   - Replaced continuous 5-second `setInterval` polling in `DashboardView.tsx` with targeted event listeners on `window` (`focus`, `storage`, `eh_fields_sync`), reducing CPU/memory footprint and preventing UI race conditions.
5. **Enhanced Task Types & User Feedback**:
   - Expanded mobile task categories to include: İlaçlama (Spraying), Gübreleme (Fertilizing), Sulama (Irrigation), Ekim/Dikim (Planting), Hasat (Harvesting), and Bakım/Çapa (Maintenance).
   - Added user confirmation alert dialogs on task creation and planting schedule registration.
6. **Dev Server & Next.js 15 App Router Hardening**:
   - Resolved Next.js 15 prerendering 404 boundary issue by removing nested `<html>`/`<body>` elements from `cms/src/app/(frontend)/not-found.tsx`.
   - Deleted defunct `/api/test-route-data` endpoint that previously blocked builds.
   - Configured `page.tsx` with `export const dynamic = 'force-dynamic'` for server/client synchronization.
   - Verified that `compile_applet` and `lint_applet` run completely green.

## Active Decisions & Considerations
- **Storage Keys**:
  - `eh_web_fields`: Parcel boundaries, decares, coordinates, and crop assignments.
  - `eh_web_plantings`: Active planting schedules with crop templates and target harvest dates.
  - `eh_web_records`: Application logs for spraying, fertilizing, and treatments.
  - `eh_web_stocks`: Seed and chemical inventory tracking.
- **Event Channel**: `CustomEvent('eh_fields_sync', { detail: { source, fields, plantings } })` provides sub-millisecond local tab synchronization.

## Next Steps
1. Monitor live webhook performance on `/api/cron/weather-adjust` with production Open-Meteo forecasts.
2. Expand crop templates in Payload CMS (`/admin`) for regional varieties (e.g. Pamuk, Zeytin, Mısır).

