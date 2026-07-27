-- fx_rates: shared snapshot cache of FX rates (base implied TRY).
-- rate = value of 1 unit of `quote` expressed in TRY (matches lib/currency.ts).
-- Not user-scoped: rates are the same for everyone, so policies allow any
-- authenticated user to read and to write the daily snapshot.
create table public.fx_rates (
  id uuid primary key default gen_random_uuid(),
  quote text not null check (quote in ('USD','EUR','GAU')),
  rate numeric(18,6) not null check (rate > 0),
  as_of date not null,
  created_at timestamptz not null default now(),
  unique (quote, as_of)
);

create index idx_fx_rates_quote_asof on public.fx_rates(quote, as_of desc);

alter table public.fx_rates enable row level security;

create policy "fx_rates_select_authenticated" on public.fx_rates
  for select to authenticated using (true);

create policy "fx_rates_insert_authenticated" on public.fx_rates
  for insert to authenticated with check (true);

create policy "fx_rates_update_authenticated" on public.fx_rates
  for update to authenticated using (true) with check (true);
