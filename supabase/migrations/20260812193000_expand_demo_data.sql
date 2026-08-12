CREATE OR REPLACE FUNCTION public.expand_demo_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  uid uuid := auth.uid();
  first_demo date;
  d date;
  i int;
  n int;
  c_id uuid;
  c_name text;
  p_name text;
  amt numeric;
  acc uuid;
  accs uuid[];
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT min(date) INTO first_demo
  FROM transactions
  WHERE user_id = uid AND description LIKE '[Demo]%';

  -- Only expand accounts that already contain the app's demo dataset.
  -- This keeps real user accounts untouched.
  IF first_demo IS NULL OR first_demo <= current_date - INTERVAL '300 days' THEN RETURN; END IF;

  SELECT array_agg(id ORDER BY created_at) INTO accs FROM accounts WHERE user_id = uid AND is_active;
  IF accs IS NULL OR array_length(accs, 1) = 0 THEN RETURN; END IF;

  -- Add roughly 7 more months before the existing demo history,
  -- taking the sample dataset to about one year of activity.
  FOR d IN SELECT generate_series(first_demo - INTERVAL '215 days', first_demo - INTERVAL '1 day', INTERVAL '1 day')::date LOOP
    n := 2 + floor(random() * 3);
    FOR i IN 1..n LOOP
      SELECT c.id, c.name, p.name INTO c_id, c_name, p_name
      FROM categories c
      JOIN categories p ON p.id = c.parent_id
      WHERE c.user_id = uid AND c.kind = 'expense'
      ORDER BY random()
      LIMIT 1;

      amt := CASE p_name
        WHEN 'Food' THEN 120 + random() * 1200
        WHEN 'Transportation' THEN 60 + random() * 900
        WHEN 'Shopping' THEN 400 + random() * 3500
        WHEN 'Entertainment' THEN 150 + random() * 1200
        WHEN 'Education' THEN 300 + random() * 2500
        WHEN 'Health' THEN 200 + random() * 1800
        WHEN 'Bills' THEN 200 + random() * 1200
        ELSE 100 + random() * 800
      END;

      acc := accs[1 + floor(random() * array_length(accs, 1))];
      INSERT INTO transactions(user_id, account_id, category_id, amount, type, date, description)
      VALUES (uid, acc, c_id, round(amt, 2), 'expense', d, '[Demo] Historical ' || c_name);
    END LOOP;

    IF EXTRACT(day FROM d) = 1 THEN
      INSERT INTO transactions(user_id, account_id, category_id, amount, type, date, description)
      SELECT uid, accs[1], id, 78000, 'income', d, '[Demo] Historical salary'
      FROM categories WHERE user_id = uid AND name = 'Salary' AND kind = 'income';
    END IF;
  END LOOP;
END;
$fn$;

REVOKE ALL ON FUNCTION public.expand_demo_data() FROM public;
GRANT EXECUTE ON FUNCTION public.expand_demo_data() TO authenticated;
