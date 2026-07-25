# E2E — Maestro core-loop suite

Automates the manual smoke test: sign-up → onboarding (income source) → log a transaction → see it reflected on the home screen.

## Prerequisites

1. **Maestro CLI** (not an npm dependency):

   ```bash
   curl -fsSL "https://get.maestro.mobile.dev" | bash
   ```

2. **A disposable test Supabase project.** Flows create real users (`e2e_<timestamp>@followflow.test`). Copy its URL + anon key into `.env`. Email confirmation must stay **disabled** on that project — sign-up must return an immediate session.

3. **A dev build installed on a booted emulator.** Expo Go cannot load this app's native modules.

   ```bash
   npx expo run:android   # builds + installs on the running emulator
   ```

4. **`appId` check.** Flow headers use `com.anonymous.followflow` (the prebuild default — no `android.package` is set in `app.json`). If your build differs, check `android/app/build.gradle` → `applicationId` and update both flow headers.

## Run

```bash
npm run e2e           # both flows, in order
npm run e2e:record    # record a video of the run
# single flow:
maestro test .maestro/01-auth-onboarding.yaml
```

Flow 01 wipes app state (`clearState`) and signs up a fresh user. Flow 02 reuses that session — run it only after (or chained with) flow 01.

## Cleaning up test users

Users accumulate in the test project. Purge them in the Supabase SQL editor:

```sql
delete from auth.users where email like 'e2e_%@followflow.test';
```

## When email confirmation is enabled

Flow 01 depends on sign-up yielding an immediate session. Once the production email-confirm flow lands, switch flow 01 to sign **in** with a pre-confirmed seeded test user instead of live sign-up.
