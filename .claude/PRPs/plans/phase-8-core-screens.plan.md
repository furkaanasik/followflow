# Plan: Phase 8 — Core Screens (Ana Sayfa · İşlemler · Yeni İşlem Modal)

## Summary
Build the three core-loop screens of FollowFlow on top of the existing atomic component library and RTK Query data layer: **Ana Sayfa** (home dashboard with month summary, category-breakdown donut, budget tracking, recent transactions, FAB), **İşlemler** (date-grouped, searchable transaction list), and **Yeni İşlem Modal** (bottom-sheet with income/expense toggle, category picker, custom numpad, note). Also wires the design's floating pill **BottomNavigationBar** as the real tab bar across all 5 tabs.

## User Story
As a FollowFlow user who has finished onboarding, I want a home screen that summarizes my month and quick access to log a transaction, plus a searchable transaction history, so that I can track income/expenses against my budgets in the core daily loop.

## Problem → Solution
Tabs `index` and `islemler` are placeholder stubs (`<Text>Ana Sayfa</Text>`), there is no way to create a transaction, and the default expo-router tab bar is shown instead of the designed pill nav. → Three fully-built screens wired to Supabase via existing RTK Query endpoints, a modal create flow, and the custom `BottomNavigationBar` mounted as the tab bar.

## Metadata
- **Complexity**: Large (15+ files: 3 screens, 2 new organisms/molecules, 2 lib helpers, nav glue, i18n, route + layout edits)
- **Source PRD**: `.claude/phases.md`
- **PRD Phase**: Phase 8 — Core Screens
- **Estimated Files**: ~18 (7 CREATE screens/components, ~11 UPDATE)

### Decisions locked (from planning Q&A)
1. **Yeni İşlem type**: add a **Gelir/Gider `SegmentedToggle`** at the top of the sheet (design has none, but the domain requires `type`). Selected type filters the category catalog.
2. **Kategori Dağılımı donut**: **build now** as a new organism `CategoryBreakdownCard` (SVG donut + legend, computed from current-month transactions).
3. **Bottom nav**: **wire the custom `BottomNavigationBar`** organism as the tab bar now (affects all 5 tabs).

---

## UX Design

### Ana Sayfa (`weNuR` in design.pen, dark)
```
┌───────────────────────────────┐
│ Merhaba, Ahmet        [⚙][👤] │  header: greeting + subtitle, settings + avatar
│ Bugün nasıl gidiyor?          │
│ ┌───────────────────────────┐ │
│ │ BU AY NET DURUM           │ │  NetDurumCard (existing organism)
│ │ ₺12.480,00                │ │
│ │ ↑ Gelir 35.500  ↓ Gider…  │ │
│ └───────────────────────────┘ │
│ Kategori Dağılımı             │
│ ┌───────────────────────────┐ │
│ │   ◗ ₺7.240   • Market …   │ │  CategoryBreakdownCard (NEW: donut + legend)
│ └───────────────────────────┘ │
│ Bütçe İzleme                  │
│  Market      ▓▓▓▓░░░  (rows)  │  BudgetProgressRow ×N (existing molecule)
│ Son İşlemler       Tümünü Gör │
│  🛒 Migros        -₺284,50    │  TransactionRow ×5 (existing molecule)
│  💰 Maaş        +₺32.000,00   │
│                          (+)  │  FAB → /yeni-islem
│  [ Ana Sayfa · İşlemler · … ] │  custom BottomNavigationBar
└───────────────────────────────┘
```

### İşlemler (`D6t88`)
```
┌───────────────────────────────┐
│ İşlemler                  (+)  │  AppBarSimpleTitle + green add button
│ [🔍 İşlem ara…]        [⇅]     │  SearchBar (existing molecule)
│ Bugün                         │
│  🛒 Migros        -₺284,50    │  TransactionListCard per date group
│ Dün                           │
│  ⛽ Shell         -₺650,00    │
│ Bu Hafta                      │
│  🏠 Kira        -₺18.000,00   │
│  [ nav ]                       │
└───────────────────────────────┘
```

### Yeni İşlem Modal (`Z7Owld`, bottom sheet)
```
┌───────────────────────────────┐
│            ▬                   │  grabber
│ Yeni İşlem                 (×) │  title + close
│ [ Gider │ Gelir ]             │  SegmentedToggle (NEW placement)
│         ₺1.250                 │  AmountDisplay (existing atom)
│ 🛒 Kira Kafe Ulaşım Sağlık …  │  horizontal CategoryChip row (NEW molecule)
│ 📅 Bugün                   ›   │  date row (display-only this phase)
│ 📝 Not ekle (opsiyonel)       │  InputField (note)
│  1   2   3                     │
│  4   5   6                     │  NumpadKeyRow ×4 (existing molecules)
│  7   8   9                     │
│  .   0   ⌫                     │
│ [        Kaydet         ]      │  ButtonPrimary → createTransaction → close
└───────────────────────────────┘
```

### Interaction Changes
| Touchpoint | Before | After | Notes |
|---|---|---|---|
| Home tab | `<Text>Ana Sayfa</Text>` | Full dashboard | Reads transactions + budgets |
| İşlemler tab | `<Text>İşlemler</Text>` | Searchable grouped list | Client-side search filter |
| Create txn | none | FAB / header `+` → sheet | New `/yeni-islem` route |
| Tab bar | default expo Tabs | floating pill nav | `BottomNavigationBar` as `tabBar` |

---

## Mandatory Reading

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 | `src/screens/OnboardingIncomeSourceScreen.tsx` | 1-205 | Canonical screen pattern: SafeAreaView + theme + RTK mutation + validation + i18n |
| P0 | `src/store/api/transactionsApi.ts` | all | `useListTransactionsQuery`, `useCreateTransactionMutation` |
| P0 | `src/types/database.ts` | 138-167 | `transactions` Row/Insert shape (`type`, `category`, `icon`, `title`, `note`, `amount`, `occurred_at`) |
| P0 | `src/app/_layout.tsx` | 118-146 | Root Stack + `Stack.Protected` guards — where the modal route mounts |
| P0 | `src/app/(tabs)/_layout.tsx` | all | Tabs layout to replace with custom `tabBar` |
| P1 | `src/organisms/NetDurumCard.tsx` | all | Reused on home; hardcoded TR labels to i18n-ize |
| P1 | `src/organisms/TransactionListCard.tsx` + `src/molecules/TransactionRow.tsx` | all | List rendering + `TransactionRowProps` |
| P1 | `src/molecules/{NumpadKey,NumpadKeyRow,SegmentedToggle,SearchBar,BudgetProgressRow}.tsx` | all | Modal + list building blocks and their props |
| P1 | `src/organisms/BottomNavigationBar.tsx` + `src/molecules/NavItem.tsx` | all | Tab bar composition + `NavBarItem` props |
| P1 | `src/lib/format.ts` | all | `formatCurrency`, `formatDate`, `parseAmount` |
| P1 | `src/atoms/{AmountDisplay,CategoryIcon,ButtonIconOnly,ProgressBar}.tsx` | all | Props + `ProgressBar` value is **0–100** |
| P2 | `src/i18n/locales/tr.json` | all | Existing namespaces to extend (mirror in `en.json`) |
| P2 | `src/store/api/budgetsApi.ts` | all | `useListBudgetsQuery(periodMonth)` |
| P2 | `src/navigation/tabs.ts` | all | `TAB_ROUTES` order (index, islemler, butceler, hedefler, ayarlar) |

## External Documentation
| Topic | Source | Key Takeaway |
|---|---|---|
| expo-router bottom sheet | expo-router ~57 (`presentation`) | Present modal via `Stack.Screen options={{ presentation: 'formSheet', sheetAllowedDetents:[0.92], sheetGrabberVisible:true }}`. Fallback: `'transparentModal'` + custom bottom `View` if formSheet detents misbehave on Android. |
| react-native-svg donut | `react-native-svg` v15 (installed) | Donut = one `<Circle>` per segment with `strokeDasharray`, `strokeDashoffset`, rotated -90°; `strokeLinecap="butt"`, `fill="none"`. |

No other external research needed — everything else uses established internal patterns.

---

## Patterns to Mirror

### SCREEN_STRUCTURE
```tsx
// SOURCE: src/screens/OnboardingIncomeSourceScreen.tsx:99-193
export function OnboardingIncomeSourceScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  return (
    <SafeAreaView edges={['top','bottom']} style={[styles.container,{ backgroundColor: theme.colors.bgApp }]}>
      <ScrollView contentContainerStyle={[styles.scrollContent,{ gap: theme.spacing.lg }]} showsVerticalScrollIndicator={false}>
        {/* sections */}
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({ container:{flex:1}, scrollContent:{ flexGrow:1, paddingTop:16, paddingHorizontal:24, paddingBottom:32 } });
```

### RTK_MUTATION_SUBMIT
```tsx
// SOURCE: src/screens/OnboardingIncomeSourceScreen.tsx:35, 84-97
const [createTransaction, { isLoading: submitting }] = useCreateTransactionMutation();
try {
  await createTransaction({ user_id: session!.user.id, type, category, icon, title, note, amount }).unwrap();
} catch { setFormError(t('newTransaction.saveFailed')); return; }
router.back();
```

### RTK_QUERY_LIST
```tsx
// SOURCE: src/store/api/transactionsApi.ts:17-27, 72-77
const { data: transactions = [], isLoading } = useListTransactionsQuery();
```

### SESSION_ACCESS
```tsx
// SOURCE: src/screens/OnboardingIncomeSourceScreen.tsx:33
const session = useAppSelector((s) => s.auth.session);
// user id: session!.user.id
```

### THEMED_TEXT
```tsx
// SOURCE: src/organisms/NetDurumCard.tsx:34-52
<Text style={{ fontFamily: theme.fonts.body.semibold, fontSize: 12, color: theme.colors.textSecondary }}>{label}</Text>
<Text style={{ fontFamily: theme.fonts.heading.bold, fontSize: 38, color: theme.colors.accentTeal }}>{amount}</Text>
```

### ELEVATED_CARD
```tsx
// SOURCE: src/organisms/NetDurumCard.tsx:23-33
<View style={[styles.container,{ borderRadius: theme.radius.lg, backgroundColor: theme.colors.bgSurface, padding: theme.spacing.lg, ...elevatedShadow('#000000', 0.19, 8, 20) }]} />
```

### ICON_RENDER
```tsx
// SOURCE: src/organisms/NetDurumCard.tsx:1,96 — getIcon returns a Lucide component; render via createElement
import { createElement } from 'react';
import { getIcon } from '@/lib/icons';
createElement(getIcon('shopping-cart'), { size: 20, color: theme.colors.accentTeal })
```

### ICON_ONLY_BUTTON (FAB / header add)
```tsx
// SOURCE: src/atoms/ButtonIconOnly.tsx:17-55
<ButtonIconOnly icon="plus" variant="accent" size={56} accessibilityLabel={t('home.addTransaction')} onPress={() => router.push('/yeni-islem')} />
```

### SEGMENTED_TOGGLE
```tsx
// SOURCE: src/molecules/SegmentedToggle.tsx / usage OnboardingIncomeSourceScreen.tsx:161-167
<SegmentedToggle
  options={[{ label: t('newTransaction.expense'), value: 'expense' }, { label: t('newTransaction.income'), value: 'income' }]}
  value={type} onChange={(v) => setType(v as 'income' | 'expense')} />
```

### NUMPAD
```tsx
// SOURCE: src/molecules/NumpadKeyRow.tsx:10-18 — keys are strings; onKeyPress(key)
{[['1','2','3'],['4','5','6'],['7','8','9'],['.','0','⌫']].map((row,i)=>(
  <NumpadKeyRow key={i} keys={row} onKeyPress={handleKey} />
))}
```

### INDEX_BARREL
```ts
// SOURCE: src/organisms/index.ts, src/molecules/index.ts, src/screens/index.ts
export * from './CategoryBreakdownCard';
```

### EXISTING_SCREEN_ROUTE_WIRE
```tsx
// SOURCE: src/app/(onboarding)/income.tsx — route file just re-exports the screen as default
import { HomeScreen } from '@/screens';
export default HomeScreen;
```

---

## Files to Change

| File | Action | Justification |
|---|---|---|
| `src/lib/categories.ts` | CREATE | Category catalog (key, i18n label, lucide icon, tint, type) for chips + row icons |
| `src/lib/aggregate.ts` | CREATE | Pure helpers: month summary, category breakdown, budget progress, date grouping, txn→row mapping |
| `src/molecules/CategoryChip.tsx` | CREATE | Selectable category chip (CategoryIcon + label) for the modal |
| `src/organisms/CategoryBreakdownCard.tsx` | CREATE | SVG donut + legend organism (decision #2) |
| `src/navigation/AppTabBar.tsx` | CREATE | expo-router `tabBar` adapter → renders `BottomNavigationBar` (decision #3) |
| `src/screens/HomeScreen.tsx` | CREATE | Ana Sayfa |
| `src/screens/TransactionsScreen.tsx` | CREATE | İşlemler |
| `src/screens/NewTransactionScreen.tsx` | CREATE | Yeni İşlem modal body |
| `src/app/yeni-islem.tsx` | CREATE | Modal route → re-exports `NewTransactionScreen` |
| `src/app/(tabs)/index.tsx` | UPDATE | Re-export `HomeScreen` (replace stub) |
| `src/app/(tabs)/islemler.tsx` | UPDATE | Re-export `TransactionsScreen` (replace stub) |
| `src/app/(tabs)/_layout.tsx` | UPDATE | Custom `tabBar={AppTabBar}`, `headerShown:false` |
| `src/app/_layout.tsx` | UPDATE | Add `yeni-islem` `Stack.Screen` (formSheet) under the onboarded guard |
| `src/navigation/tabs.ts` | UPDATE | Add `icon` + i18n `titleKey` per route |
| `src/organisms/NetDurumCard.tsx` | UPDATE | Accept `incomeLabel`/`expenseLabel` props (i18n; keep TR defaults) |
| `src/organisms/index.ts` | UPDATE | Export `CategoryBreakdownCard` |
| `src/molecules/index.ts` | UPDATE | Export `CategoryChip` |
| `src/screens/index.ts` | UPDATE | Export the 3 new screens |
| `src/i18n/locales/tr.json` | UPDATE | Add `home`, `transactions`, `newTransaction`, `categories`, `nav` + validation keys |
| `src/i18n/locales/en.json` | UPDATE | Mirror the same keys in English |

## NOT Building
- **Date picker** in the modal: `occurred_at` defaults to **now**; the "Bugün" row is display-only (avoids adding `@react-native-community/datetimepicker`). Wire a picker in a later phase.
- **Filter sheet** behind the `SearchBar` filter button: button present, `onFilterPress` is a no-op stub this phase. Only the **text search** is functional.
- Editing/deleting a transaction (row tap detail) — later phase.
- Realtime subscriptions — RTK Query cache invalidation on create is sufficient for now.
- Budget/Goal screens (Phase 9), Settings/management (Phase 10).
- Pixel-diff verification against Pencil (desktop app not attached — same gap noted in prior phase reports).

---

## Step-by-Step Tasks

### Task 1: Category catalog — `src/lib/categories.ts`
- **ACTION**: Define the expense + income category catalog used by the modal chips and by row/legend icons.
- **IMPLEMENT**:
  ```ts
  import type { ColorTokens } from '@/theme/tokens';
  export interface Category { key: string; labelKey: string; icon: string; tint: keyof ColorTokens; type: 'income' | 'expense'; }
  export const CATEGORIES: Category[] = [
    { key: 'market',    labelKey: 'categories.market',    icon: 'shopping-cart', tint: 'accentTeal',    type: 'expense' },
    { key: 'kira',      labelKey: 'categories.kira',      icon: 'home',          tint: 'accentTeal',    type: 'expense' },
    { key: 'kafe',      labelKey: 'categories.kafe',      icon: 'coffee',        tint: 'accentTeal',    type: 'expense' },
    { key: 'ulasim',    labelKey: 'categories.ulasim',    icon: 'bus',           tint: 'accentTeal',    type: 'expense' },
    { key: 'saglik',    labelKey: 'categories.saglik',    icon: 'activity',      tint: 'accentTeal',    type: 'expense' },
    { key: 'fatura',    labelKey: 'categories.fatura',    icon: 'receipt',       tint: 'accentTeal',    type: 'expense' },
    { key: 'diger_gider', labelKey: 'categories.diger',   icon: 'ellipsis',      tint: 'textSecondary', type: 'expense' },
    { key: 'maas',      labelKey: 'categories.maas',      icon: 'banknote',      tint: 'incomeGreen',   type: 'income'  },
    { key: 'freelance', labelKey: 'categories.freelance', icon: 'laptop',        tint: 'incomeGreen',   type: 'income'  },
    { key: 'diger_gelir', labelKey: 'categories.diger',   icon: 'ellipsis',      tint: 'incomeGreen',   type: 'income'  },
  ];
  export const categoriesByType = (type: 'income' | 'expense') => CATEGORIES.filter((c) => c.type === type);
  export const categoryByKey = (key: string) => CATEGORIES.find((c) => c.key === key);
  ```
- **MIRROR**: `ColorTokens` import style from `src/molecules/TransactionRow.tsx:5`.
- **GOTCHA**: `icon` strings must be valid lucide kebab names — `getIcon` throws on unknown (`src/lib/icons.ts:23`). Verify each name exists in `lucide-react-native` (e.g. `receipt`, `ellipsis`, `laptop`, `activity`, `bus`, `coffee`).
- **VALIDATE**: `npm run typecheck`; temporarily render each icon or grep lucide exports.

### Task 2: Aggregation helpers — `src/lib/aggregate.ts`
- **ACTION**: Pure functions to derive dashboard data from `Transaction[]` + `Budget[]`, plus list grouping and row mapping. Keep framework-free for unit tests.
- **IMPLEMENT** (signatures):
  ```ts
  import type { Transaction, Budget } from '@/types';
  export const currentPeriodMonth = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`; // matches budgets.period_month (date)
  export const isSameMonth = (iso: string, ref = new Date()) => { const d = new Date(iso); return d.getFullYear()===ref.getFullYear() && d.getMonth()===ref.getMonth(); };
  export interface MonthSummary { income: number; expense: number; net: number; }
  export function monthSummary(txns: Transaction[], ref?: Date): MonthSummary; // sum by type over current month
  export interface CategorySlice { category: string; total: number; }
  export function expenseByCategory(txns: Transaction[], ref?: Date): CategorySlice[]; // desc by total; only type==='expense'
  export interface BudgetProgress { budget: Budget; spent: number; percent: number; over: boolean; } // percent 0-100 clamped for the bar
  export function budgetProgress(budgets: Budget[], txns: Transaction[], ref?: Date): BudgetProgress[]; // spent = sum expense txns where category===budget.category_name (or key) in month
  export type DateBucket = 'today' | 'yesterday' | 'thisWeek' | 'earlier';
  export function bucketFor(iso: string, ref?: Date): DateBucket;
  export interface TxnGroup { bucket: DateBucket; label: string; items: Transaction[]; } // label resolved by caller via i18n/formatDate
  export function groupByDate(txns: Transaction[]): { bucket: DateBucket; items: Transaction[] }[]; // ordered today→earlier, sorted desc within
  ```
- Add a **presentation mapper** that stays UI-aware only at call site; keep pure part returning primitives. The screen maps a `Transaction` to `TransactionRowProps`:
  ```ts
  // in the screen (needs t + theme), not in aggregate.ts:
  const rowProps = (txn) => ({ id: txn.id, icon: txn.icon, iconTint: categoryByKey(txn.category)?.tint ?? 'accentTeal',
    title: txn.title, subtitle: `${t(categoryLabelKey)} · ${relLabel}`, tone: txn.type === 'income' ? 'income' : 'expense',
    amount: `${txn.type==='income'?'+':'-'}${formatCurrency(txn.amount)}` });
  ```
- **MIRROR**: numeric handling from `src/lib/format.ts`; keep functions dependency-free.
- **GOTCHA**: `budgets.period_month` is a `date` (`YYYY-MM-01`); build the string with `-01`, not `YYYY-MM`. `budget.category_name` stores a **display name** while transactions store a category **key** — decide one join key. Recommendation: store the category **key** in both `transaction.category` and `budget.category_name` going forward; for existing seed data, match case-insensitively on label as a fallback. Document the chosen join in a comment.
- **VALIDATE**: `npm run typecheck`. Optionally add a Jest-free assertion script under scratchpad, or unit tests if a runner is added (none configured yet — see Testing Strategy).

### Task 3: `CategoryChip` molecule — `src/molecules/CategoryChip.tsx`
- **ACTION**: Selectable chip = `CategoryIcon` above a small label; selected state raises opacity/adds accent ring.
- **IMPLEMENT**: props `{ icon: string; label: string; tint?: keyof ColorTokens; selected?: boolean; onPress: () => void }`. Wrap in `Pressable` (vertical, `alignItems:center`, gap 6, width ~56). When `selected`, wrap `CategoryIcon` in a ring: border `withAlpha(theme.colors.accentTeal,'3D')` / bg `accentTealDim`; label color `accentTeal` vs `textSecondary`.
- **MIRROR**: `CategoryIcon` usage (`src/atoms/CategoryIcon.tsx`), selected styling idiom from `SegmentedToggle.tsx:100-110`, `withAlpha` from `src/lib/color.ts`.
- **GOTCHA**: `CategoryIcon` has fixed 44×44; don't set width on the icon — size the chip label with `textGrowth`-free RN `<Text>` (RN, not Pencil — normal styling).
- **VALIDATE**: renders in the modal category row; `npm run typecheck` + `npm run lint`.

### Task 4: `CategoryBreakdownCard` organism — `src/organisms/CategoryBreakdownCard.tsx`
- **ACTION**: Elevated card containing an SVG donut (center = total expense) and a legend of top categories with amounts.
- **IMPLEMENT**:
  - Props: `{ slices: { category: string; label: string; total: number; color: string }[]; total: number; totalLabel: string }`.
  - Donut: `react-native-svg` `<Svg><Circle>` background track + one `<Circle>` per slice with `stroke=color`, `strokeWidth`, `fill="none"`, `strokeDasharray={`${len} ${C-len}`}`, `strokeDashoffset`, and a rotation transform so segments chain. `C = 2πr`. Center `<Text>` overlay via absolute `View`.
  - Legend: map slices → row of `[dot color] label ......... formatCurrency(total)`.
  - Colors: cycle a palette derived from theme (`accentTeal`, `income`/`expense`, plus `expenseCoral`, `textSecondary`) or per-category `tint`.
- **MIRROR**: card container from `NetDurumCard.tsx:23-33` (radius `lg`, `bgSurface`, `elevatedShadow`). Icon/label text styles from `NetDurumCard` `StatCol`.
- **GOTCHA**: `react-native-svg` `Circle` uses props not RN styles; import `Svg, Circle` from `react-native-svg`. Guard empty state (`total === 0` → show muted "Bu ay için veri yok"). Donut segment order must accumulate offsets (prev totals) to avoid overlap.
- **VALIDATE**: screenshot/manual against `weNuR`; `npm run typecheck`.

### Task 5: `AppTabBar` — `src/navigation/AppTabBar.tsx`
- **ACTION**: Adapt expo-router `Tabs` `tabBar` render prop to the floating `BottomNavigationBar` organism.
- **IMPLEMENT**:
  ```tsx
  import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
  import { View } from 'react-native';
  import { useSafeAreaInsets } from 'react-native-safe-area-context';
  import { BottomNavigationBar } from '@/organisms';
  import { TAB_ROUTES } from './tabs';
  export function AppTabBar({ state, navigation }: BottomTabBarProps) {
    const insets = useSafeAreaInsets();
    const items = state.routes.map((route, i) => {
      const meta = TAB_ROUTES.find((r) => r.name === route.name)!;
      return { icon: meta.icon, label: t(meta.titleKey), active: state.index === i,
        onPress: () => navigation.navigate(route.name) };
    });
    return (
      <View style={{ position:'absolute', left:0, right:0, bottom: insets.bottom + 8, alignItems:'center' }} pointerEvents="box-none">
        <BottomNavigationBar items={items} />
      </View>
    );
  }
  ```
- **MIRROR**: `NavBarItem` shape from `BottomNavigationBar.tsx:8-13`; icon names per tab (index→`home`, islemler→`arrow-left-right`, butceler→`wallet`, hedefler→`target`, ayarlar→`settings`).
- **GOTCHA**: `useTranslation` must be called inside the component (hook). The floating bar overlays content, so screens need `paddingBottom` (~96) in their scroll content so the last row isn't hidden. `pointerEvents="box-none"` lets touches pass through the wrapper's empty area.
- **VALIDATE**: all 5 tabs switch; active tab highlighted; bar floats above safe area.

### Task 6: Extend `TAB_ROUTES` — `src/navigation/tabs.ts`
- **ACTION**: Add `icon` and `titleKey` to each route; keep `title` for fallback.
- **IMPLEMENT**: `{ name:'index', title:'Ana Sayfa', titleKey:'nav.home', icon:'home' }`, etc. (islemler→`nav.transactions`/`arrow-left-right`, butceler→`nav.budgets`/`wallet`, hedefler→`nav.goals`/`target`, ayarlar→`nav.settings`/`settings`).
- **VALIDATE**: `npm run typecheck` (used by `_layout` + `AppTabBar`).

### Task 7: Custom tab bar wiring — `src/app/(tabs)/_layout.tsx`
- **ACTION**: Replace default Tabs bar with `AppTabBar`; hide headers.
- **IMPLEMENT**:
  ```tsx
  <Tabs tabBar={(props) => <AppTabBar {...props} />} screenOptions={{ headerShown: false }}>
    {TAB_ROUTES.map((r) => <Tabs.Screen key={r.name} name={r.name} options={{ title: r.title }} />)}
  </Tabs>
  ```
- **GOTCHA**: keep `Tabs.Screen` entries so route order/registration is unchanged.
- **VALIDATE**: no default tab bar visible; custom pill shows.

### Task 8: `HomeScreen` — `src/screens/HomeScreen.tsx`
- **ACTION**: Compose the dashboard.
- **IMPLEMENT**: `useListTransactionsQuery()` + `useListBudgetsQuery(currentPeriodMonth())`. Derive `monthSummary`, `expenseByCategory`, `budgetProgress`. Sections in a `ScrollView` (contentContainerStyle gap `lg`, `paddingBottom` ~96 for floating nav):
  1. Header row: greeting `t('home.greeting',{name})` (name from `profile.display_name` via `useGetProfileQuery` or fallback), subtitle, settings `ButtonIconOnly` + `Avatar`.
  2. `NetDurumCard` with `label={t('home.netStatus')}`, `amount/incomeAmount/expenseAmount` via `formatCurrency`, and new `incomeLabel/expenseLabel` props.
  3. Section title `t('home.categoryBreakdown')` + `CategoryBreakdownCard`.
  4. Section title `t('home.budgetTracking')` + `BudgetProgressRow` per `budgetProgress` (`progress=percent`, `progressColor = over ? 'warningRed' : 'accentTeal'`, subtitle = `${spent}/${limit}`).
  5. Section header row `t('home.recentTransactions')` + `Pressable` `t('home.seeAll')` → `router.push('/(tabs)/islemler')`; then top 5 `TransactionRow` mapped from txns.
  6. FAB: absolute `ButtonIconOnly` `plus`, size 56, `bottom` above nav, `right` 24 → `router.push('/yeni-islem')`.
- **MIRROR**: `SCREEN_STRUCTURE`, `THEMED_TEXT`, `ICON_ONLY_BUTTON`. Loading: reuse the app-colored `ActivityIndicator` pattern from `_layout.tsx:66-78`.
- **GOTCHA**: FAB must sit above the floating nav — position it `bottom: insets.bottom + 72`. Empty states: no txns → show muted "Henüz işlem yok"; no budgets → hide the section.
- **VALIDATE**: matches `weNuR`; scroll doesn't hide last row under nav; FAB opens modal.

### Task 9: `TransactionsScreen` — `src/screens/TransactionsScreen.tsx`
- **ACTION**: Searchable, date-grouped transaction list.
- **IMPLEMENT**: local `const [query,setQuery]=useState('')`. `useListTransactionsQuery()`. Filter by `query` (case-insensitive over `title` + resolved category label + note). `groupByDate(filtered)` → render `AppBarSimpleTitle` + header `ButtonIconOnly plus` (green accent) in a row, `SearchBar`, then a `TransactionListCard` per group with `dateLabel = t('transactions.'+bucket)` (today/yesterday/thisWeek/earlier). Wrap in `SafeAreaView` + `ScrollView` (paddingBottom ~96).
- **MIRROR**: `SearchBar` usage, `TransactionListCard` props (`dateLabel`, `transactions: (TransactionRowProps & {id})[]`).
- **GOTCHA**: `SearchBar.onFilterPress` is required — pass a no-op `() => {}` (filter sheet is out of scope). `TransactionListCard.transactions` items need an `id` field merged into row props.
- **VALIDATE**: matches `D6t88`; typing filters live; groups render in order.

### Task 10: `NewTransactionScreen` — `src/screens/NewTransactionScreen.tsx`
- **ACTION**: Bottom-sheet create form with toggle, category picker, custom numpad, note.
- **IMPLEMENT** (state): `type:'income'|'expense'`, `amountRaw:string` (digits + optional single `.`), `categoryKey:string`, `note:string`, error states.
  - Header row: title `t('newTransaction.title')` + close `ButtonIconOnly x` (surface) → `router.back()`.
  - `SegmentedToggle` Gider/Gelir (SEGMENTED_TOGGLE pattern). On type change, reset `categoryKey` to first of that type.
  - `AmountDisplay amount={formatAmountInput(amountRaw)} tone={type==='income'?'income':'expense'}`.
  - Horizontal `ScrollView` of `CategoryChip` from `categoriesByType(type)`; selected = `categoryKey`.
  - Date row (display-only): icon `calendar` + `t('newTransaction.today')` + chevron; not pressable this phase.
  - Note `InputField` (`icon:'pencil'`, placeholder `t('newTransaction.notePlaceholder')`).
  - Numpad (NUMPAD pattern): `handleKey(k)` appends digit, single `.`, or backspace on `⌫`; ignore leading extra dots; cap length.
  - `ButtonPrimary` `t('newTransaction.save')` → validate (`parseAmount(amountRaw) > 0`, category selected) → `createTransaction({ user_id: session!.user.id, type, category: categoryKey, icon: categoryByKey(categoryKey)!.icon, title: note.trim() || t(labelKey), note: note.trim() || null, amount: parseAmount(amountRaw), occurred_at: new Date().toISOString() }).unwrap()` → `router.back()`.
  - `formatAmountInput(raw)`: prefix `₺`, TR-group the integer part, keep typed decimals (helper local to file or in `format.ts`).
- **MIRROR**: `RTK_MUTATION_SUBMIT`, `SESSION_ACCESS`, validation shape from `OnboardingIncomeSourceScreen.tsx:52-97`, `AlertBanner` for `formError`.
- **GOTCHA**: `parseAmount` returns `NaN` for empty (by design) — treat as invalid. `title` is NOT NULL in the DB → never pass empty; fall back to category label. Set `occurred_at` to ISO (default now). No merchant field exists in the design — `title` intentionally derives from note/category.
- **VALIDATE**: matches `Z7Owld`; numpad drives amount; save creates row and closes; new row appears on home/İşlemler (RTK invalidates `Transaction`).

### Task 11: Modal route + Stack registration
- **ACTION**: Create route file and register the sheet in the root Stack.
- **IMPLEMENT**:
  - `src/app/yeni-islem.tsx`: `import { NewTransactionScreen } from '@/screens'; export default NewTransactionScreen;`
  - `src/app/_layout.tsx`: inside the onboarded `Stack.Protected` block (lines 136-144), add:
    ```tsx
    <Stack.Screen name="yeni-islem" options={{ presentation:'formSheet', sheetAllowedDetents:[0.92], sheetGrabberVisible:true, headerShown:false, contentStyle:{ backgroundColor: theme.colors.bgSurface } }} />
    ```
- **MIRROR**: existing `Stack.Screen` entries `_layout.tsx:124-144`.
- **GOTCHA**: The route must be reachable under the onboarded guard only. If `formSheet` detents render poorly on Android, fall back to `presentation:'transparentModal'` and render the sheet as a bottom-anchored `View` with a `Pressable` backdrop that calls `router.back()`.
- **VALIDATE**: FAB and İşlemler `+` both open the sheet over the tab bar; swipe-down / close dismisses.

### Task 12: Wire tab screen re-exports + barrels
- **ACTION**: Replace stubs; export new modules.
- **IMPLEMENT**: `src/app/(tabs)/index.tsx` → `import { HomeScreen } from '@/screens'; export default HomeScreen;`; same for `islemler.tsx` → `TransactionsScreen`. Add exports to `src/screens/index.ts`, `src/organisms/index.ts`, `src/molecules/index.ts`.
- **MIRROR**: `EXISTING_SCREEN_ROUTE_WIRE`.
- **VALIDATE**: `npm run typecheck`; tabs render real screens.

### Task 13: i18n keys — `tr.json` + `en.json`
- **ACTION**: Add namespaces; mirror EN.
- **IMPLEMENT** (tr): 
  - `nav`: home/transactions/budgets/goals/settings.
  - `home`: greeting `"Merhaba, {{name}}"`, subtitle `"Bugün nasıl gidiyor?"`, netStatus `"BU AY NET DURUM"`, categoryBreakdown `"Kategori Dağılımı"`, budgetTracking `"Bütçe İzleme"`, recentTransactions `"Son İşlemler"`, seeAll `"Tümünü Gör"`, addTransaction `"İşlem ekle"`, empty `"Henüz işlem yok"`, noData `"Bu ay için veri yok"`.
  - `transactions`: title `"İşlemler"`, searchPlaceholder `"İşlem ara…"`, today `"Bugün"`, yesterday `"Dün"`, thisWeek `"Bu Hafta"`, earlier `"Daha Önce"`, empty.
  - `newTransaction`: title `"Yeni İşlem"`, income `"Gelir"`, expense `"Gider"`, today `"Bugün"`, notePlaceholder `"Not ekle (opsiyonel)"`, save `"Kaydet"`, saving `"Kaydediliyor…"`, saveFailed (reuse onboarding tone), amountRequired, categoryRequired.
  - `categories`: market/kira/kafe/ulasim/saglik/fatura/diger/maas/freelance.
  - `common.gelir`/`common.gider` for NetDurumCard labels (or under `home`).
  - `validation.amountRequired`, `validation.categoryRequired`.
- **MIRROR**: existing nesting in `tr.json` (namespaces + `{{var}}` interpolation like `onboarding.step`).
- **GOTCHA**: Typed keys — `src/types/i18next.d.ts` derives from `tr.json`, so EN must mirror **exactly** the same key set or `t()` types break. Update both files in the same task.
- **VALIDATE**: `npm run typecheck` (typed `t` catches missing keys); switch device locale to confirm EN.

### Task 14: i18n-ize `NetDurumCard`
- **ACTION**: Add optional `incomeLabel`/`expenseLabel` props (default current TR strings) so home can pass `t()`.
- **IMPLEMENT**: extend props; replace hardcoded `"Gelir"`/`"Gider"` in `StatCol` calls with the props. Keep `label` default as-is.
- **GOTCHA**: don't break existing callers — defaults preserve behavior.
- **VALIDATE**: `npm run typecheck`; home passes translated labels.

---

## Testing Strategy

No test runner is configured yet (no Jest in `package.json`). Two options — pick per repo direction:
- **Preferred**: keep `aggregate.ts`/`categories.ts` pure and add lightweight assertions in a scratchpad script, OR add `jest-expo` if the team wants a runner (out of this phase's stated scope).
- **Minimum**: rely on `tsc` + `lint` + manual device validation (matches how Phases 2–7 were verified per their reports).

If a runner is added, target `src/lib/aggregate.ts`:

| Test | Input | Expected | Edge? |
|---|---|---|---|
| `monthSummary` sums by type | mixed income/expense in month | `{income, expense, net=income-expense}` | — |
| `monthSummary` ignores other months | txn dated last month | excluded | yes |
| `expenseByCategory` desc order | 3 categories | sorted by total desc, expense only | — |
| `budgetProgress.percent` clamp | spent > limit | `percent=100`, `over=true` | yes |
| `budgetProgress` zero limit | limit 0 | no divide-by-zero (`percent=0` or 100) | yes |
| `bucketFor` today/yesterday/week | boundary dates | correct bucket | yes |
| `groupByDate` empty | `[]` | `[]` | yes |
| `parseAmount` empty | `''` | `NaN` (already covered) | yes |

### Edge Cases Checklist
- [ ] Empty transactions → home shows empty states, İşlemler shows empty, donut shows "no data"
- [ ] No budgets → budget section hidden
- [ ] Amount `0` / empty / just `.` → save blocked
- [ ] Over-limit budget → coral/warning bar + `over`
- [ ] Long category list → horizontal scroll, no clip
- [ ] Income vs expense tone/sign correct on rows
- [ ] Create failure (offline) → `AlertBanner`, sheet stays open
- [ ] Last list row not hidden behind floating nav

---

## Validation Commands

### Static Analysis
```bash
npm run typecheck
```
EXPECT: Zero type errors (typed `t()` keys included)

### Lint / Format
```bash
npm run lint && npm run format:check
```
EXPECT: Clean

### Dev server (manual)
```bash
npx expo start
```
EXPECT: Login → (already onboarded) tabs. Home renders summary/donut/budgets/recent + FAB. İşlemler filters. FAB opens sheet; save creates a row visible on both screens. Custom pill nav on all tabs.

### Database sanity (optional, MCP)
- `mcp__supabase__execute_sql`: `select type,category,title,amount,occurred_at from transactions order by created_at desc limit 5;` after a create.

### Manual Validation
- [ ] Ana Sayfa visually matches `weNuR` (dark) — spot-check `light`/`vibrant` too
- [ ] İşlemler matches `D6t88`
- [ ] Yeni İşlem matches `Z7Owld`; numpad + toggle + category all functional
- [ ] Create round-trips to Supabase and invalidates the list

---

## Acceptance Criteria
- [ ] Ana Sayfa, İşlemler, Yeni İşlem built and reachable
- [ ] Transaction create works end-to-end (FAB + header `+`), list refreshes
- [ ] Search filters İşlemler live; grouped by date
- [ ] Custom `BottomNavigationBar` is the tab bar on all 5 tabs
- [ ] `CategoryBreakdownCard` donut renders from real month data
- [ ] All strings via i18n (tr + en mirrored); typed keys compile
- [ ] `npm run typecheck` / `lint` / `format:check` clean

## Completion Checklist
- [ ] Screens follow `SCREEN_STRUCTURE` (SafeAreaView + theme + ScrollView)
- [ ] Data via existing RTK Query hooks; errors via `AlertBanner`
- [ ] Icons via `getIcon`/`createElement`; colors via theme tokens (no hardcoded hex except shadows)
- [ ] Reuses existing atoms/molecules/organisms; only 2 genuinely-new components added
- [ ] No new npm dependency added (svg already present; no datetimepicker)
- [ ] `paddingBottom` clears the floating nav on every scroll screen
- [ ] Self-contained — no further codebase searching needed

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `formSheet` detents flaky on Android | Med | Med | Fallback to `transparentModal` + custom bottom sheet (Task 11 gotcha) |
| Budget↔transaction join key mismatch (key vs display name) | Med | Med | Standardize on category **key** in both tables; case-insensitive label fallback for seed data (Task 2) |
| Donut segment math (offsets/overlap) | Med | Low | Accumulate prior totals for `strokeDashoffset`; empty-state guard |
| Typed i18n breaks if en/tr key sets diverge | Med | Low | Edit both files in Task 13; `tsc` catches gaps |
| Floating nav hides content | Low | Low | `paddingBottom ~96` + `pointerEvents="box-none"` |
| Lucide icon name typo → runtime throw | Low | Med | Verify each catalog/nav icon against lucide exports (Task 1) |

## Notes
- Category "Diğer" maps to two keys (`diger_gider`/`diger_gelir`) sharing one label key so the type stays unambiguous while UI shows one word.
- `NetDurumCard`, `TransactionListCard`, `TransactionRow`, `BudgetProgressRow`, `SearchBar`, `SegmentedToggle`, `AmountDisplay`, `NumpadKey*`, `ButtonIconOnly`, `BottomNavigationBar`, `AppBarSimpleTitle` are all reused as-is (only `NetDurumCard` gets optional label props).
- Design node IDs for reference (dark frame `B6Of5s`): Ana Sayfa `weNuR`, İşlemler `D6t88`, Yeni İşlem `Z7Owld`. Light equivalents live under `YH1sM` (Pages Light).
- Prior-phase convention: named screen export in `src/screens/*`, re-exported as default by the route file in `src/app/**`.
