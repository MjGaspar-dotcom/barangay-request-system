# Frontend styling map

Load order (see `src/main.jsx`): `tokens.css` -> Bootstrap -> `theme.css` -> `index.css` -> `navbar.css` -> `footer.css`.
`index.css` only `@import`s the files below, in order. **Order matters: later files override earlier ones. Do not reorder.**

| Folder / file | What lives there |
|---|---|
| `tokens.css` | Colors, spacing, radii, shadows, type scale. Change design values here first. |
| `theme.css` | Maps tokens onto Bootstrap's `--bs-*` variables and role accents (`.portal-staff-workspace`, `.portal-admin-workspace`). |
| `base.css` | Reset, body, shared section headings. |
| `layouts/dashboard-shell.css` | Base sidebar and dashboard shell (`.dashboard-sidebar`, `.sidebar-user`, `.sidebar-link`). |
| `layouts/portal-layout.css` | `<PortalLayout>` pages (staff dashboard, admin dashboard). |
| `layouts/portal-auth.css` | Staff and admin login screens. |
| `layouts/role-workspaces.css` | **Role colors**: staff teal vs admin green/gold sidebar, identity card, fixed sidebar, civic background, admin table buttons. Sidebar and button color bugs usually live here. |
| `pages/` | Page-specific styles (admin shared tables/forms/detail, staff and admin portals, landing). Scope new rules under the page's root class. |
| `components/ui-shared.css` | Everything used by `src/components/ui/*` plus small named helpers (`.filter-row`, `.u-scroll-x`, ...). |
| `legacy/` | Older resident and public styles not used by current staff/admin screens. |

## Finding the rule that is breaking a screen
1. Right-click the element -> Inspect -> **Computed** tab -> click the arrow beside the wrong property. It jumps to the winning rule and shows the file name from the table above.
2. In dev, press **Ctrl+Shift+D** for the layout overlay (outlines every box, labels the hovered element with its classes and size).
3. Crossed-out rules in the Styles panel are losing; fix the one that is not crossed out.

## Rules
- Layouts are separate per role: `AdminLayout` (`.admin-management-layout`), `PortalLayout` with `portalLabel` (`.portal-admin-workspace` / `.portal-staff-workspace`), and `StaffLayout` for every staff page. A shared look (like the sidebar identity card) must list all three selectors in ONE rule.
- No inline styles except CSS custom properties for dynamic values. No `!important` without a comment saying why.
- React Bootstrap components are imported by name from `react-bootstrap/*`; never import Bootstrap's JS bundle.
