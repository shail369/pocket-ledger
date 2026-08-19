-- Savings Goals: reserve existing account money without creating transactions.
create table if not exists public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete restrict,
  name text not null,
  description text not null default '',
  icon text not null default 'target',
  goal_type text not null default 'other',
  priority text not null default 'medium',
  target_amount numeric(14,2) not null check (target_amount > 0),
  target_date date,
  status text not null default 'active' check (status in ('active','paused','completed','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (goal_type in ('emergency','travel','education','vehicle','home','shopping','investment','other')),
  check (priority in ('high','medium','low'))
);

create table if not exists public.savings_goal_contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid not null references public.savings_goals(id) on delete cascade,
  amount numeric(14,2) not null check (amount > 0),
  date date not null default current_date,
  note text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists savings_goals_user_id_idx on public.savings_goals(user_id);
create index if not exists savings_goals_account_id_idx on public.savings_goals(account_id);
create index if not exists savings_goal_contributions_goal_id_idx on public.savings_goal_contributions(goal_id);
create index if not exists savings_goal_contributions_user_id_idx on public.savings_goal_contributions(user_id);

alter table public.savings_goals enable row level security;
alter table public.savings_goal_contributions enable row level security;

drop policy if exists "Users can view their savings goals" on public.savings_goals;
create policy "Users can view their savings goals" on public.savings_goals
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their savings goals" on public.savings_goals;
create policy "Users can insert their savings goals" on public.savings_goals
  for insert with check (
    auth.uid() = user_id
    and exists (select 1 from public.accounts a where a.id = account_id and a.user_id = auth.uid())
  );

drop policy if exists "Users can update their savings goals" on public.savings_goals;
create policy "Users can update their savings goals" on public.savings_goals
  for update using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.accounts a where a.id = account_id and a.user_id = auth.uid())
  );

drop policy if exists "Users can delete their savings goals" on public.savings_goals;
create policy "Users can delete their savings goals" on public.savings_goals
  for delete using (auth.uid() = user_id);

drop policy if exists "Users can view their savings goal contributions" on public.savings_goal_contributions;
create policy "Users can view their savings goal contributions" on public.savings_goal_contributions
  for select using (
    auth.uid() = user_id
    and exists (select 1 from public.savings_goals g where g.id = goal_id and g.user_id = auth.uid())
  );

drop policy if exists "Users can insert their savings goal contributions" on public.savings_goal_contributions;
create policy "Users can insert their savings goal contributions" on public.savings_goal_contributions
  for insert with check (
    auth.uid() = user_id
    and exists (select 1 from public.savings_goals g where g.id = goal_id and g.user_id = auth.uid())
  );

drop policy if exists "Users can update their savings goal contributions" on public.savings_goal_contributions;
create policy "Users can update their savings goal contributions" on public.savings_goal_contributions
  for update using (
    auth.uid() = user_id
    and exists (select 1 from public.savings_goals g where g.id = goal_id and g.user_id = auth.uid())
  )
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.savings_goals g where g.id = goal_id and g.user_id = auth.uid())
  );

drop policy if exists "Users can delete their savings goal contributions" on public.savings_goal_contributions;
create policy "Users can delete their savings goal contributions" on public.savings_goal_contributions
  for delete using (
    auth.uid() = user_id
    and exists (select 1 from public.savings_goals g where g.id = goal_id and g.user_id = auth.uid())
  );

create or replace function public.savings_goal_actual_balance(p_account_id uuid)
returns numeric
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(a.opening_balance, 0)
    + coalesce((select sum(case when t.type = 'income' and t.account_id = a.id then t.amount else 0 end)
                from public.transactions t where t.account_id = a.id), 0)
    - coalesce((select sum(case when t.type = 'expense' and t.account_id = a.id then t.amount else 0 end)
                from public.transactions t where t.account_id = a.id), 0)
    - coalesce((select sum(case when t.type = 'transfer' and t.account_id = a.id then t.amount else 0 end)
                from public.transactions t where t.account_id = a.id), 0)
    + coalesce((select sum(case when t.type = 'transfer' and t.transfer_account_id = a.id then t.amount else 0 end)
                from public.transactions t where t.transfer_account_id = a.id), 0)
  from public.accounts a
  where a.id = p_account_id and a.user_id = auth.uid();
$$;

create or replace function public.add_savings_goal_contribution(
  p_goal_id uuid,
  p_amount numeric,
  p_date date default current_date,
  p_note text default ''
)
returns public.savings_goal_contributions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_goal public.savings_goals%rowtype;
  v_available numeric;
  v_allocated numeric;
  v_actual numeric;
  v_row public.savings_goal_contributions%rowtype;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'Contribution amount must be greater than zero'; end if;

  select * into v_goal
  from public.savings_goals
  where id = p_goal_id and user_id = auth.uid()
  for update;
  if not found then raise exception 'Savings goal not found'; end if;

  v_actual := coalesce(public.savings_goal_actual_balance(v_goal.account_id), 0);
  select coalesce(sum(c.amount), 0) into v_allocated
  from public.savings_goal_contributions c
  join public.savings_goals g on g.id = c.goal_id
  where g.account_id = v_goal.account_id and g.user_id = auth.uid() and g.status <> 'archived';
  v_available := v_actual - v_allocated;

  if p_amount > v_available then
    raise exception 'Not enough available balance. Available: %', round(v_available, 2);
  end if;

  insert into public.savings_goal_contributions(user_id, goal_id, amount, date, note)
  values (auth.uid(), p_goal_id, round(p_amount, 2), coalesce(p_date, current_date), coalesce(p_note, ''))
  returning * into v_row;
  return v_row;
end;
$$;

grant execute on function public.add_savings_goal_contribution(uuid, numeric, date, text) to authenticated;

create or replace function public.update_savings_goal_contribution(
  p_contribution_id uuid,
  p_amount numeric,
  p_date date,
  p_note text
)
returns public.savings_goal_contributions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current public.savings_goal_contributions%rowtype;
  v_goal public.savings_goals%rowtype;
  v_available numeric;
  v_allocated numeric;
  v_actual numeric;
  v_row public.savings_goal_contributions%rowtype;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'Contribution amount must be greater than zero'; end if;

  select * into v_current
  from public.savings_goal_contributions
  where id = p_contribution_id and user_id = auth.uid()
  for update;
  if not found then raise exception 'Contribution not found'; end if;

  select * into v_goal from public.savings_goals where id = v_current.goal_id and user_id = auth.uid() for update;
  if not found then raise exception 'Savings goal not found'; end if;

  v_actual := coalesce(public.savings_goal_actual_balance(v_goal.account_id), 0);
  select coalesce(sum(c.amount), 0) into v_allocated
  from public.savings_goal_contributions c
  join public.savings_goals g on g.id = c.goal_id
  where g.account_id = v_goal.account_id and g.user_id = auth.uid() and g.status <> 'archived' and c.id <> p_contribution_id;
  v_available := v_actual - v_allocated;

  if p_amount > v_available then
    raise exception 'Not enough available balance. Available: %', round(v_available, 2);
  end if;

  update public.savings_goal_contributions
  set amount = round(p_amount, 2), date = coalesce(p_date, current_date), note = coalesce(p_note, '')
  where id = p_contribution_id
  returning * into v_row;
  return v_row;
end;
$$;

grant execute on function public.update_savings_goal_contribution(uuid, numeric, date, text) to authenticated;

create or replace function public.refresh_savings_goal_status()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_target numeric;
  v_saved numeric;
begin
  select target_amount into v_target from public.savings_goals where id = coalesce(new.goal_id, old.goal_id);
  select coalesce(sum(amount), 0) into v_saved from public.savings_goal_contributions where goal_id = coalesce(new.goal_id, old.goal_id);
  update public.savings_goals
  set status = case
    when status = 'archived' or status = 'paused' then status
    when v_saved >= v_target then 'completed'
    else 'active'
  end,
  updated_at = now()
  where id = coalesce(new.goal_id, old.goal_id);
  return coalesce(new, old);
end;
$$;

drop trigger if exists savings_goal_contribution_status on public.savings_goal_contributions;
create trigger savings_goal_contribution_status
after insert or update or delete on public.savings_goal_contributions
for each row execute function public.refresh_savings_goal_status();

create or replace function public.refresh_savings_goal_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists savings_goal_updated_at on public.savings_goals;
create trigger savings_goal_updated_at
before update on public.savings_goals
for each row execute function public.refresh_savings_goal_updated_at();
