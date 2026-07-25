# Plan: Test Harness (jest + jest-expo)

## Summary
Stand up a unit-test runner for the FollowFlow Expo/RN app using `jest` + `jest-expo`, then cover the pure helper modules that carry the app's finance math and formatting logic. No runner exists today; this is the foundation the rest of the test backlog (E2E, later suites) builds on.

## User Story
As a developer on FollowFlow, I want a working `npm test` that unit-tests the pure helpers, so that I can refactor budget/goal/date math without manually re-smoke-testing every screen.

## Problem → Solution
No test runner in repo, pure finance/format helpers verified only by hand → `jest-expo` harness + deterministic unit tests over `aggregate.ts`, `categories.ts`, `format.ts`, `amountInput.ts`, `onboarding.ts`.

## Metadata
- **Complexity**: Small–Medium
- **Source PRD**: `.claude/backlog.md` (Todo → "Test altyapısı")
- **PRD Phase**: "P1 — Test harness kur (jest + jest-expo)"
- **Estimated Files**: ~9 (1 config, 1 package.json edit, ~5–6 test files, 1 optional fixtures file)

---

## UX Design
Internal change — no user-facing UX transformation. Deliverable is developer tooling (`npm test`).

---

## Mandatory Reading

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 | `src/lib/aggregate.ts` | 1-236 | Primary unit under test; every exported fn is a test target |
| P0 | `src/lib/onboarding.ts` | 1-19 | `computeNextPaymentDate` — clamping + month-rollover edge cases |
| P0 | `src/lib/amountInput.ts` | 1-35 | Numpad state machine — `nextAmountRaw`/`formatAmountInput` |
| P0 | `src/lib/format.ts` | 1-49 | `parseAmount` TR/plain parsing; `formatCurrency`/`formatNumber` |
| P1 | `src/lib/categories.ts` | 119-123 | `categoriesByType`, `categoryByKey` selectors |
| P1 | `src/types/database.ts` | 162-191 | `transactions.Row` shape for building fixtures |
| P1 | `src/types/index.ts` | 1-42 | Entity type exports (`Transaction`, `Budget`, `Goal`, etc.) |
| P2 | `tsconfig.json` | all | `@/*` path alias must be mirrored in Jest `moduleNameMapper` |
| P2 | `package.json` | 44-62 | Where to add `test` script + devDeps; expo `~57.0.7` pins jest-expo major |

## External Documentation

| Topic | Source | Key Takeaway |
|---|---|---|
| jest-expo setup | Expo docs "Unit testing with Jest" (context7 `/expo/expo` if needed) | Use `preset: "jest-expo"`; add `jest`, `jest-expo`, `@types/jest`. Match jest-expo major to SDK major (SDK 57 → `jest-expo@~57`) |
| ts path alias in jest | jest `moduleNameMapper` | Map `^@/(.*)$` → `<rootDir>/src/$1` to honor `@/*` |

> RESEARCH: pure helpers need no RN/native mocks — they only use `Intl` + `Date`. The `jest-expo` preset is still the safe choice (handles TS via babel-preset-expo, keeps door open for component tests later) but these specific suites would even run under plain `ts-jest`. Stick with `jest-expo` for consistency with the Expo toolchain.

---

## Patterns to Mirror

### DETERMINISTIC_TIME
// SOURCE: aggregate.ts:12, 28, 115, 197 — every date-aware fn takes an injectable `ref = new Date()` / `today = new Date()`
```ts
// Do NOT mock global Date. Pass a fixed ref into the fn under test:
const REF = new Date(2026, 6, 15); // 2026-07-15, local time (month is 0-based)
expect(monthSummary(txns, REF)).toEqual({ income: 100, expense: 40, net: 60 });
```
GOTCHA: `new Date(2026, 6, 15)` is LOCAL time; `new Date('2026-07-15')` is UTC midnight and can shift a day depending on TZ. Fixtures and refs must use the same construction style. Prefer the numeric `new Date(y, m, d)` constructor everywhere to stay TZ-agnostic, since the helpers use `getFullYear()/getMonth()/getDate()` (all local).

### FIXTURE_SHAPE
// SOURCE: src/types/database.ts:162-191
```ts
import type { Transaction } from '@/types';
const txn = (over: Partial<Transaction>): Transaction => ({
  id: 'x', user_id: 'u', type: 'expense', category: 'market', icon: 'shopping-cart',
  title: 't', note: null, amount: 0, occurred_at: '2026-07-15',
  created_at: '2026-07-15', updated_at: '2026-07-15', ...over,
});
```
GOTCHA: `occurred_at` is a `string`. `isSameMonth`/`bucketFor` do `new Date(iso)` — a bare `YYYY-MM-DD` parses as UTC. Keep fixture dates and the `ref` in the same month well away from month boundaries (use mid-month day 15) so TZ offset can't flip the assertion.

### PATH_ALIAS
// SOURCE: tsconfig.json paths `@/*` → `./src/*`
```js
// jest.config: moduleNameMapper honors the same alias tests use
moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' }
```

---

## Files to Change

| File | Action | Justification |
|---|---|---|
| `package.json` | UPDATE | Add devDeps (`jest`, `jest-expo`, `@types/jest`) + `"test"`/`"test:watch"` scripts |
| `jest.config.js` | CREATE | `preset: jest-expo`, `moduleNameMapper`, `testMatch` |
| `src/lib/__tests__/aggregate.test.ts` | CREATE | Cover the 12 exported aggregate fns |
| `src/lib/__tests__/onboarding.test.ts` | CREATE | `computeNextPaymentDate` clamp + rollover |
| `src/lib/__tests__/amountInput.test.ts` | CREATE | Numpad state machine |
| `src/lib/__tests__/format.test.ts` | CREATE | `parseAmount` + formatters |
| `src/lib/__tests__/categories.test.ts` | CREATE | selectors |
| `src/test/fixtures.ts` | CREATE (optional) | Shared `txn()`/`budget()`/`goal()` factories |

## NOT Building
- Component / screen render tests (`@testing-library/react-native`) — separate later item.
- E2E (Detox/Maestro) — that's the P2 backlog item, out of scope here.
- Tests for Redux `store/api/*` slices (network-bound) — not "pure".
- Coverage thresholds / CI wiring — not requested; leave scripts CI-ready but don't add gates.
- Mocking Supabase, i18n, or navigation.

---

## Step-by-Step Tasks

### Task 1: Install deps
- **ACTION**: `npx expo install --dev jest-expo` then `npm i -D jest @types/jest`
- **GOTCHA**: Use `expo install` for `jest-expo` so it resolves the SDK-57-compatible version. `expo` is `~57.0.7` → expect `jest-expo@~57`. If `expo install --dev` is unavailable, `npm i -D jest-expo@~57 jest @types/jest`.
- **VALIDATE**: `jest-expo` appears in `devDependencies`; `npx jest --version` prints a version.

### Task 2: Jest config
- **ACTION**: Create `jest.config.js`.
- **IMPLEMENT**:
```js
/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  testMatch: ['**/__tests__/**/*.test.ts?(x)'],
};
```
- **MIRROR**: PATH_ALIAS.
- **GOTCHA**: Default jest-expo `transformIgnorePatterns` are fine; do NOT override them or RN transforms break. These pure suites don't import RN, but keep the preset intact for future component tests.
- **VALIDATE**: `npx jest --listTests` lists the new test files once they exist.

### Task 3: package.json scripts
- **ACTION**: Add `"test": "jest"` and `"test:watch": "jest --watch"` to `scripts`.
- **MIRROR**: existing script style (alphabetical-ish, double-quoted).
- **VALIDATE**: `npm test` runs jest (fails only on missing tests, not config).

### Task 4: (optional) shared fixtures
- **ACTION**: Create `src/test/fixtures.ts` with `txn()`, `budget()`, `goal()`, `incomeSource()`, `recurringPayment()`, `goalContribution()` factory fns using `Partial<T>` overrides.
- **MIRROR**: FIXTURE_SHAPE. Pull exact Row fields from `src/types/database.ts`.
- **IMPORTS**: `import type { Transaction, Budget, Goal, IncomeSource, RecurringPayment, GoalContribution } from '@/types';`
- **GOTCHA**: `budgets.period_month` and `recurring_payments.next_payment_date` are `YYYY-MM-DD` strings; `income_sources.frequency` union includes `'one-time'` (factor 0). Default frequency to `'monthly'`.
- **VALIDATE**: `npx tsc --noEmit` clean (fixtures are type-checked against real Row types).

### Task 5: aggregate.test.ts
- **ACTION**: One `describe` per exported fn. Use fixed `REF = new Date(2026, 6, 15)`.
- **IMPLEMENT** (representative cases):
  - `currentPeriodMonth(new Date(2026,6,15))` → `'2026-07-01'`; single-digit month zero-pads (`new Date(2026,0,5)` → `'2026-01-01'`).
  - `isSameMonth`: same-month true, adjacent-month false.
  - `monthSummary`: mixes income/expense, ignores out-of-month txns, `net = income - expense`; empty → `{0,0,0}`.
  - `expenseByCategory`: sums per category, sorts desc by total, excludes income + out-of-month.
  - `budgetProgress`: case-insensitive category match (`'Market'` budget vs `'market'` txn), `percent` clamped 0–100, `over` true when `spent > limit`, `limit_amount === 0` → percent 0.
  - `monthlyIncomeTotal`: weekly×4, biweekly×2, monthly×1, yearly×(1/12), one-time×0.
  - `nextUpcomingPayment`: picks soonest future (incl. today, daysLeft 0), skips past, empty/all-past → null.
  - `goalPercent`: clamps 100 when current>target; target 0 → 0.
  - `monthlyContributionSeries`: length = months, last item `current:true`, buckets contributions by YYYY-MM, months outside window dropped.
  - `averageMonthlyContribution`: averages only months with total>0; none → 0.
  - `goalProjectionMonths`: `ceil(remaining/rate)`; rate ≤ 0 → null.
  - `bucketFor`: today/yesterday/thisWeek/earlier boundaries relative to REF.
  - `groupByDate`: sorts newest-first, groups in BUCKET_ORDER, omits empty buckets.
- **MIRROR**: DETERMINISTIC_TIME, FIXTURE_SHAPE.
- **GOTCHA**: `nextUpcomingPayment`/`bucketFor` use `startOfDay` on local date — build `next_payment_date`/`occurred_at` as `new Date(2026,6,15)`-derived `YYYY-MM-DD` and pass matching numeric REF. For `thisWeek`, note the boundary is `day > today - 7*oneDay` (6 days back is thisWeek, 7 days back is earlier).
- **VALIDATE**: `npx jest aggregate` green.

### Task 6: onboarding.test.ts
- **ACTION**: Cover `computeNextPaymentDate(dayOfMonth, today)`.
- **IMPLEMENT**:
  - Future day this month: `computeNextPaymentDate(20, new Date(2026,6,15))` → `'2026-07-20'`.
  - Past day → rolls to next month: `(10, new Date(2026,6,15))` → `'2026-08-10'`.
  - Same day (today) → returns today (candidate not `<` today): `(15, new Date(2026,6,15))` → `'2026-07-15'`.
  - Clamp day 31 in a 30-day month.
  - Rollover into a shorter next month re-clamps: `(31, new Date(2026,1,15))` (Feb) forward path uses `daysInNextMonth`.
  - Year boundary: December → January (`month+1` beyond 11 handled by Date normalization).
- **GOTCHA**: month is 0-based in `new Date(y, m, d)`. Output is `${month+1}` zero-padded. `candidate < new Date(year,month,today.getDate())` is a strict `<`, so equal day stays this month.
- **VALIDATE**: `npx jest onboarding` green.

### Task 7: amountInput.test.ts
- **ACTION**: Cover `nextAmountRaw` transitions + `formatAmountInput`.
- **IMPLEMENT**:
  - `''` + `'5'` → `'5'`; `'0'` + `'5'` → `'5'` (no leading zero); `'5'` + `'0'` → `'50'`.
  - `'.'` on empty → `'0.'`; second `'.'` is a no-op; `'12'` + `'.'` → `'12.'`.
  - Max two decimals: `'1.23'` + `'4'` → `'1.23'` (rejected).
  - Max length 12: 12-char string rejects further digits.
  - `'⌫'` removes last char; on `''` stays `''`.
  - `formatAmountInput('')` → `'₺0'`; `formatAmountInput('1234')` → `'₺1.234'` (tr grouping); `formatAmountInput('1234.5')` → `'₺1.234,5'`; trailing dot `'1234.'` → `'₺1.234,'`.
- **GOTCHA**: `formatAmountInput` uses tr-TR grouping (dot thousands, comma decimal) — assert exact `₺` output strings. Depends on ICU in the Node running jest (Node ≥13 full-ICU by default — fine).
- **VALIDATE**: `npx jest amountInput` green.

### Task 8: format.test.ts
- **ACTION**: Cover `parseAmount` (highest-value), plus a formatter smoke each.
- **IMPLEMENT**:
  - `parseAmount('1.234,56')` → `1234.56` (TR: dot grouping, comma decimal).
  - `parseAmount('1234.56')` → `1234.56` (plain, only dot).
  - `parseAmount('1234,56')` → `1234.56` (only comma → decimal).
  - `parseAmount('₺ 1.000')` → `1000` (strips ₺/space).
  - `parseAmount('')` → `NaN`; `parseAmount('abc')` → `NaN`.
  - `parseAmount('-50,5')` → `-50.5`.
  - `formatCurrency(1234.5)` contains `'₺'` and `'1.234,5'`; `formatNumber(1000)` → `'1.000'`.
- **GOTCHA**: `parseAmount('')` must be `NaN` not `0` (comment line 43). Assert with `Number.isNaN(...)`. For `formatCurrency`, prefer `toContain`/regex over full-string equality — Intl currency spacing/symbol placement varies by ICU build.
- **VALIDATE**: `npx jest format` green.

### Task 9: categories.test.ts
- **ACTION**: Cover selectors.
- **IMPLEMENT**:
  - `categoriesByType('income')` → only `type:'income'` entries (maas, freelance, diger_gelir); length 3.
  - `categoriesByType('expense')` → 10 entries.
  - `categoryByKey('market')?.icon` → `'shopping-cart'`; `categoryByKey('nope')` → `undefined`.
  - Guard: every `CATEGORIES` entry has a unique `key` (regression against dup keys).
- **VALIDATE**: `npx jest categories` green.

---

## Testing Strategy

### Unit Tests
| Test | Input | Expected | Edge Case? |
|---|---|---|---|
| monthSummary | mixed in/out-of-month txns, REF | `{income,expense,net}` | out-of-month excluded |
| budgetProgress | 'Market' budget, 'market' txn | matched, percent clamped | case-insensitive, limit 0 |
| monthlyIncomeTotal | one source per frequency | weighted sum | one-time → 0 |
| computeNextPaymentDate | past day-of-month | next month string | month/year rollover, clamp 31 |
| nextAmountRaw | `'1.23'` + `'4'` | `'1.23'` | 2-decimal cap, 12-char cap |
| parseAmount | `'1.234,56'` / `''` | `1234.56` / `NaN` | empty ≠ 0 |

### Edge Cases Checklist
- [ ] Empty arrays → zeroed summaries / `null` / `[]`
- [ ] Month + year boundary in date math
- [ ] Day-of-month clamp (31 in 30/28-day months)
- [ ] `limit_amount` / `target_amount` = 0 (no divide-by-zero)
- [ ] `parseAmount('')` = NaN (not 0)
- [ ] Numpad decimal + length caps

---

## Validation Commands

### Static Analysis
```bash
npx tsc --noEmit
```
EXPECT: Zero type errors (fixtures type-check against real Row types).

### Unit Tests
```bash
npm test
```
EXPECT: All suites pass.

### Lint
```bash
npm run lint
```
EXPECT: No new errors (eslint-config-expo may need jest env; if it flags `describe`/`it` as undef, add `/* eslint-env jest */` or jest plugin — note but don't over-engineer).

### Manual Validation
- [ ] `npm test` from clean checkout after `npm install` runs green.
- [ ] `npm run test:watch` starts watch mode.

---

## Acceptance Criteria
- [ ] `npm test` runs jest via `jest-expo` and passes.
- [ ] All five target modules (`aggregate`, `onboarding`, `amountInput`, `format`, `categories`) have test files.
- [ ] `@/` imports resolve inside tests.
- [ ] `npx tsc --noEmit` clean.
- [ ] Date-dependent tests inject a fixed `ref`/`today` (no reliance on system clock).

## Completion Checklist
- [ ] Tests use injected `ref`/`today`, never mutate global Date
- [ ] Fixtures typed against `src/types` Row types
- [ ] Intl-dependent assertions use `toContain`/regex, not brittle full-string equality
- [ ] No native/RN/Supabase mocks introduced
- [ ] Scripts added; jest-expo version matches SDK 57

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| TZ flips a date assertion | Med | Med | Use numeric `new Date(y,m,d)` + mid-month day 15; match ref construction |
| ICU/Intl output differs across Node | Low | Med | Assert with `toContain`/regex for currency; Node full-ICU default |
| jest-expo version mismatch w/ SDK 57 | Low | High | `expo install --dev jest-expo` resolves compatible version |
| eslint flags jest globals | Low | Low | Add jest env to eslint config if needed |

## Notes
- All five target modules are already side-effect-free and dependency-injected for time — this is why they were "bilerek saf tutuldular" (deliberately kept pure). No production code changes required.
- Highest bug-catching value: `parseAmount`, `nextAmountRaw`, `computeNextPaymentDate`, `budgetProgress` (case-insensitive join is a known footgun documented in aggregate.ts:68-71).
- Keeping the `jest-expo` preset (vs bare ts-jest) costs nothing now and unblocks component tests later without re-configuring.
