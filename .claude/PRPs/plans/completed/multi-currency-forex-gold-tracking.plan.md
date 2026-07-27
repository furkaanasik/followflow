# Plan: Çoklu Para Birimi + Döviz/Altın Takibi

## Summary
Add multi-currency support across FollowFlow: every money-bearing entity (transactions, income sources, recurring payments, goals, budgets, goal contributions) carries a `currency`; the profile carries a `main_currency` used for all reporting/aggregation. Foreign amounts (USD, EUR, gram gold) convert to the main currency via FX rates pulled from a free public API, snapshotted into a Supabase `fx_rates` cache table for offline + historical consistency. A new Portfolio/Holdings view summarizes balances per unit.

## User Story
As a Turkish user who saves in USD/EUR/gram gold, I want to record amounts and goals in those units and see everything rolled up into one reporting currency, so that I can track my true net position across currencies without doing conversion math by hand.

## Problem → Solution
Today every amount is implicitly TRY (`format.ts:2` `const CURRENCY = 'TRY'`, all `numeric` columns, all aggregation sums raw `amount`). → Each amount gains an explicit `currency`; a pure conversion layer + cached FX rates let the app display native amounts and roll them up into the user's chosen `main_currency`.

## Metadata
- **Complexity**: XL (cross-cutting; ~25 files, phased)
- **Source PRD**: N/A (backlog item)
- **PRD Phase**: "P2 — Çoklu para birimi + döviz/altın takibi" (backlog.md:30)
- **Estimated Files**: ~25 (4 phases)
- **Decisions locked with user**: scope = **full multi-currency**; rate source = **free FX API** (with cached snapshot + offline fallback)

---

## Scope & Phasing

Because this is XL, implement in 4 sequential phases. Each phase is independently shippable/typecheckable and leaves the app fully working (defaults keep pre-existing rows on TRY, so no behavioral regression until the UI opts into other currencies).

- **Phase A — Currency dimension (data + pure core).** Migrations add `currency` to money tables + `main_currency` to profiles; supported-unit constants; `lib/currency.ts` pure conversion helpers + tests; `format.ts` parameterized. No network, no UI wiring yet. App still behaves as TRY-only.
- **Phase B — FX rates (fetch + cache + offline).** `fx_rates` cache table; external free-API fetch; `fxApi` RTK Query endpoint; Redux/persist cache; `useRates()` selector. Gram-gold conversion handled here.
- **Phase C — Input UI.** Currency picker on New Transaction / New Goal / New Income Source / New Recurring Payment / New Budget forms; `AmountDisplay` + all `formatCurrency` call sites become currency-aware.
- **Phase D — Rollup + Portfolio.** `main_currency` setting in Ayarlar; aggregation (`aggregate.ts`, `reports.ts`) converts to main currency; new Portfolio/Holdings screen (balances per unit + total in main currency).

The `/prp-implement` run may execute all four in one pass, but validate (typecheck + test) at each phase boundary.

---

## UX Design

### Before
```
New Transaction sheet          Home / Reports / Goals
┌───────────────────┐          ┌─────────────────────┐
│  ₺ 1.234,56       │          │ Net: ₺ 12.500,00    │
│  [category] [note]│          │ (raw sum of amount) │
└───────────────────┘          └─────────────────────┘
All amounts implicitly TRY.
```

### After
```
New Transaction sheet             Home / Reports / Goals
┌────────────────────────┐        ┌──────────────────────────┐
│  [₺ TRY ▾]  1.234,56    │        │ Net: ₺ 12.500,00 (main)  │
│  segmented: TRY USD EUR │        │ converted from mixed cur │
│           GRAM ALTIN    │        └──────────────────────────┘
└────────────────────────┘        New: Portfolio screen
Goal can be "$ 5.000 USD".         ┌──────────────────────────┐
                                   │ TRY 4.200 · USD 300      │
                                   │ EUR 120 · 15 gr altın    │
                                   │ ─ Toplam: ₺ 28.940 ─     │
                                   └──────────────────────────┘
```

### Interaction Changes
| Touchpoint | Before | After | Notes |
|---|---|---|---|
| Amount entry (all forms) | Bare numpad, TRY | Currency selector + numpad | Default = profile `main_currency` |
| Amount display everywhere | `formatCurrency(x)` → ₺ | `formatCurrency(x, currency)` → correct symbol/unit | Gram gold shows `12,5 gr` |
| Home/Reports/Budgets totals | Raw sum | Sum after converting each row to `main_currency` | Needs rates loaded |
| Ayarlar | — | "Ana para birimi" row + "Varlıklarım" (Portfolio) row | New `InfoRowChevron` entries |
| Offline / rate fetch fails | N/A | Uses last cached rates; badge "kur güncel değil" | Never blocks entry |

---

## Mandatory Reading

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 | `src/store/api/baseApi.ts` | 1-32 | `ApiError`/`toApiError`, `tagTypes` — add `FxRate` tag + `fxApi` endpoint here |
| P0 | `src/store/api/transactionsApi.ts` | all | Canonical injectEndpoints CRUD pattern to mirror for `fxApi` |
| P0 | `src/store/api/profileApi.ts` | 1-70 | `getProfile`/`updateProfile` — extend for `main_currency` |
| P0 | `src/lib/format.ts` | 1-49 | Parameterize `formatCurrency`; `parseAmount` stays |
| P0 | `src/lib/aggregate.ts` | all | Every sum fn must convert to main currency in Phase D |
| P0 | `supabase/migrations/20260720000000_goal_contributions.sql` | all | Migration + RLS + SECURITY INVOKER RPC style to mirror |
| P1 | `src/types/database.ts` | 1-242 | Add `currency` to Row/Insert of money tables + `main_currency` to profiles + `fx_rates` table + `main_currency` type |
| P1 | `src/types/index.ts` | all | Add `FxRate` type exports |
| P1 | `src/screens/NewGoalScreen.tsx` | 1-70 | Form state pattern; add currency state + selector |
| P1 | `src/lib/reports.ts` | all | `monthlyTrend`/`yearlyTrend`/`categoryHeatmap` need conversion in Phase D |
| P1 | `src/lib/__tests__/reports.test.ts` | 1-30 | Test structure + `@/test/fixtures` `txn()` helper to mirror |
| P2 | `src/atoms/AmountDisplay.tsx` | all | Preformatted-string atom; keep contract, feed currency-aware strings |
| P2 | `src/screens/SettingsScreen.tsx` | 45-80 | `InfoRowChevron` + `router.push` pattern for new rows |
| P2 | `src/molecules/SegmentedToggle.tsx` | all | Reusable control for currency selection |
| P2 | `src/store/api/index.ts` | all | Barrel — export new hooks |

## External Documentation

| Topic | Source | Key Takeaway |
|---|---|---|
| Free forex rates (no key) | `https://open.er-api.com/v6/latest/TRY` | Returns `{ rates: { USD, EUR, ... } }` relative to base; no API key; generous free tier. Primary source. |
| Alt (with symbols incl. gold) | `https://api.exchangerate.host/latest?base=TRY&symbols=USD,EUR,XAU` | `XAU` = 1 troy ounce gold. Some endpoints now need a free key — treat as fallback only. |
| Gram gold conversion | derived | 1 troy ounce = 31.1034768 g. `pricePerGram = pricePerOunce / 31.1034768`. Store gram-gold as its own unit `GAU`; convert via the ounce rate. **GOTCHA below.** |

```
KEY_INSIGHT: open.er-api.com gives currency rates keyed to a base with no auth.
APPLIES_TO: Phase B fxApi fetch.
GOTCHA: It does NOT provide gold. Gold (XAU ounce) must come from exchangerate.host
        (or a second call). If gold source is unavailable, gram-gold conversion must
        degrade gracefully (show native gram amount, exclude from main-currency total,
        surface "altın kuru yok" note) rather than crash or zero out.

KEY_INSIGHT: The app has been fully offline/Supabase-only; there is NO existing fetch/network layer.
APPLIES_TO: Phase B — this is the first external HTTP call in the app.
GOTCHA: Use global fetch (RN provides it). Wrap in try/catch → ApiError. Persist last-good
        rates so a failed/absent network never blocks amount entry or display.
```

---

## Patterns to Mirror

### NAMING_CONVENTION — pure lib fn, named export, typed interface
```ts
// SOURCE: src/lib/aggregate.ts:28-40
export interface MonthSummary { income: number; expense: number; net: number; }
export function monthSummary(txns: Transaction[], ref = new Date()): MonthSummary { ... }
```

### ERROR_HANDLING — plain ApiError, never a class
```ts
// SOURCE: src/store/api/baseApi.ts:11-16 + transactionsApi.ts:19-24
if (error) return { error: toApiError(error) };
return { data };
```

### RTK_QUERY_ENDPOINT — injectEndpoints + tags
```ts
// SOURCE: src/store/api/transactionsApi.ts:15-27
export const transactionsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listTransactions: builder.query<Transaction[], void>({
      queryFn: async () => { /* supabase call */ },
      providesTags: ['Transaction'],
    }),
  }),
});
```

### MIGRATION — table + index + RLS + SECURITY INVOKER
```sql
-- SOURCE: supabase/migrations/20260720000000_goal_contributions.sql:1-18
create table public.goal_contributions ( ... amount numeric(12,2) not null check (amount > 0), ... );
alter table public.goal_contributions enable row level security;
create policy "goal_contributions_all_own" on public.goal_contributions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

### FORM_STATE — useState-per-field, existing-row hydration
```ts
// SOURCE: src/screens/NewGoalScreen.tsx:52-58
const [targetRaw, setTargetRaw] = useState(() => existing ? String(existing.target_amount) : '');
```

### TEST_STRUCTURE — describe/it + fixtures + local-noon ISO
```ts
// SOURCE: src/lib/__tests__/reports.test.ts:1-24
import { txn } from '@/test/fixtures';
const REF = new Date(2026, 6, 15);
describe('monthlyTrend', () => { it('...', () => { expect(...).toMatchObject({...}); }); });
```

### SETTINGS_ROW — InfoRowChevron + router.push
```tsx
// SOURCE: src/screens/SettingsScreen.tsx:73-78
<InfoRowChevron ... onPress={() => router.push('/raporlar')} />
```

---

## Files to Change

### Phase A
| File | Action | Justification |
|---|---|---|
| `supabase/migrations/2026XXXX_multi_currency.sql` | CREATE | Add `currency text not null default 'TRY'` to transactions, income_sources, recurring_payments, goals, budgets, goal_contributions; `main_currency text not null default 'TRY'` to profiles; CHECK constraint to supported set |
| `src/types/database.ts` | UPDATE | Add `currency` to Row/Insert/Update of each money table; `main_currency` to profiles; `CurrencyCode` union |
| `src/lib/currency.ts` | CREATE | `SUPPORTED_CURRENCIES`, `CurrencyCode`, `convert(amount, from, to, rates)`, `symbolFor`, `isGold` pure helpers |
| `src/lib/__tests__/currency.test.ts` | CREATE | Unit tests for convert (same-cur identity, cross-cur, gram-gold, missing-rate) |
| `src/lib/format.ts` | UPDATE | `formatCurrency(value, currency = 'TRY', opts)` — symbol/precision per unit; gram gold → `"12,5 gr"` |
| `src/lib/__tests__/format.test.ts` | UPDATE | Cover new currency arg |

### Phase B
| File | Action | Justification |
|---|---|---|
| `supabase/migrations/2026XXXX_fx_rates.sql` | CREATE | `fx_rates` cache table (base, quote, rate numeric(18,6), as_of date) + RLS (shared read) or public read |
| `src/store/api/fxApi.ts` | CREATE | `getRates` query: fetch external API, upsert snapshot to `fx_rates`, fall back to cached row |
| `src/store/api/baseApi.ts` | UPDATE | Add `'FxRate'` to `tagTypes` |
| `src/store/api/index.ts` | UPDATE | Export `useGetRatesQuery` |
| `src/lib/currency.ts` | UPDATE | `RatesTable` type; gram-gold via ounce rate |
| `src/types/index.ts` | UPDATE | `FxRate` type |

### Phase C
| File | Action | Justification |
|---|---|---|
| `src/molecules/CurrencySelector.tsx` | CREATE | Segmented/pill selector over `SUPPORTED_CURRENCIES` (wrap `SegmentedToggle`) |
| `src/molecules/index.ts` | UPDATE | Barrel |
| `src/screens/NewTransactionScreen.tsx` | UPDATE | currency state + selector + pass to insert |
| `src/screens/NewGoalScreen.tsx` | UPDATE | currency state + selector |
| `src/screens/NewIncomeSourceScreen.tsx` | UPDATE | currency state + selector |
| `src/screens/NewRecurringPaymentScreen.tsx` | UPDATE | currency state + selector |
| `src/screens/NewBudgetScreen.tsx` | UPDATE | currency state + selector |
| All 12 `formatCurrency` call sites | UPDATE | Pass row `currency` |

### Phase D
| File | Action | Justification |
|---|---|---|
| `src/lib/aggregate.ts` | UPDATE | Sum fns accept `convertTo`+`rates`, convert each row before summing |
| `src/lib/__tests__/aggregate.test.ts` | UPDATE | Cover mixed-currency conversion |
| `src/lib/reports.ts` | UPDATE | Convert before bucketing |
| `src/lib/portfolio.ts` | CREATE | `holdingsByCurrency(rows)`, `totalInMainCurrency(...)` pure fns |
| `src/lib/__tests__/portfolio.test.ts` | CREATE | Tests |
| `src/screens/PortfolioScreen.tsx` | CREATE | Holdings-per-unit + total card |
| `src/screens/index.ts` | UPDATE | Barrel |
| `src/app/varliklarim.tsx` | CREATE | Route → PortfolioScreen |
| `src/app/_layout.tsx` | UPDATE | Register route in Stack |
| `src/screens/SettingsScreen.tsx` | UPDATE | "Ana para birimi" picker + "Varlıklarım" row |
| `src/i18n/locales/{tr,en}.json` | UPDATE | All new keys, both locales |

## NOT Building
- Multi-currency **per split** within a single transaction (one currency per row only).
- Historical rate backfill for existing rows (they stay TRY; conversion uses current snapshot).
- User-editable manual rate override (API-only this iteration; manual entry is a possible future item).
- Crypto or currencies beyond TRY / USD / EUR / gram gold (`GAU`).
- Realtime/streaming rates; refresh is on-demand + on app focus, cached.

---

## Step-by-Step Tasks

### Task A1: Migration — currency columns
- **ACTION**: New migration adding `currency` to the 6 money tables + `main_currency` to profiles.
- **IMPLEMENT**: `alter table public.transactions add column currency text not null default 'TRY';` (repeat per table) + `add constraint ..._currency_check check (currency in ('TRY','USD','EUR','GAU'))`. `alter table public.profiles add column main_currency text not null default 'TRY' ...check...`.
- **MIRROR**: MIGRATION pattern.
- **GOTCHA**: `default 'TRY'` is what keeps all existing rows valid + the app regression-free. Keep column name identical (`currency`) across tables so lib code is uniform.
- **VALIDATE**: `npx supabase db diff` mentally / apply via `mcp__supabase__apply_migration`; `list_tables` shows new columns.

### Task A2: Types
- **ACTION**: Extend `database.ts` Row/Insert/Update for each money table with `currency: string` (Insert optional) and profiles `main_currency`.
- **IMPLEMENT**: Add `export type CurrencyCode = 'TRY' | 'USD' | 'EUR' | 'GAU';` in `lib/currency.ts` (single source), reference as `string` in DB types.
- **MIRROR**: existing database.ts shape.
- **VALIDATE**: `npm run typecheck`.

### Task A3: `lib/currency.ts` + tests
- **ACTION**: Pure conversion core.
- **IMPLEMENT**:
  ```ts
  export type CurrencyCode = 'TRY' | 'USD' | 'EUR' | 'GAU';
  export const SUPPORTED_CURRENCIES: CurrencyCode[] = ['TRY', 'USD', 'EUR', 'GAU'];
  export const isGold = (c: CurrencyCode) => c === 'GAU';
  export interface RatesTable { base: 'TRY'; rates: Partial<Record<CurrencyCode, number>>; asOf: string; }
  // rates.rates[X] = units of X per 1 TRY? Choose: value of 1 unit of X in TRY (clearer). Document it.
  export function convert(amount: number, from: CurrencyCode, to: CurrencyCode, rates: RatesTable): number | null;
  export function symbolFor(c: CurrencyCode): string; // ₺ $ € "gr"
  ```
- **GOTCHA**: Define rate direction ONCE in a comment ("`rates.rates[c]` = value of 1 unit of `c` expressed in TRY; TRY itself = 1") and honor it everywhere. `convert` returns `null` when a needed rate is missing (esp. gold) — callers decide fallback, never NaN.
- **MIRROR**: NAMING_CONVENTION, TEST_STRUCTURE.
- **VALIDATE**: `npm test currency`.

### Task A4: `format.ts` parameterize
- **ACTION**: `formatCurrency(value, currency: CurrencyCode = 'TRY', opts)`.
- **IMPLEMENT**: For fiat use `Intl.NumberFormat(locale,{style:'currency',currency})`; for `GAU` use `formatNumber(value,{maximumFractionDigits:2}) + ' gr'` (no ISO currency). Keep default `'TRY'` so unchanged call sites keep working until updated.
- **GOTCHA**: `GAU` is not an ISO 4217 code — passing it to `style:'currency'` throws. Branch on `isGold` first.
- **VALIDATE**: `npm test format`, `npm run typecheck`.

### Task B1: `fx_rates` migration
- **ACTION**: Cache table for snapshots.
- **IMPLEMENT**: `create table public.fx_rates (id uuid pk default gen_random_uuid(), quote text not null, rate numeric(18,6) not null, as_of date not null, created_at timestamptz default now(), unique(quote, as_of));` base implied TRY. RLS: authenticated read for all (rates aren't per-user) — `for select using (auth.role() = 'authenticated')`, insert via endpoint.
- **MIRROR**: MIGRATION pattern (note: not user-scoped — adjust policy accordingly, document why).
- **VALIDATE**: apply migration; `list_tables`.

### Task B2: `fxApi` endpoint
- **ACTION**: Fetch external rates, snapshot, expose to app.
- **IMPLEMENT**: `getRates: builder.query<RatesTable, void>` — `fetch('https://open.er-api.com/v6/latest/TRY')` for USD/EUR; second try for gold ounce (exchangerate.host XAU) → derive `GAU` = ounceInTRY / 31.1034768. Upsert into `fx_rates`. On fetch failure, `select` latest cached rows from `fx_rates` and build `RatesTable`. Wrap all in try/catch → `toApiError`. `providesTags: ['FxRate']`.
- **MIRROR**: RTK_QUERY_ENDPOINT, ERROR_HANDLING.
- **GOTCHA**: First network code in the app — no shared fetch helper exists, inline it. Rates fetched relative to TRY base; store "value of 1 unit in TRY" = `1 / rates[X]` if API gives X-per-TRY (er-api gives quote-per-base, i.e. USD per 1 TRY → invert). Verify direction against a live sample and unit-test the inversion.
- **VALIDATE**: `npm run typecheck`; manual: log fetched table on device.

### Task B3: rates hook wiring
- **ACTION**: `useGetRatesQuery` triggered at app root + on focus; expose `useRates()` convenience returning `{ rates, stale }`.
- **VALIDATE**: device — rates load; airplane mode → cached still returns.

### Task C1: `CurrencySelector` molecule
- **ACTION**: Selector over `SUPPORTED_CURRENCIES`.
- **IMPLEMENT**: Wrap `SegmentedToggle` (or pill row) mapping code→`symbolFor`; controlled `value`/`onChange`. Theme tokens only.
- **MIRROR**: molecule barrel + `SegmentedToggle`.
- **VALIDATE**: `npm run typecheck`; renders in all 4 themes.

### Task C2: forms add currency
- **ACTION**: Add `currency` state (default profile `main_currency`) + `<CurrencySelector>` to the 5 New* forms; include in insert/update payload.
- **MIRROR**: FORM_STATE (`NewGoalScreen.tsx:52`).
- **GOTCHA**: Hydrate from `existing?.currency ?? mainCurrency` on edit.
- **VALIDATE**: create a USD goal → row has `currency:'USD'`.

### Task C3: currency-aware display
- **ACTION**: Update all 12 `formatCurrency` call sites to pass the row's `currency`.
- **GOTCHA**: `AmountDisplay` takes a preformatted string — format upstream, don't change the atom's contract.
- **VALIDATE**: `npm run typecheck`; grep no bare `formatCurrency(` with single arg where a currency is available.

### Task D1: aggregation converts to main currency
- **ACTION**: `monthSummary`, `expenseByCategory`, `budgetProgress`, `monthlyIncomeTotal`, reports fns take `(convertTo: CurrencyCode, rates: RatesTable)` and convert each row before summing; rows whose currency can't convert (missing gold rate) are excluded + counted.
- **MIRROR**: aggregate.ts existing fns.
- **GOTCHA**: Keep signatures backward-friendly where feasible (optional params defaulting to TRY passthrough) to limit call-site churn; update call sites to pass loaded rates.
- **VALIDATE**: `npm test aggregate reports`.

### Task D2: Portfolio screen + route + settings
- **ACTION**: `lib/portfolio.ts` (`holdingsByCurrency`, `totalInMainCurrency`) + `PortfolioScreen` + `varliklarim.tsx` route + `_layout.tsx` Stack entry + Settings "Varlıklarım" `InfoRowChevron` + "Ana para birimi" picker (updates `profiles.main_currency` via `useUpdateProfileMutation`).
- **MIRROR**: SETTINGS_ROW, screen→route→layout→barrel flow (CLAUDE.md "New screen" recipe).
- **VALIDATE**: `npm test portfolio`; device: switch main currency → totals re-roll.

### Task D3: i18n
- **ACTION**: Add all new keys (currency names, "Ana para birimi", "Varlıklarım", stale-rate note, gold unit) to both `tr.json` and `en.json`.
- **GOTCHA**: Both locales or i18n throws missing-key in dev.
- **VALIDATE**: `npm run typecheck`; toggle language.

---

## Testing Strategy

### Unit Tests
| Test | Input | Expected | Edge? |
|---|---|---|---|
| convert same currency | (100,'USD','USD',rates) | 100 | — |
| convert USD→TRY | (10,'USD','TRY',rates) | 10 × usdInTry | — |
| convert cross (USD→EUR) | via TRY pivot | correct | — |
| convert missing gold rate | ('GAU'→'TRY', no gold) | `null` | ✓ |
| gram-gold from ounce | ounce rate | /31.1034768 | ✓ |
| formatCurrency GAU | (12.5,'GAU') | `"12,5 gr"` | ✓ |
| formatCurrency default | (100) | `"₺100,00"` | ✓ (back-compat) |
| monthSummary mixed cur | USD+TRY rows, convertTo TRY | converted sum | ✓ |
| rate direction inversion | api sample | value-in-TRY | ✓ |
| holdingsByCurrency | mixed rows | grouped totals | — |
| totalInMainCurrency w/ missing rate | gold no rate | excludes + flags | ✓ |

### Edge Cases Checklist
- [ ] Missing/failed rate fetch → cached rates used, entry never blocked
- [ ] Gold rate unavailable → native gram shown, excluded from main total, note surfaced
- [ ] Existing TRY rows unaffected (default column)
- [ ] `GAU` never passed to `Intl` currency style
- [ ] Rate direction (per-TRY vs TRY-per) verified by test
- [ ] Offline (airplane mode) first launch with no cache → graceful zero-rates state

---

## Validation Commands

### Static Analysis
```bash
npm run typecheck
```
EXPECT: Zero type errors

### Unit Tests
```bash
npm test
```
EXPECT: All pass incl. new currency/portfolio/aggregate suites

### Lint
```bash
npm run lint
```
EXPECT: Clean

### Database Validation
```bash
# via mcp__supabase__list_tables + list_migrations
```
EXPECT: `currency` on 6 tables, `main_currency` on profiles, `fx_rates` present

### Manual Validation
- [ ] Create USD goal, EUR income, gram-gold contribution
- [ ] Home/Reports totals roll into main currency
- [ ] Switch main currency in Ayarlar → totals recompute
- [ ] Portfolio shows per-unit balances + total
- [ ] Airplane mode → app still displays with cached/stale badge
- [ ] All 4 themes legible

---

## Acceptance Criteria
- [ ] All 4 phases' tasks complete
- [ ] All validation commands pass
- [ ] New pure fns unit-tested (currency, portfolio, aggregate conversion)
- [ ] No type/lint errors
- [ ] Existing TRY behavior unchanged for pre-existing rows
- [ ] Offline never blocks amount entry/display

## Completion Checklist
- [ ] Follows discovered patterns (ApiError, injectEndpoints, migration+RLS, form state, lib+test)
- [ ] No hardcoded currency remaining in `format.ts`
- [ ] i18n both locales
- [ ] Settings entries added
- [ ] Screen→route→layout→barrel wiring per CLAUDE.md recipe
- [ ] No new runtime deps (uses global `fetch`, existing `SegmentedToggle`)

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Free API rate-direction confusion | High | High | Unit-test inversion against a live sample; document direction once |
| Gold gram source flaky/unavailable | Med | Med | Separate `GAU` unit; graceful degrade (native gram, exclude from total, note) |
| First network layer → offline breakage | Med | High | Cache snapshot in `fx_rates`; last-good fallback; never block entry |
| Aggregation churn (many call sites) | High | Med | Optional params default to TRY passthrough; phase D isolates it |
| `numeric(12,2)` too coarse for gold | Low | Low | Acceptable for grams; rates use `numeric(18,6)` |
| Scope creep (XL) | High | Med | Strict phase boundaries; NOT-Building list |

## Notes
- User locked **full multi-currency** + **free FX API** (with cache + offline fallback).
- Rate direction is the single highest-value thing to nail — decide "value of 1 unit in TRY", write it in `currency.ts`, and test it.
- Gold (`GAU`) is deliberately modeled as just another unit whose TRY-rate comes from the ounce price ÷ 31.1034768 — this keeps `convert()` uniform.
- Confidence for single-pass: this is XL; realistically implement + validate phase-by-phase.
