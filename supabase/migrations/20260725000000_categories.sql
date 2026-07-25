-- Per-user category overlay: custom categories (builtin_key null) or
-- overrides of built-ins (builtin_key = static key, e.g. 'market').
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  builtin_key text,
  type text not null check (type in ('income', 'expense')),
  name text,
  icon text,
  color text,
  hidden boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_custom_complete check (
    builtin_key is not null
    or (name is not null and icon is not null and color is not null)
  )
);

create unique index categories_user_builtin_uniq
  on public.categories(user_id, builtin_key) where builtin_key is not null;
create index idx_categories_user on public.categories(user_id);

create trigger set_updated_at before update on public.categories
  for each row execute function public.set_updated_at();

alter table public.categories enable row level security;
create policy "categories_all_own" on public.categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
