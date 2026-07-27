# Plan: Hızlı İşlem Şablonları (Quick Transaction Templates)

## Summary
Derive "quick templates" from a user's transaction history — the most-frequently
entered (type + category + note + amount) combinations — and surface them as a
horizontal chip row at the top of the New Transaction sheet. Tapping a chip
prefills every field (type, amount, category, note); the user confirms with the
existing **Kaydet** button. Pure-lib derivation + unit tests, mirroring the
`toCsv` / `filterTransactions` culture. **No DB migration, no new API endpoint.**

## User Story
As a FollowFlow user who logs the same expenses repeatedly (e.g. "Market 500₺"),
I want one-tap templates that prefill a new transaction, so that I don't retype
the amount, category and note every time.

## Problem → Solution
Today every transaction is entered from scratch on the numpad + category chips +
note field. → A derived chip row lets the user tap a frequent past entry to
prefill the whole form in one tap, then confirm.

## Metadata
- **Complexity**: Small–Medium
- **Source PRD**: `.claude/backlog.md` → "Yeni özellikler" → **P2 — Hızlı işlem şablonları**
- **PRD Phase**: standalone backlog item
- **Estimated Files**: 6 (2 new, 4 edited)

---

## UX Design

### Before
```
┌─────────────────────────────┐
│  Yeni İşlem            [x]   │
│  [ Gider | Gelir ]          │
│         ₺0                  │
│  [🛒market][🍔yemek][🚗...]  │  ← category chips
│  📅 Bugün              ›     │
│  ✏️  Not…                    │
│  ── numpad ──               │
│  [    Kaydet    ]           │
└─────────────────────────────┘
```

### After
```
┌─────────────────────────────┐
│  Yeni İşlem            [x]   │
│  [ Gider | Gelir ]          │
│  Hızlı: [🛒 Market ₺500]     │  ← NEW derived template chips (horizontal scroll)
│         [☕ Kahve ₺85] …     │
│         ₺500  (prefilled)   │
│  [🛒market*][🍔yemek][🚗...] │  ← category preselected
│  📅 Bugün              ›     │  ← date stays "today", NOT copied from template
│  ✏️  Market  (prefilled)     │
│  ── numpad ──               │
│  [    Kaydet    ]           │
└─────────────────────────────┘
```

### Interaction Changes
| Touchpoint | Before | After | Notes |
|---|---|---|---|
| New Transaction sheet top | Only type toggle | Type toggle + template chip row (hidden if no templates) | Row omitted entirely when `templates.length === 0` (new users) |
| Tapping a template chip | n/a | Sets type, amountRaw, categoryKey, note | Does NOT set `occurredAt` — new entry defaults to now |
| Edit mode (`id` param present) | n/a | Template row hidden | Prefill would clobber the edited row; only show in create mode |

---

## Mandatory Reading

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 | `src/screens/NewTransactionScreen.tsx` | 50–260 | Host screen: state setters (`setType/setAmountRaw/setCategoryKey/setNote`), chip render block (238–251), `handleSave` payload shape |
| P0 | `src/lib/toCsv.ts` | 1–45 | Canonical pure-lib module style (header comment, `Transaction[]` in, typed out) |
| P0 | `src/lib/__tests__/toCsv.test.ts` | 1–40 | Test style: `txn()` fixture from `@/test/fixtures`, `describe/it`, `@/` alias |
| P1 | `src/test/fixtures.ts` | 10–23 | `txn()` shape — fields available: `type, category, icon, title, note, amount, occurred_at` |
| P1 | `src/molecules/CategoryChip.tsx` | 1–70 | Chip component to reuse for template chips (icon + label + onPress + testID) |
| P1 | `src/lib/useCategories.ts` | all | `byKey(key)` → resolved category (label/icon/color) for rendering a template's category |
| P2 | `src/lib/filterTransactions.ts` | all | Second reference for a pure history-processing helper |
| P2 | `src/i18n/locales/tr.json` / `en.json` | `newTransaction` block (~139) | Where to add the `quickTemplates` label |

## External Documentation
No external research needed — feature uses established internal patterns
(pure lib helper + jest + RTK Query cached list + existing chip molecule).

---

## Patterns to Mirror

### PURE_LIB_MODULE
```ts
// SOURCE: src/lib/toCsv.ts:1-24
import type { Transaction } from '@/types';

// Columns are machine-friendly … (leading explanatory comment)
export function toCsv(
  txns: Transaction[],
  categoryLabel: (txn: Transaction) => string,
): string {
  const rows = txns.map((t) => [ /* … */ ]);
  // …
}
```
→ Mirror: `src/lib/quickTemplates.ts` exports `deriveQuickTemplates(txns, limit?)`,
takes `Transaction[]`, returns a typed array, no React / no I/O.

### TEST_STRUCTURE
```ts
// SOURCE: src/lib/__tests__/toCsv.test.ts:1-22
import { toCsv } from '@/lib/toCsv';
import { txn } from '@/test/fixtures';

describe('toCsv', () => {
  it('starts with a UTF-8 BOM', () => {
    expect(toCsv([], label).startsWith(BOM)).toBe(true);
  });
});
```
→ Mirror: `src/lib/__tests__/quickTemplates.test.ts`, build inputs with
`txn({ category, amount, note, type, occurred_at })`.

### CHIP_RENDER
```tsx
// SOURCE: src/screens/NewTransactionScreen.tsx:238-251
<View style={styles.chips}>
  {categories.map((cat) => (
    <CategoryChip
      key={cat.key}
      icon={cat.icon}
      label={cat.label}
      selected={cat.key === effectiveKey}
      onPress={() => setCategoryKey(cat.key)}
      testID={`tx-category-${cat.key}`}
    />
  ))}
</View>
```
→ Mirror for the template row (horizontal `ScrollView`, `selected={false}`,
`onPress={() => applyTemplate(tpl)}`, `testID={`tx-template-${i}`}`).

### PREFILL_SETTERS + SAVE_PAYLOAD
```tsx
// SOURCE: src/screens/NewTransactionScreen.tsx:70-88, 145-165
const [type, setType] = useState<TxnType>(() => existing?.type ?? 'expense');
const [amountRaw, setAmountRaw] = useState(() => existing ? String(existing.amount) : '');
const [categoryKey, setCategoryKey] = useState(() => existing?.category ?? '');
const [note, setNote] = useState(() => existing?.note ?? '');
// handleSave payload:
const payload = {
  type, category: category.key, icon: category.icon,
  title: trimmedNote || category.label,
  note: trimmedNote || null, amount,
  occurred_at: occurredAt.toISOString(),
};
```
→ `applyTemplate` calls the four setters. `amountRaw` must be the **raw string**
form `String(tpl.amount)` (numpad state is dot-decimal, no grouping — see
`handleKey`). Setting `note` to a non-empty string reproduces the original
`title` on save (since `title = trimmedNote || category.label`).

### CACHED_LIST_SOURCE
```tsx
// SOURCE: src/screens/NewTransactionScreen.tsx:59
const { data: transactions = [] } = useListTransactionsQuery();
```
→ Already fetched on this screen. Feed it straight into `deriveQuickTemplates`
inside a `useMemo`.

---

## Files to Change

| File | Action | Justification |
|---|---|---|
| `src/lib/quickTemplates.ts` | CREATE | Pure `deriveQuickTemplates` + `QuickTemplate` type |
| `src/lib/__tests__/quickTemplates.test.ts` | CREATE | Unit tests for derivation/ranking/dedup |
| `src/screens/NewTransactionScreen.tsx` | UPDATE | Render template chip row + `applyTemplate` (create mode only) |
| `src/i18n/locales/tr.json` | UPDATE | `newTransaction.quickTemplates` = "Hızlı" |
| `src/i18n/locales/en.json` | UPDATE | `newTransaction.quickTemplates` = "Quick" |
| `.claude/backlog.md` | UPDATE | Move item Todo → Done after merge (done at commit stage, not implement) |

## NOT Building
- No new Supabase table / migration / RTK Query endpoint (derivation is client-side over the already-cached list).
- No "save as template" / user-managed templates UI.
- No instant-create-on-tap (tap prefills; user confirms with Kaydet).
- No template row on the Home screen or FAB — only the New Transaction sheet.
- No copying of the template's original date — new entries default to now.
- No persistence/caching of derived templates (recomputed from live list each mount).

---

## Step-by-Step Tasks

### Task 1: Create `src/lib/quickTemplates.ts`
- **ACTION**: New pure module deriving ranked templates from history.
- **IMPLEMENT**:
  ```ts
  import type { Transaction } from '@/types';

  export interface QuickTemplate {
    type: 'income' | 'expense';
    category: string;
    amount: number;
    note: string | null;
    icon: string;
    count: number; // how many past txns collapsed into this template
  }

  // Group identical entries (type+category+amount+normalized note), rank by
  // frequency then recency, return the top `limit`. Pure — no React/I/O.
  export function deriveQuickTemplates(
    txns: Transaction[],
    limit = 5,
  ): QuickTemplate[] { … }
  ```
  Algorithm:
  1. Build a key per txn: `${type}|${category}|${amount}|${(note ?? '').trim()}`.
  2. Accumulate `count`, keep the most-recent `occurred_at` seen and that row's `icon`.
  3. Sort by `count` desc, tie-break by latest `occurred_at` desc.
  4. `slice(0, limit)`, mapping each group to a `QuickTemplate`.
  5. Skip groups with `amount <= 0` (dirty/edge rows).
- **MIRROR**: PURE_LIB_MODULE (leading comment, `Transaction[]` in / typed out).
- **IMPORTS**: `import type { Transaction } from '@/types';`
- **GOTCHA**: `occurred_at` may be a full ISO string OR a `YYYY-MM-DD` (fixtures use the short form) — compare as strings (`a > b` works for both ISO-8601 lexical ordering); don't `new Date()` unnecessarily. Normalize note with `.trim()` and treat `''` === `null` so "same entry" collapses regardless of empty-vs-null note.
- **VALIDATE**: `npm test -- quickTemplates`

### Task 2: Create `src/lib/__tests__/quickTemplates.test.ts`
- **ACTION**: Cover ranking, dedup, limit, edge cases.
- **IMPLEMENT** tests:
  - empty list → `[]`
  - single txn → one template, `count: 1`
  - three identical (type+category+amount+note) → collapsed to one, `count: 3`
  - `note: null` and `note: ''` for otherwise-identical rows collapse together
  - ordering: more-frequent template ranks above a less-frequent one
  - tie in count → more-recent `occurred_at` wins
  - `limit` respected (6 distinct groups, `limit=5` → length 5)
  - `amount <= 0` rows excluded
  - income and expense with same category/amount are **distinct** templates
- **MIRROR**: TEST_STRUCTURE — `import { deriveQuickTemplates } from '@/lib/quickTemplates'; import { txn } from '@/test/fixtures';`
- **IMPORTS**: as above.
- **GOTCHA**: `txn()` default `amount` is `0` — always pass `amount` explicitly in fixtures or rows get filtered out by the `amount <= 0` rule.
- **VALIDATE**: `npm test -- quickTemplates` → all green.

### Task 3: Wire template row into `NewTransactionScreen.tsx`
- **ACTION**: Compute templates and render a horizontal chip row; add `applyTemplate`.
- **IMPLEMENT**:
  - Import: `import { deriveQuickTemplates } from '@/lib/quickTemplates';` and `ScrollView` from `react-native`.
  - After `const { byType, byKey } = useCategories();`:
    ```ts
    const templates = useMemo(
      () => (existing ? [] : deriveQuickTemplates(transactions)),
      [existing, transactions],
    );
    function applyTemplate(tpl: QuickTemplate) {
      setFieldError(undefined);
      setType(tpl.type);
      setAmountRaw(String(tpl.amount));
      setCategoryKey(tpl.category);
      setNote(tpl.note ?? '');
    }
    ```
  - Render between `<SegmentedToggle …/>` and the `<View style={styles.amountArea}>` block:
    ```tsx
    {templates.length > 0 ? (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.templates}
      >
        {templates.map((tpl, i) => (
          <CategoryChip
            key={`${tpl.category}-${tpl.amount}-${i}`}
            icon={tpl.icon}
            label={`${byKey(tpl.category)?.label ?? tpl.category} ${formatAmountInput(String(tpl.amount))}`}
            onPress={() => applyTemplate(tpl)}
            testID={`tx-template-${i}`}
          />
        ))}
      </ScrollView>
    ) : null}
    ```
  - Add `templates: { flexDirection: 'row', gap: 8 }` to `StyleSheet.create`.
- **MIRROR**: CHIP_RENDER + PREFILL_SETTERS.
- **IMPORTS**: `ScrollView` (add to existing `react-native` import), `deriveQuickTemplates`, `type QuickTemplate`.
- **GOTCHA**: `amountRaw` feeds the numpad reducer which expects dot-decimals and NO grouping — pass `String(tpl.amount)` (e.g. `"500"`, `"85.5"`), never a `₺`-formatted string. The chip *label* uses `formatAmountInput` for display only. Reuse `CategoryChip` (don't build a new molecule) to stay in scope.
- **VALIDATE**: `npx tsc --noEmit` clean; manual — enter 3 "Market 500" expenses, reopen sheet, tap chip, verify all fields prefill and date stays "Bugün".

### Task 4: i18n keys
- **ACTION**: Add `quickTemplates` label under `newTransaction` in both locales.
- **IMPLEMENT**: `tr.json` → `"quickTemplates": "Hızlı"`; `en.json` → `"quickTemplates": "Quick"`. (Optional label; only wire in if you add a section heading above the row — otherwise skip and keep the row headingless to match the compact sheet. Decide during impl; default = no heading, so this task may be a no-op.)
- **MIRROR**: existing `newTransaction` block structure.
- **GOTCHA**: keep both locale files key-symmetric — CI/reviewers flag drift.
- **VALIDATE**: `npx tsc --noEmit`; app renders without missing-key warning.

---

## Testing Strategy

### Unit Tests (`quickTemplates.test.ts`)
| Test | Input | Expected | Edge? |
|---|---|---|---|
| empty | `[]` | `[]` | ✓ |
| single | 1 txn amount 500 | `[{count:1,…}]` | |
| dedup frequency | 3× (expense/market/500/"Market") | 1 template, count 3 | |
| null≡empty note | note `null` + note `''`, else identical | collapse to 1 | ✓ |
| ranking | market×3, kahve×1 | market first | |
| recency tie-break | two groups count 2, differing dates | newer first | ✓ |
| limit | 6 distinct groups, limit 5 | length 5 | |
| zero amount excluded | amount 0 rows | not in output | ✓ |
| income vs expense split | same cat/amount, both types | 2 templates | ✓ |

### Edge Cases Checklist
- [x] Empty history → no row rendered (guard `templates.length > 0`)
- [x] Edit mode → row hidden (guard on `existing`)
- [x] `amount <= 0` rows dropped
- [x] note null vs '' unified
- [ ] Very long category label — `CategoryChip` already `numberOfLines={1}`

---

## Validation Commands

### Static Analysis
```bash
npx tsc --noEmit
```
EXPECT: Zero type errors.

### Unit Tests (affected)
```bash
npm test -- quickTemplates
```
EXPECT: All new tests pass.

### Full Test Suite
```bash
npm test
```
EXPECT: No regressions (existing ~60+ tests still green).

### Lint
```bash
npx eslint src/lib/quickTemplates.ts src/lib/__tests__/quickTemplates.test.ts src/screens/NewTransactionScreen.tsx
```
EXPECT: Clean.

### Manual Validation (device/emulator)
- [ ] Fresh account (no txns): New Transaction sheet shows NO template row.
- [ ] Log 3× "Market 500₺" expense → reopen sheet → "Market ₺500" chip appears first.
- [ ] Tap chip → type=Gider, amount=₺500, market category selected, note="Market".
- [ ] Date field still reads "Bugün" (not the old txn's date).
- [ ] Kaydet creates a new transaction correctly.
- [ ] Edit an existing txn (swipe → edit): template row is absent.

---

## Acceptance Criteria
- [ ] `deriveQuickTemplates` implemented, pure, typed.
- [ ] All unit tests pass; full suite green.
- [ ] `npx tsc --noEmit` clean, eslint clean.
- [ ] Template chip row appears (create mode, history ≥1 valid txn), prefills all four fields on tap.
- [ ] Hidden for new users and in edit mode.
- [ ] Matches UX (row above amount, date not copied).

## Completion Checklist
- [ ] Mirrors `toCsv`/`filterTransactions` pure-lib style.
- [ ] Reuses `CategoryChip` (no redundant molecule).
- [ ] No hardcoded strings that should be i18n.
- [ ] No new dependency / migration / endpoint.
- [ ] Locale files stay key-symmetric.
- [ ] Self-contained — no further codebase search needed.

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `amountRaw` fed grouped/₺ string → numpad reducer breaks | Med | Med | Pass `String(tpl.amount)` only; label formatting separate — called out in Task 3 GOTCHA |
| `occurred_at` mixed ISO/short-date breaks sort | Low | Low | Lexical string compare (ISO-8601 sorts correctly both forms) |
| Templates feel noisy if amounts vary slightly | Low | Low | Exact-amount grouping keeps only truly-repeated entries; limit 5 |
| Category resolved label missing (custom/hidden) | Low | Low | `byKey(...)?.label ?? tpl.category` fallback |

## Notes
- Decision (confirmed with user 2026-07-27): **derive from history**, not a
  user-managed template table; **prefill-on-tap**, not instant-create.
- `title` is reconstructed on save via existing `title = trimmedNote || category.label`
  logic — setting `note` to the template's note is sufficient; no `title` state to set.
- Keep the row headingless to match the compact bottom-sheet density; the
  `quickTemplates` i18n key is optional (Task 4 may be a no-op).
- **Confidence: 9/10** — single-pass implementable; only open micro-decision is
  whether to show a section heading (documented as optional).
