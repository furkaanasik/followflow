# Plan: Phase 5 — Supabase Schema & Data Layer

## Summary
Stand up the Postgres schema (6 tables + RLS + triggers) as a versioned Supabase CLI migration, hand-write matching TypeScript `Database` types, and build a typed Redux data layer (RTK Query via `fakeBaseQuery` + a dedicated `authSlice`) so Phase 6+ screens can read/write `income_sources`, `recurring_payments`, `goals`, `budgets`, and `transactions` — plus email/password and Google OAuth sign-in — without touching `supabase-js` directly.

## User Story
As the FollowFlow codebase (next consumer: Phase 6 onboarding/auth screens), I want a typed, RLS-secured Supabase schema and a Redux data/auth layer, so that screens can call `useXQuery`/`useXMutation` hooks and `signInWithEmail`/`signInWithGoogle`/`signOut` without re-deriving Supabase query logic or auth flows.

## Problem → Solution
`src/lib/supabase.ts` exists (untyped client, env-var wiring only) and `src/types/index.ts` is an empty stub — no schema, no RLS, no Redux data slices, no auth state → 6 RLS-secured Postgres tables live in a versioned migration, `Database` types flow through a typed Supabase client, 6 RTK Query endpoint groups + 1 `authSlice` exist and are wired into the store, and session bootstrap runs on app start.

## Metadata
- **Complexity**: Large
- **Source PRD**: `.claude/phases.md`
- **PRD Phase**: Phase 5 — Supabase Schema & Data Layer
- **Estimated Files**: 19 (1 migration + 1 CLI config + 2 types + 1 lib update + 1 new auth lib + 1 authSlice + 7 RTK Query api files + 1 store update + 1 layout update + 1 package.json update + 1 phases.md checkbox update)

---

## UX Design
N/A — internal data/auth layer, no screens wired yet (screens are Phase 6). Validation is schema/type/lint correctness plus a manual sign-up/sign-in smoke test, not visual.

### Interaction Changes
| Touchpoint | Before | After | Notes |
|---|---|---|---|
| App boot (`src/app/_layout.tsx`) | Fonts load, Redux `Provider`/`ThemeProvider` mount, no auth check | Fonts load, Redux mounts, then `supabase.auth.getSession()` resolves → `authSlice` populated → `app.bootstrapped` flips true | `bootstrapped` flag already existed in `appSlice` since Phase 0 but was never consumed — this phase is its first consumer |
| Data access from future screens | N/A (no data layer) | Screens call `useListTransactionsQuery()`, `useCreateGoalMutation()`, etc. from `@/store/api` | Establishes the only sanctioned way to touch these 6 tables — no raw `supabase.from(...)` calls in screen code from Phase 6 onward |

---

## Mandatory Reading

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 | `src/lib/supabase.ts` | 1-22 | Existing client — Task 6 types it with `Database`, must preserve the `AsyncStorage`/`autoRefreshToken`/`persistSession`/`detectSessionInUrl:false` auth config exactly |
| P0 | `src/store/store.ts` | 1-15 | Current store shape (2 reducers, no middleware customization) — Task 17 adds `auth` reducer + `api` reducer + `api.middleware` |
| P0 | `src/store/slices/themeSlice.ts` | 1-25 | Canonical slice pattern: `createSlice` + typed `PayloadAction`, single named export action, default-export reducer — mirror exactly for `authSlice` |
| P0 | `src/store/slices/appSlice.ts` | 1-23 | `bootstrapped: boolean` flag already scaffolded in Phase 0 for exactly this phase's use — do not create a second "is app ready" flag |
| P0 | `src/store/hooks.ts` | 1-7 | `useAppDispatch`/`useAppSelector` — typed hooks future screens will pair with the new RTK Query hooks; not modified this phase but confirms `RootState`/`AppDispatch` are the types to keep in sync |
| P1 | `src/types/index.ts` | 1-3 | Currently `export {}` with a `TODO(Phase 5+)` comment — this phase fills it in |
| P1 | `src/app/_layout.tsx` | 1-41 | Root layout — Task 18 adds the session-bootstrap `useEffect`; must not disturb the existing font-loading/splash-screen gate |
| P1 | `.env.example` | 1-2 | Confirms the only two client env vars (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`) — no new client env vars are needed this phase (Google OAuth client secret lives server-side in the Supabase dashboard, never in app env) |
| P2 | `src/organisms/BudgetCard.tsx`, `GoalCard.tsx`, `RecurringPaymentCard.tsx`, `IncomeSourceCard.tsx`, `NetDurumCard.tsx`, `TransactionListCard.tsx` | all | Prop shapes (`icon`, `categoryName`, `percent`, `amount: string`, `frequencyLabel`, `dayLabel`, `nextLabel`, `etaLabel`, `tone`) reveal the domain fields each table must carry — confirms `icon` is a free-text lucide kebab-case string (validated against `src/lib/icons.ts` at render time, not at the DB level), and that **currency formatting into display strings happens in the screen layer, not in Phase 5** |
| P2 | `.claude/phases.md` lines 34-39 | Phase 5 checklist | Already records the dev-workflow decision this plan follows: CLI-first migrations in `supabase/migrations/`, `supabase link`, MCP `supabase` tools for inspect/debug only (`list_tables`, `get_advisors`, `get_logs`) — never write schema via MCP directly to remote |

## External Documentation

| Topic | Source | Key Takeaway |
|---|---|---|
| RTK Query + non-HTTP SDK | Context7 `/reduxjs/redux-toolkit` — "Integrate Third-Party SDK with queryFn" | Official pattern: `createApi({ baseQuery: fakeBaseQuery<ErrorType>(), endpoints: (build) => ({ x: build.query({ queryFn: async () => { const {data,error} = await supabase...; if (error) return {error}; return {data}; } }) }) })` — confirms the exact shape used in every `src/store/api/*.ts` file below |
| Supabase OAuth on Expo/React Native | Context7 `/websites/supabase` — "Native Mobile Deep Linking" / "Implement OAuth and Linking Handlers in React Native" | Official recipe uses **`expo-auth-session`'s `makeRedirectUri()`** (not `expo-linking`'s raw scheme string) and **`QueryParams.getQueryParams(url)` from `expo-auth-session/build/QueryParams`** (not `Linking.parse`) — `expo-auth-session` is not yet in `package.json`, must be added |

**GOTCHA**: OAuth implicit-flow tokens can arrive in the URL **fragment** (`#access_token=...`), not the query string. Plain `expo-linking` `Linking.parse()` reads `queryParams` and can silently miss fragment-encoded tokens. `expo-auth-session`'s `QueryParams.getQueryParams()` handles both — this is why it's required over the already-installed `expo-linking`.

**GOTCHA**: `WebBrowser.maybeCompleteAuthSession()` must be called once at module scope — required for the web build target (this project ships `web` via `react-native-web`, see `app.json`), harmless no-op on native.

---

## Schema Design

6 tables, all `public` schema, all RLS-enabled, all owned by `user_id`/`id` = `auth.uid()`:

| Table | Purpose | Key columns beyond `id`/`user_id`/timestamps |
|---|---|---|
| `profiles` | 1:1 extension of `auth.users`, auto-created via trigger | `display_name`, `avatar_url`, `theme_mode` (mirrors `ThemeMode` from `src/theme/tokens.ts`), `onboarding_completed` |
| `income_sources` | Onboarding step "Gelir Kaynağı" | `name`, `amount numeric(12,2)`, `frequency`, `pay_day` |
| `recurring_payments` | Onboarding step "Tekrarlayan Ödeme" | `icon`, `name`, `amount`, `frequency`, `next_payment_date` |
| `goals` | Onboarding step "Hedef" | `icon`, `name`, `target_amount`, `current_amount`, `target_date` |
| `budgets` | Bütçeler screen | `icon`, `category_name`, `limit_amount`, `period_month date` (first-of-month), unique per `(user_id, category_name, period_month)` |
| `transactions` | İşlemler / new transaction modal | `type` (`income`\|`expense`), `category`, `icon`, `title`, `note`, `amount`, `occurred_at` |

`frequency` values (`income_sources`, `recurring_payments`): `'weekly' | 'biweekly' | 'monthly' | 'yearly' | 'one-time'` — enforced via `check`, not a native Postgres enum (cheaper to alter later without an `ALTER TYPE`).

**NOT storing**: a `spent_amount` column on `budgets`, or any income/expense monthly-total column. Both are derived by summing `transactions` — computing and caching that aggregation is explicitly out of scope for this phase (see NOT Building).

---

## Patterns to Mirror

### SLICE_PATTERN
// SOURCE: `src/store/slices/themeSlice.ts:1-25`
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
`authSlice.ts` (Task 8) follows this shape exactly: interface + `initialState` + single-reducer `createSlice` + named action export + default-export reducer.

### RTK_QUERY_SDK_PATTERN
// SOURCE: Context7 `/reduxjs/redux-toolkit` "Integrate Third-Party SDK with queryFn"
```ts
export const supabaseApi = createApi({
  reducerPath: 'supabaseApi',
  baseQuery: fakeBaseQuery(),
  endpoints: (build) => ({
    getBlogs: build.query({
      queryFn: async () => {
        const { data, error } = await supabase.from('blogs').select()
        if (error) {
          return { error }
        }
        return { data }
      },
    }),
  }),
})
```
Every `src/store/api/*Api.ts` file (Tasks 10-15) follows this `queryFn` shape.

### STORE_ASSEMBLY_PATTERN
// SOURCE: `src/store/store.ts:1-15` (current, pre-Phase-5)
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
Task 17 extends this — adds `auth` reducer, `[api.reducerPath]: api.reducer`, and the `middleware` option. `RootState`/`AppDispatch` export lines stay unchanged (they're derived, not hand-maintained).

### BARREL_PATTERN
// SOURCE: `src/molecules/index.ts:1-12`
```ts
export * from './BudgetProgressRow';
export * from './DividerOr';
...
```
`src/store/api/index.ts` (Task 16) is a flat `export * from './X'` barrel, alphabetical, same as every existing `atoms/molecules/organisms` index.

---

## Files to Change

| File | Action | Justification |
|---|---|---|
| `package.json` | UPDATE | Add `supabase` CLI as a devDependency (local, `npx`-invoked per the workflow decision in `.claude/phases.md`); add `expo-auth-session` runtime dependency for the OAuth redirect recipe |
| `supabase/config.toml` | CREATE | `supabase init` scaffold — required for `supabase link`/`db push` to work locally |
| `supabase/migrations/20260719000000_initial_schema.sql` | CREATE | Source-of-truth schema: 6 tables, indexes, `updated_at` trigger, `handle_new_user` trigger, RLS policies |
| `src/types/database.ts` | CREATE | Hand-written `Database` type (placeholder for real `supabase gen types` output once the project is linked) |
| `src/types/index.ts` | UPDATE | Re-export friendly `Row`/`Insert`/`Update` aliases per entity, replacing the `TODO(Phase 5+)` stub |
| `src/lib/supabase.ts` | UPDATE | Type the client with `createClient<Database>(...)` |
| `src/lib/auth.ts` | CREATE | `signUpWithEmail`, `signInWithEmail`, `signInWithGoogle`, `signOut` |
| `src/store/slices/authSlice.ts` | CREATE | `session`/`user`/`status` state, `setSession` action |
| `src/store/api/baseApi.ts` | CREATE | `createApi` root with `fakeBaseQuery<PostgrestError>()` and `tagTypes` |
| `src/store/api/incomeSourcesApi.ts` | CREATE | CRUD endpoints for `income_sources` |
| `src/store/api/recurringPaymentsApi.ts` | CREATE | CRUD endpoints for `recurring_payments` |
| `src/store/api/goalsApi.ts` | CREATE | CRUD endpoints for `goals` |
| `src/store/api/budgetsApi.ts` | CREATE | CRUD endpoints for `budgets` |
| `src/store/api/transactionsApi.ts` | CREATE | CRUD endpoints for `transactions` |
| `src/store/api/profileApi.ts` | CREATE | Get/update the current user's `profiles` row |
| `src/store/api/index.ts` | CREATE | Barrel — forces all `injectEndpoints` calls to run, re-exports all hooks |
| `src/store/store.ts` | UPDATE | Register `auth` reducer, `api` reducer, `api.middleware`, `setupListeners` |
| `src/app/_layout.tsx` | UPDATE | Session bootstrap: `getSession()` → `setSession` + `setBootstrapped(true)`; `onAuthStateChange` subscription |
| `.claude/phases.md` | UPDATE | Check off Phase 5 boxes on completion |

## NOT Building
- Login/onboarding screen UI (Phase 6) — this phase only builds the functions/hooks those screens will call
- Budget-progress or monthly-total aggregation (views, computed columns, or Redux selectors that sum `transactions`) — deferred to whichever screen phase first needs it (Phase 7/8), to avoid guessing an aggregation shape no screen has requested yet
- Currency/locale formatting of `amount` into display strings (e.g. `"₺1.250,00"`) — stays a screen-layer concern, already partly covered by the Phase 2 `AmountDisplay`/`BadgeAmount` atoms
- Realtime subscriptions (`supabase.channel(...)`) — RTK Query polling/refetch is sufficient for Phase 5-9; realtime is a Phase 10+ enhancement if needed
- Magic-link / OTP sign-in — `.claude/phases.md` only calls for email/password + Google OAuth
- Actually creating/linking the remote Supabase project, or configuring the Google OAuth client in the Supabase dashboard / Google Cloud Console — these are one-time dashboard actions outside version control, listed under Manual Validation

---

## Step-by-Step Tasks

### Task 1: Add CLI + OAuth dependencies
- **ACTION**: Add `supabase` as a devDependency and `expo-auth-session` as a runtime dependency.
- **IMPLEMENT**: `npm install --save-dev supabase` and `npx expo install expo-auth-session` (use `expo install` for this one so Expo pins a compatible version for SDK 57).
- **MIRROR**: N/A — dependency addition only.
- **IMPORTS**: N/A.
- **GOTCHA**: Use `npx expo install`, not plain `npm install`, for `expo-auth-session` — Expo's installer resolves the version compatible with `expo@~57.0.7`.
- **VALIDATE**: `package.json` gains both entries; `npm run typecheck` still passes (no code depends on them yet).

### Task 2: Scaffold the Supabase CLI project
- **ACTION**: Initialize the local `supabase/` directory.
- **IMPLEMENT**: `npx supabase init` — accept defaults. This creates `supabase/config.toml` and `supabase/.gitignore` (the latter should NOT ignore `migrations/`).
- **MIRROR**: N/A.
- **IMPORTS**: N/A.
- **GOTCHA**: Do not run `supabase link` yet unless a remote project already exists — if the user hasn't created the Supabase project through the dashboard yet, `init` alone is enough to unblock writing the migration file (Task 3); linking/pushing happens once the project exists (see Manual Validation).
- **VALIDATE**: `supabase/config.toml` exists; `git status` shows it as untracked/new (not ignored).

### Task 3: Write the initial schema migration
- **ACTION**: Create the single source-of-truth SQL migration.
- **IMPLEMENT**: `supabase/migrations/20260719000000_initial_schema.sql`:
```sql
-- Extensions
create extension if not exists pgcrypto;

-- profiles: 1:1 extension of auth.users
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  theme_mode text not null default 'dark'
    check (theme_mode in ('dark','light','vibrant','vibrant-dark')),
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.income_sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  amount numeric(12,2) not null check (amount > 0),
  frequency text not null
    check (frequency in ('weekly','biweekly','monthly','yearly','one-time')),
  pay_day smallint check (pay_day between 1 and 31),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.recurring_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  icon text not null,
  name text not null,
  amount numeric(12,2) not null check (amount > 0),
  frequency text not null
    check (frequency in ('weekly','biweekly','monthly','yearly','one-time')),
  next_payment_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  icon text not null,
  name text not null,
  target_amount numeric(12,2) not null check (target_amount > 0),
  current_amount numeric(12,2) not null default 0 check (current_amount >= 0),
  target_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  icon text not null,
  category_name text not null,
  limit_amount numeric(12,2) not null check (limit_amount > 0),
  period_month date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, category_name, period_month)
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('income','expense')),
  category text not null,
  icon text not null,
  title text not null,
  note text,
  amount numeric(12,2) not null check (amount > 0),
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- indexes
create index idx_income_sources_user on public.income_sources(user_id);
create index idx_recurring_payments_user on public.recurring_payments(user_id);
create index idx_goals_user on public.goals(user_id);
create index idx_budgets_user_period on public.budgets(user_id, period_month);
create index idx_transactions_user_occurred on public.transactions(user_id, occurred_at desc);

-- updated_at trigger, reused across all 6 tables
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.income_sources
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.recurring_payments
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.goals
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.budgets
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.transactions
  for each row execute function public.set_updated_at();

-- auto-create a profiles row when a new auth.users row is inserted
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.income_sources enable row level security;
alter table public.recurring_payments enable row level security;
alter table public.goals enable row level security;
alter table public.budgets enable row level security;
alter table public.transactions enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

create policy "income_sources_all_own" on public.income_sources
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "recurring_payments_all_own" on public.recurring_payments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "goals_all_own" on public.goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "budgets_all_own" on public.budgets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "transactions_all_own" on public.transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```
- **MIRROR**: N/A — new subsystem, no prior SQL in repo.
- **IMPORTS**: N/A.
- **GOTCHA**: `profiles` has **no insert policy** — this is intentional, not an oversight. Inserts only ever happen via `handle_new_user()`, which runs `security definer` and therefore bypasses RLS. Adding a client-facing insert policy would let a signed-in user forge a second `profiles` row for their own `id`.
- **GOTCHA**: `on delete cascade` on every `user_id`/`id` FK means deleting an `auth.users` row wipes all of that user's data — correct for this app (no soft-delete/GDPR-export requirement stated), but note it explicitly so a future migration doesn't add cascade deletes accidentally elsewhere.
- **VALIDATE**: File is valid Postgres DDL — validated for real once linked (Task 2/Manual Validation), but locally confirm no obvious syntax typos by reading it back before moving on.

### Task 4: Hand-write matching TypeScript `Database` types
- **ACTION**: Create `src/types/database.ts`.
- **IMPLEMENT**:
```ts
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          theme_mode: 'dark' | 'light' | 'vibrant' | 'vibrant-dark';
          onboarding_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          theme_mode?: 'dark' | 'light' | 'vibrant' | 'vibrant-dark';
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          theme_mode?: 'dark' | 'light' | 'vibrant' | 'vibrant-dark';
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      income_sources: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          amount: number;
          frequency: 'weekly' | 'biweekly' | 'monthly' | 'yearly' | 'one-time';
          pay_day: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          amount: number;
          frequency: 'weekly' | 'biweekly' | 'monthly' | 'yearly' | 'one-time';
          pay_day?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['income_sources']['Insert']>;
      };
      recurring_payments: {
        Row: {
          id: string;
          user_id: string;
          icon: string;
          name: string;
          amount: number;
          frequency: 'weekly' | 'biweekly' | 'monthly' | 'yearly' | 'one-time';
          next_payment_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          icon: string;
          name: string;
          amount: number;
          frequency: 'weekly' | 'biweekly' | 'monthly' | 'yearly' | 'one-time';
          next_payment_date: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['recurring_payments']['Insert']>;
      };
      goals: {
        Row: {
          id: string;
          user_id: string;
          icon: string;
          name: string;
          target_amount: number;
          current_amount: number;
          target_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          icon: string;
          name: string;
          target_amount: number;
          current_amount?: number;
          target_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['goals']['Insert']>;
      };
      budgets: {
        Row: {
          id: string;
          user_id: string;
          icon: string;
          category_name: string;
          limit_amount: number;
          period_month: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          icon: string;
          category_name: string;
          limit_amount: number;
          period_month: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['budgets']['Insert']>;
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          type: 'income' | 'expense';
          category: string;
          icon: string;
          title: string;
          note: string | null;
          amount: number;
          occurred_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'income' | 'expense';
          category: string;
          icon: string;
          title: string;
          note?: string | null;
          amount: number;
          occurred_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['transactions']['Insert']>;
      };
    };
  };
}
```
- **MIRROR**: N/A — shape matches the real `supabase gen types typescript` output structure so it's a drop-in replacement later.
- **IMPORTS**: N/A.
- **GOTCHA**: This file is a **placeholder**. Once the project is linked, regenerate it for real via `npx supabase gen types typescript --linked > src/types/database.ts` (or the MCP `generate_typescript_types` tool, which is read-only/inspect and therefore allowed under the Phase 5 workflow rule). Regeneration is safe because `src/types/index.ts` (Task 5) only references the `Database['public']['Tables'][...]['Row'|'Insert'|'Update']` shape, which real codegen preserves.
- **VALIDATE**: `npm run typecheck` passes with no errors from this file in isolation.

### Task 5: Re-export friendly domain types
- **ACTION**: Replace the `src/types/index.ts` stub.
- **IMPLEMENT**:
```ts
import type { Database } from './database';

export type { Database };

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type IncomeSource = Database['public']['Tables']['income_sources']['Row'];
export type IncomeSourceInsert = Database['public']['Tables']['income_sources']['Insert'];
export type IncomeSourceUpdate = Database['public']['Tables']['income_sources']['Update'];

export type RecurringPayment = Database['public']['Tables']['recurring_payments']['Row'];
export type RecurringPaymentInsert = Database['public']['Tables']['recurring_payments']['Insert'];
export type RecurringPaymentUpdate = Database['public']['Tables']['recurring_payments']['Update'];

export type Goal = Database['public']['Tables']['goals']['Row'];
export type GoalInsert = Database['public']['Tables']['goals']['Insert'];
export type GoalUpdate = Database['public']['Tables']['goals']['Update'];

export type Budget = Database['public']['Tables']['budgets']['Row'];
export type BudgetInsert = Database['public']['Tables']['budgets']['Insert'];
export type BudgetUpdate = Database['public']['Tables']['budgets']['Update'];

export type Transaction = Database['public']['Tables']['transactions']['Row'];
export type TransactionInsert = Database['public']['Tables']['transactions']['Insert'];
export type TransactionUpdate = Database['public']['Tables']['transactions']['Update'];
```
- **MIRROR**: `src/theme/index.ts` re-export style (barrel of derived types).
- **IMPORTS**: `./database`.
- **GOTCHA**: Remove the old `export {}` and the `TODO(Phase 5+)` comment entirely — don't leave it dangling above the new exports.
- **VALIDATE**: `npm run typecheck` passes; every subsequent task imports from `@/types`, not `@/types/database` directly.

### Task 6: Type the Supabase client
- **ACTION**: Update `src/lib/supabase.ts`.
- **IMPLEMENT**:
```ts
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

import type { Database } from '@/types/database';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY — check your .env file.',
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```
- **MIRROR**: `src/lib/supabase.ts:1-22` (current file) — only the `createClient` call and the new type import change.
- **IMPORTS**: `@/types/database`.
- **GOTCHA**: Keep `detectSessionInUrl: false` — the OAuth flow (Task 7) manually calls `supabase.auth.setSession()` after parsing the redirect URL itself; letting the client also try to auto-detect the session from the URL would double-handle it.
- **VALIDATE**: `npm run typecheck` passes; every `.from('table_name')` call site elsewhere in the codebase now gets autocomplete/type-checking against `Database`.

### Task 7: Auth helper functions
- **ACTION**: Create `src/lib/auth.ts`.
- **IMPLEMENT**:
```ts
import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as WebBrowser from 'expo-web-browser';

import { supabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();

export async function signUpWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signInWithGoogle() {
  const redirectTo = makeRedirectUri();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw error;

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') {
    throw new Error('Google sign-in cancelled.');
  }

  const { params, errorCode } = QueryParams.getQueryParams(result.url);
  if (errorCode) throw new Error(errorCode);

  const { access_token: accessToken, refresh_token: refreshToken } = params;
  if (typeof accessToken !== 'string' || typeof refreshToken !== 'string') {
    throw new Error('Missing OAuth tokens in redirect URL.');
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (sessionError) throw sessionError;
  return sessionData;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
```
- **MIRROR**: N/A — new file, but follows the throw-on-error style already used at module load in `src/lib/supabase.ts` (no silent failures).
- **IMPORTS**: `expo-auth-session` (`makeRedirectUri`), `expo-auth-session/build/QueryParams`, `expo-web-browser`, `./supabase`.
- **GOTCHA**: `makeRedirectUri()` with no arguments derives the redirect URL from `app.json`'s `"scheme": "followflow"` automatically — do not hardcode `followflow://...` by hand, it won't match Expo Go's proxy redirect during development.
- **GOTCHA**: The exact redirect URI `makeRedirectUri()` produces must be added to the Supabase dashboard's Authentication → URL Configuration → Redirect URLs allow-list, and the Google Cloud OAuth client's authorized redirect URI must be `https://<project-ref>.supabase.co/auth/v1/callback` — both are dashboard/console config, not code (see Manual Validation).
- **VALIDATE**: `npm run typecheck` passes; functions are not yet called anywhere (Phase 6 wires them to `ButtonGoogleCTA`/`InputField`+`ButtonPrimary` on the Login screen) — that's expected, this phase only builds the functions.

### Task 8: `authSlice`
- **ACTION**: Create `src/store/slices/authSlice.ts`.
- **IMPLEMENT**:
```ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Session, User } from '@supabase/supabase-js';

interface AuthState {
  session: Session | null;
  user: User | null;
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated';
}

const initialState: AuthState = {
  session: null,
  user: null,
  status: 'idle',
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setSession: (state, action: PayloadAction<Session | null>) => {
      state.session = action.payload;
      state.user = action.payload?.user ?? null;
      state.status = action.payload ? 'authenticated' : 'unauthenticated';
    },
  },
});

export const { setSession } = authSlice.actions;
export default authSlice.reducer;
```
- **MIRROR**: SLICE_PATTERN (`src/store/slices/themeSlice.ts:1-25`) — same structure exactly.
- **IMPORTS**: `@reduxjs/toolkit`, `@supabase/supabase-js` (types only).
- **GOTCHA**: `status` starts at `'idle'`, not `'unauthenticated'` — the root layout hasn't resolved `getSession()` yet at store-creation time, and Task 18's bootstrap effect is what first calls `setSession`. Screens gating on auth state should treat `'idle'` as "still checking," not as "logged out."
- **VALIDATE**: `npm run typecheck` passes.

### Task 9: RTK Query base API
- **ACTION**: Create `src/store/api/baseApi.ts`.
- **IMPLEMENT**:
```ts
import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import type { PostgrestError } from '@supabase/supabase-js';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fakeBaseQuery<PostgrestError>(),
  tagTypes: [
    'IncomeSource',
    'RecurringPayment',
    'Goal',
    'Budget',
    'Transaction',
    'Profile',
  ],
  endpoints: () => ({}),
});
```
- **MIRROR**: RTK_QUERY_SDK_PATTERN (Context7 `/reduxjs/redux-toolkit`).
- **IMPORTS**: `@reduxjs/toolkit/query/react`, `@supabase/supabase-js` (type only).
- **GOTCHA**: Import from `@reduxjs/toolkit/query/react` (not the plain `/query` subpath) — the `/react` entry point is what generates the `use*Query`/`use*Mutation` hooks every entity API (Tasks 10-15) exports.
- **VALIDATE**: `npm run typecheck` passes; `endpoints: () => ({})` is intentionally empty — every entity is added via `injectEndpoints` in its own file, never here.

### Task 10: Income sources API
- **ACTION**: Create `src/store/api/incomeSourcesApi.ts`.
- **IMPLEMENT**:
```ts
import { supabase } from '@/lib/supabase';
import type { IncomeSource, IncomeSourceInsert, IncomeSourceUpdate } from '@/types';

import { api } from './baseApi';

export const incomeSourcesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listIncomeSources: builder.query<IncomeSource[], void>({
      queryFn: async () => {
        const { data, error } = await supabase
          .from('income_sources')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) return { error };
        return { data };
      },
      providesTags: ['IncomeSource'],
    }),
    createIncomeSource: builder.mutation<IncomeSource, IncomeSourceInsert>({
      queryFn: async (payload) => {
        const { data, error } = await supabase
          .from('income_sources')
          .insert(payload)
          .select()
          .single();
        if (error) return { error };
        return { data };
      },
      invalidatesTags: ['IncomeSource'],
    }),
    updateIncomeSource: builder.mutation<
      IncomeSource,
      { id: string } & IncomeSourceUpdate
    >({
      queryFn: async ({ id, ...changes }) => {
        const { data, error } = await supabase
          .from('income_sources')
          .update(changes)
          .eq('id', id)
          .select()
          .single();
        if (error) return { error };
        return { data };
      },
      invalidatesTags: ['IncomeSource'],
    }),
    deleteIncomeSource: builder.mutation<{ id: string }, string>({
      queryFn: async (id) => {
        const { error } = await supabase
          .from('income_sources')
          .delete()
          .eq('id', id);
        if (error) return { error };
        return { data: { id } };
      },
      invalidatesTags: ['IncomeSource'],
    }),
  }),
});

export const {
  useListIncomeSourcesQuery,
  useCreateIncomeSourceMutation,
  useUpdateIncomeSourceMutation,
  useDeleteIncomeSourceMutation,
} = incomeSourcesApi;
```
- **MIRROR**: RTK_QUERY_SDK_PATTERN — this file is the template Tasks 11-14 copy field-for-field, swapping table/type names.
- **IMPORTS**: `@/lib/supabase`, `@/types`, `./baseApi`.
- **GOTCHA**: `user_id` is **not** in `IncomeSourceInsert`'s required-caller-facing shape conceptually, but the type still requires it (see Task 4 — `user_id: string` is required in `Insert`) — the caller (a Phase 6 onboarding screen) must pass `session.user.id` explicitly. This phase does not inject `user_id` automatically from `authSlice` inside the `queryFn`, because `queryFn`s here are stateless w.r.t. Redux state (no `getState` wired) — keep it explicit at the call site instead of adding hidden implicit state access.
- **VALIDATE**: `npm run typecheck` passes; four hooks exported.

### Task 11: Recurring payments API
- **ACTION**: Create `src/store/api/recurringPaymentsApi.ts`.
- **IMPLEMENT**: Same shape as Task 10, table `recurring_payments`, types `RecurringPayment`/`RecurringPaymentInsert`/`RecurringPaymentUpdate`, list ordered by `next_payment_date` ascending (soonest-due first — matches the "upcoming payments" reading of the Recurring Payment Card), tag `'RecurringPayment'`, hooks `useListRecurringPaymentsQuery`/`useCreateRecurringPaymentMutation`/`useUpdateRecurringPaymentMutation`/`useDeleteRecurringPaymentMutation`.
```ts
import { supabase } from '@/lib/supabase';
import type {
  RecurringPayment,
  RecurringPaymentInsert,
  RecurringPaymentUpdate,
} from '@/types';

import { api } from './baseApi';

export const recurringPaymentsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listRecurringPayments: builder.query<RecurringPayment[], void>({
      queryFn: async () => {
        const { data, error } = await supabase
          .from('recurring_payments')
          .select('*')
          .order('next_payment_date', { ascending: true });
        if (error) return { error };
        return { data };
      },
      providesTags: ['RecurringPayment'],
    }),
    createRecurringPayment: builder.mutation<
      RecurringPayment,
      RecurringPaymentInsert
    >({
      queryFn: async (payload) => {
        const { data, error } = await supabase
          .from('recurring_payments')
          .insert(payload)
          .select()
          .single();
        if (error) return { error };
        return { data };
      },
      invalidatesTags: ['RecurringPayment'],
    }),
    updateRecurringPayment: builder.mutation<
      RecurringPayment,
      { id: string } & RecurringPaymentUpdate
    >({
      queryFn: async ({ id, ...changes }) => {
        const { data, error } = await supabase
          .from('recurring_payments')
          .update(changes)
          .eq('id', id)
          .select()
          .single();
        if (error) return { error };
        return { data };
      },
      invalidatesTags: ['RecurringPayment'],
    }),
    deleteRecurringPayment: builder.mutation<{ id: string }, string>({
      queryFn: async (id) => {
        const { error } = await supabase
          .from('recurring_payments')
          .delete()
          .eq('id', id);
        if (error) return { error };
        return { data: { id } };
      },
      invalidatesTags: ['RecurringPayment'],
    }),
  }),
});

export const {
  useListRecurringPaymentsQuery,
  useCreateRecurringPaymentMutation,
  useUpdateRecurringPaymentMutation,
  useDeleteRecurringPaymentMutation,
} = recurringPaymentsApi;
```
- **MIRROR**: Task 10.
- **IMPORTS**: `@/lib/supabase`, `@/types`, `./baseApi`.
- **GOTCHA**: Same explicit-`user_id` rule as Task 10.
- **VALIDATE**: `npm run typecheck` passes.

### Task 12: Goals API
- **ACTION**: Create `src/store/api/goalsApi.ts`.
- **IMPLEMENT**: Same shape as Task 10, table `goals`, types `Goal`/`GoalInsert`/`GoalUpdate`, list ordered by `created_at` descending, tag `'Goal'`, hooks `useListGoalsQuery`/`useCreateGoalMutation`/`useUpdateGoalMutation`/`useDeleteGoalMutation`.
```ts
import { supabase } from '@/lib/supabase';
import type { Goal, GoalInsert, GoalUpdate } from '@/types';

import { api } from './baseApi';

export const goalsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listGoals: builder.query<Goal[], void>({
      queryFn: async () => {
        const { data, error } = await supabase
          .from('goals')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) return { error };
        return { data };
      },
      providesTags: ['Goal'],
    }),
    createGoal: builder.mutation<Goal, GoalInsert>({
      queryFn: async (payload) => {
        const { data, error } = await supabase
          .from('goals')
          .insert(payload)
          .select()
          .single();
        if (error) return { error };
        return { data };
      },
      invalidatesTags: ['Goal'],
    }),
    updateGoal: builder.mutation<Goal, { id: string } & GoalUpdate>({
      queryFn: async ({ id, ...changes }) => {
        const { data, error } = await supabase
          .from('goals')
          .update(changes)
          .eq('id', id)
          .select()
          .single();
        if (error) return { error };
        return { data };
      },
      invalidatesTags: ['Goal'],
    }),
    deleteGoal: builder.mutation<{ id: string }, string>({
      queryFn: async (id) => {
        const { error } = await supabase.from('goals').delete().eq('id', id);
        if (error) return { error };
        return { data: { id } };
      },
      invalidatesTags: ['Goal'],
    }),
  }),
});

export const {
  useListGoalsQuery,
  useCreateGoalMutation,
  useUpdateGoalMutation,
  useDeleteGoalMutation,
} = goalsApi;
```
- **MIRROR**: Task 10.
- **IMPORTS**: `@/lib/supabase`, `@/types`, `./baseApi`.
- **GOTCHA**: Same explicit-`user_id` rule as Task 10. `current_amount` updates (progress toward a goal) go through `updateGoal`, not a separate endpoint — no dedicated "contribute to goal" mutation exists yet since no screen has specified that interaction (Hedef Detay is Phase 8).
- **VALIDATE**: `npm run typecheck` passes.

### Task 13: Budgets API
- **ACTION**: Create `src/store/api/budgetsApi.ts`.
- **IMPLEMENT**: Same shape as Task 10, table `budgets`, types `Budget`/`BudgetInsert`/`BudgetUpdate`. List takes an optional `periodMonth` filter (a `'YYYY-MM-DD'` string, first-of-month) since budgets are scoped per month; tag `'Budget'`.
```ts
import { supabase } from '@/lib/supabase';
import type { Budget, BudgetInsert, BudgetUpdate } from '@/types';

import { api } from './baseApi';

export const budgetsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listBudgets: builder.query<Budget[], string | void>({
      queryFn: async (periodMonth) => {
        let query = supabase.from('budgets').select('*');
        if (periodMonth) query = query.eq('period_month', periodMonth);
        const { data, error } = await query.order('category_name', {
          ascending: true,
        });
        if (error) return { error };
        return { data };
      },
      providesTags: ['Budget'],
    }),
    createBudget: builder.mutation<Budget, BudgetInsert>({
      queryFn: async (payload) => {
        const { data, error } = await supabase
          .from('budgets')
          .insert(payload)
          .select()
          .single();
        if (error) return { error };
        return { data };
      },
      invalidatesTags: ['Budget'],
    }),
    updateBudget: builder.mutation<Budget, { id: string } & BudgetUpdate>({
      queryFn: async ({ id, ...changes }) => {
        const { data, error } = await supabase
          .from('budgets')
          .update(changes)
          .eq('id', id)
          .select()
          .single();
        if (error) return { error };
        return { data };
      },
      invalidatesTags: ['Budget'],
    }),
    deleteBudget: builder.mutation<{ id: string }, string>({
      queryFn: async (id) => {
        const { error } = await supabase.from('budgets').delete().eq('id', id);
        if (error) return { error };
        return { data: { id } };
      },
      invalidatesTags: ['Budget'],
    }),
  }),
});

export const {
  useListBudgetsQuery,
  useCreateBudgetMutation,
  useUpdateBudgetMutation,
  useDeleteBudgetMutation,
} = budgetsApi;
```
- **MIRROR**: Task 10.
- **IMPORTS**: `@/lib/supabase`, `@/types`, `./baseApi`.
- **GOTCHA**: `listBudgets(undefined)` and `listBudgets()` both fetch **all** budgets across all months — callers that want "this month only" must pass an explicit `'YYYY-MM-01'` string. No implicit "current month" default is computed here (date/timezone logic belongs to the screen, not the data layer).
- **VALIDATE**: `npm run typecheck` passes.

### Task 14: Transactions API
- **ACTION**: Create `src/store/api/transactionsApi.ts`.
- **IMPLEMENT**: Same shape as Task 10, table `transactions`, types `Transaction`/`TransactionInsert`/`TransactionUpdate`, list ordered by `occurred_at` descending (newest first), tag `'Transaction'`.
```ts
import { supabase } from '@/lib/supabase';
import type { Transaction, TransactionInsert, TransactionUpdate } from '@/types';

import { api } from './baseApi';

export const transactionsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listTransactions: builder.query<Transaction[], void>({
      queryFn: async () => {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .order('occurred_at', { ascending: false });
        if (error) return { error };
        return { data };
      },
      providesTags: ['Transaction'],
    }),
    createTransaction: builder.mutation<Transaction, TransactionInsert>({
      queryFn: async (payload) => {
        const { data, error } = await supabase
          .from('transactions')
          .insert(payload)
          .select()
          .single();
        if (error) return { error };
        return { data };
      },
      invalidatesTags: ['Transaction'],
    }),
    updateTransaction: builder.mutation<
      Transaction,
      { id: string } & TransactionUpdate
    >({
      queryFn: async ({ id, ...changes }) => {
        const { data, error } = await supabase
          .from('transactions')
          .update(changes)
          .eq('id', id)
          .select()
          .single();
        if (error) return { error };
        return { data };
      },
      invalidatesTags: ['Transaction'],
    }),
    deleteTransaction: builder.mutation<{ id: string }, string>({
      queryFn: async (id) => {
        const { error } = await supabase
          .from('transactions')
          .delete()
          .eq('id', id);
        if (error) return { error };
        return { data: { id } };
      },
      invalidatesTags: ['Transaction'],
    }),
  }),
});

export const {
  useListTransactionsQuery,
  useCreateTransactionMutation,
  useUpdateTransactionMutation,
  useDeleteTransactionMutation,
} = transactionsApi;
```
- **MIRROR**: Task 10.
- **IMPORTS**: `@/lib/supabase`, `@/types`, `./baseApi`.
- **GOTCHA**: No pagination/range query yet (`listTransactions` fetches the full table). Acceptable for MVP data volume; add `.range()`/cursor pagination when Phase 7's İşlemler screen actually needs it — don't speculatively build it now.
- **VALIDATE**: `npm run typecheck` passes.

### Task 15: Profile API
- **ACTION**: Create `src/store/api/profileApi.ts`.
- **IMPLEMENT**:
```ts
import type { PostgrestError } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import type { Profile, ProfileUpdate } from '@/types';

import { api } from './baseApi';

const notAuthenticatedError: PostgrestError = {
  name: 'PostgrestError',
  message: 'Not authenticated.',
  details: '',
  hint: '',
  code: 'AUTH',
};

export const profileApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getProfile: builder.query<Profile, void>({
      queryFn: async () => {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) return { error: notAuthenticatedError };

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userData.user.id)
          .single();
        if (error) return { error };
        return { data };
      },
      providesTags: ['Profile'],
    }),
    updateProfile: builder.mutation<Profile, ProfileUpdate>({
      queryFn: async (changes) => {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) return { error: notAuthenticatedError };

        const { data, error } = await supabase
          .from('profiles')
          .update(changes)
          .eq('id', userData.user.id)
          .select()
          .single();
        if (error) return { error };
        return { data };
      },
      invalidatesTags: ['Profile'],
    }),
  }),
});

export const { useGetProfileQuery, useUpdateProfileMutation } = profileApi;
```
- **MIRROR**: RTK_QUERY_SDK_PATTERN, adapted for a single-row-per-user table (no `id` argument needed — resolved from `auth.getUser()`).
- **IMPORTS**: `@supabase/supabase-js` (type only), `@/lib/supabase`, `@/types`, `./baseApi`.
- **GOTCHA**: `notAuthenticatedError` is a hand-built object matching `PostgrestError`'s shape (`name`/`message`/`details`/`hint`/`code`) — this is the one place in the data layer that fabricates an error rather than passing one through from Supabase, because `getProfile`/`updateProfile` are the only endpoints that can be called before a session exists.
- **VALIDATE**: `npm run typecheck` passes.

### Task 16: API barrel
- **ACTION**: Create `src/store/api/index.ts`.
- **IMPLEMENT**:
```ts
export * from './baseApi';
export * from './budgetsApi';
export * from './goalsApi';
export * from './incomeSourcesApi';
export * from './profileApi';
export * from './recurringPaymentsApi';
export * from './transactionsApi';
```
- **MIRROR**: BARREL_PATTERN (`src/molecules/index.ts`) — alphabetical `export * from`.
- **IMPORTS**: N/A (this file only re-exports).
- **GOTCHA**: This barrel does double duty: it re-exports every hook AND, by importing all six `injectEndpoints` files, guarantees they actually run their `api.injectEndpoints({...})` call. **Every future screen must import hooks from `@/store/api`, never from an individual `xApi.ts` file** — importing e.g. only `budgetsApi.ts` directly would still register `budgets`' endpoints (since injection is a side effect of that module loading), but it's an easy way to accidentally end up with an inconsistent import style across screens. Standardize on the barrel.
- **VALIDATE**: `npm run typecheck` passes; `grep -r "from '@/store/api/" src/` (once Phase 6 exists) should only ever match this file itself, never a screen.

### Task 17: Wire the store
- **ACTION**: Update `src/store/store.ts`.
- **IMPLEMENT**:
```ts
import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';

import { api } from './api/baseApi';
import appReducer from './slices/appSlice';
import authReducer from './slices/authSlice';
import themeReducer from './slices/themeSlice';

export const store = configureStore({
  reducer: {
    app: appReducer,
    auth: authReducer,
    theme: themeReducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```
- **MIRROR**: STORE_ASSEMBLY_PATTERN (`src/store/store.ts:1-15`, current).
- **IMPORTS**: `@reduxjs/toolkit/query` (`setupListeners`), `./api/baseApi`, `./slices/authSlice`.
- **GOTCHA**: Import `api` from `./api/baseApi` here, **not** from `./api` (the Task 16 barrel) — importing the barrel here would be circular-ish and also means the store module (loaded very early, before any screen) forces all 6 entity modules to eagerly load too. `store.ts` only needs the reducer/middleware, which live on the base `api` object itself.
- **VALIDATE**: `npm run typecheck` passes; `RootState`/`AppDispatch` now include `auth` and `api` keys — confirm via `npm run typecheck` that `src/store/hooks.ts` (unchanged) still compiles against the wider `RootState`.

### Task 18: Session bootstrap in the root layout
- **ACTION**: Update `src/app/_layout.tsx`.
- **IMPLEMENT**:
```tsx
import {
  Geist_400Regular,
  Geist_600SemiBold,
  Geist_700Bold,
} from '@expo-google-fonts/geist';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Provider } from 'react-redux';

import { supabase } from '@/lib/supabase';
import { setBootstrapped } from '@/store/slices/appSlice';
import { setSession } from '@/store/slices/authSlice';
import { store } from '@/store/store';
import { ThemeProvider } from '@/theme';

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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      store.dispatch(setSession(session));
      store.dispatch(setBootstrapped(true));
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      store.dispatch(setSession(session));
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!fontsLoaded && !fontError) return null;

  return (
    <Provider store={store}>
      <ThemeProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </ThemeProvider>
    </Provider>
  );
}
```
- **MIRROR**: Existing font-loading `useEffect` in the same file — same shape, second independent effect.
- **IMPORTS**: `@/lib/supabase`, `@/store/slices/appSlice`, `@/store/slices/authSlice`, `@/store/store`.
- **GOTCHA**: Dispatch via the imported `store.dispatch(...)` directly, **not** `useAppDispatch()` — `RootLayout` renders the `<Provider>` itself, so it is not a descendant of its own context and `useAppDispatch`/`useSelector` are unavailable inside it. This is intentional and matches how `store` is already imported as a plain module elsewhere.
- **GOTCHA**: The `getSession()` bootstrap effect is independent of the font-loading effect and does not gate the splash-screen hide — auth state resolves in the background while `(tabs)` renders. Phase 6's route guards (redirect to Login if unauthenticated) are out of scope here; this phase only guarantees `authSlice` is populated by the time any screen mounts and reads it.
- **VALIDATE**: `npm run typecheck` passes; `npm run lint` passes (no unused imports).

### Task 19: Update `.claude/phases.md`
- **ACTION**: Check off the Phase 5 boxes once all validation passes.
- **IMPLEMENT**: Change all 5 `- [ ]` lines under `## Phase 5` to `- [x]`, matching the `## Phase 5 — Supabase Schema & Data Layer ✅ complete — report: ...` heading format used by Phases 0-4.
- **MIRROR**: `.claude/phases.md` lines 7, 16, 21, 25, 29 (existing completed-phase headings).
- **IMPORTS**: N/A.
- **GOTCHA**: Only do this after the migration has actually been pushed to a linked project and `get_advisors` shows no RLS warnings (see Validation Commands) — do not check the boxes based on local typecheck/lint alone, since "Dev workflow" and the schema itself are the actual deliverables of this phase, not just the Redux plumbing.
- **VALIDATE**: N/A — documentation-only change, part of the completion report, not a code task.

---

## Testing Strategy

### Unit Tests
None — no test runner is configured in this repo (consistent with Phases 0-4; see each phase's report "Tests Written: None").

### Edge Cases Checklist
- [ ] `listBudgets()` with no `periodMonth` argument returns budgets across all months (not filtered to "current")
- [ ] `createIncomeSource`/`createRecurringPayment`/`createGoal`/`createBudget`/`createTransaction` all reject (RLS `with check` failure) if called with a `user_id` that isn't the caller's own `auth.uid()`
- [ ] Deleting the authenticated user's `auth.users` row cascades and removes all 6 tables' rows for that user (verify via `mcp__supabase__execute_sql` against a disposable test user, not against real data)
- [ ] `signInWithGoogle()` rejection path: `WebBrowser.openAuthSessionAsync` returning `type !== 'success'` (user cancels) throws a clean `Error`, not an unhandled promise rejection
- [ ] `getProfile()`/`updateProfile()` called with no active session return the fabricated `notAuthenticatedError`, not a Supabase network error

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
EXPECT: Zero lint errors.

```bash
npm run format:check
```
EXPECT: No formatting diffs.

### Database Validation
```bash
npx supabase link --project-ref <project-ref>
npx supabase db push
```
EXPECT: Migration applies cleanly with no errors.

Then, via the `supabase` MCP tools (inspect-only, per the Phase 5 workflow decision):
- `mcp__supabase__list_tables` → all 6 tables present with expected columns
- `mcp__supabase__get_advisors` (type: `security`) → zero warnings related to missing RLS or missing RLS policies on any of the 6 tables

### Manual Validation
- [ ] Supabase project created (dashboard or `supabase projects create`) and `.env` populated with real `EXPO_PUBLIC_SUPABASE_URL`/`EXPO_PUBLIC_SUPABASE_ANON_KEY` — prerequisite for every other manual check below
- [ ] Google OAuth provider enabled in Supabase Dashboard → Authentication → Providers, with a Google Cloud OAuth client configured (`https://<project-ref>.supabase.co/auth/v1/callback` as the authorized redirect URI)
- [ ] The `makeRedirectUri()` output (log it once during dev) is added to Supabase Dashboard → Authentication → URL Configuration → Redirect URLs
- [ ] `expo start` → app boots without the `_layout.tsx` bootstrap effect throwing
- [ ] Call `signUpWithEmail('test@example.com', 'password123')` from a temporary dev-only button or the RN debugger console → confirm via `mcp__supabase__execute_sql` (`select * from public.profiles`) that a matching `profiles` row was auto-created by the trigger
- [ ] Call `signInWithEmail(...)` with the same credentials → `authSlice.session` populates (inspect via Redux DevTools or a temporary console log)
- [ ] Call `signOut()` → `authSlice.session` returns to `null`, `status` becomes `'unauthenticated'`

---

## Acceptance Criteria
- [ ] All 19 tasks completed
- [ ] All Static Analysis validation commands pass
- [ ] Migration pushed to a linked Supabase project with zero RLS-related advisor warnings
- [ ] No type errors, no lint errors
- [ ] Manual auth smoke test (sign up → sign in → sign out) passes

## Completion Checklist
- [ ] Code follows discovered patterns (SLICE_PATTERN, RTK_QUERY_SDK_PATTERN, STORE_ASSEMBLY_PATTERN, BARREL_PATTERN)
- [ ] RLS enabled and policy-covered on all 6 tables
- [ ] No hardcoded Supabase URL/keys (env vars only, as before)
- [ ] `.claude/phases.md` Phase 5 checkboxes updated only after DB validation passes
- [ ] No unnecessary scope additions (no realtime, no aggregation views, no screens)
- [ ] Self-contained — no questions needed during implementation

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Supabase project not yet created/linked when implementation starts | Medium | Blocks migration push + all manual/DB validation | Code/schema/types/Redux artifacts (Tasks 1, 3-18) can be written and typechecked with zero live project; only Task 2's `link` step and the Database Validation section require it |
| Google OAuth redirect misconfigured in Supabase Dashboard / Google Cloud Console | Medium | `signInWithGoogle()` fails at runtime even though the code is correct | Validate the email/password path first (no external dashboard dependency); treat Google sign-in as a separate, later manual-validation step |
| Hand-written `src/types/database.ts` drifts from the real schema after a future migration | Low | Type errors mask real schema mismatches, or types are silently wrong | Regenerate via `npx supabase gen types typescript --linked` (or MCP `generate_typescript_types`) immediately after every future migration — make this a standing habit note for Phase 6+ |
| A table ships without (or with a wrong) RLS policy | Low-Medium | Cross-user data leak | `get_advisors` security check is a required Validation Command, not optional — Phase 5 is not done until it reports zero warnings |

## Notes
- **Why RTK Query over `createAsyncThunk`**: the existing `appSlice`/`themeSlice` pattern (manual `pending`/`fulfilled`/`rejected` handling) would require ~3 thunks × 5 entities = 15 hand-written thunks plus matching reducer cases, with no caching/dedup/tag-invalidation. RTK Query's `fakeBaseQuery` + `queryFn` pattern (officially documented for exactly this SDK-wrapping use case) gets caching, loading/error state, and cross-mutation cache invalidation (`invalidatesTags`/`providesTags`) essentially for free, at roughly the same line count per entity. `authSlice` stays a plain `createSlice` because session state is push-driven (`onAuthStateChange`), not request/response — a poor fit for RTK Query's query model.
- Phase 6 screens are the first real consumers of every hook exported here (`useListIncomeSourcesQuery`, `useCreateGoalMutation`, etc.) and of `signInWithEmail`/`signInWithGoogle`/`signUp`/`signOut` from `src/lib/auth.ts` — whoever plans Phase 6 should treat this file's `Files to Change` table as the fixed data-layer contract, not something to re-derive.
- The `theme_mode` column on `profiles` intentionally mirrors `ThemeMode` from `src/theme/tokens.ts` but is **not** wired to `themeSlice` in this phase (Phase 1's `themeSlice` persists via AsyncStorage per `.claude/phases.md` line 19) — reconciling "theme persisted locally" vs. "theme persisted in `profiles`" is a Phase 6/9 (Ayarlar) decision, not Phase 5's.
