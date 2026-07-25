# Plan: Takvim Görünümü (Calendar View)

## Summary
A month-grid calendar screen showing which day carries which recurring payment, which day is a salary/pay day, and a per-day expense/income cash-flow strip. Tapping a day reveals that day's items. Reached from Settings → Yönetim (management) section, mirroring the existing "Tekrarlayan Ödemeler" sub-route. No new bottom tab (design fixes 5 tabs).

## User Story
As a budget-tracking user, I want a monthly calendar that plots my recurring payments, pay days, and daily cash flow, so that I can see at a glance when money leaves and arrives across the month.

## Problem → Solution
Today payment timing lives only as a flat list in Tekrarlayan Ödemeler and salary timing is invisible after onboarding → a calendar month grid renders due dates, pay days, and a daily net cash-flow line, with a tap-to-expand day detail.

## Metadata
- **Complexity**: Medium
- **Source PRD**: N/A (backlog item `.claude/backlog.md` → "Yeni özellikler P2 — Takvim görünümü.")
- **PRD Phase**: N/A
- **Estimated Files**: 9 (3 create logic/tests, 2 create UI, 1 create screen, 1 create route, 2 update wiring/i18n)

---

## UX Design

### Before
```
Settings → Yönetim
  ┌─────────────────────────────┐
  │ 💼 Gelir Kaynakları       › │
  │ 🔁 Tekrarlayan Ödemeler   › │
  │ 🏷  Kategoriler            › │
  └─────────────────────────────┘
(no way to see WHEN payments hit)
```

### After
```
Settings → Yönetim
  ┌─────────────────────────────┐
  │ 💼 Gelir Kaynakları       › │
  │ 🔁 Tekrarlayan Ödemeler   › │
  │ 🗓  Takvim                 › │   ← NEW
  │ 🏷  Kategoriler            › │
  └─────────────────────────────┘
        │ push /takvim
        ▼
  ┌─────────────────────────────┐
  │ ‹  Temmuz 2026              │   AppBarBackTitle + ‹ › month nav
  │  Pt Sa Ça Pe Cu Ct Pz        │
  │   1  2  3  4  5  6  7        │
  │      •        ▲              │   • = payment due, ▲ = pay day
  │   8  9 10 11 12 13 14        │
  │  ...                         │
  │  [ per-day net cash-flow ]   │   mini bar strip (green up / coral down)
  │  ── selected day 14 Tem ──   │
  │  🔁 Spotify        -59,99 ₺  │   day detail list (RecurringPaymentCard-lite rows)
  │  💼 Maaş        pay day       │
  └─────────────────────────────┘
```

### Interaction Changes
| Touchpoint | Before | After | Notes |
|---|---|---|---|
| Settings mgmt list | 3 rows | 4 rows (Takvim added) | Mirror `InfoRowChevron` at `SettingsScreen.tsx:55-60` |
| Month navigation | none | ‹ / › step month; selected day state | Local `useState`, no server round-trip |
| Day tap | none | selects day → detail list below grid | Pure client filter of expanded events |

---

## Mandatory Reading

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 | `src/lib/aggregate.ts` | 1-90, 195-235 | Date helpers idiom (`startOfDay`, `isSameMonth`, YYYY-MM-DD building), pure-fn + interface export style to mirror in new `lib/calendar.ts` |
| P0 | `src/lib/onboarding.ts` | 1-30 | `toDateString` / clamp-day / month-rollover pattern — reuse for recurrence expansion |
| P0 | `src/screens/RecurringPaymentsScreen.tsx` | all | Screen skeleton to clone: SafeAreaView + ScrollView + AppBarBackTitle + StateView + `useFocusEffect`/`refetch` |
| P0 | `src/organisms/GoalProgressChart.tsx` | all | Themed pure-View chart (no external chart lib) — mirror for the cash-flow strip |
| P1 | `src/app/tekrarlayan-odemeler.tsx` | all | Route file is a 2-line re-export of a screen |
| P1 | `src/app/_layout.tsx` | 178-188 | `Stack.Screen` registration for a full-page sub-route (copy `tekrarlayan-odemeler` block) |
| P1 | `src/screens/SettingsScreen.tsx` | 49-66 | `InfoRowChevron` row to add |
| P1 | `src/store/api/recurringPaymentsApi.ts` + `incomeSourcesApi.ts` + `transactionsApi.ts` | hooks | `useList*Query` hooks feeding the screen |
| P1 | `src/types/database.ts` | 34-112, 192-219 | Exact columns: `income_sources.pay_day`, `recurring_payments.next_payment_date/frequency`, `transactions.occurred_at/type/amount` |
| P2 | `src/molecules/index.ts`, `src/organisms/index.ts`, `src/screens/index.ts` | all | Barrel export pattern for new component/screen |
| P2 | `src/lib/__tests__/aggregate.test.ts` | all | Jest test structure to mirror for `calendar.test.ts` |

## External Documentation
No external research needed — feature uses established internal patterns (RTK Query hooks, themed Views, Intl date formatting via `lib/format.ts`). No new npm deps; `react-native-svg` already present but NOT required (mirror GoalProgressChart's View-based bars).

---

## Patterns to Mirror

### NAMING_CONVENTION
```ts
// SOURCE: src/lib/aggregate.ts:34-52
export interface MonthSummary { income: number; expense: number; net: number; }
export function monthSummary(txns: Transaction[], ref = new Date()): MonthSummary { ... }
// pure fns, camelCase, `ref = new Date()` last param for testability; interfaces exported alongside
```

### DATE_STRING_BUILDING
```ts
// SOURCE: src/lib/aggregate.ts:20-21  &  src/lib/onboarding.ts:1-3
const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
function toDateString(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
// NEVER bare YYYY-MM; always pad; local-time Date fields (getFullYear/getMonth/getDate), not UTC.
```

### START_OF_DAY / DAY_DIFF
```ts
// SOURCE: src/lib/aggregate.ts:200-215
function startOfDay(d: Date): number { return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(); }
const daysLeft = Math.round((due - today) / 86_400_000);
```

### SCREEN_STRUCTURE
```tsx
// SOURCE: src/screens/RecurringPaymentsScreen.tsx:22-70
const theme = useTheme(); const { t } = useTranslation(); const router = useRouter();
const { data = [], isLoading, isError, refetch } = useListRecurringPaymentsQuery();
useFocusEffect(useCallback(() => {
  const handle = requestIdleCallback(() => refetch());
  return () => cancelIdleCallback(handle);
}, [refetch]));
return (
  <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: theme.colors.bgApp }]}>
    <ScrollView contentContainerStyle={[styles.content, { gap: theme.spacing.md }]} showsVerticalScrollIndicator={false}>
      <View style={styles.appBar}><AppBarBackTitle title={...} onBack={() => router.back()} /></View>
      {isLoading ? <StateView variant="loading" /> : isError ? <StateView variant="error" onRetry={refetch} /> : ...}
    </ScrollView>
  </SafeAreaView>
);
```

### THEMED_CHART_COMPONENT
```tsx
// SOURCE: src/organisms/GoalProgressChart.tsx (whole file)
// Bars are plain <View> with computed height; colors from theme.colors.accentTeal / accentTealDim.
// Props are display-ready primitives (label/value/current) — NO domain types inside the organism.
```

### ROUTE_FILE
```tsx
// SOURCE: src/app/tekrarlayan-odemeler.tsx
import { CalendarScreen } from '@/screens';
export default CalendarScreen;
```

### STACK_REGISTRATION
```tsx
// SOURCE: src/app/_layout.tsx:178-188 (tekrarlayan-odemeler block)
<Stack.Screen name="takvim" options={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.bgApp } }} />
```

### TEST_STRUCTURE
```ts
// SOURCE: src/lib/__tests__/aggregate.test.ts
import { calendarMonth } from '../calendar';
describe('calendarMonth', () => {
  it('marks recurring payment on its due day', () => { ... expect(...).toBe(...) });
});
// Fixed `ref`/`today` dates passed in; deterministic; no mocking of Date.
```

---

## Files to Change

| File | Action | Justification |
|---|---|---|
| `src/lib/calendar.ts` | CREATE | Pure logic: build month grid, expand recurrence, mark pay days, per-day net |
| `src/lib/__tests__/calendar.test.ts` | CREATE | Unit tests for recurrence expansion, pay-day marking, month rollover, cash-flow |
| `src/organisms/CalendarMonthCard.tsx` | CREATE | Themed month grid + weekday header + day markers (View-based, mirror GoalProgressChart) |
| `src/organisms/CashFlowStrip.tsx` | CREATE | Per-day net bar strip (green up / coral down) — mirror GoalProgressChart bars |
| `src/screens/CalendarScreen.tsx` | CREATE | Screen: month state, data hooks, grid + strip + day-detail list |
| `src/app/takvim.tsx` | CREATE | Route re-export |
| `src/organisms/index.ts` | UPDATE | Export CalendarMonthCard, CashFlowStrip |
| `src/screens/index.ts` | UPDATE | Export CalendarScreen |
| `src/app/_layout.tsx` | UPDATE | Register `takvim` Stack.Screen |
| `src/screens/SettingsScreen.tsx` | UPDATE | Add `InfoRowChevron` "Takvim" row |
| `src/i18n/locales/tr.json` + `en.json` | UPDATE | Add `calendar.*` + `settings.calendar` keys |

## NOT Building
- No new bottom-nav tab (design fixes 5 tabs; entry is via Settings only).
- No server/API/schema changes — reads existing `recurring_payments`, `income_sources`, `transactions` via existing RTK Query hooks.
- No editing/creating events from the calendar (tap opens read-only day detail; no CRUD).
- No infinite scroll of months / no swipe gestures — only ‹ › step buttons.
- No `react-native-svg` line chart — cash flow rendered as View bars (matches GoalProgressChart precedent).
- No `.pen` design node (this screen is net-new, not in the 13 templates) — follow token/spacing conventions, no pixel-diff.
- No timezone handling beyond existing local-`Date` convention.

---

## Step-by-Step Tasks

### Task 1: `src/lib/calendar.ts` — pure calendar logic
- **ACTION**: Create pure functions + exported interfaces, no React.
- **IMPLEMENT**:
  - `type CalendarMarker = 'payment' | 'payday' | 'expense' | 'income';`
  - `interface CalendarDay { date: string; day: number; inMonth: boolean; isToday: boolean; markers: CalendarMarker[]; net: number; }`
  - `interface CalendarEvent { date: string; kind: 'payment' | 'payday' | 'transaction'; label: string; icon: string; amount: number; sign: -1 | 0 | 1; }`
  - `buildMonthMatrix(year, month, ref = new Date()): CalendarDay[]` — 6×7 = 42 cells, Monday-first (TR week starts Monday), leading/trailing days from adjacent months flagged `inMonth: false`. Use `new Date(year, month, 1).getDay()` then shift so Monday=0: `(firstDow + 6) % 7`.
  - `expandRecurring(payments: RecurringPayment[], year, month): CalendarEvent[]` — for each payment, take `next_payment_date`; if it falls in the target month emit an event; also step BACKWARD/FORWARD by `frequency` to cover earlier/later due dates landing in this month (weekly=+7d, biweekly=+14d, monthly=+1 month clamped via onboarding-style day clamp, yearly=+12 months, one-time=single). Sign = -1 (expense).
  - `payDayEvents(sources: IncomeSource[], year, month): CalendarEvent[]` — for sources with `pay_day != null` and `frequency` in {monthly,biweekly,weekly,yearly}, emit event on clamped `pay_day` of the month (skip `one-time`). Sign = +1.
  - `transactionEvents(txns: Transaction[], year, month): CalendarEvent[]` — filter `occurred_at` in month; sign from `type`.
  - `calendarMonth(args: { recurring; income; txns; year; month; ref }): { days: CalendarDay[]; events: CalendarEvent[] }` — compose: build matrix, gather all events, attach markers + accumulate `net` per in-month day.
  - `eventsForDay(events, dateISO): CalendarEvent[]`.
- **MIRROR**: NAMING_CONVENTION, DATE_STRING_BUILDING, START_OF_DAY (all from `aggregate.ts`); day-clamp + rollover from `onboarding.ts`.
- **IMPORTS**: `import type { RecurringPayment, IncomeSource, Transaction } from '@/types';`
- **GOTCHA**: Build date strings with the local-`Date` + `padStart` idiom — NEVER `new Date(iso).toISOString().slice(0,10)` (UTC shift bug). Clamp `pay_day`/monthly recurrence to `new Date(year, month+1, 0).getDate()` (Feb/31st). Monday-first shift, not Sunday-first.
- **VALIDATE**: `npx tsc --noEmit` clean; functions exported.

### Task 2: `src/lib/__tests__/calendar.test.ts` — unit tests
- **ACTION**: Cover the logic with deterministic fixed dates.
- **IMPLEMENT** cases: (a) 42-cell matrix length + Monday-first alignment for a known month; (b) recurring monthly payment whose `next_payment_date` is in a later month still marks its clamped day this month; (c) weekly recurrence yields multiple in-month days; (d) `pay_day` marks the right day, `one-time` income does not; (e) `pay_day = 31` clamps in a 30-day month; (f) per-day `net` sums income positive / expense negative; (g) transaction on a day appears in `eventsForDay`.
- **MIRROR**: TEST_STRUCTURE from `aggregate.test.ts`; reuse fixtures shape from `src/test/fixtures.ts` if helpful.
- **IMPORTS**: `import { calendarMonth, buildMonthMatrix, eventsForDay } from '../calendar';`
- **GOTCHA**: Pass explicit `ref`/`year`/`month`; never rely on real "now".
- **VALIDATE**: `npm test -- calendar` green.

### Task 3: `src/organisms/CalendarMonthCard.tsx` — month grid
- **ACTION**: Presentational themed component; domain-free props.
- **IMPLEMENT**: Props `{ monthLabel: string; weekdayLabels: string[]; days: CalendarDay[]; selectedDate: string | null; onPrevMonth(): void; onNextMonth(): void; onSelectDay(date: string): void; }`. Header row: ‹ (ButtonIconOnly or Pressable) + `monthLabel` + ›. Weekday header (7 cols). 6 rows × 7 day cells: number colored `textPrimary` if `inMonth` else `textTertiary`; `isToday` → accentTeal ring/bg; `selectedDate` match → filled accent; marker dots row under number (payment=`expenseCoral`, payday=`incomeGreen`, txn=`accentTeal`). Use `theme.spacing`, `theme.radius`, `theme.colors`, `theme.fonts`.
- **MIRROR**: THEMED_CHART_COMPONENT (GoalProgressChart) for container/StyleSheet style; ButtonIconOnly from `@/atoms` for month arrows.
- **IMPORTS**: `import { useTheme } from '@/theme';` `import type { CalendarDay } from '@/lib/calendar';` `import { ButtonIconOnly } from '@/atoms';`
- **GOTCHA**: Keep it pure/presentational — no data hooks inside. `CalendarDay` type import is type-only.
- **VALIDATE**: tsc clean; renders in screen.

### Task 4: `src/organisms/CashFlowStrip.tsx` — daily net bars
- **ACTION**: Mirror GoalProgressChart bar logic for signed values.
- **IMPLEMENT**: Props `{ title: string; values: { day: number; net: number }[]; emptyLabel: string; }`. Zero baseline in middle; positive bars grow up in `incomeGreen`, negative down in `expenseCoral`, scaled to `max(abs(net))`. Empty when all zero.
- **MIRROR**: GoalProgressChart bar height math + empty state.
- **IMPORTS**: `import { useTheme } from '@/theme';`
- **GOTCHA**: Guard divide-by-zero (`max === 0`) exactly like GoalProgressChart.
- **VALIDATE**: tsc clean.

### Task 5: `src/screens/CalendarScreen.tsx` — compose
- **ACTION**: Clone RecurringPaymentsScreen skeleton; add month state + selected day + detail list.
- **IMPLEMENT**:
  - `const [cursor, setCursor] = useState(() => { const n = new Date(); return { year: n.getFullYear(), month: n.getMonth() }; });`
  - `const [selected, setSelected] = useState<string | null>(null);`
  - Data: `useListRecurringPaymentsQuery()`, `useListIncomeSourcesQuery()`, `useListTransactionsQuery()`; combine `isLoading`/`isError`; single `refetch` via `useFocusEffect` (call each, or wrap).
  - `const { days, events } = useMemo(() => calendarMonth({ recurring, income, txns, year: cursor.year, month: cursor.month }), [recurring, income, txns, cursor]);`
  - `monthLabel` via `formatDate(new Date(cursor.year, cursor.month, 1), { month: 'long', year: 'numeric' })` (drop day → pass only month+year).
  - Weekday labels from i18n `calendar.weekdays` (array Pt..Pz).
  - Prev/next handlers adjust `cursor` with month rollover (`month - 1 < 0` → year--, month=11; symmetric).
  - Render `AppBarBackTitle title={t('calendar.title')}`, `CalendarMonthCard`, `CashFlowStrip`, and if `selected` a detail `View` listing `eventsForDay(events, selected)` rows (icon + label + `formatCurrency(amount)`), else a hint / StateView empty.
- **MIRROR**: SCREEN_STRUCTURE (RecurringPaymentsScreen), `formatCurrency`/`formatDate` from `@/lib/format`, StateView usage.
- **IMPORTS**: screens use `@/atoms`, `@/molecules` (StateView), `@/organisms` (AppBarBackTitle, CalendarMonthCard, CashFlowStrip), `@/store/api` hooks, `@/lib/calendar`, `@/lib/format`, `@/theme`, `react-i18next`, `expo-router`.
- **GOTCHA**: `useListIncomeSourcesQuery` hook name — confirm export in `src/store/api/incomeSourcesApi.ts` (pattern identical to recurring). Combine three loading flags; don't block whole screen on one slow query beyond the existing idiom.
- **VALIDATE**: Screen renders; month nav works; tapping a day shows detail.

### Task 6: `src/app/takvim.tsx` — route
- **ACTION**: 2-line re-export.
- **IMPLEMENT**: `import { CalendarScreen } from '@/screens'; export default CalendarScreen;`
- **MIRROR**: ROUTE_FILE (`tekrarlayan-odemeler.tsx`).
- **VALIDATE**: Route resolves at `/takvim`.

### Task 7: Barrels — `src/organisms/index.ts`, `src/screens/index.ts`
- **ACTION**: Add exports for `CalendarMonthCard`, `CashFlowStrip`, `CalendarScreen`.
- **MIRROR**: existing export lines in each barrel.
- **VALIDATE**: `@/organisms` / `@/screens` imports resolve.

### Task 8: `src/app/_layout.tsx` — register route
- **ACTION**: Add a `Stack.Screen name="takvim"` inside the authenticated+onboarded `Stack.Protected` block.
- **IMPLEMENT**: Copy the `tekrarlayan-odemeler` block (full-page, `headerShown: false`, `contentStyle: bgApp`).
- **MIRROR**: STACK_REGISTRATION.
- **GOTCHA**: Place inside the correct `Stack.Protected` (onboarding_completed) group, not the auth/onboarding ones.
- **VALIDATE**: No "screen not registered" warning; navigation works.

### Task 9: `src/screens/SettingsScreen.tsx` — entry point
- **ACTION**: Add `InfoRowChevron` row after Tekrarlayan Ödemeler.
- **IMPLEMENT**:
  ```tsx
  <InfoRowChevron icon="calendar" label={t('settings.calendar')} value="" onPress={() => router.push('/takvim')} />
  ```
- **MIRROR**: `SettingsScreen.tsx:55-60`.
- **GOTCHA**: `icons.ts::getIcon` resolves any lucide name dynamically (kebab→Pascal), so `"calendar"`→`Calendar` works with no registry edit. Confirmed valid.
- **VALIDATE**: Row appears; tap navigates.

### Task 10: i18n — `tr.json` + `en.json`
- **ACTION**: Add `settings.calendar` and a `calendar` block.
- **IMPLEMENT** (tr): `"settings": { ..., "calendar": "Takvim" }`; new block:
  ```json
  "calendar": {
    "title": "Takvim",
    "weekdays": ["Pt","Sa","Ça","Pe","Cu","Ct","Pz"],
    "cashFlow": "Nakit akışı",
    "empty": "Bu ay için kayıt yok",
    "selectHint": "Detay için bir gün seç",
    "payDay": "Maaş günü"
  }
  ```
  Mirror in `en.json` (English strings, weekdays Mon..Sun).
- **MIRROR**: existing `recurringPayments`/`settings` blocks.
- **GOTCHA**: `weekdays` as JSON array — read via `t('calendar.weekdays', { returnObjects: true })` (i18next). Keep TR/EN key sets identical (tests/typing may compare).
- **VALIDATE**: No missing-key warnings; labels render.

---

## Testing Strategy

### Unit Tests (lib/calendar.ts)
| Test | Input | Expected | Edge? |
|---|---|---|---|
| matrix size | year=2026, month=6 | 42 days | no |
| Monday-first | month starting on Wed | first cell = prev-month Mon | yes |
| monthly recurrence forward-ref | next_payment_date 2026-08-15, view July | July 15 marked payment | yes |
| weekly recurrence | weekly, next 2026-07-03 | 3,10,17,24,31 marked | yes |
| pay_day mark | source pay_day=25 monthly | July 25 payday | no |
| one-time income no payday | frequency one-time | no payday marker | yes |
| pay_day clamp | pay_day=31, month=Feb | day 28/29 | yes |
| per-day net | income 100 + expense 40 same day | net = +60 | no |
| eventsForDay | date with 2 events | length 2 | no |

### Edge Cases Checklist
- [x] Empty data (no payments/income/txns) → grid renders, strip empty
- [x] Month rollover Dec→Jan via ‹ › (screen-level; smoke via manual)
- [x] pay_day > days-in-month clamp
- [x] Leap-year Feb
- [ ] Concurrent access — N/A (client read-only)
- [ ] Permission denied — N/A (RLS already governs the shared queries)

---

## Validation Commands

### Static Analysis
```bash
npx tsc --noEmit
```
EXPECT: Zero type errors

### Lint
```bash
npx eslint src/lib/calendar.ts src/organisms/CalendarMonthCard.tsx src/organisms/CashFlowStrip.tsx src/screens/CalendarScreen.tsx
```
EXPECT: Zero errors

### Unit Tests
```bash
npm test -- calendar
```
EXPECT: All calendar tests pass

### Full Test Suite
```bash
npm test
```
EXPECT: 60 existing + new tests pass, no regressions

### Browser/Device Validation
```bash
npm run start   # or npm run android
```
EXPECT: Settings → Takvim opens grid; ‹ › steps months; markers on correct days; tap day shows detail; cash-flow strip renders; light+dark themes ok.

### Manual Validation
- [ ] Settings shows new "Takvim" row with calendar icon
- [ ] Grid is Monday-first, current day highlighted
- [ ] A known recurring payment appears on its due day (coral dot)
- [ ] Salary day (income pay_day) shows green dot + "Maaş günü" in detail
- [ ] Cash-flow strip: expense-heavy day bars down coral, income day up green
- [ ] Prev/next month keeps markers correct, Dec↔Jan rollover works

---

## Acceptance Criteria
- [ ] Calendar reachable from Settings → Takvim
- [ ] Month grid renders recurring due days, pay days, transaction days with distinct markers
- [ ] Per-day cash-flow strip renders signed daily net
- [ ] Tapping a day lists that day's events
- [ ] Month ‹ › navigation with rollover
- [ ] All validation commands pass; new unit tests green; no type/lint errors

## Completion Checklist
- [ ] Pure logic in `lib/calendar.ts`, UI in organisms, composition in screen (matches layering)
- [ ] Date strings built with local-`Date` + padStart idiom (no UTC `toISOString`)
- [ ] Themed via tokens only, works in all 4 modes
- [ ] Tests mirror `aggregate.test.ts` style
- [ ] i18n keys added to BOTH tr + en
- [ ] Route registered in `_layout.tsx`; barrels updated
- [ ] No new bottom tab; no server changes; no `.pen` edits

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| ~~`calendar` icon not mapped~~ | — | — | RESOLVED: `getIcon` resolves lucide names dynamically |
| ~~`useListIncomeSourcesQuery` name differs~~ | — | — | RESOLVED: hook exists in `incomeSourcesApi.ts:73` |
| Recurrence expansion off-by-one at month edges | Med | Med | Unit tests (b–e) pin behavior; reuse onboarding clamp |
| `t(..., { returnObjects: true })` typing for weekday array | Low | Low | Cast to `string[]`; or hardcode weekday array as fallback |
| UTC drift if any `toISOString` slips in | Low | High | Explicit GOTCHA + tests assert local dates |

## Notes
- This screen is net-new (not among the 13 `.pen` templates) — build to token/spacing conventions; skip pixel-diff.
- Entry point chosen = Settings (mirrors Tekrarlayan Ödemeler) to respect the fixed 5-tab bottom nav.
- Cash-flow uses View bars (GoalProgressChart precedent), not `react-native-svg`, to keep scope Medium and dependency-free.
- Data is read-only via existing RTK Query hooks — no API/schema/migration work.
