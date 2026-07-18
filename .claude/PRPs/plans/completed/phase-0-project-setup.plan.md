# Plan: Phase 0 — Project Setup

## Summary
Scaffold the FollowFlow Expo (managed) + TypeScript app from an empty repo: initialize the project, lay out the `src/` folder skeleton (atomic-design tiers + infra folders), wire up `expo-router` navigation (root stack + 5-tab bottom nav matching the design), scaffold a Redux Toolkit store, create the Supabase client with env-var handling, configure ESLint/Prettier/TS-strict, and load the Geist + Inter fonts. This is pure scaffolding — no business logic, no theming, no real screen content. It establishes the foundation Phases 1–10 build on.

## User Story
As a developer starting the FollowFlow build, I want a working Expo + TypeScript project with navigation, state, and backend-client scaffolding already wired, so that Phase 1 (theming) and beyond can start writing features immediately instead of re-deciding infrastructure.

## Problem → Solution
Current state: repo contains only `design/design.pen`, `CLAUDE.md`, `.claude/phases.md` — no source code, no `package.json`, not even a git repo. → Desired state: a runnable Expo TS app (`npx expo start` boots on iOS/Android/web), 5-tab bottom navigation matching Ana Sayfa/İşlemler/Bütçeler/Hedefler/Ayarlar, Redux `Provider` wired, `src/lib/supabase.ts` exporting a typed client, ESLint+Prettier+`tsc --noEmit` all passing, Geist/Inter fonts rendering.

## Metadata
- **Complexity**: Large (many small, low-risk files across distinct subsystems — routing, state, backend client, tooling, fonts)
- **Source PRD**: `.claude/phases.md` (Phase 0 — Project Setup)
- **PRD Phase**: Phase 0 (of 11; Phase 1 = Design Tokens & Theming is next)
- **Estimated Files**: ~28 created/modified

---

## UX Design

### Before
N/A — no app exists yet.

### After
```
┌─────────────────────────────┐
│  App boots to a blank       │
│  5-tab shell:                │
│  [Ana Sayfa] placeholder     │
│  screen with bottom tab bar: │
│  Ana Sayfa | İşlemler |      │
│  Bütçeler | Hedefler |       │
│  Ayarlar                     │
│  Tapping a tab renders a     │
│  placeholder <Text> screen.  │
│  No styling/theme yet        │
│  (Phase 1) — default RN look.│
└─────────────────────────────┘
```

### Interaction Changes
| Touchpoint | Before | After | Notes |
|---|---|---|---|
| App launch | Nothing exists | Splash screen → fonts load → 5-tab shell renders | Splash hides only after Geist+Inter are loaded |
| Tab bar | N/A | 5 tabs, Turkish labels, no icons yet (Category Icon atom arrives Phase 2) | Icons are Phase 2/4 (Bottom Navigation Bar organism) |

---

## Mandatory Reading

No internal files to read (greenfield). External documentation is the authoritative source for this plan — read before implementing:

| Priority | Source | Why |
|---|---|---|
| P0 | `design/design.pen` via `mcp__pencil__get_editor_state` / `get_variables` | Confirms exact tab labels, screen inventory, and token names Phase 0's folder/nav scaffolding must anticipate (do NOT `Read`/`Grep` this file directly) |
| P0 | `/home/furkanasikdev/Projects/AI/FollowFlow/CLAUDE.md` | Full screen inventory (13 screens), 4 themes, token names, atomic-design tier counts |
| P0 | `/home/furkanasikdev/Projects/AI/FollowFlow/.claude/phases.md` | Phase 0 checklist (source of truth for scope) + later phases this scaffolding must not block |
| P1 | Expo Router docs: `src/app` directory rules | `src/app` is reserved for route files only; everything else lives in sibling `src/*` folders |
| P1 | Expo Router docs: modals (`presentation: 'formSheet'`) | Needed context for Phase 7's "Yeni İşlem Modal" — Phase 0 should not build it, but folder/route naming should not preclude it |
| P2 | Redux Toolkit TS tutorial (`configureStore`, typed hooks) | Store scaffold pattern |
| P2 | Supabase JS React Native setup (AsyncStorage storage adapter) | Client scaffold pattern |

## External Documentation

| Topic | Source | Key Takeaway |
|---|---|---|
| Expo project templates | Expo docs (`create-expo-app` reference) | `default` template ships TypeScript + Expo Router pre-wired (package.json `main`, `app.json` scheme, babel preset) with a minimal `app/` (`index.tsx` + `_layout.tsx`) plus a disposable `app-example/` folder to delete — avoids manually wiring expo-router from `blank-typescript` |
| `src/app` directory support | Expo Router reference (`router/reference/src-directory.mdx`) | Expo Router auto-detects `src/app` as route root when present (takes precedence over root `app/`); **`src/app` must contain ONLY route files** — components/hooks/utils go in sibling `src/*` dirs. This is exactly the split `phases.md`'s folder list implies (`screens`, `navigation` separate from routing) |
| Tabs + Stack composition | Expo Router tutorial (`add-navigation.mdx`, `common-navigation-patterns.mdx`) | Root `_layout.tsx` renders a `<Stack>` with a single `<Stack.Screen name="(tabs)" options={{ headerShown: false }} />`; the tabs group's own `_layout.tsx` renders `<Tabs>` with one `<Tabs.Screen>` per tab. No separate root `index.tsx` needed — `(tabs)/index.tsx` is the default route |
| Modal / bottom-sheet screens | Expo Router advanced modals (`router/advanced/modals.mdx`) | Future "Yeni İşlem Modal" (Phase 7) will be a `Stack.Screen` with `presentation: 'formSheet'` and `sheetAllowedDetents`. Not built in Phase 0, but confirms a plain `Stack` (not a separate modal library) is the right primitive |
| TS config for Expo Router | `router/migrate/from-react-navigation.mdx` | `tsconfig.json` should `extend: "expo/tsconfig.base"`, set `strict: true`, and add `paths: {"@/*": ["./src/*"]}` |
| Fonts | Expo fonts guide + `@expo-google-fonts/geist` and `@expo-google-fonts/inter` package READMEs | Both Geist and Inter are published as `@expo-google-fonts/*` packages (Geist: `Geist_400Regular` … `Geist_900Black` + italics; Inter likewise). Load via `useFonts` in the root layout with `expo-splash-screen`'s `preventAutoHideAsync()`/`hideAsync()` — **no need for local font asset files** |
| Env vars | Expo environment-variables guide | Vars prefixed `EXPO_PUBLIC_` in a root `.env` file are inlined into client code at build time and read via `process.env.EXPO_PUBLIC_*`; no extra config needed. `EXPO_NO_CLIENT_ENV_VARS=1` can disable inlining if ever needed |
| ESLint | Expo `using-eslint.mdx` + `eslint-config-expo` README | `npx expo install eslint eslint-config-expo --dev` then `npx expo lint` scaffolds a flat `eslint.config.js` extending `eslint-config-expo`. Compose additional rules (Prettier interop) on top |
| Supabase client (RN) | `supabase-js` `SupabaseClient.ts` example | `createClient(url, key, { auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false } })`, and `import 'react-native-url-polyfill/auto'` **before** `createClient` (RN lacks native `URL` support Supabase relies on) |
| Supabase key terminology | `supabase-js` docs | Newer Supabase projects issue a "publishable key" (`sb_publishable_...`) as the client-safe key, replacing the legacy JWT anon key in new projects — functionally equivalent to what `phases.md` calls "anon key"; the env var name stays `EXPO_PUBLIC_SUPABASE_ANON_KEY` regardless of which key format the Supabase project issues |
| Redux Toolkit + TS | `redux-toolkit` TS tutorial | `configureStore({ reducer: {...} })` → export `RootState`/`AppDispatch` via `ReturnType`/`typeof`; create `useAppDispatch = useDispatch.withTypes<AppDispatch>()` / `useAppSelector = useSelector.withTypes<RootState>()` in a dedicated `hooks.ts` — **do not** use bare `useDispatch`/`useSelector` anywhere else in the app |

---

## Patterns to Mirror

No internal codebase patterns exist yet (greenfield). The following are the canonical external patterns this plan establishes as the codebase's conventions going forward — later phases should mirror these exactly.

### EXPO_ROUTER_ROOT_LAYOUT
```tsx
// src/app/_layout.tsx — mirrors Expo Router docs "Define Root Layout for JavaScript Tabs"
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
```

### EXPO_ROUTER_TABS_LAYOUT
```tsx
// src/app/(tabs)/_layout.tsx — mirrors Expo Router docs "Define Tab Layout"
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: 'Ana Sayfa' }} />
      <Tabs.Screen name="islemler" options={{ title: 'İşlemler' }} />
      <Tabs.Screen name="butceler" options={{ title: 'Bütçeler' }} />
      <Tabs.Screen name="hedefler" options={{ title: 'Hedefler' }} />
      <Tabs.Screen name="ayarlar" options={{ title: 'Ayarlar' }} />
    </Tabs>
  );
}
```

### REDUX_STORE_SETUP
```typescript
// src/store/store.ts — mirrors Redux Toolkit TS tutorial
import { configureStore } from '@reduxjs/toolkit';
import appReducer from './slices/appSlice';

export const store = configureStore({
  reducer: {
    app: appReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### REDUX_TYPED_HOOKS
```typescript
// src/store/hooks.ts — mirrors Redux Toolkit TS tutorial
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './store';

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
```

### SUPABASE_CLIENT_SETUP
```typescript
// src/lib/supabase.ts — mirrors supabase-js React Native setup example
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY — check your .env file.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

### FONT_LOADING
```tsx
// Inside src/app/_layout.tsx — mirrors Expo fonts guide + @expo-google-fonts READMEs
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Geist_400Regular, Geist_600SemiBold, Geist_700Bold } from '@expo-google-fonts/geist';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Geist_400Regular,
    Geist_600SemiBold,
    Geist_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  // ... Provider + Stack (combined with EXPO_ROUTER_ROOT_LAYOUT above)
}
```

---

## Files to Change

| File | Action | Justification |
|---|---|---|
| `package.json` | CREATE (via CLI) | Generated by `create-expo-app`; scripts added for lint/format/typecheck |
| `app.json` | CREATE (via CLI) | App name "FollowFlow", slug, scheme for expo-router deep linking |
| `tsconfig.json` | UPDATE | Add `strict: true` (default already), add `@/*` path alias per Expo Router migration doc |
| `eslint.config.js` | CREATE (via `npx expo lint`) | Base `eslint-config-expo`, composed with Prettier interop |
| `.prettierrc.json` | CREATE | Formatting rules |
| `.prettierignore` | CREATE | Exclude `node_modules`, `.expo`, `dist` |
| `.env.example` | CREATE | Documents `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` without real values |
| `.gitignore` | UPDATE | Ensure `.env`, `.env.local` are ignored (verify CLI-generated one covers this) |
| `src/app/_layout.tsx` | CREATE | Root layout: font loading, splash control, Redux `Provider`, root `Stack` |
| `src/app/(tabs)/_layout.tsx` | CREATE | 5-tab `Tabs` navigator |
| `src/app/(tabs)/index.tsx` | CREATE | Ana Sayfa placeholder |
| `src/app/(tabs)/islemler.tsx` | CREATE | İşlemler placeholder |
| `src/app/(tabs)/butceler.tsx` | CREATE | Bütçeler placeholder |
| `src/app/(tabs)/hedefler.tsx` | CREATE | Hedefler placeholder |
| `src/app/(tabs)/ayarlar.tsx` | CREATE | Ayarlar placeholder |
| `src/store/store.ts` | CREATE | `configureStore` scaffold |
| `src/store/hooks.ts` | CREATE | Typed `useAppDispatch`/`useAppSelector` |
| `src/store/slices/appSlice.ts` | CREATE | Minimal placeholder slice proving reducer composition |
| `src/lib/supabase.ts` | CREATE | Supabase client |
| `src/theme/index.ts` | CREATE (placeholder) | Empty barrel + TODO comment; populated Phase 1 |
| `src/types/index.ts` | CREATE (placeholder) | Empty barrel + TODO comment; populated as entities are defined (Phase 5+) |
| `src/navigation/tabs.ts` | CREATE | Route-name/label constants consumed by `(tabs)/_layout.tsx` (satisfies `phases.md`'s explicit `navigation/` folder requirement) |
| `src/atoms/.gitkeep` | CREATE | Empty tier folder reserved for Phase 2 |
| `src/molecules/.gitkeep` | CREATE | Empty tier folder reserved for Phase 3 |
| `src/organisms/.gitkeep` | CREATE | Empty tier folder reserved for Phase 4 |
| `src/screens/.gitkeep` | CREATE | Empty folder reserved for Phase 6+ screen implementations |
| `App.tsx` / `index.ts` (template default) | DELETE | Not used once `package.json.main` points to `expo-router/entry` |
| `app-example/` (if present from `default` template) | DELETE | Disposable tutorial content per Expo's own SDK 54+ onboarding instructions |

## NOT Building

- Any real screen content (Login, Onboarding ×3, Yeni İşlem Modal, Hedef Detay, Gelir Kaynaklarım, Tekrarlayan Ödemeler, etc.) — those are Phases 6–9
- Auth stack / `(auth)` route group and auth-gated redirect logic — Phase 5/6 (no Supabase auth wiring yet, just the client)
- Theme tokens, theme context/provider, 4-mode theming — Phase 1
- Any atom/molecule/organism component implementation — Phases 2–4 (folders are created empty)
- Redux slices for real entities (`transactions`, `budgets`, `goals`, etc.) — Phase 5
- Supabase `AppState` auto-refresh listener wiring (`supabase.auth.startAutoRefresh()`/`stopAutoRefresh()`) — belongs with Phase 5/6 auth flow, not the bare client
- Bottom tab icons (Category Icon atom doesn't exist yet) — Phase 2/4
- `Yeni İşlem` modal route (`presentation: 'formSheet'`) — Phase 7, though the routing pattern is documented above for continuity
- EAS Build / app store configuration, native prebuild — out of scope for local dev setup
- Actual `.env` file with real Supabase project credentials — developer creates this locally from `.env.example`; the Supabase project itself doesn't need to exist yet for Phase 0 to be "done" (client will throw a clear error if env vars are missing, which is acceptable at this stage)

---

## Step-by-Step Tasks

### Task 1: Scaffold the Expo project
- **ACTION**: Run `npx create-expo-app@latest . --template default` in the repo root. If the CLI refuses because the directory is non-empty (it currently contains `design/`, `CLAUDE.md`, `.claude/`), scaffold into a sibling temp directory (`npx create-expo-app@latest followflow-tmp --template default`) and move all generated files/folders into the repo root, then remove `followflow-tmp/`.
- **IMPLEMENT**: Confirms `package.json`, `app.json`, `tsconfig.json`, `app/` (with `_layout.tsx` + `index.tsx`), and `app-example/` exist. Set `app.json` `expo.name` to `"FollowFlow"`, `expo.slug` to `"followflow"`.
- **MIRROR**: N/A (first task)
- **IMPORTS**: N/A
- **GOTCHA**: `create-expo-app` auto-runs `git init` + an initial commit if no `.git` exists in the target directory (this repo currently has none) — this is expected and desirable (it will include the pre-existing `design/`, `CLAUDE.md`, `.claude/` files in that first commit). If this behavior is undesired, run `git init` manually first with an initial commit of the existing files before scaffolding.
- **VALIDATE**: `cat package.json` shows `"expo-router"` in dependencies; `ls app/` shows `_layout.tsx`.

### Task 2: Delete tutorial cruft and set up `src/app`
- **ACTION**: Delete `app-example/` (SDK 54+ default template ships this as disposable reference content). Move `app/` → `src/app/` (Expo Router auto-detects `src/app` and gives it precedence).
- **IMPLEMENT**: `mkdir -p src && git mv app src/app` (or plain `mv` if not tracking yet). Remove the default `app/index.tsx`/`_layout.tsx` content — they'll be replaced by Task 4/5.
- **MIRROR**: N/A
- **IMPORTS**: N/A
- **GOTCHA**: `src/app` must contain ONLY route files (screens/layouts). Do not put components, constants, or utilities inside it — they go in sibling `src/*` folders (Task 3).
- **VALIDATE**: `npx expo start` still boots without a "no routes found" error after the move.

### Task 3: Create the folder skeleton
- **ACTION**: Create `src/{atoms,molecules,organisms,screens,navigation,store,lib,theme,types}` per `phases.md`, alongside the `src/app` created in Task 2.
- **IMPLEMENT**: `mkdir -p src/{atoms,molecules,organisms,screens,navigation,store/slices,lib,theme,types}`. Add `.gitkeep` to `atoms/`, `molecules/`, `organisms/`, `screens/` (empty until Phases 2–9). Add placeholder `src/theme/index.ts` and `src/types/index.ts`, each just `export {};` + a `// TODO(Phase N): ...` comment.
- **MIRROR**: N/A
- **IMPORTS**: N/A
- **GOTCHA**: Git does not track empty directories — `.gitkeep` (or the placeholder files above) is required or the folders silently vanish from version control.
- **VALIDATE**: `find src -maxdepth 1 -type d | sort` lists all 10 folders (`app` + the 9 from `phases.md`).

### Task 4: Add path aliases and strict TS config
- **ACTION**: Update `tsconfig.json` to add the `@/*` path alias and confirm `strict: true`.
- **IMPLEMENT**:
  ```json
  {
    "extends": "expo/tsconfig.base",
    "compilerOptions": {
      "strict": true,
      "paths": {
        "@/*": ["./src/*"]
      }
    },
    "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"]
  }
  ```
- **MIRROR**: `## External Documentation` row "TS config for Expo Router"
- **IMPORTS**: N/A
- **GOTCHA**: Metro bundler also needs to resolve `@/*` — Expo SDK 50+ Metro respects `tsconfig.json` `paths` automatically for TS resolution, but double-check by importing `@/lib/supabase` somewhere and running `npx expo start` — if it fails to resolve, add a `babel-plugin-module-resolver` entry to `babel.config.js` as a fallback.
- **VALIDATE**: `npx tsc --noEmit` passes with zero errors.

### Task 5: Build the navigation shell (root stack + 5-tab bottom nav)
- **ACTION**: Create `src/navigation/tabs.ts`, `src/app/(tabs)/_layout.tsx`, and 5 placeholder tab screens.
- **IMPLEMENT**:
  ```typescript
  // src/navigation/tabs.ts
  export const TAB_ROUTES = [
    { name: 'index', title: 'Ana Sayfa' },
    { name: 'islemler', title: 'İşlemler' },
    { name: 'butceler', title: 'Bütçeler' },
    { name: 'hedefler', title: 'Hedefler' },
    { name: 'ayarlar', title: 'Ayarlar' },
  ] as const;
  ```
  Then `src/app/(tabs)/_layout.tsx` maps over `TAB_ROUTES` to render `<Tabs.Screen>` per entry (or hardcodes them per the `EXPO_ROUTER_TABS_LAYOUT` pattern — either is fine, mapping avoids duplication). Each of `src/app/(tabs)/index.tsx`, `islemler.tsx`, `butceler.tsx`, `hedefler.tsx`, `ayarlar.tsx` is a minimal component: `<View><Text>{title}</Text></View>`.
- **MIRROR**: `EXPO_ROUTER_TABS_LAYOUT` pattern above
- **IMPORTS**: `Tabs` from `expo-router` in the layout; `View`, `Text` from `react-native` in each screen
- **GOTCHA**: Turkish characters (İ, ş, ü, ç) are fine in `title` strings but avoid them in **filenames** — use ASCII (`islemler.tsx` not `işlemler.tsx`) to sidestep filesystem/encoding edge cases on some CI runners.
- **VALIDATE**: `npx expo start`, open in a simulator/web — 5 tabs render with correct Turkish labels; tapping each renders its placeholder text.

### Task 6: Wire the root layout (fonts, splash, Stack)
- **ACTION**: Create `src/app/_layout.tsx` combining `EXPO_ROUTER_ROOT_LAYOUT` and `FONT_LOADING` patterns, plus the Redux `Provider` from Task 7.
- **IMPLEMENT**: Install fonts first: `npx expo install expo-font expo-splash-screen @expo-google-fonts/geist @expo-google-fonts/inter`. Compose the layout per the two patterns above.
- **MIRROR**: `EXPO_ROUTER_ROOT_LAYOUT` + `FONT_LOADING`
- **IMPORTS**: `Stack` from `expo-router`; `useFonts` from `expo-font`; `SplashScreen` from `expo-splash-screen`; font weight exports from `@expo-google-fonts/geist` and `@expo-google-fonts/inter`; `Provider` from `react-redux`; `store` from `@/store/store`
- **GOTCHA**: `SplashScreen.preventAutoHideAsync()` must run at module scope (outside the component), not inside `useEffect`, or there's a race where the splash hides before the guard is registered.
- **VALIDATE**: Cold-start the app — splash screen stays visible briefly then the tab shell renders with no flash of unstyled/system-font text.

### Task 7: Scaffold the Redux Toolkit store
- **ACTION**: Install `@reduxjs/toolkit react-redux`, create `src/store/slices/appSlice.ts`, `src/store/store.ts`, `src/store/hooks.ts`.
- **IMPLEMENT**: `appSlice` holds a trivial `{ bootstrapped: boolean }` state with a `setBootstrapped` reducer — exists only to prove the reducer-composition pattern for Phase 1 (theme slice) and Phase 5 (entity slices) to copy. Wire `<Provider store={store}>` around the `<Stack>` in `src/app/_layout.tsx` (Task 6).
- **MIRROR**: `REDUX_STORE_SETUP` + `REDUX_TYPED_HOOKS`
- **IMPORTS**: `configureStore`, `createSlice` from `@reduxjs/toolkit`; `useDispatch`, `useSelector`, `Provider` from `react-redux`
- **GOTCHA**: `configureStore({ reducer: {} })` (empty reducer map) is technically legal but produces a useless `RootState = {}` — always include at least one real slice (`appSlice` here) so `RootState`/`AppDispatch` inference has something to type-check against.
- **VALIDATE**: `npx tsc --noEmit` passes; a temporary `useAppSelector((s) => s.app.bootstrapped)` call in a tab screen compiles and returns `false` without runtime error.

### Task 8: Create the Supabase client
- **ACTION**: Install `@supabase/supabase-js @react-native-async-storage/async-storage react-native-url-polyfill`, create `src/lib/supabase.ts`, create `.env.example`.
- **IMPLEMENT**: Exactly the `SUPABASE_CLIENT_SETUP` pattern above. `.env.example` contains:
  ```
  EXPO_PUBLIC_SUPABASE_URL=
  EXPO_PUBLIC_SUPABASE_ANON_KEY=
  ```
- **MIRROR**: `SUPABASE_CLIENT_SETUP`
- **IMPORTS**: `createClient` from `@supabase/supabase-js`; `AsyncStorage` from `@react-native-async-storage/async-storage`; side-effect import `react-native-url-polyfill/auto`
- **GOTCHA**: The `react-native-url-polyfill/auto` import MUST come before the `@supabase/supabase-js` import in the file — RN's JS engine (Hermes) lacks a spec-compliant `URL` global that `supabase-js` needs internally, and import order determines polyfill registration timing.
- **VALIDATE**: Create a local (gitignored) `.env` with placeholder-but-valid-looking values (e.g. `https://example.supabase.co` + a dummy JWT-shaped string), run `npx expo start`, confirm no throw from the guard clause and `import { supabase } from '@/lib/supabase'` resolves without error anywhere it's referenced.

### Task 9: Configure ESLint + Prettier
- **ACTION**: Install and configure linting/formatting.
- **IMPLEMENT**: `npx expo install eslint eslint-config-expo --dev`, then `npx expo lint` to scaffold `eslint.config.js`. Install `prettier eslint-config-prettier --save-dev`, add a `.prettierrc.json` (e.g. `{ "singleQuote": true, "trailingComma": "all" }`) and `.prettierignore` (`node_modules`, `.expo`, `dist`). Extend `eslint.config.js`'s exported array with `eslint-config-prettier` last (to disable stylistic rules ESLint would otherwise fight Prettier over). Add `package.json` scripts: `"lint": "expo lint"`, `"format": "prettier --write ."`, `"format:check": "prettier --check ."`, `"typecheck": "tsc --noEmit"`.
- **MIRROR**: External Documentation row "ESLint"
- **IMPORTS**: N/A (config-only)
- **GOTCHA**: `eslint-config-prettier` must be LAST in the config array/extends chain, otherwise its rule-disabling gets overridden by configs loaded after it.
- **VALIDATE**: `npm run lint` and `npm run format:check` both exit 0 on the freshly scaffolded codebase; `npm run typecheck` exits 0.

### Task 10: Final sweep — `.gitignore`, README-less verification
- **ACTION**: Confirm `.gitignore` (CLI-generated) covers `.env`, `.env.local`, `node_modules`, `.expo`, `dist`. Confirm no stray `App.tsx`/`index.ts` remains outside `src/app` that would fight `expo-router/entry` as the app entry point (`package.json` `"main"` should be `"expo-router/entry"` — the `default` template sets this already).
- **IMPLEMENT**: `grep -E '\.env|node_modules|\.expo' .gitignore`; if `.env` (bare, not just `.env.local`) is missing, append it.
- **MIRROR**: N/A
- **IMPORTS**: N/A
- **GOTCHA**: The `default` template's generated `.gitignore` may only ignore `.env*.local`, not a bare `.env` — since this plan's `.env` file holds real (if placeholder-stage) Supabase credentials once a developer fills it in, a bare `.env` entry is required.
- **VALIDATE**: `git status` after creating a local `.env` shows it as untracked/ignored, not staged.

---

## Testing Strategy

Phase 0 has no business logic to unit-test — it is infrastructure scaffolding. Automated test suites begin once real logic exists (Phase 5 data layer onward). Validation here is static analysis + manual smoke test.

### Unit Tests
| Test | Input | Expected Output | Edge Case? |
|---|---|---|---|
| N/A | — | — | Deferred — no business logic exists yet in Phase 0 |

### Edge Cases Checklist
- [ ] App boots with no `.env` file present → `src/lib/supabase.ts` throws a clear, actionable error (not a cryptic one) instead of silently proceeding with `undefined` credentials
- [ ] App boots on web (`npx expo start --web`), iOS simulator, and Android emulator without platform-specific crashes
- [ ] Cold start shows splash screen, not a flash of unstyled content, before fonts finish loading
- [ ] TypeScript path alias (`@/*`) resolves both in `tsc` and in the Metro bundler at runtime

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
EXPECT: Zero ESLint errors/warnings

```bash
npm run format:check
```
EXPECT: All files match Prettier formatting

### Unit Tests
N/A for Phase 0 — no test runner is configured yet (introduce Jest/RTL when Phase 2 atoms need snapshot/interaction tests, or earlier if desired, but it's not a Phase 0 checklist item per `phases.md`).

### Full Test Suite
N/A — see above.

### Database Validation
N/A — Supabase schema/tables are Phase 5. Phase 0 only needs the client to instantiate; no live project connection is required to consider Phase 0 complete.

### Browser/Device Validation
```bash
npx expo start
```
EXPECT: QR/dev server starts cleanly; pressing `w` opens web, `i`/`a` open iOS/Android simulators (if installed) and the 5-tab shell renders with correct Turkish labels and no red-box errors.

### Manual Validation
- [ ] `npx expo start --web` → app loads, tab bar shows Ana Sayfa/İşlemler/Bütçeler/Hedefler/Ayarlar in that order
- [ ] Tapping each tab renders its own placeholder text (proves each route file resolves independently)
- [ ] Geist and Inter fonts visibly differ from the system default font on the placeholder screens (spot-check by temporarily applying `fontFamily: 'Geist_700Bold'` / `'Inter_400Regular'` to one placeholder's text)
- [ ] `console.log(store.getState())` (temporary, removed after) shows `{ app: { bootstrapped: false } }`
- [ ] With a local `.env` containing placeholder Supabase values, `import { supabase } from '@/lib/supabase'` doesn't throw at import time

---

## Acceptance Criteria
- [ ] All 10 tasks completed
- [ ] All validation commands pass
- [ ] No type errors (`tsc --noEmit`)
- [ ] No lint errors (`expo lint`)
- [ ] 5-tab bottom navigation renders and matches `phases.md`'s tab order/labels
- [ ] `src/{atoms,molecules,organisms,screens,navigation,store,lib,theme,types}` all exist
- [ ] Redux `Provider` wraps the app; `store.getState()` returns a typed, non-empty state
- [ ] `src/lib/supabase.ts` exports a client and fails loudly (not silently) when env vars are absent

## Completion Checklist
- [ ] Code follows the patterns captured in `## Patterns to Mirror` (they ARE the codebase convention going forward — nothing pre-existing to diverge from)
- [ ] Error handling: Supabase client throws on missing env vars (only "error handling" surface in this phase)
- [ ] No hardcoded Supabase URL/key — only `process.env.EXPO_PUBLIC_*`
- [ ] `.env` is gitignored; `.env.example` is committed
- [ ] No unnecessary scope additions (no auth screens, no theming, no real components — see `## NOT Building`)
- [ ] Self-contained — a developer with only this plan (plus `CLAUDE.md`) should not need to ask questions or search the (nonexistent) codebase

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `create-expo-app` refuses to scaffold into the non-empty repo root | Medium | Low (blocks Task 1 briefly) | Task 1 documents the temp-dir-and-move fallback |
| `create-expo-app`'s auto `git init` behaves unexpectedly since this repo currently has no `.git` at all | Low | Low | Task 1 gotcha calls this out; developer can `git init` + commit existing files first if they want that commit to be separate from the scaffold commit |
| Metro doesn't pick up the `@/*` tsconfig path alias at runtime (only `tsc` respects it) | Low–Medium | Medium (imports fail at runtime despite passing typecheck) | Task 4 gotcha documents the `babel-plugin-module-resolver` fallback |
| Supabase project doesn't exist yet, so real credentials aren't available to fully validate the client end-to-end | High (expected at this phase) | Low | Explicitly scoped as acceptable in `## NOT Building`; client only needs to instantiate, not connect, for Phase 0 sign-off |
| Expo SDK version drifts between when this plan was written and when it's implemented (docs referenced SDK 54–57 branches) | Medium | Low | Always use `create-expo-app@latest` / `expo install` (not pinned versions) so the implementer gets whatever is current and mutually compatible; re-verify `src/app` and `expo-router` setup steps still match if the SDK major version has jumped |

## Notes
- This repo is not currently a git repository (`git` not initialized). Task 1's gotcha addresses this — `create-expo-app` will likely initialize it automatically, folding in the pre-existing `design/`, `CLAUDE.md`, `.claude/` files.
- `design/design.pen` must never be read/grepped directly — its screen/tab/token details were already extracted into `CLAUDE.md` (read in Phase 0 research) and are sufficient for this plan; no Pencil MCP calls were needed for scaffolding-only work.
- Package manager: commands above use `npm`/`npx` for concreteness; `yarn`/`pnpm`/`bun` equivalents work identically (Expo docs cover all four) — pick one and stay consistent across the team.
- The `navigation/` folder mandated by `phases.md` is deliberately thin (just `tabs.ts` route/label constants) because `expo-router` itself absorbs most traditional "navigation config" — this is a conscious adaptation of the original folder list to file-based routing, not a deviation from intent.
