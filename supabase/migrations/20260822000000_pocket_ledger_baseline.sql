-- Pocket Ledger current database baseline.
-- Idempotent current schema. No demo financial data is created.
-- Future schema changes belong in new migrations after this baseline.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  email text,
  currency text NOT NULL DEFAULT 'INR',
  default_account_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own profile" ON public.profiles;
CREATE POLICY "own profile" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE IF NOT EXISTS public.accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'bank',
  opening_balance numeric(14,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'INR',
  icon text NOT NULL DEFAULT 'wallet',
  color text NOT NULL DEFAULT '#2563eb',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS accounts_user_idx ON public.accounts(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accounts TO authenticated;
GRANT ALL ON public.accounts TO service_role;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own accounts" ON public.accounts;
CREATE POLICY "own accounts" ON public.accounts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  parent_id uuid REFERENCES public.categories(id) ON DELETE CASCADE,
  icon text NOT NULL DEFAULT 'tag',
  kind text NOT NULL DEFAULT 'expense' CHECK (kind IN ('expense','income')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS categories_user_idx ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS categories_parent_idx ON public.categories(parent_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own categories" ON public.categories;
CREATE POLICY "own categories" ON public.categories FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  transfer_account_id uuid REFERENCES public.accounts(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  amount numeric(14,2) NOT NULL CHECK (amount > 0),
  type text NOT NULL CHECK (type IN ('expense','income','transfer')),
  date date NOT NULL DEFAULT current_date,
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS transactions_user_date_idx ON public.transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS transactions_account_idx ON public.transactions(account_id);
CREATE INDEX IF NOT EXISTS transactions_category_idx ON public.transactions(category_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own transactions" ON public.transactions;
CREATE POLICY "own transactions" ON public.transactions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.categories(id) ON DELETE CASCADE,
  account_id uuid REFERENCES public.accounts(id) ON DELETE CASCADE,
  amount numeric(14,2) NOT NULL CHECK (amount > 0),
  period text NOT NULL DEFAULT 'monthly' CHECK (period IN ('monthly','weekly')),
  start_date date NOT NULL DEFAULT current_date,
  end_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS budgets_user_idx ON public.budgets(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.budgets TO authenticated;
GRANT ALL ON public.budgets TO service_role;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own budgets" ON public.budgets;
CREATE POLICY "own budgets" ON public.budgets FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.recurring_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  amount numeric(14,2) NOT NULL CHECK (amount > 0),
  type text NOT NULL CHECK (type IN ('expense','income')),
  description text NOT NULL DEFAULT '',
  frequency text NOT NULL CHECK (frequency IN ('daily','weekly','monthly','yearly')),
  start_date date NOT NULL DEFAULT current_date,
  next_occurrence date NOT NULL DEFAULT current_date,
  end_date date,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS recurring_user_idx ON public.recurring_transactions(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recurring_transactions TO authenticated;
GRANT ALL ON public.recurring_transactions TO service_role;
ALTER TABLE public.recurring_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own recurring" ON public.recurring_transactions;
CREATE POLICY "own recurring" ON public.recurring_transactions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.saving_goals (
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
CREATE INDEX IF NOT EXISTS saving_goals_user_idx ON public.saving_goals(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saving_goals TO authenticated;
GRANT ALL ON public.saving_goals TO service_role;
ALTER TABLE public.saving_goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own saving goals" ON public.saving_goals;
CREATE POLICY "own saving goals" ON public.saving_goals FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.saving_goal_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_id uuid NOT NULL REFERENCES public.saving_goals(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  amount numeric(14,2) NOT NULL CHECK (amount > 0),
  date date NOT NULL DEFAULT current_date,
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS saving_goal_contributions_user_idx ON public.saving_goal_contributions(user_id);
CREATE INDEX IF NOT EXISTS saving_goal_contributions_goal_idx ON public.saving_goal_contributions(goal_id);
CREATE INDEX IF NOT EXISTS saving_goal_contributions_account_idx ON public.saving_goal_contributions(account_id);
CREATE INDEX IF NOT EXISTS saving_goal_contributions_account_goal_idx ON public.saving_goal_contributions(account_id, goal_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saving_goal_contributions TO authenticated;
GRANT ALL ON public.saving_goal_contributions TO service_role;
ALTER TABLE public.saving_goal_contributions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own saving goal contributions" ON public.saving_goal_contributions;
CREATE POLICY "own saving goal contributions" ON public.saving_goal_contributions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.touch_saving_goal_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS saving_goals_updated_at ON public.saving_goals;
CREATE TRIGGER saving_goals_updated_at BEFORE UPDATE ON public.saving_goals FOR EACH ROW EXECUTE FUNCTION public.touch_saving_goal_updated_at();

CREATE OR REPLACE FUNCTION public.validate_saving_goal_contribution()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  account_balance numeric(14,2);
  reserved_amount numeric(14,2);
  goal_saved numeric(14,2);
  goal_target numeric(14,2);
BEGIN
  SELECT a.opening_balance
    + COALESCE(SUM(CASE WHEN t.type = 'income' AND t.account_id = NEW.account_id THEN t.amount ELSE 0 END), 0)
    - COALESCE(SUM(CASE WHEN t.type = 'expense' AND t.account_id = NEW.account_id THEN t.amount ELSE 0 END), 0)
    - COALESCE(SUM(CASE WHEN t.type = 'transfer' AND t.account_id = NEW.account_id THEN t.amount ELSE 0 END), 0)
    + COALESCE(SUM(CASE WHEN t.type = 'transfer' AND t.transfer_account_id = NEW.account_id THEN t.amount ELSE 0 END), 0)
  INTO account_balance
  FROM public.accounts a
  LEFT JOIN public.transactions t ON t.user_id = NEW.user_id
  WHERE a.id = NEW.account_id
  GROUP BY a.opening_balance;

  IF account_balance IS NULL THEN RAISE EXCEPTION 'Account not found'; END IF;

  SELECT COALESCE(SUM(amount), 0) INTO reserved_amount
  FROM public.saving_goal_contributions
  WHERE account_id = NEW.account_id AND id <> NEW.id;

  IF reserved_amount + NEW.amount > account_balance THEN
    RAISE EXCEPTION 'Contribution exceeds the account available balance';
  END IF;

  SELECT target_amount INTO goal_target
  FROM public.saving_goals
  WHERE id = NEW.goal_id AND user_id = NEW.user_id;

  IF goal_target IS NULL THEN RAISE EXCEPTION 'Saving goal not found'; END IF;

  SELECT COALESCE(SUM(amount), 0) INTO goal_saved
  FROM public.saving_goal_contributions
  WHERE goal_id = NEW.goal_id AND id <> NEW.id;

  IF goal_saved + NEW.amount > goal_target THEN
    RAISE EXCEPTION 'Contribution exceeds the saving goal target';
  END IF;

  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS validate_saving_goal_contribution ON public.saving_goal_contributions;
CREATE TRIGGER validate_saving_goal_contribution BEFORE INSERT OR UPDATE ON public.saving_goal_contributions FOR EACH ROW EXECUTE FUNCTION public.validate_saving_goal_contribution();

-- Exact category structure from the current Pocket Ledger seed data.
-- Only categories are created. No demo accounts, transactions, budgets,
-- recurring entries, or other financial rows are created.
CREATE OR REPLACE FUNCTION public.seed_demo_data()
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  parent_category_id uuid;
  category record;
  subcategory text;
  income_category record;
  income_subcategory text;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  FOR category IN
    SELECT * FROM (VALUES
      ('Food', 'utensils', ARRAY['Groceries','Restaurants','Fast Food','Delivery','Cafes']),
      ('Transportation', 'car', ARRAY['Fuel','Public Transport','Taxi/Ride Sharing','Parking','Maintenance']),
      ('Housing', 'home', ARRAY['Rent','Electricity','Water','Internet','Maintenance']),
      ('Shopping', 'shopping-bag', ARRAY['Clothing','Electronics','Household','Gifts']),
      ('Bills', 'receipt', ARRAY['Mobile','Insurance','Subscriptions']),
      ('Entertainment', 'clapperboard', ARRAY['Movies','Games','Streaming','Events']),
      ('Education', 'graduation-cap', ARRAY['Courses','Books','College','Supplies']),
      ('Health', 'heart-pulse', ARRAY['Medicine','Doctor','Gym']),
      ('Other', 'circle-ellipsis', ARRAY['Miscellaneous'])
    ) AS t(name, icon, subcategories)
  LOOP
    SELECT c.id INTO parent_category_id
    FROM public.categories c
    WHERE c.user_id = uid AND c.name = category.name
      AND c.kind = 'expense' AND c.parent_id IS NULL
    LIMIT 1;

    IF parent_category_id IS NULL THEN
      INSERT INTO public.categories(user_id, name, icon, kind)
      VALUES (uid, category.name, category.icon, 'expense')
      RETURNING id INTO parent_category_id;
    END IF;

    FOREACH subcategory IN ARRAY category.subcategories LOOP
      INSERT INTO public.categories(user_id, name, parent_id, icon, kind)
      SELECT uid, subcategory, parent_category_id, category.icon, 'expense'
      WHERE NOT EXISTS (
        SELECT 1 FROM public.categories c
        WHERE c.user_id = uid AND c.name = subcategory
          AND c.parent_id = parent_category_id AND c.kind = 'expense'
      );
    END LOOP;
  END LOOP;

  FOR income_category IN
    SELECT * FROM (VALUES
      ('Salary', 'briefcase', ARRAY['Base Salary','Bonus','Overtime']),
      ('Freelance', 'laptop', ARRAY['Projects','Consulting','Other Freelance']),
      ('Interest', 'piggy-bank', ARRAY['Bank Interest','Investment Interest']),
      ('Other Income', 'circle-plus', ARRAY['Cashback','Gifts','Refunds','Other'])
    ) AS t(name, icon, subcategories)
  LOOP
    SELECT c.id INTO parent_category_id
    FROM public.categories c
    WHERE c.user_id = uid AND c.name = income_category.name
      AND c.kind = 'income' AND c.parent_id IS NULL
    LIMIT 1;

    IF parent_category_id IS NULL THEN
      INSERT INTO public.categories(user_id, name, icon, kind)
      VALUES (uid, income_category.name, income_category.icon, 'income')
      RETURNING id INTO parent_category_id;
    END IF;

    FOREACH income_subcategory IN ARRAY income_category.subcategories LOOP
      INSERT INTO public.categories(user_id, name, parent_id, icon, kind)
      SELECT uid, income_subcategory, parent_category_id, income_category.icon, 'income'
      WHERE NOT EXISTS (
        SELECT 1 FROM public.categories c
        WHERE c.user_id = uid AND c.name = income_subcategory
          AND c.parent_id = parent_category_id AND c.kind = 'income'
      );
    END LOOP;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.seed_demo_data() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.seed_demo_data() FROM anon;
GRANT EXECUTE ON FUNCTION public.seed_demo_data() TO authenticated;
