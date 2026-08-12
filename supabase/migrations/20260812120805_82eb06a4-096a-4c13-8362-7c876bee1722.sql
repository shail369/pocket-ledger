
-- profiles
CREATE TABLE public.profiles (
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
CREATE POLICY "own profile" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.accounts (
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
CREATE INDEX accounts_user_idx ON public.accounts(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accounts TO authenticated;
GRANT ALL ON public.accounts TO service_role;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own accounts" ON public.accounts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  parent_id uuid REFERENCES public.categories(id) ON DELETE CASCADE,
  icon text NOT NULL DEFAULT 'tag',
  kind text NOT NULL DEFAULT 'expense' CHECK (kind IN ('expense','income')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX categories_user_idx ON public.categories(user_id);
CREATE INDEX categories_parent_idx ON public.categories(parent_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own categories" ON public.categories FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.transactions (
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
CREATE INDEX transactions_user_date_idx ON public.transactions(user_id, date DESC);
CREATE INDEX transactions_account_idx ON public.transactions(account_id);
CREATE INDEX transactions_category_idx ON public.transactions(category_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own transactions" ON public.transactions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.budgets (
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
CREATE INDEX budgets_user_idx ON public.budgets(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.budgets TO authenticated;
GRANT ALL ON public.budgets TO service_role;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own budgets" ON public.budgets FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.recurring_transactions (
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
CREATE INDEX recurring_user_idx ON public.recurring_transactions(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recurring_transactions TO authenticated;
GRANT ALL ON public.recurring_transactions TO service_role;
ALTER TABLE public.recurring_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own recurring" ON public.recurring_transactions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Demo data generator
CREATE OR REPLACE FUNCTION public.seed_demo_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  uid uuid := auth.uid();
  a_hdfc uuid; a_cash uuid; a_gpay uuid; a_card uuid;
  accs uuid[];
  pid uuid; s text; rec record; d date; i int; n int;
  c_id uuid; c_name text; p_name text; amt numeric; acc uuid;
  cat_food uuid; cat_trans uuid; cat_house uuid; cat_shop uuid; cat_ent uuid;
  sub_rent uuid; cat_salary uuid; cat_free uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF EXISTS (SELECT 1 FROM accounts WHERE user_id = uid) THEN RETURN; END IF;

  INSERT INTO accounts(user_id,name,type,opening_balance,icon,color) VALUES (uid,'HDFC Savings','bank',50000,'landmark','#2563eb') RETURNING id INTO a_hdfc;
  INSERT INTO accounts(user_id,name,type,opening_balance,icon,color) VALUES (uid,'Cash','cash',6000,'banknote','#16a34a') RETURNING id INTO a_cash;
  INSERT INTO accounts(user_id,name,type,opening_balance,icon,color) VALUES (uid,'Google Pay','wallet',3000,'smartphone','#a855f7') RETURNING id INTO a_gpay;
  INSERT INTO accounts(user_id,name,type,opening_balance,icon,color) VALUES (uid,'ICICI Credit Card','card',0,'credit-card','#f97316') RETURNING id INTO a_card;
  accs := ARRAY[a_hdfc,a_cash,a_gpay,a_card];

  FOR rec IN SELECT * FROM (VALUES
    ('Food','utensils', ARRAY['Groceries','Restaurants','Fast Food','Delivery','Cafes']),
    ('Transportation','car', ARRAY['Fuel','Public Transport','Taxi/Ride Sharing','Parking','Maintenance']),
    ('Housing','home', ARRAY['Rent','Electricity','Water','Internet','Maintenance']),
    ('Shopping','shopping-bag', ARRAY['Clothing','Electronics','Household','Gifts']),
    ('Bills','receipt', ARRAY['Mobile','Insurance','Subscriptions']),
    ('Entertainment','clapperboard', ARRAY['Movies','Games','Streaming','Events']),
    ('Education','graduation-cap', ARRAY['Courses','Books','College','Supplies']),
    ('Health','heart-pulse', ARRAY['Medicine','Doctor','Gym']),
    ('Other','circle-ellipsis', ARRAY['Miscellaneous'])
  ) AS t(nm, ic, subs) LOOP
    INSERT INTO categories(user_id,name,icon,kind) VALUES (uid, rec.nm, rec.ic, 'expense') RETURNING id INTO pid;
    FOREACH s IN ARRAY rec.subs LOOP
      INSERT INTO categories(user_id,name,parent_id,icon,kind) VALUES (uid, s, pid, rec.ic, 'expense');
    END LOOP;
  END LOOP;

  INSERT INTO categories(user_id,name,icon,kind) VALUES (uid,'Salary','briefcase','income') RETURNING id INTO cat_salary;
  INSERT INTO categories(user_id,name,icon,kind) VALUES (uid,'Freelance','laptop','income') RETURNING id INTO cat_free;
  INSERT INTO categories(user_id,name,icon,kind) VALUES (uid,'Interest','piggy-bank','income');
  INSERT INTO categories(user_id,name,icon,kind) VALUES (uid,'Other Income','circle-plus','income');

  SELECT id INTO cat_food FROM categories WHERE user_id=uid AND name='Food' AND parent_id IS NULL;
  SELECT id INTO cat_trans FROM categories WHERE user_id=uid AND name='Transportation' AND parent_id IS NULL;
  SELECT id INTO cat_house FROM categories WHERE user_id=uid AND name='Housing' AND parent_id IS NULL;
  SELECT id INTO cat_shop FROM categories WHERE user_id=uid AND name='Shopping' AND parent_id IS NULL;
  SELECT id INTO cat_ent FROM categories WHERE user_id=uid AND name='Entertainment' AND parent_id IS NULL;
  SELECT id INTO sub_rent FROM categories WHERE user_id=uid AND name='Rent' AND parent_id=cat_house;

  -- daily expenses for the last ~5 months
  FOR d IN SELECT generate_series(current_date - INTERVAL '150 days', current_date, INTERVAL '1 day')::date LOOP
    n := 1 + floor(random()*3);
    FOR i IN 1..n LOOP
      SELECT c.id, c.name, p.name INTO c_id, c_name, p_name
      FROM categories c JOIN categories p ON p.id = c.parent_id
      WHERE c.user_id = uid AND c.kind = 'expense' AND p.name <> 'Housing'
      ORDER BY random() LIMIT 1;
      amt := CASE p_name
        WHEN 'Food' THEN 120 + random()*1200
        WHEN 'Transportation' THEN 60 + random()*900
        WHEN 'Shopping' THEN 400 + random()*3500
        WHEN 'Entertainment' THEN 150 + random()*1200
        WHEN 'Education' THEN 300 + random()*2500
        WHEN 'Health' THEN 200 + random()*1800
        WHEN 'Bills' THEN 200 + random()*1200
        ELSE 100 + random()*800 END;
      acc := accs[1 + floor(random()*4)];
      INSERT INTO transactions(user_id,account_id,category_id,amount,type,date,description)
      VALUES (uid, acc, c_id, round(amt,2), 'expense', d, '[Demo] ' || c_name);
    END LOOP;

    IF EXTRACT(day FROM d) = 1 THEN
      INSERT INTO transactions(user_id,account_id,category_id,amount,type,date,description)
      VALUES (uid, a_hdfc, cat_salary, 78000, 'income', d, '[Demo] Monthly salary');
      INSERT INTO transactions(user_id,account_id,category_id,amount,type,date,description)
      VALUES (uid, a_hdfc, sub_rent, 15000, 'expense', d, '[Demo] House rent');
      INSERT INTO transactions(user_id,account_id,transfer_account_id,amount,type,date,description)
      VALUES (uid, a_hdfc, a_cash, 6000, 'transfer', d, '[Demo] ATM withdrawal');
      INSERT INTO transactions(user_id,account_id,transfer_account_id,amount,type,date,description)
      VALUES (uid, a_hdfc, a_gpay, 4000, 'transfer', d, '[Demo] Top up Google Pay');
    END IF;
    IF EXTRACT(day FROM d) = 5 THEN
      INSERT INTO transactions(user_id,account_id,category_id,amount,type,date,description)
      SELECT uid, a_hdfc, id, 2400, 'expense', d, '[Demo] Electricity bill' FROM categories WHERE user_id=uid AND name='Electricity' AND parent_id=cat_house;
      INSERT INTO transactions(user_id,account_id,category_id,amount,type,date,description)
      SELECT uid, a_hdfc, id, 999, 'expense', d, '[Demo] Internet bill' FROM categories WHERE user_id=uid AND name='Internet' AND parent_id=cat_house;
    END IF;
    IF EXTRACT(day FROM d) = 18 THEN
      INSERT INTO transactions(user_id,account_id,category_id,amount,type,date,description)
      VALUES (uid, a_hdfc, cat_free, round((8000 + random()*12000)::numeric,2), 'income', d, '[Demo] Freelance project');
    END IF;
  END LOOP;

  -- budgets
  INSERT INTO budgets(user_id,category_id,amount,period,start_date) VALUES
    (uid, NULL, 42000, 'monthly', date_trunc('month', current_date)::date),
    (uid, cat_food, 9000, 'monthly', date_trunc('month', current_date)::date),
    (uid, cat_trans, 5000, 'monthly', date_trunc('month', current_date)::date),
    (uid, cat_shop, 8000, 'monthly', date_trunc('month', current_date)::date),
    (uid, cat_ent, 3000, 'monthly', date_trunc('month', current_date)::date),
    (uid, cat_food, 2200, 'weekly', date_trunc('week', current_date)::date);

  -- recurring
  INSERT INTO recurring_transactions(user_id,account_id,category_id,amount,type,description,frequency,start_date,next_occurrence)
  VALUES (uid, a_hdfc, cat_salary, 78000, 'income', 'Salary', 'monthly', current_date - 150, (date_trunc('month', current_date) + INTERVAL '1 month')::date);
  INSERT INTO recurring_transactions(user_id,account_id,category_id,amount,type,description,frequency,start_date,next_occurrence)
  VALUES (uid, a_hdfc, sub_rent, 15000, 'expense', 'Rent', 'monthly', current_date - 150, (date_trunc('month', current_date) + INTERVAL '1 month')::date);
  INSERT INTO recurring_transactions(user_id,account_id,category_id,amount,type,description,frequency,start_date,next_occurrence)
  SELECT uid, a_card, id, 649, 'expense', 'Netflix', 'monthly', current_date - 120, current_date + 3 FROM categories WHERE user_id=uid AND name='Streaming' AND parent_id=cat_ent;
  INSERT INTO recurring_transactions(user_id,account_id,category_id,amount,type,description,frequency,start_date,next_occurrence)
  SELECT uid, a_card, id, 149, 'expense', 'Spotify', 'monthly', current_date - 120, current_date + 6 FROM categories WHERE user_id=uid AND name='Streaming' AND parent_id=cat_ent;
  INSERT INTO recurring_transactions(user_id,account_id,category_id,amount,type,description,frequency,start_date,next_occurrence)
  SELECT uid, a_hdfc, id, 999, 'expense', 'Internet bill', 'monthly', current_date - 150, current_date + 9 FROM categories WHERE user_id=uid AND name='Internet' AND parent_id=cat_house;
  INSERT INTO recurring_transactions(user_id,account_id,category_id,amount,type,description,frequency,start_date,next_occurrence)
  SELECT uid, a_cash, id, 1200, 'expense', 'Gym membership', 'monthly', current_date - 150, current_date + 12 FROM categories WHERE user_id=uid AND name='Gym';
END;
$fn$;

REVOKE ALL ON FUNCTION public.seed_demo_data() FROM public;
GRANT EXECUTE ON FUNCTION public.seed_demo_data() TO authenticated;
