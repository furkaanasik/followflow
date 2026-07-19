# Local Review: Phase 7 — i18n & Formatting

**Reviewed**: 2026-07-19
**Branch**: `feat/phase-7-i18n-formatting` (uncommitted changes)
**Reviewer**: typescript-reviewer agent + main-thread verification
**Decision**: APPROVE (after fixes — all HIGH findings resolved in-session)

## Summary
i18n layer + 4-screen retrofit reviewed across correctness, type safety, security, performance, pattern compliance, completeness. 3 HIGH findings — all fixed. 1 MEDIUM accepted by plan, 2 LOW informational.

## Findings

### CRITICAL
None. `escapeValue: false` safe (all `t()` output goes through RN `<Text>`/string props, no HTML sink). No secrets, no injection surface.

### HIGH — all FIXED
1. **Hydration race → language flash** (`languageSlice.ts` + `LanguageProvider.tsx`)
   `initialState.language` was hardcoded `'tr'` while i18n initialized with the device language; provider's un-gated `changeLanguage` forced i18n back to `'tr'` on mount, then hydration flipped it again → visible tr→en flash on non-Turkish devices.
   **Fix**: seed `initialState.language = getDeviceLanguage()`.
2. **Floating promise** (`LanguageProvider.tsx`)
   `i18n.changeLanguage(language)` unhandled.
   **Fix**: added `.catch(() => {})` with rationale comment.
3. **Untranslated `Atla`/`Geri` in OnboardingTopBar** — rendered by all 3 onboarding screens, stayed Turkish in EN.
   **Fix**: `useTranslation()` inside the organism; `common.skip`/`common.back` keys added; `skipLabel` prop stays as optional override.
   **Follow-up in same sweep**: `DividerOr` default `'veya'` (renders on Login) — same fix, `common.or` key added.

### MEDIUM
- `en.json` `onboarding.amountPlaceholder` = `"₺0,00"` (TR comma-decimal in EN UI). **Accepted**: plan explicitly mandates ₺0,00 verbatim in both locales (TRY-only app).

### LOW / Informational
- `format.ts` helpers unused yet — intentional, plan defers wiring to Phase 8-9. Note: two amount-parsing implementations coexist until then (`parseAmount` vs inline `Number(x.replace(',','.'))`).
- `formatCurrency`/`formatDate` hardcode `tr-TR` default locale — per phase spec; revisit if EN-locale formatting ever wanted.
- Remaining Turkish literals are Phase 8-10 stubs, out of scope: `ButtonGoogleCTA` default label (overridden at the only call site), `GoalCard`, `SearchBar`, `RecurringPaymentCard`, `navigation/tabs.ts`.

## Validation Results

| Check | Result |
|---|---|
| Type check (`tsc --noEmit`) | Pass |
| Lint (`expo lint`) | Pass |
| Format (`prettier --check`) | Pass |
| Key parity tr↔en | Pass (56 keys) |
| Tests | Skipped — no runner in project |
| Build | Skipped — no bundler build script |

## Files Reviewed
Source: `src/i18n/*` (A), `src/store/slices/languageSlice.ts` (A), `src/types/i18next.d.ts` (A), `src/lib/format.ts` (A), `src/store/store.ts` (M), `src/app/_layout.tsx` (M), 4 screens (M), `src/organisms/OnboardingTopBar.tsx` (M, review fix), `src/molecules/DividerOr.tsx` (M, review fix). Config: `app.json`, `package.json`, lockfile (M).
