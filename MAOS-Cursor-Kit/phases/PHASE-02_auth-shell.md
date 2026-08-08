# PHASE 02 — Auth, app shell, design system, base components
Read CONTRACTS + the design tokens. Everything visual from here uses these components.

## Goal
A logged-in user lands in a themed, navigable app shell built from a real component library (imported/adapted from Stitch exports), fully accessible and responsive.

## Deliverables
1. Supabase Auth: email OTP + Google. Session persistence, protected routes, sign-out. An auth store/provider exposing `user`. `profiles` row auto-created on first login (trigger or client upsert).
2. App shell per the design spec: desktop left sidebar (240/72 collapsible), mobile bottom tab bar (5 slots incl. center + FAB), top bar with context slots, ⌘K command palette (routes + actions registry, extensible), offline banner bound to real connectivity + outbox state.
3. Design system: Tailwind theme with the **monochrome** tokens (near-white accent on near-black; color reserved for semantic success/warn/danger + run zones only), typography scale (Inter / Space Grotesk numerics / JetBrains Mono tabular), spacing, radius, elevation. Dark default + light + OLED variants via a theme store.
4. Base component library in `src/components/ui`, themed shadcn + custom, matching CONTRACTS/spec: Button, Input, NumberStepper, Chip, Segmented, Toggle, Slider, Select, Tooltip, Toast, Skeleton, Sheet, Drawer, Dialog, Card, MetricCard, RingProgress, Table, EmptyState, ErrorState. Each with variants + states + a Vitest/RTL test + axe check. If Stitch exports exist, adapt them into these components rather than shipping raw export markup.
5. Command palette + keyboard shortcut system (G-then-key nav, `?` help sheet).

## Gate
Universal Gate green. Login→app→logout works. Palette navigates. axe passes on shell + every base component. Responsive at 375/768/1200 verified. Component states visible in a `/dev/components` gallery route (dev-only).
