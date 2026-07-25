# Plan: Arama + Filtre Geliştirme (Transactions)

## Summary
Extend the İşlemler (Transactions) screen beyond text search + income/expense toggle with three new filters: **date range**, **category** (multi-select), and **amount range**. Filter logic is extracted into a pure, unit-tested helper; the UI is an inline collapsible panel toggled by a header filter button that shows an active-filter count badge.

## User Story
As a FollowFlow user reviewing my transactions,
I want to filter the list by date range, category, and amount range,
So that I can quickly find specific spending/income without scrolling the whole history.

## Problem → Solution
Today the list only supports free-text search + an all/income/expense segmented toggle (`TransactionsScreen.tsx:73-81`). → Add composable date-range, category, and amount-range filters that AND together with the existing search and type filter, driven by one extracted pure function.

## Metadata
- **Complexity**: Medium
- **Source PRD**: `.claude/backlog.md` → "Yeni özellikler → P2 — Arama + filtre geliştirme"
- **PRD Phase**: N/A (flat backlog item)
- **Estimated Files**: 7 (2 new, 5 edit)

---

## UX Design

### Before
```
┌───────────────────────────────┐
│  İşlemler                 [ + ]│
│  ┌─────────────────────────┐  │
│  │ 🔍 İşlem ara…           │  │   ← SearchBar
│  └─────────────────────────┘  │
│  [ Tümü | Gelir | Gider ]     │   ← SegmentedToggle (type)
│  ── Bugün ──                  │
│  transaction rows…            │
└───────────────────────────────┘
```

### After
```
┌───────────────────────────────┐
│  İşlemler          [⚙²] [ + ]  │   ← filter button + count badge (2 active)
│  ┌─────────────────────────┐  │
│  │ 🔍 İşlem ara…           │  │
│  └─────────────────────────┘  │
│  [ Tümü | Gelir | Gider ]     │
│  ┌── Filtreler (collapsible)─┐ │   ← NEW panel, shown when toggled
│  │ Tarih:  [Başlangıç][Bitiş]│ │   ← two date pickers
│  │ Kategori: (chips, multi)  │ │   ← CategoryChip row, multi-select
│  │ Tutar:  [Min ₺] – [Max ₺] │ │   ← two numeric InputFields
│  │            [ Temizle ]    │ │   ← clear-all
│  └───────────────────────────┘ │
│  ── Bugün ──                  │
│  filtered rows…               │
└───────────────────────────────┘
```

### Interaction Changes
| Touchpoint | Before | After | Notes |
|---|---|---|---|
| Header | Only `+` button | `+` plus a filter `ButtonIconOnly` with active-count `BadgeAmount` | Badge hidden when 0 active |
| Below toggle | Nothing | Collapsible filter panel (hidden by default) | Toggled by header filter button |
| List result | search AND type | search AND type AND date AND category AND amount | All filters AND together |
| Empty state | "Henüz işlem yok" | Same component; message unchanged (still `StateView variant="empty"`) | No new empty variant needed |

---

## Mandatory Reading

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 | `src/screens/TransactionsScreen.tsx` | 1-183 | The screen being modified; existing filter+search pattern to extend |
| P0 | `src/lib/aggregate.ts` | 1-60 | Pattern to mirror for the new pure `filterTransactions` lib (naming, `isSameMonth`/`occurred_at` handling, exports) |
| P0 | `src/molecules/CategoryChip.tsx` | all | Reused for multi-select category chips; already supports `selected` + `onPress` |
| P0 | `src/screens/NewTransactionScreen.tsx` | 1-6, 82, 112-118, 285-292 | `DateTimePicker` import + `handleDateChange` + `mode="date"` usage pattern to copy |
| P1 | `src/lib/useCategories.ts` | 1-32 | `all` / `byKey` / `byType` — source of category options |
| P1 | `src/lib/format.ts` | 1-60 | `parseAmount`, `formatDate`, `formatCurrency` for amount inputs & date labels |
| P1 | `src/atoms/InputField.tsx` | all | Numeric min/max amount inputs |
| P1 | `src/atoms/BadgeAmount.tsx` | all | Active-filter count badge on the header button |
| P2 | `src/lib/__tests__/aggregate.test.ts` | all | Test file structure/naming to mirror for `filterTransactions.test.ts` |
| P2 | `src/i18n/locales/tr.json` | `transactions` block (lines ~111-127) | Where to add new i18n keys; `en.json` mirrors it |

## External Documentation
No external research needed — feature uses established internal patterns (`@react-native-community/datetimepicker` already a dependency and used in `NewTransactionScreen.tsx`; RTK Query data already loaded via `useListTransactionsQuery`).

---

## Patterns to Mirror

### NAMING_CONVENTION — pure lib helpers
// SOURCE: src/lib/aggregate.ts:12-35
```ts
export const isSameMonth = (iso: string, ref = new Date()) => { /* ... */ };
export interface MonthSummary { /* ... */ }
export function monthSummary(txns: Transaction[], ref = new Date()): MonthSummary { /* ... */ }
```
→ New file uses same shape: exported `interface TransactionFilters`, exported `function filterTransactions(...)`, exported `function activeFilterCount(...)`.

### EXISTING_FILTER_LOGIC — the code to extend
// SOURCE: src/screens/TransactionsScreen.tsx:73-83
```ts
const q = query.trim().toLowerCase();
const filtered = transactions.filter((txn) => {
  if (typeFilter !== 'all' && txn.type !== typeFilter) return false;
  if (!q) return true;
  const haystack = [txn.title, categoryLabel(txn), txn.note ?? ''].join(' ').toLowerCase();
  return haystack.includes(q);
});
const groups = groupByDate(filtered);
```

### CATEGORY_CHIP_MULTISELECT
// SOURCE: src/molecules/CategoryChip.tsx:9-27 + src/screens/NewTransactionScreen.tsx (category row)
```tsx
<CategoryChip
  icon={cat.icon}
  label={cat.label}
  tint={cat.tint}
  color={cat.color}
  selected={selectedKeys.includes(cat.key)}
  onPress={() => toggleCategory(cat.key)}
/>
```

### DATE_PICKER
// SOURCE: src/screens/NewTransactionScreen.tsx:1-6, 112-118, 285-292
```tsx
import DateTimePicker, { type DateTimePickerChangeEvent } from '@react-native-community/datetimepicker';
function handleDateChange(_event: DateTimePickerChangeEvent, date?: Date) {
  setShowPicker(Platform.OS === 'ios');
  if (date) setFromDate(date);
}
<DateTimePicker value={fromDate ?? new Date()} mode="date" onChange={handleDateChange} />
```

### HEADER_BUTTON
// SOURCE: src/screens/TransactionsScreen.tsx:110-119
```tsx
<ButtonIconOnly icon="plus" variant="accent" size={44}
  accessibilityLabel={t('home.addTransaction')} onPress={() => router.push('/yeni-islem')} />
```

### TEST_STRUCTURE
// SOURCE: src/lib/__tests__/aggregate.test.ts
```ts
import { monthSummary } from '../aggregate';
describe('monthSummary', () => {
  it('sums income and expense for the reference month', () => { /* build fixture txns, assert */ });
});
```

---

## Files to Change

| File | Action | Justification |
|---|---|---|
| `src/lib/filterTransactions.ts` | CREATE | Pure `TransactionFilters` type + `filterTransactions()` + `activeFilterCount()` |
| `src/lib/__tests__/filterTransactions.test.ts` | CREATE | Unit tests for the pure filter helper |
| `src/organisms/TransactionFilterPanel.tsx` | CREATE | Collapsible panel composing date pickers + category chips + amount inputs + clear button |
| `src/organisms/index.ts` | UPDATE | Export the new organism |
| `src/screens/TransactionsScreen.tsx` | UPDATE | Add filter state, header filter button + badge, render panel, apply `filterTransactions` |
| `src/i18n/locales/tr.json` | UPDATE | New keys under `transactions` |
| `src/i18n/locales/en.json` | UPDATE | Mirror the new keys |

## NOT Building
- No new route / bottom-sheet screen — filter panel is inline within `TransactionsScreen` (keeps state local, no expo-router param plumbing). Presentation decision fixed to inline collapsible panel.
- No persistence of filters across app restarts (state is component-local `useState`, resets on unmount — same as current `query`/`typeFilter`).
- No server-side filtering / new RTK Query params — all filtering stays client-side over already-fetched `useListTransactionsQuery()` data (dataset is a personal transaction list, small).
- No saved/named filter presets (that's a separate future item).
- No changes to the type toggle behavior — it stays a top-level control, not moved into the panel.

---

## Step-by-Step Tasks

### Task 1: Create pure filter helper
- **ACTION**: Create `src/lib/filterTransactions.ts`.
- **IMPLEMENT**:
  ```ts
  import type { Transaction } from '@/types';

  export interface TransactionFilters {
    query: string;
    type: 'all' | 'income' | 'expense';
    categoryKeys: string[];      // empty = all categories
    from: string | null;         // ISO date (inclusive, start of day)
    to: string | null;           // ISO date (inclusive, end of day)
    minAmount: number | null;
    maxAmount: number | null;
  }

  export const EMPTY_FILTERS: TransactionFilters = {
    query: '', type: 'all', categoryKeys: [], from: null, to: null,
    minAmount: null, maxAmount: null,
  };

  // haystack needs the resolved category label -> pass a labeler in
  export function filterTransactions(
    txns: Transaction[],
    filters: TransactionFilters,
    categoryLabel: (txn: Transaction) => string,
  ): Transaction[] {
    const q = filters.query.trim().toLowerCase();
    const fromMs = filters.from ? new Date(filters.from).setHours(0, 0, 0, 0) : null;
    const toMs = filters.to ? new Date(filters.to).setHours(23, 59, 59, 999) : null;
    return txns.filter((txn) => {
      if (filters.type !== 'all' && txn.type !== filters.type) return false;
      if (filters.categoryKeys.length && !filters.categoryKeys.includes(txn.category)) return false;
      const t = new Date(txn.occurred_at).getTime();
      if (fromMs !== null && t < fromMs) return false;
      if (toMs !== null && t > toMs) return false;
      if (filters.minAmount !== null && txn.amount < filters.minAmount) return false;
      if (filters.maxAmount !== null && txn.amount > filters.maxAmount) return false;
      if (q) {
        const haystack = [txn.title, categoryLabel(txn), txn.note ?? ''].join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }

  // Count of *advanced* filters active (excludes query + type, which have their own controls)
  export function activeFilterCount(f: TransactionFilters): number {
    let n = 0;
    if (f.categoryKeys.length) n += 1;
    if (f.from || f.to) n += 1;
    if (f.minAmount !== null || f.maxAmount !== null) n += 1;
    return n;
  }
  ```
- **MIRROR**: NAMING_CONVENTION (aggregate.ts), EXISTING_FILTER_LOGIC (haystack build).
- **IMPORTS**: `import type { Transaction } from '@/types';`
- **GOTCHA**: `occurred_at` is a full ISO timestamp (`NewTransactionScreen.tsx:164` writes `.toISOString()`); normalize `to` to end-of-day so an exact-day `to` still includes that day's transactions. Keep `categoryLabel` injected (don't import the `useCategories` hook into a pure lib).
- **VALIDATE**: `npx tsc --noEmit` passes; covered by Task 2 tests.

### Task 2: Unit tests for the filter helper
- **ACTION**: Create `src/lib/__tests__/filterTransactions.test.ts`.
- **IMPLEMENT**: `describe('filterTransactions')` cases: empty filters returns all; type filter; single + multi category; from/to inclusive at day boundaries; min/max amount inclusive; query matches title/label/note; combined filters AND. `describe('activeFilterCount')`: 0 for `EMPTY_FILTERS`, increments per group, category+date+amount = 3. Build fixtures inline (id, type, category, amount, occurred_at, title, note); pass a stub `categoryLabel = (txn) => txn.category`.
- **MIRROR**: TEST_STRUCTURE (`aggregate.test.ts`).
- **IMPORTS**: `import { filterTransactions, activeFilterCount, EMPTY_FILTERS } from '../filterTransactions';`
- **GOTCHA**: Use fixed ISO date strings (e.g. `'2026-07-10T09:00:00.000Z'`) — no `Date.now()`.
- **VALIDATE**: `npm test -- filterTransactions` all green.

### Task 3: Create the filter panel organism
- **ACTION**: Create `src/organisms/TransactionFilterPanel.tsx`.
- **IMPLEMENT**: Props `{ filters: TransactionFilters; onChange: (next: TransactionFilters) => void; onClear: () => void }`. Render inside a `SurfaceCard`:
  - **Date row**: two pressable fields ("Başlangıç"/"Bitiş") each opening a `DateTimePicker` (`mode="date"`), showing `formatDate` or a placeholder; setting updates `from`/`to` (store as `.toISOString()`).
  - **Category row**: horizontal `ScrollView` of `CategoryChip` from `useCategories().all` (filter `!hidden`); `selected={filters.categoryKeys.includes(cat.key)}`; press toggles the key.
  - **Amount row**: two `InputField` (`keyboardType="numeric"`) for min/max; on change call `parseAmount` (or `null` when empty) into `minAmount`/`maxAmount`.
  - **Clear button**: `ButtonSecondary` label `t('transactions.filterClear')` calling `onClear`; render only when `activeFilterCount(filters) > 0`.
  - Section labels via a small `Text` using `theme.fonts.body.semibold` + `theme.colors.textSecondary`; gaps use `theme.spacing`.
- **MIRROR**: CATEGORY_CHIP_MULTISELECT, DATE_PICKER, and theming pattern from `CategoryChip.tsx`/`NewTransactionScreen.tsx`.
- **IMPORTS**: `useTheme`, `useTranslation`, `CategoryChip` (`@/molecules`), `InputField`, `ButtonSecondary`, `SurfaceCard` (`@/atoms`), `DateTimePicker` + type, `useCategories`, `formatDate`, `parseAmount`, `TransactionFilters`, `activeFilterCount`.
- **GOTCHA**: On iOS `DateTimePicker` stays mounted (inline spinner) — gate with a local `showFrom`/`showTo` boolean like `NewTransactionScreen` (`setShow(Platform.OS === 'ios')`). Keep the panel a controlled component (no internal filter state beyond picker visibility) so the screen owns truth.
- **VALIDATE**: `npx tsc --noEmit`; renders without crash when mounted.

### Task 4: Export the organism
- **ACTION**: Add `export * from './TransactionFilterPanel';` to `src/organisms/index.ts`.
- **MIRROR**: existing barrel entries.
- **VALIDATE**: `import { TransactionFilterPanel } from '@/organisms'` resolves.

### Task 5: Wire filters into TransactionsScreen
- **ACTION**: Edit `src/screens/TransactionsScreen.tsx`.
- **IMPLEMENT**:
  - Replace separate `query`/`typeFilter` state with a single `const [filters, setFilters] = useState<TransactionFilters>(EMPTY_FILTERS)` (or keep both and compose — but prefer the unified object for `filterTransactions`). Add `const [panelOpen, setPanelOpen] = useState(false)`.
  - Keep `SearchBar` bound to `filters.query` (`onChangeText={(query) => setFilters((f) => ({ ...f, query }))}`) and `SegmentedToggle` to `filters.type`.
  - Header: add a filter `ButtonIconOnly` (icon e.g. `'sliders-horizontal'` or `'filter'` — confirm the icon exists via `getIcon`; fall back to an available one) with `onPress={() => setPanelOpen((v) => !v)}`; overlay a `BadgeAmount` showing `activeFilterCount(filters)` when `> 0`.
  - Render `{panelOpen && <TransactionFilterPanel filters={filters} onChange={setFilters} onClear={() => setFilters((f) => ({ ...EMPTY_FILTERS, query: f.query, type: f.type }))} />}` below the `SegmentedToggle`.
  - Replace the inline `.filter(...)` block with `const filtered = filterTransactions(transactions, filters, categoryLabel);` (keep `categoryLabel` fn as-is).
- **MIRROR**: HEADER_BUTTON, EXISTING_FILTER_LOGIC.
- **IMPORTS**: add `filterTransactions, activeFilterCount, EMPTY_FILTERS, type TransactionFilters` from `@/lib/filterTransactions`; `TransactionFilterPanel` from `@/organisms`; `BadgeAmount` from `@/atoms`.
- **GOTCHA**: `onClear` should preserve `query` + `type` (those have dedicated controls outside the panel) — only reset the advanced filters, matching `activeFilterCount`'s scope. Header currently is a 2-child flex row (`justifyContent: space-between`); wrap the two right-side buttons in a `View` with `flexDirection: row` + gap so the title stays left.
- **VALIDATE**: Manual — open İşlemler, toggle panel, apply each filter, confirm list narrows and badge count updates.

### Task 6: i18n keys
- **ACTION**: Edit `src/i18n/locales/tr.json` and `en.json`, `transactions` block.
- **IMPLEMENT** (tr): `"filterDate": "Tarih"`, `"filterDateFrom": "Başlangıç"`, `"filterDateTo": "Bitiş"`, `"filterCategory": "Kategori"`, `"filterAmount": "Tutar"`, `"filterAmountMin": "Min"`, `"filterAmountMax": "Maks"`, `"filterClear": "Temizle"`, `"filterButton": "Filtrele"` (accessibility label — `transactions.filter` = "Filtrele" already exists; reuse it for the button `accessibilityLabel` and skip a duplicate if preferred). Mirror English in `en.json` (`"Date"`, `"From"`, `"To"`, `"Category"`, `"Amount"`, `"Min"`, `"Max"`, `"Clear"`, `"Filter"`).
- **MIRROR**: existing `transactions` key style.
- **GOTCHA**: `transactions.filter` = "Filtrele" already present — reuse for the header button label instead of adding `filterButton`.
- **VALIDATE**: `npx tsc --noEmit` (i18n typed via `i18next.d.ts` — new keys must exist in both locales); no missing-key warnings at runtime.

---

## Testing Strategy

### Unit Tests (filterTransactions.test.ts)
| Test | Input | Expected | Edge? |
|---|---|---|---|
| empty filters | `EMPTY_FILTERS`, 3 txns | returns all 3 | — |
| type=expense | mixed txns | only expense | — |
| single category | `categoryKeys:['market']` | only market txns | — |
| multi category | `['market','maas']` | union | — |
| from boundary | `from` = txn's own day 00:00 | includes that txn | ✓ |
| to boundary | `to` = txn's own day (end-of-day applied) | includes that txn | ✓ |
| min/max amount inclusive | `min:100,max:500` | 100 and 500 included | ✓ |
| query on note | query matches only `note` | matched | — |
| combined AND | type+category+amount together | intersection only | ✓ |
| activeFilterCount | category+date+amount set | `3` | — |
| activeFilterCount empty | `EMPTY_FILTERS` | `0` | ✓ |

### Edge Cases Checklist
- [ ] Empty transaction list → empty result, no crash
- [ ] `from` > `to` (user inverts range) → yields empty result (acceptable; no validation error)
- [ ] Amount inputs with non-numeric text → `parseAmount` yields `null`, treated as unset
- [ ] Category deleted/hidden after selection → key simply matches nothing (no crash)
- [ ] Panel open + type toggle change → list stays consistent

---

## Validation Commands

### Static Analysis
```bash
npx tsc --noEmit
```
EXPECT: Zero type errors

### Lint
```bash
npx eslint src/lib/filterTransactions.ts src/organisms/TransactionFilterPanel.tsx src/screens/TransactionsScreen.tsx
```
EXPECT: Clean

### Unit Tests
```bash
npm test -- filterTransactions
```
EXPECT: All new tests pass

### Full Test Suite
```bash
npm test
```
EXPECT: No regressions (existing 75+ tests still green)

### Manual Validation
- [ ] İşlemler tab → filter button visible in header, badge hidden at 0
- [ ] Tap filter button → panel expands below toggle
- [ ] Pick date range → list narrows to that range
- [ ] Select 2 categories → only those categories show
- [ ] Enter min/max amount → list respects bounds
- [ ] Badge shows correct active count (1–3)
- [ ] "Temizle" resets advanced filters, keeps search text + type toggle
- [ ] Search + type + advanced filters combine (AND)
- [ ] Cross-theme: panel readable in dark + light (token-based colors)

---

## Acceptance Criteria
- [ ] Date range, category (multi), amount range filters work and AND with existing search + type
- [ ] Active-filter count badge accurate
- [ ] `filterTransactions` + `activeFilterCount` unit-tested
- [ ] No type errors, no lint errors
- [ ] Full suite passes

## Completion Checklist
- [ ] Pure helper mirrors `aggregate.ts` conventions
- [ ] UI reuses `CategoryChip`, `InputField`, `ButtonSecondary`, `SurfaceCard`, `DateTimePicker`, `BadgeAmount`
- [ ] i18n keys in both `tr.json` and `en.json`
- [ ] Filter state local (no persistence), matching existing `query`/`type` behavior
- [ ] Tests follow `__tests__` pattern
- [ ] Backlog item moved to Done after merge

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Chosen filter icon name not in `getIcon` map | Medium | Low | Verify against `src/lib/icons.ts`; fall back to an existing icon |
| iOS inline DateTimePicker layout in a collapsible panel | Medium | Low | Copy the `Platform.OS === 'ios'` show-gating from `NewTransactionScreen` |
| Panel height pushes list far down on small screens | Low | Low | Panel is collapsible (hidden by default); it lives inside the existing `ScrollView` |

## Notes
- Presentation decision: **inline collapsible panel** (not a `formSheet` route) — avoids expo-router param round-tripping for filter state and keeps parity with the current local-state search/type pattern. If a bottom-sheet is later preferred, the pure `filterTransactions` helper is unaffected (UI-only swap).
- `activeFilterCount` deliberately excludes `query`/`type` since those have always-visible controls; the badge signals *hidden* (advanced) filters only.
