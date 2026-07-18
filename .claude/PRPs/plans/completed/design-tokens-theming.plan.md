# Plan: Design Tokens & Theming

## Summary
Port the color/spacing/radius/typography tokens from `design/design.pen` into a typed `src/theme/tokens.ts`, build a React context `ThemeProvider` + `useTheme` hook supporting the 4 design modes (`dark` default, `light`, `vibrant`, `vibrant-dark`), back it with a Redux slice, and persist the chosen mode to `AsyncStorage` so it survives app restarts. Wire the provider into the root layout. No screens/components consume the tokens yet — that starts in Phase 2 (Atoms).

## User Story
As a developer building FollowFlow's UI (Phase 2+), I want a single typed source of design tokens and a `useTheme()` hook that returns the active theme's resolved values, so that every atom/molecule/organism can style itself correctly across all 4 modes without duplicating hex values or reaching into Pencil.

## Problem → Solution
Currently `src/theme/index.ts` is an empty stub (`export {}` + TODO) and there is no way to know "what color is `bg-app` in `vibrant-dark` mode" from code — the only source of truth is the `.pen` file, reachable only via MCP tools. After this phase, `src/theme/tokens.ts` is the canonical, typed, importable source of truth, and `useTheme()` gives components live access to the current mode's resolved colors plus the (non-themed) spacing/radius/font scales.

## Metadata
- **Complexity**: Medium
- **Source PRD**: `.claude/phases.md`
- **PRD Phase**: Phase 1 — Design Tokens & Theming
- **Estimated Files**: 6 (3 create, 3 update)

---

## UX Design

### Before
N/A — internal/infrastructure change. No screen currently renders themed content (all 5 tab screens are placeholders from Phase 0).

### After
N/A — internal/infrastructure change. Theme switching UI itself is built in Phase 9 (Ayarlar screen); this phase only makes `setThemeMode`/`useTheme()` available for that screen to call later.

### Interaction Changes
| Touchpoint | Before | After | Notes |
|---|---|---|---|
| App boot | No theme concept | Redux `theme.mode` hydrates from `AsyncStorage` in the background (default `dark` renders immediately, swaps if a different stored mode is found) | Non-blocking — does not gate the splash screen |

---

## Mandatory Reading

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 | `src/store/slices/appSlice.ts` | 1-23 | Exact `createSlice` shape/naming to mirror for `themeSlice` |
| P0 | `src/store/store.ts` | 1-13 | Where/how to register the new reducer |
| P0 | `src/store/hooks.ts` | 1-7 | Typed `useAppDispatch`/`useAppSelector` — use these, never raw `react-redux` hooks |
| P0 | `src/lib/supabase.ts` | 1-22 | Guard-clause-throw error pattern; `AsyncStorage` import convention |
| P0 | `src/app/_layout.tsx` | 1-45 | Root composition order (`Provider` → `Stack`) and the fonts-loaded gating pattern to mirror (but NOT block on) for theme hydration |
| P1 | `src/theme/index.ts` | 1-3 | Current stub being replaced |
| P1 | `src/types/index.ts` | 1-3 | Confirms domain types live elsewhere — `ThemeMode` belongs in `theme/`, not here |
| P2 | `tsconfig.json` | 1-9 | `@/*` path alias — use it for all new imports, no relative `../../` |

## External Documentation
No external research needed — feature uses established internal patterns (Redux Toolkit slice, React Context, `@react-native-async-storage/async-storage`, all already dependencies in `package.json`).

---

## Design Tokens (source of truth — from `get_variables` on `design/design.pen`)

Theme axis: `mode` → `["dark", "light", "vibrant", "vibrant-dark"]`. Default/first-listed is `dark`.

### Themed colors (per-mode hex, kebab→camelCase key mapping)

| Pencil var | TS key | dark | light | vibrant | vibrant-dark |
|---|---|---|---|---|---|
| `accent-teal` | `accentTeal` | `#3ECF9A` | `#1E9E75` | `#6D4DF2` | `#8B6FF7` |
| `accent-teal-dim` | `accentTealDim` | `#20342C` | `#DFF3EA` | `#EAE6FD` | `#2C2540` |
| `bg-app` | `bgApp` | `#10161A` | `#F7F9F8` | `#F5F4F7` | `#14121B` |
| `bg-surface` | `bgSurface` | `#1A2226` | `#FFFFFF` | `#FFFFFF` | `#1E1B29` |
| `bg-surface-alt` | `bgSurfaceAlt` | `#212B30` | `#EEF2F1` | `#EEEDF5` | `#262233` |
| `border-subtle` | `borderSubtle` | `#2A363B` | `#E1E7E5` | `#E3E1EC` | `#332E42` |
| `expense-coral` | `expenseCoral` | `#E2897E` | `#D6584C` | `#F2545B` | `#F2837E` |
| `expense-coral-dim` | `expenseCoralDim` | `#3A2622` | `#FBEAE7` | `#FDE8E9` | `#3D2426` |
| `income-green` | `incomeGreen` | `#6FCF97` | `#248A5D` | `#2F80ED` | `#5B9BF5` |
| `text-primary` | `textPrimary` | `#F2F5F4` | `#101A17` | `#16141F` | `#F3F1F8` |
| `text-secondary` | `textSecondary` | `#8FA0A6` | `#5C6B67` | `#625F72` | `#A9A5BA` |
| `text-tertiary` | `textTertiary` | `#5C6C71` | `#8B9793` | `#9694A6` | `#726C82` |
| `warning-bg` | `warningBg` | `#3A2020` | `#FBE9E9` | `#FDF1E7` | `#3D2A14` |
| `warning-red` | `warningRed` | `#E5484D` | `#D6373D` | `#E8590C` | `#F2994A` |

### Non-themed scales (same across all 4 modes)

- **Spacing** (`gap-*` in Pencil → `SPACING` object): `xs`=6, `sm`=10, `md`=16, `lg`=24, `xl`=32
- **Radius** (`radius-*` → `RADIUS` object): `sm`=10, `md`=16, `lg`=22, `full`=999
- **Font families**: `font-heading`="Geist", `font-body`="Inter" — map to the exact `@expo-google-fonts` keys already loaded in `src/app/_layout.tsx`:
  - heading: `Geist_400Regular`, `Geist_600SemiBold`, `Geist_700Bold`
  - body: `Inter_400Regular`, `Inter_500Medium`, `Inter_600SemiBold`

GOTCHA: `fontFamily` in React Native must be the exact loaded font key string (e.g. `"Geist_700Bold"`), not the family name (`"Geist"`) — `useFonts` registers each weight as a separate named font.

---

## Patterns to Mirror

### NAMING_CONVENTION / SLICE_PATTERN
// SOURCE: src/store/slices/appSlice.ts:1-23
```ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface AppState {
  bootstrapped: boolean;
}

const initialState: AppState = {
  bootstrapped: false,
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setBootstrapped: (state, action: PayloadAction<boolean>) => {
      state.bootstrapped = action.payload;
    },
  },
});

export const { setBootstrapped } = appSlice.actions;
export default appSlice.reducer;
```

### ERROR_HANDLING (guard-clause throw)
// SOURCE: src/lib/supabase.ts:8-12
```ts
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY — check your .env file.',
  );
}
```
Applies to `useTheme()`: throw a descriptive error if called outside `ThemeProvider`, same style.

### STORE_REGISTRATION
// SOURCE: src/store/store.ts:1-9
```ts
import { configureStore } from '@reduxjs/toolkit';

import appReducer from './slices/appSlice';

export const store = configureStore({
  reducer: {
    app: appReducer,
  },
});
```

### TYPED_HOOKS
// SOURCE: src/store/hooks.ts:1-7
```ts
import { useDispatch, useSelector } from 'react-redux';

import type { AppDispatch, RootState } from './store';

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
```

### ROOT_LAYOUT_GATING
// SOURCE: src/app/_layout.tsx:21-36
```ts
const [fontsLoaded, fontError] = useFonts({ ... });

useEffect(() => {
  if (fontsLoaded || fontError) SplashScreen.hideAsync();
}, [fontsLoaded, fontError]);

if (!fontsLoaded && !fontError) return null;
```
Theme hydration does NOT hook into this gate (see GOTCHA in Task 3) — it resolves in the background after first paint.

### IMPORT_STYLE
// SOURCE: src/app/_layout.tsx:1-17 and src/app/(tabs)/_layout.tsx:1-3
- Third-party imports first, blank line, then `@/*` absolute imports. Named imports, single quotes, trailing commas (Prettier-enforced — `singleQuote: true`, `trailingComma: "all"`).

---

## Files to Change

| File | Action | Justification |
|---|---|---|
| `src/theme/tokens.ts` | CREATE | Typed token source: `ThemeMode`, per-mode `ColorTokens`, `SPACING`, `RADIUS`, `FONT_FAMILIES`, `getThemeTokens(mode)` |
| `src/store/slices/themeSlice.ts` | CREATE | Redux slice holding `mode: ThemeMode`, mirrors `appSlice` exactly |
| `src/theme/ThemeProvider.tsx` | CREATE | Context provider + `useTheme()` hook; AsyncStorage load/save side effects |
| `src/theme/index.ts` | UPDATE | Replace stub with barrel export of `tokens.ts` + `ThemeProvider.tsx` |
| `src/store/store.ts` | UPDATE | Register `themeReducer` under `theme` key |
| `src/app/_layout.tsx` | UPDATE | Wrap `<Stack>` with `<ThemeProvider>` inside `<Provider store={store}>` |

## NOT Building

- Any screen/atom/molecule/organism actually consuming `useTheme()` for styling (Phase 2+)
- A theme-switcher UI control (Ayarlar screen, Phase 9)
- Supabase-backed cross-device theme sync (phases.md explicitly says "Redux + AsyncStorage **or** Supabase user prefs" — choosing AsyncStorage since no `users` table/auth flow exists yet; Supabase sync would need Phase 5's schema first)
- System-appearance auto-detection (`useColorScheme()` / `Appearance` API) — not requested; default mode is a fixed `dark`, matching CLAUDE.md ("dark (default)")
- Any new npm dependency (e.g. `redux-persist`) — `AsyncStorage` is already installed and sufficient for a single string value
- Blocking the splash screen on theme hydration

---

## Step-by-Step Tasks

### Task 1: Create `src/theme/tokens.ts`
- **ACTION**: Define the typed token source of truth.
- **IMPLEMENT**:
  ```ts
  export type ThemeMode = 'dark' | 'light' | 'vibrant' | 'vibrant-dark';

  export const THEME_MODES: ThemeMode[] = ['dark', 'light', 'vibrant', 'vibrant-dark'];

  export interface ColorTokens {
    accentTeal: string;
    accentTealDim: string;
    bgApp: string;
    bgSurface: string;
    bgSurfaceAlt: string;
    borderSubtle: string;
    expenseCoral: string;
    expenseCoralDim: string;
    incomeGreen: string;
    textPrimary: string;
    textSecondary: string;
    textTertiary: string;
    warningBg: string;
    warningRed: string;
  }

  export const COLOR_TOKENS: Record<ThemeMode, ColorTokens> = {
    dark: { accentTeal: '#3ECF9A', accentTealDim: '#20342C', bgApp: '#10161A', bgSurface: '#1A2226', bgSurfaceAlt: '#212B30', borderSubtle: '#2A363B', expenseCoral: '#E2897E', expenseCoralDim: '#3A2622', incomeGreen: '#6FCF97', textPrimary: '#F2F5F4', textSecondary: '#8FA0A6', textTertiary: '#5C6C71', warningBg: '#3A2020', warningRed: '#E5484D' },
    light: { accentTeal: '#1E9E75', accentTealDim: '#DFF3EA', bgApp: '#F7F9F8', bgSurface: '#FFFFFF', bgSurfaceAlt: '#EEF2F1', borderSubtle: '#E1E7E5', expenseCoral: '#D6584C', expenseCoralDim: '#FBEAE7', incomeGreen: '#248A5D', textPrimary: '#101A17', textSecondary: '#5C6B67', textTertiary: '#8B9793', warningBg: '#FBE9E9', warningRed: '#D6373D' },
    vibrant: { accentTeal: '#6D4DF2', accentTealDim: '#EAE6FD', bgApp: '#F5F4F7', bgSurface: '#FFFFFF', bgSurfaceAlt: '#EEEDF5', borderSubtle: '#E3E1EC', expenseCoral: '#F2545B', expenseCoralDim: '#FDE8E9', incomeGreen: '#2F80ED', textPrimary: '#16141F', textSecondary: '#625F72', textTertiary: '#9694A6', warningBg: '#FDF1E7', warningRed: '#E8590C' },
    'vibrant-dark': { accentTeal: '#8B6FF7', accentTealDim: '#2C2540', bgApp: '#14121B', bgSurface: '#1E1B29', bgSurfaceAlt: '#262233', borderSubtle: '#332E42', expenseCoral: '#F2837E', expenseCoralDim: '#3D2426', incomeGreen: '#5B9BF5', textPrimary: '#F3F1F8', textSecondary: '#A9A5BA', textTertiary: '#726C82', warningBg: '#3D2A14', warningRed: '#F2994A' },
  };

  export const SPACING = { xs: 6, sm: 10, md: 16, lg: 24, xl: 32 } as const;
  export const RADIUS = { sm: 10, md: 16, lg: 22, full: 999 } as const;

  export const FONT_FAMILIES = {
    heading: { regular: 'Geist_400Regular', semibold: 'Geist_600SemiBold', bold: 'Geist_700Bold' },
    body: { regular: 'Inter_400Regular', medium: 'Inter_500Medium', semibold: 'Inter_600SemiBold' },
  } as const;

  export interface Theme {
    mode: ThemeMode;
    colors: ColorTokens;
    spacing: typeof SPACING;
    radius: typeof RADIUS;
    fonts: typeof FONT_FAMILIES;
  }

  export function getThemeTokens(mode: ThemeMode): Theme {
    return { mode, colors: COLOR_TOKENS[mode], spacing: SPACING, radius: RADIUS, fonts: FONT_FAMILIES };
  }
  ```
- **MIRROR**: No direct precedent (first token file) — but keep `export const`/`export interface`/`export function` at top level, no default export, matching the rest of `src/` which prefers named exports (only Redux slices use `export default`).
- **IMPORTS**: None — pure data, zero runtime deps.
- **GOTCHA**: Keep the hex values byte-for-byte identical to `get_variables` output (table above) — do not "clean up" or re-derive colors. If `design/design.pen` changes later, re-run `get_variables` and update this file by hand (no codegen exists yet).
- **VALIDATE**: `npm run typecheck` passes; `Object.keys(COLOR_TOKENS).length === 4` and each mode has all 14 color keys (visually inspect, no test framework to assert this yet).

### Task 2: Create `src/store/slices/themeSlice.ts`
- **ACTION**: Add a Redux slice holding the active `ThemeMode`.
- **IMPLEMENT**:
  ```ts
  import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

  import type { ThemeMode } from '@/theme/tokens';

  interface ThemeState {
    mode: ThemeMode;
  }

  const initialState: ThemeState = {
    mode: 'dark',
  };

  const themeSlice = createSlice({
    name: 'theme',
    initialState,
    reducers: {
      setThemeMode: (state, action: PayloadAction<ThemeMode>) => {
        state.mode = action.payload;
      },
    },
  });

  export const { setThemeMode } = themeSlice.actions;
  export default themeSlice.reducer;
  ```
- **MIRROR**: `src/store/slices/appSlice.ts` — exact same shape (interface, initialState, single setter reducer, named+default export).
- **IMPORTS**: `@reduxjs/toolkit`, `@/theme/tokens` (type-only).
- **GOTCHA**: Default mode must be `'dark'` per CLAUDE.md/phases.md ("dark (default)"), not the first key of `THEME_MODES` incidentally — be explicit.
- **VALIDATE**: `npm run typecheck` passes; no circular import (`theme/tokens.ts` has zero imports, so `store → theme` is one-directional and safe).

### Task 3: Update `src/store/store.ts`
- **ACTION**: Register the new reducer.
- **IMPLEMENT**:
  ```ts
  import { configureStore } from '@reduxjs/toolkit';

  import appReducer from './slices/appSlice';
  import themeReducer from './slices/themeSlice';

  export const store = configureStore({
    reducer: {
      app: appReducer,
      theme: themeReducer,
    },
  });

  export type RootState = ReturnType<typeof store.getState>;
  export type AppDispatch = typeof store.dispatch;
  ```
- **MIRROR**: Existing structure, alphabetical-ish import grouping already used (single-line imports, no reordering needed beyond insertion).
- **IMPORTS**: `./slices/themeSlice`.
- **GOTCHA**: None — purely additive, `RootState`/`AppDispatch` types auto-update via `ReturnType`/`typeof`, no manual type edits needed downstream.
- **VALIDATE**: `npm run typecheck` passes; `store.getState().theme.mode === 'dark'` (manually verify via a temporary `console.log` if desired, remove before commit).

### Task 4: Create `src/theme/ThemeProvider.tsx`
- **ACTION**: React context provider exposing the resolved `Theme` + a setter, backed by Redux, persisted to `AsyncStorage`.
- **IMPLEMENT**:
  ```tsx
  import AsyncStorage from '@react-native-async-storage/async-storage';
  import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';

  import { useAppDispatch, useAppSelector } from '@/store/hooks';
  import { setThemeMode } from '@/store/slices/themeSlice';
  import { getThemeTokens, THEME_MODES, type Theme, type ThemeMode } from '@/theme/tokens';

  const THEME_STORAGE_KEY = '@followflow/theme-mode';

  interface ThemeContextValue extends Theme {
    setMode: (mode: ThemeMode) => void;
  }

  const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

  function isThemeMode(value: string | null): value is ThemeMode {
    return value !== null && (THEME_MODES as string[]).includes(value);
  }

  export function ThemeProvider({ children }: { children: ReactNode }) {
    const mode = useAppSelector((state) => state.theme.mode);
    const dispatch = useAppDispatch();
    const hydrated = useRef(false);

    useEffect(() => {
      AsyncStorage.getItem(THEME_STORAGE_KEY).then((stored) => {
        if (isThemeMode(stored)) dispatch(setThemeMode(stored));
        hydrated.current = true;
      });
    }, [dispatch]);

    useEffect(() => {
      if (!hydrated.current) return;
      AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    }, [mode]);

    const setMode = (next: ThemeMode) => dispatch(setThemeMode(next));

    return (
      <ThemeContext.Provider value={{ ...getThemeTokens(mode), setMode }}>
        {children}
      </ThemeContext.Provider>
    );
  }

  export function useTheme(): ThemeContextValue {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme must be used within a ThemeProvider — check your component tree.');
    return ctx;
  }
  ```
- **MIRROR**: `src/lib/supabase.ts:8-12` for the throw-on-misuse guard clause; `src/store/hooks.ts` typed hooks (never import raw `useDispatch`/`useSelector`).
- **IMPORTS**: `@react-native-async-storage/async-storage`, `react`, `@/store/hooks`, `@/store/slices/themeSlice`, `@/theme/tokens`.
- **GOTCHA**: The `hydrated` ref guard on the write-effect prevents the initial `AsyncStorage.getItem` read from being immediately overwritten by a spurious `setItem('dark')` before the stored value has a chance to load — without it, a returning user's persisted `light` mode would be clobbered back to `dark` on every cold start. Do not swap `useRef` for `useState` here — a state-based flag would trigger an extra re-render for no benefit.
- **VALIDATE**: `npm run typecheck` passes. Manual: run `expo start --web`, in devtools `localStorage.setItem('@followflow/theme-mode', '"light"')` (AsyncStorage web shim uses JSON-stringified values), reload, confirm `useTheme().mode === 'light'` via a temporary debug `<Text>{JSON.stringify(useTheme())}</Text>` on the home screen (remove after verifying).

### Task 5: Update `src/theme/index.ts`
- **ACTION**: Replace the Phase 0 stub with a real barrel export.
- **IMPLEMENT**:
  ```ts
  export * from './tokens';
  export * from './ThemeProvider';
  ```
- **MIRROR**: N/A — first real barrel in the codebase; keep it minimal, no re-exports of internals not meant for consumption (there are none here — everything in `tokens.ts`/`ThemeProvider.tsx` is public API for Phase 2+).
- **IMPORTS**: None (re-export only).
- **GOTCHA**: Removing the `// TODO(Phase 1): ...` comment is part of this task — don't leave stale TODOs once the phase is done.
- **VALIDATE**: `npm run typecheck` passes; `import { useTheme, type ThemeMode } from '@/theme'` resolves.

### Task 6: Update `src/app/_layout.tsx`
- **ACTION**: Wrap the navigation `<Stack>` with `<ThemeProvider>`, inside the existing Redux `<Provider>`.
- **IMPLEMENT**:
  ```tsx
  import { store } from '@/store/store';
  import { ThemeProvider } from '@/theme';
  // ...
  return (
    <Provider store={store}>
      <ThemeProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </ThemeProvider>
    </Provider>
  );
  ```
- **MIRROR**: Existing nesting style — `<Provider>` already wraps `<Stack>` with no intermediate whitespace/formatting changes beyond the new tag pair.
- **IMPORTS**: `@/theme` (add alongside existing `@/store/store` import, same import block ordering: third-party first, then `@/*`).
- **GOTCHA**: `ThemeProvider` must be *inside* `<Provider store={store}>` — it calls `useAppSelector`/`useAppDispatch` internally and will throw ("could not find react-redux context") if mounted outside the Redux provider tree. Do NOT touch the `fontsLoaded`/`SplashScreen` gating logic — theme hydration is intentionally not part of it (see Task 4 GOTCHA and "NOT Building").
- **VALIDATE**: `npm run typecheck` passes; `expo start --web` boots without a red screen; app still renders "Ana Sayfa" tab content (regression check against Phase 0's validated behavior).

---

## Testing Strategy

No test framework is configured in this repo (`package.json` has no `test` script; Phase 0 explicitly deferred test infra since there was no business logic yet — see `.claude/PRPs/reports/phase-0-project-setup-report.md`). Adding one is out of scope for this phase (would be scope creep beyond phases.md's Phase 1 checklist). Validation is static analysis + manual runtime checks only, consistent with how Phase 0 was validated.

### Edge Cases Checklist
- [x] No stored value (first run) → `isThemeMode(null)` returns `false` → Redux keeps default `'dark'`, nothing written until first explicit change
- [x] Corrupted/invalid stored value (e.g. old format, manually edited) → `isThemeMode` guard rejects anything not in `THEME_MODES`, falls back to current Redux state (`'dark'`)
- [x] Rapid mode switching → each `setMode` call dispatches synchronously and the write-effect fires per resulting `mode` change; last write wins, no debounce needed at this scale (single small string, not a hot path)
- [x] Web platform → `AsyncStorage` from `@react-native-async-storage/async-storage` already ships a web shim (used identically by `src/lib/supabase.ts`'s auth storage) — no platform branching needed
- [ ] Concurrent access / network failure — N/A, `AsyncStorage` is local-only, no network involved

---

## Validation Commands

### Static Analysis
```bash
npm run typecheck
npm run lint
npm run format:check
```
EXPECT: Zero type errors, zero lint errors, all files formatted.

### Unit Tests
N/A — no test framework configured (see Testing Strategy).

### Full Test Suite
N/A — same as above.

### Database Validation
N/A — no schema changes in this phase.

### Browser Validation
```bash
npx expo start --web
```
EXPECT: Bundles cleanly, serves HTTP 200, "Ana Sayfa" tab content still renders (no regression vs. Phase 0), no red-screen error from `ThemeProvider`/Redux wiring.

### Manual Validation
- [ ] Cold start with no prior `AsyncStorage` value → app renders with `dark` mode tokens available via `useTheme()` (verify with a temporary debug read, then remove it)
- [ ] Manually set `localStorage['@followflow/theme-mode'] = '"light"'` in web devtools, reload → `useTheme().mode` becomes `'light'` after the async hydration effect resolves
- [ ] Call `setMode('vibrant')` from a temporary debug button → Redux state updates, `AsyncStorage` value updates, and it survives a reload
- [ ] `useTheme()` called outside `<ThemeProvider>` throws the expected error message (temporarily move a consuming component above the provider to confirm, then revert)

---

## Acceptance Criteria
- [ ] All 6 tasks completed
- [ ] All validation commands pass
- [ ] No type errors, no lint errors, no format violations
- [ ] All 4 theme modes resolve all 14 color tokens + spacing + radius + font families with values matching `get_variables` exactly
- [ ] Default mode is `dark` on fresh install
- [ ] Chosen mode persists across app restarts (verified via the web `localStorage` shim)

## Completion Checklist
- [ ] Code follows discovered patterns (`createSlice` shape, typed hooks, guard-clause throws, `@/*` imports)
- [ ] Error handling matches codebase style (`useTheme()` throw mirrors `lib/supabase.ts`)
- [ ] No hardcoded token values outside `tokens.ts` (single source of truth)
- [ ] No unnecessary scope additions (no new deps, no screens touched, no theme-switcher UI)
- [ ] Self-contained — no questions needed during implementation
- [ ] Stale `// TODO(Phase 1)` comment in `src/theme/index.ts` removed

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `design/design.pen` tokens change before Phase 2 starts, `tokens.ts` drifts out of sync | Low | Medium | Task 1 GOTCHA documents the manual re-sync process; re-run `get_variables` before starting Phase 2 |
| Hydration race overwrites a persisted non-default mode on cold start | Low (mitigated by design) | Medium | `hydrated` ref guard in Task 4 — write-effect is inert until the read completes |
| Future Supabase-backed prefs (mentioned as an alternative in phases.md) require migrating away from `AsyncStorage`-only persistence | Medium (by Phase 5) | Low | Persistence is isolated to `ThemeProvider`'s two `useEffect`s — swapping the storage backend later won't touch `tokens.ts`, the slice, or any consumer of `useTheme()` |

## Notes
- Chose `AsyncStorage` over Supabase user-prefs (phases.md offered both) because Phase 5 (Supabase schema) and Phase 6 (auth) don't exist yet — there is no `users` table or session to attach a preference to. Revisit if/when Phase 5 lands and cross-device sync becomes a real requirement.
- Kept `ColorTokens` flat (no nested `semantic.income` groupings) to mirror the flat `get_variables` output 1:1 — easiest to audit against the Pencil source, and Phase 2 atoms can build their own semantic wrappers (e.g. `Amount Display` atom deciding `incomeGreen` vs `expenseCoral`) without the token layer making that decision for them.
