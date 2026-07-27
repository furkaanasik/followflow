-- Multi-currency: every money-bearing row carries an explicit currency;
-- profiles carry the main reporting currency. Default 'TRY' keeps all
-- pre-existing rows valid and the app regression-free.

alter table public.transactions
  add column currency text not null default 'TRY'
  constraint transactions_currency_check check (currency in ('TRY','USD','EUR','GAU'));

alter table public.income_sources
  add column currency text not null default 'TRY'
  constraint income_sources_currency_check check (currency in ('TRY','USD','EUR','GAU'));

alter table public.recurring_payments
  add column currency text not null default 'TRY'
  constraint recurring_payments_currency_check check (currency in ('TRY','USD','EUR','GAU'));

alter table public.goals
  add column currency text not null default 'TRY'
  constraint goals_currency_check check (currency in ('TRY','USD','EUR','GAU'));

alter table public.budgets
  add column currency text not null default 'TRY'
  constraint budgets_currency_check check (currency in ('TRY','USD','EUR','GAU'));

alter table public.goal_contributions
  add column currency text not null default 'TRY'
  constraint goal_contributions_currency_check check (currency in ('TRY','USD','EUR','GAU'));

alter table public.profiles
  add column main_currency text not null default 'TRY'
  constraint profiles_main_currency_check check (main_currency in ('TRY','USD','EUR','GAU'));
