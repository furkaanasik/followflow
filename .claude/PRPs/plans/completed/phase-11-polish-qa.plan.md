# Plan: Phase 11 — Polish & QA

## Summary
Final polish pass over the fully-built FollowFlow app: add reusable **loading / empty / error** state components and wire them into every data screen, close **accessibility** gaps (roles, labels, tap targets, header semantics) across atoms/molecules/organisms, fix the two **cross-theme** color leaks (Home chart palette), and run a manual + Pencil-referenced **QA sweep** of all 4 themes plus an MCP-driven E2E smoke test of the core loop.

## User Story
As a FollowFlow user on any theme and with a screen reader,
I want every screen to show clear loading/empty/error feedback and be fully operable by assistive tech,
So that the app feels finished, trustworthy, and usable regardless of my settings.

## Problem → Solution
Screens silently render `[]` on error, loading is handled on only 2 of 8 list/detail screens, buttons lack a11y roles/state, and the Home chart uses hardcoded dark-theme hex → **all screens show consistent loading/empty/error UI, all controls are screen-reader operable, and every color adapts across the 4 themes**, verified against the Pencil source.

## Metadata
- **Complexity**: Large
- **Source PRD**: `.claude/phases.md`
- **PRD Phase**: Phase 11 — Polish & QA
- **Estimated Files**: ~25 (3 new components + ~15 screen/atom edits + 2 i18n + report)

---

## UX Design

### Before
```
┌──────────────────────────────┐
│  Bütçeler                     │
│                              │  ← data still loading: blank screen
│  (nothing, then pops in)      │
│                              │  ← fetch error: looks identical to empty
│  "Henüz bütçe yok"  (empty)   │
└──────────────────────────────┘
Screen reader: "button" announced as bare image / unlabeled
```

### After
```
┌──────────────────────────────┐
│  Bütçeler                     │
│   ◠ spinner (first load)      │  ← StateView loading
│  ── or ──                     │
│   ⚠ "Bağlantı kurulamadı."    │  ← StateView error + [Tekrar dene]
│      [ Tekrar dene ]          │
│  ── or ──                     │
│   🗋 "Henüz bütçe yok"         │  ← StateView empty (icon + text)
└──────────────────────────────┘
Screen reader: "Ekle, düğme"; segmented "Gelir, seçili, düğme"
```

### Interaction Changes
| Touchpoint | Before | After | Notes |
|---|---|---|---|
| List first load | blank | centered spinner | `StateView variant="loading"` |
| Fetch error | silent empty | error msg + retry button | uses `refetch()` already present on every query |
| Empty data | ad-hoc inline `Text` | shared `StateView variant="empty"` (icon + text) | replaces per-screen duplication |
| Any icon button | announced "image"/unlabeled | "…, düğme" | `accessibilityRole="button"` added in atom |
| Segmented toggle | selection invisible to AT | "…, seçili" | `accessibilityState={{selected}}` |
| Section titles | plain text | heading semantics | `accessibilityRole="header"` |
| Home chart colors | static teal in all themes | theme-driven | pull from `theme.colors` |

---

## Mandatory Reading

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 | `src/screens/IncomeSourcesScreen.tsx` | all | Canonical list screen: query default `[]`, inline empty `Text`, `useFocusEffect` refetch — the shape every list screen shares |
| P0 | `src/screens/HomeScreen.tsx` | 50-51, 138-147, 271-274 | Only existing loading pattern (`ActivityIndicator` in SafeAreaView); chart palette constants to theme-ify; untagged "see all" Pressable |
| P0 | `src/molecules/NavItem.tsx` | 42-77 | **A11y gold standard already in repo** — role + `accessibilityState` + label. Mirror this exactly for buttons |
| P0 | `src/atoms/ButtonPrimary.tsx` | 30-58 | Add role/state here; representative atom StyleSheet+inline-theme pattern |
| P0 | `src/molecules/AlertBanner.tsx` | all | Existing themed error/info banner — reuse styling idiom for `StateView` error variant |
| P1 | `src/atoms/ButtonIconOnly.tsx` | 8-55 | Already requires `accessibilityLabel`; just add role + bump default size |
| P1 | `src/store/api/baseApi.ts` | all | `ApiError` shape + `fakeBaseQuery`; error object is `{ code, message }` |
| P1 | `src/store/api/incomeSourcesApi.ts` | all | Query/mutation shape; `refetch` comes from every `useList…Query` |
| P1 | `src/theme/tokens.ts` | 10-92 | 14 `ColorTokens` slots × 4 modes — the only colors you may reference |
| P1 | `src/theme/ThemeProvider.tsx` | 63-80 | `useTheme()` API `{ mode, colors, spacing, radius, fonts, setMode }`; runtime-reactive |
| P1 | `src/molecules/SegmentedToggle.tsx` | 90-100 | Segments missing role/label/state |
| P1 | `src/organisms/RecurringPaymentCard.tsx` | 100-120 | Bare ~16px icon Pressables, hardcoded TR labels, no hitSlop |
| P2 | `src/i18n/locales/tr.json` | 2-13 | `common.retry` + `common.connectionError` **already exist** — reuse for error state |
| P2 | `src/screens/index.ts`, `src/molecules/index.ts` | all | Barrel export convention for new components |

## External Documentation

No external research needed — feature uses established internal patterns (RTK Query, RN accessibility props, existing theme system). RN a11y prop reference is standard: `accessibilityRole`, `accessibilityState`, `accessibilityLabel`, `accessible`.

---

## Patterns to Mirror

### NAMING_CONVENTION
```tsx
// SOURCE: src/atoms/ButtonPrimary.tsx:13-27 — PascalCase component + Props interface, named export
export interface ButtonPrimaryProps { label: string; onPress: () => void; }
export function ButtonPrimary({ label, onPress }: ButtonPrimaryProps) { ... }
```

### THEME_ACCESS (per-render hook, inline colors over static layout)
```tsx
// SOURCE: src/atoms/ButtonPrimary.tsx:28-42, 60-68
const theme = useTheme();
// ...
style={[styles.container, { borderRadius: theme.radius.sm, backgroundColor: theme.colors.accentTeal }]}
const styles = StyleSheet.create({ container: { height: 52, flexDirection: 'row' /* layout only, NO colors */ } });
```

### LOADING_STATE (existing, to be extracted)
```tsx
// SOURCE: src/screens/HomeScreen.tsx:138-147
if (txnsLoading) {
  return (
    <SafeAreaView edges={['top','bottom']} style={[styles.loader, { backgroundColor: theme.colors.bgApp }]}>
      <ActivityIndicator color={theme.colors.accentTeal} />
    </SafeAreaView>
  );
}
```

### EMPTY_STATE (current ad-hoc form, to be replaced by StateView)
```tsx
// SOURCE: src/screens/IncomeSourcesScreen.tsx:98-109
) : (
  <Text style={{ fontFamily: theme.fonts.body.medium, fontSize: 13,
    color: theme.colors.textTertiary, paddingTop: theme.spacing.lg }}>
    {t('incomeSources.empty')}
  </Text>
)
```

### A11Y_CONTROL (the gold standard — mirror for all buttons)
```tsx
// SOURCE: src/molecules/NavItem.tsx:43-48
<Pressable
  onPress={onPress}
  accessibilityRole="tab"
  accessibilityState={{ selected: active }}
  accessibilityLabel={label}
  hitSlop={6}
>
```

### THEMED_BANNER (reuse for StateView error variant styling)
```tsx
// SOURCE: src/molecules/AlertBanner.tsx:19-45 — icon + text, warningRed/warningBg from theme
const color = theme.colors.warningRed;
const backgroundColor = theme.colors.warningBg;
{createElement(getIcon('circle-alert'), { size: 16, color })}
```

### QUERY_STATE (fields available on every list hook)
```tsx
// SOURCE: RTK Query on src/store/api/incomeSourcesApi.ts:17-27
const { data = [], isLoading, isError, refetch } = useListIncomeSourcesQuery();
// isLoading/isError/refetch exist but are currently unused across all screens
```

---

## Files to Change

| File | Action | Justification |
|---|---|---|
| `src/molecules/StateView.tsx` | CREATE | One component, `variant: 'loading' \| 'empty' \| 'error'`, themed, i18n retry |
| `src/molecules/index.ts` | UPDATE | Export `StateView` |
| `src/atoms/ButtonPrimary.tsx` | UPDATE | Add `accessibilityRole="button"` + `accessibilityState={{disabled}}` |
| `src/atoms/ButtonSecondary.tsx` | UPDATE | Add role (+ optional disabled support to match) |
| `src/atoms/ButtonIconOnly.tsx` | UPDATE | Add role; bump default `size` 40→44 (tap target) |
| `src/atoms/ButtonGoogleCTA.tsx` | UPDATE | Add role/label/state; mark stray "G" `accessibilityElementsHidden`/`accessible={false}` |
| `src/atoms/Avatar.tsx` | UPDATE | `accessible={false}` (decorative) |
| `src/molecules/SegmentedToggle.tsx` | UPDATE | role="button" + `accessibilityState={{selected}}` + label per segment |
| `src/molecules/InfoRowChevron.tsx` | UPDATE | role="button" + label from title |
| `src/molecules/TitleSubtitle.tsx` / section titles | UPDATE | `accessibilityRole="header"` on title Text |
| `src/organisms/AppBarBackTitle.tsx` | UPDATE | i18n the "Geri" label; header role on title |
| `src/organisms/AppBarSimpleTitle.tsx` | UPDATE | header role on title |
| `src/organisms/RecurringPaymentCard.tsx` | UPDATE | role + i18n labels + hitSlop/min-size on edit/delete |
| `src/organisms/OnboardingTopBar.tsx` | UPDATE | role/label on skip |
| `src/screens/HomeScreen.tsx` | UPDATE | Theme-ify `CHART_PALETTE`/`CHART_OTHER_COLOR`; gate all 5 queries via StateView; label "see all" |
| `src/screens/GoalsScreen.tsx` | UPDATE | StateView loading/error; role on GoalCard wrapper |
| `src/screens/BudgetsScreen.tsx` | UPDATE | StateView loading/error; role on BudgetCard wrapper |
| `src/screens/IncomeSourcesScreen.tsx` | UPDATE | StateView loading/error/empty |
| `src/screens/RecurringPaymentsScreen.tsx` | UPDATE | StateView loading/error/empty |
| `src/screens/TransactionsScreen.tsx` | UPDATE | StateView loading/error/empty |
| `src/screens/GoalDetailScreen.tsx` | UPDATE | StateView error; keep not-found path |
| `src/i18n/locales/tr.json` | UPDATE | `common.loading`, `states.*` empty strings, i18n a11y labels |
| `src/i18n/locales/en.json` | UPDATE | Mirror TR keys |
| `.claude/phases.md` | UPDATE | Mark Phase 11 in-progress → complete; add report link |
| `.claude/PRPs/reports/phase-11-polish-qa-report.md` | CREATE | Phase report (repo convention) |

## NOT Building
- No automated test harness (jest/RNTL) — repo has none through phases 0–10; E2E smoke is **manual + mobile MCP driven**, matching prior phases.
- No Skeleton shimmer components — spinner is sufficient and matches existing HomeScreen loading idiom.
- No changes to `ButtonGoogleCTA` white/blue colors — those are **intentional Google brand** compliance, not theme bugs. Leave as-is.
- No `shadowColor: '#000000'` change (BottomNavigationBar) — black shadow is correct in all themes.
- No `profiles.theme_mode` server sync — deferred in Phase 10 by design.
- No new screens or routes; no schema/migration changes.
- No `accessibilityHint` rollout beyond where a control's purpose is non-obvious (keep scope tight).

---

## Step-by-Step Tasks

### Task 1: Create `StateView` molecule
- **ACTION**: New `src/molecules/StateView.tsx`.
- **IMPLEMENT**: `variant: 'loading' | 'empty' | 'error'`; props `{ variant, message?, icon?, onRetry? }`. Loading → centered `ActivityIndicator color={theme.colors.accentTeal}`. Empty → optional icon (`theme.colors.textTertiary`) + `message` text (`textTertiary`, `fonts.body.medium`, 13). Error → `circle-alert` icon + `message` (default `t('common.connectionError')`) + `ButtonSecondary label={t('common.retry')} onPress={onRetry}`. Root centered `View` with `flexGrow:1`, `alignItems/justifyContent: center`, `gap: theme.spacing.md`, `padding: theme.spacing.lg`.
- **MIRROR**: THEME_ACCESS, THEMED_BANNER, EMPTY_STATE.
- **IMPORTS**: `createElement` from react; `ActivityIndicator, StyleSheet, Text, View` from react-native; `useTranslation`; `useTheme`; `getIcon` from `@/lib/icons`; `ButtonSecondary` from `@/atoms`.
- **GOTCHA**: Keep colors inline from `theme.colors` only — no hex. `StyleSheet.create` = layout only.
- **VALIDATE**: `npm run typecheck` clean; import renders without a ThemeProvider error.

### Task 2: Export StateView
- **ACTION**: Add `export * from './StateView';` to `src/molecules/index.ts` (match existing barrel style).
- **VALIDATE**: `import { StateView } from '@/molecules'` resolves in tsc.

### Task 3: i18n keys
- **ACTION**: Add to `tr.json` then mirror in `en.json`: `common.loading` ("Yükleniyor…"/"Loading…"); `states.emptyGeneric` if needed; a11y label keys `a11y.back`, `a11y.edit`, `a11y.delete`, `a11y.skip`, `a11y.seeAll`. Reuse existing `common.retry`, `common.connectionError`.
- **MIRROR**: existing nested key structure in `tr.json:2-13`.
- **GOTCHA**: `en.json` must have identical key set — typed keys (`src/types/i18next.d.ts`) will fail tsc otherwise. Keep TR as source of truth.
- **VALIDATE**: `npm run typecheck`; grep both files have same keys.

### Task 4: Button atoms a11y
- **ACTION**: Add `accessibilityRole="button"` to `ButtonPrimary`, `ButtonSecondary`, `ButtonIconOnly`, `ButtonGoogleCTA` Pressables. Add `accessibilityState={{ disabled }}` where a `disabled` prop exists (ButtonPrimary, ButtonGoogleCTA). ButtonGoogleCTA: add `accessibilityLabel={label}` + wrap "G" Text with `accessible={false}`. ButtonIconOnly: default `size` 40→44.
- **MIRROR**: A11Y_CONTROL (NavItem).
- **GOTCHA**: Don't add a label to text buttons — RN reads child `<Text>` automatically; a manual label would double-announce. Only icon-only/branded buttons need explicit labels.
- **VALIDATE**: typecheck; visual — buttons unchanged; (optional) VoiceOver/TalkBack announces "düğme".

### Task 5: SegmentedToggle + InfoRowChevron + card-wrapper a11y
- **ACTION**: SegmentedToggle each option Pressable → `accessibilityRole="button"`, `accessibilityState={{ selected }}`, `accessibilityLabel={optionLabel}`. InfoRowChevron → `accessibilityRole="button"` + label from title. Wrap Pressables in GoalsScreen:53 / BudgetsScreen:79 / HomeScreen "see all":271 → `accessibilityRole="button"` + label (`t('a11y.seeAll')` for see-all, card name for cards).
- **MIRROR**: A11Y_CONTROL.
- **VALIDATE**: typecheck; selected segment announces state.

### Task 6: Organism a11y + tap targets
- **ACTION**: `RecurringPaymentCard` edit/delete Pressables → `accessibilityRole="button"`, i18n labels (`t('common.edit')`/`t('common.delete')`), `hitSlop={8}` + min 44 box. `AppBarBackTitle` → i18n the hardcoded "Geri" (`t('common.back')`); add `accessibilityRole="header"` to title Text. `AppBarSimpleTitle` + `TitleSubtitle`/section titles → `accessibilityRole="header"`. `OnboardingTopBar` skip → role + label. `Avatar` → `accessible={false}`.
- **MIRROR**: A11Y_CONTROL; existing i18n usage in IncomeSourcesScreen.
- **GOTCHA**: `common.edit`/`common.delete`/`common.back` already exist in tr.json — reuse, don't duplicate.
- **VALIDATE**: typecheck; lint.

### Task 7: Fix Home chart cross-theme colors
- **ACTION**: In `HomeScreen.tsx:50-51`, replace module-const `CHART_PALETTE`/`CHART_OTHER_COLOR` with values derived from `theme.colors` at render (e.g. `[accentTeal, incomeGreen, expenseCoral, textSecondary]`, other = `textTertiary`). Move derivation inside the component.
- **MIRROR**: THEME_ACCESS.
- **GOTCHA**: Palette must stay stable per category ordering; derive array inside component (not module scope) so it re-derives on theme change. Confirm `GoalProgressChart`/`CategoryBreakdownCard` consume the passed palette (don't hardcode internally).
- **VALIDATE**: typecheck; switch all 4 themes in Ayarlar — chart recolors.

### Task 8: Wire StateView into data screens
- **ACTION**: In each of HomeScreen, GoalsScreen, BudgetsScreen, IncomeSourcesScreen, RecurringPaymentsScreen, TransactionsScreen, GoalDetailScreen: destructure `isLoading, isError, refetch` from the primary `useList…Query`. Early-return `<StateView variant="loading" />` while `isLoading`; `<StateView variant="error" onRetry={refetch} />` on `isError`; use `<StateView variant="empty" message={t('…empty')} />` for zero-rows (replacing inline empty `Text`). Wrap in the screen's existing SafeAreaView so background/edges match.
- **MIRROR**: LOADING_STATE (HomeScreen:138-147), EMPTY_STATE, QUERY_STATE.
- **GOTCHA**: HomeScreen has 5 queries — gate on the union (`isLoading` of any) for first load but keep it from flashing on background refetch (use `isLoading`, not `isFetching`). GoalDetailScreen keeps its existing not-found (`!goal`) path — only add `isError` handling. Forms (New*, Onboarding*) are OUT — they use mutation flags, not list-state.
- **VALIDATE**: typecheck; lint; manually toggle airplane mode → error+retry shows; retry recovers.

### Task 9: Cross-theme + Pencil visual QA sweep
- **ACTION**: For all 13 screens × 4 themes, drive the running app via mobile MCP (`mobile_take_screenshot`, `mobile_swipe_on_screen`), compare against Pencil source frames (`get_screenshot` on the light/dark "Pages"/"Pages Light" frames). Log discrepancies. Verify no static-color leaks remain (grep hex in src/screens|atoms|molecules|organisms excluding tokens.ts + ButtonGoogleCTA + shadowColor).
- **GOTCHA**: Pencil has only light+dark frames; vibrant/vibrant-dark QA is against token intent, not a pixel source. `.pen` access only via pencil MCP — never Read/Grep.
- **VALIDATE**: screenshots captured; discrepancy list empty or triaged in report.

### Task 10: E2E smoke test of core loop (manual/MCP)
- **ACTION**: Drive via mobile MCP: sign in → add income source → log an expense transaction → open Bütçeler and confirm budget progress reflects it → open a goal, deposit, confirm goal progress advances. Capture screenshots at each step.
- **GOTCHA**: Needs a running Expo Go session + Supabase reachable. If device session unavailable (as in phases 2/8/9/10), document the gap in the report's "Issues Encountered" and provide the exact manual steps — do not fake a pass.
- **VALIDATE**: each step screenshot shows expected state; data round-trips to Supabase.

### Task 11: Phase report + phases.md
- **ACTION**: Write `.claude/PRPs/reports/phase-11-polish-qa-report.md` following the phase-10 report structure (Files Changed, Deviations, Issues Encountered, Tests Written, Deferred, Next Steps). Flip Phase 11 checkboxes in `.claude/phases.md` and append `✅ complete — report: …`.
- **VALIDATE**: report exists; phases.md updated.

---

## Testing Strategy

### Unit Tests
No unit-test harness in repo (consistent with phases 0–10). Validation is static analysis + manual/MCP walkthrough. If introducing tests is desired it is a separate initiative — OUT of this phase.

### Edge Cases Checklist
- [ ] First load (no cache) → spinner, not blank
- [ ] Fetch error (airplane mode) → error + retry; retry recovers
- [ ] Zero rows → empty state (each list screen)
- [ ] Background refetch (focus) → no spinner flash over existing data
- [ ] Large dynamic-type font scale → button/numpad text not clipped
- [ ] Screen reader: every button announces role; segmented announces selected
- [ ] All 4 themes: chart + every surface recolors, no static hex leak
- [ ] Long income/goal names → row truncation intact

---

## Validation Commands

### Static Analysis
```bash
npm run typecheck
```
EXPECT: Zero type errors (watch i18n key parity via `src/types/i18next.d.ts`).

```bash
npm run lint
```
EXPECT: Zero lint errors.

```bash
npm run format:check
```
EXPECT: Clean (run `npm run format` if not).

### Hardcoded-color regression grep
```bash
grep -rnE "#[0-9A-Fa-f]{6}|rgba?\(|'white'|'black'" src/screens src/atoms src/molecules src/organisms \
  | grep -viE "tokens.ts|ButtonGoogleCTA|shadowColor|transparent|// "
```
EXPECT: No new matches beyond documented intentional ones.

### i18n key parity
```bash
node -e "const tr=require('./src/i18n/locales/tr.json'),en=require('./src/i18n/locales/en.json');const f=(o,p='')=>Object.entries(o).flatMap(([k,v])=>typeof v==='object'?f(v,p+k+'.'):[p+k]);const a=new Set(f(tr)),b=new Set(f(en));console.log('missing in en:',[...a].filter(x=>!b.has(x)),'missing in tr:',[...b].filter(x=>!a.has(x)))"
```
EXPECT: both arrays empty.

### App / Browser Validation
```bash
npx expo start --clear
```
EXPECT: Bundles clean; drive via mobile MCP for QA (Tasks 9-10).

### Manual Validation
- [ ] Toggle each of 4 themes in Ayarlar — every screen + Home chart recolors
- [ ] Airplane-mode a list screen — error + retry works
- [ ] Screen reader on: tab through Login + Home — all controls announced
- [ ] Core loop round-trip (Task 10) succeeds end to end

---

## Acceptance Criteria
- [ ] `StateView` created and wired into all 7 data screens (loading + error + empty)
- [ ] All buttons/segments/nav have `accessibilityRole` + state; icon-only controls labeled
- [ ] Tap targets ≥44px (ButtonIconOnly default, RecurringPaymentCard actions)
- [ ] Home chart colors derive from theme; hardcoded-color grep clean
- [ ] All 4 themes visually verified; light/dark checked against Pencil
- [ ] Core-loop E2E smoke passes (or gap documented with repro steps)
- [ ] typecheck + lint + format:check + i18n parity all pass

## Completion Checklist
- [ ] Code follows discovered patterns (THEME_ACCESS, A11Y_CONTROL, barrel exports)
- [ ] Error handling uses existing `refetch` + `ApiError` shape
- [ ] Empty/loading/error unified via `StateView` (no per-screen duplication left)
- [ ] i18n: no hardcoded user-facing or a11y strings; TR+EN parity
- [ ] No hardcoded colors introduced
- [ ] Phase report written; phases.md updated
- [ ] No scope creep (no tests harness, no new screens, no schema changes)

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| No Expo device session (E2E/visual QA) | High | Med | Precedent in phases 2/8/9/10; document gap + exact manual steps, don't fake pass |
| Pencil frames only light/dark | High | Low | Vibrant modes QA'd against token intent, not pixels; note in report |
| i18n key parity breaks tsc | Med | Low | Parity grep in validation; TR = source of truth |
| StateView spinner flashes on background refetch | Med | Low | Gate on `isLoading` not `isFetching`; keep focus-refetch silent |
| Adding role to text buttons double-announces | Low | Low | Only label icon-only/branded buttons; let RN read `<Text>` children |
| Home chart palette reorders categories | Low | Med | Derive array inside component preserving category order; verify chart consumers use passed palette |

## Notes
- **Three audit sweeps already done** (state / a11y / theme) — this plan encodes their findings; no re-search needed during implementation.
- `NavItem.tsx` is the in-repo a11y reference implementation — copy its prop set.
- `common.retry` + `common.connectionError` **already exist** in tr.json (added earlier) — the error state has its strings ready.
- ButtonGoogleCTA white/blue and BottomNavigationBar black shadow are **intentional**, not theme bugs — explicitly out of scope.
- Never `Read`/`Grep` `design/design.pen` — pencil MCP tools only (`get_screenshot` for reference frames).
</content>
</invoke>
