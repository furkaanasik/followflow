# Plan: Core Loop E2E Automation (Maestro)

## Summary
Automate the manual core-loop smoke test — sign in → onboarding (income source) → log a transaction → see budget/goal progress update — as a repeatable Maestro E2E suite running against an Expo dev build on an Android emulator / iOS simulator, backed by a dedicated Supabase test project. Adds stable `testID`s to the core-loop touchpoints so flows are resilient to copy/i18n changes.

## User Story
As the FollowFlow developer, I want the core loop driven end-to-end by an automated tool, so that I stop hand-running the income→transaction→progress smoke test on every change and catch nav/data-layer regressions before commit.

## Problem → Solution
Core loop is verified today only by manual tapping (backlog: "Şu an manuel smoke"). → A `maestro test` run replays the whole loop against a real build + real backend and fails loudly on regression.

## Metadata
- **Complexity**: Medium
- **Source PRD**: N/A (backlog item)
- **Backlog item**: "Test altyapısı P2 — Core loop E2E'yi otomatize et. Detox/Maestro değerlendir."
- **Estimated Files**: ~12 (4 atoms touched for testID, 5 screens touched for testID, 3–4 new `.maestro/` flow files, 1 docs file, `package.json`, `.env.example`)

---

## Tool Decision: Maestro (not Detox, not RNTL)

| Option | Verdict | Why |
|---|---|---|
| **Maestro** ✅ | **Chosen** | YAML flows, works with Expo **managed** workflow via a dev build (no eject), tolerant auto-wait, matches by text or `testID`. The manual smoke *is* a device flow — Maestro reproduces it faithfully. |
| Detox | Rejected | Gray-box, needs native build config + heavier setup; friction on Expo managed. Historically discouraged for Expo. |
| RNTL integration (headless) | Rejected | Would mock RTK Query/Supabase → re-tests what the existing 60 unit tests already cover; near-zero native/nav fidelity. Not "E2E". |

**Consequence — this suite needs live infrastructure to run:** a Supabase test project (URL + anon key in `.env`), an installed **dev build** (`npx expo run:android` / `run:ios` — Expo Go can't load native modules like `expo-glass-effect`), and a booted emulator/simulator with the Maestro CLI installed. This is documented, not automated in CI (see NOT Building).

---

## UX Design
Internal / test-tooling change — no user-facing UX transformation. The only production-code change is invisible `testID` props on existing components.

---

## Mandatory Reading

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 | `src/app/_layout.tsx` | 118–160 | Route guards: `(auth)` when unauth → `(onboarding)` when `!onboarding_completed` → `(tabs)` when completed. Flow must traverse all three. |
| P0 | `src/screens/LoginScreen.tsx` | 76–200 | Email/password sign-up+sign-in form, `SegmentedToggle` mode switch, `FormFieldGroup` inputs. Entry point of the flow. |
| P0 | `src/screens/OnboardingIncomeSourceScreen.tsx` | 49–186 | Income step; `handleSave` (l.96) & skip (l.49) both `router.push('/(onboarding)/recurring')`. `ButtonPrimary` label `onboarding.saveContinue`. |
| P0 | `src/screens/OnboardingGoalScreen.tsx` | 51–172 | **Final** onboarding step — only place `updateProfile({ onboarding_completed: true })` fires (l.60 skip, l.93 save). Flow MUST reach here to enter `(tabs)`. |
| P0 | `src/screens/NewTransactionScreen.tsx` | 91–307 | Transaction bottom sheet: `SegmentedToggle` expense/income, `CategoryChip` grid, `NumpadKeyRow` amount entry (digit labels rendered as `Text`), `ButtonPrimary` save → `router.back()`. |
| P1 | `src/screens/HomeScreen.tsx` | 190–323 | `NetDurumCard` (net balance), budget/goal progress region, FAB `router.push('/yeni-islem')` (l.323). Assertion targets live here. |
| P1 | `src/atoms/InputField.tsx` | 12–40 | Prop interface — thread a new `testID`. No `testID` today. |
| P1 | `src/atoms/ButtonPrimary.tsx` | 12–30 | Same — thread `testID` to root `Pressable`. |
| P1 | `src/molecules/FormFieldGroup.tsx` | all | Wraps label+`InputField`; pass `testID` through to the input. |
| P2 | `src/molecules/SegmentedToggle.tsx`, `src/molecules/CategoryChip.tsx` | all | Thread `testID` for mode toggle + category selection. |
| P2 | `.claude/PRPs/plans/completed/test-harness.plan.md` | all | House style for the last testing item (scripts, docs placement). |

## External Documentation

| Topic | Source | Key Takeaway |
|---|---|---|
| Maestro install | `curl -fsSL "https://get.maestro.mobile.dev" \| bash` | CLI binary; no npm dep. Add a `maestro` version note to docs, not `package.json`. |
| Maestro + Expo | maestro.mobile.dev docs (`resolve-library-id` → Maestro if deeper detail needed) | Install the **dev build** APK/app on the emulator first; Maestro drives the installed app by `appId`. |
| `appId` | `app.json` → derived bundle id | Android package / iOS bundle. FollowFlow `scheme: followflow`, slug `followflow`; confirm the built `applicationId` via `npx expo config` (Android defaults to `com.<owner>.followflow` unless set). Use the actual built id in flow headers. |

---

## Patterns to Mirror

### TESTID_THREAD (add optional prop, default undefined, forward to root interactive node)
// SOURCE: src/atoms/InputField.tsx:12-40 (interface + destructure)
```tsx
export interface InputFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  // ...existing props...
  testID?: string;            // ADD
}
export function InputField({ value, onChangeText, /* ... */ testID }: InputFieldProps) {
  // ...
  return (
    <TextInput
      testID={testID}         // forward to the actual TextInput
      value={value}
      onChangeText={onChangeText}
      /* ...existing... */
    />
  );
}
```

### BUTTON_TESTID
// SOURCE: src/atoms/ButtonPrimary.tsx:20-31
```tsx
export interface ButtonPrimaryProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;            // ADD
}
// ...
<Pressable testID={testID} onPress={onPress} disabled={disabled} /* ... */>
```

### FLOW_HEADER (Maestro YAML)
// SOURCE: new convention for this repo
```yaml
appId: com.followflow.app        # replace with the real built applicationId
---
- launchApp:
    clearState: true             # fresh install state each run → deterministic
```

### SELECTOR_PREFERENCE
- Prefer `id:` (matches `testID`) for inputs and the critical buttons we thread.
- Text `tapOn: "5"` is fine for numpad digits (labels ARE the text) and unambiguous button copy.
- Never assert on volatile formatted currency; assert on the presence of the goal/budget name + a `testID`-tagged progress node.

---

## Files to Change

| File | Action | Justification |
|---|---|---|
| `src/atoms/InputField.tsx` | UPDATE | add `testID?` → `TextInput` |
| `src/atoms/ButtonPrimary.tsx` | UPDATE | add `testID?` → `Pressable` |
| `src/molecules/SegmentedToggle.tsx` | UPDATE | add `testID?` (+ per-segment id) for expense/income + auth mode |
| `src/molecules/CategoryChip.tsx` | UPDATE | add `testID?` for category selection |
| `src/molecules/FormFieldGroup.tsx` | UPDATE | forward `testID?` to inner `InputField` |
| `src/screens/LoginScreen.tsx` | UPDATE | pass `testID`s: `login-email`, `login-password`, `login-submit`, `auth-mode-toggle` |
| `src/screens/OnboardingIncomeSourceScreen.tsx` | UPDATE | `onboarding-income-name/amount/payday`, `onboarding-income-continue` |
| `src/screens/OnboardingGoalScreen.tsx` | UPDATE | `onboarding-goal-save` (path into tabs) |
| `src/screens/NewTransactionScreen.tsx` | UPDATE | `tx-type-toggle`, `tx-category-<key>`, `tx-save` |
| `src/screens/HomeScreen.tsx` | UPDATE | `home-fab`, `home-net-durum`, `home-budget-progress`, `home-goal-progress` (assertion anchors) |
| `.maestro/01-auth-onboarding.yaml` | CREATE | sign-up (fresh email) → income → skip recurring → goal save → land on home |
| `.maestro/02-core-loop.yaml` | CREATE | from home: open new-transaction → pick category → numpad amount → save → assert progress anchors visible |
| `.maestro/config.yaml` | CREATE | Maestro workspace config (flow order, tags, env defaults) |
| `.maestro/README.md` | CREATE | prerequisites, how to build+install dev build, boot emulator, seed/reset test user, run |
| `package.json` | UPDATE | scripts: `"e2e": "maestro test .maestro"`, `"e2e:record": "maestro record .maestro"` |
| `.env.example` | UPDATE | comment noting these must point at a **disposable test** Supabase project for E2E |

## NOT Building
- **CI / cloud execution** — no GitHub Actions emulator job, no Maestro Cloud / EAS wiring. Local-run only, documented. (Follow-up backlog item if wanted.)
- **Detox or RNTL** paths — explicitly rejected above.
- **Automated test-user data reset via service-role key** — provide a manual SQL snippet in `.maestro/README.md` instead of shipping a privileged key. Fresh-signup-per-run (unique email) sidesteps most state coupling.
- **Recurring-payment + full goal-deposit sub-flows** — onboarding recurring step is **skipped** ("Atla") in the flow; goal is created but the deposit screen is out of scope. Core loop = income → transaction → progress.
- **iOS-specific tuning** — flows written appId-parametrized; validated on Android emulator. iOS "should work" but not a deliverable.
- **Cross-theme / pixel-diff** — separate P3 backlog items.

---

## Step-by-Step Tasks

### Task 1: Thread `testID` through core atoms/molecules
- **ACTION**: Add optional `testID?: string` to `ButtonPrimary`, `InputField`, `SegmentedToggle`, `CategoryChip`; forward to the root interactive node. `FormFieldGroup` forwards `testID` to its `InputField`.
- **IMPLEMENT**: See TESTID_THREAD + BUTTON_TESTID patterns. For `SegmentedToggle`, also derive per-segment ids (`${testID}-${value}`) on each option `Pressable` so `id: tx-type-toggle-income` is tappable.
- **MIRROR**: TESTID_THREAD
- **IMPORTS**: none new.
- **GOTCHA**: `testID` must land on the *actual* `TextInput`/`Pressable`, not a wrapping `View`, or Maestro's `id:` won't match. `CategoryChip` renders inside a scroll/grid — ensure the chip's own `Pressable` gets it.
- **VALIDATE**: `npm run typecheck` clean; grep the 4 files confirm `testID` on leaf node.

### Task 2: Tag core-loop screen touchpoints
- **ACTION**: Pass the concrete `testID`s (see Files table) in `LoginScreen`, `OnboardingIncomeSourceScreen`, `OnboardingGoalScreen`, `NewTransactionScreen`, `HomeScreen`.
- **IMPLEMENT**: e.g. `LoginScreen` email `FormFieldGroup testID="login-email"`, submit `ButtonPrimary testID="login-submit"`. Home FAB `Pressable testID="home-fab"` (l.323). Wrap the net-durum / budget / goal progress render regions with `testID` on an existing `View` (`home-net-durum`, `home-budget-progress`, `home-goal-progress`).
- **MIRROR**: existing prop-passing style in each screen.
- **IMPORTS**: none.
- **GOTCHA**: Onboarding income "continue" and goal "save" use `ButtonPrimary` whose `label` changes to a saving string mid-submit — target by `id:`, never by label text. Progress anchors must exist even in empty/zero state so the flow can assert *presence*, not a specific number.
- **VALIDATE**: `npm run typecheck`; `npm test` (existing 60 unit tests still green — pure additive props).

### Task 3: Maestro workspace + auth/onboarding flow
- **ACTION**: Create `.maestro/config.yaml` and `.maestro/01-auth-onboarding.yaml`.
- **IMPLEMENT**:
  - `launchApp: { clearState: true }`.
  - Sign-up mode: tap `id: auth-mode-toggle` (sign-up segment), `inputText` a **unique** email — `e2e+${maestro.copiedText ?? ''}` won't work; use Maestro JS: `- evalScript: ${output.email = 'e2e_' + Date.now() + '@followflow.test'}` then `inputText: ${output.email}`. Password `Test1234`.
  - Tap `id: login-submit`. Because Supabase email-confirm is disabled in dev (memory `project_email_confirmation_deferred`), sign-up yields an immediate session → guard flips to `(onboarding)`.
  - Income: `inputText` into `id: onboarding-income-name` ("Maaş"), `onboarding-income-amount` ("30000"), `onboarding-income-payday` ("1"); tap `id: onboarding-income-continue`.
  - Recurring step: `tapOn: "Atla"` (skip).
  - Goal: fill name/target or `tapOn: "Atla"` — then reach `id: onboarding-goal-save`. Tapping it sets `onboarding_completed` → lands on `(tabs)` home.
  - `assertVisible: { id: home-net-durum }`.
- **MIRROR**: FLOW_HEADER, SELECTOR_PREFERENCE.
- **IMPORTS**: n/a.
- **GOTCHA**: Onboarding recurring/goal have a directional-slide layout (Android re-push on back) — do NOT use back navigation in the flow; only move forward. Unique email per run avoids "user already registered".
- **VALIDATE**: `maestro test .maestro/01-auth-onboarding.yaml` reaches home (requires emulator + dev build + test `.env`).

### Task 4: Core-loop transaction + progress flow
- **ACTION**: Create `.maestro/02-core-loop.yaml`, chained after flow 01 (shared session — do NOT `clearState` again; `launchApp` without it).
- **IMPLEMENT**:
  - Tap `id: home-fab` → new-transaction sheet.
  - Ensure expense mode (`id: tx-type-toggle-expense`), tap a category `id: tx-category-<key>` (use a known seeded category key from `src/lib/categories.ts`).
  - Enter amount via numpad: `tapOn: "5"`, `tapOn: "0"`, `tapOn: "0"` (→ 500).
  - Tap `id: tx-save` → sheet closes (`router.back()`).
  - `assertVisible: { id: home-budget-progress }` and `{ id: home-goal-progress }` — proves the logged expense flowed into the aggregation UI.
- **MIRROR**: SELECTOR_PREFERENCE (numpad by text, everything else by id).
- **IMPORTS**: n/a.
- **GOTCHA**: The bottom sheet is a `formSheet` presentation — Maestro sees it as same-screen overlay; assert the sheet's own title (`newTransaction.title`) is visible before interacting. Category key must match an actual entry in `categories.ts` — read it, don't guess.
- **VALIDATE**: full `npm run e2e` (both flows) passes on emulator.

### Task 5: Docs, scripts, env note
- **ACTION**: `.maestro/README.md` (prereqs + run + manual test-user cleanup SQL), `package.json` scripts, `.env.example` comment.
- **IMPLEMENT**:
  - README: install Maestro, `npx expo run:android` to build+install dev build, boot emulator, copy test-project creds into `.env`, `npm run e2e`. Include cleanup SQL: `delete from auth.users where email like 'e2e_%@followflow.test';` (run in Supabase SQL editor / service context).
  - Scripts: `"e2e"`, `"e2e:record"`.
  - `.env.example`: comment "For E2E use a disposable test Supabase project — flows create real users."
- **MIRROR**: `test-harness.plan.md` docs tone.
- **VALIDATE**: `npm run format:check`; README steps followed once manually top-to-bottom.

### Task 6: Backlog + report
- **ACTION**: Move the backlog item to Done with PR#; write `.claude/PRPs/reports/core-loop-e2e-report.md`.
- **VALIDATE**: backlog checkbox ticked, report exists.

---

## Testing Strategy

This item *is* the test. Validation = the flows run green against a real build. Additionally the additive `testID` props must not regress existing unit/type checks.

| Check | Expected |
|---|---|
| `npm run typecheck` | 0 errors (new optional props) |
| `npm test` | 60/60 unit tests still pass |
| `maestro test .maestro/01-auth-onboarding.yaml` | lands on home, `home-net-durum` visible |
| `maestro test .maestro/02-core-loop.yaml` | transaction saved, progress anchors visible |
| `npm run e2e` | both flows pass in order |

### Edge Cases Checklist
- [ ] Re-run twice — unique email prevents "already registered" collision.
- [ ] `clearState` on flow 01 only; flow 02 reuses session.
- [ ] Empty budget/goal state still renders progress anchors (assert presence, not value).
- [ ] Backend unreachable → flow fails fast at sign-up (acceptable; surfaces infra problem).

---

## Validation Commands

### Static Analysis
```bash
npm run typecheck
```
EXPECT: Zero type errors

### Unit regression
```bash
npm test
```
EXPECT: All existing tests pass (additive props only)

### E2E (requires emulator + dev build + test .env)
```bash
# one-time: install Maestro
curl -fsSL "https://get.maestro.mobile.dev" | bash
# build + install dev build, boot an emulator, then:
npx expo run:android
npm run e2e
```
EXPECT: Both flows pass

### Format
```bash
npm run format:check
```
EXPECT: Clean

---

## Acceptance Criteria
- [ ] `testID`s threaded through `ButtonPrimary`, `InputField`, `SegmentedToggle`, `CategoryChip`, `FormFieldGroup` (leaf nodes).
- [ ] Core-loop screens tagged with the ids in the Files table.
- [ ] `.maestro/` holds config + 2 flows + README.
- [ ] `npm run e2e` drives sign-up → onboarding → transaction → progress assertion and passes on an emulator.
- [ ] `npm run typecheck` + `npm test` still green.
- [ ] Backlog item moved to Done; report written.

## Completion Checklist
- [ ] Additive props only — no behavior change to production code.
- [ ] Selectors prefer `id:`; text only for numpad + unambiguous copy.
- [ ] Docs let a fresh dev run the suite without asking questions.
- [ ] No service-role key committed; cleanup is manual SQL.

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Expo Go can't load native modules → flows fail | High if wrong build used | High | README mandates a **dev build** (`expo run:android`), not Expo Go. |
| Test users accumulate in Supabase | Medium | Low | Unique-email + documented cleanup SQL; use a disposable test project. |
| `applicationId` mismatch in `appId:` header | Medium | High (flow won't launch) | Task 3 resolves real id via `npx expo config` before writing headers. |
| Numpad/currency formatting shifts break text selectors | Low | Medium | Amount via digit taps + `tx-save` by id; assertions by id not by formatted value. |
| No CI → suite rots unrun | Medium | Medium | Documented as a pre-commit manual gate; CI wiring is an explicit follow-up backlog item. |

## Notes
- Depends on the deferred email-confirmation state (memory `project_email_confirmation_deferred`): sign-up returns an immediate session *only while confirmation stays disabled*. When the P0 email-confirm flow lands, flow 01 must switch to a pre-confirmed seeded test user instead of live sign-up.
- Google OAuth path is untestable here (native popup, memory `project_google_auth_deferred`) — email/password only, which is the shipped default anyway.
```
