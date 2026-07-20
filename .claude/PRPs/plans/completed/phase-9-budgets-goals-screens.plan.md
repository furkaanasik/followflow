# Plan: Phase 9 — Budgets & Goals Screens

## Summary
Build the three Phase 9 screens — **Bütçeler** (budget list), **Hedefler** (goal list), **Hedef Detay** (goal detail with monthly savings chart) — wired to live Supabase data via existing RTK Query APIs. Add the three interaction flows the design exposes: create/edit budget, create/edit goal, and deposit-to-goal. Introduce a `goal_contributions` ledger table so the goal-detail monthly progress chart reflects real history.

## User Story
As a FollowFlow user, I want to see my monthly budgets and savings goals with real progress, add/edit them, and put money toward a goal, so that I can track spending against limits and watch savings grow over time.

## Problem → Solution
Today `butceler.tsx` and `hedefler.tsx` are placeholder `<Text>` stubs; there is no goal-detail screen and no way to create budgets or deposit into goals (onboarding creates at most one goal and zero budgets). → Three fully wired screens plus create/edit/deposit bottom-sheet modals and a contributions ledger, following the exact patterns already established by the Phase 8 core screens.

## Metadata
- **Complexity**: Large
- **Source PRD**: `.claude/phases.md`
- **PRD Phase**: Phase 9 — Budgets & Goals Screens
- **Estimated Files**: ~20 (12 create, ~8 update)

---

## UX Design

### Before
```
Bütçeler tab  ─▶ centered "Bütçeler" text stub
Hedefler tab  ─▶ centered "Hedefler" text stub
(no goal detail, no create budget/goal, no deposit)
```

### After
```
Bütçeler ─▶ Title "Bütçeler" + "Temmuz 2026 · N kategori"  [＋]
            ▤ BudgetCard × N (over-limit variant when spent > limit)
            tap card → edit-budget sheet ；  ＋ → new-budget sheet

Hedefler ─▶ Title "Hedefler" + "N hedefte toplam ₺X biriktirdin"
            ▤ GoalCard × N   (tap → Hedef Detay)
            [ ＋ Yeni Hedef Ekle ]  → new-goal sheet

Hedef Detay ─▶ ‹ Hedef Detayı
            ⬤ icon  Araç Peşinatı / "55% tamamlandı"
            Biriktirilen ₺82.500      Hedef ₺150.000
            ▬▬▬▬▬▬▬░░░░  (progress bar)
            ┌ Aylık İlerleme ─ bar chart Şub…Tem ┐
            ⤴ "Bu hızda N ayda tamamlanır"
            🗓 "Aylık ₺X ortalama katkına göre hesaplandı"
            [ ＋ Bu Hedefe Para Ekle ]  → deposit sheet
```

### Interaction Changes
| Touchpoint | Before | After | Notes |
|---|---|---|---|
| Bütçeler ＋ | none | opens `yeni-butce` formSheet | create budget for current month |
| Budget card tap | none | opens `yeni-butce?id=` | edit/delete existing budget |
| Hedefler "Yeni Hedef Ekle" | none | opens `yeni-hedef` formSheet | create goal |
| Goal card tap | none | pushes `hedef/[id]` | goal detail |
| "Bu Hedefe Para Ekle" | none | opens `hedef-para-ekle?id=` | RPC deposit → chart + progress update |

---

## Mandatory Reading

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 | `src/screens/TransactionsScreen.tsx` | all | Canonical list-screen: SafeAreaView+ScrollView+RefreshControl, header, empty state, `rowProps` mapping. Mirror for BudgetsScreen/GoalsScreen. |
| P0 | `src/screens/NewTransactionScreen.tsx` | all | Canonical formSheet modal: edit-mode via `useLocalSearchParams` + find-in-cache, validation, `parseAmount`, create/update mutation, `router.back()`. Mirror for all three new modals. |
| P0 | `src/screens/HomeScreen.tsx` | 60-96,236-266,323-336 | `budgetProgress` usage, BudgetProgressRow, `SectionTitle`, chart-palette pattern, over-limit rendering. |
| P0 | `src/lib/aggregate.ts` | all | `currentPeriodMonth`, `budgetProgress`, `isSameMonth`, `monthlyIncomeTotal`. Add new goal helpers here. |
| P0 | `supabase/migrations/20260719000000_initial_schema.sql` | 41-63,86-108,131-153 | Table/index/trigger/RLS style to mirror for `goal_contributions`. |
| P0 | `supabase/migrations/20260719010000_harden_function_security.sql` | all | `set search_path` + `revoke execute` pattern for the new SECURITY DEFINER RPC. |
| P1 | `src/store/api/budgetsApi.ts` | all | `injectEndpoints` CRUD pattern + `notFoundError`. `goalsApi.ts` is identical shape. |
| P1 | `src/store/api/baseApi.ts` | all | `ApiError`, `toApiError`, `tagTypes` — add `GoalContribution`. |
| P1 | `src/organisms/BudgetCard.tsx` | all | Props already match design (icon, categoryName, percent, footerLabel, overLimit). Reuse as-is. |
| P1 | `src/organisms/GoalCard.tsx` | all | Props (icon, name, targetLabel, percent, percentLabel, amountsLabel, etaLabel). Reuse as-is. |
| P1 | `src/screens/OnboardingGoalScreen.tsx` | 67-98,136-175 | `createGoal` payload shape, `FormFieldGroup` form, `parseAmount`-style `Number(x.replace(',','.'))`, retry-guard `useRef`. |
| P1 | `src/app/_layout.tsx` | 119-157,145-154 | Stack registration inside `Stack.Protected`; the `yeni-islem` formSheet options block to copy. |
| P1 | `src/types/database.ts` | 88-137 | `goals`/`budgets` Row/Insert/Update shape; add `goal_contributions` table here. |
| P2 | `src/atoms/ProgressBar.tsx`, `src/atoms/CategoryIcon.tsx`, `src/atoms/ButtonSecondary.tsx`, `src/molecules/CategoryChip.tsx`, `src/molecules/TitleSubtitle.tsx` | all | Prop signatures for the pieces the new screens compose. |
| P2 | `src/lib/format.ts` | all | `formatCurrency`, `formatDate` (pass `{ day: undefined }` to get "Ay Yıl" only), `parseAmount`. |

## External Documentation
No external research needed — feature uses established internal patterns (Expo Router formSheet, RTK Query `injectEndpoints`, Supabase `rpc`, i18next). All conventions are already in the codebase.

---

## Patterns to Mirror

### LIST_SCREEN
```tsx
// SOURCE: src/screens/TransactionsScreen.tsx:103-178
<SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: theme.colors.bgApp }]}>
  <ScrollView
    contentContainerStyle={[styles.content, { gap: theme.spacing.md }]}
    showsVerticalScrollIndicator={false}
    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh}
      tintColor={theme.colors.accentTeal} colors={[theme.colors.accentTeal]} />}>
    <View style={styles.header}>{/* AppBar/Title + action button */}</View>
    {items.length > 0 ? items.map(...) : <Text style={{ color: theme.colors.textTertiary }}>{t('...empty')}</Text>}
  </ScrollView>
</SafeAreaView>
// styles.content: { flexGrow:1, paddingTop:8, paddingHorizontal:24, paddingBottom:120 }
```

### FORMSHEET_MODAL (create/edit)
```tsx
// SOURCE: src/screens/NewTransactionScreen.tsx:52-170
const { id } = useLocalSearchParams<{ id?: string }>();
const { data: rows = [] } = useListBudgetsQuery(currentPeriodMonth()); // list is cached from the tab
const existing = id ? rows.find((r) => r.id === id) : undefined;
const [field, setField] = useState(() => existing?.field ?? '');   // lazy init from existing
const [fieldError, setFieldError] = useState<string>();
const [formError, setFormError] = useState<string>();
async function handleSave() {
  const amount = parseAmount(amountRaw);
  if (!Number.isFinite(amount) || amount <= 0) { setFieldError(t('validation.amountRequired')); return; }
  try {
    if (existing) await updateX({ id: existing.id, ...payload }).unwrap();
    else await createX({ user_id: session!.user.id, ...payload }).unwrap();
  } catch { setFormError(t('...saveFailed')); return; }
  router.back();
}
// header: title + ButtonIconOnly icon="x" variant="surface" size={40} onPress={router.back}
// {formError ? <AlertBanner message={formError} /> : null}
```

### RTK_ENDPOINTS
```ts
// SOURCE: src/store/api/goalsApi.ts:11-63
export const goalContributionsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listGoalContributions: builder.query<GoalContribution[], string>({
      queryFn: async (goalId) => {
        const { data, error } = await supabase.from('goal_contributions')
          .select('*').eq('goal_id', goalId).order('occurred_at', { ascending: true });
        if (error) return { error: toApiError(error) };
        return { data };
      },
      providesTags: ['GoalContribution'],
    }),
    depositToGoal: builder.mutation<Goal, { goal_id: string; amount: number; note?: string | null; occurred_at?: string }>({
      queryFn: async ({ goal_id, amount, note = null, occurred_at }) => {
        const { data, error } = await supabase.rpc('add_goal_contribution', {
          p_goal_id: goal_id, p_amount: amount, p_note: note,
          ...(occurred_at ? { p_occurred_at: occurred_at } : {}),
        });
        if (error) return { error: toApiError(error) };
        return { data: data as Goal };
      },
      invalidatesTags: ['Goal', 'GoalContribution'],
    }),
  }),
});
```

### MIGRATION (table + RLS + atomic RPC)
```sql
-- SOURCE: mirror 20260719000000_initial_schema.sql:41-63,131-153 + 20260719010000:5,13
create table public.goal_contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid not null references public.goals(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  note text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index idx_goal_contributions_goal on public.goal_contributions(goal_id, occurred_at desc);
create index idx_goal_contributions_user on public.goal_contributions(user_id);
alter table public.goal_contributions enable row level security;
create policy "goal_contributions_all_own" on public.goal_contributions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- atomic deposit: bump goals.current_amount + insert ledger row, ownership-checked
create or replace function public.add_goal_contribution(
  p_goal_id uuid, p_amount numeric, p_note text default null,
  p_occurred_at timestamptz default now()
) returns public.goals
language plpgsql security definer set search_path = public
as $$
declare g public.goals;
begin
  update public.goals set current_amount = current_amount + p_amount
    where id = p_goal_id and user_id = auth.uid()
    returning * into g;
  if g.id is null then raise exception 'goal not found or not owned'; end if;
  insert into public.goal_contributions (user_id, goal_id, amount, note, occurred_at)
    values (auth.uid(), p_goal_id, p_amount, p_note, p_occurred_at);
  return g;
end;
$$;
revoke execute on function public.add_goal_contribution(uuid, numeric, text, timestamptz)
  from public, anon;   -- authenticated retains EXECUTE for the RPC call
```

### STACK_REGISTRATION
```tsx
// SOURCE: src/app/_layout.tsx:145-154 (inside the authenticated Stack.Protected)
<Stack.Screen name="hedef/[id]" options={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.bgApp } }} />
<Stack.Screen name="yeni-butce" options={{ presentation: 'formSheet', sheetAllowedDetents: [0.9], sheetGrabberVisible: true, headerShown: false, contentStyle: { backgroundColor: theme.colors.bgSurface } }} />
<Stack.Screen name="yeni-hedef" options={{ presentation: 'formSheet', sheetAllowedDetents: [0.92], sheetGrabberVisible: true, headerShown: false, contentStyle: { backgroundColor: theme.colors.bgSurface } }} />
<Stack.Screen name="hedef-para-ekle" options={{ presentation: 'formSheet', sheetAllowedDetents: [0.6], sheetGrabberVisible: true, headerShown: false, contentStyle: { backgroundColor: theme.colors.bgSurface } }} />
```

### ROUTE_FILE (thin default re-export)
```tsx
// SOURCE: src/app/yeni-islem.tsx
import { NewBudgetScreen } from '@/screens';
export default NewBudgetScreen;
```

---

## Files to Change

| File | Action | Justification |
|---|---|---|
| `supabase/migrations/20260720000000_goal_contributions.sql` | CREATE | Ledger table + RLS + `add_goal_contribution` RPC |
| `src/types/database.ts` | UPDATE | Add `goal_contributions` Row/Insert/Update |
| `src/types/index.ts` | UPDATE | Export `GoalContribution*` types |
| `src/store/api/baseApi.ts` | UPDATE | Add `'GoalContribution'` tag type |
| `src/store/api/goalContributionsApi.ts` | CREATE | list + deposit (RPC) endpoints |
| `src/store/api/index.ts` | UPDATE | Re-export new api |
| `src/lib/aggregate.ts` | UPDATE | `goalPercent`, `monthlyContributionSeries`, `averageMonthlyContribution`, `goalProjectionMonths` |
| `src/lib/goalIcons.ts` | CREATE | Curated goal-icon list for the goal picker |
| `src/organisms/GoalProgressChart.tsx` | CREATE | Bespoke monthly bar chart card (Hedef Detay) |
| `src/organisms/index.ts` | UPDATE | Export `GoalProgressChart` |
| `src/atoms/CategoryIcon.tsx` | UPDATE | Optional `size` prop (default 44) for 56px hero |
| `src/atoms/ButtonSecondary.tsx` | UPDATE | Add `tone='accent'` (teal-dim fill) for "Yeni Hedef Ekle" |
| `src/screens/BudgetsScreen.tsx` | CREATE | Budget list |
| `src/screens/GoalsScreen.tsx` | CREATE | Goal list |
| `src/screens/GoalDetailScreen.tsx` | CREATE | Goal detail + chart |
| `src/screens/NewBudgetScreen.tsx` | CREATE | Create/edit budget sheet |
| `src/screens/NewGoalScreen.tsx` | CREATE | Create/edit goal sheet |
| `src/screens/GoalDepositScreen.tsx` | CREATE | Deposit sheet |
| `src/screens/index.ts` | UPDATE | Export the 6 new screens |
| `src/app/(tabs)/butceler.tsx` | UPDATE | Render `BudgetsScreen` |
| `src/app/(tabs)/hedefler.tsx` | UPDATE | Render `GoalsScreen` |
| `src/app/hedef/[id].tsx` | CREATE | Goal-detail route |
| `src/app/yeni-butce.tsx` | CREATE | Budget modal route |
| `src/app/yeni-hedef.tsx` | CREATE | Goal modal route |
| `src/app/hedef-para-ekle.tsx` | CREATE | Deposit modal route |
| `src/app/_layout.tsx` | UPDATE | Register 4 new Stack screens |
| `src/i18n/locales/tr.json` | UPDATE | `budgets`, `goals`, `goalDetail`, `newBudget`, `newGoal`, `goalDeposit` namespaces |
| `src/i18n/locales/en.json` | UPDATE | Same keys, English |

## NOT Building
- **Budget spend recalculation on the server** — spend is derived client-side by `budgetProgress` from transactions, exactly as HomeScreen already does. No DB view.
- **Goal contribution editing/deleting** — deposits are append-only for Phase 9. No edit/delete of individual ledger rows.
- **Per-goal target-date-driven projection** — projection uses observed average monthly contribution, not `target_date`. (Design shows no explicit date field on the detail screen.)
- **Budget period navigation** — current month only (matches design: period is static subtitle text, no selector).
- **Light / vibrant theme pixel-diffing** — components are already theme-token driven; visual QA across all 4 modes is Phase 11.
- **Reworking `budget.category_name`** — keep storing the category KEY (aggregate.ts note); create-budget writes `category_name = category.key` and `icon = category.icon`.

---

## Step-by-Step Tasks

### Task 1: Migration — goal_contributions ledger + RPC
- **ACTION**: Create `supabase/migrations/20260720000000_goal_contributions.sql`.
- **IMPLEMENT**: Exactly the `MIGRATION` snippet above — table, two indexes, RLS enable + `_all_own` policy, `add_goal_contribution` SECURITY DEFINER function with `set search_path = public`, and the `revoke execute ... from public, anon`.
- **MIRROR**: `MIGRATION` pattern.
- **GOTCHA**: The function must `raise exception` when the ownership-scoped `update` matches no row, otherwise a caller could insert a ledger row for a goal they don't own (the insert uses `auth.uid()` but the update is the guard). File name timestamp must sort after `20260719010000`.
- **VALIDATE**: Apply locally with `supabase db reset` (or `supabase migration up`); then MCP `mcp__supabase__get_advisors({ type: 'security' })` shows no new `function_search_path_mutable` / `security_definer_function_executable` warnings.

### Task 2: Types — goal_contributions
- **ACTION**: Add the `goal_contributions` table to `src/types/database.ts` and exports to `src/types/index.ts`.
- **IMPLEMENT**: Row `{ id, user_id, goal_id, amount, note: string|null, occurred_at, created_at }`; Insert with optional `id/note/occurred_at/created_at`; `Update: Partial<...Insert>`. Export `GoalContribution`, `GoalContributionInsert`, `GoalContributionUpdate`.
- **MIRROR**: `database.ts:88-137` (goals block).
- **GOTCHA**: `database.ts` is hand-maintained — do NOT run `generate_typescript_types` and overwrite it. Keep the `Relationships: []` field for shape consistency.
- **VALIDATE**: `npm run typecheck`.

### Task 3: baseApi tag + contributions API
- **ACTION**: Add `'GoalContribution'` to `tagTypes` in `baseApi.ts`; create `src/store/api/goalContributionsApi.ts`; re-export from `src/store/api/index.ts`.
- **IMPLEMENT**: `RTK_ENDPOINTS` snippet — `useListGoalContributionsQuery(goalId)` and `useDepositToGoalMutation`. Deposit calls `supabase.rpc('add_goal_contribution', {...})`, invalidates `['Goal','GoalContribution']`.
- **MIRROR**: `RTK_ENDPOINTS`; `budgetsApi.ts` structure.
- **IMPORTS**: `import { api, toApiError } from './baseApi'`; `import { supabase } from '@/lib/supabase'`; types from `@/types`.
- **GOTCHA**: `supabase.rpc` returns the function's `returns public.goals` row as a plain object — cast `data as Goal`. Only pass `p_occurred_at` when provided so the SQL default applies.
- **VALIDATE**: `npm run typecheck`.

### Task 4: aggregate.ts goal helpers
- **ACTION**: Append pure helpers to `src/lib/aggregate.ts`.
- **IMPLEMENT**:
  - `goalPercent(goal)` → `goal.target_amount > 0 ? Math.min(100, Math.max(0, (goal.current_amount/goal.target_amount)*100)) : 0`.
  - `monthlyContributionSeries(contribs: GoalContribution[], months = 6, ref = new Date())` → array of `{ key, monthIndex, year, total }` for the last `months` calendar months (oldest→newest), summing `amount` per month; mark the last entry as current.
  - `averageMonthlyContribution(contribs, months = 6, ref)` → sum over the window ÷ number of months that had ≥1 contribution (0 when none).
  - `goalProjectionMonths(remaining: number, rate: number)` → `rate > 0 ? Math.ceil(remaining/rate) : null`.
- **MIRROR**: existing `monthSummary` / `budgetProgress` style (plain functions, `isSameMonth` helper, no side effects).
- **GOTCHA**: Series must include zero-total months so the chart shows a continuous 6-bar axis. Use `new Date(year, monthIndex, ...)` math; do not rely on string slicing of ISO.
- **VALIDATE**: `npm run typecheck`; hand-check series length === 6.

### Task 5: goalIcons.ts + atom tweaks
- **ACTION**: Create `src/lib/goalIcons.ts` (e.g. `export const GOAL_ICONS = ['target','car','plane','shield','laptop','home','graduation-cap','gift','piggy-bank','heart']`). Add optional `size` prop to `CategoryIcon` (default 44, icon size = `size * 0.45` rounded, default keeps 20). Add `tone: 'accent'` branch to `ButtonSecondary` (content `accentTeal`, bg `accentTealDim`, border `accentTealBorder`).
- **MIRROR**: `categories.ts` list style; `BudgetCard` accent-color usage for the button tint tokens.
- **GOTCHA**: Every existing `CategoryIcon`/`ButtonSecondary` call must remain valid — new props optional, defaults reproduce current output. Confirm all icon strings exist via `getIcon` (lucide) — reuse ones already seen in the design (`car`, `shield`, `laptop`, `target`).
- **VALIDATE**: `npm run typecheck`; grep existing usages still compile.

### Task 6: BudgetsScreen
- **ACTION**: Create `src/screens/BudgetsScreen.tsx`; wire `src/app/(tabs)/butceler.tsx` to `export { default } … ` → render it (keep the `default export function` route calling `<BudgetsScreen/>`, matching how tabs render screen components).
- **IMPLEMENT**: `LIST_SCREEN` pattern. Data: `useListBudgetsQuery(currentPeriodMonth())`, `useListTransactionsQuery()`. `const progress = budgetProgress(budgets, transactions)`. Header: `TitleSubtitle` title `t('budgets.title')`, subtitle `t('budgets.subtitle', { month: monthLabel, count: budgets.length })` where `monthLabel = formatDate(new Date(), { day: undefined, month: 'long', year: 'numeric' })`; trailing `ButtonIconOnly icon="plus" variant="accent" size={36}` → `router.push('/yeni-butce')`. Map each `progress` item to `<Pressable onPress={() => router.push({ pathname:'/yeni-butce', params:{ id: item.budget.id } })}><BudgetCard icon={item.budget.icon} categoryName={displayName(item.budget)} percent={Math.round(item.percent)} overLimit={item.over} footerLabel={item.over ? t('budgets.overBy',{amount: formatCurrency(item.spent-item.budget.limit_amount)}) : t('budgets.remaining',{amount: formatCurrency(item.budget.limit_amount-item.spent)})} /></Pressable>`. Empty state `t('budgets.empty')`. RefreshControl `refetch`.
- **MIRROR**: `LIST_SCREEN`; TransactionsScreen header + refresh.
- **GOTCHA**: `category_name` may be a category KEY — resolve a display label via `categoryByKey(name)` → `t(cat.labelKey)`, falling back to the raw string (same defensive pattern as `TransactionsScreen.categoryLabel`). Include bottom padding 120 so the last card clears the tab bar.
- **VALIDATE**: `npm run typecheck`; run app, Bütçeler tab shows cards; over-limit budget renders red variant.

### Task 7: GoalsScreen
- **ACTION**: Create `src/screens/GoalsScreen.tsx`; wire `src/app/(tabs)/hedefler.tsx`.
- **IMPLEMENT**: `LIST_SCREEN`. Data `useListGoalsQuery()`. `const totalSaved = goals.reduce((s,g)=>s+g.current_amount,0)`. Header `TitleSubtitle` title `t('goals.title')`, subtitle `t('goals.subtitle',{ count: goals.length, total: formatCurrency(totalSaved) })` (no trailing button — the add CTA is at list end). Each goal → `<Pressable onPress={()=>router.push(`/hedef/${g.id}`)}><GoalCard icon={g.icon} name={g.name} targetLabel={t('goals.target',{amount:formatCurrency(g.target_amount)})} percent={Math.round(goalPercent(g))} percentLabel={t('goals.completed')} amountsLabel={`${formatCurrency(g.current_amount)} / ${formatCurrency(g.target_amount)}`} etaLabel={g.target_date ? t('goals.eta',{date: formatDate(g.target_date,{day:undefined,month:'long',year:'numeric'})}) : t('goals.noEta')} /></Pressable>`. After the list: `<ButtonSecondary tone="accent" icon="plus" label={t('goals.addGoal')} onPress={()=>router.push('/yeni-hedef')} />`. Empty state text before the button when `goals.length===0`.
- **MIRROR**: `LIST_SCREEN`; GoalCard props.
- **GOTCHA**: `GoalCard` has no `onPress`; wrap in `Pressable` externally (don't modify the organism). Keep the "Yeni Hedef Ekle" button visible even when the list is empty.
- **VALIDATE**: `npm run typecheck`; tap a goal → detail pushes.

### Task 8: GoalProgressChart organism
- **ACTION**: Create `src/organisms/GoalProgressChart.tsx`; export from `organisms/index.ts`.
- **IMPLEMENT**: Card (`bgSurface`, `radius.md`, `padding spacing.md`, `gap`). Title `t('goalDetail.monthlyProgress')` (14/600). Props `{ bars: { label: string; value: number; current: boolean }[]; emptyLabel: string }`. Render a fixed-height (110) row of bars: each bar height = `max===0 ? 4 : Math.max(4, (value/max)*90)`, `borderRadius: radius.sm`, color `current ? accentTeal : accentTealDim`, flex:1 within row, `alignItems:'flex-end'`. Labels row underneath (10px tertiary, `label`). If all values 0 → show `emptyLabel` centered instead of bars.
- **MIRROR**: BudgetCard card container styling; HomeScreen `CHART_PALETTE` intent.
- **IMPORTS**: `useTheme`, RN `View/Text/StyleSheet`.
- **GOTCHA**: Guard divide-by-zero (`max` from `Math.max(...values, 0)`); a brand-new goal with only its onboarding seed (no ledger rows) shows the empty label — that's expected.
- **VALIDATE**: `npm run typecheck`; renders 6 bars with the last highlighted.

### Task 9: GoalDetailScreen + route
- **ACTION**: Create `src/screens/GoalDetailScreen.tsx` and `src/app/hedef/[id].tsx` (`import { GoalDetailScreen } from '@/screens'; export default GoalDetailScreen;`).
- **IMPLEMENT**: `useLocalSearchParams<{ id: string }>()`; `const goal = useListGoalsQuery().data?.find(g=>g.id===id)`; `useListGoalContributionsQuery(id)`. SafeAreaView `edges={['top']}` + ScrollView. Top: `AppBarBackTitle title={t('goalDetail.title')} onBack={router.back}`. Hero row: `CategoryIcon icon={goal.icon} size={56}` + name (20/700) + `t('goalDetail.completedPct',{pct: Math.round(goalPercent(goal))})`. Amounts row (space-between): left `Biriktirilen`/`formatCurrency(current_amount)` (28/700 accentTeal), right `Hedef`/`formatCurrency(target_amount)` (18/600 textPrimary). `<ProgressBar value={goalPercent(goal)} />`. `<GoalProgressChart bars={monthlyContributionSeries(contribs).map(m=>({label: formatDate(new Date(m.year,m.monthIndex,1),{month:'short',day:undefined,year:undefined}), value:m.total, current:m.current}))} emptyLabel={t('goalDetail.chartEmpty')} />`. Compute `rate = averageMonthlyContribution(contribs)`, `remaining = Math.max(0, target-current)`, `months = goalProjectionMonths(remaining, rate)`. If `current >= target`: render a "completed" pill (`t('goalDetail.reached')`). Else if `months != null`: projection box (accentTealDim, `trending-up` icon) `t('goalDetail.projection',{months})` + assumption row (bgSurfaceAlt, `calendar-check` icon) `t('goalDetail.assumption',{amount: formatCurrency(rate)})`. Footer sticky-ish `ButtonPrimary icon="plus" label={t('goalDetail.addMoney')}` → `router.push({pathname:'/hedef-para-ekle', params:{id}})`.
- **MIRROR**: NewTransactionScreen icon-row (`createElement(getIcon(...))`), HomeScreen section spacing, AppBarBackTitle.
- **GOTCHA**: `goal` can be `undefined` on a cold deep-link (list not cached) — render an `ActivityIndicator` fallback (HomeScreen loader pattern) until the query resolves; guard all `goal.` access. `router.back()` returns to Hedefler.
- **VALIDATE**: `npm run typecheck`; open detail, deposit, chart updates.

### Task 10: NewBudgetScreen + route + Stack
- **ACTION**: Create `src/screens/NewBudgetScreen.tsx`, `src/app/yeni-butce.tsx`, register in `_layout.tsx`.
- **IMPLEMENT**: `FORMSHEET_MODAL`. Header title `t(existing?'newBudget.editTitle':'newBudget.title')` + close X. Body: category selection via `categoriesByType('expense').map(cat => <CategoryChip selected={cat.key===categoryKey} .../>)` (wrap-flex like NewTransactionScreen chips); amount `FormFieldGroup` `keyboardType="decimal-pad"` (label `t('newBudget.limitLabel')`, icon `banknote`, `error={fieldError}`). Save: `parseAmount`, category chosen → payload `{ user_id, icon: cat.icon, category_name: cat.key, limit_amount, period_month: currentPeriodMonth() }`; create or update. Edit mode: `existing = useListBudgetsQuery(currentPeriodMonth()).data?.find(...)`, prefill; show a destructive `ButtonSecondary tone="destructive"` → `deleteBudget(existing.id)` then `router.back()`.
- **MIRROR**: `FORMSHEET_MODAL`; OnboardingGoalScreen form; NewTransactionScreen chips + close button.
- **GOTCHA**: `budgets` has `unique(user_id, category_name, period_month)` — a duplicate create returns a Postgres error; map `error.code === '23505'` → `t('newBudget.duplicate')` field error instead of the generic `saveFailed`. Register the route with `sheetAllowedDetents: [0.9]`.
- **VALIDATE**: `npm run typecheck`; create budget → appears in list; duplicate shows friendly error; delete removes it.

### Task 11: NewGoalScreen + route + Stack
- **ACTION**: Create `src/screens/NewGoalScreen.tsx`, `src/app/yeni-hedef.tsx`, register in `_layout.tsx`.
- **IMPLEMENT**: `FORMSHEET_MODAL`. Fields: name `FormFieldGroup` (icon `target`); icon picker — `GOAL_ICONS.map(ic => <CategoryChip icon={ic} label="" selected={ic===icon} onPress={()=>setIcon(ic)} />)` (or a simple icon-only row); target amount `FormFieldGroup decimal-pad`; optional initial saved amount `decimal-pad`; optional target date via `DateTimePicker` (NewTransactionScreen date-row pattern, `minimumDate={new Date()}`). Save payload `{ user_id, icon, name, target_amount, current_amount?: initial, target_date?: date.toISOString().slice(0,10) }` (DB column is `date`). Edit mode via `useListGoalsQuery().data?.find` + delete button. Reuse `createGoal`/`updateGoal`/`deleteGoal`.
- **MIRROR**: OnboardingGoalScreen (goal payload, `Number(x.replace(',','.'))`), NewTransactionScreen date picker.
- **GOTCHA**: `target_date` column is a `date` (YYYY-MM-DD), not timestamptz — write `.toISOString().slice(0,10)`. Keep create idempotency guard (`useRef` like OnboardingGoalScreen) only if chaining a second mutation; here a single `createGoal` needs none. `sheetAllowedDetents: [0.92]`.
- **VALIDATE**: `npm run typecheck`; create goal → list + detail work; edit/delete work.

### Task 12: GoalDepositScreen + route + Stack
- **ACTION**: Create `src/screens/GoalDepositScreen.tsx`, `src/app/hedef-para-ekle.tsx`, register in `_layout.tsx`.
- **IMPLEMENT**: `useLocalSearchParams<{id:string}>()`; goal from `useListGoalsQuery` cache for header context (name + remaining). Amount input (reuse the NewTransactionScreen `AmountDisplay` + `NumpadKeyRow`, OR a `FormFieldGroup decimal-pad` — pick numpad to match the "add money" feel). Optional note `InputField`. `useDepositToGoalMutation`; on save `deposit({ goal_id:id, amount, note })`; `router.back()` on success, `setFormError(t('goalDeposit.saveFailed'))` on catch. Header title `t('goalDeposit.title')` + close X.
- **MIRROR**: NewTransactionScreen numpad+AmountDisplay+save; `FORMSHEET_MODAL`.
- **GOTCHA**: Deposit invalidates `Goal` + `GoalContribution`; the detail screen behind the sheet re-queries automatically on dismiss. `sheetAllowedDetents: [0.6]`. Validate `amount > 0`.
- **VALIDATE**: `npm run typecheck`; deposit updates current_amount, progress bar, and chart.

### Task 13: i18n keys (tr + en)
- **ACTION**: Add namespaces to `src/i18n/locales/tr.json` then mirror in `en.json`.
- **IMPLEMENT** (tr values from the design):
  - `budgets`: `{ title:"Bütçeler", subtitle:"{{month}} · {{count}} kategori", remaining:"Kalan {{amount}}", overBy:"{{amount}} limiti aşıldı", empty:"Henüz bütçe eklemedin." }`
  - `goals`: `{ title:"Hedefler", subtitle:"{{count}} hedefte toplam {{total}} biriktirdin", target:"Hedef: {{amount}}", completed:"tamamlandı", eta:"Tahmini: {{date}}", noEta:"Tarih belirlenmedi", addGoal:"Yeni Hedef Ekle", empty:"Henüz hedef eklemedin." }`
  - `goalDetail`: `{ title:"Hedef Detayı", completedPct:"%{{pct}} tamamlandı", saved:"Biriktirilen", target:"Hedef", monthlyProgress:"Aylık İlerleme", chartEmpty:"Henüz katkı yok", projection:"Bu hızda {{months}} ayda tamamlanır", assumption:"Aylık {{amount}} ortalama katkına göre hesaplandı", reached:"Hedefe ulaşıldı 🎉", addMoney:"Bu Hedefe Para Ekle" }`
  - `newBudget`: `{ title:"Yeni Bütçe", editTitle:"Bütçeyi Düzenle", limitLabel:"Aylık limit", save:"Kaydet", saving:"Kaydediliyor…", delete:"Bütçeyi Sil", duplicate:"Bu kategori için bu ay zaten bütçe var.", saveFailed:"Kaydedilemedi." }`
  - `newGoal`: `{ title:"Yeni Hedef", editTitle:"Hedefi Düzenle", nameLabel:"Hedef adı", namePlaceholder:"Örn. Tatilim", targetLabel:"Hedef tutar", savedLabel:"Başlangıç birikimi (opsiyonel)", dateLabel:"Hedef tarihi (opsiyonel)", iconLabel:"Simge", save:"Kaydet", saving:"Kaydediliyor…", delete:"Hedefi Sil", saveFailed:"Kaydedilemedi." }`
  - `goalDeposit`: `{ title:"Para Ekle", notePlaceholder:"Not (opsiyonel)", save:"Ekle", saving:"Ekleniyor…", saveFailed:"Eklenemedi." }`
  - Reuse existing `validation.amountRequired`, `common.cancel`, `newTransaction.close`.
- **MIRROR**: existing `home`/`transactions` namespace shape and `{{var}}` interpolation.
- **GOTCHA**: Both files must have identical key sets (typed keys — `src/types/i18next.d.ts` derives from `tr.json`); a missing en key fails typecheck or falls back silently. Keep `%{{pct}}` literal percent + interpolation.
- **VALIDATE**: `npm run typecheck` (i18next typed-keys); toggle language in-app, strings resolve.

### Task 14: Screens barrel + wiring sanity
- **ACTION**: Add all 6 new screens to `src/screens/index.ts`. Confirm `butceler.tsx`/`hedefler.tsx` render the new screens and the 4 new routes are registered in `_layout.tsx`.
- **VALIDATE**: `npm run lint && npm run typecheck && npm run format:check`; cold-start the app and walk the full flow.

---

## Testing Strategy

> No unit-test harness exists in this repo (no `jest`/`test` script). Validation is typecheck + lint + format + manual/E2E, consistent with Phases 6–8. Pure helpers added to `aggregate.ts` are the only unit-testable surface; if a harness lands later, target those.

### Pure-function checks (manual or future unit)
| Function | Input | Expected | Edge |
|---|---|---|---|
| `goalPercent` | current 82500 / target 150000 | 55 | target 0 → 0 |
| `goalPercent` | current 50 / target 40 | 100 (clamped) | ✔ |
| `monthlyContributionSeries` | 3 rows across 2 months | length 6, correct months summed, last = current | empty → 6 zero bars |
| `averageMonthlyContribution` | 6000 over 2 active months | 3000 | none → 0 |
| `goalProjectionMonths` | remaining 67500, rate 3500 | 20 | rate 0 → null |

### Edge Cases Checklist
- [ ] Empty budget list / empty goal list → friendly empty text, add buttons still work
- [ ] Over-limit budget → red BudgetCard variant + "limiti aşıldı" footer
- [ ] Goal already at/over target → "Hedefe ulaşıldı", projection hidden
- [ ] Goal with zero contributions → chart shows `chartEmpty`, no projection/assumption
- [ ] Duplicate budget (same category+month) → `newBudget.duplicate` field error, not a crash
- [ ] Cold deep-link to `hedef/[id]` (list not cached) → loader, then content
- [ ] Deposit → current_amount, progress bar, and chart all update on sheet dismiss

---

## Validation Commands

### Static Analysis
```bash
npm run typecheck
```
EXPECT: Zero type errors (incl. i18next typed keys and new database types).

### Lint / Format
```bash
npm run lint
npm run format:check
```
EXPECT: Clean.

### Database Validation
```bash
supabase migration up      # or: supabase db reset  (local stack)
```
Then via MCP: `mcp__supabase__get_advisors({ type: 'security' })`
EXPECT: Migration applies; no new function-security or RLS advisor warnings for `goal_contributions` / `add_goal_contribution`.

### App Validation
```bash
npm run start      # Expo; open on device/simulator
```
EXPECT: Bütçeler + Hedefler tabs render live data; create/edit budget; create/edit/delete goal; open goal detail; deposit; chart + progress update.

### Manual Validation
- [ ] Bütçeler: cards match design (icon, %, remaining/over), ＋ opens sheet, tap card edits
- [ ] Hedefler: summary subtitle correct, cards tappable, "Yeni Hedef Ekle" opens sheet
- [ ] Hedef Detay: hero, amounts, bar, monthly chart, projection/assumption, deposit button
- [ ] Deposit flow round-trips and updates the detail screen
- [ ] Language toggle (tr↔en) resolves every new string

---

## Acceptance Criteria
- [ ] `phases.md` Phase 9 items (Bütçeler, Hedefler, Hedef Detay) built and checkable
- [ ] All validation commands pass (typecheck, lint, format)
- [ ] Migration applied; deposit RPC atomic + ownership-checked; no new advisors
- [ ] Screens match the Pencil design structure (sections, labels, over-limit variant)
- [ ] tr + en key parity

## Completion Checklist
- [ ] Follows discovered patterns (LIST_SCREEN, FORMSHEET_MODAL, RTK_ENDPOINTS, MIGRATION)
- [ ] Errors handled via `toApiError` + `AlertBanner`/field errors, matching Phase 8
- [ ] No hardcoded strings — all through i18n; no hardcoded colors — all through theme tokens
- [ ] Organisms reused unmodified (BudgetCard, GoalCard); only additive atom props
- [ ] Route re-export files are thin default exports
- [ ] No scope additions beyond the three screens + their three flows + ledger
- [ ] Self-contained — implementable from this plan without further searching

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `add_goal_contribution` grants/`search_path` trip an advisor warning | Med | Low | Mirror harden migration exactly; run `get_advisors` in validation |
| i18next typed-keys break on tr/en drift | Med | Med | Add both files in the same task; typecheck catches missing keys |
| Chart under-reports for pre-ledger goals (onboarding seed has no rows) | High | Low | Expected + documented; `chartEmpty` state; progress bar still uses `current_amount` |
| `budget.category_name` KEY-vs-display mismatch in labels | Med | Low | `categoryByKey` + raw fallback (same as TransactionsScreen) |
| Cold deep-link to goal detail with empty cache | Low | Med | Loader fallback + guarded `goal.` access |

## Notes
- **Scope decisions (confirmed with user):** build all three flows now (create budget, create goal, deposit); add a real `goal_contributions` ledger driving the monthly chart.
- **Projection wording adapted:** design says "düzenli gelirine göre" but there's no savings-rate field; projection uses observed **average monthly contribution** and the assumption row is worded accordingly (`goalDetail.assumption`).
- **`current_amount` stays the source of truth** for progress numbers; the ledger is additive history. Onboarding-seeded goals have `current_amount` but no ledger rows — acceptable.
- After implementation: mark Phase 9 `[x]` in `.claude/phases.md` and write `.claude/PRPs/reports/phase-9-budgets-goals-screens-report.md` (matching the Phase 8 report convention).
- Design source-of-truth values captured in this plan came from the Pencil dark frames "Bütçeler" (`ONMtk`), "Hedefler" (`a2rAH`), "Hedef Detay" (`kqnqY`).
