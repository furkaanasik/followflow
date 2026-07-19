# Plan: i18n & Formatting (Phase 7)

## Summary
Add an i18next-based internationalization layer (Turkish base + English) with typed translation keys, device-locale detection, and persisted language preference — then retrofit the 4 existing Phase 6 screens (Login + 3 onboarding) to pull every user-facing string from translation files. Add `src/lib/format.ts` with `Intl`-based currency/number/date helpers (₺ / TR grouping) that the upcoming transaction and budget screens depend on.

## User Story
As a FollowFlow user, I want the app to display in my device's language (Turkish or English) with correctly formatted currency, numbers, and dates, so that the interface feels native and money amounts are unambiguous.

## Problem → Solution
Every string is currently hardcoded Turkish inline in screens; there is no formatting utility → All strings live in `src/i18n/locales/{tr,en}.json` behind a typed `t()` function, language is device-detected + persisted (mirroring the existing theme plumbing), and a shared `format.ts` centralizes ₺/number/date formatting.

## Metadata
- **Complexity**: Medium
- **Source PRD**: `.claude/phases.md`
- **PRD Phase**: Phase 7 — i18n & Formatting
- **Estimated Files**: 7 new, 8 updated

---

## UX Design

### Before
```
┌─────────────────────────────┐
│ Device language = English    │
│ App shows: "Giriş Yap",      │
│ "Gelir Kaynağını Ekle" …     │  ← always Turkish, hardcoded
│ Amounts typed/shown ad-hoc   │
└─────────────────────────────┘
```

### After
```
┌─────────────────────────────┐
│ Device language = English    │
│ App shows: "Sign In",        │
│ "Add Income Source" …        │  ← t() resolves per device locale
│ Fallback = Turkish (tr)      │
│ Amounts via formatCurrency() │  → "₺1.234,56"
└─────────────────────────────┘
```

### Interaction Changes
| Touchpoint | Before | After | Notes |
|---|---|---|---|
| First launch | Turkish only | Device locale → `tr` or `en`, fallback `tr` | Detected via `expo-localization` |
| Language persistence | none | Persisted in AsyncStorage + Redux | Switcher UI is **Phase 10**, not now |
| Currency display | manual strings | `formatCurrency(1234.56)` → `₺1.234,56` | `Intl.NumberFormat('tr-TR', TRY)` |

---

## Mandatory Reading

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 | `src/theme/ThemeProvider.tsx` | 1-81 | **The exact persistence pattern to mirror** for `LanguageProvider` (AsyncStorage hydrate-on-mount + write-on-change + context) |
| P0 | `src/store/slices/themeSlice.ts` | 1-25 | Slice pattern to mirror for `languageSlice` |
| P0 | `src/store/store.ts` | 1-26 | Where to register the `language` reducer |
| P0 | `src/app/_layout.tsx` | 145-186 | Where to init i18n + wrap `LanguageProvider`; also owns 2 strings to retrofit (lines 97, 107) |
| P0 | `src/screens/LoginScreen.tsx` | 110-285 | Densest string retrofit incl. 2 interpolations (min-length, email) |
| P1 | `src/screens/OnboardingIncomeSourceScreen.tsx` | 27-179 | Onboarding retrofit template (labels/placeholders/validation/toggle/step badge) |
| P1 | `src/screens/OnboardingRecurringPaymentScreen.tsx` | 28-192 | Same shape as income screen |
| P1 | `src/screens/OnboardingGoalScreen.tsx` | 55-167 | Optional-field variant + 2 error strings |
| P2 | `src/atoms/AmountDisplay.tsx` | 1-40 | Confirms atom takes **pre-formatted** `amount: string` → `format.ts` is decoupled, feeds this |
| P2 | `tsconfig.json` | 1-11 | `@/*` alias; confirm `resolveJsonModule` (inherited from `expo/tsconfig.base`) |
| P2 | `app.json` | plugins | Add `expo-localization` to the `plugins` array |

## External Documentation

| Topic | Source | Key Takeaway |
|---|---|---|
| react-i18next RN init | context7 `/i18next/react-i18next` | `i18n.use(initReactI18next).init({ resources, fallbackLng, lng })` with **bundled** JSON — no http backend. Set `react: { useSuspense: false }` (RN has no Suspense boundary here). |
| Typed keys | context7 `/i18next/i18next` | `declare module 'i18next' { interface CustomTypeOptions { defaultNS: 'translation'; resources: { translation: typeof tr } } }` |
| Device locale | context7 `/websites/expo_dev_versions` | `getLocales()[0].languageCode` → `"tr"` / `"en"`; add `"expo-localization"` to `app.json` plugins |
| `useTranslation` | context7 `/i18next/react-i18next` | `const { t } = useTranslation();` then `t('auth.signIn')`, `t('validation.passwordMinLength', { min: 8 })` |

---

## Patterns to Mirror

Follow these exactly — new code must be indistinguishable from existing.

### PERSISTENCE_PROVIDER
```tsx
// SOURCE: src/theme/ThemeProvider.tsx:33-71 — mirror this for LanguageProvider
const THEME_STORAGE_KEY = '@followflow/theme-mode';
export function ThemeProvider({ children }: { children: ReactNode }) {
  const mode = useAppSelector((state) => state.theme.mode);
  const dispatch = useAppDispatch();
  const hydrated = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((stored) => { if (isThemeMode(stored)) dispatch(setThemeMode(stored)); })
      .catch(() => {})
      .finally(() => { hydrated.current = true; });
  }, [dispatch]);

  useEffect(() => {
    if (!hydrated.current) return;
    AsyncStorage.setItem(THEME_STORAGE_KEY, mode).catch(() => {});
  }, [mode]);

  const setMode = useCallback((next: ThemeMode) => dispatch(setThemeMode(next)), [dispatch]);
  const value = useMemo(() => ({ ...getThemeTokens(mode), setMode }), [mode, setMode]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
```

### REDUX_SLICE
```ts
// SOURCE: src/store/slices/themeSlice.ts:1-25 — mirror this for languageSlice
const initialState: ThemeState = { mode: 'dark' };
const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setThemeMode: (state, action: PayloadAction<ThemeMode>) => { state.mode = action.payload; },
  },
});
export const { setThemeMode } = themeSlice.actions;
export default themeSlice.reducer;
```

### STORE_REGISTRATION
```ts
// SOURCE: src/store/store.ts:10-20
export const store = configureStore({
  reducer: {
    app: appReducer,
    auth: authReducer,
    onboarding: onboardingReducer,
    theme: themeReducer,
    // ADD: language: languageReducer,
    [api.reducerPath]: api.reducer,
  },
  ...
});
```

### STRING_SITE (validation with interpolation — the pattern to convert)
```tsx
// SOURCE: src/screens/LoginScreen.tsx:117-135 (BEFORE)
if (!email.trim()) { setEmailError('E-posta adresi gerekli.'); valid = false; }
else if (!EMAIL_PATTERN.test(email.trim())) { setEmailError('Geçerli bir e-posta adresi gir.'); valid = false; }
...
if (password.length < PASSWORD_MIN_LENGTH) {
  setPasswordError(`Şifre en az ${PASSWORD_MIN_LENGTH} karakter olmalı.`); valid = false;
}
// AFTER:
if (!email.trim()) { setEmailError(t('validation.emailRequired')); valid = false; }
else if (!EMAIL_PATTERN.test(email.trim())) { setEmailError(t('validation.emailInvalid')); valid = false; }
...
if (password.length < PASSWORD_MIN_LENGTH) {
  setPasswordError(t('validation.passwordMinLength', { min: PASSWORD_MIN_LENGTH })); valid = false;
}
```

### THEME_CONSUMER (how a hook is consumed in a screen — model useTranslation identically)
```tsx
// SOURCE: src/screens/LoginScreen.tsx:77-78
export function LoginScreen() {
  const theme = useTheme();
  // ADD: const { t } = useTranslation();
```

---

## Files to Change

| File | Action | Justification |
|---|---|---|
| `package.json` / lockfile | UPDATE | Add `i18next`, `react-i18next`, `expo-localization` (via `npx expo install`) |
| `app.json` | UPDATE | Add `"expo-localization"` to `plugins` |
| `src/i18n/locales/tr.json` | CREATE | Base (source-of-truth) translations |
| `src/i18n/locales/en.json` | CREATE | English translations (same key shape) |
| `src/i18n/index.ts` | CREATE | i18next init + `getDeviceLanguage()` + `SUPPORTED_LANGUAGES` |
| `src/i18n/LanguageProvider.tsx` | CREATE | AsyncStorage/Redux/i18next sync (mirrors ThemeProvider) + `useLanguage()` |
| `src/store/slices/languageSlice.ts` | CREATE | `language` state (mirrors themeSlice) |
| `src/types/i18next.d.ts` | CREATE | Typed-key module augmentation |
| `src/lib/format.ts` | CREATE | `formatCurrency` / `formatNumber` / `formatDate` / `parseAmount` |
| `src/store/store.ts` | UPDATE | Register `language` reducer |
| `src/app/_layout.tsx` | UPDATE | `import '@/i18n'`, wrap `LanguageProvider`, retrofit 2 strings |
| `src/screens/LoginScreen.tsx` | UPDATE | Retrofit ~20 strings + 2 interpolations |
| `src/screens/OnboardingIncomeSourceScreen.tsx` | UPDATE | Retrofit strings |
| `src/screens/OnboardingRecurringPaymentScreen.tsx` | UPDATE | Retrofit strings |
| `src/screens/OnboardingGoalScreen.tsx` | UPDATE | Retrofit strings |

## NOT Building
- **Language switcher UI** — explicitly deferred to Phase 10 (Ayarlar). This phase only lands the plumbing + persistence.
- **Localizing Supabase server error messages** — server returns English; mapping error codes → localized copy is a separate concern. Only screen-owned validation/form/banner strings are retrofitted.
- **Localizing thrown errors in `src/lib/auth.ts`** (`'Google sign-in cancelled.'` etc.) — out of scope; they surface rarely and are English by nature. Leave as-is.
- **Refactoring the untouched placeholder tab screens** (`src/app/(tabs)/*.tsx`) — those are Phase 8-10 stubs.
- **RTL layout support** — tr/en are both LTR.
- **Pluralization tables** — no string needs plurals yet (`{{min}}`/`{{current}}` are plain interpolation, not `count`).

---

## Step-by-Step Tasks

### Task 1: Install dependencies
- **ACTION**: Install i18n + localization packages with Expo-pinned versions.
- **IMPLEMENT**: `npx expo install expo-localization && npm install i18next react-i18next`
- **GOTCHA**: Use `npx expo install` (not bare npm) for `expo-localization` so the native version matches SDK 57. `i18next`/`react-i18next` are pure JS — plain `npm install` (latest, React 19-compatible) is fine.
- **VALIDATE**: `node -e "require('i18next'); require('react-i18next'); require('expo-localization')"` resolves; `package.json` lists all three.

### Task 2: Add expo-localization config plugin
- **ACTION**: Register the plugin in `app.json`.
- **IMPLEMENT**: In `app.json` `expo.plugins`, add `"expo-localization"` alongside `"expo-router"`, `"expo-splash-screen"`, `"expo-font"`.
- **GOTCHA**: A plugins change requires a native rebuild for custom dev clients (`npx expo prebuild` / rebuild dev client). `expo-localization` is bundled in Expo Go, so Expo Go needs no rebuild.
- **VALIDATE**: `app.json` parses as valid JSON; plugin string present.

### Task 3: Create translation files (tr base + en)
- **ACTION**: Create `src/i18n/locales/tr.json` and `en.json` with a single `translation` namespace, nested by area.
- **IMPLEMENT**: Use the key map in **Testing Strategy → Key Inventory** below. `tr.json` values = the exact current Turkish strings (copied verbatim from the screens); `en.json` = English equivalents with identical keys and identical `{{placeholders}}`.
- **GOTCHA**: Interpolation placeholders must match exactly across both files: `{{email}}`, `{{min}}`, `{{current}}`, `{{total}}`. Preserve the ellipsis character `…` and `₺0,00` verbatim in `tr.json`.
- **VALIDATE**: Both files are valid JSON; `en.json` and `tr.json` have identical key sets (see Task 12 diff check).

### Task 4: Create typed-keys declaration
- **ACTION**: Create `src/types/i18next.d.ts`.
- **IMPLEMENT**:
  ```ts
  import 'i18next';
  import type tr from '@/i18n/locales/tr.json';

  declare module 'i18next' {
    interface CustomTypeOptions {
      defaultNS: 'translation';
      resources: { translation: typeof tr };
    }
  }
  ```
- **MIRROR**: External docs `/i18next/i18next` CustomTypeOptions pattern.
- **GOTCHA**: Requires `resolveJsonModule` (inherited from `expo/tsconfig.base` — confirm; if `tsc` errors on the JSON import, add `"resolveJsonModule": true` to `tsconfig.json` `compilerOptions`). `tr.json` is the source of truth for key types — `en.json` is structurally validated by the Task 12 diff, not by TS.
- **VALIDATE**: `npm run typecheck` — `t('auth.signIn')` type-checks; `t('nope')` would error.

### Task 5: Create i18n init module
- **ACTION**: Create `src/i18n/index.ts`.
- **IMPLEMENT**:
  ```ts
  import { getLocales } from 'expo-localization';
  import i18n from 'i18next';
  import { initReactI18next } from 'react-i18next';

  import en from './locales/en.json';
  import tr from './locales/tr.json';

  export const SUPPORTED_LANGUAGES = ['tr', 'en'] as const;
  export type Language = (typeof SUPPORTED_LANGUAGES)[number];
  export const FALLBACK_LANGUAGE: Language = 'tr';

  export function isLanguage(value: string | null | undefined): value is Language {
    return value != null && (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
  }

  export function getDeviceLanguage(): Language {
    const code = getLocales()[0]?.languageCode;
    return isLanguage(code) ? code : FALLBACK_LANGUAGE;
  }

  i18n.use(initReactI18next).init({
    resources: { tr: { translation: tr }, en: { translation: en } },
    lng: getDeviceLanguage(),
    fallbackLng: FALLBACK_LANGUAGE,
    supportedLngs: SUPPORTED_LANGUAGES,
    defaultNS: 'translation',
    interpolation: { escapeValue: false }, // RN/React escapes already
    react: { useSuspense: false }, // no Suspense boundary around the RN tree
  });

  export default i18n;
  ```
- **MIRROR**: External docs `/i18next/react-i18next` RN init (minus the http backend / language-detector plugin — we detect via expo-localization + persist ourselves).
- **GOTCHA**: `init()` is synchronous with bundled resources, so `t()` is ready on first render — no `ready` gating needed. `getLocales()` is synchronous and safe at module load.
- **VALIDATE**: `npm run typecheck`; import side-effect runs once.

### Task 6: Create languageSlice
- **ACTION**: Create `src/store/slices/languageSlice.ts`.
- **IMPLEMENT**: Mirror `themeSlice` exactly.
  ```ts
  import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
  import { FALLBACK_LANGUAGE, type Language } from '@/i18n';

  interface LanguageState { language: Language; }
  const initialState: LanguageState = { language: FALLBACK_LANGUAGE };

  const languageSlice = createSlice({
    name: 'language',
    initialState,
    reducers: {
      setLanguage: (state, action: PayloadAction<Language>) => { state.language = action.payload; },
    },
  });

  export const { setLanguage } = languageSlice.actions;
  export default languageSlice.reducer;
  ```
- **MIRROR**: REDUX_SLICE pattern.
- **GOTCHA**: Initial `language` is the static fallback `'tr'`; the real resolved language is applied by `LanguageProvider` on mount (same as theme's static `'dark'` default that hydration overrides). UI text reads from i18n (already device-correct at init), not from this slice, so the pre-hydration window is invisible.
- **VALIDATE**: `npm run typecheck`.

### Task 7: Register the language reducer
- **ACTION**: Add `language` to the store.
- **IMPLEMENT**: Import `languageReducer from './slices/languageSlice'`; add `language: languageReducer,` to the `reducer` map in `src/store/store.ts`.
- **MIRROR**: STORE_REGISTRATION.
- **VALIDATE**: `npm run typecheck`; `RootState` now has `language`.

### Task 8: Create LanguageProvider
- **ACTION**: Create `src/i18n/LanguageProvider.tsx` mirroring ThemeProvider (hydrate → write → context).
- **IMPLEMENT**:
  ```tsx
  import AsyncStorage from '@react-native-async-storage/async-storage';
  import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react';

  import i18n, { getDeviceLanguage, isLanguage, type Language } from '@/i18n';
  import { useAppDispatch, useAppSelector } from '@/store/hooks';
  import { setLanguage } from '@/store/slices/languageSlice';

  const LANGUAGE_STORAGE_KEY = '@followflow/language';

  interface LanguageContextValue { language: Language; setLanguage: (lng: Language) => void; }
  const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

  export function LanguageProvider({ children }: { children: ReactNode }) {
    const language = useAppSelector((s) => s.language.language);
    const dispatch = useAppDispatch();
    const hydrated = useRef(false);

    useEffect(() => {
      AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)
        .then((stored) => {
          // Stored preference wins; otherwise adopt the device language so
          // Redux matches what i18n was initialized with.
          dispatch(setLanguage(isLanguage(stored) ? stored : getDeviceLanguage()));
        })
        .catch(() => {})
        .finally(() => { hydrated.current = true; });
    }, [dispatch]);

    useEffect(() => {
      if (i18n.resolvedLanguage !== language) i18n.changeLanguage(language);
      if (!hydrated.current) return;
      AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language).catch(() => {});
    }, [language]);

    const setLang = useCallback((next: Language) => dispatch(setLanguage(next)), [dispatch]);
    const value = useMemo(() => ({ language, setLanguage: setLang }), [language, setLang]);
    return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
  }

  export function useLanguage(): LanguageContextValue {
    const ctx = useContext(LanguageContext);
    if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider.');
    return ctx;
  }
  ```
- **MIRROR**: PERSISTENCE_PROVIDER (ThemeProvider) — same `hydrated` ref guard, same catch-and-ignore on storage failure.
- **GOTCHA**: The write-effect also drives `i18n.changeLanguage` so the persisted/dispatched language and i18n stay in lockstep (the guard `resolvedLanguage !== language` avoids a redundant re-init on first paint). `useLanguage()` exists for the Phase 10 switcher; it is intentionally unused this phase.
- **VALIDATE**: `npm run typecheck`; provider renders without throwing.

### Task 9: Wire init + provider into the app root
- **ACTION**: Initialize i18n and mount `LanguageProvider` in `src/app/_layout.tsx`.
- **IMPLEMENT**:
  - Add `import '@/i18n';` at the top (side-effect init, runs before first render).
  - Add `import { LanguageProvider } from '@/i18n/LanguageProvider';`.
  - Add `import { useTranslation } from 'react-i18next';`.
  - Wrap inside `ThemeProvider`: `<ThemeProvider><LanguageProvider><RootNavigator /></LanguageProvider></ThemeProvider>`.
  - In `RootNavigator`, add `const { t } = useTranslation();` and replace the two literals:
    - line 97 `Bağlantı kurulamadı. İnternetini kontrol edip tekrar dene.` → `{t('common.connectionError')}`
    - line 107 `Tekrar dene` → `{t('common.retry')}`
- **MIRROR**: THEME_CONSUMER (hook usage) and the existing Provider nesting at `_layout.tsx:180-185`.
- **GOTCHA**: `LanguageProvider` must sit **inside** `<Provider store={store}>` (it uses `useAppSelector`) and can sit inside or beside `ThemeProvider` — nest it inside ThemeProvider for symmetry. The `import '@/i18n'` must run before any component calls `t()`.
- **VALIDATE**: App boots; connection-error state (kill network on the profile query) shows localized strings.

### Task 10: Retrofit LoginScreen
- **ACTION**: Replace all hardcoded strings in `src/screens/LoginScreen.tsx` with `t(...)`.
- **IMPLEMENT**: Add `const { t } = useTranslation();`. Map (see Key Inventory): tagline, segmented `Giriş Yap`/`Kayıt Ol`, `primaryLabel` branches (`signIn`/`signUp`/`signingIn`/`creatingAccount`), field labels/placeholders, `Şifreyi göster`/`Şifreyi gizle`, Google button `Google ile Devam Et`/`Bağlanıyor…`, and validation errors. Interpolations:
  - `t('validation.passwordMinLength', { min: PASSWORD_MIN_LENGTH })`
  - `t('auth.confirmEmailSent', { email: email.trim() })`
- **MIRROR**: STRING_SITE.
- **GOTCHA**: `primaryLabel` (lines 162-168) is computed before JSX — `t` is in scope there since it's a hook at the top of the component. Keep the `FollowFlow` brand word as a literal (not translated).
- **VALIDATE**: `npm run typecheck` (all keys resolve); screen renders; toggle sign-in/up flips labels.

### Task 11: Retrofit the 3 onboarding screens
- **ACTION**: Replace hardcoded strings in `OnboardingIncomeSourceScreen`, `OnboardingRecurringPaymentScreen`, `OnboardingGoalScreen`.
- **IMPLEMENT**: Add `const { t } = useTranslation();` to each. Convert `FREQUENCY_OPTIONS` from a module constant into a value built **inside** the component so labels can call `t` (e.g. `const FREQUENCY_OPTIONS = [{ label: t('onboarding.monthly'), value: 'monthly' }, { label: t('onboarding.weekly'), value: 'weekly' }];`). Convert titles, subtitles, field labels/placeholders, `StepBadge` labels via `t('onboarding.step', { current: 1, total: 3 })`, `SegmentedToggle` frequency labels, `Tekrar Sıklığı` label, button labels (`saveContinue`/`saving`/goal `save`), and every validation/`formError` string.
- **MIRROR**: STRING_SITE; income screen is the template for the other two.
- **GOTCHA**: `FREQUENCY_OPTIONS` currently lives at module scope (line 27/28) — it **must** move inside the component (or a `useMemo`) to access `t`; leaving it at module scope would freeze it to load-time language. Goal screen has two distinct errors: `saveFailed` (save path) and `genericError` (`Bir şeyler ters gitti. Tekrar dene.`, skip path) — keep them distinct.
- **VALIDATE**: `npm run typecheck`; all three screens render; step badges read `ADIM 1/3` (tr) / `STEP 1/3` (en).

### Task 12: Create format.ts
- **ACTION**: Create `src/lib/format.ts` with Intl helpers.
- **IMPLEMENT**:
  ```ts
  const DEFAULT_LOCALE = 'tr-TR';
  const CURRENCY = 'TRY';

  export function formatCurrency(
    value: number,
    options: { locale?: string; maximumFractionDigits?: number } = {},
  ): string {
    const { locale = DEFAULT_LOCALE, maximumFractionDigits = 2 } = options;
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: CURRENCY,
      minimumFractionDigits: 2,
      maximumFractionDigits,
    }).format(value);
  }

  export function formatNumber(
    value: number,
    options: { locale?: string; maximumFractionDigits?: number } = {},
  ): string {
    const { locale = DEFAULT_LOCALE, maximumFractionDigits = 2 } = options;
    return new Intl.NumberFormat(locale, { maximumFractionDigits }).format(value);
  }

  export function formatDate(
    value: Date | string | number,
    options: Intl.DateTimeFormatOptions & { locale?: string } = {},
  ): string {
    const { locale = DEFAULT_LOCALE, ...rest } = options;
    const date = value instanceof Date ? value : new Date(value);
    return new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      ...rest,
    }).format(date);
  }

  // Inverse of the amount inputs: accepts TR ("1.234,56") or plain ("1234.56").
  // Preserves the existing screens' comma→dot behavior; strips ₺ and spaces.
  export function parseAmount(input: string): number {
    const cleaned = input.replace(/[^\d.,-]/g, '');
    const normalized =
      cleaned.includes(',') && cleaned.includes('.')
        ? cleaned.replace(/\./g, '').replace(',', '.') // dot = grouping
        : cleaned.replace(',', '.');
    return Number(normalized);
  }
  ```
- **GOTCHA**: `formatCurrency` always uses `tr-TR` grouping + TRY per the phase spec ("₺, TR digit grouping") regardless of UI language — the app's money is Turkish Lira. `parseAmount` intentionally mirrors the current `Number(x.replace(',', '.'))` semantics so retrofitting call sites (optional, this phase) causes no behavior change. **Do not** wire `parseAmount` into the onboarding screens in this phase unless trivially safe — the existing inline parses already work; format.ts exists primarily for the upcoming Phase 8-9 screens.
- **VALIDATE**: `npm run typecheck`; unit-check `formatCurrency(1234.56) === '₺1.234,56'` on-device (see Risks re: Hermes Intl).

### Task 13: Cross-file consistency checks
- **ACTION**: Verify key parity + no orphan strings.
- **IMPLEMENT**:
  - Key parity: `node -e "const a=require('./src/i18n/locales/tr.json'),b=require('./src/i18n/locales/en.json');const f=(o,p='')=>Object.entries(o).flatMap(([k,v])=>typeof v==='object'?f(v,p+k+'.'):[p+k]);const ta=f(a).sort(),tb=f(b).sort();console.log(JSON.stringify(ta)===JSON.stringify(tb)?'PARITY OK':'MISMATCH\n'+ta.filter(x=>!tb.includes(x))+'\n'+tb.filter(x=>!ta.includes(x)))"`
  - Orphan Turkish scan on retrofitted files (should return nothing meaningful): `grep -nE "'[^']*[çğıöşüÇĞİÖŞÜ][^']*'" src/screens/*.tsx src/app/_layout.tsx` — remaining hits should only be identifiers/comments.
- **VALIDATE**: `PARITY OK`; grep shows no leftover Turkish UI literals.

---

## Testing Strategy

### Key Inventory (build tr.json to this shape; en.json = same keys)
| Key | tr value (verbatim) | en value |
|---|---|---|
| `common.retry` | `Tekrar dene` | `Try again` |
| `common.connectionError` | `Bağlantı kurulamadı. İnternetini kontrol edip tekrar dene.` | `Couldn't connect. Check your internet and try again.` |
| `auth.tagline` | `Bütün finansal hayatın, tek ekranda.` | `Your whole financial life, on one screen.` |
| `auth.signIn` | `Giriş Yap` | `Sign In` |
| `auth.signUp` | `Kayıt Ol` | `Sign Up` |
| `auth.createAccount` | `Hesap Oluştur` | `Create Account` |
| `auth.signingIn` | `Giriş yapılıyor…` | `Signing in…` |
| `auth.creatingAccount` | `Hesap oluşturuluyor…` | `Creating account…` |
| `auth.emailLabel` | `E-posta` | `Email` |
| `auth.emailPlaceholder` | `ornek@eposta.com` | `example@email.com` |
| `auth.passwordLabel` | `Şifre` | `Password` |
| `auth.passwordPlaceholder` | `••••••••` | `••••••••` |
| `auth.showPassword` | `Şifreyi göster` | `Show password` |
| `auth.hidePassword` | `Şifreyi gizle` | `Hide password` |
| `auth.googleContinue` | `Google ile Devam Et` | `Continue with Google` |
| `auth.connecting` | `Bağlanıyor…` | `Connecting…` |
| `auth.confirmEmailSent` | `Onay maili gönderdik: {{email}}. Posta kutunu kontrol et, onayladıktan sonra buradan giriş yap.` | `We sent a confirmation email to {{email}}. Check your inbox, then sign in here once confirmed.` |
| `validation.emailRequired` | `E-posta adresi gerekli.` | `Email address is required.` |
| `validation.emailInvalid` | `Geçerli bir e-posta adresi gir.` | `Enter a valid email address.` |
| `validation.passwordRequired` | `Şifre gerekli.` | `Password is required.` |
| `validation.passwordMinLength` | `Şifre en az {{min}} karakter olmalı.` | `Password must be at least {{min}} characters.` |
| `validation.passwordComplexity` | `Şifre en az bir harf ve bir rakam içermeli.` | `Password must contain at least one letter and one number.` |
| `validation.incomeNameRequired` | `Gelir adı gerekli.` | `Income name is required.` |
| `validation.paymentNameRequired` | `Ödeme adı gerekli.` | `Payment name is required.` |
| `validation.amountInvalid` | `Geçerli bir tutar gir.` | `Enter a valid amount.` |
| `validation.payDayInvalid` | `Geçerli bir gün gir (1-31).` | `Enter a valid day (1-31).` |
| `onboarding.step` | `ADIM {{current}}/{{total}}` | `STEP {{current}}/{{total}}` |
| `onboarding.saveContinue` | `Kaydet ve İlerle` | `Save and Continue` |
| `onboarding.saving` | `Kaydediliyor…` | `Saving…` |
| `onboarding.saveFailed` | `Kaydedilemedi. Bağlantını kontrol edip tekrar dene.` | `Couldn't save. Check your connection and try again.` |
| `onboarding.genericError` | `Bir şeyler ters gitti. Tekrar dene.` | `Something went wrong. Try again.` |
| `onboarding.frequencyLabel` | `Tekrar Sıklığı` | `Frequency` |
| `onboarding.monthly` | `Aylık` | `Monthly` |
| `onboarding.weekly` | `Haftalık` | `Weekly` |
| `onboarding.amountLabel` | `Tutar` | `Amount` |
| `onboarding.amountPlaceholder` | `₺0,00` | `₺0,00` |
| `onboarding.payDayLabel` | `Ödeme Günü (ayın kaçı)` | `Payment Day (day of month)` |
| `onboarding.payDayPlaceholder` | `1-31` | `1-31` |
| `onboarding.income.title` | `Gelir Kaynağını Ekle` | `Add Income Source` |
| `onboarding.income.subtitle` | `Düzenli gelirini ekleyerek tahminlerini daha doğru hale getirelim.` | `Add your regular income to make forecasts more accurate.` |
| `onboarding.income.nameLabel` | `Gelir Adı` | `Income Name` |
| `onboarding.income.namePlaceholder` | `örn. Maaş` | `e.g. Salary` |
| `onboarding.recurring.title` | `Tekrarlayan Ödemeni Ekle` | `Add a Recurring Payment` |
| `onboarding.recurring.subtitle` | `Kira, fatura veya abonelik gibi sabit giderlerini ekle, yaklaşan ödemeleri unutma.` | `Add fixed expenses like rent, bills, or subscriptions so you never miss one.` |
| `onboarding.recurring.nameLabel` | `Ödeme Adı` | `Payment Name` |
| `onboarding.recurring.namePlaceholder` | `örn. Kira` | `e.g. Rent` |
| `onboarding.goal.title` | `Bir Tasarruf Hedefi Belirle` | `Set a Savings Goal` |
| `onboarding.goal.subtitle` | `Opsiyonel — istersen şimdi bir hedef koy, istersen daha sonra ekle.` | `Optional — set a goal now, or add one later.` |
| `onboarding.goal.nameLabel` | `Hedef Adı` | `Goal Name` |
| `onboarding.goal.namePlaceholder` | `örn. Tatil` | `e.g. Vacation` |
| `onboarding.goal.targetLabel` | `Hedef Tutarı` | `Target Amount` |
| `onboarding.goal.savedLabel` | `Mevcut Birikim (opsiyonel)` | `Current Savings (optional)` |
| `onboarding.goal.save` | `Hedefi Kaydet ve Başla` | `Save Goal and Start` |

### format.ts Unit Checks
| Test | Input | Expected (tr-TR) | Edge Case? |
|---|---|---|---|
| formatCurrency basic | `1234.56` | `₺1.234,56` | — |
| formatCurrency zero | `0` | `₺0,00` | ✓ |
| formatCurrency negative | `-50` | `-₺50,00` | ✓ |
| formatNumber grouping | `1234567.8` | `1.234.567,8` | — |
| formatDate long | `new Date('2026-07-19')` | `19 Temmuz 2026` | — |
| parseAmount comma | `'1234,56'` | `1234.56` | — |
| parseAmount TR grouped | `'1.234,56'` | `1234.56` | ✓ |
| parseAmount with ₺ | `'₺1.234,56'` | `1234.56` | ✓ |
| parseAmount empty | `''` | `NaN` (guarded by callers) | ✓ |

### Edge Cases Checklist
- [x] Empty input → `parseAmount('')` returns `NaN` (callers already guard with `Number.isNaN`)
- [x] Device locale not tr/en → falls back to `tr`
- [x] AsyncStorage unavailable → keeps device-detected language (catch-ignore)
- [x] Stored language no longer supported → `isLanguage` rejects, falls back to device
- [x] Interpolation placeholder mismatch between tr/en → caught by Task 13 parity check

---

## Validation Commands

### Static Analysis
```bash
npm run typecheck
```
EXPECT: Zero type errors (typed `t()` keys all resolve)

### Lint + Format
```bash
npm run lint && npm run format:check
```
EXPECT: Clean

### Key Parity
```bash
node -e "const a=require('./src/i18n/locales/tr.json'),b=require('./src/i18n/locales/en.json');const f=(o,p='')=>Object.entries(o).flatMap(([k,v])=>typeof v==='object'?f(v,p+k+'.'):[p+k]);const ta=f(a).sort(),tb=f(b).sort();console.log(JSON.stringify(ta)===JSON.stringify(tb)?'PARITY OK':'MISMATCH')"
```
EXPECT: `PARITY OK`

### App Boot (device / simulator)
```bash
npm start
```
EXPECT: App launches; Login + onboarding render localized; switch the device/simulator system language to English → strings flip to English on next cold start; currency renders `₺1.234,56`.

### Manual Validation
- [ ] Device set to Turkish → Login shows `Giriş Yap`, tagline in TR
- [ ] Device set to English → Login shows `Sign In`, tagline in EN
- [ ] Sign-up with <8-char password → interpolated min-length error correct in both languages
- [ ] Sign-up needing confirmation → email interpolated into banner
- [ ] Onboarding step badges show `ADIM 1/3` / `STEP 1/3`
- [ ] Frequency toggle labels localized
- [ ] Kill network on profile fetch → localized connection-error + retry
- [ ] `formatCurrency(1234.56)` on-device → `₺1.234,56` (confirms Hermes Intl — see Risks)

---

## Acceptance Criteria
- [ ] i18next + react-i18next + expo-localization installed; `src/i18n/` with `tr.json` (base) + `en.json`
- [ ] Typed translation keys; device-locale detection; fallback `tr`
- [ ] Phase 6 screens (login + 3 onboarding + root connection-error) fully retrofitted
- [ ] `src/lib/format.ts` with `Intl` currency/number/date (+ `parseAmount`)
- [ ] Language preference persisted (AsyncStorage + Redux), switcher deferred to Phase 10
- [ ] `npm run typecheck` / `lint` / `format:check` clean; key parity OK

## Completion Checklist
- [ ] Follows ThemeProvider/themeSlice persistence pattern exactly
- [ ] No hardcoded UI strings left in the 4 screens + `_layout.tsx`
- [ ] Interpolation placeholders identical across tr/en
- [ ] `FREQUENCY_OPTIONS` moved inside components (not module scope)
- [ ] format helpers default to `tr-TR`/TRY per spec
- [ ] No unnecessary scope (no switcher UI, no Supabase-error localization)
- [ ] Self-contained — no codebase search needed during implementation

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Hermes lacks full `Intl` (currency/`tr-TR` locale data) on-device | Low | High | Expo SDK 57 / RN 0.86 Hermes ships ICU-backed `Intl`. If `formatCurrency` returns garbled output, install `@formatjs/intl-numberformat` + `@formatjs/intl-datetimeformat` with `tr`/`en` locale data and import the polyfill in `src/i18n/index.ts`. **Verify via the on-device format check before closing the phase.** |
| `resolveJsonModule` not inherited → TS errors on JSON import | Low | Med | Add `"resolveJsonModule": true` to `tsconfig.json` `compilerOptions` |
| Plugin change needs dev-client rebuild | Med | Low | `expo-localization` is in Expo Go (no rebuild); custom dev clients rebuild once |
| `Intl.PluralRules` warning from i18next on some Android Hermes | Low | Low | We use no `count` plurals; if a warning appears, `npm i intl-pluralrules` and `import 'intl-pluralrules'` atop `src/i18n/index.ts` |
| Module-scope `FREQUENCY_OPTIONS` frozen to load-time language | Med | Med | Task 11 explicitly moves it inside the component |

## Notes
- Persistence deliberately mirrors `ThemeProvider`/`themeSlice` 1:1 so the two providers read identically and the Phase 10 Ayarlar screen can wire a language switcher via `useLanguage()` exactly like it wires the theme switcher via `useTheme().setMode`.
- `tr.json` is the type source of truth; `en.json` correctness is enforced structurally by the parity check, not by TS.
- `format.ts` is decoupled from `AmountDisplay` (which takes a pre-formatted string), so no atom changes are needed this phase.
