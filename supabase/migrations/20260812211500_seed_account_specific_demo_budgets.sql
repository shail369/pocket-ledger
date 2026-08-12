-- Replace the original demo budgets with account-specific budgets and
-- current-period transactions so account scoping can be verified reliably.
CREATE OR REPLACE FUNCTION public.seed_account_specific_demo_budgets()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  uid uuid := auth.uid();
  acc_hdfc uuid;
  acc_cash uuid;
  acc_gpay uuid;
  acc_card uuid;
  cat_food uuid;
  cat_trans uuid;
  cat_shop uuid;
  cat_ent uuid;
  sub_rest uuid;
  sub_fuel uuid;
  sub_electronics uuid;
  sub_movies uuid;
  marker text := '[Demo Budget Test]';
  month_start date := date_trunc('month', current_date)::date;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  IF NOT EXISTS (SELECT 1 FROM transactions WHERE user_id = uid AND description LIKE '[Demo]%') THEN
    RETURN;
  END IF;

  -- Once the test dataset exists, leave it alone so refreshes do not reset it.
  IF EXISTS (SELECT 1 FROM transactions WHERE user_id = uid AND description LIKE marker || '%') THEN
    RETURN;
  END IF;

  SELECT id INTO acc_hdfc FROM accounts WHERE user_id = uid AND name = 'HDFC Savings' ORDER BY created_at LIMIT 1;
  SELECT id INTO acc_cash FROM accounts WHERE user_id = uid AND name = 'Cash' ORDER BY created_at LIMIT 1;
  SELECT id INTO acc_gpay FROM accounts WHERE user_id = uid AND name = 'Google Pay' ORDER BY created_at LIMIT 1;
  SELECT id INTO acc_card FROM accounts WHERE user_id = uid AND name = 'ICICI Credit Card' ORDER BY created_at LIMIT 1;

  SELECT id INTO cat_food FROM categories WHERE user_id = uid AND name = 'Food' AND parent_id IS NULL LIMIT 1;
  SELECT id INTO cat_trans FROM categories WHERE user_id = uid AND name = 'Transportation' AND parent_id IS NULL LIMIT 1;
  SELECT id INTO cat_shop FROM categories WHERE user_id = uid AND name = 'Shopping' AND parent_id IS NULL LIMIT 1;
  SELECT id INTO cat_ent FROM categories WHERE user_id = uid AND name = 'Entertainment' AND parent_id IS NULL LIMIT 1;
  SELECT id INTO sub_rest FROM categories WHERE user_id = uid AND name = 'Restaurants' AND parent_id = cat_food LIMIT 1;
  SELECT id INTO sub_fuel FROM categories WHERE user_id = uid AND name = 'Fuel' AND parent_id = cat_trans LIMIT 1;
  SELECT id INTO sub_electronics FROM categories WHERE user_id = uid AND name = 'Electronics' AND parent_id = cat_shop LIMIT 1;
  SELECT id INTO sub_movies FROM categories WHERE user_id = uid AND name = 'Movies' AND parent_id = cat_ent LIMIT 1;

  IF acc_hdfc IS NULL OR acc_cash IS NULL OR acc_gpay IS NULL OR acc_card IS NULL THEN RETURN; END IF;

  -- Remove only the old account-less budgets left by the original demo seed.
  DELETE FROM budgets WHERE user_id = uid AND account_id IS NULL;

  -- HDFC: Food + Transportation, both with matching current-month activity.
  INSERT INTO budgets(user_id, category_id, account_id, amount, period, start_date)
  VALUES
    (uid, cat_food, acc_hdfc, 9000, 'monthly', month_start),
    (uid, cat_trans, acc_hdfc, 5000, 'monthly', month_start);

  INSERT INTO transactions(user_id, account_id, category_id, amount, type, date, description)
  VALUES
    (uid, acc_hdfc, sub_rest, 1250, 'expense', current_date - 2, marker || ' HDFC restaurant'),
    (uid, acc_hdfc, sub_rest, 780, 'expense', current_date - 6, marker || ' HDFC groceries'),
    (uid, acc_hdfc, sub_fuel, 1600, 'expense', current_date - 4, marker || ' HDFC fuel'),
    (uid, acc_hdfc, sub_fuel, 900, 'expense', current_date - 9, marker || ' HDFC transport');

  -- Cash: Shopping + weekly Food, with different categories and amounts.
  INSERT INTO budgets(user_id, category_id, account_id, amount, period, start_date)
  VALUES
    (uid, cat_shop, acc_cash, 7000, 'monthly', month_start),
    (uid, cat_food, acc_cash, 2200, 'weekly', date_trunc('week', current_date)::date);

  INSERT INTO transactions(user_id, account_id, category_id, amount, type, date, description)
  VALUES
    (uid, acc_cash, sub_electronics, 2400, 'expense', current_date - 3, marker || ' Cash electronics'),
    (uid, acc_cash, sub_electronics, 950, 'expense', current_date - 8, marker || ' Cash household'),
    (uid, acc_cash, sub_rest, 620, 'expense', current_date - 1, marker || ' Cash food'),
    (uid, acc_cash, sub_rest, 480, 'expense', current_date - 5, marker || ' Cash food');

  -- Google Pay: Entertainment, with its own separate budget and activity.
  INSERT INTO budgets(user_id, category_id, account_id, amount, period, start_date)
  VALUES (uid, cat_ent, acc_gpay, 3000, 'monthly', month_start);

  INSERT INTO transactions(user_id, account_id, category_id, amount, type, date, description)
  VALUES
    (uid, acc_gpay, sub_movies, 550, 'expense', current_date - 2, marker || ' GPay movie'),
    (uid, acc_gpay, sub_movies, 420, 'expense', current_date - 10, marker || ' GPay entertainment');

  -- Credit card: Shopping + Entertainment, demonstrating multiple budgets on another account.
  INSERT INTO budgets(user_id, category_id, account_id, amount, period, start_date)
  VALUES
    (uid, cat_shop, acc_card, 12000, 'monthly', month_start),
    (uid, cat_ent, acc_card, 4500, 'monthly', month_start);

  INSERT INTO transactions(user_id, account_id, category_id, amount, type, date, description)
  VALUES
    (uid, acc_card, sub_electronics, 3200, 'expense', current_date - 3, marker || ' Card electronics'),
    (uid, acc_card, sub_electronics, 1800, 'expense', current_date - 12, marker || ' Card shopping'),
    (uid, acc_card, sub_movies, 900, 'expense', current_date - 5, marker || ' Card movie'),
    (uid, acc_card, sub_movies, 650, 'expense', current_date - 11, marker || ' Card entertainment');
END;
$fn$;

REVOKE ALL ON FUNCTION public.seed_account_specific_demo_budgets() FROM public;
GRANT EXECUTE ON FUNCTION public.seed_account_specific_demo_budgets() TO authenticated;
