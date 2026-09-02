# Technical Context

## Core Technologies
- **Languages**: TypeScript, SQL (SQLite / LibSQL), Python (backend scripts).
- **CMS & Web Framework**: Next.js 15.1.0, React 19.0.0, Payload CMS 3.86.0.
- **Database**:
  - CMS: `@payloadcms/db-sqlite` with `@libsql/client`.
  - Mobile App: Firebase Firestore with offline persistence support.
- **Mobile Framework**: Expo / React Native 0.76 with TypeScript.
- **Weather Services**: Open-Meteo REST API (`api.open-meteo.com/v1/forecast`).
- **Styling**: Tailwind CSS v4, Lucide Icons, Radix UI.

## Environment Constraints
- **Cloud Container Runtime**: Port 3000 exposed via Nginx reverse proxy.
- **Build Limits**: `NODE_OPTIONS="--no-deprecation --max-old-space-size=896"`.
- **Package Management**: Monorepo using npm workspaces (`cms`, `mobile`).

## Key Dependencies
- `@payloadcms/next`, `@payloadcms/db-sqlite`, `@payloadcms/richtext-lexical`
- `next`, `react`, `react-dom`
- `firebase`, `expo-location`, `expo-notifications`

## Agent Skills
- **`systematic-debugging`**: Step-by-step root-cause tracing, test isolation, and race-condition resolution.
- **`ui-ux-pro-max`**: Design intelligence, search engine for 79 styles, 192 product palettes, 74 font pairings, 119 UX guidelines, and stack recommendations.
