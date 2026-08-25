# Active Context

## Current Work Focus
- Real-time synchronization between Web Portal (`/cms`) and Mobile App / Mobile Simulator (`/mobile`).
- Interactive Map enhancements: click-to-focus navigation from field lists to map polygons.
- Planting Date selector functionality across web and mobile.

## Recent Architectural & Feature Fixes
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
