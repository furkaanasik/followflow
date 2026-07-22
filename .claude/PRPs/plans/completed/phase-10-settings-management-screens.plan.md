# Plan: Phase 10 — Settings & Management Screens

## Summary
Build the three remaining FollowFlow screens: **Gelir Kaynaklarım** (my income sources), **Tekrarlayan Ödemeler** (recurring payments), and a fleshed-out **Ayarlar** (settings) with theme switcher, language switcher, navigation into the two management lists, and sign-out. Each management list gets an add/edit form-sheet mirroring the existing `NewGoalScreen` create/edit pattern. All data flows through the already-built RTK Query slices (`incomeSourcesApi`, `recurringPaymentsApi`) and the already-built organism cards (`IncomeSourceCard`, `RecurringPaymentCard`), which currently have **zero consumers** — this phase is their first use.

## User Story
As a FollowFlow user, I want to manage my income sources and recurring payments after onboarding and control app preferences (theme, language) plus sign out, so that my forecasts stay accurate and the app fits my taste without reinstalling.

## Problem → Solution
Onboarding captures income sources and recurring payments once, then they are unreachable; Ayarlar is a stub with only a language toggle; there is no sign-out. → Two full management screens (list + add + edit + delete) reachable from Ayarlar, plus a complete settings screen with theme/language switchers and sign-out.

## Metadata
- **Complexity**: Medium
- **Source PRD**: `.claude/phases.md`
- **PRD Phase**: Phase 10 — Settings & Management Screens
- **Estimated Files**: 13 (7 create, 6 update)

---

## UX Design

### Before
```
Ayarlar (tab)
┌─────────────────────────────┐
│ Ayarlar                     │
│                             │
│ Dil                         │
│ [ Türkçe | English ]        │  ← only language toggle
│                             │
│ (nothing else)              │
└─────────────────────────────┘
Gelir Kaynaklarım    → does not exist
Tekrarlayan Ödemeler → does not exist
```

### After
```
Ayarlar (tab)                         Gelir Kaynaklarım (pushed)
┌─────────────────────────────┐       ┌─────────────────────────────┐
│ Ayarlar                     │       │ ← Gelir Kaynaklarım         │
│                             │       │ Toplam aylık: ₺X · N kaynak │
│ Yönetim                     │       │                             │
│ ▸ Gelir Kaynaklarım         │──push→│ ┌ IncomeSourceCard ───────┐ │
│ ▸ Tekrarlayan Ödemeler      │       │ │ Maaş         ₺25.000,00 │ │
│                             │       │ │ Aylık · Her ayın 1'i  ✎🗑│ │
│ Görünüm                     │       │ └─────────────────────────┘ │
│ [Koyu|Açık|Canlı|C.Koyu]    │       │ [ + Gelir Kaynağı Ekle ]    │
│                             │       └─────────────────────────────┘
│ Dil                         │              │ tap ✎ / + opens form-sheet
│ [ Türkçe | English ]        │              ▼
│                             │       ┌─────────────────────────────┐
│ ▸ Çıkış Yap (destructive)   │       │ Gelir Kaynağı  ✎          ✕ │
└─────────────────────────────┘       │ [name][amount][freq][payDay]│
                                       │ [ Kaydet ]  ([Sil] if edit) │
                                       └─────────────────────────────┘
```
Tekrarlayan Ödemeler is structurally identical, using `RecurringPaymentCard` (coral amount, category icon, "Sonraki: <date>" meta) and a form-sheet that writes `next_payment_date`.

### Interaction Changes
| Touchpoint | Before | After | Notes |
|---|---|---|---|
| Ayarlar list row → Gelir Kaynaklarım | absent | `router.push('/gelir-kaynaklarim')` | new stack screen |
| Ayarlar list row → Tekrarlayan Ödemeler | absent | `router.push('/tekrarlayan-odemeler')` | new stack screen |
| Theme selection | none | `SegmentedToggle` → `useTheme().setMode(mode)` | local persist (AsyncStorage), same as today |
| Sign out | none | `signOut()` (`@/lib/auth`) → `onAuthStateChange` resets to login | already wired in `_layout.tsx` |
| Add income/recurring | onboarding only | `+` button → form-sheet `router.push('/yeni-gelir' | '/yeni-tekrarlayan')` | mirrors `NewGoalScreen` |
| Edit income/recurring | absent | card ✎ → same form-sheet with `?id=` | edit vs create by `id` param |
| Delete income/recurring | absent | card 🗑 → `Alert.alert` confirm → delete mutation | mirrors `NewGoalScreen.confirmDelete` |

---

## Mandatory Reading

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 | `src/screens/NewGoalScreen.tsx` | all | **The** create/edit form-sheet template: local `useState` seeded from `existing`, validation, create-vs-update branch, `confirmDelete`, header with ✕, footer `ButtonPrimary`, `KeyboardAvoidingView`. Copy its skeleton for both new form-sheets. |
| P0 | `src/screens/GoalsScreen.tsx` | all | List-screen template: `useFocusEffect`+`InteractionManager` refetch, `TitleSubtitle` header, map rows, empty `<Text>`, `ButtonSecondary` add button. Copy for the two list screens. |
| P0 | `src/screens/SettingsScreen.tsx` | all | Current stub to extend. Keep its `SafeAreaView`/`ScrollView`/`AppBarSimpleTitle`/language section; add sections around it. |
| P0 | `src/organisms/IncomeSourceCard.tsx` | all | Card to render per income source. Props: `name, amount(str), frequencyLabel, dayLabel, onEdit, onDelete`. Has built-in ✎🗑 (`CardActions`). |
| P0 | `src/organisms/RecurringPaymentCard.tsx` | all | Card for recurring rows. Props: `icon, name, amount(str), frequencyLabel, nextLabel, onEdit, onDelete`. Exports `CardActions`. |
| P0 | `src/store/api/incomeSourcesApi.ts` | all | Hooks: `useListIncomeSourcesQuery`, `useCreateIncomeSourceMutation`, `useUpdateIncomeSourceMutation`, `useDeleteIncomeSourceMutation`. |
| P0 | `src/store/api/recurringPaymentsApi.ts` | all | Same shape for recurring. `listRecurringPayments` orders by `next_payment_date` asc. |
| P1 | `src/screens/OnboardingIncomeSourceScreen.tsx` | 43-97 | Exact validation rules for income (name/amount/payDay), payload field names, `frequency as 'monthly' \| 'weekly'`. Reuse the validation verbatim. |
| P1 | `src/screens/OnboardingRecurringPaymentScreen.tsx` | 60-106 | Recurring payload: `icon:'repeat'`, `next_payment_date: computeNextPaymentDate(parsedPayDay)`. |
| P1 | `src/lib/onboarding.ts` | all | `computeNextPaymentDate(dayOfMonth, today?)` → `YYYY-MM-DD`. Use in recurring create/update. |
| P1 | `src/app/_layout.tsx` | 119-195 | Where to register the 4 new stack screens (2 pushed, 2 form-sheets). Mirror `hedef/[id]` (push) and `yeni-hedef` (formSheet) option blocks. |
| P1 | `src/screens/GoalDetailScreen.tsx` | 82-103, 130-144 | `AppBarBackTitle` usage, not-found/loading fallback, "deleted → `router.back()`" effect (needed by edit form-sheets keyed on `id`). |
| P1 | `src/molecules/SegmentedToggle.tsx` | 19-60 | Options are `{label, value}[]`, `value:string`, `onChange(value:string)`. Segments are `flex:1`, so 4 options fit but labels must be short. |
| P1 | `src/molecules/InfoRowChevron.tsx` | all | Reusable settings/nav row: `icon, label, value, valueColor?, onPress`. Use for the two "management" nav rows in Ayarlar (pass `value=''`). |
| P1 | `src/lib/format.ts` | all | `formatCurrency(n)`, `formatDate(v, opts)`, `parseAmount(str)` (TR/plain). |
| P2 | `src/types/database.ts` | 34-87 | Exact columns. `income_sources.pay_day` is `number \| null`; `frequency` enum has weekly/biweekly/monthly/yearly/one-time. `recurring_payments` has **no pay_day** — derive from `next_payment_date`. |
| P2 | `src/i18n/locales/en.json` | 134-137, 44-77, 188-204 | Current `settings` keys (only title+language), onboarding label keys to reuse, `newGoal` key shape to mirror. |
| P2 | `src/app/(tabs)/ayarlar.tsx`, `hedefler.tsx`, `hedef/[id].tsx`, `yeni-hedef.tsx` | all | Route-wrapper convention: `export { default } = <Screen>` (one-liner re-export). |

## External Documentation
No external research needed — feature uses only established internal patterns (RTK Query slices, expo-router stack, existing atoms/molecules/organisms, i18next). Pencil desktop app is **not attached** this session, so pixel-diffing against `design/design.pen` is deferred to Phase 11 (same gap noted in Phase 2/8/9 reports); implementation follows the documented design tokens + the already-designed organism cards.

---

## Patterns to Mirror

### NAMING_CONVENTION
```tsx
// SOURCE: src/screens/GoalsScreen.tsx:22, src/screens/index.ts
// Screen component = PascalCase named export `export function XxxScreen()`.
// Barrel re-exports each: export * from './XxxScreen';
export function IncomeSourcesScreen() { /* ... */ }
```
```tsx
// SOURCE: src/app/(tabs)/hedefler.tsx, src/app/yeni-hedef.tsx
// Route file = one-line default re-export. Turkish kebab-case filename = URL path.
import { IncomeSourcesScreen } from '@/screens';
export default IncomeSourcesScreen;
```

### LIST_SCREEN
```tsx
// SOURCE: src/screens/GoalsScreen.tsx:22-108 (condensed)
export function GoalsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { data: goals = [], refetch } = useListGoalsQuery();

  useFocusEffect(
    useCallback(() => {
      const task = InteractionManager.runAfterInteractions(() => refetch());
      return () => task.cancel();
    }, [refetch]),
  );

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: theme.colors.bgApp }]}>
      <ScrollView contentContainerStyle={[styles.content, { gap: theme.spacing.md }]} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TitleSubtitle title={t('goals.title')} subtitle={t('goals.subtitle', { count: goals.length, total: formatCurrency(totalSaved) })} />
        </View>
        {goals.length > 0 ? goals.map((g) => (/* card */)) : (
          <Text style={{ fontFamily: theme.fonts.body.medium, fontSize: 13, color: theme.colors.textTertiary, paddingTop: theme.spacing.lg }}>
            {t('goals.empty')}
          </Text>
        )}
        <ButtonSecondary tone="accent" icon="plus" label={t('goals.addGoal')} onPress={() => router.push('/yeni-hedef')} />
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flexGrow: 1, paddingTop: 8, paddingHorizontal: 24, paddingBottom: 120 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
```
> For the two management list screens: use `AppBarBackTitle` (they are pushed, not tabs) in place of the bare `TitleSubtitle`, wrapped in a header row exactly like `GoalDetailScreen.tsx:130-144`, then a subtitle line below. Render one card per row (cards carry their own `onEdit`/`onDelete`).

### FORM_SHEET (create + edit + delete)
```tsx
// SOURCE: src/screens/NewGoalScreen.tsx:38-328 (condensed skeleton)
export function NewGoalScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const insets = useSafeAreaInsets();
  const { data: goals = [] } = useListGoalsQuery();
  const [createGoal, { isLoading: creating }] = useCreateGoalMutation();
  const [updateGoal, { isLoading: updating }] = useUpdateGoalMutation();
  const [deleteGoal, { isLoading: deleting }] = useDeleteGoalMutation();
  const submitting = creating || updating || deleting;
  const existing = id ? goals.find((g) => g.id === id) : undefined;

  const [name, setName] = useState(() => existing?.name ?? '');
  // ...seed every field from `existing` in a lazy initializer...
  const [formError, setFormError] = useState<string | undefined>();

  async function handleSave() {
    /* clear errors, validate, build payload */
    try {
      if (existing) await updateGoal({ id: existing.id, ...payload }).unwrap();
      else await createGoal({ user_id: session!.user.id, ...payload }).unwrap();
    } catch { setFormError(t('newGoal.saveFailed')); return; }
    router.back();
  }
  function confirmDelete() {
    if (!existing) return;
    Alert.alert(t('newGoal.deleteTitle'), t('newGoal.deleteMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive',
        onPress: () => deleteGoal(existing.id).unwrap().then(() => router.back()).catch(() => setFormError(t('newGoal.saveFailed'))) },
    ]);
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bgSurface }]}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={[styles.content, { gap: theme.spacing.md }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={{ fontFamily: theme.fonts.heading.bold, fontSize: 20, color: theme.colors.textPrimary }}>
              {existing ? t('newGoal.editTitle') : t('newGoal.title')}
            </Text>
            <ButtonIconOnly icon="x" variant="surface" size={40} accessibilityLabel={t('newTransaction.close')} onPress={() => router.back()} />
          </View>
          {formError ? <AlertBanner message={formError} /> : null}
          {/* FormFieldGroup fields + SegmentedToggle */}
          {existing ? <ButtonSecondary tone="destructive" icon="trash-2" label={t('newGoal.delete')} onPress={confirmDelete} /> : null}
        </ScrollView>
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <ButtonPrimary label={submitting ? t('newGoal.saving') : t('newGoal.save')} onPress={handleSave} disabled={submitting} />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
// styles: container flex:1; content paddingTop:12 paddingHorizontal:24 paddingBottom:8; footer paddingHorizontal:24 paddingTop:8; header row space-between.
```

### VALIDATION (income/recurring — reuse verbatim)
```tsx
// SOURCE: src/screens/OnboardingIncomeSourceScreen.tsx:58-82
let valid = true;
if (!name.trim()) { setNameError(t('validation.incomeNameRequired')); valid = false; }
const parsedAmount = Number(amount.replace(',', '.'));
if (!amount.trim() || Number.isNaN(parsedAmount) || parsedAmount <= 0) { setAmountError(t('validation.amountInvalid')); valid = false; }
const parsedPayDay = Number(payDay);
if (!payDay.trim() || !Number.isInteger(parsedPayDay) || parsedPayDay < 1 || parsedPayDay > 31) { setPayDayError(t('validation.payDayInvalid')); valid = false; }
if (!valid) return;
```
> Use `parseAmount()` from `@/lib/format` instead of the raw `Number(amount.replace(',','.'))` if you prefer the shared helper — either is accepted; `NewGoalScreen` uses `parseAmount`. Be consistent within a file.

### RECURRING_DATE
```tsx
// SOURCE: src/screens/OnboardingRecurringPaymentScreen.tsx:93-100, src/lib/onboarding.ts
await createRecurringPayment({
  user_id: session!.user.id, icon: 'repeat', name, amount: parsedAmount,
  frequency: frequency as 'monthly' | 'weekly',
  next_payment_date: computeNextPaymentDate(parsedPayDay),
}).unwrap();
// EDIT: seed payDay input from the stored date → String(new Date(existing.next_payment_date).getDate())
// then on save recompute next_payment_date = computeNextPaymentDate(parsedPayDay).
// Preserve the row's existing `icon` on update (don't overwrite with 'repeat').
```

### SETTINGS_SECTION + SIGN_OUT
```tsx
// SOURCE: src/screens/SettingsScreen.tsx (extend) + src/lib/auth.ts:54
import { signOut } from '@/lib/auth';
// Section heading style (reused from existing SettingsScreen language heading):
<Text style={{ fontFamily: theme.fonts.heading.semibold, fontSize: 16, color: theme.colors.textPrimary }}>{t('settings.appearance')}</Text>
// Nav rows -> management screens:
<InfoRowChevron icon="wallet" label={t('settings.incomeSources')} value="" onPress={() => router.push('/gelir-kaynaklarim')} />
<InfoRowChevron icon="repeat" label={t('settings.recurringPayments')} value="" onPress={() => router.push('/tekrarlayan-odemeler')} />
// Theme switcher:
<SegmentedToggle
  options={[
    { label: t('settings.themeDark'), value: 'dark' },
    { label: t('settings.themeLight'), value: 'light' },
    { label: t('settings.themeVibrant'), value: 'vibrant' },
    { label: t('settings.themeVibrantDark'), value: 'vibrant-dark' },
  ]}
  value={theme.mode}
  onChange={(m) => setMode(m as ThemeMode)}
/>
// Sign out (destructive):
async function handleSignOut() {
  try { await signOut(); } catch { Alert.alert(t('settings.signOutFailed')); }
}
<ButtonSecondary tone="destructive" icon="log-out" label={t('settings.signOut')} onPress={handleSignOut} />
```
> `useTheme()` returns `{ ...tokens, mode, setMode }` (see `ThemeProvider.tsx:63-66` — `mode` comes from the spread `getThemeTokens(mode)` result via Redux; read it as `theme.mode`). Import `ThemeMode` from `@/theme/tokens`.

### DELETE_CONFIRM
```tsx
// SOURCE: src/screens/NewGoalScreen.tsx:120-136 — Alert.alert with cancel + destructive.
// For list-level delete (card 🗑), same Alert, then call deleteIncomeSource(id).unwrap().catch(...).
```

---

## Files to Change

| File | Action | Justification |
|---|---|---|
| `src/screens/IncomeSourcesScreen.tsx` | CREATE | Gelir Kaynaklarım list (list + add btn + per-card edit/delete). |
| `src/screens/RecurringPaymentsScreen.tsx` | CREATE | Tekrarlayan Ödemeler list. |
| `src/screens/NewIncomeSourceScreen.tsx` | CREATE | Add/edit income form-sheet (create + update + delete). |
| `src/screens/NewRecurringPaymentScreen.tsx` | CREATE | Add/edit recurring form-sheet. |
| `src/app/gelir-kaynaklarim.tsx` | CREATE | Route wrapper (push) → IncomeSourcesScreen. |
| `src/app/tekrarlayan-odemeler.tsx` | CREATE | Route wrapper (push) → RecurringPaymentsScreen. |
| `src/app/yeni-gelir.tsx` | CREATE | Route wrapper (formSheet) → NewIncomeSourceScreen. |
| `src/app/yeni-tekrarlayan.tsx` | CREATE | Route wrapper (formSheet) → NewRecurringPaymentScreen. |
| `src/screens/SettingsScreen.tsx` | UPDATE | Add appearance (theme) section, management nav rows, sign-out; keep language section. |
| `src/app/_layout.tsx` | UPDATE | Register 4 new `Stack.Screen`s inside the authenticated+onboarded `Stack.Protected` block. |
| `src/screens/index.ts` | UPDATE | Barrel-export the 4 new screens. |
| `src/i18n/locales/tr.json` | UPDATE | New keys: `settings.*`, `incomeSources.*`, `recurringPayments.*`, `newIncome.*`, `newRecurring.*`, `frequency.*`, `common.edit`, validation reuse. |
| `src/i18n/locales/en.json` | UPDATE | Same keys, English values. Keys must match `tr.json` 1:1. |

## NOT Building
- **No new atoms/molecules/organisms** — `IncomeSourceCard`, `RecurringPaymentCard`, `InfoRowChevron`, `SegmentedToggle`, `AppBarBackTitle`, `FormFieldGroup`, `AlertBanner`, `ButtonPrimary/Secondary/IconOnly` all already exist. If a card needs a tweak, prefer prop use over editing it.
- **No profile.theme_mode sync** — theme persists locally via AsyncStorage (current `ThemeProvider` architecture reads Redux+AsyncStorage only, never the profile). Writing `profile.theme_mode` would be a half-wired feature (never read back). Out of scope; note in report as a Phase 11 candidate.
- **No frequency beyond monthly/weekly in the forms** — onboarding only writes `monthly`/`weekly` and `SegmentedToggle` is 2-up there; keep the two form-sheets to those two values. The card *display* maps all enum values (defensive) but the editor offers two. (biweekly/yearly/one-time rows, if ever created via DB, still render + delete fine.)
- **No password change / delete-account / notification settings** — not in the Phase 10 screen inventory.
- **No new tab** — Gelir Kaynaklarım & Tekrarlayan Ödemeler are pushed stack screens reached from Ayarlar, NOT bottom-nav tabs (nav stays 5 tabs).
- **No Pencil pixel-diff** — desktop app not attached; visual QA deferred to Phase 11.

---

## Step-by-Step Tasks

### Task 1: i18n keys (do first — everything references them)
- **ACTION**: Add key groups to both `src/i18n/locales/tr.json` and `src/i18n/locales/en.json`.
- **IMPLEMENT**:
  - `common.edit` → tr `"Düzenle"`, en `"Edit"`.
  - Extend `settings`: `appearance`, `management`, `incomeSources`, `recurringPayments`, `themeDark`, `themeLight`, `themeVibrant`, `themeVibrantDark`, `signOut`, `signOutFailed`. tr example: `appearance:"Görünüm"`, `management:"Yönetim"`, `incomeSources:"Gelir Kaynaklarım"`, `recurringPayments:"Tekrarlayan Ödemeler"`, `themeDark:"Koyu"`, `themeLight:"Açık"`, `themeVibrant:"Canlı"`, `themeVibrantDark:"Canlı Koyu"`, `signOut:"Çıkış Yap"`, `signOutFailed:"Çıkış yapılamadı. Tekrar deneyin."`.
  - `frequency` group: `weekly, biweekly, monthly, yearly, "one-time"` → tr `Haftalık/İki Haftada Bir/Aylık/Yıllık/Tek Seferlik`.
  - `incomeSources` screen group: `title:"Gelir Kaynaklarım"`, `subtitle:"Aylık toplam {{total}} · {{count}} kaynak"`, `empty:"Henüz gelir kaynağı yok."`, `add:"Gelir Kaynağı Ekle"`, `payDay:"Her ayın {{day}}'i"`.
  - `recurringPayments` screen group: `title:"Tekrarlayan Ödemeler"`, `subtitle:"Aylık toplam {{total}} · {{count}} ödeme"`, `empty:"Henüz tekrarlayan ödeme yok."`, `add:"Ödeme Ekle"`, `next:"Sonraki: {{date}}"`.
  - `newIncome` group (mirror `newGoal` shape): `title, editTitle, nameLabel, namePlaceholder, save, saving, delete, deleteTitle, deleteMessage, saveFailed`.
  - `newRecurring` group: same shape.
- **MIRROR**: existing `newGoal` block (`en.json:188-204`) for tone/wording; `common`/`validation` reuse (`incomeNameRequired`, `paymentNameRequired`, `amountInvalid`, `payDayInvalid` already exist — do NOT duplicate).
- **IMPORTS**: n/a (JSON).
- **GOTCHA**: Keys are typed (`src/types/i18next.d.ts` derives from `tr.json`). `tr.json` is the source of truth — add the key there first or TS will reject `t('settings.appearance')`. Keep `en.json` structurally identical or fallback breaks. `"one-time"` needs quoting as a JSON key.
- **VALIDATE**: `npx tsc --noEmit` compiles with the new `t()` calls (after screens exist); `node -e "JSON.parse(require('fs').readFileSync('src/i18n/locales/tr.json'))"` for both files.

### Task 2: NewIncomeSourceScreen (form-sheet)
- **ACTION**: Create `src/screens/NewIncomeSourceScreen.tsx` as a create/edit/delete form-sheet.
- **IMPLEMENT**: Copy the `NewGoalScreen` skeleton (FORM_SHEET pattern). Fields: `name` (FormFieldGroup, icon `tag`), `amount` (icon `banknote`, `keyboardType="decimal-pad"`), `frequency` (SegmentedToggle monthly/weekly, label via a `<Text>`+`SegmentedToggle` group like onboarding), `payDay` (icon `calendar`, `keyboardType="number-pad"`). Read `id` via `useLocalSearchParams`; `existing = incomeSources.find(s => s.id === id)`. Seed state from `existing` (payDay: `existing?.pay_day != null ? String(existing.pay_day) : ''`, frequency default `'monthly'`). Validation = VALIDATION pattern. Payload: `{ name: name.trim(), amount: parsedAmount, frequency: frequency as 'monthly'|'weekly', pay_day: parsedPayDay }`. create adds `user_id: session!.user.id`. `confirmDelete` → `deleteIncomeSource(existing.id)`.
- **MIRROR**: FORM_SHEET, VALIDATION, DELETE_CONFIRM.
- **IMPORTS**: `useLocalSearchParams, useRouter` (expo-router); `useState`; `useTranslation`; RN `Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View`; `useSafeAreaInsets`; `ButtonIconOnly, ButtonPrimary, ButtonSecondary` (`@/atoms`); `AlertBanner, FormFieldGroup, SegmentedToggle` (`@/molecules`); `useListIncomeSourcesQuery, useCreateIncomeSourceMutation, useUpdateIncomeSourceMutation, useDeleteIncomeSourceMutation` (`@/store/api`); `useAppSelector` (`@/store/hooks`); `parseAmount` (`@/lib/format`); `useTheme` (`@/theme`).
- **GOTCHA**: `pay_day` is nullable in the type but the form requires 1–31 (matches onboarding). On edit, an existing row with `pay_day === null` (possible for biweekly/yearly created via DB) seeds `''` and forces the user to enter one — acceptable. Do not send `user_id` on update (RLS scopes by owner; changing it would fail). Guard `session!` only inside create (it is guaranteed by the authed route).
- **VALIDATE**: `npx tsc --noEmit`; manually open `/yeni-gelir` and `/yeni-gelir?id=<x>`.

### Task 3: NewRecurringPaymentScreen (form-sheet)
- **ACTION**: Create `src/screens/NewRecurringPaymentScreen.tsx`.
- **IMPLEMENT**: Same skeleton as Task 2. Fields: name, amount, frequency (monthly/weekly), payDay. `existing = recurringPayments.find(p => p.id === id)`. Seed payDay from stored date: `existing ? String(new Date(existing.next_payment_date).getDate()) : ''`. Payload on **create**: `{ user_id, icon: 'repeat', name, amount, frequency, next_payment_date: computeNextPaymentDate(parsedPayDay) }`. On **update**: `{ id, name, amount, frequency, next_payment_date: computeNextPaymentDate(parsedPayDay) }` — **preserve `existing.icon`** by omitting `icon` (don't reset to `'repeat'`) OR pass `icon: existing.icon`. Use `validation.paymentNameRequired`.
- **MIRROR**: RECURRING_DATE, FORM_SHEET, VALIDATION.
- **IMPORTS**: as Task 2 but recurring hooks + `computeNextPaymentDate` (`@/lib/onboarding`).
- **GOTCHA**: `recurring_payments` has no `pay_day` column — never send it. `next_payment_date` is required (non-null) on insert. `computeNextPaymentDate` clamps day to month length and rolls to next month if the day already passed — that behavior is intended, reuse as-is.
- **VALIDATE**: `npx tsc --noEmit`; open `/yeni-tekrarlayan` and `?id=`.

### Task 4: IncomeSourcesScreen (list)
- **ACTION**: Create `src/screens/IncomeSourcesScreen.tsx`.
- **IMPLEMENT**: LIST_SCREEN pattern but pushed: header row with `AppBarBackTitle title={t('incomeSources.title')} onBack={() => router.back()}` then a subtitle `<Text>` line `t('incomeSources.subtitle', { total: formatCurrency(monthlyTotal), count })`. `useListIncomeSourcesQuery()` + `useFocusEffect` refetch. Compute `monthlyTotal` = sum of `amount` (monthly-normalized is out of scope; sum raw amounts, label says "Aylık toplam" — keep simple: sum amounts of monthly sources, or just sum all; **decision: sum all `amount`** and keep the copy generic). For each source render `IncomeSourceCard` with `name`, `amount={formatCurrency(s.amount)}`, `frequencyLabel={t('frequency.'+s.frequency)}`, `dayLabel={s.pay_day != null ? t('incomeSources.payDay', { day: s.pay_day }) : ''}`, `onEdit={() => router.push({ pathname: '/yeni-gelir', params: { id: s.id } })}`, `onDelete={() => confirmDelete(s)}`. Empty `<Text>` when none. Bottom `ButtonSecondary tone="accent" icon="plus" label={t('incomeSources.add')} onPress={() => router.push('/yeni-gelir')}`. `confirmDelete` uses `Alert.alert` (mirror DELETE_CONFIRM) → `deleteIncomeSource(s.id).unwrap().catch(() => Alert.alert(t('newIncome.saveFailed')))`.
- **MIRROR**: LIST_SCREEN + GoalDetailScreen appBar row + DELETE_CONFIRM.
- **IMPORTS**: `useFocusEffect, useRouter`; `useCallback`; `useTranslation`; RN `Alert, InteractionManager, ScrollView, StyleSheet, Text, View`; `SafeAreaView`; `ButtonSecondary` (`@/atoms`); `AppBarBackTitle, IncomeSourceCard` (`@/organisms`); `useListIncomeSourcesQuery, useDeleteIncomeSourceMutation` (`@/store/api`); `formatCurrency` (`@/lib/format`); `useTheme`.
- **GOTCHA**: `IncomeSourceCard` already renders ✎🗑 — don't wrap it in `SwipeableRow` (would double the affordance). Cards are `flex`-less `View`s; the `ScrollView` gap handles spacing.
- **VALIDATE**: `npx tsc --noEmit`; navigate from Ayarlar; add/edit/delete round-trips.

### Task 5: RecurringPaymentsScreen (list)
- **ACTION**: Create `src/screens/RecurringPaymentsScreen.tsx`.
- **IMPLEMENT**: Same as Task 4 with recurring data. `RecurringPaymentCard` props: `icon={p.icon}`, `name`, `amount={formatCurrency(p.amount)}`, `frequencyLabel={t('frequency.'+p.frequency)}`, `nextLabel={t('recurringPayments.next', { date: formatDate(p.next_payment_date, { day:'numeric', month:'long', year:'numeric' }) })}`, `onEdit → /yeni-tekrarlayan?id=`, `onDelete → confirmDelete`. Subtitle uses monthly total (sum of amounts). Add button → `/yeni-tekrarlayan`.
- **MIRROR**: Task 4.
- **IMPORTS**: as Task 4 but `RecurringPaymentCard`, recurring hooks, `formatDate`.
- **GOTCHA**: list is ordered by `next_payment_date` asc (soonest first) — that ordering comes from the query, don't re-sort. `p.icon` may be an arbitrary string; `CategoryIcon` inside the card resolves via `getIcon` with a fallback, so unknown icons are safe.
- **VALIDATE**: `npx tsc --noEmit`; round-trip.

### Task 6: SettingsScreen (extend)
- **ACTION**: Update `src/screens/SettingsScreen.tsx`.
- **IMPLEMENT**: Keep the existing container/ScrollView/AppBarSimpleTitle/language section. Add, in order: (1) **Management** section — heading `t('settings.management')` + two `InfoRowChevron` rows (income `icon="wallet"`, recurring `icon="repeat"`, `value=""`) pushing the two list routes. (2) **Appearance** section — heading `t('settings.appearance')` + `SegmentedToggle` with the 4 theme options, `value={theme.mode}`, `onChange={(m) => theme.setMode(m as ThemeMode)}`. (3) keep **Language** section. (4) **Sign out** — `ButtonSecondary tone="destructive" icon="log-out"` → `handleSignOut` (try/catch → `Alert.alert(t('settings.signOutFailed'))`). Wrap each section in a `<View style={{ gap: theme.spacing.sm }}>` with a heading `<Text>` (mirror the existing language heading style at `SettingsScreen.tsx:26-35`).
- **MIRROR**: SETTINGS_SECTION + existing language block.
- **IMPORTS**: add `Alert` (RN), `useRouter` (expo-router), `InfoRowChevron` (`@/molecules`), `ButtonSecondary` (`@/atoms`), `signOut` (`@/lib/auth`), `type ThemeMode` (`@/theme/tokens`).
- **GOTCHA**: read current theme as `theme.mode` (the `useTheme()` value spreads `getThemeTokens(mode)` which includes `mode`; and exposes `setMode`). 4 segmented labels are tight at 390px — keep them ≤ ~9 chars (`Canlı Koyu` is the longest; if it clips, shorten to `C. Koyu`). Don't remove the existing `useLanguage()` usage.
- **VALIDATE**: `npx tsc --noEmit`; toggle each theme (screen recolors live), switch language, tap both nav rows, sign out returns to login.

### Task 7: Route wrappers (4 files)
- **ACTION**: Create `src/app/gelir-kaynaklarim.tsx`, `src/app/tekrarlayan-odemeler.tsx`, `src/app/yeni-gelir.tsx`, `src/app/yeni-tekrarlayan.tsx`.
- **IMPLEMENT**: Each is the one-line re-export: `import { XxxScreen } from '@/screens'; export default XxxScreen;` (mirror `hedefler.tsx`).
- **MIRROR**: `src/app/(tabs)/hedefler.tsx`, `src/app/yeni-hedef.tsx`.
- **IMPORTS**: the screen from `@/screens`.
- **GOTCHA**: filename = URL. Must match the `router.push` paths used in Tasks 4–6 exactly (`/gelir-kaynaklarim`, `/tekrarlayan-odemeler`, `/yeni-gelir`, `/yeni-tekrarlayan`).
- **VALIDATE**: routes resolve without "unmatched route".

### Task 8: Register routes in _layout.tsx
- **ACTION**: Add 4 `Stack.Screen`s inside the `Stack.Protected guard={... onboarding_completed}` block (`_layout.tsx:137-192`).
- **IMPLEMENT**:
  - `gelir-kaynaklarim` and `tekrarlayan-odemeler`: push presentation (mirror `hedef/[id]`) — `options={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.bgApp } }}`.
  - `yeni-gelir` and `yeni-tekrarlayan`: form sheets (mirror `yeni-hedef`) — `options={{ presentation: 'formSheet', sheetAllowedDetents: [0.85], sheetGrabberVisible: true, headerShown: false, contentStyle: { backgroundColor: theme.colors.bgSurface } }}`.
- **MIRROR**: `_layout.tsx:155-181` (`hedef/[id]`, `yeni-hedef`).
- **IMPORTS**: none new.
- **GOTCHA**: They must live inside the onboarded `Stack.Protected` (same block as tabs) or the guard hides them. Detent `0.85` fits four fields + footer; `yeni-hedef` uses `0.92` (it has more fields) — `0.85` is fine here, tune if content clips.
- **VALIDATE**: `npx tsc --noEmit`; navigation works; sheets present as bottom sheets.

### Task 9: Barrel export
- **ACTION**: Add four `export * from './...'` lines to `src/screens/index.ts`.
- **IMPLEMENT**: `IncomeSourcesScreen`, `RecurringPaymentsScreen`, `NewIncomeSourceScreen`, `NewRecurringPaymentScreen`.
- **MIRROR**: existing `src/screens/index.ts`.
- **GOTCHA**: route wrappers import from `@/screens`, so this must land before/with Task 7 or imports fail.
- **VALIDATE**: `npx tsc --noEmit`.

---

## Testing Strategy

No automated test harness exists in this repo (prior phases validated via `tsc`/lint/manual) — follow suit: TypeScript + lint + manual device walkthrough.

### Manual test matrix
| Test | Input | Expected |
|---|---|---|
| List renders | open Gelir Kaynaklarım with existing rows | one `IncomeSourceCard` per source, amounts formatted ₺, freq/day labels localized |
| Empty state | user with no income sources | localized empty `<Text>`, add button still shown |
| Add | tap +, fill valid, Kaydet | sheet closes, new card appears (list auto-refetches on focus) |
| Add invalid | blank name / amount 0 / payDay 99 | inline field errors, no write |
| Edit | tap ✎, change amount, Kaydet | card reflects new amount |
| Edit preserves icon (recurring) | edit a recurring with non-default icon | icon unchanged after save |
| Delete | tap 🗑, confirm | row disappears; cancel → no-op |
| Recurring date | add payDay=31 in a 30-day month | `next_payment_date` clamps to day 30 |
| Theme switch | tap each of 4 theme options | whole app recolors immediately; persists across app restart |
| Language switch | toggle TR/EN | all Phase-10 strings switch |
| Sign out | tap Çıkış Yap | returns to Login; re-login shows same data |
| Sign-out failure | (offline) | `Alert` shown, stays on Settings |

### Edge Cases Checklist
- [ ] Empty list (both screens)
- [ ] Amount with comma decimal (`1.234,56`) parses via `parseAmount`
- [ ] payDay out of 1–31 rejected
- [ ] Editing a row deleted elsewhere → `existing` undefined → treat as create OR back out (mirror GoalDetail missing-guard is for detail; the form simply shows create title — acceptable)
- [ ] Network failure on save → `AlertBanner`/`formError`, no crash
- [ ] Theme = `vibrant`/`vibrant-dark` renders accents purple (token-driven, no hardcoding)

---

## Validation Commands

### Static Analysis
```bash
cd /home/furkanasikdev/Projects/AI/FollowFlow && npx tsc --noEmit
```
EXPECT: Zero type errors.

```bash
cd /home/furkanasikdev/Projects/AI/FollowFlow && npx eslint "src/**/*.{ts,tsx}"
```
EXPECT: Zero errors (warnings tolerated per prior phases).

```bash
cd /home/furkanasikdev/Projects/AI/FollowFlow && npx prettier --check "src/**/*.{ts,tsx}" "src/i18n/locales/*.json"
```
EXPECT: All matched files use Prettier code style.

### i18n integrity
```bash
cd /home/furkanasikdev/Projects/AI/FollowFlow && node -e "const tr=require('./src/i18n/locales/tr.json'),en=require('./src/i18n/locales/en.json');const flat=(o,p='')=>Object.entries(o).flatMap(([k,v])=>typeof v==='object'?flat(v,p+k+'.'):[p+k]);const a=new Set(flat(tr)),b=new Set(flat(en));const miss=[...a].filter(k=>!b.has(k)).concat([...b].filter(k=>!a.has(k)));console.log(miss.length?'KEY MISMATCH: '+miss.join(', '):'i18n keys aligned')"
```
EXPECT: `i18n keys aligned`.

### Browser/Device Validation
```bash
cd /home/furkanasikdev/Projects/AI/FollowFlow && npx expo start
```
EXPECT: App boots; walk the manual matrix above (needs a signed-in, onboarding-completed account).

### Manual Validation
- [ ] From Ana Sayfa → Ayarlar tab → both management rows push correctly
- [ ] Full add/edit/delete round-trip on each management screen
- [ ] Theme + language persist across a cold restart
- [ ] Sign out → Login → sign back in

---

## Acceptance Criteria
- [ ] Gelir Kaynaklarım screen: list + add + edit + delete, wired to `incomeSourcesApi`
- [ ] Tekrarlayan Ödemeler screen: list + add + edit + delete, wired to `recurringPaymentsApi`
- [ ] Ayarlar: theme switcher (4 modes), language switcher (kept), both management nav rows, sign-out
- [ ] All strings localized in both `tr.json` and `en.json`, keys aligned
- [ ] `npx tsc --noEmit` clean, eslint clean, prettier clean
- [ ] Phase 10 checkboxes in `.claude/phases.md` marked `[x]`

## Completion Checklist
- [ ] Code follows discovered patterns (LIST_SCREEN, FORM_SHEET, route-wrapper, settings-section)
- [ ] Error handling matches codebase (try/catch → `formError`/`AlertBanner`/`Alert.alert`)
- [ ] No new atoms/molecules/organisms created
- [ ] i18n keys added to `tr.json` first (typed source of truth)
- [ ] No hardcoded colors — all via `theme.colors.*`
- [ ] Route paths match wrapper filenames and `_layout.tsx` registrations
- [ ] Report written to `.claude/PRPs/reports/phase-10-settings-management-screens-report.md`
- [ ] Move plan to `.claude/PRPs/plans/completed/` on completion (repo convention)

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| 4-option SegmentedToggle labels clip at 390px | Med | Low | Short labels; if clipping, shorten `Canlı Koyu`→`C. Koyu` or stack two toggles |
| Recurring edit resets custom `icon` to `repeat` | Med | Low | Explicitly preserve `existing.icon` on update (Task 3 gotcha) |
| Form-sheet detent too small, content clips | Low | Low | Start `0.85`; bump toward `0.92` if footer overlaps |
| i18n key drift breaks typed `t()` | Med | Med | Add to `tr.json` first; run the key-alignment script |
| Can't pixel-verify vs design (Pencil not attached) | High | Low | Follow tokens + existing cards; defer visual QA to Phase 11 |
| `pay_day` null on a DB-created non-monthly income forces re-entry on edit | Low | Low | Accept; forms only create monthly/weekly which always set pay_day |

## Notes
- `IncomeSourceCard` and `RecurringPaymentCard` already exist and already contain edit/delete affordances (`CardActions` = pencil + trash). This phase is their **first consumer** — no `SwipeableRow` needed for them.
- `signOut()` in `@/lib/auth` is defined but never called anywhere yet; `_layout.tsx`'s `onAuthStateChange` already handles the post-sign-out reset (clears RTK cache + onboarding drafts), so the Settings button only needs to call `signOut()`.
- Theme persistence is intentionally local (AsyncStorage via `ThemeProvider`); `profiles.theme_mode` column exists but is not read by the provider — leaving it unwritten keeps the feature coherent (flagged Phase 11).
- Turkish is the base locale; `tr.json` drives the `i18next.d.ts` types. English mirrors it.
- After implementation, update `.claude/phases.md` Phase 10 to `✅ complete` with the report path (mirror phases 0–9 formatting).
```
