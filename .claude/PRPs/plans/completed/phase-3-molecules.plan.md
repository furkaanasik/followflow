# Plan: Phase 3 — Molecules (12 components)

## Summary
Build the 12 molecule components defined in `design/design.pen`'s Design System frame, composing them from the 10 Phase 2 atoms (`src/atoms/`) wherever a matching atom exists, and from shared theme tokens (`src/theme/tokens.ts`) + icon helper (`src/lib/icons.ts`) otherwise. One atom (`ButtonIconOnly`) needs a small non-breaking extension to cover a "surface" visual variant used by Search Bar's filter button — everything else is new files under `src/molecules/`.

## User Story
As a developer implementing FollowFlow's UI, I want the 12 molecule components built to spec and matching the Phase 2 atom conventions, so that Phase 4 (organisms) can compose them without re-deriving styling or touching raw React Native primitives.

## Problem → Solution
`src/molecules/` currently only has a `.gitkeep` placeholder — no molecule code exists. This plan builds all 12: Transaction Row, Search Bar, Budget Progress Row, Nav Item, Numpad Key, Numpad Key Row, Form Field Group, Divider / Or, Title + Subtitle, Info Row / Chevron, Step Indicator, Segmented Toggle.

## Metadata
- **Complexity**: Medium
- **Source PRD**: `.claude/phases.md` (Phase 3 — Molecules)
- **PRD Phase**: Phase 3 — Molecules
- **Estimated Files**: 15 (12 molecules + 1 barrel + 1 atom extension + 1 phases.md checkbox update)

---

## UX Design

### Before
```
┌─────────────────────────────┐
│  App has 10 atoms only.     │
│  No composed row/list/form   │
│  building blocks exist —     │
│  organisms/screens would     │
│  have to hand-roll layout    │
│  for every list row, form    │
│  field, nav item, etc.       │
└─────────────────────────────┘
```

### After
```
┌─────────────────────────────┐
│  12 reusable molecules exist. │
│  Phase 4 organisms (Bottom Nav,│
│  Transaction List Card, Budget │
│  Card, ...) and Phase 6-9      │
│  screens compose these directly│
│  — no raw styling needed.      │
└─────────────────────────────┘
```

### Interaction Changes
| Touchpoint | Before | After | Notes |
|---|---|---|---|
| Filter button (Search Bar) | N/A | Tappable icon button, neutral surface style | Requires `ButtonIconOnly` `variant` extension |
| Nav Item | N/A | Tappable tab item, active/inactive visual state | Consumed by Phase 4 Bottom Navigation Bar |
| Info Row / Chevron | N/A | Tappable row for navigation-style info summaries | Consumed by Phase 4/8/9 screens |
| Segmented Toggle | N/A | Tappable 2-option (or N-option) switch | Consumed by onboarding/budget screens |
| Numpad Key(s) | N/A | Tappable digit keys | Consumed by Phase 7 "Yeni İşlem Modal" |

---

## Mandatory Reading

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 | `src/atoms/ButtonPrimary.tsx` | 1-68 | Canonical atom pattern: `useTheme()`, `StyleSheet.create` for static values + inline style array for theme-bound values, `createElement(getIcon(icon), ...)` for dynamic icons |
| P0 | `src/atoms/ButtonIconOnly.tsx` | 1-45 | Direct extension target for Search Bar's filter button (Task 1) |
| P0 | `src/theme/tokens.ts` | 1-127 | `ColorTokens`, `SPACING` (`xs`6/`sm`10/`md`16/`lg`24/`xl`32), `RADIUS` (`sm`10/`md`16/`lg`22/`full`999), `FONT_FAMILIES` (heading: regular/semibold/bold; **body: regular/medium/semibold only — no bold/700**) |
| P0 | `src/lib/icons.ts` | 1-25 | `getIcon(name)` — kebab-case name → PascalCase lucide export, throws on unknown name |
| P0 | `src/atoms/index.ts` | 1-10 | Barrel export pattern to mirror for `src/molecules/index.ts` |
| P1 | `src/atoms/InputField.tsx` | 1-78 | Reused as-is by Form Field Group and Search Bar |
| P1 | `src/atoms/ProgressBar.tsx` | 1-50 | Reused as-is by Budget Progress Row; note its track already has `width: '100%'` internally |
| P1 | `src/atoms/CategoryIcon.tsx` | 1-40 | Reused as-is by Transaction Row's leading icon badge |
| P1 | `src/atoms/AmountDisplay.tsx` | 1-39 | Tone→color mapping pattern to mirror (not the component itself — see Task 8 GOTCHA) |
| P1 | `src/atoms/BadgeAmount.tsx` | 1-56 | Second example of tone→color mapping + icon+text row composition |
| P2 | `src/atoms/Avatar.tsx`, `src/atoms/ButtonSecondary.tsx` | all | More `useTheme()` + `createElement(getIcon(...))` examples |
| P2 | `.claude/PRPs/reports/atoms-phase-2-report.md` | Deviations section | **Binding constraint**: dynamically-selected icons MUST render via `createElement(getIcon(name), props)`, never `<Icon />` JSX — the repo's `react-hooks/static-components` ESLint rule (React Compiler rule bundled in `eslint-config-expo`) rejects the JSX form even inside `useMemo` |
| P2 | `.claude/phases.md` | 25-28 | Phase 3 scope + acceptance line ("Compose from Phase 2 atoms only — no raw styling duplication") |

## External Documentation
No external research needed — feature uses established internal patterns (React Native `View`/`Text`/`Pressable`, `StyleSheet.create`, existing theme context, existing icon helper).

---

## Design Source — Exact Specs

Pulled live from `design/design.pen` via `mcp__pencil__batch_get` on the 12 reusable component node IDs (dark theme resolved values shown; **always reference the semantic token, never the hex**, so the component works across all 4 themes). Structural numbers (gaps, padding, sizes, font sizes/weights) do **not** vary by theme and should be hardcoded exactly as given, using a `theme.spacing.*` / `theme.radius.*` reference only where the literal number exactly matches that token (noted per-component below) — mirroring how Phase 2 atoms mix raw literals with token references (e.g. `InputField.tsx` uses `gap: theme.spacing.xs` because 6 is exactly `spacing.xs`, but uses raw `paddingVertical: 12` because 12 isn't on the scale).

**Node IDs** (for future Pencil sessions / screenshot diffing): Transaction Row `I7PRfZ`, Search Bar `Hs1lk`, Budget Progress Row `v1MWW`, Nav Item `pIru2`, Numpad Key `kQtFg`, Numpad Key Row `EalTv`, Form Field Group `FL1A7`, Divider/Or `GbAxV`, Title+Subtitle `fIObI`, Info Row/Chevron `A4pVM`, Step Indicator `FK7CO`, Segmented Toggle `CXJSP`.

### 1. Transaction Row (`I7PRfZ`)
- Root: `flexDirection: row`, `alignItems: center`, `gap: 12` (raw, no token match), `paddingVertical: 10`, `paddingHorizontal: 4` (raw).
- Leading: `CategoryIcon` atom instance (`icon`, `tint` passed through).
- Middle "Info" column: `flexDirection: column`, `gap: 2` (raw), `flex: 1` to fill remaining row width.
  - Title: Inter, 15px, weight 600 → `theme.fonts.body.semibold`, color `theme.colors.textPrimary`.
  - Subtitle: Inter, 12px, weight normal → `theme.fonts.body.regular`, color `theme.colors.textSecondary`.
- Trailing "Amount" text: Geist, 15px, weight 700 → `theme.fonts.heading.bold`. Color depends on tone: expense example shown as `theme.colors.expenseCoral` (`#E2897E` in dark).
- **Do not hardcode the design's `width: 380`** — that's the mockup frame's instance width, not a component constraint. Let the row fill its parent's width.

### 2. Search Bar (`Hs1lk`)
- Root: `flexDirection: row`, `alignItems: center`, `gap: 10` → `theme.spacing.sm`.
- `InputField` atom instance, `icon="search"`, needs to grow to fill remaining width (wrap in `<View style={{ flex: 1 }}>` — see Task 12 GOTCHA, `InputField` has no `style` prop).
- Filter button: 44×44, `cornerRadius: 10` → `theme.radius.sm`, `backgroundColor: theme.colors.bgSurfaceAlt`, icon `sliders-horizontal` 18×18 color `theme.colors.textSecondary`. **Not** the existing `ButtonIconOnly` visual (that's a filled accent-teal circle) — requires the `variant="surface"` extension from Task 1.

### 3. Budget Progress Row (`v1MWW`)
- Root: `flexDirection: column`, `gap: 8` (raw).
- "Top" row: `flexDirection: row`, `justifyContent: space-between`, full width.
  - Name: Inter 14px weight 600 → `theme.fonts.body.semibold`, `theme.colors.textPrimary`.
  - Sub (e.g. `"₺2.534,00 / ₺3.000,00"`): Inter 12px weight 500 → `theme.fonts.body.medium`, `theme.colors.textSecondary`. Pass as one pre-formatted string prop (mirrors how `AmountDisplay`/`BadgeAmount` accept pre-formatted amount strings — no number formatting logic belongs in this layer).
- `ProgressBar` atom instance below, full width (its own `styles.track` is already `width: '100%'`, so no wrapper needed — unlike Search Bar/Form Field Group which are in `row` layouts).

### 4. Nav Item (`pIru2`)
- Root: `flexDirection: column`, `alignItems: center`, `gap: 2` (raw), `paddingVertical: 6` → `theme.spacing.xs`, `paddingHorizontal: 10` → `theme.spacing.sm`, `cornerRadius: 999` → `theme.radius.full`.
- Active state (design shows this only): `backgroundColor: theme.colors.accentTealDim`, icon + label color `theme.colors.accentTeal`.
- Inactive state (not in design, inferred — needed since Phase 4's Bottom Navigation Bar will render both states): `backgroundColor: 'transparent'`, icon + label color `theme.colors.textSecondary`.
- Icon 20×20 via `getIcon`; Label Inter 10px weight 600 → `theme.fonts.body.semibold`.

### 5. Numpad Key (`kQtFg`)
- Root: `height: 52`, `width: 64`, `alignItems: center`, `justifyContent: center`, no background (transparent).
- Label: Geist 22px weight 600 → `theme.fonts.heading.semibold`, color `theme.colors.textPrimary`.
- Must be `Pressable` (numpad keys are tappable) even though the `.pen` symbol itself has no press affordance encoded — this is inferred from the component's obvious purpose (Phase 7 "Yeni İşlem Modal" numeric entry).

### 6. Numpad Key Row (`EalTv`)
- Root: `flexDirection: row`, `justifyContent: space-between`, `width: 220` (raw mockup width — same "don't hardcode" caveat as Transaction Row; a real numpad grid sizes this from its container).
- **Design deviation, deliberate**: in the `.pen` file this component is actually built from 3 `Button/Primary` instances with heavy per-instance overrides (`fill: transparent`, label font swapped to Geist 22/`textPrimary`), **not** from the `Numpad Key` symbol above — almost certainly a Pencil-authoring shortcut (reusing an existing Pressable-shaped component rather than building a new one) rather than an intentional pattern. **Build this using the `NumpadKey` molecule from Task 3 instead** — reusing `ButtonPrimary` would mean fighting its fixed bold/rounded/accent-teal styling via overrides on every key, which is exactly the "raw styling duplication" Phase 3 is meant to avoid.
- Takes `keys: string[]` (renders one `NumpadKey` per entry) + `onKeyPress: (key: string) => void`. No `gap` needed — `justifyContent: space-between` handles spacing (matches the `.pen` source, which sets no `gap` on this frame).

### 7. Form Field Group (`FL1A7`)
- Root: `flexDirection: column`, `gap: 6` → `theme.spacing.xs`.
- Label: Inter 12px weight 600 → `theme.fonts.body.semibold`, `theme.colors.textSecondary`.
- `InputField` atom instance — no wrapper needed here; RN's default cross-axis `alignItems: 'stretch'` on a `column` flex container already gives it full width (unlike Search Bar's `row` layout, where main-axis growth needs an explicit `flex: 1` wrapper).
- Error text (conditionally rendered, not just visually hidden — the `.pen` source uses `enabled: false` as a design-time toggle, translate to conditional JSX): Inter 11px weight 500 → `theme.fonts.body.medium`, `theme.colors.warningRed`.

### 8. Divider / Or (`GbAxV`)
- Root: `flexDirection: row`, `alignItems: center`, `gap: 12` (raw).
- Two `1px` height lines, `flex: 1`, `backgroundColor: theme.colors.borderSubtle`.
- Center text (default `"veya"`, overridable via prop): Inter 12px weight 500 → `theme.fonts.body.medium`, `theme.colors.textTertiary`.

### 9. Title + Subtitle (`fIObI`)
- Root: `flexDirection: column`, `gap: 2` (raw), no fixed width (fit-content, matches the `.pen` source which sets none).
- Title: Geist 24px weight 700 → `theme.fonts.heading.bold`, `theme.colors.textPrimary`.
- Subtitle: Inter 13px weight normal → `theme.fonts.body.regular`, `theme.colors.textSecondary`.

### 10. Info Row / Chevron (`A4pVM`)
- Root: `flexDirection: row`, `alignItems: center`, `justifyContent: space-between`, `gap: 8` (raw), `paddingVertical: 10` → `theme.spacing.sm`, `paddingHorizontal: 14` (raw), `cornerRadius: 16` → `theme.radius.md`, `backgroundColor: theme.colors.bgSurfaceAlt`.
- Left group: icon (14×14, color `theme.colors.accentTeal`) + label/value pair (`flexDirection: row`, `gap: 4`).
  - Label: Inter 12px weight normal → `theme.fonts.body.regular`, `theme.colors.textSecondary`.
  - Value: Inter 12px **weight 700 in the design — but `theme.fonts.body` has no 700/bold variant loaded** (only regular/medium/semibold — see `src/app/_layout.tsx`, `Inter_700Bold` is not in the `useFonts` call). **Use `theme.fonts.body.semibold` as the closest loaded weight.** Do not add a new font asset for this — that's out of Phase 3 scope (font loading is Phase 0/theme territory).
- Right: chevron-right icon, 14×14, `theme.colors.textTertiary`.
- Must be `Pressable` (chevron implies navigation) — `onPress` is a required prop, matching `ButtonPrimary`/`ButtonIconOnly` convention.

### 11. Step Indicator (`FK7CO`)
- Root: `flexDirection: row`, `gap: 6` → `theme.spacing.xs`, no fixed width.
- Dots: `height: 6`, `cornerRadius: 999` → `theme.radius.full`. Active dot: `width: 24`, `theme.colors.accentTeal`. Inactive dots: `width: 8`, `theme.colors.borderSubtle`.
- Props: `steps: number` (total), `currentStep: number` (1-indexed active dot).

### 12. Segmented Toggle (`CXJSP`)
- Root: `flexDirection: row`, `gap: 8` (raw), no fixed width (design's `246` is mockup-only).
- Each option: `flex: 1`, `cornerRadius: 10` → `theme.radius.sm`, `justifyContent: center`, `alignItems: center`, `paddingVertical: 10` → `theme.spacing.sm`, `paddingHorizontal: 16` → `theme.spacing.md`.
- Selected option: `backgroundColor: theme.colors.accentTealDim`, text Inter 13px weight 600 → `theme.fonts.body.semibold`, `theme.colors.accentTeal`.
- Unselected option: `backgroundColor: theme.colors.bgSurfaceAlt`, text Inter 13px weight 500 → `theme.fonts.body.medium`, `theme.colors.textSecondary`.
- Props: `options: { label: string; value: string }[]`, `value: string`, `onChange: (value: string) => void`.

---

## Patterns to Mirror

### THEME_ACCESS
```tsx
// SOURCE: src/atoms/ProgressBar.tsx:11-12
export function ProgressBar({ value, color = 'accentTeal' }: ProgressBarProps) {
  const theme = useTheme();
```

### STATIC_VS_DYNAMIC_STYLE_SPLIT
```tsx
// SOURCE: src/atoms/ButtonPrimary.tsx:30-42, 60-68
<Pressable
  style={[
    styles.container, // static, unit-less layout constants
    { borderRadius: theme.radius.sm, backgroundColor: theme.colors.accentTeal, opacity: disabled ? 0.5 : 1 }, // theme-bound
    style,
  ]}
>
...
const styles = StyleSheet.create({
  container: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
});
```

### DYNAMIC_ICON_RENDERING (mandatory — see ESLint GOTCHA)
```tsx
// SOURCE: src/atoms/CategoryIcon.tsx:1,28
import { createElement } from 'react';
...
{createElement(getIcon(icon), { size: 20, color: tintColor })}
```

### TONE_TO_COLOR_MAPPING
```tsx
// SOURCE: src/atoms/AmountDisplay.tsx:15-20
const color =
  tone === 'income'
    ? theme.colors.incomeGreen
    : tone === 'expense'
      ? theme.colors.expenseCoral
      : theme.colors.textPrimary;
```

### ATOM_COMPOSITION (molecule wrapping an atom, prop pass-through)
```tsx
// Pattern to write fresh for Task 9 (Budget Progress Row) — no direct precedent yet
// since Phase 2 atoms don't compose each other. Follow the same file shape as atoms:
import { ProgressBar } from '@/atoms';
...
<ProgressBar value={progress} color={progressColor} />
```

### BARREL_EXPORT
```ts
// SOURCE: src/atoms/index.ts:1-10
export * from './Avatar';
export * from './BadgeAmount';
...
```

### ERROR_HANDLING
No error handling patterns exist in atoms beyond `getIcon`'s throw-on-unknown-name (`src/lib/icons.ts:22-24`) and `ThemeProvider`'s throw-if-outside-context (`src/theme/ThemeProvider.tsx:75-78`). Molecules need none of their own — they're pure presentational components with no I/O.

### LOGGING_PATTERN
None exists in the codebase (no logger configured). Not applicable to Phase 3.

### TEST_STRUCTURE
No test runner configured (confirmed in `atoms-phase-2-report.md` — "None — no test runner configured in this repo"). Phase 3 follows the same manual/visual verification approach.

---

## Files to Change

| File | Action | Justification |
|---|---|---|
| `src/atoms/ButtonIconOnly.tsx` | UPDATE | Add `variant?: 'accent' \| 'surface'` and `size?: number` props (both optional, defaulting to current behavior) so Search Bar's filter button can reuse it instead of hand-rolling a styled `Pressable` |
| `src/molecules/NavItem.tsx` | CREATE | Molecule 1 |
| `src/molecules/NumpadKey.tsx` | CREATE | Molecule 2 |
| `src/molecules/NumpadKeyRow.tsx` | CREATE | Molecule 3 (depends on NumpadKey) |
| `src/molecules/DividerOr.tsx` | CREATE | Molecule 4 |
| `src/molecules/TitleSubtitle.tsx` | CREATE | Molecule 5 |
| `src/molecules/StepIndicator.tsx` | CREATE | Molecule 6 |
| `src/molecules/SegmentedToggle.tsx` | CREATE | Molecule 7 |
| `src/molecules/TransactionRow.tsx` | CREATE | Molecule 8 (depends on `CategoryIcon` atom) |
| `src/molecules/BudgetProgressRow.tsx` | CREATE | Molecule 9 (depends on `ProgressBar` atom) |
| `src/molecules/FormFieldGroup.tsx` | CREATE | Molecule 10 (depends on `InputField` atom) |
| `src/molecules/InfoRowChevron.tsx` | CREATE | Molecule 11 |
| `src/molecules/SearchBar.tsx` | CREATE | Molecule 12 (depends on `InputField` atom + extended `ButtonIconOnly`) |
| `src/molecules/index.ts` | CREATE | Barrel export, mirrors `src/atoms/index.ts` |
| `.claude/phases.md` | UPDATE | Check off Phase 3 line once done |

## NOT Building
- Icon-key variant of `NumpadKey` (e.g. a backspace/⌫ key) — the `.pen` design only defines the label variant for this phase; deferred to Phase 7 when the full numpad grid is assembled and the actual key set (digits + `.` + ⌫) is known.
- `style` prop overrides on the new molecules — none of the 12 `.pen` symbols need external layout overrides to compose correctly (unlike `ButtonPrimary`/`ButtonSecondary`, which needed it for one specific reason each); Phase 4 organisms are responsible for wrapping/positioning, matching how `Avatar`/`ProgressBar`/`CategoryIcon` work today.
- Adding `Inter_700Bold` as a font asset to satisfy Info Row / Chevron's "Value" text weight — out of scope, theme/font-loading changes belong to Phase 0/1.
- Redux/Supabase wiring, navigation logic, real numpad grid assembly, real bottom nav tab list — those are Phase 4+ concerns; Phase 3 components take plain props and callbacks only.
- Unit tests — no test runner exists in this repo (see Testing Strategy below).

---

## Step-by-Step Tasks

### Task 1: Extend `ButtonIconOnly` atom with `variant` + `size`
- **ACTION**: Add two optional props to `src/atoms/ButtonIconOnly.tsx`, non-breaking.
- **IMPLEMENT**:
  ```tsx
  export interface ButtonIconOnlyProps {
    icon: string;
    onPress: () => void;
    accessibilityLabel: string;
    variant?: 'accent' | 'surface';
    size?: number;
  }

  export function ButtonIconOnly({
    icon,
    onPress,
    accessibilityLabel,
    variant = 'accent',
    size = 40,
  }: ButtonIconOnlyProps) {
    const theme = useTheme();
    const isSurface = variant === 'surface';

    return (
      <Pressable
        onPress={onPress}
        accessibilityLabel={accessibilityLabel}
        hitSlop={{ top: 4, right: 4, bottom: 4, left: 4 }}
        style={[
          styles.container,
          {
            width: size,
            height: size,
            borderRadius: isSurface ? theme.radius.sm : theme.radius.full,
            backgroundColor: isSurface
              ? theme.colors.bgSurfaceAlt
              : theme.colors.accentTeal,
          },
        ]}
      >
        {createElement(getIcon(icon), {
          size: Math.round(size * 0.45),
          color: isSurface ? theme.colors.textSecondary : theme.colors.bgApp,
        })}
      </Pressable>
    );
  }

  const styles = StyleSheet.create({
    container: { alignItems: 'center', justifyContent: 'center' },
  });
  ```
- **MIRROR**: Existing `ButtonIconOnly.tsx` structure — same file, same `createElement(getIcon(...))` pattern.
- **IMPORTS**: No new imports needed (already imports `createElement`, `Pressable`, `StyleSheet`, `getIcon`, `useTheme`).
- **GOTCHA**: Original icon size was hardcoded `20` for the fixed 40px button (`20 = 40 * 0.5`); the design's 44px surface variant uses an 18px icon (`18 ≈ 44 * 0.41`) — use `size * 0.45` as a single formula that lands close to both design instances (40*0.45=18, 44*0.45≈19.8→20 rounded) rather than branching on variant for icon size too. Verify against both call sites after: `<ButtonIconOnly icon="x" onPress={...} accessibilityLabel="x" />` (unchanged 40px accent circle) and `<ButtonIconOnly icon="sliders-horizontal" variant="surface" size={44} onPress={...} accessibilityLabel="Filtrele" />` (44px surface square).
- **VALIDATE**: `npm run typecheck` — no errors; existing call sites (grep `ButtonIconOnly` usages, currently none outside the atom itself since no screens consume it yet) remain source-compatible since both new props are optional.

### Task 2: `NavItem` molecule
- **ACTION**: Create `src/molecules/NavItem.tsx`.
- **IMPLEMENT**:
  ```tsx
  export interface NavItemProps {
    icon: string;
    label: string;
    active?: boolean;
    onPress: () => void;
  }

  export function NavItem({ icon, label, active = false, onPress }: NavItemProps) {
    const theme = useTheme();
    const color = active ? theme.colors.accentTeal : theme.colors.textSecondary;

    return (
      <Pressable
        onPress={onPress}
        style={[
          styles.container,
          {
            borderRadius: theme.radius.full,
            paddingVertical: theme.spacing.xs,
            paddingHorizontal: theme.spacing.sm,
            backgroundColor: active ? theme.colors.accentTealDim : 'transparent',
          },
        ]}
      >
        {createElement(getIcon(icon), { size: 20, color })}
        <Text style={{ fontFamily: theme.fonts.body.semibold, fontSize: 10, color }}>
          {label}
        </Text>
      </Pressable>
    );
  }

  const styles = StyleSheet.create({
    container: { flexDirection: 'column', alignItems: 'center', gap: 2 },
  });
  ```
- **MIRROR**: `src/atoms/ButtonIconOnly.tsx` (Pressable + theme-bound style array) + `src/atoms/CategoryIcon.tsx` (dynamic icon via `createElement`).
- **IMPORTS**: `createElement` from `react`; `Pressable, StyleSheet, Text` from `react-native`; `getIcon` from `@/lib/icons`; `useTheme` from `@/theme`.
- **GOTCHA**: Inactive visual (transparent bg, `textSecondary` color) isn't in the `.pen` source (only the active state is shown) — this is an inference, flag for design review once Phase 4's Bottom Navigation Bar renders it live.
- **VALIDATE**: Render both `active` states in a scratch screen; confirm active pill background/color and inactive plain icon+label look correct in at least dark + light themes.

### Task 3: `NumpadKey` molecule
- **ACTION**: Create `src/molecules/NumpadKey.tsx`.
- **IMPLEMENT**:
  ```tsx
  export interface NumpadKeyProps {
    label: string;
    onPress: () => void;
  }

  export function NumpadKey({ label, onPress }: NumpadKeyProps) {
    const theme = useTheme();
    return (
      <Pressable onPress={onPress} style={styles.container}>
        <Text style={{ fontFamily: theme.fonts.heading.semibold, fontSize: 22, color: theme.colors.textPrimary }}>
          {label}
        </Text>
      </Pressable>
    );
  }

  const styles = StyleSheet.create({
    container: { height: 52, width: 64, alignItems: 'center', justifyContent: 'center' },
  });
  ```
- **MIRROR**: `src/atoms/AmountDisplay.tsx` (simplest atom shape: themed `Text` inside a sized `View`/`Pressable`).
- **IMPORTS**: `Pressable, StyleSheet, Text` from `react-native`; `useTheme` from `@/theme`.
- **GOTCHA**: No background/border in the design — don't add a `Pressable` ripple/highlight style unless asked; keep visuals identical to the static `.pen` symbol, only add press behavior.
- **VALIDATE**: Tap in a scratch screen, confirm `onPress` fires; visually matches `kQtFg` (52×64, centered Geist 22 600 digit).

### Task 4: `NumpadKeyRow` molecule
- **ACTION**: Create `src/molecules/NumpadKeyRow.tsx`.
- **IMPLEMENT**:
  ```tsx
  export interface NumpadKeyRowProps {
    keys: string[];
    onKeyPress: (key: string) => void;
  }

  export function NumpadKeyRow({ keys, onKeyPress }: NumpadKeyRowProps) {
    return (
      <View style={styles.container}>
        {keys.map((key) => (
          <NumpadKey key={key} label={key} onPress={() => onKeyPress(key)} />
        ))}
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: { flexDirection: 'row', justifyContent: 'space-between' },
  });
  ```
- **MIRROR**: N/A — first molecule-composing-a-molecule in the codebase; follow the same file shape (interface above component, `StyleSheet.create` at bottom) as every atom.
- **IMPORTS**: `View` from `react-native`; `NumpadKey` from `./NumpadKey`.
- **GOTCHA**: Do **not** reuse `Button/Primary` per-key even though that's literally what the `.pen` file does (see Design Source section #6 for why) — use the `NumpadKey` molecule from Task 3. Do not hardcode `width: 220` on the row.
- **VALIDATE**: Render with `keys={['4','5','6']}` in a scratch screen, confirm even spacing across the row width and each `onKeyPress` fires with the right value.

### Task 5: `DividerOr` molecule
- **ACTION**: Create `src/molecules/DividerOr.tsx`.
- **IMPLEMENT**:
  ```tsx
  export interface DividerOrProps {
    label?: string;
  }

  export function DividerOr({ label = 'veya' }: DividerOrProps) {
    const theme = useTheme();
    return (
      <View style={styles.container}>
        <View style={[styles.line, { backgroundColor: theme.colors.borderSubtle }]} />
        <Text style={{ fontFamily: theme.fonts.body.medium, fontSize: 12, color: theme.colors.textTertiary }}>
          {label}
        </Text>
        <View style={[styles.line, { backgroundColor: theme.colors.borderSubtle }]} />
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    line: { flex: 1, height: 1 },
  });
  ```
- **MIRROR**: `src/atoms/ProgressBar.tsx` (themed `View` as a plain colored bar/line).
- **IMPORTS**: `View, Text, StyleSheet` from `react-native`; `useTheme` from `@/theme`.
- **GOTCHA**: None — simplest molecule, no icons, no atom dependency.
- **VALIDATE**: Render in a scratch screen inside a fixed-width parent, confirm both lines grow evenly and the label stays centered.

### Task 6: `TitleSubtitle` molecule
- **ACTION**: Create `src/molecules/TitleSubtitle.tsx`.
- **IMPLEMENT**:
  ```tsx
  export interface TitleSubtitleProps {
    title: string;
    subtitle: string;
  }

  export function TitleSubtitle({ title, subtitle }: TitleSubtitleProps) {
    const theme = useTheme();
    return (
      <View style={styles.container}>
        <Text style={{ fontFamily: theme.fonts.heading.bold, fontSize: 24, color: theme.colors.textPrimary }}>
          {title}
        </Text>
        <Text style={{ fontFamily: theme.fonts.body.regular, fontSize: 13, color: theme.colors.textSecondary }}>
          {subtitle}
        </Text>
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: { flexDirection: 'column', gap: 2 },
  });
  ```
- **MIRROR**: `src/atoms/AmountDisplay.tsx`.
- **IMPORTS**: `View, Text, StyleSheet` from `react-native`; `useTheme` from `@/theme`.
- **GOTCHA**: No fixed width in the `.pen` source — leave it fit-content, don't add `width: '100%'` speculatively.
- **VALIDATE**: Render with a long title, confirm it doesn't clip (default `Text` wraps only if `textGrowth`/`numberOfLines` were set in the design — here it isn't, so single-line auto-width matches the source).

### Task 7: `StepIndicator` molecule
- **ACTION**: Create `src/molecules/StepIndicator.tsx`.
- **IMPLEMENT**:
  ```tsx
  export interface StepIndicatorProps {
    steps: number;
    currentStep: number;
  }

  export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
    const theme = useTheme();
    return (
      <View style={[styles.container, { gap: theme.spacing.xs }]}>
        {Array.from({ length: steps }, (_, i) => i + 1).map((step) => {
          const active = step === currentStep;
          return (
            <View
              key={step}
              style={[
                styles.dot,
                {
                  width: active ? 24 : 8,
                  borderRadius: theme.radius.full,
                  backgroundColor: active ? theme.colors.accentTeal : theme.colors.borderSubtle,
                },
              ]}
            />
          );
        })}
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: { flexDirection: 'row' },
    dot: { height: 6 },
  });
  ```
- **MIRROR**: `src/atoms/ProgressBar.tsx` (themed colored `View`s as the visual unit).
- **IMPORTS**: `View, StyleSheet` from `react-native`; `useTheme` from `@/theme`.
- **GOTCHA**: `currentStep` is 1-indexed to match the natural "step 1 of 3" mental model onboarding screens will use — don't silently switch to 0-indexed.
- **VALIDATE**: Render `steps={3} currentStep={1}` and confirm it matches the `.pen` source exactly (wide accent dot first, two narrow muted dots after).

### Task 8: `SegmentedToggle` molecule
- **ACTION**: Create `src/molecules/SegmentedToggle.tsx`.
- **IMPLEMENT**:
  ```tsx
  export interface SegmentedToggleOption {
    label: string;
    value: string;
  }

  export interface SegmentedToggleProps {
    options: SegmentedToggleOption[];
    value: string;
    onChange: (value: string) => void;
  }

  export function SegmentedToggle({ options, value, onChange }: SegmentedToggleProps) {
    const theme = useTheme();
    return (
      <View style={styles.container}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              style={[
                styles.option,
                {
                  borderRadius: theme.radius.sm,
                  paddingVertical: theme.spacing.sm,
                  paddingHorizontal: theme.spacing.md,
                  backgroundColor: selected ? theme.colors.accentTealDim : theme.colors.bgSurfaceAlt,
                },
              ]}
            >
              <Text
                style={{
                  fontFamily: selected ? theme.fonts.body.semibold : theme.fonts.body.medium,
                  fontSize: 13,
                  color: selected ? theme.colors.accentTeal : theme.colors.textSecondary,
                }}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: { flexDirection: 'row', gap: 8 },
    option: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  });
  ```
- **MIRROR**: `src/atoms/ButtonSecondary.tsx` (tone-based color branching + `Pressable` list pattern).
- **IMPORTS**: `Pressable, StyleSheet, Text, View` from `react-native`; `useTheme` from `@/theme`.
- **GOTCHA**: Design shows exactly 2 options, but nothing about the layout assumes 2 — built generically over `options.length` since `flex: 1` per option scales to N without changes.
- **VALIDATE**: Render with the design's exact options (`[{label:'Aylık',value:'monthly'},{label:'Haftalık',value:'weekly'}]`), toggle `value`, confirm selected/unselected styling swaps correctly.

### Task 9: `TransactionRow` molecule
- **ACTION**: Create `src/molecules/TransactionRow.tsx`.
- **IMPLEMENT**:
  ```tsx
  export interface TransactionRowProps {
    icon: string;
    iconTint?: keyof ColorTokens;
    title: string;
    subtitle: string;
    amount: string;
    tone?: 'income' | 'expense' | 'neutral';
  }

  export function TransactionRow({
    icon,
    iconTint = 'accentTeal',
    title,
    subtitle,
    amount,
    tone = 'neutral',
  }: TransactionRowProps) {
    const theme = useTheme();
    const amountColor =
      tone === 'income'
        ? theme.colors.incomeGreen
        : tone === 'expense'
          ? theme.colors.expenseCoral
          : theme.colors.textPrimary;

    return (
      <View style={styles.container}>
        <CategoryIcon icon={icon} tint={iconTint} />
        <View style={styles.info}>
          <Text style={{ fontFamily: theme.fonts.body.semibold, fontSize: 15, color: theme.colors.textPrimary }}>
            {title}
          </Text>
          <Text style={{ fontFamily: theme.fonts.body.regular, fontSize: 12, color: theme.colors.textSecondary }}>
            {subtitle}
          </Text>
        </View>
        <Text style={{ fontFamily: theme.fonts.heading.bold, fontSize: 15, color: amountColor }}>
          {amount}
        </Text>
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 4 },
    info: { flexDirection: 'column', gap: 2, flex: 1 },
  });
  ```
- **MIRROR**: `src/atoms/AmountDisplay.tsx` (tone→color mapping — same 3-way ternary, duplicated here deliberately rather than reused as a component, see GOTCHA) + `src/atoms/CategoryIcon.tsx` (atom instance usage).
- **IMPORTS**: `View, Text, StyleSheet` from `react-native`; `CategoryIcon` from `@/atoms`; `useTheme` from `@/theme`; `ColorTokens` type from `@/theme/tokens`.
- **GOTCHA**: `AmountDisplay` atom hardcodes `fontSize: 40` (it's the hero amount on summary screens) — it cannot be reused here where the amount is 15px inline text. Re-deriving the tone→color ternary locally (using theme tokens, not hex) is the correct call, not "raw styling duplication" in the sense Phase 3 warns against (that phrase is about hardcoding colors/spacing instead of using theme tokens — this still goes through `theme.colors.*`).
- **VALIDATE**: Render with `tone="expense"` and `amount="-₺284,50"`, confirm coral color + Geist bold 15px, `title`/`subtitle` wrap correctly if `flex: 1` container is narrow.

### Task 10: `BudgetProgressRow` molecule
- **ACTION**: Create `src/molecules/BudgetProgressRow.tsx`.
- **IMPLEMENT**:
  ```tsx
  export interface BudgetProgressRowProps {
    name: string;
    subtitle: string;
    progress: number;
    progressColor?: keyof ColorTokens;
  }

  export function BudgetProgressRow({
    name,
    subtitle,
    progress,
    progressColor = 'accentTeal',
  }: BudgetProgressRowProps) {
    const theme = useTheme();
    return (
      <View style={styles.container}>
        <View style={styles.top}>
          <Text style={{ fontFamily: theme.fonts.body.semibold, fontSize: 14, color: theme.colors.textPrimary }}>
            {name}
          </Text>
          <Text style={{ fontFamily: theme.fonts.body.medium, fontSize: 12, color: theme.colors.textSecondary }}>
            {subtitle}
          </Text>
        </View>
        <ProgressBar value={progress} color={progressColor} />
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: { flexDirection: 'column', gap: 8 },
    top: { flexDirection: 'row', justifyContent: 'space-between' },
  });
  ```
- **MIRROR**: `src/atoms/ProgressBar.tsx` (direct atom reuse, prop pass-through for `color`).
- **IMPORTS**: `View, Text, StyleSheet` from `react-native`; `ProgressBar` from `@/atoms`; `useTheme` from `@/theme`; `ColorTokens` type from `@/theme/tokens`.
- **GOTCHA**: `subtitle` takes one pre-formatted string (e.g. `"₺2.534,00 / ₺3.000,00"`) — no currency math belongs in this component, matching how `AmountDisplay`/`BadgeAmount` take pre-formatted `amount` strings.
- **VALIDATE**: Render with `progress={84}`, confirm the bar fills to 84% and both text rows align `space-between` on one line.

### Task 11: `FormFieldGroup` molecule
- **ACTION**: Create `src/molecules/FormFieldGroup.tsx`.
- **IMPLEMENT**:
  ```tsx
  export interface FormFieldGroupProps {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    icon?: string;
    error?: string;
  }

  export function FormFieldGroup({
    label,
    value,
    onChangeText,
    placeholder,
    icon,
    error,
  }: FormFieldGroupProps) {
    const theme = useTheme();
    return (
      <View style={styles.container}>
        <Text style={{ fontFamily: theme.fonts.body.semibold, fontSize: 12, color: theme.colors.textSecondary }}>
          {label}
        </Text>
        <InputField
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          icon={icon}
          error={Boolean(error)}
        />
        {error ? (
          <Text style={{ fontFamily: theme.fonts.body.medium, fontSize: 11, color: theme.colors.warningRed }}>
            {error}
          </Text>
        ) : null}
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: { flexDirection: 'column', gap: 6 },
  });
  ```
- **MIRROR**: `src/atoms/InputField.tsx` (direct atom reuse, prop pass-through incl. its own `error?: boolean` prop — here promoted to `error?: string` at the molecule level so the message and the visual state are driven by one prop instead of two that could get out of sync).
- **IMPORTS**: `View, Text, StyleSheet` from `react-native`; `InputField` from `@/atoms`; `useTheme` from `@/theme`.
- **GOTCHA**: No wrapper `View` needed around `InputField` for width — RN's default `alignItems: 'stretch'` on a `column` container already gives it full width (contrast with Task 12's `SearchBar`, which is a `row` container and does need an explicit wrapper).
- **VALIDATE**: Render with `error="Bu alan zorunludur"`, confirm red border on the input (via `error` boolean passthrough) AND the red message text both appear; render without `error`, confirm neither appears.

### Task 12: `InfoRowChevron` molecule
- **ACTION**: Create `src/molecules/InfoRowChevron.tsx`.
- **IMPLEMENT**:
  ```tsx
  export interface InfoRowChevronProps {
    icon: string;
    label: string;
    value: string;
    onPress: () => void;
  }

  export function InfoRowChevron({ icon, label, value, onPress }: InfoRowChevronProps) {
    const theme = useTheme();
    return (
      <Pressable
        onPress={onPress}
        style={[
          styles.container,
          { borderRadius: theme.radius.md, backgroundColor: theme.colors.bgSurfaceAlt, paddingVertical: theme.spacing.sm },
        ]}
      >
        <View style={styles.left}>
          {createElement(getIcon(icon), { size: 14, color: theme.colors.accentTeal })}
          <View style={styles.text}>
            <Text style={{ fontFamily: theme.fonts.body.regular, fontSize: 12, color: theme.colors.textSecondary }}>
              {label}
            </Text>
            <Text style={{ fontFamily: theme.fonts.body.semibold, fontSize: 12, color: theme.colors.textPrimary }}>
              {value}
            </Text>
          </View>
        </View>
        {createElement(getIcon('chevron-right'), { size: 14, color: theme.colors.textTertiary })}
      </Pressable>
    );
  }

  const styles = StyleSheet.create({
    container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingHorizontal: 14 },
    left: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    text: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  });
  ```
- **MIRROR**: `src/atoms/BadgeAmount.tsx` (icon + text row composition, dynamic icon via `createElement`).
- **IMPORTS**: `createElement` from `react`; `Pressable, StyleSheet, Text, View` from `react-native`; `getIcon` from `@/lib/icons`; `useTheme` from `@/theme`.
- **GOTCHA**: `value`'s design weight (700) isn't loaded for Inter — use `theme.fonts.body.semibold` (see Design Source #10). Don't add a new font just for this.
- **VALIDATE**: Render with `icon="repeat" label="Bu ayki düzenli gelirin:" value="₺3.500,00"`, confirm row background/radius/padding match, chevron renders on the right, `onPress` fires on tap anywhere in the row.

### Task 13: `SearchBar` molecule
- **ACTION**: Create `src/molecules/SearchBar.tsx`. Depends on Task 1 (`ButtonIconOnly` extension).
- **IMPLEMENT**:
  ```tsx
  export interface SearchBarProps {
    value: string;
    onChangeText: (text: string) => void;
    onFilterPress: () => void;
    placeholder?: string;
  }

  export function SearchBar({ value, onChangeText, onFilterPress, placeholder = 'İşlem ara...' }: SearchBarProps) {
    const theme = useTheme();
    return (
      <View style={[styles.container, { gap: theme.spacing.sm }]}>
        <View style={styles.inputWrapper}>
          <InputField value={value} onChangeText={onChangeText} placeholder={placeholder} icon="search" />
        </View>
        <ButtonIconOnly
          icon="sliders-horizontal"
          variant="surface"
          size={44}
          onPress={onFilterPress}
          accessibilityLabel="Filtrele"
        />
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: { flexDirection: 'row', alignItems: 'center' },
    inputWrapper: { flex: 1 },
  });
  ```
- **MIRROR**: `src/atoms/InputField.tsx` (atom reuse) + Task 1's extended `ButtonIconOnly`.
- **IMPORTS**: `View, StyleSheet` from `react-native`; `InputField, ButtonIconOnly` from `@/atoms`; `useTheme` from `@/theme`.
- **GOTCHA**: `InputField` has no `style` prop (confirmed by reading the file — its root `View`'s style array is `[styles.container, {...}]` with nothing external mixed in), so the only way to make it grow in this `row` layout without touching Phase 2 code is the `<View style={styles.inputWrapper}>` (`flex: 1`) wrapper shown above. Do not add a `style` prop to `InputField` for this — that's unnecessary atom-surface growth for a need fully solved by wrapping.
- **VALIDATE**: Render in a scratch screen at a fixed width, confirm the input grows to fill remaining space and the 44px filter button keeps its fixed size; tap the filter button, confirm `onFilterPress` fires.

### Task 14: Barrel export
- **ACTION**: Create `src/molecules/index.ts`.
- **IMPLEMENT**:
  ```ts
  export * from './BudgetProgressRow';
  export * from './DividerOr';
  export * from './FormFieldGroup';
  export * from './InfoRowChevron';
  export * from './NavItem';
  export * from './NumpadKey';
  export * from './NumpadKeyRow';
  export * from './SearchBar';
  export * from './SegmentedToggle';
  export * from './StepIndicator';
  export * from './TitleSubtitle';
  export * from './TransactionRow';
  ```
- **MIRROR**: `src/atoms/index.ts` (alphabetical `export *` list).
- **IMPORTS**: None.
- **GOTCHA**: Keep alphabetical — matches the existing atoms barrel's ordering convention exactly.
- **VALIDATE**: `import { TransactionRow, SearchBar } from '@/molecules'` resolves with no TS errors from a scratch file.

---

## Testing Strategy

No test runner is configured in this repo (confirmed via `atoms-phase-2-report.md`). Verification is manual/visual, same as Phase 2.

### Edge Cases Checklist
- [ ] `TransactionRow` — long `title`/`subtitle` text doesn't break the row layout (should truncate/wrap gracefully via `flex: 1` on the info column)
- [ ] `BudgetProgressRow` — `progress={0}` and `progress={120}` (over-limit) both render sanely (the `ProgressBar` atom already clamps 0-100 internally)
- [ ] `NumpadKeyRow` — empty `keys={[]}` renders nothing, doesn't crash
- [ ] `StepIndicator` — `currentStep` outside `[1, steps]` range doesn't crash (no dot will be marked active — acceptable, not a hard-fail case per "don't add validation for scenarios that can't happen": callers always pass valid step numbers)
- [ ] `SegmentedToggle` — single-option array still renders (fills full width, no visual bug expected since it's just `flex: 1` on the one child)
- [ ] `FormFieldGroup` — `error` prop toggling on/off doesn't leave stale red border (drives directly off the `error` prop each render, no local state)
- [ ] All 12 — visually correct in all 4 theme modes (`dark`, `light`, `vibrant`, `vibrant-dark`) since every color reference goes through `theme.colors.*`

---

## Validation Commands

### Static Analysis
```bash
npm run typecheck
```
EXPECT: Zero type errors.

```bash
npm run lint
```
EXPECT: Zero errors. Watch specifically for `react-hooks/static-components` on `NavItem.tsx` and `InfoRowChevron.tsx` (both render dynamically-selected icons) — must use `createElement(getIcon(...), props)`, not `<Icon ... />`.

### Format
```bash
npm run format:check
```
EXPECT: No files need formatting (or run `npm run format` to auto-fix, then re-check).

### Browser/Manual Validation
```bash
npx expo start --web
```
EXPECT: Metro bundles clean, 0 errors/warnings — same fallback approach as Phase 2 (temporarily render all 12 molecules in `src/app/(tabs)/index.tsx` behind the real `ThemeProvider`, confirm no icon-resolution crashes/missing-font warnings/theme-context errors, then revert the scratch screen).

### Pencil Screenshot Diff (new this phase — attempt it)
Unlike Phase 2 (where the Pencil desktop app wasn't attached), `get_editor_state` succeeded in this planning session, meaning Pencil **is** available. Before closing out Phase 3, call `mcp__pencil__get_screenshot` on each of the 12 node IDs listed in "Design Source — Exact Specs" and visually diff against the rendered scratch screen — this closes the visual-fidelity gap the Phase 2 report flagged as a known gap.

---

## Acceptance Criteria
- [ ] All 12 molecule files created under `src/molecules/`, plus `src/molecules/index.ts` barrel
- [ ] `ButtonIconOnly` atom extended with `variant`/`size`, fully backward-compatible
- [ ] All components consume `useTheme()` — no hardcoded hex colors anywhere
- [ ] All dynamic icons rendered via `createElement(getIcon(name), props)`, never JSX `<Icon />`
- [ ] `npm run typecheck`, `npm run lint`, `npm run format:check` all pass
- [ ] Manual scratch-screen render confirms no runtime crashes across all 4 themes
- [ ] Pencil screenshot diff attempted (see above) and any visible mismatches noted/fixed
- [ ] `.claude/phases.md` Phase 3 checkbox marked `[x]`, report written to `.claude/PRPs/reports/`

## Completion Checklist
- [ ] Code follows discovered patterns (theme access, static/dynamic style split, dynamic icon rendering)
- [ ] No hardcoded design-mockup widths (`380`, `320`, `280`, `260`, `220`, `300`, `246`) carried into component code
- [ ] No new font weights added — `Inter_700Bold` gap handled by falling back to `semibold`
- [ ] `NumpadKeyRow` built from `NumpadKey`, not from `Button/Primary` overrides (deliberate deviation from literal `.pen` structure, documented)
- [ ] No unnecessary scope additions (no icon-key `NumpadKey` variant, no `style` props added speculatively)
- [ ] Self-contained — no further design lookups needed during implementation

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `NavItem` inactive-state colors are inferred, not designed | Medium | Low | Flag for visual review once Phase 4's Bottom Navigation Bar renders both states side by side; easy one-line fix if wrong |
| `Inter_700Bold` fallback to `semibold` reads slightly lighter than the design intends for `InfoRowChevron`'s value text | Low | Low | If it reads as a real visual regression once seen live, revisit as a small Phase 0/theme follow-up (add the font weight) rather than reopening Phase 3 |
| Reusing `NumpadKey` instead of the `.pen` file's literal `Button/Primary`-based structure could look different from a strict node-by-node Pencil screenshot diff of `EalTv` specifically | Low | Low | The screenshot diff step above will catch this immediately; visually the output should be identical (same font/size/color/dimensions), only the underlying component reuse differs |

## Notes
- Font weight tokens available: `heading.regular/semibold/bold` (Geist 400/600/700), `body.regular/medium/semibold` (Inter 400/500/600) — no `body.bold`. Every task above that specifies an Inter-700 design value has been mapped to `body.semibold` explicitly; don't re-derive this during implementation.
- Spacing/radius token matches are called out per-component in "Design Source — Exact Specs" — where a raw literal is specified instead, it's because the exact number isn't on the `SPACING`/`RADIUS` scale, matching Phase 2 atoms' existing mix of raw-vs-token values.
- All 32 reusable component node IDs from the `.pen` file are listed in `get_editor_state`'s output if a future session needs to re-verify any of these against the live design.
