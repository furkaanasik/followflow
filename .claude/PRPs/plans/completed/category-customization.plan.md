# Plan: Kategori Özelleştirme (Category Customization)

## Summary
Let users manage transaction/budget categories: add their own (name + icon + color) **and** hide / rename / recolor the 12 built-ins. Custom categories and built-in overrides live in a new `public.categories` table; a reactive `useCategories()` hook merges the static built-in list with per-user DB rows so every consumer (pickers, transaction rows, budget rows, donut breakdown) resolves labels/icons/colors uniformly.

## User Story
As a FollowFlow user, I want to create my own categories and tweak the built-in ones (name, icon, color, visibility), so that my transaction and budget categorization matches how I actually think about my money.

## Problem → Solution
**Current:** Categories are a hard-coded static array (`src/lib/categories.ts`, 12 entries). Every screen resolves a category via the pure `categoryByKey(key)` → `{labelKey, icon, tint}`. Users cannot add, hide, or edit anything. A transaction whose `category` key is unknown falls back to the raw key string + `accentTeal` tint.
**Desired:** A per-user, DB-backed overlay on top of the static built-ins. Users add custom categories and override built-ins. Resolution flows through one reactive hook so all consumers stay consistent. Unknown-key fallback behavior is preserved.

## Metadata
- **Complexity**: Large
- **Source PRD**: `.claude/backlog.md` → "Yeni özellikler → P2 — Kategori özelleştirme"
- **PRD Phase**: standalone backlog item
- **Estimated Files**: ~22 (5 create SQL/lib, 3 create screens/routes, ~10 update, ~4 test/i18n)

### Decisions locked (from planning Q&A)
1. **Color = curated palette.** Users pick one of the 8 `CHART_PALETTE` swatches (`src/lib/color.ts`). No free hex picker, no new dependency.
2. **Built-ins are manageable.** Users can hide / rename / recolor / re-icon the 12 built-ins via per-user **override rows** (never mutate the static array). Built-ins cannot be hard-deleted — instead "reset to default" removes the override row.

---

## UX Design

### Before
```
Ayarlar (Settings)
 └ Yönetim
    ├ Gelir Kaynakları   →  gelir-kaynaklarim
    └ Tekrarlayan Ödemeler → tekrarlayan-odemeler
      (no category management anywhere)

Yeni İşlem / Yeni Bütçe: category chips are the fixed 12 built-ins only.
```

### After
```
Ayarlar (Settings)
 └ Yönetim
    ├ Gelir Kaynakları
    ├ Tekrarlayan Ödemeler
    └ Kategoriler   →  kategoriler   (NEW)
         ┌───────────────────────────────┐
         │ Kategoriler            [Gider|Gelir] toggle
         │ ● Market   (built-in)     ✎    │
         │ ● Kira     (built-in)     ✎    │
         │ ◐ Kafe     (gizli/hidden) ✎    │
         │ ● Kahve Dükkanı (custom)  ✎    │
         │ …                              │
         │        [+ Kategori Ekle]       │
         └───────────────────────────────┘
   tap row → yeni-kategori?id=<key>  (edit)
   tap add → yeni-kategori           (create)

Yeni-Kategori modal (formSheet):
   Ad | Tür(Gider/Gelir) | İkon grid | Renk swatch row | Kaydet
   built-in edit adds: [Gizle/Göster] + [Varsayılana Sıfırla]
   custom  edit adds: [Kategoriyi Sil]

Yeni İşlem / Yeni Bütçe: chips now show built-ins (minus hidden, with
overrides applied) + custom categories, all reactive.
```

### Interaction Changes
| Touchpoint | Before | After | Notes |
|---|---|---|---|
| Settings → Yönetim | 2 rows | 3 rows (+ Kategoriler) | `InfoRowChevron icon="tag"` |
| Tx/Budget chips | static 12 | merged, hidden filtered | via `useCategories(type)` |
| Tx row / Budget row / Donut | `categoryByKey` | `useCategories().byKey` | custom name+color resolve |
| Category color | token tint only | tint (built-in default) or hex swatch (override/custom) | `color` wins over `tint` |

---

## Mandatory Reading

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 | `src/lib/categories.ts` | all | Static built-ins + `Category` type + `categoriesByType`/`categoryByKey` — the thing being overlaid |
| P0 | `src/store/api/incomeSourcesApi.ts` | all | Exact CRUD RTK-Query slice template to copy for `categoriesApi` |
| P0 | `supabase/migrations/20260719000000_initial_schema.sql` | 16-63, 79-108, 131-153 | Table/index/`set_updated_at` trigger/RLS conventions to mirror |
| P0 | `src/screens/NewTransactionScreen.tsx` | 23, 74-110, 140-155, 229-241 | Chip rendering + save payload (`category`, `icon`) — main integration point |
| P0 | `src/screens/NewBudgetScreen.tsx` | 19, 47-58, 74-85, 161-172 | Second chip integration point |
| P1 | `src/screens/NewGoalScreen.tsx` | 27, 55, 184-216 | Icon-picker grid pattern to copy for the category icon grid |
| P1 | `src/screens/IncomeSourcesScreen.tsx` | all | Management-list screen pattern (StateView, useFocusEffect refetch, add button) |
| P1 | `src/molecules/CategoryChip.tsx` | all | Add optional `color` prop |
| P1 | `src/atoms/CategoryIcon.tsx` | all | Add optional `color` prop |
| P1 | `src/screens/HomeScreen.tsx` | 20-21, 74-92, 125-131 | Donut slices + recent-tx label/tint resolution |
| P1 | `src/screens/TransactionsScreen.tsx` | 9, 68-92 | `categoryLabel` + row tint resolution |
| P1 | `src/screens/BudgetsScreen.tsx` | 9, 62-63, 108-112 | Budget display-name resolution |
| P1 | `src/lib/aggregate.ts` | 42-91 | `expenseByCategory` / `budgetProgress` join on raw `category` string (custom keys are UUIDs — must still join) |
| P1 | `src/app/_layout.tsx` | 119-226 | Where to register the two new routes (formSheet vs full) |
| P1 | `src/screens/SettingsScreen.tsx` | 40-61 | Where to add the "Kategoriler" nav row |
| P1 | `src/store/api/baseApi.ts` | 18-31 | Add `'Category'` tag type |
| P1 | `src/types/database.ts` | 114-137 | `budgets` block = shape template for the new `categories` table types |
| P2 | `src/i18n/locales/tr.json` | 160-197, 273-287 | i18n block placement + `categories.*` label keys |
| P2 | `src/lib/goalIcons.ts` | all | Curated-icon-list pattern for `CATEGORY_ICONS` |
| P2 | `src/lib/__tests__/categories.test.ts` | all | Unit test style to extend |

## External Documentation
No external research needed — feature uses established internal patterns (RTK Query `injectEndpoints`, Supabase RLS, expo-router Stack screens, lucide icons). All conventions exist in-repo.

---

## Patterns to Mirror

### DB_TABLE + TRIGGER + RLS
```sql
-- SOURCE: supabase/migrations/20260719000000_initial_schema.sql:53-63, 105-106, 150-151
create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ...
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, category_name, period_month)
);
create index idx_budgets_user_period on public.budgets(user_id, period_month);
create trigger set_updated_at before update on public.budgets
  for each row execute function public.set_updated_at();
alter table public.budgets enable row level security;
create policy "budgets_all_own" on public.budgets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

### RTK_QUERY_CRUD_SLICE
```ts
// SOURCE: src/store/api/incomeSourcesApi.ts:15-70 (copy verbatim, rename entity)
export const incomeSourcesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listIncomeSources: builder.query<IncomeSource[], void>({
      queryFn: async () => {
        const { data, error } = await supabase
          .from('income_sources').select('*')
          .order('created_at', { ascending: false });
        if (error) return { error: toApiError(error) };
        return { data };
      },
      providesTags: ['IncomeSource'],
    }),
    createIncomeSource: builder.mutation<IncomeSource, IncomeSourceInsert>({
      queryFn: async (payload) => {
        const { data, error } = await supabase
          .from('income_sources').insert(payload).select().single();
        if (error) return { error: toApiError(error) };
        return { data };
      },
      invalidatesTags: ['IncomeSource'],
    }),
    // update + delete follow identically…
  }),
});
```

### ICON_PICKER_GRID
```tsx
// SOURCE: src/screens/NewGoalScreen.tsx:194-215
<View style={styles.iconRow}>
  {GOAL_ICONS.map((ic) => (
    <Pressable key={ic} onPress={() => setIcon(ic)}
      accessibilityRole="button" accessibilityState={{ selected: ic === icon }}
      style={{ borderRadius: theme.radius.full, borderWidth: 2,
        borderColor: ic === icon ? theme.colors.accentTeal : 'transparent' }}>
      <CategoryIcon icon={ic} size={40}
        tint={ic === icon ? 'accentTeal' : 'textSecondary'} />
    </Pressable>
  ))}
</View>
```

### CHIP_RESOLUTION (current, to be replaced by hook)
```tsx
// SOURCE: src/screens/NewTransactionScreen.tsx:229-241
{categories.map((cat) => (
  <CategoryChip key={cat.key} icon={cat.icon} label={t(cat.labelKey)}
    tint={cat.tint} selected={cat.key === categoryKey}
    onPress={() => setCategoryKey(cat.key)} testID={`tx-category-${cat.key}`} />
))}
```

### MANAGEMENT_LIST_SCREEN
```tsx
// SOURCE: src/screens/IncomeSourcesScreen.tsx:32-37, 83-121
useFocusEffect(useCallback(() => {
  const handle = requestIdleCallback(() => refetch());
  return () => cancelIdleCallback(handle);
}, [refetch]));
// … StateView loading/error/empty, list.map(Card), ButtonSecondary "+ add"
```

### DELETE_CONFIRM
```tsx
// SOURCE: src/screens/NewGoalScreen.tsx:120-136
Alert.alert(t('newGoal.deleteTitle'), t('newGoal.deleteMessage'), [
  { text: t('common.cancel'), style: 'cancel' },
  { text: t('common.delete'), style: 'destructive',
    onPress: () => deleteGoal(existing.id).unwrap().then(() => router.back())
      .catch(() => setFormError(t('newGoal.saveFailed'))) },
]);
```

### TEST_STRUCTURE
```ts
// SOURCE: src/lib/__tests__/categories.test.ts:3-19
describe('categoriesByType', () => {
  it('returns only income categories', () => {
    const income = categoriesByType('income');
    expect(income.every((c) => c.type === 'income')).toBe(true);
  });
});
```

---

## Data Model

New table `public.categories` — a per-user overlay. A row is **either** a fully custom category (`builtin_key is null`) **or** an override of a built-in (`builtin_key` = static key e.g. `'market'`).

```sql
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  builtin_key text,           -- null = custom category; set = override of that built-in
  type text not null check (type in ('income','expense')),
  name text,                  -- custom: required; override: null keeps default label
  icon text,                  -- custom: required; override: null keeps default icon
  color text,                 -- hex swatch e.g. '#2DD4BF'; override: null keeps token tint
  hidden boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_custom_complete check (
    builtin_key is not null
    or (name is not null and icon is not null and color is not null)
  )
);
create unique index categories_user_builtin_uniq
  on public.categories(user_id, builtin_key) where builtin_key is not null;
create index idx_categories_user on public.categories(user_id);
```

**Transaction/budget key contract:**
- Built-in category → `transactions.category` / `budgets.category_name` = built-in key (`'market'`). Unchanged. Overrides never change the key, only skin resolution.
- Custom category → the key stored on the transaction/budget = the category **row `id` (uuid)**. `useCategories().byKey(uuid)` resolves it.

**Resolution precedence (built-in):** override.name ?? t(labelKey); override.icon ?? static.icon; override.color (hex) else static.tint (token); hidden = override.hidden.

---

## Types: `ResolvedCategory`
Add to `src/lib/categories.ts` (keep the existing static array + pure helpers for back-compat/tests):
```ts
export interface ResolvedCategory {
  key: string;                 // built-in key OR custom row uuid
  label: string;               // already translated / custom name
  icon: string;
  tint?: keyof ColorTokens;    // built-in default color (theme-reactive)
  color?: string;              // hex; set for overrides + customs; WINS over tint
  type: 'income' | 'expense';
  custom: boolean;             // true = custom row; false = built-in (maybe overridden)
  hidden: boolean;
}
```

## Hook: `useCategories()`  (new `src/lib/useCategories.ts`)
Reactive merge, used by every consumer. Pure resolver `resolveCategories(builtins, rows, t)` extracted so it is unit-testable without React.
```ts
export function useCategories() {
  const { t } = useTranslation();
  const { data: rows = [] } = useListCategoriesQuery();
  const resolved = useMemo(() => resolveCategories(CATEGORIES, rows, t), [rows, t]);
  return {
    all: resolved,                                             // includes hidden
    byType: (type) => resolved.filter((c) => c.type === type && !c.hidden), // pickers
    byKey: (key) => resolved.find((c) => c.key === key),       // resolve existing rows (incl. hidden)
  };
}
```
`resolveCategories`: map built-ins applying override rows (matched by `builtin_key`), then append custom rows (`custom: true`, `color` from row, `tint` undefined), sorted by `sort_order` then insertion.

---

## Files to Change

| File | Action | Justification |
|---|---|---|
| `supabase/migrations/20260725000000_categories.sql` | CREATE | New `categories` table + trigger + RLS |
| `src/types/database.ts` | UPDATE | Add `categories` Row/Insert/Update block |
| `src/types/index.ts` | UPDATE | Export `Category*` row types (note: name clash — see GOTCHA) |
| `src/store/api/categoriesApi.ts` | CREATE | CRUD slice (copy incomeSourcesApi) |
| `src/store/api/index.ts` | UPDATE | `export * from './categoriesApi'` |
| `src/store/api/baseApi.ts` | UPDATE | Add `'Category'` tag type |
| `src/lib/categoryIcons.ts` | CREATE | `CATEGORY_ICONS` curated lucide list |
| `src/lib/categories.ts` | UPDATE | Add `ResolvedCategory` + `resolveCategories()` pure fn |
| `src/lib/useCategories.ts` | CREATE | Reactive merge hook |
| `src/atoms/CategoryIcon.tsx` | UPDATE | Optional `color?: string` (wins over tint) |
| `src/molecules/CategoryChip.tsx` | UPDATE | Optional `color?: string` |
| `src/screens/CategoriesScreen.tsx` | CREATE | Management list |
| `src/screens/NewCategoryScreen.tsx` | CREATE | Create/edit form (icon grid + color swatches) |
| `src/screens/index.ts` | UPDATE | Export the two new screens |
| `src/app/kategoriler.tsx` | CREATE | Route → CategoriesScreen |
| `src/app/yeni-kategori.tsx` | CREATE | Route → NewCategoryScreen |
| `src/app/_layout.tsx` | UPDATE | Register both routes (kategoriler=full, yeni-kategori=formSheet) |
| `src/screens/SettingsScreen.tsx` | UPDATE | Add "Kategoriler" InfoRowChevron |
| `src/screens/NewTransactionScreen.tsx` | UPDATE | Use `useCategories`; save custom key=id |
| `src/screens/NewBudgetScreen.tsx` | UPDATE | Use `useCategories` |
| `src/screens/HomeScreen.tsx` | UPDATE | Resolve label/tint via hook |
| `src/screens/TransactionsScreen.tsx` | UPDATE | Resolve label/tint via hook |
| `src/screens/BudgetsScreen.tsx` | UPDATE | Resolve display name via hook |
| `src/i18n/locales/tr.json` | UPDATE | `categories2`/`newCategory` blocks + settings row |
| `src/i18n/locales/en.json` | UPDATE | Same keys, English |
| `src/lib/__tests__/categories.test.ts` | UPDATE | Add `resolveCategories` tests |

## NOT Building
- **No free/hex color picker** — curated 8-swatch palette only.
- **No reordering UI** (`sort_order` exists in schema for future use; not user-editable in v1).
- **No icon search / full lucide catalog** — a curated ~16-icon grid like goals.
- **No donut recoloring by custom color** — `HomeScreen` donut keeps index-based `CHART_PALETTE` (avoids collision logic). Legend/row **labels** do resolve custom names; the ring color stays palette-indexed. (Explicit scope cut.)
- **No migration/backfill of existing transactions** — existing rows keep their built-in keys and resolve unchanged.
- **No cascade on custom-category delete** — deleting a custom category leaves its transactions with an orphan uuid key → they gracefully fall back to raw-key display (same as today's unknown-key behavior). Warn in the delete confirm copy.
- **No onboarding integration** — categories managed only from Settings.

---

## Step-by-Step Tasks

### Task 1: Migration — `categories` table
- **ACTION**: Create `supabase/migrations/20260725000000_categories.sql`.
- **IMPLEMENT**: The `create table public.categories` from **Data Model**, plus the unique partial index, `idx_categories_user`, the `set_updated_at` trigger, `enable row level security`, and `categories_all_own` policy.
- **MIRROR**: DB_TABLE + TRIGGER + RLS.
- **GOTCHA**: `set_updated_at()` already exists (initial schema) — reference it, do NOT redefine. Partial unique index (not table `unique(...)`) so multiple custom rows (null builtin_key) are allowed while overrides stay 1-per-built-in.
- **VALIDATE**: `npx supabase db reset` locally (or apply_migration) succeeds; `list_tables` shows `categories`.

### Task 2: Database + entity types
- **ACTION**: Add the `categories` block to `src/types/database.ts`; export types from `src/types/index.ts`.
- **IMPLEMENT**: Row/Insert/Update mirroring the `budgets` block shape. Row fields: `id, user_id, builtin_key: string|null, type: 'income'|'expense', name: string|null, icon: string|null, color: string|null, hidden: boolean, sort_order: number, created_at, updated_at`. Insert: `id?`, `user_id`, `type`, rest optional. Update: `Partial<...Insert>`.
- **MIRROR**: `src/types/database.ts:114-137`.
- **GOTCHA**: Name clash — `Category` is already the interface exported from `src/lib/categories.ts`. Export the DB row type as **`UserCategory` / `UserCategoryInsert` / `UserCategoryUpdate`** from `src/types/index.ts` to avoid collision. Use those names everywhere in the API slice.
- **VALIDATE**: `npx tsc --noEmit` clean.

### Task 3: RTK Query slice `categoriesApi`
- **ACTION**: Create `src/store/api/categoriesApi.ts`; wire into `index.ts` + `baseApi.ts`.
- **IMPLEMENT**: `listCategories` (query `void`, `.order('sort_order').order('created_at')`, `providesTags:['Category']`), `createCategory`, `updateCategory` (`{id}&UserCategoryUpdate`), `deleteCategory` — all copying incomeSourcesApi. Add `'Category'` to `tagTypes`. Add `export * from './categoriesApi'` to `index.ts`.
- **MIRROR**: RTK_QUERY_CRUD_SLICE.
- **IMPORTS**: `UserCategory, UserCategoryInsert, UserCategoryUpdate` from `@/types`; `api, toApiError, ApiError` from `./baseApi`.
- **VALIDATE**: `npx tsc --noEmit` clean; hooks `useListCategoriesQuery` etc. exported.

### Task 4: `CATEGORY_ICONS` + resolver + hook
- **ACTION**: Create `src/lib/categoryIcons.ts`, extend `src/lib/categories.ts`, create `src/lib/useCategories.ts`.
- **IMPLEMENT**:
  - `categoryIcons.ts`: `export const CATEGORY_ICONS = ['shopping-cart','home','coffee','bus','activity','receipt','tv','shirt','graduation-cap','banknote','laptop','gift','heart','car','plane','ellipsis'] as const;` (all must be valid lucide names — verify against `getIcon`).
  - `categories.ts`: add `ResolvedCategory` interface + pure `resolveCategories(builtins: Category[], rows: UserCategory[], t: TFunction): ResolvedCategory[]`. Built-ins: apply override row by `builtin_key`; `label = override?.name ?? t(b.labelKey)`, `icon = override?.icon ?? b.icon`, `color = override?.color ?? undefined`, `tint = override?.color ? undefined : b.tint`, `hidden = override?.hidden ?? false`, `custom:false`. Customs: `key = row.id`, `label = row.name!`, `icon = row.icon!`, `color = row.color!`, `tint: undefined`, `custom:true`, `hidden: row.hidden`. Sort by `sort_order`.
  - `useCategories.ts`: hook per **Hook** section above.
- **MIRROR**: `goalIcons.ts` for the icon list; existing pure helpers in `categories.ts`.
- **GOTCHA**: `resolveCategories` must stay pure (take `t` as arg) so it is unit-testable. Keep existing `categoriesByType`/`categoryByKey` untouched (tests + any non-React caller rely on them).
- **VALIDATE**: New unit tests (Task 12) pass.

### Task 5: `CategoryIcon` + `CategoryChip` accept `color`
- **ACTION**: Add optional `color?: string` to both.
- **IMPLEMENT**: In `CategoryIcon`, `const tintColor = color ?? theme.colors[tint];` (guard: keep `tint` default `'accentTeal'`, `color` overrides). In `CategoryChip`, unselected icon color = `color ?? theme.colors[tint]`; selected keeps `accentTeal` (existing). Label color unchanged.
- **MIRROR**: current component bodies (`src/atoms/CategoryIcon.tsx`, `src/molecules/CategoryChip.tsx`).
- **GOTCHA**: `color` is a raw hex, `theme.colors[tint]` is also a hex — `withAlpha(tintColor,'26')` in CategoryIcon works for both. Don't index `theme.colors[color]`.
- **VALIDATE**: `tsc` clean; existing screens render unchanged when `color` omitted.

### Task 6: `CategoriesScreen` (management list)
- **ACTION**: Create `src/screens/CategoriesScreen.tsx`; export from `src/screens/index.ts`.
- **IMPLEMENT**: `AppBarBackTitle` "Kategoriler"; `SegmentedToggle` Gider/Gelir (default expense); `useCategories().all` filtered by selected type (show hidden with a muted style / "gizli" badge); each row = `CategoryIcon` (pass `icon`, `tint`, `color`) + label + edit affordance → `router.push({pathname:'/yeni-kategori', params:{ key: c.key }})`; `ButtonSecondary tone="accent" icon="plus"` → `router.push('/yeni-kategori')` (carry current type via param). Use `StateView`/`useFocusEffect` refetch pattern.
- **MIRROR**: MANAGEMENT_LIST_SCREEN (`IncomeSourcesScreen`).
- **GOTCHA**: Built-ins have no DB `id` — pass `key` (built-in key or custom uuid), not `id`, as the edit param. The edit screen decides create/override/edit from whether the key matches a built-in.
- **VALIDATE**: Screen lists 12 built-ins + any custom; toggling type filters.

### Task 7: `NewCategoryScreen` (create / edit / override)
- **ACTION**: Create `src/screens/NewCategoryScreen.tsx`; export from index.
- **IMPLEMENT**: Params `{ key?, type? }`. Resolve mode:
  - no `key` → **create custom**.
  - `key` matches a built-in static key → **override built-in** (find existing override row via `useListCategoriesQuery` by `builtin_key`).
  - `key` is a uuid of a custom row → **edit custom**.
  Fields: `FormFieldGroup` name (built-in placeholder = default label), `SegmentedToggle` type (disabled/locked in override + edit modes — type is immutable), icon grid over `CATEGORY_ICONS` (ICON_PICKER_GRID), color swatch row over `CHART_PALETTE` (selected swatch gets a ring border like the icon grid). Save:
  - create custom → `createCategory({user_id, type, name, icon, color, builtin_key:null})`.
  - override → upsert override row: if row exists `updateCategory({id, name, icon, color, hidden})` else `createCategory({user_id, builtin_key, type, name, icon, color})`.
  - edit custom → `updateCategory({id, name, icon, color})`.
  Extra controls: override mode → hide/show toggle + "Varsayılana Sıfırla" (delete override row if present, else just back); custom mode with existing → "Kategoriyi Sil" (`deleteCategory`, DELETE_CONFIRM with orphan warning copy).
- **MIRROR**: `NewGoalScreen` (form + icon grid + delete), NewBudget for chip/color row layout.
- **IMPORTS**: `CHART_PALETTE` from `@/lib/color`; `CATEGORY_ICONS` from `@/lib/categoryIcons`; category api hooks; `CategoryIcon` atom.
- **GOTCHA**: Built-in default `name` must be prefilled from `t(labelKey)` when opening an un-overridden built-in so the user sees the current value. Type toggle immutable outside create (changing type would strand existing transactions).
- **VALIDATE**: Create/edit/override/reset all round-trip; list reflects changes on back.

### Task 8: Register routes
- **ACTION**: Add two `Stack.Screen` entries in `src/app/_layout.tsx` (authenticated + onboarding-complete block); create `src/app/kategoriler.tsx` and `src/app/yeni-kategori.tsx`.
- **IMPLEMENT**: `kategoriler` = full screen (copy `gelir-kaynaklarim` options: `headerShown:false`, `bgApp`). `yeni-kategori` = formSheet (copy `yeni-gelir` options: `presentation:'formSheet'`, `sheetAllowedDetents:[0.85]`, `bgSurface`). Route files re-export the screen (2-line, like `gelir-kaynaklarim.tsx`).
- **MIRROR**: `src/app/_layout.tsx:192-215`, `src/app/gelir-kaynaklarim.tsx`.
- **VALIDATE**: Navigation from Settings opens list; add/edit opens sheet.

### Task 9: Settings entry row
- **ACTION**: Add `InfoRowChevron` in `SettingsScreen.tsx` management group.
- **IMPLEMENT**: `<InfoRowChevron icon="tag" label={t('settings.categories')} value="" onPress={() => router.push('/kategoriler')} />` after recurring payments row.
- **MIRROR**: `SettingsScreen.tsx:49-59`.
- **VALIDATE**: Row visible + navigates.

### Task 10: Integrate pickers (Transaction + Budget)
- **ACTION**: Replace static category usage in `NewTransactionScreen.tsx` and `NewBudgetScreen.tsx` with `useCategories`.
- **IMPLEMENT**:
  - `const { byType, byKey } = useCategories();` `const categories = byType(type);` (budget: `byType('expense')`).
  - Chip: pass `color={cat.color}` alongside `tint={cat.tint ?? 'accentTeal'}`; `key`/`selected` on `cat.key`.
  - Default selected key: `byType(type)[0]?.key` (guard empty — if a user hid every built-in of a type, still allow customs; if truly none, disable save with a field error).
  - Save payload: `category: cat.key` (built-in key OR custom uuid), `icon: cat.icon`. For transactions `title` fallback: `trimmedNote || cat.label` (was `t(category.labelKey)` — now use resolved `label`).
  - `categoryByKey` validation call → replace with `byKey(categoryKey)`.
- **MIRROR**: existing chip block; CHIP_RESOLUTION.
- **GOTCHA**: `byType` excludes hidden, but an existing transaction/budget being **edited** may reference a hidden or custom key — initialize `categoryKey` via `byKey(existing.category)` (which includes hidden) and, if that key isn't in the visible `byType` list, prepend it so the chip is selectable.
- **VALIDATE**: New expense with a custom category saves; edit of an existing tx keeps its category selected.

### Task 11: Integrate resolution (Home / Transactions / Budgets)
- **ACTION**: Replace `categoryByKey` reads with `useCategories().byKey`.
- **IMPLEMENT**:
  - `TransactionsScreen`: `categoryLabel` → `byKey(txn.category)?.label ?? txn.category`; row `iconTint` → keep `tint` fallback but also pass `color` (extend the row/organism if it accepts a color; if not, resolve tint only and note custom rows show via their stored `txn.icon` + fallback tint — acceptable v1). Prefer: resolve `const c = byKey(txn.category)` once; `iconTint = c?.tint ?? 'accentTeal'`, `iconColor = c?.color`.
  - `HomeScreen`: recent-tx label/tint same as above; donut slices `label = byKey(slice.category)?.label ?? slice.category` (ring `color` stays `CHART_PALETTE[index]` per NOT Building).
  - `BudgetsScreen`: `displayName` → `byKey(budget.category_name)?.label ?? budget.category_name`.
- **MIRROR**: current resolution lines (`TransactionsScreen.tsx:68-92`, `HomeScreen.tsx:74-92,125-131`, `BudgetsScreen.tsx:62-63`).
- **GOTCHA**: `expenseByCategory`/`budgetProgress` in `aggregate.ts` join on the raw `category` string — custom uuids join correctly with no change. Do NOT alter aggregate join logic. Check whether `TransactionRow`/`BudgetProgressRow`/`BudgetCard` organisms accept a `color`/`iconTint` prop; if a row only takes `iconTint: keyof ColorTokens`, either (a) add an optional `iconColor?: string`, or (b) accept tint-only fallback for custom in v1 and note it. Pick (a) if the prop threading is <5 lines.
- **VALIDATE**: A transaction in a custom category shows its custom name across Home/Transactions/Budgets.

### Task 12: Tests + i18n
- **ACTION**: Extend `src/lib/__tests__/categories.test.ts`; add i18n keys to `tr.json` + `en.json`.
- **IMPLEMENT**:
  - Tests for `resolveCategories`: (a) no rows → 12 built-ins, labels from a stub `t`; (b) override row renames/recolors/hides the matching built-in; (c) custom row appears with `custom:true`, `key===row.id`; (d) override `color` set → resolved `tint` undefined & `color` set.
  - i18n: add `"categories2"` block? No — reuse. Add `settings.categories`, and a `newCategory` block (`title, editTitle, nameLabel, namePlaceholder, iconLabel, colorLabel, typeLabel, hide, show, resetDefault, delete, deleteTitle, deleteMessage, saveFailed, save, saving`) + `categoriesManage` block (`title, subtitle, empty, add, hiddenBadge, builtinBadge`). Mirror key placement near `newIncome`/`incomeSources`. Both locales.
- **MIRROR**: `categories.test.ts`; `tr.json:160-197`.
- **GOTCHA**: `t` stub in tests: pass `(k) => k` so labels assert on keys. i18n key parity between `tr.json` and `en.json` is enforced by `src/types/i18next.d.ts` typing — add to both or `tsc` fails.
- **VALIDATE**: `npm test` green; `tsc` clean.

---

## Testing Strategy

### Unit Tests
| Test | Input | Expected | Edge? |
|---|---|---|---|
| resolve no rows | `CATEGORIES, [], t` | 12 resolved, `custom:false`, label=`t(labelKey)` | – |
| override rename+recolor | override `{builtin_key:'market', name:'Gıda', color:'#F59E0B'}` | market label `'Gıda'`, `color:'#F59E0B'`, `tint:undefined` | – |
| override hide | override `{builtin_key:'kafe', hidden:true}` | kafe `hidden:true`; excluded by `byType` | ✓ |
| custom row | `{id:'u1', name:'Kahve', icon:'coffee', color:'#2DD4BF', type:'expense'}` | key `'u1'`, `custom:true` | – |
| byKey hidden | hidden custom key | still resolved (edit path) | ✓ |

### Edge Cases Checklist
- [ ] User hides every built-in of a type → picker still usable (customs / disabled-save guard)
- [ ] Editing a tx whose category was later hidden → chip still selected (byKey includes hidden)
- [ ] Deleting a custom category with existing transactions → those rows fall back to raw key (no crash)
- [ ] Duplicate override attempt → partial unique index prevents 2nd row (upsert path handles it)
- [ ] Invalid/blank name on custom save → field error, no insert
- [ ] Long custom name → `numberOfLines={1}` truncation in chips/rows

---

## Validation Commands

### Static Analysis
```bash
npx tsc --noEmit
```
EXPECT: Zero type errors.

### Lint
```bash
npx eslint src --ext .ts,.tsx
```
EXPECT: Clean (matches repo config).

### Unit Tests
```bash
npm test
```
EXPECT: All pass, including new `resolveCategories` cases (existing 60 unchanged).

### Migration
```bash
npx supabase db reset   # or MCP apply_migration on a dev branch
```
EXPECT: `categories` table + RLS created; `mcp__supabase__get_advisors` shows no new RLS gaps.

### Manual (device/emulator)
- [ ] Settings → Kategoriler opens; built-ins listed
- [ ] Add custom "Kahve Dükkanı" (coffee, violet) → appears in Yeni İşlem chips
- [ ] Log an expense in it → Home donut legend + Transactions list show "Kahve Dükkanı"
- [ ] Rename built-in "Market"→"Gıda", recolor → reflected everywhere; reset restores default
- [ ] Hide "Kafe" → gone from pickers, still resolves on old transactions
- [ ] Cross-theme: custom hex color legible on dark + light

---

## Acceptance Criteria
- [ ] User can create a custom category (name + curated icon + palette color)
- [ ] User can rename / recolor / re-icon / hide / reset a built-in
- [ ] Custom + overridden categories resolve consistently in Yeni İşlem, Yeni Bütçe, Home, İşlemler, Bütçeler
- [ ] Existing transactions/budgets unaffected (built-in keys resolve unchanged)
- [ ] RLS: a user sees only their own category rows
- [ ] `tsc`, eslint, `npm test` all clean

## Completion Checklist
- [ ] Follows RTK-Query slice + migration + screen patterns exactly
- [ ] `resolveCategories` pure & unit-tested
- [ ] No new npm dependency (curated palette + icon grid)
- [ ] i18n key parity tr/en
- [ ] No aggregate join logic changed
- [ ] Type name clash avoided (`UserCategory*` for DB rows)

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Row organisms (`TransactionRow`, `BudgetCard`) only accept `iconTint: keyof ColorTokens`, blocking custom hex | Med | Med | Add optional `iconColor?: string` prop (small thread) or accept tint-only fallback for custom in v1 — decided per Task 11 GOTCHA |
| Custom uuid as `transactions.category` looks odd vs short built-in keys | Low | Low | Acceptable; resolution is key-agnostic. Document contract |
| Orphan keys after custom delete | Med | Low | Graceful raw-key fallback already exists; warn in delete copy |
| Type immutability confusion (user expects to switch a category's type) | Low | Low | Lock type toggle outside create; copy explains |
| Migration timestamp ordering vs existing `2026072*` files | Low | Med | Use `20260725000000_categories.sql` (after latest `20260720010000`) |

## Notes
- Static `CATEGORIES` array stays the source of truth for built-in **defaults**; the DB overlay only diffs from it. This keeps offline/first-run behavior intact (no rows = today's exact behavior).
- `sort_order` is persisted but not user-editable in v1 — reserved for a future drag-reorder feature.
- Donut ring colors intentionally remain `CHART_PALETTE`-indexed; revisit if users report wanting their custom color in the ring.
```
