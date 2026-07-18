# Plan: Phase 4 — Organisms

## Summary
Build the 10 organism components (`src/organisms/`) composed strictly from Phase 2 atoms and Phase 3 molecules: 4 nav/list organisms (Bottom Navigation Bar, Transaction List Card, App Bar/Simple Title, App Bar/Back+Title) and 6 card organisms (Budget Card incl. over-limit variant, Net Durum Card, Goal Card, Recurring Payment Card, Income Source Card). One atom (`ButtonIconOnly`) needs a small non-breaking extension; one new shared helper (`src/lib/shadow.ts`) is needed for the two components that carry a drop shadow.

## User Story
As the FollowFlow codebase (next consumer: Phase 6/7 screens), I want a complete, theme-correct organism layer, so that screens can be assembled from organisms without re-deriving layout/color logic.

## Problem → Solution
`src/organisms/` is empty (only `.gitkeep`) → 10 fully typed, theme-aware components exist, barrel-exported, matching `design/design.pen` pixel-for-pixel (color/type/spacing), built with zero raw-styling duplication.

## Metadata
- **Complexity**: Medium
- **Source PRD**: `.claude/phases.md` (Phase 4 section)
- **PRD Phase**: Phase 4 — Organisms
- **Estimated Files**: 13 (10 new organisms + 1 barrel + 1 new lib helper + 1 atom edit) + phases.md checkbox

---

## UX Design
N/A — internal component layer, no screens wired yet (screens are Phase 6/7). Validation is visual-diff against Pencil, not user-facing interaction.

---

## Mandatory Reading

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 | `src/molecules/TransactionRow.tsx` | 1-78 | Canonical "row" composition pattern: atom reuse (`CategoryIcon`) + inline `Text` styling via `theme.fonts`/`theme.colors`, tone-driven color switch |
| P0 | `src/molecules/InfoRowChevron.tsx` | 1-78 | Pattern for `justifyContent:'space_between'` row, ad-hoc icon via `createElement(getIcon(...))`, card-like surface row |
| P0 | `src/atoms/CategoryIcon.tsx` | 1-41 | Reused as-is for every card's leading icon; `tint` prop is `keyof ColorTokens`, already produces alpha-tinted bg via `withAlpha` |
| P0 | `src/atoms/ProgressBar.tsx` | 1-51 | Reused as-is for Budget Card / Goal Card; `value` clamps 0-100, `color` is `keyof ColorTokens` |
| P0 | `src/atoms/ButtonIconOnly.tsx` | 1-56 | Reused for App Bar back button; needs extension (Task 1) |
| P1 | `src/lib/icons.ts` | 1-26 | `getIcon(name)` kebab→Pascal lucide lookup; throws on unknown icon — all icon name strings below are verified against this |
| P1 | `src/lib/color.ts` | 1-4 | `withAlpha(hex, alphaHex)` — reuse for Bottom Nav Bar translucent bg, do not hand-roll `rgba`/hex concat elsewhere |
| P1 | `src/theme/tokens.ts` | 10-92 | `ColorTokens` interface + exact per-theme hex values — confirms `warningRed`, `bgSurfaceAlt`, `accentTealDim`, etc. already cover every color this phase needs (no new tokens required) |
| P1 | `src/theme/ThemeProvider.tsx` | 78-86 | `useTheme()` hook contract every component calls |
| P2 | `src/molecules/NavItem.tsx` | 1-49 | Reused as-is for Bottom Navigation Bar; already handles active/inactive color + pill bg internally — organism must NOT re-derive these colors |
| P2 | `src/molecules/index.ts` | 1-13 | Barrel pattern: `export * from './X'`, alphabetical |
| P2 | `.claude/PRPs/reports/phase-3-molecules-report.md` | 1-82 | Precedent: Phase 3 non-breakingly extended `ButtonIconOnly` (variant/size) rather than hand-rolling a new Pressable — same justification applies to Task 1 here |

## External Documentation
No external research needed — feature uses established internal patterns (React Native `View`/`Text`/`Pressable`, existing theme system, existing shadow-free RN styling conventions). One new concern (cross-platform drop shadow) is solved with standard RN `shadowColor/shadowOffset/shadowOpacity/shadowRadius` + `elevation` — well-understood RN primitive, not worth a research phase.

---

## Design Source (from `design/design.pen` via Pencil MCP — do NOT re-read the `.pen` file, this is the full extract)

All 10 organisms are reusable components in the file's `Design System` frame. Node IDs (for reference only, not needed in code):

| Organism | Node ID | Notes |
|---|---|---|
| Bottom Navigation Bar | `DPYuB` | pill container of 5 `Nav Item` refs |
| Transaction List Card | `i7blfW` | date header + list of `Transaction Row` refs |
| App Bar / Simple Title | `HsvPz` | centered title only |
| App Bar / Back + Title | `ZFTqj` | `Button/Icon Only` (surface) + title |
| Budget Card | `K1a3Sz` | + over-limit instance override (`bUTA6`, not a separate component) |
| Net Durum Card | `Eby9s` | amount + income/expense stat columns |
| Goal Card | `Lkuly` | progress + ETA footer |
| Recurring Payment Card | `yUiyg` | icon + amount (always expense-colored) |
| Income Source Card | `O21CJN` | no icon, amount (always accent-colored) |

**GOTCHA (applies to ALL 10)**: every component instance in the `.pen` file has a literal pixel `width` (320/380/269/255/350) because Pencil requires numeric sizes for a fixed 390px mockup frame. **Do not port these as hardcoded `width` in the RN components.** No existing atom or molecule sets a fixed pixel width (verified across all 22 Phase 2/3 files) — every one lets the parent/flex context size it. Match that: no organism sets `width` in its root style. Screens (Phase 6/7) will control width via screen padding.

### Bottom Navigation Bar (`DPYuB`)
```
frame: alignItems:center, gap:10, padding:[6,10] (paddingVertical 6, paddingHorizontal 10),
       cornerRadius:999 (radius.full), fill:"#1A2226E6" (bgSurface + alpha E6),
       stroke:"#2A363B" (borderSubtle) strokeWidth:1,
       effect: shadow{offset:{x:0,y:8}, blur:24, color:"#00000066", shadowType:"outer"}
children: 5x ref(NavItem) — active item gets fill override (handled internally by NavItem via `active` prop, no manual color needed)
```

### Transaction List Card (`i7blfW`)
```
frame: layout:"vertical", gap:10, width:"fill_container" (NO fill/padding/cornerRadius/stroke — it is a bare grouping frame, not a bordered card)
children:
  - text "Date Header": fontFamily Inter, fontSize 13, fontWeight 600, fill textSecondary ("Bugün")
  - frame "Rows" (layout vertical, NO gap — TransactionRow's own paddingVertical:10 provides the spacing):
      - ref(TransactionRow) per transaction, width:"fill_container"
```

### App Bar / Simple Title (`HsvPz`)
```
frame: alignItems:"center"
children: text "Title": fontFamily Geist, fontSize 22, fontWeight 700, fill textPrimary
```

### App Bar / Back + Title (`ZFTqj`)
```
frame: alignItems:"center", gap:12
children:
  - ref(Button/Icon Only): fill override bgSurfaceAlt ("#212B30"), height/width override 36, icon "arrow-left", icon fill override textPrimary ("#F2F5F4")
  - text "Title": fontFamily Geist, fontSize 16, fontWeight 700, fill textPrimary
```
**Conflict**: `ButtonIconOnly`'s `variant="surface"` currently hardcodes icon color to `textSecondary`, but this design instance wants `textPrimary`. Resolved by Task 1 (add optional `iconColor` override prop, non-breaking).

### Budget Card (`K1a3Sz`) + over-limit variant (`bUTA6`)
```
frame: layout:"vertical", gap:10, padding:16, cornerRadius:16, fill:bgSurface,
       stroke:borderSubtle strokeWidth:1
children:
  - frame "Header" (justifyContent:"space_between", width:"fill_container"):
      - frame "Left" (gap:10, alignItems:"center"): ref(CategoryIcon) + text "Category Name" (Geist 14/600, textPrimary)
      - text "Percent" (Inter 13/600, textTertiary normally — "%73")
  - ref(ProgressBar), width:"fill_container", color accentTeal normally
  - text "Footer" (Inter 12/500, accentTeal normally — e.g. "Kalan ₺650")

Over-limit instance override (bUTA6) changes, ALL simultaneously:
  - card stroke → warningRed, strokeWidth 1.5
  - CategoryIcon tint → warningRed (bg auto-recomputes via existing withAlpha logic — no extra code needed)
  - Percent text color → warningRed (content e.g. "%108", can exceed 100 — ProgressBar already clamps display to 100%)
  - ProgressBar color → warningRed
  - Footer text color → warningRed (content e.g. "₺180 limiti aşıldı")
```
→ implement as single boolean prop `overLimit?: boolean` that switches all 4 colors together (mirrors `TransactionRow`'s `tone` pattern) — not 4 separate color props.

### Net Durum Card (`Eby9s`)
```
frame: layout:"vertical", gap:12, padding:20, cornerRadius:22, fill:bgSurface,
       effect: shadow{offset:{x:0,y:8}, blur:20, color:"#00000030", shadowType:"outer"} (NO stroke)
children:
  - text "Label": Inter 12/600, letterSpacing:0.5, textSecondary ("BU AY NET DURUM")
  - text "Amount": Geist 38/700, accentTeal ("₺12.480,00")
  - frame "Stats" (gap:28):
      - frame "Gelir Col" (layout vertical, gap:4):
          - frame "Gelir Label" (gap:4, alignItems:center): icon arrow-up size12 incomeGreen + text "Gelir" (Inter 12/500 textSecondary)
          - text "Value": Geist 16/700, incomeGreen
      - rectangle "Divider": width:1, height:32, fill borderSubtle
      - frame "Gider Col": mirrors Gelir Col with icon arrow-down / expenseCoral, label "Gider"
```
**NOT building**: a negative/over-budget color variant for the main Amount text. The `.pen` file defines only the positive case (no red/negative instance exists, unlike Budget Card which has an explicit `bUTA6` override). Inventing a `tone` prop here would be un-sourced — Amount is always rendered `accentTeal` per the literal design. Flagged as a Risk below for the screen layer to revisit later if product wants it.

### Goal Card (`Lkuly`)
```
frame: layout:"vertical", gap:12, padding:16, cornerRadius:16, fill:bgSurface (NO stroke, NO shadow)
children:
  - frame "Row" (gap:12, width:"fill_container"):
      - ref(CategoryIcon) (e.g. tint accentTeal, icon "plane")
      - frame "Info" (layout vertical, gap:2, width:"fill_container"):
          - text "Name": Inter 15/600, textPrimary ("Tatilim")
          - text "Target Label": Inter 12/normal, textSecondary ("Hedef: ₺60.000")
      - frame "Percent" (layout vertical, alignItems:"end"):
          - text "Value": Geist 16/700, accentTeal ("57%")
          - text "Label": Inter 11/normal, textTertiary ("tamamlandı")
  - ref(ProgressBar), width:"fill_container", color accentTeal
  - frame "Footer" (justifyContent:"space_between", width:"fill_container"):
      - text "Amounts": Inter 12/normal, textSecondary ("₺34.200 / ₺60.000")
      - frame "ETA Wrapper" (gap:4, alignItems:center):
          - text "ETA": Inter 12/normal, textTertiary ("Tahmini: Mart 2027")
          - icon "info" size12 textTertiary (design has a tooltip `metadata` annotation on this icon — NOT building tooltip interactivity, static icon only, see NOT Building)
```

### Recurring Payment Card (`yUiyg`)
```
frame: layout:"vertical", gap:10, padding:16, cornerRadius:16, fill:bgSurface, stroke:borderSubtle strokeWidth:1
children:
  - frame "Row" (gap:12, alignItems:center, width:"fill_container"):
      - ref(CategoryIcon) (icon e.g. "house")
      - frame "Info" (layout vertical, gap:2, width:"fill_container"):
          - text "Name": Inter 14/600, textPrimary ("Kira")
          - text "Amount": Geist 18/700, expenseCoral — ALWAYS expenseCoral, hardcoded (this card only ever models an outgoing payment)
      - frame "Actions" (gap:12, alignItems:center):
          - icon "pencil" size16 textSecondary (Pressable, onEdit)
          - icon "trash" size16 expenseCoral (Pressable, onDelete)
  - frame "Meta Row" (gap:8, alignItems:center, width:"fill_container"):
      - text "Frequency": Inter 12/500, textSecondary ("Aylık")
      - text "Dot": Inter 12/normal, textTertiary ("·")
      - text "Next": Inter 12/normal, textTertiary ("Sıradaki: 1 Ağustos")
```

### Income Source Card (`O21CJN`)
```
frame: layout:"vertical", gap:10, padding:16, cornerRadius:16, fill:bgSurface, stroke:borderSubtle strokeWidth:1
children:
  - frame "Row" (gap:12, alignItems:center, width:"fill_container") — NO CategoryIcon (this card has no leading icon, unlike Recurring Payment Card):
      - frame "Info" (layout vertical, gap:2, width:"fill_container"):
          - text "Name": Inter 14/600, textPrimary ("Maaş")
          - text "Amount": Geist 18/700, accentTeal — ALWAYS accentTeal, hardcoded (NOT incomeGreen — literal design choice, do not "correct" it)
      - frame "Actions": identical to Recurring Payment Card (pencil + trash)
  - frame "Meta Row" (gap:8, alignItems:center, width:"fill_container"):
      - text "Frequency": Inter 12/500, textSecondary ("Aylık")
      - text "Dot": Inter 12/normal, textTertiary ("·")
      - text "Day": Inter 12/normal, textTertiary ("Her ayın 1'i")
```

---

## Patterns to Mirror

### ROW_COMPOSITION (atom reuse + inline Text)
// SOURCE: src/molecules/TransactionRow.tsx:16-66
```tsx
export function TransactionRow({ icon, iconTint = 'accentTeal', title, subtitle, amount, tone = 'neutral' }: TransactionRowProps) {
  const theme = useTheme();
  const amountColor = tone === 'income' ? theme.colors.incomeGreen : tone === 'expense' ? theme.colors.expenseCoral : theme.colors.textPrimary;
  return (
    <View style={styles.container}>
      <CategoryIcon icon={icon} tint={iconTint} />
      <View style={styles.info}>
        <Text style={{ fontFamily: theme.fonts.body.semibold, fontSize: 15, color: theme.colors.textPrimary }}>{title}</Text>
        <Text style={{ fontFamily: theme.fonts.body.regular, fontSize: 12, color: theme.colors.textSecondary }}>{subtitle}</Text>
      </View>
      <Text style={{ fontFamily: theme.fonts.heading.bold, fontSize: 15, color: amountColor }}>{amount}</Text>
    </View>
  );
}
```
Every organism follows this: `useTheme()` once at top, plain `<Text style={{...}}>` for one-off typography (never a shared "Typography" atom — doesn't exist and shouldn't be invented), atoms reused only for icon/progress/button structural pieces.

### TONE_SWITCH (single boolean/enum flips multiple derived colors)
// SOURCE: src/molecules/TransactionRow.tsx:25-30 (tone → amountColor) — apply same shape to `BudgetCard`'s `overLimit` prop, switching border/icon-tint/percent-color/progress-color/footer-color together.

### JUSTIFY_BETWEEN_ROW
// SOURCE: src/molecules/InfoRowChevron.tsx:21-64
```tsx
<Pressable style={[styles.container, { borderRadius: theme.radius.md, backgroundColor: theme.colors.bgSurfaceAlt, paddingVertical: theme.spacing.sm }]}>
  <View style={styles.left}>...</View>
  {createElement(getIcon('chevron-right'), { size: 14, color: theme.colors.textTertiary })}
</Pressable>
// styles.container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, ... }
```
Use for Budget Card's Header row and Goal Card's Footer row.

### AD_HOC_ICON (no atom exists for a bare icon+text pairing)
// SOURCE: src/molecules/NavItem.tsx:35-41
```tsx
{createElement(getIcon(icon), { size: 20, color })}
<Text style={{ fontFamily: theme.fonts.body.semibold, fontSize: 10, color }}>{label}</Text>
```
Use this exact `createElement(getIcon(name), { size, color })` call for: Net Durum Card's up/down arrows, Goal Card's info icon, Recurring/Income cards' pencil+trash action icons.

### ALPHA_COLOR_HELPER
// SOURCE: src/lib/color.ts:1-3
```ts
export function withAlpha(hex: string, alphaHex: string): string {
  return `${hex}${alphaHex}`;
}
```
Use for Bottom Navigation Bar's translucent bg: `withAlpha(theme.colors.bgSurface, 'E6')`. Do not hand-concatenate.

### BARREL_EXPORT
// SOURCE: src/molecules/index.ts:1-12 — `export * from './ComponentName';` one per line, alphabetical by filename.

---

## Files to Change

| File | Action | Justification |
|---|---|---|
| `src/atoms/ButtonIconOnly.tsx` | UPDATE | Add optional `iconColor?: keyof ColorTokens` prop (default preserves current surface/accent behavior) so App Bar/Back+Title can render `textPrimary` icon instead of the hardcoded `textSecondary` |
| `src/lib/shadow.ts` | CREATE | Shared cross-platform shadow style helper — used by 2 organisms, avoids duplicating `shadowColor/shadowOffset/shadowOpacity/shadowRadius/elevation` blocks |
| `src/organisms/BottomNavigationBar.tsx` | CREATE | Pill nav bar composed from `NavItem` |
| `src/organisms/TransactionListCard.tsx` | CREATE | Date header + `TransactionRow` list |
| `src/organisms/AppBarSimpleTitle.tsx` | CREATE | Centered title bar |
| `src/organisms/AppBarBackTitle.tsx` | CREATE | Back button (via `ButtonIconOnly`) + title |
| `src/organisms/BudgetCard.tsx` | CREATE | Progress card with `overLimit` tone switch |
| `src/organisms/NetDurumCard.tsx` | CREATE | Net balance summary card |
| `src/organisms/GoalCard.tsx` | CREATE | Goal progress card |
| `src/organisms/RecurringPaymentCard.tsx` | CREATE | Recurring payment row-card |
| `src/organisms/IncomeSourceCard.tsx` | CREATE | Income source row-card |
| `src/organisms/index.ts` | CREATE | Barrel export, alphabetical |
| `.claude/phases.md` | UPDATE | Check off Phase 4 checklist item |

## NOT Building
- Wiring any organism into actual navigation/screens (expo-router `Tabs` still uses its native tab bar from Phase 0 — `BottomNavigationBar` is built standalone; swapping it in as a custom `tabBar` renderer is a Phase 6/7+ concern).
- Goal Card's info-icon tooltip (the `.pen` file has a `metadata: { type: "tooltip-trigger" }` annotation — that's a design-tool-only note, not an interactive spec; icon renders statically).
- Net Durum Card negative-balance / over-spent color variant (no such instance exists in the design file — only Budget Card has a documented over-limit variant).
- Any test files (repo has no test runner configured — consistent with Phase 2/3, confirmed in phase-3 report).
- Date-grouping logic for Transaction List Card beyond a single `dateLabel` header (the design shows exactly one header + one row list per instance; multi-group lists are a screen-level concern for Phase 7 to solve by rendering multiple instances).

---

## Step-by-Step Tasks

### Task 1: Extend `ButtonIconOnly` with optional icon color override
- **ACTION**: Add `iconColor?: keyof ColorTokens` prop to `src/atoms/ButtonIconOnly.tsx`.
- **IMPLEMENT**: In the `createElement(getIcon(icon), {...})` call, change `color: isSurface ? theme.colors.textSecondary : theme.colors.bgApp` to `color: iconColor ? theme.colors[iconColor] : isSurface ? theme.colors.textSecondary : theme.colors.bgApp`.
- **MIRROR**: Phase 3 precedent — `ButtonIconOnly` was already non-breakingly extended once (variant/size) per `.claude/PRPs/reports/phase-3-molecules-report.md:4,18,50`.
- **IMPORTS**: Add `import type { ColorTokens } from '@/theme/tokens';` (file currently has no type import).
- **GOTCHA**: Keep the prop optional and additive — every existing call site (none yet reference `iconColor`) must keep compiling unchanged.
- **VALIDATE**: `npm run typecheck` — zero errors; existing behavior unchanged when `iconColor` omitted.

### Task 2: Add shared shadow helper
- **ACTION**: Create `src/lib/shadow.ts`.
- **IMPLEMENT**:
```ts
import type { ViewStyle } from 'react-native';

export function elevatedShadow(
  color: string,
  opacity: number,
  offsetY: number,
  blurRadius: number,
): ViewStyle {
  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: offsetY },
    shadowOpacity: opacity,
    shadowRadius: blurRadius,
    elevation: Math.round(blurRadius / 2),
  };
}
```
- **MIRROR**: `src/lib/color.ts` (single-purpose exported helper function, no class).
- **IMPORTS**: `ViewStyle` from `react-native`.
- **GOTCHA**: `.pen` shadow colors are `#00000066` / `#00000030` (hex+alpha) — convert alpha hex to a 0-1 opacity number before calling (`0x66/255 ≈ 0.4`, `0x30/255 ≈ 0.19`); pass base `#000000` as `color`, not the 8-digit hex.
- **VALIDATE**: `npm run typecheck`.

### Task 3: `BottomNavigationBar`
- **ACTION**: Create `src/organisms/BottomNavigationBar.tsx`.
- **IMPLEMENT**:
```tsx
export interface NavBarItem {
  icon: string;
  label: string;
  active?: boolean;
  onPress: () => void;
}
export interface BottomNavigationBarProps {
  items: NavBarItem[];
}
export function BottomNavigationBar({ items }: BottomNavigationBarProps) {
  const theme = useTheme();
  return (
    <View style={[styles.container, {
      borderRadius: theme.radius.full,
      backgroundColor: withAlpha(theme.colors.bgSurface, 'E6'),
      borderColor: theme.colors.borderSubtle,
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.sm,
      ...elevatedShadow('#000000', 0.4, 8, 24),
    }]}>
      {items.map((item) => (
        <NavItem key={item.label} {...item} />
      ))}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1 },
});
```
- **MIRROR**: `src/molecules/NavItem.tsx` (do not re-derive active/inactive colors — `NavItem` already owns that logic).
- **IMPORTS**: `NavItem` from `@/molecules`, `useTheme` from `@/theme`, `withAlpha` from `@/lib/color`, `elevatedShadow` from `@/lib/shadow`.
- **GOTCHA**: `theme.spacing.xs`=6 and `theme.spacing.sm`=10 map exactly to the `.pen` `padding:[6,10]` — use the tokens, don't hardcode `6`/`10`.
- **VALIDATE**: renders 5 `NavItem`s in a pill; typecheck/lint pass.

### Task 4: `TransactionListCard`
- **ACTION**: Create `src/organisms/TransactionListCard.tsx`.
- **IMPLEMENT**:
```tsx
export interface TransactionListCardProps {
  dateLabel: string;
  transactions: (TransactionRowProps & { id: string })[];
}
export function TransactionListCard({ dateLabel, transactions }: TransactionListCardProps) {
  const theme = useTheme();
  return (
    <View style={styles.container}>
      <Text style={{ fontFamily: theme.fonts.body.semibold, fontSize: 13, color: theme.colors.textSecondary }}>{dateLabel}</Text>
      <View>
        {transactions.map(({ id, ...row }) => <TransactionRow key={id} {...row} />)}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({ container: { flexDirection: 'column', gap: 10 } });
```
- **MIRROR**: `src/molecules/BudgetProgressRow.tsx:14-46` (column container, header text + composed rows below).
- **IMPORTS**: `TransactionRow`, `TransactionRowProps` from `@/molecules`.
- **GOTCHA**: no `gap` on the inner rows `View` — `TransactionRow`'s own `paddingVertical: 10` is the only spacing between rows (matches `.pen` "Rows" frame which has no `gap`).
- **VALIDATE**: typecheck/lint; visually rows are evenly spaced without doubled gaps.

### Task 5: `AppBarSimpleTitle`
- **ACTION**: Create `src/organisms/AppBarSimpleTitle.tsx`.
- **IMPLEMENT**:
```tsx
export interface AppBarSimpleTitleProps { title: string; }
export function AppBarSimpleTitle({ title }: AppBarSimpleTitleProps) {
  const theme = useTheme();
  return (
    <View style={styles.container}>
      <Text style={{ fontFamily: theme.fonts.heading.bold, fontSize: 22, color: theme.colors.textPrimary }}>{title}</Text>
    </View>
  );
}
const styles = StyleSheet.create({ container: { flexDirection: 'row', alignItems: 'center' } });
```
- **MIRROR**: `src/molecules/TitleSubtitle.tsx` (simple centered text container pattern).
- **IMPORTS**: `useTheme` from `@/theme`.
- **VALIDATE**: typecheck/lint.

### Task 6: `AppBarBackTitle`
- **ACTION**: Create `src/organisms/AppBarBackTitle.tsx`.
- **IMPLEMENT**:
```tsx
export interface AppBarBackTitleProps {
  title: string;
  onBack: () => void;
}
export function AppBarBackTitle({ title, onBack }: AppBarBackTitleProps) {
  const theme = useTheme();
  return (
    <View style={styles.container}>
      <ButtonIconOnly
        icon="arrow-left"
        onPress={onBack}
        accessibilityLabel="Geri"
        variant="surface"
        size={36}
        iconColor="textPrimary"
      />
      <Text style={{ fontFamily: theme.fonts.heading.bold, fontSize: 16, color: theme.colors.textPrimary }}>{title}</Text>
    </View>
  );
}
const styles = StyleSheet.create({ container: { flexDirection: 'row', alignItems: 'center', gap: 12 } });
```
- **MIRROR**: `src/atoms/ButtonIconOnly.tsx` (post-Task-1 signature).
- **IMPORTS**: `ButtonIconOnly` from `@/atoms`, `useTheme` from `@/theme`.
- **GOTCHA**: requires Task 1 to be done first (`iconColor` prop doesn't exist otherwise).
- **VALIDATE**: typecheck/lint; back button renders with `textPrimary`-colored icon, not the atom's default `textSecondary`.

### Task 7: `BudgetCard`
- **ACTION**: Create `src/organisms/BudgetCard.tsx`.
- **IMPLEMENT**:
```tsx
export interface BudgetCardProps {
  icon: string;
  categoryName: string;
  percent: number;
  footerLabel: string;
  overLimit?: boolean;
}
export function BudgetCard({ icon, categoryName, percent, footerLabel, overLimit = false }: BudgetCardProps) {
  const theme = useTheme();
  const accent: keyof ColorTokens = overLimit ? 'warningRed' : 'accentTeal';
  const accentColor = theme.colors[accent];
  return (
    <View style={[styles.container, {
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.bgSurface,
      borderColor: overLimit ? theme.colors.warningRed : theme.colors.borderSubtle,
      borderWidth: overLimit ? 1.5 : 1,
      padding: theme.spacing.md,
    }]}>
      <View style={styles.header}>
        <View style={styles.left}>
          <CategoryIcon icon={icon} tint={accent} />
          <Text style={{ fontFamily: theme.fonts.heading.semibold, fontSize: 14, color: theme.colors.textPrimary }}>{categoryName}</Text>
        </View>
        <Text style={{ fontFamily: theme.fonts.body.semibold, fontSize: 13, color: overLimit ? theme.colors.warningRed : theme.colors.textTertiary }}>{`%${percent}`}</Text>
      </View>
      <ProgressBar value={percent} color={accent} />
      <Text style={{ fontFamily: theme.fonts.body.medium, fontSize: 12, color: accentColor }}>{footerLabel}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flexDirection: 'column', gap: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
```
- **MIRROR**: `src/molecules/TransactionRow.tsx:25-30` (single boolean/enum → multiple derived colors, applied here to `overLimit`).
- **IMPORTS**: `CategoryIcon`, `ProgressBar` from `@/atoms`; `useTheme` from `@/theme`; `ColorTokens` type from `@/theme/tokens`.
- **GOTCHA**: `theme.fonts.heading.semibold` doesn't exist (`FONT_FAMILIES.heading` only has `regular/semibold/bold`... check `src/theme/tokens.ts:98-102` — heading actually only has `regular`/`semibold`/`bold`, confirm `semibold` key present: yes, `Geist_600SemiBold` — safe to use). `percent` can exceed 100 (over-limit case, e.g. 108) — do not clamp the displayed `%` text, only `ProgressBar`'s internal bar-width clamps.
- **VALIDATE**: typecheck/lint; render once with `overLimit=false` and once `overLimit=true`, confirm border/icon/percent/bar/footer all switch to `warningRed` together.

### Task 8: `NetDurumCard`
- **ACTION**: Create `src/organisms/NetDurumCard.tsx`.
- **IMPLEMENT**:
```tsx
export interface NetDurumCardProps {
  label?: string;
  amount: string;
  incomeAmount: string;
  expenseAmount: string;
}
export function NetDurumCard({ label = 'BU AY NET DURUM', amount, incomeAmount, expenseAmount }: NetDurumCardProps) {
  const theme = useTheme();
  return (
    <View style={[styles.container, {
      borderRadius: theme.radius.lg,
      backgroundColor: theme.colors.bgSurface,
      padding: theme.spacing.lg,
      ...elevatedShadow('#000000', 0.19, 8, 20),
    }]}>
      <Text style={{ fontFamily: theme.fonts.body.semibold, fontSize: 12, letterSpacing: 0.5, color: theme.colors.textSecondary }}>{label}</Text>
      <Text style={{ fontFamily: theme.fonts.heading.bold, fontSize: 38, color: theme.colors.accentTeal }}>{amount}</Text>
      <View style={styles.stats}>
        <StatCol icon="arrow-up" iconColor={theme.colors.incomeGreen} label="Gelir" value={incomeAmount} valueColor={theme.colors.incomeGreen} />
        <View style={[styles.divider, { backgroundColor: theme.colors.borderSubtle }]} />
        <StatCol icon="arrow-down" iconColor={theme.colors.expenseCoral} label="Gider" value={expenseAmount} valueColor={theme.colors.expenseCoral} />
      </View>
    </View>
  );
}
function StatCol({ icon, iconColor, label, value, valueColor }: { icon: string; iconColor: string; label: string; value: string; valueColor: string }) {
  const theme = useTheme();
  return (
    <View style={styles.statCol}>
      <View style={styles.statLabel}>
        {createElement(getIcon(icon), { size: 12, color: iconColor })}
        <Text style={{ fontFamily: theme.fonts.body.medium, fontSize: 12, color: theme.colors.textSecondary }}>{label}</Text>
      </View>
      <Text style={{ fontFamily: theme.fonts.heading.bold, fontSize: 16, color: valueColor }}>{value}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flexDirection: 'column', gap: 12 },
  stats: { flexDirection: 'row', alignItems: 'center', gap: 28 },
  statCol: { flexDirection: 'column', gap: 4 },
  statLabel: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  divider: { width: 1, height: 32 },
});
```
- **MIRROR**: `src/molecules/NavItem.tsx:35-41` (ad-hoc icon via `createElement(getIcon(...))`).
- **IMPORTS**: `createElement` from `react`; `getIcon` from `@/lib/icons`; `useTheme` from `@/theme`; `elevatedShadow` from `@/lib/shadow`.
- **GOTCHA**: no `stroke`/border on this card per the `.pen` source (unlike Budget/Recurring/Income cards) — do not add one. Amount color is always `accentTeal`, not tone-driven (see "NOT Building").
- **VALIDATE**: typecheck/lint; shadow visible on iOS (shadow* props) and Android (elevation).

### Task 9: `GoalCard`
- **ACTION**: Create `src/organisms/GoalCard.tsx`.
- **IMPLEMENT**:
```tsx
export interface GoalCardProps {
  icon: string;
  name: string;
  targetLabel: string;
  percent: number;
  percentLabel?: string;
  amountsLabel: string;
  etaLabel: string;
}
export function GoalCard({ icon, name, targetLabel, percent, percentLabel = 'tamamlandı', amountsLabel, etaLabel }: GoalCardProps) {
  const theme = useTheme();
  return (
    <View style={[styles.container, { borderRadius: theme.radius.md, backgroundColor: theme.colors.bgSurface, padding: theme.spacing.md }]}>
      <View style={styles.row}>
        <CategoryIcon icon={icon} />
        <View style={styles.info}>
          <Text style={{ fontFamily: theme.fonts.body.semibold, fontSize: 15, color: theme.colors.textPrimary }}>{name}</Text>
          <Text style={{ fontFamily: theme.fonts.body.regular, fontSize: 12, color: theme.colors.textSecondary }}>{targetLabel}</Text>
        </View>
        <View style={styles.percentCol}>
          <Text style={{ fontFamily: theme.fonts.heading.bold, fontSize: 16, color: theme.colors.accentTeal }}>{`${percent}%`}</Text>
          <Text style={{ fontFamily: theme.fonts.body.regular, fontSize: 11, color: theme.colors.textTertiary }}>{percentLabel}</Text>
        </View>
      </View>
      <ProgressBar value={percent} />
      <View style={styles.footer}>
        <Text style={{ fontFamily: theme.fonts.body.regular, fontSize: 12, color: theme.colors.textSecondary }}>{amountsLabel}</Text>
        <View style={styles.eta}>
          <Text style={{ fontFamily: theme.fonts.body.regular, fontSize: 12, color: theme.colors.textTertiary }}>{etaLabel}</Text>
          {createElement(getIcon('info'), { size: 12, color: theme.colors.textTertiary })}
        </View>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flexDirection: 'column', gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  info: { flexDirection: 'column', gap: 2, flex: 1 },
  percentCol: { flexDirection: 'column', alignItems: 'flex-end' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
```
- **MIRROR**: `src/molecules/InfoRowChevron.tsx:21-64` (`justifyContent:'space-between'` footer row).
- **IMPORTS**: `CategoryIcon`, `ProgressBar` from `@/atoms`; `createElement` from `react`; `getIcon` from `@/lib/icons`; `useTheme` from `@/theme`.
- **GOTCHA**: no stroke, no shadow on this card (per `.pen` source — differs from Budget Card which has a stroke). Info icon is static — no `Pressable`/tooltip (see NOT Building).
- **VALIDATE**: typecheck/lint.

### Task 10: `RecurringPaymentCard`
- **ACTION**: Create `src/organisms/RecurringPaymentCard.tsx`.
- **IMPLEMENT**:
```tsx
export interface RecurringPaymentCardProps {
  icon: string;
  name: string;
  amount: string;
  frequencyLabel: string;
  nextLabel: string;
  onEdit: () => void;
  onDelete: () => void;
}
export function RecurringPaymentCard({ icon, name, amount, frequencyLabel, nextLabel, onEdit, onDelete }: RecurringPaymentCardProps) {
  const theme = useTheme();
  return (
    <View style={[styles.container, { borderRadius: theme.radius.md, backgroundColor: theme.colors.bgSurface, borderColor: theme.colors.borderSubtle, padding: theme.spacing.md }]}>
      <View style={styles.row}>
        <CategoryIcon icon={icon} />
        <View style={styles.info}>
          <Text style={{ fontFamily: theme.fonts.body.semibold, fontSize: 14, color: theme.colors.textPrimary }}>{name}</Text>
          <Text style={{ fontFamily: theme.fonts.heading.bold, fontSize: 18, color: theme.colors.expenseCoral }}>{amount}</Text>
        </View>
        <CardActions onEdit={onEdit} onDelete={onDelete} />
      </View>
      <View style={styles.metaRow}>
        <Text style={{ fontFamily: theme.fonts.body.medium, fontSize: 12, color: theme.colors.textSecondary }}>{frequencyLabel}</Text>
        <Text style={{ fontFamily: theme.fonts.body.regular, fontSize: 12, color: theme.colors.textTertiary }}>·</Text>
        <Text style={{ fontFamily: theme.fonts.body.regular, fontSize: 12, color: theme.colors.textTertiary }}>{nextLabel}</Text>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flexDirection: 'column', gap: 10, borderWidth: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  info: { flexDirection: 'column', gap: 2, flex: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
```
- **MIRROR**: `src/molecules/TransactionRow.tsx` (icon + info column + trailing element row shape).
- **IMPORTS**: `CategoryIcon` from `@/atoms`; `useTheme` from `@/theme`. `CardActions` is a small local shared component — see Task 11 GOTCHA (define once, e.g. in this file, and import into `IncomeSourceCard.tsx` — OR duplicate the ~10-line block; prefer defining `CardActions` in `RecurringPaymentCard.tsx` and exporting it for reuse to avoid duplicating the pencil/trash action pair).
- **GOTCHA**: `amount` color is hardcoded `expenseCoral`, not a prop — this card always models an outgoing payment.
- **VALIDATE**: typecheck/lint; pencil/trash `Pressable`s call `onEdit`/`onDelete`.

### Task 11: `IncomeSourceCard`
- **ACTION**: Create `src/organisms/IncomeSourceCard.tsx`.
- **IMPLEMENT**:
```tsx
import { CardActions } from './RecurringPaymentCard';

export interface IncomeSourceCardProps {
  name: string;
  amount: string;
  frequencyLabel: string;
  dayLabel: string;
  onEdit: () => void;
  onDelete: () => void;
}
export function IncomeSourceCard({ name, amount, frequencyLabel, dayLabel, onEdit, onDelete }: IncomeSourceCardProps) {
  const theme = useTheme();
  return (
    <View style={[styles.container, { borderRadius: theme.radius.md, backgroundColor: theme.colors.bgSurface, borderColor: theme.colors.borderSubtle, padding: theme.spacing.md }]}>
      <View style={styles.row}>
        <View style={styles.info}>
          <Text style={{ fontFamily: theme.fonts.body.semibold, fontSize: 14, color: theme.colors.textPrimary }}>{name}</Text>
          <Text style={{ fontFamily: theme.fonts.heading.bold, fontSize: 18, color: theme.colors.accentTeal }}>{amount}</Text>
        </View>
        <CardActions onEdit={onEdit} onDelete={onDelete} />
      </View>
      <View style={styles.metaRow}>
        <Text style={{ fontFamily: theme.fonts.body.medium, fontSize: 12, color: theme.colors.textSecondary }}>{frequencyLabel}</Text>
        <Text style={{ fontFamily: theme.fonts.body.regular, fontSize: 12, color: theme.colors.textTertiary }}>·</Text>
        <Text style={{ fontFamily: theme.fonts.body.regular, fontSize: 12, color: theme.colors.textTertiary }}>{dayLabel}</Text>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flexDirection: 'column', gap: 10, borderWidth: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  info: { flexDirection: 'column', gap: 2, flex: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
```
- **MIRROR**: `RecurringPaymentCard.tsx` (same shape minus the leading `CategoryIcon`).
- **IMPORTS**: `CardActions` from `./RecurringPaymentCard`; `useTheme` from `@/theme`.
- **GOTCHA**: no `CategoryIcon` in the Row — confirmed absent in the `.pen` source (only Recurring Payment Card has one). `amount` color hardcoded `accentTeal` (not `incomeGreen` — literal design choice).
- **VALIDATE**: typecheck/lint.

Add to `RecurringPaymentCard.tsx` (Task 10) an exported `CardActions`:
```tsx
export function CardActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Pressable onPress={onEdit} accessibilityLabel="Düzenle">
        {createElement(getIcon('pencil'), { size: 16, color: theme.colors.textSecondary })}
      </Pressable>
      <Pressable onPress={onDelete} accessibilityLabel="Sil">
        {createElement(getIcon('trash'), { size: 16, color: theme.colors.expenseCoral })}
      </Pressable>
    </View>
  );
}
```

### Task 12: Barrel export
- **ACTION**: Create `src/organisms/index.ts`.
- **IMPLEMENT**:
```ts
export * from './AppBarBackTitle';
export * from './AppBarSimpleTitle';
export * from './BottomNavigationBar';
export * from './BudgetCard';
export * from './GoalCard';
export * from './IncomeSourceCard';
export * from './NetDurumCard';
export * from './RecurringPaymentCard';
export * from './TransactionListCard';
```
- **MIRROR**: `src/molecules/index.ts:1-12` (alphabetical, one line per file).
- **VALIDATE**: `npm run typecheck` resolves `@/organisms` imports cleanly.

### Task 13: Check off Phase 4 in `phases.md`
- **ACTION**: Update `.claude/phases.md` line 29-32.
- **IMPLEMENT**: Change `## Phase 4 — Organisms (10 components)` line's checklist item `- [ ] Compose from Phase 2/3 only` to `- [x] Compose from Phase 2/3 only`, and add `✅ complete — report: .claude/PRPs/reports/phase-4-organisms-report.md` to the heading (matching Phase 2/3 heading format at lines 21, 25).
- **VALIDATE**: Manual diff review.

---

## Testing Strategy

### Unit Tests
No test runner configured in this repo (consistent with Phase 2/3 — confirmed in phase-3 report). None added.

### Edge Cases Checklist
- [ ] `BudgetCard` with `percent > 100` (over-limit) — percent text shows real value (e.g. "%108"), progress bar visually caps at 100%
- [ ] `BudgetCard` with `overLimit=false` — confirm no residual red anywhere (border/icon/percent/bar/footer all teal-family)
- [ ] `TransactionListCard` with an empty `transactions` array — renders header only, no crash
- [ ] `BottomNavigationBar` with `items=[]` — renders empty pill, no crash
- [ ] All 10 organisms render without crash across all 4 `ThemeMode`s (dark/light/vibrant/vibrant-dark) — every color is read via `theme.colors.*`, no hardcoded hex, so no theme can hit an undefined-token crash (same reasoning as Phase 3 report's cross-theme argument)
- [ ] `RecurringPaymentCard`/`IncomeSourceCard` pencil/trash buttons call `onEdit`/`onDelete` exactly once per press

---

## Validation Commands

### Static Analysis
```bash
npm run typecheck
```
EXPECT: Zero type errors

```bash
npm run lint
```
EXPECT: Zero errors/warnings

```bash
npm run format:check
```
EXPECT: Clean (run `npm run format` first if not)

### Build
No standalone build step (Expo managed workflow) — N/A, consistent with Phase 2/3.

### Manual/Browser Validation
- [ ] Temporarily render all 10 organisms with representative props on the scratch `(tabs)/index.tsx` screen (same approach used in Phase 3, behind the real `ThemeProvider`)
- [ ] `expo start --web`, screenshot via headless Chromium (dark theme, same workaround as Phase 3 since Playwright's bundled browser was unavailable)
- [ ] Pull `get_screenshot` on each of the 9 relevant Pencil node IDs (`DPYuB`, `i7blfW`, `HsvPz`, `ZFTqj`, `K1a3Sz`/`bUTA6`, `Eby9s`, `Lkuly`, `yUiyg`, `O21CJN`) and visually diff against the scratch render
- [ ] Revert the scratch screen content afterward (Phase 6/7 will own the real Home screen — don't leave organism demo code as the shipped `index.tsx`)

---

## Acceptance Criteria
- [ ] All 13 tasks completed
- [ ] All validation commands pass
- [ ] No type errors, no lint errors, format clean
- [ ] Every organism reads colors exclusively via `theme.colors.*` (no hardcoded hex except inside the two `elevatedShadow(...)` calls, which take a literal `#000000` base by design)
- [ ] No organism sets a hardcoded pixel `width` on its root
- [ ] `BudgetCard`'s `overLimit` prop switches all 4 dependent colors (border, icon tint, percent text, progress bar, footer text) together
- [ ] `.claude/phases.md` Phase 4 checked off

## Completion Checklist
- [ ] Code follows discovered patterns (row composition, tone-switch, ad-hoc icon, alpha helper, barrel export)
- [ ] No raw styling duplication — `CardActions` (pencil/trash pair) defined once, reused by both Recurring Payment Card and Income Source Card
- [ ] Tests: N/A (no runner in repo)
- [ ] No hardcoded values that should be theme tokens
- [ ] `.claude/phases.md` updated
- [ ] No unnecessary scope additions (no navigation wiring, no tooltip, no negative-balance variant — all explicitly deferred above)
- [ ] Self-contained — no questions needed during implementation

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| RN cross-platform shadow (`shadowColor`+`elevation` combo) renders slightly differently than Pencil's CSS-like blur on Android | Medium | Low (cosmetic only) | Visual QA step in Validation Commands catches gross mismatches; exact blur-radius-to-elevation mapping isn't a hard requirement, just "looks like a soft drop shadow" |
| Product later wants a negative/warning state for `NetDurumCard`'s amount | Low | Low | Explicitly deferred in NOT Building; adding a `tone` prop later is a small, additive, non-breaking change following the `BudgetCard.overLimit` precedent already established this phase |
| `CardActions` cross-file export (`RecurringPaymentCard.tsx` → `IncomeSourceCard.tsx`) reads slightly unusual vs. one-component-per-file norm | Low | Low | Documented explicitly in Task 10/11; alternative (duplicate the ~8-line block) was considered and rejected as raw-styling duplication, which the Phase 3/4 checklist explicitly forbids |

## Notes
- Confidence is high because every color/font/spacing/layout value in the Task sections above was pulled directly from `batch_get` on the live `.pen` file (not inferred), and every composition decision was checked against actual Phase 2/3 source files rather than assumed conventions.
- Two literal-design asymmetries are intentional, not bugs: (1) `GoalCard` has no border/shadow while `BudgetCard`/`RecurringPaymentCard`/`IncomeSourceCard` have a 1px border and `NetDurumCard` has a shadow instead of a border; (2) `IncomeSourceCard`'s amount is `accentTeal` (not `incomeGreen`) while `RecurringPaymentCard`'s is `expenseCoral`. Both are called out per-task so the implementer doesn't "fix" them toward consistency.

> Next step: Run `/prp-implement .claude/PRPs/plans/phase-4-organisms.plan.md` to execute this plan.
