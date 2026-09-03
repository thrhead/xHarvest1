# Active Context

## Current Work Focus
- Ensuring robust bi-directional data synchronization between the Web Dashboard (`DashboardView.tsx`), Mobile Simulator (`MobileSimulator.tsx`), and Expo React Native mobile client (`/mobile`).
- Real-time event-driven state updates across planting records, spraying/fertilizing application logs, and parcel polygons without aggressive polling.
- Weather-adaptive cron automation and field safety verifications.

## Recent Architectural & Feature Fixes
1. **Mobile Tasks & Calendar UX Reorganization (De-cluttering & Agenda Architecture)**:
   - **Eliminated Duplicate Views**: Previously, both the "Görevler" (Tasks) tab and the "Takvim" (Calendar) tab listed all tasks vertically in an identical, cluttered manner.
   - **Restructured Mobile Calendar (`calendar.tsx` & `MobileSimulator.tsx`)**: Transformed the calendar into a focused, date-driven agricultural agenda featuring:
     - Interactive 7-day timeline strip with day-level task counter badges.
     - Time-scope filter buttons: `[Gün]` (Day), `[Bu Hafta]` (This Week), `[Bu Ay]` (This Month), and `[Tümü]` (All).
     - Clean agenda cards displaying operation icon, time, parcel name, and quick completion toggles.
     - Direct CTA link to the comprehensive task management view.
   - **Restructured Mobile Tasks View (`tasks.tsx` & `MobileSimulator.tsx`)**: Introduced dynamic grouping with a 3-mode segmented switcher:
     - `🗓️ Zamana Göre (Timeline)`: Groups tasks into Delay/Weather alerts, Today/Upcoming, Future plans, and Completed.
     - `📍 Tarlaya Göre (By Field)`: Organizes tasks parcel by parcel so field visits can be handled sequentially.
     - `🏷️ İşleme Göre (By Type)`: Categorizes tasks into Spraying, Fertilizing, Irrigation, Planting, and Harvesting.
     - Compact card layout with high visual density, clear type badges, status pills, and one-tap completion circles.
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

