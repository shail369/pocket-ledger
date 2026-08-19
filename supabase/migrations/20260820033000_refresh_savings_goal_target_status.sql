create or replace function public.refresh_savings_goal_target_status()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_saved numeric;
begin
  if new.status in ('paused', 'archived') then
    return new;
  end if;

  select coalesce(sum(amount), 0) into v_saved
  from public.savings_goal_contributions
  where goal_id = new.id;

  if v_saved >= new.target_amount then
    new.status := 'completed';
  else
    new.status := 'active';
  end if;
  return new;
end;
$$;

drop trigger if exists savings_goal_target_status on public.savings_goals;
create trigger savings_goal_target_status
before update of target_amount on public.savings_goals
for each row execute function public.refresh_savings_goal_target_status();
