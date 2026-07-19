# Plan: Phase 6 — Auth & Onboarding Screens

## Summary
Build the Login screen and the three onboarding screens (income source, recurring payment, goal) for FollowFlow, wire them to the existing Supabase/Redux data layer (Phase 5), and add the auth/onboarding navigation gate that currently doesn't exist anywhere in the app. This is the first screen-building phase (Phases 0-5 only built tokens/atoms/molecules/organisms/data-layer — zero screens exist yet).

## User Story
As a new FollowFlow user, I want to sign in (email/password or Google) and then be walked through adding my income source, a recurring payment, and a savings goal, so that the app has enough data to show meaningful budget/goal tracking from day one.

## Problem → Solution
Current state: `src/app/` only contains `(tabs)/*` placeholder screens; there is no login screen, no onboarding screens, and no logic anywhere that reads `authSlice.status` or `profiles.onboarding_completed` to decide what the user sees. Anyone opening the app lands directly on the tabs regardless of auth state.
Desired state: unauthenticated users see Login; authenticated users with `onboarding_completed = false` are routed through the 3-step onboarding; only authenticated + onboarded users reach `(tabs)`.

## Metadata
- **Complexity**: Large (new route groups, new screens, new atom prop, new auth-gate architecture, no existing screen precedent to copy)
- **Source PRD**: `.claude/phases.md`
- **PRD Phase**: Phase 6 — Auth & Onboarding Screens
- **Estimated Files**: ~15 (5 new route files, 2 new route-group layouts, 4 new screen components, 1 modified root layout, 1 modified atom, 1 modified molecule, 1 new lib helper, 1 modified barrel)

---

## UX Design

### Before
```
┌─────────────────────────────┐
│  App launches straight to   │
│  (tabs) — Ana Sayfa, etc.   │
│  No login. No onboarding.   │
│  auth/onboarding state is   │
│  tracked in Redux but never │
│  read by any UI.            │
└─────────────────────────────┘
```

### After
```
┌─────────────────────────────┐  ┌─────────────────────────────┐  ┌─────────────────────────────┐
│ Login                       │  │ Onboarding (3 steps)        │  │ (tabs)                       │
│ - Brand hero + card preview │  │ 1. Gelir Kaynağı (income)   │  │ Only reached once             │
│ - Google CTA                │→ │ 2. Tekrarlayan Ödeme         │→ │ authenticated AND             │
│ - "veya" divider             │  │ 3. Hedef (goal, optional)   │  │ profiles.onboarding_completed │
│ - Email CTA → inline email/ │  │ Each: step dots, skip link,  │  │ = true.                       │
│   password form              │  │ form fields, primary CTA     │  │                                │
└─────────────────────────────┘  └─────────────────────────────┘  └─────────────────────────────┘
```

### Interaction Changes
| Touchpoint | Before | After | Notes |
|---|---|---|---|
| App launch | Always `(tabs)` | Routed by auth/onboarding state via `Stack.Protected` | See Task 1 |
| Login | N/A | Google OAuth (stubbed as "not wired to a working native popup", see Risks) + email/password | Email/password form UI is **not** in `design.pen` — see Risks |
| Onboarding step nav | N/A | "Atla" (skip) and "Şimdi değil..." both advance without saving; primary CTA saves via RTK Query mutation then advances | Matches design copy exactly |
| Onboarding completion | N/A | Last screen's save (or skip) sets `profiles.onboarding_completed = true`, which flips the `Stack.Protected` guard and auto-navigates to `(tabs)` | No manual `router.replace` needed |

---

## Mandatory Reading

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 | `src/app/_layout.tsx` | 1-66 (full) | Must be restructured to add the auth/onboarding gate |
| P0 | `src/lib/auth.ts` | 1-57 (full) | `signInWithEmail`, `signUpWithEmail`, `signInWithGoogle`, `signOut` — call these directly, don't reinvent |
| P0 | `src/store/slices/authSlice.ts` | 1-29 (full) | Only `setSession` action exists; `status` is derived, not separately dispatched |
| P0 | `src/store/slices/appSlice.ts` | 1-23 (full) | `bootstrapped` flag, set once after first `getSession()` resolves |
| P0 | `src/store/api/profileApi.ts` | 1-56 (full) | `useGetProfileQuery` / `useUpdateProfileMutation` — the only way to read/set `onboarding_completed` |
| P0 | `supabase/migrations/20260719000000_initial_schema.sql` | 1-154 (full) | RLS policies — **no INSERT policy on `profiles`**; `income_sources`/`recurring_payments`/`goals` all require `user_id = auth.uid()` on insert |
| P0 | `src/molecules/FormFieldGroup.tsx` | 1-40 (full) | The label+input+error composite every form field in onboarding must use |
| P0 | `src/atoms/InputField.tsx` | 1-56 (full) | Needs 2 new optional props (`secureTextEntry`, `keyboardType`) — see Task 2 |
| P1 | `src/store/api/incomeSourcesApi.ts` | 1-82 (full) | `useCreateIncomeSourceMutation` exact call shape |
| P1 | `src/store/api/recurringPaymentsApi.ts` | 1-85 (full) | `useCreateRecurringPaymentMutation` — note `icon` and `next_payment_date` are required with no default |
| P1 | `src/store/api/goalsApi.ts` | 1-75 (full) | `useCreateGoalMutation` — `current_amount` defaults to 0 |
| P1 | `src/types/database.ts` / `src/types/index.ts` | full | Exact `Insert` shapes for all 3 entities + `Profile`/`ProfileUpdate` |
| P1 | `src/atoms/ButtonPrimary.tsx`, `ButtonSecondary.tsx`, `ButtonGoogleCTA.tsx` | full | Exact props (`disabled` exists on Primary only; Google CTA hardcodes brand colors, ignore theme) |
| P1 | `src/molecules/DividerOr.tsx`, `TitleSubtitle.tsx`, `StepIndicator.tsx`, `SegmentedToggle.tsx` | full | Exact prop shapes, all already built and ready to compose |
| P2 | `src/app/(tabs)/index.tsx`, `src/app/(tabs)/_layout.tsx` | full | Only existing route-file precedent (very thin, no `src/screens` usage yet — Phase 6 establishes that pattern) |
| P2 | `src/theme/tokens.ts`, `src/theme/ThemeProvider.tsx` | full | `useTheme()` → `{ mode, colors, spacing, radius, fonts, setMode }` |
| P2 | `src/lib/icons.ts` | full | `getIcon(name)` — kebab-case lucide lookup, throws on unknown name |
| P2 | `src/organisms/GoalCard.tsx`, `IncomeSourceCard.tsx` | full | Confirms `income_sources` has no `icon` field but `goals`/`recurring_payments` do — matches DB schema |

## External Documentation

| Topic | Source | Key Takeaway |
|---|---|---|
| Expo Router auth gating | Context7 `/expo/expo` → `docs/pages/router/advanced/protected.mdx`, `docs/pages/router/advanced/authentication.mdx` | Use `<Stack.Protected guard={...}>` wrapping `<Stack.Screen name="(group)" />` entries in the root layout. A failed guard auto-redirects to the first unguarded route — no manual `router.replace` needed for the onboarding→tabs transition. Requires an `expo-router` version that ships `Stack.Protected` (confirmed present; `package.json` has `"expo-router": "~57.0.7"`, well past the SDK that introduced it). |

KEY_INSIGHT: `Stack.Protected` re-evaluates its `guard` prop on every render of the root navigator, so simply updating Redux/RTK-Query cache state (e.g. after `updateProfile({onboarding_completed: true})` invalidates the `Profile` tag and `useGetProfileQuery` refetches) is enough to trigger the redirect — no imperative navigation call needed at the end of onboarding.
APPLIES_TO: Task 1 (root layout gate) and Task 6 (goal screen completion).
GOTCHA: A group referenced as a single `<Stack.Screen name="(group)" />` entry in a parent `Stack` must have its own `_layout.tsx` (exactly like the existing `(tabs)/_layout.tsx`) — a group folder without one cannot be referenced as a single collapsed entry.

---

## Patterns to Mirror

### NAMING_CONVENTION
// SOURCE: src/atoms/ButtonSecondary.tsx:1-20, src/molecules/FormFieldGroup.tsx:1-15
```tsx
// File name PascalCase == component name. Named export (never default) for atoms/molecules/organisms.
export interface ButtonSecondaryProps { label: string; icon?: string; tone?: 'neutral' | 'destructive'; onPress: () => void; style?: StyleProp<ViewStyle>; }
export function ButtonSecondary({ label, icon, tone = 'neutral', onPress, style }: ButtonSecondaryProps) { ... }
```
Screens in `src/screens/` follow the same named-export convention. Route files under `src/app/**` use **default export** (required by expo-router) and are thin:
```tsx
// SOURCE: src/app/(tabs)/index.tsx:1-9 (current placeholder, to be replaced by real screens elsewhere but the file-thinness convention is what to establish)
export default function AnaSayfaScreen() {
  return <View style={styles.container}><Text>Ana Sayfa</Text></View>;
}
```

### IMPORT_CONVENTION
// SOURCE: tsconfig.json:5-8, src/organisms/RecurringPaymentCard.tsx (verified by explore agent)
```ts
// Always @/... alias, never relative ../../ (except same-folder sibling imports, e.g. NumpadKeyRow.tsx importing ./NumpadKey)
import { ButtonPrimary, ButtonGoogleCTA, InputField } from '@/atoms';
import { FormFieldGroup, DividerOr, TitleSubtitle, StepIndicator, SegmentedToggle } from '@/molecules';
import { useTheme } from '@/theme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { signInWithEmail, signInWithGoogle, signUpWithEmail } from '@/lib/auth';
```

### STYLE_PATTERN (theme consumption)
// SOURCE: src/atoms/ButtonPrimary.tsx:1-58 (full file)
```tsx
import { createElement } from 'react';
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import { getIcon } from '@/lib/icons';
import { useTheme } from '@/theme';

export interface ButtonPrimaryProps { label: string; icon?: string; onPress: () => void; disabled?: boolean; style?: StyleProp<ViewStyle>; }

export function ButtonPrimary({ label, icon, onPress, disabled = false, style }: ButtonPrimaryProps) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} disabled={disabled} style={[styles.container, { borderRadius: theme.radius.sm, backgroundColor: theme.colors.accentTeal, opacity: disabled ? 0.5 : 1 }, style]}>
      {icon ? createElement(getIcon(icon), { size: 18, color: theme.colors.bgApp }) : null}
      <Text style={{ fontFamily: theme.fonts.heading.bold, fontSize: 16, color: theme.colors.bgApp }}>{label}</Text>
    </Pressable>
  );
}
const styles = StyleSheet.create({ container: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 } });
```
Static layout props (flex/gap/padding/dimensions) go in `StyleSheet.create` at the bottom; theme-dependent values (color/radius/spacing/font) are inlined via `[styles.x, { ...themeValues }]`.

### ERROR_HANDLING (auth calls)
// SOURCE: src/lib/auth.ts:9-22 (signUpWithEmail/signInWithEmail throw on Supabase error, no swallowing)
```ts
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}
```
Screen-level call sites must wrap in try/catch and map the thrown error's `.message` into a `FormFieldGroup`'s `error` string (no schema-based validation library exists — see GOTCHA in Task 3).

### FORM_FIELD_PATTERN (label + input + inline error)
// SOURCE: src/molecules/FormFieldGroup.tsx:1-40 (full file)
```tsx
export interface FormFieldGroupProps { label: string; value: string; onChangeText: (text: string) => void; placeholder?: string; icon?: string; error?: string; }
export function FormFieldGroup({ label, value, onChangeText, placeholder, icon, error }: FormFieldGroupProps) {
  const theme = useTheme();
  return (
    <View style={styles.container}>
      <Text style={{ fontFamily: theme.fonts.body.semibold, fontSize: 12, color: theme.colors.textSecondary }}>{label}</Text>
      <InputField value={value} onChangeText={onChangeText} placeholder={placeholder} icon={icon} error={Boolean(error)} />
      {error ? <Text style={{ fontFamily: theme.fonts.body.medium, fontSize: 11, color: theme.colors.warningRed }}>{error}</Text> : null}
    </View>
  );
}
```
This is the exact molecule to use for every text/numeric field across all 4 screens. **Every field in the Pencil design uses this molecule** (`FL1A7` ref in every onboarding screen) — never build a raw label+input pair by hand.

### DATA_MUTATION_PATTERN (RTK Query create)
// SOURCE: src/store/api/incomeSourcesApi.ts:32-43, src/store/api/goalsApi.ts:28-39
```ts
// Hook call shape — mutation arg is the raw Insert object, no wrapper:
const [createIncomeSource, { isLoading }] = useCreateIncomeSourceMutation();
await createIncomeSource({ user_id: session.user.id, name, amount, frequency, pay_day }).unwrap();
```
`user_id` is **required** and is never auto-populated — every onboarding create call must read it from `useAppSelector((s) => s.auth.session?.user.id)` and pass it explicitly, or the RLS `with check (auth.uid() = user_id)` policy rejects the insert.

### AUTH_GATE_PATTERN (Expo Router Stack.Protected)
// SOURCE: Context7 /expo/expo docs/pages/router/advanced/protected.mdx (external, adapted to this repo's slices)
```tsx
function RootNavigator() {
  const bootstrapped = useAppSelector((s) => s.app.bootstrapped);
  const status = useAppSelector((s) => s.auth.status);
  const { data: profile, isLoading: profileLoading } = useGetProfileQuery(undefined, { skip: status !== 'authenticated' });

  if (!bootstrapped || (status === 'authenticated' && profileLoading)) return null;

  return (
    <Stack>
      <Stack.Protected guard={status !== 'authenticated'}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={status === 'authenticated' && profile != null && !profile.onboarding_completed}>
        <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={status === 'authenticated' && profile != null && profile.onboarding_completed}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}
```

---

## Files to Change

| File | Action | Justification |
|---|---|---|
| `src/atoms/InputField.tsx` | UPDATE | Add optional `secureTextEntry?: boolean` (Login password field) and `keyboardType?: TextInputProps['keyboardType']` (numeric amount fields). Both default to current behavior — non-breaking. |
| `src/molecules/FormFieldGroup.tsx` | UPDATE | Forward the 2 new `InputField` props through (`secureTextEntry`, `keyboardType`). |
| `src/lib/onboarding.ts` | CREATE | Small pure helper: `computeNextPaymentDate(dayOfMonth: number, today?: Date): string` — see Task 5 GOTCHA. |
| `src/screens/LoginScreen.tsx` | CREATE | Hero + Google CTA + inline email/password form. |
| `src/screens/OnboardingIncomeSourceScreen.tsx` | CREATE | Step 1/3. |
| `src/screens/OnboardingRecurringPaymentScreen.tsx` | CREATE | Step 2/3. |
| `src/screens/OnboardingGoalScreen.tsx` | CREATE | Step 3/3, completes onboarding. |
| `src/screens/index.ts` | CREATE | Barrel, matches atoms/molecules/organisms convention. |
| `src/app/_layout.tsx` | UPDATE | Extract `RootNavigator` child component, add `Stack.Protected` gate (Task 1). |
| `src/app/(auth)/_layout.tsx` | CREATE | Nested `Stack`, `headerShown: false`, one screen: `login`. |
| `src/app/(auth)/login.tsx` | CREATE | Thin wrapper: `export { LoginScreen as default } from '@/screens/LoginScreen';` (adjusted for default-export requirement, see Task 7). |
| `src/app/(onboarding)/_layout.tsx` | CREATE | Nested `Stack`, `headerShown: false`, three screens: `income`, `recurring`, `goal`. |
| `src/app/(onboarding)/income.tsx` | CREATE | Thin wrapper. |
| `src/app/(onboarding)/recurring.tsx` | CREATE | Thin wrapper. |
| `src/app/(onboarding)/goal.tsx` | CREATE | Thin wrapper. |

## NOT Building
- Forgot-password flow (not in `design.pen`, not in `phases.md` Phase 6 scope).
- Email verification / confirmation UI (Supabase's own hosted confirmation page is used as-is; no in-app screen for it).
- A working native Google account-picker popup — see [[project-google-auth-deferred]] memory. `ButtonGoogleCTA` is wired to the existing `signInWithGoogle()` (browser-redirect OAuth), which is functionally real but does **not** show a native popup on Expo. This is a known, previously-made product decision, not a Phase 6 regression.
- An icon picker UI for recurring payments / goals (not in `design.pen` — the onboarding forms only show name/amount/frequency/day fields). Icons are hardcoded defaults (`'repeat'` for recurring payments, `'target'` for goals) — see Task 5/6 GOTCHA.
- A day-of-week picker for weekly-frequency recurring payments (design only has one generic "day" field with a monthly-framed placeholder). See Risks.
- Any new test framework/infrastructure — none exists in the repo today, and adding one is out of scope for a screen-building phase.
- Redesigning `InputField`/`FormFieldGroup` beyond the 2 additive optional props needed for this phase.

---

## Step-by-Step Tasks

### Task 1: Root layout auth/onboarding gate
- **ACTION**: Restructure `src/app/_layout.tsx` to add a `RootNavigator` child component that reads auth/onboarding state and renders `Stack.Protected` groups.
- **IMPLEMENT**:
  ```tsx
  import {
    Geist_400Regular, Geist_600SemiBold, Geist_700Bold,
  } from '@expo-google-fonts/geist';
  import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
  import { useFonts } from 'expo-font';
  import { Stack } from 'expo-router';
  import * as SplashScreen from 'expo-splash-screen';
  import { useEffect } from 'react';
  import { Provider } from 'react-redux';

  import { supabase } from '@/lib/supabase';
  import { useGetProfileQuery } from '@/store/api';
  import { useAppSelector } from '@/store/hooks';
  import { setBootstrapped } from '@/store/slices/appSlice';
  import { setSession } from '@/store/slices/authSlice';
  import { store } from '@/store/store';
  import { ThemeProvider } from '@/theme';

  SplashScreen.preventAutoHideAsync();

  function RootNavigator() {
    const bootstrapped = useAppSelector((s) => s.app.bootstrapped);
    const status = useAppSelector((s) => s.auth.status);
    const { data: profile, isLoading: profileLoading } = useGetProfileQuery(
      undefined,
      { skip: status !== 'authenticated' },
    );

    useEffect(() => {
      if (bootstrapped && (status !== 'authenticated' || !profileLoading)) {
        SplashScreen.hideAsync();
      }
    }, [bootstrapped, status, profileLoading]);

    if (!bootstrapped || (status === 'authenticated' && profileLoading)) return null;

    return (
      <Stack>
        <Stack.Protected guard={status !== 'authenticated'}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Protected
          guard={status === 'authenticated' && !!profile && !profile.onboarding_completed}
        >
          <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Protected
          guard={status === 'authenticated' && !!profile && profile.onboarding_completed}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack.Protected>
      </Stack>
    );
  }

  export default function RootLayout() {
    const [fontsLoaded, fontError] = useFonts({
      Geist_400Regular, Geist_600SemiBold, Geist_700Bold,
      Inter_400Regular, Inter_500Medium, Inter_600SemiBold,
    });

    useEffect(() => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        store.dispatch(setSession(session));
        store.dispatch(setBootstrapped(true));
      });
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        store.dispatch(setSession(session));
      });
      return () => subscription.unsubscribe();
    }, []);

    if (!fontsLoaded && !fontError) return null;

    return (
      <Provider store={store}>
        <ThemeProvider>
          <RootNavigator />
        </ThemeProvider>
      </Provider>
    );
  }
  ```
- **MIRROR**: AUTH_GATE_PATTERN above; existing dispatch-effects stay exactly as they are today (untouched logic, just relocated visually around the new `RootNavigator`).
- **IMPORTS**: `@/store/api` (for `useGetProfileQuery`), `@/store/hooks` (for `useAppSelector`) — both already exist, no new dependency.
- **GOTCHA**: The original code called `SplashScreen.hideAsync()` purely on `fontsLoaded`. Moving that trigger into `RootNavigator` means splash now also waits on `bootstrapped` + profile settling, preventing a flash of the wrong route group. Do not keep the old fonts-only effect **and** add this one — that would double-hide harmlessly but the old one alone would still let the blank-`RootNavigator`-render (`return null`) show as a blank frame after splash already dismissed. Remove the old effect entirely; keep only the fonts gate (`if (!fontsLoaded && !fontError) return null;`) in `RootLayout` and the splash-hide + redux-based gate together in `RootNavigator`.
- **VALIDATE**: `npm run typecheck`; manually: `expo start`, confirm app shows Login when logged out, confirm existing `(tabs)` still renders once you temporarily force `profile.onboarding_completed = true` and a session exists (or after completing real onboarding in Task 6).

### Task 2: Extend `InputField` with `secureTextEntry` and `keyboardType`
- **ACTION**: Add 2 optional props to `src/atoms/InputField.tsx`, forward them to the underlying RN `TextInput`.
- **IMPLEMENT**:
  ```tsx
  import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
  // ...
  export interface InputFieldProps {
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    icon?: string;
    editable?: boolean;
    error?: boolean;
    secureTextEntry?: boolean;
    keyboardType?: TextInputProps['keyboardType'];
  }

  export function InputField({
    value, onChangeText, placeholder = 'Ara...', icon, editable = true, error = false,
    secureTextEntry = false, keyboardType = 'default',
  }: InputFieldProps) {
    // ...unchanged body...
    <TextInput
      // ...existing props unchanged...
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardType}
    />
  }
  ```
- **MIRROR**: The existing `editable`/`error` optional-prop-with-default pattern already in this same file — same style, same placement.
- **IMPORTS**: `type TextInputProps` from `react-native` (already imported as a value; add the type-only import for the union type).
- **GOTCHA**: Do not touch `FormFieldGroup`'s existing 5 props — only add the 2 new ones, forwarded straight through. Do not add `editable` forwarding (out of scope, not needed by any Phase 6 screen — all fields are always editable).
- **VALIDATE**: `npm run typecheck && npm run lint`. Existing callers (`SearchBar.tsx`) must still compile unchanged since both new props are optional with defaults matching current behavior.

### Task 3: `src/molecules/FormFieldGroup.tsx` — forward new props
- **ACTION**: Add `secureTextEntry`/`keyboardType` to `FormFieldGroupProps` and pass through to `InputField`.
- **IMPLEMENT**:
  ```tsx
  export interface FormFieldGroupProps {
    label: string; value: string; onChangeText: (text: string) => void;
    placeholder?: string; icon?: string; error?: string;
    secureTextEntry?: boolean; keyboardType?: InputFieldProps['keyboardType'];
  }
  // ...
  <InputField value={value} onChangeText={onChangeText} placeholder={placeholder} icon={icon}
    error={Boolean(error)} secureTextEntry={secureTextEntry} keyboardType={keyboardType} />
  ```
- **MIRROR**: FORM_FIELD_PATTERN above.
- **IMPORTS**: `import { InputField, type InputFieldProps } from '@/atoms';` (adjust existing import to also pull the type).
- **GOTCHA**: No validation library exists (`zod`/`yup`/`react-hook-form` all absent). All validation in Tasks 4-6 is plain functions + local `useState` error strings assigned to `FormFieldGroup`'s `error?: string` prop — do not introduce a validation library for this phase.
- **VALIDATE**: `npm run typecheck`.

### Task 4: `src/screens/LoginScreen.tsx`
- **ACTION**: Build the Login screen mirroring the Pencil "Login" frame (`V8vWV`) content exactly, plus an inline (not in design) email/password form behind the existing "E-posta ile Giriş Yap" button.
- **IMPLEMENT**: Structure, top to bottom, per the Pencil frame:
  1. `SafeAreaView` (edges `['top']`) with `backgroundColor: theme.colors.bgApp`.
  2. Ambient glow decoration is a Pencil-only visual flourish (blurred ellipse) — **skip it**; it's decorative, not a component, and out of scope for a functional screen (flag under Risks, not a blocker).
  3. Brand row: `CategoryIcon`-less custom mark is out of design-system scope too — simplest faithful approximation: a `Text` "FollowFlow" in `theme.fonts.heading.bold`, `fontSize: 19`. (The Pencil "Mark Badge" instance is a one-off decorative badge, not a reusable atom — do not build a new atom for it; a plain themed `View`+icon is acceptable, or omit the badge and keep just the wordmark — simplest is fine here since this is decorative branding, not a data-bearing element.)
  4. Card-stack preview (`Goal Card`/`Net Durum Card` at odd rotations) — **skip**; purely decorative marketing flourish with hardcoded preview data (₺60.000 "Tatilim"), not functional UI. Document as intentionally omitted in Risks.
  5. Caption text: `"Bütün finansal hayatın, tek ekranda."` — exact copy from `cNzja` in the design, centered, `theme.colors.textSecondary`.
  6. Actions column (`gap: theme.spacing.sm`):
     - `<ButtonGoogleCTA onPress={handleGoogleSignIn} />` (default label already correct: `'Google ile Giriş Yap'`).
     - `<DividerOr />` (default label already correct: `'veya'`).
     - `<ButtonSecondary label="E-posta ile Giriş Yap" icon="mail" onPress={() => setMode('email')} />` when `mode === 'hero'`.
  7. When `mode === 'email'`: replace the actions column with:
     - `<TitleSubtitle title={authMode === 'signIn' ? 'Giriş Yap' : 'Hesap Oluştur'} subtitle="E-posta adresin ve şifrenle devam et." />`
     - `<FormFieldGroup label="E-posta" value={email} onChangeText={setEmail} placeholder="ornek@eposta.com" icon="mail" keyboardType="email-address" error={emailError} />`
     - `<FormFieldGroup label="Şifre" value={password} onChangeText={setPassword} placeholder="••••••••" icon="lock" secureTextEntry error={passwordError} />`
     - `<ButtonPrimary label={authMode === 'signIn' ? 'Giriş Yap' : 'Kayıt Ol'} onPress={handleEmailSubmit} disabled={submitting} />`
     - A small `Text` link toggling `authMode` between `'signIn'`/`'signUp'` (e.g. `"Hesabın yok mu? Kayıt ol"` / `"Zaten hesabın var mı? Giriş yap"`).
     - A small `Text` "‹ Geri" that resets `mode` back to `'hero'`.
  8. `handleGoogleSignIn`: `try { await signInWithGoogle(); } catch (e) { setAuthError((e as Error).message); }` — on success, `authSlice.status` flips via the existing `onAuthStateChange` listener in `_layout.tsx`, `Stack.Protected` redirects automatically. No manual navigation call needed.
  9. `handleEmailSubmit`: validate non-empty email/password locally (no library), call `signInWithEmail`/`signUpWithEmail` based on `authMode`, `setSubmitting(true/false)` around the call, catch and surface `error.message` split across the two field errors as appropriate (or a single screen-level error `Text` in `theme.colors.warningRed` if a single generic message is simpler — either is acceptable, keep it to existing patterns only).
- **MIRROR**: DATA_MUTATION_PATTERN doesn't apply here (no CRUD entity), but ERROR_HANDLING pattern above (try/catch around throwing async fns) does.
- **IMPORTS**: `import { ButtonGoogleCTA, ButtonPrimary, ButtonSecondary } from '@/atoms'; import { DividerOr, FormFieldGroup, TitleSubtitle } from '@/molecules'; import { signInWithEmail, signInWithGoogle, signUpWithEmail } from '@/lib/auth'; import { useTheme } from '@/theme';`
- **GOTCHA**: The Pencil "Login" frame (`V8vWV`) has **no email/password input fields at all** — only the hero + 2 CTA buttons. The inline form in steps 7-9 is an engineering addition to fulfill "email/password auth" functionally (already built in Phase 5's `src/lib/auth.ts`) since the design file doesn't specify that sub-flow. This is flagged explicitly in Risks — implement as described above rather than blocking on it.
- **VALIDATE**: `npm run typecheck && npm run lint`; manually: `expo start`, verify Google button calls `signInWithGoogle` (will open a browser tab, not a native popup — expected per [[project-google-auth-deferred]]), verify email sign-up creates a session and the profiles-trigger row appears (check via Supabase dashboard or `mcp__supabase__execute_sql`).

### Task 5: `src/screens/OnboardingIncomeSourceScreen.tsx` (step 1/3)
- **ACTION**: Build the income-source onboarding screen mirroring Pencil frame `I7lkx` exactly.
- **IMPLEMENT**: Top to bottom, from the actual Pencil node tree (`Content Wrapper` `A9u65c`, padding `[24,20,32,20]`, `gap: theme.spacing.lg`):
  1. Top row: `<StepIndicator steps={3} currentStep={1} />` + `<Pressable onPress={handleSkip}><Text>Atla</Text></Pressable>` (justify `space-between`).
  2. `<TitleSubtitle title="Gelir Kaynağını Ekle" subtitle="Düzenli gelirini ekleyerek tahminlerini daha doğru hale getirelim." />` — exact Turkish copy from `ohTWH`/`rpX0a`.
  3. `<FormFieldGroup label="Gelir Adı" value={name} onChangeText={setName} placeholder="örn. Maaş" icon="tag" error={nameError} />`
  4. `<FormFieldGroup label="Tutar" value={amount} onChangeText={setAmount} placeholder="₺0,00" icon="banknote" keyboardType="decimal-pad" error={amountError} />`
  5. Frequency block: label `"Tekrar Sıklığı"` (`theme.fonts.body.semibold`, 12px, `theme.colors.textSecondary`) + `<SegmentedToggle options={[{label:'Aylık',value:'monthly'},{label:'Haftalık',value:'weekly'}]} value={frequency} onChange={setFrequency} />` — exact option order/labels from Pencil `CXJSP` (Aylık is Option A / default-selected in the design).
  6. `<FormFieldGroup label="Hangi Gün" value={payDay} onChangeText={setPayDay} placeholder="örn. Her ayın 1'i" icon="calendar" keyboardType="number-pad" error={payDayError} />`
  7. `<ButtonPrimary label="Kaydet ve İlerle" onPress={handleSave} disabled={submitting} />`
  8. `<Text onPress={handleSkip} style={{ textAlign: 'center', ...tertiary }}>Şimdi değil, sonra eklerim</Text>` — exact copy from `sPGBm`.
  9. `handleSave`: validate `name` non-empty, `amount` parses to a positive number, `payDay` parses to an integer 1-31; call
     ```ts
     const userId = session!.user.id;
     await createIncomeSource({
       user_id: userId,
       name,
       amount: Number(amount.replace(',', '.')),
       frequency,
       pay_day: Number(payDay),
     }).unwrap();
     router.push('/(onboarding)/recurring');
     ```
  10. `handleSkip`: `router.push('/(onboarding)/recurring')` directly, no mutation call.
- **MIRROR**: DATA_MUTATION_PATTERN above (`useCreateIncomeSourceMutation`).
- **IMPORTS**: `import { useCreateIncomeSourceMutation } from '@/store/api'; import { useAppSelector } from '@/store/hooks'; import { useRouter } from 'expo-router';`
- **GOTCHA**: `amount` is a `numeric(12,2)` column with `check (amount > 0)` (`supabase/migrations/20260719000000_initial_schema.sql`) — client-side validate `> 0` before calling the mutation, or the insert throws a Postgres check-constraint error that surfaces as an unfriendly `PostgrestError`. Turkish decimal input uses `,` as the separator (per the `₺0,00` placeholder) — convert `,`→`.` before `Number()`.
- **VALIDATE**: `npm run typecheck`; manually create an income source and confirm the row appears with correct `user_id` (RLS would otherwise reject it) via `mcp__supabase__execute_sql` or the Supabase dashboard.

### Task 6: `src/screens/OnboardingRecurringPaymentScreen.tsx` (step 2/3)
- **ACTION**: Build mirroring Pencil frame `fvXSe`, structurally identical to Task 5 but for `recurring_payments`.
- **IMPLEMENT**: Same structure as Task 5, with these differences:
  - `currentStep={2}`.
  - Heading: `"Tekrarlayan Ödemeni Ekle"`, subheading: `"Kira, fatura veya abonelik gibi sabit giderlerini ekle, yaklaşan ödemeleri unutma."` (from `qVEif`/`SdrPT`).
  - Fields: `"Ödeme Adı"` (placeholder `"örn. Kira"`, icon `tag`), `"Tutar"` (placeholder `"₺0,00"`, icon `banknote`), Frequency `SegmentedToggle` (same two options), `"Ödeme Günü"` (placeholder `"örn. Her ayın 5'i"`, icon `calendar`).
  - Primary CTA: `"Kaydet ve İlerle"`; skip text: `"Şimdi değil, sonra eklerim"` (from `CBlji`).
  - `handleSave`:
    ```ts
    const dayOfMonth = Number(payDay);
    await createRecurringPayment({
      user_id: session!.user.id,
      icon: 'repeat',
      name,
      amount: Number(amount.replace(',', '.')),
      frequency,
      next_payment_date: computeNextPaymentDate(dayOfMonth),
    }).unwrap();
    router.push('/(onboarding)/goal');
    ```
  - `handleSkip`: `router.push('/(onboarding)/goal')`.
- **MIRROR**: DATA_MUTATION_PATTERN (`useCreateRecurringPaymentMutation`).
- **IMPORTS**: adds `import { computeNextPaymentDate } from '@/lib/onboarding';`
- **GOTCHA (icon default)**: `recurring_payments.icon` is `not null` with no default and there is **no icon picker in the Pencil design** for this screen. Use a fixed default icon string `'repeat'` (valid `lucide-react-native` export via `getIcon`). This is a deliberate scope-bounded decision — see NOT Building.
- **GOTCHA (date derivation)**: `recurring_payments.next_payment_date` is a `date` column with **no default** — unlike `income_sources.pay_day` (a plain `smallint` day-of-month), this table stores an actual calendar date. The onboarding form only collects a day-of-month number (mirroring the design's single "Ödeme Günü" field, which uses the same placeholder style regardless of whether "Aylık" or "Haftalık" is selected in the toggle). Implement `computeNextPaymentDate` in `src/lib/onboarding.ts`:
  ```ts
  export function computeNextPaymentDate(dayOfMonth: number, today = new Date()): string {
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInThisMonth = new Date(year, month + 1, 0).getDate();
    const clampedDay = Math.min(dayOfMonth, daysInThisMonth);
    let candidate = new Date(year, month, clampedDay);
    if (candidate < today) {
      const daysInNextMonth = new Date(year, month + 2, 0).getDate();
      candidate = new Date(year, month + 1, Math.min(dayOfMonth, daysInNextMonth));
    }
    return candidate.toISOString().slice(0, 10);
  }
  ```
  This treats the entered day-of-month identically for both "Aylık" and "Haftalık" selections (a known simplification — a true weekly cadence would need a day-of-week picker, which doesn't exist in the design; flagged in Risks, not a blocker for Phase 6).
- **VALIDATE**: `npm run typecheck`; write a throwaway script or use the REPL to confirm `computeNextPaymentDate(31, new Date('2026-02-15'))` clamps to `'2026-02-28'` and `computeNextPaymentDate(5, new Date('2026-07-20'))` rolls to next month's 5th.

### Task 7: `src/screens/OnboardingGoalScreen.tsx` (step 3/3, completes onboarding)
- **ACTION**: Build mirroring Pencil frame `oGqNQ`, and on save/skip, mark onboarding complete.
- **IMPLEMENT**: Same structure as Tasks 5-6:
  - `currentStep={3}`.
  - Heading: `"Bir Tasarruf Hedefi Belirle"`, subheading: `"Opsiyonel — istersen şimdi bir hedef koy, istersen daha sonra ekle."` (from `cxkvD`/`eiFBZ`).
  - Fields: `"Hedef Adı"` (placeholder `"örn. Tatil"`, icon `target`), `"Hedef Tutarı"` (placeholder `"₺0,00"`, icon `banknote`), `"Mevcut Birikim (opsiyonel)"` (placeholder `"₺0,00"`, icon `piggy-bank`) — **no frequency/day fields on this screen** (matches the design — goals have no recurrence).
  - Primary CTA: `"Hedefi Kaydet ve Başla"` (note: different copy from steps 1-2, exact from `tLbym` descendant `ZoKML`); skip text: `"Hedef eklemeden başla"` (from `uSRh0`, also different copy — not the generic "Şimdi değil" text).
  - `handleSave`:
    ```ts
    if (name.trim() && targetAmount.trim()) {
      await createGoal({
        user_id: session!.user.id,
        icon: 'target',
        name,
        target_amount: Number(targetAmount.replace(',', '.')),
        current_amount: savedAmount.trim() ? Number(savedAmount.replace(',', '.')) : undefined,
      }).unwrap();
    }
    await updateProfile({ onboarding_completed: true }).unwrap();
    ```
    Goal creation is optional (per design copy "opsiyonel") — only call `createGoal` if the user filled in name+target; always call `updateProfile` to complete onboarding either way.
  - `handleSkip`: same as save but skips the `createGoal` call — just `await updateProfile({ onboarding_completed: true }).unwrap();`. No `router.push` after this — `Stack.Protected`'s guard flips once the `Profile` RTK Query tag invalidates and `useGetProfileQuery` refetches with `onboarding_completed: true`, auto-redirecting to `(tabs)`.
- **MIRROR**: DATA_MUTATION_PATTERN (`useCreateGoalMutation`, `useUpdateProfileMutation`).
- **IMPORTS**: `import { useCreateGoalMutation, useUpdateProfileMutation } from '@/store/api';`
- **GOTCHA**: Same icon-default caveat as Task 6 (`goals.icon` required, no picker in design) — use `'target'`.
- **GOTCHA**: `goals.current_amount` defaults to `0` in the DB — only include it in the payload when the user actually typed something, otherwise omit the key entirely (don't send `0` explicitly unless that's truly what was typed, to keep the payload minimal and let the DB default apply naturally... though functionally sending `0` vs omitting is equivalent here; prefer omitting when empty for clarity).
- **VALIDATE**: `npm run typecheck`; manually complete all 3 onboarding steps and confirm the app auto-navigates to `(tabs)` without any manual redirect code.

### Task 8: Route files and route-group layouts
- **ACTION**: Create the thin `src/app/(auth)/*` and `src/app/(onboarding)/*` files and their group layouts.
- **IMPLEMENT**:
  ```tsx
  // src/app/(auth)/_layout.tsx
  import { Stack } from 'expo-router';
  export default function AuthLayout() {
    return <Stack screenOptions={{ headerShown: false }}><Stack.Screen name="login" /></Stack>;
  }

  // src/app/(auth)/login.tsx
  import { LoginScreen } from '@/screens';
  export default LoginScreen;

  // src/app/(onboarding)/_layout.tsx
  import { Stack } from 'expo-router';
  export default function OnboardingLayout() {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="income" />
        <Stack.Screen name="recurring" />
        <Stack.Screen name="goal" />
      </Stack>
    );
  }

  // src/app/(onboarding)/income.tsx
  import { OnboardingIncomeSourceScreen } from '@/screens';
  export default OnboardingIncomeSourceScreen;

  // src/app/(onboarding)/recurring.tsx
  import { OnboardingRecurringPaymentScreen } from '@/screens';
  export default OnboardingRecurringPaymentScreen;

  // src/app/(onboarding)/goal.tsx
  import { OnboardingGoalScreen } from '@/screens';
  export default OnboardingGoalScreen;
  ```
  Also create `src/screens/index.ts`:
  ```ts
  export * from './LoginScreen';
  export * from './OnboardingIncomeSourceScreen';
  export * from './OnboardingRecurringPaymentScreen';
  export * from './OnboardingGoalScreen';
  ```
- **MIRROR**: `(tabs)/_layout.tsx` (`src/app/(tabs)/_layout.tsx:1-17`) is the only existing precedent for a group layout — same `Stack`/`Tabs`-from-array shape, adapted to a plain `Stack`.
- **IMPORTS**: n/a beyond what's shown.
- **GOTCHA**: `export default LoginScreen;` works because `LoginScreen` is a named export function component — re-exporting a named export as the file's default is valid ESM and satisfies expo-router's requirement that the route file has a default export, while keeping the actual component itself named (consistent with the rest of the codebase's no-default-export convention outside `src/app/`).
- **VALIDATE**: `npm run typecheck` (also regenerates `.expo/types/router.d.ts` with the new typed routes on next `expo start`); manually navigate the full flow.

---

## Testing Strategy

No test framework exists in this repository (`package.json` has no `test` script; no `jest`/`@testing-library/react-native` configured — confirmed via full dependency scan). Adding one is out of scope for this phase. Validation is via `typecheck`/`lint`/`format:check` plus manual device/simulator walkthrough (see Validation Commands and Manual Validation below).

### Edge Cases Checklist
- [ ] Empty `name`/`amount`/`payDay` on income/recurring screens → inline `FormFieldGroup` error, no mutation call fired.
- [ ] `amount` with `,` decimal separator (e.g. `"1.500,50"`) parses correctly (Turkish locale).
- [ ] `payDay` of `31` in a 30-day or 28/29-day month → `computeNextPaymentDate` clamps correctly (Task 6 GOTCHA).
- [ ] Google sign-in cancelled by user (`WebBrowser.openAuthSessionAsync` returns non-`'success'`) → `signInWithGoogle` throws `'Google sign-in cancelled.'`, screen shows it, does not crash.
- [ ] Wrong email/password on sign-in → Supabase's `AuthError.message` surfaces in the form, not a crash.
- [ ] Skipping all 3 onboarding steps → `profiles.onboarding_completed` still ends up `true`, no income/recurring/goal rows created, app still reaches `(tabs)`.
- [ ] Goal screen: leaving all 3 fields empty and pressing "Hedefi Kaydet ve Başla" (not skip) → should behave the same as skip (no `createGoal` call) since `name`/`targetAmount` are empty; only `updateProfile` fires.
- [ ] App relaunch mid-onboarding (session exists, `onboarding_completed: false`) → `Stack.Protected` sends the user back into `(onboarding)`, not `(tabs)`, and not back to `(auth)`.

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
EXPECT: Zero lint errors (expo/react-hooks/prettier-disabled-formatting-rules preset).

```bash
npm run format:check
```
EXPECT: No formatting diffs (run `npm run format` to auto-fix if it fails).

### Full Test Suite
N/A — no test runner configured in this repository (see Testing Strategy).

### Database Validation
```bash
# Via Supabase MCP or CLI, after manually completing the flow once:
select id, onboarding_completed from public.profiles where id = '<test-user-id>';
select * from public.income_sources where user_id = '<test-user-id>';
select * from public.recurring_payments where user_id = '<test-user-id>';
select * from public.goals where user_id = '<test-user-id>';
```
EXPECT: `onboarding_completed = true`; income_sources/recurring_payments rows present with correct `user_id`; goals row present only if the goal step wasn't skipped.

### Browser/Device Validation
```bash
npm run start
```
EXPECT: App launches → Login screen (no session) → email sign-up or Google button → onboarding step 1 (income) → step 2 (recurring) → step 3 (goal) → auto-lands on `(tabs)` Ana Sayfa. Relaunching mid-flow resumes at the correct group per `Stack.Protected`.

### Manual Validation
- [ ] Fresh (unauthenticated) launch shows Login, not `(tabs)`.
- [ ] Email sign-up creates a Supabase user + auto-created `profiles` row (via the existing `handle_new_user` trigger — do not attempt a client-side profiles insert, RLS has no INSERT policy for it).
- [ ] All 4 screens' text/colors match the Pencil `dark` theme frames (spot-check against `mcp__pencil__get_screenshot` for `V8vWV`/`I7lkx`/`fvXSe`/`oGqNQ` if visual QA is desired — full cross-theme QA is Phase 10 scope, not required here).
- [ ] "Atla" / "Şimdi değil..." skip links advance without any network call.
- [ ] Completing all 3 real steps lands on `(tabs)` with correct rows in all 4 tables.

---

## Acceptance Criteria
- [ ] All 8 tasks completed.
- [ ] All validation commands pass (`typecheck`, `lint`, `format:check`).
- [ ] No type errors, no lint errors.
- [ ] Every string of on-screen copy matches the Turkish text in `design.pen` exactly (headings, subheadings, placeholders, button labels, skip text) for the 3 onboarding screens; Login screen's hero copy matches design, its email/password sub-form is a documented addition (see Risks).
- [ ] `Stack.Protected` gate correctly routes: unauthenticated → `(auth)`; authenticated + `!onboarding_completed` → `(onboarding)`; authenticated + `onboarding_completed` → `(tabs)`.
- [ ] No manual `router.replace` needed for the onboarding→tabs transition (relies on guard re-evaluation).

## Completion Checklist
- [ ] Code follows discovered patterns (named exports for `src/screens/*`, default exports only in `src/app/**`, `@/...` imports, `StyleSheet.create` + inline theme values).
- [ ] Error handling matches codebase style (try/catch around throwing `src/lib/auth.ts` calls, string errors surfaced via `FormFieldGroup`'s `error` prop).
- [ ] No hardcoded design-token values — every color/spacing/radius/font comes from `useTheme()`.
- [ ] `.claude/phases.md` Phase 6 checkboxes updated to `[x]` and a report written to `.claude/PRPs/reports/phase-6-auth-onboarding-screens-report.md` after implementation (matches Phase 0-5 convention).
- [ ] No unnecessary scope additions beyond the 2 additive atom/molecule props and the 1 new `src/lib/onboarding.ts` helper.
- [ ] Self-contained — an implementer should not need to open `design.pen` or grep the codebase further; every piece of copy, every prop shape, and every RLS constraint needed is captured above.

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Login screen's email/password form has no Pencil design source — the implemented layout (Task 4) is an engineering interpretation, not a literal design translation | High (certain) | Medium — visual mismatch if the user later designs this sub-flow in Pencil | Flagged explicitly in this plan; keep the implementation minimal (reuses only existing atoms/molecules) so it's cheap to replace once a real design exists |
| `signInWithGoogle()` opens a browser tab instead of a native account-picker popup | High (known, already happened once) | Low — functions correctly, just not the ideal native UX | Documented in [[project-google-auth-deferred]]; not a Phase 6 regression, no fix attempted this phase |
| `computeNextPaymentDate` treats "Haftalık" (weekly) recurring payments using day-of-month semantics (design has no day-of-week picker) | Medium | Low — weekly payments will have a plausible but not strictly weekly-accurate `next_payment_date` | Documented GOTCHA in Task 6; acceptable simplification for Phase 6, revisit if/when design adds a day-of-week picker |
| Fixed default icons (`'repeat'`, `'target'`) for recurring payments/goals since no icon picker exists in the onboarding design | Medium | Low — cosmetic only, all cards still render correctly with a valid icon | Documented in NOT Building; icon editing can be added later (e.g. in Phase 9's "Gelir Kaynaklarım"/settings-adjacent screens) without a schema change |
| `Stack.Protected` requires an `expo-router` version that supports it | Low | High if unsupported — gate silently doesn't work | `package.json` already pins `"expo-router": "~57.0.7"`, confirmed (via Context7 docs) to be well past the version that introduced `Stack.Protected`; verify once during Task 1 validation by simply checking the gate behaves as expected at runtime |

## Notes
- Every piece of Turkish copy in Tasks 4-7 was extracted directly from the live `design/design.pen` file via Pencil MCP (`batch_get` on frames `V8vWV`, `I7lkx`, `fvXSe`, `oGqNQ`) — not invented or translated after the fact.
- The 3-dot `StepIndicator` order (income → recurring → goal) matches both `phases.md`'s Phase 6 checklist order and the Pencil `Step Indicator` descendant overrides confirming which dot is active per screen.
- `src/screens/` has existed as an empty scaffold folder since Phase 0 — this phase is what finally populates it and establishes the "thin route file imports from `src/screens`" convention for all future screen phases (7-10) to follow.
