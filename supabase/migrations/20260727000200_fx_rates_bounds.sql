-- Sanity bounds on shared fx_rates writes (code review HIGH finding).
-- Any authenticated client may write the daily snapshot, so a buggy or
-- malicious client could poison rates for everyone. Bounds below are per
-- quote in TRY and generous (~50x around 2026 levels) — they stop absurd
-- values (0.0001 or 1e9) without needing maintenance on normal FX drift.
alter table public.fx_rates
  drop constraint fx_rates_rate_check;

alter table public.fx_rates
  add constraint fx_rates_rate_check check (
    (quote = 'USD' and rate between 1 and 2500)
    or (quote = 'EUR' and rate between 1 and 2500)
    or (quote = 'GAU' and rate between 100 and 200000)
  );
