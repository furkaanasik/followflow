# Plan: Phase 2 — Atoms (10 components)

## Summary
Build the 10 atom components from `design/design.pen`'s Design System frame as themed React Native components under `src/atoms/`. Each atom consumes `useTheme()` for colors/spacing/fonts (no hardcoded values except two Google-brand exceptions), renders correctly across all 4 modes (dark/light/vibrant/vibrant-dark), and visually matches the Pencil source per `get_screenshot`.

## User Story
As a developer building FollowFlow screens (Phase 3+), I want a themed, typed atom library, so that molecules/organisms/screens compose from consistent primitives instead of duplicating styling.

## Problem → Solution
No component code exists yet (`src/atoms/` has only `.gitkeep`) → 10 typed, theme-aware atom components + a shared lucide-icon lookup + a color-alpha helper, all exported from `src/atoms/index.ts`.

## Metadata
- **Complexity**: Medium
- **Source PRD**: `.claude/phases.md`
- **PRD Phase**: Phase 2 — Atoms
- **Estimated Files**: 14 (2 new deps in package.json, 2 shared libs, 10 components, 1 barrel)

---

## UX Design
N/A — internal component-library change. No screen wiring yet (that's Phase 6+). Verification is visual (Pencil screenshot diff) not interaction-flow diff.

---

## Mandatory Reading

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 | `src/theme/tokens.ts` | 1-127 | Source of truth for `ColorTokens`, `SPACING`, `RADIUS`, `FONT_FAMILIES`, `Theme` type — every atom binds to these, never to raw hex |
| P0 | `src/theme/ThemeProvider.tsx` | 1-81 | `useTheme()` hook contract atoms must call; shows the only existing "throw if missing context" error pattern in the repo |
| P1 | `src/theme/index.ts` | 1-2 | Barrel-export pattern (`export * from './x'`) to mirror in `src/atoms/index.ts` |
| P1 | `src/app/(tabs)/index.tsx` | 1-17 | Only existing component in repo — shows `StyleSheet.create` + functional-component conventions (named `export default function XScreen()`, but atoms use **named** exports, see below) |
| P2 | `package.json` | 1-40 | Current deps — confirms no icon/SVG library installed yet |
| P2 | `tsconfig.json` | 1-9 | `@/*` → `src/*` path alias used for all internal imports |

## External Documentation

| Topic | Source | Key Takeaway |
|---|---|---|
| lucide-react-native | npm package docs | Ships tree-shakeable per-icon named exports (PascalCase, e.g. `Utensils`, `LogOut`) AND an `icons` dictionary object keyed by the same PascalCase names. Requires `react-native-svg` as a peer dependency — must install both. Icon props: `size`, `color`, `strokeWidth`. |

```
KEY_INSIGHT: design.pen's `icon` fields use kebab-case names ("log-out", "arrow-down") but lucide-react-native exports PascalCase ("LogOut", "ArrowDown"). Need a kebab→PascalCase lookup, not a direct string match.
APPLIES_TO: src/lib/icons.ts, every atom rendering an <Icon icon="..."> from the .pen spec
GOTCHA: lucide-react-native has no built-in kebab-case resolver — write a small `kebabToPascal` converter and index into the library's `icons` map; throw a clear error for unknown names (fail fast during dev, not a silent blank icon).
```

---

## Design Source — Exact Specs (from `design/design.pen`, resolved via `batch_get`)

All values below are **variable-bound** (theme-adaptive) unless marked "hardcoded". Node IDs are for traceability back to the `.pen` file only — not needed at runtime.

### 1. Category Icon (`W7Y8it`)
- Frame 44×44, `cornerRadius: radius-full`, `justifyContent/alignItems: center`
- `fill: "#3ECF9A26"` — **hardcoded in the design, but this is `accent-teal` (dark theme value `#3ECF9A`) + hex alpha suffix `26` (~15% opacity)**, not a real static color. Verified against the `Budget Card — Limit Aşıldı` variant which uses the identical technique (`bKKBv` override `fill: "#E5484D26"` = `warning-red` `#E5484D` + `26`). This alpha-suffix technique is the design's established convention for icon-chip tint backgrounds where no dedicated `-dim` token exists.
- Child: `icon` (lucide, e.g. `"utensils"`), 20×20, `fill: accent-teal`
- Confirmed reused as-is (no size/color override) in Transaction Row (`I7PRfZ` → ref `W7Y8it` as "Icon Badge") and reused with icon+tint override in Budget Card's over-limit variant (`icon: "gamepad-2"`, `fill: $warning-red`)
- **Props**: `icon: string` (kebab-case lucide name), `tint?: ColorTokens key` (default `accentTeal`), fixed size 44 (no evidence of other sizes — don't add unused flexibility)

### 2. Button / Primary (`NirZj`)
- Frame 220×52 (width is the design's fixed sample; **make width `fill_container`-equivalent / caller-controlled in RN**, height fixed 52), `cornerRadius: radius-sm`, `fill: accent-teal`, `gap: 8`, center
- Optional leading icon: `"check"`, 18×18, `fill: bg-app`, **`enabled: false` by default** in the master component → render only when an `icon` prop is passed
- Label: content `"Kaydet"` (sample text only — must be a `label` prop), `fill: bg-app`, `fontFamily: font-heading` + `fontWeight: 700` → **maps to `theme.fonts.heading.bold`**, `fontSize: 16`
- **Why text is `bg-app` not `text-primary`**: `bg-app` is near-black in dark/vibrant-dark and near-white in light/vibrant — i.e. it's reused here as the "on-accent" contrast color against the saturated `accent-teal` background in all 4 themes. Keep this exact binding; do not swap for `text-primary`.
- **Props**: `label: string`, `icon?: string`, `onPress: () => void`, `disabled?: boolean` (dim `accent-teal` via opacity, not a token — no disabled state in the design; use `opacity: 0.5` as a pragmatic default), full-width by default via `style` override

### 3. Button / Secondary (`iKwDe`)
- Frame 220×52, `cornerRadius: radius-sm`, **no fill** (transparent — sits on `bg-surface`/`bg-app`), `stroke: border-subtle` width 1, `gap: 8`, center
- Icon `"log-out"` 16×16 `fill: expense-coral`, label `"Çıkış Yap"` `fill: expense-coral` `fontFamily: font-body` `fontWeight: 600` → `theme.fonts.body.semibold`, `fontSize: 14`
- **Design decision (only one sampled instance, a destructive "Log Out" action)**: implement a `tone` prop — `'neutral'` (default: `text-primary` + `border-subtle`) | `'destructive'` (`expense-coral` + `border-subtle`, matching the sampled instance exactly). Border is `border-subtle` in both tones; only text/icon color changes. This keeps the atom generically reusable for any secondary action while exactly reproducing the one instance the design provides.
- **Props**: `label: string`, `icon?: string`, `tone?: 'neutral' | 'destructive'` (default `'neutral'`), `onPress: () => void`

### 4. Button / Icon Only (`F6BF6`)
- Frame 40×40, `cornerRadius: radius-full`, `fill: accent-teal`, center
- Child icon `"plus"` 20×20 `fill: bg-app`
- **a11y GOTCHA**: 40×40 is below the 44×44 minimum recommended tap target (iOS HIG / Android Material). Add `hitSlop={{ top: 4, right: 4, bottom: 4, left: 4 }}` on the `Pressable` — do not resize the visual circle (would break Pencil-screenshot parity).
- **Props**: `icon: string`, `onPress: () => void`, `accessibilityLabel: string` (required — icon-only buttons have no visible label for screen readers)

### 5. Button / Google CTA (`GLXOa`)
- Frame width 280 (height `fit_content`), `cornerRadius: radius-full`, `fill: "#FFFFFF"` **hardcoded — correct, Google brand guidelines require a white button background regardless of app theme**, `gap: 10`, `padding: [14, 20]`, center
- "G Mark" text: content `"G"`, `fill: "#4285F4"` **hardcoded Google blue**, `fontFamily: font-heading` `fontWeight: 700` `fontSize: 18` — this is a **placeholder glyph**, not the real 4-color Google "G" logomark
- Label: `"Google ile Giriş Yap"`, `fill: "#1A1A1A"` **hardcoded near-black**, `fontFamily: font-body` `fontWeight: 600` `fontSize: 15`
- **GOTCHA (flag, don't silently fix)**: Google's actual brand guidelines for "Sign in with Google" buttons require the official multi-color "G" logo asset, not a solid-color letter. Implement exactly per the Pencil spec now (text "G" in `#4285F4`) for pixel-parity with the design; note in the report that swapping in the real Google "G" SVG asset is a follow-up if this ships to production (out of scope for Phase 2 — the design itself hasn't been corrected).
- **Props**: `onPress: () => void`, `label?: string` (default `"Google ile Giriş Yap"`) — all colors are fixed/hardcoded per the two bullets above, **not** theme-bound

### 6. Input Field (`M8G1d7`)
- Frame width 240 (sample only — should be `fill_container`/flexible), `cornerRadius: radius-sm`, `fill: bg-surface-alt`, `gap: gap-xs` (6), `padding: [12, 14]`
- Leading icon `"search"` 16×16 `fill: text-tertiary` (optional — only shown when an icon prop is passed), placeholder text `"Ara..."` `fill: text-tertiary` `fontFamily: font-body` `fontWeight: normal` → `theme.fonts.body.regular`, `fontSize: 14`, `textGrowth: fixed-width` + `fill_container` → RN: wrap a `TextInput` with `flex: 1`
- **Design only shows the empty/placeholder state.** No focus/error state exists in the .pen file — extend using established token roles: focus → `borderColor: accent-teal` (add `strokeWidth`-equivalent 1px border, none in default state), error → `borderColor: warning-red`. Document this as an assumption in the report.
- **Props**: `value: string`, `onChangeText: (text: string) => void`, `placeholder?: string` (default `"Ara..."`), `icon?: string`, `editable?: boolean`, `error?: boolean`

### 7. Amount Display (`rGjD1`)
- Frame, no fixed width/height (`fit_content`), `padding: [8, 0]`, center
- Text `"₺1.250"` `fill: text-primary`, `fontFamily: font-heading` `fontWeight: 700` → `theme.fonts.heading.bold`, `fontSize: 40`
- **Props**: `amount: string` (pre-formatted, e.g. `"₺1.250"` — formatting/currency logic is a Phase 5+ domain concern, not this atom's job), `tone?: 'neutral' | 'income' | 'expense'` (default `'neutral'` → `text-primary`; `'income'` → `income-green`; `'expense'` → `expense-coral`) — inferred prop since the sample only shows neutral, but Ana Sayfa's Net Durum Card will need signed variants

### 8. Badge / Amount (`DMPQJ`)
- Frame `fit_content`, `cornerRadius: radius-full`, `fill: expense-coral-dim`, `padding: [4, 10]`, `gap: 4`
- Icon `"arrow-down"` 10×10 `fill: expense-coral`, text `"-₺284,50"` `fill: expense-coral` `fontFamily: font-body` `fontWeight: 700` `fontSize: 12`
- **GOTCHA**: this is the *expense* variant, using the existing `expenseCoralDim` token. An *income* variant (`"arrow-up"` + `income-green`) is clearly needed (transactions can be positive) but **`ColorTokens` has no `incomeGreenDim` token** (confirmed — not in `src/theme/tokens.ts` or the CLAUDE.md token list). Per the same alpha-suffix precedent documented under Category Icon, compute the income-variant background at render time as `` `${theme.colors.incomeGreen}26` `` rather than adding a new design token (avoids touching the already-shipped Phase 1 token file for a single derived value).
- **Props**: `amount: string` (pre-formatted, e.g. `"-₺284,50"`), `direction: 'up' | 'down'` (drives icon + color: `'down'` → `expense-coral`/`expenseCoralDim`, `'up'` → `income-green`/computed alpha)

### 9. Progress Bar (`Bw742`)
- Track: frame 200×8 (width is sample-only — must be `fill_container`/flexible in RN, e.g. `width: '100%'`), `clip: true`, `cornerRadius: radius-full`, `fill: bg-surface-alt`
- Fill: absolutely-positioned rectangle, sample width 140/200 = 70%, height 8, `cornerRadius: radius-full`, `fill: accent-teal`
- Pencil has no percentage-width support (hence the absolute-position rect in the source); **RN does support percentage strings**, so implement fill width as `` `${clamp(value, 0, 100)}%` `` directly — simpler than the .pen workaround.
- **Props**: `value: number` (0-100, clamped), `color?: ColorTokens key` (default `accentTeal` — Budget Card's over-limit variant will override to `warningRed` in Phase 4, don't hardcode)

### 10. Avatar (`OUB41`)
- Frame 52×52, `clip: true`, `cornerRadius: radius-full`, `fill: bg-surface-alt`, center
- Fallback icon `"user"` 22×22 `fill: text-secondary` (22/52 ≈ 0.42 ratio — scale icon proportionally if `size` ever changes)
- No image-fill instance sampled in the Design System frame, but `expo-image` is already a project dependency (Phase 0) — support an image source with icon fallback.
- **Props**: `size?: number` (default 52), `imageUri?: string` (renders `expo-image`'s `<Image>` when present), falls back to the `"user"` icon when absent

---

## Font-Weight Mapping (critical, repo-wide GOTCHA)

React Native does **not** combine a custom `fontFamily` with a numeric `fontWeight` style — each weight is a separate loaded font family (see `src/app/_layout.tsx`'s `useFonts` call: `Geist_400Regular`, `Geist_600SemiBold`, `Geist_700Bold`, `Inter_400Regular`, `Inter_500Medium`, `Inter_600SemiBold`). Every atom must resolve `fontFamily` to the exact loaded constant via `theme.fonts.{heading|body}.{regular|medium|semibold|bold}` — **never** set a `fontWeight` style property alongside these custom fonts, it will be silently ignored or double-applied depending on platform.

| `.pen` spec | `theme.fonts` key |
|---|---|
| `font-heading` + `fontWeight: 700` | `theme.fonts.heading.bold` |
| `font-heading` + `fontWeight: 600` | `theme.fonts.heading.semibold` |
| `font-body` + `fontWeight: 700` or `600` | `theme.fonts.body.semibold` (no body-bold loaded — 700 in the .pen source for body text, e.g. Transaction Row's amount, actually uses `font-heading`; verify per-component, don't assume) |
| `font-body` + `fontWeight: 600` | `theme.fonts.body.semibold` |
| `font-body` + `fontWeight: 500` | `theme.fonts.body.medium` |
| `font-body` + `fontWeight: normal`/400 | `theme.fonts.body.regular` |

---

## Patterns to Mirror

### THEME_CONSUMPTION
```ts
// SOURCE: src/theme/ThemeProvider.tsx:73-80
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx)
    throw new Error(
      'useTheme must be used within a ThemeProvider — check your component tree.',
    );
  return ctx;
}
```
Every atom calls `const theme = useTheme()` — no prop-drilled theme, no separate context per atom.

### BARREL_EXPORT
```ts
// SOURCE: src/theme/index.ts:1-2
export * from './tokens';
export * from './ThemeProvider';
```
Mirror exactly for `src/atoms/index.ts`, one `export * from './ComponentName'` per atom (named exports, not default — deviates from the single existing screen file which uses `export default` because expo-router requires default exports for route files; components are not routes, use named exports).

### STYLE_STRUCTURE (new pattern — first themed component in the repo)
```ts
// SOURCE: src/app/(tabs)/index.tsx:11-17 (static-only precedent)
const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
```
No existing file mixes `StyleSheet.create` with runtime theme values. Establish the convention here: static/structural properties (`flexDirection`, `padding` numbers that don't vary, `borderRadius` shape) in a `StyleSheet.create` object; theme-dependent values (colors, font family) passed inline via `style={[styles.base, { backgroundColor: theme.colors.accentTeal }]}`. Do not wrap every atom's inline style in `useMemo` — RN's `style` prop accepts arrays cheaply and these are simple presentational leaves; add `useMemo` only if profiling later shows a need (YAGNI).

### NAMING_CONVENTION
PascalCase component name = PascalCase filename (`ButtonPrimary.tsx` exports `ButtonPrimary`), matching `ThemeProvider.tsx` → `ThemeProvider`. Props interface named `{Component}Props` (e.g. `ButtonPrimaryProps`), colocated in the same file (no separate types file — matches `ThemeContextValue` colocated in `ThemeProvider.tsx`).

### ERROR_HANDLING
No error handling needed in atoms themselves (pure presentational, no I/O). The only repo precedent (`ThemeProvider.tsx:75-78`) is a fail-fast invariant check, not defensive/silent fallback — follow that spirit: `getIcon()` in the new icon helper should throw on an unknown icon name (fail loud in dev) rather than rendering nothing.

---

## Files to Change

| File | Action | Justification |
|---|---|---|
| `package.json` | UPDATE | Add `lucide-react-native` + `react-native-svg` (peer dep) — no icon library exists yet, 6 of 10 atoms render an icon |
| `src/lib/icons.ts` | CREATE | Kebab-case (.pen) → PascalCase (lucide) icon name resolver, shared by all icon-rendering atoms |
| `src/lib/color.ts` | CREATE | `withAlpha(hex: string, alphaHex: string): string` helper for the two computed-alpha backgrounds (Category Icon, Badge/Amount income variant) |
| `src/atoms/CategoryIcon.tsx` | CREATE | Atom 1 |
| `src/atoms/ButtonPrimary.tsx` | CREATE | Atom 2 |
| `src/atoms/ButtonSecondary.tsx` | CREATE | Atom 3 |
| `src/atoms/ButtonIconOnly.tsx` | CREATE | Atom 4 |
| `src/atoms/ButtonGoogleCTA.tsx` | CREATE | Atom 5 |
| `src/atoms/InputField.tsx` | CREATE | Atom 6 |
| `src/atoms/AmountDisplay.tsx` | CREATE | Atom 7 |
| `src/atoms/BadgeAmount.tsx` | CREATE | Atom 8 |
| `src/atoms/ProgressBar.tsx` | CREATE | Atom 9 |
| `src/atoms/Avatar.tsx` | CREATE | Atom 10 |
| `src/atoms/index.ts` | CREATE | Barrel export (replaces need for `.gitkeep`, which can stay — harmless) |
| `.claude/phases.md` | UPDATE (post-implementation) | Check off Phase 2's single checklist item once all atoms are verified |

## NOT Building
- Molecules/organisms that compose these atoms (Phase 3/4)
- Any screen wiring or navigation (Phase 6+)
- Real formatting/currency logic for `Amount Display` / `Badge / Amount` — they take pre-formatted strings
- The real multi-color Google "G" logo asset (flagged as a known gap, not fixed here)
- A dedicated `incomeGreenDim` design token (using computed alpha instead — see Badge/Amount)
- Any test runner setup (none exists; not in Phase 2 scope per `phases.md`)
- Input Field's focus/error visual states beyond the token-role assumption documented above (no dedicated screens consume it yet to validate against)

---

## Step-by-Step Tasks

### Task 1: Add icon + SVG dependencies
- **ACTION**: Add `lucide-react-native` and `react-native-svg` to `package.json` dependencies, run install
- **IMPLEMENT**: `npx expo install lucide-react-native react-native-svg` (use `expo install`, not raw `npm install`, so Expo pins the SDK-57-compatible `react-native-svg` version)
- **VALIDATE**: `cat package.json` shows both deps; `npx expo-doctor` or `npm run typecheck` doesn't error on missing native module types

### Task 2: Icon name resolver
- **ACTION**: Create `src/lib/icons.ts`
- **IMPLEMENT**:
```ts
import { icons, type LucideIcon } from 'lucide-react-native';

function kebabToPascal(name: string): string {
  return name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

export function getIcon(name: string): LucideIcon {
  const icon = icons[kebabToPascal(name) as keyof typeof icons];
  if (!icon) throw new Error(`Unknown icon "${name}" — check the lucide icon name.`);
  return icon;
}
```
- **MIRROR**: ERROR_HANDLING pattern (fail-fast throw, matches `ThemeProvider.tsx`'s `useTheme()`)
- **GOTCHA**: lucide names with numbers (e.g. `gamepad-2`, used by Budget Card's over-limit variant, out of Phase 2 scope but same icon set) must map to `Gamepad2` — verify `kebabToPascal` handles `"gamepad-2"` → `"Gamepad2"` correctly (it does: `.split('-')` → `["gamepad","2"]` → capitalize first part only, second part `"2"` is unchanged since `.charAt(0).toUpperCase()` on `"2"` is still `"2"`)
- **VALIDATE**: `npm run typecheck`

### Task 3: Color alpha helper
- **ACTION**: Create `src/lib/color.ts`
- **IMPLEMENT**:
```ts
export function withAlpha(hex: string, alphaHex: string): string {
  return `${hex}${alphaHex}`;
}
```
- **GOTCHA**: only valid for 6-digit `#RRGGBB` hex inputs (all `ColorTokens` values are 6-digit — confirmed in `tokens.ts`); do not call with 8-digit input
- **VALIDATE**: `npm run typecheck`

### Task 4: Category Icon
- **ACTION**: Create `src/atoms/CategoryIcon.tsx`
- **IMPLEMENT**: 44×44 `View` with `borderRadius: RADIUS.full`, `backgroundColor: withAlpha(theme.colors[tint], '26')`, centered lucide icon (20×20, `color: theme.colors[tint]`) resolved via `getIcon(icon)`
- **IMPORTS**: `useTheme` from `@/theme`, `getIcon` from `@/lib/icons`, `withAlpha` from `@/lib/color`
- **GOTCHA**: `tint` prop must be typed as `keyof ColorTokens`, default `'accentTeal'`, so `theme.colors[tint]` type-checks
- **VALIDATE**: `npm run typecheck`; visually diff against `get_screenshot(nodeId: "W7Y8it")` and its Budget-Card-override sibling for the alpha-blend look

### Task 5: Button / Primary
- **ACTION**: Create `src/atoms/ButtonPrimary.tsx`
- **IMPLEMENT**: `Pressable` (52px height, `borderRadius: RADIUS.sm`, `backgroundColor: theme.colors.accentTeal`, `opacity: disabled ? 0.5 : 1`), row layout with `gap: SPACING.xs + 2` (8 — no exact token; SPACING.xs is 6, this component's gap is literally 8 per the .pen source, use the raw number since no scale value matches, and note it rather than force-fit a token), optional leading icon (`getIcon`, 18×18, `theme.colors.bgApp`) shown only when `icon` prop passed, label `Text` with `fontFamily: theme.fonts.heading.bold`, `fontSize: 16`, `color: theme.colors.bgApp`
- **MIRROR**: FONT_FAMILIES mapping table above
- **GOTCHA**: gap value `8` doesn't map cleanly to the `SPACING` scale (`xs=6`, `sm=10`) — use the literal `8`, don't force it onto `SPACING.xs` or `SPACING.sm` (would visibly drift from the design)
- **VALIDATE**: `npm run typecheck`; screenshot diff vs `get_screenshot(nodeId: "NirZj")`

### Task 6: Button / Secondary
- **ACTION**: Create `src/atoms/ButtonSecondary.tsx`
- **IMPLEMENT**: Same shape as Primary but `backgroundColor: 'transparent'`, `borderWidth: 1`, `borderColor: theme.colors.borderSubtle`, text/icon color from `tone` prop (`'neutral'` → `theme.colors.textPrimary`, `'destructive'` → `theme.colors.expenseCoral`), `fontFamily: theme.fonts.body.semibold`, `fontSize: 14`
- **GOTCHA**: don't reuse `ButtonPrimary`'s internal layout via prop-forwarding hacks — these are two separate reusable components in the design system (`NirZj` and `iKwDe` are sibling components, not variants of one ref), keep them as separate files even though the JSX skeleton is similar
- **VALIDATE**: `npm run typecheck`; screenshot diff vs `get_screenshot(nodeId: "iKwDe")` with `tone="destructive"` (the sampled instance)

### Task 7: Button / Icon Only
- **ACTION**: Create `src/atoms/ButtonIconOnly.tsx`
- **IMPLEMENT**: 40×40 `Pressable`, `borderRadius: RADIUS.full`, `backgroundColor: theme.colors.accentTeal`, centered icon 20×20 `color: theme.colors.bgApp`, `hitSlop={{ top: 4, right: 4, bottom: 4, left: 4 }}`
- **GOTCHA**: `accessibilityLabel` is a required prop (not optional) — icon-only buttons need it for screen readers, enforce at the TypeScript level
- **VALIDATE**: `npm run typecheck`; screenshot diff vs `get_screenshot(nodeId: "F6BF6")`

### Task 8: Button / Google CTA
- **ACTION**: Create `src/atoms/ButtonGoogleCTA.tsx`
- **IMPLEMENT**: `Pressable`, `borderRadius: RADIUS.full`, `backgroundColor: '#FFFFFF'` (hardcoded, not `theme.colors.*`), `padding: [14, 20]` → RN `paddingVertical: 14, paddingHorizontal: 20`, `gap: 10`, children: `Text` "G" (`color: '#4285F4'`, `fontFamily: theme.fonts.heading.bold`, `fontSize: 18`) + `Text` label (`color: '#1A1A1A'`, `fontFamily: theme.fonts.body.semibold`, `fontSize: 15`)
- **GOTCHA**: this is the one atom where theme is *not* consulted for colors (still call `useTheme()` for `theme.fonts.*` font family constants, but never for `theme.colors.*`) — don't "fix" this into theme-bound colors, it's intentionally brand-locked
- **VALIDATE**: `npm run typecheck`; screenshot diff vs `get_screenshot(nodeId: "GLXOa")`; confirm it looks identical in all 4 themes (it should — nothing in it should change)

### Task 9: Input Field
- **ACTION**: Create `src/atoms/InputField.tsx`
- **IMPLEMENT**: `View` row (`borderRadius: RADIUS.sm`, `backgroundColor: theme.colors.bgSurfaceAlt`, `gap: SPACING.xs`, `padding: [12, 14]` → `paddingVertical: 12, paddingHorizontal: 14`, plus a 1px border that's transparent by default, `theme.colors.accentTeal` on focus (`onFocus`/`onBlur` local state), `theme.colors.warningRed` when `error` true), optional leading icon 16×16 `theme.colors.textTertiary`, `TextInput` with `flex: 1`, `placeholderTextColor: theme.colors.textTertiary`, `fontFamily: theme.fonts.body.regular`, `fontSize: 14`, `color: theme.colors.textPrimary` (typed text color — not specified in the static .pen sample since it only shows placeholder state, use `textPrimary` as the sensible default for real input text)
- **GOTCHA**: focus/error border states are an inferred extension beyond the .pen sample — call this out explicitly in the implementation report, don't present it as "verified against Pencil screenshot" since no such state exists to screenshot
- **VALIDATE**: `npm run typecheck`; screenshot diff of the default/placeholder state vs `get_screenshot(nodeId: "M8G1d7")`

### Task 10: Amount Display
- **ACTION**: Create `src/atoms/AmountDisplay.tsx`
- **IMPLEMENT**: `View` with `paddingVertical: 8`, centered `Text` `fontFamily: theme.fonts.heading.bold`, `fontSize: 40`, `color` from `tone` prop (`'neutral'` → `textPrimary`, `'income'` → `incomeGreen`, `'expense'` → `expenseCoral`)
- **VALIDATE**: `npm run typecheck`; screenshot diff vs `get_screenshot(nodeId: "rGjD1")` with `tone="neutral"` (the only sampled state)

### Task 11: Badge / Amount
- **ACTION**: Create `src/atoms/BadgeAmount.tsx`
- **IMPLEMENT**: `View` row, `borderRadius: RADIUS.full`, `padding: [4, 10]` → `paddingVertical: 4, paddingHorizontal: 10`, `gap: 4`; `direction === 'down'` → `backgroundColor: theme.colors.expenseCoralDim`, icon `arrow-down`, text/icon `color: theme.colors.expenseCoral`; `direction === 'up'` → `backgroundColor: withAlpha(theme.colors.incomeGreen, '26')`, icon `arrow-up`, text/icon `color: theme.colors.incomeGreen`; icon 10×10, text `fontFamily: theme.fonts.body.semibold` (700 requested by spec but no body-bold loaded — see Font-Weight Mapping table, use `semibold` as the closest loaded weight and note the 1-step downgrade), `fontSize: 12`
- **GOTCHA**: this is the second computed-alpha usage — reuse `withAlpha` from Task 3, don't duplicate the string-concat logic inline
- **VALIDATE**: `npm run typecheck`; screenshot diff vs `get_screenshot(nodeId: "DMPQJ")` for `direction="down"` (the sampled state); manually eyeball `direction="up"` across all 4 themes since there's no source screenshot for it

### Task 12: Progress Bar
- **ACTION**: Create `src/atoms/ProgressBar.tsx`
- **IMPLEMENT**: Outer `View` (`height: 8`, `borderRadius: RADIUS.full`, `overflow: 'hidden'`, `backgroundColor: theme.colors.bgSurfaceAlt`, `width: '100%'`), inner `View` (`height: 8`, `borderRadius: RADIUS.full`, `backgroundColor: theme.colors[color]`, `width: `${Math.min(100, Math.max(0, value))}%``)
- **GOTCHA**: clamp `value` to `[0, 100]` — the .pen sample (140/200 = 70%) doesn't demonstrate over-100 behavior, but Budget Card's over-limit variant (Phase 4) will need values >100% visually capped at a full/red bar, so clamp now to avoid `NaN%`/negative-width crashes later
- **VALIDATE**: `npm run typecheck`; screenshot diff vs `get_screenshot(nodeId: "Bw742")` at `value={70}`

### Task 13: Avatar
- **ACTION**: Create `src/atoms/Avatar.tsx`
- **IMPLEMENT**: `View` (`width/height: size` default 52, `borderRadius: size / 2`, `overflow: 'hidden'`, `backgroundColor: theme.colors.bgSurfaceAlt`, centered); if `imageUri` present render `expo-image`'s `<Image source={{ uri: imageUri }} style={{ width: size, height: size }} contentFit="cover" />`, else render `"user"` icon sized `Math.round(size * 0.42)` (matches the 22/52 sampled ratio), `color: theme.colors.textSecondary`
- **IMPORTS**: `Image` from `expo-image` (already a project dependency, confirm in `package.json` — yes, `expo-image: ~57.0.1`)
- **VALIDATE**: `npm run typecheck`; screenshot diff vs `get_screenshot(nodeId: "OUB41")` (fallback-icon state, size 52)

### Task 14: Barrel export
- **ACTION**: Create `src/atoms/index.ts`
- **IMPLEMENT**:
```ts
export * from './Avatar';
export * from './BadgeAmount';
export * from './ButtonGoogleCTA';
export * from './ButtonIconOnly';
export * from './ButtonPrimary';
export * from './ButtonSecondary';
export * from './CategoryIcon';
export * from './InputField';
export * from './ProgressBar';
export * from './AmountDisplay';
```
- **MIRROR**: BARREL_EXPORT pattern from `src/theme/index.ts`
- **VALIDATE**: `npm run typecheck`; `import { ButtonPrimary, Avatar } from '@/atoms'` resolves with no error from a scratch test file (delete the scratch file after confirming)

---

## Testing Strategy

No test runner is configured in this repo yet (`package.json` devDependencies has no `jest`/`@testing-library/react-native`) — setting one up is out of scope for Phase 2 per `phases.md` (which specifies visual/Pencil verification, not unit tests, for this phase). Validation is:

1. `npm run typecheck` — zero errors
2. `npm run lint` — zero errors
3. Per-atom `get_screenshot` diff against the corresponding `.pen` node ID (table above) for the default/sampled state
4. Manual cross-theme check: temporarily render each atom in a scratch screen (e.g. `src/app/(tabs)/index.tsx`) and cycle `setMode('dark' | 'light' | 'vibrant' | 'vibrant-dark')` via the existing `useTheme()` hook, confirm no atom hardcodes a color that should be theme-bound (except the two documented Google-brand exceptions) — revert the scratch screen changes afterward, don't ship them

### Edge Cases Checklist
- [ ] Empty/undefined `icon` prop where optional (Button/Primary, Input Field) — icon area collapses, no crash
- [ ] `ProgressBar` `value` below 0 or above 100 — clamps, doesn't crash or render negative width
- [ ] `Avatar` with no `imageUri` — renders fallback icon, not a broken image
- [ ] `ButtonIconOnly` without `accessibilityLabel` — TypeScript error at compile time (required prop), not a runtime a11y gap
- [ ] All 4 theme modes for every atom except `ButtonGoogleCTA` (intentionally static)

---

## Validation Commands

### Static Analysis
```bash
npm run typecheck
npm run lint
```
EXPECT: Zero type errors, zero lint errors

### Manual Validation
```bash
npm run web
```
- [ ] Render each atom in a scratch screen, confirm no console warnings (missing font, unknown icon, etc.)
- [ ] Cycle all 4 theme modes, confirm token-bound colors update and the 2 Google-CTA hardcoded colors don't
- [ ] `get_screenshot` diff each atom against its `.pen` node ID (table below) — no broken/collapsed/clipped layout

| Atom | Node ID |
|---|---|
| Category Icon | `W7Y8it` |
| Button / Primary | `NirZj` |
| Button / Secondary | `iKwDe` |
| Button / Icon Only | `F6BF6` |
| Button / Google CTA | `GLXOa` |
| Input Field | `M8G1d7` |
| Amount Display | `rGjD1` |
| Badge / Amount | `DMPQJ` |
| Progress Bar | `Bw742` |
| Avatar | `OUB41` |

---

## Acceptance Criteria
- [ ] All 14 files created/updated as listed
- [ ] All validation commands pass
- [ ] No type errors, no lint errors
- [ ] Every atom matches its Pencil screenshot in its sampled state
- [ ] All theme-bound atoms render correctly in all 4 modes; the 2 Google-CTA hardcoded values do not change across modes
- [ ] `.claude/phases.md` Phase 2 checkbox checked off, with a report file added under `.claude/PRPs/reports/` (matches the convention from Phase 0/1)

## Completion Checklist
- [ ] Code follows discovered patterns (THEME_CONSUMPTION, BARREL_EXPORT, NAMING_CONVENTION)
- [ ] No hardcoded colors except the 2 documented Google-brand exceptions
- [ ] Font family resolved via `theme.fonts.*`, never via a bare `fontWeight` style
- [ ] No unnecessary scope additions (no molecules, no screens, no test infra)
- [ ] Self-contained — no questions needed during implementation

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `lucide-react-native` version incompatible with Expo SDK 57 / React 19.2 / RN 0.86 | Low | Medium | Use `npx expo install` (not raw npm) so Expo resolves a compatible version; if it fails, fall back to `@expo/vector-icons` (already transitively available via Expo) and re-map icon names manually |
| Font-weight mapping table (Task-level GOTCHA) misapplied, causing visually-unbolded text on Android | Medium | Low | Explicit per-atom `theme.fonts.*` reference in every task's IMPLEMENT line — no atom should ever set a numeric `fontWeight` |
| Input Field focus/error states (inferred, not in source design) look wrong once Phase 6+ screens actually use them | Medium | Low | Documented as an explicit assumption in this plan and the eventual report; easy to adjust later since it's isolated to one component |

## Notes
- Two atoms (`Category Icon`, `Badge / Amount` income variant) use a computed hex-alpha-suffix technique (`withAlpha`) rather than a dedicated design token, because the design itself uses this exact technique elsewhere (Budget Card's over-limit variant: `warningRed` + `26` suffix) for cases with no dedicated `-dim` token — this is precedent-following, not a new invention.
- Confidence for single-pass implementation is high: every atom's exact property values were pulled live from `design/design.pen` via `batch_get`/`get_screenshot`, not inferred from written docs.

---

## Next Steps
Run `/prp-implement .claude/PRPs/plans/atoms-phase-2.plan.md` to execute this plan.
