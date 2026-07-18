# Implementation Report: Phase 5 — Supabase Schema & Data Layer

## Summary
Postgres schema (6 tables + RLS + triggers) written as a versioned Supabase CLI migration, hand-written `Database` TypeScript types, and a typed Redux data layer (RTK Query via `fakeBaseQuery` + `authSlice`) wired into the store. Session bootstrap added to the root layout. Google/email auth helper functions written.

## Assessment vs Reality

| Metric | Predicted (Plan) | Actual |
|---|---|---|
| Complexity | Large | Large — matched |
| Confidence | N/A | High for code/types; DB validation blocked (see below) |
| Files Changed | 19 | 18 code files + 1 doc (phases.md) still pending |

## Tasks Completed

| # | Task | Status | Notes |
|---|---|---|---|
| 1 | Add CLI + OAuth deps | Done | `supabase` devDep, `expo-auth-session` via `expo install` |
| 2 | Scaffold Supabase CLI project | Done | `supabase/config.toml`, `.gitignore` does not ignore `migrations/` |
| 3 | Initial schema migration | Done | `supabase/migrations/20260719000000_initial_schema.sql` — written verbatim from plan |
| 4 | Hand-write `Database` types | Done — deviated | See Deviations: added `Relationships`/`Views`/`Functions` fields the plan's snippet omitted |
| 5 | Re-export domain types | Done | `src/types/index.ts` |
| 6 | Type the Supabase client | Done | `createClient<Database>(...)` |
| 7 | Auth helper functions | Done | `src/lib/auth.ts` |
| 8 | `authSlice` | Done | Mirrors `themeSlice` pattern exactly |
| 9 | RTK Query base API | Done | `src/store/api/baseApi.ts` |
| 10-15 | Entity APIs (income sources, recurring payments, goals, budgets, transactions, profile) | Done | All 6 CRUD/query modules |
| 16 | API barrel | Done | `src/store/api/index.ts` |
| 17 | Wire the store | Done | `auth` reducer, `api` reducer/middleware, `setupListeners` |
| 18 | Session bootstrap in root layout | Done | `getSession()` + `onAuthStateChange` |
| 19 | Update `.claude/phases.md` | **Blocked** | Plan requires this only after migration is pushed to a linked project and `get_advisors` shows zero RLS warnings — no FollowFlow Supabase project exists yet (only an unrelated `traintera` project was found via `list_projects`). Left unchecked. |

## Validation Results

| Level | Status | Notes |
|---|---|---|
| Static Analysis (typecheck) | Pass | 0 errors after fixing the `Database` schema shape (see Deviations) |
| Static Analysis (lint) | Pass | `expo lint`, 0 errors |
| Static Analysis (format) | Pass | `prettier --check .` clean after `prettier --write .` |
| Unit Tests | N/A | No test runner configured in this repo (consistent with Phases 0-4) |
| Build | N/A | Expo project — no standalone `build` script; static analysis is the gate |
| Integration | N/A | No server process to boot |
| Database Validation | **Blocked** | No linked Supabase project — `supabase link` / `db push` / `get_advisors` not run |
| Manual Validation (auth smoke test) | **Blocked** | Same reason — no live project, no `.env` credentials |

## Files Changed

| File | Action | Lines |
|---|---|---|
| `package.json` | UPDATED | +2 |
| `package-lock.json` | UPDATED | +271 |
| `supabase/config.toml` | CREATED | +414 |
| `supabase/.gitignore` | CREATED | +8 |
| `supabase/migrations/20260719000000_initial_schema.sql` | CREATED | +153 |
| `src/types/database.ts` | CREATED | +172 |
| `src/types/index.ts` | UPDATED | +36/-3 |
| `src/lib/supabase.ts` | UPDATED | +4/-2 |
| `src/lib/auth.ts` | CREATED | +57 |
| `src/store/slices/authSlice.ts` | CREATED | +29 |
| `src/store/api/baseApi.ts` | CREATED | +16 |
| `src/store/api/incomeSourcesApi.ts` | CREATED | +70 |
| `src/store/api/recurringPaymentsApi.ts` | CREATED | +73 |
| `src/store/api/goalsApi.ts` | CREATED | +60 |
| `src/store/api/budgetsApi.ts` | CREATED | +61 |
| `src/store/api/transactionsApi.ts` | CREATED | +70 |
| `src/store/api/profileApi.ts` | CREATED | +55 |
| `src/store/api/index.ts` | CREATED | +7 |
| `src/store/store.ts` | UPDATED | +9/-2 |
| `src/app/_layout.tsx` | UPDATED | +18 |

## Deviations from Plan

1. **`src/types/database.ts` schema shape** — the plan's `Database` type snippet omitted `Relationships` (per-table) and `Views`/`Functions` (per-schema) keys. The installed `@supabase/postgrest-js@2.110.7`'s `GenericTable`/`GenericSchema` types require these — without them, `Omit<Database, '__InternalSupabase'>['public']` fails to structurally match `GenericSchema` and `SupabaseClient` falls back its generic to `never`, which silently broke every `.insert()`/`.update()` call's argument typing (surfaced as `Argument ... is not assignable to parameter of type 'never'` across all 6 entity API files). **Why**: the plan's snippet likely predates this postgrest-js version's stricter generic constraints. **Fix**: added `Relationships: []` to each table and `Views: Record<string, never>` / `Functions: Record<string, never>` to the `public` schema — this also matches the real shape `supabase gen types typescript` produces, so no future regeneration drift.
2. **`profileApi.ts`'s `notAuthenticatedError`** — the plan built a plain object literal typed as `PostgrestError`. In the installed version, `PostgrestError` is a class (not a plain interface) with a required `toJSON()` method, so the object literal failed to type-check. **Fix**: construct it via `new PostgrestError({...})` (the class is exported as a value from `@supabase/supabase-js`), which is also more correct than hand-duplicating the shape.

Both deviations are type-fidelity fixes only — no behavioral or schema changes from the plan.

## Issues Encountered
- No FollowFlow Supabase project exists yet (`mcp__supabase__list_projects` returns only an unrelated `traintera` project). This blocks: `supabase link`, `supabase db push`, `get_advisors` security check, and the manual auth smoke test (sign up → sign in → sign out). This was explicitly flagged as the plan's top risk ("Supabase project not yet created/linked when implementation starts") — all code/schema/types/Redux artifacts that don't require a live project are complete and validated; only the database-push and manual-validation steps remain.

## Tests Written
None — no test runner configured (consistent with Phases 0-4).

## Next Steps
- [ ] Create the Supabase project (dashboard or `supabase projects create`), populate `.env` with real `EXPO_PUBLIC_SUPABASE_URL`/`EXPO_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `npx supabase link --project-ref <ref>` then `npx supabase db push`
- [ ] Run `mcp__supabase__list_tables` and `mcp__supabase__get_advisors` (security) — confirm 6 tables, zero RLS warnings
- [ ] Enable Google OAuth provider in the Supabase dashboard + configure Google Cloud OAuth client
- [ ] Manual smoke test: `signUpWithEmail` → confirm `profiles` row auto-created → `signInWithEmail` → `signOut`
- [ ] Once the above passes: check off `.claude/phases.md` Phase 5 boxes and archive this plan to `completed/`
- [ ] Code review via `/code-review`
