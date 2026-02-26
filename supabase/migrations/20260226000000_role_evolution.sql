-- Story 2.3: Auth Security & Role Types
-- Cria enum role_type e migra dados de 'user' para 'editor'

-- ===== STEP 1: Create role_type ENUM (idempotent via DO block) =====
DO $$ BEGIN
  CREATE TYPE public.role_type AS ENUM ('admin', 'editor', 'viewer');
EXCEPTION
  WHEN DUPLICATE_OBJECT THEN NULL;
END $$;

-- ===== STEP 2: Alter profiles.role to use the new ENUM type =====
-- This uses a USING clause to safely cast the existing values
DO $$ BEGIN
  ALTER TABLE public.profiles
    ALTER COLUMN role TYPE public.role_type USING role::text::public.role_type;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- ===== STEP 3: Data migration - convert 'user' to 'editor' =====
UPDATE public.profiles
SET role = 'editor'::public.role_type
WHERE role = 'user';

-- Verify migration
-- SELECT id, role FROM public.profiles LIMIT 10;
