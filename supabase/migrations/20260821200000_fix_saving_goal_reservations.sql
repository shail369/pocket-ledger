ALTER TABLE public.saving_goal_contributions
  DROP COLUMN IF EXISTS transaction_id;

CREATE INDEX IF NOT EXISTS saving_goal_contributions_account_goal_idx
  ON public.saving_goal_contributions(account_id, goal_id);

CREATE OR REPLACE FUNCTION public.validate_saving_goal_contribution()
RETURNS trigger
LANGUAGE plpgsql
AS $fn$
DECLARE
  account_balance numeric(14,2);
  reserved_amount numeric(14,2);
  goal_saved numeric(14,2);
  goal_target numeric(14,2);
BEGIN
  SELECT opening_balance
    INTO account_balance
    FROM public.accounts
   WHERE id = NEW.account_id;

  IF account_balance IS NULL THEN
    RAISE EXCEPTION 'Account not found';
  END IF;

  SELECT account_balance
    + COALESCE(SUM(CASE WHEN t.type = 'income' AND t.account_id = NEW.account_id THEN t.amount ELSE 0 END), 0)
    - COALESCE(SUM(CASE WHEN t.type = 'expense' AND t.account_id = NEW.account_id THEN t.amount ELSE 0 END), 0)
    - COALESCE(SUM(CASE WHEN t.type = 'transfer' AND t.account_id = NEW.account_id THEN t.amount ELSE 0 END), 0)
    + COALESCE(SUM(CASE WHEN t.type = 'transfer' AND t.transfer_account_id = NEW.account_id THEN t.amount ELSE 0 END), 0)
    INTO account_balance
    FROM public.transactions t;

  SELECT COALESCE(SUM(amount), 0)
    INTO reserved_amount
    FROM public.saving_goal_contributions
   WHERE account_id = NEW.account_id
     AND id <> NEW.id;

  IF reserved_amount + NEW.amount > account_balance THEN
    RAISE EXCEPTION 'Contribution exceeds the account available balance';
  END IF;

  SELECT target_amount INTO goal_target FROM public.saving_goals WHERE id = NEW.goal_id;
  IF goal_target IS NULL THEN
    RAISE EXCEPTION 'Saving goal not found';
  END IF;

  SELECT COALESCE(SUM(amount), 0)
    INTO goal_saved
    FROM public.saving_goal_contributions
   WHERE goal_id = NEW.goal_id
     AND id <> NEW.id;

  IF goal_saved + NEW.amount > goal_target THEN
    RAISE EXCEPTION 'Contribution exceeds the saving goal target';
  END IF;

  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS validate_saving_goal_contribution ON public.saving_goal_contributions;
CREATE TRIGGER validate_saving_goal_contribution
BEFORE INSERT OR UPDATE ON public.saving_goal_contributions
FOR EACH ROW EXECUTE FUNCTION public.validate_saving_goal_contribution();
