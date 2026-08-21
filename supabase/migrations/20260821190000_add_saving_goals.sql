CREATE TABLE public.saving_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  target_amount numeric(14,2) NOT NULL CHECK (target_amount > 0),
  target_date date,
  icon text NOT NULL DEFAULT 'piggy-bank',
  color text NOT NULL DEFAULT '#2563eb',
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX saving_goals_user_idx ON public.saving_goals(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saving_goals TO authenticated;
GRANT ALL ON public.saving_goals TO service_role;
ALTER TABLE public.saving_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own saving goals" ON public.saving_goals FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.saving_goal_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_id uuid NOT NULL REFERENCES public.saving_goals(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  transaction_id uuid REFERENCES public.transactions(id) ON DELETE SET NULL,
  amount numeric(14,2) NOT NULL CHECK (amount > 0),
  date date NOT NULL DEFAULT current_date,
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX saving_goal_contributions_user_idx ON public.saving_goal_contributions(user_id);
CREATE INDEX saving_goal_contributions_goal_idx ON public.saving_goal_contributions(goal_id);
CREATE INDEX saving_goal_contributions_account_idx ON public.saving_goal_contributions(account_id);
CREATE INDEX saving_goal_contributions_transaction_idx ON public.saving_goal_contributions(transaction_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saving_goal_contributions TO authenticated;
GRANT ALL ON public.saving_goal_contributions TO service_role;
ALTER TABLE public.saving_goal_contributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own saving goal contributions" ON public.saving_goal_contributions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.touch_saving_goal_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $fn$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$fn$;

CREATE TRIGGER saving_goals_updated_at
BEFORE UPDATE ON public.saving_goals
FOR EACH ROW EXECUTE FUNCTION public.touch_saving_goal_updated_at();
