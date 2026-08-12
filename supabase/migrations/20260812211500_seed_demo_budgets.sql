CREATE OR REPLACE FUNCTION public.seed_demo_budgets()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  uid uuid := auth.uid();
  accs uuid[];
  a1 uuid;
  a2 uuid;
  food uuid;
  shopping uuid;
  transport uuid;
  entertainment uuid;
  today date := current_date;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT array_agg(id ORDER BY created_at) INTO accs
  FROM accounts WHERE user_id = uid AND is_active;
  IF accs IS NULL OR array_length(accs, 1) < 2 THEN RETURN; END IF;

  a1 := accs[1];
  a2 := accs[2];

  SELECT id INTO food FROM categories WHERE user_id = uid AND name = 'Food' AND parent_id IS NULL LIMIT 1;
  SELECT id INTO shopping FROM categories WHERE user_id = uid AND name = 'Shopping' AND parent_id IS NULL LIMIT 1;
  SELECT id INTO transport FROM categories WHERE user_id = uid AND name = 'Transportation' AND parent_id IS NULL LIMIT 1;
  SELECT id INTO entertainment FROM categories WHERE user_id = uid AND name = 'Entertainment' AND parent_id IS NULL LIMIT 1;

  IF food IS NULL OR shopping IS NULL OR transport IS NULL OR entertainment IS NULL THEN RETURN; END IF;

  -- Idempotent demo budgets. Each account gets different category budgets.
  INSERT INTO budgets(user_id, account_id, category_id, amount, period)
  SELECT uid, a1, food, 18000, 'monthly'
  WHERE NOT EXISTS (SELECT 1 FROM budgets WHERE user_id = uid AND account_id = a1 AND category_id = food AND period = 'monthly');

  INSERT INTO budgets(user_id, account_id, category_id, amount, period)
  SELECT uid, a1, transport, 9000, 'monthly'
  WHERE NOT EXISTS (SELECT 1 FROM budgets WHERE user_id = uid AND account_id = a1 AND category_id = transport AND period = 'monthly');

  INSERT INTO budgets(user_id, account_id, category_id, amount, period)
  SELECT uid, a2, shopping, 25000, 'monthly'
  WHERE NOT EXISTS (SELECT 1 FROM budgets WHERE user_id = uid AND account_id = a2 AND category_id = shopping AND period = 'monthly');

  INSERT INTO budgets(user_id, account_id, category_id, amount, period)
  SELECT uid, a2, entertainment, 10000, 'weekly'
  WHERE NOT EXISTS (SELECT 1 FROM budgets WHERE user_id = uid AND account_id = a2 AND category_id = entertainment AND period = 'weekly');

  -- Ensure every demo budget has transactions in the same account/category this month.
  IF NOT EXISTS (SELECT 1 FROM transactions WHERE user_id = uid AND description = '[Demo Budget] Food' AND account_id = a1) THEN
    INSERT INTO transactions(user_id, account_id, category_id, amount, type, date, description) VALUES
      (uid, a1, food, 3200, 'expense', today - 18, '[Demo Budget] Food'),
      (uid, a1, food, 1450, 'expense', today - 11, '[Demo Budget] Food'),
      (uid, a1, food, 2800, 'expense', today - 4, '[Demo Budget] Food'),
      (uid, a1, transport, 1800, 'expense', today - 15, '[Demo Budget] Transport'),
      (uid, a1, transport, 1250, 'expense', today - 7, '[Demo Budget] Transport');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM transactions WHERE user_id = uid AND description = '[Demo Budget] Shopping' AND account_id = a2) THEN
    INSERT INTO transactions(user_id, account_id, category_id, amount, type, date, description) VALUES
      (uid, a2, shopping, 7200, 'expense', today - 20, '[Demo Budget] Shopping'),
      (uid, a2, shopping, 4300, 'expense', today - 9, '[Demo Budget] Shopping'),
      (uid, a2, entertainment, 2100, 'expense', today - 5, '[Demo Budget] Entertainment'),
      (uid, a2, entertainment, 1650, 'expense', today - 2, '[Demo Budget] Entertainment');
  END IF;
END;
$fn$;

REVOKE ALL ON FUNCTION public.seed_demo_budgets() FROM public;
GRANT EXECUTE ON FUNCTION public.seed_demo_budgets() TO authenticated;
