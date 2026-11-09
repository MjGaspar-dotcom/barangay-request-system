# Barangay Document Request System — Frontend

React + Vite web frontend for staff and administrators of the Barangay Document Request System. Residents use the mobile app; resident API and account data remain available to that client.

## Requirements

- Node.js compatible with the versions in `package.json` and `package-lock.json`
- npm

## Run locally

```bash
npm install
npm run dev
```

## Build and lint

```bash
npm run build
npm run lint
```

## Design and motion notes

The existing visual identity is preserved with teal staff screens and neutral administrator surfaces. See `DESIGN-SYSTEM.md` and `brand-spec.md` for the token and asset notes.

The shared motion layer provides fine-pointer hover feedback, brief route entrance cues, one-time viewport reveals, smooth scroll behavior, and keyboard focus visibility. It respects `prefers-reduced-motion` and avoids animating layout dimensions.

## Project structure

- `src/pages/` — public, resident, staff, and admin pages
- `src/components/` — reusable UI, navigation, forms, and sections
- `src/layouts/` — shared public and role-specific layouts
- `src/routes/` — route definitions and route guards
- `src/assets/styles/` — design tokens, Bootstrap bridge, layouts, components, and page styles
- `public/assets/images/` — local image assets

The ZIP distribution intentionally excludes `node_modules/` and generated `dist/`; reinstall dependencies with `npm install` after extracting it.
