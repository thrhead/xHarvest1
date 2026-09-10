# Technical Context

## Core Technologies
- **Languages**: TypeScript, SQL (SQLite / LibSQL).
- **CMS & Web Framework**: Next.js 15.1.0, React 19.0.0, Payload CMS 3.86.0.
- **Database & Persistence**:
  - CMS: `@payloadcms/db-sqlite` with `@libsql/client` (`file:./ekim-hasat.db`).
  - Mobile App: Firebase Firestore with offline persistence support.
  - Client Web Sync: Browser `localStorage` (`eh_web_fields`, `eh_web_plantings`, `eh_web_records`, `eh_web_stocks`) combined with DOM `CustomEvent` bus (`eh_fields_sync`).
- **Mobile Framework**: Expo / React Native 0.76 with TypeScript, React Navigation, Vector Icons, and Haptics.
- **Mapping & Geospatial**: Leaflet & OpenStreetMap (via dynamic client import in web dashboard and simulator).
- **Geospatial & Spatial Indexing**:
  - Point-in-Polygon (Ray-Casting Algorithm) & Haversine formula implemented in pure TypeScript (`regionDb.ts`).
  - Pre-indexed Bounding Boxes (`minLat, maxLat, minLng, maxLng`) for 81 Turkish provinces and agricultural basins.
  - Endpoints: `GET /api/regions`, `POST /api/regions/resolve`, `GET /api/stats/by-region`.
  - **Faz 2 Spatial Grid**: 10m x 10m parcel cell discretization and Z-score anomaly detector (`/api/monitoring/grid-anomalies`).
- **Satellite Monitoring & Faz 2 Analytical Stack**:
  - `satelliteDb.ts`: SQLite schema and data access layer (scenes, indices, timeseries, anomalies, tasks).
  - Faz 2 Schemas: `custom_indices`, `crop_phenology_benchmarks`, `field_zone_grids`, and `field_anomalies.feedbackStatus`.
  - Safe Mathematical Parser: AST-based tokenization without `eval()` for custom user formulas (`CustomIndexEvaluator`).
  - Print/PDF & Tabular Engine: Client-side CSS print media stylesheets and RFC 4180 compliant CSV stream generation.
  - REST Endpoints: `/api/monitoring/custom-indices`, `/api/monitoring/grid-anomalies`, `/api/monitoring/portfolio-summary`, `/api/monitoring/anomalies/feedback`.
- **Weather Services**: Open-Meteo REST API (`api.open-meteo.com/v1/forecast`) for 14-day forecasts.
- **Styling**: Tailwind CSS v4, Lucide React Icons, Radix UI primitives.

## Environment Constraints
- **Cloud Container Runtime**: Port 3000 exposed via Nginx reverse proxy.
- **Build Configuration**: Next.js App Router with `export const dynamic = 'force-dynamic'` for live data views.
- **Package Management**: Monorepo structure with root workspace and sub-packages (`cms`, `mobile`).

## Key Dependencies & Integrations
- `@payloadcms/next`, `@payloadcms/db-sqlite`, `@payloadcms/richtext-lexical`
- `next`, `react`, `react-dom`
- `leaflet`, `lucide-react`, `recharts`
- `firebase`, `expo-location`, `expo-notifications`

## Agent Skills
- **`systematic-debugging`**: Root-cause tracing, test isolation, and race-condition resolution.
- **`ui-ux-pro-max`**: Design intelligence, responsive layouts, color harmony, and accessible typography.

