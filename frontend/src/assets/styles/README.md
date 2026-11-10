# Frontend styling map

The active stylesheet entry point is `src/styles/tailwind.css`, imported by `src/main.jsx`. Tailwind CSS v4 is configured through the frontend's Vite project and uses `src/styles/tokens.css` as its design-token source.

Tailwind preflight is not loaded. The cascade layers are ordered as `theme`, `base`, `mui`, `components`, and `utilities`, so existing Material UI styles and the application's page-specific styles can coexist with Tailwind utilities.

`src/styles/index.css` imports the existing page and layout CSS in order. Keep those styles while maintaining the current visual identity; use Tailwind for new layout and responsive work, shared controls from `src/components/ui/`, Material UI for existing advanced controls, and Lucide React for icons.

This directory contains older, inactive stylesheet copies. New styling work belongs in `src/styles/` and its imported page or component styles.
