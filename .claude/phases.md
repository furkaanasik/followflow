# FollowFlow — Development Phases

React Native (Expo) build of the FollowFlow design (`design/design.pen`). Stack: **Expo** + **Supabase** (auth/DB/realtime) + **Redux Toolkit** (state).

Each phase should be completed, verified, and checked off before starting the next. Mark phases with `[x]` when done.

## Phase 0 — Project Setup ✅ complete — report: `.claude/PRPs/reports/phase-0-project-setup-report.md`
- [x] `npx create-expo-app` with TypeScript template
- [x] Folder structure: `src/{atoms,molecules,organisms,screens,navigation,store,lib,theme,types}`
- [x] expo-router or React Navigation setup (stack + bottom tabs matching the 5-tab nav: Ana Sayfa, İşlemler, Bütçeler, Hedefler, Ayarlar)
- [x] Redux Toolkit store scaffold + Provider wiring
- [x] Supabase client setup (`lib/supabase.ts`), env vars for URL/anon key
- [x] ESLint + Prettier + TypeScript strict config
- [x] Font loading: Geist (heading), Inter (body)

## Phase 1 — Design Tokens & Theming ✅ complete — report: `.claude/PRPs/reports/design-tokens-theming-report.md`
- [x] Port tokens from `design/design.pen` (`get_variables`) into `src/theme/tokens.ts`: colors (per-theme), spacing scale, radius scale
- [x] Theme context/provider supporting 4 modes: `dark` (default), `light`, `vibrant`, `vibrant-dark`
- [x] Theme persistence (Redux + AsyncStorage or Supabase user prefs)

## Phase 2 — Atoms (10 components) ✅ complete — report: `.claude/PRPs/reports/atoms-phase-2-report.md`
Category Icon, Button/Primary, Button/Secondary, Button/Icon Only, Button/Google CTA, Input Field, Amount Display, Badge/Amount, Progress Bar, Avatar.
- [x] Build each atom against all 4 themes, verify against Pencil screenshots (`get_screenshot`) — code built + typecheck/lint/format clean; Pencil-screenshot pixel diff not possible this session (desktop app not attached), see report's Issues Encountered for the gap and follow-up

## Phase 3 — Molecules (12 components) ✅ complete — report: `.claude/PRPs/reports/phase-3-molecules-report.md`
Transaction Row, Search Bar, Budget Progress Row, Nav Item, Numpad Key, Numpad Key Row, Form Field Group, Divider/Or, Title+Subtitle, Info Row/Chevron, Step Indicator, Segmented Toggle.
- [x] Compose from Phase 2 atoms only — no raw styling duplication

## Phase 4 — Organisms (10 components) ✅ complete — report: `.claude/PRPs/reports/phase-4-organisms-report.md`
Nav & List: Bottom Navigation Bar, Transaction List Card, App Bar/Simple Title, App Bar/Back+Title.
Cards: Budget Card (+ over-limit variant), Net Durum Card, Goal Card, Recurring Payment Card, Income Source Card.
- [x] Compose from Phase 2/3 only

## Phase 5 — Supabase Schema & Data Layer
- [ ] Dev workflow: create Supabase project w/ GitHub-connect (auto-deploy on push). Supabase CLI local, migrations as SQL files in `supabase/migrations/` (source of truth in repo), `supabase link` to project. MCP `supabase` tools used only for inspect/debug (`list_tables`, `get_advisors`, `get_logs`), not for writing schema directly to remote.
- [ ] Tables: `users`, `income_sources`, `recurring_payments`, `goals`, `budgets`, `transactions`
- [ ] RLS policies (per-user row access)
- [ ] Redux slices + RTK Query (or thunks) per entity
- [ ] Auth flow (email/password + Google OAuth — matches "Button/Google CTA" atom)

## Phase 6 — Auth & Onboarding Screens
- [ ] Login
- [ ] Onboarding - Gelir Kaynağı (income source)
- [ ] Onboarding - Tekrarlayan Ödeme (recurring payment)
- [ ] Onboarding - Hedef (goal)
- [ ] Wire onboarding data → Supabase writes

## Phase 7 — Core Screens
- [ ] Ana Sayfa (home, incl. FAB → opens Yeni İşlem Modal)
- [ ] İşlemler (transaction list, search/filter via Search Bar molecule)
- [ ] Yeni İşlem Modal (bottom sheet, numpad input)

## Phase 8 — Budgets & Goals Screens
- [ ] Bütçeler
- [ ] Hedefler
- [ ] Hedef Detay

## Phase 9 — Settings & Management Screens
- [ ] Gelir Kaynaklarım
- [ ] Ayarlar (incl. theme switcher)
- [ ] Tekrarlayan Ödemeler

## Phase 10 — Polish & QA
- [ ] Cross-theme visual QA (all 4 modes) against Pencil source
- [ ] Empty states, loading states, error states per screen
- [ ] Accessibility pass (contrast, tap targets, screen reader labels)
- [ ] E2E smoke test of core loop: add income source → log transaction → check budget/goal progress

## Notes
- Domain loop: income sources & recurring payments captured at onboarding → transactions logged → tracked against budgets and goals.
- Reference `CLAUDE.md` at repo root for full design-token values and screen inventory.
- Never `Read`/`Grep` `design/design.pen` — use `pencil` MCP tools only.
