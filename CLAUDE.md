# FollowFlow

Personal finance / budget tracking mobile app (Turkish UI). Built with **Expo / React Native + Expo Router + Redux Toolkit (RTK Query) + Supabase**. v1 (Phase 0–11) shipped; active work tracked in [`.claude/backlog.md`](./.claude/backlog.md) (frozen history in `.claude/phases.md`). The original Pencil design still lives in `design/design.pen` and remains the visual source of truth.

## Codebase

- **Stack**: Expo (React Native), `expo-router` (file-based routing under `src/app/`), Redux Toolkit + RTK Query (`src/store/`), Supabase (`@supabase/supabase-js`, migrations in `supabase/migrations/`). TypeScript throughout. i18n via `i18next`/`react-i18next` (`src/i18n/locales/{tr,en}.json`). Icons: `lucide-react-native`. Charts: plain RN Views + `react-native-svg` (no chart lib). No new runtime deps without cause.
- **Path alias**: `@/*` → `src/*`, `@/assets/*` → `assets/*`.
- **Structure** (`src/`): `atoms/` `molecules/` `organisms/` (atomic-design tiers, barrel `index.ts` each) · `screens/` (one component per screen, barrel export) · `app/` (Expo Router routes; a route file just re-exports its screen — e.g. `takvim.tsx` → `CalendarScreen`) · `lib/` (pure helpers + tests in `lib/__tests__/`) · `store/` (`slices/`, `api/` RTK Query endpoints) · `theme/` (tokens + `useTheme`) · `types/` · `i18n/`.
- **Patterns**: RTK Query endpoints return a plain `ApiError` (never a class) via `toApiError`; screens fetch with generated hooks + `useFocusEffect` refetch; loading/error via `StateView`; all aggregation is pure fns in `lib/` (unit-tested). New screen = lib fn (+ test) → organism(s) → screen → `app/<route>.tsx` → register in `app/_layout.tsx` Stack → barrels → Settings `InfoRowChevron` entry → i18n both locales.
- **Commands**: `npm test` (jest), `npm run typecheck` (`tsc --noEmit`), `npm run lint` (`expo lint`), `npm run format`, `npm run e2e` (Maestro, `.maestro/`), `npm start` (expo). Themes must stay legible in all 4 modes — use theme tokens, never hardcode colors.
- **Workflow** (per backlog item): `/prp-plan <item>` → `/prp-implement` → `/code-review` → `/prp-commit` → `/prp-pr` → web merge → cleanup → move item to `Done`.

## Working with `design/design.pen`

- `.pen` files are encrypted binary-ish format. **Never** `Read`/`Grep`/`cat` this file — always use the `pencil` MCP tools (`get_editor_state`, `batch_get`, `snapshot_layout`, `get_screenshot`, `get_variables`, `batch_design`, `export_nodes`, `export_html`).
- Call `mcp__pencil__get_editor_state(include_schema: true)` first in any new session before touching the file — it returns the current node tree + full `.pen` schema.

## Atomic Design structure

The design system (top-level frame `Design System`) is already organized by atomic-design tiers. When building the codebase, mirror this 1:1 into component folders (`atoms/`, `molecules/`, `organisms/`, `templates|screens/`):

**Atoms** (11) — Category Icon, Button/Primary, Button/Secondary, Button/Icon Only, Button/Google CTA, Input Field, Amount Display, Badge/Amount, Progress Bar, Avatar, Surface Card.

**Molecules** (14) — Transaction Row, Search Bar, Budget Progress Row, Nav Item, Numpad Key, Numpad Key Row, Form Field Group, Divider/Or, Title+Subtitle, Info Row/Chevron, Step Indicator, Segmented Toggle, Alert Banner (+ Info variant), Step Badge.

**Organisms — Nav & List** (5) — Bottom Navigation Bar, Transaction List Card, App Bar/Simple Title, App Bar/Back+Title, Onboarding Top Bar.

**Organisms — Cards** (6) — Budget Card (+ "Limit Aşıldı" over-limit variant), Net Durum Card (net balance summary), Goal Card, Recurring Payment Card, Income Source Card.

**Templates / Screens** (13, each exists in both light + dark theme frames — "Pages" = dark, "Pages Light" = light):
1. Login
2. Onboarding - Gelir Kaynağı (income source)
3. Onboarding - Tekrarlayan Ödeme (recurring payment)
4. Onboarding - Hedef (goal)
5. Ana Sayfa (home) — has floating action button (FAB)
6. İşlemler (transactions list)
7. Yeni İşlem Modal (new transaction, bottom sheet)
8. Bütçeler (budgets)
9. Hedefler (goals)
10. Hedef Detay (goal detail)
11. Gelir Kaynaklarım (my income sources)
12. Ayarlar (settings)
13. Tekrarlayan Ödemeler (recurring payments)

Outside the atomic hierarchy: `Status Bar` (OS chrome, explicitly noted in the file as "Design System dışı" — not a real component) and a stray 10×2px `Frame 1` root leftover (ignore).

## Design tokens (`SetVariables` in the .pen file)

4 themes on the `mode` axis: `dark` (default), `light`, `vibrant`, `vibrant-dark`.

- **Fonts**: heading = Geist, body = Inter.
- **Spacing scale**: `gap-xs`=6, `gap-sm`=10, `gap-md`=16, `gap-lg`=24, `gap-xl`=32.
- **Radius scale**: `radius-sm`=10, `radius-md`=16, `radius-lg`=22, `radius-full`=999.
- **Color roles** (per-theme values, see `get_variables` for exact hex): `bg-app`, `bg-surface`, `bg-surface-alt`, `border-subtle`, `text-primary`, `text-secondary`, `text-tertiary`, `accent-teal` / `accent-teal-dim` / `accent-teal-border` (20% alpha) / `accent-teal-faint` (15% alpha, decorative rings) (brand), `income-green`, `expense-coral` / `expense-coral-dim`, `warning-red` / `warning-bg`.

Dark theme is teal-accented on near-black surfaces; light theme mirrors it on off-white; vibrant/vibrant-dark swap the brand accent to purple (`#6D4DF2` / `#8B6FF7`).

## Domain model (inferred from screens)

Income sources, recurring payments, and savings goals are first-class entities captured during onboarding. Core loop: log transactions (income/expense) → track against budgets → track against goals. Bottom nav covers 5 tabs: Ana Sayfa, İşlemler, Bütçeler, Hedefler, Ayarlar.
