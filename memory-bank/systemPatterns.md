# System Patterns

## Architecture Overview

```
┌───────────────────────────┐           ┌───────────────────────────┐
│     Next.js 15 Web        │           │    Expo React Native      │
│     Portal (Dashboard)    │◀─ ─ ─ ─ ─▶│    Mobile App Client      │
│  [🛰️ Uydu İzleme Sekmesi]  │           │   [🛰️ Uydu İzleme Ekranı] │
└─────────────┬─────────────┘           └─────────────┬─────────────┘
              │                                       │
              │  Window CustomEvents ('eh_fields_sync')│
              │  & Shared localStorage State          │
              ▼                                       ▼
┌───────────────────────────┐           ┌───────────────────────────┐
│     Payload CMS v3        │           │     Firebase Firestore    │
│  (Crops, Guides, Sprays)  │           │   (Field Logs, User Auth) │
└─────────────┬─────────────┘           └─────────────┬─────────────┘
              │                                       │
              ├───────────────────────────────────────┤
              ▼                                       ▼
┌───────────────────────────┐           ┌───────────────────────────┐
│   Open-Meteo API          │           │  Uydu Sağlayıcı Adaptörü   │
│ (Hava Durumu / 14 Günlük) │           │ (Sentinel-2 / PlanetScope)│
└───────────────────────────┘           └───────────────────────────┘
```

## Workspace Structure
- `/cms`: Payload CMS v3 on Next.js 15 App Router + SQLite database backend (`@payloadcms/db-sqlite`, `@libsql/client`).
  - `(payload)` route group: Admin panel routes (`/admin`) and API handlers (`/api/[...slug]`).
  - `(frontend)` route group: Web dashboard (`DashboardView.tsx`), modular tabs (`SatelliteMonitoringTab.tsx`), and REST endpoints (`/api/monitoring/*`, `/api/portal-data`, `/api/cron/*`).
- `/mobile`: Expo React Native client application with TypeScript, Vector Icons, Offline Cache, and Firestore services.
- `/backend`: Firebase Cloud Functions for scheduled triggers and weather adjustment.
- `/docs`: Architecture specifications, PRDs, and integration protocols.

## Key Design & Synchronization Patterns

### 1. Event-Driven Bi-directional Sync (`eh_fields_sync`)
- When a field is added or updated, `window.dispatchEvent(new CustomEvent('eh_fields_sync', { detail: { source: 'web', ... } }))` fires.
- Consumers listen via `window.addEventListener('eh_fields_sync', ...)` and update state instantaneously.

### 2. Satellite Provider Adapter Pattern (`SatelliteProvider`)
- Unifies heterogeneous satellite APIs behind a single TypeScript interface:
  - `CopernicusSentinel2Provider`: Connects to Sentinel-2 (Copernicus CDSE / Microsoft Planetary Computer STAC).
  - `PlanetScopeProvider`: Prepared for high-resolution 3m commercial data when API credentials are provided.
  - `SimulatedAnalyticProvider`: Context-aware fallback engine generating realistic reflectance and vegetation index values (NDVI, NDRE, MSAVI, RECI, NDMI) based on real field coordinates, local weather, and phenological crop growth.

### 3. Lightweight SQLite Spatial & Index Architecture
- Replaces heavy C++ PostGIS raster binaries with agile, normalized relational tables:
  - `satellite_sources`: Available satellite providers and resolutions.
  - `satellite_scenes`: Captured scenes with capture date, cloud cover %, valid pixel %, and geometry.
  - `field_monitoring_configs`: Field-level monitoring settings, preferred indices, and alert thresholds.
  - `index_definitions`: Formula metadata and color ramps for NDVI, NDRE, MSAVI, RECI, NDMI.
  - `index_results`: Calculated statistical metrics (mean, min, max, std dev) per field and scene.
  - `field_anomalies`: Flagged anomalies with risk level, change percent, and explanation.
  - `monitoring_alerts`: Dispatched in-app and queued email notifications.

### 4. Anomaly-to-Task Bridge Pattern
- Whenever an anomaly is confirmed (e.g. NDVI drops > 15%), users can convert it into an actionable field task with one click (`/api/monitoring/create-task`).
- Creates a structured task in the `tasks` table with type `inspection`, status `pending`, and pre-filled agronomic recommendations.

### 5. Hierarchical Region Resolution Engine (`/api/regions/resolve` & `regionDb.ts`)
- Two-tier matching logic: Evaluates Bounding Box + Ray-Casting Point-in-Polygon against official TÜİK boundaries.

### 6. Weather Adjustment Rule Engine (`/api/cron/weather-adjust`)
- Triggered periodically with `CRON_SECRET` authorization.
- Reschedules pesticide and fertilizer tasks if rain or high wind is forecasted within 14 days.

### 7. Faz 2: Spatial Grid-Cell Zonal Decomposition Pattern (`field_zone_grids`)
- Splits a parcel polygon into deterministic 10m x 10m micro-cells using bounding-box ray-casting.
- Calculates intra-field statistical variance:
  $$\text{Z-Score} = \frac{v_{cell} - \mu_{field}}{\sigma_{field}}$$
- Flags micro-zones where $Z < -1.5$ as localized stress clusters (irrigation leak, compaction, or pest patch) directly visible on the Leaflet map overlay.

### 8. Faz 2: Safe Mathematical Formula Sandbox (`CustomIndexEvaluator`)
- Compiles user-defined spectral formulas without invoking Javascript `eval()` or `Function()`.
- Validates tokens via regex tokenizer against a strict whitelist:
  - Bands: `NIR`, `RED`, `GREEN`, `BLUE`, `REDEDGE`, `SWIR1`, `SWIR2`
  - Operators: `+`, `-`, `*`, `/`, `(`, `)`
- Evaluates Polish Notation / Shunting-yard expression tree safely in client or server.

### 9. Faz 2: Multi-Year & Phenology Envelope Model
- Normalizes disparate calendar years (2024, 2025, 2026) to a continuous `DayOfYear (1..365)` axis.
- Computes expected developmental boundaries based on crop type and phenological stages (fide, vejetatif, çiçeklenme, olgunlaşma) to render confidence interval bands behind the current season's curve.
- Correlates field operations (irrigation, fertilization, spraying) with instant marker pins on the curve.

### 10. Faz 2: Portfolio Multi-Field Ranking & Report Export Pipeline
- Aggregates all registered parcels into a unified Fleet Risk Table sorted by:
  $$\text{Priority} = w_1 \cdot \text{AnomalySeverity} + w_2 \cdot (1 - \text{NDVI}_{current}) + w_3 \cdot \text{DaysSinceLastScan}$$
- Generates print-ready CSS Tarla Sağlık Karnesi (A4 PDF) and raw timeseries CSV streams with zero external heavy binary dependencies.
