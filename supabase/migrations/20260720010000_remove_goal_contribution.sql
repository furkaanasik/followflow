-- Atomic contribution removal: delete the ledger row and subtract its amount
-- from goals.current_amount in one transaction. SECURITY INVOKER — RLS is the
-- guard; the ownership-scoped delete aborts the call for non-owned rows.
-- current_amount is clamped at 0 for goals seeded during onboarding whose
-- balance predates the ledger.
create or replace function public.remove_goal_contribution(
  p_contribution_id uuid
) returns public.goals
language plpgsql
security invoker set search_path = public
as $$
declare
  c public.goal_contributions;
  g public.goals;
begin
  delete from public.goal_contributions
    where id = p_contribution_id and user_id = auth.uid()
    returning * into c;
  if c.id is null then
    raise exception 'contribution not found or not owned';
  end if;
  update public.goals
    set current_amount = greatest(0, current_amount - c.amount)
    where id = c.goal_id and user_id = auth.uid()
    returning * into g;
  if g.id is null then
    raise exception 'goal not found or not owned';
  end if;
  return g;
end;
$$;

revoke execute on function public.remove_goal_contribution(uuid)
  from public, anon;
