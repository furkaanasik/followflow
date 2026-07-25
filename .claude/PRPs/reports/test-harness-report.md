# Implementation Report: Test Harness (jest + jest-expo)

## Summary
Stood up jest + jest-expo unit-test harness and covered the five pure helper modules (`aggregate`, `onboarding`, `amountInput`, `format`, `categories`) with 60 deterministic tests. Found and fixed a real production bug in the process.

## Assessment vs Reality

| Metric | Predicted (Plan) | Actual |
|---|---|---|
| Complexity | Small–Medium | Small–Medium |
| Files Changed | ~9 | 10 (extra: tsconfig.json, onboarding.ts fix) |

## Tasks Completed

| # | Task | Status | Notes |
|---|---|---|---|
| 1 | Install deps | Complete | `jest-expo@~57.0.2`, `jest@~29.7.0`, `@types/jest@29.5.14` via `expo install --dev` |
| 2 | jest.config.js | Complete | |
| 3 | package.json scripts | Complete | `test`, `test:watch` |
| 4 | Shared fixtures | Complete | `src/test/fixtures.ts` — all 6 factories |
| 5 | aggregate.test.ts | Complete | 13 fns, 24 tests |
| 6 | onboarding.test.ts | Complete | Deviated — caught real bug (see below) |
| 7 | amountInput.test.ts | Complete | |
| 8 | format.test.ts | Complete | Deviated — plan's `parseAmount('₺ 1.000')` expectation wrong |
| 9 | categories.test.ts | Complete | |

## Validation Results

| Level | Status | Notes |
|---|---|---|
| Static Analysis (`tsc --noEmit`) | Pass | Needed `"types": ["jest"]` in tsconfig — TS 6.0 didn't auto-include @types/jest globals |
| Unit Tests | Pass | 60 tests, 5 suites |
| Lint (`expo lint`) | Pass | No jest-globals complaints |
| Build | N/A | No build step for Expo dev harness |
| Edge Cases | Pass | Full checklist covered |

## Files Changed

| File | Action |
|---|---|
| `package.json` | UPDATED (deps + scripts) |
| `package-lock.json` | UPDATED |
| `tsconfig.json` | UPDATED (`types: ["jest"]`) |
| `jest.config.js` | CREATED |
| `src/test/fixtures.ts` | CREATED |
| `src/lib/__tests__/aggregate.test.ts` | CREATED |
| `src/lib/__tests__/onboarding.test.ts` | CREATED |
| `src/lib/__tests__/amountInput.test.ts` | CREATED |
| `src/lib/__tests__/format.test.ts` | CREATED |
| `src/lib/__tests__/categories.test.ts` | CREATED |
| `src/lib/onboarding.ts` | UPDATED (bug fix) |

## Deviations from Plan

1. **Production bug found & fixed** — `computeNextPaymentDate` December rollover produced `"2026-13-05"` instead of `"2027-01-05"`: `toDateString(year, month + 1, …)` never normalized month 12. Fixed by routing through `new Date(year, month + 1, 1)` before formatting. Plan assumed "Date normalization" handled it; it didn't.
2. **`parseAmount('₺ 1.000')` expectation corrected** — implementation (documented) treats a lone dot as decimal separator, so result is `1`, not `1000`. Test now uses unambiguous `'₺ 1.000,50'` → `1000.5` and asserts the ambiguous case explicitly.
3. **tsconfig change (unplanned)** — TypeScript 6.0 did not auto-load `@types/jest`; added `"types": ["jest"]`.
4. **TZ hardening** — day-precision fixtures use local-noon ISO strings (`YYYY-MM-DDT12:00:00`, no Z) instead of bare dates, so `bucketFor`/`nextUpcomingPayment` assertions hold in any timezone.

## Issues Encountered
None beyond the deviations above.

## Tests Written

| Test File | Tests | Coverage |
|---|---|---|
| `aggregate.test.ts` | 24 | all 13 exported fns incl. clamps, empty inputs, bucket boundaries |
| `onboarding.test.ts` | 6 | clamp, rollover, same-day, year boundary |
| `amountInput.test.ts` | 10 | numpad state machine + tr-TR formatting |
| `format.test.ts` | 10 | parseAmount TR/plain/NaN/negative + formatter smoke |
| `categories.test.ts` | 5 | selectors + unique-key guard |

## Next Steps
- [ ] Code review via `/code-review`
- [ ] Create PR via `/prp-pr`
