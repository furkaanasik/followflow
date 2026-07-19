# FollowFlow

Personal finance / budget tracking mobile app (Turkish UI). Repo currently contains **design only** — no source code yet. Design lives in `design/design.pen`, a Pencil design file (390px mobile screens).

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
