# System Patterns

## Architecture Overview

```
┌───────────────────────────┐           ┌───────────────────────────┐
│     Next.js 15 Web        │           │    Expo React Native      │
│     Portal (Dashboard)    │◀─ ─ ─ ─ ─▶│    Mobile App & Simulator │
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
              └───────────────────┬───────────────────┘
                                  ▼
                        ┌───────────────────┐
                        │   Open-Meteo API  │
                        │(Weather Forecasts)│
                        └───────────────────┘
```

## Workspace Structure
- `/cms`: Payload CMS v3 on Next.js 15 App Router + SQLite database backend (`@payloadcms/db-sqlite`, `@libsql/client`).
  - `(payload)` route group: Admin panel routes (`/admin`) and API handlers (`/api/[...slug]`).
  - `(frontend)` route group: Web dashboard (`DashboardView.tsx`), Mobile Simulator (`MobileSimulator.tsx`), and REST endpoints (`/api/portal-data`, `/api/cron/weather-adjust`, `/api/fields`, `/api/init-db`, `/api/seed`).
- `/mobile`: Expo React Native client application with TypeScript, Vector Icons, Offline Cache, and Firestore services.
- `/backend`: Firebase Cloud Functions for scheduled triggers and weather adjustment.
- `/docs`: Architecture specifications, user guides, and integration protocols.

## Key Design & Synchronization Patterns
1. **Event-Driven Bi-directional Sync (`eh_fields_sync`)**:
   - Instead of costly polling intervals, `DashboardView.tsx` and `MobileSimulator.tsx` communicate using standard browser `CustomEvent` dispatches.
   - When a planting is recorded or a field is saved, `window.dispatchEvent(new CustomEvent('eh_fields_sync', { detail: { source: 'web', ... } }))` fires.
   - Consumers listen via `window.addEventListener('eh_fields_sync', ...)` and update state instantaneously.
2. **Prop Delegation Pattern for Simulator**:
   - `MobileSimulator` receives parent states (`fields`, `plantingRecords`, `webRecords`) and emits callback events (`onAddField`, `onDeleteField`, `onAddWebRecord`).
   - Tasks generated inside the simulator automatically persist to `webRecords` if they relate to spraying or fertilizing.
3. **Weather Adjustment Rule Engine (`/api/cron/weather-adjust`)**:
   - Triggered periodically via cron-job.org with `CRON_SECRET` authorization.
   - Compares planned task dates against 14-day Open-Meteo daily forecasts (rain mm, max wind km/h, min/max temp).
   - Automatically reschedules tasks exceeding safety thresholds up to 7 days into the future.
4. **App Router Root Layout Pattern**:
   - Route groups `(frontend)` and `(payload)` maintain dedicated layout boundaries.
   - `(frontend)/not-found.tsx` renders clean UI without nested `<html>`/`<body>` to comply with Next.js App Router prerendering standards.

