# Plan: Veri Dışa Aktarma (CSV Export)

## Summary
Export the user's transactions to a CSV file and hand it to the OS share sheet (save to Files, mail, WhatsApp, etc). A pure `toCsv` helper (unit-tested, mirroring `filterTransactions`) builds the CSV string; a thin `exportCsv` side-effect helper writes it to the cache dir via `expo-file-system` and opens `expo-sharing`. Entry point is a button on the Transactions screen header that exports whatever the current filters produce.

## User Story
As a FollowFlow user, I want to export my transactions as a CSV file, so that I can open them in Excel/Sheets or archive them outside the app.

## Problem → Solution
Transactions live only in-app (Supabase) with no way to get them out → user taps an export button, gets a CSV of the currently-filtered transactions through the native share sheet.

## Metadata
- **Complexity**: Medium
- **Source PRD**: `.claude/backlog.md` (Yeni özellikler → P2)
- **PRD Phase**: standalone backlog item
- **Estimated Files**: ~8 (2 new lib + 1 new test + TransactionsScreen + 2 locale + package.json/app.json + backlog)

---

## UX Design

### Before
```
İşlemler header:  [ İşlemler title ............ (+) ]
No way to get data out of the app.
```

### After
```
İşlemler header:  [ İşlemler title ...... (share) (+) ]
                                              │
                     tap → build CSV from currently-filtered list
                          → OS share sheet (Kaydet / Mail / WhatsApp …)
```
- Export respects the active `filters` (same list the user sees). Empty result → Alert "Dışa aktarılacak işlem yok", no share sheet.
- Share sheet unavailable (rare) → Alert with a friendly message.

### Interaction Changes
| Touchpoint | Before | After | Notes |
|---|---|---|---|
| Transactions header | title + add(+) | title + share + add(+) | share icon left of + |
| Export tap | — | writes CSV to cache, opens share sheet | uses filtered list |
| Empty/error | — | `Alert.alert` | mirrors delete-fail pattern |

---

## Mandatory Reading

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 | `src/lib/filterTransactions.ts` | all | Pure-helper + typed shape pattern to mirror for `toCsv`; also the filter type reused at call site |
| P0 | `src/screens/TransactionsScreen.tsx` | 1-136 | Call site — header (118-127), `filters`/`transactions`/`categoryLabel`, Alert pattern (61-80) |
| P0 | `src/lib/__tests__/filterTransactions.test.ts` | 1-40 | Test structure + `txn` fixture usage to mirror for `toCsv.test.ts` |
| P1 | `src/lib/format.ts` | all | `formatDate`/locale conventions; CSV formatting decisions |
| P1 | `src/test/fixtures.ts` | all | `txn()` fixture factory for the new test |
| P1 | `src/atoms/ButtonIconOnly.tsx` | props | The header button component (icon, variant, size, accessibilityLabel, onPress) |
| P2 | `src/store/api/transactionsApi.ts` | all | Confirms `Transaction` row fields available for columns |
| P2 | `src/i18n/locales/tr.json` | 111-134 | `transactions.*` key block to extend |

## External Documentation

| Topic | Source | Key Takeaway |
|---|---|---|
| expo-file-system (SDK 57) | context7 /expo/expo | New object API: `import { File, Paths } from 'expo-file-system'`. `const file = new File(Paths.cache, 'islemler.csv'); file.create(); file.write(csvString)`. `create()` throws if file exists → delete-if-exists or use `{ overwrite:true }`; simplest: `if (file.exists) file.delete(); file.create(); file.write(csv)`. Use `file.uri` for sharing. |
| expo-sharing | expo docs | `import * as Sharing from 'expo-sharing'`. `await Sharing.isAvailableAsync()` guard, then `await Sharing.shareAsync(file.uri, { mimeType: 'text/csv', dialogTitle, UTI: 'public.comma-separated-values-text' })`. |
| CSV + Excel Turkish locale | general | Excel-TR uses `;` as delimiter when decimal separator is `,`. Keep it simple: use `,` delimiter with `.`-decimal amounts (machine-friendly, unambiguous). Prepend UTF-8 BOM (`﻿`) so Excel renders Turkish chars (ı, ş, ğ) correctly. |

GOTCHA: `expo-file-system` and `expo-sharing` are **not yet installed** — must `npx expo install` both. Both are config-plugin-free (no native rebuild config), but installing native modules means a dev/prod client rebuild is required — plain Expo Go for SDK 57 includes expo-file-system but not necessarily expo-sharing; assume a dev-client rebuild.

---

## Patterns to Mirror

### PURE_HELPER_MODULE (mirror for toCsv)
// SOURCE: src/lib/filterTransactions.ts:1-59
```ts
import type { Transaction } from '@/types';
export interface TransactionFilters { /* typed shape */ }
export function filterTransactions(txns, filters, categoryLabel): Transaction[] { ... }
```
→ `toCsv(txns, categoryLabel)` follows the same shape: typed input, pure, no side effects, category resolved via injected `categoryLabel` (keeps lib decoupled from `useCategories` hook).

### CALL_SITE_HEADER (add share button)
// SOURCE: src/screens/TransactionsScreen.tsx:118-127
```tsx
<View style={styles.header}>
  <AppBarSimpleTitle title={t('transactions.title')} />
  <ButtonIconOnly icon="plus" variant="accent" size={44}
    accessibilityLabel={t('home.addTransaction')} onPress={() => router.push('/yeni-islem')} />
</View>
```

### ALERT_ERROR (empty/unavailable + failure)
// SOURCE: src/screens/TransactionsScreen.tsx:61-80
```tsx
Alert.alert(t('transactions.deleteTitle'), t('transactions.deleteMessage'), [...]);
// simple: Alert.alert(t('transactions.exportEmpty'));
```

### CATEGORY_LABEL injection
// SOURCE: src/screens/TransactionsScreen.tsx:82-85
```tsx
const categoryLabel = useCallback(
  (txn: Transaction) => byKey(txn.category)?.label ?? txn.category, [byKey]);
```
Already computed at call site — reuse it, pass into both `filterTransactions` and `toCsv`.

### TEST_STRUCTURE (mirror for toCsv.test.ts)
// SOURCE: src/lib/__tests__/filterTransactions.test.ts:1-40
```ts
import { txn } from '@/test/fixtures';
const iso = (y,m,d) => `${y}-...T12:00:00`;
const fixtures = [ txn({ id:'a', type:'expense', category:'market', title:'Migros', amount:100, occurred_at: iso(2026,7,10) }), ... ];
// describe/it with expect(...).toBe / toEqual
```

---

## Files to Change

| File | Action | Justification |
|---|---|---|
| `src/lib/toCsv.ts` | CREATE | Pure CSV-string builder + column defs + RFC-4180 field escaping |
| `src/lib/exportCsv.ts` | CREATE | Side-effect helper: write to cache (`expo-file-system`) + open `expo-sharing` |
| `src/lib/__tests__/toCsv.test.ts` | CREATE | Unit tests for header row, escaping, amount/date/type formatting, empty list |
| `src/screens/TransactionsScreen.tsx` | UPDATE | Add share `ButtonIconOnly` in header; `handleExport` wiring filtered list |
| `src/i18n/locales/tr.json` | UPDATE | `transactions.export*` keys |
| `src/i18n/locales/en.json` | UPDATE | Same keys, EN |
| `package.json` | UPDATE | `expo install expo-file-system expo-sharing` adds deps |
| `.claude/backlog.md` | UPDATE (at commit time) | Move item Todo → In Progress → Done per flow |

## NOT Building
- No PDF/Excel(.xlsx) export — that's the separate "Gelişmiş raporlar" P2 item.
- No column-selection UI or export-format options — single fixed CSV schema.
- No date-range picker specific to export — reuses the screen's existing filters.
- No server-side/Supabase export or email delivery — client-side file + native share only.
- No "export all data" (goals, budgets, income) — transactions only, per backlog scope.
- No web (`react-native-web`) download path — mobile share sheet only (guard with `Sharing.isAvailableAsync()`).

---

## Step-by-Step Tasks

### Task 1: Install native deps
- **ACTION**: `npx expo install expo-file-system expo-sharing`
- **VALIDATE**: both appear in `package.json` deps with `~57.x`; `npm run typecheck` still green.
- **GOTCHA**: Requires a dev-client rebuild to run on device; note in commit. Do not hand-edit versions — let `expo install` pick SDK-matched ones.

### Task 2: Create `src/lib/toCsv.ts` (pure)
- **ACTION**: Build the CSV string from transactions.
- **IMPLEMENT**:
  ```ts
  import type { Transaction } from '@/types';

  // Columns are machine-friendly (dot decimals, ISO date) so the file re-imports
  // cleanly; the in-app UI keeps its own TR formatting.
  const HEADERS = ['Tarih', 'Tür', 'Kategori', 'Başlık', 'Not', 'Tutar'] as const;

  function escapeField(value: string): string {
    // RFC 4180: wrap in quotes if it contains comma, quote, CR or LF; double inner quotes.
    if (/[",\r\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
    return value;
  }

  export function toCsv(
    txns: Transaction[],
    categoryLabel: (txn: Transaction) => string,
  ): string {
    const rows = txns.map((t) =>
      [
        t.occurred_at.slice(0, 10), // YYYY-MM-DD
        t.type === 'income' ? 'Gelir' : 'Gider',
        categoryLabel(t),
        t.title,
        t.note ?? '',
        String(t.amount),
      ]
        .map(escapeField)
        .join(','),
    );
    // BOM so Excel reads UTF-8 Turkish chars; CRLF line endings per RFC 4180.
    return '﻿' + [HEADERS.join(','), ...rows].join('\r\n') + '\r\n';
  }
  ```
- **MIRROR**: PURE_HELPER_MODULE.
- **VALIDATE**: covered by Task 3 tests.
- **GOTCHA**: Keep amounts as raw `String(amount)` (dot decimal) — do NOT `formatCurrency` (adds ₺ + `,` decimal → breaks CSV parsing). Turkish labels for `Gelir/Gider` are fine as content.

### Task 3: Create `src/lib/__tests__/toCsv.test.ts`
- **ACTION**: Unit-test `toCsv`.
- **IMPLEMENT** cases:
  - header row present and first (after BOM).
  - BOM prefix `﻿` present.
  - a normal row maps all 6 columns in order.
  - `type` maps income→`Gelir`, expense→`Gider`.
  - `note: null` → empty field.
  - escaping: title with comma → quoted; title with `"` → doubled+quoted; title with newline → quoted.
  - `categoryLabel` injection used for the Kategori column.
  - empty `txns` → BOM + header + trailing CRLF only (no data rows).
- **MIRROR**: TEST_STRUCTURE; use `txn` from `@/test/fixtures` and the `iso()` helper.
- **VALIDATE**: `npm test -- toCsv`.

### Task 4: Create `src/lib/exportCsv.ts` (side effect)
- **ACTION**: Persist CSV to cache and open share sheet.
- **IMPLEMENT**:
  ```ts
  import { File, Paths } from 'expo-file-system';
  import * as Sharing from 'expo-sharing';

  // Returns false when there is nothing to share / sharing unavailable so the
  // caller can surface the right message; throws only on real I/O failure.
  export async function exportTransactionsCsv(
    csv: string,
    filename = 'islemler.csv',
  ): Promise<boolean> {
    if (!(await Sharing.isAvailableAsync())) return false;
    const file = new File(Paths.cache, filename);
    if (file.exists) file.delete();
    file.create();
    file.write(csv);
    await Sharing.shareAsync(file.uri, {
      mimeType: 'text/csv',
      dialogTitle: 'İşlemleri Dışa Aktar',
      UTI: 'public.comma-separated-values-text',
    });
    return true;
  }
  ```
- **MIRROR**: keeps I/O out of `toCsv` (single-responsibility, like the lib split elsewhere).
- **GOTCHA**: `File`/`Paths` is the SDK 54+ object API — NOT the old `FileSystem.writeAsStringAsync`. `create()` throws if the file already exists, hence the `if (file.exists) file.delete()` guard. Not unit-tested (native module); covered by manual validation.

### Task 5: Wire export into `TransactionsScreen.tsx`
- **ACTION**: Add header share button + `handleExport`.
- **IMPLEMENT**:
  - import `toCsv` and `exportTransactionsCsv`.
  - compute the same filtered list the UI shows. Currently only `groups` (grouped) is memoized — extract the flat filtered array:
    ```tsx
    const filtered = useMemo(
      () => filterTransactions(transactions, filters, categoryLabel),
      [transactions, filters, categoryLabel],
    );
    const groups = useMemo(() => groupByDate(filtered), [filtered]);
    ```
  - handler:
    ```tsx
    async function handleExport() {
      if (filtered.length === 0) {
        Alert.alert(t('transactions.exportEmpty'));
        return;
      }
      try {
        const ok = await exportTransactionsCsv(toCsv(filtered, categoryLabel));
        if (!ok) Alert.alert(t('transactions.exportUnavailable'));
      } catch {
        Alert.alert(t('transactions.exportFailed'));
      }
    }
    ```
  - header button (left of the + button):
    ```tsx
    <ButtonIconOnly
      icon="share"
      variant="ghost"
      size={44}
      accessibilityLabel={t('transactions.export')}
      onPress={handleExport}
    />
    ```
    Wrap the two buttons in a `<View style={{ flexDirection:'row', gap:8 }}>` if the header only allows one right-side node.
- **MIRROR**: CALL_SITE_HEADER, ALERT_ERROR.
- **GOTCHA**: Verify `ButtonIconOnly` supports the chosen `icon` name (`share`) and `variant` (`ghost`/`accent`) — check `src/atoms/ButtonIconOnly.tsx` and `src/lib/icons.ts`; if `share` isn't registered, use an available icon like `download` or `upload` and register it the same way existing icons are.

### Task 6: i18n keys
- **ACTION**: Add to the `transactions` block in both locales.
- **IMPLEMENT** (`tr.json`):
  ```json
  "export": "Dışa aktar",
  "exportEmpty": "Dışa aktarılacak işlem yok",
  "exportUnavailable": "Bu cihazda paylaşım kullanılamıyor",
  "exportFailed": "Dışa aktarılamadı. Tekrar dene."
  ```
  `en.json`:
  ```json
  "export": "Export",
  "exportEmpty": "No transactions to export",
  "exportUnavailable": "Sharing is not available on this device",
  "exportFailed": "Export failed. Please try again."
  ```
- **GOTCHA**: Keep the same key set in both files — a missing key surfaces the raw key string in the other language.

---

## Testing Strategy

### Unit Tests
| Test | Input | Expected Output | Edge Case? |
|---|---|---|---|
| header row | any txns | line 1 (post-BOM) = `Tarih,Tür,Kategori,Başlık,Not,Tutar` | no |
| BOM present | any | string starts with `﻿` | no |
| income/expense map | type variants | `Gelir` / `Gider` | no |
| null note | `note:null` | empty field between title and amount | yes |
| comma in title | `title:'Market, ev'` | `"Market, ev"` quoted | yes |
| quote in title | `title:'A "B"'` | `"A ""B"""` | yes |
| newline in title | `title:'a\nb'` | quoted | yes |
| categoryLabel used | custom label fn | Kategori column = label output | yes |
| empty list | `[]` | BOM+header+CRLF, no data rows | yes |

### Edge Cases Checklist
- [x] Empty input (no data rows)
- [x] Fields needing escaping (comma/quote/newline)
- [x] Null optional field (`note`)
- [ ] Very large list — CSV built in-memory; fine for personal-scale data (thousands of rows), not tested.
- [ ] Sharing unavailable — handled at runtime, manual-verified.

---

## Validation Commands

### Static Analysis
```bash
npm run typecheck
```
EXPECT: Zero type errors

### Lint
```bash
npm run lint
```
EXPECT: Clean

### Unit Tests
```bash
npm test -- toCsv
```
EXPECT: All new toCsv tests pass

### Full Test Suite
```bash
npm test
```
EXPECT: No regressions (existing 60+ tests still green)

### Manual Validation (device / dev-client — needs rebuild after Task 1)
- [ ] İşlemler tab → tap share → OS share sheet opens with `islemler.csv`.
- [ ] Save to Files, open → header + rows correct; Turkish chars (ı, ş, ğ) render (BOM works).
- [ ] Apply a category/date filter → export → file contains only filtered rows.
- [ ] Clear all data / filter to zero → tap share → "Dışa aktarılacak işlem yok" alert, no share sheet.
- [ ] Row with a note containing a comma → opens as a single cell in Sheets/Excel.

---

## Acceptance Criteria
- [ ] Share button on Transactions header exports the currently-filtered list.
- [ ] CSV opens correctly in Excel/Sheets with Turkish chars intact.
- [ ] Empty list and unavailable-sharing handled with alerts.
- [ ] `toCsv` unit-tested; all validation commands pass.
- [ ] No type/lint errors; no test regressions.

## Completion Checklist
- [ ] Pure/side-effect split mirrors existing lib conventions
- [ ] Error handling uses `Alert.alert` + i18n keys
- [ ] Tests mirror `filterTransactions.test.ts` + `txn` fixture
- [ ] Both locales updated symmetrically
- [ ] No hardcoded user-facing strings in the screen (all via `t()`)
- [ ] No scope creep (no PDF/xlsx/column-picker)

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `expo-file-system` old-vs-new API confusion | Med | Med | Plan pins the SDK 54+ `File/Paths` object API; `create()`+delete-guard specified |
| Native modules need dev-client rebuild | High | Low | Call out in commit; run `expo install`, rebuild dev client before manual test |
| `share` icon not registered in `icons.ts` | Med | Low | Task 5 gotcha: verify + fall back to `download`/`upload` |
| Excel-TR `;` delimiter expectation | Low | Low | Ship `,`-delimited machine-standard CSV + BOM; documented as intentional |

## Notes
- Design source (`design/design.pen`) has no export screen — this is a header-affordance addition, no new screen. Icon/placement match the existing add(+) button styling.
- CLAUDE.md still says "design only, no source code" — **stale**; full RN codebase exists. Worth updating separately (out of scope here).
- Export reuses the screen's live `filters`, so "export filtered view" comes free — no separate export scope UI.
