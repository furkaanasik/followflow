# Implementation Report: Phase 8 — Core Screens

## Summary
Built the three core-loop screens (Ana Sayfa, İşlemler, Yeni İşlem Modal) on top of the existing atomic component library and RTK Query data layer, and mounted the designed floating pill `BottomNavigationBar` as the real tab bar across all 5 tabs. Includes a new SVG donut `CategoryBreakdownCard`, a `CategoryChip` picker, pure aggregation helpers, a category catalog, and a `formSheet` modal route for transaction creation.

## Assessment vs Reality

| Metric | Predicted (Plan) | Actual |
|---|---|---|
| Complexity | Large | Large |
| Confidence | — | High — implemented as planned |
| Files Changed | ~18 (7 CREATE, ~11 UPDATE) | 20 (9 CREATE, 11 UPDATE) |

## Tasks Completed

| # | Task | Status | Notes |
|---|---|---|---|
| 1 | Category catalog `categories.ts` | Complete | Added `CategoryLabelKey` union for typed `t()` |
| 2 | Aggregation helpers `aggregate.ts` | Complete | Case-insensitive budget↔txn join on category key |
| 3 | `CategoryChip` molecule | Complete | |
| 4 | `CategoryBreakdownCard` organism | Complete | Immutable offset precompute (lint rule) |
| 5 | `AppTabBar` | Complete | `BottomTabBarProps` imported from `expo-router/js-tabs` |
| 6 | Extend `TAB_ROUTES` | Complete | |
| 7 | Custom tab bar wiring | Complete | |
| 8 | `HomeScreen` | Complete | |
| 9 | `TransactionsScreen` | Complete | |
| 10 | `NewTransactionScreen` | Complete | |
| 11 | Modal route + Stack registration | Complete | `formSheet`, detent 0.92 |
| 12 | Tab re-exports + barrels | Complete | |
| 13 | i18n keys (tr + en) | Complete | Mirrored key sets |
| 14 | i18n-ize `NetDurumCard` | Complete | Optional label props, TR defaults |

## Validation Results

| Level | Status | Notes |
|---|---|---|
| Static Analysis (tsc) | Pass | Zero type errors |
| Lint (expo lint) | Pass | Zero errors |
| Format (prettier) | Pass | All files match style |
| Unit Tests | N/A | No test runner configured (per plan Testing Strategy) |
| Build | N/A | Expo/RN has no `build` script; `tsc` is the build gate |
| Integration | Not run | Requires device/simulator; validate manually via `npx expo start` |

## Files Changed

| File | Action |
|---|---|
| `src/lib/categories.ts` | CREATED |
| `src/lib/aggregate.ts` | CREATED |
| `src/molecules/CategoryChip.tsx` | CREATED |
| `src/organisms/CategoryBreakdownCard.tsx` | CREATED |
| `src/navigation/AppTabBar.tsx` | CREATED |
| `src/screens/HomeScreen.tsx` | CREATED |
| `src/screens/TransactionsScreen.tsx` | CREATED |
| `src/screens/NewTransactionScreen.tsx` | CREATED |
| `src/app/yeni-islem.tsx` | CREATED |
| `src/app/(tabs)/index.tsx` | UPDATED (re-export HomeScreen) |
| `src/app/(tabs)/islemler.tsx` | UPDATED (re-export TransactionsScreen) |
| `src/app/(tabs)/_layout.tsx` | UPDATED (custom tabBar) |
| `src/app/_layout.tsx` | UPDATED (yeni-islem formSheet) |
| `src/navigation/tabs.ts` | UPDATED (icon + titleKey) |
| `src/organisms/NetDurumCard.tsx` | UPDATED (label props) |
| `src/organisms/index.ts` | UPDATED |
| `src/molecules/index.ts` | UPDATED |
| `src/screens/index.ts` | UPDATED |
| `src/i18n/locales/tr.json` | UPDATED |
| `src/i18n/locales/en.json` | UPDATED |

## Deviations from Plan
- **`AppTabBar` import source**: plan referenced `@react-navigation/bottom-tabs`, which is not a resolvable package (expo-router v57 vendors react-navigation). Imported `BottomTabBarProps` from `expo-router/js-tabs` instead.
- **Typed i18n for categories**: added a `CategoryLabelKey` union to `categories.ts` so `t(cat.labelKey)` satisfies the typed `t()`; a plain `string` was rejected.
- **Donut segment math**: precomputed `dashes`/`offsets` arrays immutably instead of a mutating accumulator inside the render map (blocked by `react-hooks/immutability` lint rule).
- **`StyleSheet.absoluteFillObject`** not present in this RN version's types — used explicit absolute inset style.

## Issues Encountered
None unresolved. All static checks green after the deviations above.

## Tests Written
None — no runner configured (matches Phases 2–7). `aggregate.ts` and `categories.ts` were kept pure to enable future unit tests.

## Next Steps
- [ ] Manual device validation via `npx expo start` (home summary/donut/budgets/recent, İşlemler search, FAB→sheet create round-trip, custom pill nav on all tabs, light/vibrant themes)
- [ ] Code review via `/code-review`
- [ ] Create PR via `/prp-pr`
