# Plan: Raporlar — Trend + Kategori Isı Haritası

## Summary
New "Raporlar" screen reached from Settings (Ayarlar → Yönetim). Shows a monthly/yearly income-expense trend chart (segmented toggle) plus a category heatmap (month × category expense intensity). Pure aggregation over existing transactions; reuses the established View/SVG chart pattern; **no new dependencies**.

## User Story
As a budget-tracking user, I want a reports screen with income/expense trends and a category heatmap, so that I can see how my spending moves over time and which categories run hot in which months.

## Problem → Solution
Today totals/breakdowns exist only for the *current* month (HomeScreen). → A dedicated multi-period Reports screen with over-time trend and a category-by-month heatmap.

## Metadata
- **Complexity**: Medium
- **Source PRD**: N/A (backlog item `.claude/backlog.md` → "P2 — Raporlar: trend + kategori ısı haritası", eski "Gelişmiş raporlar" böl 1/3)
- **PRD Phase**: N/A
- **Estimated Files**: ~10 (3 CREATE lib/test, 2 CREATE organisms, 1 CREATE screen, 1 CREATE route, 4 UPDATE: barrels, _layout, SettingsScreen, i18n ×2)

---

## UX Design

### Before
```
Ayarlar → Yönetim
  Gelir Kaynaklarım
  Tekrarlayan Ödemeler
  Takvim
  Kategoriler
(no reports anywhere; over-time data invisible)
```

### After
```
Ayarlar → Yönetim
  ...
  Raporlar        ← NEW row (icon bar-chart-2) → push('/raporlar')

Raporlar screen (AppBar ← geri):
 ┌───────────────────────────────┐
 │ [ Aylık | Yıllık ]  toggle    │
 │ TrendChart (income/expense    │
 │   grouped bars per period)    │
 ├───────────────────────────────┤
 │ Kategori Isı Haritası         │
 │  cat rows × month cols grid,  │
 │  cell tint = expense intensity│
 └───────────────────────────────┘
```

### Interaction Changes
| Touchpoint | Before | After | Notes |
|---|---|---|---|
| Settings/Management list | 4 rows | 5 rows (+ Raporlar) | mirror existing `InfoRowChevron` rows |
| Trend period | none | segmented Aylık/Yıllık | `SegmentedToggle`, local state |
| Heatmap | none | month × category grid | tap = none (read-only v1) |

---

## Mandatory Reading

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 | `src/lib/aggregate.ts` | 1-160 | Aggregation idioms: `isSameMonth`, `expenseByCategory`, `monthlyContributionSeries` (window-builder to mirror exactly), padded YYYY-MM keys |
| P0 | `src/organisms/GoalProgressChart.tsx` | all | Bar-chart View pattern (max→height scaling, empty state, theme tokens) — TrendChart mirrors this |
| P0 | `src/screens/CalendarScreen.tsx` | 1-115 | Full-screen-from-Settings pattern: RTK query fetch, `useFocusEffect` refetch, `StateView` loading/error, `AppBarBackTitle`, `useMemo` aggregation |
| P0 | `src/screens/HomeScreen.tsx` | 70-97 | Category → slice mapping: `CHART_PALETTE[index]`, `byKey(cat)?.label`, `formatCurrency` |
| P1 | `src/lib/color.ts` | 1-30 | `withAlpha(hex, alphaHex)` for heatmap cell tint; `CHART_PALETTE` |
| P1 | `src/molecules/SegmentedToggle.tsx` | 18-40 | Toggle props (`options[{label,value}]`, `value`, `onChange`) |
| P1 | `src/app/_layout.tsx` | Stack.Screen "takvim" block | Route registration pattern (headerShown:false, bgApp) |
| P1 | `src/screens/SettingsScreen.tsx` | 49-72 | `InfoRowChevron` row pattern in Management section |
| P1 | `src/lib/categories.ts` | 126-166 | `ResolvedCategory` shape: `.label`, `.color?`, `.key`, `.type` |
| P2 | `src/lib/__tests__/aggregate.test.ts` | all | Test structure to mirror for `reports.test.ts` |
| P2 | `src/organisms/CashFlowStrip.tsx` | all | Alt dual-direction bar reference |

## External Documentation
No external research needed — feature uses established internal patterns (RN Views + `react-native-svg` already in deps, RTK Query, i18next).

---

## Patterns to Mirror

### NAMING_CONVENTION
```ts
// SOURCE: src/lib/aggregate.ts — camelCase pure fns, exported interfaces, padded month keys
export interface MonthSummary { income: number; expense: number; net: number; }
const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
```

### WINDOW_BUILDER (mirror for trend series)
```ts
// SOURCE: src/lib/aggregate.ts:monthlyContributionSeries — build N buckets back from ref, index by key, fold rows in
for (let i = months - 1; i >= 0; i--) {
  const d = new Date(ref.getFullYear(), ref.getMonth() - i, 1);
  series.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, /*...*/ current: i === 0 });
}
const byKey = new Map(series.map((m) => [m.key, m]));
for (const row of rows) { const b = byKey.get(keyOf(row)); if (b) b.total += row.amount; }
```

### BAR_CHART_ORGANISM
```tsx
// SOURCE: src/organisms/GoalProgressChart.tsx
const max = Math.max(...bars.map((b) => b.value), 0);
const isEmpty = max === 0;
// height: Math.max(MIN_BAR_HEIGHT, (bar.value / max) * MAX_BAR_HEIGHT)
// container: borderRadius theme.radius.md, bg theme.colors.bgSurface, padding/gap from theme.spacing
// empty → textTertiary emptyLabel
```

### SCREEN_FETCH_AGGREGATE
```tsx
// SOURCE: src/screens/CalendarScreen.tsx
const txnsQuery = useListTransactionsQuery();
const isLoading = txnsQuery.isLoading; const isError = txnsQuery.isError;
useFocusEffect(useCallback(() => {
  const h = requestIdleCallback(() => txnsQuery.refetch());
  return () => cancelIdleCallback(h);
}, [txnsQuery.refetch]));
const data = useMemo(() => aggregate(txnsQuery.data ?? []), [txnsQuery.data]);
// render: <StateView variant="loading" /> / variant="error" onRetry={refetch} / else content
```

### SLICE_COLOR_LABEL
```tsx
// SOURCE: src/screens/HomeScreen.tsx:79-87
label: byKey(slice.category)?.label ?? slice.category,
color: CHART_PALETTE[index],
amount: formatCurrency(slice.total),
```

### SETTINGS_ROW
```tsx
// SOURCE: src/screens/SettingsScreen.tsx:61-66
<InfoRowChevron icon="calendar" label={t('settings.calendar')} value="" onPress={() => router.push('/takvim')} />
```

### ROUTE_FILE
```tsx
// SOURCE: src/app/takvim.tsx
import { CalendarScreen } from '@/screens';
export default CalendarScreen;
```

### TEST_STRUCTURE
```ts
// SOURCE: src/lib/__tests__/aggregate.test.ts — fixed ref Date, hand-built Transaction[], describe/it, exact-number expects
```

---

## Files to Change

| File | Action | Justification |
|---|---|---|
| `src/lib/reports.ts` | CREATE | Pure aggregation: trend series (monthly/yearly) + category heatmap |
| `src/lib/__tests__/reports.test.ts` | CREATE | Unit tests for the pure fns |
| `src/organisms/TrendChart.tsx` | CREATE | Grouped income/expense bar chart over periods |
| `src/organisms/CategoryHeatmap.tsx` | CREATE | Month × category intensity grid |
| `src/screens/ReportsScreen.tsx` | CREATE | Screen: toggle + TrendChart + CategoryHeatmap |
| `src/app/raporlar.tsx` | CREATE | Expo Router route → ReportsScreen |
| `src/app/_layout.tsx` | UPDATE | Register `Stack.Screen name="raporlar"` (mirror takvim) |
| `src/screens/index.ts` | UPDATE | `export * from './ReportsScreen'` |
| `src/organisms/index.ts` | UPDATE | export TrendChart + CategoryHeatmap |
| `src/screens/SettingsScreen.tsx` | UPDATE | Add Raporlar `InfoRowChevron` row |
| `src/i18n/locales/tr.json` | UPDATE | `settings.reports` + `reports` block |
| `src/i18n/locales/en.json` | UPDATE | same keys, English |

## NOT Building
- No PDF/Excel export (separate P3 backlog item böl 2/3).
- No "Wrapped" year-end summary (P3 böl 3/3).
- No new charting library (`react-native-svg` + Views only).
- No tapping/drill-down on heatmap cells or trend bars (read-only v1).
- No date-range picker; fixed windows (last 6 months monthly / last 3 years yearly).
- No income heatmap — heatmap is expense-only (matches `expenseByCategory` semantics).

---

## Step-by-Step Tasks

### Task 1: Aggregation lib — `src/lib/reports.ts`
- **ACTION**: Create pure aggregation module.
- **IMPLEMENT**:
  - `export interface TrendPoint { key: string; label: string; income: number; expense: number; net: number; current: boolean; }` (label filled by caller/i18n OR store monthIndex/year like `MonthContribution` and let screen format — prefer storing `monthIndex`/`year` for monthly and `year` for yearly, screen formats label. Mirror `MonthContribution` which exposes `monthIndex`/`year`.)
  - `export function monthlyTrend(txns: Transaction[], months = 6, ref = new Date()): TrendPoint[]` — window-builder mirroring `monthlyContributionSeries`; per bucket accumulate income vs expense by `txn.type`; net = income − expense. Use same padded `YYYY-MM` key; include `monthIndex`, `year`, `current`.
  - `export function yearlyTrend(txns: Transaction[], years = 3, ref = new Date()): TrendPoint[]` — buckets by calendar year (`YYYY` key, `year` field), same income/expense fold.
  - `export interface HeatmapCell { monthKey: string; category: string; total: number; }`
  - `export interface Heatmap { months: { key: string; monthIndex: number; year: number }[]; categories: string[]; cells: Map<string, number>; max: number; }` where cells key = `${monthKey}|${category}`. Only expense txns. `categories` = distinct expense categories present in window, sorted by total desc (mirror `expenseByCategory` sort). `max` = largest single cell (for intensity normalization).
  - `export function categoryHeatmap(txns: Transaction[], months = 6, ref = new Date()): Heatmap`.
- **MIRROR**: WINDOW_BUILDER, NAMING_CONVENTION.
- **IMPORTS**: `import type { Transaction } from '@/types';`
- **GOTCHA**: Month key MUST be padded `YYYY-MM` (never bare) — see aggregate.ts header comment. Use `txn.occurred_at` (not `created_at`), and `txn.type` / `txn.amount` / `txn.category` (confirmed fields in HomeScreen/aggregate usage). Bucket membership: compare year+month from `new Date(occurred_at)`, not string prefix (timezone-safe, matches `isSameMonth`).
- **VALIDATE**: `npx tsc --noEmit` clean; used by Task 2 tests.

### Task 2: Tests — `src/lib/__tests__/reports.test.ts`
- **ACTION**: Create unit tests.
- **IMPLEMENT**: Fixed `ref = new Date(2026, 6, 15)`. Hand-build `Transaction[]` (minimal shape — copy field set from `aggregate.test.ts`). Cover: monthlyTrend bucket count = months; income/expense/net split; `current` flag on last bucket; txn outside window excluded; yearlyTrend year bucketing; categoryHeatmap `max`, distinct categories sorted desc, expense-only (income ignored), empty input → empty categories & max 0.
- **MIRROR**: TEST_STRUCTURE.
- **GOTCHA**: `testMatch` = `**/__tests__/**/*.test.ts?(x)` — filename must end `.test.ts`.
- **VALIDATE**: `npm test -- reports` all pass.

### Task 3: Organism — `src/organisms/TrendChart.tsx`
- **ACTION**: Create grouped bar chart.
- **IMPLEMENT**: Props `{ title: string; points: { label: string; income: number; expense: number; current: boolean }[]; emptyLabel: string; incomeLabel: string; expenseLabel: string }`. Per slot render two thin bars side by side (income = `theme.colors.incomeGreen`, expense = `theme.colors.expenseCoral`), height scaled by shared `max = Math.max(...all income&expense, 0)`. Empty state when max===0. Bottom label row (period label, `current` → accentTeal/textTertiary). Small legend (two dots) using income/expense labels.
- **MIRROR**: BAR_CHART_ORGANISM (GoalProgressChart) + CashFlowStrip dual-color.
- **IMPORTS**: `import { StyleSheet, Text, View } from 'react-native'; import { useTheme } from '@/theme';`
- **GOTCHA**: Scale income and expense against the SAME max so bars are comparable. Guard divide-by-zero (max 0 → empty).
- **VALIDATE**: tsc clean; renders in screen.

### Task 4: Organism — `src/organisms/CategoryHeatmap.tsx`
- **ACTION**: Create month × category intensity grid.
- **IMPLEMENT**: Props `{ title: string; months: { key: string; label: string }[]; rows: { category: string; label: string; cells: { key: string; total: number; intensity: number }[] }[]; emptyLabel: string }` (intensity 0–1 precomputed by screen, or pass raw + max and compute here — prefer compute in screen to keep organism dumb). Layout: header row of month labels; each category row = label (left, fixed width, numberOfLines 1) + cells. Cell = square `View`, `backgroundColor: withAlpha(theme.colors.accentTeal, alphaHex)` where `alphaHex` from intensity → byte hex (`Math.round(intensity*255).toString(16).padStart(2,'0')`); intensity 0 → `theme.colors.bgSurfaceAlt`. Empty state when rows empty.
- **MIRROR**: theme-token styling from GoalProgressChart; `withAlpha` from color.ts.
- **IMPORTS**: `withAlpha` from `@/lib/color`, `useTheme`, RN primitives.
- **GOTCHA**: `withAlpha` just concatenates hex + 2-char alpha — accentTeal token must be 6-digit `#RRGGBB` (it is). Clamp alpha to a legible floor (e.g. min `0x22` for nonzero cells) so faint cells stay visible; keep exact-zero cells on `bgSurfaceAlt`. Horizontal overflow with 6+ months: wrap grid in `ScrollView horizontal` OR keep months ≤6 fixed-flex. Default months=6 fits 390px; use flex cells (no scroll) for v1.
- **VALIDATE**: tsc clean; visible in both light/dark (token-based).

### Task 5: Screen — `src/screens/ReportsScreen.tsx`
- **ACTION**: Create the screen.
- **IMPLEMENT**: `SafeAreaView` + `AppBarBackTitle title={t('reports.title')} onBack={() => router.back()}` + `ScrollView`. `useListTransactionsQuery()`, `useFocusEffect` refetch (SCREEN_FETCH_AGGREGATE). `useCategories()` for `byKey`. Local `useState<'monthly'|'yearly'>('monthly')`. `SegmentedToggle` options Aylık/Yıllık. `useMemo`: `points` from `monthlyTrend`/`yearlyTrend`, mapped to `{label, income, expense, current}` — monthly label via `formatDate(new Date(year, monthIndex, 1), { month:'short', day:undefined, year:undefined })`, yearly label = `String(year)`. `useMemo`: heatmap → rows with `label: byKey(cat)?.label ?? cat`, month labels via formatDate short, intensity = `total / (max||1)`. Loading → `<StateView variant="loading" />`; error → `<StateView variant="error" onRetry={refetch} />`; else render TrendChart + CategoryHeatmap. If no transactions at all, organisms show their own emptyLabel.
- **MIRROR**: CalendarScreen structure end-to-end.
- **IMPORTS**: expo-router `useRouter`,`useFocusEffect`; react `useCallback,useMemo,useState`; react-i18next; RN + safe-area; `@/organisms` (AppBarBackTitle, TrendChart, CategoryHeatmap); `@/molecules` (StateView, SegmentedToggle); `@/lib/reports`, `@/lib/format`, `@/lib/useCategories`; `@/store/api` useListTransactionsQuery; `@/theme`.
- **GOTCHA**: heatmap month window & trend monthly window should share `months=6` so labels line up. `formatDate` signature: `formatDate(date, opts)` — confirm opts pass-through (used in CalendarScreen with `{day:undefined,month:'long',year:'numeric'}`).
- **VALIDATE**: tsc clean; navigable.

### Task 6: Route + barrels
- **ACTION**: Wire routing.
- **IMPLEMENT**:
  - `src/app/raporlar.tsx`: `import { ReportsScreen } from '@/screens'; export default ReportsScreen;`
  - `src/screens/index.ts`: add `export * from './ReportsScreen';`
  - `src/organisms/index.ts`: add `export * from './TrendChart';` and `export * from './CategoryHeatmap';`
  - `src/app/_layout.tsx`: add inside the authenticated `Stack.Protected` block, mirroring `takvim`:
    ```tsx
    <Stack.Screen name="raporlar" options={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.bgApp } }} />
    ```
- **MIRROR**: ROUTE_FILE; _layout takvim block.
- **VALIDATE**: tsc clean; route resolves.

### Task 7: Settings entry
- **ACTION**: Add Raporlar row.
- **IMPLEMENT**: In `SettingsScreen.tsx` Management section (after Kategoriler or before), add:
  ```tsx
  <InfoRowChevron icon="bar-chart-2" label={t('settings.reports')} value="" onPress={() => router.push('/raporlar')} />
  ```
- **MIRROR**: SETTINGS_ROW.
- **GOTCHA**: icon resolved via `getIcon` (lucide-react-native) — use a valid lucide name (`bar-chart-2` exists). Verify icon renders; fall back to `bar-chart` / `trending-up` if not.
- **VALIDATE**: row visible, taps navigate.

### Task 8: i18n
- **ACTION**: Add strings to `tr.json` and `en.json`.
- **IMPLEMENT**:
  - `settings.reports`: TR "Raporlar" / EN "Reports".
  - New `reports` block (both files):
    ```json
    "reports": {
      "title": "Raporlar",              // EN "Reports"
      "trend": "Gelir–Gider Trendi",    // EN "Income–Expense Trend"
      "monthly": "Aylık",               // EN "Monthly"
      "yearly": "Yıllık",               // EN "Yearly"
      "income": "Gelir",                // EN "Income"
      "expense": "Gider",               // EN "Expense"
      "heatmap": "Kategori Isı Haritası", // EN "Category Heatmap"
      "empty": "Rapor için yeterli veri yok" // EN "Not enough data for a report"
    }
    ```
- **GOTCHA**: Keep both locale files structurally identical (i18next); insert `reports` block near `calendar` block. Valid JSON (trailing commas break the bundler).
- **VALIDATE**: `npm test` (bundle loads); no missing-key warnings at runtime.

---

## Testing Strategy

### Unit Tests (`reports.test.ts`)
| Test | Input | Expected | Edge? |
|---|---|---|---|
| monthlyTrend length | 6 months | 6 buckets | |
| monthly income/expense split | mixed txns in ref month | income & expense summed separately, net = diff | |
| current flag | any | only last bucket `current: true` | |
| out-of-window excluded | txn 8 months ago | not counted | ✓ |
| yearlyTrend bucketing | txns across 3 years | per-year totals | |
| heatmap expense-only | income + expense same cell | income ignored | ✓ |
| heatmap max | known cells | max = largest cell | |
| heatmap categories sorted | multi-cat | desc by total | |
| empty input | `[]` | trend zeros, heatmap categories `[]`, max 0 | ✓ |

### Edge Cases Checklist
- [x] Empty transactions → organism empty states
- [x] Single category / single month
- [x] Income-only data → heatmap empty, trend shows income bars
- [ ] Very large amounts → bar scaling stays bounded (max normalization handles)
- [x] Month rollover at year boundary (window builder uses Date math, not string)

---

## Validation Commands

### Static Analysis
```bash
npx tsc --noEmit
```
EXPECT: Zero type errors

### Lint
```bash
npx eslint src/lib/reports.ts src/organisms/TrendChart.tsx src/organisms/CategoryHeatmap.tsx src/screens/ReportsScreen.tsx
```
EXPECT: Clean

### Unit Tests
```bash
npm test -- reports
```
EXPECT: All new tests pass

### Full Suite
```bash
npm test
```
EXPECT: No regressions (existing ~100+ tests still green)

### Manual Validation (device/emulator)
- [ ] Ayarlar → Raporlar navigates
- [ ] Toggle Aylık/Yıllık swaps trend data
- [ ] Trend bars show income (green) + expense (coral) scaled sensibly
- [ ] Heatmap cells darken with higher expense; empty months faint
- [ ] Back button returns to Settings
- [ ] Light + dark theme both legible

---

## Acceptance Criteria
- [ ] Reports screen reachable from Settings → Management
- [ ] Monthly & yearly trend render with correct aggregation
- [ ] Category heatmap renders month × category expense intensity
- [ ] All validation commands pass; no type/lint errors
- [ ] New unit tests written and passing
- [ ] Matches existing chart visual language (theme tokens, no new deps)

## Completion Checklist
- [ ] Follows aggregate.ts window-builder + HomeScreen slice patterns
- [ ] RTK Query fetch + StateView error/loading like CalendarScreen
- [ ] i18n both locales, structurally identical
- [ ] No hardcoded colors (theme tokens / CHART_PALETTE / withAlpha)
- [ ] Route + both barrels + _layout updated
- [ ] No scope creep (no export, no drill-down)

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Heatmap horizontal overflow on small screens | Med | Low | Fixed months=6 flex cells fit 390px; horizontal ScrollView if widened later |
| lucide icon name `bar-chart-2` invalid | Low | Low | Fall back to `trending-up`/`bar-chart`; getIcon tolerant |
| `withAlpha` needs 6-digit hex; a theme token is 8-digit | Low | Med | Use accentTeal (6-digit) for cells; verify token length |
| formatDate opts signature differs from assumption | Low | Low | Confirmed via CalendarScreen usage before implementing |

## Notes
- **CLAUDE.md is stale** — it claims the repo is design-only, but a full Expo/React Native + Redux Toolkit + Supabase app exists (`src/`). Follow the real codebase, not that doc. Consider refreshing CLAUDE.md separately.
- Reuse `months=6` window for both trend-monthly and heatmap so period labels align.
- Keep organisms "dumb": screen precomputes labels, colors, intensity; organisms only render.
