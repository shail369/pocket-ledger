-- Remove legacy demo/test RPCs that are no longer used.
-- Historical migrations are intentionally preserved.

DROP FUNCTION IF EXISTS public.expand_demo_data();
DROP FUNCTION IF EXISTS public.seed_demo_budgets();
DROP FUNCTION IF EXISTS public.seed_account_specific_demo_budgets();
