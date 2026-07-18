# Implementation Report: Phase 3 — Molecules

## Summary
Built all 12 molecule components (`Transaction Row`, `Search Bar`, `Budget Progress Row`, `Nav Item`, `Numpad Key`, `Numpad Key Row`, `Form Field Group`, `Divider/Or`, `Title+Subtitle`, `Info Row/Chevron`, `Step Indicator`, `Segmented Toggle`) under `src/molecules/`, composed from Phase 2 atoms and shared theme tokens. Extended the `ButtonIconOnly` atom with optional `variant`/`size` props (non-breaking) so `SearchBar`'s filter button could reuse it instead of hand-rolled styling.

## Assessment vs Reality

| Metric | Predicted (Plan) | Actual |
|---|---|---|
| Complexity | Medium | Medium — matched |
| Confidence | High (plan was code-complete) | High — implemented as specified with zero deviations |
| Files Changed | 15 | 15 |

## Tasks Completed

| # | Task | Status | Notes |
|---|---|---|---|
| 1 | Extend `ButtonIconOnly` (variant/size) | Complete | |
| 2 | `NavItem` | Complete | |
| 3 | `NumpadKey` | Complete | |
| 4 | `NumpadKeyRow` | Complete | Built from `NumpadKey`, not `.pen`'s literal `Button/Primary` overrides — deliberate deviation documented in plan |
| 5 | `DividerOr` | Complete | |
| 6 | `TitleSubtitle` | Complete | |
| 7 | `StepIndicator` | Complete | |
| 8 | `SegmentedToggle` | Complete | |
| 9 | `TransactionRow` | Complete | |
| 10 | `BudgetProgressRow` | Complete | |
| 11 | `FormFieldGroup` | Complete | |
| 12 | `InfoRowChevron` | Complete | |
| 13 | `SearchBar` | Complete | |
| 14 | Barrel export (`src/molecules/index.ts`) | Complete | |

## Validation Results

| Level | Status | Notes |
|---|---|---|
| Static Analysis (typecheck) | Pass | `npm run typecheck` — zero errors |
| Static Analysis (lint) | Pass | `npm run lint` — zero errors/warnings |
| Format | Pass | `npm run format:check` clean after one `npm run format` auto-fix pass |
| Build | N/A | No standalone build step in this repo (Expo managed workflow) |
| Integration (bundle) | Pass | `expo start --web` — Metro bundled 2779 modules, 0 errors |
| Manual/Visual | Pass | Rendered all 12 molecules on a scratch `(tabs)/index.tsx` screen behind the real `ThemeProvider`, screenshotted via headless Chromium (dark theme) — no crashes, no icon-resolution errors, no missing-font warnings |
| Pencil screenshot diff | Pass | `get_screenshot` pulled on all 12 node IDs, compared against the scratch render — layout, spacing, color, and typography match the `.pen` source for every component |
| Edge Cases | Pass | See below |

## Files Changed

| File | Action | Lines |
|---|---|---|
| `src/atoms/ButtonIconOnly.tsx` | UPDATED | +14 / -6 |
| `src/molecules/NavItem.tsx` | CREATED | +42 |
| `src/molecules/NumpadKey.tsx` | CREATED | +29 |
| `src/molecules/NumpadKeyRow.tsx` | CREATED | +21 |
| `src/molecules/DividerOr.tsx` | CREATED | +30 |
| `src/molecules/TitleSubtitle.tsx` | CREATED | +33 |
| `src/molecules/StepIndicator.tsx` | CREATED | +36 |
| `src/molecules/SegmentedToggle.tsx` | CREATED | +67 |
| `src/molecules/TransactionRow.tsx` | CREATED | +66 |
| `src/molecules/BudgetProgressRow.tsx` | CREATED | +45 |
| `src/molecules/FormFieldGroup.tsx` | CREATED | +54 |
| `src/molecules/InfoRowChevron.tsx` | CREATED | +67 |
| `src/molecules/SearchBar.tsx` | CREATED | +40 |
| `src/molecules/index.ts` | CREATED | +12 |
| `.claude/phases.md` | UPDATED | Phase 3 checked off |

## Deviations from Plan
None — implemented exactly as specified, including the deliberate `NumpadKeyRow`→`NumpadKey` composition deviation from the `.pen` file's literal `Button/Primary`-override structure (called out in the plan itself as the correct call).

## Issues Encountered
- Playwright MCP's bundled browser wasn't available in this environment (`chrome executable not found`); worked around by driving the system `chromium` binary directly in headless mode (`chromium --headless --screenshot=...`) against the running `expo start --web` server to capture the scratch-screen render.
- Only the `dark` theme was screenshot-verified live (no scripted way to flip `ThemeProvider` mode without an interactive browser session in this environment). Cross-theme correctness for `light`/`vibrant`/`vibrant-dark` rests on static verification: all four `COLOR_TOKENS` entries in `src/theme/tokens.ts` share identical keys, and every molecule reads colors exclusively via `theme.colors.*`, so no theme can hit an undefined-token crash. Flagged as a follow-up if a full interactive cross-theme visual QA pass is wanted before Phase 4.

## Tests Written

| Test File | Tests | Coverage |
|---|---|---|
| — | 0 | No test runner configured in this repo (consistent with Phase 2) |

## Next Steps
- [x] Code review via `/code-review`
- [x] Create PR via `/prp-pr`
- [ ] Optional: interactive cross-theme (light/vibrant/vibrant-dark) visual QA once a working browser automation path exists in this environment
