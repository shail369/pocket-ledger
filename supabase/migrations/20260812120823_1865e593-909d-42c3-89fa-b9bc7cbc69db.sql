
ALTER FUNCTION public.seed_demo_data() SECURITY INVOKER;
REVOKE ALL ON FUNCTION public.seed_demo_data() FROM anon;
GRANT EXECUTE ON FUNCTION public.seed_demo_data() TO authenticated;
