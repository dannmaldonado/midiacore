-- Schema Evolution — Story 1.1
-- Adiciona campos faltantes e cria tabela approval_workflows
-- Idempotente: usa ADD COLUMN IF NOT EXISTS e CREATE TABLE IF NOT EXISTS

-- ==========================================
-- 1. CONTRACTS — novos campos
-- ==========================================

ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS negotiation       TEXT,
  ADD COLUMN IF NOT EXISTS media_properties  TEXT[],
  ADD COLUMN IF NOT EXISTS contract_docs     TEXT,
  ADD COLUMN IF NOT EXISTS layouts_url       TEXT,
  ADD COLUMN IF NOT EXISTS pending_quotes    TEXT,
  ADD COLUMN IF NOT EXISTS comments          TEXT;

-- ==========================================
-- 2. OPPORTUNITIES — novos campos
-- ==========================================

ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS frequency         TEXT,
  ADD COLUMN IF NOT EXISTS social_media_plan TEXT,
  ADD COLUMN IF NOT EXISTS new_media_target  TEXT,
  ADD COLUMN IF NOT EXISTS events_plan       TEXT;

-- ==========================================
-- 3. CONTACTS — novos campos
-- ==========================================

ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS contact_type  TEXT,
  ADD COLUMN IF NOT EXISTS shopping_name TEXT;

-- CHECK constraint para contact_type (idempotente via DO block)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'contacts_contact_type_check'
      AND table_name = 'contacts'
  ) THEN
    ALTER TABLE public.contacts
      ADD CONSTRAINT contacts_contact_type_check
      CHECK (contact_type IN ('store_manager', 'shopping_mkt'));
  END IF;
END $$;

-- ==========================================
-- 4. APPROVAL_WORKFLOWS — nova tabela
-- ==========================================

CREATE TABLE IF NOT EXISTS public.approval_workflows (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id  UUID        NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  current_step TEXT        NOT NULL,
  step_status  TEXT        NOT NULL CHECK (step_status IN ('pending', 'approved', 'rejected', 'skipped')),
  assigned_to  UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  deadline     DATE,
  completed_at TIMESTAMPTZ,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.approval_workflows ENABLE ROW LEVEL SECURITY;

-- RLS Policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'approval_workflows'
      AND policyname = 'Company dynamic access for approval_workflows'
  ) THEN
    CREATE POLICY "Company dynamic access for approval_workflows"
    ON public.approval_workflows FOR ALL
    USING (
      contract_id IN (
        SELECT id FROM public.contracts
        WHERE company_id = public.get_my_company_id()
      )
    )
    WITH CHECK (
      contract_id IN (
        SELECT id FROM public.contracts
        WHERE company_id = public.get_my_company_id()
      )
    );
  END IF;
END $$;
