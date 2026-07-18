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
