-- goal_contributions: append-only ledger of deposits toward a goal.
create table public.goal_contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid not null references public.goals(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  note text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index idx_goal_contributions_goal on public.goal_contributions(goal_id, occurred_at desc);
create index idx_goal_contributions_user on public.goal_contributions(user_id);

alter table public.goal_contributions enable row level security;

create policy "goal_contributions_all_own" on public.goal_contributions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Atomic deposit: bump goals.current_amount and insert the ledger row in one
-- transaction. SECURITY INVOKER — RLS on goals/goal_contributions is the
-- guard; the ownership-scoped update doubles as an explicit check so a
-- non-owned goal aborts the whole call instead of silently inserting nothing.
create or replace function public.add_goal_contribution(
  p_goal_id uuid,
  p_amount numeric,
  p_note text default null,
  p_occurred_at timestamptz default now()
) returns public.goals
language plpgsql
security invoker set search_path = public
as $$
declare
  g public.goals;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'amount must be positive';
  end if;
  update public.goals
    set current_amount = current_amount + p_amount
    where id = p_goal_id and user_id = auth.uid()
    returning * into g;
  if g.id is null then
    raise exception 'goal not found or not owned';
  end if;
  insert into public.goal_contributions (user_id, goal_id, amount, note, occurred_at)
    values (auth.uid(), p_goal_id, p_amount, p_note, p_occurred_at);
  return g;
end;
$$;

-- authenticated retains EXECUTE for the RPC call
revoke execute on function public.add_goal_contribution(uuid, numeric, text, timestamptz)
  from public, anon;
