# Active Context

## Current Work Focus
- Real-time synchronization between Web Portal (`/cms`) and Mobile App / Mobile Simulator (`/mobile`).
- Interactive Map enhancements: click-to-focus navigation from field lists to map polygons.
- Planting Date selector functionality across web and mobile.

## Recent Architectural & Feature Fixes
- **Dev Server & Build Recovery**: Restarted the development server and verified successful zero-error compilation across all Next.js App Router and Payload CMS route handlers.
- **cron-job.org Weather Adjustment Route (`/api/cron/weather-adjust`)**:
  - Implemented the secure endpoint handling both `GET` and `POST` methods from cron-job.org.
  - Added secret verification supporting `Authorization: Bearer <CRON_SECRET>` and `X-Cron-Secret: <CRON_SECRET>`.
  - Configured Open-Meteo 14-day forecast analysis per field, adjusting pending spraying/fertilizing tasks if rain (≥5 mm), wind (≥15 km/h), or temperature limits are breached.
  - Implemented JobLog history and structured JSON summary response (`{ ok, scanned, moved, errors }`).
- **Web <-> Mobile Field Synchronization**: Harmonized `syncWebFieldsIntoDemo` in `/mobile/src/services/firebase.ts` and `DashboardView.tsx` so fields created or updated in the Web dashboard are consistently mirrored into the mobile demo state and simulator.
- **Click-to-Focus Map Interaction**:
  - In `MobileSimulator.tsx` (web simulator): Clicking on a field card in the live map view triggers `flyToBounds` on the Leaflet map instance, opens the field popup, and highlights the polygon.
  - In `FieldMap.tsx` and `/mobile/app/map.tsx` (mobile app): Added `focusRegion`, `selectedMarkerId`, and `onMarkerPress` to animate the map directly to the tapped field coordinates with clear visual feedback.
- **Planting Date Picker**: Added direct date selection in `InteractiveMap.tsx` and mobile `add-crop.tsx` flow.

## Active Decisions & Considerations
- Next.js App Router structure in `/cms`: Route group `(payload)` manages the CMS admin panel, while `(frontend)` manages web portal components.
- Mobile demo mode synchronizes through `localStorage` keys (`eh_web_fields`, `eh_mobile_demo_state_v2`) and `CustomEvent('eh_fields_sync')`.

## Next Steps
1. Continue fine-tuning multi-platform field management.
2. Verify notifications and weather-adjusted spraying/fertilizing schedules.
