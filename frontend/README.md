# BarangayEase — Web Frontend

React + Vite web frontend for BarangayEase administrators and staff. The Flutter resident application and backend remain separate projects.

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

## UI architecture

Tailwind CSS v4 is integrated through the frontend Vite plugin. Reusable shadcn/ui primitives live in `src/components/ui/`, with shared class utilities in `src/lib/utils.js`. Existing Material UI components and Recharts visualizations remain in place; Lucide React provides icons.

The shared colors and spacing are defined in `src/styles/tokens.css` and mapped to Tailwind/shadcn CSS variables in `src/styles/tailwind.css`. Tailwind preflight is intentionally excluded so it does not reset Material UI or existing page styles. MUI styles are placed in the `mui` cascade layer; project component styles and Tailwind utilities are layered separately.

Use Tailwind utilities for new layout and responsive styling, shadcn/ui primitives for standard controls, and Material UI where existing advanced components are already in use.

The shared motion layer provides fine-pointer hover feedback, brief route entrance cues, one-time viewport reveals, smooth scroll behavior, and keyboard focus visibility. It respects `prefers-reduced-motion` and avoids animating layout dimensions.

## Project structure

- `src/pages/` — public, resident, staff, and admin pages
- `src/components/` — reusable UI, navigation, forms, and sections
- `src/layouts/` — shared public and role-specific layouts
- `src/routes/` — route definitions and route guards
- `src/styles/` — Tailwind entry point, design tokens, and page style imports
- `src/components/ui/` — shared shadcn/ui primitives and existing application components
- `public/assets/images/` — local image assets

The ZIP distribution intentionally excludes `node_modules/` and generated `dist/`; reinstall dependencies with `npm install` after extracting it.
