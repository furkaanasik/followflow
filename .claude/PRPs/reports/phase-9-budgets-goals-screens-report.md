# Implementation Report: Phase 9 — Budgets & Goals Screens

## Summary
Built the three Phase 9 screens — Bütçeler (budget list), Hedefler (goal list), Hedef Detay (goal detail with monthly savings chart) — wired to live Supabase data via RTK Query. Added the three interaction flows (create/edit budget, create/edit goal, deposit-to-goal) as formSheet modals, plus a `goal_contributions` ledger table with an atomic `add_goal_contribution` RPC driving the monthly progress chart.

## Assessment vs Reality

| Metric | Predicted (Plan) | Actual |
|---|---|---|
| Complexity | Large | Large |
| Confidence | High (established patterns) | High — no blockers |
| Files Changed | ~20 (12 create, ~8 update) | 24 (13 created, 11 updated) |

## Tasks Completed

| # | Task | Status | Notes |
|---|---|---|---|
| 1 | Migration — goal_contributions + RPC | Done | Deviated — SECURITY INVOKER instead of DEFINER (see Deviations) |
| 2 | Types — goal_contributions | Done | Also added `Functions.add_goal_contribution` typing for `supabase.rpc` |
| 3 | baseApi tag + contributions API | Done | |
| 4 | aggregate.ts goal helpers | Done | `goalPercent`, `monthlyContributionSeries`, `averageMonthlyContribution`, `goalProjectionMonths` |
| 5 | goalIcons.ts + atom tweaks | Done | CategoryIcon `size` prop; ButtonSecondary `tone='accent'` |
| 6 | BudgetsScreen | Done | |
| 7 | GoalsScreen | Done | |
| 8 | GoalProgressChart organism | Done | `title` passed as prop (kept organism i18n-free) |
| 9 | GoalDetailScreen + route | Done | Loader + not-found fallback for cold deep-links |
| 10 | NewBudgetScreen + route + Stack | Done | 23505 → `newBudget.duplicate` |
| 11 | NewGoalScreen + route + Stack | Done | Icon picker via CategoryIcon ring, DateTimePicker min today |
| 12 | GoalDepositScreen + route + Stack | Done | Numpad + AmountDisplay pattern |
| 13 | i18n keys (tr + en) | Done | Extra keys: `budgets.add`, `goalDetail.notFound`, `newBudget.categoryLabel`, `newGoal.datePlaceholder`, `goalDeposit.subtitle`, `validation.goalNameRequired` |
| 14 | Barrel + wiring sanity | Done | |

## Validation Results

| Level | Status | Notes |
|---|---|---|
| Static Analysis (typecheck) | Pass | Zero errors; Expo typed routes regenerated |
| Lint | Pass | Clean |
| Format (prettier) | Pass | Clean after `--write` on 5 files |
| Database | Pass | Migration applied to remote (`rfrhsnjvdxyojsxrcxfl`); security advisors clean (only pre-existing leaked-password-protection warning) |
| Unit Tests | N/A | No test harness in repo (consistent with Phases 6–8) |
| App / Manual | Pending | Requires device/simulator walk-through (see Next Steps) |

## Files Changed

| File | Action |
|---|---|
| `supabase/migrations/20260720000000_goal_contributions.sql` | CREATED |
| `src/types/database.ts` | UPDATED (table + Functions typing) |
| `src/types/index.ts` | UPDATED |
| `src/store/api/baseApi.ts` | UPDATED (`GoalContribution` tag) |
| `src/store/api/goalContributionsApi.ts` | CREATED |
| `src/store/api/index.ts` | UPDATED |
| `src/lib/aggregate.ts` | UPDATED (4 goal helpers) |
| `src/lib/goalIcons.ts` | CREATED |
| `src/organisms/GoalProgressChart.tsx` | CREATED |
| `src/organisms/index.ts` | UPDATED |
| `src/atoms/CategoryIcon.tsx` | UPDATED (optional `size`) |
| `src/atoms/ButtonSecondary.tsx` | UPDATED (`tone='accent'`) |
| `src/screens/BudgetsScreen.tsx` | CREATED |
| `src/screens/GoalsScreen.tsx` | CREATED |
| `src/screens/GoalDetailScreen.tsx` | CREATED |
| `src/screens/NewBudgetScreen.tsx` | CREATED |
| `src/screens/NewGoalScreen.tsx` | CREATED |
| `src/screens/GoalDepositScreen.tsx` | CREATED |
| `src/screens/index.ts` | UPDATED |
| `src/app/(tabs)/butceler.tsx` | UPDATED (stub → screen) |
| `src/app/(tabs)/hedefler.tsx` | UPDATED (stub → screen) |
| `src/app/hedef/[id].tsx` | CREATED |
| `src/app/yeni-butce.tsx` | CREATED |
| `src/app/yeni-hedef.tsx` | CREATED |
| `src/app/hedef-para-ekle.tsx` | CREATED |
| `src/app/_layout.tsx` | UPDATED (4 Stack screens) |
| `src/i18n/locales/tr.json` | UPDATED (6 namespaces) |
| `src/i18n/locales/en.json` | UPDATED (parity) |

## Deviations from Plan
1. **RPC is SECURITY INVOKER, not DEFINER.** WHAT: `add_goal_contribution` runs as invoker. WHY: the Supabase security advisor flagged the DEFINER version (`authenticated_security_definer_function_executable`); RLS on `goals`/`goal_contributions` already enforces ownership for the invoker, so INVOKER is strictly safer and clears the advisor. Atomicity and the explicit ownership `raise exception` guard are unchanged.
2. **`Database['public']['Functions']` typing added.** The typed Supabase client rejects `rpc('add_goal_contribution', …)` without it — not anticipated by the plan.
3. **`GoalProgressChart` takes a `title` prop** instead of calling `t()` internally — organisms elsewhere are i18n-free; text comes in via props.
4. **A few extra i18n keys** beyond the plan's list (see Task 13 notes) for labels the screens needed.

## Issues Encountered
- Expo typed routes rejected the new paths until `.expo/types/router.d.ts` was regenerated (brief `expo start`). Resolved.

## Tests Written
None — repo has no unit-test harness (no jest/test script). Pure helpers in `aggregate.ts` are the designated target if a harness lands later.

## Next Steps
- [x] Manual walk-through on device/simulator: budget create/edit/delete + duplicate error, goal create/edit/delete, deposit round-trip (progress + chart update), cold deep-link to `hedef/[id]`, tr↔en toggle
- [x] Code review via `/code-review`
- [x] Create PR via `/prp-pr`
