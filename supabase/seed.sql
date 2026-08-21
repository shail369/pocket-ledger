-- Pocket Ledger seed data.
-- Categories only. No accounts, transactions, budgets, or recurring data.
--
-- This file is intentionally safe for a fresh local/dev database. The
-- application also exposes the same idempotent category seeding function
-- for authenticated users.

DO $$
DECLARE
  uid uuid;
BEGIN
  -- No authenticated user exists in a normal local reset, so there is no
  -- user-specific category row to seed here. Category rows are created by
  -- public.seed_demo_data() after authentication.
  SELECT NULL::uuid INTO uid;
END;
$$;
