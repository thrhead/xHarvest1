# System Patterns

## Architecture Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  React Native   │────▶│   Firebase       │◀────│  Payload CMS    │
│  (Expo)         │     │  Auth + Firestore │     │  (İçerik)       │
└────────┬────────┘     └────────┬─────────┘     └────────┬────────┘
         │                       │                        │
         │                       ▼                        │
         │              ┌─────────────────┐               │
         └─────────────▶│  Open-Meteo API │◀──────────────┘
                        │  (Hava + Toprak)│
                        └─────────────────┘
```

## Workspace Structure
- `/cms`: Payload CMS v3 on Next.js 15 App Router + SQLite backend (`@payloadcms/db-sqlite`, `@libsql/client`).
  - `(payload)` route group: Admin panel routes (`/admin`) and API handlers (`/api/[...slug]`).
  - `(frontend)` route group: Web dashboard and public portal endpoints.
- `/mobile`: Expo React Native client application with TypeScript, Navigation, and offline support.
- `/backend`: Firebase Cloud Functions for scheduled task triggers and weather adjustment.
- `/docs`: Architecture specs and setup documentation.

## Key Design Patterns
1. **Root Layout Pattern**: Top-level `cms/src/app/layout.tsx` wraps all route groups to ensure valid HTML root structure for Next.js 15 SSR/prerendering.
2. **Weather Adjustment Rule Engine**:
   - Compares planned task dates against 14-day Open-Meteo daily forecasts (rain mm, max wind km/h, min/max temp).
   - Automatically reschedules tasks exceeding safety thresholds up to 7 days into the future.
3. **Decoupled Data Architecture**:
   - User field logs & task statuses stored in Firebase Firestore.
   - Master crop templates & guides managed independently in Payload CMS.
