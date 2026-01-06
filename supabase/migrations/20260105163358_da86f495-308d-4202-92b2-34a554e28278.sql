-- Ensure the role bootstrap can safely insert without duplicates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'user_roles_user_id_role_key'
      AND conrelid = 'public.user_roles'::regclass
  ) THEN
    ALTER TABLE public.user_roles
      ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);
  END IF;
END $$;

-- Create a safe bootstrap function for authenticated users.
-- It ensures the user has:
-- 1) a profiles row
-- 2) a 'member' role row (without allowing role escalation)
CREATE OR REPLACE FUNCTION public.ensure_user_bootstrap(_full_name text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
BEGIN
  v_uid := auth.uid();

  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Ensure profile exists
  INSERT INTO public.profiles (id, full_name)
  VALUES (v_uid, COALESCE(_full_name, 'Membro'))
  ON CONFLICT (id) DO NOTHING;

  -- Ensure the user is at least a member (no admin escalation here)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_uid, 'member')
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_user_bootstrap(text) TO authenticated;
