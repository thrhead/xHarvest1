# Active Context

## Current Work Focus
- Establishing and maintaining the **Memory Bank** documentation system.
- Ensuring the monorepo application builds and runs reliably across production compilation (`npm run build`) and development preview servers.

## Recent Architectural Fixes
- **Next.js 15 & Payload CMS Root Layout Resolution**: Fixed Next.js 15 prerendering build failures on `/_not-found` by creating a top-level `cms/src/app/layout.tsx` root layout and a client-side `cms/src/app/not-found.tsx` component.
- **Dependency Overrides**: Configured React `19.0.0` dependencies across workspaces to maintain consistency between Next.js 15.1 and Payload CMS 3.86.
- **Build & Lint Verification**: Successfully verified `compile_applet` and `lint_applet` builds.

## Active Decisions & Considerations
- Next.js App Router structure in `/cms`: Route group `(payload)` manages the CMS admin panel, while `(frontend)` manages web portal components.
- Shared root layout in `cms/src/app/layout.tsx` supplies HTML/body wrappers to prevent Next.js 15 root layout absence errors.
- **Next.js Route Brackets (`[[...segments]]`, `[...slug]`)**: Documented why square bracket folder structures are required by Payload CMS v3 & Next.js App Router dynamic routes, and provided Git upload solutions.

## Next Steps
1. Maintain memory bank files on code updates.
2. Verify full integration between Expo mobile app, Firebase backend functions, Open-Meteo weather API, and Payload CMS.
