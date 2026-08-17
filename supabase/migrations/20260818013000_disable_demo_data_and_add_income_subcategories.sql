-- Keep the signup seed hook usable, but replace the old demo dataset with a clean starter dataset.
-- New users get accounts/categories only. No demo transactions, budgets or recurring entries are created.
CREATE OR REPLACE FUNCTION public.seed_demo_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  uid uuid := auth.uid();
  primary_account uuid;
  parent_id uuid;
  sub_name text;
  expense record;
  income record;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  -- Preserve existing users and any accounts they already created.
  IF EXISTS (SELECT 1 FROM accounts WHERE user_id = uid) THEN RETURN; END IF;

  INSERT INTO accounts(user_id, name, type, opening_balance, icon, color)
  VALUES (uid, 'Main Account', 'bank', 0, 'wallet', '#2563eb')
  RETURNING id INTO primary_account;

  FOR expense IN SELECT * FROM (VALUES
    ('Food','utensils', ARRAY['Groceries','Restaurants','Fast Food','Delivery','Cafes']),
    ('Transportation','car', ARRAY['Fuel','Public Transport','Taxi/Ride Sharing','Parking','Maintenance']),
    ('Housing','home', ARRAY['Rent','Electricity','Water','Internet','Maintenance']),
    ('Shopping','shopping-bag', ARRAY['Clothing','Electronics','Household','Gifts']),
    ('Bills','receipt', ARRAY['Mobile','Insurance','Subscriptions']),
    ('Entertainment','clapperboard', ARRAY['Movies','Games','Streaming','Events']),
    ('Education','graduation-cap', ARRAY['Courses','Books','College','Supplies']),
    ('Health','heart-pulse', ARRAY['Medicine','Doctor','Gym']),
    ('Other','circle-ellipsis', ARRAY['Miscellaneous'])
  ) AS t(name, icon, subs) LOOP
    INSERT INTO categories(user_id, name, icon, kind)
    VALUES (uid, expense.name, expense.icon, 'expense')
    RETURNING id INTO parent_id;

    FOREACH sub_name IN ARRAY expense.subs LOOP
      INSERT INTO categories(user_id, name, parent_id, icon, kind)
      VALUES (uid, sub_name, parent_id, expense.icon, 'expense');
    END LOOP;
  END LOOP;

  FOR income IN SELECT * FROM (VALUES
    ('Salary','briefcase', ARRAY['Base Salary','Bonus','Overtime']),
    ('Freelance','laptop', ARRAY['Projects','Consulting','Other Freelance']),
    ('Interest','piggy-bank', ARRAY['Bank Interest','Investment Interest']),
    ('Other Income','circle-plus', ARRAY['Cashback','Gifts','Refunds','Other'])
  ) AS t(name, icon, subs) LOOP
    INSERT INTO categories(user_id, name, icon, kind)
    VALUES (uid, income.name, income.icon, 'income')
    RETURNING id INTO parent_id;

    FOREACH sub_name IN ARRAY income.subs LOOP
      INSERT INTO categories(user_id, name, parent_id, icon, kind)
      VALUES (uid, sub_name, parent_id, income.icon, 'income');
    END LOOP;
  END LOOP;
END;
$fn$;

REVOKE ALL ON FUNCTION public.seed_demo_data() FROM public;
REVOKE ALL ON FUNCTION public.seed_demo_data() FROM anon;
GRANT EXECUTE ON FUNCTION public.seed_demo_data() TO authenticated;

-- Existing users already have the old top-level income categories. Add useful
-- income subcategories without touching their existing transactions.
DO $migration$
DECLARE
  u record;
  parent_id uuid;
  item record;
BEGIN
  FOR u IN SELECT DISTINCT user_id FROM categories WHERE kind = 'income' LOOP
    FOR item IN SELECT * FROM (VALUES
      ('Salary', ARRAY['Base Salary','Bonus','Overtime']),
      ('Freelance', ARRAY['Projects','Consulting','Other Freelance']),
      ('Interest', ARRAY['Bank Interest','Investment Interest']),
      ('Other Income', ARRAY['Cashback','Gifts','Refunds','Other'])
    ) AS t(parent_name, subs) LOOP
      SELECT id INTO parent_id
      FROM categories
      WHERE user_id = u.user_id
        AND name = item.parent_name
        AND kind = 'income'
        AND parent_id IS NULL
      LIMIT 1;

      IF parent_id IS NOT NULL THEN
        FOR sub_name IN SELECT unnest(item.subs) LOOP
          INSERT INTO categories(user_id, name, parent_id, icon, kind)
          SELECT u.user_id, sub_name, parent_id, p.icon, 'income'
          FROM categories p
          WHERE p.id = parent_id
            AND NOT EXISTS (
              SELECT 1 FROM categories c
              WHERE c.user_id = u.user_id
                AND c.name = sub_name
                AND c.parent_id = parent_id
                AND c.kind = 'income'
            );
        END LOOP;
      END IF;
    END LOOP;
  END LOOP;
END;
$migration$;

-- These functions only operate on an already-existing demo dataset, so they
-- cannot create demo data for a clean new account. Keep them available for
-- controlled testing of accounts that intentionally contain [Demo] records.
