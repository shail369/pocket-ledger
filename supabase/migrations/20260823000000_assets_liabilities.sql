-- Manual assets and liabilities for the Pocket Ledger balance sheet.
CREATE TABLE IF NOT EXISTS public.assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL, category text NOT NULL CHECK (category IN ('stocks','mutual_funds','property','precious_metals','other')),
  value numeric(14,2) NOT NULL CHECK (value >= 0), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS assets_user_category_idx ON public.assets(user_id, category);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assets TO authenticated; GRANT ALL ON public.assets TO service_role;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own assets" ON public.assets;
CREATE POLICY "own assets" ON public.assets FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.liabilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL, category text NOT NULL CHECK (category IN ('loans','credit_cards','other')),
  value numeric(14,2) NOT NULL CHECK (value >= 0), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS liabilities_user_category_idx ON public.liabilities(user_id, category);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.liabilities TO authenticated; GRANT ALL ON public.liabilities TO service_role;
ALTER TABLE public.liabilities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own liabilities" ON public.liabilities;
CREATE POLICY "own liabilities" ON public.liabilities FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.touch_balance_sheet_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS assets_updated_at ON public.assets;
CREATE TRIGGER assets_updated_at BEFORE UPDATE ON public.assets FOR EACH ROW EXECUTE FUNCTION public.touch_balance_sheet_updated_at();
DROP TRIGGER IF EXISTS liabilities_updated_at ON public.liabilities;
CREATE TRIGGER liabilities_updated_at BEFORE UPDATE ON public.liabilities FOR EACH ROW EXECUTE FUNCTION public.touch_balance_sheet_updated_at();
